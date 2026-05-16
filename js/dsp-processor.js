/**
 * OGCruncher — DSP AudioWorklet Processor
 * Loaded via audioCtx.audioWorklet.addModule('./js/dsp-processor.js')
 * Runs in AudioWorkletGlobalScope — no DOM, no ES imports, no fetch.
 */

'use strict';

class DSPProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bitDepth  = 8;
    this._grit      = 1.0;
    this._noise     = 0.0;
    this._crush     = true;
    this._normalize = true;
    this._prevSample = new Float32Array(2);
    this._envelope   = new Float32Array(2); // ← ADD: per-channel envelope follower state

    this.port.onmessage = (e) => {
      const p = e.data;
      if (p.bitDepth  !== undefined) this._bitDepth  = p.bitDepth;
      if (p.grit      !== undefined) this._grit      = p.grit;
      if (p.noise     !== undefined) this._noise     = p.noise;
      if (p.crush     !== undefined) this._crush      = p.crush;
      if (p.normalize !== undefined) this._normalize = p.normalize;
    };
  }

  process(inputs, outputs) {
    const input  = inputs[0];
    const output = outputs[0];
    if (!input || !input.length) return true;

    const levels  = 1 << this._bitDepth;
    const halfLev = levels >> 1;
    const lsb     = 1 / halfLev; // True TPDF: 1 LSB amplitude

    for (let ch = 0; ch < output.length; ch++) {
      const inp = input[ch];
      const out = output[ch];
      if (!inp || !out) continue;

      // ── Per-block peak for pre-normalization ─────────────────────────────
      let blockPeak = 0;
      for (let i = 0; i < inp.length; i++) {
        const a = inp[i] < 0 ? -inp[i] : inp[i];
        if (a > blockPeak) blockPeak = a;
      }
      // Smooth envelope follower (one-pole, ~10ms attack/release at 128 samples)
      this._envelope[ch] = this._envelope[ch] * 0.9 + blockPeak * 0.1;
      const preGain = this._envelope[ch] > 1e-4 ? 1.0 / this._envelope[ch] : 1.0;

      let peak = 0;

      for (let i = 0; i < out.length; i++) {
        let s = inp[i] * preGain; // pre-normalize

        // 1. Noise floor
        if (this._noise > 0) {
          s += (Math.random() * 2 - 1) * this._noise;
        }

        if (this._crush) {
          // 2. Soft expander
          s = (s < 0 ? -1 : s > 0 ? 1 : 0) * Math.pow(s < 0 ? -s : s, 1.15);
          // 3. True TPDF dither immediately before quantize (1 LSB amplitude)
          s += (Math.random() - Math.random()) * lsb;
          // 4. Quantize
          s = Math.round(s * halfLev) / halfLev;
          // 5. Anti-alias
          const aa = (s + this._prevSample[ch]) * 0.5;
          this._prevSample[ch] = s;
          s = aa;
        }

        // 6. tanh saturation
        s = Math.tanh(s * this._grit);
        out[i] = s;

        const a = s < 0 ? -s : s;
        if (a > peak) peak = a;
      }

      // 7. Post-normalization (per-block, only when normalize ON and signal present)
      if (this._normalize && peak > 0.01) {
        const inv = 1 / peak;
        for (let i = 0; i < out.length; i++) out[i] *= inv;
      }
    }

    return true;
  }
}

registerProcessor('dsp-processor', DSPProcessor);
