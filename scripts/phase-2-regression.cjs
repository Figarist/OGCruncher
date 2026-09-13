const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function loadModule(file, globals = {}) {
  const source = fs.readFileSync(path.join(root, file), 'utf8')
    .replace(/^import .*;\r?$/mg, '')
    .replace(/import\.meta\.url/g, "'https://example.test/assets/app.js'")
    .replace(/import\.meta\.env\.BASE_URL/g, "''")
    .replace(/export /g, '');
  const context = vm.createContext({ console, URL, URLSearchParams, setTimeout, clearTimeout, ...globals });
  vm.runInContext(source, context, { filename: file });
  return context;
}

class FakeParam {
  constructor() {
    this.value = 0;
    this.events = [];
  }

  cancelScheduledValues(time) { this.events.push(['cancel', time]); }
  setValueAtTime(value, time) { this.value = value; this.events.push(['set', value, time]); }
  linearRampToValueAtTime(value, time) { this.value = value; this.events.push(['ramp', value, time]); }
  setTargetAtTime(value, time, duration) { this.value = value; this.events.push(['target', value, time, duration]); }
}

class FakeNode {
  constructor() {
    this.connections = [];
    this.gain = new FakeParam();
  }

  connect(node) { this.connections.push(node); return node; }
  disconnect() { this.connections = []; }
}

class FakeSource extends FakeNode {
  constructor() {
    super();
    this.starts = [];
  }

  start(...args) { this.starts.push(args); }
  stop() {}
}

class FakeAnalyser extends FakeNode {
  constructor() {
    super();
    this.frequencyBinCount = 1024;
    this.fftSize = 2048;
  }

  getByteFrequencyData(array) { array.fill(0); }
  getByteTimeDomainData(array) { array.fill(128); }
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 10;
    this.state = 'running';
    this.destination = new FakeNode();
    this.createdBuffers = [];
  }

  createGain() { return new FakeNode(); }
  createAnalyser() { return new FakeAnalyser(); }
  createBufferSource() { return new FakeSource(); }
  createBuffer(channels, length, sampleRate) {
    const buffer = {
      duration: length / sampleRate,
      sampleRate,
      numberOfChannels: channels,
      getChannelData: () => new Float32Array(length),
    };
    this.createdBuffers.push(buffer);
    return buffer;
  }
}

function element() {
  return {
    style: {},
    classList: { contains: () => true, add() {}, remove() {}, toggle() {} },
    setAttribute() {},
  };
}

function testABSignalPath() {
  const dom = {
    btnPreview: element(),
    btnPreviewLbl: element(),
    previewIcon: element(),
    abContainer: element(),
    abStatus: element(),
    dropContent: element(),
    visualizer: element(),
    metricsPanel: element(),
    previewFileName: element(),
    btnAB: element(),
  };
  const state = { previewVolume: 0.8, dualView: false };
  const context = loadModule('js/preview.js', {
    state,
    window: { AudioContext: FakeAudioContext, setTimeout, clearTimeout },
    log() {},
    requestAnimationFrame: () => 0,
    computeAudioMetrics() { return { rmsDb: -12, peakDb: -3 }; },
    renderFilteredBuffer: async () => {},
    processChannels() {},
    hashSeed: () => 1,
  });

  context.initPreview(dom);
  context.createBranchGraph();
  const buffer = { duration: 2, sampleRate: 48000 };
  context.installSources(buffer, buffer);
  context.toggleAB();

  const wetSourceLevel = vm.runInContext('wetSourceGain.gain.value', context);
  const drySourceLevel = vm.runInContext('drySourceGain.gain.value', context);
  const wetBranchLevel = vm.runInContext('wetBranch.gain.value', context);
  const dryBranchLevel = vm.runInContext('dryBranch.gain.value', context);
  assert.ok(drySourceLevel * dryBranchLevel > 0, 'DRY selection must pass a non-zero source signal');
  assert.equal(wetSourceLevel, 1, 'WET source remains available for the next A/B switch');
  assert.equal(wetSourceLevel * wetBranchLevel, 0, 'WET branch is silent while DRY is selected');

  context.toggleAB();
  assert.equal(vm.runInContext('wetBranch.gain.value', context), 1, 'WET is restored after DRY');
  assert.equal(vm.runInContext('dryBranch.gain.value', context), 0, 'DRY is muted after returning to WET');
  context.installSources(buffer, buffer, 0.5, true);
  assert.equal(vm.runInContext('wetSourceGain.gain.value', context), 1, 'crossfade finishes with the new WET source available');
  assert.equal(vm.runInContext('drySourceGain.gain.value', context), 1, 'crossfade keeps the new DRY source available');

  const wetSourceAnalyser = vm.runInContext('wetSourceGain.connections[0] === wetAnalyser', context);
  const drySourceAnalyser = vm.runInContext('drySourceGain.connections[0] === dryAnalyser', context);
  assert.equal(wetSourceAnalyser, true, 'WET analyser must observe the source before A/B muting');
  assert.equal(drySourceAnalyser, true, 'DRY analyser must observe the source before A/B muting');
}

function makeDeferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

async function flushMicrotasks() {
  for (let i = 0; i < 32; i++) await Promise.resolve();
}

async function testLatestPreviewUpdateWins() {
  const timers = new Map();
  let nextTimer = 0;
  const runTimers = () => {
    const pending = [...timers.entries()];
    timers.clear();
    pending.forEach(([, callback]) => callback());
  };
  const sources = [];
  const contexts = [];
  class UpdateAudioContext extends FakeAudioContext {
    constructor() {
      super();
      this.currentTime = 10;
      contexts.push(this);
    }

    async decodeAudioData() {
      return { duration: 2, sampleRate: 48000, numberOfChannels: 1 };
    }

    createBufferSource() {
      const source = super.createBufferSource();
      sources.push(source);
      return source;
    }
  }

  const renderDeferred = [];
  let renderCalls = 0;
  const makeRendered = duration => ({
    duration,
    sampleRate: 48000,
    numberOfChannels: 1,
    getChannelData: () => new Float32Array(Math.round(duration * 48000)),
  });
  const renderFilteredBuffer = async () => {
    renderCalls++;
    if (renderCalls <= 2) return makeRendered(2);
    const deferred = makeDeferred();
    renderDeferred.push(deferred);
    return deferred.promise;
  };
  const file = { name: 'fixture.wav', size: 32, arrayBuffer: async () => new ArrayBuffer(32) };
  const state = {
    files: new Map([[1, file]]), liveUpdate: true, previewVolume: 0.8, dualView: false,
    stereo: false, sampleRate: 48000, playbackRate: 1, hpf: 20, lpf: 20000, bass: 0,
    bitDepth: 8, crushMode: true, dither: false, grit: 1, noise: 0, normalize: false,
  };
  const dom = {
    btnPreview: element(), btnPreviewLbl: element(), previewIcon: element(), abContainer: element(),
    abStatus: element(), dropContent: element(), visualizer: null, metricsPanel: element(),
    previewFileName: element(), btnAB: element(),
  };
  const context = loadModule('js/preview.js', {
    state,
    window: {
      AudioContext: UpdateAudioContext,
      setTimeout: callback => { const id = ++nextTimer; timers.set(id, callback); return id; },
      clearTimeout: id => timers.delete(id),
    },
    log() {},
    requestAnimationFrame: () => 0,
    computeAudioMetrics() { return { rmsDb: -12, peakDb: -3 }; },
    renderFilteredBuffer,
    processChannels() {},
    hashSeed: () => 1,
  });

  context.initPreview(dom);
  await context.startPreview();
  assert.equal(renderCalls, 2, 'initial preview renders both branches');
  context.requestPreviewUpdate();
  runTimers();
  assert.equal(renderDeferred.length, 1, 'first live update has one controllable render phase');
  context.requestPreviewUpdate();
  runTimers();
  assert.equal(renderDeferred.length, 1, 'rapid updates do not start an unbounded second render');

  renderDeferred[0].resolve(makeRendered(2));
  await flushMicrotasks();
  runTimers();
  assert.equal(renderDeferred.length, 2, 'latest request starts only after stale render settles');

  const activeContext = contexts[0];
  activeContext.currentTime = 11;
  renderDeferred[1].resolve(makeRendered(4));
  await flushMicrotasks();
  renderDeferred[2].resolve(makeRendered(4));
  await flushMicrotasks();

  const latestWetSource = sources.at(-2);
  assert.equal(latestWetSource.buffer, activeContext.createdBuffers.at(-1), 'newest render owns the installed wet source');
  assert.equal(sources.length, 4, 'stale render never installs an extra source pair');
  assert.ok(Math.abs(latestWetSource.starts.at(-1)[1] - 2) < 0.001, 'playhead includes render time and maps to the new duration');
}

