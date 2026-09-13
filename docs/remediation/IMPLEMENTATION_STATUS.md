# OGCruncher remediation status

Started 2026-09-10 from the current `master` checkout. The baseline audit was
performed at `fc0209cd27a3ffa7562955bac22cf272eb740f39`; the working tree includes
the remediation changes listed below. Existing user changes are preserved.

## Working plan

1. Establish validated state hydration and complete snapshots.
2. Establish one documented DSP/WAV contract for offline preview and export.
3. Harden worker batching, resource ownership, failures, cancellation and estimates.
4. Fix PWA update ownership and the audited responsive/accessibility defects.
5. Run numeric regression checks, production/browser checks, review the diff and
   record evidence in [VERIFICATION.md](VERIFICATION.md).

> **Dated follow-up — 2026-09-13:** The historical first-phase status is retained.
> Phase-2 and release-readiness results are recorded in
> [docs/remediation/phase-2/STATUS.md](phase-2/STATUS.md) and
> [docs/release-readiness/STATUS.md](../release-readiness/STATUS.md). Do not read the
> older `Implemented, not verified` entries as current release evidence.

## Status vocabulary

- **Verified** means the listed automated, static, or browser evidence passed; it does
  not upgrade unperformed human-listening, codec, cross-browser, or deployment proof.
- **Implemented, not verified** means the implementation is present and some evidence
  exists, but an acceptance sub-case remains explicitly unverified.
- **Not verified** is used for the remaining acceptance boundary, not as a claim that
  the implementation is absent.

## Audit ID status

