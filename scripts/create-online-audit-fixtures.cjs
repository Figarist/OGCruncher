const fs = require('node:fs');
const path = require('node:path');

const root = process.argv[2];
if (!root) throw new Error('Usage: node scripts/create-online-audit-fixtures.cjs <output-dir>');

function writeWav(filePath, { sampleRate, channels, frames, bits = 16, sample }) {
  frames = Math.floor(frames);
  const bytesPerSample = bits / 8;
  const blockAlign = channels * bytesPerSample;
  const dataBytes = frames * blockAlign;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bits, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);
  let offset = 44;
  for (let frame = 0; frame < frames; frame++) {
    for (let channel = 0; channel < channels; channel++) {
      const value = Math.max(-1, Math.min(1, sample(frame, channel)));
      if (bits === 8) {
        buffer.writeUInt8(Math.max(0, Math.min(255, Math.round(value * 127.5 + 127.5))), offset);
      } else {
        buffer.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(value * 32767))), offset);
      }
      offset += bytesPerSample;
    }
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
}

const seconds = 1;
const rate = 48000;
const frames = rate * seconds;
const sine = (hz, amplitude) => (frame) => amplitude * Math.sin(2 * Math.PI * hz * frame / rate);
const out = (name) => path.join(root, name);

writeWav(out('silence-48000-mono-16.wav'), { sampleRate: rate, channels: 1, frames, sample: () => 0 });
writeWav(out('dc-48000-mono-16.wav'), { sampleRate: rate, channels: 1, frames, sample: () => 0.25 });
writeWav(out('sine-440-48000-mono-16.wav'), { sampleRate: rate, channels: 1, frames, sample: sine(440, 0.4) });
writeWav(out('stereo-asymmetric-440-880.wav'), {
  sampleRate: rate, channels: 2, frames,
  sample: (frame, channel) => channel === 0 ? sine(440, 0.4)(frame) : sine(880, 0.07)(frame),
});
writeWav(out('impulse-22050-mono-16.wav'), {
  sampleRate: 22050, channels: 1, frames: 22050 / 4,
  sample: (frame) => frame === 0 ? 1 : 0,
});
writeWav(out('quiet-sine-8000-mono-16.wav'), {
  sampleRate: 8000, channels: 1, frames: 8000,
  sample: (frame) => 0.001 * Math.sin(2 * Math.PI * 440 * frame / 8000),
});

writeWav(out('same-a/same.wav'), { sampleRate: rate, channels: 1, frames, sample: sine(440, 0.2) });
writeWav(out('same-b/same.wav'), { sampleRate: rate, channels: 1, frames, sample: sine(880, 0.2) });
writeWav(out('unicode-áудіо-测试-かな.wav'), { sampleRate: rate, channels: 1, frames: 24000, sample: sine(330, 0.2) });
writeWav(out(`${'very-long-filename-'.repeat(12)}тест.wav`), { sampleRate: rate, channels: 1, frames: 8000, sample: sine(220, 0.2) });
fs.writeFileSync(out('empty-file.wav'), Buffer.alloc(0));
fs.writeFileSync(out('corrupt-audio.wav'), Buffer.from('not a RIFF/WAVE file\n', 'utf8'));
fs.writeFileSync(out('not-audio.txt'), Buffer.from('This is intentionally not an audio file.\n', 'utf8'));
console.log(JSON.stringify({ root, files: fs.readdirSync(root, { recursive: true }) }, null, 2));
