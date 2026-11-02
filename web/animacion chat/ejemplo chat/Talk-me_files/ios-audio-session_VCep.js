/**
 * ============================================================================
 * TALK.ME — IOS AUDIO SESSION KEEPER  v2.0
 * ============================================================================
 *
 * Problema resuelto:
 *   En iOS (Safari), cuando el usuario bloquea la pantalla, el sistema
 *   suspende el AudioContext si no existe una sesión de audio activa
 *   reconocida por el OS. Esto provocaba silencio total al recibir audio.
 *
 * LECCIÓN v1.0 → v2.0:
 *   La v1.0 creaba un AudioContext PROPIO (_keepAliveCtx) para el oscilador
 *   de silencio. Esto causaba que iOS tuviera DOS contextos compitiendo:
 *     - _keepAliveCtx (keep-alive)
 *     - audioContext  (micrófono + AudioWorklet VAD)
 *   iOS solo reconoce una sesión primaria → el AudioWorklet quedaba throttled
 *   → los chunks PCM en tiempo real llegaban cortados.
 *
 * Solución v2.0 — UN SOLO CONTEXTO:
 *   En lugar de crear un AudioContext propio, el módulo SE ENGANCHA al
 *   `audioCtx` del Elite Transport (window._eliteAudioCtx) o al `audioContext`
 *   del micrófono (window.audioContext) en cuanto estén disponibles.
 *   El oscilador de silencio se adjunta al contexto YA EXISTENTE, sin crear
 *   ninguno nuevo. Cero conflictos de sesión en iOS.
 *
 * Mecanismo:
 *   1. MediaSession API → declara la app como "reproductor activo" (principal)
 *   2. Silence oscillator → adjuntado al AudioContext existente, mantiene
 *      el thread de audio del kernel activo con volumen 0.0001 (inaudible)
 *   3. Heartbeat cada 5s → rescata contextos suspendidos y mantiene
 *      MediaSession en 'playing'
 *   4. visibilitychange → rescate triple al desbloquear (0ms, 300ms, 1000ms)
 *
 * Principios:
 *   - NUNCA crea un AudioContext propio (eso rompía el AudioWorklet)
 *   - Solo se activa tras gesto explícito del usuario (join-chat, mic, PTT)
 *   - Idempotente: llamadas repetidas son no-ops seguros
 *   - Degradación silenciosa si las APIs no están disponibles
 *
 * @author Talk-me Audio Session System
 * @version 2.0.0 — Single AudioContext (no conflict with AudioWorklet)
 * ============================================================================
 */

