const fs = require('fs');
const path = require('path');
const soundgrid = require('./soundgrid-client');

/**
 * 🎙️ AudioDeviceManager - Core manager for professional audio interfaces
 * 
 * Provides enumeration and metadata for ASIO, SoundGrid, and standard devices.
 * Integrates with node-asio if available.
 */
class AudioDeviceManager {
    constructor() {
        this.asioSupported = false;
        this.asioInstance = null;
        this.channelOverrides = new Map(); // [v60.ELITE] Mapa para capacidades reales reportadas por el frontend
        this._loadChannelOverrides();
        this._initAsio();
    }

    _initAsio() {
        try {
            // Attempt to load native ASIO bindings
            // This requires 'node-asio' to be installed and compiled
            this.asioInstance = require('node-asio');
            this.asioSupported = true;
            console.log('✅ [AUDIO] ASIO native support initialized');
        } catch (e) {
            this.asioSupported = false;
            console.warn('⚠️ [AUDIO] ASIO native support not available (using emulator/fallback)');
        }
    }

    /**
     * Force a hardware scan (mDNS / UDP / Driver probe)
     */
    async refreshHardware() {
        console.log('🔄 [AUDIO] Refreshing professional hardware list...');
        // Al sincronizar hardware, limpiamos los overrides dinámicos para forzar una nueva medición física real
        this.channelOverrides.clear();
        this._saveChannelOverrides();
        return await soundgrid.discoverNodes();
    }

    /**
     * Get list of all available devices with channel metadata
     */
    async getDevices() {
        const devices = {
            input: [],
            output: []
        };

        // 1. Enumerate ASIO Devices (if supported)
        if (this.asioSupported && this.asioInstance) {
            try {
                const asioDevices = this.asioInstance.getDevices();
                asioDevices.forEach(d => {
                    devices.input.push({
                        id: `asio:${d.name}`,
                        name: `${d.name} (ASIO)`,
                        channels: d.inputChannels || 8, // Default to 8 if not reported
                        type: 'asio'
                    });
                    devices.output.push({
                        id: `asio:${d.name}`,
                        name: `${d.name} (ASIO)`,
                        channels: d.outputChannels || 8,
                        type: 'asio'
                    });
                });
            } catch (err) {
                console.error('❌ Error enumerating ASIO devices:', err.message);
            }
        }

        // 2. SoundGrid Real Hardware / Detection
        // Ask the SoundGrid client for found nodes via RJ45
        const sgNodes = await soundgrid.discoverNodes();
        if (sgNodes.length > 0) {
            sgNodes.forEach(node => {
                devices.input.push({
                    id: `soundgrid:${node.id}`,
                    name: `${node.name}`,
                    channels: node.channels,
                    type: 'soundgrid',
                    ip: node.ip
                });
                devices.output.push({
                    id: `soundgrid:${node.id}`,
                    name: `${node.name}`,
                    channels: node.channels,
                    type: 'soundgrid',
                    ip: node.ip
                });
            });
        } else {
            // Fallback virtual entry if no hardware found yet
            devices.input.push({
                id: 'soundgrid-input',
                name: 'Waves SoundGrid (Virtual)',
                channels: 32, // User hardware capacity
                type: 'soundgrid'
            });
            devices.output.push({
                id: 'soundgrid-output',
                name: 'Waves SoundGrid (Virtual)',
                channels: 32,
                type: 'soundgrid'
            });
        }

        // 3. Virtual Talk.Me Driver
        devices.input.push({
            id: 'talkme-virtual-input',
            name: 'Talk.Me Virtual Driver',
            channels: 16,
            type: 'virtual'
        });
        devices.output.push({
            id: 'talkme-virtual-output',
            name: 'Talk.Me Virtual Driver',
            channels: 16,
            type: 'virtual'
        });

        return devices;
    }

    /**
     * Permite al frontend reportar la capacidad real detectada tras un probe físico
     */
    setDeviceChannels(deviceId, channels, label = '') {
        if (!deviceId) return;
        const count = parseInt(channels);
        this.channelOverrides.set(deviceId, count);
        if (label) {
            this.channelOverrides.set(label, count); // Cross-browser sharing
        }
        console.log(`📡 [AUDIO-HW] Capacidad actualizada dinámicamente: ${label || deviceId} -> ${count} canales`);
        this._saveChannelOverrides();    
    }

