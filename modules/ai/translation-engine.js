/**
 * 🌍 Babel Translation Engine - Neural Inference (v60.100 - MADLAD-400 INT8)
 * 
 * Basado en CTranslate2 C++ nativo (Google MADLAD-400-3B cuantizado INT8).
 * Licencia: Apache 2.0 (100% Comercial y Libre).
 * Optimizado para Talk.me con soporte nativo de Euskera, Gallego y 24 idiomas.
 */

const path = require('path');
const madladDaemon = require('./madlad-daemon.js');

class TranslationEngine {
    constructor() {
        this.modelName = 'google/madlad400-3b-mt (CTranslate2 INT8)';
        this.initializing = false;
        this.isReady = false;
        
        // Mapeo de idiomas de Talk.me a prefijos T5 de Google MADLAD-400
        this.langMapping = {
            'es': '<2es>',
            'en': '<2en>',
            'eu': '<2eu>',
            'gl': '<2gl>',
            'de': '<2de>',
            'fr': '<2fr>',
            'it': '<2it>',
            'ja': '<2ja>',
            'pt': '<2pt>',
            'ru': '<2ru>',
            'zh': '<2zh>',
            'tr': '<2tr>',
            'ca': '<2ca>',
            'ar': '<2ar>',
            'fa': '<2fa>',
            'uk': '<2uk>',
            'sv': '<2sv>',
            'vi': '<2vi>',
            'ko': '<2ko>',
            'nl': '<2nl>',
            'uz': '<2uz>',
            'kk': '<2kk>',
            'pl': '<2pl>',
            'eo': '<2eo>'
        };

        // Regex elástica ultra-defensiva contra variaciones de SentencePiece: soporta [, [[, espacios y caja
        this.JARGON_RESTORE_REGEX = /\[+\s*[_Ww]+(\d+)_*\s*\]+/gi;


        // ⚡ FLASH CACHE: Memoria de respuesta instantánea para palabras y frases frecuentes
        this.cache = new Map();
        this.MAX_CACHE_SIZE = 1000;
        this.CACHE_VERSION = 'v60.3';

        // 🛡️ FAST-PATH INMUTABLE: Matriz semántica conceptual en 24 idiomas (Cobertura 552 pares al 100%)
        this.CANONICAL_WORDS = Object.freeze({
            THANKS: {
                es: "Gracias", en: "Thank you", eu: "Eskerrik asko", gl: "Grazas",
                de: "Danke", fr: "Merci", it: "Grazie", ja: "ありがとう",
                pt: "Obrigado", ru: "Спасибо", zh: "谢谢", tr: "Teşekkürler",
                ca: "Gràcies", ar: "شكراً", fa: "متشکرم", uk: "Дякую",
                sv: "Tack", vi: "Cảm ơn", ko: "감사합니다", nl: "Bedankt",
                uz: "Rahmat", kk: "Рахмет", pl: "Dziękuję", eo: "Dankon"
            },
            MANY_THANKS: {
                es: "Muchas gracias", en: "Thank you very much", eu: "Mila esker", gl: "Moitas grazas",
                de: "Vielen Dank", fr: "Merci beaucoup", it: "Molte grazie", ja: "どうもありがとう",
                pt: "Muito obrigado", ru: "Большое спасибо", zh: "非常感谢", tr: "Çok teşekkürler",
                ca: "Moltes gràcies", ar: "شكراً جزيلاً", fa: "بسیار متشکرم", uk: "Дуже дякую",
                sv: "Tack så mycket", vi: "Cảm ơn rất nhiều", ko: "대단히 감사합니다", nl: "Hartelijk dank",
                uz: "Katta rahmat", kk: "Көп рахмет", pl: "Bardzo dziękuję", eo: "Multan dankon"
            },
            HELLO: {
                es: "Hola", en: "Hello", eu: "Kaixo", gl: "Ola",
                de: "Hallo", fr: "Bonjour", it: "Ciao", ja: "こんにちは",
                pt: "Olá", ru: "Привет", zh: "你好", tr: "Merhaba",
                ca: "Hola", ar: "مرحبا", fa: "سلام", uk: "Привіт",
                sv: "Hej", vi: "Xin chào", ko: "안녕하세요", nl: "Hallo",
                uz: "Salom", kk: "Сәлем", pl: "Cześć", eo: "Saluton"
            },
            GOOD_MORNING: {
                es: "Buenos días", en: "Good morning", eu: "Egun on", gl: "Bos días",
                de: "Guten Morgen", fr: "Bonjour", it: "Buongiorno", ja: "おはようございます",
                pt: "Bom dia", ru: "Доброе утро", zh: "早上好", tr: "Günaydın",
                ca: "Bon dia", ar: "صباح الخير", fa: "صبح بخیر", uk: "Доброго ранку",
                sv: "God morgon", vi: "Chào buổi sáng", ko: "좋은 아침입니다", nl: "Goedemorgen",
                uz: "Xayrli tong", kk: "Қайырлы таң", pl: "Dzień dobry", eo: "Bonan matenon"
            },
            GOOD_AFTERNOON: {
                es: "Buenas tardes", en: "Good afternoon", eu: "Arratsalde on", gl: "Boas tardes",
                de: "Guten Tag", fr: "Bon après-midi", it: "Buon pomeriggio", ja: "こんにちは",
                pt: "Boa tarde", ru: "Добрый день", zh: "下午好", tr: "Tünaydın",
                ca: "Bona tarda", ar: "مساء الخير", fa: "عصر بخیر", uk: "Добрий день",
                sv: "God eftermiddag", vi: "Chào buổi chiều", ko: "좋은 오후입니다", nl: "Goedemiddag",
                uz: "Xayrli kun", kk: "Қайырлы күн", pl: "Dobre popołudnie", eo: "Bonan posttagmezon"
            },
            GOOD_NIGHT: {
                es: "Buenas noches", en: "Good night", eu: "Gau on", gl: "Boas noites",
                de: "Gute Nacht", fr: "Bonne nuit", it: "Buona notte", ja: "おやすみなさい",
                pt: "Boa noite", ru: "Спокойной ночи", zh: "晚安", tr: "İyi geceler",
                ca: "Bona nit", ar: "تصبح على خير", fa: "شب بخیر", uk: "Добраніч",
                sv: "God natt", vi: "Chúc ngủ ngon", ko: "안녕히 주무세요", nl: "Goedenacht",
                uz: "Xayrli tun", kk: "Қайырлы түн", pl: "Dobranoc", eo: "Bonan nokton"
            },
            YES: {
                es: "Sí", en: "Yes", eu: "Bai", gl: "Si",
                de: "Ja", fr: "Oui", it: "Sì", ja: "はい",
                pt: "Sim", ru: "Да", zh: "是的", tr: "Evet",
                ca: "Sí", ar: "نعم", fa: "بله", uk: "Так",
                sv: "Ja", vi: "Vâng", ko: "네", nl: "Ja",
                uz: "Ha", kk: "Иә", pl: "Tak", eo: "Jes"
            },
            NO: {
                es: "No", en: "No", eu: "Ez", gl: "Non",
                de: "Nein", fr: "Non", it: "No", ja: "いいえ",
                pt: "Não", ru: "Нет", zh: "不", tr: "Hayır",
                ca: "No", ar: "لا", fa: "خیر", uk: "Ні",
                sv: "Nej", vi: "Không", ko: "아니요", nl: "Nee",
                uz: "Yo'q", kk: "Жоқ", pl: "Nie", eo: "Ne"
            },
            OK: {
                es: "De acuerdo", en: "OK", eu: "Ados", gl: "De acordo",
                de: "In Ordnung", fr: "D'accord", it: "D'accordo", ja: "了解",
                pt: "De acordo", ru: "Хорошо", zh: "好的", tr: "Tamam",
                ca: "D'acord", ar: "حسنا", fa: "باشه", uk: "Добре",
                sv: "Okej", vi: "Được", ko: "알겠습니다", nl: "Akkoord",
                uz: "Mayli", kk: "Жарайды", pl: "Zgoda", eo: "Bone"
            },
            BYE: {
                es: "Adiós", en: "Goodbye", eu: "Agur", gl: "Adeus",
                de: "Auf Wiedersehen", fr: "Au revoir", it: "Arrivederci", ja: "さようなら",
                pt: "Adeus", ru: "До свидания", zh: "再见", tr: "Hoşça kal",
                ca: "Adéu", ar: "مع السلامة", fa: "خداحافظ", uk: "До побачення",
                sv: "Hej då", vi: "Tạm biệt", ko: "안녕히 가세요", nl: "Tot ziens",
                uz: "Xayr", kk: "Сау болыңыз", pl: "Do widzenia", eo: "Ĝis revido"
            }
        });

        // Índice Inverso FAST_INDEX: O(1) key -> concept lookup
        this.FAST_INDEX = {};
        for (const [concept, langs] of Object.entries(this.CANONICAL_WORDS)) {
            for (const [lang, word] of Object.entries(langs)) {
                const normKey = this.normalizeFastPath(word);
                if (normKey) {
                    this.FAST_INDEX[normKey] = concept;
                }
            }
        }
        // Variantes idiomáticas adicionales frecuentes en intercom
        const extraMappings = {
            "vale": "OK",
            "entendido": "OK",
            "recibido": "OK",
            "okay": "OK",
            "ok": "OK",
            "buenas": "HELLO",
            "chao": "BYE",
            "ciao": "HELLO",
            "bye": "BYE"
        };
        for (const [vWord, concept] of Object.entries(extraMappings)) {
            const k = this.normalizeFastPath(vWord);
            if (k) this.FAST_INDEX[k] = concept;
        }
    }

