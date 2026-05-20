/**
 * OGCruncher — Processing Queue
 * by figarist · https://figarist.github.io
 */

'use strict';

import { state } from './state.js';
import { log, showToast, formatBytes, setBadge } from './utils.js';
import { buildFilterChain, safeOfflineCtx } from './dsp.js';
import { stopPreview } from './preview.js';
import DSPWorker from './dsp.worker.js?worker&type=classic';

/* ════════════════════════════════════════════════════════════════════
   DOM REFS (Initialized via initQueue)
   ════════════════════════════════════════════════════════════════════ */
let _dom = {};
let clippingBatchCount = 0;
const _blobRegistry = new Map(); // Maps objectURL -> File for DAW drag support

// ── DSP Worker ────────────────────────────────────────────────────────────
let _worker = null;

function getWorker() {
  if (!_worker) {
    _worker = new DSPWorker();
  }
  return _worker;
}

export function initQueue(dom) {
  _dom = dom;
}

/* ════════════════════════════════════════════════════════════════════
   REGISTRY MANAGEMENT
   ════════════════════════════════════════════════════════════════════ */

function registerBlob(url, file) {
  _blobRegistry.set(url, file);
}

function revokeAllBlobs() {
  _blobRegistry.forEach((file, url) => URL.revokeObjectURL(url));
  _blobRegistry.clear();
}

/* ════════════════════════════════════════════════════════════════════
   FILE HANDLING
   ════════════════════════════════════════════════════════════════════ */

export function addFiles(files) {
  if (state.processing) return;
  
  const existingNames = new Set(
    [...state.files.values()].map(f => `${f.name}::${f.size}`)
  );

  let added = 0;
  for (const file of files) {
    const key = `${file.name}::${file.size}`;
    if (existingNames.has(key)) continue; // skip duplicate
    existingNames.add(key);
    const id = state.nextId++;
    state.files.set(id, file);
    renderQueueItem(id, file);
    added++;
  }

  if (added > 0) {
    updateQueueUI();
    log(`${added} file(s) added. Queue: ${state.files.size} total.`, 'sys');
  }
}

export function clearQueue() {
  if (state.processing) return;
  if (_worker) { _worker.terminate(); _worker = null; }

  stopPreview();

  state.files.clear();
  _dom.fileQueue.innerHTML = '';
  _dom.resultsArea.innerHTML = '';
  _dom.resultsArea.hidden = true;
  revokeAllBlobs();
  updateQueueUI();
  log('Queue cleared.', 'sys');
}

function updateQueueUI() {
  const hasFiles = state.files.size > 0;
  _dom.queueHeader.hidden = !hasFiles;
  _dom.btnProcess.disabled = !hasFiles;
  _dom.btnPreview.disabled = !hasFiles;
  _dom.resultsArea.hidden = _dom.resultsArea.innerHTML === '';
  updateSavingsEstimate();
}

