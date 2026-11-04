/**
 * 🛠️ AudioUtils - Utilidades de procesamiento de señales de audio
 */

export function downsampleBuffer(buffer, fromRate, toRate) {
    if (!buffer || buffer.length === 0) return new Float32Array(0);
    if (fromRate === toRate) return buffer;
    const sampleRateRatio = fromRate / toRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    // [v60.ELITE FIX - Sol.7] Interpolación lineal para eliminar jitter de decimación fraccional
    // El algoritmo clásico de promedios enteros introduce aliasing con ratios como 44100/16000=2.75625.
    // La interpolación lineal suaviza la transición eliminando el ruido metálico parasitario.
    for (let i = 0; i < newLength; i++) {
        const srcIdx = i * sampleRateRatio;
        const srcFloor = Math.floor(srcIdx);
        const srcCeil = Math.min(srcFloor + 1, buffer.length - 1);
        const frac = srcIdx - srcFloor;
        result[i] = buffer[srcFloor] * (1 - frac) + buffer[srcCeil] * frac;
    }
    return result;
}

export function float32ToInt16(float32Array, gain = 1.0) {
    const l = float32Array.length;
    const buf = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        // Aplicamos la ganancia antes de limitar (clipping)
        const s = Math.max(-1, Math.min(1, float32Array[i] * gain));
        buf[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return buf;
}

export function concatenateFloat32Arrays(arrays) {
    let totalLength = 0;
    for (const arr of arrays) totalLength += arr.length;
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}

export function pcmToWav(pcmData, sampleRate) {
    let pcmBytes;
    if (pcmData instanceof ArrayBuffer) {
        pcmBytes = new Uint8Array(pcmData);
    } else if (pcmData.buffer instanceof ArrayBuffer) {
        pcmBytes = new Uint8Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength);
    } else {
        pcmBytes = new Uint8Array(pcmData);
    }

    const byteLength = pcmBytes.byteLength;
    const buffer = new ArrayBuffer(44 + byteLength);
    const view = new DataView(buffer);
    const sRate = Math.round(sampleRate);

    function writeString(offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + byteLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sRate, true);
    view.setUint32(28, sRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, byteLength, true);

    const wavBody = new Uint8Array(buffer, 44);
    wavBody.set(pcmBytes);

    return buffer;
}
