/**
 * @file audio-core.js
 * @description Núcleo de audio de Talk-me. Gestión de Jitter Buffer, NACK y PCM Playback.
 */

export let audioCtx = null;
// [v60] Gestión de estados multiplexados: Soporte para múltiples flujos de audio simultáneos
export const streamStates = new Map(); // Mapa de { streamId -> { expectedSeq, reorderBuffer, nackHistory, lastActive } }
export const streamPlayers = new Map();
export const processedStreamIds = new Set();

let nackTimeout = null;
const nackRetryLimit = 10;
const STREAM_TTL = 10000; // 10 segundos de inactividad para limpiar estado
window.serverTimeOffset = 0;
window.serverTimeSynced = false;
let rtt = 0;

// [INGENIERÍA v59.15] Registro de paquetes reproducidos para evitar AUDIOS DOBLES
// Almacena las claves "streamId:seq" para asegurar que cada chunk se procesa UNA sola vez.
const playedChunksRegistry = new Set();

/**
 * Inicializa el AudioContext y asegura su persistencia (especialmente en iOS).
 */
export function initAudioCtx() {
    if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)({
            latencyHint: 'interactive'
        });
        window.audioContext = audioCtx; // [v60.1] Asegurar sincronización con window.audioContext

        audioCtx.onstatechange = () => {
            if (audioCtx.state === 'suspended' || audioCtx.state === 'interrupted') {
                audioCtx.resume().catch(() => { });
            }
            window._eliteAudioCtx = audioCtx;
        };

        if (!window._masterGain) {
            window._masterGain = audioCtx.createGain();

            // 🎛️ [v60.SOFT-LIMITER] Compresor/Limitador suave de protección contra Ducking/Clipping de iOS/Apple
            const masterLimiter = audioCtx.createDynamicsCompressor();
            masterLimiter.threshold.setValueAtTime(-3, audioCtx.currentTime); // Límite suave en -3 dBFS
            masterLimiter.knee.setValueAtTime(6, audioCtx.currentTime);
            masterLimiter.ratio.setValueAtTime(12, audioCtx.currentTime);     // Contención firme de picos
            masterLimiter.attack.setValueAtTime(0.002, audioCtx.currentTime); // Ataque ultra-rápido (2ms)
            masterLimiter.release.setValueAtTime(0.1, audioCtx.currentTime);  // Retorno fluido

            const maxChannels = Math.max(2, audioCtx.destination.maxChannelCount || 2);
            window._channelMerger = audioCtx.createChannelMerger(maxChannels);
            
            // Cadena de ruteo: masterGain -> masterLimiter -> channelMerger -> destination
            window._masterGain.connect(masterLimiter);
            masterLimiter.connect(window._channelMerger, 0, 0);
            window._channelMerger.connect(audioCtx.destination);
            window._masterLimiter = masterLimiter;
        }

        if (typeof window.applyAudioOutput === 'function') {
            window.applyAudioOutput(audioCtx);
        }
    }

    // Resume proactivo si está suspendido
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => { });
    }

    return audioCtx;
}

/**
 * Envía un pulso de ruido blanco casi inaudible para mantener activo el hardware.
 */
export function playComfortNoise(duration = 0.2) {
    const ctx = initAudioCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.005;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(window._masterGain || ctx.destination);
    source.start();
}

/**
 * Procesa el buffer de reordenamiento para un stream específico.
 */
export function processReorderBuffer(socket, streamId) {
    const state = streamStates.get(streamId);
    if (!state) return;

    while (state.reorderBuffer.has(state.expectedSeq)) {
        const payload = state.reorderBuffer.get(state.expectedSeq);
        state.reorderBuffer.delete(state.expectedSeq);
        playStreamChunk(payload);
        state.expectedSeq++;
    }

    clearTimeout(state.nackTimeout);
    state.nackTimeout = setTimeout(() => {
        checkForGaps(socket, streamId);
    }, 150);
}

/**
 * Detecta huecos en la secuencia de un stream específico y solicita retransmisión.
 */