    /**
     * Normalización estricta de palabras atómicas para indexación y consulta Fast-Path
     */
    normalizeFastPath(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .normalize('NFKC')
            .trim()
            .toLowerCase()
            .replace(/^[¡¿"'«»\s]+/, '')
            .replace(/[!?.,;:"'«»。！؟\s]+$/, '')
            .replace(/(.)\1{2,}/g, '$1'); // "graciasss" -> "gracias"
    }

    /**
     * Colapsa palabras consecutivas idénticas en la entrada (Prevención de resonancia de atención)
     * Ej: "okay okay recibido" -> "okay recibido"
     */
    collapseConsecutiveDuplicates(text) {
        if (!text || typeof text !== 'string') return '';
        const words = text.trim().split(/\s+/);
        const out = [];
        for (const w of words) {
            const prev = out[out.length - 1];
            if (prev && prev.toLowerCase() === w.toLowerCase()) continue;
            out.push(w);
        }
        return out.join(' ');
    }

    /**
     * Conteo defensivo de unidades textuales: palabras en alfabéticos, caracteres en CJK
     */
    countUnits(text) {
        if (!text || typeof text !== 'string') return 0;
        const isCJK = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(text);
        return isCJK ? [...text.trim()].length : text.trim().split(/\s+/).filter(Boolean).length;
    }

    /**
     * Limpia la caché en RAM
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Inicializa el demonio neuronal CTranslate2.
     */
    async init() {
        if (this.initializing || this.isReady) return;
        this.initializing = true;
        
        console.log(`🧠 [BABEL-ENGINE] Conectando con demonio CTranslate2: ${this.modelName}...`);
        
        try {
            await madladDaemon.init();
            this.isReady = true;
            this.initializing = false;
            console.log('✅ [BABEL-ENGINE] Modelo MADLAD-400 (INT8) listo para inferencia local ultrarrápida.');
        } catch (error) {
            this.initializing = false;
            console.error('❌ [BABEL-ENGINE] Error crítico inicializando demonio MADLAD:', error);
            throw error;
        }
    }

    /**
     * Traduce un texto con protección de jergas y nombres propios.
     */
    async translate(text, sourceLang, targetLang, protectedWords = []) {
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return '';
        }

        // [v60.ANTI-MURPHY-CAP] Contención preventiva: máx 300 caracteres (~50 palabras)
        let processedText = text.trim();
        const MAX_INPUT_CHARS = 300;
        if (processedText.length > MAX_INPUT_CHARS) {
            processedText = processedText.substring(0, MAX_INPUT_CHARS).replace(/\s+\S*$/, '') + '...';
        }

        // [v60.ANTI-RESONANCE] Colapso preventivo de duplicados léxicos consecutivos (evita bucles en el decoder)
        // Ej: "okay okay recibido" -> "okay recibido"
        processedText = this.collapseConsecutiveDuplicates(processedText);

        // 🚀 FASE 1: FAST-PATH INMUTABLE (0 ms, 100% Determinista en 24 idiomas)
        // Solo aplica si NO contiene delimitadores de jergas protegidas
        const cleanKey = this.normalizeFastPath(processedText);
        if (!processedText.includes('[[_W') && cleanKey) {
            const concept = this.FAST_INDEX[cleanKey];
            if (concept && this.CANONICAL_WORDS[concept] && this.CANONICAL_WORDS[concept][targetLang]) {
                return this.CANONICAL_WORDS[concept][targetLang];
            }
        }

        // ⚡ CONSULTA CACHÉ VERSIONADA v60.3
        const cacheKey = `${this.CACHE_VERSION}:${sourceLang}->${targetLang}:${cleanKey}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        if (!this.isReady) {
            await this.init();
        }
        
        try {
            const tgtPrefix = this.langMapping[targetLang] || `<2${targetLang}>`;
            const replacements = [];

            // Pre-procesamiento: Proteger palabras técnicas / jergas (Máximo 6 para no agotar tokens de decodificación)
            if (Array.isArray(protectedWords) && protectedWords.length > 0) {
                const safeWords = protectedWords.slice(0, 6);
                safeWords.forEach((word, index) => {
                    if (!word) return;
                    const placeholder = `[[_W${index}_]]`;
                    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                    if (regex.test(processedText)) {
                        processedText = processedText.replace(regex, placeholder);
                        replacements.push({ placeholder, original: word });
                    }
                });
            }

            // 🎯 FASE 2: CLAUSURA SINTÁCTICA SELECTIVA (Pre-inferencia)
            // Solo se inyecta '.' en entradas cortas (<= 2 palabras) que carecen de puntuación.
            // En frases de 3+ palabras el modelo ya tiene anclaje sintáctico y un '.' forzado puede provocar bucles autoregresivos.
            const hasPunct = /[.!?؟？。！]$/.test(processedText.trim());
            const wIn = this.countUnits(processedText);
            const needsClosure = (wIn <= 2) && !hasPunct;
            const textToInfer = needsClosure ? (processedText + '.') : processedText;

            // Inferencia en demonio persistente con cola secuencial y watchdog dinámico
            let translatedText = await madladDaemon.translate(tgtPrefix, textToInfer);

            // Post-procesamiento: Restaurar palabras protegidas con regex elástica
            if (replacements.length > 0) {
                translatedText = translatedText.replace(this.JARGON_RESTORE_REGEX, (match, tagIndex) => {
                    const idx = parseInt(tagIndex, 10);
                    if (replacements[idx] && replacements[idx].original) {
                        return replacements[idx].original;
                    }
                    return match; // Fallback defensivo si el índice difiere
                });
            }

            // 🎯 FASE 2: RESTAURACIÓN SIMÉTRICA (Post-inferencia)
            // Si se aplicó clausura artificial, remover simétricamente el punto final devuelto
            if (needsClosure && translatedText) {
                translatedText = translatedText.replace(/[.!?؟？。！]+$/, '').trim();
            }

            // [v60.ANTI-LOOP] Saneamiento defensivo bimodal de repeticiones en bucle del decodificador CTranslate2
            // Soporta partición por cláusulas (con signos) y por palabras continuas (sin signos)
            if (translatedText && translatedText.length >= 10) {
                const trailingPunct = /[.,!?;:؟？]+$/.exec(translatedText)?.[0] || '';
                const withoutTrailing = translatedText.replace(/[.,!?;:؟？]+$/, '').trim();
                
                // 1. Partición por delimitadores de cláusula (comas, puntos y comas, puntos o signos)
                const clauseParts = withoutTrailing.split(/\s*[,;.!?؟？]+\s*/).filter(Boolean);
                if (clauseParts.length >= 2 && clauseParts.length % 2 === 0) {
                    const mid = clauseParts.length / 2;
                    const h1 = clauseParts.slice(0, mid).join(' ').toLowerCase();
                    const h2 = clauseParts.slice(mid).join(' ').toLowerCase();
                    if (h1 === h2 && h1.split(/\s+/).length >= 2) {
                        translatedText = clauseParts.slice(0, mid).join(', ') + trailingPunct;
                    }
                } else {
                    // 2. Partición por palabras para bucles continuos sin signos (ej. "Okay okay received Okay okay received")
                    const words = withoutTrailing.split(/\s+/).filter(Boolean);
                    if (words.length >= 4 && words.length % 2 === 0) {
                        const mid = words.length / 2;
                        const w1 = words.slice(0, mid).join(' ').toLowerCase();
                        const w2 = words.slice(mid).join(' ').toLowerCase();
                        if (w1 === w2) {
                            translatedText = words.slice(0, mid).join(' ') + trailingPunct;
                        }
                    }
                }
            }

            // 🛡️ FASE 3: HIGIENE DE CACHÉ ANTI-ENVENENAMIENTO CON countUnits Y TELEMETRÍA MÍNIMA
            const isShort = processedText.split(/\s+/).length <= 10 || processedText.length <= 80;
            const uIn = this.countUnits(processedText);
            const uOut = this.countUnits(translatedText);
            const isOutCJK = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/.test(translatedText);
            const limIn = 2;
            const limOut = isOutCJK ? 8 : 4;
            const noCachear = (uIn <= limIn && uOut > limOut);

            if (noCachear) {
                global.babelStats = global.babelStats || { blocked: 0 };
                global.babelStats.blocked++;
                console.warn(`⚠️ [BABEL-GUARD] Bloqueado en caché por alucinación: "${processedText}" -> "${translatedText}"`);
            } else if (isShort) {
                if (this.cache.size >= this.MAX_CACHE_SIZE) {
                    const firstKey = this.cache.keys().next().value;
                    this.cache.delete(firstKey);
                }
                this.cache.set(cacheKey, translatedText);
            }

            return translatedText;

        } catch (error) {
            console.error('❌ [BABEL-ENGINE] Error en inferencia MADLAD-400:', error);
            // Ley de Murphy: Garantía Incondicional al Emisor (devolver texto original)
            return text;
        }
    }
}

// Singleton retrocompatible para todo el ecosistema de Talk.me
const instance = new TranslationEngine();
module.exports = instance;
