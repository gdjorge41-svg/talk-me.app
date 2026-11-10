const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateHardwareFingerprint } = require('./mac-fingerprint');

// Configuración de Criptografía para el Token Local (Offline Grace Period)
const hwSalt = generateHardwareFingerprint() || 'default_sovereign_salt';
const SECRET_ENCRYPTION_KEY = crypto.scryptSync('TALKME_V70_SOVEREIGN_KEY_AES256', hwSalt, 32);

function resolvePrelaunchWritablePath(filename) {
    if (process.env.USER_DATA_PATH) {
        const targetDir = path.join(process.env.USER_DATA_PATH, 'pre-launch');
        try {
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
            return path.join(targetDir, filename);
        } catch (_) { }
    }
    return path.join(__dirname, filename);
}

const TOKEN_PATH = resolvePrelaunchWritablePath('local_license.tok');

const GRACE_PERIOD_DAYS = 37; // 30 Días para suscripciones Anuales
const CLIENT_VERSION = 1;


function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = textParts.join(':');
        const decipher = crypto.createDecipheriv('aes-256-cbc', SECRET_ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return null;
    }
}

/**
 * Genera y guarda un nuevo Token Encriptado cuando hay éxito ONLINE.
 */
function generateOfflineToken(hwId, licenseKey, email = null, userId = null, expirationDate = null, deviceLimit = 1, activeBinders = 1, planType = 'freelance', paymentMode = 'one_time', totalPrice = 0, totalPaid = 0, licenseStatus = 'active', licenseVersion = 1, subscriptionStatus = 'active') {
    const now = new Date();
    // Por defecto para licencias pagadas por completo o de golpe (one_time), exigimos subir telemetría cada 180 días (6 meses)
    let graceEnd = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

    if (expirationDate) {
        const expDate = new Date(expirationDate);
        if (!isNaN(expDate.getTime())) {
            if (paymentMode === 'rent_to_own') {
                // Si el RTO está completado, se trata como perpetua (180 días de gracia). Si no, se limita estrictamente al vencimiento de la cuota.
                if (subscriptionStatus === 'complete') {
                    graceEnd = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
                } else {
                    graceEnd = expDate;
                }
            } else if (paymentMode === 'one_time') {
                // En modo One-Time, respetamos la fecha de expiración/sincronización dinámica provista por el servidor (30 días iniciales o 180 subsiguientes)
                graceEnd = expDate;
            }
        }
    }

    const payload = {
        hwId: hwId,
        licenseKey: licenseKey,
        email: email,
        userId: userId,
        lastUsedDate: now.toISOString(),
        gracePeriodEnd: graceEnd.toISOString(),
        expirationDate: expirationDate, // Guardamos la fecha de expiración real de la base de datos en formato crudo
        strikes: 0, // 0 strikes usados al crear el token fresco
        lastStrikeDate: null,
        deviceLimit: deviceLimit,
        activeBindings: activeBinders,
        planType: planType,
        paymentMode: paymentMode,
        totalPrice: totalPrice,
        totalPaid: totalPaid,
        licenseStatus: licenseStatus,
        licenseVersion: licenseVersion,
        subscriptionStatus: subscriptionStatus
    };

    try {
        fs.writeFileSync(TOKEN_PATH, encrypt(JSON.stringify(payload)));
        console.log(`🔒 Token Offline actualizado. Válido hasta: ${graceEnd.toLocaleDateString()} | Plan: ${planType.toUpperCase()} (${activeBinders}/${deviceLimit}) | Estado: ${licenseStatus} | Versión: ${licenseVersion}`);
    } catch (e) {
        console.error("❌ Error de I/O al escribir el Token Offline:", e.message);
    }
}

/**
 * Valida el Token Encriptado cuando el sistema está OFFLINE.
 */
