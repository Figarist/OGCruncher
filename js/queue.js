/**
 * OGCruncher — queue, metadata estimates and worker orchestration.
 */

'use strict';

import { state, getStateSnapshot } from './state.js';
import { log, showToast, formatBytes, formatSizeChange, setBadge } from './utils.js';
import { buildFilterChain, safeOfflineCtx } from './dsp.js';
import { hashSeed } from './dsp-core.js';
import { stopPreview } from './preview.js';
import { t, plural } from './i18n.js';

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
const batchArchiveEntries = [];
let jszipPromise = null;
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
  _dom.btnDownloadZip?.addEventListener?.('click', downloadBatchZip);
  _dom.btnClearResults?.addEventListener?.('click', () => {
    clearResults();
    notifyAudioStateChanged();
    log('Results cleared.', 'sys');
  });
}

function notifyAudioStateChanged() {
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof Event !== 'undefined') {
    window.dispatchEvent(new Event('og-audio-state-change'));
  }
}

function revokeAllBlobs() {
  blobRegistry.forEach((_, url) => URL.revokeObjectURL(url));
  blobRegistry.clear();
}

function clearResults() {
  revokeAllBlobs();
  batchArchiveEntries.length = 0;
  if (_dom.resultsBatchBar) _dom.resultsBatchBar.hidden = true;
  if (_dom.btnDownloadZip) _dom.btnDownloadZip.hidden = true;
  if (_dom.resultsBatchSummary) _dom.resultsBatchSummary.textContent = t('{count} files ready', { count: 0 });
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

/** Scratch 3.0 rejects sounds over 10 MB; warn so kids pick a lower quality or MP3. */
const SCRATCH_MAX_BYTES = 10 * 1024 * 1024;

/** One bounded filename contract for downloads, drag Files and result links. */
export function getOutputFilename(fileName, extension, bitDepth, sampleRate, disambiguator = '', keepOriginalName = false) {
  const ext = String(extension || 'bin').replace(/^\.+/, '').toLowerCase();
  const suffix = keepOriginalName ? '' : `_crunched_${Math.round(Number(bitDepth) || 0)}bit_${Math.round(Number(sampleRate) || 0)}hz`;
  const safeDisambiguator = String(disambiguator || '').replace(/[^a-zA-Z0-9_-]/g, '');
  const maxStemLength = Math.max(16, 180 - suffix.length - safeDisambiguator.length);
  return `${safeFilenameStem(fileName).slice(0, maxStemLength)}${safeDisambiguator}${suffix}.${ext}`;
}

function allocateOutputFilenames(fileName, bitDepth, rateByExt, usedNames, extensions = ['ogg', 'wav', 'mp3'], keepOriginalName = false) {
  const active = extensions.length ? extensions : ['wav'];
  const rateFor = ext => typeof rateByExt === 'object' && rateByExt ? (rateByExt[ext] || rateByExt.default) : rateByExt;
  for (let ordinal = 1; ordinal < 10000; ordinal++) {
    const disambiguator = ordinal === 1 ? '' : `-${ordinal}`;
    const filenames = Object.fromEntries(active.map(ext => [
      ext,
      getOutputFilename(fileName, ext, bitDepth, rateFor(ext), disambiguator, keepOriginalName),
    ]));
    if (active.every(ext => !usedNames.has(filenames[ext]))) {
      active.forEach(ext => usedNames.add(filenames[ext]));
      return filenames;
    }
  }
  throw new Error('Could not allocate a unique output filename.');
}

export function addFiles(files) {
  if (state.processing) return;
  let added = 0;
  let duplicateReferences = 0;
  for (const file of files || []) {
    if (!isAudioFile(file)) continue;
    // Name and size are not content identity. Keep separately selected entries,
    // while avoiding an exact same File object being added twice by one caller.
    if ([...state.files.values()].some(existingFile => existingFile === file)) {
      duplicateReferences++;
      continue;
    }
    const id = state.nextId++;
    state.files.set(id, file);
    renderQueueItem(id, file);
    added++;
  }
  if (added) {
    updateQueueUI();
    log(t('{added} file(s) added. Queue: {total} total.', { added, total: state.files.size }), 'sys');
  }
  if (duplicateReferences) {
    const message = t(duplicateReferences === 1
      ? '{count} exact duplicate file was already queued and not added again. Re-selected files remain separate unless they are the same File object.'
      : '{count} exact duplicate files were already queued and not added again. Re-selected files remain separate unless they are the same File object.',
    { count: duplicateReferences });
    log(message, 'warn');
    showToast(message, 'info');
  }
  if (added || duplicateReferences) notifyAudioStateChanged();
}

export function clearQueue() {
  if (state.processing) return;
  stopPreview();
  metadataGeneration++;
  while (metadataQueue.length) metadataQueue.shift().resolve({ status: 'cancelled' });
  metadata.forEach(entry => { entry.cancelled = true; });
  state.files.clear();
  metadata.clear();
  if (_dom.fileQueue) while (_dom.fileQueue.firstChild) _dom.fileQueue.removeChild(_dom.fileQueue.firstChild);
  clearResults();
  if (_dom.batchSummary) _dom.batchSummary.textContent = '';
  updateQueueUI();
  log('Queue cleared.', 'sys');
  notifyAudioStateChanged();
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
    && !entry.cancelled
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

const MPEG_SAMPLE_RATES = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000];

function resolveMp3EstimateRate(sampleRate) {
  const rate = Math.round(Number(sampleRate) || 44100);
  if (MPEG_SAMPLE_RATES.includes(rate)) return rate;
  return MPEG_SAMPLE_RATES.find(candidate => candidate >= rate) || 48000;
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
  let knownOriginal = 0;
  let validCount = 0;

  state.files.forEach((file, id) => {
    original += file.size;
    const entry = metadata.get(id);
    if (!entry || entry.status === 'pending') { pending = true; return; }
    if (entry.status === 'error') { metadataError = true; return; }
    const info = entry.info;
    if (!info) { pending = true; return; }
    knownOriginal += file.size;
    validCount++;
    const duration = info.duration / Math.max(.001, state.playbackRate);
    const channels = state.stereo ? Math.min(info.channels, 2) : 1;
    const rate = state.sampleRate;
    wav += wavEstimate(info.duration, rate, channels, state.bitDepth);
    // MPEG-2.5 (<=12kHz) clamps MP3 bitrate at 64kbps; MPEG-1/2 uses 128kbps.
    const mp3Rate = resolveMp3EstimateRate(rate);
    const mp3Bitrate = mp3Rate <= 12000 ? 64000 : 128000;
    mp3 += duration * mp3Bitrate / 8 + 720;
    const oggLowKbps = rate <= 16000 ? (channels === 1 ? 16000 : 28000) : (channels === 1 ? 24000 : 40000);
    const oggHighKbps = rate <= 16000 ? (channels === 1 ? 64000 : 112000) : (channels === 1 ? 96000 : 160000);
    oggLow += duration * oggLowKbps / 8;
    oggHigh += duration * oggHighKbps / 8;
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
    if (badge) { badge.textContent = t('ANALYZING…'); badge.className = 'badge badge--amber'; }
    state.files.forEach((file, id) => {
      const entry = metadata.get(id);
      if (!entry) decodeMetadata(id, file);
    });
    return;
  }

  if (metadataError && !validCount) {
    [wavEl, oggEl, mp3El, wavPct, oggPct, mp3Pct].forEach(element => setEstimateValue(element, '—'));
    if (badge) { badge.textContent = t('UNAVAILABLE'); badge.className = 'badge badge--red'; }
    return;
  }

  setEstimateValue(wavEl, formatBytes(wav));
  setEstimateValue(oggEl, `${formatBytes(oggLow)}–${formatBytes(oggHigh)}`);
  setEstimateValue(mp3El, formatBytes(mp3));
  const estimateInput = metadataError ? knownOriginal : original;
  setEstimateValue(wavPct, percentChange(wav, estimateInput));
  setEstimateValue(oggPct, `${percentChange(oggLow, estimateInput)}…${percentChange(oggHigh, estimateInput)}`);
  setEstimateValue(mp3Pct, percentChange(mp3, estimateInput));
  container.querySelector?.('.highlight-wav')?.classList?.toggle('is-muted', state.exportWav === false);
  container.querySelector?.('.highlight-ogg')?.classList?.toggle('is-muted', state.exportOgg === false);
  container.querySelector?.('.highlight-mp3')?.classList?.toggle('is-muted', state.exportMp3 === false);
  if (badge) {
    badge.textContent = t(metadataError ? 'PARTIAL' : 'PER-FORMAT');
    badge.className = metadataError ? 'badge badge--amber' : 'badge badge--blue';
  }
}

function cancelMetadataEntry(id) {
  const entry = metadata.get(id);
  if (!entry) return;
  entry.cancelled = true;
  metadata.delete(id);
  for (let index = metadataQueue.length - 1; index >= 0; index--) {
    if (metadataQueue[index].entry === entry) {
      metadataQueue.splice(index, 1)[0].resolve({ status: 'cancelled' });
    }
  }
}

export function removeFile(id) {
  if (state.processing) return;
  const element = document.getElementById(`queue-item-${id}`);
  state.files.delete(id);
  cancelMetadataEntry(id);
  element?.remove();
  stopPreview();
  updateQueueUI();
  notifyAudioStateChanged();
}

function renderQueueItem(id, file) {
  const li = document.createElement('li');
  li.className = 'queue-item'; li.id = `queue-item-${id}`;
  const name = document.createElement('span'); name.className = 'queue-item-name'; name.textContent = file.name; name.title = file.name;
  const size = document.createElement('span'); size.className = 'queue-item-meta'; size.textContent = formatBytes(file.size);
  const status = document.createElement('span'); status.className = 'queue-item-status'; status.id = `status-${id}`; status.textContent = t('WAITING');
  const remove = document.createElement('button'); remove.className = 'btn-remove'; remove.type = 'button'; remove.title = t('Remove from queue'); remove.setAttribute('aria-label', t('Remove {name} from queue', { name: file.name })); remove.textContent = '✕';
  remove.addEventListener('click', () => removeFile(id));
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
  const usedOutputNames = new Set();
  clearResults();
  _dom.progressWrap.hidden = false;
  _dom.btnProcess.disabled = true;
  _dom.btnProcessLbl.textContent = t('CRUNCHING…');
  if (_dom.btnCancel) _dom.btnCancel.hidden = false;
  setBadge(t('PROCESSING'), 'badge--amber');
  log(`Starting batch: ${jobs.length} file(s), frozen settings snapshot.`, 'accent');

  try {
    for (let index = 0; index < jobs.length; index++) {
      if (!isCurrentJob(job)) break;
      const [id, file] = jobs[index];
      attempted++;
      const outcome = await processFile(file, id, setProgress, index, jobs.length, snapshot, job, usedOutputNames);
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
    if (wasCancelled && worker) { worker.terminate(); worker = null; }
    _dom.progressWrap.hidden = true;
    if (_dom.btnCancel) _dom.btnCancel.hidden = true;
    _dom.btnProcess.disabled = state.files.size === 0;
    _dom.btnProcessLbl.textContent = t('CRUNCH');
    if (wasCancelled && cancelled === 0 && attempted > succeeded + partial + failed) cancelled = 1;
    const summary = t('Completed: {full} full, {partial} partial; failed: {failed}; cancelled: {cancelled}; not attempted: {skipped}.',
      { full: succeeded, partial, failed, cancelled, skipped: notAttempted });
    if (_dom.batchSummary) _dom.batchSummary.textContent = summary;
    setProgress(wasCancelled ? 0 : 100, summary);
    log(summary, failed || partial || wasCancelled ? 'error' : 'ok');
    if (clippingBatchCount) log(`Clipping detected in ${clippingBatchCount} file(s).`, 'warn');
    if (wasCancelled) {
      setBadge(t('CANCELLED'), 'badge--amber'); showToast(t('Processing cancelled.'), 'error');
    } else if (failed || partial) {
      setBadge(t('PARTIAL'), 'badge--amber'); showToast(t('{full} full · {partial} partial · {failed} failed', { full: succeeded, partial, failed }), 'error');
    } else if (succeeded) {
      setBadge(t('DONE'), 'badge--green'); showToast(t('✅ {count} file(s) crunched.', { count: succeeded }), 'ok');
    } else setBadge(t('IDLE'), 'badge--amber');
    notifyAudioStateChanged();
  }
}

function isCurrentJob(job) {
  return activeJob === job && !job.cancelled && processingGeneration === job.generation && state.processing;
}

function assertCurrentJob(job) {
  if (!isCurrentJob(job)) throw new ProcessingCancelled();
}

async function processFile(file, id, setProgress, fileIndex, fileTotal, snapshot, job, usedOutputNames) {
  setItemState(id, 'processing', `${t('PROCESSING')} ${fileIndex + 1}/${fileTotal}`);
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

    if (!decoded || decoded.length === 0 || !(decoded.duration > 0)) {
      throw new Error('Audio file contains no samples.');
    }

    const targetChannels = snapshot.stereo ? Math.min(decoded.numberOfChannels, 2) : 1;
    const requestedRate = Math.min(Math.max(snapshot.sampleRate, 4000), 48000);
    const targetLength = Math.max(1, Math.ceil((decoded.duration / snapshot.playbackRate) * requestedRate));
    const offCtx = safeOfflineCtx(targetChannels, targetLength, requestedRate);
    const source = offCtx.createBufferSource(); source.buffer = decoded; source.playbackRate.value = snapshot.playbackRate;
    const last = buildFilterChain(offCtx, source, snapshot); last.connect(offCtx.destination); source.start(0);
    const rendered = await offCtx.startRendering();
    assertCurrentJob(job);
    const channels = Array.from({ length: rendered.numberOfChannels }, (_, ch) => new Float32Array(rendered.getChannelData(ch)));
    const actualRate = rendered.sampleRate;
    log(`  Decoded ${decoded.numberOfChannels}ch → ${rendered.numberOfChannels}ch | ${decoded.sampleRate}Hz → ${actualRate}Hz`, 'sys');
    setProgress((fileIndex / fileTotal) * 100 + 5 / fileTotal, t('File {index}/{total} — {label}', { index: fileIndex + 1, total: fileTotal, label: t('DSP…') }));

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
            t('File {index}/{total} — {label}', { index: fileIndex + 1, total: fileTotal, label: t(message.label) }));
        } else if (message.type === 'done') settle(resolve, message);
        else if (message.type === 'error') settle(reject, new Error(message.message));
      };
      currentWorker.onerror = event => {
        if (worker === currentWorker) { worker.terminate(); worker = null; }
        settle(reject, new Error(event.message || 'Worker failed to initialize.'));
      };
      const exportFormats = {
        ogg: snapshot.exportOgg !== false,
        wav: snapshot.exportWav !== false,
        mp3: snapshot.exportMp3 !== false,
      };
      if (!exportFormats.ogg && !exportFormats.wav && !exportFormats.mp3) exportFormats.wav = true;
      try {
        currentWorker.postMessage({
          type: 'process', channels, sampleRate: actualRate, fileName: file.name,
          randomSeed: hashSeed(`${file.name}:${file.size}`),
          bitDepth: snapshot.bitDepth, crushMode: snapshot.crushMode, dither: snapshot.dither,
          grit: snapshot.grit, noise: snapshot.noise, normalize: snapshot.normalize,
          normalizeCeiling: snapshot.normalizeCeiling, trimSilence: !!snapshot.trimSilence,
          exportFormats,
        }, channels.map(channel => channel.buffer));
      } catch (error) {
        settle(reject, error);
      }
    });
    activeReject = null;
    assertCurrentJob(job);
    if (result.mp3SampleRate && result.mp3SampleRate !== actualRate) {
      log(`  MP3 resampled ${actualRate}Hz → ${result.mp3SampleRate}Hz for MPEG compatibility.`, 'sys');
    }
    if (result.errors?.length) result.errors.forEach(error => log(`  ${error.format.toUpperCase()} unavailable: ${error.message}`, 'error'));
    const selectedExtensions = ['ogg', 'wav', 'mp3'].filter(ext => {
      if (ext === 'ogg') return snapshot.exportOgg !== false;
      if (ext === 'wav') return snapshot.exportWav !== false;
      return snapshot.exportMp3 !== false;
    });
    const activeExtensions = selectedExtensions.length ? selectedExtensions : ['wav'];
    const formats = [];
    const outputFilenames = allocateOutputFilenames(file.name, snapshot.bitDepth, {
      default: actualRate,
      mp3: result.mp3SampleRate || actualRate,
    }, usedOutputNames, activeExtensions, !!snapshot.keepOriginalName);
    for (const ext of activeExtensions) {
      const buffer = result.formats?.[ext];
      if (!(buffer instanceof ArrayBuffer)) continue;
      const type = mimeForExtension(ext);
      const blob = new Blob([buffer], { type });
      const url = URL.createObjectURL(blob);
      const filename = outputFilenames[ext];
      formats.push({ ext, filename, mime: type, url, blob, size: formatBytes(blob.size), change: formatSizeChange(blob.size, file.size) });
      if (snapshot.exportOgg === false && (ext === 'wav' || ext === 'mp3') && blob.size > SCRATCH_MAX_BYTES) {
        log(t('{name} is {size}: larger than Scratch’s 10 MB limit.', { name: filename, size: formatBytes(blob.size) }), 'warn');
      }
      blobRegistry.set(url, new File([blob], filename, { type }));
    }
    if (!formats.length) throw new Error('No output format was produced.');
    if (result.hasClipping) clippingBatchCount++;
    const isPartial = Boolean(result.errors?.length);
    setItemState(id, isPartial ? 'partial' : 'done', t(isPartial ? 'PARTIAL' : 'DONE'));
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
      if (job.cancelled) setItemState(id, 'error', t('CANCELLED'));
      return { status: 'cancelled' };
    }
    setItemState(id, 'error', t('FAILED'));
    log(`  Error: ${file.name}: ${error.message || String(error)}`, 'error');
    return { status: 'failed' };
  }
}

