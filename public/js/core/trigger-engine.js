/**
 * @file trigger-engine.js
 * @description Motor de triggers (MIDI, OSC, sACN) de Talk-me. Gestión de animaciones y workers.
 */

// --- Estado global del motor ---
export let triggersEnabled = true;
export let triggerWorker = null;
export let workerReady = false;
export let midiAccess = null;
export let midiOutputPort = null;
export let midiInputPorts = new Map();
let _serverTriggers = [];
let _localTriggers = [];
export { _serverTriggers as serverTriggers, _localTriggers as localTriggers };
export { _serverTriggers, _localTriggers }; // Expuesto para lógica interna

export let currentUsername = '';
export const activeAnimations = new Map();
const firedSessions = new Set();

export const ranges = {
    midi: { min: 0, max: 127 },
    osc: { min: 0, max: 1 },
    sacn: { min: 0, max: 255 }
};

const TRIGGERS_ENABLED_KEY_PREFIX = 'talkme_triggers_enabled_v1';

// --- Setters para interoperabilidad con script.js ---
export function setServerTriggers(data) {
    _serverTriggers = data;
}

export function setLocalTriggers(data) {
    _localTriggers = data;
}

export function setTriggersEnabled(val) {
    triggersEnabled = val;
}

export function setCurrentUsername(name) {
    currentUsername = name;
}

/**
 * Inicializa el Web Worker para procesamiento en segundo plano.
 */
export function initTriggerWorker() {
    if (typeof Worker === 'undefined') {
        console.warn('⚠️ Web Workers no soportados. Usando motor rAF fallback.');
        return;
    }
    if (triggerWorker) return; 

    try {
        // RUTA ACTUALIZADA A LA NUEVA ESTRUCTURA
        triggerWorker = new Worker('./js/workers/trigger-worker.js');
        workerReady = false;

        triggerWorker.postMessage({ type: 'init-ranges', payload: { ranges: ranges } });

        triggerWorker.onmessage = (e) => {
            const { type, triggerId, value, triggerType, error, triggersState } = e.data;

            switch (type) {
                case 'pong':
                case 'heartbeat':
                    workerReady = true;
                    break;

                case 'trigger-update': {
                    const trigger = getMergedTriggers().find(t => t.id === triggerId);
                    if (trigger) sendTriggerValue(trigger, value, triggerType);
                    break;
                }

                case 'active-state':
                    for (const { triggerId: id, trigger, elapsed } of (triggersState || [])) {
                        if (triggerWorker) {
                            triggerWorker.postMessage({ type: 'stop-trigger', payload: { triggerId: id } });
                        }
                        activeAnimations.set(id, { source: 'worker' });
                        const fullTrigger = getMergedTriggers().find(t => t.id === id) || trigger;
                        if (fullTrigger) executeKeyframeAnimation(fullTrigger, elapsed);
                    }
                    break;

                case 'worker-error':
                    console.error('❌ Trigger Worker Error:', error);
                    triggerWorker.terminate();
                    triggerWorker = null;
                    workerReady = false;
                    setTimeout(initTriggerWorker, 5000);
                    break;
            }
        };

        setInterval(() => {
            if (!triggerWorker || !document.hidden) return;
            triggerWorker.postMessage({ type: 'ping' });
            const prevReady = workerReady;
            workerReady = false;
            setTimeout(() => {
                if (!workerReady && document.hidden) {
                    console.warn('⚠️ Worker no responde — reiniciando');
                    triggerWorker.terminate();
                    triggerWorker = null;
                    initTriggerWorker();
                }
            }, 2000);
        }, 5000);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden && triggerWorker) {
                activeAnimations.forEach((animData, id) => {
                    if (animData.source === 'main' && animData.startTime) {
                        const elapsed = performance.now() - animData.startTime;
                        if (typeof animData.cancel === 'function') animData.cancel();
                        const trigger = getMergedTriggers().find(t => t.id === id);
                        if (trigger) {
                            triggerWorker.postMessage({
                                type: 'start-trigger',
                                payload: { triggerId: id, trigger, startOffset: elapsed }
                            });
                            activeAnimations.set(id, { source: 'worker' });
                        }
                    }
                });
            } else if (!document.hidden && triggerWorker && workerReady) {
                triggerWorker.postMessage({ type: 'request-active-state' });
            }
        });

    } catch (err) {
        console.error('❌ Error inicializando trigger worker:', err);
    }
}

/**
 * Envía el valor de un trigger a través de la red (MIDI, OSC o sACN).
 */
