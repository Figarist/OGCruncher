/**
 * OGCruncher — UI Controller
 * by figarist · https://figarist.github.io
 */

'use strict';

import { state, saveState, loadState, updateHash, parseHash, pushHistory, undo, redo, pauseHistory, setOnStateChange } from './state.js';
import { initUtils, log, showToast, setBadge, updateSliderTrack } from './utils.js';
import { initQueue, addFiles, clearQueue, startProcessing, loadDemoTrack, handleItems } from './queue.js';
import { initPreview, togglePreview, toggleAB, requestPreviewUpdate, updateWorkletParams, setPreviewVolume } from './preview.js';

const SITE_URL = 'https://figarist.github.io/OGCruncher/';

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
const btnClearQueue = $('btn-clear-queue');
const btnPresetAuthor = $('btn-preset-author');
const btnPresetNes = $('btn-preset-nes');
const btnPresetAmiga = $('btn-preset-amiga');
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
const outNormalize = $('out-normalize');
const abContainer = $('ab-container');
const sliderPreviewVolume = $('slider-preview-volume');
const outPreviewVolume = $('out-preview-volume');
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
const btnInfo = $('btn-info');
const modalInfo = $('modal-info');
const btnInfoOk = $('btn-info-ok');

let _isDragging = false; 
let _installPrompt = null; 

/* ════════════════════════════════════════════════════════════════════
   SYNC FUNCTIONS
   ════════════════════════════════════════════════════════════════════ */

function syncBitDepth(val) {
  if (!_isDragging) pushHistory();
  state.bitDepth = +val;
  sliderBit.value = val;
  outBit.textContent = val;
  sliderBit.setAttribute('aria-valuenow', val);
  updateSliderTrack(sliderBit);
  saveState();
  updateWorkletParams();
  if (state.liveUpdate) requestPreviewUpdate();
}

function updateSrButtons(val) {
  const btns = document.querySelectorAll('.btn-sr-snap');
  btns.forEach(btn => {
    const active = +btn.dataset.value === +val;
    btn.classList.toggle('active', active);
    btn.classList.toggle('btn--sr', active);
  });
}

function syncSampleRate(val) {
  if (!_isDragging) pushHistory();
  state.sampleRate = +val;
  sliderSr.value = val;
  outSr.innerHTML = `${(+val).toLocaleString()} <span class="unit">Hz</span>`;
  sliderSr.setAttribute('aria-valuenow', val);
  updateSliderTrack(sliderSr);
  updateSrButtons(val);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}
window.syncSampleRate = syncSampleRate;

