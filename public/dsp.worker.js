/**
 * OGCruncher — DSP Web Worker
 * Handles heavy processing and encoding in a background thread.
 */

'use strict';

// Load encoder globals (paths relative to root)
importScripts('OggVorbisEncoder.min.js', 'lame.min.js');

// ── DSP FUNCTIONS ────────────────────────────────────────────────────────────

function processDSP(buf, bitDepth, crushMode, grit = 1.5, noise = 0.0) {
  bitDepth = Math.max(1, Math.min(16, bitDepth || 8));
  grit = Math.max(1.0, Math.min(10.0, grit || 1.5));
  noise = Math.max(0.0, Math.min(1.0, noise || 0.0));

  const N = buf.length;

  if (noise > 0) {
    for (let i = 0; i < N; i++) {
      buf[i] += (Math.random() * 2 - 1) * noise;
    }
  }

  // Remove DC offset
  let sum = 0;
  for (let i = 0; i < N; i++) sum += buf[i];
  const dc = sum / N;
  for (let i = 0; i < N; i++) buf[i] -= dc;

  // Initial peak normalization for consistent crushing
  let peak = 0;
  for (let i = 0; i < N; i++) {
    const a = buf[i] < 0 ? -buf[i] : buf[i];
    if (a > peak) peak = a;
  }
  const invPeak = 1 / (peak + 1e-9);
  for (let i = 0; i < N; i++) buf[i] *= invPeak;

  if (crushMode) {
    // Step 1: Soft expander (nonlinear shaping)
    for (let i = 0; i < N; i++) {
      const x = buf[i];
      buf[i] = (x < 0 ? -1 : x > 0 ? 1 : 0) * Math.pow(x < 0 ? -x : x, 1.15);
    }

    // Step 2: Quantize with True TPDF dither
    // Dither is added HERE — after all nonlinear processing, immediately before rounding.
    // Amplitude = 1 LSB = 1/halfLev in the normalized [-1, 1] scale.
    const levels = 1 << bitDepth;
    const halfLev = levels >> 1;
    const lsb = 1 / halfLev; // ← correct 1 LSB amplitude (was errRange = 1/(1<<bitDepth) = 0.5 LSB)
    for (let i = 0; i < N; i++) {
      buf[i] += (Math.random() - Math.random()) * lsb; // TPDF: triangular, zero mean, ±1 LSB
      buf[i] = Math.round(buf[i] * halfLev) / halfLev;
    }

    // Step 3: Anti-alias (adjacent-sample average)
    for (let i = 1; i < N; i++) {
      buf[i] = (buf[i] + buf[i - 1]) * 0.5;
    }

  }

  // Check for clipping BEFORE final saturation
  let clipped = false;
  for (let i = 0; i < N; i++) {
    if (buf[i] > 1.0 || buf[i] < -1.0) {
      clipped = true;
      break;
    }
  }

  // 5. Final saturation (grit)
  for (let i = 0; i < N; i++) {
    buf[i] = Math.tanh(buf[i] * grit);
  }

  return clipped;
}

function normalizeBuffer(buf) {
  let peak = 0;
  for (let i = 0; i < buf.length; i++) {
    const a = buf[i] < 0 ? -buf[i] : buf[i];
    if (a > peak) peak = a;
  }
  if (peak > 1e-6) {
    const inv = 1 / peak;
    for (let i = 0; i < buf.length; i++) buf[i] *= inv;
  }
}

function detectClipping(buf) {
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] > 1.0 || buf[i] < -1.0) return true;
  }
  return false;
}

// ── ENCODERS (Returning ArrayBuffers for transferability) ────────────────────

function encodeOGG(channels, sampleRate) {
  const numChannels = channels.length;
  // @ts-ignore
  const encoder = new OggVorbisEncoder(sampleRate, numChannels, 0.0);

  const CHUNK_SIZE = 65536; 
  const totalSamples = channels[0].length;

  for (let i = 0; i < totalSamples; i += CHUNK_SIZE) {
    const chunkEnd = Math.min(i + CHUNK_SIZE, totalSamples);
    const chunks = channels.map(ch => ch.subarray(i, chunkEnd));
    encoder.encode(chunks);
  }

  return encoder.finish(); // Returns ArrayBuffer
}

