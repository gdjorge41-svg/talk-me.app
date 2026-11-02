const osc = require('osc');
const { EventEmitter } = require('events');

/**
 * 📡 OscHandler - Motor de escucha UDP para Triggers OSC IN
 */
class OscHandler extends EventEmitter {
    constructor() {
        super();
        this.udpPort = null;
        this.currentPort = null;
    }

    /**
     * Inicia el servidor UDP para escucha OSC
     * @param {number} port 
     */
    start(port = 8000) {
        // Si ya está escuchando en el mismo puerto, no hacemos nada
        if (this.udpPort && this.currentPort === port) return;
        
        // Si el puerto cambió, cerramos el anterior
        if (this.udpPort) this.stop();
        
        try {
            this.udpPort = new osc.UDPPort({
                localAddress: "0.0.0.0",
                localPort: port,
                metadata: true
            });

            this.udpPort.on("message", (oscMsg) => {
                // Log quirúrgico de entrada
                // console.log(`📡 [OSC-IN] Recibido: ${oscMsg.address}`);
                
                this.emit('trigger', {
                    type: 'OSC',
                    address: oscMsg.address,
                    args: oscMsg.args
                });
            });

            this.udpPort.on("error", (err) => {
                console.error("❌ [OSC-IN] Error UDP:", err.message);
            });

            this.udpPort.open();
            this.currentPort = port;
            console.log(`📡 [OSC-IN] Servidor UDP abierto en puerto ${port}`);
        } catch (e) {
            console.error(`❌ [OSC-IN] Fallo al abrir puerto ${port}:`, e.message);
        }
    }

    /**
     * Detiene la escucha y libera el puerto
     */
    stop() {
        if (this.udpPort) {
            try {
                this.udpPort.close();
                console.log(`📡 [OSC-IN] Servidor UDP en puerto ${this.currentPort} cerrado.`);
            } catch (e) {}
            this.udpPort = null;
            this.currentPort = null;
        }
    }
}

module.exports = new OscHandler();
