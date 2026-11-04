/**
 * ============================================================================
 * TALK-ME â€” TWO-FINGER PUSH-TO-TALK / TOGGLE
 * ============================================================================
 *
 * MÃ³dulo independiente que activa PTT o toggle de micrÃ³fono cuando el usuario
 * coloca 2 dedos simultÃ¡neamente en cualquier parte de la pantalla.
 *
 * Comportamiento segÃºn modo:
 *   - Modo PTT: mantener 2 dedos = hablar, soltar = parar (push-to-talk)
 *   - Modo VAD: pulsar 2 dedos y soltar = toggle micrÃ³fono on/off
 *
 * DiseÃ±o:
 *   - Pointer Events como API primaria (pointerType === 'touch')
 *   - Touch Events como fallback automÃ¡tico
 *   - Debounce 120ms con umbral de movimiento para diferenciar de pinch-zoom
 *   - Grace period de 250ms en release para tolerar levantamientos momentÃ¡neos
 *   - Todos los listeners son { passive: true } â€” no bloquea scroll ni gestos
 *   - Solo se activa en dispositivos tÃ¡ctiles, ignorado en desktop
 *
 * PatrÃ³n: InyecciÃ³n de dependencias
 *   Recibe callbacks â€” no conoce nada del sistema PTT ni del micrÃ³fono.
 *
 * @version 1.2.0
 * ============================================================================
 */

