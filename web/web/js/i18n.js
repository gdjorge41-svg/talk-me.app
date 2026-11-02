/**
 * Talk.me i18n Manager - 24 Languages Support
 */

let currentLang = 'es';

function getNestedTranslation(obj, path) {
  return path.split('.').reduce((prev, curr) => (prev && prev[curr] !== undefined ? prev[curr] : null), obj);
}

function updateDOMTranslations() {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.es;

  // 1. Text elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = getNestedTranslation(dict, key);
    if (val !== null) {
      el.textContent = val;
    }
  });

  // 2. HTML content elements (where bold or markup is inside)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    const val = getNestedTranslation(dict, key);
    if (val !== null) {
      el.innerHTML = val;
    }
  });

  // 3. Placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    const val = getNestedTranslation(dict, key);
    if (val !== null) {
      el.setAttribute('placeholder', val);
    }
  });

  // 4. Update 3D Words in Hero Intro
  if (dict.words3d && Array.isArray(dict.words3d)) {
    const wordEls = document.querySelectorAll('.word-3d');
    wordEls.forEach((el, index) => {
      if (dict.words3d[index]) {
        el.textContent = dict.words3d[index];
      }
    });
  }

  // 5. Update HTML lang & dir
  document.documentElement.lang = currentLang;
  document.documentElement.dir = dict.dir || 'ltr';

  // 6. Update selector UI
  const currentLangText = document.getElementById('currentLangText');
  if (currentLangText) {
    currentLangText.textContent = dict.code;
  }

  // Update active state in dropdown list
  document.querySelectorAll('.lang-option-btn').forEach(btn => {
    if (btn.dataset.lang === currentLang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update active state in feature matrix chips (.lang-chip)
  document.querySelectorAll('.lang-chip').forEach(chip => {
    const onclickAttr = chip.getAttribute('onclick') || '';
    if (onclickAttr.includes(`'${currentLang}'`)) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

function setLanguage(langCode) {
  if (!TRANSLATIONS[langCode]) return;
  currentLang = langCode;
  try {
    localStorage.setItem('talkme_lang', langCode);
  } catch (e) {
    console.warn('LocalStorage unavailable:', e);
  }
  updateDOMTranslations();
  closeLangDropdown();
  window.dispatchEvent(new CustomEvent('i18nLanguageChanged', { detail: { lang: currentLang, dict: TRANSLATIONS[currentLang] } }));
}

function cycleLanguage() {
  const langKeys = Object.keys(TRANSLATIONS);
  const nextIdx = (langKeys.indexOf(currentLang) + 1) % langKeys.length;
  setLanguage(langKeys[nextIdx]);
}

function renderLangDropdown() {
  const dropdown = document.getElementById('langDropdownMenu');
  if (!dropdown) return;

  dropdown.innerHTML = '';
  Object.keys(TRANSLATIONS).forEach(key => {
    const lang = TRANSLATIONS[key];
    const btn = document.createElement('button');
    btn.className = `lang-option-btn ${key === currentLang ? 'active' : ''}`;
    btn.dataset.lang = key;
    btn.onclick = (e) => {
      e.stopPropagation();
      setLanguage(key);
    };

    btn.innerHTML = `
      <span>${lang.name}</span>
      <span class="lang-code-badge">${lang.code}</span>
    `;

    dropdown.appendChild(btn);
  });
}

function toggleLangDropdown(e) {
  if (e) e.stopPropagation();
  const wrapper = document.getElementById('langSelectorWrapper');
  if (wrapper) {
    wrapper.classList.toggle('open');
  }
}

function closeLangDropdown() {
  const wrapper = document.getElementById('langSelectorWrapper');
  if (wrapper) {
    wrapper.classList.remove('open');
  }
}

function initI18n() {
  const savedLang = localStorage.getItem('talkme_lang');
  if (savedLang && TRANSLATIONS[savedLang]) {
    currentLang = savedLang;
  } else {
    // Detect browser language if available
    const userLang = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
    if (TRANSLATIONS[userLang]) {
      currentLang = userLang;
    }
  }

  renderLangDropdown();
  updateDOMTranslations();

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('langSelectorWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      closeLangDropdown();
    }
  });
}
