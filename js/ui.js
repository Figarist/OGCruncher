/**
 * OGCruncher — UI Controller
 * by figarist · https://figarist.github.io
 */

'use strict';

import { state, saveState, loadState, updateHash, parseHash } from './state.js';
import { initUtils, log, showToast, setBadge, updateSliderTrack } from './utils.js';
import { initQueue, addFiles, clearQueue, startProcessing, loadDemoTrack, handleItems } from './queue.js';
import { initPreview, togglePreview, toggleAB, requestPreviewUpdate } from './preview.js';

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
const outStereo = $('out-stereo');
const outNormalize = $('out-normalize');
const abContainer = $('ab-container');
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

/* ════════════════════════════════════════════════════════════════════
   SYNC FUNCTIONS
   ════════════════════════════════════════════════════════════════════ */

function syncBitDepth(val) {
  state.bitDepth = +val;
  sliderBit.value = val;
  outBit.textContent = val;
  sliderBit.setAttribute('aria-valuenow', val);
  updateSliderTrack(sliderBit);
  saveState();
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
  state.grit = +val;
  sliderGrit.value = val;
  outGrit.textContent = val;
  updateSliderTrack(sliderGrit);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncNoise(val) {
  state.noise = +val;
  sliderNoise.value = val;
  outNoise.textContent = val;
  updateSliderTrack(sliderNoise);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncSpeed(val) {
  state.playbackRate = parseFloat(val);
  sliderSpeed.value = state.playbackRate;
  outSpeed.textContent = Math.round(state.playbackRate * 100) + '%';
  updateSliderTrack(sliderSpeed);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncHpf(val) {
  state.hpf = +val;
  sliderHpf.value = val;
  outHpf.textContent = val > 20 ? `${val} Hz` : '20 Hz';
  updateSliderTrack(sliderHpf);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncLpf(val) {
  state.lpf = +val;
  sliderLpf.value = val;
  outLpf.textContent = val < 20000 ? `${val} Hz` : 'OFF';
  updateSliderTrack(sliderLpf);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncBass(val) {
  state.bass = +val;
  sliderBass.value = val;
  outBass.textContent = val > 0 ? `+${val} dB` : '0 dB';
  updateSliderTrack(sliderBass);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function applyParamsToUI(p) {
  if (p.bitDepth !== undefined) syncBitDepth(p.bitDepth);
  if (p.sampleRate !== undefined) syncSampleRate(p.sampleRate);
  if (p.grit !== undefined) syncGrit(p.grit);
  if (p.noise !== undefined) syncNoise(p.noise);
  if (p.playbackRate !== undefined) syncSpeed(p.playbackRate);
  if (p.hpf !== undefined) syncHpf(p.hpf);
  if (p.lpf !== undefined) syncLpf(p.lpf);
  if (p.bass !== undefined) syncBass(p.bass);
  if (p.crushMode !== undefined && p.crushMode !== state.crushMode) btnMarioToggle.click();
  if (p.stereo !== undefined && p.stereo !== state.stereo) btnStereoToggle.click();
  if (p.normalize !== undefined && p.normalize !== state.normalize) btnNormalizeToggle.click();
  if (p.liveUpdate !== undefined && p.liveUpdate !== state.liveUpdate) btnLiveUpdate.click();
  if (p.dualView !== undefined && p.dualView !== state.dualView) btnDualView.click();
}

function updatePresetUI(type) {
  btnPresetAuthor.classList.toggle('active', type === 'author');
  btnPresetUser.classList.toggle('active', type === 'user');
}

function setProgress(pct, text) {
  const p = pct + '%';
  progressFill.style.width = p;
  headerProgressFill.style.width = p;
  
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
  if (e.dataTransfer.items) {
    await handleItems(e.dataTransfer.items);
  } else {
    addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/') || /\.(wav|mp3|flac|ogg|aiff?|m4a)$/i.test(f.name)));
  }
});

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); fileInput.click(); } });
fileInput.addEventListener('change', () => { addFiles(Array.from(fileInput.files)); fileInput.value = ''; });

sliderBit.addEventListener('input', () => syncBitDepth(sliderBit.value));
sliderSr.addEventListener('input', () => syncSampleRate(sliderSr.value));
sliderGrit.addEventListener('input', () => syncGrit(sliderGrit.value));
sliderNoise.addEventListener('input', () => syncNoise(sliderNoise.value));
sliderSpeed.addEventListener('input', () => syncSpeed(sliderSpeed.value));
sliderHpf.addEventListener('input', () => syncHpf(sliderHpf.value));
sliderLpf.addEventListener('input', () => syncLpf(sliderLpf.value));
sliderBass.addEventListener('input', () => syncBass(sliderBass.value));

btnMarioToggle.addEventListener('click', () => {
  state.crushMode = !state.crushMode;
  btnMarioToggle.setAttribute('aria-checked', state.crushMode);
  btnMarioToggle.classList.toggle('active', state.crushMode);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
  outMario.textContent = state.crushMode ? 'ON' : 'OFF';
  log(`Crush mode: ${state.crushMode ? 'ENABLED' : 'DISABLED'}`, 'sys');
});

btnStereoToggle.addEventListener('click', () => {
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
  state.normalize = !state.normalize;
  btnNormalizeToggle.setAttribute('aria-checked', state.normalize);
  btnNormalizeToggle.classList.toggle('active', state.normalize);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
  outNormalize.textContent = state.normalize ? 'ON' : 'OFF';
  log(`Normalization: ${state.normalize ? 'ENABLED' : 'DISABLED'}`, 'sys');
});

btnDualView.addEventListener('click', () => {
  state.dualView = !state.dualView;
  btnDualView.classList.toggle('active', state.dualView);
  btnDualView.textContent = `DUAL VIEW: ${state.dualView ? 'ON' : 'OFF'}`;
  saveState();
  log(`Dual View mode: ${state.dualView ? 'ENABLED' : 'DISABLED'}`, 'sys');
});

btnCopyLink.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    showToast('🔗 Link copied to clipboard', 'ok');
  } catch (err) {
    showToast('⚠ Copy manually from address bar', 'error');
  }
});

