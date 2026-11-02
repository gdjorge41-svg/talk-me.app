---
name: electron-vosk-architecture
description: Reglas y arquitectura crítica de compilación Electron y motor de transcripción Vosk offline en Talk.me
---

# Arquitectura Crítica: Electron + Vosk STT Offline

## 1. Resolución de Rutas de Modelos Vosk (`getModelsPath`)
- **Validación de Existencia Obligatoria**: `getModelsPath()` NUNCA debe retornar una ruta de `models-path.json` a ciegas sin verificar previamente `fs.existsSync(data.modelsPath)`.
- **Búsqueda Ascendente (5 Niveles)**: Para soportar entornos de ejecución en staging (`app_build`), empaquetados o subdirectorios, `getModelsPath()` debe incluir siempre el bucle de escaneo ascendente de parent directories para localizar `vosk-model-small-es-0.42` y `vosk-model-small-en-us-0.15`.
- **Copia de Modelos en Compilación**: `prepare-build.bat` debe incluir explícitamente la copia de carpetas de modelos `vosk-model-small-es-0.42` y `vosk-model-small-en-us-0.15` hacia `app_build\`.

## 2. Ejecución de Subprocesos Node/Vosk en Electron (`getChildBinary`)
- **Evitar Choque de ABI V8/Electron en Módulos C++ (ffi-napi / ref-napi)**: En `main.js`, `startChatServer()` y `startLauncher()` deben utilizar la función helper `getChildBinary()` para priorizar el binario `node` del sistema operativo cuando esté disponible.
- **Razón**: Si se fuerza `process.execPath` (el ejecutable de Electron), el módulo nativo C++ de Vosk (`vosk.node`) falla silenciosamente con `Error: Error in native callback` por incompatibilidad de ABI entre V8/Electron y Node N-API.

## 3. Ocultamiento de Consola CMD
- `windowsHide: true` debe mantenerse activado en los `spawn` de `main.js` para evitar ventanas negras flotantes de la consola del sistema.

## 4. Compilación del Dashboard React / Vite (`dashboard/dist`)
- **Ejecutar vía `cmd.exe`**: Para esquivar restricciones de scripts PowerShell (`Execution_Policies`), compilar siempre con `cmd.exe /c "npm run build"` dentro de `dashboard/`.
- **Verificación**: Comprobar que `dist/index.html` referencie el nuevo bundle JS generado en `dist/assets/` antes de desplegar al FTP.
