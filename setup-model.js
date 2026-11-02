const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Talk-me - Configuración de modelos Vosk (Multilingüe)
 */
const MODELS = {
    'es': {
        url: 'https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip',
        path: path.join(__dirname, 'vosk-model-small-es-0.42')
    },
    'en': {
        url: 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip',
        path: path.join(__dirname, 'vosk-model-small-en-us-0.15')
    }
};

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const protocol = url.startsWith('https') ? https : http;

        console.log(`📥 Descargando: ${url}`);

        const request = protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(dest);
                return download(response.headers.location, dest).then(resolve).catch(reject);
            }

            const total = parseInt(response.headers['content-length'], 10);
            let downloaded = 0;

            response.on('data', (chunk) => {
                downloaded += chunk.length;
                if (total) {
                    const pct = ((downloaded / total) * 100).toFixed(1);
                    process.stdout.write(`\r   Progreso: ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)}MB)      `);
                }
            });

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log('\n✅ OK');
                resolve();
            });
        });

        request.on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function main() {
    console.log('🎤 Talk-me - Instalador de Modelos de Voz\n');

    for (const [lang, config] of Object.entries(MODELS)) {
        const ZIP_FILE = config.path + '.zip';
        const MODEL_DIR = config.path;

        if (fs.existsSync(MODEL_DIR)) {
            console.log(`✅ El modelo [${lang.toUpperCase()}] ya está presente.`);
            continue;
        }

        try {
            await download(config.url, ZIP_FILE);
            console.log(`📦 Extrayendo ${lang}...`);
            execSync(`powershell -Command "Expand-Archive -Path '${ZIP_FILE}' -DestinationPath '${__dirname}' -Force"`, { stdio: 'inherit' });
            fs.unlinkSync(ZIP_FILE);
            console.log(`✅ ${lang.toUpperCase()} Instalado.\n`);
        } catch (e) {
            console.error(`❌ Error en ${lang}:`, e.message);
        }
    }
    
    // --- 🧠 SECCIÓN BABEL: MODELOS NEURONALES (Whisper & NLLB) ---
    console.log('\n🧠 Talk-me - Configurando Cerebro IA (Babel & Whisper)...');
    try {
        const modelsDir = path.join(__dirname, 'storage', 'models');
        if (!fs.existsSync(modelsDir)) {
            console.log(`📁 Creando directorio de modelos: ${modelsDir}`);
            fs.mkdirSync(modelsDir, { recursive: true });
        }

        // --- 🌍 GOOGLE MADLAD-400 (INT8 - CTranslate2 Comercial Apache 2.0) ---
        const madladDir = path.join(modelsDir, 'translate', 'madlad400-3b-int8');
        const madladBin = path.join(madladDir, 'model.bin');
        if (fs.existsSync(madladBin)) {
            console.log('✅ Google MADLAD-400 INT8 (Traductor Profesional Comercial) ya está presente en storage.');
        } else {
            console.log('⚠️ [AI-SETUP] No se encontró model.bin en storage/models/translate/madlad400-3b-int8.');
            console.log('   Por favor, asegúrese de ejecutar el script de aprovisionamiento offline.');
        }


        // --- 🎙️ WHISPER.CPP EUSKERA (GGUF/GGML) ---
        const whisperEuDir = path.join(modelsDir, 'whisper');
        if (!fs.existsSync(whisperEuDir)) fs.mkdirSync(whisperEuDir, { recursive: true });
        
        const whisperEuFile = path.join(whisperEuDir, 'ggml-base-eu.bin');
        if (!fs.existsSync(whisperEuFile)) {
            console.log('\n📦 Descargando Motor Euskera de alto rendimiento (GGML)...');
            const WHISPER_EU_URL = 'https://huggingface.co/jonatane/whisper-euskaraz/resolve/main/ggml-base-eu.bin';
            await download(WHISPER_EU_URL, whisperEuFile);
            console.log('✅ Motor Euskera instalado.');
        } else {
            console.log('✅ Motor Euskera (GGML) ya presente.');
        }

    } catch (e) {
        console.warn('\n⚠️ [AI-SETUP] Error crítico en la configuración de modelos neuronales.');
        console.error(e);
    }

    console.log('\n🚀 Finalizado. Ejecuta iniciar_servidor.bat');
}

main();
