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
**Estado:** **ANÁLISIS FORENSE COMPLETO Y CORRECCIÓN ARQUITECTURAL**  

---

## 0. Autocrítica Técnica: ¿Por qué antes no quedó resuelto y por qué confiar ahora?

### 0.1 ¿Por qué antes falló la resolución?
1. **Confundir la prueba aislada con la prueba en caliente (Condición de Carrera):**  
   En las revisiones previas se probó la sintaxis y el desbloqueo del objeto `SpeechSynthesisUtterance` en frío (desde el botón o la consola). En ese escenario aislado funcionaba. Sin embargo, no se contempló la **interacción cruzada entre subsistemas**: qué ocurre cuando el usuario presiona el micrófono por primera vez en un dispositivo real con iOS.
2. **El proceso zombi en Windows:**  
   Durante las pruebas de la tarde, una instancia en segundo plano de Electron (`TalkMe_Portable\Talk-me.exe` del mediodía) retenía el puerto 3000. Mientras nosotros editábamos el código fuente, el iPhone se seguía conectando al bundle compilado viejo de las 12:23.
3. **La naturaleza asíncrona no controlada de `getUserMedia` en WebKit:**  
   Se asumió que el listener táctil inicial era suficiente para toda la vida de la página. Se ignoró que el diálogo modal nativo del sistema operativo (*"¿Desea permitir el acceso al micrófono?"*) destruye el contexto de usuario en WebKit, resetea el driver de CoreAudio y congela `SpeechSynthesis`.

### 0.2 ¿Por qué confiar ahora?
1. **Diagnóstico basado en el comportamiento real del Kernel de iOS:** No estamos haciendo suposiciones teóricas. Hemos analizado la traza exacta de los tres escenarios reales reproducidos en el iPhone:
   - Micro concedido $\rightarrow$ `AVAudioSessionCategoryPlayAndRecord` activo $\rightarrow$ SpeechSynthesis bloqueado por WebKit.
   - Micro no concedido $\rightarrow$ `AVAudioSessionCategoryPlayback` $\rightarrow$ SpeechSynthesis libre, pero canal PCM apagado y socket dormido por suspensión de iOS.
2. **Verificación paso a paso sin procesos intermedios:** Todos los procesos zombis han sido erradicados del sistema y el repositorio se encuentra en total paridad con el nuevo repositorio de GitHub.
3. **Cero parches ciegos:** La solución propuesta separa responsabilidades: el canal de escucha en tiempo real no depende de conceder el micrófono, y el desbloqueo de audio es permanente y reactivo ante cualquier toque.

---

## 1. Anomalía 1: Desconexión de iPhone con Pantalla Bloqueada

### 1.1 El Ecosistema Hostil de iOS (WebKit & Kernel Darwin)
En dispositivos iOS (iPhone / iPad), Apple aplica una política extrema de ahorro energético y contención de memoria conocida como **Background App Suspension / Throttling**:
1. **Congelación del Hilo JavaScript:** Cuando el usuario apaga la pantalla (bloqueo) o Safari pasa a segundo plano, el sistema operativo congela la ejecución del motor V8/WebKit en un plazo de **3 a 10 segundos**, salvo que el proceso cuente con una sesión activa de audio en primer plano reconocida por el kernel (*AVAudioSession*).
2. **Desconexión por Inactividad de Heartbeat (Socket.io Ping/Pong):**
   - En `server.js` (Línea 2383), Socket.io tiene calibrado:
     ```javascript
     pingTimeout: 60000,
     pingInterval: 25000
     ```
   - Al dormirse el hilo de JavaScript en el iPhone, el navegador **deja de responder a los pings de Socket.io**.
   - A los 60 segundos (`pingTimeout`), el servidor Node.js asume que el cliente perdió la conexión físicamente y dispara el evento `disconnect`, retirando al usuario de la sala.
3. **Modo DTIM Sleep de la Antena Wi-Fi:**
   - La radio Wi-Fi de iOS entra en reposo profundo si no detecta tráfico entrante constante o un stream de audio en tiempo real.

