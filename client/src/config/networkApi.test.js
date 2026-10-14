import { normalizeUrlPath } from './axios.js';
jest.mock('axios', () => ({ create: () => ({
  interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } }
}) }));

test('network and activity calls never duplicate a configured API prefix', () => {
  expect(normalizeUrlPath('/api/users/network', 'https://example.test/api')).toBe('/users/network');
  expect(normalizeUrlPath('/api/users/activity', 'https://example.test/api/')).toBe('/users/activity');
  expect(normalizeUrlPath('/api/feed', 'https://example.test')).toBe('/api/feed');
  expect(normalizeUrlPath('/auth/me', 'https://example.test/api')).toBe('/auth/me');
});
