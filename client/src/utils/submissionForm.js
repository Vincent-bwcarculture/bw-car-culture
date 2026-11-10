import { prepareListingPhoto } from './listingPhotos.js';
export const submissionApiBase = base => String(base || '').replace(/\/+$/, '').replace(/\/api$/, '');
// Saved submissions use nested API fields; inputs also use flat vehicle fields.
export function normalizeSubmissionForm(defaults, saved = {}) {
  const merge = (base, value) => Object.fromEntries(Object.entries(base).map(([key, fallback]) => {
    const incoming = value?.[key];
    return [key, fallback && typeof fallback === 'object' && !Array.isArray(fallback)
      ? merge(fallback, incoming)
      : incoming ?? fallback];
  }));
  const result = { ...saved, ...merge(defaults, saved) };
  result.price = saved.price ?? saved.pricing?.price ?? defaults.price;
  Object.keys(defaults.specifications).forEach(key => {
    if (key in defaults) result[key] = saved[key] ?? saved.specifications?.[key] ?? defaults[key];
  });
  result.engineType = saved.engineType ?? saved.specifications?.engineType ?? saved.specifications?.engine ?? defaults.engineType;
  if (Array.isArray(saved.features)) result.features.technology = saved.features;
  return result;
}

export async function uploadSubmissionFile({ apiBase, token, file, folder, attempts = 3, retryDelay = 500 }) {
  if (!token) throw new Error('Your session has expired. Please log in again before uploading.');
  if (file.type.startsWith('image/')) file = await prepareListingPhoto(file);
  // Keep multipart overhead below the serverless request body limit.
  if (file.size > 4 * 1024 * 1024) throw new Error('This file is too large to upload. Please choose a file under 4MB.');
  const body = new FormData();
  body.append('image0', file);
  body.append('folder', folder);
  body.append('uploadId', window.crypto?.randomUUID?.() || `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(`${submissionApiBase(apiBase)}/api/user/upload-images`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body, signal: controller.signal
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success && result.images?.[0]?.url) return result.images[0];
      const message = response.status === 413 ? 'The upload was rejected because the file is too large. Please choose a smaller photo or PDF.'
        : response.status === 401 || response.status === 403 ? 'Your session has expired. Please log in again and retry.'
        : result.message || `The upload service returned an error (${response.status}). Please try again.`;
      throw Object.assign(new Error(message), { retryable: [408, 429, 502, 503, 504].includes(response.status) });
    } catch (error) {
      const connectionFailure = error.name === 'AbortError' || error instanceof TypeError;
      if (attempt + 1 >= attempts || !(connectionFailure || error.retryable)) {
        if (connectionFailure) throw new Error('The upload service could not finish this photo. Your photos are still selected. Please retry; this can also happen when the upload service is temporarily unavailable.');
        throw error;
      }
    } finally { clearTimeout(timeout); }
    await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
  }
}

export function applyProfileToForm(current, profile, fillSellerType = true) {
  const fill = (existing = {}, available = {}) => ({ ...existing, ...Object.fromEntries(
    Object.entries(available || {}).filter(([key, value]) => !existing?.[key] && value != null && value !== '')
  ) });
  const contact = fill(current.contact, { ...profile.contact, sellerName: profile.sellerName });
  contact.location = fill(current.contact?.location, profile.contact?.location);
  return {
    ...current, contact,
    location: fill(current.location, profile.contact?.location),
    profilePicture: current.profilePicture || profile.profilePicture || '',
    sellerType: fillSellerType ? (profile.sellerType || current.sellerType) : current.sellerType,
    businessInfo: fill(current.businessInfo, profile.businessInfo),
    privateSeller: fill(current.privateSeller, profile.privateSeller),
    social: fill(current.social, profile.social)
  };
}
