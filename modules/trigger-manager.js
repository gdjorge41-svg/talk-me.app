const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const oscHandler = require('./protocols/osc-handler');
const smpteHandler = require('./protocols/smpte-handler');
const textNumberNormalizer = require('./text-number-normalizer');
const SmpteHandlerClass = smpteHandler; 

/**
 * ⚡ TriggerManager - Orquestador central de automatización (IN)
 */
class TriggerManager extends EventEmitter {
    constructor() {
        super();
        this.triggers = []; // Triggers IN filtrados
        this.allTriggers = []; // Todos los triggers (IN/OUT) inicializados
        this.handlers = {
            osc: oscHandler
        };
        
        // [v60.Elite] Mapa de estados de triggers por usuario (Soberanía Delegada)
        // Estructura: Map<socketId, Map<triggerId, boolean>>
        this.userTriggerStates = new Map();
        
        // [v60.Elite] Mapa de decodificadores por socket: SocketId -> SmpteHandler
        this.smpteDecoders = new Map();
        
        // [v60.Elite] Estados persistentes de disparo por socket
        this.activeSmpteTriggers = new Map(); // SocketId -> Set(triggerId)
        this.lastFiredTime = new Map(); // Global anti-flood por trigger: TriggerId -> Timestamp
        
        // [v60.Elite] Guardias de histéresis por socket
        this._smpteStates = new Map(); // SocketId -> { counter, lastSec, tcBuffer, lastExecutionSec }
        
        // [v60.Elite] Registro de animaciones activas para evitar colisiones
        // Estructura: Map<"socketId_triggerId", setIntervalInstance>
        this.activeAnimations = new Map();

        this.setupGlobalListeners();
    }

    /**
     * [v60.Elite] Actualiza la preferencia de un usuario para un trigger específico
     */
    setUserTriggerState(socketId, triggerId, enabled) {
        if (!this.userTriggerStates.has(socketId)) {
            this.userTriggerStates.set(socketId, new Map());
        }
        this.userTriggerStates.get(socketId).set(triggerId, enabled);
    }

    /**
     * [v60.Elite] Verifica si un trigger está habilitado para un usuario concreto
     */
    isTriggerEnabledForUser(socketId, triggerId) {
        // 1. [v60.Elite] SOBERANÍA GLOBAL (DELEGADA EN EL SERVIDOR):
        // Si el validador global del servidor está listo, recurrimos a él con prioridad absoluta
        if (typeof global.isTriggerEnabledForUser === 'function') {
            return global.isTriggerEnabledForUser(socketId, triggerId);
        }

        // 2. [v60.Elite] SOBERANÍA ABSOLUTA: Solo respetamos el estado enviado por este socket específico
        if (this.userTriggerStates.has(socketId)) {
            const userMap = this.userTriggerStates.get(socketId);
            if (userMap.has(triggerId)) return userMap.get(triggerId);
        }

        // 3. [v60.Elite] POR DEFECTO OFF: Ningún trigger se dispara si el usuario no lo ha encendido.
        // Ignoramos cualquier estado guardado en el archivo para garantizar seguridad en el arranque.
        return false;
    }

    /**
     * [v60.Elite] Limpieza de estados al desconectar
     */
    cleanupSocket(socketId) {
        // 1. Limpieza de Animaciones Activas (Detener venas)
        for (const [key, interval] of this.activeAnimations.entries()) {
            if (key.startsWith(`${socketId}_`)) {
                clearInterval(interval);
                this.activeAnimations.delete(key);
            }
        }

        // 2. Limpieza de Estados y Soberanía
        this.userTriggerStates.delete(socketId);
        if (this.lastFiredTime.has(socketId)) this.lastFiredTime.delete(socketId);
        
        if (this.smpteDecoders.has(socketId)) {
            const h = this.smpteDecoders.get(socketId);
            if (h && typeof h.stop === 'function') h.stop();
            this.smpteDecoders.delete(socketId);
        }
    }

