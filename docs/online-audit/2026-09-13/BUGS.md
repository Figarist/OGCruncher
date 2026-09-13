# Finding register

## Confirmed actionable findings

### ONLINE-001 — live Pages revision lags the local remediation line

Severity: P1 · category: deployment/release integrity  
Status: Confirmed  
Evidence: **Static source review**, **Online UI observed**, **Inference**

Observed facts:

- live HTML/assets were served as the `70a63f7fff3e81d294612eb6870e2d3b0faf4b91`
  deployment;
- GitHub Actions run `34505605897` / workflow run `93` and Pages deployment
  `6376910130` both identify that SHA and completed successfully;
- local `HEAD` is `84da67a`, with `d22d7df` and `84da67a` ahead of
  `origin/master` (`70a63f7`);
- live bundles are `index-DeJNM5kz.js`, `index-DmnEQgsA.css`, and
  `dsp.worker-1-VnHSTp.js`, while local HEAD builds different hashes.

Impact: users do not receive the latest local remediation and its verification
evidence. This is not a Pages outage; it is a release/provenance mismatch.

Acceptance: after an authorized deployment, re-fetch the live HTML and verify
the intended commit/build hashes, then repeat the invalid-metadata, update,
duplicate-input, and main audio smoke tests.

### ONLINE-002 — waiting service worker can force an in-memory state boundary

Severity: P1 · category: PWA/update/data safety  
Status: Confirmed risk path; automatic loss during an active batch not verified  
Evidence: **Online UI observed**, **Browser fault injection**, **Static source review**

Reproduction in the isolated in-app browser profile:

1. Open the live app while the current client is controlled by the OGCruncher
   service worker.
2. Inspect the registration: an active worker and a waiting worker were both
   present for the OGCruncher scope; the controlled fetch returned the old shell.
3. The client displayed the old shell and an update/reload toast path.
4. Controlled `SKIP_WAITING` plus reload moved the client to the current Cloud
   Dancer shell.

The audit also observed that a manual reload clears the synthetic in-memory
queue/results. No automatic reload was allowed to interrupt a live batch, so
actual background-update loss was not claimed.

Impact: queue `File` objects, preview state, and result Blob URLs are not
durable across reload. A prompt-style update must not make the user infer that
the current state is preserved.

Acceptance: on update detection, either defer activation/reload while queue,
preview, processing, or results are active, or persist/recover the relevant
state. Add a browser test for update arrival during each active state.

### ONLINE-003 — invalid metadata leaves the estimate card in ANALYZING

Severity: P2 · category: state/trust  
Status: Confirmed  
Evidence: **Online UI observed**, **Static source review**

Reproduction:

1. Add `empty-file.wav` (0 B) and `corrupt-audio.wav` (21 B).
2. Wait at least five seconds: the card remains `ANALYZING…` with dashes.
3. Process the batch. Both files finish as `FAILED`, and the batch summary is
   `2 attempted, 0 succeeded, 2 failed`.
4. The estimate card still says `ANALYZING…`, not unavailable/error.

The same stale state was observed after a mixed valid/invalid five-file batch.
The local current source contains an explicit metadata error branch that would
render `UNAVAILABLE`, while `git show 70a63f7:js/queue.js` lacks that branch.

Impact: users cannot tell whether the estimate is still working or impossible.

Acceptance: failed metadata must transition to `UNAVAILABLE` (or equivalent)
within the same render generation, remain correct after processing, and clear
on Remove/Clear. A mixed batch must show valid estimates plus a clear partial
indicator if that is the chosen product contract.

### ONLINE-004 — distinct same-name/same-size inputs are silently dropped

Severity: P1 · category: input correctness  
Status: Confirmed  
Evidence: **Online UI observed**, **Local reproduction**, **Static source review**

Fixture facts:

- `same-a/same.wav` and `same-b/same.wav` are both 96,044 bytes;
- SHA-256 hashes differ: `E4DF7C1075940A8D01285505C96E080A5ADAE2C819AE7F16A0E9338E6A228110`
  vs `B5D8AA804CD8F782688BB5F23DE254F833712E500D58C633669DADD28D3AE6D0`;
- their filesystem timestamps were made distinct before the retest;
- selecting both live still created only one `same.wav` queue item.

Static source identifies the mechanism in `js/queue.js`: the dedupe key is
`${file.name}::${file.size}`. The same collision also makes the output-name
contract ambiguous for genuinely duplicate basenames.

Impact: one user-selected file can disappear without a warning. This is silent
omission, not merely a cosmetic filename collision.

Acceptance: use a stable per-file ID or content identity that permits distinct
files with the same basename/size; show a visible duplicate warning only when
the same file is intentionally re-added; make output filenames unique within a
batch and preserve the original basename context where possible.

### DEPLOY-001 — live HTML contains the manifest link twice

Severity: P3 · category: deployment quality  
Status: Confirmed  
Evidence: **Online UI observed**, **Static source review**

The live HTML contains two identical
`<link rel="manifest" href="/OGCruncher/manifest.webmanifest">` elements.
The local source has one explicit manifest link, so this should be checked in
the generated build/plugin injection path.

Impact: low immediate user impact, but duplicate head metadata complicates
diagnostics and PWA correctness checks.

Acceptance: emit one manifest link in the deployed document and add a build
assertion for unique manifest/meta ownership.

## Risks and not verified

### NOT-VERIFIED-001 — Copy Link clipboard payload

The live button showed `🔗 Link copied to clipboard`, but the isolated browser
clipboard bridge returned an empty string. This may be a bridge limitation; it
is not enough evidence for a product defect. Verify manually in a normal browser
profile by reading the clipboard and opening the copied URL in a fresh tab.

### NOT-VERIFIED-002 — accepted codec matrix

WAV, MP3, OGG, and synthetic invalid WAV were exercised. FLAC, AIFF/AIF, M4A,
and AAC were not independently decoded in this audit. The UI lists WAV, MP3,
FLAC, OGG, and AIFF.

### NOT-VERIFIED-003 — human listening and cross-decoder quality

No subjective listening, frequency-response certification, browser/device
matrix, lossy round-trip quality study, AudioWorklet parity, memory profiling,
or long-corpus stress test was performed. The browser/runtime and downloaded
container checks in [AUDIO.md](AUDIO.md) are narrower claims.

### NOT-VERIFIED-004 — automatic update loss during an active job

The stale/waiting worker condition and the reload state boundary were observed;
the audit did not cause an automatic production update to reload the page while
a batch was running.
