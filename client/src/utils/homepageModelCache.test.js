jest.mock('three/examples/jsm/loaders/DRACOLoader.js', () => ({
  DRACOLoader: jest.fn().mockImplementation(() => ({ setDecoderPath() { return this; }, dispose: jest.fn() }))
}));
jest.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: jest.fn().mockImplementation(() => ({ setDRACOLoader() { return this; }, parse: (bytes, path, resolve) => resolve({ bytes }) }))
}));

let loadCarModel, preloadCarModel;
beforeEach(() => {
  jest.resetModules();
  ({ loadCarModel, preloadCarModel } = require('./modelCache.js'));
  global.fetch = jest.fn();
});
afterEach(() => { delete global.fetch; });

test('hero, preload and concurrent viewers share one in-flight download', async () => {
  let respond;
  fetch.mockReturnValue(new Promise(resolve => { respond = resolve; }));
  const first = loadCarModel();
  preloadCarModel();
  const second = loadCarModel();
  const bytes = new Uint8Array([1, 2, 3]).buffer;
  respond({ ok: true, arrayBuffer: async () => bytes });
  const models = await Promise.all([first, second]);
  await loadCarModel();
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch).toHaveBeenCalledWith('/models/hero-golf.glb');
  expect(models[0].bytes).toBe(bytes);
  expect(models[1].bytes).toBe(bytes);
  expect(models[0]).not.toBe(models[1]);
});

test('failed model requests are not cached and a later visit can retry', async () => {
  fetch.mockResolvedValueOnce({ ok: false, status: 503 });
  await expect(loadCarModel()).rejects.toThrow('503');
  fetch.mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) });
  await expect(loadCarModel()).resolves.toHaveProperty('bytes');
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('streamed progress reaches all waiting viewers without downloading a second copy', async () => {
  const progressA = jest.fn(), progressB = jest.fn(), releaseLock = jest.fn();
  const read = jest.fn().mockResolvedValueOnce({ done: false, value: new Uint8Array([1, 2]) })
    .mockResolvedValueOnce({ done: true });
  fetch.mockResolvedValue({ ok: true, headers: { get: () => '2' }, body: { getReader: () => ({ read, releaseLock }) } });
  const models = await Promise.all([loadCarModel(progressA), loadCarModel(progressB)]);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(progressA).toHaveBeenCalledWith({ loaded: 2, total: 2, percent: 100 });
  expect(progressB).toHaveBeenCalledWith({ loaded: 2, total: 2, percent: 100 });
  expect(new Uint8Array(models[0].bytes)).toEqual(new Uint8Array([1, 2]));
  expect(releaseLock).toHaveBeenCalledTimes(1);
});