function createWorkerContext({ ogg = true, mp3 = true } = {}) {
  const messages = [];
  const self = {
    location: { href: 'https://example.test/OGCruncher/assets/dsp.worker.js' },
    postMessage(message) { messages.push(message); },
  };
  const context = loadModule('js/dsp.worker.js', {
    self,
    importScripts(url) {
      if (String(url).includes('OggVorbisEncoder')) {
        self.OggVorbisEncoderConfig.onRuntimeInitialized();
      }
      if (String(url).includes('lame.min.js') && !mp3) throw new Error('forced MP3 failure');
    },
  });
  context.OggVorbisEncoder = class {
    constructor() { if (!ogg) throw new Error('forced OGG failure'); }
    encode() {}
    finish() { return { arrayBuffer: async () => new ArrayBuffer(4) }; }
  };
  context.lamejs = {
    Mp3Encoder: class {
      encodeBuffer() { return new Int8Array([1]); }
      flush() { return new Int8Array([2]); }
    },
  };
  return { context, messages };
}

async function runWorker(worker, channels, params, sampleRate = 24000) {
  worker.messages.length = 0;
  await worker.context.self.onmessage({ data: {
    type: 'process',
    channels,
    sampleRate,
    fileName: 'fixture.wav',
    randomSeed: 12345,
    ...params,
  } });
  return worker.messages.at(-1);
}

function assertArrayEqual(actual, expected, message) {
  assert.equal(actual.length, expected.length, `${message}: length`);
  for (let i = 0; i < actual.length; i++) assert.equal(actual[i], expected[i], `${message}: sample ${i}`);
}

async function testWorkerParityAndPartialFailures() {
  const core = loadModule('js/dsp-core.js', { Math });
  const worker = createWorkerContext();
  const vectors = [
    { name: 'silence', channels: [new Float32Array(64)] },
    { name: 'dc', channels: [Float32Array.from({ length: 64 }, () => 0.2)] },
    { name: 'impulse', channels: [Float32Array.from({ length: 64 }, (_, i) => i === 0 ? 1 : 0)] },
    { name: 'sine', channels: [Float32Array.from({ length: 64 }, (_, i) => Math.sin(i / 5) * 0.4)] },
    { name: 'quiet sine', channels: [Float32Array.from({ length: 64 }, (_, i) => Math.sin(i / 5) * 0.00001)] },
    { name: 'asymmetric stereo', channels: [
      Float32Array.from({ length: 64 }, (_, i) => Math.sin(i / 5) * 0.4),
      Float32Array.from({ length: 64 }, (_, i) => Math.sin(i / 7) * 0.07),
    ] },
    { name: 'transient', channels: [Float32Array.from({ length: 64 }, (_, i) => i < 4 ? (1 - i / 4) : 0)] },
  ];
  const parameterCases = [
    { name: 'creative seeded', crushMode: true, dither: true, grit: 2.2, noise: 0.01, normalize: true },
    { name: 'neutral bypass', crushMode: false, dither: false, grit: 1, noise: 0, normalize: false },
  ];
  for (const sampleRate of [8000, 22050, 48000]) {
    for (const bitDepth of [1, 8, 12, 16]) {
      for (const parameterCase of parameterCases) {
        for (const vector of vectors) {
          const input = vector.channels;
          const params = { bitDepth, ...parameterCase };
          delete params.name;
          const label = `${vector.name} ${sampleRate}Hz ${bitDepth}bit ${parameterCase.name}`;
          const expected = input.map(channel => channel.slice());
          core.processChannels(expected, params, 12345);
          const actualInput = input.map(channel => channel.slice());
          const message = await runWorker(worker, actualInput, params, sampleRate);
          assert.equal(message.type, 'done', `actual worker returns a done message: ${label}`);
          actualInput.forEach((channel, index) => {
            assertArrayEqual(channel, expected[index], `worker/core parity: ${label}`);
            assert.ok(channel.every(value => Number.isFinite(value) && Math.abs(value) <= 1), `finite bounded samples: ${label}`);
          });
          const expectedWav = new Uint8Array(core.encodeWAV(expected, sampleRate, bitDepth));
          const wavView = new DataView(message.formats.wav);
          assert.equal(wavView.getUint16(22, true), input.length, `WAV channels: ${label}`);
          assert.equal(wavView.getUint32(24, true), sampleRate, `WAV sample rate: ${label}`);
          assert.equal(wavView.getUint16(34, true), bitDepth <= 8 ? 8 : 16, `WAV container depth: ${label}`);
          assertArrayEqual(new Uint8Array(message.formats.wav), expectedWav, `worker/core WAV parity: ${label}`);
        }
      }
    }
  }

  const oggFailure = createWorkerContext({ ogg: false });
  const oggMessage = await runWorker(oggFailure, [Float32Array.from([0, .2, -.2])], { bitDepth: 8, crushMode: false, dither: false, grit: 1, noise: 0, normalize: false });
  assert.ok(oggMessage.formats.wav?.byteLength > 0 && oggMessage.formats.mp3?.byteLength > 0, 'WAV/MP3 survive forced OGG failure');
  assert.equal(oggMessage.errors.map(error => error.format).join(','), 'ogg', 'forced OGG failure is reported per format');

  const mp3Failure = createWorkerContext({ mp3: false });
  const mp3Message = await runWorker(mp3Failure, [Float32Array.from([0, .2, -.2])], { bitDepth: 8, crushMode: false, dither: false, grit: 1, noise: 0, normalize: false });
  assert.ok(mp3Message.formats.wav?.byteLength > 0 && mp3Message.formats.ogg?.byteLength > 0, 'WAV/OGG survive forced MP3 failure');
  assert.equal(mp3Message.errors.map(error => error.format).join(','), 'mp3', 'forced MP3 failure is reported per format');
}

