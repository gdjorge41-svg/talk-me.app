#!/bin/bash
# ==============================================================================
# Script de Empaquetado Nativo macOS con hdiutil (UDZO Ultra Compressed)
# Basado en la arquitectura probada de Talk.me v60 (Compilacion_Limpia_Electron_macOS_v60.md)
# ==============================================================================
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "========================================================"
echo " [1/4] Localizando bundle Talk-me.app compilado..."
echo "========================================================"

APP_PATH=""
if [ -d "dist_final/mac-arm64/Talk-me.app" ]; then
    APP_PATH="dist_final/mac-arm64/Talk-me.app"
elif [ -d "dist_final/mac/Talk-me.app" ]; then
    APP_PATH="dist_final/mac/Talk-me.app"
fi

if [ -z "$APP_PATH" ] || [ ! -d "$APP_PATH" ]; then
    echo "❌ Error crítico: No se encontró el bundle Talk-me.app en dist_final."
    exit 1
fi
echo "  ✅ Bundle localizado en: $APP_PATH"

echo ""
echo "========================================================"
echo " [2/4] Aplicando sellado de código ad-hoc y permisos..."
echo "========================================================"
# Limpieza de atributos extendidos de compilación previa
xattr -cr "$APP_PATH" 2>/dev/null || true
# Sellado de código ad-hoc recursivo para Apple Silicon (M1-M6)
codesign --force --deep --sign - "$APP_PATH"
chmod -R 755 "$APP_PATH"
echo "  ✅ Bundle sellado y con permisos 755 listos."

echo ""
echo "========================================================"
echo " [3/4] Preparando layout de disco para el DMG..."
echo "========================================================"
DMG_STAGING="dist_final/dmg_staging"
rm -rf "$DMG_STAGING" 2>/dev/null || true
mkdir -p "$DMG_STAGING"

# Copiar Talk-me.app preservando permisos
cp -R "$APP_PATH" "$DMG_STAGING/"

# Crear acceso directo simbólico a /Applications
ln -s /Applications "$DMG_STAGING/Applications"

# Script autoejecutable de bienvenida y primer arranque (Auto-Reparar)
cat << 'EOF' > "$DMG_STAGING/Abrir Talk-me (Primer Arranque).command"
#!/bin/bash
clear
echo "======================================================="
echo "        Talk.me v60 - Activación y Primer Arranque     "
echo "======================================================="
echo ""
APP="/Applications/Talk-me.app"

if [ ! -d "$APP" ]; then
    echo "Copiando Talk-me a /Applications..."
    DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    cp -R "$DIR/Talk-me.app" /Applications/
fi

echo "Desbloqueando atributos de seguridad de Gatekeeper..."
xattr -cr "$APP" 2>/dev/null || true
xattr -dr com.apple.quarantine "$APP" 2>/dev/null || true
codesign --force --deep --sign - "$APP" 2>/dev/null || true

echo "¡Completado! Iniciando Talk.me..."
open "$APP"
sleep 2
exit 0
EOF

chmod +x "$DMG_STAGING/Abrir Talk-me (Primer Arranque).command"
echo "  ✅ Estructura staging del DMG lista."

echo ""
echo "========================================================"
echo " [4/4] Creando imagen DMG con hdiutil nativo de Apple..."
echo "========================================================"
DMG_OUTPUT="dist_final/Talk-me.app_60.2.0_Setup.dmg"
rm -f "$DMG_OUTPUT" 2>/dev/null || true

# Creación mediante hdiutil UDZO Ultra Compressed (exactamente como el 1 de Noviembre)
hdiutil create \
    -volname "Talk-me" \
    -srcfolder "$DMG_STAGING" \
    -ov \
    -format UDZO \
    "$DMG_OUTPUT"

rm -rf "$DMG_STAGING" 2>/dev/null || true

echo ""
echo "🎉 [ÉXITO] Instalador DMG nativo generado correctamente:"
ls -lh "$DMG_OUTPUT"
