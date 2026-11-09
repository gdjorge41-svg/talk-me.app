const { app, BrowserWindow, session, ipcMain, dialog, Menu, shell } = require('electron');
const { spawn, fork } = require('child_process');
const path = require('path');
const net = require('net');
const fs = require('fs');

// Habilitar los atajos de teclado estándar de edición (copiar, pegar, etc.) de forma limpia
const template = [
    {
        label: 'Edit',
        submenu: [
            { role: 'undo', label: 'Deshacer' },
            { role: 'redo', label: 'Rehacer' },
            { type: 'separator' },
            { role: 'cut', label: 'Cortar' },
            { role: 'copy', label: 'Copiar' },
            { role: 'paste', label: 'Pegar' },
            { role: 'selectAll', label: 'Seleccionar todo' }
        ]
    }
];
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// CONTROL DE INSTANCIA ÚNICA
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    console.warn("⚠️ Ya hay otra instancia de la aplicación ejecutándose. Cerrando...");
    app.quit();
    process.exit(0);
}

let launcherProcess = null;
let serverProcess = null;
let mainWindow = null;
let allocatedPort = 3000; // Se escaneará dinámicamente
const electronHostToken = 'talkme_desktop_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const portableDir = process.env.PORTABLE_EXECUTABLE_DIR || (process.env.PORTABLE_DIR || '');

app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

// Autodiagnóstico de permisos para evitar bloqueos silenciosos de Windows Defender/Antivirus
function testWritePermissions() {
    const userData = app.getPath('userData');
    const testFile = path.join(userData, '.write_test');
    try {
        fs.writeFileSync(testFile, 'test', 'utf8');
        fs.unlinkSync(testFile);
        return true;
    } catch (e) {
        dialog.showErrorBox(
            "Error de Permisos de Escritura",
            `Talk.me no puede escribir en su directorio de datos:\n${userData}\n\nDetalles: ${e.message}\n\nPor favor, añada esta aplicación a la lista de exclusiones de su Antivirus o desactive temporalmente el Control de Acceso a Carpetas de Windows Defender.`
        );
        app.quit();
        return false;
    }
}

// Helper experto para escanear y encontrar el primer puerto libre a partir del base
function findFreePort(basePort, callback) {
    const server = net.createServer();
    server.listen(basePort, () => {
        const port = server.address().port;
        server.close(() => {
            callback(port);
        });
    });
    server.on('error', () => {
        findFreePort(basePort + 1, callback);
    });
}

function loadUrlWhenReady(url, attempts = 0) {
    if (attempts > 30) {
        console.error(`[ELECTRON] Server failed to start after 30 attempts at ${url}`);
        return;
    }

    const client = url.startsWith('https:') ? require('https') : require('http');
    const options = url.startsWith('https:') ? { rejectUnauthorized: false } : {};
    
    client.get(url, options, (res) => {
        console.log(`[ELECTRON] Server is ready (status: ${res.statusCode}). Loading page...`);
        if (mainWindow) {
            mainWindow.loadURL(url);
            // Red de seguridad incondicional: forzar visualización si ready-to-show tarda
            setTimeout(() => {
                if (mainWindow && !mainWindow.isVisible()) {
                    console.log('[ELECTRON] Forzando visibilidad de ventana principal (Fallback de seguridad)...');
                    mainWindow.show();
                    mainWindow.focus();
                }
            }, 800);
        }
    }).on('error', (err) => {
        // Reintentar si falla la conexión
        setTimeout(() => loadUrlWhenReady(url, attempts + 1), 500);
    });
}

function getChildBinary() {
    // 1. Probar binario 'node' en el PATH del sistema
    try {
        const { execSync } = require('child_process');
        execSync('node -v', { stdio: 'ignore' });
        return 'node';
    } catch (e) {}

    // 2. En macOS, comprobar rutas canónicas de Homebrew e instaladores estándar
    if (process.platform === 'darwin') {
        const macNodePaths = [
            '/opt/homebrew/bin/node', // Apple Silicon M1/M2/M3/M4
            '/usr/local/bin/node',    // Intel x86_64 Mac
            '/usr/bin/node'
        ];
        for (const candidate of macNodePaths) {
            try {
                if (fs.existsSync(candidate)) return candidate;
            } catch (_) {}
        }
    }

    // 3. Fallback controlado a process.execPath (Electron) o 'node'
    return app.isPackaged ? process.execPath : 'node';
}

