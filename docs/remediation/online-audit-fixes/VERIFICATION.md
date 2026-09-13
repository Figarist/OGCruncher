# Online audit remediation verification

2026-09-13 · local-only verification from `master` at the pre-remediation
baseline `84da67a`; public `origin/master` was `70a63f7`. The local production
preview used the rebuilt `dist` output at `http://127.0.0.1:5197/OGCruncher/`.
The implementation under verification is commit `2a0bff5`; the documentation
commit is intentionally separate.

## Evidence classes

- **D-NODE** — deterministic Node assertions against production source modules.
- **D-VM** — controlled VM tests with fake browser/audio/worker hosts.
- **BROWSER-LOCAL** — rebuilt Vite production preview in isolated Chromium.
- **STATIC** — source, generated HTML/manifest/SW, Git, or filesystem inspection.
- **NUMERIC** — current numeric characterization; not a substitute for the regression gate.
- **Not verified** — deliberately outside this local run.

## Required gates

| Check | Result | Evidence class |
| --- | --- | --- |
| `npm test` | Pass: original regression, phase-2 regression, metadata terminal-state checks, queue identity/output checks, and SW update safety checks. | D-NODE + D-VM |
| `npm run build` | Pass: Vite 8.0.13 build plus `scripts/verify-build.cjs`; exactly one generated manifest link, base path is correct, both manifest icons exist, and `sw.js` exists. | STATIC |
| `node scripts/audit-numerics.cjs` | Pass: current linked ratio, neutral bypass level, PCM8 midpoint/padding and state sanitization remain characterized. | NUMERIC |
| `git diff --check` | Pass. | STATIC |
| Downloaded output | `C:\Users\igors\Downloads\demo_crunched_16bit_32000hz.wav` exists after the browser result-link download. | BROWSER-LOCAL + STATIC |

## Scenario matrix

| Scenario | Expected | Observation | Evidence class |
| --- | --- | --- | --- |
| Waiting SW at page open | Persistent notice; no activation or reload without explicit action. | D-VM `announceAvailable()` exposes a notice and no worker message. | D-VM |
| Waiting SW with active batch | Activation disabled; processing is not interrupted. | D-VM blocked activation with `processing=true`. The browser smoke also showed `PROCESSING` with Preview/A/B disabled. | D-VM + BROWSER-LOCAL |
| Waiting SW with active preview | Activation disabled. | D-VM blocked activation while Preview has the `playing` state. | D-VM |
| Waiting SW with queued files | Activation disabled. | D-VM blocked activation while `state.files.size > 0`. | D-VM |
| Waiting SW with ready results | Activation disabled even when processing is idle. | D-VM blocked activation while the results area contained output. | D-VM |
| Explicit safe update activation | Send `SKIP_WAITING`; reload only after `controllerchange`; no second reload. | D-VM passed; no automatic reload path remains in `js/main.js`. | D-VM + STATIC |
| Happy path | Queue → Preview → A/B → Process → results → download. | Demo preview showed finite RMS/peak/duration, A/B changed to `ORIGINAL (DRY · OUTPUT SETTINGS)`, batch completed `1 full`, OGG/WAV/MP3 links appeared, and WAV download was observed on disk. | BROWSER-LOCAL + STATIC |
| Mixed valid/invalid metadata | Valid estimates remain visible with a clear partial state; invalid files terminate. | `PARTIAL`; valid sine estimated `62.5 KB` WAV; empty and corrupt files later became `FAILED`; batch `1 full, 2 failed`. | BROWSER-LOCAL |
| All-invalid metadata | No `ANALYZING…` after decode attempts; terminal unavailable state. | `UNAVAILABLE`; batch `0 full, 2 failed`. | BROWSER-LOCAL |
| Remove during metadata decode | Removed ID cannot be updated by a late callback; context closes in `finally`. | D-VM removed pending entry, resolved its deferred decode, and confirmed no late metadata plus all contexts closed. | D-VM |
| Clear during metadata decode | Queue/results/metadata clear and late callback is ignored. | D-VM Clear left metadata empty and estimate hidden. | D-VM |
| Same name and size, different content | Both entries queue and both output results remain addressable. | `same-a/same.wav` and `same-b/same.wav` were each 96,044 bytes; SHA-256 differed (`E4DF7C1075940A8D01285505C96E080A5ADAE2C819AE7F16A0E9338E6A228110` vs `B5D8AA804CD8F782688BB5F23DE254F833712E500D58C633669DADD28D3AE6D0`). Browser queue count was 2 and output names were `same_crunched_16bit_32000hz` and `same-2_crunched_16bit_32000hz`; batch completed `2 full`. | D-VM + BROWSER-LOCAL + STATIC |
| Exact same File object re-added | No silent second entry; visible rule. | D-VM rejected only the same object and captured the exact-duplicate notice. Different File objects with the same name/size remain separate. | D-VM |
| Unicode/long names | Accepted input and bounded safe output name. | Existing filename contract regression remained green; the same output allocator is used for all formats and collision suffixes. | D-VM |
| Cancel → retry | Cancelled batch must not emit late output; retry starts cleanly. | Browser immediate cancel showed `CANCELLED`, then retry completed `1 full`; D-VM covers read/decode/render/worker cancellation. | BROWSER-LOCAL + D-VM |
| Manifest/build | One manifest link, correct base path, manifest icons, worker URLs intact. | `dist/index.html` has one link; manifest contains two `images/logo.svg` icons; generated `sw.js` contains the standard `SKIP_WAITING` handler; browser DOM has one link. | STATIC + BROWSER-LOCAL |
| Responsive 390px | No horizontal overflow and controls stay within the document. | Temporary CDP metrics produced client width `382`, document width/scroll width `382`; panels and controls stayed inside, Preview/Process width `322`. The temporary override was reset. | BROWSER-LOCAL |
| Desktop | No horizontal overflow and three-panel geometry remains intact. | Client/scroll width `1272`; desktop panels and controls remained inside the document. | BROWSER-LOCAL |

## Numeric characterization

`node scripts/audit-numerics.cjs` retained the current observations:

- linked asymmetric stereo ratio `0.09999999627470976`;
- Crush OFF quiet peak `0.000009999999747378752`;
- PCM8 zero midpoint `128`, 48-byte odd-padded file, 3-byte data chunk;
- invalid state fields ignored.

These are numeric probes, not human listening, codec-quality, or device evidence.

## Deployment and remaining boundaries

The public audit identified deployed SHA `70a63f7`; the local remediation line was
`84da67a` before these changes and is now represented by new local commits. The
following remain **Not verified** until an authorized deployment:

- public HTML/build SHA and generated manifest uniqueness;
- live waiting-worker arrival on the remediated revision;
- update arrival during active queue, preview, processing, and ready results;
- post-deployment duplicate-input and invalid-metadata browser reruns.

Cross-browser/device coverage, human listening, full accessibility certification,
large-file memory profiling, and lossy perceptual quality remain outside this task.

The historical audit is preserved at
[docs/online-audit/2026-09-13/README.md](../../online-audit/2026-09-13/README.md).
# Subsequent deployment evidence

The remediation was pushed and deployed on 2026-09-13. See
[production verification](../../deployment/2026-09-13.md) for fresh gates,
online smoke results and the old-cache migration limitation. The original local
verification record below is retained as historical evidence.