(function () {
    'use strict';

    /**
     * Inicializa el sistema Two-Finger Push-to-Talk / Toggle.
     *
     * @param {Object}   config
     * @param {Function} config.startTalk   - Callback al activar PTT (modo PTT: hold)
     * @param {Function} config.stopTalk    - Callback al soltar PTT (modo PTT: release)
     * @param {Function} config.toggleTalk  - Callback para toggle (modo VAD: tap)
     * @param {Function} config.getMode     - Retorna 'ptt' o 'vad'
     * @param {Function} config.canActivate - Retorna true si el gesto puede activarse
     * @returns {{ destroy: Function }}       Handle de cleanup
     */
    window.initTwoFingerPTT = function (config) {
        var startTalk = config.startTalk;
        var stopTalk = config.stopTalk;
        var toggleTalk = config.toggleTalk;
        var getMode = config.getMode;
        var canActivate = config.canActivate;

        // =====================================================================
        // DETECCIÃ“N DE DISPOSITIVO â€” Solo activar en tÃ¡ctiles
        // =====================================================================
        var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (!isTouchDevice) {
            return { destroy: function () { } };
        }

        var usePointerEvents = (window.PointerEvent !== undefined);

        // =====================================================================
        // ESTADO INTERNO
        // =====================================================================

        /** Map<pointerId, {x, y}> â€” punteros tÃ¡ctiles activos */
        var activePointers = new Map();

        /** Timestamp del primer dedo colocado */
        var firstFingerTime = 0;

        /** Timer de debounce de activaciÃ³n */
        var debounceTimer = null;

        /** Posiciones iniciales al comenzar el debounce */
        var debounceStartPositions = null;

        /** Timer de grace period para release (evita cortes por levantamientos momentÃ¡neos) */
        var releaseTimer = null;

        /** Flag: gesto de 2 dedos confirmado y activo */
        var isActive = false;

        /** Modo capturado en el momento de activaciÃ³n ('ptt' o 'vad') */
        var activatedMode = null;

        // =====================================================================
        // CONSTANTES
        // =====================================================================

        /** Ambos dedos deben llegar dentro de esta ventana (ms) */
        var TEMPORAL_WINDOW = 250;

        /** Tiempo de confirmaciÃ³n antes de activar (ms) */
        var DEBOUNCE_MS = 120;

        /** Movimiento mÃ¡ximo permitido durante debounce (px) â€” filtra pinch-zoom */
        var MOVE_THRESHOLD = 20;

        /**
         * Grace period antes de ejecutar release en modo PTT (ms).
         * Tolera levantamientos momentÃ¡neos de un dedo, que son
         * extremadamente comunes en interacciÃ³n multitÃ¡ctil.
         * Si el dedo vuelve dentro de esta ventana, el PTT continÃºa.
         */
        var RELEASE_GRACE_MS = 250;

        // =====================================================================
        // LÃ“GICA DE ACTIVACIÃ“N
        // =====================================================================

        function handlePointerAdd(id, x, y, pointerType) {
            if (pointerType !== 'touch') return;

            activePointers.set(id, { x: x, y: y });

            // Si volvemos a 2+ dedos, cancelar cualquier release pendiente
            if (activePointers.size >= 2 && releaseTimer) {
                clearTimeout(releaseTimer);
                releaseTimer = null;
            }

            if (activePointers.size === 1) {
                firstFingerTime = Date.now();
            }

            if (activePointers.size === 2 && !isActive) {
                tryStartDebounce();
            }
        }

        function handlePointerMove(id, x, y, pointerType) {
            if (pointerType !== 'touch') return;
            var p = activePointers.get(id);
            if (p) {
                p.x = x;
                p.y = y;
            }
        }

        // =====================================================================
        // LÃ“GICA DE DESACTIVACIÃ“N (con grace period)
        // =====================================================================

        function handlePointerRemove(id) {
            activePointers.delete(id);

            if (activePointers.size < 2) {
                // Cancelar debounce de activaciÃ³n pendiente
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                    debounceTimer = null;
                    debounceStartPositions = null;
                }

                if (isActive) {
                    if (activatedMode === 'ptt') {
                        // Modo PTT: aplicar grace period antes de soltar
                        // Esto tolera que un dedo se levante brevemente
                        schedulePTTRelease();
                    } else if (activatedMode === 'vad') {
                        // Modo VAD: toggle se ejecuta al soltar (sin grace period)
                        isActive = false;
                        activatedMode = null;
                        toggleTalk();
                    }
                }

                // Actualizar timestamp si queda 1 dedo
                firstFingerTime = activePointers.size === 1 ? Date.now() : 0;
            }
        }

        /**
         * Programa la liberaciÃ³n del PTT con un grace period.
         * Si el dedo vuelve antes de RELEASE_GRACE_MS, se cancela la liberaciÃ³n
         * y el PTT continÃºa sin interrupciÃ³n (gestionado en handlePointerAdd).
         */
        function schedulePTTRelease() {
            // Ya hay un release pendiente â€” no duplicar
            if (releaseTimer) return;

            releaseTimer = setTimeout(function () {
                releaseTimer = null;

                // Verificar que realmente seguimos con < 2 dedos y PTT activo
                if (isActive && activePointers.size < 2) {
                    var mode = activatedMode;
                    isActive = false;
                    activatedMode = null;
                    stopTalk();
                }
            }, RELEASE_GRACE_MS);
        }

        // =====================================================================
        // DEBOUNCE DE ACTIVACIÃ“N
        // =====================================================================

        function tryStartDebounce() {
            if (isActive) return;
            if (debounceTimer) return;

            // Verificar ventana temporal
            var elapsed = Date.now() - firstFingerTime;
            if (elapsed > TEMPORAL_WINDOW) return;

            // Verificar condiciÃ³n externa
            if (canActivate && !canActivate()) return;

            // Capturar posiciones iniciales para verificar movimiento
            debounceStartPositions = new Map();
            activePointers.forEach(function (pos, id) {
                debounceStartPositions.set(id, { x: pos.x, y: pos.y });
            });

            debounceTimer = setTimeout(function () {
                debounceTimer = null;

                if (activePointers.size < 2) {
                    debounceStartPositions = null;
                    return;
                }

                if (hasExceededMovement()) {
                    debounceStartPositions = null;
                    return;
                }

                if (canActivate && !canActivate()) {
                    debounceStartPositions = null;
                    return;
                }

                // Capturar modo actual en el momento de confirmaciÃ³n
                var currentMode = getMode ? getMode() : 'ptt';
                debounceStartPositions = null;
                isActive = true;
                activatedMode = currentMode;

                if (currentMode === 'ptt') {
                    startTalk();
                } else {
                }
            }, DEBOUNCE_MS);
        }

        /**
         * Comprueba si los punteros se han movido mÃ¡s de MOVE_THRESHOLD
         * desde el inicio del debounce. Diferencia "mantener 2 dedos" de "pinch-zoom".
         */
        function hasExceededMovement() {
            if (!debounceStartPositions) return false;
            var exceeded = false;
            debounceStartPositions.forEach(function (startPos, id) {
                var current = activePointers.get(id);
                if (!current) { exceeded = true; return; }
                var dx = current.x - startPos.x;
                var dy = current.y - startPos.y;
                if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD) {
                    exceeded = true;
                }
            });
            return exceeded;
        }

        // =====================================================================
        // POINTER EVENTS (API Principal)
        // =====================================================================

        function onPointerDown(e) {
            // [v60.Elite] Ignorar gestos si el usuario esta interactuando con controles especificos
            if (e.target && e.target.closest('.text-input, .btn-send, .btn-attach, .talkme-select, .input-wave-container, .input-area')) {
                return;
            }
            handlePointerAdd(e.pointerId, e.clientX, e.clientY, e.pointerType);
        }

        function onPointerMove(e) {
            handlePointerMove(e.pointerId, e.clientX, e.clientY, e.pointerType);
        }

        function onPointerUp(e) {
            handlePointerRemove(e.pointerId);
        }

        function onPointerCancel(e) {
            handlePointerRemove(e.pointerId);
        }

        // =====================================================================
        // TOUCH EVENTS (Fallback)
        // =====================================================================

        function onTouchStart(e) {
            // [v60.Elite] Ignorar en controles tacticos especificos
            if (e.target && e.target.closest('.text-input, .btn-send, .btn-attach, .talkme-select, .input-wave-container, .input-area')) {
                return;
            }
            syncFromTouches(e.touches);
            if (activePointers.size === 2 && !isActive) {
                tryStartDebounce();
            }
            // Si volvemos a 2+ dedos, cancelar release pendiente
            if (activePointers.size >= 2 && releaseTimer) {
                clearTimeout(releaseTimer);
                releaseTimer = null;
            }
        }

        function onTouchMove(e) {
            for (var i = 0; i < e.touches.length; i++) {
                var t = e.touches[i];
                var p = activePointers.get(t.identifier);
                if (p) {
                    p.x = t.clientX;
                    p.y = t.clientY;
                }
            }
        }

        function onTouchEnd(e) {
            for (var i = 0; i < e.changedTouches.length; i++) {
                handlePointerRemove(e.changedTouches[i].identifier);
            }
        }

        function onTouchCancel(e) {
            for (var i = 0; i < e.changedTouches.length; i++) {
                handlePointerRemove(e.changedTouches[i].identifier);
            }
        }

        /**
         * Sincroniza el Map desde la lista nativa de touches.
         */
        function syncFromTouches(touches) {
            var wasEmpty = activePointers.size === 0;

            activePointers.clear();
            for (var i = 0; i < touches.length; i++) {
                activePointers.set(touches[i].identifier, {
                    x: touches[i].clientX,
                    y: touches[i].clientY
                });
            }

            if (wasEmpty && activePointers.size >= 1) {
                firstFingerTime = Date.now();
            }
        }

        // =====================================================================
        // REGISTRO DE LISTENERS
        // =====================================================================

        if (usePointerEvents) {
            document.addEventListener('pointerdown', onPointerDown, { passive: true });
            document.addEventListener('pointermove', onPointerMove, { passive: true });
            document.addEventListener('pointerup', onPointerUp, { passive: true });
            document.addEventListener('pointercancel', onPointerCancel, { passive: true });
        } else {
            document.addEventListener('touchstart', onTouchStart, { passive: true });
            document.addEventListener('touchmove', onTouchMove, { passive: true });
            document.addEventListener('touchend', onTouchEnd, { passive: true });
            document.addEventListener('touchcancel', onTouchCancel, { passive: true });
        }

        // =====================================================================
        // CLEANUP
        // =====================================================================

        function destroy() {
            if (debounceTimer) clearTimeout(debounceTimer);
            if (releaseTimer) clearTimeout(releaseTimer);
            if (isActive && activatedMode === 'ptt') { stopTalk(); }
            isActive = false;
            activatedMode = null;
            activePointers.clear();
            debounceStartPositions = null;

            if (usePointerEvents) {
                document.removeEventListener('pointerdown', onPointerDown);
                document.removeEventListener('pointermove', onPointerMove);
                document.removeEventListener('pointerup', onPointerUp);
                document.removeEventListener('pointercancel', onPointerCancel);
            } else {
                document.removeEventListener('touchstart', onTouchStart);
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
                document.removeEventListener('touchcancel', onTouchCancel);
            }
        }

        return { destroy: destroy };
    };

})();


