# OGCruncher architecture and design contract

Updated 2026-09-10. The baseline audit was recorded at
`fc0209cd27a3ffa7562955bac22cf272eb740f39`; current implementation evidence is in
the [remediation status](docs/remediation/IMPLEMENTATION_STATUS.md) and
[verification record](docs/remediation/VERIFICATION.md).

## Module ownership

| Module | Current responsibility |
| --- | --- |
| `js/main.js` | UI import, manual SW registration and non-destructive update notification |
| `js/ui.js` | DOM bindings, parameters, presets, keyboard, modal and layout |
| `js/state.js` | Mutable state, localStorage, URL hash, undo/redo |
| `js/queue.js` | Queue, decode, offline filtering, worker orchestration, downloads |
| `js/dsp.js` | Offline DSP, normalization, metrics and filter helpers |
| `js/dsp.worker.js` | Bounded worker DSP and independent OGG/WAV/MP3 encoders |
| `public/dsp-processor.js` | Bounded AudioWorklet compatibility processor |
| `js/dsp-processor.js` | Source copy of the compatibility processor |
| `js/dsp-core.js` | Pure offline DSP, linked normalization and WAV/PCM helpers |
| `js/preview.js` | Offline parity preview graph, A/B, spectrum and measured metrics |
| `js/encoders.js` | Deprecated reference; not imported by the application |
| `js/utils.js` | Logging, badges, toasts and formatting |

## Current audio paths

Export: file -> decode -> OfflineAudioContext speed/resampling/channel mix ->
HPF/LPF/bass -> worker-compatible per-channel DSP with linked normalization -> OGG,
WAV and MP3. Preview uses the same offline render path for the selected output rate,
speed, channel mode, filters and DSP, then routes dry/wet buffers through a monitor
crossfade. The AudioWorklet files remain bounded compatibility code for future low-
latency use; the product preview intentionally does not use a divergent live path.

The contract is deterministic for a fixed seed, keeps channels linked when normalizing,
does not add gain when Crush is OFF, and measures the actual dry/wet render buffers.
No zero-latency or whole-pipeline zero-allocation guarantee is justified: decoding,
rendering, copies and encoders allocate memory.

## Formats and state

WAV stores 8-bit unsigned PCM for effect depths 1–8 and 16-bit signed PCM for 9–16.
Effect depth is not storage depth. MP3 requests 128 kbps; OGG uses quality 0. All
three codecs are currently attempted per file. See [formulas](docs/audit/2026-09-10/AUDIO_AND_FORMULAS.md).

State precedence is validated defaults < saved state < explicit URL values. Hash parsing
is side-effect free; startup synchronizes once, then persists. Undo/redo restores every
field without applying Simple presets over Advanced values, and mode snapshots include
speed. Each batch freezes one validated snapshot before any async work.

## Figarist visual contract

The reference is [Figarist Ukrainian home](https://figarist.github.io/uk/), observed
live on 2026-09-10. Current application CSS already shares its main tokens:

| Token | Value |
| --- | --- |
| Background / card / warm card | `#f2f0eb` / `#ffffff` / `#faf8f4` |
| Primary / secondary / muted text | `#1a1a2e` / `#4a4a6a` / `#68688c` |
| Green / green text | `#b5e853` / `#3f6518` |
| Blue / pink / plum | `#a2c2e1` / `#f5c2cc` / `#6b3fa0` |
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
are in the inspected precache. A configured 512MiB heap is not measured resident RAM;
profile constrained devices. Worker cancellation/failure isolation, safe SW updates and
one manifest/registration owner are implemented, but constrained-device and deployed
runtime behavior still require separate validation. Desktop/web base paths also require
separate validation.
