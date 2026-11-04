/**
 * 🛡️ Verificador de Integridad Pre-Build para Talk.me Desktop
 * talk-me.app_electron/check-build-integrity.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 [INTEGRITY-CHECK] Iniciando auditoría pre-empaquetado...');

let hasErrors = false;

const piperBin = fs.existsSync(path.join(__dirname, 'app_build', 'bin', 'tts', 'Release', 'piper.exe'))
    ? path.join(__dirname, 'app_build', 'bin', 'tts', 'Release', 'piper.exe')
    : path.join(__dirname, 'app_build', 'bin', 'tts', 'piper.exe');

// 1. Verificar existencia de binarios nativos indispensables según la plataforma
const isWin = process.platform === 'win32';
const requiredFiles = [
    path.join(__dirname, 'app_build', 'main.js'),
    path.join(__dirname, 'app_build', 'preload.js'),
    path.join(__dirname, 'app_build', 'server.js'),
    path.join(__dirname, 'app_build', 'wifi-detector.js'),
    path.join(__dirname, 'app_build', 'cert-manager.js')
];

if (isWin) {
    requiredFiles.push(path.join(__dirname, 'app_build', 'bin', 'translate', 'Release', 'madlad-translator.exe'));
    requiredFiles.push(piperBin);
} else {
    // En macOS o Linux, advertir si los binarios .exe están ausentes pero no bloquear si el runtime cuenta con fallbacks
    const macMadlad = path.join(__dirname, 'app_build', 'bin', 'translate', 'Release', 'madlad-translator.exe');
    if (!fs.existsSync(macMadlad)) {
        console.warn('ℹ️ [AVISO] Binario madlad-translator no presente para esta plataforma. Se activará fallback defensivo de traducción.');
    } else {
        console.log(`✔️ [OK] Archivo verificado: ${path.basename(macMadlad)}`);
    }
}

for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
        console.error(`❌ [ERROR] Archivo crítico ausente en staging: ${file}`);
        hasErrors = true;
    } else {
        console.log(`✔️ [OK] Archivo verificado: ${path.basename(file)}`);
    }
}

// 2. Verificar que el switch maestro de Hermes esté activo en overrides
const hermesFile = path.join(__dirname, 'app_build', 'public', 'js', 'utils', 'hermes-tts.js');
if (fs.existsSync(hermesFile)) {
    const content = fs.readFileSync(hermesFile, 'utf8');
    if (!content.includes('masterEnabled')) {
        console.error('❌ [ERROR] El switch maestro absoluto (masterEnabled) no está presente en hermes-tts.js de app_build.');
        hasErrors = true;
    } else {
        console.log('✔️ [OK] HermesTTS master switch verificado en staging.');
    }
}

// 3. Verificar que la soberanía de Master esté protegida en server.js
const serverFile = path.join(__dirname, 'app_build', 'server.js');
if (fs.existsSync(serverFile)) {
    const content = fs.readFileSync(serverFile, 'utf8');
    if (!content.includes('isElectronHost') || !content.includes('ELECTRON-SOVEREIGNTY')) {
        console.error('❌ [ERROR] La soberanía del Master de Electron no está presente en server.js de app_build.');
        hasErrors = true;
    } else {
        console.log('✔️ [OK] Soberanía incondicional de Master verificada en server.js.');
    }
}

// 4. Verificar presencia de modelos de Vosk
const voskEs = path.join(__dirname, 'app_build', 'vosk-model-small-es-0.42');
if (!fs.existsSync(voskEs)) {
    console.warn('⚠️ [AVISO] Modelo Vosk Español no encontrado en app_build.');
} else {
    console.log('✔️ [OK] Modelo Vosk Español verificado.');
}

// 5. Verificar empaquetado ligero (Descarga On-Demand de Traducción ~400 MB)
const translateModelBin = path.join(__dirname, 'app_build', 'storage', 'models', 'translate', 'madlad400-3b-int8', 'model.bin');
if (fs.existsSync(translateModelBin)) {
    console.warn('⚠️ [ALERTA DE TAMAÑO] El modelo de traducción MADLAD (2.8 GB) está presente en staging. El instalador superará 1.5 GB.');
} else {
    console.log('✔️ [OK] Modelo de traducción excluido correctamente (Instalador ligero ~400 MB confirmado).');
}

if (hasErrors) {
    console.error('🚨 [FALLO] Auditoría de integridad fallida. Abortando compilación para prevenir artefacto corrupto.');
    process.exit(1);
} else {
    console.log('🎉 [ÉXITO] Todos los puntos de control de integridad pasaron satisfactoriamente.');
    process.exit(0);
}