export function checkForGaps(socket, streamId) {
    if (!socket) return;
    const state = streamStates.get(streamId);
    if (!state) return;

    const receivedSeqs = Array.from(state.reorderBuffer.keys()).sort((a, b) => (a < b ? -1 : 1));
    if (receivedSeqs.length === 0) return;

    const MAX_GAP_TO_RECOVER = 50n;
    const firstReceived = receivedSeqs[0];

    if (firstReceived - state.expectedSeq > MAX_GAP_TO_RECOVER) {
        console.warn(`⚠️ [${streamId}] Hueco masivo detectado (${firstReceived - state.expectedSeq}). Saltando secuenciador.`);
        state.expectedSeq = firstReceived;
        processReorderBuffer(socket, streamId);
        return;
    }

    for (let s = state.expectedSeq; s < firstReceived; s++) {
        const retries = state.nackHistory.get(s) || 0;
        if (retries < nackRetryLimit) {
            socket.emit('audio-stream-nack', { streamId, seq: s.toString() });
            state.nackHistory.set(s, retries + 1);
        } else {
            state.expectedSeq = s + 1n;
            state.nackHistory.delete(s);
            processReorderBuffer(socket, streamId);
        }
    }
}

/**
 * Reproduce un trozo de audio PCM a través del motor de audio.
 */
export function playStreamChunk(payload) {
    // Si autoPlayRealtime está desactivado, no reproducir
    if (window.autoPlayRealtime === false) return;

    const { streamId, chunk, mimeType, seq } = payload;

    // --- 🔇 [INGENIERÍA v59.15] CHUNK LOCKING (Deduplicación atómica) ---
    // Si este paquete exacto ya fue reproducido por otro listener, ignorarlo.
    const chunkKey = `${streamId}:${seq}`;
    if (playedChunksRegistry.has(chunkKey)) return;
    playedChunksRegistry.add(chunkKey);

    // Limpieza periódica del registro (mantener últimos 200 paquetes)
    if (playedChunksRegistry.size > 200) {
        const firstValue = playedChunksRegistry.values().next().value;
        playedChunksRegistry.delete(firstValue);
    }
    let player = streamPlayers.get(streamId);

    if (!player) {
        const ctx = initAudioCtx();
        const gainNode = ctx.createGain();
        gainNode.gain.value = 3.5;
        gainNode.connect(window._masterGain || ctx.destination);

        player = {
            type: 'pcm',
            nextPlayTime: ctx.currentTime + 0.1,
            gainNode: gainNode
        };
        streamPlayers.set(streamId, player);
    }

    try {
        const ctx = initAudioCtx();

        // --- 🔧 FIX V59.45/V60: Handle JSON Buffer and Byte-Aligned views safely ---
        // Asegurar decodificación si Node/Socket.io emite el Buffer como JSON { type: "Buffer", data: [...] }
        if (chunk && chunk.type === 'Buffer' && Array.isArray(chunk.data)) {
            chunk = new Uint8Array(chunk.data);
        }

        let float32Data;
        // [v60.ELITE FIX - Sol.5] Alineación segura de memoria a 16 bits (evita RangeError en offsets impares)
        let int16View;
        if (chunk instanceof Int16Array) {
            int16View = chunk;
        } else {
            const arrayBuffer = (chunk instanceof ArrayBuffer) ? chunk : chunk.buffer;
            const offset = chunk.byteOffset || 0;
            const length = chunk.byteLength || chunk.length || 0;
            // Si el offset es par, la asignación directa es segura y eficiente (sin copia)
            if (offset % 2 === 0) {
                int16View = new Int16Array(arrayBuffer, offset, Math.floor(length / 2));
            } else {
                // Si el offset es impar, forzar alineación copiando a un nuevo buffer
                const alignedBuffer = chunk.slice ? chunk.slice().buffer : new Uint8Array(chunk).slice().buffer;
                int16View = new Int16Array(alignedBuffer);
            }
        }

        float32Data = new Float32Array(int16View.length);
        for (let i = 0; i < int16View.length; i++) {
            float32Data[i] = int16View[i] / 32768.0;
        }

        const buffer = ctx.createBuffer(1, float32Data.length, 16000);
        buffer.getChannelData(0).set(float32Data);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(player.gainNode);

        // Guard 1: nextPlayTime en el pasado (ctx estaba corriendo, chunk llegó tarde)
        // Guard 2: nextPlayTime demasiado en el futuro (ctx estaba CONGELADO por iOS al bloquear)
        //           → acumuló N segundos de audio que el reloj aún no alcanzó
        const MAX_BUFFER_AHEAD_SEC = 1.5;
        if (
            player.nextPlayTime < ctx.currentTime ||
            player.nextPlayTime > ctx.currentTime + MAX_BUFFER_AHEAD_SEC
        ) {
            player.nextPlayTime = ctx.currentTime + 0.05;
        }

        source.start(player.nextPlayTime);
        player.nextPlayTime += buffer.duration;
    } catch (e) {
        console.error("PCM Playback error:", e);
    }
}

