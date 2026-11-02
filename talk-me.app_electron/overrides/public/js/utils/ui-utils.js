/**
 * @file ui-utils.js
 * @description Utilidades de interfaz (notificaciones, colores, scroll, efectos).
 */

/**
 * ui-utils.js queda ahora exclusivamente para notificaciones, feedback y scroll.
 * La lógica visual estructural está en module-category-ui.js.
 */

/**
 * Cola de mensajes pendientes antes del login (cuando el usuario aún no ingresó a cabina)
 */
let pendingToasts = [];

/**
 * [v60.Elite] Motor Determinista de Cola Activa (ToastQueue)
 * Garantiza canal único: 1 sola alerta a la vez en pantalla, cero colisiones,
 * cero solapamientos y sin tiempos muertos arbitrarios.
 */
let activeToastQueue = [];
let isToastActive = false;

function processActiveToastQueue() {
    if (isToastActive) return;
    if (activeToastQueue.length === 0) return;

    const item = activeToastQueue.shift();
    const toastContainer = document.getElementById('globalToast');
    if (!toastContainer) {
        isToastActive = false;
        return;
    }

    isToastActive = true;

    const msg = document.createElement('div');
    msg.className = `status-message ${item.type}`;
    msg.setAttribute('data-raw-text', item.text);
    msg.style.display = 'inline-flex';
    msg.style.alignItems = 'center';
    msg.style.justifyContent = 'center';
    msg.style.gap = '8px';

    const textLower = item.text.toLowerCase();
    const isTranslationWarn = (item.meta && item.meta.type === 'translation_disabled') ||
                              textLower.includes('traducc') || 
                              textLower.includes('translat') || 
                              textLower.includes('itzulp') || 
                              textLower.includes('übersetz') || 
                              textLower.includes('traduz') || 
                              textLower.includes('traduc');
    const isMidiWarn = (item.meta && item.meta.type === 'midi_restricted') || textLower.includes('midi');

    let svgIcon = '';
    let cleanText = item.text;

    if (isTranslationWarn) {
        svgIcon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; flex-shrink: 0; display: inline-block;">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="var(--accent-secondary, #ff6b35)" fill="color-mix(in srgb, var(--accent-secondary, #ff6b35) 15%, transparent)"></path>
            <line x1="12" y1="9" x2="12" y2="13" stroke="var(--accent-secondary, #ff6b35)"></line>
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="var(--accent-secondary, #ff6b35)" stroke-width="2.5"></line>
        </svg>`;
        cleanText = item.text.replace(/^⚠️\s*/, '');
    } else if (isMidiWarn) {
        svgIcon = `<svg fill="currentColor" viewBox="0 0 24 24" width="18" height="18" role="img" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; flex-shrink: 0; display: inline-block;">
            <path d="M21.775 7.517H24v8.966h-2.225zm-8.562 0h6.506c.66 0 1.045.57 1.045 1.247v6.607c0 .84-.35 1.112-1.112 1.112h-6.439v-5.696h2.225v3.505h3.135V9.54h-5.36zm-3.235 0h2.19v8.966h-2.19zM0 7.517h7.854c.66 0 1.045.57 1.045 1.247v7.72H6.708V9.774H5.427v6.708H3.438V9.775H2.191v6.708H0Z"></path>
        </svg>`;
        cleanText = item.text.replace(/^🎹\s*/, '');
    }

    if (svgIcon) {
        msg.innerHTML = `${svgIcon}<span>${cleanText}</span>`;
    } else {
        msg.textContent = cleanText;
    }

    // Estado inicial: posicionado arriba (-24px), transparente y con desenfoque óptico etéreo (sin alterar escala)
    msg.style.opacity = '0';
    msg.style.transform = 'translateY(-24px)';
    msg.style.filter = 'blur(8px)';

    toastContainer.appendChild(msg);

    // Entrada fluida y natural: desciende suavemente a su posición mientras enfoca nítidamente
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            msg.style.opacity = '1';
            msg.style.transform = 'translateY(0)';
            msg.style.filter = 'blur(0px)';
        });
    });

    setTimeout(() => {
        // Salida elegante: se eleva sutilmente (-18px), se desvanece y difumina suavemente (sin cambio de escala)
        msg.style.opacity = '0';
        msg.style.transform = 'translateY(-18px)';
        msg.style.filter = 'blur(6px)';
        setTimeout(() => {
            msg.remove();
            isToastActive = false;
            // Pausa estética de cortesía (220ms) antes de dar paso a la siguiente alerta
            setTimeout(processActiveToastQueue, 220);
        }, 460);
    }, item.duration || 3000);
}

/**
 * Muestra una notificación global tipo Toast controlada por cola determinista.
 */
export function showGlobalToast(text, type = 'info', duration = 3000, meta = null) {
    const toastContainer = document.getElementById('globalToast');
    const dictionaryModal = document.getElementById('dictionaryModal');
    const triggersModal = document.getElementById('triggersModal');

    if (!toastContainer || !text) return;

    // [v60.Elite] COLA DE ESPERA: Si no hemos entrado al chat, encolamos el aviso
    const isJoined = window.audioState && window.audioState.get('joinState') === 'JOINED';
    if (!isJoined) {
        // [v60.Elite] Búfer de Notificaciones: Encolar si no estamos dentro, EXCEPTO alertas críticas de login
        const isLoginAlert = text.toLowerCase().includes('pin') || 
                             text.toLowerCase().includes('nombre') || 
                             text.toLowerCase().includes('categor') || 
                             text.toLowerCase().includes('invitado') ||
                             type === 'error'; // Por seguridad, cualquier error crítico se muestra

        if (!isLoginAlert) {
            // Evitar duplicados en la cola de pre-login
            if (!pendingToasts.some(t => t.text === text || (meta && t.meta && t.meta.type === meta.type))) {
                pendingToasts.push({ text, type, duration, meta });
                console.log(`⏳ [Toast] Mensaje encolado (Esperando Login): ${text}`);
            }
            return;
        }
    }

    // Suprimir si hay modales críticos abiertos (Diccionario/Triggers)
    const isVocabOpen = dictionaryModal && !dictionaryModal.classList.contains('hidden');
    const isTriggersOpen = triggersModal && !triggersModal.classList.contains('hidden');
    if (isVocabOpen || isTriggersOpen) return;

    // Deduplicación en cola y en pantalla activa
    const isAlreadyQueued = activeToastQueue.some(item => item.text === text);
    const isAlreadyOnScreen = Array.from(toastContainer.querySelectorAll('.status-message'))
        .some(m => m.getAttribute('data-raw-text') === text || m.textContent === text);
    if (isAlreadyQueued || isAlreadyOnScreen) return;

    // Priorizar errores críticos en la cabecera de la cola
    const toastItem = { text, type, duration, meta };
    if (type === 'error') {
        activeToastQueue.unshift(toastItem);
    } else {
        activeToastQueue.push(toastItem);
    }

    // Disparar procesamiento si el canal está libre
    processActiveToastQueue();
}

/**
 * [v60.Elite] Libera todos los mensajes acumulados durante el login hacia la cola activa
 */
export function flushPendingToasts(initialDelay = 0) {
    if (pendingToasts.length === 0) return;
    
    console.log(`🚀 [Toast] Transfiriendo ${pendingToasts.length} mensajes acumulados a la cola activa...`);
    const toFlush = [...pendingToasts];
    pendingToasts = [];

    const enqueueAll = () => {
        toFlush.forEach(t => {
            let textToShow = t.text;
            if (textToShow && textToShow.includes('WebMIDI')) {
                textToShow = window.localesData?.alerts?.midi_restricted || textToShow;
            } else if (t.meta && t.meta.type === 'babel_active') {
                return; // 🛡️ Silenciar alertas emergentes de Babel al entrar a cabina
            }
            showGlobalToast(textToShow, t.type, t.duration, t.meta);
        });
    };

    if (initialDelay > 0) {
        setTimeout(enqueueAll, initialDelay);
    } else {
        enqueueAll();
    }
}

export function showCatFeedback(message, type = 'success') {
    showGlobalToast(message, type);
}

export function showStatusMessage(text, type = 'info', duration = 3000) {
    showGlobalToast(text, type, duration);
}

export function showCategoryNotification(text) {
    showStatusMessage(text, 'info');
}

/**
 * Hace scroll automático al final del contenedor de mensajes.
 */
export function scrollToBottom(container, smooth = false) {
    if (!container) return;
    const performScroll = () => {
        container.scrollTop = container.scrollHeight + 5000;
        const lastMsg = container.lastElementChild;
        if (lastMsg) {
            lastMsg.scrollIntoView({
                behavior: smooth ? 'smooth' : 'auto',
                block: 'end',
                inline: 'nearest'
            });
        }
    };
    performScroll();
    requestAnimationFrame(performScroll);
    setTimeout(performScroll, 30);
}

/**
 * Lanza una vibración háptica (Android/iOS).
 */
export function triggerVibration(isVibrationEnabled, duration = 100) {
    if (!isVibrationEnabled) return;
    
    // [v60.Elite] Si el navegador soporta vibración nativa, la usamos y salimos
    // para evitar que los clicks en labels roben el foco del teclado.
    if (window.navigator && window.navigator.vibrate) {
        if (duration > 50) window.navigator.vibrate([180, 80, 180, 80, 180]);
        else window.navigator.vibrate(duration);
        return;
    }

    // Fallback para iOS (Safari): clicks en checkboxes ocultos
    const hapticIds = ['hapticL1', 'hapticL2', 'hapticL3'];
    hapticIds.forEach((id, index) => {
        setTimeout(() => {
            const activeElem = document.activeElement;
            const label = document.getElementById(id);
            if (label) {
                label.click();
                // Restaurar foco solo si no estábamos en el body y el click lo robó
                if (activeElem && activeElem !== document.body && document.activeElement !== activeElem) {
                    activeElem.focus({ preventScroll: true });
                }
            }
        }, index * 200);
    });
}

/**
 * Inyecta estilos de scrollbar para Webkit.
 */
export function injectWebkitScrollbars() {
    if (window.CSS && CSS.supports('selector(::-webkit-scrollbar)')) {
        const style = document.createElement('style');
        style.id = 'elite-scrollbar-styles';
        style.textContent = `
            .messages::-webkit-scrollbar, .panel-content::-webkit-scrollbar, .dictionary-tags::-webkit-scrollbar,
            .dictionary-content::-webkit-scrollbar, .triggers-list::-webkit-scrollbar, .triggers-content::-webkit-scrollbar,
            #usersList::-webkit-scrollbar, .cat-manager-list::-webkit-scrollbar, .category-manager-content::-webkit-scrollbar,
            .terms-scroll-area::-webkit-scrollbar, .custom-scroll::-webkit-scrollbar {
                width: 6px; height: 6px;
            }
            .messages::-webkit-scrollbar-track, .panel-content::-webkit-scrollbar-track, .dictionary-tags::-webkit-scrollbar-track,
            .dictionary-content::-webkit-scrollbar-track, .triggers-list::-webkit-scrollbar-track, .triggers-content::-webkit-scrollbar-track,
            #usersList::-webkit-scrollbar-track, .cat-manager-list::-webkit-scrollbar-track, .category-manager-content::-webkit-scrollbar-track,
            .terms-scroll-area::-webkit-scrollbar-track, .custom-scroll::-webkit-scrollbar-track {
                background: transparent;
            }
            .messages::-webkit-scrollbar-thumb, .panel-content::-webkit-scrollbar-thumb, .dictionary-tags::-webkit-scrollbar-thumb,
            .dictionary-content::-webkit-scrollbar-thumb, .triggers-list::-webkit-scrollbar-thumb, .triggers-content::-webkit-scrollbar-thumb,
            #usersList::-webkit-scrollbar-thumb, .cat-manager-list::-webkit-scrollbar-thumb, .category-manager-content::-webkit-scrollbar-thumb,
            .terms-scroll-area::-webkit-scrollbar-thumb, .custom-scroll::-webkit-scrollbar-thumb {
                background-color: var(--accent-blue); border-radius: 6px;
            }
            .messages::-webkit-scrollbar-thumb:hover, .panel-content::-webkit-scrollbar-thumb:hover, .dictionary-tags::-webkit-scrollbar-thumb:hover,
            .dictionary-content::-webkit-scrollbar-thumb:hover, .triggers-list::-webkit-scrollbar-thumb:hover, .triggers-content::-webkit-scrollbar-thumb:hover,
            #usersList::-webkit-scrollbar-thumb:hover, .cat-manager-list::-webkit-scrollbar-thumb:hover, .category-manager-content::-webkit-scrollbar-thumb:hover,
            .terms-scroll-area::-webkit-scrollbar-thumb:hover, .custom-scroll::-webkit-scrollbar-thumb:hover {
                background-color: var(--accent-orange);
            }
        `;
        document.head.appendChild(style);
    }
}

// [v60.Elite] Exportar puentes globales
window.flushPendingToasts = flushPendingToasts;
