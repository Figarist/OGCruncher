/**
 * OGCruncher — validated state, persistence and undo/redo.
 */

'use strict';

export const DEFAULTS = Object.freeze({
  bitDepth: 8,
  sampleRate: 22050,
  crushMode: true,
  dither: true,
  grit: 1.0,
  noise: 0.0,
  stereo: false,
  playbackRate: 1.0,
  hpf: 20,
  lpf: 20000,
  bass: 0,
  liveUpdate: true,
  normalize: true,
  dualView: false,
  previewVolume: 0.8,
  activePreset: 'author',
  simpleMode: true,
  simpleQuality: 3,
});

const NUMBER_RULES = {
  bitDepth: [1, 16, true],
  sampleRate: [4000, 48000, true],
  grit: [1, 10, false],
  noise: [0, 0.05, false],
  playbackRate: [0.5, 2, false],
  hpf: [20, 1000, true],
  lpf: [500, 20000, true],
  bass: [0, 15, false],
  previewVolume: [0, 1, false],
  simpleQuality: [0, 3, true],
};

const BOOLEAN_KEYS = new Set([
  'crushMode', 'dither', 'stereo', 'liveUpdate', 'normalize', 'dualView', 'simpleMode'
]);
const ENUM_KEYS = new Set(['activePreset']);
const PRESETS = new Set(['author', 'nes', 'amiga', 'user']);

export const state = {
  files: new Map(),
  nextId: 0,
  processing: false,
  ...DEFAULTS,
};

let onStateChange = null;
let persistencePaused = false;
let historyPaused = false;

export function setOnStateChange(fn) {
  onStateChange = typeof fn === 'function' ? fn : null;
}

export function pausePersistence(paused) {
  persistencePaused = !!paused;
}

function storage() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch (_) {
    return null;
  }
}

function readBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (value === '1' || value === 1) return true;
  if (value === '0' || value === 0) return false;
  return undefined;
}

/** Return only fields that pass their type, finiteness and range contract. */
export function sanitizeParams(input, { includeUnknown = false } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const output = {};

  Object.entries(NUMBER_RULES).forEach(([key, [min, max, integer]]) => {
    if (!Object.prototype.hasOwnProperty.call(input, key)) return;
    const value = typeof input[key] === 'number' ? input[key] : Number(input[key]);
    if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) return;
    output[key] = value;
  });

  BOOLEAN_KEYS.forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(input, key)) return;
    const value = readBoolean(input[key]);
    if (value !== undefined) output[key] = value;
  });

  ENUM_KEYS.forEach(key => {
    if (!Object.prototype.hasOwnProperty.call(input, key)) return;
    const value = input[key];
    if (value === null || value === undefined) output[key] = null;
    else if (typeof value === 'string' && PRESETS.has(value)) output[key] = value;
  });

  if (includeUnknown && typeof input.ts === 'number' && Number.isFinite(input.ts)) output.ts = input.ts;
  return output;
}

export function readSavedState() {
  const store = storage();
  if (!store) return {};
  try {
    const raw = store.getItem('ogcruncher_last_state');
    return raw ? sanitizeParams(JSON.parse(raw)) : {};
  } catch (error) {
    console.warn('Saved OGCruncher state is unavailable; using defaults.', error);
    return {};
  }
}

function persistentSnapshot() {
  const snapshot = {};
  Object.keys(DEFAULTS).forEach(key => { snapshot[key] = state[key]; });
  return snapshot;
}

export function getStateSnapshot() {
  return { ...persistentSnapshot() };
}

export function saveState() {
  if (persistencePaused) return;
  const snapshot = persistentSnapshot();
  const store = storage();
  if (store) {
    try {
      store.setItem('ogcruncher_last_state', JSON.stringify(snapshot));
    } catch (error) {
      // A blocked/full localStorage must not disable processing or preview.
      console.warn('Could not persist OGCruncher state; continuing in memory.', error);
    }
  }
  updateHash();
  if (onStateChange) onStateChange();
}

function setHashParam(params, key, value) {
  if (typeof value === 'boolean') params.set(key, value ? '1' : '0');
  else if (value !== null && value !== undefined) params.set(key, String(value));
}