    setupGlobalListeners() {
        // --- Listener OSC (Global) ---
        if (this.handlers.osc && typeof this.handlers.osc.on === 'function') {
            this.handlers.osc.on('trigger', (data) => {
                const matches = this.triggers.filter(t => 
                    t.type.toLowerCase() === 'osc' && 
                    t.external?.osc?.address === data.address
                );
                matches.forEach(t => this.fireTrigger(t, data));
            });
        }
    }

    /**
     * Obtiene o crea un decodificador SMPTE para un socket específico
     */
    getSmpteDecoder(socketId, sampleRate = 44100, sovereigntyKey) {
        const key = sovereigntyKey || socketId;
        let handler = this.smpteDecoders.get(key);
        
        if (!handler || handler.currentSampleRate !== sampleRate) {
            if (handler) {
                handler.stop();
            }

            handler = new SmpteHandlerClass();
            handler.currentSampleRate = sampleRate;
            handler.activeSocketId = socketId; // Guardar el socket inicial
            
            handler.on('timecode', (data) => {
                // [v60.Elite] Usamos el socketId guardado en el handler (que se actualiza en cada ráfaga de audio)
                this.handleSmpteTimecode(data, handler.activeSocketId, key);
            });
            
            handler.on('signal-status', (status) => {
                this.emit('smpte-signal-status', { ...status, sovereigntyKey: key });
            });

            handler.start(sampleRate);
            this.smpteDecoders.set(key, handler);
        } else {
            // Actualizar el socket activo para este decodificador
            handler.activeSocketId = socketId;
        }
        return handler;
    }

    /**
     * Limpia recursos cuando un socket se desconecta
     */
    cleanupSocket(socketId) {
        // [v60.Elite] Purga de recursos SMPTE para evitar leaks de memoria y bloqueos de identidad
        // Buscamos cualquier estado o decodificador vinculado a este socket
        for (const [key, state] of this._smpteStates.entries()) {
            if (key === socketId) { // Si la clave de soberanía era el socketId (usuario no identificado)
                this._smpteStates.delete(key);
                this.smpteDecoders.get(key)?.stop();
                this.smpteDecoders.delete(key);
                this.activeSmpteTriggers.delete(key);
                console.log(`🧹 [SMPTE] Limpieza inmediata de socket no identificado: ${socketId}`);
            }
        }

        // [v60.Elite] Los decodificadores con sovereigntyKey persistente (ej. Usuario_IP) 
        // NO se borran aquí para permitir el Handover tras un F5. 
        // Solo se borran si el servidor explícitamente detecta que la identidad ha caducado.
    }

    /**
     * [v60.Elite] Valida que una cadena sea un Timecode SMPTE real (HH:MM:SS:FF)
     * e impide que valores centinela como "--:--:--:--" o "CH ERROR" se interpreten como 00:00:00:00.
     */
    isValidTimecode(tc) {
        if (!tc || typeof tc !== 'string') return false;
        return /^\d{1,2}[:;]\d{1,2}[:;]\d{1,2}[:;]\d{1,2}$/.test(tc.trim());
    }

