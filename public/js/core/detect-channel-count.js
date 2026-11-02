// public/js/core/detect-channel-count.js
/**
 * Detects the true number of audio channels for a given MediaStream.
 * Chrome on Windows reports a false max=2 via getCapabilities();
 * This helper cross‑checks settings, capabilities and the WebAudio API.
 * @param {MediaStream} stream
 * @returns {Promise<number>} The detected channel count (>=1)
 */
export async function detectChannelCount(stream) {
    const track = stream.getAudioTracks()[0];
    if (!track) return 1;
    const settings = (track.getSettings && track.getSettings()) || {};
    const caps = (track.getCapabilities && track.getCapabilities()) || {};

    const capsMax = caps.channelCount && (caps.channelCount.max || caps.channelCount) || 0;
    let count = Math.max(settings.channelCount || 1, capsMax);

    // Cross‑check with Web Audio API (Chrome bug mitigation)
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const source = ctx.createMediaStreamSource(stream);
        if (source.channelCount && source.channelCount > count) {
            count = source.channelCount;
        }
        source.disconnect();
        await ctx.close();
    } catch (e) {
        // Silently ignore – fallback already applied
    }
    return count;
}
