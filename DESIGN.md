# OGCruncher architecture and design contract

Updated 2026-11-20. The baseline audit was recorded at
`fc0209cd27a3ffa7562955bac22cf272eb740f39`.

## Module ownership

| Module | Current responsibility |
| --- | --- |
| `js/main.js` | UI import, manual SW registration and non-destructive update notification |
| `js/ui.js` | DOM bindings, parameters, presets, keyboard, modal and layout |
| `js/state.js` | Mutable state, localStorage, URL hash, undo/redo |
| `js/queue.js` | Queue, metadata analysis, decode/offline filtering, generation-safe worker reuse/orchestration, ZIP/individual downloads |
| `js/dsp.js` | Offline DSP, normalization, metrics and filter helpers |
| `js/dsp.worker.js` | Bounded worker DSP, Lanczos-3 MP3 resampling, and independent OGG/WAV/MP3 encoders |
| `js/dsp-core.js` | Pure offline DSP, finite-sample sanitization, linked normalization and WAV/PCM helpers |
| `js/preview.js` | Offline parity preview graph, A/B, spectrum and measured metrics |
| `js/sw-update.js` | State-aware Service Worker update banner controller |
| `js/utils.js` | Logging, badges, toasts and formatting |
| `js/i18n.js` | `t()` runtime strings for localized pages (English source strings are keys), plural/Hz helpers |
| `scripts/build-locales.cjs` + `scripts/locales/uk.cjs` | Generate the committed `uk/index.html` from `index.html`; `--check` fails on drift |

## Current audio paths

Export: file -> decode -> OfflineAudioContext speed/resampling/channel mix ->
HPF/LPF/bass -> optional linked silence trim (-48 dBFS, 2 ms pad) -> worker-compatible
per-channel DSP with finite-sample sanitization -> optional micro-fades (1 ms in, 4 ms out)
-> linked normalization to the -1 or 0 dBFS ceiling -> the selected OGG, WAV and/or MP3
encoders (with Lanczos-3 resampling for unsupported MP3 sample rates). `processChannels`
returns the (possibly shorter) channel set; callers must use the return value. Preview
trims its dry branch with the same `silenceTrimRange` window, so A/B loops stay in phase. Preview uses the same offline render path for the selected output rate,
speed, channel mode, filters and DSP, then routes dry/wet buffers through a monitor
crossfade. Source replacement and A/B branch selection are separate gain concerns:
both source buffers remain available, branch gains select the monitor with a short
ramp, and analysers observe each source before branch muting. Live updates use a
latest-request-wins revision and bounded in-flight rendering. The product preview
intentionally does not use a separate real-time worklet path, avoiding dry/wet drift.

The contract is deterministic for a fixed seed, keeps channels linked when normalizing,
does not add gain when Crush is OFF, and measures the actual dry/wet render buffers.
No zero-latency or whole-pipeline zero-allocation guarantee is justified: decoding,
rendering, copies and encoders allocate memory.

## Formats and state

WAV stores 8-bit unsigned PCM for effect depths 1–8 and 16-bit signed PCM for 9–16.
Effect depth is not storage depth. MP3 requests 128 kbps (LAME MPEG-2.5 clamps low rates
`<= 12000 Hz` to `~64 kbps`, reflected in queue estimates and the codec line); OGG uses
quality 0. Only the selected formats are encoded; an empty selection is impossible in the
UI, rejected by `sanitizeParams`, and falls back to WAV in the queue and the worker. With
KEEP NAMES the output stem is the input stem; collisions still get `-2`, `-3`.

State precedence is validated defaults < saved state < explicit URL values. Hash parsing
is side-effect free; startup synchronizes once, then persists. Undo/redo restores every
field without applying Simple presets over Advanced values, and mode snapshots include
speed. Each batch freezes one validated snapshot before any async work. `previewLoop` and
`previewVolume` are persisted listening preferences: they are not written to share links and
are excluded from undo/redo snapshots.

## Localization

English is `/OGCruncher/` (`index.html`), Ukrainian is `/OGCruncher/uk/` (generated
`uk/index.html`). Both pages carry reciprocal `hreflang` (`en`, `uk`, `x-default`), their own
canonical/`og:url`, and the shared `#person` / `#website` JSON-LD entities; the Ukrainian
graph has its own `#app`, `#breadcrumb` and `#faq` ids under `/uk/`. The sitemap lists both
URLs with `xhtml:link` alternates. Vite builds both as inputs; the Workbox navigation
fallback (`index.html`) is denylisted for `/uk/` so the service worker never answers a
Ukrainian navigation with the English page. `verify-build.cjs` asserts all of this.

## Figarist visual contract

The reference is [Figarist Ukrainian home](https://sivochka.com/uk/), integrated under
`https://sivochka.com/OGCruncher/`. Current application CSS shares its main tokens:

| Token | Value |
| --- | --- |
| Background / card / warm card | `#f2f0eb` / `#ffffff` / `#faf8f4` |
| Primary / secondary / muted text | `#1a1a2e` / `#4a4a6a` / `#68688c` |
| Green / green text | `#b5e853` / `#3f6518` |
| Blue / blue text / pink / plum | `#a2c2e1` / `#35628a` / `#f5c2cc` / `#6b3fa0` |
| Cyan / yellow / persimmon | `#4ecdc4` / `#f7e04a` / `#e8603c` |
| Radius / padding / gap | `20px` / `24px` / `20px` |
| Body type | System UI, Segoe UI, Noto Sans, sans-serif |

Use warm surfaces, restrained shadows, dark primary actions and readable descriptive
copy. Monospace belongs in measurements/logs. Preserve the tool's workflow rather than
copying the portfolio landing-page structure. The former purple/Outfit description
is superseded by this observed system.

## Accessibility and runtime constraints

Keep labels, visible focus, reduced motion and live status messages. Aim for comfortable
44px touch areas; audit WCAG separately rather than claiming certification. Require a
true one-column mobile grid and shortcuts that respect focus and dialogs. See U01–U03.

Vite emits hashed assets, a classic worker and generated SW. Encoder scripts and `.mem`
are in the inspected precache (`workbox.globIgnores` excludes icons/SVG already referenced
by the manifest/HTML to avoid duplicate precache entries). A configured 512MiB heap is not
measured resident RAM; profile constrained devices. Worker reuse across completed batches,
cancellation/failure isolation, metadata cleanup, safe SW updates and one manifest/registration
owner are implemented, but constrained-device and deployed runtime behavior still require
separate validation. Desktop/web base paths also require separate validation.
