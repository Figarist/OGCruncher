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
let _previewSessionId = 0;    // Tracking ID for preview session to prevent race conditions
let previewCtx = null;
let previewSource = null;     // Crunched source (fallback) or Shared source (worklet)
let previewSourceOrig = null; // Original source (fallback)
let gainMaster = null;        // Master volume node
let gainCrunched = null;
let gainOriginal = null;
let analyserCrunched = null;
let analyserOriginal = null;

let previewDecoded = null;    // Raw dry buffer
let previewResampled = null;  // Dry buffer at target SR
let previewResampledOrig = null; // High-quality dry buffer at native SR (for comparison)
let previewResampledWet = null; // Filtered buffer at target SR
let currentPreGain = 1.0; // Global pre-gain for worklet
let previewStartTime = 0; // Timestamp when preview playback started
let useWorklet = false;   // Actual active state of worklet in current session

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

function createLiveFilters(ctx) {
  if (hpfNode) { try { hpfNode.disconnect(); } catch (_) {} }
  if (lpfNode) { try { lpfNode.disconnect(); } catch (_) {} }
  if (bassNode) { try { bassNode.disconnect(); } catch (_) {} }

  hpfNode = ctx.createBiquadFilter();
  hpfNode.type = 'highpass';
  hpfNode.frequency.value = state.hpf;

  lpfNode = ctx.createBiquadFilter();
  lpfNode.type = 'lowpass';
  lpfNode.frequency.value = state.lpf;

  bassNode = ctx.createBiquadFilter();
  bassNode.type = 'peaking';
  bassNode.frequency.value = 80;
  bassNode.Q.value = 0.7;
  bassNode.gain.value = state.bass;
}

