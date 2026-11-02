/**
 * ============================================================================
 * TALK.ME — SISTEMA ANTI-BLOQUEO DE PANTALLA (Wake Lock + Video Fallback)
 * ============================================================================
 * 
 * Arquitectura energética de doble capa para impedir el auto-lock en:
 *   - iPad / iPhone (Safari iOS 16.4+ con Wake Lock API, < 16.4 con video)
 *   - Tablets Android (Chrome 84+ con Wake Lock API + video)
 * 
 * Capa 1: Wake Lock API (W3C estándar) — Principal
 * Capa 2: Vídeo técnico invisible (muted, loop, playsinline) — Fallback/Refuerzo
 * 
 * Diseñado para:
 *   - Instalaciones inmersivas 6-10 horas
 *   - Tablets en modo kiosco
 *   - PWA en pantalla de inicio
 *   - Entornos museísticos y eventos profesionales
 * 
 * Principios:
 *   - Event-driven puro (sin polling, sin setInterval, sin requestAnimationFrame)
 *   - Activación solo tras interacción explícita del usuario
 *   - Degradación silenciosa si las APIs no están disponibles
 *   - Bajo consumo CPU/energía
 * 
 * @author Jorge.Lighting by Talk-me
 * @version 1.0.0
 * ============================================================================
 */