export function sendTriggerValue(trigger, value, typeOverride = null) {
    const actualType = typeOverride || trigger.type;
    const safeEmit = window.safeEmit || (() => {});

    try {
        if (actualType === 'midi') {
            const rounded = Math.round(value);
            const cfg = trigger.midi || {};
            if (cfg.subtype === 'cc') {
                const ch = Math.max(0, Math.min(15, (cfg.channel || 1) - 1));
                const c = Math.max(0, Math.min(127, cfg.note || 0));
                
                const outputs = Array.from(midiAccess?.outputs?.values() || []);
                const port = outputs.find(o => o.id === cfg.deviceId) || outputs[0];

                if (port) {
                    port.send([0xB0 | ch, c, Math.max(0, Math.min(127, rounded))]);
                }
            } else {
                sendMIDIRaw(cfg.channel || 1, cfg.note || 60, rounded, cfg.deviceId);
            }
        } else if (actualType === 'osc') {
            // [v60.Elite] OPTIMIZACIÓN QUIRÚRGICA: 
            // Si hay socket conectado, NO enviamos ráfagas OSC desde el cliente.
            // El servidor procesa el trigger OUT y dispara el UDP directamente a nuestra IP.
            if (window.socket && window.socket.connected) return;

            if (!trigger.osc?.host || !trigger.osc?.port || !trigger.osc?.address) return;
            safeEmit('trigger-osc', {
                host: trigger.osc.host,
                port: parseInt(trigger.osc.port),
                address: trigger.osc.address,
                args: [{ type: 'f', value: value }]
            });
        } else if (actualType === 'sacn') {
            // [v60.Elite] OPTIMIZACIÓN QUIRÚRGICA: sACN delegado al servidor
            if (window.socket && window.socket.connected) return;

            if (!trigger.sacn?.universe) return;
            
            if (!trigger.sacn._channelsCache) {
                 trigger.sacn._channelsCache = trigger.sacn.channels ? 
                    (typeof trigger.sacn.channels === 'string' ? JSON.parse(trigger.sacn.channels) : trigger.sacn.channels) 
                    : [];
            }

            const sacnPayload = {
                universe: trigger.sacn.universe,
                priority: trigger.sacn.priority || 100,
                mode: trigger.sacn.mode || 'multicast',
                destinationIp: trigger.sacn.destinationIp || '',
                channels: trigger.sacn.channels ? trigger.sacn._channelsCache : []
            };
            if (sacnPayload.channels.length === 0) return;
            sacnPayload.channels.forEach(ch => ch.value = Math.max(0, Math.min(255, Math.round(value))));
            safeEmit('trigger-sacn', sacnPayload);
        }
    } catch (e) {
        console.error('❌ Error en red de trigger:', e);
    }
}

/**
 * Inicializa el acceso a la API Web MIDI.
 */
export async function initMIDI() {
    if (!navigator.requestMIDIAccess) {
        if (window.audioState) window.audioState.setState({ isMidiRestricted: true });
        return false;
    }

    const isElectron = /Electron/i.test(navigator.userAgent) || !!window.process?.versions?.electron;
    const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(window.location.hostname);
    const isFirefox = navigator.userAgent.includes('Firefox');

    if (!isElectron && isFirefox && isIP) {
        console.warn('🛡️ [Hardware] Firefox detectado en host de IP. WebMIDI deshabilitado proactivamente.');
        if (window.audioState) window.audioState.setState({ isMidiRestricted: true });
        return false;
    }

    try {
        midiAccess = await navigator.requestMIDIAccess({ sysex: true }).catch(() => navigator.requestMIDIAccess());
        if (midiAccess) {
            if (window.audioState) window.audioState.setState({ isMidiRestricted: false });
            refreshMidiOutputs();
            refreshMidiInputs();
            midiAccess.onstatechange = (e) => {
                refreshMidiOutputs();
                refreshMidiInputs();
            };
            return true;
        }
    } catch (e) {
        console.warn('⚠️ [Hardware] Acceso MIDI no disponible o denegado por políticas de navegador:', e.message);
        if (!isElectron && window.audioState) {
            window.audioState.setState({ isMidiRestricted: true });
        }
        return false;
    }
}

/**
 * Actualiza la lista de salidas MIDI disponibles.
 */
export function refreshMidiOutputs() {
    if (!midiAccess) return;
    const outputs = Array.from(midiAccess.outputs.values());
    window._midiOutputs = outputs;
    
    // Unificación de selectores de salida MIDI (OUT Editor)
    ['midiOutputSelect', 'midiDeviceId'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            const prev = select.value;
            select.innerHTML = '';
            outputs.forEach(out => {
                const opt = document.createElement('option');
                opt.value = out.id;
                opt.textContent = out.name;
                select.appendChild(opt);
            });
            if (prev && outputs.some(o => o.id === prev)) select.value = prev;
        }
    });
}

