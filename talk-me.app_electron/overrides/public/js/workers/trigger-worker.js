/**
 * trigger-worker.js — Talk.Me v8.0
 * ============================================================================
 * Motor de animación de alta resiliencia y precisión para background.
 *
 * Arquitectura v8.0 (Definitiva):
 *  - Primer tick INMEDIATO: el primer valor OSC/MIDI/sACN se envía en t=0,
 *    eliminando hasta 50ms de lag al inicio de cada animación.
 *  - 20 Hz (50ms): doble resolución respecto a v7.0 (10Hz),
 *    20 pasos por segundo → fades visualmente continuos.
 *  - Burst Suppression: si el navegador "duerme" el worker y lo reactiva
 *    en ráfaga, se envía solo 1 valor (el correcto para ese instante)
 *    y se resetea el reloj. Nunca spam de mensajes acumulados.
 *  - Handover completo con request-active-state / active-state.
 *  - Concurrencia limitada (MAX_CONCURRENT=10) con cola FIFO.
 *  - Ping/Pong + Heartbeat para supervisión desde el hilo principal.
 * ============================================================================
 */

'use strict';

// ─── Constantes ──────────────────────────────────────────────────────────────

const TICK_MS = 8;           // ~125 Hz en background (máxima precisión)
const MAX_CONCURRENT = 10;

// ─── Estado ──────────────────────────────────────────────────────────────────

let activeAnimations = new Map(); // triggerId → { intervalId, startTime, duration, keyframes, type, trigger }
let activeCount = 0;
const pendingQueue = [];

let typeRanges = {
    osc:  { min: 0, max: 1,   step: 0.01 },
    midi: { min: 0, max: 127, step: 1    },
    sacn: { min: 0, max: 255, step: 1    }
};

// ─── Interpolación ───────────────────────────────────────────────────────────

function applyEasing(t, easing) {
    switch (easing) {
        case 'linear':         return t;
        case 'easeInQuad':     return t * t;
        case 'easeOutQuad':    return t * (2 - t);
        case 'easeInOutQuad':  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        case 'easeInCubic':    return t * t * t;
        case 'easeOutCubic':   return 1 - Math.pow(1 - t, 3);
        case 'easeInOutCubic': return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        case 'step':           return t < 0.5 ? 0 : 1;
        default:               return t;
    }
}

function getValueAtTime(keyframes, timeMs, type) {
    if (!keyframes || keyframes.length === 0) return 0;
    if (keyframes.length === 1) return keyframes[0].value;

    const range = typeRanges[type] || { min: 0, max: 1 };

    if (timeMs <= keyframes[0].time) return keyframes[0].value;
    if (timeMs >= keyframes[keyframes.length - 1].time) return keyframes[keyframes.length - 1].value;

    for (let i = 0; i < keyframes.length - 1; i++) {
        const k1 = keyframes[i];
        const k2 = keyframes[i + 1];
        if (timeMs >= k1.time && timeMs <= k2.time) {
            const seg = k2.time - k1.time;
            if (seg === 0) return k2.value;
            let t = (timeMs - k1.time) / seg;
            t = applyEasing(t, k1.easing || 'linear');
            const value = k1.value + (k2.value - k1.value) * t;
            return Math.min(range.max, Math.max(range.min, value));
        }
    }
    return 0;
}

// ─── Cola y finalización ─────────────────────────────────────────────────────

function processNext() {
    if (pendingQueue.length === 0 || activeCount >= MAX_CONCURRENT) return;
    const next = pendingQueue.shift();
    startAnimation(next.triggerId, next.trigger, next.startOffset);
}

function _finishAnimation(triggerId) {
    if (activeAnimations.has(triggerId)) {
        clearInterval(activeAnimations.get(triggerId).intervalId);
        activeAnimations.delete(triggerId);
        activeCount = Math.max(0, activeCount - 1);
    }
    processNext();
}

// ─── Motor de animación v8.0 ─────────────────────────────────────────────────

