/**
 * OGCruncher — classic DSP and encoding worker.
 *
 * The worker receives one immutable processing snapshot per file. Encoding
 * failures are isolated by format so a good WAV is not lost because OGG failed.
 */

'use strict';

let resolveEncoderReady;
let rejectEncoderReady;
let encoderRuntimeReady = false;
const encoderReadyPromise = new Promise((resolve, reject) => {
  resolveEncoderReady = resolve;
  rejectEncoderReady = reject;
});
const encoderReadyTimeout = setTimeout(() => {
  if (!encoderRuntimeReady) rejectEncoderReady(new Error('OGG encoder initialization timed out.'));
}, 15000);

self.OggVorbisEncoderConfig = {
  TOTAL_MEMORY: 536870912,
  locateFile(path) {
    return path.endsWith('.mem')
      ? new URL('../' + path, self.location.href).href
      : path;
  },
  onRuntimeInitialized() {
    encoderRuntimeReady = true;
    clearTimeout(encoderReadyTimeout);
    resolveEncoderReady();
  },
};

let oggLoadError = null;
let mp3LoadError = null;
try {
  importScripts(new URL('../OggVorbisEncoder.min.js', self.location.href).href);
} catch (error) {
  oggLoadError = error;
  rejectEncoderReady(error);
}
try {
  importScripts(new URL('../lame.min.js', self.location.href).href);
} catch (error) {
  mp3LoadError = error;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function finiteOr(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function createSeededRandom(seed = 1) {
  let value = (Number(seed) >>> 0) || 1;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function processDSP(buf, bitDepth = 8, crushMode = true, dither = true,
                   grit = 1, noise = 0, random = Math.random) {
  const bits = Math.round(clamp(finiteOr(bitDepth, 8), 1, 16));
  const drive = clamp(finiteOr(grit, 1), 1, 10);
  const noiseLevel = clamp(finiteOr(noise, 0), 0, 0.05);
  if (!buf || !buf.length) return false;

  if (noiseLevel > 0) {
    for (let i = 0; i < buf.length; i++) buf[i] += (random() * 2 - 1) * noiseLevel;
  }
  if (crushMode) {
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i];
    const dc = sum / buf.length;
    for (let i = 0; i < buf.length; i++) buf[i] -= dc;

    for (let i = 0; i < buf.length; i++) {
      const x = clamp(buf[i], -1, 1);
      buf[i] = Math.sign(x) * Math.pow(Math.abs(x), 1.15);
    }

    const halfLevels = 1 << (bits - 1);
    const lsb = 1 / halfLevels;
    for (let i = 0; i < buf.length; i++) {
      const shapedDither = dither ? (random() - random()) * lsb : 0;
      buf[i] = Math.round((buf[i] + shapedDither) * halfLevels) / halfLevels;
    }

    let previous = 0;
    for (let i = 0; i < buf.length; i++) {
      const current = buf[i];
      buf[i] = (current + previous) * 0.5;
      previous = current;
    }
  }
  if (drive > 1) {
    const compensation = Math.tanh(drive);
    for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] * drive) / compensation;
  }

  let clipped = false;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] > 1 || buf[i] < -1) clipped = true;
    buf[i] = clamp(buf[i], -1, 1);
  }
  return clipped;
}

function normalizeChannels(channels) {
  let peak = 0;
  for (const channel of channels) {
    for (let i = 0; i < channel.length; i++) peak = Math.max(peak, Math.abs(channel[i]));
  }
  if (peak <= 1e-6 || !Number.isFinite(peak)) return;
  const scale = 1 / peak;
  for (const channel of channels) {
    for (let i = 0; i < channel.length; i++) channel[i] = clamp(channel[i] * scale, -1, 1);
  }
}

async function encodeOGG(channels, sampleRate) {
  if (oggLoadError) throw new Error(`OGG encoder unavailable: ${oggLoadError.message || oggLoadError}`);
  await encoderReadyPromise;
  if (typeof OggVorbisEncoder !== 'function') throw new Error('OGG encoder is unavailable.');
  const encoder = new OggVorbisEncoder(sampleRate, channels.length, 0.0);
  const chunkSize = 16384;
  for (let i = 0; i < channels[0].length; i += chunkSize) {
    encoder.encode(channels.map(channel => channel.subarray(i, Math.min(i + chunkSize, channels[0].length))));
  }
  return (await encoder.finish().arrayBuffer());
}

