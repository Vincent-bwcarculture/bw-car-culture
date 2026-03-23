// utils/modelCache.js
// Module-level GLB cache — survives re-renders, cleared only on page refresh.
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const MODEL_URL = 'https://i3wcarculture-images.s3.amazonaws.com/models/golf_r_configurator.glb';

let _buffer    = null;   // ArrayBuffer once fetched
let _fetching  = null;   // in-flight Promise<ArrayBuffer>

/** Kick off a background fetch — safe to call multiple times. */
export const preloadCarModel = () => {
  if (_buffer || _fetching) return;
  _fetching = fetch(MODEL_URL)
    .then(r => r.arrayBuffer())
    .then(buf => { _buffer = buf; _fetching = null; })
    .catch(() => { _fetching = null; });
};

/**
 * Load the GLTF, using the in-memory buffer if already cached.
 * @param {function} onProgress  called with { loaded, total, percent }
 * @returns {Promise<GLTF>}
 */
export const loadCarModel = (onProgress) =>
  new Promise((resolve, reject) => {
    const loader = new GLTFLoader();

    // ── Already cached → parse instantly, no network ──────────────────────
    if (_buffer) {
      loader.parse(_buffer, '', resolve, reject);
      return;
    }

    // ── Fetch with ReadableStream progress tracking ────────────────────────
    const doFetch = () =>
      fetch(MODEL_URL)
        .then(async res => {
          const total  = parseInt(res.headers.get('Content-Length') || '0', 10);
          const reader = res.body.getReader();
          const chunks = [];
          let loaded   = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            loaded += value.length;
            if (onProgress && total) onProgress({ loaded, total, percent: Math.round(loaded / total * 100) });
          }

          const buf = new Uint8Array(loaded);
          let offset = 0;
          for (const chunk of chunks) { buf.set(chunk, offset); offset += chunk.length; }
          _buffer = buf.buffer;
          loader.parse(_buffer, '', resolve, reject);
        })
        .catch(() => {
          // Fallback: let Three.js handle it (no progress %)
          loader.load(
            MODEL_URL,
            resolve,
            e => { if (onProgress && e.total) onProgress({ loaded: e.loaded, total: e.total, percent: Math.round(e.loaded / e.total * 100) }); },
            reject
          );
        });

    // If a fetch is already in flight, wait for it then parse from buffer
    if (_fetching) {
      _fetching.then(() => {
        if (_buffer) loader.parse(_buffer, '', resolve, reject);
        else doFetch();
      });
    } else {
      doFetch();
    }
  });