export function updateLiveFilters() {
  if (previewCtx) {
    const t = previewCtx.currentTime;
    if (hpfNode) {
      hpfNode.frequency.setTargetAtTime(Math.min(Math.max(state.hpf, 20), 20000), t, 0.02);
    }
    if (lpfNode) {
      lpfNode.frequency.setTargetAtTime(Math.min(Math.max(state.lpf, 20), 20000), t, 0.02);
    }
    if (bassNode) {
      bassNode.gain.setTargetAtTime(Math.min(Math.max(state.bass, -12), 12), t, 0.02);
    }
  }
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
    dither:    state.dither,
    normalize: state.normalize,
    preGain:   currentPreGain,
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

  const mySessionId = ++_previewSessionId;

  try {
    if (!previewCtx) previewCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (previewCtx.state === 'suspended') {
      await previewCtx.resume();
      if (mySessionId !== _previewSessionId) return;
    }

    await ensureWorklet();
    if (mySessionId !== _previewSessionId) return;

    useWorklet = workletReady;
    const targetRate = Math.min(Math.max(state.sampleRate, 4000), 48000);

    if (useWorklet) {
      try {
        if (previewCtx && previewCtx.sampleRate !== targetRate) {
          await previewCtx.close();
          if (mySessionId !== _previewSessionId) return;
          previewCtx = null;
        }
        if (!previewCtx) {
          previewCtx = new AudioContext({ sampleRate: targetRate });
          await previewCtx.audioWorklet.addModule('./dsp-processor.js');
          if (mySessionId !== _previewSessionId) return;
        }
      } catch (e) {
        console.warn('Could not create live AudioContext at target rate. Switching to offline fallback path.', e);
        useWorklet = false;
        if (previewCtx) {
          try { await previewCtx.close(); } catch (_) {}
          previewCtx = null;
        }
      }
    }

    if (!previewCtx) {
      previewCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (previewCtx.state === 'suspended') {
        await previewCtx.resume();
        if (mySessionId !== _previewSessionId) return;
      }
    }

    // 1. Decode first file if needed
    if (!previewDecoded) {
      const arrayBuf = await files[0].arrayBuffer();
      if (mySessionId !== _previewSessionId) return;
      previewDecoded = await previewCtx.decodeAudioData(arrayBuf);
      if (mySessionId !== _previewSessionId) return;
    }

    const numChannels = state.stereo ? Math.min(previewDecoded.numberOfChannels, 2) : 1;
    const pRate = state.playbackRate || 1.0;

    // Create live filters and update their parameters immediately
    createLiveFilters(previewCtx);
    updateLiveFilters();

    if (useWorklet) {
      // ── Step 1: Resample to targetRate (this IS the lo-fi sample rate effect) ──
      previewResampled = await renderFilteredBuffer(previewDecoded, {
        sampleRate: targetRate,
        playbackRate: pRate,
      }, numChannels);
      if (mySessionId !== _previewSessionId) return;

      previewResampledOrig = await renderFilteredBuffer(previewDecoded, {
        sampleRate: previewCtx.sampleRate,
        playbackRate: pRate,
      }, numChannels);
      if (mySessionId !== _previewSessionId) return;

      // previewResampledWet is rendered and cached for metrics estimation
      previewResampledWet = await renderFilteredBuffer(previewResampled, {
        hpf: state.hpf,
        lpf: state.lpf,
        bass: state.bass,
        playbackRate: 1.0,
        sampleRate: targetRate
      }, numChannels);
      if (mySessionId !== _previewSessionId) return;

      let globalPeak = 0;
      for (let ch = 0; ch < previewResampledWet.numberOfChannels; ch++) {
        const data = previewResampledWet.getChannelData(ch);
        for (let i = 0; i < data.length; i++) {
          const a = data[i] < 0 ? -data[i] : data[i];
          if (a > globalPeak) globalPeak = a;
        }
      }
      currentPreGain = 1.0 / (globalPeak + 1e-9);

      // Recreate gain/analyser nodes on the new context
      gainCrunched = previewCtx.createGain();
      gainOriginal = previewCtx.createGain();
      analyserCrunched = previewCtx.createAnalyser();
      analyserOriginal = previewCtx.createAnalyser();
      gainCrunched.gain.value = isComparingOriginal ? 0 : 1;
      gainOriginal.gain.value = isComparingOriginal ? 1 : 0;

      // ── Step 3: Worklet for DSP ──
      dspWorkletNode = new AudioWorkletNode(previewCtx, 'dsp-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [numChannels],
      });
      updateWorkletParams();

      // ── Step 4: Build sources ────────────────────────────────────────────────
      gainMaster = previewCtx.createGain();
      gainMaster.gain.value = state.previewVolume;

      previewSource = previewCtx.createBufferSource();
      previewSource.buffer = previewResampled; // Connect resampled dry to worklet!
      previewSource.loop = true;

      // Connections: previewSource -> dspWorkletNode -> hpfNode -> lpfNode -> bassNode -> gainCrunched & analyserCrunched
      previewSource.connect(dspWorkletNode);
      dspWorkletNode.connect(hpfNode);
      hpfNode.connect(lpfNode);
      lpfNode.connect(bassNode);
      bassNode.connect(gainCrunched);
      bassNode.connect(analyserCrunched);
      gainCrunched.connect(gainMaster);

      previewSourceOrig = previewCtx.createBufferSource();
      previewSourceOrig.buffer = previewResampledOrig;
      previewSourceOrig.loop = true;
      previewSourceOrig.connect(gainOriginal);
      previewSourceOrig.connect(analyserOriginal);
      gainOriginal.connect(gainMaster);

      gainMaster.connect(previewCtx.destination);

      lastRenderParams = {
        sampleRate: targetRate,
        stereo: state.stereo,
        playbackRate: pRate,
        bitDepth: state.bitDepth,
        grit: state.grit,
        noise: state.noise,
        crushMode: state.crushMode,
        normalize: state.normalize,
        hpf: state.hpf,
        lpf: state.lpf,
        bass: state.bass
      };
      log('Preview started (AudioWorklet mode)', 'ok');

    } else {
      // ── Fallback Path (OfflineAudioContext hot-swap) ────────────────────
      const targetRate = state.sampleRate;
      previewResampled = await renderFilteredBuffer(previewDecoded, { 
        playbackRate: pRate, 
        sampleRate: targetRate 
      }, numChannels);
      if (mySessionId !== _previewSessionId) return;
      
      previewResampledOrig = await renderFilteredBuffer(previewDecoded, {
        sampleRate: previewCtx.sampleRate,
        playbackRate: pRate,
      }, numChannels);
      if (mySessionId !== _previewSessionId) return;

      previewResampledWet = await renderFilteredBuffer(previewResampled, {
        hpf: state.hpf,
        lpf: state.lpf,
        bass: state.bass,
        playbackRate: 1.0,
        sampleRate: targetRate
      }, numChannels);
      if (mySessionId !== _previewSessionId) return;

      const processedBuf = previewCtx.createBuffer(
        previewResampled.numberOfChannels,
        previewResampled.length,
        previewResampled.sampleRate
      );

      for (let ch = 0; ch < previewResampled.numberOfChannels; ch++) {
        const samples = new Float32Array(previewResampled.getChannelData(ch));
        processDSP(samples, state.bitDepth, state.crushMode, state.dither, state.grit, state.noise);
        if (state.normalize) normalizeBuffer(samples);
        processedBuf.getChannelData(ch).set(samples);
      }

      // Recreate gain/analyser nodes on the new context
      gainCrunched = previewCtx.createGain();
      gainOriginal = previewCtx.createGain();
      analyserCrunched = previewCtx.createAnalyser();
      analyserOriginal = previewCtx.createAnalyser();
      gainCrunched.gain.value = isComparingOriginal ? 0 : 1;
      gainOriginal.gain.value = isComparingOriginal ? 1 : 0;

      gainMaster = previewCtx.createGain();
      gainMaster.gain.value = state.previewVolume;

      previewSource = previewCtx.createBufferSource();
      previewSource.buffer = processedBuf;
      previewSource.loop = true;
      
      // Connections: previewSource -> hpfNode -> lpfNode -> bassNode -> gainCrunched & analyserCrunched
      previewSource.connect(hpfNode);
      hpfNode.connect(lpfNode);
      lpfNode.connect(bassNode);
      bassNode.connect(gainCrunched);
      bassNode.connect(analyserCrunched);
      gainCrunched.connect(gainMaster);

      previewSourceOrig = previewCtx.createBufferSource();
      previewSourceOrig.buffer = previewResampledOrig;
      previewSourceOrig.loop = true;
      previewSourceOrig.connect(gainOriginal);
      previewSourceOrig.connect(analyserOriginal);
      gainOriginal.connect(gainMaster);

      gainMaster.connect(previewCtx.destination);

      lastRenderParams = {
        sampleRate: targetRate,
        stereo: state.stereo,
        playbackRate: pRate,
        bitDepth: state.bitDepth,
        grit: state.grit,
        noise: state.noise,
        crushMode: state.crushMode,
        dither: state.dither,
        normalize: state.normalize,
        hpf: state.hpf,
        lpf: state.lpf,
        bass: state.bass
      };
      log('Preview started (Fallback mode)', 'ok');
    }

    previewStartTime = previewCtx.currentTime;
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
    if (mySessionId === _previewSessionId) {
      _dom.btnPreview.disabled = false;
    }
  }
}

