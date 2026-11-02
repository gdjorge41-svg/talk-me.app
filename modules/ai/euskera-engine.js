/**
 * 🎙️ Euskera Transcription Engine - Edición Industrial (v60.900)
 * 
 * Motor: whisper-server (Inferencia vía API para mínima latencia)
 * Modelo: ggml-base-eu.bin (Pre-cargado en RAM)
 * Estrategia: Comunicación vía HTTP local para evitar el lag de carga del modelo.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

class EuskeraEngine {
    constructor() {
        this.isReady = false;
        this.modelPath = path.join(__dirname, '..', '..', 'storage', 'models', 'whisper', 'ggml-base-eu.bin');
        this.cliPath = path.join(__dirname, '..', '..', 'bin', 'whisper', 'Release', 'whisper-cli.exe');
        const os = require('os');
        this.tempDir = process.env.USER_DATA_PATH 
            ? path.join(process.env.USER_DATA_PATH, 'storage', 'temp') 
            : path.join(os.tmpdir(), 'talkme-temp');
        this.serverUrl = "http://127.0.0.1:8080/inference";
    }

    async init() {
        if (this.isReady) return;
        
        console.log(`🧠 [EUSKERA-ENGINE] Sincronizando con whisper-server...`);
        
        // El servidor se gestiona externamente o mediante un script de inicio
        // Aquí solo validamos que los componentes existan para el modo Fallback (CLI)
        if (!fs.existsSync(this.modelPath) || !fs.existsSync(this.cliPath)) {
            console.warn(`⚠️ [EUSKERA-ENGINE] Faltan componentes para modo CLI. Asegúrese de que el servidor esté activo.`);
        }

        try {
            if (!fs.existsSync(this.tempDir)) {
                fs.mkdirSync(this.tempDir, { recursive: true });
            }
        } catch (_) {}
        
        this.isReady = true;
        console.log('✅ [EUSKERA-ENGINE] Motor whisper.cpp (Modo Alta Velocidad) listo.');
    }

    getModelPathForLang(lang) {
        const whisperDir = path.join(__dirname, '..', '..', 'storage', 'models', 'whisper');
        if (lang === 'gl' || lang === 'galician') {
            const glModel = path.join(whisperDir, 'ggml-base-gl.bin');
            if (fs.existsSync(glModel)) return glModel;
        }
        const euModel = path.join(whisperDir, 'ggml-base-eu.bin');
        if (fs.existsSync(euModel)) return euModel;
        const baseModel = path.join(whisperDir, 'ggml-base.bin');
        if (fs.existsSync(baseModel)) return baseModel;
        return path.join(whisperDir, lang === 'gl' ? 'ggml-base-gl.bin' : 'ggml-base-eu.bin');
    }

    async transcribe(audioBuffer, lang = 'eu', isPartial = false) {
        const isEu = (lang === 'eu' || lang === 'eus' || lang === 'basque');
        const isGl = (lang === 'gl' || lang === 'glg' || lang === 'galician');
        if (!isEu && !isGl) return '';

        const targetWhisperLang = isGl ? 'gl' : 'eu';
        const modelPath = this.getModelPathForLang(targetWhisperLang);

        if (!this.isReady) await this.init();

        const taskId = Math.random().toString(36).substring(7);
        const tempWav = path.join(this.tempDir, `task_${taskId}.wav`);

        try {
            const nodeBuffer = Buffer.from(audioBuffer);
            const trimmedBuffer = this.trimSilence(nodeBuffer, 50);
            
            // Murphy Check: En inferencias parciales requerimos al menos 0.25s (8000 bytes) para evitar alucinaciones en silencio
            const minBytes = isPartial ? 8000 : 3200;
            if (trimmedBuffer.length < minBytes) return "";

            const wavWithHeader = this.addWavHeader(trimmedBuffer, 16000);
            await writeFileAsync(tempWav, wavWithHeader);

            let text = "";
            
            // INTENTO 1: Vía Servidor (Latencia < 100ms)
            try {
                // Murphy Shield: Timeout estricto en curl para evitar congelamiento de promesas
                const maxTimeSec = isPartial ? 4 : 15;
                const curlCmd = `curl -s --connect-timeout 1 --max-time ${maxTimeSec} -X POST "${this.serverUrl}" -H "Content-Type: multipart/form-data" -F "file=@${tempWav}" -F "language=${targetWhisperLang}" -F "temperature=0" -F "response_format=json"`;
                const { stdout } = await execAsync(curlCmd);
                const response = JSON.parse(stdout);
                text = response.text || "";
            } catch (serverError) {
                // Si es parcial y el servidor HTTP no responde, abortar inmediatamente para no saturar CPU con CLI
                if (isPartial) {
                    return "";
                }
                console.warn(`⚠️ [EUSKERA-ENGINE] Servidor no responde, usando Fallback CLI (Lento)...`);
                // FALLBACK: Vía CLI (Latencia ~2s por carga de modelo)
                const cliCmd = `"${this.cliPath}" -m "${modelPath}" -f "${tempWav}" -l ${targetWhisperLang} -nt -np`;
                const { stdout } = await execAsync(cliCmd);
                text = stdout;
            }

            // Limpieza estricta de marcas de ruido y alucinaciones de Whisper: [BLANK_AUDIO], (musika), etc.
            text = text.trim()
                .replace(/\[.*?\]/g, '')
                .replace(/\(.*?\)/g, '')
                .replace(/\*.*?\*/g, '')
                .replace(/subt[íi]tulos?\s+por\b.*/gi, '')
                .trim();
            if (!text || text.length < 2) return "";

            return isEu ? this.applyNormalizations(text) : text.charAt(0).toUpperCase() + text.slice(1).replace(/\.+$/, "").trim();
        } catch (error) {
            console.error('❌ [EUSKERA-ENGINE] Error crítico en transcripción:', error);
            return "";
        } finally {
            if (fs.existsSync(tempWav)) {
                await unlinkAsync(tempWav).catch(() => {});
            }
        }
    }

    applyNormalizations(text) {
        let t = text;
        t = t.replace(/2ten/gi, 'entzuten'); 
        t = t.replace(/entxuten/gi, 'entzuten');
        t = t.replace(/ch/gi, 'tx');
        t = t.replace(/Ch/g, 'Tx');
        t = t.replace(/([^k])c/gi, '$1k');
        t = t.replace(/\bca/gi, 'ka');
        t = t.replace(/\bco/gi, 'ko');
        t = t.replace(/\bcu/gi, 'ku');
        t = t.replace(/v/gi, 'b');
        
        t = t.replace(/\s+/g, ' ');
        
        // [v60.955] Limpieza de puntuación final solicitada por el usuario
        t = t.replace(/\.+$/, ""); // Eliminar uno o más puntos al final
        
        if (t.length > 1) {
            t = t.charAt(0).toUpperCase() + t.slice(1);
        }
        return t.trim();
    }

    trimSilence(buffer, threshold = 50) {
        const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
        let start = 0;
        let end = int16Array.length - 1;
        while (start < int16Array.length && Math.abs(int16Array[start]) < threshold) start++;
        while (end > start && Math.abs(int16Array[end]) < threshold) end--;
        return buffer.slice(start * 2, (end + 1) * 2);
    }

    addWavHeader(buffer, sampleRate = 16000) {
        const wavHeader = Buffer.alloc(44);
        wavHeader.write('RIFF', 0);
        wavHeader.writeUInt32LE(36 + buffer.length, 4);
        wavHeader.write('WAVE', 8);
        wavHeader.write('fmt ', 12);
        wavHeader.writeUInt32LE(16, 16);
        wavHeader.writeUInt16LE(1, 20); // PCM
        wavHeader.writeUInt16LE(1, 22); // Mono
        wavHeader.writeUInt32LE(sampleRate, 24);
        wavHeader.writeUInt32LE(sampleRate * 2, 28); // Byte rate
        wavHeader.writeUInt16LE(2, 32); // Block align
        wavHeader.writeUInt16LE(16, 34); // Bits per sample
        wavHeader.write('data', 36);
        wavHeader.writeUInt32LE(buffer.length, 40);
        return Buffer.concat([wavHeader, buffer]);
    }
}

const euskeraEngine = new EuskeraEngine();
module.exports = { euskeraEngine };
