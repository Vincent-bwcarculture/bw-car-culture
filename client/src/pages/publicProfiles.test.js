import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import PublicProfilePage from './PublicProfilePage.js';
import ProfilePhoto from '../components/profile/ProfilePhoto.js';
import axios from '../config/axios.js';
import { useAuth } from '../context/AuthContext.js';
jest.mock('../config/axios.js', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('../context/AuthContext.js', () => ({ useAuth: jest.fn() }));
jest.mock('react-router-dom', () => ({ useParams: () => ({ userId: 'public-member' }),
  Link: ({ to, children, className }) => <a href={to} className={className}>{children}</a>
}), { virtual: true });
let root, container;
const member = { _id: 'public-member', name: 'Public Member', role: 'user', bio: 'Weekend drives', city: 'Gaborone',
  followerCount: 2, followingCount: 1, associateCount: 1, postCount: 1, recentPosts: [{ _id: 'post', content: 'My latest road trip', createdAt: '2026-10-14' }] };
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  useAuth.mockReturnValue({ user: null, isAuthenticated: false });
  axios.get.mockResolvedValue({ data: { success: true, data: member } });
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

test('guests can read the public page and posts without a modal or account', async () => {
  await act(async () => root.render(<PublicProfilePage />));
  expect(container.querySelector('h1').textContent).toBe('Public Member');
  expect(container.textContent).toContain('My latest road trip');
  expect(container.querySelector('dialog')).toBeNull();
  expect(container.querySelector('a[href="/login"]').textContent).toContain('Follow');
});
test('a restricted profile shows an unavailable state without profile details', async () => {
  axios.get.mockRejectedValue({ status: 404 });
  await act(async () => root.render(<PublicProfilePage />));
  expect(container.textContent).toContain('private or no longer available');
  expect(container.textContent).not.toContain('Weekend drives');
});
test('follow failures keep the original visible count', async () => {
  useAuth.mockReturnValue({ user: { _id: 'viewer' }, isAuthenticated: true });
  axios.post.mockRejectedValue(new Error('offline'));
  await act(async () => root.render(<PublicProfilePage />));
  const follow = [...container.querySelectorAll('button')].find(button => button.textContent === 'Follow');
  await act(async () => follow.click());
  expect(container.querySelector('.public-profile-stats dd').textContent).toBe('2');
  expect(container.textContent).toContain('Could not update your follow');
});
test('photo failures try the alternate image and end with an icon instead of abbreviations', async () => {
  await act(async () => root.render(<ProfilePhoto member={{ name: 'Member', avatar: 'https://images.test/broken.jpg', profilePicture: 'https://images.test/alternate.jpg' }} />));
  expect(container.querySelector('img').src).toContain('broken.jpg');
  await act(async () => container.querySelector('img').dispatchEvent(new Event('error')));
  expect(container.querySelector('img').src).toContain('alternate.jpg');
  await act(async () => container.querySelector('img').dispatchEvent(new Event('error')));
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('[aria-label="No profile photo"]')).not.toBeNull();
  expect(container.textContent).toBe('');
});
