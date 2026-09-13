# OGCruncher phase-2 remediation status

2026-09-13 · local checkout `master` at `70a63f7fff3e81d294612eb6870e2d3b0faf4b91`.
The checkout was clean before this phase; the working tree now contains only the
phase-2 changes listed in the final handoff. No commit, push, merge, deployment or
release was performed.

This document is a dated follow-up to the 2026-09-10 audit and first remediation
reports. Those historical reports are retained. Their source-review, mocked, browser,
listening and deployment evidence is not silently upgraded here.

## Status vocabulary

- **Confirmed**: the phase-2 cause was reproduced or established by a direct source
  or deterministic behavior check.
- **Implemented**: the production path contains the scoped fix.
- **Verified**: the named automated or local-browser evidence passed. This does not
  imply listening, cross-browser, physical-device, DAW, or deployment proof.
- **Not verified**: an acceptance boundary was not exercised.
- **Blocked**: reserved for an external blocker. No R01–R08 item is externally
  blocked in this phase.

## R01–R08

| ID | Confirmed | Implemented | Verified / evidence | Remaining limitation |
| --- | --- | --- | --- | --- |
| R01 A/B signal path | Baseline phase-2 test failed with effective DRY gain `0` after WET → DRY; the old source/branch gain split was the cause. | Source gains now own only source replacement; both source buffers remain at gain `1` outside replacement crossfade. Branch gains own A/B with a 25 ms ramp. Analysers observe each source before branch muting. | `scripts/phase-2-regression.cjs` checks WET → DRY → WET, crossfade availability and analyser topology. Fresh browser preview reported non-zero RMS/peak for dry/wet rendered buffers and the A/B label changed through the actual graph. | Human listening, long repeated-update loudness profiling, and cross-browser output are Not verified. |
| R02 live-render freshness | Source review confirmed session-only invalidation allowed an in-flight older render to finish after a newer request. | Per-request revision plus session invalidation; stale renders cannot install buffers/sources/metrics/status. At most one full live render is in flight; latest pending settings are scheduled after it settles. Apply-time playhead mapping accounts for render time and changed playback-rate duration. Live Update OFF invalidates pending work. | Controlled Promise A/B test proves latest request wins, stale A never installs a source, no unbounded concurrent renders occur, and the playhead maps to the new duration. Final browser log showed actual crossfade updates. | A long-duration stress run and all browser engines are Not verified. |
| R03 cancellation lifecycle | Source review and controlled phase tests confirmed cancellation could arrive during read/decode/render/worker phases without a shared job generation. | A job generation/cancellation token is checked after every long async phase and in worker callbacks. Cancel terminates the worker where possible, rejects the active worker promise, prevents new workers/next files and suppresses stale outputs. Summary distinguishes full, partial, failed, cancelled and not attempted. | Deterministic tests cover file read, decode, offline render, worker, between-file cancellation and cancel → retry. No late result is rendered and retry completes a fresh batch. | Browser UI cancellation on a deliberately slow real fixture, physical API abort semantics and memory profiling are Not verified. |
| R04 metadata analysis | Baseline code could start duplicate decodes/contexts and treated `null` failure as perpetual ANALYZING; error paths could leave contexts open. | Per-file pending/success/error entries, one decode per file, concurrency cap `2`, `finally` close, generation checks for Remove/Clear, and explicit UNAVAILABLE state. Parameter updates reuse completed metadata. | Deterministic tests cover repeated updates during one decode, corrupt input, valid + invalid metadata, context closure and Clear-before-completion cleanup. | Device-specific decode behavior and large-corpus memory profiling are Not verified. |
| R05 partial codec failure | Worker already returned per-format errors, but queue counted any output as succeeded and could show DONE. | Full and partial outcomes are distinct; batch badge/summary and queue state expose partial output. Available formats remain downloadable and format errors are rendered beside results. Encoder initialization/runtime failures remain isolated. | Actual worker handler tests force OGG failure with WAV/MP3 working and MP3 failure with WAV/OGG working. Queue harness verifies PARTIAL summary, retained output and visible error. | Browser-injected codec failure, lossy round-trip decoding and encoder timeout in a production browser are Not verified. |
| R06 filename/MIME consistency | Source review confirmed drag registry used `${input}.${ext}` while download used the processed basename. | `getOutputFilename()` sanitizes and bounds the basename and is used for output `File`, download link, result naming and fallback DownloadURL. MIME mapping is shared by Blob and fallback. | Queue harness checks long/special names, registry/download equality and WAV fallback MIME. Final browser links exposed `demo_crunched_16bit_32000hz.{ogg,wav,mp3}` with `audio/ogg`, `audio/wav`, `audio/mpeg`. | A real DAW drag/drop integration is Not verified. |
| R07 worker/core parity | Source review confirmed worker DSP/WAV and `dsp-core.js` were separate implementations; core-only tests did not prove worker behavior. | Chosen phase-2 scope is behavioral parity coverage of both actual implementations, without risking `importScripts`, encoder loading or Pages paths during a larger refactor. | Actual classic worker handler is executed in a deterministic VM for mono/stereo quiet/DC/impulse/sine-like vectors, bits `1/8/12/16`, crush/normalize, seeded noise/dither and WAV headers; outputs are compared with `dsp-core.js`. | Source duplication remains a documented residual debt. Real-browser sample-level preview/export PCM equality and Worklet parity are Not verified. |
| R08 evidence/documentation consistency | Historical reports contained dated contradictions about partial success, Worklet acceptance, verification strength and working-tree state. | Added this dated phase-2 status and verification record; claims use explicit evidence classes and preserve the first-phase history. | Repository review, `npm test`, build, browser notes and diff review were reconciled against current HEAD `70a63f7`; no claim relies on a fresh remote check. | Listening, cross-browser, physical-device, deployed Pages, Neutralino and DAW evidence remain Not verified. |

## Scope retained

The Figarist visual system, offline preview/export contract, no-implicit-delete queue
behavior, GitHub Pages base path and existing hydration/WAV/linked-normalization fixes
were preserved. No ADPCM, M/S, waveform editor, or broad redesign was added.

## Dated release-readiness follow-up — 2026-09-13

The subsequent independent release-readiness pass rechecked this phase against the
current checkout and found one additional UI defect outside R01–R08: processing locked
parameter and queue controls but left Preview and A/B actionable. `js/ui.js` now keeps
an active preview stoppable while disabling a second preview and A/B changes during a
batch. The phase-2 regression gate and rebuilt production browser run pass with the
fix. See [docs/release-readiness/STATUS.md](../../release-readiness/STATUS.md) and
[docs/release-readiness/VERIFICATION.md](../../release-readiness/VERIFICATION.md).

The tables above remain the historical phase-2 record; their earlier working-tree and
browser-session statements are not being silently rewritten.