function syncGrit(val) {
  if (!_isDragging) pushHistory();
  state.grit = +val;
  sliderGrit.value = val;
  outGrit.textContent = val;
  updateSliderTrack(sliderGrit);
  saveState();
  updateWorkletParams();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncNoise(val) {
  if (!_isDragging) pushHistory();
  state.noise = +val;
  sliderNoise.value = val;
  outNoise.textContent = val;
  updateSliderTrack(sliderNoise);
  saveState();
  updateWorkletParams();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncSpeed(val) {
  if (!_isDragging) pushHistory();
  state.playbackRate = parseFloat(val);
  sliderSpeed.value = state.playbackRate;
  outSpeed.textContent = Math.round(state.playbackRate * 100) + '%';
  updateSliderTrack(sliderSpeed);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncHpf(val) {
  if (!_isDragging) pushHistory();
  state.hpf = +val;
  sliderHpf.value = val;
  outHpf.textContent = val > 20 ? `${val} Hz` : '20 Hz';
  updateSliderTrack(sliderHpf);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncLpf(val) {
  if (!_isDragging) pushHistory();
  state.lpf = +val;
  sliderLpf.value = val;
  outLpf.textContent = val < 20000 ? `${val} Hz` : 'OFF';
  updateSliderTrack(sliderLpf);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncBass(val) {
  if (!_isDragging) pushHistory();
  state.bass = +val;
  sliderBass.value = val;
  outBass.textContent = val > 0 ? `+${val} dB` : '0 dB';
  updateSliderTrack(sliderBass);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function applyParamsToUI(p) {
  pauseHistory(true); 
  
  if (p.bitDepth !== undefined) {
    state.bitDepth = +p.bitDepth;
    sliderBit.value = p.bitDepth;
    outBit.textContent = p.bitDepth;
    sliderBit.setAttribute('aria-valuenow', p.bitDepth);
    updateSliderTrack(sliderBit);
  }
  if (p.sampleRate !== undefined) {
    state.sampleRate = +p.sampleRate;
    sliderSr.value = p.sampleRate;
    outSr.innerHTML = `${(+p.sampleRate).toLocaleString()} <span class="unit">Hz</span>`;
    sliderSr.setAttribute('aria-valuenow', p.sampleRate);
    updateSliderTrack(sliderSr);
    updateSrButtons(p.sampleRate);
  }
  if (p.grit !== undefined) {
    state.grit = +p.grit;
    sliderGrit.value = p.grit;
    outGrit.textContent = p.grit;
    updateSliderTrack(sliderGrit);
  }
  if (p.noise !== undefined) {
    state.noise = +p.noise;
    sliderNoise.value = p.noise;
    outNoise.textContent = p.noise;
    updateSliderTrack(sliderNoise);
  }
  if (p.playbackRate !== undefined) {
    state.playbackRate = parseFloat(p.playbackRate);
    sliderSpeed.value = state.playbackRate;
    outSpeed.textContent = Math.round(state.playbackRate * 100) + '%';
    updateSliderTrack(sliderSpeed);
  }
  if (p.hpf !== undefined) {
    state.hpf = +p.hpf;
    sliderHpf.value = p.hpf;
    outHpf.textContent = p.hpf > 20 ? `${p.hpf} Hz` : '20 Hz';
    updateSliderTrack(sliderHpf);
  }
  if (p.lpf !== undefined) {
    state.lpf = +p.lpf;
    sliderLpf.value = p.lpf;
    outLpf.textContent = p.lpf < 20000 ? `${p.lpf} Hz` : 'OFF';
    updateSliderTrack(sliderLpf);
  }
  if (p.bass !== undefined) {
    state.bass = +p.bass;
    sliderBass.value = p.bass;
    outBass.textContent = p.bass > 0 ? `+${p.bass} dB` : '0 dB';
    updateSliderTrack(sliderBass);
  }
  
  if (p.crushMode !== undefined) {
    state.crushMode = p.crushMode;
    btnMarioToggle.setAttribute('aria-checked', state.crushMode);
    btnMarioToggle.classList.toggle('active', state.crushMode);
    outMario.textContent = state.crushMode ? 'ON' : 'OFF';
  }
  if (p.stereo !== undefined) {
    state.stereo = p.stereo;
    const isForceMono = !state.stereo;
    btnStereoToggle.setAttribute('aria-checked', isForceMono);
    btnStereoToggle.classList.toggle('active', isForceMono);
    outStereo.textContent = state.stereo ? 'STEREO' : 'MONO';
  }
  if (p.normalize !== undefined) {
    state.normalize = p.normalize;
    btnNormalizeToggle.setAttribute('aria-checked', state.normalize);
    btnNormalizeToggle.classList.toggle('active', state.normalize);
    outNormalize.textContent = state.normalize ? 'ON' : 'OFF';
  }
  if (p.liveUpdate !== undefined) {
    state.liveUpdate = p.liveUpdate;
    btnLiveUpdate.classList.toggle('active', state.liveUpdate);
    const statusEl = $('live-status');
    if (statusEl) statusEl.textContent = state.liveUpdate ? 'ON' : 'OFF';
  }
  if (p.previewVolume !== undefined) {
    state.previewVolume = +p.previewVolume;
    if (sliderPreviewVolume) {
      sliderPreviewVolume.value = p.previewVolume;
      updateSliderTrack(sliderPreviewVolume);
    }
    if (outPreviewVolume) {
      outPreviewVolume.textContent = Math.round(p.previewVolume * 100) + '%';
    }
  }
  
  if (p.dualView !== undefined) {
    state.dualView = p.dualView;
    btnDualView.classList.toggle('active', state.dualView);
    btnDualView.textContent = `DUAL VIEW: ${state.dualView ? 'ON' : 'OFF'}`;
  }
  
  pauseHistory(false);
  updatePresetUI();
  updateWorkletParams();
  if (state.liveUpdate) requestPreviewUpdate();
}

function updatePresetUI() {
  const isMatch = (preset) => {
    if (!preset) return false;
    return (
      +state.bitDepth === +preset.bitDepth &&
      +state.sampleRate === +preset.sampleRate &&
      Math.abs((state.grit || 0) - (preset.grit || 0)) < 0.01 &&
      Math.abs((state.noise || 0) - (preset.noise || 0)) < 0.001 &&
      Math.abs((state.playbackRate || 1.0) - (preset.playbackRate || 1.0)) < 0.01 &&
      +state.hpf === +preset.hpf &&
      +state.lpf === +preset.lpf &&
      +state.bass === +preset.bass &&
      !!state.crushMode === !!preset.crushMode &&
      !!state.stereo === !!preset.stereo &&
      !!state.normalize === !!preset.normalize
    );
  };

  const presetAuthor = {
    bitDepth: 8,
    sampleRate: 22050,
    grit: 1.0,
    noise: 0,
    playbackRate: 1.0,
    hpf: 20,
    lpf: 20000,
    bass: 0,
    crushMode: true,
    stereo: false,
    normalize: true
  };

  const presetNes = {
    bitDepth: 4,
    sampleRate: 12000,
    grit: 1.2,
    noise: 0,
    playbackRate: 1.0,
    hpf: 80,
    lpf: 6000,
    bass: 2,
    crushMode: true,
    stereo: false,
    normalize: true
  };

  const presetAmiga = {
    bitDepth: 8,
    sampleRate: 28000,
    grit: 1.5,
    noise: 0.005,
    playbackRate: 1.0,
    hpf: 20,
    lpf: 10000,
    bass: 0,
    crushMode: false,
    stereo: true,
    normalize: true
  };

  let userPreset = null;
  const saved = localStorage.getItem('ogcruncher_preset');
  if (saved) {
    try {
      userPreset = JSON.parse(saved);
    } catch (_) {}
  }

  const matchAuthor = isMatch(presetAuthor);
  const matchNes = isMatch(presetNes);
  const matchAmiga = isMatch(presetAmiga);
  const matchUser = userPreset ? isMatch(userPreset) : false;

  btnPresetAuthor.classList.toggle('active', matchAuthor);
  if (btnPresetNes) btnPresetNes.classList.toggle('active', matchNes);
  if (btnPresetAmiga) btnPresetAmiga.classList.toggle('active', matchAmiga);
  btnPresetUser.classList.toggle('active', matchUser);
}

function setProgress(pct, text) {
  const p = pct + '%';
  progressFill.style.width = p;
  
  if (pct <= 0) {
    headerProgressFill.style.opacity = '0';
    setTimeout(() => {
      headerProgressFill.style.width = '0%';
    }, 300);
  } else {
    headerProgressFill.style.opacity = '1';
    headerProgressFill.style.width = p;
  }
  
  if (pct >= 100) {
    setTimeout(() => {
      headerProgressFill.style.opacity = '0';
      setTimeout(() => {
        headerProgressFill.style.width = '0%';
      }, 300);
    }, 1000); // Stay full for 1 second, then fade out
  }
  
  progressText.textContent = text;
  progressPct.textContent = Math.round(pct) + '%';
  progressWrap
    .querySelector('.progress-bar')
    .setAttribute('aria-valuenow', Math.round(pct));
}

/* ════════════════════════════════════════════════════════════════════
   RESIZERS
   ════════════════════════════════════════════════════════════════════ */
function initResizers() {
  const main = document.querySelector('.app-main');
  const resizerLeft = $('resizer-left');
  const resizerRight = $('resizer-right');
  if (!main || !resizerLeft || !resizerRight) return;

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
    document.body.classList.add('is-dragging');
    e.currentTarget.classList.add('dragging');
    main.style.transition = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!activeResizer) return;
    const rect = main.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const totalWidth = rect.width;
    const style = getComputedStyle(main);
    const cols = style.gridTemplateColumns.split(' ');
    const leftPx = parseFloat(cols[0]);

    if (activeResizer === 'left') {
      const newLeft = Math.max(240, Math.min(x, totalWidth - 600));
      main.style.setProperty('--col-left', `${newLeft}px`);
      main.style.setProperty('--col-right', `1fr`);
    } else {
      const centerStart = leftPx + 6;
      const newCenter = Math.max(320, Math.min(x - centerStart, totalWidth - centerStart - 240));
      main.style.setProperty('--col-center', `${newCenter}px`);
      main.style.setProperty('--col-right', `1fr`);
    }
  };

  const onMouseUp = () => {
    if (activeResizer) {
      resizerLeft.classList.remove('dragging');
      resizerRight.classList.remove('dragging');
      main.style.transition = '';
      const style = getComputedStyle(main);
      const cols = style.gridTemplateColumns.split(' ');
      localStorage.setItem('og_col_left', cols[0]);
      localStorage.setItem('og_col_center', cols[2]);
      localStorage.setItem('og_col_right', cols[4]);
    }
    activeResizer = null;
    document.body.style.cursor = '';
    document.body.classList.remove('is-dragging');
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  resizerLeft.addEventListener('mousedown', onMouseDown);
  resizerRight.addEventListener('mousedown', onMouseDown);
}

/* ════════════════════════════════════════════════════════════════════
   EVENT LISTENERS
   ════════════════════════════════════════════════════════════════════ */

dropZone.addEventListener('dragenter', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragover', e => { e.preventDefault(); });
dropZone.addEventListener('dragleave', e => { if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over'); });

dropZone.addEventListener('drop', async e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  if (state.processing) return;
  if (e.dataTransfer.items) {
    await handleItems(e.dataTransfer.items);
  } else {
    addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/') || /\.(wav|mp3|flac|ogg|aiff?|m4a)$/i.test(f.name)));
  }
});

dropZone.addEventListener('click', () => { if (!state.processing) fileInput.click(); });
dropZone.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); if (!state.processing) fileInput.click(); } });
fileInput.addEventListener('change', () => { if (state.processing) return; addFiles(Array.from(fileInput.files)); fileInput.value = ''; });

const wrapSlider = (slider, syncFn) => {
  slider.addEventListener('pointerdown', () => {
    _isDragging = true;
    pushHistory();
  });
  slider.addEventListener('pointerup', () => {
    _isDragging = false;
  });
  slider.addEventListener('input', () => syncFn(slider.value));
};

wrapSlider(sliderBit, syncBitDepth);
wrapSlider(sliderSr, syncSampleRate);
wrapSlider(sliderGrit, syncGrit);
wrapSlider(sliderNoise, syncNoise);
wrapSlider(sliderSpeed, syncSpeed);
wrapSlider(sliderHpf, syncHpf);
wrapSlider(sliderLpf, syncLpf);
wrapSlider(sliderBass, syncBass);

if (sliderPreviewVolume) {
  sliderPreviewVolume.addEventListener('input', () => {
    const vol = parseFloat(sliderPreviewVolume.value);
    setPreviewVolume(vol);
    if (outPreviewVolume) {
      outPreviewVolume.textContent = Math.round(vol * 100) + '%';
    }
    updateSliderTrack(sliderPreviewVolume);
    saveState();
  });
}

btnMarioToggle.addEventListener('click', () => {
  pushHistory();
  state.crushMode = !state.crushMode;
  btnMarioToggle.setAttribute('aria-checked', state.crushMode);
  btnMarioToggle.classList.toggle('active', state.crushMode);
  saveState();
  updateWorkletParams();
  if (state.liveUpdate) requestPreviewUpdate();
  outMario.textContent = state.crushMode ? 'ON' : 'OFF';
  log(`Crush mode: ${state.crushMode ? 'ENABLED' : 'DISABLED'}`, 'sys');
});

btnStereoToggle.addEventListener('click', () => {
  pushHistory();
  state.stereo = !state.stereo;
  const isForceMono = !state.stereo;
  btnStereoToggle.setAttribute('aria-checked', isForceMono);
  btnStereoToggle.classList.toggle('active', isForceMono);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
  outStereo.textContent = state.stereo ? 'STEREO' : 'MONO';
  log(`Output mode: ${state.stereo ? 'STEREO' : 'MONO'}`, 'sys');
});

btnNormalizeToggle.addEventListener('click', () => {
  pushHistory();
  state.normalize = !state.normalize;
  btnNormalizeToggle.setAttribute('aria-checked', state.normalize);
  btnNormalizeToggle.classList.toggle('active', state.normalize);
  saveState();
  updateWorkletParams();
  if (state.liveUpdate) requestPreviewUpdate();
  outNormalize.textContent = state.normalize ? 'ON' : 'OFF';
  log(`Normalization: ${state.normalize ? 'ENABLED' : 'DISABLED'}`, 'sys');
});

btnDualView.addEventListener('click', () => {
  pushHistory();
  state.dualView = !state.dualView;
  btnDualView.classList.toggle('active', state.dualView);
  btnDualView.textContent = `DUAL VIEW: ${state.dualView ? 'ON' : 'OFF'}`;
  saveState();
  log(`Dual View mode: ${state.dualView ? 'ENABLED' : 'DISABLED'}`, 'sys');
});

btnCopyLink.addEventListener('click', async () => {
  try {
    const shareUrl = SITE_URL + window.location.hash;
    await navigator.clipboard.writeText(shareUrl);
    showToast('🔗 Link copied to clipboard', 'ok');
  } catch (err) {
    showToast('⚠ Copy manually from address bar', 'error');
  }
});

btnPresetAuthor.addEventListener('click', () => {
  pushHistory();
  applyParamsToUI({
    bitDepth: 8,
    sampleRate: 22050,
    grit: 1.0,
    noise: 0,
    playbackRate: 1.0,
    hpf: 20,
    lpf: 20000,
    bass: 0,
    crushMode: true,
    stereo: false,
    normalize: true
  });
  log('preset: LO-Q (author default)', 'accent');
  showToast('◉ author preset loaded', 'info');
});

if (btnPresetNes) {
  btnPresetNes.addEventListener('click', () => {
    pushHistory();
    applyParamsToUI({
      bitDepth: 4,
      sampleRate: 12000,
      grit: 1.2,
      noise: 0,
      playbackRate: 1.0,
      hpf: 80,
      lpf: 6000,
      bass: 2,
      crushMode: true,
      stereo: false,
      normalize: true
    });
    log('preset: NES 8-BIT (retro gaming classic)', 'accent');
    showToast('🎮 NES 8-bit preset loaded', 'info');
  });
}

if (btnPresetAmiga) {
  btnPresetAmiga.addEventListener('click', () => {
    pushHistory();
    applyParamsToUI({
      bitDepth: 8,
      sampleRate: 28000,
      grit: 1.5,
      noise: 0.005,
      playbackRate: 1.0,
      hpf: 20,
      lpf: 10000,
      bass: 0,
      crushMode: false,
      stereo: true,
      normalize: true
    });
    log('preset: AMIGA 500 (vintage sampler)', 'accent');
    showToast('💾 Amiga 500 preset loaded', 'info');
  });
}

btnPresetUser.addEventListener('click', () => {
  const saved = localStorage.getItem('ogcruncher_preset');
  if (!saved) return;
  const p = JSON.parse(saved);
  pushHistory();
  applyParamsToUI(p);
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
  updatePresetUI();
  log('custom preset saved to localstorage', 'ok');
  showToast('💾 custom preset saved', 'ok');
});

function setControlsEnabled(enabled) {
  const inputs = [
    sliderBit, sliderSr, sliderGrit, sliderNoise, sliderSpeed,
    sliderHpf, sliderLpf, sliderBass,
    btnMarioToggle, btnStereoToggle, btnNormalizeToggle,
    btnLiveUpdate, btnDualView, btnPresetAuthor, btnPresetNes, btnPresetAmiga, btnPresetUser,
    btnSaveCustom, btnClearQueue, btnLoadDemo, fileInput, sliderPreviewVolume
  ];
  inputs.forEach(el => {
    if (el) el.disabled = !enabled;
  });
  
  // Disable remove buttons in the queue UI
  const removeBtns = fileQueue.querySelectorAll('.btn-remove');
  removeBtns.forEach(btn => {
    btn.disabled = !enabled;
  });

  // Toggle pointer events for the drop zone to prevent drops/clicks during processing
  if (dropZone) {
    dropZone.style.pointerEvents = enabled ? 'auto' : 'none';
    dropZone.style.opacity = enabled ? '1' : '0.6';
  }

  // Toggle visual disabled state for control panels (grey out and block clicks)
  const controlContainers = [
    $('group-presets'),
    document.querySelector('.audio-rack'),
    $('group-filters')
  ];
  controlContainers.forEach(container => {
    if (container) {
      container.classList.toggle('disabled-state', !enabled);
    }
  });
}

btnProcess.addEventListener('click', async () => {
  setControlsEnabled(false);
  try {
    await startProcessing(setProgress);
  } finally {
    setControlsEnabled(true);
  }
});
btnPreview.addEventListener('click', togglePreview);
btnAB.addEventListener('click', toggleAB);
btnClearQueue.addEventListener('click', clearQueue);

btnLiveUpdate.addEventListener('click', () => {
  pushHistory();
  state.liveUpdate = !state.liveUpdate;
  btnLiveUpdate.classList.toggle('active', state.liveUpdate);
  const statusEl = $('live-status');
  if (statusEl) statusEl.textContent = state.liveUpdate ? 'ON' : 'OFF';
  log(`live update: ${state.liveUpdate ? 'ON' : 'OFF'}`, 'sys');
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
});

btnLoadDemo.addEventListener('click', (e) => {
  e.stopPropagation();
  loadDemoTrack();
});

btnInfo.addEventListener('click', () => {
  modalInfo.hidden = false;
});

btnInfoOk.addEventListener('click', () => {
  modalInfo.hidden = true;
});

modalInfo.addEventListener('click', (e) => {
  if (e.target === modalInfo) modalInfo.hidden = true;
});

window.addEventListener('keydown', (e) => {
  if ((e.target.tagName === 'INPUT' && e.target.type !== 'range') || e.target.tagName === 'TEXTAREA') return;

  if (state.processing) {
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyC' || e.code === 'KeyN' || e.code === 'KeyZ' || e.code === 'KeyY') {
      e.preventDefault();
      return;
    }
  }

  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
    e.preventDefault();
    const ok = undo(applyParamsToUI);
    if (ok) showToast('↩ undo', 'sys');
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey))) {
    e.preventDefault();
    const ok = redo(applyParamsToUI);
    if (ok) showToast('↪ redo', 'sys');
    return;
  }

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

/* ════════════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════════════ */

(function init() {
  setOnStateChange(updatePresetUI);
  initUtils({ logWindow, toast, badgeStatus });
  initQueue({ 
    fileQueue, queueHeader, btnProcess, btnProcessLbl, 
    btnPreview, resultsArea, progressWrap, btnLoadDemo 
  });
  initPreview({ 
    btnPreview, btnPreviewLbl, previewIcon, abContainer, 
    abStatus, btnAB, visualizer, dropContent,
    metricsPanel:      document.getElementById('metrics-panel'),
    metricRmsOrig:     document.getElementById('metric-rms-orig'),
    metricRmsCrunch:   document.getElementById('metric-rms-crunch'),
    metricPeakOrig:    document.getElementById('metric-peak-orig'),
    metricPeakCrunch:  document.getElementById('metric-peak-crunch'),
    metricDurOrig:     document.getElementById('metric-dur-orig'),
    metricDurCrunch:   document.getElementById('metric-dur-crunch'),
  });

  pauseHistory(true); 

  syncBitDepth(8);
  syncSampleRate(22050);
  syncGrit(1.0);
  syncNoise(0);
  syncSpeed(1.0);
  syncHpf(20);
  syncLpf(20000);
  syncBass(0);
  
  state.normalize = true;
  if (btnNormalizeToggle) {
    btnNormalizeToggle.setAttribute('aria-checked', true);
    btnNormalizeToggle.classList.add('active');
  }
  
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


  loadState(applyParamsToUI);
  parseHash(applyParamsToUI);
  initResizers();
  
  // Show info modal on first visit
  if (!localStorage.getItem('og_seen_info')) {
    modalInfo.hidden = false;
    localStorage.setItem('og_seen_info', 'true');
  }

  // ── PWA Install Prompt ────────────────────────────────────────────────
  const badgePwa = $('badge-pwa');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); 
    _installPrompt = e;

    if (badgePwa) {
      badgePwa.textContent = '⬇ INSTALL APP';
      badgePwa.classList.remove('badge--green');
      badgePwa.classList.add('badge--install', 'badge--pulse');
      badgePwa.style.cursor = 'pointer';
      badgePwa.title = 'Install OGCruncher as a standalone app';
      badgePwa.setAttribute('role', 'button');
      badgePwa.setAttribute('tabindex', '0');

      const doInstall = async () => {
        if (!_installPrompt) return;
        _installPrompt.prompt();
        const { outcome } = await _installPrompt.userChoice;
        _installPrompt = null;

        if (outcome === 'accepted') {
          badgePwa.textContent = 'PWA READY';
          badgePwa.classList.add('badge--green');
          badgePwa.classList.remove('badge--install', 'badge--pulse');
          badgePwa.style.cursor = '';
          badgePwa.removeAttribute('role');
          badgePwa.removeAttribute('tabindex');
          badgePwa.removeEventListener('click', doInstall);
          badgePwa.removeEventListener('keydown', onKeydown);
          log('OGCruncher installed as standalone app.', 'ok');
          showToast('✅ App installed!', 'ok');
        } else {
          log('Install dismissed.', 'sys');
        }
      };

      const onKeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') doInstall(); };

      badgePwa.addEventListener('click', doInstall);
      badgePwa.addEventListener('keydown', onKeydown);
      log('Install prompt available — click "INSTALL APP" in the header.', 'sys');
    }
  });

  window.addEventListener('appinstalled', () => {
    _installPrompt = null;
    if (badgePwa) {
      badgePwa.textContent = 'PWA READY';
      badgePwa.classList.add('badge--green');
      badgePwa.classList.remove('badge--install', 'badge--pulse');
      badgePwa.style.cursor = '';
    }
    log('App installed via browser UI.', 'ok');
  });

  updatePresetUI();
  pauseHistory(false);
  pushHistory(); 
  log('ready. drop files or click browse.', 'ok');
  setBadge('IDLE', 'badge--amber');
})();