/**
 * [v60] Actualiza la lista de entradas MIDI y configura listeners.
 */
export function refreshMidiInputs() {
    if (!midiAccess) return;
    const inputs = Array.from(midiAccess.inputs.values());
    window._midiInputs = inputs;

    inputs.forEach(input => {
        if (!midiInputPorts.has(input.id)) {
            input.onmidimessage = (msg) => handleIncomingMidi(input, msg);
            midiInputPorts.set(input.id, input);
        }
    });

    // Limpiar puertos desconectados
    for (const id of midiInputPorts.keys()) {
        if (!inputs.find(i => i.id === id)) midiInputPorts.delete(id);
    }
}

/**
 * [v60] Maneja mensajes MIDI entrantes para disparar triggers IN.
 */
function handleIncomingMidi(input, message) {
    const [status, data1, data2] = message.data;
    const type = status & 0xf0;
    const channel = (status & 0x0f) + 1;
    
    // Solo procesamos Note On (0x90) o CC (0xB0)
    if (type !== 0x90 && type !== 0xB0) return;

    const triggers = getMergedTriggers().filter(t => t.direction === 'IN' && t.type === 'midi' && t.enabled);
    
    triggers.forEach(tr => {
        const cfg = tr.external?.midi || {};
        // Validar dispositivo (si no es default), canal y nota/cc
        const deviceMatch = !cfg.deviceId || cfg.deviceId === 'default' || cfg.deviceId === input.id;
        const channelMatch = !cfg.channel || cfg.channel === channel;
        const noteMatch = cfg.note === data1;

        if (deviceMatch && channelMatch && noteMatch) {
            // Disparar si es Note On con velocidad > 0 o si es un CC
            if (type === 0xB0 || (type === 0x90 && data2 > 0)) {
                console.log(`🎹 [MIDI-IN] Trigger matched: ${tr.name} from ${input.name}`);
                if (window.safeEmit) {
                    window.safeEmit('trigger-fire-in', { triggerId: tr.id, val: data2 });
                }
            }
        }
    });
}

/**
 * Envía un mensaje MIDI Raw.
 */
export function sendMIDIRaw(channel, note, velocity, deviceId = null) {
    if (!midiAccess) return;
    const outputs = Array.from(midiAccess.outputs.values());
    const selectedId = deviceId || (document.getElementById('midiOutputSelect')?.value) || (document.getElementById('midiDeviceId')?.value);
    let port = outputs.find(o => o.id === selectedId) || outputs[0];
    if (port) {
        const ch = Math.max(0, Math.min(15, (channel || 1) - 1));
        const n = Math.max(0, Math.min(127, note || 60));
        const v = Math.max(0, Math.min(127, velocity || 0));
        port.send([0x90 | ch, n, v]); 
        setTimeout(() => port.send([0x80 | ch, n, 0]), 100);
    }
}

/**
 * Ejecuta una animación de Keyframes utilizando requestAnimationFrame.
 */
