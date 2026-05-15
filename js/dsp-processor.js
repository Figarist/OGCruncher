/**
 * OGCruncher — DSP AudioWorklet Processor
 * Loaded via audioCtx.audioWorklet.addModule('./js/dsp-processor.js')
 * Runs in AudioWorkletGlobalScope — no DOM, no ES imports, no fetch.
 */

'use strict';

class DSPProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Default params (overridden immediately via port.postMessage)
    this._bitDepth  = 8;
    this._grit      = 1.0;
    this._noise     = 0.0;
    this._crush     = true;
    this._normalize = true;

    // Per-channel state for the stateful anti-alias filter (needs prev sample)
    this._prevSample = new Float32Array(2); // max 2 channels

    this.port.onmessage = (e) => {
      const p = e.data;
      if (p.bitDepth  !== undefined) this._bitDepth  = p.bitDepth;
      if (p.grit      !== undefined) this._grit      = p.grit;
      if (p.noise     !== undefined) this._noise     = p.noise;
      if (p.crush     !== undefined) this._crush     = p.crush;
      if (p.normalize !== undefined) this._normalize = p.normalize;
    };
  }

  process(inputs, outputs) {
    const input  = inputs[0];
    const output = outputs[0];
    if (!input || !input.length) return true;

    const levels  = 1 << this._bitDepth;
    const halfLev = levels >> 1;
    const lsb = 1 / halfLev; // 1 LSB = 2/(2^bitDepth)

    for (let ch = 0; ch < output.length; ch++) {
      const inp = input[ch];
      const out = output[ch];
      if (!inp || !out) continue;

      let peak = 0;

      for (let i = 0; i < out.length; i++) {
        let s = inp[i];

        // 1. Noise
        if (this._noise > 0) {
          s += (Math.random() * 2 - 1) * this._noise;
        }

        if (this._crush) {
          // 2. Soft expander
          s = (s < 0 ? -1 : s > 0 ? 1 : 0) * Math.pow(s < 0 ? -s : s, 1.15);
          // 3. Triangular dither
          s += (Math.random() - Math.random()) * lsb;
          // 4. Quantize
          s = Math.round(s * halfLev) / halfLev;
          // 5. Anti-alias (adjacent-sample average with stateful prev)
          const antialiased = (s + this._prevSample[ch]) * 0.5;
          this._prevSample[ch] = s;
          s = antialiased;
        }

        // 6. tanh saturation
        s = Math.tanh(s * this._grit);
        out[i] = s;

        // Track peak for normalization
        const a = s < 0 ? -s : s;
        if (a > peak) peak = a;
      }

      // 7. Per-block normalization (approximates full-buffer normalize)
      // Note: per-block normalize can cause pumping on very quiet passages.
      // Only apply when normalize is ON AND peak > threshold to avoid boosting silence.
      if (this._normalize && peak > 0.01) {
        const inv = 1 / peak;
        for (let i = 0; i < out.length; i++) out[i] *= inv;
      }
    }

    return true; // keep processor alive
  }
}

registerProcessor('dsp-processor', DSPProcessor);
