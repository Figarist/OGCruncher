/**
 * OGCruncher — Queue Management
 * by figarist · https://figarist.github.io
 */

'use strict';

import { state } from './state.js';
import { log, showToast, setBadge, formatBytes } from './utils.js';
import { processDSP, normalizeBuffer, buildFilterChain, safeOfflineCtx } from './dsp.js';
import { encodeOGG, encodeWAV, encodeMP3 } from './encoders.js';
import { stopPreview } from './preview.js';

let _dom = {};
let activeBlobUrls = [];
let clippingBatchCount = 0;

/**
 * Initialize queue with DOM references.
 */
export function initQueue(domRefs) {
  _dom = domRefs;
}

export function addFiles(newFiles) {
  for (const f of newFiles) {
    if ([...state.files.values()].some(x => x.name === f.name && x.size === f.size)) continue;
    
    const id = state.nextId++;
    state.files.set(id, f);

    const li = document.createElement('li');
    li.className = 'queue-item queue-item--idle';
    li.id = `qi-${id}`;
    li.innerHTML = `
      <span class="queue-item__icon">◎</span>
      <span class="queue-item__name" title="${f.name}">${f.name}</span>
      <span class="queue-item__size">${formatBytes(f.size)}</span>
      <span class="queue-item__status" id="qs-${id}">IDLE</span>
      <button class="btn-remove" aria-label="Remove" onclick="removeFile(${id})">×</button>`;
    _dom.fileQueue.appendChild(li);
  }

  if (state.files.size > 0) {
    _dom.queueHeader.hidden = false;
    _dom.btnProcess.disabled = false;
    _dom.btnPreview.disabled = false;
    log(`${state.files.size} file(s) in queue.`, 'info');
  }
}

export async function loadDemoTrack() {
  if (state.processing) return;
  
  _dom.btnLoadDemo.disabled = true;
  _dom.btnLoadDemo.textContent = 'LOADING...';
  log('Fetching demo track from server...', 'sys');
  
  try {
    const response = await fetch('demo.mp3');
    if (!response.ok) throw new Error('Failed to fetch demo track');
    
    const blob = await response.blob();
    const file = new File([blob], 'loksii_demo_track.mp3', { type: 'audio/mpeg' });
    
    addFiles([file]);
    
    log('Demo track loaded successfully.', 'ok');
    log('Music by Oleksii Holubiev (Pixabay)', 'accent');
    showToast('Demo track loaded!', 'ok');
  } catch (err) {
    log(`Failed to load demo track: ${err.message}`, 'error');
    showToast('Failed to load demo', 'error');
  } finally {
    _dom.btnLoadDemo.disabled = false;
    _dom.btnLoadDemo.textContent = 'TRY DEMO TRACK';
  }
}

export function removeFile(id) {
  state.files.delete(id);
  const li = document.getElementById(`qi-${id}`);
  if (li) li.remove();

  if (state.files.size === 0) {
    clearQueue();
  } else {
    log(`${state.files.size} file(s) in queue.`, 'info');
  }
}
window.removeFile = removeFile;

export function clearQueue() {
  activeBlobUrls.forEach(url => URL.revokeObjectURL(url));
  activeBlobUrls = [];

  state.files.clear();
  state.nextId = 0;
  _dom.fileQueue.innerHTML = '';
  _dom.queueHeader.hidden = true;
  _dom.btnProcess.disabled = true;
  _dom.btnPreview.disabled = true;
  stopPreview();
  _dom.resultsArea.innerHTML = '';
  _dom.resultsArea.hidden = true;
  log('Queue cleared.', 'sys');
}

export function setItemState(id, status, icon) {
  const li = document.getElementById(`qi-${id}`);
  const qs = document.getElementById(`qs-${id}`);
  if (!li || !qs) return;
  li.className = `queue-item queue-item--${status}`;
  li.querySelector('.queue-item__icon').textContent = icon;
  qs.textContent = status.toUpperCase();
}

