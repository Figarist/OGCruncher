/**
 * OGCruncher — queue, metadata estimates and worker orchestration.
 */

'use strict';

import { state, getStateSnapshot } from './state.js';
import { log, showToast, formatBytes, formatSizeChange, setBadge } from './utils.js';
import { buildFilterChain, safeOfflineCtx } from './dsp.js';
import { hashSeed } from './dsp-core.js';
import { stopPreview } from './preview.js';

let _dom = {};
let worker = null;
let activeReject = null;
let cancelRequested = false;
let clippingBatchCount = 0;
let estimateRevision = 0;
const metadata = new Map();
const blobRegistry = new Map();

function getWorker() {
  if (!worker) worker = new Worker(new URL('./dsp.worker.js', import.meta.url));
  return worker;
}

export function initQueue(dom) {
  _dom = dom;
}

function revokeAllBlobs() {
  blobRegistry.forEach((_, url) => URL.revokeObjectURL(url));
  blobRegistry.clear();
}

function clearResults() {
  revokeAllBlobs();
  if (_dom.resultsArea) {
    while (_dom.resultsArea.firstChild) _dom.resultsArea.removeChild(_dom.resultsArea.firstChild);
    _dom.resultsArea.hidden = true;
  }
}

function isAudioFile(file) {
  return file && (String(file.type || '').startsWith('audio/') || /\.(wav|mp3|flac|ogg|aiff?|m4a|aac)$/i.test(file.name));
}

export function addFiles(files) {
  if (state.processing) return;
  const existing = new Set([...state.files.values()].map(file => `${file.name}::${file.size}`));
  let added = 0;
  for (const file of files || []) {
    if (!isAudioFile(file)) continue;
    const key = `${file.name}::${file.size}`;
    if (existing.has(key)) continue;
    existing.add(key);
    const id = state.nextId++;
    state.files.set(id, file);
    renderQueueItem(id, file);
    added++;
  }
  if (added) {
    updateQueueUI();
    log(`${added} file(s) added. Queue: ${state.files.size} total.`, 'sys');
  }
}

export function clearQueue() {
  if (state.processing) return;
  stopPreview();
  state.files.clear();
  metadata.clear();
  if (_dom.fileQueue) while (_dom.fileQueue.firstChild) _dom.fileQueue.removeChild(_dom.fileQueue.firstChild);
  clearResults();
  if (_dom.batchSummary) _dom.batchSummary.textContent = '';
  updateQueueUI();
  log('Queue cleared.', 'sys');
}

function updateQueueUI() {
  const hasFiles = state.files.size > 0;
  if (_dom.queueHeader) _dom.queueHeader.hidden = !hasFiles;
  if (_dom.btnProcess && !state.processing) _dom.btnProcess.disabled = !hasFiles;
  if (_dom.btnPreview && !state.processing) _dom.btnPreview.disabled = !hasFiles;
  updateSavingsEstimate();
}

async function decodeMetadata(id, file, revision) {
  if (metadata.has(id)) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const decoded = await ctx.decodeAudioData((await file.arrayBuffer()).slice(0));
    metadata.set(id, { duration: decoded.duration, channels: decoded.numberOfChannels, sampleRate: decoded.sampleRate });
    await ctx.close();
    if (revision === estimateRevision) updateSavingsEstimate();
  } catch (error) {
    metadata.set(id, null);
    if (revision === estimateRevision) updateSavingsEstimate();
  }
}

function wavEstimate(duration, sampleRate, channels, bitDepth) {
  const frames = Math.ceil((duration / Math.max(.001, state.playbackRate)) * sampleRate);
  const containerBits = bitDepth <= 8 ? 8 : 16;
  const dataBytes = frames * channels * (containerBits / 8);
  return 44 + dataBytes + (dataBytes % 2);
}

function percentChange(output, input) {
  if (!(input > 0) || !Number.isFinite(output)) return '—';
  const percent = Math.round(((output - input) / input) * 100);
  return `${percent > 0 ? '+' : ''}${percent}%`;
}

function setEstimateValue(element, value) {
  if (element) element.textContent = value;
}

