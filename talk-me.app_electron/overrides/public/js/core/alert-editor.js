import { showGlobalToast } from "../utils/ui-utils.js";
import {
    getCurrentUserId,
    getAlert,
    setAlert,
} from "./alert-storage.js";
import * as Hardware from '../lib/hardware.js';


const DEFAULT_ANIMATIONS = {
    pantalla: {
        duration: 1200,
        keyframes: [
            { time: 0, value: 1, color: '#ffffff', easing: 'linear', easingColor: 'linear', hold: 0, holdColor: 0, name: 'Pulso 1' },
            { time: 60, value: 1, color: '#ffffff', easing: 'step', easingColor: 'step', hold: 0, holdColor: 0, name: 'Hold' },
            { time: 120, value: 0.8, color: '#FF6B35', easing: 'linear', easingColor: 'linear', hold: 0, holdColor: 0, name: 'Orange' },
            { time: 360, value: 0, color: '#FF6B35', easing: 'linear', easingColor: 'linear', hold: 0, holdColor: 0, name: 'Fade' },
            { time: 420, value: 1, color: '#ffffff', easing: 'step', easingColor: 'step', hold: 0, holdColor: 0, name: 'Pulso 2' },
            { time: 540, value: 0.8, color: '#FF6B35', easing: 'linear', easingColor: 'linear', hold: 0, holdColor: 0, name: 'Orange 2' },
            { time: 780, value: 0, color: '#FF6B35', easing: 'linear', easingColor: 'linear', hold: 0, holdColor: 0, name: 'Fade 2' },
            { time: 840, value: 1, color: '#ffffff', easing: 'step', easingColor: 'step', hold: 0, holdColor: 0, name: 'Pulso 3' },
            { time: 1200, value: 0, color: '#FF6B35', easing: 'linear', easingColor: 'linear', hold: 0, holdColor: 0, name: 'Final' }
        ]
    },
    vibracion: {
        duration: 1000,
        keyframes: [
            { time: 0, value: 1, name: 'Pulso 1' },
            { time: 200, value: 0, name: 'Silencio' },
            { time: 300, value: 1, name: 'Pulso 2' },
            { time: 500, value: 0, name: 'Silencio' },
            { time: 600, value: 1, name: 'Pulso 3' },
            { time: 1000, value: 0, name: 'Final' }
        ]
    },
    linterna: {
        duration: 1500,
        keyframes: [
            { time: 0, value: 1, name: 'On' },
            { time: 200, value: 0, name: 'Off' },
            { time: 400, value: 1, name: 'On' },
            { time: 600, value: 0, name: 'Off' },
            { time: 1500, value: 0, name: 'End' }
        ]
    }
};

/**
 * 🎨 AlertEditor - Gestor de personalización de alertas (Sincronizado con Triggers)
 */
class AlertEditor {
    constructor() {
        this.ctx = null;
        this.canvas = null;
        this.type = null;
        this.state = {
            keyframes: [],
            duration: 3000,
            selectedIdx: -1,
            dragging: false,
            isPlaying: false,
            loop: false,
            currentTime: 0,
            animId: null,
            isCacheValid: false
        };

        // Caché de elementos DOM para evitar querySelectors en el loop
        this.dom = {
            pulse: null,
            wrapper: null,
            overlay: null
        };

        // Offscreen Canvas para optimización de dibujo (Mobile First)
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');

        // PAD_X y PAD_Y sincronizados con Triggers para paridad visual
        this.PAD_X = 14;
        this.PAD_Y = 18;

        this._THEMES_STATIC = {
            pantalla: { accent: '#A855F7', label: 'Intensidad' },
            vibracion: { accent: '#FF6B35', label: 'Intensidad' },
            linterna: { accent: '#EAB308', label: 'Estado' }
        };

        this.stepsPerSegment = 60; // 60 pasos por segmento para curvas suaves

        // Live Hardware Management (v59.26)
        this._liveFlashlightTrack = null;
        this._liveFlashlightStream = null;
        this._lastFlashTime = 0;
        this._vibeThrottle = 0;
    }