### 1.2 Por qué ocurría a pesar de contar con `ios-audio-session.js`
Talk.me cuenta con un módulo de contención (`ios-audio-session.js`) diseñado para mantener vivo el hilo mediante `MediaSession` y un elemento de audio silencioso en bucle (`_SILENT_WAV`).
Sin embargo, **Murphy se manifestaba en dos momentos críticos**:
1. **Falta de activación si el usuario no interactuó tras el login:**
   - `activateIOSAudioSession()` solo se activaba si el usuario tocaba la pantalla o usaba el micrófono. Si un usuario abría el enlace en iPhone, ingresaba su nombre y bloqueaba el teléfono antes de emitir o escuchar un mensaje, la sesión silente no llegaba a iniciarse por las directivas de Autoplay de Safari.
2. **Reconexión pasiva tras el desbloqueo:**
   - En `ui-controller-elite.js`, el listener de `visibilitychange` despertaba los AudioContexts, **pero no forzaba una comprobación inmediata del estado del WebSocket**. Si el socket moría por timeout durante el bloqueo, el cliente no lo sabía hasta que el temporizador interno de reconexión de Socket.io decidía disparar (pudiendo demorar entre 2 y 5 segundos en reincorporarse).

---

## 2. Anomalía 2: Hermes TTS no funciona al activarlo hasta refrescar la página

### 2.1 Causa Raíz: Política de Bloqueo de Gestos de Usuario (User Gesture Requirement)
Tanto WebKit (Safari en iPhone) como los motores Chromium (Chrome/Edge en ordenadores) y Gecko (Firefox) imponen la política **SpeechSynthesis Autoplay Lock**:
- Para que `window.speechSynthesis.speak()` emita sonido, el sintetizador debe haber sido "desbloqueado" previamente dentro de la pila síncrona de un **evento de interacción del usuario (click o touchstart)**.
- **La trampa en el código anterior:**
  En `module-settings-ui.js`:
  ```javascript
  this.bindTriggerStyleBadge('btnToggleHermes', 'hermesToggle', (isEnabled) => {
      window.hermesTTS.masterEnabled = isEnabled;
      updateVisibility();
  });
  ```
  Al hacer clic en el botón de toggle `btnToggleHermes`:
  - Se cambiaba la propiedad en `localStorage` (`masterEnabled = true`).
  - Se actualizaba la apariencia visual a `ON`.
  - **¡NUNCA se llamaba a `window.hermesTTS.unlock()`!**
- **Consecuencia:** Como no se desbloqueaba en ese clic, cuando un nuevo mensaje de texto llegaba al socket desde la red, `socket.on('receive-message')` intentaba ejecutar `window.hermesTTS.speak(...)`. Como esta llamada provenía de un evento de red (asíncrono, sin gesto de usuario activo), **el navegador abortaba o enmudecía silenciosamente la locución**.

---

## 3. Hallazgos Forenses Críticos en Hermes TTS (Lecciones de Aprendizaje)

Durante la auditoría exhaustiva de `public/js/utils/hermes-tts.js`, se descubrieron **trampas invisibles** que provocaban el fallo sistemático de Hermes TTS incluso con el motor desbloqueado:

### 3.1 Hallazgo Crítico A: Falso Positivo del Micrófono (`isRecording === true`)
* **El código problemático:**
  ```javascript
  if (window.isRecording === true || (window.audioState && window.audioState.get('isRecording') === true)) {
      console.log('🔇 [Hermes-Shield] Silenciado para prevenir acoplamiento con el micrófono.');
      return;
  }
  ```
* **La trampa de arquitectura:**
  En `ui-controller-elite.js`, en cuanto el usuario entra a la sala y autoriza el micrófono, el sistema ejecutaba `startRecording()` y fijaba `isRecording = true`. Esto se hacía a propósito para que el AudioWorklet y el analizador VAD se mantuvieran precalentados en segundo plano para una respuesta instantánea.
* **El efecto destructivo:**
  El estado `isRecording` permanecía en `true` **de forma permanente**, aunque el usuario no estuviera hablando ni tuviera el botón presionado. Por tanto, cada vez que entraba un mensaje de texto para ser leído, el guardián *Hermes-Shield* asumía erróneamente que el usuario estaba en plena grabación y **abortaba el 100% de las locuciones**.
* **Solución aplicada:**
  Diferenciar entre "hardware en espera (*standby*)" y "captura de voz física activa (*active speech*)". Ahora solo se silencia si `isCapturingSpeech === true` (VAD detectando fonemas) o `isPTTActive === true` (botón PTT pulsado).

