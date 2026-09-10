const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const loadModule = (file, globals = {}) => {
  const context = vm.createContext({ console, URLSearchParams, ...globals });
  vm.runInContext(read(file).replace(/^import .*;\r?$/mg, '').replace(/export /g, ''), context, { filename: file });
  return context;
};

const core = loadModule('js/dsp-core.js', { Math });
const approx = (actual, expected, tolerance, message) => assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} vs ${expected}`);
const peak = values => values.reduce((max, value) => Math.max(max, Math.abs(value)), 0);

// Neutral Crush OFF must not normalize a quiet signal or hide an asymmetric pair.
const quiet = Float32Array.from({ length: 256 }, (_, i) => 0.00001 * Math.sin(i / 7));
const quietBefore = quiet.slice();
core.processDSP(quiet, 16, false, false, 1, 0, () => .5);
approx(peak(quiet), peak(quietBefore), 1e-8, 'Crush OFF neutral level');

const left = Float32Array.from({ length: 256 }, (_, i) => .8 * Math.sin(i / 9));
const right = Float32Array.from({ length: 256 }, (_, i) => .08 * Math.sin(i / 9));
core.processChannels([left, right], { bitDepth: 16, crushMode: false, dither: false, grit: 1, noise: 0, normalize: false }, 42);
approx(peak(right) / peak(left), .1, 1e-6, 'linked-neutral stereo balance');
core.processChannels([left, right], { bitDepth: 16, crushMode: false, dither: false, grit: 1, noise: 0, normalize: true }, 42);
approx(peak(right) / peak(left), .1, 1e-6, 'linked-normalized stereo balance');
assert.ok(peak(left) <= 1 && peak(right) <= 1, 'linked normalization stays within full scale');

const noiseSilence = new Float32Array(2048);
core.processDSP(noiseSilence, 16, false, false, 1, .00001, () => .75);
assert.ok(peak(noiseSilence) <= .00001 + 1e-8, 'noise level remains bounded on silence');

// Other deterministic fixtures: DC is preserved in bypass, while impulse and
// unit-sine creative processing remain bounded.
const dc = new Float32Array(64).fill(.25);
core.processDSP(dc, 16, false, false, 1, 0, () => .5);
approx(dc[0], .25, 1e-8, 'Crush OFF preserves DC');
const impulse = new Float32Array(64);
impulse[0] = 1;
core.processDSP(impulse, 8, true, false, 10, 0, () => .5);
assert.ok(peak(impulse) <= 1, 'creative impulse remains bounded');
const unitSine = Float32Array.from({ length: 512 }, (_, i) => Math.sin(2 * Math.PI * i / 32));
core.processDSP(unitSine, 12, true, false, 3, 0, () => .5);
assert.ok(peak(unitSine) <= 1, 'creative unit sine remains bounded');

// WAV contract: PCM8 midpoint/endpoints and RIFF padding/lengths.
const wav8 = new DataView(core.encodeWAV([Float32Array.from([-1, 0, 1])], 8000, 8));
assert.equal(wav8.byteLength, 48, 'odd PCM8 data is word padded');
assert.equal(wav8.getUint32(4, true), 40, 'RIFF length includes padding');
assert.equal(wav8.getUint32(40, true), 3, 'data length excludes padding');
assert.deepEqual([wav8.getUint8(44), wav8.getUint8(45), wav8.getUint8(46)], [0, 128, 255], 'PCM8 midpoint and endpoints');
const wav16 = new DataView(core.encodeWAV([new Float32Array(2), new Float32Array(2)], 22050, 12));
assert.equal(wav16.getUint16(22, true), 2, 'stereo channel count');
assert.equal(wav16.getUint16(34, true), 16, 'effect bits are distinct from WAV container depth');
assert.equal(wav16.getUint32(40, true), 8, 'PCM16 data size');

// State parser must reject NaN, non-integers and out-of-range values without throwing.
const stateContext = loadModule('js/state.js', {
  window: { location: { hash: '#b=abc&r=NaN&sp=0.5&q=2' }, history: { replaceState() {} } },
});
const parsed = stateContext.parseHash();
assert.equal(parsed.bitDepth, undefined, 'invalid bit depth rejected');
assert.equal(parsed.sampleRate, undefined, 'invalid sample rate rejected');
assert.equal(parsed.playbackRate, .5, 'valid playback rate accepted');
assert.equal(parsed.simpleQuality, 2, 'valid integer quality accepted');
const invalid = stateContext.sanitizeParams({ bitDepth: 1.5, sampleRate: Infinity, grit: NaN, previewVolume: 4 });
assert.equal(Object.keys(invalid).length, 0, 'invalid saved fields rejected');

console.log('OGCruncher regression checks passed: DSP neutral/linked, PCM WAV, and state validation.');
