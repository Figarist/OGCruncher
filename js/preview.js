/**
 * OGCruncher — Audio Preview & A/B Comparison
 * by figarist · https://figarist.github.io
 */

'use strict';

import { state } from './state.js';
import { log, showToast } from './utils.js';
import { computeAudioMetrics, buildFilterChain, renderFilteredBuffer, processDSP, normalizeBuffer } from './dsp.js';

/* ════════════════════════════════════════════════════════════════════
   STATE & NODES
   ════════════════════════════════════════════════════════════════════ */
let _dom = {};
let previewCtx = null;
let previewSource = null;     // Crunched source (fallback) or Shared source (worklet)
let previewSourceOrig = null; // Original source (fallback)
let gainCrunched = null;
let gainOriginal = null;
let analyserCrunched = null;
let analyserOriginal = null;

let previewDecoded = null;    // Raw dry buffer
let previewResampled = null;  // Dry buffer at target SR
let previewResampledWet = null; // Filtered buffer at target SR

let isComparingOriginal = false;
let liveUpdateTimer = null;
let lastRenderParams = {};
let metricsDrySample = null;
let metricsProcessedSample = null;
let metricsLastDSPParams = "";
let metricsCachedCrunch = null;
let metricsLastDecoded = null;

// AudioWorklet state
let dspWorkletNode = null;        // DSPProcessor node
let hpfNode = null;               // persistent BiquadFilter nodes
let lpfNode = null;
let bassNode = null;
let workletReady = false;         // true after addModule() resolves

/* ════════════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════════════ */

export function initPreview(dom) {
  _dom = dom;
}

async function ensureWorklet() {
  if (workletReady) return;
  if (!previewCtx) previewCtx = new (window.AudioContext || window.webkitAudioContext)();
  try {
    await previewCtx.audioWorklet.addModule('./dsp-processor.js');
    workletReady = true;
    log('AudioWorklet engine ready.', 'sys');
  } catch (err) {
    workletReady = false;
    console.warn('AudioWorklet not supported, using fallback:', err);
  }
}

export function updateWorkletParams() {
  if (!dspWorkletNode) return;
  dspWorkletNode.port.postMessage({
    bitDepth:  state.bitDepth,
    grit:      state.grit,
    noise:     state.noise,
    crush:     state.crushMode,
    normalize: state.normalize,
  });
}

/* ════════════════════════════════════════════════════════════════════
   PREVIEW CONTROLS
   ════════════════════════════════════════════════════════════════════ */