    /**
     * [v60.Elite] Extrae y normaliza todos los rangos de Timecode de un objeto `external.smpte`,
     * manteniendo 100% retrocompatibilidad con `timecodeStart` / `timecodeEnd` / `timecode`.
     */
    getSmpteRanges(smpte, fps = 30) {
        if (!smpte || typeof smpte !== 'object') return [];
        const rawList = [];

        if (Array.isArray(smpte.timecodes) && smpte.timecodes.length > 0) {
            smpte.timecodes.forEach(item => {
                if (!item) return;
                if (typeof item === 'string') {
                    rawList.push({ start: item, end: item });
                } else if (typeof item === 'object') {
                    const s = item.start || item.timecodeStart || item.timecode || '00:00:00:00';
                    const e = item.end || item.timecodeEnd || s;
                    rawList.push({ start: s, end: e });
                }
            });
        } else if (smpte.timecodeStart || smpte.timecode || smpte.timecodeEnd) {
            const s = smpte.timecodeStart || smpte.timecode || '00:00:00:00';
            const e = smpte.timecodeEnd || s;
            rawList.push({ start: s, end: e });
        }

        const normalized = [];
        for (const r of rawList) {
            let sStr = this.isValidTimecode(r.start) ? r.start.trim() : '00:00:00:00';
            let eStr = this.isValidTimecode(r.end) ? r.end.trim() : sStr;

            // Blindaje Murphy #2: Si TC Fin se dejó en 00:00:00:00 pero TC Inicio tiene valor, igualar Fin = Inicio
            if (eStr === '00:00:00:00' && sStr !== '00:00:00:00') {
                eStr = sStr;
            } else if (sStr === '00:00:00:00' && eStr !== '00:00:00:00') {
                sStr = eStr;
            }

            let tStart = this.tcToSeconds(sStr, fps);
            let tEnd = this.tcToSeconds(eStr, fps);

            if (tEnd < tStart) {
                const tmpSec = tStart;
                tStart = tEnd;
                tEnd = tmpSec;
                const tmpStr = sStr;
                sStr = eStr;
                eStr = tmpStr;
            }

            normalized.push({
                start: sStr,
                end: eStr,
                tStart,
                tEnd
            });
        }

        return normalized;
    }

