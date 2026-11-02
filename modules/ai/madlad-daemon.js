/**
 * 🌍 Babel Translation Daemon - Electron Desktop Override (v60.900)
 * 
 * Basado en CTranslate2 C++ nativo (Google MADLAD-400-3B cuantizado INT8).
 * Diseñado exclusivamente para el entorno empaquetado/instalado de Electron:
 * 1. Resolución elástica de modelo (models-path.json, C:\TalkMe\Models, relativo y escaneo ascendente).
 * 2. Fijación de cwd al directorio del binario C++ para resolver DLLs dinámicas de CTranslate2 y OpenMP.
 * 3. Fallo temprano inmediato sin penalización de 30 segundos si el proceso C++ no inicia.
 * 4. Watchdog dinámico adaptativo (con soporte CJK) y garantía incondicional al emisor.
 */

const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');
const os = require('os');
const fs = require('fs');

function isValidModelDir(dirPath) {
    if (!dirPath || !fs.existsSync(dirPath)) return false;
    const modelBin = path.join(dirPath, 'model.bin');
    try {
        if (fs.existsSync(modelBin)) {
            const stat = fs.statSync(modelBin);
            return stat.size > 100000000; // >100 MB garantiza que no es un stub o archivo corrupto
        }
    } catch (_) { }
    return false;
}

