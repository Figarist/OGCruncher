/**
 * OGCruncher — UI Controller
 * by figarist · https://sivochka.com
 */

'use strict';

import { state, DEFAULTS, saveState, updateHash, parseHash, readSavedState, sanitizeParams, getStateSnapshot, pushHistory, undo, redo, pauseHistory, pausePersistence, setOnStateChange } from './state.js';
import { initUtils, log, showToast, setBadge, updateSliderTrack } from './utils.js';
import { initQueue, addFiles, clearQueue, cancelProcessing, startProcessing, loadDemoTrack, handleItems, updateSavingsEstimate } from './queue.js';
import { t, hz } from './i18n.js';
import { initPreview, togglePreview, toggleAB, requestPreviewUpdate, invalidatePreviewUpdates, setPreviewVolume, setPreviewLoop } from './preview.js';

const SITE_URL = window.location.origin + window.location.pathname;

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
const btnDitherToggle = $('toggle-dither');
const btnStereoToggle = $('toggle-stereo');
const btnNormalizeToggle = $('toggle-normalize');
const btnNormCeiling = $('btn-norm-ceiling');
const normCeilingLabel = $('norm-ceiling-label');
const btnTrimToggle = $('toggle-trim');
const outTrim = $('out-trim');
const btnFmtOgg = $('btn-fmt-ogg');
const btnFmtWav = $('btn-fmt-wav');
const btnFmtMp3 = $('btn-fmt-mp3');
const btnKeepNames = $('btn-keep-names');
const btnScratchMode = $('btn-scratch-mode');
const btnPreviewLoop = $('btn-preview-loop');
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
const outDither = $('out-dither');
const outNormalize = $('out-normalize');
const outStereo = $('out-stereo');
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
const btnCancel = $('btn-cancel');
const batchSummary = $('batch-summary');

// Simple Mode Refs
const btnModeSimple = $('btn-mode-simple');
const btnModeAdvanced = $('btn-mode-advanced');
const groupSimpleQuality = $('group-simple-quality');
const sliderSimpleQuality = $('slider-simple-quality');
const outSimpleQuality = $('out-simple-quality');
const simpleQualityDesc = $('simple-quality-desc');

let _isDragging = false; 
let _installPrompt = null; 
let _infoTrigger = null;

function safeGet(key) {
  try { return window.localStorage?.getItem(key); } catch (_) { return null; }
}

function safeSet(key, value) {
  try { window.localStorage?.setItem(key, value); } catch (_) { /* persistence is optional */ }
}

function openInfoModal() {
  _infoTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : btnInfo;
  modalInfo.hidden = false;
  btnInfoOk.focus();
}

function closeInfoModal() {
  modalInfo.hidden = true;
  if (_infoTrigger && typeof _infoTrigger.focus === 'function') _infoTrigger.focus();
}

/* ════════════════════════════════════════════════════════════════════
   SYNC FUNCTIONS
   ════════════════════════════════════════════════════════════════════ */

function syncBitDepth(val) {
  if (!_isDragging) pushHistory();
  state.activePreset = null;
  state.bitDepth = +val;
  sliderBit.value = val;
  outBit.textContent = val;
  sliderBit.setAttribute('aria-valuenow', val);
  updateSliderTrack(sliderBit);
  saveState();

  if (state.liveUpdate) requestPreviewUpdate();
  updateSavingsEstimate();
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
  state.activePreset = null;
  state.sampleRate = +val;
  sliderSr.value = val;
  outSr.textContent = hz(+val);
  sliderSr.setAttribute('aria-valuenow', val);
  updateSliderTrack(sliderSr);
  updateSrButtons(val);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
  updateSavingsEstimate();
}


const SIMPLE_QUALITY = [
  { rate: 8000, bits: 8, label: 'TINY (MICRO)', desc: 'Micro size (8kHz / 8-bit) — telephone-like and intentionally lo-fi.' },
  { rate: 16000, bits: 8, label: 'LOW (PORTABLE)', desc: 'Low size (16kHz / 8-bit) — compact retro/mobile character.' },
  { rate: 22050, bits: 12, label: 'MEDIUM (RETRO)', desc: 'Medium size (22.05kHz / 12-bit) — audible vintage texture.' },
  { rate: 32000, bits: 16, label: 'HIGH', desc: 'High quality (32kHz / 16-bit) — the least destructive Simple option.' },
];

function setSimpleMode(enabled, { persist = true } = {}) {
  state.simpleMode = !!enabled;

  const modeSelector = document.getElementById('mode-selector');
  if (modeSelector) modeSelector.dataset.mode = enabled ? 'simple' : 'advanced';

  if (btnModeSimple) btnModeSimple.classList.toggle('active', enabled);
  if (btnModeAdvanced) btnModeAdvanced.classList.toggle('active', !enabled);
  btnModeSimple?.setAttribute('aria-pressed', String(enabled));
  btnModeAdvanced?.setAttribute('aria-pressed', String(!enabled));

  const advancedGroups = [
    'group-presets',
    'group-bitdepth',
    'group-samplerate',
    'group-grit',
    'group-noise',
    'group-mariomode',
    'group-dither',
    'group-normalize',
    'group-stereo',
    'group-trim',
    'group-speed',
    'group-filters'
  ];

  advancedGroups.forEach(id => {
    const el = $(id);
    if (el) {
      el.style.display = enabled ? 'none' : '';
    }
  });

  if (groupSimpleQuality) {
    groupSimpleQuality.style.display = enabled ? 'block' : 'none';
  }

  if (persist) saveState();
}

