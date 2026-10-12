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

export async function uploadSubmissionFile({ apiBase, token, file, folder }) {
  // Keep multipart overhead below the serverless request body limit.
  if (file.size > 4 * 1024 * 1024) throw new Error('This file is too large to upload. Please choose a file under 4MB.');
  const body = new FormData();
  body.append('image0', file);
  body.append('folder', folder);
  const response = await fetch(`${apiBase}/api/user/upload-images`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.success || !result.images?.[0]?.url) {
    throw new Error(`Upload failed (${response.status}): ${result.message || 'Please try again.'}`);
  }
  return result.images[0];
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
