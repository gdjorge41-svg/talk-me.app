// === INICIO PATCH: Restablecer modo de emisin al cerrar sesin/desconectar/cerrar pestaa ===
function resetMessageModePreference() {
    localStorage.removeItem('talkme_msg_mode');
    window.transcriptionOnly = false;
    if (typeof audioState !== 'undefined' && audioState.setState) {
        audioState.setState({ transcriptionOnly: false });
    }
}

// Al cerrar pestaa o recargar
window.addEventListener('beforeunload', resetMessageModePreference);

// Si tienes lgica de logout explcito, llama tambin a resetMessageModePreference()
// Ejemplo:
// document.getElementById('logoutBtn')?.addEventListener('click', resetMessageModePreference);
// === FIN PATCH: Restablecer modo de emisin al cerrar sesin/desconectar/cerrar pestaa ===
// === INICIO PATCH RESTAURACIN CENTRALIZADA DE PREFERENCIAS ===
function restoreUserPreferences() {
    return settingsUI.restoreUserPreferences();
}
// === FIN PATCH RESTAURACIN CENTRALIZADA DE PREFERENCIAS ===
//  CRITICAL: DO NOT ADD CONSOLE.LOG TO CERTAIN FUNCTIONS
// This file contains time-critical functions called THOUSANDS of times per second
// DO NOT add console.log to: processAudioChunk(), analyzeVolume()
// These functions can be called 48,000x/sec during recording - logging causes UI freeze and breaks initialization

import {
    initAudioCtx,
    playComfortNoise,
    setupEliteTransport,
    audioCtx,
    streamStates,
    streamPlayers,
    processedStreamIds
} from './audio-core.js?v=59.16f';

import * as Hardware from '../lib/hardware.js';
import masterAdminUI from './module-master-admin-ui.js';

// Inicializar mdulos independientes
masterAdminUI.init();

// ⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐
//  ESTADO GLOBAL Y SINCRONIZACIN (v60)
// Definir aqu para evitar errores de inicializacin (Temporal Dead Zone)
// ⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐
let __localesData = null;
Object.defineProperty(window, 'localesData', { 
    get: () => __localesData, 
    set: (v) => { 
        if (__localesData === v) return; 
        __localesData = v; 
        if (typeof window.applyLocales === 'function') window.applyLocales(); 
    }, 
    configurable: true 
});

let __lastUsersData = []; 
Object.defineProperty(window, 'lastUsersData', { get: () => __lastUsersData, set: (v) => { __lastUsersData = v; }, configurable: true });

let __currentDictionary = [];
Object.defineProperty(window, 'currentDictionary', { 
    get: () => __currentDictionary, 
    set: (v) => { __currentDictionary = v; }, 
    configurable: true 
});
// Alias de compatibilidad para evitar split-brain en funciones legacy
Object.defineProperty(window, '_currentDictionary', { 
    get: () => __currentDictionary, 
    set: (v) => { __currentDictionary = v; }, 
    configurable: true 
});

let __serverTriggers = [];
Object.defineProperty(window, 'serverTriggers', {
    get: () => __serverTriggers,
    set: (v) => { 
        __serverTriggers = v; 
        if (typeof window.setServerTriggers === 'function') window.setServerTriggers(v);
    },
    configurable: true
});

let notificationInterval = null;
window.openedFromSettings = false;
let currentFontSize = window.innerWidth <= 768 ? 18 : 33;
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

// [v60.ELITE] Coordinación de Ignición de Hardware
window.hardwareIgnitionPromise = new Promise((resolve) => {
    window.resolveHardwareIgnition = resolve;
});
window.hardwareReady = false;

//  CONSTANTES DE NEGOCIO Y ESTADO GLOBAL (v60)
window.MASTER_USERNAME = 'Master';
window.FILTER_ALL_KEY = 'all';
window._vosk_status_received = false;
window._socketDisconnectedDuringAudio = false;
window._processedMsgIds = new Set();
window._lastAlertTime = 0;
window.audioBlobUrls = [];
window.MAX_AUDIO_BLOBS = 100;
window.globalAutoPlayQueue = [];
window.isPlayingGlobalAutoPlay = false;

// Inicializar contenedores de triggers para evitar errores de undefined (v60)
window.serverTriggers = window.serverTriggers || [];
window.localTriggers = window.localTriggers || [];

import {

    initTriggerWorker,
    sendTriggerValue,
    initMIDI,
    refreshMidiOutputs,
    sendMIDIRaw,
    executeKeyframeAnimation,
    stopTriggerAnimation,
    applyEasing,
    triggersEnabled,
    triggerWorker,
    workerReady,
    midiAccess,
    midiOutputPort,
    serverTriggers,
    localTriggers,
    activeAnimations,
    ranges as engineRanges,
    setServerTriggers,
    setLocalTriggers,
    setTriggersEnabled,
    setCurrentUsername,
    fireTriggers,
    isTriggerEnabled,
    setTriggerEnabled,
    normalizeText,
    lockTriggerSession,
    getMergedTriggers,
    migrateStepsToKeyframes,
    migrateTriggersStorage,
    getEnabledTriggerIds
} from './trigger-engine.js';

//  PUENTES MOTOR TRIGGERS (v60)
window.serverTriggers = serverTriggers;
window.localTriggers = localTriggers;
window.isTriggerEnabled = isTriggerEnabled;
window.setTriggerEnabled = setTriggerEnabled;
window.setServerTriggers = setServerTriggers;
window.setLocalTriggers = setLocalTriggers;
window.setTriggersEnabled = setTriggersEnabled;
window.getEnabledTriggerIds = getEnabledTriggerIds;

import { processImage } from '../utils/image-utils.js';
import { syncAlertsFromServer, migrateGuestAlerts, saveMasterAlertsLocally } from './alert-storage.js';
import { SocketHandlers } from './module-socket-handlers.js';
import SMPTECapture from './smpte-capture.js';

// --- [v60.Elite] Motor de Captura Global SMPTE ---
window.smpteCapture = new SMPTECapture();
// Nota: La clase SMPTECapture emite directamente al socket si se le asigna uno.
// Lo vincularemos dinámicamente cuando el socket esté disponible.
import { LocalizationManager } from './module-localization.js';
import {
    showGlobalToast,
    showCatFeedback,
    showStatusMessage,
    showCategoryNotification,
    scrollToBottom as utilsScrollToBottom,
    triggerVibration as utilsTriggerVibration,
    injectWebkitScrollbars
} from '../utils/ui-utils.js';

// Editor de alertas: UI y bindings (MVP)
import './alert-editor.js';
import { Alerts } from './module-alerts.js';

import {
    createFilterBar as libCreateFilterBar,
    updateCategorySelect as libUpdateCategorySelect,
    openCategoryManager as libOpenCategoryManager,
    renderCategoryManagerList as libRenderCategoryManagerList,
    filterMessages as libFilterMessages,
    getUserColor as utilsGetUserColor,
    getCategoryColor as utilsGetCategoryColor,
    getCategoryInfo as utilsGetCategoryInfo
} from './module-category-ui.js';

//  MDULOS REFACTORIZADOS - Importar aqu
import { DOMManager } from './module-dom-manager.js';
import { AudioStateManager } from './module-audio-state.js';
import { TriggersModule } from './module-triggers.js';
import { MessageRenderer } from './module-message-renderer.js';
import { AudioCapture } from './module-audio-capture.js';
import * as AudioUtils from './module-audio-utils.js';
import { SettingsUI } from './module-settings-ui.js';

// [v60.ELITE] INICIALIZACIN DE ESTADO MAESTRO
// Asegurar que audioState est disponible globalmente lo antes posible
const audioState = AudioStateManager.getInstance();
window.audioState = audioState;

/**
 * [v60.ELITE] Generador de Restricciones para Hardware Profesional
 * Determina el conteo de canales y el bypass de DSP según el dispositivo.
 */
window.getEliteConstraints = function(deviceId, label = '') {
    // Buscar etiqueta si no se proporciona pero tenemos ID
    if (!label && deviceId) {
        if (window.lastAudioDevices) {
            const found = window.lastAudioDevices.find(d => d.deviceId === deviceId);
            if (found && found.label) label = found.label;
        }
        if (!label && typeof document !== 'undefined') {
            const select = document.getElementById('audioDeviceSelect');
            if (select) {
                const opt = Array.from(select.options).find(o => o.value === deviceId);
                if (opt && opt.text) label = opt.text;
            }
        }
    }
    
    // Clasificar dispositivos profesionales y cables virtuales para habilitar captura multicanal pura sin downmixing de DSP
    // [v60.ELITE FIX - Sol.10] Neutralizar detección isPro en Safari iOS: etiquetas vacías sin permisos
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isPro = !isSafari && (!label || /soundgrid|waves|asio|focusrite|scarlett|dante|antelope|madi|motu|rme|presonus|steinberg|behringer|roland|yamaha|uaudio|volt|virtual|vb-audio|cable|vac|voicemeeter|hi-fi/i.test(label));
    const selectedChannel = (window.audioState && typeof window.audioState.get === 'function') ? (parseInt(window.audioState.get('inputChannel')) || 0) : 0;
    
    const baseConstraints = {
        deviceId: deviceId ? { exact: deviceId } : undefined
    };

    if (isPro) {
        // BYPASS DSP PRO: Desactivamos el procesado del navegador para preservar la integridad multicanal
        Object.assign(baseConstraints, {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
        });
        console.log(`🛡️ [ELITE] Activando BYPASS DSP PRO para: ${label || deviceId || 'Desconocido (Handshake)'}`);
        
        // [v60.ELITE] Si conocemos la capacidad real físicamente medida, obligamos a Chrome a respetarla.
        // Esto impide el downmix silencioso a estéreo que hace que el ruteo devuelva silencio.
        const knownCaps = deviceId ? localStorage.getItem(`talkme_caps_${deviceId}`) : null;
        if (knownCaps && parseInt(knownCaps) > 0) {
            baseConstraints.channelCount = { exact: parseInt(knownCaps) };
            console.log(`🎯 [ELITE] Forzando constraint exacto a ${knownCaps} canales para evitar downmix del OS.`);
        } else {
            baseConstraints.channelCount = { ideal: 32 };
        }
    } else {
        // Modo estándar para hardware consumer
        if (isSafari) {
            // [v60.ELITE FIX - Sol.10] En Safari iOS dejamos que WebKit gestione el stream sin forzar canales
            Object.assign(baseConstraints, {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            });
        } else {
            baseConstraints.channelCount = { ideal: Math.max(2, selectedChannel + 1) };
            Object.assign(baseConstraints, {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            });
        }
    }

    return { audio: baseConstraints };
};

// [v60.ELITE FIX - Sol.4] Comparador inteligente de dispositivos: resuelve colisiones "default" vs GUID
window.areDevicesIdentical = function(idA, idB) {
    if (idA === idB) return true;
    // Si uno de los dos es "default", resolver su correspondencia física
    if (idA === 'default' || idB === 'default') {
        const nonDefaultId = (idA === 'default') ? idB : idA;
        const device = (window.lastAudioDevices || []).find(d => d.deviceId === nonDefaultId);
        if (!device) return false;
        const defaultDevice = (window.lastAudioDevices || []).find(d => d.deviceId === 'default');
        if (defaultDevice && device.label && defaultDevice.label) {
            const cleanLabel = device.label.replace(/^(Predeterminado|Default)\s*-\s*/i, '');
            const cleanDefaultLabel = defaultDevice.label.replace(/^(Predeterminado|Default)\s*-\s*/i, '');
            return cleanLabel === cleanDefaultLabel;
        }
    }
    return false;
};

// [v60.ELITE] SONDA DE HARDWARE SILENCIOSA
// Ejecuta una captura breve para poblar labels y canales en la UI sin romper el PTT
async function runSilentHardwareProbe() {
    try {
        const preferredId = localStorage.getItem('talkme_preferred_audio_input') || localStorage.getItem('talkme_deviceId');
        
        let tempLabel = '';
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter(d => d.kind === 'audioinput');
            window.lastAudioDevices = audioInputs; // Relleno prematuro de caché
            if (preferredId) {
                const found = audioInputs.find(d => d.deviceId === preferredId);
                if (found && found.label) tempLabel = found.label;
            }
        } catch (e) {}

        const constraints = window.getEliteConstraints(preferredId, tempLabel);
        
        const tempStream = await navigator.mediaDevices.getUserMedia(constraints);
        const track = tempStream.getAudioTracks()[0];
        if (track) {
            // [v60.ELITE] Solo pedimos permiso y cerramos. 
            // La población real de la UI la hará getAudioDevices después.
            track.stop(); 
        }
    } catch (e) {
        // Si falla el preferido (ej. desconectado), intentamos permiso genérico para despertar al navegador con bypass preventivo
        try {
            const preferredId = localStorage.getItem('talkme_preferred_audio_input') || localStorage.getItem('talkme_deviceId') || 'default';
            const constraints = window.getEliteConstraints(preferredId, '');
            const genericStream = await navigator.mediaDevices.getUserMedia(constraints);
            genericStream.getAudioTracks().forEach(t => t.stop());
        } catch (inner) {}
    }
}

// [v60.ELITE] IGNICIÓN SECUENCIAL DE HARDWARE
async function igniteEliteHardware() {
    try {
        console.log('🚀 [ELITE] Iniciando ignición de hardware...');
        
        // Carga prematura si hay permisos
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const inputs = devices.filter(d => d.kind === 'audioinput');
            if (inputs.length > 0 && inputs[0].label) {
                window.lastAudioDevices = inputs;
            }
        } catch (e) {}

        // 1. Sonda silenciosa (Garantiza permisos y etiquetas)
        await runSilentHardwareProbe();
        
        // 2. Población de la UI (Ahora con etiquetas reales)
        if (window.getAudioDevices) {
            await window.getAudioDevices();
        } else {
            await getAudioDevices();
        }
    } catch (e) {
        console.warn('⚠️ [ELITE] Error en ignición secuencial', e);
    } finally {
        window.hardwareReady = true;
        if (window.resolveHardwareIgnition) {
            window.resolveHardwareIgnition();
        }
    }
}

// Inicialización controlada
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', igniteEliteHardware);
} else {
    igniteEliteHardware();
}

window.getAudioDevices = getAudioDevices;

// Instanciar singletons globales
const dom = DOMManager.getInstance();

const localization = new LocalizationManager(dom, audioState);
window.localization = localization; // Exportar para compatibilidad

// Puente de compatibilidad para etiquetas de navegacin (v60)
window.updateSettingsNavLabels = () => localization.updateSettingsNavLabels();

const settingsUI = new SettingsUI(dom, audioState, null, {
    showGlobalToast: (m, t, d) => window.showGlobalToast(m, t, d),
    showCatFeedback: (m, t) => window.showCatFeedback(m, t),
    openCategoryManager: () => window.openCategoryManager(),
    renderTriggersList: () => window.renderTriggersList(),
    updateLoginMasterButton: () => window.updateLoginMasterButton(),
    updateSettingsNavLabels: () => window.updateSettingsNavLabels()
});
window.settingsUI = settingsUI;
window.SettingsUIInstance = settingsUI;

const messageRenderer = new MessageRenderer(dom, audioState);
window.messageRenderer = messageRenderer;

const audioCapture = new AudioCapture(audioState, dom);
window.audioCapture = audioCapture;

// Inicializar Mdulo de Triggers (v59 Modularizacin)
const triggersModule = new TriggersModule(dom, audioState, (...args) => safeEmit(...args));
window.triggersModule = triggersModule; // Bridge para debugging

localization.init();

// [v60.Elite] Mostrar IP de forma inmediata usando fallback de URL actual
if (typeof updateDynamicIPDisplays === 'function') {
    updateDynamicIPDisplays(window.location.origin);
}
window.openTriggerForm = (...args) => triggersModule.openTriggerForm(...args);
window.renderTriggersList = () => triggersModule.renderTriggersList();
window.resetEditor = () => triggersModule.resetEditor();
window.closeTriggerForm = () => triggersModule.closeTriggerForm();
window.saveCurrentTrigger = () => triggersModule.saveCurrentTrigger();
window.renderSaveTriggerButtonLabel = (...args) => triggersModule.renderSaveTriggerButtonLabel(...args);

// Puentes de Captura de Audio (Sub-usuarios)
window.startSubUserCapture = (...args) => audioCapture.startSubUserCapture(...args);
window.stopSubUserCapture = (...args) => audioCapture.stopSubUserCapture(...args);
window.processSubUserAudioChunk = (...args) => audioCapture.processSubUserAudioChunk(...args);

// Adaptadores para simplificar las llamadas existentes
window.refreshMasterAdminTable = () => {
    if (typeof window.isMaster !== 'undefined' && window.isMaster && typeof masterAdminUI !== 'undefined') {
        masterAdminUI.updateUserTable();
    }
};
window.refreshMasterUI = () => {
    isMaster = window.isMaster;
    if (typeof updateLoginMasterButton === 'function') updateLoginMasterButton();
    if (typeof initModularSettings === 'function') initModularSettings();
};
//  PUENTES DE UTILIDADES (v60) - Necesarios para mdulos externos (Admin UI, etc)
window.getUserColor = (user, categoryName = null) => {
    const baseHex = categoryName ? window.getCategoryColor(categoryName) : null;
    return utilsGetUserColor(user, currentUsername, baseHex);
};

window.getCategoryColor = (cat) => utilsGetCategoryColor(cat, currentCategories);
window.getCategoryInfo = (cat) => utilsGetCategoryInfo(cat, currentCategories);
window.scrollToBottom = (smooth) => utilsScrollToBottom(messagesContainer, smooth);
// [v60.Elite] Funcin local para simplificar llamadas internas
const triggerVibration = (dur) => utilsTriggerVibration(isVibrationEnabled, dur);
window.triggerVibration = triggerVibration;

// ❍ DEBUG: VERIFICAR SISTEMA MODULAR
window.debugModularSystem = () => {
    console.log('❍ === SISTEMA MODULAR DEBUG ===');
    console.log(' DOMManager:', dom ? ' Activo' : ' ERROR');
    console.log(' AudioStateManager:', audioState ? ' Activo' : ' ERROR');
    console.log(' Localization:', localization ? ' Activo' : ' ERROR');
    console.log(' MessageRenderer:', messageRenderer ? ' Activo' : ' ERROR');
    console.log(' AudioCapture:', audioCapture ? ' Activo' : ' ERROR');
    console.log(' TriggersModule:', triggersModule ? ' Activo' : ' ERROR');
    console.log('❍ ============================');
};

// Exponer funciones necesarias para otros scripts no-mdulo
window.setServerTriggers = setServerTriggers;
window.setLocalTriggers = setLocalTriggers;
window.setTriggersEnabled = setTriggersEnabled;
window.renderTriggersList = () => triggersModule.renderTriggersList();
window.renderDictionary = renderDictionary;
window.applyLocales = applyLocales;

window.initAudioCtx = initAudioCtx;
window.playComfortNoise = playComfortNoise;
window.initTriggerWorker = initTriggerWorker;
window.executeKeyframeAnimation = executeKeyframeAnimation;
window.stopTriggerAnimation = stopTriggerAnimation;
window.fireTriggers = fireTriggers;
window.signalTriggerFire = (...args) => triggersModule.signalTriggerFire(...args);
window.safeEmit = safeEmit;

//  PUENTE DE COMPATIBILIDAD MODULAR (v60)
window.addMessage = addMessage;
window.updateUsersList = updateUsersList;
window.createFilterBar = libCreateFilterBar;
window.showSystemMessage = showSystemMessage;
window.showSystemAlert = (title, text) => showMessageAlert(title, text); // Alias
window.showMessageAlert = showMessageAlert;
window.addSystemMessage = addSystemMessage;
window.showGlobalToast = showGlobalToast;
window.showCatFeedback = showCatFeedback;
window.updateCategorySelect = libUpdateCategorySelect;
window.filterMessages = libFilterMessages;
window.renderCategoryManagerList = libRenderCategoryManagerList;
window.retranslateSystemMessages = retranslateSystemMessages;
window.getAudioDevices = getAudioDevices;
window.applyAudioOutput = applyAudioOutput;
window.setCurrentUsername = (u) => { 
    window.currentUsername = u; 
    if (typeof setCurrentUsername === 'function') setCurrentUsername(u);
    if (window.settingsUI && typeof window.settingsUI.restoreUserPreferences === 'function') {
        window.settingsUI.restoreUserPreferences();
    }
};
window.updateLoginMasterButton = updateLoginMasterButton;
window.renderDictionary = renderDictionary;
window.migrateTriggersStorage = migrateTriggersStorage;
window.performJoinChat = performJoinChat; // Corregido: antes apuntaba errneamente a startChat
window.sendFinalMessageWithBlob = sendFinalMessageWithBlob;
window.pcmToWav = pcmToWav;
window.updateDynamicIPDisplays = updateDynamicIPDisplays;
window.stopRecording = stopRecording;
window.queueOrEmit = queueOrEmit;
window.flushPendingEmitQueue = flushPendingEmitQueue;
window.startSpeechCapture = startSpeechCapture;
window.stopSubUserCapture = stopSubUserCapture;
window.initLangSwitchers = initLangSwitchers;
window.updateLangSwitcherUI = updateLangSwitcherUI;
window.updateMicButtonsUI = updateMicButtonsUI;
window.initThemeSwitchers = initThemeSwitchers;
window.initVoiceWave = initVoiceWave;
window.initTheme = initTheme;
window.initDNAPalette = initDNAPalette;
// NOTA: initWakeLockSystem, activateIOSAudioSession, etc. ya son globales (vienen de scripts no-mdulo)

// [v59.ModularSync] Exponer funciones de identidad para mdulos autnomos
window.getUserColor = getUserColor;
window.getCategoryColor = getCategoryColor;
window.getCategoryInfo = getCategoryInfo;

// [v60.FIX-A] Puente módulo ES → window para que module-socket-handlers.js
// pueda acceder a processedStreamIds (importado de audio-core.js como ES module).
// Sin esto, window.processedStreamIds es undefined y wasAlreadyStreamed nunca funciona.
window.processedStreamIds = processedStreamIds;

// ❢⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐
//  ARQUITECTURA TRIGGERS: SEPARACIN MOTOR / UI                               
//                                                                             
//  - trigger-engine.js: Motor de ejecucin de triggers.                        
//    ⬢ Evala mensajes y dispara triggers si hay coincidencia de palabras clave
//    ⬢ Ejecuta animaciones de keyframes (background, va trigger-worker.js)    
//    ⬢ Despacha comandos a hardware externo (MIDI, OSC, sACN)                 
//    ⬢ NO contiene UI ni lgica de edicin/gestin visual de triggers         
//                                                                             
//  - module-triggers.js: Mdulo de UI para gestin visual de triggers.         
//    ⬢ Permite crear, editar, listar y eliminar triggers desde la interfaz     
//    ⬢ Se comunica con trigger-engine.js para ejecutar/disparar triggers       
//    ⬢ NO ejecuta triggers ni interacta directamente con hardware            
//                                                                             
//  El orquestador (ui-controller-elite.js) importa ambos mdulos y los conecta.
//  La UI nunca ejecuta triggers directamente, y el motor nunca muestra ni edita
//  la lista visual. Esto garantiza modularidad y separacin de responsabilidades
// ⢡⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢝

// ⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐
//  NDICE MAESTRO DE NAVEGACIN - ui-controller-elite.js v59.Modular 17/04/2026
//
// 1A  LABELS & RECEPCIN DINMICA (Lneas 1128-1140)
//     - setMessageReceptionMode(), setAudioReceptionMode(): Actualizan dinmicamente los labels de modo de mensajes/audio en la UI de ajustes.
// ⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐⢐
//  ESTRUCTURA: Este archivo tiene ~6340 lneas (Optimizado tras modularizacin).
//    Para navegar, usa Ctrl+F + nmeros de seccin o nombres de funcin.
//
// ⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢
//  SECCIONES PRINCIPALES (En orden de aparicin - Actualizado v59.Modular)
// ⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢
//
// 1  IMPORTS & EXPORTS (Lneas 1-155)
//     - Mdulos core: audio-core, trigger-engine, dom-manager, audio-state, triggers.
//
// 2  DOM REFERENCES / COMPAT LAYER (Lneas 251-640)
//     - Puentes Object.defineProperty()  DOMManager (Singleton).
//
// 3  I18N / LOCALIZATION (Lneas 702-1282)
//     - Incluye patch de labels dinmicos y funciones de modo de recepcin (ver 1A)
//     - initI18n(), loadLocale(), applyLocales() [Sincronizacin v59.42].
//
// 4  THEME & COLOR DNA (Lneas 1307-1416)
//     - applyTheme(), applyColorDNA(), initDNAPalette().
//
// 5  MODULAR SETTINGS (Lneas 1418-1732)
//     - initModularSettings() [Idioma, Mic, Alertas, Master Admin].
//
// 6  HARDWARE STATUS & CAPS (Lneas 1734-1780)
//     - initHardwareStatus()  Adaptacin a capacidades reales del dispositivo.
//
// 7  COMPAT LAYER II (Lneas 1782-1934)
//     - Puentes para AudioOutput, Diccionario y Capacidad Hardware.
//
// 8  UTILITY HELPERS (Lneas 1936-1984)
//     - safeEmit() [v59.Enhanced], signalFire().
//
// 9  AUDIO OUTPUT & MUTE (Lneas 1986-2239)
//     - getAudioDevices(), applyAudioOutput(), setMute().
//
// ❸  PCM PROCESSING & BUFFERS (Lneas 2241-2272)
//     - downsampleBuffer() [Crtico para STT], concatenateFloat32Arrays().
//
// 11 DICTIONARY & BRIDGES (Lneas 2274-2412)
//     - renderDictionary(), createFilterBar, openCategoryManager.
//
// 12 INITIALIZATION (DOMContentLoaded) (Lneas 2414-2580)
//
// 13 TERMS & INTERFACE BINDINGS (Lneas 2590-2669)
//
// 14 PTT ENGINE (Lneas 2671-2765)
//     - setupUnifiedPTTHandlers() [Consolidacin Tctil/Desktop].
//
// 15 ATTACHMENTS & IMAGE VIEWER (Lneas 2767-2916)
//
// 16 GENERAL UI CONTROLS (Lneas 2918-3312)
//
// 17 NETWORK UTILS & IP (Lneas 3314-3412)
//     - updateDynamicIPDisplays() [Header + Login Sync].
//
// 18 SOCKET.IO MONOLITH (Lneas 3414-4212)
//     - initSocket()  El cerebro de la comunicacin (~800 lneas).
//
// 19 CHAT START & RECORDING (Lneas 4214-4562)
//
// 20 AUDIO ANALYSIS & WORKLETS (Lneas 4564-5090)
//     - setupAudioAnalysis()  Pipeline de captura y Wave visualizer.
//
// 21 SPEECH CAPTURE & VOSK (Lneas 5092-5487)
//     - startSpeechCapture()  Flujo de transcripcin en tiempo real.
//
// 22 MESSAGES RENDER & DISPLAY (Lneas 5489-5945)
//     - addMessage()  Monolito de renderizado de burbujas.
//
// 23 SYSTEM & ALERTS (Lneas 5947-6193)
//     - showMessageAlert(), updateUsersList(), retranslateSystemMessages().
//
// ⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢
// ❴ MONOLITOS CRTICOS (Ubicacin verificada v59.Modular)
// ⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢
// 1. initSocket() [Lnea 3414]
// 2. initModularSettings() [Lnea 1418]
// 3. applyLocales() [Lnea 745]
// 4. addMessage() [Lnea 5489]
// 5. setupAudioAnalysis() [Lnea 4564]
// ⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢
//
//  QUICK REFERENCE - Bsquedas rpidas (Ctrl+F)
// ⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢
// MDULOS CRTICOS                    VAYA A                  BUSQUE
// ⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢                   ⬢⬢⬢⬢⬢⬢                 ⬢⬢⬢⬢⬢
// Eventos de Red (Socket.IO)           Lnea 3414              function initSocket()
// Modal de Ajustes                     Lnea 1418              function initModularSettings()
// Render de Mensajes                   Lnea 5489              function addMessage(
// Traduccin Proactiva                 Lnea 745               function applyLocales()
// PTT (Push-To-Talk)                   Lnea 2671              function setupUnifiedPTTHandlers
// Captura de Voz (STT)                 Lnea 5092              function startSpeechCapture
// Manager de Categoras                Lnea 2342              function openCategoryManager
// Cambio de Tema                       Lnea 1307              function applyTheme
// IP Dinmica                          Lnea 3314              function updateDynamicIPDisplays
// Pipeline de Audio                    Lnea 4564              function setupAudioAnalysis
// ⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢
//
// ❧ CAPA DE COMPATIBILIDAD - Referencias DOM va DOMManager
// Reemplaza 72+ variables globales por getters centralizados.
// ⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢
// --- MODALS ---
Object.defineProperty(window, 'userModal', { get: () => dom.get('modals', 'user'), configurable: true });
Object.defineProperty(window, 'settingsModal', { get: () => dom.get('modals', 'settings'), configurable: true });
Object.defineProperty(window, 'triggersModal', { get: () => dom.get('modals', 'triggers'), configurable: true });
Object.defineProperty(window, 'termsModal', { get: () => dom.get('modals', 'terms'), configurable: true });
Object.defineProperty(window, 'imageViewer', { get: () => dom.get('modals', 'imageViewer'), configurable: true });

