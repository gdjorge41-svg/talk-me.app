const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const { generateHardwareFingerprint } = require('./mac-fingerprint');
const { generateOfflineToken, validateOfflineToken } = require('./license-manager');
const { logTelemetry, syncTelemetryQueue } = require('./telemetry-manager');
const https = require('https');
const http = require('http');
const { URL } = require('url');


const app = express();

// Middleware para verificar la validez del Sello Offline en endpoints sensibles
function requireActiveLicense(req, res, next) {
    const hwId = generateHardwareFingerprint();
    const offlineCheck = validateOfflineToken(hwId);
    if (offlineCheck.success) {
        next();
    } else {
        console.error("❌ Acceso bloqueado: Sello Offline no válido o inexistente.");
        res.status(403).json({ success: false, error: "El sistema no está activado. Por favor, valida tu licencia." });
    }
}

const BASE_MODELS_URL = 'https://www.talk-me.app/models/v1';

const MODELS_CONFIG = {
    'es': { type: 'zip', folder: 'vosk-model-small-es-0.42', url: `${BASE_MODELS_URL}/vosk-model-small-es-0.42.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-es-0.42.zip', size: '40 MB' },
    'en': { type: 'zip', folder: 'vosk-model-small-en-us-0.15', url: `${BASE_MODELS_URL}/vosk-model-small-en-us-0.15.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-en-us-0.15.zip', size: '40 MB' },
    'eu': { type: 'bin', file: 'ggml-base-eu.bin', url: `${BASE_MODELS_URL}/ggml-base-eu.bin`, fallbackUrl: 'https://talk-me.app/models/v1/ggml-base-eu.bin', size: '140 MB' },
    'de': { type: 'zip', folder: 'vosk-model-small-de-0.15', url: `${BASE_MODELS_URL}/vosk-model-small-de-0.15.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-de-0.15.zip', size: '40 MB' },
    'fr': { type: 'zip', folder: 'vosk-model-small-fr-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-fr-0.22.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-fr-0.22.zip', size: '40 MB' },
    'it': { type: 'zip', folder: 'vosk-model-small-it-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-it-0.22.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-it-0.22.zip', size: '40 MB' },
    'ja': { type: 'zip', folder: 'vosk-model-small-ja-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-ja-0.22.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-ja-0.22.zip', size: '40 MB' },
    'pt': { type: 'zip', folder: 'vosk-model-small-pt-0.3', url: `${BASE_MODELS_URL}/vosk-model-small-pt-0.3.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-pt-0.3.zip', size: '40 MB' },
    'ru': { type: 'zip', folder: 'vosk-model-small-ru-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-ru-0.22.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-ru-0.22.zip', size: '40 MB' },
    'zh': { type: 'zip', folder: 'vosk-model-small-cn-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-cn-0.22.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-cn-0.22.zip', size: '40 MB' },
    'tr': { type: 'zip', folder: 'vosk-model-small-tr-0.3', url: `${BASE_MODELS_URL}/vosk-model-small-tr-0.3.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-tr-0.3.zip', size: '40 MB' },
    'ca': { type: 'zip', folder: 'vosk-model-small-ca-0.4', url: `${BASE_MODELS_URL}/vosk-model-small-ca-0.4.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-ca-0.4.zip', size: '40 MB' },
    'ar': { type: 'zip', folder: 'vosk-model-small-ar-0.3', url: `${BASE_MODELS_URL}/vosk-model-small-ar-0.3.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-ar-0.3.zip', size: '40 MB' },
    'fa': { type: 'zip', folder: 'vosk-model-small-fa-0.4', url: `${BASE_MODELS_URL}/vosk-model-small-fa-0.4.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-fa-0.4.zip', size: '40 MB' },
    'uk': { type: 'zip', folder: 'vosk-model-small-uk-v3-nano', url: `${BASE_MODELS_URL}/vosk-model-small-uk-v3-nano.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-uk-v3-nano.zip', size: '40 MB' },
    'sv': { type: 'zip', folder: 'vosk-model-small-sv-rhasspy-0.15', url: `${BASE_MODELS_URL}/vosk-model-small-sv-rhasspy-0.15.zip`, fallbackUrl: 'http://talk-me.app/models/v1/models/vosk-model-small-sv-rhasspy-0.15.zip', size: '40 MB' },
    'vi': { type: 'zip', folder: 'vosk-model-small-vn-0.4', url: `${BASE_MODELS_URL}/vosk-model-small-vn-0.4.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-vn-0.4.zip', size: '40 MB' },
    'ko': { type: 'zip', folder: 'vosk-model-small-ko-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-ko-0.22.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-ko-0.22.zip', size: '40 MB' },
    'nl': { type: 'zip', folder: 'vosk-model-small-nl-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-nl-0.22.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-nl-0.22.zip', size: '40 MB' },
    'uz': { type: 'zip', folder: 'vosk-model-small-uz-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-uz-0.22.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-uz-0.22.zip', size: '40 MB' },
    'kk': { type: 'zip', folder: 'vosk-model-small-kz-0.42', url: `${BASE_MODELS_URL}/vosk-model-small-kz-0.42.zip`, fallbackUrl: 'http://talk-me.app/models/v1/models/vosk-model-small-kz-0.42.zip', size: '40 MB' },
    'pl': { type: 'zip', folder: 'vosk-model-small-pl-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-pl-0.22.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-pl-0.22.zip', size: '40 MB' },
    'gl': { type: 'bin', file: 'ggml-base-gl.bin', url: `${BASE_MODELS_URL}/ggml-base-gl.bin`, fallbackUrl: 'https://talk-me.app/models/v1/ggml-base-gl.bin', size: '140 MB' },
    'eo': { type: 'zip', folder: 'vosk-model-small-eo-0.42', url: `${BASE_MODELS_URL}/vosk-model-small-eo-0.42.zip`, fallbackUrl: 'http://talk-me.app/models/v1/vosk-model-small-eo-0.42.zip', size: '40 MB' }
    ,
    'translate': { type: 'zip', folder: 'translate/madlad400-3b-int8', url: `${BASE_MODELS_URL}/madlad400-3b-int8.zip`, fallbackUrl: 'http://talk-me.app/models/v1/madlad400-3b-int8.zip', size: '2.75 GB' }
};

app.use(cors());
app.use(express.json());

// Servir la nueva página launch.html como ruta principal
app.get('/', (req, res) => {
    if (req.query.success === 'true') {
        const sessionId = req.query.session_id || '';
        console.log(`💸 Stripe payment success query intercepted in Launcher. Redirecting to production secure portal: https://www.talk-me.app/pre-launch/success.html`);
        return res.redirect(`https://www.talk-me.app/pre-launch/success.html?success=true&session_id=${sessionId}`);
    }
    res.sendFile(path.join(__dirname, 'public', 'launch.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la API
const API_URL = 'https://www.talk-me.app/talkme_api.php';
const API_SECRET_KEY = 'HERMES_CADUCEUS_V70_ELITE_PRO';

const axiosConfig = {
    headers: {
        'X-API-KEY': API_SECRET_KEY,
        'Content-Type': 'application/json'
    },
    timeout: 8000
};

// --- CONFIGURACIÓN DE VERSIÓN DEL CLIENTE ---
const CLIENT_VERSION = 1;
const CLIENT_VERSION_NAME = 'v1.0.0';


// --- CACHÉ DE PRECIOS Y VERSIONES (STALE-WHILE-REVALIDATE) ---

function resolvePrelaunchWritablePath(filename) {
    if (process.env.USER_DATA_PATH) {
        const targetDir = path.join(process.env.USER_DATA_PATH, 'pre-launch');
        try {
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
            return path.join(targetDir, filename);
        } catch (_) {}
    }
    return path.join(__dirname, filename);
}

const PRICING_CACHE_PATH = resolvePrelaunchWritablePath('cache_licenses_master.json');

const DEFAULT_PRICING_PAYLOAD = {
    success: true,
    source: 'embedded_fallback',
    kernel_version: '1.0.0',
    currency: 'EUR',
    plans: {
        freelance: {
            name: 'Talk.me Freelance',
            device_limit: 1,
            one_time_net: 139.89,
            rto_monthly_net: 9.99,
            rto_payments: 14,
            rto_total_net: 139.86
        },
        enterprise: {
            name: 'Talk.me Enterprise',
            device_limit: 5,
            one_time_net: 698.60,
            rto_monthly_net: 49.90,
            rto_payments: 14,
            rto_total_net: 698.60
        }
    },
    latest_release: {
        version: 'v1.0.0',
        major_channel: 1,
        release_date: '2026-09-01',
        download_url: 'https://www.talk-me.app/download/v1.0.0/TalkMe_Setup.exe'
    },
    upgrade_promo: {
        promo_code: 'FIDELIDAD50',
        discount_percent: 50,
        description: '50% de descuento en el paso a la nueva generación para usuarios con licencia previa'
    }
};

app.get('/api/pricing-channel', async (req, res) => {
    try {
        const response = await axios.get(`${API_URL}?action=get_pricing`, {
            ...axiosConfig,
            timeout: 3500
        });

        if (response.data && response.data.success) {
            try {
                fs.writeFileSync(PRICING_CACHE_PATH, JSON.stringify(response.data, null, 2), 'utf8');
            } catch (e) {
                console.warn("⚠️ No se pudo guardar cache_licenses_master.json:", e.message);
            }
            return res.json({ ...response.data, source: 'network' });
        }
    } catch (err) {
        console.warn("⚠️ [PRICING] No se pudo consultar API remota:", err.message);
    }

    // Fallback 1: Caché en disco
    if (fs.existsSync(PRICING_CACHE_PATH)) {
        try {
            const cached = JSON.parse(fs.readFileSync(PRICING_CACHE_PATH, 'utf8'));
            return res.json({ ...cached, source: 'disk_cache' });
        } catch (e) {
            console.warn("⚠️ Error leyendo cache_licenses_master.json:", e.message);
        }
    }

    // Fallback 2: Payload incrustado seguro
    return res.json({ ...DEFAULT_PRICING_PAYLOAD, source: 'default_fallback' });
});

// Endpoint proxy defensivo para obtener los términos de registro (Patrón Murphy Offline-First)
app.get('/api/terms-registro', async (req, res) => {
    // 1. Intento primario remoto con timeout estricto y anti-caché
    try {
        console.log("📄 [PROXY] Intentando cargar términos de registro desde talk-me.app...");
        const response = await axios.get(`https://www.talk-me.app/locales/terms/terms-registro.html?_t=${Date.now()}`, {
            timeout: 3500,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        if (response.data && typeof response.data === 'string' && response.data.trim().length > 100) {
            res.setHeader('X-Terms-Source', 'remote-ftp');
            return res.send(response.data);
        }
    } catch (error) {
        console.warn("⚠️ [PROXY] No se pudo obtener términos remotos (" + error.message + "). Activando fallback local defensivo...");
    }

    // 2. Red de Seguridad (Fallback Local Incondicional): Leer archivo empaquetado de serie
    try {
        const localTermsPath = path.join(__dirname, 'public', 'terms-registro.html');
        if (fs.existsSync(localTermsPath)) {
            const localHtml = await fs.promises.readFile(localTermsPath, 'utf8');
            res.setHeader('X-Terms-Source', 'local-disk-fallback');
            return res.send(localHtml);
        }
    } catch (fsErr) {
        console.error("❌ Error leyendo fallback local terms-registro.html:", fsErr.message);
    }

    // 3. Fusible de Emergencia (Garantizar que jamás devuelva 500 bloqueante)
    res.setHeader('X-Terms-Source', 'emergency-stub');
    res.send('<div lang="es" class="terms-lang"><h3>TÉRMINOS DE SERVICIO</h3><p>Plataforma local soberana Talk-me. Consulte el manual de usuario o documentación física.</p></div>');
});

// 1. Registro de Usuario (API Real)
app.post('/api/register', async (req, res) => {
    try {
        const { first_name, last_name, company_name, email, password, lang } = req.body;
        console.log(`🌐 [API REAL] Registrando usuario: ${email} con idioma: ${lang}`);
        const response = await axios.post(`${API_URL}?action=register`, {
            first_name, last_name, company_name, email, password, lang
        }, axiosConfig);
        res.status(response.data.success ? 200 : 400).json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Error conectando con Aruba MySQL." });
    }
});

// Endpoint de Stripe Success para capturar y asociar la última licencia activa
app.post('/api/stripe-success', async (req, res) => {
    const { session_id, user_id, email } = req.body;
    try {
        console.log(`💳 [STRIPE SUCCESS] Solicitando licencia para sesión ${session_id}, usuario ${user_id}, email ${email}`);

        // Consultar a la API central para buscar la última licencia activa o trial para este usuario
        const response = await axios.post(`${API_URL}?action=get_latest_license`, {
            user_id: user_id,
            email: email
        }, axiosConfig);

        if (response.data.success) {
            res.json({
                success: true,
                license_key: response.data.license_key
            });
        } else {
            res.status(400).json({ success: false, error: response.data.error || "No se encontró licencia activa." });
        }
    } catch (error) {
        console.error("❌ Error verificando compra en Stripe:", error.message);
        res.status(500).json({ success: false, error: "Error de red buscando licencia activa." });
    }
});

// 2. Login (API Real o Fallback Offline)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`🌐 [API REAL] Login de usuario: ${email}`);
        const response = await axios.post(`${API_URL}?action=login`, { email, password }, axiosConfig);

        if (response.data.success) {
            const currentHwId = generateHardwareFingerprint();
            syncTelemetryQueue(currentHwId, API_URL, API_SECRET_KEY);
        }

        res.status(response.data.success ? 200 : 401).json(response.data);
    } catch (error) {
        console.warn(`⚠️ Error conectando con Aruba MySQL. Buscando Sello Offline para ${req.body.email}...`);

        // Auto-Login OFFLINE
        const currentHwId = generateHardwareFingerprint();
        const offlineCheck = validateOfflineToken(currentHwId);

        if (offlineCheck.success) {
            if (offlineCheck.email.toLowerCase().trim() === req.body.email.toLowerCase().trim()) {
                console.log(`✅ [LOGIN OFFLINE OK] Bienvenido de vuelta, ${offlineCheck.email}`);
                let formattedExp = offlineCheck.expirationDate;
                if (formattedExp) {
                    const d = new Date(formattedExp);
                    if (!isNaN(d.getTime())) {
                        formattedExp = d.toLocaleDateString('es-ES', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        });
                    }
                }
                return res.status(200).json({
                    success: true,
                    user: { email: offlineCheck.email, id: offlineCheck.userId },
                    license_key: offlineCheck.licenseKey,
                    mode: 'OFFLINE',
                    warningCode: offlineCheck.warningCode,
                    strikesUsed: offlineCheck.strikesUsed,
                    expiration_date: formattedExp
                });
            } else {
                return res.status(403).json({ error: "El Sello Offline pertenece a otro usuario." });
            }
        }

        res.status(500).json({ error: `Fallo Offline: ${offlineCheck.error}` });
    }
});

let lastPendingCheckout = null;

app.post('/api/create-checkout-session', async (req, res) => {
    let { userId, userEmail, planType, paymentMode, lang, origin } = req.body;

    lastPendingCheckout = {
        userId: userId || 0,
        userEmail: userEmail || '',
        lang: lang || 'es',
        timestamp: Date.now()
    };

    try {
        if (!userId && userEmail) {
            try {
                const response = await axios.post(`${API_URL}?action=get_latest_license`, { email: userEmail }, axiosConfig);
                if (response.data && response.data.user_id) {
                    userId = response.data.user_id;
                    lastPendingCheckout.userId = userId;
                }
            } catch (e) {
                console.warn(`⚠️ No se pudo resolver userId por email para ${userEmail}`);
            }
        }

        const targetOrigin = (origin && !origin.includes('localhost')) ? origin : 'https://www.talk-me.app';
        console.log(`💳 Redirigiendo compra a Aruba checkout para: ${userEmail} (userId: ${userId || 0}, lang: ${lang}, origin: ${targetOrigin})`);

        const arubaCheckoutUrl = `https://www.talk-me.app/checkout.php?user_id=${userId || 0}&plan=${planType}&mode=${paymentMode}&email=${encodeURIComponent(userEmail || '')}&lang=${lang || 'es'}&origin=${encodeURIComponent(targetOrigin)}`;

        res.json({ url: arubaCheckoutUrl });
    } catch (error) {
        console.error("❌ Error redirigiendo a pasarela:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/verify-checkout-session', async (req, res) => {
    let { session_id, user_id, email } = req.body;

    if ((!user_id || !email) && lastPendingCheckout && (Date.now() - lastPendingCheckout.timestamp < 1800000)) {
        if (!user_id) user_id = lastPendingCheckout.userId;
        if (!email) email = lastPendingCheckout.userEmail;
    }

    try {
        console.log(`🔍 [VERIFY SESSION] Verificando sesión ${session_id} para usuario ${user_id || email}`);
        const response = await axios.post(`${API_URL}?action=verify_stripe_session`, {
            session_id: session_id,
            user_id: user_id,
            email: email
        }, axiosConfig);

        const resData = response.data || {};
        if (lastPendingCheckout && lastPendingCheckout.lang) {
            resData.lang = lastPendingCheckout.lang;
        }

        res.json(resData);
    } catch (error) {
        console.error("❌ Error verificando sesión checkout:", error.message);
        res.json({
            success: false,
            lang: (lastPendingCheckout && lastPendingCheckout.lang) ? lastPendingCheckout.lang : 'es',
            error: "Error de conexión verificando la sesión."
        });
    }
});

const SPEECH_MODELS_REGISTRY = {
    'es': { type: 'zip', folder: 'vosk-model-small-es-0.42', url: `${BASE_MODELS_URL}/vosk-model-small-es-0.42.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip' },
    'en': { type: 'zip', folder: 'vosk-model-small-en-us-0.15', url: `${BASE_MODELS_URL}/vosk-model-small-en-us-0.15.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip' },
    'eu': { type: 'bin', file: 'ggml-base-eu.bin', url: `${BASE_MODELS_URL}/ggml-base-eu.bin`, fallbackUrl: 'https://talk-me.app/models/v1/ggml-base-eu.bin' },
    'de': { type: 'zip', folder: 'vosk-model-small-de-0.15', url: `${BASE_MODELS_URL}/vosk-model-small-de-0.15.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-de-0.15.zip' },
    'fr': { type: 'zip', folder: 'vosk-model-small-fr-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-fr-0.22.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip' },
    'it': { type: 'zip', folder: 'vosk-model-small-it-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-it-0.22.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-it-0.22.zip' },
    'ja': { type: 'zip', folder: 'vosk-model-small-ja-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-ja-0.22.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-ja-0.22.zip' },
    'pt': { type: 'zip', folder: 'vosk-model-small-pt-0.3', url: `${BASE_MODELS_URL}/vosk-model-small-pt-0.3.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-pt-0.3.zip' },
    'ru': { type: 'zip', folder: 'vosk-model-small-ru-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-ru-0.22.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip' },
    'zh': { type: 'zip', folder: 'vosk-model-small-cn-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-cn-0.22.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip' },
    'tr': { type: 'zip', folder: 'vosk-model-small-tr-0.3', url: `${BASE_MODELS_URL}/vosk-model-small-tr-0.3.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-tr-0.3.zip' },
    'ca': { type: 'zip', folder: 'vosk-model-small-ca-0.4', url: `${BASE_MODELS_URL}/vosk-model-small-ca-0.4.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-ca-0.4.zip' },
    'ar': { type: 'zip', folder: 'vosk-model-small-ar-0.3', url: `${BASE_MODELS_URL}/vosk-model-small-ar-0.3.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-ar-0.3.zip' },
    'fa': { type: 'zip', folder: 'vosk-model-small-fa-0.4', url: `${BASE_MODELS_URL}/vosk-model-small-fa-0.4.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-fa-0.4.zip' },
    'uk': { type: 'zip', folder: 'vosk-model-small-uk-v3-nano', url: `${BASE_MODELS_URL}/vosk-model-small-uk-v3-nano.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-uk-v3-nano.zip' },
    'sv': { type: 'zip', folder: 'vosk-model-small-sv-rhasspy-0.15', url: `${BASE_MODELS_URL}/vosk-model-small-sv-rhasspy-0.15.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-sv-rhasspy-0.15.zip' },
    'vi': { type: 'zip', folder: 'vosk-model-small-vn-0.4', url: `${BASE_MODELS_URL}/vosk-model-small-vn-0.4.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-vn-0.4.zip' },
    'ko': { type: 'zip', folder: 'vosk-model-small-ko-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-ko-0.22.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-ko-0.22.zip' },
    'nl': { type: 'zip', folder: 'vosk-model-small-nl-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-nl-0.22.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-nl-0.22.zip' },
    'uz': { type: 'zip', folder: 'vosk-model-small-uz-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-uz-0.22.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-uz-0.22.zip' },
    'kk': { type: 'zip', folder: 'vosk-model-small-kz-0.42', url: `${BASE_MODELS_URL}/vosk-model-small-kz-0.42.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-kz-0.42.zip' },
    'pl': { type: 'zip', folder: 'vosk-model-small-pl-0.22', url: `${BASE_MODELS_URL}/vosk-model-small-pl-0.22.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-pl-0.22.zip' },
    'gl': { type: 'bin', file: 'ggml-base-gl.bin', url: `${BASE_MODELS_URL}/ggml-base-gl.bin`, fallbackUrl: 'https://talk-me.app/models/v1/ggml-base-gl.bin' },
    'eo': { type: 'zip', folder: 'vosk-model-small-eo-0.42', url: `${BASE_MODELS_URL}/vosk-model-small-eo-0.42.zip`, fallbackUrl: 'https://alphacephei.com/vosk/models/vosk-model-small-eo-0.42.zip' }
};

function downloadFile(url, dest, fallbackUrl = null) {
    return new Promise((resolve, reject) => {
        const attemptDownload = (currentUrl, isFallback = false) => {
            const file = fs.createWriteStream(dest);
            const protocol = currentUrl.startsWith('https') ? https : http;

            const request = protocol.get(currentUrl, (response) => {
                if (response.statusCode === 301 || response.statusCode === 302) {
                    file.close();
                    try { fs.unlinkSync(dest); } catch (e) { }
                    return downloadFile(response.headers.location, dest, fallbackUrl).then(resolve).catch(reject);
                }

                if (response.statusCode !== 200) {
                    file.close();
                    try { fs.unlinkSync(dest); } catch (e) { }
                    if (!isFallback && fallbackUrl && fallbackUrl !== currentUrl) {
                        console.warn(`⚠️ [DOWNLOAD-FAILOVER] Error HTTP ${response.statusCode} en ${currentUrl}. Conmutando a fallback: ${fallbackUrl}`);
                        return attemptDownload(fallbackUrl, true);
                    }
                    return reject(new Error(`HTTP ${response.statusCode} downloading model`));
                }

                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            });

            request.on('error', (err) => {
                try { fs.unlinkSync(dest); } catch (e) { }
                if (!isFallback && fallbackUrl && fallbackUrl !== currentUrl) {
                    console.warn(`⚠️ [DOWNLOAD-FAILOVER] Error de red en ${currentUrl}: ${err.message}. Conmutando a fallback: ${fallbackUrl}`);
                    return attemptDownload(fallbackUrl, true);
                }
                reject(err);
            });
        };

        attemptDownload(url, false);
    });
}

function getTargetModelsDir() {
    try {
        const configPath = path.join(__dirname, '..', 'config', 'data', 'models-path.json');
        if (fs.existsSync(configPath)) {
            const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (data && data.modelsPath && fs.existsSync(data.modelsPath)) return data.modelsPath;
        }
    } catch (e) { }

    // Fallback defensivo anti-EACCES: evitar siempre Program Files
    const os = require('os');
    const isWin = process.platform === 'win32';
    const appData = process.env.APPDATA || (isWin 
        ? path.join(os.homedir(), 'AppData', 'Roaming') 
        : path.join(os.homedir(), 'Library', 'Application Support'));
    const defaultModelsDir = path.join(appData, 'Talk-me', 'models');
    try {
        if (!fs.existsSync(defaultModelsDir)) {
            fs.mkdirSync(defaultModelsDir, { recursive: true });
        }
        return defaultModelsDir;
    } catch (e) {
        if (isWin) {
            const fallbackC = 'C:\\TalkMe\\Models';
            try {
                if (!fs.existsSync(fallbackC)) fs.mkdirSync(fallbackC, { recursive: true });
                return fallbackC;
            } catch (e2) { }
        }
    }
    return path.resolve(__dirname, '..');
}

// Endpoint para que el Frontend obtenga de forma determinista y nativa la ruta válida de modelos
app.get('/api/default-models-path', (req, res) => {
    try {
        const resolvedPath = getTargetModelsDir();
        res.json({ success: true, path: resolvedPath });
    } catch (err) {
        res.json({ success: true, path: path.resolve(__dirname, '..') });
    }
});




// 5. Validar Sistema (Motor Soberano CONECTADO A MYSQL + CAPA OFFLINE)
app.post('/api/validate-system', async (req, res) => {
    const { licenseKey, userId } = req.body;
    const hwId = generateHardwareFingerprint();

    if (!hwId) return res.status(500).json({ error: "No se pudo leer la MAC" });

    try {
        console.log(`🌐 [API REAL] Validando Licencia Soberana: ${licenseKey}`);
        const response = await axios.post(`${API_URL}?action=validate`, {
            license_key: licenseKey,
            hw_id: hwId,
            client_version: CLIENT_VERSION,
            app_version: CLIENT_VERSION_NAME,
            platform: (process.platform === 'win32' ? 'windows' : (process.platform === 'darwin' ? 'mac' : 'linux'))
        }, axiosConfig);

        if (response.data.success) {
            console.log("✅ SISTEMA VALIDADO CORRECTAMENTE EN MYSQL. Listo para arrancar.");

            // La API PHP ya devuelve expires_at directamente — usarlo, no consultar MySQL por separado
            let expirationDateFormated = null;
            let expirationDateISO = null;
            const paymentMode = response.data.payment_mode || 'one_time';
            const subStatus = response.data.subscription_status || '';
            if (paymentMode === 'one_time' || subStatus === 'complete') {
                const createdAt = response.data.created_at ? new Date(response.data.created_at) : new Date();
                const lastVal = response.data.last_online_validation;

                let nextSyncDate;
                if (!lastVal) {
                    // Primer mes tras la compra
                    nextSyncDate = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
                    console.log("📅 Licencia Vitalicia/Completa (Primer mes): Hito de telemetría a los 30 días de la compra.");
                } else {
                    // Validaciones subsiguientes cada 180 días (6 meses)
                    nextSyncDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
                    console.log("📅 Licencia Vitalicia/Completa: Hito de telemetría estándar a los 180 días.");
                }

                expirationDateISO = nextSyncDate.toISOString();
                // Usar lang si viene en req.body, por defecto 'es'
                const currentLang = req.body.lang || 'es';
                expirationDateFormated = nextSyncDate.toLocaleDateString(currentLang === 'es' ? 'es-ES' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                console.log(`📅 Licencia Vitalicia/Completa: Próximo hito de telemetría → ${expirationDateFormated}`);
            } else if (response.data.expires_at) {
                const raw = response.data.expires_at;
                expirationDateFormated = new Date(raw).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                expirationDateISO = new Date(raw).toISOString();
                console.log(`📅 Fecha de expiración real desde API: ${raw} → ${expirationDateFormated} (ISO: ${expirationDateISO})`);
            } else {
                console.warn("⚠️ La API no devolvió expires_at — token offline sin fecha de expiración real");
            }

            const deviceLimit = response.data.device_limit || 1;
            const activeBindings = response.data.active_bindings || 1;
            const planType = response.data.plan_type || (deviceLimit >= 5 ? 'enterprise' : 'freelance');

            generateOfflineToken(
                hwId,
                licenseKey,
                response.data.email,
                response.data.user_id,
                expirationDateISO,
                deviceLimit,
                activeBindings,
                planType,
                response.data.payment_mode || 'one_time',
                response.data.total_price || 0,
                response.data.total_paid || 0,
                response.data.license_status || 'active',
                response.data.license_version || 1,
                subStatus
            );
            syncTelemetryQueue(hwId, API_URL, API_SECRET_KEY);


            res.json({
                success: true,
                message: response.data.message,
                hw_id: hwId,
                mode: 'ONLINE',
                expiration_date: expirationDateFormated,
                expires_raw: expirationDateISO,
                device_limit: deviceLimit,
                active_bindings: activeBindings,
                plan_type: planType,
                payment_mode: response.data.payment_mode,
                total_price: response.data.total_price,
                total_paid: response.data.total_paid,
                license_status: response.data.license_status || 'active',
                version_channel: response.data.version_channel || null
            });
        } else {
            res.status(403).json({ error: response.data.error, error_code: response.data.error_code });
        }
    } catch (error) {
        // Si el servidor Aruba respondió con un código de estado de error (403, 500, etc.), denegar acceso y propagar
        if (error.response) {
            console.error(`❌ El servidor Aruba denegó el acceso (HTTP ${error.response.status}):`, error.response.data);
            const errMsg = error.response.data && error.response.data.error ? error.response.data.error : "Acceso denegado por el servidor de licencias.";
            const errCode = error.response.data && error.response.data.error_code ? error.response.data.error_code : undefined;
            return res.status(error.response.status).json({ error: errMsg, error_code: errCode });
        }

        console.warn("⚠️ Error de Red o Aruba caído. Iniciando Fallback OFFLINE...");
        const offlineCheck = validateOfflineToken(hwId);

        if (offlineCheck.success) {
            // Verificar que la clave provista coincide con la del token offline
            const reqKey = licenseKey ? String(licenseKey).toUpperCase().trim() : '';
            const tokenKey = offlineCheck.licenseKey ? String(offlineCheck.licenseKey).toUpperCase().trim() : '';
            if (reqKey !== tokenKey) {
                console.error(`❌ La licencia provista (${reqKey}) no coincide con la del token offline (${tokenKey})`);
                return res.status(403).json({ error: "La licencia provista no coincide con el Sello Offline guardado." });
            }

            // Verificar que el usuario provisto coincide con el del token offline
            let userMatches = true;
            if (userId) {
                const userIdStr = String(userId).trim();
                const tokenEmail = offlineCheck.email ? offlineCheck.email.toLowerCase().trim() : '';
                const tokenUserId = offlineCheck.userId ? String(offlineCheck.userId).trim() : '';

                if (userIdStr.startsWith('auto-')) {
                    const reqEmail = userIdStr.substring(5).toLowerCase().trim();
                    if (reqEmail && tokenEmail && reqEmail !== tokenEmail) {
                        userMatches = false;
                    }
                } else if (userIdStr.startsWith('validate-')) {
                    const reqEmail = userIdStr.substring(9).toLowerCase().trim();
                    if (reqEmail && tokenEmail && reqEmail !== tokenEmail) {
                        userMatches = false;
                    }
                } else {
                    if (userIdStr.includes('@')) {
                        if (tokenEmail && userIdStr.toLowerCase() !== tokenEmail) {
                            userMatches = false;
                        }
                    } else {
                        if (tokenUserId && userIdStr !== tokenUserId) {
                            userMatches = false;
                        }
                    }
                }
            }
            if (!userMatches) {
                console.error(`❌ El usuario provisto (${userId}) no coincide con el del token offline (${offlineCheck.email} / ID: ${offlineCheck.userId})`);
                return res.status(403).json({ error: "El Sello Offline pertenece a otro usuario." });
            }

            let formattedExp = offlineCheck.expirationDate;
            if (formattedExp) {
                const d = new Date(formattedExp);
                if (!isNaN(d.getTime())) {
                    formattedExp = d.toLocaleDateString('es-ES', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    });
                }
            }
            res.json({
                success: true,
                message: offlineCheck.message,
                hw_id: hwId,
                mode: 'OFFLINE',
                warningCode: offlineCheck.warningCode,
                strikesUsed: offlineCheck.strikesUsed,
                expiration_date: formattedExp,
                expires_raw: offlineCheck.expirationDate,
                device_limit: offlineCheck.deviceLimit || 1,
                active_bindings: offlineCheck.activeBindings || 1,
                plan_type: offlineCheck.planType || 'freelance',
                payment_mode: offlineCheck.paymentMode || 'one_time',
                total_price: offlineCheck.totalPrice || 0,
                total_paid: offlineCheck.totalPaid || 0,
                license_status: offlineCheck.licenseStatus || 'active',
                version_channel: (() => {
                    try {
                        if (fs.existsSync(PRICING_CACHE_PATH)) {
                            const cached = JSON.parse(fs.readFileSync(PRICING_CACHE_PATH, 'utf8'));
                            if (cached && cached.latest_release) {
                                return {
                                    status: 'UPDATE_AVAILABLE_FREE',
                                    current_version: CLIENT_VERSION_NAME,
                                    target_version: cached.latest_release.version,
                                    latest_version: cached.latest_release.version,
                                    release_date: cached.latest_release.release_date,
                                    download_url: cached.latest_release.download_url || (cached.latest_release.download_urls && cached.latest_release.download_urls.windows)
                                };
                            }
                        }
                    } catch (e) {}
                    return null;
                })()
            });
        } else {
            console.error("❌ " + offlineCheck.error);
            res.status(403).json({ error: offlineCheck.error });
        }
    }
});

// 5.5. Desvincular Licencia / Equipo (Liberación de Slot)
app.post('/api/deregister-license', async (req, res) => {
    const { licenseKey } = req.body;
    const hwId = generateHardwareFingerprint();
    const fs = require('fs');
    const path = require('path');
    const TOKEN_PATH = resolvePrelaunchWritablePath('local_license.tok');

    if (!licenseKey) {
        return res.status(400).json({ success: false, error: "Falta la Clave de Licencia" });
    }

    try {
        console.log(`🔌 [API REAL] Desvinculando equipo ${hwId} de la licencia ${licenseKey}`);

        // Intentar notificar a la API central (Aruba)
        await axios.post(`${API_URL}?action=deregister`, {
            license_key: licenseKey,
            hw_id: hwId
        }, { ...axiosConfig, timeout: 8000 });

        // Borramos el token local offline de esta máquina solo si coincide la clave
        if (fs.existsSync(TOKEN_PATH)) {
            const { validateOfflineToken } = require('./license-manager');
            const offlineCheck = validateOfflineToken(hwId);
            const reqKey = licenseKey ? String(licenseKey).toUpperCase().trim() : '';
            const tokenKey = offlineCheck.licenseKey ? String(offlineCheck.licenseKey).toUpperCase().trim() : '';
            if (!offlineCheck.success || reqKey === tokenKey) {
                fs.unlinkSync(TOKEN_PATH);
            }
        }

        return res.json({
            success: true,
            message: "Equipo desvinculado de la licencia correctamente."
        });

    } catch (error) {
        console.warn("⚠️ Error desvinculando online, aplicando desconexión local forzada:", error.message);

        // Como contingencia, borramos el token local de todas formas para liberar la máquina local solo si coincide la clave
        if (fs.existsSync(TOKEN_PATH)) {
            const { validateOfflineToken } = require('./license-manager');
            const offlineCheck = validateOfflineToken(hwId);
            const reqKey = licenseKey ? String(licenseKey).toUpperCase().trim() : '';
            const tokenKey = offlineCheck.licenseKey ? String(offlineCheck.licenseKey).toUpperCase().trim() : '';
            if (!offlineCheck.success || reqKey === tokenKey) {
                fs.unlinkSync(TOKEN_PATH);
            }
        }

        return res.json({
            success: true,
            message: "El equipo ha sido liberado localmente. Si estabas sin conexión, asegúrate de conectarte a internet en el otro equipo para poder activar la licencia."
        });
    }
});

// 6. Endpoint Pasivo de Telemetría (Heartbeat)
app.post('/api/telemetry-heartbeat', (req, res) => {
    try {
        const stats = req.body;
        const hwId = generateHardwareFingerprint();

        if (hwId) {
            logTelemetry(hwId, stats);
            res.json({ success: true, message: 'Heartbeat guardado en cola offline.' });
        } else {
            res.status(500).json({ error: 'No se pudo generar hwId.' });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 6.5. Endpoint para escanear los modelos de voz instalados físicamente (Pre-Flight Check)
app.get('/api/check-models', async (req, res) => {
    const fsPromises = require('fs').promises;
    const path = require('path');
    try {
        const { customPath } = req.query;
        const baseDir = customPath || path.join(__dirname, '..');

        const modelsStatus = {};

        let filesInDir = [];
        try {
            filesInDir = await fsPromises.readdir(baseDir);
        } catch (e) {
            console.error("Error leyendo directorio baseDir:", e.message);
        }

        const langCodes = Object.keys(MODELS_CONFIG);

        await Promise.all(langCodes.map(async (code) => {
            const config = MODELS_CONFIG[code];
            if (config.type === 'bin') {
                const primaryPath = customPath
                    ? path.join(customPath, config.file)
                    : path.join(__dirname, '..', 'storage', 'models', 'whisper', config.file);
                let binFound = false;
                try {
                    await fsPromises.access(primaryPath);
                    binFound = true;
                } catch {
                    const whisperBases = [baseDir];
                    const pDir = process.env.PORTABLE_DIR || process.env.PORTABLE_EXECUTABLE_DIR;
                    if (pDir) {
                        whisperBases.push(pDir);
                        whisperBases.push(path.join(pDir, 'storage', 'models', 'whisper'));
                        whisperBases.push(path.join(pDir, 'models'));
                    }
                    whisperBases.push(path.join(__dirname, '..', 'storage', 'models', 'whisper'));
                    whisperBases.push('C:\\TalkMe\\Models');
                    const aData = process.env.APPDATA || (process.platform === 'win32' ? path.join(require('os').homedir(), 'AppData', 'Roaming') : require('os').homedir());
                    whisperBases.push(path.join(aData, 'Talk-me', 'models'));

                    const sRoots = [__dirname, path.join(__dirname, '..'), process.cwd()];
                    if (pDir) sRoots.push(pDir);
                    if (process.execPath) sRoots.push(path.dirname(process.execPath));
                    for (const r of sRoots) {
                        let c = r;
                        for (let d = 0; d < 6; d++) {
                            whisperBases.push(path.join(c, 'storage', 'models', 'whisper'));
                            whisperBases.push(path.join(c, 'models'));
                            const pr = path.dirname(c);
                            if (pr === c) break;
                            c = pr;
                        }
                    }

                    for (const wb of whisperBases) {
                        if (!wb) continue;
                        try {
                            await fsPromises.access(path.join(wb, config.file));
                            binFound = true;
                            break;
                        } catch (_) { }
                    }
                }
                modelsStatus[code] = binFound;
            } else {
                const folderName = config.folder || `vosk-model-small-${code}`;
                let found = false;

                // Directorios candidatos para comprobar la existencia del modelo Vosk
                const checkBases = [baseDir];
                const portableDir = process.env.PORTABLE_DIR || process.env.PORTABLE_EXECUTABLE_DIR;
                if (portableDir) {
                    checkBases.push(portableDir);
                    checkBases.push(path.join(portableDir, 'models'));
                }
                checkBases.push(path.join(__dirname, '..'));
                checkBases.push('C:\\TalkMe\\Models');
                const appData = process.env.APPDATA || (process.platform === 'win32' ? path.join(require('os').homedir(), 'AppData', 'Roaming') : require('os').homedir());
                checkBases.push(path.join(appData, 'Talk-me', 'models'));

                // Escaneo ascendente de hasta 6 niveles
                const scanRoots = [__dirname, path.join(__dirname, '..'), process.cwd()];
                if (portableDir) scanRoots.push(portableDir);
                if (process.execPath) scanRoots.push(path.dirname(process.execPath));
                for (const root of scanRoots) {
                    let cur = root;
                    for (let d = 0; d < 6; d++) {
                        checkBases.push(cur);
                        checkBases.push(path.join(cur, 'models'));
                        const p = path.dirname(cur);
                        if (p === cur) break;
                        cur = p;
                    }
                }

                for (const candidateBase of checkBases) {
                    if (!candidateBase) continue;
                    try {
                        const stat = await fsPromises.stat(path.join(candidateBase, folderName));
                        if (stat.isDirectory()) {
                            found = true;
                            break;
                        }
                    } catch (e) { }

                    if (!found) {
                        try {
                            const subFiles = await fsPromises.readdir(candidateBase);
                            const prefix = config.folder ? config.folder.split('-').slice(0, 4).join('-') : `vosk-model-small-${code}`;
                            for (const file of subFiles) {
                                if (file.toLowerCase().startsWith(prefix.toLowerCase())) {
                                    try {
                                        const stat = await fsPromises.stat(path.join(candidateBase, file));
                                        if (stat.isDirectory()) {
                                            found = true;
                                            break;
                                        }
                                    } catch (e) { }
                                }
                            }
                        } catch (e) { }
                    }
                    if (found) break;
                }
                modelsStatus[code] = found;
                // Blindaje Murphy: Verificación estricta para motor de traducción neuronal (MADLAD-400)
                if (code === 'translate') {
                    let translateReady = false;
                    const portableDir = process.env.PORTABLE_DIR || process.env.PORTABLE_EXECUTABLE_DIR;
                    const appData = process.env.APPDATA || (process.platform === 'win32' ? path.join(require('os').homedir(), 'AppData', 'Roaming') : require('os').homedir());
                    const appDataDir = path.join(appData, 'Talk-me', 'models');

                    const modelCandidates = [
                        path.join(baseDir, 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8', 'model.bin'),
                        path.join(baseDir, 'translate', 'madlad400-3b-int8', 'model.bin'),
                        path.join(baseDir, 'translate', 'model.bin'),
                        path.join(baseDir, 'madlad400-3b-int8', 'madlad400-3b-int8', 'model.bin'),
                        path.join(baseDir, 'madlad400-3b-int8', 'model.bin'),
                        path.join(appDataDir, 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8', 'model.bin'),
                        path.join(appDataDir, 'translate', 'madlad400-3b-int8', 'model.bin'),
                        path.join(appDataDir, 'translate', 'model.bin'),
                        'C:\\TalkMe\\Models\\translate\\madlad400-3b-int8\\madlad400-3b-int8\\model.bin',
                        'C:\\TalkMe\\Models\\translate\\madlad400-3b-int8\\model.bin',
                        'C:\\TalkMe\\Models\\translate\\model.bin',
                        path.join(__dirname, '..', 'storage', 'models', 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8', 'model.bin'),
                        path.join(__dirname, '..', 'storage', 'models', 'translate', 'madlad400-3b-int8', 'model.bin')
                    ];
                    if (portableDir) {
                        modelCandidates.unshift(
                            path.join(portableDir, 'storage', 'models', 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8', 'model.bin'),
                            path.join(portableDir, 'storage', 'models', 'translate', 'madlad400-3b-int8', 'model.bin')
                        );
                    }

                    // Escaneo defensivo de unidades de disco (C:, D:, E:, F:, G:, H:, etc.)
                    if (process.platform === 'win32') {
                        const driveLetters = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
                        for (const drive of driveLetters) {
                            modelCandidates.push(
                                `${drive}:\\TalkMe\\Models\\translate\\madlad400-3b-int8\\madlad400-3b-int8\\model.bin`,
                                `${drive}:\\TalkMe\\Models\\translate\\madlad400-3b-int8\\model.bin`,
                                `${drive}:\\TalkMe\\Models\\translate\\model.bin`,
                                `${drive}:\\Talk-me\\models\\translate\\madlad400-3b-int8\\model.bin`,
                                `${drive}:\\Talk-me\\storage\\models\\translate\\madlad400-3b-int8\\model.bin`
                            );
                        }
                    }

                    // [v60.BÚSQUEDA ASCENDENTE - HASTA 6 NIVELES]:
                    // Soporte para ejecutables en dist_final/win-unpacked, portable, staging o subdirectorios en cualquier disco
                    const scanRoots = [__dirname, process.cwd()];
                    if (portableDir) scanRoots.push(portableDir);
                    if (process.env.PORTABLE_EXECUTABLE_DIR) scanRoots.push(process.env.PORTABLE_EXECUTABLE_DIR);
                    if (process.execPath) scanRoots.push(path.dirname(process.execPath));
                    for (const root of scanRoots) {
                        let current = root;
                        for (let depth = 0; depth < 6; depth++) {
                            modelCandidates.push(
                                path.join(current, 'storage', 'models', 'translate', 'madlad400-3b-int8', 'model.bin'),
                                path.join(current, 'storage', 'models', 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8', 'model.bin'),
                                path.join(current, 'models', 'translate', 'madlad400-3b-int8', 'model.bin'),
                                path.join(current, 'translate', 'madlad400-3b-int8', 'model.bin'),
                                path.join(current, 'madlad400-3b-int8', 'model.bin')
                            );
                            const parent = path.dirname(current);
                            if (parent === current) break;
                            current = parent;
                        }
                    }

                    for (const cand of modelCandidates) {
                        try {
                            if (fs.existsSync(cand) && fs.statSync(cand).size >= 2600000000) {
                                translateReady = true;
                                break;
                            }
                        } catch (e) { }
                    }
                    modelsStatus['translate'] = translateReady;
                }

            }
        }));

        res.json({
            success: true,
            platform: process.platform,
            arch: process.arch,
            models: modelsStatus
        });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});


// 6.5b. Endpoint para abrir el diálogo nativo de selección de carpeta (Windows FolderBrowserDialog)
app.post('/api/select-folder', requireActiveLicense, (req, res) => {
    const { exec } = require('child_process');
    // Using Shell.Application COM object is much more reliable for popup dialogs from Node.js
    // than assembly loading which requires strict STA threading. We do not use -NonInteractive here.
    const psCommand = `powershell -Command "$s=New-Object -ComObject Shell.Application; $f=$s.BrowseForFolder(0, 'Selecciona la carpeta para guardar los modelos de voz', 0, 17); if($f){Write-Output $f.Self.Path}"`;

    exec(psCommand, { timeout: 60000 }, (err, stdout) => {
        if (err) {
            return res.json({ success: false, error: err.message });
        }
        const selected = stdout.trim();
        if (selected) {
            res.json({ success: true, path: selected });
        } else {
            res.json({ success: false, cancelled: true });
        }
    });
});

// 6.6. Endpoint para consultar info de licencia via API PHP (MySQL no es accesible directamente)
app.get('/api/license-info', async (req, res) => {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'license key required' });

    // Primero intentar con el token offline (ya guardado en disco tras última validación online)
    const { validateOfflineToken } = require('./license-manager');
    const hwId = generateHardwareFingerprint();
    const offlineCheck = validateOfflineToken(hwId);

    if (offlineCheck.success && offlineCheck.expirationDate) {
        const reqKey = key ? String(key).toUpperCase().trim() : '';
        const tokenKey = offlineCheck.licenseKey ? String(offlineCheck.licenseKey).toUpperCase().trim() : '';
        if (reqKey === tokenKey) {
            // Tenemos fecha guardada en el token offline — usarla directamente, formateada a español
            let formattedExp = offlineCheck.expirationDate;
            const d = new Date(formattedExp);
            if (!isNaN(d.getTime())) {
                formattedExp = d.toLocaleDateString('es-ES', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
            }
            return res.json({
                success: true,
                expires_formatted: formattedExp,
                expires_raw: offlineCheck.expirationDate,
                hw_id: hwId,
                source: 'offline_token',
                device_limit: offlineCheck.deviceLimit || 1,
                active_bindings: offlineCheck.activeBindings || 1,
                plan_type: offlineCheck.planType || 'freelance',
                payment_mode: offlineCheck.paymentMode || 'one_time',
                total_price: offlineCheck.totalPrice || 0,
                total_paid: offlineCheck.totalPaid || 0,
                license_status: offlineCheck.licenseStatus || 'active'
            });
        }
    }

    // Si no hay fecha en el token offline, intentar via API PHP
    try {
        const response = await axios.post(`${API_URL}?action=validate`, {
            license_key: key,
            hw_id: hwId
        }, { ...axiosConfig, timeout: 8000 });

        if (response.data.success) {
            const isOneTime = response.data.payment_mode === 'one_time';
            const isCompleteRto = response.data.subscription_status === 'complete';
            let rawExpires = response.data.expires_at;

            if (isOneTime || isCompleteRto) {
                const createdAt = response.data.created_at ? new Date(response.data.created_at) : new Date();
                const lastVal = response.data.last_online_validation;
                if (!lastVal) {
                    rawExpires = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
                } else {
                    rawExpires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
                }
            }

            if (rawExpires) {
                const formatted = new Date(rawExpires).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                const deviceLimit = response.data.device_limit || 1;
                const activeBindings = response.data.active_bindings || 1;
                const planType = response.data.plan_type || (deviceLimit >= 5 ? 'enterprise' : 'freelance');
                return res.json({
                    success: true,
                    expires_formatted: formatted,
                    expires_raw: rawExpires,
                    hw_id: hwId,
                    source: 'api',
                    device_limit: deviceLimit,
                    active_bindings: activeBindings,
                    plan_type: planType,
                    payment_mode: response.data.payment_mode,
                    total_price: response.data.total_price,
                    total_paid: response.data.total_paid,
                    license_status: response.data.license_status || 'active'
                });
            }
        }
        return res.json({ success: false, error: 'La API no devolvió una licencia válida' });
    } catch (e) {
        return res.status(500).json({ success: false, error: 'Sin conexión a la API remota' });
    }
});

// 7. Iniciar el Servidor Principal (Handoff a server.js en la raíz)
app.post('/api/start-main-server', requireActiveLicense, async (req, res) => {
    const { modelsPath, lang, translateEnabled } = req.body;
    const userLang = (lang || 'es').toLowerCase();
    const config = SPEECH_MODELS_REGISTRY[userLang] || SPEECH_MODELS_REGISTRY['es'];
    const isTranslateOn = translateEnabled !== false;

    // Persistencia síncrona del idioma y estado de traducción para el Servidor Principal
    try {
        const configDir = path.join(__dirname, '..', 'config', 'data');
        if (!fs.existsSync(configDir)) {
            try { fs.mkdirSync(configDir, { recursive: true }); } catch (_) { }
        }

        const globalSettingsPath = path.join(configDir, 'global-settings.json');
        let globalConfig = {};
        if (fs.existsSync(globalSettingsPath)) {
            globalConfig = JSON.parse(fs.readFileSync(globalSettingsPath, 'utf8'));
        }
        globalConfig.language = userLang;
        globalConfig.translateEnabled = isTranslateOn;
        fs.writeFileSync(globalSettingsPath, JSON.stringify(globalConfig, null, 2), 'utf8');

        // Si existe USER_DATA_PATH (Electron), sincronizar también en AppData
        if (process.env.USER_DATA_PATH) {
            try {
                const userConfigDir = path.join(process.env.USER_DATA_PATH, 'config', 'data');
                if (!fs.existsSync(userConfigDir)) {
                    fs.mkdirSync(userConfigDir, { recursive: true });
                }
                fs.writeFileSync(path.join(userConfigDir, 'global-settings.json'), JSON.stringify(globalConfig, null, 2), 'utf8');
            } catch (_) { }
        }

        const modelsPathFile = path.join(configDir, 'models-path.json');
        let modelsConfigData = {};
        if (fs.existsSync(modelsPathFile)) {
            modelsConfigData = JSON.parse(fs.readFileSync(modelsPathFile, 'utf8'));
        }
        modelsConfigData.defaultLang = userLang;
        modelsConfigData.translateEnabled = isTranslateOn;
        fs.writeFileSync(modelsPathFile, JSON.stringify(modelsConfigData, null, 2), 'utf8');

        console.log(`🌐 [PRE-LAUNCH HANDOFF] Idioma [${userLang.toUpperCase()}] y Traducción [${isTranslateOn ? 'ON' : 'OFF'}] guardados en global-settings.json.`);
    } catch (saveErr) {
        console.warn("⚠️ [PRE-LAUNCH HANDOFF] No se pudo guardar configuración en global-settings.json:", saveErr.message);
    }

    // Asegurar presencia del modelo de voz para el idioma principal en segundo plano
    runAsyncDownload(userLang, getTargetModelsDir()).catch(e => {
        console.warn(`⚠️ [AULMP] Error asegurando modelo para [${userLang}]:`, e.message);
    });

    // Retornamos éxito inmediatamente para que la UI sepa que debe iniciar el polling/reload
    res.json({ success: true, message: "Iniciando servidor principal de Talk-me..." });

    const { exec, execSync } = require('child_process');

    // Guardar la ruta de modelos en config/data/models-path.json
    try {
        const configDir = path.join(__dirname, '..', 'config', 'data');
        if (!fs.existsSync(configDir)) {
            try { fs.mkdirSync(configDir, { recursive: true }); } catch (_) { }
        }
        const payloadStr = JSON.stringify({
            modelsPath: modelsPath || 'C:\\TalkMe\\Models',
            defaultLang: userLang,
            translateEnabled: isTranslateOn
        }, null, 2);

        try {
            fs.writeFileSync(path.join(configDir, 'models-path.json'), payloadStr, 'utf8');
        } catch (_) { }

        if (process.env.USER_DATA_PATH) {
            try {
                const userConfigDir = path.join(process.env.USER_DATA_PATH, 'config', 'data');
                if (!fs.existsSync(userConfigDir)) {
                    fs.mkdirSync(userConfigDir, { recursive: true });
                }
                fs.writeFileSync(path.join(userConfigDir, 'models-path.json'), payloadStr, 'utf8');
            } catch (_) { }
        }
        console.log(`✅ Ruta de modelos guardada en models-path.json: ${modelsPath} (idioma: ${userLang}, traducción: ${isTranslateOn ? 'ON' : 'OFF'})`);

    } catch (e) {
        console.error("❌ Error guardando models-path.json:", e.message);
    }

    // Ejecutamos limpieza del estabilizador antes de salir
    console.log("[STABILIZER] Limpiando sesiones previas y procesos Whisper...");
    try {
        if (process.platform === 'win32') {
            execSync('taskkill /f /im whisper-server.exe', { stdio: 'ignore' });
        } else {
            execSync('pkill -f whisper-server || true', { stdio: 'ignore' });
        }
    } catch (e) {
        // Ignorar si no está corriendo
    }
    try {
        const historyPath = path.join(__dirname, '..', 'storage', 'message-history.json');
        if (fs.existsSync(historyPath)) {
            fs.unlinkSync(historyPath);
            console.log("[STABILIZER] Historial previo message-history.json limpiado.");
        }
    } catch (e) {
        console.error("[STABILIZER] Error al borrar historial previo:", e.message);
    }

    setTimeout(() => {
        console.log("🔌 Handoff pre-launch -> main server...");

        if (process.send) {
            console.log("📡 Notificando a Electron main process (IPC) para despegue silencioso...");
            process.send({ event: 'license-validated', lang: userLang });
        } else {
            const rootDir = path.join(__dirname, '..');
            if (process.platform === 'win32') {
                exec('start "Talk-me Server v60" cmd /k "timeout /t 2 /nobreak && node server.js"', {
                    cwd: rootDir
                }, (err) => {
                    if (err) {
                        console.error("❌ Fallo al lanzar el servidor principal en ventana nueva:", err.message);
                    }
                });
            } else if (process.platform === 'darwin') {
                // macOS: Soporte obligatorio para Vosk en Apple Silicon (arm64) bajo emulación Rosetta x86_64
                const isMacArm = (process.arch === 'arm64');
                const nodeBinary = isMacArm ? 'arch -x86_64 node' : 'node';
                const appleScript = `tell application "Terminal" to do script "cd \\"${rootDir}\\" && ${nodeBinary} server.js"`;
                exec(`osascript -e '${appleScript}'`, (err) => {
                    if (err) {
                        console.warn("⚠️ osascript falló, iniciando proceso node directamente con spawn:", err.message);
                        const { spawn } = require('child_process');
                        const spawnCmd = isMacArm ? 'arch' : (process.execPath || 'node');
                        const spawnArgs = isMacArm ? ['-x86_64', process.execPath || 'node', 'server.js'] : ['server.js'];
                        const child = spawn(spawnCmd, spawnArgs, {
                            cwd: rootDir,
                            detached: true,
                            stdio: 'inherit'
                        });
                        child.unref();
                    }
                });
            } else {
                // Linux / Fallback
                const { spawn } = require('child_process');
                const child = spawn(process.execPath || 'node', ['server.js'], {
                    cwd: rootDir,
                    detached: true,
                    stdio: 'inherit'
                });
                child.unref();
            }

            setTimeout(() => {
                console.log("👋 Handoff completo. Saliendo del proceso de Pre-Launch...");
                process.exit(0);
            }, 800);
        }
    }, 500);
});

// --- PLATAFORMA ELÁSTICA DE MODELOS Y TELEMETRÍA MASTER [v70] ---


const activeDownloads = {};
const activeAbortControllers = {};

app.post('/api/cancel-download', (req, res) => {
    const { model } = req.body;
    if (activeAbortControllers[model]) {
        try {
            activeAbortControllers[model].abort();
            delete activeAbortControllers[model];
        } catch (e) { }
    }
    if (activeDownloads[model]) {
        delete activeDownloads[model];
    }
    res.json({ success: true, message: "Descarga cancelada." });
});

app.post('/api/delete-model', requireActiveLicense, async (req, res) => {
    const fsPromises = require('fs').promises;
    const { model, customPath } = req.body;
    const baseDir = customPath || path.join(__dirname, '..');
    const config = MODELS_CONFIG[model];

    if (!config) return res.status(404).json({ success: false, error: "Modelo desconocido." });

    try {
        if (config.type === 'bin') {
            const candidatePaths = [
                path.join(baseDir, config.file),
                path.join(__dirname, '..', 'storage', 'models', 'whisper', config.file),
                path.join(__dirname, 'storage', 'models', 'whisper', config.file)
            ];
            let deleted = false;
            for (const targetPath of candidatePaths) {
                try {
                    await fsPromises.access(targetPath);
                    await fsPromises.rm(targetPath, { force: true });
                    deleted = true;
                } catch (e) { }
            }
            if (deleted) {
                return res.json({ success: true, message: `Modelo ${model} eliminado.` });
            }
        } else if (model === 'translate') {
            const candidatePaths = [
                path.join(baseDir, 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8'),
                path.join(baseDir, 'translate', 'madlad400-3b-int8'),
                path.join(baseDir, 'translate')
            ];
            let deleted = false;
            for (const cand of candidatePaths) {
                try {
                    const stats = await fsPromises.stat(cand);
                    if (stats.isDirectory()) {
                        await fsPromises.rm(cand, { recursive: true, force: true });
                        deleted = true;
                    }
                } catch (_) {}
            }
            // Purga defensiva de archivos temporales de descarga si hubiese quedado alguno (.zip, .tmp)
            try {
                const zipFile = path.join(baseDir, 'madlad400-3b-int8.zip');
                await fsPromises.rm(zipFile, { force: true });
            } catch (_) {}
            try {
                const tmpZip = path.join(baseDir, 'madlad400-3b-int8.zip.tmp');
                await fsPromises.rm(tmpZip, { force: true });
            } catch (_) {}

            if (deleted) {
                console.log(`🗑️ [PRE-LAUNCH] Modelo de traducción 'madlad400-3b-int8' eliminado físicamente del disco.`);
                return res.json({ success: true, message: "Modelo de traducción eliminado correctamente." });
            }
        } else {

            let files = [];
            try { files = await fsPromises.readdir(baseDir); } catch (e) { }

            const prefixes = [
                `vosk-model-small-${model}`,
                config.folder ? config.folder.split('-').slice(0, 4).join('-') : `vosk-model-small-${model}`
            ];
            const uniquePrefixes = [...new Set(prefixes)];

            for (const file of files) {
                const matches = uniquePrefixes.some(prefix => file.toLowerCase().startsWith(prefix.toLowerCase()));
                if (matches) {
                    const fullPath = path.join(baseDir, file);
                    try {
                        const stats = await fsPromises.stat(fullPath);
                        if (stats.isDirectory()) {
                            await fsPromises.rm(fullPath, { recursive: true, force: true });
                            deleted = true;
                        }
                    } catch (e) {
                        console.error(`Error eliminando subcarpeta ${file}:`, e.message);
                    }
                }
            }

            if (deleted) {
                console.log(`🗑️ [PRE-LAUNCH] Modelo '${model}' eliminado.`);
                return res.json({ success: true, message: `Modelo ${model} eliminado.` });
            }
        }
        res.status(404).json({ success: false, error: "El modelo no estaba instalado." });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/download-model', (req, res) => {
    const { model, customPath } = req.body;
    if (activeDownloads[model]) {
        return res.json({ success: true, message: "Descarga ya en curso." });
    }

    const config = MODELS_CONFIG[model];
    if (!config) return res.status(400).json({ success: false, error: "Modelo no soportado" });

    const targetDir = customPath || getTargetModelsDir();

    // M1 Pre-Flight Write Probe: Verificar permisos reales de escritura en disco
    try {
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        const testFile = path.join(targetDir, `.write-test-${Date.now()}.tmp`);
        fs.writeFileSync(testFile, 'ok');
        fs.unlinkSync(testFile);
    } catch (writeErr) {
        console.error(`❌ [PRE-FLIGHT WRITE PROBE FAILED] en ${targetDir}:`, writeErr.message);
        return res.status(403).json({
            success: false,
            error: `La carpeta "${targetDir}" no tiene permisos de escritura. Por favor, selecciona otra ruta en el selector.`
        });
    }

    activeDownloads[model] = {
        progress: 0,
        speed: '0 MB/s',
        status: 'downloading',
        downloaded: '0 MB',
        total: config.size
    };

    runAsyncDownload(model, customPath);
    res.json({ success: true, message: "Proceso de descarga elástica iniciado." });
});

app.get('/api/download-progress', (req, res) => {
    res.json({ success: true, downloads: activeDownloads });
});

async function runAsyncDownload(model, customPath) {
    const baseDir = customPath || getTargetModelsDir();
    const config = MODELS_CONFIG[model];
    if (!config) return;

    let targetPath = '';
    let isZip = config.type === 'zip';

    if (!isZip) {
        targetPath = path.join(baseDir, config.file);
    } else {
        targetPath = path.join(baseDir, config.folder || `vosk-model-small-${model}`);
    }

    const urlsToTry = [config.url];
    if (config.fallbackUrl && config.fallbackUrl !== config.url) {
        urlsToTry.push(config.fallbackUrl);
    }

    const fsPromises = require('fs').promises;
    const tempFile = isZip
        ? path.join(baseDir, `temp-${model}.zip`)
        : targetPath + '.tmp';

    let success = false;
    let lastError = null;

    for (let i = 0; i < urlsToTry.length; i++) {
        const currentUrl = urlsToTry[i];
        const isFallback = i > 0;
        if (isFallback) {
            console.warn(`🔄 [DOWNLOAD-FAILOVER] Reintentando descarga de ${model} con URL fallback: ${currentUrl}`);
            if (activeDownloads[model]) {
                activeDownloads[model].speed = 'Reintentando (Fallback)...';
            }
        } else {
            console.log(`📥 [DOWNLOAD] Iniciando descarga real de modelo ${model} desde ${currentUrl}...`);
        }

        try {
            // Asegurar limpieza de residuo previo
            try {
                if (fs.existsSync(tempFile)) {
                    await fsPromises.rm(tempFile, { force: true });
                }
            } catch (e) { }

            try { await fsPromises.mkdir(path.dirname(tempFile), { recursive: true }); } catch (e) { }

            const abortController = new AbortController();
            activeAbortControllers[model] = abortController;

            if (activeDownloads[model]) {
                activeDownloads[model].speed = 'Conectando con el servidor...';
            }

            const response = await axios({
                url: currentUrl,
                method: 'GET',
                responseType: 'stream',
                signal: abortController.signal,
                maxRedirects: 5,
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Talk.me/1.0',
                    'Accept': '*/*'
                },
                validateStatus: (status) => status === 200,
                timeout: 30000 // 30s timeout para establecimiento de conexión inicial
            });

            const writer = fs.createWriteStream(tempFile);
            const totalBytes = parseInt(response.headers['content-length'], 10) || 0;
            let downloadedBytes = 0;
            let lastTime = Date.now();
            let lastDownloaded = 0;

            if (activeDownloads[model]) {
                activeDownloads[model].total = totalBytes ? (totalBytes / (1024 * 1024)).toFixed(1) + ' MB' : config.size;
                activeDownloads[model].speed = 'Iniciando descarga...';
            }

            response.data.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                const now = Date.now();
                const progress = totalBytes ? Math.min(99, Math.round((downloadedBytes / totalBytes) * 100)) : 50;

                if (activeDownloads[model]) {
                    activeDownloads[model].downloaded = (downloadedBytes / (1024 * 1024)).toFixed(1) + ' MB';
                    activeDownloads[model].progress = progress;
                }

                if (now - lastTime >= 750) {
                    const elapsed = (now - lastTime) / 1000;
                    if (elapsed > 0) {
                        const speedBytes = (downloadedBytes - lastDownloaded) / elapsed;
                        const speedMB = (speedBytes / (1024 * 1024)).toFixed(1) + ' MB/s';
                        if (activeDownloads[model]) {
                            activeDownloads[model].speed = speedMB;
                        }
                    }
                    lastTime = now;
                    lastDownloaded = downloadedBytes;
                }
            });

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', (err) => {
                    console.error(`❌ [STREAM-WRITER-ERROR] Error escribiendo ${tempFile}:`, err.message);
                    reject(err);
                });
                response.data.on('error', (err) => {
                    console.error(`❌ [STREAM-RESPONSE-ERROR] Error de red en stream de ${currentUrl}:`, err.message);
                    try { writer.close(); } catch (e) { }
                    reject(err);
                });
                response.data.pipe(writer);
            });

            // Garantizar liberación de handle de archivo en Windows OS
            try { writer.end(); } catch (e) { }
            await new Promise(r => setTimeout(r, 300));

            // Murphy Check: Verificar que el archivo descargado tenga un tamaño real (> 500 KB)
            const fileStat = await fsPromises.stat(tempFile);
            if (fileStat.size < 500000) {
                throw new Error(`El archivo descargado está incompleto o corrupto (${fileStat.size} bytes).`);
            }

            if (!isZip) {
                console.log(`📦 [RENAME] Guardado atómico completado para binario Whisper: ${tempFile} -> ${targetPath}`);
                try {
                    if (fs.existsSync(targetPath)) {
                        fs.unlinkSync(targetPath);
                    }
                    fs.renameSync(tempFile, targetPath);
                } catch (renameErr) {
                    console.error(`❌ [RENAME] Error renombrando binario Whisper:`, renameErr.message);
                    throw renameErr;
                }
            }

            if (isZip) {
                console.log(`📦 [UNZIP] Iniciando descompresión de ${tempFile} en ${baseDir}...`);
                if (activeDownloads[model]) {
                    activeDownloads[model].status = 'unzipping';
                    activeDownloads[model].speed = 'Descomprimiendo componentes...';
                    activeDownloads[model].progress = 99;
                }

                // Si es el modelo de traducción (2.75 GB), debe extraerse a la subcarpeta 'translate/madlad400-3b-int8'
                let extractTargetDir = baseDir;
                if (model === 'translate') {
                    extractTargetDir = path.join(baseDir, 'translate', 'madlad400-3b-int8');
                    try { await fsPromises.mkdir(extractTargetDir, { recursive: true }); } catch (e) { }
                }

                let unzipped = false;

                // 1. Primer intento para archivos grandes (ZIP64 > 2 GB) vía tar.exe nativo de Windows
                if (fileStat.size > 1000000000) {
                    try {
                        const { execSync } = require('child_process');
                        console.log(`📦 [UNZIP-TAR] Ejecutando tar.exe nativo de Windows para ZIP64 en ${extractTargetDir}...`);
                        if (activeDownloads[model]) {
                            activeDownloads[model].speed = 'Extrayendo con tar.exe ZIP64...';
                        }
                        execSync(`tar.exe -xf "${tempFile}" -C "${extractTargetDir}"`, { stdio: 'ignore', windowsHide: true });
                        unzipped = true;
                        console.log(`✅ [UNZIP-TAR] Extracción ZIP64 completada con éxito.`);
                    } catch (tarErr) {
                        console.warn(`⚠️ [UNZIP-TAR] Falló tar.exe (${tarErr.message}), intentando fallback con AdmZip...`);
                    }
                }

                // 2. Fallback estándar con AdmZip
                if (!unzipped) {
                    const AdmZip = require('adm-zip');
                    const zip = new AdmZip(tempFile);
                    zip.extractAllTo(extractTargetDir, true);
                    unzipped = true;
                    console.log(`✅ [UNZIP-ADMZIP] Extracción completada para ${model}.`);
                }

                try {
                    await fsPromises.rm(tempFile, { force: true });
                    console.log(`🗑️ [UNZIP] Archivo temporal ZIP eliminado correctamente.`);
                } catch (unlinkErr) {
                    console.warn(`⚠️ [UNZIP] No se pudo borrar el ZIP temporal ${tempFile}:`, unlinkErr.message);
                }
                console.log(`✅ [DOWNLOAD] Extracción física completada para ${model}.`);
            }

            if (activeDownloads[model]) {
                activeDownloads[model].status = 'completed';
                activeDownloads[model].progress = 100;
                activeDownloads[model].speed = 'Instalación completada';
                activeDownloads[model].downloaded = activeDownloads[model].total || '2.75 GB';
            }

            success = true;
            break; // Salir del bucle de urls al tener éxito
        } catch (attemptErr) {
            lastError = attemptErr;
            console.error(`⚠️ [DOWNLOAD-ATTEMPT] Intento fallido para ${model} desde ${currentUrl}:`, attemptErr.message);
            // Murphy Cleanup: Asegurar que el archivo temporal no quede corrupto
            try {
                if (fs.existsSync(tempFile)) {
                    await fsPromises.rm(tempFile, { force: true });
                }
            } catch (cleanupErr) { }
        }
    }

    if (!success) {
        console.error(`❌ [DOWNLOAD-FATAL] Fallaron todas las URLs de descarga para ${model}:`, lastError ? lastError.message : 'Desconocido');
        if (activeDownloads[model]) {
            activeDownloads[model].status = 'failed';
            activeDownloads[model].error = lastError ? lastError.message : 'Error desconocido de conexión';
        }
    }

    delete activeAbortControllers[model];

    // Retener el estado durante 60 segundos para garantizar que cualquier polling del cliente capture el 100% y finalización
    setTimeout(() => {
        delete activeDownloads[model];
    }, 60000);
}


// Historial y Telemetrías de Auditoría
app.get('/api/session-history', (req, res) => {
    try {
        const hwId = generateHardwareFingerprint();
        const offlineCheck = validateOfflineToken(hwId);
        const activeEmail = (offlineCheck.success && offlineCheck.email) ? offlineCheck.email.toLowerCase().trim() : null;

        const historyPath = path.join(__dirname, '..', 'storage', 'telemetry-queue.json');
        if (fs.existsSync(historyPath)) {
            const raw = fs.readFileSync(historyPath, 'utf8');
            let data = [];
            try { data = JSON.parse(raw); } catch (e) { }

            if (Array.isArray(data)) {
                // Filtrar por el email del usuario activo actual
                const filteredData = data.filter(session => {
                    if (!activeEmail) return false;
                    return session.user_email && session.user_email.toLowerCase().trim() === activeEmail;
                });

                // Devolver cada campo individualmente para columnas separadas en la UI
                const formattedHistory = filteredData.map(session => ({
                    timestamp: session.timestamp_formatted || new Date(session.sessionId).toLocaleString(),
                    duration_mins: session.duration_mins || 0,
                    users_connected: session.users_connected || 0,
                    subusers_connected: session.subusers_connected || 0,
                    filters_used: session.filters_used || 0,
                    msg_count: session.msg_count || 0,
                    text_msg_count: session.text_msg_count || 0,
                    audio_msg_count: session.audio_msg_count || 0,
                    trigger_count: session.trigger_count || 0,
                    hermes_msg_count: session.hermes_msg_count || 0,
                    photos_taken: session.photos_taken || 0,
                    translations_used: Array.isArray(session.translations_used) && session.translations_used.length ? session.translations_used.join(', ') : '-',
                    languages: Array.isArray(session.languages) && session.languages.length ? session.languages.join(', ') : '-',
                    synced: session.synced || false
                }));
                return res.json({ success: true, history: formattedHistory.reverse() });
            }
        }
    } catch (e) {
        console.error("❌ Error leyendo historial de sesiones:", e.message);
    }

    // Fallback vacío
    res.json({ success: true, history: [] });
});

// 8. Recuperar Contraseña (SMTP vía Aruba API)
app.post('/api/recover-password', async (req, res) => {
    try {
        const { email, lang } = req.body;
        console.log(`🌐 [API REAL] Solicitud de recuperación de contraseña para: ${email} (Idioma: ${lang || 'es'})`);
        const response = await axios.post(`${API_URL}?action=recover_password`, { email, lang }, axiosConfig);
        res.status(response.data.success ? 200 : 400).json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Error de conexión con Aruba MySQL." });
    }
});

// 9. Modificar Contraseña (Desde Ajustes Modular)
app.post('/api/change-password', async (req, res) => {
    try {
        const { email, oldPassword, newPassword } = req.body;
        console.log(`🌐 [API REAL] Cambio de contraseña para: ${email}`);
        const response = await axios.post(`${API_URL}?action=change_password`, { email, old_password: oldPassword, new_password: newPassword }, axiosConfig);
        res.status(response.data.success ? 200 : 400).json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Error de conexión con Aruba MySQL." });
    }
});

// 9b. Eliminar Cuenta (Desde Ajustes Modular)
app.post('/api/delete-account', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`🌐 [API REAL] Eliminación de cuenta para: ${email}`);
        const response = await axios.post(`${API_URL}?action=delete_account`, { email, password }, axiosConfig);
        res.status(response.data.success ? 200 : 400).json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Error de conexión con Aruba MySQL." });
    }
});

// 10. Consultar Expiración de Licencia en Tiempo Real (Desde Dashboard)
app.get('/api/license-expiry', async (req, res) => {
    const licenseKey = req.query.licenseKey;
    if (!licenseKey) return res.status(400).json({ success: false, error: "Falta licenseKey" });

    try {
        const { getLicenseExpiry } = require('./db-connector');
        const rawExpiry = await getLicenseExpiry(licenseKey);
        if (rawExpiry) {
            const expirationDate = new Date(rawExpiry).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            return res.json({ success: true, expiration_date: expirationDate });
        }

        // Fallback offline token expiry
        const { generateHardwareFingerprint } = require('./mac-fingerprint');
        const hwId = generateHardwareFingerprint();
        const { validateOfflineToken } = require('./license-manager');
        const offlineCheck = validateOfflineToken(hwId);
        if (offlineCheck.success && offlineCheck.expirationDate) {
            const reqKey = licenseKey ? String(licenseKey).toUpperCase().trim() : '';
            const tokenKey = offlineCheck.licenseKey ? String(offlineCheck.licenseKey).toUpperCase().trim() : '';
            if (reqKey === tokenKey) {
                return res.json({ success: true, expiration_date: offlineCheck.expirationDate });
            }
        }

        res.json({ success: false, error: "No se pudo recuperar la fecha" });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});


const PORT = process.env.PORT || 3000;
const serverInstance = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor de Launchpad independiente en http://localhost:${PORT}`);
});
