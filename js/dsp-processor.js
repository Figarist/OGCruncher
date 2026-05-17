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
    this._preGain   = 1.0;
    
    // Per-channel state
    this._prevSample = new Float32Array(2); // for AA filter
    this._dcY1       = new Float32Array(2); // for DC blocker (y[n-1])
    this._dcX1       = new Float32Array(2); // for DC blocker (x[n-1])

    this.port.onmessage = (e) => {
      const p = e.data;
      if (p.bitDepth  !== undefined) this._bitDepth  = p.bitDepth;
      if (p.grit      !== undefined) this._grit      = Math.max(1.0, p.grit);
      if (p.noise     !== undefined) this._noise     = p.noise;
      if (p.crush     !== undefined) this._crush      = p.crush;
      if (p.normalize !== undefined) this._normalize = p.normalize;
      if (p.preGain   !== undefined) this._preGain   = p.preGain;
    };
  }

  process(inputs, outputs) {
    const input  = inputs[0];
    const output = outputs[0];
    if (!input || !input.length) return true;

    const levels  = 1 << this._bitDepth;
    const halfLev = levels >> 1;
    const lsb     = 1 / halfLev;

    for (let ch = 0; ch < output.length; ch++) {
      const inp = input[ch];
      const out = output[ch];
      if (!inp || !out) continue;

      for (let i = 0; i < out.length; i++) {
        let s = inp[i];

        // ── 1. DC Blocker (One-pole high-pass @ ~5Hz) ──
        // y[n] = x[n] - x[n-1] + R * y[n-1]
        const r = 0.999; 
        const y = s - this._dcX1[ch] + r * this._dcY1[ch];
        this._dcX1[ch] = s;
        this._dcY1[ch] = y;
        s = y;

        // ── 2. Pre-normalize (Static Global) ──
        s *= this._preGain;

        // ── 3. Noise floor ──
        if (this._noise > 0) {
          s += (Math.random() * 2 - 1) * this._noise;
        }

        if (this._crush) {
          // ── 4. Soft expander (nonlinear shaping) ──
          s = (s < 0 ? -1 : s > 0 ? 1 : 0) * Math.pow(Math.abs(s), 1.15);
          
          // ── 5. True TPDF dither ──
          s += (Math.random() - Math.random()) * lsb;
          
          // ── 6. Quantize ──
          s = Math.round(s * halfLev) / halfLev;
          
          // ── 7. Anti-alias (adjacent-sample average) ──
          const aa = (s + this._prevSample[ch]) * 0.5;
          this._prevSample[ch] = s;
          s = aa;
        }

        // ── 8. Saturation (Grit) ──
        s = Math.tanh(s * this._grit);

        // ── 9. Post-normalization (Static Makeup) ──
        if (this._normalize) {
          const makeup = 1.0 / Math.tanh(this._grit);
          s *= makeup;
        }

        out[i] = s;
      }
    }

    return true;
  }
}

registerProcessor('dsp-processor', DSPProcessor);
