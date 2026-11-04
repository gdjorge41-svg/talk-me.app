const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize-cycle'),
    close: () => ipcRenderer.send('window-close'),
    setAudioMuted: (isMuted) => ipcRenderer.send('set-audio-muted', isMuted),
    copyText: (text) => ipcRenderer.send('copy-clipboard', text),
    getLicenseKey: () => ipcRenderer.invoke('get-license-key')
});

// Inyección del Script en el Main World (Contexto de Página) para saltar Context Isolation y redefinir navigator.clipboard
const injectScript = () => {
    const script = document.createElement('script');
    script.textContent = `
        (function() {
            const customClipboard = {
                writeText: async (text) => {
                    if (window.electronAPI && window.electronAPI.copyText) {
                        window.electronAPI.copyText(text);
                    } else {
                        const textarea = document.createElement('textarea');
                        textarea.value = text;
                        document.body.appendChild(textarea);
                        textarea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textarea);
                    }
                    return Promise.resolve();
                },
                readText: async () => ''
            };
            try {
                Object.defineProperty(navigator, 'clipboard', {
                    value: customClipboard,
                    writable: false,
                    configurable: true
                });
            } catch (e) {
                console.error('Failed to override clipboard in main world:', e);
            }

            // Sincronización incondicional de idioma elegido en Pre-Launch para el modal de usuario (v60)
            try {
                const params = new URLSearchParams(window.location.search);
                const queryLang = params.get('lang');
                if (queryLang) {
                    localStorage.setItem('talkme_lang', queryLang.toLowerCase());
                }
                const hostToken = params.get('hostToken');
                if (hostToken) {
                    sessionStorage.setItem('talkme_host_token', hostToken);
                }
                // Desactivar Hermes TTS por defecto en instalación limpia si no fue configurado
                if (localStorage.getItem('hermes_tts_read_foreign') === null) {
                    localStorage.setItem('hermes_tts_read_foreign', 'false');
                }
            } catch (e) { }
        })();
    `;
    document.documentElement.appendChild(script);
    script.remove();
};

// Asegurar inyección inmediata en cuanto el nodo principal de la página exista
if (document.documentElement) {
    injectScript();
} else {
    const observer = new MutationObserver(() => {
        if (document.documentElement) {
            injectScript();
            observer.disconnect();
        }
    });
    observer.observe(document, { childList: true, subtree: true });
}

let originalIpParent = null;
let originalIpSibling = null;

// Mover dinámicamente la IP en el árbol DOM para respetar las regiones drag/no-drag de Chromium
function setupIpDomParent(isFS) {
    const ipEl = document.querySelector('.server-connection-top');
    if (!ipEl) return;

    if (isFS) {
        // En pantalla completa: Devolver la IP a su contenedor original en la vista de chat
        if (originalIpParent) {
            if (originalIpSibling) {
                originalIpParent.insertBefore(ipEl, originalIpSibling);
            } else {
                originalIpParent.appendChild(ipEl);
            }
        }
    } else {
        // En ventana/maximizado: Mover la IP como hijo directo de la barra de título para que funcione el no-drag
        const titleBar = document.getElementById('electron-title-bar');
        if (titleBar && ipEl.parentNode !== titleBar) {
            if (!originalIpParent) {
                originalIpParent = ipEl.parentNode;
                originalIpSibling = ipEl.nextSibling;
            }
            titleBar.appendChild(ipEl);
        }
    }
}

