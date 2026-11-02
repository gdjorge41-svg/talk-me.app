/**
 * 🎙️ Whisper Transcription Engine - Euskera Carril (v60.1)
 * 
 * Basado en @xenova/transformers (ONNX Runtime).
 * Utiliza el modelo Whisper-Tiny para transcripción local ultrarrápida.
 */

class WhisperEngine {
    constructor() {
        this.pipeline = null;
        // [v60.180] MIGRACIÓN A WAV2VEC2: Fiabilidad total para Euskera
        this.modelName = 'Xenova/wav2vec2-large-xlsr-53-basque'; 
        this.initializing = false;
        this.isReady = false;
    }

    /**
     * Inicializa el motor Wav2Vec2 (Vicomtech).
     */
    async init() {
        if (this.isReady) return;
        if (this.initializing) {
            while (this.initializing) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        }
        this.initializing = true;
        
        console.log(`🧠 [EUSKERA-ENGINE] Desplegando motor QUIRÚRGICO: ${this.modelName}...`);
        
        try {
            const { pipeline, env } = await import('@xenova/transformers');
            
            const path = require('path');
            const modelsDir = path.join(__dirname, '..', '..', 'storage', 'models');
            env.localModelPath = modelsDir;
            env.cacheDir = modelsDir;
            env.allowRemoteModels = true;
            
            // Wav2Vec2 funciona mejor sin quantizar para no perder fonemas
            this.pipeline = await pipeline('automatic-speech-recognition', this.modelName, {
                quantized: false,
                onnx_options: {
                    intra_op_num_threads: 2,
                    inter_op_num_threads: 2
                }
            });

            this.isReady = true;
            this.initializing = false;
            console.log('✅ [EUSKERA-ENGINE] Motor Wav2Vec2 (Euskera Puro) listo.');
        } catch (error) {
            this.initializing = false;
            console.error('❌ [EUSKERA-ENGINE] Error crítico en arranque:', error);
            throw error;
        }
    }

    /**
     * Transcripción literal con Wav2Vec2.
     */
    async transcribe(audioBuffer, lang = 'eu') {
        if (!this.isReady) {
            await this.init();
        }

        try {
            const trimmedBuffer = this.trimSilence(audioBuffer, 150); 
            if (trimmedBuffer.length < 3200) return ""; 

            // Wav2Vec2 no necesita acolchado de silencio, es muy robusto al inicio
            const float32Data = this.pcm16ToFloat32(trimmedBuffer);

            // Wav2Vec2 es directo: audio -> texto
            const output = await this.pipeline(float32Data);

            return output.text.trim().toLowerCase();
        } catch (error) {
            console.error('❌ [EUSKERA-ENGINE] Error en inferencia Wav2Vec2:', error);
            return "";
        }
    }

    /**
     * Elimina silencios al inicio y final del buffer para optimizar la IA.
     */
    trimSilence(buffer, threshold = 200) {
        const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
        let start = 0;
        let end = int16Array.length - 1;

        while (start < int16Array.length && Math.abs(int16Array[start]) < threshold) start++;
        while (end > start && Math.abs(int16Array[end]) < threshold) end--;

        return Buffer.from(int16Array.slice(start, end + 1).buffer);
    }

    /**
     * Convierte PCM 16-bit a Float32 (-1.0 a 1.0).
     */
    pcm16ToFloat32(buffer) {
        const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
        const float32Array = new Float32Array(int16Array.length);
        
        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
        }
        
        return float32Array;
    }
}

// Singleton
const instance = new WhisperEngine();
module.exports = instance;
