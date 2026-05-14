/**
 * OGCruncher — Utilities
 * by figarist · https://figarist.github.io
 */

'use strict';

let _dom = {};

/**
 * Initialize utils with DOM references needed for logging/toasts.
 */
export function initUtils(domRefs) {
  _dom = domRefs;
}

export function log(msg, type = 'info') {
  if (!_dom.logWindow) return;
  const p = document.createElement('p');
  p.className = `log-line log-line--${type}`;
  const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
  p.textContent = `[${ts}] ${msg}`;
  _dom.logWindow.appendChild(p);
  _dom.logWindow.scrollTop = _dom.logWindow.scrollHeight;
}

let _toastTimer = null;
export function showToast(msg, type = 'info', duration = 3500) {
  if (!_dom.toast) return;
  _dom.toast.textContent = msg;
  _dom.toast.className = `toast toast--${type} show`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { _dom.toast.className = 'toast'; }, duration);
}

export function setBadge(text, cls = 'badge--amber') {
  if (!_dom.badgeStatus) return;
  _dom.badgeStatus.textContent = text;
  _dom.badgeStatus.className = `badge ${cls}`;
}

export function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
}

export function updateSliderTrack(slider) {
  const min = +slider.min, max = +slider.max, val = +slider.value;
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.setProperty('--pct', pct + '%');
}