// Inyección dinámica de la cabecera premium de Electron con autohide y transparencias
window.addEventListener('DOMContentLoaded', () => {
    if (window.self !== window.top) return;

    // 1. Inyectar estilos CSS
    const style = document.createElement('style');
    style.innerHTML = `
        #electron-title-bar {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 30px;
            background-color: transparent !important;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            z-index: 999999;
            user-select: none;
            -webkit-app-region: drag;
            box-sizing: border-box;
            transition: top 0.2s ease-in-out, background-color 0.2s ease-in-out;
        }
        #electron-title-bar .controls {
            display: flex;
            height: 100%;
            -webkit-app-region: no-drag;
            margin-right: 15px; /* Margen invisible a la derecha del menú */
        }
        #electron-title-bar .btn {
            width: 46px;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: background-color 0.15s ease, color 0.15s;
            color: #ffffff !important; /* Iconos en blanco */
        }
        #electron-title-bar .btn:hover {
            background-color: rgba(255, 255, 255, 0.15);
        }
        #electron-title-bar .btn-close:hover {
            background-color: #e81123 !important;
        }

        /* Estilos en modo claro para contraste */
        [data-theme="light"] #electron-title-bar .btn,
        .light-mode #electron-title-bar .btn {
            color: #000000 !important; /* Iconos en negro */
        }
        [data-theme="light"] #electron-title-bar .btn:hover,
        .light-mode #electron-title-bar .btn:hover {
            background-color: rgba(0, 0, 0, 0.08) !important;
        }
        [data-theme="light"] #electron-title-bar .btn-close:hover,
        .light-mode #electron-title-bar .btn-close:hover {
            background-color: #e81123 !important;
            color: #ffffff !important;
        }
        
        /* Permitir que el fondo del HTML fluya hasta arriba del todo (sin lineas de fondo) */
        html {
            margin-top: 0px !important;
            height: 100% !important;
            box-sizing: border-box !important;
        }
        body {
            height: 100% !important;
        }

        /* COMPORTAMIENTO RESPONSIVO EXCLUSIVO PARA LA IP-ESTADO */
        /* Cuando la IP está dentro de la barra de título (Ventana / Maximizado) */
        #electron-title-bar .server-connection-top {
            position: absolute !important;
            right: 145px !important; /* Desplazado 10px adicionales hacia la izquierda (distancia total 145px) */
            top: 6px !important;    /* Centrado vertical perfecto en la barra de 30px */
            white-space: nowrap !important;
            -webkit-app-region: no-drag !important; /* Habilita clics para copiar la IP */
            cursor: pointer !important;
            z-index: 10000000 !important;
            transition: right 0.2s ease-in-out, top 0.2s ease-in-out !important;
        }
        
        /* Cuando la ventana está en pantalla completa y la IP vuelve a su contenedor original */
        .electron-fullscreen .server-connection-top {
            position: static !important;
            -webkit-app-region: no-drag !important;
        }

        /* [v60.QR-ACCESS] Habilitar botón de conexión y acceso QR en el Máster */
        #loginConnectBtn, #loginIpDisplay {
            display: flex !important;
        }

        .main-logo {
            top: 15px !important; /* Sube el logotipo a su altura original */
            transition: top 0.2s ease-in-out !important;
        }
        
        /* La caja de acciones de login (idioma/llave) se desplaza abajo en modo ventana */
        .login-header-actions {
            top: 42px !important;
            right: 20px !important;
            transition: top 0.2s ease-in-out !important;
        }

        /* Custom scrollbar unificada y minimalista para toda la app (modals, selectores en pre-launch y user-modal) */
        ::-webkit-scrollbar {
            width: 6px !important;
            height: 6px !important;
        }
        ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.03) !important;
            border-radius: 3px !important;
        }
        ::-webkit-scrollbar-thumb {
            background: rgba(123, 104, 238, 0.4) !important; /* Violeta/Indigo translúcido premium */
            border-radius: 3px !important;
            border: none !important;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(123, 104, 238, 0.7) !important;
        }

        /* Forzar que los dropdowns nativos del select de idioma usen el tema oscuro para que el scroll se adecúe */
        select.talkme-select, select.talkme-select option {
            color-scheme: dark !important;
        }

        /* Ajustes específicos del modal de términos de servicio y login en electron */
        #loginFooter {
            margin-top: 35px !important;    /* Trasladado del inferior al superior para separarlo del botón Talk! */
            margin-bottom: 0px !important;   /* Sin margen inferior para pegarlo al borde inferior de la tarjeta */
            text-align: center !important;
        }

        /* COMPORTAMIENTO EN PANTALLA COMPLETA */
        .electron-fullscreen #electron-title-bar {
            top: -29px; /* Ocultar barra dejando 1px para el trigger de hover */
            background-color: #0b0914 !important; /* Fondo oscuro sólido al desplegarse */
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .electron-fullscreen #electron-title-bar:hover {
            top: 0px;
        }
        
        /* Restaurar posiciones originales en pantalla completa */
        .electron-fullscreen .main-logo {
            top: 15px !important;
        }
        .electron-fullscreen .login-header-actions {
            top: 15px !important;
        }
    `;
    document.head.appendChild(style);

    // 2. Crear elementos HTML de la cabecera (Iconos en formato SVG para máxima nitidez y precisión)
    const titleBar = document.createElement('div');
    titleBar.id = 'electron-title-bar';
    titleBar.innerHTML = `
        <div class="controls">
            <div class="btn btn-min" title="Minimizar">
                <svg width="10" height="1" viewBox="0 0 10 1"><rect fill="currentColor" width="10" height="1"/></svg>
            </div>
            <div class="btn btn-max" title="Maximizar">
                <svg width="10" height="10" viewBox="0 0 10 10"><rect fill="none" stroke="currentColor" stroke-width="1.2" width="9" height="9" x="0.5" y="0.5"/></svg>
            </div>
            <div class="btn btn-close" title="Cerrar">
                <svg width="10" height="10" viewBox="0 0 10 10"><path fill="none" stroke="currentColor" stroke-width="1.2" d="M0,0 L10,10 M10,0 L0,10"/></svg>
            </div>
        </div>
    `;

    // 3. Insertar la barra
    document.body.insertBefore(titleBar, document.body.firstChild);

    // 4. Enlazar eventos de click
    titleBar.querySelector('.btn-min').addEventListener('click', () => ipcRenderer.send('window-minimize'));
    titleBar.querySelector('.btn-max').addEventListener('click', () => ipcRenderer.send('window-maximize-cycle'));
    titleBar.querySelector('.btn-close').addEventListener('click', () => ipcRenderer.send('window-close'));

    // Colocar la IP en su contenedor del DOM inicial
    setupIpDomParent(document.body.classList.contains('electron-fullscreen'));

    // Actualizar el icono al cargar por primera vez
    updateMaxBtnIcon();
});

