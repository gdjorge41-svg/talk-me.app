// === INICIO PATCH SOLO TRANSCRIPCIÓN ===
// === FIN PATCH SOLO TRANSCRIPCIÓN ===
// ✅ Asegurar UTF-8 encoding para soportar caracteres especiales y emojis
if (process.stdout && process.stdout._handle && process.stdout._handle.setBlocking) {
  process.stdout._handle.setBlocking(true);
}
if (process.stderr && process.stderr._handle && process.stderr._handle.setBlocking) {
  process.stderr._handle.setBlocking(true);
}

// Core modules required (restored after accidental edits)
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { randomUUID } = require('crypto');
const { Worker } = require('worker_threads'); // [v60.1-BABEL] Módulo de hilos nativos

// Internal modules
const storage = require(path.join(__dirname, 'storage', 'storage.js'));
const categoryManager = require(path.join(__dirname, 'modules', 'category-manager.js'));
const triggerManager = require(path.join(__dirname, 'modules', 'trigger-manager.js'));
const triggerFileSync = require(path.join(__dirname, 'modules', 'trigger-file-sync.js'));
const textNumberNormalizer = require(path.join(__dirname, 'modules', 'text-number-normalizer.js'));
const piperEngine = require(path.join(__dirname, 'modules', 'ai', 'piper-engine.js'));

// --- TELEMETRÍA MASTER ---
const telemetryManager = require(path.join(__dirname, 'pre-launch', 'telemetry-manager.js'));
const { generateHardwareFingerprint } = require(path.join(__dirname, 'pre-launch', 'mac-fingerprint.js'));

const hwId = generateHardwareFingerprint();
const sessionId = Date.now();
global.sessionStats = {
  duration_mins: 0,
  msg_count: 0,
  text_msg_count: 0,
  audio_msg_count: 0,
  trigger_count: 0,
  users_connected: 0,
  start_time: Date.now(),
  categories_used: 0,
  photos_taken: 0,
  languages: new Set(),
  translations_used: new Set(),
  subusers_connected: 0,
  filters_used: 0,
  hermes_msg_count: 0
};

global.updateTelemetry = function () {
  global.sessionStats.duration_mins = Math.round((Date.now() - global.sessionStats.start_time) / 60000);

  if (typeof users !== 'undefined') {
    global.sessionStats.users_connected = Math.max(global.sessionStats.users_connected, users.size);
    let activeCategories = new Set();

    // 1. Recolectar telemetría de Usuarios Principales
    users.forEach(u => {
      if (u.lang) global.sessionStats.languages.add(u.lang.toUpperCase());

      if (u.aiSettings && u.aiSettings.enabledLangs) {
        u.aiSettings.enabledLangs.forEach(l => global.sessionStats.translations_used.add(l.toUpperCase()));
      }

      if (u.categoryIds && Array.isArray(u.categoryIds)) {
        u.categoryIds.forEach(id => activeCategories.add(id));
      } else if (u.categoryId) {
        activeCategories.add(u.categoryId);
      } else if (u.categories && Array.isArray(u.categories)) {
        u.categories.forEach(c => activeCategories.add(c));
      }
    });

    // 2. Recolectar telemetría de Sub-Usuarios (¡Integración Experta para evitar omisiones de filtros!)
    if (typeof subUsers !== 'undefined') {
      subUsers.forEach(su => {
        if (su.lang) global.sessionStats.languages.add(su.lang.toUpperCase());

        if (su.aiSettings && su.aiSettings.enabledLangs) {
          su.aiSettings.enabledLangs.forEach(l => global.sessionStats.translations_used.add(l.toUpperCase()));
        }

        if (su.category) {
          activeCategories.add(su.category);
        } else if (su.categoryId) {
          activeCategories.add(su.categoryId);
        } else if (su.categoryIds && Array.isArray(su.categoryIds)) {
          su.categoryIds.forEach(id => activeCategories.add(id));
        }
      });
    }

    global.sessionStats.categories_used = Math.max(global.sessionStats.categories_used, activeCategories.size);
    global.sessionStats.filters_used = global.sessionStats.categories_used; // Sinónimos en telemetría
  }

  if (typeof subUsers !== 'undefined') {
    global.sessionStats.subusers_connected = Math.max(global.sessionStats.subusers_connected, subUsers.size);
  }

  try {
    telemetryManager.logTelemetry(hwId, sessionId, global.sessionStats);
  } catch (e) {
    console.error("❌ Error en updateTelemetry:", e.message);
  }
};

// Auto-guardado al minuto de arrancar (para atrapar sesiones cortas), y luego cada 10 minutos
setTimeout(() => {
  if (global.updateTelemetry) global.updateTelemetry();
  setInterval(global.updateTelemetry, 10 * 60 * 1000);
}, 60 * 1000);
// -------------------------

const e131 = (() => { try { return require('e131'); } catch (e) { return null; } })();
const osc = (() => { try { return require('osc'); } catch (e) { return null; } })();
// Web framework & middleware
const express = require('express');


const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');

// --- Configuración de Almacenamiento Triggers (v60) ---
const TRIGGERS_UPLOADS_DIR = (storage && typeof storage.resolveWritablePath === 'function')
  ? storage.resolveWritablePath(path.join(__dirname, 'public', 'uploads', 'triggers'))
  : path.join(__dirname, 'public', 'uploads', 'triggers');
if (!fs.existsSync(TRIGGERS_UPLOADS_DIR)) fs.mkdirSync(TRIGGERS_UPLOADS_DIR, { recursive: true });

const triggersStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TRIGGERS_UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadTriggers = multer({ storage: triggersStorage });

// Socket / Redis
const socketIo = require('socket.io');
const Redis = (() => { try { return require('ioredis'); } catch (e) { return null; } })();
// Try multiple redis adapter packages
let redisAdapter = null;
try {
  const a = require('@socket.io/redis-adapter');
  if (a && typeof a.createAdapter === 'function') redisAdapter = a.createAdapter;
} catch (e) {
  try { redisAdapter = require('socket.io-redis'); } catch (e2) { redisAdapter = null; }
}
const https = require('https');
const http = require('http');

// Nombre reservado para el "Maestro Supremo" (puede sobrescribirse con la env SUPER_MASTER_NAME)
const SUPER_MASTER_NAME = (process.env.SUPER_MASTER_NAME && process.env.SUPER_MASTER_NAME.trim()) || 'Master';

/**
 * [v60.Elite] Helper de Normalización de Red
 * Garantiza que las IPs de red local (IPv4 mapeadas) se traten de forma limpia
 * para comparaciones de soberanía deterministas.
 */
const getCleanIp = (socket) => {
  if (!socket || !socket.handshake) return 'local';
  const ip = (socket.handshake.address || '').replace('::ffff:', '');
  return ip === '::1' ? '127.0.0.1' : ip;
};

/**
 * [v60.Elite] Comprobación de Host Local Omnipresente (Ley de Murphy)
 * Identifica si una IP corresponde a la propia máquina anfitriona que ejecuta el servidor,
 * ya sea conectándose por loopback (127.0.0.1, ::1) o por cualquiera de sus interfaces
 * de red locales activas (Wi-Fi, Ethernet, LAN, etc., como 172.20.10.2).
 */
const isHostMachineIp = (ip) => {
  if (!ip) return false;
  if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1' || ip === 'local') return true;
  try {
    const networkInterfaces = os.networkInterfaces();
    for (const ifaceKey in networkInterfaces) {
      const ifaceList = networkInterfaces[ifaceKey];
      if (Array.isArray(ifaceList)) {
        for (const addr of ifaceList) {
          if (addr && addr.address === ip) {
            return true;
          }
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ [HOST-DETECT] Error consultando interfaces de red locales:', err.message);
  }
  return false;
};

// === sACN (E1.31) ENGINE ===
const sacnSenders = new Map();
const oscSenders = new Map(); // Mapa de instancias UDP: host:port -> UDPPort

// --- [v60.Elite] SOBERANÍA DE TRIGGERS IN ---
// Memoria de Triggers por Soberanía (Usuario+IP) para persistencia entre pestañas y reconexiones.
const triggerSovereigntyStates = new Map(); // sovereigntyKey -> Set(TriggerId)
const smpteClaims = new Map();
const smpteLastAudio = new Map(); // [v60.Elite] Watchdog de presencia de audio (key -> timestamp)

global.isTriggerEnabledForUser = (socketId, triggerId) => {
  const user = users.get(socketId);
  const s = io.sockets.sockets.get(socketId);
  const clientIp = s ? getCleanIp(s) : null;

  if (!clientIp) return false;

  // [v60.Elite] Búsqueda de Estado Híbrida (User + Anon)
  // Buscamos el estado tanto para el usuario específico como para cualquier sesión anónima en esta IP.
  const sovereigntyKeys = [];
  if (user) sovereigntyKeys.push(`${user.username}_${user.ip}`);
  sovereigntyKeys.push(`anon_${clientIp}`);

  for (const key of sovereigntyKeys) {
    const state = triggerSovereigntyStates.get(key);
    if (state && state.has(triggerId)) return true;
  }

  return false;
};

// [v60.Elite] Retorna el mapa de reclamaciones activas de triggers de entrada en red
function getGlobalActiveClaims() {
  const claims = {};
  for (const [sovereigntyKey, triggerIds] of triggerSovereigntyStates.entries()) {
    const socketIds = [];
    if (sovereigntyKey.startsWith('anon_')) {
      const ip = sovereigntyKey.replace('anon_', '');
      if (typeof io !== 'undefined' && io.sockets && io.sockets.sockets) {
        for (const [sid, sNode] of io.sockets.sockets.entries()) {
          if (getCleanIp(sNode) === ip) {
            socketIds.push(sid);
          }
        }
      }
    } else {
      for (const [sid, user] of users.entries()) {
        const key = `${user.username}_${user.ip}`;
        if (key === sovereigntyKey) {
          socketIds.push(sid);
        }
      }
    }

    triggerIds.forEach(tid => {
      let owner = sovereigntyKey;
      if (sovereigntyKey.startsWith('anon_')) {
        owner = `Anon (${sovereigntyKey.replace('anon_', '')})`;
      } else if (sovereigntyKey.includes('_')) {
        owner = sovereigntyKey.split('_')[0];
      }
      claims[tid] = { owner, sovereigntyKey, socketIds };
    });
  }
  return claims;
}

// [v46.4.63] Lista negra temporal de IPs expulsadas (Master Control)
const kickedIps = new Set();
const kickedTokens = new Set(); // [v46.4.66.1] Lista negra de tokens de sesión
const users = new Map(); // [v60.1-GLOBAL] Colección de usuarios conectados

function getSacnSender(universe, mode, destinationIp) {
  const key = `${universe}:${mode}:${destinationIp || ''}`;
  if (!sacnSenders.has(key)) {
    let client;
    if (mode === 'unicast' && destinationIp) {
      client = new e131.Client(destinationIp, 5568);
    } else {
      // Para multicast, el constructor con universo se une automáticamente al grupo
      client = new e131.Client(universe, 5568);
    }
    sacnSenders.set(key, client);
  }
  return sacnSenders.get(key);
}

function sendSacn(sacn) {
  if (!sacn || !sacn.universe || !sacn.channels || sacn.channels.length === 0) return;

  try {
    const universe = parseInt(sacn.universe);
    const maxChannel = Math.max(...sacn.channels.map(c => parseInt(c.channel) || 0));
    const numSlots = Math.min(512, Math.max(1, maxChannel));

    const client = getSacnSender(universe, sacn.mode, sacn.destinationIp);
    const packet = client.createPacket(numSlots);

    packet.setSourceName('Talk-me');
    packet.setUniverse(universe);
    packet.setPriority(parseInt(sacn.priority) || 100);
    if (sacn.previewMode) {
      packet.setOption(packet.Options.PREVIEW, true);
    }

    const slotsData = packet.getSlotsData();
    for (let i = 0; i < slotsData.length; i++) {
      slotsData[i] = 0;
    }

    sacn.channels.forEach(({ channel, value }) => {
      const ch = parseInt(channel);
      const val = parseInt(value);
      if (ch >= 1 && ch <= 512 && ch <= slotsData.length) {
        slotsData[ch - 1] = Math.min(255, Math.max(0, Math.round(val)));
      }
    });

    client.send(packet, (err) => {
      if (err) {
        console.error(`❌ Error sACN: ${err.message}`);
      } else {
        console.log(`📡 sACN enviado: universo ${universe}, canales [${sacn.channels.map(c => `${c.channel}:${c.value}`).join(',')}]`);
      }
    });
  } catch (e) {
    console.error('❌ Error en sendSacn:', e.message);
  }
}

/**
 * [v60] OSC SENDER ENGINE (Bridge)
 * Envía mensajes OSC a través de UDP. Mantiene el puerto abierto para eficiencia.
 */
function getOscSender(host, port) {
  const key = `${host}:${port}`;
  if (!oscSenders.has(key)) {
    if (!osc) return null;
    try {
      const udpPort = new osc.UDPPort({
        localAddress: "0.0.0.0",
        localPort: 0,
        metadata: true
      });

      // ✅ [v60.Elite-Fix] Evitar crash fatal por errores asíncronos de red (ej. host no encontrado)
      udpPort.on('error', (err) => {
        console.error(`⚠️ [OSC-OUT] Error en canal UDP para ${key}:`, err.message);
      });

      udpPort.open();
      oscSenders.set(key, udpPort);
      console.log(`📡 [OSC-OUT] Nuevo canal UDP abierto para ${key}`);
    } catch (e) {
      console.error(`❌ Error creando puerto OSC para ${key}:`, e.message);
      return null;
    }
  }
  return oscSenders.get(key);
}

function sendOscUdp(host, port, address, args) {
  if (!osc) {
    console.error('❌ Librería OSC no disponible');
    return;
  }

  // ✅ [v60.Elite-Fix] Descartar IPs malformadas o incompletas antes del envío
  if (!host || typeof host !== 'string' || host.trim() === '' || host.trim().endsWith('.')) {
    console.warn(`⚠️ [OSC-OUT] Envío cancelado. Host inválido detectado: "${host}"`);
    return;
  }

  try {
    const sender = getOscSender(host, port);
    if (!sender) return;

    sender.send({
      address: address,
      args: args
    }, host, port);

    // [v60.Elite] Silencio quirúrgico: Solo logueamos en modo debug o para cambios estructurales
    // console.log(`📡 [OSC-OUT] Enviado: ${address} -> ${host}:${port}`);
  } catch (e) {
    console.error(`❌ Error en sendOscUdp:`, e.message);
  }
}

/**
 * [v60.Elite] Helper para obtener todos los usuarios activos y sus IPs
 * Utilizado por el motor de triggers para la ejecución delegada.
 */
function getActiveUsersForTriggers() {
  const targets = [];
  if (typeof io !== 'undefined' && typeof users !== 'undefined') {
    users.forEach((u, socketId) => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        targets.push({ socketId, ip: getCleanIp(socket) });
      }
    });
  }
  return targets;
}

let vosk = null;
let voskAvailable = false; // Flag de disponibilidad
let voskModels = {}; // Mapa de modelos: { 'es': model, 'en': model }

// [v59.4] Flag global: SIEMPRE hay transcripción (Vosk real O fallback local)
let transcriptionAvailable = false;

// 🛡️ [Anti-Murphy] Verificación física de la presencia del modelo de traducción en disco
function isTranslationModelInstalled() {
  try {
    const candidateDirs = [];
    const portableDir = process.env.PORTABLE_DIR || process.env.PORTABLE_EXECUTABLE_DIR;
    if (portableDir) {
      candidateDirs.push(path.join(portableDir, 'storage', 'models', 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8'));
      candidateDirs.push(path.join(portableDir, 'storage', 'models', 'translate', 'madlad400-3b-int8'));
      candidateDirs.push(path.join(portableDir, 'models', 'translate', 'madlad400-3b-int8'));
    }

    try {
      const baseConfigDir = process.env.USER_DATA_PATH || path.join(__dirname, '..', '..');
      const pathFile = path.join(baseConfigDir, 'config', 'data', 'models-path.json');
      if (fs.existsSync(pathFile)) {
        const data = JSON.parse(fs.readFileSync(pathFile, 'utf8'));
        if (data && data.modelsPath) {
          candidateDirs.push(path.join(data.modelsPath, 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8'));
          candidateDirs.push(path.join(data.modelsPath, 'translate', 'madlad400-3b-int8'));
          candidateDirs.push(path.join(data.modelsPath, 'madlad400-3b-int8', 'madlad400-3b-int8'));
          candidateDirs.push(path.join(data.modelsPath, 'madlad400-3b-int8'));
        }
      }
    } catch (_) {}

    candidateDirs.push('C:\\TalkMe\\Models\\translate\\madlad400-3b-int8\\madlad400-3b-int8');
    candidateDirs.push('C:\\TalkMe\\Models\\translate\\madlad400-3b-int8');
    candidateDirs.push(path.join(__dirname, 'storage', 'models', 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8'));
    candidateDirs.push(path.join(__dirname, 'storage', 'models', 'translate', 'madlad400-3b-int8'));

    const appData = process.env.APPDATA || (process.platform === 'win32' ? path.join(os.homedir(), 'AppData', 'Roaming') : os.homedir());
    candidateDirs.push(path.join(appData, 'Talk-me', 'models', 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8'));
    candidateDirs.push(path.join(appData, 'Talk-me', 'models', 'translate', 'madlad400-3b-int8'));

    if (process.platform === 'win32') {
      const driveLetters = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
      for (const drive of driveLetters) {
        candidateDirs.push(`${drive}:\\TalkMe\\Models\\translate\\madlad400-3b-int8\\madlad400-3b-int8`);
        candidateDirs.push(`${drive}:\\TalkMe\\Models\\translate\\madlad400-3b-int8`);
        candidateDirs.push(`${drive}:\\Talk-me\\models\\translate\\madlad400-3b-int8`);
        candidateDirs.push(`${drive}:\\Talk-me\\storage\\models\\translate\\madlad400-3b-int8`);
      }
    }

    // [v60.BÚSQUEDA ASCENDENTE - HASTA 6 NIVELES]
    const scanRoots = [__dirname, process.cwd()];
    if (portableDir) scanRoots.push(portableDir);
    if (process.env.PORTABLE_EXECUTABLE_DIR) scanRoots.push(process.env.PORTABLE_EXECUTABLE_DIR);
    if (process.execPath) scanRoots.push(path.dirname(process.execPath));
    for (const root of scanRoots) {
      let current = root;
      for (let depth = 0; depth < 6; depth++) {
        candidateDirs.push(path.join(current, 'storage', 'models', 'translate', 'madlad400-3b-int8'));
        candidateDirs.push(path.join(current, 'storage', 'models', 'translate', 'madlad400-3b-int8', 'madlad400-3b-int8'));
        candidateDirs.push(path.join(current, 'models', 'translate', 'madlad400-3b-int8'));
        candidateDirs.push(path.join(current, 'translate', 'madlad400-3b-int8'));
        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;
      }
    }

    for (const dir of candidateDirs) {
      if (fs.existsSync(dir)) {
        const binFile = path.join(dir, 'model.bin');
        if (fs.existsSync(binFile)) {
          const stat = fs.statSync(binFile);
          if (stat.size >= 2000000000) return true;
        }
      }
    }
  } catch (e) {
    console.warn("⚠️ Error en isTranslationModelInstalled:", e.message);
  }
  return false;
}

// 🛡️ [Anti-Murphy] Comprobar si la traducción fue desactivada deliberadamente por el usuario en Pre-Launch o Global Settings
function isTranslationGloballyEnabled() {
  try {
    const baseConfigDir = process.env.USER_DATA_PATH || path.join(__dirname);
    // 1. Comprobar en global-settings.json
    const globalPath = path.join(baseConfigDir, 'config', 'data', 'global-settings.json');
    if (fs.existsSync(globalPath)) {
      const gData = JSON.parse(fs.readFileSync(globalPath, 'utf8'));
      if (gData && gData.translateEnabled === false) return false;
    }

    // 2. Comprobar en models-path.json
    const modelsPathFile = path.join(baseConfigDir, 'config', 'data', 'models-path.json');
    if (fs.existsSync(modelsPathFile)) {
      const mData = JSON.parse(fs.readFileSync(modelsPathFile, 'utf8'));
      if (mData && mData.translateEnabled === false) return false;
    }

    // 3. Salvaguarda en __dirname si USER_DATA_PATH apuntaba a otra ruta
    if (baseConfigDir !== path.join(__dirname)) {
      const fallbackGlobal = path.join(__dirname, 'config', 'data', 'global-settings.json');
      if (fs.existsSync(fallbackGlobal)) {
        const gData = JSON.parse(fs.readFileSync(fallbackGlobal, 'utf8'));
        if (gData && gData.translateEnabled === false) return false;
      }
      const fallbackModels = path.join(__dirname, 'config', 'data', 'models-path.json');
      if (fs.existsSync(fallbackModels)) {
        const mData = JSON.parse(fs.readFileSync(fallbackModels, 'utf8'));
        if (mData && mData.translateEnabled === false) return false;
      }
    }
  } catch (e) {
    console.warn("⚠️ Error en isTranslationGloballyEnabled:", e.message);
  }
  return true;
}

// [v60.1-INDUSTRIAL] BACKPRESSURE CONFIGURATION
const MAX_VOSK_CONCURRENT_RECOGNIZERS = 8; // Límite de seguridad para evitar colapso de CPU
let activeRecognizersCount = 0; // Contador de sesiones de transcripción activas

// [v60.1-BABEL] AI ENGINE CONFIGURATION
let aiWorker = null;
let aiWorkerReady = false;
let aiWorkerRetries = 0;
const MAX_AI_RETRIES = 3;

// [v60.Industrial] Seguimiento de sesiones y secuencias para streaming Whisper (Euskera / Gallego)
const _whisperSessionMap = new Map(); // targetKey (socketId + subUserId) -> sessionTimestamp
const _whisperLastProcessedSeq = new Map(); // targetKey -> lastSeqNumber
const _whisperTaskInFlight = new Map(); // targetKey -> boolean

/**
 * [v60.1-BABEL] Inicializa el motor de IA en un hilo separado
 */
function initAiEngine() {
  try {
    const workerPath = path.join(__dirname, 'modules', 'ai', 'ai-worker.js');
    if (!fs.existsSync(workerPath)) {
      console.error('❌ [AI-ENGINE] No se encontró modules/ai/ai-worker.js. Abortando IA.');
      return;
    }

    aiWorker = new Worker(workerPath);

    aiWorker.on('message', (msg) => {
      if (msg.type === 'pong' || msg.status === 'ready') {
        aiWorkerReady = true;
        aiWorkerRetries = 0;
        console.log('\n========================================');
        console.log('✅ [AI-ENGINE] MOTOR NEURAL SINCRONIZADO');
        console.log('🎙️ Euskera Puro (whisper.cpp) y Babel (Traducción) LISTOS');
        console.log('========================================\n');
      }
      if (msg.type === 'translation-result') {
        handleTranslationResult(msg);
      }
      if (msg.type === 'transcription-result') {
        handleAiTranscriptionResult(msg);
      }
      if (msg.error) {
        console.error(`⚠️ [AI-ENGINE] Error en Worker: ${msg.message}`);
      }
    });

    aiWorker.on('error', (err) => {
      console.error('❌ [AI-ENGINE] Error crítico en el hilo de IA:', err);
      aiWorkerReady = false;
    });

    aiWorker.on('exit', (code) => {
      aiWorkerReady = false;
      if (code !== 0 && aiWorkerRetries < MAX_AI_RETRIES) {
        aiWorkerRetries++;
        console.warn(`🔄 [AI-ENGINE] Hilo de IA finalizado. Reiniciando (${aiWorkerRetries}/${MAX_AI_RETRIES})...`);
        setTimeout(initAiEngine, 2000);
      } else if (aiWorkerRetries >= MAX_AI_RETRIES) {
        console.error('🚫 [AI-ENGINE] El motor de IA ha fallado demasiadas veces. Desactivado para proteger el servidor.');
      }
    });

    aiWorker.postMessage({ type: 'ping', taskId: 'init-ping' });
  } catch (e) {
    console.error('❌ [AI-ENGINE] Error al inicializar el Worker Thread:', e.message);
  }
}

function handleTranslationResult(msg) {
  const latency = msg.sentAt ? (Date.now() - msg.sentAt) : 0;

  // [v60.1] FUSIBLE INDUSTRIAL: Aumentado a 60s para permitir carga inicial del modelo
  if (latency > 60000) {
    console.log(`⚠️ [BABEL] Fusible disparado: Latencia crítica (${latency}ms > 60000ms) para [${msg.taskId}]. Descartando.`);
    return;
  }

  // [v60.1-BABEL] ENTREGA PRIVADA: Solo enviar a quienes lo necesitan
  let deliveredCount = 0;
  const piperEligibleSockets = [];

  users.forEach(u => {
    if (u.lang === msg.targetLang && u.aiSettings?.autoTranslate) {
      deliveredCount++;
      io.to(u.id).emit('translation-result', {
        _msgId: msg.taskId,
        result: msg.result,
        sourceLang: msg.sourceLang,
        targetLang: msg.targetLang
      });

      // Recopilar sockets que tienen interfaz en euskera/gallego para síntesis Piper
      const baseTarget = (msg.targetLang || '').split('-')[0].toLowerCase();
      if (baseTarget === 'eu' || baseTarget === 'gl') {
        piperEligibleSockets.push(u.id);
      }
    }
  });

  console.log(`📝 [BABEL] Trad. entregada [${msg.taskId}] a ${deliveredCount} usuarios (${latency}ms). Resultado: "${msg.result}"`);

  // [v60.PIPER-TTS] Síntesis asíncrona no bloqueante para idiomas sin voz en Windows
  if (piperEligibleSockets.length > 0 && piperEngine && piperEngine.isSupported && msg.result) {
    const cleanSpeechText = (msg.result || '')
      .replace(/^\[[A-Z]{2}\]\s*/, '')
      .replace(/\s*\([^\)]*\)$/, '')
      .trim();

    // Encontrar remitente original y tipo de mensaje para el anuncio vocal
    let senderName = '';
    let isAudio = false;
    try {
      const origMsg = messageHistory.find(m => m._msgId === msg.taskId);
      if (origMsg) {
        if (origMsg.user) senderName = origMsg.user;
        if (origMsg.audioUrl && !origMsg.audioUrl.startsWith('error-')) isAudio = true;
      }
    } catch (e) { }

    // Filtrar usuarios anónimos o IPs
    if (senderName.startsWith('Anon') || (senderName.includes('.') && /\d+\.\d+/.test(senderName))) {
      senderName = '';
    }

    // Componer texto con la misma regla de autoría al final
    const baseTarget = (msg.targetLang || '').split('-')[0].toLowerCase();
    let textToSynthesize = cleanSpeechText.replace(/[\s\.\,]+$/, '');

    if (senderName) {
      if (baseTarget === 'eu') {
        textToSynthesize += isAudio ? ` ... ${senderName}(e)k esana` : ` ... ${senderName}(e)k idatzia`;
      } else if (baseTarget === 'gl') {
        textToSynthesize += isAudio ? ` ... dixo ${senderName}` : ` ... escribiu ${senderName}`;
      } else {
        textToSynthesize += isAudio ? ` ... dijo ${senderName}` : ` ... escribió ${senderName}`;
      }
    }

    // Lanzar síntesis en paralelo sin retrasar el hilo principal
    piperEngine.synthesize(textToSynthesize, msg.targetLang)
      .then(wavBuffer => {
        if (!wavBuffer) return;
        piperEligibleSockets.forEach(targetSid => {
          io.to(targetSid).emit('hermes-audio-stream', {
            _msgId: msg.taskId,
            user: senderName,
            lang: msg.targetLang,
            audioBuffer: wavBuffer
          });
        });
        console.log(`🗣️ [Hermes-Piper] Stream de audio (${textToSynthesize}) enviado a ${piperEligibleSockets.length} usuarios.`);
      })
      .catch(err => {
        console.warn('⚠️ [Hermes-Piper] Error en síntesis diferida:', err.message);
      });
  }
}

function handleAiTranscriptionResult(msg) {
  const targetKey = `${msg.socketId || ''}_${msg.subUserId || 'root'}`;

  if (msg.isPartial) {
    _whisperTaskInFlight.set(targetKey, false);

    // Murphy Shield: Si la sesión ya no coincide (el usuario soltó el botón antes de responder), descartar
    const activeSession = _whisperSessionMap.get(targetKey);
    if (!activeSession || msg.sessionSeq !== activeSession) {
      return;
    }

    // Murphy Shield: Si llegó una respuesta con secuencia menor a la ya procesada, descartar para evitar regresión de texto
    const lastSeq = _whisperLastProcessedSeq.get(targetKey) || 0;
    if (msg.seq && msg.seq <= lastSeq) {
      return;
    }
    if (msg.seq) {
      _whisperLastProcessedSeq.set(targetKey, msg.seq);
    }

    let cleanText = (msg.text || '').trim();
    if (!cleanText) return;

    if (msg.socketId) {
      const u = typeof users !== 'undefined' ? users.get(msg.socketId) : null;
      const wLang = msg.lang || (u && u.lang) || 'eu';
      if (u && u.aiSettings && u.aiSettings.convertNumbers) {
        cleanText = textNumberNormalizer.normalizeSpokenNumbers(cleanText, wLang);
      }
      io.to(msg.socketId).emit('vosk-partial', {
        text: cleanText,
        isFinal: false,
        isWhisper: true,
        subUserId: msg.subUserId
      });
    }
    return;
  }

  // Finalización
  _whisperTaskInFlight.set(targetKey, false);
  console.log(`🎙️ [AI-ENGINE] Transcripción Whisper finalizada [${msg.taskId}]: ${msg.text}`);
  if (msg.socketId) {
    io.to(msg.socketId).emit('transcription-result', {
      text: msg.text,
      subUserId: msg.subUserId,
      isWhisper: true,
      isFinal: true
    });
  }
}

/**
 * [v59.4] INGENIERÍA ROBUSTA: Inicializar Vosk con pre-carga de modelos
 * 
 * OBJETIVO: Garantizar transcripción offline local cuando es posible
 * 
 * COMPORTAMIENTO:
 *   ✅ Si Vosk instala: Pre-cargar modelos ES + EN inmediatamente
 *   ❌ Si Vosk NO instala: Notificar y fallback elegante
 * 
 * NOTA IMPORTANTE:
 *   Vosk es una dependencia nativa (requiere C++ compiler).
 *   Si falla la instalación, el usuario necesita:
 *   - Windows: Visual Studio Build Tools
 *   - macOS: Xcode Command Line Tools
 *   - Linux: build-essential + python3-dev
 */
function getModelsPath() {
  const candidateDirs = [];

  // 1. models-path.json (en USER_DATA_PATH o __dirname)
  try {
    const baseConfigDir = process.env.USER_DATA_PATH || __dirname;
    const pathFile = path.join(baseConfigDir, 'config', 'data', 'models-path.json');
    if (fs.existsSync(pathFile)) {
      const data = JSON.parse(fs.readFileSync(pathFile, 'utf8'));
      if (data && data.modelsPath && fs.existsSync(data.modelsPath)) {
        candidateDirs.push(data.modelsPath);
      }
    }
  } catch (e) {
    console.error("❌ Error leyendo models-path.json:", e.message);
  }

  // 2. Entornos Portables de Electron
  const portableDir = process.env.PORTABLE_DIR || process.env.PORTABLE_EXECUTABLE_DIR;
  if (portableDir) {
    candidateDirs.push(portableDir);
    candidateDirs.push(path.join(portableDir, 'models'));
  }

  // 3. Ruta estándar de instalación industrial en Windows y AppData / macOS Application Support
  if (process.platform === 'win32') {
    candidateDirs.push('C:\\TalkMe\\Models');
  }
  const appData = process.env.APPDATA || (process.platform === 'win32' 
    ? path.join(os.homedir(), 'AppData', 'Roaming') 
    : path.join(os.homedir(), 'Library', 'Application Support'));
  candidateDirs.push(path.join(appData, 'Talk-me', 'models'));

  // 4. Directorio local actual
  candidateDirs.push(__dirname);

  // 5. Búsqueda inteligente hacia arriba (hasta 6 niveles) desde __dirname, cwd, portable y ejecutable
  const scanRoots = [__dirname, process.cwd()];
  if (portableDir) scanRoots.push(portableDir);
  if (process.env.PORTABLE_EXECUTABLE_DIR) scanRoots.push(process.env.PORTABLE_EXECUTABLE_DIR);
  if (process.execPath) scanRoots.push(path.dirname(process.execPath));

  for (const root of scanRoots) {
    let checkDir = root;
    for (let i = 0; i < 6; i++) {
      candidateDirs.push(checkDir);
      candidateDirs.push(path.join(checkDir, 'models'));
      const parentDir = path.dirname(checkDir);
      if (parentDir === checkDir) break;
      checkDir = parentDir;
    }
  }

  // Comprobar candidatos para modelos de Vosk
  for (const dir of candidateDirs) {
    if (!dir) continue;
    try {
      if (fs.existsSync(path.join(dir, 'vosk-model-small-es-0.42')) ||
          fs.existsSync(path.join(dir, 'vosk-model-small-en-us-0.15'))) {
        return dir;
      }
    } catch (_) {}
  }

  return __dirname; // Fallback por defecto
}

function initVosk() {
  try {
    vosk = require('vosk');
    vosk.setLogLevel(-1);

    // Verificar que Vosk también pueda cargar modelos
    try {
      const modelsPath = getModelsPath();
      const modelCodes = ['es', 'en-us', 'en', 'eu'];

      modelCodes.forEach(code => {
        let folderName = `vosk-model-small-${code}`;
        if (code === 'es') folderName = 'vosk-model-small-es-0.42';
        if (code === 'en-us' || code === 'en') folderName = 'vosk-model-small-en-us-0.15';

        let modelPath = path.join(modelsPath, folderName);
        if (!fs.existsSync(modelPath)) {
          modelPath = path.join(__dirname, folderName);
        }

        if (fs.existsSync(modelPath)) {
          console.log(`📦 Pre-cargando modelo Vosk [${code.toUpperCase()}] desde ${modelPath}...`);
          try {
            voskModels[code] = new vosk.Model(modelPath);
            console.log(`✅ Modelo Vosk [${code.toUpperCase()}] cargado correctamente`);
          } catch (err) {
            console.error(`❌ Error cargando modelo Vosk [${code}]:`, err.message);
          }
        }
      });

      if (Object.keys(voskModels).length > 0) {
        voskAvailable = true;
        transcriptionAvailable = true;
        console.log('🎙️ Vosk ACTIVO con transcripción offline [' + Object.keys(voskModels).join(',').toUpperCase() + ']');
        console.log('\n✅ [TRANSCRIPCIÓN] Modo: VOSK REAL (offline profesional)\n');
      } else {
        throw new Error('No se cargó ningún modelo Vosk.');
      }
    } catch (modelErr) {
      voskAvailable = false;
      console.warn('⚠️ Error al pre-cargar modelos Vosk:', modelErr.message);
      console.warn('ℹ️ Transcripción offline NO disponible. Firefox usará fallback.');
    }
  } catch (e) {
    voskAvailable = false;
    console.warn('❌ [VOSK MISSING] Vosk NO instalado o falló al cargar');
    console.warn('   Razón:', e.message);
    console.warn('   Para instalar Vosk, ejecuta: npm install vosk');
    console.warn('   Nota: Requiere Visual C++ Compiler en Windows');
    console.log('   Funcionando en modo Local (análisis offline sin internet)');
  }
}
initVosk();

/**
 * [v59.4] FALLBACK LOCAL TRANSCRIPTION ENGINE
 * 
 * Para Firefox en local sin Vosk: Usa análisis de audio local
 * NO es transcripción real, pero permite que Firefox tenga ALGO en local
 * 
 * TÉCNICAS USADAS:
 *   1. Fingerprinting de audio (detección de silencio)
 *   2. Análisis de energía (picos = palabras)
 *   3. Estimación de duración = cantidad de palabras
 *   4. Pattern matching básico
 */
let localTranscriptionCache = {};

class LocalTranscriptionEngine {
  /**
   * Análisis COMPLETAMENTE OFFLINE para cuando Vosk no está disponible
   * NO requiere internet ni servicios externos - todo se procesa localmente
   * Input: Buffer de audio PCM 16-bit 16kHz
   */
  static analyzeAudio(audioBuffer) {
    try {
      // Convert Uint8Array to Int16Array
      const int16Data = new Int16Array(audioBuffer);

      // Parámetros de detección
      const ENERGY_THRESHOLD = 1500;
      const SILENCE_DURATION_MS = 400;
      const MIN_WORD_SAMPLES = 4800; // ~0.3s @ 16kHz

      // Calcular energía RMS
      let energySum = 0;
      for (let i = 0; i < Math.min(int16Data.length, 10000); i++) {
        energySum += int16Data[i] * int16Data[i];
      }
      const rmsEnergy = Math.sqrt(energySum / Math.min(int16Data.length, 10000));

      // Detectar si hay audio significativo
      const hasSpeech = rmsEnergy > ENERGY_THRESHOLD;

      // Estimar número de palabras por duración
      const durationSeconds = int16Data.length / 16000;

      // [v60.ANTI-HALLUCINATION] NUNCA inventar palabras aleatorias.
      // Si Vosk no está disponible o el audio es ininteligible, retornar cadena vacía
      // para permitir que el cliente envíe la nota de voz limpia sin textos ficticios.
      return {
        result: '',
        confidence: 0.0,
        isFinal: true,
        energy: rmsEnergy,
        duration: durationSeconds,
        estimated: true,
        unrecognized: true
      };
    } catch (err) {
      return {
        result: '',
        confidence: 0.0,
        isFinal: true,
        error: err.message,
        estimated: true,
        unrecognized: true
      };
    }
  }

  /**
   * Mejor versión: Usar diccionarios para matching
   */
  static transcribeWithDictionary(audioBuffer, lang = 'es') {
    try {
      const analysis = this.analyzeAudio(audioBuffer);

      // Si no hay habla significativa
      if (analysis.energy < 1500) {
        return {
          result: '(silencio)',
          confidence: 0.0,
          isFinal: true,
          estimated: true
        };
      }

      // [v59.4] Fallback mejorado: mostrar mensaje claro en lugar de palabras aleatorias
      // Duración estimada
      const durationMs = Math.round((analysis.duration || 0) * 1000);
      const durationSec = Math.round(analysis.duration || 0);

      // Mensajes más útiles dependiendo de la duración
      let resultMessage = '';
      if (durationSec <= 1) {
        resultMessage = '[Mensaje muy breve]';
      } else if (durationSec <= 3) {
        resultMessage = `[Audio: ~${durationSec}s sin Vosk]`;
      } else if (durationSec <= 10) {
        resultMessage = `[Audio: ~${durationSec}s - Vosk no disponible]`;
      } else {
        resultMessage = `[Audio largo: ${durationSec}s - requiere Vosk para transcripción]`;
      }

      return {
        result: resultMessage,
        confidence: 0.0,  // Cero confianza - es fallback
        isFinal: true,
        estimated: true,
        duration: durationSec,
        note: '⚠️ Transcripción NO disponible (Vosk no instalado). Para transcripción real: npm install vosk'
      };
    } catch (err) {
      console.error('LocalTranscriptionEngine error:', err.message);
      return {
        result: '[Error procesando audio - revisa consola del servidor]',
        confidence: 0.0,
        isFinal: true,
        estimated: true
      };
    }
  }
}


let dictionaryCaches = {};
let babelProtectedCaches = {}; // [v60.Elite] Caché para diccionarios de protección Babel

// === AUDIO STORAGE & HISTORY ===
const RECORDINGS_DIR = (storage && typeof storage.resolveWritablePath === 'function')
  ? storage.resolveWritablePath(path.join(__dirname, 'storage', 'media', 'recordings'))
  : path.join(__dirname, 'storage', 'media', 'recordings');
const IMAGES_DIR = (storage && typeof storage.resolveWritablePath === 'function')
  ? storage.resolveWritablePath(path.join(__dirname, 'storage', 'media', 'images'))
  : path.join(__dirname, 'storage', 'media', 'images');
const CACHE_SETTINGS_PATH = (storage && typeof storage.resolveWritablePath === 'function')
  ? storage.resolveWritablePath(path.join(__dirname, 'config', 'data', 'cache-settings.json'))
  : path.join(__dirname, 'config', 'data', 'cache-settings.json');
let messageHistory = [];
const MAX_HISTORY = 50; // Aumentado para permitir más mensajes en memoria
let currentCacheLimitMB = 100; // Límite por defecto

// Cargar categorías al arrancar usando el nuevo módulo modular
const categoriesData = categoryManager.loadCategories();
const { MAX_CATEGORIES, saveCategories, generateCategoryId } = categoryManager;

/**
 * [v60.ELITE] Sincronización Global de Soberanía
 * Informa a todos los clientes conectados si el asiento de Master está ocupado o disponible.
 */
function broadcastMasterStatus(targetSocket = null) {
  try {
    const masterId = categoriesData.masterId;
    const masterUsername = categoriesData.masterUsername;

    // [v60.Elite] Robustez Multi-pestaña: El Master está presente si existe al menos un socket con su identidad
    const hasCurrentMaster = Array.from(users.values()).some(u =>
      u.username && masterUsername && u.username.toLowerCase() === masterUsername.toLowerCase()
    );

    const payload = {
      hasMaster: hasCurrentMaster,
      masterUsername: masterUsername,
      masterCategory: categoriesData.masterCategory,
      timestamp: Date.now()
    };

    if (targetSocket) {
      targetSocket.emit('master-status', payload);
    } else {
      io.emit('master-status', payload);
    }
  } catch (e) {
    console.error('❌ Error en broadcastMasterStatus:', e.message);
  }
}


// === PERSISTENCIA DE HISTORIAL DE MENSAJES ===
const MESSAGE_HISTORY_PATH = (storage && typeof storage.resolveWritablePath === 'function')
  ? storage.resolveWritablePath(path.join(__dirname, 'storage', 'message-history.json'))
  : path.join(__dirname, 'storage', 'message-history.json');

// ✅ PROFISSIONAL: Debounced write para evitar múltiples sync writes en cascada
let messageHistorySaveTimeout = null;
function saveMessageHistory() {
  try {
    // Validar antes de guardar
    if (!Array.isArray(messageHistory) || messageHistory.length === 0) {
      return; // No guardar arrays vacíos
    }

    // Aplicar debounce: solo guardar si no hay write pendiente
    if (messageHistorySaveTimeout) {
      clearTimeout(messageHistorySaveTimeout);
    }

    messageHistorySaveTimeout = setTimeout(() => {
      try {
        fs.writeFileSync(MESSAGE_HISTORY_PATH, JSON.stringify(messageHistory, null, 2), 'utf8');
        messageHistorySaveTimeout = null;
      } catch (e) {
        console.error('❌ Error guardando messageHistory:', e.message);
        // Log error pero no fallar - messageHistory queda en RAM
      }
    }, 500); // Buffer 500ms de cambios para combinar múltiples saves
  } catch (e) {
    console.error('❌ Error en saveMessageHistory:', e.message);
  }
}

function loadMessageHistory() {
  try {
    // ✅ NUEVO: Borrar messageHistory al startup para garantizar sesión limpia
    if (fs.existsSync(MESSAGE_HISTORY_PATH)) {
      fs.unlinkSync(MESSAGE_HISTORY_PATH);
      console.log('📋 Historial previo borrado → Sesión limpia');
    }
    messageHistory = [];
  } catch (e) {
    console.error('❌ Error en loadMessageHistory:', e.message);
    messageHistory = [];
  }
}

// Al arrancar el servidor
loadMessageHistory();

/**
 * Cargar configuración de caché al arrancar
 */
function loadCacheSettings() {
  try {
    const data = storage.readJSON(CACHE_SETTINGS_PATH);
    if (data && data.maxCacheMB) {
      currentCacheLimitMB = data.maxCacheMB;
      console.log(`📦 Límite de caché cargado: ${currentCacheLimitMB}MB`);
    }
  } catch (e) {
    console.log(`ℹ️ Usando límite de caché default: ${currentCacheLimitMB}MB`);
  }
}

/**
 * Guardar configuración de caché
 */
function saveCacheSettings(limitMB, modifiedBy = 'system') {
  try {
    const data = {
      maxCacheMB: limitMB,
      lastModified: new Date().toISOString(),
      modifiedBy: modifiedBy
    };
    storage.writeJSON(CACHE_SETTINGS_PATH, data);
    currentCacheLimitMB = limitMB;
    console.log(`💾 Límite de caché actualizado a: ${limitMB}MB (por ${modifiedBy})`);
    return true;
  } catch (e) {
    console.error(`❌ Error guardando cache settings: ${e.message}`);
    return false;
  }
}

loadCacheSettings();

/**
 * Calcula el tamaño total de una carpeta en bytes.
 */
function getDirSize(directory) {
  let totalSize = 0;
  if (!fs.existsSync(directory)) return 0;
  const files = fs.readdirSync(directory);
  files.forEach(file => {
    const stats = fs.statSync(path.join(directory, file));
    totalSize += stats.size;
  });
  return totalSize;
}

/**
 * Limpia los archivos más antiguos hasta estar por debajo del límite de caché.
 */
function enforceCacheLimit() {
  const recordingsSize = getDirSize(RECORDINGS_DIR);
  const imagesSize = getDirSize(IMAGES_DIR);
  let totalSizeBytes = recordingsSize + imagesSize;
  const limitBytes = currentCacheLimitMB * 1024 * 1024;

  console.log(`📊 Cache Check: Recordings=${recordingsSize}B, Images=${imagesSize}B | Total=${totalSizeBytes}B / Limit=${limitBytes}B`);

  if (totalSizeBytes > limitBytes) {
    console.log(`🧹 Caché llena: ${Math.round(totalSizeBytes / (1024 * 1024))}MB > ${currentCacheLimitMB}MB. Limpiando...`);

    // Obtener todos los archivos con su fecha de modificación
    let allFiles = [];
    [RECORDINGS_DIR, IMAGES_DIR].forEach(dir => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          allFiles.push({ path: filePath, size: stats.size, mtime: stats.mtime });
        });
      }
    });

    // Ordenar por fecha de modificación (viejos primero)
    allFiles.sort((a, b) => a.mtime - b.mtime);

    // Borrar hasta bajar del 80% del límite para dar margen
    const targetLimit = limitBytes * 0.8;
    for (const file of allFiles) {
      if (totalSizeBytes <= targetLimit) break;
      try {
        fs.unlinkSync(file.path);
        totalSizeBytes -= file.size;
        // console.log(`🗑️ LRU: Borrado ${path.basename(file.path)}`);
      } catch (e) {
        console.error(`❌ Error borrando archivo LRU: ${file.path}`, e.message);
      }
    }
    console.log(`✅ Limpieza completada. Nuevo tamaño: ${Math.round(totalSizeBytes / (1024 * 1024))}MB`);
  }

  // [v59.Elite] Notificar a todos los clientes del estado actual del almacenamiento
  if (typeof io !== 'undefined') {
    io.emit('cache-status', {
      currentMB: parseFloat((totalSizeBytes / (1024 * 1024)).toFixed(2)),
      limitMB: currentCacheLimitMB
    });
  }
}

function ensureRecordingsDir() {
  if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
    console.log('📁 Directorio de grabaciones creado:', RECORDINGS_DIR);
  }
}

function clearRecordings() {
  try {
    if (fs.existsSync(RECORDINGS_DIR)) {
      const files = fs.readdirSync(RECORDINGS_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(RECORDINGS_DIR, file));
      }
      console.log('🧹 Grabaciones antiguas eliminadas');
    }
  } catch (e) {
    console.error('❌ Error limpiando grabaciones:', e.message);
  }
}

// ✅ NUEVA: Limpiar imágenes al arrancar (como se hace con grabaciones)
function clearImages() {
  try {
    if (fs.existsSync(IMAGES_DIR)) {
      const files = fs.readdirSync(IMAGES_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(IMAGES_DIR, file));
      }
      console.log('🧹 Imágenes antiguas eliminadas');
      imagesHistory = []; // También vaciar el array
    }
  } catch (e) {
    console.error('❌ Error limpiando imágenes:', e.message);
  }
}

// === IMAGE STORAGE & ROLLING BUFFER (DECLARED FIRST) ===
const MAX_IMAGES = 20;
let imagesHistory = []; // [{ id: 'msgId', fileName: 'name.jpg' }]

// Inicializar almacenamiento y limpiar al arrancar
ensureRecordingsDir();
clearRecordings();
ensureImagesDir();
clearImages(); // ✅ Limpiar imágenes también

function ensureImagesDir() {
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    console.log('📁 Directorio de imágenes creado:', IMAGES_DIR);
  }
}

