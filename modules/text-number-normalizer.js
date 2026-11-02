/**
 * @file modules/text-number-normalizer.js
 * @description Motor Determinista de Normalización Numérica Multilingüe (ITN - Inverse Text Normalization)
 * para los 24 idiomas oficiales del ecosistema Talk.me.
 *
 * REGLAS DE INGENIERÍA DEFENSIVA (ANTI-MURPHY):
 * 1. Cero Dependencias Externas (100% Soberanía Comercial MIT/Propietaria, Zero-GPL).
 * 2. Rendimiento < 0.08 ms en memoria RAM estática (Cero bloqueo del Event Loop).
 * 3. Escudo Contextual Estricto para el Número 1 (protege artículos indefinidos y pronombres
 *    como "un/una/uno", "one/a/an", "ein/eine", "un/une", "um/uma", "bat", etc., convirtiendo el 1
 *    únicamente en compuestos, secuencias de conteo, decimales o tras sustantivos técnicos escénicos).
 * 4. Pasada de Fusión Híbrida Post-Conversión ("40 y 2" -> "42", "100 25" -> "125") para tolerar
 *    cortes de segmentos en streaming de Vosk.
 * 5. Regla de Corte de Secuencia para no fusionar números independientes ("dos cuatro" -> "2 4").
 * 6. Aislamiento Incondicional try-catch: ante cualquier entrada inesperada, devuelve el texto original intacto.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.TextNumberNormalizer = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const MAX_SAFE_TEXT_LENGTH = 2500;

  // ============================================================================
  // 1. LISTA BLANCA DE SUSTANTIVOS TÉCNICOS ESCÉNICOS / BROADCAST / PRODUCCIÓN
  // ============================================================================
  // Si el número "1" (ej. "uno", "one", "un", "bat") aparece inmediatamente después
  // de cualquiera de estos términos técnicos, SÍ se convierte en "1".
  const TECHNICAL_PRECEDING_WORDS = new Set([
    // Español / Catalán / Gallego / Portugués / Italiano
    'canal', 'canales', 'canals', 'canais', 'canale', 'canali', 'ch',
    'micro', 'micrófono', 'microfono', 'micròfon', 'microfone', 'mic', 'mics',
    'fader', 'faders', 'cue', 'cues',
    'cámara', 'camara', 'càmera', 'camera', 'cam', 'cams',
    'pista', 'pistas', 'pistes', 'faixa', 'faixas', 'traccia',
    'universo', 'univers', 'universe', 'universos',
    'escena', 'escenas', 'scena', 'cena',
    'línea', 'linea', 'línia', 'liña', 'linha', 'line', 'lines',
    'aux', 'auxiliar', 'auxiliares',
    'bus', 'buses',
    'grupo', 'grupos', 'grup', 'gruppo', 'group', 'groups', 'subgrupo', 'subgrupos',
    'vca', 'dca', 'matrix', 'matriz', 'matriu', 'matrice',
    'envío', 'envio', 'send', 'sends', 'mandata',
    'retorno', 'return', 'returns', 'ritorno',
    'input', 'inputs', 'output', 'outputs', 'entrada', 'salida', 'sortida', 'saída', 'ingresso', 'uscita',
    'puerto', 'port', 'ports', 'porta',
    'dmx', 'midi', 'osc', 'sacn', 'artnet', 'ltc', 'smpte',
    'sala', 'room', 'stage', 'escenario', 'plató', 'plato', 'set',
    'fase', 'phase', 'toma', 'take',
    'monitor', 'monitores', 'in-ear', 'inear', 'iem',
    'rack', 'dimmer', 'dimmers', 'foco', 'spot', 'barra', 'truss', 'motor', 'hoist',
    'consola', 'mesa', 'desk', 'console',
    'página', 'pagina', 'pàgina', 'page', 'banco', 'banc', 'bank',
    'preset', 'patch', 'memoria', 'memòria', 'memory',
    'botón', 'boton', 'botó', 'botão', 'bottone', 'button',
    'executor', 'ejecutor',
    'número', 'numero', 'nombre', 'number', 'num', 'nro',
    'nivel', 'nivell', 'nível', 'livello', 'level',
    'volumen', 'volum', 'volume',
    'master', 'main', 'menos', 'minus', 'más', 'mas', 'plus',
    // Inglés / Francés / Alemán / Holandés / Sueco / Eslavo / Túrquico / Euskera
    'channel', 'channels', 'track', 'tracks', 'scene', 'scenes',
    'voie', 'voies', 'caméra', 'scène', 'retour', 'console', 'tranche',
    'kanal', 'kanäle', 'spur', 'szene', 'mikro', 'mikrofon', 'kamera',
    'kanaal', 'spoor', 'scène', 'spår', 'kanał', 'ścieżka', 'scena',
    'канал', 'мікрофон', 'микрофон', 'камера', 'сцена', 'трек', 'лінія', 'линия',
    'hat', 'sahne', 'kanala', 'eszena', 'kamera',
    // Árabe / Farsi
    'قناة', 'مايك', 'ميكروفون', 'كاميرا', 'مشهد', 'خط', 'رقم',
    'کانال', 'میکروفون', 'دوربین', 'صحنه', 'خط', 'شماره'
  ]);

  // En Euskera el numeral "bat" se pospone al sustantivo ("kanal bat", "mikro bat"),
  // pero también puede ir seguido de "kanala", "zenbakia", etc.
  const TECHNICAL_FOLLOWING_WORDS_EU = new Set([
    'kanala', 'kanal', 'mikroa', 'mikro', 'mikrofonoa', 'faderra', 'fader',
    'kamera', 'pista', 'eszena', 'linea', 'universoa', 'zenbakia', 'botoia'
  ]);

  // ============================================================================
  // 2. NORMALIZACIÓN DE DÍGITOS ORIENTALES (ÁRABE / FARSI) A OCCIDENTALES (0-9)
  // ============================================================================
  const EASTERN_DIGIT_MAP = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
  };

  function convertEasternDigits(str) {
    return str.replace(/[٠-٩۰-۹]/g, (ch) => EASTERN_DIGIT_MAP[ch] || ch);
  }

  // ============================================================================
  // 3. FAMILIA 4: PARSER POSICIONAL CJK (CHINO zh, JAPONÉS ja, COREANO ko)
  // ============================================================================
  // Modismos frecuentes con caracteres numéricos que NO deben convertirse en cifras
  const CJK_PROTECTED_IDIOMS = [
    '一般', '一起', '一定', '一下', '一样', '一直', '一共', '一切', '万一', '一旦',
    '一会儿', '一边', '一面', '一致', '一齐', '一再', '一带', '一流', '一贯', '一概',
    '一向', '一味', '一晃', '一举', '一早', '一旁', '一不小心', '一点儿', '一点点',
    '一緒', '一番', '一日', '一昨日', '一昨年', '一斉', '一応', '一気', '一瞬', '一生',
    '一杯', '一部', '一通り', '一ヶ月', '一か月', '一つ', '二つ', '三つ', '四つ',
    '五つ', '六つ', '七つ', '八つ', '九つ', '十分'
  ];

  const CJK_DIGITS = {
    '零': 0, '〇': 0,
    '一': 1, '幺': 1, '壹': 1,
    '二': 2, '两': 2, '兩': 2, '贰': 2,
    '三': 3, '叁': 3,
    '四': 4, '肆': 4,
    '五': 5, '伍': 5,
    '六': 6, '陆': 6,
    '七': 7, '柒': 7,
    '八': 8, '捌': 8,
    '九': 9, '玖': 9
  };

  const CJK_MULTIPLIERS = {
    '十': 10, '拾': 10,
    '百': 100, '佰': 100,
    '千': 1000, '仟': 1000,
    '万': 10000, '萬': 10000,
    '亿': 100000000, '億': 100000000
  };

  function parseCjkIntSegment(seg) {
    if (!seg) return null;
    // Si son solo dígitos puros sin multiplicadores (ej. "一二三" o "幺二"), convertir dígito a dígito
    let hasMultiplier = false;
    for (let i = 0; i < seg.length; i++) {
      if (CJK_MULTIPLIERS[seg[i]] !== undefined) {
        hasMultiplier = true;
        break;
      }
    }
    if (!hasMultiplier) {
      let out = '';
      for (let i = 0; i < seg.length; i++) {
        const d = CJK_DIGITS[seg[i]];
        if (d === undefined) return null;
        out += String(d);
      }
      return out;
    }

    let total = 0;
    let section = 0;
    let currentDigit = 0;
    let hasPendingDigit = false;

    for (let i = 0; i < seg.length; i++) {
      const ch = seg[i];
      if (CJK_DIGITS[ch] !== undefined) {
        currentDigit = CJK_DIGITS[ch];
        hasPendingDigit = true;
      } else if (CJK_MULTIPLIERS[ch] !== undefined) {
        const mult = CJK_MULTIPLIERS[ch];
        if (mult >= 10000) {
          section += (hasPendingDigit ? currentDigit : 0);
          if (section === 0) section = 1;
          total += section * mult;
          section = 0;
        } else {
          const factor = hasPendingDigit ? currentDigit : 1;
          section += factor * mult;
        }
        currentDigit = 0;
        hasPendingDigit = false;
      }
    }
    total += section + (hasPendingDigit ? currentDigit : 0);
    return String(total);
  }

  function normalizeCjkNumbers(text, lang) {
    if (!text) return text;
    // Proteger modismos comunes con marcadores temporales
    const placeholders = [];
    let protectedText = text;
    for (let i = 0; i < CJK_PROTECTED_IDIOMS.length; i++) {
      const idiom = CJK_PROTECTED_IDIOMS[i];
      if (protectedText.includes(idiom)) {
        const token = `\uE000CJK_${i}\uE001`;
        placeholders.push({ token, idiom });
        protectedText = protectedText.split(idiom).join(token);
      }
    }

    // Reemplazar secuencias numéricas CJK (incluyendo decimales con 点/點)
    const cjkRegex = /[零〇一幺壹二两兩贰三叁四肆五伍六陆七柒八捌九玖十拾百佰千仟万萬亿億]+(?:[点點][零〇一幺壹二两兩贰三叁四肆五伍六陆七柒八捌九玖]+)?/g;
    protectedText = protectedText.replace(cjkRegex, (match, offset, fullStr) => {
      // Escudo de ambigüedad para un único carácter "一" aislado sin contexto técnico
      if (match === '一') {
        const prevChar = offset > 0 ? fullStr[offset - 1] : '';
        const nextSlice = fullStr.slice(offset + 1, offset + 4);
        const isTechContext = /^(号|通道|频道|路|轨|段|秒|分|点|番|チャンネル|ch|,|，|、|\s*[0-9二三四五六七八九])/i.test(nextSlice) ||
                              /(第|通道|频道|路|轨|号|ch|,|，|、)$/i.test(prevChar);
        if (!isTechContext && fullStr.trim() !== '一') {
          return match;
        }
      }

      if (match.includes('点') || match.includes('點')) {
        const sep = match.includes('点') ? '点' : '點';
        const parts = match.split(sep);
        const intPart = parseCjkIntSegment(parts[0]);
        let decPart = '';
        for (let ch of (parts[1] || '')) {
          if (CJK_DIGITS[ch] !== undefined) decPart += String(CJK_DIGITS[ch]);
        }
        if (intPart !== null && decPart.length > 0) {
          return `${intPart}.${decPart}`;
        }
      }

      const parsed = parseCjkIntSegment(match);
      return parsed !== null ? parsed : match;
    });

    // Restaurar modismos protegidos
    for (let i = 0; i < placeholders.length; i++) {
      protectedText = protectedText.split(placeholders[i].token).join(placeholders[i].idiom);
    }

    return protectedText;
  }

  // Parser específico para bloques Sino-Coreanos sin espacio (ej. "이십사" -> "24", "백이십오" -> "125")
  const KO_SINO_DIGITS = {
    '영': 0, '공': 0,
    '일': 1, '이': 2, '삼': 3, '사': 4,
    '오': 5, '육': 6, '륙': 6, '칠': 7, '팔': 8, '구': 9
  };
  const KO_SINO_MULTS = {
    '십': 10, '백': 100, '천': 1000, '만': 10000
  };
  // Palabras coreanas comunes que empiezan o contienen sílabas homófonas a números sino-coreanos
  const KO_PROTECTED_WORDS = [
    '일반', '일단', '일찍', '일부', '일정', '일주일', '일요일', '이번', '이제', '이런', '이렇게', '이유', '이상',
    '오디오', '오늘', '오전', '오후', '오른쪽', '사운드', '사람', '사실', '사용', '시간', '시작', '시스템'
  ];

  function normalizeKoreanSinoBlocks(text) {
    if (!text) return text;
    const placeholders = [];
    let protectedText = text;
    for (let i = 0; i < KO_PROTECTED_WORDS.length; i++) {
      const w = KO_PROTECTED_WORDS[i];
      if (protectedText.includes(w)) {
        const token = `\uE000KO_${i}\uE001`;
        placeholders.push({ token, w });
        protectedText = protectedText.split(w).join(token);
      }
    }

    // Secuencias sino-coreanas que contienen al menos un multiplicador (십, 백, 천, 만) o >= 2 sílabas numéricas
    const koRegex = /[영공일이삼사오육륙칠팔구십백천만]{2,}/g;
    protectedText = protectedText.replace(koRegex, (match) => {
      let hasMult = false;
      for (let ch of match) {
        if (KO_SINO_MULTS[ch] !== undefined) {
          hasMult = true;
          break;
        }
      }
      if (!hasMult) {
        let out = '';
        for (let ch of match) {
          if (KO_SINO_DIGITS[ch] === undefined) return match;
          out += String(KO_SINO_DIGITS[ch]);
        }
        return out;
      }
      let total = 0;
      let section = 0;
      let current = 0;
      let hasDigit = false;
      for (let ch of match) {
        if (KO_SINO_DIGITS[ch] !== undefined) {
          current = KO_SINO_DIGITS[ch];
          hasDigit = true;
        } else if (KO_SINO_MULTS[ch] !== undefined) {
          const m = KO_SINO_MULTS[ch];
          if (m >= 10000) {
            section += (hasDigit ? current : 1);
            total += section * m;
            section = 0;
          } else {
            section += (hasDigit ? current : 1) * m;
          }
          current = 0;
          hasDigit = false;
        }
      }
      total += section + (hasDigit ? current : 0);
      return String(total);
    });

    for (let i = 0; i < placeholders.length; i++) {
      protectedText = protectedText.split(placeholders[i].token).join(placeholders[i].w);
    }
    return protectedText;
  }

  // ============================================================================
  // 4. DICCIONARIOS LÉXICOS MULTILINGÜES (FAMILIAS 1, 2 Y 3)
  // ============================================================================
  // Tipos de tokens numéricos:
  // - 'zero': 0
  // - 'unit': 1..9
  // - 'teen': 10..19 (o compuestos cerrados 21..29 en español)
  // - 'ten': 20, 30, 40, 50, 60, 70, 80, 90
  // - 'vigesimal_add': 20, 40, 60, 80 que esperan suma de 1..19 (ej. euskera "hogeita", francés "quatre-vingt")
  // - 'hundred_exact': 100, 200, 300..900 (ej. "doscientos", "berrehun", "двести")
  // - 'mult': 100 ("cien"/"hundred"), 1000 ("mil"/"thousand"), 1000000 ("millón"/"million")

  function buildLexicon() {
    const lex = {};

    const addEntries = (lang, mapObj) => {
      if (!lex[lang]) lex[lang] = { words: new Map(), connectors: new Set(), decimals: new Map(), ambiguousOnes: new Set(), nonPronounOnes: new Set() };
      const target = lex[lang];
      if (mapObj.words) {
        for (const [k, v] of Object.entries(mapObj.words)) {
          target.words.set(k.toLowerCase(), v);
        }
      }
      if (mapObj.connectors) {
        mapObj.connectors.forEach(c => target.connectors.add(c.toLowerCase()));
      }
      if (mapObj.decimals) {
        for (const [k, v] of Object.entries(mapObj.decimals)) {
          target.decimals.set(k.toLowerCase(), v);
        }
      }
      if (mapObj.ambiguousOnes) {
        mapObj.ambiguousOnes.forEach(w => target.ambiguousOnes.add(w.toLowerCase()));
      }
      if (mapObj.nonPronounOnes) {
        mapObj.nonPronounOnes.forEach(w => target.nonPronounOnes.add(w.toLowerCase()));
      }
    };

    // ── 1. ESPAÑOL (es) ──
    addEntries('es', {
      words: {
        'cero': { val: 0, type: 'zero' },
        'uno': { val: 1, type: 'unit' }, 'un': { val: 1, type: 'unit' }, 'una': { val: 1, type: 'unit' },
        'dos': { val: 2, type: 'unit' }, 'tres': { val: 3, type: 'unit' }, 'cuatro': { val: 4, type: 'unit' },
        'cinco': { val: 5, type: 'unit' }, 'seis': { val: 6, type: 'unit' }, 'siete': { val: 7, type: 'unit' },
        'ocho': { val: 8, type: 'unit' }, 'nueve': { val: 9, type: 'unit' },
        'diez': { val: 10, type: 'teen' }, 'once': { val: 11, type: 'teen' }, 'doce': { val: 12, type: 'teen' },
        'trece': { val: 13, type: 'teen' }, 'catorce': { val: 14, type: 'teen' }, 'quince': { val: 15, type: 'teen' },
        'dieciséis': { val: 16, type: 'teen' }, 'dieciseis': { val: 16, type: 'teen' },
        'diecisiete': { val: 17, type: 'teen' }, 'dieciocho': { val: 18, type: 'teen' }, 'diecinueve': { val: 19, type: 'teen' },
        'veinte': { val: 20, type: 'ten' },
        'veintiuno': { val: 21, type: 'teen' }, 'veintiún': { val: 21, type: 'teen' }, 'veintiun': { val: 21, type: 'teen' }, 'veintiuna': { val: 21, type: 'teen' },
        'veintidós': { val: 22, type: 'teen' }, 'veintidos': { val: 22, type: 'teen' },
        'veintitrés': { val: 23, type: 'teen' }, 'veintitres': { val: 23, type: 'teen' },
        'veinticuatro': { val: 24, type: 'teen' }, 'veinticinco': { val: 25, type: 'teen' },
        'veintiséis': { val: 26, type: 'teen' }, 'veintiseis': { val: 26, type: 'teen' },
        'veintisiete': { val: 27, type: 'teen' }, 'veintiocho': { val: 28, type: 'teen' }, 'veintinueve': { val: 29, type: 'teen' },
        'treinta': { val: 30, type: 'ten' }, 'cuarenta': { val: 40, type: 'ten' }, 'cincuenta': { val: 50, type: 'ten' },
        'sesenta': { val: 60, type: 'ten' }, 'setenta': { val: 70, type: 'ten' }, 'ochenta': { val: 80, type: 'ten' }, 'noventa': { val: 90, type: 'ten' },
        'cien': { val: 100, type: 'hundred_exact' }, 'ciento': { val: 100, type: 'hundred_exact' },
        'doscientos': { val: 200, type: 'hundred_exact' }, 'doscientas': { val: 200, type: 'hundred_exact' },
        'trescientos': { val: 300, type: 'hundred_exact' }, 'trescientas': { val: 300, type: 'hundred_exact' },
        'cuatrocientos': { val: 400, type: 'hundred_exact' }, 'cuatrocientas': { val: 400, type: 'hundred_exact' },
        'quinientos': { val: 500, type: 'hundred_exact' }, 'quinientas': { val: 500, type: 'hundred_exact' },
        'seiscientos': { val: 600, type: 'hundred_exact' }, 'seiscientas': { val: 600, type: 'hundred_exact' },
        'setecientos': { val: 700, type: 'hundred_exact' }, 'setecientas': { val: 700, type: 'hundred_exact' },
        'ochocientos': { val: 800, type: 'hundred_exact' }, 'ochocientas': { val: 800, type: 'hundred_exact' },
        'novecientos': { val: 900, type: 'hundred_exact' }, 'novecientas': { val: 900, type: 'hundred_exact' },
        'mil': { val: 1000, type: 'mult' },
        'millón': { val: 1000000, type: 'mult' }, 'millon': { val: 1000000, type: 'mult' }, 'millones': { val: 1000000, type: 'mult' }
      },
      connectors: ['y'],
      decimals: { 'coma': ',', 'punto': '.' },
      ambiguousOnes: ['un', 'una', 'uno'],
      nonPronounOnes: ['uno']
    });

    // ── 2. INGLÉS (en) ──
    addEntries('en', {
      words: {
        'zero': { val: 0, type: 'zero' },
        'one': { val: 1, type: 'unit' }, 'two': { val: 2, type: 'unit' }, 'three': { val: 3, type: 'unit' },
        'four': { val: 4, type: 'unit' }, 'five': { val: 5, type: 'unit' }, 'six': { val: 6, type: 'unit' },
        'seven': { val: 7, type: 'unit' }, 'eight': { val: 8, type: 'unit' }, 'nine': { val: 9, type: 'unit' },
        'ten': { val: 10, type: 'teen' }, 'eleven': { val: 11, type: 'teen' }, 'twelve': { val: 12, type: 'teen' },
        'thirteen': { val: 13, type: 'teen' }, 'fourteen': { val: 14, type: 'teen' }, 'fifteen': { val: 15, type: 'teen' },
        'sixteen': { val: 16, type: 'teen' }, 'seventeen': { val: 17, type: 'teen' }, 'eighteen': { val: 18, type: 'teen' }, 'nineteen': { val: 19, type: 'teen' },
        'twenty': { val: 20, type: 'ten' }, 'thirty': { val: 30, type: 'ten' }, 'forty': { val: 40, type: 'ten' },
        'fifty': { val: 50, type: 'ten' }, 'sixty': { val: 60, type: 'ten' }, 'seventy': { val: 70, type: 'ten' },
        'eighty': { val: 80, type: 'ten' }, 'ninety': { val: 90, type: 'ten' },
        'hundred': { val: 100, type: 'mult' },
        'thousand': { val: 1000, type: 'mult' },
        'million': { val: 1000000, type: 'mult' }
      },
      connectors: ['and'],
      decimals: { 'point': '.', 'dot': '.' },
      ambiguousOnes: ['one'],
      nonPronounOnes: ['one']
    });

    // ── 3. EUSKERA (eu) — Sistema Vigesimal (Base 20) ──
    addEntries('eu', {
      words: {
        'zero': { val: 0, type: 'zero' }, 'huts': { val: 0, type: 'zero' },
        'bat': { val: 1, type: 'unit' }, 'bi': { val: 2, type: 'unit' }, 'hiru': { val: 3, type: 'unit' },
        'lau': { val: 4, type: 'unit' }, 'bost': { val: 5, type: 'unit' }, 'sei': { val: 6, type: 'unit' },
        'zazpi': { val: 7, type: 'unit' }, 'zortzi': { val: 8, type: 'unit' }, 'bederatzi': { val: 9, type: 'unit' },
        'hamar': { val: 10, type: 'teen' }, 'hamaika': { val: 11, type: 'teen' }, 'hamabi': { val: 12, type: 'teen' },
        'hamahiru': { val: 13, type: 'teen' }, 'hamalau': { val: 14, type: 'teen' }, 'hamabost': { val: 15, type: 'teen' },
        'hamasei': { val: 16, type: 'teen' }, 'hamazazpi': { val: 17, type: 'teen' },
        'hemezortzi': { val: 18, type: 'teen' }, 'hamazortzi': { val: 18, type: 'teen' },
        'hemeretzi': { val: 19, type: 'teen' },
        'hogei': { val: 20, type: 'vigesimal_add' }, 'hogeita': { val: 20, type: 'vigesimal_add' },
        'berrogei': { val: 40, type: 'vigesimal_add' }, 'berrogeita': { val: 40, type: 'vigesimal_add' },
        'hirurogei': { val: 60, type: 'vigesimal_add' }, 'hirurogeita': { val: 60, type: 'vigesimal_add' },
        'laurogei': { val: 80, type: 'vigesimal_add' }, 'laurogeita': { val: 80, type: 'vigesimal_add' },
        'ehun': { val: 100, type: 'hundred_exact' }, 'berrehun': { val: 200, type: 'hundred_exact' },
        'hirurehun': { val: 300, type: 'hundred_exact' }, 'laurehun': { val: 400, type: 'hundred_exact' },
        'bostehun': { val: 500, type: 'hundred_exact' }, 'seiehun': { val: 600, type: 'hundred_exact' },
        'zazpiehun': { val: 700, type: 'hundred_exact' }, 'zortziehun': { val: 800, type: 'hundred_exact' },
        'bederatziehun': { val: 900, type: 'hundred_exact' },
        'mila': { val: 1000, type: 'mult' }, 'milioi': { val: 1000000, type: 'mult' }
      },
      connectors: ['eta', 'ta'],
      decimals: { 'koma': ',', 'puntu': '.' },
      ambiguousOnes: ['bat'],
      nonPronounOnes: []
    });

    // ── 4. CATALÁN (ca) ──
    addEntries('ca', {
      words: {
        'zero': { val: 0, type: 'zero' },
        'u': { val: 1, type: 'unit' }, 'un': { val: 1, type: 'unit' }, 'una': { val: 1, type: 'unit' },
        'dos': { val: 2, type: 'unit' }, 'dues': { val: 2, type: 'unit' }, 'tres': { val: 3, type: 'unit' },
        'quatre': { val: 4, type: 'unit' }, 'cinc': { val: 5, type: 'unit' }, 'sis': { val: 6, type: 'unit' },
        'set': { val: 7, type: 'unit' }, 'vuit': { val: 8, type: 'unit' }, 'huit': { val: 8, type: 'unit' }, 'nou': { val: 9, type: 'unit' },
        'deu': { val: 10, type: 'teen' }, 'onze': { val: 11, type: 'teen' }, 'dotze': { val: 12, type: 'teen' },
        'tretze': { val: 13, type: 'teen' }, 'catorze': { val: 14, type: 'teen' }, 'quinze': { val: 15, type: 'teen' },
        'setze': { val: 16, type: 'teen' }, 'disset': { val: 17, type: 'teen' }, 'divuit': { val: 18, type: 'teen' }, 'dinou': { val: 19, type: 'teen' },
        'vint': { val: 20, type: 'ten' }, 'trenta': { val: 30, type: 'ten' }, 'quaranta': { val: 40, type: 'ten' },
        'cinquanta': { val: 50, type: 'ten' }, 'seixanta': { val: 60, type: 'ten' }, 'setanta': { val: 70, type: 'ten' },
        'vuitanta': { val: 80, type: 'ten' }, 'huitanta': { val: 80, type: 'ten' }, 'noranta': { val: 90, type: 'ten' },
        'cent': { val: 100, type: 'hundred_exact' }, 'cents': { val: 100, type: 'mult' }, 'centes': { val: 100, type: 'mult' },
        'mil': { val: 1000, type: 'mult' }, 'milió': { val: 1000000, type: 'mult' }, 'milions': { val: 1000000, type: 'mult' }
      },
      connectors: ['i'],
      decimals: { 'coma': ',', 'punt': '.' },
      ambiguousOnes: ['u', 'un', 'una'],
      nonPronounOnes: ['u']
    });

    // ── 5. GALLEGO (gl) ──
    addEntries('gl', {
      words: {
        'cero': { val: 0, type: 'zero' },
        'un': { val: 1, type: 'unit' }, 'unha': { val: 1, type: 'unit' },
        'dous': { val: 2, type: 'unit' }, 'dúas': { val: 2, type: 'unit' }, 'duas': { val: 2, type: 'unit' },
        'tres': { val: 3, type: 'unit' }, 'catro': { val: 4, type: 'unit' }, 'cinco': { val: 5, type: 'unit' },
        'seis': { val: 6, type: 'unit' }, 'sete': { val: 7, type: 'unit' }, 'oito': { val: 8, type: 'unit' }, 'nove': { val: 9, type: 'unit' },
        'dez': { val: 10, type: 'teen' }, 'once': { val: 11, type: 'teen' }, 'doce': { val: 12, type: 'teen' },
        'trece': { val: 13, type: 'teen' }, 'catorce': { val: 14, type: 'teen' }, 'quince': { val: 15, type: 'teen' },
        'dezaseis': { val: 16, type: 'teen' }, 'dezasete': { val: 17, type: 'teen' }, 'dezaoito': { val: 18, type: 'teen' }, 'dezanove': { val: 19, type: 'teen' },
        'vinte': { val: 20, type: 'ten' }, 'trinta': { val: 30, type: 'ten' }, 'corenta': { val: 40, type: 'ten' },
        'cincuenta': { val: 50, type: 'ten' }, 'sesenta': { val: 60, type: 'ten' }, 'setenta': { val: 70, type: 'ten' },
        'oitenta': { val: 80, type: 'ten' }, 'noventa': { val: 90, type: 'ten' },
        'cen': { val: 100, type: 'hundred_exact' }, 'cento': { val: 100, type: 'hundred_exact' },
        'douscentos': { val: 200, type: 'hundred_exact' }, 'duascentas': { val: 200, type: 'hundred_exact' },
        'trescentos': { val: 300, type: 'hundred_exact' }, 'catrocentos': { val: 400, type: 'hundred_exact' },
        'quiñentos': { val: 500, type: 'hundred_exact' }, 'seiscentos': { val: 600, type: 'hundred_exact' },
        'setecentos': { val: 700, type: 'hundred_exact' }, 'oitocentos': { val: 800, type: 'hundred_exact' },
        'novecentos': { val: 900, type: 'hundred_exact' },
        'mil': { val: 1000, type: 'mult' }, 'millón': { val: 1000000, type: 'mult' }, 'millóns': { val: 1000000, type: 'mult' }
      },
      connectors: ['e'],
      decimals: { 'coma': ',', 'punto': '.' },
      ambiguousOnes: ['un', 'unha'],
      nonPronounOnes: []
    });

    // ── 6. FRANCÉS (fr) — Decimal + Vigesimal (70-99) ──
    addEntries('fr', {
      words: {
        'zéro': { val: 0, type: 'zero' }, 'zero': { val: 0, type: 'zero' },
        'un': { val: 1, type: 'unit' }, 'une': { val: 1, type: 'unit' },
        'deux': { val: 2, type: 'unit' }, 'trois': { val: 3, type: 'unit' }, 'quatre': { val: 4, type: 'unit' },
        'cinq': { val: 5, type: 'unit' }, 'six': { val: 6, type: 'unit' }, 'sept': { val: 7, type: 'unit' },
        'huit': { val: 8, type: 'unit' }, 'neuf': { val: 9, type: 'unit' },
        'dix': { val: 10, type: 'teen' }, 'onze': { val: 11, type: 'teen' }, 'douze': { val: 12, type: 'teen' },
        'treize': { val: 13, type: 'teen' }, 'quatorze': { val: 14, type: 'teen' }, 'quinze': { val: 15, type: 'teen' },
        'seize': { val: 16, type: 'teen' }, 'dix-sept': { val: 17, type: 'teen' }, 'dix-huit': { val: 18, type: 'teen' }, 'dix-neuf': { val: 19, type: 'teen' },
        'vingt': { val: 20, type: 'ten' }, 'trente': { val: 30, type: 'ten' }, 'quarante': { val: 40, type: 'ten' },
        'cinquante': { val: 50, type: 'ten' }, 'soixante': { val: 60, type: 'vigesimal_add' },
        'septante': { val: 70, type: 'ten' }, 'huitante': { val: 80, type: 'ten' }, 'octante': { val: 80, type: 'ten' }, 'nonante': { val: 90, type: 'ten' },
        'quatre-vingts': { val: 80, type: 'vigesimal_add' }, 'quatre-vingt': { val: 80, type: 'vigesimal_add' },
        'cent': { val: 100, type: 'mult' }, 'cents': { val: 100, type: 'mult' },
        'mille': { val: 1000, type: 'mult' }, 'million': { val: 1000000, type: 'mult' }, 'millions': { val: 1000000, type: 'mult' }
      },
      connectors: ['et'],
      decimals: { 'virgule': ',', 'point': '.' },
      ambiguousOnes: ['un', 'une'],
      nonPronounOnes: []
    });

    // ── 7. ALEMÁN (de) ──
    addEntries('de', {
      words: {
        'null': { val: 0, type: 'zero' },
        'eins': { val: 1, type: 'unit' }, 'ein': { val: 1, type: 'unit' }, 'eine': { val: 1, type: 'unit' },
        'zwei': { val: 2, type: 'unit' }, 'zwo': { val: 2, type: 'unit' }, 'drei': { val: 3, type: 'unit' },
        'vier': { val: 4, type: 'unit' }, 'fünf': { val: 5, type: 'unit' }, 'fuenf': { val: 5, type: 'unit' },
        'sechs': { val: 6, type: 'unit' }, 'sieben': { val: 7, type: 'unit' }, 'acht': { val: 8, type: 'unit' }, 'neun': { val: 9, type: 'unit' },
        'zehn': { val: 10, type: 'teen' }, 'elf': { val: 11, type: 'teen' }, 'zwölf': { val: 12, type: 'teen' }, 'zwoelf': { val: 12, type: 'teen' },
        'dreizehn': { val: 13, type: 'teen' }, 'vierzehn': { val: 14, type: 'teen' }, 'fünfzehn': { val: 15, type: 'teen' }, 'fuenfzehn': { val: 15, type: 'teen' },
        'sechzehn': { val: 16, type: 'teen' }, 'siebzehn': { val: 17, type: 'teen' }, 'achtzehn': { val: 18, type: 'teen' }, 'neunzehn': { val: 19, type: 'teen' },
        'zwanzig': { val: 20, type: 'ten' }, 'dreißig': { val: 30, type: 'ten' }, 'dreissig': { val: 30, type: 'ten' },
        'vierzig': { val: 40, type: 'ten' }, 'fünfzig': { val: 50, type: 'ten' }, 'fuenfzig': { val: 50, type: 'ten' },
        'sechzig': { val: 60, type: 'ten' }, 'siebzig': { val: 70, type: 'ten' }, 'achtzig': { val: 80, type: 'ten' }, 'neunzig': { val: 90, type: 'ten' },
        'hundert': { val: 100, type: 'mult' }, 'einhundert': { val: 100, type: 'hundred_exact' },
        'tausend': { val: 1000, type: 'mult' }, 'eintausend': { val: 1000, type: 'mult' },
        'million': { val: 1000000, type: 'mult' }, 'millionen': { val: 1000000, type: 'mult' }
      },
      connectors: ['und'],
      decimals: { 'komma': ',', 'punkt': '.' },
      ambiguousOnes: ['ein', 'eine'],
      nonPronounOnes: ['eins']
    });

    // ── 8. ITALIANO (it) ──
    addEntries('it', {
      words: {
        'zero': { val: 0, type: 'zero' },
        'uno': { val: 1, type: 'unit' }, 'un': { val: 1, type: 'unit' }, 'una': { val: 1, type: 'unit' },
        'due': { val: 2, type: 'unit' }, 'tre': { val: 3, type: 'unit' }, 'tré': { val: 3, type: 'unit' },
        'quattro': { val: 4, type: 'unit' }, 'cinque': { val: 5, type: 'unit' }, 'sei': { val: 6, type: 'unit' },
        'sette': { val: 7, type: 'unit' }, 'otto': { val: 8, type: 'unit' }, 'nove': { val: 9, type: 'unit' },
        'dieci': { val: 10, type: 'teen' }, 'undici': { val: 11, type: 'teen' }, 'dodici': { val: 12, type: 'teen' },
        'tredici': { val: 13, type: 'teen' }, 'quattordici': { val: 14, type: 'teen' }, 'quindici': { val: 15, type: 'teen' },
        'sedici': { val: 16, type: 'teen' }, 'diciassette': { val: 17, type: 'teen' }, 'diciotto': { val: 18, type: 'teen' }, 'diciannove': { val: 19, type: 'teen' },
        'venti': { val: 20, type: 'ten' }, 'trenta': { val: 30, type: 'ten' }, 'quaranta': { val: 40, type: 'ten' },
        'cinquanta': { val: 50, type: 'ten' }, 'sessanta': { val: 60, type: 'ten' }, 'settanta': { val: 70, type: 'ten' },
        'ottanta': { val: 80, type: 'ten' }, 'novanta': { val: 90, type: 'ten' },
        'cento': { val: 100, type: 'mult' },
        'mille': { val: 1000, type: 'mult' }, 'mila': { val: 1000, type: 'mult' },
        'milione': { val: 1000000, type: 'mult' }, 'milioni': { val: 1000000, type: 'mult' }
      },
      connectors: ['e'],
      decimals: { 'virgola': ',', 'punto': '.' },
      ambiguousOnes: ['uno', 'un', 'una'],
      nonPronounOnes: ['uno']
    });

    // ── 9. PORTUGUÉS (pt) ──
    addEntries('pt', {
      words: {
        'zero': { val: 0, type: 'zero' },
        'um': { val: 1, type: 'unit' }, 'uma': { val: 1, type: 'unit' },
        'dois': { val: 2, type: 'unit' }, 'duas': { val: 2, type: 'unit' }, 'três': { val: 3, type: 'unit' }, 'tres': { val: 3, type: 'unit' },
        'quatro': { val: 4, type: 'unit' }, 'cinco': { val: 5, type: 'unit' }, 'seis': { val: 6, type: 'unit' }, 'meia': { val: 6, type: 'unit' },
        'sete': { val: 7, type: 'unit' }, 'oito': { val: 8, type: 'unit' }, 'nove': { val: 9, type: 'unit' },
        'dez': { val: 10, type: 'teen' }, 'onze': { val: 11, type: 'teen' }, 'doze': { val: 12, type: 'teen' },
        'treze': { val: 13, type: 'teen' }, 'quatorze': { val: 14, type: 'teen' }, 'catorze': { val: 14, type: 'teen' }, 'quinze': { val: 15, type: 'teen' },
        'dezesseis': { val: 16, type: 'teen' }, 'dezasseis': { val: 16, type: 'teen' },
        'dezessete': { val: 17, type: 'teen' }, 'dezassete': { val: 17, type: 'teen' },
        'dezoito': { val: 18, type: 'teen' }, 'dezenove': { val: 19, type: 'teen' }, 'dezanove': { val: 19, type: 'teen' },
        'vinte': { val: 20, type: 'ten' }, 'trinta': { val: 30, type: 'ten' }, 'quarenta': { val: 40, type: 'ten' },
        'cinquenta': { val: 50, type: 'ten' }, 'sessenta': { val: 60, type: 'ten' }, 'setenta': { val: 70, type: 'ten' },
        'oitenta': { val: 80, type: 'ten' }, 'noventa': { val: 90, type: 'ten' },
        'cem': { val: 100, type: 'hundred_exact' }, 'cento': { val: 100, type: 'hundred_exact' },
        'duzentos': { val: 200, type: 'hundred_exact' }, 'duzentas': { val: 200, type: 'hundred_exact' },
        'trezentos': { val: 300, type: 'hundred_exact' }, 'trezentas': { val: 300, type: 'hundred_exact' },
        'quatrocentos': { val: 400, type: 'hundred_exact' }, 'quatrocentas': { val: 400, type: 'hundred_exact' },
        'quinhentos': { val: 500, type: 'hundred_exact' }, 'quinhentas': { val: 500, type: 'hundred_exact' },
        'seiscentos': { val: 600, type: 'hundred_exact' }, 'seiscentas': { val: 600, type: 'hundred_exact' },
        'setecentos': { val: 700, type: 'hundred_exact' }, 'setecentas': { val: 700, type: 'hundred_exact' },
        'oitocentos': { val: 800, type: 'hundred_exact' }, 'oitocentas': { val: 800, type: 'hundred_exact' },
        'novecentos': { val: 900, type: 'hundred_exact' }, 'novecentas': { val: 900, type: 'hundred_exact' },
        'mil': { val: 1000, type: 'mult' }, 'milhão': { val: 1000000, type: 'mult' }, 'milhões': { val: 1000000, type: 'mult' }
      },
      connectors: ['e'],
      decimals: { 'vírgula': ',', 'virgula': ',', 'ponto': '.' },
      ambiguousOnes: ['um', 'uma'],
      nonPronounOnes: []
    });

    // ── 10. HOLANDÉS (nl) ──
    addEntries('nl', {
      words: {
        'nul': { val: 0, type: 'zero' },
        'een': { val: 1, type: 'unit' }, 'één': { val: 1, type: 'unit' },
        'twee': { val: 2, type: 'unit' }, 'drie': { val: 3, type: 'unit' }, 'vier': { val: 4, type: 'unit' },
        'vijf': { val: 5, type: 'unit' }, 'zes': { val: 6, type: 'unit' }, 'zeven': { val: 7, type: 'unit' },
        'acht': { val: 8, type: 'unit' }, 'negen': { val: 9, type: 'unit' },
        'tien': { val: 10, type: 'teen' }, 'elf': { val: 11, type: 'teen' }, 'twaalf': { val: 12, type: 'teen' },
        'dertien': { val: 13, type: 'teen' }, 'veertien': { val: 14, type: 'teen' }, 'vijftien': { val: 15, type: 'teen' },
        'zestien': { val: 16, type: 'teen' }, 'zeventien': { val: 17, type: 'teen' }, 'achttien': { val: 18, type: 'teen' }, 'negentien': { val: 19, type: 'teen' },
        'twintig': { val: 20, type: 'ten' }, 'dertig': { val: 30, type: 'ten' }, 'veertig': { val: 40, type: 'ten' },
        'vijftig': { val: 50, type: 'ten' }, 'zestig': { val: 60, type: 'ten' }, 'zeventig': { val: 70, type: 'ten' },
        'tachtig': { val: 80, type: 'ten' }, 'negentig': { val: 90, type: 'ten' },
        'honderd': { val: 100, type: 'mult' }, 'duizend': { val: 1000, type: 'mult' }, 'miljoen': { val: 1000000, type: 'mult' }
      },
      connectors: ['en'],
      decimals: { 'komma': ',', 'punt': '.' },
      ambiguousOnes: ['een'],
      nonPronounOnes: ['één']
    });

    // ── 11. SUECO (sv) ──
    addEntries('sv', {
      words: {
        'noll': { val: 0, type: 'zero' },
        'en': { val: 1, type: 'unit' }, 'ett': { val: 1, type: 'unit' },
        'två': { val: 2, type: 'unit' }, 'tva': { val: 2, type: 'unit' }, 'tre': { val: 3, type: 'unit' },
        'fyra': { val: 4, type: 'unit' }, 'fem': { val: 5, type: 'unit' }, 'sex': { val: 6, type: 'unit' },
        'sju': { val: 7, type: 'unit' }, 'åtta': { val: 8, type: 'unit' }, 'atta': { val: 8, type: 'unit' }, 'nio': { val: 9, type: 'unit' },
        'tio': { val: 10, type: 'teen' }, 'elva': { val: 11, type: 'teen' }, 'tolv': { val: 12, type: 'teen' },
        'tretton': { val: 13, type: 'teen' }, 'fjorton': { val: 14, type: 'teen' }, 'femton': { val: 15, type: 'teen' },
        'sexton': { val: 16, type: 'teen' }, 'sjutton': { val: 17, type: 'teen' }, 'arton': { val: 18, type: 'teen' }, 'nitton': { val: 19, type: 'teen' },
        'tjugo': { val: 20, type: 'ten' }, 'trettio': { val: 30, type: 'ten' }, 'fyrtio': { val: 40, type: 'ten' },
        'femtio': { val: 50, type: 'ten' }, 'sextio': { val: 60, type: 'ten' }, 'sjuttio': { val: 70, type: 'ten' },
        'åttio': { val: 80, type: 'ten' }, 'attio': { val: 80, type: 'ten' }, 'nittio': { val: 90, type: 'ten' },
        'hundra': { val: 100, type: 'mult' }, 'tusen': { val: 1000, type: 'mult' }, 'miljon': { val: 1000000, type: 'mult' }
      },
      connectors: ['och'],
      decimals: { 'komma': ',', 'punkt': '.' },
      ambiguousOnes: ['en', 'ett'],
      nonPronounOnes: []
    });

    // ── 12. POLACO (pl) ──
    addEntries('pl', {
      words: {
        'zero': { val: 0, type: 'zero' },
        'jeden': { val: 1, type: 'unit' }, 'jedna': { val: 1, type: 'unit' }, 'jedno': { val: 1, type: 'unit' },
        'dwa': { val: 2, type: 'unit' }, 'dwie': { val: 2, type: 'unit' }, 'trzy': { val: 3, type: 'unit' },
        'cztery': { val: 4, type: 'unit' }, 'pięć': { val: 5, type: 'unit' }, 'piec': { val: 5, type: 'unit' },
        'sześć': { val: 6, type: 'unit' }, 'szesc': { val: 6, type: 'unit' }, 'siedem': { val: 7, type: 'unit' },
        'osiem': { val: 8, type: 'unit' }, 'dziewięć': { val: 9, type: 'unit' }, 'dziewiec': { val: 9, type: 'unit' },
        'dziesięć': { val: 10, type: 'teen' }, 'dziesiec': { val: 10, type: 'teen' },
        'jedenaście': { val: 11, type: 'teen' }, 'jedenascie': { val: 11, type: 'teen' },
        'dwanaście': { val: 12, type: 'teen' }, 'dwanascie': { val: 12, type: 'teen' },
        'trzynaście': { val: 13, type: 'teen' }, 'czternaście': { val: 14, type: 'teen' },
        'piętnaście': { val: 15, type: 'teen' }, 'szesnaście': { val: 16, type: 'teen' },
        'siedemnaście': { val: 17, type: 'teen' }, 'osiemnaście': { val: 18, type: 'teen' }, 'dziewiętnaście': { val: 19, type: 'teen' },
        'dwadzieścia': { val: 20, type: 'ten' }, 'dwadziescia': { val: 20, type: 'ten' },
        'trzydzieści': { val: 30, type: 'ten' }, 'czterdzieści': { val: 40, type: 'ten' },
        'pięćdziesiąt': { val: 50, type: 'ten' }, 'sześćdziesiąt': { val: 60, type: 'ten' },
        'siedemdziesiąt': { val: 70, type: 'ten' }, 'osiemdziesiąt': { val: 80, type: 'ten' }, 'dziewięćdziesiąt': { val: 90, type: 'ten' },
        'sto': { val: 100, type: 'hundred_exact' }, 'dwieście': { val: 200, type: 'hundred_exact' },
        'trzysta': { val: 300, type: 'hundred_exact' }, 'czterysta': { val: 400, type: 'hundred_exact' },
        'pięćset': { val: 500, type: 'hundred_exact' }, 'sześćset': { val: 600, type: 'hundred_exact' },
        'siedemset': { val: 700, type: 'hundred_exact' }, 'osiemset': { val: 800, type: 'hundred_exact' }, 'dziewięćset': { val: 900, type: 'hundred_exact' },
        'tysiąc': { val: 1000, type: 'mult' }, 'tysiące': { val: 1000, type: 'mult' }, 'tysięcy': { val: 1000, type: 'mult' }
      },
      connectors: ['i'],
      decimals: { 'przecinek': ',', 'kropka': '.' },
      ambiguousOnes: ['jeden', 'jedna', 'jedno'],
      nonPronounOnes: ['jeden']
    });

    // ── 13. RUSO (ru) ──
    addEntries('ru', {
      words: {
        'ноль': { val: 0, type: 'zero' }, 'нуль': { val: 0, type: 'zero' },
        'один': { val: 1, type: 'unit' }, 'одна': { val: 1, type: 'unit' }, 'одно': { val: 1, type: 'unit' }, 'раз': { val: 1, type: 'unit' },
        'два': { val: 2, type: 'unit' }, 'две': { val: 2, type: 'unit' }, 'три': { val: 3, type: 'unit' },
        'четыре': { val: 4, type: 'unit' }, 'пять': { val: 5, type: 'unit' }, 'шесть': { val: 6, type: 'unit' },
        'семь': { val: 7, type: 'unit' }, 'восемь': { val: 8, type: 'unit' }, 'девять': { val: 9, type: 'unit' },
        'десять': { val: 10, type: 'teen' }, 'одиннадцать': { val: 11, type: 'teen' }, 'двенадцать': { val: 12, type: 'teen' },
        'тринадцать': { val: 13, type: 'teen' }, 'четырнадцать': { val: 14, type: 'teen' }, 'пятнадцать': { val: 15, type: 'teen' },
        'шестнадцать': { val: 16, type: 'teen' }, 'семнадцать': { val: 17, type: 'teen' }, 'восемнадцать': { val: 18, type: 'teen' }, 'девятнадцать': { val: 19, type: 'teen' },
        'двадцать': { val: 20, type: 'ten' }, 'тридцать': { val: 30, type: 'ten' }, 'сорок': { val: 40, type: 'ten' },
        'пятьдесят': { val: 50, type: 'ten' }, 'шестьдесят': { val: 60, type: 'ten' }, 'семьдесят': { val: 70, type: 'ten' },
        'восемьдесят': { val: 80, type: 'ten' }, 'девяносто': { val: 90, type: 'ten' },
        'сто': { val: 100, type: 'hundred_exact' }, 'двести': { val: 200, type: 'hundred_exact' },
        'триста': { val: 300, type: 'hundred_exact' }, 'четыреста': { val: 400, type: 'hundred_exact' },
        'пятьсот': { val: 500, type: 'hundred_exact' }, 'шестьсот': { val: 600, type: 'hundred_exact' },
        'семьсот': { val: 700, type: 'hundred_exact' }, 'восемьсот': { val: 800, type: 'hundred_exact' }, 'девятьсот': { val: 900, type: 'hundred_exact' },
        'тысяча': { val: 1000, type: 'mult' }, 'тысячи': { val: 1000, type: 'mult' }, 'тысяч': { val: 1000, type: 'mult' },
        'миллион': { val: 1000000, type: 'mult' }
      },
      connectors: ['и'],
      decimals: { 'точка': '.', 'запятая': ',' },
      ambiguousOnes: ['один', 'одна', 'одно', 'раз'],
      nonPronounOnes: ['один']
    });

    // ── 14. UCRANIANO (uk) ──
    addEntries('uk', {
      words: {
        'нуль': { val: 0, type: 'zero' }, 'ноль': { val: 0, type: 'zero' },
        'один': { val: 1, type: 'unit' }, 'одна': { val: 1, type: 'unit' }, 'одне': { val: 1, type: 'unit' },
        'два': { val: 2, type: 'unit' }, 'дві': { val: 2, type: 'unit' }, 'три': { val: 3, type: 'unit' },
        'чотири': { val: 4, type: 'unit' }, 'п\'ять': { val: 5, type: 'unit' }, 'пять': { val: 5, type: 'unit' },
        'шість': { val: 6, type: 'unit' }, 'сім': { val: 7, type: 'unit' }, 'вісім': { val: 8, type: 'unit' }, 'дев\'ять': { val: 9, type: 'unit' }, 'девять': { val: 9, type: 'unit' },
        'десять': { val: 10, type: 'teen' }, 'одинадцять': { val: 11, type: 'teen' }, 'дванадцять': { val: 12, type: 'teen' },
        'тринадцять': { val: 13, type: 'teen' }, 'чотирнадцять': { val: 14, type: 'teen' }, 'п\'ятнадцять': { val: 15, type: 'teen' }, 'пятнадцять': { val: 15, type: 'teen' },
        'шістнадцять': { val: 16, type: 'teen' }, 'сімнадцять': { val: 17, type: 'teen' }, 'вісімнадцять': { val: 18, type: 'teen' }, 'дев\'ятнадцять': { val: 19, type: 'teen' }, 'девятнадцять': { val: 19, type: 'teen' },
        'двадцять': { val: 20, type: 'ten' }, 'тридцять': { val: 30, type: 'ten' }, 'сорок': { val: 40, type: 'ten' },
        'п\'ятдесят': { val: 50, type: 'ten' }, 'пятдесят': { val: 50, type: 'ten' }, 'шістдесят': { val: 60, type: 'ten' },
        'сімдесят': { val: 70, type: 'ten' }, 'вісімдесят': { val: 80, type: 'ten' }, 'дев\'яносто': { val: 90, type: 'ten' }, 'девяносто': { val: 90, type: 'ten' },
        'сто': { val: 100, type: 'hundred_exact' }, 'двісті': { val: 200, type: 'hundred_exact' },
        'триста': { val: 300, type: 'hundred_exact' }, 'чотириста': { val: 400, type: 'hundred_exact' },
        'п\'ятсот': { val: 500, type: 'hundred_exact' }, 'пятсот': { val: 500, type: 'hundred_exact' }, 'шістсот': { val: 600, type: 'hundred_exact' },
        'сімсот': { val: 700, type: 'hundred_exact' }, 'вісімсот': { val: 800, type: 'hundred_exact' }, 'дев\'ятсот': { val: 900, type: 'hundred_exact' }, 'девятсот': { val: 900, type: 'hundred_exact' },
        'тисяча': { val: 1000, type: 'mult' }, 'тисячі': { val: 1000, type: 'mult' }, 'тисяч': { val: 1000, type: 'mult' }
      },
      connectors: ['і', 'й', 'та'],
      decimals: { 'крапка': '.', 'кома': ',' },
      ambiguousOnes: ['один', 'одна', 'одне'],
      nonPronounOnes: ['один']
    });

    // ── 15. TURCO (tr) ──
    addEntries('tr', {
      words: {
        'sıfır': { val: 0, type: 'zero' }, 'sifir': { val: 0, type: 'zero' },
        'bir': { val: 1, type: 'unit' }, 'iki': { val: 2, type: 'unit' }, 'üç': { val: 3, type: 'unit' }, 'uc': { val: 3, type: 'unit' },
        'dört': { val: 4, type: 'unit' }, 'dort': { val: 4, type: 'unit' }, 'beş': { val: 5, type: 'unit' }, 'bes': { val: 5, type: 'unit' },
        'altı': { val: 6, type: 'unit' }, 'alti': { val: 6, type: 'unit' }, 'yedi': { val: 7, type: 'unit' },
        'sekiz': { val: 8, type: 'unit' }, 'dokuz': { val: 9, type: 'unit' },
        'on': { val: 10, type: 'ten' }, 'yirmi': { val: 20, type: 'ten' }, 'otuz': { val: 30, type: 'ten' },
        'kırk': { val: 40, type: 'ten' }, 'kirk': { val: 40, type: 'ten' }, 'elli': { val: 50, type: 'ten' },
        'altmış': { val: 60, type: 'ten' }, 'altmis': { val: 60, type: 'ten' }, 'yetmiş': { val: 70, type: 'ten' }, 'yetmis': { val: 70, type: 'ten' },
        'seksen': { val: 80, type: 'ten' }, 'doksan': { val: 90, type: 'ten' },
        'yüz': { val: 100, type: 'mult' }, 'yuz': { val: 100, type: 'mult' },
        'bin': { val: 1000, type: 'mult' }, 'milyon': { val: 1000000, type: 'mult' }
      },
      connectors: ['ve'],
      decimals: { 'virgül': ',', 'nokta': '.' },
      ambiguousOnes: ['bir'],
      nonPronounOnes: []
    });

    // ── 16. UZBEKO (uz) ──
    addEntries('uz', {
      words: {
        'nol': { val: 0, type: 'zero' },
        'bir': { val: 1, type: 'unit' }, 'ikki': { val: 2, type: 'unit' }, 'uch': { val: 3, type: 'unit' },
        'to\'rt': { val: 4, type: 'unit' }, 'tort': { val: 4, type: 'unit' }, 'besh': { val: 5, type: 'unit' },
        'olti': { val: 6, type: 'unit' }, 'yetti': { val: 7, type: 'unit' }, 'sakkiz': { val: 8, type: 'unit' },
        'to\'qqiz': { val: 9, type: 'unit' }, 'toqqiz': { val: 9, type: 'unit' },
        'o\'n': { val: 10, type: 'ten' }, 'on': { val: 10, type: 'ten' },
        'yigirma': { val: 20, type: 'ten' }, 'o\'ttiz': { val: 30, type: 'ten' }, 'ottiz': { val: 30, type: 'ten' },
        'qirq': { val: 40, type: 'ten' }, 'ellik': { val: 50, type: 'ten' }, 'oltmish': { val: 60, type: 'ten' },
        'yetmish': { val: 70, type: 'ten' }, 'sakson': { val: 80, type: 'ten' }, 'to\'qson': { val: 90, type: 'ten' }, 'toqson': { val: 90, type: 'ten' },
        'yuz': { val: 100, type: 'mult' }, 'ming': { val: 1000, type: 'mult' }
      },
      connectors: ['va'],
      decimals: { 'vergul': ',', 'nuqta': '.' },
      ambiguousOnes: ['bir'],
      nonPronounOnes: []
    });

    // ── 17. KAZAJO (kk) ──
    addEntries('kk', {
      words: {
        'нөл': { val: 0, type: 'zero' }, 'ноль': { val: 0, type: 'zero' },
        'бір': { val: 1, type: 'unit' }, 'екі': { val: 2, type: 'unit' }, 'үш': { val: 3, type: 'unit' },
        'төрт': { val: 4, type: 'unit' }, 'бес': { val: 5, type: 'unit' }, 'алты': { val: 6, type: 'unit' },
        'жеті': { val: 7, type: 'unit' }, 'сегіз': { val: 8, type: 'unit' }, 'тоғыз': { val: 9, type: 'unit' },
        'он': { val: 10, type: 'ten' }, 'жиырма': { val: 20, type: 'ten' }, 'отыз': { val: 30, type: 'ten' },
        'қырық': { val: 40, type: 'ten' }, 'елу': { val: 50, type: 'ten' }, 'алпыс': { val: 60, type: 'ten' },
        'жетпіс': { val: 70, type: 'ten' }, 'сексен': { val: 80, type: 'ten' }, 'тоқсан': { val: 90, type: 'ten' },
        'жүз': { val: 100, type: 'mult' }, 'мың': { val: 1000, type: 'mult' }
      },
      connectors: ['және', 'мен'],
      decimals: { 'үтір': ',', 'нүкте': '.' },
      ambiguousOnes: ['бір'],
      nonPronounOnes: []
    });

    // ── 18. ESPERANTO (eo) ──
    addEntries('eo', {
      words: {
        'nul': { val: 0, type: 'zero' },
        'unu': { val: 1, type: 'unit' }, 'du': { val: 2, type: 'unit' }, 'tri': { val: 3, type: 'unit' },
        'kvar': { val: 4, type: 'unit' }, 'kvin': { val: 5, type: 'unit' }, 'ses': { val: 6, type: 'unit' },
        'sep': { val: 7, type: 'unit' }, 'ok': { val: 8, type: 'unit' }, 'naŭ': { val: 9, type: 'unit' }, 'nau': { val: 9, type: 'unit' },
        'dek': { val: 10, type: 'ten' }, 'dudek': { val: 20, type: 'ten' }, 'tridek': { val: 30, type: 'ten' },
        'kvardek': { val: 40, type: 'ten' }, 'kvindek': { val: 50, type: 'ten' }, 'sesdek': { val: 60, type: 'ten' },
        'sepdek': { val: 70, type: 'ten' }, 'okdek': { val: 80, type: 'ten' }, 'naŭdek': { val: 90, type: 'ten' }, 'naudek': { val: 90, type: 'ten' },
        'cent': { val: 100, type: 'mult' }, 'ducent': { val: 200, type: 'hundred_exact' }, 'tricent': { val: 300, type: 'hundred_exact' },
        'kvarcent': { val: 400, type: 'hundred_exact' }, 'kvincent': { val: 500, type: 'hundred_exact' },
        'sescent': { val: 600, type: 'hundred_exact' }, 'sepcent': { val: 700, type: 'hundred_exact' },
        'okcent': { val: 800, type: 'hundred_exact' }, 'naŭcent': { val: 900, type: 'hundred_exact' }, 'naucent': { val: 900, type: 'hundred_exact' },
        'mil': { val: 1000, type: 'mult' }, 'miliono': { val: 1000000, type: 'mult' }
      },
      connectors: ['kaj'],
      decimals: { 'komo': ',', 'punkto': '.' },
      ambiguousOnes: ['unu'],
      nonPronounOnes: ['unu']
    });

    // ── 19. VIETNAMITA (vi) ──
    addEntries('vi', {
      words: {
        'không': { val: 0, type: 'zero' },
        'một': { val: 1, type: 'unit' }, 'mốt': { val: 1, type: 'unit' },
        'hai': { val: 2, type: 'unit' }, 'ba': { val: 3, type: 'unit' },
        'bốn': { val: 4, type: 'unit' }, 'tư': { val: 4, type: 'unit' },
        'năm': { val: 5, type: 'unit' }, 'lăm': { val: 5, type: 'unit' },
        'sáu': { val: 6, type: 'unit' }, 'bảy': { val: 7, type: 'unit' }, 'tám': { val: 8, type: 'unit' }, 'chín': { val: 9, type: 'unit' },
        'mười': { val: 10, type: 'ten' }, 'mươi': { val: 10, type: 'mult' },
        'trăm': { val: 100, type: 'mult' }, 'nghìn': { val: 1000, type: 'mult' }, 'ngàn': { val: 1000, type: 'mult' }, 'triệu': { val: 1000000, type: 'mult' }
      },
      connectors: ['linh', 'lẻ'],
      decimals: { 'phẩy': ',', 'chấm': '.' },
      ambiguousOnes: ['một'],
      nonPronounOnes: []
    });

    // ── 20. ÁRABE (ar) ──
    addEntries('ar', {
      words: {
        'صفر': { val: 0, type: 'zero' },
        'واحد': { val: 1, type: 'unit' }, 'واحدة': { val: 1, type: 'unit' },
        'اثنان': { val: 2, type: 'unit' }, 'اثنين': { val: 2, type: 'unit' }, 'اتنين': { val: 2, type: 'unit' },
        'ثلاثة': { val: 3, type: 'unit' }, 'ثلاث': { val: 3, type: 'unit' }, 'تلاتة': { val: 3, type: 'unit' },
        'أربعة': { val: 4, type: 'unit' }, 'اربعة': { val: 4, type: 'unit' }, 'أربع': { val: 4, type: 'unit' },
        'خمسة': { val: 5, type: 'unit' }, 'خمس': { val: 5, type: 'unit' },
        'ستة': { val: 6, type: 'unit' }, 'ست': { val: 6, type: 'unit' },
        'سبعة': { val: 7, type: 'unit' }, 'سبع': { val: 7, type: 'unit' },
        'ثمانية': { val: 8, type: 'unit' }, 'ثماني': { val: 8, type: 'unit' }, 'تمانية': { val: 8, type: 'unit' },
        'تسعة': { val: 9, type: 'unit' }, 'تسع': { val: 9, type: 'unit' },
        'عشرة': { val: 10, type: 'teen' }, 'عشر': { val: 10, type: 'teen' },
        'أحد عشر': { val: 11, type: 'teen' }, 'احد عشر': { val: 11, type: 'teen' }, 'حداشر': { val: 11, type: 'teen' },
        'اثنا عشر': { val: 12, type: 'teen' }, 'اثني عشر': { val: 12, type: 'teen' }, 'اتناشر': { val: 12, type: 'teen' },
        'ثلاثة عشر': { val: 13, type: 'teen' }, 'تلتاشر': { val: 13, type: 'teen' },
        'أربعة عشر': { val: 14, type: 'teen' }, 'اربعة عشر': { val: 14, type: 'teen' }, 'اربعطاشر': { val: 14, type: 'teen' },
        'خمسة عشر': { val: 15, type: 'teen' }, 'خمسطاشر': { val: 15, type: 'teen' },
        'ستة عشر': { val: 16, type: 'teen' }, 'ستطاشر': { val: 16, type: 'teen' },
        'سبعة عشر': { val: 17, type: 'teen' }, 'سبعطاشر': { val: 17, type: 'teen' },
        'ثمانية عشر': { val: 18, type: 'teen' }, 'تمنطاشر': { val: 18, type: 'teen' },
        'تسعة عشر': { val: 19, type: 'teen' }, 'تسعطاشر': { val: 19, type: 'teen' },
        'عشرون': { val: 20, type: 'ten' }, 'عشرين': { val: 20, type: 'ten' },
        'ثلاثون': { val: 30, type: 'ten' }, 'ثلاثين': { val: 30, type: 'ten' }, 'تلاتين': { val: 30, type: 'ten' },
        'أربعون': { val: 40, type: 'ten' }, 'أربعين': { val: 40, type: 'ten' }, 'اربعين': { val: 40, type: 'ten' },
        'خمسون': { val: 50, type: 'ten' }, 'خمسين': { val: 50, type: 'ten' },
        'ستون': { val: 60, type: 'ten' }, 'ستين': { val: 60, type: 'ten' },
        'سبعون': { val: 70, type: 'ten' }, 'سبعين': { val: 70, type: 'ten' },
        'ثمانون': { val: 80, type: 'ten' }, 'ثمانين': { val: 80, type: 'ten' }, 'تمانين': { val: 80, type: 'ten' },
        'تسعون': { val: 90, type: 'ten' }, 'تسعين': { val: 90, type: 'ten' },
        'مائة': { val: 100, type: 'hundred_exact' }, 'مئة': { val: 100, type: 'hundred_exact' }, 'مية': { val: 100, type: 'hundred_exact' },
        'مائتان': { val: 200, type: 'hundred_exact' }, 'مئتان': { val: 200, type: 'hundred_exact' }, 'مئتين': { val: 200, type: 'hundred_exact' },
        'ثلاثمائة': { val: 300, type: 'hundred_exact' }, 'أربعمائة': { val: 400, type: 'hundred_exact' },
        'خمسمائة': { val: 500, type: 'hundred_exact' }, 'ستمائة': { val: 600, type: 'hundred_exact' },
        'سبعمائة': { val: 700, type: 'hundred_exact' }, 'ثمانمائة': { val: 800, type: 'hundred_exact' }, 'تسعمائة': { val: 900, type: 'hundred_exact' },
        'ألف': { val: 1000, type: 'mult' }, 'الف': { val: 1000, type: 'mult' }, 'ألفين': { val: 2000, type: 'hundred_exact' },
        'مليون': { val: 1000000, type: 'mult' }
      },
      connectors: ['و'],
      decimals: { 'فاصلة': '.', 'نقطة': '.' },
      ambiguousOnes: ['واحد', 'واحدة'],
      nonPronounOnes: ['واحد']
    });

    // ── 21. FARSI / PERSA (fa) ──
    addEntries('fa', {
      words: {
        'صفر': { val: 0, type: 'zero' },
        'یک': { val: 1, type: 'unit' }, 'دو': { val: 2, type: 'unit' }, 'سه': { val: 3, type: 'unit' },
        'چهار': { val: 4, type: 'unit' }, 'پنج': { val: 5, type: 'unit' }, 'شش': { val: 6, type: 'unit' }, 'شیش': { val: 6, type: 'unit' },
        'هفت': { val: 7, type: 'unit' }, 'هشت': { val: 8, type: 'unit' }, 'نه': { val: 9, type: 'unit' },
        'ده': { val: 10, type: 'teen' }, 'یازده': { val: 11, type: 'teen' }, 'دوازده': { val: 12, type: 'teen' },
        'سیزده': { val: 13, type: 'teen' }, 'چهارده': { val: 14, type: 'teen' }, 'پانزده': { val: 15, type: 'teen' }, 'پونزده': { val: 15, type: 'teen' },
        'شانزده': { val: 16, type: 'teen' }, 'شونزده': { val: 16, type: 'teen' }, 'هفده': { val: 17, type: 'teen' },
        'هجده': { val: 18, type: 'teen' }, 'هژده': { val: 18, type: 'teen' }, 'نوزده': { val: 19, type: 'teen' },
        'بیست': { val: 20, type: 'ten' }, 'سی': { val: 30, type: 'ten' }, 'چهل': { val: 40, type: 'ten' },
        'پنجاه': { val: 50, type: 'ten' }, 'شصت': { val: 60, type: 'ten' }, 'هفتاد': { val: 70, type: 'ten' },
        'هشتاد': { val: 80, type: 'ten' }, 'نود': { val: 90, type: 'ten' },
        'صد': { val: 100, type: 'hundred_exact' }, 'یکصد': { val: 100, type: 'hundred_exact' },
        'دویست': { val: 200, type: 'hundred_exact' }, 'سیصد': { val: 300, type: 'hundred_exact' },
        'چهارصد': { val: 400, type: 'hundred_exact' }, 'پانصد': { val: 500, type: 'hundred_exact' },
        'ششصد': { val: 600, type: 'hundred_exact' }, 'هفتصد': { val: 700, type: 'hundred_exact' },
        'هشتصد': { val: 800, type: 'hundred_exact' }, 'نهصد': { val: 900, type: 'hundred_exact' },
        'هزار': { val: 1000, type: 'mult' }, 'میلیون': { val: 1000000, type: 'mult' }
      },
      connectors: ['و'],
      decimals: { 'ممیز': '.', 'نقطه': '.' },
      ambiguousOnes: ['یک'],
      nonPronounOnes: []
    });

    // ── 22. COREANO NATIVO Y ESPACIADO (ko) ──
    addEntries('ko', {
      words: {
        '영': { val: 0, type: 'zero' }, '공': { val: 0, type: 'zero' },
        '일': { val: 1, type: 'unit' }, '하나': { val: 1, type: 'unit' }, '한': { val: 1, type: 'unit' },
        '이': { val: 2, type: 'unit' }, '둘': { val: 2, type: 'unit' }, '두': { val: 2, type: 'unit' },
        '삼': { val: 3, type: 'unit' }, '셋': { val: 3, type: 'unit' }, '세': { val: 3, type: 'unit' },
        '사': { val: 4, type: 'unit' }, '넷': { val: 4, type: 'unit' }, '네': { val: 4, type: 'unit' },
        '오': { val: 5, type: 'unit' }, '다섯': { val: 5, type: 'unit' },
        '육': { val: 6, type: 'unit' }, '여섯': { val: 6, type: 'unit' },
        '칠': { val: 7, type: 'unit' }, '일곱': { val: 7, type: 'unit' },
        '팔': { val: 8, type: 'unit' }, '여덟': { val: 8, type: 'unit' },
        '구': { val: 9, type: 'unit' }, '아홉': { val: 9, type: 'unit' },
        '십': { val: 10, type: 'ten' }, '열': { val: 10, type: 'ten' },
        '스물': { val: 20, type: 'ten' }, '스무': { val: 20, type: 'ten' },
        '서른': { val: 30, type: 'ten' }, '마흔': { val: 40, type: 'ten' }, '쉰': { val: 50, type: 'ten' },
        '예순': { val: 60, type: 'ten' }, '일흔': { val: 70, type: 'ten' }, '여든': { val: 80, type: 'ten' }, '아흔': { val: 90, type: 'ten' },
        '백': { val: 100, type: 'mult' }, '천': { val: 1000, type: 'mult' }, '만': { val: 10000, type: 'mult' }
      },
      connectors: [],
      decimals: { '점': '.' },
      ambiguousOnes: ['일', '하나', '한', '이', '오', '사'],
      nonPronounOnes: ['하나']
    });

    return lex;
  }

  const LEXICONS = buildLexicon();

  // ============================================================================
  // 5. PRE-PROCESADORES DE COMPUESTOS AGLUTINADOS (de, nl, sv, it, fr, ca, ar)
  // ============================================================================
  function preprocessLanguageCompounds(text, lang) {
    let s = text;

    if (lang === 'fr') {
      // Unificar "quatre vingts" / "quatre vingt" con espacios a "quatre-vingt" para que sea un único token vigesimal (80)
      s = s.replace(/\bquatre[\s-]+vingts?\b/gi, 'quatre-vingt');
      s = s.replace(/\bdix[\s-]+(sept|huit|neuf)\b/gi, 'dix-$1');
      // Separar guiones entre decenas/unidades ("vingt-quatre" -> "vingt quatre", "soixante-quinze" -> "soixante quinze")
      s = s.replace(/\b(vingt|trente|quarante|cinquante|soixante|septante|huitante|octante|nonante|quatre-vingt)-(?:et-)?(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix-sept|dix-huit|dix-neuf|dix|onze|douze|treize|quatorze|quinze|seize)\b/gi, '$1 $2');
    } else if (lang === 'ca') {
      // Catalán: "vint-i-quatre" -> "vint i quatre", "trenta-dos" -> "trenta dos", "dos-cents" -> "dos cents"
      s = s.replace(/\b(vint)-i-(u|un|una|dos|dues|tres|quatre|cinc|sis|set|vuit|huit|nou)\b/gi, '$1 i $2');
      s = s.replace(/\b(trenta|quaranta|cinquanta|seixanta|setanta|vuitanta|huitanta|noranta)-(u|un|una|dos|dues|tres|quatre|cinc|sis|set|vuit|huit|nou)\b/gi, '$1 $2');
      s = s.replace(/\b(dos|dues|tres|quatre|cinc|sis|set|vuit|huit|nou)-(cents|centes)\b/gi, '$1 $2');
    } else if (lang === 'en') {
      // Inglés: "twenty-four" -> "twenty four"
      s = s.replace(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)-(one|two|three|four|five|six|seven|eight|nine)\b/gi, '$1 $2');
    } else if (lang === 'de') {
      // Alemán: Descomponer compuestos aglutinados (ej. "zweihundertfünfundzwanzig" -> "zwei hundert fünf und zwanzig")
      s = s.replace(/\b(ein|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun)tausend/gi, '$1 tausend ');
      s = s.replace(/\b(ein|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun)hundert/gi, '$1 hundert ');
      s = s.replace(/\b(ein|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun)und(zwanzig|dreißig|dreissig|vierzig|fünfzig|fuenfzig|sechzig|siebzig|achtzig|neunzig)\b/gi, '$2 $1');
    } else if (lang === 'nl') {
      // Holandés: "vierentwintig" / "tweeëntwintig" -> "twintig vier" / "twintig twee"
      s = s.replace(/\b(een|twee|drie|vier|vijf|zes|zeven|acht|negen)duizend/gi, '$1 duizend ');
      s = s.replace(/\b(een|twee|drie|vier|vijf|zes|zeven|acht|negen)honderd/gi, '$1 honderd ');
      s = s.replace(/\b(een|één|twee|drie|vier|vijf|zes|zeven|acht|negen)(?:en|ën)(twintig|dertig|veertig|vijftig|zestig|zeventig|tachtig|negentig)\b/gi, '$2 $1');
    } else if (lang === 'sv') {
      // Sueco: "tjugofyra" -> "tjugo fyra", "tvåhundra" -> "två hundra"
      s = s.replace(/\b(ett|två|tva|tre|fyra|fem|sex|sju|åtta|atta|nio)tusen/gi, '$1 tusen ');
      s = s.replace(/\b(ett|två|tva|tre|fyra|fem|sex|sju|åtta|atta|nio)hundra/gi, '$1 hundra ');
      s = s.replace(/\b(tjugo|trettio|fyrtio|femtio|sextio|sjuttio|åttio|attio|nittio)(ett|en|två|tva|tre|fyra|fem|sex|sju|åtta|atta|nio)\b/gi, '$1 $2');
    } else if (lang === 'it') {
      // Italiano: "ventiquattro" -> "venti quattro", "ventuno" -> "venti uno", "duecento" -> "due cento", "centocinque" -> "cento cinque"
      s = s.replace(/\b(due|tre|quattro|cinque|sei|sette|otto|nove)mila\b/gi, '$1 mila');
      s = s.replace(/\b(due|tre|quattro|cinque|sei|sette|otto|nove)cento/gi, '$1 cento ');
      s = s.replace(/\bcento(?=[a-zàèéìòù])/gi, 'cento ');
      s = s.replace(/\b(vent|trent|quarant|cinquant|sessant|settant|ottant|novant)(uno|otto)\b/gi, '$1i $2');
      s = s.replace(/\b(venti|trenta|quaranta|cinquanta|sessanta|settanta|ottanta|novanta)(due|tre|tré|quattro|cinque|sei|sette|nove)\b/gi, '$1 $2');
      // Ajustar "trenti/quaranti" generados por la elisión vocálica a su forma canónica
      s = s.replace(/\b(trent|quarant|cinquant|sessant|settant|ottant|novant)i\b/gi, '$1a');
    } else if (lang === 'ar') {
      // Árabe: (\b no funciona con caracteres Unicode árabes en JS; usar límites de espacio/inicio/fin)
      s = s.replace(/(^|\s)(أحد|احد|اثنا|اثني|ثلاثة|أربعة|اربعة|خمسة|ستة|سبعة|ثمانية|تسعة)\s+(عشر)(?=\s|$|[،.,!?؟])/g, '$1$2_$3');
      s = s.replace(/(^|\s)و(عشرون|عشرين|ثلاثون|ثلاثين|تلاتين|أربعون|أربعين|اربعين|خمسون|خمسين|ستون|ستين|سبعون|سبعين|ثمانون|ثمانين|تمانين|تسعون|تسعين)(?=\s|$|[،.,!?؟])/g, '$1و $2');
    }

    return s;
  }

  // En árabe hemos unido temporalmente 11..19 con "_" para que sean un solo token
  for (const k of ['أحد_عشر', 'احد_عشر', 'اثنا_عشر', 'اثني_عشر', 'ثلاثة_عشر', 'أربعة_عشر', 'اربعة_عشر', 'خمسة_عشر', 'ستة_عشر', 'سبعة_عشر', 'ثمانية_عشر', 'تسعة_عشر']) {
    const spaceKey = k.replace('_', ' ');
    if (LEXICONS.ar && LEXICONS.ar.words.has(spaceKey)) {
      LEXICONS.ar.words.set(k, LEXICONS.ar.words.get(spaceKey));
    }
  }

  // ============================================================================
  // 6. EVALUADOR DE SECUENCIAS NUMÉRICAS POR TOKENS (CON CORTE ANTI-FUSIÓN)
  // ============================================================================
  /**
   * Comprueba si un nuevo token numérico puede sumarse/multiplicarse con el grupo
   * numérico en curso o si pertenece a un número independiente (ej. "dos cuatro" -> "2 4").
   */
  function canCombineIntoCurrentNumber(state, tokenInfo, hadConnector) {
    if (state.count === 0) return true;

    const lastType = state.lastType;
    const lastVal = state.lastVal;
    const newType = tokenInfo.type;
    const newVal = tokenInfo.val;

    // El cero nunca se suma a otro número ("cero dos" -> "0 2")
    if (lastType === 'zero' || newType === 'zero') return false;

    // Multiplicadores (100, 1000, 1000000) solo multiplican un número previo si NO hay conector ("y"/"e"/"and")
    if (newType === 'mult') {
      if (hadConnector) return false;
      if (newVal === 100) {
        return state.current >= 1 && state.current <= 9;
      }
      return (state.current > 0 || state.total > 0) && state.current < newVal;
    }

    // Después de un multiplicador >= 1000 (ej. "dos mil ...") o centena ("doscientos ..." / "two hundred ...") o decena multiplicativa ("hai mươi" en vietnamita)
    if (lastType === 'mult' || lastType === 'hundred_exact') {
      if (newType === 'hundred_exact') {
        // "dos mil" (lastVal=1000) + "cuatrocientos" -> SÍ; "doscientos" + "trescientos" -> NO
        return lastType === 'mult' && lastVal >= 1000 && state.current === 0;
      }
      if (lastVal === 10 && newType === 'unit') {
        return (state.current % 10 === 0);
      }
      if (newType === 'ten' || newType === 'vigesimal_add' || newType === 'teen' || newType === 'unit') {
        return (state.current % 100 === 0);
      }
    }

    // Vigesimal aditivo (Euskera "hogeita" 20, "berrogeita" 40... / Francés "soixante" 60, "quatre-vingt" 80)
    // Acepta tanto unidades (1..9) como teens (10..19)
    if (lastType === 'vigesimal_add') {
      if (newType === 'unit' || newType === 'teen') {
        return (state.current % 20 === 0);
      }
      return false;
    }

    // Decena estándar (20..90) + Unidad (1..9): ej. "treinta y dos", "twenty four", "vinte e catro"
    if (lastType === 'ten') {
      if (newType === 'unit') {
        return (state.current % 10 === 0);
      }
      return false;
    }

    // Caso Árabe: Unidad (1..9) + Conector ("و") + Decena (20..90), ej. "أربعة و عشرون" (4 + 20 = 24)
    if (lastType === 'unit' && newType === 'ten' && hadConnector) {
      return state.current >= 1 && state.current <= 9;
    }

    // Cualquier otro caso (ej. unidad + unidad "dos cuatro", teen + teen "doce catorce", unidad + teen "dos doce")
    // son números separados.
    return false;
  }

  function applyTokenToState(state, tokenInfo) {
    const { val, type } = tokenInfo;
    if (type === 'mult') {
      if (val >= 1000) {
        const base = state.current === 0 ? 1 : state.current;
        state.total += base * val;
        state.current = 0;
      } else {
        // mult === 100 (ej. "two hundred", "deux cents", "iki yüz")
        const base = state.current === 0 ? 1 : state.current;
        state.current = base * val;
      }
    } else {
      state.current += val;
    }
    state.lastType = type;
    state.lastVal = val;
    state.count += 1;
    state.wordsUsed.push(tokenInfo.rawLower);
  }

  // ============================================================================
  // 7. ESCUDO DE AMBIGÜEDAD PARA EL NÚMERO 1
  // ============================================================================
  function shouldConvertSingleOne(rawLower, langLex, context) {
    // Si no está en la lista de palabras ambiguas del idioma, es seguro convertir (ej. alemán "eins", holandés "één")
    if (!langLex.ambiguousOnes.has(rawLower)) {
      return true;
    }

    // 1. Si forma parte de una secuencia de conteo (ej. "uno, dos, tres", "one two", "tres, dos, uno")
    if (context.AdjacentToOtherNumber) {
      return true;
    }

    // 2. Si forma parte de una expresión decimal (ej. "uno coma cinco", "one point five")
    if (context.isDecimalPart) {
      return true;
    }

    // 3. Si va precedido inmediatamente por un sustantivo técnico escénico ("canal uno", "fader one", "cue un")
    if (context.precededByTechWord) {
      return true;
    }

    // 4. En Euskera, si va seguido por un sustantivo técnico ("bat kanala")
    if (context.followedByTechWordEu) {
      return true;
    }

    // 5. Si el mensaje completo es única y exclusivamente la palabra tónica del 1 ("uno", "one", "eins", "unu")
    if (context.isEntireMessage && langLex.nonPronounOnes.has(rawLower)) {
      return true;
    }

    // En cualquier otro caso ("tengo un problema", "una vez", "cada uno sabe", "one of the cables"),
    // se protege como artículo/pronombre y NO se convierte.
    return false;
  }

  // ============================================================================
  // 8. PASADA DE FUSIÓN HÍBRIDA POST-CONVERSIÓN (TOLERANCIA A STREAMING VOSK)
  // ============================================================================
  // Si Vosk cortó un segmento a mitad ("cuarenta" -> "40" y luego "y dos" -> "y 2"),
  // fusiona "40 y 2" -> "42" o "100 25" -> "125".
  function applyHybridMergePass(text, lang) {
    let out = text;

    // 1. [Decena exacta 20..90] + conjunción ("y" / "and" / "et" / "i" / "e" / "und") + [Unidad 1..9]
    out = out.replace(/\b([2-9]0)\s+(?:y|and|et|i|e|und|en|och|ve|va|и|і)\s+([1-9])\b/gi, (_, tenStr, unitStr) => {
      return String(parseInt(tenStr, 10) + parseInt(unitStr, 10));
    });

    // 2. [Centena exacta 100..900] + (conjunción opcional) + [01..99]
    out = out.replace(/\b([1-9]00)\s+(?:(?:y|and|et|eta|i|e)\s+)?([1-9][0-9]?)\b/gi, (_, hundStr, remStr) => {
      return String(parseInt(hundStr, 10) + parseInt(remStr, 10));
    });

    return out;
  }

  // ============================================================================
  // 9. MOTOR PRINCIPAL DE NORMALIZACIÓN
  // ============================================================================
  function normalizeSpokenNumbers(text, lang = 'es') {
    if (!text || typeof text !== 'string') return text || '';
    if (text.length > MAX_SAFE_TEXT_LENGTH) return text;

    try {
      const baseLang = String(lang || 'es').split(/[-_]/)[0].toLowerCase().trim() || 'es';

      // Paso 1: Convertir dígitos orientales (Árabe/Farsi) a dígitos internacionales 0-9
      let workingText = convertEasternDigits(text);

      // Paso 2: Si es Chino (zh) o Japonés (ja), aplicar el parser posicional CJK sin espacios
      if (baseLang === 'zh' || baseLang === 'ja' || /[\u4e00-\u9fff]/.test(workingText)) {
        workingText = normalizeCjkNumbers(workingText, baseLang);
        if (baseLang === 'zh' || baseLang === 'ja') {
          return workingText;
        }
      }

      // Paso 3: Si es Coreano (ko), resolver primero bloques sino-coreanos aglutinados
      if (baseLang === 'ko' || /[\uac00-\ud7af]/.test(workingText)) {
        workingText = normalizeKoreanSinoBlocks(workingText);
      }

      const langLex = LEXICONS[baseLang] || LEXICONS.es;

      // Paso 4: Pre-procesar compuestos específicos del idioma (guiones, aglutinaciones de/nl/sv/it/fr/ca/ar)
      workingText = preprocessLanguageCompounds(workingText, baseLang);

      // Paso 5: Tokenización preservando separadores exactos (espacios, comas, signos)
      const tokenRegex = /([^\s,.;:!?¿¡()[\]{}"«»]+)|(\s+|[,.;:!?¿¡()[\]{}"«»]+)/g;
      const rawTokens = [];
      let match;
      while ((match = tokenRegex.exec(workingText)) !== null) {
        if (match[1] !== undefined) {
          const lower = match[1].toLowerCase();
          rawTokens.push({
            isWord: true,
            raw: match[1],
            lower,
            numInfo: langLex.words.get(lower) || null,
            isConnector: langLex.connectors.has(lower),
            decimalSep: langLex.decimals.get(lower) || null,
            isAlreadyDigits: /^\d+$/.test(match[1])
          });
        } else {
          rawTokens.push({
            isWord: false,
            raw: match[2],
            isPureSpace: /^\s+$/.test(match[2]),
            isCommaSpace: /^,\s*$/.test(match[2])
          });
        }
      }

      // Paso 6: Agrupar secuencias de palabras numéricas en segmentos evaluables
      // Primero construimos una lista de "elementos" (o bien tokens normales, o bien NumberSpans resueltos)
      const items = [];
      let i = 0;

      while (i < rawTokens.length) {
        const tok = rawTokens[i];
        if (!tok.isWord || !tok.numInfo) {
          items.push({ type: 'raw', tok });
          i++;
          continue;
        }

        // Iniciar un NumberSpan desde el token i
        const state = {
          total: 0,
          current: 0,
          lastType: null,
          lastVal: 0,
          count: 0,
          wordsUsed: []
        };
        const spanTokens = [tok];
        applyTokenToState(state, { ...tok.numInfo, rawLower: tok.lower });

        let cursor = i + 1;
        while (cursor < rawTokens.length) {
          // Mirar si sigue espacio y luego (opcionalmente un conector + espacio) y luego otro numInfo
          if (cursor < rawTokens.length && !rawTokens[cursor].isWord && rawTokens[cursor].isPureSpace) {
            const spaceTok = rawTokens[cursor];
            const nextIdx = cursor + 1;
            if (nextIdx >= rawTokens.length) break;

            const nextTok = rawTokens[nextIdx];
            // Caso A: Espacio + Conector ("y" / "and" / "eta" / "et") + Espacio + Número
            if (nextTok.isWord && nextTok.isConnector) {
              const afterConnSpaceIdx = nextIdx + 1;
              const afterConnNumIdx = nextIdx + 2;
              if (
                afterConnNumIdx < rawTokens.length &&
                !rawTokens[afterConnSpaceIdx].isWord &&
                rawTokens[afterConnSpaceIdx].isPureSpace &&
                rawTokens[afterConnNumIdx].isWord &&
                rawTokens[afterConnNumIdx].numInfo
              ) {
                const candidateNum = rawTokens[afterConnNumIdx];
                if (canCombineIntoCurrentNumber(state, candidateNum.numInfo, true)) {
                  spanTokens.push(spaceTok, nextTok, rawTokens[afterConnSpaceIdx], candidateNum);
                  applyTokenToState(state, { ...candidateNum.numInfo, rawLower: candidateNum.lower });
                  cursor = afterConnNumIdx + 1;
                  continue;
                }
              }
              break;
            }

            // Caso B: Espacio directo + Número
            if (nextTok.isWord && nextTok.numInfo) {
              if (canCombineIntoCurrentNumber(state, nextTok.numInfo, false)) {
                spanTokens.push(spaceTok, nextTok);
                applyTokenToState(state, { ...nextTok.numInfo, rawLower: nextTok.lower });
                cursor = nextIdx + 1;
                continue;
              }
            }
          }
          break;
        }

        const numericValue = state.total + state.current;
        items.push({
          type: 'number_span',
          value: numericValue,
          count: state.count,
          firstLower: tok.lower,
          rawText: spanTokens.map(t => t.raw).join('')
        });
        i = cursor;
      }

      // Paso 7: Evaluar contexto para el Escudo de Ambigüedad del "1" y Expresiones Decimales
      const wordItemsCount = items.filter(it => it.type === 'number_span' || (it.type === 'raw' && it.tok.isWord)).length;

      // Helper para buscar el elemento palabra anterior o siguiente (ignorando espacios puros y opcionalmente comas)
      const findPrevWordItem = (idx, skipCommas = false) => {
        for (let k = idx - 1; k >= 0; k--) {
          if (items[k].type === 'raw' && !items[k].tok.isWord) {
            if (items[k].tok.isPureSpace) continue;
            if (skipCommas && /^[,،]+$/.test(items[k].tok.raw.trim())) continue;
          }
          return items[k];
        }
        return null;
      };

      const findNextWordItem = (idx, skipCommas = false) => {
        for (let k = idx + 1; k < items.length; k++) {
          if (items[k].type === 'raw' && !items[k].tok.isWord) {
            if (items[k].tok.isPureSpace) continue;
            if (skipCommas && /^[,،]+$/.test(items[k].tok.raw.trim())) continue;
          }
          return items[k];
        }
        return null;
      };

      // Marcar qué number_spans forman parte de un decimal (ej. [number_span] + "coma"/"punto" + [number_span])
      const isDecimalMember = new Array(items.length).fill(false);
      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        if (it.type === 'raw' && it.tok.isWord && it.tok.decimalSep) {
          // Verificar si inmediatamente antes (saltando espacio) e inmediatamente después (saltando espacio) hay números
          const prevIdx = (idx >= 2 && items[idx - 1].type === 'raw' && items[idx - 1].tok.isPureSpace) ? idx - 2 : -1;
          const nextIdx = (idx + 2 < items.length && items[idx + 1].type === 'raw' && items[idx + 1].tok.isPureSpace) ? idx + 2 : -1;
          if (
            prevIdx >= 0 &&
            nextIdx >= 0 &&
            items[prevIdx].type === 'number_span' &&
            items[nextIdx].type === 'number_span'
          ) {
            isDecimalMember[prevIdx] = true;
            isDecimalMember[nextIdx] = true;
            it.activeDecimalSep = it.tok.decimalSep;
          }
        }
      }

      // Determinar para cada number_span si debe convertirse a dígitos
      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        if (it.type !== 'number_span') continue;

        if (it.value !== 1 || it.count > 1) {
          // Cualquier número != 1 o compuesto (ej. "un mil" = 1000, "veintiuno" = 21) se convierte siempre
          it.shouldConvert = true;
          continue;
        }

        // Es un "1" de una sola palabra: aplicar el Escudo Contextual Anti-Murphy
        const prevItem = findPrevWordItem(idx, false);
        const nextItem = findNextWordItem(idx, false);
        const prevItemSkipComma = findPrevWordItem(idx, true);
        const nextItemSkipComma = findNextWordItem(idx, true);

        // ¿Está junto a otro número (separado por espacio o por coma)?
        let adjacentToNumber = false;
        if (prevItemSkipComma && (prevItemSkipComma.type === 'number_span' || (prevItemSkipComma.type === 'raw' && prevItemSkipComma.tok.isAlreadyDigits))) {
          adjacentToNumber = true;
        }
        if (nextItemSkipComma && (nextItemSkipComma.type === 'number_span' || (nextItemSkipComma.type === 'raw' && nextItemSkipComma.tok.isAlreadyDigits))) {
          adjacentToNumber = true;
        }

        const precededByTechWord = Boolean(
          prevItem &&
          prevItem.type === 'raw' &&
          prevItem.tok.isWord &&
          TECHNICAL_PRECEDING_WORDS.has(prevItem.tok.lower.replace(/^#/, ''))
        );

        const followedByTechWordEu = Boolean(
          baseLang === 'eu' &&
          nextItem &&
          nextItem.type === 'raw' &&
          nextItem.tok.isWord &&
          TECHNICAL_FOLLOWING_WORDS_EU.has(nextItem.tok.lower)
        );

        it.shouldConvert = shouldConvertSingleOne(it.firstLower, langLex, {
          AdjacentToOtherNumber: adjacentToNumber,
          isDecimalPart: isDecimalMember[idx],
          precededByTechWord,
          followedByTechWordEu,
          isEntireMessage: wordItemsCount === 1
        });
      }

      // Paso 8: Ensamblar la cadena final (uniendo decimales "12 coma 5" -> "12,5")
      let result = '';
      let k = 0;
      while (k < items.length) {
        const it = items[k];

        // Comprobar patrón Decimal completo: [number_span convertido] + [space] + [activeDecimalSep] + [space] + [number_span convertido]
        if (
          it.type === 'number_span' &&
          it.shouldConvert &&
          k + 4 < items.length &&
          items[k + 1].type === 'raw' && items[k + 1].tok.isPureSpace &&
          items[k + 2].type === 'raw' && items[k + 2].activeDecimalSep &&
          items[k + 3].type === 'raw' && items[k + 3].tok.isPureSpace &&
          items[k + 4].type === 'number_span' &&
          items[k + 4].shouldConvert
        ) {
          result += `${it.value}${items[k + 2].activeDecimalSep}${items[k + 4].value}`;
          k += 5;
          continue;
        }

        if (it.type === 'number_span') {
          result += it.shouldConvert ? String(it.value) : it.rawText;
        } else {
          // Si en árabe habíamos unido "أحد_عشر" y por algún motivo quedara sin convertir, restaurar espacio
          result += it.tok.raw.replace(/_/g, ' ');
        }
        k++;
      }

      // Paso 9: Pasada de fusión híbrida post-conversión ("40 y 2" -> "42")
      result = applyHybridMergePass(result, baseLang);

      return result;
    } catch (err) {
      // Fallback incondicional Anti-Murphy: jamás romper ni bloquear un mensaje
      console.warn('⚠️ [TextNumberNormalizer] Fallback seguro activado:', err.message);
      return text;
    }
  }

  return {
    normalizeSpokenNumbers,
    convertEasternDigits
  };
});
