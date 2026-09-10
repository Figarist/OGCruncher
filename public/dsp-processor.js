/**
 * OGCruncher — bounded streaming DSP processor.
 *
 * The product preview uses the offline contract for preview/export parity. This
 * processor remains available for future low-latency integrations and follows the
 * same order without hidden pre-gain or post-normalization.
 */

'use strict';

class DSPProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bitDepth = 8;
    this._grit = 1;
    this._noise = 0;
    this._crush = true;
    this._dither = true;
    this._previous = new Float32Array(2);
    this.port.onmessage = event => {
      const p = event.data || {};
      if (p.bitDepth !== undefined && Number.isFinite(Number(p.bitDepth))) this._bitDepth = Math.round(Math.min(16, Math.max(1, Number(p.bitDepth))));
      if (p.grit !== undefined && Number.isFinite(Number(p.grit))) this._grit = Math.min(10, Math.max(1, Number(p.grit)));
      if (p.noise !== undefined && Number.isFinite(Number(p.noise))) this._noise = Math.min(.05, Math.max(0, Number(p.noise)));
      if (p.crush !== undefined) this._crush = !!p.crush;
      if (p.dither !== undefined) this._dither = !!p.dither;
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input.length) return true;
    const halfLevels = 1 << (this._bitDepth - 1);
    const lsb = 1 / halfLevels;
    for (let ch = 0; ch < output.length; ch++) {
      const source = input[ch];
      const target = output[ch];
      if (!source || !target) continue;
      for (let i = 0; i < target.length; i++) {
        let sample = source[i];
        if (this._noise > 0) sample += (Math.random() * 2 - 1) * this._noise;
        if (this._crush) {
          sample = Math.sign(sample) * Math.pow(Math.min(1, Math.abs(sample)), 1.15);
          if (this._dither) sample += (Math.random() - Math.random()) * lsb;
          sample = Math.round(sample * halfLevels) / halfLevels;
          const previous = this._previous[ch] || 0;
          this._previous[ch] = sample;
          sample = (sample + previous) * .5;
        }
        if (this._grit > 1) sample = Math.tanh(sample * this._grit) / Math.tanh(this._grit);
        target[i] = Math.min(1, Math.max(-1, sample));
      }
    }
    return true;
  }
}

registerProcessor('dsp-processor', DSPProcessor);
