# Audio integrity and formula review

See [A01–A09/F01–F03](BUGS.md). Creative distortion itself is not a defect;
undisclosed preview/export differences and inaccurate controls are.

## Quantization and dither

```text
halfLevels = 2^(bits - 1)
delta = 1 / halfLevels
dither = (U1 - U2) * delta
q(x) = round((x + dither) / delta) * delta
```

Current TPDF placement immediately before rounding and step relationship are correct
for this quantizer. Noise shaping is different; the UI's “NOISE SHAPING” label is
inaccurate. Smoothing/tanh subsequently move output off the quantizer grid. At bits=1,
endpoints include -1, 0 and +1 even without dither: not a strict two-code PCM format.
Describe effect depth or implement a bounded codebook if exact code count matters.

`sign(x)*abs(x)^1.15` reduces sub-unity magnitudes: 0.5 becomes about 0.4506. It does
not boost low-level detail. Two-tap smoothing has `H(z)=0.5*(1+z^-1)` and magnitude
`abs(cos(pi*f/fs))`. It attenuates highs but cannot undo aliases already created by
nonlinear processing. Oversampling/filtering before decimation is a separate feature.

## Gain contract

Offline processing normalizes channels independently. Linked gain should use one peak
across channels. Separate input gain, creative saturation, optional output normalization
and monitor volume. Normalize OFF must not silently imply near-full-scale pre-gain.
Preserve silence and define intentional noise level in dBFS. Consider headroom for
lossy export; sample-peak normalization guarantees neither true peak nor loudness.

Worklet DC blocker `y[n]=x[n]-x[n-1]+0.999*y[n-1]` differs from full-buffer mean removal.
Approximate cutoff `fc ≈ (1-0.999)*fs/(2*pi)` is 1.27Hz at 8k and 7.64Hz at 48k,
not fixed 5Hz. Specify one contract; a streaming processor cannot reproduce every
whole-file normalization operation exactly without prior analysis.

## Correct container accounting

For the intended basic PCM layout:

```text
outputFrames = ceil(sourceDuration / playbackRate * actualOutputRate)
outputChannels = forceMono ? 1 : min(sourceChannels, 2)
containerBits = effectBits <= 8 ? 8 : 16
blockAlign = outputChannels * containerBits / 8
dataBytes = outputFrames * blockAlign
padding = dataBytes % 2
fileBytes = 44 + dataBytes + padding
RIFF chunk size = fileBytes - 8
data chunk size = dataBytes
```

Current writer omits odd-byte padding. Rate fallback must propagate actual rate to
frames, names and estimates. A 12-bit effect in 16-bit WAV does not save 25% against
a 16-bit effect in that same layout.

MP3 nominal payload estimate is `seconds * requestedBitrate / 8`, plus frame/header
overhead and encoder constraints; inspect actual output. OGG quality is not fixed
bitrate: show a range until encoding completes. Decode metadata instead of guessing
duration from extension. Do not double mono input when stereo preservation is selected.

```text
changePercent = 100 * (outputBytes - inputBytes) / inputBytes
savingsPercent = -changePercent
```

For zero input bytes show unavailable. Positive growth must remain visible. Actual
bytes supersede estimates after export. Byte formatting currently uses binary divisors
with KB/MB labels; prefer KiB/MiB or document this convention.

## Meter semantics

`RMS=sqrt(sum(x^2)/sampleCount)`, `RMS_dBFS=20*log10(RMS)`,
`peak_dBFS=20*log10(max(abs(x)))`. A unit sine has approximately -3.01dBFS RMS and
0dBFS sample peak. Silence is negative infinity; -96 is a display floor, not a measured
noise level. Compare equal windows/channels, not a one-second channel-0 estimate
against full-file stereo. Peak normalization does not equalize perceptual loudness.

FFT frequency is `k*contextSampleRate/fftSize`. Map bins into canvas coordinates and
limit labels to Nyquist. The [Web Audio specification](https://www.w3.org/TR/webaudio/)
defines context-rate decoding and graph/analyser behavior. Browser rendering is a
separate evidence class from Node probes.

## Executed numeric probes

Run `node scripts/audit-numerics.cjs`. Actual checked-in DSP/WAV functions execute in
VM contexts with seeded random values. Worker imports/host are stubbed; this does not
test the codecs or browser sound device.

| Probe | Observed |
| --- | --- |
| Stereo R/L 0.1, post-normalize off | R/L 1.0 |
| Input peak 0.00001, crush/normalize off | Peak 0.761552155 |
| Silence + noise 0.00001 | Peak 0.761552989 |
| 1-bit Worklet, dither/normalize on | Peak 1.265802264 |
| WAV8 silence | Byte 127; midpoint should be 128 |
| Three WAV8 mono samples | 47 bytes; missing word padding |
| 10s/22.05k mono/12-bit effect | Estimate 330794; WAV 441044 bytes |
| Main/worker DSP, noise/dither off | Maximum difference 0 |
| Two worklet copies | Identical at baseline |
| Invalid numeric hash parser | NaN accepted |

These support targeted fixes, not a claim that all audio is corrupt. Listening,
codec re-decoding, loop-boundary analysis, true-peak and cross-browser comparisons
remain unverified.
