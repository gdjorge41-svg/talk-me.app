import { 
    getUserColor, 
    getCategoryInfo, 
    getCategoryColor,
    FILTER_ALL_KEY
} from './module-category-ui.js';
import { scrollToBottom, triggerVibration } from '../utils/ui-utils.js';

class MessageRenderer {
    constructor(domManager, audioState) {
        this.dom = domManager;
        this.audio = audioState;
        this._renderedMsgKeys = new Set();
        this.MASTER_USERNAME = 'Master';
    }

    /**
     * Añade un mensaje al contenedor de chat con soporte completo de categorías y audio premium.
     */
    addMessage(user, text, isOwn = false, time = null, audioUrl = null, category = 'General', imageUrl = null, isAudioMessage = false, subUserInfo = null, msgId = null, triggerType = null, triggerValue = null, autoPlayPending = false) {
        const messagesContainer = this.dom.get('chat', 'container') || document.getElementById('messages');
        if (!messagesContainer) return;
        
        // --- [v60.Elite] Iconos de Protocolo para Chat ---
        const PROTOCOL_ICONS = {
            smpte: '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right:3px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
            midi: '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right:3px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="15"></line><line x1="15" y1="3" x2="15" y2="15"></line></svg>',
            osc: '<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right:3px;"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>',
            sacn: '<svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor" style="margin-right:3px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
        };

        // Audio propio: recuperar último blob local grabado (Compatibilidad v60)
        if (isOwn && !audioUrl && window._lastAudioBlobUrl && isAudioMessage) {
            audioUrl = window._lastAudioBlobUrl;
        }

        // Patch solo transcripción
        if (window.transcriptionOnly === true) {
            audioUrl = null;
        }

        // Evitar duplicados (v60)
        const msgKey = msgId || `${user}-${time}-${text ? text.substring(0, 20) : 'img'}`;
        if (this._renderedMsgKeys.has(msgKey)) return;
        this._renderedMsgKeys.add(msgKey);

        const catInfo = getCategoryInfo(category, window.currentCategories);
        const categoryName = catInfo.name;
        const categoryId = catInfo.id;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${isOwn ? 'own' : ''} ${audioUrl ? 'voice' : ''}`;
        messageElement.setAttribute('data-category', categoryName);
        messageElement.setAttribute('data-category-id', categoryId);
        if (msgId) {
            messageElement.setAttribute('data-msg-id', msgId);
        }

        const isMaster = user === this.MASTER_USERNAME;
        const activeFilters = window.activeFilters || [FILTER_ALL_KEY];
        const showAll = activeFilters.includes(FILTER_ALL_KEY);
        const isFiltered = activeFilters.includes(categoryId);

        const isTriggerMessage = !!triggerType || !!autoPlayPending;

        if (!showAll && !isFiltered && !isMaster && !isTriggerMessage) {
            messageElement.style.display = 'none';
        }

        const messageTime = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        let senderColor = getUserColor(user, window.currentUsername, getCategoryColor(categoryName, window.currentCategories));

        if (isOwn) messageElement.style.borderRightColor = senderColor;
        else messageElement.style.borderLeftColor = senderColor;

        if (subUserInfo && subUserInfo.rootUser) {
            senderColor = getCategoryColor(categoryName, window.currentCategories);
            if (isOwn) messageElement.style.borderRightColor = senderColor;
            else messageElement.style.borderLeftColor = senderColor;
        }

        // --- Cabecera ---
        const senderDiv = document.createElement('div');
        senderDiv.className = 'message-sender';
        senderDiv.style.color = senderColor;

        if (subUserInfo && subUserInfo.rootUser) {
            const rootCat = getCategoryInfo(subUserInfo.rootCategory, window.currentCategories);
            const subCat = getCategoryInfo(category, window.currentCategories);

            const createTag = (c) => {
                const tag = document.createElement('small');
                tag.className = 'category-tag';
                tag.textContent = c.name;
                const color = getCategoryColor(c.name, window.currentCategories);
                tag.style.color = color;
                tag.style.border = `1px solid ${color}`;
                tag.style.background = 'rgba(255, 255, 255, 0.03)';
                tag.style.marginLeft = '4px';
                return tag;
            };

            const rootSpan = document.createElement('span');
            rootSpan.className = 'root-identity';
            rootSpan.style.color = getCategoryColor(rootCat.name, window.currentCategories);
            rootSpan.textContent = subUserInfo.rootUser;
            rootSpan.appendChild(createTag(rootCat));

            const subSpan = document.createElement('span');
            subSpan.className = 'sub-identity';
            subSpan.style.color = getCategoryColor(subCat.name, window.currentCategories);
            subSpan.textContent = user;
            subSpan.appendChild(createTag(subCat));

            const senderLeft = document.createElement('div');
            senderLeft.className = 'message-sender-left';
            senderLeft.appendChild(rootSpan);
            senderLeft.appendChild(subSpan);
            senderDiv.appendChild(senderLeft);
        } else {
            const senderSpan = document.createElement('span');
            senderSpan.appendChild(document.createTextNode(user + ' '));
            
            const categorySmall = document.createElement('small');
            categorySmall.className = 'category-tag';
            categorySmall.textContent = categoryName;
            
            const baseCatColor = getCategoryColor(categoryName, window.currentCategories);
            categorySmall.style.color = baseCatColor;
            categorySmall.style.border = `1px solid ${baseCatColor}`;
            categorySmall.style.background = 'rgba(255, 255, 255, 0.05)';
            
            senderSpan.appendChild(categorySmall);

            // [v60.Elite] Badge de Protocolo para Triggers Automáticos
            if (triggerType) {
                const typeLower = triggerType.toLowerCase();
                const badge = document.createElement('small');
                badge.className = 'protocol-badge';
                badge.style.display = 'inline-flex';
                badge.style.alignItems = 'center';
                badge.style.marginLeft = '6px';
                badge.style.padding = '1px 5px';
                badge.style.borderRadius = '3px';
                badge.style.fontSize = '9px';
                badge.style.fontWeight = '700';
                badge.style.background = 'rgba(255, 255, 255, 0.1)';
                badge.style.color = '#ddd';
                badge.style.textTransform = 'uppercase';
                badge.style.verticalAlign = 'middle';
                badge.style.border = '1px solid rgba(255,255,255,0.1)';
                
                const icon = PROTOCOL_ICONS[typeLower] || '';
                badge.innerHTML = `${icon}${triggerValue || typeLower}`;
                senderSpan.appendChild(badge);
            }

            const senderLeft = document.createElement('div');
            senderLeft.className = 'message-sender-left';
            senderLeft.appendChild(senderSpan);
            senderDiv.appendChild(senderLeft);
        }

        // [v60.Elite] Hora unificada en la Cabecera (Alineada al extremo derecho para máxima compacidad)
        const headerTime = document.createElement('span');
        headerTime.className = 'message-header-time';
        headerTime.textContent = messageTime;
        senderDiv.appendChild(headerTime);

        messageElement.appendChild(senderDiv);
        
        // --- [BABEL] Contenedor de Traducción ---
        const babelDiv = document.createElement('div');
        babelDiv.className = 'babel-translation hidden';
        messageElement.appendChild(babelDiv);

        // --- Contenido ---
        const locales = window.localesData || {};
        const audioLabel = locales.chat ? locales.chat.audio_message : 'Mensaje de audio';
        const originalLabel = locales.chat ? locales.chat.original_audio : 'Audio original';
        const isAudioPlaceholder = (text || "").includes('🎙️') || text === audioLabel || text === `🎙️ ${audioLabel}`;

        let autoPlayBtn = null;

        const filterCategoryColor = getCategoryColor(categoryName, window.currentCategories);

        if (audioUrl && isAudioPlaceholder) {
            messageElement.classList.add('voice-premium');
            const player = this.createAudioPlayer(audioUrl, messageElement, originalLabel, filterCategoryColor);
            autoPlayBtn = player.querySelector('.audio-play-btn');
            messageElement.appendChild(player);
        } else if (isAudioPlaceholder) {
            const textDiv = document.createElement('div');
            textDiv.className = 'message-text';
            textDiv.innerHTML = `<span data-system-type="audio-label">🎙️ ${audioLabel}</span>`;
            messageElement.appendChild(textDiv);
        } else if (text && text !== '📷 Foto') {
            const textDiv = document.createElement('div');
            textDiv.className = 'message-text';
            textDiv.textContent = text;
            messageElement.appendChild(textDiv);
        }

        // Imagen
        if (imageUrl) {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'message-image-container';
            const img = document.createElement('img');
            img.src = imageUrl;
            img.className = 'message-image';
            img.onclick = () => {
                if (window.fullImage && window.imageModal) {
                    window.fullImage.src = imageUrl;
                    window.imageModal.classList.remove('hidden');
                }
            };
            img.onload = () => scrollToBottom(messagesContainer);
            imgContainer.appendChild(img);
            messageElement.appendChild(imgContainer);
        }

        if (audioUrl && !messageElement.classList.contains('voice-premium')) {
            const secondaryAudioLabel = locales.chat ? locales.chat.original_audio : 'Audio original';
            const player = this.createAudioPlayer(audioUrl, messageElement, secondaryAudioLabel, filterCategoryColor);
            if (!autoPlayBtn) autoPlayBtn = player.querySelector('.audio-play-btn');
            player.style.marginTop = '8px';
            messageElement.appendChild(player);
        }

        // Se omite timeDiv al pie: la hora ya vive en la cabecera superior (.message-header-time)
        messagesContainer.appendChild(messageElement);
        scrollToBottom(messagesContainer);

        // --- [v60.Elite] Ejecución sincronizada de Auto-Play Visual ---
        if (autoPlayPending && autoPlayBtn) {
            console.log(`🔊 [AUTO-PLAY] Activando reproductor visual para: ${user}`);
            setTimeout(() => {
                this.playAudio(audioUrl, autoPlayBtn, messageElement);
            }, 50);
        }

        if (!isOwn) {
            if (this.audio.get('isVibrationEnabled')) {
                triggerVibration(true, 15);
            }
            if (this.audio.get('isScreenAlertEnabled')) {
                messageElement.classList.add('alert-flash');
                setTimeout(() => messageElement.classList.remove('alert-flash'), 800);
            }
        }
    }

    /**
     * Crea un reproductor de audio elástico adaptativo con onda espectral progresiva.
     */
    createAudioPlayer(audioUrl, messageElement, labelText = null, accentColor = 'var(--accent-orange)') {
        const locales = window.localesData || {};
        if (!labelText) labelText = locales.chat ? locales.chat.original_audio : 'Audio original';
        
        const playerContainer = document.createElement('div');
        playerContainer.className = 'audio-player-container';
        if (accentColor) playerContainer.style.setProperty('--player-accent', accentColor);

        const playBtn = document.createElement('button');
        playBtn.className = 'audio-play-btn';
        playBtn.title = 'Reproducir mensaje';
        playBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M7.75 5.58c0-.98 1.07-1.59 1.91-1.08l10.32 6.42c.8.5.8 1.66 0 2.16L9.66 19.5c-.84.51-1.91-.1-1.91-1.08V5.58z"></path></svg>';

        const wavesContainer = document.createElement('div');
        wavesContainer.className = 'audio-waves';
        wavesContainer.title = 'Saltar a posición de audio';

        // Generador PRNG determinista (Mulberry32) basado en hash de mensaje (Cero impacto en Vosk/Babel)
        const seedStr = String(audioUrl || messageElement?.dataset?.messageId || labelText || 'talkme-vocal-track');
        let hashSeed = 0x811c9dc5;
        for (let i = 0; i < seedStr.length; i++) {
            hashSeed ^= seedStr.charCodeAt(i);
            hashSeed += (hashSeed << 1) + (hashSeed << 4) + (hashSeed << 7) + (hashSeed << 8) + (hashSeed << 24);
            hashSeed >>>= 0;
        }

        // Función reactiva para poblar la silueta espectral con perfil vocal orgánico único
        const populateWaves = (count) => {
            wavesContainer.innerHTML = '';
            const TOTAL_BARS = Math.max(35, Math.min(220, count));
            
            // Sub-PRNG con semilla fija para reproducibilidad matemática idéntica
            let rngState = hashSeed;
            const nextRandom = () => {
                let t = (rngState += 0x6D2B79F5);
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };

            // Parámetros de dicción humana propios de este mensaje (cadencia de palabras)
            const numWordClusters = 2 + Math.floor(nextRandom() * 4); // 2 a 5 grupos de palabras
            const clusterCenters = [];
            for (let c = 0; c < numWordClusters; c++) {
                clusterCenters.push({
                    center: 0.12 + (c / (numWordClusters)) * 0.76 + (nextRandom() * 0.1 - 0.05),
                    width: 0.08 + nextRandom() * 0.12,
                    amplitude: 0.65 + nextRandom() * 0.35
                });
            }

            for (let i = 0; i < TOTAL_BARS; i++) {
                const bar = document.createElement('div');
                bar.className = 'audio-wave-bar';
                const pos = i / TOTAL_BARS;

                // Envolvente base de energía por paquetes de palabras
                let energy = 0.08; // Piso de ruido ambiente
                for (const cluster of clusterCenters) {
                    const dist = Math.abs(pos - cluster.center);
                    if (dist < cluster.width) {
                        const localNorm = dist / cluster.width;
                        const factor = Math.cos(localNorm * (Math.PI / 2));
                        energy = Math.max(energy, factor * factor * cluster.amplitude);
                    }
                }

                // Micro-variación de sílabas y formantes vocales
                const microNoise = (nextRandom() * 0.28);
                const combinedAmplitude = Math.max(0.08, Math.min(1.0, energy + microNoise));
                const barHeight = Math.max(5, Math.round(5 + (combinedAmplitude * 20)));

                bar.style.height = `${barHeight}px`;
                bar.dataset.barIndex = i;
                bar.style.animationDelay = `${(i * 0.02).toFixed(3)}s`;
                wavesContainer.appendChild(bar);
            }
        };

        // Poblado inicial con densidad balanceada
        populateWaves(75);

        // Densidad adaptativa constante mediante ResizeObserver (1 barra cada ~5.2px)
        if (typeof window.ResizeObserver === 'function') {
            let lastWidth = 0;
            try {
                const resizeObserver = new ResizeObserver(entries => {
                    for (const entry of entries) {
                        const width = entry.contentRect.width;
                        if (width > 0 && Math.abs(width - lastWidth) > 8) {
                            lastWidth = width;
                            const optimalCount = Math.round(width / 5.2);
                            const wasPlaying = playBtn.classList.contains('playing');
                            const currentAudio = playBtn._audioPlayer;
                            
                            populateWaves(optimalCount);
                            
                            if (wasPlaying && currentAudio && currentAudio.duration) {
                                const curTime = typeof currentAudio.currentTime === 'number' ? currentAudio.currentTime : 0;
                                const ratio = Math.max(0, Math.min(1, curTime / currentAudio.duration));
                                const bars = wavesContainer.querySelectorAll('.audio-wave-bar');
                                const activeIndex = Math.floor(ratio * bars.length);
                                bars.forEach((bar, idx) => {
                                    if (idx <= activeIndex) bar.classList.add('played');
                                    if (idx === activeIndex) bar.classList.add('playing-head');
                                });
                            }
                        }
                    }
                });
                resizeObserver.observe(wavesContainer);
            } catch (err) {
                console.warn("[ResizeObserver] Fallback pasivo activado:", err);
            }
        }

        const textLabel = document.createElement('span');
        textLabel.className = 'audio-player-text';
        textLabel.setAttribute('data-system-type', 'audio-label');
        textLabel.textContent = labelText;

        playerContainer.appendChild(playBtn);
        playerContainer.appendChild(wavesContainer);
        playerContainer.appendChild(textLabel);

        // Control de click en el botón de reproducción
        playBtn.onclick = (e) => {
            e.stopPropagation();
            this.playAudio(audioUrl, playBtn, messageElement);
        };

        // Salto interactivo (seeking) al hacer clic o tocar en cualquier punto de la onda
        wavesContainer.onclick = (e) => {
            e.stopPropagation();
            const rect = wavesContainer.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            
            if (!playBtn._audioPlayer) {
                // Si aún no se está reproduciendo, iniciarlo y posicionar
                this.playAudio(audioUrl, playBtn, messageElement);
            }
            
            if (playBtn._audioPlayer) {
                const audio = playBtn._audioPlayer;
                const targetTime = ratio * (audio.duration || 0);
                if (!isNaN(targetTime) && isFinite(targetTime)) {
                    audio.currentTime = targetTime;
                }
            }
        };

        playerContainer.onclick = (e) => {
            e.stopPropagation();
            this.playAudio(audioUrl, playBtn, messageElement);
        };

        return playerContainer;
    }

    /**
     * Reproduce audio con gestión de estado, fallback para iOS e iluminación progresiva de onda.
     */
    playAudio(url, button, parentMessage = null) {
        if (!url) return;

        const isNewUI = button.classList.contains('audio-play-btn');
        const playerContainer = button.closest('.audio-player-container');

        const PLAY_SVG = '<svg viewBox="0 0 24 24"><path d="M7.75 5.58c0-.98 1.07-1.59 1.91-1.08l10.32 6.42c.8.5.8 1.66 0 2.16L9.66 19.5c-.84.51-1.91-.1-1.91-1.08V5.58z"></path></svg>';
        const PAUSE_SVG = '<svg viewBox="0 0 24 24"><path d="M6 6a1.5 1.5 0 0 1 3 0v12a1.5 1.5 0 0 1-3 0V6zm9 0a1.5 1.5 0 0 1 3 0v12a1.5 1.5 0 0 1-3 0V6z"></path></svg>';

        // Helper para restablecer la onda de un reproductor
        const resetWave = (container) => {
            if (!container) return;
            const bars = container.querySelectorAll('.audio-wave-bar');
            bars.forEach(bar => {
                bar.classList.remove('played');
                bar.classList.remove('playing-head');
            });
        };

        // Helper para iluminar la onda progresivamente en tiempo real
        const updateWaveProgress = (container, currentTime, duration) => {
            if (!container || !duration || duration <= 0) return;
            const bars = container.querySelectorAll('.audio-wave-bar');
            const ratio = Math.max(0, Math.min(1, currentTime / duration));
            const activeIndex = Math.floor(ratio * bars.length);

            bars.forEach((bar, idx) => {
                if (idx < activeIndex) {
                    bar.classList.add('played');
                    bar.classList.remove('playing-head');
                } else if (idx === activeIndex) {
                    bar.classList.add('played');
                    bar.classList.add('playing-head');
                } else {
                    bar.classList.remove('played');
                    bar.classList.remove('playing-head');
                }
            });
        };

        // Detener otros reproductores activos
        if (window._autoPlayPlayer) window._autoPlayPlayer.pause();
        document.querySelectorAll('.audio-play-btn.playing').forEach(b => {
            if (b !== button) {
                if (b._progressAnimId) {
                    cancelAnimationFrame(b._progressAnimId);
                    b._progressAnimId = null;
                }
                b.classList.remove('playing');
                if (b.parentElement) {
                    b.parentElement.classList.remove('playing');
                    resetWave(b.parentElement);
                }
                const msgEl = b.closest('.message');
                if (msgEl) msgEl.classList.remove('playing');

                b.innerHTML = PLAY_SVG;
                if (b._audioPlayer) { 
                    b._audioPlayer.pause(); 
                    b._audioPlayer = null; 
                }
            }
        });

        // Alternar pausa si ya se está reproduciendo el actual
        if (button.classList.contains('playing')) {
            if (button._progressAnimId) {
                cancelAnimationFrame(button._progressAnimId);
                button._progressAnimId = null;
            }
            if (button._audioPlayer) {
                button._audioPlayer.pause();
                button.classList.remove('playing');
                if (playerContainer) playerContainer.classList.remove('playing');
                if (parentMessage) parentMessage.classList.remove('playing');
                
                if (isNewUI) {
                    button.innerHTML = PLAY_SVG;
                }
                return;
            }
        }

        // [v60.Elite] Soporte Profesional para iOS: Web Audio API (BufferSource)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        let audio = null;
        let useWebAudio = isMobile && window.audioContext;

        if (useWebAudio) {
            console.log("🚀 [iOS-PRO] Iniciando motor de inyección WebAudio para Trigger");
            let startTime = 0;
            let animFrameId = null;

            audio = {
                duration: 0,
                currentTime: 0,
                play: async () => {
                    try {
                        if (window.audioContext.state === 'suspended') await window.audioContext.resume();
                        
                        const response = await fetch(url);
                        const arrayBuffer = await response.arrayBuffer();
                        const decodedData = await window.audioContext.decodeAudioData(arrayBuffer);
                        audio.duration = decodedData.duration;
                        
                        const source = window.audioContext.createBufferSource();
                        source.buffer = decodedData;
                        source.connect(window._masterGain || window.audioContext.destination);
                        
                        startTime = window.audioContext.currentTime;
                        source.start(0);
                        
                        // Loop de animación para WebAudio en iOS
                        const trackProgress = () => {
                            if (!button.classList.contains('playing')) return;
                            const elapsed = window.audioContext.currentTime - startTime;
                            audio.currentTime = elapsed;
                            updateWaveProgress(playerContainer, elapsed, audio.duration);
                            if (elapsed < audio.duration) {
                                animFrameId = requestAnimationFrame(trackProgress);
                            }
                        };
                        animFrameId = requestAnimationFrame(trackProgress);

                        source.onended = () => {
                            if (animFrameId) cancelAnimationFrame(animFrameId);
                            if (audio.onended) audio.onended();
                        };
                        audio._source = source;
                    } catch (e) {
                        console.error("❌ [iOS-PRO] Fallo en motor WebAudio:", e);
                        throw e;
                    }
                },
                pause: () => {
                    if (animFrameId) cancelAnimationFrame(animFrameId);
                    if (audio._source) {
                        try { audio._source.stop(); } catch(e) {}
                    }
                }
            };
        } else {
            audio = new Audio(url);
            if (typeof window.registerActiveAudio === 'function') window.registerActiveAudio(audio);
            audio.volume = this.audio.get('isMuted') ? 0 : 1;

            // Motor de seguimiento visual a 30 FPS (~33ms) para máxima fluidez y bajo consumo
            let lastProgressTime = 0;
            const FRAME_INTERVAL_MS = 33; // 30 FPS estables

            const updateLoop = (now) => {
                if (!button.classList.contains('playing')) return;

                if (!lastProgressTime || (now - lastProgressTime >= FRAME_INTERVAL_MS)) {
                    lastProgressTime = now;
                    const cur = audio.currentTime || 0;
                    const dur = audio.duration || 0;
                    if (dur > 0) {
                        updateWaveProgress(playerContainer, cur, dur);
                    }
                }

                if (!audio.paused && !audio.ended) {
                    button._progressAnimId = requestAnimationFrame(updateLoop);
                }
            };

            // Iniciar ciclo de 30 FPS al arrancar la reproducción
            audio.onplay = () => {
                if (button._progressAnimId) cancelAnimationFrame(button._progressAnimId);
                button._progressAnimId = requestAnimationFrame(updateLoop);
            };

            audio.onpause = () => {
                if (button._progressAnimId) {
                    cancelAnimationFrame(button._progressAnimId);
                    button._progressAnimId = null;
                }
            };

            // Fallback pasivo incondicional (Ley de Murphy)
            audio.ontimeupdate = () => {
                if (!button._progressAnimId) {
                    updateWaveProgress(playerContainer, audio.currentTime, audio.duration);
                }
            };
        }

        const activeAudioElements = this.audio.get('activeAudioElements') || [];
        if (audio instanceof Audio) activeAudioElements.push(audio);
        
        audio.onended = () => {
            if (button._progressAnimId) {
                cancelAnimationFrame(button._progressAnimId);
                button._progressAnimId = null;
            }
            if (audio instanceof Audio) {
                const idx = activeAudioElements.indexOf(audio);
                if (idx !== -1) activeAudioElements.splice(idx, 1);
            }
            button.classList.remove('playing');
            if (playerContainer) {
                playerContainer.classList.remove('playing');
                resetWave(playerContainer);
            }
            if (parentMessage) parentMessage.classList.remove('playing');
            if (isNewUI) {
                button.innerHTML = PLAY_SVG;
            }
        };

        button._audioPlayer = audio;
        button.classList.add('playing');
        if (playerContainer) playerContainer.classList.add('playing');
        if (parentMessage) parentMessage.classList.add('playing');

        if (isNewUI) {
            button.innerHTML = PAUSE_SVG;
        }

        // Ejecutar reproducción
        const playAction = audio.play();
        if (playAction instanceof Promise) {
            playAction.catch(err => {
                console.warn("Autoplay block or decode error:", err);
                if (button._progressAnimId) cancelAnimationFrame(button._progressAnimId);
                audio.onended();
            });
        }

        if (audio instanceof Audio) {
            audio.onerror = () => {
                console.error("Error loading/decoding audio:", url);
                if (button._progressAnimId) cancelAnimationFrame(button._progressAnimId);
                audio.onended();
                if (isNewUI && textLabel) textLabel.textContent = 'Error Audio';
            };
        }
    }
}

export { MessageRenderer };
