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
  files: new Map(),   // Map<id, File> keyed by monotonically increasing counter
  nextId: 0,          // ID counter for stable queue tracking
  processing: false,
  bitDepth: 8,
  sampleRate: 22050,
  crushMode: true,    // expander + dither + anti-alias pipeline
  grit: 1.0,
  noise: 0.0,
  stereo: false,
  playbackRate: 1.0,
  hpf: 20,
  lpf: 20000,
  bass: 0,
  liveUpdate: true,    // IMPROVEMENT: enabled by default
  normalize: true,     // IMPROVEMENT 2: peak normalization toggle
  dualView: false,     // NEW: show both spectra simultaneously
};

let activeBlobUrls = []; // IMPROVEMENT 4: Track active object URLs for cleanup

function saveState() {
  const { files, processing, nextId, ...persistentState } = state;
  localStorage.setItem('ogcruncher_last_state', JSON.stringify(persistentState));
  updateHash(); // IMPROVEMENT 5: Update URL hash on every param change
}

function loadState() {
  const saved = localStorage.getItem('ogcruncher_last_state');
  if (!saved) return;
  try {
    const p = JSON.parse(saved);
    applyParamsToUI(p);
  } catch (e) {
    console.error('Failed to load state', e);
  }
}

/**
 * Apply a parameters object to the UI and state.
 * Used by loadState and parseHash.
 */
function applyParamsToUI(p) {
  if (p.bitDepth !== undefined) syncBitDepth(p.bitDepth);
  if (p.sampleRate !== undefined) syncSampleRate(p.sampleRate);
  if (p.grit !== undefined) syncGrit(p.grit);
  if (p.noise !== undefined) syncNoise(p.noise);
  if (p.playbackRate !== undefined) syncSpeed(p.playbackRate);
  if (p.hpf !== undefined) syncHpf(p.hpf);
  if (p.lpf !== undefined) syncLpf(p.lpf);
  if (p.bass !== undefined) syncBass(p.bass);
  if (p.crushMode !== undefined && p.crushMode !== state.crushMode) btnMarioToggle.click();
  if (p.stereo !== undefined && p.stereo !== state.stereo) btnStereoToggle.click();
  if (p.normalize !== undefined && p.normalize !== state.normalize) btnNormalizeToggle.click();
  if (p.liveUpdate !== undefined && p.liveUpdate !== state.liveUpdate) btnLiveUpdate.click();
  if (p.dualView !== undefined && p.dualView !== state.dualView) btnDualView.click();
}

/* ════════════════════════════════════════════════════════════════════
   DOM REFS
   ════════════════════════════════════════════════════════════════════ */
const $ = id => document.getElementById(id);

const dropZone = $('drop-zone');
const fileInput = $('file-input');
const fileQueue = $('file-queue');
const queueHeader = $('queue-header');
const btnProcess = $('btn-process');
const btnProcessLbl = $('btn-process-label');
const btnPreview = $('btn-preview');
const btnPreviewLbl = $('btn-preview-label');
const btnAB = $('btn-ab');
const abStatus = $('ab-status');
const previewIcon = $('preview-icon');
const btnSpinner = $('btn-spinner');
const btnClearQueue = $('btn-clear-queue');
const btnPresetAuthor = $('btn-preset-author');
const btnPresetUser = $('btn-preset-user');
const btnSaveCustom = $('btn-save-custom');
const userPresetMeta = $('preset-user-meta');
const btnMarioToggle = $('toggle-mariomode');
const btnStereoToggle = $('toggle-stereo');
const btnNormalizeToggle = $('toggle-normalize');
const btnCopyLink = $('btn-copy-link');
const sliderBit = $('slider-bitdepth');
const sliderSr = $('slider-samplerate');
const sliderGrit = $('slider-grit');
const sliderNoise = $('slider-noise');
const sliderSpeed = $('slider-speed');
const outBit = $('out-bitdepth');
const outSr = $('out-samplerate');
const outGrit = $('out-grit');
const outNoise = $('out-noise');
const outSpeed = $('out-speed');
const outMario = $('out-mariomode');
const outStereo = $('out-stereo');
const outNormalize = $('out-normalize');
const abContainer = $('ab-container');
const sliderHpf = $('slider-hpf');
const sliderLpf = $('slider-lpf');
const sliderBass = $('slider-bass');
const outHpf = $('out-hpf');
const outLpf = $('out-lpf');
const outBass = $('out-bass');
const progressWrap = $('progress-wrap');
const progressFill = $('progress-fill');
const progressText = $('progress-text');
const progressPct = $('progress-pct');
const logWindow = $('log-window');
const resultsArea = $('results-area');
const badgeStatus = $('badge-status');
const toast = $('toast');
const dropContent = $('drop-content');
const visualizer = $('visualizer');
const btnLiveUpdate = $('btn-live-update');
const btnDualView = $('btn-dual-view');
const headerProgressFill = $('header-progress-fill');
const btnLoadDemo = $('btn-load-demo');

let analyserCrunched = null;
let analyserOriginal = null;
let visDrawId = null;
let liveUpdateTimer = null;
let previewStartTime = 0;
let previewDecoded = null;
let previewResampled = null; 
let lastRenderParams = {};   
let isUpdatingPreview = false;
let clippingBatchCount = 0; // IMPROVEMENT 3: Track clipping across batch

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
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

// IMPROVEMENT 1: Snap-to-Standard helper
function updateSrButtons(val) {
  const btns = document.querySelectorAll('.btn-sr-snap');
  btns.forEach(btn => {
    const active = +btn.dataset.value === +val;
    btn.classList.toggle('active', active);
    btn.classList.toggle('btn--sr', active);
  });
}

