/**
 * Test de Staging - Paso 2: Prueba de Carga Moderada (300 Peticiones)
 * Simulación de tráfico mixto concurrente/encadenado:
 * - 120 Fast-Path (10 idiomas)
 * - 90 Palabras Cortas no listadas (reiteradas para medir primer hit vs cache hits vs inferencia)
 * - 60 Frases Largas
 * - 30 Casos CJK
 *
 * Métricas capturadas:
 * - Latencias p50/p95/p99 y media por tipo de tráfico
 * - Comparativa: Primer hit vs hits subsecuentes en palabras cortas
 * - RAM de Node.js (heapUsed, rss) antes, durante y después
 * - Tamaño y comportamiento de this.cache
 * - Contención de la cola FIFO de madladDaemon (profundidad máxima y rechazos por backpressure)
 * - Telemetría babelStats.blocked (detección de alucinaciones o falsos positivos)
 */

const translationEngine = require('../modules/ai/translation-engine.js');
const madladDaemon = require('../modules/ai/madlad-daemon.js');

function calculatePercentiles(latencies) {
    if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 };
    const sorted = [...latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.50)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = sorted.reduce((acc, v) => acc + v, 0) / sorted.length;
    return { 
        p50: p50.toFixed(2), 
        p95: p95.toFixed(2), 
        p99: p99.toFixed(2), 
        min: min.toFixed(2), 
        max: max.toFixed(2), 
        avg: avg.toFixed(2) 
    };
}

function getMemoryMB() {
    const mem = process.memoryUsage();
    return {
        rss: (mem.rss / 1024 / 1024).toFixed(2) + ' MB',
        heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2) + ' MB'
    };
}

