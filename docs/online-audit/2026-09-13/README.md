# Independent online production audit — OGCruncher

Audit date: 2026-09-13 · timezone: Europe/Kyiv  
Target: <https://figarist.github.io/OGCruncher/>  
Reference: <https://figarist.github.io/uk/>  
Repository: `D:\GitHub\OGCruncher`

## Verdict

The public application completes the main happy path in the isolated Chromium
audit profile: demo load, preview, A/B state switch, WAV/OGG/MP3 export, stereo
and mono output, low/high parameter boundaries, partial batches, cancellation,
retry, and offline cached processing all worked.

It is not a clean release candidate yet. Four actionable findings remain:

- `ONLINE-001` P1 — the deployed Pages revision is `70a63f7`, while the local
  repository is two commits ahead (`84da67a`); current local remediation is not
  public.
- `ONLINE-002` P1 — a controlled client can remain on the old shell while a new
  service worker waits; update/reload behavior can discard in-memory queue and
  Blob output state. Automatic loss during an active batch was not forced.
- `ONLINE-003` P2 — metadata estimates remain `ANALYZING…` for mixed invalid and
  all-invalid queues, including after the batch has ended with failures.
- `ONLINE-004` P1 — two different files with the same basename and byte size are
  silently deduplicated to one queue item, even when their content hashes differ.

One low-severity deployment quality issue is recorded separately:
`DEPLOY-001`, a duplicate manifest link in the live HTML.

No P0 outage was demonstrated. The conclusion is based on the tested browser,
synthetic fixtures, the downloaded demo outputs, and repository/deployment
evidence; it is not a claim of cross-browser, device, human-listening, or full
accessibility certification.

## Files

- [AUDIT.md](AUDIT.md) — scope, method, risk model, and executive assessment.
- [BUGS.md](BUGS.md) — precise finding register with reproduction and acceptance.
- [TEST_MATRIX.md](TEST_MATRIX.md) — scenario-by-scenario result matrix.
- [AUDIO.md](AUDIO.md) — browser runtime, encoded outputs, containers, and limits.
- [UI_UX.md](UI_UX.md) — visual comparison, responsive behavior, and UX findings.
- [DEPLOYMENT_PWA.md](DEPLOYMENT_PWA.md) — provenance, asset MIME, service worker,
  cache, offline, and update behavior.
- [EVIDENCE.md](EVIDENCE.md) — evidence classes, timestamps, hashes, and artifact
  locations.
- [SUMMARY.json](SUMMARY.json) — machine-readable summary.
- [Online remediation status](../../remediation/online-audit-fixes/STATUS.md) —
  dated local status for the remaining findings.
- [Online remediation verification](../../remediation/online-audit-fixes/VERIFICATION.md) —
  local regression, build, and browser evidence with deployment limits.

## Evidence language

The report uses these exact classes:

- **Online UI observed** — live DOM/AX/screenshot behavior.
- **Online browser audio/runtime measured** — live browser blobs, WAV headers,
  runtime metrics, or browser timing.
- **Downloaded production output inspected** — files downloaded from live result
  links and inspected locally with `ffprobe`/hashes.
- **Browser fault injection** — controlled service-worker, offline, viewport, or
  other isolated-profile scenario.
- **Local reproduction** — synthetic/local scripts or fixtures.
- **Static source review** — repository or deployed-source characterization.
- **Inference** — a bounded conclusion derived from evidence.
- **Not verified** — deliberately untested or not provable from this audit.

No production source, GitHub setting, commit, push, deploy, or release was
changed. The only repository addition is the untracked audit fixture generator
used to create synthetic test files; audit documents are also new uncommitted
artifacts.