export function updateSavingsEstimate() {
  const container = document.getElementById('savings-estimate');
  const outOriginalSize = document.getElementById('savings-original-size');
  const outEstimatedWav = document.getElementById('savings-estimated-wav');
  const outEstimatedOgg = document.getElementById('savings-estimated-ogg');
  const outPctWav = document.getElementById('savings-pct-wav');
  const outPctOgg = document.getElementById('savings-pct-ogg');
  const outPctBadge = document.getElementById('savings-pct-badge');

  if (!container) return;

  if (state.files.size === 0) {
    container.style.display = 'none';
    return;
  }

  let totalOriginal = 0;
  let totalEstimatedWav = 0;
  let totalEstimatedOgg = 0;

  state.files.forEach(file => {
    totalOriginal += file.size;

    // Estimate duration of file based on extension and size
    const ext = file.name.split('.').pop().toLowerCase();
    let assumedBps = 1411200; // standard 16-bit 44.1kHz stereo WAV
    if (ext === 'mp3') assumedBps = 192000;
    else if (ext === 'ogg') assumedBps = 128000;
    else if (ext === 'flac') assumedBps = 800000;
    else if (ext === 'm4a' || ext === 'aac') assumedBps = 160000;

    const duration = file.size / (assumedBps / 8);

    // Target configuration
    const targetRate = state.sampleRate;
    const targetBits = state.bitDepth;
    const targetChannels = state.stereo ? 2 : 1;

    // Estimated WAV Size: 44 bytes header + PCM data
    const targetWavSize = 44 + duration * targetRate * targetChannels * (targetBits / 8);
    totalEstimatedWav += targetWavSize;

    // Estimated OGG/MP3 Size (Compressed target)
    // Scale target bitrate with samplerate and channels
    let oggBitrate = 64000; // standard at 44.1kHz stereo
    if (targetRate < 16000) oggBitrate = 24000;
    else if (targetRate < 32000) oggBitrate = 48000;

    if (targetChannels === 1) oggBitrate *= 0.6; // lower bitrate for mono

    const targetOggSize = (duration * oggBitrate) / 8;
    totalEstimatedOgg += targetOggSize;
  });

  if (totalOriginal <= 0) {
    container.style.display = 'none';
    return;
  }

  // Calculate percentage savings
  const pctWav = Math.max(0, Math.round(((totalOriginal - totalEstimatedWav) / totalOriginal) * 100));
  const pctOgg = Math.max(0, Math.round(((totalOriginal - totalEstimatedOgg) / totalOriginal) * 100));

  // Determine global badge percentage (max of the savings, usually OGG)
  const maxPct = Math.max(pctWav, pctOgg);

  outOriginalSize.textContent = formatBytes(totalOriginal);
  outEstimatedWav.textContent = formatBytes(totalEstimatedWav);
  outEstimatedOgg.textContent = formatBytes(totalEstimatedOgg);

  // Set detailed labels
  if (totalEstimatedWav >= totalOriginal) {
    outPctWav.textContent = '+0%';
    outPctWav.style.color = 'var(--text-muted)';
  } else {
    outPctWav.textContent = `-${pctWav}%`;
    outPctWav.style.color = 'var(--accent-primary)';
  }

  if (totalEstimatedOgg >= totalOriginal) {
    outPctOgg.textContent = '+0%';
    outPctOgg.style.color = 'var(--text-muted)';
  } else {
    outPctOgg.textContent = `-${pctOgg}%`;
    outPctOgg.style.color = 'var(--accent-plum)';
  }

  // Set global badge
  if (maxPct > 0) {
    outPctBadge.textContent = `-${maxPct}% SPACE`;
    outPctBadge.className = 'badge badge--green badge--pulse-green';
  } else {
    outPctBadge.textContent = 'NO SAVINGS';
    outPctBadge.className = 'badge badge--amber';
  }

  container.style.display = 'block';
}

function renderQueueItem(id, file) {
  const li = document.createElement('li');
  li.className = 'queue-item';
  li.id = `queue-item-${id}`;
  li.innerHTML = `
    <span class="queue-item-name">${file.name}</span>
    <span class="queue-item-meta">${formatBytes(file.size)}</span>
    <span class="queue-item-status" id="status-${id}">WAITING</span>
    <button class="btn-remove" title="Remove from queue">✕</button>
  `;
  
  li.querySelector('.btn-remove').addEventListener('click', () => {
    state.files.delete(id);
    li.remove();
    stopPreview();
    updateQueueUI();
  });
  
  _dom.fileQueue.appendChild(li);
}

function setItemState(id, type, icon) {
  const statusEl = document.getElementById(`status-${id}`);
  if (!statusEl) return;
  statusEl.className = `queue-item-status status--${type}`;
  statusEl.textContent = icon;
}

/* ════════════════════════════════════════════════════════════════════
   PROCESSING ENGINE
   ════════════════════════════════════════════════════════════════════ */

export async function startProcessing(setProgress) {
  if (state.processing || state.files.size === 0) return;
  
  state.processing = true;
  if (_dom.panelCenter) {
    _dom.panelCenter.classList.add('panel--disabled');
  }
  _dom.btnProcess.disabled = true;
  _dom.btnProcessLbl.textContent = 'CRUNCHING...';
  _dom.resultsArea.innerHTML = '';
  _dom.resultsArea.hidden = false;
  _dom.progressWrap.hidden = false;
  clippingBatchCount = 0;
  
  setBadge('PROCESSING', 'badge--amber');
  log('Starting batch process...', 'accent');
  
  const validFiles = Array.from(state.files.entries());
  let processedCount = 0;

  try {
    for (const [id, file] of validFiles) {
      const result = await processFile(file, id, setProgress, processedCount, validFiles.length);
      if (result) {
        renderResult(result);
        processedCount++;
      }
    }
  } finally {
    state.processing = false;
    if (_dom.panelCenter) {
      _dom.panelCenter.classList.remove('panel--disabled');
    }
    _dom.btnProcess.disabled = false;
    _dom.btnProcessLbl.textContent = 'CRUNCH';
    _dom.progressWrap.hidden = true;
    if (_worker) { _worker.terminate(); _worker = null; }
    
    if (processedCount > 0) {
      setProgress(100, 'Complete!');
      log(`Batch complete. ${processedCount} files processed.`, 'ok');
      showToast(`✅ ${processedCount} files crunched!`, 'ok');
      setBadge('DONE', 'badge--green');
      if (clippingBatchCount > 0) {
        showToast(`⚠ Clipping in ${clippingBatchCount} files!`, 'error');
      }
    } else {
      setProgress(0, '');
      setBadge('IDLE', 'badge--amber');
    }
  }
}