    /**
     * [v60.Elite] Orquestador de Timecode (Tanque Ágil)
     * Procesa la "Verdad Final" recibida desde el borde (Edge) o decodificada localmente.
     */
    handleSmpteTimecode(data, socketId, sovereigntyKey) {
        if (!data || !data.timecode) return;
        
        const stateKey = sovereigntyKey || socketId || 'global';
        const fps = (data.fps && data.fps > 0) ? data.fps : 30;

        // [v60.Elite] Blindaje Murphy #4: Si llega el centinela de parada "--:--:--:--" (SmpteHandler timeout),
        // NO debemos convertirlo a 0s ni alterar tcBuffer/activeSet para evitar falsos disparos en 00:00:00:00
        // o re-disparos espurios tras micro-cortes de audio en mitad de un rango activo.
        if (!this.isValidTimecode(data.timecode)) {
            this.emit('smpte-update', {
                ...data,
                fps,
                sovereigntyKey: stateKey
            });
            return;
        }

        const currentSec = this.tcToSeconds(data.timecode, fps);
        
        // Obtener o inicializar estado para esta identidad persistente
        if (!this._smpteStates.has(stateKey)) {
            this._smpteStates.set(stateKey, {
                counter: 0,
                lastSec: 0,
                maxSecSinceFire: new Map(),
                tcBuffer: [],
                lastExecutionSec: new Map()
            });
        }
        const state = this._smpteStates.get(stateKey);
        if (!state.maxSecSinceFire) state.maxSecSinceFire = new Map();
        const prevSec = state.lastSec || 0;

        // [v60.Elite] MOTOR DE INERCIA Y FILTRO DE SALTOS (Optimizado para recuperación rápida)
        state.tcBuffer.push(currentSec);
        if (state.tcBuffer.length > 8) state.tcBuffer.shift();

        // Verificamos consistencia en una ventana más corta (3 frames) para re-enganche rápido
        const isConsistent = state.tcBuffer.length >= 3 && 
                             state.tcBuffer.slice(-3).every((val, i, arr) => i === 0 || (val >= arr[i-1] && val < arr[i-1] + 0.5));

        const lastConfirmedSec = state.lastSec || 0;
        const jumpDiff = currentSec - lastConfirmedSec;

        // [v60.Elite] RESILIENCIA ANTE INTERFERENCIAS
        // Si el salto es masivo (> 5s) y es consistente, forzamos re-enganche inmediato 
        if (Math.abs(jumpDiff) > 5.0) {
            // Permitimos el salto si es consistente O si es el primer arranque (buffer vacío)
            const isInitialSync = state.tcBuffer.length < 3;
            
            if (!isConsistent && !isInitialSync) {
                state.consecutiveGlitches = (state.consecutiveGlitches || 0) + 1;
                if (state.consecutiveGlitches > 15) { 
                    this.emit('smpte-signal-status', { sovereigntyKey: stateKey, active: false, reason: 'interference' });
                }
                return;
            }
            
            // Re-enganche exitoso
            state.consecutiveGlitches = 0;
            if (jumpDiff < 0) {
                console.log(`⏪ [SMPTE] Rewind confirmado (${stateKey}).`);
                this.activeSmpteTriggers.get(stateKey)?.clear();
                state.lastExecutionSec.clear();
                state.maxSecSinceFire.clear();
            } else {
                console.log(`⏩ [SMPTE] Salto adelante confirmado tras interferencia (${stateKey}).`);
            }
            
            // Limpiamos el buffer para que la tendencia empiece limpia desde el nuevo punto
            state.tcBuffer = [currentSec];
        } else if (isConsistent) {
            // [v60.Elite] Blindaje Murphy #6: Retroceso corto confirmado (1.2s a 5.0s) dentro de un rango amplio.
            // Si el reloj retrocedió >= 1.2s respecto a la posición máxima alcanzada tras el disparo,
            // o si el reloj actual quedó por detrás del punto de disparo (lastExec - currentSec >= 1.0s),
            // re-armamos ese rango inmediatamente para permitir re-disparos limpios.
            const activeSet = this.activeSmpteTriggers.get(stateKey);
            for (const [rKey, lastExec] of state.lastExecutionSec.entries()) {
                const maxSec = state.maxSecSinceFire.get(rKey) ?? lastExec;
                if ((maxSec - currentSec) >= 1.2 || (lastExec - currentSec) >= 1.0) {
                    if (activeSet) activeSet.delete(rKey);
                    state.lastExecutionSec.delete(rKey);
                    state.maxSecSinceFire.delete(rKey);
                }
            }
        }

        state.lastSec = currentSec;
        state.consecutiveGlitches = 0;

        // Emitir actualización para telemetría (UI)
        this.emit('smpte-update', { 
            ...data, 
            fps,
            sovereigntyKey: stateKey 
        });

        // [v60.Elite] Si el dato viene de metadatos (no audio), nos aseguramos de que el Master vea señal activa
        if (data.isMetadata) {
            this.emit('smpte-signal-status', { active: true, sovereigntyKey: stateKey, source: 'edge' });
        }

        const activeSet = this.activeSmpteTriggers.get(stateKey) || new Set();
        if (!this.activeSmpteTriggers.has(stateKey)) this.activeSmpteTriggers.set(stateKey, activeSet);

        // --- LÓGICA DE EJECUCIÓN SOBERANA MULTI-TIMECODE CON HISTÉRESIS POR RANGO ---
        this.triggers.forEach(t => {
            if (!t || !t.type || t.type.toLowerCase() !== 'smpte' || !t.external?.smpte) return;
            
            // [v60.Elite] Verificación de Canal: El trigger solo responde si el audio viene de su canal asignado
            const smpte = t.external.smpte;
            const triggerChan = (smpte.audioChannel || 1) - 1; // Convertir a base 0
            const sourceChan = stateKey.includes('_ch') ? parseInt(stateKey.split('_ch')[1]) : 0;
            
            if (triggerChan !== sourceChan) return;

            // [v60.Elite] Ejecución directa: Si el timecode coincide y el trigger está habilitado para el socket, disparamos.
            if (!this.isTriggerEnabledForUser(socketId, t.id)) return;

            const ranges = this.getSmpteRanges(smpte, fps);
            if (ranges.length === 0) return;

            ranges.forEach((range, idx) => {
                // Blindaje Murphy #3 y #16: Clave determinista por rango y firma de tiempo
                const rangeKey = `${t.id}_r${idx}_${range.start}_${range.end}`;
                // Blindaje Murphy #2: Ventana mínima de captura de 0.25s si TC Inicio === TC Fin
                const effectiveEnd = (range.tEnd <= range.tStart) ? (range.tStart + 0.25) : range.tEnd;
                const inRange = (currentSec >= range.tStart && currentSec <= effectiveEnd);

                if (inRange) {
                    if (!activeSet.has(rangeKey)) {
                        const lastExec = state.lastExecutionSec.get(rangeKey) ?? -999;
                        if (Math.abs(currentSec - lastExec) > 0.25) {
                            console.log(`🚀 [TRIGGER-MGR] Disparando SMPTE: ${t.name} [Rango #${idx + 1}: ${range.start} ➜ ${range.end}] (TC: ${data.timecode})`);
                            this.fireTrigger(t, {
                                ...data,
                                originSocketId: socketId,
                                rangeIndex: idx,
                                rangeKey,
                                rangeStart: range.start,
                                rangeEnd: range.end
                            });
                            state.lastExecutionSec.set(rangeKey, currentSec);
                            state.maxSecSinceFire.set(rangeKey, currentSec);
                            activeSet.add(rangeKey);
                        }
                    } else {
                        const prevMax = state.maxSecSinceFire.get(rangeKey) ?? currentSec;
                        if (currentSec > prevMax) {
                            state.maxSecSinceFire.set(rangeKey, currentSec);
                        }
                    }
                } else {
                    // [v60.Elite] Reset instantáneo del rango individual al salir de su ventana
                    activeSet.delete(rangeKey);
                    state.maxSecSinceFire.delete(rangeKey);
                    // Si el reloj retrocedió claramente por delante del inicio (currentSec < tStart - 1.0s),
                    // liberamos también lastExecutionSec para que pueda volver a disparar al entrar de nuevo.
                    if (currentSec < (range.tStart - 1.0)) {
                        state.lastExecutionSec.delete(rangeKey);
                    }
                }
            });
        });
    }


