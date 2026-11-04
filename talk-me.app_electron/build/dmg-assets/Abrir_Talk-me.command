#!/bin/bash
# ==============================================================================
# Script de auto-reparación y primer arranque para macOS
# Elimina el bloqueo de Gatekeeper y abre Talk.me de forma automática
# ==============================================================================
echo "====================================================="
echo "   Talk.me - Asistente de Activación para macOS"
echo "====================================================="
echo ""

APP_PATH="/Applications/Talk-me.app"

# Si aún no está en Aplicaciones, buscar si está montada en el propio DMG
if [ ! -d "$APP_PATH" ]; then
    DMG_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    if [ -d "$DMG_DIR/Talk-me.app" ]; then
        echo "Copiando Talk-me a tu carpeta de Aplicaciones..."
        cp -R "$DMG_DIR/Talk-me.app" /Applications/
    fi
fi

if [ -d "$APP_PATH" ]; then
    echo "Desbloqueando atributos de seguridad de Gatekeeper..."
    xattr -cr "$APP_PATH" 2>/dev/null || true
    xattr -dr com.apple.quarantine "$APP_PATH" 2>/dev/null || true
    codesign --force --deep --sign - "$APP_PATH" 2>/dev/null || true
    
    echo "¡Listo! Iniciando Talk.me..."
    open "$APP_PATH"
else
    echo "Por favor, arrastra primero Talk-me a la carpeta Aplicaciones."
fi

# Cerrar la ventana de terminal tras 3 segundos
sleep 3
exit 0
