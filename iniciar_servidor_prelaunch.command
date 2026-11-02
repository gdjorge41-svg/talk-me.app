#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════
# Talk-Me Pre-Launch Launcher V70 (macOS)
# Ejecución directa con doble clic desde la raíz o dentro de pre-launch
# ══════════════════════════════════════════════════════════════════════════

# 1. Configurar rutas estándares de macOS
export PATH="/opt/homebrew/bin:/usr/local/bin:/opt/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# 2. Cargar gestores de versiones de Node (nvm, fnm, asdf) si existen
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
fi

if [ -d "$HOME/.local/state/fnm" ]; then
    export PATH="$HOME/.local/state/fnm:$PATH"
    eval "$(fnm env 2>/dev/null)" 2>/dev/null
elif [ -d "$HOME/.fnm" ]; then
    export PATH="$HOME/.fnm:$PATH"
    eval "$(fnm env 2>/dev/null)" 2>/dev/null
fi

if [ -s "$HOME/.asdf/asdf.sh" ]; then
    . "$HOME/.asdf/asdf.sh"
fi

if ! command -v node >/dev/null 2>&1; then
    LATEST_NVM_NODE=$(find "$HOME/.nvm/versions/node" -maxdepth 2 -type d -name "bin" 2>/dev/null | sort -V | tail -n 1)
    if [ -n "$LATEST_NVM_NODE" ]; then
        export PATH="$LATEST_NVM_NODE:$PATH"
    fi
fi

# 3. Ubicarse en el directorio raíz del proyecto
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" || exit 1

echo "========================================================"
echo "   TALK.ME PRE-LAUNCH CABINA DE MANDO (macOS)"
echo "========================================================"
echo ""

# 4. Liberar puerto 3000 y estabilizar procesos
echo "[STABILIZER] Limpiando procesos previos y liberando puerto 3000..."
pkill -f "whisper-server" 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
rm -f "storage/message-history.json" 2>/dev/null || true

# 5. Comprobar Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "❌ ERROR: No se encontró Node.js en este Mac."
    echo "Instala Node.js desde https://nodejs.org o ejecutando 'brew install node'."
    echo ""
    read -p "Presiona [Enter] para cerrar..."
    exit 1
fi

echo "Entorno Node.js detectado: $(node -v)"

# 6. Detectar IP local
echo "Detectando IP local de red..."
MYIP=$(ipconfig getifaddr en0 2>/dev/null)
if [ -z "$MYIP" ]; then
    MYIP=$(ipconfig getifaddr en1 2>/dev/null)
fi
if [ -z "$MYIP" ]; then
    MYIP=$(ipconfig getifaddr bridge0 2>/dev/null)
fi
if [ -z "$MYIP" ]; then
    MYIP="localhost"
fi

echo "IP: $MYIP"
echo "URL de Control: http://$MYIP:3000"
echo ""

# 7. Abrir navegador por defecto en http://$MYIP:3000
echo "Abriendo navegador en Cabina de Mando Pre-Launch..."
(sleep 1.2 && open "http://$MYIP:3000" 2>/dev/null) &

# 8. Iniciar el servidor
echo "Iniciando Launchpad Pre-Launch..."
node pre-launch/launcher-server.js

# 9. Limpieza al salir
echo ""
echo "[STABILIZER] Limpiando procesos y cache al salir..."
pkill -f "whisper-server" 2>/dev/null || true
rm -rf storage/media/images/* 2>/dev/null || true
rm -rf storage/media/recordings/* 2>/dev/null || true
rm -f "storage/message-history.json" 2>/dev/null || true

echo "Hecho."
read -p "Presiona [Enter] para salir..."

