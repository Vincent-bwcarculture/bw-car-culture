export const imageUrl = value => {
  const url = typeof value === 'string' ? value : value?.url;
  return typeof url === 'string' && /^(https?:\/\/|\/)/i.test(url.trim()) ? url.trim() : null;
};
export const profileAvatar = user => imageUrl(user.avatar) || imageUrl(user.profilePicture);
export const profileCover = user => imageUrl(user.coverPicture);
export const publicProfilePath = user => `/members/${encodeURIComponent(user._id || user.id)}`;
const profileImageSources = (user, kind) => {
  const originals = [...new Set((kind === 'cover' ? [profileCover(user)] : [imageUrl(user.avatar), imageUrl(user.profilePicture)]).filter(Boolean))];
  const id = String(user._id || user.id || '');
  if (!/^[a-f0-9]{24}$/i.test(id) || !originals.some(url => url.includes('i3wcarculture-images.s3.us-east-1.amazonaws.com/'))) return originals;
  const base = (process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app').replace(/\/$/, '').replace(/\/api$/, '');
  const version = originals.join('|').split('').reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) | 0, 0);
  return [`${base}/api/users/${id}/${kind}?v=${version}`, ...originals];
};
export const profilePhotoSources = user => profileImageSources(user, 'avatar');
export const profileCoverSources = user => profileImageSources(user, 'cover');
export const photoScore = user => Number(Boolean(profileAvatar(user))) + Number(Boolean(profileCover(user)));
export const prioritizeProfiles = users => [...users].sort((a, b) => (Number(b.engagementScore) || 0) - (Number(a.engagementScore) || 0) || photoScore(b) - photoScore(a));
