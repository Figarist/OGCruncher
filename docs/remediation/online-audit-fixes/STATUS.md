# Online audit remediation status

> Subsequent update: the remediation commits were pushed and deployed on
> 2026-09-13. See [production verification](../../deployment/2026-09-13.md) for
> current finding dispositions and the remaining cached-client migration caveat.
> The local-only scope statements below describe the original remediation task.

2026-09-13 · local remediation in `D:\GitHub\OGCruncher`.
The verified source baseline was `master` at `84da67a`, with local `master` two
commits ahead of `origin/master` at `70a63f7`. No push, deployment, release,
history rewrite, or production change was performed.
The implementation commit is `2a0bff5`; this document records its local evidence
without implying that it has been deployed.

## Decision

The actionable online-audit findings are fixed in the local source line where a
local fix is in scope. `ONLINE-001` remains a deployment-lag finding by design:
the public Pages revision cannot be changed in this task. Production remains
unverified against these local fixes until an authorized deployment and a fresh
post-deployment audit.

## Finding status

| ID | Local actuality | Cause | Local fix | Tests and evidence | Result | Deployment status | Residual limitation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ONLINE-001 | Confirmed from the dated online audit: public Pages was `70a63f7`; local baseline was `84da67a`. | Public deployment lagged the local remediation line. | No local workaround attempted; the local remediation line is kept separate from production provenance. | Baseline Git inspection; historical online deployment evidence. | Open until post-deployment verification. | Deployment pending — push/deploy not authorized in this task. | Live SHA and post-deployment smoke remain unverified. |
| ONLINE-002 | The prior local `controllerchange` reload was already removed; the remaining waiting-worker UX had no single safe activation owner. | Reload/activation could cross an in-memory queue, preview, processing, or result boundary. | Added `js/sw-update.js`: waiting workers are announced at page open and on update; activation is explicit, `SKIP_WAITING` is sent only after the queue, preview, processing, and results are clear, and reload follows only the user-approved activation. | D-VM update-controller regression covers waiting worker plus active batch, preview, queue, and result-blocked states; rebuilt browser registration/cache-ready smoke. | Fixed locally. | Deployment pending — public production update behavior is not closed. | A real post-deployment waiting-worker arrival during active work was not verified. |
| ONLINE-003 | Explicit metadata error cleanup was already present locally before this task; mixed and all-invalid display boundaries needed current proof. | Failed metadata did not reach a visible terminal state in the deployed revision. | Kept pending/success/error states, generation-safe Remove/Clear, and `AudioContext` `finally` cleanup; mixed queues now retain valid estimates with `PARTIAL`, while all-invalid queues show `UNAVAILABLE`. | D-VM metadata regression; rebuilt browser mixed batch (`PARTIAL`, one valid result, two failed) and all-invalid batch (`UNAVAILABLE`, two failed). | Fixed locally. | Deployment pending — production remains on the audited revision until authorized release. | Browser engine/device decode matrix and long-corpus profiling remain unverified. |
| ONLINE-004 | Confirmed locally: name+size dedupe was still present in `js/queue.js`. | Basename and byte size were incorrectly treated as content identity. | Separate File objects are retained as independent ID-keyed entries; only an exact same `File` object is rejected with a visible duplicate notice. Batch outputs receive collision-safe `-2`, `-3`, ... suffixes. | D-VM identity/output tests; two external fixtures with equal 96,044-byte size and different SHA-256; browser queued both and produced `same_crunched_16bit_32000hz` and `same-2_crunched_16bit_32000hz`. | Fixed locally. | Deployment pending. | Re-selecting a file may create a new File object and is intentionally retained; no guessed content hash or `lastModified` identity is used. |
| DEPLOY-001 | Confirmed in the generated local build: source HTML and VitePWA both owned the manifest link. | Explicit source link was duplicated by VitePWA injection. | Removed the explicit source link; VitePWA is the sole manifest-link owner. Added `scripts/verify-build.cjs` to assert one base-path link, manifest icons, and SW output. | `npm run build`; generated `dist/index.html` has one `/OGCruncher/manifest.webmanifest`; local browser DOM reports one link. | Fixed locally. | Deployment pending — public HTML still needs a fresh check. | Generated asset MIME and Pages cache behavior require post-deployment verification. |

## Scope retained

The Figarist visual system, GitHub Pages base path, existing DSP/WAV contract,
preview/export behavior, no-implicit-delete queue policy, and prior release-readiness
fixes were preserved. No full-file hashing, new codec, redesign, or public release
action was added.

See [VERIFICATION.md](VERIFICATION.md) for exact commands, browser observations,
evidence classes, and explicit Not verified boundaries.
