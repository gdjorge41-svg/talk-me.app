/**
 * 🎙️ AudioStateManager - Máquina de estados centralizada
 * 
 * Propósito: Reemplazar 20+ variables de audio dispersas por una máquina de estados observable.
 * 
 * ANTES (❌ Anti-patrón - Variables esparcidas):
 *   let isRecording = false;
 *   let mediaStream = null;
 *   let mediaRecorder = null;
 *   let isMuted = false;
 *   let micMode = 'ptt';
 *   // ... 15 más variables
 * 
 * AHORA (✅ Patrón Limpio):
 *   const audio = AudioStateManager.getInstance();
 *   audio.setState({ isRecording: true, isMuted: false });
 *   audio.subscribe((old, new) => console.log('Audio changed:', new));
 * 
 * VENTAJAS:
 *   ✅ Single source of truth
 *   ✅ Observable pattern - cualquiera se suscribe a cambios
 *   ✅ Debugging fácil - puedo ver todas las transiciones
 *   ✅ Validación de estados
 *   ✅ Historial de cambios
 */

class AudioStateManager {
    static #instance = null;

    constructor() {
        if (AudioStateManager.#instance) {
            return AudioStateManager.#instance;
        }

        // 📊 Estado centralizado de audio
        this.state = {
            // ────────────────────────────────────
            // Recording & Capture
            // ────────────────────────────────────
            isRecording: false,                    // ¿Grabando audio actualmente?
            isCapturingSpeech: false,              // ¿Capturando voz?
            recordingStartedByPTT: false,          // ¿Se inició por PTT?
            mediaRecorder: null,                   // Instancia de MediaRecorder
            audioChunks: [],                       // Buffer de chunks de audio
            audioContext: null,                    // Web Audio API context
            audioProcessor: null,                  // Script processor node
            analyser: null,                        // AnalyserNode para visualización/VAD

            // --- Sesión y Usuario ---
            currentUsername: '',
            currentRoomPin: '',
            isMaster: false,
            currentCategories: [],
            selectedCategories: [],

            // --- Preferencias y Flags de UI ---
            currentLang: localStorage.getItem('talkme_lang') || 'es',
            currentTheme: localStorage.getItem('talkme_theme') || 'dark',
            fontSizePercent: parseInt(localStorage.getItem('talkme_font_percent')) || 100,
            fontWeight: parseInt(localStorage.getItem('talkme_font_weight')) || 600,
            transcriptionOnly: false,
            isScreenAlertEnabled: localStorage.getItem('talkme_screen_alerts') !== 'false',
            isFlashlightEnabled: (localStorage.getItem('talkme_flashlight_alerts') !== 'false') && 
                                 /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isVibrationEnabled: localStorage.getItem('talkme_vibration_alerts') !== 'false',

            // ────────────────────────────────────
            // Stream & Devices
            // ────────────────────────────────────
            mediaStream: null,                     // MediaStream del micrófono
            streamingId: null,                     // ID de streaming remoto
            currentStreamSeq: 0n,                  // Secuencia de stream (BigInt)
            activeStreamingIdForVosk: null,        // ID para Vosk remoto

            // ────────────────────────────────────
            // Transcription
            // ────────────────────────────────────
            recognition: null,                     // Reservado (no se usa - todo es server-side)
            pendingAudioBlob: null,                // Blob pendiente de enviar
            pendingAudioBlobUrl: null,             // URL de blob pendiente
            pendingMimeType: null,                 // MIME type del audio pendiente
            audioBlobUrls: [],                     // Buffer de URLs generadas
            isWaitingForVosk: false,
            currentAudioPromise: null,               // ¿Esperando resultado final de Vosk?
            voskSendBuffer: [],                    // Buffer de envío para Vosk
            voskSendSamples: 0,                    // Contador de muestras enviadas a Vosk
            pcmChunks: [],                         // Fragmentos PCM crudos
            autoPlayRealtime: true,                // Reproducción automática de audio entrante
            voskConfirmedSegments: [],             // Segmentos de texto confirmados
            messageSentForCurrentCapture: false,    // ¿Semaforo de mensaje enviado?

            // ────────────────────────────────────
            // Playback
            // ────────────────────────────────────
            isMuted: false,                        // ¿Silenciado globalmente?
            activeFilters: ['__ALL__'],            // Filtros de categoría activos en la UI
            activeAudioElements: [],               // <audio> en reproducción
            autoPlayEnabled: true,                 // ¿Autoplay de audio de otros?
            sendAudio: true,                       // ¿Enviar audio al chat?

            // ────────────────────────────────────
            // Configuration
            // ────────────────────────────────────
            micMode: 'ptt',                        // 'ptt' | 'vad' (Voice Activity Detection)
            transcriptionMode: 'vosk',             // 'vosk' | 'local-fallback' (sin servicios online)
            deviceId: localStorage.getItem('talkme_preferred_audio_input') || localStorage.getItem('talkme_deviceId') || null,
            outputDeviceId: localStorage.getItem('talkme_outputDeviceId') || null,
            inputChannel: 0,                       // Canal de entrada seleccionado (0 = primero)
            outputChannel: 0,                      // Canal de salida seleccionado (0 = primero)
            // Mapeo persistente de canales por dispositivo: { deviceId: { input: 0, output: 0 } }
            deviceChannelMapping: JSON.parse(localStorage.getItem('talkme_device_channels') || '{}'),

            // ────────────────────────────────────
            // Metadata & Session
            // ────────────────────────────────────
            joinState: 'IDLE',                     // 'IDLE' | 'JOINING' | 'JOINED'
            lastJoinEmitAt: 0,                     // Timestamp del último join (Flood control)
            isMidiRestricted: false,               // ¿MIDI bloqueado por navegador?
            audioContextAuthorized: false,         // ¿Usuario ha dado gesto para WebAudio?
            lastSampleTime: 0,                     // Último tiempo de muestra (para VAD)
            currentVolume: 0,                      // Volumen actual 0-1
            currentSensitivity: 50,                // Umbral de sensibilidad (VAD)
            detectedLang: 'es',                    // Idioma detectado
            isPTTActive: false,                    // ¿Está el botón PTT presionado?
            currentBrowserText: '',                // Texto acumulado (Browser mode)
            pendingBrowserTranscript: '',          // Transcripción pendiente
        };

        // 🔔 Observers
        this.subscribers = [];
        this.stateHistory = [];
        this.maxHistorySize = 100;

        AudioStateManager.#instance = this;
    }

