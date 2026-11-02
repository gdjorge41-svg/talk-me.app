/**
 * 📂 TriggerFileSync - Motor de Sincronización Bidireccional de Triggers en Carpeta (v60.Elite)
 *
 * Propósito:
 * - Almacenar cada Trigger (IN y OUT) como un archivo .json individual e intercambiable
 *   dentro de la carpeta `triggers/` (en USER_DATA_PATH en instalador Electron, o raíz en dev).
 * - Auto-contener audios e imágenes de Triggers IN en Base64 (`_embeddedMedia`) para que
 *   1 Trigger = 1 Único Archivo .json 100% portable entre ordenadores sin perder multimedia.
 * - Vigilar en caliente (`fs.watch` con debounce, anti-eco y reintentos ante EBUSY) cualquier
 *   archivo pegado, modificado o eliminado con el servidor iniciado, actualizando la app sin reiniciar.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

class TriggerFileSync {
    constructor() {
        this.initialized = false;
        this.projectRoot = path.resolve(__dirname, '..');
        this.storage = null;
        this.triggersDir = null;
        this.uploadsDir = null;
        this.legacyUploadsDir = path.join(this.projectRoot, 'public', 'uploads', 'triggers');
        this.triggersFilePath = null;
        this.migrationMarkerPath = null;
        this.onExternalChange = null;

        this.watcher = null;
        this.debounceTimer = null;
        this.retryTimer = null;
        this.retryCount = 0;

        // Mapa de bloqueo anti-eco: filename -> timestamp hasta el que se ignoran eventos de fs.watch
        this.internalWriteLocks = new Map();
        // Firma SHA-1 del último catálogo válido en RAM para evitar broadcasts redundantes
        this.lastCatalogSignature = '';
        // Cache de último estado conocido por archivo para resistir lecturas parciales en Windows
        this.fileTriggerCache = new Map(); // filename -> triggerObject (sin _embeddedMedia)
        this.lastFolderStatHash = '';
    }

    /**
     * Inicializa el sistema de archivos de triggers y realiza la migración inicial si procede.
     * @param {Object} options
     * @param {Object} options.storage - Instancia de storage/storage.js
     * @param {string} options.triggersFilePath - Ruta a config/data/triggers.json
     * @param {string} options.uploadsDirPath - Ruta a uploads/triggers
     * @param {Function} options.onExternalChange - Callback (triggersArray) => void cuando cambian archivos en disco
     * @returns {Array} Lista inicial de triggers cargados
     */
    init({ storage, triggersFilePath, uploadsDirPath, onExternalChange }) {
        this.storage = storage;
        this.triggersFilePath = triggersFilePath;
        this.onExternalChange = typeof onExternalChange === 'function' ? onExternalChange : null;

        // 1. Resolver rutas escribibles seguras (compatible con Instalador NSIS, Portable y Dev)
        this.triggersDir = this._resolvePath(path.join(this.projectRoot, 'triggers'));
        this.uploadsDir = uploadsDirPath || this._resolvePath(path.join(this.projectRoot, 'public', 'uploads', 'triggers'));
        this.migrationMarkerPath = this._resolvePath(path.join(this.projectRoot, 'config', 'data', '.triggers_folder_migrated_v60'));

        this._ensureDir(this.triggersDir);
        this._ensureDir(this.uploadsDir);
        this._ensureDir(path.dirname(this.migrationMarkerPath));

        // 2. Cargar triggers legados desde config/data/triggers.json
        let legacyTriggers = [];
        try {
            const parsed = this.storage ? this.storage.readJSON(this.triggersFilePath) : null;
            if (Array.isArray(parsed)) {
                legacyTriggers = parsed;
            }
        } catch (e) {
            console.warn('⚠️ [TriggerFileSync] Error leyendo triggers.json inicial:', e.message);
        }

        // 3. Ejecutar migración inicial única si aún no se ha migrado a la carpeta triggers/
        this._performInitialMigrationIfNeeded(legacyTriggers);

        // 4. Escanear la carpeta triggers/ como fuente de verdad
        const loadedTriggers = this.scanFolderAndSync({ isInit: true, fallbackTriggers: legacyTriggers });

        // 5. Iniciar vigilancia en caliente (Hot-Reload sin reiniciar la app)
        this.startWatcher();

        this.initialized = true;
        console.log(`📂 [TriggerFileSync] Carpeta activa: ${this.triggersDir} (${loadedTriggers.length} triggers)`);
        return loadedTriggers;
    }

    _resolvePath(targetPath) {
        if (this.storage && typeof this.storage.resolveWritablePath === 'function') {
            return this.storage.resolveWritablePath(targetPath);
        }
        return path.resolve(targetPath);
    }

    _ensureDir(dirPath) {
        try {
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        } catch (e) {
            console.error(`❌ [TriggerFileSync] No se pudo crear directorio ${dirPath}:`, e.message);
        }
    }

    /**
     * Convierte los triggers existentes en triggers.json (o en la carpeta semilla del instalador)
     * a archivos individuales .json la primera vez que se ejecuta esta versión.
     */
    _performInitialMigrationIfNeeded(legacyTriggers) {
        try {
            const alreadyMigrated = fs.existsSync(this.migrationMarkerPath);

            // Si estamos en Electron (USER_DATA_PATH), comprobar si la carpeta base de instalación
            // trae archivos semilla en <projectRoot>/triggers que aún no estén en USER_DATA_PATH/triggers
            const seedDir = path.join(this.projectRoot, 'triggers');
            if (!alreadyMigrated && seedDir !== this.triggersDir && fs.existsSync(seedDir)) {
                try {
                    const seedFiles = fs.readdirSync(seedDir).filter(f => f.toLowerCase().endsWith('.json'));
                    for (const file of seedFiles) {
                        const src = path.join(seedDir, file);
                        const dest = path.join(this.triggersDir, file);
                        if (!fs.existsSync(dest)) {
                            fs.copyFileSync(src, dest);
                        }
                    }
                } catch (seedErr) {
                    console.warn('⚠️ [TriggerFileSync] Aviso copiando semillas de instalación:', seedErr.message);
                }
            }

            const currentFiles = this._getJsonFilesInTriggersDir();

            if (!alreadyMigrated) {
                if (currentFiles.length === 0 && Array.isArray(legacyTriggers) && legacyTriggers.length > 0) {
                    console.log(`🔄 [TriggerFileSync] Migrando ${legacyTriggers.length} triggers desde triggers.json a archivos individuales...`);
                    for (const trig of legacyTriggers) {
                        if (trig && trig.id) {
                            this.saveSingleTrigger(trig, { skipSignatureUpdate: true });
                        }
                    }
                }
                // Escribir marcador en config/data/ (fuera de triggers/ para que el usuario no lo vea ni lo borre con Ctrl+A)
                fs.writeFileSync(this.migrationMarkerPath, JSON.stringify({
                    migratedAt: new Date().toISOString(),
                    version: 'v60.Elite'
                }, null, 2), 'utf8');
            }
        } catch (e) {
            console.error('⚠️ [TriggerFileSync] Error en migración inicial:', e.message);
        }
    }

    _getJsonFilesInTriggersDir() {
        try {
            this._ensureDir(this.triggersDir);
            return fs.readdirSync(this.triggersDir).filter(f => {
                const lower = f.toLowerCase();
                return lower.endsWith('.json') && !lower.endsWith('.tmp') && !f.startsWith('.');
            });
        } catch (e) {
            return [];
        }
    }

    /**
     * Genera un nombre de archivo legible para humanos y seguro para Windows/macOS/Linux:
     * Ejemplo: IN_SMPTE_01-INTRO+MEZU-BAT__tr_mp5tddxyveb4.json
     *          OUT_OSC_DONDE-ESTAS-OSC__tr_mmk8feypuzfq.json
     */
    buildFilename(trigger) {
        const dirPrefix = (trigger.direction === 'IN') ? 'IN' : 'OUT';
        const typePrefix = String(trigger.type || 'OSC').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const rawName = String(trigger.name || 'Trigger').trim();

        // Limpiar caracteres prohibidos en Windows (\ / : * ? " < > |) y espacios múltiples
        let safeName = rawName
            .replace(/[\\/:*?"<>|\x00-\x1F]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        if (!safeName) safeName = 'Trigger';
        if (safeName.length > 60) safeName = safeName.substring(0, 60);

        const safeId = String(trigger.id || ('tr_' + Date.now())).replace(/[^a-zA-Z0-9_\-]/g, '');
        return `${dirPrefix}_${typePrefix}_${safeName}__${safeId}.json`;
    }

    _lockFileInternal(filename, durationMs = 1000) {
        this.internalWriteLocks.set(filename, Date.now() + durationMs);
    }

    _isFileLockedInternally(filename) {
        const until = this.internalWriteLocks.get(filename);
        if (!until) return false;
        if (Date.now() <= until) return true;
        this.internalWriteLocks.delete(filename);
        return false;
    }

    /**
     * Busca la ruta física de un archivo multimedia (/uploads/triggers/xxx)
     * tanto en el directorio escribible (USER_DATA_PATH) como en public/uploads/triggers.
     */
    resolveMediaPhysicalPath(mediaUrl) {
        if (!mediaUrl || typeof mediaUrl !== 'string') return null;
        const filename = path.basename(mediaUrl);
        if (!filename) return null;

        const candidates = [
            path.join(this.uploadsDir, filename),
            path.join(this.legacyUploadsDir, filename),
            path.join(this.projectRoot, 'public', mediaUrl)
        ];

        for (const p of candidates) {
            try {
                if (fs.existsSync(p) && fs.statSync(p).isFile() && fs.statSync(p).size > 0) {
                    return p;
                }
            } catch (_) { }
        }
        return null;
    }

    /**
     * Empaqueta audio e imagen en Base64 dentro de `_embeddedMedia` para que el archivo .json
     * sea 100% auto-contenido al compartirlo con otro ordenador.
     */
    _buildSerializableTriggerWithMedia(trigger) {
        const clone = JSON.parse(JSON.stringify(trigger));
        delete clone._embeddedMedia;

        const serialized = {
            _talkmeFormat: 'trigger-v60',
            ...clone,
            direction: clone.direction === 'IN' ? 'IN' : 'OUT'
        };

        if (serialized.direction === 'IN' && serialized.message) {
            const embedded = {};

            if (serialized.message.audio) {
                const audioPath = this.resolveMediaPhysicalPath(serialized.message.audio);
                if (audioPath) {
                    try {
                        const buf = fs.readFileSync(audioPath);
                        const filename = path.basename(audioPath);
                        embedded.audio = {
                            filename,
                            relativePath: `/uploads/triggers/${filename}`,
                            base64: buf.toString('base64')
                        };
                        // Asegurar que también exista en uploadsDir escribible
                        const targetWritable = path.join(this.uploadsDir, filename);
                        if (audioPath !== targetWritable && !fs.existsSync(targetWritable)) {
                            try { fs.copyFileSync(audioPath, targetWritable); } catch (_) { }
                        }
                    } catch (e) {
                        console.warn(`⚠️ [TriggerFileSync] No se pudo embeber audio ${audioPath}:`, e.message);
                    }
                }
            }

            if (serialized.message.image) {
                const imagePath = this.resolveMediaPhysicalPath(serialized.message.image);
                if (imagePath) {
                    try {
                        const buf = fs.readFileSync(imagePath);
                        const filename = path.basename(imagePath);
                        embedded.image = {
                            filename,
                            relativePath: `/uploads/triggers/${filename}`,
                            base64: buf.toString('base64')
                        };
                        const targetWritable = path.join(this.uploadsDir, filename);
                        if (imagePath !== targetWritable && !fs.existsSync(targetWritable)) {
                            try { fs.copyFileSync(imagePath, targetWritable); } catch (_) { }
                        }
                    } catch (e) {
                        console.warn(`⚠️ [TriggerFileSync] No se pudo embeber imagen ${imagePath}:`, e.message);
                    }
                }
            }

            if (embedded.audio || embedded.image) {
                serialized._embeddedMedia = embedded;
            }
        }

        return serialized;
    }

    /**
     * Si un archivo .json recién pegado en la carpeta `triggers/` incluye `_embeddedMedia`,
     * reconstruye automáticamente los archivos físicos de audio/imagen en disco antes de que la UI los pida.
     */
    _extractMediaAndCleanTrigger(rawTrigger) {
        if (!rawTrigger || typeof rawTrigger !== 'object') return null;

        const clean = { ...rawTrigger };
        const embedded = clean._embeddedMedia;
        delete clean._embeddedMedia;
        delete clean._talkmeFormat;

        // Normalizar dirección para retrocompatibilidad con el resto de Talk.me
        if (clean.direction !== 'IN') {
            delete clean.direction; // En triggersCache original, los OUT no requieren `direction: 'OUT'` o usan undefined
        }

        if (embedded && typeof embedded === 'object' && clean.direction === 'IN') {
            if (!clean.message) clean.message = {};

            // 1. Extraer Audio si está embebido
            if (embedded.audio && embedded.audio.base64 && embedded.audio.filename) {
                const safeFilename = path.basename(embedded.audio.filename).replace(/[^a-zA-Z0-9._\-]/g, '_');
                const destPath = path.join(this.uploadsDir, safeFilename);
                try {
                    if (!fs.existsSync(destPath) || fs.statSync(destPath).size === 0) {
                        const buf = Buffer.from(embedded.audio.base64, 'base64');
                        const tmpPath = `${destPath}.tmp`;
                        fs.writeFileSync(tmpPath, buf);
                        fs.renameSync(tmpPath, destPath);
                        console.log(`🔊 [TriggerFileSync] Audio reconstruido desde el archivo del trigger: ${safeFilename}`);
                    }
                    // Intentar espejar en public/uploads/triggers si es escribible (modo dev)
                    if (this.legacyUploadsDir !== this.uploadsDir) {
                        try {
                            this._ensureDir(this.legacyUploadsDir);
                            const legacyDest = path.join(this.legacyUploadsDir, safeFilename);
                            if (!fs.existsSync(legacyDest)) {
                                fs.copyFileSync(destPath, legacyDest);
                            }
                        } catch (_) { }
                    }
                    clean.message.audio = `/uploads/triggers/${safeFilename}`;
                } catch (e) {
                    console.error(`❌ [TriggerFileSync] Error extrayendo audio embebido (${safeFilename}):`, e.message);
                }
            }

            // 2. Extraer Imagen si está embebida
            if (embedded.image && embedded.image.base64 && embedded.image.filename) {
                const safeFilename = path.basename(embedded.image.filename).replace(/[^a-zA-Z0-9._\-]/g, '_');
                const destPath = path.join(this.uploadsDir, safeFilename);
                try {
                    if (!fs.existsSync(destPath) || fs.statSync(destPath).size === 0) {
                        const buf = Buffer.from(embedded.image.base64, 'base64');
                        const tmpPath = `${destPath}.tmp`;
                        fs.writeFileSync(tmpPath, buf);
                        fs.renameSync(tmpPath, destPath);
                        console.log(`🖼️ [TriggerFileSync] Imagen reconstruida desde el archivo del trigger: ${safeFilename}`);
                    }
                    if (this.legacyUploadsDir !== this.uploadsDir) {
                        try {
                            this._ensureDir(this.legacyUploadsDir);
                            const legacyDest = path.join(this.legacyUploadsDir, safeFilename);
                            if (!fs.existsSync(legacyDest)) {
                                fs.copyFileSync(destPath, legacyDest);
                            }
                        } catch (_) { }
                    }
                    clean.message.image = `/uploads/triggers/${safeFilename}`;
                } catch (e) {
                    console.error(`❌ [TriggerFileSync] Error extrayendo imagen embebida (${safeFilename}):`, e.message);
                }
            }
        }

        return clean;
    }

    /**
     * Guarda o actualiza el archivo individual de un trigger en la carpeta `triggers/`.
     * Si el trigger cambió de nombre, elimina el archivo con el nombre antiguo para no dejar duplicados.
     */
    saveSingleTrigger(trigger, options = {}) {
        if (!trigger || !trigger.id) return false;
        this._ensureDir(this.triggersDir);

        try {
            const targetFilename = this.buildFilename(trigger);
            const targetPath = path.join(this.triggersDir, targetFilename);
            const tempPath = `${targetPath}.tmp`;

            // 1. Buscar y eliminar archivos antiguos del mismo ID si el usuario le cambió el nombre, tipo o tenía nombre personalizado
            const idSuffix = `__${trigger.id}.json`;
            const existingFiles = this._getJsonFilesInTriggersDir();
            for (const file of existingFiles) {
                const cached = this.fileTriggerCache.get(file);
                if (file !== targetFilename && (file.endsWith(idSuffix) || (cached && cached.id === trigger.id))) {
                    this._lockFileInternal(file, 1200);
                    try {
                        fs.unlinkSync(path.join(this.triggersDir, file));
                        this.fileTriggerCache.delete(file);
                    } catch (_) { }
                }
            }

            // 2. Construir payload con media embebida en Base64 (si es Trigger IN con audio/foto)
            const payloadObj = this._buildSerializableTriggerWithMedia(trigger);
            const jsonContent = JSON.stringify(payloadObj, null, 2);

            // 3. Bloquear eco de fs.watch y escribir de forma atómica
            this._lockFileInternal(targetFilename, 1200);
            fs.writeFileSync(tempPath, jsonContent, 'utf8');
            fs.renameSync(tempPath, targetPath);

            // 4. Actualizar caché en memoria de ese archivo
            const cleanCopy = this._extractMediaAndCleanTrigger(payloadObj);
            this.fileTriggerCache.set(targetFilename, cleanCopy);
            this._updateFolderStatHash();

            return true;
        } catch (e) {
            console.error(`❌ [TriggerFileSync] Error guardando archivo individual de trigger (${trigger.name}):`, e.message);
            return false;
        }
    }

    /**
     * Elimina el archivo individual de un trigger de la carpeta `triggers/` cuando se borra desde la UI.
     */
    deleteSingleTrigger(triggerId) {
        if (!triggerId) return false;
        this._ensureDir(this.triggersDir);

        try {
            const idSuffix = `__${triggerId}.json`;
            const files = this._getJsonFilesInTriggersDir();
            let deletedAny = false;

            for (const file of files) {
                let shouldDelete = file.endsWith(idSuffix);
                if (!shouldDelete) {
                    const cached = this.fileTriggerCache.get(file);
                    if (cached && cached.id === triggerId) {
                        shouldDelete = true;
                    }
                }

                if (shouldDelete) {
                    this._lockFileInternal(file, 1200);
                    try {
                        fs.unlinkSync(path.join(this.triggersDir, file));
                        this.fileTriggerCache.delete(file);
                        deletedAny = true;
                    } catch (err) {
                        console.warn(`⚠️ [TriggerFileSync] No se pudo borrar archivo ${file}:`, err.message);
                    }
                }
            }

            this._updateFolderStatHash();
            return deletedAny;
        } catch (e) {
            console.error(`❌ [TriggerFileSync] Error eliminando trigger ${triggerId} de carpeta:`, e.message);
            return false;
        }
    }

    _computeSignature(triggersArray) {
        try {
            return crypto.createHash('sha1').update(JSON.stringify(triggersArray || [])).digest('hex');
        } catch (_) {
            return String(Date.now());
        }
    }

    _updateFolderStatHash() {
        try {
            const files = this._getJsonFilesInTriggersDir().sort();
            const parts = files.map(f => {
                try {
                    const st = fs.statSync(path.join(this.triggersDir, f));
                    return `${f}:${st.size}:${Math.floor(st.mtimeMs)}`;
                } catch (_) {
                    return f;
                }
            });
            this.lastFolderStatHash = parts.join('|');
        } catch (_) { }
    }

    /**
     * Escanea todos los archivos .json en `triggers/`, extrae audios/imágenes embebidos,
     * resuelve colisiones si el usuario duplicó un archivo en Windows (Ctrl+C / Ctrl+V),
     * y retorna la lista consolidada de triggers.
     */
    scanFolderAndSync(options = {}) {
        const files = this._getJsonFilesInTriggersDir();

        // Ordenar poniendo primero los archivos con formato canónico (__id.json) y luego copias manuales
        files.sort((a, b) => {
            const aIsCopy = /copia|copy|\(\d+\)/i.test(a) ? 1 : 0;
            const bIsCopy = /copia|copy|\(\d+\)/i.test(b) ? 1 : 0;
            if (aIsCopy !== bIsCopy) return aIsCopy - bIsCopy;
            return a.localeCompare(b);
        });

        const loadedTriggers = [];
        const seenIds = new Set();
        const currentFilesSet = new Set(files);
        let hadTransientReadError = false;

        for (const file of files) {
            const fullPath = path.join(this.triggersDir, file);
            try {
                const stat = fs.statSync(fullPath);
                if (!stat.isFile()) continue;

                // Murphy #2: Archivo de 0 bytes recién creado por el Explorador de Windows mientras copia
                if (stat.size === 0) {
                    hadTransientReadError = true;
                    if (this.fileTriggerCache.has(file)) {
                        const fallback = this.fileTriggerCache.get(file);
                        if (fallback && fallback.id && !seenIds.has(fallback.id)) {
                            seenIds.add(fallback.id);
                            loadedTriggers.push(fallback);
                        }
                    }
                    continue;
                }

                const rawText = fs.readFileSync(fullPath, 'utf8');
                const parsed = JSON.parse(rawText);

                // Soporte Polimórfico: Si el usuario pegó un archivo que contiene un Array de triggers (ej. un backup completo)
                if (Array.isArray(parsed)) {
                    for (const item of parsed) {
                        if (item && typeof item === 'object' && item.name && item.type) {
                            if (!item.id) item.id = 'tr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
                            const cleanItem = this._extractMediaAndCleanTrigger(item);
                            if (cleanItem && !seenIds.has(cleanItem.id)) {
                                seenIds.add(cleanItem.id);
                                loadedTriggers.push(cleanItem);
                                this.saveSingleTrigger(cleanItem);
                            }
                        }
                    }
                    // Una vez desglosado el pack en archivos individuales, retirar el archivo contenedor si no es un archivo individual
                    if (!file.includes('__tr_')) {
                        this._lockFileInternal(file, 1200);
                        try { fs.unlinkSync(fullPath); } catch (_) { }
                    }
                    continue;
                }

                // Archivo de un único trigger
                if (!parsed || typeof parsed !== 'object' || !parsed.name || !parsed.type) {
                    console.warn(`⚠️ [TriggerFileSync] Archivo ignorado por no tener estructura de trigger válida: ${file}`);
                    continue;
                }

                if (!parsed.id) {
                    parsed.id = 'tr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
                }

                // Murphy #5: ¿El usuario hizo Ctrl+C y Ctrl+V a un archivo en el Explorador de Windows?
                // Entonces dos archivos distintos tendrán el mismo `id`.
                if (seenIds.has(parsed.id)) {
                    const newId = 'tr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
                    parsed.id = newId;
                    if (!/\(Copia\)/i.test(parsed.name)) {
                        parsed.name = `${parsed.name} (Copia)`;
                    }
                    const cleanCopy = this._extractMediaAndCleanTrigger(parsed);
                    seenIds.add(cleanCopy.id);
                    loadedTriggers.push(cleanCopy);

                    // Guardar con su nuevo nombre canónico y borrar el archivo "- copia.json"
                    this.saveSingleTrigger(cleanCopy);
                    if (file !== this.buildFilename(cleanCopy)) {
                        this._lockFileInternal(file, 1200);
                        try { fs.unlinkSync(fullPath); } catch (_) { }
                    }
                    console.log(`✨ [TriggerFileSync] Copia en Explorador detectada y normalizada: ${cleanCopy.name} (${cleanCopy.id})`);
                    continue;
                }

                const cleanTrigger = this._extractMediaAndCleanTrigger(parsed);
                if (cleanTrigger) {
                    seenIds.add(cleanTrigger.id);
                    loadedTriggers.push(cleanTrigger);
                    this.fileTriggerCache.set(file, cleanTrigger);
                }
            } catch (e) {
                // Si el archivo se está copiando en este milisegundo (EBUSY / JSON truncado), programar reintento
                hadTransientReadError = true;
                console.warn(`⏳ [TriggerFileSync] Lectura diferida en ${file} (posible copia en curso): ${e.message}`);
                if (this.fileTriggerCache.has(file)) {
                    const prev = this.fileTriggerCache.get(file);
                    if (prev && prev.id && !seenIds.has(prev.id)) {
                        seenIds.add(prev.id);
                        loadedTriggers.push(prev);
                    }
                }
            }
        }

        // Limpiar del cache de archivos aquellos que ya fueron eliminados de la carpeta
        for (const cachedFile of this.fileTriggerCache.keys()) {
            if (!currentFilesSet.has(cachedFile)) {
                this.fileTriggerCache.delete(cachedFile);
            }
        }

        if (hadTransientReadError && this.retryCount < 4) {
            this.retryCount++;
            clearTimeout(this.retryTimer);
            this.retryTimer = setTimeout(() => {
                this._handleWatcherTrigger();
            }, 350 * this.retryCount);
        } else {
            this.retryCount = 0;
        }

        this.lastCatalogSignature = this._computeSignature(loadedTriggers);
        this._updateFolderStatHash();
        return loadedTriggers;
    }

    _handleWatcherTrigger() {
        const updatedTriggers = this.scanFolderAndSync();
        if (this.onExternalChange) {
            try {
                this.onExternalChange(updatedTriggers);
            } catch (e) {
                console.error('❌ [TriggerFileSync] Error en callback onExternalChange:', e.message);
            }
        }
    }

    /**
     * Inicia el watcher en caliente (fs.watch) con Debounce de 450ms y filtro anti-eco.
     */
    startWatcher() {
        this._ensureDir(this.triggersDir);
        if (this.watcher) {
            try { this.watcher.close(); } catch (_) { }
            this.watcher = null;
        }

        try {
            this.watcher = fs.watch(this.triggersDir, { persistent: false }, (eventType, filename) => {
                if (filename) {
                    const cleanName = String(filename);
                    // Ignorar archivos temporales (.tmp) o ocultos
                    if (cleanName.endsWith('.tmp') || cleanName.startsWith('.')) return;
                    // Ignorar si el cambio fue originado por el propio servidor hace < 1.2s
                    if (this._isFileLockedInternally(cleanName)) return;
                }

                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    const prevSig = this.lastCatalogSignature;
                    const updatedTriggers = this.scanFolderAndSync();
                    const newSig = this.lastCatalogSignature;

                    if (newSig !== prevSig && this.onExternalChange) {
                        console.log(`🔄 [TriggerFileSync] Cambio en vivo detectado en carpeta triggers/ (${updatedTriggers.length} activos). Sincronizando clientes...`);
                        this.onExternalChange(updatedTriggers);
                    }
                }, 450);
            });

            this.watcher.on('error', (err) => {
                console.warn('⚠️ [TriggerFileSync] Watcher reiniciándose tras evento de sistema:', err.message);
                setTimeout(() => this.startWatcher(), 2000);
            });
        } catch (e) {
            console.error('❌ [TriggerFileSync] No se pudo iniciar fs.watch en triggers/:', e.message);
        }
    }

    /**
     * Comprobación ultrarrápida (< 1ms) llamada al abrir el panel de Triggers o hacer clic en la carpeta,
     * como red de seguridad por si el SO omitió algún evento de fs.watch.
     */
    checkSyncIfNeeded() {
        try {
            const prevStatHash = this.lastFolderStatHash;
            this._updateFolderStatHash();
            if (prevStatHash !== this.lastFolderStatHash) {
                const prevSig = this.lastCatalogSignature;
                const updated = this.scanFolderAndSync();
                if (this.lastCatalogSignature !== prevSig && this.onExternalChange) {
                    this.onExternalChange(updated);
                }
                return updated;
            }
        } catch (_) { }
        return null;
    }

    /**
     * Abre la carpeta `triggers/` en el Explorador de Archivos nativo del sistema operativo
     * (Windows Explorer, macOS Finder o Linux file manager).
     */
    openTriggersFolder(callback) {
        try {
            this._ensureDir(this.triggersDir);
            this.checkSyncIfNeeded();

            const targetDir = path.resolve(this.triggersDir);
            const platform = process.platform;

            if (platform === 'win32') {
                // En Windows, explorer.exe devuelve exit code 1 aunque abra la ventana con éxito
                execFile('explorer.exe', [targetDir], { windowsHide: false }, () => {
                    if (typeof callback === 'function') callback({ success: true, path: targetDir });
                });
            } else if (platform === 'darwin') {
                execFile('open', [targetDir], (err) => {
                    if (typeof callback === 'function') callback({ success: !err, path: targetDir });
                });
            } else {
                execFile('xdg-open', [targetDir], (err) => {
                    if (typeof callback === 'function') callback({ success: !err, path: targetDir });
                });
            }
        } catch (e) {
            console.error('❌ [TriggerFileSync] Error abriendo carpeta de triggers:', e.message);
            if (typeof callback === 'function') callback({ success: false, error: e.message });
        }
    }
}

module.exports = new TriggerFileSync();
