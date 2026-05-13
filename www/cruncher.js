/**
 * OGCruncher — DSP Engine
 * by figarist · https://figarist.github.io
 *
 * Ported from convertor.py using OfflineAudioContext + Float32Array.
 * Zero-allocation style: all buffer mutations are done in-place.
 */

'use strict';

/* ════════════════════════════════════════════════════════════════════
   STATE
   ════════════════════════════════════════════════════════════════════ */
const state = {
  files: [],          // File objects queued
  processing: false,
  bitDepth: 8,
  sampleRate: 22050,
  crushMode: true,    // expander + dither + anti-alias pipeline
};

/* ════════════════════════════════════════════════════════════════════
   DOM REFS
   ════════════════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);

const dropZone       = $('drop-zone');
const fileInput      = $('file-input');
const fileQueue      = $('file-queue');
const queueHeader    = $('queue-header');
const btnProcess     = $('btn-process');
const btnProcessLbl  = $('btn-process-label');
const btnSpinner     = $('btn-spinner');
const btnClearQueue  = $('btn-clear-queue');
const btnWearoseee   = $('btn-wearoseee');
const btnMarioToggle = $('toggle-mariomode');
const sliderBit      = $('slider-bitdepth');
const sliderSr       = $('slider-samplerate');
const outBit         = $('out-bitdepth');
const outSr          = $('out-samplerate');
const outMario       = $('out-mariomode');
const progressWrap   = $('progress-wrap');
const progressFill   = $('progress-fill');
const progressText   = $('progress-text');
const progressPct    = $('progress-pct');
const logWindow      = $('log-window');
const resultsArea    = $('results-area');
const badgeStatus    = $('badge-status');
const toast          = $('toast');

/* ════════════════════════════════════════════════════════════════════
   LOGGING
   ════════════════════════════════════════════════════════════════════ */
function log(msg, type = 'info') {
  const p = document.createElement('p');
  p.className = `log-line log-line--${type}`;
  const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
  p.textContent = `[${ts}] ${msg}`;
  logWindow.appendChild(p);
  logWindow.scrollTop = logWindow.scrollHeight;
}

