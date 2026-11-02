const translationEngine = require('../modules/ai/translation-engine.js');
const madladDaemon = require('../modules/ai/madlad-daemon.js');
const assert = require('assert');

async function testPhraseRegression() {
    console.log('🧪 Probando inferencia en vivo con el motor C++...');
    await translationEngine.init();
    
    // Test 1: "hola cómo estás"
    console.log('\n--- Test 1: "hola cómo estás" ---');
    const t0 = Date.now();
    const res1 = await translationEngine.translate('hola cómo estás', 'es', 'en');
    const elapsed1 = Date.now() - t0;
    console.log(`Resultado (${elapsed1}ms): "${res1}"`);
    assert(!res1.includes('Hi how are you. Hi how are you'), 'FALLO: El resultado aún contiene el bucle');
    assert.strictEqual(res1.toLowerCase().includes('how are you'), true, 'El resultado debe traducir la frase');
    console.log('✅ PASS: Duplicación eliminada en "hola cómo estás".');

    // Test 2: "okay okay recibido"
    console.log('\n--- Test 2: "okay okay recibido" ---');
    translationEngine.clearCache();
    const t1 = Date.now();
    const res2 = await translationEngine.translate('okay okay recibido', 'es', 'en');
    const elapsed2 = Date.now() - t1;
    console.log(`Resultado (${elapsed2}ms): "${res2}"`);
    assert(!res2.includes('Okay okay received Okay okay received'), 'FALLO: Duplicación encontrada');
    assert(!res2.includes('Okay received Okay received'), 'FALLO: Duplicación encontrada');
    console.log(`✅ PASS: "okay okay recibido" -> "${res2}" limpio y sin bucles.`);
    
    madladDaemon.terminate();
    process.exit(0);
}

testPhraseRegression().catch(err => {
    console.error('❌ Error en test de frase:', err);
    process.exit(1);
});