export async function togglePreview() {
  if (_dom.btnPreview.classList.contains('playing')) {
    stopPreview();
    return;
  }

  const files = Array.from(state.files.values());
  if (files.length === 0) return;

  _dom.btnPreview.disabled = true;
  _dom.btnPreviewLbl.textContent = 'LOADING...';

  try {
    if (!previewCtx) previewCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (previewCtx.state === 'suspended') await previewCtx.resume();

    await ensureWorklet();

    // 1. Decode first file if needed
    if (!previewDecoded) {
      const arrayBuf = await files[0].arrayBuffer();
      previewDecoded = await previewCtx.decodeAudioData(arrayBuf);
    }

    const targetRate = state.sampleRate;
    const numChannels = state.stereo ? Math.min(previewDecoded.numberOfChannels, 2) : 1;
    const pRate = state.playbackRate || 1.0;

    // 2. Setup Nodes
    gainCrunched = previewCtx.createGain();
    gainOriginal = previewCtx.createGain();
    analyserCrunched = previewCtx.createAnalyser();
    analyserOriginal = previewCtx.createAnalyser();
    
    gainCrunched.gain.value = isComparingOriginal ? 0 : 1;
    gainOriginal.gain.value = isComparingOriginal ? 1 : 0;

    if (workletReady) {
      // ── AudioWorklet Path ──────────────────────────────────────────────
      hpfNode  = previewCtx.createBiquadFilter();
      hpfNode.type = 'highpass';
      hpfNode.frequency.value = state.hpf;

      lpfNode  = previewCtx.createBiquadFilter();
      lpfNode.type = 'lowpass';
      lpfNode.frequency.value = state.lpf;

      bassNode = previewCtx.createBiquadFilter();
      bassNode.type = 'peaking';
      bassNode.frequency.value = 80;
      bassNode.Q.value = 0.7;
      bassNode.gain.value = state.bass;

      dspWorkletNode = new AudioWorkletNode(previewCtx, 'dsp-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [numChannels],
      });

      updateWorkletParams();

      previewSource = previewCtx.createBufferSource();
      previewSource.buffer = previewDecoded;
      previewSource.playbackRate.value = pRate;
      previewSource.loop = true;

      // Chain: source → worklet → filters → gain → analyser → destination
      previewSource.connect(dspWorkletNode);
      dspWorkletNode.connect(hpfNode);
      hpfNode.connect(lpfNode);
      lpfNode.connect(bassNode);
      bassNode.connect(gainCrunched);
      bassNode.connect(analyserCrunched);
      gainCrunched.connect(previewCtx.destination);

      // Original path (raw, no processing)
      previewSource.connect(gainOriginal);
      previewSource.connect(analyserOriginal);
      gainOriginal.connect(previewCtx.destination);

      lastRenderParams = { sampleRate: targetRate, stereo: state.stereo, playbackRate: pRate };
      log('Preview started (AudioWorklet mode)', 'ok');

    } else {
      // ── Fallback Path (OfflineAudioContext hot-swap) ────────────────────
      previewResampled = await renderFilteredBuffer(previewDecoded, { playbackRate: pRate }, numChannels);
      
      const filteredBuf = await renderFilteredBuffer(previewResampled, {
        hpf: state.hpf,
        lpf: state.lpf,
        bass: state.bass,
        playbackRate: 1.0
      }, numChannels);

      const processedBuf = previewCtx.createBuffer(
        filteredBuf.numberOfChannels,
        filteredBuf.length,
        filteredBuf.sampleRate
      );

      for (let ch = 0; ch < filteredBuf.numberOfChannels; ch++) {
        const samples = new Float32Array(filteredBuf.getChannelData(ch));
        processDSP(samples, state.bitDepth, state.crushMode, state.grit, state.noise);
        if (state.normalize) normalizeBuffer(samples);
        processedBuf.getChannelData(ch).set(samples);
      }

      previewResampledWet = processedBuf;

      previewSource = previewCtx.createBufferSource();
      previewSource.buffer = previewResampledWet;
      previewSource.loop = true;
      previewSource.connect(gainCrunched);
      gainCrunched.connect(analyserCrunched);
      gainCrunched.connect(previewCtx.destination);

      previewSourceOrig = previewCtx.createBufferSource();
      previewSourceOrig.buffer = previewResampled;
      previewSourceOrig.loop = true;
      previewSourceOrig.connect(gainOriginal);
      gainOriginal.connect(analyserOriginal);
      gainOriginal.connect(previewCtx.destination);

      lastRenderParams = { ...state };
      log('Preview started (Fallback mode)', 'ok');
    }

    previewSource.start(0);
    if (previewSourceOrig) previewSourceOrig.start(0);

    _dom.btnPreview.classList.add('playing');
    _dom.btnPreviewLbl.textContent = 'STOP';
    _dom.previewIcon.textContent = '■';
    _dom.abContainer.style.display = 'flex';
    _dom.dropContent.style.display = 'none';
    _dom.visualizer.style.display = 'block';
    
    startVisualizer();
    updateMetricsPanel();

  } catch (err) {
    console.error(err);
    log('Failed to start preview.', 'error');
    stopPreview();
  } finally {
    _dom.btnPreview.disabled = false;
  }
}

export function stopPreview() {
  clearTimeout(liveUpdateTimer);
  liveUpdateTimer = null;

  if (previewSource) {
    try { previewSource.stop(); } catch (e) {}
    previewSource = null;
  }
  if (previewSourceOrig) {
    try { previewSourceOrig.stop(); } catch (e) {}
    previewSourceOrig = null;
  }
  if (dspWorkletNode) {
    try { dspWorkletNode.disconnect(); } catch (_) {}
    dspWorkletNode = null;
  }
  hpfNode = lpfNode = bassNode = null;
  previewDecoded = null;
  previewResampled = null;
  previewResampledWet = null;
  metricsDrySample = null;
  metricsProcessedSample = null;
  metricsLastDSPParams = "";
  metricsCachedCrunch = null;
  metricsLastDecoded = null;

  _dom.btnPreview.classList.remove('playing');
  _dom.btnPreviewLbl.textContent = 'PREVIEW';
  _dom.previewIcon.textContent = '▶';
  _dom.abContainer.style.display = 'none';
  _dom.dropContent.style.display = 'flex';
  _dom.visualizer.style.display = 'none';
  if (_dom.metricsPanel) _dom.metricsPanel.style.display = 'none';
  
  log('Preview stopped.', 'sys');
}

