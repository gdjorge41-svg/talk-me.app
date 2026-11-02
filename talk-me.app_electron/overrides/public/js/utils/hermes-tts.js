/**
 * 🗣️ HermesTTS - Motor de Síntesis de Voz Offline (Text-to-Speech)
 * public/js/utils/hermes-tts.js
 */
export class HermesTTS {
    constructor() {
        this.synth = window.speechSynthesis;
        
        // Evitar Garbage Collection prematura en Chromium
        this.activeUtterance = null;
    }

    get masterEnabled() {
        const userSuffix = window.currentUsername ? `_${window.currentUsername}` : '';
        const userVal = localStorage.getItem(`talkme_hermes_master_enabled${userSuffix}`);
        if (userVal !== null) return userVal === 'true';
        const readText = localStorage.getItem(`talkme_hermes_read_text${userSuffix}`);
        if (readText !== null) return readText === 'true';
        const legacyVal = localStorage.getItem(`talkme_hermes_enabled${userSuffix}`) || localStorage.getItem('talkme_hermes_enabled');
        if (legacyVal !== null) return legacyVal === 'true';
        return false;
    }

    set masterEnabled(val) {
        const userSuffix = window.currentUsername ? `_${window.currentUsername}` : '';
        const boolVal = !!val;
        localStorage.setItem(`talkme_hermes_master_enabled${userSuffix}`, boolVal ? 'true' : 'false');
        localStorage.setItem(`talkme_hermes_read_text${userSuffix}`, boolVal ? 'true' : 'false');
        localStorage.setItem(`talkme_hermes_enabled${userSuffix}`, boolVal ? 'true' : 'false');
        if (!boolVal && this.synth) {
            try { this.synth.cancel(); } catch (_) { }
        }
    }

    get readTextMessages() {
        return this.masterEnabled;
    }

    set readTextMessages(val) {
        this.masterEnabled = val;
    }

    get enabled() {
        return this.masterEnabled;
    }

    set enabled(val) {
        this.masterEnabled = val;
    }

