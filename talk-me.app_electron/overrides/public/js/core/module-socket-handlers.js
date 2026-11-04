/**
 * 🔌 SocketHandlers - Descomposición de initSocket()
 * 
 * Propósito: Dividir la función monolito de ~1000 líneas en handlers temáticos.
 * 
 * ESTRUCTURA:
 *   ✅ Connection (connect/disconnect)
 *   ✅ Auth (join/user events)
 *   ✅ Chat (messages, typing)
 *   ✅ Audio (vosk, transcription, streaming)
 *   ✅ Categories (config, updates)
 *   ✅ Triggers (sync, updates)
 *   ✅ Notifications (system messages, alerts)
 * 
 * ANTES (❌ Un handler gigante):
 *   function initSocket() {
 *       socket.on('connect', ...1000 líneas de código...);
 *   }
 * 
 * AHORA (✅ Handlers temáticos):
 *   new SocketHandlers(socket, domManager, audioState, triggersModule)
 *       .setupAll();
 */

class SocketHandlers {
    constructor(socket, domManager, audioState, triggersModule) {
        this.socket = socket;
        this.dom = domManager;
        this.audio = audioState;
        this.triggers = triggersModule;

        // [v60.Elite] Memoria de mensajes procesados para evitar duplicidad de alertas
        this._processedMsgIds = new Set();
        this.pendingForeignTTSTranslations = new Map();
        this.audioPlayStates = new Map();

        // [v60.Murphy-Defense] Buffer bidireccional de traducciones pendientes (resuelve carrera DOM vs Flash Cache)
        this._pendingTranslations = new Map();
    }

    /**
     * Setup todos los handlers
     */
    setupAll() {
        try {
            this.setupConnectionHandlers();
            this.setupTriggerHandlers();
            this.setupAuthHandlers();
            this.setupChatHandlers();
            this.setupAudioHandlers();
            this.setupCategoryHandlers();
            this.setupNotificationHandlers();
            this.setupSystemHandlers();
        } catch (error) {
            console.error('❌ [REFACTOR] Error crítico durante el registro de listeners:', error);
        }
    }

    // ────────────────────────────────────────────────────────
    // 🔌 CONNECTION HANDLERS
    // ────────────────────────────────────────────────────────