export function toggleAB() {
  if (!gainCrunched || !gainOriginal) return;
  isComparingOriginal = !isComparingOriginal;
  
  const now = previewCtx.currentTime;
  if (isComparingOriginal) {
    gainCrunched.gain.setTargetAtTime(0, now, 0.05);
    gainOriginal.gain.setTargetAtTime(1, now, 0.05);
    _dom.abStatus.textContent = 'ORIGINAL (DRY)';
    _dom.abStatus.classList.add('status--dry');
  } else {
    gainCrunched.gain.setTargetAtTime(1, now, 0.05);
    gainOriginal.gain.setTargetAtTime(0, now, 0.05);
    _dom.abStatus.textContent = 'CRUNCHED (WET)';
    _dom.abStatus.classList.remove('status--dry');
  }
}

/* ════════════════════════════════════════════════════════════════════
   LIVE UPDATES
   ════════════════════════════════════════════════════════════════════ */

export function requestPreviewUpdate() {
  if (!_dom.btnPreview.classList.contains('playing') || !previewDecoded) return;

  clearTimeout(liveUpdateTimer);
  liveUpdateTimer = setTimeout(async () => {
    if (!workletReady) {
      await _requestPreviewUpdateFallback();
      return;
    }

    // ── AudioWorklet Path ────────────────────────────────────────────────
    updateWorkletParams();

    if (hpfNode) hpfNode.frequency.setTargetAtTime(state.hpf, previewCtx.currentTime, 0.01);
    if (lpfNode) lpfNode.frequency.setTargetAtTime(state.lpf, previewCtx.currentTime, 0.01);
    if (bassNode) bassNode.gain.setTargetAtTime(state.bass, previewCtx.currentTime, 0.01);

    const needsFullRestart =
      lastRenderParams.sampleRate    !== state.sampleRate    ||
      lastRenderParams.stereo        !== state.stereo        ||
      lastRenderParams.playbackRate  !== state.playbackRate;

    if (needsFullRestart) {
      await stopPreview();
      await togglePreview();
      return;
    }

    log('live update: params sent to worklet', 'sys');
    updateMetricsPanel();

    lastRenderParams = {
      sampleRate: state.sampleRate,
      stereo: state.stereo,
      playbackRate: state.playbackRate
    };

  }, 50);
}

async function _requestPreviewUpdateFallback() {
  const pRate = state.playbackRate || 1.0;
  const targetRate = state.sampleRate;
  const numChannels = state.stereo ? 2 : 1;

  const needsResample = 
    lastRenderParams.sampleRate !== targetRate || 
    lastRenderParams.stereo !== state.stereo ||
    lastRenderParams.playbackRate !== pRate;

  if (needsResample) {
    previewResampled = await renderFilteredBuffer(previewDecoded, { playbackRate: pRate }, numChannels);
  }

  const filteredBuf = await renderFilteredBuffer(previewResampled, {
    hpf: state.hpf,
    lpf: state.lpf,
    bass: state.bass,
    playbackRate: 1.0
  }, numChannels);

  const processedBuf = previewCtx.createBuffer(
    filteredBuf.numberOfChannels,
    filteredBuf.length,
    filteredBuf.sampleRate
  );

  for (let ch = 0; ch < filteredBuf.numberOfChannels; ch++) {
    const samples = new Float32Array(filteredBuf.getChannelData(ch));
    processDSP(samples, state.bitDepth, state.crushMode, state.grit, state.noise);
    if (state.normalize) normalizeBuffer(samples);
    processedBuf.getChannelData(ch).set(samples);
  }

  previewResampledWet = processedBuf;

  const oldSrc = previewSource;
  const oldSrcOrig = previewSourceOrig;

  previewSource = previewCtx.createBufferSource();
  previewSource.buffer = previewResampledWet;
  previewSource.loop = true;
  previewSource.connect(gainCrunched);

  previewSourceOrig = previewCtx.createBufferSource();
  previewSourceOrig.buffer = previewResampled;
  previewSourceOrig.loop = true;
  previewSourceOrig.connect(gainOriginal);

  const now = previewCtx.currentTime;
  previewSource.start(now);
  previewSourceOrig.start(now);
  
  if (oldSrc) try { oldSrc.stop(now + 0.1); } catch(e) {}
  if (oldSrcOrig) try { oldSrcOrig.stop(now + 0.1); } catch(e) {}

  lastRenderParams = { ...state };
  log('live update: preview buffer hot-swapped', 'sys');
  updateMetricsPanel();
}

/* ════════════════════════════════════════════════════════════════════
   VISUALS & METRICS
   ════════════════════════════════════════════════════════════════════ */

