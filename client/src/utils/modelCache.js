// Share one model download across the hero, background preload and later previews.
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const MODEL_URL = '/models/hero-golf.glb';
// Bump this string when the GLB file is replaced so users re-download the new model.
const CACHE_VERSION = 'v1';
const IDB_DB = 'bcc-models';
const IDB_STORE = 'glb';
const IDB_KEY = `${MODEL_URL}@${CACHE_VERSION}`;

let buffer = null;
let fetching = null;
const progressListeners = new Set();

const openIDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(IDB_DB, 1);
  req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
  req.onsuccess = e => resolve(e.target.result);
  req.onerror = () => reject(req.error);
});

const readIDB = async () => {
  try {
    const db = await openIDB();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(IDB_STORE).objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch { return null; }
};

const writeIDB = async data => {
  try {
    const db = await openIDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(data, IDB_KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {}
};

const fetchModelBuffer = async () => {
  if (buffer) return buffer;
  if (fetching) return fetching;

  // Check persistent IndexedDB cache first (survives page refreshes)
  const cached = await readIDB();
  if (cached) { buffer = cached; return buffer; }

  fetching = fetch(MODEL_URL).then(async response => {
    if (!response.ok) throw new Error(`Vehicle preview request failed (${response.status})`);
    if (!response.body?.getReader) {
      buffer = await response.arrayBuffer();
      writeIDB(buffer);
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
    writeIDB(buffer); // async write, don't await — don't block rendering
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
    return await new Promise((resolve, reject) => new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parse(bytes, '', resolve, reject));
  } finally { if (onProgress) progressListeners.delete(onProgress); }
};