async function testMetadataStatesAndCleanup() {
  const elements = new Map();
  const makeElement = () => ({ style: {}, textContent: '', className: '', hidden: false });
  ['savings-estimate', 'savings-original-size', 'savings-estimated-wav', 'savings-estimated-ogg',
    'savings-estimated-mp3', 'savings-pct-wav', 'savings-pct-ogg', 'savings-pct-mp3', 'savings-pct-badge']
    .forEach(id => elements.set(id, makeElement()));
  const pending = [];
  let contextsCreated = 0;
  let contextsClosed = 0;
  class MetadataContext {
    constructor() { contextsCreated++; this.closed = false; }
    async decodeAudioData() {
      const deferred = makeDeferred();
      pending.push(deferred);
      return deferred.promise;
    }
    async close() { this.closed = true; contextsClosed++; }
  }
  const validFile = { name: 'valid.wav', size: 10, type: 'audio/wav', arrayBuffer: async () => new ArrayBuffer(10) };
  const state = {
    files: new Map([[1, validFile]]), nextId: 2, processing: false, playbackRate: 1,
    stereo: true, sampleRate: 48000, bitDepth: 16,
  };
  const dom = {
    fileQueue: { firstChild: null, removeChild() {} }, queueHeader: makeElement(), btnProcess: makeElement(),
    btnPreview: makeElement(), resultsArea: { firstChild: null, removeChild() {}, hidden: true }, batchSummary: makeElement(),
  };
  const context = loadModule('js/queue.js', {
    state,
    getStateSnapshot: () => ({ ...state }),
    window: { AudioContext: MetadataContext },
    document: { getElementById: id => elements.get(id) || null, createElement: () => ({}) },
    log() {}, showToast() {}, formatBytes: value => `${value}B`, formatSizeChange: () => '0%', setBadge() {},
    buildFilterChain() {}, safeOfflineCtx() {}, hashSeed: () => 1, stopPreview() {},
  });
  context.initQueue(dom);
  for (let i = 0; i < 8; i++) context.updateSavingsEstimate();
  assert.equal(contextsCreated, 1, 'repeated estimate updates share one pending metadata decode');
  await flushMicrotasks();
  pending[0].resolve({ duration: 1, numberOfChannels: 2, sampleRate: 48000 });
  await flushMicrotasks();
  assert.equal(vm.runInContext('metadata.get(1).status', context), 'success', 'successful metadata has an explicit state');
  assert.equal(elements.get('savings-pct-badge').textContent, 'PER-FORMAT', 'estimate completes after metadata');

  const invalidFile = { name: 'broken.wav', size: 12, type: 'audio/wav', arrayBuffer: async () => new ArrayBuffer(12) };
  state.files.set(2, invalidFile);
  context.updateSavingsEstimate();
  assert.equal(contextsCreated, 2, 'new file gets one additional metadata decode');
  await flushMicrotasks();
  pending[1].resolve(Promise.reject(new Error('corrupt fixture')));
  await flushMicrotasks();
  assert.equal(vm.runInContext('metadata.get(2).status', context), 'error', 'corrupt metadata has an explicit error state');
  assert.equal(elements.get('savings-pct-badge').textContent, 'UNAVAILABLE', 'metadata failure does not remain ANALYZING');
  assert.equal(contextsClosed, 2, 'metadata contexts close on success and failure');

  const removedFile = { name: 'removed.wav', size: 14, type: 'audio/wav', arrayBuffer: async () => new ArrayBuffer(14) };
  state.files.set(3, removedFile);
  context.updateSavingsEstimate();
  assert.equal(contextsCreated, 3, 'removed file starts metadata analysis');
  await flushMicrotasks();
  context.clearQueue();
  pending[2].resolve({ duration: 1, numberOfChannels: 1, sampleRate: 44100 });
  await flushMicrotasks();
  assert.equal(vm.runInContext('metadata.size', context), 0, 'clear prevents late metadata from returning');
  assert.equal(elements.get('savings-estimate').style.display, 'none', 'clear hides stale estimates');
}

