/**
 * Talk.Me AI Engine - Worker Thread (v60.1)
 * 
 * Propósito: Inferencia neuronal asíncrona para Traducción y Whisper.
 * Mantiene la fluidez del servidor principal protegiendo el hilo de audio.
 */

const { parentPort } = require('worker_threads');
const translationEngine = require('./translation-engine.js');
const { euskeraEngine } = require('./euskera-engine.js');
console.log('🧠 [AI-ENGINE] Hilo de IA iniciado en modo Hibernación (0% RAM). Esperando activación...');

// [v60.2] MODO HIBERNACIÓN: El modelo reside en disco pero no se carga en RAM 
// hasta que se solicita la primera traducción, protegiendo los recursos del sistema.



// Configuración de límites (Protocolo 3.B del Blueprint Maestro)
const MAX_QUEUE_SIZE = 30;
let currentQueueSize = 0;

// Escuchar mensajes del hilo principal (server.js)
parentPort.on('message', (task) => {
    const { type, taskId } = task;

    // Protocolo de Backpressure: Si la cola está llena, descartamos por seguridad
    if (currentQueueSize >= MAX_QUEUE_SIZE) {
        console.warn(`⚠️ [AI-ENGINE] Cola saturada (${currentQueueSize}/${MAX_QUEUE_SIZE}). Descartando tarea: ${taskId}`);
        return;
    }

    currentQueueSize++;

    try {
        switch (type) {
            case 'ping':
                currentQueueSize--; // El ping no cuenta para el límite de inferencia
                parentPort.postMessage({ taskId, type: 'pong', status: 'ready' });
                break;

            case 'warm-up':
                currentQueueSize--;
                console.log('🔥 [AI-ENGINE] Señal de pre-calentamiento: Despertando MADLAD-400 y Euskera-Engine (whisper.cpp)...');

                translationEngine.init(); // Cargar Traducción
                euskeraEngine.init();     // [v60.800] Cargar Transcripción (Euskera)
                break;

            case 'translate':
                processTranslation(task);
                break;

            case 'transcribe-euskera':
                processEuskera(task);
                break;

            default:
                currentQueueSize--;
                console.warn(`⚠️ [AI-ENGINE] Tipo de tarea desconocido: ${type}`);
        }
    } catch (error) {
        currentQueueSize--;
        console.error(`❌ [AI-ENGINE] Error procesando tarea ${taskId}:`, error);
        parentPort.postMessage({ taskId, error: error.message });
    }
});

/**
 * Procesa una traducción de forma asíncrona usando el motor neuronal real.
 */
async function processTranslation(task) {
    const { taskId, text, sourceLang, targetLang, protectedWords } = task;
    
    try {
        const resultText = await translationEngine.translate(text, sourceLang, targetLang, protectedWords || []);

        parentPort.postMessage({
            taskId,
            type: 'translation-result',
            sourceLang,
            targetLang,
            result: resultText,
            sentAt: task.sentAt,
            socketId: task.socketId
        });
    } catch (error) {
        console.error(`❌ [AI-ENGINE] Error en traducción neuronal:`, error);
        parentPort.postMessage({ taskId, error: 'Error en inferencia local' });
    } finally {
        currentQueueSize--;
    }
}

/**
 * Procesa una transcripción de Euskera (Wav2Vec2) de audio real.
 */
async function processEuskera(task) {
    const { taskId, audio, lang, subUserId, sessionSeq, seq } = task;
    
    try {
        const text = await euskeraEngine.transcribe(audio, lang, !!task.isPartial);

        parentPort.postMessage({
            taskId,
            type: 'transcription-result',
            text: text,
            isPartial: task.isPartial, // [v60.950] Soporte para resultados parciales (Real-time)
            sessionSeq,
            seq,
            subUserId,
            socketId: task.socketId
        });
    } catch (error) {
        console.error(`❌ [AI-ENGINE] Error en transcripción Whisper (${lang}):`, error);
        parentPort.postMessage({ 
            taskId, 
            type: 'transcription-result',
            text: task.isPartial ? "" : "[Error en IA local]",
            isPartial: task.isPartial,
            sessionSeq,
            seq,
            subUserId,
            socketId: task.socketId
        });
    } finally {
        currentQueueSize--; // Liberamos slot en la cola
    }
}
