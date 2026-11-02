#!/bin/bash

# Configurar el título de la terminal en macOS
echo -n -e "\033]0;Talk-Me Server V60\007"

# Cambiar al directorio donde está guardado este script
cd "$(dirname "$0")"

echo "[STABILIZER] Limpiando sesiones previas y liberando puerto 3000..."

# Cerrar whisper-server si se está ejecutando (silenciosamente)
killall whisper-server >/dev/null 2>&1

# Buscar el proceso escuchando en el puerto 3000 y matarlo
PID_3000=$(lsof -t -i :3000)
if [ ! -z "$PID_3000" ]; then
    kill -9 $PID_3000 >/dev/null 2>&1
fi

# Eliminar el historial de mensajes de forma segura
rm -f "storage/message-history.json" 2>/dev/null

echo "Detectando IP..."

# Detectar la IP local activa (excluyendo la de loopback 127.0.0.1)
MYIP=$(ipconfig getifaddr $(route get default 2>/dev/null | awk '/interface:/ {print $2}') 2>/dev/null)

# Si por alguna razón no detecta IP activa, usa localhost por defecto
if [ -z "$MYIP" ]; then
    MYIP="localhost"
fi

echo "IP: $MYIP"
echo "URL: https://$MYIP:3000"

echo "Abriendo navegador..."
# El comando 'open' en macOS equivale al 'start' de Windows
open "https://$MYIP:3000"

echo "Iniciando Node..."
node server.js

echo ""
echo "[STABILIZER] Limpiando procesos y cache al salir..."
# Limpieza final al cerrar el proceso de Node
killall whisper-server >/dev/null 2>&1

# Borrar archivos dentro de las carpetas (el -f evita errores si están vacías)
rm -f storage/media/images/* 2>/dev/null
rm -f storage/media/recordings/* 2>/dev/null
rm -f storage/message-history.json 2>/dev/null

echo "Hecho."

# Pausa equivalente en macOS
read -p "Presiona [Enter] para salir..."