async function testOutputFilenameContract() {
  const context = loadModule('js/queue.js', {
    state: { files: new Map() },
    getStateSnapshot: () => ({}), window: {}, document: { getElementById: () => null },
    log() {}, showToast() {}, formatBytes: value => String(value), formatSizeChange: () => '0%', setBadge() {},
    buildFilterChain() {}, safeOfflineCtx() {}, hashSeed: () => 1, stopPreview() {},
  });
  const filename = context.getOutputFilename('a<>:"/\\|?*'.repeat(30) + '.mp3', 'wav', 12, 22050);
  assert.match(filename, /_crunched_12bit_22050hz\.wav$/);
  assert.ok(filename.length <= 185, 'long output filename is bounded');
  assert.equal(filename.includes('<'), false, 'unsafe filename characters are sanitized');
}

function genericElement() {
  return {
    children: [], style: {}, className: '', hidden: false, textContent: '', dataset: {},
    append(...nodes) { this.children.push(...nodes); },
    appendChild(node) { this.children.push(node); },
    insertBefore(node, reference) {
      const index = reference ? this.children.indexOf(reference) : -1;
      this.children.splice(index >= 0 ? index : this.children.length, 0, node);
    },
    setAttribute() {}, addEventListener() {}, remove() {},
  };
}