async function processFile(file, id, setProgress, fileIndex, fileTotal) {
  setItemState(id, 'processing', '⟳');
  log(`Processing: ${file.name}`, 'accent');

  try {
    // ── MAIN THREAD: decode ──────────────────────────────────────────────
    const rawBuffer = await file.arrayBuffer();
    const decodeCtx = new AudioContext();
    let decoded;
    try {
      decoded = await decodeCtx.decodeAudioData(rawBuffer);
    } catch (err) {
      throw new Error(`Cannot decode "${file.name}" — unsupported or corrupt file.`);
    } finally {
      await decodeCtx.close();
    }

    const targetRate = Math.min(Math.max(state.sampleRate, 4000), 48000);
    const numChannels = state.stereo ? Math.min(decoded.numberOfChannels, 2) : 1;
    const targetPlaybackRate = state.playbackRate || 1.0;

    // ── MAIN THREAD: resample + filter (OfflineAudioContext) ─────────────
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

    // Extract channels into separate Float32Arrays for transfer
    const channels = [];
    for (let ch = 0; ch < numChannels; ch++) {
      channels.push(new Float32Array(resampled.getChannelData(ch)));
    }

    log(`  Decoded: ${decoded.numberOfChannels}ch → ${numChannels}ch | ${decoded.sampleRate}Hz → ${resampled.sampleRate}Hz`, 'sys');
    setProgress(
      (fileIndex / fileTotal) * 100 + (1 / fileTotal) * 5,
      `File ${fileIndex + 1}/${fileTotal} — Sending to worker…`
    );

    // ── WORKER: DSP + encode ─────────────────────────────────────────────
    const result = await new Promise((resolve, reject) => {
      const worker = getWorker();

      worker.onmessage = (e) => {
        const msg = e.data;
        if (msg.type === 'progress') {
          const filePct = msg.pct / 100;
          const overallPct = (fileIndex / fileTotal + filePct / fileTotal) * 100;
          setProgress(overallPct, `File ${fileIndex + 1}/${fileTotal} — ${msg.label}`);
        } else if (msg.type === 'done') {
          resolve(msg);
        } else if (msg.type === 'error') {
          reject(new Error(msg.message));
        }
      };

      worker.onerror = (err) => {
        console.error('Worker global error:', err);
        reject(new Error(err.message || 'Worker global error (network/syntax)'));
      };

      worker.postMessage({
        type: 'process',
        channels,
        sampleRate: resampled.sampleRate,
        bitDepth: state.bitDepth,
        crushMode: state.crushMode,
        dither: state.dither,
        grit: state.grit,
        noise: state.noise,
        normalize: state.normalize,
        bitDepthOriginal: state.bitDepth,
        fileName: file.name,
      }, channels.map(ch => ch.buffer));
    });

    // ── MAIN THREAD: create Blobs from returned ArrayBuffers ─────────────
    const blobOGG = new Blob([result.ogg], { type: 'audio/ogg' });
    const blobWAV = new Blob([result.wav], { type: 'audio/wav' });
    const blobMP3 = new Blob([result.mp3], { type: 'audio/mp3' });

    if (result.hasClipping) {
      log(`⚠ clipping detected in "${file.name}" — reduce Grit or enable Normalize`, 'error');
      clippingBatchCount++;
    }

    const stem = file.name.replace(/\.[^.]+$/, '');
    const outNameBase = `${stem}_crunched_${state.bitDepth}bit_${resampled.sampleRate}hz`;
    const sizeOGG = formatBytes(blobOGG.size);
    const sizeWAV = formatBytes(blobWAV.size);
    const sizeMP3 = formatBytes(blobMP3.size);

    log(`  ✅ Done: ${file.name} [OGG: ${sizeOGG} | WAV: ${sizeWAV} | MP3: ${sizeMP3}]`, 'ok');
    setItemState(id, 'done', '✓');

    return {
      name: outNameBase,
      formats: [
        { ext: 'ogg', url: URL.createObjectURL(blobOGG), size: sizeOGG, blob: blobOGG },
        { ext: 'wav', url: URL.createObjectURL(blobWAV), size: sizeWAV, blob: blobWAV },
        { ext: 'mp3', url: URL.createObjectURL(blobMP3), size: sizeMP3, blob: blobMP3 },
      ],
    };

  } catch (err) {
    console.error('Process error:', err);
    const msg = err.message || err.name || String(err);
    log(`  ❌ Error: ${file.name}: ${msg}`, 'error');
    setItemState(id, 'error', '✗');
    return null;
  }
}