// --- CHAT ---
Object.defineProperty(window, 'messagesContainer', { get: () => dom.get('chat', 'container'), configurable: true });
Object.defineProperty(window, 'textInput', { get: () => dom.get('chat', 'input'), configurable: true });
Object.defineProperty(window, 'transcriptionBox', { get: () => dom.get('chat', 'transcriptionBox'), configurable: true });
Object.defineProperty(window, 'transcriptionText', { get: () => dom.get('chat', 'transcriptionText'), configurable: true });

// --- AUDIO ---
Object.defineProperty(window, 'btnMic', { get: () => dom.get('buttons', 'mic'), configurable: true });
Object.defineProperty(window, 'audioDeviceSelect', { get: () => dom.get('audio', 'deviceSelect'), configurable: true });
Object.defineProperty(window, 'audioDeviceChannelSelect', { get: () => dom.get('audio', 'deviceChannelSelect'), configurable: true });
Object.defineProperty(window, 'audioOutputSelect', { get: () => dom.get('audio', 'outputSelect'), configurable: true });
Object.defineProperty(window, 'audioOutputChannelSelect', { get: () => dom.get('audio', 'outputChannelSelect'), configurable: true });
Object.defineProperty(window, 'audioOutputContainer', { get: () => dom.get('audio', 'outputContainer'), configurable: true });

// --- BUTTONS ---
Object.defineProperty(window, 'btnSend', { get: () => dom.get('buttons', 'send'), configurable: true });
Object.defineProperty(window, 'btnSendText', { get: () => dom.get('buttons', 'sendText'), configurable: true });
Object.defineProperty(window, 'btnSendIcon', { get: () => dom.get('buttons', 'sendIcon'), configurable: true });
Object.defineProperty(window, 'btnSendArrowIcon', { get: () => dom.get('buttons', 'sendArrowIcon'), configurable: true });
Object.defineProperty(window, 'btnStart', { get: () => dom.get('buttons', 'start'), configurable: true });
Object.defineProperty(window, 'btnAttach', { get: () => dom.get('buttons', 'attach'), configurable: true });
Object.defineProperty(window, 'btnOpenMainSettings', { get: () => dom.get('buttons', 'openSettings'), configurable: true });
Object.defineProperty(window, 'btnCloseSettings', { get: () => dom.get('buttons', 'closeSettings'), configurable: true });
Object.defineProperty(window, 'btnAddWord', { get: () => dom.get('buttons', 'addWord'), configurable: true });
Object.defineProperty(window, 'btnOpenTerms', { get: () => dom.get('buttons', 'openTerms'), configurable: true });
Object.defineProperty(window, 'btnCloseTerms', { get: () => dom.get('buttons', 'closeTerms'), configurable: true });
Object.defineProperty(window, 'btnFontUp', { get: () => dom.get('buttons', 'fontUp'), configurable: true });
Object.defineProperty(window, 'btnFontDown', { get: () => dom.get('buttons', 'fontDown'), configurable: true });
Object.defineProperty(window, 'btnManageCategories', { get: () => dom.get('buttons', 'manageCategories'), configurable: true });
Object.defineProperty(window, 'btnManageCategoriesLogin', { get: () => dom.get('buttons', 'manageCategoriesLogin'), configurable: true });

// 3 STATE & CONFIG
// [v59.18] NOTA: Muchas variables de estado ahora residen en AudioStateManager
// para evitar desincronizacin (Split-Brain) entre mdulos.
// Reducir variables locales que ahora son parte del bridge
let _vosk_status_received = false;

// --- STATUS INDICATORS ---
Object.defineProperty(window, 'statusIndicator', { get: () => dom.get('status', 'indicator'), configurable: true });
Object.defineProperty(window, 'statusIndicatorText', { get: () => dom.get('status', 'indicatorText'), configurable: true });
Object.defineProperty(window, 'connectionStatus', { get: () => dom.get('status', 'connection'), configurable: true });
Object.defineProperty(window, 'userSpeakingIndicator', { get: () => dom.get('status', 'speakingUser'), configurable: true });
Object.defineProperty(window, 'volumeLevel', { get: () => dom.get('status', 'volumeLevel'), configurable: true });
Object.defineProperty(window, 'usersList', { get: () => dom.get('status', 'usersList'), configurable: true });
Object.defineProperty(window, 'usersListTitle', { get: () => dom.get('status', 'usersListTitle'), configurable: true });
Object.defineProperty(window, 'speakingUser', { get: () => dom.get('status', 'speakingUserDisplay'), configurable: true });

// --- CONTROLS ---
Object.defineProperty(window, 'globalLangSwitcher', { get: () => dom.get('controls', 'langSwitcher'), configurable: true });
Object.defineProperty(window, 'usernameInput', { get: () => dom.get('controls', 'usernameInput'), configurable: true });
Object.defineProperty(window, 'sendAudioToggle', { get: () => dom.get('controls', 'sendAudio'), configurable: true });
Object.defineProperty(window, 'autoPlayToggle', { get: () => dom.get('controls', 'autoPlay'), configurable: true });
Object.defineProperty(window, 'vibrationToggle', { get: () => dom.get('controls', 'vibration'), configurable: true });
Object.defineProperty(window, 'flashlightToggle', { get: () => dom.get('controls', 'flashlight'), configurable: true });
Object.defineProperty(window, 'micSensitivity', { get: () => dom.get('controls', 'micSensitivity'), configurable: true });
Object.defineProperty(window, 'cacheLimitSlider', { get: () => dom.get('controls', 'cacheLimitSlider'), configurable: true });
Object.defineProperty(window, 'cacheLimitValue', { get: () => dom.get('controls', 'cacheLimitValue'), configurable: true });
Object.defineProperty(window, 'autoDeleteToggle', { get: () => dom.get('controls', 'autoDelete'), configurable: true });
Object.defineProperty(window, 'messagesModeSelect', { get: () => dom.get('controls', 'messagesMode'), configurable: true });
Object.defineProperty(window, 'micModeSelect', { get: () => dom.get('controls', 'micMode'), configurable: true });
Object.defineProperty(window, 'fontSizeRange', { get: () => dom.get('controls', 'fontSizeRange'), configurable: true });
Object.defineProperty(window, 'fontSizeDisplay', { get: () => dom.get('controls', 'fontSizeDisplay'), configurable: true });

// --- DICTIONARY ---
Object.defineProperty(window, 'dictFrom', { get: () => dom.get('dictionary', 'from'), configurable: true });
Object.defineProperty(window, 'dictTo', { get: () => dom.get('dictionary', 'to'), configurable: true });

// --- MAPPING DE UI ADICIONAL ---
Object.defineProperty(window, 'panelToggle', { get: () => dom.get('ui', 'panel'), configurable: true });
Object.defineProperty(window, 'container', { get: () => dom.get('ui', 'container'), configurable: true });
Object.defineProperty(window, 'mainLogo', { get: () => dom.get('ui', 'logo'), configurable: true });

// --- CAPA DE COMPATIBILIDAD - AudioStateManager ---
// Puenteamos las variables de estado de audio para que el motor heredado siga funcionando

// --- Variables Locales de Alta Frecuencia (Mirroring Strategy para Rendimiento) ---
// Estas variables residen en el scope del mdulo para acceso O(1) durante los bucles de audio.
// Se sincronizan con el bridge global solo en eventos significativos para no saturar el hilo UI.
/**
 * [v59.27] FUNCIN CENTRALIZADA DE AUTORIZACIN DE SESIN
 * Unifica todos los puntos de 'join-chat' para evitar race conditions y duplicidad.
 */
async function performJoinChat(reason = 'unknown') {
    if (!currentUsername) return;
    
    // Esperar a que la ignición del hardware esté completa antes de proceder
    if (window.hardwareIgnitionPromise) {
        await window.hardwareIgnitionPromise;
    }
    
    // Idempotencia Atómica v60: Evitar múltiples join-chat redundantes
    const joinState = audioState.get('joinState');
    if (joinState === 'JOINING' || joinState === 'JOINED') {
        console.debug(` [Network] Omitiendo join-chat (${reason}): Estado actual es ${joinState}`);
        return;
    }

    // Flood Control de seguridad (Legacy fallback)
    const now = Date.now();
    const lastJoin = audioState.get('lastJoinEmitAt') || 0;
    if (now - lastJoin < 1500) return; 

    audioState.setState({ 
        joinState: 'JOINING',
        lastJoinEmitAt: now 
    });

    // ---  NEW: Sync alerts from server when identifying ---
    try { 
        migrateGuestAlerts(currentUsername);
        syncAlertsFromServer(currentUsername); 
    } catch(e) { console.warn('Error syncing alerts:', e); }

    const categoryNames = Array.isArray(selectedCategories)
        ? selectedCategories.filter(c => c).map(c => typeof c === 'string' ? c : (c.id || c.name || c))
        : [];

    const pinInputValue = document.getElementById('pinInput') ? document.getElementById('pinInput').value.trim() : '';

    let savedLangs = [];
    try {
        const raw = localStorage.getItem('talkme_translate_langs');
        if (raw) {
            savedLangs = JSON.parse(raw);
        }
    } catch(e) {}

    const payload = {
        username: currentUsername,
        roomPin: currentRoomPin || pinInputValue,
        categories: categoryNames,
        lang: currentLang || document.documentElement.lang || 'es',
        sessionToken: localStorage.getItem('talkme_session_token') || null,
        aiSettings: {
            autoTranslate: localStorage.getItem('talkme_translate_enabled') === 'true',
            showOriginal: localStorage.getItem('talkme_translate_show_orig') === 'true',
            enabledLangs: savedLangs,
            protectedWords: (localStorage.getItem('talkme_translate_exclude') || '').split(',').map(s => s.trim()).filter(s => s.length > 0)
        },
        enabledTriggerIds: getEnabledTriggerIds()
    };

    if (window.socket && window.socket.connected) {
        window.socket.emit('join-chat', payload);
        window.socket.emit('get-messages');

        // [v60.Elite] MASTER HANDSHAKE: Asegurar que el micro y cámara se activen al entrar (Interacción garantizada)
        // [v60.Elite] OPTIMIZACIÓN: En modo PTT no arrancamos el micro por defecto para evitar el punto rojo innecesario.
        if (typeof Hardware.solicitarPermisosChat === 'function') {
            const currentMode = (typeof audioState !== 'undefined') ? audioState.get('micMode') : 'ptt';
            
            console.log("🛡️ [HARDWARE] Iniciando Master Handshake de hardware en el Join...");
            Hardware.solicitarPermisosChat().then(results => {
                // [v60.Elite] Sincronización proactiva de linterna según preferencia guardada
                const savedFlashlight = localStorage.getItem('talkme_flashlight_alerts') === 'true';
                window.isFlashlightEnabled = savedFlashlight;
                
                // Actualizar UI si el modal está abierto
                const toggle = document.getElementById('flashlightToggleAlt');
                if (toggle) toggle.checked = savedFlashlight;

                // [v60.Elite] Gestión inteligente del micrófono según el modo
                if (results.audio && currentMode !== 'ptt' && typeof startRecording === 'function') {
                    startRecording().catch(e => console.warn("⚠️ Audio Init diferido:", e));
                } else {
                    console.log(`🛡️ [AUDIO] Modo ${currentMode.toUpperCase()}: Hardware validado. Esperando interacción para capturar.`);
                    if (typeof updateMicButtonsUI === 'function') updateMicButtonsUI();
                }
            });
        }
    }
}
let voskInitDate = Date.now();

Object.defineProperty(window, 'isRecording', {
    get: () => audioState.get('isRecording'),
    set: (v) => audioState.setState({ isRecording: v }),
    configurable: true
});
Object.defineProperty(window, 'isCapturingSpeech', {
    get: () => audioState.get('isCapturingSpeech'),
    set: (v) => audioState.setState({ isCapturingSpeech: v }),
    configurable: true
});
Object.defineProperty(window, 'streamingId', {
    get: () => audioState.get('streamingId'),
    set: (v) => audioState.setState({ streamingId: v }),
    configurable: true
});
Object.defineProperty(window, 'activeStreamingIdForVosk', {
    get: () => audioState.get('activeStreamingIdForVosk'),
    set: (v) => audioState.setState({ activeStreamingIdForVosk: v }),
    configurable: true
});

Object.defineProperty(window, 'micMode', {
    get: () => audioState.get('micMode'),
    set: (v) => audioState.setState({ micMode: v }),
    configurable: true
});
Object.defineProperty(window, 'transcriptionMode', {
    get: () => audioState.get('transcriptionMode'),
    set: (v) => audioState.setState({ transcriptionMode: v }),
    configurable: true
});
Object.defineProperty(window, 'voskConfirmedSegments', {
    get: () => audioState.get('voskConfirmedSegments'),
    set: (v) => audioState.setState({ voskConfirmedSegments: v }),
    configurable: true
});
Object.defineProperty(window, 'messageSentForCurrentCapture', {
    get: () => audioState.get('messageSentForCurrentCapture'),
    set: (v) => audioState.setState({ messageSentForCurrentCapture: v }),
    configurable: true
});
Object.defineProperty(window, 'currentBrowserText', {
    get: () => audioState.get('currentBrowserText'),
    set: (v) => audioState.setState({ currentBrowserText: v }),
    configurable: true
});
Object.defineProperty(window, 'pendingBrowserTranscript', {
    get: () => audioState.get('pendingBrowserTranscript'),
    set: (v) => audioState.setState({ pendingBrowserTranscript: v }),
    configurable: true
});
Object.defineProperty(window, 'currentSensitivity', {
    get: () => audioState.get('currentSensitivity'),
    set: (v) => audioState.setState({ currentSensitivity: v }),
    configurable: true
});
Object.defineProperty(window, 'mediaStream', {
    get: () => audioState.get('mediaStream'),
    set: (v) => audioState.setState({ mediaStream: v }),
    configurable: true
});
Object.defineProperty(window, 'mediaRecorder', {
    get: () => audioState.get('mediaRecorder'),
    set: (v) => audioState.setState({ mediaRecorder: v }),
    configurable: true
});
Object.defineProperty(window, 'audioContext', {
    get: () => audioState.get('audioContext'),
    set: (v) => audioState.setState({ audioContext: v }),
    configurable: true
});
Object.defineProperty(window, 'audioProcessor', {
    get: () => audioState.get('audioProcessor'),
    set: (v) => audioState.setState({ audioProcessor: v }),
    configurable: true
});
Object.defineProperty(window, 'analyser', {
    get: () => audioState.get('analyser'),
    set: (v) => audioState.setState({ analyser: v }),
    configurable: true
});
Object.defineProperty(window, 'audioChunks', {
    get: () => audioState.get('audioChunks'),
    set: (v) => audioState.setState({ audioChunks: v }),
    configurable: true
});
Object.defineProperty(window, 'audioBlobUrls', {
    get: () => audioState.get('audioBlobUrls'),
    set: (v) => audioState.setState({ audioBlobUrls: v }),
    configurable: true
});
Object.defineProperty(window, 'activeAudioElements', {
    get: () => audioState.get('activeAudioElements'),
    set: (v) => audioState.setState({ activeAudioElements: v }),
    configurable: true
});

Object.defineProperty(window, 'isWaitingForVosk', {
    get: () => audioState.get('isWaitingForVosk'),
    set: (v) => audioState.setState({ isWaitingForVosk: v }),
    configurable: true
});
Object.defineProperty(window, 'isPTTActive', {
    get: () => audioState.get('isPTTActive'),
    set: (v) => audioState.setState({ isPTTActive: v }),
    configurable: true
});
Object.defineProperty(window, 'currentStreamSeq', {
    get: () => audioState.get('currentStreamSeq'),
    set: (v) => audioState.setState({ currentStreamSeq: v }),
    configurable: true
});
Object.defineProperty(window, 'pendingAudioBlob', {
    get: () => audioState.get('pendingAudioBlob'),
    set: (v) => audioState.setState({ pendingAudioBlob: v }),
    configurable: true
});
Object.defineProperty(window, 'pendingAudioBlobUrl', {
    get: () => audioState.get('pendingAudioBlobUrl'),
    set: (v) => audioState.setState({ pendingAudioBlobUrl: v }),
    configurable: true
});
Object.defineProperty(window, 'pendingMimeType', {
    get: () => audioState.get('pendingMimeType'),
    set: (v) => audioState.setState({ pendingMimeType: v }),
    configurable: true
});
Object.defineProperty(window, 'selectedCategories', {
    get: () => audioState.get('selectedCategories'),
    set: (v) => audioState.setState({ selectedCategories: v }),
    configurable: true
});
Object.defineProperty(window, 'autoPlayRealtime', {
    get: () => audioState.get('autoPlayRealtime'),
    set: (v) => audioState.setState({ autoPlayRealtime: v }),
    configurable: true
});
Object.defineProperty(window, 'isMuted', {
    get: () => audioState.get('isMuted'),
    set: (v) => audioState.setState({ isMuted: v }),
    configurable: true
});
Object.defineProperty(window, 'activeFilters', {
    get: () => audioState.get('activeFilters'),
    set: (v) => audioState.setState({ activeFilters: v }),
    configurable: true
});

// --- Estado i18n y Preferencias ---
// --- Estado i18n y Preferencias (Bridges v59.20) ---
Object.defineProperty(window, 'currentLang', {
    get: () => audioState.get('currentLang'),
    set: (v) => audioState.setState({ currentLang: v }),
    configurable: true
});
Object.defineProperty(window, 'currentTheme', {
    get: () => audioState.get('currentTheme'),
    set: (v) => audioState.setState({ currentTheme: v }),
    configurable: true
});
Object.defineProperty(window, 'currentFontSizePercent', {
    get: () => audioState.get('fontSizePercent'),
    set: (v) => audioState.setState({ fontSizePercent: v }),
    configurable: true
});
Object.defineProperty(window, 'currentFontWeight', {
    get: () => audioState.get('fontWeight'),
    set: (v) => audioState.setState({ fontWeight: v }),
    configurable: true
});
Object.defineProperty(window, 'transcriptionOnly', {
    get: () => audioState.get('transcriptionOnly'),
    set: (v) => audioState.setState({ transcriptionOnly: v }),
    configurable: true
});
Object.defineProperty(window, 'isScreenAlertEnabled', {
    get: () => audioState.get('isScreenAlertEnabled'),
    set: (v) => audioState.setState({ isScreenAlertEnabled: v }),
    configurable: true
});
Object.defineProperty(window, 'isFlashlightEnabled', {
    get: () => audioState.get('isFlashlightEnabled'),
    set: (v) => audioState.setState({ isFlashlightEnabled: v }),
    configurable: true
});
Object.defineProperty(window, 'isVibrationEnabled', {
    get: () => audioState.get('isVibrationEnabled'),
    set: (v) => audioState.setState({ isVibrationEnabled: v }),
    configurable: true
});

// --- Puentes de Sesin (v59.20 - Single Source of Truth) ---
Object.defineProperty(window, 'currentUsername', {
    get: () => audioState.get('currentUsername'),
    set: (v) => audioState.setState({ currentUsername: v }),
    configurable: true
});
Object.defineProperty(window, 'isMaster', {
    get: () => audioState.get('isMaster'),
    set: (v) => audioState.setState({ isMaster: v }),
    configurable: true
});
Object.defineProperty(window, 'currentRoomPin', {
    get: () => audioState.get('currentRoomPin'),
    set: (v) => audioState.setState({ currentRoomPin: v }),
    configurable: true
});
Object.defineProperty(window, 'currentCategories', {
    get: () => audioState.get('currentCategories'),
    set: (v) => audioState.setState({ currentCategories: v }),
    configurable: true
});

// --- Persistencia Hbrida (SessionStorage v59.20) ---
/**
 * Guarda el estado actual de la sesin en SessionStorage para recuperacin tras recarga.
 */
function saveLocalSession() {
    // Usar puentes globales (que apuntan a AudioStateManager)
    if (!currentUsername) return;
    const sessionData = {
        username: currentUsername,
        roomPin: currentRoomPin,
        categories: currentCategories,
        isMaster: window.isMaster,
        timestamp: Date.now()
    };
    sessionStorage.setItem('talkme_active_session', JSON.stringify(sessionData));
}

/**
 * Recupera datos de sesin guardados.
 */
function restoreLocalSession() {
    try {
        const raw = sessionStorage.getItem('talkme_active_session');
        if (!raw) return null;
        const data = JSON.parse(raw);
        // Expirar tras 24h
        if (Date.now() - data.timestamp > 86400000) {
            sessionStorage.removeItem('talkme_active_session');
            return null;
        }
        return data;
    } catch (e) { return null; }
}

// Exponer a window para compatibilidad
window.saveLocalSession = saveLocalSession;
window.restoreLocalSession = restoreLocalSession;
window.safeEmit = safeEmit;

window.showCustomConfirm = function(title, text, onAccept, onCancel) {
    const modal = document.getElementById('customConfirmModal');
    const titleEl = document.getElementById('customConfirmTitle');
    const textEl = document.getElementById('customConfirmText');
    const btnCancel = document.getElementById('btnConfirmCancel');
    const btnAccept = document.getElementById('btnConfirmAccept');
    
    if (!modal) {
        const ok = confirm(text);
        if (ok && typeof onAccept === 'function') onAccept();
        if (!ok && typeof onCancel === 'function') onCancel();
        return;
    }
    
    const locales = window.localesData || {};
    titleEl.textContent = title || locales.interface?.confirm_title || (locales.kicked?.title || 'Confirmación');
    textEl.textContent = text;
    if (btnCancel) btnCancel.textContent = locales.interface?.btn_cancel || (locales.subuser_modal?.btn_cancel || 'Cancelar');
    if (btnAccept) btnAccept.textContent = locales.interface?.btn_accept || (locales.subuser_modal?.btn_save || 'Aceptar');
    
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
    
    btnAccept.onclick = (e) => {
        if (e) e.preventDefault();
        modal.style.display = 'none';
        modal.classList.add('hidden');
        if (typeof onAccept === 'function') onAccept();
    };
    
    btnCancel.onclick = (e) => {
        if (e) e.preventDefault();
        modal.style.display = 'none';
        modal.classList.add('hidden');
        if (typeof onCancel === 'function') onCancel();
    };
};

// --- [v60] Global Mute Management ---
window.isGlobalMuted = false;
window.activeAudios = [];

window.registerActiveAudio = function(audio) {
    if (!audio) return;
    audio.muted = !!window.isGlobalMuted;
    window.activeAudios.push(audio);
    
    const cleanup = () => {
        window.activeAudios = window.activeAudios.filter(a => a !== audio);
    };
    audio.addEventListener('ended', cleanup);
    audio.addEventListener('pause', cleanup);
};

window.toggleGlobalMute = function() {
    window.isGlobalMuted = !window.isGlobalMuted;
    
    // 1. Update UI classes & SVG shapes
    const btn = document.getElementById('btnMuteGlobal');
    const waveOuter = document.getElementById('mute_wave_outer');
    const waveInner = document.getElementById('mute_wave_inner');
    const slash = document.getElementById('mute_slash');
    
    if (btn) {
        if (window.isGlobalMuted) {
            btn.classList.add('muted');
            if (waveOuter) waveOuter.style.display = 'none';
            if (waveInner) waveInner.style.display = 'none';
            if (slash) slash.style.display = 'block';
        } else {
            btn.classList.remove('muted');
            if (waveOuter) waveOuter.style.display = 'block';
            if (waveInner) waveInner.style.display = 'block';
            if (slash) slash.style.display = 'none';
        }
    }
    
    // 2. Mute/Unmute Web Audio (incoming voice streams)
    if (window._masterGain) {
        window._masterGain.gain.value = window.isGlobalMuted ? 0 : 1;
    }
    
    // 3. Mute/Unmute HTML5 audio elements
    window.activeAudios.forEach(audio => {
        try {
            audio.muted = !!window.isGlobalMuted;
        } catch (e) {
            console.warn("Failed to set muted status on registered audio:", e);
        }
    });

    // 3.5 Cancel active speech synthesis if muting
    if (window.isGlobalMuted && window.speechSynthesis) {
        try {
            window.speechSynthesis.cancel();
        } catch (e) {
            console.warn("Failed to cancel speech synthesis:", e);
        }
    }
    
    // 4. Electron native mute integration
    if (window.electronAPI && typeof window.electronAPI.setAudioMuted === 'function') {
        window.electronAPI.setAudioMuted(window.isGlobalMuted);
    }
};

// Wire the event listener once DOM is loaded or immediately if already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('btnMuteGlobal');
        if (btn) btn.addEventListener('click', window.toggleGlobalMute);
    });
} else {
    const btn = document.getElementById('btnMuteGlobal');
    if (btn) btn.addEventListener('click', window.toggleGlobalMute);
}

