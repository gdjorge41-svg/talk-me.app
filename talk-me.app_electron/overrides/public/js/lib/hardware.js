/**
 * @file hardware.js
 * @description Módulo de control de hardware (Vibración, Linterna) con detección de capacidades.
 */

export const capabilities = {
    vibration: false,
    flashlight: false,
    midi: false,
    lastFlashlightStream: null
};

/**
 * [v60.Elite] MASTER HANDSHAKE: Unificación de permisos de hardware.
 * Solicita Micrófono, Cámara (Linterna) y MIDI de forma centralizada al entrar.
 * @returns {Promise<boolean>} True si se concedieron los permisos esenciales.
 */
export async function solicitarPermisosChat() {
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    console.log('🛡️ [HARDWARE] Iniciando Master Handshake de permisos...');
    
    const results = {
        granted: false,
        audio: false,
        video: false,
        midi: false
    };

    try {
        // 1. INTENTO COMBO (Micrófono + Cámara)
        // En iOS, pedir ambos a la vez garantiza que la linterna sea instantánea después.
        let audioConstraint = true;
        try {
            const preferredId = localStorage.getItem('talkme_preferred_audio_input') || localStorage.getItem('talkme_deviceId');
            let tempLabel = localStorage.getItem('talkme_preferred_audio_label') || '';
            if (!tempLabel && preferredId && window.lastAudioDevices) {
                const found = window.lastAudioDevices.find(d => d.deviceId === preferredId);
                if (found && found.label) tempLabel = found.label;
            }
            if (typeof window.getEliteConstraints === 'function') {
                const elite = window.getEliteConstraints(preferredId, tempLabel);
                if (elite && elite.audio) {
                    audioConstraint = elite.audio;
                }
            } else {
                const isPro = !tempLabel || /soundgrid|waves|asio|focusrite|scarlett|dante|antelope|madi|motu|rme|presonus|steinberg|behringer|roland|yamaha|uaudio|volt|virtual|vb-audio|cable|vac|voicemeeter|hi-fi/i.test(tempLabel);
                if (isPro) {
                    audioConstraint = {
                        deviceId: preferredId ? { exact: preferredId } : undefined,
                        channelCount: { ideal: 32 },
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    };
                } else if (preferredId) {
                    audioConstraint = {
                        deviceId: { exact: preferredId }
                    };
                }
            }
        } catch (e) {
            console.warn('⚠️ [HARDWARE] Error construyendo constraints en Handshake:', e);
        }

        const constraints = { audio: audioConstraint };

        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            results.audio = true;
            results.video = false;
            results.granted = true;

            // Warm-up de linterna si hay video
            if (stream && stream.getVideoTracks().length > 0) {
                const track = stream.getVideoTracks()[0];
                const caps = track.getCapabilities ? track.getCapabilities() : {};
                if (caps.torch) {
                    console.log('🔦 [HARDWARE] Warm-up de linterna detectado y listo.');
                    capabilities.flashlight = true;
                }
                stream.getTracks().forEach(t => t.stop());
            }
        } catch (comboErr) {
            console.warn('⚠️ [HARDWARE] Combo fallido, intentando solo audio...', comboErr.message);
            // 2. FALLBACK: Solo Audio
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint });
            results.audio = true;
            results.video = false;
            results.granted = true;
            audioStream.getTracks().forEach(t => t.stop());
        }

        // 3. MIDI (Opcional)
        if (navigator.requestMIDIAccess) {
            try {
                await navigator.requestMIDIAccess();
                results.midi = true;
                capabilities.midi = true;
            } catch (e) { }
        }

        // 4. NOTIFICACIONES
        if ('Notification' in window && Notification.permission !== 'granted') {
            try { await Notification.requestPermission(); } catch(e) {}
        }

        return results;
    } catch (err) {
        console.error('❌ [HARDWARE] Error total en Master Handshake:', err.message);
        return results;
    }
}

/**
 * Detecta las capacidades de hardware del dispositivo actual.
 * @returns {Promise<Object>} Las capacidades detectadas.
 */
