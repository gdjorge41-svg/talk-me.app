#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════
# Talk-Me Pre-Launch Launcher V70 (macOS)
# Ejecución nativa con doble clic en Finder o vía Terminal
# ══════════════════════════════════════════════════════════════════════════

# 1. Configurar rutas estándares de macOS (Homebrew Intel y Apple Silicon, MacPorts, PATH de sistema)
export PATH="/opt/homebrew/bin:/usr/local/bin:/opt/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# 2. Cargar NVM si está instalado en el usuario
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh"
fi

# 3. Cargar FNM o asdf si existen
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

# 4. Búsqueda exhaustiva de node si aún no está en el PATH
if ! command -v node >/dev/null 2>&1; then
    LATEST_NVM_NODE=$(find "$HOME/.nvm/versions/node" -maxdepth 2 -type d -name "bin" 2>/dev/null | sort -V | tail -n 1)
    if [ -n "$LATEST_NVM_NODE" ]; then
        export PATH="$LATEST_NVM_NODE:$PATH"
    fi
fi

# 5. Posicionarse en la raíz del proyecto Talk.me
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.." || exit 1

echo "========================================================"
echo "   TALK.ME PRE-LAUNCH CABINA DE MANDO (macOS)"
echo "========================================================"
echo ""

# 6. Liberar puerto 3000 y limpiar procesos previos de whisper o node colgados
echo "[STABILIZER] Limpiando procesos previos y liberando puerto 3000..."
pkill -f "whisper-server" 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
rm -f "storage/message-history.json" 2>/dev/null || true

# 7. Verificar que Node.js esté disponible
if ! command -v node >/dev/null 2>&1; then
    echo "❌ ERROR: No se encontró Node.js en el sistema."
    echo "Instala Node.js desde https://nodejs.org o con 'brew install node'."
    echo ""
    read -p "Presiona [Enter] para cerrar..."
    exit 1
fi

NODE_VER=$(node -v)
echo "Entorno Node.js detectado: $NODE_VER"

# 8. Detectar la IP local activa en macOS (en0 Wi-Fi / en1 / bridge / localhost)
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

# 9. Abrir navegador por defecto en la cabina de mando
echo "Abriendo navegador en Cabina de Mando Pre-Launch..."
(sleep 1.2 && open "http://$MYIP:3000" 2>/dev/null) &

# 10. Arrancar el servidor Pre-Launch
echo "Iniciando Launchpad Pre-Launch..."
node pre-launch/launcher-server.js

# 11. Limpieza al salir (Ctrl+C o cierre)
echo ""
echo "[STABILIZER] Limpiando procesos y cache al salir..."
pkill -f "whisper-server" 2>/dev/null || true
rm -rf storage/media/images/* 2>/dev/null || true
rm -rf storage/media/recordings/* 2>/dev/null || true
rm -f "storage/message-history.json" 2>/dev/null || true

echo "Hecho."
read -p "Presiona [Enter] para salir..."
