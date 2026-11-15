/**
 * OGCruncher — preview renderer and A/B comparison.
 *
 * Preview intentionally uses the same offline render contract as export. The
 * AudioWorklet remains a bounded low-latency implementation, but using a second
 * streaming DSP path here would make a preview claim that it is not the export.
 */

'use strict';

import { state } from './state.js';
import { log } from './utils.js';
import { computeAudioMetrics, renderFilteredBuffer, processChannels } from './dsp.js';
import { hashSeed } from './dsp-core.js';

let _dom = {};
let sessionId = 0;
let previewCtx = null;
let wetSource = null;
let drySource = null;
let wetSourceGain = null;
let drySourceGain = null;
let wetBranch = null;
let dryBranch = null;
let wetAnalyser = null;
let dryAnalyser = null;
let monitorGain = null;
let previewDecoded = null;
let previewWet = null;
let previewDry = null;
let previewFile = null;
let previewStartTime = 0;
let updateTimer = null;
let comparingOriginal = false;
let previewUpdateRevision = 0;
let updateInFlight = false;
let updatePending = false;
let visualizerObserver = null;
const BRANCH_RAMP_SECONDS = 0.025;
const SOURCE_CROSSFADE_SECONDS = 0.04;

export function initPreview(dom) {
  _dom = dom;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

function currentContext() {
  if (!previewCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('Web Audio is not supported in this browser.');
    previewCtx = new AudioContextClass();
  }
  return previewCtx;
}

function outputChannels(decoded, params) {
  return params.stereo ? Math.min(decoded.numberOfChannels, 2) : 1;
}

function bufferFromChannels(channels, sampleRate) {
  const ctx = currentContext();
  const buffer = ctx.createBuffer(channels.length, channels[0]?.length || 0, sampleRate);
  channels.forEach((channel, index) => buffer.getChannelData(index).set(channel));
  return buffer;
}

function createBranchGraph() {
  const ctx = currentContext();
  wetBranch = ctx.createGain();
  dryBranch = ctx.createGain();
  wetAnalyser = ctx.createAnalyser();
  dryAnalyser = ctx.createAnalyser();
  monitorGain = ctx.createGain();
  wetAnalyser.fftSize = 2048;
  dryAnalyser.fftSize = 2048;
  // Analysers observe each rendered signal before A/B branch muting. This
  // keeps Dual View useful while the monitor listens to only one branch.
  wetAnalyser.connect(wetBranch);
  dryAnalyser.connect(dryBranch);
  wetBranch.connect(monitorGain);
  dryBranch.connect(monitorGain);
  monitorGain.connect(ctx.destination);
  monitorGain.gain.value = clamp(state.previewVolume, 0, 1);
  setABGains(false, 0);
}

function rampGain(param, value, at, duration = BRANCH_RAMP_SECONDS) {
  param.cancelScheduledValues(at);
  param.setValueAtTime(param.value, at);
  if (duration > 0) param.linearRampToValueAtTime(value, at + duration);
  else param.setValueAtTime(value, at);
}

function setABGains(original, at) {
  comparingOriginal = !!original;
  if (!wetBranch || !dryBranch) return;
  rampGain(wetBranch.gain, original ? 0 : 1, at);
  rampGain(dryBranch.gain, original ? 1 : 0, at);
}

function disconnect(node) {
  try { node?.disconnect(); } catch (_) {}
}

function stopSource(source) {
  try { source?.stop(); } catch (_) {}
  disconnect(source);
}

function resetPreviewUI() {
  _dom.btnPreview?.classList.remove('playing');
  if (_dom.btnPreviewLbl) _dom.btnPreviewLbl.textContent = 'PREVIEW';
  if (_dom.previewIcon) _dom.previewIcon.textContent = '▶';
  if (_dom.btnPreview) _dom.btnPreview.setAttribute('aria-label', 'Preview selected audio');
  if (_dom.abContainer) _dom.abContainer.style.display = 'none';
  if (_dom.abStatus) { _dom.abStatus.textContent = 'CRUNCHED (WET)'; _dom.abStatus.classList.remove('status--dry'); }
  if (_dom.dropContent) _dom.dropContent.style.display = 'flex';
  if (_dom.visualizer) _dom.visualizer.style.display = 'none';
  if (_dom.metricsPanel) _dom.metricsPanel.style.display = 'none';
  if (_dom.previewFileName) _dom.previewFileName.textContent = '';
}

function cleanupGraph() {
  stopSource(wetSource);
  stopSource(drySource);
  disconnect(wetSourceGain); disconnect(drySourceGain);
  disconnect(wetBranch); disconnect(dryBranch);
  disconnect(wetAnalyser); disconnect(dryAnalyser); disconnect(monitorGain);
  wetSource = drySource = wetSourceGain = drySourceGain = null;
  wetBranch = dryBranch = wetAnalyser = dryAnalyser = monitorGain = null;
}

function clearBuffers() {
  previewDecoded = null;
  previewWet = null;
  previewDry = null;
  previewFile = null;
}

async function renderBuffers(decoded, params, file, isCurrent) {
  const targetRate = clamp(params.sampleRate, 4000, 48000);
  const channels = outputChannels(decoded, params);
  const renderParams = {
    sampleRate: targetRate,
    playbackRate: params.playbackRate,
  };
  const dry = await renderFilteredBuffer(decoded, renderParams, channels);
  if (!isCurrent()) return null;
  const filtered = await renderFilteredBuffer(decoded, {
    ...renderParams,
    hpf: params.hpf,
    lpf: params.lpf,
    bass: params.bass,
  }, channels);
  if (!isCurrent()) return null;

  const wetChannels = Array.from({ length: filtered.numberOfChannels }, (_, index) =>
    new Float32Array(filtered.getChannelData(index)));
  processChannels(wetChannels, params, hashSeed(`${file.name}:${file.size}`));
  return {
    dry: bufferFromChannels(
      Array.from({ length: dry.numberOfChannels }, (_, index) => new Float32Array(dry.getChannelData(index))),
      dry.sampleRate,
    ),
    wet: bufferFromChannels(wetChannels, filtered.sampleRate),
  };
}

function installSources(wetBuffer, dryBuffer, startOffset = 0, crossfade = false) {
  const ctx = currentContext();
  const oldWet = wetSource;
  const oldDry = drySource;
  const oldWetGain = wetSourceGain;
  const oldDryGain = drySourceGain;
  const now = ctx.currentTime;

  wetSource = ctx.createBufferSource();
  drySource = ctx.createBufferSource();
  wetSource.buffer = wetBuffer;
  drySource.buffer = dryBuffer;
  wetSource.loop = true;
  drySource.loop = true;
  wetSourceGain = ctx.createGain();
  drySourceGain = ctx.createGain();
  // Source gains own only source replacement. Both new sources become fully
  // available; A/B selection is owned exclusively by branch gains.
  wetSourceGain.gain.value = crossfade ? 0 : 1;
  drySourceGain.gain.value = crossfade ? 0 : 1;
  wetSource.connect(wetSourceGain); wetSourceGain.connect(wetAnalyser);
  drySource.connect(drySourceGain); drySourceGain.connect(dryAnalyser);

  const duration = Math.max(wetBuffer.duration, 1 / wetBuffer.sampleRate);
  const offset = ((startOffset % duration) + duration) % duration;
  wetSource.start(now, offset);
  drySource.start(now, Math.min(offset, Math.max(0, dryBuffer.duration - 1 / dryBuffer.sampleRate)));
  previewStartTime = now - offset;

  if (crossfade) {
    const end = now + SOURCE_CROSSFADE_SECONDS;
    wetSourceGain.gain.linearRampToValueAtTime(1, end);
    drySourceGain.gain.linearRampToValueAtTime(1, end);
    if (oldWetGain) { oldWetGain.gain.cancelScheduledValues(now); oldWetGain.gain.setValueAtTime(1, now); oldWetGain.gain.linearRampToValueAtTime(0, end); }
    if (oldDryGain) { oldDryGain.gain.cancelScheduledValues(now); oldDryGain.gain.setValueAtTime(1, now); oldDryGain.gain.linearRampToValueAtTime(0, end); }
    window.setTimeout(() => { stopSource(oldWet); stopSource(oldDry); disconnect(oldWetGain); disconnect(oldDryGain); }, 90);
  }
}

async function startPreview() {
  const files = Array.from(state.files.values());
  if (!files.length) return;
  const file = files[0];
  const mySession = ++sessionId;
  _dom.btnPreview.disabled = true;
  if (_dom.btnPreviewLbl) _dom.btnPreviewLbl.textContent = 'LOADING…';

  try {
    const ctx = currentContext();
    if (ctx.state === 'suspended') await ctx.resume();
    const raw = await file.arrayBuffer();
    if (mySession !== sessionId) return;
    const decoded = await ctx.decodeAudioData(raw.slice(0));
    if (mySession !== sessionId) return;
    if (!decoded || decoded.length === 0 || !(decoded.duration > 0)) {
      throw new Error('Audio file contains no samples.');
    }
    const params = { ...state };
    const rendered = await renderBuffers(decoded, params, file, () => mySession === sessionId);
    if (!rendered || mySession !== sessionId) return;

    cleanupGraph();
    clearBuffers();
    previewDecoded = decoded;
    previewWet = rendered.wet;
    previewDry = rendered.dry;
    previewFile = file;
    createBranchGraph();
    installSources(previewWet, previewDry);
    _dom.btnPreview.classList.add('playing');
    _dom.btnPreviewLbl.textContent = 'STOP';
    _dom.previewIcon.textContent = '■';
    _dom.btnPreview.setAttribute('aria-label', 'Stop preview');
    if (_dom.abContainer) _dom.abContainer.style.display = 'flex';
    if (_dom.dropContent) _dom.dropContent.style.display = 'none';
    if (_dom.visualizer) _dom.visualizer.style.display = 'block';
    if (_dom.previewFileName) _dom.previewFileName.textContent = `Previewing: ${file.name}`;
    updateABLabel();
    updateMetricsPanel();
    startVisualizer();
    log('Preview started from the same offline render contract as export.', 'ok');
  } catch (error) {
    if (mySession === sessionId) {
      cleanupGraph(); clearBuffers(); resetPreviewUI();
      log(`Preview failed: ${error.message || String(error)}`, 'error');
    }
  } finally {
    if (mySession === sessionId && _dom.btnPreview) _dom.btnPreview.disabled = false;
  }
}

export async function togglePreview() {
  if (_dom.btnPreview?.classList.contains('playing')) stopPreview();
  else await startPreview();
}

function stopVisualizer() {
  visualizerObserver?.disconnect();
  visualizerObserver = null;
}

export function stopPreview() {
  sessionId++;
  previewUpdateRevision++;
  updateInFlight = false;
  updatePending = false;
  clearTimeout(updateTimer);
  updateTimer = null;
  stopVisualizer();
  cleanupGraph();
  clearBuffers();
  comparingOriginal = false;
  resetPreviewUI();
  if (_dom.btnPreview) _dom.btnPreview.disabled = false;
}

function updateABLabel() {
  if (!_dom.abStatus) return;
  _dom.abStatus.textContent = comparingOriginal ? 'ORIGINAL (DRY · OUTPUT SETTINGS)' : 'CRUNCHED (WET)';
  _dom.abStatus.classList.toggle('status--dry', comparingOriginal);
  if (_dom.btnAB) _dom.btnAB.setAttribute('aria-label', comparingOriginal ? 'Compare crunched preview' : 'Compare original dry preview');
}

export function toggleAB() {
  if (!wetBranch || !dryBranch || !_dom.btnPreview?.classList.contains('playing')) return;
  comparingOriginal = !comparingOriginal;
  setABGains(comparingOriginal, currentContext().currentTime);
  updateABLabel();
}

export function requestPreviewUpdate() {
  if (!_dom.btnPreview?.classList.contains('playing') || !previewDecoded) return;
  if (!state.liveUpdate) {
    invalidatePreviewUpdates();
    return;
  }
  clearTimeout(updateTimer);
  const mySession = sessionId;
  const myRevision = ++previewUpdateRevision;
  const params = { ...state };
  const file = previewFile;
  updateTimer = window.setTimeout(() => {
    updateTimer = null;
    if (mySession !== sessionId || myRevision !== previewUpdateRevision || !file) return;
    if (updateInFlight) {
      updatePending = true;
      return;
    }
    updateInFlight = true;
    void applyPreviewUpdate(mySession, myRevision, params, file).catch(error => {
      if (mySession === sessionId && myRevision === previewUpdateRevision && state.liveUpdate) {
        log(`Preview update failed; current preview retained: ${error.message || String(error)}`, 'error');
      }
    });
  }, 100);
}

async function applyPreviewUpdate(mySession, myRevision, params, file) {
  try {
    const ctx = currentContext();
    const renderStartedAt = ctx.currentTime;
    const oldDuration = previewWet?.duration || 1;
    const rendered = await renderBuffers(previewDecoded, params, file,
      () => mySession === sessionId && myRevision === previewUpdateRevision && state.liveUpdate);
    if (!rendered || mySession !== sessionId || myRevision !== previewUpdateRevision || !state.liveUpdate) return;

    // Read the playhead at apply time. AudioContext time advances while an
    // offline render is in flight, so measuring only before render makes a
    // slow update jump backwards. Mapping the current phase to the new buffer
    // also preserves position when playbackRate changes its rendered duration.
    const elapsed = (ctx.currentTime - previewStartTime) % oldDuration;
    const fraction = oldDuration > 0 ? Math.max(0, elapsed / oldDuration) : 0;
    previewWet = rendered.wet;
    previewDry = rendered.dry;
    installSources(previewWet, previewDry, fraction * rendered.wet.duration, true);
    updateMetricsPanel();
    log(`Live update applied with a short complementary crossfade (${Math.round((ctx.currentTime - renderStartedAt) * 1000)}ms render).`, 'sys');
  } finally {
    updateInFlight = false;
    if (mySession === sessionId && myRevision === previewUpdateRevision && updatePending && state.liveUpdate) {
      updatePending = false;
      requestPreviewUpdate();
    } else if (mySession === sessionId && myRevision !== previewUpdateRevision && state.liveUpdate) {
      updatePending = false;
      requestPreviewUpdate();
    } else if (mySession !== sessionId || !state.liveUpdate) {
      updatePending = false;
    }
  }
}

export function invalidatePreviewUpdates() {
  previewUpdateRevision++;
  updatePending = false;
  clearTimeout(updateTimer);
  updateTimer = null;
}

function updateMetricsPanel() {
  if (!previewWet || !previewDry || !_dom.metricsPanel) return;
  _dom.metricsPanel.style.display = 'flex';
  const original = computeAudioMetrics(previewDry);
  const crunched = computeAudioMetrics(previewWet);
  const format = db => Number.isFinite(db) ? `${db.toFixed(1)} dB` : '−∞';
  if (_dom.metricRmsOrig) _dom.metricRmsOrig.textContent = format(original.rmsDb);
  if (_dom.metricRmsCrunch) _dom.metricRmsCrunch.textContent = format(crunched.rmsDb);
  if (_dom.metricPeakOrig) _dom.metricPeakOrig.textContent = format(original.peakDb);
  if (_dom.metricPeakCrunch) _dom.metricPeakCrunch.textContent = format(crunched.peakDb);
  if (_dom.metricDurOrig) _dom.metricDurOrig.textContent = `${previewDry.duration.toFixed(2)}s`;
  if (_dom.metricDurCrunch) _dom.metricDurCrunch.textContent = `${previewWet.duration.toFixed(2)}s`;
}

function startVisualizer() {
  const canvas = _dom.visualizer;
  if (!canvas || !wetAnalyser || !dryAnalyser) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  stopVisualizer();

  let logicalWidth = canvas.width || 300;
  let logicalHeight = canvas.height || 120;
  const syncCanvasSize = () => {
    const rect = typeof canvas.getBoundingClientRect === 'function' ? canvas.getBoundingClientRect() : null;
    if (rect && rect.width > 0 && rect.height > 0) {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      logicalWidth = rect.width;
      logicalHeight = rect.height;
      const targetWidth = Math.max(1, Math.round(logicalWidth * dpr));
      const targetHeight = Math.max(1, Math.round(logicalHeight * dpr));
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      ctx.setTransform?.(dpr, 0, 0, dpr, 0, 0);
    } else {
      logicalWidth = canvas.width || 300;
      logicalHeight = canvas.height || 120;
    }
  };
  syncCanvasSize();
  if (typeof ResizeObserver === 'function') {
    visualizerObserver = new ResizeObserver(syncCanvasSize);
    visualizerObserver.observe(canvas);
  }

  const binCount = wetAnalyser.frequencyBinCount;
  const frequency = new Uint8Array(binCount);
  const frequencyDry = new Uint8Array(binCount);
  const time = new Uint8Array(binCount);
  const timeDry = new Uint8Array(binCount);
  let peak = 0;
  const draw = () => {
    if (!_dom.btnPreview?.classList.contains('playing')) {
      stopVisualizer();
      return;
    }
    requestAnimationFrame(draw);
    wetAnalyser.getByteFrequencyData(frequency); dryAnalyser.getByteFrequencyData(frequencyDry);
    wetAnalyser.getByteTimeDomainData(time); dryAnalyser.getByteTimeDomainData(timeDry);
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    const visibleBins = Math.max(1, Math.min(binCount, Math.floor(logicalWidth / 4)));
    const barWidth = logicalWidth / visibleBins;
    for (let index = 0; index < visibleBins; index++) {
      const bin = Math.min(binCount - 1, Math.floor(index * binCount / visibleBins));
      if (comparingOriginal || state.dualView) {
        ctx.fillStyle = `rgba(78, 205, 196, ${comparingOriginal ? .65 : .22})`;
        const h = (frequencyDry[bin] / 255) * logicalHeight;
        ctx.fillRect(index * barWidth, logicalHeight - h, Math.max(1, barWidth - 1), h);
      }
      if (!comparingOriginal || state.dualView) {
        ctx.fillStyle = `rgba(122, 184, 36, ${comparingOriginal ? .28 : .78})`;
        const h = (frequency[bin] / 255) * logicalHeight;
        ctx.fillRect(index * barWidth, logicalHeight - h, Math.max(1, barWidth - 1), h);
      }
    }
    let currentPeak = 0;
    const activeTime = comparingOriginal ? timeDry : time;
    for (const value of activeTime) currentPeak = Math.max(currentPeak, Math.abs(value - 128) / 128);
    peak = Math.max(currentPeak, peak * .92);
    ctx.fillStyle = 'rgba(26, 26, 46, .18)'; ctx.fillRect(0, 0, logicalWidth, 4);
    const gradient = ctx.createLinearGradient(0, 0, logicalWidth, 0);
    gradient.addColorStop(0, '#b5e853'); gradient.addColorStop(.72, '#f7e04a'); gradient.addColorStop(1, '#e8603c');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, Math.min(logicalWidth, peak * logicalWidth), 4);
  };
  draw();
}

export function setPreviewVolume(volume) {
  const value = clamp(volume, 0, 1);
  state.previewVolume = Number.isFinite(value) ? value : .8;
  if (monitorGain && previewCtx) monitorGain.gain.setTargetAtTime(state.previewVolume, previewCtx.currentTime, .02);
}
