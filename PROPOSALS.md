# OGCruncher — Top 20 Proposals

Ranked by actual impact on the primary audience: **game developers, sound designers, lo-fi producers**.
Each item has a category tag, estimated effort, and honest rationale for its rank.

---

## 🔴 CRITICAL — Bugs in current codebase

---

### #1 · `detectClipping` never fires after `tanh` · `[BUG · dsp.js]`

**Effort: 30 min**

`processDSP` checks for clipping (`buf[i] > 1.0`) _after_ applying `Math.tanh()` — which is mathematically bounded to `(-1, 1)`. The check can never be true. The entire clipping detection and warning system (including the batch toast) is dead code.

**Fix:** Move the clipping scan to _between_ quantization (step 5) and tanh saturation (step 6), where samples genuinely can exceed `±1.0` after dither noise is added.

---

### #2 · `isUpdatingPreview` not reset in `stopPreview()` · `[BUG · preview.js]`

**Effort: 5 min**

If preview is stopped while a live-update render is in flight, `isUpdatingPreview` stays `true`. Every subsequent live-update call silently returns early. Live update is effectively dead until the page is refreshed.

**Fix:** Add `isUpdatingPreview = false;` as the first line of `stopPreview()`.

---

### #3 · `setBadge` missing from `ui.js` import · `[BUG · ui.js]`

**Effort: 5 min**

`setBadge('IDLE', 'badge--amber')` is called in `init()` but `setBadge` is not in the `import { ... }` from `utils.js`. In strict ES module scope this is a `ReferenceError`. The status badge never initializes to "IDLE".

**Fix:** Add `setBadge` to the import statement in `ui.js`.

---

## 🟠 HIGH IMPACT — Game dev differentiators

---

### #4 · ADPCM / IMA-ADPCM Encoder · `[EXPORT · encoders.js]`

**Effort: 3–5 days**

The single biggest gap in OGCruncher's export pipeline. ADPCM is the **native** audio format for GBA, DS, many Unity/Godot mobile targets, and game engines that ship their own decoders. It gives 4:1 compression at 16-bit quality — and unlike OGG, requires **no runtime decoder** on constrained hardware.

No comparable in-browser ADPCM encoder exists. This feature alone would make OGCruncher the go-to tool for retro/embedded game audio.

**Implementation:** Pure JS IMA-ADPCM encoder (the algorithm is ~80 lines). Emit `.wav` with `fmt ` chunk `wFormatTag = 0x0011`. Step-index and predictor tables are public domain.

---

### #5 · Platform Presets · `[UX · ui.js / state.js]`

**Effort: 1 day**

One-click preset buttons that configure the entire parameter set for a specific output target:

| Preset         | bitDepth | sampleRate | Format    |
| -------------- | -------- | ---------- | --------- |
| GBA            | 8        | 18157      | WAV ADPCM |
| Nintendo DS    | 16       | 32768      | WAV PCM   |
| Unity Mobile   | 16       | 22050      | OGG q0    |
| Godot Web      | 16       | 44100      | OGG q0    |
| Pocket Radio   | 8        | 8000       | MP3 32k   |
| lo-fi cassette | 12       | 22050      | WAV       |

These require zero DSP work — just state presets. For the target audience, discovering "GBA preset" is a moment of delight that drives sharing and word-of-mouth.

---

### #6 · Legacy Resampling Modes · `[DSP · dsp.js / queue.js]`

**Effort: 2–3 days**

The Web Audio API always uses high-quality sinc interpolation. Vintage samplers (SP-1200, Akai S900, early EMU) used much simpler algorithms that introduced characteristic artifacts — the "crunch" that lo-fi producers actually want.

Add a `resampleMode` selector with three options:

- **Clean** — current Web Audio behavior
- **Linear** — linear interpolation, produces soft lo-fi blur
- **Nearest Neighbor** — zero-order hold, the classic "staircase" aliasing sound

Linear and Nearest Neighbor must be implemented manually in `dsp.js` as a pre-pass before the standard pipeline, bypassing `OfflineAudioContext` resampling for those modes.

---

### #7 · Expanded Crunch Modes · `[DSP · dsp.js]`

**Effort: 1–2 days**

The current CRUSH MODE is one algorithm. Add a dropdown with four named modes, each with distinct character:

- **CRUSH** _(current)_ — expander + TPDF dither + anti-alias
- **HARD CLIP** — digital ceiling at ±threshold, aggressive transients, no soft knee
- **SINE FOLD** — `sin(x * π * drive)` waveshaping, metallic/bell harmonics
- **S-CURVE** — polynomial soft saturation `x / (1 + |x|)`, warm compression

Each mode plugs into the same pipeline slot, replacing the current expander block. The tanh saturation stage remains unchanged.

---

## 🟡 MEDIUM IMPACT — Audio quality & UX

---

### #8 · True TPDF Dithering · `[DSP · dsp.js]`

**Effort: 2 hours**

