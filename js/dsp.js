/**
 * OGCruncher — DSP Engine
 * by figarist · https://figarist.github.io
 */

'use strict';

import { log } from './utils.js';
import {
  processDSP as processCoreDSP,
  normalizeChannels,
  processChannels,
} from './dsp-core.js';

/**
 * Apply the full bit-crush DSP pipeline to a Float32Array IN-PLACE.
 * @param {Float32Array} buf       — mono channel buffer, values in [-1, 1]
 * @param {number}       bitDepth  — quantization bit depth (1–16)
 * @param {boolean}      crushMode — enable expander + dither + anti-alias
 * @param {boolean}      dither    — enable TPDF dither
 * @param {number}       grit      — saturation drive amount (1.0-10.0)
 * @param {number}       noise     — white noise floor level (0.0-0.05)
 */
export function processDSP(buf, bitDepth, crushMode, dither, grit = 1.5, noise = 0.0) {
  return processCoreDSP(buf, bitDepth, crushMode, dither, grit, noise);
}

export function normalizeBuffer(buf) {
  normalizeChannels([buf]);
}

export { processChannels };

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
  const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
  const peakDb = peak > 0 ? 20 * Math.log10(peak) : -Infinity;

  return {
    rmsDb,
    peakDb,
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
  
  const offCtx = safeOfflineCtx(numChannels, targetLength, targetRate);
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
