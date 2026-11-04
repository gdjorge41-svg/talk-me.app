/**
 * 🎯 DOMManager - Singleton centralizado de referencias DOM
 * 
 * Propósito: Reemplazar 72+ variables DOM globales dispersas por una única fuente de verdad.
 * 
 * ANTES (❌ Anti-patrón):
 *   const messagesContainer = document.getElementById('messagesContainer');
 *   const textInput = document.querySelector('.text-input');
 *   const btnSend = document.querySelector('.btn-send');
 *   // ... 69 más variables globales esparcidas
 * 
 * AHORA (✅ Patrón Limpio):
 *   const dom = DOMManager.getInstance();
 *   dom.get('chat', 'messagesContainer')
 *   dom.get('chat', 'textInput')
 *   dom.get('actions', 'btnSend')
 * 
 * VENTAJAS:
 *   ✅ Single source of truth
 *   ✅ Validación centralizada
 *   ✅ Fácil debugging (puedo listar todos los elementos)
 *   ✅ Inyección de dependencias
 *   ✅ Hot reload ready
 */

class DOMManager {
    static #instance = null;

    constructor() {
        if (DOMManager.#instance) {
            return DOMManager.#instance;
        }
        
        this.elements = this._initElements();
        this.cache = new Map();
        DOMManager.#instance = this;
    }

    static getInstance() {
        return new DOMManager();
    }

    _initElements() {
        return {
            // ────────────────────────────────────
            // 🔐 MODALS - Todas las ventanas modales
            // ────────────────────────────────────
            modals: {
                user: '#userModal',
                settings: '#settingsModal',
                triggers: '#triggersModal',
                terms: '#termsModal',
                imageViewer: '#imageModal',
                categoryManager: null, // Se crea dinámicamente
            },

            // ────────────────────────────────────
            // 💬 CHAT - Contenedor y entrada de texto
            // ────────────────────────────────────
            chat: {
                container: '#messagesContainer',
                input: '.text-input',
                waveContainer: '#inputWaveContainer',
                transcriptionBox: '#transcriptionBox',
                transcriptionText: '#transcriptionText',
            },

            // ────────────────────────────────────
            // 🎙️  AUDIO - Dispositivos y controles
            // ────────────────────────────────────
            audio: {
                deviceSelect: '#audioDeviceSelect',
                deviceChannelSelect: '#audioDeviceChannelSelect',     // [v59.18]
                outputSelect: '#audioOutputSelect',
                outputChannelSelect: '#audioOutputChannelSelect',     // [v59.18]
                outputContainer: '#audioOutputContainer',
                voiceWave: '#voiceWave',
                audioStream: null, // Se asigna en runtime
            },

            // ────────────────────────────────────
            // 🔘 BUTTONS - Acciones principales
            // ────────────────────────────────────
            buttons: {
                mic: '#btnSend',           // [v60] El botón de envío es polimórfico (Mic/Send)
                send: '#btnSend',
                sendText: '#btnSendText',
                sendIcon: '#btnSendIcon',
                sendArrowIcon: '#btnSendArrowIcon',
                start: '#btnStart',
                attach: '#btnAttach',
                openSettings: '#btnOpenMainSettings',
                closeSettings: '#btnCloseSettings',
                addWord: '#btnAddWord',
                openTerms: '#btnOpenTerms',
                closeTerms: '#btnCloseTerms',
                triggers: '.nav-item[data-section="section-triggers"]',
                manageCategories: '#btnManageCategories',
                manageCategoriesLogin: '#btnManageCategoriesLogin',
            },

            // ────────────────────────────────────
            // 📊 STATUS INDICATORS - Estado visual
            // ────────────────────────────────────
            status: {
                indicator: '#statusIndicator',
                indicatorText: '#statusIndicatorText',
                connection: '#connectionStatus',
                connectionIP: '#connectionStatusIP',
                connectionDot: '#connectionStatusDot',
                speakingUser: '#userSpeakingIndicator',
                volumeLevel: '#volumeLevel',
                usersList: '#usersList',
                usersListTitle: '#usersListTitle',
                speakingUserDisplay: '#speakingUser',
            },

            // ────────────────────────────────────
            // ⚙️  CONTROLS - Toggles y selectores
            // ────────────────────────────────────
            controls: {
                langSwitcher: '#globalLangSwitcher',
                usernameInput: '#usernameInput',
                sendAudio: '#sendAudioToggle',
                autoPlay: '#autoPlayToggle',
                vibration: '#vibrationToggle',
                vibrationContainer: '#vibrationSettingContainer',
                flashlight: '#flashlightToggle',
                flashlightContainer: '#flashlightSettingContainer',
                micSensitivity: '#micSensitivity',
                cacheLimitSlider: '#cacheLimitRange', 
                cacheLimitValue: '#cacheLimitLabel', 
                autoDelete: '#autoDeleteToggle',
                messagesMode: '#messagesModeSelectAlt', 
                micMode: '#micModeSelect',
                fontSizeKnob: '#fontSizeKnob',
                fontWeightKnob: '#fontWeightKnob',
            },

            // ────────────────────────────────────
            // 🗂️  DICTIONARY - Gestión de palabras
            // ────────────────────────────────────
            dictionary: {
                from: '#dictFrom',
                to: '#dictTo',
                tags: '#dictionaryTags',
            },

            // ────────────────────────────────────
            // 🎚️  TRIGGERS - Sistema de triggers
            // ────────────────────────────────────
            triggers: {
                modal: '#triggersModal',
                closeBtn: '#btnCloseTriggers',
                editorFormOut: '#editorFormOut',
                addNewBtn: '#addNewTriggerBtn',
                triggersList: '#triggersList',
                canvas: '#timelineCanvas',
                kfName: '#kfName',
                kfTime: '#kfTime',
                kfValue: '#kfValue',
                kfEasing: '#kfEasing',
                kfHold: '#kfHold',
                globalDurationSec: '#globalDurationSec',
                triggerName: '#triggerName',
                triggerOnSelect: '#triggerOnSelect',
                keywordInput: '#keywordInput',
                keywordGroup: '#keywordGroup',
                typeFieldsContainer: '#typeFieldsContainer',
                playPauseBtn: '#playPauseBtn',
                stopBtn: '#stopBtn',
                loopBtn: '#loopBtn',
                liveBtn: '#liveBtn',
                saveBtn: '#saveTriggerBtn',
                cancelBtn: '#cancelTriggerBtn',
                keyframeItemsList: '#keyframeItemsList',
                addKeyframeBtn: '#addKeyframeBtn',
                deleteKeyframeBtn: '#deleteKeyframeBtn',
            },

            // ────────────────────────────────────
            // 🎨 UI - Elementos visuales globales
            // ────────────────────────────────────
            ui: {
                panel: '#panelToggle',
                container: '#mainContainer',
                logo: '.main-logo',
                micText: '#btnSendText',
                fileInput: '#fileInput',
                imageFull: '#fullImage',
                imageCloseViewer: '#closeViewer',
                globalToast: '#globalToast',
            },
        };
    }

