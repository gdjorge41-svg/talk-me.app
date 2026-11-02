/**
 * Test de Staging con Binario Real C++ (madlad-translator.exe)
 * Batería de 100 pruebas de tráfico mixto:
 * - 40 casos Fast-Path (10 idiomas distintos)
 * - 30 palabras cortas no listadas (con clausura aplicada)
 * - 20 frases largas (inocuidad y no intercepción)
 * - 10 casos CJK
 *
 * Mide latencias p50/p95/p99 y telemetría de caché global.babelStats.blocked
 */

const translationEngine = require('../modules/ai/translation-engine.js');
const madladDaemon = require('../modules/ai/madlad-daemon.js');

function calculatePercentiles(latencies) {
    if (latencies.length === 0) return { p50: 0, p95: 0, p99: 0, max: 0, min: 0, avg: 0 };
    const sorted = [...latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.50)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const avg = sorted.reduce((acc, v) => acc + v, 0) / sorted.length;
    return { p50: p50.toFixed(2), p95: p95.toFixed(2), p99: p99.toFixed(2), min: min.toFixed(2), max: max.toFixed(2), avg: avg.toFixed(2) };
}

async function runStagingBatch() {
    console.log('🚀 [STAGING] Iniciando Inicialización del Binario C++ Real y Carga del Modelo...');
    const initT0 = Date.now();
    await translationEngine.init();
    console.log(`✅ [STAGING] Binario C++ conectado en ${Date.now() - initT0}ms.\n`);

    global.babelStats = { blocked: 0 };

    // 1. 40 Fast-Path en 10 idiomas distintos
    const fastPathCases = [
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
        { text: 'Hello', src: 'en', tgt: 'eu' },
        { text: 'Good morning', src: 'en', tgt: 'gl' },
        { text: 'Good night', src: 'en', tgt: 'de' },
        { text: 'Yes', src: 'en', tgt: 'fr' },
        { text: 'No', src: 'en', tgt: 'it' },
        { text: 'OK', src: 'en', tgt: 'ja' },
        { text: 'Goodbye', src: 'en', tgt: 'pt' },
        { text: 'Thank you very much', src: 'en', tgt: 'ru' },
        { text: 'Hello', src: 'en', tgt: 'zh' },
        { text: 'Eskerrik asko', src: 'eu', tgt: 'es' },
        { text: 'Kaixo', src: 'eu', tgt: 'en' },
        { text: 'Egun on', src: 'eu', tgt: 'fr' },
        { text: 'Gau on', src: 'eu', tgt: 'it' },
        { text: 'Bai', src: 'eu', tgt: 'de' },
        { text: 'Ez', src: 'eu', tgt: 'pt' },
        { text: 'Ados', src: 'eu', tgt: 'ja' },
        { text: 'Agur', src: 'eu', tgt: 'ru' },
        { text: 'Mila esker', src: 'eu', tgt: 'zh' },
        { text: 'Kaixo', src: 'eu', tgt: 'gl' },
        { text: 'Grazas', src: 'gl', tgt: 'es' },
        { text: 'Ola', src: 'gl', tgt: 'en' },
        { text: 'Bos días', src: 'gl', tgt: 'eu' },
        { text: 'Boas noites', src: 'gl', tgt: 'fr' },
        { text: 'Si', src: 'gl', tgt: 'it' },
        { text: 'Non', src: 'gl', tgt: 'de' },
        { text: 'De acordo', src: 'gl', tgt: 'pt' },
        { text: 'Adeus', src: 'gl', tgt: 'ja' },
        { text: 'Moitas grazas', src: 'gl', tgt: 'ru' },
        { text: 'Ola', src: 'gl', tgt: 'zh' }
    ];

    // 2. 30 Palabras Cortas no listadas (pasan por motor + clausura)
    const shortUnlistedWords = [
        'Cuidado', 'Fuego', 'Atención', 'Despacio', 'Espera',
        'Peligro', 'Emergencia', 'Parada', 'Adelante', 'Atrás',
        'Subir', 'Bajar', 'Listo', 'Rápido', 'Silencio',
        'Socorro', 'Auxilio', 'Presión', 'Voltaje', 'Corte',
        'Cambio', 'Canal', 'Volumen', 'Luz', 'Sombra',
        'Puerta', 'Ventana', 'Sector', 'Alerta', 'Inicio'
    ];
    const shortCases = shortUnlistedWords.map((word, i) => {
        const tgts = ['en', 'fr', 'de', 'it', 'pt', 'eu'];
        return { text: word, src: 'es', tgt: tgts[i % tgts.length] };
    });

    // 3. 20 Frases Largas
    const longPhrases = [
        'Por favor mantenga la posición hasta que llegue la patrulla al sector cuatro',
        'Verifique los niveles de presión en el tanque principal antes de iniciar el ciclo',
        'Todos los miembros del equipo deben reportarse en el punto de encuentro alfa',
        'La temperatura del compresor secundario ha superado el límite de seguridad establecido',
        'Procedemos a reiniciar el enlace de comunicaciones en el canal secundario',
        'Confirmen recepción de los suministros médicos en el puesto de avanzada',
        'Se solicita autorización para ingresar a la zona restringida de mantenimiento',
        'El generador auxiliar está suministrando energía estable a toda la estación',
        'Mantengan silencio de radio durante los próximos quince minutos de maniobra',
        'El equipo de rescate ha completado la inspección preliminar sin novedades',
        'Desconecte la alimentación general antes de manipular los cuadros de control',
        'Informamos de condiciones climáticas adversas en la aproximación norte',
        'Todos los accesos peatonales quedarán bloqueados a partir de las veintidós horas',
        'Compruebe el funcionamiento del sistema de ventilación de emergencia en la sala',
        'El vehículo de soporte técnico llegará a la posición en aproximadamente diez minutos',
        'Revisión completa de los transmisores de audio y microfonía finalizada',
        'Se detecta una anomalía de voltaje en la línea de distribución número tres',
        'Aseguren todos los contenedores de carga pesada antes de la salida del convoy',
        'La dotación completa debe portar equipo de protección individual de nivel dos',
        'Finalizada la transmisión de datos procedemos al cierre de la sesión de trabajo'
    ];
    const longCases = longPhrases.map((phrase, i) => {
        const tgts = ['en', 'fr', 'de', 'it', 'pt'];
        return { text: phrase, src: 'es', tgt: tgts[i % tgts.length] };
    });

    // 4. 10 Casos CJK (Chino, Japonés, Coreano)
    const cjkCases = [
        { text: '紧急情况请保持冷静', src: 'zh', tgt: 'en' }, // Chino largo
        { text: '危险', src: 'zh', tgt: 'en' },                // Chino corto
        { text: '避難指示が発令されました', src: 'ja', tgt: 'en' }, // Japonés largo
        { text: '注意', src: 'ja', tgt: 'en' },                // Japonés corto
        { text: '안전 지대로 이동하십시오', src: 'ko', tgt: 'en' }, // Coreano largo
        { text: '정지', src: 'ko', tgt: 'en' },                // Coreano corto
        { text: 'Por favor ayúdeme', src: 'es', tgt: 'zh' },  // Hacia Chino
        { text: 'Cuidado con el escalón', src: 'es', tgt: 'ja' }, // Hacia Japonés
        { text: 'Deténgase inmediatamente', src: 'es', tgt: 'ko' }, // Hacia Coreano
        { text: '谢谢', src: 'zh', tgt: 'en' }                 // Chino en Fast-Path
    ];

    console.log(`📦 [STAGING] Total de peticiones a ejecutar: ${fastPathCases.length + shortCases.length + longCases.length + cjkCases.length} (100)`);

    const latenciesFastPath = [];
    const latenciesShort = [];
    const latenciesLong = [];
    const latenciesCJK = [];
    const allLatencies = [];

    // Ejecutar 1. Fast-Path
    console.log('\n[1/4] Ejecutando 40 peticiones Fast-Path...');
    for (const item of fastPathCases) {
        const t0 = process.hrtime.bigint();
        const res = await translationEngine.translate(item.text, item.src, item.tgt);
        const t1 = process.hrtime.bigint();
        const ms = Number(t1 - t0) / 1e6;
        latenciesFastPath.push(ms);
        allLatencies.push(ms);
    }

    // Ejecutar 2. Palabras cortas con clausura en motor C++
    console.log('[2/4] Ejecutando 30 palabras cortas no listadas en binario C++...');
    for (const item of shortCases) {
        const t0 = process.hrtime.bigint();
        const res = await translationEngine.translate(item.text, item.src, item.tgt);
        const t1 = process.hrtime.bigint();
        const ms = Number(t1 - t0) / 1e6;
        latenciesShort.push(ms);
        allLatencies.push(ms);
    }

    // Ejecutar 3. Frases largas en binario C++
    console.log('[3/4] Ejecutando 20 frases largas en binario C++...');
    for (const item of longCases) {
        const t0 = process.hrtime.bigint();
        const res = await translationEngine.translate(item.text, item.src, item.tgt);
        const t1 = process.hrtime.bigint();
        const ms = Number(t1 - t0) / 1e6;
        latenciesLong.push(ms);
        allLatencies.push(ms);
    }

    // Ejecutar 4. Casos CJK en binario C++
    console.log('[4/4] Ejecutando 10 casos CJK en binario C++...');
    for (const item of cjkCases) {
        const t0 = process.hrtime.bigint();
        const res = await translationEngine.translate(item.text, item.src, item.tgt);
        const t1 = process.hrtime.bigint();
        const ms = Number(t1 - t0) / 1e6;
        latenciesCJK.push(ms);
        allLatencies.push(ms);
    }

    // Métricas
    console.log('\n======================================================');
    console.log('📊 RESULTADOS DE RENDIMIENTO EN STAGING (BINARIO REAL C++)');
    console.log('======================================================');
    console.log('Fast-Path (40 reqs)      :', calculatePercentiles(latenciesFastPath));
    console.log('Palabras Cortas (30 reqs):', calculatePercentiles(latenciesShort));
    console.log('Frases Largas (20 reqs)  :', calculatePercentiles(latenciesLong));
    console.log('Casos CJK (10 reqs)      :', calculatePercentiles(latenciesCJK));
    console.log('TOTAL GLOBAL (100 reqs)  :', calculatePercentiles(allLatencies));
    console.log('------------------------------------------------------');
    console.log(`🛡️ Telemetría babelStats.blocked: ${global.babelStats.blocked}`);
    console.log(`💾 Tamaño de Caché en RAM: ${translationEngine.cache.size} entradas`);
    console.log('======================================================\n');

    madladDaemon.terminate();
    process.exit(0);
}

runStagingBatch().catch(err => {
    console.error('❌ Error ejecutando test de staging:', err);
    process.exit(1);
});