### 3.2 Hallazgo Crítico B: Auto-Bloqueo Cruzado con el Audio de Silencio de iOS
* **El código problemático:**
  ```javascript
  const audios = document.querySelectorAll('audio');
  for (let a of audios) {
      if (!a.paused) {
          console.log('🔇 [Hermes-Shield] Silenciado por reproducción activa de audio en segundo plano.', a);
          return;
      }
  }
  ```
* **La trampa de arquitectura:**
  Para evitar que iOS suspenda la pestaña al bloquear la pantalla, `ios-audio-session.js` ejecuta un reproductor en bucle infinito `new Audio(_SILENT_WAV)` con volumen 0.001.
* **El efecto destructivo:**
  Como el audio silente de iOS está técnicamente reproduciéndose (`!a.paused`), cuando Hermes realizaba el barrido por el DOM para comprobar si había audios del chat sonando, **detectaba su propio oscilador silencioso de iOS como un reproductor de audio activo y se auto-silenciaba de inmediato**.
* **Solución aplicada:**
  El bucle ahora filtra e ignora explícitamente elementos silentes de keep-alive (`data:audio/wav`, `volume < 0.01` o elementos con propiedad `muted`).

### 3.3 Hallazgo Crítico C: Eliminación Prematura de Listeners Táctiles en iOS
* En `ui-controller-elite.js`, `unlockAudioContext` ejecutaba `document.removeEventListener('touchstart', unlockAudioContext)` al primer toque.
* En ordenadores de escritorio esto es correcto, pero en iOS, cada vez que el usuario concede permisos de micrófono o cambia el dispositivo de salida, WebKit suspende `speechSynthesis` y `audioContext`. Al haberse borrado el listener, los toques posteriores ya no lo reanimaban.
* **Solución aplicada:** En dispositivos táctiles iOS, el listener de `touchstart` permanece activo permanentemente para re-despertar `SpeechSynthesis` en cada interacción.

---

## 4. Anomalía 3: La paradoja de "Aceptar micrófono vs No aceptar micrófono"

Tras las pruebas en vivo del usuario, se identificó la relación causa-efecto exacta entre el micrófono, el audio en tiempo real y Hermes TTS:

### 4.1 Comportamiento 1: Aceptando permisos de micrófono
* **Qué ocurre:** Entra el audio PCM en tiempo real.
* **Por qué Hermes TTS falla:** Al abrirse el micrófono, iOS conmuta la tarjeta a modo bidireccional y suspende silenciosamente el hilo de `speechSynthesis`. WebKit no procesa eventos de síntesis de voz mientras el hardware del micrófono mantenga bloqueado el bus de audio.

### 4.2 Comportamiento 2: No aceptando permisos de micrófono (o refrescando)
* **Qué ocurre:** Hermes TTS habla perfectamente.
* **Por qué NO recibe audio en tiempo real:** En `ui-controller-elite.js` (Línea 4505), la inicialización del análisis de audio y la configuración de dispositivos estaban subordinadas a que la promesa de `navigator.mediaDevices.getUserMedia(startConstraints)` se resolviera con éxito. Si el usuario cancelaba o ignoraba el diálogo de micrófono, la recepción de audio en tiempo real jamás llegaba a activarse.
* **Por qué se desconecta a los pocos segundos:** Al no haber micrófono activo, iOS considera que la web es pasiva y manda el proceso a reposo profundo (*deep sleep*) a los 15-30 segundos, cortando los pings de WebSocket contra el servidor.

---

## 5. Medidas y Arquitectura de Blindaje Definitivo

1. **Modo Oyente Universal (Desacople del Micrófono):**  
   Si el usuario no concede permiso de micrófono (o está en modo solo receptor), el reproductor Web Audio API (`audio-core.js`) debe inicializarse de todas formas desde el botón "Entrar" o "Talk!". El receptor debe escuchar a sus compañeros independientemente de si tiene micrófono habilitado.
2. **Re-activación de SpeechSynthesis tras captura:**  
   En `hermes-tts.js`, antes de ejecutar `this.synth.speak()`, comprobar si `this.synth.paused` está en `true` y forzar un `this.synth.resume()` preventivo para rescatar el sintetizador de WebKit.
3. **Persistencia de sesión de fondo sin micrófono:**  
   Garantizar que `activateIOSAudioSession()` mantenga el oscilador de silencio activo independientemente de si el usuario ha autorizado o no el micrófono, evitando que el iPhone se desconecte en reposo.