btnPresetAuthor.addEventListener('click', () => {
  syncBitDepth(8);
  syncSampleRate(22050);
  syncGrit(1.0);
  syncNoise(0);
  syncHpf(20);
  syncLpf(20000);
  syncBass(0);
  if (!state.crushMode) btnMarioToggle.click();
  if (state.stereo) btnStereoToggle.click();
  if (!state.normalize) btnNormalizeToggle.click();
  updatePresetUI('author');
  log('preset: LO-Q (author default)', 'accent');
  showToast('◉ author preset loaded', 'info');
  saveState();
});

btnPresetUser.addEventListener('click', () => {
  const saved = localStorage.getItem('ogcruncher_preset');
  if (!saved) return;
  const p = JSON.parse(saved);
  applyParamsToUI(p);
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
    normalize: state.normalize,
    ts: Date.now()
  };
  localStorage.setItem('ogcruncher_preset', JSON.stringify(preset));
  btnPresetUser.disabled = false;
  userPresetMeta.textContent = `${preset.bitDepth}-bit / ${preset.sampleRate}Hz`;
  updatePresetUI('user');
  log('custom preset saved to localstorage', 'ok');
  showToast('💾 custom preset saved', 'ok');
});

btnProcess.addEventListener('click', () => startProcessing(setProgress));
btnPreview.addEventListener('click', togglePreview);
btnAB.addEventListener('click', toggleAB);
btnClearQueue.addEventListener('click', clearQueue);

btnLiveUpdate.addEventListener('click', () => {
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

window.addEventListener('keydown', (e) => {
  if ((e.target.tagName === 'INPUT' && e.target.type !== 'range') || e.target.tagName === 'TEXTAREA') return;
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
  initUtils({ logWindow, toast, badgeStatus });
  initQueue({ 
    fileQueue, queueHeader, btnProcess, btnProcessLbl, 
    btnPreview, resultsArea, progressWrap, btnLoadDemo 
  });
  initPreview({ 
    btnPreview, btnPreviewLbl, previewIcon, abContainer, 
    abStatus, btnAB, visualizer, dropContent 
  });

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
  
  log('ready. drop files or click browse.', 'ok');
  setBadge('IDLE', 'badge--amber');
})();
