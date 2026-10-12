import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useNavigate } from 'react-router-dom';
import { http } from '../config/axios.js';
import HomeServicesSection from '../components/features/HomeServicesSection/HomeServicesSection.js';
import HeroSection from '../components/layout/HeroSection/HeroSection.js';

jest.mock('react-router-dom', () => ({ useNavigate: jest.fn() }), { virtual: true });
jest.mock('../config/axios.js', () => ({ http: { get: jest.fn() } }));
jest.mock('../components/shared/BusinessCard/BusinessCard.js', () => ({ business }) => <div>{business.businessName}</div>);
jest.mock('../components/layout/HeroSection/CarBackground3D.js', () => () => null);
jest.mock('../context/AuthContext.js', () => ({ useAuth: () => ({ isAuthenticated: true }) }));
jest.mock('../services/statsService.js', () => ({ statsService: { getWebsiteStats: async () => ({}) } }));
jest.mock('../services/dealerService.js', () => ({ dealerService: { getDealers: async () => ({ dealers: [] }) } }));

let container, root, navigate;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
  navigate = jest.fn(); useNavigate.mockReturnValue(navigate); http.get.mockReset();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(async () => {
  await act(async () => root.unmount()); container.remove(); jest.restoreAllMocks();
});

test('homepage services remain hidden while workshops are loading', async () => {
  http.get.mockReturnValue(new Promise(() => {}));
  await act(async () => root.render(<HomeServicesSection />));
  expect(container.innerHTML).toBe('');
});

test.each([
  { name: 'empty results', providers: [] },
  { name: 'rentals only', providers: [{ _id: 'rental', providerType: 'car_rental', status: 'active' }] },
  { name: 'inactive workshop', providers: [{ _id: 'inactive', providerType: 'workshop', status: 'inactive' }] }
])('homepage services stay hidden without active workshops: $name', async ({ providers }) => {
  http.get.mockResolvedValue({ data: { success: true, data: providers } });
  await act(async () => root.render(<HomeServicesSection />));
  expect(container.innerHTML).toBe('');
});

test('failed provider requests leave no empty or error section on the homepage', async () => {
  http.get.mockRejectedValue(new Error('Temporarily unavailable'));
  await act(async () => root.render(<HomeServicesSection />));
  expect(http.get).toHaveBeenCalledTimes(2);
  expect(container.innerHTML).toBe('');
});

test('active workshops reveal the section and View All opens the workshop category', async () => {
  http.get.mockResolvedValue({ data: { success: true, data: [
    { _id: 'workshop', providerType: 'workshop', status: 'active', businessName: 'Active Workshop' },
    { _id: 'rental', providerType: 'car_rental', status: 'active', businessName: 'Rental Company' },
    { _id: 'transport', providerType: 'public_transport', status: 'active', businessName: 'Transport Company' }
  ] } });
  await act(async () => root.render(<HomeServicesSection />));
  expect(container.textContent).toContain('Active Workshop');
  expect(container.textContent).not.toMatch(/Rental Company|Transport Company|Car Rentals/);
  const query = new URLSearchParams(http.get.mock.calls[0][0].split('?')[1]);
  expect(query.get('providerType')).toBe('workshop'); expect(query.get('status')).toBe('active');
  await act(async () => container.querySelector('.home-services-view-all').click());
  expect(navigate).toHaveBeenCalledWith('/services?category=workshops');
});

test('hero offers Buy and Sell without rental or public transport tabs and forms', async () => {
  await act(async () => root.render(<HeroSection />));
  const tabs = [...container.querySelectorAll('.bcc-hero-tab-button')];
  expect(tabs.map(button => button.textContent.trim())).toEqual(['Buy a car', 'Sell my car']);
  await act(async () => tabs[1].click());
  expect(tabs[1].getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('[id^="rental-"], [id^="transport-"]')).toBeNull();
});
