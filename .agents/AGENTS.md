# Reglas Críticas de Arquitectura - Talk.me Electron & Transcripción Vosk

## 1. Resolución de Rutas de Modelos Vosk (`getModelsPath`)
- **Validación de Existencia Obligatoria**: `getModelsPath()` NUNCA debe retornar una ruta de `models-path.json` a ciegas sin verificar previamente `fs.existsSync(data.modelsPath)`.
- **Búsqueda Ascendente (5 Niveles)**: Para soportar entornos de ejecución en staging (`app_build`), empaquetados o subdirectorios, `getModelsPath()` debe incluir siempre el bucle de escaneo ascendente de parent directories para localizar `vosk-model-small-es-0.42` y `vosk-model-small-en-us-0.15`.
- **Copia de Modelos en Compilación**: `prepare-build.bat` debe incluir explícitamente la copia de carpetas de modelos `vosk-model-small-es-0.42` y `vosk-model-small-en-us-0.15` hacia `app_build\`.

## 2. Ejecución de Subprocesos Node/Vosk en Electron (`getChildBinary`)
- **Evitar Choque de ABI V8/Electron en Módulos C++ (ffi-napi / ref-napi)**: En `main.js`, `startChatServer()` y `startLauncher()` deben utilizar la función helper `getChildBinary()` para priorizar el binario `node` del sistema operativo cuando esté disponible.
- **Razón**: Si se fuerza `process.execPath` (el ejecutable de Electron), el módulo nativo C++ de Vosk (`vosk.node`) falla silenciosamente con `Error: Error in native callback` por incompatibilidad de ABI entre V8/Electron y Node N-API.

## 3. Ocultamiento de Consola CMD
- `windowsHide: true` debe mantenerse activado en los `spawn` de `main.js` para evitar ventanas negras flotantes de la consola del sistema.

## 4. Compilación del Dashboard (`dashboard/dist`)
- **Ejecución Obligatoria con `cmd.exe /c "npm run build"`**:
  - En Windows/PowerShell, `npx.ps1` o scripts `.ps1` pueden fallar por la política de ejecución del sistema (`Execution_Policies` / `UnauthorizedAccess`).
  - Para compilar el dashboard de Vite siempre a la primera y sin bloqueos de PowerShell, ejecutar SIEMPRE:
    ```cmd
    cmd.exe /c "npm run build"
    ```
    desde el directorio `dashboard/`.
- **Verificación de Sobrescritura de Bundle**:
  - Tras compilar, verificar que `dist/index.html` apunte al bundle hash recién generado en `dist/assets/` y comprobar con node que los nuevos cambios estén presentes en el bundle JS generado antes de darlo por listo para FTP.

## 5. Ley de Murphy e Ingeniería Defensiva Obligatoria ("A prueba de fallos")
- **Asumir la Ley de Murphy en cada cambio**: Todo nuevo diseño, refactorización o parche debe asumir que las entradas pueden ser inválidas, los estados pueden no estar sincronizados y las conexiones pueden fallar o estar en proceso de reconexión.
- **Fallbacks Incondicionales**: NUNCA modificar un flujo de datos o eventos de Socket/Server sin incluir un bloque `try-catch` de contención y un *fallback seguro* (ej. broadcast global si el filtrado selectivo por usuario falla) para prevenir la pérdida de avisos o cuelgues en producción.
- **Garantía Incondicional al Emisor**: Todo evento iniciado por un usuario en el cliente/servidor debe garantizar la retroalimentación inmediata al emisor (`socket.id`), asegurando respuesta visual independientemente de estados intermedios.
- **Cero Efectos Secundarios en Producción**: Verificar siempre que los parches no rompan la compatibilidad de carga útil (payloads) de otros componentes existentes.

## 6. Topología de Procesos y Soberanía Offline ("Air-Gapped")
- **Aislamiento de Demonios C++**: `madlad-translator.exe` (CTranslate2 INT8 ~2.8 GB mmap) y `piper.exe` (ONNX TTS) corren como procesos hijos persistentes comunicados por `stdin`/`stdout`. Jamás bloquear el Event Loop de Node con inferencias síncronas.
- **Watchdog Dinámico de Traducción**: Tiempo límite $T = 4000\text{ ms} + (\text{palabras} \times 260\text{ ms})$ con techo absoluto en 16 segundos. Si expira o falla, retornar de inmediato el texto original con degradación elegante.
- **Cola de Traducción Acotada**: Máximo 3 peticiones concurrentes encoladas (FIFO). Si se supera, aplicar fallback al idioma original para evitar el efecto "lag blizzard".
- **Síntesis de Audio en Memoria RAM**: Piper genera WAV crudo por `stdout`; Node inyecta la cabecera RIFF de 44 bytes en memoria y emite en Base64. NUNCA escribir archivos temporales en SSD para audio en tiempo real.

## 7. Dictamen Jurídico y Licenciamiento Comercial (Zero-NC / Zero-GPL)
- **100% Licencias Permisivas (MIT y Apache 2.0)**: Node/Express (MIT), Socket.io (MIT), Vosk ASR (Apache 2.0), MADLAD-400-3B (Apache 2.0), CTranslate2 (MIT), Piper TTS (MIT), Maider eu_ES (MIT/OpenSLR), Electron (MIT), sACN/e131 (MIT), OSC (MIT/LGPL v2.1 aislado vía UDP).
- **Prohibición de Contaminación**: NUNCA incorporar librerías bajo GPL v3, AGPL ni cláusulas Non-Commercial (NC) que invaliden la explotación comercial, venta o alquiler de Talk.me.

## 8. Principio de Ingeniería de "Ojo Clínico Permanente" y Pensamiento Crítico
- **Cero Suposiciones / Duda Sistemática**: Nunca dar por sentada una solución o validación a la primera sin auditar las interacciones cruzadas en caliente (hardware, estados de red, ciclo de vida del SO móvil).
- **Verificación en Profundidad**: Toda afirmación debe estar respaldada por el flujo real de datos y el comportamiento del kernel (ej. WebKit/CoreAudio en iOS, threading de Node en Windows/Linux/macOS).
- **Nomenclatura Estándar Inmutable de Instaladores**: Todo artefacto de distribución se nombra estrictamente: `Talk-me.app_${version}_Setup.${ext}` (ej. `Talk-me.app_1.0.0_Setup.exe`, `Talk-me.app_1.0.0_Setup.dmg`, `Talk-me.app_1.0.0_Setup.AppImage`).
- **Anticipación Proactiva de Infraestructura**: Mantener dependencias de CI/CD al día (Node.js 22 LTS) sin esperar a fallos en compilaciones de producción.

## 9. Sincronización Espejo Obligatoria (`public/` <-> `overrides/`)
- **Indivisibilidad de Cambios**: Cualquier modificación en la lógica del cliente web (`public/js/`, `public/css/`, `views/`) DEBE sincronizarse de forma inmediata e indivisible en `talk-me.app_electron/overrides/` antes de cualquier commit o compilación.
- **Razón**: `prepare-build.bat` sobrescribe `public/` con `overrides/` durante la etapa 4 de compilación; si no están en paridad exacta, se restaurarán versiones viejas rotas en el empaquetado final.

## 10. Erradicación Previa de Procesos Zombis
- **Liberación Estricta del Puerto 3000**: Antes de dar por válida una prueba local o iniciar el servidor, es imperativo verificar y purgar instancias huérfanas (`Stop-Process -Name 'Talk-me','node' -Force` en Windows o `killall` en Unix).
- **Razón**: Si un proceso zombi retiene el puerto 3000, los dispositivos cliente (iPhone/PC remoto) se conectan al bundle en memoria de la versión antigua enmascarando cualquier corrección.

## 11. Auditoría del Binario Desempaquetado Post-Build
- **Verificación Física en `dist_final`**: Tras cada empaquetado con `electron-builder`, el agente debe inspeccionar programáticamente el contenido en `dist_final/win-unpacked/resources/app/...` para verificar con `includes()` que los identificadores y parches críticos (`v60.x`) están físicamente presentes en los archivos JS desempaquetados.

## 12. Regla de Coexistencia de Audio en iOS (WebKit CoreAudio Protocol)
- **Exclusión Mutua de Hardware**: En Safari/iOS, `window.speechSynthesis` y `getUserMedia` colisionan en el kernel (`AVAudioSessionCategoryPlayAndRecord`). NUNCA mantener tracks de micrófono en estado `live` en reposo si se requiere que el dispositivo reciba o lea textos por TTS.
- **Ciclo PTT en iOS**: Al soltar el micro (`pttUp`), `track.enabled = false` es obligatorio para liberar el bus de audio y reanimar `speechSynthesis.resume()`. Al pulsar (`pttDown`), `track.enabled = true` se reactiva síncronamente dentro del evento táctil.

## 13. Reglas Inmutables de Compilación CI/CD Multiplataforma (Windows, macOS, Linux)
- **Prohibición Absoluta de Hard Links (`USE_HARD_LINKS=false`)**:
  - Al utilizar `"asar": false` para permitir la modularidad de scripts en staging, `electron-builder` intenta por defecto crear hard links (`fs.link()`) en los runners de GitHub Actions (Ubuntu ext4 y macOS APFS).
  - Esto provoca invariablemente el fallo `Error: EEXIST: file already exists, link ... node_modules/ansi-regex/...`.
  - **Obligatorio**: Todos los pipelines de CI (`build-linux.yml`, `build-mac.yml`, `build-windows.yml`) y scripts locales de empaquetado DEBEN definir `USE_HARD_LINKS: "false"` para forzar copia física limpia y evitar colisiones de inodos.
- **Soberanía del Package.json de Staging (Zero-Dependencies en Root Electron)**:
  - `talk-me.app_electron/package.json` DEBE contener únicamente `devDependencies` (`electron` y `electron-builder`).
  - NUNCA declarar dependencias de producción (`dependencies`) en `talk-me.app_electron/package.json`. Toda dependencia de runtime se instala exclusivamente dentro de `app_build/` durante el paso 5 de `prepare-build`. Declarar dependencias en la raíz provoca duplicidad y conflicto en el árbol de enlaces de `electron-builder`.
- **Ecosistema y Scripts Multiplataforma**:
  - **Windows**: Ejecutar `prepare-build.bat` previo a `electron-builder --win --x64`. Genera Setup NSIS y ejecutable Portable.
  - **macOS**: Exigir `chmod +x` en `prepare-build.sh`, `create-dmg-hdiutil.sh` y scripts de `pkg-scripts`. Genera `.pkg`, `.dmg` nativo con `hdiutil` (UDZO) y `.zip` universal/arm64 sin certificados de pago (`identity: "-"`).
  - **Linux**: Ejecutar `prepare-build.sh` previo a `electron-builder --linux AppImage deb`. Genera `.AppImage` y `.deb` filtrando estrictamente cualquier ejecutable `.exe` de Windows.




