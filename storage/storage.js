const fs = require('fs');
const path = require('path');

// Límite de tamaño máximo para copia síncrona de plantillas para evitar bloquear el Event Loop (ej: 5 MB)
const MAX_COPY_SIZE = 5 * 1024 * 1024; 

/**
 * Resuelve una ruta escribible y persistente en el sistema operativo.
 * Si se encuentra dentro del entorno de Electron, desvía la ruta hacia USER_DATA_PATH.
 * Si el archivo no existe en el destino pero existe una plantilla en la app base (app.asar),
 * la copia automáticamente para inicializar los datos sin romper configuraciones base.
 */
function resolveWritablePath(originalPath) {
    const userDataPath = process.env.USER_DATA_PATH;
    if (!userDataPath) {
        return path.resolve(originalPath);
    }
    
    const absolutePath = path.resolve(originalPath);
    const projectRoot = path.resolve(path.join(__dirname, '..'));
    
    // Si la ruta solicitada está fuera del proyecto, no la alteramos (insensible a mayúsculas/minúsculas en Windows)
    const isWindows = process.platform === 'win32';
    const absCompare = isWindows ? absolutePath.toLowerCase() : absolutePath;
    const rootCompare = isWindows ? projectRoot.toLowerCase() : projectRoot;
    
    if (!absCompare.startsWith(rootCompare)) {
        return absolutePath;
    }
    
    // Obtener la subestructura relativa exacta respecto a la raíz del proyecto para conservar subcarpetas
    const relativePath = path.relative(projectRoot, absolutePath);
    const targetPath = path.join(userDataPath, relativePath);
    const targetDir = path.dirname(targetPath);
    
    // Crear recursivamente los subdirectorios en AppData si no existen
    try {
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
    } catch (e) {
        console.error(`[Storage] Error crítico creando directorio seguro: ${targetDir}`, e);
        return absolutePath; // Fallback defensivo al original
    }
    
    // Si el archivo no existe en AppData, pero sí en la app base (app.asar), lo clonamos si no es muy grande
    if (!fs.existsSync(targetPath) && fs.existsSync(absolutePath)) {
        try {
            const stats = fs.statSync(absolutePath);
            if (stats.isFile()) {
                if (stats.size <= MAX_COPY_SIZE) {
                    fs.copyFileSync(absolutePath, targetPath);
                } else {
                    console.warn(`[Storage] Archivo omitido por exceder límite de copia síncrona: ${absolutePath} (${stats.size} bytes).`);
                }
            } else if (stats.isDirectory()) {
                fs.mkdirSync(targetPath, { recursive: true });
            }
        } catch (e) {
            console.error(`[Storage] Imposible copiar plantilla base: ${absolutePath} -> ${targetPath}`, e);
        }
    }
    
    return targetPath;
}

/**
 * Lee de forma segura un JSON. Aplica fallback bidireccional si no puede leer de la ruta redirigida.
 */
function readJSON(filePath) {
    const resolvedPath = resolveWritablePath(filePath);
    try {
        if (fs.existsSync(resolvedPath)) {
            return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
        }
    } catch (e) {
        console.warn(`[Storage] Fallo de lectura en ruta redirigida: ${resolvedPath}. Intentando fallback.`, e.message);
    }

    // Fallback de Lectura de Emergencia (Directo desde app.asar si la ruta redirigida falló o no existe)
    try {
        if (filePath !== resolvedPath && fs.existsSync(filePath)) {
            console.log(`[Storage] Cargando plantilla original de solo lectura: ${filePath}`);
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.error(`[Storage] Fallo absoluto cargando plantilla base: ${filePath}`, e.message);
    }
    
    return null;
}

/**
 * Escribe sincrónicamente usando el patrón Atómico con seguridad contra fallos de escritura de disco.
 */
function writeJSON(filePath, data) {
    const resolvedPath = resolveWritablePath(filePath);
    const tempPath = `${resolvedPath}.tmp`;
    try {
        fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
        fs.renameSync(tempPath, resolvedPath);
        return true;
    } catch (e) {
        console.error(`[Storage] Imposible persistir atómicamente en ruta: ${resolvedPath}`, e.message);
        try {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        } catch (unlinkErr) {
            // Ignorar fallos secundarios al borrar el temporal
        }
        return false;
    }
}

module.exports = { readJSON, writeJSON, resolveWritablePath };