export async function detectCapabilities() {
    // 1. Detección de Vibración
    capabilities.vibration = 'vibrate' in navigator;

    // 2. Detección de Linterna (Torch)
    // Requiere acceso a la cámara, por lo que suele detectarse tras el primer permiso de audio/video.
    // Intentamos detectar sin pedir permisos explícitos aquí para no ser intrusivos.
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some(d => d.kind === 'videoinput');
        
        if (hasVideo && isMobile) {
            // Nota: En iOS/Chrome, la única forma real de saber si hay torch es intentar abrir el track.
            // Para la detección inicial, nos basamos en si existe al menos una cámara.
            capabilities.flashlight = true; 
        }
    } catch (e) {
        console.warn('⚠️ No se pudo enumerar dispositivos para linterna:', e.message);
    }

    return capabilities;
}

/**
 * Activa la linterna (LED físico) bajo demanda para ahorrar batería.
 * Abre la cámara, flashea y la cierra inmediatamente.
 */
export async function requestFlashlightLED(flashes = 6) {
    if (document.visibilityState !== 'visible') return false; // [v60] Seguridad: Evitar si pantalla bloqueada
    if (window.isFlashlightLockedByEditor) return false; // [v60] Bloqueo desde Editor Live
    
    let stream = null;
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    try {
        // [v60.Elite] CASCADA OPTIMIZADA: Preferir el modo ya validado en el Handshake
        const constraintTiers = [
            { video: { facingMode: 'environment' } }, // iPhone Standard
            { video: { facingMode: { exact: 'environment' } } },
            { video: true } 
        ];

        for (const constraints of constraintTiers) {
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (stream) break;
            } catch (err) {
                console.debug(`🔦 Perfil de cámara fallido:`, constraints, err.message);
                continue;
            }
        }

        if (!stream) throw new Error('No se pudo acceder a ninguna cámara.');
        
        const track = stream.getVideoTracks()[0];
        if (!track) throw new Error('No hay track de video');

        const caps = track.getCapabilities ? track.getCapabilities() : {};
        
        // Ejecutar secuencia de flasheo
        let count = 0;
        const interval = setInterval(async () => {
            try {
                // Comprobar si el track sigue vivo
                if (track.readyState === 'ended') {
                    clearInterval(interval);
                    return;
                }

                await track.applyConstraints({
                    advanced: [{ torch: count % 2 === 0 }]
                }).catch(() => {});

                count++;
                if (count >= flashes) {
                    clearInterval(interval);
                    await track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
                    track.stop(); // CIERRE CRÍTICO: Batería 0% al terminar
                }
            } catch (err) {
                clearInterval(interval);
                track.stop();
            }
        }, 150);

        return true;
    } catch (e) {
        if (stream) stream.getTracks().forEach(t => t.stop());
        console.error('❌ Error linterna LED:', e.message);
        return false;
    }
}

/**
 * Ejecuta una vibración basada en un valor normalizado (0-1).
 */
export function triggerVibration(value) {
    if (!value || document.visibilityState !== 'visible') return; // [v60] Seguridad: Evitar si pantalla bloqueada

    // 1. Android/Chrome nativo
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(value * 100); 
    }

    // 2. [Hito v46.4.9] iPhone Hápticos Tácticos (Legacy fallback)
    // Dispara los elementos invisibles que el iPhone interpreta como respuesta táctica en PWAs
    const hapticIds = ['hapticL1', 'hapticL2', 'hapticL3'];
    hapticIds.forEach((id, index) => {
        setTimeout(() => {
            const label = document.getElementById(id);
            if (label) {
                // El clic en el label del hapticSwitch activa el haptic nativo en iOS PWAs
                label.click();
                console.debug('📳 iPhone Haptic triggered:', id);
            }
        }, index * 180);
    });
}

/**
 * Ejecuta un patrón de vibración complejo.
 */
export function vibratePattern(pattern) {
    if (!capabilities.vibration || !pattern) return;
    navigator.vibrate(pattern);
}

/**
 * Mapea un valor normalizado (0-1) recibido del motor de Triggers a los actuadores.
 */
export async function handleHardwareTrigger(hardwareType, value) {
    if (hardwareType === 'flashlight' && value > 0.5) {
        const success = await requestFlashlightLED();
        if (!success && typeof window.triggerScreenFlash === 'function') {
            window.triggerScreenFlash();
        }
    } else if (hardwareType === 'vibration') {
        triggerVibration(value);
    }
}