function createQueueHarness({ autoCompleteWorker = false, workerErrors = [] } = {}) {
  const elements = new Map();
  const statuses = new Map();
  const metadata = ['savings-estimate', 'savings-original-size', 'savings-estimated-wav',
    'savings-estimated-ogg', 'savings-estimated-mp3', 'savings-pct-wav', 'savings-pct-ogg',
    'savings-pct-mp3', 'savings-pct-badge'];
  metadata.forEach(id => elements.set(id, genericElement()));
  const state = {
    files: new Map(), nextId: 1, processing: false, playbackRate: 1, stereo: false,
    sampleRate: 24000, bitDepth: 8, crushMode: false, dither: false, grit: 1,
    noise: 0, normalize: false,
  };
  const decodePlan = [];
  const renderPlan = [];
  const workers = [];
  const badgeEvents = [];
  let context;
  let workerProcessCount = 0;
  class TestAudioContext {
    async decodeAudioData() {
      const deferred = decodePlan.shift();
      return deferred ? deferred.promise : { duration: 1, numberOfChannels: 1, sampleRate: 24000 };
    }
    async close() {}
  }
  class TestWorker {
    constructor() { this.onmessage = null; this.onerror = null; this.terminated = false; workers.push(this); }
    postMessage(message) {
      if (message.type !== 'process') return;
      workerProcessCount++;
      if (autoCompleteWorker) Promise.resolve().then(() => this.onmessage?.({ data: {
        type: 'done', formats: { wav: vm.runInContext('new ArrayBuffer(4)', context) }, errors: workerErrors, hasClipping: false,
      } }));
    }
    terminate() { this.terminated = true; }
  }
  const makeRendered = () => ({ sampleRate: 24000, numberOfChannels: 1, getChannelData: () => new Float32Array(16) });
  const safeOfflineCtx = () => {
    const deferred = renderPlan.shift();
    const source = { playbackRate: { value: 1 }, connect() { return this; }, start() {} };
    return {
      destination: {},
      createBufferSource: () => source,
      startRendering: () => deferred ? deferred.promise : Promise.resolve(makeRendered()),
    };
  };
  const document = {
    getElementById(id) {
      if (id.startsWith('status-')) {
        if (!statuses.has(id)) statuses.set(id, genericElement());
        return statuses.get(id);
      }
      return elements.get(id) || null;
    },
    createElement: () => genericElement(),
  };
  class TestURL extends URL {}
  TestURL.createObjectURL = () => `blob:${workerProcessCount}`;
  TestURL.revokeObjectURL = () => {};
  const dom = {
    progressWrap: genericElement(), btnProcess: genericElement(), btnProcessLbl: genericElement(),
    btnCancel: genericElement(), batchSummary: genericElement(),
    resultsArea: genericElement(), fileQueue: genericElement(), queueHeader: genericElement(), btnPreview: genericElement(),
  };
  context = loadModule('js/queue.js', {
    state,
    getStateSnapshot: () => ({ ...state }),
    window: { AudioContext: TestAudioContext },
    document,
    Worker: TestWorker,
    URL: TestURL,
    Blob,
    File: class TestFile { constructor(parts, name, options) { this.parts = parts; this.name = name; this.type = options.type; this.size = parts.reduce((sum, part) => sum + (part.byteLength || part.size || 0), 0); } },
    log() {}, showToast() {}, formatBytes: value => `${value}B`, formatSizeChange: () => '0%',
    setBadge: (...args) => badgeEvents.push(args), buildFilterChain: () => ({ connect() {} }), safeOfflineCtx, hashSeed: () => 1, stopPreview() {},
  });
  context.initQueue(dom);
  return { context, state, decodePlan, renderPlan, workers, statuses, elements, dom, badgeEvents, get workerProcessCount() { return workerProcessCount; } };
}

function makeDecodedDeferred() {
  return makeDeferred();
}

async function testCancellationAndRetry() {
  const readHarness = createQueueHarness();
  const readDeferred = makeDeferred();
  const readFile = { name: 'cancel-read.wav', size: 10, type: 'audio/wav', arrayBuffer: async () => readDeferred.promise };
  readHarness.state.files.set(1, readFile);
  const readRun = readHarness.context.startProcessing(() => {});
  await flushMicrotasks();
  readHarness.context.cancelProcessing();
  readDeferred.resolve(new ArrayBuffer(10));
  await readRun;
  assert.equal(readHarness.workerProcessCount, 0, 'cancel during file read creates no worker');

  const decodeHarness = createQueueHarness({ autoCompleteWorker: true });
  const file = { name: 'cancel-decode.wav', size: 10, type: 'audio/wav', arrayBuffer: async () => new ArrayBuffer(10) };
  decodeHarness.state.files.set(1, file);
  const decode = makeDecodedDeferred();
  decodeHarness.decodePlan.push(decode);
  const decodeRun = decodeHarness.context.startProcessing(() => {});
  await flushMicrotasks();
  decodeHarness.context.cancelProcessing();
  decode.resolve({ duration: 1, numberOfChannels: 1, sampleRate: 24000 });
  await decodeRun;
  assert.equal(decodeHarness.workerProcessCount, 0, 'cancel during decode creates no worker');
  assert.match(decodeHarness.dom.batchSummary.textContent, /cancelled: 1; not attempted: 0/);

  const retryRun = decodeHarness.context.startProcessing(() => {});
  await retryRun;
  assert.match(decodeHarness.dom.batchSummary.textContent, /Completed: 1 full, 0 partial/);
  assert.equal(decodeHarness.workerProcessCount, 1, 'a cancelled batch can be retried cleanly');

  const renderHarness = createQueueHarness();
  renderHarness.state.files.set(1, file);
  const render = makeDeferred();
  renderHarness.renderPlan.push(render);
  const renderRun = renderHarness.context.startProcessing(() => {});
  await flushMicrotasks();
  renderHarness.context.cancelProcessing();
  render.resolve({ sampleRate: 24000, numberOfChannels: 1, getChannelData: () => new Float32Array(16) });
  await renderRun;
  assert.equal(renderHarness.workerProcessCount, 0, 'cancel during offline render creates no worker');

  const workerHarness = createQueueHarness();
  workerHarness.state.files.set(1, file);
  const workerRun = workerHarness.context.startProcessing(() => {});
  await flushMicrotasks();
  assert.equal(workerHarness.workerProcessCount, 1, 'worker stage starts after decode and render');
  workerHarness.context.cancelProcessing();
  await workerRun;
  assert.match(workerHarness.dom.batchSummary.textContent, /cancelled: 1/);

  const multiHarness = createQueueHarness({ autoCompleteWorker: true });
  const secondRead = makeDeferred();
  multiHarness.state.files.set(1, file);
  multiHarness.state.files.set(2, { name: 'second.wav', size: 11, type: 'audio/wav', arrayBuffer: async () => secondRead.promise });
  multiHarness.state.files.set(3, { name: 'third.wav', size: 12, type: 'audio/wav', arrayBuffer: async () => new ArrayBuffer(12) });
  const multiRun = multiHarness.context.startProcessing(() => {});
  await flushMicrotasks();
  assert.equal(multiHarness.workerProcessCount, 1, 'first file completes before the second begins');
  multiHarness.context.cancelProcessing();
  secondRead.resolve(new ArrayBuffer(11));
  await multiRun;
  assert.match(multiHarness.dom.batchSummary.textContent, /Completed: 1 full, 0 partial; failed: 0; cancelled: 1; not attempted: 1/);
}