export function executeKeyframeAnimation(trigger, startOffset = 0) {
    if (!trigger.keyframes || trigger.keyframes.length === 0) return;

    stopTriggerAnimation(trigger.id);

    let sortedKf = [...trigger.keyframes].sort((a, b) => a.time - b.time);
    let duration = sortedKf[sortedKf.length - 1].time + (sortedKf[sortedKf.length - 1].hold || 0);
    if (duration <= 0) return;

    const maxTimeAnim = duration;
    let startAnimTime = performance.now() - startOffset;
    let isCancelled = false;

    activeAnimations.set(trigger.id, {
        source: 'main',
        trigger: trigger,
        startTime: startAnimTime,
        cancel: () => { isCancelled = true; }
    });

    const animate = (now) => {
        if (isCancelled) return;
        let elapsed = now - startAnimTime;

        if (elapsed > maxTimeAnim) {
            sendTriggerValue(trigger, sortedKf[sortedKf.length - 1].value);
            activeAnimations.delete(trigger.id);
            return;
        }

        let currentVal = 0;
        let found = false;

        for (let i = 0; i < sortedKf.length - 1; i++) {
            const kfA = sortedKf[i];
            const kfB = sortedKf[i + 1];
            const endHold = kfA.time + (kfA.hold || 0);

            if (elapsed >= kfA.time && elapsed <= kfB.time) {
                if (elapsed <= endHold) {
                    currentVal = kfA.value;
                } else {
                    const durationSegment = kfB.time - endHold;
                    if (durationSegment <= 0) {
                        currentVal = kfB.value;
                    } else {
                        const t = (elapsed - endHold) / durationSegment;
                        const easedT = applyEasing(t, kfA.easing);
                        currentVal = kfA.value + (kfB.value - kfA.value) * easedT;
                    }
                }
                found = true;
                break;
            }
        }
        if (found) sendTriggerValue(trigger, currentVal);
        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
}

export function stopTriggerAnimation(id) {
    if (activeAnimations.has(id)) {
        const animData = activeAnimations.get(id);
        if (animData && typeof animData.cancel === 'function') animData.cancel();
        activeAnimations.delete(id);
    }
}

export function applyEasing(t, easing) {
    switch (easing) {
        case 'linear':         return t;
        case 'easeInQuad':     return t * t;
        case 'easeOutQuad':    return t * (2 - t);
        case 'easeInOutQuad':  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        case 'easeInCubic':    return t * t * t;
        case 'easeOutCubic':   return 1 - Math.pow(1 - t, 3);
        case 'easeInOutCubic': return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        case 'step':           return t < 1.0 ? 0 : 1;
        // Compatibilidad con versiones anteriores (v41)
        case 'ease-in':        return t * t;
        case 'ease-out':       return t * (2 - t);
        case 'ease-in-out':    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        default:               return t;
    }
}

// --- Lógica de filtrado y triggers automáticos ---

/**
 * Migra los datos de triggers guardados del formato antiguo al nuevo (por usuario).
 * @param {string} username 
 */
export function migrateTriggersStorage(username) {
    if (!username) return;
    const oldKey = 'talkme_triggers_enabled_v1';
    const newKey = 'talkme_triggers_enabled_v1' + '__' + username;
    const oldData = localStorage.getItem(oldKey);
    // Si hay datos en la clave vieja y la nueva está vacía, migramos
    if (oldData && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, oldData);
        // localStorage.removeItem(oldKey); // Mantener por ahora por seguridad
        console.log("✅ Triggers migrados para el usuario:", username);
    }
}

function getTriggersStorageKey() {
    return TRIGGERS_ENABLED_KEY_PREFIX + (currentUsername ? '__' + currentUsername : '');
}

function getEnabledMap() {
    try { return JSON.parse(localStorage.getItem(getTriggersStorageKey()) || '{}'); }
    catch (e) { return {}; }
}

/**
 * Obtiene una lista de IDs de triggers que el usuario tiene habilitados localmente.
 */
export function getEnabledTriggerIds() {
    const map = getEnabledMap();
    const enabled = [];
    
    // 1. Añadir los marcados explícitamente como TRUE en LocalStorage
    for (const [id, val] of Object.entries(map)) {
        if (val === true) enabled.push(id);
    }
    
    // 2. Si no hay datos (undefined), los triggers (tanto IN como OUT) nacen apagados por defecto.
    // Solo se encenderán si el objeto trigger tiene explícitamente defaultEnabled === true.
    const all = getMergedTriggers(true);
    all.forEach(tr => {
        if (map[tr.id] === undefined && tr.defaultEnabled === true) {
            enabled.push(tr.id);
        }
    });
    
    return enabled;
}

export function setTriggerEnabled(id, value) {
    const map = getEnabledMap();
    map[id] = value;
    localStorage.setItem(getTriggersStorageKey(), JSON.stringify(map));

    // [v60.Elite] Sincronizar estado local con el servidor para ejecución delegada
    const safeEmit = window.safeEmit || (() => {});
    if (typeof safeEmit === 'function') {
        safeEmit('sync-user-trigger-state', { triggerId: id, enabled: value });
        
        if (window.isMaster) {
            safeEmit('update-trigger-default-state', { triggerId: id, enabled: value });
        }
    }
}

/**
 * [v60.Elite] Sincroniza todo el mapa de estados locales con el servidor.
 */
export function syncAllTriggersStateToServer() {
    const map = getEnabledMap();
    const safeEmit = window.safeEmit || (() => {});
    
    // Solo enviamos los que están explícitamente en el mapa (los cambios del usuario)
    Object.entries(map).forEach(([id, enabled]) => {
        safeEmit('sync-user-trigger-state', { triggerId: id, enabled: enabled });
    });
    
    console.log(`📡 [TriggerEngine] Sincronizados ${Object.keys(map).length} estados locales con el servidor.`);
}