function rebuildImagesHistory() {
  // Reconstruye imagesHistory con los archivos existentes en disco
  if (fs.existsSync(IMAGES_DIR)) {
    const files = fs.readdirSync(IMAGES_DIR)
      .filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'));
    imagesHistory = files.map(fileName => ({ id: fileName.split('.')[0], fileName }));
    if (imagesHistory.length > MAX_IMAGES) {
      imagesHistory = imagesHistory.slice(-MAX_IMAGES);
    }
    console.log(`🔄 imagesHistory reconstruido con ${imagesHistory.length} imágenes.`);
  }
}

ensureImagesDir();
rebuildImagesHistory();

// ✅ PROFESIONAL: Función dedicada de validación de imágenes
/**
 * Revisa el messageHistory y marca como 'not_available' cualquier imagen cuyo archivo
 * fue borrado (por cache limit, manual cleanup, o permisos).
 * Se ejecuta después de cada mensaje enviado.
 */
function validateAndMarkUnavailableImages() {
  let markedCount = 0;
  try {
    messageHistory.forEach(msg => {
      if (msg && msg.imageUrl && msg.imageUrl !== 'not_available' && !msg.imageUrl.startsWith('error-')) {
        const fileName = msg.imageUrl.split('/').pop();
        const filePath = path.join(IMAGES_DIR, fileName);

        // Si el archivo no existe, marcar como no disponible
        if (!fs.existsSync(filePath)) {
          msg.imageUrl = 'not_available';
          markedCount++;
        }
      }
    });

    if (markedCount > 0) {
      console.log(`📋 Validación de imágenes: ${markedCount} marcadas como 'not_available'`);
    }
  } catch (e) {
    console.error('❌ Error validando imágenes:', e.message);
  }
}

// === BACKUP CON TIMESTAMP ===
/**
 * Crea un backup con timestamp en la carpeta config/backups/
 * @param {string} filePath - Ruta del archivo a respaldar
 * @param {string} fileType - Tipo de archivo (dictionary, triggers, categories)
 * @returns {boolean} - true si el backup fue exitoso
 */
function createTimestampedBackup(filePath, fileType = 'data') {
  try {
    const resolvedSource = (storage && typeof storage.resolveWritablePath === 'function')
      ? storage.resolveWritablePath(filePath)
      : filePath;
    if (!fs.existsSync(resolvedSource)) return false;

    const BACKUPS_DIR = (storage && typeof storage.resolveWritablePath === 'function')
      ? storage.resolveWritablePath(path.join(__dirname, 'config', 'backups'))
      : path.join(__dirname, 'config', 'backups');

    // Crear directorio de backups si no existe
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }

    // Timestamp en formato YYYY-MM-DD_HH-MM-SS
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');

    // Nombre del archivo backup: tipo_timestamp_original.json
    const filename = path.basename(resolvedSource);
    const backupName = `${fileType}_${timestamp}_${filename}`;
    const backupPath = path.join(BACKUPS_DIR, backupName);

    // Copiar archivo
    fs.copyFileSync(resolvedSource, backupPath);
    console.log(`✅ Backup creado: ${backupName}`);

    return true;
  } catch (e) {
    console.error(`❌ Error creando backup: ${e.message}`);
    return false;
  }
}

// Cargar/Guardar diccionario con gestión de errores y caché
// Cargar/Guardar diccionario con gestión de errores y caché por idioma
function loadDictionary(lang = 'es', forceReload = false) {
  if (!forceReload && dictionaryCaches[lang]) {
    return dictionaryCaches[lang];
  }

  const dictPath = path.join(__dirname, 'config', 'data', 'dictionaries', lang, 'dictionary.json');
  const parsed = storage.readJSON(dictPath);
  if (parsed) {
    dictionaryCaches[lang] = parsed.map(v => typeof v === 'string' ? { from: v, to: v } : v);
    console.log(`📖 [DICT] Diccionario [${lang}] cargado desde disco: ${dictionaryCaches[lang].length} términos.`);
    return dictionaryCaches[lang];
  }
  dictionaryCaches[lang] = [];
  return [];
}

/**
 * [v60.Elite] Carga el diccionario de palabras protegidas para Babel
 */
function loadBabelProtected(lang = 'es', forceReload = false) {
  if (!forceReload && babelProtectedCaches[lang]) {
    return babelProtectedCaches[lang];
  }

  const babelPath = path.join(__dirname, 'config', 'data', 'dictionaries', lang, 'babel_protected.json');
  const parsed = storage.readJSON(babelPath);
  if (parsed && Array.isArray(parsed)) {
    babelProtectedCaches[lang] = parsed;
    console.log(`🧠 [BABEL-SYNC] Escudo de protección cargado para [${lang}]: ${parsed.length} términos.`);
    return parsed;
  }
  babelProtectedCaches[lang] = [];
  return [];
}

/**
 * [v60.Elite] Guarda el diccionario de palabras protegidas para Babel
 */
function saveBabelProtected(data, lang = 'es') {
  try {
    const babelPath = path.join(__dirname, 'config', 'data', 'dictionaries', lang, 'babel_protected.json');
    const dir = path.dirname(babelPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(babelPath)) {
      createTimestampedBackup(babelPath, `babel_protected_${lang}`);
    }

    storage.writeJSON(babelPath, data);
    babelProtectedCaches[lang] = data;
    console.log(`💾 Escudo Babel (${lang}) guardado en disco:`, data.length, 'términos');
    return true;
  } catch (e) {
    console.error(`❌ Error guardando escudo Babel (${lang}):`, e.message);
    return false;
  }
}

function saveDictionary(data, lang = 'es') {
  try {
    const dictPath = path.join(__dirname, 'config', 'data', 'dictionaries', lang, 'dictionary.json');

    const dir = path.dirname(dictPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Crear backup con timestamp antes de escribir
    if (fs.existsSync(dictPath)) {
      createTimestampedBackup(dictPath, `dictionary_${lang}`);
    }

    // Escritura modular
    storage.writeJSON(dictPath, data);

    dictionaryCaches[lang] = data;
    console.log(`💾 Diccionario (${lang}) guardado en disco:`, data.length, 'reglas');
    return true;
  } catch (e) {
    console.error(`❌ Error guardando diccionario (${lang}):`, e.message);
    return false;
  }
}

const MODELS_CONFIG = {
  'es': { type: 'zip', folder: 'vosk-model-small-es-0.42' },
  'en': { type: 'zip', folder: 'vosk-model-small-en-us-0.15' },
  'eu': { type: 'bin', file: 'ggml-base-eu.bin' },
  'de': { type: 'zip', folder: 'vosk-model-small-de-0.15' },
  'fr': { type: 'zip', folder: 'vosk-model-small-fr-0.22' },
  'it': { type: 'zip', folder: 'vosk-model-small-it-0.22' },
  'ja': { type: 'zip', folder: 'vosk-model-small-ja-0.22' },
  'pt': { type: 'zip', folder: 'vosk-model-small-pt-0.3' },
  'ru': { type: 'zip', folder: 'vosk-model-small-ru-0.22' },
  'zh': { type: 'zip', folder: 'vosk-model-small-cn-0.22' },
  'tr': { type: 'zip', folder: 'vosk-model-small-tr-0.3' },
  'ca': { type: 'zip', folder: 'vosk-model-small-ca-0.4' },
  'ar': { type: 'zip', folder: 'vosk-model-small-ar-0.3' },
  'fa': { type: 'zip', folder: 'vosk-model-small-fa-0.4' },
  'uk': { type: 'zip', folder: 'vosk-model-small-uk-v3-nano' },
  'sv': { type: 'zip', folder: 'vosk-model-small-sv-rhasspy-0.15' },
  'vi': { type: 'zip', folder: 'vosk-model-small-vn-0.4' },
  'ko': { type: 'zip', folder: 'vosk-model-small-ko-0.22' },
  'nl': { type: 'zip', folder: 'vosk-model-small-nl-0.22' },
  'uz': { type: 'zip', folder: 'vosk-model-small-uz-0.22' },
  'kk': { type: 'zip', folder: 'vosk-model-small-kz-0.42' },
  'pl': { type: 'zip', folder: 'vosk-model-small-pl-0.22' },
  'gl': { type: 'bin', file: 'ggml-base-gl.bin' },
  'eo': { type: 'zip', folder: 'vosk-model-small-eo-0.42' }
};

const LANG_NAMES = {
  'es': 'Castellano', 'en': 'English', 'eu': 'Euskera',
  'de': 'Deutsch', 'fr': 'Français', 'it': 'Italiano',
  'ja': '日本語', 'pt': 'Português', 'ru': 'Русский',
  'zh': '中文', 'tr': 'Türkçe', 'ca': 'Català',
  'ar': 'العربية', 'fa': 'Farsi', 'uk': 'Українська',
  'sv': 'Svenska', 'vi': 'Tiếng Việt', 'ko': '한국어',
  'nl': 'Nederlands', 'uz': 'Oʻzbekcha', 'kk': 'Қазақша',
  'pl': 'Polski', 'gl': 'Galego', 'eo': 'Esperanto'
};

// ✅ SOBERANÍA: Carga dinámica de modelos instalados físicamente en disco duro (Grado Industrial)
function getInstalledLanguages() {
  const installed = [];
  try {
    const modelsPath = getModelsPath();
    const isCustom = (modelsPath !== __dirname);

    // Reducción I/O: Lectura única de directorio en memoria local para análisis O(N)
    const filesInDir = fs.existsSync(modelsPath) ? fs.readdirSync(modelsPath) : [];

    Object.keys(MODELS_CONFIG).forEach(code => {
      const config = MODELS_CONFIG[code];
      if (config.type === 'bin') {
        // Buscar en modelsPath y fallback defensivo a storage local si no reside en la ruta activa
        let filePath = path.join(modelsPath, config.file);
        if (!fs.existsSync(filePath)) {
          filePath = path.join(__dirname, 'storage', 'models', 'whisper', config.file);
        }
        if (fs.existsSync(filePath)) {
          installed.push(code);
        }
      } else {
        const folderName = config.folder || `vosk-model-small-${code}`;

        let folderPath = path.join(modelsPath, folderName);
        let exists = fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory();

        if (!exists && !isCustom) {
          folderPath = path.join(__dirname, folderName);
          exists = fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory();
        }

        if (exists) {
          installed.push(code);
        } else {
          // Búsqueda elástica de prefijo por si el nombre cambia ligeramente
          const prefix = config.folder ? config.folder.split('-').slice(0, 4).join('-') : `vosk-model-small-${code}`;

          let found = filesInDir.some(file => {
            if (file.toLowerCase().startsWith(prefix.toLowerCase())) {
              const stat = fs.statSync(path.join(modelsPath, file));
              return stat.isDirectory();
            }
            return false;
          });

          if (!found && !isCustom) {
            const filesInDirLocal = fs.readdirSync(__dirname);
            found = filesInDirLocal.some(file => {
              if (file.toLowerCase().startsWith(prefix.toLowerCase())) {
                const stat = fs.statSync(path.join(__dirname, file));
                return stat.isDirectory();
              }
              return false;
            });
          }

          if (found) installed.push(code);
        }
      }
    });
  } catch (e) {
    console.error('⚠️ [LANG-SCANNER] Error escaneando modelos en disco:', e.message);
  }

  // Resiliencia: Fallback a los dos idiomas por defecto si no hay nada en disco
  if (installed.length === 0) {
    return ['es', 'en'];
  }
  return [...new Set(installed)];
}

// Inicializar al arrancar dinámicamente
initVosk();
const installedLangs = getInstalledLanguages();
installedLangs.forEach(lang => {
  loadDictionary(lang);
  loadBabelProtected(lang);
});

// === TRIGGERS PERSISTENCE (misma arquitectura que dictionary) ===
// El servidor guarda la DEFINICIÓN del trigger (sin estado enabled).
// El estado enabled es local a cada dispositivo (localStorage del cliente).
const TRIGGERS_FILE = path.join(__dirname, 'config', 'data', 'triggers.json');
let triggersCache = [];

function loadTriggersFile() {
  try {
    const syncedTriggers = triggerFileSync.init({
      storage,
      triggersFilePath: TRIGGERS_FILE,
      uploadsDirPath: TRIGGERS_UPLOADS_DIR,
      onExternalChange: (updatedTriggers) => {
        triggersCache = Array.isArray(updatedTriggers) ? updatedTriggers : [];
        saveTriggersFile();
        triggerManager.updateTriggers(triggersCache);
        if (typeof io !== 'undefined') {
          io.emit('triggers-data', triggersCache);
        }
      }
    });

    if (Array.isArray(syncedTriggers)) {
      triggersCache = syncedTriggers;
      storage.writeJSON(TRIGGERS_FILE, triggersCache);
      console.log(`⚡ Triggers cargados y sincronizados con carpeta triggers/: ${triggersCache.length}`);
      triggerManager.updateTriggers(triggersCache);
      return triggersCache;
    }
  } catch (e) {
    console.error('⚠️ Error en sincronización de carpeta triggers/, aplicando fallback a triggers.json:', e.message);
  }

  const parsed = storage.readJSON(TRIGGERS_FILE);
  if (parsed) {
    triggersCache = parsed;
    console.log(`⚡ Triggers cargados: ${triggersCache.length}`);
    triggerManager.updateTriggers(triggersCache); // Sincronizar motor IN
  } else {
    triggersCache = [];
  }
  return triggersCache;
}

function isValidHost(host) {
  if (!host || typeof host !== 'string') return false;
  host = host.trim();
  if (host.length === 0) return false;
  if (host.startsWith('.') || host.endsWith('.')) return false;

  if (host === 'localhost' || host === '127.0.0.1') return true;

  if (/[^a-zA-Z0-9\.\-\:\]\[]/.test(host)) return false;

  if (/^[0-9\.]+$/.test(host)) {
    const parts = host.split('.');
    if (parts.length !== 4) return false;
    for (const part of parts) {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 0 || num > 255 || String(num) !== part) {
        return false;
      }
    }
    return true;
  }

  const labels = host.split('.');
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) return false;
    if (!/^[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(label)) {
      return false;
    }
  }
  return true;
}