// Global key listener for 'M' key to toggle global mute
window.addEventListener('keydown', (e) => {
    if (e.key && e.key.toLowerCase() === 'm') {
        const active = document.activeElement;
        const tagName = active ? active.tagName.toLowerCase() : '';
        const isInput = tagName === 'input' || tagName === 'textarea' || (active && active.isContentEditable);
        if (!isInput) {
            const btn = document.getElementById('btnMuteGlobal');
            if (btn) {
                btn.click();
            }
        }
    }
});

// --- [v46.4.87] Color DNA (Puente de compatibilidad v60) ---
Object.defineProperty(window, 'currentDNA', {
    get: () => settingsUI.currentDNA,
    set: (v) => { settingsUI.currentDNA = v; }
});

// [v59.Elite] Ajustes globales del servidor
let serverGlobalSettings = null;

function applyGlobalSettingsFallback() {
    if (!serverGlobalSettings) return;

    let modified = false;

    // DNA
    if (!localStorage.getItem('talkme_dna_bg_primary') && serverGlobalSettings.dna) {
        currentDNA = { ...serverGlobalSettings.dna };
        applyColorDNA();
        modified = true;
    }

    // Tema
    if (!localStorage.getItem('talkme_theme') && serverGlobalSettings.theme) {
        currentTheme = serverGlobalSettings.theme;
        applyTheme(currentTheme);
        modified = true;
    }

    // Tipografa
    if (!localStorage.getItem('talkme_font_percent') && serverGlobalSettings.typography) {
        const { fontSize, fontWeight } = serverGlobalSettings.typography;
        if (fontSize) {
            localStorage.setItem('talkme_font_percent', fontSize);
            const knob = document.getElementById('fontSizeKnob');
            if (knob) {
                knob.dataset.value = fontSize;
                updateKnobVisuals(knob);
            }
            document.documentElement.style.setProperty('--chat-font-size', `${fontSize}%`);
        }
        if (fontWeight) {
            localStorage.setItem('talkme_font_weight', fontWeight);
            const knob = document.getElementById('fontWeightKnob');
            if (knob) {
                knob.dataset.value = fontWeight;
                updateKnobVisuals(knob);
            }
            document.documentElement.style.setProperty('--chat-font-weight', fontWeight);
        }
        modified = true;
    }

    if (modified) console.log(' Ajustes globales aplicados (Nivel: Fbrica/Master)');
}


/**
 * Inicializa el sistema de internacionalizacin (i18n).
 */
async function initI18n() {
    await localization.init();
    // [v60.Fix] Tras cargar locales, actualizar SOLO las etiquetas UI del modo de micro
    // SIN interrumpir ninguna captura activa (applyMicMode corta la grabacin si isRecording).
    // Usamos una ruta directa a los elementos para evitar la race condition.
    if (window.localesData) {
        const currentMode = document.getElementById('micModeSelect')?.value
                          || localStorage.getItem('talkme_mic_mode')
                          || 'ptt';
        const sidebarL = window.localesData?.sidebar || {};
        const audioL   = window.localesData?.audio   || {};
        const lblSensibilidad = document.getElementById('lblSensibilidad');
        const micControlTitle = document.getElementById('micControlTitle');
        if (currentMode === 'ptt') {
            if (lblSensibilidad) lblSensibilidad.textContent = sidebarL.lbl_sensibilidad_ptt || 'NIVEL DE ENTRADA';
            if (micControlTitle) micControlTitle.textContent = audioL.mic_level_ptt           || 'Nivel de Entrada';
        } else {
            if (lblSensibilidad) lblSensibilidad.textContent = sidebarL.lbl_sensibilidad      || 'NIVEL DE ENTRADA Y UMBRAL';
            if (micControlTitle) micControlTitle.textContent = audioL.mic_level               || 'Nivel de Entrada y Umbral';
        }
    }
}
/**
 * Carga un archivo de idioma y actualiza la UI.
 */
async function loadLocale(lang) {
    return localization.loadLocale(lang);
}

/**
 * Aplica los datos cargados de localesData a los elementos del DOM.
 */
function applyLocales() {
    const res = localization.applyLocales();
    // [v60.ContextualUI] Asegurar que el modo de micro mande sobre la traduccin
    if (typeof applyMicMode === 'function') {
        applyMicMode(window.micMode || 'ptt');
    }
    return res;
}


/**
 * Actualiza la visibilidad del botn de gestin de categoras en login segn el rol (Master)
 * [v59.Restoration]
 */
function updateLoginMasterButton() {
    const btn = document.getElementById('btnManageCategoriesLogin');
    if (btn) {
        // [v60.Elite] Usar isMasterCandidate para el modal de login, isMaster para la sesión activa
        btn.style.display = (window.isMasterCandidate || window.isMaster) ? 'flex' : 'none';
    }
}

// updateSettingsNavLabels movida a la cabecera (v60)

function updateLangSwitcherUI() {
    return localization.updateLangSwitcherUI();
}

function initLangSwitchers() {
    return localization.initLangSwitchers();
}

function applyTheme(theme) {
    return settingsUI.applyTheme(theme);
}

function initTheme() {
    applyTheme(audioState.get('currentTheme') || 'dark');
}

/**
 * [v46.4.87] Aplica los colores personalizados (Color DNA) a las variables CSS.
 */
function applyColorDNA() {
    return settingsUI.applyColorDNA();
}

function initDNAPalette() {
    return settingsUI.initDNAPalette();
}

function showGlobalSaveBtn() {
    return settingsUI.showGlobalSaveBtn();
}

function initThemeSwitchers() {
    return settingsUI.initThemeSwitchers();
}

function updateThemeUI() {
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === (audioState.get('currentTheme') || 'dark'));
    });
}


/**
 * Inicializa el nuevo men de ajustes modular.
 */
function initModularSettings() {
    return settingsUI.initModularSettings();
}



/**
 * Deteccin de Hardware y actualizacin de UI.
 */
async function initHardwareStatus() {
    return settingsUI.initHardwareStatus();
}


// ❧ Continuar capa de compatibilidad DOM - Ms referencias
Object.defineProperty(window, 'categoryFilterBar', {
    get: () => document.getElementById('categoryFilterBar'),
    configurable: true
});
Object.defineProperty(window, 'voiceWave', {
    get: () => dom.get('audio', 'voiceWave'),
    configurable: true
});
Object.defineProperty(window, 'globalToast', {
    get: () => dom.get('ui', 'globalToast'),
    configurable: true
});

// Elementos Envo de Fotos
Object.defineProperty(window, 'fileInput', {
    get: () => dom.get('ui', 'fileInput'),
    configurable: true
});
Object.defineProperty(window, 'imageModal', {
    get: () => dom.get('modals', 'imageViewer'),
    configurable: true
});
Object.defineProperty(window, 'fullImage', {
    get: () => dom.get('ui', 'imageFull'),
    configurable: true
});
Object.defineProperty(window, 'closeViewer', {
    get: () => dom.get('ui', 'imageCloseViewer'),
    configurable: true
});

// === SISTEMA DE DICCIONARIO MODULAR (v58) ===
// Eliminados getters globales de dictionaryModal por obsolescencia.
// Ahora se accede directamente va dom.get('dictionary', ...)
Object.defineProperty(window, 'dictionaryTags', {
    get: () => dom.get('dictionary', 'tags'),
    configurable: true
});

// Elementos Trminos de Servicio



//  [v59.20 CLEANUP] - Se elimin el bloque de adaptadores DOM redundantes.
// Todas las referencias (triggersModal, btnCloseTriggers, etc.) estn centralizadas en la capa superior.

//  FIX v59.FINAL  BUG#1 RESUELTO: Se eliminaron los Object.defineProperty de AudioStateManager
// para variables de audio locales. El problema era una duplicacin (split-brain):
//   - Variables `let` locales: isRecording, mediaStream, mediaRecorder, etc.
//   - Object.defineProperty en window.X apuntando a AudioStateManager (distinto objeto)
// El cdigo del mdulo usaba las variables `let` locales (correcto), pero cualquier
// verificacin desde window.isRecording lea AudioStateManager (desincronizado  siempre false).
// Solucin: Eliminar los defineProperty conflictivos. Las variables `let` locales son la fuente
// de verdad. AudioStateManager se mantiene para funcionalidad futura.
// Los adaptadores de DOM (userModal, messagesContainer, etc.) se mantienen  no tienen conflicto.


// ============================================================
// === TRIGGER MIDI / OSC ENGINE (Keyframe Editor) ===
// ============================================================
//
//  NDICE DE NAVEGACIN - Keyframes & Triggers
// ❢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢❐
//  1. STATE VARIABLES                          ~Lnea 996   
//  2. UTILITY HELPERS (safeEmit, signalFire)   ~Lnea 1095  
//  3. PREVIEW FUNCTIONS (start/pause/stop)     ~Lnea 1252  
//  4. CANVAS CONVERSION (timelinecanvas)      ~Lnea 1493  
//  5. CANVAS DRAWING (grid, curve, keyframes)  ~Lnea 1507  
//  6. CANVAS INTERACTION (mouse/touch)         ~Lnea 1678  
//  7. KEYFRAMES MANAGEMENT (add/edit/delete)   ~Lnea 1749  
//  8. TRIGGER EDITOR & FORMS (open/save/del)   ~Lnea 1930  
//  9. TRIGGERS LIST RENDERING (display)        ~Lnea 2136  
//  10. INITIALIZATION (setUp listeners)        ~Lnea 1138  
// ❢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢
//  QUICK REFERENCE:
//   - Canvas visual system: sections 4-6
//   - Data management: sections 1, 7
//   - User interaction: sections 3, 6, 8, 9
//   - Initialization: section 10
//   - Helper utilities: section 2
//

// Lgica de Trigger Worker extrada a trigger-engine.js

// Eliminado startBackgroundKeepAlive: centralizado en ios-audio-session.js para evitar interferencias audibles.

// Funciones de red para Triggers extradas a trigger-engine.js
// Variables MIDI y Triggers extradas a trigger-engine.js

// ⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢
//  SECTION 1: STATE VARIABLES
// Session state, config, and UI variables
// Lines: 995-1075
// ⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢

//  [v59.20 CLEANUP] - Se elimin la declaracin de puentes locales recursivos.
// Las variables de sesin (currentUsername, isMaster, etc.) se gestionan ahora
// exclusivamente va AudioStateManager desde la capa de compatibilidad superior.
// Funciones de sesin migradas a la capa superior.

// --- Lgica del Editor de Triggers ---
// Toda la lgica visual, el canvas, la gestin de keyframes y los formularios
// han sido migrados al mdulo autnomo 'module-triggers.js' (TriggersModule).
// Se mantienen los puentes de compatibilidad globales al inicio de este archivo.

// injectWebkitScrollbars movida a ui-utils.js
injectWebkitScrollbars();

// ⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢
// ⺠  SECTION 2: UTILITY HELPERS
// Core helper functions used throughout triggers
// Lines: 1089-1109
// ⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢⬢

// Safe Emit Helper: prevents crashes if socket isn't ready + v59.1 Enhanced for Firefox
function safeEmit(event, data, callback) {
    // Validacin mejorada: 1. Socket existe, 2. Socket conectado, 3. Socket tiene emit
    if (!window.socket) {
        console.warn(` safeEmit FAIL: Socket no existe | event=${event}`);
        return false;
    }

    if (!window.socket.connected) {
        console.warn(` safeEmit FAIL: Socket desconectado | event=${event} | state=${window.socket.disconnected ? 'disconnected' : 'unknown'}`);
        // Intentar reconectar si es crtico y ha pasado tiempo suficiente (throttle 2s)
        const now = Date.now();
        if (!window._lastSocketReconnectAttempt || (now - window._lastSocketReconnectAttempt > 2000)) {
            if (['vosk-chunk', 'audio-stream-chunk', 'send-message'].includes(event) && window.socket.connect) {
                console.log(' Intentando reconectar Socket.IO (Throttled)...');
                window._lastSocketReconnectAttempt = now;
                window.socket.connect();
            }
        }
        return false;
    }

    if (typeof window.socket.emit !== 'function') {
        console.error(` safeEmit FAIL: socket.emit no es funcin | event=${event}`);
        return false;
    }

    try {
        if (callback) {
            window.socket.emit(event, data, callback);
        } else {
            window.socket.emit(event, data);
        }
        return true;
    } catch (e) {
        console.error(` safeEmit exception | event=${event} | error=${e.message}`);
        return false;
    }
}

// [v60.1] [ELECTRON-READY] Global Audio Unlocker: Garantizar que el AudioContext esté autorizado proactivamente.
// Nota: Útil en Electron si no se desactiva explícitamente la política de autoplay.
const unlockAudioContext = () => {
    if (audioState.get('audioContextAuthorized')) return;
    
    console.log('🔓 [Audio] Intentando desbloqueo global proactivo...');
    const ctx = (typeof window.initAudioCtx === 'function') ? window.initAudioCtx() : null;
    
    if (ctx) {
        ctx.resume().then(() => {
            console.log('✅ [Audio] AudioContext autorizado y activo.');
            audioState.setState({ audioContextAuthorized: true });
            // Eliminar listeners tras el éxito
            document.removeEventListener('mousedown', unlockAudioContext);
            document.removeEventListener('touchstart', unlockAudioContext);
            document.removeEventListener('keydown', unlockAudioContext);
        }).catch(err => {
            console.warn('⚠️ [Audio] Fallo en el desbloqueo proactivo:', err);
        });
    }
};
window.addEventListener('mousedown', unlockAudioContext, true);
window.addEventListener('touchstart', unlockAudioContext, { capture: true, passive: true });
window.addEventListener('keydown', unlockAudioContext, true);

// [v60.1] Feedback de Hardware: Notificar restricciones de MIDI
audioState.subscribe((old, state) => {
    if (state.isMidiRestricted && !old.isMidiRestricted) {
        const msg = window.localesData?.alerts?.midi_restricted || '🎹 WebMIDI restringido (Host IP). Triggers MIDI deshabilitados.';
        if (typeof window.showCatFeedback === 'function') {
            window.showCatFeedback(msg, 'warning');
        }
    }
});

// --- Init MIDI (llamado al cargar la pgina) ---
initMIDI();

// --- Device stream cache helpers ---
window._deviceStreamCache = window._deviceStreamCache || {};
window._deviceStreamCacheMax = window._deviceStreamCacheMax || 6; // max cached device streams
window._deviceStreamCacheTTL = window._deviceStreamCacheTTL || (5 * 60 * 1000); // 5 minutes TTL

window._deviceStreamCacheCleanup = function () {
    try {
        const entries = Object.keys(window._deviceStreamCache).map(k => ({ id: k, ts: window._deviceStreamCache[k].createdAt || 0 }));
        const now = Date.now();
        // Remove expired
        entries.forEach(e => {
            if (now - e.ts > window._deviceStreamCacheTTL) {
                try { const s = window._deviceStreamCache[e.id]; if (s && s.stream && s.stream.getTracks) s.stream.getTracks().forEach(t => t.stop()); } catch (_) { }
                try { delete window._deviceStreamCache[e.id]; } catch (_) { }
                console.debug(' deviceStreamCache: removed expired', e.id);
            }
        });
        // Enforce max size (LRU by createdAt)
        const remaining = Object.keys(window._deviceStreamCache).map(k => ({ id: k, ts: window._deviceStreamCache[k].createdAt || 0 }));
        if (remaining.length > window._deviceStreamCacheMax) {
            remaining.sort((a, b) => a.ts - b.ts); // oldest first
            const toRemove = remaining.slice(0, remaining.length - window._deviceStreamCacheMax);
            toRemove.forEach(r => {
                try { const s = window._deviceStreamCache[r.id]; if (s && s.stream && s.stream.getTracks) s.stream.getTracks().forEach(t => t.stop()); } catch (_) { }
                try { delete window._deviceStreamCache[r.id]; } catch (_) { }
                console.debug(' deviceStreamCache: evicted LRU', r.id);
            });
        }
    } catch (e) { console.warn('deviceStreamCacheCleanup error', e); }
};

/**
 * [v60.ELITE] Generador de Restricciones para Hardware Profesional
 * Reubicado al inicio del script para evitar Temporal Dead Zone durante el arranque.
 */



window._deviceStreamPromises = window._deviceStreamPromises || {};

window.getDeviceStream = async function (deviceId, options = {}) {
    const force = options.force || false;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no_media');
    if (!deviceId) deviceId = 'default';

    // 1. Si no forzamos, revisar si hay un stream live en caché
    const cached = window._deviceStreamCache[deviceId];
    if (!force && cached && cached.stream) {
        const tracks = cached.stream.getTracks ? cached.stream.getTracks() : [];
        const anyActive = tracks.some(t => t && t.readyState === 'live');
        if (anyActive) {
            console.debug('❁ getDeviceStream: cache hit for', deviceId);
            return cached.stream;
        }
        try { tracks.forEach(t => t.stop()); } catch (e) { }
        try { delete window._deviceStreamCache[deviceId]; } catch (e) { }
    }

    // 2. Si hay una promesa de getUserMedia activa para este deviceId y no forzamos, reutilizarla
    if (!force && window._deviceStreamPromises[deviceId]) {
        console.log('❁ getDeviceStream: Reutilizando promesa getUserMedia en curso para', deviceId);
        return window._deviceStreamPromises[deviceId];
    }

    // 3. Compartir el Stream del Master si coincide
    if (!force && window.mediaStream && window.mediaStream.active) {
        const masterTrack = window.mediaStream.getAudioTracks()[0];
        const masterDeviceId = masterTrack ? masterTrack.getSettings().deviceId : null;
        if (masterDeviceId === deviceId || (deviceId === 'default' && !masterDeviceId)) {
            console.log('❁ getDeviceStream: Sharing active Master stream for', deviceId);
            return window.mediaStream;
        }
    }

    // 4. Crear nueva promesa para la negociación física
    const promise = (async () => {
        let deviceLabel = '';
        if (window.lastAudioDevices) {
            const dev = window.lastAudioDevices.find(d => d.deviceId === deviceId);
            if (dev) deviceLabel = dev.label;
        }
        const constraints = window.getEliteConstraints(deviceId, deviceLabel);
        console.debug('❁ getDeviceStream: requesting getUserMedia', constraints);
        
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (err) {
            const isPro = /soundgrid|waves|asio|focusrite|scarlett|dante|antelope|madi|motu|rme|presonus|steinberg|behringer|roland|yamaha|uaudio|volt|virtual|vb-audio|cable|vac|voicemeeter|hi-fi/i.test(deviceLabel || '');
            if (isPro) {
                console.warn('⚠️ [AUDIO-HW] getUserMedia falló con constraints Pro. Intentando recuperación automática con 2 canales estándar...', err);
                const fallbackConstraints = {
                    audio: {
                        deviceId: deviceId ? { exact: deviceId } : undefined,
                        channelCount: { ideal: 2 },
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    }
                };
                stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
            } else {
                throw err;
            }
        }

        // Registrar en caché
        window._deviceStreamCache[deviceId] = { stream, createdAt: Date.now() };
        window._deviceStreamCacheCleanup();

        // Limpiar de la caché si termina
        try {
            const tracks = stream.getTracks ? stream.getTracks() : [];
            tracks.forEach(t => {
                t.addEventListener('ended', () => {
                    try { delete window._deviceStreamCache[deviceId]; } catch (e) { }
                    console.debug(' deviceStreamCache: stream ended for', deviceId);
                });
            });
        } catch (e) { }

        return stream;
    })();

    window._deviceStreamPromises[deviceId] = promise;

    try {
        const stream = await promise;
        return stream;
    } catch (e) {
        console.warn(' getDeviceStream failed for', deviceId, e && e.message);
        throw e;
    } finally {
        delete window._deviceStreamPromises[deviceId];
    }
};

// Pending send-message queue: store messages when socket is disconnected
window._pendingEmitQueue = window._pendingEmitQueue || [];
function flushPendingEmitQueue() {
    try {
        if (!window.socket || !window.socket.connected) return;
        while (window._pendingEmitQueue.length > 0) {
            const item = window._pendingEmitQueue.shift();
            try {
                if (typeof item.callback === 'function') {
                    window.socket.emit(item.event, item.data, item.callback);
                } else {
                    window.socket.emit(item.event, item.data);
                }
            } catch (e) {
                // push back and stop trying
                window._pendingEmitQueue.unshift(item);
                break;
            }
        }
    } catch (e) { console.warn('flushPendingEmitQueue error', e); }
}

// Attach flush on connect (if socket exists later, we hook after init)
try { if (window.socket) window.socket.on && window.socket.on('connect', flushPendingEmitQueue); } catch (e) { }

function queueOrEmit(event, data, callback) {
    try {
        const ok = safeEmit(event, data, callback);
        if (!ok) {
            window._pendingEmitQueue.push({ event, data, callback });
            if (window._pendingEmitQueue.length > 500) {
                window._pendingEmitQueue.shift();
            }
            console.warn(` ${event} queued (socket disconnected)`);
            try { if (window.socket && window.socket.connect) window.socket.connect(); } catch (e) { }
        }
    } catch (e) {
        try { 
            window._pendingEmitQueue.push({ event, data, callback }); 
            if (window._pendingEmitQueue.length > 500) {
                window._pendingEmitQueue.shift();
            }
        } catch (_) { }
    }
}

window.switchMic = async function (deviceId) {
    if (!deviceId) {
        deviceId = (typeof audioDeviceSelect !== 'undefined' && audioDeviceSelect) ? audioDeviceSelect.value : null;
    }
    if (!deviceId) return;
    if (window._isSwitchingMic) {
        console.warn('⚠️ [AUDIO] switchMic ignorado por cambio en curso.');
        return;
    }
    window._isSwitchingMic = true;

    console.log(` [AUDIO] Cambiando micrófono a: ${deviceId}`);

    // 1. Detener flujo actual de forma agresiva
    try {
        const old = audioState.get('mediaStream');
        if (old) {
            old.getTracks().forEach(t => {
                t.stop();
                console.log(` [AUDIO] Track detenido: ${t.label}`);
            });
        }
    } catch (e) { console.warn('Error deteniendo stream previo en switchMic:', e); }

    // 2. Limpiar referencias de nodos para forzar recreación
    window._cachedAudioSource = null;
    window._cachedAudioStream = null;
    if (window._audioWorkletSource) {
        try { window._audioWorkletSource.disconnect(); } catch (e) { }
        window._audioWorkletSource = null;
    }

    // Cooldown de 300 ms para permitir al sistema operativo liberar el hardware
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
        const stream = await window.getDeviceStream(deviceId, { force: true });
        
        // [v60.Elite] SINCRONIZACIÓN DE ESTADO: Actualizar la identidad real en la fuente de verdad
        audioState.setState({ 
            mediaStream: stream,
            deviceId: deviceId 
        });
        localStorage.setItem('talkme_preferred_audio_input', deviceId);
        if (window.lastAudioDevices) {
            const found = window.lastAudioDevices.find(d => d.deviceId === deviceId);
            if (found && found.label) {
                localStorage.setItem('talkme_preferred_audio_label', found.label);
            }
        }
        
        console.log(` [AUDIO] Nuevo stream obtenido para: ${deviceId}`);

        // 3. Reiniciar el análisis de audio con el nuevo stream
        await setupAudioAnalysis(stream);

        // [v60.ELITE FIX - Sol.2A] Sincronizar micrófono del Master con el backend tras cambio
        const channelIndex = (typeof audioState !== 'undefined' && audioState.get) ? (parseInt(audioState.get('inputChannel')) || 0) : 0;
        if (window.socket && window.socket.connected) {
            window.socket.emit('set-master-mic', { deviceId, channel: channelIndex });
            console.log(`🛡️ [AUDIO] Master mic sincronizado con servidor: ${deviceId} Ch ${channelIndex + 1}`);
        }

        // [v60.Phase 2] Auditoría de Integridad post-cambio
        if (window.settingsUI && typeof window.settingsUI.verifyHardwareIntegrity === 'function') {
            await window.settingsUI.verifyHardwareIntegrity();
        }
    } catch (error) {
        console.error(' [AUDIO] Error al cambiar micrófono:', error);
        showCatFeedback((window.localesData?.alerts?.mic_change_error || 'Error al cambiar micrófono: ') + error.message, 'error');
    } finally {
        window._isSwitchingMic = false;
    }
};

