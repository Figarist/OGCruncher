# OGCruncher

A retro 8-bit/16-bit audio bit-crusher, chiptune processor, and batch game SFX optimizer by **Ihor Sivochka (Figarist)**.
Audio files are processed locally in the browser via Web Audio API and exported as Ogg Vorbis, PCM WAV, and MP3.
This is a creative processor, not currently a transparent audio converter.

- **🌐 Live Web App:** [sivochka.com/OGCruncher/](https://sivochka.com/OGCruncher/) · Ukrainian: [sivochka.com/OGCruncher/uk/](https://sivochka.com/OGCruncher/uk/)
- **👨‍🏫 Author:** [sivochka.com](https://sivochka.com/)

## Documentation

- [Architecture and design contract](DESIGN.md).

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

Export controls sit above PREVIEW/CRUNCH: OGG/WAV/MP3 toggles (disabled formats are
skipped in the worker; at least one stays on), **FOR SCRATCH** (WAV only, because
Scratch 3.0 imports WAV/MP3 but not OGG and caps sounds at 10 MB; the log warns about
larger WAV/MP3 files when OGG is off) and **KEEP NAMES** (no `_crunched_<bits>bit_<rate>hz`
suffix, so Unity `.meta` / Godot `.import` references survive; batch collisions still get
`-2`, `-3`). The codec line under CRUNCH shows what will be written.

Normalization is linked peak normalization to a **-1 dBFS** ceiling by default (headroom for
lossy codecs) or 0 dBFS. Share links without the `nc` parameter, including links made before
this option existed, now use -1 dBFS. **TRIM SILENCE** removes leading/trailing audio below
-48 dBFS with a 2 ms pad, then applies a 1 ms fade-in (inside the pad, so attacks keep their
first peak) and a 4 ms fade-out. Preview has a LOOP toggle (`L`); loop and monitor volume are
listening preferences, so they are not part of share links or undo history.

Reload, share-link parsing, undo/redo, Simple/Advanced snapshots, filename rendering,
PCM WAV packing, channel-linked normalization, quiet-signal handling, batch locking,
resource cleanup and explicit, state-aware service-worker updates are implemented.
Existing cached-client adoption still needs migration verification.

Known limitations: lossy codec round-trips, human listening quality, full keyboard and
screen-reader conformance, cross-browser/mobile-device behavior, browser codec-failure
injection, cancel/retry profiling and deployed/Neutralino runtime behavior are not fully
verified. The phase-2 worker/core result is behavioral parity coverage; `js/dsp-core.js`
and `js/dsp.worker.js` still duplicate core DSP functions.
Waveform seeking and LUFS metering are not implemented.

## Ukrainian page

`/uk/` is a full Ukrainian version for Ukrainian game developers and kids who make Scratch
games. `uk/index.html` is generated from `index.html` by `scripts/build-locales.cjs` using
the exact English → Ukrainian pairs, metadata and JSON-LD in `scripts/locales/uk.cjs`; it is
committed so Vite builds it as a second entry and the service worker precaches it. Runtime
strings written by JavaScript go through `t()` in `js/i18n.js` (English source strings are
the keys, so the English page and the Node tests are unchanged). Most developer log lines
stay in English on purpose.

After editing `index.html`, run `npm run locales`. `npm test` and `npm run build` fail when
`uk/index.html` is stale or when an English string in `scripts/locales/uk.cjs` no longer
exists in `index.html`.
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
npm run locales      # regenerate uk/index.html after editing index.html
npm run build
npm run preview -- --host 127.0.0.1 --port 5187 --strictPort
node scripts/regression.cjs
node scripts/audit-numerics.cjs
```

`npm test` checks that `uk/index.html` is current, then runs the original and phase-2
deterministic regression assertions (including worker/core parity for trim, the -1 dBFS
ceiling and format selection). The audit script keeps the
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

## Author (`Ihor Sivochka / Figarist`)

Created by **Ihor Sivochka (Ігор Сівочка / Figarist)**.

- 🌐 **Hub:** [sivochka.com](https://sivochka.com/)
- 💻 **GitHub:** [Figarist/OGCruncher](https://github.com/Figarist/OGCruncher)
