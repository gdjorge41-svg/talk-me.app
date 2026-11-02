const fs = require('fs');
const path = require('path');
const axios = require('axios');
const storage = require('../storage/storage');

const TELEMETRY_PATH = path.join(__dirname, '..', 'storage', 'telemetry-queue.json');

/**
 * Registra o actualiza la telemetría en disco de forma silenciosa.
 * Este método se llama periódicamente para no perder datos en caso de apagón.
 */
function logTelemetry(hwId, sessionId, stats) {
    // Robust handling for 2-argument call
    if (stats === undefined && typeof sessionId === 'object' && sessionId !== null) {
        stats = sessionId;
        sessionId = stats.sessionId || Date.now();
    }
    
    let activeEmail = 'offline_anon';
    try {
        const { validateOfflineToken } = require('./license-manager');
        const offlineCheck = validateOfflineToken(hwId);
        if (offlineCheck && offlineCheck.success && offlineCheck.email) {
            activeEmail = offlineCheck.email.toLowerCase().trim();
        }
    } catch (e) {
        // Safe fallback if license-manager is not yet ready or in error
    }

    let queue = [];
    
    // Ensure storage directory exists
    const dir = path.dirname(TELEMETRY_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    queue = storage.readJSON(TELEMETRY_PATH) || [];
    if (!Array.isArray(queue)) queue = [];

    // Buscar si la sesión ya existe en el historial local
    let sessionIndex = queue.findIndex(s => s.sessionId === sessionId);
    
    if (sessionIndex === -1) {
        // Nueva sesión
        queue.push({
            sessionId: sessionId,
            user_email: activeEmail,
            timestamp_formatted: new Date(sessionId).toLocaleString(),
            duration_mins: stats.duration_mins || 0,
            msg_count: stats.msg_count || 0,
            text_msg_count: stats.text_msg_count || 0,
            audio_msg_count: stats.audio_msg_count || 0,
            trigger_count: stats.trigger_count || 0,
            users_connected: stats.users_connected || 0,
            categories_used: stats.categories_used || 0,
            photos_taken: stats.photos_taken || 0,
            languages: Array.isArray(stats.languages) ? stats.languages : Array.from(stats.languages || []),
            translations_used: Array.isArray(stats.translations_used) ? stats.translations_used : Array.from(stats.translations_used || []),
            subusers_connected: stats.subusers_connected || 0,
            filters_used: stats.filters_used || 0,
            hermes_msg_count: stats.hermes_msg_count || 0,
            synced: false
        });
    } else {
        // Actualizar sesión existente con los valores más altos
        let s = queue[sessionIndex];
        if (!s.user_email || s.user_email === 'offline_anon') {
            s.user_email = activeEmail;
        }
        s.duration_mins = Math.max(s.duration_mins, stats.duration_mins || 0);
        s.msg_count = Math.max(s.msg_count, stats.msg_count || 0);
        s.text_msg_count = Math.max(s.text_msg_count || 0, stats.text_msg_count || 0);
        s.audio_msg_count = Math.max(s.audio_msg_count || 0, stats.audio_msg_count || 0);
        s.trigger_count = Math.max(s.trigger_count, stats.trigger_count || 0);
        s.users_connected = Math.max(s.users_connected, stats.users_connected || 0);
        s.categories_used = Math.max(s.categories_used, stats.categories_used || 0);
        s.photos_taken = Math.max(s.photos_taken || 0, stats.photos_taken || 0);
        s.subusers_connected = Math.max(s.subusers_connected || 0, stats.subusers_connected || 0);
        s.filters_used = Math.max(s.filters_used || 0, stats.filters_used || 0);
        s.hermes_msg_count = Math.max(s.hermes_msg_count || 0, stats.hermes_msg_count || 0);

        if (!s.languages) s.languages = [];
        if (!s.translations_used) s.translations_used = [];

        const incomingLangs = Array.isArray(stats.languages) ? stats.languages : Array.from(stats.languages || []);
        incomingLangs.forEach(l => {
            if (!s.languages.includes(l)) s.languages.push(l);
        });

        const incomingTrans = Array.isArray(stats.translations_used) ? stats.translations_used : Array.from(stats.translations_used || []);
        incomingTrans.forEach(t => {
            if (!s.translations_used.includes(t)) s.translations_used.push(t);
        });
    }

    storage.writeJSON(TELEMETRY_PATH, queue);
}

/**
 * Intenta subir todos los datos encolados cuando hay conexión.
 */
async function syncTelemetryQueue(hwId, apiUrl, apiSecretKey) {
    if (!fs.existsSync(TELEMETRY_PATH)) return;

    let queue = storage.readJSON(TELEMETRY_PATH);
    if (!Array.isArray(queue)) return;

    const pendingSessions = queue.filter(s => !s.synced);
    if (pendingSessions.length === 0) return;

    // Intentar obtener la ubicación por IP
    let locationData = "Ubicación Offline (Desconocida)";
    try {
        const geoRes = await axios.get('http://ip-api.com/json/', { timeout: 3000 });
        if (geoRes.data && geoRes.data.status === 'success') {
            locationData = `${geoRes.data.city}, ${geoRes.data.country}`;
        }
    } catch (e) {
        // Silencioso por política de telemetría en segundo plano
    }

    const axiosConfig = {
        headers: { 
            'X-API-KEY': apiSecretKey,
            'Content-Type': 'application/json' 
        },
        timeout: 8000
    };

    const successfullySyncedSessionIds = new Set();

    for (const stats of pendingSessions) {
        const d = new Date(stats.sessionId);
        const pad = (n) => n.toString().padStart(2, '0');
        const localCreatedAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

        const payload = {
            hw_id: hwId,
            created_at: localCreatedAt,
            stats: {
                duration: stats.duration_mins,
                messages: stats.msg_count,
                triggers: stats.trigger_count,
                details: {
                    users_connected: stats.users_connected,
                    categories_used: stats.categories_used,
                    photos_taken: stats.photos_taken || 0,
                    location: locationData,
                    session_date: new Date(stats.sessionId).toISOString().split('T')[0],
                    languages: stats.languages || [],
                    translations_used: stats.translations_used || [],
                    subusers_connected: stats.subusers_connected || 0,
                    filters_used: stats.filters_used || 0,
                    hermes_msg_count: stats.hermes_msg_count || 0,
                    text_msg_count: stats.text_msg_count || 0,
                    audio_msg_count: stats.audio_msg_count || 0
                }
            }
        };

        try {
            const res = await axios.post(`${apiUrl}?action=save_log`, payload, axiosConfig);
            if (res.data.success) {
                successfullySyncedSessionIds.add(stats.sessionId);
            }
        } catch (e) {
            // Silencioso por política de telemetría en segundo plano
        }
    }

    // Re-leer el archivo de telemetría del disco de forma segura para no pisar escrituras concurrentes
    let freshQueue = storage.readJSON(TELEMETRY_PATH);
    if (!Array.isArray(freshQueue)) freshQueue = [];

    // Marcar como sincronizados únicamente los que se subieron con éxito en esta tanda
    for (const sessionId of successfullySyncedSessionIds) {
        const idx = freshQueue.findIndex(s => s.sessionId === sessionId);
        if (idx !== -1) {
            freshQueue[idx].synced = true;
            freshQueue[idx].synced_at = new Date().toISOString();
        }
    }

    // Limitar a las últimas 100 sesiones para no crecer indefinidamente (FIFO)
    const MAX_LOCAL_HISTORY = 100;
    if (freshQueue.length > MAX_LOCAL_HISTORY) {
        // Ordenar por sessionId (timestamp) más reciente primero y recortar
        freshQueue.sort((a, b) => b.sessionId - a.sessionId);
        freshQueue = freshQueue.slice(0, MAX_LOCAL_HISTORY);
    }

    // Guardar el historial actualizado (nunca borramos el archivo)
    storage.writeJSON(TELEMETRY_PATH, freshQueue);
}

module.exports = {
    logTelemetry,
    syncTelemetryQueue
};
