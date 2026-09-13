/**
 * Owns the service-worker update notice and its explicit activation boundary.
 * Queue Files, preview buffers and result Blob URLs are intentionally in-memory.
 */

'use strict';

export function createServiceWorkerUpdateController({
  window,
  navigator,
  document,
  getState,
  log,
}) {
  const notice = document.getElementById('sw-update-notice');
  const message = document.getElementById('sw-update-message');
  const activateButton = document.getElementById('btn-sw-update');
  const previewButton = document.getElementById('btn-preview');
  const resultsArea = document.getElementById('results-area');
  let waitingWorker = null;
  let activationRequested = false;
  let reloadStarted = false;

  function getAudioState() {
    const state = typeof getState === 'function' ? getState() : getState;
    const queueCount = Number(state?.files?.size || 0);
    const processing = Boolean(state?.processing);
    const previewActive = Boolean(previewButton?.classList?.contains('playing'));
    const resultCount = Number(resultsArea?.children?.length || 0);
    return {
      queueCount,
      processing,
      previewActive,
      resultCount,
      safeToReload: !queueCount && !processing && !previewActive && !resultCount,
    };
  }

  function refresh() {
    if (!notice || !waitingWorker || activationRequested) return getAudioState();
    const audio = getAudioState();
    notice.hidden = false;
    if (audio.safeToReload) {
      message.textContent = 'A new version is ready. Reload is safe now; no queued files or generated results were detected.';
      activateButton.disabled = false;
      activateButton.title = 'Activate the waiting update and reload the page.';
    } else {
      message.textContent = 'Update waiting. Finish or download your work, then clear the queue before activating; reload clears in-memory audio state.';
      activateButton.disabled = true;
      activateButton.title = 'Reload is disabled while queued files, preview, processing, or results are present.';
    }
    return audio;
  }

  function announceAvailable(registration) {
    const candidate = registration?.waiting;
    if (!candidate) return;
    if (candidate !== waitingWorker) {
      waitingWorker = candidate;
      activationRequested = false;
      reloadStarted = false;
      log('A new version is waiting. It will not activate or reload automatically.', 'warn');
    }
    refresh();
  }

  function activateWhenSafe() {
    if (!waitingWorker || activationRequested) return;
    const audio = refresh();
    if (!audio.safeToReload) {
      log('Update remains waiting because in-memory audio work is still present.', 'warn');
      return;
    }
    activationRequested = true;
    activateButton.disabled = true;
    activateButton.textContent = 'UPDATING…';
    message.textContent = 'Update activation requested. The page will reload after the new worker takes control.';
    log('Update activation accepted after confirming the queue, preview and results are clear.', 'sys');
    try {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } catch (error) {
      activationRequested = false;
      activateButton.textContent = 'ACTIVATE & RELOAD';
      log(`Update activation failed: ${error.message || String(error)}`, 'error');
      refresh();
    }
  }

  function handleControllerChange() {
    if (activationRequested && !reloadStarted) {
      reloadStarted = true;
      log('Updated service worker took control. Reloading after the user-approved update.', 'sys');
      window.location.reload();
    } else {
      log('Service Worker controller changed. Reload remains user-controlled.', 'sys');
    }
  }

  activateButton?.addEventListener('click', activateWhenSafe);
  window.addEventListener('og-audio-state-change', refresh);
  window.addEventListener('focus', refresh);
  navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);

  return { announceAvailable, refresh, getAudioState };
}