function validateOfflineToken(currentHwId) {
    if (!fs.existsSync(TOKEN_PATH)) {
        return { success: false, error: "No hay conexión a internet y no existe licencia offline guardada." };
    }

    let encryptedData;
    try {
        encryptedData = fs.readFileSync(TOKEN_PATH, 'utf8');
    } catch (e) {
        return { success: false, error: "Error de lectura en el archivo de licencia: " + e.message };
    }

    const decryptedJson = decrypt(encryptedData);

    if (!decryptedJson) {
        return { success: false, error: "El archivo de licencia está corrupto o manipulado." };
    }

    let tokenData = JSON.parse(decryptedJson);

    // 0. Filtro de Versión Mayor
    const licenseVer = tokenData.licenseVersion || 1;
    if (licenseVer < CLIENT_VERSION) {
        return { success: false, error: "UPGRADE_REQUIRED: Tu licencia pertenece a una versión anterior. Conéctate a internet para actualizar." };
    }

    const now = new Date();
    const lastUsed = new Date(tokenData.lastUsedDate);
    const graceEnd = new Date(tokenData.gracePeriodEnd);

    // 1. Filtro Hardware
    if (tokenData.hwId !== currentHwId) {
        return { success: false, error: "ALERTA: Clonación de hardware detectada. Licencia bloqueada." };
    }

    let isTamperedOrExpired = false;
    let isFullyExpired = false;
    let isMidTermExpired = false;
    let warningCode = null;

    const realExpiration = tokenData.expirationDate ? new Date(tokenData.expirationDate) : null;

    // 2. Filtro Time-Tampering con tolerancia de 15 minutos (900000 milisegundos)
    if (now.getTime() < lastUsed.getTime() - 15 * 60 * 1000) {
        isTamperedOrExpired = true;
        warningCode = 'TAMPER_CLOCK';
        console.error("❌ ALERTA: Reloj del sistema atrasado artificialmente.");
    }

    // 3. Filtro Expiración Real
    if (!isTamperedOrExpired && realExpiration && now.getTime() > realExpiration.getTime()) {
        isFullyExpired = true;
        warningCode = 'EXPIRED';
    }

    // 4. Filtro Expiración de Gracia (Hito de Telemetría)
    if (!isTamperedOrExpired && !isFullyExpired && now.getTime() > graceEnd.getTime()) {
        isMidTermExpired = true;
        warningCode = 'MID_TERM_CHECK';
    }

    const isPenalized = isTamperedOrExpired || isFullyExpired || isMidTermExpired;

    // Procesar penalizaciones si algo falló (máximo una penalización de strike cada 24 horas)
    if (isPenalized) {
        // Excepción para pruebas gratuitas: no conceder strikes de emergencia si ya expiró el mes de prueba
        if (tokenData.licenseStatus === 'trial' && isFullyExpired) {
            return {
                success: false,
                error: "Tu periodo de prueba de 30 días ha finalizado. Conéctate a internet para adquirir una licencia permanente."
            };
        }

        if (tokenData.strikes >= 3) {
            if (isFullyExpired) {
                return { success: false, error: "Has agotado tus 3 usos de emergencia y tu suscripción ha caducado. DEBES conectarte a internet y renovar." };
            } else {
                return { success: false, error: "Has agotado tus 3 usos de emergencia. DEBES conectarte a internet para reactivar el sistema." };
            }
        }

        const lastStrikeTime = tokenData.lastStrikeDate ? new Date(tokenData.lastStrikeDate).getTime() : 0;
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (now.getTime() - lastStrikeTime >= oneDayMs) {
            tokenData.strikes += 1;
            tokenData.lastStrikeDate = now.toISOString();
            console.warn(`⚠️ Penalización offline aplicada. Strikes actuales: ${tokenData.strikes}/3`);
        } else {
            console.warn(`⏳ Penalización offline ignorada por límite de 24 horas. Strikes actuales: ${tokenData.strikes}/3`);
        }
    }

    // Actualizamos SIEMPRE el lastUsedDate para prevenir futuros atrasos de reloj
    tokenData.lastUsedDate = new Date(Math.max(now.getTime(), lastUsed.getTime())).toISOString();

    try {
        fs.writeFileSync(TOKEN_PATH, encrypt(JSON.stringify(tokenData)));
    } catch (e) {
        console.error("❌ Error de I/O al actualizar lastUsedDate en el Token Offline:", e.message);
    }

    return {
        success: true,
        warningCode: warningCode,
        strikesUsed: tokenData.strikes,
        email: tokenData.email,
        userId: tokenData.userId,
        licenseKey: tokenData.licenseKey,
        expirationDate: tokenData.expirationDate,
        deviceLimit: tokenData.deviceLimit || 1,
        activeBindings: tokenData.activeBindings || 1,
        planType: tokenData.planType || 'freelance',
        paymentMode: tokenData.paymentMode || 'one_time',
        totalPrice: tokenData.totalPrice || 0,
        totalPaid: tokenData.totalPaid || 0,
        licenseStatus: tokenData.licenseStatus || 'active',
        subscriptionStatus: tokenData.subscriptionStatus || 'active'
    };
}

module.exports = {
    generateOfflineToken,
    validateOfflineToken
};