function encodeWAV(channels, sampleRate, bitDepth) {
  const containerDepth = bitDepth <= 8 ? 8 : 16;
  const numChannels = channels.length;
  const numSamples = channels[0].length;
  const bytesPerSample = containerDepth === 16 ? 2 : 1;
  const blockAlign = numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + numSamples * blockAlign);
  const view = new DataView(buffer);

  const writeString = (v, offset, str) => {
    for (let i = 0; i < str.length; i++) v.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * blockAlign, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, containerDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * blockAlign, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let s = Math.max(-1, Math.min(1, channels[ch][i]));
      if (containerDepth === 16) {
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      } else {
        view.setUint8(offset, (s + 1) * 127.5);
        offset += 1;
      }
    }
  }
  return buffer;
}

function encodeMP3(channels, sampleRate) {
  const numChannels = channels.length;
  const numSamples = channels[0].length;

  // @ts-ignore
  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);
  const mp3Data = [];
  const sampleBlockSize = 1152;

  const intChannels = channels.map(ch => {
    const i16 = new Int16Array(ch.length);
    for (let i = 0; i < ch.length; i++) {
      let s = Math.max(-1, Math.min(1, ch[i]));
      i16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return i16;
  });

  for (let i = 0; i < numSamples; i += sampleBlockSize) {
    const chunkEnd = Math.min(i + sampleBlockSize, numSamples);
    const leftChunk = intChannels[0].subarray(i, chunkEnd);
    const rightChunk = numChannels > 1 ? intChannels[1].subarray(i, chunkEnd) : leftChunk;

    let mp3buf;
    if (numChannels === 1) {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    }
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) mp3Data.push(mp3buf);

  // Combine multiple Uint8Arrays into one ArrayBuffer
  const totalLength = mp3Data.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of mp3Data) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result.buffer;
}

// ── MESSAGE HANDLER ──────────────────────────────────────────────────────────

self.onmessage = function(e) {
  const msg = e.data;
  if (msg.type !== 'process') return;

  try {
    const { channels, sampleRate, bitDepth, crushMode, grit, noise, normalize, bitDepthOriginal, fileName } = msg;
    const numChannels = channels.length;

    self.postMessage({ type: 'progress', pct: 5, label: 'DSP…' });

    let hasClipping = false;

    // 1. DSP Processing
    for (let ch = 0; ch < numChannels; ch++) {
      const clipped = processDSP(channels[ch], bitDepth, crushMode, grit, noise);
      if (clipped) hasClipping = true;

      if (normalize) {
        normalizeBuffer(channels[ch]);
      }

      self.postMessage({ 
        type: 'progress', 
        pct: 5 + ((ch + 1) / numChannels) * 35, 
        label: `DSP channel ${ch + 1}/${numChannels}…` 
      });
    }

    // 2. Encoding OGG
    self.postMessage({ type: 'progress', pct: 40, label: 'Encoding OGG…' });
    const ogg = encodeOGG(channels, sampleRate);

    // 3. Encoding WAV
    self.postMessage({ type: 'progress', pct: 65, label: 'Encoding WAV…' });
    const wav = encodeWAV(channels, sampleRate, bitDepthOriginal);

    // 4. Encoding MP3
    self.postMessage({ type: 'progress', pct: 82, label: 'Encoding MP3…' });
    const mp3 = encodeMP3(channels, sampleRate);

    // 5. Finalize
    const transferList = [];
    [ogg, wav, mp3].forEach(buf => {
      if (buf instanceof ArrayBuffer) {
        transferList.push(buf);
      } else if (buf && buf.buffer instanceof ArrayBuffer) {
        transferList.push(buf.buffer);
      }
    });

    self.postMessage({
      type: 'done',
      ogg,
      wav,
      mp3,
      hasClipping,
      fileName
    }, transferList);

  } catch (err) {
    const errorString = err.message || err.name || String(err);
    self.postMessage({ type: 'error', message: errorString, fileName: msg.fileName });
  }
};
