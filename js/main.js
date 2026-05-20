/**
 * OGCruncher — Entry Point
 * by figarist · https://figarist.github.io
 */

'use strict';

import './ui.js';

// Auto-reload the page when a new service worker takes control
if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