function updateMetricsPanel() {
  if (!previewDecoded || !_dom.metricsPanel) return;
  _dom.metricsPanel.style.display = 'flex';

  const pRate = state.playbackRate || 1.0;
  const targetRate = state.sampleRate;
  
  // Estimate metrics (in worklet mode we use current state, in fallback we use rendered buffers)
  let metricsOrig, metricsCrunch;
  
  if (workletReady) {
    metricsOrig = computeAudioMetrics(previewDecoded);
    
    // Check if we need to re-run DSP estimation
    const currentDSPParams = `${state.bitDepth}-${state.crushMode}-${state.grit}-${state.noise}-${state.normalize}`;
    
    if (metricsLastDecoded !== previewDecoded) {
      metricsDrySample = null;
      metricsCachedCrunch = null;
      metricsLastDecoded = previewDecoded;
    }

    if (!metricsDrySample) {
      const sampleRate = previewDecoded.sampleRate;
      const sampleLen = Math.min(sampleRate, previewDecoded.length);
      const startSample = Math.floor((previewDecoded.length - sampleLen) / 2);
      metricsDrySample = previewDecoded.getChannelData(0).slice(startSample, startSample + sampleLen);
      metricsProcessedSample = new Float32Array(metricsDrySample.length);
    }

    if (metricsLastDSPParams !== currentDSPParams || !metricsCachedCrunch) {
      metricsProcessedSample.set(metricsDrySample);
      processDSP(metricsProcessedSample, state.bitDepth, state.crushMode, state.grit, state.noise);
      if (state.normalize) normalizeBuffer(metricsProcessedSample);

      let sumSq = 0, peak = 0;
      for (let i = 0; i < metricsProcessedSample.length; i++) {
        const s = metricsProcessedSample[i];
        sumSq += s * s;
        const a = s < 0 ? -s : s;
        if (a > peak) peak = a;
      }
      const rms = Math.sqrt(sumSq / metricsProcessedSample.length);
      metricsCachedCrunch = {
        rmsDb: rms > 1e-9 ? 20 * Math.log10(rms) : -96,
        peakDb: peak > 1e-9 ? 20 * Math.log10(peak) : -96,
      };
      metricsLastDSPParams = currentDSPParams;
    }
    
    metricsCrunch = metricsCachedCrunch;
  } else {
    metricsOrig = computeAudioMetrics(previewResampled);
    metricsCrunch = computeAudioMetrics(previewResampledWet);
  }

  const fmt = db => db === -Infinity ? '-∞' : db.toFixed(1) + ' dB';
  
  if (_dom.metricRmsOrig) _dom.metricRmsOrig.textContent = fmt(metricsOrig.rmsDb);
  if (_dom.metricRmsCrunch) _dom.metricRmsCrunch.textContent = fmt(metricsCrunch.rmsDb);
  if (_dom.metricPeakOrig) _dom.metricPeakOrig.textContent = fmt(metricsOrig.peakDb);
  if (_dom.metricPeakCrunch) _dom.metricPeakCrunch.textContent = fmt(metricsCrunch.peakDb);
  
  const durOrig = previewDecoded.duration;
  const durCrunch = durOrig / pRate;
  if (_dom.metricDurOrig) _dom.metricDurOrig.textContent = durOrig.toFixed(2) + 's';
  if (_dom.metricDurCrunch) _dom.metricDurCrunch.textContent = durCrunch.toFixed(2) + 's';
}

function startVisualizer() {
  const canvas = _dom.visualizer;
  const ctx = canvas.getContext('2d');
  const bufferLength = analyserCrunched.frequencyBinCount;
  const dataCrunched = new Uint8Array(bufferLength);
  const dataOriginal = new Uint8Array(bufferLength);

  const draw = () => {
    if (!_dom.btnPreview.classList.contains('playing')) return;
    requestAnimationFrame(draw);

    analyserCrunched.getByteFrequencyData(dataCrunched);
    analyserOriginal.getByteFrequencyData(dataOriginal);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeightC = (dataCrunched[i] / 255) * canvas.height;
      const barHeightO = (dataOriginal[i] / 255) * canvas.height;

      // Original (Dry) - Greenish
      if (isComparingOriginal || state.dualView) {
        ctx.fillStyle = `rgba(178, 245, 234, ${isComparingOriginal ? 0.6 : 0.2})`;
        ctx.fillRect(x, canvas.height - barHeightO, barWidth, barHeightO);
      }

      // Crunched (Wet) - Purple
      if (!isComparingOriginal || state.dualView) {
        ctx.fillStyle = `rgba(124, 105, 227, ${!isComparingOriginal ? 0.8 : 0.3})`;
        ctx.fillRect(x, canvas.height - barHeightC, barWidth, barHeightC);
      }

      x += barWidth + 1;
    }
  };

  draw();
}