function encodeWAV(channels, sampleRate, effectBits) {
  const containerDepth = Math.round(effectBits) <= 8 ? 8 : 16;
  const numChannels = Math.max(1, channels.length);
  const numSamples = channels[0] ? channels[0].length : 0;
  const bytesPerSample = containerDepth === 8 ? 1 : 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataBytes = numSamples * blockAlign;
  const padding = dataBytes % 2;
  const fileBytes = 44 + dataBytes + padding;
  const buffer = new ArrayBuffer(fileBytes);
  const view = new DataView(buffer);
  const writeString = (offset, text) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, fileBytes - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, Math.round(sampleRate), true);
  view.setUint32(28, Math.round(sampleRate) * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, containerDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = clamp(Number((channels[ch] || channels[0])[i]) || 0, -1, 1);
      if (containerDepth === 8) {
        view.setUint8(offset, clamp(Math.round((sample + 1) * 127.5), 0, 255));
        offset += 1;
      } else {
        const value = sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff);
        view.setInt16(offset, clamp(value, -0x8000, 0x7fff), true);
        offset += 2;
      }
    }
  }
  return buffer;
}

function encodeMP3(channels, sampleRate) {
  if (mp3LoadError || typeof lamejs === 'undefined') throw new Error('MP3 encoder is unavailable.');
  const encoder = new lamejs.Mp3Encoder(channels.length, sampleRate, 128);
  const intChannels = channels.map(channel => {
    const output = new Int16Array(channel.length);
    for (let i = 0; i < channel.length; i++) {
      const sample = clamp(channel[i], -1, 1);
      output[i] = sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff);
    }
    return output;
  });
  const chunks = [];
  for (let i = 0; i < intChannels[0].length; i += 1152) {
    const left = intChannels[0].subarray(i, Math.min(i + 1152, intChannels[0].length));
    const right = intChannels.length > 1 ? intChannels[1].subarray(i, Math.min(i + 1152, intChannels[0].length)) : left;
    const chunk = channels.length === 1 ? encoder.encodeBuffer(left) : encoder.encodeBuffer(left, right);
    if (chunk.length) chunks.push(chunk);
  }
  const tail = encoder.flush();
  if (tail.length) chunks.push(tail);
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.length; }
  return output.buffer;
}

let cancelled = false;

self.onmessage = async function(event) {
  const msg = event.data || {};
  if (msg.type === 'cancel') {
    cancelled = true;
    return;
  }
  if (msg.type !== 'process') return;
  cancelled = false;

  try {
    const { channels, sampleRate, fileName, randomSeed } = msg;
    const params = {
      bitDepth: msg.bitDepth,
      crushMode: msg.crushMode,
      dither: msg.dither,
      grit: msg.grit,
      noise: msg.noise,
      normalize: msg.normalize,
    };
    self.postMessage({ type: 'progress', pct: 5, label: 'DSP…' });
    const random = createSeededRandom(randomSeed);
    let hasClipping = false;
    for (let ch = 0; ch < channels.length; ch++) {
      if (cancelled) throw new Error('Processing cancelled.');
      if (processDSP(channels[ch], params.bitDepth, params.crushMode, params.dither,
          params.grit, params.noise, random)) hasClipping = true;
      self.postMessage({ type: 'progress', pct: 5 + ((ch + 1) / channels.length) * 35,
        label: `DSP channel ${ch + 1}/${channels.length}…` });
    }
    if (params.normalize) normalizeChannels(channels);

    const formats = {};
    const errors = [];
    const attempt = async (format, fn) => {
      if (cancelled) throw new Error('Processing cancelled.');
      try { formats[format] = await fn(); }
      catch (error) { errors.push({ format, message: error.message || String(error) }); }
    };
    self.postMessage({ type: 'progress', pct: 40, label: 'Encoding OGG…' });
    await attempt('ogg', () => encodeOGG(channels, sampleRate));
    self.postMessage({ type: 'progress', pct: 65, label: 'Encoding WAV…' });
    await attempt('wav', () => encodeWAV(channels, sampleRate, params.bitDepth));
    self.postMessage({ type: 'progress', pct: 82, label: 'Encoding MP3…' });
    await attempt('mp3', () => encodeMP3(channels, sampleRate));
    if (!Object.keys(formats).length) throw new Error(errors.map(item => `${item.format}: ${item.message}`).join('; '));

    const transferList = Object.values(formats).filter(value => value instanceof ArrayBuffer);
    self.postMessage({ type: 'done', formats, errors, hasClipping, fileName }, transferList);
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message || String(error), fileName: msg.fileName });
  }
};
