# OGCruncher phase-2 verification record

2026-09-13 · baseline `master` / `70a63f7fff3e81d294612eb6870e2d3b0faf4b91`.
Verification is local-only. `origin/master` was observed as the same local ref at the
start; this is not a fresh remote-network verification. No commit, push, merge,
deployment or release was performed.

## Evidence classes

- **D-VM** — deterministic Node VM with controlled promises/fake clock or fake host;
  production functions/worker source are executed, but this is not browser audio.
- **D-NODE** — deterministic numeric/core regression.
- **BROWSER-LOCAL** — final rebuilt Vite preview on `http://127.0.0.1:5193/OGCruncher/`
  using the bundled `demo.mp3` fixture in a Chromium-like in-app browser.
- **SOURCE** — code/config/diff inspection.
- **NOT VERIFIED** — boundary intentionally not exercised.

## Scenario matrix

| Scenario | Baseline | Fixture | Command / action | Expected | Observation | Evidence class | Remaining limitations |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R01 effective A/B gain | Old baseline had DRY source gain `0` after WET → DRY. The new regression was run against that code first and failed on effective signal gain. | Fake AudioParam host plus rendered wet/dry buffers. | `node scripts/phase-2-regression.cjs` (`testABSignalPath`). | Selected branch has non-zero effective source × branch gain; inactive branch remains ready; analysers remain pre-mute. | Passed WET → DRY → WET, crossfade source availability and analyser topology. | D-VM | No listening or hardware-output claim. |
| R01 browser signal | Final built bundle after `npm run build`. | Bundled `demo.mp3`; real `OfflineAudioContext`; dry/wet metrics. | Load demo, start Preview, click A/B, switch Advanced and apply grit update, then Stop → Restart. | Preview enters STOP state, metrics are finite/non-zero, A/B changes branch state, update keeps playback alive. | Preview log: offline render contract; RMS/peak/duration displayed; A/B showed `ORIGINAL (DRY · OUTPUT SETTINGS)` then `CRUNCHED (WET)`; live log included `short complementary crossfade`; restart returned to STOP. | BROWSER-LOCAL | Human listening and cross-browser behavior Not verified. |
| R02 out-of-order render | Session-only guard was insufficient for two in-flight renders. | Controlled Promise A/B; fake timer; B resolves/installs after A is stale. | `npm test` → phase-2 regression. | A cannot install buffers/sources/metrics; only B installs; concurrency is bounded. | Passed; source pair count showed no stale installation and playhead offset mapped to the new duration. | D-VM | Browser timing stress across many rapid slider events Not verified. |
| R03 read/decode/render/worker cancellation | Old lifecycle checked cancellation only around worker ownership. | Deferred file read, decode, OfflineAudioContext render and worker promise. | `npm test` → `testCancellationAndRetry`. | Cancel prevents worker/next file/late output; retry starts cleanly. | Passed for all four stages, plus cancellation between files; summary reported cancelled/not attempted and retry produced one full completion. | D-VM | Real browser slow-fixture cancel and physical abort support Not verified. |
| R04 metadata dedupe/error/cleanup | Repeated estimate updates could create duplicate AudioContexts; failure could remain ANALYZING. | Deferred valid metadata, corrupt metadata, Remove/Clear before completion. | `npm test` → `testMetadataStatesAndCleanup`. | One active decode per ID, bounded concurrency, close in success/error, explicit error/unavailable, no late return after clear. | Passed; repeated updates created one context; success became PER-FORMAT; corrupt input became UNAVAILABLE; all contexts closed; Clear left metadata empty/hidden. | D-VM | Browser decode matrix and resident-memory profiling Not verified. |
| R05 partial OGG/MP3 failure | Queue could count a partial result as succeeded/DONE. | Actual `js/dsp.worker.js` handler with deterministic fake encoder failure. | `npm test` → `testWorkerParityAndPartialFailures` and `testPartialQueueSummary`. | Good formats survive; error identifies format; queue is PARTIAL, not DONE. | OGG failure retained WAV/MP3; MP3 failure retained WAV/OGG; queue rendered format error and PARTIAL badge/summary. | D-VM | Browser codec injection and real encoder timeout Not verified. |
| R06 names and MIME | Registry File used input name plus extension, diverging from link download. | Long unsafe filename; actual queue result harness; final demo export. | `npm test`; final browser result attribute inspection. | One bounded filename for File/link/UI/fallback; fallback MIME matches extension. | Harness and browser passed: `demo_crunched_16bit_32000hz.ogg/.wav/.mp3`, MIME `audio/ogg`, `audio/wav`, `audio/mpeg`, and WAV fallback DownloadURL contract. | D-VM + BROWSER-LOCAL | Direct DAW drop is Not verified. |
| R07 actual worker/core behavior | Existing regression mostly exercised core only. | Actual classic worker handler; mono/stereo arrays; bits `1/8/12/16`; quiet/DC/impulse/sine-like vectors; seeded noise/dither; normalize; WAV. | `npm test` → worker parity test. | Worker DSP and WAV bytes match core for tested vectors; handler posts done/errors. | Passed sample comparisons and WAV byte comparisons; forced per-format failures also posted expected errors. | D-VM | This is behavioral parity, not source unification or browser sample-level proof. |
| R08 docs/evidence | First-phase reports were internally inconsistent and included old Worklet/working-tree wording. | Current diff, current HEAD, old dated reports, new phase-2 records. | Source/diff review; `git status`, `git diff --check`. | Historical claims remain dated; current claims identify fixture/action/evidence/limits. | New phase-2 records added without deleting first-phase history; working tree/current commit wording is current. | SOURCE | A report cannot replace listening, cross-browser, deployment or DAW evidence. |

