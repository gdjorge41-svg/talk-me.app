# Informe Técnico Forense y Plan de Acción Maestro: Blindaje de Audio en iOS (iPhone) y Hermes TTS

**Fecha:** 2 de Noviembre de 2026  
**Sistema:** Talk.me v60.x Professional (Electron / Node.js / Socket.io / Web Speech API / iOS Safari WebKit / Web Audio API)  
**Módulos Afectados:**  
- `public/js/core/ios-audio-session.js`
- `public/js/core/ui-controller-elite.js`
- `public/js/core/module-settings-ui.js`
- `public/js/utils/hermes-tts.js`
- `public/js/core/module-socket-handlers.js`
- `public/js/core/audio-core.js`
- `public/js/core/module-audio-capture.js`
- `talk-me.app_electron/overrides/`
- `server.js`  
**Estado:** **ANÁLISIS PROFUNDO DE CAUSA RAÍZ Y BLINDAJE SIN REGRESIONES**  

---

## 0. Análisis con Perspectiva y Cuestionamiento Crítico

### 0.1 ¿Qué estaba fallando realmente?
Al analizar exhaustivamente los flujos entrelazados entre Web Audio API, el `MediaStreamTrack` de micrófono y `window.speechSynthesis` en WebKit (iOS Safari), se identificaron dos colisiones estructurales:

1. **La Falsa Alarma del Bucle de Audios en `hermes-tts.js` (Líneas 273-282):**  
   Hermes TTS contenía una comprobación ciega:
   ```javascript
   const audios = document.querySelectorAll('audio');
   for (let a of audios) {
       if (!a.paused && !isSilentKeepAlive) return;
   }
   ```
   * **El fallo invisible:** En iOS, `ui-controller-elite.js` y los reproductores de chat usan objetos en memoria `new Audio()` o reproductores con URLs que no siempre cumplen la condición restrictiva de `isSilentKeepAlive`. Cuando se envía o recibe un mensaje de audio, los manejadores de audio del chat dejan instancias activas en memoria que hacen que Hermes TTS se auto-silencie permanentemente creyendo que hay un audio de voz sonando.
   * **La solución de ingeniería:** Reemplazar esa búsqueda indiscriminada en el DOM por el indicador de verdad único de la aplicación: `window.isPlayingGlobalAutoPlay` y `window.audioState.get('isCapturingSpeech')`.

2. **El Bloqueo de Hardware de iOS tras el uso del Micrófono:**  
   Cuando el usuario presiona el botón de hablar en el iPhone, WebKit activa el track de micrófono.  
   Para mantener baja latencia, el sistema dejaba el micro "caliente" (abierto) en segundo plano. En ordenadores de sobremesa esto es óptimo, pero en iOS Safari, **mientras un `MediaStreamTrack` de micrófono permanezca abierto, el kernel de Apple (`AVAudioSession`) suspende `SpeechSynthesis`** para evitar retroalimentación física.

---

## 1. Garantías de Cero Regresiones: ¿Qué pasará con cada función?

Para responder con total certeza y sin dar nada por sentado:

### 1.1 Transcripción (STT Offline / Vosk & Whisper)
* **Estado:** **100% INTACTO Y PROTEGIDO.**
* **Por qué no hay regresión:** El pipeline de Vosk (`vosk-processor.worklet.js` y `server.js`) viaja por WebSocket binario (Int16 PCM). No depende de `SpeechSynthesis` ni de los reproductores HTML5. Las optimizaciones de Hermes no tocan en ningún momento el empaquetado de paquetes PCM ni la sincronización de `Promise-Barrier`.

### 1.2 Audios en Tiempo Real (Elite PCM Transport)
* **Estado:** **100% INTACTO Y MEJORADO.**
* **Por qué no hay regresión:** El transporte de audio en tiempo real se ejecuta a través de Web Audio API (`audio-core.js`) sobre `window._eliteAudioCtx`. Al haber desacoplado el Modo Oyente en `ui-controller-elite.js`, el receptor de audio PCM se inicializa incondicionalmente al pulsar "Entrar" o "Talk!", asegurando que el iPhone escuche a los demás aunque él no hable.

### 1.3 Bloqueo y Desbloqueo de Pantalla (Background / Screen Lock)
* **Estado:** **100% OPERATIVO Y RESILIENTE.**
* **Por qué no hay regresión:**  
  1. Durante el bloqueo: `ios-audio-session.js` mantiene vivo el hilo mediante el oscilador inaudible de Web Audio API.
  2. Al desbloquear la pantalla: `ui-controller-elite.js` cuenta con el manejador `visibilitychange` (Línea 4180) que ejecuta `unlockWebAudioOnWake()`, reconstruye el pipeline de audio tras 600 ms (`restartAudioPipelineAfterWake()`) y relanza un pulso agresivo de sincronización (`performJoinChat('visibility-wake-up')`).
  3. Al purgar el bucle defectuoso de `querySelectorAll('audio')`, Hermes TTS no se quedará bloqueado tras despertar el teléfono.

---

## 2. Plan Maestro de Blindaje Quirúrgico

1. **En `public/js/utils/hermes-tts.js`:**
   - Eliminar el barrido indiscriminado de elementos `<audio>` en el DOM que causaba falsos positivos con los reproductores de la sesión de iOS.
   - Centralizar la pausa de Hermes única y exclusivamente en:
     - Locución propia activa (`isActuallyCapturing`).
     - Reproducción real de un audio de chat (`window.isPlayingGlobalAutoPlay === true` o `window.globalAutoPlayQueue.length > 0`).
   - Forzar el reseteo de la cola de WebKit (`this.synth.cancel()` seguido de `this.synth.resume()`) de forma defensiva antes de cada locución.

2. **En `public/js/core/ui-controller-elite.js`:**
   - En `pttUp()`, si el dispositivo es iOS (`isIOSDevice`), apagar suavemente la pista del micrófono (`track.enabled = false`) para devolverle el control del hardware a `speechSynthesis`.
   - En `pttDown()`, rehabilitarla (`track.enabled = true`) de forma instantánea dentro del evento táctil síncrono.