function saveTriggersFile() {
  try {
    const resolvedTriggersFile = (storage && typeof storage.resolveWritablePath === 'function')
      ? storage.resolveWritablePath(TRIGGERS_FILE)
      : TRIGGERS_FILE;
    // Crear backup con timestamp antes de escribir
    if (fs.existsSync(resolvedTriggersFile)) {
      createTimestampedBackup(TRIGGERS_FILE, 'triggers');
    }
    // Escritura modular
    storage.writeJSON(TRIGGERS_FILE, triggersCache);
    console.log(`💾 Triggers guardados en disco: ${triggersCache.length} triggers`);
  } catch (e) {
    console.error('❌ Error guardando triggers:', e.message);
  }
}

loadTriggersFile();

// [v60] Vincular inyección automática de TriggerManager al Socket.io
triggerManager.on('message', (automatedMsg) => {
  if (global.sessionStats) global.sessionStats.msg_count++;
  // [v60.Elite] Contador de triggers refinado (Soberanía Total)
  if (automatedMsg.originSocketId) {
    const user = users.get(automatedMsg.originSocketId);
    if (user) {
      user.triggerCount = (user.triggerCount || 0) + 1;
    }
  }

  // Guardar en historial
  messageHistory.push({ ...automatedMsg });
  if (messageHistory.length > MAX_HISTORY) messageHistory.shift();
  saveMessageHistory();

  // Emitir a todos (Chat Visual)
  if (typeof io !== 'undefined') {
    io.emit('receive-message', automatedMsg);
    console.log(`🤖 [AUTO-MSG] Inyectado: ${automatedMsg.text.substring(0, 30)}...`);
  }

  // [v60.Elite] Disparar Triggers OUT (Aislamiento de Hardware)
  // Si viene de un socket específico (Timecode), solo disparamos para ese socket.
  let targets = [];
  const allTargets = getActiveUsersForTriggers();

  if (automatedMsg.originSocketId) {
    targets = allTargets.filter(u => u.socketId === automatedMsg.originSocketId);
  } else if (automatedMsg.sendToAll) {
    targets = allTargets;
  }

  if (targets.length > 0) {
    triggerManager.processMessageTriggers(automatedMsg, targets);
  }
});

// [v60.Elite] Canalizadores de hardware desde el motor central
triggerManager.on('dispatch-osc', (data) => {
  if (global.sessionStats) global.sessionStats.trigger_count++;
  sendOscUdp(data.host, data.port, data.address, data.args);
});

triggerManager.on('dispatch-sacn', (data) => {
  if (global.sessionStats) global.sessionStats.trigger_count++;
  sendSacn(data);
});

// [v60.Elite] Canalizador de avisos selectivos de Trigger desde el motor central de servidor
triggerManager.on('trigger-notice', (data) => {
  if (!data) return;
  const trId = data.triggerId || data.triggerName || 'global';
  const timeStr = data.time || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (typeof io !== 'undefined' && io.sockets && io.sockets.sockets) {
    const payload = {
      triggerId: data.triggerId || trId,
      triggerName: data.triggerName,
      triggerType: (data.triggerType || 'OUT').toUpperCase(),
      time: timeStr
    };

    // Fallback Murphy: Si no viene un ID específico de trigger, broadcast de seguridad a todos
    if (!data.triggerId) {
      io.emit('system-warning-trigger-out', payload);
      return;
    }

    try {
      for (const [sId, sSocket] of io.sockets.sockets.entries()) {
        if (sSocket && sSocket.connected) {
          const isMaster = (categoriesData && categoriesData.masterId === sId);
          if (isMaster || global.isTriggerEnabledForUser(sId, data.triggerId)) {
            sSocket.emit('system-warning-trigger-out', payload);
          }
        }
      }
    } catch (err) {
      console.error('⚠️ [TRIGGER-NOTICE] Error en emisión segmentada, aplicando fallback global:', err);
      io.emit('system-warning-trigger-out', payload);
    }
  }
});

// === GLOBAL SETTINGS PERSISTENCE ===
const GLOBAL_SETTINGS_FILE = path.join(__dirname, 'config', 'data', 'global-settings.json');

const APP_CANONICAL_DEFAULTS = Object.freeze({
  theme: "dark",
  dna: {
    bgPrimary: "#0a0a0f",
    bgSecondary: "#151522",
    primary: "#7b68ee",
    secondary: "#ff6b35",
    text: "#ffffff",
    textSecondary: "#aaaaaa"
  },
  typography: {
    fontSize: 100,
    fontWeight: 400
  }
});

let globalSettings = JSON.parse(JSON.stringify(APP_CANONICAL_DEFAULTS));

function loadGlobalSettings() {
  try {
    const parsed = storage.readJSON(GLOBAL_SETTINGS_FILE);
    if (parsed && typeof parsed === 'object') {
      globalSettings = {
        theme: parsed.theme === 'light' ? 'light' : 'dark',
        dna: {
          bgPrimary: parsed.dna?.bgPrimary || APP_CANONICAL_DEFAULTS.dna.bgPrimary,
          bgSecondary: parsed.dna?.bgSecondary || APP_CANONICAL_DEFAULTS.dna.bgSecondary,
          primary: parsed.dna?.primary || APP_CANONICAL_DEFAULTS.dna.primary,
          secondary: parsed.dna?.secondary || APP_CANONICAL_DEFAULTS.dna.secondary,
          text: parsed.dna?.text || APP_CANONICAL_DEFAULTS.dna.text,
          textSecondary: parsed.dna?.textSecondary || APP_CANONICAL_DEFAULTS.dna.textSecondary
        },
        typography: {
          fontSize: Math.max(40, Math.min(250, parseInt(parsed.typography?.fontSize) || 100)),
          fontWeight: Math.max(100, Math.min(900, parseInt(parsed.typography?.fontWeight) || 400))
        },
        language: parsed.language || 'es',
        translateEnabled: parsed.translateEnabled !== false
      };
      console.log(`📡 [GLOBAL-SETTINGS] Configuración global cargada desde disco (Traducción: ${globalSettings.translateEnabled ? 'ON' : 'OFF'})`);
    } else {
      globalSettings = JSON.parse(JSON.stringify(APP_CANONICAL_DEFAULTS));
    }
  } catch (err) {
    console.error(`⚠️ [GLOBAL-SETTINGS] Error cargando settings, usando defaults:`, err.message);
    globalSettings = JSON.parse(JSON.stringify(APP_CANONICAL_DEFAULTS));
  }
  return globalSettings;
}

function saveGlobalSettings() {
  try {
    storage.writeJSON(GLOBAL_SETTINGS_FILE, globalSettings);
    console.log(`💾 [GLOBAL-SETTINGS] Configuración global guardada en disco`);
  } catch (e) {
    console.error('❌ [GLOBAL-SETTINGS] Error guardando configuración global:', e.message);
  }
}

loadGlobalSettings();

// === SUB-USUARIOS PERSISTENCE ===
const SUBUSERS_FILE = path.join(__dirname, 'config', 'data', 'subusers.json');
let MAX_SUBUSERS_PER_ROOT = (globalSettings && globalSettings.maxSubUsers) || parseInt(process.env.MAX_SUBUSERS_PER_ROOT, 10) || 5;

// In-memory maps for sub-users and mic assignments. Declare early so persistence
// helpers can reference them safely during startup.
const subUsers = new Map();
const micAssignments = new Map();

function saveSubUsers() {
  try {
    const categories = categoryManager.loadCategories();
    const masterUsername = categories.masterUsername;

    if (fs.existsSync(SUBUSERS_FILE)) {
      createTimestampedBackup(SUBUSERS_FILE, 'subusers');
    }

    // [v60.ELITE] SOBERANÍA ÚNICA: Solo persistimos los del Master actual.
    // Lo demás se elimina para mantener la pureza de la sesión única.
    const arr = Array.from(subUsers.values()).filter(s => s && s.rootUsername === masterUsername);

    const success = storage.writeJSON(SUBUSERS_FILE, arr);
    if (success) {
      console.log(`💾 [SOBERANÍA] Persistencia de Master única guardada: ${arr.length} usuarios.`);
    }
    return success;
  } catch (e) {
    console.error('❌ Error guardando sub-usuarios:', e.message);
    return false;
  }
}

function loadSubUsers() {
  try {
    const categories = categoryManager.loadCategories();
    const masterUsername = categories.masterUsername;

    if (!fs.existsSync(SUBUSERS_FILE)) return;

    const parsed = storage.readJSON(SUBUSERS_FILE);
    if (Array.isArray(parsed)) {
      // FILTRO DE SOBERANÍA ÚNICA: Solo cargar los del Master
      const filtered = parsed.filter(su => su && su.rootUsername === masterUsername);

      subUsers.clear();
      micAssignments.clear();

      filtered.forEach(su => {
        if (su && su.subUserId) {
          // VALIDADOR DE HUÉRFANOS: Verificar si la categoría aún existe
          const catExists = categories.categories.some(c => c.id === su.category || c.name === su.category);
          if (!catExists) {
            console.warn(`⚠️ [INTEGRIDAD] Sub-usuario ${su.name} tenía categoría inexistente (${su.category}). Reasignando a General.`);
            su.category = 'General';
          }

          subUsers.set(su.subUserId, su);
          if (su.mic && su.mic.deviceId) {
            const key = `${su.mic.deviceId}:${su.mic.channel || 0}`;
            micAssignments.set(key, su.subUserId);
          }
        }
      });

      // PURGA FÍSICA: Eliminar del disco lo que no es del Master actual
      if (filtered.length !== parsed.length) {
        storage.writeJSON(SUBUSERS_FILE, filtered);
        console.log(`🧹 [SOBERANÍA] Limpieza de arranque: ${parsed.length - filtered.length} sub-usuarios antiguos eliminados.`);
      }

      console.log(`🔄 [SOBERANÍA] Sub-usuarios del Master actual cargados: ${subUsers.size}`);
    }
  } catch (e) {
    console.error('❌ Error cargando sub-usuarios:', e.message);
  }
}

loadSubUsers();



const app = express();

function getDefaultLanguage() {
  try {
    const pathFile = storage.resolveWritablePath(path.join(__dirname, 'config', 'data', 'models-path.json'));
    if (fs.existsSync(pathFile)) {
      const data = JSON.parse(fs.readFileSync(pathFile, 'utf8'));
      if (data && data.defaultLang) {
        return data.defaultLang.toLowerCase();
      }
    }
  } catch (e) {
    console.error("❌ Error leyendo defaultLang desde models-path.json:", e.message);
  }
  return 'es'; // Fallback
}

app.get('/api/default-lang', (req, res) => {
  res.json({ defaultLang: getDefaultLanguage() });
});

// [v60.Murphy] Endpoint proxy defensivo para términos de la aplicación (Stale-While-Revalidate)
app.get('/api/terms-app', async (req, res) => {
  // 1. Intento primario remoto con timeout estricto y anti-caché vía HTTPS nativo
  try {
    const remoteUrl = `https://www.talk-me.app/locales/terms/terms-app.html?_t=${Date.now()}`;
    const remotePromise = new Promise((resolve, reject) => {
      const reqH = https.get(remoteUrl, { timeout: 3500 }, (resp) => {
        if (resp.statusCode !== 200) {
          resp.resume();
          return reject(new Error(`Status ${resp.statusCode}`));
        }
        let data = '';
        resp.setEncoding('utf8');
        resp.on('data', chunk => { data += chunk; });
        resp.on('end', () => resolve(data));
      });
      reqH.on('error', reject);
      reqH.on('timeout', () => { reqH.destroy(); reject(new Error('Timeout 3.5s')); });
    });

    const remoteData = await remotePromise;
    if (remoteData && typeof remoteData === 'string' && remoteData.length > 200) {
      res.setHeader('X-Terms-Source', 'remote-ftp');
      return res.send(remoteData);
    }
  } catch (err) {
    // Silencio en consola para no saturar los logs ante modo offline/búnker
  }

  // 2. Red de Seguridad (Fallback Local Incondicional en Disco)
  try {
    const localTermsAppPath = path.join(__dirname, 'public', 'terms-app.html');
    if (fs.existsSync(localTermsAppPath)) {
      const localData = await fs.promises.readFile(localTermsAppPath, 'utf8');
      res.setHeader('X-Terms-Source', 'local-disk-fallback');
      return res.send(localData);
    }
  } catch (fsErr) {
    console.error('❌ Error leyendo public/terms-app.html:', fsErr.message);
  }

  // 3. Fusible de Emergencia Final (Garantizar que jamás responda 500)
  res.setHeader('X-Terms-Source', 'emergency-stub');
  res.send('<div lang="es" class="terms-lang"><h2>TÉRMINOS DEL SERVICIO</h2><p>Talk-me opera como herramienta de comunicación soberana local offline.</p></div>');
});

// Configurar EJS como motor de vistas
app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));
app.locals.installedLangs = getInstalledLanguages();
app.locals.langNames = LANG_NAMES;

// --- 🛡️ ELITE SECURITY SHIELD (Hallazgo 001, 002) ---
// Content Security Policy (CSP) & Defense-in-Depth
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "blob:"],
      scriptSrc: ["'self'", "blob:", "'unsafe-inline'", "'unsafe-eval'"], // Critical for some browser engines/workers
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      mediaSrc: ["'self'", "blob:", "data:"],
      workerSrc: ["'self'", "blob:"],
      fontSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// DoS Protection: Rate limiting for API and WebSocket upgrade attempts
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // [v60.Elite] Aumentado límite para polling agresivo local de canales de audio
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiadas solicitudes desde esta IP, por favor intente de nuevo más tarde.'
});
app.use('/api/', limiter); // Apply to potential API routes
// Note: WebSocket upgrades are naturally throttled by the underlying TCP/HTTPS stack, 
// but we apply this as a general safety measure.

// Mount audio API routes (ASIO / SoundGrid / Virtual device management)
try {
  const audioRoutes = require(path.join(__dirname, 'modules', 'audio-routes.js'));
  // [v60.ELITE] Fix CRÍTICO: express.json() debe inyectarse ANTES de audioRoutes 
  // para que req.body no sea undefined en las peticiones POST de capacidades.
  app.use('/api/audio', express.json({ limit: '1mb' }), audioRoutes);
  console.log('🔌 Audio API routes mounted at /api/audio');
} catch (e) {
  console.warn('⚠️ Audio API routes could not be mounted (stub files may be missing):', e.message);
}

// --- ENDPOINTS API TRIGGERS (v60) ---
// Guardado de triggers con soporte multimedia (Audio/Imagen)
app.post('/api/triggers/save-with-media', uploadTriggers.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), (req, res) => {
  try {
    if (!req.body.trigger) {
      return res.status(400).json({ success: false, error: 'Cuerpo de solicitud vacío' });
    }

    const triggerData = JSON.parse(req.body.trigger);
    if (!triggerData || !triggerData.id) {
      return res.status(400).json({ success: false, error: 'Datos de trigger inválidos' });
    }

    if (triggerData.direction === 'IN') {
      const ext = triggerData.external || {};
      if (triggerData.type === 'osc') {
        const osc = ext.osc || {};
        if (!isValidHost(osc.host)) {
          return res.status(400).json({ success: false, error: 'IP o Host OSC de entrada inválido.' });
        }
        const port = parseInt(osc.port);
        if (isNaN(port) || port < 1 || port > 65535) {
          return res.status(400).json({ success: false, error: 'Puerto OSC de entrada inválido.' });
        }
      } else if (triggerData.type === 'sacn') {
        const sacn = ext.sacn || {};
        if (sacn.mode === 'unicast' && !isValidHost(sacn.ip)) {
          return res.status(400).json({ success: false, error: 'IP de Destino sACN de entrada inválida.' });
        }
        const universe = parseInt(sacn.universe);
        if (isNaN(universe) || universe < 1 || universe > 63999) {
          return res.status(400).json({ success: false, error: 'Universo sACN de entrada inválido (1-63999).' });
        }
        const priority = parseInt(sacn.priority);
        if (isNaN(priority) || priority < 0 || priority > 200) {
          return res.status(400).json({ success: false, error: 'Prioridad sACN de entrada inválida (0-200).' });
        }
      }
    } else {
      if (triggerData.type === 'osc') {
        const osc = triggerData.osc || {};
        if (!isValidHost(osc.host)) {
          return res.status(400).json({ success: false, error: 'IP o Host OSC inválido.' });
        }
        const port = parseInt(osc.port);
        if (isNaN(port) || port < 1 || port > 65535) {
          return res.status(400).json({ success: false, error: 'Puerto OSC inválido.' });
        }
      } else if (triggerData.type === 'sacn') {
        const sacn = triggerData.sacn || {};
        if (sacn.mode === 'unicast' && !isValidHost(sacn.destinationIp)) {
          return res.status(400).json({ success: false, error: 'IP de Destino sACN inválida para modo Unicast.' });
        }
        const universe = parseInt(sacn.universe);
        if (isNaN(universe) || universe < 1 || universe > 63999) {
          return res.status(400).json({ success: false, error: 'Universo sACN inválido (1-63999).' });
        }
        const priority = parseInt(sacn.priority);
        if (isNaN(priority) || priority < 0 || priority > 200) {
          return res.status(400).json({ success: false, error: 'Prioridad sACN inválida (0-200).' });
        }
      }
    }

    // Procesar archivos subidos
    if (req.files) {
      if (req.files['audio']) {
        const audioFile = req.files['audio'][0];
        triggerData.message.audio = `/uploads/triggers/${audioFile.filename}`;
      }
      if (req.files['image']) {
        const imageFile = req.files['image'][0];
        triggerData.message.image = `/uploads/triggers/${imageFile.filename}`;
      }
    }

    // Actualizar caché y persistencia
    const idx = triggersCache.findIndex(t => t.id === triggerData.id);
    if (idx !== -1) {
      // [v60] Limpiar archivos antiguos si han sido reemplazados
      const old = triggersCache[idx];
      if (req.files['audio'] && old.message?.audio) {
        const oldPath = triggerFileSync.resolveMediaPhysicalPath(old.message.audio) || path.join(__dirname, 'public', old.message.audio);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { console.warn(`⚠️ No se pudo eliminar audio antiguo: ${oldPath}`); }
        }
      }
      if (req.files['image'] && old.message?.image) {
        const oldPath = triggerFileSync.resolveMediaPhysicalPath(old.message.image) || path.join(__dirname, 'public', old.message.image);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { console.warn(`⚠️ No se pudo eliminar imagen antigua: ${oldPath}`); }
        }
      }
      triggersCache[idx] = triggerData;
    } else {
      triggersCache.push(triggerData);
    }

    triggerFileSync.saveSingleTrigger(triggerData);
    saveTriggersFile();
    if (typeof io !== 'undefined') {
      io.emit('triggers-data', triggersCache);
    }
    triggerManager.updateTriggers(triggersCache);

    console.log(`✅ Trigger con media guardado: ${triggerData.name} (Emojis OK)`);
    res.json({ success: true, trigger: triggerData });
  } catch (e) {
    console.error('❌ Error en save-with-media:', e);
    res.status(500).json({ success: false, error: 'Error al procesar JSON o archivos: ' + e.message });
  }
});

const selfsigned = require('selfsigned');
const certManager = require('./cert-manager');
const wifiDetector = require('./wifi-detector');
const QRCode = require('qrcode');

function getLocalIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4') {
        ips.push(iface.address);
      }
    }
  }
  return ips.sort();
}

/**
 * [v60.966] Gestión dinámica de la sala de alertas de Euskera (Basada en Contexto Total)
 * Suscribe al socket si el usuario principal O alguno de sus subusuarios usa Euskera.
 */
function syncEuskeraAlerts(socket) {
  const user = users.get(socket.id);
  const hasNeuralSubUser = Array.from(subUsers.values()).some(s => s.rootUserId === socket.id && (s.lang === 'eu' || s.lang === 'gl'));
  const lang = (user && user.lang) || 'es';

  if (lang === 'eu' || lang === 'gl' || hasNeuralSubUser) {
    socket.join('euskera-alerts');
    // Si el motor ya tiene un estado, informar al usuario para sincronizar su UI
    if (whisperMgr) {
      if (whisperMgr.status === 'READY') {
        socket.emit('ia-transcriptions-status', { status: 'READY' });
      } else if (whisperMgr.status === 'LOADING') {
        socket.emit('ia-transcriptions-status', { status: 'LOADING' });
      }
    }
  } else {
    socket.leave('euskera-alerts');
  }
}

const currentIps = getLocalIps();
const ipCachePath = path.join(__dirname, 'config', 'data', 'cert_ips.json');
const keyPath = path.join(__dirname, 'server.key');
const certPath = path.join(__dirname, 'server.cert');

let generateNewCert = false;

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath) || !fs.existsSync(ipCachePath)) {
  generateNewCert = true;
} else {
  try {
    const cachedIps = JSON.parse(fs.readFileSync(ipCachePath, 'utf8'));
    if (JSON.stringify(cachedIps) !== JSON.stringify(currentIps)) {
      generateNewCert = true;
      console.log("🌐 Cambio de IP detectado. Regenerando certificados SSL automáticamente...");
    }
  } catch (e) {
    generateNewCert = true;
  }
}

// --- [v60.Elite] WHISPER DYNAMIC ORCHESTRATOR ---
const { spawn } = require('child_process');

// [v60.Elite] Orquestador global de Whisper
let whisperMgr = null;

class WhisperManager {
  constructor() {
    this.process = null;
    this.status = 'OFF'; // [v60.Elite] Estado inicial obligatorio
    this.port = 8080;

    // [v60.Elite] Determinar ruta ejecutable según el OS para compatibilidad macOS / Windows (Hallazgo B)
    const isWin = process.platform === 'win32';
    this.exePath = isWin
      ? path.join(__dirname, 'bin', 'whisper', 'Release', 'whisper-server.exe')
      : path.join(__dirname, 'bin', 'whisper', 'Release', 'whisper-server');

    // [v60.Elite] Ruta corregida al modelo usando getModelsPath() y fallback a local
    const modelsPath = getModelsPath();
    let modelFilePath = path.join(modelsPath, 'ggml-base-eu.bin');
    if (!fs.existsSync(modelFilePath)) {
      modelFilePath = path.join(__dirname, 'storage', 'models', 'whisper', 'ggml-base-eu.bin');
    }
    this.modelPath = modelFilePath;
  }

  setReady(io) {
    if (this.status === 'READY') return;
    console.log(`✅ [WHISPER-MGR] Motor de Euskera DETECTADO (LISTO). Emitiendo a sala euskera-alerts.`);
    this.status = 'READY';
    io.to('euskera-alerts').emit('ia-transcriptions-status', { status: 'READY' });
  }

  async ensureStarted(io) {
    if (this.status === 'READY') return true;
    if (this.status === 'LOADING') return false;

    // Control preventivo de ficheros para evitar crash de spawn() (Hallazgo C / 5c)
    if (!fs.existsSync(this.exePath)) {
      console.warn(`⚠️ [WHISPER-MGR] Binario transcripción Euskera no encontrado: ${this.exePath}. Desactivando Whisper.`);
      this.status = 'OFF';
      io.to('euskera-alerts').emit('ia-transcriptions-status', { status: 'MISSING' });
      return false;
    }

    if (!fs.existsSync(this.modelPath)) {
      console.warn(`⚠️ [WHISPER-MGR] Modelo de Whisper no encontrado: ${this.modelPath}. Desactivando Whisper.`);
      this.status = 'OFF';
      io.to('euskera-alerts').emit('ia-transcriptions-status', { status: 'MISSING' });
      return false;
    }

    console.log(`🚀 [WHISPER-MGR] Iniciando motor de Euskera desde: ${this.exePath}`);
    this.status = 'LOADING';
    io.to('euskera-alerts').emit('ia-transcriptions-status', { status: 'LOADING' });

    try {
      this.process = spawn(this.exePath, [
        '-m', this.modelPath,
        '--port', this.port.toString()
      ], {
        cwd: path.dirname(this.exePath),
        detached: false
      });

      const checkReady = (data) => {
        const output = data.toString();
        console.log(`📡 [WHISPER-MGR-OUTPUT]: ${output.trim()}`);

        // [v60.Elite] Búsqueda de la señal definitiva de escucha
        if (output.toLowerCase().includes('http server listening') ||
          output.toLowerCase().includes('listening on')) {
          console.log("📡 [WHISPER-MGR] Señal de escucha detectada en logs.");
          this.setReady(io);
        }
      };

      this.process.stdout.on('data', checkReady);
      this.process.stderr.on('data', checkReady);

      // [v60.Elite] SISTEMA DE LATIDO (Heartbeat) con Periodo de Gracia
      let attempts = 0;
      const heartbeatInterval = setInterval(async () => {
        if (this.status !== 'LOADING') {
          clearInterval(heartbeatInterval);
          return;
        }
        attempts++;
        try {
          const http = require('http');
          const req = http.get(`http://127.0.0.1:${this.port}/inference`, (res) => {
            // El puerto responde, pero el motor de whisper.cpp puede estar aún cargando el modelo en VRAM
            console.log(`💓 [WHISPER-MGR] Puerto abierto (${res.statusCode}). Esperando carga final del modelo...`);
            setTimeout(() => {
              if (this.status === 'LOADING') {
                console.log("🏁 [WHISPER-MGR] Carga confirmada tras periodo de estabilidad.");
                this.setReady(io);
              }
              clearInterval(heartbeatInterval);
            }, 4000); // 4 segundos de gracia para asegurar que el modelo está en RAM
          });
          req.on('error', () => { /* Aún no está listo */ });
          req.setTimeout(500);
        } catch (e) { /* Silencio */ }

        if (attempts > 45) { // Aumentamos a 45 segundos por si el PC va lento
          clearInterval(heartbeatInterval);
          console.warn("⚠️ [WHISPER-MGR] El motor tarda demasiado en responder.");
        }
      }, 1500); // Latido cada 1.5s para no saturar

      this.process.on('error', (err) => {
        console.error("❌ [WHISPER-MGR] Error al arrancar el binario:", err.message);
        this.status = 'OFF';
        io.to('euskera-alerts').emit('ia-transcriptions-status', { status: 'ERROR', error: err.message });
      });

      this.process.on('close', (code) => {
        console.log(`🔌 [WHISPER-MGR] Proceso cerrado con código ${code}`);
        this.status = 'OFF';
        this.process = null;
        if (code !== 0 && code !== null) {
          io.to('euskera-alerts').emit('ia-transcriptions-status', { status: 'ERROR', error: `El motor se cerró inesperadamente (Código ${code})` });
        }
      });

    } catch (e) {
      console.error("❌ [WHISPER-MGR] Excepción en arranque dinámico:", e);
      this.status = 'OFF';
    }
  }

  stop() {
    if (this.process) {
      console.log("🧹 [WHISPER-MGR] Cerrando motor de Euskera...");
      try {
        this.process.kill();
      } catch (e) { }
      this.process = null;
      this.status = 'OFF';
    }
  }
}

// Instanciar el orquestador global
whisperMgr = new WhisperManager();

// Asegurar limpieza al cerrar el servidor Node
process.on('exit', () => { whisperMgr.stop(); if (global.updateTelemetry) global.updateTelemetry(); });

