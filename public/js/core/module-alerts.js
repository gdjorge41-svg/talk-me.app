/**
 * 🚨 AlertsModule - Motor de ejecución de alertas personalizadas
 * 
 * Propósito: Ejecutar secuencias de keyframes para Pantalla, Vibración y Linterna.
 * Soporta ejecución en paralelo y maneja las limitaciones de hardware.
 */

import { getAlert, getCurrentUserId } from './alert-storage.js';
import * as Hardware from '../lib/hardware.js';

class AlertsModule {
    constructor() {
        this.activeAlerts = new Set();
        this.flashlightLocked = false;
        this.isFlashlightRunning = false; // Mutex para prevenir colisiones de hardware en mensajes consecutivos
        this.lastFlashlightTime = 0;
        this.FLASHLIGHT_MIN_INTERVAL = 40; // ms mínimos para proteger el sensor sin ahogar ráfagas tácticas cortas
    }

    /**
     * Dispara todas las alertas configuradas para el usuario actual.
     */
    async triggerAll() {
        const uid = getCurrentUserId();
        // [v60] Reportado: Las alertas no se disparaban si la pestaña no tenía el foco absoluto.
        // En entornos industriales o multi-ventana, esto es un problema. Lo eliminamos para mayor fiabilidad.
        const isVisible = true; // Forzamos visibilidad para ejecución garantizada

        const screenEnabled = localStorage.getItem('talkme_screen_alerts') !== 'false';
        const vibeEnabled = localStorage.getItem('talkme_vibration_alerts') !== 'false';
        const flashEnabled = localStorage.getItem('talkme_flashlight_alerts') !== 'false';

        console.log(`🔔 [ALERTS] TriggerAll | UID: ${uid} | Screen: ${screenEnabled} | Vibe: ${vibeEnabled} | Flash: ${flashEnabled}`);

        if (screenEnabled) this.runAlert(uid, 'pantalla');
        if (vibeEnabled) this.runAlert(uid, 'vibracion');
        if (flashEnabled) this.runAlert(uid, 'linterna');
    }

    /**
     * Ejecuta una alerta específica por tipo.
     */
    runAlert(userId, type) {
        // [iOS-WAKE-FIX] Supresión de alertas zombi:
        // Si el teléfono está bloqueado o en background (document.hidden), suprimir alertas visuales (pantalla/linterna)
        // para evitar que se queden congeladas y se disparen desfasadas al desbloquear.
        if (document.hidden && (type === 'pantalla' || type === 'linterna')) {
            console.log(`🛡️ [ALERTS] Omitiendo alerta de ${type}: Teléfono bloqueado/segundo plano.`);
            return;
        }

        console.log(`🔔 [ALERTS] RunAlert | Type: ${type} | User: ${userId}`);
        const config = getAlert(userId, type);
        
        // [v60] Soporte para el nuevo esquema de keyframes del editor
        if (!config || (!config.keyframes && !config.keyframesOpacidad)) {
            // Fallback a comportamiento estándar si no hay config custom
            this.runDefaultAlert(type);
            return;
        }

        if (type === 'pantalla') {
            this.executeScreenAnimation(config);
        } else if (type === 'vibracion') {
            this.executeVibrationAnimation(config);
        } else if (type === 'linterna') {
            this.executeFlashlightAnimation(config);
        }
    }