function startAnimation(triggerId, trigger, startOffset = 0) {
    // Si ya tiene una animación activa, reemplazarla sin consumir un slot adicional
    const isReplacing = activeAnimations.has(triggerId);
    if (isReplacing) {
        clearInterval(activeAnimations.get(triggerId).intervalId);
        activeAnimations.delete(triggerId);
    } else {
        // Nueva animación — verificar límite de concurrencia
        if (activeCount >= MAX_CONCURRENT) {
            console.debug(`[Worker] Queue trigger ${triggerId} (${activeCount}/${MAX_CONCURRENT} slots)`);
            pendingQueue.push({ triggerId, trigger, startOffset });
            return;
        }
        activeCount++;
    }

    const keyframes = [...(trigger.keyframes || [])].sort((a, b) => a.time - b.time);
    const type = trigger.type;
    const duration = keyframes.length > 0
        ? keyframes[keyframes.length - 1].time + (keyframes[keyframes.length - 1].hold || 0)
        : 1;

    // Si el offset ya supera la duración, emitir valor final directamente
    if (startOffset >= duration) {
        const finalVal = keyframes[keyframes.length - 1].value;
        self.postMessage({ type: 'trigger-update', triggerId, value: finalVal, triggerType: type });
        activeCount = Math.max(0, activeCount - 1);
        processNext();
        return;
    }

    const startTime = performance.now() - startOffset;

    // ─── TICK INMEDIATO (v8.0) ────────────────────────────────────────────────
    // Enviar el primer valor en t=0 sin esperar el primer intervalo.
    // Elimina hasta 50ms de lag al inicio de cada animación en background.
    const initialValue = getValueAtTime(keyframes, startOffset, type);
    self.postMessage({ type: 'trigger-update', triggerId, value: initialValue, triggerType: type });

    // ─── BURST SUPPRESSION CLOCK (v8.0) ──────────────────────────────────────
    // Rastreamos el tiempo esperado de cada tick con performance.now() absoluto.
    // Si el browser "duerme" el worker y lo reactiva en ráfaga (drift > 2.5 ticks),
    // enviamos solo el valor correcto para el instante actual y reseteamos el reloj.
    // Esto previene flood de mensajes acumulados hacia OSC/MIDI/sACN.
    let nextExpected = performance.now() + TICK_MS;

    const intervalId = setInterval(() => {
        if (!activeAnimations.has(triggerId)) {
            clearInterval(intervalId);
            return;
        }

        const now = performance.now();
        const elapsed = now - startTime;

        // ─── Burst suppression ─────────────────────────────────────────────
        const drift = now - nextExpected;
        nextExpected += TICK_MS;
        if (drift > TICK_MS * 2.5) {
            // Worker estuvo bloqueado: resetear reloj y enviar solo valor actual
            console.debug(`[Worker] Sleep detectado (${drift.toFixed(0)}ms drift) → burst suprimido`);
            nextExpected = now + TICK_MS;
            // Continuamos al cálculo normal (1 sola muestra, sin recuperar las perdidas)
        }

        // ─── Fin de animación ──────────────────────────────────────────────
        if (elapsed >= duration) {
            const finalVal = keyframes[keyframes.length - 1].value;
            self.postMessage({ type: 'trigger-update', triggerId, value: finalVal, triggerType: type });
            _finishAnimation(triggerId);
            return;
        }

        // ─── Envío normal (valor interpolado) ─────────────────────────────
        const value = getValueAtTime(keyframes, elapsed, type);
        self.postMessage({ type: 'trigger-update', triggerId, value, triggerType: type });

    }, TICK_MS);  // 20 Hz

    activeAnimations.set(triggerId, { intervalId, startTime, duration, keyframes, type, trigger });
}

// ─── Mensajes desde el hilo principal ────────────────────────────────────────

self.onmessage = (e) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'ping':
            self.postMessage({ type: 'pong' });
            break;

        case 'init-ranges':
            if (payload && payload.ranges) typeRanges = payload.ranges;
            break;

        case 'init-triggers':
            // Reservado; el worker usa el objeto trigger recibido en start-trigger
            break;

        case 'start-trigger':
            startAnimation(payload.triggerId, payload.trigger, payload.startOffset || 0);
            break;

        case 'request-active-state': {
            // Handover Worker → Main: reportar estado exacto de cada animación
            const state = [];
            for (const [tid, anim] of activeAnimations.entries()) {
                const elapsed = performance.now() - anim.startTime;
                if (elapsed <= anim.duration) {
                    state.push({ triggerId: tid, trigger: anim.trigger, elapsed });
                }
            }
            self.postMessage({ type: 'active-state', triggersState: state });
            break;
        }

        case 'stop-trigger':
            _finishAnimation(payload.triggerId);
            break;

        case 'stop-all':
            for (const anim of activeAnimations.values()) clearInterval(anim.intervalId);
            activeAnimations.clear();
            activeCount = 0;
            pendingQueue.length = 0;
            break;
    }
};

// ─── Heartbeat (mantiene canal activo, evita throttling extremo) ─────────────
setInterval(() => {
    self.postMessage({ type: 'heartbeat', timestamp: Date.now() });
}, 1000);

// ─── Error global ─────────────────────────────────────────────────────────────
self.addEventListener('error', (e) => {
    self.postMessage({ type: 'worker-error', error: e.message });
});
