/* ==========================================================================
   TALK.ME - LÓGICA Y TRADUCCIONES COMPARTIDAS PARA ANIMACIONES
   ========================================================================== */
function getLang() {
  try {
    if (typeof currentLang !== 'undefined') return currentLang;
  } catch (e) {}
  return (window.currentLang || 'es');
}

const i18n = {
  "es": {
    "transcripcionTitle": "Audio y transcripción",
    "transcripcionDescTitle": "Audio y transcripción",
    "transcripcionDesc": "Habla y transmite audio en tiempo real a todos los usuarios. Mientras tanto, la inteligencia artificial local procesa tu voz y tu idioma para convertirla en texto y mostrarla directamente en el chat.",
    "userJorge": "Jorge",
    "userSofia": "Sofía",
    "userCarlos": "Carlos",
    "categoryProd": "PRODUCCIÓN",
    "categoryLuz": "LUZ / FX",
    "categorySonido": "SONIDO",
    "msgHolaMundo": "Hola Mundo",
    "placeholderText": "Escribe tu mensaje...",
    "chunks": [
      "la",
      "Hola",
      "Hola Mun...",
      "Hola Mundo"
    ],
    "traduccionTitle": "Traducción automática y fluida",
    "traduccionDescTitle": "Traducción automática y fluida",
    "traduccionDesc": "Cada usuario recibe los mensajes automáticamente en su idioma, de forma personalizada, natural y fluida, facilitando la comunicación entre equipos y participantes.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "¿Estamos listos?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "hasta el infinito y más allá",
    "transLang2": "(EN)",
    "triggersTitle": "Editor gráfico y Keyframes",
    "triggersDescTitle": "Editor gráfico y Keyframes",
    "triggersDesc": "Crea y personaliza alertas y triggers desde un potente editor gráfico.\n\nAñade keyframes, etiquétalos, asigna valores y selecciona diferentes tipos de curvas para diseñar y ajustar cada automatización con precisión.",
    "filtrosTitle": "Filtros dinámicos",
    "filtrosDescTitle": "Filtros dinámicos",
    "filtrosDesc": "Alterna al instante entre todos los mensajes, categorías individuales o combinaciones de categorías mediante multiselecciones personalizadas.\n\nEncuentra y visualiza exactamente la información que necesitas en cada momento.",
    "filterAll": "TODOS",
    "filterProd": "PRODUCCIÓN",
    "filterLuz": "LUZ / FX",
    "filterSonido": "SONIDO",
    "filterMsg1": "Comenzamos el show en 5 minutos",
    "filterMsg2": "Foco principal en azul neón listo",
    "filterMsg3": "Música intro sonando",
    "protocolosTitle": "Control dentro y fuera del chat",
    "protocolosDescTitle": "Control dentro y fuera del chat",
    "protocolosDesc": "Recibe Timecode SMPTE LTC y controla otros sistemas mediante conmutación dinámica a través de protocolos como OSC, MIDI y sACN.\n\nDispara señales y automatizaciones en otros softwares y dispositivos hardware directamente desde el sistema.",
    "alertasTitle": "Alertas multisensoriales",
    "alertasDescTitle": "Alertas multisensoriales",
    "alertasDesc": "Crea experiencias de alerta más completas combinando diferentes estímulos.\n\nConfigura patrones visuales en pantalla, incluyendo color y opacidad, respuestas hápticas de vibración y secuencias de destellos de linterna en los dispositivos compatibles.",
    "alertRow1Title": "Alertas Pantalla",
    "alertRow1Sub": "Animación de color y opacidad",
    "alertRow2Title": "Vibración",
    "alertRow2Sub": "Patrón rítmico de haptics",
    "alertRow3Title": "Linterna",
    "alertRow3Sub": "Secuencia de destellos LED",
    "triggerInOutTitle": "Triggers In/Out",
    "triggerInOutDescTitle": "Triggers In/Out",
    "triggerInOutDesc": "Gestiona disparadores de entrada y salida para conectar eventos, automatizaciones y acciones entre diferentes sistemas.\n\nDefine cuándo y cómo debe ejecutarse cada trigger para mantener un control preciso sobre todo el flujo de trabajo.",
    "searchPlaceholder": "Buscar trigger...",
    "savedTriggersLabel": "TRIGGERS (15)",
    "addTriggerBtn": "+ Añadir Trigger",
    "motoresTitle": "Traducción avanzada",
    "motoresDescTitle": "Traducción avanzada",
    "motoresDesc": "Configura la traducción automática según las necesidades de cada proyecto.\n\nPuedes mostrar u ocultar el mensaje original, filtrar los idiomas entrantes y gestionar un diccionario de palabras protegidas para conservar correctamente la terminología técnica, nombres propios y jerga específica.",
    "idiomaVozTitle": "Diccionarios personalizados",
    "idiomaVozDescTitle": "Diccionarios personalizados",
    "idiomaVozDesc": "Añade términos, nombres o palabras específicas para mejorar la precisión de la transcripción.\n\nCada idioma puede disponer de su propio diccionario personalizado, adaptando el reconocimiento de voz a las necesidades de cada proyecto.",
    "motoresVozElasticosTitle": "Motores de voz flexibles",
    "motoresVozElasticosDescTitle": "Motores de voz flexibles",
    "motoresVozElasticosDesc": "Gestiona los diferentes motores de inteligencia artificial encargados del procesamiento de voz.\n\nLos motores pueden ejecutarse de forma local y offline en tu equipo mediante el pre-launch, ofreciendo control total sobre el procesamiento y la privacidad de los datos.",
    "modosAudioTitle": "Modos de audio",
    "modosAudioDescTitle": "Modos de audio",
    "modosAudioDesc": "Elige entre dos modos de funcionamiento: PTT (Push-to-Talk) o Automático.\n\nPTT (Push-to-Talk): mantén pulsado el botón para transmitir audio, como en un walkie-talkie. La transmisión permanece activa mientras mantengas pulsado el control.\n\nAutomático: establece un umbral de detección para que el sistema active el micrófono automáticamente. Cuando el nivel de audio supera el umbral configurado, el sistema detecta la voz y envía el mensaje de forma automática.",
    "statusSilence": "SILENCIO",
    "statusTalking": "HABLANDO",
    "pttHold": "MANTENER PARA HABLAR",
    "pttSpeaking": "HABLANDO...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "AUTOMÁTICO",
    "optPttText": "Push-to-Talk (mantener)",
    "optAutoText": "Automático (por volumen)",
    "headerMotorIA": "Motor de Traducción IA",
    "labelTradAuto": "TRADUCCIÓN AUTOMÁTICA",
    "descTradAuto": "Traduce el chat al idioma de tu interfaz.",
    "labelMsgOrig": "MENSAJE ORIGINAL",
    "descMsgOrig": "Muestra el texto en su idioma nativo bajo la traducción.",
    "titleIncomingFilter": "FILTRO DE IDIOMAS ENTRANTES",
    "descIncomingFilter": "Selecciona qué idiomas entrantes quieres traducir. Los desmarcados se mostrarán sin alterar.",
    "titleProtectedWords": "PALABRAS PROTEGIDAS (JERGA TÉCNICA)",
    "descProtectedWords": "Estas palabras NUNCA serán traducidas por la IA (Ej: Standby, Fader).",
    "phProtectWord": "Palabra a proteger...",
    "headerIdiomaVoz": "Idioma y Voz",
    "titleUiLang": "IDIOMA DE INTERFAZ",
    "titleSttTranscription": "TRANSCRIPCIÓN IA (ES)",
    "descSttTranscription": "Añade palabras difíciles para mejorar la precisión",
    "phSttBad": "Entiende...",
    "phSttGood": "Corregir a...",
    "labelStoragePath": "Ruta de almacenamiento de los modelos",
    "btnSelectStorage": "Seleccionar...",
    "phSearchLang": "Buscar idioma...",
    "labelMicMode": "MODO DE MICRÓFONO",
    "labelInputLevel": "NIVEL DE ENTRADA",
    "btnInstalled": "INSTALADO",
    "btnDownload": "Descargar",
    "btnCancel": "✕ Cancelar",
    "inputDevice": "Dispositivo de Entrada",
    "channel": "Canal",
    "inputPort": "Puerto de Entrada",
    "oscActiveMsg": "Mensaje OSC Activo",
    "noteTriggered": "Nota Disparada",
    "labelTag": "ETIQUETA",
    "labelTimeMs": "TIEMPO (MS)",
    "labelValue": "VALOR",
    "labelCurveNext": "CURVA A SIG.",
    "labelHoldTime": "TIEMPO DE ESPERA",
    "labelKfOrder": "ORDEN DE KEYFRAMES",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "audio original",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "ENTRADA DE AUDIO SMPTE",
    "lblChannel": "CANAL",
    "lblStartTime": "TIEMPO DE INICIO",
    "lblEndTime": "TIEMPO DE FIN",
    "lblLtcLive": "LTC EN VIVO",
    "lblUniversoDmx": "UNIVERSO DMX",
    "lblCanalInicio": "CANAL DE INICIO",
    "lblValorDmxLive": "VALOR DMX EN VIVO",
    "tabOut": "↑ SALIDA (OUT)",
    "tabIn": "↓ ENTRADA (IN)",
    "tabTimeCode": "Código de Tiempo",
    "lblDuration": "Duración"
  },
  "en": {
    "transcripcionTitle": "Audio and transcription",
    "transcripcionDescTitle": "Audio and transcription",
    "transcripcionDesc": "Speak and transmit audio in real time to all users. Meanwhile, local artificial intelligence processes your voice and language to convert it into text and display it directly in the chat.",
    "userJorge": "George",
    "userSofia": "Sarah",
    "userCarlos": "Charles",
    "categoryProd": "PRODUCTION",
    "categoryLuz": "LIGHTS / FX",
    "categorySonido": "SOUND",
    "msgHolaMundo": "Hello World",
    "placeholderText": "Type your message...",
    "chunks": [
      "la",
      "Hello",
      "Hello Wor...",
      "Hello World"
    ],
    "traduccionTitle": "Automatic and fluid translation",
    "traduccionDescTitle": "Automatic and fluid translation",
    "traduccionDesc": "Each user receives messages automatically in their language, in a personalized, natural, and fluid way, facilitating communication between teams and participants.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Are we ready?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "Hasta el infinito y más allá",
    "transTextMsg2Target": "To infinity and beyond",
    "transLang2": "(ES)",
    "triggersTitle": "Graphical editor and Keyframes",
    "triggersDescTitle": "Graphical editor and Keyframes",
    "triggersDesc": "Create and customize alerts and triggers from a powerful graphical editor.\n\nAdd keyframes, label them, assign values, and select different curve types to design and fine-tune each automation with precision.",
    "filtrosTitle": "Dynamic filters",
    "filtrosDescTitle": "Dynamic filters",
    "filtrosDesc": "Instantly toggle between all messages, individual categories, or custom multi-selection category combinations.\n\nFind and view exactly the information you need at any moment.",
    "filterAll": "ALL",
    "filterProd": "PRODUCTION",
    "filterLuz": "LIGHTS / FX",
    "filterSonido": "SOUND",
    "filterMsg1": "We start the show in 5 minutes",
    "filterMsg2": "Main spotlight ready in neon blue",
    "filterMsg3": "Intro music playing",
    "protocolosTitle": "In-chat and external control",
    "protocolosDescTitle": "In-chat and external control",
    "protocolosDesc": "Receive SMPTE LTC Timecode and control other systems via dynamic switching through protocols such as OSC, MIDI, and sACN.\n\nTrigger signals and automations in other software and hardware devices directly from the system.",
    "alertasTitle": "Multisensory alerts",
    "alertasDescTitle": "Multisensory alerts",
    "alertasDesc": "Create richer alert experiences by combining different stimuli.\n\nConfigure visual on-screen patterns including color and opacity, haptic vibration responses, and flashlight strobe sequences on compatible devices.",
    "alertRow1Title": "Screen Alerts",
    "alertRow1Sub": "Color and opacity animation",
    "alertRow2Title": "Vibration",
    "alertRow2Sub": "Rhythmic haptics pattern",
    "alertRow3Title": "Flashlight",
    "alertRow3Sub": "LED strobe flashes sequence",
    "triggerInOutTitle": "In/Out Triggers",
    "triggerInOutDescTitle": "In/Out Triggers",
    "triggerInOutDesc": "Manage input and output triggers to connect events, automations, and actions across different systems.\n\nDefine when and how each trigger should execute to maintain precise control over the entire workflow.",
    "searchPlaceholder": "Search trigger...",
    "savedTriggersLabel": "TRIGGERS (15)",
    "addTriggerBtn": "+ Add Trigger",
    "motoresTitle": "Advanced translation",
    "motoresDescTitle": "Advanced translation",
    "motoresDesc": "Configure automatic translation according to the needs of each project.\n\nYou can show or hide the original message, filter incoming languages, and manage a protected words dictionary to accurately preserve technical terminology, proper names, and specific jargon.",
    "idiomaVozTitle": "Custom dictionaries",
    "idiomaVozDescTitle": "Custom dictionaries",
    "idiomaVozDesc": "Add specific terms, names, or words to improve transcription accuracy.\n\nEach language can have its own custom dictionary, tailoring speech recognition to the needs of each project.",
    "motoresVozElasticosTitle": "Flexible voice engines",
    "motoresVozElasticosDescTitle": "Flexible voice engines",
    "motoresVozElasticosDesc": "Manage the different artificial intelligence engines responsible for voice processing.\n\nEngines can run locally and offline on your computer via the pre-launch system, offering total control over processing and data privacy.",
    "modosAudioTitle": "Audio modes",
    "modosAudioDescTitle": "Audio modes",
    "modosAudioDesc": "Choose between two operating modes: PTT (Push-to-Talk) or Automatic.\n\nPTT (Push-to-Talk): press and hold the button to transmit audio, like a walkie-talkie. Transmission remains active as long as you hold the control.\n\nAutomatic: set a detection threshold so the system activates the microphone automatically. When the audio level exceeds the configured threshold, the system detects voice and sends the message automatically.",
    "statusSilence": "SILENT",
    "statusTalking": "SPEAKING",
    "pttHold": "HOLD TO TALK",
    "pttSpeaking": "SPEAKING...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "AUTOMATIC",
    "optPttText": "Push-to-Talk (hold)",
    "optAutoText": "Automatic (by volume)",
    "headerMotorIA": "AI Translation Engine",
    "labelTradAuto": "AUTOMATIC TRANSLATION",
    "descTradAuto": "Translates chat to your interface language.",
    "labelMsgOrig": "ORIGINAL MESSAGE",
    "descMsgOrig": "Shows original text under the translation.",
    "titleIncomingFilter": "INCOMING LANGUAGES FILTER",
    "descIncomingFilter": "Select incoming languages to translate. Unchecked will be shown unaltered.",
    "titleProtectedWords": "PROTECTED WORDS (TECHNICAL JARGON)",
    "descProtectedWords": "These words will NEVER be translated by AI (e.g. Standby, Fader).",
    "phProtectWord": "Word to protect...",
    "headerIdiomaVoz": "Language & Voice",
    "titleUiLang": "INTERFACE LANGUAGE",
    "titleSttTranscription": "AI TRANSCRIPTION (EN)",
    "descSttTranscription": "Add difficult words to improve accuracy",
    "phSttBad": "Understands...",
    "phSttGood": "Correct to...",
    "labelStoragePath": "Models storage path",
    "btnSelectStorage": "Browse...",
    "phSearchLang": "Search language...",
    "labelMicMode": "MICROPHONE MODE",
    "labelInputLevel": "INPUT LEVEL",
    "btnInstalled": "INSTALLED",
    "btnDownload": "Download",
    "btnCancel": "✕ Cancel",
    "inputDevice": "Input Device",
    "channel": "Channel",
    "inputPort": "Input Port",
    "oscActiveMsg": "Active OSC Message",
    "noteTriggered": "Note Triggered",
    "labelTag": "TAG",
    "labelTimeMs": "TIME (MS)",
    "labelValue": "VALUE",
    "labelCurveNext": "CURVE TO NEXT",
    "labelHoldTime": "HOLD TIME",
    "labelKfOrder": "KEYFRAME ORDER",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "original audio",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "SMPTE AUDIO INPUT",
    "lblChannel": "CHANNEL",
    "lblStartTime": "START TIME",
    "lblEndTime": "END TIME",
    "lblLtcLive": "LTC LIVE",
    "lblUniversoDmx": "DMX UNIVERSE",
    "lblCanalInicio": "START CHANNEL",
    "lblValorDmxLive": "LIVE DMX VALUE",
    "tabOut": "↑ OUT",
    "tabIn": "↓ IN",
    "tabTimeCode": "Time Code",
    "lblDuration": "Duration"
  },
  "fr": {
    "transcripcionTitle": "Audio et transcription",
    "transcripcionDescTitle": "Audio et transcription",
    "transcripcionDesc": "Parlez et transmettez de l'audio en temps réel à tous les utilisateurs. Pendant ce temps, l'intelligence artificielle locale traite votre voix et votre langue pour la convertir en texte et l'afficher directement dans le chat.",
    "userJorge": "Georges",
    "userSofia": "Camille",
    "userCarlos": "Charles",
    "categoryProd": "PRODUCTION",
    "categoryLuz": "LUMIÈRES / FX",
    "categorySonido": "SON",
    "msgHolaMundo": "Bonjour le monde",
    "placeholderText": "Écrivez votre message...",
    "chunks": [
      "la",
      "Bonjour",
      "Bonjour le mon...",
      "Bonjour le monde"
    ],
    "traduccionTitle": "Traduction automatique et fluide",
    "traduccionDescTitle": "Traduction automatique et fluide",
    "traduccionDesc": "Chaque utilisateur reçoit automatiquement les messages dans sa langue, de manière personnalisée, naturelle et fluide, facilitant la communication entre les équipes et les participants.",
    "transTextMsg1Orig": "¿Estamos listos?",
    "transTextMsg1Target": "Sommes-nous prêts ?",
    "transLang1": "(ES)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "vers l'infini et au-delà",
    "transLang2": "(EN)",
    "triggersTitle": "Éditeur graphique et Keyframes",
    "triggersDescTitle": "Éditeur graphique et Keyframes",
    "triggersDesc": "Créez et personnalisez des alertes et des déclencheurs depuis un puissant éditeur graphique.\n\nAjoutez des keyframes, étiquetez-les, attribuez des valeurs et sélectionnez différents types de courbes pour concevoir et ajuster chaque automatisation avec précision.",
    "filtrosTitle": "Filtres dynamiques",
    "filtrosDescTitle": "Filtres dynamiques",
    "filtrosDesc": "Basculez instantanément entre tous les messages, des catégories individuelles ou des combinaisons de catégories via des multi-sélections personnalisées.\n\nTrouvez et visualisez exactement l'information dont vous avez besoin à tout moment.",
    "filterAll": "TOUS",
    "filterProd": "PRODUCTION",
    "filterLuz": "LUMIÈRES / FX",
    "filterSonido": "SON",
    "filterMsg1": "Nous commençons le spectacle dans 5 minutes",
    "filterMsg2": "Projecteur principal en bleu néon prêt",
    "filterMsg3": "Musique d'intro en cours",
    "protocolosTitle": "Contrôle dans et hors du chat",
    "protocolosDescTitle": "Contrôle dans et hors du chat",
    "protocolosDesc": "Recevez du Timecode SMPTE LTC et contrôlez d'autres systèmes via une commutation dynamique grâce à des protocoles comme OSC, MIDI et sACN.\n\nDéclenchez des signaux et des automatisations dans d'autres logiciels et matériels directement depuis le système.",
    "alertasTitle": "Alertes multisensorielles",
    "alertasDescTitle": "Alertes multisensorielles",
    "alertasDesc": "Créez des expériences d'alerte plus riches en combinant différents stimuli.\n\nConfigurez des motifs visuels à l'écran, des réponses haptiques de vibration et des séquences de flashs LED sur les appareils compatibles.",
    "alertRow1Title": "Alertes Écran",
    "alertRow1Sub": "Animation de couleur et d'opacité",
    "alertRow2Title": "Vibration",
    "alertRow2Sub": "Motif haptique rythmique",
    "alertRow3Title": "Lampe",
    "alertRow3Sub": "Séquence de flashs LED",
    "triggerInOutTitle": "Déclencheurs In/Out",
    "triggerInOutDescTitle": "Déclencheurs In/Out",
    "triggerInOutDesc": "Gérez les déclencheurs d'entrée et de sortie pour connecter des événements, automatisations et actions entre différents systèmes.\n\nDéfinissez quand et comment chaque déclencheur doit s'exécuter pour maintenir un contrôle précis sur l'ensemble du flux de travail.",
    "searchPlaceholder": "Rechercher un déclencheur...",
    "savedTriggersLabel": "DÉCLENCHEURS (15)",
    "addTriggerBtn": "+ Ajouter un Déclencheur",
    "motoresTitle": "Traduction avancée",
    "motoresDescTitle": "Traduction avancée",
    "motoresDesc": "Configurez la traduction automatique selon les besoins de chaque projet.\n\nVous pouvez afficher ou masquer le message d'origine, filtrer les langues entrantes et gérer un dictionnaire de mots protégés pour préserver la terminologie technique, les noms propres et le jargon spécifique.",
    "idiomaVozTitle": "Dictionnaires personnalisés",
    "idiomaVozDescTitle": "Dictionnaires personnalisés",
    "idiomaVozDesc": "Ajoutez des termes, des noms ou des mots spécifiques pour améliorer la précision de la transcription.\n\nChaque langue peut disposer de son propre dictionnaire personnalisé, adaptant la reconnaissance vocale aux besoins de chaque projet.",
    "motoresVozElasticosTitle": "Moteurs vocaux flexibles",
    "motoresVozElasticosDescTitle": "Moteurs vocaux flexibles",
    "motoresVozElasticosDesc": "Gérez les différents moteurs d'intelligence artificielle chargés du traitement vocal.\n\nLes moteurs peuvent s'exécuter en local et hors ligne sur votre équipement via le système de pré-lancement, offrant un contrôle total sur le traitement et la confidentialité des données.",
    "modosAudioTitle": "Modes audio",
    "modosAudioDescTitle": "Modes audio",
    "modosAudioDesc": "Choisissez entre deux modes de fonctionnement : PTT (Push-to-Talk) ou Automatique.\n\nPTT (Push-to-Talk) : maintenez le bouton enfoncé pour transmettre de l'audio, comme avec un walkie-talkie. La transmission reste active tant que vous maintenez le contrôle enfoncé.\n\nAutomatique : définissez un seuil de détection pour que le système active le microphone automatiquement. Lorsque le niveau audio dépasse le seuil configuré, le système détecte la voix et envoie le message automatiquement.",
    "statusSilence": "SILENCE",
    "statusTalking": "EN TRAIN DE PARLER",
    "pttHold": "MAINTENIR POUR PARLER",
    "pttSpeaking": "PARLE...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "AUTOMATIQUE",
    "optPttText": "Push-to-Talk (maintenir)",
    "optAutoText": "Automatique (par volume)",
    "headerMotorIA": "Moteur de Traduction IA",
    "labelTradAuto": "TRADUCTION AUTOMATIQUE",
    "descTradAuto": "Traduit le chat dans la langue de votre interface.",
    "labelMsgOrig": "MESSAGE ORIGINAL",
    "descMsgOrig": "Affiche le texte original sous la traduction.",
    "titleIncomingFilter": "FILTRE DES LANGUES ENTRANTES",
    "descIncomingFilter": "Sélectionnez les langues entrantes à traduire. Les non cochées resteront inchangées.",
    "titleProtectedWords": "MOTS PROTÉGÉS (JARGON TECHNIQUE)",
    "descProtectedWords": "Ces mots ne seront JAMAIS traduits par l'IA (ex. Standby, Fader).",
    "phProtectWord": "Mot à protéger...",
    "headerIdiomaVoz": "Langue et Voix",
    "titleUiLang": "LANGUE D'INTERFACE",
    "titleSttTranscription": "TRANSCRIPTION IA (FR)",
    "descSttTranscription": "Ajoutez des mots difficiles pour améliorer la précision",
    "phSttBad": "Comprend...",
    "phSttGood": "Corriger en...",
    "labelStoragePath": "Chemin de stockage des modèles",
    "btnSelectStorage": "Parcourir...",
    "phSearchLang": "Rechercher une langue...",
    "labelMicMode": "MODE MICROPHONE",
    "labelInputLevel": "NIVEAU D'ENTRÉE",
    "btnInstalled": "INSTALLÉ",
    "btnDownload": "Télécharger",
    "btnCancel": "✕ Annuler",
    "inputDevice": "Périphérique d'entrée",
    "channel": "Canal",
    "inputPort": "Port d'entrée",
    "oscActiveMsg": "Message OSC actif",
    "noteTriggered": "Note déclenchée",
    "labelTag": "ÉTIQUETTE",
    "labelTimeMs": "TEMPS (MS)",
    "labelValue": "VALEUR",
    "labelCurveNext": "COURBE SUIVANTE",
    "labelHoldTime": "TEMPS DE MAINTIEN",
    "labelKfOrder": "ORDRE DES KEYFRAMES",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "audio d'origine",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "ENTRÉE AUDIO SMPTE",
    "lblChannel": "CANAL",
    "lblStartTime": "HEURE DE DÉBUT",
    "lblEndTime": "HEURE DE FIN",
    "lblLtcLive": "LTC EN DIRECT",
    "lblUniversoDmx": "UNIVERS DMX",
    "lblCanalInicio": "CANAL DE DÉPART",
    "lblValorDmxLive": "VALEUR DMX EN DIRECT",
    "tabOut": "↑ SORTIE (OUT)",
    "tabIn": "↓ ENTRÉE (IN)",
    "tabTimeCode": "Code Temporel",
    "lblDuration": "Durée"
  },
  "de": {
    "transcripcionTitle": "Audio und Transkription",
    "transcripcionDescTitle": "Audio und Transkription",
    "transcripcionDesc": "Sprechen und übertragen Sie Audio in Echtzeit an alle Benutzer. Unterdessen verarbeitet die lokale künstliche Intelligenz Ihre Stimme und Sprache, um sie in Text umzuwandeln und direkt im Chat anzuzeigen.",
    "userJorge": "Jörg",
    "userSofia": "Sophie",
    "userCarlos": "Karl",
    "categoryProd": "PRODUKTION",
    "categoryLuz": "LICHT / FX",
    "categorySonido": "TON",
    "msgHolaMundo": "Hallo Welt",
    "placeholderText": "Schreiben Sie Ihre Nachricht...",
    "chunks": [
      "la",
      "Hallo",
      "Hallo We...",
      "Hallo Welt"
    ],
    "traduccionTitle": "Automatische und nahtlose Übersetzung",
    "traduccionDescTitle": "Automatische und nahtlose Übersetzung",
    "traduccionDesc": "Jeder Benutzer erhält Nachrichten automatisch in seiner Sprache, personalisiert, natürlich und flüssig, was die Kommunikation zwischen Teams und Teilnehmern erleichtert.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Sind wir bereit?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "Hasta el infinito y más allá",
    "transTextMsg2Target": "Bis zum Unendlichen und noch viel weiter",
    "transLang2": "(ES)",
    "triggersTitle": "Grafischer Editor und Keyframes",
    "triggersDescTitle": "Grafischer Editor und Keyframes",
    "triggersDesc": "Erstellen und passen Sie Warnungen und Trigger in einem leistungsstarken grafischen Editor an.\n\nFügen Sie Keyframes hinzu, beschriften Sie sie, weisen Sie Werte zu und wählen Sie verschiedene Kurventypen aus, um jede Automatisierung präzise zu gestalten.",
    "filtrosTitle": "Dynamische Filter",
    "filtrosDescTitle": "Dynamische Filter",
    "filtrosDesc": "Wechseln Sie sofort zwischen allen Nachrichten, einzelnen Kategorien oder benutzerdefinierten Mehrfachauswahlen.\n\nFinden und betrachten Sie genau die Informationen, die Sie in jedem Moment benötigen.",
    "filterAll": "ALLE",
    "filterProd": "PRODUKTION",
    "filterLuz": "LICHT / FX",
    "filterSonido": "TON",
    "filterMsg1": "Die Show beginnt in 5 Minuten",
    "filterMsg2": "Hauptscheinwerfer in Neonblau bereit",
    "filterMsg3": "Intromusik läuft jetzt",
    "protocolosTitle": "Steuerung im und außerhalb des Chats",
    "protocolosDescTitle": "Steuerung im und außerhalb des Chats",
    "protocolosDesc": "Empfangen Sie SMPTE LTC Timecode und steuern Sie andere Systeme durch dynamisches Umschalten über Protokolle wie OSC, MIDI und sACN.\n\nLösen Sie Signale und Automatisierungen in anderer Software und Hardware direkt aus.",
    "alertasTitle": "Multisensorische Warnungen",
    "alertasDescTitle": "Multisensorische Warnungen",
    "alertasDesc": "Erstellen Sie umfassendere Warnungserlebnisse durch die Kombination verschiedener Reize.\n\nKonfigurieren Sie visuelle Bildschirmmuster (Farbe und Opazität), haptische Vibrationsrückmeldungen und LED-Blitzsequenzen auf kompatiblen Geräten.",
    "alertRow1Title": "Bildschirm-Warnungen",
    "alertRow1Sub": "Farb- und Opazitätsanimation",
    "alertRow2Title": "Vibration",
    "alertRow2Sub": "Rhythmisches Haptik-Muster",
    "alertRow3Title": "Taschenlampe",
    "alertRow3Sub": "LED-Blitzsequenz",
    "triggerInOutTitle": "In/Out Trigger",
    "triggerInOutDescTitle": "In/Out Trigger",
    "triggerInOutDesc": "Verwalten Sie Eingangs- und Ausgangstrigger, um Ereignisse, Automatisierungen und Aktionen zwischen verschiedenen Systemen zu verbinden.\n\nDefinieren Sie, wann und wie jeder Trigger ausgeführt werden soll, um den gesamten Arbeitsablauf präzise zu steuern.",
    "searchPlaceholder": "Trigger suchen...",
    "savedTriggersLabel": "TRIGGER (15)",
    "addTriggerBtn": "+ Trigger Hinzufügen",
    "motoresTitle": "Erweiterte Übersetzung",
    "motoresDescTitle": "Erweiterte Übersetzung",
    "motoresDesc": "Konfigurieren Sie die automatische Übersetzung nach den Anforderungen jedes Projekts.\n\nSie können die Originalnachricht anzeigen oder ausblenden, eingehende Sprachen filtern und ein Wörterbuch geschützter Begriffe verwalten, um technische Begriffe, Eigennamen und Fachjargon zu bewahren.",
    "idiomaVozTitle": "Benutzerdefinierte Wörterbücher",
    "idiomaVozDescTitle": "Benutzerdefinierte Wörterbücher",
    "idiomaVozDesc": "Fügen Sie spezifische Begriffe, Namen oder Wörter hinzu, um die Transkriptionsgenauigkeit zu verbessern.\n\nJede Sprache kann über ein eigenes benutzerdefiniertes Wörterbuch verfügen, das die Spracherkennung an die Anforderungen jedes Projekts anpasst.",
    "motoresVozElasticosTitle": "Flexible Sprach-Engines",
    "motoresVozElasticosDescTitle": "Flexible Sprach-Engines",
    "motoresVozElasticosDesc": "Verwalten Sie die verschiedenen künstlichen Intelligenz-Engines, die für die Sprachverarbeitung zuständig sind.\n\nDie Engines können lokal und offline auf Ihrem Gerät über das Pre-Launch-System ausgeführt werden, was totale Kontrolle über die Verarbeitung und den Datenschutz bietet.",
    "modosAudioTitle": "Audio-Modi",
    "modosAudioDescTitle": "Audio-Modi",
    "modosAudioDesc": "Wählen Sie zwischen zwei Betriebsmodi: PTT (Push-to-Talk) oder Automatisch.\n\nPTT (Push-to-Talk): Halten Sie die Taste gedrückt, um Audio wie mit einem Walkie-Talkie zu übertragen. Die Übertragung bleibt aktiv, solange Sie die Steuerung gedrückt halten.\n\nAutomatisch: Legen Sie einen Erkennungsschwellenwert fest, damit das System das Mikrofon automatisch aktiviert. Wenn der Audiopegel den konfigurierten Schwellenwert überschreitet, erkennt das System die Stimme und sendet die Nachricht automatisch.",
    "statusSilence": "STUMM",
    "statusTalking": "SPRECHEND",
    "pttHold": "ZUM SPRECHEN DRÜCKEN",
    "pttSpeaking": "SPRICHT...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "AUTOMATISCH",
    "optPttText": "Push-to-Talk (gedrückt halten)",
    "optAutoText": "Automatisch (nach Lautstärke)",
    "headerMotorIA": "KI-Übersetzungs-Engine",
    "labelTradAuto": "AUTOMATISCHE ÜBERSETZUNG",
    "descTradAuto": "Übersetzt den Chat in Ihre Schnittstellensprache.",
    "labelMsgOrig": "ORIGINAL-NACHRICHT",
    "descMsgOrig": "Zeigt den Originaltext unter der Übersetzung an.",
    "titleIncomingFilter": "EINGEHENDE SPRACHFILTER",
    "descIncomingFilter": "Wählen Sie eingehende Sprachen zur Übersetzung. Unmarkierte bleiben unverändert.",
    "titleProtectedWords": "GESCHÜTZTE WÖRTER (FACHJARGON)",
    "descProtectedWords": "Diese Wörter werden NIE von der KI übersetzt (z. B. Standby, Fader).",
    "phProtectWord": "Zu schützendes Wort...",
    "headerIdiomaVoz": "Sprache & Stimme",
    "titleUiLang": "SCHNITTSTELLENSPRACHE",
    "titleSttTranscription": "KI-TRANSKRIPTION (DE)",
    "descSttTranscription": "Fügen Sie schwierige Wörter hinzu, um die Genauigkeit zu verbessern",
    "phSttBad": "Versteht...",
    "phSttGood": "Korrigieren zu...",
    "labelStoragePath": "Modellspeicherpfad",
    "btnSelectStorage": "Durchsuchen...",
    "phSearchLang": "Sprache suchen...",
    "labelMicMode": "MIKROFONMODUS",
    "labelInputLevel": "EINGANGSPEGEL",
    "btnInstalled": "INSTALLIERT",
    "btnDownload": "Herunterladen",
    "btnCancel": "✕ Abbrechen",
    "inputDevice": "Eingabegerät",
    "channel": "Kanal",
    "inputPort": "Eingangsport",
    "oscActiveMsg": "Aktive OSC-Nachricht",
    "noteTriggered": "Note ausgelöst",
    "labelTag": "TAG",
    "labelTimeMs": "ZEIT (MS)",
    "labelValue": "WERT",
    "labelCurveNext": "KURVE ZUR NÄCHSTEN",
    "labelHoldTime": "HALTEZEIT",
    "labelKfOrder": "KEYFRAME-REIHENFOLGE",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "Original-Audio",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "SMPTE-AUDIOEINGANG",
    "lblChannel": "KANAL",
    "lblStartTime": "STARTZEIT",
    "lblEndTime": "ENDZEIT",
    "lblLtcLive": "LTC LIVE",
    "lblUniversoDmx": "DMX-UNIVERSUM",
    "lblCanalInicio": "STARTKANAL",
    "lblValorDmxLive": "LIVE-DMX-WERT",
    "tabOut": "↑ AUSGANG (OUT)",
    "tabIn": "↓ EINGANG (IN)",
    "tabTimeCode": "Timecode",
    "lblDuration": "Dauer"
  },
  "it": {
    "transcripcionTitle": "Audio e trascrizione",
    "transcripcionDescTitle": "Audio e trascrizione",
    "transcripcionDesc": "Parla e trasmetti audio in tempo reale a tutti gli utenti. Nel frattempo, l'intelligenza artificiale locale elabora la tua voce e la tua lingua per convertirla in testo e mostrarla direttamente in chat.",
    "userJorge": "Giorgio",
    "userSofia": "Sofia",
    "userCarlos": "Carlo",
    "categoryProd": "PRODUZIONE",
    "categoryLuz": "LUCI / FX",
    "categorySonido": "SUONO",
    "msgHolaMundo": "Ciao Mondo",
    "placeholderText": "Scrivi il tuo messaggio...",
    "chunks": [
      "ciao",
      "Ciao",
      "Ciao Mon...",
      "Ciao Mondo"
    ],
    "traduccionTitle": "Traduzione automatica e fluida",
    "traduccionDescTitle": "Traduzione automatica e fluida",
    "traduccionDesc": "Ogni utente riceve automaticamente i messaggi nella propria lingua, in modo personalizzato, naturale e fluido, facilitando la comunicazione tra team e partecipanti.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Siamo pronti?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "verso l'infinito e oltre",
    "transLang2": "(EN)",
    "triggersTitle": "Editor grafico e Keyframe",
    "triggersDescTitle": "Editor grafico e Keyframe",
    "triggersDesc": "Crea e personalizza avvisi e trigger da un potente editor grafico.\n\nAggiungi keyframe, etichettali, assegna valori e seleziona diversi tipi di curve per progettare e regolare ogni automazione con precisione.",
    "filtrosTitle": "Filtri dinamici",
    "filtrosDescTitle": "Filtri dinamici",
    "filtrosDesc": "Passa all'istante tra tutti i messaggi, singole categorie o combinazioni di categorie personalizzate.\n\nTrova e visualizza esattamente le informazioni di cui hai bisogno in qualsiasi momento.",
    "filterAll": "TUTTI",
    "filterProd": "PRODUZIONE",
    "filterLuz": "LUCI / FX",
    "filterSonido": "SUONO",
    "filterMsg1": "Iniziamo lo show tra 5 minuti",
    "filterMsg2": "Faro principale in blu neon pronto",
    "filterMsg3": "Musica intro in riproduzione",
    "protocolosTitle": "Controllo dentro e fuori dalla chat",
    "protocolosDescTitle": "Controllo dentro e fuori dalla chat",
    "protocolosDesc": "Ricevi SMPTE LTC Timecode e controlla altri sistemi tramite commutazione dinamica con protocolli quali OSC, MIDI e sACN.\n\nAttiva segnali e automazioni in altri software e dispositivi hardware direttamente dal sistema.",
    "alertasTitle": "Avvisi multisensoriali",
    "alertasDescTitle": "Avvisi multisensoriali",
    "alertasDesc": "Crea esperienze di avviso più ricche combinando diversi stimoli.\n\nConfigura modelli visivi sullo schermo tra cui colore e opacità, risposte aptiche di vibrazione e sequenze di lampeggio della torcia sui dispositivi compatibili.",
    "alertRow1Title": "Avvisi Schermo",
    "alertRow1Sub": "Animazione colore e opacità",
    "alertRow2Title": "Vibrazione",
    "alertRow2Sub": "Motivo aptico ritmico",
    "alertRow3Title": "Torcia",
    "alertRow3Sub": "Sequenza di lampeggi LED",
    "triggerInOutTitle": "Trigger In/Out",
    "triggerInOutDescTitle": "Trigger In/Out",
    "triggerInOutDesc": "Gestisci i trigger di ingresso e uscita per collegare eventi, automazioni e azioni tra diversi sistemi.\n\nDefinisci quando e come deve essere eseguito ciascun trigger per mantenere un controllo preciso su tutto il flusso di lavoro.",
    "searchPlaceholder": "Cerca trigger...",
    "savedTriggersLabel": "TRIGGER (15)",
    "addTriggerBtn": "+ Aggiungi Trigger",
    "motoresTitle": "Traduzione avanzata",
    "motoresDescTitle": "Traduzione avanzata",
    "motoresDesc": "Configura la traduzione automatica in base alle esigenze di ciascun progetto.\n\nPuoi mostrare o nascondere il messaggio originale, filtrare le lingue in entrata e gestire un dizionario di parole protette per preservare correttamente la terminologia tecnica, i nomi propri e il gergo specifico.",
    "idiomaVozTitle": "Dizionari personalizzati",
    "idiomaVozDescTitle": "Dizionari personalizzati",
    "idiomaVozDesc": "Aggiungi termini, nomi o parole specifiche per migliorare la precisione della trascrizione.\n\nOgni lingua può avere il proprio dizionario personalizzato, adattando il riconoscimento vocale alle esigenze di ciascun progetto.",
    "motoresVozElasticosTitle": "Motori vocali flessibili",
    "motoresVozElasticosDescTitle": "Motori vocali flessibili",
    "motoresVozElasticosDesc": "Gestisci i diversi motori di intelligenza artificiale preposti all'elaborazione vocale.\n\nI motori possono essere eseguiti in locale e offline sul tuo computer tramite il pre-launch, offrendo controllo totale sull'elaborazione e sulla privacy dei dati.",
    "modosAudioTitle": "Modalità audio",
    "modosAudioDescTitle": "Modalità audio",
    "modosAudioDesc": "Scegli tra due modalità di funzionamento: PTT (Push-to-Talk) o Automatica.\n\nPTT (Push-to-Talk): tieni premuto il pulsante per trasmettere l'audio, come un walkie-talkie. La trasmissione rimane attiva finché tieni premuto il controllo.\n\nAutomatica: imposta una soglia di rilevamento in modo che il sistema attivi automaticamente il microfono. Quando il livello audio supera la soglia configurata, il sistema rileva la voce e invia il messaggio automaticamente.",
    "statusSilence": "SILENZIO",
    "statusTalking": "PARLANDO",
    "pttHold": "TIENI PREMUTO PER PARLARE",
    "pttSpeaking": "PARLANDO...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "AUTOMATICO",
    "optPttText": "Push-to-Talk (tieni premuto)",
    "optAutoText": "Automatico (per volume)",
    "headerMotorIA": "Motore di Traduzione IA",
    "labelTradAuto": "TRADUZIONE AUTOMATICA",
    "descTradAuto": "Traduce la chat nella lingua della tua interfaccia.",
    "labelMsgOrig": "MESSAGGIO ORIGINALE",
    "descMsgOrig": "Mostra il testo nella sua lingua nativa sotto la traduzione.",
    "titleIncomingFilter": "FILTRO LINGUE IN ENTRATA",
    "descIncomingFilter": "Seleziona quali lingue in entrata vuoi tradurre. Quelle non selezionate verranno mostrate inalterate.",
    "titleProtectedWords": "PAROLE PROTETTE (GERGO TECNICO)",
    "descProtectedWords": "Queste parole non verranno MAI tradotte dall'IA (es. Standby, Fader).",
    "phProtectWord": "Parola da proteggere...",
    "headerIdiomaVoz": "Lingua e Voce",
    "titleUiLang": "LINGUA DELL'INTERFACCIA",
    "titleSttTranscription": "TRASCRIZIONE IA (IT)",
    "descSttTranscription": "Aggiungi parole difficili per migliorare la precisione",
    "phSttBad": "Comprende...",
    "phSttGood": "Correggi in...",
    "labelStoragePath": "Percorso di archiviazione modelli",
    "btnSelectStorage": "Sfoglia...",
    "phSearchLang": "Cerca lingua...",
    "labelMicMode": "MODALITÀ MICROFONO",
    "labelInputLevel": "LIVELLO DI INGRESSO",
    "btnInstalled": "INSTALLATO",
    "btnDownload": "Scarica",
    "btnCancel": "✕ Annulla",
    "inputDevice": "Dispositivo di ingresso",
    "channel": "Canale",
    "inputPort": "Porta di ingresso",
    "oscActiveMsg": "Messaggio OSC attivo",
    "noteTriggered": "Nota attivata",
    "labelTag": "ETICHETTA",
    "labelTimeMs": "TEMPO (MS)",
    "labelValue": "VALORE",
    "labelCurveNext": "CURVA SUCCESSIVA",
    "labelHoldTime": "TEMPO DI ATTESA",
    "labelKfOrder": "ORDINE DEI KEYFRAME",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "audio originale",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "INGRESSO AUDIO SMPTE",
    "lblChannel": "CHANNEL",
    "lblStartTime": "TEMPO DI INIZIO",
    "lblEndTime": "TEMPO DI FINE",
    "lblLtcLive": "LTC DAL VIVO",
    "lblUniversoDmx": "UNIVERSO DMX",
    "lblCanalInicio": "CANALE DI INIZIO",
    "lblValorDmxLive": "VALORE DMX DAL VIVO",
    "tabOut": "↑ USCITA (OUT)",
    "tabIn": "↓ INGRESSO (IN)",
    "tabTimeCode": "Codice Temporale",
    "lblDuration": "Durata"
  },
  "pt": {
    "transcripcionTitle": "Áudio e transcrição",
    "transcripcionDescTitle": "Áudio e transcrição",
    "transcripcionDesc": "Fale e transmita áudio em tempo real para todos os usuários. Enquanto isso, a inteligência artificial local processa sua voz e seu idioma para convertê-los em texto e exibi-los diretamente no chat.",
    "userJorge": "Jorge",
    "userSofia": "Sofia",
    "userCarlos": "Carlos",
    "categoryProd": "PRODUÇÃO",
    "categoryLuz": "LUZES / FX",
    "categorySonido": "SOM",
    "msgHolaMundo": "Olá Mundo",
    "placeholderText": "Digite sua mensagem...",
    "chunks": [
      "olá",
      "Olá",
      "Olá Mun...",
      "Olá Mundo"
    ],
    "traduccionTitle": "Tradução automática e fluida",
    "traduccionDescTitle": "Tradução automática e fluida",
    "traduccionDesc": "Cada usuário recebe mensagens automaticamente em seu idioma, de forma personalizada, natural e fluida, facilitando a comunicação entre equipes e participantes.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Estamos prontos?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "ao infinito e além",
    "transLang2": "(EN)",
    "triggersTitle": "Editor gráfico e Keyframes",
    "triggersDescTitle": "Editor gráfico e Keyframes",
    "triggersDesc": "Crie e personalize alertas e gatilhos em um poderoso editor gráfico.\n\nAdicione keyframes, rotule-os, atribua valores e selecione diferentes tipos de curvas para projetar e ajustar cada automação com precisão.",
    "filtrosTitle": "Filtros dinâmicos",
    "filtrosDescTitle": "Filtros dinâmicos",
    "filtrosDesc": "Alterne instantaneamente entre todas as mensagens, categorias individuais ou combinações de categorias personalizadas.\n\nEncontre e visualize exatamente as informações de que precisa a qualquer momento.",
    "filterAll": "TODOS",
    "filterProd": "PRODUÇÃO",
    "filterLuz": "LUZES / FX",
    "filterSonido": "SOM",
    "filterMsg1": "Começamos o show em 5 minutos",
    "filterMsg2": "Refletor principal em azul néon pronto",
    "filterMsg3": "Música de introdução tocando",
    "protocolosTitle": "Controle no chat e externo",
    "protocolosDescTitle": "Controle no chat e externo",
    "protocolosDesc": "Receba Timecode SMPTE LTC e controle outros sistemas por meio de comutação dinâmica usando protocolos como OSC, MIDI e sACN.\n\nDispare sinais e automações em outros softwares e dispositivos de hardware diretamente do sistema.",
    "alertasTitle": "Alertas multissensoriais",
    "alertasDescTitle": "Alertas multissensoriais",
    "alertasDesc": "Crie experiências de alerta mais ricas combinando diferentes estímulos.\n\nConfigure padrões visuais na tela, incluindo cor e opacidade, respostas hápticas de vibração e sequências de estroboscópio da lanterna em dispositivos compatíveis.",
    "alertRow1Title": "Alertas de Tela",
    "alertRow1Sub": "Animação de cor e opacidade",
    "alertRow2Title": "Vibração",
    "alertRow2Sub": "Padrão háptico rítmico",
    "alertRow3Title": "Lanterna",
    "alertRow3Sub": "Sequência de flashes LED",
    "triggerInOutTitle": "Gatilhos In/Out",
    "triggerInOutDescTitle": "Gatilhos In/Out",
    "triggerInOutDesc": "Gerencie gatilhos de entrada e saída para conectar eventos, automações e ações em diferentes sistemas.\n\nDefina quando e como cada gatilho deve ser executado para manter um controle preciso sobre todo o fluxo de trabalho.",
    "searchPlaceholder": "Buscar gatilho...",
    "savedTriggersLabel": "GATILHOS (15)",
    "addTriggerBtn": "+ Adicionar Gatilho",
    "motoresTitle": "Tradução avançada",
    "motoresDescTitle": "Tradução avançada",
    "motoresDesc": "Configure a tradução automática de acordo com as necessidades de cada projeto.\n\nVocê pode exibir ou ocultar a mensagem original, filtrar os idiomas de entrada e gerenciar um dicionário de palavras protegidas para preservar a terminologia técnica, nomes próprios e jargões específicos.",
    "idiomaVozTitle": "Dicionários personalizados",
    "idiomaVozDescTitle": "Dicionários personalizados",
    "idiomaVozDesc": "Adicione termos, nomes ou palavras específicas para melhorar a precisão da transcrição.\n\nCada idioma pode ter seu próprio dicionário personalizado, adaptando o reconhecimento de voz às necessidades de cada projeto.",
    "motoresVozElasticosTitle": "Motores de voz flexíveis",
    "motoresVozElasticosDescTitle": "Motores de voz flexíveis",
    "motoresVozElasticosDesc": "Gerencie os diferentes motores de inteligência artificial responsáveis pelo processamento de voz.\n\nOs motores podem ser executados localmente e offline em seu computador via pré-lançamento, oferecendo controle total sobre o processamento e a privacidade dos dados.",
    "modosAudioTitle": "Modos de áudio",
    "modosAudioDescTitle": "Modos de áudio",
    "modosAudioDesc": "Escolha entre dois modos de operação: PTT (Push-to-Talk) ou Automático.\n\nPTT (Push-to-Talk): pressione e segure o botão para transmitir áudio, como um walkie-talkie. A transmissão permanece ativa enquanto você segura o controle.\n\nAutomático: defina um limite de detecção para que o sistema ative o microfone automaticamente. Quando o nível de áudio ultrapassa o limite configurado, o sistema detecta a voz e envia a mensagem automaticamente.",
    "statusSilence": "SILÊNCIO",
    "statusTalking": "FALANDO",
    "pttHold": "SEGURE PARA FALAR",
    "pttSpeaking": "FALANDO...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "AUTOMÁTICO",
    "optPttText": "Push-to-Talk (segurar)",
    "optAutoText": "Automático (por volume)",
    "headerMotorIA": "Motor de Tradução IA",
    "labelTradAuto": "TRADUÇÃO AUTOMÁTICA",
    "descTradAuto": "Traduz o chat para o idioma da sua interface.",
    "labelMsgOrig": "MENSAGEM ORIGINAL",
    "descMsgOrig": "Mostra o texto em seu idioma nativo abaixo da tradução.",
    "titleIncomingFilter": "FILTRO DE IDIOMAS DE ENTRADA",
    "descIncomingFilter": "Selecione quais idiomas de entrada você deseja traduzir. Os desmarcados serão exibidos inalterados.",
    "titleProtectedWords": "PALAVRAS PROTEGIDAS (JARGÃO TÉCNICO)",
    "descProtectedWords": "Estas palavras NUNCA serão traduzidas pela IA (ex: Standby, Fader).",
    "phProtectWord": "Palavra a proteger...",
    "headerIdiomaVoz": "Idioma e Voz",
    "titleUiLang": "IDIOMA DA INTERFACE",
    "titleSttTranscription": "TRANSCRIÇÃO IA (PT)",
    "descSttTranscription": "Adicione palavras difíceis para melhorar a precisão",
    "phSttBad": "Entende...",
    "phSttGood": "Corrigir para...",
    "labelStoragePath": "Caminho de armazenamento dos modelos",
    "btnSelectStorage": "Procurar...",
    "phSearchLang": "Buscar idioma...",
    "labelMicMode": "MODO DO MICROFONE",
    "labelInputLevel": "NÍVEL DE ENTRADA",
    "btnInstalled": "INSTALADO",
    "btnDownload": "Baixar",
    "btnCancel": "✕ Cancelar",
    "inputDevice": "Dispositivo de entrada",
    "channel": "Canal",
    "inputPort": "Porta de entrada",
    "oscActiveMsg": "Mensagem OSC ativa",
    "noteTriggered": "Nota disparada",
    "labelTag": "ETIQUETA",
    "labelTimeMs": "TEMPO (MS)",
    "labelValue": "VALOR",
    "labelCurveNext": "CURVA SEGUINTE",
    "labelHoldTime": "TEMPO DE RETENÇÃO",
    "labelKfOrder": "ORDEM DOS KEYFRAMES",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "áudio original",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "ENTRADA DE ÁUDIO SMPTE",
    "lblChannel": "CHANNEL",
    "lblStartTime": "HORA DE INÍCIO",
    "lblEndTime": "HORA DE FIM",
    "lblLtcLive": "LTC AO VIVO",
    "lblUniversoDmx": "UNIVERSO DMX",
    "lblCanalInicio": "CANAL DE INÍCIO",
    "lblValorDmxLive": "VALOR DMX AO VIVO",
    "tabOut": "↑ SAÍDA (OUT)",
    "tabIn": "↓ ENTRADA (IN)",
    "tabTimeCode": "Código de Tempo",
    "lblDuration": "Duração"
  },
  "ca": {
    "transcripcionTitle": "Àudio i transcripció",
    "transcripcionDescTitle": "Àudio i transcripció",
    "transcripcionDesc": "Parla i transmet àudio en temps real a tots els usuaris. Mentrestant, la intel·ligència artificial local processa la teva veu i el teu idioma per convertir-la en text i mostrar-la directament al xat.",
    "userJorge": "Jordi",
    "userSofia": "Sofia",
    "userCarlos": "Carles",
    "categoryProd": "PRODUCCIÓ",
    "categoryLuz": "LLUM / FX",
    "categorySonido": "SO",
    "msgHolaMundo": "Hola Món",
    "placeholderText": "Escriu el teu missatge...",
    "chunks": [
      "hola",
      "Hola",
      "Hola Mon...",
      "Hola Món"
    ],
    "traduccionTitle": "Traducció automàtica i fluida",
    "traduccionDescTitle": "Traducció automàtica i fluida",
    "traduccionDesc": "Cada usuari rep els missatges automàticament en el seu idioma, de manera personalitzada, natural i fluida, facilitant la comunicació entre equips i participants.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Estem a punt?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "fins a l'infinit i més enllà",
    "transLang2": "(EN)",
    "triggersTitle": "Editor gràfic i Keyframes",
    "triggersDescTitle": "Editor gràfic i Keyframes",
    "triggersDesc": "Crea i personalitza alertes i triggers des d'un potent editor gràfic.\n\nAfegeix keyframes, etiqueta'ls, assigna valors i selecciona diferents tipus de corbes per dissenyar i ajustar cada automatització amb precisió.",
    "filtrosTitle": "Filtres dinàmics",
    "filtrosDescTitle": "Filtres dinàmics",
    "filtrosDesc": "Alterna a l'instant entre tots els missatges, categories individuals o combinacions de categories mitjançant multiseleccions personalitzades.\n\nTroba i visualitza exactament la informació que necessites en cada moment.",
    "filterAll": "TOTS",
    "filterProd": "PRODUCCIÓ",
    "filterLuz": "LLUM / FX",
    "filterSonido": "SO",
    "filterMsg1": "Comencem el xou en 5 minuts",
    "filterMsg2": "Foc principal en blau neó a punt",
    "filterMsg3": "Música d'intro sonant",
    "protocolosTitle": "Control dins i fora del xat",
    "protocolosDescTitle": "Control dins i fora del xat",
    "protocolosDesc": "Rep Timecode SMPTE LTC i controla altres sistemes mitjançant commutació dinàmica a través de protocols com OSC, MIDI i sACN.\n\nDispara senyals i automatitzacions en altres programes i dispositius de maquinari directament des del sistema.",
    "alertasTitle": "Alertes multisensorials",
    "alertasDescTitle": "Alertes multisensorials",
    "alertasDesc": "Crea experiències d'alerta més completes combinant diferents estímuls.\n\nConfigura patrons visuals en pantalla incloent color i opacitat, respostes hàptiques de vibració i seqüències de Flaix LED en dispositius compatibles.",
    "alertRow1Title": "Alertes Pantalla",
    "alertRow1Sub": "Animació de color i opacitat",
    "alertRow2Title": "Vibració",
    "alertRow2Sub": "Patró rítmic hàptic",
    "alertRow3Title": "Llanterna",
    "alertRow3Sub": "Seqüència de ràfegues LED",
    "triggerInOutTitle": "Triggers In/Out",
    "triggerInOutDescTitle": "Triggers In/Out",
    "triggerInOutDesc": "Gestiona disparadors d'entrada i sortida per connectar esdeveniments, automatitzacions i accions entre diferents sistemes.\n\nDefineix quan i com s'ha d'executar cada trigger per mantenir un control precís sobre tot el flux de treball.",
    "searchPlaceholder": "Cercar trigger...",
    "savedTriggersLabel": "TRIGGERS (15)",
    "addTriggerBtn": "+ Afegir Trigger",
    "motoresTitle": "Traducció avançada",
    "motoresDescTitle": "Traducció avançada",
    "motoresDesc": "Configura la traducció automàtica segons les necessitats de cada projecte.\n\nPots mostrar o ocultar el missatge original, filtrar els idiomes entrants i gestionar un diccionari de paraules protegides per conservar correctament la terminologia tècnica, noms propis i argot específic.",
    "idiomaVozTitle": "Diccionaris personalitzats",
    "idiomaVozDescTitle": "Diccionaris personalitzats",
    "idiomaVozDesc": "Afegeix termes, noms o paraules específiques per millorar la precisió de la transcripció.\n\nCada idioma pot disposar del seu propi diccionari personalitzat, adaptant el reconeixement de veu a les necessitats de cada projecte.",
    "motoresVozElasticosTitle": "Motors de veu flexibles",
    "motoresVozElasticosDescTitle": "Motors de veu flexibles",
    "motoresVozElasticosDesc": "Gestiona els diferents motors d'intel·ligència artificial encarregats del processament de veu.\n\nEls motors poden executar-se de forma local i offline al teu equip mitjançant el pre-launch, oferint control total sobre el processament i la privacitat de les dades.",
    "modosAudioTitle": "Modes d'àudio",
    "modosAudioDescTitle": "Modes d'àudio",
    "modosAudioDesc": "Tria entre dos modes de funcionament: PTT (Push-to-Talk) o Automàtic.\n\nPTT (Push-to-Talk): mantén premut el botó per transmetre àudio, com en un walkie-talkie. La transmissió es manté activa mentre mantinguis premut el control.\n\nAutomàtic: estableix un llindar de detecció perquè el sistema activi el micròfon automàticament. Quan el nivell d'àudio supera el llindar configurat, el sistema detecta la veu i envia el missatge automàticament.",
    "statusSilence": "SILENCI",
    "statusTalking": "PARLANT",
    "pttHold": "MANTEIR PER PARLAR",
    "pttSpeaking": "PARLANT...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "AUTOMÀTIC",
    "optPttText": "Push-to-Talk (mantenir)",
    "optAutoText": "Automàtic (per volum)",
    "headerMotorIA": "Motor de Traducció IA",
    "labelTradAuto": "TRADUCCIÓ AUTOMÀTICA",
    "descTradAuto": "Tradueix el xat a l'idioma de la teva interfície.",
    "labelMsgOrig": "MISSATGE ORIGINAL",
    "descMsgOrig": "Mostra el text en el seu idioma natiu sota la traducció.",
    "titleIncomingFilter": "FILTRE D'IDIOMES ENTRANTS",
    "descIncomingFilter": "Selecciona quins idiomes entrants vols traduir. Els desmarcats es mostraran sense alterar.",
    "titleProtectedWords": "PARAULES PROTEGIDES (ARGOT TÈCNIC)",
    "descProtectedWords": "Aquestes paraules MAI seran traduïdes per la IA (Ex: Standby, Fader).",
    "phProtectWord": "Paraula a protegir...",
    "headerIdiomaVoz": "Idioma i Veu",
    "titleUiLang": "IDIOMA DE LA INTERFÍCIE",
    "titleSttTranscription": "TRANSCRIPCIÓ IA (CA)",
    "descSttTranscription": "Afegeix paraules difícils per millorar la precisió",
    "phSttBad": "Entén...",
    "phSttGood": "Corregir a...",
    "labelStoragePath": "Ruta d'emmagatzematge dels models",
    "btnSelectStorage": "Seleccionar...",
    "phSearchLang": "Cercar idioma...",
    "labelMicMode": "MODE DE MICRÓFON",
    "labelInputLevel": "NIVELL D'ENTRADA",
    "btnInstalled": "INSTAL·LAT",
    "btnDownload": "Descarregar",
    "btnCancel": "✕ Cancel·lar",
    "inputDevice": "Dispositiu d'Entrada",
    "channel": "Canal",
    "inputPort": "Port d'Entrada",
    "oscActiveMsg": "Missatge OSC Actiu",
    "noteTriggered": "Nota Disparada",
    "labelTag": "ETIQUETA",
    "labelTimeMs": "TEMPS (MS)",
    "labelValue": "VALOR",
    "labelCurveNext": "CORBA A SEG.",
    "labelHoldTime": "TEMPS DE MANTENIMENT",
    "labelKfOrder": "ORDRE DE KEYFRAMES",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "àudio original",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "ENTRADA D'ÀUDIO SMPTE",
    "lblChannel": "CHANNEL",
    "lblStartTime": "TEMPS D'INICI",
    "lblEndTime": "TEMPS DE FI",
    "lblLtcLive": "LTC EN DIRECTE",
    "lblUniversoDmx": "UNIVERS DMX",
    "lblCanalInicio": "CANAL D'INICI",
    "lblValorDmxLive": "VALOR DMX EN DIRECTE",
    "tabOut": "↑ SORTIDA (OUT)",
    "tabIn": "↓ ENTRADA (IN)",
    "tabTimeCode": "Codi de Temps",
    "lblDuration": "Durada"
  },
  "gl": {
    "transcripcionTitle": "Audio e transcrición",
    "transcripcionDescTitle": "Audio e transcrición",
    "transcripcionDesc": "Fala e transmite audio en tempo real a todos os usuarios. Mentres tanto, a intelixencia artificial local procesa a túa voz e o teu idioma para convertela en texto e hila amosar directamente no chat.",
    "userJorge": "Xurxo",
    "userSofia": "Sofía",
    "userCarlos": "Carlos",
    "categoryProd": "PRODUCCIÓN",
    "categoryLuz": "LUZ / FX",
    "categorySonido": "SON",
    "msgHolaMundo": "Ola Mundo",
    "placeholderText": "Escribe a túa mensaxe...",
    "chunks": [
      "ola",
      "Ola",
      "Ola Mun...",
      "Ola Mundo"
    ],
    "traduccionTitle": "Traducción automática e fluída",
    "traduccionDescTitle": "Traducción automática e fluída",
    "traduccionDesc": "Cada usuario recibe as mensaxes automaticamente no seu idioma, de forma personalizada, natural e fluída, facilitando a comunicación entre equipos e participantes.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Estamos listos?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "ata o infinito e máis alá",
    "transLang2": "(EN)",
    "triggersTitle": "Editor gráfico e Keyframes",
    "triggersDescTitle": "Editor gráfico e Keyframes",
    "triggersDesc": "Crea e personaliza alertas e triggers desde un potente editor gráfico.\n\nEngade keyframes, etiquétaos, asigna valores e selecciona diferentes tipos de curvas para deseñar e axustar cada automatización con precisión.",
    "filtrosTitle": "Filtros dinámicos",
    "filtrosDescTitle": "Filtros dinámicos",
    "filtrosDesc": "Alterna ao instante entre todas as mensaxes, categorías individuais ou combinacións de categorías mediante multiseleccións personalizadas.\n\nAtopa e visualiza exactamente a información que precisas en cada momento.",
    "filterAll": "TODOS",
    "filterProd": "PRODUCCIÓN",
    "filterLuz": "LUZ / FX",
    "filterSonido": "SON",
    "filterMsg1": "Comezamos o show en 5 minutos",
    "filterMsg2": "Foco principal en azul neón listo",
    "filterMsg3": "Música intro soando",
    "protocolosTitle": "Control dentro e fóra do chat",
    "protocolosDescTitle": "Control dentro e fóra do chat",
    "protocolosDesc": "Recibe Timecode SMPTE LTC e controla outros sistemas mediante conmutación dinámica a través de protocolos como OSC, MIDI e sACN.\n\nDispara sinais e automatizacións noutros softwares e dispositivos hardware directamente desde o sistema.",
    "alertasTitle": "Alertas multisensoriais",
    "alertasDescTitle": "Alertas multisensoriais",
    "alertasDesc": "Crea experiencias de alerta máis completas combinando diferentes estímulos.\n\nConfigura patróns visuais en pantalla, incluíndo cor e opacidade, respostas hápticas de vibración e secuencias de destellos de lanterna nos dispositivos compatibles.",
    "alertRow1Title": "Alertas Pantalla",
    "alertRow1Sub": "Animación de cor e opacidade",
    "alertRow2Title": "Vibración",
    "alertRow2Sub": "Patrón rítmico de haptics",
    "alertRow3Title": "Lanterna",
    "alertRow3Sub": "Secuencia de ráfagas LED",
    "triggerInOutTitle": "Triggers In/Out",
    "triggerInOutDescTitle": "Triggers In/Out",
    "triggerInOutDesc": "Xestiona disparadores de entrada e saída para conectar eventos, automatizacións e accións entre diferentes sistemas.\n\nDefine cando e como debe executarse cada trigger para manter un control preciso sobre todo o fluxo de traballo.",
    "searchPlaceholder": "Buscar trigger...",
    "savedTriggersLabel": "TRIGGERS (15)",
    "addTriggerBtn": "+ Engadir Trigger",
    "motoresTitle": "Traducción avanzada",
    "motoresDescTitle": "Traducción avanzada",
    "motoresDesc": "Configura a traducción automática segundo as necesidades de cada proxecto.\n\nPodes mostrar ou ocultar a mensaxe orixinal, filtrar os idiomas entrantes e xestionar un dicionario de palabras protexidas para conservar correctamente a terminoloxía técnica, nomes propios e xerga específica.",
    "idiomaVozTitle": "Dicionarios personalizados",
    "idiomaVozDescTitle": "Dicionarios personalizados",
    "idiomaVozDesc": "Engade termos, nomes ou palabras específicas para mellorar a precisión da transcrición.\n\nCada idioma pode dispoñer do seu propio dicionario personalizado, adaptando o recoñecemento de voz ás necesidades de cada proxecto.",
    "motoresVozElasticosTitle": "Motores de voz flexibles",
    "motoresVozElasticosDescTitle": "Motores de voz flexibles",
    "motoresVozElasticosDesc": "Xestiona os diferentes motores de intelixencia artificial encargados do procesamento de voz.\n\nOs motores poden executarse de forma local e offline no teu equipo mediante o pre-launch, ofrecendo control total sobre o procesamento e a privacidade dos datos.",
    "modosAudioTitle": "Modos de audio",
    "modosAudioDescTitle": "Modos de audio",
    "modosAudioDesc": "Elixe entre dous modos de funcionamento: PTT (Push-to-Talk) ou Automático.\n\nPTT (Push-to-Talk): mantén premido o botón para transmitir audio, como nun walkie-talkie. A transmisión permanece activa mentres manteñas premido o control.\n\nAutomático: establece un limiar de detección para que o sistema active o micrófono automaticamente. Cando o nivel de audio supera o limiar configurado, o sistema detecta a voz e envía a mensaxe de forma automática.",
    "statusSilence": "SILENCIO",
    "statusTalking": "FALANDO",
    "pttHold": "MANTER PARA FALAR",
    "pttSpeaking": "FALANDO...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "AUTOMÁTICO",
    "optPttText": "Push-to-Talk (manter)",
    "optAutoText": "Automático (por volume)",
    "headerMotorIA": "Motor de Traducción IA",
    "labelTradAuto": "TRADUCCIÓN AUTOMÁTICA",
    "descTradAuto": "Traduce o chat ao idioma da túa interface.",
    "labelMsgOrig": "MENSAJE ORIXINAL",
    "descMsgOrig": "Mostra o texto no seu idioma nativo baixo a traducción.",
    "titleIncomingFilter": "FILTRO DE IDIOMAS ENTRANTES",
    "descIncomingFilter": "Selecciona que idiomas entrantes queres traducir. Os desmarcados mostraranse sen alterar.",
    "titleProtectedWords": "PALABRAS PROTEXIDAS (XERGA TÉCNICA)",
    "descProtectedWords": "Estas palabras NUNCA serán traducidas pola IA (Ex: Standby, Fader).",
    "phProtectWord": "Palabra a protexer...",
    "headerIdiomaVoz": "Idioma e Voz",
    "titleUiLang": "IDIOMA DE INTERFACE",
    "titleSttTranscription": "TRANSCRICIÓN IA (GL)",
    "descSttTranscription": "Engade palabras difíciles para mellorar a precisión",
    "phSttBad": "Entende...",
    "phSttGood": "Corrixir a...",
    "labelStoragePath": "Ruta de almacenamento dos modelos",
    "btnSelectStorage": "Seleccionar...",
    "phSearchLang": "Buscar idioma...",
    "labelMicMode": "MODO DE MICRÓFONO",
    "labelInputLevel": "NIVEL DE ENTRADA",
    "btnInstalled": "INSTALADO",
    "btnDownload": "Descargar",
    "btnCancel": "✕ Cancelar",
    "inputDevice": "Dispositivo de Entrada",
    "channel": "Canle",
    "inputPort": "Porto de Entrada",
    "oscActiveMsg": "Mensaxe OSC Activa",
    "noteTriggered": "Nota Disparada",
    "labelTag": "ETIQUETA",
    "labelTimeMs": "TEMPO (MS)",
    "labelValue": "VALOR",
    "labelCurveNext": "CURVA A SEG.",
    "labelHoldTime": "TEMPO DE ESPERA",
    "labelKfOrder": "ORDE DE KEYFRAMES",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "áudio orixinal",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "ENTRADA DE ÁUDIO SMPTE",
    "lblChannel": "CHANNEL",
    "lblStartTime": "TEMPO DE INICIO",
    "lblEndTime": "TEMPO DE FIN",
    "lblLtcLive": "LTC EN DIRECTO",
    "lblUniversoDmx": "UNIVERSO DMX",
    "lblCanalInicio": "CANAL DE INICIO",
    "lblValorDmxLive": "VALOR DMX EN DIRECTO",
    "tabOut": "↑ SAÍDA (OUT)",
    "tabIn": "↓ ENTRADA (IN)",
    "tabTimeCode": "Código de Tempo",
    "lblDuration": "Duración"
  },
  "eu": {
    "transcripcionTitle": "Audioa eta transkripzioa",
    "transcripcionDescTitle": "Audioa eta transkripzioa",
    "transcripcionDesc": "Hitz egin eta igorri audioa denbora errealean erabiltzaile guztiei. Bitartean, tokiko adimen artifizialak zure ahotsa eta hizkuntza prozesatzen ditu testu bihurtzeko eta txat-ean zuzenean erakusteko.",
    "userJorge": "Gorka",
    "userSofia": "Zuriñe",
    "userCarlos": "Karlosh",
    "categoryProd": "PRODUKZIOA",
    "categoryLuz": "ARGIA / FX",
    "categorySonido": "SOINUA",
    "msgHolaMundo": "Kaixo Mundua",
    "placeholderText": "Idatzi zure mezua...",
    "chunks": [
      "kaixo",
      "Kaixo",
      "Kaixo Mun...",
      "Kaixo Mundua"
    ],
    "traduccionTitle": "Itzulpen automatiko eta fluidoa",
    "traduccionDescTitle": "Itzulpen automatiko eta fluidoa",
    "traduccionDesc": "Erabiltzaile bakoitzak automatikoki jasotzen ditu mezuak bere hizkuntzan, modu pertsonalizatu, natural eta fluidoan, taldeen eta parte-hartzaileen arteko komunikazioa erraztuz.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Prest gaude?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "infinituraino eta haratago",
    "transLang2": "(EN)",
    "triggersTitle": "Editore grafikoa eta Keyframe-ak",
    "triggersDescTitle": "Editore grafikoa eta Keyframe-ak",
    "triggersDesc": "Sortu eta pertsonalizatu alertak eta gailagailuak editore grafiko indartsu batetik.\n\nGehitu keyframe-ak, etiketatzen ditu, balioak esleitu eta kurba mota desberdinak aukeratu automatizazio bakoitza zehaztasunez diseinatzeko eta doitzeko.",
    "filtrosTitle": "Iragazki dinamikoak",
    "filtrosDescTitle": "Iragazki dinamikoak",
    "filtrosDesc": "Aldatu berehala mezu guztien, kategoria indibidualen edo kategoria konbinazio pertsonalizatuen artean.\n\nAurkitu eta bistaratu une bakoitzean behar duzun informazio zehatza.",
    "filterAll": "GUZTIAK",
    "filterProd": "PRODUKZIOA",
    "filterLuz": "ARGIA / FX",
    "filterSonido": "SOINUA",
    "filterMsg1": "Ikuskizuna 5 minututan hasiko dugu",
    "filterMsg2": "Foku nagusia urdin neon prest",
    "filterMsg3": "Hasierako musika jotzen ari da",
    "protocolosTitle": "Txat barruko eta kanpoko kontrola",
    "protocolosDescTitle": "Txat barruko eta kanpoko kontrola",
    "protocolosDesc": "Jaso SMPTE LTC Timecode eta kontrolatu beste sistema batzuk aldatze dinamikoaren bidez OSC, MIDI eta sACN bezalako protokoloen bidez.\n\nBatu seinaleak eta automatizazioak beste software eta hardware gailu batzuetan zuzenean sistemantik.",
    "alertasTitle": "Zentzumen anitzeko alertak",
    "alertasDescTitle": "Zentzumen anitzeko alertak",
    "alertasDesc": "Sortu alerta-esperientzia osoagoak hainbat stimuluren bidez.\n\nKonfiguratu ikus-patroiak pantailan, kolorea eta opakutasuna barne, bibrazio-erantzun haptikoak eta linterna-argien sekuentziak gailu bateragarrietan.",
    "alertRow1Title": "Pantaila Alertak",
    "alertRow1Sub": "Kolore eta opakutasun animazioa",
    "alertRow2Title": "Bibrazioa",
    "alertRow2Sub": "Haptiken eredu erritmikoa",
    "alertRow3Title": "Linterna",
    "alertRow3Sub": "LED tximista sekuentzia",
    "triggerInOutTitle": "Sarrera/Irteera Gaituak",
    "triggerInOutDescTitle": "Sarrera/Irteera Gaituak",
    "triggerInOutDesc": "Kudeatu sarrera eta irteerako gailagailuak gertaerak, automatizazioak eta ekintzak sistema desberdinen artean konektatzeko.\n\nZehaztu noiz eta nola exekutatu behar den gailagailu bakoitza lan-fluido osoaren kontrol zehatza mantentzeko.",
    "searchPlaceholder": "Bilatu gailagailua...",
    "savedTriggersLabel": "GAILAGAILUAK (15)",
    "addTriggerBtn": "+ Gehitu Gailagailua",
    "motoresTitle": "Itzulpen aurreratua",
    "motoresDescTitle": "Itzulpen aurreratua",
    "motoresDesc": "Konfiguratu itzulpen automatikoa proiektu bakoitzaren beharren arabera.\n\nJatorrizko mezua erakutsi edo ezkutatu dezakezu, sartzen diren hizkuntzak iragazi eta babestutako hitzen hiztegi bat kudeatu terminologia teknikoa, izen propioak eta jargon zehatza zuzen mantentzeko.",
    "idiomaVozTitle": "Hiztegi pertsonalizatuak",
    "idiomaVozDescTitle": "Hiztegi pertsonalizatuak",
    "idiomaVozDesc": "Gehitu baldintza, izen edo hitz zehatzak transkripzioaren zehaztasuna hobetzeko.\n\nHizkuntza bakoitzak bere hiztegi pertsonalizatua izan dezake, ahots ezagutza proiektu bakoitzaren beharretara egokituz.",
    "motoresVozElasticosTitle": "Ahots motor malguak",
    "motoresVozElasticosDescTitle": "Ahots motor malguak",
    "motoresVozElasticosDesc": "Kudeatu ahotsaren prozesamenduaz arduratzen diren adimen artifizialeko motor desberdinak.\n\nMotorrak tokian-tokian eta lineaz kanpo exekutatu daitezke zure gailuan pre-launch bidez, prozesamenduaren eta datuen pribatutasunaren kontrol osoa eskainiz.",
    "modosAudioTitle": "Audio moduak",
    "modosAudioDescTitle": "Audio moduak",
    "modosAudioDesc": "Aukeratu bi funtzionamendu moduen artean: PTT (Push-to-Talk) edo Automatikoa.\n\nPTT (Push-to-Talk): sakatu eta mantendu botoia audioa igortzeko, walkie-talkie batean bezala. Transmisioa aktibo mantentzen da kontrola sakatuta duzun bitartean.\n\nAutomatikoa: ezarri detekzio-atari bat sistemak mikrofonoa automatikoki aktiba dezan. Audio-mailak konfiguratutako ataria gainditzen duenean, sistemak ahotsa detektatu eta mezua automatikoki bidaltzen du.",
    "statusSilence": "ISILTASUNA",
    "statusTalking": "HITZ EGITEN",
    "pttHold": "SAKATU HITZ EGITEKO",
    "pttSpeaking": "HITZ EGITEN...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "AUTOMATIKOA",
    "optPttText": "Push-to-Talk (sakatu)",
    "optAutoText": "Automatikoa (bolumenagatik)",
    "headerMotorIA": "IA Itzulpen Motorra",
    "labelTradAuto": "ITZULPEN AUTOMATIKOA",
    "descTradAuto": "Itzuli txat-a zure interfazearen hizkuntzara.",
    "labelMsgOrig": "JATORRIZKO MEZUA",
    "descMsgOrig": "Erakutsi testua bere jatorrizko hizkuntzan itzulpenaren azpian.",
    "titleIncomingFilter": "SARTZEN DIREN HIZKUNTZEN IRAGAZKIA",
    "descIncomingFilter": "Hautatu zer hizkuntza itzuli nahi dituzun. Desmarkatutakoak aldatu gabe erakutsiko dira.",
    "titleProtectedWords": "BABESTUTAKO HITZAK (JARGON TEKNIKOA)",
    "descProtectedWords": "Hitz hauek EZ ditu inondik inora IA-k itzuliko (adibidez: Standby, Fader).",
    "phProtectWord": "Babesteko hitza...",
    "headerIdiomaVoz": "Hizkuntza eta Ahotsa",
    "titleUiLang": "INTERFAZEAREN HIZKUNTZA",
    "titleSttTranscription": "IA TRANSKRIPZIOA (EU)",
    "descSttTranscription": "Gehitu hitz zailak zehaztasuna hobetzeko",
    "phSttBad": "Ulertzen du...",
    "phSttGood": "Zuzendu hona...",
    "labelStoragePath": "Ereduak gordetzeko bidea",
    "btnSelectStorage": "Aukeratu...",
    "phSearchLang": "Bilatu hizkuntza...",
    "labelMicMode": "MIKROFONO MODUA",
    "labelInputLevel": "SARRERA MAILA",
    "btnInstalled": "INSTALATUTA",
    "btnDownload": "Deskargatu",
    "btnCancel": "✕ Utzi",
    "inputDevice": "Sarrera Gailua",
    "channel": "Kanala",
    "inputPort": "Sarrera Portua",
    "oscActiveMsg": "OSC Mezu Aktiboa",
    "noteTriggered": "Nota Sakatua",
    "labelTag": "ETIKETA",
    "labelTimeMs": "DENBORA (MS)",
    "labelValue": "BALIOA",
    "labelCurveNext": "HURRENGO KURBA",
    "labelHoldTime": "MANTENTZE DENBORA",
    "labelKfOrder": "KEYFRAME ORDENA",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "jatorrizko audioa",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "SMPTE AUDIO SARRERA",
    "lblChannel": "CHANNEL",
    "lblStartTime": "HASIERA DENBORA",
    "lblEndTime": "AMAIERA DENBORA",
    "lblLtcLive": "LTC ZUZENEAN",
    "lblUniversoDmx": "DMX UNIBERTSOA",
    "lblCanalInicio": "HASIERA KANALA",
    "lblValorDmxLive": "ZUZENEKO DMX BALIOA",
    "tabOut": "↑ IRTEERA (OUT)",
    "tabIn": "↓ SARRERA (IN)",
    "tabTimeCode": "Denbora Kodea",
    "lblDuration": "Iraupena"
  },
  "ar": {
    "transcripcionTitle": "الصوت والتفريغ النصي",
    "transcripcionDescTitle": "الصوت والتفريغ النصي",
    "transcripcionDesc": "تحدث وانقل الصوت في الوقت الفعلي إلى جميع المستخدمين. في هذه الأثناء، يقوم الذكاء الاصطناعي المحلي بمعالجة صوتك ولغتك لتحويلهما إلى نص وعرضهما مباشرة في الدردشة.",
    "userJorge": "جورج",
    "userSofia": "سوفيا",
    "userCarlos": "كارلوس",
    "categoryProd": "الإنتاج",
    "categoryLuz": "الإضاءة / FX",
    "categorySonido": "الصوت",
    "msgHolaMundo": "مرحباً بالعالم",
    "placeholderText": "اكتب رسالتك...",
    "chunks": [
      "مرحباً",
      "مرحباً",
      "مرحباً بالـ...",
      "مرحباً بالعالم"
    ],
    "traduccionTitle": "ترجمة آلية وسلسة",
    "traduccionDescTitle": "ترجمة آلية وسلسة",
    "traduccionDesc": "يتلقى كل مستخدم الرسائل تلقائياً بلغته بطريقة مخصصة وطبيعية وسلسة، مما يسهل التواصل بين الفرق والمشاركين.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "هل نحن مستعدون؟",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "إلى المالانهاية وما بعدها",
    "transLang2": "(EN)",
    "triggersTitle": "محرر رسومي وإطارات رئيسية",
    "triggersDescTitle": "محرر رسومي وإطارات رئيسية",
    "triggersDesc": "أنشئ وخصص التنبيهات والمشغلات من محرر رسومي قوي.\n\nأضف الإطارات الرئيسية، وعنونها، وعين القيم واختَر أنواع المنحنيات لضبط كل أتمتة بدقة.",
    "filtrosTitle": "مرشحات ديناميكية",
    "filtrosDescTitle": "مرشحات ديناميكية",
    "filtrosDesc": "بدل فوراً بين جميع الرسائل أو الفئات الفردية أو فئات مخصصة متعددة.\n\nاعثر على المعلومات التي تحتاجها بالضبط في أي لحظة.",
    "filterAll": "الكل",
    "filterProd": "الإنتاج",
    "filterLuz": "الإضاءة / FX",
    "filterSonido": "الصوت",
    "filterMsg1": "نبدأ العرض خلال 5 دقائق",
    "filterMsg2": "الضوء الرئيسي بالأزرق النيون جاهز",
    "filterMsg3": "موسيقى المقدمة تعمل الان",
    "protocolosTitle": "التحكم داخل الدردشة وخارجها",
    "protocolosDescTitle": "التحكم داخل الدردشة وخارجها",
    "protocolosDesc": "استقبل Timecode SMPTE LTC وتحكم في الأنظمة الأخرى عبر التبديل الديناميكي باستخدام بروتوكولات مثل OSC و MIDI و sACN.\n\nقم بتشغيل الإشارات والأتمتة في البرامج والأجهزة الأخرى مباشرة من النظام.",
    "alertasTitle": "تنبيهات متعددة الحواس",
    "alertasDescTitle": "تنبيهات متعددة الحواس",
    "alertasDesc": "أنشئ تجارب تنبيه أكثر ثراءً بالجمع بين المحفزات المختلفة.\n\nقم بتكوين الأنماط المرئية على الشاشة بما في ذلك اللون والشفافية والاستجابات الاهتزازية وتسلسلات وميض الفلاش على الأجهزة المتوافقة.",
    "alertRow1Title": "تنبيهات الشاشة",
    "alertRow1Sub": "رسوم متحركة للون والشفافية",
    "alertRow2Title": "الاهتزاز",
    "alertRow2Sub": "نمط اهتزازي إيقاعي",
    "alertRow3Title": "الكشاف",
    "alertRow3Sub": "تسلسل وميض LED",
    "triggerInOutTitle": "مشغلات الدخول / الخروج",
    "triggerInOutDescTitle": "مشغلات الدخول / الخروج",
    "triggerInOutDesc": "إدارة مشغلات الإدخال والإخراج لربط الأحداث والأتمتة والإجراءات بين الأنظمة المختلفة.\n\nحدد متى وكيف يجب تنفيذ كل مشغل للحفاظ على التحكم الدقيق.",
    "searchPlaceholder": "بحث عن مشغل...",
    "savedTriggersLabel": "المشغلات (15)",
    "addTriggerBtn": "+ إضافة مشغل",
    "motoresTitle": "ترجمة متadvanceة",
    "motoresDescTitle": "ترجمة متقدمة",
    "motoresDesc": "قم بتكوين الترجمة الآلية وفقاً لاحتياجات كل مشروع.\n\nيمكنك إظهار أو إخفاء الرسالة الأصلية، وتصفية اللغات الواردة وإدارة قاموس الكلمات المحمية للحفاظ على المصطلحات الفنية الأسماء واللغة الخاصة.",
    "idiomaVozTitle": "قواميس مخصصة",
    "idiomaVozDescTitle": "قواميس مخصصة",
    "idiomaVozDesc": "أضف مصطلحات أو أسماء أو كلمات محددة لتحسين دقة التفريغ النصي.\n\nيمكن لكل لغة الحصول على قاموسها المخصص لتكييف التعرف على الصوت.",
    "motoresVozElasticosTitle": "محركات صوتية مرنة",
    "motoresVozElasticosDescTitle": "محركات صوتية مرنة",
    "motoresVozElasticosDesc": "إدارة محركات الذكاء الاصطناعي المختلفة المسؤولة عن معالجة الصوت.\n\nيمكن تشغيل المحركات محلياً ودون اتصال بالإنترنت على جهازك من خلال النظام، مما يوفر تحكماً كاملاً في المعالجة وخصوصية البيانات.",
    "modosAudioTitle": "أوضاع الصوت",
    "modosAudioDescTitle": "أوضاع الصوت",
    "modosAudioDesc": "اختر بين وضعين للتشغيل: PTT (اضغط للتحدث) أو تلقائي.\n\nPTT (اضغط للتحدث): اضغط مع الاستمرار على الزر لنقل الصوت مثل الجهاز اللاسلكي.\n\nتلقائي: حدد عتبة كشف ليقوم النظام بتنشيط الميكروفون تلقائياً عند تجاوز المنسوب.",
    "statusSilence": "صمت",
    "statusTalking": "يتحدث",
    "pttHold": "اضغط واستمر للتحدث",
    "pttSpeaking": "يتحدث...",
    "tagPtt": "اضغط للتحدث",
    "tagAuto": "تلقائي",
    "optPttText": "اضغط للتحدث (استمرار)",
    "optAutoText": "تلقائي (حسب الصوت)",
    "headerMotorIA": "محرك الترجمة بالذكاء الاصطناعي",
    "labelTradAuto": "ترجمة آلية",
    "descTradAuto": "ترجمة الدردشة إلى لغة واجهتك.",
    "labelMsgOrig": "الرسالة الأصلية",
    "descMsgOrig": "يعرض النص بلغته الأصلية تحت الترجمة.",
    "titleIncomingFilter": "فلتر اللغات الواردة",
    "descIncomingFilter": "حدد اللغات الواردة التي تريد ترجمتها. سيتم عرض اللغات غير المحكورة بدون تغيير.",
    "titleProtectedWords": "الكلمات المحمية (المصطلحات الفنية)",
    "descProtectedWords": "لن يتم ترجمة هذه الكلمات مطلقاً بواسطة الذكاء الاصطناعي.",
    "phProtectWord": "كلمة لحمايتها...",
    "headerIdiomaVoz": "اللغة والصوت",
    "titleUiLang": "لغة الواجهة",
    "titleSttTranscription": "التفريغ بالذكاء الاصطناعي (AR)",
    "descSttTranscription": "أضف كلمات صعبة لتحسين الدقة",
    "phSttBad": "يفهم...",
    "phSttGood": "تصحيح إلى...",
    "labelStoragePath": "مسار تخزين النماذج",
    "btnSelectStorage": "استعراض...",
    "phSearchLang": "بحث عن لغة...",
    "labelMicMode": "وضع الميكروفون",
    "labelInputLevel": "مستوى الإدخال",
    "btnInstalled": "مثبت",
    "btnDownload": "تنزيل",
    "btnCancel": "✕ إلغاء",
    "inputDevice": "جهاز الإدخال",
    "channel": "القناة",
    "inputPort": "منفذ الإدخال",
    "oscActiveMsg": "رسالة OSC نشطة",
    "noteTriggered": "نوتة مشغلة",
    "labelTag": "العلامة",
    "labelTimeMs": "الوقت (ملي ثانية)",
    "labelValue": "القيمة",
    "labelCurveNext": "المنحنى التالي",
    "labelHoldTime": "وقت الانتظار",
    "labelKfOrder": "ترتيب الإطارات الرئيسية",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "الصوت الأصلي",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "مدخل صوت SMPTE",
    "lblChannel": "CHANNEL",
    "lblStartTime": "وقت البدء",
    "lblEndTime": "وقت النهاية",
    "lblLtcLive": "بث LTC المباشر",
    "lblUniversoDmx": "عالم DMX",
    "lblCanalInicio": "قناة البدء",
    "lblValorDmxLive": "قيمة DMX المباشرة",
    "tabOut": "↑ خروج (OUT)",
    "tabIn": "↓ دخول (IN)",
    "tabTimeCode": "كود الوقت",
    "lblDuration": "المدة"
  },
  "zh": {
    "transcripcionTitle": "语音与转录",
    "transcripcionDescTitle": "语音与转录",
    "transcripcionDesc": "实时向所有用户传输语音。同时，本地人工智能会处理您的语音和语言，将其转换为文本并直接显示在聊天中。",
    "userJorge": "乔治",
    "userSofia": "索菲亚",
    "userCarlos": "卡洛斯",
    "categoryProd": "制作组",
    "categoryLuz": "灯光 / 特效",
    "categorySonido": "音响组",
    "msgHolaMundo": "你好世界",
    "placeholderText": "输入您的消息...",
    "chunks": [
      "你好",
      "你好",
      "你好世...",
      "你好世界"
    ],
    "traduccionTitle": "自动顺畅翻译",
    "traduccionDescTitle": "自动顺畅翻译",
    "traduccionDesc": "每位用户都会自动接收到以其母语显示的个性化、自然且顺畅的消息，促进团队与参与者之间的沟通。",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "准备好了吗？",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "飞向宇宙，浩瀚无垠",
    "transLang2": "(EN)",
    "triggersTitle": "图形编辑器与关键帧",
    "triggersDescTitle": "图形编辑器与关键帧",
    "triggersDesc": "使用强大的图形编辑器创建和自定义警报与触发器。\n\n添加关键帧、为其命名、分配数值并选择不同的曲线类型，以精准设计和调节自动化。",
    "filtrosTitle": "动态过滤器",
    "filtrosDescTitle": "动态过滤器",
    "filtrosDesc": "在所有消息、单个分类或自定义多选分类组合之间即时切换。\n\n随时查找并精准查看所需的信息。",
    "filterAll": "全部",
    "filterProd": "制作组",
    "filterLuz": "灯光 / 特效",
    "filterSonido": "音响组",
    "filterMsg1": "演出将在5分钟后开始",
    "filterMsg2": "霓虹蓝主聚光灯准备就绪",
    "filterMsg3": "开场音乐播放中",
    "protocolosTitle": "聊天内与外部控制",
    "protocolosDescTitle": "聊天内与外部控制",
    "protocolosDesc": "接收 SMPTE LTC 时间码，并通过 OSC、MIDI 和 sACN 等协议动态切换控制其他系统。\n\n直接从系统触发其他软件和硬件设备中的信号与自动化。",
    "alertasTitle": "多感官警报",
    "alertasDescTitle": "多感官警报",
    "alertasDesc": "结合不同的刺激创造更丰富的警报体验。\n\n在兼容设备上配置屏幕视觉模式（包括颜色和透明度）、震动触觉反馈以及手电筒闪烁序列。",
    "alertRow1Title": "屏幕警报",
    "alertRow1Sub": "颜色与透明度动画",
    "alertRow2Title": "震动",
    "alertRow2Sub": "节奏触觉模式",
    "alertRow3Title": "手电筒",
    "alertRow3Sub": "LED 闪光序列",
    "triggerInOutTitle": "输入/输出触发器",
    "triggerInOutDescTitle": "输入/输出触发器",
    "triggerInOutDesc": "管理输入和输出触发器，在不同系统之间连接事件、自动化和操作。\n\n明确每个触发器的执行时间和方式，对整个工作流程保持精准控制。",
    "searchPlaceholder": "搜索触发器...",
    "savedTriggersLabel": "触发器 (15)",
    "addTriggerBtn": "+ 添加触发器",
    "motoresTitle": "高级翻译",
    "motoresDescTitle": "高级翻译",
    "motoresDesc": "根据每个项目的需求配置自动翻译。\n\n您可以显示或隐藏原始消息、过滤接收语言并管理受保护词汇字典，以准确保留技术术语、专有名词和特定行业术语。",
    "idiomaVozTitle": "自定义字典",
    "idiomaVozDescTitle": "自定义字典",
    "idiomaVozDesc": "添加特定术语、名称或词汇以提高转录准确度。\n\n每种语言都可以拥有自己的自定义字典，使语音识别适应每个项目的需求。",
    "motoresVozElasticosTitle": "弹性语音引擎",
    "motoresVozElasticosDescTitle": "弹性语音引擎",
    "motoresVozElasticosDesc": "管理负责语音处理的不同人工智能引擎。\n\n引擎可以通过预启动系统在您的设备上本地及离线运行，提供对处理和数据隐私的全盘控制。",
    "modosAudioTitle": "音频模式",
    "modosAudioDescTitle": "音频模式",
    "modosAudioDesc": "在两种运行模式之间选择：PTT（按住说话）或自动。\n\nPTT（按住说话）：按住按钮传输音频，就像对讲机一样。\n\n自动：设置检测门限，系统会在音频水平超过门限时自动激活麦克风并发送消息。",
    "statusSilence": "静音",
    "statusTalking": "讲话中",
    "pttHold": "按住说话",
    "pttSpeaking": "讲话中...",
    "tagPtt": "按住说话",
    "tagAuto": "自动模式",
    "optPttText": "按住说话 (PTT)",
    "optAutoText": "自动模式 (按音量)",
    "headerMotorIA": "AI 翻译引擎",
    "labelTradAuto": "自动翻译",
    "descTradAuto": "将聊天翻译为界面语言。",
    "labelMsgOrig": "原始消息",
    "descMsgOrig": "在翻译下方显示母语原文。",
    "titleIncomingFilter": "接收语言过滤器",
    "descIncomingFilter": "选择要翻译的接收语言。未勾选的语言将保持原文显示。",
    "titleProtectedWords": "保护词汇 (技术术语)",
    "descProtectedWords": "这些词汇绝不会被 AI 翻译 (例如: Standby, Fader)。",
    "phProtectWord": "要保护的词汇...",
    "headerIdiomaVoz": "语言与语音",
    "titleUiLang": "界面语言",
    "titleSttTranscription": "AI 转录 (ZH)",
    "descSttTranscription": "添加生僻词以提高准确度",
    "phSttBad": "理解为...",
    "phSttGood": "纠正为...",
    "labelStoragePath": "模型存储路径",
    "btnSelectStorage": "浏览...",
    "phSearchLang": "搜索语言...",
    "labelMicMode": "麦克风模式",
    "labelInputLevel": "输入电平",
    "btnInstalled": "已安装",
    "btnDownload": "下载",
    "btnCancel": "✕ 取消",
    "inputDevice": "输入设备",
    "channel": "通道",
    "inputPort": "输入端口",
    "oscActiveMsg": "活动 OSC 消息",
    "noteTriggered": "已触发音符",
    "labelTag": "标签",
    "labelTimeMs": "时间 (MS)",
    "labelValue": "数值",
    "labelCurveNext": "下一段曲线",
    "labelHoldTime": "保持时间",
    "labelKfOrder": "关键帧顺序",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "原始音频",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "SMPTE 音频输入",
    "lblChannel": "CHANNEL",
    "lblStartTime": "开始时间",
    "lblEndTime": "结束时间",
    "lblLtcLive": "LTC 实时",
    "lblUniversoDmx": "DMX 域",
    "lblCanalInicio": "起始通道",
    "lblValorDmxLive": "DMX 实时值",
    "tabOut": "↑ 输出 (OUT)",
    "tabIn": "↓ 输入 (IN)",
    "tabTimeCode": "时间码",
    "lblDuration": "时长"
  },
  "ru": {
    "transcripcionTitle": "Аудио и транскрипция",
    "transcripcionDescTitle": "Аудио и транскрипция",
    "transcripcionDesc": "Говорите и передавайте аудио в реальном времени всем пользователям. В это время локальный искусственный интеллект распознает ваш голос и язык, преобразуя его в текст и выводя прямо в чат.",
    "userJorge": "Георгий",
    "userSofia": "София",
    "userCarlos": "Карл",
    "categoryProd": "ПРОДАКШН",
    "categoryLuz": "СВЕТ / FX",
    "categorySonido": "ЗВУК",
    "msgHolaMundo": "Привет, мир",
    "placeholderText": "Введите сообщение...",
    "chunks": [
      "привет",
      "Привет",
      "Привет Ми...",
      "Привет, мир"
    ],
    "traduccionTitle": "Автоматический и плавный перевод",
    "traduccionDescTitle": "Автоматический и плавный перевод",
    "traduccionDesc": "Каждый пользователь автоматически получает сообщения на своем языке в персональном, естественном и плавном виде, что облегчает общение между командами.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Мы готовы?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "бесконечность не предел",
    "transLang2": "(EN)",
    "triggersTitle": "Графический редактор и ключевые кадры",
    "triggersDescTitle": "Графический редактор и ключевые кадры",
    "triggersDesc": "Создавайте и настраивайте оповещения и триггеры в мощном графическом редакторе.\n\nДобавляйте ключевые кадры, задавайте значения и выбирайте типы кривых для точной настройки каждой автоматизации.",
    "filtrosTitle": "Динамические фильтры",
    "filtrosDescTitle": "Динамические фильтры",
    "filtrosDesc": "Мгновенно переключайтесь между всеми сообщениями, отдельными категориями или их комбинациями с помощью настраиваемых фильтров.\n\nНаходите и просматривайте именно ту информацию, которая вам нужна.",
    "filterAll": "ВСЕ",
    "filterProd": "ПРОДАКШН",
    "filterLuz": "СВЕТ / FX",
    "filterSonido": "ЗВУК",
    "filterMsg1": "Начинаем шоу через 5 минут",
    "filterMsg2": "Основной прожектор в неоново-синем готов",
    "filterMsg3": "Звучит вступительная музыка",
    "protocolosTitle": "Управление в чате и внешними системами",
    "protocolosDescTitle": "Управление в чате и внешними системами",
    "protocolosDesc": "Принимайте таймкод SMPTE LTC и управляйте другими системами с помощью динамического переключения по протоколам OSC, MIDI и sACN.\n\nЗапускайте сигналы и автоматизацию в стороннем ПО и оборудовании прямо из системы.",
    "alertasTitle": "Мультисенсорные оповещения",
    "alertasDescTitle": "Мультисенсорные оповещения",
    "alertasDesc": "Создавайте богатые сценарии оповещений, комбинируя различные стимулы.\n\nНастраивайте визуальные эффекты на экране (цвет и прозрачность), тактильную вибрацию и вспышки фонарика на поддерживаемых устройствах.",
    "alertRow1Title": "Экранные оповещения",
    "alertRow1Sub": "Анимация цвета и прозрачности",
    "alertRow2Title": "Вибрация",
    "alertRow2Sub": "Ритмичный тактильный рисунок",
    "alertRow3Title": "Фонарик",
    "alertRow3Sub": "Последовательность светодиодных вспышек",
    "triggerInOutTitle": "Триггеры Входа/Выхода",
    "triggerInOutDescTitle": "Триггеры Входа/Выхода",
    "triggerInOutDesc": "Управляйте входными и выходными триггерами для связи событий, автоматизаций и действий между системами.\n\nОпределяйте время и условия запуска каждого триггера для полного контроля над процессом.",
    "searchPlaceholder": "Поиск триггера...",
    "savedTriggersLabel": "ТРИГГЕРЫ (15)",
    "addTriggerBtn": "+ Добавить триггер",
    "motoresTitle": "Расширенный перевод",
    "motoresDescTitle": "Расширенный перевод",
    "motoresDesc": "Настраивайте автоматический перевод под задачи любого проекта.\n\nВы можете показывать или скрывать оригинал, фильтровать входящие языки и управлять словарем защищенных слов для сохранения терминологии.",
    "idiomaVozTitle": "Пользовательские словари",
    "idiomaVozDescTitle": "Пользовательские словари",
    "idiomaVozDesc": "Добавляйте специфические термины, имена и слова для повышения точности распознавания речи.\n\nДля каждого языка можно настроить свой словарь.",
    "motoresVozElasticosTitle": "Гибкие голосовые движки",
    "motoresVozElasticosDescTitle": "Гибкие голосовые движки",
    "motoresVozElasticosDesc": "Управляйте различными движками ИИ для обработки речи.\n\nДвижки могут запускаться локально и офлайн на вашем устройстве, обеспечивая полный контроль над обработкой и конфиденциальностью данных.",
    "modosAudioTitle": "Режимы аудио",
    "modosAudioDescTitle": "Режимы аудио",
    "modosAudioDesc": "Выберите один из двух режимов: PTT (рация) или Автоматический.\n\nPTT: удерживайте кнопку для передачи аудио.\n\nАвтоматический: задайте порог громкости, чтобы микрофон включался автоматически при обнаружении голоса.",
    "statusSilence": "ТИШИНА",
    "statusTalking": "РАЗГОВОР",
    "pttHold": "УДЕРЖИВАЙТЕ ДЛЯ СВЯЗИ",
    "pttSpeaking": "РАЗГОВОР...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "АВТОМАТИЧЕСКИЙ",
    "optPttText": "Push-to-Talk (удерживать)",
    "optAutoText": "Автоматический (по громкости)",
    "headerMotorIA": "Движок ИИ-перевода",
    "labelTradAuto": "АВТОМАТИЧЕСКИЙ ПЕРЕВОД",
    "descTradAuto": "Переводит чат на язык интерфейса.",
    "labelMsgOrig": "ОРИГИНАЛЬНОЕ СООБЩЕНИЕ",
    "descMsgOrig": "Показывает исходный текст под переводом.",
    "titleIncomingFilter": "ФИЛЬТР ВХОДЯЩИХ ЯЗЫКОВ",
    "descIncomingFilter": "Выберите языки для перевода. Невыбранные будут показаны без изменений.",
    "titleProtectedWords": "ЗАЩИЩЕННЫЕ СЛОВА (ТЕРМИНЫ)",
    "descProtectedWords": "Эти слова НИКОГДА не будут переводиться ИИ (например: Standby, Fader).",
    "phProtectWord": "Слово для защиты...",
    "headerIdiomaVoz": "Язык и голос",
    "titleUiLang": "ЯЗЫК ИНТЕРФЕЙСА",
    "titleSttTranscription": "ИИ-ТРАНСКРИПЦИЯ (RU)",
    "descSttTranscription": "Добавьте сложные слова для повышения точности",
    "phSttBad": "Слышит как...",
    "phSttGood": "Заменять на...",
    "labelStoragePath": "Путь к моделям",
    "btnSelectStorage": "Обзор...",
    "phSearchLang": "Поиск языка...",
    "labelMicMode": "РЕЖИМ МИКРОФОНА",
    "labelInputLevel": "УРОВЕНЬ ВХОДА",
    "btnInstalled": "УСТАНОВЛЕНО",
    "btnDownload": "Скачать",
    "btnCancel": "✕ Отмена",
    "inputDevice": "Устройство ввода",
    "channel": "Канал",
    "inputPort": "Порт ввода",
    "oscActiveMsg": "Активное OSC сообщение",
    "noteTriggered": "Нота задействована",
    "labelTag": "МЕТКА",
    "labelTimeMs": "ВРЕМЯ (МС)",
    "labelValue": "ЗНАЧЕНИЕ",
    "labelCurveNext": "СЛЕД. КРИВАЯ",
    "labelHoldTime": "ВРЕМЯ УДЕРЖАНИЯ",
    "labelKfOrder": "ПОРЯДОК КЛЮЧЕВЫХ КАДРОВ",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "оригинальный звук",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "ВХОД АУДИО SMPTE",
    "lblChannel": "CHANNEL",
    "lblStartTime": "ВРЕМЯ НАЧАЛА",
    "lblEndTime": "ВРЕМЯ ОКОНЧАНИЯ",
    "lblLtcLive": "LTC В РЕАЛЬНОМ ВРЕМЕНИ",
    "lblUniversoDmx": "ВСЕЛЕННАЯ DMX",
    "lblCanalInicio": "НАЧАЛЬНЫЙ КАНАЛ",
    "lblValorDmxLive": "ЗНАЧЕНИЕ DMX В РЕАЛЬНОМ ВРЕМЕНИ",
    "tabOut": "↑ ВЫХОД (OUT)",
    "tabIn": "↓ ВХОД (IN)",
    "tabTimeCode": "Таймкод",
    "lblDuration": "Длительность"
  },
  "nl": {
    "transcripcionTitle": "Audio en transcriptie",
    "transcripcionDescTitle": "Audio en transcriptie",
    "transcripcionDesc": "Spreek en verzend audio in realtime naar alle gebruikers. Ondertussen verwerkt de lokale kunstmatige intelligentie je stem en taal om deze om te zetten in tekst en direct in de chat te tonen.",
    "userJorge": "Joris",
    "userSofia": "Sofie",
    "userCarlos": "Karel",
    "categoryProd": "PRODUCTIE",
    "categoryLuz": "LICHT / FX",
    "categorySonido": "GELUID",
    "msgHolaMundo": "Hallo Wereld",
    "placeholderText": "Typ je bericht...",
    "chunks": [
      "ha",
      "Hallo",
      "Hallo We...",
      "Hallo Wereld"
    ],
    "traduccionTitle": "Automatische en vloeiende vertaling",
    "traduccionDescTitle": "Automatische en vloeiende vertaling",
    "traduccionDesc": "Elke gebruiker ontvangt automatisch berichten in zijn eigen taal, op een gepersonaliseerde, natuurlijke en vloeiende manier, wat de communicatie tussen teams vergemakkelijkt.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Zijn we er klaar voor?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "tot in het oneindige en erbij buiten",
    "transLang2": "(EN)",
    "triggersTitle": "Grafische editor en Keyframes",
    "triggersDescTitle": "Grafische editor en Keyframes",
    "triggersDesc": "Maak en pas waarschuwingen en triggers aan vanuit een krachtige grafische editor.\n\nVoeg keyframes toe, label ze, wijs waarden toe en kies verschillende curvetypen om elke automatisering nauwkeurig te ontwerpen.",
    "filtrosTitle": "Dynamische filters",
    "filtrosDescTitle": "Dynamische filters",
    "filtrosDesc": "Schakel direct tussen alle berichten, individuele categorieën of aangepaste combinaties.\n\nVind en bekijk precies de informatie die je op elk moment nodig hebt.",
    "filterAll": "ALLES",
    "filterProd": "PRODUCTIE",
    "filterLuz": "LICHT / FX",
    "filterSonido": "GELUID",
    "filterMsg1": "We beginnen de show over 5 minuten",
    "filterMsg2": "Hoofdspot in neonblauw gereed",
    "filterMsg3": "Intromuziek speelt",
    "protocolosTitle": "Besturing in chat en extern",
    "protocolosDescTitle": "Besturing in chat en extern",
    "protocolosDesc": "Ontvang SMPTE LTC Timecode en bestuur andere systemen via dynamische omschakeling via protocollen zoals OSC, MIDI en sACN.\n\nActiveer signalen en automatiseringen in andere software en apparaten rechtstreeks vanuit het systeem.",
    "alertasTitle": "Multisensorische waarschuwingen",
    "alertasDescTitle": "Multisensorische waarschuwingen",
    "alertasDesc": "Creëer rijkere waarschuwingservaringen door verschillende prikkels te combineren.\n\nConfigureer visuele patronen op het scherm (kleur en transparantie), haptische trillingen en flitsersequenties op compatibele apparaten.",
    "alertRow1Title": "Schermwaarschuwingen",
    "alertRow1Sub": "Kleur- en transparantie-animatie",
    "alertRow2Title": "Trilling",
    "alertRow2Sub": "Ritmisch haptisch patroon",
    "alertRow3Title": "Zaklamp",
    "alertRow3Sub": "LED-flitsreeks",
    "triggerInOutTitle": "In/Out Triggers",
    "triggerInOutDescTitle": "In/Out Triggers",
    "triggerInOutDesc": "Beheer in- en uitgangstriggers om gebeurtenissen, automatiseringen en acties tussen verschillende systemen te verbinden.\n\nBepaal wanneer en hoe elke trigger moet worden uitgevoerd.",
    "searchPlaceholder": "Trigger zoeken...",
    "savedTriggersLabel": "TRIGGERS (15)",
    "addTriggerBtn": "+ Trigger toevoegen",
    "motoresTitle": "Geavanceerde vertaling",
    "motoresDescTitle": "Geavanceerde vertaling",
    "motoresDesc": "Configureer automatische vertaling volgens de behoeften van elk project.\n\nJe kunt het originele bericht tonen of verbergen, inkomende talen filteren en een woordenboek met beschermde woorden beheren.",
    "idiomaVozTitle": "Aangepaste woordenboeken",
    "idiomaVozDescTitle": "Aangepaste woordenboeken",
    "idiomaVozDesc": "Voeg specifieke termen of woorden toe om de nauwkeurigheid van de transcriptie te verbeteren.\n\nElke taal kan over een eigen aangepast woordenboek beschikken.",
    "motoresVozElasticosTitle": "Flexibele stemmotoren",
    "motoresVozElasticosDescTitle": "Flexibele stemmotoren",
    "motoresVozElasticosDesc": "Beheer de verschillende AI-motoren die verantwoordelijk zijn voor stemverwerking.\n\nDe motoren kunnen lokaal en offline op je apparaat worden uitgevoerd, wat totale controle biedt over verwerking en privacy.",
    "modosAudioTitle": "Audiomodi",
    "modosAudioDescTitle": "Audiomodi",
    "modosAudioDesc": "Kies uit twee modi: PTT (Push-to-Talk) of Automatisch.\n\nPTT (Push-to-Talk): houd de knop ingedrukt om audio te verzenden.\n\nAutomatisch: stel een drempelwaarde in zodat de microfoon automatisch wordt geactiveerd bij stemdetectie.",
    "statusSilence": "STILTE",
    "statusTalking": "SPREKEND",
    "pttHold": "INGEDRUKT HOUDEN OM TE SPREKEN",
    "pttSpeaking": "SPREKEND...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "AUTOMATISCH",
    "optPttText": "Push-to-Talk (vasthouden)",
    "optAutoText": "Automatisch (op volume)",
    "headerMotorIA": "AI Vertaalengine",
    "labelTradAuto": "AUTOMATISCHE VERTALING",
    "descTradAuto": "Vertaalt de chat naar je interfacespaak.",
    "labelMsgOrig": "ORIGINEEL BERICHT",
    "descMsgOrig": "Toont de originele tekst onder de vertaling.",
    "titleIncomingFilter": "INKOMEND TAALFILTER",
    "descIncomingFilter": "Selecteer inkomende talen om te vertalen. Niet-geselecteerde blijven ongewijzigd.",
    "titleProtectedWords": "BESCHERMDE WOORDEN (JARGON)",
    "descProtectedWords": "Deze woorden worden NOOIT door AI vertaald (bijv. Standby, Fader).",
    "phProtectWord": "Te beschermen woord...",
    "headerIdiomaVoz": "Taal & Stem",
    "titleUiLang": "INTERFACETAAL",
    "titleSttTranscription": "AI TRANSCRIPTIE (NL)",
    "descSttTranscription": "Voeg moeilijke woorden toe voor betere nauwkeurigheid",
    "phSttBad": "Begrijpt als...",
    "phSttGood": "Corrigeer naar...",
    "labelStoragePath": "Opslagpad voor modellen",
    "btnSelectStorage": "Bladeren...",
    "phSearchLang": "Taal zoeken...",
    "labelMicMode": "MICROFOONMODUS",
    "labelInputLevel": "INGANGSNIVEAU",
    "btnInstalled": "GEÏNSTALLEERD",
    "btnDownload": "Downloaden",
    "btnCancel": "✕ Annuleren",
    "inputDevice": "Invoerapparaat",
    "channel": "Kanaal",
    "inputPort": "Invoerpoort",
    "oscActiveMsg": "Actief OSC-bericht",
    "noteTriggered": "Noot geactiveerd",
    "labelTag": "TAG",
    "labelTimeMs": "TIJD (MS)",
    "labelValue": "WAARDE",
    "labelCurveNext": "VOLGENDE CURVE",
    "labelHoldTime": "VASHTOUDTIJD",
    "labelKfOrder": "KEYFRAME VOLGORDE",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "originele audio",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "SMPTE AUDIO-INGANG",
    "lblChannel": "CHANNEL",
    "lblStartTime": "STARTTIJD",
    "lblEndTime": "EINDTIJD",
    "lblLtcLive": "LTC LIVE",
    "lblUniversoDmx": "DMX-UNIVERSUM",
    "lblCanalInicio": "STARTKANAAL",
    "lblValorDmxLive": "LIVE DMX-WAARDE",
    "tabOut": "↑ UITGANG (OUT)",
    "tabIn": "↓ INGANG (IN)",
    "tabTimeCode": "Tijdcode",
    "lblDuration": "Duur"
  },
  "pl": {
    "transcripcionTitle": "Audio i transkrypcja",
    "transcripcionDescTitle": "Audio i transkrypcja",
    "transcripcionDesc": "Mów i przesyłaj dźwięk w czasie rzeczywistym do wszystkich użytkowników. W międzyczasie lokalna sztuczna inteligencja przetwarza Twój głos i język, konwertując go na tekst i wyświetlając bezpośrednio na czacie.",
    "userJorge": "Jerzy",
    "userSofia": "Zofia",
    "userCarlos": "Karol",
    "categoryProd": "PRODUKCJA",
    "categoryLuz": "ŚWIATŁO / FX",
    "categorySonido": "DŹWIĘK",
    "msgHolaMundo": "Witaj Świecie",
    "placeholderText": "Wpisz swoją wiadomość...",
    "chunks": [
      "wi",
      "Witaj",
      "Witaj Świ...",
      "Witaj Świecie"
    ],
    "traduccionTitle": "Automatyczne i płynne tłumaczenie",
    "traduccionDescTitle": "Automatyczne i płynne tłumaczenie",
    "traduccionDesc": "Każdy użytkownik automatycznie otrzymuje wiadomości w swoim języku w spersonalizowany, naturalny i płynny sposób, co ułatwia komunikację w zespole.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Czy jesteśmy gotowi?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "do nieskończonoci i jeszcze dalej",
    "transLang2": "(EN)",
    "triggersTitle": "Edytor graficzny i klatki kluczowe",
    "triggersDescTitle": "Edytor graficzny i klatki kluczowe",
    "triggersDesc": "Twórz i dostosowuj alerty oraz wyzwalacze w potężnym edytorze graficznym.\n\nDodawaj klatki kluczowe, etykietuj je, przypisuj wartości i wybieraj typy krzywych.",
    "filtrosTitle": "Filtry dynamiczne",
    "filtrosDescTitle": "Filtry dynamiczne",
    "filtrosDesc": "Błyskawicznie przełączaj się między wszystkimi wiadomościami, poszczególnymi kategoriami lub ich kombinacjami.",
    "filterAll": "WSZYSTKIE",
    "filterProd": "PRODUKCJA",
    "filterLuz": "ŚWIATŁO / FX",
    "filterSonido": "DŹWIĘK",
    "filterMsg1": "Zaczynamy show za 5 minut",
    "filterMsg2": "Główny reflektor w kolorze neonowego błękitu gotowy",
    "filterMsg3": "Gra muzyka wstępna",
    "protocolosTitle": "Sterowanie w czacie i zewnętrzne",
    "protocolosDescTitle": "Sterowanie w czacie i zewnętrzne",
    "protocolosDesc": "Odbieraj Timecode SMPTE LTC i steruj innymi systemami za pomocą dynamicznego przełączania przez protokoły takie jak OSC, MIDI i sACN.",
    "alertasTitle": "Alerty multisensoryczne",
    "alertasDescTitle": "Alerty multisensoryczne",
    "alertasDesc": "Twórz bogatsze alerty, łącząc różne bodźce: wzrokowe, wibracje haptyczne i sekwencje latarki LED.",
    "alertRow1Title": "Alerty ekranowe",
    "alertRow1Sub": "Animacja koloru i przezroczystości",
    "alertRow2Title": "Wibracje",
    "alertRow2Sub": "Rytmiczny wzór haptyczny",
    "alertRow3Title": "Latarka",
    "alertRow3Sub": "Sekwencja błysków LED",
    "triggerInOutTitle": "Wyzwalacze Wejścia/Wyjścia",
    "triggerInOutDescTitle": "Wyzwalacze Wejścia/Wyjścia",
    "triggerInOutDesc": "Zarządzaj wyzwalaczami wejściowymi i wyjściowymi, aby łączyć zdarzenia i automatyzacje między systemami.",
    "searchPlaceholder": "Szukaj wyzwalacza...",
    "savedTriggersLabel": "WYZWALACZE (15)",
    "addTriggerBtn": "+ Dodaj wyzwalacz",
    "motoresTitle": "Zaawansowane tłumaczenie",
    "motoresDescTitle": "Zaawansowane tłumaczenie",
    "motoresDesc": "Skonfiguruj automatyczne tłumaczenie według potrzeb projektu. Możesz ukrywać oryginał i zarządzać słownikiem chronionym.",
    "idiomaVozTitle": "Słowniki dostosowane",
    "idiomaVozDescTitle": "Słowniki dostosowane",
    "idiomaVozDesc": "Dodawaj specyficzne terminy, aby poprawić dokładność transkrypcji.",
    "motoresVozElasticosTitle": "Elastyczne silniki głosowe",
    "motoresVozElasticosDescTitle": "Elastyczne silniki głosowe",
    "motoresVozElasticosDesc": "Zarządzaj silnikami AI odpowiedzialnymi za przetwarzanie mowy. Działają lokalnie i offline, zapewniając pełną kontrolę i prywatność.",
    "modosAudioTitle": "Tryby audio",
    "modosAudioDescTitle": "Tryby audio",
    "modosAudioDesc": "Wybierz jeden z dwóch trybów: PTT (Naciśnij i mów) lub Automatyczny.",
    "statusSilence": "CISZA",
    "statusTalking": "MÓWIENIE",
    "pttHold": "PRZYTRZYMAJ, ABY MÓWIĆ",
    "pttSpeaking": "MÓWIENIE...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "AUTOMATYCZNY",
    "optPttText": "Push-to-Talk (przytrzymaj)",
    "optAutoText": "Automatyczny (głośność)",
    "headerMotorIA": "Silnik Tłumaczenia AI",
    "labelTradAuto": "AUTOMATYCZNE TŁUMACZENIE",
    "descTradAuto": "Tłumaczy czat na język interfejsu.",
    "labelMsgOrig": "ORYGINALNA WIADOMOŚĆ",
    "descMsgOrig": "Pokazuje tekst oryginalny pod tłumaczeniem.",
    "titleIncomingFilter": "FILTR JĘZYKÓW WEJŚCIOWYCH",
    "descIncomingFilter": "Wybierz języki do tłumaczenia.",
    "titleProtectedWords": "CHRONIONE SŁOWA (JĘZYK TECHNICZNY)",
    "descProtectedWords": "Te słowa NIGDY nie będą tłumaczone przez AI.",
    "phProtectWord": "Słowo do ochrony...",
    "headerIdiomaVoz": "Język i Głos",
    "titleUiLang": "JĘZYK INTERFEJSU",
    "titleSttTranscription": "TRANSKRYPCJA AI (PL)",
    "descSttTranscription": "Dodaj trudne słowa dla większej dokładności",
    "phSttBad": "Rozumie jako...",
    "phSttGood": "Popraw na...",
    "labelStoragePath": "Ścieżka przechowywania modeli",
    "btnSelectStorage": "Przeglądaj...",
    "phSearchLang": "Szukaj języka...",
    "labelMicMode": "TRYB MIKROFONU",
    "labelInputLevel": "POZIOM WEJŚCIA",
    "btnInstalled": "ZAINSTALOWANO",
    "btnDownload": "Pobierz",
    "btnCancel": "✕ Anuluj",
    "inputDevice": "Urządzenie wejściowe",
    "channel": "Kanał",
    "inputPort": "Port wejściowy",
    "oscActiveMsg": "Aktywna wiadomość OSC",
    "noteTriggered": "Nuta wyzwolona",
    "labelTag": "ETYKIETA",
    "labelTimeMs": "CZAS (MS)",
    "labelValue": "WARTOŚĆ",
    "labelCurveNext": "NAST. KRZYWA",
    "labelHoldTime": "CZAS PRZYTRZYMANIA",
    "labelKfOrder": "KOLEJNOŚĆ KLATEK KLUCZOWYCH",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "oryginalny dźwięk",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "WEJŚCIE AUDIO SMPTE",
    "lblChannel": "CHANNEL",
    "lblStartTime": "CZAS ROZPOCZĘCIA",
    "lblEndTime": "CZAS ZAKOŃCZENIA",
    "lblLtcLive": "LTC NA ŻYWO",
    "lblUniversoDmx": "UNIWERSUM DMX",
    "lblCanalInicio": "KANAŁ POCZĄTKOWY",
    "lblValorDmxLive": "WARTOŚĆ DMX NA ŻYWO",
    "tabOut": "↑ WYJŚCIE (OUT)",
    "tabIn": "↓ WEJŚCIE (IN)",
    "tabTimeCode": "Kod Czasowy",
    "lblDuration": "Czas trwania"
  },
  "tr": {
    "transcripcionTitle": "Ses ve Deşifre",
    "transcripcionDescTitle": "Ses ve Deşifre",
    "transcripcionDesc": "Tüm kullanıcılara gerçek zamanlı ses iletin. Bu sırada yerel yapay zeka sesinizi metne dönüştürüp sohbette gösterir.",
    "userJorge": "Gökhan",
    "userSofia": "Sofya",
    "userCarlos": "Kaan",
    "categoryProd": "ÜRETİM",
    "categoryLuz": "IŞIK / FX",
    "categorySonido": "SES",
    "msgHolaMundo": "Merhaba Dünya",
    "placeholderText": "Mesajınızı yazın...",
    "chunks": [
      "mer",
      "Merhaba",
      "Merhaba Dü...",
      "Merhaba Dünya"
    ],
    "traduccionTitle": "Otomatik ve Akıcı Çeviri",
    "traduccionDescTitle": "Otomatik ve Akıcı Çeviri",
    "traduccionDesc": "Her kullanıcı mesajları kendi dilinde otomatik, kişiselleştirilmiş ve doğal bir şekilde alır.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Hazır mıyız?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "sonsuzluğa ve ötesine",
    "transLang2": "(EN)",
    "triggersTitle": "Grafik Düzenleyici ve Anahtar Kareler",
    "triggersDescTitle": "Grafik Düzenleyici ve Anahtar Kareler",
    "triggersDesc": "Güçlü bir grafik düzenleyicide uyarıları ve tetikleyicileri özelleştirin.",
    "filtrosTitle": "Dinamik Filtreler",
    "filtrosDescTitle": "Dinamik Filtreler",
    "filtrosDesc": "Tüm mesajlar ve kategoriler arasında anında geçiş yapın.",
    "filterAll": "TÜMÜ",
    "filterProd": "ÜRETİM",
    "filterLuz": "IŞIK / FX",
    "filterSonido": "SES",
    "filterMsg1": "Gösteri 5 dakika içinde başlıyor",
    "filterMsg2": "Neon mavi ana spot hazır",
    "filterMsg3": "Giriş müziği çalıyor",
    "protocolosTitle": "Sohbet İçi ve Dış Kontrol",
    "protocolosDescTitle": "Sohbet İçi ve Dış Kontrol",
    "protocolosDesc": "SMPTE LTC Timecode alın ve OSC, MIDI, sACN gibi protokollerle diğer sistemleri kontrol edin.",
    "alertasTitle": "Çok Duyulu Uyarılar",
    "alertasDescTitle": "Çok Duyulu Uyarılar",
    "alertasDesc": "Görsel desenler, titreşim ve LED flaş dizileriyle zengin uyarı deneyimleri oluşturun.",
    "alertRow1Title": "Ekran Uyarıları",
    "alertRow1Sub": "Renk ve opaklık animasyonu",
    "alertRow2Title": "Titreşim",
    "alertRow2Sub": "Ritmik dokunsal desen",
    "alertRow3Title": "Flaş",
    "alertRow3Sub": "LED flaş dizisi",
    "triggerInOutTitle": "Giriş/Çıkış Tetikleyicileri",
    "triggerInOutDescTitle": "Giriş/Çıkış Tetikleyicileri",
    "triggerInOutDesc": "Sistemler arası olayları bağlamak için giriş ve çıkış tetikleyicilerini yönetin.",
    "searchPlaceholder": "Tetikleyici ara...",
    "savedTriggersLabel": "TETİKLEYİCİLER (15)",
    "addTriggerBtn": "+ Tetikleyici Ekle",
    "motoresTitle": "Gelişmiş Çeviri",
    "motoresDescTitle": "Gelişmiş Çeviri",
    "motoresDesc": "Otomatik çeviriyi projenize göre yapılandırın. Korunan kelimeler sözlüğünü yönetin.",
    "idiomaVozTitle": "Özel Sözlükler",
    "idiomaVozDescTitle": "Özel Sözlükler",
    "idiomaVozDesc": "Deşifre doğruluğunu artırmak için özel terimler ekleyin.",
    "motoresVozElasticosTitle": "Esnek Ses Motorları",
    "motoresVozElasticosDescTitle": "Esnek Ses Motorları",
    "motoresVozElasticosDesc": "Ses işleminden sorumlu yapay zeka motorlarını yönetin. Cihazınızda çevrimdışı çalışarak tam kontrol sağlar.",
    "modosAudioTitle": "Ses Modları",
    "modosAudioDescTitle": "Ses Modları",
    "modosAudioDesc": "PTT (Bas-Konuş) veya Otomatik mod arasında seçim yapın.",
    "statusSilence": "SESSİZ",
    "statusTalking": "KONUŞUYOR",
    "pttHold": "KONUŞMAK İÇİN BASILI TUTUN",
    "pttSpeaking": "KONUŞUYOR...",
    "tagPtt": "BAS-KONUŞ",
    "tagAuto": "OTOMATİK",
    "optPttText": "Bas-Konuş (basılı tut)",
    "optAutoText": "Otomatik (sese duyarlı)",
    "headerMotorIA": "Yapay Zeka Çeviri Motoru",
    "labelTradAuto": "OTOMATİK ÇEVİRİ",
    "descTradAuto": "Sohbeti arayüz dilinize çevirir.",
    "labelMsgOrig": "ORİJİNAL MESAJ",
    "descMsgOrig": "Çevirinin altında orijinal metni gösterir.",
    "titleIncomingFilter": "GELEN DİL FİLTRESİ",
    "descIncomingFilter": "Çevrilecek gelen dilleri seçin.",
    "titleProtectedWords": "KORUNAN KELİMELER (TEKNİK TERİMLER)",
    "descProtectedWords": "Bu kelimeler ASLA yapay zeka tarafından çevrilmez.",
    "phProtectWord": "Korunacak kelime...",
    "headerIdiomaVoz": "Dil ve Ses",
    "titleUiLang": "ARAYÜZ DİLİ",
    "titleSttTranscription": "YAPAY ZEKA DEŞİFRE (TR)",
    "descSttTranscription": "Doğruluğu artırmak için zor kelimeler ekleyin",
    "phSttBad": "Şöyle anlar...",
    "phSttGood": "Şuna düzelt...",
    "labelStoragePath": "Model depolama yolu",
    "btnSelectStorage": "Gözat...",
    "phSearchLang": "Dil ara...",
    "labelMicMode": "MİKROFON MODU",
    "labelInputLevel": "GİRİŞ SEVİYESİ",
    "btnInstalled": "YÜKLENDİ",
    "btnDownload": "İndir",
    "btnCancel": "✕ İptal",
    "inputDevice": "Giriş Cihazı",
    "channel": "Kanal",
    "inputPort": "Giriş Portu",
    "oscActiveMsg": "Aktif OSC Mesajı",
    "noteTriggered": "Tetiklenen Nota",
    "labelTag": "ETİKET",
    "labelTimeMs": "SÜRE (MS)",
    "labelValue": "DEĞER",
    "labelCurveNext": "SONRAKİ EĞRİ",
    "labelHoldTime": "BEKLEME SÜRESİ",
    "labelKfOrder": "ANAHTAR KARE SIRASI",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "orijinal ses",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "SMPTE SES GİRİŞİ",
    "lblChannel": "CHANNEL",
    "lblStartTime": "BAŞLANGIÇ ZAMANI",
    "lblEndTime": "BİTİŞ ZAMANI",
    "lblLtcLive": "LTC CANLI",
    "lblUniversoDmx": "DMX EVRENİ",
    "lblCanalInicio": "BAŞLANGIÇ KANALI",
    "lblValorDmxLive": "CANLI DMX DEĞERİ",
    "tabOut": "↑ ÇIKIŞ (OUT)",
    "tabIn": "↓ GİRİŞ (IN)",
    "tabTimeCode": "Zaman Kodu",
    "lblDuration": "Süre"
  },
  "cs": {
    "transcripcionTitle": "Zvuk a transkripce",
    "transcripcionDescTitle": "Zvuk a transkripce",
    "transcripcionDesc": "Mluvte a přenášejte zvuk v reálném čase všem uživatelům. Lokální AI mezitím převádí váš hlas na text přímo do chatu.",
    "userJorge": "Jiří",
    "userSofia": "Sofie",
    "userCarlos": "Karel",
    "categoryProd": "PRODUKCE",
    "categoryLuz": "SVĚTLA / FX",
    "categorySonido": "ZVUK",
    "msgHolaMundo": "Ahoj světe",
    "placeholderText": "Napište zprávu...",
    "chunks": [
      "ahoj",
      "Ahoj",
      "Ahoj svě...",
      "Ahoj světe"
    ],
    "traduccionTitle": "Automatický a plynulý překlad",
    "traduccionDescTitle": "Automatický a plynulý překlad",
    "traduccionDesc": "Každý uživatel dostává zprávy automaticky ve svém jazyce přirozeným způsobem.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Jsme připraveni?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "do nekonečna a ještě dál",
    "transLang2": "(EN)",
    "triggersTitle": "Grafický editor a klíčové snímky",
    "triggersDescTitle": "Grafický editor a klíčové snímky",
    "triggersDesc": "Vytvářejte a upravujte upozornění a spouštěče v výkonném grafickém editoru.",
    "filtrosTitle": "Dynamické filtry",
    "filtrosDescTitle": "Dynamické filtry",
    "filtrosDesc": "Okamžitě přepínejte mezi všemi zprávami a jednotlivými kategoriemi.",
    "filterAll": "VŠECHNY",
    "filterProd": "PRODUKCE",
    "filterLuz": "SVĚTLA / FX",
    "filterSonido": "ZVUK",
    "filterMsg1": "Začínáme show za 5 minut",
    "filterMsg2": "Hlavní reflektor v neonově modré připraven",
    "filterMsg3": "Hraje úvodní hudba",
    "protocolosTitle": "Ovládání v chatu i externě",
    "protocolosDescTitle": "Ovládání v chatu i externě",
    "protocolosDesc": "Přijímejte SMPTE LTC Timecode a ovládejte další systémy přes OSC, MIDI a sACN.",
    "alertasTitle": "Multisenzorická upozornění",
    "alertasDescTitle": "Multisenzorická upozornění",
    "alertasDesc": "Kombinujte vizuální efekty, vibrace a sekvence LED svítilny.",
    "alertRow1Title": "Upozornění na obrazovce",
    "alertRow1Sub": "Animace barev a průhlednosti",
    "alertRow2Title": "Vibrace",
    "alertRow2Sub": "Rytmický haptický vzor",
    "alertRow3Title": "Svítilna",
    "alertRow3Sub": "Sekvence LED blikání",
    "triggerInOutTitle": "Spouštěče Vstup/Výstup",
    "triggerInOutDescTitle": "Spouštěče Vstup/Výstup",
    "triggerInOutDesc": "Spravujte vstupní a výstupní spouštěče pro propojení událostí a automatizací.",
    "searchPlaceholder": "Hledat spouštěč...",
    "savedTriggersLabel": "SPOUŠTĚČE (15)",
    "addTriggerBtn": "+ Přidat spouštěč",
    "motoresTitle": "Pokročilý překlad",
    "motoresDescTitle": "Pokročilý překlad",
    "motoresDesc": "Nakonfigurujte automatický překlad a spravujte slovník chráněných slov.",
    "idiomaVozTitle": "Vlastní slovníky",
    "idiomaVozDescTitle": "Vlastní slovníky",
    "idiomaVozDesc": "Přidejte specifiké výrazy pro zlepšení přesnosti přepisu.",
    "motoresVozElasticosTitle": "Flexibilní hlasové motory",
    "motoresVozElasticosDescTitle": "Flexibilní hlasové motory",
    "motoresVozElasticosDesc": "Spravujte AI motory zpracování hlasu. Běží lokálně a offline na vašem zařízení pro úplnou kontrolu a soukromí.",
    "modosAudioTitle": "Režimy zvuku",
    "modosAudioDescTitle": "Režimy zvuku",
    "modosAudioDesc": "Vyberte si mezi PTT (Stiskni a mluv) nebo Automatickým režimem.",
    "statusSilence": "TICHO",
    "statusTalking": "MLUVÍ",
    "pttHold": "STISKNĚTE A DRŽTE PRO MLUVENÍ",
    "pttSpeaking": "MLUVÍ...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "AUTOMATICKÝ",
    "optPttText": "Push-to-Talk (držet)",
    "optAutoText": "Automatický (hlasitostí)",
    "headerMotorIA": "AI Překladatelský motor",
    "labelTradAuto": "AUTOMATICKÝ PŘEKLAD",
    "descTradAuto": "Překládá chat do jazyka vašeho rozhraní.",
    "labelMsgOrig": "PŮVODNÍ ZPRÁVA",
    "descMsgOrig": "Zobrazuje původní text pod překladem.",
    "titleIncomingFilter": "FILTR PŘÍCHOZÍCH JAZYKŮ",
    "descIncomingFilter": "Vyberte příchozí jazyky k překladu.",
    "titleProtectedWords": "CHRÁNĚNÁ SLOVA (ODBORNÉ VÝRAZY)",
    "descProtectedWords": "Tato slova AI NIKDY nepřekládá.",
    "phProtectWord": "Slovo k ochraně...",
    "headerIdiomaVoz": "Jazyk a Hlas",
    "titleUiLang": "JAZYK ROZHRANÍ",
    "titleSttTranscription": "AI TRANSKRIPCE (CS)",
    "descSttTranscription": "Přidejte obtížná slova pro vyšší přesnost",
    "phSttBad": "Rozumí jako...",
    "phSttGood": "Opravit na...",
    "labelStoragePath": "Cesta k uložení modelů",
    "btnSelectStorage": "Procházet...",
    "phSearchLang": "Hledat jazyk...",
    "labelMicMode": "REŽIM MIKROFONU",
    "labelInputLevel": "VSTUPNÍ ÚROVEŇ",
    "btnInstalled": "NAINSTALOVÁNO",
    "btnDownload": "Stáhnout",
    "btnCancel": "✕ Zrušit",
    "inputDevice": "Vstupní zařízení",
    "channel": "Kanál",
    "inputPort": "Vstupní port",
    "oscActiveMsg": "Aktivní OSC zpráva",
    "noteTriggered": "Spuštěná nota",
    "labelTag": "ŠTÍTEK",
    "labelTimeMs": "ČAS (MS)",
    "labelValue": "HODNOTA",
    "labelCurveNext": "DALŠÍ KŘIVKA",
    "labelHoldTime": "DOBA DRŽENÍ",
    "labelKfOrder": "POŘADÍ KLÍČOVÝCH SNÍMKŮ",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "původní zvuk",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "ZVUKOVÝ VSTUP SMPTE",
    "lblChannel": "CHANNEL",
    "lblStartTime": "ČAS ZAHÁJENÍ",
    "lblEndTime": "ČAS UKONČENÍ",
    "lblLtcLive": "LTC ŽIVĚ",
    "lblUniversoDmx": "VESMÍR DMX",
    "lblCanalInicio": "POCÁTEČNÍ KANÁL",
    "lblValorDmxLive": "ŽIVÁ HODNOTA DMX",
    "tabOut": "↑ VÝSTUP (OUT)",
    "tabIn": "↓ VSTUP (IN)",
    "tabTimeCode": "Časový Kód",
    "lblDuration": "Doba trvání"
  },
  "sv": {
    "transcripcionTitle": "Ljud och transkription",
    "transcripcionDescTitle": "Ljud och transkription",
    "transcripcionDesc": "Tala och överför ljud i realtid till alla användare. Under tiden behandlar lokal AI din röst och ditt språk för att omvandla det till text och visa det direkt i chatten.",
    "userJorge": "Göran",
    "userSofia": "Sofia",
    "userCarlos": "Karl",
    "categoryProd": "PRODUKTION",
    "categoryLuz": "LJUS / FX",
    "categorySonido": "LJUD",
    "msgHolaMundo": "Hej Världen",
    "placeholderText": "Skriv ditt meddelande...",
    "chunks": [
      "hej",
      "Hej",
      "Hej Vär...",
      "Hej Världen"
    ],
    "traduccionTitle": "Automatisk och smidig översättning",
    "traduccionDescTitle": "Automatisk och smidig översättning",
    "traduccionDesc": "Varje användare får automatiskt meddelanden på sitt eget språk på ett personligt, naturligt och smidigt sätt.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Är vi redo?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "mot oändligheten och vidare",
    "transLang2": "(EN)",
    "triggersTitle": "Grafisk redigerare och Keyframes",
    "triggersDescTitle": "Grafisk redigerare och Keyframes",
    "triggersDesc": "Skapa och anpassa larm och triggers från en kraftfull grafisk redigerare.",
    "filtrosTitle": "Dynamiska filter",
    "filtrosDescTitle": "Dynamiska filter",
    "filtrosDesc": "Växla direkt mellan alla meddelanden, enskilda kategorier eller anpassade kombinationer.",
    "filterAll": "ALLA",
    "filterProd": "PRODUKTION",
    "filterLuz": "LJUS / FX",
    "filterSonido": "LJUD",
    "filterMsg1": "Vi startar showen om 5 minuter",
    "filterMsg2": "Huvudstrålkastare i neonblått redo",
    "filterMsg3": "Intromusik spelas",
    "protocolosTitle": "Styrning i chatten och externt",
    "protocolosDescTitle": "Styrning i chatten och externt",
    "protocolosDesc": "Ta emot SMPTE LTC Timecode och styr andra system via dynamisk växling via protokoll som OSC, MIDI och sACN.",
    "alertasTitle": "Multisensoriska larm",
    "alertasDescTitle": "Multisensoriska larm",
    "alertasDesc": "Skapa rikare larmupplevelser genom att kombinera olika stimulanser: visuella mönster, haptisk vibration och LED-blixtsekvenser.",
    "alertRow1Title": "Skärmlarm",
    "alertRow1Sub": "Färg- och opacitetsanimation",
    "alertRow2Title": "Vibration",
    "alertRow2Sub": "Rytmiskt haptiskt mönster",
    "alertRow3Title": "Ficklampa",
    "alertRow3Sub": "LED-blixtsekvens",
    "triggerInOutTitle": "In/Ut Triggers",
    "triggerInOutDescTitle": "In/Ut Triggers",
    "triggerInOutDesc": "Hantera in- och utgångstriggers för att koppla händelser och automatiseringar mellan olika system.",
    "searchPlaceholder": "Sök trigger...",
    "savedTriggersLabel": "TRIGGERS (15)",
    "addTriggerBtn": "+ Lägg till trigger",
    "motoresTitle": "Avancerad översättning",
    "motoresDescTitle": "Avancerad översättning",
    "motoresDesc": "Konfigurera automatisk översättning efter projektets behov och hantera en ordbok med skyddade ord.",
    "idiomaVozTitle": "Anpassade ordböcker",
    "idiomaVozDescTitle": "Anpassade ordböcker",
    "idiomaVozDesc": "Lägg till specifik terminologi för att förbättra transkriptionsnoggrannheten.",
    "motoresVozElasticosTitle": "Flexibla röstmotorer",
    "motoresVozElasticosDescTitle": "Flexibla röstmotorer",
    "motoresVozElasticosDesc": "Hantera AI-röstmotorer lokalt och offline på din enhet för total kontroll och dataskydd.",
    "modosAudioTitle": "Ljudlägen",
    "modosAudioDescTitle": "Ljudlägen",
    "modosAudioDesc": "Välj mellan PTT (Push-to-Talk) eller Automatiskt läge.",
    "statusSilence": "TYSTNAD",
    "statusTalking": "TALAR",
    "pttHold": "HÅLL INNE FÖR ATT TALA",
    "pttSpeaking": "TALAR...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "AUTOMATISK",
    "optPttText": "Push-to-Talk (håll inne)",
    "optAutoText": "Automatiskt (volym styrt)",
    "headerMotorIA": "AI Översättningsmotor",
    "labelTradAuto": "AUTOMATISK ÖVERSÄTTNING",
    "descTradAuto": "Översätter chatten till ditt gränssnittsspråk.",
    "labelMsgOrig": "URSPRUNGLIGT MEDDELANDE",
    "descMsgOrig": "Visar originaltexten under översättningen.",
    "titleIncomingFilter": "INKOMMANDE SPRÅKFILTER",
    "descIncomingFilter": "Välj inkommande språk att översätta.",
    "titleProtectedWords": "SKYDDADE ORD (TEKNISK JARGONG)",
    "descProtectedWords": "Dessa ord översätts ALDRIG av AI.",
    "phProtectWord": "Ord att skydda...",
    "headerIdiomaVoz": "Språk & Röst",
    "titleUiLang": "GRÄNSSNITTSSPRÅK",
    "titleSttTranscription": "AI TRANSKRIPTION (SV)",
    "descSttTranscription": "Lägg till svåra ord för bättre noggrannhet",
    "phSttBad": "Får som...",
    "phSttGood": "Korrigera till...",
    "labelStoragePath": "Lagringssökväg för modeller",
    "btnSelectStorage": "Bläddra...",
    "phSearchLang": "Sök språk...",
    "labelMicMode": "MIKROFONLÄGE",
    "labelInputLevel": "INGÅNGSNIVÅ",
    "btnInstalled": "INSTALLERAD",
    "btnDownload": "Ladda ner",
    "btnCancel": "✕ Avbryt",
    "inputDevice": "Dispositivo de Entrada",
    "channel": "Canal",
    "inputPort": "Puerto de Entrada",
    "oscActiveMsg": "Mensaje OSC Activo",
    "noteTriggered": "Nota Disparada",
    "labelTag": "ETIQUETA",
    "labelTimeMs": "TIEMPO (MS)",
    "labelValue": "VALOR",
    "labelCurveNext": "CURVA A SIG.",
    "labelHoldTime": "HÅLLTID",
    "labelKfOrder": "KEYFRAME-ORDNING",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "originalljud",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "SMPTE-LJUDINGÅNG",
    "lblChannel": "CHANNEL",
    "lblStartTime": "STARTTID",
    "lblEndTime": "SLUTTID",
    "lblLtcLive": "LTC LIVE",
    "lblUniversoDmx": "DMX-UNIVERSUM",
    "lblCanalInicio": "STARTKANAL",
    "lblValorDmxLive": "LIVE DMX-VÄRDE",
    "tabOut": "↑ UTGÅNG (OUT)",
    "tabIn": "↓ INGÅNG (IN)",
    "tabTimeCode": "Tidskod",
    "lblDuration": "Varaktighet"
  },
  "uk": {
    "transcripcionTitle": "Аудіо та транскрипція",
    "transcripcionDescTitle": "Аудіо та транскрипція",
    "transcripcionDesc": "Говоріть та передавайте аудіо в реальному часі всім користувачам. Локальний ШІ перетворює ваш голос на текст і відображає його в чаті.",
    "userJorge": "Георгій",
    "userSofia": "Софія",
    "userCarlos": "Карло",
    "categoryProd": "ПРОДАКШН",
    "categoryLuz": "СВІТЛО / FX",
    "categorySonido": "ЗВУК",
    "msgHolaMundo": "Привіт Світ",
    "placeholderText": "Введіть повідомлення...",
    "chunks": [
      "привіт",
      "Привіт",
      "Привіт Сві...",
      "Привіт Світ"
    ],
    "traduccionTitle": "Автоматичний та плавний переклад",
    "traduccionDescTitle": "Автоматичний та плавний переклад",
    "traduccionDesc": "Кожен користувач автоматично отримує повідомлення рідною мовою.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Ми готові?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "до нескінченності та далі",
    "transLang2": "(EN)",
    "triggersTitle": "Графічний редактор та ключові кадри",
    "triggersDescTitle": "Графічний редактор та ключові кадри",
    "triggersDesc": "Створюйте та налаштовуйте сповіщення і тригери в потужному графічному редакторі.",
    "filtrosTitle": "Динамічні фільтри",
    "filtrosDescTitle": "Динамічні фільтри",
    "filtrosDesc": "Миттєво перемикайтеся між усіма повідомленнями або окремими категоріями.",
    "filterAll": "ВСІ",
    "filterProd": "ПРОДАКШН",
    "filterLuz": "СВІТЛО / FX",
    "filterSonido": "ЗВУК",
    "filterMsg1": "Починаємо шоу через 5 хвилин",
    "filterMsg2": "Основний прожектор у неоново-синьому готовий",
    "filterMsg3": "Лунає вступна музика",
    "protocolosTitle": "Управління в чаті та зовнішніми системами",
    "protocolosDescTitle": "Управління в чаті та зовнішніми системами",
    "protocolosDesc": "Отримуйте SMPTE LTC Timecode та керуйте іншими системами за протоколами OSC, MIDI та sACN.",
    "alertasTitle": "Мультисенсорні сповіщення",
    "alertasDescTitle": "Мультисенсорні сповіщення",
    "alertasDesc": "Комбінуйте візуальні ефекти, вібрацію та спалахи ліхтарика.",
    "alertRow1Title": "Екранні сповіщення",
    "alertRow1Sub": "Анімація кольору та прозорості",
    "alertRow2Title": "Вібрація",
    "alertRow2Sub": "Ритмічний тактильний візерунок",
    "alertRow3Title": "Ліхтарик",
    "alertRow3Sub": "Послідовність LED спалахів",
    "triggerInOutTitle": "Тригери Входу/Виходу",
    "triggerInOutDescTitle": "Тригери Входу/Виходу",
    "triggerInOutDesc": "Керуйте вхідними та вихідними тригерами для з'єднання подій та автоматизацій.",
    "searchPlaceholder": "Пошук тригера...",
    "savedTriggersLabel": "ТРИГЕРИ (15)",
    "addTriggerBtn": "+ Додати тригер",
    "motoresTitle": "Розширений переклад",
    "motoresDescTitle": "Розширений переклад",
    "motoresDesc": "Налаштовуйте автоматичний переклад та керуйте словником захищених слів.",
    "idiomaVozTitle": "Персональні словники",
    "idiomaVozDescTitle": "Персональні словники",
    "idiomaVozDesc": "Додавайте складні терміни для підвищення точності розпізнавання.",
    "motoresVozElasticosTitle": "Гнучкі голосові двигуни",
    "motoresVozElasticosDescTitle": "Гнучкі голосові двигуни",
    "motoresVozElasticosDesc": "Керуйте двигунами ШІ локально та офлайн для повного контролю та конфіденційності.",
    "modosAudioTitle": "Режими аудіо",
    "modosAudioDescTitle": "Режими аудіо",
    "modosAudioDesc": "Обирайте між PTT (рація) та Автоматичним режимом.",
    "statusSilence": "ТИША",
    "statusTalking": "ГОВОРИТЬ",
    "pttHold": "УТРИМУЙТЕ ДЛЯ РОЗМОВИ",
    "pttSpeaking": "ГОВОРИТЬ...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "АВТОМАТИЧНИЙ",
    "optPttText": "Push-to-Talk (утримувати)",
    "optAutoText": "Автоматичний (за гучністю)",
    "headerMotorIA": "Двигун ШІ-перекладу",
    "labelTradAuto": "АВТОМАТИЧНИЙ ПЕРЕКЛАД",
    "descTradAuto": "Перекладає чат на мову інтерфейсу.",
    "labelMsgOrig": "ОРИГІНАЛЬНЕ ПОВІДОМЛЕННЯ",
    "descMsgOrig": "Показує вихідний текст під перекладом.",
    "titleIncomingFilter": "ФІЛЬТР ВХІДНИХ МОВ",
    "descIncomingFilter": "Оберіть вхідні мови для перекладу.",
    "titleProtectedWords": "ЗАХИЩЕНІ СЛОВА (ТЕРМІНИ)",
    "descProtectedWords": "Ці слова НІКОЛИ не перекладаються ШІ.",
    "phProtectWord": "Слово для захисту...",
    "headerIdiomaVoz": "Мова та Голос",
    "titleUiLang": "МОВА ІНТЕРФЕЙСУ",
    "titleSttTranscription": "ШІ ТРАНСКРИПЦІЯ (UK)",
    "descSttTranscription": "Додайте складні слова для підвищення точності",
    "phSttBad": "Чує як...",
    "phSttGood": "Виправляти на...",
    "labelStoragePath": "Шлях до моделей",
    "btnSelectStorage": "Огляд...",
    "phSearchLang": "Пошук мови...",
    "labelMicMode": "РЕЖИМ МІКРОФОНА",
    "labelInputLevel": "РІВЕНЬ ВХОДУ",
    "btnInstalled": "ВСТАНОВЛЕНО",
    "btnDownload": "Завантажити",
    "btnCancel": "✕ Скасувати",
    "inputDevice": "Dispositivo de Entrada",
    "channel": "Canal",
    "inputPort": "Puerto de Entrada",
    "oscActiveMsg": "Mensaje OSC Activo",
    "noteTriggered": "Nota Disparada",
    "labelTag": "ETIQUETA",
    "labelTimeMs": "TIEMPO (MS)",
    "labelValue": "VALOR",
    "labelCurveNext": "CURVA A SIG.",
    "labelHoldTime": "ЧАС УТРИМАННЯ",
    "labelKfOrder": "ПОРЯДОК КЛЮЧОВИХ КАДРІВ",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "оригінальний звук",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "АУДІОВХІД SMPTE",
    "lblChannel": "CHANNEL",
    "lblStartTime": "ЧАС ПОЧАТКУ",
    "lblEndTime": "ЧАС ЗАВЕРШЕННЯ",
    "lblLtcLive": "LTC НАЖИВО",
    "lblUniversoDmx": "ВСЕСВІТ DMX",
    "lblCanalInicio": "ПОЧАТКОВИЙ КАНАЛ",
    "lblValorDmxLive": "ЗНАЧЕННЯ DMX НАЖИВО",
    "tabOut": "↑ ВИХІД (OUT)",
    "tabIn": "↓ ВХІД (IN)",
    "tabTimeCode": "Таймкод",
    "lblDuration": "Тривалість"
  },
  "hi": {
    "transcripcionTitle": "ऑडियो और प्रतिलेखन",
    "transcripcionDescTitle": "ऑडियो और प्रतिलेखन",
    "transcripcionDesc": "सभी उपयोगकर्ताओं को रीयल-टाइम में ऑडियो प्रसारित करें। स्थानीय एआई आपकी आवाज को पाठ में बदलकर सीधे चैट में दिखाता है।",
    "userJorge": "जॉर्ज",
    "userSofia": "सोफिया",
    "userCarlos": "कार्लोस",
    "categoryProd": "उत्पादन",
    "categoryLuz": "लाइट / FX",
    "categorySonido": "ध्वनि",
    "msgHolaMundo": "नमस्ते दुनिया",
    "placeholderText": "अपना संदेश लिखें...",
    "chunks": [
      "नमस्ते",
      "नमस्ते",
      "नमस्ते दु...",
      "नमस्ते दुनिया"
    ],
    "traduccionTitle": "स्वचालित और सुचारू अनुवाद",
    "traduccionDescTitle": "स्वचालित और सुचारू अनुवाद",
    "traduccionDesc": "प्रत्येक उपयोगकर्ता अपनी भाषा में स्वचालित रूप से संदेश प्राप्त करता है।",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "क्या हम तैयार हैं?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "अनंत और उससे आगे तक",
    "transLang2": "(EN)",
    "triggersTitle": "ग्राफिक एडिटर और कीफ्रेम",
    "triggersDescTitle": "ग्राफिक एडिटर और कीफ्रेम",
    "triggersDesc": "एक शक्तिशाली ग्राफिक एडिटर से अलर्ट और ट्रिगर को कस्टमाइज़ करें।",
    "filtrosTitle": "डायनेमिक फ़िल्टर",
    "filtrosDescTitle": "डायनेमिक फ़िल्टर",
    "filtrosDesc": "सभी संदेशों और व्यक्तिगत श्रेणियों के बीच तुरंत स्विच करें।",
    "filterAll": "सभी",
    "filterProd": "उत्पादन",
    "filterLuz": "लाइट / FX",
    "filterSonido": "ध्वनि",
    "filterMsg1": "शो 5 मिनट में शुरू हो रहा है",
    "filterMsg2": "नियॉन ब्लू में मुख्य स्पॉटलाइट तैयार",
    "filterMsg3": "इंट्रो संगीत बज रहा है",
    "protocolosTitle": "चैट और बाहरी नियंत्रण",
    "protocolosDescTitle": "चैट और बाहरी नियंत्रण",
    "protocolosDesc": "SMPTE LTC Timecode प्राप्त करें और OSC, MIDI और sACN जैसे प्रोटोकॉल से अन्य प्रणालियों को नियंत्रित करें।",
    "alertasTitle": "बहु-संवेदी अलर्ट",
    "alertasDescTitle": "बहु-संवेदी अलर्ट",
    "alertasDesc": "स्क्रीन पैटर्न, कंपन और फ्लैशलाइट अनुक्रमों को मिलाकर समृद्ध अलर्ट अनुभव बनाएं।",
    "alertRow1Title": "स्क्रीन अलर्ट",
    "alertRow1Sub": "रंग और अस्पष्टता एनीमेशन",
    "alertRow2Title": "कंपन",
    "alertRow2Sub": "लयबद्ध हैप्टिक पैटर्न",
    "alertRow3Title": "फ्लैशलाइट",
    "alertRow3Sub": "एलईडी चमक अनुक्रम",
    "triggerInOutTitle": "इन/आउट ट्रिगर",
    "triggerInOutDescTitle": "इन/आउट ट्रिगर",
    "triggerInOutDesc": "विभिन्न प्रणालियों के बीच घटनाओं को जोड़ने के लिए इनपुट और आउटपुट ट्रिगर प्रबंधित करें।",
    "searchPlaceholder": "ट्रिगर खोजें...",
    "savedTriggersLabel": "ट्रिगर (15)",
    "addTriggerBtn": "+ ट्रिगर जोड़ें",
    "motoresTitle": "उन्नत अनुवाद",
    "motoresDescTitle": "उन्नत अनुवाद",
    "motoresDesc": "स्वचालित अनुवाद कॉन्फ़िगर करें और सुरक्षित शब्दों का शब्दकोश प्रबंधित करें।",
    "idiomaVozTitle": "कस्टम शब्दकोश",
    "idiomaVozDescTitle": "कस्टम शब्दकोश",
    "idiomaVozDesc": "सटीकता में सुधार के लिए विशिष्ट शब्द जोड़ें।",
    "motoresVozElasticosTitle": "लचीले वॉयस इंजन",
    "motoresVozElasticosDescTitle": "लचीले वॉयस इंजन",
    "motoresVozElasticosDesc": "पूर्ण नियंत्रण और गोपनीयता के लिए अपने डिवाइस पर स्थानीय रूप से एआई इंजन चलाएं।",
    "modosAudioTitle": "ऑडियो मोड",
    "modosAudioDescTitle": "ऑडियो मोड",
    "modosAudioDesc": "PTT (पुश-टू-टॉक) या स्वचालित मोड के बीच चयन करें।",
    "statusSilence": "शांत",
    "statusTalking": "बोल रहे हैं",
    "pttHold": "बोलने के लिए दबाकर रखें",
    "pttSpeaking": "बोल रहे हैं...",
    "tagPtt": "पुश-टू-टॉक",
    "tagAuto": "स्वचालित",
    "optPttText": "पुश-टू-टॉक (दबाकर रखें)",
    "optAutoText": "स्वचालित (आवाज़ से)",
    "headerMotorIA": "एआई अनुवाद इंजन",
    "labelTradAuto": "स्वचालित अनुवाद",
    "descTradAuto": "चैट को आपकी इंटरफ़ेस भाषा में अनुवाद करता है।",
    "labelMsgOrig": "मूल संदेश",
    "descMsgOrig": "अनुवाद के नीचे मूल पाठ दिखाता है।",
    "titleIncomingFilter": "आने वाली भाषा फ़िल्टर",
    "descIncomingFilter": "अनुवाद करने के लिए आने वाली भाषाएं चुनें।",
    "titleProtectedWords": "संरक्षित शब्द (तकनीकी शब्द)",
    "descProtectedWords": "ये शब्द एआई द्वारा कभी अनुवादित नहीं होंगे।",
    "phProtectWord": "सुरक्षित करने के लिए शब्द...",
    "headerIdiomaVoz": "भाषा और आवाज",
    "titleUiLang": "इंटरफ़ेस भाषा",
    "titleSttTranscription": "एआई प्रतिलेखन (HI)",
    "descSttTranscription": "सटीकता में सुधार के लिए कठिन शब्द जोड़ें",
    "phSttBad": "समझता है...",
    "phSttGood": "सही करें...",
    "labelStoragePath": "मॉडल भंडारण पथ",
    "btnSelectStorage": "ब्राउज़ करें...",
    "phSearchLang": "भाषा खोजें...",
    "labelMicMode": "माइक मोड",
    "labelInputLevel": "इनपुट स्तर",
    "btnInstalled": "स्थापित",
    "btnDownload": "डाउनलोड",
    "btnCancel": "✕ रद्द करें",
    "inputDevice": "Dispositivo de Entrada",
    "channel": "Canal",
    "inputPort": "Puerto de Entrada",
    "oscActiveMsg": "Mensaje OSC Activo",
    "noteTriggered": "Nota Disparada",
    "labelTag": "ETIQUETA",
    "labelTimeMs": "TIEMPO (MS)",
    "labelValue": "VALOR",
    "labelCurveNext": "CURVA A SIG.",
    "labelHoldTime": "होल्ड टाइम",
    "labelKfOrder": "कीफ्रेम ऑर्डर",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "मूल ऑडियो",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "SMPTE ऑडियो इनपुट",
    "lblChannel": "CHANNEL",
    "lblStartTime": "शुरू होने का समय",
    "lblEndTime": "समाप्त होने का समय",
    "lblLtcLive": "LTC लाइव",
    "lblUniversoDmx": "DMX ब्रह्मांड",
    "lblCanalInicio": "स्टार्ट चैनल",
    "lblValorDmxLive": "लाइव DMX वैल्यू",
    "tabOut": "↑ आउट (OUT)",
    "tabIn": "↓ इन (IN)",
    "tabTimeCode": "टाइम कोड",
    "lblDuration": "अवधि"
  },
  "ko": {
    "transcripcionTitle": "오디오 및 받아쓰기",
    "transcripcionDescTitle": "오디오 및 받아쓰기",
    "transcripcionDesc": "모든 사용자에게 실시간 오디오를 전송합니다. 로컬 인공지능이 음성을 텍스트로 변환하여 채팅에 표시합니다.",
    "userJorge": "조지",
    "userSofia": "소피아",
    "userCarlos": "카를로스",
    "categoryProd": "제작",
    "categoryLuz": "조명 / FX",
    "categorySonido": "음향",
    "msgHolaMundo": "안녕하세요 세계",
    "placeholderText": "메시지를 입력하세요...",
    "chunks": [
      "안녕",
      "안녕",
      "안녕하세요...",
      "안녕하세요 세계"
    ],
    "traduccionTitle": "자동 및 원활한 번역",
    "traduccionDescTitle": "자동 및 원활한 번역",
    "traduccionDesc": "각 사용자는 자신의 언어로 메시지를 자동으로 수신합니다.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "준비되었나요?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "무한한 공간 저 넘어",
    "transLang2": "(EN)",
    "triggersTitle": "그래픽 에디터 및 키프레임",
    "triggersDescTitle": "그래픽 에디터 및 키프레임",
    "triggersDesc": "강력한 그래픽 에디터에서 알림과 트리거를 지정하고 조정합니다.",
    "filtrosTitle": "동적 필터",
    "filtrosDescTitle": "동적 필터",
    "filtrosDesc": "모든 메시지와 개별 카테고리 간을 즉시 전환합니다.",
    "filterAll": "전체",
    "filterProd": "제작",
    "filterLuz": "조명 / FX",
    "filterSonido": "음향",
    "filterMsg1": "5분 후 쇼를 시작합니다",
    "filterMsg2": "네온 블루 메인 스포트라이트 준비 완료",
    "filterMsg3": "인트로 음악 재생 중",
    "protocolosTitle": "채팅 내부 및 외부 제어",
    "protocolosDescTitle": "채팅 내부 및 외부 제어",
    "protocolosDesc": "SMPTE LTC Timecode를 수신하고 OSC, MIDI, sACN 프로토콜로 외부 시스템을 제어합니다.",
    "alertasTitle": "다감각 알림",
    "alertasDescTitle": "다감각 알림",
    "alertasDesc": "시각적 패턴, 햅틱 진동, 플래시 렌즈 시퀀스를 결합한 알림 경험을 만듭니다.",
    "alertRow1Title": "화면 알림",
    "alertRow1Sub": "색상 및 불투명도 애니메이션",
    "alertRow2Title": "진동",
    "alertRow2Sub": "리드미컬한 햅틱 패턴",
    "alertRow3Title": "손전등",
    "alertRow3Sub": "LED 플래시 시퀀스",
    "triggerInOutTitle": "입출력 트리거",
    "triggerInOutDescTitle": "입출력 트리거",
    "triggerInOutDesc": "시스템 간 이벤트 연결을 위한 입출력 트리거를 관리합니다.",
    "searchPlaceholder": "트리거 검색...",
    "savedTriggersLabel": "트리거 (15)",
    "addTriggerBtn": "+ 트리거 추가",
    "motoresTitle": "고급 번역",
    "motoresDescTitle": "고급 번역",
    "motoresDesc": "자동 번역을 설정하고 보호 단어 사전을 관리합니다.",
    "idiomaVozTitle": "사용자 지정 사전",
    "idiomaVozDescTitle": "사용자 지정 사전",
    "idiomaVozDesc": "정확도를 향상시키기 위해 특정 용어를 추가합니다.",
    "motoresVozElasticosTitle": "유연한 음성 엔진",
    "motoresVozElasticosDescTitle": "유연한 음성 엔진",
    "motoresVozElasticosDesc": "완벽한 제어와 개인정보 보호를 위해 로컬에서 오프라인으로 음성 엔진을 실행합니다.",
    "modosAudioTitle": "오디오 모드",
    "modosAudioDescTitle": "오디오 모드",
    "modosAudioDesc": "PTT(누르고 말하기) 또는 자동 모드를 선택합니다.",
    "statusSilence": "정적",
    "statusTalking": "말하는 중",
    "pttHold": "누르고 말하기",
    "pttSpeaking": "말하는 중...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "자동 모드",
    "optPttText": "Push-to-Talk (누르기)",
    "optAutoText": "자동 모드 (볼륨)",
    "headerMotorIA": "AI 번역 엔진",
    "labelTradAuto": "자동 번역",
    "descTradAuto": "채팅을 인터페이스 언어로 번역합니다.",
    "labelMsgOrig": "원문 메시지",
    "descMsgOrig": "번역 아래에 원문을 표시합니다.",
    "titleIncomingFilter": "수신 언어 필터",
    "descIncomingFilter": "번역할 수신 언어를 선택합니다.",
    "titleProtectedWords": "보호 단어 (전문 용어)",
    "descProtectedWords": "이 단어들은 AI에 의해 절대 번역되지 않습니다.",
    "phProtectWord": "보호할 단어...",
    "headerIdiomaVoz": "언어 및 음성",
    "titleUiLang": "인터페이스 언어",
    "titleSttTranscription": "AI 받아쓰기 (KO)",
    "descSttTranscription": "정확도를 위해 어렵거나 생소한 단어를 추가하세요",
    "phSttBad": "잘못 인식...",
    "phSttGood": "올바르게 수정...",
    "labelStoragePath": "모델 저장 경로",
    "btnSelectStorage": "찾아보기...",
    "phSearchLang": "언어 검색...",
    "labelMicMode": "마이크 모드",
    "labelInputLevel": "입력 레벨",
    "btnInstalled": "설치됨",
    "btnDownload": "다운로드",
    "btnCancel": "✕ 취소",
    "inputDevice": "Dispositivo de Entrada",
    "channel": "Canal",
    "inputPort": "Puerto de Entrada",
    "oscActiveMsg": "Mensaje OSC Activo",
    "noteTriggered": "Nota Disparada",
    "labelTag": "ETIQUETA",
    "labelTimeMs": "TIEMPO (MS)",
    "labelValue": "VALOR",
    "labelCurveNext": "CURVA A SIG.",
    "labelHoldTime": "유지 시간",
    "labelKfOrder": "키프레임 순서",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "원본 오디오",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "SMPTE 오디오 입력",
    "lblChannel": "CHANNEL",
    "lblStartTime": "시작 시간",
    "lblEndTime": "종료 시간",
    "lblLtcLive": "LTC 라이브",
    "lblUniversoDmx": "DMX 유니버스",
    "lblCanalInicio": "시작 채널",
    "lblValorDmxLive": "라이브 DMX 값",
    "tabOut": "↑ 출력 (OUT)",
    "tabIn": "↓ 입력 (IN)",
    "tabTimeCode": "타임코드",
    "lblDuration": "지속 시간"
  },
  "ja": {
    "transcripcionTitle": "音声と文字起こし",
    "transcripcionDescTitle": "音声と文字起こし",
    "transcripcionDesc": "リアルタイムで音声を送信します。ローカルAIが声をテキストに変換してチャットに表示します。",
    "userJorge": "ジョージ",
    "userSofia": "ソフィア",
    "userCarlos": "カルロス",
    "categoryProd": "制作",
    "categoryLuz": "照明 / FX",
    "categorySonido": "音響",
    "msgHolaMundo": "こんにちは世界",
    "placeholderText": "メッセージを入力...",
    "chunks": [
      "こん",
      "こんにちは",
      "こんにちは世...",
      "こんにちは世界"
    ],
    "traduccionTitle": "自動かつスムーズな翻訳",
    "traduccionDescTitle": "自動かつスムーズな翻訳",
    "traduccionDesc": "各ユーザーはそれぞれの言語でメッセージを自動的に受信します。",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "準備はいいですか？",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "無限の彼方へ、さあ行くぞ",
    "transLang2": "(EN)",
    "triggersTitle": "グラフィックエディタとキーフレーム",
    "triggersDescTitle": "グラフィックエディタとキーフレーム",
    "triggersDesc": "グラフィックエディタでアラートとトリガーを設定・カスタマイズします。",
    "filtrosTitle": "ダイナミックフィルター",
    "filtrosDescTitle": "ダイナミックフィルター",
    "filtrosDesc": "メッセージやカテゴリを即座に切り替えて表示します。",
    "filterAll": "すべて",
    "filterProd": "制作",
    "filterLuz": "照明 / FX",
    "filterSonido": "音響",
    "filterMsg1": "5分後にショーを開始します",
    "filterMsg2": "ネオンブルーのメインスポットライト準備完了",
    "filterMsg3": "オープニング曲再生中",
    "protocolosTitle": "チャット内および外部制御",
    "protocolosDescTitle": "チャット内および外部制御",
    "protocolosDesc": "SMPTE LTCタイムコードを受信し、OSC、MIDI、sACNで外部機器を制御します。",
    "alertasTitle": "マルチセンサリーアラート",
    "alertasDescTitle": "マルチセンサリーアラート",
    "alertasDesc": "視覚パターン、振動、フラッシュを組み合わせた通知機能。",
    "alertRow1Title": "画面アラート",
    "alertRow1Sub": "色と透明度のアニメーション",
    "alertRow2Title": "振動",
    "alertRow2Sub": "リズム振動パターン",
    "alertRow3Title": "フラッシュ",
    "alertRow3Sub": "LEDストロボ発光",
    "triggerInOutTitle": "In/Out トリガー",
    "triggerInOutDescTitle": "In/Out トリガー",
    "triggerInOutDesc": "システム間のイベント・自動化接続のためのトリガーを管理します。",
    "searchPlaceholder": "トリガーを検索...",
    "savedTriggersLabel": "トリガー (15)",
    "addTriggerBtn": "+ トリガーを追加",
    "motoresTitle": "高度な翻訳",
    "motoresDescTitle": "高度な翻訳",
    "motoresDesc": "自動翻訳を設定し、保護単語辞書を管理します。",
    "idiomaVozTitle": "カスタム辞書",
    "idiomaVozDescTitle": "カスタム辞書",
    "idiomaVozDesc": "認識精度向上のため専用用語を追加します。",
    "motoresVozElasticosTitle": "フレキシブル音声エンジン",
    "motoresVozElasticosDescTitle": "フレキシブル音声エンジン",
    "motoresVozElasticosDesc": "完全な制御とプライバシーのためにローカル・オフラインでAIエンジンを実行します。",
    "modosAudioTitle": "オーディオモード",
    "modosAudioDescTitle": "オーディオモード",
    "modosAudioDesc": "PTT（押して話す）または自動モードを選択できます。",
    "statusSilence": "静寂",
    "statusTalking": "発言中",
    "pttHold": "押して話す",
    "pttSpeaking": "発言中...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "自動",
    "optPttText": "Push-to-Talk (保持)",
    "optAutoText": "自動 (音量検知)",
    "headerMotorIA": "AI翻訳エンジン",
    "labelTradAuto": "自動翻訳",
    "descTradAuto": "チャットをUI言語に翻訳します。",
    "labelMsgOrig": "オリジナルメッセージ",
    "descMsgOrig": "翻訳の下に原文を表示します。",
    "titleIncomingFilter": "受信言語フィルター",
    "descIncomingFilter": "翻訳対象の言語を選択します。",
    "titleProtectedWords": "保護単語 (専門用語)",
    "descProtectedWords": " these words will NEVER be translated by AI.",
    "phProtectWord": "保護する単語...",
    "headerIdiomaVoz": "言語と音声",
    "titleUiLang": "UI言語",
    "titleSttTranscription": "AI文字起こし (JA)",
    "descSttTranscription": "認識精度を高める単語を追加",
    "phSttBad": "誤認識...",
    "phSttGood": "正しく修正...",
    "labelStoragePath": "モデル保存パス",
    "btnSelectStorage": "参照...",
    "phSearchLang": "言語を検索...",
    "labelMicMode": "マイクモード",
    "labelInputLevel": "入力レベル",
    "btnInstalled": "インストール済み",
    "btnDownload": "ダウンロード",
    "btnCancel": "✕ キャンセル",
    "inputDevice": "Dispositivo de Entrada",
    "channel": "Canal",
    "inputPort": "Puerto de Entrada",
    "oscActiveMsg": "Mensaje OSC Activo",
    "noteTriggered": "Nota Disparada",
    "labelTag": "ETIQUETA",
    "labelTimeMs": "TIEMPO (MS)",
    "labelValue": "VALOR",
    "labelCurveNext": "CURVA A SIG.",
    "labelHoldTime": "ホールドタイム",
    "labelKfOrder": "キーフレーム順序",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "オリジナル音声",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "SMPTE オーディオ入力",
    "lblChannel": "CHANNEL",
    "lblStartTime": "開始時間",
    "lblEndTime": "終了時間",
    "lblLtcLive": "LTC ライブ",
    "lblUniversoDmx": "DMX ユニバース",
    "lblCanalInicio": "開始チャンネル",
    "lblValorDmxLive": "ライブ DMX 値",
    "tabOut": "↑ 出力 (OUT)",
    "tabIn": "↓ 入力 (IN)",
    "tabTimeCode": "タイムコード",
    "lblDuration": "デュレーション"
  },
  "vi": {
    "transcripcionTitle": "Âm thanh và chuyển bản ký tự",
    "transcripcionDescTitle": "Âm thanh và chuyển bản ký tự",
    "transcripcionDesc": "Nói và truyền âm thanh thời gian thực. AI cục bộ chuyển giọng nói thành văn bản hiển thị trực tiếp trong trò chuyện.",
    "userJorge": "Jorge",
    "userSofia": "Sofia",
    "userCarlos": "Carlos",
    "categoryProd": "SẢN XUẤT",
    "categoryLuz": "ÁNH SÁNG / FX",
    "categorySonido": "ÂM THANH",
    "msgHolaMundo": "Xin chào thế giới",
    "placeholderText": "Nhập tin nhắn...",
    "chunks": [
      "xin",
      "Xin chào",
      "Xin chào thế...",
      "Xin chào thế giới"
    ],
    "traduccionTitle": "Dịch tự động và mượt mà",
    "traduccionDescTitle": "Dịch tự động và mượt mà",
    "traduccionDesc": "Mỗi người dùng nhận tin nhắn bằng ngôn ngữ của họ một cách tự động và tự nhiên.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "Chúng ta đã sẵn sàng chưa?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "vô tận và xa hơn nữa",
    "transLang2": "(EN)",
    "triggersTitle": "Trình chỉnh sửa đồ họa & Keyframe",
    "triggersDescTitle": "Trình chỉnh sửa đồ họa & Keyframe",
    "triggersDesc": "Tạo và tùy chỉnh cảnh báo cũng như bộ kích hoạt từ trình chỉnh sửa đồ họa mạnh mẽ.",
    "filtrosTitle": "Bộ lọc động",
    "filtrosDescTitle": "Bộ lọc động",
    "filtrosDesc": "Chuyển đổi tức thì giữa tất cả tin nhắn và các danh mục.",
    "filterAll": "TẤT CẢ",
    "filterProd": "SẢN XUẤT",
    "filterLuz": "ÁNH SÁNG / FX",
    "filterSonido": "ÂM THANH",
    "filterMsg1": "Chúng ta bắt đầu show trong 5 phút",
    "filterMsg2": "Đèn chiếu chính xanh neon đã sẵn sàng",
    "filterMsg3": "Nhạc dạo đang phát",
    "protocolosTitle": "Điều khiển trong chat & bên ngoài",
    "protocolosDescTitle": "Điều khiển trong chat & bên ngoài",
    "protocolosDesc": "Nhận SMPTE LTC Timecode và điều khiển các hệ thống khác qua OSC, MIDI, sACN.",
    "alertasTitle": "Cảnh báo đa giác quan",
    "alertasDescTitle": "Cảnh báo đa giác quan",
    "alertasDesc": "Kết hợp hiệu ứng màn hình, rung haptic và chuỗi đèn LED.",
    "alertRow1Title": "Cảnh báo màn hình",
    "alertRow1Sub": "Hoạt ảnh màu và độ đục",
    "alertRow2Title": "Rung",
    "alertRow2Sub": "Mô hình rung nhịp nhàng",
    "alertRow3Title": "Đèn pin",
    "alertRow3Sub": "Chuỗi chớp LED",
    "triggerInOutTitle": "Bộ kích hoạt Vào/Ra",
    "triggerInOutDescTitle": "Bộ kích hoạt Vào/Ra",
    "triggerInOutDesc": "Quản lý các bộ kích hoạt đầu vào và đầu ra để kết nối sự kiện giữa các hệ thống.",
    "searchPlaceholder": "Tìm bộ kích hoạt...",
    "savedTriggersLabel": "BỘ KÍCH HOẠT (15)",
    "addTriggerBtn": "+ Thêm kích hoạt",
    "motoresTitle": "Dịch nâng cao",
    "motoresDescTitle": "Dịch nâng cao",
    "motoresDesc": "Cấu hình dịch tự động và quản lý từ điển thuật ngữ được bảo vệ.",
    "idiomaVozTitle": "Từ điển tùy chỉnh",
    "idiomaVozDescTitle": "Từ điển tùy chỉnh",
    "idiomaVozDesc": "Thêm các thuật ngữ đặc biệt để cải thiện độ chính xác chuyển bản.",
    "motoresVozElasticosTitle": "Động cơ giọng nói linh hoạt",
    "motoresVozElasticosDescTitle": "Động cơ giọng nói linh hoạt",
    "motoresVozElasticosDesc": "Chạy các động cơ AI cục bộ ngoại tuyến trên thiết bị để kiểm soát toàn bộ và bảo mật dữ liệu.",
    "modosAudioTitle": "Chế độ âm thanh",
    "modosAudioDescTitle": "Chế độ âm thanh",
    "modosAudioDesc": "Chọn giữa PTT (Nhấn để nói) hoặc Chế độ tự động.",
    "statusSilence": "IM LẶNG",
    "statusTalking": "ĐANG NÓI",
    "pttHold": "GIỮ ĐỂ NÓI",
    "pttSpeaking": "ĐANG NÓI...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "TỰ ĐỘNG",
    "optPttText": "Push-to-Talk (giữ)",
    "optAutoText": "Tự động (theo âm lượng)",
    "headerMotorIA": "Động cơ Dịch AI",
    "labelTradAuto": "DỊCH TỰ ĐỘNG",
    "descTradAuto": "Dịch trò chuyện sang ngôn ngữ giao diện của bạn.",
    "labelMsgOrig": "TIN NHẮN GỐC",
    "descMsgOrig": "Hiển thị văn bản gốc dưới bản dịch.",
    "titleIncomingFilter": "BỘ LỌC NGÔN NGỮ ĐẾN",
    "descIncomingFilter": "Chọn ngôn ngữ đến để dịch.",
    "titleProtectedWords": "TỪ ĐƯỢC BẢO VỆ (THUẬT NGỮ CHUYÊN NGÀNH)",
    "descProtectedWords": "Những từ này SẼ KHÔNG BAO GIỜ được dịch bởi AI.",
    "phProtectWord": "Từ cần bảo vệ...",
    "headerIdiomaVoz": "Ngôn ngữ & Giọng nói",
    "titleUiLang": "NGÔN NGỮ GIAO DIỆN",
    "titleSttTranscription": "CHUYỂN BẢN AI (VI)",
    "descSttTranscription": "Thêm từ khó để tăng độ chính xác",
    "phSttBad": "Hiểu là...",
    "phSttGood": "Sửa thành...",
    "labelStoragePath": "Đường dẫn lưu mô hình",
    "btnSelectStorage": "Duyệt...",
    "phSearchLang": "Tìm ngôn ngữ...",
    "labelMicMode": "CHẾ ĐỘ MICRO",
    "labelInputLevel": "MỨC ĐẦU VÀO",
    "btnInstalled": "ĐÃ CÀI ĐẶT",
    "btnDownload": "Tải về",
    "btnCancel": "✕ Hủy",
    "inputDevice": "Dispositivo de Entrada",
    "channel": "Canal",
    "inputPort": "Puerto de Entrada",
    "oscActiveMsg": "Mensaje OSC Activo",
    "noteTriggered": "Nota Disparada",
    "labelTag": "ETIQUETA",
    "labelTimeMs": "TIEMPO (MS)",
    "labelValue": "VALOR",
    "labelCurveNext": "CURVA A SIG.",
    "labelHoldTime": "THỜI GIAN GIỮ",
    "labelKfOrder": "THỨ TỰ KEYFRAME",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "âm thanh gốc",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "ĐẦU VÀO ÂM THANH SMPTE",
    "lblChannel": "CHANNEL",
    "lblStartTime": "THỜI GIAN BẮT ĐẦU",
    "lblEndTime": "THỜI GIAN KẾT THÚC",
    "lblLtcLive": "LTC TRỰC TIẾP",
    "lblUniversoDmx": "VŨ TRỤ DMX",
    "lblCanalInicio": "KÊNH BẮT ĐẦU",
    "lblValorDmxLive": "GIÁ TRỊ DMX TRỰC TIẾP",
    "tabOut": "↑ ĐẦU RA (OUT)",
    "tabIn": "↓ ĐẦU VÀO (IN)",
    "tabTimeCode": "Mã Thời Gian",
    "lblDuration": "Thời lượng"
  },
  "th": {
    "transcripcionTitle": "เสียงและการถอดความ",
    "transcripcionDescTitle": "เสียงและการถอดความ",
    "transcripcionDesc": "พูดและส่งสัญญาณเสียงแบบเรียลไทม์ AI ท้องถิ่นจะแปลงเสียงของคุณเป็นข้อความและแสดงในแชทโดยตรง",
    "userJorge": "จอร์จ",
    "userSofia": "โซเฟีย",
    "userCarlos": "คาร์ลอส",
    "categoryProd": "การผลิต",
    "categoryLuz": "แสง / FX",
    "categorySonido": "เสียง",
    "msgHolaMundo": "สวัสดีชาวโลก",
    "placeholderText": "พิมพ์ข้อความของคุณ...",
    "chunks": [
      "สวัส",
      "สวัสดี",
      "สวัสดีชาว...",
      "สวัสดีชาวโลก"
    ],
    "traduccionTitle": "การแปลอัตโนมัติและราบรื่น",
    "traduccionDescTitle": "การแปลอัตโนมัติและราบรื่น",
    "traduccionDesc": "ผู้ใช้แต่ละคนจะได้รับข้อความในภาษาของตนเองโดยอัตโนมัติ",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "พวกเราพร้อมหรือยัง?",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "สู่ความเวิ้งว้างอันไกลโพ้น",
    "transLang2": "(EN)",
    "triggersTitle": "ตัวแก้ไขกราฟิกและคีย์เฟรม",
    "triggersDescTitle": "ตัวแก้ไขกราฟิกและคีย์เฟรม",
    "triggersDesc": "สร้างและปรับแต่งการแจ้งเตือนและตัวเรียกใช้งานในตัวแก้ไขกราฟิกทรงพลัง",
    "filtrosTitle": "ตัวกรองไดนามิก",
    "filtrosDescTitle": "ตัวกรองไดนามิก",
    "filtrosDesc": "สลับระหว่างข้อความทั้งหมดและแต่ละหมวดหมู่ได้ทันที",
    "filterAll": "ทั้งหมด",
    "filterProd": "การผลิต",
    "filterLuz": "แสง / FX",
    "filterSonido": "เสียง",
    "filterMsg1": "เราจะเริ่มการแสดงในอีก 5 นาที",
    "filterMsg2": "ไฟสปอตไลท์หลักสีนีออนบลูพร้อมแล้ว",
    "filterMsg3": "เพลงอินโทร กำลังเล่น",
    "protocolosTitle": "การควบคุมในแชทและภายนอก",
    "protocolosDescTitle": "การควบคุมในแชทและภายนอก",
    "protocolosDesc": "รับ SMPTE LTC Timecode และควบคุมระบบอื่นด้วย OSC, MIDI, sACN",
    "alertasTitle": "การแจ้งเตือนแบบพหุสัมผัส",
    "alertasDescTitle": "การแจ้งเตือนแบบพหุสัมผัส",
    "alertasDesc": "รวมเอฟเฟกต์หน้าจอ ระบบสั่น และไฟแฟลช LED เพื่อการแจ้งเตือนที่สมบูรณ์แบบ",
    "alertRow1Title": "การแจ้งเตือนหน้าจอ",
    "alertRow1Sub": "แอนิเมชันสีและความโปร่งแสง",
    "alertRow2Title": "ระบบสั่น",
    "alertRow2Sub": "รูปแบบการสั่นเป็นจังหวะ",
    "alertRow3Title": "ไฟฉาย",
    "alertRow3Sub": "ลำดับการกระพริบของ LED",
    "triggerInOutTitle": "ตัวเรียกใช้งาน เข้า/ออก",
    "triggerInOutDescTitle": "ตัวเรียกใช้งาน เข้า/ออก",
    "triggerInOutDesc": "จัดการตัวเรียกใช้งานอินพุตและเอาต์พุตเพื่อเชื่อมโยงระบบต่างๆ",
    "searchPlaceholder": "ค้นหาตัวเรียกใช้งาน...",
    "savedTriggersLabel": "ตัวเรียกใช้งาน (15)",
    "addTriggerBtn": "+ เพิ่มตัวเรียกใช้งาน",
    "motoresTitle": "การแปลขั้นสูง",
    "motoresDescTitle": "การแปลขั้นสูง",
    "motoresDesc": "กำหนดค่าการแปลอัตโนมัติและจัดการพจนานุกรมคำที่ได้รับการคุ้มครอง",
    "idiomaVozTitle": "พจนานุกรมที่กำหนดเอง",
    "idiomaVozDescTitle": "พจนานุกรมที่กำหนดเอง",
    "idiomaVozDesc": "เพิ่มคำเฉพาะเพื่อปรับปรุงความถูกต้องของการถอดความ",
    "motoresVozElasticosTitle": "เครื่องมือจัดการเสียงที่ยืดหยุ่น",
    "motoresVozElasticosDescTitle": "เครื่องมือจัดการเสียงที่ยืดหยุ่น",
    "motoresVozElasticosDesc": "เรียกใช้เครื่องมือ AI บนเครื่องแบบออฟไลน์เพื่อการควบคุมและความเป็นส่วนตัวสูงสุด",
    "modosAudioTitle": "โหมดเสียง",
    "modosAudioDescTitle": "โหมดเสียง",
    "modosAudioDesc": "เลือกระหว่าง PTT (กดเพื่อพูด) หรือโหมดอัตโนมัติ",
    "statusSilence": "เงียบ",
    "statusTalking": "กำลังพูด",
    "pttHold": "กดค้างไว้เพื่อพูด",
    "pttSpeaking": "กำลังพูด...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "อัตโนมัติ",
    "optPttText": "Push-to-Talk (กดค้าง)",
    "optAutoText": "อัตโนมัติ (ตามความดัง)",
    "headerMotorIA": "เครื่องมือแปลภาษา AI",
    "labelTradAuto": "การแปลอัตโนมัติ",
    "descTradAuto": "แปลแชทเป็นภาษาของอินเทอร์เฟซของคุณ",
    "labelMsgOrig": "ข้อความต้นฉบับ",
    "descMsgOrig": "แสดงข้อความต้นฉบับใต้คำแปล",
    "titleIncomingFilter": "ตัวกรองภาษาขาเข้า",
    "descIncomingFilter": "เลือกภาษาขาเข้าที่ต้องการแปล",
    "titleProtectedWords": "คำที่ได้รับการคุ้มครอง (ศัพท์เทคนิค)",
    "descProtectedWords": "คำเหล่านี้จะไม่ถูกแปลโดย AI",
    "phProtectWord": "คำที่ต้องการคุ้มครอง...",
    "headerIdiomaVoz": "ภาษาและเสียง",
    "titleUiLang": "ภาษาของอินเทอร์เฟซ",
    "titleSttTranscription": "การถอดความ AI (TH)",
    "descSttTranscription": "เพิ่มคำที่ยากเพื่อปรับปรุงความถูกต้อง",
    "phSttBad": "เข้าใจว่า...",
    "phSttGood": "แก้ไขเป็น...",
    "labelStoragePath": "เส้นทางจัดเก็บโมเดล",
    "btnSelectStorage": "เรียกดู...",
    "phSearchLang": "ค้นหาภาษา...",
    "labelMicMode": "โหมดไมโครโฟน",
    "labelInputLevel": "ระดับอินพุต",
    "btnInstalled": "ติดตั้งแล้ว",
    "btnDownload": "ดาวน์โหลด",
    "btnCancel": "✕ ยกเลิก",
    "inputDevice": "Dispositivo de Entrada",
    "channel": "Canal",
    "inputPort": "Puerto de Entrada",
    "oscActiveMsg": "Mensaje OSC Activo",
    "noteTriggered": "Nota Disparada",
    "labelTag": "ETIQUETA",
    "labelTimeMs": "TIEMPO (MS)",
    "labelValue": "VALOR",
    "labelCurveNext": "CURVA A SIG.",
    "labelHoldTime": "เวลาถือ",
    "labelKfOrder": "ลำดับคีย์เฟรม",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "เสียงต้นฉบับ",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "อินพุตเสียง SMPTE",
    "lblChannel": "CHANNEL",
    "lblStartTime": "เวลาเริ่มต้น",
    "lblEndTime": "เวลาสิ้นสุด",
    "lblLtcLive": "LTC สด",
    "lblUniversoDmx": "จักรวาล DMX",
    "lblCanalInicio": "ช่องเริ่มต้น",
    "lblValorDmxLive": "ค่า DMX สด",
    "tabOut": "↑ ออก (OUT)",
    "tabIn": "↓ เข้า (IN)",
    "tabTimeCode": "รหัสเวลา",
    "lblDuration": "ระยะเวลา"
  },
  "fa": {
    "transcripcionTitle": "صدا و پیاده‌سازی متنی",
    "transcripcionDescTitle": "صدا و پیاده‌سازی متنی",
    "transcripcionDesc": "صدا را به صورت زنده منتقل کنید. هوش مصنوعی محلی صدای شما را به متن تبدیل کرده و در چت نشان می‌دهد.",
    "userJorge": "جورج",
    "userSofia": "سوفیا",
    "userCarlos": "کارلوس",
    "categoryProd": "تولید",
    "categoryLuz": "نور / FX",
    "categorySonido": "صدا",
    "msgHolaMundo": "سلام دنیا",
    "placeholderText": "پیام خود را بنویسید...",
    "chunks": [
      "سلام",
      "سلام",
      "سلام دنـ...",
      "سلام دنیا"
    ],
    "traduccionTitle": "ترجمه خودکار و روان",
    "traduccionDescTitle": "ترجمه خودکار و روان",
    "traduccionDesc": "هر کاربر پیام‌ها را به صورت خودکار و طبیعی به زبان خود دریافت می‌کند.",
    "transTextMsg1Orig": "Sommes-nous prêts ?",
    "transTextMsg1Target": "آیا آماده‌ایم؟",
    "transLang1": "(FR)",
    "transTextMsg2Orig": "to infinity and beyond",
    "transTextMsg2Target": "تا بی‌نهایت و فراتر از آن",
    "transLang2": "(EN)",
    "triggersTitle": "ویرایشگر گرافیکی و کی‌فریم‌ها",
    "triggersDescTitle": "ویرایشگر گرافیکی و کی‌فریم‌ها",
    "triggersDesc": "هشدارها و محرک‌ها را در یک ویرایشگر گرافیکی قدرتمند سفارشی کنید.",
    "filtrosTitle": "فیلترهای پویا",
    "filtrosDescTitle": "فیلترهای پویا",
    "filtrosDesc": "بلافاصله بین پیام‌ها و دسته‌بندی‌ها جابه‌جا شوید.",
    "filterAll": "همه",
    "filterProd": "تولید",
    "filterLuz": "نور / FX",
    "filterSonido": "صدا",
    "filterMsg1": "نمایش ۵ دقیقه دیگر شروع می‌شود",
    "filterMsg2": "نورافکن اصلی آبی نئون آماده است",
    "filterMsg3": "موسیقی مقدمه در حال پخش است",
    "protocolosTitle": "کنترل چت و خارجی",
    "protocolosDescTitle": "کنترل چت و خارجی",
    "protocolosDesc": "Timecode SMPTE LTC را دریافت کرده و سیستم‌های دیگر را با OSC، MIDI و sACN کنترل کنید.",
    "alertasTitle": "هشدارهای چندحسی",
    "alertasDescTitle": "هشدارهای چندحسی",
    "alertasDesc": "الگوهای بصری، ویبره و فلاش LED را برای هشدارهای کامل‌تر ترکیب کنید.",
    "alertRow1Title": "هشدارهای صفحه",
    "alertRow1Sub": "انیمیشن رنگ و شفافیت",
    "alertRow2Title": "ویبره",
    "alertRow2Sub": "الگوی ارتعاشی ریتمیک",
    "alertRow3Title": "چراغ‌قوه",
    "alertRow3Sub": "توالی فلاش LED",
    "triggerInOutTitle": "محرک‌های ورودی/خروجی",
    "triggerInOutDescTitle": "محرک‌های ورودی/خروجی",
    "triggerInOutDesc": "محرک‌های ورودی و خروجی را برای اتصال رویدادها بین سیستم‌ها مدیریت کنید.",
    "searchPlaceholder": "جستجوی محرک...",
    "savedTriggersLabel": "محرک‌ها (15)",
    "addTriggerBtn": "+ افزودن محرک",
    "motoresTitle": "ترجمه پیشرفته",
    "motoresDescTitle": "ترجمه پیشرفته",
    "motoresDesc": "ترجمه خودکار را پیکربندی کرده و واژه‌نامه کلمات محافظت‌شده را مدیریت کنید.",
    "idiomaVozTitle": "واژه‌نامه‌های سفارشی",
    "idiomaVozDescTitle": "واژه‌نامه‌های سفارشی",
    "idiomaVozDesc": "اصطلاحات خاصی را برای افزایش دقت پیاده‌سازی متنی اضافه کنید.",
    "motoresVozElasticosTitle": "موتورهای صوتی انعطاف‌پذیر",
    "motoresVozElasticosDescTitle": "موتورهای صوتی انعطاف‌پذیر",
    "motoresVozElasticosDesc": "موتورهای هوش مصنوعی را به صورت محلی و آفلاین برای کنترل کامل و حفظ حریم خصوصی اجرا کنید.",
    "modosAudioTitle": "حالت‌های صدا",
    "modosAudioDescTitle": "حالت‌های صدا",
    "modosAudioDesc": "بین PTT (فشار دهید و صحبت کنید) یا حالت خودکار انتخاب کنید.",
    "statusSilence": "سکوت",
    "statusTalking": "در حال صحبت",
    "pttHold": "برای صحبت نگه دارید",
    "pttSpeaking": "در حال صحبت...",
    "tagPtt": "PUSH-TO-TALK",
    "tagAuto": "خودکار",
    "optPttText": "Push-to-Talk (نگه‌داشتن)",
    "optAutoText": "خودکار (بر اساس صدا)",
    "headerMotorIA": "موتور ترجمه هوش مصنوعی",
    "labelTradAuto": "ترجمه خودکار",
    "descTradAuto": "چت را به زبان رابط شما ترجمه می‌کند.",
    "labelMsgOrig": "پیام اصلی",
    "descMsgOrig": "متن اصلی را زیر ترجمه نشان می‌دهد.",
    "titleIncomingFilter": "فیلتر زبان‌های ورودی",
    "descIncomingFilter": "زبان‌های ورودی برای ترجمه را انتخاب کنید.",
    "titleProtectedWords": "کلمات محافظت‌شده (اصطلاحات فنی)",
    "descProtectedWords": "این کلمات هرگز توسط هوش مصنوعی ترجمه نخواهند شد.",
    "phProtectWord": "کلمه جهت محافظت...",
    "headerIdiomaVoz": "زبان و صدا",
    "titleUiLang": "زبان رابط",
    "titleSttTranscription": "پیاده‌سازی هوش مصنوعی (FA)",
    "descSttTranscription": "کلمات دشوار را برای دقت بیشتر اضافه کنید",
    "phSttBad": "متوجه می‌شود...",
    "phSttGood": "تصحیح به...",
    "labelStoragePath": "مسیر ذخیره مدل‌ها",
    "btnSelectStorage": "مرور...",
    "phSearchLang": "جستجوی زبان...",
    "labelMicMode": "حالت میکروفون",
    "labelInputLevel": "سطح ورودی",
    "btnInstalled": "نصب‌شده",
    "btnDownload": "دانلود",
    "btnCancel": "✕ لغو",
    "inputDevice": "Dispositivo de Entrada",
    "channel": "Canal",
    "inputPort": "Puerto de Entrada",
    "oscActiveMsg": "Mensaje OSC Activo",
    "noteTriggered": "Nota Disparada",
    "labelTag": "ETIQUETA",
    "labelTimeMs": "TIEMPO (MS)",
    "labelValue": "VALOR",
    "labelCurveNext": "CURVA A SIG.",
    "labelHoldTime": "زمان نگه‌داشتن",
    "labelKfOrder": "ترتیب کی‌فریم‌ها",
    "headerSubtitle": "Demostración animada y responsive de funcionalidades",
    "audioOriginal": "صدای اصلی",
    "ipAddress": "Dirección IP",
    "lblSmpteAudioInput": "ورودی صدای SMPTE",
    "lblChannel": "CHANNEL",
    "lblStartTime": "زمان شروع",
    "lblEndTime": "زمان پایان",
    "lblLtcLive": "LTC زنده",
    "lblUniversoDmx": "دنیا DMX",
    "lblCanalInicio": "کانال شروع",
    "lblValorDmxLive": "مقدار DMX زنده",
    "tabOut": "↑ خروجی (OUT)",
    "tabIn": "↓ ورودی (IN)",
    "tabTimeCode": "کد زمان",
    "lblDuration": "مدت زمان"
  }
};
const LANG_NAMES = {
  "es": {
    "ES": "Español",
    "EN": "Inglés",
    "FR": "Francés",
    "DE": "Alemán",
    "IT": "Italiano",
    "PT": "Portugués",
    "CA": "Catalán",
    "GL": "Gallego",
    "EU": "Euskera",
    "AR": "Árabe",
    "ZH": "Chino",
    "RU": "Ruso",
    "NL": "Holandés",
    "PL": "Polaco",
    "TR": "Turco",
    "CS": "Checo",
    "SV": "Sueco",
    "UK": "Ucraniano",
    "HI": "Hindi",
    "KO": "Coreano",
    "JA": "Japonés",
    "VI": "Vietnamita",
    "TH": "Tailandés",
    "FA": "Persa"
  },
  "en": {
    "ES": "Spanish",
    "EN": "English",
    "FR": "French",
    "DE": "German",
    "IT": "Italian",
    "PT": "Portuguese",
    "CA": "Catalan",
    "GL": "Galician",
    "EU": "Basque",
    "AR": "Arabic",
    "ZH": "Chinese",
    "RU": "Russian",
    "NL": "Dutch",
    "PL": "Polish",
    "TR": "Turkish",
    "CS": "Czech",
    "SV": "Swedish",
    "UK": "Ukrainian",
    "HI": "Hindi",
    "KO": "Korean",
    "JA": "Japanese",
    "VI": "Vietnamese",
    "TH": "Thai",
    "FA": "Persian"
  },
  "fr": {
    "ES": "Espagnol",
    "EN": "Anglais",
    "FR": "Français",
    "DE": "Allemand",
    "IT": "Italien",
    "PT": "Portugais",
    "CA": "Catalan",
    "GL": "Galicien",
    "EU": "Basque",
    "AR": "Arabe",
    "ZH": "Chinois",
    "RU": "Russe",
    "NL": "Néerlandais",
    "PL": "Polonais",
    "TR": "Turc",
    "CS": "Tchèque",
    "SV": "Suédois",
    "UK": "Ukrainien",
    "HI": "Hindi",
    "KO": "Coréen",
    "JA": "Japonais",
    "VI": "Vietnamien",
    "TH": "Thaï",
    "FA": "Persan"
  },
  "de": {
    "ES": "Spanisch",
    "EN": "Englisch",
    "FR": "Französisch",
    "DE": "Deutsch",
    "IT": "Italienisch",
    "PT": "Portugiesisch",
    "CA": "Katalanisch",
    "GL": "Galicisch",
    "EU": "Baskisch",
    "AR": "Arabisch",
    "ZH": "Chinesisch",
    "RU": "Russisch",
    "NL": "Niederländisch",
    "PL": "Polnisch",
    "TR": "Türkisch",
    "CS": "Tschechisch",
    "SV": "Schwedisch",
    "UK": "Ukrainisch",
    "HI": "Hindi",
    "KO": "Koreanisch",
    "JA": "Japanisch",
    "VI": "Vietnamesisch",
    "TH": "Thailändisch",
    "FA": "Persisch"
  },
  "it": {
    "ES": "Spagnolo",
    "EN": "Inglese",
    "FR": "Francese",
    "DE": "Tedesco",
    "IT": "Italiano",
    "PT": "Portoghese",
    "CA": "Catalano",
    "GL": "Galiziano",
    "EU": "Basco",
    "AR": "Arabo",
    "ZH": "Cinese",
    "RU": "Russo",
    "NL": "Olandese",
    "PL": "Polacco",
    "TR": "Turco",
    "CS": "Ceco",
    "SV": "Svedese",
    "UK": "Ucraino",
    "HI": "Hindi",
    "KO": "Coreano",
    "JA": "Giapponese",
    "VI": "Vietnamita",
    "TH": "Thailandese",
    "FA": "Persiano"
  },
  "pt": {
    "ES": "Espanhol",
    "EN": "Inglês",
    "FR": "Francês",
    "DE": "Alemão",
    "IT": "Italiano",
    "PT": "Português",
    "CA": "Catalão",
    "GL": "Galego",
    "EU": "Basco",
    "AR": "Árabe",
    "ZH": "Chinês",
    "RU": "Russo",
    "NL": "Holandês",
    "PL": "Polonês",
    "TR": "Turco",
    "CS": "Tcheco",
    "SV": "Sueco",
    "UK": "Ucraniano",
    "HI": "Hindi",
    "KO": "Coreano",
    "JA": "Japonês",
    "VI": "Vietnamita",
    "TH": "Tailandês",
    "FA": "Persa"
  },
  "ca": {
    "ES": "Espanyol",
    "EN": "Anglès",
    "FR": "Francès",
    "DE": "Alemany",
    "IT": "Italià",
    "PT": "Portuguès",
    "CA": "Català",
    "GL": "Galec",
    "EU": "Basc",
    "AR": "Àrab",
    "ZH": "Xinès",
    "RU": "Rus",
    "NL": "Holandès",
    "PL": "Polonès",
    "TR": "Turc",
    "CS": "Txec",
    "SV": "Suec",
    "UK": "Ucraïnès",
    "HI": "Hindi",
    "KO": "Coreà",
    "JA": "Japonès",
    "VI": "Vietnamita",
    "TH": "Tailandès",
    "FA": "Persa"
  },
  "gl": {
    "ES": "Español",
    "EN": "Inglés",
    "FR": "Francés",
    "DE": "Alemán",
    "IT": "Italiano",
    "PT": "Portugués",
    "CA": "Catalán",
    "GL": "Galego",
    "EU": "Euskera",
    "AR": "Árabe",
    "ZH": "Chinés",
    "RU": "Ruso",
    "NL": "Holandés",
    "PL": "Polaco",
    "TR": "Turco",
    "CS": "Checo",
    "SV": "Sueco",
    "UK": "Ucraíno",
    "HI": "Hindi",
    "KO": "Coreano",
    "JA": "Xaponés",
    "VI": "Vietnamita",
    "TH": "Tailandés",
    "FA": "Persa"
  },
  "eu": {
    "ES": "Gaztelania",
    "EN": "Ingelesa",
    "FR": "Frantsesa",
    "DE": "Alemana",
    "IT": "Botaniera",
    "PT": "Portugalera",
    "CA": "Katalana",
    "GL": "Galiziera",
    "EU": "Euskara",
    "AR": "Arabiera",
    "ZH": "Txinera",
    "RU": "Errusiera",
    "NL": "Nederlandera",
    "PL": "Poloniera",
    "TR": "Turkiera",
    "CS": "Txekiera",
    "SV": "Suediera",
    "UK": "Ukrainera",
    "HI": "Hindiera",
    "KO": "Koreera",
    "JA": "Japoniera",
    "VI": "Vietnamera",
    "TH": "Thailandiera",
    "FA": "Persiera"
  },
  "ar": {
    "ES": "الإسبانية",
    "EN": "الإنجليزية",
    "FR": "الفرنسية",
    "DE": "الألمانية",
    "IT": "الإيطالية",
    "PT": "البرتغالية",
    "CA": "الكتالونية",
    "GL": "الجاليجية",
    "EU": "الباسكية",
    "AR": "العربية",
    "ZH": "الصينية",
    "RU": "الروسية",
    "NL": "الهولندية",
    "PL": "البولندية",
    "TR": "التركية",
    "CS": "التشيكية",
    "SV": "السويدية",
    "UK": "الأوكرانية",
    "HI": "الهندية",
    "KO": "الكورية",
    "JA": "اليابانية",
    "VI": "الفيتنامية",
    "TH": "التايلاندية",
    "FA": "الفارسية"
  },
  "zh": {
    "ES": "西班牙语",
    "EN": "英语",
    "FR": "法语",
    "DE": "德语",
    "IT": "意大利语",
    "PT": "葡萄牙语",
    "CA": "加泰罗尼亚语",
    "GL": "加利西亚语",
    "EU": "巴斯克语",
    "AR": "阿拉伯语",
    "ZH": "中文",
    "RU": "俄语",
    "NL": "荷兰语",
    "PL": "波兰语",
    "TR": "土耳其语",
    "CS": "捷克语",
    "SV": "瑞典语",
    "UK": "乌克兰语",
    "HI": "印地语",
    "KO": "韩语",
    "JA": "日语",
    "VI": "越南语",
    "TH": "泰语",
    "FA": "波斯语"
  },
  "ru": {
    "ES": "Испанский",
    "EN": "Английский",
    "FR": "Французский",
    "DE": "Немецкий",
    "IT": "Итальянский",
    "PT": "Португальский",
    "CA": "Каталанский",
    "GL": "Галисийский",
    "EU": "Баскский",
    "AR": "Арабский",
    "ZH": "Китайский",
    "RU": "Русский",
    "NL": "Нидерландский",
    "PL": "Польский",
    "TR": "Турецкий",
    "CS": "Чешский",
    "SV": "Шведский",
    "UK": "Украинский",
    "HI": "Хинди",
    "KO": "Корейский",
    "JA": "Японский",
    "VI": "Вьетнамский",
    "TH": "Тайский",
    "FA": "Персидский"
  },
  "nl": {
    "ES": "Spaans",
    "EN": "Engels",
    "FR": "Frans",
    "DE": "Duits",
    "IT": "Italiaans",
    "PT": "Portugees",
    "CA": "Catalaans",
    "GL": "Galicisch",
    "EU": "Baskisch",
    "AR": "Arabisch",
    "ZH": "Chinees",
    "RU": "Russisch",
    "NL": "Nederlands",
    "PL": "Pools",
    "TR": "Turks",
    "CS": "Tsjechisch",
    "SV": "Zweeds",
    "UK": "Oekraïens",
    "HI": "Hindi",
    "KO": "Koreaans",
    "JA": "Japans",
    "VI": "Vietnamees",
    "TH": "Thais",
    "FA": "Perzisch"
  },
  "pl": {
    "ES": "Hiszpański",
    "EN": "Angielski",
    "FR": "Francuski",
    "DE": "Niemiecki",
    "IT": "Włoski",
    "PT": "Portugalski",
    "CA": "Kataloński",
    "GL": "Galicyjski",
    "EU": "Baskijski",
    "AR": "Arabski",
    "ZH": "Chiński",
    "RU": "Rosyjski",
    "NL": "Holenderski",
    "PL": "Polski",
    "TR": "Turecki",
    "CS": "Czeski",
    "SV": "Szwedzki",
    "UK": "Ukraiński",
    "HI": "Hindi",
    "KO": "Koreański",
    "JA": "Japoński",
    "VI": "Wietnamski",
    "TH": "Tajski",
    "FA": "Perski"
  },
  "tr": {
    "ES": "İspanyolca",
    "EN": "İngilizce",
    "FR": "Fransızca",
    "DE": "Almanca",
    "IT": "İtalyanca",
    "PT": "Portekizce",
    "CA": "Katalanca",
    "GL": "Galiçyaca",
    "EU": "Baskça",
    "AR": "Arapça",
    "ZH": "Çince",
    "RU": "Rusça",
    "NL": "Felemenkçe",
    "PL": "Polonya dili",
    "TR": "Türkçe",
    "CS": "Çekçe",
    "SV": "İsveççe",
    "UK": "Ukraynaca",
    "HI": "Hintçe",
    "KO": "Korece",
    "JA": "Japonca",
    "VI": "Vietnamca",
    "TH": "Tayca",
    "FA": "Farsça"
  },
  "cs": {
    "ES": "Španělština",
    "EN": "Angličtina",
    "FR": "Francouzština",
    "DE": "Němčina",
    "IT": "Italština",
    "PT": "Portugalština",
    "CA": "Katalánština",
    "GL": "Galicijština",
    "EU": "Baskičtina",
    "AR": "Arabština",
    "ZH": "Čínština",
    "RU": "Ruština",
    "NL": "Nizozemština",
    "PL": "Polština",
    "TR": "Turečtina",
    "CS": "Čeština",
    "SV": "Švédština",
    "UK": "Ukrajinština",
    "HI": "Hindština",
    "KO": "Korejština",
    "JA": "Japonština",
    "VI": "Vietnamština",
    "TH": "Thajština",
    "FA": "Persičtina"
  },
  "sv": {
    "ES": "Spanska",
    "EN": "Engelska",
    "FR": "Franska",
    "DE": "Tyska",
    "IT": "Italienska",
    "PT": "Portugisiska",
    "CA": "Katalanska",
    "GL": "Galiciska",
    "EU": "Baskiska",
    "AR": "Arabiska",
    "ZH": "Kinesiska",
    "RU": "Ryska",
    "NL": "Nederländska",
    "PL": "Polska",
    "TR": "Turkiska",
    "CS": "Tjeckiska",
    "SV": "Svenska",
    "UK": "Ukrainska",
    "HI": "Hindi",
    "KO": "Koreanska",
    "JA": "Japanska",
    "VI": "Vietnamesiska",
    "TH": "Thailändska",
    "FA": "Persiska"
  },
  "uk": {
    "ES": "Іспанська",
    "EN": "Англійська",
    "FR": "Французька",
    "DE": "Німецька",
    "IT": "Італійська",
    "PT": "Португальська",
    "CA": "Каталонська",
    "GL": "Галісійська",
    "EU": "Баскська",
    "AR": "Арабська",
    "ZH": "Китайська",
    "RU": "Російська",
    "NL": "Нідерландська",
    "PL": "Польська",
    "TR": "Турецька",
    "CS": "Чеська",
    "SV": "Шведська",
    "UK": "Українська",
    "HI": "Хінді",
    "KO": "Корейська",
    "JA": "Японська",
    "VI": "Вʼєтнамська",
    "TH": "Тайська",
    "FA": "Перська"
  },
  "hi": {
    "ES": "स्पैनिश",
    "EN": "अंग्रेज़ी",
    "FR": "फ़्रांसीसी",
    "DE": "जर्मन",
    "IT": "इतालवी",
    "PT": "पुर्तगाली",
    "CA": "कातालान",
    "GL": "गालिशियन",
    "EU": "बास्क",
    "AR": "अरबी",
    "ZH": "चीनी",
    "RU": "रूसी",
    "NL": "डच",
    "PL": "पोलिश",
    "TR": "तुर्की",
    "CS": "चेक",
    "SV": "स्वीडिश",
    "UK": "यूक्रेनी",
    "HI": "हिन्दी",
    "KO": "कोरियाई",
    "JA": "जापानी",
    "VI": "वियतनामी",
    "TH": "थाई",
    "FA": "फ़ारसी"
  },
  "ko": {
    "ES": "스페인어",
    "EN": "영어",
    "FR": "프랑스어",
    "DE": "독일어",
    "IT": "이탈리아어",
    "PT": "포르투갈어",
    "CA": "카탈루냐어",
    "GL": "갈리시아어",
    "EU": "바스크어",
    "AR": "아랍어",
    "ZH": "중국어",
    "RU": "러시아어",
    "NL": "네덜란드어",
    "PL": "폴란드어",
    "TR": "터키어",
    "CS": "체코어",
    "SV": "스웨덴어",
    "UK": "우크라이나어",
    "HI": "힌디어",
    "KO": "한국어",
    "JA": "일본어",
    "VI": "베트남어",
    "TH": "태국어",
    "FA": "페르시아어"
  },
  "ja": {
    "ES": "スペイン語",
    "EN": "英語",
    "FR": "フランス語",
    "DE": "ドイツ語",
    "IT": "イタリア語",
    "PT": "ポルトガル語",
    "CA": "カタルーニャ語",
    "GL": "ガリシア語",
    "EU": "バスク語",
    "AR": "アラビア語",
    "ZH": "中国語",
    "RU": "ロシア語",
    "NL": "オランダ語",
    "PL": "ポーランド語",
    "TR": "トルコ語",
    "CS": "チェコ語",
    "SV": "スウェーデン語",
    "UK": "ウクライナ語",
    "HI": "ヒンディー語",
    "KO": "韓国語",
    "JA": "日本語",
    "VI": "ベトナム語",
    "TH": "タイ語",
    "FA": "ペルシア語"
  },
  "vi": {
    "ES": "Tiếng Tây Ban Nha",
    "EN": "Tiếng Anh",
    "FR": "Tiếng Pháp",
    "DE": "Tiếng Đức",
    "IT": "Tiếng Ý",
    "PT": "Tiếng Bồ Đào Nha",
    "CA": "Tiếng Catalan",
    "GL": "Tiếng Galician",
    "EU": "Tiếng Basque",
    "AR": "Tiếng Ả Rập",
    "ZH": "Tiếng Trung",
    "RU": "Tiếng Nga",
    "NL": "Tiếng Hà Lan",
    "PL": "Tiếng Ba Lan",
    "TR": "Tiếng Thổ Nhĩ Kỳ",
    "CS": "Tiếng Séc",
    "SV": "Tiếng Thụy Điển",
    "UK": "Tiếng U-krai-na",
    "HI": "Tiếng Hindi",
    "KO": "Tiếng Hàn",
    "JA": "Tiếng Nhật",
    "VI": "Tiếng Việt",
    "TH": "Tiếng Thái",
    "FA": "Tiếng Ba Tư"
  },
  "th": {
    "ES": "สเปน",
    "EN": "อังกฤษ",
    "FR": "ฝรั่งเศส",
    "DE": "เยอรมัน",
    "IT": "อิตาลี",
    "PT": "โปรตุเกส",
    "CA": "กาตาลัน",
    "GL": "กาลิเซีย",
    "EU": "บาสก์",
    "AR": "อาหรับ",
    "ZH": "จีน",
    "RU": "รัสเซีย",
    "NL": "ดัตช์",
    "PL": "โปแลนด์",
    "TR": "ตุรกี",
    "CS": "เช็ก",
    "SV": "สวีเดน",
    "UK": "ยูเครน",
    "HI": "ฮินดี",
    "KO": "เกาหลี",
    "JA": "ญี่ปุ่น",
    "VI": "เวียดนาม",
    "TH": "ไทย",
    "FA": "เปอร์เซีย"
  },
  "fa": {
    "ES": "اسپانیایی",
    "EN": "انگلیسی",
    "FR": "فرانسوی",
    "DE": "آلمانی",
    "IT": "ایتالیایی",
    "PT": "پرتغالی",
    "CA": "کاتالان",
    "GL": "گالیسیایی",
    "EU": "باسکی",
    "AR": "عربی",
    "ZH": "چینی",
    "RU": "روسی",
    "NL": "هلندی",
    "PL": "لهستانی",
    "TR": "ترکی",
    "CS": "چکی",
    "SV": "سوئدی",
    "UK": "اوکراینی",
    "HI": "هندی",
    "KO": "کره‌ای",
    "JA": "ژاپنی",
    "VI": "ویتنامی",
    "TH": "تایلندی",
    "FA": "فارسی"
  }
};
let onLanguageChangeCallbacks = [];

