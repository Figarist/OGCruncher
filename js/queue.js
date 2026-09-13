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
let processingGeneration = 0;
let activeJob = null;
let clippingBatchCount = 0;
let estimateRevision = 0;
const metadata = new Map();
const blobRegistry = new Map();
const metadataQueue = [];
let metadataActive = 0;
let metadataGeneration = 0;
const METADATA_CONCURRENCY = 2;

class ProcessingCancelled extends Error {
  constructor() {
    super('Processing cancelled by user.');
    this.name = 'ProcessingCancelled';
  }
}

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

function safeFilenameStem(fileName) {
  const source = String(fileName || 'output').replace(/\.[^.]+$/, '');
  const safe = source.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[ .]+$/g, '');
  return safe || 'output';
}

function mimeForExtension(extension) {
  return extension === 'mp3' ? 'audio/mpeg' : extension === 'wav' ? 'audio/wav' : extension === 'ogg' ? 'audio/ogg' : 'application/octet-stream';
}

/** One bounded filename contract for downloads, drag Files and result links. */
export function getOutputFilename(fileName, extension, bitDepth, sampleRate) {
  const ext = String(extension || 'bin').replace(/^\.+/, '').toLowerCase();
  const suffix = `_crunched_${Math.round(Number(bitDepth) || 0)}bit_${Math.round(Number(sampleRate) || 0)}hz`;
  const maxStemLength = Math.max(16, 180 - suffix.length);
  return `${safeFilenameStem(fileName).slice(0, maxStemLength)}${suffix}.${ext}`;
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
  metadataGeneration++;
  while (metadataQueue.length) metadataQueue.shift().resolve({ status: 'cancelled' });
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

function isCurrentMetadata(id, file, entry) {
  return metadata.get(id) === entry
    && state.files.get(id) === file
    && entry.generation === metadataGeneration;
}

function pumpMetadataAnalysis() {
  while (metadataActive < METADATA_CONCURRENCY && metadataQueue.length) {
    const task = metadataQueue.shift();
    metadataActive++;
    analyzeMetadata(task).catch(() => {
      // analyzeMetadata records the failure and resolves the task promise;
      // this guard prevents a browser rejection from becoming unhandled.
    });
  }
}

async function analyzeMetadata(task) {
  const { id, file, entry, resolve } = task;
  let ctx = null;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('Web Audio is not supported.');
    ctx = new AudioContextClass();
    const decoded = await ctx.decodeAudioData((await file.arrayBuffer()).slice(0));
    if (isCurrentMetadata(id, file, entry)) {
      entry.status = 'success';
      entry.info = { duration: decoded.duration, channels: decoded.numberOfChannels, sampleRate: decoded.sampleRate };
    }
  } catch (error) {
    if (isCurrentMetadata(id, file, entry)) {
      entry.status = 'error';
      entry.error = error instanceof Error ? error.message : String(error);
    }
  } finally {
    if (ctx?.close) {
      try { await ctx.close(); } catch (_) {}
    }
    metadataActive--;
    resolve(entry);
    if (state.files.size && isCurrentMetadata(id, file, entry)) updateSavingsEstimate();
    pumpMetadataAnalysis();
  }
}

