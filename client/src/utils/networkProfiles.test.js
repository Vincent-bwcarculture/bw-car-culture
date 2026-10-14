import { imageUrl, prioritizeProfiles, photoScore } from './networkProfiles.js';

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