    /**
     * [v60.Elite] Desbloqueo táctil de SpeechSynthesis y AudioContext para navegadores móviles y Firefox
     */
    unlock() {
        if (this.synth) {
            try {
                if (this.synth.paused) {
                    this.synth.resume();
                }
                const silent = new SpeechSynthesisUtterance('');
                silent.volume = 0.01;
                this.synth.speak(silent);
                console.log('🗣️ [HermesTTS] Motor de síntesis de voz desbloqueado.');
            } catch (e) {
                console.warn('⚠️ [HermesTTS] No se pudo desbloquear síntesis:', e);
            }
        }

        // Desbloquear también AudioContext para streams de audio Piper (Euskera/Gallego) en Firefox/Chrome
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                if (!this._audioCtx || this._audioCtx.state === 'closed') {
                    this._audioCtx = new AudioContextClass();
                }
                if (this._audioCtx.state === 'suspended') {
                    this._audioCtx.resume();
                    console.log('🔊 [HermesTTS] AudioContext desbloqueado preventivamente en interacción.');
                }
            }
        } catch (e) {
            console.warn('⚠️ [HermesTTS] No se pudo desbloquear AudioContext:', e);
        }
    }
    getVoiceUri(langCode = null) {
        const userSuffix = window.currentUsername ? `_${window.currentUsername}` : '';
        const lang = langCode || window.currentLang || 'es';
        const baseLang = lang.split('-')[0].toLowerCase();
        
        // 1. Specific voice for active language & user
        const userVal = localStorage.getItem(`talkme_hermes_voice_uri_${baseLang}${userSuffix}`);
        if (userVal !== null) return userVal;
        
        // 2. Specific voice for active language (global)
        const langVal = localStorage.getItem(`talkme_hermes_voice_uri_${baseLang}`);
        if (langVal !== null) return langVal;

        // 3. Fallbacks legados (solo si corresponden al idioma actual)
        const legacyVal = localStorage.getItem(`talkme_hermes_voice_uri${userSuffix}`) || localStorage.getItem('talkme_hermes_voice_uri');
        if (legacyVal && legacyVal !== 'auto') {
            if (this.synth) {
                const voice = this.synth.getVoices().find(v => v.voiceURI === legacyVal);
                if (voice && voice.lang.split('-')[0].toLowerCase() === baseLang) {
                    return legacyVal;
                }
            }
        }
        
        return 'auto';
    }

    get voiceUri() {
        return this.getVoiceUri(window.currentLang);
    }

    set voiceUri(val) {
        const userSuffix = window.currentUsername ? `_${window.currentUsername}` : '';
        const lang = window.currentLang || 'es';
        const baseLang = lang.split('-')[0].toLowerCase();
        localStorage.setItem(`talkme_hermes_voice_uri_${baseLang}${userSuffix}`, val);
        localStorage.setItem(`talkme_hermes_voice_uri_${baseLang}`, val);
        localStorage.setItem(`talkme_hermes_voice_uri${userSuffix}`, val);
    }

    get genderFilter() {
        const userSuffix = window.currentUsername ? `_${window.currentUsername}` : '';
        const userVal = localStorage.getItem(`talkme_hermes_gender${userSuffix}`);
        if (userVal !== null) return userVal;
        return localStorage.getItem('talkme_hermes_gender') || 'all';
    }

    set genderFilter(val) {
        const userSuffix = window.currentUsername ? `_${window.currentUsername}` : '';
        localStorage.setItem(`talkme_hermes_gender${userSuffix}`, val);
    }

    get rate() {
        const userSuffix = window.currentUsername ? `_${window.currentUsername}` : '';
        const userVal = localStorage.getItem(`talkme_hermes_rate${userSuffix}`);
        if (userVal !== null) return parseFloat(userVal);
        return parseFloat(localStorage.getItem('talkme_hermes_rate') || '1.0');
    }

    set rate(val) {
        const userSuffix = window.currentUsername ? `_${window.currentUsername}` : '';
        localStorage.setItem(`talkme_hermes_rate${userSuffix}`, val.toString());
    }

    get readForeignAudio() {
        const userSuffix = window.currentUsername ? `_${window.currentUsername}` : '';
        const userVal = localStorage.getItem(`talkme_hermes_read_foreign_audio${userSuffix}`);
        if (userVal !== null) return userVal === 'true';
        const globalVal = localStorage.getItem('talkme_hermes_read_foreign_audio');
        if (globalVal !== null) return globalVal === 'true';
        return true;
    }

    set readForeignAudio(val) {
        const userSuffix = window.currentUsername ? `_${window.currentUsername}` : '';
        localStorage.setItem(`talkme_hermes_read_foreign_audio${userSuffix}`, val ? 'true' : 'false');
    }

    get filterForeignAudio() {
        return this.readForeignAudio;
    }

    set filterForeignAudio(val) {
        this.readForeignAudio = val;
    }

    get foreignAudioMode() {
        const userSuffix = window.currentUsername ? `_${window.currentUsername}` : '';
        const userVal = localStorage.getItem(`talkme_hermes_foreign_audio_mode${userSuffix}`);
        if (userVal !== null) return userVal;
        const globalVal = localStorage.getItem('talkme_hermes_foreign_audio_mode');
        if (globalVal !== null) return globalVal;
        return 'play_then_tts';
    }

    set foreignAudioMode(val) {
        const userSuffix = window.currentUsername ? `_${window.currentUsername}` : '';
        localStorage.setItem(`talkme_hermes_foreign_audio_mode${userSuffix}`, val);
    }

    /**
     * Determina de forma aproximada el género de una voz por heurística de nombre
     */
    _getVoiceGender(voiceName) {
        const name = voiceName.toLowerCase();
        const femaleKeywords = ['helena', 'sabina', 'zira', 'laura', 'hazel', 'samantha', 'victoria', 'monica', 'alice', 'anna', 'siri', 'female', 'femenina', 'hermina', 'elena'];
        const maleKeywords = ['pablo', 'david', 'george', 'daniel', 'richard', 'tom', 'mark', 'paul', 'male', 'masculina', 'julio'];

        if (femaleKeywords.some(kw => name.includes(kw))) return 'female';
        if (maleKeywords.some(kw => name.includes(kw))) return 'male';
        return 'unknown';
    }

    /**
     * Devuelve las voces del sistema compatibles con el idioma y filtro de género
     */
    getCompatibleVoices(langCode = 'es') {
        if (!this.synth) return [];
        const baseLang = langCode.split('-')[0].toLowerCase();
        
        let voices = this.synth.getVoices().filter(voice => {
            const voiceLang = voice.lang.split('-')[0].toLowerCase();
            return voiceLang === baseLang;
        });

        // Filtrado por género
        if (this.genderFilter !== 'all') {
            // Intentar primero filtrar de forma estricta (solo las voces identificadas inequívocamente con el género)
            const strictVoices = voices.filter(voice => {
                const gender = this._getVoiceGender(voice.name);
                return gender === this.genderFilter;
            });
            if (strictVoices.length > 0) {
                return strictVoices;
            }
            // Fallback: incluir voces de género desconocido si no hay coincidencia estricta
            voices = voices.filter(voice => {
                const gender = this._getVoiceGender(voice.name);
                return gender === 'unknown' || gender === this.genderFilter;
            });
        }

        return voices;
    }

    /**
     * Sanitiza el texto para que la voz no deletree markdown o URLs
     */
    _sanitizeText(text) {
        if (!text) return '';
        return text
            .replace(/https?:\/\/\S+/g, 'enlace web') // Reemplaza URLs por 'enlace web'
            .replace(/[*_#`~]/g, '') // Elimina caracteres markdown
            .replace(/[\uD800-\uDFFF]./g, '') // Elimina Emojis complejos
            .substring(0, 150) // Cap preventivo de 150 caracteres
            .trim();
    }

    /**
     * Ejecuta la lectura del texto de forma profesional y localizada
     * @param {string} username - Nombre de quien envió el mensaje
     * @param {string} text - Contenido del mensaje de texto
     * @param {string} langCode - Idioma de la interfaz actual (ej. 'es', 'en')
     */
     speak(username, text, langCode = 'es', isAudio = false) {
        console.log(`🗣️ [HermesTTS.speak] Recibido mensaje para hablar de ${username}. Texto: "${text}". Synth: ${!!this.synth}, Enabled: ${this.enabled}, isAudio: ${isAudio}`);
        if (!this.synth || !this.enabled || window.isGlobalMuted) return;

        try {
            console.log(`🗣️ [HermesTTS.speak] Grabando mic: ${window.isRecording}, AudioState isRecording: ${window.audioState?.get('isRecording')}`);
            // Impedir acoplamiento: si se está grabando micrófono, abortamos la lectura
            // 🛡️ [v60.HERMES-SHIELD] Solo silenciar si se está HABLANDO ACTIVAMENTE (PTT presionado o VAD capturando voz),
            // NO simplemente por tener el micrófono pre-autorizado o en espera pasiva (isRecording).
            const isActuallyCapturing = (window.audioState && (window.audioState.get('isCapturingSpeech') === true || window.audioState.get('isPTTActive') === true)) ||
                                        window.isCapturingSpeech === true || window.isPTTActive === true;
            if (isActuallyCapturing) {
                console.log('🔇 [Hermes-Shield] Silenciado: locución propia en curso para prevenir acople.');
                return;
            }

            console.log(`🗣️ [HermesTTS.speak] Cola autoplay: ${window.globalAutoPlayQueue?.length}`);
            // Impedir colisión de audio: si hay reproducción de audios del chat activa
            if (window.globalAutoPlayQueue && window.globalAutoPlayQueue.length > 0) {
                console.log('🔇 [Hermes-Shield] Silenciado para dar prioridad a la cola de audio nativa.');
                return;
            }

            // Chequeo de cualquier reproductor de audio HTML5 activo en el DOM
            const audios = document.querySelectorAll('audio');
            console.log(`🗣️ [HermesTTS.speak] Encontrados ${audios.length} elementos de audio en DOM`);
            for (let a of audios) {
                // 🛡️ [v60.HERMES-SHIELD] Ignorar elementos silentes de keep-alive de iOS o elementos enmudecidos
                const isSilentKeepAlive = a.src && (a.src.includes('data:audio/wav') || a.src.includes('silence') || a.volume < 0.01 || a.muted);
                if (!a.paused && !isSilentKeepAlive) {
                    console.log('🔇 [Hermes-Shield] Silenciado por reproducción activa de audio audible en segundo plano.', a);
                    return;
                }
            }

            // Cancelar locuciones previas sólo si está hablando activamente para evitar bug de Safari/WebKit iOS
            if (this.synth.speaking) {
                this.synth.cancel();
            }

            // 🛡️ [v60.IOS-SAFARI-WAKE] Forzar resume preventivo si el sintetizador está pausado o tras cambio de audio session
            try {
                if (this.synth.paused) {
                    this.synth.resume();
                }
            } catch (_) { }

            const cleanText = this._sanitizeText(text);
            if (!cleanText) return;

            // [v60.Murphy-Defense] Construir la plantilla fonética priorizando el idioma HABLADO (langCode),
            // evitando la trampa de window.localesData (idioma de la UI del receptor, que lo forzaba a español).
            const baseLang = (langCode || 'es').split('-')[0].toLowerCase();
            let formatTemplate = "";

            if (isAudio) {
                if (baseLang === 'eu') formatTemplate = "{text} ... {user}(e)k esana";
                else if (baseLang === 'gl') formatTemplate = "{text} ... dixo {user}";
                else if (baseLang === 'ca') formatTemplate = "{text} ... ha dit {user}";
                else if (baseLang === 'en') formatTemplate = "{text} ... said {user}";
                else if (baseLang === 'ja') formatTemplate = "{text} ... {user}より";
                else if (baseLang === 'de') formatTemplate = "{text} ... sagte {user}";
                else if (baseLang === 'es') formatTemplate = "{text} ... dijo {user}";
                else {
                    // Fallback a locales si existe, o por defecto en español
                    formatTemplate = window.localesData?.messages?.tts_audio_format || "{text} ... dijo {user}";
                }
            } else {
                if (baseLang === 'eu') formatTemplate = "{text} ... {user}(e)k idatzia";
                else if (baseLang === 'gl') formatTemplate = "{text} ... escribiu {user}";
                else if (baseLang === 'ca') formatTemplate = "{text} ... ha escrit {user}";
                else if (baseLang === 'en') formatTemplate = "{text} ... wrote {user}";
                else if (baseLang === 'ja') formatTemplate = "{text} ... {user}より";
                else if (baseLang === 'de') formatTemplate = "{text} ... schrieb {user}";
                else if (baseLang === 'es') formatTemplate = "{text} ... escribió {user}";
                else {
                    // Fallback a locales si existe, o por defecto en español
                    formatTemplate = window.localesData?.messages?.tts_format || "{text} ... escribió {user}";
                }
            }

            // [v60.TTS-PROSODIA] Normalizar nombre de usuario y puntuación terminal
            let safeUser = (username || '').trim();
            if (safeUser.startsWith('Anon') || safeUser.includes('.') && /\d+\.\d+/.test(safeUser)) {
                safeUser = ''; // Evitar deletrear IPs en autoría
            }

            let speechString = "";
            if (!safeUser) {
                // Si no hay usuario válido, emitir únicamente el mensaje limpio
                speechString = cleanText;
            } else {
                // Limpiar puntuación terminal sobrante en cleanText para que no colisione con la pausa
                const textWithoutTrailingDots = cleanText.replace(/[\s\.\,]+$/, '');
                speechString = formatTemplate
                    .replace('{text}', textWithoutTrailingDots)
                    .replace('{user}', safeUser);
            }

            const utterance = new SpeechSynthesisUtterance(speechString);
            utterance.lang = langCode;

            // Selección de voz
            let targetVoice = null;
            const allVoices = this.synth.getVoices();

            const activeVoiceUri = this.getVoiceUri(langCode);
            if (activeVoiceUri !== 'auto') {
                const voice = allVoices.find(v => v.voiceURI === activeVoiceUri);
                // [v60.TTS-FIX] Validar que el idioma de la voz seleccionada coincida con el idioma actual
                if (voice && voice.lang.split('-')[0].toLowerCase() === langCode.split('-')[0].toLowerCase()) {
                    targetVoice = voice;
                }
            }

            // Fallback automático inteligente
            if (!targetVoice) {
                const compatible = this.getCompatibleVoices(langCode);
                if (compatible.length > 0) {
                    targetVoice = compatible[0];
                } else {
                    const baseLang = langCode.split('-')[0].toLowerCase();
                    targetVoice = allVoices.find(v => v.lang.split('-')[0].toLowerCase() === baseLang);
                }
            }

            // [v60.TTS-DEFENSE] Ley de Murphy: Si no existe voz para este idioma en el SO (ej. 'eu', 'gl'),
            // NUNCA delegar a this.synth.speak() sin voz explícita, porque Chromium/Windows asignaría
            // la voz por defecto del sistema (Microsoft Helena en español), deformando el texto por completo.
            if (!targetVoice) {
                const baseLang = langCode.split('-')[0].toLowerCase();
                const unsupportedLangs = ['eu', 'gl', 'ca', 'kk', 'eo'];
                if (unsupportedLangs.includes(baseLang) || allVoices.length > 0) {
                    console.warn(`🔇 [Hermes-Defense] No hay voz instalada en el SO para '${langCode}'. Silenciado para evitar lectura deforme en idioma ajeno.`);
                    window.dispatchEvent(new CustomEvent('hermes-voice-unavailable', {
                        detail: { lang: baseLang, text: cleanText, user: username, isAudio }
                    }));
                    return;
                }
            }

            if (targetVoice) {
                utterance.voice = targetVoice;
            }

            utterance.rate = this.rate;
            utterance.pitch = 1.0;
            // 🛡️ [v60.HERMES-VOLUME] Forzar volumen al máximo contra el ducking/atenuación de iOS
            utterance.volume = 1.0;

            // Evitar Garbage Collector
            this.activeUtterance = utterance;
            window.activeUtterances = window.activeUtterances || new Set();
            window.activeUtterances.add(utterance);
            
            utterance.onstart = () => {
                console.log(`🗣️ [HermesTTS.speak] Locución iniciada: "${speechString}"`);
                // [Telemetría] Registrar uso de Hermes TTS en servidor local para estadísticas de sesión
                if (window.socket && window.socket.connected) {
                    window.socket.emit('hermes-speak-logged');
                }
            };

            utterance.onend = () => {
                console.log('🗣️ [HermesTTS.speak] Locución finalizada.');
                window.activeUtterances.delete(utterance);
                if (this.activeUtterance === utterance) {
                    this.activeUtterance = null;
                }
            };

            utterance.onerror = (e) => {
                console.warn('⚠️ [HermesTTS.speak] Error en síntesis de voz:', e);
                window.activeUtterances.delete(utterance);
                if (this.activeUtterance === utterance) {
                    this.activeUtterance = null;
                }
            };

            this.synth.speak(utterance);
        } catch (error) {
            console.error('❌ [HermesTTS] Error crítico en speak:', error);
            this.activeUtterance = null;
        }
    }

    /**
     * [v60.PIPER-TTS] Reproduce un buffer de audio WAV en streaming procedente de Piper TTS (Euskera, Gallego).
     * Respeta incondicionalmente el Hermes-Shield contra acoples de micrófono.
     * @param {Object} payload { _msgId, user, lang, audioBuffer }
     */
    async playAudioStream(payload) {
        if (!payload || !payload.audioBuffer) return;
        if (!this.enabled || window.isGlobalMuted) return;

        // 🛡️ Hermes-Shield Inquebrantable: Si el micrófono está grabando, abortar reproducción
        if (window.isRecording === true || (window.audioState && (window.audioState.get('isRecording') === true || window.audioState.get('recording') === true))) {
            console.log('🔇 [Hermes-Shield] Stream de audio neuronal descartado para evitar acople con micrófono.');
            return;
        }

        // Si hay audio activo en reproducción en cola nativa, posponer o descartar
        if (window.globalAutoPlayQueue && window.globalAutoPlayQueue.length > 0) {
            console.log('🔇 [Hermes-Shield] Stream descartado para dar prioridad a la cola de audio nativa.');
            return;
        }

        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return;

            if (!this._audioCtx || this._audioCtx.state === 'closed') {
                this._audioCtx = new AudioContextClass();
            }

            if (this._audioCtx.state === 'suspended') {
                await this._audioCtx.resume();
            }

            // Normalizar a ArrayBuffer
            let arrayBuffer = payload.audioBuffer;
            if (arrayBuffer instanceof Uint8Array) {
                arrayBuffer = arrayBuffer.buffer.slice(arrayBuffer.byteOffset, arrayBuffer.byteOffset + arrayBuffer.byteLength);
            } else if (arrayBuffer.buffer instanceof ArrayBuffer) {
                arrayBuffer = arrayBuffer.buffer;
            }

            const audioBuffer = await this._audioCtx.decodeAudioData(arrayBuffer.slice(0));
            const source = this._audioCtx.createBufferSource();
            source.buffer = audioBuffer;

            const gainNode = this._audioCtx.createGain();
            gainNode.gain.value = 1.0;

            source.connect(gainNode);
            gainNode.connect(this._audioCtx.destination);

            source.start(0);
            console.log(`🗣️ [HermesTTS.playAudioStream] Reproduciendo voz neuronal en ${payload.lang} (${audioBuffer.duration.toFixed(2)}s).`);
        } catch (e) {
            console.warn('⚠️ [HermesTTS.playAudioStream] Error al decodificar o reproducir stream de audio:', e.message);
        }
    }
}
