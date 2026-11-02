/**
 * 🌍 LocalizationManager - Descomposición de applyLocales() e i18n
 * 
 * Propósito: Centralizar la lógica de traducción y actualización de la UI
 * en base a archivos JSON de locales.
 */

class LocalizationManager {
    constructor(domManager, audioState) {
        this.dom = domManager;
        this.audio = audioState;
        this.currentLang = localStorage.getItem('talkme_lang') || 'es';
        this.localesData = null;
    }

    /**
     * Inicializa el sistema de idiomas.
     */
    async init() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const urlLang = urlParams.get('lang');
            if (urlLang) {
                this.currentLang = urlLang.toLowerCase();
            } else {
                const res = await fetch('/api/default-lang');
                const data = await res.json();
                if (data && data.defaultLang) {
                    this.currentLang = data.defaultLang.toLowerCase();
                }
            }
        } catch (e) {
            console.warn("⚠️ No se pudo obtener el idioma por defecto:", e);
        }
        await this.loadLocale(this.currentLang);
        this.initLangSwitchers();
    }


    /**
     * Carga un archivo JSON de idioma.
     */
    async loadLocale(lang) {
        if (!lang) return;

        this.currentLang = lang;
        localStorage.setItem('talkme_lang', lang);
        document.documentElement.lang = lang;
        
        // Sincronizar con window por compatibilidad legado
        window.currentLang = lang;

        try {
            const res = await fetch(`./locales/${lang}.json`);
            const json = await res.json();
            this.localesData = json;
            window.localesData = json; // Export for external modules
            
            // Aplicar locales a la UI
            this.applyLocales();
            
            // 5. Notificar a otros módulos (v60.1 Fix)
            window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang: lang } }));
            
            this.updateLangSwitcherUI();
            if (window.lastUsersData && window.lastUsersData.length > 0 && typeof window.updateUsersList === 'function') {
                window.updateUsersList(window.lastUsersData);
            }

        } catch (e) {
            console.error('❌ [Localization] Error cargando locale:', e);
        }

        // [v60.21] HANDSHAKE ROBUSTO: Sincronizar con el servidor una vez aplicadas las locales de la UI
        const syncLang = () => {
            if (window.socket && window.socket.connected) {
                const token = localStorage.getItem('talkme_session_token');
                const payload = {
                    lang: lang,
                    token: token,
                    username: window.currentUsername,
                    roomPin: window.currentRoomPin
                };
                window.socket.emit('set-language', payload);
                window.socket.emit('get-dictionary', payload);
                
                if (window.isRecording) {
                    console.log(`🌐 [Localization] Reiniciando sesión Vosk para idioma: ${lang}`);
                    window.socket.emit('vosk-start');
                }
            } else {
                // Si el socket no está listo, nos aseguramos de que el primer evento 'connect' mande el idioma
                console.log('⏳ [Localization] Socket no listo. Sincronización de idioma pendiente...');
                window.addEventListener('socket-ready', () => syncLang(), { once: true });
            }
        };

        syncLang();
    }

    /**
     * Sanitiza el objeto de locales para eliminar ruidos de strings.
     */
    _sanitizeLocales() {
        if (!this.localesData) return;

        const sanitize = (val) => (typeof val === 'string') ? val.replace(/\s*\/?\s*(\/>|>|&gt;)\s*$/g, '').trim() : val;
        const walk = (obj) => {
            for (let k in obj) {
                if (typeof obj[k] === 'string') obj[k] = sanitize(obj[k]);
                else if (typeof obj[k] === 'object' && obj[k] !== null) walk(obj[k]);
            }
        };
        walk(this.localesData);
    }

    /**
     * Aplica los textos al DOM.
     */
    applyLocales() {
        if (!this.localesData) return;

        this._sanitizeLocales();
        
        const locales = this.localesData;
        const dom = this.dom;

        // --- 1. Sanitización de DOM Estático ---
        this._cleanStaticDOM();

        // --- 2. Login & Modals ---
        const subtitle = document.getElementById('loginSubtitle');
        if (subtitle) subtitle.textContent = locales.login.subtitle;
        
        const usernameInput = document.getElementById('usernameInput');
        if (usernameInput) usernameInput.placeholder = locales.login.placeholder_name;
        
        const pinInputEl = document.getElementById('pinInput');
        if (pinInputEl && locales.login) {
            if (window.isMasterCandidate) {
                pinInputEl.placeholder = window.isRoomVacant ? 
                    (locales.login.create_room_pin || 'Crear PIN de Sala (En blanco = Libre)') : 
                    (locales.login.master_recovery_pin || 'PIN de Recuperación Master');
            } else if (window.hasRoomPin) {
                pinInputEl.placeholder = locales.interface.room_pin || 'PIN de Sala';
            } else {
                pinInputEl.placeholder = locales.login.placeholder_pin || 'Room PIN (Blank = Free)';
            }
        }
        
        const btnStart = document.getElementById('btnStart');
        if (btnStart) btnStart.textContent = locales.login.btn_start || 'Talk';

        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect && locales.interface) {
            for (let opt of categorySelect.options) {
                if (opt.value === "" || opt.disabled) {
                    opt.textContent = locales.interface.select_category || 'Select category...';
                }
            }
        }

        const loginFooterPrefix = document.getElementById('loginFooterPrefix');
        if (loginFooterPrefix && locales.login) loginFooterPrefix.textContent = locales.login.footer;
        
        const btnOpenTermsRef = document.getElementById('btnOpenTerms');
        if (btnOpenTermsRef && locales.login) btnOpenTermsRef.textContent = locales.login.terms_btn;

        // --- 3. Navigation Sidebar ---
        document.querySelectorAll('.nav-item').forEach(item => {
            const sectionId = item.dataset.section;
            const span = item.querySelector('span');
            if (span && locales.sections) {
                const localizedText = locales.sections[sectionId] || locales.sections[sectionId.replace('section-', '')];
                if (localizedText) span.textContent = localizedText;
            }
        });

        const btnSettingsSpan = document.querySelector('#btnOpenMainSettings span');
        if (btnSettingsSpan && locales.interface) btnSettingsSpan.textContent = locales.interface.settings_btn;

        const btnOpenDictInlineRef = document.getElementById('btnOpenDictionaryInline');
        if (btnOpenDictInlineRef && locales.language) {
            btnOpenDictInlineRef.textContent = locales.language.transcription_dict || 'Vocabulario IA';
        }

        const btnOpenTriggersInline = document.getElementById('btnOpenTriggersAlt');
        if (btnOpenTriggersInline && locales.sections) {
            btnOpenTriggersInline.title = locales.sections.triggers_btn || 'Configurar Triggers';
        }

        const btnManageCatLoginRef = document.getElementById('btnManageCategoriesLogin');
        if (btnManageCatLoginRef && locales.control) {
            btnManageCatLoginRef.title = locales.control.btn_config_cats || 'Gestionar Categorías';
        }

        // --- 4. Settings Sections ---
        this.updateSettingsNavLabels();

        // --- 5. Audio Section ---
        const lblSectionAudioTitle = document.getElementById('lblSectionAudioTitle');
        if (lblSectionAudioTitle && locales.titles) lblSectionAudioTitle.textContent = locales.titles.audio;

        const mapping = {
            'lblUiLang': locales.language?.ui_lang,
            'lblMicInput': locales.sidebar?.lbl_entrada,
            'lblAudioOutput': locales.sidebar?.lbl_salida,
            'lblMicMode': locales.sidebar?.lbl_modo,
            'lblModeAuto': locales.audio?.mode_auto,
            'lblModePtt': locales.audio?.mode_ptt,
            'lblSensibilidad': locales.sidebar?.lbl_sensibilidad,
            'lblCacheUsagePrefix': locales.messages?.cache_usage_prefix,
            'lblCacheMaxPrefix': locales.messages?.cache_max_prefix
        };

        Object.keys(mapping).forEach(id => {
            const el = document.getElementById(id);
            if (el && mapping[id]) el.textContent = mapping[id];
        });

        const inputRoomPin = document.getElementById('inputRoomPin');
        if (inputRoomPin && locales.control) {
            inputRoomPin.placeholder = locales.control.no_pin || 'Sin PIN';
        }

        // --- 6. Translation Section ---
        if (locales.translation) {
            const tradMapping = {
                'lblSectionTraduccionTitle': locales.translation.section_title,
                'lblTradAuto': locales.translation.auto_title,
                'lblTradAutoDesc': locales.translation.auto_desc,
                'lblTradOriginal': locales.translation.original_title,
                'lblTradOrigDesc': locales.translation.original_desc,
                'lblTradLangsTitle': locales.translation.langs_title,
                'lblTradLangsDesc': locales.translation.langs_desc,
                'lblTradDictTitle': locales.translation.dict_title,
                'lblTradDictDesc': locales.translation.dict_desc
            };

            Object.keys(tradMapping).forEach(id => {
                const el = document.getElementById(id);
                if (el && tradMapping[id]) el.textContent = tradMapping[id];
            });

            const inputTradExclude = document.getElementById('inputTradExclude');
            if (inputTradExclude) inputTradExclude.placeholder = locales.translation.dict_placeholder;
        }

        // Localizar píldora de aviso de traducción desactivada si existe en el DOM
        const transDisabledPillText = document.querySelector('#translationDisabledPill [data-i18n="settings_translation_disabled"]');
        if (transDisabledPillText && (locales.settings?.translation_disabled || locales.chat?.status_translation_disabled)) {
            transDisabledPillText.textContent = locales.settings?.translation_disabled || locales.chat?.status_translation_disabled;
        }

        // --- 7. Chat & Status ---
        const textInput = document.getElementById('textInput') || document.getElementById('messageInput');
        if (textInput && locales.chat) textInput.placeholder = locales.chat.placeholder;
        
        const transHint = document.querySelector('.transcription-hint');
        if (transHint && locales.chat) transHint.textContent = locales.chat.voice_hint;

        const usersTitle = document.getElementById('usersListTitle');
        if (usersTitle && locales.sidebar) {
            const usersList = document.getElementById('usersList');
            const count = usersList ? usersList.children.length : 0;
            const _usersTitleText = usersTitle.querySelector('.users-list-text') || usersTitle;
            _usersTitleText.textContent = `${locales.sidebar.users} (${count})`;
        }

        // --- 8. Terms Modal ---
        if (locales.terms) {
            const termsModalTitle = document.getElementById('termsModalTitle');
            const btnCloseTerms = document.getElementById('btnCloseTerms');
            const termsContentArea = document.getElementById('termsContentArea');
            
            if (termsModalTitle && locales.terms.title) termsModalTitle.textContent = locales.terms.title;
            if (btnCloseTerms && locales.terms.btn_accept) btnCloseTerms.textContent = locales.terms.btn_accept;

            if (termsContentArea) {
                // Solo poblar desde el JSON si el contenedor aún no tiene contenido inyectado por terms-app.html
                if (!termsContentArea.dataset.loadedFromHtml) {
                    termsContentArea.innerHTML = '';
                    let i = 1;
                    while (locales.terms[`p${i}_title`] || locales.terms[`p${i}_text`]) {
                        const pTitle = locales.terms[`p${i}_title`];
                        const pText = locales.terms[`p${i}_text`];
                        if (pTitle && pText) {
                            const p = document.createElement('p');
                            p.innerHTML = `<strong>${pTitle}</strong><br>${pText}`;
                            termsContentArea.appendChild(p);
                        }
                        i++;
                    }
                }
            }
        }

        // --- 9. Sub-user Modal ---
        if (locales.subuser_modal) {
            const subMapping = {
                'subUserModalTitle': locales.subuser_modal.title,
                'lblSubUserName': locales.subuser_modal.name,
                'lblSubUserCategory': locales.subuser_modal.category,
                'lblSubUserLang': locales.subuser_modal.lang,
                'lblSubUserSource': locales.subuser_modal.source,
                'subUserMicHint': locales.subuser_modal.hint,
                'lblSubUserThresholdTitle': locales.subuser_modal.threshold,
                'btnCloseSubUser': locales.subuser_modal.btn_cancel,
                'btnSaveSubUser': locales.subuser_modal.btn_save
            };

            Object.keys(subMapping).forEach(id => {
                const el = document.getElementById(id);
                if (el && subMapping[id]) el.textContent = subMapping[id];
            });

            // Traducción dinámica y elástica de las opciones del select subUserLang
            const subUserLangSelect = document.getElementById('subUserLang');
            if (subUserLangSelect) {
                const subLangNames = {
                    'es': 'Castellano (ES)', 'en': 'English (EN)', 'eu': 'Euskera (EU)', 'de': 'Deutsch (DE)', 
                    'fr': 'Français (FR)', 'it': 'Italiano (IT)', 'ja': '日本語 (JA)', 'pt': 'Português (PT)', 
                    'ru': 'Русский (RU)', 'zh': '中文 (ZH)', 'tr': 'Türkçe (TR)', 'ca': 'Català (CA)', 
                    'ar': 'العربية (AR)', 'fa': 'Farsi (FA)', 'uk': 'Українська (UK)', 'sv': 'Svenska (SV)', 
                    'vi': 'Tiếng Việt (VI)', 'ko': '한국어 (KO)', 'nl': 'Nederlands (NL)', 'uz': 'Oʻzbekcha (UZ)', 
                    'kk': 'Қазақша (KK)', 'pl': 'Polski (PL)', 'gl': 'Galego (GL)', 'eo': 'Esperanto (EO)'
                };
                Array.from(subUserLangSelect.options).forEach(opt => {
                    const code = opt.value;
                    const key = `lang_${code}`;
                    if (locales.subuser_modal && locales.subuser_modal[key]) {
                        opt.textContent = locales.subuser_modal[key];
                    } else if (subLangNames[code]) {
                        opt.textContent = subLangNames[code];
                    }
                });
            }

            const subNameInput = document.getElementById('subUserName');
            if (subNameInput) subNameInput.placeholder = locales.subuser_modal.placeholder_name;
        }

        // --- 10. Chat Inputs & Buttons ---
        const btnSendId = document.getElementById('btnSendMessage') || document.getElementById('btnSend');
        if (btnSendId && locales.chat) {
            btnSendId.title = locales.chat.send;
        }

        // --- 11. Final UI Refresh & External Logic ---
        this._updateDynamicStatus();

        if (typeof window.createFilterBar === 'function') window.createFilterBar();
        if (typeof window.renderTriggersList === 'function') window.renderTriggersList();
        if (typeof window.getAudioDevices === 'function') window.getAudioDevices();
        if (typeof window.retranslateSystemMessages === 'function') window.retranslateSystemMessages();
        if (typeof window.renderDictionary === 'function') window.renderDictionary();
        
        // Actualizar UI de botones (v60: Evitar sobrescribir iconos dinámicos)
        if (typeof window.updateMicButtonsUI === 'function') window.updateMicButtonsUI();
        
        // [v60.Elite] Traducir el botón de conectar IP en user-modal
        const loginConnectLabel = document.querySelector('#loginConnectBtn .login-connect-label');
        if (loginConnectLabel && locales.login) {
            loginConnectLabel.textContent = locales.login.connect_at || 'Conectar en:';
        }

        // --- 12. Localize Sub-user Add button title ---
        const btnAddSubUser = document.getElementById('btn-add-subuser');
        if (btnAddSubUser && locales.subuser_modal) {
            btnAddSubUser.title = locales.subuser_modal.title || 'Crear Sub-usuario';
        }

        // --- 13. Localize pinResetOverlay ---
        if (locales.pin_reset) {
            const pinResetTitle = document.getElementById('pinResetTitle');
            if (pinResetTitle) pinResetTitle.textContent = locales.pin_reset.title;
            const pinResetReason = document.getElementById('pinResetReason');
            if (pinResetReason) pinResetReason.textContent = locales.pin_reset.reason;
            const btnVerifyPinReset = document.getElementById('btnVerifyPinReset');
            if (btnVerifyPinReset) btnVerifyPinReset.textContent = locales.pin_reset.btn_verify;
            const pinResetAttemptsLabel = document.getElementById('pinResetAttemptsLabel');
            if (pinResetAttemptsLabel && typeof window.pinResetAttempts !== 'undefined') {
                pinResetAttemptsLabel.textContent = locales.pin_reset.attempts_remaining.replace('{attempts}', window.pinResetAttempts);
            }
        }

        // --- 14. Localize kickedOverlay ---
        if (locales.kicked) {
            const kickedTitle = document.getElementById('kickedTitle');
            if (kickedTitle) kickedTitle.textContent = locales.kicked.title;
            const kickedReason = document.getElementById('kickedReason');
            if (kickedReason && !kickedReason.dataset.customReason) {
                kickedReason.innerHTML = locales.kicked.reason;
            }
            const btnReloadKickedSession = document.getElementById('btnReloadKickedSession');
            if (btnReloadKickedSession) btnReloadKickedSession.textContent = locales.kicked.btn_retry;
        }

        // --- 15. Localize customConfirmModal ---
        const confirmTitle = document.getElementById('customConfirmTitle');
        if (confirmTitle) confirmTitle.textContent = locales.interface?.confirm_title || (locales.kicked?.title || 'Confirmación');
        const btnConfirmCancel = document.getElementById('btnConfirmCancel');
        if (btnConfirmCancel) btnConfirmCancel.textContent = locales.interface?.btn_cancel || (locales.subuser_modal?.btn_cancel || 'Cancelar');
        const btnConfirmAccept = document.getElementById('btnConfirmAccept');
        if (btnConfirmAccept) btnConfirmAccept.textContent = locales.interface?.btn_accept || (locales.subuser_modal?.btn_save || 'Aceptar');
    }

    /**
     * Actualiza las etiquetas de navegación de los ajustes.
     */
    updateSettingsNavLabels() {
        if (!this.localesData) return;
        const locales = this.localesData;

        // Titulos de Secciones
        const titleMapping = {
            '#section-idioma .modal-title-small': locales.titles.language,
            '#section-interfaz .modal-title-small': locales.titles.interface,
            '#section-mensajes .modal-title-small': locales.titles.messages,
            '#section-alertas .modal-title-small': locales.titles.alerts,
            '#section-guia .modal-title-small': locales.titles.guia || 'Guía de Usuario',
            '#section-legal .modal-title-small': locales.titles.legal || locales.sections?.legal || 'Legal y Licencias',
            '#section-control .modal-title-small': locales.titles.control,
            '#section-triggers .modal-title-small': locales.titles.triggers
        };

        Object.keys(titleMapping).forEach(selector => {
            const el = document.querySelector(selector);
            if (el && titleMapping[selector]) el.textContent = titleMapping[selector];
        });

        // DNA & Interface
        const labelsMapping = {
            'lblNavGuia': locales.sections?.guia || 'Guía',
            'lblNavLegal': locales.sections?.legal || 'Legal',
            'lblAddTrigger': locales.alerts?.add_trigger || 'Add Trigger',
            'lblDNATitle': locales.titles?.dna,
            'lblDNABGPrimary': locales.interface?.dna_bg_primary,
            'lblDNABGSecondary': locales.interface?.dna_bg_secondary,
            'lblDNAAccentPrimary': locales.interface?.dna_accent_primary,
            'lblDNAAccentSecondary': locales.interface?.dna_accent_secondary,
            'lblDNATextPrimary': locales.interface?.dna_text_primary,
            'lblDNATextSecondary': locales.interface?.dna_text_secondary,
            'lblBtnResetDNA': locales.interface?.btn_reset_dna,
            'lblBtnSaveGlobal': locales.interface?.btn_save_global,
            'transcriptionHint': locales.chat?.voice_hint,
            'lblTextSize': locales.interface?.text_size,
            'lblThemeMode': locales.interface?.theme_mode,
            'lblThemeDark': locales.interface?.theme_dark,
            'lblThemeLight': locales.interface?.theme_light,
            'lblRoomPinControl': locales.interface?.room_pin || 'PIN de Sala',
            'lblManageFiltersControl': locales.control?.manage_filters || 'Gestión de Filtros',
            'lblUserAdminControl': locales.control?.user_admin,
            'typographyPreview': locales.interface?.preview_text || 'Hola Mundo!',
            'lblTextSizeKnob': locales.interface?.size,
            'lblTextWeightKnob': locales.interface?.weight
        };

        Object.keys(labelsMapping).forEach(id => {
            const el = document.getElementById(id);
            if (el && labelsMapping[id]) el.textContent = labelsMapping[id];
        });

        // Localizar el botón de gestión de categorías preservando el icono SVG
        const btnManageCategories = document.getElementById('btnManageCategories');
        if (btnManageCategories) {
            const textSpan = btnManageCategories.querySelector('span');
            if (textSpan) {
                textSpan.textContent = locales.control?.manage_filters || 'Gestión de Filtros y Departamentos';
            }
        }

        // Toggle multi-language guide blocks in main settings guide if they exist
        const activeLang = this.currentLang || 'es';
        document.querySelectorAll('#section-guia [data-lang-content]').forEach(el => {
            if (el.getAttribute('data-lang-content') === activeLang) {
                el.style.display = 'flex';
            } else {
                el.style.display = 'none';
            }
        });
        const hasCurrentGuide = Array.from(document.querySelectorAll('#section-guia [data-lang-content]')).some(el => el.getAttribute('data-lang-content') === activeLang);
        if (!hasCurrentGuide) {
            document.querySelectorAll('#section-guia [data-lang-content="es"]').forEach(el => {
                el.style.display = 'flex';
            });
        }

        // Table Headers — ahora son iconos SVG; se preserva el texto en el atributo 'title'
        // NO sobreescribir con textContent ya que borraría el SVG interno
        // const tableHeaders = { ... }  ← eliminado en v60.Elite (icono-first)

        // Alerts & Triggers
        const alertsMapping = {
            'lblFlashlight': locales.alerts?.flashlight,
            'lblVibration': locales.alerts?.vibration,
            'lblScreenAlerts': locales.alerts?.screen,
            'lblDeepTriggers': locales.alerts?.triggers,
            'lblPersonalizarAlertas': locales.alerts?.customize_alerts,
            'lblInstruccionAlerta': locales.alerts?.alert_instruction,
            'lblScreenAlertTitle': locales.alerts?.screen,
            'lblScreenAlertDesc': locales.alerts?.screen_desc,
            'lblVibrationAlertTitle': locales.alerts?.vibration,
            'lblVibrationAlertDesc': locales.alerts?.vibration_desc,
            'lblFlashlightAlertTitle': locales.alerts?.flashlight,
            'lblFlashlightAlertDesc': locales.alerts?.flashlight_desc,
            'lblTriggersDescription': locales.alerts?.triggers_description
        };
        Object.keys(alertsMapping).forEach(id => {
            const el = document.getElementById(id);
            if (el && alertsMapping[id]) el.textContent = alertsMapping[id];
        });

        // Editors (Pantalla, Vibración, Linterna)
        this._updateEditorLabels();

        // Messages & Cache
        this._updateMessageLabels();

        // Dictionary
        this._updateDictionaryLabels();

        // Triggers Advanced
        this._updateAdvancedTriggersLabels();
    }

    _cleanStaticDOM() {
        const corruptionRegex = /\/>\s*$/;
        const elementsToClean = ['btnStart', 'btnOpenTerms', 'loginSubtitle', 'loginFooterPrefix', 'termsModalTitle'];
        elementsToClean.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.textContent && corruptionRegex.test(el.textContent)) {
                el.textContent = el.textContent.replace(/\s*\/?\s*(\/>|>|&gt;)\s*$/g, '').trim();
            }
        });
    }

    _updateEditorLabels() {
        const locales = this.localesData;
        const typeKeys = ['pantalla', 'vibracion', 'linterna'];
        const suffixes = ['Pantalla', 'Vibracion', 'Linterna'];

        typeKeys.forEach((key, idx) => {
            const suffix = suffixes[idx];
            
            const titleEl = document.getElementById(`lblEditorTitle${suffix}`);
            if (titleEl && locales.alerts && locales.alerts[`editor_title_${key}`]) {
                const svg = titleEl.querySelector('svg');
                if (svg) {
                    titleEl.innerHTML = '';
                    titleEl.appendChild(svg);
                    titleEl.appendChild(document.createTextNode(' ' + locales.alerts[`editor_title_${key}`]));
                } else {
                    titleEl.textContent = locales.alerts[`editor_title_${key}`];
                }
            }

            const mapping = {
                [`lblEditorDesc${suffix}`]: locales.alerts?.[`editor_desc_${key}`],
                [`lblRestoreAnim${suffix}`]: locales.alerts?.restore_anim,
                [`lblAddKeyframe${suffix}`]: locales.alerts?.add_keyframe,
                [`lblKeyframeOrder${suffix}`]: locales.alerts?.keyframe_order,
                [`btnCancelAlert${suffix}`]: locales.alerts?.cancel,
                [`lblTimelineEasing${suffix}`]: locales.alerts?.timeline_easing,
                [`lblTimelineHint${suffix}`]: locales.alerts?.timeline_hint,
                [`lblGlobalDuration${suffix}`]: locales.alerts?.duration
            };

            Object.keys(mapping).forEach(id => {
                const el = document.getElementById(id);
                if (el && mapping[id]) el.textContent = mapping[id];
            });

            const btnSave = document.getElementById(`btnSaveAlert${suffix}`);
            if (btnSave && locales.alerts) {
                const span = btnSave.querySelector('span');
                if (span) span.textContent = locales.alerts.btn_save_alert;
            }
        });
    }

    _updateMessageLabels() {
        const locales = this.localesData;
        if (!locales.messages) return;

        const mapping = {
            'lblMessagesMode': locales.messages.emission_mode,
            'lblReceptionMode': locales.messages.reception_mode,
            'optReceptionAuto': locales.messages.auto_play,
            'lblCacheManagement': locales.messages.cache_limit,
            'optMsgBoth': locales.messages.transcr_audio,
            'optMsgText': locales.messages.transcr_only,
            'lblConvertNumbersTitle': locales.messages.convert_numbers_title || locales.modals?.lblConvertNumbersTitle,
            'lblConvertNumbersDesc': locales.messages.convert_numbers_desc || locales.modals?.lblConvertNumbersDesc
        };

        Object.keys(mapping).forEach(id => {
            const el = document.getElementById(id);
            if (el && mapping[id]) el.textContent = mapping[id];
        });

        const optReceptionManual = document.getElementById('optReceptionManual');
        if (optReceptionManual) optReceptionManual.textContent = locales.messages.manual_play || '🖐️ Play Manual';

        const lblCacheLimitPrefix = document.getElementById('lblCacheLimitPrefix');
        if (lblCacheLimitPrefix && locales.messages) {
            const val = localStorage.getItem('talkme_cache_limit') || '50';
            lblCacheLimitPrefix.innerHTML = `${locales.messages.cache_limit_prefix}<span id="cacheLimitLabel">${val}MB</span>`;
        }

        // [v60.1-Hermes-I18N] Localizaci�        
        const hermesDict = {
            ar: {
                title: "هيرميس TTS (القراءة الصوتية)",
                enabled: "القرائة الصوتية",
                desc: "الاستماع إلى رسائل النص إلى كلام (يتفاعل مع الفلاتر)",
                filter_desc: "عدم تشغيل الصوت في الوقت الفعلي بلغات أخرى والاستماع إلى ترجمتها فقط",
                gender: "نوع الصوت",
                voice: "نوع محرك الصوت",
                rate: "سرعة القراءة",
                any: "أي (الكل)",
                female: "أصوات نسائية فقط",
                male: "أصوات ذكورية فقط",
                auto: "افتراضي الجهاز (تلقائي)",
                mode: "وضع القراءة",
                mode_text_only: "الرسائل النصية فقط (الأصلية والترجمة)",
                mode_text_and_foreign_audio: "الرسائل النصية وترجمة الرسائل الصوتية بلغات أخرى",
                treatment: "معالجة الصوت الأجنبي",
                treatment_mute: "كتم الصوت الأصلي وسماع الترجمة مباشرة",
                treatment_play_then_tts: "تشغيل الصوت الأصلي في الوقت الفعلي ثم تشغيل الترجمة",
                warning_no_voices: "⚠️ لا توجد أصوات للجنس المحدد",
                voice_female: "أنثى",
                voice_male: "ذكر"
            },
            ca: {
                title: "Hermes TTS (Lectura per Veu)",
                enabled: "Lectura per Veu",
                desc: "Escoltar missatges de text a veu (reacciona a filtres)",
                filter_desc: "No reproduir àudios en temps real en altres idiomes i escoltar només la seva traducció",
                gender: "Gènere Veu",
                voice: "Tipus motor veu",
                rate: "Velocitat lectura",
                any: "Qualsevol (Totes)",
                female: "Només Veus Femenines",
                male: "Només Veus Masculines",
                auto: "Predeterminat del Dispositiu (Automàtic)",
                mode: "Mode de Lectura",
                mode_text_only: "Només missatges de text (originals i traduccions)",
                mode_text_and_foreign_audio: "Missatges de text i traducció de missatges de veu en altres idiomes",
                treatment: "Tractament d'Àudios estrangers",
                treatment_mute: "Silenciar l'àudio original i escoltar la traducció directament",
                treatment_play_then_tts: "Reproduir l'àudio original en tempo real i després la traducció",
                warning_no_voices: "⚠️ No hi ha veus del gènere seleccionat",
                voice_female: "Femenina",
                voice_male: "Masculina"
            },
            de: {
                title: "Hermes TTS (Vorlesefunktion)",
                enabled: "Vorlesefunktion",
                desc: "Text-to-Speech-Nachrichten anhören (reagiert auf Filter)",
                filter_desc: "Echtzeitaudio in anderen Sprachen nicht abspielen und nur deren Übersetzung anhören",
                gender: "Stimmgeschlecht",
                voice: "Sprach-Engine-Typ",
                rate: "Lesegeschwindigkeit",
                any: "Beliebig (Alle)",
                female: "Nur weibliche Stimmen",
                male: "Nur männliche Stimmen",
                auto: "Gerätestandard (Automatisch)",
                mode: "Vorlesemodus",
                mode_text_only: "Nur Textnachrichten (Originale & Übersetzungen)",
                mode_text_and_foreign_audio: "Textnachrichten & Übersetzung von Sprachnachrichten in anderen Sprachen",
                treatment: "Umgang mit fremdsprachigen Audios",
                treatment_mute: "Originalton stummschalten und Übersetzung direkt hören",
                treatment_play_then_tts: "Originalton in Echtzeit abspielen, dann Übersetzung abspielen",
                warning_no_voices: "⚠️ Keine Stimmen des ausgewählten Geschlechts",
                voice_female: "Weiblich",
                voice_male: "Männlich"
            },
            en: {
                title: "Hermes TTS (Text-to-Speech)",
                enabled: "Text-to-Speech",
                desc: "Listen to text-to-speech messages (reacts to filters)",
                filter_desc: "Do not play real-time audio in other languages and listen only to their translation",
                gender: "Voice Gender",
                voice: "Voice Engine Type",
                rate: "Reading Speed",
                any: "Any (All)",
                female: "Female Voices Only",
                male: "Male Voices Only",
                auto: "Device Default (Automatic)",
                mode: "Reading Mode",
                mode_text_only: "Text messages only (originals & translations)",
                mode_text_and_foreign_audio: "Text messages & translation of voice messages in other languages",
                treatment: "Foreign Audio Handling",
                treatment_mute: "Mute original audio and hear translation directly",
                treatment_play_then_tts: "Play original audio in real-time, then play translation",
                warning_no_voices: "⚠️ No voices of the selected gender",
                voice_female: "Female",
                voice_male: "Male"
            },
            eo: {
                title: "Hermes TTS (Voĉlegado)",
                enabled: "Voĉlegado",
                desc: "Aŭskulti tekst-al-voĉajn mesaĝojn (reagas al filtriloj)",
                filter_desc: "Ne ludi realtempan audion en aliaj lingvoj kaj aŭskulti nur ilian tradukon",
                gender: "Voĉa Sekso",
                voice: "Voĉmotora Tipo",
                rate: "Legorapideco",
                any: "Iu ajn (Ĉiuj)",
                female: "Nur Inaj Voĉoj",
                male: "Nur Viraj Voĉoj",
                auto: "Aparata Defaŭlto (Aŭtomata)",
                mode: "Legoreĝimo",
                mode_text_only: "Nur tekstmesaĝoj (originaloj kaj tradukoj)",
                mode_text_and_foreign_audio: "Tekstmesaĝoj kaj traduko de voĉaj mesaĝoj en aliaj lingvoj",
                treatment: "Traktado de fremdlingva aŭdio",
                treatment_mute: "Silentigi originalan aŭdion kaj aŭdi tradukon rekte",
                treatment_play_then_tts: "Ludi originalan aŭdion en reala tempo, poste ludi tradukon",
                warning_no_voices: "⚠️ Neniuj voĉoj de la elektita sekso",
                voice_female: "Femala",
                voice_male: "Maskla"
            },
            es: {
                title: "Hermes TTS (Text-to-Speech - Lectura por Voz)",
                enabled: "Lectura por Voz",
                desc: "Escuchar mensajes de texto a voz (reacciona a filtros)",
                filter_desc: "No reproducir audios en tiempo real en otros idiomas y escuchar solo su traducción",
                gender: "Género Voz",
                voice: "Tipo motor voz",
                rate: "Velocidad lectura",
                any: "Cualquiera (Todas)",
                female: "Solo Voces Femeninas",
                male: "Solo Voces Masculinas",
                auto: "Predeterminado del Dispositivo (Automático)",
                mode: "Modo de Lectura",
                mode_text_only: "Solo mensajes de texto (originales y traducciones)",
                mode_text_and_foreign_audio: "Mensajes de texto y traducción de voz en otros idiomas",
                treatment: "Tratamiento de Audios extranjeros",
                treatment_mute: "Silenciar audio original y oír traducción directamente",
                treatment_play_then_tts: "Reproducir audio original en tiempo real y luego la traducción",
                warning_no_voices: "⚠️ No hay voces del género seleccionado",
                voice_female: "Femenina",
                voice_male: "Masculina"
            },
            eu: {
                title: "Ahots bidezko irakurketa (Hermes TTS)",
                enabled: "Ahots bidezko irakurketa",
                desc: "Testutik ahotserako mezuak entzun (iragazkiei erantzuten die)",
                filter_desc: "Beste hizkuntzetako audioak ez erreproduzitu denbora errealean eta haien itzulpena soilik entzun",
                gender: "Ahots Generoa",
                voice: "Ahots motor mota",
                rate: "Irakurketa abiadura",
                any: "Edozein (Guztiak)",
                female: "Emakumezko ahotsak bakarrik",
                male: "Gizonezko ahotsak bakarrik",
                auto: "Gailuaren lehenetsia (Automatikoa)",
                mode: "Irakurtzeko modua",
                mode_text_only: "Testu-mezuak soilik (jatorrizkoak eta itzulpenak)",
                mode_text_and_foreign_audio: "Testu-mezuak eta beste hizkuntza batzuetako ahots-mezuen itzulpena",
                treatment: "Atzerriko audioen tratamendua",
                treatment_mute: "Jatorrizko audioa isilarazi eta itzulpena zuzenean entzun",
                treatment_play_then_tts: "Jatorrizko audioa denbora errealean erreproduzitu eta ondoren itzulpena",
                warning_no_voices: "⚠️ Ez dago hautatutako generoko ahotsik",
                voice_female: "Emakumezkoa",
                voice_male: "Gizonezkoa"
            },
            fa: {
                title: "هرمس TTS (خوانش صوتی)",
                enabled: "خوانش صوتی",
                desc: "شنیدن پیام‌های متن به گفتار (به فیلترها واکنش نشان می‌دهد)",
                filter_desc: "عدم پخش صدای همزمان به زبان‌های دیگر و شنیدن فقط ترجمه آن",
                gender: "جنسیت صدا",
                voice: "نوع موتور صدا",
                rate: "سرعت خواندن",
                any: "هرکدام (همه)",
                female: "فقط صدای زنانه",
                male: "فقط صدای مردانه",
                auto: "پیش‌فرض دستگاه (خودکار)",
                mode: "حالت خواندن",
                mode_text_only: "فقط پیام‌های متنی (اصلی و ترجمه)",
                mode_text_and_foreign_audio: "پیام‌های متنی و ترجمه پیام‌های صوتی به زبان‌های دیگر",
                treatment: "مدیریت صداهای خارجی",
                treatment_mute: "قطع صدای اصلی و شنیدن مستقیم ترجمه",
                treatment_play_then_tts: "پخش صدای اصلی در زمان واقعی و سپس پخش ترجمه",
                warning_no_voices: "⚠️ هیچ صدایی برای جنسیت انتخاب شده وجود ندارد",
                voice_female: "زن",
                voice_male: "مرد"
            },
            fr: {
                title: "Hermes TTS (Synthèse Vocale)",
                enabled: "Synthèse Vocale",
                desc: "Écouter les messages de synthèse vocale (réagit aux filtres)",
                filter_desc: "Ne pas lire les audios en temps réel dans d'autres langues et écouter uniquement leur traduction",
                gender: "Genre de voix",
                voice: "Type de moteur vocal",
                rate: "Vitesse de lecture",
                any: "Indifférent (Toutes)",
                female: "Voix Féminines Uniquement",
                male: "Voix Masculines Uniquement",
                auto: "Par Défaut du Périphérique (Automatique)",
                mode: "Mode de lecture",
                mode_text_only: "Messages texte uniquement (originaux & traductions)",
                mode_text_and_foreign_audio: "Messages texte & traduction des messages vocaux dans d'autres langues",
                treatment: "Gestion des audios étrangers",
                treatment_mute: "Couper l'audio d'origine et entendre la traduction directement",
                treatment_play_then_tts: "Lire l'audio d'origine en temps réel, puis lire la traduction",
                warning_no_voices: "⚠️ Aucune voix du genre sélectionné",
                voice_female: "Féminine",
                voice_male: "Masculine"
            },
            gl: {
                title: "Hermes TTS (Lectura por Voz)",
                enabled: "Lectura por Voz",
                desc: "Escoitar mensaxes de texto a voz (reacciona a filtros)",
                filter_desc: "Non reproducir audios en tempo real noutros idiomas e escoitar só a súa tradución",
                gender: "Xénero Voz",
                voice: "Tipo motor voz",
                rate: "Velocidade lectura",
                any: "Calquera (Todas)",
                female: "Só Voces Femininas",
                male: "Só Voces Masculinas",
                auto: "Predeterminado del Dispositivo (Automático)",
                mode: "Modo de Lectura",
                mode_text_only: "Só mensaxes de texto (orixinais e traducións)",
                mode_text_and_foreign_audio: "Mensaxes de texto e tradución de mensaxes de voz noutros idiomas",
                treatment: "Tratamento de Audios estranxeiros",
                treatment_mute: "Silenciar o audio orixinal e escoitar a tradución directamente",
                treatment_play_then_tts: "Reproducir o audio orixinal en tempo real e logo a tradución",
                warning_no_voices: "⚠️ Non hai voces do xénero seleccionado",
                voice_female: "Feminina",
                voice_male: "Masculina"
            },
            it: {
                title: "Hermes TTS (Lettura Vocale)",
                enabled: "Lettura Vocale",
                desc: "Ascolta i messaggi di sintesi vocale (reagisce ai filtri)",
                filter_desc: "Non riprodurre audio in tempo reale in altre lingue e ascolta solo la loro traduzione",
                gender: "Genere voce",
                voice: "Tipo motore vocale",
                rate: "Velocità di lettura",
                any: "Qualsiasi (Tutte)",
                female: "Solo Voci Femminili",
                male: "Solo Voci Maschili",
                auto: "Predefinito del Dispositivo (Automatico)",
                mode: "Modalità di Lettura",
                mode_text_only: "Solo messaggi di testo (originali e traduzioni)",
                mode_text_and_foreign_audio: "Messaggi di testo e traduzione di messaggi vocali in altre lingue",
                treatment: "Gestione dell'audio straniero",
                treatment_mute: "Disattiva l'audio originale e ascolta direttamente la traduzione",
                treatment_play_then_tts: "Riproduci l'audio originale in tempo reale, poi la traduzione",
                warning_no_voices: "⚠️ Nessuna voce del genere selezionato",
                voice_female: "Femminile",
                voice_male: "Maschile"
            },
            ja: {
                title: "Hermes TTS (音声読み上げ)",
                enabled: "音声読み上げ",
                desc: "音声読み上げメッセージを聴く（フィルターに連動）",
                filter_desc: "他言語のリアルタイム音声を再生せず、翻訳のみを聴く",
                gender: "音声性別",
                voice: "音声エンジン種別",
                rate: "読み上げ速度",
                any: "すべて",
                female: "女性の声のみ",
                male: "男性の声のみ",
                auto: "デバイスのデフォルト (自動)",
                mode: "読み上げモード",
                mode_text_only: "テキストメッセージのみ（原文と翻訳）",
                mode_text_and_foreign_audio: "テキストメッセージおよび他言語音声メッセージ of 翻訳",
                treatment: "他言語音声の取り扱い",
                treatment_mute: "元の音声を消音して翻訳を直接聴く",
                treatment_play_then_tts: "元の音声をリアルタイムで再生し、その後に翻訳を再生する",
                warning_no_voices: "⚠️ 選択した性別の音声はありません",
                voice_female: "女性",
                voice_male: "男性"
            },
            kk: {
                title: "Hermes TTS (Дауыспен оқу)",
                enabled: "Дауыспен оқу",
                desc: "Мәтінді дауысқа айналдыру хабарламаларын тыңдау (сүзгілерге жауап береді)",
                filter_desc: "Басқа тілдердегі дыбысты нақты уақытта ойнатпай, тек оның аудармасын тыңдау",
                gender: "Дауыс жынысы",
                voice: "Дауыс қозғалтқышының түрі",
                rate: "Оқу жылдамдығы",
                any: "Кез келген (Барлығы)",
                female: "Тек әйел дауысы",
                male: "Тек ер адам дауысы",
                auto: "Құрылғының әдепкісі (Автоматты)",
                mode: "Оқу режимі",
                mode_text_only: "Тек мәтіндік хабарламалар (түпнұсқа мен аударма)",
                mode_text_and_foreign_audio: "Мәтіндік хабарламалар және басқа тілдердегі дауыстық хабарламалардың аудармасы",
                treatment: "Шет тіліндегі аудионы өңдеу",
                treatment_mute: "Түпнұсқа аудионы өшіріп, аударманы тікелей тыңдау",
                treatment_play_then_tts: "Түпнұсқа аудионы нақты уақытта ойнату, содан кейін аударманы ойнату",
                warning_no_voices: "⚠️ Таңдалған жыныс үшін дауыстар табылмады",
                voice_female: "Әйел",
                voice_male: "Еркек"
            },
            ko: {
                title: "Hermes TTS (음성 읽기)",
                enabled: "음성 읽기",
                desc: "텍스트 읽어주기 메시지 듣기 (필터에 반응)",
                filter_desc: "다른 언어의 실시간 음성을 재생하지 않고 번역본만 듣기",
                gender: "음성 성별",
                voice: "음성 엔진 유형",
                rate: "읽기 속도",
                any: "모두",
                female: "여성 음성만",
                male: "남성 음성만",
                auto: "기기 기본값 (자동)",
                mode: "읽기 모드",
                mode_text_only: "텍스트 메시지만 (원본 및 번역)",
                mode_text_and_foreign_audio: "텍스트 메시지 및 다른 언어 음성 메시지 번역",
                treatment: "외국어 오디오 처리",
                treatment_mute: "원본 오디오를 음소거하고 번역 직접 듣기",
                treatment_play_then_tts: "원본 오디오를 실시간으로 재생한 후 번역 재생",
                warning_no_voices: "⚠️ 선택한 성별의 음性が 없습니다",
                voice_female: "여성",
                voice_male: "남성"
            },
            nl: {
                title: "Hermes TTS (Spraaksynthese)",
                enabled: "Spraaksynthese",
                desc: "Tekst-naar-spraak-berichten beluisteren (reageert op filters)",
                filter_desc: "Echtzeitaudio in andere talen niet afspelen en alleen de vertaling beluisteren",
                gender: "Stemgeslacht",
                voice: "Type spraakengine",
                rate: "Leessnelheid",
                any: "Elke (Alle)",
                female: "Alleen vrouwelijke stemmen",
                male: "Alleen mannelijke stemmen",
                auto: "Standaardapparaat (Automatisch)",
                mode: "Leesmodus",
                mode_text_only: "Alleen tekstberichten (originelen & vertalingen)",
                mode_text_and_foreign_audio: "Tekstberichten & vertaling van gesproken berichten in andere talen",
                treatment: "Verwerking van anderstalige audio",
                treatment_mute: "Originele audio dempen en vertaling rechtstreeks beluisteren",
                treatment_play_then_tts: "Originele audio in realtime afspelen, daarna vertaling afspelen",
                warning_no_voices: "⚠️ Geen stemmen van het geselecteerde geslacht",
                voice_female: "Vrouwelijk",
                voice_male: "Mannelijk"
            },
            pl: {
                title: "Hermes TTS (Synteza mowy)",
                enabled: "Synteza mowy",
                desc: "Słuchaj wiadomości tekstowych czytanych przez syntezator (reaguje na filtry)",
                filter_desc: "Nie odtwarzaj dźwięku w czasie rzeczywistym w innych językach i słuchaj tylko ich tłumaczenia",
                gender: "Płeć głosu",
                voice: "Typ silnika mowy",
                rate: "Prędkość czytania",
                any: "Dowolny (Wszystkie)",
                female: "Tylko głosy żeńskie",
                male: "Tylko głosy męskie",
                auto: "Domyślne urządzenia (Automatycznie)",
                mode: "Tryb czytania",
                mode_text_only: "Tylko wiadomości tekstowe (oryginały i tłumaczenia)",
                mode_text_and_foreign_audio: "Wiadomości tekstowe i tłumaczenie wiadomości głosowych w innych językach",
                treatment: "Obsługa audio w obcych językach",
                treatment_mute: "Wycisz oryginalne audio i słuchaj tłumaczenia bezpośrednio",
                treatment_play_then_tts: "Odtwórz oryginalne audio w czasie rzeczywistym, a następnie tłumaczenie",
                warning_no_voices: "⚠️ Brak głosów dla wybranej płci",
                voice_female: "Żeńska",
                voice_male: "Męska"
            },
            pt: {
                title: "Hermes TTS (Leitura de Voz)",
                enabled: "Leitura de Voz",
                desc: "Ouvir mensagens de texto para voz (reage aos filtros)",
                filter_desc: "Não reproduzir áudios em tempo real em outros idiomas e ouvir apenas a sua tradução",
                gender: "Gênero Voz",
                voice: "Tipo motor voz",
                rate: "Velocidade de leitura",
                any: "Qualquer (Todas)",
                female: "Apenas Vozes Femininas",
                male: "Apenas Vozes Masculinas",
                auto: "Padrão do Dispositivo (Automático)",
                mode: "Modo de Leitura",
                mode_text_only: "Apenas mensagens de texto (originais e traduções)",
                mode_text_and_foreign_audio: "Mensagens de texto e tradução de mensagens de voz em outros idiomas",
                treatment: "Tratamento de áudio estrangeiro",
                treatment_mute: "Silenciar áudio original e ouvir tradução diretamente",
                treatment_play_then_tts: "Reproduzir áudio original em tempo real e depois a tradução",
                warning_no_voices: "⚠️ Não há vozes do gênero selecionado",
                voice_female: "Feminina",
                voice_male: "Masculina"
            },
            ru: {
                title: "Hermes TTS (Озвучивание текста)",
                enabled: "Озвучивание текста",
                desc: "Прослушивать озвученные текстовые сообщения (реагирует на фильтры)",
                filter_desc: "Не воспроизводить аудио на других языках в реальном времени, слушать только перевод",
                gender: "Пол голоса",
                voice: "Тип речевого движка",
                rate: "Скорость чтения",
                any: "Любой (Все)",
                female: "Только женские голоса",
                male: "Только мужские голоса",
                auto: "По умолчанию для устройства (Автоматически)",
                mode: "Режим чтения",
                mode_text_only: "Только текстовые сообщения (оригиналы и переводы)",
                mode_text_and_foreign_audio: "Текстовые сообщения и перевод голосовых сообщений на других языках",
                treatment: "Обработка аудио на других языках",
                treatment_mute: "Заглушить оригинальное аудио и слушать перевод напрямую",
                treatment_play_then_tts: "Воспроизводить оригинальное аудио в реальном времени, затем перевод",
                warning_no_voices: "⚠️ Нет голосов выбранного пола",
                voice_female: "Женский",
                voice_male: "Мужской"
            },
            sv: {
                title: "Hermes TTS (Röstuppläsare)",
                enabled: "Röstuppläsare",
                desc: "Lyssna på text-till-tal-meddelanden (reagerar på filter)",
                filter_desc: "Spela inte upp realtidsljud på andra språk och lyssna endast på översättningen",
                gender: "Röstkön",
                voice: "Röstmotortyp",
                rate: "Rösthastighet",
                any: "Vilken som helst (Alla)",
                female: "Endast kvinnliga röster",
                male: "Endast manliga röster",
                auto: "Standardenhet (Automatisk)",
                mode: "Uppläsningsläge",
                mode_text_only: "Endast textmeddelanden (original & översättningar)",
                mode_text_and_foreign_audio: "Textmeddelanden & översättning av röstmeddelanden på andra språk",
                treatment: "Hantering av ljud på andra språk",
                treatment_mute: "Ljudlös originalet och lyssna på översättningen direkt",
                treatment_play_then_tts: "Spela upp originalljud i realtid, sedan översättningen",
                warning_no_voices: "⚠️ Inga röster för det valda könet",
                voice_female: "Kvinna",
                voice_male: "Man"
            },
            tr: {
                title: "Hermes TTS (Sesli Okuma)",
                enabled: "Sesli Okuma",
                desc: "Yazıyı sese dönüştürme mesajlarını dinle (filtrelere duyarlı)",
                filter_desc: "Diğer dillerdeki gerçek zamanlı sesleri oynatma ve yalnızca çevirisini dinle",
                gender: "Ses Cinsiyeti",
                voice: "Ses Motoru Türü",
                rate: "Okuma Hızı",
                any: "Herhangi Biri (Tümü)",
                female: "Yalnızca Kadın Sesleri",
                male: "Yalnızca Erkek Sesleri",
                auto: "Cihaz Varsayılanı (Otomatik)",
                mode: "Okuma Modu",
                mode_text_only: "Yalnızca yazılı mesajlar (orijinaller ve çeviriler)",
                mode_text_and_foreign_audio: "Yazılı mesajlar ve diğer dillerdeki sesli mesajların çevirisi",
                treatment: "Yabancı Dildeki Sesleri İşleme",
                treatment_mute: "Orijinal sesi sessize al ve çeviriyi doğrudan dinle",
                treatment_play_then_tts: "Orijinal sesi gerçek zamanlı oynat, ardından çeviriyi oynat",
                warning_no_voices: "⚠️ Seçilen cinsiyette ses bulunamadı",
                voice_female: "Kadın",
                voice_male: "Erkek"
            },
            uk: {
                title: "Hermes TTS (Озвучення тексту)",
                enabled: "Озвучення тексту",
                desc: "Прослуховувати озвучені текстові повідомлення (реагує на фільтри)",
                filter_desc: "Не відтворювати аудіо іншими мовами в реальному часі, слухати тільки переклад",
                gender: "Стать голосу",
                voice: "Тип мовного движка",
                rate: "Швидкість читання",
                any: "Будь-який (Всі)",
                female: "Тільки жіночі голоси",
                male: "Тільки чоловічі голоси",
                auto: "За замовчуванням для пристрою (Автоматично)",
                mode: "Режим читання",
                mode_text_only: "Тільки текстові повідомлення (оригінали та переклади)",
                mode_text_and_foreign_audio: "Текстові повідомлення та переклад голосових повідомлень іншими мовами",
                treatment: "Обробка аудіо іншими мовами",
                treatment_mute: "Заглушити оригінальне аудіо та слухати переклад напряму",
                treatment_play_then_tts: "Відтворювати оригінальне аудіо в реальному часі, потім переклад",
                warning_no_voices: "⚠️ Немає голосів вибраної статі",
                voice_female: "Жіночий",
                voice_male: "Чоловічий"
            },
            uz: {
                title: "Hermes TTS (Ovozli o'qish)",
                enabled: "Ovozli o'qish",
                desc: "Matndan nutqqa aylantirilgan xabarlarni eshitish (filtrlarga javob beradi)",
                filter_desc: "Boshqa tillardagi audio fayllarni real vaqtda ijro etmasdan, faqat tarjimasini eshitish",
                gender: "Ovoz jinsi",
                voice: "Ovoz dvigateli turi",
                rate: "O'qish tezligi",
                any: "Istalgan (Barchasi)",
                female: "Faqat ayol ovozi",
                male: "Faqat erkak ovozi",
                auto: "Qurilma standart qiymati (Avtomatik)",
                mode: "O'qish rejimi",
                mode_text_only: "Faqat matnli xabarlar (asl nusxalar va tarjimalar)",
                mode_text_and_foreign_audio: "Matnli xabarlar va boshqa tillardagi ovozli xabarlar tarjimasi",
                treatment: "Chet tilidagi audioni qayta ishlash",
                treatment_mute: "Asl audioni ovozsiz qilish va tarjimani to'g'ridan-to'g'ri eshitish",
                treatment_play_then_tts: "Asl audioni real vaqtda ijro etish, keyin tarjimani ijro etish",
                warning_no_voices: "⚠️ Tanlangan jinsdagi ovozlar topilmadi",
                voice_female: "Ayol",
                voice_male: "Erkak"
            },
            vi: {
                title: "Hermes TTS (Đọc văn bản)",
                enabled: "Đọc văn bản",
                desc: "Nghe các tin nhắn văn bản chuyển thành giọng nói (phản hồi bộ lọc)",
                filter_desc: "Không phát âm thanh thời gian thực bằng ngôn ngữ khác và chỉ nghe bản dịch",
                gender: "Giới tính giọng nói",
                voice: "Loại công cụ giọng nói",
                rate: "Tốc độ đọc",
                any: "Bất kỳ (Tất cả)",
                female: "Chỉ giọng nữ",
                male: "Chỉ giọng nam",
                auto: "Mặc định của thiết bị (Tự động)",
                mode: "Chế độ đọc",
                mode_text_only: "Chỉ tin nhắn văn bản (bản gốc & bản dịch)",
                mode_text_and_foreign_audio: "Tin nhắn văn bản & dịch tin nhắn thoại bằng ngôn ngữ khác",
                treatment: "Xử lý âm thanh tiếng nước ngoài",
                treatment_mute: "Tắt tiếng âm thanh gốc và nghe trực tiếp bản dịch",
                treatment_play_then_tts: "Phát âm thanh gốc trong thời gian thực, sau đó phát bản dịch",
                warning_no_voices: "⚠️ Không có giọng nói nào của giới tính được chọn",
                voice_female: "Nữ",
                voice_male: "Nam"
            },
            zh: {
                title: "Hermes TTS (语音合成)",
                enabled: "语音合成",
                desc: "听取文字转语音消息（过滤关联）",
                filter_desc: "不播放其他语言的实时语音，仅听其翻译内容",
                gender: "声音性别",
                voice: "语音引擎类型",
                rate: "朗读速度",
                any: "任意 (全部)",
                female: "仅限女性声音",
                male: "仅限男性声音",
                auto: "设备默认 (自动)",
                mode: "朗读模式",
                mode_text_only: "仅限文本消息（原文与翻译）",
                mode_text_and_foreign_audio: "文本消息及其他语言语音消息的翻译",
                treatment: "外语语音处理",
                treatment_mute: "静音原始语音并直接收听翻译内容",
                treatment_play_then_tts: "实时播放原始语音，然后播放翻译内容",
                warning_no_voices: "⚠️ 没有所选性别的人声",
                voice_female: "女性",
                voice_male: "男性"
            }
        };

        window.hermesDict = hermesDict;;

        const t = hermesDict[this.currentLang] || hermesDict['en'];

        const hermesMapping = {
            'lblHermesTitle': t.title,
            'lblHermesEnabled': t.enabled,
            'lblHermesEnabledDesc': t.desc,
            'lblHermesGenderSelect': t.gender,
            'lblHermesVoiceSelect': t.voice,
            'lblHermesRate': t.rate,
            'lblHermesModeSelect': t.mode,
            'lblHermesAudioTreatmentSelect': t.treatment
        };

        Object.keys(hermesMapping).forEach(id => {
            const el = document.getElementById(id);
            if (el && hermesMapping[id]) el.textContent = hermesMapping[id];
        });

        const optHermesAll = document.querySelector('#hermesGenderSelect option[value="all"]');
        if (optHermesAll) optHermesAll.textContent = t.any;
        const optHermesFemale = document.querySelector('#hermesGenderSelect option[value="female"]');
        if (optHermesFemale) optHermesFemale.textContent = t.female;
        const optHermesMale = document.querySelector('#hermesGenderSelect option[value="male"]');
        if (optHermesMale) optHermesMale.textContent = t.male;

        const optHermesVoiceAuto = document.querySelector('#hermesVoiceSelect option[value="auto"]');
        if (optHermesVoiceAuto) optHermesVoiceAuto.textContent = t.auto;

        const optModeTextOnly = document.querySelector('#hermesModeSelect option[value="text_only"]');
        if (optModeTextOnly) optModeTextOnly.textContent = t.mode_text_only;

        const optModeTextAndForeignAudio = document.querySelector('#hermesModeSelect option[value="text_and_foreign_audio"]');
        if (optModeTextAndForeignAudio) optModeTextAndForeignAudio.textContent = t.mode_text_and_foreign_audio;

        const optTreatmentMute = document.querySelector('#hermesAudioTreatmentSelect option[value="mute"]');
        if (optTreatmentMute) optTreatmentMute.textContent = t.treatment_mute;

        const optTreatmentPlayThenTts = document.querySelector('#hermesAudioTreatmentSelect option[value="play_then_tts"]');
        if (optTreatmentPlayThenTts) optTreatmentPlayThenTts.textContent = t.treatment_play_then_tts;

        const filterAudioDescEl = document.getElementById('lblHermesFilterAudioDesc');
        if (filterAudioDescEl) {
            filterAudioDescEl.textContent = t.filter_desc;
        }
        
        }

    _updateDictionaryLabels() {
        const locales = this.localesData;
        if (!locales.language) return;

        const mapping = {
            'lblVocabTitle': `${locales.language.vocab_title} (${this.currentLang.toUpperCase()})`,
            'lblVocabSubtitle': locales.language.vocab_subtitle,
            'btnOpenDictionaryInline': locales.language.manage_vocab || 'Manage Local Vocabulary'
        };

        Object.keys(mapping).forEach(id => {
            const el = document.getElementById(id);
            if (el && mapping[id]) el.textContent = mapping[id];
        });

        const dictFromEl = document.getElementById('dictFrom');
        if (dictFromEl) dictFromEl.placeholder = locales.language.placeholder_understand;
        const dictToEl = document.getElementById('dictTo');
        if (dictToEl) dictToEl.placeholder = locales.language.placeholder_correct;
    }

    _updateAdvancedTriggersLabels() {
        const locales = this.localesData;
        const localesTriggers = locales.triggers_v60 || {};
        
        const titleEl = document.getElementById('lblTriggersAdvancedTitle');
        const subtitleEl = document.getElementById('lblTriggersAdvancedSubtitle');

        if (titleEl) {
            const svg = titleEl.querySelector('svg');
            const editorFormIn = document.getElementById('editorFormIn');
            const isEditingIn = editorFormIn && editorFormIn.style.display !== 'none';
            const titleText = isEditingIn ? (localesTriggers.title_in || 'Trigger IN') : (localesTriggers.title_out || locales.alerts?.triggers || 'Trigger OUT');
            titleEl.innerHTML = '';
            if (svg) titleEl.appendChild(svg);
            titleEl.appendChild(document.createTextNode(' ' + titleText));
        }

        if (subtitleEl) {
            const editorFormIn = document.getElementById('editorFormIn');
            const isEditingIn = editorFormIn && editorFormIn.style.display !== 'none';
            subtitleEl.textContent = isEditingIn ? (localesTriggers.title_in_desc || locales.alerts?.trigger_subtitle) : (locales.alerts?.trigger_subtitle);
        }

        // Placeholders IN / OUT
        const triggerNameIn = document.getElementById('triggerNameIn');
        if (triggerNameIn) triggerNameIn.placeholder = localesTriggers.default_name_in || 'Nombre Trigger IN';

        const triggerNameOut = document.getElementById('triggerName');
        if (triggerNameOut) triggerNameOut.placeholder = localesTriggers.default_name_out || 'Nombre Trigger OUT';

        const mapping = {
            'lblTriggerFilterIn': localesTriggers.filter_label,
            'optFilterAllIn': localesTriggers.filter_all ? `🌐 ${localesTriggers.filter_all}` : '🌐 TODOS (Inyección como Sistema)',
            'lblActionPayloadTitle': localesTriggers.action_title,
            'lblPayloadText': localesTriggers.action_text_label,
            'lblPayloadAudio': localesTriggers.action_audio_label,
            'lblPayloadImage': localesTriggers.action_image_label,
            
            // New localizations for the trigger editor UI
            'lblTriggerLayout': locales.alerts?.trigger_layout,
            'optAnyMessage': locales.alerts?.any_message,
            'optSpecificMessage': locales.alerts?.specific_message,
            'lblTimelineEasingTriggers': locales.alerts?.timeline_easing,
            'lblTimelineHintTriggers': locales.alerts?.timeline_hint,
            'lblGlobalDurationTriggers': locales.alerts?.duration,
            'lblKeyframeOrderTriggers': locales.alerts?.keyframe_order,
            'lblAddKeyframeTriggers': locales.alerts?.add_keyframe,
            'cancelTriggerBtn': locales.alerts?.cancel,
            'cancelTriggerBtnIn': locales.alerts?.cancel
        };

        Object.keys(mapping).forEach(id => {
            const el = document.getElementById(id);
            if (el && mapping[id]) el.textContent = mapping[id];
        });

        const triggerMsgTextIn = document.getElementById('triggerMsgTextIn');
        if (triggerMsgTextIn) triggerMsgTextIn.placeholder = localesTriggers.action_text_placeholder || 'Escribe el mensaje...';

        ['btnRecordAudioIn', 'btnUploadAudioIn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                const svg = btn.querySelector('svg');
                const text = id === 'btnRecordAudioIn' ? localesTriggers.btn_record : localesTriggers.btn_upload;
                btn.innerHTML = '';
                if (svg) btn.appendChild(svg);
                if (text) btn.appendChild(document.createTextNode(' ' + text));
            }
        });
    }

    /**
     * Actualiza la visibilidad de los selectores de idioma en la UI.
     */
    updateLangSwitcherUI() {
        const target = this.currentLang.toLowerCase();

        // 1. Botones y Pills (Ajustes modulares)
        document.querySelectorAll('.lang-btn, .lang-pill[data-lang]').forEach(btn => {
            const lang = (btn.dataset.lang || '').toLowerCase();
            if (lang === target) {
                btn.classList.add('active');
                btn.style.opacity = '1';
            } else {
                btn.classList.remove('active');
                btn.style.opacity = '0.6';
            }
        });

        // 2. Select Dropdown (Login v46.4.42)
        const loginLangSelect = document.getElementById('loginLangSelect');
        if (loginLangSelect) {
            loginLangSelect.value = target;
        }
    }

    /**
     * Inicializa los eventos de los selectores de idioma.
     */
    initLangSwitchers() {
        // Manejador para Botones y Pills
        document.querySelectorAll('.lang-btn, .lang-pill[data-lang]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = btn.dataset.lang;
                if (lang) {
                    this.loadLocale(lang);
                }
            });
        });

        // Manejador para el nuevo SELECT de Login (v46.4.42)
        const loginLangSelect = document.getElementById('loginLangSelect');
        if (loginLangSelect) {
            loginLangSelect.addEventListener('change', (e) => {
                const lang = e.target.value;
                this.loadLocale(lang);
            });
        }
    }

    _updateDynamicStatus() {
        const locales = this.localesData;
        if (!locales.chat) return;

        const statusIndicator = document.getElementById('statusIndicator');
        const statusIndicatorText = document.getElementById('statusIndicatorText');
        const micMode = window.micMode;
        const isRecording = window.isRecording;

        if (!statusIndicator) return;

        if (micMode === 'ptt') {
            if (isRecording) {
                statusIndicator.className = 'status-indicator ptt-ready';
                if (statusIndicatorText) statusIndicatorText.textContent = locales.chat.status_ready || 'Talk!';
            } else {
                statusIndicator.className = 'status-indicator silent';
                if (statusIndicatorText) statusIndicatorText.textContent = locales.chat.status_silent || 'SILENT';
            }
        } else {
            if (isRecording) {
                statusIndicator.classList.remove('silent');
                statusIndicator.classList.add('active');
                if (statusIndicatorText) statusIndicatorText.textContent = locales.chat.status_active || 'ACTIVE';
            } else {
                statusIndicator.classList.add('silent');
                statusIndicator.classList.remove('active');
                if (statusIndicatorText) statusIndicatorText.textContent = locales.chat.status_silent || 'SILENT';
            }
        }
    }
}

export { LocalizationManager };
