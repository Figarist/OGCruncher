# Prioritized improvement plan

Updated 2026-09-10. Items marked complete are implemented in the current working tree;
remaining items are backlog. Evidence and acceptance criteria are in the
[bug register](docs/audit/2026-09-10/BUGS.md) and the
[remediation verification](docs/remediation/VERIFICATION.md).
Effort: S = localized; M = multiple modules; L = architecture/cross-browser work.

| Order | Work | Expected result | Effort | Current state |
| --- | --- | --- | --- | --- |
| 1 | Hydration and snapshots, S01–S03 | Reload, links and undo preserve sound settings | M | Implemented; browser/static evidence recorded |
| 2 | Audio contract, A01–A04/A06–A09 | Preview matches export; stereo and quiet audio remain predictable | L | Implemented for offline path; live Worklet equality not verified |
| 3 | Mobile grid and keyboard, U01–U02 | Usable controls and native keyboard activation | S | Implemented; target widths and undo/redo checked |
| 4 | Filename text rendering, S05 | No HTML interpretation of imported names | S | Implemented; hostile-name browser case not run |
| 5 | PCM and size accounting, A05/F01–F03 | Correct packing, actual duration, per-codec estimates | M | Implemented; regression and demo export checked |
| 6 | Batch snapshot/failures/blobs, S06–S08 | Reproducible jobs and bounded repeated-run memory | M | Implemented; success/lock path checked, failure injection pending |
| 7 | Safe PWA updates, S09 | Queued work survives until explicit reload | M | Implemented statically; live update timing pending |
| 8 | Choose formats before encoding | Avoid unnecessary codecs and isolate failures | M | Backlog |
| 9 | ZIP/download-all and naming templates | Collision-safe batch delivery with settings manifest | M | Backlog |
| 10 | Per-file progress/cancel/retry | Clear stage and recovery controls | M | Backlog |
| 11 | Waveform, seek and loop region | Audition attacks/tails without whole-file looping | L | Backlog |
| 12 | Select file for preview | Explicit currently playing filename | M | Backlog |
| 13 | Optional loudness-matched A/B | Fair comparisons without altering export gain | M | Backlog |
| 14 | Actual output meters/headroom | Distinguish sample peak, true peak and estimates | M | Backlog |
| 15 | Full Ukrainian UI | Consistent labels, errors, help and number formatting | M | Backlog |
| 16 | Keyboard help/numeric entry/reset | Discoverable, undoable, accessible controls | M | Backlog |
| 17 | Encoder quality choices | Supported MP3/OGG settings with honest estimates | M | Backlog |
| 18 | Named creative presets | Sonic intent without unverified hardware claims | S | Backlog |
| 19 | Shared DSP and regression tests | Prevent worker/worklet drift | L | Offline core and regression coverage implemented; Worklet parity pending |
| 20 | Desktop release smoke matrix | Executable/assets/export validated per OS | L | Backlog |

## Deferred exploration

ADPCM, legacy resamplers, alternate waveshapers, M/S and a third comparison slot are
possible after correctness work. Research actual engine requirements first. Do not
claim ADPCM needs no decoder, universal target support, or absence of competitors.

LUFS needs an explicit standard and reference vectors. Integrated loudness and a
three-second short-term reading are different; peak normalization is not perceptual
loudness normalization. A simplified RMS calculation is not a compliant LUFS meter.

## Corrections to the former backlog

- `setBadge` is already imported in `js/ui.js:8`.
- Clipping detection is already before tanh; the old dead-code claim is stale.
- `isUpdatingPreview` no longer exists; session IDs replaced that mechanism.
- TPDF is already before rounding with `1/halfLev` amplitude. The former proposed
  `1/(1<<bitDepth)` was half this quantizer's step.
- Worklet uses static makeup, not per-block peak normalization. A running RMS AGC
  would change the sound and is not a preview/export parity fix.
- Current precache includes local encoders and `.mem`. Offline update/cold-launch
  behavior still needs runtime tests.
- ZIP, waveform and standards-based loudness remain proposals.