    /**
     * Ejecución de Animación de Pantalla (Opacidad + Color)
     */
    executeScreenAnimation(config) {
        // Crear un overlay temporal para esta alerta específica (soporte paralelo)
        const overlay = document.createElement('div');
        overlay.className = 'custom-alert-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '200000';
        overlay.style.opacity = '0';
        console.log('🏗️ [ALERTS] Overlay creado y añadido al DOM');
        document.body.appendChild(overlay);

        const duration = config.duration || 3000;
        const startTime = performance.now();

        const animate = (now) => {
            const elapsed = now - startTime;
            if (elapsed > duration) {
                overlay.remove();
                return;
            }

            // 1. Calcular Opacidad (Soporte para esquema unificado o separado)
            const kfO = config.keyframesOpacidad || config.keyframes || [];
            const opacity = this.getValueAtTime(elapsed, kfO, 'value');
            overlay.style.opacity = opacity;

            // 2. Calcular Color (Soporte para esquema unificado o separado)
            const kfC = config.keyframesColor || config.keyframes || [];
            const color = this.getValueAtTime(elapsed, kfC, 'color', '#ffffff');
            overlay.style.backgroundColor = color;

            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    /**
     * Ejecución de Vibración (Pattern-based)
     */
    executeVibrationAnimation(config) {
        const duration = (config.globalDurationSec || 3) * 1000;
        const keyframes = config.keyframes || [];
        if (keyframes.length === 0) return;

        // Convertir keyframes en un patrón de navigator.vibrate si es posible, 
        // o usar un interval para mayor control de tiempo real.
        // Dado que queremos ejecución en paralelo y control preciso, usaremos un loop de sampling.
        
        const startTime = performance.now();
        let lastState = false;

        const interval = setInterval(() => {
            const elapsed = performance.now() - startTime;
            if (elapsed > duration) {
                clearInterval(interval);
                return;
            }

            const val = this.getValueAtTime(elapsed, keyframes, 'value');
            const currentState = val > 0.5;

            if (currentState !== lastState) {
                if (currentState) {
                    Hardware.triggerVibration(1); // Pulso corto o sostenido
                }
                lastState = currentState;
            }
        }, 50); // Sampling cada 50ms para vibración
    }

    /**
     * Ejecución de Linterna (Throttled & Robusta)
     */
    async executeFlashlightAnimation(config) {
        // [Ley de Murphy - Auto-recuperación de Lock del Editor]
        // Si el flag quedó activo pero el modal del editor no está abierto en pantalla, auto-liberar.
        if (window.isFlashlightLockedByEditor) {
            const editorModal = document.getElementById('alertEditorModal');
            const isEditorOpen = editorModal && (editorModal.classList.contains('active') || editorModal.offsetParent !== null);
            if (!isEditorOpen) {
                console.warn("🔦 [ALERTS] Lock de editor huérfano detectado. Auto-liberando cerrojo.");
                window.isFlashlightLockedByEditor = false;
            } else {
                console.log("⚠️ [ALERTS] Ejecución de linterna bloqueada por el Editor Live (Prevención de colisión).");
                return;
            }
        }

        // [Control de concurrencia: Evitar que ráfagas de mensajes saturen la cámara]
        if (this.isFlashlightRunning) {
            console.log("🔦 [ALERTS] Animación de linterna en curso. Omitiendo superposición concurrente.");
            return;
        }

        // [Detección móvil híbrida: Evita falsos negativos en iPads o emuladores táctiles]
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                         (window.innerWidth <= 1024 && ('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)));
        if (!isMobile) {
            console.warn("🔦 [ALERTS] Ejecución de linterna omitida: No es un dispositivo móvil o táctil.");
            return;
        }

        // [Resolución exacta de duración: Soporte tanto para config.duration como para config.globalDurationSec]
        const duration = Number(config.duration) || (Number(config.globalDurationSec) || 1.5) * 1000;
        const keyframes = config.keyframes || [];
        if (keyframes.length === 0) return;

        // [CORRECCIÓN CRÍTICA DE CLAVE]
        // La clave persistida por los ajustes es 'talkme_flashlight_alerts'.
        const isLinternaEnabled = localStorage.getItem('talkme_flashlight_alerts') !== 'false' &&
                                  localStorage.getItem('talkme_flashlight_alerts') !== null;
        if (!isLinternaEnabled) {
            console.log("🔦 [ALERTS] Linterna desactivada en ajustes. Omitiendo solicitud de permisos de cámara.");
            return;
        }

        this.isFlashlightRunning = true;
        let stream = null;
        let track = null;
        let interval = null;
        let safetyTimeout = null;

        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            }).catch(err => {
                console.warn("🔦 [ALERTS] Error al solicitar cámara trasera para linterna:", err.message || err);
                return null;
            });

            if (!stream) {
                console.warn("🔦 [ALERTS] No se pudo activar linterna: Permiso denegado o hardware ocupado.");
                return;
            }

            track = stream.getVideoTracks()[0];
            if (!track) {
                console.warn("🔦 [ALERTS] No se encontró track de video disponible.");
                return;
            }

            // Comprobar soporte de Torch en tiempo real
            const caps = track.getCapabilities ? track.getCapabilities() : {};
            if (!caps.torch) {
                console.warn("🔦 [ALERTS] El hardware de cámara actual no soporta Torch.");
                return;
            }

            const applyTorch = async (on) => {
                const now = performance.now();
                if (now - this.lastFlashlightTime < this.FLASHLIGHT_MIN_INTERVAL) return;
                
                try {
                    if (track && track.readyState === 'live') {
                        await track.applyConstraints({ advanced: [{ torch: on }] });
                        this.lastFlashlightTime = now;
                    }
                } catch (e) {
                    console.debug("🔦 [ALERTS] Error al aplicar torch:", e.message);
                }
            };

            // [Sincronización exacta]: El reloj inicia SOLO después de que el hardware está listo
            const startTime = performance.now();
            let lastState = false;

            // [ANTI-MURPHY: Compilación de Timeline a Eventos Discretos de Hardware]
            // En vez de adivinar con un setInterval periódico (que causa submuestreo de Nyquist y omite pulsos),
            // compilamos la secuencia exacta de transiciones (ON/OFF) respetando 'hold' y comportamiento 'step'.
            const timeline = this.compileFlashlightTimeline(keyframes, duration);
            console.log(`🔦 [ALERTS] Timeline compilado: ${timeline.length} transiciones para ${duration}ms`, timeline);

            const activeTimers = [];

            await new Promise((resolve) => {
                // Temporizador de seguridad máximo: Garantiza que la linterna se apague incondicionalmente
                safetyTimeout = setTimeout(async () => {
                    resolve();
                }, duration + 300);

                // Programamos cada transición en su milisegundo exacto respecto al inicio
                timeline.forEach((event, index) => {
                    const delay = Math.max(0, event.timeMs);
                    const timer = setTimeout(async () => {
                        if (track && track.readyState === 'live') {
                            await applyTorch(event.state);
                            lastState = event.state;
                        }
                        // Si es el último evento del timeline, finalizamos
                        if (index === timeline.length - 1) {
                            resolve();
                        }
                    }, delay);
                    activeTimers.push(timer);
                });

                if (timeline.length === 0) {
                    resolve();
                }
            });

            // Limpiar timers pendientes si resolvió antes
            activeTimers.forEach(t => clearTimeout(t));

        } catch (fatalErr) {
            console.error("❌ [ALERTS] Error fatal en ciclo de linterna:", fatalErr);
        } finally {
            // [Ley de Murphy - Garantía incondicional de apagado y liberación de recursos]
            if (safetyTimeout) clearTimeout(safetyTimeout);

            if (track) {
                try {
                    if (track.readyState === 'live') {
                        await track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
                    }
                } catch (_) {}
                try {
                    track.stop();
                } catch (_) {}
            }

            if (stream) {
                try {
                    stream.getTracks().forEach(t => t.stop());
                } catch (_) {}
            }

            this.isFlashlightRunning = false;
            console.log("🔦 [ALERTS] Secuencia de linterna completada y hardware liberado.");
        }
    }

    /**
     * [PARIDAD MATEMÁTICA 1:1 CON EL EDITOR]
     * Evalúa el valor exacto de un keyframe en un momento dado usando la misma
     * fórmula matemática, soporte de tramos, hold y 'step' forzado que el Editor Gráfico.
     */
    getEditorValueAt(time, keyframes, type = 'linterna') {
        if (!keyframes || keyframes.length === 0) return 0;

        const kfs = [...keyframes].sort((a, b) => a.time - b.time);
        let i = 0;
        while (i < kfs.length - 1 && kfs[i + 1].time < time) i++;

        const kf = kfs[i];
        if (time < kf.time) return Number(kf.value) || 0;

        const nextKf = kfs[i + 1];
        if (!nextKf || time > nextKf.time) return Number(kf.value) || 0;

        // Cálculo de Intensidad con soporte de hold y forceStep (Paridad con alert-editor.js:645-660)
        let finalVal = Number(kf.value) || 0;
        const currentHoldInt = Number(kf.hold) || 0;
        if (time >= kf.time + currentHoldInt) {
            const segmentDurationInt = nextKf.time - (kf.time + currentHoldInt);
            if (segmentDurationInt > 0) {
                const tInt = (time - (kf.time + currentHoldInt)) / segmentDurationInt;
                const forceStep = type !== 'pantalla';
                const easingToUse = forceStep ? 'step' : (nextKf.easing || 'linear');
                const factorIntens = this.getEasingValue(easingToUse, tInt);
                finalVal = (Number(kf.value) || 0) + ((Number(nextKf.value) || 0) - (Number(kf.value) || 0)) * factorIntens;
            } else {
                finalVal = Number(nextKf.value) || 0;
            }
        }

        return finalVal;
    }

    getEasingValue(easing, t) {
        switch (easing) {
            case 'linear': return t;
            case 'easeIn': return t * t;
            case 'easeOut': return t * (2 - t);
            case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            case 'step': return t < 1.0 ? 0 : 1;
            default: return t;
        }
    }

    /**
     * [ANTI-MURPHY & PRECISIÓN DETERMINISTA 1:1]
     * Muestrea la función del editor a pasos de 10ms y detecta las transiciones
     * reales de flanco de subida y bajada. Garantiza paridad absoluta con lo que
     * el usuario ve y escucha en la previsualización del lienzo.
     */
    compileFlashlightTimeline(keyframes, totalDurationMs) {
        if (!keyframes || keyframes.length === 0) return [];

        const STEP_MS = 10; // Resolución temporal de 10ms (100 Hz, superior a cualquier driver móvil)
        const rawTransitions = [];
        let previousState = null;

        for (let t = 0; t <= totalDurationMs; t += STEP_MS) {
            const val = this.getEditorValueAt(t, keyframes, 'linterna');
            const currentState = val > 0.5;

            if (currentState !== previousState) {
                rawTransitions.push({ timeMs: t, state: currentState });
                previousState = currentState;
            }
        }

        // Garantizar siempre apagado al término de la animación
        if (previousState === true) {
            rawTransitions.push({ timeMs: totalDurationMs, state: false });
        }

        // [Filtro de Viabilidad Física de Driver Móvil (Ley de Murphy)]:
        // Si el usuario diseñó un pulso menor a 40ms, aseguramos que el LED tenga
        // al menos 40ms de pulso visible para que el driver de la cámara no lo descarte.
        const cleanTimeline = [];
        let lastState = null;
        let lastScheduledTime = -100;

        for (let i = 0; i < rawTransitions.length; i++) {
            const tr = rawTransitions[i];
            if (tr.state !== lastState) {
                const scheduledTime = Math.max(tr.timeMs, lastScheduledTime + 40);
                cleanTimeline.push({ timeMs: scheduledTime, state: tr.state });
                lastState = tr.state;
                lastScheduledTime = scheduledTime;
            }
        }

        return cleanTimeline;
    }

    /**
     * Helper para obtener el valor interpolado en un momento dado.
     * Sincronizado con el motor del Editor (soporta hold).
     */
    getValueAtTime(timeMs, keyframes, property, defaultValue = 0) {
        if (!keyframes || keyframes.length === 0) return defaultValue;
        
        const sorted = [...keyframes].sort((a, b) => a.time - b.time);
        
        if (timeMs <= sorted[0].time) return sorted[0][property];
        if (timeMs >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1][property];

        for (let i = 0; i < sorted.length - 1; i++) {
            const kfA = sorted[i];
            const kfB = sorted[i + 1];
            
            if (timeMs >= kfA.time && timeMs <= kfB.time) {
                // Soporte para HOLD: Si estamos dentro del tiempo de espera, mantenemos el valor A
                const hold = kfA.hold || 0;
                if (timeMs < kfA.time + hold) {
                    return kfA[property];
                }

                // Interpolación desde el final del HOLD hasta el tiempo de B
                const startTime = kfA.time + hold;
                const range = kfB.time - startTime;
                
                if (range <= 0) return kfB[property];
                
                const t = (timeMs - startTime) / range;
                
                if (property === 'color') {
                    return this.lerpColor(kfA[property], kfB[property], t);
                }
                
                const easedT = this.applyEasing(t, kfB.easing || kfA.easing || 'linear');
                const valA = Number(kfA[property]);
                const valB = Number(kfB[property]);
                return valA + (valB - valA) * easedT;
            }
        }
        return defaultValue;
    }

    lerpColor(a, b, t) {
        if (!a || !b) return a || b || '#ffffff';
        try {
            const ah = parseInt(a.replace(/#/g, ''), 16),
                ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
                bh = parseInt(b.replace(/#/g, ''), 16),
                br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
                rr = ar + t * (br - ar),
                rg = ag + t * (bg - ag),
                rb = ab + t * (bb - ab);
            return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
        } catch(e) { return a; }
    }

    applyEasing(t, easing) {
        switch (easing) {
            case 'linear': return t;
            case 'easeInQuad': return t * t;
            case 'easeOutQuad': return t * (2 - t);
            case 'easeInOutQuad': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            case 'step': return t < 1.0 ? 0 : 1;
            default: return t;
        }
    }

    runDefaultAlert(type) {
        console.log(`🔔 [ALERTS] RunDefaultAlert | Type: ${type}`);
        if (type === 'pantalla') {
            // [v60] Ingeniería Experta: Usar el motor de animación propio en lugar de clases CSS
            // Esto garantiza que la alerta se vea por encima de cualquier contenedor (z-index alto).
            this.executeScreenAnimation({
                duration: 1000,
                keyframesOpacidad: [
                    { time: 0, value: 0.5, easing: 'easeOutQuad' },
                    { time: 1000, value: 0, easing: 'linear' }
                ],
                keyframesColor: [
                    { time: 0, color: 'rgba(123, 104, 238, 0.4)' }
                ]
            });
            console.log(`✨ [ALERTS] Flash de pantalla por defecto ejecutado vía Overlay`);
        } else if (type === 'vibracion') {
            Hardware.triggerVibration(1);
        } else if (type === 'linterna') {
            if (window.isFlashlightLockedByEditor) {
                const editorModal = document.getElementById('alertEditorModal');
                const isEditorOpen = editorModal && (editorModal.classList.contains('active') || editorModal.offsetParent !== null);
                if (!isEditorOpen) {
                    window.isFlashlightLockedByEditor = false;
                } else {
                    return;
                }
            }
            Hardware.requestFlashlightLED(6);
        }
    }
}

export const Alerts = new AlertsModule();
window.AlertsExecutor = Alerts; // Exponer globalmente para fácil acceso