function syncSampleRate(val) {
  state.sampleRate = +val;
  sliderSr.value = val;
  outSr.innerHTML = `${(+val).toLocaleString()} <span class="unit">Hz</span>`;
  sliderSr.setAttribute('aria-valuenow', val);
  updateSliderTrack(sliderSr);
  updateSrButtons(val); // Update active state of standard rate buttons
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncGrit(val) {
  state.grit = +val;
  sliderGrit.value = val;
  outGrit.textContent = val;
  updateSliderTrack(sliderGrit);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncNoise(val) {
  state.noise = +val;
  sliderNoise.value = val;
  outNoise.textContent = val;
  updateSliderTrack(sliderNoise);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncSpeed(val) {
  state.playbackRate = parseFloat(val);
  sliderSpeed.value = state.playbackRate;
  outSpeed.textContent = Math.round(state.playbackRate * 100) + '%';
  updateSliderTrack(sliderSpeed);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncHpf(val) {
  state.hpf = +val;
  sliderHpf.value = val;
  outHpf.textContent = val > 20 ? `${val} Hz` : '20 Hz';
  updateSliderTrack(sliderHpf);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncLpf(val) {
  state.lpf = +val;
  sliderLpf.value = val;
  outLpf.textContent = val < 20000 ? `${val} Hz` : 'OFF';
  updateSliderTrack(sliderLpf);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncBass(val) {
  state.bass = +val;
  sliderBass.value = val;
  outBass.textContent = val > 0 ? `+${val} dB` : '0 dB';
  updateSliderTrack(sliderBass);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
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
    if ([...state.files.values()].some(x => x.name === f.name && x.size === f.size)) continue;
    
    const id = state.nextId++;
    state.files.set(id, f);

    const li = document.createElement('li');
    li.className = 'queue-item queue-item--idle';
    li.id = `qi-${id}`;
    li.innerHTML = `
      <span class="queue-item__icon">◎</span>
      <span class="queue-item__name" title="${f.name}">${f.name}</span>
      <span class="queue-item__size">${formatBytes(f.size)}</span>
      <span class="queue-item__status" id="qs-${id}">IDLE</span>
      <button class="btn-remove" aria-label="Remove" onclick="removeFile(${id})">×</button>`;
    fileQueue.appendChild(li);
  }

  if (state.files.size > 0) {
    queueHeader.hidden = false;
    btnProcess.disabled = false;
    btnPreview.disabled = false;
    log(`${state.files.size} file(s) in queue.`, 'info');
  }
}

async function loadDemoTrack() {
  if (state.processing) return;
  
  btnLoadDemo.disabled = true;
  btnLoadDemo.textContent = 'LOADING...';
  log('Fetching demo track from server...', 'sys');
  
  try {
    const response = await fetch('demo.mp3');
    if (!response.ok) throw new Error('Failed to fetch demo track');
    
    const blob = await response.blob();
    const file = new File([blob], 'loksii_demo_track.mp3', { type: 'audio/mpeg' });
    
    addFiles([file]);
    
    log('Demo track loaded successfully.', 'ok');
    log('Music by Oleksii Holubiev (Pixabay)', 'accent');
    showToast('Demo track loaded!', 'ok');
  } catch (err) {
    log(`Failed to load demo track: ${err.message}`, 'error');
    showToast('Failed to load demo', 'error');
  } finally {
    btnLoadDemo.disabled = false;
    btnLoadDemo.textContent = 'TRY DEMO TRACK';
  }
}

window.removeFile = function (id) {
  state.files.delete(id);
  const li = $(`qi-${id}`);
  if (li) li.remove();

  if (state.files.size === 0) {
    clearQueue();
  } else {
    log(`${state.files.size} file(s) in queue.`, 'info');
  }
};

function clearQueue() {
  // IMPROVEMENT 4: Revoke all object URLs
  activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
  activeBlobUrls = [];

  state.files.clear();
  state.nextId = 0;
  fileQueue.innerHTML = '';
  queueHeader.hidden = true;
  btnProcess.disabled = true;
  btnPreview.disabled = true;
  stopPreview();
  resultsArea.innerHTML = '';
  resultsArea.hidden = true;
  log('Queue cleared.', 'sys');
}

function setItemState(id, status, icon) {
  const li = $(`qi-${id}`);
  const qs = $(`qs-${id}`);
  if (!li || !qs) return;
  li.className = `queue-item queue-item--${status}`;
  li.querySelector('.queue-item__icon').textContent = icon;
  qs.textContent = status.toUpperCase();
}

/* ════════════════════════════════════════════════════════════════════
   PROGRESS
   ════════════════════════════════════════════════════════════════════ */
function setProgress(pct, text) {
  const p = pct + '%';
  progressFill.style.width = p;
  headerProgressFill.style.width = p;
  
  progressText.textContent = text;
  progressPct.textContent = Math.round(pct) + '%';
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
 * @param {number}       grit      — saturation drive amount (1.0-10.0)
 * @param {number}       noise     — white noise floor level (0.0-0.05)
 */
function processDSP(buf, bitDepth, crushMode, grit = 1.5, noise = 0.0) {
  // Safety clamps moved to top
  bitDepth = Math.max(1, Math.min(16, bitDepth || 8));
  grit = Math.max(1.0, Math.min(10.0, grit || 1.5));
  noise = Math.max(0.0, Math.min(1.0, noise || 0.0));

  const N = buf.length;

  // ── 0. Noise Floor ─────────────────────────────────────────────
  if (noise > 0) {
    for (let i = 0; i < N; i++) {
      buf[i] += (Math.random() * 2 - 1) * noise;
    }
  }

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
    const levels = 1 << bitDepth;         // 2^bitDepth
    const halfLev = levels >> 1;           // levels / 2
    for (let i = 0; i < N; i++) {
      buf[i] = Math.round(buf[i] * halfLev) / halfLev;
    }

    // ── 6. Anti-Aliasing (vectorised adjacent-sample averaging) ───
    // samples[i] = (samples[i] + samples[i-1]) * 0.5   for i >= 1
    for (let i = 1; i < N; i++) {
      buf[i] = (buf[i] + buf[i - 1]) * 0.5;
    }
  }

  // REAL BASH FIX: Detect clipping before tanh (saturation)
  let clipped = false;
  for (let i = 0; i < N; i++) {
    if (buf[i] > 1.0 || buf[i] < -1.0) {
      clipped = true;
      break;
    }
  }

  // ── 7. Saturation + Soft Clip (tanh) ───────────────────────────
  // Matches: samples * grit → tanh → scale
  for (let i = 0; i < N; i++) {
    buf[i] = Math.tanh(buf[i] * grit);
  }

  return clipped;
}

// IMPROVEMENT 2: Peak Normalization helper
function normalizeBuffer(buf) {
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

// Removed detectClipping helper as it is now integrated into processDSP
// and was mathematically impossible to trigger after tanh.

/* ════════════════════════════════════════════════════════════════════
   OGG VORBIS ENCODER
   Encodes a Float32Array (mono, [-1,1]) → OGG Blob using OggVorbisEncoder.js
   ════════════════════════════════════════════════════════════════════ */
function encodeOGG(channels, sampleRate) {
  const numChannels = channels.length;
  const encoder = new OggVorbisEncoder(sampleRate, numChannels, 0.0);

  const CHUNK_SIZE = 65536; 
  const totalSamples = channels[0].length;

  for (let i = 0; i < totalSamples; i += CHUNK_SIZE) {
    const chunkEnd = Math.min(i + CHUNK_SIZE, totalSamples);
    const chunks = channels.map(ch => ch.subarray(i, chunkEnd));
    encoder.encode(chunks);
  }

  return encoder.finish(); 
}

/* ════════════════════════════════════════════════════════════════════
   WAV ENCODER
   Encodes a Float32Array (mono, [-1,1]) → WAV Blob
   ════════════════════════════════════════════════════════════════════ */
function encodeWAV(channels, sampleRate, bitDepth) {
  const containerDepth = bitDepth <= 8 ? 8 : 16;
  const numChannels = channels.length;
  const numSamples = channels[0].length;
  const bytesPerSample = containerDepth === 16 ? 2 : 1;
  const blockAlign = numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + numSamples * blockAlign);
  const view = new DataView(buffer);

  const writeString = (v, offset, str) => {
    for (let i = 0; i < str.length; i++) v.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * blockAlign, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, containerDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * blockAlign, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let s = Math.max(-1, Math.min(1, channels[ch][i]));
      if (containerDepth === 16) {
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
      } else {
        view.setUint8(offset, (s + 1) * 127.5);
        offset += 1;
      }
    }
  }
  return new Blob([view], { type: 'audio/wav' });
}

/* ════════════════════════════════════════════════════════════════════
   MP3 ENCODER
   Encodes a Float32Array (mono, [-1,1]) → MP3 Blob using lamejs
   ════════════════════════════════════════════════════════════════════ */
function encodeMP3(channels, sampleRate) {
  const numChannels = channels.length;
  const numSamples = channels[0].length;

  const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128);
  const mp3Data = [];
  const sampleBlockSize = 1152;

  const intChannels = channels.map(ch => {
    const i16 = new Int16Array(ch.length);
    for (let i = 0; i < ch.length; i++) {
      let s = Math.max(-1, Math.min(1, ch[i]));
      i16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return i16;
  });

  for (let i = 0; i < numSamples; i += sampleBlockSize) {
    const chunkEnd = Math.min(i + sampleBlockSize, numSamples);
    const leftChunk = intChannels[0].subarray(i, chunkEnd);
    const rightChunk = numChannels > 1 ? intChannels[1].subarray(i, chunkEnd) : leftChunk;

    let mp3buf;
    if (numChannels === 1) {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    }
    if (mp3buf.length > 0) mp3Data.push(mp3buf);
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) mp3Data.push(mp3buf);

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

/* ════════════════════════════════════════════════════════════════════
   BIQUAD FILTER HELPER
   ════════════════════════════════════════════════════════════════════ */
/**
 * Build a BiquadFilter chain on offCtx and return the last node.
 * @param {OfflineAudioContext} offCtx
 * @param {AudioNode} sourceNode
 * @param {{ hpf: number, lpf: number, bass: number }} params
 * @returns {AudioNode} last node in the chain
 */
function buildFilterChain(offCtx, sourceNode, params) {
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

/**
 * Fast-render a buffer through the filter chain.
 * Used for A/B testing and Live Update to keep the original track clean.
 */
async function renderFilteredBuffer(buffer, params, targetChannels) {
  const numChannels = targetChannels || buffer.numberOfChannels;
  const pRate = params.playbackRate || 1.0;
  const targetLength = Math.ceil(buffer.length / pRate);
  
  const offCtx = new OfflineAudioContext(numChannels, targetLength, buffer.sampleRate);
  const src = offCtx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = pRate;
  
  const lastNode = buildFilterChain(offCtx, src, params);
  lastNode.connect(offCtx.destination);
  src.start(0);
  return await offCtx.startRendering();
}

// IMPROVEMENT 6: safeOfflineCtx helper
function safeOfflineCtx(numChannels, length, sampleRate) {
  try {
    return new OfflineAudioContext(numChannels, length, sampleRate);
  } catch (e) {
    // Browser rejected sampleRate — step up to nearest supported standard
    const fallback = [8000, 11025, 16000, 22050, 32000, 44100, 48000]
      .find(r => r >= sampleRate) || 44100;
    log(`⚠ Browser rejected ${sampleRate} Hz — falling back to ${fallback} Hz`, 'error');
    return new OfflineAudioContext(numChannels, Math.ceil(length * (fallback / sampleRate)), fallback);
  }
}

/* ════════════════════════════════════════════════════════════════════
   PROCESS ONE FILE
   Uses OfflineAudioContext to decode → resample, then runs DSP in-place
   ════════════════════════════════════════════════════════════════════ */
async function processFile(file, id) {
  setItemState(id, 'processing', '⟳');
  log(`Processing: ${file.name}`, 'accent');

  try {
    const rawBuffer = await file.arrayBuffer();

    const decodeCtx = new AudioContext();
    let decoded;
    try {
      decoded = await decodeCtx.decodeAudioData(rawBuffer);
    } catch (decodeErr) {
      throw new Error(`Cannot decode "${file.name}" — unsupported or corrupt file.`);
    } finally {
      await decodeCtx.close();
    }

    const targetRate = Math.min(Math.max(state.sampleRate, 3000), 48000);
    const numChannels = state.stereo ? Math.min(decoded.numberOfChannels, 2) : 1;
    const targetPlaybackRate = state.playbackRate || 1.0;

    // IMPROVEMENT 6: Use safeOfflineCtx
    const offCtx = safeOfflineCtx(
      numChannels,
      Math.ceil((decoded.duration / targetPlaybackRate) * targetRate),
      targetRate
    );

    const src = offCtx.createBufferSource();
    src.buffer = decoded;
    src.playbackRate.value = targetPlaybackRate;

    const lastNode = buildFilterChain(offCtx, src, { hpf: state.hpf, lpf: state.lpf, bass: state.bass });
    lastNode.connect(offCtx.destination);
    src.start(0);

    const resampled = await offCtx.startRendering();

    const channels = [];
    let hasClipping = false;

    for (let ch = 0; ch < numChannels; ch++) {
      const buf = resampled.getChannelData(ch);
      const samples = new Float32Array(buf);
      const clipped = processDSP(samples, state.bitDepth, state.crushMode, state.grit, state.noise);

      // IMPROVEMENT 2: Apply normalization
      if (state.normalize) {
        normalizeBuffer(samples);
      } else if (clipped) {
        // IMPROVEMENT 3: Clipping Detection (skip if normalize is ON)
        hasClipping = true;
      }

      channels.push(samples);
    }

    if (hasClipping) {
      log(`⚠ clipping detected in "${file.name}" — reduce Grit or enable Normalize`, 'error');
      clippingBatchCount++;
    }

    log(`  Decoded: ${decoded.numberOfChannels}ch → ${numChannels}ch | ${decoded.sampleRate}Hz → ${targetRate}Hz`, 'sys');

    const blobOGG = encodeOGG(channels, targetRate);
    const blobWAV = encodeWAV(channels, targetRate, state.bitDepth);
    const blobMP3 = encodeMP3(channels, targetRate);

    const stem = file.name.replace(/\.[^.]+$/, '');
    const outNameBase = `${stem}_crunched_${state.bitDepth}bit_${targetRate}hz`;

    const sizeOGG = formatBytes(blobOGG.size);
    const sizeWAV = formatBytes(blobWAV.size);
    const sizeMP3 = formatBytes(blobMP3.size);

    console.log(`[OGCruncher] ${file.name} future sizes -> OGG: ${sizeOGG}, WAV: ${sizeWAV}, MP3: ${sizeMP3}`);
    log(`  ✅ Done: ${file.name} [OGG: ${sizeOGG} | WAV: ${sizeWAV} | MP3: ${sizeMP3}]`, 'ok');
    setItemState(id, 'done', '✓');

    return {
      name: outNameBase,
      formats: [
        { ext: 'ogg', url: URL.createObjectURL(blobOGG), size: sizeOGG, blob: blobOGG },
        { ext: 'wav', url: URL.createObjectURL(blobWAV), size: sizeWAV, blob: blobWAV },
        { ext: 'mp3', url: URL.createObjectURL(blobMP3), size: sizeMP3, blob: blobMP3 }
      ]
    };

  } catch (err) {
    log(`  ❌ Error processing ${file.name}: ${err.message}`, 'error');
    setItemState(id, 'error', '✗');
    return null;
  }
}

/* ════════════════════════════════════════════════════════════════════
   BATCH PROCESSING CONTROLLER
   ════════════════════════════════════════════════════════════════════ */
async function startProcessing() {
  if (state.processing || state.files.size === 0) return;

  state.processing = true;
  btnProcess.disabled = true;
  btnProcess.classList.add('processing');
  btnProcessLbl.textContent = 'CRUNCHING…';
  progressWrap.hidden = false;
  resultsArea.innerHTML = '';
  resultsArea.hidden = true;
  setBadge('PROCESSING', 'badge--amber');
  log(`processing ${state.files.size} file(s)...`, 'accent');
  log(`${state.bitDepth}-bit · ${state.sampleRate} Hz · crush=${state.crushMode} · normalize=${state.normalize}`, 'sys');

  const results = [];
  const validFiles = [...state.files.values()];
  let processedCount = 0;
  clippingBatchCount = 0; // Reset clipping count

  const canShare = !!navigator.share; 

  for (const [id, file] of state.files.entries()) {
    const pct = (processedCount / validFiles.length) * 100;
    setProgress(pct, `File ${processedCount + 1} / ${validFiles.length}`);

    const result = await processFile(file, id);
    if (result) results.push(result);

    processedCount++;
    await new Promise(r => setTimeout(r, 0));
  }

  setProgress(100, 'Complete');

  if (results.length > 0) {
    resultsArea.hidden = false;

    if (results.length > 1) {
      const batchDiv = document.createElement('div');
      batchDiv.className = 'batch-actions';
      batchDiv.style.display = 'flex';
      batchDiv.style.gap = '8px';
      batchDiv.style.marginBottom = '12px';

      batchDiv.innerHTML = `
        <button id="btn-download-zip" class="btn btn--primary btn--zip" style="flex:1;">
          <span class="btn-icon">📦</span> DOWNLOAD ALL (.ZIP)
        </button>
        ${canShare ? `
          <button id="btn-share-zip" class="btn btn--secondary" style="padding: 10px 15px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </button>
        ` : ''}
      `;
      resultsArea.appendChild(batchDiv);
      $('btn-download-zip').onclick = () => downloadResultsAsZip(results);
      if (canShare) {
        $('btn-share-zip').onclick = () => downloadResultsAsZip(results, true);
      }
    }

    for (const r of results) {
      const div = document.createElement('div');
      div.className = 'result-item';
      div.style.flexWrap = 'wrap';

      div.innerHTML = `
        <span class="result-item__name" title="${r.name}" style="flex:1; width:100%; margin-bottom:8px;">${r.name}</span>
        <div style="display:flex; gap:8px; width:100%; flex-wrap: wrap;">
          ${r.formats.map(f => {
            // IMPROVEMENT 4: Keep track of object URLs
            activeBlobUrls.push(f.url);
            
            return `
              <div class="download-group" style="flex: 1; display: flex; gap: 2px;">
                <a href="${f.url}" 
                   download="${r.name}.${f.ext}" 
                   draggable="true"
                   ondragstart="handleDragStart(event, '${f.blob.type}', '${r.name}.${f.ext}', '${f.url}')"
                   class="btn-download" 
                   aria-label="Download ${f.ext}" 
                   title="Drag me to DAW or Unity! (${f.size})" 
                   style="flex:1; text-align:center;">
                  ${f.ext.toUpperCase()} <small style="opacity:0.7; font-size:10px;">${f.size}</small>
                </a>
                ${canShare ? `
                  <button class="btn-share" onclick="shareFile('${r.name}', '${f.ext}', '${f.url}')" title="Share ${f.ext}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  </button>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>`;
      resultsArea.appendChild(div);

      // IMPROVEMENT 4: Revoke on click
      r.formats.forEach(f => {
        const a = resultsArea.querySelector(`a[download="${r.name}.${f.ext}"]`);
        if (a) {
          a.addEventListener('click', () => {
            setTimeout(() => URL.revokeObjectURL(f.url), 10000); // 10s grace
          }, { once: true });
        }
      });
    }
    log(`done: ${results.length}/${state.files.size} file(s) ready`, 'ok');
    showToast(`✅ ${results.length} file(s) ready`, 'ok');
    
    // IMPROVEMENT 3: Clipping batch report
    if (clippingBatchCount > 0) {
      showToast(`⚠ clipping in ${clippingBatchCount} file(s)`, 'error', 5000);
    }
    
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

// ── Drag & Drop (Folder Support) ──────────────────────────────────
async function readAllEntries(reader) {
  const all = [];
  while (true) {
    const batch = await new Promise((res, rej) =>
      reader.readEntries(res, rej)
    );
    if (!batch.length) break;
    all.push(...batch);
  }
  return all;
}

async function handleItems(items) {
  const allFiles = [];

  async function traverseEntry(entry) {
    if (entry.isFile) {
      const file = await new Promise(res => entry.file(res));
      if (file.type.startsWith('audio/') || /\.(wav|mp3|flac|ogg|aiff?|m4a)$/i.test(file.name)) {
        allFiles.push(file);
      }
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const entries = await readAllEntries(reader); 
      for (const e of entries) await traverseEntry(e);
    }
  }

  for (const item of items) {
    const entry = item.webkitGetAsEntry();
    if (entry) await traverseEntry(entry);
  }

  if (allFiles.length > 0) addFiles(allFiles);
}

dropZone.addEventListener('dragenter', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragover', e => { e.preventDefault(); });
dropZone.addEventListener('dragleave', e => { if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over'); });

dropZone.addEventListener('drop', async e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');

  if (e.dataTransfer.items) {
    await handleItems(e.dataTransfer.items);
  } else {
    addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/') || /\.(wav|mp3|flac|ogg|aiff?|m4a)$/i.test(f.name)));
  }
});

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); fileInput.click(); } });
fileInput.addEventListener('change', () => { addFiles(Array.from(fileInput.files)); fileInput.value = ''; });

sliderBit.addEventListener('input', () => syncBitDepth(sliderBit.value));
sliderSr.addEventListener('input', () => syncSampleRate(sliderSr.value));
sliderGrit.addEventListener('input', () => syncGrit(sliderGrit.value));
sliderNoise.addEventListener('input', () => syncNoise(sliderNoise.value));
sliderSpeed.addEventListener('input', () => syncSpeed(sliderSpeed.value));
sliderHpf.addEventListener('input', () => syncHpf(sliderHpf.value));
sliderLpf.addEventListener('input', () => syncLpf(sliderLpf.value));
sliderBass.addEventListener('input', () => syncBass(sliderBass.value));

btnMarioToggle.addEventListener('click', () => {
  state.crushMode = !state.crushMode;
  btnMarioToggle.setAttribute('aria-checked', state.crushMode);
  btnMarioToggle.classList.toggle('active', state.crushMode);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
  outMario.textContent = state.crushMode ? 'ON' : 'OFF';
  log(`Crush mode: ${state.crushMode ? 'ENABLED' : 'DISABLED'}`, 'sys');
});

btnStereoToggle.addEventListener('click', () => {
  state.stereo = !state.stereo;
  const isForceMono = !state.stereo;
  btnStereoToggle.setAttribute('aria-checked', isForceMono);
  btnStereoToggle.classList.toggle('active', isForceMono);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
  outStereo.textContent = state.stereo ? 'STEREO' : 'MONO';
  log(`Output mode: ${state.stereo ? 'STEREO' : 'MONO'}`, 'sys');
});

// IMPROVEMENT 2: Normalize Toggle
btnNormalizeToggle.addEventListener('click', () => {
  state.normalize = !state.normalize;
  btnNormalizeToggle.setAttribute('aria-checked', state.normalize);
  btnNormalizeToggle.classList.toggle('active', state.normalize);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
  outNormalize.textContent = state.normalize ? 'ON' : 'OFF';
  log(`Normalization: ${state.normalize ? 'ENABLED' : 'DISABLED'}`, 'sys');
});

btnDualView.addEventListener('click', () => {
  state.dualView = !state.dualView;
  btnDualView.classList.toggle('active', state.dualView);
  btnDualView.textContent = `DUAL VIEW: ${state.dualView ? 'ON' : 'OFF'}`;
  saveState();
  log(`Dual View mode: ${state.dualView ? 'ENABLED' : 'DISABLED'}`, 'sys');
});

// IMPROVEMENT 5: Copy Link
btnCopyLink.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast('🔗 Link copied to clipboard', 'ok');
  } catch (err) {
    showToast('⚠ Copy manually from address bar', 'error');
  }
});

// ── ZIP Export ───────────────────────────────────────────────────
async function downloadResultsAsZip(results, isShare = false) {
  const zip = new JSZip();
  const btn = isShare ? $('btn-share-zip') : $('btn-download-zip');
  const originalText = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = isShare ? '…' : '<span class="btn-spinner" style="display:block"></span> PACKING…';

  try {
    results.forEach(r => {
      r.formats.forEach(f => {
        zip.file(`${r.name}.${f.ext}`, f.blob);
      });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const filename = `OGCruncher_batch_${new Date().getTime()}.zip`;

    if (isShare && navigator.share) {
      const file = new File([content], filename, { type: 'application/zip' });
      await navigator.share({
        files: [file],
        title: 'OGCruncher Batch Export',
        text: `Shared ${results.length} crunched audio tracks.`
      });
    } else {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      // IMPROVEMENT 4: Revoke after ZIP download completes
      setTimeout(() => URL.revokeObjectURL(url), 15000); 
      
      showToast('📦 ZIP archive ready', 'ok');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      log(`zip error: ${err.message}`, 'error');
      showToast('❌ zip failed', 'error');
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ── Share API ────────────────────────────────────────────────────
async function shareFile(name, ext, url) {
  if (!navigator.share) return;

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], `${name}.${ext}`, { type: blob.type });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `OGCruncher: ${name}.${ext}`,
        text: 'Crunched audio via OGCruncher'
      });
    } else {
      await navigator.share({
        title: name,
        url: window.location.href,
        text: `Check out this crunched audio: ${name}.${ext}`
      });
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      log(`share error: ${err.message}`, 'error');
      showToast('❌ sharing failed', 'error');
    }
  }
}

window.handleDragStart = function (e, type, name, url) {
  const downloadData = `${type}:${name}:${url}`;
  e.dataTransfer.setData('DownloadURL', downloadData);
  e.dataTransfer.effectAllowed = 'copy';
};

// ── Preview Logic ────────────────────────────────────────────────
let previewSource = null;
let previewSourceOrig = null;
let gainCrunched = null;
let gainOriginal = null;
let previewCtx = null;
let isComparingOriginal = false;

async function stopPreview() {
  if (liveUpdateTimer) clearTimeout(liveUpdateTimer);
  if (visDrawId) cancelAnimationFrame(visDrawId);
  if (visualizer) {
    visualizer.style.display = 'none';
    visualizer.classList.remove('visualizer-glow');
  }
  if (dropContent) dropContent.style.display = 'flex';

  if (previewSource) { try { previewSource.stop(); } catch (e) { } previewSource = null; }
  if (previewSourceOrig) { try { previewSourceOrig.stop(); } catch (e) { } previewSourceOrig = null; }

  btnPreview.classList.remove('playing');
  btnPreviewLbl.textContent = 'PREVIEW';
  previewIcon.textContent = '▶';
  abContainer.style.display = 'none';
  isComparingOriginal = false;
  abStatus.textContent = 'CRUNCHED';
  btnAB.classList.remove('active');
  previewDecoded = null;
  previewResampled = null;
  lastRenderParams = {};
}

function drawVisualizer() {
  if (!visualizer || visualizer.style.display === 'none') return;
  const ctx = visualizer.getContext('2d');
  const width = visualizer.width;
  const height = visualizer.height;

  if (!analyserOriginal || !analyserCrunched) return;

  const bufferLength = analyserOriginal.frequencyBinCount;
  const dataOrig = new Uint8Array(bufferLength);
  const dataCr = new Uint8Array(bufferLength);

  analyserOriginal.getByteFrequencyData(dataOrig);
  analyserCrunched.getByteFrequencyData(dataCr);

  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.font = '600 9px var(--font-mono)';
  ctx.lineWidth = 1;

  const freqs = [1000, 5000, 10000, 20000];
  const nyquist = previewCtx.sampleRate / 2;

  freqs.forEach(f => {
    const x = (f / nyquist) * width;
    if (x < width) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      ctx.fillText(f >= 1000 ? (f / 1000) + 'kHz' : f + 'Hz', x + 3, 10);
    }
  });

  const barWidth = (width / bufferLength) * 2.2;
  const alphaActive = 0.85;
  const alphaGhost = state.dualView ? 0.7 : 0.25;

  const colorOrig = (isComparingOriginal || state.dualView) ? `rgba(178, 245, 234, ${alphaActive})` : `rgba(178, 245, 234, ${alphaGhost})`;
  const colorCr = (!isComparingOriginal || state.dualView) ? `rgba(124, 105, 227, ${alphaActive})` : `rgba(124, 105, 227, ${alphaGhost})`;

  let x = 0;
  const subWidth = state.dualView ? (barWidth * 0.5) : barWidth;

  for (let i = 0; i < bufferLength; i++) {
    const bhOrig = dataOrig[i] / 255 * height;
    const bhCr = dataCr[i] / 255 * height;

    if (state.dualView) {
      // Side-by-side mode
      ctx.fillStyle = colorOrig;
      ctx.fillRect(x, height - bhOrig, subWidth, bhOrig);
      ctx.fillStyle = colorCr;
      ctx.fillRect(x + subWidth, height - bhCr, subWidth, bhCr);
    } else {
      // Overlay mode: draw ghost first, active second
      if (isComparingOriginal) {
        ctx.fillStyle = colorCr;
        ctx.fillRect(x, height - bhCr, barWidth, bhCr);
        ctx.fillStyle = colorOrig;
        ctx.fillRect(x, height - bhOrig, barWidth, bhOrig);
      } else {
        ctx.fillStyle = colorOrig;
        ctx.fillRect(x, height - bhOrig, barWidth, bhOrig);
        ctx.fillStyle = colorCr;
        ctx.fillRect(x, height - bhCr, barWidth, bhCr);
      }
    }
    x += barWidth + 1;
  }

  visDrawId = requestAnimationFrame(drawVisualizer);
}

function toggleAB() {
  if (!previewCtx) return;
  isComparingOriginal = !isComparingOriginal;
  const now = previewCtx.currentTime;

  gainOriginal.gain.setTargetAtTime(isComparingOriginal ? 1 : 0, now, 0.04);
  gainCrunched.gain.setTargetAtTime(isComparingOriginal ? 0 : 1, now, 0.04);

  abStatus.textContent = isComparingOriginal ? 'ORIGINAL' : 'CRUNCHED';
  btnAB.classList.toggle('active', isComparingOriginal);
}

async function togglePreview() {
  if (btnPreview.classList.contains('playing')) {
    stopPreview();
    return;
  }

  if (state.files.size === 0) return;

  btnPreview.disabled = true;

  try {
    const firstValidEntry = state.files.entries().next().value;
    if (!firstValidEntry) return;

    const [id, file] = firstValidEntry;
    const rawBuffer = await file.arrayBuffer();

    if (!previewCtx) previewCtx = new AudioContext();
    if (previewCtx.state === 'suspended') await previewCtx.resume();
    
    let decoded;
    try {
      decoded = await previewCtx.decodeAudioData(rawBuffer);
    } catch (err) {
      throw new Error(`Cannot decode "${file.name}" — unsupported or corrupt file.`);
    }

    const targetRate = Math.min(Math.max(state.sampleRate, 3000), 48000);
    const numChannelsOriginal = Math.min(decoded.numberOfChannels, 2);
    const numChannelsProcess = state.stereo ? numChannelsOriginal : 1;

    // IMPROVEMENT 6: safeOfflineCtx
    const offCtx = safeOfflineCtx(
      numChannelsOriginal,
      Math.ceil(decoded.duration * targetRate),
      targetRate
    );

    const src = offCtx.createBufferSource();
    src.buffer = decoded;
    // Main render is now DRY (no filters) so bufOriginal stays clean
    src.connect(offCtx.destination);
    src.start(0);

    const resampledDry = await offCtx.startRendering();
    previewResampled = resampledDry;

    // Apply filters to a separate buffer for the crunched path
    // Pass numChannelsProcess to handle downmixing if needed
    const resampledWet = await renderFilteredBuffer(resampledDry, {
      hpf: state.hpf,
      lpf: state.lpf,
      bass: state.bass,
      playbackRate: state.playbackRate
    }, numChannelsProcess);

    lastRenderParams = {
      sampleRate: state.sampleRate,
      hpf: state.hpf,
      lpf: state.lpf,
      bass: state.bass,
      stereo: state.stereo,
      playbackRate: state.playbackRate
    };

    const bufCrunched = previewCtx.createBuffer(numChannelsProcess, resampledDry.length, targetRate);
    const bufOriginal = previewCtx.createBuffer(numChannelsOriginal, resampledDry.length, targetRate);

    // 1. Fill Original track with DRY samples (keeps original channel count)
    for (let ch = 0; ch < numChannelsOriginal; ch++) {
      bufOriginal.getChannelData(ch).set(resampledDry.getChannelData(ch));
    }

    // 2. Fill Crunched track with WET samples + processDSP (might be mono)
    for (let ch = 0; ch < numChannelsProcess; ch++) {
      const wetData = resampledWet.getChannelData(ch);
      const samples = new Float32Array(wetData);
      processDSP(samples, state.bitDepth, state.crushMode, state.grit, state.noise);

      // IMPROVEMENT 2: Normalization
      if (state.normalize) {
        normalizeBuffer(samples);
      }

      bufCrunched.getChannelData(ch).set(samples);
    }

    gainCrunched = previewCtx.createGain();
    gainOriginal = previewCtx.createGain();
    gainCrunched.connect(previewCtx.destination);
    gainOriginal.connect(previewCtx.destination);

    analyserCrunched = previewCtx.createAnalyser();
    analyserOriginal = previewCtx.createAnalyser();
    analyserCrunched.fftSize = 512;
    analyserOriginal.fftSize = 512;

    // Connect analysers pre-gain so they always have data for Dual View
    // (Regardless of A/B toggle gain)
    gainCrunched.gain.value = 1;
    gainOriginal.gain.value = 0;

    const startTime = previewCtx.currentTime + 0.1;

    previewSource = previewCtx.createBufferSource();
    previewSource.buffer = bufCrunched;
    previewSource.connect(gainCrunched);
    previewSource.connect(analyserCrunched); // Pre-gain data

    previewSourceOrig = previewCtx.createBufferSource();
    previewSourceOrig.buffer = bufOriginal;
    previewSourceOrig.connect(gainOriginal);
    previewSourceOrig.connect(analyserOriginal); // Pre-gain data

    previewSource.onended = stopPreview;

    previewStartTime = previewCtx.currentTime;
    previewDecoded = decoded;

    const safeOffset = 0; 
    previewSource.start(startTime, safeOffset);
    previewSourceOrig.start(startTime, safeOffset);

    btnPreview.classList.add('playing');
    btnPreviewLbl.textContent = 'STOP';
    previewIcon.textContent = '■';
    abContainer.style.display = 'flex';

    dropContent.style.display = 'none';
    visualizer.style.display = 'block';
    visualizer.classList.add('visualizer-glow');
    drawVisualizer();

    log(`previewing: ${file.name} (A/B mode active)`, 'accent');

  } catch (err) {
    log(`preview error: ${err.message}`, 'error');
    showToast('❌ preview failed', 'error');
  } finally {
    btnPreview.disabled = false;
  }
}

function updatePresetUI(type) {
  btnPresetAuthor.classList.toggle('active', type === 'author');
  btnPresetUser.classList.toggle('active', type === 'user');
}

btnPresetAuthor.addEventListener('click', () => {
  syncBitDepth(8);
  syncSampleRate(22050);
  syncGrit(1.0);
  syncNoise(0);
  syncHpf(20);
  syncLpf(20000);
  syncBass(0);
  if (!state.crushMode) btnMarioToggle.click();
  if (state.stereo) btnStereoToggle.click();
  if (!state.normalize) btnNormalizeToggle.click(); // Default author is normalized
  updatePresetUI('author');
  log('preset: LO-Q (author default)', 'accent');
  showToast('◉ author preset loaded', 'info');
  saveState();
});

btnPresetUser.addEventListener('click', () => {
  const saved = localStorage.getItem('ogcruncher_preset');
  if (!saved) return;
  const p = JSON.parse(saved);
  applyParamsToUI(p);
  updatePresetUI('user');
  log('preset: MY PRESET (user custom)', 'accent');
  showToast('👤 custom preset loaded', 'info');
});

btnSaveCustom.addEventListener('click', () => {
  const preset = {
    bitDepth: state.bitDepth,
    sampleRate: state.sampleRate,
    crushMode: state.crushMode,
    grit: state.grit,
    noise: state.noise,
    stereo: state.stereo,
    hpf: state.hpf,
    lpf: state.lpf,
    bass: state.bass,
    normalize: state.normalize,
    ts: Date.now()
  };
  localStorage.setItem('ogcruncher_preset', JSON.stringify(preset));

  btnPresetUser.disabled = false;
  userPresetMeta.textContent = `${preset.bitDepth}-bit / ${preset.sampleRate}Hz`;

  updatePresetUI('user');
  log('custom preset saved to localstorage', 'ok');
  showToast('💾 custom preset saved', 'ok');
});

btnProcess.addEventListener('click', startProcessing);
btnPreview.addEventListener('click', togglePreview);
btnAB.addEventListener('click', toggleAB);
btnClearQueue.addEventListener('click', clearQueue);

function requestPreviewUpdate() {
  if (!btnPreview.classList.contains('playing') || !previewDecoded) return;

  clearTimeout(liveUpdateTimer);
  liveUpdateTimer = setTimeout(async () => {
    if (isUpdatingPreview) return;
    isUpdatingPreview = true;

    try {
      const decoded = previewDecoded;
      const targetRate = Math.min(Math.max(state.sampleRate, 4000), 48000);
      const numChannelsOriginal = Math.min(decoded.numberOfChannels, 2);
      const numChannelsProcess = state.stereo ? numChannelsOriginal : 1;

      const needsDryRender = !previewResampled ||
        lastRenderParams.sampleRate !== state.sampleRate ||
        lastRenderParams.playbackRate !== state.playbackRate ||
        lastRenderParams.numChannelsOriginal !== numChannelsOriginal;

      const needsWetRender = needsDryRender ||
        lastRenderParams.hpf !== state.hpf ||
        lastRenderParams.lpf !== state.lpf ||
        lastRenderParams.bass !== state.bass ||
        lastRenderParams.stereo !== state.stereo; // Stereo toggle affects wet render (downmixing)

      if (needsDryRender) {
        const offCtx = safeOfflineCtx(
          numChannelsOriginal,
          Math.ceil((decoded.duration / state.playbackRate) * targetRate),
          targetRate
        );
        const src = offCtx.createBufferSource();
        src.buffer = decoded;
        src.connect(offCtx.destination); // Dry
        src.start(0);
        previewResampled = await offCtx.startRendering();
      }

      let resampledWet;
      if (needsWetRender) {
        resampledWet = await renderFilteredBuffer(previewResampled, {
          hpf: state.hpf,
          lpf: state.lpf,
          bass: state.bass
        }, numChannelsProcess);
      } else {
        // Only DSP params changed, reuse wet buffer
        // Note: we need a fresh copy for processDSP if we were to cache it,
        // but since processDSP is in-place, we re-render wet for simplicity
        resampledWet = await renderFilteredBuffer(previewResampled, {
          hpf: state.hpf,
          lpf: state.lpf,
          bass: state.bass
        }, numChannelsProcess);
      }

      lastRenderParams = {
        sampleRate: state.sampleRate,
        playbackRate: state.playbackRate,
        hpf: state.hpf,
        lpf: state.lpf,
        bass: state.bass,
        stereo: state.stereo,
        numChannelsOriginal: numChannelsOriginal
      };

      const resampledDry = previewResampled;
      const bufCrunched = previewCtx.createBuffer(numChannelsProcess, resampledDry.length, resampledDry.sampleRate);
      const bufOriginal = previewCtx.createBuffer(numChannelsOriginal, resampledDry.length, resampledDry.sampleRate);

      // 1. Fill Original track with DRY samples
      for (let ch = 0; ch < numChannelsOriginal; ch++) {
        bufOriginal.getChannelData(ch).set(resampledDry.getChannelData(ch));
      }

      // 2. Fill Crunched track with WET samples + processDSP
      for (let ch = 0; ch < numChannelsProcess; ch++) {
        const wetData = resampledWet.getChannelData(ch);
        const samples = new Float32Array(wetData);
        processDSP(samples, state.bitDepth, state.crushMode, state.grit, state.noise);

        // IMPROVEMENT 2: Normalization
        if (state.normalize) {
          normalizeBuffer(samples);
        }

        bufCrunched.getChannelData(ch).set(samples);
      }

      const oldSource = previewSource;
      const oldSourceOrig = previewSourceOrig;
      const startTime = previewCtx.currentTime + 0.05;

      previewSource = previewCtx.createBufferSource();
      previewSource.buffer = bufCrunched;
      previewSource.playbackRate.value = state.playbackRate;
      previewSource.connect(gainCrunched);
      previewSource.connect(analyserCrunched);

      previewSourceOrig = previewCtx.createBufferSource();
      previewSourceOrig.buffer = bufOriginal;
      previewSourceOrig.playbackRate.value = state.playbackRate;
      previewSourceOrig.connect(gainOriginal);
      previewSourceOrig.connect(analyserOriginal);

      previewSource.onended = stopPreview;

      if (oldSource) {
        oldSource.onended = null;
        try { oldSource.stop(startTime); } catch (e) { }
      }
      if (oldSourceOrig) {
        try { oldSourceOrig.stop(startTime); } catch (e) { }
      }

      const currentPlaybackRate = lastRenderParams.playbackRate || 1.0;
      const freshPos = (previewCtx.currentTime - previewStartTime) * currentPlaybackRate;
      const safeOffset = Math.max(0, freshPos % decoded.duration);
      
      previewSource.start(startTime, safeOffset);
      previewSourceOrig.start(startTime, safeOffset);
      previewStartTime = startTime - (safeOffset / state.playbackRate);

      log(`live update applied (${needsReRender ? 're-rendered' : 're-crunched'})`, 'sys');
    } catch (e) {
      console.error('Live update failed', e);
    } finally {
      isUpdatingPreview = false;
    }
  }, 300);
}

btnLiveUpdate.addEventListener('click', () => {
  state.liveUpdate = !state.liveUpdate;
  btnLiveUpdate.classList.toggle('active', state.liveUpdate);
  const statusEl = $('live-status');
  if (statusEl) statusEl.textContent = state.liveUpdate ? 'ON' : 'OFF';
  log(`live update: ${state.liveUpdate ? 'ON' : 'OFF'}`, 'sys');
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
});

// IMPROVEMENT 5: URL Hash logic
function updateHash() {
  const params = new URLSearchParams();
  params.set('b', state.bitDepth);
  params.set('r', state.sampleRate);
  params.set('g', state.grit);
  params.set('n', state.noise);
  params.set('c', state.crushMode ? 1 : 0);
  params.set('s', state.stereo ? 1 : 0);
  params.set('h', state.hpf);
  params.set('l', state.lpf);
  params.set('bs', state.bass);
  params.set('norm', state.normalize ? 1 : 0);
  params.set('dv', state.dualView ? 1 : 0);
  params.set('sp', state.playbackRate);
  
  // Use replaceState to avoid polluting back button
  history.replaceState(null, '', '#' + params.toString());
}

function parseHash() {
  const hash = window.location.hash.substring(1);
  if (!hash) return;
  
  try {
    const params = new URLSearchParams(hash);
    const p = {};
    if (params.has('b')) p.bitDepth = Math.max(1, Math.min(16, +params.get('b')));
    if (params.has('r')) p.sampleRate = Math.max(4000, Math.min(48000, +params.get('r')));
    if (params.has('g')) p.grit = Math.max(1.0, Math.min(10.0, +params.get('g')));
    if (params.has('n')) p.noise = Math.max(0, Math.min(0.05, +params.get('n')));
    if (params.has('c')) p.crushMode = params.get('c') === '1';
    if (params.has('s')) p.stereo = params.get('s') === '1';
    if (params.has('h')) p.hpf = Math.max(20, Math.min(1000, +params.get('h')));
    if (params.has('l')) p.lpf = Math.max(500, Math.min(20000, +params.get('l')));
    if (params.has('bs')) p.bass = Math.max(0, Math.min(15, +params.get('bs')));
    if (params.has('norm')) p.normalize = params.get('norm') === '1';
    if (params.has('dv')) p.dualView = params.get('dv') === '1';
    if (params.has('sp')) p.playbackRate = Math.max(0.5, Math.min(2.0, +params.get('sp')));
    
    applyParamsToUI(p);
  } catch (e) {
    console.warn('Failed to parse hash', e);
  }
}

/* ════════════════════════════════════════════════════════════════════
   RESIZERS (Windows-style Layout Customization)
   ════════════════════════════════════════════════════════════════════ */
function initResizers() {
  const main = document.querySelector('.app-main');
  const resizerLeft = $('resizer-left');
  const resizerRight = $('resizer-right');
  if (!main || !resizerLeft || !resizerRight) return;

  // Load saved widths
  const savedLeft = localStorage.getItem('og_col_left');
  const savedCenter = localStorage.getItem('og_col_center');
  const savedRight = localStorage.getItem('og_col_right');
  if (savedLeft) main.style.setProperty('--col-left', savedLeft);
  if (savedCenter) main.style.setProperty('--col-center', savedCenter);
  if (savedRight) main.style.setProperty('--col-right', savedRight);

  let activeResizer = null;

  const onMouseDown = (e) => {
    activeResizer = e.currentTarget.dataset.resizer;
    document.body.style.cursor = 'col-resize';
    document.body.classList.add('is-dragging'); // Disable selection
    e.currentTarget.classList.add('dragging');
    // Disable transitions during drag for smoothness
    main.style.transition = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!activeResizer) return;

    const rect = main.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const totalWidth = rect.width;
    
    // Get current grid columns in pixels
    const style = getComputedStyle(main);
    const cols = style.gridTemplateColumns.split(' ');
    const leftPx = parseFloat(cols[0]);

    if (activeResizer === 'left') {
      // Constraint: Left panel [240px ... Total - 600px]
      const newLeft = Math.max(240, Math.min(x, totalWidth - 600));
      main.style.setProperty('--col-left', `${newLeft}px`);
      main.style.setProperty('--col-right', `1fr`); // Let right be flexible
    } else {
      // activeResizer === 'right'
      // x is the absolute position of the right resizer handle
      // Center width = x - (leftWidth + 6)
      const centerStart = leftPx + 6;
      const newCenter = Math.max(320, Math.min(x - centerStart, totalWidth - centerStart - 240));
      main.style.setProperty('--col-center', `${newCenter}px`);
      main.style.setProperty('--col-right', `1fr`); // Let right be flexible
    }
  };

  const onMouseUp = () => {
    if (activeResizer) {
      resizerLeft.classList.remove('dragging');
      resizerRight.classList.remove('dragging');
      main.style.transition = '';

      // Save to localStorage
      const style = getComputedStyle(main);
      const cols = style.gridTemplateColumns.split(' ');
      localStorage.setItem('og_col_left', cols[0]);
      localStorage.setItem('og_col_center', cols[2]);
      localStorage.setItem('og_col_right', cols[4]);
    }
    activeResizer = null;
    document.body.style.cursor = '';
    document.body.classList.remove('is-dragging'); // Re-enable selection
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  resizerLeft.addEventListener('mousedown', onMouseDown);
  resizerRight.addEventListener('mousedown', onMouseDown);
}

(function init() {
  syncBitDepth(8);
  syncSampleRate(22050);
  syncGrit(1.0);
  syncNoise(0);
  syncSpeed(1.0);
  syncHpf(20);
  syncLpf(20000);
  syncBass(0);
  
  // Default normalize ON
  state.normalize = true;
  if (btnNormalizeToggle) {
    btnNormalizeToggle.setAttribute('aria-checked', true);
    btnNormalizeToggle.classList.add('active');
  }
  
  // Default Live Update UI
  if (btnLiveUpdate) {
    btnLiveUpdate.classList.add('active');
    const statusEl = $('live-status');
    if (statusEl) statusEl.textContent = 'ON';
  }

  const saved = localStorage.getItem('ogcruncher_preset');
  if (saved) {
    const p = JSON.parse(saved);
    btnPresetUser.disabled = false;
    userPresetMeta.textContent = `${p.bitDepth}-bit / ${p.sampleRate}Hz`;
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
  }

  loadState();
  parseHash(); // Hash takes priority
  initResizers(); // Initialize layout customization
  
  log('ready. drop files or click browse.', 'ok');
  setBadge('IDLE', 'badge--amber');

  btnLoadDemo.addEventListener('click', (e) => {
    e.stopPropagation();
    loadDemoTrack();
  });
})();

window.addEventListener('keydown', (e) => {
  if ((e.target.tagName === 'INPUT' && e.target.type !== 'range') || e.target.tagName === 'TEXTAREA') return;

  if (e.code === 'Space') {
    e.preventDefault();
    if (!btnPreview.disabled) btnPreview.click();
  } else if (e.code === 'Enter') {
    e.preventDefault();
    if (!btnProcess.disabled) btnProcess.click();
  } else if (e.code === 'KeyC') {
    if (abContainer.style.display !== 'none') btnAB.click();
  } else if (e.code === 'KeyN') {
    btnLiveUpdate.click();
  }
});
