/**
 * @file module-settings-ui.js
 * @description Gestión modular de la interfaz de ajustes, personalización visual (DNA), temas y hardware.
 * [v60] Extraído de ui-controller-elite.js como parte de la Fase 5.
 */

import * as Hardware from '../lib/hardware.js';
import { HermesTTS } from '../utils/hermes-tts.js';

export class SettingsUI {
    constructor(domManager, audioState, socket, callbacks = {}) {
        this.dom = domManager;
        this.audio = audioState;
        this.socket = socket;
        window.SettingsUIInstance = this;
        
        // Callbacks de UI (Puentes temporales con el monolito)
        this.showGlobalToast = callbacks.showGlobalToast || window.showGlobalToast;
        this.showCatFeedback = callbacks.showCatFeedback || window.showCatFeedback;
        this.openCategoryManager = callbacks.openCategoryManager || window.openCategoryManager;
        this.renderTriggersList = callbacks.renderTriggersList || window.renderTriggersList;
        this.updateLoginMasterButton = callbacks.updateLoginMasterButton || window.updateLoginMasterButton;
        this.updateSettingsNavLabels = callbacks.updateSettingsNavLabels || window.updateSettingsNavLabels;

        // Estado local de DNA (Se moverá a AudioState en Fase 6)
        const theme = localStorage.getItem('talkme_theme') || 'dark';
        const globalSavedPrimary = localStorage.getItem('talkme_dna_primary');
        const themeSavedPrimary = localStorage.getItem(`talkme_dna_primary_${theme}`);
        this.currentDNA = {
            bgPrimary: localStorage.getItem(`talkme_dna_bg_primary_${theme}`) || localStorage.getItem('talkme_dna_bg_primary') || (theme === 'light' ? '#F8FAFC' : '#0a0a0f'),
            bgSecondary: localStorage.getItem(`talkme_dna_bg_secondary_${theme}`) || localStorage.getItem('talkme_dna_bg_secondary') || (theme === 'light' ? '#FFFFFF' : '#151522'),
            primary: themeSavedPrimary || globalSavedPrimary || '#7b68ee',
            secondary: localStorage.getItem(`talkme_dna_secondary_${theme}`) || localStorage.getItem('talkme_dna_secondary') || '#ff6b35',
            text: localStorage.getItem(`talkme_dna_text_${theme}`) || localStorage.getItem('talkme_dna_text') || (theme === 'light' ? '#1E293B' : '#ffffff'),
            textSecondary: localStorage.getItem(`talkme_dna_text_secondary_${theme}`) || localStorage.getItem('talkme_dna_text_secondary') || (theme === 'light' ? '#475569' : '#aaaaaa')
        };
    }

    /**
     * Inicialización principal de Ajustes.
     */
    init() {
        console.log('⚙️ [SettingsUI] Inicializando sistema de ajustes modular...');
        
        // Instanciar Hermes TTS (Text-to-Speech) de forma periférica
        if (!window.TALKME_DISABLE_HERMES_HARD) {
            try {
                window.hermesTTS = new HermesTTS();
            } catch (err) {
                console.error('❌ [SettingsUI] Falló inicialización de HermesTTS:', err);
            }
        }

        this.restoreUserPreferences();
        this.initModularSettings();
        this.initThemeSwitchers();
        this.initDNAPalette();
        this.initTypographyKnobs();
        
        // Inicialización visual de tema
        this.applyTheme(this.audio.get('currentTheme') || 'dark');

        this.initLanguageSelectorDragScroll();
        this.initHermesControls();
        this.initGlobalSettingsSocketSync();
    }

    /**
     * [v60.UI] Sincronización en tiempo real de la configuración global emitida por el Master.
     */
    initGlobalSettingsSocketSync() {
        const socketRef = this.socket || window.socket;
        if (!socketRef) return;

        const handleSettings = (settings) => {
            if (!settings || typeof settings !== 'object') return;
            this.masterGlobalSettings = settings;
            try {
                localStorage.setItem('talkme_master_global_settings', JSON.stringify(settings));
            } catch (e) {}

            // Si el usuario NO es el Master, aplicar en vivo la plantilla global de la sala
            if (!this.audio.get('isMaster')) {
                this.applyMasterGlobalTemplate(settings);
            }
        };

        socketRef.on('global-settings-updated', handleSettings);
        socketRef.on('categories-config', (data) => {
            if (data && data.globalSettings) handleSettings(data.globalSettings);
        });
        socketRef.on('join-success', (data) => {
            if (data && data.globalSettings) handleSettings(data.globalSettings);
        });
    }

    /**
     * Aplica la plantilla global del Master al cliente de forma segura.
     */
    applyMasterGlobalTemplate(settings) {
        if (!settings) return;
        const theme = settings.theme === 'light' ? 'light' : 'dark';

        if (settings.dna) {
            const localThemePrimary = localStorage.getItem(`talkme_dna_primary_${theme}`) || localStorage.getItem('talkme_dna_primary');
            this.currentDNA = {
                bgPrimary: settings.dna.bgPrimary || (theme === 'light' ? '#F8FAFC' : '#0a0a0f'),
                bgSecondary: settings.dna.bgSecondary || (theme === 'light' ? '#FFFFFF' : '#151522'),
                primary: (settings.dna.primary && settings.dna.primary !== '#7b68ee') ? settings.dna.primary : (localThemePrimary || settings.dna.primary || '#7b68ee'),
                secondary: settings.dna.secondary || '#ff6b35',
                text: settings.dna.text || (theme === 'light' ? '#1E293B' : '#ffffff'),
                textSecondary: settings.dna.textSecondary || (theme === 'light' ? '#475569' : '#aaaaaa')
            };
        }

        // Aplicar tema
        this.applyTheme(theme);

        // Sincronizar inputs de color
        const colorMap = [
            { id: 'colorPickerPrimaryBG', val: this.currentDNA.bgPrimary },
            { id: 'colorPickerSecondaryBG', val: this.currentDNA.bgSecondary },
            { id: 'colorPickerAccentPrimary', val: this.currentDNA.primary },
            { id: 'colorPickerAccentSecondary', val: this.currentDNA.secondary },
            { id: 'colorPickerTextPrimary', val: this.currentDNA.text },
            { id: 'colorPickerTextSecondary', val: this.currentDNA.textSecondary }
        ];
        colorMap.forEach(item => {
            const el = document.getElementById(item.id);
            if (el && item.val) el.value = item.val;
        });

        // Aplicar tipografía
        if (settings.typography) {
            const fontSize = Math.max(40, Math.min(250, parseInt(settings.typography.fontSize) || 100));
            const fontWeight = Math.max(100, Math.min(900, parseInt(settings.typography.fontWeight) || 400));
            
            this.audio.setState({ fontSizePercent: fontSize, fontWeight: fontWeight });
            localStorage.setItem('talkme_font_percent', fontSize);
            localStorage.setItem('talkme_font_weight', fontWeight);
            this.updateChatFontSize();

            if (this.fontSizeKnobCtrl) this.fontSizeKnobCtrl.setValue(fontSize);
            if (this.fontWeightKnobCtrl) this.fontWeightKnobCtrl.setValue(fontWeight);
        }
    }

    /**
     * Habilita el desplazamiento por arrastre (drag-to-scroll) y redirección de rueda
     * de ratón en los selectores de idioma de forma ultra-elegante.
     */
    initLanguageSelectorDragScroll() {
        // Función interna para actualizar dinámicamente las clases de degradado según el scroll y dimensiones reales
        const updateScrollMasks = (container) => {
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;

            container.classList.remove('no-overflow', 'overflow-left-only', 'overflow-right-only', 'overflow-both');

            // Agregamos tolerancia de 2px para evitar decimales extraños del render
            if (scrollWidth <= clientWidth + 2) {
                container.classList.add('no-overflow');
            } else if (scrollLeft <= 5) {
                container.classList.add('overflow-right-only');
            } else if (scrollLeft + clientWidth >= scrollWidth - 5) {
                container.classList.add('overflow-left-only');
            } else {
                container.classList.add('overflow-both');
            }
        };

        // Exponer una función global para forzar recalcular
        window.recalculateLangScrollMasks = () => {
            document.querySelectorAll('.lang-selector-group').forEach(group => {
                updateScrollMasks(group);
            });
        };

        // Redirección global del scroll de rueda del ratón (vertical a horizontal)
        document.addEventListener('wheel', (e) => {
            const group = e.target.closest('.lang-selector-group');
            if (group) {
                if (group.scrollWidth > group.clientWidth) {
                    e.preventDefault();
                    group.scrollLeft += e.deltaY;
                    updateScrollMasks(group);
                }
            }
        }, { passive: false });

        // Habilitar Drag-to-Scroll por gestos de ratón en PC
        const enableDrag = (container) => {
            if (container._dragScrollEnabled) return;
            container._dragScrollEnabled = true;

            // Escuchar el evento scroll nativo para recalcular degradados ópticos en tiempo real
            container.addEventListener('scroll', () => {
                updateScrollMasks(container);
            });

            // Usar ResizeObserver para recalculados inmediatos si el viewport o modal cambia de tamaño
            if (window.ResizeObserver) {
                const ro = new ResizeObserver(() => {
                    updateScrollMasks(container);
                });
                ro.observe(container);
            } else {
                window.addEventListener('resize', () => {
                    updateScrollMasks(container);
                });
            }

            let isDown = false;
            let startX;
            let scrollLeft;
            let hasMoved = false;

            container.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return; // Solo clic izquierdo
                isDown = true;
                container.style.cursor = 'grabbing';
                startX = e.pageX - container.offsetLeft;
                scrollLeft = container.scrollLeft;
                hasMoved = false;
            });

            container.addEventListener('mouseleave', () => {
                if (isDown) {
                    isDown = false;
                    container.style.cursor = 'grab';
                }
            });

            container.addEventListener('mouseup', () => {
                if (isDown) {
                    isDown = false;
                    container.style.cursor = 'grab';
                }
            });