function decodeMetadata(id, file) {
  const existing = metadata.get(id);
  if (existing?.file === file) return existing.promise;

  let resolve;
  const promise = new Promise(done => { resolve = done; });
  const entry = { file, generation: metadataGeneration, status: 'pending', promise };
  metadata.set(id, entry);
  metadataQueue.push({ id, file, entry, resolve });
  pumpMetadataAnalysis();
  return promise;
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
  ++estimateRevision;
  let original = 0;
  let wav = 0;
  let mp3 = 0;
  let oggLow = 0;
  let oggHigh = 0;
  let pending = false;
  let metadataError = false;

  state.files.forEach((file, id) => {
    original += file.size;
    const entry = metadata.get(id);
    if (!entry || entry.status === 'pending') { pending = true; return; }
    if (entry.status === 'error') { metadataError = true; return; }
    const info = entry.info;
    if (!info) { pending = true; return; }
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

  if (pending) {
    [wavEl, oggEl, mp3El, wavPct, oggPct, mp3Pct].forEach(element => setEstimateValue(element, '—'));
    if (badge) { badge.textContent = 'ANALYZING…'; badge.className = 'badge badge--amber'; }
    state.files.forEach((file, id) => {
      const entry = metadata.get(id);
      if (!entry) decodeMetadata(id, file);
    });
    return;
  }

  if (metadataError) {
    [wavEl, oggEl, mp3El, wavPct, oggPct, mp3Pct].forEach(element => setEstimateValue(element, '—'));
    if (badge) { badge.textContent = 'UNAVAILABLE'; badge.className = 'badge badge--red'; }
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
  if (activeJob) activeJob.cancelled = true;
  processingGeneration++;
  if (worker) {
    try { worker.postMessage({ type: 'cancel' }); } catch (_) {}
    worker.terminate(); worker = null;
  }
  if (activeReject) {
    const reject = activeReject;
    activeReject = null;
    reject(new ProcessingCancelled());
  }
}

export async function startProcessing(setProgress) {
  if (state.processing || !state.files.size) return;
  state.processing = true;
  cancelRequested = false;
  const job = { generation: ++processingGeneration, cancelled: false };
  activeJob = job;
  clippingBatchCount = 0;
  const snapshot = getStateSnapshot();
  const jobs = Array.from(state.files.entries());
  let attempted = 0, succeeded = 0, partial = 0, failed = 0, cancelled = 0;
  clearResults();
  _dom.progressWrap.hidden = false;
  _dom.btnProcess.disabled = true;
  _dom.btnProcessLbl.textContent = 'CRUNCHING…';
  if (_dom.btnCancel) _dom.btnCancel.hidden = false;
  setBadge('PROCESSING', 'badge--amber');
  log(`Starting batch: ${jobs.length} file(s), frozen settings snapshot.`, 'accent');

  try {
    for (let index = 0; index < jobs.length; index++) {
      if (!isCurrentJob(job)) break;
      const [id, file] = jobs[index];
      attempted++;
      const outcome = await processFile(file, id, setProgress, index, jobs.length, snapshot, job);
      if (outcome.status === 'success') { renderResult(outcome.result); succeeded++; }
      else if (outcome.status === 'partial') { renderResult(outcome.result); partial++; }
      else if (outcome.status === 'cancelled') { cancelled++; break; }
      else failed++;
    }
  } finally {
    const wasCancelled = job.cancelled || cancelRequested;
    const notAttempted = Math.max(0, jobs.length - attempted);
    if (activeJob === job) activeJob = null;
    state.processing = false;
    activeReject = null;
    if (worker) { worker.terminate(); worker = null; }
    _dom.progressWrap.hidden = true;
    if (_dom.btnCancel) _dom.btnCancel.hidden = true;
    _dom.btnProcess.disabled = state.files.size === 0;
    _dom.btnProcessLbl.textContent = 'CRUNCH';
    if (wasCancelled && cancelled === 0 && attempted > succeeded + partial + failed) cancelled = 1;
    const summary = `Completed: ${succeeded} full, ${partial} partial; failed: ${failed}; cancelled: ${cancelled}; not attempted: ${notAttempted}.`;
    if (_dom.batchSummary) _dom.batchSummary.textContent = summary;
    setProgress(wasCancelled ? 0 : 100, summary);
    log(summary, failed || partial || wasCancelled ? 'error' : 'ok');
    if (clippingBatchCount) log(`Clipping detected in ${clippingBatchCount} file(s).`, 'warn');
    if (wasCancelled) {
      setBadge('CANCELLED', 'badge--amber'); showToast('Processing cancelled.', 'error');
    } else if (failed || partial) {
      setBadge('PARTIAL', 'badge--amber'); showToast(`${succeeded} full · ${partial} partial · ${failed} failed`, 'error');
    } else if (succeeded) {
      setBadge('DONE', 'badge--green'); showToast(`✅ ${succeeded} file(s) crunched.`, 'ok');
    } else setBadge('IDLE', 'badge--amber');
  }
}

function isCurrentJob(job) {
  return activeJob === job && !job.cancelled && processingGeneration === job.generation && state.processing;
}

function assertCurrentJob(job) {
  if (!isCurrentJob(job)) throw new ProcessingCancelled();
}

async function processFile(file, id, setProgress, fileIndex, fileTotal, snapshot, job) {
  setItemState(id, 'processing', `PROCESSING ${fileIndex + 1}/${fileTotal}`);
  log(`Processing ${file.name} (${fileIndex + 1}/${fileTotal})`, 'accent');
  try {
    assertCurrentJob(job);
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('Web Audio is not supported.');
    const decodeCtx = new AudioContextClass();
    let decoded;
    try {
      const raw = await file.arrayBuffer();
      assertCurrentJob(job);
      decoded = await decodeCtx.decodeAudioData(raw.slice(0));
      assertCurrentJob(job);
    } catch (error) {
      if (error instanceof ProcessingCancelled) throw error;
      throw new Error('Cannot decode this audio file; it may be unsupported or corrupt.');
    } finally {
      try { await decodeCtx.close(); } catch (_) {}
    }
    assertCurrentJob(job);

    const targetChannels = snapshot.stereo ? Math.min(decoded.numberOfChannels, 2) : 1;
    const requestedRate = Math.min(Math.max(snapshot.sampleRate, 4000), 48000);
    const targetLength = Math.ceil((decoded.duration / snapshot.playbackRate) * requestedRate);
    const offCtx = safeOfflineCtx(targetChannels, targetLength, requestedRate);
    const source = offCtx.createBufferSource(); source.buffer = decoded; source.playbackRate.value = snapshot.playbackRate;
    const last = buildFilterChain(offCtx, source, snapshot); last.connect(offCtx.destination); source.start(0);
    const rendered = await offCtx.startRendering();
    assertCurrentJob(job);
    const channels = Array.from({ length: rendered.numberOfChannels }, (_, ch) => new Float32Array(rendered.getChannelData(ch)));
    const actualRate = rendered.sampleRate;
    log(`  Decoded ${decoded.numberOfChannels}ch → ${rendered.numberOfChannels}ch | ${decoded.sampleRate}Hz → ${actualRate}Hz`, 'sys');
    setProgress((fileIndex / fileTotal) * 100 + 5 / fileTotal, `File ${fileIndex + 1}/${fileTotal} — DSP…`);

    const result = await new Promise((resolve, reject) => {
      activeReject = reject;
      const currentWorker = getWorker();
      let settled = false;
      const settle = (handler, value) => {
        if (settled) return;
        settled = true;
        handler(value);
      };
      currentWorker.onmessage = event => {
        const message = event.data || {};
        if (!isCurrentJob(job)) return;
        if (message.type === 'progress') {
          setProgress((fileIndex / fileTotal + (message.pct / 100) / fileTotal) * 100,
            `File ${fileIndex + 1}/${fileTotal} — ${message.label}`);
        } else if (message.type === 'done') settle(resolve, message);
        else if (message.type === 'error') settle(reject, new Error(message.message));
      };
      currentWorker.onerror = event => settle(reject, new Error(event.message || 'Worker failed to initialize.'));
      try {
        currentWorker.postMessage({
          type: 'process', channels, sampleRate: actualRate, fileName: file.name,
          randomSeed: hashSeed(`${file.name}:${file.size}`),
          bitDepth: snapshot.bitDepth, crushMode: snapshot.crushMode, dither: snapshot.dither,
          grit: snapshot.grit, noise: snapshot.noise, normalize: snapshot.normalize,
        }, channels.map(channel => channel.buffer));
      } catch (error) {
        settle(reject, error);
      }
    });
    activeReject = null;
    assertCurrentJob(job);
    if (result.errors?.length) result.errors.forEach(error => log(`  ${error.format.toUpperCase()} unavailable: ${error.message}`, 'error'));
    const formats = [];
    for (const ext of ['ogg', 'wav', 'mp3']) {
      const buffer = result.formats?.[ext];
      if (!(buffer instanceof ArrayBuffer)) continue;
      const type = mimeForExtension(ext);
      const blob = new Blob([buffer], { type });
      const url = URL.createObjectURL(blob);
      const filename = getOutputFilename(file.name, ext, snapshot.bitDepth, actualRate);
      formats.push({ ext, filename, mime: type, url, blob, size: formatBytes(blob.size), change: formatSizeChange(blob.size, file.size) });
      blobRegistry.set(url, new File([blob], filename, { type }));
    }
    if (!formats.length) throw new Error('No output format was produced.');
    if (result.hasClipping) clippingBatchCount++;
    const isPartial = Boolean(result.errors?.length);
    setItemState(id, isPartial ? 'partial' : 'done', isPartial ? 'PARTIAL' : 'DONE');
    log(`  Done: ${file.name} [${formats.map(format => `${format.ext.toUpperCase()} ${format.size}`).join(' · ')}]`, 'ok');
    return {
      status: isPartial ? 'partial' : 'success',
      result: {
        name: formats[0].filename.replace(/\.[^.]+$/, ''),
        inputSize: file.size,
        errors: result.errors || [],
        formats,
      },
    };
  } catch (error) {
    activeReject = null;
    if (error instanceof ProcessingCancelled || job.cancelled || !isCurrentJob(job)) {
      if (job.cancelled) setItemState(id, 'error', 'CANCELLED');
      return { status: 'cancelled' };
    }
    setItemState(id, 'error', 'FAILED');
    log(`  Error: ${file.name}: ${error.message || String(error)}`, 'error');
    return { status: 'failed' };
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
    const link = document.createElement('a'); link.href = format.url; link.download = format.filename; link.className = 'btn btn--ghost btn--xs btn-download'; link.draggable = true; link.dataset.url = format.url; link.dataset.mime = format.mime;
    const label = document.createElement('span'); label.textContent = `.${format.ext.toUpperCase()}`;
    const size = document.createElement('small'); size.textContent = `${format.size} · ${format.change}`;
    link.append(label, size); link.addEventListener('dragstart', handleDragStart); links.appendChild(link);
  });
  if (result.errors?.length) {
    const errors = document.createElement('ul');
    errors.className = 'result-errors';
    errors.setAttribute('aria-label', 'Unavailable output formats');
    result.errors.forEach(error => {
      const item = document.createElement('li');
      item.textContent = `${String(error.format || 'format').toUpperCase()} unavailable: ${error.message}`;
      errors.appendChild(item);
    });
    div.appendChild(errors);
  }
  div.insertBefore(header, div.firstChild);
  div.insertBefore(links, div.children[1] || null);
  _dom.resultsArea.appendChild(div); _dom.resultsArea.hidden = false;
}

function handleDragStart(event) {
  const file = blobRegistry.get(event.currentTarget.dataset.url);
  if (file && event.dataTransfer?.items) { event.dataTransfer.items.add(file); event.dataTransfer.effectAllowed = 'copy'; }
  else if (event.dataTransfer) event.dataTransfer.setData('DownloadURL', `${event.currentTarget.dataset.mime || 'application/octet-stream'}:${event.currentTarget.download}:${event.currentTarget.href}`);
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
