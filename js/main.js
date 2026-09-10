/** OGCruncher entry point and deliberately idle-safe PWA registration. */

'use strict';

import './ui.js';
import { log, setBadge } from './utils.js';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
      log('Service Worker registered.', 'sys');
      const markReady = () => {
        const active = registration.active || registration.waiting;
        if (active) log('Offline cache is ready for the current application revision.', 'ok');
      };
      if (registration.active) markReady();
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent('og-update-available', { detail: registration }));
              log('A new version is cached. Reload when the queue and preview are idle.', 'warn');
            } else markReady();
          }
        });
      });
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
      log('Offline cache is unavailable; the audio workflow still runs online.', 'warn');
    }
  });

  // A controller change is observed only for status. It never reloads the page:
  // queue files and output blobs are intentionally in-memory and must not vanish.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    log('Service Worker controller changed. Reload is left to the user.', 'sys');
  });
} else if (import.meta.env.PROD) {
  setBadge('WEB ONLY', 'badge--amber');
}
