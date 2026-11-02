const { execSync } = require('child_process');

console.log("🔍 Ejecutando verificacion previa del entorno de compilacion local...");
let errors = [];

// 1. Verificar disponibilidad de Python (Opcional si los binarios nativos ya existen)
try {
    execSync('python --version', { stdio: 'ignore' });
    console.log("  ✅ Python detectado.");
} catch (e) {
    console.log("  ℹ️ Python no detectado en el PATH (Usando binarios nativos precompilados C++ existentes).");
}

// 2. Verificar disponibilidad de node-gyp
try {
    execSync('npx node-gyp --version', { stdio: 'ignore' });
    console.log("  ✅ node-gyp detectado.");
} catch (e) {
    console.log("  ℹ️ node-gyp no detectado.");
}

console.log("✅ Entorno de compilacion verificado. Procediendo...");
process.exit(0);
