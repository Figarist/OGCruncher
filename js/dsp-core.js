/**
 * Pure DSP and PCM helpers shared by the UI-side renderer and the encoder worker.
 * No DOM, Web Audio or random global state is required.
 */

'use strict';

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createSeededRandom(seed = 1) {
  let value = (Number(seed) >>> 0) || 1;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function hashSeed(value) {
  const text = String(value || 'ogcruncher');
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function finiteOr(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

/**
 * Apply the creative DSP contract in-place.
 *
 * Contract: optional noise -> (crush DC removal/expander/TPDF/anti-alias) ->
 * optional explicit saturation. There is no implicit input peak normalization.
 * Every output sample is bounded to [-1, 1]; linked output normalization is a
 * separate operation in processChannels().
 */
export function processDSP(buf, bitDepth = 8, crushMode = true, dither = true,
                           grit = 1, noise = 0, random = Math.random) {
  const bits = Math.round(clamp(finiteOr(bitDepth, 8), 1, 16));
  const drive = clamp(finiteOr(grit, 1), 1, 10);
  const noiseLevel = clamp(finiteOr(noise, 0), 0, 0.05);
  const crush = !!crushMode;
  if (!buf || !buf.length) return false;

  if (noiseLevel > 0) {
    for (let i = 0; i < buf.length; i++) buf[i] += (random() * 2 - 1) * noiseLevel;
  }

  if (crush) {
    // DC removal is part of the explicitly enabled crush pipeline only.
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i];
    const dc = sum / buf.length;
    for (let i = 0; i < buf.length; i++) buf[i] -= dc;

    // Soft expander and quantizer are the creative part of Crush mode.
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

    // Two-tap anti-alias smoothing. It is deliberately bypassed with Crush OFF.
    let previous = 0;
    for (let i = 0; i < buf.length; i++) {
      const current = buf[i];
      buf[i] = (current + previous) * 0.5;
      previous = current;
    }
  }

  if (drive > 1) {
    const compensation = Math.tanh(drive);
    for (let i = 0; i < buf.length; i++) {
      buf[i] = Math.tanh(buf[i] * drive) / compensation;
    }
  }

  let clipped = false;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] > 1 || buf[i] < -1) clipped = true;
    buf[i] = clamp(buf[i], -1, 1);
  }
  return clipped;
}

export function normalizeChannels(channels) {
  let peak = 0;
  for (const channel of channels || []) {
    for (let i = 0; i < channel.length; i++) peak = Math.max(peak, Math.abs(channel[i]));
  }
  if (peak <= 1e-6 || !Number.isFinite(peak)) return peak;
  const scale = 1 / peak;
  for (const channel of channels) {
    for (let i = 0; i < channel.length; i++) channel[i] = clamp(channel[i] * scale, -1, 1);
  }
  return peak;
}

export function processChannels(channels, params = {}, seed = 1) {
  const random = createSeededRandom(seed);
  for (const channel of channels) {
    processDSP(
      channel,
      params.bitDepth,
      params.crushMode,
      params.dither,
      params.grit,
      params.noise,
      random,
    );
  }
  if (params.normalize) normalizeChannels(channels);
  return channels;
}

export function wavContainerDepth(effectBits) {
  return Math.round(effectBits) <= 8 ? 8 : 16;
}

export function calculateWavLayout(numSamples, numChannels, effectBits) {
  const containerDepth = wavContainerDepth(effectBits);
  const bytesPerSample = containerDepth === 8 ? 1 : 2;
  const blockAlign = Math.max(1, Math.round(numChannels)) * bytesPerSample;
  const dataBytes = Math.max(0, Math.round(numSamples)) * blockAlign;
  const padding = dataBytes % 2;
  return {
    containerDepth,
    blockAlign,
    dataBytes,
    padding,
    fileBytes: 44 + dataBytes + padding,
  };
}

export function encodeWAV(channels, sampleRate, effectBits) {
  const numChannels = Math.max(1, channels.length);
  const numSamples = channels[0] ? channels[0].length : 0;
  const layout = calculateWavLayout(numSamples, numChannels, effectBits);
  const rate = Math.max(1, Math.round(sampleRate));
  const buffer = new ArrayBuffer(layout.fileBytes);
  const view = new DataView(buffer);
  const writeString = (offset, text) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, layout.fileBytes - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * layout.blockAlign, true);
  view.setUint16(32, layout.blockAlign, true);
  view.setUint16(34, layout.containerDepth, true);
  writeString(36, 'data');
  view.setUint32(40, layout.dataBytes, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const source = channels[channel] || channels[0] || [];
      const sample = clamp(Number(source[i]) || 0, -1, 1);
      if (layout.containerDepth === 8) {
        view.setUint8(offset, clamp(Math.round((sample + 1) * 127.5), 0, 255));
        offset += 1;
      } else {
        const value = sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff);
        view.setInt16(offset, clamp(value, -0x8000, 0x7fff), true);
        offset += 2;
      }
    }
  }
  // The pad byte is already zero-initialized and is intentionally excluded from
  // the data chunk length.
  return buffer;
}