function applySimpleQualityToState(val) {
  val = Number.isInteger(+val) && +val >= 0 && +val <= 3 ? +val : DEFAULTS.simpleQuality;
  const quality = SIMPLE_QUALITY[val];
  state.simpleQuality = val;
  state.sampleRate = quality.rate;
  state.bitDepth = quality.bits;
  return quality;
}

function syncSimpleQuality(val, { persist = true, requestPreview = true } = {}) {
  const quality = applySimpleQualityToState(val);
  if (sliderSimpleQuality) {
    sliderSimpleQuality.value = state.simpleQuality;
    sliderSimpleQuality.setAttribute('aria-valuenow', state.simpleQuality);
    updateSliderTrack(sliderSimpleQuality);
  }
  if (outSimpleQuality) outSimpleQuality.textContent = t(quality.label);
  if (simpleQualityDesc) simpleQualityDesc.textContent = t(quality.desc);

  // Keep hidden standard sliders in sync
  if (sliderBit) {
    sliderBit.value = state.bitDepth;
    outBit.textContent = state.bitDepth;
    sliderBit.setAttribute('aria-valuenow', state.bitDepth);
    updateSliderTrack(sliderBit);
  }
  if (sliderSr) {
    sliderSr.value = state.sampleRate;
    outSr.textContent = hz(state.sampleRate);
    sliderSr.setAttribute('aria-valuenow', state.sampleRate);
    updateSliderTrack(sliderSr);
    updateSrButtons(state.sampleRate);
  }

  if (persist) saveState();

  if (requestPreview && state.liveUpdate) requestPreviewUpdate();
  updateSavingsEstimate();
}

function formatGritLabel(val) {
  const num = Number(val);
  return !Number.isFinite(num) || num <= 1.0001 ? t('OFF') : num.toFixed(1);
}

function formatNoiseLabel(val) {
  const num = Number(val);
  if (!Number.isFinite(num) || num <= 0) return t('OFF');
  return `${Math.round(20 * Math.log10(num))} ${t('dB')}`;
}

function syncGrit(val) {
  if (!_isDragging) pushHistory();
  state.activePreset = null;
  state.grit = +val;
  sliderGrit.value = val;
  sliderGrit.setAttribute('aria-valuenow', val);
  outGrit.textContent = formatGritLabel(val);
  updateSliderTrack(sliderGrit);
  saveState();

  if (state.liveUpdate) requestPreviewUpdate();
}

function syncNoise(val) {
  if (!_isDragging) pushHistory();
  state.activePreset = null;
  state.noise = +val;
  sliderNoise.value = val;
  sliderNoise.setAttribute('aria-valuenow', val);
  outNoise.textContent = formatNoiseLabel(val);
  updateSliderTrack(sliderNoise);
  saveState();

  if (state.liveUpdate) requestPreviewUpdate();
}

function syncSpeed(val) {
  if (!_isDragging) pushHistory();
  state.activePreset = null;
  state.playbackRate = parseFloat(val);
  sliderSpeed.value = state.playbackRate;
  sliderSpeed.setAttribute('aria-valuenow', state.playbackRate);
  outSpeed.textContent = Math.round(state.playbackRate * 100) + '%';
  updateSliderTrack(sliderSpeed);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
}

function syncHpf(val) {
  if (!_isDragging) pushHistory();
  state.activePreset = null;
  state.hpf = +val;
  sliderHpf.value = val;
  sliderHpf.setAttribute('aria-valuenow', val);
  outHpf.textContent = hz(val > 20 ? val : 20);
  updateSliderTrack(sliderHpf);
  saveState();

  if (state.liveUpdate) requestPreviewUpdate();
}

function syncLpf(val) {
  if (!_isDragging) pushHistory();
  state.activePreset = null;
  state.lpf = +val;
  sliderLpf.value = val;
  sliderLpf.setAttribute('aria-valuenow', val);
  outLpf.textContent = val < 20000 ? hz(val) : t('OFF');
  updateSliderTrack(sliderLpf);
  saveState();

  if (state.liveUpdate) requestPreviewUpdate();
}

function syncBass(val) {
  if (!_isDragging) pushHistory();
  state.activePreset = null;
  state.bass = +val;
  sliderBass.value = val;
  sliderBass.setAttribute('aria-valuenow', val);
  outBass.textContent = `${val > 0 ? '+' : ''}${val > 0 ? val : 0} ${t('dB')}`;
  updateSliderTrack(sliderBass);
  saveState();

  if (state.liveUpdate) requestPreviewUpdate();
}