function renderResult(result) {
  const div = document.createElement('div'); div.className = 'result-item';
  const header = document.createElement('div'); header.className = 'result-header';
  const name = document.createElement('span'); name.className = 'result-name'; name.textContent = result.name; name.title = result.name;
  const hint = document.createElement('span'); hint.className = 'daw-hint'; hint.textContent = t('DOWNLOAD / DRAG');
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
    errors.setAttribute('aria-label', t('Unavailable output formats'));
    result.errors.forEach(error => {
      const item = document.createElement('li');
      item.textContent = t('{format} unavailable: {message}', { format: String(error.format || 'format').toUpperCase(), message: error.message });
      errors.appendChild(item);
    });
    div.appendChild(errors);
  }
  div.insertBefore(header, div.firstChild);
  div.insertBefore(links, div.children[1] || null);
  _dom.resultsArea.appendChild(div); _dom.resultsArea.hidden = false;

  result.formats.forEach(format => {
    if (format.blob) batchArchiveEntries.push({ filename: format.filename, blob: format.blob });
  });
  if (_dom.resultsBatchBar && batchArchiveEntries.length >= 1) {
    _dom.resultsBatchBar.hidden = false;
    if (_dom.btnDownloadZip) _dom.btnDownloadZip.hidden = batchArchiveEntries.length <= 1;
    if (_dom.resultsBatchSummary) {
      const count = batchArchiveEntries.length;
      _dom.resultsBatchSummary.textContent = t(
        plural(count, {
          one: '{count} file ready',
          few: '{count} files ready (few)',
          many: '{count} files ready',
          other: '{count} files ready',
        }),
        { count },
      );
    }
  }
}

