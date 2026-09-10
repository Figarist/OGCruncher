# Bug register

Baseline/evidence definitions: [overview](README.md). Locations refer to audited source;
function names are stable anchors. Issues remain open. Related symptoms are grouped.

## S01 — Startup destroys saved settings and incoming share parameters

**P1 · Browser reproduced + static** · `js/ui.js:1128–1210`, `js/state.js:35–77`.

Reproduce: Advanced -> NES -> reload. URL changes from `b=4&r=12000&g=1.2` to
`b=16&r=32000&g=1`; filters/dither reset too. Startup calls `sync*`, which writes
localStorage/hash, before reading either. It then forces Simple/HIGH.

Impact: reopening/sharing does not reproduce sound. Fix: validate saved/hash values
before mutations and hydrate once with persistence paused. Accept: reload preserves
parameters; fresh shared URL wins over saved settings; no hash retains saved values.

## S02 — Snapshot restore overwrites Advanced bit/rate with Simple quality

**P1 · Static** · `js/ui.js:320–441`, `js/state.js:_restore`.

Reproduce: Advanced values unlike HIGH -> change another control -> undo. Snapshots
contain `simpleQuality`; `applyParamsToUI` restores bits/rate then unconditionally
calls `syncSimpleQuality`, replacing them. Fix: separate UI synchronization from
preset application. Accept: all fields round-trip through undo/redo in both modes,
including a 4-bit/12k Advanced snapshot, without applying unrelated presets.

## S03 — Custom presets and mode snapshots omit speed

**P2 · Static** · `js/ui.js:687–701,958–973,1192–1205`.

Save at 0.5x, change to 2x, load custom preset: its object has no `playbackRate`.
Advanced snapshots omit it too; entering Simple hides speed without resetting it.
Fix: shared complete schema and explicit mode semantics. Accept: custom preset
restores speed; Simple visibly indicates or resets inherited speed.

## S04 — Non-finite parameters are accepted

**P2 · Numerically reproduced + static** · `js/state.js:parseHash`, `js/ui.js:applyParamsToUI`.

Parser input `#b=abc&r=NaN` yields NaN for both. Min/max are not finite checks;
saved values also bypass validation. S01 masks many initial-link cases; hashchange
and future hydration fixes still expose this. Fix: finite/type/range/integer checks.
Accept: malformed values preserve a valid state and return a useful message.

## S05 — Filenames are interpolated into HTML

**P1 · Static security sink; exploit not executed** · `js/queue.js:201–210,408–417`.

Safe reproduction: synthetic File named `<b>audit</b>.wav` is treated as markup in
queue/results. Such names can originate outside Windows or in generated File objects.
Impact: markup injection; active markup could execute in app origin. Fix: textContent
for file-derived names. Accept: brackets/quotes render literally and create no nodes.
Windows filename restrictions are not sufficient protection for browser input.

## S06 — Batch parameters are neither fully locked nor snapshotted

**P1 · Static; enabled controls observed** · `js/ui.js:981–1015`, `js/queue.js:286–398`.

Simple slider/mode buttons remain enabled while processing. CSS pointer blocking
does not block keyboard; hashchange is another mutation path. Processing reads state
across awaits and names results from current values. Fix: freeze a validated batch
snapshot and disable all editing paths. Accept: keyboard/hash edits cannot change
audio or filenames of an active multi-file job.

## S07 — Repeated batches retain obsolete output blobs

**P2 · Static** · `js/queue.js:45–48,242,430–435`.

Process repeatedly without Clear: old result DOM disappears, but object URLs and
registered File objects remain. Fix: release old result resources before replacement
and at teardown. Accept: registry contains only current results and old URLs are
revoked. Browser resident-memory growth was not profiled.

## S08 — Partial failure/progress and encoder startup need recovery

**P2 · Static + risk** · `js/queue.js:251–281,336–377`, `js/dsp.worker.js:9–30,137`.

File index uses successful count; after a failure the next file repeats the index.
Any success gives green DONE without a batch failure summary. OGG readiness has no
rejection/timeout; a runtime that never initializes can leave the job waiting. No
cancel action exists. Fix: attempted/succeeded/failed counters, codec isolation,
timeout and worker cancellation. Accept: corrupt+valid files report 1 success/1 failure
with accurate positions; blocked encoder exits actionably. Timeout not induced.

