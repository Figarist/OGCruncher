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