function resolveModelDir() {
    const candidateDirs = [];

    // 0. Entorno Portable (PORTABLE_DIR inyectado por Electron o PORTABLE_EXECUTABLE_DIR de electron-builder)
    const portableDir = process.env.PORTABLE_DIR || process.env.PORTABLE_EXECUTABLE_DIR;
    if (portableDir) {
        candidateDirs.push(path.join(portableDir, 'storage', 'models', 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8'));
        candidateDirs.push(path.join(portableDir, 'storage', 'models', 'translate', 'madlad400-3b-int8'));
        candidateDirs.push(path.join(portableDir, 'models', 'translate', 'madlad400-3b-int8'));
    }

    // 1. models-path.json en USER_DATA_PATH (configurado por usuario)
    try {
        const baseConfigDir = process.env.USER_DATA_PATH || path.join(__dirname, '..', '..');
        const pathFile = path.join(baseConfigDir, 'config', 'data', 'models-path.json');
        if (fs.existsSync(pathFile)) {
            const data = JSON.parse(fs.readFileSync(pathFile, 'utf8'));
            if (data && data.modelsPath) {
                candidateDirs.push(path.join(data.modelsPath, 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8'));
                candidateDirs.push(path.join(data.modelsPath, 'translate', 'madlad400-3b-int8'));
                candidateDirs.push(path.join(data.modelsPath, 'madlad400-3b-int8', 'madlad400-3b-int8'));
                candidateDirs.push(path.join(data.modelsPath, 'madlad400-3b-int8'));
            }
        }
    } catch (e) { }

    // 2. Ruta estándar de instalación industrial en Windows
    candidateDirs.push('C:\\TalkMe\\Models\\translate\\madlad400-3b-int8\\madlad400-3b-int8');
    candidateDirs.push('C:\\TalkMe\\Models\\translate\\madlad400-3b-int8');

    // 3. Ruta relativa interna local (con y sin anidación)
    candidateDirs.push(path.resolve(__dirname, '..', '..', 'storage', 'models', 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8'));
    candidateDirs.push(path.resolve(__dirname, '..', '..', 'storage', 'models', 'translate', 'madlad400-3b-int8'));

    // 4. Escaneo ascendente defensivo (hasta 6 niveles) para staging o empaquetado
    let checkDir = path.resolve(__dirname, '..', '..');
    for (let i = 0; i < 6; i++) {
        candidateDirs.push(path.join(checkDir, 'storage', 'models', 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8'));
        candidateDirs.push(path.join(checkDir, 'storage', 'models', 'translate', 'madlad400-3b-int8'));
        const parentDir = path.dirname(checkDir);
        if (parentDir === checkDir) break;
        checkDir = parentDir;
    }

    for (const cand of candidateDirs) {
        if (isValidModelDir(cand)) {
            console.log(`[MADLAD] Motor neuronal resuelto en: ${cand}`);
            return cand;
        }
    }

    return path.resolve(__dirname, '..', '..', 'storage', 'models', 'translate', 'madlad400-3b-int8'); // Fallback por defecto
}


function resolveBinaryPath() {
    const defaultBin = path.resolve(__dirname, '..', '..', 'bin', 'translate', 'Release', 'madlad-translator.exe');
    if (fs.existsSync(defaultBin)) return defaultBin;

    let checkDir = path.resolve(__dirname, '..', '..');
    for (let i = 0; i < 6; i++) {
        const candidate = path.join(checkDir, 'bin', 'translate', 'Release', 'madlad-translator.exe');
        if (fs.existsSync(candidate)) {
            return candidate;
        }
        const parentDir = path.dirname(checkDir);
        if (parentDir === checkDir) break;
        checkDir = parentDir;
    }

    return defaultBin;
}

class MadladDaemon {
    constructor() {
        this.process = null;
        this.rl = null;
        this.isReady = false;
        this.isInitializing = false;
        this.pendingRequests = new Map(); // id -> { resolve, reject, timeoutTimer, fallbackText }
        this.requestId = 0;
        this.queue = []; // Cola secuencial FIFO
        this.isProcessingQueue = false;
        this.MAX_QUEUE_SIZE = 3; // Backpressure defensivo

        this.binaryPath = resolveBinaryPath();
        this.modelDir = resolveModelDir();

        // Blindaje Anti-Zombies en Windows: si Node.js cae, el binario C++ muere inmediatamente
        const cleanup = () => this.terminate();
        process.on('exit', cleanup);
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
    }

    async init() {
        if (this.isReady) return;
        if (this.isInitializing) {
            return new Promise((resolve, reject) => {
                const check = setInterval(() => {
                    if (this.isReady) { clearInterval(check); resolve(); }
                }, 50);
                setTimeout(() => { clearInterval(check); reject(new Error('TIMEOUT_INIT_MADLAD')); }, 15000);
            });
        }

        // Reevaluar rutas al arrancar por si se configuraron dinámicamente
        this.binaryPath = resolveBinaryPath();
        this.modelDir = resolveModelDir();

        if (!fs.existsSync(this.binaryPath)) {
            console.warn(`⚠️ [MADLAD-DAEMON] Binario C++ no encontrado en: ${this.binaryPath}`);
            throw new Error(`BINARY_NOT_FOUND: ${this.binaryPath}`);
        }
        if (!fs.existsSync(this.modelDir)) {
            console.warn(`⚠️ [MADLAD-DAEMON] Carpeta de modelo no encontrada en: ${this.modelDir}`);
            throw new Error(`MODEL_DIR_NOT_FOUND: ${this.modelDir}`);
        }

        this.isInitializing = true;
        return new Promise((resolve, reject) => {
            const totalCores = os.cpus().length;
            const safeThreads = Math.max(1, Math.min(4, Math.floor(totalCores / 2)));

            console.log(`🧠 [MADLAD-DAEMON] Levantando demonio CTranslate2 (Desktop Override)...`);
            console.log(`   - Binario: ${this.binaryPath}`);
            console.log(`   - Modelo:  ${this.modelDir}`);
            console.log(`   - Hilos seguros: ${safeThreads}`);

            // CWD fijado al directorio del binario para resolución de DLLs nativas (ctranslate2.dll, libiomp5md.dll)
            const binaryDir = path.dirname(this.binaryPath);

            this.process = spawn(this.binaryPath, [
                '--model_dir', this.modelDir,
                '--threads', safeThreads.toString(),
                '--beam_size', '1',
                '--max_decoding_length', '96'
            ], {
                cwd: binaryDir,
                windowsHide: true,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            // Prioridad reducida en Windows para blindar buffers de audio en tiempo real
            if (process.platform === 'win32' && this.process.pid) {
                try {
                    os.setPriority(this.process.pid, os.constants.priority.PRIORITY_BELOW_NORMAL);
                } catch (e) { }
            }

            this.rl = readline.createInterface({
                input: this.process.stdout,
                crlfDelay: Infinity
            });

            this.rl.on('line', (line) => {
                const trimmed = line.trim();
                if (!trimmed) return;

                if (trimmed === 'READY') {
                    this.isReady = true;
                    this.isInitializing = false;
                    console.log('✅ [MADLAD-DAEMON] Motor CTranslate2 inicializado y residente en RAM.');
                    resolve();
                    this._processNextInQueue();
                    return;
                }

                try {
                    const res = JSON.parse(trimmed);
                    const pending = this.pendingRequests.get(res.id);
                    if (pending) {
                        clearTimeout(pending.timeoutTimer);
                        this.pendingRequests.delete(res.id);
                        if (res.status === 'ok') {
                            pending.resolve(res.result);
                        } else {
                            console.warn(`⚠️ [MADLAD-DAEMON] Error de inferencia para ${res.id}:`, res.error);
                            pending.resolve(pending.fallbackText);
                        }
                    }
                } catch (err) {
                    console.error('❌ [MADLAD-DAEMON] Error parseando respuesta JSON:', err, trimmed);
                } finally {
                    this.isProcessingQueue = false;
                    this._processNextInQueue();
                }
            });

            this.process.stderr.on('data', (d) => {
                const msg = d.toString().trim();
                if (msg) console.warn('⚠️ [MADLAD-DAEMON-STDERR]:', msg);
            });

            this.process.on('exit', (code) => {
                console.warn(`⚠️ [MADLAD-DAEMON] Proceso terminó con código ${code}`);
                const wasStarting = this.isInitializing && !this.isReady;
                this.isReady = false;
                this.isInitializing = false;
                this.isProcessingQueue = false;

                // Si terminó mientras intentaba arrancar, rechazar inmediatamente (sin esperar 30s)
                if (wasStarting) {
                    reject(new Error(`MADLAD_PROCESS_EXITED_EARLY_${code}`));
                }

                // Rechazar peticiones activas con fallback
                for (const [id, req] of this.pendingRequests.entries()) {
                    clearTimeout(req.timeoutTimer);
                    req.resolve(req.fallbackText);
                }
                this.pendingRequests.clear();
                // Drenar cola pendiente con fallback
                while (this.queue.length > 0) {
                    const queued = this.queue.shift();
                    queued.resolve(queued.fallbackText);
                }
            });

            // Timeout de arranque en frío de seguridad (30s)
            setTimeout(() => {
                if (!this.isReady && this.isInitializing) {
                    this.isInitializing = false;
                    reject(new Error('TIMEOUT_STARTING_MADLAD_PROCESS'));
                }
            }, 30000);
        });
    }

    async translate(targetPrefix, text) {
        if (!this.isReady) {
            await this.init();
        }

        return new Promise((resolve) => {
            if (this.queue.length >= this.MAX_QUEUE_SIZE) {
                console.warn(`⚠️ [MADLAD-DAEMON] Backpressure: Cola llena (${this.queue.length}/${this.MAX_QUEUE_SIZE}). Aplicando fallback inmediato.`);
                return resolve(text);
            }

            const id = `req_${++this.requestId}_${Date.now()}`;
            this.queue.push({
                id,
                targetPrefix,
                text,
                fallbackText: text,
                resolve
            });

            this._processNextInQueue();
        });
    }

    _processNextInQueue() {
        if (this.isProcessingQueue || this.queue.length === 0 || !this.isReady || !this.process) {
            return;
        }

        this.isProcessingQueue = true;
        const task = this.queue.shift();

        // Cálculo de Watchdog Dinámico Adaptativo con protección CJK
        const isCJK = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(task.text || '');
        const units = isCJK ? (task.text || '').length : (task.text || '').trim().split(/\s+/).filter(Boolean).length;
        const dynamicTimeout = Math.min(16000, 4000 + (units * 200));

        const timeoutTimer = setTimeout(() => {
            if (this.pendingRequests.has(task.id)) {
                console.warn(`⏰ [MADLAD-DAEMON] Watchdog adaptativo (${dynamicTimeout}ms) disparado para ${task.id} (${units} unidades). Aplicando fallback.`);
                this.pendingRequests.delete(task.id);
                task.resolve(task.fallbackText);
                this.isProcessingQueue = false;
                this._processNextInQueue();
            }
        }, dynamicTimeout);

        this.pendingRequests.set(task.id, {
            resolve: task.resolve,
            fallbackText: task.fallbackText,
            timeoutTimer
        });

        const payload = JSON.stringify({
            id: task.id,
            target: task.targetPrefix,
            text: task.text
        });

        try {
            this.process.stdin.write(payload + '\n');
        } catch (err) {
            console.error(`❌ [MADLAD-DAEMON] Error escribiendo en stdin:`, err);
            clearTimeout(timeoutTimer);
            this.pendingRequests.delete(task.id);
            task.resolve(task.fallbackText);
            this.isProcessingQueue = false;
            this._processNextInQueue();
        }
    }

    terminate() {
        if (this.process && !this.process.killed) {
            try {
                this.process.stdin.write('QUIT\n');
                this.process.kill();
            } catch (e) { }
            this.process = null;
            this.isReady = false;
            this.isProcessingQueue = false;
        }
    }
}

const daemonInstance = new MadladDaemon();
module.exports = daemonInstance;