function setLanguage(lang) {
  if (typeof currentLang !== 'undefined') {
    currentLang = lang;
  }
  window.currentLang = lang;

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  const targetI18n = i18n[lang] || i18n['en'] || i18n['es'];
  const fallbackI18n = i18n['es'];

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = targetI18n[key] || fallbackI18n[key];
    if (val) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.hasAttribute('placeholder')) {
          el.placeholder = val;
        } else {
          el.value = val;
        }
      } else if (typeof val === 'string' && val.includes('\n')) {
        const paragraphs = val.split(/\n\n+/).filter(Boolean);
        el.innerHTML = paragraphs.map((p, idx) => {
          const content = p.replace(/\n/g, '<br>');
          return idx === 0 ? content : `<span class="desc-p-block">${content}</span>`;
        }).join('');
      } else {
        el.textContent = val;
      }
    }
  });

  if (Array.isArray(onLanguageChangeCallbacks)) {
    onLanguageChangeCallbacks.forEach(cb => {
      try { cb(lang); } catch (e) {}
    });
  }
}

// Helper para inicializar animaciones únicamente cuando el usuario hace scroll y ve el elemento por primera vez
function initScrollObserver(containerId, startFn) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (container.dataset.animStarted === 'true') return;

  const runAnimation = () => {
    if (container.dataset.animStarted === 'true') return;
    container.dataset.animStarted = 'true';
    try {
      startFn(containerId);
    } catch (e) {
      console.error('Error starting animation for ' + containerId, e);
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runAnimation();
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '150px 0px' });
    observer.observe(container);
  }

  // Garantizar el arranque de la animación tras la carga
  setTimeout(runAnimation, 600);
}