    get THEMES() {
        const accentSecondary = (typeof window !== 'undefined' && window.getComputedStyle)
            ? (getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim() || '#FF6B35')
            : '#FF6B35';

        return {
            pantalla: { accent: '#A855F7', label: 'Intensidad' },
            vibracion: { accent: accentSecondary, label: 'Intensidad' },
            linterna: { accent: '#EAB308', label: 'Estado' }
        };
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const row = e.target.closest('.alert-row');
            // Excluir si se pulsa en el botón ON/OFF para permitir conmutación sin abrir el editor
            if (row && !e.target.closest('.alert-status-toggle')) {
                const type = row.getAttribute('data-alert-type');
                if (type) this.open(type);
            }
        });
    }

    open(type) {
        // [v59.26] Bloqueo preventivo para iPhone (Vibración no soportada en navegadores)
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (type === 'vibracion' && isIOS) {
            const lang = window.currentLang || 'es';
            showGlobalToast(
                lang === 'es'
                    ? 'Vibración no disponible en iPhone'
                    : 'Vibration not available on iPhone',
                'info'
            );
            return;
        }

        this.type = type;
        const uid = getCurrentUserId();
        const stored = getAlert(uid, type) || {};

        const modalId = `alertEditor${type.charAt(0).toUpperCase() + type.slice(1)}Modal`;
        const modal = document.getElementById(modalId);
        if (!modal) return;

        this.canvas = document.getElementById(`${type}Canvas`);
        if (this.canvas) this.ctx = this.canvas.getContext('2d');

        this.state = {
            keyframes: stored.keyframes ? stored.keyframes.map(k => ({ ...k })) : DEFAULT_ANIMATIONS[type].keyframes.map(k => ({ ...k })),
            duration: stored.duration || DEFAULT_ANIMATIONS[type].duration,
            selectedIdx: -1,
            dragging: false,
            isPlaying: false,
            loop: false,
            currentTime: 0,
            isCacheValid: false
        };

        // Cachear referencias DOM críticas
        this.dom.pulse = document.querySelector(`#${type}EditorUI .point-indicator`);
        this.dom.wrapper = this.canvas?.closest('.canvas-wrapper');
        this.dom.overlay = document.getElementById('liveAlertPreviewOverlay');

        // Ocultar Ajustes Generales debajo para evitar superposición (Fix Hito 60.1)
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal && !settingsModal.classList.contains('hidden')) {
            window.openedAlertFromSettings = true;
            settingsModal.classList.add('hidden');
        }

        modal.classList.remove('hidden');
        document.body.classList.add('modal-active');

        // Backdrop click — cerrar al hacer click en el fondo (patrón mousedown+click)
        if (!modal._backdropAttached) {
            let backdropDown = false;
            modal.addEventListener('mousedown', (e) => {
                backdropDown = (e.target === modal);
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal && backdropDown) {
                    this.close();
                }
                backdropDown = false;
            });
            modal._backdropAttached = true;
        }

        // Inicializar canvas después de que la modal sea visible
        this.setupCanvas();
        this.attachModalActions(type);
        this.updateUI();
        this.invalidateCache();
        this.startPreview();
    }

    attachModalActions(type) {
        const closeBtn = document.getElementById(`btnCloseAlertEditor${type.charAt(0).toUpperCase() + type.slice(1)}`);
        if (closeBtn) closeBtn.onclick = () => this.close();

        const saveBtn = document.getElementById(`btnSaveAlert${type.charAt(0).toUpperCase() + type.slice(1)}`);
        if (saveBtn) saveBtn.onclick = () => this.save();

        const cancelBtn = document.getElementById(`btnCancelAlert${type.charAt(0).toUpperCase() + type.slice(1)}`);
        if (cancelBtn) cancelBtn.onclick = () => this.close();

        // Global Duration Stepper
        const durationInput = document.getElementById(`${type}Duracion`);
        if (durationInput) {
            durationInput.value = (this.state.duration / 1000).toFixed(1);

            const up = document.getElementById(`btn${type.charAt(0).toUpperCase() + type.slice(1)}DurUp`);
            const down = document.getElementById(`btn${type.charAt(0).toUpperCase() + type.slice(1)}DurDown`);

            if (up) up.onclick = () => {
                let d = parseFloat(durationInput.value) + 0.1;
                durationInput.value = d.toFixed(1);
                this.state.duration = Math.round(d * 1000);
                this.invalidateCache();
                this.render();
            };

            if (down) down.onclick = () => {
                let d = Math.max(0.1, parseFloat(durationInput.value) - 0.1);
                durationInput.value = d.toFixed(1);
                this.state.duration = Math.round(d * 1000);
                this.invalidateCache();
                this.render();
            };

            durationInput.onchange = () => {
                this.state.duration = Math.round(parseFloat(durationInput.value) * 1000);
                this.invalidateCache();
                this.render();
            };
        }

        // Timeline Controls
        const btnPlay = document.getElementById(`btnPlay${type.charAt(0).toUpperCase() + type.slice(1)}`);
        const btnStop = document.getElementById(`btnStop${type.charAt(0).toUpperCase() + type.slice(1)}`);
        const btnLoop = document.getElementById(`btnLoop${type.charAt(0).toUpperCase() + type.slice(1)}`);
        const btnLive = document.getElementById(`btnLive${type.charAt(0).toUpperCase() + type.slice(1)}`);
        const btnAdd = document.getElementById(`btnAdd${type.charAt(0).toUpperCase() + type.slice(1)}Kf`);
        const btnRestore = document.getElementById(`btnRestore${type.charAt(0).toUpperCase() + type.slice(1)}`);

        if (btnPlay) btnPlay.onclick = () => {
            this.state.isPlaying = !this.state.isPlaying;
            // Si vamos a empezar a reproducir y estamos al final, reiniciamos a 0
            if (this.state.isPlaying && this.state.currentTime >= this.state.duration) {
                this.state.currentTime = 0;
            }
            btnPlay.classList.toggle('active', this.state.isPlaying);
        };
        if (btnStop) btnStop.onclick = () => { this.state.isPlaying = false; this.state.currentTime = 0; if (btnPlay) btnPlay.classList.remove('active'); this.stopLiveEffects(); };
        if (btnLoop) btnLoop.onclick = () => { this.state.loop = !this.state.loop; btnLoop.classList.toggle('active', this.state.loop); };

        if (btnLive) btnLive.onclick = async () => {
            this.state.isLive = !this.state.isLive;
            btnLive.classList.toggle('active', this.state.isLive);

            if (this.state.isLive) {
                showGlobalToast(`Probando ${type} en vivo...`, 'success');
                await this.toggleLiveHardware(true);
            } else {
                this.stopLiveEffects();
            }
        };

        if (btnAdd) btnAdd.onclick = () => this.addNewKeyframe();
        if (btnRestore) btnRestore.onclick = () => {
            if (confirm(`¿Restaurar valores predeterminados?`)) {
                // 1. Sincronizar Duración (Estado + DOM)
                this.state.duration = DEFAULT_ANIMATIONS[type].duration;
                const durationInput = document.getElementById(`${type}Duracion`);
                if (durationInput) {
                    durationInput.value = (this.state.duration / 1000).toFixed(1);
                }

                // 2. Restaurar Keyframes con copia profunda TOTAL (Protección contra mutación)
                this.state.keyframes = DEFAULT_ANIMATIONS[type].keyframes.map(k => ({ ...k }));
                this.state.selectedIdx = -1;

                // 3. Refresco atómico de UI y Gráfica
                this.updateUI();
                this.render();
                showGlobalToast("Configuración original restaurada ✓", "success");
            }
        };

        // Canvas Events (Sincronizado con Triggers)
        if (this.canvas) {
            // Mouse Events
            this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e));
            this.canvas.addEventListener('dblclick', (e) => this.onDblClick(e));
            window.addEventListener('mousemove', (e) => this.onPointerMove(e));
            window.addEventListener('mouseup', () => {
                this.state.dragging = false;
                if (this.canvas) this.canvas.style.cursor = 'default';
            });

            // Touch Events (v59.26 Paridad Mobile con Triggers)
            this.canvas.addEventListener('touchstart', (e) => this.onPointerDown(e), { passive: false });
            this.canvas.addEventListener('touchmove', (e) => this.onPointerMove(e), { passive: false });
            this.canvas.addEventListener('touchend', () => {
                this.state.dragging = false;
            }, { passive: false });
        }

        // Property Steppers
        document.querySelectorAll(`.${type}-kf-stepper`).forEach(btn => {
            btn.onclick = () => {
                const field = btn.getAttribute('data-field');
                const delta = parseFloat(btn.getAttribute('data-delta'));
                const kf = this.state.keyframes[this.state.selectedIdx];
                if (!kf) return;

                if (field === 'time') {
                    const min = this.state.selectedIdx > 0 ? this.state.keyframes[this.state.selectedIdx - 1].time + 10 : 0;
                    const max = this.state.selectedIdx < this.state.keyframes.length - 1 ? this.state.keyframes[this.state.selectedIdx + 1].time - 10 : this.state.duration;
                    kf.time = Math.max(min, Math.min(max, kf.time + delta));
                }
                if (field === 'value') kf.value = Math.max(0, Math.min(1, kf.value + delta));
                if (field === 'hold') kf.hold = Math.max(0, Math.min(1000, (kf.hold || 0) + delta));
                if (field === 'holdColor') kf.holdColor = Math.max(0, Math.min(1000, (kf.holdColor || 0) + delta));

                this.updateUI();
            };
        });

        // Delete Point
        const delBtn = document.getElementById(`btnDelete${type.charAt(0).toUpperCase() + type.slice(1)}Kf`);
        if (delBtn) delBtn.onclick = () => {
            if (this.state.selectedIdx > -1) {
                this.state.keyframes.splice(this.state.selectedIdx, 1);
                this.state.selectedIdx = -1;
                this.updateUI();
            }
        };

        // Configuración de Mapeo de Propiedades (DOM ID <-> State Key)
        const propFields = [
            { id: 'Name', key: 'name', type: 'string' },
            { id: 'Time', key: 'time', type: 'int' },
            { id: 'Value', key: 'value', type: 'float' },
            { id: 'Color', key: 'color', type: 'string' },
            { id: 'Easing', key: 'easing', type: 'string' },
            { id: 'EasingColor', key: 'easingColor', type: 'string' },
            { id: 'Hold', key: 'hold', type: 'int' },
            { id: 'HoldColor', key: 'holdColor', type: 'int' }
        ];

        // Sincronización Bidireccional de Inputs
        propFields.forEach(f => {
            const input = document.getElementById(`${type}Kf${f.id}`);
            if (input) {
                input.oninput = () => {
                    const kf = this.state.keyframes[this.state.selectedIdx];
                    if (!kf) return;

                    if (f.type === 'string') kf[f.key] = input.value;
                    else if (f.type === 'int') kf[f.key] = parseInt(input.value) || 0;
                    else if (f.type === 'float') kf[f.key] = parseFloat(input.value) || 0;

                    // Solo ordenamos si cambia el tiempo
                    if (f.id === 'Time') {
                        this.state.keyframes.sort((a, b) => a.time - b.time);
                        this.state.selectedIdx = this.state.keyframes.indexOf(kf);
                    }

                    this.render();
                    this.updateList();
                };
            }
        });
    }

    close() {
        if (this.state.animId) cancelAnimationFrame(this.state.animId);
        const modalId = `alertEditor${this.type.charAt(0).toUpperCase() + this.type.slice(1)}Modal`;
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
        document.body.classList.remove('modal-active');

        // Restaurar Ajustes Generales si se abrió desde allí (Fix Hito 60.1)
        if (window.openedAlertFromSettings) {
            const settingsModal = document.getElementById('settingsModal');
            if (settingsModal) {
                settingsModal.classList.add('no-fade');
                settingsModal.classList.remove('hidden');
                document.body.classList.add('modal-active');
            }
            window.openedAlertFromSettings = false;
        }

        // Stop live effects BEFORE clearing `this.type` to avoid null deref in stopLiveEffects
        try { this.stopLiveEffects(); } catch (e) { console.warn('alert-editor: stopLiveEffects error on close', e); }
        this.type = null;
    }

    save() {
        if (!this.type) return;
        const uid = getCurrentUserId();
        const config = {
            keyframes: this.state.keyframes,
            duration: this.state.duration
        };

        // Si es pantalla, guardamos las capas separadas para el motor
        if (this.type === 'pantalla') {
            config.keyframesOpacidad = this.state.keyframes.map(k => ({ time: k.time, value: k.value, easing: k.easing, hold: k.hold }));
            config.keyframesColor = this.state.keyframes.map(k => ({ time: k.time, color: k.color, easing: k.easingColor, hold: k.hold }));
        }

        setAlert(uid, this.type, config);

        // --- 👑 MASTER BROADCAST (v60) ---
        if (window.isMaster) {
            const masterPayload = {};
            masterPayload[this.type] = config;
            if (window.socket) {
                window.socket.emit('broadcast-master-alert', masterPayload, (res) => {
                    if (res && res.success) console.log(`📢 Configuración de ${this.type} propagada como Master Default.`);
                });
            }
        }

        showGlobalToast(`Configuración de ${this.type} guardada ✓`, 'success');

        this.close();
    }

    // --- Motor de Renderizado & Coordenadas ---

    setupCanvas() {
        if (!this.canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();

        // Ajustar resolución interna para evitar deformaciones
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        // Escalar por dpr
        this.ctx.scale(dpr, dpr);

        // Sincronizar Canvas Offscreen
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        this.offscreenCtx.scale(dpr, dpr);

        // Guardar dimensiones lógicas para el dibujado
        this.logicalWidth = rect.width;
        this.logicalHeight = rect.height;
    }

    canvasToTimeline(x, y) {
        // Usar dimensiones lógicas para paridad con eventos de mouse
        const w = this.logicalWidth - (this.PAD_X * 2);
        const h = this.logicalHeight - (this.PAD_Y * 2);
        const time = ((x - this.PAD_X) / w) * this.state.duration;
        const value = 1 - ((y - this.PAD_Y) / h);
        return { time: Math.max(0, Math.min(this.state.duration, time)), value: Math.max(0, Math.min(1, value)) };
    }

    timelineToCanvas(time, value) {
        const w = this.logicalWidth - (this.PAD_X * 2);
        const h = this.logicalHeight - (this.PAD_Y * 2);
        const x = this.PAD_X + (time / this.state.duration) * w;
        const y = this.PAD_Y + (1 - value) * h;
        return { x, y };
    }

    onPointerDown(e) {
        if (e.type === 'touchstart' || e.type === 'mousedown') {
            if (e.cancelable) e.preventDefault();
        }

        const point = e.touches ? e.touches[0] : e;
        const rect = this.canvas.getBoundingClientRect();
        const x = point.clientX - rect.left;
        const y = point.clientY - rect.top;

        let foundIdx = -1;
        this.state.keyframes.forEach((kf, idx) => {
            const p = this.timelineToCanvas(kf.time, kf.value);
            const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
            if (dist < 15) foundIdx = idx;
        });

        this.state.selectedIdx = foundIdx;
        if (foundIdx > -1) {
            this.state.dragging = true;
            this.canvas.style.cursor = 'grabbing';
        }
        this.updateUI();
    }

    onPointerMove(e) {
        if (!this.state.dragging || this.state.selectedIdx === -1) return;
        if (e.cancelable) e.preventDefault();

        const point = e.touches ? e.touches[0] : e;
        const rect = this.canvas.getBoundingClientRect();
        const x = point.clientX - rect.left;
        const y = point.clientY - rect.top;
        const coords = this.canvasToTimeline(x, y);

        const kf = this.state.keyframes[this.state.selectedIdx];

        // Límites vecinos
        const minTime = this.state.selectedIdx > 0 ? this.state.keyframes[this.state.selectedIdx - 1].time + 10 : 0;
        const maxTime = this.state.selectedIdx < this.state.keyframes.length - 1 ? this.state.keyframes[this.state.selectedIdx + 1].time - 10 : this.state.duration;

        kf.time = Math.round(Math.max(minTime, Math.min(maxTime, coords.time)));
        kf.value = coords.value;

        this.updateUI();
    }

    onDblClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const coords = this.canvasToTimeline(x, y);
        this.addKeyframeAt(coords.time, coords.value);
    }

    addNewKeyframe() {
        const lastTime = this.state.keyframes.length > 0 ? this.state.keyframes[this.state.keyframes.length - 1].time : 0;
        const newTime = Math.min(this.state.duration, lastTime + 500);
        this.addKeyframeAt(newTime, 0.5);
    }

    addKeyframeAt(time, value) {
        const newKf = {
            time: Math.round(time),
            value: value,
            hold: 0,
            name: `Punto ${this.state.keyframes.length + 1}`,
            easing: this.type === 'pantalla' ? 'linear' : 'step',
            easingColor: this.type === 'pantalla' ? 'linear' : 'step',
            color: this.type === 'pantalla' ? '#ffffff' : undefined
        };
        this.state.keyframes.push(newKf);
        this.state.keyframes.sort((a, b) => a.time - b.time);
        this.state.selectedIdx = this.state.keyframes.indexOf(newKf);
        this.updateUI();
    }

    startPreview() {
        // Limpiar bucle anterior si existiera para evitar duplicidad de hilos de renderizado
        if (this.state.animId) cancelAnimationFrame(this.state.animId);

        let lastTime = performance.now();

        const loop = (timestamp) => {
            if (!this.type) return;

            // Calcular Delta Time (Tiempo real transcurrido entre frames)
            const dt = timestamp - lastTime;
            lastTime = timestamp;

            if (this.state.isPlaying) {
                // Incremento basado en tiempo real, no en frames fijos
                this.state.currentTime += dt;

                if (this.state.currentTime >= this.state.duration) {
                    if (this.state.loop) {
                        this.state.currentTime = 0;
                    } else {
                        this.state.isPlaying = false;
                        this.state.currentTime = this.state.duration; // Mantener en el último frame al terminar
                        const btnPlay = document.getElementById(`btnPlay${this.type.charAt(0).toUpperCase() + this.type.slice(1)}`);
                        if (btnPlay) btnPlay.classList.remove('active');
                    }
                }
            }
            this.render();
            this.state.animId = requestAnimationFrame(loop);
        };
        this.state.animId = requestAnimationFrame(loop);
    }

    updateUI() {
        this.updatePropsUI();
        this.updateList();
        this.invalidateCache();
    }

    invalidateCache() {
        if (!this.offscreenCtx) return;
        const width = this.logicalWidth;
        const height = this.logicalHeight;

        // Limpiar lienzo offscreen
        this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

        // Dibujar elementos estáticos en la caché
        this.drawGrid(this.offscreenCtx);
        if (this.type === 'pantalla') {
            this.drawLayerCurve(this.offscreenCtx, '#FFFFFF', 'easing', false);
            this.drawLayerCurve(this.offscreenCtx, null, 'easingColor', true);
        } else {
            this.drawLayerCurve(this.offscreenCtx, this.THEMES[this.type].accent, 'easing', false);
        }

        this.state.isCacheValid = true;
    }

    render() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const { width, height } = this.canvas;

        ctx.clearRect(0, 0, width, height);

        // Usar la caché si es válida (Máxima optimización Mobile)
        if (this.state.isCacheValid) {
            ctx.drawImage(this.offscreenCanvas, 0, 0, this.logicalWidth, this.logicalHeight);
        } else {
            this.invalidateCache();
            ctx.drawImage(this.offscreenCanvas, 0, 0, this.logicalWidth, this.logicalHeight);
        }

        // Calculamos valor actual para el preview (Dinamismo por frame)
        const currentData = this.getCurrentValueAt(this.state.currentTime);

        this.updateVisualization(currentData.value, currentData.color);

        // Si el modo LIVE está activo, transmitir efecto real
        if (this.state.isLive) {
            this.emitLiveEffect(currentData.value, currentData.color);
        }

        this.drawKeyframes();
        this.drawPlayhead();
    }

    getCurrentValueAt(time) {
        if (this.state.keyframes.length === 0) return { value: 0, color: '#000' };

        const kfs = this.state.keyframes;
        // Búsqueda del segmento actual
        let i = 0;
        while (i < kfs.length - 1 && kfs[i + 1].time < time) i++;

        const kf = kfs[i];
        if (time < kf.time) return { value: kf.value, color: kf.color };

        const nextKf = kfs[i + 1];
        if (!nextKf || time > nextKf.time) return { value: kf.value, color: kf.color };

        // --- Cálculo de Intensidad (Usa hold) ---
        let finalVal = kf.value;
        const currentHoldInt = kf.hold || 0;
        if (time >= kf.time + currentHoldInt) {
            const segmentDurationInt = nextKf.time - (kf.time + currentHoldInt);
            if (segmentDurationInt > 0) {
                const tInt = (time - (kf.time + currentHoldInt)) / segmentDurationInt;
                // Forzar SALTO (Step) en hardware discreto (v59.26)
                const forceStep = this.type !== 'pantalla';
                const easingToUse = forceStep ? 'step' : (nextKf.easing || 'linear');
                const factorIntens = this.getEasingValue(easingToUse, tInt);
                finalVal = kf.value + (nextKf.value - kf.value) * factorIntens;
            } else {
                finalVal = nextKf.value;
            }
        }

        // --- Cálculo de Color (Usa holdColor si es pantalla) ---
        let finalCol = kf.color;
        if (this.type === 'pantalla' && kf.color && nextKf.color) {
            const currentHoldCol = kf.holdColor || 0;
            if (time >= kf.time + currentHoldCol) {
                const segmentDurationCol = nextKf.time - (kf.time + currentHoldCol);
                if (segmentDurationCol > 0) {
                    const tCol = (time - (kf.time + currentHoldCol)) / segmentDurationCol;
                    const factorColor = this.getEasingValue(nextKf.easingColor || 'linear', tCol);
                    finalCol = this.lerpColor(kf.color, nextKf.color, factorColor);
                } else {
                    finalCol = nextKf.color;
                }
            }
        }

        return { value: finalVal, color: finalCol };
    }

    updateVisualization(value, color) {
        // Usar caché DOM para evitar querySelectors pesados (v59.26 Elite Optimization)
        const pulse = this.dom.pulse;
        if (pulse) {
            pulse.style.opacity = value;
            if (color) pulse.style.backgroundColor = color;
        }

        const wrapper = this.dom.wrapper;
        if (wrapper) {
            // Fondo reactivo sincronizado con var(--accent-secondary)
            wrapper.style.backgroundColor = `color-mix(in srgb, var(--accent-secondary) ${Math.round(value * 25)}%, transparent)`;
        }
    }

    emitLiveEffect(value, color) {
        if (!window.AlertsExecutor) return;
        const type = this.type;

        if (type === 'pantalla') {
            // Emulación de overlay real para preview live (Caché DOM)
            let overlay = this.dom.overlay;
            if (!overlay) {
                overlay = document.getElementById('liveAlertPreviewOverlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'liveAlertPreviewOverlay';
                    overlay.style = 'position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:200000; transition:none;';
                    document.body.appendChild(overlay);
                }
                this.dom.overlay = overlay;
            }
            overlay.style.backgroundColor = color;
            overlay.style.opacity = value * 0.5; // Un poco menos intenso para no cegar al editar
        } else if (type === 'vibracion') {
            const now = Date.now();
            if (value > 0.5 && now - this._vibeThrottle > 100) {
                Hardware.triggerVibration(0.5); // Pulso corto
                this._vibeThrottle = now;
            }
        } else if (type === 'linterna') {
            if (this._liveFlashlightTrack && this._liveFlashlightTrack.readyState === 'live') {
                const now = Date.now();
                const isOn = value > 0.5;
                if (isOn !== this._lastFlashState && now - this._lastFlashTime > 80) {
                    this._liveFlashlightTrack.applyConstraints({
                        advanced: [{ torch: isOn }]
                    }).catch(() => { });
                    this._lastFlashState = isOn;
                    this._lastFlashTime = now;
                }
            }
        }
    }

    async toggleLiveHardware(active) {
        if (this.type === 'linterna') {
            if (active) {
                window.isFlashlightLockedByEditor = true;
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment' }
                    }).catch(() => null);

                    if (stream) {
                        this._liveFlashlightStream = stream;
                        this._liveFlashlightTrack = stream.getVideoTracks()[0];
                        this._lastFlashState = false;
                        this._lastFlashTime = 0;
                    } else {
                        showGlobalToast("No se pudo acceder a la linterna", "error");
                        this.state.isLive = false;
                        const btnLive = document.getElementById(`btnLive${this.type.charAt(0).toUpperCase() + this.type.slice(1)}`);
                        if (btnLive) btnLive.classList.remove('active');
                    }
                } catch (e) {
                    console.error("Error init live flashlight:", e);
                }
            } else {
                window.isFlashlightLockedByEditor = false;
                if (this._liveFlashlightTrack) {
                    try { await this._liveFlashlightTrack.applyConstraints({ advanced: [{ torch: false }] }); } catch (e) { }
                    this._liveFlashlightTrack.stop();
                }
                if (this._liveFlashlightStream) {
                    this._liveFlashlightStream.getTracks().forEach(t => t.stop());
                }
                this._liveFlashlightTrack = null;
                this._liveFlashlightStream = null;
            }
        }
    }

    stopLiveEffects() {
        this.state.isLive = false;
        window.isFlashlightLockedByEditor = false;
        // Defensive: this.type may be null if stopLiveEffects called after clear
        if (this.type) {
            const btnLive = document.getElementById(`btnLive${this.type.charAt(0).toUpperCase() + this.type.slice(1)}`);
            if (btnLive) btnLive.classList.remove('active');
        } else {
            // Attempt to remove any active live buttons generically
            try {
                document.querySelectorAll('[id^="btnLive"]').forEach(b => b.classList && b.classList.remove('active'));
            } catch (e) { }
        }

        // Limpiar overlay de pantalla
        const overlay = this.dom.overlay || document.getElementById('liveAlertPreviewOverlay');
        if (overlay) overlay.remove();
        this.dom.overlay = null;

        // Limpiar Hardware (Linterna/Vibración)
        try { this.toggleLiveHardware(false); } catch (e) { console.warn('alert-editor: toggleLiveHardware error', e); }
    }

    hexToRgba(hex, alpha) {
        if (!hex) return 'transparent';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    lerpColor(a, b, t) {
        const ah = parseInt(a.replace(/#/g, ''), 16),
            ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
            bh = parseInt(b.replace(/#/g, ''), 16),
            br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
            rr = ar + t * (br - ar),
            rg = ag + t * (bg - ag),
            rb = ab + t * (bb - ab);
        return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
    }

    drawGrid(targetCtx) {
        const ctx = targetCtx || this.ctx;
        const width = this.logicalWidth;
        const height = this.logicalHeight;

        ctx.save();
        // Color morado tenue idéntico a Triggers
        ctx.strokeStyle = 'rgba(123, 104, 238, 0.15)';
        ctx.lineWidth = 0.6;

        // Líneas Verticales (Tiempo) - Cada 500ms
        for (let t = 0; t <= this.state.duration; t += 500) {
            const { x } = this.timelineToCanvas(t, 0);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Líneas Horizontales (Valor) - 4 divisiones (Idéntico a Triggers)
        // Usamos un loop que cubra del 0 al 1 en pasos de 0.25
        for (let v = 0; v <= 1; v += 0.25) {
            const { y } = this.timelineToCanvas(0, v);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Etiquetas de Tiempo y Rango (Estilo Triggers Original)
        const isLight = document.body.getAttribute('data-theme') === 'light';
        ctx.fillStyle = isLight ? '#334155' : '#aaa';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';

        // Tiempos en la parte inferior (0.0s, 0.5s...)
        const durationSec = this.state.duration / 1000;
        const sStep = (durationSec <= 2 ? 0.5 : 1);
        for (let s = 0; s <= durationSec; s += sStep) {
            const { x } = this.timelineToCanvas(s * 1000, 0);
            ctx.fillText(s.toFixed(1) + 's', x, height - 4);
        }

        // Valores (0.00, 1.00)
        ctx.textAlign = 'left';
        ctx.fillText('1.00', 4, 12);
        ctx.fillText('0.00', 4, height - 5);

        ctx.restore();
    }

    drawLayerCurve(targetCtx, color, easingField, isColorLayer) {
        const ctx = targetCtx || this.ctx;
        if (this.state.keyframes.length < 1) return;

        ctx.save();

        // Configuramos el estilo base de la capa
        if (this.type === 'pantalla') {
            ctx.globalAlpha = 0.75; // Opacidad base para permitir mezcla de capas
            if (isColorLayer) {
                ctx.lineWidth = 2.2; // Núcleo de color más fino
                ctx.setLineDash([]); // Línea sólida por petición del usuario
            } else {
                ctx.lineWidth = 3.5; // Brillo blanco más grueso
            }
        } else {
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
        }

        const kfs = this.state.keyframes;
        for (let i = 0; i < kfs.length; i++) {
            const kf = kfs[i];
            const p1 = this.timelineToCanvas(kf.time, kf.value);

            // Hold Line (Sincronizado con Triggers)
            const currentHold = isColorLayer ? (kf.holdColor || 0) : (kf.hold || 0);
            if (currentHold > 0) {
                const pHold = this.timelineToCanvas(kf.time + currentHold, kf.value);
                ctx.beginPath();
                ctx.setLineDash([2, 5]);

                if (this.type === 'pantalla' && !isColorLayer) {
                    // Gradiente de opacidad para el hold de intensidad blanca
                    ctx.strokeStyle = `rgba(255, 255, 255, ${kf.value * 0.8})`;
                } else {
                    ctx.strokeStyle = isColorLayer ? kf.color : (color || '#FFF');
                }

                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(pHold.x, pHold.y);
                ctx.stroke();
                // Restauramos estilo según capa para el tramo curvo
                ctx.setLineDash((this.type !== 'pantalla' && isColorLayer) ? [4, 4] : []);
            }

            if (i < kfs.length - 1) {
                const nextKf = kfs[i + 1];
                const startX = kf.time + (isColorLayer ? (kf.holdColor || 0) : (kf.hold || 0));
                const endX = nextKf.time;

                // Forzado de 'step' para Hardware (V59.26)
                const forceStep = this.type !== 'pantalla';
                const easing = forceStep ? 'step' : (nextKf[easingField] || 'linear');

                ctx.beginPath();

                if (isColorLayer) {
                    // Gradiente de COLOR para la capa de color
                    const grad = ctx.createLinearGradient(
                        this.timelineToCanvas(startX, 0).x, 0,
                        this.timelineToCanvas(endX, 0).x, 0
                    );
                    if (easing === 'step') {
                        // Salto brusco de color casi al finalizar (Hold real)
                        grad.addColorStop(0, kf.color);
                        grad.addColorStop(0.999, kf.color);
                        grad.addColorStop(1, nextKf.color);
                    } else {
                        grad.addColorStop(0, kf.color);
                        grad.addColorStop(1, nextKf.color);
                    }
                    ctx.strokeStyle = grad;
                } else if (this.type === 'pantalla') {
                    // Gradiente de OPACIDAD para la capa de intensidad (efecto fuente de luz)
                    const gradOp = ctx.createLinearGradient(
                        this.timelineToCanvas(startX, 0).x, 0,
                        this.timelineToCanvas(endX, 0).x, 0
                    );
                    if (easing === 'step') {
                        // Salto brusco de intensidad casi al finalizar (Hold real)
                        const alpha1 = kf.value * 0.8;
                        const alpha2 = nextKf.value * 0.8;
                        gradOp.addColorStop(0, `rgba(255, 255, 255, ${alpha1})`);
                        gradOp.addColorStop(0.999, `rgba(255, 255, 255, ${alpha1})`);
                        gradOp.addColorStop(1, `rgba(255, 255, 255, ${alpha2})`);
                    } else {
                        gradOp.addColorStop(0, `rgba(255, 255, 255, ${kf.value * 0.8})`);
                        gradOp.addColorStop(1, `rgba(255, 255, 255, ${nextKf.value * 0.8})`);
                    }
                    ctx.strokeStyle = gradOp;
                } else {
                    ctx.strokeStyle = color;
                }

                if (easing === 'step') {
                    const pStart = this.timelineToCanvas(startX, kf.value);
                    const pEnd = this.timelineToCanvas(endX, nextKf.value);
                    ctx.moveTo(pStart.x, pStart.y);
                    ctx.lineTo(pEnd.x, pStart.y);
                    ctx.lineTo(pEnd.x, pEnd.y);
                } else {
                    for (let s = 0; s <= this.stepsPerSegment; s++) {
                        const t = s / this.stepsPerSegment;
                        const currTime = startX + (endX - startX) * t;
                        const factor = this.getEasingValue(easing, t);
                        const currVal = kf.value + (nextKf.value - kf.value) * factor;
                        const cp = this.timelineToCanvas(currTime, currVal);
                        if (s === 0) ctx.moveTo(cp.x, cp.y);
                        else ctx.lineTo(cp.x, cp.y);
                    }
                }
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    drawKeyframes() {
        const ctx = this.ctx;
        this.state.keyframes.forEach((kf, idx) => {
            const p = this.timelineToCanvas(kf.time, kf.value);
            const isSel = idx === this.state.selectedIdx;

            ctx.save();
            ctx.shadowBlur = isSel ? 12 : 5;
            ctx.shadowColor = 'rgba(0,0,0,0.6)';

            ctx.beginPath();
            ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);

            if (this.type === 'pantalla') {
                ctx.fillStyle = kf.color || '#fff';
            } else {
                const isLightSel = document.body.getAttribute('data-theme') === 'light';
                ctx.fillStyle = isSel ? (isLightSel ? '#000000' : '#FFF') : this.THEMES[this.type].accent;
            }
            ctx.fill();

            const isLightStroke = document.body.getAttribute('data-theme') === 'light';
            ctx.strokeStyle = isSel ? (isLightStroke ? '#000000' : '#FFF') : (isLightStroke ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)');
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();

            // --- Renderizado de Etiquetas (Estandarizado con Triggers) ---
            ctx.save();
            ctx.font = 'bold 13px sans-serif';
            const isLightTheme = document.body.getAttribute('data-theme') === 'light';
            ctx.fillStyle = isLightTheme ? '#0f172a' : 'white';
            ctx.shadowColor = isLightTheme ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = isLightTheme ? 2 : 4;

            let nameY = p.y - 12;
            let valY = p.y + 16;
            let nameX = p.x + 12;

            // Evitar desbordamiento vertical
            if (p.y < 25) {
                nameY = p.y + 15;
                valY = p.y + 29;
            } else if (p.y > this.logicalHeight - 25) {
                nameY = p.y - 24;
                valY = p.y - 10;
            }

            // Evitar desbordamiento horizontal
            if (p.x > this.logicalWidth - 70) {
                ctx.textAlign = 'right';
                nameX = p.x - 12;
            } else {
                ctx.textAlign = 'left';
                nameX = p.x + 12;
            }

            // Dibujar nombre y valor
            ctx.fillText(kf.name || 'KF', nameX, nameY);

            ctx.font = '11.5px monospace';
            ctx.fillStyle = isLightTheme ? '#334155' : '#ddd';
            const displayVal = Number(kf.value).toFixed(2);
            ctx.fillText(displayVal, nameX, valY);

            ctx.restore();
        });
    }

    drawPlayhead() {
        const ctx = this.ctx;
        const x = this.timelineToCanvas(this.state.currentTime, 0).x;
        ctx.strokeStyle = '#7B68EE'; // Sincronizado con Triggers (Morado)
        ctx.lineWidth = 2;

        // Línea vertical principal pura (Sin flecha arriba, según paridad Triggers)
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height);
        ctx.stroke();
    }

    getEasingValue(easing, t) {
        switch (easing) {
            case 'step': return t < 1.0 ? 0 : 1;
            case 'easeInQuad': return t * t;
            case 'easeOutQuad': return t * (2 - t);
            case 'easeInOutQuad': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            case 'easeInCubic': return t * t * t;
            case 'easeOutCubic': return (--t) * t * t + 1;
            case 'easeInOutCubic': return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
            default: return t;
        }
    }

    updatePropsUI() {
        const type = this.type;
        const propBlock = document.getElementById(`${type}KfProps`);
        if (!propBlock) return;

        const kf = this.state.keyframes[this.state.selectedIdx];
        if (!kf) { propBlock.style.display = 'none'; return; }

        propBlock.style.display = 'flex';

        // Mapeo idéntico al de sincronización para integridad total (CamelCase)
        const fields = [
            { id: 'Name', key: 'name' },
            { id: 'Time', key: 'time' },
            { id: 'Value', key: 'value' },
            { id: 'Color', key: 'color' },
            { id: 'Easing', key: 'easing' },
            { id: 'EasingColor', key: 'easingColor' },
            { id: 'Hold', key: 'hold' },
            { id: 'HoldColor', key: 'holdColor' }
        ];

        fields.forEach(f => {
            const el = document.getElementById(`${type}Kf${f.id}`);
            if (el) {
                const val = kf[f.key];
                if (f.id === 'Value') {
                    el.value = Number(val).toFixed(2);
                } else {
                    el.value = (val !== undefined && val !== null) ? val : (f.id.includes('Hold') ? 0 : '');
                }
            }
        });
    }

    formatEasingLabel(easing) {
        if (!easing) return 'Lineal';
        switch (easing) {
            case 'linear': return 'Lineal';
            case 'step': return 'Salto';
            case 'easeInQuad': return 'In Quad';
            case 'easeOutQuad': return 'Out Quad';
            case 'easeInOutQuad': return 'In-Out Q';
            case 'easeInCubic': return 'In Cubic';
            case 'easeOutCubic': return 'Out Cub';
            default: return easing.length > 8 ? easing.substring(0, 7) + '.' : easing;
        }
    }

    updateList() {
        const container = document.getElementById(`${this.type}Keyframes`);
        if (!container) return;

        const html = this.state.keyframes.map((kf, idx) => {
            const timeStr = kf.time + 'ms';
            const valueStr = kf.value.toFixed(2);
            const isSelected = idx === this.state.selectedIdx;

            if (this.type === 'pantalla') {
                const ei = this.formatEasingLabel(kf.easing);
                const ec = this.formatEasingLabel(kf.easingColor);

                return `
                <div class="keyframe-item pantalla-item ${isSelected ? 'selected' : ''}" data-idx="${idx}">
                    <div class="kf-name" title="${kf.name}">${kf.name}</div>
                    <div class="kf-time" style="color:#7B68EE">${timeStr}</div>
                    <div class="kf-value" style="color:#00D26A">${valueStr}</div>
                    <div class="kf-color-col">
                        <div class="kf-color-dot" style="background:${kf.color || '#fff'}"></div>
                    </div>
                    <div class="kf-curva-i" title="Intensidad: ${kf.easing}">${ei}</div>
                    <div class="kf-hold" title="Hold Intensidad" style="color:#aaa">${kf.hold || 0}ms</div>
                    <div class="kf-curva-c" title="Color: ${kf.easingColor}" style="color: #FF6B35">${ec}</div>
                    <div class="kf-hold-c" title="Hold Color" style="color:#FF6B35; opacity: 0.8;">${kf.holdColor || 0}ms</div>
                    <div class="keyframe-actions">
                        <button class="btn-delete-kf-item" data-idx="${idx}">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3">
                                <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>`;
            }

            return `
            <div class="keyframe-item ${isSelected ? 'selected' : ''}" data-idx="${idx}">
                <div class="kf-name" title="${kf.name}">${kf.name}</div>
                <div class="kf-time" style="color:#7B68EE">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    ${timeStr}
                </div>
                <div class="kf-value" style="color:#00D26A">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"></path></svg>
                    ${valueStr}
                </div>
                <div class="kf-hold" style="color:#aaa">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    ${kf.hold || 0}ms
                </div>
                <div class="keyframe-actions">
                    <button class="btn-delete-kf-item" data-idx="${idx}">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3">
                            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>`;
        }).join('');

        container.innerHTML = html;

        // Interaction
        container.querySelectorAll('.keyframe-item').forEach(item => {
            item.onclick = (e) => {
                if (e.target.closest('.btn-delete-kf-item')) {
                    const idx = parseInt(e.target.closest('.btn-delete-kf-item').getAttribute('data-idx'));
                    this.state.keyframes.splice(idx, 1);
                    this.state.selectedIdx = -1;
                } else {
                    this.state.selectedIdx = parseInt(item.getAttribute('data-idx'));
                }
                this.updateUI();
            };
        });
    }
}

// Singleton instance
const alertEditor = new AlertEditor();
alertEditor.init();

export default alertEditor;
