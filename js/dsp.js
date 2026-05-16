/**
 * OGCruncher — DSP Engine
 * by figarist · https://figarist.github.io
 */

'use strict';

import { log } from './utils.js';

/**
 * Apply the full bit-crush DSP pipeline to a Float32Array IN-PLACE.
 * @param {Float32Array} buf       — mono channel buffer, values in [-1, 1]
 * @param {number}       bitDepth  — quantization bit depth (1–16)
 * @param {boolean}      crushMode — enable expander + dither + anti-alias
 * @param {number}       grit      — saturation drive amount (1.0-10.0)
 * @param {number}       noise     — white noise floor level (0.0-0.05)
 */
export function processDSP(buf, bitDepth, crushMode, grit = 1.5, noise = 0.0) {
  bitDepth = Math.max(1, Math.min(16, bitDepth || 8));
  grit = Math.max(1.0, Math.min(10.0, grit || 1.5));
  noise = Math.max(0.0, Math.min(1.0, noise || 0.0));

  const N = buf.length;

  if (noise > 0) {
    for (let i = 0; i < N; i++) {
      buf[i] += (Math.random() * 2 - 1) * noise;
    }
  }

  let sum = 0;
  for (let i = 0; i < N; i++) sum += buf[i];
  const dc = sum / N;
  for (let i = 0; i < N; i++) buf[i] -= dc;

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

    // Step 3: Anti-alias (adjacent-sample average - FIR)
    let prev = 0;
    for (let i = 0; i < N; i++) {
      const cur = buf[i];
      buf[i] = (cur + prev) * 0.5;
      prev = cur;
    }
  }

  let clipped = false;
  for (let i = 0; i < N; i++) {
    if (buf[i] > 1.0 || buf[i] < -1.0) {
      clipped = true;
      break;
    }
  }

  for (let i = 0; i < N; i++) {
    buf[i] = Math.tanh(buf[i] * grit);
  }

  return clipped;
}

export function normalizeBuffer(buf) {
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

/**
 * Compute RMS and peak from an AudioBuffer (all channels averaged).
 * @param {AudioBuffer} audioBuffer
 * @returns {{ rmsDb: number, peakDb: number }}
 */
export function computeAudioMetrics(audioBuffer) {
  let sumSq = 0;
  let peak = 0;
  let totalSamples = 0;

  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    const data = audioBuffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) {
      const s = data[i];
      sumSq += s * s;
      const a = s < 0 ? -s : s;
      if (a > peak) peak = a;
    }
    totalSamples += data.length;
  }

  const rms = Math.sqrt(sumSq / (totalSamples || 1));
  const rmsDb = rms > 1e-9 ? 20 * Math.log10(rms) : -Infinity;
  const peakDb = peak > 1e-9 ? 20 * Math.log10(peak) : -Infinity;

  return {
    rmsDb: isFinite(rmsDb) ? rmsDb : -96,
    peakDb: isFinite(peakDb) ? peakDb : -96,
  };
}

export function buildFilterChain(offCtx, sourceNode, params) {
  let lastNode = sourceNode;

  if (params.hpf > 20) {
    const hpf = offCtx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = params.hpf;
    lastNode.connect(hpf);
    lastNode = hpf;
  }
  if (params.lpf < 20000) {
    const lpf = offCtx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = params.lpf;
    lastNode.connect(lpf);
    lastNode = lpf;
  }
  if (params.bass > 0) {
    const bass = offCtx.createBiquadFilter();
    bass.type = 'peaking';
    bass.frequency.value = 80;
    bass.Q.value = 0.7;
    bass.gain.value = params.bass;
    lastNode.connect(bass);
    lastNode = bass;
  }

  return lastNode;
}

export async function renderFilteredBuffer(buffer, params, targetChannels) {
  const numChannels = targetChannels || buffer.numberOfChannels;
  const pRate = params.playbackRate || 1.0;
  const targetRate = params.sampleRate || buffer.sampleRate;
  const targetLength = Math.ceil((buffer.duration / pRate) * targetRate);
  
  const offCtx = new OfflineAudioContext(numChannels, targetLength, targetRate);
  const src = offCtx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = pRate;
  
  const lastNode = buildFilterChain(offCtx, src, params);
  lastNode.connect(offCtx.destination);
  src.start(0);
  return await offCtx.startRendering();
}

export function safeOfflineCtx(numChannels, length, sampleRate) {
  try {
    return new OfflineAudioContext(numChannels, length, sampleRate);
  } catch (e) {
    const fallback = [8000, 11025, 16000, 22050, 32000, 44100, 48000]
      .find(r => r >= sampleRate) || 44100;
    log(`⚠ Browser rejected ${sampleRate} Hz — falling back to ${fallback} Hz`, 'error');
    return new OfflineAudioContext(numChannels, Math.ceil(length * (fallback / sampleRate)), fallback);
  }
}