function applyParamsToUI(p) {
  const options = arguments[1] || {};
  const valid = sanitizeParams(p);
  pauseHistory(true);
  Object.assign(state, valid);
  if (state.simpleMode && Object.prototype.hasOwnProperty.call(valid, 'simpleQuality')) {
    applySimpleQualityToState(state.simpleQuality);
  }

  setSimpleMode(state.simpleMode, { persist: false });
  if (sliderBit) { sliderBit.value = state.bitDepth; outBit.textContent = state.bitDepth; sliderBit.setAttribute('aria-valuenow', state.bitDepth); updateSliderTrack(sliderBit); }
  if (sliderSr) { sliderSr.value = state.sampleRate; outSr.textContent = hz(state.sampleRate); sliderSr.setAttribute('aria-valuenow', state.sampleRate); updateSliderTrack(sliderSr); updateSrButtons(state.sampleRate); }
  if (sliderGrit) { sliderGrit.value = state.grit; sliderGrit.setAttribute('aria-valuenow', state.grit); outGrit.textContent = formatGritLabel(state.grit); updateSliderTrack(sliderGrit); }
  if (sliderNoise) { sliderNoise.value = state.noise; sliderNoise.setAttribute('aria-valuenow', state.noise); outNoise.textContent = formatNoiseLabel(state.noise); updateSliderTrack(sliderNoise); }
  if (sliderSpeed) { sliderSpeed.value = state.playbackRate; sliderSpeed.setAttribute('aria-valuenow', state.playbackRate); outSpeed.textContent = `${Math.round(state.playbackRate * 100)}%`; updateSliderTrack(sliderSpeed); }
  if (sliderHpf) { sliderHpf.value = state.hpf; sliderHpf.setAttribute('aria-valuenow', state.hpf); outHpf.textContent = hz(state.hpf); updateSliderTrack(sliderHpf); }
  if (sliderLpf) { sliderLpf.value = state.lpf; sliderLpf.setAttribute('aria-valuenow', state.lpf); outLpf.textContent = state.lpf >= 20000 ? t('OFF') : hz(state.lpf); updateSliderTrack(sliderLpf); }
  if (sliderBass) { sliderBass.value = state.bass; sliderBass.setAttribute('aria-valuenow', state.bass); outBass.textContent = `${state.bass > 0 ? '+' : ''}${state.bass > 0 ? state.bass : 0} ${t('dB')}`; updateSliderTrack(sliderBass); }

  const switches = [
    [btnMarioToggle, state.crushMode, outMario],
    [btnDitherToggle, state.dither, outDither],
    [btnNormalizeToggle, state.normalize, outNormalize],
    [btnTrimToggle, state.trimSilence, outTrim],
  ];
  switches.forEach(([button, value, output]) => { if (button) { button.setAttribute('aria-checked', String(value)); button.classList.toggle('active', value); } if (output) output.textContent = t(value ? 'ON' : 'OFF'); });
  const ceilingDb = Number(state.normalizeCeiling) < 0 ? Number(state.normalizeCeiling) : 0;
  if (btnNormCeiling) btnNormCeiling.textContent = `${ceilingDb} ${t('dB')}`;
  if (normCeilingLabel) normCeilingLabel.textContent = t('{db} dBFS PEAK', { db: ceilingDb });
  if (btnFmtOgg) { btnFmtOgg.classList.toggle('active', state.exportOgg !== false); btnFmtOgg.setAttribute('aria-pressed', String(state.exportOgg !== false)); }
  if (btnFmtWav) { btnFmtWav.classList.toggle('active', state.exportWav !== false); btnFmtWav.setAttribute('aria-pressed', String(state.exportWav !== false)); }
  if (btnFmtMp3) { btnFmtMp3.classList.toggle('active', state.exportMp3 !== false); btnFmtMp3.setAttribute('aria-pressed', String(state.exportMp3 !== false)); }
  if (btnKeepNames) { btnKeepNames.classList.toggle('active', !!state.keepOriginalName); btnKeepNames.setAttribute('aria-pressed', String(!!state.keepOriginalName)); }
  updateScratchButton();
  if (btnStereoToggle) { const forceMono = !state.stereo; btnStereoToggle.setAttribute('aria-checked', String(forceMono)); btnStereoToggle.classList.toggle('active', forceMono); }
  if (outStereo) outStereo.textContent = t(state.stereo ? 'STEREO' : 'MONO');
  if (btnLiveUpdate) btnLiveUpdate.classList.toggle('active', state.liveUpdate);
  const liveStatus = $('live-status'); if (liveStatus) liveStatus.textContent = t(state.liveUpdate ? 'ON' : 'OFF');
  if (btnPreviewLoop) { btnPreviewLoop.classList.toggle('active', state.previewLoop !== false); btnPreviewLoop.setAttribute('aria-pressed', String(state.previewLoop !== false)); }
  const loopStatus = $('loop-status'); if (loopStatus) loopStatus.textContent = t(state.previewLoop !== false ? 'ON' : 'OFF');
  setPreviewLoop(state.previewLoop !== false);
  if (sliderPreviewVolume) { sliderPreviewVolume.value = state.previewVolume; updateSliderTrack(sliderPreviewVolume); }
  if (outPreviewVolume) outPreviewVolume.textContent = `${Math.round(state.previewVolume * 100)}%`;
  setPreviewVolume(state.previewVolume);
  if (btnDualView) { btnDualView.classList.toggle('active', state.dualView); btnDualView.textContent = t('DUAL VIEW: {state}', { state: t(state.dualView ? 'ON' : 'OFF') }); }
  if (state.simpleMode) syncSimpleQuality(state.simpleQuality, { persist: false, requestPreview: false });
  pauseHistory(false);
  updatePresetUI();

  if (options.persist !== false) saveState();
  if (options.requestPreview !== false && state.liveUpdate) requestPreviewUpdate();
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
      !!state.dither === !!preset.dither &&
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
    dither: true,
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
    dither: false,
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
    dither: false,
    stereo: true,
    normalize: true
  };

  let userPreset = null;
  const saved = safeGet('ogcruncher_preset');
  if (saved) {
    try {
      userPreset = JSON.parse(saved);
    } catch (_) {}
  }

  // Fallback for initial load or URL load when activePreset isn't explicitly set yet
  if (state.activePreset === undefined || state.activePreset === null) {
    if (isMatch(presetAuthor)) state.activePreset = 'author';
    else if (isMatch(presetNes)) state.activePreset = 'nes';
    else if (isMatch(presetAmiga)) state.activePreset = 'amiga';
    else if (userPreset && isMatch(userPreset)) state.activePreset = 'user';
  }

  const matchAuthor = state.activePreset === 'author' && isMatch(presetAuthor);
  const matchNes = state.activePreset === 'nes' && isMatch(presetNes);
  const matchAmiga = state.activePreset === 'amiga' && isMatch(presetAmiga);
  const matchUser = state.activePreset === 'user' && userPreset && isMatch(userPreset);

  btnPresetAuthor.classList.toggle('active', matchAuthor);
  if (btnPresetNes) btnPresetNes.classList.toggle('active', matchNes);
  if (btnPresetAmiga) btnPresetAmiga.classList.toggle('active', matchAmiga);
  btnPresetUser.classList.toggle('active', matchUser);
  const effective = $('effective-settings');
  if (effective) effective.textContent = t('{mode} · {rate} Hz · {bits}-bit effect · {channels} output · filters {filters}', {
    mode: t(state.simpleMode ? 'Simple' : 'Advanced'),
    rate: state.sampleRate.toLocaleString(),
    bits: state.bitDepth,
    channels: t(state.stereo ? 'stereo' : 'mono'),
    filters: t(state.hpf > 20 || state.lpf < 20000 || state.bass > 0 ? 'on' : 'off'),
  });
  const codecInfo = $('codec-info');
  if (codecInfo) {
    const parts = [];
    const wavBits = Math.round(state.bitDepth) <= 8 ? 8 : 16;
    const mp3Kbps = state.sampleRate <= 12000 ? 64 : 128;
    if (state.exportOgg !== false) parts.push(`OGG q0 (~64 ${t('kbps')})`);
    if (state.exportWav !== false) parts.push(`WAV ${wavBits}-${t('bit')} PCM`);
    if (state.exportMp3 !== false) parts.push(`MP3 ${mp3Kbps} ${t('kbps')}`);
    codecInfo.textContent = t('Codecs: {list}', { list: `${parts.join(' · ')}${state.keepOriginalName ? ` · ${t('Original names')}` : ''}` });
  }
  updateSavingsEstimate();
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

  const savedLeft = safeGet('og_col_left');
  const savedCenter = safeGet('og_col_center');
  const validPx = value => /^\d+(?:\.\d+)?px$/.test(String(value));
  if (validPx(savedLeft)) main.style.setProperty('--col-left', savedLeft);
  if (validPx(savedCenter)) main.style.setProperty('--col-center', savedCenter);
  main.style.setProperty('--col-right', '1fr');

  let activeResizer = null;

  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    activeResizer = e.currentTarget.dataset.resizer;
    document.body.style.cursor = 'col-resize';
    document.body.classList.add('is-dragging');
    e.currentTarget.classList.add('dragging');
    main.style.transition = 'none';
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  const onKeyDown = (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const direction = e.key === 'ArrowRight' ? 1 : -1;
    const rect = main.getBoundingClientRect();
    const cols = getComputedStyle(main).gridTemplateColumns.split(' ');
    const isLeft = e.currentTarget.dataset.resizer === 'left';
    const leftPx = parseFloat(cols[0]) || rect.width * .25;
    const centerPx = parseFloat(cols[2]) || rect.width * .33;
    const current = isLeft ? leftPx : centerPx;
    const min = isLeft ? 240 : 320;
    const max = isLeft
      ? Math.max(min, rect.width - 600)
      : Math.max(min, rect.width - leftPx - 16 - 256);
    const next = Math.max(min, Math.min(max, current + direction * 24));
    const variable = isLeft ? '--col-left' : '--col-center';
    main.style.setProperty(variable, `${next}px`);
    main.style.setProperty('--col-right', '1fr');
    safeSet(isLeft ? 'og_col_left' : 'og_col_center', `${next}px`);
  };

  const onPointerMove = (e) => {
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
      const centerStart = leftPx + 16;
      const newCenter = Math.max(320, Math.min(x - centerStart, totalWidth - centerStart - 256));
      main.style.setProperty('--col-center', `${newCenter}px`);
      main.style.setProperty('--col-right', `1fr`);
    }
  };

  const onPointerUp = () => {
    if (activeResizer) {
      resizerLeft.classList.remove('dragging');
      resizerRight.classList.remove('dragging');
      main.style.transition = '';
      const style = getComputedStyle(main);
      const cols = style.gridTemplateColumns.split(' ');
      safeSet('og_col_left', cols[0]);
      safeSet('og_col_center', cols[2]);
      safeSet('og_col_right', '1fr');
    }
    activeResizer = null;
    document.body.style.cursor = '';
    document.body.classList.remove('is-dragging');
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
  };

  resizerLeft.addEventListener('pointerdown', onPointerDown);
  resizerRight.addEventListener('pointerdown', onPointerDown);
  resizerLeft.addEventListener('keydown', onKeyDown);
  resizerRight.addEventListener('keydown', onKeyDown);
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
dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target === dropZone) { e.preventDefault(); if (!state.processing) fileInput.click(); } });
fileInput.addEventListener('change', () => { if (state.processing) return; addFiles(Array.from(fileInput.files)); fileInput.value = ''; });