// ==========================================================================
// VECTORES SVG OFICIALES EXTRAÍDOS DIRECTAMENTE DE LA APLICACIÓN (module-triggers.js)
// ==========================================================================
const OFFICIAL_SVGS = {
  osc: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>',
  midi: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="15"></line><line x1="15" y1="3" x2="15" y2="15"></line></svg>',
  sacn: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
  keyword: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
  del: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
  search: '<svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
  folder: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>'
};

// ==========================================================================
// 1. TRANSCRIPCIÓN STREAMING REAL
// ==========================================================================
function initTranscriptionDemo(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const inputWrapper = container.querySelector('.chat-input-wrapper');
  const vumeterBox = container.querySelector('.vumeter-input-box');
  const popup = container.querySelector('.top-transcript-popup');
  const popupText = container.querySelector('.transcript-stt-text');
  const messageBubble = container.querySelector('.message-bubble');
  const actionBtn = container.querySelector('.btn-icon-orange');

  if (vumeterBox && vumeterBox.children.length === 0) {
    for (let i = 0; i < 28; i++) {
      const bar = document.createElement('div');
      bar.className = 'vumeter-bar';
      vumeterBox.appendChild(bar);
    }
  }

  const bars = vumeterBox ? vumeterBox.querySelectorAll('.vumeter-bar') : [];

  function stepCycle() {
    const langKey = getLang();
    const langData = (typeof i18n !== 'undefined' && i18n[langKey]) ? i18n[langKey] : (typeof i18n !== 'undefined' ? i18n.es : {});
    const chunks = (langData && langData.chunks) ? langData.chunks : ["la", "Hola", "Hola Mun...", "Hola Mundo"];
    const finalMsgText = (langData && langData.msgHolaMundo) ? langData.msgHolaMundo : "Hola Mundo";

    if (messageBubble) messageBubble.classList.remove('visible');
    if (popup) popup.classList.remove('visible');
    if (popupText) popupText.textContent = "";
    if (actionBtn) {
      actionBtn.classList.remove('is-recording');
      actionBtn.classList.remove('is-sending');
    }
    if (inputWrapper) inputWrapper.classList.remove('recording');
    bars.forEach(bar => bar.style.height = '4px');

    setTimeout(() => {
      if (actionBtn) actionBtn.classList.add('is-recording');
      if (inputWrapper) inputWrapper.classList.add('recording');

      const audioTimer = setInterval(() => {
        bars.forEach(bar => {
          const h = Math.floor(Math.random() * 28) + 4;
          bar.style.height = `${h}px`;
        });
      }, 70);

      if (popup) popup.classList.add('visible');
      if (popupText) popupText.textContent = chunks[0];

      setTimeout(() => {
        if (popupText) popupText.textContent = chunks[1];

        setTimeout(() => {
          if (popupText) popupText.textContent = chunks[2];

          setTimeout(() => {
            if (popupText) popupText.textContent = chunks[3];

            setTimeout(() => {
              clearInterval(audioTimer);
              bars.forEach(bar => bar.style.height = '4px');
              if (inputWrapper) inputWrapper.classList.remove('recording');
              if (actionBtn) {
                actionBtn.classList.remove('is-recording');
                actionBtn.classList.add('is-sending');
              }
              if (popup) popup.classList.remove('visible');

              setTimeout(() => {
                if (messageBubble) {
                  const msgTextEl = messageBubble.querySelector('.message-text');
                  if (msgTextEl) msgTextEl.textContent = finalMsgText;
                  messageBubble.classList.add('visible');
                }
                if (actionBtn) actionBtn.classList.remove('is-sending');

                setTimeout(stepCycle, 4500);

              }, 400);

            }, 500);

          }, 700);

        }, 700);

      }, 700);

    }, 600);
  }

  stepCycle();
}