    /**
     * Obtiene un elemento del catálogo (Lazy Selection + Auto-Sanación)
     * @param {string} category - Categoría
     * @param {string} name - Nombre del elemento
     * @returns {HTMLElement|null}
     */
    get(category, name) {
        const cacheKey = `${category}.${name}`;
        let element = this.cache.get(cacheKey) || null;

        // Auto-Sanación: Si el elemento no existe o se desconectó del DOM (re-renderizado)
        if (!element || !document.contains(element)) {
            const selector = this.elements[category]?.[name];
            
            if (selector && typeof selector === 'string') {
                element = document.querySelector(selector);
                if (element) {
                    this.cache.set(cacheKey, element);
                }
            } else if (selector instanceof HTMLElement) {
                // Caso especial para elementos inyectados manualmente
                element = selector;
                this.cache.set(cacheKey, element);
            }
        }
        
        return element;
    }

    /**
     * Obtiene múltiples elementos de una categoría
     * @param {string} category
     * @returns {Object} Objeto con todos los elementos
     */
    getCategory(category) {
        return this.elements[category] || {};
    }

    /**
     * Establece un texto en un elemento
     * @param {string} category
     * @param {string} name
     * @param {string} text
     */
    setText(category, name, text) {
        const elem = this.get(category, name);
        if (elem) elem.textContent = text;
    }

    /**
     * Establece un valor en un input/select
     * @param {string} category
     * @param {string} name
     * @param {string} value
     */
    setValue(category, name, value) {
        const elem = this.get(category, name);
        if (elem) elem.value = value;
    }

    /**
     * Toglea clase en elemento
     * @param {string} category
     * @param {string} name
     * @param {string} className
     */
    toggleClass(category, name, className) {
        const elem = this.get(category, name);
        if (elem) elem.classList.toggle(className);
    }

    /**
     * Añade listener a elemento
     * @param {string} category
     * @param {string} name
     * @param {string} event
     * @param {Function} handler
     */
    on(category, name, event, handler) {
        const elem = this.get(category, name);
        if (elem) elem.addEventListener(event, handler);
    }

    /**
     * Quita listener de elemento
     * @param {string} category
     * @param {string} name
     * @param {string} event
     * @param {Function} handler
     */
    off(category, name, event, handler) {
        const elem = this.get(category, name);
        if (elem) elem.removeEventListener(event, handler);
    }

    /**
     * Debugging: lista todos los elementos
     */
    debug() {
        console.table(Object.entries(this.elements).map(([cat, items]) => ({
            category: cat,
            count: Object.keys(items).length,
            details: Object.keys(items).join(', '),
        })));
    }
}

// Exportar como singleton
export { DOMManager };
