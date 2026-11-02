/**
 * 🎚️ TriggersModule - Sistema completo de triggers y keyframes
 * 
 * Propósito: Extraer TODAS las funciones de triggers (~1000+ líneas) del archivo principal.
 * 
 * INCLUYE:
 *   ✅ Canvas + Interpolación
 *   ✅ Keyframes editor (agregar/editar/eliminar)
 *   ✅ Preview/reproducción
 *   ✅ Trigger forms (open/save/close)
 *   ✅ Trigger list rendering
 *   ✅ MIDI/OSC/sACN integration
 * 
 * DEPENDENCIAS:
 *   - trigger-engine.js (importar funciones core)
 *   - module-dom-manager.js (para referencias)
 *   - ui-utils.js (para feedback visual)
 */
import {
    initTriggerWorker,
    sendTriggerValue,
    getMergedTriggers,
    executeKeyframeAnimation,
    applyEasing,
    isTriggerEnabled,
    setTriggerEnabled,
    triggerWorker,
    midiOutputPort,
    sendMIDIRaw,
    setServerTriggers,
    setLocalTriggers,
    getEnabledTriggerIds
} from './trigger-engine.js';

// Exponer al objeto window para compatibilidad con script.js (v60)
window.setServerTriggers = setServerTriggers;
window.setLocalTriggers = setLocalTriggers;
window.getMergedTriggers = getMergedTriggers;

import { showCatFeedback } from '../utils/ui-utils.js';
// Importaciones core completadas

class TriggersModule {
    constructor(domManager, audioState, socketEmit) {
        this.dom = domManager;
        this.audio = audioState;
        this.safeEmit = socketEmit;

        // Constantes del Canvas
        this.PAD_X = 14;
        this.PAD_Y = 18;

        // Rango de valores por tipo
        this.RANGES = {
            osc: { min: 0, max: 1, step: 0.01, delta: 0.05 },
            midi: { min: 0, max: 127, step: 1, delta: 1 },
            sacn: { min: 0, max: 255, step: 1, delta: 1 }
        };

        // Estado del módulo
        this.state = {
            currentTriggerId: null,
            keyframes: [],
            selectedKfIndex: -1,
            dragging: false,
            isPlayingPreview: false,
            isLoopingPreview: false,
            liveMode: false,
            currentTab: 'OUT', // [v60] Pestaña inicial
            searchQueryIn: '',
            searchQueryOut: '',

            currentPreviewTime: 0,
            previewDuration: 3000,
            globalDurationSec: 3.0,
            maxTime: 3000,

            triggerType: 'osc',
            currentRange: this.RANGES.osc,
            typeConfig: {
                osc: { host: "127.0.0.1", port: 9000, address: "/test", arg: "1.0" },
                midi: { deviceId: "default", subtype: "note", channel: 1, note: 60, velocity: 127 },
                sacn: { universe: 1, priority: 100, mode: "multicast", destinationIp: "", channels: '[{"channel":1,"value":255}]' }
            },

            previewAnimationId: null,
            isDraggingCursor: false,

            // [v60] Estado Editor IN
            inType: 'osc',
            inSmpteRanges: [],
            inSmpteInputsDirty: false,
            inSmpteSelectedIdx: -1,
            inConfig: {
                osc: { host: '127.0.0.1', port: 9000, address: '/trigger', arg: '' },
                midi: { deviceId: 'default', type: 'note', note: 60, channel: 1, velocity: 127 },
                sacn: { universe: 1, priority: 100, mode: 'multicast', ip: '', mask: '255.255.255.0', channels: '[]', direction: 'IN' },
                smpte: { timecode: '00:00:00:00', timecodeStart: '00:00:00:00', timecodeEnd: '00:00:00:00', timecodes: [] }
            },
            inMedia: {
                audioBlob: null,
                audioUrl: null,
                imageBlob: null,
                imageUrl: null,
                isRecording: false
            }
        };

        // DOM refs (caché local del catálogo centralizado)
        this.canvas = null;
        this.ctx = null;
        this.cursor = null;

        // [v60] Captura SMPTE Bridge
        // [v60.Elite] Ahora usamos el motor de captura global de window para escucha continua
        this.smpteCapture = window.smpteCapture;

        if (!this.smpteCapture) {
            console.error('❌ Error: Motor SMPTE global no inicializado.');
        }

        // Inicializar
        this.init();
    }

    init() {
        // Inicializar Canvas
        this.canvas = this.dom.get('triggers', 'canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');

        // Crear cursor dinámicamente si no existe
        const wrapper = this.canvas.closest('.canvas-wrapper');
        if (wrapper) {
            this.cursor = wrapper.querySelector('.timeline-cursor');
            if (!this.cursor) {
                this.cursor = document.createElement('div');
                this.cursor.className = 'timeline-cursor';
                wrapper.appendChild(this.cursor);
            }
        }

        this._initEventListeners();
        this._initCanvasRendering();
    }

    /**
     * [v60] Inyecta el socket y configura los listeners de red.
     * Se llama desde el controlador principal una vez el socket está listo.
     */
    connectSocket(socket) {
        if (!socket) return;
        this.dom.socket = socket; // Para compatibilidad interna si fuera necesario
        if (this.smpteCapture) this.smpteCapture.socket = socket;

        // [v60.Elite] Sincronización Inicial de Soberanía
        setTimeout(() => {
            if (typeof getEnabledTriggerIds === 'function') {
                this.safeEmit('sync-triggers-state', { enabledTriggerIds: getEnabledTriggerIds() });
            }
        }, 1000);

        // --- LISTENERS SMPTE SOCKET ---
        socket.on('smpte-update', (data) => {
            // [v60.Elite] Filtrado por canal para evitar "flicker" entre múltiples fuentes
            const currentChan = this.smpteCapture ? this.smpteCapture.currentChannelIndex : 0;
            if (typeof data.channel !== 'undefined' && data.channel !== currentChan) return;

            // [v60.Elite] FLYWHEEL / INTERPOLACIÓN VISUAL
            this._lastSmpteUpdate = Date.now();
            this._currentSmpteData = data;
            this._updateSmpteDisplay(data);

            // Si recibimos datos, ocultamos cualquier error de canal previo
            const clock = document.getElementById('smpteClockDisplay');
            if (clock) clock.style.color = '';
        });

        socket.on('smpte-signal-status', (data) => {
            const currentChan = this.smpteCapture ? this.smpteCapture.currentChannelIndex : 0;
            if (typeof data.channel !== 'undefined' && data.channel !== currentChan) return;

            const dot = document.getElementById('smpteSignalDot');
            if (dot) {
                dot.classList.toggle('active', data.active);
            }
        });

        // [v60.Elite] Monitor de Estado de Hardware y Señal (Local)
        setInterval(() => {
            if (window.AudioStateManager) {
                const hasError = window.AudioStateManager.get('smpteChannelError');
                const isClipping = window.AudioStateManager.get('smpteClipping');
                const clock = document.getElementById('smpteClockDisplay');
                const monitor = document.getElementById('smpteMonitor');

                if (monitor) {
                    if (isClipping) {
                        monitor.style.background = 'rgba(255, 50, 50, 0.3)';
                        monitor.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.4)';
                        monitor.title = '⚠️ SEÑAL SATURADA: Baje el volumen de la fuente';
                    } else {
                        monitor.style.background = 'rgba(0,0,0,0.4)';
                        monitor.style.boxShadow = 'none';
                        monitor.title = '';
                    }
                }

                if (clock) {
                    if (hasError) {
                        clock.innerText = 'CH ERROR';
                        clock.style.color = '#ff4d4d';
                    }
                }
            }
        }, 1000);