// Funcion para cargar la lista de dispositivos (micrfonos y salidas)
async function getAudioDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

    // Auto-Actualizar cuando conectes Bluetooth o despegues auriculares (Debounced para evitar colisiones)
    if (!window._deviceChangeAttached) {
        let deviceChangeTimeout = null;
        navigator.mediaDevices.addEventListener('devicechange', () => {
            console.log(' Cambio de hardware de audio detectado (Bluetooth, USB, etc) - Debouncing...');
            if (deviceChangeTimeout) clearTimeout(deviceChangeTimeout);
            deviceChangeTimeout = setTimeout(async () => {
                console.log(' Ejecutando actualización de dispositivos pos-debounce...');
                // Clear cached channel detections when devices change
                try { window._detectedDeviceChannels = {}; } catch (e) { }
                await getAudioDevices();
                // Re-aplicar salida actual o caer a default si el bluetooth se desconectó
                if (window._autoPlayPlayer) applyAudioOutput(window._autoPlayPlayer);
                if (audioContext) applyAudioOutput(audioContext);
                if (typeof audioCtx !== 'undefined' && audioCtx) applyAudioOutput(audioCtx);
            }, 500);
        });
        window._deviceChangeAttached = true;
    }

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        // 1. Gestionar Micrfonos
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        window.lastAudioDevices = audioInputs; // [v60.Elite] Caché para Match de Etiquetas
        audioDeviceSelect.innerHTML = '';
        if (audioInputs.length === 0) {
            const option = document.createElement('option');
            option.text = localesData.audio?.no_mics_found || 'No se encontraron micrfonos';
            audioDeviceSelect.appendChild(option);
        } else {
            audioInputs.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                const prefix = localesData.audio?.mic_prefix || 'Micrófono';
                let labelText = device.label || `${prefix} ${index + 1}`;
                if (localesData) {
                    const defaultText = localesData.audio?.default_device || "Default";
                    const currentLangCode = (window.currentLang || 'es').toLowerCase();
                    const commText = currentLangCode === 'de' ? 'Kommunikation' :
                                     currentLangCode === 'es' || currentLangCode === 'ca' || currentLangCode === 'gl' ? 'Comunicaciones' :
                                     currentLangCode === 'it' ? 'Comunicazioni' :
                                     currentLangCode === 'pt' ? 'Comunicações' :
                                     currentLangCode === 'fr' ? 'Communications' : 'Communications';

                    labelText = labelText
                        .replace(/^Default/i, defaultText)
                        .replace(/^Predeterminado/i, defaultText)
                        .replace(/^Standard/i, defaultText)
                        .replace(/^Systemstandard/i, defaultText)
                        .replace(/^Comunicaciones/i, commText)
                        .replace(/^Communications/i, commText)
                        .replace(/^Kommunikation/i, commText);
                }
                option.text = labelText;
                audioDeviceSelect.appendChild(option);
            });

            const savedInput = localStorage.getItem('talkme_preferred_audio_input') || localStorage.getItem('talkme_deviceId');
            // Preferir el deviceId presente en el estado de la app (audioState) o la seleccin actual
            const preferred = (typeof audioState !== 'undefined' && audioState.get('deviceId')) || audioDeviceSelect.value || savedInput;
            if (preferred && audioInputs.some(d => d.deviceId === preferred)) {
                audioDeviceSelect.value = preferred;
            } else if (savedInput && audioInputs.some(d => d.deviceId === savedInput)) {
                audioDeviceSelect.value = savedInput;
            }

            // Actualizar canales para el micro seleccionado
            await updateChannelSelectors('input', audioDeviceSelect.value);
        }

        // 2. Gestionar Salidas (Solo si el navegador soporta setSinkId)
        const canSetSinkId = 'setSinkId' in HTMLAudioElement.prototype;
        if (canSetSinkId) {
            let audioOutputs = devices.filter(device => device.kind === 'audiooutput');

            if (audioOutputs.length > 0) {
                // [v59.18] Deduplicacin Inteligente: Evita triplicados (Predeterminado/Comunicaciones)
                const seenDevices = new Map();
                audioOutputs.forEach(d => {
                    // Normalizar nombre: Quitar prefijos de rol de Windows/Navegador
                    const baseLabel = d.label.replace(/^(Predeterminado|Comunicaciones|Default|Communications)\s*-\s*/, '');

                    // Si no hemos visto este dispositivo base o este tiene un nombre ms corto (raw), lo preferimos
                    if (!seenDevices.has(baseLabel) || d.label.length < seenDevices.get(baseLabel).label.length) {
                        seenDevices.set(baseLabel, d);
                    }
                });
                audioOutputs = Array.from(seenDevices.values());

                audioOutputContainer.style.display = 'block';
                const defaultLabel = localesData.audio?.default_device || 'Por defecto del sistema';
                audioOutputSelect.innerHTML = `<option value="">${defaultLabel}</option>`;

                audioOutputs.forEach((device, index) => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    const prefix = localesData.audio?.output_prefix || 'Salida';
                    option.text = device.label || `${prefix} ${index + 1}`;
                    audioOutputSelect.appendChild(option);
                });

                // Aadir opcin de silencio al principio
                const muteOption = document.createElement('option');
                muteOption.value = 'mute';
                muteOption.textContent = `🔇 ${localesData.audio?.mute || 'Silencio'}`;
                audioOutputSelect.insertAdjacentElement('afterbegin', muteOption);

                // Restaurar preferencia guardada
                const savedOutput = localStorage.getItem('talkme_preferred_output');
                if (savedOutput === 'mute') {
                    audioOutputSelect.value = 'mute';
                    setMute(true);
                } else if (savedOutput && audioOutputs.some(d => d.deviceId === savedOutput)) {
                    audioOutputSelect.value = savedOutput;
                    setMute(false);
                } else {
                    audioOutputSelect.value = '';
                    setMute(false);
                }

                // [v59.18] Actualizar canales para la salida seleccionada
                await updateChannelSelectors('output', audioOutputSelect.value);
            }
        }
        // [v60.Elite] AUTO-IGNICIÓN: Si hay una configuración SMPTE previa, la arrancamos ya
        if (window.triggersModule && typeof window.triggersModule.autoIgniteSmpte === 'function') {
            window.triggersModule.autoIgniteSmpte();
        }
    } catch (e) {
        console.error('Error al obtener la lista de dispositivos:', e);
    }
}

// Transcripcin: TRIPLE FALLBACK - 'vosk' (mejor), 'browser' (Web Speech API), o 'local-fallback' (anlisis local)
let recognition = null; // Browser recognition object
let maxCaptureTimeout = null;

// ---- INICIO MEJORA PTT: Timeout de seguridad para transcripcin ----
let pendingCaptureTimeout = null;          // Timeout para envo forzado
// messageSentForCurrentCapture e isWaitingForVosk gestionados por bridge
// ---- FIN MEJORA PTT ----

// --- Variables de Transmisin de Audio y Vosk (Gestionadas va Bridge) ---
// pcmChunks, voskSendBuffer, voskSendSamples gestionados por bridge
const VOSK_CHUNK_SIZE = 4000;

// Categoras seleccionadas por el usuario gestionadas por bridge

let sendAudio = true;
// autoPlayRealtime gestionado por bridge

// Funcin para aplicar la salida de audio a los reproductores o contextos
async function applyAudioOutput(target) {
    // Si estamos en modo mute, no hacemos nada (el volumen ya est a 0)
    if (isMuted) return;

    if (!target || !('setSinkId' in target)) return;

    // Validar visualmente que el dispositivo sigue disponible
    let deviceId = audioOutputSelect.value;
    const isAvailable = Array.from(audioOutputSelect.options).some(opt => opt.value === deviceId);

    // Si el Bluetooth/dispositivo seleccionado desapareci, forzamos salida por defecto
    if (!isAvailable && deviceId !== "") {
        console.warn(` El dispositivo guardado '${deviceId}' ya no existe. Volviendo a Default.`);
        deviceId = "";
        audioOutputSelect.value = "";
        localStorage.removeItem('talkme_preferred_output');
    }

    try {
        await target.setSinkId(deviceId);
        console.log(`❠ Salida de audio aplicada a ${target instanceof AudioContext ? 'Contexto' : 'Elemento'}: ${deviceId || 'defecto'}`);
    } catch (e) {
        console.warn(` Fall setSinkId para ${deviceId}. Volviendo al sistema de serie:`, e);
        try { await target.setSinkId(""); } catch (e2) { } // Fallback de emergencia
    }
}

async function updateChannelSelectors(type, deviceId) {
    const select = type === 'input' ? audioDeviceChannelSelect : audioOutputChannelSelect;
    const deviceSelect = type === 'input' ? audioDeviceSelect : audioOutputSelect;
    if (!select || !deviceSelect) return;

    try {
        // 1. Intentar obtener canales del Backend (ASIO/SoundGrid/Virtual)
        let channels = [];
        const deviceLabel = deviceSelect.selectedOptions[0]?.text || '';
        const resp = await fetch(`/api/audio/channels/${encodeURIComponent(deviceId || 'default')}?label=${encodeURIComponent(deviceLabel)}`);
        if (resp.ok) {
            const json = await resp.json();
            if (json.success && json.data && json.data.length > 0) {
                channels = json.data;
                // [v60.ELITE] CRÍTICO: Si el backend nos da los canales (ej. de Firefox a Chrome),
                // DEBEMOS guardarlos en localStorage para que getEliteConstraints pueda forzar {exact: N} en Chrome.
                if (type === 'input' && deviceId) {
                    localStorage.setItem(`talkme_caps_${deviceId}`, channels.length);
                    console.log(`🌐 [AUDIO-HW] Sincronizado desde backend: ${channels.length} canales para ${deviceLabel}`);
                }
            }
        }

        // 2. Fallback: Si no hay datos del backend, intentar detectar mediante Web Audio / MediaDevices
        if (channels.length === 0) {
            let count = 1;
            const isProbablyPro = /soundgrid|audiobox|presonus|focusrite|scarlett|behringer|motu|rme|steinberg|roland|yamaha|uaudio|volt|antelope|virtual|vac|hi-fi|voicemeeter|vb-audio|cable/i.test(deviceLabel);

            if (type === 'output') {
                count = (audioCtx && audioCtx.destination) ? (audioCtx.destination.maxChannelCount || (isProbablyPro ? 2 : 1)) : (isProbablyPro ? 2 : 1);
            } else if (type === 'input' && deviceId) {
                const cacheKey = `talkme_caps_${deviceId}`;
                const localSavedCount = localStorage.getItem(cacheKey);
                
                if (localSavedCount) {
                    count = parseInt(localSavedCount) || 1;
                    console.log(`💾 [AUDIO-HW] Capacidad recuperada de caché local: ${count} canales para ${deviceLabel}`);
                } else {
                    try {
                        // 1. Probe estándar usando la caché/compartición de getDeviceStream
                        const wasCached = !!(window._deviceStreamCache && window._deviceStreamCache[deviceId] && window._deviceStreamCache[deviceId].stream) || (window.mediaStream && window.mediaStream.active);
                        const stream = await window.getDeviceStream(deviceId, { force: false });
                        const track = stream.getAudioTracks()[0];
                        
                        if (track) {
                            const settings = track.getSettings();
                            const caps = track.getCapabilities ? track.getCapabilities() : {};
                            const capMax = caps.channelCount ? (caps.channelCount.max || caps.channelCount) : 1;
                            count = Math.max(settings.channelCount || 1, capMax);
                            
                            // 2. Si el navegador (ej. Chrome) reporta 2 o menos, podría ser víctima de su propio límite WDM.
                            // Ejecutamos el Probe Físico Descendente forzando constraints exactos para descubrir su verdadero límite en el SO.
                            if (count <= 2) {
                                const candidates = [32, 24, 16, 8, 6, 4];
                                for (const ch of candidates) {
                                    try {
                                        const testStream = await navigator.mediaDevices.getUserMedia({
                                            audio: { 
                                                deviceId: { exact: deviceId },
                                                channelCount: { exact: ch },
                                                echoCancellation: false, noiseSuppression: false, autoGainControl: false 
                                            }
                                        });
                                        count = ch;
                                        testStream.getTracks().forEach(t => t.stop());
                                        console.log(`🎯 [AUDIO-HW] Chrome WDM Bypass exitoso para ${ch} canales.`);
                                        break;
                                    } catch(e) {}
                                }
                            }

                            // 3. Validación final con Web Audio API
                            try {
                                const tempCtx = new (window.AudioContext || window.webkitAudioContext)();
                                const source = tempCtx.createMediaStreamSource(stream);
                                if (source.channelCount > count) {
                                    count = source.channelCount;
                                }
                                source.disconnect();
                                tempCtx.close();
                            } catch (e) {}

                            // [v60.ELITE] Anti-Poisoning Architecture
                            // Si el dispositivo es Pro, pero la capacidad detectada es 2 o menos (estéreo),
                            // es casi seguro que el probe falló debido a un límite de WASAPI en Chrome o un Device Lock.
                            // NO subimos este valor al servidor para evitar destruir la capacidad real ya medida por otros clientes.
                            const isProbablyPoisoned = (count <= 2 && isProbablyPro);
                            
                            if (count > 0 && !isProbablyPoisoned) {
                                const lastSent = localStorage.getItem(cacheKey);
                                if (lastSent !== String(count)) {
                                    fetch(`/api/audio/channels/${encodeURIComponent(deviceId)}/capabilities`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ channels: count, label: deviceLabel })
                                    }).then(res => {
                                        if (res.ok) localStorage.setItem(cacheKey, count);
                                    }).catch(e => console.warn('Error reportando capacidad real:', e));
                                }
                            } else if (isProbablyPoisoned) {
                                console.log(`🛡️ [ELITE] Anti-Poisoning activo: Evitando subir ${count} canales para hardware Pro (${deviceLabel}).`);
                                // [v60.ELITE] Filosofía de "Mesa de Mezclas"
                                const isUltraHighDensity = /soundgrid|waves|dante|madi|digico/i.test(deviceLabel);
                                count = isUltraHighDensity ? 128 : 32;
                                localStorage.setItem(cacheKey, count);
                            }
                        }
                        
                        // Detener el stream sólo si no estaba en caché originalmente (evita apagar la grabación activa y apaga la luz roja)
                        if (stream && !wasCached) {
                            stream.getTracks().forEach(t => t.stop());
                            if (window._deviceStreamCache && window._deviceStreamCache[deviceId]) {
                                delete window._deviceStreamCache[deviceId];
                            }
                        }
                    } catch (e) {
                        count = 1;
                    }
                }
            }

            for (let i = 0; i < count; i++) {
                channels.push({ index: i, label: `Ch ${i + 1}` });
            }
        }

        // 3. Poblar el selector y gestionar visibilidad
        select.innerHTML = '';
        channels.forEach(ch => {
            const opt = document.createElement('option');
            opt.value = ch.index;
            opt.textContent = ch.label;
            select.appendChild(opt);
        });

        // [v59.31] Lgica de visibilidad mejorada para SoundGrid/ASIO
        const container = select.closest('.channel-select-container');
        if (container) {
            // Heurstica de Identificacin de Hardware Profesional/Virtual (RJ45 detectado)
            const isProInterface =
                channels.length > 2 ||
                deviceId.startsWith('asio:') ||
                deviceId.startsWith('soundgrid') ||
                deviceId.startsWith('talkme') ||
                /audiobox|presonus|focusrite|scarlett|behringer|motu|rme|steinberg|roland|yamaha|uaudio|volt|antelope|virtual|soundgrid|vac|hi-fi/i.test(deviceLabel);

            // IMPORTANTE: Para SoundGrid, siempre mostramos el selector si tenemos canales, 
            // ya que suele ser una fuente digital multicanal por RJ45.
            // [v60.ELITE] Lógica de visibilidad mejorada: Sólo mostramos canales si hay más de 1 y es hardware PRO/Virtual
            const shouldShow = channels.length > 1 && isProInterface;
            container.style.display = shouldShow ? 'block' : 'none';

            // Si el contenedor se oculta, forzamos el canal a 0 (Ch 1) para evitar "residuos"
            if (!shouldShow) select.value = 0;
        }

        // 4. Restaurar persistencia "sticky" (Solo si el dispositivo tiene canales suficientes)
        const mapping = audioState.get('deviceChannelMapping') || {};
        const savedChannel = mapping[deviceId]?.[type];
        const hasValidChannel = savedChannel !== undefined && channels.some(c => c.index === parseInt(savedChannel));

        if (hasValidChannel) {
            select.value = savedChannel;
        } else {
            select.value = 0; // Default Ch 1
        }

        // Sincronizar con el estado global
        if (type === 'input') audioState.setState({ inputChannel: parseInt(select.value) });
        else {
            audioState.setState({ outputChannel: parseInt(select.value) });
            applyAudioOutputChannel(parseInt(select.value));
        }

    } catch (err) {
        console.error(` [AUDIO] Error actualizando canales:`, err);
    }
}

/**
 * [v60.ELITE] Libera la caché del stream de un dispositivo de entrada,
 * deteniendo todos sus tracks activos para forzar una nueva negociación física.
 */
window.clearAudioDeviceCache = function(deviceId) {
    if (!deviceId) return;
    try {
        const cached = window._deviceStreamCache && window._deviceStreamCache[deviceId];
        if (cached && cached.stream) {
            const tracks = cached.stream.getTracks ? cached.stream.getTracks() : [];
            tracks.forEach(t => {
                try { t.stop(); } catch (_) {}
            });
            delete window._deviceStreamCache[deviceId];
            console.log(`🧼 [AUDIO-HW] Caché de stream liberada quirúrgicamente para dispositivo: ${deviceId}`);
        }
    } catch (e) {
        console.warn('Error al limpiar la caché del dispositivo:', e);
    }
};

/**
 * [v60.ELITE] Fuerza un probe de hardware físico en caliente liberando la caché de streams,
 * interrogando al SO y repoblando los selectores con las capacidades dinámicas reales.
 * @param {boolean} isSilent - Si es true, realiza el probe silenciosamente sin interrumpir el stream principal.
 */
window.forceAudioHardwareRefresh = async function(isSilent = false) {
    console.log(`🔄 [AUDIO-HW] Forzando refresco de hardware de audio (silent: ${isSilent})...`);
    
    try {
        // 1. Obtener el dispositivo de entrada actual de la UI o del estado
        const audioSelect = document.getElementById('audioDeviceSelect');
        const currentDeviceId = audioSelect ? audioSelect.value : ((typeof audioState !== 'undefined' && audioState) ? audioState.get('deviceId') : null);
        
        let wasCapturing = false;
        if (!isSilent) {
            // [DAW-Grade Hardware Release]
            // Detener el stream principal (window.mediaStream) para liberar el handle exclusivo de Windows
            const activeStream = window.mediaStream;
            if (activeStream && activeStream.active) {
                wasCapturing = true;
                console.log('🧼 [AUDIO-HW] Deteniendo stream principal para liberar handles del driver de Windows...');
                try {
                    const tracks = activeStream.getTracks ? activeStream.getTracks() : [];
                    tracks.forEach(t => t.stop());
                } catch (e) {
                    console.warn('Error deteniendo stream principal:', e);
                }
                window.mediaStream = null;
            }

            // Detener y vaciar todos los streams de la caché
            if (window._deviceStreamCache) {
                console.log('🧼 [AUDIO-HW] Liberando todos los streams en caché para liberar locks...');
                for (const devId in window._deviceStreamCache) {
                    const cached = window._deviceStreamCache[devId];
                    if (cached && cached.stream) {
                        try {
                            const tracks = cached.stream.getTracks ? cached.stream.getTracks() : [];
                            tracks.forEach(t => t.stop());
                        } catch (_) {}
                    }
                }
                window._deviceStreamCache = {};
            }

            // Pausa de 300ms para que el S.O. y el driver WDM procesen la desconexión
            console.log('⏳ [AUDIO-HW] Esperando 300ms para permitir al driver del S.O. aplicar la nueva configuración de canales...');
            await new Promise(resolve => setTimeout(resolve, 300));
        } else {
            // Refresco silencioso: solo vacía caché del actual sin apagar
            if (currentDeviceId) {
                window.clearAudioDeviceCache(currentDeviceId);
            }
        }
        
        // 2. Ejecutar la llamada al Backend para refresh del mDNS / ASIO
        try {
            // Limpiar caché local de capacidades para forzar re-evaluación y reporte al backend
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('talkme_caps_')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            
            await fetch('/api/audio/refresh', { method: 'POST' });
        } catch (e) {
            console.warn('Backend refresh fallback:', e);
        }
        
        // 3. Volver a poblar la lista de dispositivos físicos del navegador
        await getAudioDevices();
        
        // 4. Si el selector de entrada tiene valor, actualizar la lista granular de canales mediante un probe en caliente
        if (audioSelect && audioSelect.value) {
            await updateChannelSelectors('input', audioSelect.value);
        }

        // 5. Aplicar proactivamente la salida de audio seleccionada en caliente para evitar silencios (Output Fix)
        const outputSelect = document.getElementById('audioOutputSelect');
        if (outputSelect) {
            const selectedOutput = outputSelect.value;
            if (selectedOutput === 'mute') {
                if (typeof setMute === 'function') setMute(true);
            } else {
                if (typeof setMute === 'function') setMute(false);
                if (window._autoPlayPlayer) await applyAudioOutput(window._autoPlayPlayer);
                if (audioContext) await applyAudioOutput(audioContext);
                if (typeof audioCtx !== 'undefined' && audioCtx) await applyAudioOutput(audioCtx);
            }
        }
        
        // 6. Reactivar el micrófono en caliente si estaba activo
        if (wasCapturing && currentDeviceId) {
            console.log(`🎤 [AUDIO-HW] Reactivando captura en caliente para dispositivo: ${currentDeviceId}`);
            if (typeof window.switchMic === 'function') {
                await window.switchMic(currentDeviceId);
            }
        }

        // [v60.ELITE FIX - Sol.4-Refresh] Reactivar la captura para todos los subusuarios afectados
        if (!isSilent && window._subUserPipelines && window.audioCapture) {
            for (const subUserId of Object.keys(window._subUserPipelines)) {
                const pipeline = window._subUserPipelines[subUserId];
                if (pipeline) {
                    console.log(`🎙️ [AUDIO-HW] Reactivando captura pos-refresh para subusuario: ${subUserId}`);
                    try {
                        await window.audioCapture.startSubUserCapture(
                            subUserId,
                            pipeline.mic,
                            pipeline.lang,
                            pipeline.threshold,
                            pipeline.category
                        );
                    } catch (e) {
                        console.error(`❌ [AUDIO-HW] Error reactivando sub ${subUserId}:`, e.message);
                    }
                }
            }
        }
        
        console.log('✅ [AUDIO-HW] Refresco de hardware de audio completado.');
        
        // Si no es silencioso, podemos notificar al usuario
        if (!isSilent) {
            const syncSuccessMsg = (window.localesData && window.localesData.audio && window.localesData.audio.hot_sync_success)
                ? window.localesData.audio.hot_sync_success
                : 'Hardware de audio sincronizado en caliente.';
            if (typeof window.showCatFeedback === 'function') {
                window.showCatFeedback(syncSuccessMsg, 'success');
            } else if (typeof showCatFeedback === 'function') {
                showCatFeedback(syncSuccessMsg, 'success');
            }
        }
    } catch (err) {
        console.error('❌ [AUDIO-HW] Error en refresco forzado de hardware:', err);
        if (!isSilent && typeof window.showCatFeedback === 'function') {
            window.showCatFeedback((window.localesData?.alerts?.audio_sync_error || 'Error sincronizando hardware de audio: ') + err.message, 'error');
        } else if (!isSilent && typeof showCatFeedback === 'function') {
            showCatFeedback((window.localesData?.alerts?.audio_sync_error || 'Error sincronizando hardware de audio: ') + err.message, 'error');
        }
    }
};

/**
 * Detect channels for a given deviceId using backend API then WebAudio fallback.
 * Returns an array of channel objects: { index, label }
 */
window.detectChannelsForDevice = async function (deviceId, deviceLabel, forceRefresh = false) {
    try {
        // Simple in-memory cache to avoid repeated expensive detection
        window._detectedDeviceChannels = window._detectedDeviceChannels || {};
        if (!forceRefresh && deviceId && window._detectedDeviceChannels[deviceId]) {
            try { console.debug('❍ detectChannelsForDevice: cache hit', { deviceId, deviceLabel, channels: window._detectedDeviceChannels[deviceId] }); } catch (e) { }
            return window._detectedDeviceChannels[deviceId];
        }
        let channels = [];
        const resp = await fetch(`/api/audio/channels/${encodeURIComponent(deviceId || 'default')}?label=${encodeURIComponent(deviceLabel || '')}`);
        if (resp.ok) {
            const json = await resp.json();
            if (json.success) channels = json.data;
        }
        // If backend didn't return anything, fall back to WebAudio detection
        if (!Array.isArray(channels) || channels.length === 0) {
            let count = 1;
            try {
                if (deviceId) {
                    // Prefer using cached device stream to avoid additional permission prompts
                    let stream = null;
                    try {
                        if (window.getDeviceStream) stream = await window.getDeviceStream(deviceId, { force: false });
                    } catch (e) { stream = null; }
                    // If no cached stream, try requesting briefly (user gesture recommended) with raw DSP bypass
                    if (!stream) {
                        try {
                            const probeConstraints = window.getEliteConstraints ? window.getEliteConstraints(deviceId, deviceLabel) : { audio: { deviceId: { exact: deviceId } } };
                            stream = await navigator.mediaDevices.getUserMedia(probeConstraints);
                        } catch (e) { stream = null; }
                    }
                    if (stream) {
                        const track = stream.getAudioTracks()[0];
                        if (track) {
                            const caps = track.getCapabilities ? track.getCapabilities() : {};
                            const settings = track.getSettings ? track.getSettings() : {};
                            console.debug('❍ detectChannelsForDevice: device caps/settings', { deviceId, deviceLabel, caps, settings });
                            count = (caps && caps.channelCount) ? (caps.channelCount.max || caps.channelCount) : (settings.channelCount || 1);
                        }
                        // Only stop streams we created here (if not from cache)
                        try {
                            if (stream && (!window._deviceStreamCache || !Object.values(window._deviceStreamCache).some(s => s && s.stream === stream))) {
                                stream.getTracks().forEach(t => t.stop());
                            }
                        } catch (e) { }
                    }
                }
            } catch (e) {
                count = 1;
            }

            // Heurstica: si el label NO parece una interfaz profesional y el conteo es > 2, cap al 1
            const proRegex = /audiobox|presonus|focusrite|scarlett|behringer|motu|rme|steinberg|roland|yamaha|uaudio|volt|antelope|virtual|soundgrid|vac|voicemeeter|vb-audio|cable|asio/i;
            const looksPro = proRegex.test(deviceLabel || '');
            if (!looksPro && count > 2) {
                console.debug('❍ detectChannelsForDevice: capping channels for non-pro device', { deviceId, deviceLabel, detected: count });
                count = 1;
            }

            channels = [];
            for (let i = 0; i < count; i++) channels.push({ index: i, label: `Ch ${i + 1}` });
        }

        // Save to cache and return
        // Heurstica alineada con updateChannelSelectors: mostrar mltiples canales
        // SOLO si parece una interfaz pro o si hay ms de 2 canales detectados.
        try {
            const proRegex = /audiobox|presonus|focusrite|scarlett|behringer|motu|rme|steinberg|roland|yamaha|uaudio|volt|antelope|virtual|soundgrid|vac|voicemeeter|vb-audio|cable|asio/i;
            const isProInterface = (channels.length > 2) || (deviceId && (String(deviceId).startsWith('asio:') || String(deviceId).startsWith('soundgrid') || String(deviceId).startsWith('talkme'))) || proRegex.test(deviceLabel || '');
            if (!isProInterface && channels.length <= 2) {
                // Collapse to single channel for non-pro devices to match panel behavior
                channels = [{ index: 0, label: 'Ch 1' }];
            }
            window._detectedDeviceChannels[deviceId] = channels;
        } catch (e) { try { window._detectedDeviceChannels[deviceId] = channels; } catch (e2) { } }
        try { console.debug('❍ detectChannelsForDevice', { deviceId, deviceLabel, channels }); } catch (e) { }
        return channels;
    } catch (err) {
        console.warn('detectChannelsForDevice error', err);
        return [{ index: 0, label: 'Ch 1' }];
    }
}

/**
 * [v59.18] Aplica el ruteo de salida al canal seleccionado
 * @param {number} channelIndex 
 */
function applyAudioOutputChannel(channelIndex) {
    // [v59.32] Inicializacin diferida: Asegurar que los nodos existan
    if (!window._masterGain || !window._channelMerger) {
        initAudioCtx();
    }

    if (!window._masterGain || !window._channelMerger) {
        console.warn('  [AUDIO] Nodos de ruteo no inicializados para cambio de canal');
        return;
    }

    try {
        window._masterGain.disconnect(window._channelMerger);
        window._masterGain.connect(window._channelMerger, 0, channelIndex);
    } catch (e) {
        console.error('  [AUDIO] Error aplicando ruteo de canal:', e);
    }
}

// [v59.Elite] Sincronizacin de audio unificada
if (sendAudioToggle) {
    sendAudioToggle.addEventListener('change', function () {
        sendAudio = this.checked;
        if (window.audioState) window.audioState.setState({ sendAudio: this.checked });
        console.log('Toggle Enviar Audio:', sendAudio);
    });
}

/**
 * Activa o desactiva el silencio global.
 * @param {boolean} muted - true para silenciar, false para restaurar sonido.
 */