// ==========================================================================
// 2. TRADUCCIÓN SIMULTÁNEA REAL ("SE TRANSFORMA Y BAJA")
// ==========================================================================
function initTranslationDemo(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const card1 = container.querySelector('.translation-card.user-1');
  const cardMid = container.querySelector('.translation-card.user-mid');
  const card2 = container.querySelector('.translation-card.user-2');
  const mainTextEl1 = container.querySelector('.trans-main-text-user1');
  const mainTextElMid = container.querySelector('.trans-main-text-usermid');
  const mainTextEl2 = container.querySelector('.trans-reply-text-user2');
  const subRowEl1 = card1 ? card1.querySelector('.trans-sub-row') : null;
  const subRowElMid = cardMid ? cardMid.querySelector('.trans-sub-row') : null;
  const subRowEl2 = card2 ? card2.querySelector('.trans-sub-row') : null;
  const origSubTextEl1 = card1 ? card1.querySelector('.trans-original-sub') : null;
  const origSubTextElMid = cardMid ? cardMid.querySelector('.trans-original-sub') : null;
  const origSubTextEl2 = card2 ? card2.querySelector('.trans-original-sub') : null;
  const langPillEl1 = card1 ? card1.querySelector('.lang-pill-src') : null;
  const langPillElMid = cardMid ? cardMid.querySelector('.lang-pill-src') : null;
  const langPillEl2 = card2 ? card2.querySelector('.lang-pill-src') : null;

  function cycleSequence() {
    const langKey = getLang();
    const langData = (typeof i18n !== 'undefined' && i18n[langKey]) ? i18n[langKey] : (typeof i18n !== 'undefined' ? i18n.es : {});
    const msg1Orig = langData.transTextMsg1Orig || "Sommes-nous prêts ?";
    const msg1Target = langData.transTextMsg1Target || "¿Estamos listos?";
    const msg1Lang = langData.transLang1 || "(FR)";

    const msg2Orig = langData.transTextMsg2Orig || "to infinity and beyond";
    const msg2Target = langData.transTextMsg2Target || "hasta el infinito y más allá";
    const msg2Lang = langData.transLang2 || "(EN)";

    [card1, cardMid, card2].forEach(c => {
      if (c) {
        c.classList.remove('visible');
        c.style.display = 'none';
      }
    });
    if (subRowEl1) subRowEl1.classList.remove('visible');
    if (subRowElMid) subRowElMid.classList.remove('visible');
    if (subRowEl2) subRowEl2.classList.remove('visible');

    if (mainTextEl1) {
      mainTextEl1.textContent = msg1Orig;
      mainTextEl1.classList.remove('translated', 'morphing');
    }
    if (mainTextEl2) {
      mainTextEl2.textContent = msg2Orig;
      mainTextEl2.classList.remove('translated', 'morphing');
    }

    setTimeout(() => {
      // Mostrar Mensaje 1 (Francés)
      if (card1) {
        card1.style.display = 'block';
        requestAnimationFrame(() => {
          card1.classList.add('visible');
        });
      }

      setTimeout(() => {
        if (mainTextEl1) mainTextEl1.classList.add('morphing');

        setTimeout(() => {
          if (mainTextEl1) {
            mainTextEl1.textContent = msg1Target;
            mainTextEl1.classList.remove('morphing');
            mainTextEl1.classList.add('translated');
          }
          if (origSubTextEl1) origSubTextEl1.textContent = msg1Orig;
          if (langPillEl1) langPillEl1.textContent = msg1Lang;
          if (subRowEl1) subRowEl1.classList.add('visible');

          // Mostrar Mensaje Intermedio (Carlos - SONIDO "Todo listo.")
          setTimeout(() => {
            if (cardMid) {
              cardMid.style.display = 'block';
              requestAnimationFrame(() => {
                cardMid.classList.add('visible');
              });
            }

            // Mostrar Mensaje 2 (Inglés)
            setTimeout(() => {
              if (card2) {
                card2.style.display = 'block';
                requestAnimationFrame(() => {
                  card2.classList.add('visible');
                });
              }

              setTimeout(() => {
                if (mainTextEl2) mainTextEl2.classList.add('morphing');

                setTimeout(() => {
                  if (mainTextEl2) {
                    mainTextEl2.textContent = msg2Target;
                    mainTextEl2.classList.remove('morphing');
                    mainTextEl2.classList.add('translated');
                  }
                  if (origSubTextEl2) origSubTextEl2.textContent = msg2Orig;
                  if (langPillEl2) langPillEl2.textContent = msg2Lang;
                  if (subRowEl2) subRowEl2.classList.add('visible');

                  setTimeout(cycleSequence, 5000);
                }, 180);

              }, 1400);

            }, 1500);

          }, 1200);

        }, 180);

      }, 1600);

    }, 500);
  }

  cycleSequence();
}