async function processFile(file, id) {
  setItemState(id, 'processing', '⟳');
  log(`Processing: ${file.name}`, 'accent');

  try {
    const rawBuffer = await file.arrayBuffer();

    const decodeCtx = new AudioContext();
    let decoded;
    try {
      decoded = await decodeCtx.decodeAudioData(rawBuffer);
    } catch (decodeErr) {
      throw new Error(`Cannot decode "${file.name}" — unsupported or corrupt file.`);
    } finally {
      await decodeCtx.close();
    }

    const targetRate = Math.min(Math.max(state.sampleRate, 3000), 48000);
    const numChannels = state.stereo ? Math.min(decoded.numberOfChannels, 2) : 1;
    const targetPlaybackRate = state.playbackRate || 1.0;

    const offCtx = safeOfflineCtx(
      numChannels,
      Math.ceil((decoded.duration / targetPlaybackRate) * targetRate),
      targetRate
    );

    const src = offCtx.createBufferSource();
    src.buffer = decoded;
    src.playbackRate.value = targetPlaybackRate;

    const lastNode = buildFilterChain(offCtx, src, { hpf: state.hpf, lpf: state.lpf, bass: state.bass });
    lastNode.connect(offCtx.destination);
    src.start(0);

    const resampled = await offCtx.startRendering();

    const channels = [];
    let hasClipping = false;

    for (let ch = 0; ch < numChannels; ch++) {
      const buf = resampled.getChannelData(ch);
      const samples = new Float32Array(buf);
      const clipped = processDSP(samples, state.bitDepth, state.crushMode, state.grit, state.noise);

      if (state.normalize) {
        normalizeBuffer(samples);
      } else if (clipped) {
        hasClipping = true;
      }

      channels.push(samples);
    }

    if (hasClipping) {
      log(`⚠ clipping detected in "${file.name}" — reduce Grit or enable Normalize`, 'error');
      clippingBatchCount++;
    }

    log(`  Decoded: ${decoded.numberOfChannels}ch → ${numChannels}ch | ${decoded.sampleRate}Hz → ${targetRate}Hz`, 'sys');

    const blobOGG = encodeOGG(channels, targetRate);
    const blobWAV = encodeWAV(channels, targetRate, state.bitDepth);
    const blobMP3 = encodeMP3(channels, targetRate);

    const stem = file.name.replace(/\.[^.]+$/, '');
    const outNameBase = `${stem}_crunched_${state.bitDepth}bit_${targetRate}hz`;

    const sizeOGG = formatBytes(blobOGG.size);
    const sizeWAV = formatBytes(blobWAV.size);
    const sizeMP3 = formatBytes(blobMP3.size);

    console.log(`[OGCruncher] ${file.name} future sizes -> OGG: ${sizeOGG}, WAV: ${sizeWAV}, MP3: ${sizeMP3}`);
    log(`  ✅ Done: ${file.name} [OGG: ${sizeOGG} | WAV: ${sizeWAV} | MP3: ${sizeMP3}]`, 'ok');
    setItemState(id, 'done', '✓');

    return {
      name: outNameBase,
      formats: [
        { ext: 'ogg', url: URL.createObjectURL(blobOGG), size: sizeOGG, blob: blobOGG },
        { ext: 'wav', url: URL.createObjectURL(blobWAV), size: sizeWAV, blob: blobWAV },
        { ext: 'mp3', url: URL.createObjectURL(blobMP3), size: sizeMP3, blob: blobMP3 }
      ]
    };

  } catch (err) {
    log(`  ❌ Error processing ${file.name}: ${err.message}`, 'error');
    setItemState(id, 'error', '✗');
    return null;
  }
}