function startLauncher() {
    const logPath = path.join(app.getPath('userData'), 'process_logs.txt');
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });
    logStream.write(`\n=== START LAUNCHER AT ${new Date().toISOString()} ===\n`);

    const childBinary = getChildBinary();
    const appNodeModules = path.join(__dirname, 'node_modules');
    const existingNodePath = process.env.NODE_PATH ? (appNodeModules + path.delimiter + process.env.NODE_PATH) : appNodeModules;

    launcherProcess = spawn(childBinary, [path.join(__dirname, 'pre-launch', 'launcher-server.js')], {
        env: {
            ...process.env,
            NODE_PATH: existingNodePath,
            ELECTRON_RUN_AS_NODE: '1',
            USER_DATA_PATH: app.getPath('userData'),
            PORT: allocatedPort,
            ELECTRON_HOST_TOKEN: electronHostToken,
            PORTABLE_DIR: portableDir,
            PORTABLE_EXECUTABLE_DIR: portableDir
        },
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
        windowsHide: true
    });
 
    launcherProcess.stdout.on('data', (data) => {
        logStream.write(`[LAUNCHER OUT] ${data}`);
    });
    launcherProcess.stderr.on('data', (data) => {
        logStream.write(`[LAUNCHER ERR] ${data}`);
    });
 
    launcherProcess.on('message', (msg) => {
        if (msg && msg.event === 'license-validated') {
            logStream.write('✅ Licencia validada. Deteniendo Launcher y levantando Chat Server...\n');
            cleanupSubprocesses(); // Saneamiento total antes de levantar el nuevo
            const targetLang = (msg && msg.lang) ? msg.lang : '';
            setTimeout(() => {
                startChatServer(targetLang);
            }, 1000); // Retardo de seguridad de 1 segundo para permitir al sistema operativo liberar el puerto 3000
        }
    });
}
 
function startChatServer(targetLang = '') {
    const logPath = path.join(app.getPath('userData'), 'process_logs.txt');
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });
    logStream.write(`\n=== START SERVER AT ${new Date().toISOString()} ===\n`);
 
    // Si no vino en el mensaje IPC, consultar models-path.json persistido en AppData como salvaguarda defensiva
    let selectedLang = (targetLang || '').trim().toLowerCase();
    if (!selectedLang) {
        try {
            const modelsPathFile = path.join(app.getPath('userData'), 'config', 'data', 'models-path.json');
            if (fs.existsSync(modelsPathFile)) {
                const conf = JSON.parse(fs.readFileSync(modelsPathFile, 'utf8'));
                if (conf && conf.defaultLang) selectedLang = conf.defaultLang.toLowerCase();
            }
        } catch (e) { }
    }
    if (!selectedLang) selectedLang = 'es';

    const childBinary = getChildBinary();
    let spawnBin = childBinary;
    let spawnArgs = [path.join(__dirname, 'server.js')];
    const appNodeModules = path.join(__dirname, 'node_modules');
    const existingNodePath = process.env.NODE_PATH ? (appNodeModules + path.delimiter + process.env.NODE_PATH) : appNodeModules;

    serverProcess = spawn(spawnBin, spawnArgs, {
        env: {
            ...process.env,
            NODE_PATH: existingNodePath,
            ELECTRON_RUN_AS_NODE: '1',
            USER_DATA_PATH: app.getPath('userData'),
            PORT: allocatedPort,
            ELECTRON_HOST_TOKEN: electronHostToken,
            PORTABLE_DIR: portableDir,
            PORTABLE_EXECUTABLE_DIR: portableDir
        },
        stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
        windowsHide: true
    });

    serverProcess.stdout.on('data', (data) => {
        logStream.write(`[SERVER OUT] ${data}`);
    });
    serverProcess.stderr.on('data', (data) => {
        logStream.write(`[SERVER ERR] ${data}`);
    });

    // Esperar de forma dinámica y robusta a que el puerto responda conservando el idioma y hostToken
    loadUrlWhenReady(`https://localhost:${allocatedPort}/?lang=${encodeURIComponent(selectedLang)}&transitioning=true&hostToken=${encodeURIComponent(electronHostToken)}`);
}