The current implementation adds `(r1 - r2) * errRange` which _is_ triangular noise — but applied before the expander, not after quantization. True TPDF must be applied **immediately before** the quantize step (`Math.round`) with amplitude exactly `1 LSB`:

```js
// Correct TPDF position:
const lsb = 1 / (1 << bitDepth);
s += (Math.random() - Math.random()) * lsb; // triangular, zero mean, ±1 LSB
s = Math.round(s * halfLev) / halfLev; // quantize
```

This placement eliminates quantization distortion at 1–4 bits and is audibly significant on percussive material.

---

### #9 · Waveform Preview + Seek Bar · `[UX · preview.js]`

**Effort: 2–3 days**

Replace (or augment) the frequency spectrum with a waveform display drawn from the decoded AudioBuffer. Add a scrubber that lets the user click to seek — essential for auditioning how bit-crush affects transients vs. sustained tones vs. tails.

Implementation: draw waveform to the existing `<canvas id="visualizer">` as a secondary mode (toggle between spectrum and waveform view). Seek updates `previewSource.start(previewCtx.currentTime + 0.05, seekOffset)` via the existing hot-swap mechanism.

No external libraries needed — pure Canvas2D.

---

### #10 · Per-File Progress Bars in Queue · `[UI · queue.js]`

**Effort: 1 day**

Each queue item currently shows only a status icon (⟳ / ✓ / ✗). With the Web Worker already dispatching progress messages, extend `setItemState(id, status, icon)` to also set a per-item progress bar width. Worker sends per-file progress via `{ type: 'progress', pct, fileId }` — the queue item renders a thin progress fill under the filename.

Essential for batch jobs of 20+ files where the global progress bar is too coarse.

---

### #11 · Dynamic Noise (Envelope Follower) · `[DSP · dsp.js]`

**Effort: 1 day**

Instead of a static noise floor, make noise amplitude track the signal envelope with a simple one-pole follower:

```js
// One-pole envelope follower (α = attack/release constant)
envelope = α * envelope + (1 - α) * Math.abs(s);
const dynamicNoise = (Math.random() * 2 - 1) * noise * envelope;
s += dynamicNoise;
```

This mimics vintage gear where hiss appears only when audio is present and fades during silence — a far more natural and musically useful effect than static noise.

Add a toggle `DYNAMIC NOISE ON/OFF` next to the existing noise slider. When ON, the slider controls maximum noise amplitude.

---

### #12 · LUFS Metering in Metrics Panel · `[DSP / UX · dsp.js / preview.js]`

**Effort: 1 day**

The current metrics panel shows RMS and Peak in dBFS. Add **Integrated LUFS** (EBU R128 short-term, measured over 3s windows). LUFS is the industry standard loudness metric — streaming platforms, game engines, and Unity's audio mixer all target specific LUFS values (-14 LUFS for most, -23 for broadcast).

The simplified LUFS calculation (K-weighting + mean square + offset) is ~40 lines of JS and fits cleanly into `computeAudioMetrics()`.

---

### #13 · Advanced Encoder Quality Settings · `[EXPORT · encoders.js / ui.js]`

**Effort: 4 hours**

Currently: MP3 always exports at 128 kbps, OGG always at quality 0. Add two sliders in the export section:

- **MP3 bitrate**: 32 / 48 / 64 / 96 / 128 / 192 / 320 kbps (passed to `lamejs.Mp3Encoder`)
- **OGG quality**: -0.1 to 1.0 (passed to `new OggVorbisEncoder(rate, ch, quality)`)

Low OGG quality (negative values) produces intentional "Ogg artifacts" — a distinct lo-fi character that some producers specifically want. This is a zero-effort creative tool if the slider is exposed.

---

### #14 · Mid/Side Processing · `[DSP · dsp.js / queue.js]`

**Effort: 1 day**

For stereo files, add an M/S mode that applies DSP independently to the Mid channel (L+R sum) and the Side channel (L-R difference). This allows:

- Crushing only the stereo image (Side) while keeping the center clean
- More aggressive processing on mono content, subtle on width

Implementation: M/S encode → process each independently with potentially different bitDepth → M/S decode. The encode/decode is 4 arithmetic operations per sample. Expose as a toggle `STEREO MODE: STEREO / MONO / M-S`.

---

### #15 · Batch Naming Templates · `[EXPORT · queue.js / ui.js]`

**Effort: 4 hours**

Currently output names are always `{stem}_crunched_{bitDepth}bit_{rate}hz`. Add a text input for a naming template with supported variables:

- `{name}` — original filename without extension
- `{bits}` — bitDepth
- `{rate}` — sampleRate
- `{mode}` — crushMode name
- `{date}` — YYYYMMDD

Show a live preview below the input: `kick_001 → kick_001_8b_22k.ogg`. Template persisted in localStorage.

---

## 🔵 LOWER PRIORITY — Polish & reliability

---

### #16 · A/B/C Comparison Slot · `[UX · preview.js / state.js]`