(function () {
    'use strict';

    // =========================================================================
    // ESTADO INTERNO
    // =========================================================================

    /** @type {boolean} Flag: el sistema ha sido activado por el usuario */
    let _isActive = false;

    /** @type {boolean} Si ya adjuntamos el oscilador de silencio al ctx */
    let _silenceAttached = false;

    /** @type {AudioBufferSourceNode|null} Fuente de silencio adjunta al ctx */
    let _silenceSource = null;

    /** @type {GainNode|null} Nodo de ganancia a nivel mínimo en el ctx */
    let _silenceGain = null;

    /** @type {AudioContext|null} Referencia al contexto donde adjuntamos el silencio */
    let _attachedCtx = null;

    /** @type {number|null} ID del intervalo de heartbeat */
    let _heartbeatInterval = null;

    /** @type {HTMLAudioElement|null} Elemento de audio de silencio (respaldo iOS) */
    let _silentAudioEl = null;

    // WAV mínimo de silencio (46 bytes): la forma más fiable de declarar
    // una sesión de audio activa en iOS aunque JS esté throttleado por el OS.
    const _SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

    /** @type {boolean} Soporte de MediaSession API */
    const _hasMediaSession = ('mediaSession' in navigator);

    /** @type {boolean} Detectar iOS */
    const _isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    // =========================================================================
    // UTILIDADES
    // =========================================================================

    /**
     * Rescata un AudioContext suspendido o interrumpido.
     * @param {AudioContext} ctx
     * @param {string} name
     * @private
     */
    function _resumeCtx(ctx, name) {
        if (!ctx) return;
        if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
            ctx.resume().then(function () {
            }).catch(function () {});
        }
    }

    /**
     * Rescata todos los AudioContexts conocidos del sistema.
     * Accede a las variables globales de script.js de forma segura.
     * @private
     */
    function _rescueAllContexts() {
        // AudioContext del Elite Transport PCM (audioCtx en script.js)
        if (window._eliteAudioCtx) {
            _resumeCtx(window._eliteAudioCtx, 'audioCtx (Elite)');
        }
        // AudioContext del micrófono/VAD (audioContext en script.js)
        if (window.audioContext) {
            _resumeCtx(window.audioContext, 'audioContext (VAD/Mic)');
        }
    }

    // =========================================================================
    // CAPA 1: SILENCE OSCILLATOR (ADJUNTO AL CONTEXTO EXISTENTE)
    // =========================================================================

    /**
     * Busca el AudioContext del Elite Transport (receptor PCM) y le adjunta
     * un buffer de silencio en loop.
     *
     * IMPORTANTE: Solo se adjunta a window._eliteAudioCtx (lado receptor).
     * NUNCA a window.audioContext (micrófono/AudioWorklet) porque correr un
     * BufferSource en el mismo hilo que el AudioWorklet de captura puede
     * causar irregularidades en el scheduling de los chunks PCM → audio
     * cortado al enviar desde iOS.
     *
     * Si _eliteAudioCtx no existe aún (es lazy-created), el heartbeat
     * reintentará periódicamente hasta que esté disponible.
     * @private
     */
    function _tryAttachSilence() {
        if (_silenceAttached) return;

        // SOLO el contexto del Elite Transport (receptor) — nunca el del mic
        const ctx = window._eliteAudioCtx || null;
        if (!ctx || ctx.state === 'closed') return;

        try {
            // Si el contexto está suspendido, intentar resumirlo primero
            if (ctx.state === 'suspended') {
                ctx.resume().catch(function () {});
                return; // Reintentar en el próximo tick del heartbeat
            }

            // --- 🛡️ EXTREME SILENCE GAIN (Neutralized to 0) ---
            // Un valor de 0 es el máximo estándar de silencio. El nodo conectado 
            // basta para que el OS mantenga activa la sesión de audio.
            _silenceGain = ctx.createGain();
            _silenceGain.gain.setValueAtTime(0, ctx.currentTime);
            _silenceGain.connect(ctx.destination);

            // Buffer de 2 segundos de silencio puro (Float32Array de ceros)
            const sampleRate = ctx.sampleRate;
            const buffer = ctx.createBuffer(1, sampleRate * 2, sampleRate);

            _silenceSource = ctx.createBufferSource();
            _silenceSource.buffer = buffer;
            _silenceSource.loop = true; // Loop infinito
            _silenceSource.connect(_silenceGain);
            _silenceSource.start(0);

            _attachedCtx = ctx;
            _silenceAttached = true;

            // Escuchamos cambios de visibilidad para enmudecer el oscilador en primer plano
            // Pero manteniéndolo "activo" para que el OS no suspenda la sesión.
            document.addEventListener('visibilitychange', function() {
                if (_silenceGain && _attachedCtx) {
                    const targetGain = document.hidden ? 0.000001 : 0;
                    _silenceGain.gain.setTargetAtTime(targetGain, _attachedCtx.currentTime, 0.1);
                }
            });


        } catch (e) {
            console.warn('\uD83D\uDD0A iOS AudioSession: No se pudo adjuntar silencio aún:', e.message);
        }
    }

    // =========================================================================
    // CAPA 1b: HTML AUDIO ELEMENT SILENTE (Respaldo iOS garantizado)
    // =========================================================================

    /**
     * Inicia un HTMLAudioElement reproduciendo silencio en loop.
     * Este mecanismo es más fiable que el oscilador AudioContext cuando iOS
     * throttlea JavaScript en background (pantalla bloqueada) porque el
     * elemento <audio> es gestionado directamente por el sistema operativo.
     * @private
     */
    function _startSilentAudioElement() {
        if (_silentAudioEl) return; // Ya activo
        try {
            _silentAudioEl = new Audio(_SILENT_WAV);
            _silentAudioEl.loop = true;
            _silentAudioEl.volume = 0.001; // Prácticamente inaudible
            _silentAudioEl.setAttribute('playsinline', '');
            _silentAudioEl.play().then(function () {
            }).catch(function (e) {
                // Falla en algunos navegadores sin gesto previo (normal)
                console.warn('\uD83D\uDD0A iOS AudioSession: AudioElement no pudo iniciarse:', e.message);
                _silentAudioEl = null;
            });
        } catch (e) {
            console.warn('\uD83D\uDD0A iOS AudioSession: No se pudo crear AudioElement:', e.message);
            _silentAudioEl = null;
        }
    }

    /**
     * Si el contexto al que estábamos adjuntos cambia (p.ej. se recreó),
     * resetea el estado para que el heartbeat lo reintente con el nuevo ctx.
     * @private
     */
    function _checkCtxIntegrity() {
        if (!_silenceAttached || !_attachedCtx) return;

        // Si el contexto adjunto fue cerrado, resetear para reintento
        if (_attachedCtx.state === 'closed') {
            console.log('\uD83D\uDD0A iOS AudioSession: ctx adjunto cerrado, buscando nuevo...');
            _silenceSource = null;
            _silenceGain = null;
            _attachedCtx = null;
            _silenceAttached = false;
        }
    }

    // =========================================================================
    // CAPA 2: MEDIA SESSION API
    // =========================================================================

    /**
     * Registra la app como reproductor activo en el sistema operativo.
     * iOS usa MediaSession para decidir si mantener el proceso de audio
     * vivo en background.
     * @private
     */
    function _activateMediaSession() {
        if (!_hasMediaSession) return;

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 'Talk-me',
                artist: 'Intercom Activo',
                album: 'Talk-me Walkie-Talkie'
            });

            navigator.mediaSession.playbackState = 'playing';

            // Handlers mínimos requeridos por iOS para no desactivar la sesión
            navigator.mediaSession.setActionHandler('play', function () {
                navigator.mediaSession.playbackState = 'playing';
            });
            navigator.mediaSession.setActionHandler('pause', function () {
                // NO pausamos — walkie-talkie siempre en "playing"
                navigator.mediaSession.playbackState = 'playing';
            });
        } catch (e) {
            console.warn('\uD83D\uDD0A iOS AudioSession: MediaSession no disponible:', e.message);
        }
    }

    // =========================================================================
    // CAPA 3: HEARTBEAT PERIÓDICO
    // =========================================================================

    /**
     * Latido cada 2 segundos (v46.4.9):
     * - Intenta adjuntar el oscilador de silencio si aún no está hecho
     * - Rescata todos los AudioContexts suspendidos
     * - Mantiene MediaSession en 'playing'
     * @private
     */
    function _startHeartbeat() {
        if (_heartbeatInterval) return;
        _heartbeatInterval = setInterval(function () {
            if (!_isActive) return;
            _checkCtxIntegrity();
            if (!_silenceAttached) _tryAttachSilence();
            _rescueAllContexts();
            if (_hasMediaSession) {
                try {
                    if (navigator.mediaSession.playbackState !== 'playing') {
                        navigator.mediaSession.playbackState = 'playing';
                    }
                } catch (e) {}
            }
        }, 2000);
    }

    // =========================================================================
    // CAPA 4: WATCHDOG DE VISIBILIDAD
    // =========================================================================

    /**
     * Rescata todos los contextos inmediatamente al desbloquear la pantalla.
     * Triple rescate con delays para absorber la latencia de iOS al volver.
     * @private
     */
    function _handleVisibilityChange() {
        if (!_isActive) return;

        if (document.visibilityState === 'visible') {
            _rescueAllContexts();
            setTimeout(function () { _rescueAllContexts(); _tryAttachSilence(); }, 300);
            setTimeout(function () { _rescueAllContexts(); }, 1000);

            // Reiniciar el AudioElement si iOS lo mató en background
            if (!_silentAudioEl || _silentAudioEl.paused) {
                _silentAudioEl = null; // Forzar recreación
                _startSilentAudioElement();
            }

            if (_hasMediaSession) {
                try { navigator.mediaSession.playbackState = 'playing'; } catch (e) {}
            }
        }
    }

    // =========================================================================
    // API PÚBLICA
    // =========================================================================

    /**
     * Activa el sistema de mantenimiento de sesión de audio para iOS.
     *
     * DEBE llamarse desde el stack síncrono de un gesto del usuario.
     * Si ya está activo, esta llamada es un no-op seguro (idempotente).
     */
    window.activateIOSAudioSession = function () {
        if (_isActive) return; // Idempotente
        _isActive = true;

        // Capa 2: MediaSession API (no requiere AudioContext propio)
        _activateMediaSession();

        // Capa 1b: HTMLAudioElement de silencio — el método más fiable en iOS para
        // declarar sesión de audio activa cuando JS está throttleado (pantalla bloqueada).
        // Requiere haber sido llamado desde un gesto de usuario (click/touch).
        _startSilentAudioElement();

        // Capa 1: Intentar adjuntar silencio al ctx existente si ya está disponible.
        // Si no, el heartbeat lo reintentará periódicamente.
        _tryAttachSilence();

        // Capa 3: Heartbeat periódico
        _startHeartbeat();

        // Capa 4: Listener de visibilidad
        document.addEventListener('visibilitychange', _handleVisibilityChange);
    };

    /**
     * Desactiva el sistema y libera todos los recursos.
     */
    window.deactivateIOSAudioSession = function () {
        _isActive = false;

        if (_heartbeatInterval) {
            clearInterval(_heartbeatInterval);
            _heartbeatInterval = null;
        }

        if (_silentAudioEl) {
            try { _silentAudioEl.pause(); _silentAudioEl.src = ''; } catch (e) {}
            _silentAudioEl = null;
        }

        if (_silenceSource) {
            try { _silenceSource.stop(0); } catch (e) {}
            _silenceSource = null;
        }

        // NO desconectar _silenceGain del ctx externo — el ctx sigue vivo
        // Solo limpiamos referencias
        _silenceGain = null;
        _attachedCtx = null;
        _silenceAttached = false;

        if (_hasMediaSession) {
            try { navigator.mediaSession.playbackState = 'paused'; } catch (e) {}
        }

        document.removeEventListener('visibilitychange', _handleVisibilityChange);

        console.log('\uD83D\uDD0A iOS AudioSession: DESACTIVADO');
    };

    /**
     * Devuelve el estado para diagnóstico.
     * @returns {{ active: boolean, silenceAttached: boolean, attachedCtxState: string|null, mediaSession: boolean, isIOS: boolean }}
     */
    window.getIOSAudioSessionStatus = function () {
        return {
            active: _isActive,
            silenceAttached: _silenceAttached,
            attachedCtxState: _attachedCtx ? _attachedCtx.state : null,
            mediaSession: _hasMediaSession,
            isIOS: _isIOS
        };
    };

})();
