/**
 * OGCruncher — Preview Engine
 * by figarist · https://figarist.github.io
 */

'use strict';

import { state } from './state.js';
import { log, showToast } from './utils.js';
import { processDSP, normalizeBuffer, renderFilteredBuffer, safeOfflineCtx } from './dsp.js';

let _dom = {};
let previewSource = null;
let previewSourceOrig = null;
let gainCrunched = null;
let gainOriginal = null;
let previewCtx = null;
let analyserCrunched = null;
let analyserOriginal = null;
let visDrawId = null;
let liveUpdateTimer = null;
let previewStartTime = 0;
let previewDecoded = null;

// CACHE: Dry and Wet resampled buffers
let previewResampled = null;     // Dry (raw resampled)
let previewResampledWet = null;  // Wet (resampled + filters)

let lastRenderParams = {};   
let isUpdatingPreview = false;
let isComparingOriginal = false;

/**
 * Initialize preview with DOM references.
 */
export function initPreview(domRefs) {
  _dom = domRefs;
}

export async function stopPreview() {
  if (liveUpdateTimer) clearTimeout(liveUpdateTimer);
  if (visDrawId) cancelAnimationFrame(visDrawId);
  if (_dom.visualizer) {
    _dom.visualizer.style.display = 'none';
    _dom.visualizer.classList.remove('visualizer-glow');
  }
  if (_dom.dropContent) _dom.dropContent.style.display = 'flex';

  if (previewSource) { try { previewSource.stop(); } catch (e) { } previewSource = null; }
  if (previewSourceOrig) { try { previewSourceOrig.stop(); } catch (e) { } previewSourceOrig = null; }

  _dom.btnPreview.classList.remove('playing');
  _dom.btnPreviewLbl.textContent = 'PREVIEW';
  _dom.previewIcon.textContent = '▶';
  _dom.abContainer.style.display = 'none';
  isComparingOriginal = false;
  _dom.abStatus.textContent = 'CRUNCHED';
  _dom.btnAB.classList.remove('active');
  
  previewDecoded = null;
  previewResampled = null;
  previewResampledWet = null; // FIXED: clear both caches
  lastRenderParams = {};
}

