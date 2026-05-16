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
    
    // Per-channel state
    this._prevSample = new Float32Array(2); // for AA filter
    this._envelope   = new Float32Array(2); // for pre-normalization
    this._dcY1       = new Float32Array(2); // for DC blocker (y[n-1])
    this._dcX1       = new Float32Array(2); // for DC blocker (x[n-1])

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
    const lsb     = 1 / halfLev;

    for (let ch = 0; ch < output.length; ch++) {
      const inp = input[ch];
      const out = output[ch];
      if (!inp || !out) continue;

      // ── 1. Calculate per-block peak (before DC blocking for envelope stability) ──
      let blockPeak = 0;
      for (let i = 0; i < inp.length; i++) {
        const a = Math.abs(inp[i]);
        if (a > blockPeak) blockPeak = a;
      }
      
      // Smooth envelope follower (~10ms at 128 samples/44100Hz)
      this._envelope[ch] = this._envelope[ch] * 0.9 + blockPeak * 0.1;
      const preGain = this._envelope[ch] > 1e-4 ? 1.0 / this._envelope[ch] : 1.0;

      let peak = 0;

      for (let i = 0; i < out.length; i++) {
        let s = inp[i];

        // ── 2. DC Blocker (One-pole high-pass @ ~5Hz) ──
        // y[n] = x[n] - x[n-1] + R * y[n-1]
        const r = 0.999; 
        const y = s - this._dcX1[ch] + r * this._dcY1[ch];
        this._dcX1[ch] = s;
        this._dcY1[ch] = y;
        s = y;

        // ── 3. Pre-normalize ──
        s *= preGain;

        // ── 4. Noise floor ──
        if (this._noise > 0) {
          s += (Math.random() * 2 - 1) * this._noise;
        }

        if (this._crush) {
          // ── 5. Soft expander (nonlinear shaping) ──
          s = (s < 0 ? -1 : s > 0 ? 1 : 0) * Math.pow(Math.abs(s), 1.15);
          
          // ── 6. True TPDF dither ──
          s += (Math.random() - Math.random()) * lsb;
          
          // ── 7. Quantize ──
          s = Math.round(s * halfLev) / halfLev;
          
          // ── 8. Anti-alias (adjacent-sample average) ──
          const aa = (s + this._prevSample[ch]) * 0.5;
          this._prevSample[ch] = s;
          s = aa;
        }

        // ── 9. Saturation (Grit) ──
        s = Math.tanh(s * this._grit);
        out[i] = s;

        const a = Math.abs(s);
        if (a > peak) peak = a;
      }

      // ── 10. Post-normalization (per-block) ──
      if (this._normalize && peak > 0.01) {
        const inv = 1 / peak;
        for (let i = 0; i < out.length; i++) out[i] *= inv;
      }
    }

    return true;
  }
}

registerProcessor('dsp-processor', DSPProcessor);
