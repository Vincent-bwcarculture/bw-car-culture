import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import axios from '../../config/axios.js';
import NetworkTab from './NetworkTab.js';

jest.mock('../../config/axios.js', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('react-router-dom', () => ({ useSearchParams: () => [new URLSearchParams()] }), { virtual: true });
jest.mock('./MemberProfileDialog.js', () => () => null);
jest.mock('../shared/UserCard/UserCard.js', () => ({ user, onFollowToggle, isFollowing }) => (
  <button onClick={onFollowToggle}>{user.name}: {user.followerCount} {isFollowing ? 'following' : 'follow'}</button>
));

let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers();
  jest.clearAllMocks();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});
const response = name => ({ data: { success: true, data: [{ _id: 'member', name, followerCount: 4 }], total: 1 } });
const renderNetwork = async () => {
  await act(async () => { root.render(<NetworkTab profileData={{ _id: 'me' }} />); });
  await act(async () => { jest.advanceTimersByTime(350); });
};

test('failed follow restores the original count and reports the failure', async () => {
  axios.get.mockResolvedValue(response('Member'));
  axios.post.mockRejectedValue(new Error('offline'));
  await renderNetwork();
  const follow = [...container.querySelectorAll('button')].find(b => b.textContent.includes('Member:'));
  await act(async () => follow.click());
  expect(container.textContent).toContain('Member: 4 follow');
  expect(container.querySelector('[role="alert"]').textContent).toContain('Could not update');
  expect(axios.get).toHaveBeenCalledTimes(1);
});

test('an older pending response cannot overwrite a newer request', async () => {
  let resolveOld;
  axios.get.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
  await renderNetwork();
  // Switch the current account while the first request is in flight.
  axios.get.mockResolvedValue(response('New result'));
  await act(async () => root.render(<NetworkTab profileData={{ _id: 'updated-me' }} />));
  await act(async () => { jest.advanceTimersByTime(350); });
  await act(async () => resolveOld(response('Old result')));
  expect(container.textContent).toContain('New result');
  expect(container.textContent).not.toContain('Old result');
});
