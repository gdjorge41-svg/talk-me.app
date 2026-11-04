/**
 * 🕒 SMPTE LTC AudioWorklet Processor (v60.Elite)
 * 
 * Decodificador Bi-Phase Mark (BPM) de grado industrial.
 * Descentraliza la carga de CPU y elimina el streaming de audio.
 */

class SMPTEProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffer = new Float32Array(128);
        this.sampleRate = 44100;
        
        // Estado del decodificador
        this.lastState = false;
        this.samplesSinceLastTransition = 0;
        this.bitBuffer = [];
        this.isWaitingForSecondHalf = false;
        
        // Parámetros adaptativos
        this.samplesPerBit = 0;
        this.peak = 0;
        
        // Frame actual en construcción
        this.frameBits = new Uint8Array(80);
        this.frameIndex = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const samples = input[0];
        this.sampleRate = globalThis.sampleRate || 44100;

        const NOISE_THRESHOLD = 0.1; // [v60.Elite] Umbral de histeresis para ignorar hum/ruido

        for (let i = 0; i < samples.length; i++) {
            const sample = samples[i];
            const absSample = Math.abs(sample);
            if (absSample > this.peak) this.peak = absSample;

            // [v60.Elite] TRIGGER DE SCHMIDT (Histeresis)
            // Solo cambiamos de estado si la señal cruza con fuerza los umbrales
            let currentState = this.lastState;
            if (sample > NOISE_THRESHOLD) {
                currentState = true;
            } else if (sample < -NOISE_THRESHOLD) {
                currentState = false;
            }

            if (currentState !== this.lastState) {
                this.handleTransition(this.samplesSinceLastTransition);
                this.samplesSinceLastTransition = 0;
                this.lastState = currentState;
            } else {
                this.samplesSinceLastTransition++;
            }
        }

        // Auto-reset del peak para telemetría
        if (Math.random() < 0.01) {
            this.port.postMessage({ type: 'telemetry', peak: this.peak });
            // Si el pico es demasiado bajo, reseteamos el buffer de bits para evitar fantasmas
            if (this.peak < NOISE_THRESHOLD) {
                this.bitBuffer = [];
                this.isWaitingForSecondHalf = false;
            }
            this.peak = 0;
        }

        return true;
    }

    handleTransition(duration) {
        // [v60.Elite] Lógica BPM: 
        // Un '0' es una transición larga (1 bit period).
        // Un '1' son dos transiciones cortas (0.5 bit period).
        
        if (this.samplesPerBit === 0) {
            this.samplesPerBit = this.sampleRate / (25 * 80); // Asumimos 25fps inicial
        }

        // [v60.Elite] DETECCIÓN DE SILENCIO / DISCONTINUIDAD
        // Un periodo de transición SMPTE válido nunca supera unas pocas decenas de muestras.
        // Si el periodo es excesivo (ej. > 150 muestras), interpretamos que la señal se detuvo
        // y se reanudó. Descartamos la adaptación de samplesPerBit para evitar la corrupción del reloj.
        const maxExpectedDuration = Math.max(150, this.samplesPerBit * 3.0);
        if (duration > maxExpectedDuration) {
            this.bitBuffer = [];
            this.isWaitingForSecondHalf = false;
            return;
        }

        const isShort = duration < this.samplesPerBit * 0.75;

        if (isShort) {
            if (this.isWaitingForSecondHalf) {
                this.pushBit(1);
                this.isWaitingForSecondHalf = false;
                // Ajustar el reloj de bits
                this.samplesPerBit = (this.samplesPerBit * 0.95) + (duration * 2 * 0.05);
            } else {
                this.isWaitingForSecondHalf = true;
            }
        } else {
            this.pushBit(0);
            this.isWaitingForSecondHalf = false;
            // Ajustar el reloj de bits
            this.samplesPerBit = (this.samplesPerBit * 0.95) + (duration * 0.05);
        }
    }

    pushBit(bit) {
        this.bitBuffer.push(bit);
        if (this.bitBuffer.length > 80) this.bitBuffer.shift();

        // Verificar Sync Word (0011111111111101) al final del frame
        if (this.checkSync()) {
            this.decodeFrame();
        }
    }

    checkSync() {
        if (this.bitBuffer.length < 80) return false;
        // Los últimos 16 bits deben ser el Sync Word
        const sync = this.bitBuffer.slice(-16).join('');
        return sync === "0011111111111101" || sync === "1011111111111100"; // Dirección normal o reversa
    }

    decodeFrame() {
        const b = this.bitBuffer;
        
        // Mapeo de bits SMPTE LTC (Litle Endian nibbles)
        const getInt = (start, len) => {
            let val = 0;
            for (let i = 0; i < len; i++) {
                if (b[start + i]) val |= (1 << i);
            }
            return val;
        };

        const f = getInt(0, 4) + getInt(8, 2) * 10;
        const s = getInt(16, 4) + getInt(24, 3) * 10;
        const m = getInt(32, 4) + getInt(40, 3) * 10;
        const h = getInt(48, 4) + getInt(56, 2) * 10;

        const tc = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
        
        this.port.postMessage({
            type: 'timecode',
            timecode: tc,
            hours: h,
            minutes: m,
            seconds: s,
            frames: f,
            quality: 1.0
        });
    }
}

console.log('🕒 [SMPTE-Processor] Registered successfully.');
registerProcessor('smpte-processor', SMPTEProcessor);