export function drawVisualizer() {
  if (!_dom.visualizer || _dom.visualizer.style.display === 'none') return;
  const ctx = _dom.visualizer.getContext('2d');
  const width = _dom.visualizer.width;
  const height = _dom.visualizer.height;

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
      ctx.fillStyle = colorOrig;
      ctx.fillRect(x, height - bhOrig, subWidth, bhOrig);
      ctx.fillStyle = colorCr;
      ctx.fillRect(x + subWidth, height - bhCr, subWidth, bhCr);
    } else {
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

export function toggleAB() {
  if (!previewCtx) return;
  isComparingOriginal = !isComparingOriginal;
  const now = previewCtx.currentTime;

  gainOriginal.gain.setTargetAtTime(isComparingOriginal ? 1 : 0, now, 0.04);
  gainCrunched.gain.setTargetAtTime(isComparingOriginal ? 0 : 1, now, 0.04);

  _dom.abStatus.textContent = isComparingOriginal ? 'ORIGINAL' : 'CRUNCHED';
  _dom.btnAB.classList.toggle('active', isComparingOriginal);
}

export async function togglePreview() {
  if (_dom.btnPreview.classList.contains('playing')) {
    stopPreview();
    return;
  }

  if (state.files.size === 0) return;

  _dom.btnPreview.disabled = true;

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

    // 1. Render DRY resampled buffer
    const offCtx = safeOfflineCtx(
      numChannelsOriginal,
      Math.ceil((decoded.duration / state.playbackRate) * targetRate),
      targetRate
    );

    const src = offCtx.createBufferSource();
    src.buffer = decoded;
    src.playbackRate.value = state.playbackRate;
    src.connect(offCtx.destination);
    src.start(0);

    const resampledDry = await offCtx.startRendering();
    previewResampled = resampledDry;

    // 2. Render WET filtered buffer
    const resampledWet = await renderFilteredBuffer(resampledDry, {
      hpf: state.hpf,
      lpf: state.lpf,
      bass: state.bass,
      playbackRate: 1.0 // resampledDry is already at the target speed
    }, numChannelsProcess);
    previewResampledWet = resampledWet;

    lastRenderParams = {
      sampleRate: state.sampleRate,
      hpf: state.hpf,
      lpf: state.lpf,
      bass: state.bass,
      stereo: state.stereo,
      playbackRate: state.playbackRate,
      numChannelsOriginal: numChannelsOriginal
    };

    // FIXED: Ensure lengths match perfectly (floating point math guard)
    const sharedLength = resampledDry.length;
    const bufCrunched = previewCtx.createBuffer(numChannelsProcess, sharedLength, targetRate);

    // 2. Fill Crunched track with WET samples + processDSP (might be mono)
    for (let ch = 0; ch < numChannelsProcess; ch++) {
      const wetData = resampledWet.getChannelData(ch);
      const samples = new Float32Array(sharedLength);
      // Clamp/Pad in case resampledWet is slightly different length
      samples.set(wetData.subarray(0, sharedLength));
      
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

    gainCrunched.gain.value = 1;
    gainOriginal.gain.value = 0;

    // FIXED: Original track now uses high-quality decoded source directly, 
    // so Sample Rate reduction only affects the Crunched track.
    previewSourceOrig = previewCtx.createBufferSource();
    previewSourceOrig.buffer = decoded;
    previewSourceOrig.playbackRate.value = state.playbackRate;
    previewSourceOrig.connect(gainOriginal);
    previewSourceOrig.connect(analyserOriginal);

    previewSource.onended = stopPreview;

    previewStartTime = previewCtx.currentTime;
    previewDecoded = decoded;

    const startTime = previewCtx.currentTime + 0.1;
    if (bufCrunched.duration > 0) {
      previewSource.start(startTime, 0);
      previewSourceOrig.start(startTime, 0);
    }

    _dom.btnPreview.classList.add('playing');
    _dom.btnPreviewLbl.textContent = 'STOP';
    _dom.previewIcon.textContent = '■';
    _dom.abContainer.style.display = 'flex';

    _dom.dropContent.style.display = 'none';
    _dom.visualizer.style.display = 'block';
    _dom.visualizer.classList.add('visualizer-glow');
    drawVisualizer();

    log(`previewing: ${file.name} (A/B mode active)`, 'accent');

  } catch (err) {
    log(`preview error: ${err.message}`, 'error');
    showToast('❌ preview failed', 'error');
  } finally {
    _dom.btnPreview.disabled = false;
  }
}

export function requestPreviewUpdate() {
  if (!_dom.btnPreview.classList.contains('playing') || !previewDecoded) return;

  clearTimeout(liveUpdateTimer);
  liveUpdateTimer = setTimeout(async () => {
    if (isUpdatingPreview) return;
    isUpdatingPreview = true;

    try {
      const decoded = previewDecoded;
      const targetRate = Math.min(Math.max(state.sampleRate, 4000), 48000);
      const numChannelsOriginal = Math.min(decoded.numberOfChannels, 2);
      const numChannelsProcess = state.stereo ? numChannelsOriginal : 1;

      // FIXED Cause 1: state.playbackRate is now defined
      // FIXED Cause 2: Dry render path logic
      const needsDryRender = !previewResampled ||
        lastRenderParams.sampleRate !== state.sampleRate ||
        lastRenderParams.playbackRate !== state.playbackRate ||
        lastRenderParams.numChannelsOriginal !== numChannelsOriginal;

      if (needsDryRender) {
        const offCtx = safeOfflineCtx(
          numChannelsOriginal,
          Math.ceil((decoded.duration / state.playbackRate) * targetRate),
          targetRate
        );
        const src = offCtx.createBufferSource();
        src.buffer = decoded;
        src.playbackRate.value = state.playbackRate; // resample to target speed
        src.connect(offCtx.destination);
        src.start(0);
        previewResampled = await offCtx.startRendering();
        previewResampledWet = null; // Stale wet cache
      }

      // FIXED Cause 2: Wet render path logic
      const needsWetRender = needsDryRender || !previewResampledWet ||
        lastRenderParams.hpf !== state.hpf ||
        lastRenderParams.lpf !== state.lpf ||
        lastRenderParams.bass !== state.bass ||
        lastRenderParams.stereo !== state.stereo;

      if (needsWetRender) {
        previewResampledWet = await renderFilteredBuffer(previewResampled, {
          hpf: state.hpf,
          lpf: state.lpf,
          bass: state.bass,
          playbackRate: 1.0 // speed is already in previewResampled
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

      // FIXED Cause 3: Ensure perfectly matching lengths
      const sharedLength = previewResampled.length;
      const bufCrunched = previewCtx.createBuffer(numChannelsProcess, sharedLength, previewResampled.sampleRate);

      // Fill Crunched (Wet + DSP)
      for (let ch = 0; ch < numChannelsProcess; ch++) {
        const wetData = previewResampledWet.getChannelData(ch);
        const samples = new Float32Array(sharedLength);
        samples.set(wetData.subarray(0, sharedLength));
        
        processDSP(samples, state.bitDepth, state.crushMode, state.grit, state.noise);
        if (state.normalize) normalizeBuffer(samples);

        bufCrunched.getChannelData(ch).set(samples);
      }

      const oldSource = previewSource;
      const oldSourceOrig = previewSourceOrig;
      const startTime = previewCtx.currentTime + 0.05;

      previewSource = previewCtx.createBufferSource();
      previewSource.buffer = bufCrunched;
      previewSource.connect(gainCrunched);
      previewSource.connect(analyserCrunched);

      // FIXED: Original track now uses high-quality decoded source directly
      previewSourceOrig = previewCtx.createBufferSource();
      previewSourceOrig.buffer = previewDecoded;
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

      // Compute sync position
      const freshPos = (previewCtx.currentTime - previewStartTime);
      const bufDuration = bufCrunched.duration;
      const safeOffset = bufDuration > 0 ? Math.max(0, Math.min(freshPos % bufDuration, bufDuration - 0.005)) : 0;
      
      // FIXED: Original track offset must be scaled by playbackRate to match the 'baked' crunched buffer
      const safeOffsetOrig = safeOffset * state.playbackRate;

      if (bufDuration > 0) {
        previewSource.start(startTime, safeOffset);
        previewSourceOrig.start(startTime, safeOffsetOrig);
        previewStartTime = startTime - safeOffset;
      }

      log(`live update applied (${needsWetRender ? 're-rendered' : 're-crunched'})`, 'sys');
    } catch (e) {
      console.error('Live update failed', e);
    } finally {
      isUpdatingPreview = false;
    }
  }, 300);
}