/** Estimates are metadata-backed and deliberately show unavailable while decoding. */
export function updateSavingsEstimate() {
  const container = document.getElementById('savings-estimate');
  if (!container) return;
  if (!state.files.size) { container.style.display = 'none'; return; }
  container.style.display = 'block';
  const revision = ++estimateRevision;
  let original = 0;
  let wav = 0;
  let mp3 = 0;
  let oggLow = 0;
  let oggHigh = 0;
  let complete = true;

  state.files.forEach((file, id) => {
    original += file.size;
    const info = metadata.get(id);
    if (!info) { complete = false; return; }
    const duration = info.duration / Math.max(.001, state.playbackRate);
    const channels = state.stereo ? Math.min(info.channels, 2) : 1;
    const rate = state.sampleRate;
    wav += wavEstimate(info.duration, rate, channels, state.bitDepth);
    // MP3 is a nominal 128kbps estimate; OGG quality 0 is content-dependent.
    mp3 += duration * 128000 / 8 + 720;
    oggLow += duration * (channels === 1 ? 24000 : 40000) / 8;
    oggHigh += duration * (channels === 1 ? 96000 : 160000) / 8;
  });

  const originalEl = document.getElementById('savings-original-size');
  const wavEl = document.getElementById('savings-estimated-wav');
  const oggEl = document.getElementById('savings-estimated-ogg');
  const mp3El = document.getElementById('savings-estimated-mp3');
  const wavPct = document.getElementById('savings-pct-wav');
  const oggPct = document.getElementById('savings-pct-ogg');
  const mp3Pct = document.getElementById('savings-pct-mp3');
  const badge = document.getElementById('savings-pct-badge');
  setEstimateValue(originalEl, formatBytes(original));

  if (!complete) {
    [wavEl, oggEl, mp3El, wavPct, oggPct, mp3Pct].forEach(element => setEstimateValue(element, '—'));
    if (badge) { badge.textContent = 'ANALYZING…'; badge.className = 'badge badge--amber'; }
    state.files.forEach((file, id) => { if (!metadata.has(id)) decodeMetadata(id, file, revision); });
    return;
  }

  setEstimateValue(wavEl, formatBytes(wav));
  setEstimateValue(oggEl, `${formatBytes(oggLow)}–${formatBytes(oggHigh)}`);
  setEstimateValue(mp3El, formatBytes(mp3));
  setEstimateValue(wavPct, percentChange(wav, original));
  setEstimateValue(oggPct, `${percentChange(oggLow, original)}…${percentChange(oggHigh, original)}`);
  setEstimateValue(mp3Pct, percentChange(mp3, original));
  if (badge) { badge.textContent = 'PER-FORMAT'; badge.className = 'badge badge--blue'; }
}

function renderQueueItem(id, file) {
  const li = document.createElement('li');
  li.className = 'queue-item'; li.id = `queue-item-${id}`;
  const name = document.createElement('span'); name.className = 'queue-item-name'; name.textContent = file.name; name.title = file.name;
  const size = document.createElement('span'); size.className = 'queue-item-meta'; size.textContent = formatBytes(file.size);
  const status = document.createElement('span'); status.className = 'queue-item-status'; status.id = `status-${id}`; status.textContent = 'WAITING';
  const remove = document.createElement('button'); remove.className = 'btn-remove'; remove.type = 'button'; remove.title = 'Remove from queue'; remove.setAttribute('aria-label', `Remove ${file.name} from queue`); remove.textContent = '✕';
  remove.addEventListener('click', () => {
    if (state.processing) return;
    state.files.delete(id); metadata.delete(id); li.remove(); stopPreview(); updateQueueUI();
  });
  li.append(name, size, status, remove);
  _dom.fileQueue?.appendChild(li);
}

function setItemState(id, type, text) {
  const element = document.getElementById(`status-${id}`);
  if (!element) return;
  element.className = `queue-item-status status--${type}`;
  element.textContent = text;
}

export function cancelProcessing() {
  if (!state.processing) return;
  cancelRequested = true;
  if (worker) {
    try { worker.postMessage({ type: 'cancel' }); } catch (_) {}
    worker.terminate(); worker = null;
  }
  if (activeReject) activeReject(new Error('Processing cancelled by user.'));
}