// ==========================================================================
// 3. EDITOR DE TRIGGERS (COREOGRAFÍA 2 FASES: FASE 1 AJUSTE NODO, FASE 2 QUIETO)
// ==========================================================================
function initTriggersDemo(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const playhead = container.querySelector('.graph-playhead-line');
  const liveIndicatorBtn = container.querySelector('.live-indicator-dot');
  const graphBox = container.querySelector('.graph-canvas-box');
  const editorCard = container.querySelector('.triggers-demo');

  const curvePath = container.querySelector('#dynamic-bezier-path');
  const inputLabel = container.querySelector('#field-label');
  const inputTime = container.querySelector('#field-time');
  const inputVal = container.querySelector('#field-val');
  const inputCurveSelect = container.querySelector('#field-curve-select');

  const nodeP2Circle = container.querySelector('#node-p2');
  const nodeP2Label = container.querySelector('#label-p2');
  const rowIntro = container.querySelector('#row-intro');
  const rowP2 = container.querySelector('#row-p2');
  const rowP2Time = container.querySelector('#row-p2 .kf-card-time');

  const playBtn = container.querySelector('.controls-group-round button[title="Play"]') || container.querySelector('.controls-group-round button:first-child');

  let phase = 1; // 1 = Ajustar Keyframe en movimiento, 2 = Keyframe quieto y reproducción
  let adjustProgress = 0; // 0 a 1
  let playheadProgress = 0; // 0 a 100
  let playCycles = 0;

  function updateGraphAndUI(p2X, p2Y) {
    if (playBtn) {
      // El botón de Play solo se ilumina en naranja en la Fase 2 (DESPUÉS de mover el keyframe)
      playBtn.classList.toggle('active-play', phase === 2);
    }
    const p2MsCalculated = Math.round((p2X / 440) * 3900);
    const p2TimeCalculated = (p2MsCalculated / 1000).toFixed(2) + 's';

    if (nodeP2Circle) {
      nodeP2Circle.setAttribute('cx', p2X);
      nodeP2Circle.setAttribute('cy', p2Y);
    }
    if (nodeP2Label) {
      nodeP2Label.setAttribute('x', p2X);
      nodeP2Label.setAttribute('y', p2Y - 10);
    }

    if (rowP2Time) {
      rowP2Time.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${p2TimeCalculated}`;
    }

    if (curvePath) {
      const c1X = 20 + (p2X - 20) * 0.4;
      const c2X = 20 + (p2X - 20) * 0.75;
      const dPath = `M 20,145 C ${c1X},145 ${c2X},${p2Y} ${p2X},${p2Y}`;
      curvePath.setAttribute('d', dPath);
    }

    if (playhead) {
      playhead.style.left = `${playheadProgress}%`;
    }

    const u = Math.max(0, Math.min(1, playheadProgress / 100));
    const P0 = 145, P1 = 145, P2 = p2Y, P3 = p2Y;
    const curY = Math.pow(1 - u, 3) * P0 + 3 * Math.pow(1 - u, 2) * u * P1 + 3 * (1 - u) * Math.pow(u, 2) * P2 + Math.pow(u, 3) * P3;
    const liveVal = Math.max(0, Math.min(1, (145 - curY) / (145 - 32)));

    const liveLedInner = container.querySelector('.live-led-inner');
    if (liveLedInner) {
      liveLedInner.style.opacity = (0.2 + liveVal * 0.8).toFixed(3);
      liveLedInner.style.transform = `scale(${(0.8 + liveVal * 0.55).toFixed(2)})`;
      liveLedInner.style.boxShadow = `0 0 ${6 + liveVal * 18}px #FF6B35, 0 0 ${12 + liveVal * 24}px rgba(255, 107, 53, 0.6)`;
    }

    if (liveIndicatorBtn) {
      liveIndicatorBtn.style.borderColor = `rgba(255, 107, 53, ${0.2 + liveVal * 0.65})`;
    }

    if (graphBox) {
      const alphaVal = (0.05 + liveVal * 0.28).toFixed(3);
      graphBox.style.backgroundColor = `rgba(180, 50, 20, ${alphaVal})`;
      graphBox.style.borderColor = `rgba(255, 107, 53, ${0.12 + liveVal * 0.48})`;
    }

    const p2Pct = (p2X / 440) * 100;
    const isP2Active = phase === 1 || Math.abs(playheadProgress - p2Pct) < 35 || playheadProgress > 45;

    if (rowIntro) rowIntro.classList.toggle('active-kf-card', !isP2Active);
    if (rowP2) rowP2.classList.toggle('active-kf-card', isP2Active);
    if (nodeP2Circle) nodeP2Circle.classList.toggle('active-node', isP2Active);

    if (isP2Active) {
      if (inputLabel) inputLabel.value = 'Punto 2';
      if (inputTime) inputTime.value = String(p2MsCalculated);
      if (inputVal) inputVal.value = liveVal.toFixed(2);
      if (inputCurveSelect) inputCurveSelect.value = 'Bezier';
    } else {
      if (inputLabel) inputLabel.value = 'Intro';
      if (inputTime) inputTime.value = '0';
      if (inputVal) inputVal.value = '0.00';
      if (inputCurveSelect) inputCurveSelect.value = 'Lineal';
    }
  }

  function loopAnimation() {
    if (phase === 1) {
      // FASE 1: MOVER Y AJUSTAR EL KEYFRAME (Punto 2 se desplaza suavemente de x:260, y:110 a x:410, y:32)
      adjustProgress += 0.01;
      if (adjustProgress >= 1) {
        adjustProgress = 1;
        phase = 2; // Iniciar Fase 2 con el keyframe completamente quieto
        playheadProgress = 0;
        playCycles = 0;
      }

      const easeT = 0.5 - Math.cos(adjustProgress * Math.PI) / 2;
      const curX = 260 + (410 - 260) * easeT;
      const curY = 110 + (32 - 110) * easeT;
      playheadProgress = (curX / 440) * 100;

      updateGraphAndUI(curX, curY);

    } else if (phase === 2) {
      // FASE 2: KEYFRAME COMPLETAMENTE QUIETO EN (x: 410, y: 32) Y REPRODUCCIÓN EN BUCLE DE LA AGUJA
      const fixedX = 410;
      const fixedY = 32;

      playheadProgress += 0.65;
      if (playheadProgress > 100) {
        playheadProgress = 0;
        playCycles++;
        if (playCycles >= 2) {
          // Tras 2 reproducciones completas con el keyframe quieto, reiniciar a la Fase 1
          phase = 1;
          adjustProgress = 0;
        }
      }

      updateGraphAndUI(fixedX, fixedY);
    }

    requestAnimationFrame(loopAnimation);
  }

  requestAnimationFrame(loopAnimation);
}

