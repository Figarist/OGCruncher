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
  grit: 1.5,
  noise: 0.0,
  stereo: false,
  hpf: 20,
  lpf: 20000,
  bass: 0,
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
const btnPreview     = $('btn-preview');
const btnPreviewLbl  = $('btn-preview-label');
const btnAB          = $('btn-ab');
const abStatus       = $('ab-status');
const previewIcon    = $('preview-icon');
const btnSpinner     = $('btn-spinner');
const btnClearQueue  = $('btn-clear-queue');
const btnPresetAuthor = $('btn-preset-author');
const btnPresetUser   = $('btn-preset-user');
const btnSaveCustom   = $('btn-save-custom');
const userPresetMeta  = $('preset-user-meta');
const btnMarioToggle = $('toggle-mariomode');
const btnStereoToggle = $('toggle-stereo');
const sliderBit      = $('slider-bitdepth');
const sliderSr       = $('slider-samplerate');
const sliderGrit     = $('slider-grit');
const sliderNoise    = $('slider-noise');
const outBit         = $('out-bitdepth');
const outSr          = $('out-samplerate');
const outGrit        = $('out-grit');
const outNoise       = $('out-noise');
const outMario       = $('out-mariomode');
const outStereo      = $('out-stereo');
const abContainer    = $('ab-container');
const sliderHpf      = $('slider-hpf');
const sliderLpf      = $('slider-lpf');
const sliderBass     = $('slider-bass');
const outHpf         = $('out-hpf');
const outLpf         = $('out-lpf');
const outBass        = $('out-bass');
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

function syncGrit(val) {
  state.grit = +val;
  sliderGrit.value = val;
  outGrit.textContent = val;
  updateSliderTrack(sliderGrit);
}

function syncNoise(val) {
  state.noise = +val;
  sliderNoise.value = val;
  outNoise.textContent = val;
  updateSliderTrack(sliderNoise);
}

function syncHpf(val) {
  state.hpf = +val;
  sliderHpf.value = val;
  outHpf.textContent = val > 20 ? `${val} Hz` : '20 Hz';
  updateSliderTrack(sliderHpf);
}

function syncLpf(val) {
  state.lpf = +val;
  sliderLpf.value = val;
  outLpf.textContent = val < 20000 ? `${val} Hz` : 'OFF';
  updateSliderTrack(sliderLpf);
}

function syncBass(val) {
  state.bass = +val;
  sliderBass.value = val;
  outBass.textContent = val > 0 ? `+${val} dB` : '0 dB';
  updateSliderTrack(sliderBass);
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
    btnPreview.disabled = false;
    log(`${state.files.length} file(s) in queue.`, 'info');
  }
}

