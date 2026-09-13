# OGCruncher release-readiness status

2026-09-13 · independent local verification from `master` at baseline
`70a63f7fff3e81d294612eb6870e2d3b0faf4b91`.

The checkout was re-established before verification. `origin/master` pointed to the
same baseline ref at that time. The working tree initially contained the uncommitted
phase-2 changes and ended with one additional, narrowly scoped UI-lock fix plus the
release-readiness records. No push, deployment, release, merge, history rewrite, or
user-audio upload was performed.

## Decision

The primary local workflow is release-ready for the exercised Chromium-like browser
environment: queue, metadata estimate, offline preview, A/B comparison, live update,
worker export, partial-result handling, download naming, and the 390px production
runtime all have direct evidence in [VERIFICATION.md](VERIFICATION.md).

This is not a cross-browser, physical-device, deployed-GitHub-Pages, perceptual-listening,
DAW-integration, or WCAG certification. Those boundaries remain explicitly Not verified.

## Scope and evidence classes

- **SOURCE** — current checkout, diff, configuration, and implementation review.
- **D-NODE** — deterministic numeric/core assertions.
- **D-VM** — actual worker or production-module execution in a controlled Node VM with
  fake hosts, deferred promises, and failure injection.
- **BROWSER-LOCAL** — rebuilt Vite production preview on a separate localhost origin.
- **CODEC-ROUNDTRIP** — raw output inspection followed by browser `decodeAudioData`.
- **NOT VERIFIED** — the boundary was not exercised and is not inferred from another class.

## Acceptance matrix

| Area | Result | Evidence | Remaining boundary |
| --- | --- | --- | --- |
| Baseline, phase-2 diff, and source review | Verified | Current `git status`, diff review, and `git diff --check` | Review is local-only |
| Core regression and state validation | Verified | `npm test`; original regression suite | Hostile URL corpus is not exhaustive |
| Audio fixtures and worker/core parity | Verified | `scripts/phase-2-regression.cjs`: silence, DC, impulse, sine, quiet sine, asymmetric stereo, transient; 8k/22.05k/48k; 1/8/12/16-bit; seeded creative and neutral bypass cases | Worklet/source unification is not complete |
| A/B signal path and Dual View topology | Verified | D-VM gain/topology assertions plus browser preview, A/B label changes, and Dual View toggle | Human listening and other engines are not verified |
| Latest-request-wins live rendering | Verified | Controlled out-of-order render test and browser live preset update with crossfade log | Long rapid-input stress is not verified |
| Stop/restart and stale-result protection | Verified | D-VM revision/session guards and browser Stop → Preview restart | Long-run timing stress is not verified |
| Cancellation and retry | Verified | D-VM read/decode/render/worker/between-file cancellation and retry | Slow real-browser fixture and resident-memory profiling are not verified |
| Metadata pending/error/cleanup | Verified | D-VM deduplication, explicit error state, Clear/Remove generation guards, and context closure | Device-specific decode corpus is not verified |
| Partial codec failure | Verified | Actual worker failure injection retains good formats and reports PARTIAL | Browser-injected failure and encoder timeout in production are not verified |
| Processing input lock | Verified | Production browser reproduced the pre-fix defect, then confirmed A/B and parameter controls disabled during processing while Stop remained available | No separate multi-tab claim |
| Filename, drag, download, and MIME contract | Verified | D-VM harness plus production result attributes for OGG/WAV/MP3 | Direct DAW drag integration is not verified |
| Preview/export relationship | Implemented, partially verified | Both use the same OfflineAudioContext render contract; worker/core PCM/WAV parity passes | Browser sample-level pre-encode PCM equality is not verified |
| WAV and codec round-trip | Verified for exercised output | Raw RIFF/WAV header checks and browser `decodeAudioData` for OGG/WAV/MP3 with finite samples | Lossy sample equality and perceptual quality are not required or verified |
| Production base path, worker, encoder assets, and SW readiness | Verified locally | Separate `vite preview` origin, asset headers/magic bytes, successful worker export, SW readiness log | Deployed Pages cache/update and cold offline launch are not verified |
| Responsive runtime | Verified for 390px, 320px geometry, and desktop geometry | Production browser at 390×844 and 320×844, desktop 1365×900, bounding-box/overflow checks, 390px screenshot | Other engines/devices are not verified |
| Browser zoom/accessibility | Not verified | The in-app harness did not expose a reliable true 200% browser-zoom change | Full WCAG, screen reader, reduced-motion, and 200% text zoom remain open |
| Repeated-run resource ownership | Partially verified | Preview/Stop/restart, repeated production export, source ownership review, blob revocation paths | Heap/resident-memory and large-file profiling are not verified |

## Findings fixed in this verification

1. Phase-2 R01–R08 were independently reviewed against source and rerun through the
   current deterministic and production-browser gates. Their existing status records
   remain historical evidence, not a substitute for the matrix above.
2. A new UI-lock defect was found: processing disabled parameter and queue controls
   but left Preview and A/B actionable. `js/ui.js` now keeps an active preview
   stoppable while blocking a second preview and A/B changes during processing. The
   phase-2 regression script contains a source-level guard for this contract.

## Deliberate residual debt

`js/dsp.worker.js` and `js/dsp-core.js` still contain separate DSP/WAV implementations.
The current gate executes both actual implementations and proves behavioral parity for
the stated fixture matrix; it does not claim source unification. Worklet parity remains
outside the product preview path. No ADPCM, M/S, waveform editor, or broad redesign was
introduced.

See [VERIFICATION.md](VERIFICATION.md) for commands, observations, and exact limits.
