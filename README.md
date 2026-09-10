# OGCruncher

A browser audio bit-crusher and lo-fi converter by Ihor Sivochka (Figarist).
Audio files are processed locally and exported as Ogg Vorbis, PCM WAV and MP3.
This is a creative processor, not currently a transparent audio converter.

[Live website](https://figarist.github.io/OGCruncher/) · [Visual reference](https://figarist.github.io/uk/)

## Documentation

- [Professional audit, 2026-09-10](docs/audit/2026-09-10/README.md).
- [Detailed bug register](docs/audit/2026-09-10/BUGS.md).
- [Audio and formulas](docs/audit/2026-09-10/AUDIO_AND_FORMULAS.md).
- [UI/UX and visual alignment](docs/audit/2026-09-10/UI_UX.md).
- [Verification record](docs/audit/2026-09-10/VERIFICATION.md).
- [Remediation status](docs/remediation/IMPLEMENTATION_STATUS.md).
- [Post-remediation verification](docs/remediation/VERIFICATION.md).
- [Current numeric results](docs/remediation/numeric-results-2026-09-10.json).
- [Architecture and design contract](DESIGN.md).
- [Prioritized improvements](PROPOSALS.md).

## Current capabilities and limitations

Simple quality tiers and Advanced controls cover effect depth, rate, saturation,
noise, speed/pitch, HPF, LPF and bass EQ. Preview and export use the same offline
render contract for filters, channel selection and DSP; A/B switching and spectrum
display remain available. Batch processing is sequential, freezes one validated
snapshot, and encodes OGG/WAV/MP3 independently in a classic Web Worker. Each result
has an individual download with an honest per-format estimate. Drag-to-DAW is
experimental. PWA output and a Neutralino configuration are included.

Reload, share-link parsing, undo/redo, Simple/Advanced snapshots, filename rendering,
PCM WAV packing, channel-linked normalization, quiet-signal handling, batch locking,
resource cleanup and prompt service-worker updates are implemented in the current
working tree. See the [remediation status](docs/remediation/IMPLEMENTATION_STATUS.md)
and [verification record](docs/remediation/VERIFICATION.md) for exact evidence levels.

Known limitations: lossy codec round-trips, human listening quality, full keyboard and
screen-reader conformance, cross-browser/mobile-device behavior, failure injection,
cancel/retry profiling and deployed/Neutralino runtime behavior are not fully verified.
ZIP export, waveform seeking, LUFS metering and full Ukrainian localization are not
implemented. Queue files and output blobs remain in memory and disappear on reload.

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

`npm test` runs the deterministic regression assertions. The audit script keeps the
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
