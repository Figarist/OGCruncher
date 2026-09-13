# Audit record

## Scope

This was an independent production audit of the public OGCruncher web app,
including a comparison with the live Figarist Ukrainian homepage and a
read-only review of the local repository and GitHub Pages provenance.

In scope:

- live UI, modes, presets, sliders, filters, preview, A/B, queue, clear/remove;
- synthetic WAV input, demo MP3, invalid files, long Unicode names, duplicates;
- mono/stereo and boundary sample-rate/bit-depth export;
- partial failure, cancel, retry, reload, share-link state, and malformed hash;
- downloaded production artifacts and container metadata;
- service-worker update/cache behavior, offline reload and offline processing;
- responsive geometry at 320, 390, 600, 860, 1180 and 1440 CSS pixels;
- live visual comparison with `https://figarist.github.io/uk/`;
- static source review and local regression checks.

Out of scope by instruction:

- private or personal audio;
- production code fixes, commits, pushes, deployment, or GitHub settings;
- load testing, destructive security tests, active XSS attempts, or global
  browser settings;
- claims about human listening, all browsers/devices, CPU/memory limits,
  accessibility conformance, or automatic data loss unless directly observed.

## Risk model

P1 means a silent workflow/correctness or release-integrity risk that can cause
users to omit input, lose in-memory work, or consume a materially stale build.
P2 means a bounded defect that misstates state or reduces trust but has a clear
workaround. P3 means quality/debt with limited immediate user impact. These are
not CVSS scores.

## Audit sequence

1. Establish live deployment provenance before treating repository behavior as
   production behavior.
2. Capture a clean desktop shell and accessibility tree; exercise the main UI.
3. Load demo and synthetic files; inspect browser-generated result Blobs and
   download the production outputs.
4. Exercise failures and recovery: invalid-only, mixed batches, duplicate
   identities, long names, cancel, retry, reload, and malformed state.
5. Exercise mobile widths and controlled offline/update scenarios in the
   isolated in-app browser profile.
6. Review source, deployment configuration, and local regression evidence.
7. Record only evidence-backed findings, with unverified limits explicit.

## Executive assessment

### Strengths observed

- The main export contract is coherent in the tested browser: OGG/WAV/MP3
  result links have useful MIME types, stable download names, and valid WAV
  headers.
- Output settings are frozen per batch: logs showed the selected rate, channel
  count, and successful completion for default, boundary, and stereo runs.
- Per-file errors do not abort a mixed batch; `3 succeeded / 2 failed` and
  `0 succeeded / 2 failed` both completed with explicit log messages.
- Cancel produced `CANCELLED`, kept the queue, and a subsequent retry completed.
- Offline reload, demo loading, and demo processing succeeded after the app had
  been cached by the service worker.
- Responsive tests found no horizontal overflow or clipped filter controls in
  the tested widths. The AX tree exposed labeled sliders, switches, mode
  controls, results, and an accessible About dialog with Escape dismissal.

### Main release risks

The deployment is behind the local remediation line. The public HTML/assets
were tied to `70a63f7`; local `master` is at `84da67a` with `d22d7df` and
`84da67a` ahead. This explains why the live invalid-metadata behavior still
resembles the pre-fix path found in the deployed revision.

The waiting service-worker state is the most important operational risk. In the
isolated client, the active controller served the old shell while a new worker
waited. The client displayed the older branding/state panel until controlled
activation and reload. Because the queue and generated results are in-memory,
an update-triggered reload is a state boundary that needs an explicit guard or
recovery contract.

The two user-facing correctness defects are silent duplicate suppression and a
stale `ANALYZING…` estimate state after invalid input. Both are reproducible
without private data and have simple acceptance criteria in [BUGS.md](BUGS.md).

## Local checks

`npm test` passed:

```text
OGCruncher regression checks passed: DSP neutral/linked, PCM WAV, and state validation.
OGCruncher phase-2 regression checks passed.
```

This is local/static evidence only. It does not upgrade live behavior to
Verified and does not prove cross-browser or device behavior.