/**
 * Limpia todos los estados de audio activos.
 */
function _flushAudioState() {
    streamStates.forEach(state => {
        if (state.nackTimeout) clearTimeout(state.nackTimeout);
    });
    streamStates.clear();
    streamPlayers.forEach(player => {
        if (player && player.gainNode) {
            try { player.gainNode.disconnect(); } catch (e) { }
        }
    });
    streamPlayers.clear();
}

/**
 * Limpieza periódica de flujos inactivos
 */
setInterval(() => {
    const now = Date.now();
    streamStates.forEach((state, streamId) => {
        if (now - state.lastActive > STREAM_TTL) {
            if (state.nackTimeout) clearTimeout(state.nackTimeout);
            streamStates.delete(streamId);
            const player = streamPlayers.get(streamId);
            if (player && player.gainNode) {
                try { player.gainNode.disconnect(); } catch (e) { }
            }
            streamPlayers.delete(streamId);
        }
    });
}, 5000);

/**
 * Configura los escuchadores de Socket.IO para el transporte de audio.
 */
export function setupEliteTransport(socket) {
    // [INGENIERÍA] Protección de Idempotencia: No registrar duplicados
    if (window._eliteTransportSetup) {
        console.warn('⚠️ [AUDIO-CORE] Intento de re-registro de transport (Ignorado)');
        return;
    }
    window._eliteTransportSetup = true;

    // Cuando iPhone desbloquea: descartar audio acumulado durante el bloqueo
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') {
            _flushAudioState();
        }
    });
    socket.on('sync-resp', (data) => {
        const t3 = Date.now();
        const { t0, t1, t2 } = data;
        rtt = (t3 - t0) - (t2 - t1);
        window.serverTimeOffset = ((t1 - t0) + (t2 - t3)) / 2;
        window.serverTimeSynced = true;
    });

    socket.on('audio-stream-chunk', (payload) => {
        // [v60.Elite] No escuchar nada antes de entrar al chat (hybrid check)
        const isJoined = (window.audioState && typeof window.audioState.get === 'function' && window.audioState.get('joinState') === 'JOINED') ||
            (window.currentUsername && document.getElementById('userModal')?.classList.contains('hidden'));
        if (!isJoined) {
            return;
        }

        // --- 🔇 ANTI-ECHO V60: Manejo inteligente de identidad ---
        // 1. Si es nuestro propio stream de micro principal, bloquear para evitar feedback
        if (window.streamingId && payload.streamId === window.streamingId) return;

        // 2. Si es un sub-usuario creado por nosotros (rootUserId === me), 
        // EL USUARIO QUIERE ESCUCHARLO (v60), por lo que NO bloqueamos si es subUserId.
        // Solo bloqueamos si es un stream de root que coincide con nuestro socket.id (redundante con streamingId pero seguro)
        if (!payload.subUserId && payload.rootUserId === socket.id) return;

        // [v60.TTS-FIX] Silenciado en tiempo real de audios extranjeros si el tratamiento es 'mute'
        let streamLang = payload.lang;
        if (!streamLang) {
            const senderObj = window.lastUsersData && window.lastUsersData.find(u => u.username === payload.user);
            if (senderObj) {
                streamLang = senderObj.lang;
            }
        }
        if (streamLang) {
            const isForeignMessage = streamLang !== (window.currentLang || 'es');
            const shouldWaitForTranslation = isForeignMessage && window.hermesTTS && window.hermesTTS.enabled && window.hermesTTS.readForeignAudio;
            const shouldMuteForeignAudio = shouldWaitForTranslation && window.hermesTTS.foreignAudioMode === 'mute';
            if (shouldMuteForeignAudio) {
                return; // Mutear/descartar chunk en tiempo real
            }
        }

        // Filtros (se asumen globales o manejados externamente)
        const AUDIO_FILTER_ALL = '__ALL__';
        const AUDIO_FILTER_ALL_LEGACY = 'all';
        const activeFilters = window.activeFilters || [AUDIO_FILTER_ALL];
        const showAll = activeFilters.includes(AUDIO_FILTER_ALL) ||
            activeFilters.includes(AUDIO_FILTER_ALL_LEGACY) ||
            (window.FILTER_ALL_KEY && activeFilters.includes(window.FILTER_ALL_KEY));
        const isMaster = (payload.rootUser && payload.rootUser.username === 'Master') || payload.user === 'Master';

        if (!showAll && !isMaster && payload.category && !activeFilters.includes(payload.category)) {
            return;
        }

        // Obtener o inicializar estado para este flujo específico (Multiplexing)
        let state = streamStates.get(payload.streamId);
        if (!state) {
            state = {
                expectedSeq: BigInt(payload.seq),
                reorderBuffer: new Map(),
                nackHistory: new Map(),
                nackTimeout: null,
                lastActive: Date.now()
            };
            streamStates.set(payload.streamId, state);
            processedStreamIds.add(payload.streamId);

            if (processedStreamIds.size > 100) {
                const arr = Array.from(processedStreamIds);
                processedStreamIds.clear();
                arr.slice(-100).forEach(id => processedStreamIds.add(id));
            }
        }

        // Verify packet timing (Jitter Buffer safety)
        const serverTimeNow = Date.now() + (window.serverTimeOffset || 0);
        if (payload.timestamp && window.serverTimeSynced && Math.abs(serverTimeNow - payload.timestamp) > 5000) {
            console.warn(`🕒 [AUDIO-CORE] Descartando paquete fuera de ventana temporal: delta=${serverTimeNow - payload.timestamp}ms`);
            return;
        }

        // Reset TTL
        state.lastActive = Date.now();

        // 3. Jitter Buffer / Reorder Logic
        const seq = BigInt(payload.seq);
        if (seq < state.expectedSeq) {
            // Late packet - already played or skipped
            return;
        }

        state.reorderBuffer.set(seq, payload);
        processReorderBuffer(socket, payload.streamId);
        // Emit remote vumeter event for UI: compute RMS from a subset of samples to avoid CPU spikes
        try {
            if (payload && payload.chunk && payload.subUserId) {
                // payload.chunk is an ArrayBuffer (Int16)
                const arr = new Int16Array(payload.chunk);
                // Sample up to first 2048 samples to compute quick RMS
                const sampleCount = Math.min(arr.length, 2048);
                let sum = 0;
                for (let i = 0; i < sampleCount; i += Math.max(1, Math.floor(sampleCount / 256))) {
                    const v = arr[i] / 32768.0;
                    sum += v * v;
                }
                const rms = Math.sqrt(sum / Math.max(1, Math.floor(sampleCount / Math.max(1, Math.floor(sampleCount / 256)))));
                // Dispatch lightweight event for UI (rootUserId, subUserId, rms 0..1)
                const ev = new CustomEvent('remote-vu', { detail: { rootUserId: payload.rootUserId || null, subUserId: payload.subUserId || null, rms: Math.min(1, rms) } });
                window.dispatchEvent(ev);
            }
        } catch (e) {
            // non-fatal: don't break audio pipeline
            console.debug('remote-vu calc error:', e.message);
        }
    });

    const triggerSync = () => {
        if (socket && socket.connected) {
            socket.emit('sync-req', Date.now());
        }
    };

    triggerSync();
    if (socket) {
        socket.on('connect', triggerSync);
        socket.on('reconnect', triggerSync);
    }

    setInterval(triggerSync, 30000);
}
