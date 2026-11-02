/**
 * Talk.me Dual Device Animation Engine
 * Sincronización 1:1 Laptop Master + Smartphone Cliente
 * Soporte multilingüe, transcripción progresiva, traducción Babel IA,
 * y triggers TimeCode SMPTE IN/OUT (idéntico a la captura real de Talk-me)
 */

(function () {
  let currentLang = 'es';
  let isRunning = false;
  let activeTimers = [];

  function safeTimeout(fn, delay) {
    const id = setTimeout(fn, delay);
    activeTimers.push(id);
    return id;
  }

  function clearAllTimers() {
    activeTimers.forEach(id => clearTimeout(id));
    activeTimers = [];
  }

  // Diccionario multilingüe de sincronización dual para los mensajes de la coreografía
  const dialogs = {
    es: {
      subtitle: "Simulación 1:1 en Portátil y Móvil con transmisión, traducción y triggers en tiempo real",
      catProduccion: "PRODUCCION",
      catLuzFx: "LUZ / FX",
      catSonido: "SONIDO",
      catRegiduria: "REGIDURIA",
      catGeneral: "GENERAL",
      statusSilence: "EN SILENCIO",
      statusTransmitting: "TRANSMITIENDO...",
      pushJorgeTitle: "Jorge (Producción)",
      pushJorgeDesc: "Transmitiendo audio en vivo...",
      msgJorge1: "DONDE ESTAS TC",
      msgJorgeAudio: "Comenzamos el ensayo técnico en 5 minutos. Revisando focos principales y matriz de audio.",
      msgSofiaOrig: "Projecteurs principaux prêts en bleu néon !",
      msgSofiaTrad: "¡Focos principales listos en azul neón! Efectos probados.",
      msgCarlosAudio: "Niveles de mesa y micrófonos inalámbricos en verde. Latencia estabilizada en 170ms.",
      msgElenaText: "Confirmado. Copia de respaldo enviada al servidor secundario.",
      triggerTcTitle: "INTRO+MEZU BAT",
      triggerTcVal: "TIMECODE 01:00:00:00",
      triggerShowStart: "¡Comienza el show!",
      triggerOscOut: "OSC /talkme/cue/go (DISPARO ENVIADO)"
    },
    en: {
      subtitle: "1:1 Dual Simulation on Laptop & Mobile with real-time transmission, translation & triggers",
      catProduccion: "PRODUCTION",
      catLuzFx: "LIGHTS / FX",
      catSonido: "SOUND",
      catRegiduria: "STAGE DIR.",
      catGeneral: "GENERAL",
      statusSilence: "SILENT",
      statusTransmitting: "TRANSMITTING...",
      pushJorgeTitle: "Jorge (Production)",
      pushJorgeDesc: "Streaming live audio...",
      msgJorge1: "WHERE ARE YOU TC",
      msgJorgeAudio: "Starting technical rehearsal in 5 minutes. Checking fixtures and audio matrix.",
      msgSofiaOrig: "Projecteurs principaux prêts en bleu néon !",
      msgSofiaTrad: "Main spotlights ready in neon blue! Effects tested.",
      msgCarlosAudio: "Console levels and wireless mics in green. Latency stabilized at 170ms.",
      msgElenaText: "Confirmed. Backup copy sent to secondary server.",
      triggerTcTitle: "INTRO+MEZU BAT",
      triggerTcVal: "TIMECODE 01:00:00:00",
      triggerShowStart: "Show is starting now!",
      triggerOscOut: "OSC /talkme/cue/go (CUE SENT)"
    },
    fr: {
      subtitle: "Simulation 1:1 Ordinateur & Mobile avec transmission, traduction et triggers en direct",
      catProduccion: "PRODUCTION",
      catLuzFx: "ÉCLAIRAGE / FX",
      catSonido: "SON",
      catRegiduria: "RÉGIE",
      catGeneral: "GÉNÉRAL",
      statusSilence: "EN SILENCE",
      statusTransmitting: "TRANSMISSION...",
      pushJorgeTitle: "Jorge (Production)",
      pushJorgeDesc: "Diffusion audio en direct...",
      msgJorge1: "OÙ ES-TU TC",
      msgJorgeAudio: "Début de la répèt technique dans 5 minutes. Vérification des projecteurs et matrice audio.",
      msgSofiaOrig: "Projecteurs principaux prêts en bleu néon !",
      msgSofiaTrad: "Projecteurs principaux prêts en bleu néon ! Effets testés.",
      msgCarlosAudio: "Niveaux console et micros sans fil au vert. Latence stabilisée à 170ms.",
      msgElenaText: "Confirmé. Copie de sauvegarde envoyée au serveur secondaire.",
      triggerTcTitle: "INTRO+MEZU BAT",
      triggerTcVal: "TIMECODE 01:00:00:00",
      triggerShowStart: "Le spectacle commence !",
      triggerOscOut: "OSC /talkme/cue/go (ENVOYÉ)"
    },
    de: {
      subtitle: "1:1 Dual-Simulation Laptop & Smartphone mit Live-Audio, Babel-KI und SMPTE Triggern",
      catProduccion: "PRODUKTION",
      catLuzFx: "LICHT / FX",
      catSonido: "TON",
      catRegiduria: "REGIE",
      catGeneral: "ALLGEMEIN",
      statusSilence: "STUMM",
      statusTransmitting: "ÜBERTRAGUNG...",
      pushJorgeTitle: "Jorge (Produktion)",
      pushJorgeDesc: "Live-Audio wird gestreamt...",
      msgJorge1: "WO BIST DU TC",
      msgJorgeAudio: "Technische Probe startet in 5 Minuten. Hauptscheinwerfer und Audiomatrix werden geprüft.",
      msgSofiaOrig: "Projecteurs principaux prêts en bleu néon !",
      msgSofiaTrad: "Hauptscheinwerfer bereit in Neonblau! Effekte getestet.",
      msgCarlosAudio: "Konsolenpegel und Funkmikrofone im grünen Bereich. Latenz stabilisiert bei 170ms.",
      msgElenaText: "Bestätigt. Sicherungskopie an den Sekundärserver gesendet.",
      triggerTcTitle: "INTRO+MEZU BAT",
      triggerTcVal: "TIMECODE 01:00:00:00",
      triggerShowStart: "Die Show beginnt!",
      triggerOscOut: "OSC /talkme/cue/go (GESENDET)"
    },
    it: {
      subtitle: "Simulazione 1:1 Laptop & Mobile con trasmissione, traduzione e triggers in tempo reale",
      catProduccion: "PRODUZIONE",
      catLuzFx: "LUCI / FX",
      catSonido: "SUONO",
      catRegiduria: "REGIA",
      catGeneral: "GENERALE",
      statusSilence: "IN SILENZIO",
      statusTransmitting: "TRASMISSIONE...",
      pushJorgeTitle: "Jorge (Produzione)",
      pushJorgeDesc: "Trasmissione audio dal vivo...",
      msgJorge1: "DOVE SEI TC",
      msgJorgeAudio: "Iniziamo la prova tecnica in 5 minuti. Controllo luci principali e matrice audio.",
      msgSofiaOrig: "Projecteurs principaux prêts en bleu néon !",
      msgSofiaTrad: "Fari principali pronti in blu neon! Effetti testati.",
      msgCarlosAudio: "Livelli mixer e microfoni wireless in verde. Latenza stabilizzata a 170ms.",
      msgElenaText: "Confermato. Copia di backup inviata al server secondario.",
      triggerTcTitle: "INTRO+MEZU BAT",
      triggerTcVal: "TIMECODE 01:00:00:00",
      triggerShowStart: "Lo spettacolo inizia ora!",
      triggerOscOut: "OSC /talkme/cue/go (INVIATO)"
    },
    pt: {
      subtitle: "Simulação 1:1 Laptop & Mobile com transmissão, tradução e triggers em tempo real",
      catProduccion: "PRODUÇÃO",
      catLuzFx: "LUZ / FX",
      catSonido: "SOM",
      catRegiduria: "DIREÇÃO",
      catGeneral: "GERAL",
      statusSilence: "EM SILÊNCIO",
      statusTransmitting: "TRANSMITINDO...",
      pushJorgeTitle: "Jorge (Produção)",
      pushJorgeDesc: "Transmitindo áudio ao vivo...",
      msgJorge1: "ONDE ESTÁS TC",
      msgJorgeAudio: "Começamos o ensaio técnico em 5 minutos. Verificando refletores e matriz de áudio.",
      msgSofiaOrig: "Projecteurs principaux prêts en bleu néon !",
      msgSofiaTrad: "Refletores principais prontos em azul neon! Efeitos testados.",
      msgCarlosAudio: "Níveis de mesa e microfones sem fio no verde. Latência estabilizada em 170ms.",
      msgElenaText: "Confirmado. Cópia de segurança enviada para o servidor secundário.",
      triggerTcTitle: "INTRO+MEZU BAT",
      triggerTcVal: "TIMECODE 01:00:00:00",
      triggerShowStart: "O show está começando!",
      triggerOscOut: "OSC /talkme/cue/go (ENVIADO)"
    },
    ca: {
      subtitle: "Simulació 1:1 en Portàtil i Mòbil amb transmissió, traducció i triggers en temps real",
      catProduccion: "PRODUCCIÓ",
      catLuzFx: "LLUM / FX",
      catSonido: "SO",
      catRegiduria: "REGIDORIA",
      catGeneral: "GENERAL",
      statusSilence: "EN SILENCI",
      statusTransmitting: "TRANSMETENT...",
      pushJorgeTitle: "Jorge (Producció)",
      pushJorgeDesc: "Transmetent àudio en directe...",
      msgJorge1: "ON ETS TC",
      msgJorgeAudio: "Comencem l'assaig tècnic en 5 minuts. Revisant focus principals i matriu d'àudio.",
      msgSofiaOrig: "Projecteurs principaux prêts en bleu néon !",
      msgSofiaTrad: "Focus principals a punt en blau neó! Efectes provats.",
      msgCarlosAudio: "Nivells de taula i micròfons sense fil en verd. Latència estabilitzada a 170ms.",
      msgElenaText: "Confirmat. Còpia de seguretat enviada al servidor secundari.",
      triggerTcTitle: "INTRO+MEZU BAT",
      triggerTcVal: "TIMECODE 01:00:00:00",
      triggerShowStart: "Comença el xou!",
      triggerOscOut: "OSC /talkme/cue/go (ENVIAT)"
    },
    eu: {
      subtitle: "1:1 Simulazio Duala Ordenagailu eramangarri eta Mugikorrean zuzeneko itzulpen eta triggerrekin",
      catProduccion: "EKOIZPENA",
      catLuzFx: "ARGIA / FX",
      catSonido: "SOINUA",
      catRegiduria: "ERREGIDORETZA",
      catGeneral: "OROKORRA",
      statusSilence: "ISILTASUNEAN",
      statusTransmitting: "IGORTZEN...",
      pushJorgeTitle: "Jorge (Ekoizpena)",
      pushJorgeDesc: "Zuzeneko audioa igortzen...",
      msgJorge1: "NON ZAUDE TC",
      msgJorgeAudio: "Saiakera teknikoa 5 minututan hasiko da. Foko nagusiak eta audio matrizea egiaztatzen.",
      msgSofiaOrig: "Projecteurs principaux prêts en bleu néon !",
      msgSofiaTrad: "Foko nagusiak prest urdin neonean! Efektuak probatuta.",
      msgCarlosAudio: "Mahaiko mailak eta haririk gabeko mikroak berdez. Latentzia 170ms-tan egonkor.",
      msgElenaText: "Baieztatuta. Babes-kopia bigarren mailako zerbitzarira bidalita.",
      triggerTcTitle: "INTRO+MEZU BAT",
      triggerTcVal: "TIMECODE 01:00:00:00",
      triggerShowStart: "Ikuskizuna hasi da!",
      triggerOscOut: "OSC /talkme/cue/go (BIDALITA)"
    },
    ja: {
      subtitle: "ノートPCとスマホによる1:1リアルタイム通信、AI翻訳およびSMPTEトリガー",
      catProduccion: "制作",
      catLuzFx: "照明 / FX",
      catSonido: "音響",
      catRegiduria: "舞台監督",
      catGeneral: "一般",
      statusSilence: "静音",
      statusTransmitting: "送信中...",
      pushJorgeTitle: "Jorge (制作)",
      pushJorgeDesc: "ライブ音声を配信中...",
      msgJorge1: "タイムコードはどこですか",
      msgJorgeAudio: "5分後に技術リハーサルを開始します。メイン照明と音響マトリクスを確認中。",
      msgSofiaOrig: "Projecteurs principaux prêts en bleu néon !",
      msgSofiaTrad: "メインスポットライトがネオンブルーで準備完了！エフェクト確認済み。",
      msgCarlosAudio: "ミキサーレベルとワイヤレスマイク正常。レイテンシ170msで安定。",
      msgElenaText: "確認完了。バックアップをセカンダリサーバーに送信しました。",
      triggerTcTitle: "INTRO+MEZU BAT",
      triggerTcVal: "TIMECODE 01:00:00:00",
      triggerShowStart: "ショーが始まります！",
      triggerOscOut: "OSC /talkme/cue/go (送信済み)"
    }
  };

  function getTexts() {
    return dialogs[currentLang] || dialogs['es'];
  }

  function getTimeStr() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // Generar barras de vúmetro en portátil dentro de #vumeterInputBox
  const vumeterBox = document.getElementById('vumeterInputBox');
  if (vumeterBox) {
    vumeterBox.innerHTML = '';
    for (let i = 0; i < 28; i++) {
      const bar = document.createElement('div');
      bar.className = 'vumeter-bar';
      vumeterBox.appendChild(bar);
    }
  }

  // Flash estroboscópico de pantalla en el móvil
  function triggerPhoneFlash() {
    const phone = document.getElementById('phoneScreenContainer');
    if (!phone) return;
    phone.classList.remove('screen-flash-alert');
    void phone.offsetWidth; // Forzar reflow
    phone.classList.add('screen-flash-alert');
    safeTimeout(() => {
      phone.classList.remove('screen-flash-alert');
    }, 850);
  }

  // Scroll automático sincronizado para ambos feeds
  function scrollToBottom() {
    const laptopFeed = document.getElementById('messagesContainer');
    const phoneFeed = document.getElementById('phoneMessagesFeed');
    if (laptopFeed) laptopFeed.scrollTop = laptopFeed.scrollHeight;
    if (phoneFeed) phoneFeed.scrollTop = phoneFeed.scrollHeight;
  }

  // Reset del contenedor a estado limpio inicial
  function resetFeeds() {
    const t = getTexts();
    const laptopFeed = document.getElementById('messagesContainer');
    const phoneFeed = document.getElementById('phoneMessagesFeed');

    const initMsgJorge = `
      <div class="message own" data-category="Producción" style="border-right-color: rgb(189, 219, 201);">
        <div class="message-sender" style="color: rgb(189, 219, 201);">
          Jorge
          <small class="category-tag cat-produccion">${t.catProduccion}</small>
        </div>
        <div class="message-text">${t.msgJorge1}</div>
        <div class="message-time">19:02:10</div>
      </div>
    `;

    if (laptopFeed) laptopFeed.innerHTML = initMsgJorge;
    if (phoneFeed) phoneFeed.innerHTML = initMsgJorge;
  }

  // ==========================================================================
  // PASO 1: Jorge habla por PTT desde el Portátil (Voz + STT en vivo + Push móvil)
  // ==========================================================================
  async function step1JorgeBroadcast(text, catName) {
    const t = getTexts();
    const statusInd = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusIndicatorText');
    const btnSend = document.getElementById('btnSend');
    const waveContainer = document.getElementById('inputWaveContainer');
    const sttPopup = document.getElementById('topTranscriptPopup');
    const sttText = document.getElementById('transcriptSttText');
    const meterLevel = document.getElementById('volumeLevel');

    const phoneStatusInd = document.getElementById('phoneStatusIndicator');
    const phoneStatusText = document.getElementById('phoneStatusIndicatorText');
    const phonePush = document.getElementById('phonePushAlert');
    const phonePushText = document.getElementById('phonePushText');

    // 1. Activar transmisión en Desktop
    if (statusInd) statusInd.classList.add('transmitting');
    if (statusText) statusText.textContent = t.statusTransmitting;
    if (btnSend) btnSend.classList.add('active-tx');
    if (waveContainer) waveContainer.classList.add('recording');
    if (sttPopup) sttPopup.classList.add('visible');

    // 2. Activar aviso en Smartphone
    if (phoneStatusInd) {
      phoneStatusInd.classList.remove('silent');
      phoneStatusInd.classList.add('transmitting');
    }
    if (phoneStatusText) phoneStatusText.textContent = "RECIBIENDO...";
    if (phonePush) {
      phonePush.style.display = 'flex';
      if (phonePushText) phonePushText.textContent = t.pushJorgeDesc;
    }

    // Animación de vúmetro
    const bars = document.querySelectorAll('#vumeterInputBox .vumeter-bar');
    let vumeterInt = setInterval(() => {
      if (meterLevel) meterLevel.style.width = (Math.random() * 55 + 40) + '%';
      bars.forEach((bar, idx) => {
        const h = Math.min(26, Math.max(3, Math.floor(Math.sin((idx / bars.length) * Math.PI) * (Math.random() * 22 + 4))));
        bar.style.height = h + 'px';
      });
    }, 45);

    // Transcripción progresiva palabra por palabra
    const words = text.split(' ');
    let currentWords = '';
    for (let i = 0; i < words.length; i++) {
      currentWords += (i === 0 ? '' : ' ') + words[i];
      if (sttText) sttText.textContent = currentWords;
      await new Promise(r => safeTimeout(r, 170));
    }

    await new Promise(r => safeTimeout(r, 300));
    if (sttPopup) sttPopup.classList.remove('visible');
    clearInterval(vumeterInt);
    if (meterLevel) meterLevel.style.width = '0%';
    bars.forEach(b => b.style.height = '3px');

    // Reset estados
    if (statusInd) statusInd.classList.remove('transmitting');
    if (statusText) statusText.textContent = t.statusSilence;
    if (btnSend) btnSend.classList.remove('active-tx');
    if (waveContainer) waveContainer.classList.remove('recording');

    if (phoneStatusInd) {
      phoneStatusInd.classList.remove('transmitting');
      phoneStatusInd.classList.add('silent');
    }
    if (phoneStatusText) phoneStatusText.textContent = t.statusSilence;
    if (phonePush) phonePush.style.display = 'none';

    // Publicar en Desktop
    const laptopFeed = document.getElementById('messagesContainer');
    if (laptopFeed) {
      const html = `
        <div class="message own" data-category="Producción" style="border-right-color: rgb(189, 219, 201);">
          <div class="message-sender" style="color: rgb(189, 219, 201);">
            Jorge
            <small class="category-tag cat-produccion">${catName}</small>
          </div>
          <div class="message-text">${text}</div>
          <div class="audio-player-container">
            <button class="audio-play-btn" title="Reproducir">
              <svg viewBox="0 0 24 24"><polygon points="6 4 18 12 6 20"></polygon></svg>
            </button>
            <div class="audio-waves">
              <div class="audio-wave-bar" style="height: 5px;"></div>
              <div class="audio-wave-bar" style="height: 10px;"></div>
              <div class="audio-wave-bar" style="height: 7px;"></div>
              <div class="audio-wave-bar" style="height: 12px;"></div>
              <div class="audio-wave-bar" style="height: 8px;"></div>
              <div class="audio-wave-bar" style="height: 11px;"></div>
              <div class="audio-wave-bar" style="height: 6px;"></div>
            </div>
            <span class="audio-player-text">audio original</span>
          </div>
          <div class="message-time">${getTimeStr()}</div>
        </div>
      `;
      laptopFeed.insertAdjacentHTML('beforeend', html);
    }

    // Publicar en Móvil + Destello
    const phoneFeed = document.getElementById('phoneMessagesFeed');
    if (phoneFeed) {
      const htmlPhone = `
        <div class="message" data-category="Producción" style="border-left-color: rgb(189, 219, 201);">
          <div class="message-sender" style="color: rgb(189, 219, 201);">
            <span>Jorge</span>
            <small class="category-tag cat-produccion">${catName}</small>
          </div>
          <div class="message-text">${text}</div>
          <div class="audio-player-container">
            <button class="audio-play-btn">
              <svg viewBox="0 0 24 24"><polygon points="6 4 18 12 6 20"></polygon></svg>
            </button>
            <span class="audio-player-text" style="color: var(--accent-orange);">0:05 • audio</span>
          </div>
          <div class="message-time">${getTimeStr()}</div>
        </div>
      `;
      phoneFeed.insertAdjacentHTML('beforeend', htmlPhone);
      triggerPhoneFlash();
    }

    scrollToBottom();
  }

  // ==========================================================================
  // PASO 2: Sofía responde desde el Móvil en Francés -> Portátil traduce con Babel IA
  // ==========================================================================
  async function step2SofiaMobileResponse(origText, tradText, catName) {
    const t = getTexts();
    const btnPhoneSend = document.getElementById('btnPhoneSend');
    const phoneVumeter = document.getElementById('phoneVumeterBox');
    const phoneVumeterFill = document.getElementById('phoneVumeterFill');
    const phoneStatusInd = document.getElementById('phoneStatusIndicator');
    const phoneStatusText = document.getElementById('phoneStatusIndicatorText');

    await new Promise(r => safeTimeout(r, 1200));

    // Sofía transmite desde móvil
    if (btnPhoneSend) btnPhoneSend.classList.add('active-tx');
    if (phoneVumeter) phoneVumeter.style.display = 'flex';
    if (phoneStatusInd) {
      phoneStatusInd.classList.remove('silent');
      phoneStatusInd.classList.add('transmitting');
    }
    if (phoneStatusText) phoneStatusText.textContent = "TRANSMITIENDO...";

    let fillW = 15;
    const vumeterPhoneInt = setInterval(() => {
      fillW = (fillW + 28) % 100;
      if (phoneVumeterFill) phoneVumeterFill.style.width = fillW + '%';
    }, 90);

    await new Promise(r => safeTimeout(r, 1300));
    clearInterval(vumeterPhoneInt);

    if (btnPhoneSend) btnPhoneSend.classList.remove('active-tx');
    if (phoneVumeter) phoneVumeter.style.display = 'none';
    if (phoneStatusInd) {
      phoneStatusInd.classList.remove('transmitting');
      phoneStatusInd.classList.add('silent');
    }
    if (phoneStatusText) phoneStatusText.textContent = t.statusSilence;

    // Publicar en móvil (propio de Sofía)
    const phoneFeed = document.getElementById('phoneMessagesFeed');
    if (phoneFeed) {
      const html = `
        <div class="message own" data-category="Luz / FX" style="border-right-color: rgb(255, 212, 153);">
          <div class="message-sender" style="color: rgb(255, 212, 153);">
            Sofía
            <small class="category-tag cat-luzfx">${catName}</small>
          </div>
          <div class="message-text">${origText}</div>
          <div class="message-time">${getTimeStr()}</div>
        </div>
      `;
      phoneFeed.insertAdjacentHTML('beforeend', html);
    }

    // Publicar en Laptop (con ranura Babel para traducción)
    const laptopFeed = document.getElementById('messagesContainer');
    const msgId = 'laptop-msg-sofia-' + Date.now();
    if (laptopFeed) {
      const htmlLaptop = `
        <div class="message" id="${msgId}" data-category="Luz / FX" style="border-left-color: rgb(255, 212, 153);">
          <div class="message-sender">
            <span style="color: rgb(255, 212, 153);">Sofía</span>
            <small class="category-tag cat-luzfx">${catName}</small>
            <small class="lang-tag-inline">FR</small>
          </div>
          <div class="babel-target-slot" style="display:none;"></div>
          <div class="message-text orig-text">${origText}</div>
          <div class="message-time">${getTimeStr()}</div>
        </div>
      `;
      laptopFeed.insertAdjacentHTML('beforeend', htmlLaptop);
    }
    scrollToBottom();

    // Activación de la traducción automática Babel en portátil
    await new Promise(r => safeTimeout(r, 600));
    const cardEl = document.getElementById(msgId);
    if (cardEl) {
      const slot = cardEl.querySelector('.babel-target-slot');
      const origDiv = cardEl.querySelector('.orig-text');
      if (slot) {
        slot.style.display = 'block';
        slot.innerHTML = `
          <div class="babel-translation">
            <span class="babel-lang-tag">${currentLang.toUpperCase()}</span>
            <span style="font-size: 0.95rem; font-weight: 600; color: #FFF;">${tradText}</span>
          </div>
        `;
      }
      if (origDiv) {
        origDiv.style.fontSize = '0.75rem';
        origDiv.style.opacity = '0.6';
      }
    }
    scrollToBottom();
  }

  // ==========================================================================
  // PASO 3: Carlos (Sonido) envía reporte de niveles y latencia
  // ==========================================================================
  async function step3CarlosSoundReport(text, catName) {
    await new Promise(r => safeTimeout(r, 1400));

    // Tarjeta en Portátil
    const laptopFeed = document.getElementById('messagesContainer');
    if (laptopFeed) {
      const html = `
        <div class="message" data-category="Sonido" style="border-left-color: rgb(32, 101, 205);">
          <div class="message-sender">
            <span style="color: rgb(32, 101, 205);">Carlos</span>
            <small class="category-tag cat-sonido">${catName}</small>
            <small class="lang-tag-inline">ES</small>
          </div>
          <div class="message-text">${text}</div>
          <div class="message-time">${getTimeStr()}</div>
        </div>
      `;
      laptopFeed.insertAdjacentHTML('beforeend', html);
    }

    // Tarjeta en Móvil
    const phoneFeed = document.getElementById('phoneMessagesFeed');
    if (phoneFeed) {
      const htmlPhone = `
        <div class="message" data-category="Sonido" style="border-left-color: rgb(32, 101, 205);">
          <div class="message-sender">
            <span style="color: rgb(32, 101, 205);">Carlos</span>
            <small class="category-tag cat-sonido">${catName}</small>
          </div>
          <div class="message-text">${text}</div>
          <div class="message-time">${getTimeStr()}</div>
        </div>
      `;
      phoneFeed.insertAdjacentHTML('beforeend', htmlPhone);
      triggerPhoneFlash();
    }
    scrollToBottom();
  }

  // ==========================================================================
  // PASO 4: TRIGGER TIMECODE RECIBIDO (IN) -> EXACTO A LA CAPTURA REAL
  // TimeCode | GENERAL | 01:00:01:22
  // INTRO+MEZU BAT
  // TIMECODE 01:00:00:00
  // Reproductor audio original + Flash
  // ==========================================================================
  async function step4TriggerTimeCodeIn() {
    const t = getTexts();
    await new Promise(r => safeTimeout(r, 1500));

    // Mensaje TimeCode en Portátil (Clon exacto de la captura del usuario)
    const laptopFeed = document.getElementById('messagesContainer');
    if (laptopFeed) {
      const html = `
        <div class="message trigger-card-smpte" data-category="General" style="border-left-color: #888888;">
          <div class="message-sender" style="color: #888888; display: flex; align-items: center; gap: 4px;">
            <span>TimeCode</span>
            <small class="category-tag" style="color: #7B68EE; border: 1px solid #7B68EE; background: rgba(123, 104, 238, 0.1); padding: 1px 5px; border-radius: 4px; font-size: 8px;">${t.catGeneral}</small>
            <small class="protocol-badge">
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              01:00:01:22
            </small>
            <span class="trigger-direction-tag tag-in" style="margin-left: 4px;">IN</span>
          </div>

          <div class="message-text" style="font-weight: 800; font-size: 1.15rem; color: #FFFFFF; margin-top: 3px;">
            ${t.triggerTcTitle}
          </div>

          <div class="trigger-tc-value">
            ${t.triggerTcVal}
          </div>

          <div class="audio-player-container" style="margin-top: 4px;">
            <button class="audio-play-btn" style="background: #7B68EE;">
              <svg viewBox="0 0 24 24"><polygon points="6 4 18 12 6 20"></polygon></svg>
            </button>
            <div class="audio-waves">
              <div class="audio-wave-bar" style="height: 7px;"></div>
              <div class="audio-wave-bar" style="height: 12px;"></div>
              <div class="audio-wave-bar" style="height: 6px;"></div>
              <div class="audio-wave-bar" style="height: 14px;"></div>
              <div class="audio-wave-bar" style="height: 9px;"></div>
              <div class="audio-wave-bar" style="height: 11px;"></div>
            </div>
            <span class="audio-player-text">audio original</span>
          </div>

          <div class="message-time">19:02:58</div>
        </div>
      `;
      laptopFeed.insertAdjacentHTML('beforeend', html);
    }

    // Mensaje TimeCode en Móvil
    const phoneFeed = document.getElementById('phoneMessagesFeed');
    if (phoneFeed) {
      const htmlPhone = `
        <div class="message trigger-card-smpte" data-category="General" style="border-left-color: #888888;">
          <div class="message-sender" style="color: #888888;">
            <span>TimeCode</span>
            <span class="trigger-direction-tag tag-in">IN</span>
          </div>
          <div class="message-text" style="font-weight: 800; font-size: 0.72rem; color: #FFF;">
            ${t.triggerTcTitle}
          </div>
          <div style="font-family: monospace; font-size: 0.7rem; font-weight: 800; color: #FFF; margin: 2px 0;">
            ${t.triggerTcVal}
          </div>
          <div class="message-time">19:02:58</div>
        </div>
      `;
      phoneFeed.insertAdjacentHTML('beforeend', htmlPhone);
      triggerPhoneFlash();
    }
    scrollToBottom();

    // Inserción automática del mensaje de show consecuencia del Timecode IN
    await new Promise(r => safeTimeout(r, 700));
    if (laptopFeed) {
      const htmlShow = `
        <div class="message" data-category="Producción" style="border-left-color: var(--accent-orange); background: rgba(255, 107, 53, 0.08);">
          <div class="message-sender" style="color: var(--accent-orange);">
            <span>Sistema</span>
            <small class="category-tag cat-produccion">${t.catProduccion}</small>
          </div>
          <div class="message-text" style="color: #FFFFFF; font-weight: 700;">
            🎬 ${t.triggerShowStart}
          </div>
          <div class="message-time">${getTimeStr()}</div>
        </div>
      `;
      laptopFeed.insertAdjacentHTML('beforeend', htmlShow);
    }

    if (phoneFeed) {
      const htmlShowPhone = `
        <div class="message" data-category="Producción" style="border-left-color: var(--accent-orange); background: rgba(255, 107, 53, 0.08);">
          <div class="message-sender" style="color: var(--accent-orange);">
            <span>Sistema</span>
          </div>
          <div class="message-text" style="color: #FFFFFF; font-weight: 700; font-size: 0.75rem;">
            🎬 ${t.triggerShowStart}
          </div>
          <div class="message-time">${getTimeStr()}</div>
        </div>
      `;
      phoneFeed.insertAdjacentHTML('beforeend', htmlShowPhone);
      triggerPhoneFlash();
    }
    scrollToBottom();
  }

  // ==========================================================================
  // PASO 5: TRIGGER OUT (Disparo hacia hardware/mesa externa OSC)
  // ==========================================================================
  async function step5TriggerOut() {
    const t = getTexts();
    await new Promise(r => safeTimeout(r, 1400));

    const laptopFeed = document.getElementById('messagesContainer');
    if (laptopFeed) {
      const html = `
        <div class="message" data-category="Luz / FX" style="border-left-color: #3498db; background: rgba(52, 152, 219, 0.08);">
          <div class="message-sender" style="color: #3498db; display: flex; align-items: center; gap: 4px;">
            <span>Trigger Out</span>
            <span class="trigger-direction-tag tag-out">OUT</span>
            <small class="protocol-badge">
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path></svg>
              OSC /cue/1/go
            </small>
          </div>
          <div class="message-text" style="font-size: 0.95rem; font-weight: 600; color: #FFF;">
            ⚡ ${t.triggerOscOut}
          </div>
          <div class="message-time">${getTimeStr()}</div>
        </div>
      `;
      laptopFeed.insertAdjacentHTML('beforeend', html);
    }

    const phoneFeed = document.getElementById('phoneMessagesFeed');
    if (phoneFeed) {
      const htmlPhone = `
        <div class="message" data-category="Luz / FX" style="border-left-color: #3498db; background: rgba(52, 152, 219, 0.08);">
          <div class="message-sender" style="color: #3498db;">
            <span>Trigger Out</span>
            <span class="trigger-direction-tag tag-out">OUT</span>
          </div>
          <div class="message-text" style="font-size: 0.72rem; color: #FFF;">
            ⚡ ${t.triggerOscOut}
          </div>
          <div class="message-time">${getTimeStr()}</div>
        </div>
      `;
      phoneFeed.insertAdjacentHTML('beforeend', htmlPhone);
    }
    scrollToBottom();
  }

  // ==========================================================================
  // BUCLE DE EJECUCIÓN DUAL
  // ==========================================================================
  async function runDualLoop() {
    if (isRunning) return;
    isRunning = true;

    clearAllTimers();
    resetFeeds();

    const t = getTexts();
    const subtitle = document.getElementById('dualSubtitle');
    if (subtitle) subtitle.textContent = t.subtitle;

    // Pausa inicial
    await new Promise(r => safeTimeout(r, 1800));

    // 1. Jorge transmite voz por PTT desde el Portátil
    await step1JorgeBroadcast(t.msgJorgeAudio, t.catProduccion);

    // 2. Sofía responde en Francés desde el Móvil y Portátil traduce con Babel IA
    await step2SofiaMobileResponse(t.msgSofiaOrig, t.msgSofiaTrad, t.catLuzFx);

    // 3. Carlos Sonido reporta latencia y niveles
    await step3CarlosSoundReport(t.msgCarlosAudio, t.catSonido);

    // 4. Trigger Timecode IN (Clon exacto de la captura del usuario) + Inserción Show Start
    await step4TriggerTimeCodeIn();

    // 5. Trigger OUT (Disparo a mesa / protocolo externo)
    await step5TriggerOut();

    isRunning = false;

    // Reinicio tras pausa
    safeTimeout(() => {
      if (!isRunning) runDualLoop();
    }, 6000);
  }

  // Cambio dinámico de idioma
  function setLanguage(lang) {
    if (!dialogs[lang]) return;
    currentLang = lang;

    // Actualizar pills
    document.querySelectorAll('.lang-pill').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Actualizar etiquetas en la interfaz
    const t = getTexts();
    const subtitle = document.getElementById('dualSubtitle');
    if (subtitle) subtitle.textContent = t.subtitle;

    const bJorge = document.getElementById('badgeJorgeCat');
    if (bJorge) bJorge.textContent = t.catProduccion;
    const bSofia = document.getElementById('badgeSofiaCat');
    if (bSofia) bSofia.textContent = t.catLuzFx;
    const bCarlos = document.getElementById('badgeCarlosCat');
    if (bCarlos) bCarlos.textContent = t.catSonido;
    const bElena = document.getElementById('badgeElenaCat');
    if (bElena) bElena.textContent = t.catRegiduria;

    // Reiniciar loop con nuevo idioma
    isRunning = false;
    clearAllTimers();
    runDualLoop();
  }

  // Listeners de idioma
  document.querySelectorAll('.lang-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      if (lang) setLanguage(lang);
    });
  });

  // Inicio al cargar DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runDualLoop);
  } else {
    runDualLoop();
  }
})();
