const path = require('path');
const fs = require('fs');
const storage = require('../storage/storage.js');

const CATEGORIES_FILE = path.join(__dirname, '..', 'config', 'data', 'categories.json');
const MAX_CATEGORIES = 25;

/**
 * Crea un backup con timestamp en la carpeta config/backups/
 * @param {string} filePath - Ruta del archivo a respaldar
 * @param {string} fileType - Tipo de archivo (categories, etc.)
 */
function createTimestampedBackupLocal(filePath, fileType = 'data') {
  try {
    const resolvedPath = (storage && typeof storage.resolveWritablePath === 'function')
      ? storage.resolveWritablePath(filePath)
      : filePath;
    if (!fs.existsSync(resolvedPath)) return false;
    
    const BACKUPS_DIR = (storage && typeof storage.resolveWritablePath === 'function')
      ? storage.resolveWritablePath(path.join(__dirname, '..', 'config', 'backups'))
      : path.join(__dirname, '..', 'config', 'backups');
    
    if (!fs.existsSync(BACKUPS_DIR)) {
      try { fs.mkdirSync(BACKUPS_DIR, { recursive: true }); } catch (_) {}
    }
    
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = path.basename(resolvedPath);
    const backupName = fileType + '_' + timestamp + '_' + filename;
    const backupPath = path.join(BACKUPS_DIR, backupName);
    
    fs.copyFileSync(resolvedPath, backupPath);
    console.log('✅ Backup creado: ' + backupName);

    return true;
  } catch (e) {
    console.warn('⚠️ No se pudo crear backup local:', e.message);
    return false;
  }
}

const DEFAULT_CATEGORIES = [
  { id: 'cat_sonido', name: 'Sonido', color: '#9C27B0' },
  { id: 'cat_luzfx', name: 'Luz/FX', color: '#00BCD4' },
  { id: 'cat_produccion', name: 'Producción', color: '#4CAF50' },
  { id: 'cat_artistas', name: 'Artistas', color: '#E91E63' }
];

let categoriesData = {
  categories: [...DEFAULT_CATEGORIES],
  masterId: null,
  masterUsername: null,
  masterCategory: null,
  roomPin: null,
  lastModified: new Date().toISOString()
};

function loadCategories() {
  const parsed = storage.readJSON(CATEGORIES_FILE);
  if (parsed && parsed.categories && Array.isArray(parsed.categories) && parsed.categories.length > 0) {
    categoriesData.categories = parsed.categories;
    categoriesData.masterId = null;
    categoriesData.masterUsername = parsed.masterUsername || null;
    categoriesData.masterCategory = parsed.masterCategory || null;
    categoriesData.roomPin = null;
    categoriesData.lastModified = parsed.lastModified || new Date().toISOString();
    saveCategories();
    return categoriesData;
  }
  // Default values
  categoriesData.categories = [...DEFAULT_CATEGORIES];
  categoriesData.roomPin = null;
  saveCategories();
  return categoriesData;
}

function saveCategories() {
  try {
    // Crear backup con timestamp antes de escribir
    if (fs.existsSync(CATEGORIES_FILE)) {
      createTimestampedBackupLocal(CATEGORIES_FILE, 'categories');
    }
    categoriesData.lastModified = new Date().toISOString();
    const success = storage.writeJSON(CATEGORIES_FILE, {
      categories: categoriesData.categories,
      masterId: categoriesData.masterId,
      masterUsername: categoriesData.masterUsername,
      masterCategory: categoriesData.masterCategory,
      roomPin: categoriesData.roomPin,
      lastModified: categoriesData.lastModified
    });

    if (success) {
      console.log(`💾 Categorías guardadas: ${categoriesData.categories.length} categorías`);
      return true;
    } else {
      console.error('❌ Error saving categories: storage.writeJSON return false');
      return false;
    }
  } catch (e) {
    console.error('❌ Error saving categories:', e.message);
    return false;
  }
}

function generateCategoryId() {
  return `cat_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

module.exports = {
  loadCategories,
  saveCategories,
  generateCategoryId,
  categoriesData,
  MAX_CATEGORIES
};