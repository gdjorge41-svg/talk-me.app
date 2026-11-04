// TimelineEditor: componente reutilizable para edición de keyframes (curvas, puntos, drag, lista)
// Permite integración idéntica en triggers y alertas
// Uso: new TimelineEditor({ canvas, keyframes, duration, onChange, type, colorMode })

export class TimelineEditor {
    constructor({ canvas, keyframes = [], duration = 1000, onChange = null, type = 'value', colorMode = false }) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.keyframes = keyframes;
        this.duration = duration;
        this.onChange = onChange;
        this.type = type;
        this.colorMode = colorMode; // Si true, keyframes usan {time, color}
        this.selectedIdx = -1;
        this.dragging = false;
        this.PAD_X = 14;
        this.PAD_Y = 18;
        this._bindEvents();
        this.render();
    }

    _bindEvents() {
        this.canvas.addEventListener('mousedown', this._onDown.bind(this));
        this.canvas.addEventListener('mousemove', this._onMove.bind(this));
        this.canvas.addEventListener('mouseup', this._onUp.bind(this));
        this.canvas.addEventListener('mouseleave', this._onUp.bind(this));
        this.canvas.addEventListener('dblclick', this._onDblClick.bind(this));
    }

    _onDown(e) {
        const {x, y} = this._getPos(e);
        const idx = this._hitTest(x, y);
        if (idx >= 0) {
            this.selectedIdx = idx;
            this.dragging = true;
        } else {
            this.selectedIdx = -1;
        }
        this.render();
    }
    _onMove(e) {
        if (!this.dragging || this.selectedIdx < 0) return;
        const {x, y} = this._getPos(e);
        const t = Math.max(0, Math.min(this.duration, (x - this.PAD_X) / (this.canvas.width - 2*this.PAD_X) * this.duration));
        if (this.colorMode) {
            // Solo mover tiempo
            this.keyframes[this.selectedIdx].time = Math.round(t);
        } else {
            // Mover tiempo y valor
            const v = 1 - ((y - this.PAD_Y) / (this.canvas.height - 2*this.PAD_Y));
            this.keyframes[this.selectedIdx].time = Math.round(t);
            this.keyframes[this.selectedIdx].value = Math.max(0, Math.min(1, v));
        }
        if (this.onChange) this.onChange(this.keyframes);
        this.render();
    }
    _onUp(e) {
        this.dragging = false;
    }
    _onDblClick(e) {
        const {x, y} = this._getPos(e);
        const t = Math.max(0, Math.min(this.duration, (x - this.PAD_X) / (this.canvas.width - 2*this.PAD_X) * this.duration));
        if (this.colorMode) {
            // Añadir keyframe de color
            this.keyframes.push({ time: Math.round(t), color: '#ffffff', easing: 'linear' });
        } else {
            const v = 1 - ((y - this.PAD_Y) / (this.canvas.height - 2*this.PAD_Y));
            this.keyframes.push({ time: Math.round(t), value: Math.max(0, Math.min(1, v)), easing: 'linear' });
        }
        if (this.onChange) this.onChange(this.keyframes);
        this.render();
    }
    _getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    _hitTest(x, y) {
        for (let i = 0; i < this.keyframes.length; i++) {
            const kf = this.keyframes[i];
            const tNorm = kf.time / this.duration;
            const px = this.PAD_X + tNorm * (this.canvas.width - 2*this.PAD_X);
            let py = this.canvas.height/2;
            if (!this.colorMode) py = this.PAD_Y + (1 - (kf.value || 0)) * (this.canvas.height - 2*this.PAD_Y);
            if (Math.abs(x - px) < 10 && Math.abs(y - py) < 10) return i;
        }
        return -1;
    }
    render() {
        const ctx = this.ctx;
        ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        // Fondo
        ctx.fillStyle = '#18182a';
        ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        // Grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let x=0;x<=10;x++) {
            const xx = this.PAD_X + x/10*(this.canvas.width-2*this.PAD_X);
            ctx.beginPath(); ctx.moveTo(xx,this.PAD_Y); ctx.lineTo(xx,this.canvas.height-this.PAD_Y); ctx.stroke();
        }
        // Curva (solo opacidad)
        if (!this.colorMode && this.keyframes.length > 1) {
            ctx.strokeStyle = '#ff914d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i=0;i<this.keyframes.length;i++) {
                const kf = this.keyframes[i];
                const tNorm = kf.time / this.duration;
                const x = this.PAD_X + tNorm * (this.canvas.width - 2*this.PAD_X);
                const y = this.PAD_Y + (1 - (kf.value || 0)) * (this.canvas.height - 2*this.PAD_Y);
                if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
            }
            ctx.stroke();
        }
        // Keyframes
        for (let i=0;i<this.keyframes.length;i++) {
            const kf = this.keyframes[i];
            const tNorm = kf.time / this.duration;
            const x = this.PAD_X + tNorm * (this.canvas.width - 2*this.PAD_X);
            let y = this.canvas.height/2;
            if (!this.colorMode) y = this.PAD_Y + (1 - (kf.value || 0)) * (this.canvas.height - 2*this.PAD_Y);
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI*2);
            ctx.fillStyle = (i === this.selectedIdx) ? '#ff914d' : (this.colorMode ? (kf.color || '#fff') : '#fff');
            ctx.globalAlpha = 1.0;
            ctx.fill();
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}