    updateTriggers(allTriggers) {
        if (!Array.isArray(allTriggers)) return;
        this.allTriggers = allTriggers; // Guardamos todos para procesado OUT
        this.triggers = allTriggers.filter(t => t.direction === 'IN');

        // [v60.Elite] Limpiar únicamente animaciones de triggers que hayan sido eliminados en caliente,
        // preservando intactas las animaciones en vuelo de los triggers existentes.
        try {
            const validIds = new Set(allTriggers.map(t => t.id));
            for (const [animKey, interval] of this.activeAnimations.entries()) {
                const parts = animKey.split('_');
                const trigId = parts.slice(1).join('_');
                if (trigId && !validIds.has(trigId)) {
                    clearInterval(interval);
                    this.activeAnimations.delete(animKey);
                }
            }
            this.refreshHardwareListeners();
        } catch (_) { }

        console.log(`⚡ [TRIGGER-MGR] Sincronizados ${this.triggers.length} triggers IN y ${allTriggers.length - this.triggers.length} triggers OUT.`);
    }

    /**
     * [v60.Elite] Normaliza el texto eliminando acentos y caracteres especiales
     * para asegurar paridad de matching con el cliente.
     */
    normalizeText(text) {
        if (!text) return '';
        return text.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
            .trim();
    }