export function isTriggerEnabled(id, triggersRef = null) {
    const map = getEnabledMap();
    // 1. Prioridad: Decisión explícita del usuario en LocalStorage
    if (map[id] !== undefined) return map[id] === true;

    // 2. Fallback: Todos los triggers (IN y OUT) nacen apagados por defecto.
    const list = triggersRef || getMergedTriggers(true); // Evitar recursión infinita
    const tr = list.find(t => t.id === id);
    if (!tr) return false;

    // Solo se encienden si vienen explícitamente con defaultEnabled = true desde el servidor
    return tr.defaultEnabled === true;
}

export function normalizeText(str) {
    if (!str) return '';
    return str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[¡!¿?.,:;]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .join(" ");
}

export function lockTriggerSession(msgId, triggerId) {
    const key = `${msgId}:${triggerId}`;
    if (firedSessions.has(key)) return false;
    firedSessions.add(key);
    setTimeout(() => firedSessions.delete(key), 60000);
    return true;
}

export function getMergedTriggers(raw = false) {
    const merged = [...(_serverTriggers || []), ...(_localTriggers || [])];
    if (raw) return merged;

    return merged.map(tr => ({
        ...tr,
        enabled: isTriggerEnabled(tr.id, merged)
    }));
}

export function migrateStepsToKeyframes(trigger) {
    if (!trigger.steps || trigger.keyframes) return trigger;
    let timeAcc = 0;
    const newKeyframes = [];
    for (let step of trigger.steps) {
        timeAcc += (step.delay || 0);
        newKeyframes.push({
            time: timeAcc,
            value: step.value !== undefined ? step.value : 0,
            easing: 'linear',
            hold: 0,
            name: step.name || `Paso`
        });
    }
    trigger.keyframes = newKeyframes;
    trigger.triggerOn = trigger.triggerOn || 'keyword';
    delete trigger.steps;
    return trigger;
}

export function fireTriggers(text, msgId = null) {
    if (!triggersEnabled || !text) return;
    const triggers = getMergedTriggers();
    const normalizedText = normalizeText(text);
    const isBackground = document.hidden;

    triggers.forEach(tr => {
        if (!isTriggerEnabled(tr.id)) return;

        let shouldFire = false;
        if (tr.triggerOn === 'keyword' && tr.keyword) {
            const keywords = tr.keyword.split(',').map(k => k.trim()).filter(k => k.length > 0);
            if (keywords.length > 0) {
                const rx = new RegExp(`\\b(${keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'i');
                if (rx.test(normalizedText)) shouldFire = true;
            }
        } else if (tr.triggerOn === 'any_message') {
            shouldFire = true;
        }

        if (!shouldFire) return;
        if (msgId && !lockTriggerSession(msgId, tr.id)) return;

        // [v60.Elite] Notificar al servidor para telemetría Master y aviso global a la sala
        if (typeof window.safeEmit === 'function') {
            window.safeEmit('trigger-fired-out', { 
                triggerId: tr.id,
                triggerName: tr.name || tr.title || `Trigger #${tr.id}`,
                triggerType: (tr.type || 'OUT').toUpperCase()
            });
        }

        // [v60.Elite] DELEGACIÓN TOTAL AL SERVIDOR
        // Si estamos conectados al servidor, NO procesamos OSC ni sACN en el cliente.
        // El servidor se encarga de ejecutarlos de forma centralizada y soberana.
        if (window.socket && window.socket.connected) {
            const type = (tr.type || '').toLowerCase();
            if (type === 'osc' || type === 'sacn') return;
        }

        // [v60.Elite] GUARDIA DE SOBERANÍA LOCAL (MIDI / Flashlight)
        const isMaster = !!window.isMaster;
        const isLocalHardware = tr.type === 'midi' || tr.type === 'flashlight' || tr.type === 'screen';

        if (!isMaster && !isLocalHardware) {
            return;
        }

        // Feedback UI si el script principal lo provee
        if (typeof window.signalTriggerFire === 'function') window.signalTriggerFire();

        // Dispatch
        if (!isBackground) {
            executeKeyframeAnimation(tr);
            return;
        }

        if (!triggerWorker) initTriggerWorker();

        const sendToWorker = () => {
            triggerWorker.postMessage({
                type: 'start-trigger',
                payload: { triggerId: tr.id, trigger: tr }
            });
            activeAnimations.set(tr.id, { source: 'worker' });
        };

        if (workerReady) {
            sendToWorker();
        } else {
            const t0 = Date.now();
            const check = setInterval(() => {
                if (workerReady || Date.now() - t0 > 150) {
                    clearInterval(check);
                    if (workerReady) sendToWorker();
                    else {
                        console.warn('⚠️ Worker timeout — fallback a rAF');
                        executeKeyframeAnimation(tr);
                    }
                }
            }, 10);
        }
    });
}