const wrapSlider = (slider, syncFn) => {
  const endDrag = () => {
    _isDragging = false;
  };
  slider.addEventListener('pointerdown', () => {
    _isDragging = true;
    pushHistory();
    window.addEventListener('pointerup', endDrag, { once: true });
    window.addEventListener('pointercancel', endDrag, { once: true });
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

wrapSlider(sliderSimpleQuality, syncSimpleQuality);

document.querySelector('.sr-snap-row')?.addEventListener('click', (e) => {
  const btn = e.target instanceof Element ? e.target.closest('.btn-sr-snap[data-value]') : null;
  if (!btn || state.processing) return;
  syncSampleRate(btn.dataset.value);
});

document.querySelectorAll('.pip-snap[data-val]').forEach((pip) => {
  pip.addEventListener('click', () => {
    if (state.processing) return;
    pushHistory();
    syncSimpleQuality(pip.dataset.val);
  });
});

function advancedSnapshot() {
  const snapshot = getStateSnapshot();
  delete snapshot.simpleMode;
  delete snapshot.simpleQuality;
  return snapshot;
}

btnModeSimple.addEventListener('click', () => {
  if (state.simpleMode || state.processing) return;
  pushHistory();
  safeSet('ogcruncher_advanced_snapshot', JSON.stringify(advancedSnapshot()));
  applyParamsToUI({
    ...DEFAULTS,
    simpleMode: true,
    simpleQuality: state.simpleQuality,
    activePreset: null,
  });
  log('Switched to SIMPLE mode; hidden Advanced settings are neutralized.', 'sys');
});

btnModeAdvanced.addEventListener('click', () => {
  if (!state.simpleMode || state.processing) return;
  pushHistory();
  let snapshot = {};
  try { snapshot = sanitizeParams(JSON.parse(safeGet('ogcruncher_advanced_snapshot') || '{}')); } catch (_) {}
  applyParamsToUI({ ...snapshot, simpleMode: false, activePreset: snapshot.activePreset ?? null });
  log('Switched to ADVANCED mode.', 'sys');
});

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
  state.activePreset = null;
  state.crushMode = !state.crushMode;
  btnMarioToggle.setAttribute('aria-checked', state.crushMode);
  btnMarioToggle.classList.toggle('active', state.crushMode);
  saveState();

  if (state.liveUpdate) requestPreviewUpdate();
  outMario.textContent = t(state.crushMode ? 'ON' : 'OFF');
  log(`Crush mode: ${state.crushMode ? 'ENABLED' : 'DISABLED'}`, 'sys');
});

if (btnDitherToggle) {
  btnDitherToggle.addEventListener('click', () => {
    pushHistory();
    state.activePreset = null;
    state.dither = !state.dither;
    btnDitherToggle.setAttribute('aria-checked', state.dither);
    btnDitherToggle.classList.toggle('active', state.dither);
    saveState();

    if (state.liveUpdate) requestPreviewUpdate();
    if (outDither) outDither.textContent = t(state.dither ? 'ON' : 'OFF');
    log(`Dither: ${state.dither ? 'ENABLED' : 'DISABLED'}`, 'sys');
  });
}

btnStereoToggle.addEventListener('click', () => {
  pushHistory();
  state.activePreset = null;
  state.stereo = !state.stereo;
  const isForceMono = !state.stereo;
  btnStereoToggle.setAttribute('aria-checked', isForceMono);
  btnStereoToggle.classList.toggle('active', isForceMono);
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
  outStereo.textContent = t(state.stereo ? 'STEREO' : 'MONO');
  log(`Output mode: ${state.stereo ? 'STEREO' : 'MONO'}`, 'sys');
  updateSavingsEstimate();
});

btnNormalizeToggle.addEventListener('click', () => {
  pushHistory();
  state.activePreset = null;
  state.normalize = !state.normalize;
  btnNormalizeToggle.setAttribute('aria-checked', state.normalize);
  btnNormalizeToggle.classList.toggle('active', state.normalize);
  saveState();

  if (state.liveUpdate) requestPreviewUpdate();
  outNormalize.textContent = t(state.normalize ? 'ON' : 'OFF');
  log(`Normalization: ${state.normalize ? 'ENABLED' : 'DISABLED'}`, 'sys');
});

btnNormCeiling?.addEventListener('click', () => {
  pushHistory();
  state.normalizeCeiling = Number(state.normalizeCeiling) < 0 ? 0 : -1;
  btnNormCeiling.textContent = `${state.normalizeCeiling} ${t('dB')}`;
  if (normCeilingLabel) normCeilingLabel.textContent = t('{db} dBFS PEAK', { db: state.normalizeCeiling });
  saveState();
  if (state.liveUpdate && state.normalize) requestPreviewUpdate();
  log(`Normalization ceiling: ${state.normalizeCeiling} dBFS`, 'sys');
});

btnTrimToggle?.addEventListener('click', () => {
  pushHistory();
  state.trimSilence = !state.trimSilence;
  btnTrimToggle.setAttribute('aria-checked', String(state.trimSilence));
  btnTrimToggle.classList.toggle('active', state.trimSilence);
  if (outTrim) outTrim.textContent = t(state.trimSilence ? 'ON' : 'OFF');
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
  log(`Auto-trim silence: ${state.trimSilence ? 'ENABLED (-48 dB + 4ms fade)' : 'DISABLED'}`, 'sys');
});

function bindFormatToggle(button, key, label) {
  button?.addEventListener('click', () => {
    const next = !(state[key] !== false);
    const remaining = ['exportOgg', 'exportWav', 'exportMp3'].filter(k => (k === key ? next : state[k] !== false));
    if (!remaining.length) {
      showToast(t('Keep at least one export format enabled.'), 'info');
      return;
    }
    pushHistory();
    state[key] = next;
    button.classList.toggle('active', next);
    button.setAttribute('aria-pressed', String(next));
    saveState();
    updateSavingsEstimate();
    updateScratchButton();
    log(`Export ${label}: ${next ? 'ON' : 'OFF'}`, 'sys');
  });
}
bindFormatToggle(btnFmtOgg, 'exportOgg', 'OGG');
bindFormatToggle(btnFmtWav, 'exportWav', 'WAV');
bindFormatToggle(btnFmtMp3, 'exportMp3', 'MP3');

/** Scratch 3.0 imports WAV and MP3 only; WAV-only is the clearest single file for kids. */
function isScratchExport() {
  return state.exportWav !== false && state.exportOgg === false && state.exportMp3 === false;
}

function updateScratchButton() {
  if (!btnScratchMode) return;
  const active = isScratchExport();
  btnScratchMode.classList.toggle('active', active);
  btnScratchMode.setAttribute('aria-pressed', String(active));
}

btnScratchMode?.addEventListener('click', () => {
  if (isScratchExport()) return;
  pushHistory();
  state.exportOgg = false;
  state.exportWav = true;
  state.exportMp3 = false;
  [[btnFmtOgg, false], [btnFmtWav, true], [btnFmtMp3, false]].forEach(([button, on]) => {
    if (!button) return;
    button.classList.toggle('active', on);
    button.setAttribute('aria-pressed', String(on));
  });
  saveState();
  updateSavingsEstimate();
  updateScratchButton();
  showToast(t('🧩 Scratch: WAV only. Keep each sound under 10 MB.'), 'info');
  log('Export preset: Scratch 3.0 (WAV only, 10 MB per sound)', 'sys');
});

btnKeepNames?.addEventListener('click', () => {
  pushHistory();
  state.keepOriginalName = !state.keepOriginalName;
  btnKeepNames.classList.toggle('active', state.keepOriginalName);
  btnKeepNames.setAttribute('aria-pressed', String(state.keepOriginalName));
  saveState();
  log(`Keep original filenames: ${state.keepOriginalName ? 'ON' : 'OFF'}`, 'sys');
});

btnDualView.addEventListener('click', () => {
  pushHistory();
  state.dualView = !state.dualView;
  btnDualView.classList.toggle('active', state.dualView);
  btnDualView.textContent = t('DUAL VIEW: {state}', { state: t(state.dualView ? 'ON' : 'OFF') });
  saveState();
  log(`Dual View mode: ${state.dualView ? 'ENABLED' : 'DISABLED'}`, 'sys');
});

btnCopyLink.addEventListener('click', async () => {
  try {
    const shareUrl = SITE_URL + window.location.hash;
    await navigator.clipboard.writeText(shareUrl);
    showToast(t('🔗 Link copied to clipboard'), 'ok');
  } catch (err) {
    showToast(t('⚠ Copy manually from address bar'), 'error');
  }
});

btnPresetAuthor.addEventListener('click', () => {
  pushHistory();
  state.activePreset = 'author';
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
    dither: true,
    stereo: false,
    normalize: true
  });
  log('preset: LO-Q (author default)', 'accent');
  showToast(t('◉ author preset loaded'), 'info');
});