    setupConnectionHandlers() {
        this.socket.on('connect', () => this._onConnect());
        this.socket.on('disconnect', () => this._onDisconnect());
        this.socket.on('connect_error', (err) => this._onConnectError(err));
        this.socket.on('reconnect', () => this._onReconnect());
        this.socket.on('reconnect_failed', () => this._onReconnectFailed());

        // ⚡ [v60.IOS-WAKE-RECONNECT] Rescate instantáneo de socket al desbloquear pantalla (<100ms)
        const rescueSocketConnection = () => {
            if (this.socket && !this.socket.connected) {
                console.log('🔄 [SocketHandlers] Retorno de suspensión/bloqueo detectado: Forzando reconexión inmediata...');
                try { this.socket.connect(); } catch (err) { }
            }
        };
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') rescueSocketConnection();
        });
        window.addEventListener('pageshow', rescueSocketConnection);
    }

    _onConnect() {
        console.log('✅ [SocketHandlers] Socket conectado. Disparando socket-ready...');
        window.dispatchEvent(new CustomEvent('socket-ready'));

        // [v60.ELITE] RECONEXIÓN AUTOMÁTICA DE USUARIOS ACTIVOS
        // Si el usuario ya tenía una sesión activa (ventana abierta durante reinicio del servidor o caída de red),
        // re-emitimos join-chat proactivamente para reintegrarlo al chat SIN pasar por userModal.
        const activeSession = (typeof window.restoreLocalSession === 'function') ? window.restoreLocalSession() : null;
        const activeUsername = window.currentUsername || (activeSession && activeSession.username);

        if (activeUsername && typeof window.performJoinChat === 'function') {
            console.log(`🔄 [SocketHandlers] Reconexión de sesión activa detectada para: ${activeUsername}`);
            
            // Garantizar que reconecte como participante y jamás usurpe credenciales/soberanía de Master
            if (!window.isElectronHost && !window.isElectronApp) {
                window.isMaster = false;
                window.isMasterCandidate = false;
            }
            if (window.audioState) {
                window.audioState.setState({ joinState: 'IDLE' });
            }
            window.performJoinChat('socket-reconnect');
        }

        // Peticiones proactivas v60
        this.socket.emit('get-triggers');
        if (window.currentLang) {
            this.socket.emit('get-dictionary', { lang: window.currentLang });
        }

        try { if (typeof window.flushPendingEmitQueue === 'function') window.flushPendingEmitQueue(); } catch (e) { }

        const statusIcon = this.dom.get('status', 'connection')?.querySelector('.status-icon-container');
        if (statusIcon) {
            statusIcon.className = 'status-icon-container blink-green';
            statusIcon.innerHTML = `
                <svg viewBox="0 0 24 24" class="status-icon-svg">
                    <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                </svg>
            `;
        }

        // Actualizar la IP y estado
        const connectionIP = this.dom.get('status', 'connectionIP');
        if (connectionIP) {
            connectionIP.style.color = '';
            // Si tenemos la IP real, la ponemos, si no, intentamos recuperar la del window
            connectionIP.textContent = window._lastServerUrl || window.location.origin;
        }

        if (window._serverIps && typeof window.updateDynamicIPDisplays === 'function') {
            window.updateDynamicIPDisplays(window._serverIps);
        }
    }

    _onDisconnect() {
        // Firefox: Log específico para diagnóstico
        const isFirefox = navigator.userAgent.includes('Firefox');
        if (isFirefox) {
            if (typeof window.stopRecording === 'function') window.stopRecording();
        }

        // Actualizar UI de estado
        const statusIcon = this.dom.get('status', 'connectionDot');
        if (statusIcon) {
            statusIcon.className = 'status-icon-container disconnected-red';
            statusIcon.innerHTML = `
                <svg viewBox="0 0 24 24" class="status-icon-svg">
                    <circle cx="12" cy="12" r="8" fill="currentColor"></circle>
                </svg>
            `;
        }

        const connectionIP = this.dom.get('status', 'connectionIP');
        if (connectionIP) {
            window._lastServerUrl = connectionIP.textContent; // Guardar para restaurar luego
            connectionIP.textContent = 'OFFLINE';
            connectionIP.style.color = 'var(--accent-red)';
        }

        // Marcar que necesitamos reconectar si intentamos enviar audio
        window._socketDisconnectedDuringAudio = true;
        this.audio.setState({ joinState: 'IDLE' });
    }

    _onConnectError(err) {
        // [v60] Silencio radical: Solo el mensaje, sin stack trace verboso
        const msg = err.message || err;
        console.error(`⚠️ Error de conexión Socket: ${msg}`);
    }

    _onReconnect() {
        // Marcar que reconectamos
        window._socketDisconnectedDuringAudio = false;

        // Reintentar envío de audio si fue detenido
        const isFirefox = navigator.userAgent.includes('Firefox');
        if (isFirefox) {
            console.log('🦊 Firefox: Reconectado - puede reanudar grabación');
        }
    }

    _onReconnectFailed() {
        console.error('❌ Fallo al reconectar');
        const isFirefox = navigator.userAgent.includes('Firefox');
        if (isFirefox) {
            console.error('🦊 Firefox: Reconexión falló - socket está en estado crítico');
        }
    }

    // ────────────────────────────────────────────────────────
    // 👥 AUTH & SESSION HANDLERS
    // ────────────────────────────────────────────────────────

    setupAuthHandlers() {
        this.socket.on('join-success', (data) => this._onJoinSuccess(data));
        this.socket.on('join-error', (err) => this._onJoinError(err));
        this.socket.on('update-users', (users) => this._onUserListUpdate(users));
        this.socket.on('user-joined', (data) => this._onUserJoined(data));
        this.socket.on('user-left', (data) => this._onUserLeft(data));
        this.socket.on('force-logout', () => this._onForceLogout());

        // [v60.ELITE] Listener de estado de soberanía para privacidad
        this.socket.on('master-status', (status) => this._onMasterStatus(status));
    }

    _onJoinError(err) {
        console.error('❌ [Auth] Error al unirse:', err);
        this.audio.setState({ joinState: 'IDLE' }); // Liberar estado para permitir reintento

        const fallbackMsg = err.code === 'INVALID_PIN' ?
            (window.localesData?.login?.error_invalid_pin || 'PIN de sala incorrecto. Acceso denegado.') :
            (window.localesData?.login?.error_access || 'Error de acceso.');
        const msg = err.message || fallbackMsg;
        if (typeof window.showSystemMessage === 'function') {
            window.showSystemMessage(msg, 'error');
        } else {
            alert(msg);
        }

        // [v60.ELITE] Si es error de PIN, forzamos que el modal de login se mantenga visible
        const userModal = document.getElementById('userModal');
        if (userModal) userModal.classList.remove('hidden');
    }

    _onMasterStatus(status) {
        const lastSaved = localStorage.getItem('talkme_last_username');
        const usernameInput = document.getElementById('usernameInput');
        const catSelect = document.getElementById('categorySelect');

        // [v60.ELITE] Evaluación de Candidatura a Soberanía
        // Un candidato es aquel que legítimamente puede reclamar el mando.
        const isLegitimateOwner = status.masterUsername && lastSaved && (status.masterUsername.toLowerCase() === lastSaved.toLowerCase());
        const isVacant = !status.masterUsername;

        // [v60.ELITE] Protección de Soberanía en Caliente
        // Solo reseteamos el estado si NO somos el Master validado actual.
        if (window.isMaster && status.masterUsername && window.currentUsername && status.masterUsername.toLowerCase() === window.currentUsername.toLowerCase()) {
            console.log('🛡️ [ELITE] Sincronización de Master Status: Manteniendo soberanía reconocida.');
        } else {
            window.isMaster = false;
        }

        if (status.hasMaster) {
            // [v60.ELITE] ESCUDO DE PRIVACIDAD ACTIVO (Master presente y activo)
            console.log(`🛡️ [ELITE] Privacidad: Asiento ocupado por ${status.masterUsername}. Protegiendo sesión soberana.`);
            window.isMasterCandidate = false;

            if (!isLegitimateOwner) {
                // Si además somos un usuario distinto, limpiamos el modal por completo para evitar "leaks"
                if (usernameInput && usernameInput.value.toLowerCase() === status.masterUsername.toLowerCase()) {
                    usernameInput.value = '';
                }
                if (typeof window._restoreMasterIdentity === 'function') window._restoreMasterIdentity(false);
            }
        } else {
            // [v60.ELITE] ASIENTO DISPONIBLE O RESERVADO (Master offline)
            // Habilitamos controles de Master solo para el candidato legítimo o si está vacante.
            if (isVacant || isLegitimateOwner) {
                console.log(`👑 [ELITE] Puesto ${isVacant ? 'vacante' : 'reservado para ti'}. Habilitando controles de recuperación.`);
                window.isMasterCandidate = true;
                if (isLegitimateOwner && typeof window._restoreMasterIdentity === 'function') {
                    window._restoreMasterIdentity(true);
                }
            } else {
                console.log(`🛡️ [ELITE] Puesto reservado para ${status.masterUsername}. Entrando como invitado.`);
                window.isMasterCandidate = false;
                if (typeof window._restoreMasterIdentity === 'function') window._restoreMasterIdentity(false);
            }
        }

        // [v60.ELITE] Sincronización de UI con Retardo de Seguridad
        setTimeout(() => {
            const pinContainer = document.getElementById('pinInputContainer');
            const pinInput = document.getElementById('pinInput');

            // Mostrar PIN si es candidato a Master O si la sala tiene PIN general
            const shouldShowPin = window.isMasterCandidate || window.hasRoomPin;

            if (pinContainer) {
                pinContainer.style.display = shouldShowPin ? 'flex' : 'none';

                // Ajustar placeholder según el rol
                if (pinInput) {
                    window.isRoomVacant = isVacant;
                    if (window.isMasterCandidate) {
                        pinInput.placeholder = isVacant ?
                            (window.localesData?.login?.create_room_pin || 'Crear PIN de Sala (En blanco = Libre)') :
                            (window.localesData?.login?.master_recovery_pin || 'PIN de Recuperación Master');
                    } else if (window.hasRoomPin) {
                        pinInput.placeholder = window.localesData?.interface?.room_pin || 'PIN de Sala';
                    }
                }
            }
            if (typeof window.updateLoginMasterButton === 'function') window.updateLoginMasterButton();
        }, 50);
    }

    _onJoinSuccess(data) {
        this.audio.setState({ joinState: 'JOINED' });
        window.stopStarfieldAnimation = true;

        if (typeof window.setCurrentUsername === 'function') {
            window.setCurrentUsername(data.username);
        }

        // Guardar PIN actual si se ingresó uno
        const pinInput = this.dom.get('controls', 'pinInput') || document.getElementById('pinInput');
        if (pinInput) {
            window.currentRoomPin = pinInput.value.trim();
        }

        // [v60.MEMORIA] Persistir la sesión en SessionStorage para reconexiones y refrescos
        if (typeof window.saveLocalSession === 'function') {
            window.saveLocalSession();
        }

        // Migrar estados ON/OFF de triggers
        if (typeof window.migrateTriggersStorage === 'function') {
            window.migrateTriggersStorage(data.username);
        }

        const userModal = this.dom.get('modals', 'user');
        if (userModal) userModal.classList.add('hidden');

        const globalLangSwitcher = this.dom.get('controls', 'langSwitcher');
        if (globalLangSwitcher) globalLangSwitcher.classList.add('hidden');

        // [v59.42] SINCRONIZACIÓN DE AUTORIDAD
        if (data.categoryIds && data.categoryIds.length > 0) {
            window.activeFilters = [window.FILTER_ALL_KEY || '__ALL__'];
            window.selectedCategories = [...data.categoryIds];
        }

        // 1º Encolar Mensaje de Bienvenida al usuario en ToastQueue
        if (typeof window.showSystemMessage === 'function') {
            const template = (window.localesData && window.localesData.chat && window.localesData.chat.welcome_ready)
                ? window.localesData.chat.welcome_ready
                : '¡Bienvenido %user%! El chat está listo.';
            const welcomeMsg = template.replace('%user%', data.username);
            window.showSystemMessage(welcomeMsg);
        }

        // 2º Transferir notificaciones de Hardware acumuladas durante el login a la cola activa (ej. WebMIDI)
        if (typeof window.flushPendingToasts === 'function') {
            window.flushPendingToasts();
        }

        // 🛡️ [Anti-Murphy] Notificación en chat e inserción en ToastQueue si la traducción está deshabilitada
        window.isTranslationAvailable = Boolean(data && data.isTranslationAvailable);
        if (typeof window.updateTranslationControlsAvailability === 'function') {
            window.updateTranslationControlsAvailability(window.isTranslationAvailable);
        }
        if (!window.isTranslationAvailable) {
            const transDisabledTemplate = (window.localesData && window.localesData.chat && window.localesData.chat.status_translation_disabled) 
                || 'Traducción desactivada del sistema';
            const warnText = `⚠️ ${transDisabledTemplate}`;
            
            // Notificación flotante superior exclusiva (sin duplicar en el flujo del chat)
            if (typeof window.showGlobalToast === 'function') {
                window.showGlobalToast(warnText, 'warning', 6000, { type: 'translation_disabled' });
            }
            if (typeof window.updateTranslationControlsAvailability === 'function') {
                window.updateTranslationControlsAvailability(false);
            }
        }

        if (typeof window.updateUsersList === 'function') {
            window.updateUsersList(data.users);
        }

        if (data.allUsers && typeof window.createFilterBar === 'function') {
            window.createFilterBar(data.allUsers);
        }

        if (data.dictionary) {
            window.currentDictionary = data.dictionary;
            if (typeof window.renderDictionary === 'function') window.renderDictionary();
        }

        // Sincronizar caché límite
        if (data.cacheLimit) {
            const cacheLimitRange = document.getElementById('cacheLimitRange');
            const cacheLimitLabel = document.getElementById('cacheLimitLabel');
            if (cacheLimitRange) {
                cacheLimitRange.value = data.cacheLimit;
                localStorage.setItem('talkme_cache_limit', data.cacheLimit);
                if (window.updateCacheVisuals) {
                    window.updateCacheVisuals(data.cacheLimit, data.currentCacheMB || 0);
                }
            }
        }

        window.isMaster = data.isMaster || false;
        window.isMasterCandidate = window.isMaster; // Sincronizar estado de candidato tras validación

        if (typeof window.refreshMasterUI === 'function') {
            window.refreshMasterUI();
        } else {
            const navItemControl = document.getElementById('navItemControl');
            if (navItemControl) {
                navItemControl.style.display = window.isMaster ? 'flex' : 'none';
            }
        }
        if (typeof window.updateLoginMasterButton === 'function') {
            window.updateLoginMasterButton();
        }

        if (data.triggers) {
            window.serverTriggers = data.triggers;
            if (typeof window.renderTriggersList === 'function') {
                window.renderTriggersList();
            }
        }

        // 3. Sincronización post-unión con retardo de seguridad (v60)
        setTimeout(() => {
            const lang = data.lang || window.currentLang || 'es';
            const token = localStorage.getItem('talkme_session_token');

            // Petición con payload completo legado (v60)
            const payload = {
                lang: lang,
                token: token,
                username: window.currentUsername,
                roomPin: window.currentRoomPin
            };
            this.socket.emit('get-dictionary', payload);
            this.socket.emit('get-triggers', payload);

            if (typeof window.renderDictionary === 'function') window.renderDictionary();
            if (typeof window.renderTriggersList === 'function') window.renderTriggersList();
        }, 800);

        // Sincronización post-unión finalizada

        // [v60.ELITE] MEMORIA EXCLUSIVA DEL MASTER
        if (data.isMaster) {
            console.log('👑 [ELITE] Sesión de Master reconocida. Guardando identidad en memoria local y de sesión.');
            localStorage.setItem('talkme_last_username', data.username);
            localStorage.setItem('talkme_last_category', data.masterCategory || (data.categories && data.categories[0]));

            // SessionStorage sobrevive al refresco pero no a nuevas pestañas (Ideal para privacidad)
            sessionStorage.setItem('talkme_last_username', data.username);
            sessionStorage.setItem('talkme_last_category', data.masterCategory || (data.categories && data.categories[0]));
        } else {
            // [v60.ELITE] PRIVACIDAD SIN DESTRUCCIÓN
            // Si entramos como usuario normal, respetamos el rastro del Master por si quiere volver.
            // Solo limpiamos SessionStorage para la sesión actual.
            sessionStorage.removeItem('talkme_last_username');
            sessionStorage.removeItem('talkme_last_category');
        }
    }

    _onUserListUpdate(users) {
        // [v60.1] RECOLECTOR DE BASURA DE PIPELINES
        if (window._subUserPipelines && Array.isArray(users)) {
            const allSubUserIds = [];
            users.forEach(u => {
                if (u && Array.isArray(u.subUsers)) {
                    u.subUsers.forEach(su => allSubUserIds.push(su.subUserId));
                }
            });

            Object.keys(window._subUserPipelines).forEach(id => {
                if (!allSubUserIds.includes(id)) {
                    console.warn(`🧹 [GHOST-GC] Eliminando pipeline huérfano detectado en sync: ${id}`);
                    if (typeof window.stopSubUserCapture === 'function') window.stopSubUserCapture(id);
                }
            });
        }

        // [v60.1] SINCRONIZACIÓN TOTAL: Refrescar UI y Filtros con datos frescos
        if (typeof window.updateUsersList === 'function') {
            window.updateUsersList(users);
        }

        if (window.currentUsername && typeof window.createFilterBar === 'function') {
            window.createFilterBar(users); // Forzar reconstrucción con la lista actualizada
        }
    }

    _onUserJoined(data) {
        if (!data || !data.username) return;
        // Evitar auto-notificación redundante si ya se mostró la bienvenida local
        if (data.username === window.currentUsername) return;
        if (!window.currentUsername) return; // Si aún no estamos dentro de la sala, ignorar

        // 🛡️ [Anti-Murphy] Throttle de ráfagas/reconexiones por usuario (3s)
        const now = Date.now();
        window._lastPresenceThrottle = window._lastPresenceThrottle || {};
        const eventKey = `${data.username}_joined`;
        if (window._lastPresenceThrottle[eventKey] && (now - window._lastPresenceThrottle[eventKey] < 3000)) {
            return;
        }
        window._lastPresenceThrottle[eventKey] = now;

        const timeStr = data.time || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const suffix = (window.localesData?.chat?.user_joined) || 'ha entrado en el chat';
        const msg = `${data.username} ${suffix}`;
        const userCat = data.category || (data.categories && data.categories[0]) || null;

        if (typeof window.addSystemMessage === 'function') {
            window.addSystemMessage(msg, data.username, 'joined', { time: timeStr, category: userCat });
        }
    }

    _onUserLeft(data) {
        if (!data || !data.username) return;
        if (data.username === window.currentUsername) return;
        if (!window.currentUsername) return;

        // 🛡️ [Anti-Murphy] Throttle de ráfagas/reconexiones por usuario (3s)
        const now = Date.now();
        window._lastPresenceThrottle = window._lastPresenceThrottle || {};
        const eventKey = `${data.username}_left`;
        if (window._lastPresenceThrottle[eventKey] && (now - window._lastPresenceThrottle[eventKey] < 3000)) {
            return;
        }
        window._lastPresenceThrottle[eventKey] = now;

        const timeStr = data.time || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const suffix = (window.localesData?.chat?.user_left) || 'ha abandonado el chat';
        const msg = `${data.username} ${suffix}`;
        const userCat = data.category || (data.categories && data.categories[0]) || null;

        if (typeof window.addSystemMessage === 'function') {
            window.addSystemMessage(msg, data.username, 'left', { time: timeStr, category: userCat });
        }
    }

    _onForceLogout() {
        console.log('❌ [REFACTOR] Forzado logout del servidor');
        localStorage.removeItem('talkme_hermes_enabled');
        localStorage.removeItem('talkme_hermes_voice_uri');
        localStorage.removeItem('talkme_hermes_gender');
        localStorage.removeItem('talkme_hermes_rate');
        window.location.reload();
    }

    // ────────────────────────────────────────────────────────
    // 💬 CHAT HANDLERS
    // ────────────────────────────────────────────────────────

    setupChatHandlers() {
        this.socket.on('receive-message', (data) => this._onReceiveMessage(data));
        this.socket.on('user-typing', (data) => this._onUserTyping(data));
        this.socket.on('message-ack', (data) => this._onMessageAck(data));
        this.socket.on('message-nack', (data) => this._onMessageNack(data));

        // [v60.1-BABEL] Capa de Terciopelo
        this.socket.on('translation-started', (data) => this._onTranslationStarted(data));
        this.socket.on('translation-result', (data) => this._onTranslationResult(data));

        // [v60.PIPER-TTS] Recepción de síntesis de voz neuronal (Euskera, Gallego)
        this.socket.on('hermes-audio-stream', (data) => {
            if (window.hermesTTS && typeof window.hermesTTS.playAudioStream === 'function') {
                window.hermesTTS.playAudioStream(data);
            }
        });
    }

    _onTranslationStarted(data) {
        console.log('✨ [BABEL] Traducción iniciada para:', data._msgId);
        const bubble = document.querySelector(`.message[data-msg-id="${data._msgId}"]`);
        if (!bubble) return;

        const babelDiv = bubble.querySelector('.babel-translation');
        if (babelDiv) {
            babelDiv.classList.remove('hidden');
            babelDiv.innerHTML = '<span class="babel-loading"><span>.</span><span>.</span><span>.</span></span>';
        }
    }

    _onTranslationResult(data) {
        console.log('🌍 [BABEL] Traducción recibida:', data._msgId);

        let cleanResult = (data.result || '')
            .replace(/^\[[A-Z]{2}\]\s*/, '') // Quitar prefijos [EN], [ES]
            .replace(/\s*\([^\)]*\)$/, '')  // Quitar cualquier sufijo entre paréntesis (Traducido), (Translated), etc.
            .trim();

        // [Hermes TTS] Si el mensaje estaba registrado para traducción diferida
        if (this.pendingForeignTTSTranslations && this.pendingForeignTTSTranslations.has(data._msgId)) {
            const meta = this.pendingForeignTTSTranslations.get(data._msgId);

            if (this.audioPlayStates && this.audioPlayStates.get(data._msgId) === 'playing') {
                // El audio original se está reproduciendo o está en cola. Guardamos el texto y diferimos la locución
                meta.translatedText = cleanResult;
                meta.targetLang = data.targetLang || window.currentLang || 'es';
                console.log(`🔊 [HermesTTS] Traducción recibida para ${data._msgId}, pero el audio original sigue reproduciéndose. Guardando para después.`);
            } else {
                // No se está reproduciendo audio original (o ya terminó), procesamos la locución inmediatamente
                this.pendingForeignTTSTranslations.delete(data._msgId);
                if (this.audioPlayStates) this.audioPlayStates.delete(data._msgId);

                if (window.hermesTTS && window.hermesTTS.enabled) {
                    // Verificar si el mensaje coincide con los filtros activos
                    const ttsActiveFilters = window.activeFilters || [];
                    const ttsShowAll = ttsActiveFilters.length === 0 || ttsActiveFilters.includes('__ALL__') || ttsActiveFilters.includes('all') || (window.FILTER_ALL_KEY && ttsActiveFilters.includes(window.FILTER_ALL_KEY));

                    let ttsMatchesFilter = ttsShowAll;

                    if (!ttsMatchesFilter && meta.category) {
                        if (typeof window.getCategoryInfo === 'function') {
                            const msgCatInfo = window.getCategoryInfo(meta.category);
                            if (msgCatInfo) {
                                ttsMatchesFilter = ttsActiveFilters.includes(msgCatInfo.id) || ttsActiveFilters.includes(msgCatInfo.name);
                            }
                        }
                        if (!ttsMatchesFilter) {
                            ttsMatchesFilter = ttsActiveFilters.includes(meta.category);
                        }
                    }

                    if (ttsMatchesFilter) {
                        const targetLang = data.targetLang || window.currentLang || 'es';
                        console.log(`🗣️ [HermesTTS] Disparando síntesis diferida en idioma: ${targetLang} (Texto: ${cleanResult})`);
                        window.hermesTTS.speak(meta.user, cleanResult, targetLang, !!meta.isAudio);
                    }
                }
            }
        }

        // [v60.Murphy-Defense] Intentar inyectar en DOM o retener en buffer con reintentos
        this._pendingTranslations.set(data._msgId, {
            data: data,
            cleanResult: cleanResult,
            timestamp: Date.now()
        });

        // Limpieza periódica de buffer para evitar fugas de memoria
        if (this._pendingTranslations.size > 200) {
            const oldestKey = this._pendingTranslations.keys().next().value;
            this._pendingTranslations.delete(oldestKey);
        }

        this._attemptInjectTranslation(data._msgId, 0);
    }

    /**
     * [v60.Murphy-Defense] Reintento progresivo de inyección en DOM (0ms, 30ms, 80ms, 160ms)
     */
    _attemptInjectTranslation(msgId, attempt = 0) {
        if (!msgId || !this._pendingTranslations.has(msgId)) return;

        const bubble = document.querySelector(`.message[data-msg-id="${msgId}"]`);
        if (bubble) {
            const item = this._pendingTranslations.get(msgId);
            this._injectTranslationInBubble(bubble, item.data, item.cleanResult);
            this._pendingTranslations.delete(msgId);
            return;
        }

        const delays = [30, 80, 160];
        if (attempt < delays.length) {
            setTimeout(() => {
                this._attemptInjectTranslation(msgId, attempt + 1);
            }, delays[attempt]);
        } else {
            console.warn(`⏳ [BABEL-BUFFER] Burbuja ${msgId} aún no montada tras ${attempt} intentos. Queda en buffer para cuando addMessage la monte.`);
        }
    }

    /**
     * [v60.Murphy-Defense] Inyección visual estandarizada en la burbuja DOM
     */
    _injectTranslationInBubble(bubble, data, cleanResult) {
        if (!bubble || !cleanResult) return;
        const babelDiv = bubble.querySelector('.babel-translation');
        if (babelDiv) {
            bubble.classList.add('has-translation');
            babelDiv.classList.remove('hidden');

            // El efecto "Ethereal Smoke" y la caída del original se disparan por CSS
            babelDiv.style.opacity = '1';
            babelDiv.innerHTML = `<div class="babel-result" contenteditable="true">${cleanResult}</div>`;

            // [v60.1] REQUISITO: La etiqueta de idioma va en el texto ORIGINAL (el de abajo)
            const originalTextDiv = bubble.querySelector('.message-text');
            if (originalTextDiv) {
                if (!originalTextDiv.querySelector('.babel-lang-tag')) {
                    const langTag = document.createElement('small');
                    langTag.className = 'babel-lang-tag';
                    const langMap = { 'es': 'ES', 'en': 'EN', 'eu': 'EUS', 'gl': 'GL', 'ca': 'CAT' };
                    const rawLang = String(data.sourceLang || '??').toLowerCase();
                    const displayLang = langMap[rawLang] || rawLang.toUpperCase();
                    langTag.textContent = displayLang;
                    originalTextDiv.prepend(langTag);
                }
            }

            if (typeof window.scrollToBottom === 'function') {
                setTimeout(() => window.scrollToBottom(true), 50);
            }
        }
    }

    _onReceiveMessage(data) {
        if (!data) return;

        // [v60.Elite] Evitar procesamiento doble del mismo mensaje (Anti-Flood)
        if (data._msgId) {
            if (this._processedMsgIds.has(data._msgId)) return;
            this._processedMsgIds.add(data._msgId);
            // Limpieza periódica para no saturar memoria
            if (this._processedMsgIds.size > 100) {
                const first = this._processedMsgIds.values().next().value;
                this._processedMsgIds.delete(first);
            }
        }

        console.log('📥 [SocketHandlers] _onReceiveMessage:', data);
        if (!window.currentUsername) {
            console.warn('⚠️ [SocketHandlers] Ignorando mensaje: window.currentUsername no definido');
            return;
        }

        // Limpiar indicador de habla
        const speakingUser = this.dom.get('status', 'speakingUser');
        const userSpeakingIndicator = this.dom.get('status', 'indicator');
        if (speakingUser && userSpeakingIndicator && speakingUser.textContent === data.user) {
            userSpeakingIndicator.classList.remove('show');
        }

        // [v60.13] SEGURIDAD UI: Si llega un mensaje nuevo, el procesamiento ha terminado sí o sí.
        if (typeof window.hideTranscriptionProcessing === 'function') {
            window.hideTranscriptionProcessing();
        }

        // [v60.Elite] La deduplicación ahora se gestiona al inicio de la función para mayor seguridad.

        const isOwn = data.user === window.currentUsername;
        const isMaster = data.user === (window.MASTER_USERNAME || 'Master');

        // [v60.Elite] Detección robusta de si el usuario está en la pestaña "Todos" o en la pestaña correspondiente al mensaje
        const catRaw = data.category || (data.catInfo && (data.catInfo.id || data.catInfo.name)) || '';
        const catInfo = (typeof window.getCategoryInfo === 'function')
            ? window.getCategoryInfo(catRaw, window.currentCategories)
            : null;
        const msgCatId = (catInfo && catInfo.id !== undefined) ? String(catInfo.id).toLowerCase() : String(catRaw).toLowerCase();
        const msgCatName = (catInfo && catInfo.name) ? String(catInfo.name).toLowerCase() : String(catRaw).toLowerCase();

        const activeFilters = Array.isArray(window.activeFilters) ? window.activeFilters : [];
        const isAllFilterKey = (f) => {
            if (!f) return false;
            const s = String(f).toLowerCase();
            return s === '__all__' || s === 'all' || s === 'todos' || (window.FILTER_ALL_KEY && s === String(window.FILTER_ALL_KEY).toLowerCase());
        };

        const showAllInState = activeFilters.length === 0 || activeFilters.some(isAllFilterKey);
        const catMatchesInState = activeFilters.some(f => {
            if (!f) return false;
            const s = String(f).toLowerCase();
            return s === msgCatId || s === msgCatName;
        });

        // Comprobación defensiva de los botones activos en el DOM (#categoryFilterBar)
        let showAllInDOM = false;
        let catMatchesInDOM = false;
        try {
            const activeButtons = document.querySelectorAll('#categoryFilterBar .filter-btn.active');
            if (activeButtons && activeButtons.length > 0) {
                activeButtons.forEach(btn => {
                    const btnFilter = btn.dataset.filter ? String(btn.dataset.filter).toLowerCase() : '';
                    const btnText = btn.textContent ? btn.textContent.trim().toLowerCase() : '';
                    if (isAllFilterKey(btnFilter) || btnText === 'todos' || btnText === 'all' || btnText === (window.localesData?.chat?.filter_all || 'todos').toLowerCase()) {
                        showAllInDOM = true;
                    }
                    if (btnFilter === msgCatId || btnFilter === msgCatName || btnText === msgCatName) {
                        catMatchesInDOM = true;
                    }
                });
            }
        } catch (_) {}

        const matchesFilter = showAllInState || showAllInDOM || catMatchesInState || catMatchesInDOM || isMaster;

        const now = Date.now();
        const isHidden = document.hidden;
        const timeSinceLastAlert = now - (window._lastAlertTime || 0);

        const isOwnMaster = data.user === window.currentUsername && (!data.subUserId || data.subUserId === 'root');
        const isMySubUser = !!(data.subUserId && window._subUserPipelines && window._subUserPipelines[data.subUserId]);

        console.log(`🔍 [SocketHandlers] Visibility: ${!isHidden} | TimeDiff: ${timeSinceLastAlert}ms | Matches: ${matchesFilter} | isOwnMaster: ${isOwnMaster} | isMySub: ${isMySubUser} | activeFilters: ${JSON.stringify(window.activeFilters)} | showAll: ${showAllInState || showAllInDOM} | msgCategory: ${data.category}`);

        // --- 🛡️ [v60.EARLY-ALERT] Deduplicación con Doble Llave Atómica (Audio previo vs Texto Puro) ---
        const isAlertedByStream = Boolean(data.streamId && window._alertedStreams && window._alertedStreams.has(data.streamId));
        const isAlertedByRecentVoice = Boolean(
            window._lastEarlyAlert &&
            data.user === window._lastEarlyAlert.user &&
            (now - window._lastEarlyAlert.timestamp < 10000)
        );
        const alreadyAlerted = isAlertedByStream || isAlertedByRecentVoice;

        if (!isOwnMaster) {
            if (!alreadyAlerted) {
                console.log(`🚀 [SocketHandlers] Disparando alerta visual para: ${data.user} ${isMySubUser ? "(Sub-usuario propio)" : ""}`);
                if (typeof window.showMessageAlert === 'function') {
                    window.showMessageAlert(data.user, data.text);
                }
                // La vibración sí la mantenemos filtrada por categoría para evitar molestias excesivas
                if (matchesFilter && typeof window.triggerVibration === 'function') {
                    window.triggerVibration();
                }
            } else {
                console.log(`⚡ [SocketHandlers] Alerta visual ya consumida en tiempo real para: ${data.user} (streamId: ${data.streamId || "tupla-voz"})`);
            }
            window._lastAlertTime = now;
        }

        // Si el usuario está en la pestaña "Todos" o en la pestaña del mensaje, NO se muestra la alerta flotante.
        // Solo se notifica si el mensaje es de otro usuario y pertenece a una categoría diferente a la pestaña activa.
        if (!isOwn && !matchesFilter) {
            if (typeof window.showSystemMessage === 'function') {
                const template = window.localesData?.chat?.new_message_alert || '✉️ Nuevo mensaje de %user% en %category%';
                const catDisplayName = (catInfo && catInfo.name) || data.category || '';
                const msg = template.replace('%user%', data.user || '').replace('%category%', catDisplayName);
                window.showSystemMessage(msg);
            }
        }

        if (typeof window.fireTriggers === 'function') {
            window.fireTriggers(data.text, data._msgId);
        }

        // [v60.Elite] Verificación de Activación Local: Respetar estado OFF del usuario
        if (data.isAutomated && data.triggerId) {
            const localTriggers = JSON.parse(localStorage.getItem('talkme_triggers_enabled') || '{}');
            // Si el trigger está explícitamente en false, abortamos el procesado para este terminal
            if (localTriggers[data.triggerId] === false) {
                console.log(`🚫 [TRIGGER-SHIELD] Ignorando trigger desactivado localmente: ${data.triggerId}`);
                return;
            }
        }

        // [v60.Elite] Determinar Auto-Play ANTES de renderizar para sincronización visual
        const isTrigger = data.isAutomated || data.sendToAll === true || data.user === 'Sistema' || data.user === 'Master';
        const finalMatchesFilter = isTrigger ? true : matchesFilter;
        let audioBlobUrl = null;

        if (data.audioData) {
            let bufferData = data.audioData;
            if (bufferData && bufferData.type === 'Buffer' && Array.isArray(bufferData.data)) {
                bufferData = new Uint8Array(bufferData.data);
            }
            const type = data.mimeType || 'audio/mp4';
            let finalData = bufferData;

            if (type && type.includes('audio/pcm') && typeof window.pcmToWav === 'function') {
                const rate = parseInt(type.split('rate=')[1]) || 16000;
                finalData = window.pcmToWav(bufferData, rate);
            }

            const blob = new Blob([finalData], { type: (type && type.includes('audio/pcm')) ? 'audio/wav' : type });
            audioBlobUrl = URL.createObjectURL(blob);
            window.audioBlobUrls = window.audioBlobUrls || [];
            window.audioBlobUrls.push(audioBlobUrl);
            const MAX_AUDIO_BLOBS = window.MAX_AUDIO_BLOBS || 100;
            while (window.audioBlobUrls.length > MAX_AUDIO_BLOBS) {
                URL.revokeObjectURL(window.audioBlobUrls.shift());
            }
        }

        const isAudioMsg = !!(data.audioData || data.audioUrl || audioBlobUrl);
        let finalAudioUrl = data.audioUrl || audioBlobUrl;

        // Normalización y determinación de prioridad
        if (isTrigger && finalAudioUrl && typeof finalAudioUrl === 'string' && !finalAudioUrl.startsWith('http') && !finalAudioUrl.startsWith('blob')) {
            if (!finalAudioUrl.startsWith('/')) finalAudioUrl = '/' + finalAudioUrl;
        }

        const wasAlreadyStreamed = data.streamId && window.processedStreamIds && window.processedStreamIds.has(data.streamId);
        const serverTimeNow = Date.now() + (window.serverTimeOffset || 0);
        const messageAgeMs = data.timestamp ? (serverTimeNow - data.timestamp) : 0;
        const isTooOld = isTrigger ? (messageAgeMs > 10000) : (messageAgeMs > 5000);

        const isJoined = (this.audio && this.audio.get('joinState') === 'JOINED') ||
            (window.currentUsername && document.getElementById('userModal')?.classList.contains('hidden'));
        const isForeignMessage = !!(data.lang && data.lang !== (window.currentLang || 'es'));
        const shouldWaitForTranslation = isJoined && isForeignMessage && window.hermesTTS && window.hermesTTS.enabled && (!isAudioMsg || window.hermesTTS.readForeignAudio);
        const shouldMuteForeignAudio = isAudioMsg && shouldWaitForTranslation && window.hermesTTS.foreignAudioMode === 'mute';

        // Flag definitivo para el renderer
        data.autoPlayPending = false;
        if (isJoined && window.autoPlayRealtime && finalAudioUrl && !wasAlreadyStreamed && !isTooOld && (!isOwn || isTrigger) && finalMatchesFilter && !shouldMuteForeignAudio) {
            if (isTrigger && data._msgId) {
                data.autoPlayPending = true;
            } else {
                this._queueAutoPlay(finalAudioUrl, data.user, data._msgId);
            }
        } else if (shouldMuteForeignAudio) {
            console.log(`🔊 [HermesTTS] Silenciando audio original en tiempo real (${data.lang}) ya que se leerá su traducción.`);
        }

        if (isJoined && shouldWaitForTranslation && data._msgId) {
            this.pendingForeignTTSTranslations.set(data._msgId, {
                user: data.user,
                category: data.category,
                isAudio: !!isAudioMsg
            });
            console.log(`🔊 [HermesTTS] Registro en espera de traducción para ID: ${data._msgId}`);
        }

        // [Hermes TTS] Leer automáticamente el mensaje si es de solo texto y no propio (y no retrasado para traducción)
        if (isJoined && !isOwn && !isAudioMsg && window.hermesTTS && window.hermesTTS.readTextMessages && !shouldWaitForTranslation) {
            // Verificar si el mensaje coincide con los filtros activos
            const ttsActiveFilters = window.activeFilters || [];
            const ttsShowAll = ttsActiveFilters.length === 0 || ttsActiveFilters.includes('__ALL__') || ttsActiveFilters.includes('all') || (window.FILTER_ALL_KEY && ttsActiveFilters.includes(window.FILTER_ALL_KEY));
            let ttsMatchesFilter = ttsShowAll;

            if (!ttsMatchesFilter && data.category) {
                if (typeof window.getCategoryInfo === 'function') {
                    const msgCatInfo = window.getCategoryInfo(data.category);
                    if (msgCatInfo) {
                        ttsMatchesFilter = ttsActiveFilters.includes(msgCatInfo.id) || ttsActiveFilters.includes(msgCatInfo.name);
                    }
                }
                if (!ttsMatchesFilter) {
                    ttsMatchesFilter = ttsActiveFilters.includes(data.category);
                }
            }

            if (ttsMatchesFilter) {
                // Obtener el idioma del mensaje si viene indicado en el payload (para salas multiidioma/traducción)
                // de lo contrario usar el idioma de interfaz actual del receptor.
                const activeLang = data.lang || window.currentLang || 'es';
                console.log(`🗣️ [HermesTTS] Disparando síntesis de voz en idioma: ${activeLang}`);
                window.hermesTTS.speak(data.user, data.text, activeLang, false);
            } else {
                console.log(`🔇 [HermesTTS] Ignorando síntesis de voz: el mensaje no coincide con los filtros activos (${data.category})`);
            }
        }

        const subUserInfo = data.subUserId ? {
            subUserId: data.subUserId,
            rootUser: data.rootUser || 'Master',
            rootCategory: data.rootCategory || 'General'
        } : null;

        if (typeof window.addMessage === 'function') {
            window.addMessage(
                data.user,
                data.text,
                isOwn,
                data.time,
                finalAudioUrl,
                data.category,
                data.imageUrl,
                isAudioMsg,
                subUserInfo,
                data._msgId,
                data.triggerType,
                data.triggerValue,
                data.autoPlayPending
            );

            // [v60.Murphy-Defense] Si la traducción llegó milisegundos antes del DOM (Flash Cache), consumirla de inmediato
            if (data._msgId && this._pendingTranslations && this._pendingTranslations.has(data._msgId)) {
                // Dejamos un tick para que el microtask de React/DOM termine de adjuntar el elemento
                requestAnimationFrame(() => {
                    this._attemptInjectTranslation(data._msgId, 0);
                });
            }
        }
    }

    _queueAutoPlay(url, user, msgId = null) {
        window.globalAutoPlayQueue = window.globalAutoPlayQueue || [];

        // Si hay msgId y estamos en modo play_then_tts, registramos que este audio está activo (para esperar la traducción)
        if (msgId && window.hermesTTS && window.hermesTTS.enabled && window.hermesTTS.readForeignAudio && window.hermesTTS.foreignAudioMode === 'play_then_tts') {
            if (this.audioPlayStates) this.audioPlayStates.set(msgId, 'playing');
        }

        window.globalAutoPlayQueue.push({
            type: 'audio',
            source: url,
            userId: user,
            msgId: msgId,
            playAction: () => {
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                const useWebAudio = isMobile && window.audioContext;

                if (useWebAudio) {
                    console.log("🚀 [QUEUE-iOS-PRO] Inyectando audio vía Web Audio API");
                    return new Promise(async (resolve, reject) => {
                        try {
                            if (window.audioContext.state === 'suspended') await window.audioContext.resume();

                            const response = await fetch(url);
                            const arrayBuffer = await response.arrayBuffer();
                            const decodedData = await window.audioContext.decodeAudioData(arrayBuffer);

                            const source = window.audioContext.createBufferSource();
                            source.buffer = decodedData;
                            source.connect(window._masterGain || window.audioContext.destination);

                            source.onended = () => resolve();
                            source.start(0);
                        } catch (e) {
                            console.error("❌ [QUEUE-iOS-PRO] Error:", e);
                            reject(e);
                        }
                    });
                } else {
                    return new Promise((resolve) => {
                        const audio = new Audio(url);
                        if (typeof window.registerActiveAudio === 'function') window.registerActiveAudio(audio);
                        audio.onended = () => resolve();
                        audio.onerror = () => resolve();
                        audio.play().catch(err => {
                            console.warn("Failed to play audio in queue:", err);
                            resolve();
                        });
                    });
                }
            }
        });
        // [v60.FIX-B] Cap de 50 items: Prevenir acumulación de audio obsoleto y fuga de memoria.
        // Si la cola crece más de 50 es señal de starvation; descartamos los más antiguos.
        const MAX_AUTOPLAY_QUEUE = 50;
        if (window.globalAutoPlayQueue.length > MAX_AUTOPLAY_QUEUE) {
            const dropped = window.globalAutoPlayQueue.length - MAX_AUTOPLAY_QUEUE;
            window.globalAutoPlayQueue.splice(0, dropped);
            console.warn(`⚠️ [AutoPlay] Cola saturada. ${dropped} elemento(s) descartado(s).`);
        }
        if (!window.isPlayingGlobalAutoPlay) {
            this._processAutoPlayQueue();
        }
    }

    _processAutoPlayQueue() {
        if (!window.globalAutoPlayQueue || window.globalAutoPlayQueue.length === 0) {
            window.isPlayingGlobalAutoPlay = false;
            return;
        }
        window.isPlayingGlobalAutoPlay = true;
        const task = window.globalAutoPlayQueue.shift();

        task.playAction()
            .then(() => {
                if (task.msgId) {
                    this._onAudioPlaybackFinished(task.msgId);
                }
                setTimeout(() => this._processAutoPlayQueue(), 300);
            })
            .catch((e) => {
                console.warn('⚠️ AutoPlay task error:', e);
                if (task.msgId) {
                    this._onAudioPlaybackFinished(task.msgId);
                }
                this._processAutoPlayQueue();
            });
    }

    _onAudioPlaybackFinished(msgId) {
        if (!msgId) return;
        if (this.audioPlayStates) this.audioPlayStates.set(msgId, 'finished');

        // Comprobamos si la traducción ya llegó y está guardada en la cola de espera
        if (this.pendingForeignTTSTranslations && this.pendingForeignTTSTranslations.has(msgId)) {
            const meta = this.pendingForeignTTSTranslations.get(msgId);
            if (meta.translatedText) {
                // Ya tenemos la traducción, procedemos a realizar la síntesis por voz
                this.pendingForeignTTSTranslations.delete(msgId);
                if (this.audioPlayStates) this.audioPlayStates.delete(msgId);

                if (window.hermesTTS && window.hermesTTS.enabled) {
                    const ttsActiveFilters = window.activeFilters || [];
                    const ttsShowAll = ttsActiveFilters.length === 0 || ttsActiveFilters.includes('__ALL__') || ttsActiveFilters.includes('all') || (window.FILTER_ALL_KEY && ttsActiveFilters.includes(window.FILTER_ALL_KEY));
                    let ttsMatchesFilter = ttsShowAll;

                    if (!ttsMatchesFilter && meta.category) {
                        if (typeof window.getCategoryInfo === 'function') {
                            const msgCatInfo = window.getCategoryInfo(meta.category);
                            if (msgCatInfo) {
                                ttsMatchesFilter = ttsActiveFilters.includes(msgCatInfo.id) || ttsActiveFilters.includes(msgCatInfo.name);
                            }
                        }
                        if (!ttsMatchesFilter) {
                            ttsMatchesFilter = ttsActiveFilters.includes(meta.category);
                        }
                    }

                    if (ttsMatchesFilter) {
                        const targetLang = meta.targetLang || window.currentLang || 'es';
                        console.log(`🗣️ [HermesTTS] Disparando síntesis diferida tras audio original en idioma: ${targetLang} (Texto: ${meta.translatedText})`);
                        window.hermesTTS.speak(meta.user, meta.translatedText, targetLang, !!meta.isAudio);
                    }
                }
            }
        }
    }

    _onUserTyping(data) {
        console.log('⌨️ Typing:', data);
        // TODO: Mostrar indicador de escribiendo
    }

    _onMessageAck(data) {
        console.log('✅ ACK mensaje:', data);
        // TODO: Marcar como entregado
    }

    _onMessageNack(data) {
        console.log('❌ NACK mensaje:', data);
        // TODO: Reintentar envío
    }

    // ────────────────────────────────────────────────────────
    // 🎙️ AUDIO & TRANSCRIPTION HANDLERS
    // ────────────────────────────────────────────────────────

    setupAudioHandlers() {
        // [v60.4] Unificación de eventos de transcripción
        this.socket.on('vosk-partial', (data) => this._onVoskPartial(data));
        this.socket.on('transcription-partial', (data) => this._onVoskPartial(data));

        this.socket.on('vosk-result', (data) => this._onTranscriptionResult(data));
        this.socket.on('transcription-result', (data) => this._onTranscriptionResult(data));

        this.socket.on('vosk-busy', (data) => this._onVoskBusy(data));
        this.socket.on('vosk-metrics', (data) => this._onVoskMetrics(data));
        this.socket.on('audio-stream-start', (data) => this._onAudioStreamStart(data));
        this.socket.on('audio-stream-data', (data) => this._onAudioStreamData(data));
        this.socket.on('audio-stream-end', (data) => this._onAudioStreamEnd(data));

        // [v60.958] Alerta Global de Euskera Beta (Dinamismo por Usuario)
        this.socket.off('system-warning-euskera');
        this.socket.on('system-warning-euskera', (data) => {
            if (!data.user) return;
            if (!window.localesData || !window.localesData.chat) return;

            // [v60.963] Blindaje Anti-Duplicados v60.Elite (Ventana ampliada a 10s)
            const now = Date.now();
            const warningKey = `eu_warn_${data.user}`;
            if (window._lastEuWarnings && window._lastEuWarnings[warningKey] && (now - window._lastEuWarnings[warningKey] < 10000)) {
                return;
            }
            window._lastEuWarnings = window._lastEuWarnings || {};
            // [v60.FIX-C] Purge de entradas antiguas (>60s) para evitar crecimiento indefinido
            // en salas con muchos usuarios o sesiones largas.
            try {
                Object.keys(window._lastEuWarnings).forEach(k => {
                    if (now - window._lastEuWarnings[k] > 60000) delete window._lastEuWarnings[k];
                });
            } catch (_) { }
            window._lastEuWarnings[warningKey] = now;

            let finalMsg = "";
            const isMe = (data.user === window.currentUsername);
            const isGalego = (data.lang === 'gl' || (!data.lang && window.currentLang === 'gl'));
            const iAmInNeuralLang = (window.currentLang === 'eu' || window.currentLang === 'gl');

            if (isMe) {
                // CASO A: El aviso es sobre mí. 
                // SOLO lo muestro si estoy en modo Euskera o Gallego
                if (iAmInNeuralLang) {
                    if (isGalego) {
                        finalMsg = window.localesData.chat.status_beta_warning_gl || "⚠️ Aviso: O motor de transcrición de Galego está en fase experimental e pode ter menor precisión que noutros idiomas.";
                    } else {
                        finalMsg = window.localesData.chat.status_beta_warning || "⚠️ Adi: Euskararen transkripzio-motorra fase esperimentalean dago eta beste hizkuntzetan baino zehaztasun txikiagoa izan dezake.";
                    }
                } else {
                    return; // No mostrar nada si el aviso es sobre mí pero ya no estoy en motor neuronal
                }
            } else {
                // CASO B: El aviso es sobre otro usuario. 
                // SOLO lo muestro si YO NO estoy en ese mismo motor neuronal
                if (!iAmInNeuralLang) {
                    const msgTemplate = isGalego
                        ? (window.localesData.chat.status_galego_user_warning || "⚠️ Aviso: %user% está usando transcrición en Galego (Beta / Motor Neuronal). A precisión pode ser menor e procesa por bloques.")
                        : (window.localesData.chat.status_euskera_user_warning || "⚠️ Aviso: %user% está usando transcripción en Euskera (Beta / Motor Neuronal). La precisión puede ser menor y procesa por bloques.");
                    const formattedUser = data.user || 'Usuario';
                    finalMsg = msgTemplate
                        .replace(/%user%/g, formattedUser)
                        .replace(/\{user\}/g, formattedUser)
                        .replace(/___[a-zA-ZáéíóúÁÉÍÓÚñÑ_]+___/g, formattedUser)
                        .replace(/__[\u0600-\u06FF_]+__/g, formattedUser);
                } else {
                    return;
                }
            }

            if (finalMsg && typeof window.addSystemMessage === 'function') {
                const sysType = isMe 
                    ? (isGalego ? "galego-beta-personal" : "euskera-beta-personal")
                    : (isGalego ? "galego-beta" : "euskera-beta");
                const targetUser = isMe ? "IA" : (data.user || 'Usuario');
                const userCat = data.category || (data.categories && data.categories[0]) || null;
                window.addSystemMessage(finalMsg, targetUser, sysType, {
                    targetUser: data.user,
                    lang: data.lang,
                    isGalego: isGalego,
                    category: userCat
                });
            }
        });

        // [v60.Elite] Alerta Global de Ejecución Trigger OUT (Notificación a toda la sala)
        this.socket.off('system-warning-trigger-out');
        this.socket.on('system-warning-trigger-out', (data) => {
            if (!data || !data.triggerName) return;
            const timeStr = data.time || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const typeStr = (data.triggerType || 'OUT').toUpperCase();

            // Localización universal para los 24 idiomas
            const template = window.localesData?.chat?.status_trigger_out || '⚡ Trigger OUT ejecutado: "{name}" | Tipo: {type} | Hora: {time}';
            const msg = template
                .replace('{name}', data.triggerName)
                .replace('{type}', typeStr)
                .replace('{time}', timeStr);

            if (typeof window.addSystemMessage === 'function') {
                window.addSystemMessage(msg, "SISTEMA", "trigger-out", {
                    triggerName: data.triggerName,
                    triggerType: typeStr,
                    time: timeStr
                });
            }
        });

        // [v60.960] Feedback Dinámico de Carga de IA (Filtrado por Idioma)
        this.socket.off('ia-transcriptions-status');
        this.socket.on('ia-transcriptions-status', (data) => {
            // [v60.961] REQUISITO: Confiar en el filtrado de sala del servidor (euskera-alerts)
            // No filtramos en el cliente para evitar perder mensajes durante la carga inicial de locales o registro de subusuarios.
            if (!window.localesData || !window.localesData.chat) {
                console.warn(`⏳ [SocketHandlers] Locales no listos para estado IA. Usando fallbacks.`);
            }

            // [v60.964] Evitar spam de estados idénticos (READY/LOADING)
            const now = Date.now();
            const statusKey = `eu_status_${data.status}`;
            if (window._lastEuStatus && window._lastEuStatus[statusKey] && (now - window._lastEuStatus[statusKey] < 5000)) {
                return;
            }
            window._lastEuStatus = window._lastEuStatus || {};
            window._lastEuStatus[statusKey] = now;

            // [v60.965] RESCATE ANTE CARRERA DE LOCALES: Si el mensaje llega antes de que el JSON de idioma se cargue, usar fallback
            const chatLocales = (window.localesData && window.localesData.chat) ? window.localesData.chat : null;
            if (!chatLocales) {
                console.warn(`⏳ [SocketHandlers] ia-transcriptions-status (${data.status}) recibido antes de locales. Reintentando en 1s...`);
                setTimeout(() => this.socket.emit('request-ia-status-retry', data), 1000);
                // Nota: El servidor no maneja 'request-ia-status-retry', pero esto forzará que el usuario reciba el estado actual si lo re-pide o si usamos un fallback local ahora
            }

            let msg = "";
            if (data.status === 'LOADING') {
                msg = (chatLocales && chatLocales.status_ia_eus_loading) || "⏳ Cargando motor de transcripción neural...";
            } else if (data.status === 'READY') {
                const rawReady = (chatLocales && chatLocales.status_ia_eus_ready) || "✔️ IA Transcriptions READY";
                msg = rawReady.replace(/✅/g, '✔️');
            } else if (data.status === 'ERROR') {
                msg = `❌ Error IA: ${data.error}`;
            }

            if (msg && typeof window.addSystemMessage === 'function') {
                window.addSystemMessage(msg, "SISTEMA", "ia-status", { iaStatus: data.status });
            }
        });

        // 🛡️ [Anti-Murphy] Estado del Motor de Traducción Neuronal
        this.socket.off('translation-engine-status');
        this.socket.on('translation-engine-status', (data) => {
            window.isTranslationAvailable = Boolean(data && data.available);

            // Sincronizar reactivamente píldora visual y atenuación de controles en Ajustes
            if (typeof window.updateTranslationControlsAvailability === 'function') {
                window.updateTranslationControlsAvailability(window.isTranslationAvailable);
            }
        });

        // 🛡️ [Anti-Murphy] Alerta visible en pantalla al entrar sin motor de traducción
        this.socket.off('system-warning-translation-disabled');
        this.socket.on('system-warning-translation-disabled', () => {
            window.isTranslationAvailable = false;
            const warnMsg = (window.localesData && window.localesData.chat && window.localesData.chat.status_translation_disabled) 
                || "Traducción desactivada del sistema";
            const fullWarn = `⚠️ ${warnMsg}`;

            // Notificación visual Toast exclusiva en la parte superior del chat (flotante)
            if (typeof window.showGlobalToast === 'function') {
                window.showGlobalToast(fullWarn, 'warning', 6000, { type: 'translation_disabled' });
            }

            // 3. Sincronizar píldora y atenuación en menú de ajustes
            if (typeof window.updateTranslationControlsAvailability === 'function') {
                window.updateTranslationControlsAvailability(false);
            }
        });
    }

    _onVoskPartial(data) {
        if (!data) return;

        const transcriptionText = this.dom.get('chat', 'transcriptionText');
        const transcriptionBox = this.dom.get('chat', 'transcriptionBox') || document.getElementById('transcriptionBox');

        // [v60.20] Soporte para Feedback Neural (Whisper / Euskera / Gallego)
        if (data.isProcessing) {
            if (transcriptionText) {
                // Murphy Shield: Si ya hay texto reconocido visible, no borrarlo jamás con '...'
                const currentText = (transcriptionText.textContent || '').trim();
                if (!currentText || currentText === '...' || currentText.startsWith('Escuchando') || currentText.startsWith('Entzuten')) {
                    transcriptionText.innerHTML = `<span class="processing-status">...</span> <span class="dot-pulse"></span>`;
                }
            }
            if (transcriptionBox) transcriptionBox.classList.add('show');
            return;
        }

        if (data.subUserId && data.subUserId !== 'root') {
            const pipeline = window._subUserPipelines ? window._subUserPipelines[data.subUserId] : null;
            if (pipeline && (data.text || '').trim().length > 0) {
                pipeline.hasText = true;
            }
            return;
        }

        if (this.audio.get('messageSentForCurrentCapture')) return;
        let text = (data.text || '').trim();
        if (!text) return;

        text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]|[\u001b\u009b]\[[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

        if (data.estimated === true && text.startsWith('[')) return;

        if (transcriptionBox) transcriptionBox.classList.add('show');

        // [v60.Industrial] Modo Whisper: La inferencia procesa la frase acumulativa completa
        if (data.isWhisper) {
            if (transcriptionText) {
                transcriptionText.textContent = text;
            }
            return;
        }

        // Modo Vosk estándar (Español / Inglés y otros idiomas de catálogo): Fragmentos discretos
        const confirmed = this.audio.get('voskConfirmedSegments') || [];

        if (data.isFinal) {
            confirmed.push(text);
            this.audio.setState({ voskConfirmedSegments: [...confirmed] });
            if (transcriptionText) transcriptionText.textContent = confirmed.join(' ');
        } else {
            const currentFull = confirmed.join(' ');
            if (transcriptionText) transcriptionText.textContent = (currentFull ? currentFull + ' ' : '') + text;
        }
    }

    _onVoskBusy(data) {
        console.warn('⚠️ [SERVER-BUSY] Vosk saturado:', data);
        if (typeof window.showSystemMessage === 'function') {
            window.showSystemMessage(`⚠️ Servidor saturado (${data.current}/${data.limit}). Reintentando...`);
        }
        // Forzar detención visual de grabación para evitar loops
        if (this.audio.get('isRecording')) {
            if (typeof window.stopRecording === 'function') window.stopRecording(true);
        }
    }

    _onVoskMetrics(data) {
        // [v60.1-METRICS] Actualizar estado global con telemetría de Vosk
        this.audio.setState({
            voskInferenceTime: data.inferenceTime,
            voskActiveSlots: data.activeSlots,
            voskMaxSlots: data.maxSlots
        });

        // Notificar a la UI del Master si existe
        if (window.isMaster && typeof window.updateMasterHealthUI === 'function') {
            window.updateMasterHealthUI(data);
        }
    }

    _onVoskResult(data) {
        console.log('✅ Vosk result:', data);
    }

    _onTranscriptionPartial(data) {
        // Implementación espejo de vosk-partial si es necesario
    }

    async _onTranscriptionResult(data) {
        // [v60.1] RUTA DE SUB-USUARIO
        if (data && data.subUserId && data.subUserId !== 'root') {
            try {
                let messageCategory = (window.selectedCategories && window.selectedCategories[0]) || 'General';

                if (window.lastUsersData) {
                    for (const u of window.lastUsersData) {
                        if (u.subUsers) {
                            const su = u.subUsers.find(s => s.subUserId === data.subUserId);
                            if (su && su.category) {
                                messageCategory = su.category;
                                break;
                            }
                        }
                    }
                }

                const text = (data.text || '').trim();
                if (!text) return;

                const subUserText = text || '🎙️ Mensaje de audio';

                if (data.audioData && typeof window.sendFinalMessageWithBlob === 'function') {
                    let bufferData = data.audioData;
                    if (bufferData && bufferData.type === 'Buffer' && Array.isArray(bufferData.data)) {
                        bufferData = new Uint8Array(bufferData.data);
                    }

                    const rate = (data.mimeType && data.mimeType.includes('rate=')) ? parseInt(data.mimeType.split('rate=')[1]) : 16000;
                    if (typeof window.pcmToWav === 'function') {
                        const wavBuffer = window.pcmToWav(bufferData, rate);
                        const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });

                        await window.sendFinalMessageWithBlob(
                            audioBlob,
                            'audio/wav',
                            subUserText,
                            data.streamId || `sub-st-${data.subUserId}-${Date.now()}`,
                            messageCategory,
                            data.subUserId
                        );
                    }
                } else if (typeof window.safeEmit === 'function') {
                    window.safeEmit('send-message', {
                        text: subUserText,
                        category: messageCategory,
                        subUserId: data.subUserId, isVoice: true, convertNumbers: Boolean(window.convertNumbersEnabled)
                    });
                }

                if (typeof window.triggerVibration === 'function') window.triggerVibration(40);
            } catch (e) { console.warn('Error sending subuser message', e); }

            const transcriptionBox = this.dom.get('chat', 'transcriptionBox');
            if (transcriptionBox && !window.isRecording) transcriptionBox.classList.remove('show');
            return;
        }

        console.log(`🏁 [REFACTOR] [VOSK-RESULT] Iniciando procesamiento final. Texto: "${data.text}"`);

        if (window.pendingCaptureTimeout) {
            clearTimeout(window.pendingCaptureTimeout);
            window.pendingCaptureTimeout = null;
        }

        // ⚡ [v60.PROMISE-BARRIER] Sincronización reactiva Cero-Polling / Cero-Delay
        // Si el audio se está empaquetando en el post-roll (ej: en palabras cortas de 1 vocablo),
        // esperamos reactivamente la resolución de la promesa en curso (hasta 240ms de techo Murphy).
        const sendAudio = this.audio.get('sendAudio');
        let pendingAudioBlob = this.audio.get('pendingAudioBlob');
        let pendingBlobUrl = this.audio.get('pendingAudioBlobUrl');
        let pendingMimeType = this.audio.get('pendingMimeType') || 'audio/wav';

        const audioPromise = this.audio.get('currentAudioPromise');
        if (sendAudio && !pendingAudioBlob && audioPromise) {
            try {
                const timeoutGuard = new Promise(r => setTimeout(() => r(null), 240));
                const audioResult = await Promise.race([audioPromise, timeoutGuard]);
                if (audioResult && audioResult.blob) {
                    pendingAudioBlob = audioResult.blob;
                    pendingBlobUrl = audioResult.blobUrl;
                    pendingMimeType = audioResult.mimeType || 'audio/wav';
                }
            } catch (e) {
                console.warn('⚠️ [SocketHandlers] Error en Promise Barrier:', e);
            }
        }

        this.audio.setState({ isWaitingForVosk: false, currentAudioPromise: null });

        if (this.audio.get('messageSentForCurrentCapture')) {
            console.warn('⚠️ [SocketHandlers] El mensaje para esta captura ya fue enviado. Abortando duplicado.');
            return;
        }

        const finalSegment = (data.text || '').trim();
        const isWhisperMode = (data && data.isWhisper) || (this.audio.get('transcriptionMode') === 'whisper') || (window.currentLang === 'eu' || window.currentLang === 'gl');

        let finalText = '';
        if (isWhisperMode) {
            finalText = finalSegment || '🎙️ Mensaje de audio';
        } else {
            // [v60.ANTI-DUPLICATE] El servidor es la Fuente Única de Verdad en transcription-result.
            // Si el servidor envía texto consolidado (data.text), lo usamos directamente.
            // Solo recurrimos a voskConfirmedSegments si el servidor no envió texto pero tenemos parciales locales.
            const confirmed = this.audio.get('voskConfirmedSegments') || [];
            if (finalSegment) {
                finalText = finalSegment;
            } else if (confirmed.length > 0) {
                finalText = confirmed.join(' ').trim();
            } else {
                finalText = '🎙️ Mensaje de audio';
            }
        }

        // [v60.8] LIMPIEZA FINAL: Esconder el cuadro de "Procesando..." pase lo que pase
        const transcriptionBox = document.getElementById('transcriptionBox');
        if (transcriptionBox) {
            transcriptionBox.classList.remove('show');
        }

        console.log(`📝 [SocketHandlers] Texto final consolidado: "${finalText}"`);

        // Reset de segmentos para la próxima captura
        this.audio.setState({ voskConfirmedSegments: [] });
        finalText = finalText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]|[\u001b\u009b]\[[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');

        // sendAudio y pendingAudioBlob ya resueltos reactivamente en la Promise Barrier

        console.log(`📡 [SocketHandlers] Decisión de envío: sendAudio=${sendAudio}, hasBlob=${!!pendingAudioBlob}, streamId=${this.audio.get('activeStreamingIdForVosk')}`);

        if (sendAudio && pendingAudioBlob && typeof window.sendFinalMessageWithBlob === 'function') {
            console.log('🚀 [SocketHandlers] DISPARANDO: Audio + Texto');
            this.audio.setState({ messageSentForCurrentCapture: true });
            await window.sendFinalMessageWithBlob(
                pendingAudioBlob,
                this.audio.get('pendingMimeType'),
                finalText,
                this.audio.get('activeStreamingIdForVosk'),
                this.audio.get('pendingAudioBlobUrl')
            );
        } else if (finalText) {
            console.log('🚀 [SocketHandlers] DISPARANDO: Solo Texto');
            this.audio.setState({ messageSentForCurrentCapture: true });
            const messageCategory = (window.selectedCategories && window.selectedCategories[0]) || 'General';
            if (typeof window.safeEmit === 'function') {
                window.safeEmit('send-message', {
                    text: finalText,
                    category: messageCategory,
                    streamId: this.audio.get('activeStreamingIdForVosk'), isVoice: true, convertNumbers: Boolean(window.convertNumbersEnabled)
                });
            }
            if (typeof window.triggerVibration === 'function') window.triggerVibration(40);
        } else {
            console.warn('🛑 [SocketHandlers] No hay nada que enviar (ni texto ni audio)');
        }

        const box = transcriptionBox || this.dom.get('chat', 'transcriptionBox');
        if (box) box.classList.remove('show');
        const transcriptionText = this.dom.get('chat', 'transcriptionText');
        if (transcriptionText) transcriptionText.textContent = '';
    }

    _onAudioStreamStart(data) {
        console.log('🎵 Stream started:', data);
        if (data && data.user && data.user !== window.currentUsername) {
            if (typeof window.showSystemMessage === 'function') {
                window.showSystemMessage(`🎙️ ${data.user} está transmitiendo audio en tiempo real...`);
            }
        }
    }

    _onAudioStreamData(data) {
        // TODO: Procesar chunks de audio
    }

    _onAudioStreamEnd(data) {
        console.log('🎵 Stream ended:', data);
        // TODO: Finalizar reproducción
    }

    // ────────────────────────────────────────────────────────
    // 🏷️ CATEGORY HANDLERS
    // ────────────────────────────────────────────────────────

    setupCategoryHandlers() {
        this.socket.on('categories-config', (data) => this._onCategoriesConfig(data));
        this.socket.on('categories-updated', (data) => this._onCategoryUpdate(data));
        this.socket.on('category-update', (data) => this._onCategoryUpdate(data)); // Legacy fallback
    }

    _onCategoriesConfig(data) {
        window.currentCategories = data.categories || [];

        // [v60.ELITE] PROTECCIÓN DE SOBERANÍA
        // Solo aceptamos el 'false' del servidor si el asiento Master está realmente ocupado por OTRO usuario.
        if (data.isMaster) {
            window.isMaster = true;
        } else if (window.isMaster) {
            console.log('🛡️ [ELITE] Sincronización de categorías: Manteniendo soberanía reconocida.');
        } else {
            window.isMaster = false;
        }

        window.maxCategories = data.maxCategories || 25;
        window.hasRoomPin = !!data.hasRoomPin; // Guardar estado global

        const pinContainer = document.getElementById('pinInputContainer');
        const pinInput = document.getElementById('pinInput');
        if (pinContainer && !window.currentUsername) {
            // El campo PIN se muestra si soy candidato a Master O si la sala tiene PIN
            const shouldShowPin = window.isMasterCandidate || window.hasRoomPin;
            pinContainer.style.display = shouldShowPin ? 'flex' : 'none';

            if (pinInput) {
                const isVacant = !data.masterId; // Aproximación si no hay masterId
                window.isRoomVacant = isVacant;
                if (window.isMasterCandidate) {
                    pinInput.placeholder = isVacant ?
                        (window.localesData?.login?.create_room_pin || 'Crear PIN de Sala (En blanco = Libre)') :
                        (window.localesData?.login?.master_recovery_pin || 'PIN de Recuperación Master');
                } else if (window.hasRoomPin) {
                    pinInput.placeholder = window.localesData?.interface?.room_pin || 'PIN de Sala';
                }
            }
        }

        if (typeof window.updateCategorySelect === 'function') window.updateCategorySelect();
        if (typeof window.updateLoginMasterButton === 'function') window.updateLoginMasterButton();
        if (window.currentUsername && typeof window.createFilterBar === 'function') {
            window.createFilterBar();
        }
    }

    _onCategoryUpdate(data) {
        console.log('🔄 [REFACTOR] Categorías actualizadas por el Master.');
        window.currentCategories = data.categories || [];
        if (typeof window.updateCategorySelect === 'function') window.updateCategorySelect();
        if (window.currentUsername) {
            if (window.lastUsersData && typeof window.updateUsersList === 'function') {
                window.updateUsersList(window.lastUsersData);
            }
            if (typeof window.createFilterBar === 'function') window.createFilterBar();
            if (typeof window.filterMessages === 'function') window.filterMessages();
        }
        const catManagerList = document.getElementById('catManagerList');
        if (catManagerList && typeof window.renderCategoryManagerList === 'function') {
            window.renderCategoryManagerList(catManagerList);
            const counter = document.querySelector('.cat-counter');
            if (counter) counter.textContent = `${window.currentCategories.length} / ${window.maxCategories}`;
        }
        if (typeof window.showCategoryNotification === 'function') window.showCategoryNotification('📋 Categorías actualizadas');
    }

    _onCategoryDeleted(data) {
        console.log('❌ Category deleted:', data);
    }

    // ────────────────────────────────────────────────────────
    // 🎚️ TRIGGER HANDLERS
    // ────────────────────────────────────────────────────────

    setupTriggerHandlers() {
        // Soporte multievento para versiones legacy
        const triggerEvents = ['trigger-sync', 'triggers-sync', 'triggers-list', 'triggers'];
        triggerEvents.forEach(evt => {
            this.socket.on(evt, (data) => {
                this._onTriggerSync(data);
            });
        });

        this.socket.on('trigger-update', (data) => this._onTriggerUpdate(data));
        this.socket.on('trigger-fire', (data) => this._onTriggerFire(data));
        this.socket.on('trigger-deleted', (data) => this._onTriggerDeleted(data));

        // [v60.Elite] Sincronización Global de Reloj SMPTE/LTC (Blindaje Murphy #14: Filtrado de canal y coherencia con Flywheel)
        this.socket.on('smpte-update', (data) => {
            if (!data) return;
            const currentChan = window.smpteCapture ? window.smpteCapture.currentChannelIndex : 0;
            if (typeof data.channel !== 'undefined' && data.channel !== currentChan) return;

            if (!this.triggersModule) {
                const clock = document.getElementById('smpteClockDisplay');
                if (clock && data.timecode) clock.innerText = data.timecode;
            }

            const dot = document.getElementById('smpteSignalDot');
            if (dot) {
                dot.style.background = '#00ff00';
                dot.style.boxShadow = '0 0 10px #00ff00';
                clearTimeout(window._smpteDotTimeout);
                window._smpteDotTimeout = setTimeout(() => {
                    dot.style.background = '#333';
                    dot.style.boxShadow = 'none';
                }, 500);
            }
        });

        this.socket.on('smpte-signal-status', (data) => {
            if (!data) return;
            const currentChan = window.smpteCapture ? window.smpteCapture.currentChannelIndex : 0;
            if (typeof data.channel !== 'undefined' && data.channel !== currentChan) return;

            const dot = document.getElementById('smpteSignalDot');
            if (dot) {
                if (data.active) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                    dot.style.background = '#333';
                }
            }
        });

        // [v60.Elite] Sincronización de Soberanía Compartida
        this.socket.on('active-claims-updated', (claims) => {
            window.activeClaims = claims || {};
            if (typeof window.renderTriggersList === 'function') {
                window.renderTriggersList();
            }
        });
    }

    setupSystemHandlers() {
        this.socket.on('dictionary-data', (data) => this._onDictionarySync(data));
        this.socket.on('dictionary-updated', (data) => this._onDictionarySync(data));
        this.socket.on('triggers-data', (data) => this._onTriggerSync(data));
        this.socket.on('system-config', (data) => this._onSystemConfig(data));
        this.socket.on('cache-status', (data) => this._onCacheStatus(data));
        this.socket.on('cache-cleared', (data) => this._onCacheCleared(data));
        this.socket.on('cache-limit-updated', (data) => this._onCacheLimitUpdated(data));
        this.socket.on('global-settings-updated', (data) => this._onGlobalSettingsUpdated(data));
        this.socket.on('babel-dictionary-loaded', (data) => this._onBabelSync(data));
    }

    _onDictionarySync(data) {
        // [v60] El servidor envía { words: [...], lang: '...' }
        const dict = (data && data.words) ? data.words : (Array.isArray(data) ? data : []);

        if (!Array.isArray(dict)) {
            console.warn('⚠️ [SocketHandlers] Formato de diccionario inválido recibido:', data);
            return;
        }

        window.currentDictionary = dict;
        console.log(`📖 [SocketHandlers] Diccionario sincronizado (${dict.length} palabras)`);

        if (typeof window.renderDictionary === 'function') {
            window.renderDictionary();
        }
    }

    _onSystemConfig(data) {
        // Reservado para futura lógica de configuración
    }

    _onCacheStatus(data) {
        if (typeof window.updateCacheVisuals === 'function') {
            window.updateCacheVisuals(data.limitMB || data.limit, data.currentMB || data.current);
        }
    }

    _onCacheCleared(data) {
        if (typeof window.showGlobalToast === 'function') {
            window.showGlobalToast(data?.message || '🧹 El Master ha vaciado la caché del servidor.', 'success');
        }
        // [v60.1] SINCRONIZACIÓN INMEDIATA: Forzar visual de 0MB en todas las pestañas
        if (typeof window.updateCacheVisuals === 'function') {
            window.updateCacheVisuals(undefined, 0);
        }
    }

    _onCacheLimitUpdated(data) {
        if (typeof window.updateCacheVisuals === 'function') {
            window.updateCacheVisuals(data.limit, window._currentCacheUsageMB || 0);
        }
    }

    _onGlobalSettingsUpdated(data) {
        console.log('⚙️ Configuración global actualizada:', data);
        if (data.lang && window.currentLang !== data.lang) {
            // Sincronización forzada de idioma si es necesario
        }
    }

    _onBabelSync(data) {
        try {
            if (!data || typeof data !== 'object') return;
            const lang = String(data.lang || 'es').toLowerCase();
            const count = typeof data.count === 'number' ? data.count : (Array.isArray(data.words) ? data.words.length : 0);
            const words = Array.isArray(data.words) ? data.words : [];

            // 1. Almacenar la lista oficial del servidor para la UI
            window.currentBabelDictionary = words;

            if (typeof window.renderBabelExcludeTags === 'function') {
                try { window.renderBabelExcludeTags(); } catch (_) { }
            }

            // 2. Sincronización silenciosa de estado (sin alerta flotante invasiva)
            window._babelFirstLoad = false;
            window._lastBabelLang = lang;
            window._lastBabelCount = count;
            console.log(`🔇 [SocketHandlers] Escudo Babel sincronizado en segundo plano para [${lang.toUpperCase()}] (${count} términos).`);
        } catch (e) {
            console.warn('⚠️ [SocketHandlers] Error defensivo procesando babel-dictionary-loaded:', e.message);
        }
    }

    _onMasterAlertsUpdate(data) {
        console.log('🔔 Alertas de Master actualizadas:', data);
        if (typeof window.saveMasterAlertsLocally === 'function') {
            window.saveMasterAlertsLocally(data);
        }
        if (typeof window.syncAlertsFromServer === 'function' && window.currentUsername) {
            window.syncAlertsFromServer(window.currentUsername);
        }
    }

    _onSubUserRemoved(data) {
        const id = data.subUserId;
        console.warn(`🗑️ Sub-usuario eliminado por el servidor: ${id}`);
        if (typeof window.stopSubUserCapture === 'function') {
            window.stopSubUserCapture(id);
        }
    }


    _onTriggerSync(data) {
        const serverTriggers = data.serverTriggers || data; // Soporte para ambos formatos

        if (Array.isArray(serverTriggers)) {
            window.serverTriggers = serverTriggers;
            if (typeof window.setServerTriggers === 'function') {
                window.setServerTriggers(serverTriggers);
            }
        }

        if (data.localTriggers && typeof window.setLocalTriggers === 'function') {
            window.setLocalTriggers(data.localTriggers);
        }

        if (typeof window.renderTriggersList === 'function') {
            window.renderTriggersList();
        }

        if (typeof data.enabled !== 'undefined' && typeof window.setTriggersEnabled === 'function') {
            window.setTriggersEnabled(data.enabled);
        }

        // [v60.Elite] Sincronización proactiva post-carga para evitar race condition
        if (typeof window.getEnabledTriggerIds === 'function') {
            this.socket.emit('sync-triggers-state', { enabledTriggerIds: window.getEnabledTriggerIds() });
        }
    }

    _onTriggerFire(data) {
        console.log('🔫 [REFACTOR] Trigger disparado:', data);
        if (typeof window.showCatFeedback === 'function') {
            window.showCatFeedback(`Trigger: ${data.triggerId}`, 'info');
        }
    }

    _onTriggerDeleted(data) {
        console.log('❌ Trigger deleted:', data);
    }

    // ────────────────────────────────────────────────────────
    // 🔔 NOTIFICATION HANDLERS
    // ────────────────────────────────────────────────────────

    setupNotificationHandlers() {
        this.socket.on('notification', (data) => this._onNotification(data));
        this.socket.on('alert', (data) => this._onAlert(data));
        this.socket.on('master-alerts-update', (data) => this._onMasterAlertsUpdate(data));
        this.socket.on('system-message', (data) => this._onSystemMessage(data));
        this.socket.on('error-message', (message) => this._onErrorMessage(message));
        this.socket.on('broadcast-kick', (data) => this._onBroadcastKick(data));
        this.socket.on('room-pin-updated', (data) => this._onRoomPinUpdated(data));
        this.socket.on('room-pin-reset', (data) => this._onRoomPinReset(data));
        this.socket.on('message-history', (history) => this._onMessageHistory(history));
        this.socket.on('user-speaking', (data) => this._onUserSpeaking(data));
        this.socket.on('vosk-status', (data) => this._onVoskStatus(data));
        this.socket.on('server-info', (data) => this._onServerInfo(data));
        this.socket.on('subuser-removed', (data) => this._onSubUserRemoved(data));
        this.socket.on('translation-engine-status', (data) => {
            window.isTranslationAvailable = Boolean(data && data.available);
            if (typeof window.updateTranslationControlsAvailability === 'function') {
                window.updateTranslationControlsAvailability(window.isTranslationAvailable);
            }
        });
        this.socket.on('system-warning-translation-disabled', (data) => {
            window.isTranslationAvailable = false;
            const transDisabledTemplate = (window.localesData && window.localesData.chat && window.localesData.chat.status_translation_disabled) 
                || 'Traducción desactivada del sistema';
            const warnText = `⚠️ ${transDisabledTemplate}`;
            if (typeof window.showGlobalToast === 'function') {
                window.showGlobalToast(warnText, 'warning', 6000, { type: 'translation_disabled' });
            }
            if (typeof window.updateTranslationControlsAvailability === 'function') {
                window.updateTranslationControlsAvailability(false);
            }
        });
    }

    _onNotification(data) {
        console.log('🔔 Notification:', data);
        if (typeof window.showGlobalToast === 'function') window.showGlobalToast(data.text || data.message, 'info');
    }

    _onAlert(data) {
        console.error('⚠️ Alert:', data);
        if (typeof window.showGlobalToast === 'function') window.showGlobalToast(data.text || data.message, 'error');
    }

    _onSystemMessage(data) {
        if (typeof window.showSystemMessage === 'function') window.showSystemMessage(data.text || data.message);
    }

    _onErrorMessage(message) {
        const prefix = (window.localesData?.chat?.error_prefix || 'Error: ');
        if (typeof window.showCatFeedback === 'function') window.showCatFeedback(prefix + message, 'error');
    }

    _onBroadcastKick(data) {
        if (window.isMaster) return; // [v60.Elite] Escudo de Autoridad: El Master es inmune.

        const myToken = localStorage.getItem('talkme_session_token');
        const isTarget = (this.socket.id === data.targetId || (data.targetToken && data.targetToken === myToken));

        if (isTarget) {
            console.warn('🚫 Has sido expulsado del servidor por decisión del Maestro.');
            const overlay = document.getElementById('kickedOverlay');
            if (overlay) {
                overlay.style.display = 'flex';
                const reason = document.getElementById('kickedReason');
                if (reason) {
                    if (data.message && data.message !== 'Has sido expulsado por el maestro.') {
                        reason.innerHTML = data.message;
                        reason.dataset.customReason = "true";
                    } else {
                        reason.innerHTML = window.localesData?.kicked?.reason || "Has sido expulsado de la sala por el Maestro supremo.<br>Tu sesión ha sido revocada de forma permanente.";
                        delete reason.dataset.customReason;
                    }
                }
            }
            const input = document.getElementById('messageInput');
            if (input) input.disabled = true;

            // Registrar comportamiento del botón de recarga
            const btnReload = document.getElementById('btnReloadKickedSession');
            if (btnReload) {
                btnReload.onclick = () => {
                    if (window.kickedReloadTimeout) {
                        clearTimeout(window.kickedReloadTimeout);
                        window.kickedReloadTimeout = null;
                    }
                    sessionStorage.removeItem('talkme_active_session');
                    localStorage.removeItem('talkme_session_token');

                    const kickedOverlay = document.getElementById('kickedOverlay');
                    if (kickedOverlay) kickedOverlay.style.display = 'none';

                    const userModal = document.getElementById('userModal');
                    if (userModal) userModal.classList.remove('hidden');

                    const textInput = document.getElementById('messageInput');
                    if (textInput) textInput.disabled = false;
                };
            }

            // Cancelar el timeout previo si existía
            if (window.kickedReloadTimeout) clearTimeout(window.kickedReloadTimeout);
            window.kickedReloadTimeout = setTimeout(() => { window.location.reload(); }, 15000);
        }
    }

    _onRoomPinUpdated(data) {
        const pinContainer = document.getElementById('pinInputContainer');
        if (pinContainer && !window.currentUsername) {
            pinContainer.style.display = data.hasRoomPin ? 'flex' : 'none';
            if (!data.hasRoomPin) {
                const pinInput = document.getElementById('pinInput');
                if (pinInput) pinInput.value = '';
            }
        }
        if (window.currentUsername && typeof window.showCatFeedback === 'function') {
            const fallbackProtected = '🔑 El Master ha protegido la sala con PIN';
            const fallbackRemoved = '🔓 El Master ha eliminado el PIN de la sala';
            const msg = data.hasRoomPin ?
                (window.localesData?.login?.pin_protected || fallbackProtected) :
                (window.localesData?.login?.pin_removed || fallbackRemoved);
            window.showCatFeedback(msg, 'info');
        }
    }

    _onRoomPinReset(data) {
        if (window.isMaster) return;
        console.log("🔒 PIN de sala reseteado por Master. Solicitando validación...");
        window.pinResetAttempts = 3;

        const overlay = document.getElementById('pinResetOverlay');
        const input = document.getElementById('inputPinReset');
        const label = document.getElementById('pinResetAttemptsLabel');
        const btnVerify = document.getElementById('btnVerifyPinReset');

        if (overlay) {
            overlay.style.display = 'flex';
            if (input) input.value = '';
            if (label) {
                label.style.visibility = 'hidden';
                label.textContent = (window.localesData?.pin_reset?.attempts_remaining || 'Intentos restantes: {attempts}').replace('{attempts}', window.pinResetAttempts);
            }
        }

        if (btnVerify) {
            btnVerify.onclick = () => {
                const pin = input ? input.value.trim() : '';
                this.socket.emit('verify-pin', { pin }, (resp) => {
                    if (resp && resp.success) {
                        overlay.style.display = 'none';
                        window.currentRoomPin = pin;
                        // Sincronizar el PIN en sessionStorage/localStorage
                        if (typeof window.saveLocalSession === 'function') {
                            const session = window.restoreLocalSession() || {};
                            session.roomPin = pin;
                            window.saveLocalSession(session.username, session.categories, session.isMaster);
                        }
                        if (typeof window.showCatFeedback === 'function') {
                            window.showCatFeedback('Acceso validado correctamente', 'success');
                        }
                    } else {
                        window.pinResetAttempts--;
                        if (label) {
                            label.style.visibility = 'visible';
                            label.textContent = (window.localesData?.pin_reset?.attempts_remaining || 'Intentos restantes: {attempts}').replace('{attempts}', window.pinResetAttempts);
                        }

                        if (window.pinResetAttempts <= 0) {
                            overlay.style.display = 'none';
                            const kickedOverlay = document.getElementById('kickedOverlay');
                            if (kickedOverlay) {
                                kickedOverlay.style.display = 'flex';
                                const kickedReason = document.getElementById('kickedReason');
                                if (kickedReason) {
                                    kickedReason.innerHTML = window.localesData?.kicked?.reason || "Has sido expulsado de la sala por el Maestro supremo.<br>Tu sesión ha sido revocada de forma permanente.";
                                    delete kickedReason.dataset.customReason;
                                }
                            }
                            const textInput = document.getElementById('messageInput');
                            if (textInput) textInput.disabled = true;

                            // Programar recarga
                            if (window.kickedReloadTimeout) clearTimeout(window.kickedReloadTimeout);
                            window.kickedReloadTimeout = setTimeout(() => { window.location.reload(); }, 15000);
                        } else {
                            if (typeof window.showCatFeedback === 'function') {
                                window.showCatFeedback(window.localesData?.login?.error_invalid_pin || 'PIN incorrecto', 'error');
                            }
                        }
                    }
                });
            };
        }
    }

    _onMessageHistory(history) {
        const messagesContainer = this.dom.get('chat', 'container');
        const isEmpty = !messagesContainer || messagesContainer.querySelectorAll('.message').length === 0;
        if (isEmpty && messagesContainer) messagesContainer.innerHTML = '';

        history.forEach(msg => {
            const isOwn = msg.user === window.currentUsername;
            if (typeof window.addMessage === 'function') {
                window.addMessage(msg.user, msg.text, isOwn, msg.time, msg.audioUrl || msg.audioBlobUrl, msg.category, msg.imageUrl);
            }
        });

        if (typeof window.scrollToBottom === 'function') {
            const scrollAttempts = [50, 200, 500, 1000, 2000];
            scrollAttempts.forEach(delay => {
                setTimeout(() => window.scrollToBottom(), delay);
            });
        }
    }

    _onUserSpeaking(data) {
        if (!data || !data.user) return;

        try {
            const indicator = document.querySelector(`.user-item[data-user="${data.user}"] .speaking-indicator`);
            if (indicator) indicator.classList.toggle('active', !!data.speaking);
        } catch (_) { }

        // [v60.Elite] Alerta flotante superior para el resto de usuarios (como mensaje de bienvenida)
        if (data.speaking && data.user !== window.currentUsername) {
            if (typeof window.showSystemMessage === 'function') {
                window.showSystemMessage(`🎙️ ${data.user} está hablando...`);
            }
        }

        if (!window.currentUsername) return;
        const speakingUser = this.dom.get('status', 'speakingUser');
        const userSpeakingIndicator = this.dom.get('status', 'indicator');

        const activeFilters = window.activeFilters || [];
        const showAll = activeFilters.includes(window.FILTER_ALL_KEY || '__ALL__') || activeFilters.includes('all');
        const isMaster = data.user === (window.MASTER_USERNAME || 'Master');

        const msgCatInfo = (typeof window.getCategoryInfo === 'function') ? window.getCategoryInfo(data.category) : null;
        const isFiltered = msgCatInfo ? (activeFilters.includes(msgCatInfo.id) || activeFilters.includes(msgCatInfo.name)) : true;

        if (!showAll && !isMaster && data.category && !isFiltered) {
            if (speakingUser && userSpeakingIndicator && speakingUser.textContent === data.user) {
                userSpeakingIndicator.classList.remove('show');
                userSpeakingIndicator.style.display = 'none';
            }
            return;
        }

        if (data.speaking) {

            if (speakingUser && userSpeakingIndicator) {
                if (window.userSpeakingTimeout) clearTimeout(window.userSpeakingTimeout);

                const speakColor = (typeof window.getUserColor === 'function') ? window.getUserColor(data.user, data.category) : null;
                speakingUser.textContent = data.user;
                speakingUser.style.color = speakColor || 'var(--accent-orange)';
                userSpeakingIndicator.classList.add('show');
                userSpeakingIndicator.style.display = 'flex';

                const globalToast = this.dom.get('ui', 'globalToast');
                if (globalToast) globalToast.appendChild(userSpeakingIndicator);

                window.userSpeakingTimeout = setTimeout(() => {
                    if (speakingUser.textContent === data.user) {
                        userSpeakingIndicator.classList.remove('show');
                        userSpeakingIndicator.style.display = 'none';
                    }
                }, 10000);
            }
        } else if (speakingUser && userSpeakingIndicator) {
            if (speakingUser.textContent === data.user) {
                userSpeakingIndicator.classList.remove('show');
                userSpeakingIndicator.style.display = 'none';
                if (window.userSpeakingTimeout) clearTimeout(window.userSpeakingTimeout);
            }
        }
    }

    _onVoskStatus(data) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const hasSpeechAPI = !!SpeechRecognition;
        let mode = data.mode || 'local-fallback';

        // Validar si el modo Browser es necesario como fallback de emergencia
        if (!data.available && mode === 'local-fallback' && hasSpeechAPI) {
            mode = 'browser';
        }

        window.transcriptionMode = mode;
        if (this.audio && this.audio.setState) {
            this.audio.setState({ transcriptionMode: mode });
        }
        window._vosk_status_received = true;
        console.log(`🎙️ [TRANSCRIPTION-MODE] Sincronizado con Servidor: ${mode}`);
    }

    _onServerInfo(data) {
        const ips = data.ips || [];
        const port = data.port || 3000;
        const networkIps = ips.filter(ip => ip !== '127.0.0.1');
        const displayIps = networkIps.length > 0 ? networkIps : ips;
        const urlList = displayIps.map(ip => `https://${ip}:${port}/`);
        const primaryUrl = urlList.length > 0 ? urlList[0] : '';
        window._serverIps = primaryUrl;
        window._serverPort = port;

        if (typeof window.updateDynamicIPDisplays === 'function') {
            window.updateDynamicIPDisplays(primaryUrl);
        }
    }
}

export { SocketHandlers };