export function stopPreview() {
  _previewSessionId++; // Invalidate any running async operations
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
  if (hpfNode) { try { hpfNode.disconnect(); } catch (_) {} hpfNode = null; }
  if (lpfNode) { try { lpfNode.disconnect(); } catch (_) {} lpfNode = null; }
  if (bassNode) { try { bassNode.disconnect(); } catch (_) {} bassNode = null; }
  if (gainCrunched) { try { gainCrunched.disconnect(); } catch(_) {} gainCrunched = null; }
  if (gainOriginal) { try { gainOriginal.disconnect(); } catch(_) {} gainOriginal = null; }
  if (gainMaster) { try { gainMaster.disconnect(); } catch(_) {} gainMaster = null; }
  if (analyserCrunched) { analyserCrunched = null; }
  if (analyserOriginal) { analyserOriginal = null; }

  previewDecoded = null;
  previewResampled = null;
  previewResampledOrig = null;
  previewResampledWet = null;

  // Reset UI
  if (_dom.btnPreview) _dom.btnPreview.classList.remove('playing');
  if (_dom.btnPreviewLbl) _dom.btnPreviewLbl.textContent = 'PREVIEW';
  if (_dom.previewIcon) _dom.previewIcon.textContent = '▶';
  if (_dom.abContainer) _dom.abContainer.style.display = 'none';
  if (_dom.dropContent) _dom.dropContent.style.display = 'flex';
  if (_dom.visualizer) _dom.visualizer.style.display = 'none';
  if (_dom.metricsPanel) _dom.metricsPanel.style.display = 'none';

  isComparingOriginal = false;
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

  const mySessionId = ++_previewSessionId;

  clearTimeout(liveUpdateTimer);
  liveUpdateTimer = setTimeout(async () => {
    if (mySessionId !== _previewSessionId) return;

    const pRate = state.playbackRate || 1.0;
    const targetRate = Math.min(Math.max(state.sampleRate, 4000), 48000);
    const numChannels = state.stereo ? Math.min(previewDecoded.numberOfChannels, 2) : 1;

    // Calculate current play offset before rendering
    const now = previewCtx.currentTime;
    const oldDuration = previewResampledWet ? previewResampledWet.duration : 1.0;
    const elapsed = (now - previewStartTime) % oldDuration;

    // Check if we need to recreate the AudioContext (only if targetRate changes in Worklet mode)
    const needsContextRecreation = useWorklet && (previewCtx && previewCtx.sampleRate !== targetRate);

    if (needsContextRecreation) {
      // 1. Close current context
      if (previewCtx) {
        try { await previewCtx.close(); } catch (_) {}
      }
      previewCtx = null;

      // 2. Re-create AudioContext at targetRate
      try {
        previewCtx = new AudioContext({ sampleRate: targetRate });
        await previewCtx.audioWorklet.addModule('./dsp-processor.js');
        if (mySessionId !== _previewSessionId) return;
        useWorklet = true;
      } catch (e) {
        console.warn('Could not create live AudioContext at target rate during update. Falling back.', e);
        useWorklet = false;
        previewCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (mySessionId !== _previewSessionId) return;
      }

      // Recreate all nodes on the new context
      gainCrunched = previewCtx.createGain();
      gainOriginal = previewCtx.createGain();
      analyserCrunched = previewCtx.createAnalyser();
      analyserOriginal = previewCtx.createAnalyser();
      gainCrunched.gain.value = isComparingOriginal ? 0 : 1;
      gainOriginal.gain.value = isComparingOriginal ? 1 : 0;

      gainMaster = previewCtx.createGain();
      gainMaster.gain.value = state.previewVolume;
      gainMaster.connect(previewCtx.destination);

      createLiveFilters(previewCtx);

      if (useWorklet) {
        dspWorkletNode = new AudioWorkletNode(previewCtx, 'dsp-processor', {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [numChannels],
        });
        previewSource = null; // force recreation of previewSource since context has changed
      }
    }

    const needsResample = 
      !lastRenderParams ||
      lastRenderParams.sampleRate   !== targetRate         ||
      lastRenderParams.stereo       !== state.stereo       ||
      lastRenderParams.playbackRate !== pRate;

    const needsDSPUpdate = 
      !lastRenderParams ||
      lastRenderParams.bitDepth  !== state.bitDepth  ||
      lastRenderParams.grit      !== state.grit      ||
      lastRenderParams.noise     !== state.noise     ||
      lastRenderParams.crushMode !== state.crushMode ||
      lastRenderParams.dither    !== state.dither    ||
      lastRenderParams.normalize !== state.normalize;

    const needsFilterUpdate = 
      !lastRenderParams ||
      lastRenderParams.hpf !== state.hpf ||
      lastRenderParams.lpf !== state.lpf ||
      lastRenderParams.bass !== state.bass;

    const shouldHotSwap = needsResample || (!useWorklet && needsDSPUpdate) || needsContextRecreation || !previewSource;

    // Update live filters and worklet params immediately
    updateLiveFilters();
    if (useWorklet) {
      updateWorkletParams();
    }

    if (shouldHotSwap) {
      // 3. Re-render the buffers
      if (needsResample || !previewResampled || !previewResampledOrig || needsContextRecreation) {
        previewResampled = await renderFilteredBuffer(previewDecoded, { 
          playbackRate: pRate, 
          sampleRate: targetRate 
        }, numChannels);
        if (mySessionId !== _previewSessionId) return;

        previewResampledOrig = await renderFilteredBuffer(previewDecoded, {
          sampleRate: previewCtx.sampleRate,
          playbackRate: pRate,
        }, numChannels);
        if (mySessionId !== _previewSessionId) return;
      }

      let activeBuffer = null;

      if (useWorklet) {
        activeBuffer = previewResampled;
      } else {
        const processedBuf = previewCtx.createBuffer(
          previewResampled.numberOfChannels,
          previewResampled.length,
          previewResampled.sampleRate
        );

        for (let ch = 0; ch < previewResampled.numberOfChannels; ch++) {
          const samples = new Float32Array(previewResampled.getChannelData(ch));
          processDSP(samples, state.bitDepth, state.crushMode, state.dither, state.grit, state.noise);
          if (state.normalize) normalizeBuffer(samples);
          processedBuf.getChannelData(ch).set(samples);
        }
        activeBuffer = processedBuf;
      }

      // Hot-swap nodes
      const oldSrc = previewSource;
      const oldSrcOrig = previewSourceOrig;
      const startNow = previewCtx.currentTime;

      previewSource = previewCtx.createBufferSource();
      previewSource.buffer = activeBuffer;
      previewSource.loop = true;

      if (useWorklet) {
        previewSource.connect(dspWorkletNode);
        if (needsContextRecreation || !oldSrc) {
          dspWorkletNode.connect(hpfNode);
          hpfNode.connect(lpfNode);
          lpfNode.connect(bassNode);
          bassNode.connect(gainCrunched);
          bassNode.connect(analyserCrunched);
          gainCrunched.connect(gainMaster);
          gainOriginal.connect(gainMaster);
        }
      } else {
        previewSource.connect(hpfNode);
        if (needsContextRecreation || !oldSrc) {
          hpfNode.connect(lpfNode);
          lpfNode.connect(bassNode);
          bassNode.connect(gainCrunched);
          bassNode.connect(analyserCrunched);
          gainCrunched.connect(gainMaster);
          gainOriginal.connect(gainMaster);
        }
      }

      previewSourceOrig = previewCtx.createBufferSource();
      previewSourceOrig.buffer = previewResampledOrig;
      previewSourceOrig.loop = true;
      previewSourceOrig.connect(gainOriginal);
      previewSourceOrig.connect(analyserOriginal);

      const newDuration = activeBuffer.duration;
      const progressFraction = elapsed / oldDuration;
      const newElapsed = progressFraction * newDuration;

      previewStartTime = previewCtx.currentTime - newElapsed;

      previewSource.start(startNow, newElapsed);
      previewSourceOrig.start(startNow, newElapsed);

      if (oldSrc) {
        try { oldSrc.stop(startNow + 0.1); } catch (_) {}
      }
      if (oldSrcOrig) {
        try { oldSrcOrig.stop(startNow + 0.1); } catch (_) {}
      }
    }

    // Background offline render to update previewResampledWet for metrics estimation
    if (needsResample || needsFilterUpdate || !previewResampledWet || shouldHotSwap) {
      const filteredBuf = await renderFilteredBuffer(previewResampled || previewDecoded, {
        hpf: state.hpf,
        lpf: state.lpf,
        bass: state.bass,
        playbackRate: 1.0,
        sampleRate: targetRate
      }, numChannels);
      if (mySessionId !== _previewSessionId) return;

      if (useWorklet) {
        previewResampledWet = filteredBuf;
        
        let globalPeak = 0;
        for (let ch = 0; ch < previewResampledWet.numberOfChannels; ch++) {
          const data = previewResampledWet.getChannelData(ch);
          for (let i = 0; i < data.length; i++) {
            const a = data[i] < 0 ? -data[i] : data[i];
            if (a > globalPeak) globalPeak = a;
          }
        }
        currentPreGain = 1.0 / (globalPeak + 1e-9);
        updateWorkletParams();
      } else {
        const processedBuf = previewCtx.createBuffer(
          filteredBuf.numberOfChannels,
          filteredBuf.length,
          filteredBuf.sampleRate
        );

        for (let ch = 0; ch < filteredBuf.numberOfChannels; ch++) {
          const samples = new Float32Array(filteredBuf.getChannelData(ch));
          processDSP(samples, state.bitDepth, state.crushMode, state.dither, state.grit, state.noise);
          if (state.normalize) normalizeBuffer(samples);
          processedBuf.getChannelData(ch).set(samples);
        }
        previewResampledWet = processedBuf;
      }
    }

    lastRenderParams = {
      sampleRate: targetRate,
      stereo: state.stereo,
      playbackRate: pRate,
      bitDepth: state.bitDepth,
      grit: state.grit,
      noise: state.noise,
      crushMode: state.crushMode,
      dither: state.dither,
      normalize: state.normalize,
      hpf: state.hpf,
      lpf: state.lpf,
      bass: state.bass
    };

    log('live update: preview parameters updated', 'sys');
    updateMetricsPanel();

  }, 100);
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
    const dryBuf = previewResampledOrig || previewDecoded;
    const wetBuf = previewResampledWet || dryBuf;
    metricsOrig = computeAudioMetrics(dryBuf);
    
    // Check if we need to re-run DSP estimation
    const currentDSPParams = `${state.bitDepth}-${state.crushMode}-${state.dither}-${state.grit}-${state.noise}-${state.normalize}`;
    
    if (metricsLastDecoded !== wetBuf) {
      metricsDrySample = null;
      metricsCachedCrunch = null;
      metricsLastDecoded = wetBuf;
    }

    if (!metricsDrySample) {
      const sampleRate = wetBuf.sampleRate;
      const sampleLen = Math.min(sampleRate, wetBuf.length);
      const startSample = Math.floor((wetBuf.length - sampleLen) / 2);
      metricsDrySample = wetBuf.getChannelData(0).slice(startSample, startSample + sampleLen);
      metricsProcessedSample = new Float32Array(metricsDrySample.length);
    }

    if (metricsLastDSPParams !== currentDSPParams || !metricsCachedCrunch) {
      metricsProcessedSample.set(metricsDrySample);
      processDSP(metricsProcessedSample, state.bitDepth, state.crushMode, state.dither, state.grit, state.noise);
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
    metricsOrig = computeAudioMetrics(previewResampledOrig || previewResampled);
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
  const timeCrunched = new Uint8Array(bufferLength);
  const timeOriginal = new Uint8Array(bufferLength);

  let lastPeak = 0;

  const draw = () => {
    if (!_dom.btnPreview.classList.contains('playing')) return;
    requestAnimationFrame(draw);

    analyserCrunched.getByteFrequencyData(dataCrunched);
    analyserOriginal.getByteFrequencyData(dataOriginal);
    analyserCrunched.getByteTimeDomainData(timeCrunched);
    analyserOriginal.getByteTimeDomainData(timeOriginal);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 1. Draw frequency bars
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

    // 2. Compute peak level (ballistics)
    let peakC = 0;
    let peakO = 0;
    for (let i = 0; i < bufferLength; i++) {
      const valC = Math.abs(timeCrunched[i] - 128) / 128;
      if (valC > peakC) peakC = valC;
      const valO = Math.abs(timeOriginal[i] - 128) / 128;
      if (valO > peakO) peakO = valO;
    }

    let currentPeak = isComparingOriginal ? peakO : peakC;
    if (state.dualView) {
      currentPeak = Math.max(peakO, peakC);
    }

    if (currentPeak >= lastPeak) {
      lastPeak = currentPeak;
    } else {
      // Smooth decay at 60fps
      lastPeak = lastPeak * 0.92 + currentPeak * 0.08;
    }

    // 3. Draw horizontal VU Level Meter at the top
    const meterHeight = 4;
    const meterY = 0;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, meterY, canvas.width, meterHeight);

    const meterWidth = Math.min(lastPeak * canvas.width, canvas.width);
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, '#c6f6d5');     // Safe green
    grad.addColorStop(0.65, '#fef3c7');  // Warning yellow
    grad.addColorStop(0.9, '#ff85a1');   // Red/Pink clipping zone
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, meterY, meterWidth, meterHeight);
  };

  draw();
}

export function setPreviewVolume(vol) {
  state.previewVolume = vol;
  if (gainMaster && previewCtx) {
    const now = previewCtx.currentTime;
    gainMaster.gain.setTargetAtTime(vol, now, 0.02);
  }
}