/* ════════════════════════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════════════════════════ */
let _toastTimer = null;
function showToast(msg, type = 'info', duration = 3500) {
  toast.textContent = msg;
  toast.className = `toast toast--${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { toast.className = 'toast'; }, duration);
}

/* ════════════════════════════════════════════════════════════════════
   BADGE STATUS
   ════════════════════════════════════════════════════════════════════ */
function setBadge(text, cls = 'badge--amber') {
  badgeStatus.textContent = text;
  badgeStatus.className = `badge ${cls}`;
}

/* ════════════════════════════════════════════════════════════════════
   SLIDER HELPERS
   ════════════════════════════════════════════════════════════════════ */
function updateSliderTrack(slider) {
  const min = +slider.min, max = +slider.max, val = +slider.value;
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.setProperty('--pct', pct + '%');
}

function syncBitDepth(val) {
  state.bitDepth = +val;
  sliderBit.value = val;
  outBit.textContent = val;
  sliderBit.setAttribute('aria-valuenow', val);
  updateSliderTrack(sliderBit);
}

function syncSampleRate(val) {
  state.sampleRate = +val;
  sliderSr.value = val;
  outSr.innerHTML = `${(+val).toLocaleString()} <span class="unit">Hz</span>`;
  sliderSr.setAttribute('aria-valuenow', val);
  updateSliderTrack(sliderSr);
}

/* ════════════════════════════════════════════════════════════════════
   QUEUE MANAGEMENT
   ════════════════════════════════════════════════════════════════════ */
function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
}

function addFiles(newFiles) {
  for (const f of newFiles) {
    if (state.files.some(x => x.name === f.name && x.size === f.size)) continue;
    state.files.push(f);

    const li = document.createElement('li');
    li.className = 'queue-item queue-item--idle';
    li.id = `qi-${state.files.length - 1}`;
    li.innerHTML = `
      <span class="queue-item__icon">◎</span>
      <span class="queue-item__name" title="${f.name}">${f.name}</span>
      <span class="queue-item__size">${formatBytes(f.size)}</span>
      <span class="queue-item__status" id="qs-${state.files.length - 1}">IDLE</span>`;
    fileQueue.appendChild(li);
  }

  if (state.files.length > 0) {
    queueHeader.hidden = false;
    btnProcess.disabled = false;
    log(`${state.files.length} file(s) in queue.`, 'info');
  }
}

function clearQueue() {
  state.files = [];
  fileQueue.innerHTML = '';
  queueHeader.hidden = true;
  btnProcess.disabled = true;
  resultsArea.innerHTML = '';
  resultsArea.hidden = true;
  log('Queue cleared.', 'sys');
}

function setItemState(index, status, icon) {
  const li = $(`qi-${index}`);
  const qs = $(`qs-${index}`);
  if (!li || !qs) return;
  li.className = `queue-item queue-item--${status}`;
  li.querySelector('.queue-item__icon').textContent = icon;
  qs.textContent = status.toUpperCase();
}

/* ════════════════════════════════════════════════════════════════════
   PROGRESS
   ════════════════════════════════════════════════════════════════════ */
function setProgress(pct, text) {
  progressFill.style.width = pct + '%';
  progressText.textContent = text;
  progressPct.textContent  = Math.round(pct) + '%';
  progressWrap
    .querySelector('.progress-bar')
    .setAttribute('aria-valuenow', Math.round(pct));
}

/* ════════════════════════════════════════════════════════════════════
   CORE DSP — Zero-allocation style (mutates Float32Array in-place)
   Ported 1-to-1 from convertor.py apply_bitcrush_effect()
   ════════════════════════════════════════════════════════════════════ */

/**
 * Apply the full bit-crush DSP pipeline to a Float32Array IN-PLACE.
 * @param {Float32Array} buf       — mono channel buffer, values in [-1, 1]
 * @param {number}       bitDepth  — quantization bit depth (1–16)
 * @param {boolean}      crushMode — enable expander + dither + anti-alias
 */
function processDSP(buf, bitDepth, crushMode) {
  const N = buf.length;

  // ── 1. DC Offset Removal ────────────────────────────────────────
  let sum = 0;
  for (let i = 0; i < N; i++) sum += buf[i];
  const dc = sum / N;
  for (let i = 0; i < N; i++) buf[i] -= dc;

  // ── 2. Peak Normalisation to 1.0 ───────────────────────────────
  let peak = 0;
  for (let i = 0; i < N; i++) {
    const a = buf[i] < 0 ? -buf[i] : buf[i];
    if (a > peak) peak = a;
  }
  const invPeak = 1 / (peak + 1e-9);
  for (let i = 0; i < N; i++) buf[i] *= invPeak;

  if (crushMode) {
    // ── 3. Soft Expander ─────────────────────────────────────────
    // sign(x) * |x|^1.15  —  quiet parts get quieter → stronger bit-crush effect
    for (let i = 0; i < N; i++) {
      const x = buf[i];
      buf[i] = (x < 0 ? -1 : x > 0 ? 1 : 0) * Math.pow(x < 0 ? -x : x, 1.15);
    }

    // ── 4. Triangular Dither ──────────────────────────────────────
    // Two independent uniform random variables → triangular distribution
    const errRange = 1 / (1 << bitDepth);   // 1 / 2^bitDepth
    for (let i = 0; i < N; i++) {
      const r1 = Math.random();
      const r2 = Math.random();
      buf[i] += (r1 - r2) * errRange;       // triangular in [-errRange, errRange]
    }

    // ── 5. Quantization ───────────────────────────────────────────
    const levels   = 1 << bitDepth;         // 2^bitDepth
    const halfLev  = levels >> 1;           // levels / 2
    for (let i = 0; i < N; i++) {
      buf[i] = Math.round(buf[i] * halfLev) / halfLev;
    }

    // ── 6. Anti-Aliasing (vectorised adjacent-sample averaging) ───
    // samples[i] = (samples[i] + samples[i-1]) * 0.5   for i >= 1
    for (let i = 1; i < N; i++) {
      buf[i] = (buf[i] + buf[i - 1]) * 0.5;
    }
  }

  // ── 7. Saturation + Soft Clip (tanh) ───────────────────────────
  // Matches: samples * 1.5 → tanh → scale
  for (let i = 0; i < N; i++) {
    buf[i] = Math.tanh(buf[i] * 1.5);
  }
  // buf is now in (-1, 1) — leave in float range; WAV encoder scales separately
}

/* ════════════════════════════════════════════════════════════════════
   OGG VORBIS ENCODER
   Encodes a Float32Array (mono, [-1,1]) → OGG Blob using OggVorbisEncoder.js
   ════════════════════════════════════════════════════════════════════ */
function encodeOGG(samples, sampleRate) {
  // Quality 0.0 equals roughly Vorbis quality 0 (similar to -q:a 0)
  // OggVorbisEncoder quality is from -0.1 to 1.0
  const encoder = new OggVorbisEncoder(sampleRate, 1, 0.0);
  
  // Encode in chunks to prevent Emscripten OOM (TOTAL_MEMORY limit)
  const CHUNK_SIZE = 65536; // 64k samples per chunk
  for (let i = 0; i < samples.length; i += CHUNK_SIZE) {
    const chunk = samples.subarray(i, i + CHUNK_SIZE);
    encoder.encode([chunk]);
  }
  
  return encoder.finish(); // Returns a Blob
}

/* ════════════════════════════════════════════════════════════════════
   WAV ENCODER
   Encodes a Float32Array (mono, [-1,1]) → WAV Blob
   ════════════════════════════════════════════════════════════════════ */
function encodeWAV(samples, sampleRate, bitDepth) {
  const bytesPerSample = bitDepth === 16 ? 2 : 1;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  const writeString = (v, offset, str) => {
    for (let i = 0; i < str.length; i++) v.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 1 * bytesPerSample, true);
  view.setUint16(32, 1 * bytesPerSample, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * bytesPerSample, true);

  if (bitDepth === 16) {
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  } else {
    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 1) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setUint8(offset, (s + 1) * 127.5);
    }
  }
  return new Blob([view], { type: 'audio/wav' });
}

/* ════════════════════════════════════════════════════════════════════
   MP3 ENCODER
   Encodes a Float32Array (mono, [-1,1]) → MP3 Blob using lamejs
   ════════════════════════════════════════════════════════════════════ */
function encodeMP3(samples, sampleRate) {
  const intSamples = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    intSamples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
  const mp3Data = [];
  const sampleBlockSize = 1152;
  
  for (let i = 0; i < intSamples.length; i += sampleBlockSize) {
    const chunk = intSamples.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }
  
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) mp3Data.push(mp3buf);
  
  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/* ════════════════════════════════════════════════════════════════════
   PROCESS ONE FILE
   Uses OfflineAudioContext to decode → resample, then runs DSP in-place
   ════════════════════════════════════════════════════════════════════ */
async function processFile(file, index) {
  setItemState(index, 'processing', '⟳');
  log(`Processing: ${file.name}`, 'accent');

  try {
    // Read file as ArrayBuffer
    const rawBuffer = await file.arrayBuffer();

    // Decode via temporary AudioContext (standard, not offline)
    const decodeCtx  = new AudioContext();
    const decoded    = await decodeCtx.decodeAudioData(rawBuffer);
    await decodeCtx.close();

    const targetRate = Math.min(Math.max(state.sampleRate, 3000), 48000);

    // OfflineAudioContext for high-quality resampling
    const offCtx = new OfflineAudioContext(
      1,                               // force mono
      Math.ceil(decoded.duration * targetRate),
      targetRate
    );

    const src = offCtx.createBufferSource();
    src.buffer = decoded;
    src.connect(offCtx.destination);
    src.start(0);

    const resampled = await offCtx.startRendering();

    // Extract mono channel as Float32Array (copy — we mutate it next)
    const buf = resampled.getChannelData(0);  // direct view
    const samples = new Float32Array(buf);    // owned copy for mutation

    log(`  Decoded: ${decoded.numberOfChannels}ch → mono | ${decoded.sampleRate}Hz → ${targetRate}Hz | ${samples.length} samples`, 'sys');

    // ── DSP pipeline (in-place, zero-allocation) ─────────────────
    processDSP(samples, state.bitDepth, state.crushMode);

    // ── Encode to Formats ─────────────────────────────────────────────
    const blobOGG = encodeOGG(samples, targetRate);
    const blobWAV = encodeWAV(samples, targetRate, state.bitDepth);
    const blobMP3 = encodeMP3(samples, targetRate);

    const stem = file.name.replace(/\.[^.]+$/, '');
    const outNameBase = `${stem}_crunched_${state.bitDepth}bit_${targetRate}hz`;

    const sizeOGG = formatBytes(blobOGG.size);
    const sizeWAV = formatBytes(blobWAV.size);
    const sizeMP3 = formatBytes(blobMP3.size);

    console.log(`[OGCruncher] ${file.name} future sizes -> OGG: ${sizeOGG}, WAV: ${sizeWAV}, MP3: ${sizeMP3}`);
    log(`  ✅ Done: ${file.name} [OGG: ${sizeOGG} | WAV: ${sizeWAV} | MP3: ${sizeMP3}]`, 'ok');
    setItemState(index, 'done', '✓');

    return {
      name: outNameBase,
      formats: [
        { ext: 'ogg', url: URL.createObjectURL(blobOGG), size: sizeOGG },
        { ext: 'wav', url: URL.createObjectURL(blobWAV), size: sizeWAV },
        { ext: 'mp3', url: URL.createObjectURL(blobMP3), size: sizeMP3 }
      ]
    };

  } catch (err) {
    log(`  ❌ Error processing ${file.name}: ${err.message}`, 'error');
    setItemState(index, 'error', '✗');
    return null;
  }
}

/* ════════════════════════════════════════════════════════════════════
   BATCH PROCESSING CONTROLLER
   ════════════════════════════════════════════════════════════════════ */
async function startProcessing() {
  if (state.processing || state.files.length === 0) return;

  state.processing = true;
  btnProcess.disabled = true;
  btnProcess.classList.add('processing');
  btnProcessLbl.textContent = 'CRUNCHING…';
  progressWrap.hidden = false;
  resultsArea.innerHTML = '';
  resultsArea.hidden = true;
  setBadge('PROCESSING', 'badge--amber');
  log(`processing ${state.files.length} file(s)...`, 'accent');
  log(`${state.bitDepth}-bit · ${state.sampleRate} Hz · crush=${state.crushMode}`, 'sys');

  const results = [];

  for (let i = 0; i < state.files.length; i++) {
    const pct = (i / state.files.length) * 100;
    setProgress(pct, `File ${i + 1} / ${state.files.length}`);

    const result = await processFile(state.files[i], i);
    if (result) results.push(result);

    // Yield to UI thread between files
    await new Promise(r => setTimeout(r, 0));
  }

  setProgress(100, 'Complete');

  // ── Render download list ──────────────────────────────────────────
  if (results.length > 0) {
    resultsArea.hidden = false;
    for (const r of results) {
      const div = document.createElement('div');
      div.className = 'result-item';
      div.style.flexWrap = 'wrap';
      div.innerHTML = `
        <span class="result-item__name" title="${r.name}" style="flex:1; width:100%; margin-bottom:8px;">${r.name}</span>
        <div style="display:flex; gap:8px; width:100%;">
          ${r.formats.map(f => `
            <a href="${f.url}" download="${r.name}.${f.ext}" class="btn-download" aria-label="Download ${f.ext}" title="${f.size}" style="flex:1; text-align:center;">
              ${f.ext.toUpperCase()} <small style="opacity:0.7; font-size:10px;">${f.size}</small>
            </a>
          `).join('')}
        </div>`;
      resultsArea.appendChild(div);
    }
    log(`done: ${results.length}/${state.files.length} file(s) ready`, 'ok');
    showToast(`✅ ${results.length} file(s) ready`, 'ok');
    setBadge('DONE', 'badge--green');
  } else {
    log('error: 0 files processed', 'error');
    showToast('❌ processing failed — check log', 'error');
    setBadge('ERROR', 'badge--red');
  }

  state.processing = false;
  btnProcess.disabled = false;
  btnProcess.classList.remove('processing');
  btnProcessLbl.textContent = 'CRUNCH';
}

/* ════════════════════════════════════════════════════════════════════
   EVENT LISTENERS
   ════════════════════════════════════════════════════════════════════ */

// ── Drag & Drop ───────────────────────────────────────────────────
dropZone.addEventListener('dragenter', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragover',  e => { e.preventDefault(); });
dropZone.addEventListener('dragleave', e => { if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over'); });
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/') || /\.(wav|mp3|flac|ogg|aiff?|m4a)$/i.test(f.name)));
});

// Click to browse
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
fileInput.addEventListener('change', () => { addFiles(Array.from(fileInput.files)); fileInput.value = ''; });

// ── Sliders ───────────────────────────────────────────────────────
sliderBit.addEventListener('input', () => syncBitDepth(sliderBit.value));
sliderSr.addEventListener('input',  () => syncSampleRate(sliderSr.value));

// ── Toggle Crush Mode ─────────────────────────────────────────────
btnMarioToggle.addEventListener('click', () => {
  state.crushMode = !state.crushMode;
  btnMarioToggle.setAttribute('aria-checked', state.crushMode);
  btnMarioToggle.classList.toggle('active', state.crushMode);
  outMario.textContent = state.crushMode ? 'ON' : 'OFF';
  log(`Crush mode: ${state.crushMode ? 'ENABLED' : 'DISABLED'}`, 'sys');
});

// ── LO-Q Preset ──────────────────────────────────────────────
btnWearoseee.addEventListener('click', () => {
  syncBitDepth(8);
  syncSampleRate(22050);
  if (!state.crushMode) btnMarioToggle.click();
  log('lo-q preset: 8-bit / 22050 Hz / crush on', 'accent');
  showToast('◉ lo-q mode on', 'info');
});

// ── Process button ────────────────────────────────────────────────
btnProcess.addEventListener('click', startProcessing);

// ── Clear queue ───────────────────────────────────────────────────
btnClearQueue.addEventListener('click', clearQueue);

/* ════════════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════════════ */
(function init() {
  syncBitDepth(8);
  syncSampleRate(22050);

  // PWA service worker registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {/* offline optional */});
  }

  log('ready. drop files or click browse.', 'ok');
  setBadge('IDLE', 'badge--amber');
})();