// ==========================================================================
// 4. FILTROS DINÁMICOS POR CATEGORÍA (MULTISELECCIÓN + REANUDACIÓN AUTOMÁTICA)
// ==========================================================================
function initFilterDemo(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const btnAll = container.querySelector('.filter-btn-pill.pill-all');
  const btnProd = container.querySelector('.filter-btn-pill.pill-prod');
  const btnLuz = container.querySelector('.filter-btn-pill.pill-luz');
  const btnSonido = container.querySelector('.filter-btn-pill.pill-sonido');

  const item1 = container.querySelector('.filter-card-item.item-1');
  const item2 = container.querySelector('.filter-card-item.item-2');
  const item3 = container.querySelector('.filter-card-item.item-3');

  let autoTimer = null;
  let resumeTimer = null;
  let currentStepIndex = 0;
  let isUserInteracting = false;

  // Estado de los filtros activos (multiselección)
  const activeCategories = new Set(['all']);

  function syncUIFromActiveSet() {
    // Si 'all' está presente o el Set está vacío, activar 'TODOS'
    if (activeCategories.has('all') || activeCategories.size === 0) {
      if (btnAll) btnAll.classList.add('active');
      if (btnProd) btnProd.classList.remove('active');
      if (btnLuz) btnLuz.classList.remove('active');
      if (btnSonido) btnSonido.classList.remove('active');

      if (item1) item1.classList.remove('hidden-filter');
      if (item2) item2.classList.remove('hidden-filter');
      if (item3) item3.classList.remove('hidden-filter');
      return;
    }

    if (btnAll) btnAll.classList.remove('active');

    const showProd = activeCategories.has('prod');
    const showLuz = activeCategories.has('luz');
    const showSonido = activeCategories.has('sonido');

    if (btnProd) btnProd.classList.toggle('active', showProd);
    if (btnLuz) btnLuz.classList.toggle('active', showLuz);
    if (btnSonido) btnSonido.classList.toggle('active', showSonido);

    if (item1) item1.classList.toggle('hidden-filter', !showProd);
    if (item2) item2.classList.toggle('hidden-filter', !showLuz);
    if (item3) item3.classList.toggle('hidden-filter', !showSonido);
  }

  function handleUserClick(category) {
    // Pausar bucle automático temporalmente
    clearTimeout(autoTimer);
    clearTimeout(resumeTimer);
    isUserInteracting = true;

    if (category === 'all') {
      activeCategories.clear();
      activeCategories.add('all');
    } else {
      activeCategories.delete('all');
      if (activeCategories.has(category)) {
        activeCategories.delete(category);
      } else {
        activeCategories.add(category);
      }
      if (activeCategories.size === 0) {
        activeCategories.add('all');
      }
    }

    syncUIFromActiveSet();

    // Reanudar la animación automáticamente tras 4 segundos de inactividad
    resumeTimer = setTimeout(() => {
      isUserInteracting = false;
      runAutoSequence();
    }, 4000);
  }

  if (btnAll) btnAll.onclick = () => handleUserClick('all');
  if (btnProd) btnProd.onclick = () => handleUserClick('prod');
  if (btnLuz) btnLuz.onclick = () => handleUserClick('luz');
  if (btnSonido) btnSonido.onclick = () => handleUserClick('sonido');

  // Pasos de la animación automática
  const steps = [
    { categories: ['all'] },
    { categories: ['prod'] },
    { categories: ['luz'] },
    { categories: ['sonido'] },
    { categories: ['prod', 'sonido'] },
    { categories: ['luz', 'sonido'] }
  ];

  function runAutoSequence() {
    if (isUserInteracting) return;

    const step = steps[currentStepIndex];
    activeCategories.clear();
    step.categories.forEach(c => activeCategories.add(c));
    syncUIFromActiveSet();

    currentStepIndex = (currentStepIndex + 1) % steps.length;
    autoTimer = setTimeout(runAutoSequence, 2400);
  }

  runAutoSequence();
}