## Required checks

| Check | Result | Boundary |
| --- | --- | --- |
| `npm test` | Pass: original regression plus phase-2 deterministic suite. | Not a full integration suite, listening test or browser-engine matrix. |
| `npm run build` | Pass: Vite 8.0.13, classic worker and generated service worker. | Does not prove deployment, cache freshness or device runtime. |
| `node scripts/audit-numerics.cjs` | Existing numeric probe remains available; it is characterization, not the sole gate. | Does not execute browser resampling/codecs. |
| `git diff --check` | Pass. | Does not review semantics. |
| Final browser console diagnostics | No error/warning entries returned after demo preview/live update/export. | One local Chromium-like session. |

## Explicitly Not verified

Human listening, perceptual loudness, MP3/OGG lossy round-trip decoding, Firefox/Safari,
390px viewport rerun in this browser harness, physical mobile, complete WCAG/200% text-zoom certification, reduced-motion, DAW drag
integration, browser-injected codec failure, deployed GitHub Pages parity, offline cold
launch, live service-worker update during active work, Neutralino executable launch and
long-run memory/large-file profiling.

The final browser smoke was desktop-sized. The first-phase 390px target-width evidence
remains historical; phase 2 changed result/error content but did not change breakpoint
topology. A fresh 390px runtime capture is therefore Not verified rather than inferred
from the desktop result.

Ports `5190` and `5191` were intentionally not used as final evidence because they had
older service-worker/build state at different points in the work. Port `5192` confirmed
the rebuilt flow before the final crossfade micro-fix; port `5193` was started after the
final rebuild and is the authoritative browser smoke record above.

## Dated release-readiness follow-up — 2026-09-13

This record was independently rechecked after the phase-2 snapshot. A processing-control
defect was reproduced in a production browser: Preview and A/B remained enabled while a
batch was active. The narrow fix is recorded in the release-readiness verification, along
with a clean-origin production run at 390px, 320px geometry, desktop geometry, raw WAV
headers, browser codec decoding, and current final limits. Read the dated follow-up at
[docs/release-readiness/VERIFICATION.md](../../release-readiness/VERIFICATION.md).
