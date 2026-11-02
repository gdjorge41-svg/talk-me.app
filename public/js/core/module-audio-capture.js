/**
 * 🎙️ AudioCapture - Pipeline de captura y procesamiento de audio
 * 
 * Propósito: Encapsular la lógica de AudioWorklet, VAD, Vosk y streaming en tiempo real.
 */

import {
    downsampleBuffer,
    float32ToInt16,
    concatenateFloat32Arrays,
    pcmToWav
} from './module-audio-utils.js';

class AudioCapture {
    constructor(audioState, domManager) {
        this.audio = audioState;
        this.dom = domManager;
        this.VOSK_CHUNK_SIZE = 4000; // ~0.25s a 16kHz
        this.BROWSER_STREAM_CHUNK_SIZE = 4000; // ~0.25s a 16kHz
        this.PRE_ROLL_MAX_CHUNKS = 4; // ~1s

        // Estado local de streaming


        this.browserStreamBuffer = [];
        this.browserStreamSamples = 0;
        this.browserStreamChunksSent = 0;
        this.streamingPreRoll = [];
        this.currentStreamSeq = 0n; // Usar BigInt

        // Nodos activos para limpieza
        this.activeSource = null;
        this.activeSplitter = null;
        this.activeWorkletNode = null;

        // --- 🚀 VARIABLES DE ALTA FRECUENCIA (LOCALES) ---
        // Movidas aquí según FASE 6 para evitar saturar AudioStateManager
        this.pcmChunks = [];
        this.voskSendBuffer = [];
        this.voskSendSamples = 0;

        // --- 🛡️ ARQUITECTURA VAD INDUSTRIAL (FASE 1) ---
        this.noiseFloor = 0.0005;
        this.vadAlpha = 0.01;
        this.isVADActive = false;
        this.silenceStart = 0;
        this.VAD_HOLD_TIME = 750;
        this.streamStartEmitted = false; // Flag local robusto
        this.currentStreamSeq = 0n;

        this.smoothedRMS = 0; // Sincronización visual con UI
    }

    /**
     * Configura el pipeline de análisis de audio (Worklet + splitters).
     */
    async setupAudioAnalysis(stream) {
        if (!stream) return;

        const audioContext = window.audioContext; // Asumimos que ya existe o se inyecta
        if (!audioContext) return;
        this.audioContext = audioContext;

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        let analyser = this.audio.get('analyser');
        if (!analyser) {
            analyser = audioContext.createAnalyser();
            this.audio.setState({ analyser });
        }

        analyser.fftSize = 256;

        // Inyectar Worklet inline con protección de carrera y fallback a ScriptProcessor
        const hasWorkletSupport = !!(audioContext.audioWorklet && typeof audioContext.audioWorklet.addModule === 'function');
        let workletLoaded = false;

        if (hasWorkletSupport) {
            const workletKey = `_voskWorklet_promise_${audioContext.sampleRate}`;
            if (!window[workletKey]) {
                const workletCode = `
                    class VoskProcessor extends AudioWorkletProcessor {
                        process(inputs, outputs) {
                            const input = inputs[0];
                            if (input && input[0]) {
                                this.port.postMessage(input[0]);
                            }
                            return true;
                        }
                    }
                    try {
                        registerProcessor('vosk-processor', VoskProcessor);
                    } catch (e) {}
                `;
                const blob = new Blob([workletCode], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);

                window[workletKey] = audioContext.audioWorklet.addModule(url)
                    .then(() => {
                        console.log('✅ [AudioCapture] VoskWorklet cargado correctamente');
                        return true;
                    })
                    .catch(e => {
                        console.warn('⚠️ [AudioCapture] Worklet addModule falló. Conmutando a fallback:', e);
                        return false;
                    });
            }
            try {
                workletLoaded = await window[workletKey];
            } catch (e) {
                workletLoaded = false;
            }
        } else {
            console.warn('⚠️ [AudioCapture] AudioWorklet no disponible en este dispositivo. Usando ScriptProcessorNode (Legacy Tablet Fallback).');
        }

        // 🧹 LIMPIEZA DE NODOS PREVIOS (Evitar fugas y duplicidad de señales)
        if (this.activeWorkletNode) {
            try {
                if (this.activeWorkletNode.port) this.activeWorkletNode.port.onmessage = null;
                else this.activeWorkletNode.onaudioprocess = null;
                this.activeWorkletNode.disconnect();
            } catch (e) { }
        }
        if (this.activeSplitter) {
            try { this.activeSplitter.disconnect(); } catch (e) { }
        }
        if (this.activeSource) {
            try { this.activeSource.disconnect(); } catch (e) { }
        }

        const source = audioContext.createMediaStreamSource(stream);
        const track = stream.getAudioTracks()[0];
        const settings = track ? track.getSettings() : {};
        const realHardwareChannels = settings.channelCount || 1;

        // [v60.ELITE] Auto-Sanación Murphy (Self-Healing Runtime)
        // Si el localStorage almacenó una capacidad fantasma mayor a la realidad física de la tarjeta,
        // sanamos la caché inmediatamente y notificamos a la interfaz para podar canales fantasma.
        const currentDeviceId = this.audio.get('deviceId') || (track && track.getSettings && track.getSettings().deviceId);
        const deviceLabel = (track && track.label) || '';
        const isUltraDensity = /soundgrid|waves|dante|madi|digico|ravenna/i.test(deviceLabel);

        if (currentDeviceId && !isUltraDensity) {
            const cacheKey = `talkme_caps_${currentDeviceId}`;
            const cachedCaps = localStorage.getItem(cacheKey);
            if (cachedCaps && parseInt(cachedCaps, 10) > realHardwareChannels) {
                console.warn(`🧹 [AUDIO-HW] Murphy Self-Healing: Corrigiendo capacidad contaminada de ${cachedCaps} a ${realHardwareChannels} canales para ${deviceLabel || currentDeviceId}`);
                localStorage.setItem(cacheKey, realHardwareChannels);
                if (typeof window.updateChannelSelectors === 'function') {
                    window.updateChannelSelectors('input', currentDeviceId);
                }
            }
        }

        let selectedChannel = this.audio.get('inputChannel') || 0;

        console.log(`🔌 [AUDIO-HW] Pipeline: Hardware(${realHardwareChannels} ch) | Selección(Ch ${selectedChannel + 1}) | Worklet: ${workletLoaded}`);

        if (selectedChannel >= realHardwareChannels) {
            selectedChannel = 0;
            this.audio.setState({ inputChannel: 0 });
            const select = document.getElementById('audioDeviceChannelSelect');
            if (select) select.value = 0;
        }

        const splitterChannels = Math.max(realHardwareChannels, selectedChannel + 1, 2);
        const splitter = audioContext.createChannelSplitter(splitterChannels);
        source.connect(splitter);

        let audioProcessor = null;
        if (workletLoaded) {
            audioProcessor = new AudioWorkletNode(audioContext, 'vosk-processor');
            audioProcessor.port.onmessage = (event) => {
                if (!event.data || !event.data.length) return;
                this.processAudioChunk(event.data);
            };
        } else {
            // ScriptProcessorNode fallback para tablets antiguas y navegadores legacy
            audioProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            audioProcessor.onaudioprocess = (event) => {
                const inputBuffer = event.inputBuffer.getChannelData(0);
                if (inputBuffer && inputBuffer.length) {
                    this.processAudioChunk(new Float32Array(inputBuffer));
                }
            };
            // Conectar a ganancia silenciosa en destination para forzar el bombeo de eventos audio en WebKit/Blink
            try {
                const silentGain = audioContext.createGain();
                silentGain.gain.value = 0;
                audioProcessor.connect(silentGain);
                silentGain.connect(audioContext.destination);
            } catch (e) { }
        }

        this.activeSource = source;
        this.activeSplitter = splitter;
        this.activeWorkletNode = audioProcessor;

        this.audio.setState({ audioProcessor });

        try {
            splitter.connect(analyser, selectedChannel, 0);
            splitter.connect(audioProcessor, selectedChannel, 0);
            console.log(`✅ [AUDIO-HW] Ruteo completado (${workletLoaded ? 'Worklet' : 'ScriptProcessor'}): Out ${selectedChannel}`);
        } catch (e) {
            console.error(`❌ [AUDIO-HW] Error en conexión de ruteo:`, e);
            splitter.connect(analyser, 0, 0);
            splitter.connect(audioProcessor, 0, 0);
        }
    }