// ==========================================================================
// 5. PROTOCOLOS DE CONTROL Y TIMECODE (LTC LIVE, OSC, MIDI, sACN)
// ==========================================================================
function initProtocolosDemo(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const tabOsc = container.querySelector('.tab-osc');
  const tabMidi = container.querySelector('.tab-midi');
  const tabSacn = container.querySelector('.tab-sacn');
  const tabTc = container.querySelector('.tab-tc');

  const panelOsc = container.querySelector('.panel-osc');
  const panelMidi = container.querySelector('.panel-midi');
  const panelSacn = container.querySelector('.panel-sacn');
  const panelTc = container.querySelector('.panel-tc');

  const ltcCounter = container.querySelector('#ltc-live-counter');
  const ltcDot = container.querySelector('#ltc-live-status-dot');

  const tabs = [
    { btn: tabTc, panel: panelTc, id: 'tc' },
    { btn: tabOsc, panel: panelOsc, id: 'osc' },
    { btn: tabMidi, panel: panelMidi, id: 'midi' },
    { btn: tabSacn, panel: panelSacn, id: 'sacn' }
  ];

  function activateTab(tabId) {
    tabs.forEach(t => {
      const isActive = t.id === tabId;
      if (t.btn) t.btn.classList.toggle('active', isActive);
      if (t.panel) t.panel.classList.toggle('active', isActive);
    });
  }

  tabs.forEach(t => {
    if (t.btn) {
      t.btn.addEventListener('click', () => activateTab(t.id));
    }
  });

  let framesTotal = 3740;

  setInterval(() => {
    framesTotal++;
    const ff = framesTotal % 25;
    const totalSecs = Math.floor(framesTotal / 25);
    const ss = totalSecs % 60;
    const totalMins = Math.floor(totalSecs / 60);
    const mm = totalMins % 60;
    const hh = Math.floor(totalMins / 60) % 24;

    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${pad(hh)}:${pad(mm)}:${pad(ss)}:${pad(ff)}`;

    if (ltcCounter) ltcCounter.textContent = timeStr;

    if (ltcDot) {
      ltcDot.style.opacity = (ff % 2 === 0) ? '1' : '0.4';
    }
  }, 40);

  let currentTabIndex = 0;

  function cycleProtocolTabs() {
    activateTab(tabs[currentTabIndex].id);

    currentTabIndex = (currentTabIndex + 1) % tabs.length;
    setTimeout(cycleProtocolTabs, 3500);
  }

  cycleProtocolTabs();
}

// ==========================================================================
// 6. SISTEMA DE ALERTAS (DESTELLO PANTALLA NARANJA, VIBRACIÓN HÁPTICA Y LINTERNA LED)
// ==========================================================================
function initAlertasDemo(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const card1 = container.querySelector('#alert-row-1');
  const card2 = container.querySelector('#alert-row-2');
  const card3 = container.querySelector('#alert-row-3');

  const toggle1 = container.querySelector('#alert-toggle-1');
  const toggle2 = container.querySelector('#alert-toggle-2');
  const toggle3 = container.querySelector('#alert-toggle-3');

  const flashlightCircle = container.querySelector('#flashlight-circle');

  function setRowState(card, toggle, isOn) {
    if (card) card.classList.toggle('active-alert-row', isOn);
    if (toggle) {
      toggle.classList.toggle('is-on', isOn);
      toggle.classList.toggle('is-off', !isOn);
      toggle.textContent = isOn ? 'ON' : 'OFF';
    }
  }

  function updateVisualEffects(isRow1On, isRow2On, isRow3On) {
    container.classList.toggle('effect-screen-flash', isRow1On);
    if (card2) card2.classList.toggle('effect-vibrate-haptic', isRow2On);
    if (flashlightCircle) flashlightCircle.classList.toggle('active', isRow3On);
  }

  function cycleAlertsSequence() {
    setRowState(card1, toggle1, true);
    setRowState(card2, toggle2, false);
    setRowState(card3, toggle3, false);
    updateVisualEffects(true, false, false);

    setTimeout(() => {
      setRowState(card1, toggle1, false);
      setRowState(card2, toggle2, true);
      setRowState(card3, toggle3, false);
      updateVisualEffects(false, true, false);

      setTimeout(() => {
        setRowState(card1, toggle1, false);
        setRowState(card2, toggle2, false);
        setRowState(card3, toggle3, true);
        updateVisualEffects(false, false, true);

        setTimeout(() => {
          setRowState(card1, toggle1, true);
          setRowState(card2, toggle2, true);
          setRowState(card3, toggle3, true);
          updateVisualEffects(true, true, true);

          setTimeout(() => {
            cycleAlertsSequence();

          }, 3000);

        }, 3000);

      }, 3000);

    }, 3000);
  }

  cycleAlertsSequence();
}

// ==========================================================================
// 7. GESTOR DE TRIGGERS IN-OUT (SIN 'DONDE ESTAS RS' EN OUT)
// ==========================================================================
function initTriggerInOutDemo(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const tabOut = container.querySelector('#tab-trigger-out');
  const tabIn = container.querySelector('#tab-trigger-in');
  const listContainer = container.querySelector('.triggers-inout-list');
  const masterToggleFlat = container.querySelector('.master-toggle-flat');

  const triggersOUT = [
    { title: '01 Intro+Mezu Bat', quote: '"Intro+Mezu Bat TC"', proto: 'OSC', badgeClass: 'proto-badge-osc', svgIcon: OFFICIAL_SVGS.osc, target: 'localhost:9000', defaultOn: false },
    { title: '02 ALESARDUI', quote: '"ALESARDUI TC"', proto: 'OSC', badgeClass: 'proto-badge-osc', svgIcon: OFFICIAL_SVGS.osc, target: 'localhost:9000', defaultOn: true },
    { title: '03 FRIO', quote: '"FRIO TC"', proto: 'sACN', badgeClass: 'proto-badge-sacn', svgIcon: OFFICIAL_SVGS.sacn, target: 'Univ 1 - Ch 01', defaultOn: false },
    { title: 'FIN ACTO 1', quote: '"DISPARO NOTA C3 TECLADO"', proto: 'MIDI', badgeClass: 'proto-badge-midi', svgIcon: OFFICIAL_SVGS.midi, target: 'Ch 1 | Note:60', defaultOn: true }
  ];

  const triggersIN = [
    { title: 'SENSOR MOVIMIENTO', quote: '"SENSOR ENTRADA ESCENARIO"', proto: 'MIDI', badgeClass: 'proto-badge-midi', svgIcon: OFFICIAL_SVGS.midi, target: 'Ch 2 | Note:64', defaultOn: true },
    { title: 'MICRO ALERTA PROD', quote: '"VOZ COMANDO SALA"', proto: 'OSC', badgeClass: 'proto-badge-osc', svgIcon: OFFICIAL_SVGS.osc, target: '/trigger/voice', defaultOn: true },
    { title: 'CONSOLA DMX INPUT', quote: '"FADER MAESTRO TEATRO"', proto: 'sACN', badgeClass: 'proto-badge-sacn', svgIcon: OFFICIAL_SVGS.sacn, target: 'Univ 2 - Ch 001', defaultOn: false },
    { title: 'BOTONERA AUXILIAR', quote: '"TECLA ACCESO RAPIDO"', proto: 'MIDI', badgeClass: 'proto-badge-midi', svgIcon: OFFICIAL_SVGS.midi, target: 'Ch 1 | CC:10', defaultOn: false }
  ];

  function renderTriggerList(dataArray, activeStateArray) {
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const anyOn = activeStateArray.some(val => val === true);
    if (masterToggleFlat) {
      masterToggleFlat.classList.toggle('is-on', anyOn);
    }

    dataArray.forEach((item, index) => {
      const isOn = activeStateArray ? activeStateArray[index] : item.defaultOn;
      const card = document.createElement('div');
      card.className = `trigger-item-card ${isOn ? 'active-trigger-row' : ''}`;
      card.id = `trig-card-${index + 1}`;

      card.innerHTML = `
        <div class="trigger-item-left">
          <div class="alert-pill-toggle ${isOn ? 'is-on' : 'is-off'}" id="trig-toggle-${index + 1}">${isOn ? 'ON' : 'OFF'}</div>
          <div class="trigger-item-info">
            <div class="trigger-title-row">
              <span class="trigger-title-text">${item.title}</span>
              <div class="trigger-quote-row">
                ${OFFICIAL_SVGS.keyword}
                <span>${item.quote}</span>
              </div>
            </div>
            <div class="trigger-meta-row">
              <span class="${item.badgeClass}">${item.svgIcon} ${item.proto}</span>
              <span class="trigger-target-ip">${item.target}</span>
            </div>
          </div>
        </div>
        <div class="trash-btn-box" title="Eliminar">${OFFICIAL_SVGS.del}</div>
      `;
      listContainer.appendChild(card);
    });
  }

  function setTabActive(isOutActive) {
    if (tabOut) tabOut.classList.toggle('active', isOutActive);
    if (tabIn) tabIn.classList.toggle('active', !isOutActive);
  }

  function cycleTriggerSequence() {
    setTabActive(true);
    renderTriggerList(triggersOUT, [false, true, false, true]);

    setTimeout(() => {
      renderTriggerList(triggersOUT, [true, true, false, true]);

      setTimeout(() => {
        renderTriggerList(triggersOUT, [false, false, false, false]);

        setTimeout(() => {
          setTabActive(false);
          renderTriggerList(triggersIN, [true, true, false, false]);

          setTimeout(() => {
            renderTriggerList(triggersIN, [true, true, false, true]);

            setTimeout(() => {
              cycleTriggerSequence();

            }, 2600);

          }, 2600);

        }, 2600);

      }, 2600);

    }, 2600);
  }

  cycleTriggerSequence();
}

// ==========================================================================
// 8. GESTIÓN DE MOTORES (LIMPIO SIN BURBUJA DE CHAT)
// ==========================================================================
function initMotoresDemo(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const toggleAuto = container.querySelector('#tgl-trad-auto');
  const toggleOrig = container.querySelector('#tgl-trad-orig');

  const pillEN = container.querySelector('#pill-lang-en');
  const pillFR = container.querySelector('#pill-lang-fr');
  const pillIT = container.querySelector('#pill-lang-it');
  const pillJA = container.querySelector('#pill-lang-ja');

  const dictInput = container.querySelector('#dict-input-word');
  const addBtn = container.querySelector('#btn-add-word');
  const tagsContainer = container.querySelector('#dict-tags-list');

  const initialWords = ['Fadder', 'Master', 'mutea', 'mute', 'mutear'];

  function renderTags(wordsArray) {
    if (!tagsContainer) return;
    tagsContainer.innerHTML = '';
    wordsArray.forEach(word => {
      const tag = document.createElement('div');
      tag.className = 'protected-tag-pill';
      tag.id = `tag-${word}`;
      tag.innerHTML = `<span>${word}</span> <span class="protected-tag-del">✕</span>`;
      tagsContainer.appendChild(tag);
    });
  }

  function setToggleState(toggleEl, isOn) {
    if (!toggleEl) return;
    toggleEl.classList.toggle('is-on', isOn);
    toggleEl.classList.toggle('is-off', !isOn);
    toggleEl.textContent = isOn ? 'ON' : 'OFF';
  }

  function typeTextToInput(text, callback) {
    if (!dictInput) return;
    dictInput.value = '';
    dictInput.classList.add('typing');
    let idx = 0;
    const interval = setInterval(() => {
      dictInput.value += text[idx];
      idx++;
      if (idx >= text.length) {
        clearInterval(interval);
        setTimeout(() => {
          dictInput.classList.remove('typing');
          if (callback) callback();
        }, 300);
      }
    }, 120);
  }

  function startAnimationCycle() {
    setToggleState(toggleAuto, true);
    setToggleState(toggleOrig, true);
    let currentWords = [...initialWords];
    renderTags(currentWords);

    if (pillIT) pillIT.classList.remove('active');
    if (pillFR) pillFR.classList.add('active');

    setTimeout(() => {
      typeTextToInput('Standby', () => {
        if (addBtn) addBtn.classList.add('pressed');

        setTimeout(() => {
          if (addBtn) addBtn.classList.remove('pressed');
          if (dictInput) dictInput.value = '';

          currentWords.push('Standby');
          renderTags(currentWords);

          const newTag = container.querySelector('#tag-Standby');
          if (newTag) {
            newTag.classList.add('entering');
            setTimeout(() => newTag.classList.remove('entering'), 50);
          }

          setTimeout(() => {
            const tagToDelete = container.querySelector('#tag-mutea');
            if (tagToDelete) {
              tagToDelete.classList.add('exiting');
            }

            setTimeout(() => {
              currentWords = currentWords.filter(w => w !== 'mutea');
              renderTags(currentWords);

              setTimeout(() => {
                setToggleState(toggleOrig, false);

                setTimeout(() => {
                  setToggleState(toggleOrig, true);

                  setTimeout(() => {
                    if (pillIT) pillIT.classList.add('active');

                    setTimeout(() => {
                      startAnimationCycle();

                    }, 2800);

                  }, 2400);

                }, 2400);

              }, 2000);

            }, 400);

          }, 2200);

        }, 300);
      });

    }, 1000);
  }

  startAnimationCycle();
}

// ==========================================================================
// 9. IDIOMA Y VOZ (DICCIONARIOS INDEPENDIENTES DE PALABRAS DIFÍCILES POR IDIOMA)
// ==========================================================================
function initIdiomaVozDemo(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const titleHeader = container.querySelector('#stt-section-header');

  const langPills = {
    es: container.querySelector('#stt-ui-es'),
    en: container.querySelector('#stt-ui-en'),
    fr: container.querySelector('#stt-ui-fr'),
    it: container.querySelector('#stt-ui-it'),
    ja: container.querySelector('#stt-ui-ja')
  };

  const inputBad = container.querySelector('#stt-field-bad');
  const inputGood = container.querySelector('#stt-field-good');
  const addBtn = container.querySelector('#stt-btn-add');
  const tagsContainer = container.querySelector('#stt-corrections-list');

  const dictionaries = {
    es: {
      headerText: "TRANSCRIPCIÓN IA (ES)",
      pairs: [
        { bad: 'inter feliz', good: 'Interface' },
        { bad: 'yo de y', good: 'Hodei' },
        { bad: 'miquel', good: 'Mikel' },
        { bad: 'Mute a', good: 'mutea' },
        { bad: 've gi', good: 'Begi' },
        { bad: 'berry', good: 'Begi' }
      ],
      newPair: { bad: 'hay fon', good: 'iphone' },
      deleteTarget: 'Mute a'
    },
    en: {
      headerText: "AI TRANSCRIPTION (EN)",
      pairs: [
        { bad: 'i phone', good: 'iPhone' },
        { bad: 'fade er', good: 'fader' },
        { bad: 'sac n', good: 'sACN' },
        { bad: 'cross fade', good: 'Crossfade' },
        { bad: 'stand by', good: 'Standby' }
      ],
      newPair: { bad: 'light key', good: 'Lighting Cue' },
      deleteTarget: 'fade er'
    },
    fr: {
      headerText: "TRANSCRIPTION IA (FR)",
      pairs: [
        { bad: 'fond de scène', good: 'Cyc' },
        { bad: 'projecteur', good: 'Projecteur' },
        { bad: 'fondu enchaîné', good: 'Crossfade' },
        { bad: 'micro sans fil', good: 'HF' }
      ],
      newPair: { bad: 'régie son', good: 'Régie' },
      deleteTarget: 'fond de scène'
    },
    it: {
      headerText: "TRASCRIZIONE IA (IT)",
      pairs: [
        { bad: 'regia luci', good: 'Régie' },
        { bad: 'microfono', good: 'Mic' },
        { bad: 'sfumatura', good: 'Fader' },
        { bad: 'segnale tempo', good: 'Timecode' }
      ],
      newPair: { bad: 'effetto speciale', good: 'FX' },
      deleteTarget: 'microfono'
    },
    ja: {
      headerText: "AI 文字起こし (JA)",
      pairs: [
        { bad: 'フェーダー', good: 'Fader' },
        { bad: 'シーケンス', good: 'Sequence' },
        { bad: 'タイムコード', good: 'Timecode' },
        { bad: 'ミュート', good: 'Mute' }
      ],
      newPair: { bad: 'マスター', good: 'Master' },
      deleteTarget: 'シーケンス'
    }
  };

  let activeLang = 'es';
  let activePairs = [...dictionaries.es.pairs];

  function setActiveLangPill(langCode) {
    activeLang = langCode;
    Object.keys(langPills).forEach(key => {
      if (langPills[key]) {
        langPills[key].classList.toggle('active', key === langCode);
      }
    });

    if (titleHeader) {
      titleHeader.textContent = dictionaries[langCode].headerText;
    }

    activePairs = [...dictionaries[langCode].pairs];
    renderCorrectionPills(activePairs);
  }

  Object.keys(langPills).forEach(key => {
    if (langPills[key]) {
      langPills[key].addEventListener('click', () => {
        setActiveLangPill(key);
      });
    }
  });

  function renderCorrectionPills(pairsArray) {
    if (!tagsContainer) return;
    tagsContainer.innerHTML = '';
    pairsArray.forEach((item, index) => {
      const pill = document.createElement('div');
      pill.className = 'stt-correction-pill';
      pill.id = `stt-pill-${index}`;
      pill.innerHTML = `
        <span class="stt-bad-word">${item.bad}</span>
        <span class="stt-good-word">${item.good}</span>
        <span class="stt-pill-del">✕</span>
      `;
      tagsContainer.appendChild(pill);
    });
  }

  function typeTextPair(badText, goodText, callback) {
    if (!inputBad || !inputGood) return;
    inputBad.value = '';
    inputGood.value = '';
    inputBad.classList.add('typing');

    let idx1 = 0;
    const interval1 = setInterval(() => {
      inputBad.value += badText[idx1];
      idx1++;
      if (idx1 >= badText.length) {
        clearInterval(interval1);
        inputBad.classList.remove('typing');

        setTimeout(() => {
          inputGood.classList.add('typing');
          let idx2 = 0;
          const interval2 = setInterval(() => {
            inputGood.value += goodText[idx2];
            idx2++;
            if (idx2 >= goodText.length) {
              clearInterval(interval2);
              inputGood.classList.remove('typing');
              setTimeout(callback, 300);
            }
          }, 100);
        }, 250);
      }
    }, 100);
  }

  const langOrder = ['es', 'en', 'fr', 'it', 'ja'];
  let currentLangIdx = 0;

  function runLanguageCycle() {
    const langCode = langOrder[currentLangIdx];
    setActiveLangPill(langCode);

    const langData = dictionaries[langCode];

    setTimeout(() => {
      typeTextPair(langData.newPair.bad, langData.newPair.good, () => {
        if (addBtn) addBtn.classList.add('pressed');

        setTimeout(() => {
          if (addBtn) addBtn.classList.remove('pressed');
          if (inputBad) inputBad.value = '';
          if (inputGood) inputGood.value = '';

          activePairs.push(langData.newPair);
          renderCorrectionPills(activePairs);

          const addedPill = tagsContainer.lastElementChild;
          if (addedPill) {
            addedPill.classList.add('entering');
            setTimeout(() => addedPill.classList.remove('entering'), 50);
          }

          setTimeout(() => {
            const pillToDelete = Array.from(tagsContainer.children).find(el => el.querySelector('.stt-bad-word')?.textContent === langData.deleteTarget);
            if (pillToDelete) {
              pillToDelete.classList.add('exiting');
            }

            setTimeout(() => {
              activePairs = activePairs.filter(p => p.bad !== langData.deleteTarget);
              renderCorrectionPills(activePairs);

              setTimeout(() => {
                currentLangIdx = (currentLangIdx + 1) % langOrder.length;
                runLanguageCycle();

              }, 2200);

            }, 400);

          }, 2200);

        }, 300);
      });

    }, 1200);
  }

  runLanguageCycle();
}

// ==========================================================================
// 10. MOTORES DE VOZ ELÁSTICOS (ANIMACIÓN INTERACTIVA DE MODELOS OFFLINE VOSK)
// ==========================================================================
const VOICE_MODELS_DATA = [
  { code: 'ES', name: 'Español', size: '40 MB', installed: true },
  { code: 'FR', name: 'Francés', size: '40 MB', installed: true },
  { code: 'EN', name: 'Inglés', size: '40 MB', installed: true },
  { code: 'IT', name: 'Italiano', size: '40 MB', installed: true },
  { code: 'JA', name: 'Japonés', size: '40 MB', installed: true },
  { code: 'DE', name: 'Alemán', size: '40 MB', installed: false },
  { code: 'EU', name: 'Euskera', size: '40 MB', installed: false },
  { code: 'AR', name: 'Árabe', size: '40 MB', installed: false },
  { code: 'ZH', name: 'Chino (Mandarín)', size: '52 MB', installed: false },
  { code: 'RU', name: 'Ruso', size: '45 MB', installed: false },
  { code: 'PT', name: 'Portugués', size: '38 MB', installed: false },
  { code: 'NL', name: 'Holandés', size: '42 MB', installed: false },
  { code: 'PL', name: 'Polaco', size: '40 MB', installed: false },
  { code: 'TR', name: 'Turco', size: '39 MB', installed: false },
  { code: 'CS', name: 'Checo', size: '38 MB', installed: false },
  { code: 'SV', name: 'Sueco', size: '41 MB', installed: false },
  { code: 'UK', name: 'Ucraniano', size: '44 MB', installed: false },
  { code: 'CA', name: 'Catalán', size: '37 MB', installed: false },
  { code: 'GL', name: 'Gallego', size: '36 MB', installed: false },
  { code: 'HI', name: 'Hindi', size: '48 MB', installed: false },
  { code: 'KO', name: 'Coreano', size: '50 MB', installed: false },
  { code: 'VI', name: 'Vietnamita', size: '43 MB', installed: false },
  { code: 'TH', name: 'Tailandés', size: '46 MB', installed: false },
  { code: 'FA', name: 'Persa', size: '41 MB', installed: false }
];

function initVoiceEnginesDemo(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const listContainer = container.querySelector('#vm-models-list');
  const searchInput = container.querySelector('#vm-search-input');
  if (!listContainer) return;

  let modelsState = JSON.parse(JSON.stringify(VOICE_MODELS_DATA));
  onLanguageChangeCallbacks.push(() => renderModels(searchInput ? searchInput.value : ''));

    function renderModels(filterText = '') {
    listContainer.innerHTML = '';
    const query = filterText.toLowerCase().trim();

    const langKey = getLang();
    const filtered = modelsState.filter(m => {
      const localizedName = (LANG_NAMES[langKey] && LANG_NAMES[langKey][m.code]) || m.name;
      return localizedName.toLowerCase().includes(query) || m.code.toLowerCase().includes(query);
    });

    const activeI18n = i18n[langKey] || i18n['es'];
    const textInstalled = activeI18n.btnInstalled || 'INSTALADO';
    const textDownload = activeI18n.btnDownload || 'Descargar';
    const textCancel = activeI18n.btnCancel || '✕ Cancelar';

    filtered.forEach(m => {
      const item = document.createElement('div');
      item.className = 'vm-model-item';
      item.dataset.code = m.code;

      const displayName = (LANG_NAMES[langKey] && LANG_NAMES[langKey][m.code]) || m.name;

      if (m.downloading) {
        const bytesVal = (m.progress * 0.995).toFixed(1);
        item.innerHTML = `
          <div class="vm-model-info">
            <div class="vm-badge">${m.code}</div>
            <div class="vm-model-details">
              <span class="vm-model-name">${displayName}</span>
              <span class="vm-model-meta">Vosk • ${m.size}</span>
            </div>
          </div>

          <div class="vm-download-progress-container">
            <div class="vm-download-stats">
              <span class="vm-download-speed">46.9 MB/s</span>
              <span class="vm-download-bytes">${bytesVal} MB / 99.5 MB</span>
            </div>
            <div class="vm-progress-track">
              <div class="vm-progress-fill" style="width: ${m.progress}%;"></div>
            </div>
          </div>

          <button class="vm-btn-cancel">${textCancel}</button>
        `;
      } else {
        let btnHtml = '';
        if (m.installed) {
          btnHtml = `<button class="vm-btn-installed" title="Haz clic para desinstalar">${textInstalled}</button>`;
        } else {
          btnHtml = `<button class="vm-btn-download">${textDownload}</button>`;
        }

        item.innerHTML = `
          <div class="vm-model-info">
            <div class="vm-badge">${m.code}</div>
            <div class="vm-model-details">
              <span class="vm-model-name">${displayName}</span>
              <span class="vm-model-meta">Vosk • ${m.size}</span>
            </div>
          </div>
          ${btnHtml}
        `;
      }

      const btn = item.querySelector('button');
      if (btn) {
        btn.onclick = () => {
          if (m.installed) {
            m.installed = false;
            renderModels(searchInput ? searchInput.value : '');
          } else if (m.downloading) {
            m.downloading = false;
            m.progress = 0;
            renderModels(searchInput ? searchInput.value : '');
          } else {
            m.downloading = true;
            m.progress = 10;
            renderModels(searchInput ? searchInput.value : '');
            const interval = setInterval(() => {
              m.progress += 30;
              if (m.progress >= 100) {
                clearInterval(interval);
                m.downloading = false;
                m.installed = true;
                renderModels(searchInput ? searchInput.value : '');
              } else {
                renderModels(searchInput ? searchInput.value : '');
              }
            }, 600);
          }
        };
      }

      listContainer.appendChild(item);
    });
  }

  function runDemoChoreography() {
    modelsState = JSON.parse(JSON.stringify(VOICE_MODELS_DATA));
    if (searchInput) searchInput.value = '';
    renderModels();

    setTimeout(() => {
      const langKey = getLang();
      const textToType = (LANG_NAMES[langKey] && LANG_NAMES[langKey]['EU']) || 'Euskera';
      let charIdx = 0;
      if (searchInput) searchInput.classList.add('active-typing');

      const typeInterval = setInterval(() => {
        if (charIdx < textToType.length) {
          charIdx++;
          if (searchInput) searchInput.value = textToType.substring(0, charIdx);
          renderModels(textToType.substring(0, charIdx));
        } else {
          clearInterval(typeInterval);
          if (searchInput) searchInput.classList.remove('active-typing');

          setTimeout(() => {
            const euskeraModel = modelsState.find(m => m.code === 'EU');
            if (euskeraModel) {
              euskeraModel.downloading = true;
              euskeraModel.progress = 25;
              renderModels(textToType);

              setTimeout(() => {
                euskeraModel.progress = 65;
                renderModels(textToType);

                setTimeout(() => {
                  euskeraModel.progress = 95;
                  renderModels(textToType);

                  setTimeout(() => {
                    euskeraModel.downloading = false;
                    euskeraModel.installed = true;
                    renderModels(textToType);

                    setTimeout(() => {
                      let backIdx = textToType.length;
                      if (searchInput) searchInput.classList.add('active-typing');
                      const backInterval = setInterval(() => {
                        if (backIdx > 0) {
                          backIdx--;
                          if (searchInput) searchInput.value = textToType.substring(0, backIdx);
                          renderModels(textToType.substring(0, backIdx));
                        } else {
                          clearInterval(backInterval);
                          if (searchInput) searchInput.classList.remove('active-typing');

                          setTimeout(() => {
                            listContainer.scrollTop = 100;

                            setTimeout(() => {
                              const deModel = modelsState.find(m => m.code === 'DE');
                              if (deModel) {
                                deModel.downloading = true;
                                deModel.progress = 40;
                                renderModels();

                                setTimeout(() => {
                                  deModel.downloading = false;
                                  deModel.installed = true;
                                  renderModels();

                                  setTimeout(() => {
                                    const jaModel = modelsState.find(m => m.code === 'JA');
                                    if (jaModel) {
                                      jaModel.installed = false;
                                      renderModels();
                                    }

                                    setTimeout(runDemoChoreography, 4000);

                                  }, 1500);

                                }, 1200);
                              }
                            }, 1200);

                          }, 1500);
                        }
                      }, 100);

                    }, 2000);

                  }, 400);

                }, 400);

              }, 400);
            }

          }, 1200);
        }
      }, 150);

    }, 1500);
  }

  runDemoChoreography();
}

// ==========================================================================
// 11. MODOS DE ENVÍO DE AUDIO (ANIMACIÓN DE PTT & UMBRAL AUTOMÁTICO DE VOLUMEN)
// ==========================================================================
function initAudioModesDemo(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const selectContainer = container.querySelector('#mic-select-container');
  const selectDropdown = container.querySelector('#mic-select-dropdown');
  const modeDisplay = container.querySelector('#mic-mode-display');
  const modeTag = container.querySelector('#tx-mode-tag');
  const statusPill = container.querySelector('#tx-status-pill');
  const statusText = container.querySelector('#tx-status-text');

  const levelSectionLabel = container.querySelector('#level-section-label');
  const fillBar = container.querySelector('#threshold-fill-bar');
  const greenLine = container.querySelector('#threshold-green-line');
  const thresholdValText = container.querySelector('#threshold-val-text');

  const pttBox = container.querySelector('#ptt-action-box');
  const pttButton = container.querySelector('#ptt-big-button');
  const pttLabel = container.querySelector('#ptt-btn-label');

  const optPtt = container.querySelector('#opt-ptt');
  const optAuto = container.querySelector('#opt-auto');

  if (!fillBar) return;

  let currentThreshold = 55; // 55%

  function setTransmissionState(isTransmitting) {
    if (!statusPill) return;
    const langKey = getLang();
    const langObj = (typeof i18n !== 'undefined' && i18n[langKey]) ? i18n[langKey] : (typeof i18n !== 'undefined' ? i18n.es : {});
    if (isTransmitting) {
      statusPill.className = 'audio-status-pill transmitting';
      if (statusText) statusText.textContent = langObj.statusTalking || 'HABLANDO';
    } else {
      statusPill.className = 'audio-status-pill silent';
      if (statusText) statusText.textContent = langObj.statusSilence || 'SILENCIO';
    }
  }

  function updatePTTText(isTalking) {
    if (!pttLabel) return;
    const langKey = getLang();
    const langObj = (typeof i18n !== 'undefined' && i18n[langKey]) ? i18n[langKey] : (typeof i18n !== 'undefined' ? i18n.es : {});
    pttLabel.textContent = isTalking ? (langObj.pttSpeaking || 'HABLANDO...') : (langObj.pttHold || 'MANTENER PARA HABLAR');
  }

  function setModePTTUI() {
    const langKey = getLang();
    const langObj = (typeof i18n !== 'undefined' && i18n[langKey]) ? i18n[langKey] : (typeof i18n !== 'undefined' ? i18n.es : {});
    if (modeDisplay) modeDisplay.textContent = langObj.optPttText || 'Push-to-Talk (mantener)';
    if (modeTag) modeTag.textContent = langObj.tagPtt || 'PUSH-TO-TALK';
    if (levelSectionLabel) levelSectionLabel.textContent = langObj.labelInputLevel || 'NIVEL DE ENTRADA';
    if (thresholdValText) thresholdValText.classList.add('hidden');
    if (greenLine) greenLine.classList.add('hidden');
    if (pttBox) pttBox.classList.remove('hidden');
    if (optPtt) { optPtt.classList.add('active'); }
    if (optAuto) { optAuto.classList.remove('active'); }
  }

  function runAudioModesCycle() {
    // ------------------------------------------------------------------
    // CICLO EXCLUSIVO PUSH-TO-TALK (SIN MODO AUTOMÁTICO)
    // ------------------------------------------------------------------
    setModePTTUI();
    setTransmissionState(false);
    fillBar.style.width = '0%';
    if (pttButton) pttButton.classList.remove('active-pressed');
    updatePTTText(false);

    // Simular que el usuario presiona PTT
    setTimeout(() => {
      if (pttButton) pttButton.classList.add('active-pressed');
      updatePTTText(true);
      setTransmissionState(true);

      const pttTimer = setInterval(() => {
        const vol = Math.floor(Math.random() * 25) + 65;
        fillBar.style.width = `${vol}%`;
      }, 80);

      setTimeout(() => {
        clearInterval(pttTimer);

        // Suelta PTT -> deja de enviar al instante
        if (pttButton) pttButton.classList.remove('active-pressed');
        updatePTTText(false);
        fillBar.style.width = '0%';
        setTransmissionState(false);

        // Reiniciar el ciclo PTT tras 2 segundos de pausa
        setTimeout(runAudioModesCycle, 2000);

      }, 2600);

    }, 1200);
  }

  // Soporte manual para interacción del usuario
  if (pttButton) {
    pttButton.onmousedown = () => {
      pttButton.classList.add('active-pressed');
      updatePTTText(true);
      setTransmissionState(true);
      fillBar.style.width = '78%';
    };

    pttButton.onmouseup = pttButton.onmouseleave = () => {
      pttButton.classList.remove('active-pressed');
      updatePTTText(false);
      setTransmissionState(false);
      fillBar.style.width = '0%';
    };
  }

  if (selectContainer) {
    selectContainer.onclick = () => {
      if (selectDropdown.classList.contains('hidden')) {
        openSelectDropdown();
      } else {
        closeSelectDropdown();
      }
    };
  }

  if (optPtt) {
    optPtt.onclick = (e) => {
      e.stopPropagation();
      setModePTTUI();
      closeSelectDropdown();
    };
  }

  if (optAuto) {
    optAuto.onclick = (e) => {
      e.stopPropagation();
      setModeAutoUI();
      closeSelectDropdown();
    };
  }

  runAudioModesCycle();
}

document.addEventListener('DOMContentLoaded', () => {
  setLanguage('es');
});