**Effort: 2–3 days**

Extend the A/B comparison to three slots: **Original**, **Preset A** (current settings), **Preset B** (a second saved parameter set). Users can cycle `[C]` key through all three. Requires snapshotting the full parameter state into a second preview buffer.

Architecturally complex — needs a second `OfflineAudioContext` render running in parallel. Worth doing after AudioWorklet stabilizes.

---

### #17 · AudioWorklet Per-Block Normalize Fix · `[DSP · dsp-processor.js]`

**Effort: 3 hours**

The current AudioWorklet processor applies per-128-sample-block normalization which causes audible "pumping" on sustained tones and silence. Replace with a **running RMS estimator** with a 50ms time constant for normalization gain:

```js
// In process():
const targetRms = 0.25;
const measured = Math.sqrt(sumSq / N);
const gain = measured > 1e-4 ? targetRms / measured : 1.0;
// Smooth the gain to avoid clicks
this._smoothGain += 0.1 * (gain - this._smoothGain);
for (let i = 0; i < N; i++) out[i] = inp[i] * this._smoothGain;
```

This gives stable perceived loudness in live preview without artifacts.

---

### #18 · PWA Offline Asset Caching · `[RELIABILITY · sw.js]`

**Effort: 4 hours**

Audit and expand `sw.js` to pre-cache:

- `OggVorbisEncoder.min.js` and `lame.min.js` (currently fetched from the server on load)
- Google Fonts (`Outfit`, `Fira Code`) — currently fetched from `fonts.googleapis.com`, fails offline
- The JSZip CDN script — currently fetched from `cdnjs.cloudflare.com`, fails offline

Strategy: **network-first with cache fallback** for encoders, **cache-first** for fonts. Add a cache version key so SW updates invalidate stale assets on deploy.

---

### #19 · Waveform Drag Region (Loop Selection) · `[UX · preview.js]`

**Effort: 2 days**

Extend the waveform view (#9) with a drag-select region that sets a loop in-point and out-point. Preview loops only the selected region. Useful for auditioning how processing affects a specific transient hit or the "room tail" of a reverb sample.

Implementation: track `loopStart` and `loopEnd` in state, pass to `BufferSource.loopStart`, `BufferSource.loopEnd`, set `previewSource.loop = true`.

---

### #20 · QR Code for URL Hash Sharing · `[UX · ui.js]`

**Effort: 2 hours**

Alongside the existing `[COPY LINK]` button, add a `[QR]` button that renders the current `window.location.href` (which already contains the full parameter hash) as a QR code in a modal. Useful at workshops, livestreams, and tutorials for sharing a specific sound configuration with an audience in one scan.

Implementation: `qrcode-generator` (MIT, 6KB gzip, no dependencies). Renders inline SVG into a `<dialog>` element. No backend required.

---

## Summary Table

| #   | Item                       | Category       | Effort   | Impact    |
| --- | -------------------------- | -------------- | -------- | --------- |
| 1   | `detectClipping` tanh bug  | 🔴 Bug         | 30 min   | Critical  |
| 2   | `isUpdatingPreview` reset  | 🔴 Bug         | 5 min    | Critical  |
| 3   | `setBadge` import missing  | 🔴 Bug         | 5 min    | Critical  |
| 4   | ADPCM Encoder              | 🟠 Feature     | 3–5 days | Very High |
| 5   | Platform Presets           | 🟠 Feature     | 1 day    | Very High |
| 6   | Legacy Resampling Modes    | 🟠 DSP         | 2–3 days | High      |
| 7   | Expanded Crunch Modes      | 🟠 DSP         | 1–2 days | High      |
| 8   | True TPDF Dithering        | 🟡 DSP         | 2 hours  | High      |
| 9   | Waveform + Seek Bar        | 🟡 UX          | 2–3 days | High      |
| 10  | Per-File Queue Progress    | 🟡 UI          | 1 day    | Medium    |
| 11  | Dynamic Noise (Envelope)   | 🟡 DSP         | 1 day    | Medium    |
| 12  | LUFS Metering              | 🟡 DSP/UX      | 1 day    | Medium    |
| 13  | Advanced Encoder Settings  | 🟡 Export      | 4 hours  | Medium    |
| 14  | Mid/Side Processing        | 🟡 DSP         | 1 day    | Medium    |
| 15  | Batch Naming Templates     | 🟡 Export      | 4 hours  | Medium    |
| 16  | A/B/C Comparison Slot      | 🔵 UX          | 2–3 days | Low-Med   |
| 17  | AudioWorklet Normalize Fix | 🔵 DSP         | 3 hours  | Low-Med   |
| 18  | PWA Offline Caching        | 🔵 Reliability | 4 hours  | Low-Med   |
| 19  | Waveform Loop Selection    | 🔵 UX          | 2 days   | Low       |
| 20  | QR Code Sharing            | 🔵 UX          | 2 hours  | Low       |
