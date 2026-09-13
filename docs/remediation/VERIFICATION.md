# Post-remediation verification

2026-09-10 · current working tree on `master` · local-only verification.
The baseline audit remains at
`fc0209cd27a3ffa7562955bac22cf272eb740f39`; this record covers the remediation
changes made after that audit. No commit, push, merge, deployment or release action
was performed.

## Automated and static checks

| Check | Outcome |
| --- | --- |
| `npm test` | Exit 0. Regression assertions passed for neutral/linked DSP, silence/DC/quiet-sine/asymmetric-stereo/impulse/unit-sine bounds, PCM WAV layout and state validation. |
| `npm run build` | Exit 0. Vite 8.0.13; 12 modules; generated hashed assets, classic worker, manifest and service worker. |
| `node scripts/audit-numerics.cjs` | Exit 0. Historical defects remain labelled separately; current probes show linked ratio `0.099999996...`, quiet Crush OFF output `0.000009999999747...`, PCM8 midpoint `128`, and odd-byte padding `1`. |
| `git diff --check` | Exit 0; only normal line-ending warnings were reported. |
| Source review | State, DSP, worker, queue, PWA, filename, responsive and accessibility remediation paths reviewed. |

The machine-readable current probes are in
[numeric-results-2026-09-10.json](numeric-results-2026-09-10.json). The audit script is
characterization, not the regression gate; use `npm test` for assertions.

## Local production-browser checks

The app was served locally from `http://127.0.0.1:5189/OGCruncher/` after a fresh
production build. A second local port was used to avoid an older browser service-worker
cache. The demo track was used; no user audio was uploaded externally.

| Scenario | Observed result | Evidence boundary |
| --- | --- | --- |
| First load and onboarding | New UI loaded; modal closed; cache-ready log appeared | Local Chromium-like browser only |
| Add demo | Queue showed `demo.mp3`, `4.00 MB`, `WAITING`; metadata later produced per-format estimates | Demo fixture, not arbitrary input corpus |
| Metadata-backed estimates | WAV, OGG range and MP3 values appeared separately; no aggregate “best codec” claim | Estimates are still estimates until encoded |
| Preview | Offline render completed; metrics showed dry/wet RMS, peak and equal duration; accessible button became `STOP` while active | No listening or sample-level waveform claim |
| Batch export | Log showed `Decoded 2ch → 1ch`, `48000Hz → 32000Hz`, then `Batch complete: 1 attempted, 1 succeeded, 0 failed.` | Success path only |
| Result delivery | OGG/WAV/MP3 links appeared with `demo_crunched_16bit_32000hz` basename and signed per-format changes; links carried matching `download` filenames; the supported `downloadMedia()` action completed for OGG | Raw browser download event timed out for a blob link, but the supported media-download action, link attributes and result DOM were verified |
| Processing lock | During `PROCESSING`, mode buttons, presets, sliders, toggles, clear/remove and Crunch were disabled; `STOP PROCESSING` was enabled | Active hash-mutation race was not captured before the short demo finished |
| Error recovery | A local 79-byte `not-audio.wav` fixture produced `Cannot decode this audio file`, `Batch complete: 1 attempted, 0 succeeded, 1 failed`, and an enabled idle UI. In a second run, the invalid file plus demo produced `2 attempted, 1 succeeded, 1 failed` and retained OGG/WAV/MP3 results for the successful file | Cancel/retry remains unverified |
| Simple/Advanced | Advanced settings were exposed; switching to Simple neutralized hidden grit to `1`, then switching back restored `2.5` from the snapshot | One manual parameter sample |
| Custom preset | `SAVE CURRENT` produced `MY PRESET · 16-bit / 32000Hz`; reload retained the custom preset and settings | Browser localStorage origin only |
| Reload and URL | Reload retained Advanced mode, `g=2.5`, `16-bit/32000Hz`; an explicit hash `b=8&r=12000&g=3&m=0&q=1` won over saved values | Same local browser origin |
| Malformed URL | `NaN`, `Infinity`, nonnumeric and out-of-range fields did not enter control values; UI remained finite | URL remained visibly malformed because invalid hash fields are ignored rather than rewritten |
| Undo/redo | Body-context `Control+Z` restored grit `2.5 → 1`; `Control+Y` restored `1 → 2.5`; hash and AX values changed accordingly | Shortcuts intentionally do not intercept native input editing focus |
| Responsive widths | At `320`, `390`, `600`, `860`, `1180` and `1440` CSS pixels, document/body scroll width stayed within the viewport. Real control boxes were measured; mode/process targets were 40–50px high on narrow layouts and 48px on desktop. | Not physical-device or full layout certification |
| Filters and zoom | Advanced filters were checked collapsed and expanded through the accessible disclosure. A temporary CDP page scale of `2` with a 720px CSS viewport kept document scroll width at 712px and the main layout in one column. All temporary viewport/scale overrides were reset. | This is a browser page-scale/layout check, not a complete WCAG 200% audit |
| Reference visual | Live [Figarist Ukrainian home](https://figarist.github.io/uk/) was opened and compared. OGCruncher uses the observed warm background, white cards, dark navy text/panels, green accents, rounded surfaces and restrained monospace utility text | Visual judgement, not pixel identity |
| Console diagnostics | Browser diagnostic log returned no console entries after the successful demo preview/export flow | One browser/session and success path |

## Not verified

- Human listening quality, perceptual loudness, and MP3/OGG round-trip decoding.
- Sample-level preview/export equality in a real browser and true-peak behavior at a
  hardware output device.
- Firefox/Safari, physical mobile, 200% zoom, reduced-motion behavior in all surfaces,
  full screen-reader walkthrough, contrast certification and long-name hostile fixture.
- Codec-failure injection, cancellation/retry, multi-file partial success and resident-
  memory profiling across repeated large batches.
- Live service-worker update while preview or processing is active, offline cold launch,
  cache completeness and deployed revision parity.
- Neutralino executable launch, desktop asset-base correctness, GitHub Pages workflow,
  security scanning, ZIP export and target-specific codec compatibility.

## Evidence policy

“Verified” in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) is scoped to the
evidence named there. It never upgrades a static or synthetic check into live runtime,
codec, listening, cross-browser, accessibility-certification or deployment evidence.

## Dated release-readiness follow-up — 2026-09-13

This historical record remains unchanged as first-phase evidence. The independent
release-readiness pass, including phase-2 rechecks, the additional processing-control
fix, 390px production runtime, raw codec checks, and current residual limits, is recorded
in [docs/release-readiness/STATUS.md](../release-readiness/STATUS.md) and
[docs/release-readiness/VERIFICATION.md](../release-readiness/VERIFICATION.md).