// Función para actualizar dinámicamente el título e icono del botón de maximizar
function updateMaxBtnIcon() {
    const maxBtn = document.querySelector('.btn-max');
    if (!maxBtn) return;
    
    if (document.body.classList.contains('electron-fullscreen')) {
        // Pantalla completa -> Mostrar el icono original de doble cuadrado restaurado
        maxBtn.setAttribute('title', 'Restaurar ventana');
        maxBtn.innerHTML = `
            <svg width="10" height="10" viewBox="0 0 10 10">
                <path fill="none" stroke="currentColor" stroke-width="1.2" d="M2.5,2.5 L2.5,0.5 L9.5,0.5 L9.5,7.5 L7.5,7.5" />
                <rect fill="none" stroke="currentColor" stroke-width="1.2" width="7" height="7" x="0.5" y="2.5"/>
            </svg>
        `;
    } else if (document.body.classList.contains('electron-maximized')) {
        // Maximizado -> Siguiente paso: Pantalla completa (Icono expandir flechas cruzadas)
        maxBtn.setAttribute('title', 'Pantalla completa');
        maxBtn.innerHTML = `
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
        `;
    } else {
        // Normal/Ventana -> Siguiente paso: Maximizar (Icono de cuadrado tradicional)
        maxBtn.setAttribute('title', 'Maximizar');
        maxBtn.innerHTML = `
            <svg width="10" height="10" viewBox="0 0 10 10">
                <rect fill="none" stroke="currentColor" stroke-width="1.2" width="9" height="9" x="0.5" y="0.5"/>
            </svg>
        `;
    }
}

// Listener IPC para detectar cambios de pantalla completa desde el proceso principal
ipcRenderer.on('fullscreen-change', (event, isFS) => {
    if (isFS) {
        document.body.classList.add('electron-fullscreen');
    } else {
        document.body.classList.remove('electron-fullscreen');
    }
    setupIpDomParent(isFS);
    updateMaxBtnIcon();
});

// Listener IPC para detectar cambios de maximizado
ipcRenderer.on('maximize-change', (event, isMax) => {
    if (isMax) {
        document.body.classList.add('electron-maximized');
    } else {
        document.body.classList.remove('electron-maximized');
    }
    updateMaxBtnIcon();
});
