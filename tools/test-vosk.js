try {
  const vosk = require('vosk');
  console.log('✅ Vosk is available');
  console.log('Vosk version:', vosk.version || 'unknown');
} catch (e) {
  console.log('❌ Vosk is NOT available:', e.message);
}
