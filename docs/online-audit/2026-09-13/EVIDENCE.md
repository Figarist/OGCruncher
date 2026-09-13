# Evidence ledger

## Session and targets

- Date: 2026-09-13, Europe/Kyiv.
- Live app: <https://figarist.github.io/OGCruncher/>.
- Live reference: <https://figarist.github.io/uk/>.
- Browser: isolated Codex in-app Chromium profile, tab 2 for OGCruncher and
  tab 3 for the Figarist reference.
- Repository: `D:\GitHub\OGCruncher`.
- External artifacts: `D:\OGCruncher-online-audit-artifacts\2026-09-13`.

## Evidence classes

| Class | Meaning in this report |
|---|---|
| Online UI observed | Live DOM, accessibility tree, visible status, or screenshot |
| Online browser audio/runtime measured | Live browser Blob/header/runtime/timing measurement |
| Downloaded production output inspected | Downloaded live result inspected locally |
| Browser fault injection | Controlled isolated SW, offline, or viewport scenario |
| Local reproduction | Synthetic fixture or local command/script |
| Static source review | Repository or deployed-source inspection |
| Inference | Bounded conclusion derived from more than one class |
| Not verified | Not established by this audit |

## Deployment evidence

- Live root: 200 HTML, ETag `W/"6aa2e267-7ae4"`, last modified
  `Thu, 10 Sep 2026 17:01:27 GMT`.
- Deployed SHA: `70a63f7fff3e81d294612eb6870e2d3b0faf4b91`.
- Actions: run `34505605897`, number `93`, completed success.
- Pages deployment: `6376910130`, `github-pages`, same SHA.
- Local: `HEAD 84da67a`, branch `master`, `origin/master 70a63f7`, two commits
  ahead.

## Browser evidence highlights

- Default demo: queue 4.00 MB; decode `2ch → 1ch | 48000Hz → 32000Hz`; batch
  `1 attempted, 1 succeeded, 0 failed`.
- Mixed batch: three valid synthetic WAVs completed; zero-byte/21-byte files
  failed independently; summary `5 attempted, 3 succeeded, 2 failed`.
- Invalid-only: summary `2 attempted, 0 succeeded, 2 failed`, while estimate
  remained `ANALYZING…`.
- Duplicate test: two different same-size/same-name files, different SHA-256,
  yielded one queue item.
- Long-name test: 236-character Unicode filename was 15.7 KB, processed, and
  produced output. A first attempt showing 0 B came from the test file-picker’s
  long full path; it was not used as app evidence.
- Cancel/retry: cancel showed `CANCELLED`; retry later completed successfully.
- Offline: cached reload, demo load, and demo processing all succeeded.
- Browser warning/error log query returned `[]`. This is negative console
  evidence only; it does not prove audio correctness.

## Downloaded output evidence

These files were copied from the user Downloads folder to the external audit
artifact directory; pre-existing Downloads files were not modified or removed:

- `demo_crunched_16bit_32000hz.ogg` — 664,955 bytes, SHA-256
  `FE0E4C19B7B1225C8444D3E16CE635DC9762AF45A3DF9373475566F7EC67F66E`;
- `demo_crunched_16bit_32000hz.wav` — 8,394,336 bytes, SHA-256
  `F9E70B35D0E9D7F4F88DB38D2FEDDDB9CB5F8C6339DDE503B95EC66DD4AA5BE0`;
- `demo_crunched_16bit_32000hz.mp3` — 2,099,520 bytes, SHA-256
  `F1E342AFB5C53640EB6F1C1F4E0EC8D7C8E8F0F56864461AB41BE499B192B50D`.

## Screenshots

Saved outside the repository:

- `D:\OGCruncher-online-audit-artifacts\2026-09-13\live-1280x720.png`
- `D:\OGCruncher-online-audit-artifacts\2026-09-13\live-390x844.png`
- `D:\OGCruncher-online-audit-artifacts\2026-09-13\live-320x800.png`
- `D:\OGCruncher-online-audit-artifacts\2026-09-13\figarist-uk-reference.png`

## Cleanup and safety

- No temporary local server was started.
- Network emulation was reset to online.
- Device metrics override was cleared and a normal browser reload was checked.
- The waiting service worker was activated only in the isolated audit profile to
  inspect the update path.
- Synthetic fixtures, output copies, and screenshots remain outside tracked
  source as audit artifacts.
