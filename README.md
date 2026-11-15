# OGCruncher

A retro 8-bit/16-bit audio bit-crusher, chiptune processor, and batch game SFX optimizer by **Ihor Sivochka (Figarist)**.
Audio files are processed locally in the browser via Web Audio API and exported as Ogg Vorbis, PCM WAV, and MP3.
This is a creative processor, not currently a transparent audio converter.

- **🌐 Live Web App:** [sivochka.com/OGCruncher/](https://sivochka.com/OGCruncher/)
- **📖 Engineering Guide:** [OGCruncher Game Audio Bit-Crusher (EN)](https://sivochka.com/blog/ogcruncher-game-audio-bitcrusher/) · [Українською (UK)](https://sivochka.com/uk/blog/ogcruncher-game-audio-bitcrusher/)
- **👨‍🏫 Author & 1-on-1 Tutoring:** [sivochka.com](https://sivochka.com/) · [sivochka.com/tutoring/](https://sivochka.com/tutoring/)

## Documentation

- [Production deployment and verification, 2026-09-13](docs/deployment/2026-09-13.md).
- [Online audit](docs/online-audit/2026-09-13/README.md).
- [Online audit fixes](docs/remediation/online-audit-fixes/STATUS.md).
- [Professional audit, 2026-09-10](docs/audit/2026-09-10/README.md).
- [Detailed bug register](docs/audit/2026-09-10/BUGS.md).
- [Audio and formulas](docs/audit/2026-09-10/AUDIO_AND_FORMULAS.md).
- [UI/UX and visual alignment](docs/audit/2026-09-10/UI_UX.md).
- [Verification record](docs/audit/2026-09-10/VERIFICATION.md).
- [Remediation status](docs/remediation/IMPLEMENTATION_STATUS.md).
- [Post-remediation verification](docs/remediation/VERIFICATION.md).
- [Phase-2 remediation status](docs/remediation/phase-2/STATUS.md).
- [Phase-2 verification](docs/remediation/phase-2/VERIFICATION.md).
- [Release-readiness status](docs/release-readiness/STATUS.md).
- [Release-readiness verification](docs/release-readiness/VERIFICATION.md).
- [Current numeric results](docs/remediation/numeric-results-2026-09-10.json).
- [Architecture and design contract](DESIGN.md).
- [Prioritized improvements](PROPOSALS.md).

## Current capabilities and limitations

Simple quality tiers and Advanced controls cover effect depth, rate, saturation,
noise, speed/pitch, HPF, LPF and bass EQ. Preview and export use the same offline
render contract for filters, channel selection and DSP; A/B switching and spectrum
display remain available. Batch processing is sequential, freezes one validated
snapshot, and encodes OGG/WAV/MP3 independently in a reused classic Web Worker (terminated
only on cancellation or fatal error). Non-finite (`NaN`/`Infinity`) and empty inputs are
sanitized/guarded, and MP3 resampling uses windowed Lanczos-3 interpolation. Cancellation
is logical and generation-safe across read/decode/render/worker phases; partial format
output is retained and labelled. Each result has an individual download with a per-format
size estimate (including MPEG-2.5 `64 kbps` clamping at `<= 12000 Hz`), alongside batch
`DOWNLOAD ALL (.ZIP)` (`ogcruncher_batch.zip`) and `CLEAR RESULTS` actions. Drag-to-DAW is
experimental. PWA output and a Neutralino configuration are included.

Reload, share-link parsing, undo/redo, Simple/Advanced snapshots, filename rendering,
PCM WAV packing, channel-linked normalization, quiet-signal handling, batch locking,
resource cleanup and explicit, state-aware service-worker updates are implemented.
Existing cached-client adoption still needs migration verification.
See the [deployment evidence](docs/deployment/2026-09-13.md),
[remediation status](docs/remediation/IMPLEMENTATION_STATUS.md)
and [verification record](docs/remediation/VERIFICATION.md) for exact historical evidence levels.

Known limitations: lossy codec round-trips, human listening quality, full keyboard and
screen-reader conformance, cross-browser/mobile-device behavior, browser codec-failure
injection, cancel/retry profiling and deployed/Neutralino runtime behavior are not fully
verified. The phase-2 worker/core result is behavioral parity coverage; `js/dsp-core.js`
and `js/dsp.worker.js` still duplicate core DSP functions.
Waveform seeking, LUFS metering and full Ukrainian localization are not implemented.
Queue files and output blobs remain in memory and disappear on reload.

## Development

Use a Node version satisfying the installed Vite package's `engines` requirement.
Install from the lockfile:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite with the `/OGCruncher/` base path.

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 5187 --strictPort
node scripts/regression.cjs
node scripts/audit-numerics.cjs
```

`npm test` runs the original and phase-2 deterministic regression assertions. The audit script keeps the
historical measurements separate from current-source measurements; it does not listen
to browser audio or perform lossy codec round-trips.

## Deployment and privacy

`vite.config.js` targets GitHub Pages under `/OGCruncher/`. The GitHub workflow builds
Pages and Neutralino artifacts. It was not dispatched during this remediation. Desktop
root `/index.html` serving still needs reconciliation with the web asset base, followed
by an executable launch test; `neu build` success alone is insufficient.

Inspected application code does not upload input audio. Assets/demo use HTTP requests;
this is not a complete network privacy certification. Parameters and layout use
localStorage; queue files and output blobs stay in memory and disappear on reload.
Service-worker updates are surfaced without an automatic reload; the offline badge is
not proof that every required resource is cached.

## Author & Ecosystem (`Ihor Sivochka / Figarist`)

Created by **Ihor Sivochka (Ігор Сівочка / Figarist)** — Certified Unity Developer, Computer Science Mentor, and EdTech Toolmaker.

- 🌐 **Main Hub & Blog:** [sivochka.com](https://sivochka.com/) · [OGCruncher Engineering Guide](https://sivochka.com/blog/ogcruncher-game-audio-bitcrusher/)
- 🎓 **1-on-1 Programming Mentoring (Unity/C#, Python, Scratch, CS):** [sivochka.com/tutoring/](https://sivochka.com/tutoring/) · [Українською](https://sivochka.com/uk/tutoring/)
- ⚒️ **3D Club Studio (`3D Кузня Чудес`):** [sivochka.com/3d-club-studio/](https://sivochka.com/3d-club-studio/) ([Repo](https://github.com/Figarist/3d-club-studio)) — offline browser 3D studio & support-free STL generator
- 🧱 **LEGO WeDo 2.0 Catalog:** [sivochka.com/lego-catalog/](https://sivochka.com/lego-catalog/) ([Repo](https://github.com/Figarist/lego-catalog)) — 597 robotics PDF building instructions PWA
- 🤫 **Quiet Class (`Тихий Клас`):** [sivochka.com/bouncy/](https://sivochka.com/bouncy/) ([Repo](https://github.com/Figarist/bouncy)) — gamified classroom noise meter & star tracker
- ⌚ **Wrist & Pocket Studio:** [wristandpocket.dev](https://wristandpocket.dev/) · [WearView 3D](https://wristandpocket.dev/wearview/)
- 📺 **YouTube:** [@proVR_ua](https://www.youtube.com/@proVR_ua) · 💬 **Telegram:** [@proVR_ua](https://t.me/proVR_ua) · 💻 **GitHub:** [@Figarist](https://github.com/Figarist)