    /**
     * Procesa fragmentos de audio PCM con VAD Adaptativo.
     */
    processAudioChunk(float32Data) {
        // [v60.21] RECUPERACIÓN DINÁMICA: Si la referencia local se perdió o no se inició, intentar recuperar del global
        if (!this.audioContext && window.audioContext) {
            this.audioContext = window.audioContext;
        }

        if (!this.audioContext) return;

        // --- 🛡️ PROTECCIÓN MULTI-PESTAÑA (AUTO-RECOVERY) ---
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => { });
        }

        if (!this.audio.get('isRecording')) return;

        // [v60.15] RE-MUESTREO ROBUSTO: Si falla o da 0, mantenemos original para no perder audio.
        let processedData = float32Data;
        if (this.audioContext.sampleRate !== 16000) {
            try {
                const resampled = downsampleBuffer(float32Data, this.audioContext.sampleRate, 16000);
                if (resampled && resampled.length > 0) {
                    processedData = resampled;
                }
            } catch (e) {
                console.warn("⚠️ [AudioCapture] Error en downsample, usando original:", e);
            }
        }

        const micMode = this.audio.get('micMode');

        // --- 🛡️ CÁLCULO DE ENERGÍA DE ALTA PRECISIÓN (RMS 1:1) ---
        let sum = 0;
        for (let i = 0; i < processedData.length; i++) {
            sum += processedData[i] * processedData[i];
        }
        const rms = Math.sqrt(sum / processedData.length);

        // --- 🌊 SUAVIZADO TEMPORAL (SINCRONIZACIÓN CON UI) ---
        this.smoothedRMS = this.smoothedRMS + (rms - this.smoothedRMS) * 0.2;

        // --- 🧠 LÓGICA DE UMBRAL MAESTRO CON HISTÉRESIS DE RANGO AMPLIO ---
        const sensitivity = this.audio.get('currentSensitivity') || 50;

        // 1. Umbral de ACTIVACIÓN (La Raya Verde): Es el pico necesario para empezar.
        const now = Date.now();

        if (micMode === 'auto') {
            const masterStartThreshold = (sensitivity / 1000);
            const masterStopThreshold = masterStartThreshold * 0.5; // Histéresis 50%

            if (!this.isVADActive) {
                // GATE DE ENTRADA: 1:1 con la raya verde de la UI
                if (this.smoothedRMS >= masterStartThreshold && this.smoothedRMS > 0.0005) {
                    this.isVADActive = true;
                    this.silenceStart = 0;
                    this.startSpeechCapture();
                    console.log(`🚀 [VAD-START] Activado por Umbral Visual: RMS=${this.smoothedRMS.toFixed(5)} vs Umbral=${masterStartThreshold.toFixed(5)}`);
                } else {
                    // Calibración pasiva de ruido de fondo (sin efecto en la apertura)
                    const instantFloor = Math.max(0.0001, rms);
                    this.noiseFloor = (instantFloor * 0.02) + (this.noiseFloor * 0.98);
                }
            } else {
                // GATE DE SALIDA: Aplicamos histéresis del 50% para evitar cortes
                if (this.smoothedRMS < masterStopThreshold) {
                    if (this.silenceStart === 0) this.silenceStart = now;
                    if (now - this.silenceStart > this.VAD_HOLD_TIME) {
                        this.isVADActive = false;
                        this.silenceStart = 0;
                        this.endSpeechCapture(true);
                        console.log(`🔇 [VAD-STOP] Silencio: RMS=${this.smoothedRMS.toFixed(5)} cayó por debajo de Histéresis=${masterStopThreshold.toFixed(5)}`);
                    }
                } else {
                    this.silenceStart = 0; // Reset si vuelve a subir de la histéresis
                }
            }
        } else if (micMode === 'ptt') {
            this.isVADActive = this.audio.get('isPTTActive');
        }

        // --- 📤 PIPELINE DE ENVÍO (FILTRADO POR VAD) ---
        if (this.isVADActive) {
            // Almacenar para el Blob final (v60.14: Usamos 16kHz para consistencia total)
            this.pcmChunks.push(new Float32Array(processedData));

            // Enviar stream en tiempo real
            this.sendAudioStreamChunk(processedData);

            // Enviar a Vosk/Whisper para transcripción (Soporta modo Fallback)
            const tMode = this.audio.get('transcriptionMode') || window.transcriptionMode || 'vosk';
            if (tMode === 'vosk' || tMode === 'whisper' || tMode === 'local-fallback') {
                this.voskSendBuffer.push(processedData);
                this.voskSendSamples += processedData.length;

                if (this.voskSendSamples >= this.VOSK_CHUNK_SIZE) {
                    this.flushVoskData();
                }
            }
        } else {
            // Si no hay voz, alimentamos el Pre-Roll (historial de ~1s)
            this.streamingPreRoll.push(new Float32Array(processedData));
            if (this.streamingPreRoll.length > this.PRE_ROLL_MAX_CHUNKS) {
                this.streamingPreRoll.shift();
            }
        }
    }

    /**
     * Envía audio en tiempo real vía socket.
     */
    sendAudioStreamChunk(downsampled16kHz) {
        this.browserStreamBuffer.push(downsampled16kHz);
        this.browserStreamSamples += downsampled16kHz.length;

        // Forzar envío si es el primer chunk tras la activación (Flush inmediato)
        const isFirstChunk = !this.streamStartEmitted;


        if (this.browserStreamSamples >= this.BROWSER_STREAM_CHUNK_SIZE || isFirstChunk) {
            let dataToMerge = [...this.browserStreamBuffer];

            this.browserStreamBuffer = [];
            this.browserStreamSamples = 0;

            const merged = concatenateFloat32Arrays(dataToMerge);
            const streamingId = this.audio.get('streamingId');

            if (window.socket?.connected && streamingId) {
                const cat = (window.selectedCategories || [])[0] || 'General';
                if (isFirstChunk) {
                    if (window.safeEmit('audio-stream-start', { streamId: streamingId, category: cat })) {
                        this.streamStartEmitted = true;
                    }
                }


                const int16 = float32ToInt16(merged);


                const payload = {
                    streamId: streamingId,
                    seq: (this.currentStreamSeq++).toString(),
                    chunk: int16.buffer,
                    mimeType: 'audio/pcm;rate=16000',
                    timestamp: Date.now() + (window.serverTimeOffset || 0),
                    category: cat
                };
                window.safeEmit('audio-stream-chunk', payload);
                this.browserStreamChunksSent++;
            }

            this.browserStreamBuffer = [];
            this.browserStreamSamples = 0;
        }
    }

    /**
     * Vuelca el buffer de Vosk al servidor.
     */
    flushVoskData() {
        if (this.voskSendBuffer.length === 0) return;

        const merged = concatenateFloat32Arrays(this.voskSendBuffer);
        const int16 = float32ToInt16(merged);



        window.queueOrEmit('vosk-chunk', {
            subUserId: 'root',
            streamingId: this.audio.get('streamingId'),
            audioData: int16.buffer
        }, true);

        this.voskSendBuffer = [];
        this.voskSendSamples = 0;
    }

    /**
     * Inicia la captura de voz (VAD/PTT).
     */
    startSpeechCapture() {
        if (this.audio.get('isCapturingSpeech')) return;

        this.audio.setState({
            isCapturingSpeech: true,
            messageSentForCurrentCapture: false,
            isWaitingForVosk: false,
            voskConfirmedSegments: [],
            audioChunks: []
        });

        // [v60.2] Registro de tiempo para filtro de falsa alarma
        this.lastCaptureStartTime = Date.now();

        const micMode = this.audio.get('micMode');
        const cat = (window.selectedCategories || [])[0] || 'General';

        // [v60.ELITE] Generar nuevo streamingId para CADA frase (Auto y PTT)
        // Esto garantiza que cada intervención sea una sesión fresca e independiente en el servidor.
        const newId = `str-${window.socket?.id || 'local'}-${Date.now()}`;
        this.audio.setState({ streamingId: newId });


        // [v60.2] Reset total de estados de streaming para la nueva frase (LOCAL)
        this.streamStartEmitted = false;
        this.currentStreamSeq = 0n;
        this.browserStreamBuffer = [];
        this.browserStreamSamples = 0;



        // Feedback Visual (Restaurado)
        window.safeEmit('start-speaking', { category: cat });
        if (typeof window.showSystemMessage === 'function') {
            window.showSystemMessage('🎙️ Transcribiendo audio en tiempo real...');
        }
        const box = document.getElementById('transcriptionBox');
        const text = document.getElementById('transcriptionText');
        if (box) box.classList.add('show');
        if (text) text.textContent = (window.localesData?.chat?.status_listening || 'Escuchando...');

        const voiceWave = this.dom.get('audio', 'voiceWave');
        const waveContainer = this.dom.get('chat', 'waveContainer');
        if (voiceWave) voiceWave.classList.add('active');
        if (waveContainer) waveContainer.classList.add('active');

        const statusIndicator = this.dom.get('status', 'indicator');
        const statusIndicatorText = this.dom.get('status', 'indicatorText');
        if (statusIndicatorText) statusIndicatorText.textContent = (window.localesData?.chat?.status_speaking || 'HABLANDO...');
        if (statusIndicator) {
            statusIndicator.classList.remove('active');
            statusIndicator.classList.add('speaking');
        }

        const streamingId = this.audio.get('streamingId');
        if (streamingId && !window._audioStreamStartEmitted) {
            if (window.safeEmit('audio-stream-start', { streamId: streamingId, category: cat })) {
                window._audioStreamStartEmitted = true;
            }
        }

        // [v60.2] Reset secuencia Root
        this.currentStreamSeq = 0n;
        this.browserStreamBuffer = [];
        this.browserStreamSamples = 0;


        // [v60.16] MODO DE TRANSCRIPCIÓN: Priorizar estado, fallback a global window
        const tMode = this.audio.get('transcriptionMode') || window.transcriptionMode || 'vosk';

        // [v60.18] Notificar inicio de captura de voz (Soporta todos los motores)
        if (tMode === 'vosk' || tMode === 'whisper' || tMode === 'local-fallback') {
            const startData = {
                lang: window.currentLang || 'es',
                subUserId: 'root'
            };
            console.log(`🎙️ [AudioCapture] Iniciando transcripción: mode=${tMode}, lang=${startData.lang}`);
            if (typeof window.queueOrEmit === 'function') {
                window.queueOrEmit('vosk-start', startData);
            } else if (window.socket && window.socket.connected) {
                window.socket.emit('vosk-start', startData);
            }
        }

        // [ÉLITE] Inyectar Pre-Roll DESPUÉS de vosk-start para asegurar orden en el servidor
        if (this.streamingPreRoll && this.streamingPreRoll.length > 0) {
            this.pcmChunks = [...this.streamingPreRoll];
            if (tMode === 'vosk' || tMode === 'whisper' || tMode === 'local-fallback') {
                this.voskSendBuffer = [...this.streamingPreRoll];
                this.voskSendSamples = this.voskSendBuffer.reduce((acc, curr) => acc + curr.length, 0);
            }

            // [v60.2] Inyección garantizada en el buffer de streaming antes de limpiar
            // Convertimos de Int16 a Float32 para mantener la coherencia matemática del motor Root
            this.browserStreamBuffer = this.streamingPreRoll.map(chunk => {
                const f32 = new Float32Array(chunk.length);
                for (let i = 0; i < chunk.length; i++) f32[i] = chunk[i] / 32768.0;
                return f32;
            });


            this.browserStreamSamples = this.browserStreamBuffer.reduce((acc, curr) => acc + curr.length, 0);


            this.streamingPreRoll = [];
        } else {
            this.pcmChunks = [];
            this.voskSendBuffer = [];
            this.voskSendSamples = 0;
            this.browserStreamBuffer = [];
            this.browserStreamSamples = 0;
        }
    }

    /**
     * Finaliza la captura de voz y procesa el resultado.
     */
    async endSpeechCapture(send = true) {
        if (!this.audio.get('isCapturingSpeech')) return;

        console.log('🎤 [AudioCapture] Iniciando proceso de cierre de captura...');
        // --- 🛡️ PASO 1: FEEDBACK VISUAL INSTANTÁNEO EN LA UI (0 ms) ---
        window.safeEmit('stop-speaking');

        const statusIndicator = this.dom.get('status', 'indicator');
        const statusIndicatorText = this.dom.get('status', 'indicatorText');
        if (statusIndicatorText) statusIndicatorText.textContent = (window.localesData?.chat?.status_active || 'ACTIVO');
        if (statusIndicator) {
            statusIndicator.classList.remove('speaking');
            statusIndicator.classList.add('active');
        }

        const voiceWave = this.dom.get('audio', 'voiceWave');
        const waveContainer = this.dom.get('chat', 'waveContainer');
        if (voiceWave) voiceWave.classList.remove('active');
        if (waveContainer) waveContainer.classList.remove('active');

        // [v60.19] UX Premium: El cuadro persiste con estado de carga para TODOS los modos de transcripción activa
        const box = document.getElementById('transcriptionBox');
        const text = document.getElementById('transcriptionText');
        const tMode = this.audio.get('transcriptionMode');
        if (tMode === 'whisper' || tMode === 'vosk') {
            if (text) {
                const cur = (text.textContent || '').trim();
                if (!cur || cur === '...' || cur.startsWith('Escuchando') || cur.startsWith('Entzuten')) {
                    text.innerHTML = `<span class="processing-status">...</span> <span class="dot-pulse"></span>`;
                }
            }
            if (box) box.classList.add('show');
        } else {
            if (box) box.classList.remove('show');
        }

        // --- 🛡️ PASO 2: POST-ROLL DE AUDIO DESACOPLADO (180 ms) ---
        // Se retiene la captura 180ms adicionales para registrar la cola fonética
        // de la última palabra y evitar que Vosk o Whisper reciban fonemas truncados.
        const POST_ROLL_DELAY_MS = 180;
        await new Promise(resolve => setTimeout(resolve, POST_ROLL_DELAY_MS));

        // Empaquetar últimos fragmentos que entraron durante el post-roll
        this.flushVoskData();

        let blob = null;
        let blobUrl = null;

        if (send && this.audio.get('sendAudio')) {
            const pcmChunks = this.pcmChunks;
            if (pcmChunks.length > 0) {
                try {
                    const merged = concatenateFloat32Arrays(pcmChunks);
                    const int16 = float32ToInt16(merged);

                    const wavBuffer = pcmToWav(int16.buffer, 16000);
                    blob = new Blob([wavBuffer], { type: 'audio/wav' });
                    blobUrl = URL.createObjectURL(blob);
                    console.log(`🏁 [AudioCapture] Audio procesado con post-roll: ${blob.size} bytes`);
                } catch (e) {
                    console.error('❌ [AudioCapture] Error al procesar audio final:', e);
                }
            } else {
                console.warn('⚠️ [AudioCapture] No hay fragmentos PCM para procesar');
            }
        }

        // Reset flag de stream para permitir nuevas frases
        this.streamStartEmitted = false;

        // Actualizar estado de forma atómica para evitar carreras con SocketHandlers
        this.audio.setState({
            isCapturingSpeech: false,
            isWaitingForVosk: true,
            pendingAudioBlob: blob,
            pendingAudioBlobUrl: blobUrl,
            pendingMimeType: 'audio/wav',
            activeStreamingIdForVosk: this.audio.get('streamingId'),
            messageSentForCurrentCapture: false
        });

        const streamingId = this.audio.get('streamingId');
        if (streamingId) {
            window.safeEmit('audio-stream-end', { streamId: streamingId });
        }

        this.pcmChunks = []; // Limpiar buffer local

        if (this.audio.get('transcriptionMode') === 'vosk' || this.audio.get('transcriptionMode') === 'whisper') {
            const confirmed = this.audio.get('voskConfirmedSegments') || [];
            const hasText = confirmed.length > 0;
            const duration = Date.now() - (this.lastCaptureStartTime || Date.now());

            // [v60.ANTI-MURPHY] Filtro de Falsa Alarma ultra-preciso:
            // Solo considerar falsa alarma si duró menos de 200ms Y prácticamente no hubo energía RMS
            // Una palabra corta de 250-400ms con voz ("Sí", "No", "Bai", "Ez") es 100% legítima.
            const isFalseAlarm = !hasText && duration < 200 && (this.smoothedRMS || 0) < 0.001;

            if (isFalseAlarm) {
                window.queueOrEmit('vosk-end', { subUserId: 'root', silent: true });
            } else {
                window.queueOrEmit('vosk-end', { subUserId: 'root' });
            }

            if (window.pendingCaptureTimeout) clearTimeout(window.pendingCaptureTimeout);

            // Watchdog Adaptativo: Whisper requiere más tiempo
            const watchdogTimeout = (this.audio.get('transcriptionMode') === 'whisper') ? 25000 : 4500;

            window.pendingCaptureTimeout = setTimeout(() => {
                if (typeof window.forceFinalSend === 'function') {
                    window.forceFinalSend();
                }
            }, watchdogTimeout);
        }

        // Reset flag de stream para permitir nuevas frases
        window._audioStreamStartEmitted = false;
        console.log('🏁 [AudioCapture] Estado finalizado con post-roll. vosk-end despachado al servidor.');
    }

    /**
     * Envía un mensaje final con un blob de audio.
     */
    async sendFinalMessageWithBlob(blob, mimeType, text, streamId, categoryOrUrl, subUserId) {
        if (!blob) return;

        // Determinar la categoría (el 5º argumento puede ser una URL de blob o la categoría directamente)
        let category = categoryOrUrl;
        if (categoryOrUrl && typeof categoryOrUrl === 'string' && categoryOrUrl.startsWith('blob:')) {
            category = (window.selectedCategories && window.selectedCategories[0]) || 'General';
        }

        console.log(`📤 [AudioCapture] Enviando mensaje final con audio binario (${blob.size} bytes)...`);

        const payload = {
            text: text || '🎙️ Mensaje de audio',
            audioData: blob, // Enviamos el Blob directamente. Socket.io lo convertirá a Buffer en el servidor.
            mimeType: mimeType || 'audio/wav',
            streamId: streamId,
            category: category || 'General',
            subUserId: subUserId || null
        };

        window.safeEmit('send-message', payload);
        if (typeof window.triggerVibration === 'function') window.triggerVibration(40);
    }

    // --- Per-SubUser capture pipelines ---
    async startSubUserCapture(subUserId, mic, lang = 'es', threshold = 0.5, category = 'General') {
        if (!subUserId || !mic || !mic.deviceId) return { ok: false, error: 'invalid_args' };
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return { ok: false, error: 'no_media' };
        if (!window._subUserPipelines) window._subUserPipelines = {};

        const existing = window._subUserPipelines[subUserId];
        if (existing) {
            const micChanged = (existing.mic?.deviceId !== mic.deviceId) || (existing.mic?.channel !== mic.channel);
            const langChanged = existing.lang !== lang;
            const thresholdChanged = existing.threshold !== threshold;
            const categoryChanged = existing.category !== category;

            if (!micChanged && !langChanged) {
                if (categoryChanged || thresholdChanged) {
                    existing.category = category;
                    existing.threshold = threshold;
                }
                return { ok: true };
            }

            this.stopSubUserCapture(subUserId, true);
        }

        console.log(`🎙️ [SUB-USER] Iniciando captura paralela para: ${subUserId} (Mic: ${mic.deviceId}, Ch: ${mic.channel}, Lang: ${lang}, Thresh: ${threshold}, Cat: ${category})`);

        try {
            // [v60.ELITE] Adquisición compartida de stream para evitar bloqueos exclusivos de hardware en Windows
            const wasStreamShared = !!(window.mediaStream && window.mediaStream.active) ||
                !!(window._deviceStreamCache && window._deviceStreamCache[mic.deviceId] && window._deviceStreamCache[mic.deviceId].stream);
            const stream = window.getDeviceStream ?
                await window.getDeviceStream(mic.deviceId, { force: false }) :
                await navigator.mediaDevices.getUserMedia(window.getEliteConstraints ? window.getEliteConstraints(mic.deviceId, mic.label || '') : { audio: { deviceId: { exact: mic.deviceId } } });

            const ctx = window.initAudioCtx ? window.initAudioCtx() : null;
            if (!ctx) return { ok: false, error: 'no_context' };
            const src = ctx.createMediaStreamSource(stream);

            const track = stream.getAudioTracks()[0];
            const settings = track ? track.getSettings() : {};
            const realHardwareChannels = settings.channelCount || src.channelCount || 1;

            // [v60.ELITE] Auto-Sanación Murphy en Sub-usuarios
            const subDeviceLabel = (track && track.label) || (mic && mic.label) || '';
            const isSubUltraDensity = /soundgrid|waves|dante|madi|digico|ravenna/i.test(subDeviceLabel);
            if (mic && mic.deviceId && !isSubUltraDensity) {
                const subCacheKey = `talkme_caps_${mic.deviceId}`;
                const subCachedCaps = localStorage.getItem(subCacheKey);
                if (subCachedCaps && parseInt(subCachedCaps, 10) > realHardwareChannels) {
                    console.warn(`🧹 [SUB-USER] Murphy Self-Healing: Corrigiendo capacidad contaminada de ${subCachedCaps} a ${realHardwareChannels} canales para ${subDeviceLabel || mic.deviceId}`);
                    localStorage.setItem(subCacheKey, realHardwareChannels);
                    if (typeof window.updateChannelSelectors === 'function') {
                        window.updateChannelSelectors('input', mic.deviceId);
                    }
                }
            }

            let requestedChannel = parseInt(mic.channel) || 0;
            if (requestedChannel >= realHardwareChannels) {
                console.warn(`⚠️ [SUB-USER] DESVIACIÓN DETECTADA: Canal ${requestedChannel + 1} excede capacidad (${realHardwareChannels} ch).`);
                
                // [v60.ELITE] Prevención de Colisión: Comprobar si Ch 1 (0) está ocupado por el Usuario Raíz
                const rootChannel = (window.audioState && typeof window.audioState.get === 'function') ? (parseInt(window.audioState.get('inputChannel'), 10) || 0) : 0;
                const rootDeviceId = (window.audioState && typeof window.audioState.get === 'function') ? window.audioState.get('deviceId') : null;
                const isSameDeviceAsRoot = rootDeviceId && (window.areDevicesIdentical ? window.areDevicesIdentical(rootDeviceId, mic.deviceId) : (rootDeviceId === mic.deviceId));

                if (isSameDeviceAsRoot && rootChannel === 0 && realHardwareChannels > 1) {
                    // Si Root usa Ch 1 y tenemos Ch 2 disponible, asignar Ch 2 para evitar pisarlo
                    requestedChannel = 1;
                    mic.channel = 1;
                    console.log(`🛡️ [SUB-USER] Prevención de colisión: Canal 1 ocupado por Root en ${mic.deviceId}. Asignando Ch 2 automáticamente a ${subUserId}.`);
                } else {
                    requestedChannel = 0;
                    mic.channel = 0;
                }
            }
            const splitterChannels = Math.max(realHardwareChannels, requestedChannel + 1, 2);
            const splitter = ctx.createChannelSplitter(splitterChannels);

            // [v60.ELITE] Nodo Analizador para monitorización en tiempo real (Modal/Vúmetro)
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 1024;
            splitter.connect(analyser, requestedChannel, 0);

            src.connect(splitter);

            let processor;
            const canUseWorklet = !!(ctx.audioWorklet && window.AudioWorkletNode);

            if (canUseWorklet) {
                processor = new AudioWorkletNode(ctx, 'vosk-processor');
                processor.port.onmessage = (event) => {
                    if (!event.data || !event.data.length) return;
                    this.processSubUserAudioChunk(subUserId, event.data, ctx.sampleRate);
                };
                splitter.connect(processor, requestedChannel, 0);
            } else {
                console.warn(`⚠️ [SUB-USER] AudioWorklet no disponible, usando ScriptProcessor fallback para ${subUserId}`);
                processor = ctx.createScriptProcessor(4096, 1, 1);
                processor.onaudioprocess = (ev) => {
                    const input = ev.inputBuffer.getChannelData(0);
                    this.processSubUserAudioChunk(subUserId, input, ctx.sampleRate);
                };
                splitter.connect(processor, requestedChannel, 0);
                processor.connect(ctx.destination);
            }

            const streamId = `sub-st-${subUserId}-${Date.now()}`;
            window._subUserPipelines[subUserId] = {
                stream, src, splitter, processor, analyser,
                isWorklet: canUseWorklet, mic, lang, category,
                wasStreamShared: wasStreamShared,
                streamId: streamId,
                seq: 0n, // Usar BigInt
                accumulator: [],
                threshold: threshold,
                smoothedVolume: 0,
                isRecording: false,
                voskSessionActive: false,
                lastVADTrigger: 0,
                hasText: false,
                captureStartTime: 0,
                preRoll: [],
                rawBuffer48k: [],
                rawSamples48k: 0,
                streamStartEmitted: false // [v60.2] Flag de control de flujo
            };



            if (window.safeEmit) window.safeEmit('vosk-start', { subUserId: subUserId, lang: lang });

            // [v60.ELITE FIX - Sol.3bis] Watchdog de pistas: autorecuperación si el Master apaga el stream compartido
            const trackForWatchdog = stream.getAudioTracks()[0];
            if (trackForWatchdog) {
                trackForWatchdog.addEventListener('ended', async () => {
                    const pipeline = window._subUserPipelines ? window._subUserPipelines[subUserId] : null;
                    if (pipeline && pipeline.voskSessionActive) {
                        console.warn(`🚨 [SUB-USER] Stream finalizado externamente (Master switch). Autorecuperando ${subUserId}...`);
                        await new Promise(r => setTimeout(r, 400));
                        try {
                            const freshStream = await navigator.mediaDevices.getUserMedia(
                                window.getEliteConstraints ? window.getEliteConstraints(mic.deviceId, mic.label || '') : { audio: { deviceId: { exact: mic.deviceId } } }
                            );
                            const newSrc = ctx.createMediaStreamSource(freshStream);
                            if (pipeline.src) try { pipeline.src.disconnect(); } catch (e) { }
                            pipeline.src = newSrc;
                            newSrc.connect(pipeline.splitter);
                            pipeline.stream = freshStream;
                            console.log(`✅ [SUB-USER] Pipeline autorecuperado para ${subUserId}.`);
                        } catch (e) {
                            console.error(`❌ [SUB-USER] Falla en autorecuperación:`, e.message);
                        }
                    }
                });
            }

            return { ok: true, streamId: streamId };

        } catch (e) {
            console.warn(`❌ [SUB-USER] startSubUserCapture failed for ${subUserId}:`, e.message);
            return { ok: false, error: e.message };
        }
    }

    processSubUserAudioChunk(subUserId, float32Data, sampleRate) {
        try {
            const pipeline = window._subUserPipelines ? window._subUserPipelines[subUserId] : null;
            if (!pipeline) return;

            let sum = 0;
            for (let i = 0; i < float32Data.length; i += 16) {
                sum += float32Data[i] * float32Data[i];
            }
            const rms = Math.sqrt(sum / (float32Data.length / 16));

            const volume = Math.min(100, Math.max(0, rms * 1000));
            pipeline.smoothedVolume = (volume * 0.2) + (pipeline.smoothedVolume * 0.8);
            const effectiveRms = pipeline.smoothedVolume / 1000;

            // [v60.ELITE FIX - Sol.8] Emitir escala raw idéntica a la de red (0.0..0.1) para paridad total con handler vuHandler
            window.dispatchEvent(new CustomEvent('remote-vu', { detail: { subUserId, rms: Math.min(1, effectiveRms), local: true } }));

            const now = Date.now();

            // [v60.2] UNIFICACIÓN INDUSTRIAL: Misma lógica que el usuario raíz
            const holdTime = 750; // 0.75s (Paridad total)
            const startThreshold = (pipeline.threshold || 0.5) * 100;
            const stopThreshold = startThreshold * 0.5; // Histéresis 50%

            if (pipeline.smoothedVolume >= startThreshold) {
                pipeline.lastVADTrigger = now;
                if (!pipeline.isRecording) {
                    pipeline.isRecording = true;
                    pipeline.hasText = false; // Reset detección de texto
                    pipeline.captureStartTime = now; // Para el filtro de 0.5s

                    if (window.safeEmit) window.safeEmit('start-speaking', { subUserId: subUserId, category: pipeline.category });

                    if (!pipeline.voskSessionActive) {
                        pipeline.voskSessionActive = true;
                        if (window.safeEmit) window.safeEmit('vosk-start', { subUserId: subUserId, lang: pipeline.lang || 'es' });
                    }
                }
            } else {
                // Aplicamos histéresis: si estamos grabando, usamos el umbral más bajo para no cortar
                const isStillAboveStop = pipeline.isRecording && pipeline.smoothedVolume >= stopThreshold;

                if (isStillAboveStop) {
                    pipeline.lastVADTrigger = now; // Mantenemos vivo el VAD
                } else if (pipeline.isRecording && (now - pipeline.lastVADTrigger > holdTime)) {
                    // Cierre de sesión con filtro de integridad
                    const duration = now - (pipeline.captureStartTime || now);
                    const isFalseAlarm = !pipeline.hasText && duration < 500;

                    pipeline.isRecording = false;
                    pipeline.voskSessionActive = false;

                    if (window.safeEmit) window.safeEmit('stop-speaking', { subUserId: subUserId });

                    // [v60.2] Cerrar stream formalmente
                    if (window.safeEmit) window.safeEmit('audio-stream-end', { streamId: pipeline.streamId });
                    pipeline.streamStartEmitted = false;
                    pipeline.seq = 0n;

                    if (window.safeEmit) {

                        if (isFalseAlarm) {
                            window.safeEmit('vosk-end', { subUserId: subUserId, silent: true });
                        } else {
                            window.safeEmit('vosk-end', { subUserId: subUserId, silent: false });
                        }
                    }

                    pipeline.voskSendBuffer = [];
                    pipeline.voskSendSamples = 0;
                }
            }


            const currentRate = (window.audioContext && window.audioContext.sampleRate) ? window.audioContext.sampleRate : 48000;
            const samplesPer250ms = Math.round(currentRate * 0.25);

            pipeline.rawBuffer48k.push(new Float32Array(float32Data));
            pipeline.rawSamples48k += float32Data.length;

            if (pipeline.rawSamples48k >= samplesPer250ms) {
                const bigChunk = concatenateFloat32Arrays(pipeline.rawBuffer48k);
                pipeline.rawBuffer48k = [];
                pipeline.rawSamples48k = 0;

                const downsampled = downsampleBuffer(bigChunk, currentRate, 16000);
                const int16 = float32ToInt16(downsampled);



                if (!pipeline.isRecording) {
                    pipeline.preRoll.push(int16.buffer);
                    if (pipeline.preRoll.length > 4) pipeline.preRoll.shift();
                } else {
                    // [v60.2] Protocolo ELITE: Asegurar START antes de cualquier dato
                    // [v60.ELITE] REGENERACIÓN DE SESIÓN EN TIEMPO REAL
                    if (!pipeline.streamStartEmitted) {
                        // Generar un ID único para cada frase evita que el servidor descarte el flujo
                        pipeline.streamId = `sub-st-${subUserId}-${Date.now()}`;
                        pipeline.seq = 0n; // Reset de secuencia para el nuevo flujo

                        if (window.safeEmit) {
                            if (window.safeEmit('audio-stream-start', {
                                streamId: pipeline.streamId,
                                category: pipeline.category || 'General',
                                subUserId: subUserId
                            })) {
                                pipeline.streamStartEmitted = true;
                            }
                        }
                        console.log(`🚀 [SUB-USER] Nueva sesión de audio iniciada: ${pipeline.streamId}`);
                    }

                    if (pipeline.preRoll.length > 0) {
                        const pr = [...pipeline.preRoll];
                        pipeline.preRoll = [];
                        pr.forEach(chunk => {
                            if (window.safeEmit) {
                                // [v60.2] Paridad: Streaming + Transcripción
                                window.safeEmit('vosk-chunk', { audioData: chunk, subUserId: subUserId });
                                window.safeEmit('audio-stream-chunk', {
                                    streamId: pipeline.streamId,
                                    seq: (pipeline.seq++).toString(),
                                    chunk: chunk, // Ya tiene ganancia aplicada en el pre-roll manual si fuera necesario, pero aquí usamos el buffer directo
                                    timestamp: Date.now() + (window.serverTimeOffset || 0),
                                    subUserId: subUserId,
                                    category: pipeline.category || 'General'
                                });


                            }
                        });

                    }

                    if (window.safeEmit) {
                        window.safeEmit('vosk-chunk', { audioData: int16.buffer, subUserId: subUserId });
                        window.safeEmit('audio-stream-chunk', {
                            streamId: pipeline.streamId,
                            seq: (pipeline.seq++).toString(),
                            chunk: int16.buffer, // Ya tiene el 1.5x aplicado en la línea 730
                            timestamp: Date.now() + (window.serverTimeOffset || 0),
                            subUserId: subUserId,
                            category: pipeline.category || 'General'
                        });


                    }

                }

            }
        } catch (e) {
            console.debug(`⚠️ [SUB-USER] Audio processing error (${subUserId}):`, e.message);
        }
    }

    stopSubUserCapture(subUserId, silent = false) {
        if (!window._subUserPipelines || !window._subUserPipelines[subUserId]) return;
        try {
            const p = window._subUserPipelines[subUserId];

            if (p.isWorklet) {
                if (p.processor.port) p.processor.port.onmessage = null;
            } else {
                p.processor.onaudioprocess = null;
            }

            try { p.processor.disconnect(); } catch (e) { }
            try { p.src.disconnect(); } catch (e) { }
            try { if (p.splitter) p.splitter.disconnect(); } catch (e) { }
            try { if (p.analyser) p.analyser.disconnect(); } catch (e) { }

            // Detener pistas del stream solo si no está en uso por otro sub-usuario activo ni por el Master
            let streamInUseByOthers = false;
            if (window._subUserPipelines) {
                for (const otherId of Object.keys(window._subUserPipelines)) {
                    if (otherId !== subUserId) {
                        const otherP = window._subUserPipelines[otherId];
                        if (otherP && otherP.stream === p.stream) {
                            streamInUseByOthers = true;
                            break;
                        }
                    }
                }
            }

            const isSharedWithMaster = (p.stream === window.mediaStream);

            if (!streamInUseByOthers && !isSharedWithMaster) {
                try { p.stream.getTracks().forEach(t => t.stop()); } catch (e) { }
                if (p.mic && p.mic.deviceId) {
                    try {
                        if (window._deviceStreamCache) {
                            delete window._deviceStreamCache[p.mic.deviceId];
                        }
                    } catch (e) { }
                }
                console.log(`🧹 [SUB-USER] Stream liberado por completo para subusuario ${subUserId} (No hay más referencias activas).`);
            } else {
                console.log(`ℹ️ [SUB-USER] Stream compartido conservado activo para subusuario ${subUserId} (En uso por Master u otros subusuarios).`);
            }
        } catch (e) {
            console.debug(`⚠️ [SUB-USER] stopSubUserCapture cleanup error (${subUserId}):`, e.message);
        }
        delete window._subUserPipelines[subUserId];
        if (window.safeEmit) {
            try { window.safeEmit('vosk-end', { subUserId: subUserId, silent: silent }); } catch (e) { }
        }
    }
}

export { AudioCapture };