    /**
     * Get specifically the channel list for a device
     * @param {string} deviceId 
     * @param {string} deviceLabel - Optional label from frontend to help identification
     */
    async getDeviceChannels(deviceId, deviceLabel = '') {
        // 0. Prioridad absoluta: Sobrescritura dinámica del frontend (reportada tras probe físico)
        if (this.channelOverrides.has(deviceId)) {
            const count = this.channelOverrides.get(deviceId);
            console.log(`📡 [AUDIO-HW] Usando override medido físicamente para ID ${deviceId}: ${count} canales`);
            return this._buildChannelList(count);
        }
        if (deviceLabel && this.channelOverrides.has(deviceLabel)) {
            const count = this.channelOverrides.get(deviceLabel);
            console.log(`📡 [AUDIO-HW] Usando override compartido para label '${deviceLabel}': ${count} canales`);
            return this._buildChannelList(count);
        }

        const all = await this.getDevices();
        
        // 1. Intentar coincidencia exacta por ID de backend nativo (ej. "asio:..." o "soundgrid:...")
        let dev = [...all.input, ...all.output].find(d => d.id === deviceId);
        
        // 2. Si no coincide el ID (caso común de ID dinámico de Chrome), buscar coincidencia por etiqueta 
        // con hardware real activo en el backend
        if (!dev && deviceLabel) {
            // A. Buscar en nodos de red activos de SoundGrid descubiertos por RJ45
            const sgNodes = await soundgrid.discoverNodes();
            if (soundgrid.isSoundGridDevice(deviceLabel)) {
                // Solo si hay un nodo físico real descubierto en la red
                const realNode = sgNodes.find(n => n.type === 'network-node' && n.channels > 0);
                if (realNode) {
                    dev = { channels: realNode.channels };
                    console.log(`🎯 [AUDIO-HW] Waves SoundGrid real detectado en red RJ45: ${realNode.name} -> ${dev.channels} canales`);
                }
            }
            
            // B. Buscar en dispositivos nativos ASIO activos
            if (!dev && /asio/i.test(deviceLabel) && this.asioSupported && this.asioInstance) {
                try {
                    const asioDevices = this.asioInstance.getDevices();
                    const matchedAsio = asioDevices.find(d => 
                        deviceLabel.toLowerCase().includes(d.name.toLowerCase()) || 
                        d.name.toLowerCase().includes(deviceLabel.toLowerCase())
                    );
                    if (matchedAsio) {
                        dev = { channels: matchedAsio.inputChannels || 8 };
                        console.log(`🎯 [AUDIO-HW] Driver ASIO nativo activo emparejado: ${matchedAsio.name} -> ${dev.channels} canales`);
                    }
                } catch (e) {
                    console.warn('Error emparejando driver ASIO:', e);
                }
            }
        }

        // Si es un dispositivo genérico del navegador (Micrófono Realtek de portátil, etc) y no encaja en hardware nativo,
        // devolvemos [] para forzar al frontend a realizar el probe físico real con getUserMedia (y el nuevo chequeo de Web Audio).
        if (!dev) {
            console.log(`📡 [AUDIO-HW] Dispositivo WDM genérico '${deviceLabel || deviceId}'. Retornando [] para forzar probe físico.`);
            return [];
        }

        return this._buildChannelList(dev.channels);
    }

    /**
     * Genera la estructura de lista de canales
     * @private
     */
    _loadChannelOverrides() {
        this.channelOverrides = new Map();
        const baseStorage = process.env.USER_DATA_PATH 
            ? path.join(process.env.USER_DATA_PATH, 'storage') 
            : path.join(__dirname, '..', 'storage');
        try { if (!fs.existsSync(baseStorage)) fs.mkdirSync(baseStorage, { recursive: true }); } catch (_) {}
        const filePath = path.join(baseStorage, 'channelOverrides.json');
        try {
            if (fs.existsSync(filePath)) {
                const raw = fs.readFileSync(filePath, 'utf8');
                const json = JSON.parse(raw);
                for (const [k, v] of Object.entries(json)) {
                    this.channelOverrides.set(k, Number(v));
                }
                console.log('🔧 [AUDIO] Channel overrides loaded from JSON');
            }
        } catch (e) {
            console.warn('⚠️ [AUDIO] Failed to load channel overrides:', e.message);
        }
    }

    _saveChannelOverrides() {
        const baseStorage = process.env.USER_DATA_PATH 
            ? path.join(process.env.USER_DATA_PATH, 'storage') 
            : path.join(__dirname, '..', 'storage');
        try { if (!fs.existsSync(baseStorage)) fs.mkdirSync(baseStorage, { recursive: true }); } catch (_) {}
        const filePath = path.join(baseStorage, 'channelOverrides.json');
        try {
            const obj = Object.fromEntries(this.channelOverrides);
            fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf8');
            console.log('💾 [AUDIO] Channel overrides saved');
        } catch (e) {
            console.error('❌ [AUDIO] Failed to save channel overrides:', e.message);
        }
    }

    _buildChannelList(count) {
        const channels = [];
        for (let i = 1; i <= count; i++) {
            channels.push({
                index: i - 1,
                label: `Ch ${i}`
            });
        }
        return channels;
    }

}

module.exports = new AudioDeviceManager();
