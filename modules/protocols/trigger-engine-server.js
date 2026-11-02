
/**
 * 🎨 TriggerEngine (Server Side) - Motor de animación y ejecución (v60.Elite)
 * 
 * Gestiona interpolación de curvas y ráfagas UDP sin saturar el Wi-Fi.
 */

const EasingFunctions = {
    linear: t => t,
    step: t => t < 1 ? 0 : 1,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: t => t * t * t * t,
    easeOutQuart: t => 1 - (--t) * t * t * t,
    easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t
};

function getValueAtTime(keyframes, timeMs, type = 'osc') {
    if (!keyframes || keyframes.length === 0) return 1.0;
    
    // Ordenar por tiempo
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);
    
    // Si estamos antes del primero
    if (timeMs <= sorted[0].time) return sorted[0].value;
    
    // Si estamos después del último
    if (timeMs >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;
    
    // Encontrar el segmento
    for (let i = 0; i < sorted.length - 1; i++) {
        const start = sorted[i];
        const end = sorted[i+1];
        
        if (timeMs >= start.time && timeMs <= end.time) {
            const range = end.time - start.time;
            if (range === 0) return start.value;
            
            const t = (timeMs - start.time) / range;
            const easing = end.easing || 'linear';
            const easedT = (EasingFunctions[easing] || EasingFunctions.linear)(t);
            
            return start.value + (end.value - start.value) * easedT;
        }
    }
    return 1.0;
}

module.exports = {
    getValueAtTime,
    EasingFunctions
};
