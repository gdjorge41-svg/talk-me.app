/**
 * 🗣️ Piper TTS Engine - Síntesis de voz neuronal offline para lenguas minoritarias (Euskera, Gallego)
 * modules/ai/piper-engine.js
 *
 * Principios Críticos de Misión Crítica:
 * 1. CPU Guard: Ejecución estricta en 1 único hilo (--threads 1) para reservar el 80% de CPU a Vosk ASR.
 * 2. Cero IO en Disco: Flujo de audio RAW PCM por stdout transformado a WAV en memoria RAM (Buffer).
 * 3. Prioridad Reducida: os.constants.priority.PRIORITY_BELOW_NORMAL para no competir con el hilo de eventos de Node.js.
 * 4. Watchdog Anti-Cuelgues: Timeout estricto de 3.5 segundos con cancelación de subproceso.
 * 5. Ley de Murphy: Manejo defensivo de fallos con retorno seguro de null (cero caídas de servidor).
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

class PiperEngine {
  constructor() {
    this.binPath = path.resolve(__dirname, '../../bin/tts/Release/piper.exe');
    this.modelsDir = path.resolve(__dirname, '../../storage/models/tts');

    // Mapeo de idiomas soportados localmente
    this.voiceModels = {
      'eu': {
        onnx: path.join(this.modelsDir, 'eu_ES-maider-medium.onnx'),
        json: path.join(this.modelsDir, 'eu_ES-maider-medium.onnx.json'),
        sampleRate: 22050
      }
    };

    this.isSupported = fs.existsSync(this.binPath) && fs.existsSync(this.voiceModels.eu.onnx);
    if (this.isSupported) {
      console.log('🗣️ [PiperEngine] Motor neuronal offline inicializado para Euskera (eu_ES-maider-medium).');
    } else {
      console.warn('⚠️ [PiperEngine] Binario de Piper o modelos no encontrados en el sistema.');
    }
  }

  /**
   * Empaqueta muestras de audio crudo (PCM 16-bit Mono) en formato estándar WAV RIFF en memoria RAM.
   * @param {Buffer} pcmBuffer Buffer con los bytes PCM
   * @param {number} sampleRate Frecuencia de muestreo (22050 Hz)
   * @returns {Buffer} Buffer WAV listo para reproducir en navegador o Web Audio API
   */
  createWavHeader(pcmBuffer, sampleRate = 22050) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);

    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size (16 para PCM)
    header.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
  }

  /**
   * Sintetiza texto a voz en memoria RAM de forma asíncrona y no bloqueante.
   * @param {string} text Texto a sintetizar
   * @param {string} lang Código de idioma base ('eu', 'gl')
   * @returns {Promise<Buffer|null>} Buffer con el audio WAV o null si falla
   */
  synthesize(text, lang = 'eu') {
    return new Promise((resolve) => {
      const baseLang = (lang || 'eu').split('-')[0].toLowerCase();
      const modelConfig = this.voiceModels[baseLang];

      if (!this.isSupported || !modelConfig || !text || !text.trim()) {
        return resolve(null);
      }

      // Sanitizar texto: limitar a 160 caracteres y quitar saltos de línea peligrosos
      const cleanText = text.replace(/[\r\n]+/g, ' ').substring(0, 160).trim();
      if (!cleanText) return resolve(null);

      const t0 = Date.now();
      let resolved = false;

      // Spawn seguro de Piper
      let child = null;
      try {
        child = spawn(this.binPath, [
          '-m', modelConfig.onnx,
          '--output_raw',
          '--threads', '1'
        ], {
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'ignore']
        });

        // Asignar prioridad BelowNormal si está soportado en el SO
        if (child.pid && os.constants.priority && os.constants.priority.PRIORITY_BELOW_NORMAL !== undefined) {
          try {
            os.setPriority(child.pid, os.constants.priority.PRIORITY_BELOW_NORMAL);
          } catch (e) {
            // Ignorar silenciosamente si no hay permisos de prioridad
          }
        }
      } catch (err) {
        console.error('❌ [PiperEngine] Error al iniciar subproceso:', err.message);
        return resolve(null);
      }

      const pcmChunks = [];

      child.stdout.on('data', (chunk) => {
        pcmChunks.push(chunk);
      });

      // Watchdog de seguridad (3.5s) para evitar colgar hilos
      const watchdog = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn('⚠️ [PiperEngine] Watchdog disparado (>3.5s). Abortando síntesis para proteger recursos.');
          try {
            child.kill('SIGKILL');
          } catch (e) {}
          resolve(null);
        }
      }, 3500);

      child.on('error', (err) => {
        clearTimeout(watchdog);
        if (!resolved) {
          resolved = true;
          console.error('❌ [PiperEngine] Error en pipe de subproceso:', err.message);
          resolve(null);
        }
      });

      child.on('close', (code) => {
        clearTimeout(watchdog);
        if (resolved) return;
        resolved = true;

        if (code === 0 && pcmChunks.length > 0) {
          const rawPcm = Buffer.concat(pcmChunks);
          const wavBuffer = this.createWavHeader(rawPcm, modelConfig.sampleRate);
          const elapsed = Date.now() - t0;
          console.log(`🗣️ [PiperEngine] Audio generado con éxito en ${elapsed}ms (${wavBuffer.length} bytes WAV).`);
          resolve(wavBuffer);
        } else {
          console.warn(`⚠️ [PiperEngine] Subproceso terminó con código ${code} sin datos de audio.`);
          resolve(null);
        }
      });

      // Inyectar el texto por stdin
      try {
        child.stdin.write(cleanText + '\n');
        child.stdin.end();
      } catch (err) {
        clearTimeout(watchdog);
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }
    });
  }
}

// Instancia singleton para Talk.me
const piperEngine = new PiperEngine();
module.exports = piperEngine;
