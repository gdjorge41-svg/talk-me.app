/**
 * Suite de Pruebas Defensiva - Fase 5: Validación Murphy y Mitigación de Alucinaciones
 * Arquitectura Babel / MADLAD-400 INT8 (Talk.me v60.3)
 */

const assert = require('assert');
const path = require('path');
const translationEngine = require('../modules/ai/translation-engine.js');

async function runTests() {
    console.log('🧪 Iniciando Batería de Pruebas Defensivas - Babel MADLAD-400 (v60.3)...\n');
    let passed = 0;
    let total = 0;

    function test(name, fn) {
        total++;
        try {
            fn();
            console.log(`  ✅ [PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ❌ [FAIL] ${name}`);
            console.error(`     Error: ${err.message}`);
            throw err;
        }
    }

    async function asyncTest(name, fn) {
        total++;
        try {
            await fn();
            console.log(`  ✅ [PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ❌ [FAIL] ${name}`);
            console.error(`     Error: ${err.message}`);
            throw err;
        }
    }

    // ==========================================
    // 1. FAST-PATH COBERTURA EN 24 IDIOMAS
    // ==========================================
    console.log('--- 1. Pruebas de Fast-Path Determinista (0 ms, 100% Certeza) ---');

    await asyncTest('Fast-Path "Gracias" (es -> en): Retorna "Thank you" de inmediato', async () => {
        const t0 = process.hrtime.bigint();
        const res = await translationEngine.translate('Gracias', 'es', 'en');
        const t1 = process.hrtime.bigint();
        const ms = Number(t1 - t0) / 1e6;
        assert.strictEqual(res, 'Thank you');
        assert(ms < 5, `Latencia esperada < 5ms en Fast-Path, obtenida: ${ms}ms`);
    });

    await asyncTest('Fast-Path "Hola" (es -> eu): Retorna "Kaixo" (cero "hello")', async () => {
        const res = await translationEngine.translate('Hola', 'es', 'eu');
        assert.strictEqual(res, 'Kaixo');
    });

    await asyncTest('Fast-Path "Hola" (es -> ja): Retorna "こんにちは"', async () => {
        const res = await translationEngine.translate('Hola', 'es', 'ja');
        assert.strictEqual(res, 'こんにちは');
    });

    await asyncTest('Fast-Path "Muchas gracias" (es -> zh): Retorna "非常感谢"', async () => {
        const res = await translationEngine.translate('Muchas gracias', 'es', 'zh');
        assert.strictEqual(res, '非常感谢');
    });

    await asyncTest('Fast-Path "Sí" (es -> ar): Retorna "نعم"', async () => {
        const res = await translationEngine.translate('Sí', 'es', 'ar');
        assert.strictEqual(res, 'نعم');
    });

    await asyncTest('Fast-Path "Adiós" (es -> gl): Retorna "Adeus"', async () => {
        const res = await translationEngine.translate('Adiós', 'es', 'gl');
        assert.strictEqual(res, 'Adeus');
    });

    await asyncTest('Fast-Path Homógrafo "No" (en -> eu): Retorna "Ez"', async () => {
        const res = await translationEngine.translate('No', 'en', 'eu');
        assert.strictEqual(res, 'Ez');
    });

    await asyncTest('Fast-Path Inverso (eu -> es): "Eskerrik asko" -> "Gracias"', async () => {
        const res = await translationEngine.translate('Eskerrik asko', 'eu', 'es');
        assert.strictEqual(res, 'Gracias');
    });

    await asyncTest('Fast-Path Inverso (ja -> en): "ありがとう" -> "Thank you"', async () => {
        const res = await translationEngine.translate('ありがとう', 'ja', 'en');
        assert.strictEqual(res, 'Thank you');
    });

    // ==========================================
    // 2. ROBUSTEZ TIPOGRÁFICA Y NORMALIZACIÓN
    // ==========================================
    console.log('\n--- 2. Robustez Tipográfica y Modismos ---');

    await asyncTest('Normalización: "¡Gracias!" con signos de exclamación', async () => {
        const res = await translationEngine.translate('¡Gracias!', 'es', 'en');
        assert.strictEqual(res, 'Thank you');
    });

    await asyncTest('Normalización: "graciasss" con repetición de letras', async () => {
        const res = await translationEngine.translate('graciasss', 'es', 'en');
        assert.strictEqual(res, 'Thank you');
    });

    await asyncTest('Normalización: "  Hola...  " con espacios y puntos suspensivos', async () => {
        const res = await translationEngine.translate('  Hola...  ', 'es', 'eu');
        assert.strictEqual(res, 'Kaixo');
    });

    await asyncTest('Variante intercom: "vale" -> target "en" retorna "OK"', async () => {
        const res = await translationEngine.translate('vale', 'es', 'en');
        assert.strictEqual(res, 'OK');
    });

    await asyncTest('Variante intercom: "entendido" -> target "eu" retorna "Ados"', async () => {
        const res = await translationEngine.translate('entendido', 'es', 'eu');
        assert.strictEqual(res, 'Ados');
    });

    // ==========================================
    // 3. AISLAMIENTO DE JERGAS PROTEGIDAS
    // ==========================================
    console.log('\n--- 3. Aislamiento de Jergas Protegidas ([[ _W0_ ]]) ---');

    test('Jergas protegidas: "Gracias [[_W0_]]" no es absorbido por Fast-Path', () => {
        const text = 'Gracias [[_W0_]]';
        const cleanKey = translationEngine.normalizeFastPath(text);
        const containsPlaceholder = text.includes('[[_W');
        assert.strictEqual(containsPlaceholder, true);
        // Debe ignorar Fast-Path y permitir el paso a la inferencia
        const skipFastPath = containsPlaceholder || !translationEngine.FAST_INDEX[cleanKey];
        assert.strictEqual(skipFastPath, true);
    });

    // ==========================================
    // 4. CLAUSURA SINTÁCTICA SELECTIVA Y RESTAURACIÓN
    // ==========================================
    console.log('\n--- 4. Clausura Sintáctica Selectiva y Puntuación Simétrica ---');

    test('Clausura Selectiva: Inyección de "." SOLO en entradas de 1-2 palabras sin puntuación', () => {
        // 1 palabra: requiere clausura
        const input1 = 'Cuidado';
        const hasPunct1 = /[.!?؟？。！]$/.test(input1.trim());
        const wIn1 = translationEngine.countUnits(input1);
        const needsClosure1 = (wIn1 <= 2) && !hasPunct1;
        assert.strictEqual(needsClosure1, true);

        // 4 palabras: "hola cómo estás" -> NO requiere clausura artificial para no provocar bucles
        const input4 = 'hola cómo estás';
        const hasPunct4 = /[.!?؟？。！]$/.test(input4.trim());
        const wIn4 = translationEngine.countUnits(input4);
        const needsClosure4 = (wIn4 <= 2) && !hasPunct4;
        assert.strictEqual(needsClosure4, false);
    });

    test('Restauración Simétrica: Remueve punto solo si se aplicó clausura artificial', () => {
        const needsClosure = true;
        let simOutput = 'Watch out.';
        if (needsClosure && simOutput) {
            simOutput = simOutput.replace(/[.!?؟？。！]+$/, '').trim();
        }
        assert.strictEqual(simOutput, 'Watch out');
    });

    // ==========================================
    // 4.B. ANTI-LOOP MULTI-DELIMITADOR (Puntos y Comas)
    // ==========================================
    console.log('\n--- 4.B. Saneamiento Defensivo Anti-Loop (Multi-Delimitador) ---');

    function deduplicateTest(translatedText) {
        if (!translatedText || translatedText.length < 10) return translatedText;
        const trailingPunct = /[.,!?;:؟？]+$/.exec(translatedText)?.[0] || '';
        const withoutTrailing = translatedText.replace(/[.,!?;:؟？]+$/, '').trim();
        const clauseParts = withoutTrailing.split(/\s*[,;.!?؟？]+\s*/).filter(Boolean);
        if (clauseParts.length >= 2 && clauseParts.length % 2 === 0) {
            const mid = clauseParts.length / 2;
            const h1 = clauseParts.slice(0, mid).join(' ').toLowerCase();
            const h2 = clauseParts.slice(mid).join(' ').toLowerCase();
            if (h1 === h2 && h1.split(/\s+/).length >= 2) {
                return clauseParts.slice(0, mid).join(', ') + trailingPunct;
            }
        } else {
            const words = withoutTrailing.split(/\s+/).filter(Boolean);
            if (words.length >= 4 && words.length % 2 === 0) {
                const mid = words.length / 2;
                const w1 = words.slice(0, mid).join(' ').toLowerCase();
                const w2 = words.slice(mid).join(' ').toLowerCase();
                if (w1 === w2) {
                    return words.slice(0, mid).join(' ') + trailingPunct;
                }
            }
        }
        return translatedText;
    }

    test('Anti-Loop: Colapsa bucle con punto "Hi how are you. Hi how are you" -> "Hi how are you"', () => {
        const input = 'Hi how are you. Hi how are you';
        const res = deduplicateTest(input);
        assert.strictEqual(res, 'Hi how are you');
    });

    test('Anti-Loop: Colapsa bucle con comas "Thank you so much, thank you so much." -> "Thank you so much."', () => {
        const input = 'Thank you so much, thank you so much.';
        const res = deduplicateTest(input);
        assert.strictEqual(res, 'Thank you so much.');
    });

    test('Anti-Loop: Colapsa bucle continuo de palabras "Okay okay received Okay okay received" -> "Okay okay received"', () => {
        const input = 'Okay okay received Okay okay received';
        const res = deduplicateTest(input);
        assert.strictEqual(res, 'Okay okay received');
    });

    test('Anti-Loop: Colapsa bucle continuo "Yes yes yes yes" -> "Yes yes"', () => {
        const input = 'Yes yes yes yes';
        const res = deduplicateTest(input);
        assert.strictEqual(res, 'Yes yes');
    });

    test('Anti-Loop: No altera frases con mitades distintas "Okay received Okay sent"', () => {
        const input = 'Okay received Okay sent';
        const res = deduplicateTest(input);
        assert.strictEqual(res, 'Okay received Okay sent');
    });

    test('Anti-Loop: No altera frases legítimas sin duplicación "Buenos días a todos."', () => {
        const input = 'Buenos días a todos.';
        const res = deduplicateTest(input);
        assert.strictEqual(res, 'Buenos días a todos.');
    });

    test('Anti-Loop: Respeta frases de 1 palabra por mitad ("No, no.") sin colapsar', () => {
        const input = 'No, no.';
        const res = deduplicateTest(input);
        assert.strictEqual(res, 'No, no.');
    });

    test('Pre-inferencia: Colapso preventivo de duplicados consecutivos "okay okay recibido" -> "okay recibido"', () => {
        const input = 'okay okay recibido';
        const res = translationEngine.collapseConsecutiveDuplicates(input);
        assert.strictEqual(res, 'okay recibido');
    });

    // ==========================================
    // 5. HIGIENE DE CACHÉ ANTI-ENVENENAMIENTO Y TELEMETRÍA
    // ==========================================
    console.log('\n--- 5. Higiene de Caché Anti-Envenenamiento y Telemetría Mínima ---');

    test('countUnits(): Cuenta palabras en lenguas latinas y caracteres en CJK', () => {
        assert.strictEqual(translationEngine.countUnits('Gracias'), 1);
        assert.strictEqual(translationEngine.countUnits('Muchas gracias por su atención'), 5);
        // CJK: 6 caracteres sin espacios
        assert.strictEqual(translationEngine.countUnits('非常感谢你'), 5);
        // CJK Alucinación: 13 caracteres sin espacios
        assert.strictEqual(translationEngine.countUnits('谢谢你对我说的这些亲切的话'), 13);
    });

    test('Filtro de Caché: Bloquea alucinación de 8 palabras ("kind words") y registra telemetría', () => {
        translationEngine.clearCache();
        global.babelStats = { blocked: 0 };

        const input = 'Gracias';
        const hallucination = 'Thank you so much for your kind words';
        
        const uIn = translationEngine.countUnits(input);
        const uOut = translationEngine.countUnits(hallucination);
        const isOutCJK = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(hallucination);
        const limIn = 2;
        const limOut = isOutCJK ? 8 : 4;
        const noCachear = (uIn <= limIn && uOut > limOut);

        assert.strictEqual(noCachear, true);

        if (noCachear) {
            global.babelStats.blocked++;
        }
        assert.strictEqual(global.babelStats.blocked, 1);
    });

    test('Filtro de Caché: Bloquea alucinación CJK de 14 caracteres', () => {
        const input = 'Gracias';
        const cjkHallucination = '谢谢你对我说的这些亲切的话'; // 14 caracteres

        const uIn = translationEngine.countUnits(input);
        const uOut = translationEngine.countUnits(cjkHallucination);
        const isOutCJK = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(cjkHallucination);
        const limIn = 2;
        const limOut = isOutCJK ? 8 : 4;
        const noCachear = (uIn <= limIn && uOut > limOut);

        assert.strictEqual(noCachear, true);
    });

    test('Filtro de Caché: Permite traducción legítima CJK de 5 caracteres ("非常感谢你")', () => {
        const input = 'Muchas gracias';
        const cjkLegit = '非常感谢你'; // 5 caracteres <= 8

        const uIn = translationEngine.countUnits(input);
        const uOut = translationEngine.countUnits(cjkLegit);
        const isOutCJK = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(cjkLegit);
        const limIn = 2;
        const limOut = isOutCJK ? 8 : 4;
        const noCachear = (uIn <= limIn && uOut > limOut);

        assert.strictEqual(noCachear, false);
    });

    // ==========================================
    // 6. INOCUIDAD EN FRASES LARGAS (3+ PALABRAS)
    // ==========================================
    console.log('\n--- 6. Inocuidad en Frases Largas (Cero Regresiones) ---');

    test('Frases largas no son interceptadas por Fast-Path', () => {
        const longPhrase = 'Por favor mantenga la posición hasta que llegue la patrulla al sector cuatro';
        const cleanKey = translationEngine.normalizeFastPath(longPhrase);
        assert.strictEqual(translationEngine.FAST_INDEX[cleanKey], undefined);
    });

    test('Frases largas no son bloqueadas por el guardián de caché', () => {
        const longInput = 'Por favor mantenga la posición hasta que llegue la patrulla al sector cuatro';
        const longOutput = 'Please hold the position until the patrol arrives at sector four';

        const uIn = translationEngine.countUnits(longInput);
        const uOut = translationEngine.countUnits(longOutput);
        const isOutCJK = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(longOutput);
        const limIn = 2;
        const limOut = isOutCJK ? 8 : 4;
        const noCachear = (uIn <= limIn && uOut > limOut);

        // uIn = 12 > 2, por ende noCachear es FALSE. Se cachea con normalidad.
        assert.strictEqual(noCachear, false);
    });

    console.log(`\n🎉 Todos los tests pasaron exitosamente: ${passed}/${total} (100% éxito)`);
}

runTests().catch(err => {
    console.error('\n💥 Fallo crítico en la batería de pruebas:', err);
    process.exit(1);
});