        this._startSmpteFlywheel();
    }

    _initEventListeners() {
        if (!this.canvas) return;

        // --- GESTIÓN DE PESTAÑAS IN/OUT (v60) ---
        const tabIn = document.getElementById('tabTriggersIn');
        const tabOut = document.getElementById('tabTriggersOut');

        if (tabIn && tabOut) {
            tabIn.addEventListener('click', () => {
                this.state.currentTab = 'IN';
                tabIn.classList.add('active');
                tabOut.classList.remove('active');
                document.getElementById('lblAddTrigger').innerText = window.localesData?.alerts?.add_trigger || 'Add Trigger';
                const svgAdd = document.getElementById('svgAddTrigger');
                if (svgAdd) {
                    svgAdd.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>';
                }

                this.renderTriggersList();
            });
            tabOut.addEventListener('click', () => {
                this.state.currentTab = 'OUT';
                tabOut.classList.add('active');
                tabIn.classList.remove('active');
                document.getElementById('lblAddTrigger').innerText = window.localesData?.alerts?.add_trigger || 'Add Trigger';
                const svgAdd = document.getElementById('svgAddTrigger');
                if (svgAdd) {
                    svgAdd.innerHTML = '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>';
                }

                this.renderTriggersList();
            });
        }

        // Canvas events
        if (this.canvas) {
            this.canvas.addEventListener('mousedown', (e) => this._onPointerDown(e));
            this.canvas.addEventListener('dblclick', (e) => this._onDoubleClick(e));
        }

        window.addEventListener('mousemove', (e) => {
            this._onPointerMove(e);
            this._onCursorMove(e);
        });

        window.addEventListener('mouseup', (e) => {
            this._onPointerUp(e);
            this._onCursorUp(e);
        });

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this._onPointerDown(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            this._onPointerMove(e);
            this._onCursorMove(e);
        }, { passive: false });
        this.canvas.addEventListener('touchend', (e) => {
            this._onPointerUp(e);
            this._onCursorUp(e);
        });

        // Controles de Reproducción
        const playBtn = this.dom.get('triggers', 'playPauseBtn');
        const stopBtn = this.dom.get('triggers', 'stopBtn');
        const loopBtn = this.dom.get('triggers', 'loopBtn');
        const liveBtn = this.dom.get('triggers', 'liveBtn');

        if (playBtn) playBtn.addEventListener('click', () => {
            if (this.state.isPlayingPreview) this.pause();
            else this.play();
        });
        if (stopBtn) stopBtn.addEventListener('click', () => this.stop());
        if (loopBtn) loopBtn.addEventListener('click', () => {
            this.state.isLoopingPreview = !this.state.isLoopingPreview;
            loopBtn.classList.toggle('active', this.state.isLoopingPreview);
        });
        if (liveBtn) liveBtn.addEventListener('click', () => {
            this.state.liveMode = !this.state.liveMode;
            liveBtn.classList.toggle('active', this.state.liveMode);
        });

        // Cursor dragging
        if (this.cursor) {
            this.cursor.addEventListener('mousedown', (e) => this._onCursorDown(e));
            this.cursor.addEventListener('touchstart', (e) => this._onCursorDown(e), { passive: false });
        }

        // Steppers
        document.querySelectorAll('.prop-stepper-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this._onStepperClick(e));
        });

        // Inputs del Panel
        const inputs = ['kfName', 'kfTime', 'kfValue', 'kfEasing', 'kfHold'];
        inputs.forEach(id => {
            const el = this.dom.get('triggers', id);
            if (el) el.addEventListener('input', () => this.saveFromPropertyPanel());
        });

        // Duración Global
        const durationInput = this.dom.get('triggers', 'globalDurationSec');
        if (durationInput) durationInput.addEventListener('change', () => {
            let v = parseFloat(durationInput.value);
            if (!isNaN(v)) this.state.globalDurationSec = Math.min(60, Math.max(0.5, v));
            durationInput.value = this.state.globalDurationSec.toFixed(1);
            this.recalcMaxTime();
        });

        // Tipos (MIDI/OSC/sACN) - OUT Editor
        document.querySelectorAll('#editorFormOut .type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.triggerType = btn.getAttribute('data-type');
                document.querySelectorAll('#editorFormOut .type-btn').forEach(b => b.classList.toggle('active', b === btn));
                this.renderTypeFields();
                this.updateRangeFromType();
            });
        });

        // Activation Select
        const triggerOnSelect = this.dom.get('triggers', 'triggerOnSelect');
        if (triggerOnSelect) triggerOnSelect.addEventListener('change', () => this.updateActivationUI());

        // Botones Formulario
        const saveBtn = this.dom.get('triggers', 'saveBtn');
        const cancelBtn = this.dom.get('triggers', 'cancelBtn');
        const addNewBtn = this.dom.get('triggers', 'addNewBtn');

        if (saveBtn) saveBtn.addEventListener('click', () => this.saveCurrentTrigger());
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeTriggerForm());
        if (addNewBtn) addNewBtn.addEventListener('click', () => this.openTriggerForm());

        const addKfBtn = this.dom.get('triggers', 'addKeyframeBtn');
        const delKfBtn = this.dom.get('triggers', 'deleteKeyframeBtn');

        if (addKfBtn) addKfBtn.addEventListener('click', () => {
            const lastTime = this.state.keyframes.length > 0 ? this.state.keyframes[this.state.keyframes.length - 1].time : 0;
            const newTime = Math.min(this.state.maxTime, lastTime + 500);
            this._addKeyframeAt(newTime, this.state.currentRange.min);
        });

        if (delKfBtn) delKfBtn.addEventListener('click', () => {
            if (this.state.selectedKfIndex !== -1) {
                this.deleteKeyframe(this.state.selectedKfIndex);
            }
        });

        // [v60] Unificación de Selectores de Tipo (Compatibilidad con renamed class type-btn)
        document.querySelectorAll('#editorFormIn .type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._syncCurrentHwInputsToStateIn();
                this.state.inType = btn.getAttribute('data-type');
                document.querySelectorAll('#editorFormIn .type-btn').forEach(b => b.classList.toggle('active', b === btn));
                this.renderHwFieldsIn();
            });
        });

        const saveBtnIn = document.getElementById('saveTriggerBtnIn');
        const cancelBtnIn = document.getElementById('cancelTriggerBtnIn');
        if (saveBtnIn) saveBtnIn.addEventListener('click', () => this.saveTriggerIn());
        if (cancelBtnIn) cancelBtnIn.addEventListener('click', () => this.closeTriggerForm());

        // [v60] Listeners Multimedia IN
        this._initMediaEventListenersIn();

        // [v60] Emoji Picker
        const btnEmoji = document.getElementById('btnEmojiTriggerIn');
        if (btnEmoji) btnEmoji.addEventListener('click', (e) => this.toggleEmojiPicker(e));
    }

    _initMediaEventListenersIn() {
        // Audio
        const btnRecord = document.getElementById('btnRecordAudioIn');
        const btnUploadAudio = document.getElementById('btnUploadAudioIn');
        const fileAudio = document.getElementById('fileAudioIn');

        if (btnRecord) btnRecord.addEventListener('click', () => this.toggleAudioRecordingIn());
        if (btnUploadAudio) btnUploadAudio.addEventListener('click', () => fileAudio.click());
        if (fileAudio) fileAudio.addEventListener('change', (e) => this.handleFileSelectIn(e, 'audio'));

        const btnPlay = document.getElementById('btnPlayAudioIn');
        if (btnPlay) btnPlay.addEventListener('click', () => this.playAudioPreviewIn());

        // Imagen
        const btnCapture = document.getElementById('btnCaptureImageIn');
        const btnUploadImage = document.getElementById('btnUploadImageIn');
        const fileImage = document.getElementById('fileImageIn');

        if (btnCapture) btnCapture.addEventListener('click', () => this.capturePhotoIn());
        if (btnUploadImage) btnUploadImage.addEventListener('click', () => fileImage.click());
        if (fileImage) fileImage.addEventListener('change', (e) => this.handleFileSelectIn(e, 'image'));
    }

    _initCanvasRendering() {
        this._updateCanvasSize();
        window.addEventListener('resize', () => {
            this._updateCanvasSize();
            this.draw();
        });
        this.draw();
    }

    _updateCanvasSize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = Math.max(200, rect.height);
    }

    // ────────────────────────────────────
    // Canvas Logic
    // ────────────────────────────────────

    draw() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();
        this.drawCurve();
        this.drawKeyframes();
    }

    drawGrid() {
        const { ctx, canvas, state, RANGES } = this;
        ctx.save();
        ctx.strokeStyle = 'rgba(123, 104, 238, 0.15)';
        ctx.lineWidth = 0.6;

        // Vertical lines (Time)
        for (let t = 0; t <= state.maxTime; t += 500) {
            const { x } = this.timelineToCanvas(t, state.currentRange.min);
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }

        // Horizontal lines (Value)
        const range = state.currentRange;
        for (let v = range.min; v <= range.max; v += (range.max - range.min) / 4) {
            const { y } = this.timelineToCanvas(0, v);
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Labels
        const isLightTheme = document.body.getAttribute('data-theme') === 'light';
        ctx.fillStyle = isLightTheme ? '#334155' : '#aaa';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        for (let s = 0; s <= state.globalDurationSec; s += (state.globalDurationSec <= 2 ? 0.5 : 1)) {
            const { x } = this.timelineToCanvas(s * 1000, range.min);
            ctx.fillText(s.toFixed(1) + 's', x, canvas.height - 4);
        }
        ctx.textAlign = 'left';
        ctx.fillText(range.max, 4, 12);
        ctx.fillText(range.min, 4, canvas.height - 5);
        ctx.restore();
    }

    drawCurve() {
        const { ctx, state } = this;
        if (state.keyframes.length < 2) return;

        const accentSecondary = (typeof window !== 'undefined' && window.getComputedStyle)
            ? (getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim() || '#FF6B35')
            : '#FF6B35';

        ctx.beginPath();
        ctx.strokeStyle = accentSecondary;
        ctx.lineWidth = 2.5;

        for (let i = 0; i < state.keyframes.length - 1; i++) {
            const kfA = state.keyframes[i];
            const kfB = state.keyframes[i + 1];
            const startTime = kfA.time + (kfA.hold || 0);
            const endTime = kfB.time;
            const duration = endTime - startTime;

            if (duration <= 0) {
                const p1 = this.timelineToCanvas(startTime, kfA.value);
                const p2 = this.timelineToCanvas(endTime, kfB.value);
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                continue;
            }

            const steps = 60;
            for (let step = 0; step <= steps; step++) {
                const t = step / steps;
                const time = startTime + t * duration;
                const easedT = applyEasing(t, kfB.easing || 'linear');
                const value = kfA.value + (kfB.value - kfA.value) * easedT;
                const { x, y } = this.timelineToCanvas(time, value);
                if (step === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Draw hold lines (dashed)
        ctx.save();
        ctx.strokeStyle = '#FFA500';
        ctx.setLineDash([5, 5]);
        for (let kf of state.keyframes) {
            if (kf.hold > 0) {
                const p1 = this.timelineToCanvas(kf.time, kf.value);
                const p2 = this.timelineToCanvas(Math.min(kf.time + kf.hold, state.maxTime), kf.value);
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    drawKeyframes() {
        const { ctx, canvas, state } = this;
        const accentSecondary = (typeof window !== 'undefined' && window.getComputedStyle)
            ? (getComputedStyle(document.documentElement).getPropertyValue('--accent-secondary').trim() || '#FF6B35')
            : '#FF6B35';

        state.keyframes.forEach((kf, i) => {
            const { x, y } = this.timelineToCanvas(kf.time, kf.value);
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, 2 * Math.PI);
            const isLightSel = document.body.getAttribute('data-theme') === 'light';
            ctx.fillStyle = i === state.selectedKfIndex ? (isLightSel ? '#000000' : '#FFFFFF') : accentSecondary;
            ctx.fill();
            ctx.strokeStyle = isLightSel ? '#000000' : 'white';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Labels for keyframes
            ctx.save();
            ctx.font = 'bold 13px sans-serif';
            const isLightK = document.body.getAttribute('data-theme') === 'light';
            ctx.fillStyle = isLightK ? '#0f172a' : 'white';
            ctx.shadowColor = isLightK ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = isLightK ? 2 : 4;

            let nameY = y - 12;
            let valY = y + 16;
            let nameX = x + 12;

            if (y < 25) { nameY = y + 15; valY = y + 29; }
            else if (y > canvas.height - 25) { nameY = y - 24; valY = y - 10; }
            if (x > canvas.width - 70) { ctx.textAlign = 'right'; nameX = x - 12; }
            else { ctx.textAlign = 'left'; nameX = x + 12; }

            ctx.fillText(kf.name || 'KF', nameX, nameY);
            ctx.font = '11.5px monospace';
            ctx.fillStyle = isLightK ? '#334155' : '#ddd';
            ctx.fillText(Number(kf.value).toFixed(state.currentRange.step >= 1 ? 0 : 2), nameX, valY);
            ctx.restore();
        });
    }

    timelineToCanvas(time, value) {
        const { canvas, state, PAD_X, PAD_Y } = this;
        const w = canvas.width - PAD_X * 2;
        const h = canvas.height - PAD_Y * 2;
        const x = PAD_X + (time / state.maxTime) * w;
        const y = canvas.height - PAD_Y - ((value - state.currentRange.min) / (state.currentRange.max - state.currentRange.min)) * h;
        return { x, y };
    }

    canvasToTimeline(clientX, clientY) {
        const { canvas, state, PAD_X, PAD_Y } = this;
        const rect = canvas.getBoundingClientRect();
        const canvasX = clientX - rect.left;
        const canvasY = clientY - rect.top;

        const w = canvas.width - PAD_X * 2;
        const h = canvas.height - PAD_Y * 2;

        let t = ((canvasX - PAD_X) / w) * state.maxTime;
        t = Math.min(state.maxTime, Math.max(0, t));

        let norm = 1 - ((canvasY - PAD_Y) / h);
        let v = state.currentRange.min + norm * (state.currentRange.max - state.currentRange.min);
        v = Math.min(state.currentRange.max, Math.max(state.currentRange.min, v));

        return { t, v };
    }

    // ────────────────────────────────────
    // Interaction
    // ────────────────────────────────────

    _onPointerDown(e) {
        if (!this.canvas) return;
        e.preventDefault();
        const point = e.touches ? e.touches[0] : e;
        const idx = this._getKeyframeIndexAt(point.clientX, point.clientY);

        if (idx !== -1) {
            this.state.dragging = true;
            this.state.selectedKfIndex = idx;
            this.updatePropertyPanel();
            this.canvas.style.cursor = 'grabbing';
            this.draw();
            this.renderKeyframeList();
        } else {
            this.state.dragging = false;
            this.state.selectedKfIndex = -1;
            this.updatePropertyPanel();
            this.canvas.style.cursor = 'crosshair';
            this.draw();
            this.renderKeyframeList();
        }
    }

    _onPointerMove(e) {
        if (!this.state.dragging || this.state.selectedKfIndex === -1) return;
        e.preventDefault();
        const point = e.touches ? e.touches[0] : e;
        const { t, v } = this.canvasToTimeline(point.clientX, point.clientY);

        const keyframes = this.state.keyframes;
        const idx = this.state.selectedKfIndex;

        const prevTime = idx > 0 ? keyframes[idx - 1].time : 0;
        const nextTime = idx < keyframes.length - 1 ? keyframes[idx + 1].time : this.state.maxTime;

        let newTime = Math.min(nextTime, Math.max(prevTime, t));
        let newValue = Math.min(this.state.currentRange.max, Math.max(this.state.currentRange.min, v));

        keyframes[idx].time = newTime;
        keyframes[idx].value = newValue;
        keyframes.sort((a, b) => a.time - b.time);

        this.state.selectedKfIndex = keyframes.findIndex(k => k.time === newTime && k.value === newValue);
        this.draw();
        this.updatePropertyPanel();
        this.renderKeyframeList();
    }

    _onPointerUp() {
        if (this.state.dragging) {
            this.state.dragging = false;
            this.canvas.style.cursor = 'crosshair';
            this.recalcMaxTime();
            this.draw();
            this.renderKeyframeList();
            this.refreshPreviewVisual();
        }
    }

    _onDoubleClick(e) {
        e.preventDefault();
        const point = e.touches ? e.touches[0] : e;
        const { t, v } = this.canvasToTimeline(point.clientX, point.clientY);
        this._addKeyframeAt(t, v);
    }

    _addKeyframeAt(t, v) {
        if (this.state.keyframes.some(k => Math.abs(k.time - t) < 5)) return;

        const newKf = {
            time: t,
            value: v,
            easing: 'linear',
            hold: 0,
            name: `Punto ${this.state.keyframes.length + 1}`
        };
        this.state.keyframes.push(newKf);
        this.state.keyframes.sort((a, b) => a.time - b.time);
        this.recalcMaxTime();

        const newIdx = this.state.keyframes.findIndex(k => k.time === t && k.value === v);
        if (newIdx !== -1) {
            this.state.selectedKfIndex = newIdx;
            this.updatePropertyPanel();
        }
        this.draw();
        this.renderKeyframeList();
    }

    _getKeyframeIndexAt(clientX, clientY) {
        const { canvas, state } = this;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (clientX - rect.left) * scaleX;
        const canvasY = (clientY - rect.top) * scaleY;

        for (let i = 0; i < state.keyframes.length; i++) {
            const { x, y } = this.timelineToCanvas(state.keyframes[i].time, state.keyframes[i].value);
            if (Math.hypot(canvasX - x, canvasY - y) <= 12) return i;
        }
        return -1;
    }

    // Cursor Logic
    _onCursorDown(e) {
        e.preventDefault();
        this.state.isDraggingCursor = true;
        this.cursor.classList.add('dragging');
        document.body.style.userSelect = 'none';
    }

    _onCursorMove(e) {
        if (!this.state.isDraggingCursor) return;
        const rect = this.canvas.closest('.canvas-wrapper').getBoundingClientRect();
        const point = e.touches ? e.touches[0] : e;
        const x = point.clientX - rect.left;
        const percent = Math.min(1, Math.max(0, x / (rect.width - 16)));

        this.state.currentPreviewTime = percent * this.state.previewDuration;
        if (this.state.isPlayingPreview) this.pause();
        this.refreshPreviewVisual();

        if (this.state.liveMode) {
            this.sendValueNow(this.getValueAtTime(this.state.currentPreviewTime));
        }
    }

    _onCursorUp() {
        if (this.state.isDraggingCursor) {
            this.state.isDraggingCursor = false;
            this.cursor.classList.remove('dragging');
            document.body.style.userSelect = '';
        }
    }

    _onStepperClick(e) {
        const btn = e.currentTarget;
        const field = btn.getAttribute('data-field');
        const deltaAttr = btn.getAttribute('data-delta');
        let delta = parseFloat(deltaAttr === 'step' ? this.state.currentRange.delta : deltaAttr);
        if (isNaN(delta)) return;

        let input = null;
        if (field === 'time') input = this.dom.get('triggers', 'kfTime');
        else if (field === 'value') input = this.dom.get('triggers', 'kfValue');
        else if (field === 'hold') input = this.dom.get('triggers', 'kfHold');
        else if (field === 'duration') input = this.dom.get('triggers', 'globalDurationSec');

        if (!input) return;
        let val = parseFloat(input.value) || 0;
        val += delta;

        if (field === 'time') val = Math.min(this.state.maxTime, Math.max(0, val));
        else if (field === 'value') val = Math.min(this.state.currentRange.max, Math.max(this.state.currentRange.min, val));
        else if (field === 'hold') {
            const kf = this.state.keyframes[this.state.selectedKfIndex];
            val = Math.min(this.state.maxTime - (kf ? kf.time : 0), Math.max(0, val));
        } else if (field === 'duration') {
            val = Math.min(60, Math.max(0.5, val));
            this.state.globalDurationSec = val;
            input.value = val.toFixed(1);
            this.recalcMaxTime();
            return; // Ya guardamos y recalculamos
        }

        input.value = val;
        this.saveFromPropertyPanel();
    }

    // ────────────────────────────────────
    // Keyframes Management
    // ────────────────────────────────────

    recalcMaxTime() {
        this.state.maxTime = this.state.globalDurationSec * 1000;
        this.state.keyframes = this.state.keyframes.filter(k => k.time <= this.state.maxTime);
        if (this.state.keyframes.length === 0) {
            this.state.keyframes.push({ time: 0, value: this.state.currentRange.min, easing: "linear", hold: 0, name: "Inicio" });
        }
        this.state.keyframes.sort((a, b) => a.time - b.time);
        this.state.previewDuration = this.state.maxTime;
        this.draw();
        this.renderKeyframeList();
    }

    updateRangeFromType(convertValues = true) {
        const newRange = this.RANGES[this.state.triggerType];
        const oldRange = this.state.currentRange;

        if (newRange !== oldRange) {
            if (convertValues) {
                this.state.keyframes.forEach(kf => {
                    const norm = (kf.value - oldRange.min) / (oldRange.max - oldRange.min);
                    let newVal = newRange.min + norm * (newRange.max - newRange.min);
                    if (newRange.step >= 1) newVal = Math.round(newVal);
                    else newVal = Math.round(newVal / newRange.step) * newRange.step;
                    kf.value = Math.min(newRange.max, Math.max(newRange.min, newVal));
                });
            }
            this.state.currentRange = newRange;
        }

        const valLab = document.getElementById('valueLabel');
        if (valLab) valLab.innerHTML = `Valor (${newRange.min}–${newRange.max})`;

        const kfValueInput = this.dom.get('triggers', 'kfValue');
        if (kfValueInput) {
            kfValueInput.step = newRange.step;
            kfValueInput.min = newRange.min;
            kfValueInput.max = newRange.max;
        }

        this.draw();
        this.renderKeyframeList();
        this.updatePropertyPanel();
        this.refreshPreviewVisual();
    }

    updatePropertyPanel() {
        const idx = this.state.selectedKfIndex;
        const kf = this.state.keyframes[idx];
        const propsDiv = document.getElementById('keyframeProps');

        if (kf && propsDiv) {
            this.dom.setValue('triggers', 'kfName', kf.name || '');
            this.dom.setValue('triggers', 'kfTime', Math.round(kf.time));
            this.dom.setValue('triggers', 'kfValue', kf.value);
            this.dom.setValue('triggers', 'kfEasing', kf.easing || 'linear');
            this.dom.setValue('triggers', 'kfHold', kf.hold || 0);
            propsDiv.style.display = 'flex';
        } else if (propsDiv) {
            propsDiv.style.display = 'none';
        }
    }

    renderKeyframeList() {
        const container = this.dom.get('triggers', 'keyframeItemsList');
        if (!container) return;

        container.innerHTML = '';
        this.state.keyframes.forEach((kf, idx) => {
            const item = document.createElement('div');
            // Usar la clase .selected y .keyframe-item según el CSS en styles.css:5481
            item.className = 'keyframe-item' + (idx === this.state.selectedKfIndex ? ' selected' : '');

            const timeStr = (kf.time / 1000).toFixed(2) + 's';
            const valStr = Number(kf.value).toFixed(this.state.currentRange.step >= 1 ? 0 : 2);
            const easingLabel = kf.easing.charAt(0).toUpperCase() + kf.easing.slice(1).replace('ease', 'Ease ');

            item.innerHTML = `
                <div class="kf-name" title="${kf.name || 'Punto'}">${kf.name || 'Punto'}</div>
                <div class="kf-time" title="Tiempo">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    ${timeStr}
                </div>
                <div class="kf-value" title="Valor">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"></path></svg>
                    ${valStr}
                </div>
                <div class="kf-easing" title="Curva">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c4 0 4-8 8-8s4 8 8 8"></path></svg>
                    ${easingLabel}
                </div>
                <div class="kf-hold" title="Hold">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    ${kf.hold || 0}ms
                </div>
                <div class="keyframe-actions">
                    <button class="kf-item-del" title="Eliminar keyframe">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            `;

            item.onclick = (e) => {
                if (e.target.closest('.kf-item-del')) return;
                this.state.selectedKfIndex = idx;
                this.updatePropertyPanel();
                this.draw();
                this.renderKeyframeList();
            };

            item.querySelector('.kf-item-del').onclick = (e) => {
                e.stopPropagation();
                this.deleteKeyframe(idx);
            };

            container.appendChild(item);
        });
    }

    deleteKeyframe(idx) {
        if (this.state.keyframes.length <= 1) {
            showCatFeedback(window.localesData?.alerts?.at_least_one_point || "Debe haber al menos un punto", "info");
            return;
        }
        this.state.keyframes.splice(idx, 1);
        if (this.state.selectedKfIndex === idx) this.state.selectedKfIndex = -1;
        else if (this.state.selectedKfIndex > idx) this.state.selectedKfIndex--;

        this.draw();
        this.renderKeyframeList();
        this.updatePropertyPanel();
        this.refreshPreviewVisual();
    }

    saveFromPropertyPanel() {
        const idx = this.state.selectedKfIndex;
        if (idx === -1 || !this.state.keyframes[idx]) return;

        let kf = this.state.keyframes[idx];
        const range = this.state.currentRange;

        kf.name = this.dom.get('triggers', 'kfName').value;
        kf.time = Math.min(this.state.maxTime, Math.max(0, Math.round(parseFloat(this.dom.get('triggers', 'kfTime').value) || 0)));
        kf.value = Math.min(range.max, Math.max(range.min, parseFloat(this.dom.get('triggers', 'kfValue').value) || 0));
        kf.easing = this.dom.get('triggers', 'kfEasing').value;
        kf.hold = Math.min(this.state.maxTime - kf.time, Math.max(0, Math.round(parseFloat(this.dom.get('triggers', 'kfHold').value) || 0)));

        // Validation against neighbors
        const prevTime = idx > 0 ? this.state.keyframes[idx - 1].time : 0;
        const nextTime = idx < this.state.keyframes.length - 1 ? this.state.keyframes[idx + 1].time : this.state.maxTime;
        kf.time = Math.min(nextTime, Math.max(prevTime, kf.time));

        this.state.keyframes.sort((a, b) => a.time - b.time);
        this.state.selectedKfIndex = this.state.keyframes.indexOf(kf);

        this.draw();
        this.renderKeyframeList();
        this.refreshPreviewVisual();
    }

    // ────────────────────────────────────
    // Preview & Playback
    // ────────────────────────────────────

    play() {
        if (this.state.isPlayingPreview) return;
        if (this.state.previewAnimationId) cancelAnimationFrame(this.state.previewAnimationId);

        // Si estamos al final de la duración al pulsar play, reiniciamos a 0 para poder volver a ver la secuencia
        if (this.state.currentPreviewTime >= this.state.previewDuration) {
            this.state.currentPreviewTime = 0;
        }

        this.state.isPlayingPreview = true;
        const playBtn = this.dom.get('triggers', 'playPauseBtn');
        if (playBtn) {
            playBtn.classList.add('active');
            playBtn.querySelector('path').setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
        }

        let startTime = performance.now() - this.state.currentPreviewTime;

        const step = (now) => {
            if (!this.state.isPlayingPreview) return;

            let t = now - startTime;
            if (t >= this.state.previewDuration) {
                if (this.state.isLoopingPreview) {
                    this.state.currentPreviewTime = 0;
                    startTime = performance.now();
                } else {
                    this.state.currentPreviewTime = this.state.previewDuration;
                    this.pause(); // Mantener en el último frame al terminar (no usar stop() que reinicia a 0)
                    this.refreshPreviewVisual();
                    return;
                }
            }

            this.state.currentPreviewTime = t;
            const val = this.getValueAtTime(t);
            this.updateVisualization(val);
            if (this.state.liveMode) this.sendValueNow(val);
            this._drawCursor();
            this.draw();

            this.state.previewAnimationId = requestAnimationFrame(step);
        };
        this.state.previewAnimationId = requestAnimationFrame(step);
    }

    pause() {
        this.state.isPlayingPreview = false;
        if (this.state.previewAnimationId) cancelAnimationFrame(this.state.previewAnimationId);

        const playBtn = this.dom.get('triggers', 'playPauseBtn');
        if (playBtn) {
            playBtn.classList.remove('active');
            playBtn.querySelector('path').setAttribute('d', 'M8 5v14l11-7z');
        }
    }

    stop() {
        this.pause();
        this.state.currentPreviewTime = 0;
        this.refreshPreviewVisual();
    }

    getValueAtTime(timeMs) {
        const keyframes = this.state.keyframes;
        if (keyframes.length === 0) return 0;
        if (keyframes.length === 1) return keyframes[0].value;

        const sorted = [...keyframes].sort((a, b) => a.time - b.time);
        if (timeMs <= sorted[0].time) return sorted[0].value;
        if (timeMs >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].value;

        for (let i = 0; i < sorted.length - 1; i++) {
            const k1 = sorted[i];
            const k2 = sorted[i + 1];
            if (timeMs >= k1.time && timeMs <= k2.time) {
                const range = k2.time - k1.time;
                if (range === 0) return k2.value;
                const t = (timeMs - k1.time) / range;
                const easedT = applyEasing(t, k2.easing || 'linear');
                return k1.value + (k2.value - k1.value) * easedT;
            }
        }
        return 0;
    }

    updateVisualization(value) {
        const indicator = this.canvas?.closest('.modal-content')?.querySelector('.point-indicator');
        const type = this.state.triggerType;
        let norm = 0;
        if (type === 'osc') norm = value;
        else if (type === 'midi' || type === 'sacn') norm = value / 127;

        if (indicator) {
            indicator.style.opacity = norm;
        }

        const wrapper = this.canvas?.closest('.canvas-wrapper');
        if (wrapper) {
            wrapper.style.backgroundColor = `color-mix(in srgb, var(--accent-primary) ${Math.round(norm * 25)}%, transparent)`;
        }
    }

    _drawCursor() {
        if (this.cursor) {
            const percent = this.state.currentPreviewTime / this.state.previewDuration;
            this.cursor.style.left = `calc(8px + ${percent} * (100% - 16px))`;
            this.cursor.style.display = 'block';
        }
    }

    refreshPreviewVisual() {
        if (!this.state.isPlayingPreview) {
            const val = this.getValueAtTime(this.state.currentPreviewTime);
            this.updateVisualization(val);
            this._drawCursor();
            this.draw();
        }
    }

    sendValueNow(value) {
        if (!this.state.currentTriggerId) return;
        this.saveCurrentTypeConfig();
        const cfg = this.state.typeConfig[this.state.triggerType];

        if (this.state.triggerType === 'midi') {
            const rounded = Math.round(value);
            if (cfg.subtype === 'cc') {
                const ch = Math.max(0, Math.min(15, (cfg.channel || 1) - 1));
                const c = Math.max(0, Math.min(127, cfg.note || 0));

                const outputs = window._midiOutputs || [];
                const port = outputs.find(o => o.id === cfg.deviceId) || outputs[0];

                if (port) {
                    port.send([0xB0 | ch, c, Math.max(0, Math.min(127, rounded))]);
                }
            } else {
                sendMIDIRaw(cfg.channel || 1, cfg.note || 60, rounded, cfg.deviceId);
            }
        } else if (this.state.triggerType === 'osc') {
            if (!cfg.host || !cfg.port || !cfg.address) return;
            this.safeEmit('trigger-osc', {
                host: cfg.host,
                port: parseInt(cfg.port),
                address: cfg.address,
                args: [{ type: 'f', value: value }]
            });
        } else if (this.state.triggerType === 'sacn') {
            if (!cfg.universe) return;
            const sacnPayload = {
                universe: cfg.universe,
                priority: cfg.priority,
                mode: cfg.mode,
                destinationIp: cfg.destinationIp,
                channels: cfg.channels ? (typeof cfg.channels === 'string' ? JSON.parse(cfg.channels) : cfg.channels) : []
            };
            if (sacnPayload.channels.length > 0) {
                sacnPayload.channels.forEach(ch => ch.value = Math.max(0, Math.min(255, Math.round(value))));
                this.safeEmit('trigger-sacn', sacnPayload);
            }
        }
    }

    // ────────────────────────────────────
    // Forms & Logic
    // ────────────────────────────────────

    saveCurrentTypeConfig() {
        const type = this.state.triggerType;
        const cfg = this.state.typeConfig[type];

        if (type === 'osc') {
            cfg.host = document.getElementById('oscHost')?.value || '';
            cfg.port = parseInt(document.getElementById('oscPort')?.value) || 9000;
            cfg.address = document.getElementById('oscAddress')?.value || '';
            cfg.arg = document.getElementById('oscArg')?.value || '';
        } else if (type === 'midi') {
            cfg.deviceId = document.getElementById('midiDeviceId')?.value || 'default';
            cfg.subtype = document.getElementById('midiSubtype')?.value || 'note';
            cfg.channel = parseInt(document.getElementById('midiChannel')?.value) || 1;
            cfg.note = parseInt(document.getElementById('midiNote')?.value) || 60;
            cfg.velocity = parseInt(document.getElementById('midiVelocity')?.value) || 127;
        } else if (type === 'sacn') {
            cfg.universe = parseInt(document.getElementById('sacnUniverse')?.value) || 1;
            cfg.priority = parseInt(document.getElementById('sacnPriority')?.value) || 100;
            cfg.mode = document.getElementById('sacnMode')?.value || 'multicast';
            cfg.destinationIp = document.getElementById('sacnIp')?.value || '';
            cfg.channels = document.getElementById('sacnChannels')?.value || '[]';
        }
    }

    renderTypeFields() {
        const container = this.dom.get('triggers', 'typeFieldsContainer');
        if (!container) return;

        const type = this.state.triggerType;
        const cfg = this.state.typeConfig[type];
        const locale = (window.localesData && window.localesData.alerts) ? window.localesData.alerts : {};
        const localeV60 = (window.localesData && window.localesData.triggers_v60) ? window.localesData.triggers_v60 : {};

        let html = '';
        if (type === 'osc') {
            html = `<div class="field-row"><div class="field-group"><label>${locale.osc_host || 'Host IP'}</label><input id="oscHost" value="${cfg.host || ''}"></div><div class="field-group"><label>${locale.osc_port || 'Puerto'}</label><input id="oscPort" type="number" value="${cfg.port || 9000}"></div></div>
            <div class="field-row"><div class="field-group"><label>${locale.osc_address || 'Dirección OSC'}</label><input id="oscAddress" value="${cfg.address || ''}"></div><div class="field-group"><label>${locale.osc_arg || 'Argumento'}</label><input id="oscArg" value="${cfg.arg || ''}"></div></div>`;
        } else if (type === 'midi') {
            const outputs = window._midiOutputs || [];
            let options = outputs.map(out => `<option value="${out.id}" ${cfg.deviceId === out.id ? 'selected' : ''}>${out.name}</option>`).join('');
            if (options === '') options = `<option value="default">${localeV60.midi_any_device || 'Cualquier dispositivo'}</option>`;

            const noteLabelText = cfg.subtype === 'cc' ? (locale.midi_note_cc || 'CC') : (locale.note || 'Nota');
            html = `
                <div class="field-group" style="margin-bottom:15px;">
                    <label>${localeV60.hw_midi_device || 'Dispositivo MIDI'}</label>
                    <div class="talkme-select-container">
                        <select id="midiDeviceId" class="talkme-select">${options}</select>
                    </div>
                </div>
                <div class="field-row">
                    <div class="field-group"><label>${locale.trigger_type || 'Tipo'}</label><select id="midiSubtype"><option value="note" ${cfg.subtype === 'note' ? 'selected' : ''}>Note</option><option value="cc" ${cfg.subtype === 'cc' ? 'selected' : ''}>CC</option></select></div>
                    <div class="field-group"><label>${locale.channel || 'Canal'}</label><input id="midiChannel" type="number" value="${cfg.channel || 1}"></div>
                </div>
                <div class="field-row">
                    <div class="field-group"><label>${noteLabelText}</label><input id="midiNote" type="number" value="${cfg.note || 60}"></div>
                    <div class="field-group"><label>${locale.velocity || 'Velocidad'}</label><input id="midiVelocity" type="number" value="${cfg.velocity || 127}"></div>
                </div>`;
        } else if (type === 'sacn') {
            html = `<div class="field-row"><div class="field-group"><label>${locale.universe || 'Universo'}</label><input id="sacnUniverse" type="number" value="${cfg.universe || 1}"></div>
            <div class="field-group"><label>${locale.priority || 'Prioridad'}</label><input id="sacnPriority" type="number" value="${cfg.priority || 100}"></div></div>
            <div class="field-row"><div class="field-group"><label>${locale.mode || 'Modo'}</label><select id="sacnMode"><option ${cfg.mode === 'multicast' ? 'selected' : ''}>multicast</option><option ${cfg.mode === 'unicast' ? 'selected' : ''}>unicast</option></select></div>
            <div class="field-group" id="sacnIpGroup" style="display:${cfg.mode === 'unicast' ? 'block' : 'none'}"><label>${locale.destination_ip || 'IP destino'}</label><input id="sacnIp" value="${cfg.destinationIp || ''}"></div></div>
            <div class="field-row"><div class="field-group"><label>${locale.dmx_channels || 'Canales DMX (JSON)'}</label><textarea id="sacnChannels">${cfg.channels || '[]'}</textarea></div></div>`;
        }

        container.innerHTML = html;
        if (type === 'sacn') {
            const modeSel = document.getElementById('sacnMode');
            const ipGroup = document.getElementById('sacnIpGroup');
            if (modeSel && ipGroup) modeSel.addEventListener('change', () => ipGroup.style.display = modeSel.value === 'unicast' ? 'block' : 'none');
        }
    }

    openTriggerForm(editIndex = null) {
        const editorFormOut = document.getElementById('editorFormOut');
        const editorFormIn = document.getElementById('editorFormIn');
        const addNewBtn = this.dom.get('triggers', 'addNewBtn');
        const triggersModal = this.dom.get('triggers', 'modal');

        if (!triggersModal) return;

        // Resetear visibilidad de ambos de forma contundente (Fix v60)
        if (editorFormOut) editorFormOut.style.display = 'none';
        if (editorFormIn) editorFormIn.style.display = 'none';

        triggersModal.classList.remove('hidden');
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) settingsModal.classList.add('hidden');
        document.body.classList.add('modal-active');
        window.openedFromSettings = true;

        // [v60.Elite] El botón de añadir en Ajustes permanece disponible sin desvanecerse

        // Decidir qué formulario mostrar según la pestaña activa
        const isEditingIn = (editIndex !== null && getMergedTriggers()[editIndex]?.direction === 'IN') || (editIndex === null && this.state.currentTab === 'IN');

        const titleEl = document.getElementById('lblTriggersAdvancedTitle');
        const subtitleEl = document.getElementById('lblTriggersAdvancedSubtitle');

        const localesV60 = window.localesData?.triggers_v60 || {};
        const localesAlerts = window.localesData?.alerts || {};

        if (isEditingIn) {
            if (editorFormOut) editorFormOut.style.display = 'none';
            if (editorFormIn) editorFormIn.style.display = 'block';

            if (titleEl) titleEl.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> ${localesV60.title_in || 'Editor de Triggers IN'}`;
            if (subtitleEl) subtitleEl.innerText = localesV60.title_in_desc || 'Captura de señales externas · MIDI · OSC · SMPTE · Inyección de contenidos';

            this.renderCategorySelectorIn();
            this.prepareEditorIn(editIndex);
        } else {
            if (editorFormIn) editorFormIn.style.display = 'none';
            if (editorFormOut) editorFormOut.style.display = 'block';

            if (titleEl) titleEl.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> ${localesV60.title_out || 'Editor de Triggers OUT'}`;
            if (subtitleEl) subtitleEl.innerText = localesAlerts.trigger_subtitle || 'Animaciones por keyframes · Curvas · Easing · Activación por mensaje';

            this.prepareEditorOut(editIndex);
        }

        this.renderSaveTriggerButtonLabel();
    }

    prepareEditorOut(editIndex) {
        let tr = editIndex !== null ? getMergedTriggers()[editIndex] : null;
        if (tr) {
            this.state.currentTriggerId = tr.id;

            // Localizar nombre si es un default
            const localesTriggers = window.localesData?.triggers_v60 || {};
            const oldDefaultsOut = ['Nuevo Trigger', 'Nuevo Trigger OUT', 'Nombre Trigger OUT', 'Trigger OUT Name'];
            let trName = tr.name;
            if (oldDefaultsOut.includes(trName)) {
                trName = localesTriggers.default_name_out || 'Nombre Trigger OUT';
            }
            this.dom.get('triggers', 'triggerName').value = trName;

            this.state.triggerType = tr.type;
            document.querySelectorAll('.type-btn').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-type') === tr.type));
            this.state.typeConfig[tr.type] = { ...this.state.typeConfig[tr.type], ...(tr[tr.type] || {}) };
            this.renderTypeFields();

            this.state.keyframes = Array.isArray(tr.keyframes) ? tr.keyframes.map(k => ({ ...k })) : [];
            this.state.globalDurationSec = Math.max((Math.max(...this.state.keyframes.map(k => k.time + (k.hold || 0))) / 1000) || 3.0, 1);
            this.dom.get('triggers', 'globalDurationSec').value = this.state.globalDurationSec.toFixed(1);

            this.recalcMaxTime();
            this.dom.get('triggers', 'triggerOnSelect').value = tr.triggerOn || 'any_message';
            this.dom.get('triggers', 'keywordInput').value = tr.keyword || '';
            this.updateActivationUI();
            this._updateCanvasSize();
            this.updateRangeFromType(false);

            this.draw();
            this.renderKeyframeList();
            this.state.selectedKfIndex = -1;
            this.updatePropertyPanel();
            this.state.currentPreviewTime = 0;
        } else {
            this.resetEditorOut();
        }
    }

    /**
     * [v60.Elite] Sanitiza y normaliza un string de Timecode SMPTE (HH:MM:SS:FF).
     * Retorna null si es inválido (ej. 'CH ERROR', '--:--:--:--' o texto vacío).
     */
    _sanitizeTimecode(tcStr) {
        if (!tcStr || typeof tcStr !== 'string') return null;
        const clean = tcStr.trim();
        if (!/^\d{1,2}[:;]\d{1,2}[:;]\d{1,2}[:;]\d{1,2}$/.test(clean)) return null;
        const parts = clean.split(/[:;]/).map(p => parseInt(p, 10) || 0);
        let [h, m, s, f] = parts;
        const baseFps = 30;
        s += Math.floor(f / baseFps);
        f %= baseFps;
        m += Math.floor(s / 60);
        s %= 60;
        h += Math.floor(m / 60);
        m %= 60;
        h %= 24;
        const pad = (n) => Math.max(0, n).toString().padStart(2, '0');
        return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
    }

    /**
     * [v60.Elite] Convierte un Timecode HH:MM:SS:FF a segundos flotantes para comparaciones.
     */
    _tcToSecondsLocal(tcStr, fps = 30) {
        const sanitized = this._sanitizeTimecode(tcStr);
        if (!sanitized) return 0;
        const [h, m, s, f] = sanitized.split(':').map(n => parseInt(n, 10) || 0);
        const baseFps = (fps && fps > 0) ? fps : 30;
        return (h * 3600) + (m * 60) + s + (f / baseFps);
    }

    /**
     * [v60.Elite] Normaliza un par { start, end } corrigiendo '00:00:00:00' en fin o inversión start > end.
     */
    _normalizeSingleSmpteRange(rawStart, rawEnd) {
        let start = this._sanitizeTimecode(rawStart) || '00:00:00:00';
        let end = this._sanitizeTimecode(rawEnd) || '00:00:00:00';

        // Blindaje Murphy #2: Si TC Fin se dejó en 00:00:00:00 pero TC Inicio tiene valor, igualamos Fin = Inicio
        if (end === '00:00:00:00' && start !== '00:00:00:00') {
            end = start;
        } else if (start === '00:00:00:00' && end !== '00:00:00:00') {
            start = end;
        }

        const startSec = this._tcToSecondsLocal(start);
        const endSec = this._tcToSecondsLocal(end);

        // Blindaje Murphy #2: Si el usuario introdujo TC Fin menor que TC Inicio, los intercambiamos
        if (endSec < startSec) {
            const tmp = start;
            start = end;
            end = tmp;
        }

        return { start, end };
    }

    /**
     * [v60.Elite] Extrae y normaliza la lista de rangos de Timecode desde cualquier estructura SMPTE (legacy o v60 multi-range).
     */
    _normalizeSmpteRanges(smpteCfg) {
        if (!smpteCfg || typeof smpteCfg !== 'object') return [];
        const rawList = [];

        if (Array.isArray(smpteCfg.timecodes) && smpteCfg.timecodes.length > 0) {
            smpteCfg.timecodes.forEach(item => {
                if (!item) return;
                if (typeof item === 'string') {
                    rawList.push({ start: item, end: item });
                } else if (typeof item === 'object') {
                    const s = item.start || item.timecodeStart || item.timecode || '00:00:00:00';
                    const e = item.end || item.timecodeEnd || s;
                    rawList.push({ start: s, end: e });
                }
            });
        } else if (smpteCfg.timecodeStart || smpteCfg.timecode || smpteCfg.timecodeEnd) {
            const s = smpteCfg.timecodeStart || smpteCfg.timecode || '00:00:00:00';
            const e = smpteCfg.timecodeEnd || s;
            rawList.push({ start: s, end: e });
        }

        const normalized = [];
        const seen = new Set();

        for (const r of rawList) {
            const norm = this._normalizeSingleSmpteRange(r.start, r.end);
            const key = `${norm.start}__${norm.end}`;
            if (!seen.has(key)) {
                seen.add(key);
                normalized.push(norm);
            }
        }

        return normalized;
    }

    /**
     * [v60.Elite] Preserva en memoria los valores actuales del formulario Hardware IN antes de cambiar de pestaña.
     */
    _syncCurrentHwInputsToStateIn() {
        try {
            const startEl = document.getElementById('hwSmpteTcStartIn');
            const endEl = document.getElementById('hwSmpteTcEndIn');
            const devEl = document.getElementById('hwSmpteAudioDevIn');
            const chanEl = document.getElementById('hwSmpteAudioChanIn');
            if (startEl && endEl && this.state.inConfig?.smpte) {
                this.state.inConfig.smpte.timecodeStart = startEl.value;
                this.state.inConfig.smpte.timecodeEnd = endEl.value;
                if (devEl && devEl.value) this.state.inConfig.smpte.audioDeviceId = devEl.value;
                if (chanEl && chanEl.value) this.state.inConfig.smpte.audioChannel = parseInt(chanEl.value, 10) || 1;
                this.state.inConfig.smpte.timecodes = Array.isArray(this.state.inSmpteRanges) ? [...this.state.inSmpteRanges] : [];
            }
        } catch (_) { }
    }

    prepareEditorIn(editIndex) {
        let tr = editIndex !== null ? getMergedTriggers()[editIndex] : null;
        this.resetMediaStateIn();

        if (tr) {
            this.state.currentTriggerId = tr.id;

            // Localizar nombre si es un default
            const localesTriggers = window.localesData?.triggers_v60 || {};
            const oldDefaultsIn = ['Nuevo Trigger IN', 'Nombre Trigger IN', 'Trigger IN Name'];
            let trName = tr.name;
            if (oldDefaultsIn.includes(trName)) {
                trName = localesTriggers.default_name_in || 'Nombre Trigger IN';
            }
            document.getElementById('triggerNameIn').value = trName;

            this.state.inType = tr.type || 'osc';

            document.querySelectorAll('#editorFormIn .type-btn').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-type') === this.state.inType));

            const hwTypeKey = this.state.inType.toLowerCase();
            this.state.inConfig[this.state.inType] = { ...this.state.inConfig[this.state.inType], ...(tr.external?.[hwTypeKey] || {}) };

            // [v60.Elite] Inicializar lista de rangos SMPTE y limpiar bandera dirty
            const smpteExt = tr.external?.smpte || this.state.inConfig.smpte || {};
            this.state.inSmpteRanges = this._normalizeSmpteRanges(smpteExt);
            this.state.inSmpteInputsDirty = false;
            this.state.inSmpteSelectedIdx = this.state.inSmpteRanges.length > 0 ? 0 : -1;
            if (this.state.inSmpteRanges.length > 0) {
                this.state.inConfig.smpte.timecodeStart = this.state.inSmpteRanges[0].start;
                this.state.inConfig.smpte.timecodeEnd = this.state.inSmpteRanges[0].end;
                this.state.inConfig.smpte.timecodes = [...this.state.inSmpteRanges];
            }

            this.renderHwFieldsIn();

            // Cargar mensaje
            document.getElementById('triggerMsgTextIn').value = tr.message?.text || '';
            document.getElementById('triggerFilterSelectIn').value = tr.message?.filterIds?.[0] || 'all';

            // Cargar Previews si existen
            if (tr.message?.audio) {
                this.state.inMedia.audioUrl = tr.message.audio;
                this.updateMediaPreviewIn('audio', tr.message.audio);
            }
            if (tr.message?.image) {
                this.state.inMedia.imageUrl = tr.message.image;
                this.updateMediaPreviewIn('image', tr.message.image);
            }
        } else {
            this.resetEditorIn();
        }
    }

    renderCategorySelectorIn() {
        const select = document.getElementById('triggerFilterSelectIn');
        if (!select) return;

        // Mantener la opción ALL
        const localesTriggers = window.localesData?.triggers_v60 || {};
        const labelAll = localesTriggers.filter_all || 'Todos';
        select.innerHTML = `<option value="all">🌐 ${labelAll}</option>`;

        // Obtener categorías del sistema (usualmente guardadas en window.currentCategories)
        const cats = window.currentCategories || [];
        cats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = `📁 ${cat.name || cat.id}`;
            select.appendChild(opt);
        });
    }

    renderHwFieldsIn() {
        const container = document.getElementById('hwFieldsContainerIn');
        if (!container) return;
        const type = this.state.inType;
        const cfg = this.state.inConfig[type];
        const localesV60 = window.localesData?.triggers_v60 || {};
        const localesAlerts = window.localesData?.alerts || {};

        if (type === 'smpte') {
            const savedDev = localStorage.getItem('talkme_smpte_device');
            const savedChan = parseInt(localStorage.getItem('talkme_smpte_channel')) || 1;
            if (this.smpteCapture) {
                // [v60.Elite] Lógica de Match Inteligente: Etiqueta > ID
                const savedDevId = localStorage.getItem('talkme_smpte_device');
                const savedDevLabel = localStorage.getItem('talkme_smpte_label');
                const savedChan = parseInt(localStorage.getItem('talkme_smpte_channel')) || 1;

                let targetDevId = savedDevId;

                // Si tenemos una etiqueta guardada, intentamos validar que el ID sea correcto para ese nombre
                if (savedDevLabel && window.lastAudioDevices) {
                    const match = window.lastAudioDevices.find(d => d.label === savedDevLabel);
                    if (match) targetDevId = match.deviceId;
                }

                const needsRestart = !this.smpteCapture.isActive ||
                    this.smpteCapture.currentDeviceId !== targetDevId ||
                    this.smpteCapture.currentChannelIndex !== (savedChan - 1);

                if (needsRestart) {
                    console.log(`⏱️ [SMPTE] Match Élite: Sincronizando hardware (${savedDevLabel || 'ID: ' + targetDevId})...`);
                    this.smpteCapture.start(targetDevId, savedChan - 1);
                }
            }
        }

        let html = '';
        if (type === 'osc') {
            html = `
                <div class="field-row">
                    <div class="field-group"><label>${localesAlerts.osc_host || 'Host IP'}</label><input id="hwOscHostIn" value="${cfg.host || '127.0.0.1'}"></div>
                    <div class="field-group"><label>${localesAlerts.osc_port || 'Puerto'}</label><input type="number" id="hwOscPortIn" value="${cfg.port || 9000}"></div>
                </div>
                <div class="field-row" style="margin-top:10px;">
                    <div class="field-group"><label>${localesV60.hw_osc_address || 'Dirección OSC (Address)'}</label><input id="hwOscAddrIn" value="${cfg.address || '/trigger'}"></div>
                    <div class="field-group"><label>${localesAlerts.osc_arg || 'Argumento'}</label><input id="hwOscArgIn" value="${cfg.arg || ''}"></div>
                </div>`;
        } else if (type === 'midi') {
            // Selector de dispositivo MIDI
            const inputs = window._midiInputs || [];
            let options = inputs.map(input => `<option value="${input.id}" ${cfg.deviceId === input.id ? 'selected' : ''}>${input.name}</option>`).join('');
            if (options === '') options = `<option value="default">${localesV60.midi_any_device || 'Cualquier dispositivo'}</option>`;

            html = `
                <div class="field-group" style="margin-bottom:15px;">
                    <label>${localesV60.hw_midi_device || 'Dispositivo MIDI'}</label>
                    <div class="talkme-select-container">
                        <select id="hwMidiDeviceIn" class="talkme-select">${options}</select>
                    </div>
                </div>
                <div class="field-row" style="margin-bottom:10px;">
                    <div class="field-group">
                        <label>${localesAlerts.trigger_type || 'Tipo'}</label>
                        <select id="hwMidiTypeIn" class="talkme-select">
                            <option value="note" ${cfg.type === 'note' ? 'selected' : ''}>Note</option>
                            <option value="cc" ${cfg.type === 'cc' ? 'selected' : ''}>CC</option>
                        </select>
                    </div>
                    <div class="field-group"><label>${localesAlerts.channel || 'Canal'}</label><input type="number" id="hwMidiChanIn" value="${cfg.channel || 1}"></div>
                </div>
                <div class="field-row">
                    <div class="field-group"><label>${localesAlerts.note || 'Nota / CC'}</label><input type="number" id="hwMidiNoteIn" value="${cfg.note || 60}"></div>
                    <div class="field-group"><label>${localesAlerts.velocity || 'Velocidad'}</label><input type="number" id="hwMidiVelocityIn" value="${cfg.velocity || 127}"></div>
                </div>`;
        } else if (type === 'sacn') {
            html = `
                <div class="field-row" style="margin-bottom:10px;">
                    <div class="field-group"><label>${localesAlerts.universe || 'Universo'}</label><input type="number" id="hwSacnUnivIn" value="${cfg.universe || 1}"></div>
                    <div class="field-group"><label>${localesAlerts.priority || 'Prioridad'}</label><input type="number" id="hwSacnPriorityIn" value="${cfg.priority || 100}"></div>
                </div>
                <div class="field-row" style="margin-bottom:10px;">
                    <div class="field-group">
                        <label>${localesAlerts.mode || 'Modo'}</label>
                        <select id="hwSacnModeIn" class="talkme-select">
                            <option value="multicast" ${cfg.mode === 'multicast' ? 'selected' : ''}>Multicast</option>
                            <option value="unicast" ${cfg.mode === 'unicast' ? 'selected' : ''}>Unicast</option>
                        </select>
                    </div>
                    <div class="field-group" id="hwSacnIpGroupIn" style="display:${cfg.mode === 'unicast' ? 'block' : 'none'}">
                        <label>IP</label>
                        <input id="hwSacnIpIn" value="${cfg.ip || ''}" placeholder="192.168.1.100">
                    </div>
                </div>
                <div class="field-group" id="hwSacnMaskGroupIn" style="display:${cfg.mode === 'unicast' ? 'block' : 'none'}; margin-bottom:10px;">
                    <label>Máscara IP</label>
                    <input id="hwSacnMaskIn" value="${cfg.mask || '255.255.255.0'}">
                </div>
                <div class="field-group">
                    <label>${localesAlerts.dmx_channels || 'DMX CHANNELS (JSON)'}</label>
                    <textarea id="hwSacnChannelsIn" style="height:60px; font-family:monospace; font-size:11px;">${cfg.channels || '[]'}</textarea>
                </div>`;
        } else if (type === 'smpte') {
            // [v60] Paridad total con el sistema: Obtener dispositivos en tiempo real
            navigator.mediaDevices.enumerateDevices().then(devices => {
                const audioInputs = devices.filter(d => d.kind === 'audioinput');
                const devSel = document.getElementById('hwSmpteAudioDevIn');
                if (!devSel) return;

                const preferredDevId = audioInputs.some(d => d.deviceId === cfg.audioDeviceId)
                    ? cfg.audioDeviceId
                    : (localStorage.getItem('talkme_smpte_device') || audioInputs[0]?.deviceId || '');

                devSel.innerHTML = audioInputs.map(input =>
                    `<option value="${input.deviceId}" ${preferredDevId === input.deviceId ? 'selected' : ''}>${input.label || 'Micrófono'}</option>`
                ).join('');

                // Si no hay dispositivos, mostrar aviso
                if (audioInputs.length === 0) {
                    devSel.innerHTML = `<option value="">${localesV60.no_inputs_found || window.localesData?.triggers_v60?.no_inputs_found || 'No se encontraron entradas'}</option>`;
                }

                // Disparar actualización de canales inicial
                devSel.dispatchEvent(new Event('change'));
            });

            const captureTargetSvg = `<svg fill="currentColor" viewBox="0 0 512.002 512.002" width="16" height="16" xmlns="http://www.w3.org/2000/svg"><rect x="447.041" y="240.792" width="64.961" height="30.417"></rect><path d="M165.462,240.791h75.329v-75.33C202.332,171.901,171.902,202.331,165.462,240.791z"></path><path d="M271.209,165.461v75.33h75.329C340.098,202.332,309.668,171.902,271.209,165.461z"></path><path d="M165.461,271.209c6.439,38.459,36.87,68.89,75.329,75.33v-75.33H165.461z"></path><path d="M271.209,271.208v75.33c38.459-6.439,68.89-36.87,75.329-75.33H271.209z"></path><rect x="240.792" width="30.417" height="64.961"></rect><rect x="240.792" y="447.041" width="30.417" height="64.961"></rect><rect y="240.792" width="64.961" height="30.417"></rect><path d="M271.209,64.975v69.748c55.259,6.889,99.179,50.81,106.069,106.069h69.748C439.644,147.229,364.771,72.356,271.209,64.975z"></path><path d="M64.975,240.791h69.748c6.889-55.259,50.81-99.179,106.069-106.069V64.975C147.229,72.356,72.356,147.229,64.975,240.791z"></path><path d="M134.723,271.209H64.975c7.381,93.562,82.254,168.435,175.816,175.816v-69.748C185.533,370.388,141.612,326.467,134.723,271.209z"></path><path d="M377.277,271.209c-6.889,55.259-50.81,99.179-106.069,106.069v69.748c93.562-7.381,168.435-82.254,175.816-175.816H377.277z"></path></svg>`;
            const addRangeSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

            const initStartVal = cfg.timecodeStart || cfg.timecode || (this.state.inSmpteRanges?.[0]?.start) || '00:00:00:00';
            const initEndVal = cfg.timecodeEnd || (this.state.inSmpteRanges?.[0]?.end) || initStartVal || '00:00:00:00';

            html = `
                <div class="field-row" style="margin-bottom:15px;">
                    <div class="field-group">
                        <label>${localesV60.hw_smpte_device || 'Fuente Audio LTC'}</label>
                        <div class="talkme-select-container">
                            <select id="hwSmpteAudioDevIn" class="talkme-select">
                                <option value="">${window.localesData?.language?.loading || 'Cargando...'}</option>
                            </select>
                            <div class="talkme-select-arrow">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                        </div>
                    </div>
                    <div class="field-group" style="flex:0.6;">
                        <label>${localesV60.hw_smpte_channel || 'Canal'}</label>
                        <div class="talkme-select-container">
                            <select id="hwSmpteAudioChanIn" class="talkme-select">
                                <option value="${cfg.audioChannel || 1}">${localesAlerts.channel || 'Canal'} ${cfg.audioChannel || 1}</option>
                            </select>
                            <div class="talkme-select-arrow">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Listado de Rangos de Timecode Activos (Arriba para visión global inmediata) -->
                <div id="smpteRangesListContainer"></div>

                <!-- Controles de Edición / Adición (Debajo de la lista e inmediatamente contiguos al monitor LTC LIVE) -->
                <div class="smpte-tc-inputs-row">
                    <div class="field-group">
                        <label>${localesV60.hw_time_start || 'TC Inicio'}</label>
                        <div class="smpte-tc-input-group">
                            <input id="hwSmpteTcStartIn" value="${initStartVal}" placeholder="00:00:00:00">
                            <button type="button" id="btnSetTcStartIn" class="btn-dic btn-tc-capture" title="${localesV60.btn_capture_tc || 'Capturar TC actual'}">${captureTargetSvg}</button>
                        </div>
                    </div>
                    <div class="field-group">
                        <label>${localesV60.hw_time_end || 'TC Fin'}</label>
                        <div class="smpte-tc-input-group">
                            <input id="hwSmpteTcEndIn" value="${initEndVal}" placeholder="00:00:00:00">
                            <button type="button" id="btnSetTcEndIn" class="btn-dic btn-tc-capture" title="${localesV60.btn_capture_tc || 'Capturar TC actual'}">${captureTargetSvg}</button>
                        </div>
                    </div>
                    <button type="button" id="btnAddSmpteRangeIn" class="btn-dic btn-tc-add" title="${localesV60.btn_add_tc_range || 'Añadir rango de Timecode a la lista'}">${addRangeSvg}</button>
                </div>

                <!-- Monitor SMPTE Integrado en el Editor -->
                <div id="smpteMonitor" class="smpte-monitor-container" style="display: flex; margin-bottom: 20px; border-color: var(--accent-orange); background: rgba(0,0,0,0); padding: 10px;">
                    <div class="smpte-label">LTC LIVE</div>
                    <div class="smpte-clock" id="smpteClockDisplay" style="font-size: 20px;">00:00:00:00</div>
                    <div class="smpte-signal-indicator" id="smpteSignalDot"></div>
                </div>`;
        }
        container.innerHTML = html;

        // [v60.Elite] Re-adjuntar Listeners y Lista Multi-Timecode para SMPTE
        if (type === 'smpte') {
            const btnStart = document.getElementById('btnSetTcStartIn');
            const btnEnd = document.getElementById('btnSetTcEndIn');
            const btnAddRange = document.getElementById('btnAddSmpteRangeIn');
            const inpStart = document.getElementById('hwSmpteTcStartIn');
            const inpEnd = document.getElementById('hwSmpteTcEndIn');
            const clock = document.getElementById('smpteClockDisplay');

            if (inpStart) {
                inpStart.addEventListener('input', () => {
                    this.state.inSmpteInputsDirty = true;
                    if (this.state.inSmpteSelectedIdx !== -1) {
                        this.state.inSmpteSelectedIdx = -1;
                        this.renderSmpteRangesListIn();
                    }
                });
            }
            if (inpEnd) {
                inpEnd.addEventListener('input', () => {
                    this.state.inSmpteInputsDirty = true;
                    if (this.state.inSmpteSelectedIdx !== -1) {
                        this.state.inSmpteSelectedIdx = -1;
                        this.renderSmpteRangesListIn();
                    }
                });
            }

            if (btnStart && clock && inpStart) {
                btnStart.onclick = () => {
                    const validTc = this._sanitizeTimecode(clock.innerText);
                    if (!validTc) {
                        showCatFeedback(localesV60.invalid_live_tc || 'Sin señal LTC válida para capturar', 'info');
                        return;
                    }
                    inpStart.value = validTc;
                    this.state.inSmpteInputsDirty = true;
                    // Blindaje Murphy #2: Si TC Fin está en 00:00:00:00 o es menor que el nuevo inicio, igualarlo automáticamente
                    if (inpEnd) {
                        const endValid = this._sanitizeTimecode(inpEnd.value) || '00:00:00:00';
                        if (endValid === '00:00:00:00' || this._tcToSecondsLocal(endValid) < this._tcToSecondsLocal(validTc)) {
                            inpEnd.value = validTc;
                        }
                    }
                };
            }

            if (btnEnd && clock && inpEnd) {
                btnEnd.onclick = () => {
                    const validTc = this._sanitizeTimecode(clock.innerText);
                    if (!validTc) {
                        showCatFeedback(localesV60.invalid_live_tc || 'Sin señal LTC válida para capturar', 'info');
                        return;
                    }
                    inpEnd.value = validTc;
                    this.state.inSmpteInputsDirty = true;
                };
            }

            if (btnAddRange) {
                btnAddRange.onclick = () => this.addSmpteRangeIn();
            }

            this.renderSmpteRangesListIn();
        }

        // [v60] Listeners especiales según el tipo
        if (type === 'sacn') {
            const modeSel = document.getElementById('hwSacnModeIn');
            const ipGrp = document.getElementById('hwSacnIpGroupIn');
            const maskGrp = document.getElementById('hwSacnMaskGroupIn');
            if (modeSel && ipGrp && maskGrp) {
                modeSel.addEventListener('change', () => {
                    const isUnicast = modeSel.value === 'unicast';
                    ipGrp.style.display = isUnicast ? 'block' : 'none';
                    maskGrp.style.display = isUnicast ? 'block' : 'none';
                });
            }
        }

        // [v60] Re-adjuntar Listeners para SMPTE si es necesario
        if (type === 'smpte') {
            const devSel = document.getElementById('hwSmpteAudioDevIn');
            const chanSel = document.getElementById('hwSmpteAudioChanIn');

            const updateChannels = async () => {
                const devId = devSel?.value || 'default';
                const label = devSel?.selectedOptions[0]?.text || '';

                if (window.detectChannelsForDevice) {
                    const channels = await window.detectChannelsForDevice(devId, label);
                    if (chanSel) {
                        const channelLabel = localesAlerts.channel || window.localesData?.alerts?.channel || 'Canal';
                        chanSel.innerHTML = channels.map(ch => `<option value="${ch.index + 1}" ${cfg.audioChannel === (ch.index + 1) ? 'selected' : ''}>${channelLabel} ${ch.index + 1}</option>`).join('');
                    }
                }
                restartSmpte();
            };

            const restartSmpte = () => {
                const devId = devSel?.value || 'default';
                const chan = (parseInt(chanSel?.value) || 1);
                const devLabel = devSel?.selectedOptions[0]?.text || '';

                // [v60.Elite] Persistencia Robusta: Guardamos el nombre para recuperarlo si el ID cambia
                localStorage.setItem('talkme_smpte_device', devId);
                localStorage.setItem('talkme_smpte_channel', chan);
                localStorage.setItem('talkme_smpte_label', devLabel);

                if (this.smpteCapture) {
                    this.smpteCapture.start(devId, chan - 1);
                }

                // Actualizar inmediatamente la lista de triggers para reflejar el nuevo hardware
                this.renderTriggersList();
            };

            if (devSel) devSel.addEventListener('change', updateChannels);
            if (chanSel) chanSel.addEventListener('change', restartSmpte);

            // Carga inicial de canales
            updateChannels();
        }
    }

    resetEditorOut() {
        this.state.currentTriggerId = this._generateId();
        const localesTriggers = window.localesData?.triggers_v60 || {};
        this.dom.get('triggers', 'triggerName').value = localesTriggers.default_name_out || 'Nombre Trigger OUT';
        this.state.triggerType = 'osc';
        this.state.keyframes = [
            { time: 0, value: 0, easing: 'linear', hold: 0, name: 'Inicio' },
            { time: 500, value: 1, easing: 'easeOutCubic', hold: 0, name: 'Pico' }
        ];
        this.state.globalDurationSec = 3.0;
        this.dom.get('triggers', 'globalDurationSec').value = '3.0';
        this.dom.get('triggers', 'triggerOnSelect').value = 'any_message';
        this.dom.get('triggers', 'keywordInput').value = '';
        this.updateActivationUI();
        this.renderTypeFields();
        this.recalcMaxTime();
        this.updateRangeFromType();
        this._updateCanvasSize();
        this.draw();
    }

    /**
     * [v60.Elite] Añade el rango actual de #hwSmpteTcStartIn / #hwSmpteTcEndIn a la lista de rangos de Timecode.
     */
    addSmpteRangeIn() {
        const inpStart = document.getElementById('hwSmpteTcStartIn');
        const inpEnd = document.getElementById('hwSmpteTcEndIn');
        if (!inpStart || !inpEnd) return;

        const localesV60 = window.localesData?.triggers_v60 || {};
        const rawStart = inpStart.value;
        const rawEnd = inpEnd.value;

        if (!this._sanitizeTimecode(rawStart) && !this._sanitizeTimecode(rawEnd)) {
            showCatFeedback(localesV60.invalid_tc_format || 'Formato de Timecode inválido (use HH:MM:SS:FF)', 'error');
            return;
        }

        const norm = this._normalizeSingleSmpteRange(rawStart, rawEnd);
        inpStart.value = norm.start;
        inpEnd.value = norm.end;

        if (!Array.isArray(this.state.inSmpteRanges)) {
            this.state.inSmpteRanges = [];
        }

        const dupIdx = this.state.inSmpteRanges.findIndex(r => r.start === norm.start && r.end === norm.end);
        if (dupIdx !== -1) {
            this.state.inSmpteInputsDirty = false;
            this.renderSmpteRangesListIn(dupIdx);
            showCatFeedback(localesV60.tc_range_duplicate || `El rango ${norm.start} ➜ ${norm.end} ya está en la lista`, 'info');
            return;
        }

        this.state.inSmpteRanges.push(norm);
        this.state.inSmpteInputsDirty = false;
        this.state.inSmpteSelectedIdx = this.state.inSmpteRanges.length - 1;

        if (this.state.inConfig?.smpte) {
            this.state.inConfig.smpte.timecodes = [...this.state.inSmpteRanges];
            this.state.inConfig.smpte.timecodeStart = this.state.inSmpteRanges[0].start;
            this.state.inConfig.smpte.timecodeEnd = this.state.inSmpteRanges[0].end;
        }

        this.renderSmpteRangesListIn(this.state.inSmpteRanges.length - 1);
    }

    /**
     * [v60.Elite] Elimina un rango de Timecode de la lista por su índice.
     */
    removeSmpteRangeIn(index) {
        if (!Array.isArray(this.state.inSmpteRanges)) return;
        if (index < 0 || index >= this.state.inSmpteRanges.length) return;

        const removed = this.state.inSmpteRanges.splice(index, 1)[0];
        this.state.inSmpteInputsDirty = false;
        if (this.state.inSmpteSelectedIdx === index) {
            this.state.inSmpteSelectedIdx = Math.min(index, this.state.inSmpteRanges.length - 1);
        } else if (this.state.inSmpteSelectedIdx > index) {
            this.state.inSmpteSelectedIdx--;
        }

        const inpStart = document.getElementById('hwSmpteTcStartIn');
        const inpEnd = document.getElementById('hwSmpteTcEndIn');

        // Blindaje Murphy #1: Si el rango eliminado estaba cargado en los inputs, actualizarlos al siguiente rango o a 00:00:00:00
        if (inpStart && inpEnd && removed) {
            const curNorm = this._normalizeSingleSmpteRange(inpStart.value, inpEnd.value);
            if (curNorm.start === removed.start && curNorm.end === removed.end) {
                if (this.state.inSmpteRanges.length > 0) {
                    const nextRange = this.state.inSmpteRanges[Math.min(index, this.state.inSmpteRanges.length - 1)];
                    inpStart.value = nextRange.start;
                    inpEnd.value = nextRange.end;
                } else {
                    inpStart.value = '00:00:00:00';
                    inpEnd.value = '00:00:00:00';
                }
            }
        }

        if (this.state.inConfig?.smpte) {
            this.state.inConfig.smpte.timecodes = [...this.state.inSmpteRanges];
            this.state.inConfig.smpte.timecodeStart = this.state.inSmpteRanges[0]?.start || inpStart?.value || '00:00:00:00';
            this.state.inConfig.smpte.timecodeEnd = this.state.inSmpteRanges[0]?.end || inpEnd?.value || '00:00:00:00';
        }

        this.renderSmpteRangesListIn();
    }

    /**
     * [v60.Elite] Renderiza el listado interactivo de rangos de Timecode dentro del editor IN.
     */
    renderSmpteRangesListIn(highlightIndex = -1) {
        const container = document.getElementById('smpteRangesListContainer');
        if (!container) return;

        const ranges = Array.isArray(this.state.inSmpteRanges) ? this.state.inSmpteRanges : [];
        const localesV60 = window.localesData?.triggers_v60 || {};
        const headerTitle = localesV60.tc_ranges_title || 'Rangos de Timecode Activos';
        const emptyHint = localesV60.tc_ranges_empty || 'Pulse [+] para añadir varios rangos o guarde directamente el rango actual';

        const deleteTrashSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

        if (ranges.length === 0) {
            container.innerHTML = `
                <div class="smpte-ranges-wrapper">
                    <div class="smpte-ranges-header">
                        <span>${headerTitle}</span>
                        <span class="smpte-ranges-count-badge">0</span>
                    </div>
                    <div class="smpte-ranges-empty">${emptyHint}</div>
                </div>`;
            return;
        }

        const selectedIdx = (typeof this.state.inSmpteSelectedIdx === 'number') ? this.state.inSmpteSelectedIdx : -1;
        const itemsHtml = ranges.map((r, idx) => `
            <div class="smpte-range-item ${idx === selectedIdx ? 'selected' : ''} ${idx === highlightIndex ? 'pulse-highlight' : ''}" data-range-idx="${idx}" title="Clic para cargar en los campos de edición">
                <div class="smpte-range-left">
                    <span class="smpte-range-index">#${idx + 1}</span>
                    <div class="smpte-range-values">
                        <span>${r.start}</span>
                        <span class="smpte-range-arrow">➜</span>
                        <span>${r.end}</span>
                    </div>
                </div>
                <button type="button" class="btn-delete-tc-range" data-del-idx="${idx}" title="${localesV60.btn_delete_tc_range || 'Eliminar rango de Timecode'}">
                    ${deleteTrashSvg}
                </button>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="smpte-ranges-wrapper">
                <div class="smpte-ranges-header">
                    <span>${headerTitle}</span>
                    <span class="smpte-ranges-count-badge">${ranges.length}</span>
                </div>
                <div class="smpte-ranges-list custom-scroll">
                    ${itemsHtml}
                </div>
            </div>`;

        container.querySelectorAll('.smpte-range-item').forEach(itemEl => {
            itemEl.onclick = (e) => {
                if (e.target.closest('.btn-delete-tc-range')) return;
                const idx = parseInt(itemEl.getAttribute('data-range-idx'), 10);
                const targetRange = this.state.inSmpteRanges?.[idx];
                if (!targetRange) return;
                const inpStart = document.getElementById('hwSmpteTcStartIn');
                const inpEnd = document.getElementById('hwSmpteTcEndIn');
                if (inpStart) inpStart.value = targetRange.start;
                if (inpEnd) inpEnd.value = targetRange.end;
                this.state.inSmpteInputsDirty = false;
                this.state.inSmpteSelectedIdx = idx;
                this.renderSmpteRangesListIn();
            };
        });

        container.querySelectorAll('.btn-delete-tc-range').forEach(delBtn => {
            delBtn.onclick = (e) => {
                e.stopPropagation();
                const idx = parseInt(delBtn.getAttribute('data-del-idx'), 10);
                this.removeSmpteRangeIn(idx);
            };
        });
    }

    resetEditorIn() {
        this.state.currentTriggerId = this._generateId();
        const localesTriggers = window.localesData?.triggers_v60 || {};
        document.getElementById('triggerNameIn').value = localesTriggers.default_name_in || 'Nombre Trigger IN';
        this.state.inType = 'osc';
        this.state.inSmpteRanges = [];
        this.state.inSmpteInputsDirty = false;
        this.state.inSmpteSelectedIdx = -1;

        // [v60] Resetear a valores por defecto
        this.state.inConfig = {
            osc: { host: '127.0.0.1', port: 9000, address: '/trigger', arg: '' },
            midi: { deviceId: 'default', type: 'note', note: 60, channel: 1, velocity: 127 },
            sacn: { universe: 1, priority: 100, mode: 'multicast', ip: '', mask: '255.255.255.0', channels: '[]', direction: 'IN' },
            smpte: { timecode: '00:00:00:00', timecodeStart: '00:00:00:00', timecodeEnd: '00:00:00:00', timecodes: [] }
        };

        document.querySelectorAll('#editorFormIn .type-btn').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-type') === 'osc'));
        this.renderHwFieldsIn();

        document.getElementById('triggerMsgTextIn').value = '';
        document.getElementById('triggerFilterSelectIn').value = 'all';
        this.resetMediaStateIn();
    }

    resetMediaStateIn() {
        if (this.previewAudioIn) {
            this.previewAudioIn.pause();
            this.previewAudioIn = null;
        }
        this.state.inMedia = {
            audioBlob: null,
            audioUrl: null,
            imageBlob: null,
            imageUrl: null,
            isRecording: false
        };
        this.updateMediaPreviewIn('audio', null);
        this.updateMediaPreviewIn('image', null);

        const btnRecord = document.getElementById('btnRecordAudioIn');
        if (btnRecord) {
            btnRecord.classList.remove('recording');
            const localesTriggers = window.localesData?.triggers_v60 || {};
            const labelRecord = localesTriggers.btn_record || 'Grabar';
            btnRecord.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg> ${labelRecord}`;
        }
    }

    updateMediaPreviewIn(type, source) {
        const container = document.getElementById(type === 'audio' ? 'audioPreviewIn' : 'imagePreviewIn');
        if (!container) return;
        const localesV60 = window.localesData?.triggers_v60 || {};

        if (!source) {
            const emptyLabel = type === 'audio' ? (localesV60.preview_empty_audio || 'Sin audio seleccionado') : (localesV60.preview_empty_image || 'Sin imagen seleccionada');
            container.innerHTML = `<div class="preview-placeholder">${emptyLabel}</div>`;
            if (type === 'audio') {
                if (this.previewAudioIn) {
                    this.previewAudioIn.pause();
                    this.previewAudioIn = null;
                }
                const btnPlay = document.getElementById('btnPlayAudioIn');
                if (btnPlay) {
                    btnPlay.style.display = 'none';
                    btnPlay.classList.remove('active');
                    const playLabel = localesV60.btn_play || 'Probar';
                    btnPlay.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> ${playLabel}`;
                }
            }
            return;
        }

        if (type === 'audio') {
            const feedbackLabel = localesV60.feedback_audio || 'Audio cargado';
            container.innerHTML = `<div class="audio-preview-ui">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent-blue)"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                <span style="font-size:11px; margin-left:8px; color:#aaa;">${feedbackLabel}</span>
                <button id="btnResetAudioIn" class="btn-dic" style="margin-left:auto; padding:4px 8px; font-size:10px;">X</button>
            </div>`;

            const btnReset = document.getElementById('btnResetAudioIn');
            if (btnReset) btnReset.onclick = () => this.resetMediaStateInType('audio');

            const btnPlay = document.getElementById('btnPlayAudioIn');
            if (btnPlay) btnPlay.style.display = 'flex';
        } else {
            container.innerHTML = `<img src="${source}" class="image-preview-el">
                <button id="btnResetImageIn" class="btn-dic" style="position:absolute; top:5px; right:5px; padding:4px 8px; font-size:10px; background:rgba(0,0,0,0.6);">X</button>`;
            container.style.position = 'relative';

            const btnReset = document.getElementById('btnResetImageIn');
            if (btnReset) btnReset.onclick = () => this.resetMediaStateInType('image');
        }
    }

    resetMediaStateInType(type) {
        if (type === 'audio') {
            this.state.inMedia.audioBlob = null;
            this.state.inMedia.audioUrl = null;
        } else {
            this.state.inMedia.imageBlob = null;
            this.state.inMedia.imageUrl = null;
        }
        this.updateMediaPreviewIn(type, null);
    }

    playAudioPreviewIn() {
        const btn = document.getElementById('btnPlayAudioIn');
        const localesV60 = window.localesData?.triggers_v60 || {};

        if (this.previewAudioIn) {
            this.previewAudioIn.pause();
            this.previewAudioIn = null;
            if (btn) {
                btn.classList.remove('active');
                const playLabel = localesV60.btn_play || 'Probar';
                btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> ${playLabel}`;
            }
            return;
        }

        const source = this.state.inMedia.audioUrl;
        if (!source) return;

        this.previewAudioIn = new Audio(source);
        if (typeof window.registerActiveAudio === 'function') window.registerActiveAudio(this.previewAudioIn);
        if (btn) {
            btn.classList.add('active');
            const stopLabel = localesV60.btn_stop || 'Parar';
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12"></rect></svg> ${stopLabel}`;
        }

        this.previewAudioIn.play().catch(e => {
            console.error("Error reproduciendo audio:", e);
            if (btn) {
                btn.classList.remove('active');
                const playLabel = localesV60.btn_play || 'Probar';
                btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> ${playLabel}`;
            }
        });

        this.previewAudioIn.onended = () => {
            this.previewAudioIn = null;
            if (btn) {
                btn.classList.remove('active');
                const playLabel = localesV60.btn_play || 'Probar';
                btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> ${playLabel}`;
            }
        };
    }

    async saveTriggerIn() {
        const localesV60 = window.localesData?.triggers_v60 || {};
        const name = document.getElementById('triggerNameIn').value;
        if (!name) { showCatFeedback(localesV60.error_no_name || "Nombre requerido", "error"); return; }

        const type = this.state.inType;
        const triggerId = this.state.currentTriggerId || this._generateId();
        const filterVal = document.getElementById('triggerFilterSelectIn').value;

        const hwConfig = {};
        if (type === 'osc') {
            const hostVal = (document.getElementById('hwOscHostIn')?.value || '').trim();
            const portVal = parseInt(document.getElementById('hwOscPortIn')?.value);
            if (!this.isValidHost(hostVal)) {
                showCatFeedback(window.localesData?.alerts?.invalid_osc_ip || "IP o Host OSC inválido. Debe ser una dirección IP válida (ej. 192.168.0.28) o localhost", "error");
                return;
            }
            if (isNaN(portVal) || portVal < 1 || portVal > 65535) {
                showCatFeedback(window.localesData?.alerts?.invalid_osc_port || "Puerto OSC inválido. Debe estar entre 1 y 65535", "error");
                return;
            }
            hwConfig.osc = {
                host: hostVal,
                port: portVal,
                address: document.getElementById('hwOscAddrIn').value,
                arg: document.getElementById('hwOscArgIn').value
            };
        }
        if (type === 'midi') {
            hwConfig.midi = {
                deviceId: document.getElementById('hwMidiDeviceIn').value,
                type: document.getElementById('hwMidiTypeIn').value,
                note: parseInt(document.getElementById('hwMidiNoteIn').value),
                channel: parseInt(document.getElementById('hwMidiChanIn').value),
                velocity: parseInt(document.getElementById('hwMidiVelocityIn').value)
            };
        }
        if (type === 'sacn') {
            const univVal = parseInt(document.getElementById('hwSacnUnivIn')?.value);
            const prioVal = parseInt(document.getElementById('hwSacnPriorityIn')?.value);
            const modeVal = document.getElementById('hwSacnModeIn')?.value || 'multicast';
            const ipVal = (document.getElementById('hwSacnIpIn')?.value || '').trim();

            if (modeVal === 'unicast' && !this.isValidHost(ipVal)) {
                showCatFeedback(window.localesData?.alerts?.invalid_sacn_ip || "IP de Destino sACN inválida para modo Unicast.", "error");
                return;
            }
            if (isNaN(univVal) || univVal < 1 || univVal > 63999) {
                showCatFeedback(window.localesData?.alerts?.invalid_sacn_universe || "Universo sACN inválido (1-63999)", "error");
                return;
            }
            if (isNaN(prioVal) || prioVal < 0 || prioVal > 200) {
                showCatFeedback(window.localesData?.alerts?.invalid_sacn_priority || "Prioridad sACN inválida (0-200)", "error");
                return;
            }

            hwConfig.sacn = {
                universe: univVal,
                priority: prioVal,
                mode: modeVal,
                ip: ipVal,
                mask: document.getElementById('hwSacnMaskIn').value,
                channels: document.getElementById('hwSacnChannelsIn').value
            };
        }
        if (type === 'smpte') {
            const rawStartInput = document.getElementById('hwSmpteTcStartIn')?.value || '00:00:00:00';
            const rawEndInput = document.getElementById('hwSmpteTcEndIn')?.value || '00:00:00:00';
            let finalRanges = Array.isArray(this.state.inSmpteRanges) ? [...this.state.inSmpteRanges] : [];

            // Blindaje Murphy #1:
            // - Si la lista está vacía, guardamos directamente el rango escrito en los inputs.
            // - Si la lista NO está vacía, solo auto-añadimos el contenido de los inputs si el usuario los modificó/capturó explícitamente (inSmpteInputsDirty === true).
            if (finalRanges.length === 0) {
                const normInput = this._normalizeSingleSmpteRange(rawStartInput, rawEndInput);
                finalRanges.push(normInput);
            } else if (this.state.inSmpteInputsDirty) {
                if (this._sanitizeTimecode(rawStartInput) || this._sanitizeTimecode(rawEndInput)) {
                    const normInput = this._normalizeSingleSmpteRange(rawStartInput, rawEndInput);
                    const isZeroDefault = normInput.start === '00:00:00:00' && normInput.end === '00:00:00:00';
                    const alreadyExists = finalRanges.some(r => r.start === normInput.start && r.end === normInput.end);
                    if (!isZeroDefault && !alreadyExists) {
                        finalRanges.push(normInput);
                    }
                }
            }

            this.state.inSmpteRanges = finalRanges;
            this.state.inSmpteInputsDirty = false;

            const primaryRange = finalRanges[0] || { start: '00:00:00:00', end: '00:00:00:00' };
            hwConfig.smpte = {
                timecodes: finalRanges,
                timecodeStart: primaryRange.start,
                timecodeEnd: primaryRange.end,
                audioDeviceId: document.getElementById('hwSmpteAudioDevIn')?.value || 'default',
                audioChannel: parseInt(document.getElementById('hwSmpteAudioChanIn')?.value, 10) || 1
            };
        }

        // [v60] Preparar Media para envío (FormData si hay blobs)
        const triggerData = {
            id: triggerId,
            name,
            direction: 'IN',
            type: type,
            external: hwConfig,
            message: {
                text: document.getElementById('triggerMsgTextIn').value,
                filterIds: [filterVal],
                sendToAll: filterVal === 'all',
                audio: this.state.inMedia.audioUrl, // URL existente si no hay cambio
                image: this.state.inMedia.imageUrl
            }
        };

        const formData = new FormData();
        formData.append('trigger', JSON.stringify(triggerData));
        if (this.state.inMedia.audioBlob) formData.append('audio', this.state.inMedia.audioBlob, 'trigger_audio.webm');
        if (this.state.inMedia.imageBlob) formData.append('image', this.state.inMedia.imageBlob, 'trigger_image.jpg');

        try {
            const saveBtnIn = document.getElementById('saveTriggerBtnIn');
            if (saveBtnIn) saveBtnIn.disabled = true;

            // Usar fetch para el guardado con archivos físicos
            const response = await fetch('/api/triggers/save-with-media', {
                method: 'POST',
                body: formData
            });

            const res = await response.json();

            if (res && res.success) {
                setTriggerEnabled(triggerId, true);
                this.safeEmit('sync-triggers-state', { enabledTriggerIds: getEnabledTriggerIds() });
                this.closeTriggerForm();
                this.renderTriggersList();
                const successMsg = (window.localesData?.alerts?.trigger_saved_in || 'Trigger IN "%name%" guardado ✓').replace('%name%', name);
                showCatFeedback(successMsg, 'success');
            } else {
                showCatFeedback(res?.error || (window.localesData?.alerts?.error_saving || 'Error al guardar'), 'error');
            }
        } catch (err) {
            console.error('Error salvando trigger IN:', err);
            showCatFeedback(window.localesData?.alerts?.network_error_saving || 'Error de red al guardar', 'error');
        } finally {
            const saveBtnIn = document.getElementById('saveTriggerBtnIn');
            if (saveBtnIn) saveBtnIn.disabled = false;
        }
    }

    // --- Lógica Multimedia Avanzada (Captura/Grabación) ---

    async toggleAudioRecordingIn() {
        if (this.state.inMedia.isRecording) {
            this.stopAudioRecordingIn();
        } else {
            this.startAudioRecordingIn();
        }
    }

    async startAudioRecordingIn() {
        const localesV60 = window.localesData?.triggers_v60 || {};
        try {
            const micId = (window.audioDeviceSelect && window.audioDeviceSelect.value) || 'default';
            const constraints = window.getEliteConstraints ? window.getEliteConstraints(micId) : { audio: micId === 'default' ? true : { deviceId: { exact: micId } } };

            console.log(`🎤 Iniciando grabación con mic: ${micId}`);
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.audioRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.audioRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data);
            };

            this.audioRecorder.onstop = () => {
                const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.state.inMedia.audioBlob = blob;
                this.state.inMedia.audioUrl = URL.createObjectURL(blob);
                this.updateMediaPreviewIn('audio', this.state.inMedia.audioUrl);
                stream.getTracks().forEach(t => t.stop());
            };

            this.audioRecorder.start();
            this.state.inMedia.isRecording = true;

            const btn = document.getElementById('btnRecordAudioIn');
            if (btn) {
                btn.classList.add('recording');
                const stopLabel = localesV60.btn_stop || 'Parar';
                btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg> ${stopLabel}`;
            }

            showCatFeedback(window.localesData?.alerts?.trigger_recording_audio || "Grabando audio para trigger...", "info");
        } catch (err) {
            console.error("Error micrófono:", err);
            showCatFeedback(localesV60.error_mic || window.localesData?.alerts?.trigger_mic_error || "No se pudo acceder al micrófono", "error");
        }
    }

    stopAudioRecordingIn() {
        if (this.audioRecorder && this.audioRecorder.state !== 'inactive') {
            this.audioRecorder.stop();
            this.state.inMedia.isRecording = false;

            const btn = document.getElementById('btnRecordAudioIn');
            if (btn) {
                btn.classList.remove('recording');
                const recordLabel = (window.localesData?.triggers_v60?.btn_record) || 'Grabar';
                btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg> ${recordLabel}`;
            }
        }
    }

    async capturePhotoIn() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.createElement('video');
            video.srcObject = stream;
            await video.play();

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);

            canvas.toBlob((blob) => {
                this.state.inMedia.imageBlob = blob;
                this.state.inMedia.imageUrl = URL.createObjectURL(blob);
                this.updateMediaPreviewIn('image', this.state.inMedia.imageUrl);
                stream.getTracks().forEach(t => t.stop());
            }, 'image/jpeg', 0.85);

            showCatFeedback("Foto capturada", "success");
        } catch (err) {
            console.error("Error cámara:", err);
            showCatFeedback("No se pudo acceder a la cámara", "error");
        }
    }

    handleFileSelectIn(e, type) {
        const file = e.target.files[0];
        if (!file) return;

        if (type === 'audio') {
            this.state.inMedia.audioBlob = file;
            this.state.inMedia.audioUrl = URL.createObjectURL(file);
            this.updateMediaPreviewIn('audio', this.state.inMedia.audioUrl);
        } else {
            this.state.inMedia.imageBlob = file;
            this.state.inMedia.imageUrl = URL.createObjectURL(file);
            this.updateMediaPreviewIn('image', this.state.inMedia.imageUrl);
        }
        showCatFeedback(`${type.toUpperCase()} adjuntado`, "success");
    }

    toggleEmojiPicker(e) {
        // Implementación de panel de emojis simple v60
        let picker = document.getElementById('talkmeEmojiPickerIn');
        if (picker) {
            picker.remove();
            return;
        }

        picker = document.createElement('div');
        picker.id = 'talkmeEmojiPickerIn';
        picker.style.cssText = `
            position: absolute; bottom: 100%; right: 0; 
            background: #222; border: 1px solid #444; 
            border-radius: 8px; padding: 10px; z-index: 1000;
            display: grid; grid-template-columns: repeat(6, 1fr); gap: 5px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 220px;
            max-height: 200px; overflow-y: auto;
        `;

        const emojis = ['😀', '😂', '😎', '😍', '🤔', '😐', '😮', '😱', '👍', '👎', '👏', '🔥', '✨', '⭐', '🔴', '🟢', '🔵', '⚠️', '✅', '❌', '📢', '🎙️', '🎭', '🎬'];
        emojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.textContent = emoji;
            btn.style.cssText = 'background:none; border:none; font-size:20px; cursor:pointer; padding:5px;';
            btn.onclick = () => {
                const txt = document.getElementById('triggerMsgTextIn');
                txt.value += emoji;
                picker.remove();
            };
            picker.appendChild(btn);
        });

        const parent = document.getElementById('btnEmojiTriggerIn').parentElement;
        parent.style.position = 'relative';
        parent.appendChild(picker);

        // Cerrar al hacer clic fuera
        const close = (ev) => {
            if (!picker.contains(ev.target) && ev.target.id !== 'btnEmojiTriggerIn') {
                picker.remove();
                document.removeEventListener('click', close);
            }
        };
        setTimeout(() => document.addEventListener('click', close), 10);
    }

    renderSaveTriggerButtonLabel(customLabel = null) {
        const saveBtn = document.getElementById('saveTriggerBtn');
        const saveBtnIn = document.getElementById('saveTriggerBtnIn');
        const localeV60 = window.localesData?.triggers_v60 || {};
        const localeAlerts = window.localesData?.alerts || {};

        let label = customLabel;
        if (!label) {
            if (this.state.currentTriggerId) {
                label = localeV60.btn_update || 'Actualizar Trigger';
            } else {
                const editorFormIn = document.getElementById('editorFormIn');
                const isEditingIn = editorFormIn && editorFormIn.style.display !== 'none';
                label = isEditingIn ? (localeV60.btn_save_in || 'Guardar Trigger IN') : (localeAlerts.save_trigger || 'Guardar Trigger OUT');
            }
        }

        const saveIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>';

        [saveBtn, saveBtnIn].forEach(btn => {
            if (!btn) return;
            const span = btn.querySelector('.btn-save-label');
            if (span) {
                span.textContent = label;
            } else {
                btn.innerHTML = `${saveIcon} <span class="btn-save-label">${label}</span>`;
            }
        });
    }

    updateActivationUI() {
        const group = this.dom.get('triggers', 'keywordGroup');
        const select = this.dom.get('triggers', 'triggerOnSelect');
        if (group && select) {
            group.style.display = select.value === 'keyword' ? 'block' : 'none';
        }
    }

    isValidHost(host) {
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

    saveCurrentTrigger() {
        this.saveCurrentTypeConfig();

        const type = this.state.triggerType;
        const cfg = this.state.typeConfig[type];

        if (type === 'osc') {
            const host = (cfg.host || '').trim();
            if (!this.isValidHost(host)) {
                showCatFeedback(window.localesData?.alerts?.invalid_osc_ip || "IP o Host OSC inválido. Debe ser una dirección IP válida (ej. 192.168.0.28) o localhost", "error");
                return;
            }
            if (isNaN(cfg.port) || cfg.port < 1 || cfg.port > 65535) {
                showCatFeedback(window.localesData?.alerts?.invalid_osc_port || "Puerto OSC inválido. Debe estar entre 1 y 65535", "error");
                return;
            }
        } else if (type === 'sacn') {
            if (cfg.mode === 'unicast') {
                const dest = (cfg.destinationIp || '').trim();
                if (!this.isValidHost(dest)) {
                    showCatFeedback(window.localesData?.alerts?.invalid_sacn_ip || "IP de Destino sACN inválida para modo Unicast.", "error");
                    return;
                }
            }
            if (isNaN(cfg.universe) || cfg.universe < 1 || cfg.universe > 63999) {
                showCatFeedback(window.localesData?.alerts?.invalid_sacn_universe || "Universo sACN inválido (1-63999)", "error");
                return;
            }
            if (isNaN(cfg.priority) || cfg.priority < 0 || cfg.priority > 200) {
                showCatFeedback(window.localesData?.alerts?.invalid_sacn_priority || "Prioridad sACN inválida (0-200)", "error");
                return;
            }
        }

        if (this.state.keyframes.length === 0) { showCatFeedback(window.localesData?.alerts?.at_least_one_keyframe || "Debe haber al menos un keyframe", "error"); return; }

        const name = this.dom.get('triggers', 'triggerName').value;
        if (!name) { showCatFeedback(window.localesData?.alerts?.trigger_name_required || "Ingrese un nombre para el trigger", "error"); return; }

        const triggerId = this.state.currentTriggerId || this._generateId();
        const triggerData = {
            id: triggerId,
            name,
            type: this.state.triggerType,
            keyframes: this.state.keyframes.map(k => ({ ...k })),
            triggerOn: this.dom.get('triggers', 'triggerOnSelect').value,
            keyword: this.dom.get('triggers', 'triggerOnSelect').value === 'keyword' ? this.dom.get('triggers', 'keywordInput').value.trim() : undefined
        };

        triggerData[this.state.triggerType] = { ...this.state.typeConfig[this.state.triggerType] };

        const saveBtn = this.dom.get('triggers', 'saveBtn');
        if (saveBtn) {
            saveBtn.disabled = true;
            this.renderSaveTriggerButtonLabel(window.localesData?.alerts?.saving_trigger || 'Guardando...');
        }

        this.safeEmit('save-trigger', { trigger: triggerData }, (res) => {
            if (saveBtn) {
                saveBtn.disabled = false;
                this.renderSaveTriggerButtonLabel();
            }
            if (res && res.success) {
                setTriggerEnabled(triggerId, true);
                this.safeEmit('sync-triggers-state', { enabledTriggerIds: getEnabledTriggerIds() });
                this.stop();
                this.closeTriggerForm();
                this.renderTriggersList();
                const successMsg = (window.localesData?.alerts?.trigger_saved || 'Trigger "%name%" guardado ✓').replace('%name%', name);
                showCatFeedback(successMsg, 'success');
            } else {
                showCatFeedback(res?.error || (window.localesData?.alerts?.error_saving_trigger || 'Error al guardar trigger'), 'error');
            }
        });
    }

    resetEditor() {
        const triggersModal = this.dom.get('triggers', 'modal');
        const editorForm = this.dom.get('triggers', 'editorForm');
        const addNewBtn = this.dom.get('triggers', 'addNewBtn');

        // Abrir el modal principal si estuviera oculto
        if (triggersModal) {
            triggersModal.classList.remove('hidden');
            const settingsModal = document.getElementById('settingsModal');
            if (settingsModal) settingsModal.classList.add('hidden');
            document.body.classList.add('modal-active');
            window.openedFromSettings = true;
        }

        if (editorForm) editorForm.style.display = 'block';
        if (addNewBtn) addNewBtn.style.display = 'none';

        this.state.currentTriggerId = this._generateId();
        this.dom.get('triggers', 'triggerName').value = 'Nuevo Trigger';
        this.state.triggerType = 'osc';

        document.querySelectorAll('.type-btn').forEach(btn => btn.classList.toggle('active', btn.getAttribute('data-type') === 'osc'));
        this.state.keyframes = [
            { time: 0, value: 0, easing: 'linear', hold: 0, name: 'Inicio' },
            { time: 500, value: 1, easing: 'easeOutCubic', hold: 0, name: 'Pico' }
        ];
        this.state.globalDurationSec = 3.0;
        this.dom.get('triggers', 'globalDurationSec').value = '3.0';
        this.dom.get('triggers', 'triggerOnSelect').value = 'any_message';
        this.dom.get('triggers', 'keywordInput').value = '';

        this.updateActivationUI();
        this.renderTypeFields();
        this.recalcMaxTime();
        this.updateRangeFromType();

        // ✅ FIX v59.22: Asegurar visibilidad de la gráfica al añadir primer trigger
        this._updateCanvasSize();
        this.draw();
    }

    closeTriggerForm() {
        const modal = this.dom.get('triggers', 'modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-active');
            const settingsModal = document.getElementById('settingsModal');
            if (window.openedFromSettings && settingsModal) {
                settingsModal.classList.add('no-fade');
                settingsModal.classList.remove('hidden');
                document.body.classList.add('modal-active');
                window.openedFromSettings = false;
            }
        }
        this.stop();

        // [v60.Elite] NO detener captura SMPTE al cerrar, permitir escucha en segundo plano

        const editorFormOut = document.getElementById('editorFormOut');
        if (editorFormOut) editorFormOut.style.display = 'none';
        const editorFormIn = document.getElementById('editorFormIn');
        if (editorFormIn) editorFormIn.style.display = 'none';
        this.dom.get('triggers', 'addNewBtn').style.display = 'block';
    }

    // ────────────────────────────────────
    // List Rendering
    // ────────────────────────────────────

    renderTriggersList() {
        const container = this.dom.get('triggers', 'triggersList');
        if (!container) return;

        // [v60.Elite] Garantizar visibilidad del botón de añadir al refrescar la lista
        // salvo cuando el usuario tenga un formulario de edición abierto en ese instante
        const addNewBtn = this.dom.get('triggers', 'addNewBtn');
        if (addNewBtn) addNewBtn.style.display = 'inline-flex';

        container.innerHTML = '';
        const ICONS = this._getIcons();

        // [v60] Filtrar por pestaña activa
        const allTriggers = getMergedTriggers();
        const triggers = allTriggers.filter(t => (t.direction || 'OUT') === this.state.currentTab);

        const countSpan = document.getElementById('lblTriggersGuardados');
        const triggersLabel = window.localesData?.alerts?.triggers_saved || 'Triggers guardados';
        if (countSpan) {
            // Preservar foco y posición del cursor si el usuario estaba escribiendo en el buscador
            const prevSearch = countSpan.querySelector('.trigger-search-input');
            const hadSearchFocus = prevSearch && document.activeElement === prevSearch;
            const prevSelStart = hadSearchFocus ? prevSearch.selectionStart : null;
            const prevSelEnd = hadSearchFocus ? prevSearch.selectionEnd : null;

            countSpan.className = 'triggers-header-inline';
            // [v60.Elite] Calcular estado del Toggle Maestro
            const anyEnabled = triggers.some(t => isTriggerEnabled(t.id));

            const currentQuery = (this.state.currentTab === 'IN' ? this.state.searchQueryIn : this.state.searchQueryOut) || '';

            countSpan.innerHTML = `
                <div class="bulk-actions-mini-toggles">
                    <div class="master-toggle-flat ${anyEnabled ? 'is-on' : ''}" title="Alternar todos">
                        <div class="toggle-handle"></div>
                        <span class="toggle-label on">ON</span>
                        <span class="toggle-label off">OFF</span>
                    </div>
                </div>
                <div class="trigger-search-container" style="position: relative; flex: 1; margin: 0 12px; display: flex; align-items: center;">
                    <div style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); opacity: 0.6; pointer-events: none; display: flex; align-items: center;">
                        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                    <input type="text" class="trigger-search-input" value="${(currentQuery || '').replace(/"/g, '&quot;')}" placeholder="${window.localesData?.triggers_v60?.search_placeholder || 'Buscar trigger...'}" style="width: 100%; height: 26px; padding: 4px 20px 4px 24px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size: 11px; text-align: left !important; outline: none; transition: border-color 0.2s;">
                    <button class="btn-clear-trigger-search" style="position: absolute; right: 6px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; border-radius: 50%; background: var(--item-bg-hover); border: 1px solid var(--border-color); padding: 0 !important; margin: 0 !important; display: ${currentQuery.length > 0 ? 'flex' : 'none'}; align-items: center; justify-content: center; color: var(--text-secondary); cursor: pointer; box-shadow: none !important;">
                        <svg viewBox="0 0 24 24" width="8" height="8" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <svg class="btn-open-triggers-folder-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" 
                    stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-blue); flex-shrink: 0; margin-left: 4px; cursor: pointer;">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <span class="triggers-count-text" style="margin-left: 4px; cursor: pointer;">${triggersLabel} (<span class="visible-triggers-count">${triggers.length}</span>)</span>
            `;

            // [v60.Elite] Abrir carpeta física de triggers al hacer clic en "Triggers guardados (Nº)" o su icono
            const folderIcon = countSpan.querySelector('.btn-open-triggers-folder-icon');
            const folderText = countSpan.querySelector('.triggers-count-text');
            const handleOpenTriggersFolder = (e) => {
                e.stopPropagation();
                this.safeEmit('open-triggers-folder');
            };
            if (folderIcon) folderIcon.onclick = handleOpenTriggersFolder;
            if (folderText) folderText.onclick = handleOpenTriggersFolder;

            // Lógica de Alternancia Masiva
            const masterToggle = countSpan.querySelector('.master-toggle-flat');
            if (masterToggle) {
                masterToggle.onclick = (e) => {
                    e.stopPropagation();
                    const nextState = !anyEnabled; // Si había alguno activo, apagamos todo. Si no, encendemos todo.
                    triggers.forEach(t => setTriggerEnabled(t.id, nextState));
                    this.safeEmit('sync-triggers-state', { enabledTriggerIds: getEnabledTriggerIds() });
                    this.renderTriggersList();
                };
            }

            // Lógica de Búsqueda
            const searchInput = countSpan.querySelector('.trigger-search-input');
            const clearBtn = countSpan.querySelector('.btn-clear-trigger-search');
            const visibleCountSpan = countSpan.querySelector('.visible-triggers-count');

            if (searchInput && hadSearchFocus) {
                searchInput.focus();
                try {
                    if (prevSelStart !== null && prevSelEnd !== null) {
                        searchInput.setSelectionRange(prevSelStart, prevSelEnd);
                    }
                } catch (_) { }
            }

            if (searchInput) {
                searchInput.onfocus = () => {
                    searchInput.style.borderColor = 'rgba(123, 104, 238, 0.6)';
                };
                searchInput.onblur = () => {
                    searchInput.style.borderColor = 'rgba(123, 104, 238, 0.25)';
                };

                const performSearchFilter = () => {
                    const query = searchInput.value.toLowerCase().trim();
                    if (this.state.currentTab === 'IN') {
                        this.state.searchQueryIn = query;
                    } else {
                        this.state.searchQueryOut = query;
                    }

                    if (clearBtn) {
                        clearBtn.style.display = query.length > 0 ? 'flex' : 'none';
                    }

                    const items = container.querySelectorAll('.trigger-item');
                    let visibleCount = 0;
                    items.forEach(item => {
                        const nameText = item.querySelector('.trigger-name')?.textContent || '';
                        const badgeText = item.querySelector('.trigger-badge')?.textContent || '';
                        const extraSearch = item.getAttribute('data-search-tc') || '';
                        const matches = nameText.toLowerCase().includes(query) || badgeText.toLowerCase().includes(query) || extraSearch.toLowerCase().includes(query);
                        if (matches) {
                            item.style.display = '';
                            visibleCount++;
                        } else {
                            item.style.display = 'none';
                        }
                    });

                    if (visibleCountSpan) {
                        visibleCountSpan.textContent = visibleCount;
                    }
                };

                searchInput.oninput = performSearchFilter;

                if (clearBtn) {
                    clearBtn.onclick = () => {
                        searchInput.value = '';
                        performSearchFilter();
                        searchInput.focus();
                    };
                }
            }
        }

        triggers.forEach((tr, idx) => {
            const isDirectionIn = (this.state.currentTab === 'IN');
            const claim = (window.activeClaims && window.activeClaims[tr.id]);
            const socketId = window.socket ? window.socket.id : null;
            const isClaimedByOther = isDirectionIn && claim && (!socketId || !claim.socketIds.includes(socketId));

            const item = document.createElement('div');

            // [v60.Elite] Si está reclamado por otro, aplicamos opacidad reducida y clase especial
            let itemClasses = 'trigger-item';
            const isTrActive = isClaimedByOther ? true : isTriggerEnabled(tr.id);

            if (isClaimedByOther) {
                itemClasses += ' trigger-claimed-by-other';
            } else if (!isTrActive) {
                itemClasses += ' disabled';
            }
            item.className = itemClasses;

            const typeLower = (tr.type || '').toLowerCase();
            const badgeIcon = typeLower === 'midi' ? ICONS.midi : (typeLower === 'smpte' ? ICONS.clock : (typeLower === 'sacn' ? ICONS.sacn : ICONS.osc));
            const detail = this._getTriggerDetail(tr);

            // [v60.Elite] Determinar origen (IN) o condición (OUT) con metadatos extendidos
            let triggerCond = '';
            if (this.state.currentTab === 'OUT') {
                triggerCond = tr.triggerOn === 'keyword' ? `${ICONS.keyword} "${tr.keyword}"` : `${ICONS.any} Any`;
            } else {
                let source = '---';
                let sourceTitle = '';
                if (typeLower === 'smpte') {
                    const ranges = this._normalizeSmpteRanges(tr.external?.smpte);
                    if (ranges.length > 0) {
                        const first = ranges[0];
                        const extraCount = ranges.length - 1;
                        const extraBadge = extraCount > 0 ? `<span class="trigger-tc-multi-badge">+${extraCount}</span>` : '';
                        source = `${first.start} ➜ ${first.end}${extraBadge}`;
                        sourceTitle = ranges.map((r, i) => `#${i + 1}: ${r.start} ➜ ${r.end}`).join(' | ');
                        item.setAttribute('data-search-tc', ranges.map(r => `${r.start} ${r.end}`).join(' '));
                    } else {
                        const s = tr.external?.smpte?.timecodeStart || tr.external?.smpte?.timecode || '00:00:00:00';
                        const e = tr.external?.smpte?.timecodeEnd || s;
                        source = `${s} ➜ ${e}`;
                    }
                } else if (typeLower === 'midi') {
                    const m = tr.external?.midi || {};
                    source = `Ch:${m.channel || 1} | ${m.type === 'cc' ? 'CC' : 'Note'}:${m.note || 60}`;
                } else if (typeLower === 'osc') {
                    source = tr.external?.osc?.address || '/trigger';
                }
                const titleAttr = sourceTitle ? ` title="${sourceTitle.replace(/"/g, '&quot;')}"` : '';
                triggerCond = `<span class="trigger-direction-tag tag-in">IN</span> <span class="trigger-source-val"${titleAttr}>${source}</span>`;
            }

            // [v60.Elite] Validación de Hardware en tiempo real
            let hwWarning = '';
            const availableAudio = window._audioDevices || [];
            const availableMidi = window._midiOutputs || [];

            if (typeLower === 'smpte') {
                const savedDev = localStorage.getItem('talkme_smpte_device');
                if (savedDev && savedDev !== 'default' && !availableAudio.find(d => d.deviceId === savedDev)) {
                    hwWarning = '';
                }
            } else if (typeLower === 'midi') {
                const midiId = tr.external?.midi?.deviceId;
                if (midiId && midiId !== 'default' && !availableMidi.find(o => o.id === midiId)) {
                    hwWarning = '';
                }
            }

            const ownerBadge = isClaimedByOther ? `<span class="trigger-owner-badge">[${claim.owner}]</span>` : '';
            const deleteBtnHtml = isClaimedByOther ? '' : `<button class="trigger-btn-delete">${ICONS.del}</button>`;

            item.innerHTML = `
                <span class="trigger-toggle ${isTrActive ? 'tgl-on' : 'tgl-off'}">${isTrActive ? 'ON' : 'OFF'}</span>
                <div class="trigger-info">
                    <div class="trigger-name">${tr.name}${ownerBadge}${hwWarning} <span style="font-size:10px; color:var(--text-secondary); opacity:0.8; margin-left:6px;">${triggerCond}</span></div>
                    <div class="trigger-badge-row">
                        <span class="trigger-badge ${tr.type}">${badgeIcon} ${typeLower === 'smpte' ? 'Time Code' : tr.type.toUpperCase()}</span>
                        <span class="trigger-detail">${detail}</span>
                    </div>
                </div>
                <div class="trigger-actions">
                    ${deleteBtnHtml}
                </div>
            `;

            item.onclick = (e) => {
                if (isClaimedByOther) return;
                if (e.target.closest('.trigger-toggle') || e.target.closest('.trigger-btn-delete')) return;

                // [v60] Fix Quirúrgico: Buscar el índice real en la lista completa para que openTriggerForm cargue el correcto
                const realIdx = allTriggers.indexOf(tr);
                this.openTriggerForm(realIdx);
            };

            item.querySelector('.trigger-toggle').onclick = (e) => {
                e.stopPropagation();
                if (isClaimedByOther) return;
                const newState = !isTriggerEnabled(tr.id);
                setTriggerEnabled(tr.id, newState);
                this.safeEmit('sync-triggers-state', { enabledTriggerIds: getEnabledTriggerIds() });
                this.renderTriggersList();
            };

            if (!isClaimedByOther) {
                item.querySelector('.trigger-btn-delete').onclick = (e) => {
                    e.stopPropagation();
                    if (!confirm(`¿Eliminar "${tr.name}"?`)) return;
                    this.safeEmit('delete-trigger', { id: tr.id }, (res) => {
                        if (res?.success) {
                            if (triggerWorker) triggerWorker.postMessage({ type: 'stop-trigger', payload: { triggerId: tr.id } });
                            this.renderTriggersList();
                        } else showCatFeedback('Error al eliminar', 'error');
                    });
                };
            }
            container.appendChild(item);
        });

        // Aplicar filtro de búsqueda inicial si existe
        if (countSpan) {
            const searchInput = countSpan.querySelector('.trigger-search-input');
            const visibleCountSpan = countSpan.querySelector('.visible-triggers-count');
            if (searchInput) {
                const query = searchInput.value.toLowerCase().trim();
                if (query) {
                    const items = container.querySelectorAll('.trigger-item');
                    let visibleCount = 0;
                    items.forEach(item => {
                        const nameText = item.querySelector('.trigger-name')?.textContent || '';
                        const badgeText = item.querySelector('.trigger-badge')?.textContent || '';
                        const extraSearch = item.getAttribute('data-search-tc') || '';
                        const matches = nameText.toLowerCase().includes(query) || badgeText.toLowerCase().includes(query) || extraSearch.toLowerCase().includes(query);
                        if (matches) {
                            item.style.display = '';
                            visibleCount++;
                        } else {
                            item.style.display = 'none';
                        }
                    });
                    if (visibleCountSpan) {
                        visibleCountSpan.textContent = visibleCount;
                    }
                }
            }
        }

    }

    // ────────────────────────────────────
    // Helpers
    // ────────────────────────────────────

    _getIcons() {
        return {
            edit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>',
            del: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
            midi: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="15"></line><line x1="15" y1="3" x2="15" y2="15"></line></svg>',
            osc: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>',
            sacn: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
            keyword: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
            any: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:2px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
            clock: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>'
        };
    }

    _getTriggerDetail(tr) {
        if (!tr) return '';
        const type = (tr.type || '').toLowerCase();
        const ext = tr.external || {};

        if (type === 'osc') {
            const osc = ext.osc || {};
            return `${osc.host || 'localhost'}:${osc.port || 9000}${osc.address || ''}`;
        }
        if (type === 'midi') {
            const midi = ext.midi || {};
            const devName = midi.deviceId === 'default' ? 'MIDI' : (midi.deviceId || 'MIDI');
            return `${devName} | Vel:${midi.velocity || 127}`;
        }
        if (type === 'smpte') {
            const smpte = ext.smpte || {};
            const savedDevLabel = localStorage.getItem('talkme_smpte_label') || 'Audio';
            return `${savedDevLabel} | Ch:${smpte.audioChannel || 1} | LTC`;
        }
        if (type === 'sacn') {
            const sacn = ext.sacn || {};
            return `Univ:${sacn.universe || 1} | ${sacn.mode || 'multicast'}`;
        }
        return '';
    }

    signalTriggerFire() {
        // Feedback visual: Usamos la clase original definida en styles.css para paridad total
        const indicator = this.canvas?.closest('.modal-content')?.querySelector('.point-indicator');
        if (indicator) {
            indicator.classList.remove('trigger-fired');
            void indicator.offsetWidth; // Trigger reflow
            indicator.classList.add('trigger-fired');
        }

        const wrapper = this.canvas?.closest('.canvas-wrapper');
        if (wrapper) {
            wrapper.style.transition = 'none';
            wrapper.style.borderColor = 'color-mix(in srgb, var(--accent-primary) 80%, transparent)';
            wrapper.style.boxShadow = 'inset 0 0 20px color-mix(in srgb, var(--accent-primary) 30%, transparent)';

            setTimeout(() => {
                wrapper.style.transition = 'all 0.6s ease';
                wrapper.style.borderColor = '';
                wrapper.style.boxShadow = '';
            }, 100);
        }
    }

    _generateId() {
        return 'tr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // ────────────────────────────────────
    // [v60.Elite] Motor de Telemetría Fluida
    // ────────────────────────────────────

    _updateSmpteDisplay(data) {
        const clock = document.getElementById('smpteClockDisplay');
        if (clock && data && data.timecode) {
            if (!this._sanitizeTimecode(data.timecode)) {
                clock.innerText = data.timecode;
                return;
            }
            const fps = data.fps || 30;
            const incomingSecs = this._tcToSecondsLocal(data.timecode, fps);
            const lastSecs = this._lastSmpteTotalSeconds || 0;
            const now = Date.now();
            const timeSinceLastUpdate = now - (this._lastSmpteUpdate || 0);

            // [v60.Elite] PROTECCIÓN ANTI-JITTER (Blindaje Murphy #13):
            // Solo descartamos paquetes levemente desordenados (< 0.25s hacia atrás en < 150ms).
            // Cualquier Rewind real del DAW actualiza el reloj y el Flywheel inmediatamente.
            if (incomingSecs < lastSecs && (lastSecs - incomingSecs) < 0.25 && timeSinceLastUpdate < 150) {
                return;
            }
            this._lastSmpteTotalSeconds = incomingSecs;

            clock.innerText = data.timecode;
            this._currentSmpteFps = fps;

            const parts = data.timecode.split(/[:;]/).map(n => parseInt(n, 10) || 0);
            // [v60.Elite] SINCRONIZACIÓN ATÓMICA: Actualizar referencias para el Flywheel
            this._lastSmpteUpdate = now;
            this._currentSmpteData = {
                hours: typeof data.hours === 'number' ? data.hours : parts[0],
                minutes: typeof data.minutes === 'number' ? data.minutes : parts[1],
                seconds: typeof data.seconds === 'number' ? data.seconds : parts[2],
                frames: typeof data.frames === 'number' ? data.frames : parts[3]
            };
        }
    }

    /**
     * Ciclo de animación local para mantener el reloj fluido entre paquetes del servidor
     */
    _startSmpteFlywheel() {
        if (this._flywheelActive) return;
        this._flywheelActive = true;

        const tick = () => {
            if (!this._flywheelActive) return;

            const now = Date.now();
            const elapsed = now - (this._lastSmpteUpdate || 0);

            // Si el editor está abierto y tenemos datos recientes (< 500ms)
            // Solo predecimos si ha pasado más de un frame
            const clock = document.getElementById('smpteClockDisplay');
            const fps = this._currentSmpteFps || 30;
            const frameTime = 1000 / fps;

            if (clock && this._currentSmpteData && elapsed < 500 && elapsed > frameTime) {
                // Predecir el siguiente frame basado en el tiempo transcurrido y FPS real
                const framesToAdd = Math.floor(elapsed / frameTime);
                if (framesToAdd > 0) {
                    const predicted = this._predictSmpte(this._currentSmpteData, framesToAdd, fps);
                    clock.innerText = predicted;
                }
            }

            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    _predictSmpte(data, framesToAdd, fps = 30) {
        let f = data.frames + framesToAdd;
        let s = data.seconds + Math.floor(f / fps);
        let m = data.minutes + Math.floor(s / 60);
        let h = data.hours + Math.floor(m / 60);

        f %= fps;
        s %= 60;
        m %= 60;
        h %= 24;

        const pad = (n) => n.toString().padStart(2, '0');
        return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
    }

    /**
     * [v60.Elite] Auto-Ignición: Arranca el Timecode automáticamente si hay hardware configurado
     */
    async autoIgniteSmpte() {
        if (!this.smpteCapture || this.smpteCapture.isActive) return;

        const savedLabel = localStorage.getItem('talkme_smpte_label');
        const savedChan = parseInt(localStorage.getItem('talkme_smpte_channel')) || 1;
        let targetId = localStorage.getItem('talkme_smpte_device');

        // Intento de Match por Etiqueta (Soberanía de Nombre)
        if (savedLabel && window.lastAudioDevices) {
            const match = window.lastAudioDevices.find(d => d.label === savedLabel);
            if (match) {
                targetId = match.deviceId;
                console.log(`🚀 [SMPTE] Auto-Ignición: Match encontrado para '${savedLabel}'`);
            }
        }

        if (targetId) {
            console.log(`⏱️ [SMPTE] Iniciando captura automática en canal ${savedChan}...`);
            this.smpteCapture.start(targetId, savedChan - 1);
        }
    }
}

export { TriggersModule };
