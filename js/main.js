/**
 * OGCruncher — Entry Point
 * by figarist · https://figarist.github.io
 */

'use strict';

import './ui.js';
import { log, showToast } from './utils.js';

// Register Service Worker and manage updates
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Vite PWA sw.js is in the root of the output directory
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        log('Service Worker registered successfully.', 'sys');
        
        // Check for updates on load
        if (reg.installing) {
          log('Service Worker installing...', 'sys');
        }
        
        // Listen for new service worker installation
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  log('New update available. Swapping service worker...', 'sys');
                  showToast('🔄 New update installed! Reloading...', 'ok');
                } else {
                  log('Content cached for offline use.', 'ok');
                }
              }
            };
          }
        };
      })
      .catch(err => {
        console.error('Service Worker registration failed:', err);
      });
  });

  // Auto-reload the page when a new service worker takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