if (btnPresetNes) {
  btnPresetNes.addEventListener('click', () => {
    pushHistory();
    state.activePreset = 'nes';
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
      dither: false,
      stereo: false,
      normalize: true
    });
    log('preset: NES 8-BIT (retro gaming classic)', 'accent');
    showToast(t('🎮 NES 8-bit preset loaded'), 'info');
  });
}

if (btnPresetAmiga) {
  btnPresetAmiga.addEventListener('click', () => {
    pushHistory();
    state.activePreset = 'amiga';
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
      dither: false,
      stereo: true,
      normalize: true
    });
    log('preset: AMIGA 500 (vintage sampler)', 'accent');
    showToast(t('💾 Amiga 500 preset loaded'), 'info');
  });
}

btnPresetUser.addEventListener('click', () => {
  const saved = safeGet('ogcruncher_preset');
  if (!saved) return;
  try {
    const p = JSON.parse(saved);
    pushHistory();
    state.activePreset = 'user';
    applyParamsToUI(p);
    log('preset: MY PRESET (user custom)', 'accent');
    showToast(t('👤 custom preset loaded'), 'info');
  } catch (_) {
    showToast(t('❌ Failed to load custom preset'), 'error');
  }
});

btnSaveCustom.addEventListener('click', () => {
  const preset = {
    bitDepth: state.bitDepth,
    sampleRate: state.sampleRate,
    crushMode: state.crushMode,
    dither: state.dither,
    grit: state.grit,
    noise: state.noise,
    stereo: state.stereo,
    hpf: state.hpf,
    lpf: state.lpf,
    bass: state.bass,
    normalize: state.normalize,
    normalizeCeiling: state.normalizeCeiling,
    trimSilence: state.trimSilence,
    playbackRate: state.playbackRate,
    ts: Date.now()
  };
  safeSet('ogcruncher_preset', JSON.stringify(preset));
  state.activePreset = 'user';
  btnPresetUser.disabled = false;
  userPresetMeta.textContent = `${preset.bitDepth} ${t('bit')} / ${hz(preset.sampleRate)}`;
  updatePresetUI();
  saveState();
  log('custom preset saved to localstorage', 'ok');
  showToast(t('💾 custom preset saved'), 'ok');
});