## S09 — Service-worker takeover reloads in-memory work

**P1 · Browser reload observed; data-loss scenario static/risk** · `js/main.js:13–54`, `vite.config.js`.

First SW activation replaced the page/dismissed onboarding before interaction.
Controller changes reload unconditionally; queue and results exist only in memory.
Fix: single SW owner, update prompt, idle-safe activation. Accept: updates during
preview/batch preserve work until chosen reload; readiness badge reflects actual
cache state. Official [PWA guidance](https://vite-pwa-org.netlify.app/guide/auto-update.html)
also describes automatic-reload data loss.

## A01 — Preview/export filter order and bypass differ

**P1 · Static graph proof** · `js/preview.js:193–362`, `js/queue.js:308–326`, `js/dsp.js:buildFilterChain`.

Reproduce with bass/LPF plus grit and compare preview/export. Export filters before
nonlinear DSP, both previews after it; these operations do not commute. Preview
always inserts HPF/LPF even at OFF endpoints; export skips them. Live bass clamps
to 12dB, UI/export allow 15dB. Fix identical order/bypass/ranges. Accept deterministic
vectors match within stated tolerance including LPF OFF and +15dB. Audibility untested.

## A02 — Worklet normalization can exceed full scale

**P1 · Numerically reproduced** · `public/dsp-processor.js:process`, `js/preview.js:229`.

Worklet computes `tanh(s*grit)/tanh(grit)`; dither/pre-gain can make |s|>1.
1-bit+dither+normalize sine probe gives **1.265802** peak before live filters/monitor
gain. Export instead measures final peak. Fix shared gain/headroom contract and meters;
an undocumented AGC is not a parity fix. Accept declared peak bounds on silence,
impulses and low-bit dither. This is overshoot, not proof of audible device clipping.

## A03 — Per-channel normalization destroys stereo balance

**P1 · Numerically reproduced** · `js/dsp.js:processDSP`, `js/dsp.worker.js:260–267`.

R/L sine amplitude 0.1 becomes **1.0**, even without optional post-normalization.
Worklet uses global pre-gain, adding inconsistency. Fix linked gain across channels;
expose any intentional independent mode. Accept asymmetric stereo retains balance
with neutral/linked settings; silent channels stay silent with noise/dither disabled.

## A04 — Normalize OFF/Crush OFF do not provide a neutral path

**P1 · Numerically reproduced** · `js/dsp.js:24–95`, worker duplicate.

Pre-normalization and tanh always run. Peak 0.00001 becomes **0.761552** at grit 1,
crush/normalize off. Silence plus noise 0.00001 reaches **0.761553**, since noise is
added before normalization. Fix separate input gain, output normalization and bypass;
define silence threshold/noise dBFS. Accept neutral mode preserves level and small
noise stays small on silence. Intentional crush behavior must be explicitly described.

## A05 — WAV8 midpoint and odd-byte padding

**P2 · Numerically reproduced** · `js/dsp.worker.js:157–199`.

Zero maps to byte 127 by truncating 127.5 rather than PCM midpoint 128. Three mono
8-bit samples yield 47 bytes without RIFF word padding. Fix rounded/clamped mapping
and padding; RIFF length includes pad, data length excludes it. Accept silence 128,
endpoint vectors and odd mono files in independent readers. Not all decoders reject
the existing files; compatibility was not measured.

## A06 — “Original” is already resampled, sped up and channel-converted

**P2 · Static** · `js/preview.js:149–217,767–782`.

Decode uses target-rate preview context, potentially discarding high-frequency source
information. Both branches apply speed/channel mode, while original duration label
uses source duration. Fix preserve native-rate source or label “dry at output settings”.
Accept source comparison retains original bandwidth/channels/speed or clearly states
the transforms and reports the duration actually played.

## A07 — Metrics and spectrum do not reliably represent output

**P2 · Static** · `js/preview.js:725–781,809–828`.

Wet Worklet metrics run offline DSP on middle-one-second channel 0; dry metrics use
all channels/full duration. Fallback startup measures filtered dry; later updates
can use processed buffers. Selection uses `workletReady` instead of `useWorklet`.
Bars advance by `2.5*width/binCount+1`, drawing many bins off-canvas. Fix actual meters
or explicit estimates with equal windows; map bins to visible width/Nyquist. Accept
known sine RMS/peak/frequency and right-channel transients at every supported rate.

## A08 — Preview replacement overlaps without crossfade

**P2 · Static risk** · `js/preview.js:632–646`.

New sources start full-gain while old sources continue 100ms through the same path.
Saved offset omits render time. Fix separate old/new gains, aligned complementary
fades and disconnect stopped nodes. Accept no doubling/timeline jump in deterministic
tone/transient updates. Audible clicks and stress behavior remain unmeasured.

## A09 — Preview lifecycle/control semantics are inconsistent

**P2 · Static** · `js/preview.js:389–457`, `js/ui.js:syncGrit/syncNoise/syncHpf/syncLpf`.

Start failure calls Stop, invalidating the session, so finally skips re-enabling Preview.
Stop resets A/B boolean but not label; restart can label wet as DRY. Live Update OFF
still sends some worklet/filter changes. Fix centralized lifecycle reset and one update
policy. Accept corrupt-input retry works, restart label matches audio, and OFF behaves
consistently or clearly documents its limited scope.

## F01 — WAV estimate uses effect bits and guessed metadata

**P1 · Numeric + browser evidence** · `js/queue.js:123–142`.

12-bit/22.05k/10s mono estimates **330794** bytes; WAV is **441044**. Duration uses
extension/assumed bitrate, ignores speed and assumes stereo means two output channels
even for mono input. Demo HIGH estimates 10.67 MB versus actual 8.01 MB. Fix decoded
metadata, actual rate/channels, speed and container depth. Accept exact WAV byte count
matches encoding, including rounding/padding.

## F02 — One compressed estimate conflates OGG/MP3

**P2 · Browser + static** · `js/queue.js:144–158`.

Demo estimate **819.8 KB**; actual OGG **651.0 KB**, MP3 **2.00 MB**. OGG heuristic
cannot represent MP3 requested bitrate or arbitrary content. Fix separate estimates,
assumptions/ranges and actual size after encoding. Accept neither format is represented
as the other's size, and actual results supersede estimates.

## F03 — Savings hides growth and makes unsupported promises

**P2 · Browser reproduced** · `js/queue.js:162–196`, `js/ui.js:200–217`.

4.00 MB -> estimated 10.67 MB WAV shows **+0%**. Global badge chooses best codec;
tier text promises fixed savings regardless of input. Fix signed per-format changes
and remove unqualified percentages. Accept +100% on doubling, 0% when equal and
reduction only when measured/estimated output is smaller; use selected codec.

## U01 — Mobile Advanced grid collapses an implicit column

**P1 · Browser reproduced** · `index.html:432`, `style.css:554–555`.

At 390px Crush/Normalize buttons measure **14px** wide, 48/55px high; bit/rate labels
collide. Inline speed `grid-column: span 2` overrides mobile span 1, creating an
implicit column. Document width alone misses it. Fix remove inline layout override.
Accept readable controls at 320/390/600px, both modes, expanded filters and 200% zoom.

## U02 — Shortcuts override native buttons and dialog keys

**P2 · Static** · `js/ui.js:1056–1107`.

With files loaded, focus an ordinary button/dialog and press Enter/Space: global
handler ignores interactive focus, defaultPrevented and modifier combinations. It can
start Crunch/Preview instead of native activation; Ctrl+C can toggle A/B. Fix scoped
shortcuts. Accept keyboard About/Browse/switch/link use never starts a job incidentally.

## U03 — Help, selection state and resizers need accessible alternatives

**P2 · Static + observed DOM** · `index.html`, `js/ui.js:initResizers`, `style.css:381–383`.

Resizers are mouse-only; mode selection has CSS but no selected/pressed semantics.
Hover tooltip labels generally cannot receive focus; tier pips are non-button text.
Fix semantic state, keyboard/touch help and keyboard resizing or layout presets.
Accept keyboard/screen-reader walkthrough exposes all actions/state/help. Existing
labels, focus outlines, live log and reduced-motion CSS are positive foundations;
no complete accessibility certification is claimed.