export async function startProcessing(setProgress) {
  if (state.processing || !state.files.size) return;
  state.processing = true;
  cancelRequested = false;
  clippingBatchCount = 0;
  const snapshot = getStateSnapshot();
  const jobs = Array.from(state.files.entries());
  let attempted = 0, succeeded = 0, failed = 0;
  clearResults();
  _dom.progressWrap.hidden = false;
  _dom.btnProcess.disabled = true;
  _dom.btnProcessLbl.textContent = 'CRUNCHING…';
  if (_dom.btnCancel) _dom.btnCancel.hidden = false;
  setBadge('PROCESSING', 'badge--amber');
  log(`Starting batch: ${jobs.length} file(s), frozen settings snapshot.`, 'accent');

  try {
    for (let index = 0; index < jobs.length; index++) {
      if (cancelRequested) break;
      const [id, file] = jobs[index];
      attempted++;
      const result = await processFile(file, id, setProgress, index, jobs.length, snapshot);
      if (result) { renderResult(result); succeeded++; }
      else failed++;
    }
  } finally {
    state.processing = false;
    activeReject = null;
    if (worker) { worker.terminate(); worker = null; }
    _dom.progressWrap.hidden = true;
    if (_dom.btnCancel) _dom.btnCancel.hidden = true;
    _dom.btnProcess.disabled = state.files.size === 0;
    _dom.btnProcessLbl.textContent = 'CRUNCH';
    const cancelled = cancelRequested;
    const summary = cancelled
      ? `Cancelled after ${succeeded} success(es); ${Math.max(0, attempted - succeeded)} unfinished.`
      : `Batch complete: ${attempted} attempted, ${succeeded} succeeded, ${failed} failed.`;
    if (_dom.batchSummary) _dom.batchSummary.textContent = summary;
    setProgress(cancelled ? 0 : 100, summary);
    log(summary, failed || cancelled ? 'error' : 'ok');
    if (clippingBatchCount) log(`Clipping detected in ${clippingBatchCount} file(s).`, 'warn');
    if (failed || cancelled) {
      setBadge(cancelled ? 'CANCELLED' : 'PARTIAL', 'badge--amber');
      showToast(cancelled ? 'Processing cancelled.' : `${succeeded} succeeded · ${failed} failed`, 'error');
    } else if (succeeded) {
      setBadge('DONE', 'badge--green'); showToast(`✅ ${succeeded} file(s) crunched.`, 'ok');
    } else setBadge('IDLE', 'badge--amber');
  }
}

async function processFile(file, id, setProgress, fileIndex, fileTotal, snapshot) {
  setItemState(id, 'processing', `PROCESSING ${fileIndex + 1}/${fileTotal}`);
  log(`Processing ${file.name} (${fileIndex + 1}/${fileTotal})`, 'accent');
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('Web Audio is not supported.');
    const decodeCtx = new AudioContextClass();
    let decoded;
    try { decoded = await decodeCtx.decodeAudioData((await file.arrayBuffer()).slice(0)); }
    catch (_) { throw new Error('Cannot decode this audio file; it may be unsupported or corrupt.'); }
    finally { await decodeCtx.close(); }

    const targetChannels = snapshot.stereo ? Math.min(decoded.numberOfChannels, 2) : 1;
    const requestedRate = Math.min(Math.max(snapshot.sampleRate, 4000), 48000);
    const targetLength = Math.ceil((decoded.duration / snapshot.playbackRate) * requestedRate);
    const offCtx = safeOfflineCtx(targetChannels, targetLength, requestedRate);
    const source = offCtx.createBufferSource(); source.buffer = decoded; source.playbackRate.value = snapshot.playbackRate;
    const last = buildFilterChain(offCtx, source, snapshot); last.connect(offCtx.destination); source.start(0);
    const rendered = await offCtx.startRendering();
    const channels = Array.from({ length: rendered.numberOfChannels }, (_, ch) => new Float32Array(rendered.getChannelData(ch)));
    const actualRate = rendered.sampleRate;
    log(`  Decoded ${decoded.numberOfChannels}ch → ${rendered.numberOfChannels}ch | ${decoded.sampleRate}Hz → ${actualRate}Hz`, 'sys');
    setProgress((fileIndex / fileTotal) * 100 + 5 / fileTotal, `File ${fileIndex + 1}/${fileTotal} — DSP…`);

    const result = await new Promise((resolve, reject) => {
      activeReject = reject;
      const currentWorker = getWorker();
      currentWorker.onmessage = event => {
        const message = event.data || {};
        if (message.type === 'progress') {
          setProgress((fileIndex / fileTotal + (message.pct / 100) / fileTotal) * 100,
            `File ${fileIndex + 1}/${fileTotal} — ${message.label}`);
        } else if (message.type === 'done') resolve(message);
        else if (message.type === 'error') reject(new Error(message.message));
      };
      currentWorker.onerror = event => reject(new Error(event.message || 'Worker failed to initialize.'));
      currentWorker.postMessage({
        type: 'process', channels, sampleRate: actualRate, fileName: file.name,
        randomSeed: hashSeed(`${file.name}:${file.size}`),
        bitDepth: snapshot.bitDepth, crushMode: snapshot.crushMode, dither: snapshot.dither,
        grit: snapshot.grit, noise: snapshot.noise, normalize: snapshot.normalize,
      }, channels.map(channel => channel.buffer));
    });
    activeReject = null;
    if (result.errors?.length) result.errors.forEach(error => log(`  ${error.format.toUpperCase()} unavailable: ${error.message}`, 'error'));
    const formats = [];
    for (const ext of ['ogg', 'wav', 'mp3']) {
      const buffer = result.formats?.[ext];
      if (!(buffer instanceof ArrayBuffer)) continue;
      const type = ext === 'mp3' ? 'audio/mpeg' : `audio/${ext}`;
      const blob = new Blob([buffer], { type });
      const url = URL.createObjectURL(blob);
      formats.push({ ext, url, blob, size: formatBytes(blob.size), change: formatSizeChange(blob.size, file.size) });
      blobRegistry.set(url, new File([blob], `${file.name}.${ext}`, { type }));
    }
    if (!formats.length) throw new Error('No output format was produced.');
    if (result.hasClipping) clippingBatchCount++;
    setItemState(id, result.errors?.length ? 'partial' : 'done', result.errors?.length ? 'PARTIAL' : 'DONE');
    log(`  Done: ${file.name} [${formats.map(format => `${format.ext.toUpperCase()} ${format.size}`).join(' · ')}]`, 'ok');
    return {
      name: `${file.name.replace(/\.[^.]+$/, '')}_crunched_${snapshot.bitDepth}bit_${actualRate}hz`,
      inputSize: file.size,
      errors: result.errors || [],
      formats,
    };
  } catch (error) {
    activeReject = null;
    setItemState(id, 'error', cancelRequested ? 'CANCELLED' : 'FAILED');
    log(`  ${cancelRequested ? 'Cancelled' : 'Error'}: ${file.name}: ${error.message || String(error)}`, 'error');
    return null;
  }
}