async function initServer() {
  if (generateNewCert) {
    await certManager.generateServerCert(currentIps, keyPath, certPath, ipCachePath);
  }

  // Configuración de HTTPS (Requerido para el micro en iPhone/Red Local)
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  const server = https.createServer(options, app);

  // --- 🛰️ REDIS ADAPTER (Elite Scalability) ---
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  let redisClient = null;
  if (Redis) {
    try {
      redisClient = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 100, 3000);
        }
      });
      // Capture errors to prevent "Unhandled error event" flooding
      redisClient.on('error', () => { });
      redisClient.connect().then(() => {
        console.log('✅ Redis conectado. Habilitando clustering distribuido.');
      }).catch(() => {
        console.log('⚠️ Redis offline o no instalado. Funcionando en modo nodo único (Standalone).');
      });
    } catch (e) {
      console.log('⚠️ Error creando cliente Redis, funcionando en modo standalone.');
      redisClient = null;
    }
  } else {
    console.log('⚠️ ioredis no instalado. Funcionando en modo nodo único (Standalone).');
  }

  const ioOptions = {
    cors: {
      origin: true,
      methods: ["GET", "POST"]
    },
    maxHttpBufferSize: 5 * 1024 * 1024,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    upgradeTimeout: 30000
  };

  // Attach redis adapter if connected
  io = socketIo(server, ioOptions);

  // --- 🤖 BRIDGE DE AUTOMATIZACIÓN (Triggers IN) ---
  // [v60.Elite] El listener principal se encuentra consolidado en la Línea 941
  // para garantizar la integridad del historial y los contadores de telemetría.

  // [v60.Elite] Throttling independiente por socket para telemetría fluida
  const smpteLastEmitMap = new Map(); // socketId -> timestamp

  // [v60.Elite] Despacho de Telemetría SMPTE con Soberanía Total
  triggerManager.on('smpte-update', (data) => {
    try {
      const { sovereigntyKey, ...tcData } = data;
      if (!sovereigntyKey) return;

      const now = Date.now();

      // [v60.Elite] BROADCAST ROBUSTO: 
      // Usamos .startsWith para que tanto 'anon_IP' como 'User_IP' reciban la telemetría de su hardware.
      const channelSuffix = sovereigntyKey.split('_ch');
      const channel = channelSuffix.length > 1 ? parseInt(channelSuffix[1]) : 0;

      for (const [sid, s] of io.sockets.sockets) {
        const u = users.get(sid);
        const cleanIp = getCleanIp(s);
        const socketKey = u ? `${u.username}_${u.ip}` : `anon_${cleanIp}`;

        if (sovereigntyKey.startsWith(socketKey) || (sovereigntyKey.includes(cleanIp) && !u)) {
          const lastEmit = smpteLastEmitMap.get(sid) || 0;
          if (now - lastEmit >= 33) {
            s.volatile.emit('smpte-update', { ...tcData, channel });
            smpteLastEmitMap.set(sid, now);
          }
        }
      }
    } catch (err) { }
  });

  triggerManager.on('smpte-signal-status', (data) => {
    try {
      const { sovereigntyKey, active } = data;
      if (!sovereigntyKey) return;

      const channelSuffix = sovereigntyKey.split('_ch');
      const channel = channelSuffix.length > 1 ? parseInt(channelSuffix[1]) : 0;

      for (const [sid, s] of io.sockets.sockets) {
        const u = users.get(sid);
        const cleanIp = getCleanIp(s);
        const socketKey = u ? `${u.username}_${u.ip}` : `anon_${cleanIp}`;

        if (sovereigntyKey.startsWith(socketKey) || (sovereigntyKey.includes(cleanIp) && !u)) {
          s.emit('smpte-signal-status', { active, channel });
        }
      }
    } catch (err) { }
  });
  if (redisClient && redisClient.status === 'ready' && redisAdapter) {
    try {
      // Two common adapter APIs: @socket.io/redis-adapter.createAdapter(pub, sub)
      // or socket.io-redis(opts) which expects an options object.
      if (typeof redisAdapter === 'function' && redisAdapter.length === 2) {
        io.adapter(redisAdapter(redisClient, redisClient.duplicate()));
      } else {
        io.adapter(redisAdapter({ pubClient: redisClient, subClient: redisClient.duplicate() }));
      }
    } catch (e) {
      console.warn('⚠️ Unable to attach redis adapter:', e.message);
    }
  }

  const PORT = 3000;
  const HOST = '0.0.0.0';

  // --- CAPA DE INTELIGENCIA Y CORRECCIÓN (FUZZY MATCHING) ---
  function getSimilarity(s1, s2) {
    let longer = s1;
    let shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    let longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
  }

  function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();
    let costs = new Array();
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i == 0) costs[j] = j;
        else {
          if (j > 0) {
            let newValue = costs[j - 1];
            if (s1.charAt(i - 1) != s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  function applyDictionaryCorrection(text, lang = 'es') {
    if (!text || typeof text !== 'string') return text || "";
    try {
      const dict = dictionaryCaches[lang] || dictionaryCaches['es'] || [];
      const connectedUsers = Array.from(users.values()).map(u => u.username).filter(Boolean);

      let correctedText = text;

      // 1. REEMPLAZO DIRECTO EXPRESO (Prioridad máxima)
      const sortedDict = [...dict].sort((a, b) => ((b && b.from) || "").length - ((a && a.from) || "").length);

      sortedDict.forEach(entry => {
        if (!entry || !entry.from || !entry.to) return;
        const escapedFrom = String(entry.from).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedFrom}\\b`, 'gi');
        correctedText = correctedText.replace(regex, String(entry.to));
      });

      // [v60.8] REFUERZO EUSKERA: Correcciones fonéticas y de concordancia para Whisper
      if (lang === 'eu') {
        const euMap = {
          'kaiso': 'Kaixo',
          'zermodu': 'zer moduz',
          'zer modoz': 'zer moduz',
          'eskeric asco': 'eskerrik asko',
          'eskerrikasko': 'eskerrik asko',
          'eskerik asko': 'eskerrik asko',
          'agur': 'Agur',
          'mesedez': 'mesedez',
          'bai horixe': 'bai horixe',
          'ez dut ulertzen': 'ez dut ulertzen',
          'nola zaude': 'nola zaude',
          'zer egiten duzu': 'zer egiten duzu'
        };
        Object.keys(euMap).forEach(key => {
          const regex = new RegExp(`\\b${key}\\b`, 'gi');
          correctedText = correctedText.replace(regex, euMap[key]);
        });
      }

      return correctedText;
    } catch (e) {
      console.error("❌ Error aplicando corrección del diccionario:", e.message);
      return text;
    }
  }

  // 3. PUNTUACIÓN INTELIGENTE UNIVERSAL (Soporte determinista para los 24 idiomas)
  // [v60.STRICT-QUESTION] Solo inyectar signos de interrogación ante preguntas canónicas inequívocas.
  // Órdenes o frases técnicas ("Tienes que...", "Tenemos que...", "Estás...") se mantienen como AFIRMACIONES.
  function addIntelligentPunctuation(text, lang = 'es') {
    if (!text || typeof text !== 'string') return "";
    let t = text.trim();
    if (t.length === 0) return "";

    // Blindaje Murphy 1: Si ya posee puntuación final de cierre o apertura, no tocar
    if (/^[¿?¡!].*[¿?¡!]$/.test(t) || /[?!؟？]$/.test(t)) {
      return t.charAt(0).toUpperCase() + t.slice(1);
    }

    const cleanLeading = t.replace(/\.+$/, "").trim();

    // 1. ESPAÑOL (es): Pronombres interrogativos estrictos al inicio (excluyendo verbos de orden)
    if (lang === 'es') {
      // Solo preguntas canónicas reales iniciadas por partículas interrogativas tónicas
      const esQuestionRegex = /^(qué tal|que tal|cómo estás|como estas|cómo está|como esta|por qué|porque no|por que no)\b|^(qué|que|cómo|como|cuándo|cuando|dónde|donde|por qué|quién|quien|cuál|cual|cuánto|cuanto)\s+(?!que\b|de\b|en\b)/i;
      if (esQuestionRegex.test(cleanLeading)) {
        return `¿${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 2. EUSKERA (eu): Cierre canónico ? solo con partículas interrogativas directas
    else if (lang === 'eu') {
      const euQuestionRegex = /^(zer moduz|nola zaude|zer da|nor da|non dago|zergatik|noiz da|zenbat da)\b|^(zer|zein|nor|nola|noiz|non|zergatik|zenbat)\s+(da|dira|dago|du|dute|zen)\b/i;
      if (euQuestionRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 3. INGLÉS (en): Solo Wh-words con inversión interrogativa estricta
    else if (lang === 'en') {
      const enQuestionRegex = /^(how are you|how is it|what is|where is|who is|why is|how much|how many)\b|^(what|why|how|when|where|who|which)\s+(is|are|was|were|do|does|did|will|would|can|could)\b/i;
      if (enQuestionRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 4. FRANCÉS (fr): Solo fórmulas interrogativas inequívocas
    else if (lang === 'fr') {
      const frQuestionRegex = /^(comment ça va|comment allez-vous|est-ce que|qu'est-ce que|pourquoi|où est)\b/i;
      if (frQuestionRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 5. ALEMÁN (de): Solo W-Fragen estrictas
    else if (lang === 'de') {
      const deQuestionRegex = /^(wie geht's|wie geht es dir|was ist|wo ist|wer ist|warum ist)\b/i;
      if (deQuestionRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 6. ITALIANO (it): Solo fórmulas directas
    else if (lang === 'it') {
      const itQuestionRegex = /^(come stai|come va|cosa c'è|dov'è|chi è|perché)\b/i;
      if (itQuestionRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 7. PORTUGUÉS (pt): Solo fórmulas directas
    else if (lang === 'pt') {
      const ptQuestionRegex = /^(como vai|tudo bem|onde fica|o que é|quem é|por que)\b/i;
      if (ptQuestionRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 8. CATALÁN (ca): Solo fórmulas directas
    else if (lang === 'ca') {
      const caQuestionRegex = /^(com estàs|com va|què és|on és|qui és|per què)\b/i;
      if (caQuestionRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 9. GALLEGO (gl): Solo fórmulas directas
    else if (lang === 'gl') {
      const glQuestionRegex = /^(como estás|como vai|onde está|quen é|por que)\b/i;
      if (glQuestionRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 10. RUSO (ru) y UCRANIANO (uk): Solo preguntas canónicas
    else if (lang === 'ru' || lang === 'uk') {
      const slavicQuestionRegex = /^(как дела|что это|где это|кто это|почему|як справи|що це|де це)(?:[\s\b]|$)/i;
      if (slavicQuestionRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 11. ÁRABE (ar) y PERSA (fa): Solo preguntas canónicas
    else if (lang === 'ar' || lang === 'fa') {
      const rtlQuestionRegex = /^(كيف حالك|ما هذا|أين هو|لماذا|چطور هستید|کجاست)(?:[\s\b]|$)/i;
      if (rtlQuestionRegex.test(cleanLeading)) {
        return `${cleanLeading}؟`;
      }
    }

    // 12. CHINO (zh): Cierre con ？ solo con partículas modales inequívocas
    else if (lang === 'zh') {
      const zhParticleRegex = /(吗|呢)$/;
      if (zhParticleRegex.test(cleanLeading)) {
        return `${cleanLeading.replace(/[？?]$/, '')}？`;
      }
    }

    // 13. JAPONÉS (ja): Cierre con ？ solo con partículas modales inequívocas
    else if (lang === 'ja') {
      const jaParticleRegex = /(か|かい|ですか)$/;
      if (jaParticleRegex.test(cleanLeading)) {
        return `${cleanLeading.replace(/[？?]$/, '')}？`;
      }
    }

    // 14. COREANO (ko): Cierre ? solo con partículas de pregunta
    else if (lang === 'ko') {
      const koParticleRegex = /(까|니|나요|가요)$/;
      if (koParticleRegex.test(cleanLeading)) {
        return `${cleanLeading.replace(/\?$/, '')}?`;
      }
    }

    // 15. HOLANDÉS (nl): Preguntas directas
    else if (lang === 'nl') {
      const nlQuestionRegex = /^(hoe gaat het|wat is|waar is|waarom)\b/i;
      if (nlQuestionRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 16. POLACO (pl): Preguntas directas
    else if (lang === 'pl') {
      const plQuestionRegex = /^(jak się masz|co to jest|gdzie jest|dlaczego)\b/i;
      if (plQuestionRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 17. SUECO (sv): Preguntas directas
    else if (lang === 'sv') {
      const svQuestionRegex = /^(hur mår du|vad är|var är|varför)\b/i;
      if (svQuestionRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 18. TURCO (tr): Solo enclíticas interrogativas
    else if (lang === 'tr') {
      const trQuestionRegex = /^(nasıl|nasılsın|nerede|neden)(?:[\s\b]|$)/i;
      const trEncliticRegex = /(mı|mi|mu|mü)$/i;
      if (trQuestionRegex.test(cleanLeading) || trEncliticRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 19. VIETNAMITA (vi): Solo partículas de cierre de pregunta
    else if (lang === 'vi') {
      const viParticleRegex = /(phải không|không|chưa)$/i;
      if (viParticleRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 20. KAZAJO (kk) y UZBEKO (uz): Preguntas directas
    else if (lang === 'kk' || lang === 'uz') {
      const centralAsiaRegex = /^(қалайсың|қайда|неге|qandaysiz|qayerda|nega)(?:[\s\b]|$)/i;
      if (centralAsiaRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // 21. ESPERANTO (eo): Preguntas directas con ĉu
    else if (lang === 'eo') {
      const eoQuestionRegex = /^(ĉu|cu)\b/i;
      if (eoQuestionRegex.test(cleanLeading)) {
        return `${cleanLeading.charAt(0).toUpperCase() + cleanLeading.slice(1)}?`;
      }
    }

    // Fallback defensivo incondicional: Mantener capitalización sin alterar ortografía
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  // Alias para retrocompatibilidad
  const addPunctuation = addIntelligentPunctuation;

  // 4. DEDUPLICADOR DEFENSIVO DE FRASES CONSECUTIVAS (Safety Net)
  // Colapsa duplicaciones idénticas de cláusulas compuestas (>= 3 palabras)
  // Ejemplos:
  // "hola mi amigo, hola mi amigo" -> "hola mi amigo"
  // "so, me that we have, so, me that we have" -> "so, me that we have"
  // Respeta intenciones cortas como "no, no" o "rápido, rápido"
  function removeConsecutivePhraseDuplicates(text) {
    if (!text || typeof text !== 'string') return text || "";
    let clean = text.trim();
    if (clean.length < 10) return clean;

    const trailingPunct = /[.,!?;:؟？]+$/.exec(clean)?.[0] || '';
    const withoutTrailing = clean.replace(/[.,!?;:؟？]+$/, '').trim();

    // 1. Partición por comas / punto y coma
    const commaParts = withoutTrailing.split(/\s*[,;]\s*/);
    if (commaParts.length >= 2) {
      // Probar si la primera mitad coincide con la segunda mitad
      const mid = Math.floor(commaParts.length / 2);
      if (commaParts.length % 2 === 0) {
        const h1 = commaParts.slice(0, mid).join(', ').toLowerCase();
        const h2 = commaParts.slice(mid).join(', ').toLowerCase();
        if (h1 === h2 && h1.split(/\s+/).length >= 3) {
          return commaParts.slice(0, mid).join(', ') + trailingPunct;
        }
      }
    }

    // 2. Partición por palabras completas (en caso de separación por espacio puro)
    const words = withoutTrailing.split(/\s+/);
    if (words.length >= 6 && words.length % 2 === 0) {
      const half = words.length / 2;
      const w1 = words.slice(0, half).join(' ').toLowerCase();
      const w2 = words.slice(half).join(' ').toLowerCase();
      if (w1 === w2) {
        return words.slice(0, half).join(' ') + trailingPunct;
      }
    }

    return clean;
  }

  // --- ⚡ Mejora V59.10: Desactivar Caché para JS en Desarrollo/Fixing ---
  app.use((req, res, next) => {
    if (req.url.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
    next();
  });



  app.use('/uploads/triggers', express.static(TRIGGERS_UPLOADS_DIR));
  app.use(express.static(path.join(__dirname, 'public')));

  // --- 🔒 [v60.QR-ACCESS] Endpoints de Descarga de Certificado CA y QRs Vectoriales Offline ---
  app.get('/cert', (req, res) => {
    try {
      const caCertPath = certManager.CA_CERT_PATH;
      if (fs.existsSync(caCertPath)) {
        res.setHeader('Content-Type', 'application/x-x509-ca-cert');
        res.setHeader('Content-Disposition', 'attachment; filename="talkme-root-ca.crt"');
        return res.sendFile(caCertPath);
      }
      return res.status(404).send('Certificado CA no encontrado');
    } catch (err) {
      return res.status(500).send('Error sirviendo certificado CA: ' + err.message);
    }
  });

  app.get('/api/access-qr-data', async (req, res) => {
    try {
      const currentIp = (currentIps.find(ip => ip !== '127.0.0.1')) || currentIps[0] || 'localhost';
      const certUrl = `https://${currentIp}:${PORT}/cert`;
      const appUrl = `https://${currentIp}:${PORT}`;

      // Validación de Soberanía Máster:
      // Solo el socket activo del Master o el candidato legítimo/Electron anfitrión tienen permisos de gestión
      const socketId = req.query.socketId || req.headers['x-socket-id'];
      const rawClientIp = (req.ip || req.connection.remoteAddress || '').replace('::ffff:', '');
      const isHostApp = req.headers['x-electron-app'] === 'true';
      
      let isMaster = false;
      if (socketId && categoriesData.masterId === socketId) {
        isMaster = true;
      } else if (isHostApp) {
        isMaster = true;
      } else if (isHostMachineIp(rawClientIp) && !categoriesData.masterId) {
        // Asiento vacante en máquina anfitriona
        isMaster = true;
      }

      const qrOptions = {
        type: 'svg',
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      };

      // Detección asíncrona de Wi-Fi con Watchdog y Aislamiento Total
      const wifiInfo = await wifiDetector.getWifiCredentials(currentIp);

      let wifiQr = null;
      if (wifiInfo.zxingString) {
        wifiQr = await QRCode.toString(wifiInfo.zxingString, qrOptions);
      }

      const [certQr, appQr] = await Promise.all([
        QRCode.toString(certUrl, qrOptions),
        QRCode.toString(appUrl, qrOptions)
      ]);

      return res.json({
        ok: true,
        isMaster,
        mode: wifiInfo.mode,
        wifiQr: wifiQr,
        wifiSsid: wifiInfo.ssid,
        wifiPass: wifiInfo.password,
        wifiSecurity: wifiInfo.security,
        certQr,
        certUrl,
        appQr,
        appUrl,
        serverIp: currentIp
      });
    } catch (err) {
      console.error('❌ Error generando QRs de acceso:', err.message);
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  // Guardar configuración de Wi-Fi ingresada manualmente por el Máster
  app.post('/api/save-wifi-config', express.json(), async (req, res) => {
    try {
      const socketId = req.body.socketId || req.headers['x-socket-id'];
      const rawClientIp = (req.ip || req.connection.remoteAddress || '').replace('::ffff:', '');
      const isHostApp = req.headers['x-electron-app'] === 'true';

      let isMaster = false;
      if (socketId && categoriesData.masterId === socketId) {
        isMaster = true;
      } else if (isHostApp) {
        isMaster = true;
      } else if (isHostMachineIp(rawClientIp) && !categoriesData.masterId) {
        isMaster = true;
      }

      if (!isMaster) {
        return res.status(403).json({ ok: false, error: 'Acceso denegado: solo el Máster soberano puede configurar las credenciales de red.' });
      }

      const { ssid, password, security } = req.body || {};
      if (!ssid || !ssid.trim()) {
        return res.status(400).json({ ok: false, error: 'El nombre de la red (SSID) es obligatorio.' });
      }

      const saved = wifiDetector.saveWifiConfig(ssid, password, security);

      const qrOptions = {
        type: 'svg',
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      };

      const wifiQr = await QRCode.toString(saved.zxingString, qrOptions);

      return res.json({
        ok: true,
        message: 'Credenciales guardadas y código QR generado correctamente.',
        wifiQr,
        wifiSsid: saved.ssid,
        wifiPass: saved.password,
        wifiSecurity: saved.security
      });
    } catch (err) {
      console.error('❌ Error guardando configuración Wi-Fi:', err.message);
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

    // Parse JSON bodies for API endpoints
  app.use('/api', express.json({ limit: '1mb' }));

  // --- Alerts persistence API (per-user) ---
  const ALERTS_DIR = path.join(__dirname, 'config', 'data');

  app.get('/api/alerts/:userId', (req, res) => {
    try {
      const uid = req.params.userId || 'guest';
      const file = path.join(ALERTS_DIR, `alerts_${uid}.json`);
      const data = storage.readJSON(file) || {};
      return res.json({ ok: true, data });
    } catch (e) {
      console.error('❌ /api/alerts GET error:', e.message);
      return res.status(500).json({ ok: false, error: e.message });
    }
  });

  app.post('/api/alerts/:userId', (req, res) => {
    try {
      const uid = req.params.userId || 'guest';
      const payload = req.body || {};
      const file = path.join(ALERTS_DIR, `alerts_${uid}.json`);
      // Persist atomically via storage helper
      const existing = storage.readJSON(file) || {};
      const merged = { ...existing, ...payload };
      storage.writeJSON(file, merged);
      return res.json({ ok: true });
    } catch (e) {
      console.error('❌ /api/alerts POST error:', e.message);
      return res.status(500).json({ ok: false, error: e.message });
    }
  });

  // Servir imágenes desde storage/media/images/
  app.use('/send-images', express.static(IMAGES_DIR));

  // Servir grabaciones de audio desde storage/media/recordings/
  app.use('/recordings', express.static(RECORDINGS_DIR));

  // Servir favicon.ico desde public/favicon/ (navegadores lo piden en raíz)
  app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'favicon', 'favicon.ico'));
  });

  // Endpoint para saber si Vosk está disponible
  app.get('/api/vosk-status', (req, res) => {
    res.json({ available: voskAvailable });
  });

  app.get('/', (req, res) => {
    if (req.query.success === 'true') {
      const sessionId = req.query.session_id || '';
      console.log(`💸 Stripe payment success query intercepted in Chat Server. Redirecting to production secure portal: https://www.talk-me.app/pre-launch/success.html`);
      return res.redirect(`https://www.talk-me.app/pre-launch/success.html?success=true&session_id=${sessionId}`);
    }
    res.render('index'); // Renderizar la vista principal con EJS
  });

  // Sub-usuarios and micAssignments are declared earlier (startup persistence)
  // Build the full users payload including attached sub-users and orphan sub-user entries.
  function getAllUsersData() {
    const uniqueUsers = new Map();
    Array.from(users.values()).forEach(u => {
      if (!uniqueUsers.has(u.username)) {
        uniqueUsers.set(u.username, {
          id: u.id,
          username: u.username,
          categories: u.categories,
          categoryIds: u.categoryIds,
          isMaster: u.id === categoriesData.masterId || u.username === categoriesData.masterUsername,
          msgCount: u.msgCount || 0,
          joinedAt: u.joinedAt || Date.now(),
          activeSockets: 1,
          subUsers: [],
          lang: u.lang || 'es',
          autoTranslate: u.aiSettings?.autoTranslate || false,
          enabledLangs: u.aiSettings?.enabledLangs || [],
          photoCount: u.photoCount || 0,
          triggerCount: u.triggerCount || 0
        });
      } else {
        const existing = uniqueUsers.get(u.username);
        existing.activeSockets++;
        // [INGENIERÍA EXPERTA] Sumatoria consolidada de actividad multi-pestaña
        existing.msgCount = (existing.msgCount || 0) + (u.msgCount || 0);
        existing.photoCount = (existing.photoCount || 0) + (u.photoCount || 0);
        existing.triggerCount = (existing.triggerCount || 0) + (u.triggerCount || 0);
        if (u.aiSettings?.autoTranslate) existing.autoTranslate = true;
        if (u.aiSettings?.enabledLangs) existing.enabledLangs = u.aiSettings.enabledLangs;
      }
    });

    // Attach sub-users under their root user entry. Match by socket id OR by rootUsername (case-insensitive).
    const attachedSubs = new Set();
    Array.from(subUsers.values()).forEach(su => {
      try {
        if ((!su.rootUsername || su.rootUsername === '') && su.rootUserId && users.has(su.rootUserId)) {
          const rootUserObj = users.get(su.rootUserId);
          if (rootUserObj && rootUserObj.username) su.rootUsername = rootUserObj.username;
        }
      } catch (e) { }

      const root = Array.from(uniqueUsers.values()).find(u => {
        if (u.id === su.rootUserId) return true;
        if (su.rootUsername && typeof u.username === 'string' && typeof su.rootUsername === 'string') {
          return u.username.toLowerCase() === su.rootUsername.toLowerCase();
        }
        return false;
      });
      const entry = {
        subUserId: su.subUserId,
        name: su.name,
        category: su.category,
        lang: su.lang,
        color: su.color || null,
        mic: su.mic || null,
        threshold: su.threshold || 0.5
      };
      if (root) {
        root.subUsers.push(entry);
        attachedSubs.add(su.subUserId);
      }
    });

    const allUsersData = Array.from(uniqueUsers.values());

    // If any sub-users couldn't be attached (e.g., username/socket mismatch), expose them as standalone entries
    Array.from(subUsers.values()).forEach(su => {
      if (attachedSubs.has(su.subUserId)) return;
      const orphan = {
        id: su.subUserId,
        username: su.name || (`sub-${su.subUserId.substring(0, 6)}`),
        categories: su.category ? [su.category] : [],
        categoryIds: su.category ? [su.category] : [],
        isMaster: false,
        msgCount: 0,
        joinedAt: Date.now(),
        activeSockets: 0,
        subUsers: [],
        isSubUser: true,
        parentId: su.rootUserId || null,
        parentUsername: su.rootUsername || null
      };
      allUsersData.push(orphan);
    });

    // Optional debug: print summary of attachments when DEBUG_SUBUSERS=true
    try {
      if (process.env.DEBUG_SUBUSERS === 'true') {
        console.log('🔍 getAllUsersData summary: users=%d, totalSubUsers=%d, attached=%d, orphans=%d',
          allUsersData.length - Array.from(subUsers.values()).length, Array.from(subUsers.values()).length, attachedSubs.size,
          Array.from(subUsers.values()).length - attachedSubs.size);
        Array.from(subUsers.values()).forEach(su => {
          console.log('  SU:', su.subUserId, 'rootUserId=', su.rootUserId, 'rootUsername=', su.rootUsername, 'attached=', attachedSubs.has(su.subUserId));
        });
      }
    } catch (e) { }

    return allUsersData;
  }

  function emitUpdateUsers() {
    try {
      const allUsersData = getAllUsersData();
      io.emit('update-users', allUsersData);
      io.emit('update-filters', allUsersData);
    } catch (e) {
      console.error('❌ emitUpdateUsers error:', e.message);
    }
  }
  // [v59.40] MANIFIESTO DE SESIONES (AUTORIDAD DEL SERVIDOR)
  // Vincula el Token de Sesión con el ID de Categoría oficial para sincronizar pestañas.
  const userSessionManifest = new Map();


  // --- 🛰️ ELITE TRANSPORT STATE ---
  const nackCache = new Map(); // Map<streamId:seq, { data, timestamp }>
  const activeStreams = new Map(); // Map<socketId, streamId>

  // --- 📈 ADMISSION CONTROL & METRICS ---
  let bytesSentLastWindow = 0;
  let totalBandwidthLimit = 100 * 1024 * 1024; // 100Mbps default
  let cpuUsage = 0;
  const ipConnections = new Map(); // Map<ip, count>

  // Telemetry Metrics (Mocking Prometheus for 10/10 local-first)
  const metrics = {
    audio_latency_ms: [],
    packet_loss_ratio: 0,
    active_streams: 0
  };

  setInterval(() => {
    const load = os.loadavg()[0]; // 1 min load avg
    const cpus = os.cpus().length;
    cpuUsage = (load / cpus) * 100;

    // --- REBALANCING TRIGGER (Elite 10/10) ---
    if (cpuUsage > 85 && activeStreams.size > 0) {
      console.warn(`🚀 Alta carga detectada (${cpuUsage.toFixed(1)}%). Rebalanceando dinámicamente...`);
      // Signal rebalancing to a fraction of clients
      io.emit('server-rebalance', { target: 'auto' });
    }

    bytesSentLastWindow = 0;
  }, 10000);


  function isSystemSaturated() {
    return cpuUsage > 85; // 85% CPU threshold
  }

  // Cleanup NACK cache periodically (TTL 2s)
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of nackCache.entries()) {
      if (now - val.timestamp > 2000) nackCache.delete(key);
    }
  }, 1000);

  const ttsLimits = new Map();

  io.on('connection', (socket) => {
    // === INICIO PATCH SOLO TRANSCRIPCIÓN ===
    socket.on('set-transcription-mode', (data) => {
      const user = users.get(socket.id);
      if (user) {
        user.transcriptionOnly = !!data.transcriptionOnly;
      }
    });
    // === FIN PATCH SOLO TRANSCRIPCIÓN ===
    // [v56] Envío de configuración inicial (DNA, Tema, Triggers, etc.)
    socket.emit('global-settings', globalSettings);
    socket.emit('triggers-data', triggersCache);
    enforceCacheLimit(); // Notificar estado de caché inmediatamente al conectar

    // Enviar alertas globales (Master Defaults) al conectar
    try {
      const globalFile = path.join(ALERTS_DIR, 'global_alerts.json');
      if (fs.existsSync(globalFile)) {
        const globalAlerts = storage.readJSON(globalFile);
        socket.emit('master-alerts-update', globalAlerts);
      }
    } catch (e) { }

    // [v60.ELITE] Sincronización proactiva de soberanía inicial
    broadcastMasterStatus(socket);





    // [v60.Elite] Auditoría de estado (Eliminado el override global del Master para soberanía total)

    // --- 🚨 NEW: Master Alerts Broadcasting (v60) ---
    socket.on('broadcast-master-alert', (data, callback) => {
      const isMaster = socket.id === categoriesData.masterId;
      if (!isMaster) {
        if (callback) callback({ success: false, error: 'No autorizado' });
        return;
      }

      // El Master envía una alerta individual o el set completo
      // La retransmitimos a todos para que la guarden como su nuevo "Master Default"
      socket.broadcast.emit('master-alerts-update', data);

      // Opcional: Persistir como global_alerts.json para nuevos ingresos
      try {
        const globalFile = path.join(ALERTS_DIR, 'global_alerts.json');
        const existing = storage.readJSON(globalFile) || {};
        const merged = { ...existing, ...data };
        storage.writeJSON(globalFile, merged);
      } catch (e) { console.error('Error persistiendo global_alerts:', e); }

      if (callback) callback({ success: true });
    });


    // --- ??? ELITE CONCURRENCY CAPS (10 per IP) ---
    const clientIp = socket.handshake.address;
    const currentIpCount = ipConnections.get(clientIp) || 0;
    if (currentIpCount >= 10) {
      console.warn(`🚫 IP bloqueada por exceso de conexiones: ${clientIp}`);
      socket.disconnect(true);
      return;
    }
    ipConnections.set(clientIp, currentIpCount + 1);

    // [v60.ELITE FIX - Sol.2B] Registro del micrófono activo del Master en el servidor
    // Permite validar colisiones con el Canal del Master en updateSubUserState y registerSubUser
    socket.on('set-master-mic', (mic, callback) => {
      try {
        if (!mic || !mic.deviceId) {
          if (callback) callback({ success: false, error: 'invalid_mic' });
          return;
        }
        // Limpiar asignación master anterior (socket actual)
        const masterKey = `master-${socket.id}`;
        for (const [k, v] of micAssignments.entries()) {
          if (v === masterKey) micAssignments.delete(k);
        }
        const newKey = `${mic.deviceId}:${mic.channel || 0}`;
        micAssignments.set(newKey, masterKey);
        console.log(`🛡️ [MASTER-MIC] Canal Master registrado en servidor: ${newKey}`);
        if (callback) callback({ success: true });
      } catch (e) {
        if (callback) callback({ success: false, error: e.message });
      }
    });

    socket.on('disconnect', (reason) => {
      ttsLimits.delete(socket.id);
      if (global.updateTelemetry) global.updateTelemetry();
      try { console.log(`🔌 Socket disconnected: ${socket.id} reason=${reason}`); } catch (e) { }
      const count = ipConnections.get(clientIp) || 1;
      if (count <= 1) ipConnections.delete(clientIp);
      else ipConnections.set(clientIp, count - 1);

      // Al desconectar un socket, verificar si el usuario tiene otros sockets activos
      try {
        const user = users.get(socket.id);
        const username = user ? user.username : null;

        // Eliminar este socket del mapa de usuarios
        users.delete(socket.id);

        let otherSocketsForUser = false;
        if (username) {
          for (const [sid, u] of users.entries()) {
            if (u.username === username) {
              otherSocketsForUser = true;
              break;
            }
          }
        }

        // [v60.ELITE] Persistencia Blindada
        // Solo si NO quedan más sockets para este usuario (o no estaba identificado), limpiamos sub-usuarios.
        // EXCEPCIÓN: Si el usuario es el Master (o tiene nombre reservado), mantenemos sus sub-usuarios para re-entrada.
        const isMasterIdentity = categoriesData.masterUsername && username && (categoriesData.masterUsername.toLowerCase() === username.toLowerCase());

        // [v60.Elite] Handover de Socket: Si cae el socket oficial pero hay otros del Master, transferir el mando
        if (socket.id === categoriesData.masterId && otherSocketsForUser && isMasterIdentity) {
          for (const [sid, u] of users.entries()) {
            if (u.username === username) {
              categoriesData.masterId = sid;
              console.log(`👑 [ELITE] Handover: El mando del Master ${username} ha pasado al socket ${sid}`);
              break;
            }
          }
        }

        if (!otherSocketsForUser && !isMasterIdentity) {
          const removed = [];
          for (const [subId, su] of subUsers.entries()) {
            if (su.rootUserId === socket.id || (username && su.rootUsername === username)) {
              if (su.mic) {
                const key = `${su.mic.deviceId}:${su.mic.channel || 0}`;
                if (micAssignments.get(key) === subId) micAssignments.delete(key);
              }
              subUsers.delete(subId);
              removed.push(subId);
            }
          }
          if (removed.length > 0) {
            removed.forEach(sid => io.emit('subuser-removed', { subUserId: sid }));
            saveSubUsers();
          }

          // [v60.Elite] Notificar salida global si es el último socket
          if (username) {
            const userCat = user ? ((user.categories && user.categories[0]) || 'General') : 'General';
            socket.broadcast.emit('user-left', {
              user: 'Sistema',
              username: username,
              category: userCat,
              categories: user ? user.categories : [userCat],
              text: `${username} ha abandonado el chat`,
              time: new Date().toLocaleTimeString()
            });
          }
        }

        emitUpdateUsers();
        broadcastMasterStatus();

        // [v60.Elite] Limpieza de recursos y claims de Soberanía Compartida al desconectar por completo
        if (username && !otherSocketsForUser) {
          const sovereigntyKey = `${username}_${(user && user.ip) || getCleanIp(socket)}`;
          if (triggerSovereigntyStates.has(sovereigntyKey)) {
            triggerSovereigntyStates.delete(sovereigntyKey);
            console.log(`🧹 [SOBERANÍA] Claims limpiados por desconexión completa de ${sovereigntyKey}`);
            io.emit('active-claims-updated', getGlobalActiveClaims());
          }
        }

        // Limpieza de soberanía anónima por IP
        const cleanSocketIp = getCleanIp(socket);
        let ipHasActiveSockets = false;
        if (typeof io !== 'undefined' && io.sockets && io.sockets.sockets) {
          for (const [sid, sNode] of io.sockets.sockets.entries()) {
            if (sid !== socket.id && getCleanIp(sNode) === cleanSocketIp) {
              ipHasActiveSockets = true;
              break;
            }
          }
        }
        if (!ipHasActiveSockets) {
          const sovereigntyKey = `anon_${cleanSocketIp}`;
          if (triggerSovereigntyStates.has(sovereigntyKey)) {
            triggerSovereigntyStates.delete(sovereigntyKey);
            console.log(`🧹 [SOBERANÍA] Claims anónimos limpiados por desconexión completa de IP ${cleanSocketIp}`);
            io.emit('active-claims-updated', getGlobalActiveClaims());
          }
        }

        // Limpieza de reclamación SMPTE y caché de telemetría
        if (typeof smpteClaims !== 'undefined' && smpteClaims) {
          for (const [key, id] of smpteClaims.entries()) {
            if (id === socket.id) {
              smpteClaims.delete(key);
              if (typeof smpteLastAudio !== 'undefined') smpteLastAudio.delete(key);
              console.log(`🛡️ [SMPTE] Soberanía liberada para: ${key}`);

              // [v60.Elite] RELEVO DE GUARDIA: Notificar a otros sockets de la misma IP
              const ipSuffix = key.includes('anon_') ? key.split('anon_')[1].split('_ch')[0] : key.split('_')[1].split('_ch')[0];
              for (const [osid, os] of io.sockets.sockets) {
                if (getCleanIp(os) === ipSuffix) {
                  os.emit('smpte-capture-available', { sovereigntyKey: key });
                }
              }
              break;
            }
          }
        }

        if (typeof smpteLastEmitMap !== 'undefined' && smpteLastEmitMap) {
          smpteLastEmitMap.delete(socket.id);
        }

        if (triggerManager && typeof triggerManager.cleanupSocket === 'function') {
          triggerManager.cleanupSocket(socket.id);
        }

        // [v60.Industrial] Purgado defensivo de buffers huérfanos de audio (Anti-Leak por desconexión en PTT)
        delete _voskChunkBuffers[socket.id];
        delete _voskPendingBuffers[socket.id];
        delete _voskTextSegments[socket.id];
        const targetWhisperKey = `${socket.id}_root`;
        _whisperSessionMap.delete(targetWhisperKey);
        _whisperTaskInFlight.delete(targetWhisperKey);
        _whisperLastProcessedSeq.delete(targetWhisperKey);
      } catch (e) {
        console.error('❌ Error en disconnect pipeline:', e.message);
      }
    });

    console.log(`🔗 Usuario conectado: ${socket.id} (IP: ${clientIp}, Total IP: ${currentIpCount + 1})`);

    // Informar al cliente si transcripción está disponible (Vosk real O fallback)
    socket.emit('vosk-status', { available: transcriptionAvailable, mode: voskAvailable ? 'vosk' : 'local-fallback' });

    // Enviar IPs y puerto del servidor al cliente para construir URLs completas
    socket.emit('server-info', { ips: currentIps, port: PORT });

    // Enviar diccionario actual nada más conectar para sincronización total
    socket.emit('dictionary-data', loadDictionary());


    // [v60.ELITE] Evaluación de Soberanía (Monitorización de Asiento)
    const hasCurrentMaster = Array.from(users.values()).some(u =>
      u.username && categoriesData.masterUsername && u.username.toLowerCase() === categoriesData.masterUsername.toLowerCase()
    );

    if (!hasCurrentMaster && !categoriesData.masterUsername) {
      console.log(`👑 [ELITE] Asiento de Master VACANTE. Esperando primer login soberano.`);
    } else if (!hasCurrentMaster && categoriesData.masterUsername) {
      console.log(`👑 [ELITE] Asiento de Master RESERVADO para: ${categoriesData.masterUsername}. Esperando recuperación.`);
    } else {
      console.log(`👑 [ELITE] Master ACTIVO (${categoriesData.masterUsername}). Nuevas conexiones entran como normal.`);
    }

    // [v60.Elite] Sincronización proactiva nada más conectar
    broadcastMasterStatus(socket);

    // Enviar configuración de categorías al cliente
    socket.emit('categories-config', {
      categories: categoriesData.categories,
      isMaster: categoriesData.masterId === socket.id,
      maxCategories: MAX_CATEGORIES,
      masterId: categoriesData.masterId,
      hasRoomPin: !!(categoriesData.roomPin || process.env.ROOM_PIN),
      globalSettings: loadGlobalSettings()
    });

    socket.on('join-chat', (data) => {
      let username = "";
      let categories = [];

      if (typeof data === 'string') {
        username = data;
      } else if (data && data.username) {
        username = data.username;
        categories = data.categories || [];
      }

      if (!username || username.trim().length === 0) {
        socket.emit('error-message', 'Nombre de usuario inválido');
        return;
      }

      // [v60.ELITE] VALIDACIÓN Y CONFIGURACIÓN MASTER DE ROOM_PIN
      const receivedPin = typeof data === 'object' && (data.pin || data.roomPin) ? (data.pin || data.roomPin) : '';
      const EXPECTED_PIN = categoriesData.roomPin || process.env.ROOM_PIN;

      // [v60.ELITE] Verificación de Identidad para Soberanía
      const cleanIp = getCleanIp(socket);
      const isLocalHostSocket = isHostMachineIp(cleanIp);
      const isElectronHost = !!(process.env.ELECTRON_HOST_TOKEN && (data.hostToken === process.env.ELECTRON_HOST_TOKEN || data.sessionToken === process.env.ELECTRON_HOST_TOKEN)) || isLocalHostSocket;

      const isAttemptingMasterRecovery = categoriesData.masterUsername &&
        categoriesData.masterUsername.toLowerCase() === username.trim().toLowerCase();
      const isSystemVacant = !categoriesData.masterId && !categoriesData.masterUsername;

      // [v60.Elite] El Master está offline si no hay ningún socket activo con su identidad registrada
      const masterIsOffline = !Array.from(users.values()).some(u =>
        u.username && categoriesData.masterUsername && u.username.toLowerCase() === categoriesData.masterUsername.toLowerCase()
      );

      // Bloqueo de Seguridad: Si el Master está REALMENTE ACTIVO, nadie más puede usar su nombre ni usurpar su mando
      // EXCEPCIÓN ANTI-MURPHY: Si el socket entrante es el Host Local de Electron (o tiene hostToken), NUNCA se le bloquea; recupera su soberanía.
      if (!masterIsOffline && isAttemptingMasterRecovery && categoriesData.masterId !== socket.id) {
        if (!isElectronHost) {
          socket.emit('join-error', { code: 'MASTER_OCCUPIED', message: 'El Master ya está conectado en otra sesión activa.' });
          return;
        } else {
          console.log(`👑 [ELECTRON-SOVEREIGNTY] El Host Local está reclamando su sesión Master (${username}). Desplazando socket previo.`);
        }
      }

      if (EXPECTED_PIN && EXPECTED_PIN.trim() !== '') {
        if (receivedPin !== EXPECTED_PIN) {
          socket.emit('join-error', {
            code: 'INVALID_PIN',
            message: 'PIN de sala incorrecto. Acceso denegado.'
          });
          return;
        }
      }

      const cleanUsername = username.trim();

      // === VALIDACIÓN DE DUPLICADO (Nombre + Categoría) ===
      for (const [existingId, existingUser] of users.entries()) {
        if (existingUser.username === cleanUsername && existingId !== socket.id) {
          const incomingCats = Array.isArray(categories) ? categories : [];
          const existingCats = Array.isArray(existingUser.categories) ? existingUser.categories : [];
          const sameCategory = incomingCats.some(cat => existingCats.includes(cat));

          // Si es el mismo nombre Y misma categoría...
          if (sameCategory) {
            // ...pero el socket ya no existe, es una reconexión legítima (dejar pasar al rejoing logic)
            if (!io.sockets.sockets.has(existingId)) continue;

            // ...si el socket sigue activo, es un duplicado real. BLOQUEAR.
            socket.emit('join-error', {
              code: 'DUPLICATE_USER',
              message: `"${cleanUsername}" ya está activo en la categoría "${incomingCats.join(', ')}".`
            });
            return;
          }
        }
      }
      // ==============================================
      // [v46.4.63/66] Verificar si la IP o el Token están en la lista negra temporal de expulsión
      const clientToken = data.sessionToken; // [v46.4.66.1] Token único del navegador

      if (kickedIps.has(cleanIp) || (clientToken && kickedTokens.has(clientToken))) {
        console.log(`🚫 Bloqueado acceso a IP/Token expulsado: ${cleanIp} | ${clientToken}`);
        socket.emit('join-error', { message: 'Tu acceso a esta sala ha sido revocado permanentemente por el Maestro.' });
        return;
      }

      // [v59.33] IDENTIDAD DE SESIÓN ÚNICA: El username es el anclaje real.
      // Si entra un "Jorge", cualquier otra sesión de "Jorge" es la misma persona re-conectando.
      const isSameUserSession = (u) => {
        return u.username.toLowerCase() === cleanUsername.toLowerCase();
      };

      // [v59.40] SOPORTE MULTI-PESTAÑA
      // Permitimos que coexistan múltiples sockets para un mismo usuario/token.
      // Ya no eliminamos sockets antiguos aquí; el manifiesto se encargará de la sincronización.
      const isRejoin = Array.from(users.values()).some(isSameUserSession);

      // === [v59.33] NORMALIZACIÓN ESTRUCTURAL POR ID (CIRUGÍA) ===
      // Convertimos cualquier entrada (ID o Nombre) en el Identificador Único y el Nombre Oficial Actual.
      let finalCategoryIds = [];
      let finalCategoryNames = [];

      const requestedItems = Array.isArray(categories) ? categories : [categories];
      requestedItems.forEach(reqItem => {
        // 1. Identificar el ítem (puede ser un objeto {id, name}, un ID string, o un Nombre string)
        const reqId = (typeof reqItem === 'object' && reqItem !== null) ? reqItem.id : reqItem;
        const reqName = (typeof reqItem === 'object' && reqItem !== null) ? reqItem.name : reqItem;

        // 2. Buscar por ID (Prioridad 1) o por Nombre (Prioridad 2)
        const official = categoriesData.categories.find(c =>
          c.id === reqId || (c.name && reqName && typeof reqName === 'string' && c.name.toLowerCase() === reqName.toLowerCase())
        );

        if (official) {
          finalCategoryIds.push(official.id);
          finalCategoryNames.push(official.name);
        }
      });

      // Eliminado `userSessionManifest` porque generaba un efecto candado.
      // Al usar IDs inmutables, ya no hay miedo a que se corrompan.

      const sessionToken = data.token || data.sessionToken || null;

      // El usuario se une con su selección final (autorizada o inicial)
      if (finalCategoryIds.length === 0) {
        finalCategoryIds.push('General');
        finalCategoryNames.push('General');
      }

      // Ya no forzamos category-authority-sync entre las pestañas del mismo Token.
      // Así los usuarios pueden tener Tab 1: Sonido, Tab 2: General sin interferirse mutuamente.

      users.set(socket.id, {
        id: socket.id,
        username: cleanUsername,
        categories: finalCategoryNames,
        categoryIds: finalCategoryIds,
        lang: data.lang || 'es',
        joinedAt: Date.now(),
        msgCount: 0,
        photoCount: 0,
        triggerCount: 0,
        sessionToken: sessionToken,
        ip: cleanIp,
        aiSettings: {
          autoTranslate: (data.aiSettings && data.aiSettings.autoTranslate === true),
          showOriginal: (data.aiSettings && data.aiSettings.showOriginal === true),
          protectedWords: (data.aiSettings && data.aiSettings.protectedWords) || []
        }
      });

      // [v60.966] Unirse a la sala de alertas de Euskera basada en contexto
      syncEuskeraAlerts(socket);

      // [v60.958] Notificar al resto si el usuario entra con Euskera o Gallego (Motores Neuronales Beta)
      if (data.lang === 'eu' || data.lang === 'gl') {
        io.emit('system-warning-euskera', {
          user: cleanUsername,
          lang: data.lang,
          category: finalCategoryNames[0] || 'General',
          categories: finalCategoryNames
        });
      }

      // [v60.960] Orquestación Dinámica: Asegurar que el motor Whisper esté arrancado para Euskera o Gallego
      if (data.lang === 'eu' || data.lang === 'gl') {
        whisperMgr.ensureStarted(io);
      } else {
        // [v60. Elite] Auditoría para recién llegados: Notificar sobre usuarios/subusuarios que usan EU o GL
        Array.from(users.values()).forEach(u => {
          if ((u.lang === 'eu' || u.lang === 'gl') && u.id !== socket.id) {
            const uCat = (u.categories && u.categories[0]) || 'General';
            socket.emit('system-warning-euskera', {
              user: u.username,
              lang: u.lang,
              category: uCat,
              categories: u.categories || [uCat]
            });
          }
        });
        Array.from(subUsers.values()).forEach(su => {
          if ((su.lang === 'eu' || su.lang === 'gl') && su.rootUserId !== socket.id) {
            const suCat = su.category || 'General';
            socket.emit('system-warning-euskera', {
              user: `${su.rootUsername}: ${su.name}`,
              lang: su.lang,
              category: suCat,
              categories: [suCat]
            });
          }
        });
      }

      // [v60.18] PRE-CALENTAMIENTO PROACTIVO (Traducción o Euskera)
      const user = users.get(socket.id);
      if (user && aiWorkerReady && (user.aiSettings?.autoTranslate || user.lang === 'eu')) {
        console.log(`🔥 [AI-ENGINE] Pre-calentamiento proactivo para ${user.username} (${user.lang === 'eu' ? 'Euskera' : 'Traducción'})`);
        aiWorker.postMessage({ type: 'warm-up', taskId: `join-warmup-${socket.id}` });

        // Si es Euskera, informar modo Whisper inmediatamente
        if (user.lang === 'eu') {
          socket.emit('vosk-status', { available: true, mode: 'whisper' });
        }
      }

      // 🛡️ Notificar disponibilidad de motor de traducción neuronal al cliente
      const translationModelOnDisk = isTranslationModelInstalled();
      const translationGloballyEnabled = isTranslationGloballyEnabled();
      const realTranslationActive = Boolean(aiWorkerReady && translationModelOnDisk && translationGloballyEnabled);
      socket.emit('translation-engine-status', { available: realTranslationActive });
      if (!realTranslationActive) {
        socket.emit('system-warning-translation-disabled', { active: false });
      }

      // [v46.4.66.2] Auditoría de Identidad Digital
      console.log(`👤 [JOIN] ${cleanUsername} (${socket.id}) | Token: ${data.sessionToken ? 'Sincronizado' : 'PENDIENTE/VACÍO'}`);

      // [v60.ELITE] GESTIÓN DE SOBERANÍA DEL MASTER E IDENTITY PIVOT
      // El mando se otorga si: 
      // 1. El sistema está vacante (primer login)
      // 2. El nombre coincide con el Master reservado (recuperación con PIN validado arriba)
      // 3. Es un Maestro Supremo (con PIN validado arriba)

      const isSuperMaster = typeof cleanUsername === 'string' && String(SUPER_MASTER_NAME) &&
        cleanUsername.toLowerCase() === String(SUPER_MASTER_NAME).toLowerCase();

      // [v60.Elite] Un usuario toma posesión si el Master anterior está offline (Pivot)
      // BLINDAJE ELECTRON: Si la aplicación corre en entorno de escritorio (process.env.ELECTRON_HOST_TOKEN o flag de host local),
      // los dispositivos remotos que reconectan en vacante NO usurpan el mando; quedan como participantes normales
      // para que cuando el PC abra, encuentre el mando disponible o sea investido inmediatamente.
      const isMasterTakeover = isElectronHost ? masterIsOffline : (masterIsOffline && isAttemptingMasterRecovery);

      const isVestingMaster = isElectronHost
        ? (isSystemVacant || isAttemptingMasterRecovery || isSuperMaster || isMasterTakeover)
        : (isAttemptingMasterRecovery || isSuperMaster || (isSystemVacant && !process.env.ELECTRON_HOST_TOKEN));

      if (isVestingMaster) {
        const incomingCat = finalCategoryNames[0] || 'General';
        const nameChanged = categoriesData.masterUsername && categoriesData.masterUsername.toLowerCase() !== cleanUsername.toLowerCase();
        const categoryChanged = categoriesData.masterCategory && categoriesData.masterCategory.toLowerCase() !== incomingCat.toLowerCase();
        const isMasterRestore = categoriesData.masterId !== socket.id;

        if (nameChanged || categoryChanged) {
          console.log(`⚠️ [ELITE] Identity Pivot detectado. El nuevo soberano es ${cleanUsername}@${incomingCat}. Purga total iniciada.`);

          // 1. Purga Total de Memoria
          subUsers.clear();
          micAssignments.clear();

          // 2. Purga Total de Disco (Tabula Rasa física)
          storage.writeJSON(SUBUSERS_FILE, []);
          console.log(`🧹 [SOBERANÍA] Disco limpiado por cambio de identidad. Sesión limpia para ${cleanUsername}.`);

        } else if (isMasterRestore) {
          // [v60.ELITE] RE-VINCULACIÓN (Si NO hay pivot pero el socket cambió)
          const targetMaster = cleanUsername.toLowerCase();
          for (const [suId, su] of subUsers.entries()) {
            if (su.rootUsername && su.rootUsername.toLowerCase() === targetMaster) {
              su.rootUserId = socket.id;
              su.rootUsername = cleanUsername;
              console.log(`🔗 [ELITE] Sub-usuario "${su.name}" re-vinculado al nuevo socket del Master.`);
            }
          }
        }

        // Si es una restauración, notificar privilegios
        if (isMasterRestore) {
          const oldMasterId = categoriesData.masterId;
          categoriesData.masterId = socket.id;
          socket.emit('master-granted', { masterId: socket.id });
          if (oldMasterId && io.sockets.sockets.has(oldMasterId)) {
            io.sockets.sockets.get(oldMasterId).emit('master-changed', { masterId: socket.id });
          }
          console.log(`👑 Master restaurado a ${cleanUsername} (reconexión)`);
        }

        // Actualizar credenciales de soberanía siempre
        categoriesData.masterUsername = cleanUsername;
        categoriesData.masterCategory = incomingCat;
        categoriesData.masterId = socket.id;
        saveCategories();

        // [v60.ELITE] Notificar a TODOS el cambio de soberanía
        broadcastMasterStatus();

      }

      // Solo notificar si es la primera vez (no en reconexiones)
      if (!isRejoin) {
        socket.broadcast.emit('user-joined', {
          user: 'Sistema',
          username: cleanUsername,
          category: finalCategoryNames[0] || 'General',
          categories: finalCategoryNames,
          text: `${cleanUsername} se ha unido al chat`,
          time: new Date().toLocaleTimeString()
        });
      }

      // Build and broadcast the full users payload (includes sub-users)
      const allUsersData = getAllUsersData();
      io.emit('update-users', allUsersData);
      io.emit('update-filters', allUsersData);

      const userObj = users.get(socket.id);
      socket.emit('join-success', {
        username: cleanUsername,
        categories: finalCategoryNames,
        categoryIds: finalCategoryIds,
        users: allUsersData,
        allUsers: allUsersData,
        dictionary: loadDictionary(data.lang || 'es'),
        isMaster: categoriesData.masterId === socket.id,
        masterCategory: categoriesData.masterCategory,
        cacheLimit: currentCacheLimitMB,
        currentCacheMB: parseFloat(((getDirSize(RECORDINGS_DIR) + getDirSize(IMAGES_DIR)) / (1024 * 1024)).toFixed(2)),
        globalSettings: loadGlobalSettings(),
        isTranslationAvailable: realTranslationActive
      });

      // [v60.Elite] Sincronización de Soberanía para ejecución delegada (Inicial)
      if (data.enabledTriggerIds && Array.isArray(data.enabledTriggerIds)) {
        data.enabledTriggerIds.forEach(trId => {
          triggerManager.setUserTriggerState(socket.id, trId, true);
        });
        console.log(`📡 [ELITE-SYNC] Sincronizados ${data.enabledTriggerIds.length} triggers para ${cleanUsername}`);
      }

      // [v60.Elite] Sincronización proactiva de Palabras Protegidas Babel al conectar
      const initialBabelLang = data.lang || 'es';
      const initialProtectedWords = loadBabelProtected(initialBabelLang);
      socket.emit('babel-dictionary-loaded', {
        lang: initialBabelLang,
        count: initialProtectedWords.length,
        words: initialProtectedWords
      });

      // Enviar historial de mensajes si existe
      if (messageHistory.length > 0) {
        socket.emit('message-history', messageHistory);
      }

      // [v60.18] Sincronización final de estado de transcripción (solo si no se envió ya para Whisper)
      if (user && user.lang !== 'eu') {
        socket.emit('vosk-status', { available: transcriptionAvailable, mode: voskAvailable ? 'vosk' : 'local-fallback' });
      }

      // 🛡️ [Anti-Murphy] Notificar inmediatamente al cliente si el motor de traducción no está activo
      if (!realTranslationActive) {
        socket.emit('system-warning-translation-disabled');
      }

      console.log(`👤 ${cleanUsername} ${isRejoin ? 'reconectado' : 'se unió al chat'}. Total: ${users.size}`);

      // [v60.Elite] Sincronización Inicial de Soberanía de Triggers
      if (data && data.enabledTriggerIds && Array.isArray(data.enabledTriggerIds)) {
        const sovereigntyKey = `${cleanUsername}_${cleanIp}`;
        triggerSovereigntyStates.set(sovereigntyKey, new Set(data.enabledTriggerIds));
        console.log(`⚡ [SOBERANÍA] Estado de triggers sincronizado para ${sovereigntyKey} (${data.enabledTriggerIds.length} activos)`);
      }

      // [v60.Elite] Purgado proactivo de claims de sesión anónima previa para esta IP al identificarse formalmente
      const anonKey = `anon_${cleanIp}`;
      if (triggerSovereigntyStates.has(anonKey)) {
        triggerSovereigntyStates.delete(anonKey);
        console.log(`🧹 [SOBERANÍA] Claims anónimos purgados para IP ${cleanIp} al identificarse como ${cleanUsername}`);
      }

      // Difundir active claims al unirse/reconectarse
      if (typeof io !== 'undefined') {
        io.emit('active-claims-updated', getGlobalActiveClaims());
      }
      if (global.updateTelemetry) global.updateTelemetry();
    });

    // [v60.Elite] Evento de sincronización dinámica de triggers (Sincronización Unificada)
    socket.on('sync-triggers-state', (data) => {
      if (data && Array.isArray(data.enabledTriggerIds)) {
        const user = users.get(socket.id);
        const cleanIp = getCleanIp(socket);
        const sovereigntyKey = user ? `${user.username}_${user.ip}` : `anon_${cleanIp}`;
        triggerSovereigntyStates.set(sovereigntyKey, new Set(data.enabledTriggerIds));
        console.log(`⚡ [SOBERANÍA] Estado de triggers guardado para: ${sovereigntyKey} (${data.enabledTriggerIds.length} activos)`);

        // Sincronizar también con triggerManager
        if (triggerManager && triggerManager.userTriggerStates) {
          triggerManager.userTriggerStates.set(socket.id, new Map());
          data.enabledTriggerIds.forEach(tid => {
            triggerManager.setUserTriggerState(socket.id, tid, true);
          });
        }

        // Difundir mapa de claims activos a todos
        if (typeof io !== 'undefined') {
          io.emit('active-claims-updated', getGlobalActiveClaims());
        }
      }
    });

    // [v60.ELITE FIX] Isolated recognizers per sub-user to avoid interleaving and crashes
    let activeRecognizers = new Map(); // subUserId (or 'root') -> vosk.Recognizer
    // Buffer chunks for current recognizer per subUserId (for reconstruction)
    let _voskChunkBuffers = {}; // { subUserId: [Buffer,...] }
    let _voskPendingBuffers = {}; // { subUserId: Buffer }
    let _voskTextSegments = {}; // { subUserId: [string,...] }
    const VOSK_ACCEPT_THRESHOLD_BYTES = 8000; // Reducido para mayor fluidez (aprox 0.25s @16kHz)

    socket.on('vosk-start', (data) => {
      const user = users.get(socket.id);
      const subId = (data && data.subUserId) ? data.subUserId : 'root';
      let lang = data?.lang || user?.lang || 'es';

      console.log(`🎙️ [VOSK-START] Solicitud: subId=${subId}, lang=${lang}, socket=${socket.id}`);

      // [v60.1] VALIDACIÓN ESTRICTA: Solo permitir si el sub-usuario existe y pertenece al socket
      if (subId !== 'root') {
        const su = subUsers.get(subId);
        if (!su || su.rootUserId !== socket.id) {
          console.warn(`⚠️ [VOSK] Intento de inicio denegado para sub-usuario inexistente o ajeno: ${subId}`);
          return;
        }
        if (su.lang) lang = su.lang;
      }

      // [v60.9] RESET DE MEMORIA GLOBAL: Limpiar cualquier residuo de audio anterior para este ID
      // Esto debe ocurrir ANTES de cualquier cortocircuito (como el de Euskera)
      _voskChunkBuffers[subId] = [];
      _voskPendingBuffers[subId] = Buffer.alloc(0);
      _voskTextSegments[subId] = [];

      // [v60.2] CORTOCIRCUITO EXPERTO: Euskera y Gallego son independientes de Vosk.
      // Si el idioma es 'eu' o 'gl', usamos Whisper aunque Vosk no esté instalado.
      if (lang === 'eu' || lang === 'gl') {
        const targetKey = `${socket.id}_${subId}`;
        _whisperSessionMap.set(targetKey, Date.now());
        _whisperLastProcessedSeq.set(targetKey, 0);
        _whisperTaskInFlight.set(targetKey, false);

        if (aiWorkerReady) {
          activeRecognizers.set(subId, { isWhisper: true, lang: lang, targetKey: targetKey, seq: 0 });
          console.log(`🧠 [WHISPER-START] Modo Whisper-Only iniciado para ${lang === 'eu' ? 'Euskera' : 'Gallego'} (ID: ${subId})`);

          // [v60.7] WARM-UP PROACTIVO: Cargar Whisper inmediatamente para evitar lag en la primera frase
          aiWorker.postMessage({ type: 'warm-up', taskId: `warmup-${lang}-${subId}` });

          // Notificar al cliente que estamos en modo Neural (Whisper)
          socket.emit('vosk-status', { available: true, mode: 'whisper' });
        } else {
          console.warn(`⚠️ [WHISPER] El motor de IA no está listo para ${lang === 'eu' ? 'Euskera' : 'Gallego'}.`);
          socket.emit('vosk-status', { available: true, mode: 'local-fallback' });
        }
        return;
      }

      // [v59.4] Si Vosk NO está disponible → Usar fallback local (Solo para ES/EN)
      if (!voskAvailable || !vosk) {
        socket.emit('vosk-status', { available: true, mode: 'local-fallback' });
        return;
      }

      // Lazy loading del modelo si no existe
      if (!voskModels[lang]) {
        const config = MODELS_CONFIG[lang];
        if (config && config.type === 'zip') {
          const folderName = config.folder || `vosk-model-small-${lang}`;
          const modelsPath = getModelsPath();
          let modelPath = path.join(modelsPath, folderName);
          if (!fs.existsSync(modelPath)) {
            modelPath = path.join(__dirname, folderName);
          }
          if (fs.existsSync(modelPath)) {
            console.log(`📦 Cargando modelo Vosk [${lang.toUpperCase()}] bajo demanda desde ${modelPath} para ${subId}.`);
            try {
              voskModels[lang] = new vosk.Model(modelPath);
            } catch (e) {
              console.error(`❌ Error cargando modelo Vosk [${lang}]:`, e.message);
              socket.emit('vosk-status', { available: true, mode: 'local-fallback' });
              return;
            }
          } else {
            console.warn(`❌ Modelo Vosk no encontrado en: ${modelPath}`);
            socket.emit('vosk-status', { available: true, mode: 'local-fallback' });
            return;
          }
        } else {
          socket.emit('vosk-status', { available: true, mode: 'local-fallback' });
          return;
        }
      }

      try {
        const model = voskModels[lang];
        if (!model) {
          socket.emit('vosk-status', { available: true, mode: 'local-fallback' });
          return;
        }

        // Liberar reconocedor previo para este ID específico si existe
        if (activeRecognizers.has(subId)) {
          try { activeRecognizers.get(subId).free(); } catch (e) { }
          activeRecognizers.delete(subId);
        }

        const recognizer = new vosk.Recognizer({ model: model, sampleRate: 16000 });
        activeRecognizers.set(subId, recognizer);
        console.log(`🎤 Recognizer [${lang}] iniciado para ${user?.username || 'Guest'} (ID: ${subId})`);

      } catch (e) {
        console.error('❌ Error iniciando recognizer:', e);
      }
    });

    socket.on('update-ai-settings', (data) => {
      const user = users.get(socket.id);
      if (user) {
        user.aiSettings = { ...(user.aiSettings || {}), ...data };
        console.log(`🧠 [AI-ENGINE] Ajustes de IA actualizados para ${user.username}:`, user.aiSettings);

        // [v60.1-BABEL] Si activa la traducción, despertamos al motor inmediatamente
        if (aiWorkerReady && data.autoTranslate === true) {
          aiWorker.postMessage({ type: 'warm-up', taskId: 'settings-warmup' });
        }
      }
    });

    socket.on('hermes-speak-logged', () => {
      const now = Date.now();
      const limit = ttsLimits.get(socket.id) || { count: 0, lastReset: now };

      if (now - limit.lastReset > 1000) {
        limit.count = 1;
        limit.lastReset = now;
      } else {
        limit.count++;
      }

      ttsLimits.set(socket.id, limit);

      if (limit.count > 5) {
        console.warn(`⚠️ [Rate-Limit] Petición TTS ignorada por exceso de tasa del cliente: ${socket.id}`);
        return;
      }

      global.sessionStats.hermes_msg_count = (global.sessionStats.hermes_msg_count || 0) + 1;
      console.log(`🗣️ [Telemetría] Hermes TTS utilizado. Contador incremental: ${global.sessionStats.hermes_msg_count}`);
    });

    socket.on('save-babel-dictionary', (data) => {
      const user = users.get(socket.id);
      if (user && user.lang) {
        saveBabelProtected(data, user.lang);
      }
    });

    socket.on('set-language', (data) => {
      const user = users.get(socket.id);
      if (user && data && data.lang) {
        user.lang = data.lang;
        console.log(`🌐 Idioma de ${user.username} cambiado a: ${data.lang}`);

        try {
          const pathFile = storage.resolveWritablePath(path.join(__dirname, 'config', 'data', 'models-path.json'));
          if (fs.existsSync(pathFile)) {
            const fileData = JSON.parse(fs.readFileSync(pathFile, 'utf8'));
            fileData.defaultLang = data.lang.toLowerCase();
            fs.writeFileSync(pathFile, JSON.stringify(fileData, null, 2), 'utf8');
            console.log(`💾 Idioma predeterminado guardado en models-path.json: ${data.lang}`);
          }
        } catch (e) {
          console.error("❌ Error actualizando defaultLang en models-path.json:", e.message);
        }

        // [v60.Elite] Sincronización Dinámica de Palabras Protegidas

        const protectedWords = loadBabelProtected(data.lang);
        if (!user.aiSettings) user.aiSettings = {};
        user.aiSettings.protectedWords = protectedWords;

        socket.emit('dictionary-data', loadDictionary(data.lang));
        socket.emit('babel-dictionary-loaded', { lang: data.lang, count: protectedWords.length, words: protectedWords });

        // Si Vosk NO está disponible, no hacer nada más (el cliente usará Web Speech API)
        if (!voskAvailable || !vosk) {
          console.log(`ℹ️ Vosk no disponible. Cliente usará Web Speech API para [${data.lang}]`);
          return;
        }

        // --- Gestión de Memoria (Talk-me v60 Elite) ---
        // Mantenemos ES y EN siempre cargados si existen para evitar lag de recarga
        const coreLangs = ['es', 'en'].filter(l => getInstalledLanguages().includes(l));

        // Verificamos qué otros idiomas están en uso
        const usedLangs = new Set();
        users.forEach(u => usedLangs.add(u.lang || 'es'));

        // Liberamos modelos secundarios que NADIE usa, pero conservamos los core
        Object.keys(voskModels).forEach(l => {
          if (!coreLangs.includes(l) && !usedLangs.has(l)) {
            delete voskModels[l];
          }
        });

        syncEuskeraAlerts(socket);

        // [v60.2] AISLAMIENTO EUSKERA: Si es 'eu', no cargamos Vosk (usamos Whisper en el carril neural)
        if (data.lang === 'eu') {
          if (aiWorkerReady) {
            aiWorker.postMessage({ type: 'warm-up', taskId: `warmup-eu-proactive-${socket.id}` });
            socket.emit('vosk-status', { available: true, mode: 'whisper' });

            // [v60.958] Notificar a todos que este usuario ha cambiado a Euskera (Beta)
            io.emit('system-warning-euskera', { user: user.username });

            // [v60.960] Orquestación Dinámica: Asegurar que el motor Whisper esté arrancado al seleccionar el idioma
            whisperMgr.ensureStarted(io);
          } else {
            socket.emit('vosk-status', { available: true, mode: 'local-fallback' });
          }
          return;
        }

        // Aseguramos que el modelo solicitado esté disponible (Lazy Loading)
        if (!voskModels[data.lang]) {
          const config = MODELS_CONFIG[data.lang];
          if (!config || config.type !== 'zip') {
            socket.emit('vosk-status', { available: true, mode: 'local-fallback' });
            return;
          }
          const folderName = config.folder || `vosk-model-small-${data.lang}`;
          const modelsPath = getModelsPath();
          let modelPath = path.join(modelsPath, folderName);
          if (!fs.existsSync(modelPath)) {
            modelPath = path.join(__dirname, folderName);
          }

          if (fs.existsSync(modelPath)) {
            try {
              voskModels[data.lang] = new vosk.Model(modelPath);
              console.log(`📦 Cargando modelo Vosk [${data.lang.toUpperCase()}] bajo demanda desde ${modelPath}`);
            } catch (e) {
              console.error(`❌ Error cargando modelo Vosk [${data.lang}]:`, e.message);
              voskAvailable = false;
              socket.emit('vosk-status', { available: true, mode: 'local-fallback' });
              return;
            }
          } else {
            console.warn(`❌ Modelo Vosk no encontrado: ${modelPath}`);
            socket.emit('vosk-status', { available: true, mode: 'local-fallback' });
            return;
          }
        }

        // Notificar éxito y modo Vosk
        socket.emit('vosk-status', { available: true, mode: 'vosk' });
        emitUpdateUsers();
      }
    });

    // --- NTP CLOCK SYNC (Elite 10/10) ---
    socket.on('sync-req', (t0) => {
      socket.emit('sync-resp', { t0, t1: Date.now(), t2: Date.now() });
    });

    // --- ELITE AUDIO STREAMING (Real-time) ---
    socket.on('audio-stream-start', (data) => {
      if (isSystemSaturated()) {
        socket.emit('error', { code: 503, message: 'Servidor saturado. Intente más tarde.' });
        return;
      }
      const streamId = (data && data.streamId) || `str-${socket.id}-${Date.now()}`;
      let category = (data && data.category) || 'General';

      // [v59.33] Resolución de ID a Nombre Oficial
      const official = categoriesData.categories.find(c => c.id === category || c.name === category);
      if (official) category = official.name;

      activeStreams.set(`${socket.id}:${streamId}`, { streamId, category });
      socket.emit('audio-stream-ready', { streamId });
    });

    socket.on('audio-stream-chunk', (payload) => {
      // payload: { streamId, seq, chunk, traceId, timestamp }
      const { streamId, seq, timestamp } = payload;
      if (!streamId || seq === undefined || seq === null) return;

      // [v60] Soporte para múltiples flujos paralelos por socket (Raíz + Subusuarios)
      const streamKey = `${socket.id}:${streamId}`;
      const streamInfo = activeStreams.get(streamKey);
      if (streamInfo && streamInfo.streamId === streamId) {
        payload.category = streamInfo.category;
      }

      // --- Sub-usuario: validar subUserId si viene en el payload ---
      let subUserId = payload.subUserId || null;
      if (subUserId) {
        const su = subUsers.get(subUserId);
        if (!su || su.rootUserId !== socket.id) {
          subUserId = null;
        }
      }

      // DIAGNÓSTICO: log de chunks de sub-usuario
      try {
        if (subUserId) {
          let chunkLen = null;
          try { chunkLen = payload.chunk ? (payload.chunk.length || payload.chunk.byteLength || null) : null; } catch (e) { chunkLen = null; }
        }
      } catch (e) { }

      // Attach root and sub metadata for receivers: rootUserId, rootUser (username, categories), subUser minimal
      const user = users.get(socket.id);
      payload.rootUserId = socket.id;
      payload.rootUser = user ? { id: user.id, username: user.username, categories: user.categories } : null;
      if (subUserId) {
        const su = subUsers.get(subUserId);
        payload.subUserId = subUserId;
        payload.subUser = su ? { subUserId: su.subUserId, name: su.name, category: su.category } : { subUserId };
      } else {
        payload.subUserId = null;
        payload.subUser = null;
      }

      // [v60.TTS-FIX] Determinar el idioma del flujo para permitir muteo en tiempo real en los receptores
      let streamLang = user ? (user.lang || 'es') : 'es';
      if (subUserId) {
        const su = subUsers.get(subUserId);
        if (su && su.lang) {
          streamLang = su.lang;
        }
      }
      payload.lang = streamLang;

      // --- 📈 TELEMETRY CALCULATION (Elite 10/10) ---
      const networkLatency = Date.now() - timestamp;
      metrics.audio_latency_ms.push(networkLatency);
      if (metrics.audio_latency_ms.length > 100) metrics.audio_latency_ms.shift();

      // Cache for NACK retransmission
      nackCache.set(`${streamId}:${seq}`, { data: payload, timestamp: Date.now() });

      // Forward to other participants (attach username for compatibility)
      if (user) {
        payload.user = user.username;
      }

      // Cachear info del flujo por streamKey para evitar colisiones
      if (!activeStreams.has(streamKey)) {
        activeStreams.set(streamKey, { streamId, category: payload.category || 'General', subUserId: subUserId || null });
      }

      // Broadcast the enriched payload. Receivers can use payload.rootUserId + payload.subUserId
      // Broadcast a todos (io.emit) si es sub-usuario para que el creador también lo escuche
      if (payload.subUserId) {
        io.emit('audio-stream-chunk', payload);
      } else {
        socket.broadcast.emit('audio-stream-chunk', payload);
      }
    });

    socket.on('audio-stream-nack', (data) => {
      // data: { streamId, seq }
      const key = `${data.streamId}:${data.seq}`;
      const cached = nackCache.get(key);
      if (cached) {
        // Redundant retransmission suppression (NACK Memory)
        // Only retransmit if it's the first NACK or enough time passed? 
        // For 10/10, we send it back but we track if we are flooding.
        socket.emit('audio-stream-chunk', cached.data);
      }
    });

    socket.on('audio-stream-end', (data) => {
      if (data && data.streamId) {
        activeStreams.delete(`${socket.id}:${data.streamId}`);
      } else {
        // Fallback: limpiar todos los flujos de este socket
        for (const key of activeStreams.keys()) {
          if (key.startsWith(`${socket.id}:`)) {
            activeStreams.delete(key);
          }
        }
      }
    });

    socket.on('resume-stream', (data) => {
      // Resume streaming state for rebalancing or reconnection
      if (!data) return;
      if (data.streamingId) {
        activeStreams.set(`${socket.id}:${data.streamingId}`, { streamId: data.streamingId, category: data.category || 'General' });
      }
    });

    // --- SUB-USUARIOS: API mínima segura (stubs) ---
    socket.on('validateMicrophoneAssignment', (mic, callback) => {
      try {
        if (!mic || !mic.deviceId) {
          if (callback) callback({ ok: false, error: 'invalid_payload' });
          return;
        }
        const key = `${mic.deviceId}:${mic.channel || 0}`;
        const assigned = micAssignments.get(key) || null;
        if (callback) callback({ ok: !assigned, assignedTo: assigned });
      } catch (e) {
        if (callback) callback({ ok: false, error: e.message });
      }
    });

    socket.on('registerSubUser', (subUserInfo, callback) => {
      try {
        const user = users.get(socket.id);
        if (!user) {
          if (callback) callback({ success: false, error: 'not_authenticated' });
          return;
        }
        if (!subUserInfo || typeof subUserInfo !== 'object') {
          if (callback) callback({ success: false, error: 'invalid_payload' });
          return;
        }

        // Server MUST generate canonical subUserId to avoid client spoofing/collision
        let newId = null;
        do { newId = randomUUID(); } while (subUsers.has(newId));
        subUserInfo.subUserId = newId;

        // For security and consistency, server assigns the canonical rootUserId and rootUsername
        subUserInfo.rootUserId = socket.id;
        try { subUserInfo.rootUsername = user.username; } catch (e) { subUserInfo.rootUsername = null; }

        const key = subUserInfo.mic ? `${subUserInfo.mic.deviceId}:${subUserInfo.mic.channel || 0}` : null;

        // Enforce per-root limit
        const existingCount = Array.from(subUsers.values()).filter(s => s.rootUserId === socket.id).length;
        if (existingCount >= MAX_SUBUSERS_PER_ROOT) {
          if (callback) callback({ success: false, error: 'limit_reached', limit: MAX_SUBUSERS_PER_ROOT });
          return;
        }

        if (key && micAssignments.has(key)) {
          if (callback) callback({ success: false, error: 'mic_conflict', assignedTo: micAssignments.get(key) });
          return;
        }

        // Attach root username for stable matching across sockets
        try { subUserInfo.rootUsername = user.username; } catch (e) { }
        // Persist in-memory and on-disk
        subUsers.set(subUserInfo.subUserId, subUserInfo);
        if (key) micAssignments.set(key, subUserInfo.subUserId);
        saveSubUsers();

        emitUpdateUsers();

        // [v60.962] Alerta Global para Sub-usuarios en Euskera
        if (subUserInfo.lang === 'eu') {
          io.emit('system-warning-euskera', { user: `${user.username}: ${subUserInfo.name}` });
          syncEuskeraAlerts(socket); // Asegurar que el Master recibe estados del motor
          if (typeof whisperMgr !== 'undefined') whisperMgr.ensureStarted(io);
        }

        if (callback) callback({ success: true, subUserId: subUserInfo.subUserId });
      } catch (e) {
        console.error('❌ registerSubUser error:', e.message);
        if (callback) callback({ success: false, error: e.message });
      }
    });

    socket.on('removeSubUser', (payload, callback) => {
      try {
        const subUserId = typeof payload === 'string' ? payload : (payload && payload.subUserId);
        if (!subUserId) {
          if (callback) callback({ success: false, error: 'invalid_payload' });
          return;
        }
        const su = subUsers.get(subUserId);
        if (!su) {
          if (callback) callback({ success: false, error: 'not_found' });
          return;
        }
        // [v60.1.ELITE] AUTORIZACIÓN MEJORADA: Permitir eliminación si el socket coincide O si el username coincide (Soporte Multi-pestaña)
        const user = users.get(socket.id);
        if (su.rootUserId !== socket.id && (!user || su.rootUsername !== user.username)) {
          if (callback) callback({ success: false, error: 'not_authorized' });
          return;
        }
        if (su.mic) {
          const key = `${su.mic.deviceId}:${su.mic.channel || 0}`;
          if (micAssignments.get(key) === subUserId) micAssignments.delete(key);
        }
        subUsers.delete(subUserId);
        saveSubUsers();
        // Broadcast to clients that this sub-user was removed so they can stop local capture
        // [v60.1] Limpiar recognizer activo del servidor si existe
        const ghostRec = activeRecognizers.get(subUserId);
        if (ghostRec) {
          try { ghostRec.free(); } catch (e) { }
          activeRecognizers.delete(subUserId);
        }

        try { io.emit('subuser-removed', { subUserId }); } catch (e) { }
        emitUpdateUsers();
        if (callback) callback({ success: true });
      } catch (e) {
        console.error('❌ removeSubUser error:', e.message);
        if (callback) callback({ success: false, error: e.message });
      }
    });

    // Devuelve mics asignados (in-memory) para que el cliente pueda filtrar UI
    socket.on('get-assigned-mics', (data, callback) => {
      try {
        const list = Array.from(micAssignments.entries()).map(([key, subId]) => {
          const parts = key.split(':');
          return { deviceId: parts[0], channel: parseInt(parts[1] || '0'), subUserId: subId };
        });
        if (callback) callback({ ok: true, assigned: list });
      } catch (e) {
        if (callback) callback({ ok: false, error: e.message });
      }
    });

    // Actualizar estado parcial de sub-usuario (ej: vumeter, threshold) - in-memory
    socket.on('updateSubUserState', (payload, callback) => {
      try {
        const { subUserId, updates } = payload || {};
        if (!subUserId || !updates) {
          if (callback) callback({ ok: false, error: 'invalid_payload' });
          return;
        }
        const su = subUsers.get(subUserId);
        if (!su) { if (callback) callback({ ok: false, error: 'not_found' }); return; }

        // [v60.1] AUTORIZACIÓN MEJORADA: Permitir edición si el socket coincide O si el username coincide (Soporte Multi-pestaña)
        const user = users.get(socket.id);
        if (su.rootUserId !== socket.id && (!user || su.rootUsername !== user.username)) {
          if (callback) callback({ ok: false, error: 'not_authorized' });
          return;
        }

        // [INGENIERÍA QUIRÚRGICA v60.ELITE FIX - Sol.3] Sincronización de MicAssignments con validación de colisiones
        if (updates.mic !== undefined) {
          if (updates.mic && updates.mic.deviceId) {
            const newKey = `${updates.mic.deviceId}:${updates.mic.channel || 0}`;
            const currentOwner = micAssignments.get(newKey);

            // Comprobar colisiones excluyéndose a sí mismo
            if (currentOwner && currentOwner !== subUserId) {
              if (callback) callback({ ok: false, error: 'mic_conflict', assignedTo: currentOwner });
              return;
            }

            // Liberar clave antigua
            if (su.mic) {
              const oldKey = `${su.mic.deviceId}:${su.mic.channel || 0}`;
              if (micAssignments.get(oldKey) === subUserId) micAssignments.delete(oldKey);
            }
            // Registrar nueva
            micAssignments.set(newKey, subUserId);
          } else if (su.mic) {
            // Si la actualización desconecta el mic
            const oldKey = `${su.mic.deviceId}:${su.mic.channel || 0}`;
            if (micAssignments.get(oldKey) === subUserId) micAssignments.delete(oldKey);
          }
        }

        // Merge updates shallow
        const merged = Object.assign({}, su, updates);
        subUsers.set(subUserId, merged);

        // [v60.1] SINCRONIZACIÓN QUIRÚRGICA: Actualizar categoría en flujos activos para evitar filtrado erróneo en receptores
        if (updates.category) {
          for (let [key, info] of activeStreams.entries()) {
            if (info.subUserId === subUserId) {
              info.category = updates.category;
            }
          }
        }

        emitUpdateUsers();

        // [v60.962] Alerta Global ante cambio de idioma en Sub-usuario (Solo si el idioma ha cambiado a 'eu')
        if (updates.lang === 'eu' && su.lang !== 'eu') {
          io.emit('system-warning-euskera', { user: `${su.rootUsername}: ${su.name}` });
          syncEuskeraAlerts(socket); // Asegurar que el Master recibe estados del motor
          if (typeof whisperMgr !== 'undefined') whisperMgr.ensureStarted(io);
        }

        if (callback) callback({ ok: true });
      } catch (e) {
        if (callback) callback({ ok: false, error: e.message });
      }
    });

    socket.on('get-dictionary', (data) => {
      const user = users.get(socket.id);
      const lang = (data && data.lang) || (user && user.lang) || 'es';
      socket.emit('dictionary-data', loadDictionary(lang));

      // [v60.Elite] También sincronizar escudo Babel
      const protectedWords = loadBabelProtected(lang);
      socket.emit('babel-dictionary-loaded', { lang, count: protectedWords.length, words: protectedWords });
    });

    // [v60] Petición manual de triggers (Faltaba en el servidor legacy)
    socket.on('get-triggers', () => {
      try { triggerFileSync.checkSyncIfNeeded(); } catch (_) { }
      socket.emit('triggers-data', triggersCache);
    });

    // [v60.Elite] Abrir carpeta física de archivos de triggers intercambiables en el sistema operativo
    socket.on('open-triggers-folder', (data, callback) => {
      const cb = (typeof data === 'function') ? data : callback;
      try {
        triggerFileSync.openTriggersFolder(cb);
      } catch (e) {
        console.error('❌ Error en open-triggers-folder:', e.message);
        if (typeof cb === 'function') cb({ success: false, error: e.message });
      }
    });

    // [INGENIERÍA EXPERTA] Sincronización On-Demand de Administración de Usuarios (v60.Elite)
    socket.on('get-users', () => {
      const user = users.get(socket.id);
      const isAuthorized = user && (user.id === categoriesData.masterId || user.username === categoriesData.masterUsername);

      if (isAuthorized) {
        socket.emit('update-users', getAllUsersData());
      } else {
        console.warn(`🛑 [SECURITY] Intento de acceso no autorizado a lista de usuarios por socket: ${socket.id}`);
      }
    });

    socket.on('update-dictionary', (payload) => {
      const data = Array.isArray(payload) ? payload : (payload && payload.words);
      const user = users.get(socket.id);
      const lang = (payload && payload.lang) || (user && user.lang) || 'es';
      if (Array.isArray(data)) {
        if (saveDictionary(data, lang)) {
          io.emit('dictionary-updated', { words: data, lang: lang });
        }
      }
    });

    // === GESTIÓN DE CACHÉ (Solo Master) ===
    socket.on('set-cache-limit', (data) => {
      const user = users.get(socket.id);
      const isMaster = user && user.id === categoriesData.masterId;

      if (!isMaster) {
        socket.emit('error-message', '❌ Solo el Master puede cambiar el límite de caché');
        return;
      }

      const limitMB = parseInt(data.limit, 10);
      if (limitMB < 10 || limitMB > 500) {
        socket.emit('error-message', '❌ Límite debe estar entre 10 y 500 MB');
        return;
      }

      if (saveCacheSettings(limitMB, user.username)) {
        io.emit('cache-limit-updated', { limitMB: limitMB, updatedBy: user.username });
        enforceCacheLimit(); // [v59.Elite] Notificar tamaño y nuevo límite inmediatamente
      }
    });

    // === LIMPIAR CACHÉ (Solo Master) ===
    socket.on('clear-cache', (data, callback) => {
      const user = users.get(socket.id);
      const isMaster = user && user.id === categoriesData.masterId;

      if (!isMaster) {
        if (typeof callback === 'function') {
          callback({ success: false, message: '❌ Solo el Master puede limpiar el caché' });
        }
        return;
      }

      try {
        let cleared = 0;

        // Limpiar imágenes
        if (fs.existsSync(IMAGES_DIR)) {
          const imageFiles = fs.readdirSync(IMAGES_DIR);
          imageFiles.forEach(file => {
            try {
              fs.unlinkSync(path.join(IMAGES_DIR, file));
              cleared++;
            } catch (e) { }
          });
        }

        // Limpiar grabaciones
        if (fs.existsSync(RECORDINGS_DIR)) {
          const recordFiles = fs.readdirSync(RECORDINGS_DIR);
          recordFiles.forEach(file => {
            try {
              fs.unlinkSync(path.join(RECORDINGS_DIR, file));
              cleared++;
            } catch (e) { }
          });
        }

        // ✅ Limpiar imagesHistory cuando se borra el caché
        imagesHistory = [];

        const message = `Caché limpiado: ${cleared} archivos eliminados`;
        console.log(`🗑️ ${message} (por ${user.username})`);

        if (typeof callback === 'function') {
          callback({ success: true, message: message });
        }

        // Notificar a todos
        io.emit('cache-cleared', { message: message, clearedBy: user.username, count: cleared });
        enforceCacheLimit();
      } catch (e) {
        console.error('❌ Error limpiando caché:', e.message);
        if (typeof callback === 'function') {
          callback({ success: false, message: 'Error al limpiar caché' });
        }
      }
    });

    socket.on('vosk-chunk', (audioData) => {
      try {
        // Accept either raw buffer or object { audioData, subUserId }
        let buffer = null;
        let chunkSubUserId = 'root';

        // Detección robusta de payload (Buffer vs Object)
        if (Buffer.isBuffer(audioData)) {
          buffer = audioData;
        } else if (audioData && audioData.audioData) {
          // Es un objeto envuelto { audioData, subUserId }
          const rawData = audioData.audioData;
          buffer = Buffer.isBuffer(rawData) ? rawData : (rawData.data ? Buffer.from(rawData.data) : Buffer.from(rawData));
          chunkSubUserId = audioData.subUserId || 'root';
        } else if (audioData && audioData.type === 'Buffer' && Array.isArray(audioData.data)) {
          // Es un objeto JSON serializado de Buffer (Socket.io fallback)
          buffer = Buffer.from(audioData.data);
        } else {
          // Intento desesperado: convertir lo que sea que venga (posible ArrayBuffer)
          buffer = Buffer.from(audioData);
        }

        const targetId = chunkSubUserId;
        let recognizer = activeRecognizers.get(targetId);

        if (Date.now() % 200 === 0) {
          console.log(`📥 [VOSK-CHUNK] Recibido chunk para ${targetId} (${buffer.length} bytes). Recognizer=${!!recognizer}`);
        }

        // [v59.4] Si Vosk NO está disponible, usar fallback local
        if (!recognizer) {
          if (Date.now() % 50 === 0) console.warn(`⚠️ [VOSK-SERVER] Chunk ignorado para ${targetId}: No hay recognizer activo.`);
          if (!voskAvailable) {
            // Fallback: análisis local del audio
            const user = users.get(socket.id);
            const lang = user?.lang || 'es';
            const analysis = LocalTranscriptionEngine.transcribeWithDictionary(buffer, lang);
            socket.emit('vosk-partial', {
              text: analysis.result,
              isFinal: false,
              estimated: true,
              subUserId: targetId === 'root' ? null : targetId
            });
            return;
          }

          // [v60.1] REMOVIDO AUTO-START agresivo: 
          // Solo se debe transcribir si se ha recibido un 'vosk-start' previo.
          // Esto evita que IDs huérfanos o antiguos generen mensajes fantasma.
          return;
        }

        // Store chunk for reconstruction
        if (!_voskChunkBuffers[targetId]) _voskChunkBuffers[targetId] = [];
        _voskChunkBuffers[targetId].push(buffer);

        // [v60.2] Si es carril Whisper, no procesar con Vosk, solo acumular
        if (recognizer.isWhisper) {
          const wLang = recognizer.lang || 'eu';
          const targetKey = recognizer.targetKey || `${socket.id}_${targetId}`;
          const currentSession = _whisperSessionMap.get(targetKey);

          // [v60.5] Feedback visual inicial de actividad (solo en los primeros 2 chunks para no borrar texto posterior)
          if (_voskChunkBuffers[targetId].length === 2) {
            socket.emit('transcription-partial', {
              text: '...',
              isProcessing: true,
              isWhisper: true,
              subUserId: targetId === 'root' ? null : targetId
            });
          }

          // [v60.950] WHISPER REAL-TIME: Inferencia parcial cada ~1.0 segundo (4 chunks de 250ms)
          // Murphy Shield: Solo enviar si no hay una inferencia parcial ya en vuelo para este usuario
          const isInFlight = _whisperTaskInFlight.get(targetKey) === true;
          if (_voskChunkBuffers[targetId].length >= 4 && _voskChunkBuffers[targetId].length % 4 === 0 && !isInFlight) {
            _whisperTaskInFlight.set(targetKey, true);
            recognizer.seq = (recognizer.seq || 0) + 1;
            const currentSeq = recognizer.seq;

            const partialAudio = Buffer.concat(_voskChunkBuffers[targetId]);
            const taskId = `partial-${wLang}-${targetId}-${Date.now()}`;
            aiWorker.postMessage({
              type: 'transcribe-euskera',
              taskId,
              audio: partialAudio,
              lang: wLang,
              socketId: socket.id,
              isPartial: true,
              sessionSeq: currentSession,
              seq: currentSeq,
              subUserId: targetId === 'root' ? null : targetId
            });
          }

          return;
        }

        // Aggregate chunks
        if (!_voskPendingBuffers[targetId]) _voskPendingBuffers[targetId] = Buffer.alloc(0);

        // Optimización: evitar concatenación excesiva si el buffer es pequeño
        _voskPendingBuffers[targetId] = Buffer.concat([_voskPendingBuffers[targetId], buffer]);

        // [v60.1] AUTO-START: Asegurar que los segmentos de texto existan
        if (!_voskTextSegments[targetId]) _voskTextSegments[targetId] = [];

        // If pending buffer reached threshold, feed it to recognizer
        if (_voskPendingBuffers[targetId].length >= VOSK_ACCEPT_THRESHOLD_BYTES) {
          const feedBuf = _voskPendingBuffers[targetId];
          _voskPendingBuffers[targetId] = Buffer.alloc(0);

          // Log solo el primer bloque de cada sesión para evitar spam
          if (targetId !== 'root' && _voskChunkBuffers[targetId].length <= (VOSK_ACCEPT_THRESHOLD_BYTES / 8000 + 1)) {
            console.log(`📦 [VOSK-SERVER] Alimentando Vosk con ${feedBuf.length} bytes for ${targetId}`);
          }

          const hasResult = recognizer.acceptWaveform(feedBuf);

          if (hasResult) {
            const raw = recognizer.result();


            const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (result && result.text) {
              const user = users.get(socket.id);
              let lang = user ? user.lang : 'es';

              // [v60] Resolución de idioma quirúrgica para sub-usuarios
              if (targetId !== 'root') {
                const su = subUsers.get(targetId);
                if (su && su.lang) lang = su.lang;
              }

              const corrected = applyDictionaryCorrection(result.text, lang);

              // [v60.1] ACUMULAR SEGMENTO: Importante para sub-usuarios ya que finalResult() NO incluye result() previos.
              // [v60.ITN-Anti-Murphy] Guardamos en _voskTextSegments el texto en palabras (sin convertir aún a dígitos)
              // para que si un número compuesto se parte entre dos pausas ("cuarenta" ... "y dos") se fusione limpio en vosk-end.
              if (!_voskTextSegments[targetId]) _voskTextSegments[targetId] = [];
              _voskTextSegments[targetId].push(corrected);

              const previewCorrected = (user && user.aiSettings && user.aiSettings.convertNumbers)
                ? textNumberNormalizer.normalizeSpokenNumbers(corrected, lang)
                : corrected;

              socket.emit('vosk-partial', {
                text: previewCorrected,
                isFinal: true,
                subUserId: targetId === 'root' ? null : targetId
              });

              // [v60] Remoción de AUTO-SEND: Los sub-usuarios ahora dependen 100% de vosk-end
              // para garantizar mensajes únicos e íntegros (Evitar burbujas partidas).
            }
          } else {
            const raw = recognizer.partialResult();
            const partial = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (partial && partial.partial) {
              const user = users.get(socket.id);
              let lang = user ? user.lang : 'es';

              if (targetId !== 'root') {
                const su = subUsers.get(targetId);
                if (su && su.lang) lang = su.lang;
              }

              const corrected = applyDictionaryCorrection(partial.partial, lang);
              const previewPartial = (user && user.aiSettings && user.aiSettings.convertNumbers)
                ? textNumberNormalizer.normalizeSpokenNumbers(corrected, lang)
                : corrected;
              socket.emit('vosk-partial', {
                text: previewPartial,
                isFinal: false,
                subUserId: targetId === 'root' ? null : targetId
              });
            }
          }
        }
      } catch (e) {
        console.error('❌ Error procesando chunk de Vosk:', e.message);
      }
    });

    socket.on('vosk-end', (dataArg) => {
      const data = dataArg || {};
      const endSubUserId = data.subUserId || 'root';
      const fallbackText = data.fallbackText || '';

      const recognizerToClose = activeRecognizers.get(endSubUserId);
      if (!recognizerToClose) return;

      // Si es un cleanup silencioso (reinicio rápido), procesar inmediatamente sin delay
      if (data.silent) {
        console.log(`ℹ️ [VOSK] Cleanup silencioso para ${endSubUserId}`);
        try { recognizerToClose.free(); } catch (e) { }
        if (activeRecognizers.get(endSubUserId) === recognizerToClose) {
          activeRecognizers.delete(endSubUserId);
        }

        _voskChunkBuffers[endSubUserId] = [];
        _voskPendingBuffers[endSubUserId] = Buffer.alloc(0);
        _voskTextSegments[endSubUserId] = [];
        return;
      }

      // Retrasar el cierre 50ms para permitir que los últimos fragmentos (flush) se procesen
      setTimeout(() => {
        // [v60.1-BABEL] Misión B: Carril Euskera (Whisper)
        const user = users.get(socket.id);
        let lang = user ? user.lang : 'es';
        if (endSubUserId !== 'root') {
          const su = subUsers.get(endSubUserId);
          if (su && su.lang) lang = su.lang;
        }

        if ((lang === 'eu' || lang === 'gl') && aiWorkerReady) {
          const whisperTaskId = `whisper-${Date.now()}-${endSubUserId}`;
          const audioBuffer = Buffer.concat(_voskChunkBuffers[endSubUserId] || []);

          // [v60.ANTI-MURPHY] Filtro Anti-Ruido Ajustado: Reducido a 0.125s (4000 bytes)
          // para capturar monosílabos y respuestas breves ("Bai", "Ez", "Zer", "Sí", "Non")
          if (audioBuffer.length < 4000) {
            console.log(`ℹ️ [BABEL] Audio de ${lang === 'eu' ? 'Euskera' : 'Gallego'} extremadamente corto (${audioBuffer.length} bytes). Ignorando.`);
            // Limpieza y aborto silencioso
            _voskChunkBuffers[endSubUserId] = [];
            _voskPendingBuffers[endSubUserId] = Buffer.alloc(0);
            _voskTextSegments[endSubUserId] = [];
            return;
          }

          console.log(`🧠 [BABEL] Despachando audio para transcripción ${lang === 'eu' ? 'Euskera' : 'Gallego'} (Whisper): ${endSubUserId} [${whisperTaskId}]`);

          // Murphy Shield: Invalidar inmediatamente la sesión de streaming parcial para este usuario
          const targetKey = `${socket.id}_${endSubUserId}`;
          _whisperSessionMap.set(targetKey, 0);
          _whisperTaskInFlight.set(targetKey, false);

          // Activar Humo de Carga para Whisper
          users.forEach(u => {
            if (u.aiSettings?.autoTranslate) {
              io.to(u.id).emit('translation-started', { _msgId: whisperTaskId });
            }
          });

          aiWorker.postMessage({
            type: 'transcribe-euskera',
            taskId: whisperTaskId,
            audio: audioBuffer,
            lang: lang,
            isPartial: false,
            subUserId: endSubUserId === 'root' ? null : endSubUserId,
            socketId: socket.id
          });

          // Limpieza inmediata: liberar Vosk y resetear buffers
          try { if (recognizerToClose) recognizerToClose.free(); } catch (e) { }
          if (activeRecognizers.get(endSubUserId) === recognizerToClose) {
            activeRecognizers.delete(endSubUserId);
          }
          _voskChunkBuffers[endSubUserId] = [];
          _voskPendingBuffers[endSubUserId] = Buffer.alloc(0);
          _voskTextSegments[endSubUserId] = [];
          return;
        }

        // [v60.1] Verificación de Idempotencia: Si el reconocedor ya no es el mismo, abortar (reinicio rápido detectado)
        if (!recognizerToClose || activeRecognizers.get(endSubUserId) !== recognizerToClose) {
          return;
        }

        const recognizer = recognizerToClose;

        try {
          const raw = recognizer.finalResult();
          const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
          let text = (result && result.text) || fallbackText;

          // [v60.ANTI-DUPLICATE] UNIFICAR SEGMENTOS CON DETECCIÓN DE SOLAPAMIENTO DE VENTANA:
          // Si finalResult() repite la ventana fonética ya confirmada, no volver a concatenar.
          const previousText = (_voskTextSegments[endSubUserId] || []).join(' ').trim();
          const rawFinalChunk = (result && result.text) ? result.text.trim() : '';
          const finalChunk = rawFinalChunk ? applyDictionaryCorrection(rawFinalChunk, lang) : '';

          if (previousText && finalChunk) {
            const pLower = previousText.toLowerCase();
            const fLower = finalChunk.toLowerCase();
            if (pLower === fLower || pLower.endsWith(fLower)) {
              text = previousText;
            } else if (fLower.startsWith(pLower)) {
              text = finalChunk;
            } else {
              text = previousText + ' ' + finalChunk;
            }
          } else {
            text = previousText || finalChunk || fallbackText;
          }

          // Reconstruct audio if we have buffers
          try {
            const bufKey = endSubUserId;
            let audioBuf = null;
            if (_voskChunkBuffers && _voskChunkBuffers[bufKey] && _voskChunkBuffers[bufKey].length > 0) {
              try { audioBuf = Buffer.concat(_voskChunkBuffers[bufKey]); } catch (e) { audioBuf = null; }
            }

            const resultSubUserId = endSubUserId === 'root' ? null : endSubUserId;
            if ((text && text.trim()) || audioBuf) {
              if (text && text.trim()) {
                console.log(`✅ [VOSK-RESULT] Transcripción confirmada para ${endSubUserId}: "${text}"`);
              } else {
                console.log(`ℹ️ [VOSK] Emitiendo resultado con audio pero sin texto para ${endSubUserId}`);
                text = ''; // Asegurar que es string vacío si no hay texto
              }

              socket.emit('transcription-result', {
                text,
                subUserId: resultSubUserId,
                audioData: audioBuf,
                mimeType: 'audio/pcm;rate=16000'
              });
            } else {
              console.log(`ℹ️ [VOSK] Omitiendo resultado vacío (sin texto ni audio) para ${endSubUserId}`);
            }

            // Limpiar buffers tras el envío final
            _voskChunkBuffers[endSubUserId] = [];
            _voskPendingBuffers[endSubUserId] = Buffer.alloc(0);

            console.log(`🎤 Transcripción Final (${endSubUserId}):`, text || '(vacío)');
          } catch (e) {
            socket.emit('transcription-result', {
              text,
              subUserId: endSubUserId === 'root' ? null : endSubUserId
            });
          }
        } catch (e) {
          console.error('Error finalizando:', e.message);
          socket.emit('transcription-result', {
            text: fallbackText,
            subUserId: endSubUserId === 'root' ? null : endSubUserId
          });
        }

        // Cleanup específico para este ID
        try { recognizer.free(); } catch (e) { }
        if (activeRecognizers.get(endSubUserId) === recognizer) {
          activeRecognizers.delete(endSubUserId);
        }
        if (_voskChunkBuffers[endSubUserId]) delete _voskChunkBuffers[endSubUserId];
        if (_voskPendingBuffers[endSubUserId]) delete _voskPendingBuffers[endSubUserId];
        if (_voskTextSegments[endSubUserId]) delete _voskTextSegments[endSubUserId];
      }, 50);
    });

    // Enviar mensaje (con audio opcional)
    socket.on('send-message', (data) => {
      const isVoice = !!(data.isVoice || data.streamId || data.audioData || data.subUserId);
      if (global.sessionStats) {
        global.sessionStats.msg_count++;
        // Diferenciar mensaje de texto escrito vs voz reconocida
        if (isVoice) {
          global.sessionStats.audio_msg_count = (global.sessionStats.audio_msg_count || 0) + 1;
        } else {
          global.sessionStats.text_msg_count = (global.sessionStats.text_msg_count || 0) + 1;
        }
      }
      const user = users.get(socket.id);
      if (!user) {
        console.warn('⚠️ send-message: User not found for socket ID', socket.id);
        return;
      }
      console.debug(`🟢 Received send-message: user=${user.username}, text=${data.text}, category=${data.category}`);
      // [v46.4.63] Impedir mensajes de IPs expulsadas si se mantuvieron conectadas
      if (kickedIps.has(socket.handshake.address)) return;

      // Incrementar contador de actividad
      user.msgCount = (user.msgCount || 0) + 1;
      if (data.imageData) {
        user.photoCount = (user.photoCount || 0) + 1;
        if (global.sessionStats) global.sessionStats.photos_taken++;
      }

      const text = (data.text || '').trim();
      // [v60.1] FILTRO ANTI-GHOST: Si es un sub-usuario y no hay texto, ignorar el mensaje.
      // Esto evita burbujas vacías por ruido o VAD ultrasensible.
      if (data.subUserId && !text) return;

      let msgCategory = data.category || 'General';

      // [v59.33] Resolución de ID a Nombre Oficial para mensajes
      const official = categoriesData.categories.find(c => c.id === msgCategory || c.name === msgCategory);
      if (official) msgCategory = official.name;

      // Límite de seguridad: previene mensajes excesivamente largos (protección básica DoS)
      const MAX_TEXT_LENGTH = 2000;
      let processedText = text;
      if (processedText.length > MAX_TEXT_LENGTH) processedText = processedText.substring(0, MAX_TEXT_LENGTH);

      // APLICAR CORRECCIÓN UNIVERSAL (Vosk + Local + Manual)
      if (processedText) {
        const originalText = processedText;
        let lang = (data && data.lang) || (user ? user.lang : 'es');
        if (data && data.subUserId && data.subUserId !== 'root') {
          const su = subUsers.get(data.subUserId);
          if (su && su.lang) lang = su.lang;
        }

        // 1. Diccionario Personalizado del Usuario (Máxima Prioridad)
        processedText = applyDictionaryCorrection(processedText, lang);

        // 2. [v60.SAFETY-NET] Eliminar repetición consecutiva accidental de frases completas (>= 3 palabras)
        processedText = removeConsecutivePhraseDuplicates(processedText);

        // 3. [v60.ITN] Normalización Numérica Multilingüe (Solo si es mensaje de voz y el usuario tiene activo el toggle)
        const shouldConvertNumbers = (data && typeof data.convertNumbers === 'boolean')
          ? data.convertNumbers
          : Boolean(user && user.aiSettings && user.aiSettings.convertNumbers);
        if (isVoice && shouldConvertNumbers) {
          processedText = textNumberNormalizer.normalizeSpokenNumbers(processedText, lang);
        }

        // 4. Aplicar reglas de puntuación básica automáticamente solo si es mensaje de voz (no escrito manualmente)
        if (isVoice) {
          processedText = addIntelligentPunctuation(processedText, lang);
        }

        if (originalText !== processedText) {
          console.log(`✨ Procesado Mensaje: "${originalText}" -> "${processedText}"`);
        }
      }

      const msgId = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

      const messageData = {
        _msgId: msgId,
        user: user.username,
        text: processedText,
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now(),
        audioData: null,
        audioUrl: null,
        mimeType: data.mimeType || null,
        category: msgCategory,
        streamId: data.streamId || null,
        imageUrl: null
      };

      // If this message originates from a sub-user, override user and attach metadata
      if (data && data.subUserId) {
        const su = subUsers.get(data.subUserId);
        if (su && su.rootUserId === socket.id) {
          messageData.user = su.name || (`SubUser-${data.subUserId}`);
          messageData.subUserId = data.subUserId;
          messageData.rootUser = user.username;
          messageData.rootCategory = (user.categories && user.categories.length > 0) ? user.categories[0] : 'General';

          // [v60.FIX] Usar la categoría propia del subusuario para el color de la caja y filtrado
          if (su.category) {
            messageData.category = su.category;
          }

          console.debug(`💬 send-message as subUser=${data.subUserId} root=${user.username} (RootCat: ${messageData.rootCategory}, SubCat: ${messageData.category}) textLen=${(messageData.text || '').length}`);
        }
      }

      // Si hay imagen, guardarla con buffer rotativo de 20
      if (data.imageData) {
        try {
          const base64Data = data.imageData.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `${msgId}.jpg`;
          const filePath = path.join(IMAGES_DIR, fileName);

          // ✅ PROFESIONAL: Validaciones antes de write
          if (!fs.existsSync(IMAGES_DIR)) {
            fs.mkdirSync(IMAGES_DIR, { recursive: true });
          }

          // ✅ PROFESIONAL: Verificar permisos de escritura
          try {
            fs.accessSync(IMAGES_DIR, fs.constants.W_OK);
          } catch (e) {
            console.error(`❌ Sin permisos de escritura en IMAGES_DIR: ${IMAGES_DIR}`);
            messageData.imageUrl = 'error-file-write';
            throw new Error(`Sin permisos de escritura en ${IMAGES_DIR}`);
          }

          fs.writeFileSync(filePath, buffer);
          messageData.imageUrl = `/send-images/${fileName}`;

          // ✅ PROFESIONAL: Enforce MAX_IMAGES ANTES de agregar nueva
          // Primero remover la más antigua si ya estamos en límite
          if (imagesHistory.length >= MAX_IMAGES) {
            const oldest = imagesHistory.shift();
            const oldFilePath = path.join(IMAGES_DIR, oldest.fileName);
            if (fs.existsSync(oldFilePath)) {
              try {
                fs.unlinkSync(oldFilePath);
                console.log(`🗑️ Borrada imagen LRU: ${oldest.fileName}`);
              } catch (e) {
                console.warn(`⚠️ No se pudo borrar imagen LRU: ${oldest.fileName}`, e.message);
              }
            }
            // Remover de messageHistory también
            messageHistory = messageHistory.filter(msg => msg.imageUrl !== `/send-images/${oldest.fileName}`);
          }

          // Ahora agregar la nueva (array siempre <= MAX_IMAGES)
          imagesHistory.push({ id: msgId, fileName });

          enforceCacheLimit();
          console.log(`📸 Imagen guardada: ${fileName} (imagesHistory: ${imagesHistory.length}/${MAX_IMAGES})`);
        } catch (e) {
          console.error('❌ Error guardando imagen:', e.message);
          messageData.imageUrl = 'error-image-save';
        }
      }

      // Si hay audio, guardarlo en el servidor
      if (data.audioData) {
        try {
          let extension = 'webm';
          if (data.mimeType) {
            if (data.mimeType.includes('mp4')) extension = 'mp4';
            else if (data.mimeType.includes('wav')) extension = 'wav';
            else if (data.mimeType.includes('pcm')) extension = 'wav';
          }
          const fileName = `${msgId}.${extension}`;
          const filePath = path.join(RECORDINGS_DIR, fileName);

          // ✅ PROFESIONAL: Validar directorio antes de escribir
          if (!fs.existsSync(RECORDINGS_DIR)) {
            fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
          }

          // ✅ PROFESIONAL: Verificar permisos de escritura
          try {
            fs.accessSync(RECORDINGS_DIR, fs.constants.W_OK);
          } catch (e) {
            console.error(`❌ Sin permisos de escritura en RECORDINGS_DIR: ${RECORDINGS_DIR}`);
            messageData.audioUrl = 'error-file-write';
            throw new Error(`Sin permisos de escritura en ${RECORDINGS_DIR}`);
          }

          let buffer;
          if (data.audioData instanceof Buffer) {
            buffer = data.audioData;
          } else if (data.audioData instanceof ArrayBuffer) {
            buffer = Buffer.from(data.audioData);
          } else if (data.audioData.type === 'Buffer' && Array.isArray(data.audioData.data)) {
            buffer = Buffer.from(data.audioData.data);
          } else {
            buffer = Buffer.from(data.audioData);
          }

          // ✅ PROFESIONAL: Validar que el buffer tenga datos
          if (!buffer || buffer.length === 0) {
            throw new Error('Buffer de audio vacío');
          }

          fs.writeFileSync(filePath, buffer);
          messageData.audioUrl = `/recordings/${fileName}`;
          enforceCacheLimit();
          console.log(`💾 Audio guardado: ${fileName} (${buffer.length} bytes)`);
        } catch (e) {
          console.error('❌ Error guardando archivo de audio:', e.message);
          messageData.audioUrl = 'error-audio-save';
        }
      }

      // Añadir al historial
      messageHistory.push({ ...messageData });
      saveMessageHistory();

      // ✅ PROFESIONAL: Enforce MAX_HISTORY en mensajes
      if (messageHistory.length > MAX_HISTORY) {
        const oldest = messageHistory.shift();

        // Borrar archivo físico de audio si existe
        if (oldest.audioUrl && !oldest.audioUrl.startsWith('error-')) {
          const fileName = oldest.audioUrl.split('/').pop();
          const filePath = path.join(RECORDINGS_DIR, fileName);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
              console.log(`🗑️ Audio LRU deletado: ${fileName}`);
            } catch (e) {
              console.warn(`⚠️ No se pudo borrar audio LRU: ${fileName}`, e.message);
            }
          }
        }
      }
      enforceCacheLimit();

      // ✅ PROFESIONAL: Función dedicada de validación de imágenes
      validateAndMarkUnavailableImages();

      // [v60.1-BABEL] Ruteo de Inteligencia: ¿Alguien necesita traducción?
      // [v60.2] SOPORTE SUB-USUARIOS Y AUDIO REAL: Detectar el idioma real del emisor (ej: Euskera en Carril Whisper)
      // [v60.Murphy-Defense] Priorizar data.lang (idioma transcrito/declarado en el mensaje) sobre la preferencia estática user.lang
      let sourceLang = data.lang || user.lang || 'es';
      if (data.subUserId && data.subUserId !== 'root') {
        const su = subUsers.get(data.subUserId);
        if (su && su.lang) sourceLang = su.lang;
      }
      messageData.lang = sourceLang;

      const textToTranslate = (processedText || text || '').trim();
      if (aiWorkerReady && textToTranslate.length > 0) {
        const targetLangs = new Set();

        // Filtro de Inteligencia Selectiva: Solo traducir si hay alguien que no entienda el idioma original y tenga auto-translate
        users.forEach(u => {
          console.log(`   - Usuario: ${u.username} | Lang: ${u.lang} | Auto: ${u.aiSettings?.autoTranslate || false}`);
          if (u.lang && u.lang !== sourceLang && u.aiSettings?.autoTranslate) {
            targetLangs.add(u.lang);
          }
        });

        console.log(`🔍 [BABEL-ROUTER] "${textToTranslate.substring(0, 15)}..." de ${user.username} (${sourceLang}). Destinos detectados: ${targetLangs.size}`);

        if (targetLangs.size > 0) {
          console.log(`🌍 [BABEL] Despachando traducción [${sourceLang} -> ${[...targetLangs].join(',')}] para: ${messageData._msgId}`);

          // Activar Humo de Carga solo para los destinatarios reales
          users.forEach(u => {
            if (u.id !== socket.id && u.lang !== sourceLang && u.aiSettings?.autoTranslate) {
              io.to(u.id).emit('translation-started', { _msgId: messageData._msgId });
            }
          });

          targetLangs.forEach(targetLang => {
            // [v60.Elite] PIVOTE DE SOBERANÍA: Usar protección del RECEPTOR (basada en su idioma de destino)
            // Si el caché no tiene el idioma, intentamos cargarlo en caliente
            const protectedWords = babelProtectedCaches[targetLang] || loadBabelProtected(targetLang);

            aiWorker.postMessage({
              type: 'translate',
              taskId: messageData._msgId,
              text: processedText || text,
              sourceLang: sourceLang,
              targetLang: targetLang,
              protectedWords: protectedWords,
              sentAt: Date.now(),
              socketId: socket.id
            });
          });
        }
      }

      // Enviar a TODOS (incluyendo emisor con la URL persistente)
      io.emit('receive-message', messageData);

      // [v60.Elite] Ejecución de Triggers OUT desde el Servidor (Industrial Mode)
      // Optimizamos eliminando ráfagas de red desde los clientes Wi-Fi
      const targets = getActiveUsersForTriggers();
      triggerManager.processMessageTriggers(messageData, targets);


      console.log(`💬 ${user.username}: ${text} ${messageData.audioUrl && !messageData.audioUrl.startsWith('error-') ? '[Audio]' : ''} ${messageData.imageUrl && !messageData.imageUrl.startsWith('error-') ? '[Imagen]' : ''}`);
    });

    socket.on('start-speaking', (data) => {
      const user = users.get(socket.id);
      if (user) {
        let speakingName = user.username;
        let speakingCategory = (data && data.category) || 'General';

        // [v60] Soporte para metadatos de sub-usuario en broadcast
        if (data && data.subUserId) {
          const su = subUsers.get(data.subUserId);
          if (su) {
            speakingName = su.name || speakingName;
            speakingCategory = su.category || speakingCategory;
          }
        }

        socket.broadcast.emit('user-speaking', {
          user: speakingName,
          speaking: true,
          timestamp: Date.now(),
          category: speakingCategory,
          subUserId: (data && data.subUserId) || null
        });
      }
    });

    socket.on('stop-speaking', (data) => {
      const user = users.get(socket.id);
      if (user) {
        socket.broadcast.emit('user-speaking', {
          user: user.username,
          speaking: false,
          timestamp: Date.now(),
          category: (data && data.category) || 'General'
        });
      }
    });

    // === CATEGORY CRUD EVENTS (only master) ===
    socket.on('claim-master', () => {
      const hasCurrentMaster = categoriesData.masterId && users.has(categoriesData.masterId);
      if (!hasCurrentMaster) {
        categoriesData.masterId = socket.id;
        const user = users.get(socket.id);
        if (user) categoriesData.masterUsername = user.username;
        socket.emit('master-granted', { masterId: socket.id });
        io.emit('master-changed', { masterId: socket.id });
        console.log(`👑 Master reclamado por: ${socket.id}`);
      }
    });

    socket.on('add-category', (data, callback) => {
      const user = users.get(socket.id);
      const authUsername = (data && data.authUsername) || (user && user.username) || '';
      const authPin = (data && data.authPin) || '';
      const EXPECTED_PIN = categoriesData.roomPin || process.env.ROOM_PIN;

      const isAttemptingMasterRecovery = categoriesData.masterUsername &&
        categoriesData.masterUsername.toLowerCase() === authUsername.trim().toLowerCase();
      const isPinValid = !EXPECTED_PIN || EXPECTED_PIN.trim() === '' || (authPin === EXPECTED_PIN);

      const isAuthorized = (categoriesData.masterId === socket.id) ||
        (user && user.username === categoriesData.masterUsername) ||
        (isAttemptingMasterRecovery && isPinValid);

      if (!isAuthorized) {
        if (callback) callback({ success: false, error: 'No tienes permisos de Master' });
        return;
      }
      if (categoriesData.categories.length >= MAX_CATEGORIES) {
        if (callback) callback({ success: false, error: `Límite de ${MAX_CATEGORIES} categorías alcanzado` });
        return;
      }
      const name = (data.name || '').trim();
      if (!name) {
        if (callback) callback({ success: false, error: 'El nombre no puede estar vacío' });
        return;
      }
      // Validar nombre único (case insensitive)
      const exists = categoriesData.categories.some(c => c.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        if (callback) callback({ success: false, error: `Ya existe una categoría con el nombre "${name}"` });
        return;
      }
      const newCat = {
        id: generateCategoryId(),
        name: name,
        color: data.color || '#FF9800'
      };
      categoriesData.categories.push(newCat);
      const saved = saveCategories();
      if (!saved) {
        if (callback) callback({ success: false, error: 'Error crítico: No se pudo guardar en disco' });
        return;
      }

      io.emit('categories-updated', { categories: categoriesData.categories });
      if (callback) callback({ success: true, category: newCat });
      console.log(`➕ Categoría añadida: ${name}`);
    });

    socket.on('edit-category', (data, callback) => {
      const user = users.get(socket.id);
      const authUsername = (data && data.authUsername) || (user && user.username) || '';
      const authPin = (data && data.authPin) || '';
      const EXPECTED_PIN = categoriesData.roomPin || process.env.ROOM_PIN;

      const isAttemptingMasterRecovery = categoriesData.masterUsername &&
        categoriesData.masterUsername.toLowerCase() === authUsername.trim().toLowerCase();
      const isPinValid = !EXPECTED_PIN || EXPECTED_PIN.trim() === '' || (authPin === EXPECTED_PIN);

      const isAuthorized = (categoriesData.masterId === socket.id) ||
        (user && user.username === categoriesData.masterUsername) ||
        (isAttemptingMasterRecovery && isPinValid);

      if (!isAuthorized) {
        if (callback) callback({ success: false, error: 'No tienes permisos de Master' });
        return;
      }
      const idx = categoriesData.categories.findIndex(c => c.id === data.id);
      if (idx === -1) {
        if (callback) callback({ success: false, error: 'Categoría no encontrada' });
        return;
      }
      const newName = (data.name || '').trim();
      if (!newName) {
        if (callback) callback({ success: false, error: 'El nombre no puede estar vacío' });
        return;
      }
      // Validar nombre único (excluyendo la propia categoría)
      const duplicate = categoriesData.categories.some((c, i) => i !== idx && c.name.toLowerCase() === newName.toLowerCase());
      if (duplicate) {
        if (callback) callback({ success: false, error: `Ya existe una categoría con el nombre "${newName}"` });
        return;
      }
      const oldName = categoriesData.categories[idx].name;
      const oldColor = categoriesData.categories[idx].color;

      categoriesData.categories[idx].name = newName;
      if (data.color) categoriesData.categories[idx].color = data.color;
      const newColor = categoriesData.categories[idx].color;

      const saved = saveCategories();
      if (!saved) {
        if (callback) callback({ success: false, error: 'Error crítico: No se pudo guardar en disco' });
        return;
      }

      // ACTUALIZACIÓN AUTOMÁTICA DE USUARIOS CONECTADOS (v59.30)
      // Normalización: Buscar por nombre (case-insensitive) o por ID para evitar "huérfanos"
      const categoryId = data.id;
      for (const [uid, u] of users.entries()) {
        if (!u.categories || !Array.isArray(u.categories)) continue;

        u.categories = u.categories.map(uCat => {
          const isMatchById = (typeof uCat === 'object' && uCat !== null && uCat.id === categoryId);
          const uCatName = (typeof uCat === 'object' && uCat !== null) ? (uCat.name || uCat.id) : uCat;
          const isMatchByName = (uCatName && typeof uCatName === 'string' && uCatName.toLowerCase() === oldName.toLowerCase());

          if (isMatchById || isMatchByName) {
            if (typeof uCat === 'object' && uCat !== null) {
              return { ...uCat, name: newName };
            }
            return newName;
          }
          return uCat;
        });
      }

      // [v59.40] Sincronizar el Manifiesto de Sesiones con el nuevo nombre/id si coincide
      for (const [token, catId] of userSessionManifest.entries()) {
        if (catId === categoryId || catId === oldName) {
          userSessionManifest.set(token, categoryId);
        }
      }


      // 1. Notificar a todos del cambio de configuración de categorías
      io.emit('categories-updated', {
        categories: categoriesData.categories,
        renamedFrom: oldName,
        renamedTo: newName,
        colorChanged: oldColor !== newColor
      });

      // 2. Notificar cambio en el mapa de usuarios (Filtros y Lista Lateral)
      const allUsersData = Array.from(users.values());
      io.emit('update-filters', allUsersData);
      io.emit('update-users', allUsersData);

      if (callback) callback({ success: true });
      console.log(`✏️ Categoría editada: ${oldName} (${oldColor}) -> ${newName} (${newColor})`);
    });

    socket.on('delete-category', (data, callback) => {
      // [v59.40] Limpiar manifiesto si se borra una categoría
      for (const [token, catId] of userSessionManifest.entries()) {
        if (catId === data.id) userSessionManifest.delete(token);
      }
      const user = users.get(socket.id);
      const authUsername = (data && data.authUsername) || (user && user.username) || '';
      const authPin = (data && data.authPin) || '';
      const EXPECTED_PIN = categoriesData.roomPin || process.env.ROOM_PIN;

      const isAttemptingMasterRecovery = categoriesData.masterUsername &&
        categoriesData.masterUsername.toLowerCase() === authUsername.trim().toLowerCase();
      const isPinValid = !EXPECTED_PIN || EXPECTED_PIN.trim() === '' || (authPin === EXPECTED_PIN);

      const isAuthorized = (categoriesData.masterId === socket.id) ||
        (user && user.username === categoriesData.masterUsername) ||
        (isAttemptingMasterRecovery && isPinValid);

      if (!isAuthorized) {
        if (callback) callback({ success: false, error: 'No tienes permisos de Master' });
        return;
      }
      if (categoriesData.categories.length <= 1) {
        if (callback) callback({ success: false, error: 'Debe haber al menos 1 categoría' });
        return;
      }
      const idx = categoriesData.categories.findIndex(c => c.id === data.id);
      if (idx === -1) {
        if (callback) callback({ success: false, error: 'Categoría no encontrada' });
        return;
      }
      const catName = categoriesData.categories[idx].name;
      const categoryId = data.id;
      // [v59.30] Normalización: Comprobar si hay usuarios usando el ID o el nombre (case-insensitive)
      const usersInCat = Array.from(users.values()).filter(u => {
        if (!u.categories || !Array.isArray(u.categories)) return false;
        return u.categories.some(uCat => {
          const isMatchById = (typeof uCat === 'object' && uCat !== null && uCat.id === categoryId);
          const uCatName = (typeof uCat === 'object' && uCat !== null) ? (uCat.name || uCat.id) : uCat;
          return isMatchById || (uCatName && typeof uCatName === 'string' && uCatName.toLowerCase() === catName.toLowerCase());
        });
      });

      if (usersInCat.length > 0) {
        const usernames = usersInCat.map(u => u.username).join(', ');
        if (callback) callback({
          success: false,
          error: `CATEGORÍA EN USO: No se puede eliminar "${catName}" porque los siguientes usuarios están dentro: ${usernames}. Pídeles que cambien de departamento primero.`
        });
        return;
      }
      categoriesData.categories.splice(idx, 1);
      saveCategories();
      io.emit('categories-updated', { categories: categoriesData.categories });
      if (callback) callback({ success: true });
      console.log(`🗑️ Categoría eliminada: ${catName}`);
    });

    socket.on('update-room-pin', (data, callback) => {
      if (categoriesData.masterId !== socket.id) {
        if (callback) callback({ success: false, error: 'No eres el master' });
        return;
      }
      categoriesData.roomPin = data.pin || null;
      saveCategories();

      // NOTIFICACIÓN DE SEGURIDAD: Sincronización proactiva de PIN (v46.4.56)
      // 1. Notificación visual (Toast) para todos
      io.emit('room-pin-updated', { hasRoomPin: !!categoriesData.roomPin });

      // 2. Forzar re-validación (Modal) para todos menos el Master
      socket.broadcast.emit('room-pin-reset', { hasRoomPin: !!categoriesData.roomPin });

      if (callback) callback({ success: true, hasRoomPin: !!categoriesData.roomPin });
      console.log(`🔒 PIN de sala modificado por Master. Sincronización proactiva enviada.`);
    });

    socket.on('verify-pin', (data, callback) => {
      const EXPECTED_PIN = categoriesData.roomPin || process.env.ROOM_PIN;
      const receivedPin = data.pin || '';

      if (!EXPECTED_PIN || receivedPin === EXPECTED_PIN) {
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false, error: 'PIN incorrecto' });
      }
    });

    // RECUperación Ligera de Historial (v46.4.56)
    socket.on('get-message-history', () => {
      if (messageHistory.length > 0) {
        socket.emit('message-history', messageHistory);
      }
    });



    socket.on('save-trigger', (data, callback) => {
      const trigger = data && data.trigger;
      if (!trigger || !trigger.id || !trigger.name || !trigger.type) {
        if (callback) callback({ success: false, error: 'Datos incompletos' });
        return;
      }

      if (trigger.direction === 'IN') {
        const ext = trigger.external || {};
        if (trigger.type === 'osc') {
          const osc = ext.osc || {};
          if (!isValidHost(osc.host)) {
            if (callback) callback({ success: false, error: 'IP o Host OSC de entrada inválido.' });
            return;
          }
          const port = parseInt(osc.port);
          if (isNaN(port) || port < 1 || port > 65535) {
            if (callback) callback({ success: false, error: 'Puerto OSC de entrada inválido.' });
            return;
          }
        } else if (trigger.type === 'sacn') {
          const sacn = ext.sacn || {};
          if (sacn.mode === 'unicast' && !isValidHost(sacn.ip)) {
            if (callback) callback({ success: false, error: 'IP de Destino sACN de entrada inválida.' });
            return;
          }
          const universe = parseInt(sacn.universe);
          if (isNaN(universe) || universe < 1 || universe > 63999) {
            if (callback) callback({ success: false, error: 'Universo sACN de entrada inválido (1-63999).' });
            return;
          }
          const priority = parseInt(sacn.priority);
          if (isNaN(priority) || priority < 0 || priority > 200) {
            if (callback) callback({ success: false, error: 'Prioridad sACN de entrada inválida (0-200).' });
            return;
          }
        }
      } else {
        if (trigger.type === 'osc') {
          const osc = trigger.osc || {};
          if (!isValidHost(osc.host)) {
            if (callback) callback({ success: false, error: 'IP o Host OSC inválido.' });
            return;
          }
          const port = parseInt(osc.port);
          if (isNaN(port) || port < 1 || port > 65535) {
            if (callback) callback({ success: false, error: 'Puerto OSC inválido.' });
            return;
          }
        } else if (trigger.type === 'sacn') {
          const sacn = trigger.sacn || {};
          if (sacn.mode === 'unicast' && !isValidHost(sacn.destinationIp)) {
            if (callback) callback({ success: false, error: 'IP de Destino sACN inválida para modo Unicast.' });
            return;
          }
          const universe = parseInt(sacn.universe);
          if (isNaN(universe) || universe < 1 || universe > 63999) {
            if (callback) callback({ success: false, error: 'Universo sACN inválido (1-63999).' });
            return;
          }
          const priority = parseInt(sacn.priority);
          if (isNaN(priority) || priority < 0 || priority > 200) {
            if (callback) callback({ success: false, error: 'Prioridad sACN inválida (0-200).' });
            return;
          }
        }
      }

      let serverTrigger;
      if (trigger.direction === 'IN') {
        // [v60.Elite] Los Triggers IN son GLOBALES. Preservamos su estado 'enabled' 
        // en el servidor porque es el TriggerManager quien los ejecuta.
        serverTrigger = { ...trigger };
        // Sincronizamos defaultEnabled para persistencia en disco
        serverTrigger.defaultEnabled = trigger.enabled !== false;
      } else {
        // [v60.Elite] Los Triggers OUT son SOBERANOS/LOCALES. 
        // No guardamos su estado 'enabled' en el servidor para evitar conflictos entre usuarios.
        const { enabled: _e, ...rest } = trigger;
        serverTrigger = rest;
      }

      const idx = triggersCache.findIndex(t => t.id === serverTrigger.id);
      if (idx !== -1) {
        triggersCache[idx] = serverTrigger;
      } else {
        triggersCache.push(serverTrigger);
      }
      triggerFileSync.saveSingleTrigger(serverTrigger);
      saveTriggersFile();
      io.emit('triggers-data', triggersCache); // Broadcast a TODOS los clientes
      triggerManager.updateTriggers(triggersCache); // Notificar al motor de cambios IN
      if (callback) callback({ success: true });
      console.log(`⚡ Trigger ${idx !== -1 ? 'editado' : 'añadido'}: ${serverTrigger.name}`);
    });

    socket.on('delete-trigger', (data, callback) => {
      const { id } = data || {};
      if (!id) { if (callback) callback({ success: false }); return; }
      const idx = triggersCache.findIndex(t => t.id === id);
      if (idx === -1) { if (callback) callback({ success: false, error: 'No encontrado' }); return; }

      const trigger = triggersCache[idx];
      const name = trigger.name;

      // [v60] Limpiar archivos físicos antes de borrar la entrada
      if (trigger.message?.audio) {
        const p = triggerFileSync.resolveMediaPhysicalPath(trigger.message.audio) || path.join(__dirname, 'public', trigger.message.audio);
        if (fs.existsSync(p)) {
          try { fs.unlinkSync(p); console.log(`🗑️ Archivo audio eliminado: ${p}`); } catch (e) { }
        }
      }
      if (trigger.message?.image) {
        const p = triggerFileSync.resolveMediaPhysicalPath(trigger.message.image) || path.join(__dirname, 'public', trigger.message.image);
        if (fs.existsSync(p)) {
          try { fs.unlinkSync(p); console.log(`🗑️ Archivo imagen eliminado: ${p}`); } catch (e) { }
        }
      }

      triggerFileSync.deleteSingleTrigger(id);
      triggersCache.splice(idx, 1);
      saveTriggersFile();
      io.emit('triggers-data', triggersCache);
      triggerManager.updateTriggers(triggersCache); // Notificar al motor de cambios IN
      if (callback) callback({ success: true });
      console.log(`🗑️ Trigger eliminado: ${name}`);
    });

    // [v60.UI] Persistencia Soberana de Configuración Global de Sala (Solo Master)
    socket.on('save-global-settings', (data, callback) => {
      try {
        const isMaster = (categoriesData && categoriesData.masterId === socket.id);
        if (!isMaster) {
          console.warn(`⚠️ [GLOBAL-SETTINGS] Intento no autorizado de guardar configuración global desde: ${socket.id}`);
          if (callback) callback({ success: false, error: 'Unauthorized: Solo el Master puede guardar ajustes globales' });
          return;
        }

        const incoming = (data && data.settings) ? data.settings : {};
        const sanitizedTheme = (incoming.theme === 'light') ? 'light' : 'dark';

        const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
        const validateColor = (val, fallback) => (typeof val === 'string' && hexRegex.test(val)) ? val : fallback;

        const currentFallbackDNA = (sanitizedTheme === 'light') ? {
          bgPrimary: '#F8FAFC', bgSecondary: '#FFFFFF',
          primary: '#7b68ee', secondary: '#ff6b35',
          text: '#1E293B', textSecondary: '#475569'
        } : APP_CANONICAL_DEFAULTS.dna;

        const incomingDNA = incoming.dna || {};
        const sanitizedDNA = {
          bgPrimary: validateColor(incomingDNA.bgPrimary, currentFallbackDNA.bgPrimary),
          bgSecondary: validateColor(incomingDNA.bgSecondary, currentFallbackDNA.bgSecondary),
          primary: validateColor(incomingDNA.primary, currentFallbackDNA.primary),
          secondary: validateColor(incomingDNA.secondary, currentFallbackDNA.secondary),
          text: validateColor(incomingDNA.text, currentFallbackDNA.text),
          textSecondary: validateColor(incomingDNA.textSecondary, currentFallbackDNA.textSecondary)
        };

        const incomingTypo = incoming.typography || {};
        const sanitizedTypography = {
          fontSize: Math.max(40, Math.min(250, parseInt(incomingTypo.fontSize, 10) || 100)),
          fontWeight: Math.max(100, Math.min(900, parseInt(incomingTypo.fontWeight, 10) || 400))
        };

        globalSettings = {
          theme: sanitizedTheme,
          dna: sanitizedDNA,
          typography: sanitizedTypography
        };

        saveGlobalSettings();

        // Broadcast a toda la sala de la nueva configuración global soberana
        io.emit('global-settings-updated', globalSettings);

        console.log(`👑 [GLOBAL-SETTINGS] Master (${socket.id}) guardó nueva configuración global.`);
        if (callback) callback({ success: true, settings: globalSettings });
      } catch (err) {
        console.error('❌ [GLOBAL-SETTINGS] Error en handler save-global-settings:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // [v60] Disparo manual/hardware de trigger IN desde el cliente
    socket.on('trigger-fire-in', (data) => {
      const user = users.get(socket.id);
      const { triggerId, val } = data || {};
      const tr = triggersCache.find(t => t.id === triggerId && t.direction === 'IN');
      if (tr) {
        if (global.sessionStats) global.sessionStats.trigger_count++;
        // [v60.Elite] Pasamos el socket.id para que el contador de telemetría 
        // solo incremente si el trigger resulta en un mensaje inyectado.
        triggerManager.fireTrigger(tr, { value: val, originSocketId: socket.id });
      }
    });

    // [v60.Elite] Telemetría y Aviso Selectivo a la Sala de Disparo OUT
    socket.on('trigger-fired-out', (data) => {
      const user = users.get(socket.id);
      if (user) {
        if (global.sessionStats) global.sessionStats.trigger_count++;
        user.triggerCount = (user.triggerCount || 0) + 1;
      }

      if (!data) return;
      const trId = data.triggerId || 'unknown';
      const timeStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const payload = {
        triggerId: trId,
        triggerName: data.triggerName || `Trigger #${trId}`,
        triggerType: (data.triggerType || 'OUT').toUpperCase(),
        time: timeStr,
        user: user ? user.username : 'Sistema'
      };

      // Fallback Murphy: Si no se reconoce el ID del trigger, broadcast de seguridad a todos
      if (!data.triggerId || trId === 'unknown') {
        io.emit('system-warning-trigger-out', payload);
        return;
      }

      try {
        for (const [sId, sSocket] of io.sockets.sockets.entries()) {
          if (sSocket && sSocket.connected) {
            // SE ENVÍA SI: Es el socket emisor que lo ejecutó OR es el Master de la sala OR tiene el trigger activado en su perfil
            const isEmisor = (sId === socket.id);
            const isMaster = (categoriesData && categoriesData.masterId === sId);
            if (isEmisor || isMaster || global.isTriggerEnabledForUser(sId, data.triggerId)) {
              sSocket.emit('system-warning-trigger-out', payload);
            }
          }
        }
      } catch (err) {
        console.error('⚠️ [TRIGGER-FIRED-OUT] Error en emisión segmentada, aplicando fallback global:', err);
        io.emit('system-warning-trigger-out', payload);
      }
    });




    // [v60] Receptor de audio SMPTE desde el navegador
    socket.on('smpte-audio-buffer', (data) => {
      if (triggerManager && typeof triggerManager.processSMPTEAudio === 'function') {
        const buffer = data.samples ? Buffer.from(data.samples) : Buffer.from(data);
        const rate = data.sampleRate || 44100;
        const channel = data.channel || 0;

        const cleanIp = getCleanIp(socket);
        const user = users.get(socket.id);
        const baseKey = user ? `${user.username}_${user.ip || cleanIp}` : `anon_${cleanIp}`;
        const sovereigntyKey = `${baseKey}_ch${channel}`;

        const existingClaimant = smpteClaims.get(sovereigntyKey);
        const lastActivityTime = smpteLastAudio.get(sovereigntyKey) || 0;
        const isSelf = existingClaimant === socket.id;
        const isStale = (Date.now() - lastActivityTime) > 2000;

        if (existingClaimant && !isSelf && !isStale) {
          const claimantSocket = io.sockets.sockets.get(existingClaimant);
          const claimantIp = claimantSocket ? getCleanIp(claimantSocket) : null;
          if (claimantIp === cleanIp) {
            socket.emit('smpte-capture-conflict', { sovereigntyKey, owner: true });
            return;
          }
        }

        if (!existingClaimant || isSelf || isStale) {
          smpteClaims.set(sovereigntyKey, socket.id);
          smpteLastAudio.set(sovereigntyKey, Date.now());
          triggerManager.processSMPTEAudio(buffer, socket.id, rate, sovereigntyKey);
        }
      }
    });

    // [v60.Elite] Receptor de metadatos SMPTE (Tanque Ágil - Edge Decoding)
    socket.on('smpte-sync', (data) => {
      if (triggerManager && typeof triggerManager.processSMPTESync === 'function') {
        const channel = data.channel || 0;
        const cleanIp = getCleanIp(socket);
        const user = users.get(socket.id);
        const baseKey = user ? `${user.username}_${user.ip || cleanIp}` : `anon_${cleanIp}`;
        const sovereigntyKey = `${baseKey}_ch${channel}`;

        const existingClaimant = smpteClaims.get(sovereigntyKey);
        const lastActivityTime = smpteLastAudio.get(sovereigntyKey) || 0;
        const isSelf = existingClaimant === socket.id;
        const isStale = (Date.now() - lastActivityTime) > 2000;

        // El protocolo de soberanía es idéntico para audio y metadatos
        if (existingClaimant && !isSelf && !isStale) {
          const claimantSocket = io.sockets.sockets.get(existingClaimant);
          const claimantIp = claimantSocket ? getCleanIp(claimantSocket) : null;
          if (claimantIp === cleanIp) {
            socket.emit('smpte-capture-conflict', { sovereigntyKey, owner: true });
            return;
          }
        }

        if (!existingClaimant || isSelf || isStale) {
          smpteClaims.set(sovereigntyKey, socket.id);
          smpteLastAudio.set(sovereigntyKey, Date.now());
          triggerManager.processSMPTESync(data, socket.id, sovereigntyKey);
        }
      }
    });

    // --- PANEL DE CONTROL MASTER (v46.4.63/66) ---
    socket.on('kick-user', (targetId) => {
      const isMaster = socket.id === categoriesData.masterId;
      console.log(`📡 Señal KICK recibida de ${socket.id} (Master: ${isMaster}) para: ${targetId}`);

      if (!isMaster) {
        console.warn(`⚠️ Intento de expulsión no autorizado de: ${socket.id}`);
        return;
      }

      const targetUser = users.get(targetId);
      if (targetUser) {
        // Obtener datos del socket (si sigue vivo) para bloqueo de IP
        const targetSocket = io.sockets.sockets.get(targetId);
        const targetIp = targetSocket ? targetSocket.handshake.address : null;
        const targetToken = targetUser.sessionToken;
        const targetUsername = targetUser.username;

        console.log(`👢 EXPULSIÓN: Master expulsó a ${targetUsername} (IP: ${targetIp} | Token: ${targetToken})`);

        // 1. [v46.4.66.1] BROADCAST ATÓMICO: Orden global incontestable
        io.emit('broadcast-kick', {
          targetId: targetId,
          targetToken: targetToken,
          message: 'Has sido expulsado por el maestro.'
        });

        // 2. Blacklist persistente (Saneada para Redes Locales e Híbridas)
        const isLocalIp = targetIp && (targetIp === '127.0.0.1' || targetIp === '::1' || targetIp.startsWith('192.168.') || targetIp.startsWith('10.') || targetIp.startsWith('172.16.') || targetIp.startsWith('::ffff:192.168.'));

        if (targetIp && !isLocalIp) {
          kickedIps.add(targetIp);
        }
        if (targetToken && typeof targetToken === 'string' && targetToken.length > 5) {
          kickedTokens.add(targetToken);
        }

        // 3. Limpieza inmediata en el servidor
        users.delete(targetId);
        io.emit('update-users', Array.from(users.values()));

        // Desconectar físicamente el socket si es posible
        if (targetSocket) {
          setTimeout(() => targetSocket.disconnect(true), 1000);
        }

        // Limpiar de la lista negra tras 30 minutos
        setTimeout(() => {
          if (targetIp) kickedIps.delete(targetIp);
          if (targetToken) kickedTokens.delete(targetToken);
          console.log(`🛡️ Bloqueo expirado para: ${targetUsername} (${targetIp || 'N/A'})`);
        }, 30 * 60 * 1000);
      }
    });

    // === TRIGGER OSC bridge HTTPS → UDP ===
    // El cliente envía este evento cuando recibe un mensaje y tiene triggers OSC activos.
    // [v60.Elite] SOBERANÍA DISTRIBUIDA: Redirección inteligente de localhost.
    socket.on('trigger-osc', (data) => {
      const user = users.get(socket.id);
      try {
        let { host, port, address, args } = data || {};
        if (!host || !port || !address) {
          console.warn('⚠️  trigger-osc: parámetros incompletos', data);
          return;
        }

        // --- LÓGICA DE SOBERANÍA DISTRIBUIDA (v60.Elite) ---
        let clientIp = socket.handshake.address;
        if (clientIp.includes('::ffff:')) {
          clientIp = clientIp.split('::ffff:')[1];
        }
        if (clientIp === '::1') clientIp = '127.0.0.1'; // Local testing

        const isLocalhost = host === '127.0.0.1' || host === 'localhost';
        const isMaster = socket.id === categoriesData.masterId;

        if (isLocalhost) {
          // Redirigir a la IP real del cliente (Soberanía de proximidad)
          host = clientIp;
        }

        // [v60.Elite] Procesado de Argumentos Alta Fidelidad (Legacy + Multi-addr)
        let { arg } = data || {};
        let finalArgs = [];

        if (Array.isArray(args) && args.length > 0) {
          finalArgs = args;
        } else if (arg !== undefined) {
          const rawVal = String(arg);
          let type = 's', val = rawVal;
          if (!isNaN(rawVal) && rawVal.trim() !== '') {
            type = rawVal.includes('.') ? 'f' : 'i';
            val = type === 'f' ? parseFloat(rawVal) : parseInt(rawVal);
          }
          finalArgs = [{ type, value: val }];
        } else {
          finalArgs = [{ type: 'f', value: 1.0 }];
        }

        const addresses = address.split(' ').filter(a => a.startsWith('/'));
        addresses.forEach(addr => {
          sendOscUdp(host, parseInt(port), addr, finalArgs);
        });
      } catch (e) {
        console.error('❌ Error crítico en socket trigger-osc:', e.message);
      }
    });

    // [v60.Elite] Sincronización de Soberanía para ejecución delegada (Blindaje Murphy #15)
    socket.on('sync-user-trigger-state', (data) => {
      if (triggerManager && data && data.triggerId) {
        triggerManager.setUserTriggerState(socket.id, data.triggerId, data.enabled);
        try {
          const user = users.get(socket.id);
          const cleanIp = getCleanIp(socket);
          const sovereigntyKey = user ? `${user.username}_${user.ip}` : `anon_${cleanIp}`;
          if (!triggerSovereigntyStates.has(sovereigntyKey)) {
            triggerSovereigntyStates.set(sovereigntyKey, new Set());
          }
          const stateSet = triggerSovereigntyStates.get(sovereigntyKey);
          if (data.enabled) {
            stateSet.add(data.triggerId);
          } else {
            stateSet.delete(data.triggerId);
          }
          if (typeof io !== 'undefined') {
            io.emit('active-claims-updated', getGlobalActiveClaims());
          }
        } catch (_) { }
      }
    });

    // === TRIGGER sACN bridge HTTPS → UDP ===
    socket.on('trigger-sacn', (data) => {
      const user = users.get(socket.id);
      try {
        // [v60.Elite] SOBERANÍA LIBERADA: sACN permitido para todos los usuarios identificados
        if (!data || !data.universe) {
          console.warn('⚠️  trigger-sacn: parámetros incompletos', data);
          return;
        }
        sendSacn(data);
      } catch (e) {
        console.error('❌ Error crítico en socket trigger-sacn:', e.message);
      }
    });

    socket.on('get-triggers', (data, callback) => {
      try {
        try { triggerFileSync.checkSyncIfNeeded(); } catch (_) { }
        // Soporte flexible para (callback) o (data, callback)
        const finalCallback = (typeof data === 'function') ? data : callback;

        if (typeof finalCallback === 'function') {
          finalCallback(triggersCache);
        } else {
          socket.emit('triggers-data', triggersCache);
        }
        console.log(`📡 Sincronización de triggers solicitada por ${socket.id}`);
      } catch (e) {
        console.error('❌ Error enviando triggers:', e.message);
      }
    });

    socket.on('disconnect', (reason) => {
      try { console.log(`🔌 Socket disconnected: ${socket.id} reason=${reason}`); } catch (e) { }

      // [v60.ELITE FIX - Sol.9] Liberar memoria nativa de Vosk de forma segura
      try {
        if (typeof activeRecognizers !== 'undefined' && activeRecognizers) {
          for (const [subId, recognizer] of activeRecognizers.entries()) {
            if (recognizer && typeof recognizer.free === 'function') {
              recognizer.free();
              console.log(`🧹 [VOSK-SERVER] Memoria nativa liberada para recognizer de ${subId}.`);
            }
          }
          activeRecognizers.clear();
        }
      } catch (e) {
        console.error('Error liberando recognizers nativos en disconnect:', e);
      }

      const user = users.get(socket.id);

      if (user) {
        users.delete(socket.id);

        const userCat = (user.categories && user.categories[0]) || 'General';
        socket.broadcast.emit('user-left', {
          user: 'Sistema',
          username: user.username,
          category: userCat,
          categories: user.categories || [userCat],
          text: `${user.username} ha abandonado el chat`,
          time: new Date().toLocaleTimeString()
        });

        const allUsersData = Array.from(users.values()).map(u => ({
          username: u.username,
          categories: u.categories
        }));

        io.emit('update-users', allUsersData);
        io.emit('update-filters', allUsersData);
        console.log(`👋 ${user.username} desconectado. Total: ${users.size}`);

        // [v60.ELITE] Soberanía de Desconexión
        if (categoriesData.masterId === socket.id) {
          console.log(`👑 [ELITE] Master (${categoriesData.masterUsername}) se ha desconectado. Reservando asiento para posible re-entrada y eliminando PIN de sala.`);
          categoriesData.masterId = null;
          categoriesData.roomPin = null;
          saveCategories();

          // Notificar a todos que el PIN de sala se ha eliminado
          io.emit('room-pin-updated', { hasRoomPin: false });

          // [v60.ELITE] Sincronización Global: Informar que el asiento está libre
          broadcastMasterStatus();
        }

        // ✅ NUEVA: Si no quedan usuarios, limpiar sesión automáticamente
        if (users.size === 0) {
          console.log('📋 Último usuario desconectado. Limpiando sesión automáticamente...');
          try {
            clearRecordings();
            clearImages();
            messageHistory = [];
            imagesHistory = [];
            if (fs.existsSync(MESSAGE_HISTORY_PATH)) {
              fs.unlinkSync(MESSAGE_HISTORY_PATH);
            }
            console.log('✅ Sesión limpiada automáticamente');
          } catch (e) {
            console.error('❌ Error durante limpieza automática:', e.message);
          }
        }
      }
    });

  });

  function getNetworkInfo() {
    const networkInterfaces = os.networkInterfaces();
    const addresses = [];

    Object.keys(networkInterfaces).forEach(interfaceName => {
      networkInterfaces[interfaceName].forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push(iface.address);
        }
      });
    });

    return addresses;
  }

  function ensureFirewallRule() {
    if (process.platform !== 'win32') return;

    const ruleName = "Talk-me (Puerto 3000)";
    exec(`netsh advfirewall firewall show rule name="${ruleName}"`, (error, stdout, stderr) => {
      // Si hay error, significa que la regla no existe aún
      if (error) {
        console.log("🛡️  Detectada falta de permisos de red. Solicitando acceso al Firewall de Windows...");
        const addCmd = `netsh advfirewall firewall add rule name="${ruleName}" dir=in action=allow protocol=TCP localport=${PORT}`;
        const elevateCmd = `powershell -Command "Start-Process cmd -ArgumentList '/c ${addCmd}' -Verb RunAs -WindowStyle Hidden"`;

        exec(elevateCmd, (elevateErr) => {
          if (elevateErr) {
            console.log("⚠️  No concediste los permisos o falló automático. Copia y pega esto en un CMD como Administrador:");
            console.log(`   ${addCmd}`);
          } else {
            console.log("✅ Permisos de red concedidos. Tu iPhone debería conectar sin problemas a cualquier IP.");
          }
        });
      }
    });
  }

  ensureFirewallRule();

  server.listen(PORT, HOST, () => {
    initAiEngine(); // [v60.1-BABEL] Inicialización del Cerebro IA
    const networkAddresses = getNetworkInfo();

    console.log('');
    console.log('🚀 Servidor Talk-me iniciado - v59.10 FIX (Solución Eco + Replay) (Modo HTTPS Seguro)');
    const voskReady = Object.keys(voskModels).length > 0;
    const modelList = Object.keys(voskModels).join(',').toUpperCase();
    console.log(`🎤 Transcripción: ${voskReady ? `Vosk (${modelList})` : 'Local (offline)'} + Euskera (Whisper-Small)`);
    console.log('📍 Local: https://localhost:3000');
    console.log('📍 Red (Usa esta en tu iPhone):');
    networkAddresses.forEach(ip => {
      console.log(`   https://${ip}:3000`);
    });
    console.log('\n⚠️  ATENCIÓN iPHONE: Safari pedirá permiso. Si ves "No es seguro",');
    console.log('   pulsa "Opciones Avanzadas" -> "Continuar al sitio (no seguro)".');
    console.log('');

    // Abrir navegador automáticamente en localhost (más compatible con certificado autofirmado)
    const localUrl = `https://localhost:3000`;
    const networkUrl = networkAddresses.length > 0 ? `https://${networkAddresses[0]}:3000` : localUrl;
    const startCommand = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';

    // Pequeño delay para asegurar que el server esté listo al 100% y dar feedback
    setTimeout(() => {
      console.log(`🌍 Abriendo navegador en ${localUrl}...`);
      // exec(`${startCommand} ${localUrl}`); // DESACTIVADO: Se encarga iniciar_servidor.bat

      console.log(`\n📱 También puedes acceder desde otro dispositivo en la red:`);
      console.log(`   ${networkUrl}`);
      console.log(`\n⚠️  ATENCIÓN: Verás aviso de certificado "no seguro".`);
      console.log(`   Haz clic en "Continuar" o "Avanzadas" → "Aceptar el riesgo".\n`);
    }, 1000);
  });
}

// Arrancar el sistema completo
initServer().catch(err => {
  console.error("❌ Fallo crítico al iniciar el servidor:", err);
});

// ✅ LIMPIEZA AL CERRAR SERVIDOR: Borrar todo (media + historial) de forma ordenada
function gracefulShutdown(signal) {
  console.log(`\n🛑 Señal ${signal} recibida. Deteniendo servicios ordenadamente...`);

  if (whisperMgr) {
    try { whisperMgr.stop(); } catch (e) { console.error('Error deteniendo Whisper:', e); }
  }

  if (global.updateTelemetry) {
    try { global.updateTelemetry(); } catch (e) { console.error('Error final de telemetría:', e); }
  }

  try {
    clearRecordings();
    clearImages();
    if (fs.existsSync(MESSAGE_HISTORY_PATH)) {
      fs.unlinkSync(MESSAGE_HISTORY_PATH);
      console.log('📋 Historial de mensajes eliminado');
    }
    messageHistory = [];
    imagesHistory = [];
  } catch (e) {
    console.error('❌ Error durante limpieza:', e.message);
  }

  console.log('✅ Limpieza completada. Cerrando proceso.');
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));