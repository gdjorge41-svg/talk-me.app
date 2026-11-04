/**
 * 🕒 SMPTE Capture Bridge (v60)
 * 
 * Propósito: Capturar audio LTC desde el navegador y enviarlo al servidor
 * para su decodificación en tiempo real.
 */

class SMPTECapture {
    constructor(socket = null) {
        this.socket = socket;
        this.audioContext = null;
        this.stream = null;
        this.processor = null;
        this.isActive = false;
        this.sampleRate = 44100;
        this.bufferSize = 1024; 
        this.currentChannelIndex = 0; // [v60.Elite] Trackeo de canal activo
        this.currentDeviceId = null; // [v60.Elite] Trackeo de dispositivo activo
        this.isMonitoringOnly = false; // [v60.Elite] Si es true, recibe tiempo pero NO envía audio
        this._listenersBound = false;
        
        // [v60.Elite] Blindaje Defensivo: Evitar crash si el socket no está listo
        if (this.socket) {
            this._setupSocketListeners();
        }
    }

    /**
     * Vincula un socket de forma tardía si no estaba disponible en el constructor
     */
    setSocket(socket) {
        this.socket = socket;
        this._setupSocketListeners();
    }

    _setupSocketListeners() {
        if (!this.socket || this._listenersBound) return;
        this._listenersBound = true;

        // Listener de conflicto para pasar a modo monitor
        this.socket.on('smpte-capture-conflict', (data) => {
            console.log(`⚠️ [SMPTE] Canal ocupado por otra pestaña. Entrando en Modo Monitor Pasivo.`);
            this.isMonitoringOnly = true;
        });

        this.socket.on('smpte-capture-available', (data) => {
            if (this.isActive && this.isMonitoringOnly) {
                console.log(`🚀 [SMPTE] Canal liberado. Tomando el relevo como Productor Activo.`);
                this.isMonitoringOnly = false;
            }
        });
    }

    async start(deviceId = null, channelIndex = 0) {
        if (this.isActive) await this.stop();
        
        // [v60.Elite] CASTING CRÍTICO: Asegurar que el canal sea un número para evitar fallos de ruteo
        this.currentChannelIndex = parseInt(channelIndex, 10) || 0;
        this.currentDeviceId = deviceId;
        this.isMonitoringOnly = false; // Reset al empezar
        let chanIdx = this.currentChannelIndex;

        try {
            const constraints = { 
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                } 
            };
            
            if (deviceId && deviceId !== 'default') {
                constraints.audio.deviceId = { exact: deviceId };
            }

            const requestedChannels = Math.max(2, chanIdx + 1);
            constraints.audio.channelCount = { ideal: requestedChannels };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                latencyHint: 'interactive'
            });

            // [v60.Elite] Auto-Recuperación de Contexto
            // Evita que el reloj se pare si el navegador suspende el audio al reproducir otros sonidos.
            this.audioContext.onstatechange = () => {
                if (this.audioContext && this.audioContext.state === 'suspended' && this.isActive) {
                    console.warn('⚠️ [SMPTE] AudioContext suspendido. Intentando reanudar...');
                    this.audioContext.resume();
                }
            };
            this.sampleRate = this.audioContext.sampleRate;

            // [v60.Elite] Carga del Procesador "Tanque Ágil" (AudioWorklet)
            try {
                // Cada AudioContext necesita su propia carga del módulo
                if (!this.audioContext._smpteLoaded) {
                    this.audioContext._smpteLoaded = this.audioContext.audioWorklet.addModule('/js/workers/smpte-processor.js');
                }
                await this.audioContext._smpteLoaded;

                this.smpteNode = new AudioWorkletNode(this.audioContext, 'smpte-processor');
                
                this.smpteNode.port.onmessage = (event) => {
                    if (!this.isActive || this.isMonitoringOnly) return;
                    
                    const { type, timecode, hours, minutes, seconds, frames, peak, quality } = event.data;
                    
                    if (type === 'timecode' && timecode) {
                        console.debug(`🕒 [SMPTE] Data received: ${timecode}`);
                    }
                    
                    if (type === 'telemetry') {
                        this.lastPeak = peak;
                        if (window.AudioStateManager) {
                            window.AudioStateManager.set('smptePeak', peak);
                            window.AudioStateManager.set('smpteClipping', peak > 0.95);
                        }
                    } else if (type === 'timecode') {
                        // [v60.Elite] ENVÍO ATÓMICO DE METADATOS
                        if (this.socket) {
                            this.socket.emit('smpte-sync', {
                                timecode: timecode,
                                hours: hours,
                                minutes: minutes,
                                seconds: seconds,
                                frames: frames,
                                peak: this.lastPeak || 0,
                                quality: quality || 1.0,
                                channel: this.currentChannelIndex || 0,
                                timestamp: Date.now() // Sello para compensación NTP
                            });
                        }
                    }
                };

                const source = this.audioContext.createMediaStreamSource(this.stream);
                const track = this.stream.getAudioTracks()[0];
                const settings = track ? track.getSettings() : {};
                const actualChannels = settings.channelCount || source.channelCount || 1;
                
                // [v60.Elite] Verificación de Límites de Hardware (No destructivo)
                if (chanIdx >= actualChannels) {
                    console.warn(`⚠️ [SMPTE] DESVIACIÓN DETECTADA: El canal seleccionado (${chanIdx + 1}) excede la capacidad del stream (${actualChannels} ch). El audio podría estar en silencio.`);
                }

                const splitterChannels = Math.max(actualChannels, chanIdx + 1, 2);
                const splitter = this.audioContext.createChannelSplitter(splitterChannels);
                source.connect(splitter);
                
                // Conectamos el canal seleccionado al procesador (input 0)
                splitter.connect(this.smpteNode, chanIdx, 0);

                // Forzar activación proactiva (Safari/Chrome/Firefox)
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }

                this.isActive = true;
                console.log(`🚀 [SMPTE] Tanque Ágil Activado (Local Decoding, Canal: ${chanIdx + 1})`);
                return true;

            } catch (workletErr) {
                console.error('❌ [SMPTE] Fallo al cargar AudioWorklet:', workletErr);
                // Fallback a ScriptProcessor (Opcional, pero para Talk.me v60 preferimos error limpio)
                return false;
            }

        } catch (err) {
            console.error('❌ [SMPTE] Error al acceder al dispositivo de audio:', err);
            if (window.AudioStateManager) window.AudioStateManager.set('smpteChannelError', true);
            return false;
        }
    }

    async stop() {
        if (!this.isActive) return;

        this.isActive = false;

        if (this.smpteNode) {
            this.smpteNode.disconnect();
            this.smpteNode = null;
        }

        if (this.audioContext) {
            try {
                await this.audioContext.close();
            } catch(e) {}
            this.audioContext = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        console.log('🛑 [SMPTE] Captura de audio detenida');
    }

    /**
     * [v60.Elite] Conversión de alta fidelidad para LTC
     * Se evita la ganancia destructiva para no deformar los pulsos.
     */
    _float32ToInt16(buffer) {
        let l = buffer.length;
        let buf = new Int16Array(l);
        while (l--) {
            // Normalización suave (limitación a 1.0)
            const s = Math.max(-1, Math.min(1, buffer[l]));
            buf[l] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return buf;
    }
}

export default SMPTECapture;
