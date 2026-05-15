/**
 * OGCruncher — State Management
 * by figarist · https://figarist.github.io
 */

'use strict';

export const state = {
  files: new Map(),   // Map<id, File> keyed by monotonically increasing counter
  nextId: 0,          // ID counter for stable queue tracking
  processing: false,
  bitDepth: 8,
  sampleRate: 22050,
  crushMode: true,    // expander + dither + anti-alias pipeline
  grit: 1.0,
  noise: 0.0,
  stereo: false,
  playbackRate: 1.0,  // FIXED: added explicit playbackRate
  hpf: 20,
  lpf: 20000,
  bass: 0,
  liveUpdate: true,   // IMPROVEMENT: enabled by default
  normalize: true,    // IMPROVEMENT 2: peak normalization toggle
  dualView: false,    // NEW: show both spectra simultaneously
};

export function saveState() {
  // FIXED: nextId leak removed from persistence
  const { files, processing, nextId, ...persistentState } = state;
  localStorage.setItem('ogcruncher_last_state', JSON.stringify(persistentState));
  updateHash(); // IMPROVEMENT 5: Update URL hash on every param change
}

export function loadState(applyParamsCallback) {
  const saved = localStorage.getItem('ogcruncher_last_state');
  if (!saved) return;
  try {
    const p = JSON.parse(saved);
    applyParamsCallback(p);
  } catch (e) {
    console.error('Failed to load state', e);
  }
}

export function updateHash() {
  const params = new URLSearchParams();
  params.set('b', state.bitDepth);
  params.set('r', state.sampleRate);
  params.set('g', state.grit);
  params.set('n', state.noise);
  params.set('c', state.crushMode ? 1 : 0);
  params.set('s', state.stereo ? 1 : 0);
  params.set('h', state.hpf);
  params.set('l', state.lpf);
  params.set('bs', state.bass);
  params.set('norm', state.normalize ? 1 : 0);
  params.set('dv', state.dualView ? 1 : 0);
  params.set('sp', state.playbackRate);
  
  // Use replaceState to avoid polluting back button
  history.replaceState(null, '', '#' + params.toString());
}

export function parseHash(applyParamsCallback) {
  const hash = window.location.hash.substring(1);
  if (!hash) return;
  
  try {
    const params = new URLSearchParams(hash);
    const p = {};
    if (params.has('b')) p.bitDepth = Math.max(1, Math.min(16, +params.get('b')));
    if (params.has('r')) p.sampleRate = Math.max(4000, Math.min(48000, +params.get('r')));
    if (params.has('g')) p.grit = Math.max(1.0, Math.min(10.0, +params.get('g')));
    if (params.has('n')) p.noise = Math.max(0, Math.min(0.05, +params.get('n')));
    if (params.has('c')) p.crushMode = params.get('c') === '1';
    if (params.has('s')) p.stereo = params.get('s') === '1';
    if (params.has('h')) p.hpf = Math.max(20, Math.min(1000, +params.get('h')));
    if (params.has('l')) p.lpf = Math.max(500, Math.min(20000, +params.get('l')));
    if (params.has('bs')) p.bass = Math.max(0, Math.min(15, +params.get('bs')));
    if (params.has('norm')) p.normalize = params.get('norm') === '1';
    if (params.has('dv')) p.dualView = params.get('dv') === '1';
    if (params.has('sp')) p.playbackRate = Math.max(0.5, Math.min(2.0, +params.get('sp')));
    
    applyParamsCallback(p);
  } catch (e) {
    console.warn('Failed to parse hash', e);
  }
}

// ══ HISTORY ══════════════════════════════════════════════════════════
const MAX_HISTORY = 50;
let _history = [];   // array of snapshot objects
let _historyIndex = -1;
let _pauseHistory = false; // flag to suppress pushHistory during restore

/**
 * Control whether history pushes are ignored.
 */
export function pauseHistory(paused) {
  _pauseHistory = !!paused;
}

/**
 * Capture the current persistable state as a snapshot.
 */
export function pushHistory() {
  if (_pauseHistory) return;
  const snap = _captureSnapshot();
  
  // If index is not at the end, discard the forward branch
  if (_historyIndex < _history.length - 1) {
    _history = _history.slice(0, _historyIndex + 1);
  }

  // Deduplicate: skip if identical to last entry
  if (_history.length > 0 && JSON.stringify(_history[_historyIndex]) === JSON.stringify(snap)) return;
  
  _history.push(snap);
  if (_history.length > MAX_HISTORY) {
    _history.shift();
    _historyIndex = Math.max(0, _historyIndex - 1);
  }
  _historyIndex = _history.length - 1;
}

/**
 * Revert to previous state.
 */
export function undo(applyParamsCallback) {
  // If we are at the tail, capture the "present" state before moving back
  const currentSnap = _captureSnapshot();
  if (_historyIndex === _history.length - 1) {
    if (JSON.stringify(_history[_historyIndex]) !== JSON.stringify(currentSnap)) {
      _history.push(currentSnap);
      _historyIndex++; // Move index to the newly pushed present state
    }
  }

  if (_historyIndex <= 0) return false;
  
  _historyIndex--;
  _restore(_history[_historyIndex], applyParamsCallback);
  return true;
}

/**
 * Re-apply a previously undone state.
 */
export function redo(applyParamsCallback) {
  if (_historyIndex >= _history.length - 1) return false;
  _historyIndex++;
  _restore(_history[_historyIndex], applyParamsCallback);
  return true;
}

function _captureSnapshot() {
  const { files, processing, nextId, ...snap } = state;
  return { ...snap };
}

function _restore(snap, applyParamsCallback) {
  _pauseHistory = true;
  applyParamsCallback(snap);
  _pauseHistory = false;
  // Sync localStorage and hash without pushing a new history entry
  const { files, processing, nextId, ...persistentState } = state;
  localStorage.setItem('ogcruncher_last_state', JSON.stringify(persistentState));
  updateHash();
}
