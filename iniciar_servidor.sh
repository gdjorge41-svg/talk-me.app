#!/bin/bash
# Talk-Me Server V60 (macOS)
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
cd "$(dirname "$0")"


echo "[STABILIZER] Limpiando sesiones previas..."
pkill -f whisper-server 2>/dev/null || true
rm -f storage/message-history.json 2>/dev/null || true

echo "Detectando IP..."
MYIP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

echo "IP: $MYIP"
echo "URL: https://$MYIP:3000"

echo "Abriendo navegador..."
open "https://$MYIP:3000" 2>/dev/null || open "http://$MYIP:3000" 2>/dev/null || true

echo "Iniciando Node..."
node server.js

echo ""
echo "[STABILIZER] Limpiando procesos y cache al salir..."
pkill -f whisper-server 2>/dev/null || true
rm -rf storage/media/images/* 2>/dev/null || true
rm -rf storage/media/recordings/* 2>/dev/null || true
rm -f storage/message-history.json 2>/dev/null || true

echo "Hecho."
read -p "Presiona [Enter] para salir..."
