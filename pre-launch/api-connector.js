const axios = require('axios');

// Configuración del Endpoint de la API (Hacia el servidor de Aruba)
// En producción, esto apuntará a tu dominio real: https://tu-dominio.com/talkme_api.php
const API_URL = 'http://31.11.39.205/talkme_api.php'; 
const API_SECRET_KEY = 'HERMES_CADUCEUS_V70_ELITE_PRO';

/**
 * Función para probar la conexión con el Bridge API en Aruba
 */
async function testApiConnection() {
    try {
        console.log("🌐 Iniciando prueba de conexión con la API en Aruba...");
        const response = await axios.get(`${API_URL}?action=status`, {
            headers: { 'X-API-KEY': API_SECRET_KEY },
            timeout: 5000 // 5 segundos de timeout
        });

        if (response.data && response.data.success) {
            console.log("✅ API Conectada. Estado:", response.data.status);
            return true;
        } else {
            console.warn("⚠️ La API respondió pero con error:", response.data);
            return false;
        }
    } catch (error) {
        console.error("❌ Error de red conectando a la API:", error.message);
        return false;
    }
}

/**
 * Valida la licencia enviando el Hardware ID a la API PHP
 * @param {string} hardwareFingerprint 
 */
async function validateLicenseViaApi(hardwareFingerprint) {
    try {
        console.log(`🔐 Validando Hardware ID: ${hardwareFingerprint} a través de la API...`);
        const response = await axios.post(`${API_URL}?action=validate`, {
            hw_id: hardwareFingerprint
        }, {
            headers: { 
                'X-API-KEY': API_SECRET_KEY,
                'Content-Type': 'application/json' 
            }
        });

        const data = response.data;
        if (data.success) {
            console.log("✅ Licencia validada correctamente en la nube.");
            console.dir(data);
            return data;
        } else {
            console.log("🚫 La API rechazó la validación o el HW_ID no existe.");
            return null;
        }
    } catch (error) {
        console.error("❌ Error validando licencia en la API:", error.message);
        throw error;
    }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
    (async () => {
        const isConnected = await testApiConnection();
        if (isConnected) {
            const mockHash = '90d808834aef9846c6587c1f628f963842d9503c2ed6a2d28067cb725d4ee9fc';
            await validateLicenseViaApi(mockHash);
        }
        process.exit(0);
    })();
}

module.exports = { testApiConnection, validateLicenseViaApi };