function setMute(muted) {
    isMuted = muted;

    // 1. Nodo maestro de Web Audio (para streaming y comfort noise)
    if (window._masterGain && audioCtx) {
        // Cambio suave para evitar pops
        window._masterGain.gain.setValueAtTime(muted ? 0 : 1, audioCtx.currentTime);
    }

    // 2. Elementos Audio activos (reproduccin manual)
    if (activeAudioElements) {
        activeAudioElements.forEach(audio => {
            if (audio && typeof audio.volume !== 'undefined') {
                audio.volume = muted ? 0 : 1;
            }
        });
    }

    // 3. Reproductor de autoplay persistente
    if (window._autoPlayPlayer) {
        window._autoPlayPlayer.volume = muted ? 0 : 1;
    }

    // 4. Desactivar Reproduccin Automtica si activamos Silencio
    if (muted) {
        if (autoPlayToggle) {
            autoPlayToggle.checked = false;
        }
        if (typeof autoPlayRealtime !== 'undefined') {
            autoPlayRealtime = false;
        }
    }

    // 5. Guardar preferencia en localStorage (se guarda tambin al cambiar el select, pero aqu por si se llama desde otro lado)
    try {
        localStorage.setItem('talkme_preferred_output', muted ? 'mute' : (audioOutputSelect.value !== 'mute' ? audioOutputSelect.value : ''));
    } catch (e) { }
}

// isFlashlightEnabled declarada globalmente (v46.4.8)
let flashlightTrack = null;

let speechCaptureTimeout = null;

// Grabacin de audio original (Gestionada va AudioStateManager Bridge)
const MAX_AUDIO_BLOBS = 15;

// PCM capture para Vosk (Gestionado va AudioStateManager Bridge)

// Modo del micrfono (Gestionado va AudioStateManager Bridge)
let recordingStartedByPTT = false; // Indica si la grabacin se activ desde el botn PTT Enviar

// Categoras seleccionadas por el usuario gestionadas por Bridge

// autoPlayRealtime gestionado por Bridge
// isVibrationEnabled inicializada arriba

// getUserColor y triggerVibration movidas a ui-utils.js

// === UTILIDADES DE AUDIO ===
// Funcin para "desbloquear" el audio en iOS/Safari
// Crea DOS reproductores desbloqueados: uno para autoplay, otro de reserva
window.unlockAudio = function () {
    if (window._audioUnlocked) return;

    // Si somos Desktop no necesitamos hack de desbloqueo, prevenimos NS_ERROR en FF/Desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
        window._audioUnlocked = true;
        return;
    }

    // Reproductor dedicado al autoplay de mensajes entrantes en mviles
    if (!window._autoPlayPlayer) {
        window._autoPlayPlayer = new Audio();
        window._autoPlayPlayer.volume = 1.0;
    }

    // Reproducir silencio para desbloquear el contexto de audio en iOS
    // Se utiliza exactamente el mismo base64 original que funcionaba perfecto en la v8
    window._autoPlayPlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFWm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A';
    window._autoPlayPlayer.loop = true; //   FUNDAMENTAL: Obliga a Safari a mantener el tab despierto en background
    window._autoPlayPlayer.volume = 0.01;

    let playPromise = window._autoPlayPlayer.play();

    if (playPromise !== undefined) {
        playPromise.then(_ => {
            window._audioUnlocked = true;
            window._autoPlayPlayer.volume = 1.0;
            console.log('  Sesin de Audio desbloqueada y en loop seguro (autoplay listo)');
        }).catch(() => {
            // Normal antes del primer toque del usuario
        });
    }

    // Desbloqueo de Web Audio API (Crucial para iOS push-to-talk)
    try {
        audioContext = initAudioCtx();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0;
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(0);
        oscillator.stop(0.1);
    } catch (e) { }
}



// === GESTIN DICCIONARIO ===
function renderDictionary() {
    const container = document.getElementById('dictionaryTags') || 
                      document.getElementById('dictionaryList') || 
                      window.dictionaryTags;
                      
    if (!container) {
        console.warn('  [RENDER] Error crtico: No se encontr ningn contenedor para el diccionario (buscados: dictionaryTags, dictionaryList)');
        return;
    }
    
    container.innerHTML = '';
    
    // [v60] Asegurar que el diccionario global sea siempre una lista de objetos {from, to}
    if (window.currentDictionary) {
        window.currentDictionary = window.currentDictionary.map(item => {
            if (typeof item === 'string') return { from: item, to: item };
            return item;
        });
        
        // Ordenar el diccionario ORIGINAL por longitud de palabra (importante para el motor de reemplazo)
        window.currentDictionary.sort((a, b) => {
            const lenA = (a && a.from) ? a.from.length : 0;
            const lenB = (b && b.from) ? b.from.length : 0;
            return lenB - lenA;
        });
    }

    const dict = window.currentDictionary || [];

    dict.forEach((entry, index) => {
        if (!entry || !entry.from) return;
        const tag = document.createElement('div');
        tag.className = 'dict-tag';
        const display = entry.from === entry.to ? entry.to : `<b>${entry.from}</b>   ${entry.to}`;
        tag.innerHTML = `<span>${display}</span> <span class="remove" data-index="${index}"></span>`;
        container.appendChild(tag);
    });

    // Eventos para eliminar (Ahora el ndice coincide 100% con window.currentDictionary)
    container.querySelectorAll('.remove').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.getAttribute('data-index'));
            window.currentDictionary.splice(idx, 1);
            renderDictionary();
            // Guardar al servidor inmediatamente
            if (window.socket) safeEmit('update-dictionary', { words: window.currentDictionary, lang: window.currentLang });
        };
    });
}

//   NO REINICIALIZAR window.selectedCategories aqu - ya est sincronizado como proxy
// Clave lgica del filtro que muestra todos los mensajes (invariable, independiente del idioma)
const FILTER_ALL_KEY = '__ALL__';
// Categora por defecto para mensajes sin categora asignada
const DEFAULT_CATEGORY = 'General';
// Nombre de usuario reservado para el sistema de gestin
const MASTER_USERNAME = 'Master';
// Set de claves de mensajes ya renderizados   evita duplicados al reconectar
const _renderedMsgKeys = new Set();
// activeFilters gestionado por bridge
let lastUsersDataCache = []; // Cach para persistencia bilinge de filtros

// === CATEGORY MANAGEMENT STATE ===
// Variables movidas al bloque central superior (V46.4.6)
let maxCategories = 25;

// === COLORES DE CATEGOR A (dinmico desde servidor) ===
// getCategoryColor movida a ui-utils.js

// Lgica Core migrada a module-category-ui.js
function createFilterBar(allUsersData = null) {
    libCreateFilterBar(allUsersData, {
        currentCategories: window.currentCategories,
        localesData: window.localesData
    });
}
function updateCategorySelect() {
    libUpdateCategorySelect(window.currentCategories, window.currentLang, window.localesData);
}
function openCategoryManager() {
    libOpenCategoryManager({
        localesData: window.localesData,
        currentCategories: window.currentCategories,
        maxCategories: window.maxCategories,
        safeEmit: window.safeEmit,
        currentUser: { user: window.currentUsername },
        MASTER_USERNAME: window.MASTER_USERNAME
    });
}
function filterMessages() {
    libFilterMessages();
}

window.createFilterBar = createFilterBar;
window.updateCategorySelect = updateCategorySelect;
window.openCategoryManager = openCategoryManager;
window.filterMessages = filterMessages;

document.addEventListener('DOMContentLoaded', function () {
    try {
        // [v60.Elite] Carga inmediata de IP en el modal de login
        if (typeof updateDynamicIPDisplays === 'function') {
            updateDynamicIPDisplays(window.location.origin);
        }
        
        if (window.navigator.userAgent.includes('Chrome') || window.navigator.userAgent.includes('Safari')) {
            const style = document.createElement('style');
            style.textContent = `
                .keyframes-scroll-area::-webkit-scrollbar { width: 6px; }
                .keyframes-scroll-area::-webkit-scrollbar-track { background: transparent; }
                .keyframes-scroll-area::-webkit-scrollbar-thumb { background: var(--accent-blue); border-radius: 10px; }
                .keyframes-scroll-area::-webkit-scrollbar-thumb:hover { background: var(--accent-orange); }
                #alertEditorModal .keyframes-scroll-area::-webkit-scrollbar-track { background: rgba(123, 104, 238, 0.05); }
                #alertEditorModal .keyframes-scroll-area::-webkit-scrollbar-thumb { background: #7B68EE; }
                #alertEditorModal .keyframes-scroll-area::-webkit-scrollbar-thumb:hover { background: #9370DB; }
            `;
            document.head.appendChild(style);
        }
        
        // [v60.MEMORIA] Restaurar credenciales del Master (Lógica Diferida Elite)
        window._restoreMasterIdentity = function(forceLocalStorage = false) {
            try {
                const usernameInput = document.getElementById('usernameInput');
                const catSelect = document.getElementById('categorySelect');
                
                if (!usernameInput) return;

                // [v60.ELITE] ESCUDO DE SOBERANÍA: No restauramos si ya hay un valor (evitar machacar auto-fill)
                // A MENOS que forceLocalStorage sea true (señalado por el servidor como candidato legítimo)
                if (usernameInput.value && !forceLocalStorage) return;

                const sessUsername = sessionStorage.getItem('talkme_last_username');
                const sessCategory = sessionStorage.getItem('talkme_last_category');

                if (sessUsername) {
                    // Refresco F5: Restaurar siempre desde memoria de sesión
                    usernameInput.value = sessUsername;
                    if (sessCategory && catSelect) {
                        catSelect.value = sessCategory;
                        catSelect.dataset.selectedId = sessCategory;
                    }
                    window._restoredFromSession = true;
                    console.log(`🧠 [MEMORIA] Identidad restaurada de sesión (Refresco F5).`);
                } else if (forceLocalStorage && window.isMasterCandidate) {
                    // Solo si el servidor nos da permiso y el dispositivo tiene el rastro
                    const lastUsername = localStorage.getItem('talkme_last_username');
                    const lastCategory = localStorage.getItem('talkme_last_category');
                    if (lastUsername) {
                        usernameInput.value = lastUsername;
                        if (lastCategory && catSelect) {
                            catSelect.value = lastCategory;
                            catSelect.dataset.selectedId = lastCategory;
                        }
                        console.log(`🔐 [MEMORIA] Identidad restaurada de rastro local (Recuperación).`);
                    }
                }
            } catch (e) { console.warn('⚠️ Error en restauración diferida:', e); }
        };

        // En el arranque, solo permitimos sessionStorage (Refrescos seguros)
        window._restoreMasterIdentity(false);

        initTriggerWorker();
        initSocket();

        // [v60.Elite] Auto-inicio de captura SMPTE en segundo plano (Background Service)
        const savedSmpteDev = localStorage.getItem('talkme_smpte_device');
        const savedSmpteChan = parseInt(localStorage.getItem('talkme_smpte_channel')) || 1;
        if (savedSmpteDev && savedSmpteDev !== 'default' && window.smpteCapture) {
            console.log('🕒 [v60.Elite] Activando Escucha SMPTE Global desde persistencia...');
            window.smpteCapture.start(savedSmpteDev, savedSmpteChan - 1);
        }

        const savedSession = restoreLocalSession();
        if (savedSession && savedSession.username) {
            currentUsername = savedSession.username;
            currentRoomPin = savedSession.roomPin || '';
            currentCategories = Array.isArray(savedSession.categories) ? savedSession.categories : [];
            window.selectedCategories = currentCategories;
            // window.isMaster = savedSession.isMaster || false; // ELIMINADO: Prioridad al servidor

            if (userModal) userModal.classList.add('hidden');
            if (globalLangSwitcher) globalLangSwitcher.classList.add('hidden');
            performJoinChat('auto-join-startup');
            if (typeof window.activateIOSAudioSession === 'function') window.activateIOSAudioSession();
        }

        if (window.initWakeLockSystem) window.initWakeLockSystem();
        initVoiceWave();
        initI18n();
        initTheme();
        initDNAPalette();
        initThemeSwitchers();

        // [v60.Elite] Proteccin contra burbujeo de eventos en selects (Evita ghost clicks en mviles)
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            ['change', 'click', 'touchstart'].forEach(evt => {
                categorySelect.addEventListener(evt, (e) => {
                    e.stopPropagation();
                }, { passive: true });
            });
        }

        // [v60.ELITE] Mantener sincronización de identidad sin clobbering
        window.currentUsername = currentUsername;

        initModularSettings();
        settingsUI.init(); // Iniciar sistema modular de ajustes

        initHardwareStatus();

        window.addEventListener('click', function unlockAudio() {
            if (typeof activateIOSAudioSession === 'function') activateIOSAudioSession();
        }, { once: true });

    } catch (err) {
        console.error('  Error crtico en DOMContentLoaded:', err);
        const userModalFallback = document.getElementById('userModal');
        if (userModalFallback) userModalFallback.classList.remove('hidden');
    }
});

// Terms of Service (v41 Restoration) - Binding Directo y Seguro
function setupTermsGlobal() {
    const btnOpenTermsRef = document.getElementById('btnOpenTerms');
    const btnCloseTermsRef = document.getElementById('btnCloseTerms');
    const termsModalRef = document.getElementById('termsModal');
    if (btnOpenTermsRef && termsModalRef) {
        btnOpenTermsRef.onclick = (e) => {
            if (e) e.preventDefault();
            console.log(' Opening Terms Modal...');
            termsModalRef.classList.remove('hidden');
        };
    }
    if (btnCloseTermsRef && termsModalRef) {
        btnCloseTermsRef.onclick = (e) => {
            if (e) e.preventDefault();
            termsModalRef.classList.add('hidden');
        };
    }
}
setupTermsGlobal();

// Lgica de Diccionario movida a bloque de inicializacin modular (Settings)

if (btnAddWord) {
    btnAddWord.onclick = () => {
        const from = dictFrom.value.trim().toLowerCase();
        const to = dictTo.value.trim();
        if (from && to) {
            // Evitar duplicados del mismo origen
            const index = currentDictionary.findIndex(d => d.from === from);
            if (index !== -1) {
                currentDictionary[index].to = to; // Actualizar si ya existe
            } else {
                currentDictionary.push({ from, to });
            }

            dictFrom.value = '';
            dictTo.value = ''; // Limpiar tambin el destino
            if (window.socket) safeEmit('update-dictionary', { words: currentDictionary, lang: currentLang });
        }
    };
}

if (dictFrom) dictFrom.onkeypress = (e) => { if (e.key === 'Enter') dictTo.focus(); };
if (dictTo) dictTo.onkeypress = (e) => { if (e.key === 'Enter') btnAddWord.click(); };

// === TRIGGERS MIDI / OSC   Listeners del Modal (v46.4.85) ===
const triggersModal = document.getElementById('triggersModal');
const btnCloseTriggers = document.getElementById('btnCloseTriggers'); // ID aadido al HTML

// Botn de Triggers (Centralizado - Hito 46.3.10)

const btnOpenTriggersGlobal = document.getElementById('btnOpenTriggersAlt') || document.getElementById('btnOpenTriggers');
if (btnOpenTriggersGlobal && triggersModal) {

    btnOpenTriggersGlobal.onclick = (e) => {
        if (typeof e?.preventDefault === 'function') e.preventDefault();
        console.log(' Opening Triggers...');
        window.openedFromSettings = true; // Siempre retornar a Ajustes al cerrar
        triggersModal.classList.remove('hidden');
        if (typeof settingsModal !== 'undefined' && settingsModal) settingsModal.classList.add('hidden');
        document.body.classList.add('modal-active');
    };
}

if (btnCloseTriggers && triggersModal) {
    btnCloseTriggers.onclick = (e) => {
        if (e) e.preventDefault();
        if (triggersModule && typeof triggersModule.closeTriggerForm === 'function') {
            triggersModule.closeTriggerForm();
        } else {
            triggersModal.classList.add('hidden');
            document.body.classList.remove('modal-active');
            if (window.openedFromSettings && typeof settingsModal !== 'undefined' && settingsModal) {
                settingsModal.classList.add('no-fade');
                settingsModal.classList.remove('hidden');
                document.body.classList.add('modal-active');
                window.openedFromSettings = false; 
            } else if (typeof settingsModal !== 'undefined' && settingsModal) {
                settingsModal.classList.add('hidden');
            }
        }
     };
}
if (triggersModal) {
     let backdropDown = false;
     triggersModal.addEventListener('mousedown', (e) => {
         backdropDown = (e.target === triggersModal);
     });
     triggersModal.addEventListener('click', (e) => {
         if (e.target === triggersModal && backdropDown) {
             triggersModal.classList.add('hidden');
             document.body.classList.remove('modal-active');
             if (window.openedFromSettings && typeof settingsModal !== 'undefined' && settingsModal) {
                 settingsModal.classList.add('no-fade');
                 settingsModal.classList.remove('hidden');
                 document.body.classList.add('modal-active');
                 window.openedFromSettings = false;
             }
         }
        backdropDown = false;
    });
}
document.addEventListener('click', unlockAudio, { once: false });
document.addEventListener('touchstart', unlockAudio, { passive: true, once: false });

btnStart.addEventListener('click', () => {
    unlockAudio();
    startChat();
});

// Botn "Editar Departamentos" en Ajustes Generales > Interfaz (Master)   handler global robusto
const btnManageCategoriesGlobal = document.getElementById('btnManageCategories');
if (btnManageCategoriesGlobal) {
    btnManageCategoriesGlobal.onclick = (e) => {
        if (e) e.preventDefault();
        window.openedFromSettings = true;
        if (settingsModal) settingsModal.classList.add('hidden');
        openCategoryManager();
    };
}

// Botn ⢯  de gestin de categoras en pantalla de login (solo master)
const btnManageCatLogin = document.getElementById('btnManageCategoriesLogin');
if (btnManageCatLogin) {
    btnManageCatLogin.addEventListener('click', (e) => {
        e.preventDefault();
        openCategoryManager();
    });
}
usernameInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        unlockAudio();
        startChat();
    }
});

// Control de vibracin UI dinmico
const vibrationSettingContainer = document.getElementById('vibrationSettingContainer');
const vibrationToggle = document.getElementById('vibrationToggle');
const isAndroidDevice = /Android/i.test(navigator.userAgent);

if (isAndroidDevice && window.navigator && window.navigator.vibrate) {
    if (vibrationSettingContainer) vibrationSettingContainer.style.display = 'block';
} else {
    if (vibrationSettingContainer) vibrationSettingContainer.style.display = 'none';
    isVibrationEnabled = false; // Forzar apagado en Desktop o iOS (donde no funciona vibracin auto)
}

if (vibrationToggle) {
    vibrationToggle.addEventListener('change', (e) => {
        isVibrationEnabled = e.target.checked;
    });
}

// Toggle del panel
function togglePanel() {
    container.classList.toggle('panel-collapsed');
    // Mantener la flecha original y voltearla por CSS
}
panelToggle.addEventListener('click', togglePanel);
mainLogo.addEventListener('click', togglePanel);

// Swipe
let touchstartX = 0, touchendX = 0, touchstartY = 0, touchendY = 0;
function handleGesture() {
    const threshold = 50;
    const swipeX = touchendX - touchstartX;
    const swipeY = Math.abs(touchendY - touchstartY);
    if (swipeY < 60 && Math.abs(swipeX) > threshold) {
        if (swipeX > window.innerWidth * 0.1 || swipeX > 80) {
            if (container.classList.contains('panel-collapsed')) togglePanel();
        } else if (swipeX < -window.innerWidth * 0.1 || swipeX < -80) {
            if (!container.classList.contains('panel-collapsed')) togglePanel();
        }
    }
}
document.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
}, { passive: true });
document.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    touchendY = e.changedTouches[0].screenY;
    handleGesture();
}, { passive: true });

// === PTT ENGINE (Core Elite Unificado v46.4.31) ===
async function pttDown() {
    // [v46.4.31] Activacin Sncrona Prioritaria: Cero latencia de inicio
    if (typeof unlockAudio === 'function') unlockAudio();
    if (typeof activateIOSAudioSession === 'function') activateIOSAudioSession();

    // 1. Asegurar contexto sncrono
    if (!window.audioContext) window.audioContext = initAudioCtx();
    if (window.audioContext.state === 'suspended') {
        window.audioContext.resume().catch(e => console.warn('Ctx resume Error', e));
    }

    //  FIX V59.10: NO hacer calentamiento (causaba ruido horrible)
    // El hardware se calienta cuando el usuario presiona micrfono, no antes
    isPTTActive = true;
    updateMicButtonsUI(); // Feedback visual instantneo (Armed)

    if (!isRecording) {
        await startRecording(); // Calentamiento: NECESARIO para que mediaStream exista
        if (!isCapturingSpeech) startSpeechCapture();
    } else {
        if (!isCapturingSpeech) startSpeechCapture();
    }

    // Verificacin de carrera: si el usuario solt muy rpido
    if (micMode === 'ptt' && !isPTTActive) {
        if (isRecording) {
            setTimeout(() => { if (!isPTTActive) pttUp(); }, 50);
        }
        return;
    }

    if (isRecording && isPTTActive) {
        updateMicButtonsUI(); // Confirmacin visual (Talking)
        if (window.navigator?.vibrate) window.navigator.vibrate(60);
    }
}

function pttUp() {
    isPTTActive = false;
    // Detener la captura de voz (esto emite stop-speaking y procesa el mensaje final)
    endSpeechCapture(true);
    
    // [v60.ELITE] MANTENER MICRO CALIENTE:
    // No llamamos a stopRecording() aqu para evitar el "Cold Start" en la siguiente pulsacin.
    // El software gating en AudioCapture ya garantiza que no se enve audio si isPTTActive es false.
    
    updateMicButtonsUI(); // Restaurar todos los botones
    // [v59.12] Reset inmediato del vmetro al soltar para evitar "fantasmas" de audio
    if (volumeLevel) volumeLevel.style.width = '0%';
}

/**
 * [v46.4.30] UNIFICACIN TOTAL DE MANEJADORES
 * Concentra todos los disparadores en una nica lgica sncrona.
 */
function setupUnifiedPTTHandlers() {
    // [v60.Elite] Guardia de tiempo para dispositivos híbridos (Touch + Mouse)
    let lastPTTTouchTime = 0;

    const triggers = [
        { el: statusIndicator, prevent: true },
        { el: btnSend, prevent: false, checkText: true }
    ];

    triggers.forEach(({ el, prevent, checkText }) => {
        if (!el) return;

        const handleDown = (e) => {
            if (micMode !== 'ptt') return;

            // [v60.Elite] Prevención Quirúrgica de Ghost Clicks
            // Si el evento es táctil, actualizamos el timestamp
            if (e.type === 'touchstart') {
                lastPTTTouchTime = Date.now();
            }

            // Si es un clic de ratón, solo lo ignoramos si ocurrió inmediatamente después de un toque
            if (e.type === 'mousedown' && (Date.now() - lastPTTTouchTime < 500)) {
                return;
            }

            if (checkText) {
                const hasText = textInput.value && textInput.value.trim() !== '';
                if (hasText) return; // Si hay texto, este botn NO es PTT
            }

            if (prevent && e && e.cancelable) e.preventDefault();

            // Visual scale feedback para btnSend (clonacin sidebar)
            if (el === btnSend) el.style.transform = 'scale(0.95)';

            pttDown();
        };

        const handleUp = (e) => {
            if (micMode !== 'ptt') return;
            if (el === btnSend) el.style.transform = '';

            if (isPTTActive) {
                if (prevent && e && e.cancelable) e.preventDefault();
                pttUp();
            }
        };

        // Mouse Events
        el.addEventListener('mousedown', handleDown);
        el.addEventListener('mouseup', handleUp);
        el.addEventListener('mouseleave', handleUp);

        // Touch Events (Estricto { passive: false } para bloqueo de ghost clicks)
        el.addEventListener('touchstart', handleDown, { passive: false });
        el.addEventListener('touchend', handleUp, { passive: false });
        el.addEventListener('touchcancel', handleUp, { passive: false });
    });

    // Toggle click/touchend para modo Automático (VAD) en tablets legacy
    [statusIndicator].forEach(el => {
        if (!el) return;
        let lastToggleTouch = 0;
        const handleStatusToggle = (e) => {
            if (e.type === 'touchend') {
                lastToggleTouch = Date.now();
            } else if (e.type === 'click' && (Date.now() - lastToggleTouch < 300)) {
                return;
            }
            if (micMode === 'ptt') return;
            if (e.cancelable && e.type === 'touchend') e.preventDefault();
            toggleRecording();
        };
        el.addEventListener('click', handleStatusToggle);
        el.addEventListener('touchend', handleStatusToggle, { passive: false });
    });

    // Botón Central (btnSend) - Lógica de Click/Touch (Enviar vs Toggle)
    if (btnSend) {
        let lastSendTouch = 0;
        const handleSendAction = (e) => {
            if (e.type === 'touchend') {
                lastSendTouch = Date.now();
            } else if (e.type === 'click' && (Date.now() - lastSendTouch < 300)) {
                return;
            }

            const hasText = textInput && textInput.value.trim() !== '';
            if (hasText) {
                if (e.cancelable && e.type === 'touchend') e.preventDefault();
                sendMessage();
                
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobile && textInput) {
                    setTimeout(() => {
                        if (document.activeElement === textInput) {
                            textInput.blur();
                        }
                    }, 50);
                }
            } else if (micMode !== 'ptt') {
                if (e.cancelable && e.type === 'touchend') e.preventDefault();
                toggleRecording();
            }
        };

        btnSend.addEventListener('click', handleSendAction);
        btnSend.addEventListener('touchend', handleSendAction, { passive: false });
    }
}

// Inyectar unificacin
setupUnifiedPTTHandlers();

// [v46.4.30] Purga Radical: Los manejadores unificados se inicializan en setupUnifiedPTTHandlers()
// Eliminamos todos los bloques dispersos de addEventListener('mousedown/mouseup/touchstart/click')
// que existan previamente en esta seccin.

// Al escribir o ganar foco, forzar actualizacin de los iconos del botn enviar (mic vs flecha)
textInput.addEventListener('input', () => updateMicButtonsUI());
textInput.addEventListener('focus', () => updateMicButtonsUI());
textInput.addEventListener('blur', () => updateMicButtonsUI());

// --- Lgica de Envo de Fotos ---
btnAttach.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showCatFeedback(window.localesData?.alerts?.invalid_image || 'Por favor, selecciona una imagen válida.', 'error');
        return;
    }

    try {
        const imageData = await processImage(file);
        sendImageMessage(imageData);
        fileInput.value = ''; // Limpiar para permitir reenviar la misma foto si se desea
    } catch (err) {
        console.error('Error procesando imagen:', err);
        showCatFeedback(window.localesData?.alerts?.image_process_error || 'Error al procesar la imagen.', 'error');
    }
});

// Logic moved to image-utils.js

function sendImageMessage(base64Data) {
    const text = textInput.value.trim();
    const messageCategory = selectedCategories[0] || 'General';
    const data = {
        imageData: base64Data,
        category: messageCategory,
        text: text
    };
    safeEmit('send-message', data);
    triggerVibration(60);
    
    // Limpiar el input si se envió con la foto
    if (text) {
        textInput.value = '';
    }
}

