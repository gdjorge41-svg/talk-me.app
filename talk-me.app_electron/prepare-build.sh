#!/usr/bin/env bash
# ==============================================================================
# Talk.me Electron - Script de Preparación de Staging para macOS (app_build)
# Cumple con la Ley de Murphy e Ingeniería Defensiva Multiplataforma
# ==============================================================================
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "========================================================"
echo " [1/6] Diagnosticando entorno C++ y Node..."
echo "========================================================"
node check-build-env.js

echo ""
echo "========================================================"
echo " [2/6] Limpiando procesos previos y carpetas..."
echo "========================================================"
killall "Talk-me" 2>/dev/null || true
killall "electron" 2>/dev/null || true
rm -rf dist_final 2>/dev/null || true
rm -rf app_build 2>/dev/null || true
mkdir -p app_build

echo ""
echo "========================================================"
echo " [3/6] Copiando archivos base del proyecto original..."
echo "========================================================"

# Lista de exclusión para rsync
EXCLUDE_ARGS=(
    --exclude="node_modules"
    --exclude=".git"
    --exclude="00dev-backups"
    --exclude="00 DOCS"
    --exclude="backups"
    --exclude="scratch"
    --exclude="storage/models"
    --exclude="storage/media"
    --exclude="storage/temp"
    --exclude="storage/recordings"
    --exclude="*.tmp"
    --exclude="*.zip"
    --exclude="*.bak"
    --exclude=".DS_Store"
    --exclude="._*"
)

rsync -a "${EXCLUDE_ARGS[@]}" ../config app_build/
rsync -a "${EXCLUDE_ARGS[@]}" ../modules app_build/
rsync -a "${EXCLUDE_ARGS[@]}" ../pre-launch app_build/
rsync -a "${EXCLUDE_ARGS[@]}" ../public app_build/
rsync -a "${EXCLUDE_ARGS[@]}" ../storage app_build/
rsync -a "${EXCLUDE_ARGS[@]}" ../views app_build/
if [ -d "../triggers" ]; then
    rsync -a "${EXCLUDE_ARGS[@]}" ../triggers app_build/
fi

cp -f ../server.js app_build/
cp -f ../package.json app_build/
cp -f ../package-lock.json app_build/
[ -f ../server.key ] && cp -f ../server.key app_build/ || true
[ -f ../server.cert ] && cp -f ../server.cert app_build/ || true

# Modelos Vosk si están en la raíz
if [ -d "../vosk-model-small-es-0.42" ]; then
    echo "  -> Copiando modelo Vosk Español..."
    rsync -a ../vosk-model-small-es-0.42 app_build/
fi
if [ -d "../vosk-model-small-en-us-0.15" ]; then
    echo "  -> Copiando modelo Vosk Inglés..."
    rsync -a ../vosk-model-small-en-us-0.15 app_build/
fi

# Binarios nativos opcionales si existen
if [ -d "../bin/translate" ]; then
    rsync -a "${EXCLUDE_ARGS[@]}" ../bin/translate app_build/bin/
fi
if [ -d "../bin/tts" ]; then
    rsync -a "${EXCLUDE_ARGS[@]}" ../bin/tts app_build/bin/
fi
if [ -d "../storage/models/tts" ]; then
    rsync -a "${EXCLUDE_ARGS[@]}" ../storage/models/tts app_build/storage/models/
fi
if [ -d "../bin/whisper" ]; then
    rsync -a "${EXCLUDE_ARGS[@]}" ../bin/whisper app_build/bin/
fi

echo ""
echo "========================================================"
echo " [3.5/6] Purgando artefactos intermedios y temporales..."
echo "========================================================"
find app_build/bin -name "*.pdb" -delete 2>/dev/null || true
find app_build/bin -name "*.lib" -delete 2>/dev/null || true
find app_build/bin -name "*.exp" -delete 2>/dev/null || true
find app_build/bin -name "*.obj" -delete 2>/dev/null || true
find app_build -name ".DS_Store" -delete 2>/dev/null || true
find app_build -name "._*" -delete 2>/dev/null || true

echo ""
echo "========================================================"
echo " [4/6] Aplicando overrides de escritorio y fusionando dependencias..."
echo "========================================================"
if [ -d "overrides" ]; then
    rsync -a overrides/ app_build/
fi
cp -f main.js app_build/
cp -f preload.js app_build/

node -e "
const fs = require('fs');
const p1 = JSON.parse(fs.readFileSync('./app_build/package.json', 'utf8'));
const p2 = JSON.parse(fs.readFileSync('./app_build/pre-launch/package.json', 'utf8'));
p1.dependencies = { ...p1.dependencies, ...p2.dependencies };
p1.main = 'main.js';
p1.author = 'Jorge González Domínguez / Jorge.Lighting <info@talk-me.app>';
p1.homepage = 'https://www.talk-me.app';
fs.writeFileSync('./app_build/package.json', JSON.stringify(p1, null, 2), 'utf8');
"

echo ""
echo "========================================================"
echo " [5/6] Instalando dependencias limpias de producción en staging..."
echo "========================================================"
cd app_build
npm install --omit=dev
cd ..
echo "  [OK] Dependencias limpias de producción listas en staging."

echo ""
echo "========================================================"
echo " [6/6] Estructura app_build lista. Auditando integridad..."
echo "========================================================"
node check-build-integrity.js

echo ""
echo "✅ [OK] Compilación lista para ejecutar electron-builder."