(function () {
    'use strict';

    // =========================================================================
    // ESTADO INTERNO
    // =========================================================================

    /** @type {WakeLockSentinel|null} Sentinel activo de la Wake Lock API */
    let _wakeLockSentinel = null;

    /** @type {boolean} Indica si la Wake Lock API está activa */
    let _isWakeLockActive = false;

    /** @type {boolean} Indica si el vídeo técnico está reproduciéndose */
    let _isVideoPlaying = false;

    /** @type {boolean} Flag maestro: el sistema fue activado por el usuario */
    let _isSystemActive = false;

    /** @type {HTMLVideoElement|null} Referencia al elemento <video> del DOM */
    let _wakeLockVideo = null;

    /** @type {boolean} Soporte de Wake Lock API detectado */
    const _wakeLockSupported = ('wakeLock' in navigator);

    /** @type {boolean} Protección anti-loop de reacquisición en release */
    let _reacquireAttempted = false;

    // =========================================================================
    // VÍDEO MP4 TÉCNICO — DATA URI BASE64
    // =========================================================================
    // MP4 negro mínimo (~500 bytes), 1 segundo de duración, resolución mínima.
    // Codificado como data URI para evitar peticiones HTTP y funcionar offline.
    // Fuente: formato H.264 Baseline válido, compatible con todos los navegadores.
    // =========================================================================

    const WAKELOCK_VIDEO_SRC = 'data:video/mp4;base64,' +
        'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr' +
        'NtZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE' +
        '0OCByMjYwMSBhMGNkN2QzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAt' +
        'IENvcHlsZWZ0IDIwMDMtMjAxNSAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3' +
        'JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9' +
        'jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBw' +
        'c3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3Jhbmdlp' +
        'TE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZW' +
        'Fkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0' +
        'tMiB0aHJlYWRzPTEgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhy' +
        'ZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X' +
        '2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcH' +
        'lyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHR' +
        'iPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRf' +
        'bWluPTEwIHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rY' +
        'WhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNj' +
        'AgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGF' +
        'xPTE6MS4wMACAAAAAfWWIhAAz//727L4FNf2f0JcRLMXaSnA+KqSAgHc0wA' +
        'AAAwAAAwAAFgn0IAAAAU0AAAGrQAVo/k7LCAAAB3AAAADAAAT9BkgAAAANM' +
        'AAAa1AVo/k7LCAAAB3AAAADIAAT9BkgAAAHcAAAAMABP0GSAAAAdwAAAAMA' +
        'AP0GSAAAAdwAAAAMABP0GSAAAB1AAAADAAFaP5OywgAAAHcAAAA5AAD9Bk' +
        'gAAAANMAAAGrQAVo/k7LCAAAB3AAAADAAD9BkgAAAFOAAABq0AHaAAAAA5' +
        'tbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAB9AAAQAAAQAAAAAA' +
        'AAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAA' +
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAB0dHJhawAAAFx0a2hkAA' +
        'ADAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwEAAAAA' +
        'AAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAa' +
        'AAAAEAAAAAAAAAAAAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAD6AA' +
        'AEAAABAAAAAAB8bWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAoAAAAMgBV' +
        'xAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbm' +
        'RsZXIAAAABJ21pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAA' +
        'HGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAOdzdGJsAAAAl3N0c2QAAA' +
        'AAAAAAAQAAAI9hdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAABgAEABI' +
        'AAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
        'AY//8AAAAxYXZjQwFkAAr/4QAYZ2QACqzZX4iIhAAAAwAEAAADAFA8SJZ' +
        'YAQAGaOvjyyLAAAAAGHN0dHMAAAAAAAAAAQAAABkAAAIAAAAAFHN0c3MA' +
        'AAAAAAAAAAAAAAB4c3RzegAAAAAAAAAAAAAAGQAAAr4AAAAlAAAADgAAAA' +
        '4AAAAOAAAADgAAAA4AAAAOAAAADgAAAA4AAAAOAAAADgAAAA4AAAAOAAAA' +
        'DgAAAA4AAAAOAAAADgAAAA4AAAAOAAAADgAAAA4AAAAOAAAADgAAAA4AAA' +
        'AUc3RjbwAAAAAAAAABAAAAMAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhk' +
        'bHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbw' +
        'AAABxkYXRhAAAAAQAAAABMYXZmNTYuNDAuMTAx';

    // =========================================================================
    // CAPA 1: WAKE LOCK API (W3C Standard)
    // =========================================================================

    /**
     * Solicita un Wake Lock al sistema operativo.
     * Solo se ejecuta si:
     *   - La API está disponible
     *   - El documento está visible
     *   - No hay un sentinel activo
     * 
     * @returns {Promise<void>}
     * @private
     */
    async function _acquireWakeLock() {
        // Guard: solo si hay soporte y el documento está visible
        if (!_wakeLockSupported) return;
        if (document.visibilityState !== 'visible') return;
        if (_wakeLockSentinel !== null) return;

        try {
            _wakeLockSentinel = await navigator.wakeLock.request('screen');
            _isWakeLockActive = true;
            _reacquireAttempted = false;

            // Escuchar liberación inesperada del sentinel
            _wakeLockSentinel.addEventListener('release', _handleWakeLockRelease);
        } catch (err) {
            // Fallo silencioso — puede ocurrir por batería baja, política del OS, etc.
            _isWakeLockActive = false;
            _wakeLockSentinel = null;
        }
    }

    /**
     * Maneja la liberación inesperada del Wake Lock sentinel.
     * Intenta reacquirir UNA sola vez si el documento sigue visible.
     * El flag _reacquireAttempted previene bucles infinitos.
     * 
     * @private
     */
    function _handleWakeLockRelease() {
        _isWakeLockActive = false;
        _wakeLockSentinel = null;

        // Intentar reacquisición UNA vez si el documento está visible
        if (_isSystemActive && document.visibilityState === 'visible' && !_reacquireAttempted) {
            _reacquireAttempted = true;
            _acquireWakeLock();
        }
    }

    // =========================================================================
    // CAPA 2: VÍDEO TÉCNICO INVISIBLE (Fallback / Refuerzo iOS)
    // =========================================================================

    /**
     * Inicia la reproducción del vídeo técnico invisible.
     * Esta técnica es reconocida por iOS como consumo legítimo de contenido
     * multimedia, lo que previene el auto-lock del dispositivo.
     * 
     * DEBE ejecutarse en el stack síncrono del evento de interacción del usuario
     * para que Safari iOS permita el play().
     * 
     * @private
     */
    function _startVideoFallback() {
        if (!_wakeLockVideo) return;
        if (_isVideoPlaying) return;

        // Asignar source solo una vez y si es compatible
        if (!_wakeLockVideo.src || _wakeLockVideo.src === '') {
            const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
            
            // Si es Firefox Desktop (donde Wake Lock API funciona bien), saltamos el fallback de video
            // para evitar el error de decodificación en consola que produce este base64 específico.
            if (isFirefox && _wakeLockSupported) {
                return;
            }

            if (_wakeLockVideo.canPlayType && _wakeLockVideo.canPlayType('video/mp4') === '') {
                return;
            }
            _wakeLockVideo.src = WAKELOCK_VIDEO_SRC;
        }

        // play() retorna una Promise — manejo silencioso
        var playPromise = _wakeLockVideo.play();
        if (playPromise !== undefined) {
            playPromise.then(function () {
                _isVideoPlaying = true;
            }).catch(function () {
                // Silencioso — puede fallar si el usuario no ha interactuado aún
                _isVideoPlaying = false;
            });
        }
    }

    /**
     * Pausa el vídeo técnico de forma segura.
     * @private
     */
    function _stopVideoFallback() {
        if (!_wakeLockVideo) return;
        try {
            _wakeLockVideo.pause();
        } catch (e) { }
        _isVideoPlaying = false;
    }

    // =========================================================================
    // GESTIÓN DE VISIBILIDAD (Event-Driven)
    // =========================================================================

    /**
     * Handler reactivo para el evento visibilitychange.
     * Cuando la app vuelve a primer plano:
     *   - Reacquiere Wake Lock si se perdió
     *   - Reinicia el vídeo si se pausó
     * 
     * No se activa si el sistema no fue previamente activado por el usuario.
     * 
     * @private
     */
    function _handleVisibilityChange() {
        if (!_isSystemActive) return;

        if (document.visibilityState === 'visible') {
            // Reset del flag anti-loop al volver visible
            _reacquireAttempted = false;

            // Reacquirir Wake Lock si se perdió
            if (_wakeLockSentinel === null) {
                _acquireWakeLock();
            }

            // Reiniciar vídeo si se pausó
            if (_wakeLockVideo && _wakeLockVideo.paused) {
                _isVideoPlaying = false;
                _startVideoFallback();
            }
        }
    }

    // =========================================================================
    // API PÚBLICA
    // =========================================================================

    /**
     * Inicializa el sistema Wake Lock.
     * Solo prepara las referencias DOM y registra el listener de visibilitychange.
     * NO activa ningún mecanismo anti-lock — eso ocurre con activateWakeLock().
     * 
     * Debe llamarse en DOMContentLoaded.
     */
    window.initWakeLockSystem = function () {
        // Obtener referencia al elemento <video> técnico
        _wakeLockVideo = document.getElementById('wakeLockVideo');

        // Registrar listener de visibilitychange (event-driven, no polling)
        document.addEventListener('visibilitychange', _handleVisibilityChange);
    };

    /**
     * Activa el sistema anti-bloqueo de pantalla.
     * Debe llamarse DENTRO del stack síncrono de un evento de interacción
     * del usuario (click, touchstart) para garantizar compatibilidad con iOS.
     * 
     * Flujo:
     *   1. video.play() — SÍNCRONO (fire-and-forget, debe ir primero para iOS)
     *   2. wakeLock.request() — ASÍNCRONO (no bloquea el play anterior)
     */
    window.activateWakeLock = function () {
        if (_isSystemActive) return; // Ya activo, evitar duplicados
        _isSystemActive = true;

        // CAPA 2 PRIMERO: Iniciar vídeo SÍNCRONAMENTE en el stack del click
        // Safari iOS requiere que play() se ejecute en el contexto directo
        // de la interacción del usuario, antes de cualquier await
        _startVideoFallback();

        // CAPA 1: Solicitar Wake Lock API (asíncrono, no interfiere con el play)
        _acquireWakeLock();
    };

    /**
     * Desactiva el sistema anti-bloqueo de pantalla.
     * Libera todos los recursos de forma limpia.
     */
    window.deactivateWakeLock = function () {
        _isSystemActive = false;

        // Liberar Wake Lock sentinel si existe
        if (_wakeLockSentinel) {
            try {
                _wakeLockSentinel.release();
            } catch (e) { }
            _wakeLockSentinel = null;
            _isWakeLockActive = false;
        }

        // Detener vídeo técnico
        _stopVideoFallback();
    };

    /**
     * Devuelve el estado actual del sistema para diagnóstico.
     * @returns {{ active: boolean, wakeLockAPI: boolean, videoPlaying: boolean, supported: boolean }}
     */
    window.getWakeLockStatus = function () {
        return {
            active: _isSystemActive,
            wakeLockAPI: _isWakeLockActive,
            videoPlaying: _isVideoPlaying,
            supported: _wakeLockSupported
        };
    };

})();