function renderResult(result) {
  const div = document.createElement('div'); div.className = 'result-item';
  const header = document.createElement('div'); header.className = 'result-header';
  const name = document.createElement('span'); name.className = 'result-name'; name.textContent = result.name; name.title = result.name;
  const hint = document.createElement('span'); hint.className = 'daw-hint'; hint.textContent = 'DOWNLOAD / DRAG';
  header.append(name, hint);
  const links = document.createElement('div'); links.className = 'result-links';
  result.formats.forEach(format => {
    const link = document.createElement('a'); link.href = format.url; link.download = `${result.name}.${format.ext}`; link.className = 'btn btn--ghost btn--xs btn-download'; link.draggable = true; link.dataset.url = format.url;
    const label = document.createElement('span'); label.textContent = `.${format.ext.toUpperCase()}`;
    const size = document.createElement('small'); size.textContent = `${format.size} · ${format.change}`;
    link.append(label, size); link.addEventListener('dragstart', handleDragStart); links.appendChild(link);
  });
  div.append(header, links); _dom.resultsArea.appendChild(div); _dom.resultsArea.hidden = false;
}

function handleDragStart(event) {
  const file = blobRegistry.get(event.currentTarget.dataset.url);
  if (file && event.dataTransfer?.items) { event.dataTransfer.items.add(file); event.dataTransfer.effectAllowed = 'copy'; }
  else if (event.dataTransfer) event.dataTransfer.setData('DownloadURL', `audio:${event.currentTarget.download}:${event.currentTarget.href}`);
}

export async function loadDemoTrack() {
  if (state.processing) return;
  _dom.btnLoadDemo.disabled = true; _dom.btnLoadDemo.textContent = 'LOADING…';
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}demo.mp3`);
    if (!response.ok) throw new Error('Demo track not found.');
    const file = new File([await response.blob()], 'demo.mp3', { type: 'audio/mpeg' });
    addFiles([file]); log('Demo track loaded successfully.', 'ok'); showToast('🎵 Demo track loaded.', 'info');
  } catch (error) { log(`Demo track unavailable: ${error.message}`, 'error'); showToast('Demo track unavailable.', 'error'); }
  finally { _dom.btnLoadDemo.disabled = false; _dom.btnLoadDemo.textContent = 'TRY DEMO TRACK'; }
}

async function readAllEntries(reader) {
  const all = [];
  while (true) { const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject)); if (!batch.length) return all; all.push(...batch); }
}

async function traverseEntry(entry, output) {
  if (entry.isFile) {
    const file = await new Promise(resolve => entry.file(resolve)); if (isAudioFile(file)) output.push(file);
  } else if (entry.isDirectory) {
    for (const child of await readAllEntries(entry.createReader())) await traverseEntry(child, output);
  }
}

export async function handleItems(items) {
  const files = [];
  for (const item of items || []) if (item.kind === 'file') {
    const entry = item.webkitGetAsEntry?.();
    if (entry) await traverseEntry(entry, files); else { const file = item.getAsFile?.(); if (isAudioFile(file)) files.push(file); }
  }
  addFiles(files);
}