function createWindow() {
    // Abortar lanzamiento si el antivirus tiene bloqueada la carpeta AppData
    if (!testWritePermissions()) return;

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        frame: false, // Sin marcos nativos para permitir la cabecera HTML
        show: false, // Ocultar al iniciar hasta que el contenido esté listo
        icon: process.platform === 'win32' 
            ? path.join(__dirname, 'icon.ico') 
            : path.join(__dirname, 'public', 'favicon', 'favicon_2.png'), // Icono optimizado multi-resolución para barra de tareas
        backgroundColor: '#100e1e', // Evita el destello blanco
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            autoplayPolicy: 'no-user-gesture-required'
        }
    });

    const isLocalUrl = (url) => {
        const prefixes = [
            `https://localhost:${allocatedPort}`,
            `https://127.0.0.1:${allocatedPort}`,
            `http://localhost:${allocatedPort}`,
            `http://127.0.0.1:${allocatedPort}`
        ];
        return prefixes.some(prefix => url.startsWith(prefix));
    };

    // Interceptar apertura de nuevas ventanas (links con target="_blank" o Stripe checkout)
    // para forzar que se abran en el navegador web predeterminado del sistema operativo.
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (!isLocalUrl(url) && (url.startsWith('https://') || url.startsWith('http://'))) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    // Interceptar navegaciones accidentales de links externos dentro de la ventana principal
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (!isLocalUrl(url) && url.startsWith('http')) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });


    // Mostrar ventana de manera fluida y suave una vez que esté lista para presentarse
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.on('enter-full-screen', () => {
        mainWindow.webContents.send('fullscreen-change', true);
    });

    mainWindow.on('leave-full-screen', () => {
        mainWindow.webContents.send('fullscreen-change', false);
        mainWindow.webContents.send('maximize-change', mainWindow.isMaximized());
    });

    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('maximize-change', true);
    });

    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('maximize-change', false);
    });

    // Ignorar errores de certificados SSL auto-firmados en localhost
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
        if (url.startsWith('https://localhost:') || url.startsWith('https://127.0.0.1:')) {
            event.preventDefault();
            callback(true); // Permitido de forma segura para red interna local
        } else {
            callback(false);
        }
    });

    // Registro de listeners de la cabecera personalizada de ventana (IPC)
    ipcMain.on('window-minimize', () => {
        if (mainWindow) mainWindow.minimize();
    });
    ipcMain.on('window-maximize-cycle', () => {
        if (mainWindow) {
            if (mainWindow.isFullScreen()) {
                mainWindow.setFullScreen(false);
                mainWindow.unmaximize();
            } else if (mainWindow.isMaximized()) {
                mainWindow.setFullScreen(true);
            } else {
                mainWindow.maximize();
            }
        }
    });
    ipcMain.on('window-fullscreen', () => {
        if (mainWindow) {
            const isFullScreen = mainWindow.isFullScreen();
            mainWindow.setFullScreen(!isFullScreen);
        }
    });
    ipcMain.on('window-close', () => {
        if (mainWindow) mainWindow.close();
    });
    ipcMain.on('copy-clipboard', (event, text) => {
        require('electron').clipboard.writeText(text);
    });

    // Soporte para tecla F11 de pantalla completa
    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F11' && input.type === 'keyDown') {
            const isFullScreen = mainWindow.isFullScreen();
            mainWindow.setFullScreen(!isFullScreen);
            event.preventDefault();
        }
    });

    // Sincronización nativa del silenciado de audio en Chromium
    ipcMain.on('set-audio-muted', (event, isMuted) => {
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.setAudioMuted(isMuted);
            console.log(`🔇 [ELECTRON] Silenciado de audio cambiado a: ${isMuted}`);
        }
    });


    ipcMain.handle('get-license-key', async () => {
        try {
            const { validateOfflineToken } = require('./pre-launch/license-manager');
            const { generateHardwareFingerprint } = require('./pre-launch/mac-fingerprint');
            const hwId = generateHardwareFingerprint();
            const offlineCheck = validateOfflineToken(hwId);
            return offlineCheck.licenseKey || '';
        } catch (e) {
            console.error('Error in get-license-key IPC handler:', e);
            return '';
        }
    });

    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
        const allowed = ['media', 'midi', 'midiSysex', 'notifications', 'pointerLock'];
        if (allowed.includes(permission)) return callback(true);
        callback(true);
    });

    session.defaultSession.setPermissionCheckHandler(() => true);

    // Escaneo dinámico de puertos antes de levantar el Launcher
    findFreePort(3000, (freePort) => {
        allocatedPort = freePort;
        console.log(`📡 Puerto libre asignado al ecosistema Talk.me: ${allocatedPort}`);
        startLauncher();
        
        // Esperar de forma dinámica y robusta a que el launcher esté listo
        loadUrlWhenReady(`http://localhost:${allocatedPort}`);
    });
}

app.whenReady().then(createWindow);

function cleanupSubprocesses() {
    console.log('[ELECTRON] Cleaning up subprocesses...');
    if (launcherProcess) {
        try { launcherProcess.kill('SIGKILL'); } catch (e) {}
        launcherProcess = null;
    }
    if (serverProcess) {
        try { serverProcess.kill('SIGKILL'); } catch (e) {}
        serverProcess = null;
    }
}

app.on('window-all-closed', () => {
    cleanupSubprocesses();
    app.quit();
});

app.on('will-quit', () => {
    cleanupSubprocesses();
});

app.on('before-quit', () => {
    cleanupSubprocesses();
});