function setControlsEnabled(enabled) {
  const inputs = [
    sliderBit, sliderSr, sliderGrit, sliderNoise, sliderSpeed,
    sliderHpf, sliderLpf, sliderBass, sliderSimpleQuality,
    btnMarioToggle, btnDitherToggle, btnStereoToggle, btnNormalizeToggle, btnNormCeiling, btnTrimToggle,
    btnFmtOgg, btnFmtWav, btnFmtMp3, btnScratchMode, btnKeepNames, btnPreviewLoop,
    btnModeSimple, btnModeAdvanced,
    btnLiveUpdate, btnDualView, btnPresetAuthor, btnPresetNes, btnPresetAmiga, btnPresetUser,
    btnSaveCustom, btnClearQueue, btnLoadDemo, fileInput, sliderPreviewVolume
  ];
  inputs.forEach(el => {
    if (el) el.disabled = !enabled;
  });

  // Keep an already playing preview stoppable, but never allow processing to
  // start a second preview or change its A/B branch while the batch is active.
  if (btnPreview) btnPreview.disabled = !enabled && !btnPreview.classList.contains('playing');
  if (btnAB) btnAB.disabled = !enabled;

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
btnCancel?.addEventListener('click', cancelProcessing);

btnLiveUpdate.addEventListener('click', () => {
  pushHistory();
  state.liveUpdate = !state.liveUpdate;
  btnLiveUpdate.classList.toggle('active', state.liveUpdate);
  const statusEl = $('live-status');
  if (statusEl) statusEl.textContent = t(state.liveUpdate ? 'ON' : 'OFF');
  log(`live update: ${state.liveUpdate ? 'ON' : 'OFF'}`, 'sys');
  saveState();
  if (state.liveUpdate) requestPreviewUpdate();
  else invalidatePreviewUpdates();
});

btnPreviewLoop?.addEventListener('click', () => {
  // Listening preference only: not an undo step and not part of share links.
  const next = !(state.previewLoop !== false);
  setPreviewLoop(next);
  btnPreviewLoop.classList.toggle('active', next);
  btnPreviewLoop.setAttribute('aria-pressed', String(next));
  const statusEl = $('loop-status');
  if (statusEl) statusEl.textContent = t(next ? 'ON' : 'OFF');
  log(`preview loop: ${next ? 'ON' : 'OFF'}`, 'sys');
  saveState();
});

btnLoadDemo.addEventListener('click', (e) => {
  e.stopPropagation();
  loadDemoTrack();
});

btnInfo.addEventListener('click', openInfoModal);

btnInfoOk.addEventListener('click', () => {
  closeInfoModal();
});

modalInfo.addEventListener('click', (e) => {
  if (e.target === modalInfo) closeInfoModal();
});

modalInfo.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeInfoModal();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    btnInfoOk.focus();
  }
});

