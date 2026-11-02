/**
 * Talk.me Official Chat Renderer Simulator (Replicando 1:1 module-message-renderer.js)
 */

(function () {
  let currentLang = 'es';
  let activeFilter = 'all';

  function getActiveLanguage() {
    if (typeof window.currentLang !== 'undefined') return window.currentLang;
    try {
      return localStorage.getItem('talkme_lang') || 'es';
    } catch (e) {
      return 'es';
    }
  }

  // Diccionario multilingüe nativo para los 24 idiomas
  const chatDialogs = {
    es: {
      catRegiduria: "REGIDURIA",
      catIluminacion: "ILUMINACION",
      catSonido: "SONIDO",
      catAsistente: "ASISTENTE",
      tagYou: "(Tú)",
      subUserTag: "Sub-usuario",
      statusSilence: "EN SILENCIO",
      statusTransmitting: "TRANSMITIENDO...",
      lblUsers: "Usuarios Conectados (4)",
      msgJorge1: "¡Hola equipo!",
      msgJorgeAudio: "Comenzamos el ensayo técnico en 5 minutos. Revisando focos principales y matriz de audio.",
      msgSofiaOrig: "Faisceau principal prêt en bleu néon !",
      msgSofiaTrad: "¡Foco principal listo en azul neón! Efectos estroboscópicos probados.",
      msgCarlosAudio: "Niveles de mesa y micrófonos inalámbricos en verde. Latencia estabilizada en 170ms.",
      msgElenaText: "Confirmado. Copia de respaldo enviada al servidor secundario.",
      alertTrigger: "⚡ [TRIGGER ESZENA 01] Secuencia de inicio sincronizada por Timecode LTC"
    },
    en: {
      catRegiduria: "STAGE DIRECTION",
      catIluminacion: "LIGHTING",
      catSonido: "SOUND",
      catAsistente: "ASSISTANT",
      tagYou: "(You)",
      subUserTag: "Sub-user",
      statusSilence: "SILENT",
      statusTransmitting: "TRANSMITTING...",
      lblUsers: "Connected Users (4)",
      msgJorge1: "Hello team!",
      msgJorgeAudio: "Starting technical rehearsal in 5 minutes. Checking main fixtures and audio matrix.",
      msgSofiaOrig: "Faisceau principal prêt en bleu néon !",
      msgSofiaTrad: "Main spotlight ready in neon blue! Strobe effects tested.",
      msgCarlosAudio: "Console levels and wireless mics in green. Latency stabilized at 170ms.",
      msgElenaText: "Confirmed. Backup copy sent to secondary server.",
      alertTrigger: "⚡ [TRIGGER SCENE 01] Start sequence LTC Timecode synchronized"
    },
    eu: {
      catRegiduria: "ERREGIDORETZA",
      catIluminacion: "ARGIZTAPENA",
      catSonido: "SOINUA",
      catAsistente: "LAGUNTZAILEA",
      tagYou: "(Zu)",
      subUserTag: "Sub-erabiltzailea",
      statusSilence: "ISILTASUNEAN",
      statusTransmitting: "IGORTZEN...",
      lblUsers: "Konektatutako Erabiltzaileak (4)",
      msgJorge1: "Kaixo taldea!",
      msgJorgeAudio: "Saiakera teknikoa 5 minututan hasiko da. Foko nagusiak eta audio matrizea egiaztatzen.",
      msgSofiaOrig: "Faisceau principal prêt en bleu néon !",
      msgSofiaTrad: "Foko nagusia prest urdin neonean! Efektu estroboskopikoak probatuta.",
      msgCarlosAudio: "Mahaiko mailak eta haririk gabeko mikroak berdez. Latentzia 170ms-tan egonkor.",
      msgElenaText: "Baieztatuta. Babes-kopia bigarren mailako zerbitzarira bidalita.",
      alertTrigger: "⚡ [TRIGGER ESZENA 01] Hasierako sekuentzia LTC Timecode bidez sinkronizatuta"
    },
    ca: {
      catRegiduria: "REGIDORIA",
      catIluminacion: "IL·LUMINACIÓ",
      catSonido: "SO",
      catAsistente: "ASSISTENT",
      tagYou: "(Tu)",
      subUserTag: "Sub-usuari",
      statusSilence: "EN SILENCI",
      statusTransmitting: "TRANSMETENT...",
      lblUsers: "Usuaris Connectats (4)",
      msgJorge1: "Hola equip!",
      msgJorgeAudio: "Comencem l'assaig tècnic en 5 minuts. Revisant focs principals i matriu d'àudio.",
      msgSofiaOrig: "Faisceau principal prêt en bleu néon !",
      msgSofiaTrad: "Foc principal a punt en blau neó! Efectes estroboscòpics provats.",
      msgCarlosAudio: "Nivells de taula i micròfons inalàmbrics en verd. Latència estabilitzada a 170ms.",
      msgElenaText: "Confirmat. Còpia de seguretat enviada al servidor secundari.",
      alertTrigger: "⚡ [TRIGGER ESCENA 01] Seqüència d'inici sincronitzada per LTC Timecode"
    },
    fr: {
      catRegiduria: "RÉGIE",
      catIluminacion: "ÉCLAIRAGE",
      catSonido: "SON",
      catAsistente: "ASSISTANT",
      tagYou: "(Vous)",
      subUserTag: "Sous-utilisateur",
      statusSilence: "EN SILENCE",
      statusTransmitting: "TRANSMISSION...",
      lblUsers: "Utilisateurs Connectés (4)",
      msgJorge1: "Bonjour l'équipe !",
      msgJorgeAudio: "Début de la répèt technique dans 5 minutes. Vérification des projecteurs et matrice audio.",
      msgSofiaOrig: "Faisceau principal prêt en bleu néon !",
      msgSofiaTrad: "Faisceau principal prêt en bleu néon ! Effets stroboscopiques testés.",
      msgCarlosAudio: "Niveaux console et micros sans fil au vert. Latence stabilisée à 170ms.",
      msgElenaText: "Confirmé. Copie de sauvegarde envoyée au serveur secondaire.",
      alertTrigger: "⚡ [TRIGGER SCÈNE 01] Séquence de démarrage synchronisée par LTC Timecode"
    },
    de: {
      catRegiduria: "REGIE",
      catIluminacion: "LICHTDESIGN",
      catSonido: "TON",
      catAsistente: "ASSISTENT",
      tagYou: "(Du)",
      subUserTag: "Unter-Benutzer",
      statusSilence: "STUMM",
      statusTransmitting: "ÜBERTRAGUNG...",
      lblUsers: "Verbundene Benutzer (4)",
      msgJorge1: "Hallo Team!",
      msgJorgeAudio: "Technische Probe startet in 5 Minuten. Hauptscheinwerfer und Audiomatrix werden geprüft.",
      msgSofiaOrig: "Faisceau principal prêt en bleu néon !",
      msgSofiaTrad: "Hauptscheinwerfer bereit in Neonblau! Stroboskopeffekte getestet.",
      msgCarlosAudio: "Konsolenpegel und Funkmikrofone im grünen Bereich. Latenz stabilisiert bei 170ms.",
      msgElenaText: "Bestätigt. Sicherungskopie an den Sekundärserver gesendet.",
      alertTrigger: "⚡ [TRIGGER SZENE 01] Startsequenz via LTC Timecode synchronisiert"
    },
    it: {
      catRegiduria: "REGIA",
      catIluminacion: "ILLUMINAZIONE",
      catSonido: "SUONO",
      catAsistente: "ASSISTENTE",
      tagYou: "(Tu)",
      subUserTag: "Sub-utente",
      statusSilence: "IN SILENZIO",
      statusTransmitting: "TRASMISSIONE...",
      lblUsers: "Utenti Connessi (4)",
      msgJorge1: "Ciao team!",
      msgJorgeAudio: "Inizio prove tecniche tra 5 minuti. Controllo proiettori principali e matrice audio.",
      msgSofiaOrig: "Faisceau principal prêt en bleu néon !",
      msgSofiaTrad: "Faro principale pronto in blu neon! Effetti stroboscopici testati.",
      msgCarlosAudio: "Livelli mixer e microfoni wireless in verde. Latenza stabilizzata a 170ms.",
      msgElenaText: "Confermato. Copia di backup inviata al server secondario.",
      alertTrigger: "⚡ [TRIGGER SCENA 01] Sequenza di avvio sincronizzata via LTC Timecode"
    },
    pt: {
      catRegiduria: "REGIA",
      catIluminacion: "ILUMINAÇÃO",
      catSonido: "SOM",
      catAsistente: "ASSISTENTE",
      tagYou: "(Você)",
      subUserTag: "Sub-usuário",
      statusSilence: "EM SILÊNCIO",
      statusTransmitting: "TRANSMITINDO...",
      lblUsers: "Usuários Conectados (4)",
      msgJorge1: "Olá equipe!",
      msgJorgeAudio: "Iniciando ensaio técnico em 5 minutos. Verificando refletores principales e matriz de áudio.",
      msgSofiaOrig: "Faisceau principal prêt en bleu néon !",
      msgSofiaTrad: "Refletor principal pronto em azul neon! Efeitos estroboscópicos testados.",
      msgCarlosAudio: "Níveis da mesa e microfones sem fio no verde. Latência estabilizada em 170ms.",
      msgElenaText: "Confirmado. Cópia de segurança enviada ao servidor secundário.",
      alertTrigger: "⚡ [TRIGGER CENA 01] Sequência de início sincronizada via LTC Timecode"
    },
    ja: {
      catRegiduria: "舞台監督",
      catIluminacion: "照明",
      catSonido: "音響",
      catAsistente: "アシスタント",
      tagYou: "(あなた)",
      subUserTag: "サブユーザー",
      statusSilence: "静音",
      statusTransmitting: "送信中...",
      lblUsers: "接続中のユーザー (4)",
      msgJorge1: "チームの皆さん、こんにちは！",
      msgJorgeAudio: "5分後に技術リハーサルを開始します。メイン照明とオーディオマトリックスを確認中。",
      msgSofiaOrig: "Faisceau principal prêt en bleu néon !",
      msgSofiaTrad: "メインスポットライトがネオンブルーで準備完了！ストロボ効果テスト済み。",
      msgCarlosAudio: "ミキサーレベルとワイヤレスマイク正常。レイテンシ170msで安定。",
      msgElenaText: "確認完了。バックアップをセカンダリサーバーに送信しました。",
      alertTrigger: "⚡ [トリガー シーン01] LTCタイムコード同期による開始シーケンス"
    }
  };

  function getTexts() {
    const lang = getActiveLanguage();
    return chatDialogs[lang] || chatDialogs['en'] || chatDialogs['es'];
  }

  // DOM Elements
  const messagesContainer = document.getElementById('messagesContainer');
  const volumeLevel = document.getElementById('volumeLevel');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusIndicatorText = document.getElementById('statusIndicatorText');
  const btnSend = document.getElementById('btnSend');
  const textInput = document.getElementById('textInput');
  const inputWaveContainer = document.getElementById('inputWaveContainer');
  const topTranscriptPopup = document.getElementById('topTranscriptPopup');
  const transcriptSttText = document.getElementById('transcriptSttText');
  const lblUsersConnected = document.getElementById('lblUsersConnected');

  // Sidebar Toggle & Efecto Línea Naranja Reactiva
  const panelToggle = document.getElementById('panelToggle');
  const controlPanel = document.getElementById('controlPanel');
  if (panelToggle && controlPanel) {
    panelToggle.onclick = () => {
      controlPanel.classList.toggle('collapsed');
    };
    
    panelToggle.onmouseenter = () => {
      controlPanel.classList.add('line-hover');
    };
    
    panelToggle.onmouseleave = () => {
      controlPanel.classList.remove('line-hover');
    };
  }

  function applyCategoryFilter() {
    const cards = document.querySelectorAll('.message');
    cards.forEach(card => {
      const cat = card.getAttribute('data-cat') || 'all';
      if (activeFilter === 'all' || cat === activeFilter) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  function getCurrentTimeStr() {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function triggerScreenStrobe() {
    document.body.classList.remove('message-bg-flash');
    // Forzar reflow para reiniciar la animación
    void document.body.offsetWidth;
    document.body.classList.add('message-bg-flash');
    setTimeout(() => {
      document.body.classList.remove('message-bg-flash');
    }, 1250);
  }

  function appendCard(html, isIncoming = false) {
    if (!messagesContainer) return;
    messagesContainer.insertAdjacentHTML('beforeend', html);
    applyCategoryFilter();
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    if (isIncoming) {
      triggerScreenStrobe();
    }
  }

  // 1. Transcripción STT Stream con Recuadro Naranja Flotante + Vúmetro en Input
  async function simulateJorgeAudioSTT(text, catName, statusTransmitting, statusSilence) {
    if (statusIndicator) {
      statusIndicator.classList.remove('silent');
      statusIndicator.classList.add('transmitting');
    }
    if (statusIndicatorText) statusIndicatorText.textContent = statusTransmitting;
    if (btnSend) {
      btnSend.classList.add('transmitting', 'active-ptt');
    }
    if (inputWaveContainer) inputWaveContainer.classList.add('recording');
    if (topTranscriptPopup) topTranscriptPopup.classList.add('visible');

    const vumeterBars = document.querySelectorAll('#vumeterInputBox .vumeter-bar');
    let vumeterAnimInt = setInterval(() => {
      if (volumeLevel) volumeLevel.style.width = (Math.random() * 70 + 25) + '%';
      if (vumeterBars.length > 0) {
        const total = vumeterBars.length;
        const now = Date.now() / 100;
        vumeterBars.forEach((bar, idx) => {
          const normIdx = idx / total;
          // Combinación de 3 ondas sinusoidales superpuestas (armónicos) + envolvente gaussiana central
          const wave1 = Math.sin(normIdx * Math.PI * 4 + now * 1.8);
          const wave2 = Math.sin(normIdx * Math.PI * 8 - now * 2.4) * 0.5;
          const wave3 = Math.cos(normIdx * Math.PI * 2 + now * 0.9) * 0.3;
          // Envolvente de campana para mayor potencia en la zona media
          const bellEnvelope = Math.sin(normIdx * Math.PI);
          const rawAmp = (wave1 + wave2 + wave3 + 1.8) / 3.6;
          const jitter = (Math.random() * 0.3 + 0.85);
          const barHeight = Math.min(38, Math.max(4, Math.floor(rawAmp * bellEnvelope * jitter * 36) + 4));
          bar.style.height = barHeight + 'px';
        });
      }
    }, 40);

    const words = text.split(' ');
    let currentStreamText = '';

    for (let i = 0; i < words.length; i++) {
      currentStreamText += (i === 0 ? '' : ' ') + words[i];
      if (transcriptSttText) transcriptSttText.textContent = currentStreamText;
      await new Promise(r => setTimeout(r, 220));
    }

    await new Promise(r => setTimeout(r, 400));
    if (topTranscriptPopup) topTranscriptPopup.classList.remove('visible');

    // Inyectar tarjeta final propia con cápsula de audio
    const html = `
      <div class="message own voice" data-cat="regiduria" style="border-right-color: #FF6B35;">
        <div class="message-sender">
          Jorge
          <small class="category-tag-inline cat-produccion">${catName}</small>
        </div>
        <div class="message-text">${text}</div>
        <div class="audio-player-container">
          <div class="audio-play-btn">
            <svg viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
          </div>
          <div class="audio-waves">
            <div class="audio-wave-bar"></div>
            <div class="audio-wave-bar"></div>
            <div class="audio-wave-bar"></div>
            <div class="audio-wave-bar"></div>
            <div class="audio-wave-bar"></div>
          </div>
          <span class="audio-player-text">audio original</span>
        </div>
        <div class="message-time">${getCurrentTimeStr()}</div>
      </div>
    `;
    appendCard(html);

    clearInterval(vumeterAnimInt);
    if (volumeLevel) volumeLevel.style.width = '1%';
    if (statusIndicator) {
      statusIndicator.classList.remove('transmitting');
      statusIndicator.classList.add('silent');
    }
    if (statusIndicatorText) statusIndicatorText.textContent = statusSilence;
    if (btnSend) {
      btnSend.classList.remove('transmitting', 'active-ptt');
    }
    if (inputWaveContainer) inputWaveContainer.classList.remove('recording');
  }

  // 2. Traducción Automática de Sofía (Transformación en vivo con Babel Ethereal Smoke)
  async function simulateSofiaTranslation(origText, tradText, catName) {
    await new Promise(r => setTimeout(r, 1400));
    
    // Paso 2.1: Llega el mensaje original en Francés
    const msgId = 'sofia-msg-' + Date.now();
    const htmlInitial = `
      <div class="message" id="${msgId}" data-cat="iluminacion" style="border-left-color: #FF6B35;">
        <div class="message-sender" style="color: #FF6B35;">
          Sofía <span class="lang-tag-inline">FR</span>
          <small class="category-tag-inline cat-luzfx">${catName}</small>
        </div>
        <div class="babel-translation hidden"></div>
        <div class="message-text">${origText}</div>
        <div class="audio-player-container">
          <div class="audio-play-btn">
            <svg viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
          </div>
          <div class="audio-waves">
            <div class="audio-wave-bar"></div>
            <div class="audio-wave-bar"></div>
            <div class="audio-wave-bar"></div>
            <div class="audio-wave-bar"></div>
          </div>
          <span class="audio-player-text">audio original</span>
        </div>
        <div class="message-time">${getCurrentTimeStr()}</div>
      </div>
    `;
    appendCard(htmlInitial, true);

    // Paso 2.2: Tras breve cálculo de IA, se dispara la traducción Babel (Smoke-In + Tag Pop)
    await new Promise(r => setTimeout(r, 900));
    const cardEl = document.getElementById(msgId);
    if (cardEl) {
      cardEl.classList.add('has-translation');
      const babelDiv = cardEl.querySelector('.babel-translation');
      if (babelDiv) {
        babelDiv.classList.remove('hidden');
        babelDiv.innerHTML = `<div class="babel-result">${tradText}</div>`;
      }
      const origTextDiv = cardEl.querySelector('.message-text');
      if (origTextDiv && !origTextDiv.querySelector('.babel-lang-tag')) {
        origTextDiv.innerHTML = `<span class="babel-lang-tag">(FR)</span> ${origText}`;
      }
    }
  }

  // 3. Audio de Carlos (Sonido)
  async function simulateCarlosAudio(text, catName) {
    await new Promise(r => setTimeout(r, 2200));
    const html = `
      <div class="message" data-cat="sonido" style="border-left-color: #FACC15;">
        <div class="message-sender" style="color: #FACC15;">
          Carlos <span class="lang-tag-inline">ES</span>
          <small class="category-tag-inline cat-sonido">${catName}</small>
        </div>
        <div class="message-text">${text}</div>
        <div class="audio-player-container">
          <div class="audio-play-btn">
            <svg viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
          </div>
          <div class="audio-waves">
            <div class="audio-wave-bar"></div>
            <div class="audio-wave-bar"></div>
            <div class="audio-wave-bar"></div>
            <div class="audio-wave-bar"></div>
          </div>
          <span class="audio-player-text">audio original</span>
        </div>
        <div class="message-time">${getCurrentTimeStr()}</div>
      </div>
    `;
    appendCard(html, true);
  }

  // 4. Mensaje del Sub-usuario (Elena como identidad virtual vinculada al Master Jorge)
  async function simulateElenaSubUser(text, subTag) {
    await new Promise(r => setTimeout(r, 2200));
    const html = `
      <div class="message" data-cat="asistente" style="border-left-color: #10B981;">
        <div class="message-sender">
          <span class="root-identity" style="color: #7B68EE;">
            Jorge <small class="category-tag cat-produccion" style="color: #7B68EE; border: 1px solid #7B68EE; background: rgba(255, 255, 255, 0.03); margin-left: 4px;">REGIDURIA</small>
          </span>
          <span class="sub-identity" style="color: #10B981;">
            Elena <small class="category-tag cat-asistente" style="color: #10B981; border: 1px solid #10B981; background: rgba(255, 255, 255, 0.03); margin-left: 4px;">ASISTENTE</small>
          </span>
        </div>
        <div class="message-text">${text}</div>
        <div class="message-time">${getCurrentTimeStr()}</div>
      </div>
    `;
    appendCard(html, true);
  }

  // 5. Banner Trigger Alerta
  async function simulateTriggerBanner(text) {
    await new Promise(r => setTimeout(r, 1800));
    const html = `
      <div class="alert-trigger-card">
        <span>${text}</span>
      </div>
    `;
    appendCard(html, true);
  }

  let isRunning = false;

  async function runChatLoop() {
    if (isRunning) return;
    isRunning = true;

    const texts = getTexts();

    if (lblUsersConnected) {
      lblUsersConnected.textContent = texts.lblUsers || "Usuarios Conectados (4)";
    }

    // Esperar 2.5s mostrando la tarjeta inicial "¡Hola equipo!" 1:1 con la captura
    await new Promise(r => setTimeout(r, 2500));

    // Step 2: Voice Audio STT Stream
    await simulateJorgeAudioSTT(texts.msgJorgeAudio, texts.catRegiduria, texts.statusTransmitting, texts.statusSilence);

    // Step 3: Sofia Translation
    await simulateSofiaTranslation(texts.msgSofiaOrig, texts.msgSofiaTrad, texts.catIluminacion);

    // Step 4: Carlos Sound Audio
    await simulateCarlosAudio(texts.msgCarlosAudio, texts.catSonido);

    // Step 5: Elena Sub-user Confirmation
    await simulateElenaSubUser(texts.msgElenaText, texts.subUserTag);

    // Step 6: Trigger Banner
    await simulateTriggerBanner(texts.alertTrigger);

    isRunning = false;
    setTimeout(() => {
      if (messagesContainer) {
        messagesContainer.innerHTML = `
          <div class="message own" data-cat="regiduria" style="border-right-color: #FF6B35;">
            <div class="message-sender">
              Jorge
              <small class="category-tag-inline cat-produccion">${texts.catRegiduria}</small>
            </div>
            <div class="message-text">${texts.msgJorge1}</div>
            <div class="message-time">17:23:54</div>
          </div>
        `;
      }
      runChatLoop();
    }, 9000);
  }

  // Manual Input Sending deshabilitado para simulación puramente fake de la landing
  if (textInput) {
    textInput.readOnly = true;
    textInput.placeholder = "Modo de simulación activa...";
  }

  // Reactive Language Listener
  window.addEventListener('i18nLanguageChanged', (e) => {
    if (e && e.detail && e.detail.lang) {
      currentLang = e.detail.lang;
      runChatLoop();
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    runChatLoop();
  });
})();
