/**
 * OGCruncher — DSP AudioWorklet Processor
 * Loaded via audioCtx.audioWorklet.addModule('./js/dsp-processor.js')
 * Runs in AudioWorkletGlobalScope — no DOM, no ES imports, no fetch.
 */

'use strict';

class DSPProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Default params
    this._bitDepth  = 8;
    this._grit      = 1.0;
    this._noise     = 0.0;
    this._crush     = true;
    this._normalize = true;
    this._sampleRate = 44100;

    // Normalization & DC state from pre-analysis
    this._preGain   = 1.0;
    this._dcOffset  = 0.0;
    this._postGain  = 1.0;

    // Per-channel state for the stateful anti-alias filter (needs prev sample)
    this._prevSample = new Float32Array(2);
    this._heldSample = new Float32Array(2);
    this._phase      = 0;

    this.port.onmessage = (e) => {
      const p = e.data;
      if (p.bitDepth   !== undefined) this._bitDepth   = p.bitDepth;
      if (p.grit       !== undefined) this._grit       = p.grit;
      if (p.noise      !== undefined) this._noise      = p.noise;
      if (p.crush      !== undefined) this._crush      = p.crush;
      if (p.normalize  !== undefined) this._normalize  = p.normalize;
      if (p.sampleRate !== undefined) this._sampleRate = p.sampleRate;

      // New normalization params
      if (p.preGain    !== undefined) this._preGain    = p.preGain;
      if (p.dcOffset   !== undefined) this._dcOffset   = p.dcOffset;
      if (p.postGain   !== undefined) this._postGain   = p.postGain;
    };
  }

  process(inputs, outputs) {
    const input  = inputs[0];
    const output = outputs[0];
    if (!input || !input.length) return true;

    const levels  = 1 << this._bitDepth;
    const halfLev = levels >> 1;
    const lsb = 1 / halfLev;
    const rateRatio = this._sampleRate / sampleRate;

    for (let ch = 0; ch < output.length; ch++) {
      const inp = input[ch];
      const out = output[ch];
      if (!inp || !out) continue;

      let phase = this._phase;

      for (let i = 0; i < out.length; i++) {
        // 1. Sample Rate Reduction (ZOH)
        phase += rateRatio;
        if (phase >= 1.0) {
          phase -= 1.0;
          this._heldSample[ch] = inp[i];
        }
        let s = this._heldSample[ch];

        // 2. DC Removal & Pre-Crunch Normalization (CRITICAL FOR BATCH CONSISTENCY)
        s -= this._dcOffset;
        s *= this._preGain;

        // 3. Noise
        if (this._noise > 0) {
          s += (Math.random() * 2 - 1) * this._noise;
        }

        if (this._crush) {
          // 4. Soft expander
          s = (s < 0 ? -1 : s > 0 ? 1 : 0) * Math.pow(Math.abs(s), 1.15);
          // 5. Triangular dither
          s += (Math.random() - Math.random()) * lsb;
          // 6. Quantize
          s = Math.round(s * halfLev) / halfLev;
          // 7. Anti-alias
          const antialiased = (s + this._prevSample[ch]) * 0.5;
          this._prevSample[ch] = s;
          s = antialiased;
        }

        // 8. Post-Crunch Normalization (matches batch "Normalize" toggle)
        if (this._normalize) {
          s *= this._postGain;
        }

        // 9. tanh saturation (grit)
        s = Math.tanh(s * this._grit);
        out[i] = s;
      }
      if (ch === output.length - 1) this._phase = phase; 
    }

    return true; 
  }
}

registerProcessor('dsp-processor', DSPProcessor);