function renderResult(res) {
  const div = document.createElement('div');
  div.className = 'result-item';
  div.innerHTML = `
    <div class="result-header">
      <span class="result-name">${res.name}</span>
      <span class="daw-hint">DRAG TO DAW:</span>
    </div>
    <div class="result-links"></div>
  `;
  
  const links = div.querySelector('.result-links');
  res.formats.forEach(f => {
    const a = document.createElement('a');
    a.href = f.url;
    a.download = `${res.name}.${f.ext}`;
    a.className = 'btn btn--ghost btn--xs btn-download';
    a.innerHTML = `<span>.${f.ext.toUpperCase()}</span> <small>${f.size}</small>`;
    
    // DAW Drag support
    a.draggable = true;
    a.dataset.url = f.url;
    
    const file = new File([f.blob], `${res.name}.${f.ext}`, { type: f.blob.type });
    registerBlob(f.url, file);

    a.addEventListener('dragstart', handleDragStart);
    links.appendChild(a);
  });
  
  _dom.resultsArea.appendChild(div);
  _dom.resultsArea.hidden = false;
}

function handleDragStart(e) {
  const url = e.target.dataset.url;
  const file = _blobRegistry.get(url);
  
  if (file && e.dataTransfer.items) {
    e.dataTransfer.items.add(file);
    e.dataTransfer.effectAllowed = 'copy';
    log(`Dragging ${file.name} to DAW...`, 'sys');
  } else {
    const downloadUrl = `audio/ogg:${e.target.download}:${e.target.href}`;
    e.dataTransfer.setData('DownloadURL', downloadUrl);
  }
}

/* ════════════════════════════════════════════════════════════════════
   DEMO TRACK
   ════════════════════════════════════════════════════════════════════ */

export async function loadDemoTrack() {
  if (state.processing) return;
  _dom.btnLoadDemo.disabled = true;
  _dom.btnLoadDemo.textContent = 'LOADING...';
  
  try {
    const response = await fetch('demo.mp3');
    if (!response.ok) throw new Error('Demo track not found');
    const blob = await response.blob();
    const file = new File([blob], 'demo.mp3', { type: 'audio/mpeg' });
    
    addFiles([file]);
    log('Demo track loaded successfully.', 'ok');
    log('Music by Oleksii Holubiev (Pixabay)', 'sys');
    showToast('🎵 Demo track loaded!', 'info');
  } catch (err) {
    log('Failed to load demo track.', 'error');
    showToast('⚠ Demo track unavailable', 'error');
  } finally {
    _dom.btnLoadDemo.disabled = false;
    _dom.btnLoadDemo.textContent = 'TRY DEMO TRACK';
  }
}

async function readAllEntries(reader) {
  const all = [];
  while (true) {
    const batch = await new Promise((res, rej) => reader.readEntries(res, rej));
    if (!batch.length) break;
    all.push(...batch);
  }
  return all;
}

async function traverseEntry(entry, out) {
  if (entry.isFile) {
    const file = await new Promise(res => entry.file(res));
    if (file.type.startsWith('audio/') || /\.(wav|mp3|flac|ogg|aiff?|m4a)$/i.test(file.name)) {
      out.push(file);
    }
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    const entries = await readAllEntries(reader);
    for (const e of entries) await traverseEntry(e, out);
  }
}

export async function handleItems(items) {
  const allFiles = [];
  for (const item of items) {
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
      if (entry) {
        await traverseEntry(entry, allFiles);
      } else {
        // Fallback for browsers without FileSystem API
        const file = item.getAsFile();
        if (file && (file.type.startsWith('audio/') || /\.(wav|mp3|flac|ogg|aiff?|m4a)$/i.test(file.name))) {
          allFiles.push(file);
        }
      }
    }
  }
  if (allFiles.length > 0) addFiles(allFiles);
}