// Visor de Imgenes - Lgica Avanzada (Pinch-to-Zoom & Pan)
if (imageModal && fullImage && closeViewer) {
    let currentScale = 1;
    let startDist = 0;
    let posX = 0;
    let posY = 0;
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    const resetZoom = () => {
        currentScale = 1;
        posX = 0;
        posY = 0;
        updateTransform(true);
    };

    const updateTransform = (smooth = false) => {
        fullImage.style.transition = smooth ? 'transform 0.3s ease' : 'none';
        fullImage.style.transform = `translate(${posX}px, ${posY}px) scale(${currentScale})`;
        if (currentScale > 1.05) fullImage.classList.add('zoomed');
        else fullImage.classList.remove('zoomed');
    };

    closeViewer.addEventListener('click', () => {
        imageModal.classList.add('hidden');
        resetZoom();
    });

    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal || e.target.classList.contains('viewer-content')) {
            imageModal.classList.add('hidden');
            resetZoom();
        }
    });

    fullImage.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentScale > 1.1) {
            resetZoom();
        } else {
            currentScale = 2.5;
            updateTransform(true); // Suave al hacer clic
        }
    });

    // Soporte para Mouse (Desktop Pan & Zoom)
    fullImage.addEventListener('mousedown', (e) => {
        if (currentScale > 1.1) {
            isDragging = true;
            startX = e.pageX - posX;
            startY = e.pageY - posY;
            fullImage.style.cursor = 'grabbing';
            e.preventDefault(); // Evita el arrastre por defecto del navegador
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging && currentScale > 1.1) {
            const dx = e.pageX - startX;
            const dy = e.pageY - posY;

            const rect = fullImage.getBoundingClientRect();
            const viewportW = window.innerWidth;
            const viewportH = window.innerHeight;

            const maxOffX = Math.max(0, (rect.width - viewportW) / 2) / currentScale;
            const maxOffY = Math.max(0, (rect.height - viewportH) / 2) / currentScale;

            posX = Math.min(Math.max(dx, -maxOffX), maxOffX);
            posY = Math.min(Math.max(dy, -maxOffY), maxOffY);

            updateTransform(false);
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        fullImage.style.cursor = currentScale > 1.1 ? 'zoom-out' : 'zoom-in';
    });

    // Botn derecho para Zoom (como pidi el usuario)
    fullImage.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (currentScale > 1.1) {
            resetZoom();
        } else {
            currentScale = 2.5;
            updateTransform(true);
        }
    });

    // Soporte para Gestos Tctiles (Pinch & Pan)
    fullImage.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].pageX - posX;
            startY = e.touches[0].pageY - posY;
        } else if (e.touches.length === 2) {
            isDragging = false;
            startDist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
        }
    }, { passive: true });

    fullImage.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isDragging && currentScale > 1) {
            // Desplazamiento (Pan) con lmites (clamping)
            const dx = e.touches[0].pageX - startX;
            const dy = e.touches[0].pageY - startY;

            // Clculo de lmites dinmicos basado en el zoom
            const rect = fullImage.getBoundingClientRect();
            const viewportW = window.innerWidth;
            const viewportH = window.innerHeight;

            // Solo permitir pan si la dimensin es mayor que el viewport
            const maxOffX = Math.max(0, (rect.width - viewportW) / 2) / currentScale;
            const maxOffY = Math.max(0, (rect.height - viewportH) / 2) / currentScale;

            // Aplicar lmites con margen de seguridad
            posX = Math.min(Math.max(dx, -maxOffX), maxOffX);
            posY = Math.min(Math.max(dy, -maxOffY), maxOffY);

            updateTransform(false); // Instantneo al arrastrar
        } else if (e.touches.length === 2 && startDist > 0) {
            // Zoom (Pinch)
            const currentDist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            const delta = currentDist / startDist;
            const newScale = Math.min(Math.max(1, currentScale * delta), 5);
            currentScale = newScale;
            startDist = currentDist;
            updateTransform(false);
        }
    }, { passive: true });

    fullImage.addEventListener('touchend', () => {
        isDragging = false;
        startDist = 0;
    });
}

textInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault(); // Evitar comportamientos por defecto del "intro" como saltos de lnea (si acaso)
        sendMessage();
    }
});

// Sensibilidad
const micSensitivity = document.getElementById('micSensitivity');
micSensitivity.addEventListener('input', function () {
    const val = parseInt(this.value, 10);
    currentSensitivity = val; // Mantener compatibilidad local
    if (window.audioState) {
        window.audioState.setState({ currentSensitivity: val });
    }
});

// Sincronizar estados iniciales de los toggles con las variables

if (sendAudioToggle) {
    sendAudio = sendAudioToggle.checked;
    if (window.audioState) window.audioState.setState({ sendAudio: sendAudio });
}

if (autoPlayToggle) {
    autoPlayRealtime = autoPlayToggle.checked;
    autoPlayToggle.addEventListener('change', function () {
        autoPlayRealtime = this.checked;
        console.log('  Reproduccin en tiempo real:', autoPlayRealtime ? 'ACTIVADA' : 'DESACTIVADA');
    });
}

// Cache Limit Slider
const cacheLimitSlider = document.getElementById('cacheLimitSlider');
const cacheLimitValue = document.getElementById('cacheLimitValue');
if (cacheLimitSlider && cacheLimitValue) {
    cacheLimitSlider.addEventListener('input', function () {
        cacheLimitValue.textContent = `${this.value}MB`;
    });
    cacheLimitSlider.addEventListener('change', function () {
        safeEmit('set-cache-limit', { limit: this.value });
    });
}

// Mensajes Toggles
const autoDeleteToggle = document.getElementById('autoDeleteToggle');
if (autoDeleteToggle) {
    autoDeleteToggle.addEventListener('change', function () {
        console.log('Auto-limpieza de cach:', this.checked ? 'ACTIVADA' : 'DESACTIVADA');
        // Si se implementa un switch global en el servidor, se enviara aqu
    });
}

// Transcripcin y Audio Toggle
const messagesModeSelect = document.getElementById('messagesModeSelect');
if (messagesModeSelect) {
    messagesModeSelect.addEventListener('change', function () {
        console.log('Modo de mensajes:', this.value);
        // 'both' (Transcripcin y audio) o 'text' (Solo transcripcin)
    });
}

// Linterna (Flashlight)
const flashlightSettingContainer = document.getElementById('flashlightSettingContainer');
const flashlightToggle = document.getElementById('flashlightToggle');
const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

if (isMobileDevice && flashlightSettingContainer && flashlightToggle) {
    flashlightSettingContainer.style.display = 'block';

    flashlightToggle.addEventListener('change', async function () {
        isFlashlightEnabled = this.checked;

        if (isFlashlightEnabled) {
            try {
                // Try to initialize the camera track to keep torch ready
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                const track = stream.getVideoTracks()[0];
                const capabilities = track.getCapabilities();

                if (capabilities.torch) {
                    flashlightTrack = track;
                } else {
                    // Torch not supported despite camera existing
                    track.stop();
                    flashlightTrack = null;
                    isFlashlightEnabled = false;
                    this.checked = false;
                    showCatFeedback(window.localesData?.alerts?.flashlight_not_supported || 'Tu dispositivo no soporta control de linterna desde el navegador', 'error');
                    flashlightSettingContainer.style.display = 'none';
                }
            } catch (e) {
                console.error("No se pudo acceder a la linterna:", e);
                isFlashlightEnabled = false;
                this.checked = false;
                // Omitimos el alert al inicio para no molestar al usuario si no da permisos de cmara de inmediato
                if (e.name !== 'NotAllowedError') {
                    showCatFeedback(window.localesData?.alerts?.camera_access_error || 'No se pudo acceder a la cámara trasera para la linterna', 'error');
                }
            }
        } else {
            if (flashlightTrack) {
                flashlightTrack.stop();
                flashlightTrack = null;
            }
        }
    });

    // ACTIVAR POR DEFECTO: Marcamos el check y disparamos el evento manualmente
    flashlightToggle.checked = true;
    flashlightToggle.dispatchEvent(new Event('change'));
}

function applyMicMode(mode) {

    micMode = mode;
    isPTTActive = false; 
    if (isCapturingSpeech) endSpeechCapture(false);

    const micSensitivity = document.getElementById('micSensitivity');
    const lblSensibilidad = document.getElementById('lblSensibilidad');
    const micControlTitle = document.getElementById('micControlTitle');

    if (micMode === 'ptt' && isRecording) {
        stopRecording();
    }

    // Leer textos del idioma activo. Fallback en castellano si an no hay locales.
    const sidebarL = window.localesData?.sidebar || {};
    const audioL   = window.localesData?.audio   || {};

    if (micMode === 'ptt') {
        if (micSensitivity) micSensitivity.style.display = 'none';
        if (lblSensibilidad) lblSensibilidad.textContent = sidebarL.lbl_sensibilidad_ptt || 'NIVEL DE ENTRADA';
        if (micControlTitle) micControlTitle.textContent = audioL.mic_level_ptt           || 'Nivel de Entrada';
    } else {
        if (micSensitivity) micSensitivity.style.display = 'block';
        if (lblSensibilidad) lblSensibilidad.textContent = sidebarL.lbl_sensibilidad      || 'NIVEL DE ENTRADA Y UMBRAL';
        if (micControlTitle) micControlTitle.textContent = audioL.mic_level               || 'Nivel de Entrada y Umbral';
    }

    updateMicButtonsUI();
}

// Selector de modo
const micModeSelect = document.getElementById('micModeSelect');
if (micModeSelect) {
    micModeSelect.addEventListener('change', function () {
        applyMicMode(this.value);
    });

    // Estado inicial: Forzar PTT por defecto y ocultar umbral
    micModeSelect.value = 'ptt';
    applyMicMode('ptt');
}

// PTT con barra espaciadora
document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && micMode === 'ptt' && !isPTTActive) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
        e.preventDefault(); pttDown();
    }
});
document.addEventListener('keyup', function (e) {
    if (e.code === 'Space' && micMode === 'ptt' && isPTTActive) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable) return;
        e.preventDefault(); pttUp();
    }
});


// Two-Finger PTT para dispositivos tctiles
// Inyeccin de dependencias: pttDown/pttUp se pasan como callbacks directos
// Modo PTT: mantener 2 dedos = hablar, soltar = parar (push-to-talk)
// Modo VAD: pulsar 2 dedos y soltar = toggle micrfono on/off
if (typeof initTwoFingerPTT === 'function') {
    initTwoFingerPTT({
        startTalk: pttDown,
        stopTalk: pttUp,
        toggleTalk: toggleRecording,
        getMode: function () { return micMode; },
        canActivate: function () {
            if (micMode === 'ptt') return !isPTTActive;
            return true;
        }
    });
}

// Control de Tamao de Fuente
const btnFontUp = document.getElementById('btnFontUp');
const btnFontDown = document.getElementById('btnFontDown');

// Rediseo v46.3: Escalado de fuente por slider
const fontSizeRange = document.getElementById('fontSizeRange');
const fontSizeDisplay = document.getElementById('fontSizeDisplay');
// currentFontSizePercent movida al bloque superior (v46.4.7)

if (fontSizeRange) {
    fontSizeRange.value = currentFontSizePercent;
    if (fontSizeDisplay) fontSizeDisplay.textContent = currentFontSizePercent + '%';

    fontSizeRange.oninput = () => {
        currentFontSizePercent = fontSizeRange.value;
        if (fontSizeDisplay) fontSizeDisplay.textContent = currentFontSizePercent + '%';
        updateChatFontSize();
        localStorage.setItem('talkme_font_percent', currentFontSizePercent);
    };
}

/**
 * [v59.43] Sincronizacin Typogrfica Global
 * Actualiza tamao y grosor de fuente en todo el ecosistema (Chat + Ajustes + Preview)
 */
function updateChatFontSize() {
    return settingsUI.updateChatFontSize();
}


/**
 * [v59.43] Controlador de Perillas Rotativas (Premium Knobs)
 * Convierte interacciones de arrastre en rotaciones de hardware virtual.
 */
function initTypographyKnobs() {
    if (window._typographyKnobsInitialized) return;
    window._typographyKnobsInitialized = true;

    const fontSizeKnob = document.getElementById('fontSizeKnob');
    const fontWeightKnob = document.getElementById('fontWeightKnob');

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
            const numMarks = 13; // Marcas graduadas en el arco de 300 grados
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
            // Sensibilidad dinmica basada en el rango para que el recorrido fsico sea consistente
            const range = this.max - this.min;
            const sensitivity = range / 400; // Recorrer todo el rango en ~400px

            let rawValue = this.startValue + deltaY * sensitivity;
            rawValue = Math.max(this.min, Math.min(this.max, rawValue));

            // 1. Giro visual continuo (suavidad premium)
            this.updateDial(rawValue);

            // 2. Lgica discreta solo para el estado/callback
            let logicalValue = this.isSteps ? Math.round(rawValue / 100) * 100 : Math.round(rawValue);

            if (logicalValue !== this.value) {
                this.value = logicalValue;
                this.callback(this.value);
            }
        }

        onEnd() {
            this.isDragging = false;
            this.el.classList.remove('active');
            // Al soltar, ajustar el dial al valor lgico final (snap)
            this.updateDial(this.value);

            // [v59.Elite] Mostrar botn de guardado global
            if (typeof showGlobalSaveBtn === 'function') showGlobalSaveBtn();
        }

        updateDial(val) {
            const displayVal = val !== undefined ? val : this.value;
            // Mapear valor a grados (arco de 300deg: -150 a 150)
            const range = this.max - this.min;
            const percent = (displayVal - this.min) / range;
            const degrees = (percent * 300) - 150;
            if (this.dial) {
                this.dial.style.transform = `rotate(${degrees}deg)`;
            }

            // [v59.43] Iluminar marcas graduadas por las que ha pasado el indicador
            const marks = this.el.querySelectorAll('.knob-mark');
            marks.forEach((mark, index) => {
                const markPercent = index / (marks.length - 1);
                const markDeg = (markPercent * 300) - 150;
                if (markDeg <= degrees) {
                    mark.classList.add('active');
                } else {
                    mark.classList.remove('active');
                }
            });
        }
    }

    // Inicializar Perilla de Tamao
    if (fontSizeKnob) {
        new KnobController(fontSizeKnob, 50, 250, currentFontSizePercent, (val) => {
            currentFontSizePercent = val;
            const display = document.getElementById('fontSizeKnobValue');
            if (display) display.textContent = val + '%';
            updateChatFontSize();
            localStorage.setItem('talkme_font_percent', val);
        });
        // Sincronizar display inicial
        const display = document.getElementById('fontSizeKnobValue');
        if (display) display.textContent = currentFontSizePercent + '%';
    }

    // Inicializar Perilla de Grosor
    if (fontWeightKnob) {
        new KnobController(fontWeightKnob, 100, 900, currentFontWeight, (val) => {
            currentFontWeight = val;
            const display = document.getElementById('fontWeightKnobValue');
            if (display) display.textContent = val;
            updateChatFontSize();
            localStorage.setItem('talkme_font_weight', val);
        }, true);
        // Sincronizar display inicial
        const display = document.getElementById('fontWeightKnobValue');
        if (display) display.textContent = currentFontWeight;
    }
}

// Listener para cambio de salida de audio
if (audioOutputSelect) {
    audioOutputSelect.addEventListener('change', async () => {
        const selected = audioOutputSelect.value;

        if (selected === 'mute') {
            setMute(true);
        } else {
            setMute(false);
            localStorage.setItem('talkme_preferred_output', selected || '');

            // [v59.18] Actualizar lista de canales para la salida seleccionada
            await updateChannelSelectors('output', selected);

            if (window._autoPlayPlayer) applyAudioOutput(window._autoPlayPlayer);
            if (audioContext) applyAudioOutput(audioContext);
            if (typeof audioCtx !== 'undefined' && audioCtx) applyAudioOutput(audioCtx);
        }
    });
}

// [v59.18] Listener para canal de salida
if (audioOutputChannelSelect) {
    audioOutputChannelSelect.addEventListener('change', function () {
        const channelIndex = parseInt(this.value) || 0;
        const deviceId = audioOutputSelect.value;

        console.log(`📡 [AUDIO] Canal de Salida cambiado -> Ch ${channelIndex + 1}`);
        audioState.setState({ outputChannel: channelIndex });

        // Guardar persistencia persistente por dispositivo (Sticky)
        if (deviceId) {
            const mapping = audioState.get('deviceChannelMapping') || {};
            if (!mapping[deviceId]) mapping[deviceId] = {};
            mapping[deviceId].output = channelIndex;
            audioState.setState({ deviceChannelMapping: mapping });
            localStorage.setItem('talkme_device_channels', JSON.stringify(mapping));
        }

        // Re-ruteo inmediato
        applyAudioOutputChannel(channelIndex);
    });
}

// Listener para cambio de entrada de audio
if (audioDeviceSelect) {
    audioDeviceSelect.addEventListener('change', async () => {
        const selected = audioDeviceSelect.value;
        const selectedOption = audioDeviceSelect.options[audioDeviceSelect.selectedIndex];
        if (selectedOption && selectedOption.text) {
            localStorage.setItem('talkme_preferred_audio_label', selectedOption.text);
        }
        localStorage.setItem('talkme_preferred_audio_input', selected);
        localStorage.setItem('talkme_deviceId', selected); // Mantener por compatibilidad legado
        audioState.setState({ deviceId: selected });

        // Actualizar lista de canales para la entrada seleccionada
        await updateChannelSelectors('input', selected);

        // Forzar switchMic: esto invoca getUserMedia con el deviceId y actualiza pipeline
        try {
            // [v60] Limpiar cachs de flujo para forzar deteccin de cambio
            window._cachedAudioStream = null;
            window._cachedAudioSource = null;

            if (isRecording) {
                console.log('  Reiniciando grabacin por cambio de dispositivo/canal (switchMic)...');
                stopRecording();
                await switchMic(selected);
                setTimeout(startRecording, 300);
            } else {
                console.log('  Aplicando switchMic en monitor por cambio de entrada...');
                await switchMic(selected);
            }
        } catch (e) {
            console.warn('switchMic fallo en change handler:', e && e.message);
            // Fallback: try previous approach
            try { window.mediaStream = null; await startRecording(); } catch (_) { }
        }
    });
}

// [v59.18] Listener para canal de entrada
if (audioDeviceChannelSelect) {
    audioDeviceChannelSelect.addEventListener('change', async function () {
        const channelIndex = parseInt(this.value) || 0;
        const deviceId = audioDeviceSelect.value;

        // [v60.ELITE FIX - Sol.1] Comprobar si el canal está siendo usado por algún sub-usuario
        const currentUsername = localStorage.getItem('talkme_username') || '';
        const currentUserData = (window.lastUsersData || []).find(u => u.username === currentUsername) || {};
        const subusers = currentUserData.subUsers || JSON.parse(localStorage.getItem('talkme_cached_subusers') || '[]');

        const isOccupiedBySub = subusers.some(su => {
            return su.mic &&
                   (window.areDevicesIdentical ? window.areDevicesIdentical(su.mic.deviceId, deviceId) : su.mic.deviceId === deviceId) &&
                   parseInt(su.mic.channel, 10) === channelIndex;
        });

        if (isOccupiedBySub) {
            if (typeof showCatFeedback === 'function') {
                showCatFeedback(window.localesData?.alerts?.channel_in_use || 'Error: Este canal está siendo usado por un sub-usuario.', 'error');
            }
            // Revertir selector al valor anterior
            const prevChannel = audioState.get('inputChannel') || 0;
            this.value = prevChannel;
            return;
        }

        console.log(`🔌 [AUDIO] Canal de Entrada cambiado -> Ch ${channelIndex + 1}`);
        
        // 1. Sincronizar estado ANTES de reiniciar el pipeline
        audioState.setState({ inputChannel: channelIndex });

        // 2. Persistencia Sticky
        if (deviceId) {
            const mapping = audioState.get('deviceChannelMapping') || {};
            if (!mapping[deviceId]) mapping[deviceId] = {};
            mapping[deviceId].input = channelIndex;
            audioState.setState({ deviceChannelMapping: mapping });
            localStorage.setItem('talkme_device_channels', JSON.stringify(mapping));
        }
        // 3. Reinicio del pipeline para aplicar el nuevo canal en el splitter
        if (isRecording) {
            console.log(' [AUDIO] Reiniciando pipeline por cambio de canal...');
            stopRecording();
            // Pequeño delay para asegurar que el hardware libere el recurso
            setTimeout(startRecording, 300);
        } else {
            const currentStream = audioState.get('mediaStream') || window.mediaStream;
            if (currentStream && currentStream.active) {
                console.log('🔌 [AUDIO] Reconectando analizador en caliente para canal:', channelIndex + 1);
                try {
                    setupAudioAnalysis(currentStream);
                } catch (e) {
                    console.warn('Error reconectando analizador en caliente:', e);
                }
            }
        }
    });
}

// Rescatar AudioContext en iOS cuando sufre bloqueos o entra/sale del reposo
const unlockWebAudioOnWake = () => {
    if (audioContext && audioContext.state === 'suspended') audioContext.resume().catch(() => { });
    if (typeof audioCtx !== 'undefined' && audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => { });
};

/**
 * iOS: Reinicia el pipeline AudioWorklet tras lock/unlock.
 *
 * Por qu es necesario:
 *   Cuando iOS suspende el audioContext al bloquear la pantalla y luego lo
 *   reanuda al desbloquear, el hilo del AudioWorklet queda desincronizado
 *   con el hardware del micrfono. Los chunks PCM resultantes tienen
 *   tamaos irregulares  audio cortado en el receptor.
 *
 * Por qu el audio sala "doble" antes de este fix:
 *   AudioWorkletNode.process() retorna true  el nodo sobrevive aunque
 *   llabes a .disconnect(). Sin anular port.onmessage, el Worklet antiguo
 *   sega llamando a processAudioChunk() junto al nuevo  audio duplicado.
 *
 * Solucin:
 *   1. _pipelineRestarting = true: silencia ambos procesadores durante el restart
 *   2. Anular handlers (port.onmessage / onaudioprocess) ANTES de disconnect
 *   3. Desconectar tambin el source node (guardado en window._audioWorkletSource)
 *   4. Reconstruir pipeline con setupAudioAnalysis()
 *   5. _pipelineRestarting = false: reanudar envo de chunks
 */
async function restartAudioPipelineAfterWake() {
    if (!isRecording || !mediaStream) return;
    // Prevenir reentrada si ya se est reiniciando
    if (window._pipelineRestarting) return;

    // Verificar que las pistas del micro siguen vivas
    const tracks = mediaStream.getAudioTracks();
    if (!tracks || tracks.length === 0 || tracks[0].readyState === 'ended') {
        console.warn('  iOS Wake: pistas de audio terminadas   se requiere reactivar micrfono manualmente');
        return;
    }

    console.log('  iOS Wake: Reiniciando pipeline AudioWorklet tras desbloqueo...');

    // 1. Flag de silencio: bloquea processAudioChunk en AMBOS procesadores
    //    (el antiguo y cualquier remanente) durante todo el proceso de restart
    window._pipelineRestarting = true;

    // 2. Detener el bucle RAF del analizador de volumen
    analyser = null;

    // 3. CR TICO: Anular handlers ANTES de disconnect.
    //    AudioWorkletNode retorna true en process()  sigue vivo tras disconnect().
    //    Sin anular port.onmessage, el Worklet antiguo sigue enviando chunks
    //     audio duplicado en el receptor.
    if (audioProcessor) {
        try { audioProcessor.port && (audioProcessor.port.onmessage = null); } catch (e) { }
        try { audioProcessor.onaudioprocess = null; } catch (e) { }
        try { audioProcessor.disconnect(); } catch (e) { }
        audioProcessor = null;
    }

    // 4. Desconectar el MediaStreamSource antiguo
    //    (sin esto sigue en el grafo del AudioContext creando un subgrafo hurfano)
    if (window._audioWorkletSource) {
        try { window._audioWorkletSource.disconnect(); } catch (e) { }
        window._audioWorkletSource = null;
    }

    // 5. Pequea pausa para que el RAF muerto no genere garbage
    await new Promise(resolve => setTimeout(resolve, 80));

    // 6. Reconstruir el grafo de audio completamente con el mismo MediaStream
    try {
        await setupAudioAnalysis(mediaStream);
        console.log(' iOS Wake: Pipeline de audio reiniciado   AudioWorklet OK');
    } catch (e) {
        console.warn('  iOS Wake: Error al reiniciar pipeline de audio:', e.message);
    } finally {
        // 7. Reanudar envo de chunks (siempre, incluso si hubo error)
        window._pipelineRestarting = false;
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        unlockWebAudioOnWake();

        // iOS especfico: tras lock/unlock el AudioWorklet queda desincronizado
        // del hardware del micrfono  audio enviado cortado.
        // Reiniciamos el pipeline 600ms despus de volver visible para dar
        // tiempo al OS a restaurar completamente el hardware de audio.
        const isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isIOSDevice && isRecording && mediaStream) {
            setTimeout(() => {
                if (isRecording && mediaStream) {
                    restartAudioPipelineAfterWake();
                }
            }, 600);
        }

        // --- Recuperacin de Sesin (V46.4.6) ---
        // Si el navegador limpi la memoria del mdulo en background, restauramos desde sessionStorage
        if (!currentUsername) {
            const saved = restoreLocalSession();
            if (saved) {
                console.log('  Sesin recuperada de sessionStorage tras despertar');
                currentUsername = saved.username;
                currentRoomPin = saved.roomPin;
                currentCategories = saved.categories || [];
                // window.isMaster = saved.isMaster || false; // ELIMINADO: Prioridad a la re-validación del servidor
                if (typeof window.refreshMasterUI === 'function') window.refreshMasterUI();
            }
        }

        // --- Pulso de Sincronizacin Agresivo ---
        // Forzamos un re-join para que el servidor nos enve el historial perdido.
        if (currentUsername) {
            performJoinChat('visibility-wake-up');
            // Forzamos un scroll tras un pequeo delay para asegurar renderizado
            setTimeout(() => scrollToBottom(true), 100);
        }
    }
});
// Tambin en eventos tctiles arbitrarios (Apple strict policy)
['click', 'touchstart', 'touchend'].forEach(evt => document.addEventListener(evt, unlockWebAudioOnWake, { passive: true }));


// Inicializar tamao
updateChatFontSize();

// === SOCKET ===
//  ACTIVO - Mantenemos initSocket() funcionando mientras integramos gradualmente
// Los adaptadores DOMManager y AudioStateManager estn asegurando compatibilidad
// Toda referencia global se redirige automticamente a travs de Object.defineProperty()
// 
// TODO FUTURO: Reemplazar con SocketHandlers una vez validada migracin completa

/**
 * [v59.18] - UNIFICADOR DE IP DIN MICA
 * Sincroniza la visualizacin de la IP en el Chat Header y el Modal de Login.
 * Mantiene estilos especficos y habilita copia al portapapeles en ambos.
 */
