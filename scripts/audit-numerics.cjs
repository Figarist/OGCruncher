// Read-only characterization. Historical probes intentionally keep the old
// defective formulas visible; current probes are measurements, not assertions.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const seededMath = () => {
  const math = Object.create(Math);
  let seed = 123456;
  math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  return math;
};
const loadCore = () => {
  const context = vm.createContext({ Math: seededMath() });
  vm.runInContext(read('js/dsp-core.js').replace(/export /g, ''), context);
  return context;
};
const peak = values => values.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
const sine = (amplitude, n = 4096) => Float32Array.from({ length: n }, (_, i) => amplitude * Math.sin(2 * Math.PI * i / 32));

// This is the baseline formula captured by the 2026-09-10 audit. It is kept
// here only to reproduce the historical numeric-results.json observations.
function legacyProcessDSP(buf, bitDepth, crushMode, dither, grit = 1.5, noise = 0) {
  bitDepth = Math.max(1, Math.min(16, bitDepth || 8));
  grit = Math.max(1, Math.min(10, grit || 1.5));
  if (noise > 0) for (let i = 0; i < buf.length; i++) buf[i] += (Math.random() * 2 - 1) * noise;
  let sum = 0;
  for (const sample of buf) sum += sample;
  const dc = sum / buf.length;
  for (let i = 0; i < buf.length; i++) buf[i] -= dc;
  let max = 0;
  for (const sample of buf) max = Math.max(max, Math.abs(sample));
  for (let i = 0; i < buf.length; i++) buf[i] /= max + 1e-9;
  if (crushMode) {
    const halfLevels = 1 << (bitDepth - 1);
    for (let i = 0; i < buf.length; i++) {
      const x = buf[i];
      buf[i] = Math.sign(x) * Math.pow(Math.abs(x), 1.15);
      if (dither) buf[i] += (Math.random() - Math.random()) / halfLevels;
      buf[i] = Math.round(buf[i] * halfLevels) / halfLevels;
    }
  }
  for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] * grit);
}

function legacyWav8(samples, sampleRate = 8000) {
  const buffer = new ArrayBuffer(44 + samples.length);
  const view = new DataView(buffer);
  view.setUint32(4, 36 + samples.length, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint16(32, 1, true); view.setUint16(34, 8, true); view.setUint32(40, samples.length, true);
  for (let i = 0; i < samples.length; i++) view.setUint8(44 + i, (samples[i] + 1) * 127.5);
  return buffer;
}

const current = loadCore();
const legacy = [];
const fixed = [];
const add = (list, id, data) => list.push({ id, ...data });

const leftLegacy = sine(.8), rightLegacy = sine(.08);
legacyProcessDSP(leftLegacy, 16, false, false, 1, 0);
legacyProcessDSP(rightLegacy, 16, false, false, 1, 0);
add(legacy, 'A03', { inputRightToLeft: .1, outputRightToLeft: peak(rightLegacy) / peak(leftLegacy) });
const quietLegacy = sine(.00001); legacyProcessDSP(quietLegacy, 16, false, false, 1, 0);
add(legacy, 'A04', { inputPeak: .00001, outputPeak: peak(quietLegacy), crush: false, normalize: false });
const wavLegacy = legacyWav8(new Float32Array(3));
add(legacy, 'A05', { zeroSampleByte: new Uint8Array(wavLegacy)[44], fileBytes: wavLegacy.byteLength, missingEvenBytePadding: wavLegacy.byteLength % 2 === 1 });

const left = sine(.8), right = sine(.08);
current.processChannels([left, right], { bitDepth: 16, crushMode: false, dither: false, grit: 1, noise: 0, normalize: false }, 7);
add(fixed, 'A03', { inputRightToLeft: .1, outputRightToLeft: peak(right) / peak(left), normalize: 'linked' });
const quiet = sine(.00001); current.processDSP(quiet, 16, false, false, 1, 0, current.createSeededRandom(7));
add(fixed, 'A04', { inputPeak: .00001, outputPeak: peak(quiet), crush: false, normalize: false });
const wav = new DataView(current.encodeWAV([new Float32Array(3)], 8000, 8));
add(fixed, 'A05', { zeroSampleByte: wav.getUint8(45), fileBytes: wav.byteLength, dataBytes: wav.getUint32(40, true), padding: wav.byteLength - 44 - wav.getUint32(40, true) });
const stateContext = vm.createContext({ window: { location: { hash: '#b=abc&r=NaN' } }, URLSearchParams, console });
vm.runInContext(read('js/state.js').replace(/export /g, ''), stateContext);
const parsed = stateContext.parseHash();
add(fixed, 'S04', { invalidFieldsIgnored: parsed.bitDepth === undefined && parsed.sampleRate === undefined });

console.log(JSON.stringify({
  scope: 'Read-only characterization; historical formulas are intentionally separate from current measurements',
  historical: legacy,
  current: fixed,
  note: 'Historical observations preserve the audit baseline. Use npm test for regression assertions.'
}, null, 2));