export async function startProcessing(setProgress) {
  if (state.processing || state.files.size === 0) return;

  state.processing = true;
  _dom.btnProcess.disabled = true;
  _dom.btnProcess.classList.add('processing');
  _dom.btnProcessLbl.textContent = 'CRUNCHING…';
  _dom.progressWrap.hidden = false;
  _dom.resultsArea.innerHTML = '';
  _dom.resultsArea.hidden = true;
  setBadge('PROCESSING', 'badge--amber');
  log(`processing ${state.files.size} file(s)...`, 'accent');
  log(`${state.bitDepth}-bit · ${state.sampleRate} Hz · crush=${state.crushMode} · normalize=${state.normalize}`, 'sys');

  const results = [];
  const validFiles = [...state.files.values()];
  let processedCount = 0;
  clippingBatchCount = 0;

  const canShare = !!navigator.share; 

  for (const [id, file] of state.files.entries()) {
    const pct = (processedCount / validFiles.length) * 100;
    setProgress(pct, `File ${processedCount + 1} / ${validFiles.length}`);

    const result = await processFile(file, id);
    if (result) results.push(result);

    processedCount++;
    await new Promise(r => setTimeout(r, 0));
  }

  setProgress(100, 'Complete');

  if (results.length > 0) {
    _dom.resultsArea.hidden = false;

    if (results.length > 1) {
      const batchDiv = document.createElement('div');
      batchDiv.className = 'batch-actions';
      batchDiv.style.display = 'flex';
      batchDiv.style.gap = '8px';
      batchDiv.style.marginBottom = '12px';

      batchDiv.innerHTML = `
        <button id="btn-download-zip" class="btn btn--primary btn--zip" style="flex:1;">
          <span class="btn-icon">📦</span> DOWNLOAD ALL (.ZIP)
        </button>
        ${canShare ? `
          <button id="btn-share-zip" class="btn btn--secondary" style="padding: 10px 15px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </button>
        ` : ''}
      `;
      _dom.resultsArea.appendChild(batchDiv);
      document.getElementById('btn-download-zip').onclick = () => downloadResultsAsZip(results);
      if (canShare) {
        document.getElementById('btn-share-zip').onclick = () => downloadResultsAsZip(results, true);
      }
    }

    for (const r of results) {
      const div = document.createElement('div');
      div.className = 'result-item';
      div.style.flexWrap = 'wrap';

      div.innerHTML = `
        <span class="result-item__name" title="${r.name}" style="flex:1; width:100%; margin-bottom:8px;">${r.name}</span>
        <div style="display:flex; gap:8px; width:100%; flex-wrap: wrap;">
          ${r.formats.map(f => {
            activeBlobUrls.push(f.url);
            
            return `
              <div class="download-group" style="flex: 1; display: flex; gap: 2px;">
                <a href="${f.url}" 
                   download="${r.name}.${f.ext}" 
                   draggable="true"
                   ondragstart="handleDragStart(event, '${f.blob.type}', '${r.name}.${f.ext}', '${f.url}')"
                   class="btn-download" 
                   aria-label="Download ${f.ext}" 
                   title="Drag me to DAW or Unity! (${f.size})" 
                   style="flex:1; text-align:center;">
                  ${f.ext.toUpperCase()} <small style="opacity:0.7; font-size:10px;">${f.size}</small>
                </a>
                ${canShare ? `
                  <button class="btn-share" onclick="shareFile('${r.name}', '${f.ext}', '${f.url}')" title="Share ${f.ext}">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  </button>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>`;
      _dom.resultsArea.appendChild(div);

      r.formats.forEach(f => {
        const a = _dom.resultsArea.querySelector(`a[download="${r.name}.${f.ext}"]`);
        if (a) {
          a.addEventListener('click', () => {
            setTimeout(() => URL.revokeObjectURL(f.url), 10000); 
          }, { once: true });
        }
      });
    }
    log(`done: ${results.length}/${state.files.size} file(s) ready`, 'ok');
    showToast(`✅ ${results.length} file(s) ready`, 'ok');
    
    if (clippingBatchCount > 0) {
      showToast(`⚠ clipping in ${clippingBatchCount} file(s)`, 'error', 5000);
    }
    
    setBadge('DONE', 'badge--green');
  } else {
    log('error: 0 files processed', 'error');
    showToast('❌ processing failed — check log', 'error');
    setBadge('ERROR', 'badge--red');
  }

  state.processing = false;
  _dom.btnProcess.disabled = false;
  _dom.btnProcess.classList.remove('processing');
  _dom.btnProcessLbl.textContent = 'CRUNCH';
}

export async function downloadResultsAsZip(results, isShare = false) {
  // @ts-ignore
  const zip = new JSZip();
  const btn = isShare ? document.getElementById('btn-share-zip') : document.getElementById('btn-download-zip');
  const originalText = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = isShare ? '…' : '<span class="btn-spinner" style="display:block"></span> PACKING…';

  try {
    results.forEach(r => {
      r.formats.forEach(f => {
        zip.file(`${r.name}.${f.ext}`, f.blob);
      });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const filename = `OGCruncher_batch_${new Date().getTime()}.zip`;

    if (isShare && navigator.share) {
      const file = new File([content], filename, { type: 'application/zip' });
      await navigator.share({
        files: [file],
        title: 'OGCruncher Batch Export',
        text: `Shared ${results.length} crunched audio tracks.`
      });
    } else {
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      setTimeout(() => URL.revokeObjectURL(url), 15000); 
      
      showToast('📦 ZIP archive ready', 'ok');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      log(`zip error: ${err.message}`, 'error');
      showToast('❌ zip failed', 'error');
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

export async function shareFile(name, ext, url) {
  if (!navigator.share) return;

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const file = new File([blob], `${name}.${ext}`, { type: blob.type });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `OGCruncher: ${name}.${ext}`,
        text: 'Crunched audio via OGCruncher'
      });
    } else {
      await navigator.share({
        title: name,
        url: window.location.href,
        text: `Check out this crunched audio: ${name}.${ext}`
      });
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      log(`share error: ${err.message}`, 'error');
      showToast('❌ sharing failed', 'error');
    }
  }
}
window.shareFile = shareFile;

export function handleDragStart(e, type, name, url) {
  const downloadData = `${type}:${name}:${url}`;
  e.dataTransfer.setData('DownloadURL', downloadData);
  e.dataTransfer.effectAllowed = 'copy';
}
window.handleDragStart = handleDragStart;

export async function readAllEntries(reader) {
  const all = [];
  while (true) {
    const batch = await new Promise((res, rej) =>
      reader.readEntries(res, rej)
    );
    if (!batch.length) break;
    all.push(...batch);
  }
  return all;
}

export async function handleItems(items) {
  const allFiles = [];

  async function traverseEntry(entry) {
    if (entry.isFile) {
      const file = await new Promise(res => entry.file(res));
      if (file.type.startsWith('audio/') || /\.(wav|mp3|flac|ogg|aiff?|m4a)$/i.test(file.name)) {
        allFiles.push(file);
      }
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const entries = await readAllEntries(reader); 
      for (const e of entries) await traverseEntry(e);
    }
  }

  for (const item of items) {
    const entry = item.webkitGetAsEntry();
    if (entry) await traverseEntry(entry);
  }

  if (allFiles.length > 0) addFiles(allFiles);
}