function updateDynamicIPDisplays(primaryUrl) {
    if (!primaryUrl) return;

    // [v59.19] Limpiar URL para visualizacin (quitar https:// y / final)
    const displayUrl = primaryUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // 1. Chat Header (Preservar estilo Mono)
    const connectionStatusIP = document.getElementById('connectionStatusIP');
    if (connectionStatusIP) {
        if (connectionStatusIP.textContent !== displayUrl) connectionStatusIP.textContent = displayUrl;
        connectionStatusIP.style.cursor = 'pointer';
        connectionStatusIP.title = 'Click para copiar URL completa';

        if (!connectionStatusIP._hasListener) {
            connectionStatusIP.onclick = (e) => {
                if (e) e.stopImmediatePropagation();
                const urlToCopy = connectionStatusIP.dataset.fullUrl || primaryUrl;
                copyTextToClipboard(urlToCopy).then(() => {
                    const originalText = connectionStatusIP.textContent;
                    connectionStatusIP.textContent = window.localesData?.interface?.copied || 'Copiado!';
                    connectionStatusIP.style.color = 'var(--text-secondary)';
                    setTimeout(() => {
                        connectionStatusIP.textContent = originalText;
                        connectionStatusIP.style.color = '';
                    }, 2000);
                });
            };
            connectionStatusIP._hasListener = true;
        }
        connectionStatusIP.dataset.fullUrl = primaryUrl;
    }

    // 2. Login Modal (Botn Pill interactivo)
    const loginIpDisplay = document.getElementById('loginIpDisplay');
    if (loginIpDisplay) {
        let btn = document.getElementById('loginConnectBtn');
        const connectAtStr = (typeof localesData !== 'undefined' && localesData && localesData.login)
            ? localesData.login.connect_at
            : 'Conectar en:';

        if (!btn) {
            // [v60.Elite] Solo creamos el HTML la PRIMERA VEZ para evitar Layout Shifts y Ghost Clicks
            loginIpDisplay.innerHTML = `
                <button class="login-connect-btn" id="loginConnectBtn" title="Copiar URL completa al portapapeles">
                    <span class="login-connect-icon">
                        <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                    </span>
                    <span class="login-connect-label">${connectAtStr}</span>
                    <span class="login-connect-url">${displayUrl}</span>
                </button>
            `;
            btn = document.getElementById('loginConnectBtn');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    const urlToCopy = btn.dataset.fullUrl || primaryUrl;
                    copyTextToClipboard(urlToCopy).then(() => {
                        const urlSpan = btn.querySelector('.login-connect-url');
                        const lblSpan = btn.querySelector('.login-connect-label');
                        const iconSpan = btn.querySelector('.login-connect-icon');
                        if (!urlSpan || !lblSpan || !iconSpan) return;

                        const origUrl = urlSpan.textContent;
                        const origLbl = lblSpan.textContent;
                        const origIcon = iconSpan.innerHTML;

                        btn.classList.add('copied');
                        iconSpan.innerHTML = `
                            <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        `;
                        const copiedStr = (typeof localesData !== 'undefined' && localesData && localesData.interface && localesData.interface.copied)
                            ? localesData.interface.copied
                            : ((window.localesData && window.localesData.interface && window.localesData.interface.copied)
                                ? window.localesData.interface.copied
                                : 'Copiado!');
                        lblSpan.textContent = copiedStr;

                        setTimeout(() => {
                            btn.classList.remove('copied');
                            iconSpan.innerHTML = origIcon;
                            lblSpan.textContent = origLbl;
                            urlSpan.textContent = origUrl;
                        }, 2000);
                    });
                });
            }
        } else {
            // [v60.Elite] ACTUALIZACIN QUIRRGICA: Solo cambiamos los nodos de texto si han variado
            const urlSpan = btn.querySelector('.login-connect-url');
            const lblSpan = btn.querySelector('.login-connect-label');
            if (urlSpan && urlSpan.textContent !== displayUrl) urlSpan.textContent = displayUrl;
            if (lblSpan && lblSpan.textContent !== connectAtStr) lblSpan.textContent = connectAtStr;
        }
        // Actualizar la URL de referencia en el dataset (por si cambia dinmicamente)
        if (btn) btn.dataset.fullUrl = primaryUrl;
    }
}

/**
 * Utilidad universal para copiar al portapapeles con fallback.
 */
function copyTextToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }
    const tmp = document.createElement('input');
    tmp.value = text;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand('copy');
    document.body.removeChild(tmp);
    return Promise.resolve();
}

function initSocket() {
    if (window._socketLoading) return;
    window._socketLoading = true;
    
    if (window.socket) {
        console.log('  [SOCKET] Limpiando instancia previa...');
        window.socket.close();
    }

    //                                                                                 
    //  REFACTORIZADO: initSocket() ahora delega en SocketHandlers (v60)
    //                                                                                 
    const socket = io();
    window.socket = socket;
    
    // Vincular módulos dependientes
    if (window.smpteCapture && typeof window.smpteCapture.setSocket === 'function') {
        window.smpteCapture.setSocket(socket);
    }
    if (window.triggersModule) window.triggersModule.connectSocket(socket);
    setupEliteTransport(socket);

    // Instanciar y configurar handlers modularizados
    // Inyeccin de dependencias: socket, domManager, audioState, triggersModule
    const handlers = new SocketHandlers(socket, dom, audioState, window.triggersModule);
    handlers.setupAll();

    // Guardar referencia global si es necesario por compatibilidad
    window.socketHandlers = handlers;

    const preferredId = localStorage.getItem('talkme_preferred_audio_input') || localStorage.getItem('talkme_deviceId') || 'default';
    let preferredLabel = '';
    if (preferredId && window.lastAudioDevices) {
        const found = window.lastAudioDevices.find(d => d.deviceId === preferredId);
        if (found) preferredLabel = found.label;
    }
    const initConstraints = window.getEliteConstraints ? window.getEliteConstraints(preferredId, preferredLabel) : { audio: true };

    navigator.mediaDevices.getUserMedia(initConstraints).then(async stream => {
        // [v59.28] Monitorización persistente: No detenemos los tracks, inicializamos el anlisis visual
        window.mediaStream = stream; // Guardar referencia global
        await setupAudioAnalysis(stream);
        
        // Cargar dispositivos (esto puebla los selectores)
        await getAudioDevices();

        // [v60.ELITE] SINCRONIZACIÓN DE HARDWARE PREFERIDO AL INICIO
        // Si el usuario tiene una placa pro guardada, forzamos el switch para que cargue con sus constraints reales
        const savedInput = localStorage.getItem('talkme_preferred_audio_input') || localStorage.getItem('talkme_deviceId');
        if (savedInput && audioDeviceSelect.value === savedInput) {
            console.log(`🚀 [ELITE] Sincronizando hardware preferido: ${savedInput}`);
            // switchMic() leerá el valor de audioDeviceSelect.value automáticamente
            if (typeof switchMic === 'function') switchMic();
        } else {
            // [v60.ELITE FIX - Sol.2A] Cold-start: emitir canal inicial si switchMic no va a ejecutarse
            try {
                const initDeviceId = preferredId || 'default';
                const initChannel = (window.audioState && window.audioState.get) ? (parseInt(window.audioState.get('inputChannel')) || 0) : 0;
                if (window.socket && window.socket.connected) {
                    window.socket.emit('set-master-mic', { deviceId: initDeviceId, channel: initChannel });
                    console.log(`🛡️ [AUDIO] Master mic inicial registrado en servidor: ${initDeviceId} Ch ${initChannel + 1}`);
                }
            } catch (e) { console.warn('set-master-mic cold-start error:', e); }
        }
    }).catch(err => {
        console.warn("No se pudo pre-autorizar el micrfono:", err);
    });

    // --- Lgica de sincronizacin persistente ---
    socket.emit('get-dictionary', { lang: currentLang });
    setInterval(() => {
        if (socket.connected) socket.emit('get-dictionary', { lang: currentLang });
    }, 30000);
}

// === GRABACIN (v46.4.10 Restaurada) ===
async function startChat() {
    // [CR TICO v46.4.9] ACTIVACIN DE AUDIO INMEDIATA
    // Debe ser lo primero que ocurra en el stack sncrono del click para que Safari no bloquee la sesin.
    if (typeof window.activateIOSAudioSession === 'function') {
        window.activateIOSAudioSession();
    }

    const username = usernameInput.value.trim();
    if (!username) {
        const errorMsg = (localesData && localesData.login) ? localesData.login.error_name : 'Por favor, ingresa un nombre de usuario';
        showCatFeedback(errorMsg, 'error');
        return;
    }

    // Obtener categora seleccionada
    const categorySelect = document.getElementById('categorySelect');
    if (!categorySelect || !categorySelect.value) {
        const errorCat = (localesData && localesData.login) ? localesData.login.error_category : 'Por favor, selecciona una categora';
        showCatFeedback(errorCat, 'error');
        return;
    }
    selectedCategories = [categorySelect.value];

    currentUsername = username;
    if (typeof window.unlockAudio === 'function') window.unlockAudio(); // Desbloquear audio en iPhone/Safari (VAD Context)
    if (typeof window.activateWakeLock === 'function') window.activateWakeLock(); // Sistema anti-bloqueo de pantalla

    // [v46.4.9] Eliminada llamada duplicada aqu para evitar race conditions en Safari
    triggerVibration(10); // "Pre-warm" tctico

    // PWA/Desktop futuro: Pedir permiso de notificaciones nativas suavemente
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    const pinInput = document.getElementById('pinInput');
    const pin = pinInput ? pinInput.value.trim() : '';

    // [v46.4.92] Gestin de Identidad Digital Persistente (Token de Sesin)
    let sessionToken = localStorage.getItem('talkme_session_token');
    if (!sessionToken) {
        sessionToken = 'tk-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem('talkme_session_token', sessionToken);
    }

    // [v60.MEMORIA] Persistencia local eliminada aquí por privacidad.
    // Ahora se gestiona exclusivamente en SocketHandlers tras validar el rol de Master.

    // [v59.27] Usar funcin centralizada de unin
    performJoinChat('manual-login');

    // Construir interfaz de filtros
    createFilterBar();

    const preferredId = localStorage.getItem('talkme_preferred_audio_input') || localStorage.getItem('talkme_deviceId') || 'default';
    let preferredLabel = '';
    if (preferredId && window.lastAudioDevices) {
        const found = window.lastAudioDevices.find(d => d.deviceId === preferredId);
        if (found) preferredLabel = found.label;
    }
    const startConstraints = window.getEliteConstraints ? window.getEliteConstraints(preferredId, preferredLabel) : { audio: true };

    navigator.mediaDevices.getUserMedia(startConstraints).then(async stream => {
        // [v59.28] Monitorizacin persistente: No detenemos los tracks, inicializamos el anlisis visual
        window.mediaStream = stream; // Guardar referencia global
        await setupAudioAnalysis(stream);
        getAudioDevices();
    }).catch(err => {
        console.warn("No se pudo pre-autorizar el micrfono:", err);
    });
}

// Asignar el handler del botn Talk
btnStart.onclick = startChat;

// Sincroniza visualmente los botones de micro y enviar segn el estado actual
function updateMicButtonsUI() {
    // 0. Determinacin de Estados Crticos (Hito Elite v41)
    const isActuallyTalking = isRecording && (
        (micMode === 'auto' && isCapturingSpeech) || 
        (micMode === 'ptt' && isPTTActive)
    );
    const isArmedButIdle = isRecording && !isActuallyTalking && micMode === 'auto';

    const chatLoc = localesData?.chat || {};



    // 3. UI del botn enviar (Lgica v41 para el icono central)
    const hasText = textInput.value && textInput.value.trim() !== '';
    const isFocused = document.activeElement === textInput;
    
    if (hasText || isFocused) {
        if (btnSendText) btnSendText.style.display = 'none';
        if (btnSendIcon) btnSendIcon.style.display = 'none';
        if (btnSendArrowIcon) btnSendArrowIcon.style.display = 'inline-block';
    } else {
        if (btnSendText) btnSendText.style.display = 'none';
        if (btnSendIcon) btnSendIcon.style.display = 'inline-block';
        if (btnSendArrowIcon) btnSendArrowIcon.style.display = 'none';
    }

    if (isActuallyTalking) {
        if (btnSend) {
            btnSend.classList.add('active-ptt', 'status-talking');
        }
        if (statusIndicator) {
            statusIndicator.classList.add('active');
            // Solo aadimos 'speaking' (animacin) si realmente hay voz o es PTT
            if (micMode !== 'auto' || isCapturingSpeech) {
                statusIndicator.classList.add('speaking');
            } else {
                statusIndicator.classList.remove('speaking');
            }
        }

        // AJUSTE: Texto dinmico
        if (statusIndicatorText) statusIndicatorText.textContent = chatLoc.status_speaking || 'HABLANDO...';

    } else if (isArmedButIdle) {
        // [v59.15] Ajuste de Ingeniera de lite: 
        // En PTT, el botn solo brilla si hay texto para enviar. 
        // Si no hay texto, permanece apagado aunque el micro est "Armado".
        if (btnSend) {
            // [v59.15] Ajuste de Ingeniera de lite: 
            // En PTT, el botn solo brilla si hay texto para enviar. 
            // En AUTO, brilla siempre que est escuchando (Armed).
            const shouldGlow = (micMode === 'auto') || (textInput.value?.trim());
            
            if (shouldGlow) {
                btnSend.classList.add('active-ptt');
                // [v60.1] Mejora de UX: En modo AUTO, el botón debe ser NARANJA (status-talking) siempre que esté armado
                if (micMode === 'auto') {
                    btnSend.classList.add('status-talking');
                } else {
                    btnSend.classList.remove('status-talking');
                }
            } else {
                btnSend.classList.remove('active-ptt', 'status-talking');
            }
        }

        if (statusIndicator) {
            statusIndicator.classList.add('active');
            statusIndicator.classList.remove('speaking');
        }

        if (statusIndicatorText) {
            statusIndicatorText.textContent = (micMode === 'auto') ? 'ACTIVO' : (chatLoc.status_ready || 'Talk!');
        }

    } else {
        // --- ESTADO: OFF ---
        if (btnSend) btnSend.classList.remove('active-ptt', 'status-talking');
        if (statusIndicator) statusIndicator.classList.remove('active', 'speaking');

        if (statusIndicatorText) statusIndicatorText.textContent = chatLoc.status_silent || 'EN SILENCIO';
    }
}

// [v46.4.20] El bloque duplicado de Restauracin (Hito 46.4.0) ha sido extirpado 
// porque provocaba un Race Condition letal en `btnSend` contra el ecosistema PTT Elitista.

async function toggleRecording() {
    unlockAudio(); // Volver a asegurar el desbloqueo al usar el micro
    // Reforzar sesin de audio iOS en cada gesto sobre el micrfono
    if (typeof activateIOSAudioSession === 'function') activateIOSAudioSession();

    // [v46.4.17] Forzar inicio de AudioContext en el evento click
    if (!window.audioContext) window.audioContext = initAudioCtx();
    if (window.audioContext.state === 'suspended') {
        try { await window.audioContext.resume(); } catch (e) { console.warn('Ctx resume Error', e); }
    }

    if (!isRecording) {
        await startRecording();
        // [v59.13] Ajuste quirrgico: En modo 'auto' no iniciamos captura al encender.
        // Esperamos a que el vmetro supere el umbral en analyzeVolume().
        if (isRecording && micMode !== 'auto') startSpeechCapture();
    } else {
        stopRecording();
    }
}

// micModeSelect.onchange gestionado en lnea ~3268 via applyMicMode()  no duplicar aqu

async function startRecording() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showCatFeedback(window.localesData?.alerts?.audio_record_not_supported || 'Tu navegador no soporta grabación de audio', 'error');
            return;
        }

        // [v46.4.11 Reparacin] Si ya tenemos un stream activo y sano, no lo volvemos a pedir. 
        // Detener los tracks cada vez (como ocurra en v46.4.9) rompa el MediaRecorder.
        // [v60.Elite] VALIDACIÓN DINÁMICA DE HARDWARE
        const currentUiDeviceId = (audioDeviceSelect && audioDeviceSelect.value) ? audioDeviceSelect.value : '';
        const streamDeviceId = (mediaStream && mediaStream.getAudioTracks()[0]) ? mediaStream.getAudioTracks()[0].getSettings().deviceId : null;

        // Si el usuario seleccionó algo, el hardware debe coincidir exactamente.
        const isCorrectDevice = streamDeviceId && currentUiDeviceId && (streamDeviceId === currentUiDeviceId);
        const existingStreamActive = isCorrectDevice && mediaStream && mediaStream.active && mediaStream.getAudioTracks().every(t => t.readyState === 'live');

        const stream = existingStreamActive ? mediaStream : await (async () => {
            // [v60.ELITE] Negociación multicanal de alto rendimiento
            const deviceId = audioDeviceSelect.value || 'default';
            const deviceLabel = audioDeviceSelect.selectedOptions[0]?.text || '';
            const eliteConstraints = getEliteConstraints(deviceId, deviceLabel);

            let newStream = null;
            let lastError = null;

            try {
                console.log(`🎙️ [AUDIO-HW] Negociando stream multicanal para: ${deviceLabel}`, eliteConstraints);
                newStream = await navigator.mediaDevices.getUserMedia(eliteConstraints);
            } catch (err) {
                lastError = err;
                console.debug(' Perfil élite falló, reintentando con fallback permisivo:', err.message);
                
                // Fallback permisivo si el hardware rechaza la negociación multicanal estricta
                try {
                    const fallbackConstraints = window.getEliteConstraints ? window.getEliteConstraints(deviceId, deviceLabel) : { audio: { deviceId: { exact: deviceId } } };
                    newStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
                } catch (err2) {
                    lastError = err2;
                    try {
                        const genericConstraints = window.getEliteConstraints ? window.getEliteConstraints('default', '') : { audio: true };
                        newStream = await navigator.mediaDevices.getUserMedia(genericConstraints);
                    } catch (e) { }
                }
            }

            if (!newStream) {
                throw lastError || new Error('No se pudo obtener acceso al micrófono');
            }

            return newStream;
        })();

        mediaStream = stream;
        isRecording = true;

        // ❧ INGENIERA: Generar streamingId ANTES de setupAudioAnalysis para que AudioWorklet tenga ID desde el inicio
        //  FIX V59.8: Permitir grabacin incluso sin socket (streaming es mejor-effort)
        if (window.socket && window.socket.connected && window.socket.id) {
            streamingId = `str-${window.socket.id}-${Date.now()}`;
            window.streamingId = streamingId; // Sync bridge para audio-core.js
            console.log(`⢯ [PRE-INIT] streamingId generado: ${streamingId}`);
        } else {
            streamingId = `str-local-${Date.now()}`;
            window.streamingId = streamingId; // Sync bridge para audio-core.js
            console.warn(` [PRE-INIT] Socket no disponible - usando streamingId local`);
        }

        // UI
        updateMicButtonsUI();

        await setupAudioAnalysis(stream);

        // Transcripcin se maneja completamente en servidor (Vosk o fallback local)
        // No se necesita configuracin adicional del lado cliente

        // [v46.4.18] Eliminada remocin de clase 'show' y mensaje invasivo para evitar colisin visual con Vosk

    } catch (error) {
        console.error('Error al acceder al micrfono:', error);
        showCatFeedback((window.localesData?.alerts?.mic_error || 'Error de micrófono: ') + (error.name || 'Desconocido') + ' — ' + (error.message || 'Sin detalles'), 'error');
    }
}

/**
 * [v46 RESTORED] TRIPLE FALLBACK: Vosk (servidor)  Browser (Web Speech API)  Fallback Local
 *
 * La transcripcin puede manejarse:
 *   - Vosk: Motor offline profesional en servidor (mejor)
 *   - Browser: Web Speech API del navegador (segunda opcin)
 *   - Fallback local: Anlisis de audio del servidor (ltimo recurso)
 *
 * Audio PCM se enva SIEMPRE en tiempo real, independientemente del modo de transcripcin.
 */

function stopRecording() {
    isRecording = false;

    if (isCapturingSpeech) endSpeechCapture(false);

    // [v46 RESTORATION] Limpiar Web Speech API si estaba en uso
    if (recognition) {
        try {
            recognition.stop();
        } catch (e) { }
        recognition = null;
        pendingBrowserTranscript = '';
    }

    // [INGENIERA] Grace Period para el Filtro de Eco (2 segundos)
    // Permite que los chunks rezagados por latencia de red sigan siendo filtrados
    const oldStreamingId = streamingId;
    streamingId = null;
    setTimeout(() => {
        if (window.streamingId === oldStreamingId) {
            window.streamingId = null;
        }
    }, 2000);

    window._audioStreamStartEmitted = false;

    //  FIX V59.8: Limpiar audioProcessor (debe hacerse siempre para evitar ruido)
    if (audioProcessor) {
        try {
            if (audioProcessor instanceof MediaRecorder) {
                audioProcessor.stop(); // Detener MediaRecorder en Firefox
            }
            if (audioProcessor.port) audioProcessor.port.onmessage = null;
            audioProcessor.disconnect(); // Desconectar TODAS las conexiones
            audioProcessor.onaudioprocess = null;
        } catch (e) {
        }
        audioProcessor = null;
    }
    // [v59.28] Monitorizacin persistente: NO desconectamos window._audioWorkletSource
    // para que el analizador (analyser) siga recibiendo datos en el vmetro
    /*
    if (window._audioWorkletSource) {
        try { window._audioWorkletSource.disconnect(); } catch (e) { }
        window._audioWorkletSource = null;
    }
    */

    window._pipelineRestarting = false;

    updateMicButtonsUI();
    if (statusIndicatorText && localesData.chat) {
        statusIndicatorText.textContent = localesData.chat.status_silent || 'SILENT';
    }
    statusIndicator.className = 'status-indicator silent';
    // [v46.4.18] Mantenida visualizacin de transcripcin pendiente (isWaitingForVosk).
    // Eliminado el mensaje invasivo de "Micrfono desactivado" para reducir ruido visual local.
}

// === ANLISIS DE AUDIO ===
async function setupAudioAnalysis(...args) {
    // [v60] Asegurar que el contexto est inicializado antes de configurar el anlisis
    if (!window.audioContext) {
        initAudioCtx();
    }
    const res = await audioCapture.setupAudioAnalysis(...args);
    if (!window._volumeLoopStarted) {
        window._volumeLoopStarted = true;
        analyzeVolume();
    }
    return res;
}




/**
 * Procesa fragmentos de audio PCM para downsampling y envo.
 * Siempre activo: enva audio en tiempo real + maneja transcripcin segn modo.
 */
//  SAFE ZONE: No agregar console.log - funcin llamada 48,000x/seg durante grabacin
function processAudioChunk(...args) {
    return audioCapture.processAudioChunk(...args);
}

/**
 * Enva fragmentos de audio en tiempo real va socket (para streaming)
 * Usado en modo BROWSER para transmitir audio mientras se graba.
 */


function sendAudioStreamChunk(...args) {
    return audioCapture.sendAudioStreamChunk(...args);
}

/**
 * Enva los buffers de audio acumulados a Vosk y al stream de lite.
 */
function flushVoskData(...args) {
    return audioCapture.flushVoskData(...args);
}

// --- Per-SubUser capture pipelines (run in parallel with main capture)
window._subUserPipelines = window._subUserPipelines || {};

async function startSubUserCapture(...args) {
    return audioCapture.startSubUserCapture(...args);
}

function processSubUserAudioChunk(...args) {
    return audioCapture.processSubUserAudioChunk(...args);
}

function stopSubUserCapture(...args) {
    return audioCapture.stopSubUserCapture(...args);
}

// Listen for server notification to stop a sub-user capture
try {
    if (window.socket) {
        window.socket.on('subuser-removed', (data) => {
            try {
                if (data && data.subUserId) {
                    window.stopSubUserCapture(data.subUserId);
                    // [v60.1] Limpieza de estado: si el sub-usuario borrado era el seleccionado, resetear a Root
                    if (typeof audioState !== 'undefined' && audioState.get('activeSubUserId') === data.subUserId) {
                        audioState.setState({ activeSubUserId: null });
                    }
                }
            } catch (e) { console.warn('Error en subuser-removed listener:', e); }
        });
    }
} catch (e) { }

function initVoiceWave() {
    if (!voiceWave) return;
    voiceWave.innerHTML = '';
    for (let i = 0; i < 50; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        voiceWave.appendChild(bar);
    }
}

function analyzeVolume() {
    // [INGENIERA v60.PHASE1] Visualizacin persistente desacoplada del VAD
    if (!volumeLevel || !analyser) {
        if (volumeLevel && !analyser) volumeLevel.style.width = '0%';
        return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(dataArray);

    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
        let normalized = (dataArray[i] - 128) / 128;
        sumSquares += normalized * normalized;
    }
    let rms = Math.sqrt(sumSquares / dataArray.length);
    let volume = Math.min(100, Math.max(0, rms * 1000));

    const currentWidth = parseFloat(volumeLevel.style.width) || 0;
    const smoothedVolume = currentWidth + (volume - currentWidth) * 0.2;
    volumeLevel.style.width = smoothedVolume + '%';

    // [v60.ELITE] Orquestación visual de estado (Sincronización SOT)
    const state = (typeof audioState !== 'undefined') ? audioState : window.audioState;
    const currentMicMode = (state && typeof state.get === 'function') ? state.get('micMode') : 'ptt';
    const currentPTTActive = (state && typeof state.get === 'function') ? state.get('isPTTActive') : false;
    const currentRecording = (state && typeof state.get === 'function') ? state.get('isRecording') : false;
    const currentThreshold = parseInt(document.getElementById('micSensitivity')?.value || '50', 10);
    
    if (currentMicMode === 'auto') {
        // MODO AUTOMÁTICO: El color sigue al umbral (VAD visual)
        if (smoothedVolume >= currentThreshold) {
            volumeLevel.style.background = 'var(--accent-orange)';
            volumeLevel.style.boxShadow = '0 0 10px var(--accent-orange)';
        } else {
            volumeLevel.style.background = 'var(--accent-blue)';
            volumeLevel.style.boxShadow = 'none';
        }
    } else if (currentMicMode === 'ptt') {
        // MODO PTT: El color sigue ESTRICTAMENTE al dedo del usuario
        if (currentPTTActive) {
            volumeLevel.style.background = 'var(--accent-orange)';
            volumeLevel.style.boxShadow = '0 0 10px var(--accent-orange)';
        } else {
            volumeLevel.style.background = 'var(--accent-blue)';
            volumeLevel.style.boxShadow = 'none';
        }
    } else {
        // OTROS MODOS (Siempre activo/Manual): El color sigue al estado de captura
        if (currentRecording) {
            volumeLevel.style.background = 'var(--accent-orange)';
            volumeLevel.style.boxShadow = '0 0 10px var(--accent-orange)';
        } else {
            volumeLevel.style.background = 'var(--accent-blue)';
            volumeLevel.style.boxShadow = 'none';
        }
    }

    // Actualizar barras de la onda de voz (Voice Wave)
    if (voiceWave && isCapturingSpeech) {
        const bars = voiceWave.querySelectorAll('.bar');
        bars.forEach((bar, index) => {
            const factor = Math.sin((index / bars.length) * Math.PI);
            const random = 0.5 + Math.random() * 0.5;
            const height = Math.min(70, Math.max(3, (smoothedVolume * 2.0) * factor * random));
            bar.style.height = height + 'px';
        });
    }

    // [v60.PHASE1] El VAD ahora reside en module-audio-capture.js (Pipeline directo)
    // No procesamos timeouts aqu para evitar condiciones de carrera.

    requestAnimationFrame(() => analyzeVolume());
}

function startSpeechCapture(...args) {
    return audioCapture.startSpeechCapture(...args);
}

