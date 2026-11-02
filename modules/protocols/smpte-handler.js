const { Decoder } = require('linear-timecode');
const { EventEmitter } = require('events');

/**
 * ⏱️ SmpteHandler - Decodificador de LTC (Linear Timecode) para Triggers IN
 */
class SmpteHandler extends EventEmitter {
    constructor() {
        super();
        this.decoder = null;
        this.lastTimecode = "";
        this.signalActive = false;
        this.signalTimeout = null;
    }

    /**
     * Inicia el decodificador con la frecuencia de muestreo detectada
     * @param {number} sampleRate 
     */
    start(sampleRate = 44100) {
        if (this.decoder) this.stop();
        this.decoder = new Decoder(sampleRate);

        // Evento cuando se decodifica un frame completo
        this.decoder.on('frame', (frame) => {
            // [v60.Elite] Mapeo resiliente de propiedades (h/m/s/f vs hours/minutes/seconds/frames)
            const h = frame.hours !== undefined ? frame.hours : (frame.h !== undefined ? frame.h : 0);
            const m = frame.minutes !== undefined ? frame.minutes : (frame.m !== undefined ? frame.m : 0);
            const s = frame.seconds !== undefined ? frame.seconds : (frame.s !== undefined ? frame.s : 0);
            const f = frame.frames !== undefined ? frame.frames : (frame.f !== undefined ? frame.f : 0);

            const tc = this.formatTimecode(h, m, s, f);
            
            if (tc !== this.lastTimecode) {
                this.lastTimecode = tc;
                this.emit('timecode', {
                    timecode: tc,
                    hours: h,
                    minutes: m,
                    seconds: s,
                    frames: f
                });
            }

            this.updateSignalStatus(true);
        });

        this.signalActive = false;
    }

    /**
     * Procesa un trozo de audio PCM (Buffer)
     * @param {Buffer} pcmBuffer 
     */
    processAudio(pcmBuffer) {
        if (this.decoder) {
            const samples = pcmBuffer instanceof Buffer ? 
                new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.byteLength / 2) : 
                pcmBuffer;
            this.decoder.decode(samples);
        }
    }

    /**
     * Recibe el audio desde el socket (Int16) y lo procesa
     * @param {Buffer} int16Buffer 
     */
    decodeBuffer(int16Buffer) {
        if (!this.decoder) return;

        try {
            const rawSamples = new Int16Array(
                int16Buffer.buffer, 
                int16Buffer.byteOffset, 
                int16Buffer.byteLength / 2
            );

            // [v60.Elite] PROCESAMIENTO LINEAL DE ALTA SENSIBILIDAD
            let maxVal = 0;
            for (let i = 0; i < rawSamples.length; i++) {
                const abs = Math.abs(rawSamples[i]);
                if (abs > maxVal) maxVal = abs;
            }

            if (maxVal < 400) {
                this.updateSignalStatus(false);
                return;
            }

            // Normalización conservadora (16000) para evitar distorsión de los flancos de bit
            const scalar = 16000 / maxVal;
            const processedSamples = new Int16Array(rawSamples.length);
            
            for (let i = 0; i < rawSamples.length; i++) {
                const val = rawSamples[i] * scalar;
                processedSamples[i] = Math.max(-32768, Math.min(32767, val));
            }

            this.decoder.decode(processedSamples);
            this.updateSignalStatus(true);
            
        } catch (e) {
            console.error('❌ [SMPTE] Error decodificando buffer:', e.message);
        }
    }

    formatTimecode(h, m, s, f) {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
    }

    updateSignalStatus(active) {
        if (active) {
            if (!this.signalActive) {
                this.signalActive = true;
                this.emit('signal-status', { active: true });
            }
            
            // Si pasan 500ms sin frames, consideramos pérdida de señal
            if (this.signalTimeout) clearTimeout(this.signalTimeout);
            this.signalTimeout = setTimeout(() => {
                this.signalActive = false;
                this.emit('signal-status', { active: false });
                this.emit('timecode', { timecode: "--:--:--:--" });
            }, 500);
        }
    }

    stop() {
        if (this.signalTimeout) clearTimeout(this.signalTimeout);
        this.decoder = null;
        this.signalActive = false;
        console.log(`⏱️ [SMPTE] Decodificador detenido.`);
    }
}

module.exports = SmpteHandler;
