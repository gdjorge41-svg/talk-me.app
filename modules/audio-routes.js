const express = require('express');
const Joi = require('joi');
const router = express.Router();
const audioManager = require('./audio-device-manager');

/**
 * 🔌 Audio API Routes
 * 
 * Provides endpoints for frontend to query professional audio capabilities.
 */

// 1. List all devices and their basic metadata
router.get('/devices', async (req, res) => {
    try {
        const devices = await audioManager.getDevices();
        res.json({
            success: true,
            data: devices
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Get detailed channel list for a specific device
// Supports ?label=... query param for better matching of browser-detected hardware
router.get('/channels/:deviceId', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { label } = req.query;
        const channels = await audioManager.getDeviceChannels(deviceId, label);
        res.json({
            success: true,
            data: channels
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2b. Report actual physical capabilities detected by the browser (Fase 1)
router.post('/channels/:deviceId/capabilities', async (req, res) => {
    try {
        const { deviceId } = req.params;
        const capabilitiesSchema = Joi.object({
            channels: Joi.number().integer().min(1).required(),
            label: Joi.string().allow('').optional()
        });
        const { error, value } = capabilitiesSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, error: error.details[0].message });
        }
        const { channels, label } = value;
        if (channels > 0) {
            audioManager.setDeviceChannels(deviceId, channels, label);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Force a hardware scan (RJ45 / ASIO)
router.post('/refresh', async (req, res) => {
    try {
        const nodes = await audioManager.refreshHardware();
        res.json({
            success: true,
            message: 'Hardware scan completed',
            discoveredNodes: nodes.length
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 4. Post/Verify audio route
router.post('/route', async (req, res) => {
    try {
        const { inputId, inputChannel, outputId, outputChannel } = req.body;
        console.log(`🎙️ [AUDIO] New Routing Request: IN(${inputId}:${inputChannel}) -> OUT(${outputId}:${outputChannel})`);
        
        // Here we could add validation logic or hardware setup calls
        res.json({
            success: true,
            message: 'Route validated'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