function loadJSZip() {
  if (typeof window !== 'undefined' && typeof window.JSZip === 'function') return Promise.resolve(window.JSZip);
  if (jszipPromise) return jszipPromise;
  jszipPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${import.meta.env.BASE_URL}jszip.min.js`;
    script.async = true;
    script.onload = () => {
      if (typeof window.JSZip === 'function') resolve(window.JSZip);
      else { jszipPromise = null; reject(new Error('JSZip failed to initialize.')); }
    };
    script.onerror = () => {
      jszipPromise = null;
      reject(new Error('Could not load ZIP archiver.'));
    };
    (document.head || document.body || document.documentElement).appendChild(script);
  });
  return jszipPromise;
}

async function downloadBatchZip() {
  if (!batchArchiveEntries.length || !_dom.btnDownloadZip) return;
  const button = _dom.btnDownloadZip;
  button.disabled = true;
  button.textContent = t('PACKING ZIP…');
  try {
    const JSZipCtor = await loadJSZip();
    const zip = new JSZipCtor();
    batchArchiveEntries.forEach(entry => zip.file(entry.filename, entry.blob));
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ogcruncher_batch.zip';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    log(`Packed ${batchArchiveEntries.length} output file(s) into ogcruncher_batch.zip.`, 'ok');
    showToast(t('📦 ZIP archive downloaded.'), 'ok');
  } catch (error) {
    log(`ZIP export failed: ${error.message || String(error)}`, 'error');
    showToast(t('⚠ Failed to build ZIP archive.'), 'error');
  } finally {
    button.disabled = false;
    button.textContent = t('DOWNLOAD ALL (.ZIP)');
  }
}

function handleDragStart(event) {
  const file = blobRegistry.get(event.currentTarget.dataset.url);
  if (file && event.dataTransfer?.items) { event.dataTransfer.items.add(file); event.dataTransfer.effectAllowed = 'copy'; }
  else if (event.dataTransfer) event.dataTransfer.setData('DownloadURL', `${event.currentTarget.dataset.mime || 'application/octet-stream'}:${event.currentTarget.download}:${event.currentTarget.href}`);
}

function setDemoButtonState(disabled, label) {
  if (_dom.btnLoadDemo) _dom.btnLoadDemo.disabled = disabled;
  if (_dom.btnLoadDemoLabel) _dom.btnLoadDemoLabel.textContent = label;
  else if (_dom.btnLoadDemo) _dom.btnLoadDemo.textContent = label;
}

export async function loadDemoTrack() {
  if (state.processing) return;
  setDemoButtonState(true, t('LOADING…'));
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}demo.mp3`);
    if (!response.ok) throw new Error('Demo track not found.');
    const file = new File([await response.blob()], 'demo.mp3', { type: 'audio/mpeg' });
    addFiles([file]); log(t('Demo track loaded successfully.'), 'ok'); showToast(t('🎵 Demo track loaded.'), 'info');
  } catch (error) { log(`Demo track unavailable: ${error.message}`, 'error'); showToast(t('Demo track unavailable.'), 'error'); }
  finally { setDemoButtonState(false, t('TRY DEMO TRACK 🎵')); }
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
