const fs = require('fs');
const path = require('path');
const selfsigned = require('selfsigned');

const CA_DIR = path.join(__dirname, 'config', 'data', 'ca');
const CA_KEY_PATH = path.join(CA_DIR, 'talkme-root-ca.key');
const CA_PUB_PATH = path.join(CA_DIR, 'talkme-root-ca.pub');
const CA_CERT_PATH = path.join(CA_DIR, 'talkme-root-ca.crt');

if (!fs.existsSync(CA_DIR)) {
  fs.mkdirSync(CA_DIR, { recursive: true });
}

async function ensureRootCA() {
  if (fs.existsSync(CA_KEY_PATH) && fs.existsSync(CA_PUB_PATH) && fs.existsSync(CA_CERT_PATH)) {
    return {
      privateKey: fs.readFileSync(CA_KEY_PATH, 'utf8'),
      publicKey: fs.readFileSync(CA_PUB_PATH, 'utf8'),
      cert: fs.readFileSync(CA_CERT_PATH, 'utf8')
    };
  }

  console.log("🔒 [CA] Generando nueva Autoridad Certificadora Raíz (Root CA) persistente...");
  const caAttrs = [{ name: 'commonName', value: 'Talk-me Local Root CA' }];

  const caPems = await selfsigned.generate(caAttrs, {
    days: 3650,
    extensions: [{ name: 'basicConstraints', cA: true }]
  });

  fs.writeFileSync(CA_KEY_PATH, caPems.private, 'utf8');
  fs.writeFileSync(CA_PUB_PATH, caPems.public, 'utf8');
  fs.writeFileSync(CA_CERT_PATH, caPems.cert, 'utf8');
  console.log("✅ [CA] Talk-me Root CA guardada en config/data/ca/");
  return {
    privateKey: caPems.private,
    publicKey: caPems.public,
    cert: caPems.cert
  };
}

async function generateServerCert(currentIps, keyPath, certPath, ipCachePath) {
  const rootCA = await ensureRootCA();
  console.log("🔐 [SSL] Firmando certificado de servidor con Talk-me Root CA para IPs:", currentIps.join(', '));
  
  const attrs = [{ name: 'commonName', value: 'Talk-me Local Server' }];
  const altNames = [{ type: 2, value: 'localhost' }];
  currentIps.forEach(ip => {
    altNames.push({ type: 7, ip: ip });
  });

  const serverPems = await selfsigned.generate(attrs, {
    days: 3650,
    keyPair: { privateKey: rootCA.privateKey, publicKey: rootCA.publicKey },
    extensions: [
      {
        name: 'subjectAltName',
        altNames: altNames
      }
    ]
  });

  const path = require('path');
  fs.mkdirSync(path.dirname(keyPath), { recursive: true });
  fs.writeFileSync(keyPath, serverPems.private, 'utf8');
  fs.writeFileSync(certPath, serverPems.cert, 'utf8');
  fs.writeFileSync(ipCachePath, JSON.stringify(currentIps), 'utf8');
  console.log("✅ [SSL] Certificado de servidor actualizado y firmado correctamente.");
}

function loadWifiConfig() {
  const wifiConfigFile = path.join(__dirname, 'config', 'data', 'wifi-config.json');
  if (fs.existsSync(wifiConfigFile)) {
    try {
      return JSON.parse(fs.readFileSync(wifiConfigFile, 'utf8'));
    } catch (_) {}
  }
  return { ssid: 'Talk-me_WLAN', password: '', security: 'WPA' };
}

module.exports = {
  CA_CERT_PATH,
  ensureRootCA,
  generateServerCert,
  loadWifiConfig
};