| ID | Initial state | Confirmed cause | Implemented change | Verification method/evidence | Result | Remaining limitation |
| --- | --- | --- | --- | --- | --- | --- |
| S01 | Defaults were written before saved/hash state was read | Startup persisted defaults before hydration | Validated defaults/saved state/URL precedence; one hydration write | `npm test`; browser reload and explicit URL checks | Verified | Cross-browser storage behavior |
| S02 | Restore could reapply Simple quality over Advanced values | Restore callback triggered preset synchronization | Restore suppresses persistence/preview cascades; Simple no longer overwrites Advanced restore | `npm test`; browser Simple↔Advanced and undo/redo | Verified | Full multi-step history matrix |
| S03 | Custom and Advanced snapshots omitted playback rate | Snapshot field lists excluded `playbackRate` | Advanced/custom snapshots include playback rate and all sound fields | Source review; browser custom preset and mode restore | Verified | Independent speed-only browser assertion |
| S04 | Coercion accepted NaN/invalid ranges and noninteger bit depth | Numeric parsing lacked finite/type/range/integer validation | State sanitization and safe storage/hash handling reject invalid fields | `npm test`; current numeric probe; malformed URL kept UI finite | Verified | Full hostile URL corpus |
| S05 | File names were interpolated into `innerHTML` | Queue/result rendering trusted file-derived strings | File-derived names use DOM text nodes; output names are generated safely | Source review; browser result naming | Implemented, not verified | Browser hostile filename fixture |
| S06 | Async processing read mutable state and controls remained reachable | No immutable batch snapshot or complete input lock | Freeze one validated snapshot; disable controls; ignore hash edits while processing | Source review; browser `PROCESSING` tree showed disabled controls | Implemented, not verified | Active-job hash mutation was not captured before the demo completed |
| S07 | Replaced results retained obsolete blob URLs/wrapper Files | Resource registry was not cleared on replacement | Revoke result URLs before replacement and on clear/teardown; retain only current results | Source review; bounded current result registry | Verified | Resident-memory profiling across repeated large batches |
| S08 | One codec failure could abort the batch; no cancel/recovery path | Worker treated formats as one failure domain and lacked cancellation | Independent format attempts, per-format errors, cancellation path and accurate counters | Source review; browser 1/1 OGG/WAV/MP3 success and invalid-fixture `0 succeeded, 1 failed` recovery | Implemented, not verified | Cancel/retry and multi-file partial success |
| S09 | Service-worker takeover could reload unsaved work | Controller-change handler forced `location.reload()` | Manual SW owner, prompt update policy, no controller-change auto-reload | Source/config review; production preview cache-ready log | Implemented, not verified | Live update during active audio work |
| A01 | Preview/export applied filters on opposite sides of nonlinear DSP | Two audio paths had different operation order | Offline preview and export apply filters in one render contract | Source review; browser preview log states offline contract | Implemented, not verified | Sample-level browser waveform comparison |
| A02 | Worklet pre-gain/makeup could exceed full scale | Hidden gain stages were outside explicit bounds | Remove hidden pre-gain/makeup from bounded DSP paths; explicit final bounds | `npm test`; source review | Verified | Hardware/device true-peak behavior |
| A03 | Normalization was independent per channel | Each channel used its own peak | Linked cross-channel normalization after per-channel DSP | `npm test`; current numeric ratio `0.099999996...` | Verified | Codec round-trip channel analysis |
| A04 | Crush OFF still removed DC/normalized/saturated and quiet audio was boosted | DSP had unconditional cleanup/gain/nonlinearity | Crush OFF is neutral at grit 1/noise 0; no implicit DC removal/normalization | `npm test`; current numeric quiet-signal probe | Verified | Human listening/perceptual judgment |
| A05 | PCM8 midpoint/rounding and odd RIFF padding were wrong | Encoder truncated samples and omitted even-byte padding | Correct midpoint/endpoints, clamp/rounding, RIFF lengths/padding; separate effect/container depth | `npm test`; current numeric WAV probe | Verified | Decoder compatibility matrix |
| A06 | Original branch was resampled/sped/channel-converted without clear semantics | Dry and wet branches used ambiguous output transformations | Original comparison uses selected output rate/channel mode/speed with explicit dry/wet metrics | Browser metrics showed `131.16s → 131.16s`; source review | Implemented, not verified | Listening and codec-delay semantics |
| A07 | Metrics mixed estimates/windows and spectrum drew bins outside Nyquist | Display was not tied to rendered buffers/visible frequency range | Metrics use rendered dry/wet buffers; visualizer maps visible bins to canvas/Nyquist | Browser metrics and screenshot; source review | Implemented, not verified | Numeric reference-vector and display QA |
| A08 | Preview replacement could overlap old/new full-gain sources | Old source was stopped after new source started at full gain | Complementary wet/dry gains and old-source cleanup during replacement | Source review; browser preview completed without overlap error | Verified | Long repeated preview stress test |
| A09 | Preview lifecycle/A-B/Live Update/error recovery were inconsistent | Multiple async paths lacked one cleanup/label contract | Preview cleanup, A/B label reset, failure button recovery, monitor-only volume; offline parity path | Browser preview/stop state; source review | Implemented, not verified | Injected render failure and Worklet path |
| F01 | WAV estimate used effect depth and guessed source metadata | Estimate ignored decoded duration/channels/rate/speed | Estimates use decoded metadata and output container bits/channels/rate/duration/speed | Browser metadata-backed estimates and actual output sizes | Verified | Lossy encoder calibration |
| F02 | One compressed estimate represented OGG and MP3 | Codec estimates were collapsed into one value | OGG range, MP3 estimate and WAV estimate shown separately | Browser savings panel and result links | Verified | More source/codec calibration samples |
| F03 | Growth was clamped away and badge selected the best codec | Percent display only showed savings and chose a codec implicitly | Signed per-format size changes and no best-codec aggregate badge | Browser `+100%`, `-84%`, `-50%` examples | Verified | Calibration uncertainty reporting |
| U01 | Inline `grid-column: span 2` broke the mobile one-column rule | Inline style outranked responsive CSS | Removed inline grid override; responsive layout tested at target widths | Browser 320/390/600/860/1180/1440 geometry and control boxes, no horizontal overflow | Verified | Physical device testing |
| U02 | Global handler ignored interactive focus/modifiers/default prevention | Shortcut checks ran after an unsafe broad interception path | Shortcuts respect interactive focus, dialogs, modifiers and default prevention | Browser body-context undo/redo and AX output | Verified | Full keyboard/screen-reader conformance |
| U03 | Help/resizers lacked accessible alternatives and modes lacked semantics | Mouse-only resizers and visual-only mode state | Help details, pressed mode semantics, focusable resizers and keyboard resizer path | Browser AX tree exposed modes/help/resizers; filters expanded; 200% page-scale layout stayed within viewport | Implemented, not verified | Complete screen-reader/contrast/zoom conformance walkthrough |

The exact automated and browser evidence is in [VERIFICATION.md](VERIFICATION.md).
No commit, push, merge, deployment, or release action was performed.