    /**
     * [v60.Elite] Motor de ejecución de salida (Mensaje -> Hardware)
     * Procesa los triggers de salida basándose en un mensaje del chat.
     */
    processMessageTriggers(messageData, targetUsers = []) {
        if (!this.allTriggers || !messageData.text) return;

        const msgLang = messageData.lang || 'es';
        const text = this.normalizeText(messageData.text);
        const textDigits = this.normalizeText(
            textNumberNormalizer.normalizeSpokenNumbers(messageData.text, msgLang)
        );
        // [v60.Elite] Los triggers que no son 'IN' son tratados como salida (OUT) para compatibilidad total
        const outTriggers = this.allTriggers.filter(t => t.direction !== 'IN' && t.enabled !== false);

        outTriggers.forEach(tr => {
            let shouldFire = false;
            
            // Lógica de Matching Profesional (PARIDAD CON EL CLIENTE + Dual-Match Letras/Dígitos)
            if (tr.triggerOn === 'keyword' && tr.keyword) {
                const rawKeywords = tr.keyword.split(',');
                const expandedKeywords = new Set();
                rawKeywords.forEach(k => {
                    const normRaw = this.normalizeText(k);
                    if (normRaw.length > 0) expandedKeywords.add(normRaw);
                    const normDigits = this.normalizeText(
                        textNumberNormalizer.normalizeSpokenNumbers(k, msgLang)
                    );
                    if (normDigits.length > 0) expandedKeywords.add(normDigits);
                });
                const keywords = Array.from(expandedKeywords);
                if (keywords.length > 0) {
                    const pattern = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
                    const rx = new RegExp(`\\b(${pattern})\\b`, 'i');
                    if (rx.test(text) || rx.test(textDigits)) shouldFire = true;
                }
            } else if (tr.triggerOn === 'any_message') {
                shouldFire = true;
            }

            if (shouldFire) {
                targetUsers.forEach(u => {
                    if (this.isTriggerEnabledForUser(u.socketId, tr.id)) {
                        this.executeOutTrigger(tr, u.socketId, u.ip);
                    }
                });
            }
        });
    }