    static getInstance() {
        if (!AudioStateManager.#instance) {
            new AudioStateManager();
        }
        return AudioStateManager.#instance;
    }

    /**
     * Cambia estado de forma reactiva
     * @param {Object} updates - Cambios a aplicar
     */
    setState(updates) {
        // Hacer shallow copy del estado anterior (sin serializar a JSON)
        // JSON.stringify falla con objetos no serializables (mediaStream, audioContext, etc)
        const oldState = { ...this.state };
        
        // Aplicar cambios
        this.state = { ...this.state, ...updates };
        
        // Guardar en historial (sin intentar serializar objetos complejos)
        try {
            this.stateHistory.push({
                timestamp: Date.now(),
                oldState: oldState,
                newState: { ...this.state },
                changes: Object.keys(updates),
            });
        } catch (err) {
            console.warn('⚠️ AudioStateManager: Could not save to history:', err);
        }
        
        // Limitar historial
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }

        // Notificar subscribers
        this.subscribers.forEach(callback => {
            try {
                callback(oldState, this.state);
            } catch (err) {
                console.error('AudioStateManager subscription error:', err);
            }
        });
    }

    /**
     * Obtiene un valor del estado
     * @param {string} key
     * @returns {*}
     */
    get(key) {
        return this.state[key];
    }

    /**
     * Suscribirse a cambios de estado
     * @param {Function} callback - (oldState, newState) => {}
     * @returns {Function} Función para desuscribirse
     */
    subscribe(callback) {
        this.subscribers.push(callback);
        
        // Retornar función para desuscribirse
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    /**
     * Ver todo el estado actual
     */
    debug() {
        console.log('🎙️  AudioState:', this.state);
        console.log('📜 History:', this.stateHistory.slice(-5));
    }

    /**
     * Resetear a estado inicial
     */
    reset() {
        this.setState({
            isRecording: false,
            mediaStream: null,
            mediaRecorder: null,
            audioChunks: [],
            isCapturingSpeech: false,
            isMuted: false,
            pendingAudioBlob: null,
        });
    }

    /**
     * Sub-usuarios API (stubs)
     */
    addSubUser(subUserId, config = {}, callback) {
        try {
            if (!window || !window.socket) {
                if (callback) callback({ success: false, error: 'no_socket' });
                return;
            }
            const payload = Object.assign({ subUserId }, config);
            window.socket.emit('registerSubUser', payload, (resp) => {
                if (callback) callback(resp);
            });
        } catch (e) {
            if (callback) callback({ success: false, error: e.message });
        }
    }

    removeSubUser(subUserId, callback) {
        try {
            if (!window || !window.socket) {
                if (callback) callback({ success: false, error: 'no_socket' });
                return;
            }
            window.socket.emit('removeSubUser', { subUserId }, (resp) => {
                if (callback) callback(resp);
            });
        } catch (e) {
            if (callback) callback({ success: false, error: e.message });
        }
    }

    getAvailableMicrophones(callback) {
        try {
            if (!window || !window.socket) {
                if (callback) callback({ ok: false, error: 'no_socket' });
                return;
            }
            // Query server for assigned mics and return list filtered locally
            // This is a minimal stub: client should enumerate navigator.mediaDevices
            window.socket.emit('get-assigned-mics', null, (resp) => {
                if (callback) callback(resp);
            });
        } catch (e) {
            if (callback) callback({ ok: false, error: e.message });
        }
    }

    setStateForSubUser(subUserId, updates, callback) {
        try {
            if (!window || !window.socket) {
                if (callback) callback({ ok: false, error: 'no_socket' });
                return;
            }
            const payload = { subUserId, updates };
            window.socket.emit('updateSubUserState', payload, (resp) => {
                if (callback) callback(resp);
            });
        } catch (e) {
            if (callback) callback({ ok: false, error: e.message });
        }
    }

    // Start sending audio tagged with subUserId (when transmitting)
    setActiveSubUser(subUserId) {
        // This is a lightweight setter used by UI when user selects which identity speaks
        this.setState({ activeSubUserId: subUserId });
    }

    /**
     * Máquina de estados: validar transiciones
     */
    validateTransition(oldState, newState) {
        // Ejemplos de validación:
        // - No puedo grabar si no tengo mediaStream
        // - No puedo enviar audio si isMuted
        // etc.

        if (newState.isRecording && !oldState.mediaStream) {
            console.warn('⚠️  Cannot start recording without mediaStream');
            return false;
        }

        return true;
    }

    /**
     * Getters de conveniencia
     */
    isReady() {
        return this.state.mediaStream && this.state.audioContext;
    }

    canRecord() {
        return this.state.mediaStream && !this.state.isRecording;
    }

    isActive() {
        return this.state.isRecording || this.state.isCapturingSpeech;
    }

    /**
     * Flush: vaciar buffers
     */
    flushAudio() {
        this.setState({
            audioChunks: [],
            pendingAudioBlob: null,
            pendingAudioBlobUrl: null,
        });
    }
}

// Exportar como singleton
export { AudioStateManager };
