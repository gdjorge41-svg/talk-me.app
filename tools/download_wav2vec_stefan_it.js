// Simple downloader for stefan-it/wav2vec2-large-xlsr-53-basque
// Requires: node (with internet) and npm install huggingface-hub@0.13.4 node-fetch@2
const fs = require('fs');
const path = require('path');
const { hf } = require('huggingface-hub');

async function download() {
  const repo = 'stefan-it/wav2vec2-large-xlsr-53-basque';
  const dest = path.join(__dirname, '..', 'storage', 'models', repo.replace('/', '--'));
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const files = [
    'config.json',
    'tokenizer.json',
    'feature_extractor.json',
    'pytorch_model.bin'
  ];

  console.log('Downloading model files to', dest);

  for (const f of files) {
    try {
      console.log('Fetching', f);
      const buffer = await hf.downloadFile({repo, path: f});
      const outPath = path.join(dest, f);
      fs.writeFileSync(outPath, buffer);
      console.log('Saved', outPath);
    } catch (e) {
      console.warn('Could not download', f, e.message || e);
    }
  }

  console.log('Done. Check files in', dest);
}

download().catch(e => { console.error(e); process.exit(1); });