async function runModerateLoadTest() {
    console.log('🚀 [STAGING - PASO 2] Iniciando Prueba de Carga Moderada Limpia (300 Peticiones Mixtas)...');
    
    // Medición de RAM inicial
    const memInitial = getMemoryMB();
    console.log('📊 RAM Inicial:', memInitial);

    await translationEngine.init();
    // Limpieza estricta de caché para arranque en frío real sin contaminación
    translationEngine.clearCache();
    console.log('✅ [STAGING] Motor conectado y caché purgada (Cold Start verificado).');
    
    global.babelStats = { blocked: 0 };

    // Vocabulario base para pruebas
    const fastPathWords = [
        { text: 'Gracias', src: 'es', tgt: 'en' },
        { text: 'Hola', src: 'es', tgt: 'eu' },
        { text: 'Buenos días', src: 'es', tgt: 'gl' },
        { text: 'Buenas noches', src: 'es', tgt: 'de' },
        { text: 'Sí', src: 'es', tgt: 'fr' },
        { text: 'No', src: 'es', tgt: 'it' },
        { text: 'De acuerdo', src: 'es', tgt: 'ja' },
        { text: 'Adiós', src: 'es', tgt: 'pt' },
        { text: 'Muchas gracias', src: 'es', tgt: 'ru' },
        { text: 'Hola', src: 'es', tgt: 'zh' },
        { text: 'Thank you', src: 'en', tgt: 'es' },
        { text: 'Hello', src: 'en', tgt: 'eu' }
    ];

    const shortUnlistedWords = [
        'Cuidado', 'Fuego', 'Atención', 'Despacio', 'Espera',
        'Peligro', 'Emergencia', 'Parada', 'Adelante', 'Atrás',
        'Listo', 'Rápido', 'Silencio', 'Socorro', 'Presión'
    ];

    const longPhrases = [
        'Por favor mantenga la posición hasta que llegue la patrulla al sector cuatro',
        'Verifique los niveles de presión en el tanque principal antes de iniciar el ciclo',
        'Todos los miembros del equipo deben reportarse en el punto de encuentro alfa',
        'La temperatura del compresor secundario ha superado el límite de seguridad establecido',
        'Procedemos a reiniciar el enlace de comunicaciones en el canal secundario',
        'Confirmen recepción de los suministros médicos en el puesto de avanzada'
    ];

    const cjkPhrases = [
        { text: '紧急情况请保持冷静', src: 'zh', tgt: 'en' },
        { text: '危险', src: 'zh', tgt: 'en' },
        { text: '避難指示が発令されました', src: 'ja', tgt: 'en' },
        { text: '注意', src: 'ja', tgt: 'en' },
        { text: '안전 지대로 이동하십시오', src: 'ko', tgt: 'en' },
        { text: '정지', src: 'ko', tgt: 'en' }
    ];

    // Construir batería de 300 peticiones intercaladas
    const testQueue = [];
    
    // 120 Fast-Path
    for (let i = 0; i < 120; i++) {
        const item = fastPathWords[i % fastPathWords.length];
        testQueue.push({ type: 'FAST_PATH', ...item });
    }

    // 90 Palabras Cortas no listadas
    for (let i = 0; i < 90; i++) {
        const word = shortUnlistedWords[i % shortUnlistedWords.length];
        const tgts = ['en', 'fr', 'eu'];
        testQueue.push({ 
            type: 'SHORT_UNLISTED', 
            text: word, 
            src: 'es', 
            tgt: tgts[i % tgts.length]
        });
    }

    // 60 Frases Largas
    for (let i = 0; i < 60; i++) {
        const phrase = longPhrases[i % longPhrases.length];
        const tgts = ['en', 'fr'];
        testQueue.push({ type: 'LONG_PHRASE', text: phrase, src: 'es', tgt: tgts[i % tgts.length] });
    }

    // 30 Casos CJK
    for (let i = 0; i < 30; i++) {
        const item = cjkPhrases[i % cjkPhrases.length];
        testQueue.push({ type: 'CJK', ...item });
    }

    // Mezclar aleatoriamente
    for (let i = testQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [testQueue[i], testQueue[j]] = [testQueue[j], testQueue[i]];
    }

    console.log(`📦 [STAGING] Iniciando despacho de ${testQueue.length} peticiones con medición analítica...`);

    const latenciesFastPath = [];
    const latenciesShortColdHits = [];
    const latenciesShortWarmHits = [];
    const latenciesLongColdHits = [];
    const latenciesLongWarmHits = [];
    const latenciesCJKColdHits = [];
    const latenciesCJKWarmHits = [];
    const allLatencies = [];

    let maxQueueDepthSeen = 0;
    let memMid = null;

    const tStart = Date.now();

    for (let index = 0; index < testQueue.length; index++) {
        const task = testQueue[index];

        // Verificar estado de caché ANTES de llamar
        const cleanKey = translationEngine.normalizeFastPath(task.text);
        const cacheKey = `${translationEngine.CACHE_VERSION}:${task.src}->${task.tgt}:${cleanKey}`;
        const isWarmCacheHit = translationEngine.cache.has(cacheKey);

        const currentQueueDepth = madladDaemon.queue.length;
        if (currentQueueDepth > maxQueueDepthSeen) {
            maxQueueDepthSeen = currentQueueDepth;
        }

        if (index === 150) {
            memMid = getMemoryMB();
            console.log(`⏱️ [Progreso 50%] Petición 150/300. RAM Intermedia:`, memMid, `| Cola máx: ${maxQueueDepthSeen}`);
        }

        const t0 = process.hrtime.bigint();
        const res = await translationEngine.translate(task.text, task.src, task.tgt);
        const t1 = process.hrtime.bigint();
        const ms = Number(t1 - t0) / 1e6;

        allLatencies.push(ms);

        if (task.type === 'FAST_PATH') {
            latenciesFastPath.push(ms);
        } else if (task.type === 'SHORT_UNLISTED') {
            if (isWarmCacheHit) {
                latenciesShortWarmHits.push(ms);
            } else {
                latenciesShortColdHits.push(ms);
            }
        } else if (task.type === 'LONG_PHRASE') {
            if (isWarmCacheHit) {
                latenciesLongWarmHits.push(ms);
            } else {
                latenciesLongColdHits.push(ms);
            }
        } else if (task.type === 'CJK') {
            if (isWarmCacheHit) {
                latenciesCJKWarmHits.push(ms);
            } else {
                latenciesCJKColdHits.push(ms);
            }
        }
    }

    const totalDurationSeconds = ((Date.now() - tStart) / 1000).toFixed(2);
    const memFinal = getMemoryMB();

    console.log('\n======================================================');
    console.log('📊 RESULTADOS PRUEBA DE CARGA MODERADA (PASO 2 - 300 REQS)');
    console.log('======================================================');
    console.log(`⏱️ Duración total: ${totalDurationSeconds}s (Throughput: ${(300 / totalDurationSeconds).toFixed(2)} req/s)`);
    console.log(`📈 Profundidad máxima de cola FIFO observada: ${maxQueueDepthSeen} / ${madladDaemon.MAX_QUEUE_SIZE}`);
    console.log('------------------------------------------------------');
    console.log('🧠 USO DE MEMORIA (Node.js):');
    console.log('   Inicial    :', memInitial);
    console.log('   Intermedio :', memMid);
    console.log('   Final      :', memFinal);
    console.log('------------------------------------------------------');
    console.log('⚡ LATENCIAS POR TIPO (ms):');
    console.log(`   Fast-Path (${latenciesFastPath.length} reqs)                     :`, calculatePercentiles(latenciesFastPath));
    console.log(`   Palabras Cortas - COLD INFERENCIA (${latenciesShortColdHits.length} reqs) :`, calculatePercentiles(latenciesShortColdHits));
    console.log(`   Palabras Cortas - WARM CACHÉ (${latenciesShortWarmHits.length} reqs)      :`, calculatePercentiles(latenciesShortWarmHits));
    console.log(`   Frases Largas - COLD INFERENCIA (${latenciesLongColdHits.length} reqs)   :`, calculatePercentiles(latenciesLongColdHits));
    console.log(`   Frases Largas - WARM CACHÉ (${latenciesLongWarmHits.length} reqs)        :`, calculatePercentiles(latenciesLongWarmHits));
    console.log(`   Casos CJK - COLD INFERENCIA (${latenciesCJKColdHits.length} reqs)        :`, calculatePercentiles(latenciesCJKColdHits));
    console.log(`   Casos CJK - WARM CACHÉ (${latenciesCJKWarmHits.length} reqs)             :`, calculatePercentiles(latenciesCJKWarmHits));
    console.log(`   GLOBAL MIXTO (${allLatencies.length} reqs)                    :`, calculatePercentiles(allLatencies));
    console.log('------------------------------------------------------');
    console.log(`🛡️ Telemetría babelStats.blocked: ${global.babelStats.blocked}`);
    console.log(`💾 Tamaño de Caché en RAM: ${translationEngine.cache.size} entradas`);
    console.log('======================================================\n');

    madladDaemon.terminate();
    process.exit(0);
}

runModerateLoadTest().catch(err => {
    console.error('❌ Error en prueba de carga:', err);
    process.exit(1);
});
