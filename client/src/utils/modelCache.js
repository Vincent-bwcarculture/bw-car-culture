// Share one model download across the hero, background preload and later previews.
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const MODEL_URL = 'https://i3wcarculture-images.s3.amazonaws.com/models/golf_r_configurator.glb';
let buffer = null;
let fetching = null;
const progressListeners = new Set();

const fetchModelBuffer = () => {
  if (buffer) return Promise.resolve(buffer);
  if (fetching) return fetching;
  fetching = fetch(MODEL_URL).then(async response => {
    if (!response.ok) throw new Error(`Vehicle preview request failed (${response.status})`);
    if (!response.body?.getReader) {
      buffer = await response.arrayBuffer();
      return buffer;
    }
    const total = Number(response.headers.get('Content-Length')) || 0;
    const reader = response.body.getReader();
    const chunks = [];
    let loaded = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); loaded += value.length;
        if (total) {
          const progress = { loaded, total, percent: Math.round(loaded / total * 100) };
          progressListeners.forEach(listener => listener(progress));
        }
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(loaded);
    let offset = 0;
    chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.length; });
    buffer = bytes.buffer;
    return buffer;
  }).finally(() => { fetching = null; });
  return fetching;
};

export const preloadCarModel = () => { fetchModelBuffer().catch(() => {}); };

export const loadCarModel = async onProgress => {
  if (onProgress) progressListeners.add(onProgress);
  try {
    const bytes = await fetchModelBuffer();
    // Parse separately so each viewer owns its geometry, materials and disposal lifecycle.
    return await new Promise((resolve, reject) => new GLTFLoader().parse(bytes, '', resolve, reject));
  } finally { if (onProgress) progressListeners.delete(onProgress); }
};
