const { machineIdSync } = require('node-machine-id');
const getmac = require('getmac');
const crypto = require('crypto');

/**
 * Genera el Hardware ID único del Master.
 * Combina el Machine ID del SO (inmutable) con la dirección MAC de la tarjeta de red.
 */
function generateHardwareFingerprint() {
    try {
        // 1. Obtener ID inmutable de la máquina base (Windows UUID, Mac Serial, etc.)
        const osId = machineIdSync({ original: true });
        
        // NOTA: Hemos eliminado la dependencia de la MAC porque al desconectar internet (deshabilitar el adaptador), 
        // Windows oculta la MAC y rompía la validación Offline. El OS_ID es suficiente y más seguro.

        // 3. Crear el Hash SHA-256
        const rawFingerprint = `${osId}-TALKME-V70`;
        const hash = crypto.createHash('sha256').update(rawFingerprint).digest('hex');

        console.log("=== TALK-ME SOBERANÍA: HARDWARE FINGERPRINT ===");
        console.log("OS Machine ID:", osId);
        console.log("Fingerprint  :", hash);
        console.log("=================================================");

        return hash;
    } catch (error) {
        console.error("❌ Error generando el Fingerprint de Hardware:", error.message);
        return null;
    }
}

// Ejecutar si se llama directamente desde la consola
if (require.main === module) {
    generateHardwareFingerprint();
}

module.exports = { generateHardwareFingerprint };