            container.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - container.offsetLeft;
                const walk = (x - startX) * 1.5; // Ajustar sensibilidad
                if (Math.abs(walk) > 5) {
                    hasMoved = true;
                }
                container.scrollLeft = scrollLeft - walk;
                updateScrollMasks(container);
            });

            // Evitar clics accidentales al arrastrar (Fase de captura)
            container.addEventListener('click', (e) => {
                if (hasMoved) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
            }, true);

            // Primer disparo de recalculación al instanciar
            setTimeout(() => {
                updateScrollMasks(container);
            }, 100);
        };

        // Buscar y aplicar a todos los selectores existentes
        document.querySelectorAll('.lang-selector-group').forEach(group => {
            enableDrag(group);
        });

        // Asegurar que los contenedores dinámicos cargados después también se inicialicen
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.addEventListener('click', () => {
                document.querySelectorAll('.lang-selector-group').forEach(group => {
                    enableDrag(group);
                });
            });
        }
    }

    /**
     * [v46.4.92] Gestión del Modal Principal de Ajustes.
     */
    initModularSettings() {
        if (window._modularSettingsInitialized) return;
        window._modularSettingsInitialized = true;

        const btnOpen = this.dom.get('controls', 'btnOpenMainSettings') || document.getElementById('btnOpenMainSettings');
        const modal = this.dom.get('modals', 'settings') || document.getElementById('settingsModal');
        const closeBtnIcon = document.getElementById('btnCloseSettingsIcon');
        const closeBtnBottom = document.getElementById('btnCloseSettings');

        if (!btnOpen || !modal) return;

        btnOpen.addEventListener('click', (e) => {
            if (e) e.preventDefault();
            modal.classList.remove('no-fade');
            modal.classList.remove('hidden');
            document.body.classList.add('modal-active');

            // Visibilidad de sección Master
            const navItemControl = document.getElementById('navItemControl');
            if (navItemControl) {
                navItemControl.style.display = this.audio.get('isMaster') ? 'flex' : 'none';
            }

            // Persistencia de sección
            const savedSection = localStorage.getItem('talkme_active_settings_section');
            const navItems = modal.querySelectorAll('.nav-item');
            const sections = modal.querySelectorAll('.settings-section-content');

            let targetSectionId = this.audio.get('isMaster') ? 'section-control' : 'section-idioma';
            if (savedSection) {
                const isValid = Array.from(navItems).some(item => item.dataset.section === savedSection);
                const isRestricted = (savedSection === 'section-control' && !this.audio.get('isMaster'));
                if (isValid && !isRestricted) targetSectionId = savedSection;
            }

            this.switchSection(targetSectionId, modal);

            if (this.updateSettingsNavLabels) this.updateSettingsNavLabels();
            if (this.updateLoginMasterButton) this.updateLoginMasterButton();

            // [v60.Elite] AUDITORÍA DE INTEGRIDAD: Asegurar que el selector coincide con la realidad física
            setTimeout(() => {
                this.initHardwareStatus();
                this.verifyHardwareIntegrity();
                this.syncHermesUIState();
                this.populateHermesVoices();
                if (typeof window.recalculateLangScrollMasks === 'function') {
                    window.recalculateLangScrollMasks();
                }
            }, 150);
        });

        const closeModal = (e) => {
            if (e) e.preventDefault();
            const activeItem = modal.querySelector('.nav-item.active');
            if (activeItem && activeItem.dataset.section) {
                localStorage.setItem('talkme_active_settings_section', activeItem.dataset.section);
            }
            modal.classList.add('hidden');
            document.body.classList.remove('modal-active');
            modal.classList.remove('no-fade');
        };

        if (closeBtnIcon) closeBtnIcon.addEventListener('click', closeModal);
        if (closeBtnBottom) closeBtnBottom.addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(e);
            }
        });

        // Navegación lateral
        const navItems = modal.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const target = item.dataset.section;
                if (target) this.switchSection(target, modal);
            });
        });

        // --- Vinculación de Controles Internos ---

        // PIN de Sala (Master)
        const inputRoomPin = document.getElementById('inputRoomPin');
        const btnTogglePin = document.getElementById('btnTogglePin');
        const btnSavePin = document.getElementById('btnSavePin');

        if (btnTogglePin && inputRoomPin) {
            btnTogglePin.onclick = () => {
                const isPassword = inputRoomPin.type === 'password';
                inputRoomPin.type = isPassword ? 'text' : 'password';
                btnTogglePin.classList.toggle('active', !isPassword);
            };
        }

        if (btnSavePin && inputRoomPin) {
            btnSavePin.onclick = () => {
                if (window.safeEmit) window.safeEmit('update-room-pin', { pin: inputRoomPin.value });
                if (this.showCatFeedback) this.showCatFeedback('PIN de sala guardado correctamente', 'success');
            };
        }

        // Gestión de Categorías
        const handleOpenCategories = (e) => {
            if (e) e.preventDefault();
            window.openedFromSettings = true;
            modal.classList.add('hidden');
            if (this.openCategoryManager) this.openCategoryManager();
        };
        const btnManageCat = document.getElementById('btnManageCategories');
        const btnManageCatAlt = document.getElementById('btnManageCategoriesAlt');
        if (btnManageCat) btnManageCat.onclick = handleOpenCategories;
        if (btnManageCatAlt) btnManageCatAlt.onclick = handleOpenCategories;

        // Selección de modo de mensajes
        const messagesModeSelectAlt = document.getElementById('messagesModeSelectAlt');
        if (messagesModeSelectAlt) {
            messagesModeSelectAlt.addEventListener('change', (e) => {
                const transcriptionOnly = (e.target.value === 'text');
                this.audio.setState({ transcriptionOnly });
                localStorage.setItem('talkme_msg_mode', e.target.value);
                if (window.safeEmit) window.safeEmit('set-transcription-mode', { transcriptionOnly });
            });
        }

        // Modo de recepción
        const receptionModeSelectAlt = document.getElementById('receptionModeSelectAlt');
        if (receptionModeSelectAlt) {
            receptionModeSelectAlt.addEventListener('change', (e) => {
                const autoPlay = (e.target.value === 'auto');
                this.audio.setState({ autoPlayRealtime: autoPlay });
                localStorage.setItem('talkme_reception_mode', e.target.value);
                if (this.showCatFeedback) this.showCatFeedback(autoPlay ? '🔊 Recepción: Auto Play' : '🖐️ Recepción: Play Manual', 'info');
            });
        }

        // Traducción y Persistencia
        this.initTranslationToggles();

        // Almacenamiento & Caché
        this.initCacheControls();

        // Alertas de Hardware
        this.initAlertToggles();

        // [v60.ELITE] Botón de refresco de hardware de audio multicanal en caliente
        const btnRefreshAudio = document.getElementById('btnRefreshAudioHardware');
        if (btnRefreshAudio) {
            btnRefreshAudio.addEventListener('click', async (e) => {
                if (e) e.preventDefault();
                const icon = btnRefreshAudio.querySelector('.refresh-icon');
                if (icon) icon.classList.add('spinning');
                
                if (typeof window.forceAudioHardwareRefresh === 'function') {
                    await window.forceAudioHardwareRefresh(false); // force real probe
                }
                
                setTimeout(() => {
                    if (icon) icon.classList.remove('spinning');
                }, 600); // 0.6s animation
            });
        }

        // Filtro de la Guía de Usuario (aplicación principal)
        const appGuideFilterInput = document.getElementById('appGuideFilterInput');
        if (appGuideFilterInput) {
            appGuideFilterInput.addEventListener('input', () => {
                const query = appGuideFilterInput.value.toLowerCase().trim();
                const container = document.getElementById('guideDynamicContainer');
                const cards = document.querySelectorAll('#section-guia .guide-card');
                let totalVisible = 0;
                cards.forEach(card => {
                    const text = card.textContent.toLowerCase();
                    const matches = query === '' || text.includes(query);
                    if (matches) {
                        card.style.display = 'flex';
                        totalVisible++;
                    } else {
                        card.style.display = 'none';
                    }
                });

                // Control reactivo del empty state de la guía
                const emptyState = document.getElementById('appGuideEmptyState');
                if (emptyState) {
                    emptyState.style.display = (totalVisible === 0 && query !== '') ? 'block' : 'none';
                }
            });
        }

        // Filtro de Legal & Licencias (aplicación principal)
        const appLegalFilterInput = document.getElementById('appLegalFilterInput');
        if (appLegalFilterInput) {
            appLegalFilterInput.addEventListener('input', () => {
                const query = appLegalFilterInput.value.toLowerCase().trim();
                const container = document.getElementById('legalDynamicContainer');
                if (!container) return;

                const cards = container.querySelectorAll('.legal-card');
                let totalVisible = 0;
                const sectionCounts = { copyright: 0, ai: 0, npm: 0, licenses: 0 };

                cards.forEach(card => {
                    const text = card.textContent.toLowerCase();
                    const matches = query === '' || text.includes(query);
                    card.style.display = matches ? '' : 'none';
                    if (matches) {
                        totalVisible++;
                        const sec = card.dataset.legalSection;
                        if (sec && sectionCounts[sec] !== undefined) {
                            sectionCounts[sec]++;
                        }
                    }
                });

                // Controlar visibilidad de los encabezados de sección
                const aiHeader = container.querySelector('[data-legal-header="ai"]');
                if (aiHeader) aiHeader.style.display = sectionCounts.ai > 0 ? 'flex' : 'none';

                const npmHeader = container.querySelector('[data-legal-header="npm"]');
                const npmGrid = container.querySelector('[data-legal-group="npm"]');
                if (npmHeader) npmHeader.style.display = sectionCounts.npm > 0 ? 'flex' : 'none';
                if (npmGrid) npmGrid.style.display = sectionCounts.npm > 0 ? 'grid' : 'none';

                const licHeader = container.querySelector('[data-legal-header="licenses"]');
                if (licHeader) licHeader.style.display = sectionCounts.licenses > 0 ? 'flex' : 'none';

                // Estado vacío si no hay coincidencias
                const emptyState = document.getElementById('appLegalEmptyState');
                if (emptyState) {
                    emptyState.style.display = (totalVisible === 0 && query !== '') ? 'block' : 'none';
                }
            });
        }

        // Reload guide & legal when interface language changes
        window.addEventListener('language-changed', () => {
            const container = document.getElementById('guideDynamicContainer');
            if (container) {
                this.loadAndRenderGuide();
            }
            const legalCont = document.getElementById('legalDynamicContainer');
            if (legalCont) {
                this.loadAndRenderLegal();
            }
        });
}

    /**
     * Cambio de sección en el modal de ajustes.
     */
    switchSection(targetId, modal) {
        const navItems = modal.querySelectorAll('.nav-item');
        const sections = modal.querySelectorAll('.settings-section-content');

        localStorage.setItem('talkme_active_settings_section', targetId);

        navItems.forEach(i => i.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));

        const targetBtn = Array.from(navItems).find(i => i.dataset.section === targetId);
        const targetEl = document.getElementById(targetId);

        if (targetBtn) targetBtn.classList.add('active');
        if (targetEl) {
            targetEl.classList.add('active');
            if (targetId === 'section-guia') {
                this.loadAndRenderGuide();
            }
            if (targetId === 'section-legal') {
                this.loadAndRenderLegal();
            }
            if (targetId === 'section-triggers' && this.renderTriggersList) {
                this.renderTriggersList();
            }
            // [INGENIERÍA EXPERTA] Sincronización proactiva al entrar en Administración o Traducción
            if (targetId === 'section-control' && this.audio.get('isMaster')) {
                const socketRef = this.socket || window.socket;
                if (socketRef && socketRef.connected) {
                    socketRef.emit('get-users');
                } else if (typeof window.safeEmit === 'function') {
                    window.safeEmit('get-users');
                }
            }

            if (targetId === 'section-traduccion' && typeof window.renderBabelExcludeTags === 'function') {
                window.renderBabelExcludeTags();
            }

            if (targetId === 'section-audio' && typeof window.forceAudioHardwareRefresh === 'function') {
                window.forceAudioHardwareRefresh(true); // silent auto-refresh on panel open
            }
            const wrapper = modal.querySelector('.settings-content-wrapper');
            if (wrapper) wrapper.scrollTop = 0;

            // Recalcular máscaras al cambiar de sección
            setTimeout(() => {
                if (typeof window.recalculateLangScrollMasks === 'function') {
                    window.recalculateLangScrollMasks();
                }
            }, 50);
        }
    }

    /**
     * Gestión de toggles de traducción.
     */
    initTranslationToggles() {
        const translateEnable = document.getElementById('translateEnableToggle');
        const showOriginal = document.getElementById('showOriginalToggle');
        const convertNumbers = document.getElementById('convertNumbersToggle');
        const container = document.getElementById('translateLangsContainer');
        const suboptions = document.getElementById('translationSuboptions');
        const showOriginalContainer = document.getElementById('showOriginalContainer');

        // [v60.ITN] Conversión Inteligente de Números Hablados a Dígitos (OFF por defecto)
        const savedConvertNumbers = localStorage.getItem('talkme_convert_numbers') === 'true';
        window.convertNumbersEnabled = savedConvertNumbers;
        if (convertNumbers) {
            convertNumbers.checked = savedConvertNumbers;
            this.bindTriggerStyleBadge('btnToggleConvertNumbers', 'convertNumbersToggle', (enabled) => {
                window.convertNumbersEnabled = Boolean(enabled);
                localStorage.setItem('talkme_convert_numbers', String(Boolean(enabled)));
                if (window.safeEmit) {
                    window.safeEmit('update-ai-settings', { convertNumbers: Boolean(enabled) });
                }
            });
        }

        if (showOriginal) {
            const savedShowOrigState = localStorage.getItem('talkme_translate_show_orig') !== 'false';
            showOriginal.checked = savedShowOrigState;
            document.body.classList.toggle('hide-babel-original', !savedShowOrigState);
            
            // Sincronizar estado inicial de 'showOriginal'
            setTimeout(() => {
                if (window.safeEmit) window.safeEmit('update-ai-settings', { showOriginal: showOriginal.checked });
            }, 1100);

            this.bindTriggerStyleBadge('btnToggleShowOriginal', 'showOriginalToggle', (show) => {
                localStorage.setItem('talkme_translate_show_orig', show);
                document.body.classList.toggle('hide-babel-original', !show);
                if (window.safeEmit) window.safeEmit('update-ai-settings', { showOriginal: show });
            });
        }

        const updateSuboptionsState = () => {
            if (suboptions && translateEnable) {
                if (translateEnable.checked) {
                    suboptions.classList.remove('disabled');
                } else {
                    suboptions.classList.add('disabled');
                }
            }
        };

        // 🛡️ [Anti-Murphy - Golden Mean] Píldora defensiva concisa colocada justo encima de los controles
        const translationSection = document.getElementById('section-traduccion');
        const translationGrid = translationSection ? translationSection.querySelector('.translation-grid') : null;
        let pill = document.getElementById('translationDisabledPill');

        if (!pill && translationSection) {
            pill = document.createElement('div');
            pill.id = 'translationDisabledPill';
            pill.className = 'translation-disabled-pill';
            pill.style.cssText = 'display: ' + (window.isTranslationAvailable === false ? 'flex' : 'none') + '; align-items: center; gap: 8px; padding: 10px 14px; margin-bottom: 16px; background: rgba(255, 183, 0, 0.08); border: 1px solid rgba(255, 183, 0, 0.25); border-radius: 10px; color: #ffb700; font-size: 12.5px; font-weight: 600; text-align: left;';
            pill.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span data-i18n="settings_translation_disabled">${(window.localesData && window.localesData.settings && window.localesData.settings.translation_disabled) || 'Traducción desactivada del sistema'}</span>
            `;
            if (translationGrid && translationGrid.parentNode) {
                translationGrid.parentNode.insertBefore(pill, translationGrid);
            } else if (suboptions && suboptions.parentNode) {
                suboptions.parentNode.insertBefore(pill, suboptions);
            }
        } else if (pill && translationGrid && pill.nextElementSibling !== translationGrid) {
            // Asegurar que la píldora esté inmediatamente antes del grid si ya existía en el DOM
            translationGrid.parentNode.insertBefore(pill, translationGrid);
        }

        // 🛡️ [Anti-Murphy] Función centralizada para controlar reactivamente la disponibilidad
        const updateTranslationControlsAvailability = (isAvailable) => {
            const currentPill = document.getElementById('translationDisabledPill');
            const currentGrid = document.querySelector('#section-traduccion .translation-grid');
            const currentSuboptions = document.getElementById('translationSuboptions');

            // Refrescar texto de la píldora según el idioma activo actual
            if (currentPill) {
                const textSpan = currentPill.querySelector('[data-i18n="settings_translation_disabled"]');
                const transMsg = (window.localesData?.settings?.translation_disabled) 
                    || (window.localesData?.chat?.status_translation_disabled) 
                    || 'Traducción desactivada del sistema';
                if (textSpan) textSpan.textContent = transMsg;
            }

            if (isAvailable) {
                if (currentPill) currentPill.style.display = 'none';
                if (currentGrid) {
                    currentGrid.style.opacity = '1';
                    currentGrid.style.pointerEvents = 'auto';
                    currentGrid.style.filter = 'none';
                }
                updateSuboptionsState();
                updateShowOriginalState();
            } else {
                if (currentPill) currentPill.style.display = 'flex';
                if (currentGrid) {
                    currentGrid.style.opacity = '0.4';
                    currentGrid.style.pointerEvents = 'none';
                }
                if (currentSuboptions) {
                    currentSuboptions.style.opacity = '0.4';
                    currentSuboptions.style.pointerEvents = 'none';
                }
            }
        };

        // Escuchar cambios de idioma para actualizar el texto de la píldora de inmediato
        window.addEventListener('language-changed', () => {
            const pillSpan = document.querySelector('#translationDisabledPill [data-i18n="settings_translation_disabled"]');
            if (pillSpan && (window.localesData?.settings?.translation_disabled || window.localesData?.chat?.status_translation_disabled)) {
                pillSpan.textContent = window.localesData?.settings?.translation_disabled || window.localesData?.chat?.status_translation_disabled;
            }
        });

        // Exponer globalmente para responder instantáneamente ante eventos de socket
        window.updateTranslationControlsAvailability = updateTranslationControlsAvailability;
        this.updateTranslationControlsAvailability = updateTranslationControlsAvailability;

        const updateShowOriginalState = () => {
            if (showOriginalContainer && translateEnable) {
                if (translateEnable.checked) {
                    showOriginalContainer.style.opacity = '1';
                    showOriginalContainer.style.pointerEvents = 'auto';
                } else {
                    showOriginalContainer.style.opacity = '0.4';
                    showOriginalContainer.style.pointerEvents = 'none';
                    if (showOriginal && showOriginal.checked) {
                        showOriginal.checked = false;
                        showOriginal.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }
        };

        if (translateEnable) {
            const savedTranslateState = localStorage.getItem('talkme_translate_enabled') === 'true';
            translateEnable.checked = savedTranslateState; 
            
            this.bindTriggerStyleBadge('btnToggleTranslateEnable', 'translateEnableToggle', (checked) => {
                if (checked) {
                    if (showOriginal && !showOriginal.checked) {
                        showOriginal.checked = true;
                        showOriginal.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
                localStorage.setItem('talkme_translate_enabled', checked);
                updateSuboptionsState();
                updateShowOriginalState();
            });

            updateSuboptionsState();
            updateShowOriginalState();
            updateTranslationControlsAvailability(window.isTranslationAvailable !== false);

            // Sincronizar estado inicial y re-conexiones con el servidor
            const syncInitialState = () => {
                const allowedLangs = window.installedLangs || ['es', 'en', 'eu'];
                let savedLangs = allowedLangs;
                try {
                    const raw = localStorage.getItem('talkme_translate_langs');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        savedLangs = parsed.filter(l => allowedLangs.includes(l));
                    }
                } catch(e) {}

                const aiSettings = {
                    autoTranslate: translateEnable.checked,
                    showOriginal: showOriginal ? showOriginal.checked : false,
                    convertNumbers: convertNumbers ? convertNumbers.checked : (localStorage.getItem('talkme_convert_numbers') === 'true'),
                    enabledLangs: savedLangs,
                    protectedWords: (document.getElementById('inputTradExclude')?.value || '').split(',').map(s => s.trim()).filter(s => s.length > 0)
                };
                if (window.safeEmit) window.safeEmit('update-ai-settings', aiSettings);
            };
            
            setTimeout(() => {
                syncInitialState();
                if (window.socket && typeof window.socket.on === 'function') {
                    window.socket.on('connect', syncInitialState);
                }
            }, 1000);

            translateEnable.addEventListener('change', (e) => {
                const checked = e.target.checked;
                if (checked) {
                    // Si se activa la traducción, también activamos el Mensaje Original
                    if (showOriginal && !showOriginal.checked) {
                        showOriginal.checked = true;
                        showOriginal.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }

                const allowedLangs = window.installedLangs || ['es', 'en', 'eu'];
                let savedLangs = allowedLangs;
                try {
                    const raw = localStorage.getItem('talkme_translate_langs');
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        savedLangs = parsed.filter(l => allowedLangs.includes(l));
                    }
                } catch(e) {}

                const aiSettings = {
                    autoTranslate: checked,
                    showOriginal: showOriginal ? showOriginal.checked : false,
                    convertNumbers: convertNumbers ? convertNumbers.checked : (localStorage.getItem('talkme_convert_numbers') === 'true'),
                    enabledLangs: savedLangs,
                    protectedWords: (document.getElementById('inputTradExclude')?.value || '').split(',').map(s => s.trim()).filter(s => s.length > 0)
                };
                if (typeof window.safeEmit === 'function') {
                    window.safeEmit('update-ai-settings', aiSettings);
                }
                localStorage.setItem('talkme_translate_enabled', checked);
                updateSuboptionsState();
                updateShowOriginalState();
            });
        }

        if (container) {
            const pills = container.querySelectorAll('.lang-pill');
            const allowedLangs = window.installedLangs || ['es', 'en', 'eu'];
            let savedLangs = allowedLangs;
            try {
                const raw = localStorage.getItem('talkme_translate_langs');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    savedLangs = parsed.filter(l => allowedLangs.includes(l));
                }
            } catch(e) {}

            const updatePillsVisibility = () => {
                const current = window.currentLang || 'es';
                pills.forEach(pill => {
                    const lang = pill.dataset.translateLang;
                    pill.style.display = (lang === current) ? 'none' : 'flex';
                    pill.classList.toggle('active', savedLangs.includes(lang) && lang !== current);
                });
                if (typeof window.recalculateLangScrollMasks === 'function') {
                    window.recalculateLangScrollMasks();
                }
            };

            pills.forEach(pill => {
                pill.onclick = (e) => {
                    e.preventDefault();
                    
                    pill.classList.toggle('active');
                    const activeLangs = Array.from(pills)
                        .filter(p => p.classList.contains('active') && p.style.display !== 'none')
                        .map(p => p.dataset.translateLang);
                    localStorage.setItem('talkme_translate_langs', JSON.stringify(activeLangs));
                    if (window.safeEmit) window.safeEmit('update-ai-settings', { enabledLangs: activeLangs });

                    if (activeLangs.length === 0) {
                        // Si no hay ningún idioma seleccionado en los filtros, apagamos la traducción automáticamente
                        if (translateEnable && translateEnable.checked) {
                            translateEnable.checked = false;
                            translateEnable.dispatchEvent(new Event('change'));
                        }
                    } else {
                        // Si hay al menos un idioma seleccionado y la traducción está apagada, la encendemos automáticamente
                        if (translateEnable && !translateEnable.checked) {
                            translateEnable.checked = true;
                            translateEnable.dispatchEvent(new Event('change'));
                        }
                    }
                };
            });

            updatePillsVisibility();
            window.addEventListener('language-changed', updatePillsVisibility);
        }

        // [v60.Elite] Palabras Protegidas (Exclusión de Traducción) - Server Authoritative
        const btnAddExclude = document.getElementById('btnTradExcludeAdd');
        const inputExclude = document.getElementById('inputTradExclude');
        const excludeTags = document.getElementById('translateExcludeTags');

        if (btnAddExclude && inputExclude && excludeTags) {
            const renderExcludeTags = () => {
                const words = window.currentBabelDictionary || [];
                excludeTags.innerHTML = words.map(w => `
                    <div class="dict-tag">
                        <span>${w}</span>
                        <span class="remove" data-word="${w}"></span>
                    </div>
                `).join('');

                excludeTags.querySelectorAll('.remove').forEach(btn => {
                    btn.onclick = () => {
                        const word = btn.dataset.word;
                        const newWords = words.filter(w => w !== word);
                        window.currentBabelDictionary = newWords;
                        renderExcludeTags();
                        if (window.safeEmit) window.safeEmit('save-babel-dictionary', newWords);
                    };
                });
            };

            // Exponer globalmente para que module-socket-handlers.js pueda forzar el refresco visual
            window.renderBabelExcludeTags = renderExcludeTags;

            btnAddExclude.onclick = () => {
                const val = inputExclude.value.trim();
                if (!val) return;
                const words = window.currentBabelDictionary || [];
                if (!words.includes(val)) {
                    words.push(val);
                    window.currentBabelDictionary = words;
                    inputExclude.value = '';
                    renderExcludeTags();
                    if (window.safeEmit) window.safeEmit('save-babel-dictionary', words);
                }
            };

            inputExclude.onkeypress = (e) => { if (e.key === 'Enter') btnAddExclude.click(); };
            
            // Render inicial por seguridad (el socket debería sobreescribirlo)
            renderExcludeTags();
        }

    }

    /**
     * Gestión de controles de caché.
     */
    initCacheControls() {
        const range = document.getElementById('cacheLimitRange');
        const label = document.getElementById('cacheLimitLabel');
        const btnClear = document.getElementById('btnClearCache');

        if (range && label) {
            const saved = localStorage.getItem('talkme_cache_limit') || '100';
            range.value = saved;
            label.textContent = `${saved}MB`;

            range.addEventListener('input', (e) => {
                const val = e.target.value;
                label.textContent = `${val}MB`; // Actualización inmediata de la etiqueta
                if (window.updateCacheVisuals) window.updateCacheVisuals(val);
                if (this.audio.get('isMaster') && window.safeEmit) {
                    window.safeEmit('set-cache-limit', { limit: parseInt(val) });
                }
            });

            range.addEventListener('change', (e) => {
                localStorage.setItem('talkme_cache_limit', e.target.value);
                if (this.showGlobalToast) this.showGlobalToast(`Límite fijado: ${e.target.value}MB`, 'success', 1500);
            });
        }

        if (btnClear && !btnClear.dataset.listenerActive) {
            btnClear.dataset.listenerActive = 'true';
            btnClear.addEventListener('click', () => {
                if (confirm('⚠️ ¿Estás seguro de que quieres borrar todas las imágenes y audios recibidos?')) {
                    if (window.safeEmit) {
                        window.safeEmit('clear-cache', {}, (res) => {
                            if (res && res.success) {
                                if (this.showGlobalToast) this.showGlobalToast(`🗑️ ${res.message}`, 'success', 2500);
                            } else {
                                if (this.showGlobalToast) this.showGlobalToast('❌ Error al limpiar caché', 'error', 2000);
                            }
                        });
                    }
                }
            });
        }
    }

    bindTriggerStyleBadge(badgeId, checkboxId, onChangeCallback) {
        const badge = document.getElementById(badgeId);
        const cb = document.getElementById(checkboxId);
        if (!badge || !cb) return;

        const updateUI = () => {
            const isChecked = !!cb.checked;
            badge.classList.toggle('tgl-on', isChecked);
            badge.classList.toggle('tgl-off', !isChecked);
            badge.innerText = isChecked ? 'ON' : 'OFF';
        };

        updateUI();

        badge.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            cb.checked = !cb.checked;
            updateUI();
            if (onChangeCallback) onChangeCallback(cb.checked);
            cb.dispatchEvent(new Event('change', { bubbles: true }));
        };

        cb.addEventListener('change', () => {
            updateUI();
        });
    }

    /**
     * Gestión de toggles de alertas físicas.
     */
    initAlertToggles() {
        const toggles = [
            { id: 'screenAlertsToggle', badgeId: 'btnToggleScreenAlerts', storage: 'talkme_screen_alerts', state: 'isScreenAlertEnabled' },
            { id: 'flashlightToggleAlt', badgeId: 'btnToggleFlashlightAlerts', storage: 'talkme_flashlight_alerts', state: 'isFlashlightEnabled' },
            { id: 'vibrationToggleAlt', badgeId: 'btnToggleVibrationAlerts', storage: 'talkme_vibration_alerts', state: 'isVibrationEnabled' }
        ];

        toggles.forEach(t => {
            const el = document.getElementById(t.id);
            if (el) {
                const saved = localStorage.getItem(t.storage);
                const isActive = saved !== null ? saved === 'true' : (t.id === 'flashlightToggleAlt' ? false : true);
                el.checked = isActive;
                this.audio.setState({ [t.state]: isActive });

                this.bindTriggerStyleBadge(t.badgeId, t.id, async (isChecked) => {
                    if (t.id === 'flashlightToggleAlt' && isChecked) {
                        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                                         (window.innerWidth <= 1024 && 'ontouchstart' in window);
                        if (isMobile) {
                            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                                try {
                                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                                    if (stream) {
                                        stream.getTracks().forEach(track => track.stop());
                                    }
                                } catch (err) {
                                    console.warn("🔦 [ALERTS] Permiso de cámara denegado:", err);
                                    el.checked = false;
                                    this.bindTriggerStyleBadge(t.badgeId, t.id);
                                    this.audio.setState({ [t.state]: false });
                                    localStorage.setItem(t.storage, 'false');
                                    
                                    const errorMsg = (window.localesData?.alerts?.flashlight_permission_denied) || 
                                                     "No se pudo activar la linterna. Por favor, activa los permisos de cámara en los ajustes de tu dispositivo.";
                                    if (this.showGlobalToast) {
                                        this.showGlobalToast(errorMsg, "error", 6000);
                                    }
                                    return;
                                }
                            } else {
                                console.warn("🔦 [ALERTS] navigator.mediaDevices o getUserMedia no disponibles.");
                                el.checked = false;
                                this.bindTriggerStyleBadge(t.badgeId, t.id);
                                this.audio.setState({ [t.state]: false });
                                localStorage.setItem(t.storage, 'false');
                                return;
                            }
                        }
                    }

                    this.audio.setState({ [t.state]: isChecked });
                    localStorage.setItem(t.storage, isChecked);
                    const toastMsg = t.id.includes('screen') ? (isChecked ? 'Alertas de Pantalla ON' : 'Alertas de Pantalla OFF') :
                                   t.id.includes('flashlight') ? (isChecked ? 'Linterna ON' : 'Linterna OFF') :
                                   (isChecked ? 'Vibración ON' : 'Vibración OFF');
                    if (this.showGlobalToast) this.showGlobalToast(toastMsg, 'info', 1500);
                });
            }
        });
    }

    /**
     * Inicialización de selectores de tema.
     */
    initThemeSwitchers() {
        document.querySelectorAll('.theme-btn, .theme-btn-mod').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyTheme(btn.dataset.theme);
                this.showGlobalSaveBtn();
            });
        });
    }

    /**
     * Aplicación dinámica de tema.
     */
    applyTheme(theme) {
        this.audio.setState({ currentTheme: theme });
        localStorage.setItem('talkme_theme', theme);
        document.body.setAttribute('data-theme', theme);

        document.querySelectorAll('.theme-btn, .theme-btn-mod').forEach(b => {
            b.style.removeProperty('background');
            b.style.removeProperty('border-color');
            b.style.removeProperty('color');
            b.classList.toggle('active', b.dataset.theme === theme);
        });

        // Cargar paleta ADN específica de este tema (o heredar la actual/global)
        const currentPrimary = this.currentDNA?.primary || localStorage.getItem('talkme_dna_primary') || '#7b68ee';
        const currentSecondary = this.currentDNA?.secondary || localStorage.getItem('talkme_dna_secondary') || '#ff6b35';

        // Si existe un color primario explícito para el tema se usa; si no, hereda currentPrimary
        const themePrimary = localStorage.getItem(`talkme_dna_primary_${theme}`) || currentPrimary;

        this.currentDNA = {
            bgPrimary: localStorage.getItem(`talkme_dna_bg_primary_${theme}`) || (theme === 'light' ? '#F8FAFC' : '#0a0a0f'),
            bgSecondary: localStorage.getItem(`talkme_dna_bg_secondary_${theme}`) || (theme === 'light' ? '#FFFFFF' : '#151522'),
            primary: themePrimary,
            secondary: localStorage.getItem(`talkme_dna_secondary_${theme}`) || currentSecondary,
            text: localStorage.getItem(`talkme_dna_text_${theme}`) || (theme === 'light' ? '#1E293B' : '#ffffff'),
            textSecondary: localStorage.getItem(`talkme_dna_text_secondary_${theme}`) || (theme === 'light' ? '#475569' : '#aaaaaa')
        };

        this.applyColorDNA();
    }

    /**
     * [v46.4.87] Gestión de Paleta DNA.
     */
    initDNAPalette() {
        const theme = localStorage.getItem('talkme_theme') || 'dark';

        const savedPrimary = localStorage.getItem(`talkme_dna_primary_${theme}`) || localStorage.getItem('talkme_dna_primary') || '#7b68ee';
        const savedSecondary = localStorage.getItem(`talkme_dna_secondary_${theme}`) || localStorage.getItem('talkme_dna_secondary') || '#ff6b35';

        this.currentDNA = {
            bgPrimary: localStorage.getItem(`talkme_dna_bg_primary_${theme}`) || localStorage.getItem('talkme_dna_bg_primary') || (theme === 'light' ? '#F8FAFC' : '#0a0a0f'),
            bgSecondary: localStorage.getItem(`talkme_dna_bg_secondary_${theme}`) || localStorage.getItem('talkme_dna_bg_secondary') || (theme === 'light' ? '#FFFFFF' : '#151522'),
            primary: savedPrimary,
            secondary: savedSecondary,
            text: localStorage.getItem(`talkme_dna_text_${theme}`) || localStorage.getItem('talkme_dna_text') || (theme === 'light' ? '#1E293B' : '#ffffff'),
            textSecondary: localStorage.getItem(`talkme_dna_text_secondary_${theme}`) || localStorage.getItem('talkme_dna_text_secondary') || (theme === 'light' ? '#475569' : '#aaaaaa')
        };

        this.applyColorDNA();

        const config = [
            { id: 'colorPickerPrimaryBG', key: 'bgPrimary', storage: 'talkme_dna_bg_primary' },
            { id: 'colorPickerSecondaryBG', key: 'bgSecondary', storage: 'talkme_dna_bg_secondary' },
            { id: 'colorPickerAccentPrimary', key: 'primary', storage: 'talkme_dna_primary' },
            { id: 'colorPickerAccentSecondary', key: 'secondary', storage: 'talkme_dna_secondary' },
            { id: 'colorPickerTextPrimary', key: 'text', storage: 'talkme_dna_text' },
            { id: 'colorPickerTextSecondary', key: 'textSecondary', storage: 'talkme_dna_text_secondary' }
        ];

        config.forEach(item => {
            const el = document.getElementById(item.id);
            if (el) {
                el.oninput = (e) => {
                    const currentTheme = localStorage.getItem('talkme_theme') || 'dark';
                    this.currentDNA[item.key] = e.target.value;
                    localStorage.setItem(`${item.storage}_${currentTheme}`, e.target.value);
                    localStorage.setItem(item.storage, e.target.value);
                    this.applyColorDNA();
                    this.showGlobalSaveBtn();
                };
            }
        });

        const btnReset = document.getElementById('btnResetDNA');
        if (btnReset) {
            btnReset.onclick = () => {
                const isMaster = !!this.audio.get('isMaster');

                if (isMaster) {
                    // === MASTER: RESTABLECER A VALORES DE FÁBRICA ORIGINALES DE LA APP ===
                    this.currentDNA = {
                        bgPrimary: '#0a0a0f', bgSecondary: '#151522',
                        primary: '#7b68ee', secondary: '#ff6b35',
                        text: '#ffffff', textSecondary: '#aaaaaa'
                    };

                    // Limpiar sobreescrituras en localStorage
                    config.forEach(item => {
                        localStorage.removeItem(`${item.storage}_dark`);
                        localStorage.removeItem(`${item.storage}_light`);
                        localStorage.removeItem(item.storage);
                    });
                    localStorage.removeItem('talkme_font_percent');
                    localStorage.removeItem('talkme_font_weight');

                    // 1. Aplicar tema oscuro nativo
                    this.applyTheme('dark');

                    // 2. Sincronizar inputs de color
                    config.forEach(item => {
                        const el = document.getElementById(item.id);
                        if (el) el.value = this.currentDNA[item.key];
                    });
                    this.applyColorDNA();

                    // 3. Restablecer tipografía a valores originales de fábrica (100% y 400)
                    this.audio.setState({ fontSizePercent: 100, fontWeight: 400 });
                    this.updateChatFontSize();
                    if (this.fontSizeKnobCtrl) this.fontSizeKnobCtrl.setValue(100);
                    if (this.fontWeightKnobCtrl) this.fontWeightKnobCtrl.setValue(400);

                    // Activar el botón Guardar como Global para que el Master pueda persistir el reseteo
                    this.showGlobalSaveBtn();

                    if (this.showCatFeedback) {
                        this.showCatFeedback('Valores de fábrica originales restaurados', 'info');
                    }
                } else {
                    // === USUARIO NORMAL: RESTABLECER A LA PLANTILLA GUARDADA POR EL MASTER ===
                    let template = this.masterGlobalSettings;
                    if (!template) {
                        try {
                            const cached = localStorage.getItem('talkme_master_global_settings');
                            if (cached) template = JSON.parse(cached);
                        } catch (e) {}
                    }

                    // Fallback Murphy si no hubiera plantilla del Master aún
                    if (!template) {
                        template = {
                            theme: 'dark',
                            dna: {
                                bgPrimary: '#0a0a0f', bgSecondary: '#151522',
                                primary: '#7b68ee', secondary: '#ff6b35',
                                text: '#ffffff', textSecondary: '#aaaaaa'
                            },
                            typography: { fontSize: 100, fontWeight: 400 }
                        };
                    }

                    // Limpiar personalizaciones temporales de la sesión del usuario
                    config.forEach(item => {
                        localStorage.removeItem(`${item.storage}_dark`);
                        localStorage.removeItem(`${item.storage}_light`);
                        localStorage.removeItem(item.storage);
                    });
                    localStorage.removeItem('talkme_font_percent');
                    localStorage.removeItem('talkme_font_weight');

                    // Aplicar plantilla del Master
                    this.applyMasterGlobalTemplate(template);

                    if (this.showCatFeedback) {
                        this.showCatFeedback('Ajustes restaurados a la configuración del Master', 'success');
                    }
                }
            };
        }

        const btnSaveGlobal = document.getElementById('btnSaveGlobalDNA');
        if (btnSaveGlobal) {
            btnSaveGlobal.onclick = () => {
                const settings = {
                    dna: this.currentDNA,
                    theme: this.audio.get('currentTheme'),
                    typography: {
                        fontSize: parseInt(localStorage.getItem('talkme_font_percent') || '100'),
                        fontWeight: parseInt(localStorage.getItem('talkme_font_weight') || '400')
                    }
                };
                const onResponse = (res) => {
                    if (res && res.success) {
                        if (this.showCatFeedback) this.showCatFeedback('Interfaz guardada como predeterminada global', 'success');
                        btnSaveGlobal.style.display = 'none';
                    }
                };

                if (typeof window.safeEmit === 'function') {
                    window.safeEmit('save-global-settings', { settings: settings }, onResponse);
                } else {
                    const socketRef = this.socket || window.socket;
                    if (socketRef && typeof socketRef.emit === 'function') {
                        socketRef.emit('save-global-settings', { settings: settings }, onResponse);
                    }
                }
            };
        }
    }

    applyColorDNA() {
        const root = document.documentElement;
        const body = document.body;
        const dna = this.currentDNA;

        const setProp = (name, val) => {
            root.style.setProperty(name, val);
            if (body) body.style.setProperty(name, val);
        };

        setProp('--primary-bg', dna.bgPrimary);
        setProp('--secondary-bg', dna.bgSecondary);
        setProp('--accent-primary', dna.primary);
        setProp('--accent-secondary', dna.secondary);
        setProp('--accent-blue', dna.primary);
        setProp('--accent-orange', dna.secondary);
        setProp('--text-primary', dna.text);
        setProp('--text-secondary', dna.textSecondary);

        // Limpiar cualquier estilo inline residual en botones de tema para permitir que las reglas CSS gobiernen los estados
        document.querySelectorAll('.theme-btn, .theme-btn-mod').forEach(b => {
            b.style.removeProperty('background');
            b.style.removeProperty('border-color');
            b.style.removeProperty('color');
            b.style.removeProperty('font-weight');
        });

        // [Murphy-proof] Forzar inline el color primario dinámico al botón de tema activo,
        // para garantizar que siempre refleje el valor actual de --accent-primary
        // independientemente de cascadas CSS o especificidad.
        const currentTheme = document.body.getAttribute('data-theme') || localStorage.getItem('talkme_theme') || 'dark';
        document.querySelectorAll('.theme-btn-mod.active').forEach(b => {
            try {
                b.style.setProperty('background', dna.primary, 'important');
                b.style.setProperty('border-color', dna.primary, 'important');
                b.style.setProperty('color', currentTheme === 'dark' ? '#000000' : '#ffffff', 'important');
                b.style.setProperty('font-weight', '700', 'important');
            } catch (e) { /* fallback: CSS var(--accent-primary) se encarga */ }
        });

        const pickers = {
            'colorPickerPrimaryBG': dna.bgPrimary,
            'colorPickerSecondaryBG': dna.bgSecondary,
            'colorPickerAccentPrimary': dna.primary,
            'colorPickerAccentSecondary': dna.secondary,
            'colorPickerTextPrimary': dna.text,
            'colorPickerTextSecondary': dna.textSecondary
        };

        Object.keys(pickers).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = pickers[id];
        });
    }

    /**
     * Detección de Hardware y actualización de UI.
     */
    async initHardwareStatus() {
        if (!Hardware.detectCapabilities) return;
        const caps = await Hardware.detectCapabilities();
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        (window.innerWidth <= 1024 && 'ontouchstart' in window);

        // Escritorio o dispositivo sin linterna física detectable:
        if (!isMobile || !caps.flashlight) {
            const flashlightToggleAlt = document.getElementById('flashlightToggleAlt');
            if (flashlightToggleAlt) {
                flashlightToggleAlt.disabled = true;
                flashlightToggleAlt.checked = false;
                flashlightToggleAlt.dispatchEvent(new Event('change', { bubbles: true }));
                const parent = flashlightToggleAlt.closest('.compact-toggle');
                if (parent) parent.classList.add('disabled-capability');
            }
        }

        // Escritorio: ni vibración
        if (!isMobile) {
            const vibrationToggleAlt = document.getElementById('vibrationToggleAlt');
            if (vibrationToggleAlt) {
                vibrationToggleAlt.disabled = true;
                vibrationToggleAlt.checked = false;
                localStorage.setItem('talkme_vibration_alerts', 'false');
                if (this.audio) this.audio.setState({ isVibrationEnabled: false });
                vibrationToggleAlt.dispatchEvent(new Event('change', { bubbles: true }));
                const parent = vibrationToggleAlt.closest('.compact-toggle');
                if (parent) parent.classList.add('disabled-capability');
            }
        }

        // iOS (iPhone/iPad/iPod): Safari no soporta Vibration API nativa.
        // Mantenemos deshabilitada la vibración, pero restauramos la edición de la linterna.
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isIOS) {
            const vibrationToggleAlt = document.getElementById('vibrationToggleAlt');
            if (vibrationToggleAlt) {
                vibrationToggleAlt.disabled = true;
                vibrationToggleAlt.checked = false;
                localStorage.setItem('talkme_vibration_alerts', 'false');
                if (this.audio) this.audio.setState({ isVibrationEnabled: false });
                vibrationToggleAlt.dispatchEvent(new Event('change', { bubbles: true }));
                const parent = vibrationToggleAlt.closest('.compact-toggle');
                if (parent) parent.classList.add('disabled-capability');
            }
        }
    }

    /**
     * [v60.Elite] Auditoría de Veracidad Hardware.
     * Comprueba si el dispositivo seleccionado en la UI coincide con el track activo.
     */
    async verifyHardwareIntegrity() {
        const stream = this.audio.get('mediaStream') || window.mediaStream;
        const audioSelect = this.dom.get('audio', 'deviceSelect') || document.getElementById('audioDeviceSelect');
        
        if (!stream || !audioSelect) return;

        const activeTrack = stream.getAudioTracks()[0];
        if (!activeTrack) return;

        const settings = activeTrack.getSettings();
        const physicalDeviceId = settings.deviceId;
        const uiSelectedId = audioSelect.value;
        const preferredId = localStorage.getItem('talkme_preferred_audio_input');

        // [v60.Elite] Lógica de Tolerancia: Si el hardware real ya es el preferido o el seleccionado, no tocar nada.
        const isCorrect = (physicalDeviceId === uiSelectedId) || (physicalDeviceId === preferredId);
        
        if (!isCorrect && physicalDeviceId) {
            console.warn('⚠️ [HW-AUDIT] Discrepancia detectada. Sincronizando UI con realidad física...');
            
            // Solo forzamos cambio si el usuario explícitamente tiene una selección incoherente
            const optionExists = Array.from(audioSelect.options).some(opt => opt.value === physicalDeviceId);
            if (optionExists) {
                audioSelect.value = physicalDeviceId;
                this.audio.setState({ deviceId: physicalDeviceId });
                if (window.updateChannelSelectors) window.updateChannelSelectors('input', physicalDeviceId);
            }
        }
    }

    /**
     * [v59.43] Sincronización Typográfica Global.
     */
    updateChatFontSize() {
        const percent = this.audio.get('fontSizePercent') || 100;
        const weight = this.audio.get('fontWeight') || 600;
        const baseSize = 36;
        const finalSize = (baseSize * percent) / 100;
        
        document.documentElement.style.setProperty('--chat-font-size', finalSize + 'px');
        document.documentElement.style.setProperty('--chat-font-weight', weight);

        // [v60.1] Actualizar etiquetas numéricas en la UI
        const sizeLabel = document.getElementById('fontSizeKnobValue');
        const weightLabel = document.getElementById('fontWeightKnobValue');
        if (sizeLabel) sizeLabel.textContent = percent + '%';
        if (weightLabel) weightLabel.textContent = weight;

        const preview = document.getElementById('typographyPreview');
        if (preview) {
            preview.style.fontSize = finalSize + 'px';
            preview.style.fontWeight = weight;
        }
    }

    initTypographyKnobs() {
        if (window._typographyKnobsInitialized) return;
        window._typographyKnobsInitialized = true;

        const fontSizeKnob = document.getElementById('fontSizeKnob');
        const fontWeightKnob = document.getElementById('fontWeightKnob');

        if (fontSizeKnob) {
            this.fontSizeKnobCtrl = new KnobController(fontSizeKnob, 40, 200, this.audio.get('fontSizePercent'), (val) => {
                this.audio.setState({ fontSizePercent: val });
                localStorage.setItem('talkme_font_percent', val);
                this.updateChatFontSize();
            }, false);
        }

        if (fontWeightKnob) {
            this.fontWeightKnobCtrl = new KnobController(fontWeightKnob, 100, 900, this.audio.get('fontWeight'), (val) => {
                this.audio.setState({ fontWeight: val });
                localStorage.setItem('talkme_font_weight', val);
                this.updateChatFontSize();
            }, true);
        }

        // Aplicar valores iniciales al arrancar
        this.updateChatFontSize();
    }

    /**
     * Restauración centralizada de preferencias.
     */
    restoreUserPreferences() {
        // Modo de emisión
        const savedMsgMode = localStorage.getItem('talkme_msg_mode') || 'both';
        const msgSelect = document.getElementById('messagesModeSelectAlt');
        if (msgSelect) msgSelect.value = savedMsgMode;
        this.audio.setState({ transcriptionOnly: (savedMsgMode === 'text') });

        // Autoplay recepción
        const savedRecMode = localStorage.getItem('talkme_reception_mode') || 'auto';
        const recSelect = document.getElementById('receptionModeSelectAlt');
        if (recSelect) recSelect.value = savedRecMode;
        this.audio.setState({ autoPlayRealtime: (savedRecMode === 'auto') });

        // [v60.Elite] Dispositivo de Audio e Input Channel
        const savedAudioId = localStorage.getItem('talkme_preferred_audio_input');
        if (savedAudioId) {
            this.audio.setState({ audioDeviceId: savedAudioId });
            const audioSelect = document.getElementById('audioDeviceSelect');
            if (audioSelect) audioSelect.value = savedAudioId;
        }
        
        const savedChannel = localStorage.getItem('talkme_preferred_audio_channel');
        if (savedChannel !== null) {
            this.audio.setState({ inputChannel: parseInt(savedChannel) });
        }

        // [Hermes TTS] Restaurar preferencias del usuario
        if (window.hermesTTS) {
            const toggle = document.getElementById('hermesToggle');
            if (toggle) toggle.checked = window.hermesTTS.readTextMessages;

            const modeSelect = document.getElementById('hermesModeSelect');
            if (modeSelect) {
                modeSelect.value = window.hermesTTS.readForeignAudio ? 'text_and_foreign_audio' : 'text_only';
            }

            const treatmentSelect = document.getElementById('hermesAudioTreatmentSelect');
            if (treatmentSelect) {
                treatmentSelect.value = window.hermesTTS.foreignAudioMode;
            }

            const genderSel = document.getElementById('hermesGenderSelect');
            if (genderSel) genderSel.value = window.hermesTTS.genderFilter;

            const rateRange = document.getElementById('hermesRateRange');
            const rateLabel = document.getElementById('hermesRateValueLabel');
            if (rateRange) {
                rateRange.value = window.hermesTTS.rate;
                if (rateLabel) rateLabel.textContent = `${window.hermesTTS.rate}x`;
            }

            this.populateHermesVoices();
            this.syncHermesUIState();
        }
    }

    /**
     * Sincroniza visualmente el badge, checkbox y visibilidad de subopciones de HermesTTS
     */
    syncHermesUIState() {
        if (!window.hermesTTS) return;
        const toggle = document.getElementById('hermesToggle');
        const badge = document.getElementById('btnToggleHermes');
        const subContainer = document.getElementById('hermesSettingsSubContainer');
        const treatmentRow = document.getElementById('hermesAudioTreatmentRow');
        const modeSelect = document.getElementById('hermesModeSelect');

        const isEnabled = !!window.hermesTTS.masterEnabled;
        if (toggle) toggle.checked = isEnabled;
        if (badge) {
            badge.classList.toggle('tgl-on', isEnabled);
            badge.classList.toggle('tgl-off', !isEnabled);
            badge.innerText = isEnabled ? 'ON' : 'OFF';
        }
        if (subContainer) {
            subContainer.style.display = isEnabled ? 'flex' : 'none';
        }
        if (treatmentRow) {
            const isForeignAudioEnabled = modeSelect && modeSelect.value === 'text_and_foreign_audio';
            treatmentRow.style.display = (isEnabled && isForeignAudioEnabled) ? 'flex' : 'none';
        }
    }

    /**
     * Inicializar y enlazar los controles de Hermes TTS de forma reactiva.
     */
    initHermesControls() {
        if (!window.hermesTTS) return;

        const toggle = document.getElementById('hermesToggle');
        const modeSelect = document.getElementById('hermesModeSelect');
        const treatmentSelect = document.getElementById('hermesAudioTreatmentSelect');
        const genderSel = document.getElementById('hermesGenderSelect');
        const voiceSel = document.getElementById('hermesVoiceSelect');
        const rateRange = document.getElementById('hermesRateRange');
        const rateLabel = document.getElementById('hermesRateValueLabel');

        // Inicializar los valores de los inputs con el estado real del motor HermesTTS
        if (toggle) toggle.checked = window.hermesTTS.masterEnabled;
        if (modeSelect) modeSelect.value = window.hermesTTS.readForeignAudio ? 'text_and_foreign_audio' : 'text_only';
        if (treatmentSelect) treatmentSelect.value = window.hermesTTS.foreignAudioMode;
        if (genderSel) genderSel.value = window.hermesTTS.genderFilter;
        if (rateRange) {
            rateRange.value = window.hermesTTS.rate;
            if (rateLabel) rateLabel.textContent = `${window.hermesTTS.rate}x`;
        }

        const updateVisibility = () => {
            this.syncHermesUIState();
            this.populateHermesVoices();
        };

        if (toggle) {
            this.bindTriggerStyleBadge('btnToggleHermes', 'hermesToggle', (isEnabled) => {
                window.hermesTTS.masterEnabled = isEnabled;
                if (isEnabled && typeof window.hermesTTS.unlock === 'function') {
                    // ⚡ [v60.HERMES-INSTANT] Desbloqueo síncrono aprovechando el User Gesture del clic
                    try { window.hermesTTS.unlock(); } catch (err) { console.warn('⚠️ [HermesTTS] Error en unlock:', err); }
                }
                updateVisibility();
            });
        }

        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                window.hermesTTS.readForeignAudio = (val === 'text_and_foreign_audio');
                updateVisibility();
            });
        }

        if (treatmentSelect) {
            treatmentSelect.addEventListener('change', (e) => {
                const val = e.target.value;
                window.hermesTTS.foreignAudioMode = val;
            });
        }

        if (genderSel) {
            genderSel.addEventListener('change', (e) => {
                const val = e.target.value;
                window.hermesTTS.genderFilter = val;
                this.populateHermesVoices();
            });
        }

        if (voiceSel) {
            voiceSel.addEventListener('change', (e) => {
                const val = e.target.value;
                window.hermesTTS.voiceUri = val;
            });
        }

        if (rateRange) {
            rateRange.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                window.hermesTTS.rate = val;
                if (rateLabel) rateLabel.textContent = `${val}x`;
            });
        }

        // Carga asíncrona de voces en Chromium/Electron y disparo síncrono para Firefox
        this.populateHermesVoices();
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = () => {
                console.log('🗣️ [HermesTTS] Voces cargadas o actualizadas asíncronamente.');
                this.populateHermesVoices();
            };
        }

        // Ejecutar primer chequeo de visibilidad e inicialización de voces
        // Escuchar cambios de idioma para restaurar preferencias y repoblar voces
        window.addEventListener('language-changed', () => {
            this.restoreUserPreferences();
            this.populateHermesVoices();
        });

        // Ejecutar primer chequeo de visibilidad e inicialización de voces
        updateVisibility();
    }

    /**
     * Poblar la lista de voces disponibles según el idioma actual y filtros.
     */
    populateHermesVoices() {
        if (!window.hermesTTS || !window.speechSynthesis) return;

        const voiceSel = document.getElementById('hermesVoiceSelect');
        if (!voiceSel) return;

        const currentLang = window.currentLang || 'es';
        const baseLang = currentLang.split('-')[0].toLowerCase();
        
        // Obtener traducciones activas desde el objeto global hermesDict
        const t = (window.hermesDict && window.hermesDict[currentLang]) 
            ? window.hermesDict[currentLang] 
            : (window.hermesDict ? window.hermesDict['en'] : { 
                auto: 'Device Default (Automatic)', 
                warning_no_voices: '⚠️ No voices of the selected gender', 
                voice_female: 'Female', 
                voice_male: 'Male' 
            });

        // Limpiar dropdown manteniendo la opción automática localizada
        voiceSel.innerHTML = `<option value="auto">${t.auto}</option>`;

        // Voces totales del idioma sin filtro de género para determinar si hay soporte en absoluto
        const allLangVoices = window.hermesTTS.synth.getVoices().filter(voice => {
            return voice.lang.split('-')[0].toLowerCase() === baseLang;
        });

        if (allLangVoices.length === 0) {
            // Ocultar sección si no hay voces en absoluto para este idioma
            const voiceRow = document.getElementById('hermesVoiceRow');
            if (voiceRow) voiceRow.style.display = 'none';
            return;
        }

        // Mostrar la fila si tiene contenido en el idioma
        const voiceRow = document.getElementById('hermesVoiceRow');
        const toggle = document.getElementById('hermesToggle');
        if (voiceRow && toggle && toggle.checked) {
            voiceRow.style.display = 'flex';
        }

        const voices = window.hermesTTS.getCompatibleVoices(currentLang);
        const isAuto = window.hermesTTS.voiceUri === 'auto';

        if (voices.length === 0) {
            // Si el filtro de género nos dejó sin voces, mostramos un mensaje informativo
            const optWarning = document.createElement('option');
            optWarning.value = 'none';
            optWarning.disabled = true;
            
            const warningText = t.warning_no_voices || '⚠️ No voices of the selected gender';
            optWarning.textContent = warningText;
            
            if (!isAuto) {
                optWarning.selected = true;
            } else {
                const optAuto = voiceSel.querySelector('option[value="auto"]');
                if (optAuto) optAuto.selected = true;
            }
            
            voiceSel.appendChild(optWarning);

            // Listamos de todos modos las voces del otro género para que el usuario pueda ver qué hay
            allLangVoices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.voiceURI;
                
                let label = voice.name;
                const gender = window.hermesTTS._getVoiceGender(voice.name);
                if (gender === 'female') label += ` (${t.voice_female})`;
                else if (gender === 'male') label += ` (${t.voice_male})`;

                option.textContent = label;
                if (voice.voiceURI === window.hermesTTS.voiceUri) {
                    option.selected = true;
                    optWarning.selected = false;
                }
                voiceSel.appendChild(option);
            });
        } else {
            if (isAuto) {
                const optAuto = voiceSel.querySelector('option[value="auto"]');
                if (optAuto) optAuto.selected = true;
            }
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.voiceURI;
                
                let label = voice.name;
                const gender = window.hermesTTS._getVoiceGender(voice.name);
                if (gender === 'female') label += ` (${t.voice_female})`;
                else if (gender === 'male') label += ` (${t.voice_male})`;

                option.textContent = label;
                if (voice.voiceURI === window.hermesTTS.voiceUri) {
                    option.selected = true;
                }
                voiceSel.appendChild(option);
            });
        }
    }

    showGlobalSaveBtn() {
        if (this.audio.get('isMaster')) {
            const btn = document.getElementById('btnSaveGlobalDNA');
            if (btn) btn.style.display = 'flex';
        }
    }



    /**
     * Carga y renderiza de forma dinámica la guía de usuario en el idioma activo.
     * Patrón "Stale-While-Revalidate" con Blindaje Murphy Offline-First:
     * Nivel 1: Lectura inmediata (0ms) desde caché en localStorage o paquete local empaquetado.
     * Nivel 2: Verificación asíncrona en segundo plano hacia https://www.talk-me.app/locales/guide/{lang}.json (3s timeout).
     * Nivel 3: Validación de integridad JSON y actualización suave de interfaz sin parpadeos.
     */
    async loadAndRenderGuide() {
        const container = document.getElementById('guideDynamicContainer');
        if (!container) return;

        const lang = (window.currentLang || 'es').toLowerCase();

        // ── NIVEL 1: Carga inteligente con validación de versión empaquetada ──
        const cacheKey = `talkme_guide_cache_${lang}`;
        const CURRENT_PACKAGED_VERSION = '60.2.0';
        let cachedGuide = null;
        try {
            const rawCached = localStorage.getItem(cacheKey);
            if (rawCached) {
                const parsed = JSON.parse(rawCached);
                if (parsed && Array.isArray(parsed.cards) && parsed.guide_version === CURRENT_PACKAGED_VERSION) {
                    cachedGuide = parsed;
                }
            }
        } catch (e) {}

        // Si tenemos versión en caché válida, renderizarla de inmediato
        if (cachedGuide) {
            this.renderGuideCards(cachedGuide, container, lang);
        } else {
            container.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.9rem; text-align: center; padding: 20px;">Cargando guía...</div>';
            try {
                const res = await fetch(`./locales/guide/${lang}.json?_v=${Date.now()}`);
                if (!res.ok) throw new Error('Local guide not found');
                const guideData = await res.json();
                this.renderGuideCards(guideData, container, lang);
                try { localStorage.setItem(cacheKey, JSON.stringify(guideData)); } catch (e) {}
            } catch (err) {
                try {
                    const resEs = await fetch(`./locales/guide/es.json?_v=${Date.now()}`);
                    const guideDataEs = await resEs.json();
                    this.renderGuideCards(guideDataEs, container, 'es');
                } catch (fallbackErr) {
                    container.innerHTML = '<div style="color: var(--accent-secondary, #ff6b35); font-size: 0.9rem; text-align: center; padding: 20px;">Error loading guide.</div>';
                }
            }
        }

        // ── NIVEL 2: Sondeo en segundo plano hacia el servidor central (FTP) ──
        const remoteUrl = `https://www.talk-me.app/locales/guide/${lang}.json?_t=${Date.now()}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        fetch(remoteUrl, { cache: 'no-store', signal: controller.signal })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(remoteData => {
                clearTimeout(timeoutId);
                // ── NIVEL 3: Validación de versión e integridad (Sin degradar a remoto desactualizado) ──
                if (remoteData && Array.isArray(remoteData.cards) && remoteData.cards.length > 0) {
                    if (remoteData.guide_version && remoteData.guide_version < CURRENT_PACKAGED_VERSION) {
                        return; // Servidor remoto aún no subido: no sobreescribir la copia local más reciente
                    }
                    const remoteStr = JSON.stringify(remoteData);
                    const currentStr = localStorage.getItem(cacheKey);
                    if (remoteStr !== currentStr) {
                        try { localStorage.setItem(cacheKey, remoteStr); } catch (e) {}
                        if (container.dataset.renderedLang === lang) {
                            this.renderGuideCards(remoteData, container, lang);
                            console.log(`[SettingsUI] Guía (${lang}) actualizada desde repositorio central.`);
                        }
                    }
                }
            })
            .catch(err => {
                clearTimeout(timeoutId);
                // Silencio ante desconexión / modo avión
            });
    }

    /**
     * Renderiza las tarjetas de la guía en el contenedor de forma dinámica y completa.
     */
    renderGuideCards(guideData, container, lang) {
        container.innerHTML = '';
        container.dataset.renderedLang = lang;

        const cardsList = guideData.cards || [];
        const searchPlaceholder = guideData.search_placeholder || 'Buscar en la guía...';
        const guideTitle = guideData.guide_title || 'Guía de Usuario';
        const net = guideData.network_diagram || {};
        const importantLabel = (guideData.common && guideData.common.important) ? guideData.common.important : 'Importante:';

        // Actualizar título y buscador
        const lblTitle = document.getElementById('lblUiGuideTitle');
        if (lblTitle) lblTitle.textContent = guideTitle;
        const filterInput = document.getElementById('appGuideFilterInput');
        if (filterInput) filterInput.placeholder = searchPlaceholder;

        const svgs = {
            audio_modes: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor"></path>
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" stroke="var(--accent-primary)"></path>
                <line x1="12" y1="18" x2="12" y2="23" stroke="var(--accent-primary)"></line>
                <line x1="8" y1="23" x2="16" y2="23" stroke="var(--accent-secondary)"></line>
            </svg>`,
            users: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="var(--accent-primary)"></path>
                <circle cx="9" cy="7" r="4" stroke="currentColor"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="var(--accent-secondary)"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="var(--accent-secondary)"></path>
            </svg>`,
            chat_transmission: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="var(--accent-primary)"></path>
                <path d="M8 10h8" stroke="currentColor"></path>
                <path d="M8 6h8" stroke="var(--accent-secondary)"></path>
            </svg>`,
            audio_hardware: `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="currentColor"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" stroke="var(--accent-primary)" fill="color-mix(in srgb, var(--accent-primary) 15%, transparent)"></path>
                <circle cx="12" cy="12" r="2" fill="var(--accent-secondary)" stroke="var(--accent-secondary)"></circle>
            </svg>`,
            language_transcription: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 8l6 6" stroke="var(--accent-primary)"></path>
                <path d="M4 14l6-6 2-3" stroke="var(--accent-primary)"></path>
                <path d="M2 5h12" stroke="currentColor"></path>
                <path d="M7 2h1" stroke="currentColor"></path>
                <path d="M22 22l-5-10-5 10" stroke="var(--accent-secondary)"></path>
                <path d="M14 18h6" stroke="var(--accent-secondary)"></path>
            </svg>`,
            babel_translation: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="var(--accent-primary)"></path>
                <path d="M2 12h20" stroke="currentColor"></path>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="var(--accent-secondary)"></path>
            </svg>`,
            messages_flow: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor"></line>
                <line x1="8" y1="12" x2="21" y2="12" stroke="var(--accent-primary)"></line>
                <line x1="8" y1="18" x2="21" y2="18" stroke="var(--accent-secondary)"></line>
                <line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" stroke-width="3"></line>
                <line x1="3" y1="12" x2="3.01" y2="12" stroke="var(--accent-primary)" stroke-width="3"></line>
                <line x1="3" y1="18" x2="3.01" y2="18" stroke="var(--accent-secondary)" stroke-width="3"></line>
            </svg>`,
            hermes_tts: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" stroke="currentColor" fill="none"></polygon>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="var(--accent-secondary)"></path>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="var(--accent-primary)"></path>
            </svg>`,
            visual_haptic_alerts: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="var(--accent-primary)"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="var(--accent-secondary)"></path>
            </svg>`,
            triggers: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9z" stroke="var(--accent-primary)" fill="none"></path>
                <path d="M12 5L6 13h7l-1 5 6-7H12z" stroke="currentColor" stroke-width="1.5"></path>
                <circle cx="13" cy="11" r="2" fill="var(--accent-secondary)" stroke="var(--accent-secondary)"></circle>
            </svg>`,
            interface_customization: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.0331 19.1745 5.09903 19.4318 5.02324 19.6781L4.85507 20.2246C4.6644 20.8443 5.1764 21.4398 5.82397 21.3535L6.96911 21.2008C7.20235 21.1697 7.4384 21.2618 7.57945 21.4485C8.86872 21.8028 10.4075 22 12 22Z" stroke="var(--accent-primary)"></path>
                <circle cx="7.5" cy="10.5" r="1.5" fill="currentColor" stroke="currentColor"></circle>
                <circle cx="11.5" cy="7.5" r="1.5" fill="var(--accent-secondary)" stroke="var(--accent-secondary)"></circle>
                <circle cx="16.5" cy="9.5" r="1.5" fill="var(--accent-primary)" stroke="var(--accent-primary)"></circle>
            </svg>`,
            network_best_practices: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" stroke="currentColor"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" stroke="var(--accent-primary)"></rect>
                <line x1="6" y1="10" x2="6" y2="14" stroke="var(--accent-secondary)"></line>
                <line x1="18" y1="10" x2="18" y2="14" stroke="var(--accent-secondary)"></line>
            </svg>`,
            data_sovereignty: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="var(--accent-primary)" fill="color-mix(in srgb, var(--accent-primary) 10%, transparent)"></path>
                <rect x="9" y="11" width="6" height="5" rx="1" stroke="currentColor"></rect>
                <path d="M10 11V9a2 2 0 1 1 4 0v2" stroke="var(--accent-secondary)"></path>
            </svg>`
        };

        cardsList.forEach((card) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'guide-card';
            cardEl.style.cssText = 'background: rgba(255, 255, 255, 0.01); border: 1px solid color-mix(in srgb, var(--accent-primary) 15%, transparent); border-radius: 12px; padding: 18px; display: flex; gap: 16px; align-items: flex-start;';

            const iconBlock = document.createElement('div');
            iconBlock.style.cssText = 'flex-shrink: 0; background: rgba(0,0,0,0.25); padding: 10px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--text-primary);';
            
            // Blindaje Murphy: Si la sección remota trae su propio SVG inline (card.icon_svg), usarlo.
            // Si no, buscar en la biblioteca local svgs[card.id] o usar el fallback genérico.
            if (card.icon_svg && typeof card.icon_svg === 'string' && card.icon_svg.trim().startsWith('<svg')) {
                iconBlock.innerHTML = card.icon_svg;
            } else {
                iconBlock.innerHTML = svgs[card.id] || `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10" stroke="var(--accent-primary)"></circle>
                    <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8" stroke="var(--accent-secondary)" stroke-width="2.5"></line>
                </svg>`;
            }
            cardEl.appendChild(iconBlock);

            const contentBlock = document.createElement('div');
            contentBlock.style.cssText = 'flex: 1;';

            const titleEl = document.createElement('h3');
            titleEl.style.cssText = 'margin: 0 0 12px 0; font-size: 1rem; color: var(--text-primary); font-weight: 700; letter-spacing: 0.5px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px;';
            titleEl.textContent = card.title;
            contentBlock.appendChild(titleEl);

            const listEl = document.createElement('ul');
            listEl.style.cssText = 'list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px;';

            card.items.forEach((item, itemIdx) => {
                const liEl = document.createElement('li');

                const strongEl = document.createElement('strong');
                strongEl.style.cssText = 'color: var(--accent-primary); display: block; margin-bottom: 4px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;';
                strongEl.textContent = item.title;
                liEl.appendChild(strongEl);

                const textSpan = document.createElement('span');
                textSpan.style.cssText = 'color: var(--text-secondary); font-size: 0.82rem; line-height: 1.5;';
                textSpan.innerHTML = item.description;
                liEl.appendChild(textSpan);

                // For network best practices, inject diagram right after the first item
                if (card.id === 'network_best_practices' && itemIdx === 0) {
                    const diagDiv = document.createElement('div');
                    diagDiv.innerHTML = `<div class="network-diagram-container" style="width: 100%; background: var(--input-bg, rgba(0,0,0,0.25)); border-radius: 8px; padding: 15px; box-sizing: border-box; border: 1px solid color-mix(in srgb, var(--accent-primary) 15%, transparent); margin: 8px 0;">
                        <svg viewBox="0 0 940 440" width="100%" xmlns="http://www.w3.org/2000/svg" style="display: block; overflow: visible; height: auto;">
                            <defs>
                                <!-- Degradados -->
                                <linearGradient id="gradMaster" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="var(--accent-secondary, #FF6B35)" />
                                    <stop offset="100%" stop-color="#FF9E79" />
                                </linearGradient>
                                <linearGradient id="gradRouter" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="var(--accent-primary, #7B68EE)" />
                                    <stop offset="100%" stop-color="#B2A8FF" />
                                </linearGradient>
                                <linearGradient id="gradClients" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#4F5D75" />
                                    <stop offset="100%" stop-color="#8D99AE" />
                                </linearGradient>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="6" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>

                            <!-- Fondo de Cuadrícula Tecnológica -->
                            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1" />
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#grid)" rx="6" />

                            <!-- LÍNEAS DE CONEXIÓN -->
                            <!-- Línea de Internet WAN (Inyección a Router) -->
                            <path d="M 327 80 L 327 170" stroke="#7E7E8A" stroke-width="2" stroke-dasharray="4,4" />

                            <!-- Nube / Internet WAN (Más grande con texto más grande y OPCIONAL debajo) -->
                            <g transform="translate(255, -5)">
                                <!-- Icono de Nube SVG Simplificado y Elegante (Grande y Naranja) -->
                                <path d="M 15 60 a 25 25 0 0 1 30 -25 a 35 35 0 0 1 65 5 a 25 25 0 0 1 20 40 l -115 0 a 20 20 0 0 1 0 -20 z" fill="rgba(110, 110, 122, 0.15)" stroke="#7E7E8A" stroke-width="2.5" filter="url(#glow)" />
                                <text x="72" y="58" fill="var(--text-primary)" font-size="15" font-family="'Outfit', sans-serif" font-weight="extrabold" text-anchor="middle">${net.internet || 'INTERNET'}</text>
                                <text x="72" y="74" fill="var(--text-secondary)" font-size="12" font-family="'Outfit', sans-serif" font-weight="extrabold" text-anchor="middle">${net.optional || 'OPCIONAL'}</text>
                            </g>

                            <!-- Servidor Master -> Router (Ethernet) -->
                            <path d="M 140 190 L 310 190" stroke="var(--accent-secondary)" stroke-width="3" stroke-dasharray="0" />
                            <circle cx="225" cy="190" r="4" fill="var(--text-primary)" filter="url(#glow)" />
                            <text x="225" y="174" fill="var(--text-secondary)" font-size="12" font-family="'Outfit', sans-serif" font-weight="extrabold" text-anchor="middle">${net.ethernet_cable || 'ETHERNET CABLE RJ45'}</text>

                            <!-- Router -> Clientes Cable (PCs) - Salida limpia por la derecha evitando la nube -->
                            <path d="M 380 180 L 410 180 L 410 38 L 570 38" stroke="var(--accent-primary)" stroke-width="2.5" fill="none" />
                            <text x="490" y="28" fill="var(--accent-primary)" font-size="12" font-family="'Outfit', sans-serif" font-weight="extrabold" text-anchor="middle">${net.ethernet_red || 'Red Ethernet / Cable LAN'}</text>
                            
                            <path d="M 380 192 L 430 192 L 430 113 L 570 113" stroke="var(--accent-primary)" stroke-width="2.5" fill="none" />
                            <text x="490" y="103" fill="var(--accent-primary)" font-size="12" font-family="'Outfit', sans-serif" font-weight="extrabold" text-anchor="middle">${net.ethernet_red || 'Red Ethernet / Cable LAN'}</text>

                            <!-- Único texto identificador de la zona WIFI/WLAN en el aire -->
                            <text x="470" y="245" fill="var(--accent-primary)" font-size="14" font-family="'Outfit', sans-serif" font-weight="extrabold" text-anchor="middle" filter="url(#glow)">${net.wifi_label || 'WIFI / WLAN'}</text>

                            <!-- Ondas Wi-Fi decorativas de propagación en el aire -->
                            <path d="M 435 90 A 80 80 0 0 1 435 250" stroke="var(--accent-primary)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-dasharray="4,4" opacity="0.35" />
                            <path d="M 470 50 A 130 130 0 0 1 470 300" stroke="var(--accent-primary)" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-dasharray="4,4" opacity="0.2" />

                            <!-- Ondas Wi-Fi emitidas desde la antena derecha del router -->
                            <path d="M 382 135 A 15 15 0 0 1 382 155" stroke="var(--accent-primary)" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.8" />
                            <path d="M 387 130 A 22 22 0 0 1 387 160" stroke="var(--accent-primary)" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.6" />
                            <path d="M 392 125 A 29 29 0 0 1 392 165" stroke="var(--accent-primary)" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.4" />

                            <!-- Concentric Wi-Fi waves arriving at devices -->
                            <!-- Laptop -->
                            <path d="M 572 180 A 10 10 0 0 0 572 196" stroke="var(--accent-primary)" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.8" />
                            <path d="M 567 175 A 16 16 0 0 0 567 201" stroke="var(--accent-primary)" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.5" />
                            <!-- Tablet -->
                            <path d="M 582 262 A 10 10 0 0 0 582 278" stroke="var(--accent-primary)" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.8" />
                            <path d="M 577 257 A 16 16 0 0 0 577 283" stroke="var(--accent-primary)" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.5" />
                            <!-- Mobile -->
                            <path d="M 587 342 A 10 10 0 0 0 587 358" stroke="var(--accent-primary)" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.8" />
                            <path d="M 582 337 A 16 16 0 0 0 582 363" stroke="var(--accent-primary)" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.5" />

                            <!-- Router connections to WiFi devices -->
                            <path d="M 370 190 L 580 190" stroke="var(--accent-primary)" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5" />
                            <path d="M 370 190 L 590 270" stroke="var(--accent-primary)" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5" />
                            <path d="M 370 190 L 595 350" stroke="var(--accent-primary)" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5" />

                            <!-- NODOS DE EQUIPOS -->

                            <!-- 1. Servidor Master (PC Licenciado) -->
                            <g transform="translate(30, 120)">
                                <!-- Caja / CPU -->
                                <rect x="10" y="10" width="100" height="120" rx="8" fill="url(#gradMaster)" filter="url(#glow)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
                                <!-- Líneas decorativas servidor -->
                                <line x1="25" y1="35" x2="95" y2="35" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
                                <line x1="25" y1="55" x2="95" y2="55" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
                                <line x1="25" y1="75" x2="95" y2="75" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
                                <circle cx="85" cy="105" r="6" fill="#00ff88" filter="url(#glow)" /> <!-- Led de Estado Activo -->
                                <circle cx="65" cy="105" r="4" fill="#ffffff" opacity="0.8" />
                                <text x="60" y="154" fill="var(--text-primary)" font-size="15" font-family="'Outfit', sans-serif" font-weight="bold" text-anchor="middle">${net.master_server || 'SERVIDOR MASTER'}</text>
                                <text x="60" y="174" fill="var(--accent-secondary)" font-size="14" font-family="monospace" font-weight="bold" text-anchor="middle">192.168.1.150:3000</text>
                                <rect x="15" y="3" width="90" height="22" rx="4" fill="#111" stroke="var(--accent-secondary)" stroke-width="1.5" />
                                <text x="60" y="18" fill="var(--accent-secondary)" font-size="12" font-family="'Outfit', sans-serif" font-weight="bold" text-anchor="middle">★ ${net.licensed || 'LICENCIADO'}</text>
                            </g>

                            <!-- 2. Router / Punto de Acceso Central -->
                            <g transform="translate(300, 140)">
                                <!-- Cuerpo Router -->
                                <rect x="10" y="30" width="70" height="40" rx="6" fill="url(#gradRouter)" filter="url(#glow)" />
                                <!-- Puertos RJ45 traseros -->
                                <rect x="74" y="36" width="6" height="8" rx="1" fill="#111" stroke="var(--accent-primary)" stroke-width="1.5" />
                                <rect x="74" y="48" width="6" height="8" rx="1" fill="#111" stroke="var(--accent-primary)" stroke-width="1.5" />
                                <!-- Antenas -->
                                <line x1="25" y1="30" x2="15" y2="10" stroke="var(--accent-primary)" stroke-width="3" stroke-linecap="round" />
                                <line x1="65" y1="30" x2="75" y2="10" stroke="var(--accent-primary)" stroke-width="3" stroke-linecap="round" />
                                <circle cx="15" cy="10" r="2.5" fill="#ffffff" />
                                <circle cx="75" cy="10" r="2.5" fill="#ffffff" />
                                <!-- LEDs -->
                                <circle cx="25" cy="50" r="2.5" fill="#00ff88" />
                                <circle cx="35" cy="50" r="2.5" fill="#00ff88" />
                                <circle cx="45" cy="50" r="2.5" fill="#00ff88" />
                                <circle cx="55" cy="50" r="2.5" fill="var(--accent-secondary)" />
                                <text x="45" y="94" fill="var(--text-primary)" font-size="15" font-family="'Outfit', sans-serif" font-weight="bold" text-anchor="middle">${net.router || 'ROUTER'}</text>
                            </g>

                            <!-- CLIENTES CABLE (ETHERNET) / WI-FI EN ORDEN VERTICAL CON ESPACIADO MEJORADO -->
                            <!-- 3. PC Cliente 1 (Cable) -> Dispositivo 1 -->
                            <g transform="translate(560, 20)">
                                <rect x="10" y="5" width="45" height="30" rx="4" fill="url(#gradClients)" stroke="var(--accent-primary)" stroke-width="1.5" />
                                <path d="M 22 35 L 43 35 L 47 48 L 18 48 Z" fill="#8D99AE" />
                                <rect x="13" y="8" width="39" height="20" fill="#0c0c0e" />
                                <text x="32" y="21" fill="#00ff88" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">HTTPS</text>
                                <text x="70" y="24" fill="var(--text-primary)" font-size="15" font-family="'Outfit', sans-serif" font-weight="bold">${net.device1 || 'Dispositivo 1: PC Principal (Cable)'}</text>
                                <text x="70" y="43" fill="var(--accent-secondary)" font-size="13" font-family="monospace" font-weight="bold">${net.https_url || 'https://192.168.1.150:3000'}</text>
                            </g>

                            <!-- 4. PC Cliente 2 (Cable) -> Dispositivo 2 -->
                            <g transform="translate(560, 95)">
                                <rect x="10" y="5" width="45" height="30" rx="4" fill="url(#gradClients)" stroke="var(--accent-primary)" stroke-width="1.5" />
                                <path d="M 22 35 L 43 35 L 47 48 L 18 48 Z" fill="#8D99AE" />
                                <rect x="13" y="8" width="39" height="20" fill="#0c0c0e" />
                                <text x="32" y="21" fill="#00ff88" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">HTTPS</text>
                                <text x="70" y="24" fill="var(--text-primary)" font-size="15" font-family="'Outfit', sans-serif" font-weight="bold">${net.device2 || 'Dispositivo 2: PC Apoyo (Cable)'}</text>
                                <text x="70" y="43" fill="var(--accent-secondary)" font-size="13" font-family="monospace" font-weight="bold">${net.https_url || 'https://192.168.1.150:3000'}</text>
                            </g>

                            <!-- 5. Laptop Cliente 3 (Wi-Fi) -> Dispositivo 3 -->
                            <g transform="translate(580, 175)">
                                <rect x="10" y="5" width="40" height="26" rx="3" fill="url(#gradClients)" stroke="var(--accent-primary)" stroke-width="1.5" />
                                <rect x="13" y="8" width="34" height="20" fill="#0c0c0e" rx="1" />
                                <line x1="2" y1="31" x2="58" y2="31" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
                                <text x="30" y="21" fill="#00ff88" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">HTTPS</text>
                                <text x="70" y="20" fill="var(--text-primary)" font-size="15" font-family="'Outfit', sans-serif" font-weight="bold">${net.device3 || 'Dispositivo 3: Portátil (Wi-Fi)'}</text>
                                <text x="70" y="38" fill="var(--accent-secondary)" font-size="13" font-family="monospace" font-weight="bold">${net.https_url || 'https://192.168.1.150:3000'}</text>
                            </g>

                            <!-- 6. Tablet Cliente 4 (Wi-Fi) -> Dispositivo 4 -->
                            <g transform="translate(590, 255)">
                                <rect x="10" y="5" width="28" height="38" rx="4" fill="url(#gradClients)" stroke="currentColor" stroke-width="1.5" />
                                <rect x="13" y="8" width="22" height="26" fill="#0c0c0e" rx="1.5" />
                                <circle cx="24" cy="38" r="2" fill="#ffffff" />
                                <text x="24" y="24" fill="#00ff88" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">HTTPS</text>
                                <text x="60" y="22" fill="var(--text-primary)" font-size="15" font-family="'Outfit', sans-serif" font-weight="bold">${net.device4 || 'Dispositivo 4: Tablet (Wi-Fi)'}</text>
                                <text x="60" y="40" fill="var(--accent-secondary)" font-size="13" font-family="monospace" font-weight="bold">${net.https_url || 'https://192.168.1.150:3000'}</text>
                            </g>

                            <!-- 7. Móvil Cliente 5 (Wi-Fi) -> Dispositivo 5 -->
                            <g transform="translate(595, 335)">
                                <rect x="10" y="5" width="20" height="34" rx="4" fill="url(#gradClients)" stroke="currentColor" stroke-width="1.2" />
                                <rect x="12" y="7" width="16" height="24" fill="#0c0c0e" rx="1.5" />
                                <circle cx="20" cy="35" r="1.5" fill="#ffffff" />
                                <text x="20" y="21" fill="#00ff88" font-size="8" font-family="monospace" font-weight="bold" text-anchor="middle">HTTPS</text>
                                <text x="55" y="20" fill="var(--text-primary)" font-size="15" font-family="'Outfit', sans-serif" font-weight="bold">${net.device5 || 'Dispositivo 5: Teléfono Móvil (Wi-Fi)'}</text>
                                <text x="55" y="38" fill="var(--accent-secondary)" font-size="13" font-family="monospace" font-weight="bold">${net.https_url || 'https://192.168.1.150:3000'}</text>
                            </g>
                        </svg>
                    </div>`;
                    liEl.appendChild(diagDiv);
                }

                if (item.subTitle) {
                    const subTitleEl = document.createElement('p');
                    subTitleEl.style.cssText = 'margin: 8px 0 4px 0; color: var(--text-secondary); font-size: 0.82rem; font-weight: 600;';
                    subTitleEl.textContent = item.subTitle;
                    liEl.appendChild(subTitleEl);
                }

                if (item.subitems && item.subitems.length > 0) {
                    const subUl = document.createElement('ul');
                    subUl.style.cssText = 'margin: 4px 0 0 0; padding-left: 16px; color: var(--text-secondary); font-size: 0.8rem; line-height: 1.5; list-style-type: square;';
                    item.subitems.forEach(subItem => {
                        const subLi = document.createElement('li');
                        subLi.textContent = subItem;
                        subUl.appendChild(subLi);
                    });
                    liEl.appendChild(subUl);
                }

                if (item.compatible) {
                    const compLabel = document.createElement('span');
                    compLabel.style.cssText = 'display: block; margin: 8px 0 4px 0; font-size: 0.82rem; color: var(--accent-primary); font-weight: bold;';
                    compLabel.textContent = item.compatible;
                    liEl.appendChild(compLabel);
                }

                if (item.compatible_list && item.compatible_list.length > 0) {
                    const compUl = document.createElement('ul');
                    compUl.style.cssText = 'margin: 4px 0 0 0; padding-left: 16px; color: var(--text-secondary); font-size: 0.8rem; line-height: 1.5; list-style-type: square;';
                    item.compatible_list.forEach(compItem => {
                        const compLi = document.createElement('li');
                        compLi.textContent = compItem;
                        compUl.appendChild(compLi);
                    });
                    liEl.appendChild(compUl);
                }

                if (item.statuses) {
                    const statusBlock = document.createElement('div');
                    statusBlock.style.cssText = 'margin-top: 8px; display: flex; flex-direction: column; gap: 8px; padding-left: 12px; border-left: 2px solid rgba(255,255,255,0.05);';
                    Object.keys(item.statuses).forEach(color => {
                        const row = document.createElement('div');
                        row.style.cssText = 'display: flex; align-items: center; gap: 8px;';
                        
                        const dot = document.createElement('span');
                        dot.style.cssText = `width: 8px; height: 8px; border-radius: 50%; background: ${color === 'green' ? '#00ff88' : '#ff3b30'};`;
                        row.appendChild(dot);
                        
                        const desc = document.createElement('span');
                        desc.style.cssText = 'color: var(--text-secondary); font-size: 0.8rem;';
                        desc.textContent = item.statuses[color];
                        row.appendChild(desc);
                        
                        statusBlock.appendChild(row);
                    });
                    liEl.appendChild(statusBlock);
                }

                if (item.examples) {
                    const examplesDiv = document.createElement('div');
                    examplesDiv.style.cssText = 'margin-top: 10px; background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.03); border-radius: 6px; padding: 12px;';
                    
                    const label = document.createElement('span');
                    label.style.cssText = 'color: var(--accent-primary); font-size: 0.8rem; font-weight: bold; display: block; margin-bottom: 8px;';
                    label.textContent = item.examples.label;
                    examplesDiv.appendChild(label);
                    
                    const table = document.createElement('table');
                    table.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 0.78rem; text-align: left; color: var(--text-secondary);';
                    
                    item.examples.pairs.forEach(pair => {
                        const tr = document.createElement('tr');
                        tr.style.cssText = 'border-bottom: 1px solid rgba(255,255,255,0.03);';
                        
                        const td1 = document.createElement('td');
                        td1.style.cssText = 'padding: 6px 4px; font-style: italic;';
                        td1.textContent = pair[0];
                        
                        const tdArrow = document.createElement('td');
                        tdArrow.style.cssText = 'padding: 6px 4px; color: var(--accent-secondary); width: 20px;';
                        tdArrow.textContent = '→';
                        
                        const td2 = document.createElement('td');
                        td2.style.cssText = 'padding: 6px 4px; font-weight: bold; color: var(--text-primary);';
                        td2.textContent = pair[1];
                        
                        tr.appendChild(td1);
                        tr.appendChild(tdArrow);
                        tr.appendChild(td2);
                        table.appendChild(tr);
                    });
                    examplesDiv.appendChild(table);
                    liEl.appendChild(examplesDiv);
                }

                if (item.extra) {
                    const extraEl = document.createElement('span');
                    extraEl.style.cssText = 'color: var(--text-secondary); font-size: 0.82rem; line-height: 1.5; display: block; margin-top: 6px;';
                    extraEl.innerHTML = item.extra;
                    liEl.appendChild(extraEl);
                }

                if (item.note) {
                    const noteDiv = document.createElement('div');
                    noteDiv.style.cssText = 'margin-top: 6px; padding: 8px; border-left: 2px solid rgba(255, 255, 255, 0.2); background: rgba(255, 255, 255, 0.02); border-radius: 0 6px 6px 0;';
                    
                    const noteText = document.createElement('span');
                    noteText.style.cssText = 'color: var(--text-secondary); font-size: 0.78rem; font-style: italic; display: block;';
                    noteText.innerHTML = item.note;
                    noteDiv.appendChild(noteText);

                    liEl.appendChild(noteDiv);
                }

                if (item.important) {
                    const importantDiv = document.createElement('div');
                    importantDiv.style.cssText = 'margin-top: 10px; padding: 12px; border-left: 3px solid var(--accent-secondary); background: color-mix(in srgb, var(--accent-secondary) 6%, transparent); border-radius: 4px 8px 8px 4px;';
                    
                    const noteTitle = document.createElement('span');
                    noteTitle.style.cssText = 'color: var(--accent-secondary); font-size: 0.8rem; font-weight: bold; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;';
                    noteTitle.textContent = importantLabel;
                    importantDiv.appendChild(noteTitle);

                    const noteText = document.createElement('span');
                    noteText.style.cssText = 'color: var(--text-secondary); font-size: 0.78rem; line-height: 1.4; display: block;';
                    noteText.innerHTML = item.important;
                    importantDiv.appendChild(noteText);

                    liEl.appendChild(importantDiv);
                }

                listEl.appendChild(liEl);
            });

            contentBlock.appendChild(listEl);
            cardEl.appendChild(contentBlock);
            container.appendChild(cardEl);
        });

        // Diccionario de estado vacío para Guía y Legal (24 idiomas soportados)
        const emptyStateI18n = {
            es: 'No se encontraron resultados',
            en: 'No results found',
            eu: 'Ez da emaitzarik aurkitu',
            de: 'Keine Ergebnisse gefunden',
            ar: 'لم يتم العثور على نتائج',
            ca: 'No s\'han trobat resultats',
            zh: '未找到结果',
            ko: '결과를 찾을 수 없습니다',
            eo: 'Neniuj rezultoj trovitaj',
            fa: 'نتیجه‌ای یافت نشد',
            fr: 'Aucun résultat trouvé',
            gl: 'Non se atoparon resultados',
            nl: 'Geen resultaten gevonden',
            it: 'Nessun risultato trovato',
            ja: '結果が見つかりませんでした',
            kk: 'Нәтиже табылмады',
            pl: 'Nie znaleziono wyników',
            pt: 'Nenhum resultado encontrado',
            ru: 'Результаты не найдены',
            sv: 'Inga resultat hittades',
            tr: 'Sonuç bulunamadı',
            uk: 'Результатів не знайдено',
            uz: 'Hech qanday natija topilmadi',
            vi: 'Không tìm thấy kết quả'
        };

        const guideEmptyTitle = emptyStateI18n[lang] || emptyStateI18n['es'];
        const emptyState = document.createElement('div');
        emptyState.id = 'appGuideEmptyState';
        emptyState.style.cssText = 'display: none; text-align: center; padding: 40px 20px; color: var(--text-secondary); font-size: 0.9rem;';
        emptyState.innerHTML = `
            <svg viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.4; margin-bottom: 12px;">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${guideEmptyTitle}</div>
        `;
        container.appendChild(emptyState);
    }

    /**
     * 📜 Sistema Legal & Licencias Dinámico de Ajustes Generales (24 Idiomas)
     * Patrón "Stale-While-Revalidate" con Blindaje Murphy Offline-First:
     * Nivel 1: Lectura inmediata (0ms) desde caché en localStorage o paquete local empaquetado.
     * Nivel 2: Verificación asíncrona en segundo plano hacia https://www.talk-me.app/locales/legal/{lang}.json (3.5s timeout).
     * Nivel 3: Validación de integridad JSON y actualización suave de interfaz sin parpadeos.
     */
    async loadAndRenderLegal() {
        const container = document.getElementById('legalDynamicContainer');
        if (!container) return;

        const lang = (window.currentLang || 'es').toLowerCase();

        // ── NIVEL 1: Carga inmediata (0 ms) ──
        const cacheKey = `talkme_legal_cache_${lang}`;
        let cachedLegal = null;
        try {
            const rawCached = localStorage.getItem(cacheKey);
            if (rawCached) {
                const parsed = JSON.parse(rawCached);
                if (parsed && Array.isArray(parsed.ai_components)) {
                    cachedLegal = parsed;
                }
            }
        } catch (e) {}

        // Si tenemos versión en caché, renderizarla de inmediato
        if (cachedLegal) {
            this.renderLegalCards(cachedLegal, container, lang);
        } else {
            container.innerHTML = '<div style="color: var(--text-secondary); font-size: 0.9rem; text-align: center; padding: 20px;">Cargando información legal...</div>';
            try {
                const res = await fetch(`./locales/legal/${lang}.json`);
                if (!res.ok) throw new Error('Local legal not found');
                const legalData = await res.json();
                this.renderLegalCards(legalData, container, lang);
                try { localStorage.setItem(cacheKey, JSON.stringify(legalData)); } catch (e) {}
            } catch (err) {
                try {
                    const resEs = await fetch(`./locales/legal/es.json`);
                    const legalDataEs = await resEs.json();
                    this.renderLegalCards(legalDataEs, container, 'es');
                } catch (fallbackErr) {
                    container.innerHTML = '<div style="color: var(--accent-secondary, #ff6b35); font-size: 0.9rem; text-align: center; padding: 20px;">Error loading legal information.</div>';
                }
            }
        }

        // ── NIVEL 2: Sondeo en segundo plano (Silencioso, timeout 3.5s, con cache-busting) ──
        const remoteUrl = `https://www.talk-me.app/locales/legal/${lang}.json?_t=${Date.now()}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        fetch(remoteUrl, { cache: 'no-store', signal: controller.signal })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(remoteData => {
                clearTimeout(timeoutId);
                // ── NIVEL 3: Validación de integridad y actualización silenciosa ──
                if (remoteData && Array.isArray(remoteData.ai_components) && remoteData.ai_components.length > 0) {
                    const remoteStr = JSON.stringify(remoteData);
                    const currentStr = localStorage.getItem(cacheKey);
                    if (remoteStr !== currentStr) {
                        try { localStorage.setItem(cacheKey, remoteStr); } catch (e) {}
                        if (container.dataset.renderedLang === lang) {
                            this.renderLegalCards(remoteData, container, lang);
                            console.log(`[SettingsUI] Información Legal (${lang}) actualizada desde servidor central.`);
                        }
                    }
                }
            })
            .catch(err => {
                clearTimeout(timeoutId);
                // Silencio absoluto ante cortes de red o modo avión
            });
    }

    /**
     * Renderiza las tarjetas legales en la modal de ajustes generales
     */
    renderLegalCards(legalData, container, lang) {
        container.innerHTML = '';
        container.dataset.renderedLang = lang;

        const i18n = legalData.i18n || {};
        const copyright = legalData.copyright || {};
        const aiList = legalData.ai_components || [];
        const npmList = legalData.npm_packages || [];
        const fullLicenses = legalData.full_licenses || [];

        // Actualizar título y buscador
        const lblTitle = document.getElementById('lblUiLegalTitle');
        if (lblTitle) lblTitle.textContent = legalData.legal_title || 'Legal y Licencias';
        const filterInput = document.getElementById('appLegalFilterInput');
        if (filterInput) filterInput.placeholder = legalData.search_placeholder || 'Buscar en licencias y componentes...';

        // 1. Tarjeta Principal de Copyright
        const copyCard = document.createElement('div');
        copyCard.className = 'legal-card legal-card-copyright';
        copyCard.dataset.legalSection = 'copyright';
        copyCard.style.cssText = 'border-radius: 14px; padding: 20px; margin-bottom: 16px; text-align: left;';
        copyCard.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <div style="width: 36px; height: 36px; border-radius: 10px; background: color-mix(in srgb, var(--accent-primary) 20%, transparent); display: flex; align-items: center; justify-content: center; color: var(--accent-primary);">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.9371 1.25 22.75 6.06294 22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12ZM12 2.75C6.89137 2.75 2.75 6.89137 2.75 12C2.75 17.1086 6.89137 21.25 12 21.25C17.1086 21.25 21.25 17.1086 21.25 12C21.25 6.89137 17.1086 2.75 12 2.75Z" fill="currentColor"></path>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.2857 8.75C10.2834 8.75 8.75 10.253 8.75 12C8.75 13.747 10.2834 15.25 12.2857 15.25C12.7974 15.25 13.281 15.1504 13.7168 14.9727C14.1003 14.8163 14.5381 15.0004 14.6945 15.384C14.8509 15.7675 14.6667 16.2052 14.2832 16.3616C13.669 16.6121 12.9931 16.75 12.2857 16.75C9.55414 16.75 7.25 14.6712 7.25 12C7.25 9.32875 9.55414 7.25 12.2857 7.25C12.9931 7.25 13.669 7.38791 14.2832 7.63836C14.6667 7.79477 14.8509 8.23249 14.6945 8.61604C14.5381 8.99958 14.1003 9.18372 13.7168 9.02731C13.281 8.84961 12.7974 8.75 12.2857 8.75Z" fill="currentColor"></path>
                    </svg>
                </div>
                <div>
                    <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">${copyright.title || 'Aviso de Copyright'}</h3>
                    <span style="font-size: 0.8rem; color: var(--accent-primary); font-family: monospace;">${copyright.holder || 'Jorge Gonzalez Dominguez / talk-me.app'}</span>
                </div>
            </div>
            <p style="font-size: 0.82rem; line-height: 1.55; color: var(--text-secondary); margin: 0 0 10px 0;">
                ${copyright.notice || ''}
            </p>
            <div style="font-size: 0.76rem; color: var(--text-secondary); opacity: 0.7; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 10px;">
                ${i18n.notice_third_party || ''}
            </div>
        `;
        container.appendChild(copyCard);

        // 2. Sección Modelos de IA
        const aiHeader = document.createElement('h4');
        aiHeader.className = 'legal-section-header';
        aiHeader.dataset.legalHeader = 'ai';
        aiHeader.style.cssText = 'color: var(--accent-primary) !important; font-size: 0.92rem; text-transform: uppercase; letter-spacing: 0.8px; margin: 18px 0 10px 0; text-align: left; font-weight: 700; display: flex; align-items: center; gap: 8px;';
        aiHeader.innerHTML = `<svg width="20" height="20" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path stroke-width="28" d="M492.215,208.417c-1.225-1.243-2.539-2.424-3.87-3.586c0.696-3.88,1.1-7.831,1.1-11.844 c0.004-10.636-2.53-21.467-7.808-31.464c-6.033-11.462-14.969-20.554-25.401-26.715c-7.297-4.315-15.323-7.191-23.642-8.532 c-2.019-7.182-5.185-14.019-9.438-20.224c-7.08-10.334-17.148-18.892-29.467-24.193c-8.811-3.791-18.058-5.611-27.14-5.611 c0,0-0.28-0.009-0.79,0.036c-11.533,0.134-22.759,3.161-32.69,8.692c-3.884-4.679-8.376-8.843-13.375-12.35 c-10.956-7.697-24.353-12.261-38.687-12.403c-0.165-0.009-0.364-0.017-0.608-0.026c-0.031,0-0.062,0-0.097,0h-0.009h-0.009h-0.004 c-0.022,0-0.044,0-0.066,0c-0.133,0-0.293,0.009-0.497,0.017c-12.482,0.098-24.277,3.543-34.354,9.508 c-4.368,2.575-8.354,5.673-12.012,9.118c-10.44-6.508-22.777-10.308-35.917-10.37l-0.048-0.008h-0.311c-0.009,0-0.014,0-0.022,0 c-0.018,0-0.036,0-0.057,0c-0.16,0-0.36,0.008-0.613,0.026c-13.979,0.133-27.088,4.466-37.896,11.817 c-6.264,4.253-11.746,9.518-16.279,15.545c-5.735-1.553-11.723-2.396-17.841-2.396c-5.091,0-10.254,0.577-15.394,1.749 c-15.138,3.471-28.068,11.772-37.334,22.861h0.005c-6.503,7.768-11.195,16.93-13.77,26.812 c-9.873,3.348-19.177,8.959-26.959,16.886c-0.004,0.009-0.013,0.018-0.022,0.027c-13.051,13.308-19.621,30.718-19.616,48.004v0.026 v0.036c0,0,0,0.017,0,0.035v0.186h0.004c0.017,6.01,0.83,12.003,2.415,17.827C4.799,239.81,0.005,254.272,0,269.073 c-0.004,10.955,2.638,22.097,8.128,32.369c6.17,11.533,15.244,20.668,25.8,26.856c7.404,4.341,15.532,7.21,23.952,8.559 c4.484,12.048,12.172,22.444,22.009,30.141c11.701,9.172,26.462,14.596,42.278,14.596c1.643,0,3.281-0.052,4.918-0.177h0.04h0.022 h0.005h0.004c6.982-0.506,13.672-2.077,19.904-4.501c4.142,6.64,9.348,12.508,15.395,17.348 c11.697,9.366,26.572,14.96,42.517,15.031c0.058,0.009,0.106,0.009,0.156,0.009c0.054,0,0.106,0,0.156,0h0.009 c0.005,0,0.005,0,0.005,0h0.013h0.071c0.023,0,0.032,0,0.054,0l0.173-0.009h0.049c1.274-0.009,2.553-0.062,3.826-0.142h0.018 l0.75-0.018c5.708-0.418,11.222-1.528,16.447-3.249c6.583,9.775,15.75,18.022,27.092,23.492h-0.005 c9.57,4.616,19.78,6.827,29.8,6.827c9.756,0,19.3-2.121,28.054-6.046c12.722,13.512,30.661,21.627,49.957,21.646 c4.231,0,8.51-0.391,12.79-1.199c16.438-3.089,30.523-11.888,40.378-23.9h-0.004c6.436-7.821,11.067-17.054,13.544-27.016 c11.368-1.118,22.648-5.078,32.618-12.092c9.487-6.659,16.838-15.36,21.765-25.072c4.928-9.704,7.467-20.412,7.467-31.216 c0-7.2-1.172-14.428-3.476-21.397c5.917-4.82,11.15-10.698,15.323-17.578c6.748-11.098,9.997-23.474,9.997-35.638 C511.996,238.914,505.102,221.468,492.215,208.417z"></path><path stroke-width="18" d="M345.934,233.32c-3.329-1.882-7.555-0.71-9.438,2.619c-1.882,3.329-0.71,7.565,2.624,9.447 c5.114,2.912,8.235,6.161,10.298,9.518c-8.54,3-16.11,4.234-22.799,4.234c-9.789-0.009-17.796-2.593-24.548-6.552 c-6.734-3.968-12.18-9.393-16.309-15.022c-6.806-9.278-15.661-17.542-26.098-23.571c-10.422-6.011-22.479-9.767-35.419-9.767 c-11.347-0.008-23.305,2.913-35.153,9.42c-4.844,2.655-9.043,5.762-12.7,9.153c-14.414,5.549-26.834,7.546-37.341,7.546 c-14.969,0-26.151-4.022-33.627-7.973c-3.733-1.971-6.525-3.933-8.332-5.353c-0.906-0.719-1.566-1.288-1.976-1.66l-0.426-0.409 l-0.067-0.062H94.62c-2.655-2.726-7.023-2.796-9.771-0.151c-2.752,2.654-2.832,7.04-0.177,9.792 c0.386,0.391,5.149,5.265,14.267,10.095c3.991,2.113,8.883,4.19,14.534,5.886c-1.501,2.113-3.551,5.202-5.784,9.135 c-4.293,7.573-9.225,18.201-11.738,30.737c-0.75,3.746,1.683,7.396,5.434,8.15c3.751,0.745,7.404-1.688,8.15-5.442 c2.108-10.556,6.414-19.94,10.205-26.608c1.891-3.338,3.645-5.993,4.906-7.778c0.63-0.896,1.136-1.58,1.474-2.024 c0.168-0.214,0.297-0.382,0.373-0.48l0.08-0.098l0.009-0.009l0.004-0.009c0.639-0.781,1.066-1.66,1.309-2.583 c3.525,0.434,7.227,0.701,11.156,0.692c7.284,0.009,15.261-0.852,23.851-2.805c-4.258,9.18-6.01,18.76-6.015,27.54 c0.017,8.843,1.7,16.869,4.701,23.261c1.637,3.463,5.77,4.936,9.228,3.303c3.458-1.634,4.936-5.771,3.298-9.224v-0.009 c-1.926-4.013-3.392-10.334-3.369-17.331c-0.005-7.546,1.624-15.856,5.531-23.438c3.928-7.582,10.028-14.498,19.479-19.701 c9.974-5.46,19.496-7.698,28.49-7.706c10.24,0,19.887,2.957,28.498,7.91c8.603,4.963,16.119,11.95,21.844,19.762 c5.038,6.872,11.778,13.655,20.452,18.769c8.656,5.114,19.284,8.478,31.58,8.469c8.136,0,16.975-1.474,26.466-4.706l0.022,0.497 c0,3.392-0.528,6.481-1.056,8.665c-0.262,1.092-0.524,1.954-0.706,2.513c-0.093,0.275-0.164,0.479-0.208,0.594l-0.04,0.107 l-0.004,0.017h0.004c-1.403,3.543,0.324,7.556,3.866,8.976c3.551,1.421,7.586-0.311,9.007-3.862 c0.177-0.497,2.966-7.413,2.992-17.011c0-5.505-0.964-11.968-4.164-18.35C359.62,244.054,354.133,237.928,345.934,233.32z"></path><path stroke-width="18" d="M361.382,187.056c-19.043,0-34.336-7.014-44.914-16.194c-5.278-4.581-9.336-9.704-12.003-14.604 c-2.681-4.91-3.911-9.58-3.893-13.078c0-3.827-3.103-6.925-6.929-6.925c-3.826,0-6.926,3.098-6.926,6.925 c0.018,6.516,2.055,13.193,5.58,19.692c3.689,6.766,9.078,13.335,15.928,19.123c-1.381,1.918-3.286,4.387-5.718,7.032 c-5.278,5.762-12.886,12.145-21.969,15.368c-3.604,1.287-5.482,5.256-4.194,8.851c1.287,3.605,5.252,5.488,8.852,4.199 c12.327-4.43,21.555-12.508,27.815-19.381c2.788-3.072,4.958-5.877,6.561-8.123c11.462,6.614,25.618,10.982,41.812,10.973 c3.822,0,6.93-3.098,6.93-6.925C368.311,190.164,365.204,187.056,361.382,187.056z"></path><path stroke-width="18" d="M315.197,322.537c-12.961,0-23.26-2.504-31.535-6.33c-12.385-5.753-20.42-14.595-25.476-23.412 c-2.521-4.395-4.261-8.771-5.358-12.616c-1.101-3.826-1.532-7.182-1.523-9.215c0-3.826-3.098-6.926-6.925-6.926 c-3.831,0-6.929,3.099-6.929,6.926c0,2.495,0.297,5.256,0.906,8.292c1.056,5.291,3.067,11.409,6.326,17.712 c4.888,9.447,12.647,19.354,24.242,26.884c2.903,1.899,6.046,3.622,9.428,5.166c0.528,2.273,1.261,6.321,1.256,11.204 c0,3.552-0.382,7.511-1.456,11.569c-1.074,4.057-2.823,8.195-5.602,12.216c-2.179,3.152-1.394,7.466,1.754,9.642 c3.148,2.175,7.462,1.394,9.638-1.749c3.782-5.469,6.178-11.151,7.608-16.567c1.434-5.424,1.913-10.582,1.913-15.111 c0-2.264-0.124-4.359-0.311-6.276c6.677,1.554,13.992,2.459,22.044,2.45c3.823,0,6.926-3.107,6.926-6.934 C322.123,325.644,319.02,322.537,315.197,322.537z"></path><path stroke-width="18" d="M409.302,218.468c-3.431-2.956-7.133-5.38-11.04-7.103c-3.902-1.722-8.026-2.752-12.248-2.752 c-3.826,0-6.929,3.098-6.929,6.925c0,3.836,3.103,6.934,6.929,6.934c2.548-0.009,5.771,0.879,9.158,2.841 c5.078,2.912,10.357,8.141,14.196,14.693c3.862,6.543,6.308,14.33,6.304,22.373c-0.031,8.852-2.819,18.085-10.365,27.266 c-2.437,2.956-2.02,7.315,0.932,9.756c2.948,2.433,7.316,2.016,9.753-0.932c9.508-11.472,13.565-24.194,13.534-36.09 c0-7.227-1.447-14.142-3.879-20.446C421.988,232.485,416.16,224.398,409.302,218.468z"></path><path stroke-width="18" d="M168.073,181.534v-0.009c4.759-5.638,11.538-10.059,19.266-13.033c7.715-2.983,16.327-4.475,24.384-4.466 c7.848-0.018,15.155,1.429,20.514,3.924c3.476,1.598,7.59,0.089,9.198-3.391c1.602-3.472,0.084-7.582-3.387-9.19 c-7.741-3.56-16.837-5.194-26.324-5.202c-9.739,0-19.901,1.758-29.365,5.388c-9.441,3.64-18.235,9.199-24.862,17.02 c-2.473,2.921-2.109,7.297,0.812,9.766C161.228,184.819,165.601,184.446,168.073,181.534z"></path></svg> <span>${i18n.tab_ai || 'Modelos IA y Binarios'}</span>`;
        container.appendChild(aiHeader);

        aiList.forEach(item => {
            const card = document.createElement('div');
            card.className = 'legal-card';
            card.dataset.legalSection = 'ai';
            card.style.cssText = 'border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; text-align: left; display: flex; flex-direction: column; gap: 6px;';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    <div>
                        <strong style="color: var(--text-primary); font-size: 0.92rem;">${item.name}</strong>
                        <span style="display: block; font-size: 0.76rem; color: var(--accent-primary); margin-top: 2px;">${item.category}</span>
                    </div>
                    <span class="legal-badge-pill" style="background: color-mix(in srgb, var(--accent-primary) 15%, transparent); color: var(--accent-primary); font-size: 0.74rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; border: 1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent); font-family: monospace;">${item.license}</span>
                </div>
                <p style="font-size: 0.8rem; line-height: 1.45; color: var(--text-secondary); margin: 4px 0;">${item.description || ''}</p>
                <div style="display: flex; flex-wrap: wrap; gap: 14px; font-size: 0.76rem; color: var(--text-secondary); opacity: 0.75; margin-top: 4px; border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.04)); padding-top: 6px;">
                    <span><strong>${i18n.label_author || 'Autor / Organización:'}</strong> ${item.author}</span>
                    <span><strong>${i18n.label_source || 'Código / Origen:'}</strong> <a href="${item.source}" target="_blank" style="color: var(--accent-primary); text-decoration: none;">${item.source}</a></span>
                </div>
            `;
            container.appendChild(card);
        });

        // 3. Sección Paquetes NPM / Open Source
        const npmHeader = document.createElement('h4');
        npmHeader.className = 'legal-section-header';
        npmHeader.dataset.legalHeader = 'npm';
        npmHeader.style.cssText = 'color: var(--accent-primary) !important; font-size: 0.92rem; text-transform: uppercase; letter-spacing: 0.8px; margin: 22px 0 10px 0; text-align: left; font-weight: 700; display: flex; align-items: center; gap: 8px;';
        npmHeader.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M10 13H14M19 9V20H5V9M19 9H5M19 9C19.5523 9 20 8.55228 20 8V5C20 4.44772 19.5523 4 19 4H5C4.44772 4 4 4.44772 4 5V8C4 8.55228 4.44772 9 5 9"/></svg> <span>${i18n.tab_npm || 'Paquetes Open Source'}</span>`;
        container.appendChild(npmHeader);

        const npmGrid = document.createElement('div');
        npmGrid.dataset.legalGroup = 'npm';
        npmGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; margin-bottom: 20px;';

        npmList.forEach(pkg => {
            const pkgCard = document.createElement('div');
            pkgCard.className = 'legal-card';
            pkgCard.dataset.legalSection = 'npm';
            pkgCard.style.cssText = 'border-radius: 10px; padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; text-align: left;';
            pkgCard.innerHTML = `
                <div>
                    <strong style="color: var(--text-primary); font-size: 0.86rem; font-family: monospace;">${pkg.name}</strong>
                    <span style="font-size: 0.75rem; color: var(--text-secondary); margin-left: 6px;">v${pkg.version}</span>
                </div>
                <span class="legal-badge-pill" style="background: color-mix(in srgb, var(--accent-primary) 12%, transparent); color: var(--accent-primary); font-size: 0.72rem; font-weight: 600; padding: 2px 7px; border-radius: 5px; font-family: monospace; border: 1px solid color-mix(in srgb, var(--accent-primary) 20%, transparent);">${pkg.license}</span>
            `;
            npmGrid.appendChild(pkgCard);
        });
        container.appendChild(npmGrid);

        // 4. Sección Textos Completos de Licencias
        const licenseHeader = document.createElement('h4');
        licenseHeader.className = 'legal-section-header';
        licenseHeader.dataset.legalHeader = 'licenses';
        licenseHeader.style.cssText = 'color: var(--accent-primary) !important; font-size: 0.92rem; text-transform: uppercase; letter-spacing: 0.8px; margin: 22px 0 10px 0; text-align: left; font-weight: 700; display: flex; align-items: center; gap: 8px;';
        licenseHeader.innerHTML = `<svg width="18" height="18" viewBox="-2 0 19 19" fill="currentColor" style="flex-shrink: 0;"><path d="M14.443 4.445a1.615 1.615 0 0 1-1.613 1.614h-.506v8.396a1.615 1.615 0 0 1-1.613 1.613H2.17a1.613 1.613 0 1 1 0-3.227h.505V4.445A1.615 1.615 0 0 1 4.289 2.83h8.54a1.615 1.615 0 0 1 1.614 1.614zM2.17 14.96h7.007a1.612 1.612 0 0 1 0-1.01H2.172a.505.505 0 0 0 0 1.01zm9.045-10.515a1.62 1.62 0 0 1 .08-.505H4.29a.5.5 0 0 0-.31.107l-.002.001a.5.5 0 0 0-.193.397v8.396h6.337a.61.61 0 0 1 .6.467.632.632 0 0 1-.251.702.505.505 0 1 0 .746.445zm-.86 1.438h-5.76V6.99h5.76zm0 2.26h-5.76V9.25h5.76zm0 2.26h-5.76v1.108h5.76zm2.979-5.958a.506.506 0 0 0-.505-.505.496.496 0 0 0-.31.107h-.002a.501.501 0 0 0-.194.398v.505h.506a.506.506 0 0 0 .505-.505z"/></svg> <span>${i18n.tab_licenses || 'Textos de Licencias'}</span>`;
        container.appendChild(licenseHeader);

        fullLicenses.forEach(lic => {
            const licCard = document.createElement('div');
            licCard.className = 'legal-card';
            licCard.dataset.legalSection = 'licenses';
            licCard.style.cssText = 'border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; text-align: left;';
            licCard.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem;">${lic.name}</span>
                    <span class="legal-badge-pill" style="background: color-mix(in srgb, var(--accent-primary) 15%, transparent); color: var(--accent-primary); font-size: 0.72rem; padding: 2px 8px; border-radius: 5px; font-family: monospace; border: 1px solid color-mix(in srgb, var(--accent-primary) 25%, transparent);">${lic.badge || 'LICENSE'}</span>
                </div>
                <div style="border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.06)); padding-top: 10px;">
                    <pre class="legal-license-pre">${lic.text}</pre>
                </div>
            `;
            container.appendChild(licCard);
        });

        // Contenedor de estado vacío cuando no hay coincidencias (24 idiomas)
        const legalEmptyI18n = {
            es: 'No se encontraron resultados',
            en: 'No results found',
            eu: 'Ez da emaitzarik aurkitu',
            de: 'Keine Ergebnisse gefunden',
            ar: 'لم يتم العثور على نتائج',
            ca: 'No s\'han trobat resultats',
            zh: '未找到结果',
            ko: '결과를 찾을 수 없습니다',
            eo: 'Neniuj rezultoj trovitaj',
            fa: 'نتیجه‌ای یافت نشد',
            fr: 'Aucun résultat trouvé',
            gl: 'Non se atoparon resultados',
            nl: 'Geen resultaten gevonden',
            it: 'Nessun risultato trovato',
            ja: '結果が見つかりませんでした',
            kk: 'Нәтиже табылмады',
            pl: 'Nie znaleziono wyników',
            pt: 'Nenhum resultado encontrado',
            ru: 'Результаты не найдены',
            sv: 'Inga resultat hittades',
            tr: 'Sonuç bulunamadı',
            uk: 'Результатів не знайдено',
            uz: 'Hech qanday natija topilmadi',
            vi: 'Không tìm thấy kết quả'
        };
        const legalEmptyTitle = legalEmptyI18n[lang] || legalEmptyI18n['es'];

        const emptyState = document.createElement('div');
        emptyState.id = 'appLegalEmptyState';
        emptyState.style.cssText = 'display: none; text-align: center; padding: 40px 20px; color: var(--text-secondary); font-size: 0.9rem;';
        emptyState.innerHTML = `
            <svg viewBox="0 0 24 24" width="40" height="40" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.4; margin-bottom: 12px;">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${legalEmptyTitle}</div>
        `;
        container.appendChild(emptyState);
    }
}

/**
 * Controlador de Perillas Rotativas (Premium Knobs)
 */
class KnobController {
    constructor(el, min, max, initialValue, callback, isSteps = false) {
        this.el = el;
        this.min = min;
        this.max = max;
        this.value = initialValue;
        this.callback = callback;
        this.isSteps = isSteps;
        this.dial = el.querySelector('.knob-dial');
        this.isDragging = false;
        this.startY = 0;
        this.startValue = 0;
        this.init();
    }

    init() {
        this.createMarks();
        this.updateDial();
        this.el.addEventListener('pointerdown', (e) => this.onStart(e));
        window.addEventListener('pointermove', (e) => this.onMove(e));
        window.addEventListener('pointerup', () => this.onEnd());
    }

    createMarks() {
        const marksContainer = this.el.querySelector('.knob-marks');
        if (!marksContainer) return;
        marksContainer.innerHTML = '';
        const numMarks = 13;
        for (let i = 0; i < numMarks; i++) {
            const mark = document.createElement('div');
            mark.className = 'knob-mark';
            const deg = (i / (numMarks - 1) * 300) - 150;
            mark.style.transform = `rotate(${deg}deg)`;
            marksContainer.appendChild(mark);
        }
    }

    onStart(e) {
        this.isDragging = true;
        this.startY = e.clientY;
        this.startValue = this.value;
        this.el.setPointerCapture(e.pointerId);
        this.el.classList.add('active');
    }

    onMove(e) {
        if (!this.isDragging) return;
        const deltaY = this.startY - e.clientY;
        const range = this.max - this.min;
        const sensitivity = range / 250; // Aumentada sensibilidad (antes 400)
        let rawValue = this.startValue + deltaY * sensitivity;
        rawValue = Math.max(this.min, Math.min(this.max, rawValue));
        this.updateDial(rawValue);
        let logicalValue = this.isSteps ? Math.round(rawValue / 100) * 100 : Math.round(rawValue);
        if (logicalValue !== this.value) {
            this.value = logicalValue;
            this.callback(this.value);
        }
    }

    onEnd() {
        this.isDragging = false;
        this.el.classList.remove('active');
        this.updateDial(this.value);
        if (window.SettingsUIInstance) window.SettingsUIInstance.showGlobalSaveBtn();
    }

    setValue(val, triggerCallback = false) {
        let numericVal = Number(val);
        if (isNaN(numericVal)) return;
        numericVal = Math.max(this.min, Math.min(this.max, numericVal));
        if (this.isSteps) {
            numericVal = Math.round(numericVal / 100) * 100;
        } else {
            numericVal = Math.round(numericVal);
        }
        this.value = numericVal;
        this.updateDial(this.value);
        if (triggerCallback && typeof this.callback === 'function') {
            this.callback(this.value);
        }
    }

    updateDial(val = this.value) {
        if (!this.dial) return;
        const range = this.max - this.min;
        const percent = (val - this.min) / range;
        const deg = (percent * 300) - 150;
        this.dial.style.transform = `rotate(${deg}deg)`;

        // Iluminar marcas graduadas activas
        const marks = this.el.querySelectorAll('.knob-mark');
        marks.forEach((mark, index) => {
            const markPercent = index / (marks.length - 1);
            const markDeg = (markPercent * 300) - 150;
            if (markDeg <= deg) {
                mark.classList.add('active');
            } else {
                mark.classList.remove('active');
            }
        });
    }
}
