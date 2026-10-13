const REQUEST_BUDGET = 4_000_000;

// Leave room below the serverless request limit for multipart boundaries and text.
// Small uploads retain their original files; only oversized batches are optimized.
export async function prepareNewsUpload(data, compressor) {
  if (!(data instanceof FormData)) return data;
  const entries = [...data.entries()];
  const files = entries.filter(([, value]) => value instanceof Blob);
  const overhead = entries.reduce((size, [key, value]) => size + 1024 + key.length + (value instanceof Blob ? 0 : new Blob([value]).size), 0);
  const total = overhead + files.reduce((size, [, file]) => size + file.size, 0);
  if (total <= REQUEST_BUDGET) return data;
  if (!files.length || overhead >= REQUEST_BUDGET) throw new Error('Article text is too large to upload. Shorten it and try again.');
  const compress = compressor || (await import('browser-image-compression')).default;
  const maxSizeMB = Math.min(1.2, ((REQUEST_BUDGET - overhead) * 0.95) / files.length / 1024 / 1024);
  const prepared = new FormData();
  let bytes = overhead;
  for (const [key, value] of entries) {
    if (!(value instanceof Blob)) { prepared.append(key, value); continue; }
    let optimized = value;
    if (value.size > maxSizeMB * 1024 * 1024) {
      try { optimized = await compress(value, { maxSizeMB, maxWidthOrHeight: 1920, useWebWorker: true }); }
      catch { throw new Error('Could not prepare an article photo. Use a smaller JPEG, PNG or WebP image and try again.'); }
    }
    bytes += optimized.size;
    prepared.append(key, optimized, optimized.name || value.name);
  }
  if (bytes > REQUEST_BUDGET) throw new Error('These photos are too large to upload together. Select fewer photos or use smaller images.');
  return prepared;
}
