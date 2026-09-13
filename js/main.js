/** OGCruncher entry point and deliberately idle-safe PWA registration. */

'use strict';

import './ui.js';
import { log, setBadge } from './utils.js';
import { state } from './state.js';
import { createServiceWorkerUpdateController } from './sw-update.js';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const updateController = createServiceWorkerUpdateController({
    window,
    navigator,
    document,
    getState: () => state,
    log,
  });
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
      log('Service Worker registered.', 'sys');
      const markReady = () => {
        const active = registration.active || registration.waiting;
        if (active) log('Offline cache is ready for the current application revision.', 'ok');
      };
      if (registration.active) markReady();
      if (registration.waiting && navigator.serviceWorker.controller) {
        updateController.announceAvailable(registration);
      }
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              updateController.announceAvailable(registration);
            } else markReady();
          }
        });
      });
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
      log('Offline cache is unavailable; the audio workflow still runs online.', 'warn');
    }
  });

} else if (import.meta.env.PROD) {
  setBadge('WEB ONLY', 'badge--amber');
}
