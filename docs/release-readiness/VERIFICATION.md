# OGCruncher release-readiness verification

2026-09-13 · local verification record for the tree described in
[STATUS.md](STATUS.md).

## Baseline and checkout evidence

- Working directory: `D:\GitHub\OGCruncher`.
- Baseline HEAD at audit start: `70a63f7fff3e81d294612eb6870e2d3b0faf4b91`.
- Branch: `master`; local `origin/master` matched the baseline at audit start.
- Initial changes: phase-2 source/docs/tests were present and uncommitted. They were
  reviewed as code, not accepted from the earlier report by assumption.
- No push, deployment, release, merge, force operation, reset, or user-audio upload.

## Commands and results

| Command | Result | Evidence class |
| --- | --- | --- |
| `git status --short --branch` | Confirmed `master...origin/master` and the expected phase-2 working set | SOURCE |
| `git log --oneline --decorate -12` | Confirmed baseline `70a63f7` and preceding history | SOURCE |
| `git diff --stat`, `git diff --check` | Reviewed phase-2 diff; whitespace check passed | SOURCE |
| `npm test` | Original regression plus phase-2 regression passed | D-NODE + D-VM |
| `npm run build` | Vite 8.0.13 production build passed; worker and service worker emitted | SOURCE |
| `node scripts/audit-numerics.cjs` | Historical characterization and current numeric observations completed; not treated as the sole gate | D-NODE |

The final source gates were rerun after the processing-control fix and after expanding
the fixture matrix. The production bundle was rebuilt before the final browser run.

## Deterministic audio and async evidence

`npm test` executes `scripts/phase-2-regression.cjs`, which runs the production worker
handler and core module rather than a copied test implementation. The parity matrix uses:

- silence, DC, impulse, sine, quiet sine, asymmetric stereo, and a short transient;
- 8,000, 22,050, and 48,000 Hz output rates;
- effect bits 1, 8, 12, and 16;
- seeded creative processing with noise/dither and neutral Crush-off processing;
- exact worker/core sample comparison, finite/bounded sample assertions, and WAV
  channels/rate/container-depth/header parity.

The same suite covers:

- WET → DRY → WET branch selection, branch availability, and analyser placement;
- out-of-order live render A/B resolution, bounded in-flight work, and playhead mapping;
- cancellation during read, decode, offline render, worker execution, and between files;
- cancellation followed by a clean retry;
- metadata decode deduplication, explicit error state, generation-safe Clear, and
  AudioContext closure;
- forced OGG and MP3 failures with good formats retained and a PARTIAL queue summary;
- bounded/sanitized output names and MIME-correct drag fallback;
- the processing-control lock contract in `js/ui.js`.

These are deterministic execution proofs. They do not claim listening, browser-engine
coverage, or long-duration stress behavior.

## Production-browser evidence

The final browser run used a separate local production origin:

```text
npm run build
npm run preview -- --host 127.0.0.1 --port 5196
http://127.0.0.1:5196/OGCruncher/
```

Observed in the rebuilt production page:

1. Service Worker registration logged `Service Worker registered.` followed by
   `Offline cache is ready for the current application revision.`
2. The bundled `demo.mp3` loaded and decoded from the base path.
3. Preview rendered the dry and wet buffers; the metrics panel showed finite RMS/peak
   values and the preview log identified the shared OfflineAudioContext contract.
4. A/B switched to `ORIGINAL (DRY · OUTPUT SETTINGS)` and back to the wet branch.
   Dual View toggled on in the earlier production smoke, and the actual source graph
   was covered by the D-VM topology assertion.
5. Advanced/preset changes produced the expected state and a real
   `Live update applied with a short complementary crossfade (...)` log.
6. Stop → Preview restart returned to a live `STOP` state.
7. Export completed with `Completed: 1 full, 0 partial; failed: 0; cancelled: 0; not attempted: 0.`
   OGG, WAV, and MP3 result links remained available.
8. Production console diagnostics returned no error or warning entries.

### Responsive measurements

The browser viewport was set through the browser debugging interface for measurement;
the temporary override was used only for this verification.