    /**
     * Ejecuta la ráfaga de red de un trigger OUT directamente desde el servidor
     */
    executeOutTrigger(trigger, socketId, targetIp) {
        const animKey = `${socketId}_${trigger.id}`;
        
        // 1. Anti-Flood y Gestión de Colisiones
        // Si ya hay una animación activa para este usuario/trigger, la matamos para empezar la nueva (Override)
        if (this.activeAnimations.has(animKey)) {
            clearInterval(this.activeAnimations.get(animKey));
            this.activeAnimations.delete(animKey);
        }

        // [v60.Elite] Emitir aviso de disparo de Trigger OUT a la sala de chat (con anti-flood 3s)
        const now = Date.now();
        const userKey = socketId || 'global';
        if (!this.lastFiredTime.has(userKey)) this.lastFiredTime.set(userKey, new Map());
        const userFiredMap = this.lastFiredTime.get(userKey);
        const lastTime = userFiredMap.get(trigger.id) || 0;
        
        if (now - lastTime >= 3000) {
            userFiredMap.set(trigger.id, now);
            const timeStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const typeStr = (trigger.type || 'OUT').toUpperCase();
            this.emit('trigger-notice', {
                triggerId: trigger.id,
                triggerName: trigger.name || trigger.title || `Trigger #${trigger.id}`,
                triggerType: typeStr,
                time: timeStr
            });
        }

        const engine = require('./protocols/trigger-engine-server');
        const keyframes = trigger.keyframes || [];

        // Si no tiene keyframes, es un disparo único (valor 1.0)
        if (keyframes.length === 0) {
            this.sendHardwareValue(trigger, 1.0, targetIp);
            return;
        }

        // --- MOTOR DE ANIMACIÓN INTERNO (60 FPS) ---
        const duration = Math.max(...keyframes.map(k => k.time)) || 0;
        const startTime = Date.now();
        
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            
            if (elapsed > duration) {
                clearInterval(interval);
                this.activeAnimations.delete(animKey);
                this.sendHardwareValue(trigger, engine.getValueAtTime(keyframes, duration, trigger.type), targetIp);
                return;
            }

            const val = engine.getValueAtTime(keyframes, elapsed, trigger.type);
            this.sendHardwareValue(trigger, val, targetIp);
        }, 16); // ~60fps

        // Guardamos la referencia para poder cancelarla si entra otro trigger igual
        this.activeAnimations.set(animKey, interval);
    }

    /**
     * Despacha el valor final al hardware (OSC/sACN)
     */
    sendHardwareValue(trigger, value, targetIp) {
        const type = (trigger.type || '').toLowerCase();
        
        if (type === 'osc') {
            const osc = trigger.osc || {};
            let host = osc.host;
            const port = parseInt(osc.port);

            if (host === '127.0.0.1' || host === 'localhost') host = targetIp;
            if (!host || isNaN(port) || !osc.address) return;

            console.log(`📡 [OSC-OUT] ${trigger.name} -> ${osc.address} [${value.toFixed(2)}]`);

            // [v60.Elite] Paridad Total con el Bridge de server.js
            let finalArgs = [];
            const rawArg = osc.arg;

            if (rawArg !== undefined && rawArg !== '') {
                if (!isNaN(rawArg) && rawArg.trim() !== '') {
                    const val = rawArg.includes('.') ? parseFloat(rawArg) : parseInt(rawArg);
                    finalArgs.push({ type: rawArg.includes('.') ? 'f' : 'i', value: val });
                } else {
                    finalArgs.push({ type: 's', value: rawArg });
                }
            }

            // Inyección de Animación (Solo si hay keyframes)
            if (trigger.keyframes && trigger.keyframes.length > 0 && finalArgs.length > 0) {
                const lastNumIdx = finalArgs.findLastIndex(a => a.type === 'f' || a.type === 'i');
                if (lastNumIdx !== -1) {
                    const arg = finalArgs[lastNumIdx];
                    // [v60.Elite] Forzamos flotante en animaciones OSC para suavidad total (Fades)
                    if (type === 'osc') {
                        arg.type = 'f';
                        arg.value = value;
                    } else {
                        arg.value = arg.type === 'i' ? Math.round(value) : value;
                    }
                }
            }

            const addresses = osc.address.split(/[\s,]+/).filter(a => a.startsWith('/'));
            addresses.forEach(addr => {
                this.emit('dispatch-osc', { host, port, address: addr, args: finalArgs });
            });
        } else if (type === 'sacn') {
            const sacn = trigger.sacn || {};
            const universe = parseInt(sacn.universe) || 1;
            
            // [v60.Elite] Soporte multicanal y blindaje de datos
            let channels = sacn.channels || [];
            if (typeof channels === 'string') {
                try { channels = JSON.parse(channels); } catch(e) { channels = []; }
            }
            if (channels.length === 0) channels = [{ channel: 1, value: 0 }];

            const finalChannels = channels.map(ch => ({
                ...ch,
                value: Math.max(0, Math.min(255, Math.round(value)))
            }));

            this.emit('dispatch-sacn', {
                universe: universe,
                priority: parseInt(sacn.priority) || 100,
                channels: finalChannels,
                destinationIp: sacn.destinationIp || ''
            });
        }
    }

    refreshHardwareListeners() {
        if (!this.allTriggers) return;
        const types = new Set(this.allTriggers.map(t => t.type?.toUpperCase()));
        if (types.has('OSC')) {
            this.handlers.osc.start(8000); 
        } else {
            this.handlers.osc.stop();
        }
    }

    /**
     * Ejecución final del trigger e inyección de mensaje
     */
    fireTrigger(trigger, extraData = {}) {
        // [v60.Elite] Solo bloqueamos si está explícitamente en false para mantener flexibilidad
        if (!trigger || trigger.enabled === false) return;

        // [v60.Elite] Bloqueo Anti-Flood PRIVADO por usuario y por rango (Blindaje Murphy #3)
        const now = Date.now();
        const userKey = extraData.originSocketId || 'global';
        if (!this.lastFiredTime.has(userKey)) this.lastFiredTime.set(userKey, new Map());
        
        const userFiredMap = this.lastFiredTime.get(userKey);
        const floodKey = (typeof extraData.rangeIndex === 'number')
            ? `${trigger.id}_r${extraData.rangeIndex}`
            : trigger.id;
        const lastRangeTime = userFiredMap.get(floodKey) || 0;
        const lastGlobalTime = userFiredMap.get(trigger.id) || 0;
        
        // Guardián de 3000ms para el mismo rango y micro-guardián de 250ms por trigger global (evita doble disparo simultáneo en rangos solapados)
        if ((now - lastRangeTime < 3000) || (now - lastGlobalTime < 250)) {
            return; // Bloqueado por seguridad para este usuario
        }
        userFiredMap.set(floodKey, now);
        userFiredMap.set(trigger.id, now);

        console.log(`🚀 [TRIGGER-MGR] Disparando: ${trigger.name}`);

        // [v60.Elite] Emitir aviso de disparo a la sala
        const timeStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const typeStr = (trigger.type || 'OUT').toUpperCase();
        const tcInfo = extraData.timecode ? ` (TC: ${extraData.timecode})` : '';

        this.emit('trigger-notice', {
            triggerId: trigger.id,
            triggerName: (trigger.name || `Trigger #${trigger.id}`) + tcInfo,
            triggerType: typeStr,
            time: timeStr
        });

        // [v60] Soporte para remitente 'Sistema' (all-todos) o 'TimeCode' especializado
        let senderName = trigger.name;
        let finalFilterIds = trigger.message?.filterIds || [];
        
        const typeLower = (trigger.type || '').toLowerCase();
        
        if (typeLower === 'smpte') {
            senderName = 'TimeCode';
        } else if (finalFilterIds.includes('all')) {
            senderName = 'Sistema';
        }

        const automatedMessage = {
            _msgId: 'auto_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            direction: 'IN',
            user: senderName, 
            text: trigger.message?.text || '',
            audioUrl: trigger.message?.audio || null,
            imageUrl: trigger.message?.image || null,
            category: finalFilterIds.length > 0 ? (finalFilterIds[0] === 'all' ? 'General' : finalFilterIds[0]) : 'General',
            filterIds: finalFilterIds,
            sendToAll: finalFilterIds.includes('all') || trigger.message?.sendToAll || false,
            time: new Date().toLocaleTimeString(),
            timestamp: Date.now(),
            isAutomated: true,
            triggerId: trigger.id,
            triggerType: trigger.type,
            triggerValue: extraData.timecode || extraData.note || extraData.address || 'Trigger',
            originSocketId: extraData.originSocketId || null
        };

        this.emit('message', automatedMessage);
    }

    /**
     * Procesa buffers de audio LTC recibidos desde un socket específico
     */
    processSMPTEAudio(buffer, socketId, sampleRate = 44100, sovereigntyKey) {
        const handler = this.getSmpteDecoder(socketId, sampleRate, sovereigntyKey);
        handler.decodeBuffer(buffer);
    }

    /**
     * [v60.Elite] Procesa metadatos SMPTE pre-decodificados (Tanque Ágil)
     * @param {Object} data - { timecode, hours, minutes, seconds, frames, peak, quality, timestamp }
     */
    processSMPTESync(data, socketId, sovereigntyKey) {
        const key = sovereigntyKey || socketId;
        
        // Inyectamos flag para indicar que viene del borde (Edge)
        const enrichedData = {
            ...data,
            isMetadata: true
        };

        // Delegamos a la autoridad única de lógica
        this.handleSmpteTimecode(enrichedData, socketId, key);
    }
    /**
     * Convierte un string HH:MM:SS:FF a segundos (aproximado para comparación)
     */
    tcToSeconds(tc, fps = 30) {
        if (!tc || typeof tc !== 'string') return 0;
        const parts = tc.split(/[:;]/);
        if (parts.length < 3) return 0;
        
        // [v60.Elite] Normalización de acarreo para evitar errores de input (ej. 30fps en base 30)
        let h = parseInt(parts[0]) || 0;
        let m = parseInt(parts[1]) || 0;
        let s = parseInt(parts[2]) || 0;
        let f = parseInt(parts[3]) || 0;
        
        const baseFps = (fps && fps > 0) ? fps : 30;
        s += Math.floor(f / baseFps);
        f %= baseFps;
        m += Math.floor(s / 60);
        s %= 60;
        h += Math.floor(m / 60);
        m %= 60;
        
        return (h * 3600) + (m * 60) + s + (f / baseFps);
    }
}

module.exports = new TriggerManager();