async function testPartialQueueSummary() {
  const harness = createQueueHarness({
    autoCompleteWorker: true,
    workerErrors: [{ format: 'ogg', message: 'forced OGG failure' }],
  });
  const file = { name: 'partial.wav', size: 10, type: 'audio/wav', arrayBuffer: async () => new ArrayBuffer(10) };
  harness.state.files.set(1, file);
  await harness.context.startProcessing(() => {});
  assert.match(harness.dom.batchSummary.textContent, /Completed: 0 full, 1 partial; failed: 0/);
  assert.equal(harness.badgeEvents.at(-1)[0], 'PARTIAL', 'partial format success is not reported as DONE');
  const result = harness.dom.resultsArea.children[0];
  const resultErrors = result.children.find(child => child.className === 'result-errors');
  assert.match(resultErrors.children[0].textContent, /OGG unavailable/);
  const links = result.children.find(child => child.className === 'result-links');
  const wavLink = links.children[0];
  const registryName = vm.runInContext('Array.from(blobRegistry.values())[0].name', harness.context);
  assert.equal(registryName, wavLink.download, 'drag File and download link share one output filename');
  assert.equal(wavLink.dataset.mime, 'audio/wav', 'result carries the correct MIME for fallback drag');
  let fallback;
  harness.context.handleDragStart({
    currentTarget: { dataset: { url: 'missing', mime: wavLink.dataset.mime }, download: wavLink.download, href: wavLink.href },
    dataTransfer: { setData: (kind, value) => { fallback = [kind, value]; } },
  });
  assert.equal(fallback[1], `audio/wav:${wavLink.download}:${wavLink.href}`, 'fallback DownloadURL preserves MIME and filename');
}

function testProcessingControlLock() {
  const source = read('js/ui.js');
  assert.match(source, /btnPreview\.disabled = !enabled && !btnPreview\.classList\.contains\('playing'\)/,
    'processing keeps Preview disabled unless it is the active Stop control');
  assert.match(source, /btnAB\.disabled = !enabled/,
    'processing disables A\/B branch switching');
}

async function main() {
  testABSignalPath();
  await testLatestPreviewUpdateWins();
  await testWorkerParityAndPartialFailures();
  await testMetadataStatesAndCleanup();
  await testOutputFilenameContract();
  testProcessingControlLock();
  await testCancellationAndRetry();
  await testPartialQueueSummary();
  console.log('OGCruncher phase-2 regression checks passed.');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