| Viewport | Document width | Key observations |
| --- | ---: | --- |
| 390×844 | 382 CSS px | One-column panels; controls stayed inside the document; preview/process buttons were 322px wide; no horizontal overflow |
| 320×844 | 320 CSS px | One-column panels; controls stayed inside the document; preview/process buttons were 274px wide; no horizontal overflow |
| 1365×900 | 1357 CSS px | Three-panel desktop layout; left/center/right panels and result area stayed within the document |

A 390px screenshot was captured after the real production preview was running. Bounding
boxes were checked for `#panel-left`, `#panel-center`, `#panel-right`, `#drop-zone`,
`#btn-preview`, `#btn-process`, `#file-queue`, and `#log-window`.

The in-app browser did not expose a reliable true 200% browser-zoom operation: repeated
zoom-key attempts left `innerWidth=390`, `innerHeight=844`, and `devicePixelRatio=1`.
Therefore 200% text zoom is Not verified, rather than being inferred from responsive CSS.

### Processing-control defect and fix

Before the fix, the production page reported these live control states immediately after
starting a batch with an active preview:

```text
Stop preview: enabled
A/B: enabled
Advanced mode: enabled
```

The source review identified the missing Preview/A/B lock in `setControlsEnabled(false)`.
After the fix, the same production action reported:

```text
Stop preview: enabled
A/B: disabled
Advanced mode: disabled
```

Keeping Stop enabled is intentional: it stops the already playing preview without
allowing a second preview or branch mutation to start during processing.

## Asset and codec checks

The production preview responded with HTTP 200 and non-HTML content for the relevant
assets. Representative headers were:

| Asset | Content-Type | Magic/content observation |
| --- | --- | --- |
| `demo.mp3` | `audio/mpeg` | 4,197,146-byte bundled MP3 fixture |
| `sw.js` | `text/javascript` | JavaScript service worker |
| built worker | `text/javascript` | JavaScript classic worker |
| `OggVorbisEncoder.min.js` | `text/javascript` | JavaScript encoder |
| `lame.min.js` | `text/javascript` | JavaScript encoder |
| `OggVorbisEncoder.min.js.mem` | empty in Vite preview | Binary memory asset; worker loaded it successfully, but deployed-server MIME was not verified |

The final browser result attributes were:

```text
demo_crunched_16bit_32000hz.ogg  audio/ogg
demo_crunched_16bit_32000hz.wav  audio/wav
demo_crunched_16bit_32000hz.mp3  audio/mpeg
```

Raw WAV inspection of the production output reported RIFF/WAVE, 1 channel, 32,000 Hz,
16-bit container, `dataBytes=8,394,292`, total bytes `8,394,336`, and consistent RIFF
lengths. The browser round-trip decode returned finite mono samples for all three outputs:

```text
OGG: 664,955 bytes, 1 channel, 48,000 Hz decode context, 131.1608125 s, finite=true
WAV: 8,394,336 bytes, 1 channel, 48,000 Hz decode context, 131.1608125 s, finite=true
MP3: 2,099,520 bytes, 1 channel, 48,000 Hz decode context, 131.22 s, finite=true
```

The 48,000 Hz value above is the browser decode context's resampling result; the raw WAV
header independently verified the requested 32,000 Hz. Lossy OGG/MP3 sample equality was
not required and was not claimed.

## Not verified

- Human listening, perceptual loudness, true-peak behavior on hardware, and DAW drag/drop.
- Firefox, Safari, physical mobile devices, and cross-browser audio differences.
- True 200% browser text zoom, full WCAG/screen-reader certification, and reduced-motion
  behavior beyond the source/CSS review.
- Browser-injected codec failures, encoder-init timeout in a production browser, and a
  deliberately slow real-browser cancellation fixture.
- Long-duration/large-file memory profiling, resident-memory leak claims, and full
  offline cold-launch/update behavior while active work is present.
- Deployed GitHub Pages, live service-worker update, Neutralino executable launch, and
  physical-device behavior.

## Final cleanup boundary

The local preview processes used for this record are temporary verification servers.
They must be stopped after the final browser evidence is captured; no external process
on a conflicting port is terminated.