function endSpeechCapture(...args) {
    return audioCapture.endSpeechCapture(...args);
}
function pcmToWav(...args) {
    return AudioUtils.pcmToWav(...args);
}
// ---- FIN MEJORA ----
// === MENSAJES ===
function sendMessage() {
    const text = textInput.value.trim();
    if (!text) return;

    const messageCategory = selectedCategories[0] || 'General';
    const data = {
        text: text,
        category: messageCategory
    };

    // Limpiar rastro de audio previo para evitar false-positives en recepcion
    window._lastAudioBlobUrl = null;

    queueOrEmit('send-message', data);
    triggerVibration(40);
    
    const input = textInput;
    input.value = '';

    // [v60.Elite] Forzar desactivacin visual de la onda para restaurar el input
    const waveContainer = dom.get('chat', 'waveContainer');
    if (waveContainer) waveContainer.classList.remove('active');
    const voiceWave = dom.get('audio', 'voiceWave');
    if (voiceWave) voiceWave.classList.remove('active');

    updateMicButtonsUI();
    
    // [v60.Elite] Solo re-enfocamos en desktop para permitir escritura continua
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        if (document.activeElement === input) {
            input.blur();
        }
    } else {
        input.focus();
    }
}

async function sendFinalMessageWithBlob(...args) {
    return audioCapture.sendFinalMessageWithBlob(...args);
}

function addMessage(...args) {
    return messageRenderer.addMessage(...args);
}

function addSystemMessage(text, username = null, type = null) {
    // [v60.965] Protección de Integridad del DOM: Evitar duplicados exactos en ráfaga
    if (window._lastSystemMessageText === text && (Date.now() - (window._lastSystemMessageTime || 0) < 2000)) {
        return;
    }
    window._lastSystemMessageText = text;
    window._lastSystemMessageTime = Date.now();

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.style.textAlign = 'center';
    textDiv.style.color = '#888';
    textDiv.style.fontStyle = 'italic';
    textDiv.style.fontSize = '13px';
    textDiv.style.lineHeight = '1';

    // Metadatos para re-traducción dinámica (v59.18) - Sin impacto visual
    if (username) textDiv.setAttribute('data-system-username', username);
    if (type) textDiv.setAttribute('data-system-type', type);

    textDiv.textContent = text;

    messageDiv.appendChild(textDiv);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * [v59.18] Motor Quirrgico de Re-traduccin en Caliente
 * Escanea el chat y actualiza mensajes de sistema (join/left) al nuevo idioma.
 */
function retranslateSystemMessages() {
    if (!localesData || !localesData.chat) return;

    const systemMsgs = document.querySelectorAll('[data-system-type]');
    systemMsgs.forEach(el => {
        const username = el.getAttribute('data-system-username');
        const type = el.getAttribute('data-system-type'); // 'joined' o 'left'

        if (type === 'joined') {
            const suffix = localesData.chat.user_joined || 'ha entrado en el chat';
            el.textContent = `${username} ${suffix}`;
        } else if (type === 'left') {
            const suffix = localesData.chat.user_left || 'ha abandonado el chat';
            el.textContent = `${username} ${suffix}`;
        } else if (type === 'audio-label') {
            // [v59.18] Actualizacin dinmica del reproductor de audio
            el.textContent = localesData.chat.audio_message || 'Mensaje de audio';
        } else if (type === 'ia-status') {
            // [v60.960] Feedback dinámico de carga neural
            if (el.textContent.includes('READY')) {
                el.textContent = localesData.chat.status_ia_eus_ready || "✅ IA Transcriptions READY";
            } else {
                el.textContent = localesData.chat.status_ia_eus_loading || "⏳ Cargando motor de transcripción neural...";
            }
        } else if (type === 'euskera-beta') {
            const template = localesData.chat.status_euskera_user_warning || "⚠️ Aviso: %user% está usando transcripción en Euskera (Beta). La precisión puede ser menor.";
            el.textContent = template.replace('%user%', username || 'Usuario');
        } else if (type === 'euskera-beta-personal') {
            el.textContent = localesData.chat.status_beta_warning || "⚠️ Aviso: El motor de Euskera está en fase beta...";
        }
    });
}

function showSystemMessage(message) {
    showStatusMessage(message, 'info');
}

// notificationInterval movida al bloque superior (v46.4.7)
const originalTitle = document.title;

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        if (notificationInterval) {
            clearInterval(notificationInterval);
            notificationInterval = null;
        }
        document.title = originalTitle;
    }
});

function showMessageAlert(user = '', text = '') {
    console.log(` [UI-CONTROLLER] showMessageAlert | User: ${user} | Text: ${text}`);
    // [v60] Reportado: Las alertas se supriman si el modal estaba abierto.
    // Ahora solo logueamos pero permitimos la ejecucin para facilitar el testeo.
    const isVocabOpen = settingsModal && !settingsModal.classList.contains('hidden') && document.getElementById('section-idioma')?.classList.contains('active');
    const isTriggersOpen = triggersModal && !triggersModal.classList.contains('hidden');
    if (isVocabOpen || isTriggersOpen) {
        console.log(" Alerta de mensaje activa (Modal detectado)");
    }

    // [v60] Restauracin de clase legacy para asegurar compatibilidad con CSS antiguo
    // Respeta el ajuste de alertas de pantalla del usuario
    if (localStorage.getItem('talkme_screen_alerts') !== 'false') {
        document.body.classList.remove('message-bg-flash');
        void document.body.offsetWidth; // Force reflow
        document.body.classList.add('message-bg-flash');
    }

    // [v59.Modular] Ejecutar motor de alertas personalizadas (Paralelo)
    if (typeof Alerts !== 'undefined') {
        Alerts.triggerAll();
    } else if (typeof window.AlertsExecutor !== 'undefined') {
        window.AlertsExecutor.triggerAll();
    }

    // PWA Alert: Alerta de sistema si el chat est minimizado o en otra pestaa
    if (document.hidden) {
        // Parpadeo de ttulo de pestaa
        if (!notificationInterval) {
            let isOriginalTitle = true;
            notificationInterval = setInterval(() => {
                document.title = isOriginalTitle ? " Nuevo Mensaje!" : originalTitle;
                isOriginalTitle = !isOriginalTitle;
            }, 1000);
        }

        // Notificacin de sistema
        if ("Notification" in window && Notification.permission === "granted") {
            const truncateText = text.length > 60 ? text.substring(0, 57) + '...' : text;
            const notification = new Notification('Talk-me - ' + (user || 'Aviso'), {
                body: truncateText,
                silent: false // Habilitar sonido para que el usuario sepa que hay actividad en background
            });
            notification.onclick = () => {
                window.focus(); // Trae la ventana al frente si el SO lo permite
                notification.close();
            };
        }
    }

    setTimeout(() => {
        document.body.classList.remove('message-bg-flash');
    }, 1300);
}

function triggerFlashlightSequence(track) {
    let flashes = 0;
    const interval = setInterval(async () => {
        try {
            await track.applyConstraints({
                advanced: [{ torch: flashes % 2 === 0 }]
            });
            flashes++;
            if (flashes >= 6) { // 3 on, 3 off
                clearInterval(interval);
                await track.applyConstraints({ advanced: [{ torch: false }] });
            }
        } catch (e) {
            console.error("Error al usar torch:", e);
            clearInterval(interval);
        }
    }, 150);
}

function updateUsersList(users) {
    lastUsersData = users; // Guardar para re-renderizar al cambiar idioma
    if (usersListTitle && localesData.sidebar) {
        const _titleText = usersListTitle.querySelector && usersListTitle.querySelector('.users-list-text') || usersListTitle;
        _titleText.textContent = `${localesData.sidebar.users} (${users.length})`;
    }
    while (usersList.firstChild) {
        usersList.removeChild(usersList.firstChild);
    }
    users.forEach(userData => {
        // If server sent an orphan/standalone sub-user entry, render it as a compact subuser row
        if (userData && userData.isSubUser) {
            const su = userData;
            const suItem = document.createElement('div');
            suItem.className = 'subuser-item';
            suItem.style.display = 'flex';
            suItem.style.alignItems = 'center';
            suItem.style.gap = '8px';
            suItem.style.padding = '6px 8px';

            const suName = document.createElement('span');
            suName.textContent = su.username || ('sub-' + (su.id || '').substring(0, 6));
            suName.style.fontSize = '13px';
            suName.style.fontWeight = '600';
            suItem.appendChild(suName);

            // category tag
            try {
                const subCatInfo = getCategoryInfo((su.categories && su.categories[0]) || su.category);
                if (subCatInfo && subCatInfo.name && subCatInfo.name !== 'General') {
                    const tag = document.createElement('small');
                    tag.className = 'category-tag-inline';
                    tag.style.color = subCatInfo.color;
                    tag.style.border = `1px solid ${subCatInfo.color}`;
                    tag.style.background = 'rgba(255, 255, 255, 0.03)';
                    tag.style.padding = '2px 6px';
                    tag.style.borderRadius = '4px';
                    tag.style.fontSize = '10px';
                    tag.style.textTransform = 'uppercase';
                    tag.style.fontWeight = '700';
                    tag.style.marginLeft = '8px';
                    tag.textContent = subCatInfo.name;
                    suItem.appendChild(tag);
                }
            } catch (e) { }

            // lang tag
            const suLangMap = { 'es': 'ES', 'en': 'EN', 'eu': 'EUS' };
            const suLangCode = suLangMap[su.lang || 'es'] || (su.lang || 'es').toUpperCase();
            const suLangTag = document.createElement('small');
            suLangTag.className = 'lang-tag-inline';
            suLangTag.style.color = '#888';
            suLangTag.style.fontSize = '10px';
            suLangTag.style.fontWeight = '700';
            suLangTag.style.marginLeft = '10px';
            suLangTag.style.opacity = '0.6';
            suLangTag.textContent = suLangCode;
            suItem.appendChild(suLangTag);

            usersList.appendChild(suItem);
            return; // continue
        }

        const user = typeof userData === 'string' ? userData : userData.username;
        const categories = typeof userData === 'string' ? [] : (userData.categories || []);

        const userItem = document.createElement('div');

        // --- [v59.21] SISTEMA DE COLOR ESTABILIZADO ---
        // Buscamos la informacin oficial de la categora para evitar parpadeos en renombrados
        const rawCategory = categories.length > 0 ? categories[0] : null;
        const categoryIdentifier = (typeof rawCategory === 'object' && rawCategory !== null) ? (rawCategory.name || rawCategory.id) : rawCategory;
        const officialCat = getCategoryInfo(categoryIdentifier);

        const color = getUserColor(user, officialCat.name);
        const catName = officialCat.name; // Usar el nombre oficial de currentCategories

        const isMe = (typeof userData === 'object' && userData !== null && (userData.id === socket.id || userData.username === currentUsername));

        userItem.className = isMe ? 'user-item own-user' : 'user-item';
        userItem.style.borderLeftColor = color;

        const mainContainer = document.createElement('div');
        mainContainer.style.display = 'flex';
        mainContainer.style.alignItems = 'center';
        mainContainer.style.flexWrap = 'wrap';

        const nameSpan = document.createElement('span');
        nameSpan.style.marginRight = '5px';
        nameSpan.style.color = color;
        nameSpan.style.fontWeight = '600';

        // [v59.40] Mostrar contador de pestaas/ventanas activas para este usuario
        const socketCount = userData.activeSockets > 1 ? ` [${userData.activeSockets}]` : '';
        nameSpan.textContent = user + socketCount;
        mainContainer.appendChild(nameSpan);

        if (catName && catName !== 'General') {
            const tag = document.createElement('small');
            tag.className = 'category-tag-inline';
            tag.style.color = officialCat.color;
            tag.style.border = `1px solid ${officialCat.color}`;
            tag.style.background = 'rgba(255, 255, 255, 0.03)';
            tag.style.padding = '2px 6px';
            tag.style.borderRadius = '4px';
            tag.style.fontSize = '10px';
            tag.style.textTransform = 'uppercase';
            tag.style.fontWeight = '700';
            tag.style.letterSpacing = '0.02em';
            tag.style.marginLeft = '5px';
            tag.style.opacity = '0.9';
            tag.style.verticalAlign = 'middle';
            tag.style.lineHeight = '1.4';
            tag.textContent = catName;
            mainContainer.appendChild(tag);
        }

        // [v60.ELITE] Language indicator (Discrete)
        const langMap = { 'es': 'ES', 'en': 'EN', 'eu': 'EUS' };
        const langCode = langMap[userData.lang || 'es'] || (userData.lang || 'es').toUpperCase();
        const langTag = document.createElement('small');
        langTag.className = 'lang-tag-inline';
        langTag.style.color = '#888';
        langTag.style.fontSize = '10px';
        langTag.style.fontWeight = '700';
        langTag.style.marginLeft = '10px';
        langTag.style.opacity = '0.6';
        langTag.style.verticalAlign = 'middle';
        langTag.style.lineHeight = '1.4';
        langTag.textContent = langCode;
        mainContainer.appendChild(langTag);

        userItem.appendChild(mainContainer);

        const rightTags = document.createElement('div');
        rightTags.style.display = 'flex';
        rightTags.style.alignItems = 'center';
        rightTags.style.gap = '5px';
        rightTags.style.marginLeft = 'auto';

        if (isMe) {
            const ownTag = document.createElement('span');
            ownTag.className = 'own-tag';
            ownTag.textContent = localesData.chat.label_you || '(T)';
            rightTags.appendChild(ownTag);
        }

        const isUserMaster = typeof userData === 'string' ? false : (userData.isMaster || false);
        if (isUserMaster) {
            const crown = document.createElement('span');
            crown.className = 'master-crown-inline';
            crown.title = 'Administrador';
            crown.innerHTML = `<svg viewBox="0 0 512 512" fill="#e0b04b" stroke="#e0b04b" xmlns="http://www.w3.org/2000/svg"><g><path fill="#e0b04b" d="M512,152.469c0-21.469-17.422-38.875-38.891-38.875c-21.484,0-38.906,17.406-38.906,38.875 c0,10.5,4.172,20.016,10.938,27c-26.453,54.781-77.016,73.906-116.203,56.594c-34.906-15.438-47.781-59.563-52.141-93.75 c14.234-7.484,23.938-22.391,23.938-39.594C300.734,78.016,280.719,58,256,58c-24.703,0-44.734,20.016-44.734,44.719 c0,17.203,9.703,32.109,23.938,39.594c-4.359,34.188-17.234,78.313-52.141,93.75c-39.188,17.313-89.75-1.813-116.203-56.594 c6.766-6.984,10.938-16.5,10.938-27c0-21.469-17.422-38.875-38.891-38.875C17.422,113.594,0,131,0,152.469 c0,19.781,14.781,36.078,33.875,38.547l44.828,164.078h354.594l44.828-164.078C497.234,188.547,512,172.25,512,152.469z"/><path fill="#e0b04b" d="M455.016,425.063c0,15.984-12.953,28.938-28.953,28.938H85.938C69.953,454,57,441.047,57,425.063v-2.406 c0-16,12.953-28.953,28.953-28.953h340.125c16,0,28.953,12.953,28.953,28.953V425.063z"/></g></svg>`;
            rightTags.appendChild(crown);
        }
        userItem.appendChild(rightTags);

        // Indicador de "hablando"
        const speakingIndicator = document.createElement('span');
        speakingIndicator.className = 'speaking-indicator';
        userItem.appendChild(speakingIndicator);

        usersList.appendChild(userItem);

        // Render sub-users (identidades virtuales) as separate compact rows
        if (typeof userData === 'object' && Array.isArray(userData.subUsers) && userData.subUsers.length > 0) {
            const subList = document.createElement('div');
            subList.className = 'subusers-list';
            subList.style.marginTop = '6px';
            subList.style.marginLeft = '12px';
            subList.style.display = 'flex';
            subList.style.flexDirection = 'column';
            userData.subUsers.forEach(su => {
                const suItem = document.createElement('div');
                suItem.className = 'subuser-item';
                suItem.style.display = 'flex';
                suItem.style.alignItems = 'center';
                suItem.style.gap = '8px';
                suItem.style.padding = '6px 8px';
                suItem.style.background = 'transparent';
                suItem.style.flexWrap = 'nowrap';
                suItem.style.overflow = 'hidden'; // Prevents horizontal scroll entirely

                const nameWrapper = document.createElement('div');
                nameWrapper.style.display = 'flex';
                nameWrapper.style.alignItems = 'center';
                nameWrapper.style.flex = '1 1 0%';
                nameWrapper.style.overflow = 'hidden';

                const suName = document.createElement('span');
                suName.textContent = su.name || ('sub-' + su.subUserId.substring(0, 4));
                suName.style.fontSize = '13px';
                suName.style.fontWeight = '600';
                suName.style.whiteSpace = 'nowrap';
                suName.style.overflow = 'hidden';
                suName.style.textOverflow = 'ellipsis';

                let suColor = color; // Fallback to creator color
                let suCatName = 'General';

                // Category tag for sub-user (filter badge)
                try {
                    const subCatInfo = getCategoryInfo(su.category);
                    if (subCatInfo && subCatInfo.name) {
                        if (subCatInfo.color) suColor = subCatInfo.color;
                        suCatName = subCatInfo.name;

                        if (suCatName !== 'General') {
                            const tag = document.createElement('small');
                            tag.className = 'category-tag-inline';
                            tag.style.color = subCatInfo.color;
                            tag.style.border = `1px solid ${subCatInfo.color}`;
                            tag.style.background = 'rgba(255, 255, 255, 0.03)';
                            tag.style.padding = '2px 6px';
                            tag.style.borderRadius = '4px';
                            tag.style.fontSize = '10px';
                            tag.style.textTransform = 'uppercase';
                            tag.style.fontWeight = '700';
                            tag.style.letterSpacing = '0.02em';
                            tag.style.opacity = '0.9';
                            tag.style.flexShrink = '0'; // Don't shrink the tag
                            tag.style.marginLeft = '6px';
                            tag.textContent = subCatInfo.name;
                            nameWrapper.appendChild(tag);
                        }
                    }
                } catch (e) {
                    // ignore
                }

                // [v60.ELITE] Language indicator for sub-user
                const suLangMap = { 'es': 'ES', 'en': 'EN', 'eu': 'EUS' };
                const suLangCode = suLangMap[su.lang || 'es'] || (su.lang || 'es').toUpperCase();
                const suLangTag = document.createElement('small');
                suLangTag.className = 'lang-tag-inline';
                suLangTag.style.color = '#888';
                suLangTag.style.fontSize = '9px';
                suLangTag.style.fontWeight = '700';
                suLangTag.style.marginLeft = '10px';
                suLangTag.style.opacity = '0.5';
                suLangTag.textContent = suLangCode;
                nameWrapper.appendChild(suLangTag);

                // Apply correct specific color to name
                suName.style.color = suColor;
                nameWrapper.insertBefore(suName, nameWrapper.firstChild);
                suItem.insertBefore(nameWrapper, suItem.firstChild);

                // small meter bar (ONLY for the owner)
                if (isMe) {
                    // [v60.ELITE] AUTO-IGNITION: Si es mo y no est capturando, intentamos iniciar captura automáticamente
                    if (su.mic && su.mic.deviceId) {
                        const isCapturing = !!(window._subUserPipelines && window._subUserPipelines[su.subUserId]);
                        if (!isCapturing && !window._reconnectingSubUsers?.[su.subUserId]) {
                            window._reconnectingSubUsers = window._reconnectingSubUsers || {};
                            window._reconnectingSubUsers[su.subUserId] = true;
                            
                            console.log(`🚀 [ELITE] Auto-Ignition: Re-iniciando captura para "${su.name}"`);
                            setTimeout(() => {
                                try {
                                    if (typeof window.startSubUserCapture === 'function') {
                                        window.startSubUserCapture(su.subUserId, su.mic, su.lang || 'es', su.threshold || 0.5, su.category);
                                    }
                                } catch (e) {
                                    console.warn(`❌ [ELITE] Fallo en Auto-Ignition para ${su.name}:`, e.message);
                                } finally {
                                    delete window._reconnectingSubUsers[su.subUserId];
                                }
                            }, 1000); // Margen de seguridad para estabilidad de hardware
                        }
                    }

                    // [v60.ELITE] Limpieza preventiva: Eliminar vmetro previo si existe para evitar duplicados
                    const existingMeter = suItem.querySelector('.volume-meter');
                    if (existingMeter) existingMeter.remove();

                    const meter = document.createElement('div');
                    meter.className = 'volume-meter';
                    meter.style.width = '60px';
                    meter.style.height = '6px';
                    meter.style.marginLeft = 'auto'; // push right
                    meter.style.flex = '0 0 60px';
                    const level = document.createElement('div');
                    level.className = 'volume-level';
                    level.id = 'sub-vu-' + su.subUserId;
                    level.dataset.threshold = Math.round((su.threshold || 0.5) * 100); // [v60.ELITE] Escala 0-100 para paridad con modal
                    level.style.width = '0%';
                    level.style.background = 'var(--accent-blue)'; // Inicializar en azul
                    meter.appendChild(level);
                    suItem.appendChild(meter);
                }

                // Owner controls: edit / delete
                if (isMe) {
                    const actionsDiv = document.createElement('div');
                    actionsDiv.style.display = 'flex';
                    actionsDiv.style.gap = '6px';
                    actionsDiv.style.marginLeft = '4px';
                    actionsDiv.style.flexShrink = '0';

                    const editBtn = document.createElement('button');
                    editBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
                    editBtn.style.background = 'transparent';
                    editBtn.style.border = 'none';
                    editBtn.style.color = 'var(--text-secondary)';
                    editBtn.style.cursor = 'pointer';
                    editBtn.style.padding = '2px';
                    editBtn.style.transition = 'color 0.2s';
                    editBtn.title = 'Editar';
                    editBtn.onmouseover = () => editBtn.style.color = 'var(--text-primary)';
                    editBtn.onmouseout = () => editBtn.style.color = 'var(--text-secondary)';
                    editBtn.addEventListener('click', () => { window.openSubUserModal(su); });
                    actionsDiv.appendChild(editBtn);

                    const delBtn = document.createElement('button');
                    delBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
                    delBtn.style.background = 'transparent';
                    delBtn.style.border = 'none';
                    delBtn.style.color = '#FF4444';
                    delBtn.style.cursor = 'pointer';
                    delBtn.style.padding = '2px';
                    delBtn.style.transition = 'color 0.2s';
                    delBtn.style.opacity = '0.7';
                    delBtn.title = 'Borrar';
                    delBtn.onmouseover = () => { delBtn.style.opacity = '1'; delBtn.style.color = '#FF1111'; };
                    delBtn.onmouseout = () => { delBtn.style.opacity = '0.7'; delBtn.style.color = '#FF4444'; };
                    delBtn.addEventListener('click', () => {
                        const title = window.localesData?.subuser_modal?.title || 'Eliminar sub-usuario';
                        const msg = (window.localesData?.interface?.confirm_delete_subuser || '¿Eliminar sub-usuario "{name}"?').replace('{name}', su.name || su.subUserId);
                        window.showCustomConfirm(title, msg, () => {
                            socket.emit('removeSubUser', { subUserId: su.subUserId }, (resp) => { 
                                if (!resp || !resp.success) {
                                    if (typeof window.showCatFeedback === 'function') {
                                        window.showCatFeedback('Error: ' + (resp && resp.error), 'error');
                                    } else {
                                        alert('Error: ' + (resp && resp.error));
                                    }
                                } 
                            });
                        });
                    });
                    actionsDiv.appendChild(delBtn);

                    suItem.appendChild(actionsDiv);
                }

                subList.appendChild(suItem);
            });
            usersList.appendChild(subList);
        }
    });

    // Sincronizar tabla de administracin Master si est disponible (Delegado a Mdulo)
    const _isMaster = window.isMaster || false;
    if (typeof masterAdminUI !== 'undefined') {
        masterAdminUI.updateUserTable(users, _isMaster);
    }
}

// --- Cache Visuals Synchronization ---
/**
 * Actualiza los elementos visuales de la cach en la UI (Barra de progreso, etiquetas y slider)
 * @param {number} limitMB - Lmite de cach en MB
 * @param {number} currentMB - Uso actual de cach en MB
 */
window.updateCacheVisuals = function(limitMB, currentMB) {
    try {
        const usageLabel = document.getElementById('cacheCurrentMB');
        const limitLabel = document.getElementById('cacheLimitLabel');
        const progressBar = document.getElementById('cacheUsageBar');
        const limitSlider = document.getElementById('cacheLimitRange');

        if (limitMB !== undefined && limitMB !== null) {
            window._currentCacheLimitMB = limitMB;
            if (limitLabel) limitLabel.textContent = `${limitMB}MB`;
            if (limitSlider) limitSlider.value = limitMB;
        }

        if (currentMB !== undefined && currentMB !== null) {
            window._currentCacheUsageMB = currentMB;
            if (usageLabel) usageLabel.textContent = `${currentMB}MB`;
        }

        // Calcular porcentaje y actualizar barra
        if (progressBar) {
            const limit = window._currentCacheLimitMB || 100;
            const current = window._currentCacheUsageMB || 0;
            const percent = Math.min(100, (current / limit) * 100);
            progressBar.style.width = `${percent}%`;
            
            // Cambiar color segn saturacin
            if (percent > 90) progressBar.style.backgroundColor = 'var(--accent-red)';
            else if (percent > 70) progressBar.style.backgroundColor = 'var(--accent-orange)';
            else progressBar.style.backgroundColor = 'var(--accent-blue)';
        }
    } catch (e) {
        console.warn(' Error actualizando visuales de cach:', e);
    }
};

// [v60] Inicializacin de visuales de cach al arrancar
window.addEventListener('DOMContentLoaded', () => {
    if (window._currentCacheLimitMB) {
        window.updateCacheVisuals(window._currentCacheLimitMB, window._currentCacheUsageMB || 0);
    }
});

/**
 * [v60.WATCHDOG] Envo forzado por falta de respuesta de Vosk
 * Garantiza que ningn audio se pierda incluso en condiciones extremas.
 */
window.forceFinalSend = async function() {
    if (typeof audioState === 'undefined' || !audioState) {
        console.error(' audioState no definido en forceFinalSend');
        return;
    }
    if (!audioState.get('isWaitingForVosk')) return;
    
    // Si ya se envi por el camino normal (Vosk rpido), abortar
    if (audioState.get('messageSentForCurrentCapture')) return;

    // [v60.7] Bloqueo de Mensajes Vacíos para IA
    const currentMode = audioState.get('transcriptionMode');
    if (currentMode === 'whisper') {
        console.warn('🧠 [Watchdog] Bloqueando envío forzado para modo Neural (Whisper)... Esperando resultado real.');
        return;
    }

    console.warn('🚨 [Watchdog] Vosk no respondió a tiempo. Forzando envío de seguridad...');
    
    const data = {
        text: '', 
        isForced: true
    };
    
    if (window.socketHandlers && typeof window.socketHandlers._onTranscriptionResult === 'function') {
        window.socketHandlers._onTranscriptionResult(data);
    } else {
        console.error('❌ No se pudo encontrar socketHandlers para el envío forzado');
    }
};


