import { imageUrl, prioritizeProfiles, photoScore, profilePhotoSources, profileCoverSources, publicProfilePath } from './networkProfiles.js';

test('ranks both photos first, then one photo, preserving order for equal scores', () => {
  const members = [
    { id: 'none', avatar: {} },
    { id: 'avatar', avatar: { url: 'https://images.test/avatar.jpg' } },
    { id: 'both', profilePicture: '/avatar.jpg', coverPicture: { url: '/cover.jpg' } },
    { id: 'cover', coverPicture: 'https://images.test/cover.jpg' },
  ];
  expect(prioritizeProfiles(members).map(u => u.id)).toEqual(['both', 'avatar', 'cover', 'none']);
  expect(members[0].id).toBe('none');
});

test('empty and unsafe image values do not earn photo priority', () => {
  for (const value of [undefined, {}, { url: '' }, '   ', 'javascript:alert(1)']) {
    expect(imageUrl(value)).toBeNull();
    expect(photoScore({ avatar: value, coverPicture: value })).toBe(0);
  }
});

test('engagement outweighs complete photos and keeps server order for equal scores', () => {
  const users = [
    { id: 'photos', avatar: '/avatar.jpg', coverPicture: '/cover.jpg', engagementScore: 0 },
    { id: 'active', engagementScore: 12 },
    { id: 'tie', engagementScore: 12 }
  ];
  expect(prioritizeProfiles(users).map(u => u.id)).toEqual(['active', 'tie', 'photos']);
});

test('stored bucket photos prefer resized thumbnails and retain alternate originals', () => {
  const member = { _id: '69d74c610bfde4c36f0a9001', avatar: 'https://i3wcarculture-images.s3.us-east-1.amazonaws.com/avatar.jpg', profilePicture: 'https://images.test/alternate.jpg', coverPicture: 'https://i3wcarculture-images.s3.us-east-1.amazonaws.com/cover.jpg' };
  expect(profilePhotoSources(member)[0]).toContain(`/api/users/${member._id}/avatar?v=`);
  expect(profilePhotoSources(member).slice(1)).toEqual([member.avatar, member.profilePicture]);
  expect(profileCoverSources(member)[0]).toContain('/cover?v=');
  expect(publicProfilePath(member)).toBe(`/members/${member._id}`);
});