// Which control the mouse/touch last focused. Chrome turns :focus-visible on as
// soon as a key is pressed, so it cannot tell a clicked button from a tabbed one.
const FOCUSABLE_CONTROL = 'button, a, input, [role="button"], summary';
let pointerFocusedControl = null;
document.addEventListener('pointerdown', (e) => {
  pointerFocusedControl = e.target instanceof Element ? e.target.closest(FOCUSABLE_CONTROL) : null;
}, true);
document.addEventListener('keydown', (e) => { if (e.key === 'Tab') pointerFocusedControl = null; }, true);

window.addEventListener('keydown', (e) => {
  if (e.defaultPrevented) return;
  if (!modalInfo.hidden) return;
  const target = e.target instanceof Element ? e.target : null;
  const inTextInput = !!target?.closest('input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, select, [contenteditable="true"]');

  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
    if (inTextInput || state.processing) return;
    e.preventDefault();
    const ok = undo(applyParamsToUI);
    if (ok) showToast(t('↩ undo'), 'sys');
    return;
  }
  if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyY' || (e.code === 'KeyZ' && e.shiftKey))) {
    if (inTextInput || state.processing) return;
    e.preventDefault();
    const ok = redo(applyParamsToUI);
    if (ok) showToast(t('↪ redo'), 'sys');
    return;
  }

  if (state.processing) {
    if (e.code === 'Escape') { e.preventDefault(); cancelProcessing(); }
    return;
  }

  const HOTKEYS = ['Space', 'Enter', 'KeyC', 'KeyN', 'KeyL'];
  if (!HOTKEYS.includes(e.code) || e.ctrlKey || e.metaKey || e.altKey) return;
  if (inTextInput) return;
  // A control that was clicked keeps focus, so Space would re-press it (or scroll
  // the page from a slider). Only a keyboard-focused button or link keeps its
  // native Space/Enter behaviour; anything focused by the mouse hands the key to
  // the global shortcuts.
  const control = target?.closest(FOCUSABLE_CONTROL);
  if (control) {
    const isRange = control.matches('input[type="range"]');
    const keyboardFocused = control !== pointerFocusedControl;
    if (!isRange && keyboardFocused && (e.code === 'Space' || e.code === 'Enter')) return;
    if (control.matches('input[type="checkbox"], input[type="radio"]') && keyboardFocused) return;
    control.blur();
  }

  if (e.code === 'Space') {
    e.preventDefault();
    if (!btnPreview.disabled) btnPreview.click();
  } else if (e.code === 'Enter') {
    e.preventDefault();
    if (!btnProcess.disabled) btnProcess.click();
  } else if (e.code === 'KeyC') {
    if (!abContainer.classList.contains('is-idle')) { e.preventDefault(); btnAB.click(); }
  } else if (e.code === 'KeyN') {
    e.preventDefault();
    btnLiveUpdate.click();
  } else if (e.code === 'KeyL') {
    if (!abContainer.classList.contains('is-idle')) { e.preventDefault(); btnPreviewLoop?.click(); }
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
    btnPreview, resultsArea, resultsBatchBar: $('results-batch-bar'), resultsBatchSummary: $('results-batch-summary'), btnDownloadZip: $('btn-download-zip'), btnClearResults: $('btn-clear-results'), progressWrap, btnLoadDemo, btnLoadDemoLabel: $('btn-load-demo-label'), btnCancel, batchSummary,
    panelCenter: $('panel-center')
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
    previewFileName:   document.getElementById('preview-file-name'),
  });

  // Hydrate once. Precedence is validated defaults < saved state < explicit URL.
  pauseHistory(true);
  pausePersistence(true);
  const savedState = readSavedState();
  const hashState = parseHash();
  const advancedUrlKeys = ['bitDepth', 'sampleRate', 'grit', 'noise', 'playbackRate', 'hpf', 'lpf', 'bass', 'crushMode', 'dither', 'stereo', 'normalize', 'normalizeCeiling', 'trimSilence'];
  const initial = { ...DEFAULTS, ...savedState, ...hashState };
  if (!Object.prototype.hasOwnProperty.call(hashState, 'simpleMode') && advancedUrlKeys.some(key => Object.prototype.hasOwnProperty.call(hashState, key))) initial.simpleMode = false;
  applyParamsToUI(initial, { persist: false, requestPreview: false });
  pausePersistence(false);
  pauseHistory(false);
  saveState();

  // ── Collapsible Filters ──
  const groupFilters = $('group-filters');
  const btnToggleFilters = $('btn-toggle-filters');
  if (groupFilters && btnToggleFilters) {
    const isExpanded = safeGet('ogcruncher_filters_expanded') === 'true';
    if (isExpanded) {
      groupFilters.classList.add('expanded');
      btnToggleFilters.setAttribute('aria-expanded', 'true');
    } else {
      groupFilters.classList.add('collapsed');
      btnToggleFilters.setAttribute('aria-expanded', 'false');
    }

    btnToggleFilters.addEventListener('click', () => {
      const expanding = !groupFilters.classList.contains('expanded');
      if (expanding) {
        groupFilters.classList.remove('collapsed');
        groupFilters.classList.add('expanded');
        btnToggleFilters.setAttribute('aria-expanded', 'true');
        safeSet('ogcruncher_filters_expanded', 'true');
      } else {
        groupFilters.classList.remove('expanded');
        groupFilters.classList.add('collapsed');
        btnToggleFilters.setAttribute('aria-expanded', 'false');
        safeSet('ogcruncher_filters_expanded', 'false');
      }
    });
  }

  const saved = safeGet('ogcruncher_preset');
  if (saved) {
    try {
      const p = sanitizeParams(JSON.parse(saved));
      btnPresetUser.disabled = false;
      userPresetMeta.textContent = `${p.bitDepth} ${t('bit')} / ${hz(p.sampleRate)}`;
    } catch (_) {}
  }

  window.addEventListener('hashchange', () => {
    if (state.processing) { log('Settings link ignored while batch is processing.', 'warn'); return; }
    const values = parseHash();
    if (!Object.keys(values).length) return;
    const advancedKeys = ['bitDepth', 'sampleRate', 'grit', 'noise', 'playbackRate', 'hpf', 'lpf', 'bass', 'crushMode', 'dither', 'stereo', 'normalize', 'normalizeCeiling', 'trimSilence'];
    if (!Object.prototype.hasOwnProperty.call(values, 'simpleMode') && advancedKeys.some(key => Object.prototype.hasOwnProperty.call(values, key))) values.simpleMode = false;
    applyParamsToUI(values);
  });
  initResizers();
  
  // Info modal remains user-triggered via ABOUT button
  if (!safeGet('og_seen_info')) safeSet('og_seen_info', 'true');

  // ── PWA Install Prompt ────────────────────────────────────────────────
  const btnInstall = $('btn-install');
  const hideInstall = () => { if (btnInstall) btnInstall.hidden = true; };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _installPrompt = e;
    if (!btnInstall) return;
    btnInstall.textContent = t('⬇ INSTALL APP');
    btnInstall.title = t('Install OGCruncher as a standalone app');
    btnInstall.hidden = false;
    log('Install prompt available — click "INSTALL APP" in the header.', 'sys');
  });

  btnInstall?.addEventListener('click', async () => {
    if (!_installPrompt) { hideInstall(); return; }
    _installPrompt.prompt();
    const { outcome } = await _installPrompt.userChoice;
    _installPrompt = null;
    hideInstall();
    if (outcome === 'accepted') {
      log('OGCruncher installed as standalone app.', 'ok');
      showToast(t('✅ App installed!'), 'ok');
    } else {
      log('Install dismissed.', 'sys');
    }
  });

  window.addEventListener('appinstalled', () => {
    _installPrompt = null;
    hideInstall();
    log('App installed via browser UI.', 'ok');
  });

  updatePresetUI();
  pauseHistory(false);
  pushHistory(); 
  log(t('ready. drop files or click browse.'), 'ok');
  setBadge(t('IDLE'), 'badge--amber');
})();
