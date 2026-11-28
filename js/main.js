/** OGCruncher entry point and deliberately idle-safe PWA registration. */

'use strict';

import './ui.js';
import { log, setBadge } from './utils.js';
import { state } from './state.js';
import { createServiceWorkerUpdateController } from './sw-update.js';
import { t } from './i18n.js';

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
      log(t('Offline cache is unavailable; the audio workflow still runs online.'), 'warn');
    }
  });

} else if (import.meta.env.PROD) {
  setBadge(t('WEB ONLY'), 'badge--amber');
}

const langTrigger = document.getElementById('btn-lang-menu');
const langMenu = document.getElementById('lang-menu');
const closeLangMenu = () => {
  if (!langMenu || !langTrigger) return;
  langMenu.hidden = true;
  langTrigger.setAttribute('aria-expanded', 'false');
};
if (langTrigger && langMenu) {
  langTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = langMenu.hidden;
    langMenu.hidden = !willOpen;
    langTrigger.setAttribute('aria-expanded', String(willOpen));
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang-dropdown')) closeLangMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLangMenu();
  });
}

document.querySelectorAll('.lang-btn[hreflang]').forEach((link) => {
  link.addEventListener('click', () => {
    const lang = link.getAttribute('hreflang');
    if (lang === 'en' || lang === 'uk' || lang === 'pl' || lang === 'ru' || lang === 'ko') {
      try { localStorage.setItem('ogcruncher_lang', lang); } catch (_) {}
    }
    closeLangMenu();
  });
});
