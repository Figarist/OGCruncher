# Verification record

2026-09-10 · clean initial `master` · `fc0209cd27a3ffa7562955bac22cf272eb740f39`.
Application source was not changed during the baseline audit. Post-remediation evidence
is recorded separately in [docs/remediation/VERIFICATION.md](../../remediation/VERIFICATION.md).

## Executed checks

| Check | Outcome / boundary |
| --- | --- |
| Source/config/original documentation review | Completed; anchors in BUGS.md |
| `npm run build` | Exit 0; Vite 8.0.13; 11 modules; PWA 15 entries / 5338.28 KiB |
| Production preview | `npm run preview -- --host 127.0.0.1 --port 5187 --strictPort` |
| First service-worker activation | Page replaced before onboarding interaction; no queued audio yet |
| Advanced NES -> reload | Reset 4bit/12k/grit1.2 -> 16bit/32k/grit1 reproduced |
| Demo load | Success; original UI size 4.00 MB |
| Demo HIGH encode | 2ch -> mono; decode context 48000Hz -> output 32000Hz; DONE |
| Result links | OGG 651.0 KB; WAV 8.01 MB; MP3 2.00 MB displayed |
| Estimate for same encode | WAV 10.67 MB / +0%; compressed 819.8 KB / -80% |
| Worklet preview | Engine ready / Preview started (AudioWorklet mode) logged |
| A/B and Stop | DRY label toggled; preview stopped; no listening claim |
| Browser console sample | No returned errors/warnings after demo export and preview start |
| Mobile 390x844 | 14px-wide Crush/Normalize buttons; screenshot and DOM geometry |
| 320px document width | scrollWidth=320; not proof of child-layout correctness |
| Reference comparison | Live screenshot/computed CSS at figarist.github.io/uk |
| Numeric probes | Executed; results in AUDIO_AND_FORMULAS.md |
| Documentation validation | 8 Markdown documents; all local links resolve; 24 issue headings |
| Whitespace validation | `git diff --check` exit 0 |

Port 5173 was occupied when a dev server was attempted; it was not terminated or
reconfigured. The audit used a separate production server on 5187. UI interactions
used the audit browser origin. No input audio was uploaded externally.

## Probe limitations

`scripts/audit-numerics.cjs` runs checked-in source in Node VMs, stubs worker imports
and the Worklet host, and seeds randomness. It executes actual process/WAV functions,
not browser resampling, device output or codecs. Exit 0 means measurements completed,
not that app correctness passed. Observations intentionally reproduce current bugs.
The captured machine-readable output is [numeric-results.json](numeric-results.json).

## Not verified

- Human listening, MP3/OGG round-trip decoding and perceptual quality.
- Real-browser Worklet/export waveform equality and true peak.
- Firefox/Safari, physical mobile, low-memory and long-file profiling.
- Codec-failure injection, corrupted input in browser, cancel/retry.
- Full keyboard/screen-reader/contrast conformance and 200% zoom.
- Offline cold launch/export, SW update while audio work is active.
- Neutralino executable launch on any OS; direct drag to an actual DAW.
- Deployed OGCruncher revision parity, deployment health and vulnerability scan.
- ZIP export (not implemented) or target-platform codec compatibility.

## Recommended regression matrix

Use silence/DC/impulse/unit sine/quiet sine/asymmetric stereo/music; 8k/22.05k/48k;
effect depths 1/8/12/16; mono/stereo; speeds 0.5/1/2; every filter endpoint. Start
noise/dither off for deterministic comparison, then seeded random variants.
Inspect headers and re-decode output for rate/channels/duration; allow specified lossy
codec delay/padding, not sample equality. Record numeric tolerances. Test restoration
and failure behavior separately from audio.

## Additional static release risks

- Neutralino serves root `/index.html`, Vite emits `/OGCruncher/` asset URLs: desktop
  base and launch need verification, not a claim of demonstrated executable failure.
- HTML links `manifest.json` and plugin injects `manifest.webmanifest`; manual SW
  registration coexists with generated registerSW. Consolidate ownership.
- Worker requests 512MiB heap. Resident RAM/recovery need profiling; configuration
  is not a measurement.
- Workflow uses `npm install`; prefer `npm ci`, a verified runtime and separate
  desktop/web configuration. No CI workflow was dispatched.

## Sources

- [Figarist reference](https://figarist.github.io/uk/): observed visuals and computed CSS.
- [Web Audio](https://www.w3.org/TR/webaudio/): graph/context/analyser semantics;
  opened page identifies itself as a 1.1 working draft.
- [Vite PWA updates](https://vite-pwa-org.netlify.app/guide/auto-update.html): official
  documentation retrieved through Context7; automatic reload can lose unsaved state.
- [W3C target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html):
  criterion interpretation, not app certification.