function clearQueue() {
  state.files = [];
  fileQueue.innerHTML = '';
  queueHeader.hidden = true;
  btnProcess.disabled = true;
  btnPreview.disabled = true;
  stopPreview();
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
 * @param {number}       grit      — saturation drive amount (1.0-10.0)
 * @param {number}       noise     — white noise floor level (0.0-0.05)
 */
function processDSP(buf, bitDepth, crushMode, grit = 1.5, noise = 0.0) {
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
  // Matches: samples * grit → tanh → scale
  for (let i = 0; i < N; i++) {
    buf[i] = Math.tanh(buf[i] * grit);
  }
}

/* ════════════════════════════════════════════════════════════════════
   OGG VORBIS ENCODER
   Encodes a Float32Array (mono, [-1,1]) → OGG Blob using OggVorbisEncoder.js
   ════════════════════════════════════════════════════════════════════ */
function encodeOGG(channels, sampleRate) {
  // Quality 0.0 equals roughly Vorbis quality 0 (similar to -q:a 0)
  // OggVorbisEncoder quality is from -0.1 to 1.0
  const numChannels = channels.length;
  const encoder = new OggVorbisEncoder(sampleRate, numChannels, 0.0);
  
  // Encode in chunks to prevent Emscripten OOM (TOTAL_MEMORY limit)
  const CHUNK_SIZE = 65536; // 64k samples per chunk
  const totalSamples = channels[0].length;

  for (let i = 0; i < totalSamples; i += CHUNK_SIZE) {
    const chunkEnd = Math.min(i + CHUNK_SIZE, totalSamples);
    const chunks = channels.map(ch => ch.subarray(i, chunkEnd));
    encoder.encode(chunks);
  }
  
  return encoder.finish(); // Returns a Blob
}

/* ════════════════════════════════════════════════════════════════════
   WAV ENCODER
   Encodes a Float32Array (mono, [-1,1]) → WAV Blob
   ════════════════════════════════════════════════════════════════════ */
function encodeWAV(channels, sampleRate, bitDepth) {
  const numChannels = channels.length;
  const numSamples = channels[0].length;
  const bytesPerSample = bitDepth === 16 ? 2 : 1;
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
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * blockAlign, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let s = Math.max(-1, Math.min(1, channels[ch][i]));
      if (bitDepth === 16) {
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
  
  // Prepare Int16 buffers
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
    const numChannels = state.stereo ? Math.min(decoded.numberOfChannels, 2) : 1;

    // OfflineAudioContext for high-quality resampling
    const offCtx = new OfflineAudioContext(
      numChannels,
      Math.ceil(decoded.duration * targetRate),
      targetRate
    );

    const src = offCtx.createBufferSource();
    src.buffer = decoded;

    // ── BIQUAD FILTERS ──────────────────────────────────────────
    let lastNode = src;

    if (state.hpf > 20) {
      const hpf = offCtx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = state.hpf;
      lastNode.connect(hpf);
      lastNode = hpf;
    }
    if (state.lpf < 20000) {
      const lpf = offCtx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = state.lpf;
      lastNode.connect(lpf);
      lastNode = lpf;
    }
    if (state.bass > 0) {
      const bass = offCtx.createBiquadFilter();
      bass.type = 'peaking';
      bass.frequency.value = 80;
      bass.Q.value = 0.7;
      bass.gain.value = state.bass;
      lastNode.connect(bass);
      lastNode = bass;
    }

    lastNode.connect(offCtx.destination);
    src.start(0);

    const resampled = await offCtx.startRendering();
    
    // Process channels
    const channels = [];
    for (let ch = 0; ch < numChannels; ch++) {
      const buf = resampled.getChannelData(ch);
      const samples = new Float32Array(buf);
      processDSP(samples, state.bitDepth, state.crushMode, state.grit, state.noise);
      channels.push(samples);
    }

    log(`  Decoded: ${decoded.numberOfChannels}ch → ${numChannels}ch | ${decoded.sampleRate}Hz → ${targetRate}Hz`, 'sys');

    // ── Encode to Formats ─────────────────────────────────────────────
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
    setItemState(index, 'done', '✓');

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

    // Add Batch Download button if multiple files
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
      
      const canShare = !!navigator.share;
      
      div.innerHTML = `
        <span class="result-item__name" title="${r.name}" style="flex:1; width:100%; margin-bottom:8px;">${r.name}</span>
        <div style="display:flex; gap:8px; width:100%; flex-wrap: wrap;">
          ${r.formats.map(f => `
            <div class="download-group" style="flex: 1; display: flex; gap: 2px;">
              <a href="${f.url}" download="${r.name}.${f.ext}" class="btn-download" aria-label="Download ${f.ext}" title="${f.size}" style="flex:1; text-align:center;">
                ${f.ext.toUpperCase()} <small style="opacity:0.7; font-size:10px;">${f.size}</small>
              </a>
              ${canShare ? `
                <button class="btn-share" onclick="shareFile('${r.name}', '${f.ext}', '${f.url}')" title="Share ${f.ext}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                </button>
              ` : ''}
            </div>
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

// ── Drag & Drop (Folder Support) ──────────────────────────────────
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
      const entries = await new Promise(res => reader.readEntries(res));
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
dropZone.addEventListener('dragover',  e => { e.preventDefault(); });
dropZone.addEventListener('dragleave', e => { if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over'); });

dropZone.addEventListener('drop', async e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  
  if (e.dataTransfer.items) {
    await handleItems(e.dataTransfer.items);
  } else {
    // Fallback for older browsers
    addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/') || /\.(wav|mp3|flac|ogg|aiff?|m4a)$/i.test(f.name)));
  }
});

// Click to browse
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
fileInput.addEventListener('change', () => { addFiles(Array.from(fileInput.files)); fileInput.value = ''; });

// ── Sliders ───────────────────────────────────────────────────────
sliderBit.addEventListener('input', () => syncBitDepth(sliderBit.value));
sliderSr.addEventListener('input',  () => syncSampleRate(sliderSr.value));
sliderGrit.addEventListener('input', () => syncGrit(sliderGrit.value));
sliderNoise.addEventListener('input', () => syncNoise(sliderNoise.value));
sliderHpf.addEventListener('input', () => syncHpf(sliderHpf.value));
sliderLpf.addEventListener('input', () => syncLpf(sliderLpf.value));
sliderBass.addEventListener('input', () => syncBass(sliderBass.value));

// ── Toggle Crush Mode ─────────────────────────────────────────────
btnMarioToggle.addEventListener('click', () => {
  state.crushMode = !state.crushMode;
  btnMarioToggle.setAttribute('aria-checked', state.crushMode);
  btnMarioToggle.classList.toggle('active', state.crushMode);
  outMario.textContent = state.crushMode ? 'ON' : 'OFF';
  log(`Crush mode: ${state.crushMode ? 'ENABLED' : 'DISABLED'}`, 'sys');
});

// ── Toggle Stereo ─────────────────────────────────────────────────
btnStereoToggle.addEventListener('click', () => {
  state.stereo = !state.stereo;
  btnStereoToggle.setAttribute('aria-checked', state.stereo);
  btnStereoToggle.classList.toggle('active', state.stereo);
  outStereo.textContent = state.stereo ? 'STEREO' : 'MONO';
  log(`Output mode: ${state.stereo ? 'STEREO' : 'MONO'}`, 'sys');
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
      URL.revokeObjectURL(url);
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
      // Fallback for text-only sharing
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

// ── Preview Logic ────────────────────────────────────────────────
let previewSource = null;
let previewSourceOrig = null;
let gainCrunched = null;
let gainOriginal = null;
let previewCtx = null;
let isComparingOriginal = false;

async function stopPreview() {
  if (previewSource) { try { previewSource.stop(); } catch(e) {} previewSource = null; }
  if (previewSourceOrig) { try { previewSourceOrig.stop(); } catch(e) {} previewSourceOrig = null; }
  
  btnPreview.classList.remove('playing');
  btnPreviewLbl.textContent = 'PREVIEW';
  previewIcon.textContent = '▶';
  abContainer.style.display = 'none';
  isComparingOriginal = false;
  abStatus.textContent = 'CRUNCHED';
  btnAB.classList.remove('active');
}

function toggleAB() {
  if (!previewCtx) return;
  isComparingOriginal = !isComparingOriginal;
  const now = previewCtx.currentTime;
  
  // Crossfade for smooth transition
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

  if (state.files.length === 0) return;
  
  btnPreview.disabled = true;
  btnPreviewLbl.textContent = 'LOADING…';
  
  try {
    const file = state.files[0];
    const rawBuffer = await file.arrayBuffer();
    
    if (!previewCtx) previewCtx = new (window.AudioContext || window.webkitAudioContext)();
    const decoded = await previewCtx.decodeAudioData(rawBuffer);
    
    const previewLength = Math.min(decoded.duration, 10);
    const targetRate = Math.min(Math.max(state.sampleRate, 4000), 48000);
    const numChannels = state.stereo ? Math.min(decoded.numberOfChannels, 2) : 1;
    
    // Resample via OfflineAudioContext
    const offCtx = new OfflineAudioContext(numChannels, Math.ceil(previewLength * targetRate), targetRate);
    const src = offCtx.createBufferSource();
    src.buffer = decoded;
    
    // Apply filters to preview as well
    let lastNode = src;
    if (state.hpf > 20) {
      const hpf = offCtx.createBiquadFilter();
      hpf.type = 'highpass'; hpf.frequency.value = state.hpf;
      lastNode.connect(hpf); lastNode = hpf;
    }
    if (state.lpf < 20000) {
      const lpf = offCtx.createBiquadFilter();
      lpf.type = 'lowpass'; lpf.frequency.value = state.lpf;
      lastNode.connect(lpf); lastNode = lpf;
    }
    if (state.bass > 0) {
      const bass = offCtx.createBiquadFilter();
      bass.type = 'peaking'; bass.frequency.value = 80; bass.gain.value = state.bass;
      lastNode.connect(bass); lastNode = bass;
    }

    lastNode.connect(offCtx.destination);
    src.start(0);
    
    const resampled = await offCtx.startRendering();
    
    // Create TWO versions
    const bufCrunched = previewCtx.createBuffer(numChannels, resampled.length, targetRate);
    const bufOriginal = previewCtx.createBuffer(numChannels, resampled.length, targetRate);
    
    for (let ch = 0; ch < numChannels; ch++) {
      const data = resampled.getChannelData(ch);
      const samples = new Float32Array(data);
      
      // Original copy
      bufOriginal.getChannelData(ch).set(samples);
      
      // Crunched copy
      processDSP(samples, state.bitDepth, state.crushMode, state.grit, state.noise);
      bufCrunched.getChannelData(ch).set(samples);
    }
    
    // Setup Gains
    gainCrunched = previewCtx.createGain();
    gainOriginal = previewCtx.createGain();
    gainCrunched.connect(previewCtx.destination);
    gainOriginal.connect(previewCtx.destination);
    
    // Initial state: hear crunched
    gainCrunched.gain.value = 1;
    gainOriginal.gain.value = 0;
    
    // Play both in sync
    const startTime = previewCtx.currentTime + 0.1;
    
    previewSource = previewCtx.createBufferSource();
    previewSource.buffer = bufCrunched;
    previewSource.connect(gainCrunched);
    
    previewSourceOrig = previewCtx.createBufferSource();
    previewSourceOrig.buffer = bufOriginal;
    previewSourceOrig.connect(gainOriginal);
    
    previewSource.onended = stopPreview;
    
    previewSource.start(startTime);
    previewSourceOrig.start(startTime);
    
    btnPreview.classList.add('playing');
    btnPreviewLbl.textContent = 'STOP';
    previewIcon.textContent = '■';
    abContainer.style.display = 'flex';
    
    log(`previewing: ${file.name} (A/B mode active)`, 'accent');
    
  } catch (err) {
    log(`preview error: ${err.message}`, 'error');
    showToast('❌ preview failed', 'error');
  } finally {
    btnPreview.disabled = false;
  }
}

// ── Presets ──────────────────────────────────────────────────────
function updatePresetUI(type) {
  btnPresetAuthor.classList.toggle('active', type === 'author');
  btnPresetUser.classList.toggle('active', type === 'user');
}

btnPresetAuthor.addEventListener('click', () => {
  syncBitDepth(8);
  syncSampleRate(22050);
  syncGrit(1.5);
  syncNoise(0);
  syncHpf(20);
  syncLpf(20000);
  syncBass(0);
  if (!state.crushMode) btnMarioToggle.click();
  if (state.stereo) btnStereoToggle.click();
  updatePresetUI('author');
  log('preset: LO-Q (author default)', 'accent');
  showToast('◉ author preset loaded', 'info');
});

btnPresetUser.addEventListener('click', () => {
  const saved = localStorage.getItem('ogcruncher_preset');
  if (!saved) return;
  const p = JSON.parse(saved);
  syncBitDepth(p.bitDepth);
  syncSampleRate(p.sampleRate);
  if (p.grit !== undefined) syncGrit(p.grit);
  if (p.noise !== undefined) syncNoise(p.noise);
  if (p.hpf !== undefined) syncHpf(p.hpf);
  if (p.lpf !== undefined) syncLpf(p.lpf);
  if (p.bass !== undefined) syncBass(p.bass);
  if (state.crushMode !== p.crushMode) btnMarioToggle.click();
  if (p.stereo !== undefined && state.stereo !== p.stereo) btnStereoToggle.click();
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
    ts: Date.now()
  };
  localStorage.setItem('ogcruncher_preset', JSON.stringify(preset));
  
  // Enable button & update label
  btnPresetUser.disabled = false;
  userPresetMeta.textContent = `${preset.bitDepth}-bit / ${preset.sampleRate}Hz`;
  
  updatePresetUI('user');
  log('custom preset saved to localstorage', 'ok');
  showToast('💾 custom preset saved', 'ok');
});

// ── Process button ────────────────────────────────────────────────
btnProcess.addEventListener('click', startProcessing);

// ── Preview button ────────────────────────────────────────────────
btnPreview.addEventListener('click', togglePreview);

// ── A/B button ────────────────────────────────────────────────────
btnAB.addEventListener('click', toggleAB);

// ── Clear queue ───────────────────────────────────────────────────
btnClearQueue.addEventListener('click', clearQueue);

/* ════════════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════════════ */
(function init() {
  syncBitDepth(8);
  syncSampleRate(22050);
  syncGrit(1.5);
  syncNoise(0);
  syncHpf(20);
  syncLpf(20000);
  syncBass(0);

  // Check for saved preset
  const saved = localStorage.getItem('ogcruncher_preset');
  if (saved) {
    const p = JSON.parse(saved);
    btnPresetUser.disabled = false;
    userPresetMeta.textContent = `${p.bitDepth}-bit / ${p.sampleRate}Hz`;
  }

  // PWA service worker registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {/* offline optional */});
  }

  log('ready. drop files or click browse.', 'ok');
  setBadge('IDLE', 'badge--amber');
})();
