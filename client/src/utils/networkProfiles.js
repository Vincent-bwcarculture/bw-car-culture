export const imageUrl = value => {
  const url = typeof value === 'string' ? value : value?.url;
  return typeof url === 'string' && /^(https?:\/\/|\/)/i.test(url.trim()) ? url.trim() : null;
};
export const profileAvatar = user => imageUrl(user.avatar) || imageUrl(user.profilePicture);
export const profileCover = user => imageUrl(user.coverPicture);
export const photoScore = user => Number(Boolean(profileAvatar(user))) + Number(Boolean(profileCover(user)));
export const prioritizeProfiles = users => [...users].sort((a, b) => (Number(b.engagementScore) || 0) - (Number(a.engagementScore) || 0) || photoScore(b) - photoScore(a));
