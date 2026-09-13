# Audio and output audit

## Contract exercised

The primary live run used the bundled `demo.mp3` through the real UI: load →
metadata-backed estimate → process → result links → download. Additional
synthetic WAV runs exercised mono/stereo, 1-bit/8 kHz and 16-bit/48 kHz
boundaries. All uploads were synthetic or the public bundled demo.

### Source

Local inspection of the public demo asset:

- `demo.mp3`: 4,197,146 bytes, MP3, 44,100 Hz, 2 channels,
  131.160813 s (`ffprobe`).

### Default live output

The live default run logged `Decoded 2ch → 1ch | 48000Hz → 32000Hz` and
produced the following downloaded files. Hashes are SHA-256 of the downloaded
production outputs; they matched the browser Blob hashes from the same run.

| Output | Bytes | SHA-256 | Local inspection |
|---|---:|---|---|
| `demo_crunched_16bit_32000hz.ogg` | 664,955 | `FE0E4C19B7B1225C8444D3E16CE635DC9762AF45A3DF9373475566F7EC67F66E` | OGG/Vorbis, 32,000 Hz, 1 ch, 131.160813 s |
| `demo_crunched_16bit_32000hz.wav` | 8,394,336 | `F9E70B35D0E9D7F4F88DB38D2FEDDDB9CB5F8C6339DDE503B95EC66DD4AA5BE0` | WAV PCM s16le, 32,000 Hz, 1 ch, 16-bit, 131.160813 s |
| `demo_crunched_16bit_32000hz.mp3` | 2,099,520 | `F1E342AFB5C53640EB6F1C1F4E0EC8D7C8E8F0F56864461AB41BE499B192B50D` | MP3, 32,000 Hz, 1 ch, 131.220000 s |

The MP3 duration differs by approximately 59 ms from the decoded source, which
is compatible with codec delay/padding. This audit does not certify exact
lossy-duration or sample alignment.

The WAV header was also parsed directly in the browser: RIFF/WAVE format 1,
channels 1, sample rate 32,000, byte rate 64,000, block align 2, bits 16,
data size 8,394,292, file size 8,394,336, and no padding byte.

## Parameter boundaries

The 1-bit/8 kHz run produced a live WAV Blob of 16,044 bytes with a valid
8-bit/8,000 Hz/1-channel header. The 16-bit/48 kHz run produced a live WAV Blob
of 192,044 bytes with a valid 16-bit/48,000 Hz/1-channel header. The stereo run
produced a 384,044-byte WAV with 2 channels, 48,000 Hz, and 16 bits.

These are container and runtime measurements, not a subjective quality grade.

## Preview and metrics

For a one-second synthetic 440 Hz sine, the UI displayed:

- RMS dry `-11.0 dB` → wet `-3.2 dB`;
- peak dry `-8.0 dB` → wet `0.0 dB`;
- duration `1.00s` → `1.00s`.

Preview started from the displayed selected file, showed an explicit Stop
state, and the A/B button changed its accessible description between original
and crunched labels. The test did not capture a device playback signal or
prove that A/B toggles the exact intended PCM buffers, so that part remains
Not verified.

## Safety and limitations

- No private/personal audio was used.
- Browser decode, Blob metadata, WAV parsing, `ffprobe`, and hashes were used;
  no human listening or cross-browser/device matrix was run.
- No clipping defect is declared from decoder peak behavior alone. One browser
  decode observation included codec/decoder overshoot; that needs a dedicated
  multi-decoder signal study.
- No full FLAC/AIFF/M4A/AAC input matrix, long-corpus stress, memory profile,
  lossy round-trip comparison, or Worklet/sample-level parity audit was done.

## Artifact location

Downloaded outputs and screenshots are retained outside the repo in
`D:\OGCruncher-online-audit-artifacts\2026-09-13`. See [EVIDENCE.md](EVIDENCE.md).