export function updateHash() {
  if (typeof window === 'undefined' || !window.location || !window.history) return;
  try {
    const params = new URLSearchParams();
    setHashParam(params, 'b', state.bitDepth);
    setHashParam(params, 'r', state.sampleRate);
    setHashParam(params, 'g', state.grit);
    setHashParam(params, 'n', state.noise);
    setHashParam(params, 'c', state.crushMode);
    setHashParam(params, 'di', state.dither);
    setHashParam(params, 's', state.stereo);
    setHashParam(params, 'h', state.hpf);
    setHashParam(params, 'l', state.lpf);
    setHashParam(params, 'bs', state.bass);
    setHashParam(params, 'norm', state.normalize);
    setHashParam(params, 'dv', state.dualView);
    setHashParam(params, 'sp', state.playbackRate);
    setHashParam(params, 'lu', state.liveUpdate);
    setHashParam(params, 'v', state.previewVolume);
    setHashParam(params, 'm', state.simpleMode);
    setHashParam(params, 'q', state.simpleQuality);
    if (state.activePreset) setHashParam(params, 'p', state.activePreset);
    window.history.replaceState(null, '', `${window.location.pathname}#${params.toString()}`);
  } catch (error) {
    console.warn('Could not update the settings link.', error);
  }
}

function parseNumber(params, urlKey, stateKey) {
  return params.has(urlKey) ? { [stateKey]: params.get(urlKey) } : {};
}

function parseFlag(params, urlKey, stateKey) {
  if (!params.has(urlKey)) return {};
  const value = params.get(urlKey);
  return value === '1' ? { [stateKey]: true } : value === '0' ? { [stateKey]: false } : {};
}

/** Parse a share hash without mutating state, storage, history or the DOM. */
export function parseHash(applyParamsCallback) {
  if (typeof window === 'undefined' || !window.location) return {};
  const hash = String(window.location.hash || '').replace(/^#/, '');
  if (!hash) return {};

  try {
    const params = new URLSearchParams(hash);
    const raw = {
      ...parseNumber(params, 'b', 'bitDepth'),
      ...parseNumber(params, 'r', 'sampleRate'),
      ...parseNumber(params, 'g', 'grit'),
      ...parseNumber(params, 'n', 'noise'),
      ...parseNumber(params, 'h', 'hpf'),
      ...parseNumber(params, 'l', 'lpf'),
      ...parseNumber(params, 'bs', 'bass'),
      ...parseNumber(params, 'sp', 'playbackRate'),
      ...parseNumber(params, 'v', 'previewVolume'),
      ...parseNumber(params, 'q', 'simpleQuality'),
      ...parseFlag(params, 'c', 'crushMode'),
      ...parseFlag(params, 'di', 'dither'),
      ...parseFlag(params, 's', 'stereo'),
      ...parseFlag(params, 'norm', 'normalize'),
      ...parseFlag(params, 'dv', 'dualView'),
      ...parseFlag(params, 'lu', 'liveUpdate'),
      ...parseFlag(params, 'm', 'simpleMode'),
    };
    if (params.has('p')) raw.activePreset = params.get('p');
    const parsed = sanitizeParams(raw);
    if (applyParamsCallback && Object.keys(parsed).length) applyParamsCallback(parsed);
    return parsed;
  } catch (error) {
    console.warn('Invalid OGCruncher settings link; using valid values only.', error);
    return {};
  }
}

// ══ HISTORY ════════════════════════════════════════════════════════════════
const MAX_HISTORY = 50;
let history = [];
let historyIndex = -1;

export function pauseHistory(paused) {
  historyPaused = !!paused;
}

export function pushHistory() {
  if (historyPaused) return;
  const snapshot = getStateSnapshot();
  if (historyIndex < history.length - 1) history = history.slice(0, historyIndex + 1);
  if (history.length && JSON.stringify(history[historyIndex]) === JSON.stringify(snapshot)) return;
  history.push(snapshot);
  if (history.length > MAX_HISTORY) {
    history.shift();
    historyIndex = Math.max(0, historyIndex - 1);
  }
  historyIndex = history.length - 1;
}

export function undo(applyParamsCallback) {
  const current = getStateSnapshot();
  if (historyIndex === history.length - 1 && history.length &&
      JSON.stringify(history[historyIndex]) !== JSON.stringify(current)) {
    history.push(current);
    historyIndex++;
  }
  if (historyIndex <= 0) return false;
  historyIndex--;
  restore(history[historyIndex], applyParamsCallback);
  return true;
}

export function redo(applyParamsCallback) {
  if (historyIndex >= history.length - 1) return false;
  historyIndex++;
  restore(history[historyIndex], applyParamsCallback);
  return true;
}

function restore(snapshot, applyParamsCallback) {
  pauseHistory(true);
  pausePersistence(true);
  try {
    if (applyParamsCallback) applyParamsCallback(snapshot, { persist: false, requestPreview: false });
  } finally {
    pausePersistence(false);
    pauseHistory(false);
  }
  saveState();
}
