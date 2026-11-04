/**
 * ==============================================================================
 * wifi-detector.js - Detector Asíncrono de Credenciales Wi-Fi Multiplataforma
 * (Windows, macOS, Linux) con Aislamiento Total ("Zero-Interference Architecture")
 * ==============================================================================
 * - Ejecución 100% asíncrona sin bloquear el Event Loop de Node.js.
 * - Watchdog defensivo estricto con timeout de 1500 ms.
 * - Soporte multi-idioma (ES, EN, DE, FR) y codificaciones latin1/cp850 en Windows.
 * - Detección nativa en macOS (networksetup/security) y Linux (nmcli/iwgetid).
 * - Fallback defensivo a Ethernet/LAN y caché en RAM de 30 segundos.
 * - Sanitización estricta de caracteres ZXing (\;, \:, \,, \\, \").
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Caché en memoria RAM (TTL: 30 segundos)
let _wifiCache = null;
let _wifiCacheTime = 0;
const CACHE_TTL_MS = 30000;

/**
 * Escapa caracteres especiales de control para el estándar ZXing de Códigos QR Wi-Fi
 */
function escapeZxing(str) {
  if (!str) return '';
  return str.replace(/([\\;,:"])/g, '\\$1');
}

/**
 * Ejecuta un comando en subproceso hijo desacoplado con watchdog de terminación forzosa
 */
function runCommandAsync(cmd, options = {}) {
  return new Promise((resolve) => {
    const opts = Object.assign(
      {
        timeout: 1500,
        windowsHide: true,
        maxBuffer: 1024 * 512,
        encoding: 'buffer'
      },
      options
    );

    exec(cmd, opts, (error, stdout, stderr) => {
      if (error) {
        return resolve({ success: false, error, stdout: '', stderr: '' });
      }
      // Decodificación tolerante a caracteres especiales del SO (latin1 preserva acentos/bytes de cmd)
      const outStr = Buffer.isBuffer(stdout) ? stdout.toString('latin1') : String(stdout || '');
      const errStr = Buffer.isBuffer(stderr) ? stderr.toString('latin1') : String(stderr || '');
      resolve({ success: true, stdout: outStr, stderr: errStr });
    });
  });
}

/**
 * Detector Windows (netsh wlan)
 */
async function detectWindowsWifi() {
  try {
    // 1. Obtener interfaz inalámbrica activa y SSID
    const ifaceRes = await runCommandAsync('netsh wlan show interfaces');
    if (!ifaceRes.success || !ifaceRes.stdout) return null;

    const out = ifaceRes.stdout;
    // Si no hay tarjeta Wi-Fi o está desconectada
    if (out.includes('no hay ninguna interfaz') || out.includes('there is no wireless interface')) {
      return null;
    }

    // Extraer SSID activo (ignora BSSID)
    // Soportar "SSID                   : MiRed" y variaciones internacionales
    const ssidMatch = out.match(/^\s*(?:SSID|Nombre de SSID)\s*:\s*(.+)$/im);
    if (!ssidMatch || !ssidMatch[1]) return null;

    const ssid = ssidMatch[1].trim();
    if (!ssid) return null;

    // Detectar tipo de cifrado / seguridad
    let security = 'WPA';
    if (/abierta|open|ninguna|none/i.test(out)) {
      security = 'nopass';
    } else if (/wep/i.test(out)) {
      security = 'WEP';
    }

    // Si es una red abierta, no buscamos clave
    if (security === 'nopass') {
      return { ssid, password: '', security: 'nopass' };
    }

    // 2. Extraer contraseña del perfil almacenado
    const profileRes = await runCommandAsync(`netsh wlan show profile name="${ssid}" key=clear`);
    let password = '';
    if (profileRes.success && profileRes.stdout) {
      // Regex flexible: "Contenido de la clave : xxx" o "Key Content : xxx" o "Schlusselinhalt : xxx"
      const keyMatch = profileRes.stdout.match(/^\s*(?:Contenido de la clave|Key Content|Schl[uü]sselinhalt|Contenu de la cl[eé])\s*:\s*(.+)$/im);
      if (keyMatch && keyMatch[1]) {
        password = keyMatch[1].trim();
      }
    }

    return { ssid, password, security };
  } catch (_) {
    return null;
  }
}

/**
 * Detector macOS (networksetup & security)
 */
async function detectMacWifi() {
  try {
    // 1. Obtener SSID activo en en0 (o en1 si en0 no es Wi-Fi)
    let res = await runCommandAsync('/usr/sbin/networksetup -getairportnetwork en0');
    let out = res.stdout;
    if (!res.success || !out || out.includes('Could not') || out.includes('error')) {
      res = await runCommandAsync('/usr/sbin/networksetup -getairportnetwork en1');
      out = res.stdout;
    }

    if (!out) return null;

    const match = out.match(/Current Wi-Fi Network:\s*(.+)$/i);
    if (!match || !match[1]) return null;

    const ssid = match[1].trim();
    if (!ssid) return null;

    // 2. Intentar leer contraseña del Llavero con timeout rápido
    let password = '';
    const keyRes = await runCommandAsync(`/usr/bin/security find-generic-password -D "AirPort network password" -a "${ssid}" -w`);
    if (keyRes.success && keyRes.stdout) {
      password = keyRes.stdout.trim();
    }

    return {
      ssid,
      password,
      security: password ? 'WPA' : 'nopass'
    };
  } catch (_) {
    return null;
  }
}

/**
 * Detector Linux (nmcli & iwgetid)
 */
async function detectLinuxWifi() {
  try {
    // 1. Obtener SSID con nmcli
    let res = await runCommandAsync('nmcli -t -f active,ssid dev wifi');
    let ssid = '';
    if (res.success && res.stdout) {
      const match = res.stdout.match(/^(?:s[ií]|yes):(.+)$/im);
      if (match && match[1]) ssid = match[1].trim();
    }

    // Fallback a iwgetid si nmcli no entregó resultado
    if (!ssid) {
      const iwRes = await runCommandAsync('iwgetid -r');
      if (iwRes.success && iwRes.stdout) {
        ssid = iwRes.stdout.trim();
      }
    }

    if (!ssid) return null;

    // 2. Obtener clave de la conexión
    let password = '';
    const keyRes = await runCommandAsync(`nmcli -s -g 802-11-wireless-security.psk connection show "${ssid}"`);
    if (keyRes.success && keyRes.stdout) {
      password = keyRes.stdout.trim();
    }

    return {
      ssid,
      password,
      security: password ? 'WPA' : 'nopass'
    };
  } catch (_) {
    return null;
  }
}

/**
 * Carga configuración estática si el técnico la definió manualmente en config/data/wifi-config.json
 */
function loadStaticConfigFile() {
  const cfgPath = path.join(__dirname, 'config', 'data', 'wifi-config.json');
  if (fs.existsSync(cfgPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      if (data && data.ssid) {
        return {
          ssid: data.ssid.trim(),
          password: data.password ? String(data.password).trim() : '',
          security: data.security || 'WPA',
          isManualConfig: true
        };
      }
    } catch (_) {}
  }
  return null;
}

/**
 * Función Principal Asíncrona: Obtiene credenciales Wi-Fi reales con caché y escudo Murphy
 */
async function getWifiCredentials(serverIp = '127.0.0.1') {
  const now = Date.now();
  // Retornar caché en memoria si aún es válida (< 30s)
  if (_wifiCache && (now - _wifiCacheTime < CACHE_TTL_MS)) {
    return _wifiCache;
  }

  // 1. Intentar detección nativa del Sistema Operativo
  let detected = null;
  const platform = process.platform;

  if (platform === 'win32') {
    detected = await detectWindowsWifi();
  } else if (platform === 'darwin') {
    detected = await detectMacWifi();
  } else if (platform === 'linux') {
    detected = await detectLinuxWifi();
  }

  // 2. Si se detectó Wi-Fi activa y con datos válidos
  if (detected && detected.ssid) {
    const result = {
      mode: 'wifi_direct',
      ssid: detected.ssid,
      password: detected.password || '',
      security: detected.security || (detected.password ? 'WPA' : 'nopass'),
      zxingString: detected.password
        ? `WIFI:T:${detected.security || 'WPA'};S:${escapeZxing(detected.ssid)};P:${escapeZxing(detected.password)};;`
        : `WIFI:T:nopass;S:${escapeZxing(detected.ssid)};;`,
      serverIp
    };

    _wifiCache = result;
    _wifiCacheTime = now;
    return result;
  }

  // 3. Si no hay tarjeta Wi-Fi (ej. Máster por cable Ethernet directo), verificar archivo manual
  const manual = loadStaticConfigFile();
  if (manual) {
    const result = {
      mode: 'wifi_manual',
      ssid: manual.ssid,
      password: manual.password || '',
      security: manual.security || 'WPA',
      zxingString: manual.password
        ? `WIFI:T:${manual.security || 'WPA'};S:${escapeZxing(manual.ssid)};P:${escapeZxing(manual.password)};;`
        : `WIFI:T:nopass;S:${escapeZxing(manual.ssid)};;`,
      serverIp
    };

    _wifiCache = result;
    _wifiCacheTime = now;
    return result;
  }

  // 4. Escudo Murphy: Conectado por Cable Ethernet sin tarjeta inalámbrica
  // Jamás inventar credenciales falsas. Devolver modo táctico ethernet.
  const ethernetResult = {
    mode: 'ethernet',
    ssid: null,
    password: null,
    security: null,
    zxingString: null,
    serverIp
  };

  _wifiCache = ethernetResult;
  _wifiCacheTime = now;
  return ethernetResult;
}

/**
 * Guarda la configuración de red Wi-Fi ingresada manualmente por el Máster de forma atómica.
 */
function saveWifiConfig(ssid, password, security = 'WPA') {
  if (!ssid || typeof ssid !== 'string' || !ssid.trim()) {
    throw new Error('El nombre de la red (SSID) no puede estar vacío.');
  }

  const cleanSsid = ssid.trim();
  const cleanPass = password ? String(password).trim() : '';
  const cleanSec = security || (cleanPass ? 'WPA' : 'nopass');

  const configDir = path.join(__dirname, 'config', 'data');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const targetPath = path.join(configDir, 'wifi-config.json');
  const tempPath = path.join(configDir, 'wifi-config.json.tmp');

  const payload = {
    ssid: cleanSsid,
    password: cleanPass,
    security: cleanSec,
    updatedAt: new Date().toISOString()
  };

  // Escritura atómica a prueba de fallos
  fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf8');
  fs.renameSync(tempPath, targetPath);

  // Invalida inmediatamente la caché en RAM para que el siguiente escaneo sea instantáneo
  _wifiCache = null;
  _wifiCacheTime = 0;

  return {
    success: true,
    ssid: cleanSsid,
    password: cleanPass,
    security: cleanSec,
    zxingString: cleanPass
      ? `WIFI:T:${cleanSec};S:${escapeZxing(cleanSsid)};P:${escapeZxing(cleanPass)};;`
      : `WIFI:T:nopass;S:${escapeZxing(cleanSsid)};;`
  };
}

/**
 * Invalida explícitamente la caché en memoria RAM.
 */
function clearWifiCache() {
  _wifiCache = null;
  _wifiCacheTime = 0;
}

module.exports = {
  getWifiCredentials,
  saveWifiConfig,
  clearWifiCache,
  escapeZxing
};

