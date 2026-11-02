const { pipeline } = require('@tensorflow/tfjs-core');
const { load } = require('@tensorflow/tfjs-models');

// Load the Wav2Vec2 Euskera model
const loadWav2Vec2Euskera = async () => {
    try {
        console.log('Loading Wav2Vec2 Euskera model...');
        const model = await load('pcuenq/wav2vec2-large-xlsr-53-eu');
        console.log('✅ Wav2Vec2 Euskera model loaded.');
        return model;
    } catch (error) {
        console.error('❌ Error loading Wav2Vec2 Euskera model:', error);
        throw error;
    }
};

// Add Wav2Vec2 Euskera model warm-up
const warmUpWav2Vec2Euskera = async () => {
    try {
        console.log('🔄 Warming up Wav2Vec2 Euskera model...');
        await pipeline('automatic-speech-recognition', 'pcuenq/wav2vec2-large-xlsr-53-eu');
        console.log('✅ Wav2Vec2 Euskera model ready.');
    } catch (error) {
        console.error('❌ Error warming up Wav2Vec2 Euskera model:', error);
    }
};

warmUpWav2Vec2Euskera();

module.exports = loadWav2Vec2Euskera;