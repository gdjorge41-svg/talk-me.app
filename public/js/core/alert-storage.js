const STORAGE_KEY_PREFIX = 'talkme_alerts_';
const MASTER_ALERTS_KEY = 'talkme_master_alerts';

export function getCurrentUserId() {
    return (window.currentUsername || window.currentUser || 'guest').toString();
}

export function loadAlertsForUser(userId = null) {
    const uid = userId || getCurrentUserId();
    try {
        const raw = localStorage.getItem(STORAGE_KEY_PREFIX + uid);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.warn('Error parsing alerts for user', uid, e);
        return {};
    }
}

export function saveAlertsForUser(data = {}, userId = null) {
    const uid = userId || getCurrentUserId();
    try {
        localStorage.setItem(STORAGE_KEY_PREFIX + uid, JSON.stringify(data));
        
        // --- 🚀 NEW: Auto-sync with server (Background) ---
        if (uid !== 'guest') {
            postAlertsToServer(data, uid);
        }
        
        return true;
    } catch (e) {
        console.error('Error saving alerts for user', uid, e);
        return false;
    }
}

// --- Remote API helpers (async). These are best-effort: fall back to localStorage on failure.
export async function fetchAlertsFromServer(userId = null) {
    const uid = userId || getCurrentUserId();
    try {
        const resp = await fetch(`/api/alerts/${encodeURIComponent(uid)}`, { credentials: 'same-origin' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (json && json.ok && json.data) return json.data;
        return null;
    } catch (e) {
        // network error or server not available
        return null;
    }
}

export async function postAlertsToServer(data = {}, userId = null) {
    const uid = userId || getCurrentUserId();
    try {
        const resp = await fetch(`/api/alerts/${encodeURIComponent(uid)}`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        return json && json.ok;
    } catch (e) {
        return false;
    }
}

export function getAlert(userId, type) {
    const all = loadAlertsForUser(userId);
    if (all[type]) return all[type];

    // --- 🚨 Fallback al Master si el usuario no tiene nada custom ---
    try {
        const masterRaw = localStorage.getItem(MASTER_ALERTS_KEY);
        if (masterRaw) {
            const masterData = JSON.parse(masterRaw);
            if (masterData[type]) return masterData[type];
        }
    } catch (e) {}

    return null;
}

export function saveMasterAlertsLocally(data) {
    if (!data) return;
    try {
        const existing = JSON.parse(localStorage.getItem(MASTER_ALERTS_KEY) || '{}');
        const merged = { ...existing, ...data };
        localStorage.setItem(MASTER_ALERTS_KEY, JSON.stringify(merged));
        return true;
    } catch (e) { return false; }
}

export function setAlert(userId, type, payload) {
    const uid = userId || getCurrentUserId();
    const all = loadAlertsForUser(uid);
    all[type] = payload;
    return saveAlertsForUser(all, uid);
}

/**
 * 🔄 Sincronización Inicial: Intenta descargar las alertas del servidor y actualiza la caché local.
 */
export async function syncAlertsFromServer(userId = null) {
    const uid = userId || getCurrentUserId();
    if (uid === 'guest') return;

    const serverData = await fetchAlertsFromServer(uid);
    if (serverData) {
        const localData = loadAlertsForUser(uid);
        // Merge simple: el servidor manda si hay conflicto, pero preservamos lo que haya localmente si el servidor está vacío
        const merged = { ...localData, ...serverData };
        localStorage.setItem(STORAGE_KEY_PREFIX + uid, JSON.stringify(merged));
        return merged;
    }
    return null;
}

/**
 * 🚜 Migración de Huésped a Usuario: Transfiere las alertas guardadas como 'guest'
 * al nuevo ID de usuario identificado para no perder el trabajo realizado.
 */
export function migrateGuestAlerts(newUserId) {
    if (!newUserId || newUserId === 'guest') return;
    
    const guestData = localStorage.getItem(STORAGE_KEY_PREFIX + 'guest');
    if (!guestData) return;

    try {
        const userData = localStorage.getItem(STORAGE_KEY_PREFIX + newUserId);
        // Solo migramos si el usuario no tiene datos previos (para no sobreescribir)
        // O si los datos actuales son mínimos.
        if (!userData || userData === '{}') {
            localStorage.setItem(STORAGE_KEY_PREFIX + newUserId, guestData);
            
            // Subir inmediatamente al servidor
            const parsed = JSON.parse(guestData);
            postAlertsToServer(parsed, newUserId);
        }
        // Limpiar datos de guest para evitar migraciones duplicadas
        localStorage.removeItem(STORAGE_KEY_PREFIX + 'guest');
    } catch (e) {
        console.warn('Error en migración de alertas guest', e);
    }
}
// --- 🔗 PUENTES GLOBALES (v60) ---
window.syncAlertsFromServer = syncAlertsFromServer;
window.saveMasterAlertsLocally = saveMasterAlertsLocally;
window.getAlert = getAlert;
window.setAlert = setAlert;
