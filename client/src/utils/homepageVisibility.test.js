import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useNavigate } from 'react-router-dom';
import { http } from '../config/axios.js';
import HomeServicesSection from '../components/features/HomeServicesSection/HomeServicesSection.js';
import HeroSection from '../components/layout/HeroSection/HeroSection.js';
import CarBackground3D from '../components/layout/HeroSection/CarBackground3D.js';
import HeroJourney from '../components/layout/HeroSection/HeroJourney.js';

jest.mock('react-router-dom', () => ({ useNavigate: jest.fn() }), { virtual: true });
jest.mock('../config/axios.js', () => ({ http: { get: jest.fn() } }));
jest.mock('../components/shared/BusinessCard/BusinessCard.js', () => ({ business }) => <div>{business.businessName}</div>);
jest.mock('../components/layout/HeroSection/CarBackground3D.js', () => jest.fn(() => null));
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
  expect(container.querySelector('.bcc-hero-slogan').textContent.trim()).toBe('THE VEHICLE YOU WANT, WHEREVER IT IS. QUALITY YOU CAN TRUST. SERVICE YOU DESERVE.');
  expect(container.querySelector('h1').textContent).toBe('Find your perfect car.');
  const tabs = [...container.querySelectorAll('.bcc-hero-tab-button')];
  expect(tabs.map(button => button.textContent.trim())).toEqual(['Buy a car', 'Sell my car']);
  await act(async () => tabs[1].click());
  expect(tabs[1].getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('[id^="rental-"], [id^="transport-"]')).toBeNull();
});

test('hero shifts to showroom only after the model is ready and restores fallback if it is lost', async () => {
  await act(async () => root.render(<HeroSection />));
  const section = container.querySelector('.bcc-hero-section');
  expect(section.classList.contains('bcc-hero--showroom')).toBe(false);
  const ready = CarBackground3D.mock.calls.at(-1)[0].onReadyChange;
  await act(async () => ready(true));
  expect(section.classList.contains('bcc-hero--showroom')).toBe(true);
  await act(async () => container.querySelectorAll('.bcc-hero-tab-button')[1].click());
  expect(section.classList.contains('bcc-hero--showroom')).toBe(false);
  await act(async () => container.querySelectorAll('.bcc-hero-tab-button')[0].click());
  expect(section.classList.contains('bcc-hero--showroom')).toBe(true);
  await act(async () => ready(false));
  expect(section.classList.contains('bcc-hero--showroom')).toBe(false);
  expect(container.querySelector('[aria-label="Search for vehicles"]')).not.toBeNull();
});

test('hero search lets visitors finish typing and submits the current value with Search or Enter', async () => {
  jest.useFakeTimers();
  try {
    await act(async () => root.render(<HeroSection />));
    const input = container.querySelector('[aria-label="Search for vehicles"]');
    const type = async value => {
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    };
    await type('BMW X5');
    await act(async () => jest.advanceTimersByTime(1000));
    expect(navigate).not.toHaveBeenCalled();
    await act(async () => container.querySelector('[aria-label="Search vehicles"]').click());
    expect(navigate).toHaveBeenLastCalledWith('/marketplace?search=BMW+X5');
    await type('2020');
    await act(async () => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(navigate).toHaveBeenLastCalledWith('/marketplace?minYear=2020&maxYear=2020');
  } finally { jest.useRealTimers(); }
});

describe('ownership journey', () => {
  let onColourChange, onWheelChange, onInteriorChange, onPlayingChange, preference;
  beforeEach(() => {
    jest.useFakeTimers();
    preference = { matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() };
    window.matchMedia = jest.fn(() => preference);
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    onColourChange = jest.fn(); onWheelChange = jest.fn(); onInteriorChange = jest.fn(); onPlayingChange = jest.fn();
  });
  afterEach(() => { jest.useRealTimers(); delete window.matchMedia; });
  const renderJourney = async (modelReady = true) => {
    await act(async () => root.render(<HeroJourney modelReady={modelReady} onColourChange={onColourChange} onWheelChange={onWheelChange} onInteriorChange={onInteriorChange} onPlayingChange={onPlayingChange} />));
  };
  const advance = async time => { await act(async () => jest.advanceTimersByTime(time)); };
  const current = () => container.querySelector('.is-current > button').textContent;

  test('automatically progresses to customization and cycles real paint selections', async () => {
    await renderJourney();
    expect(current()).toContain('Select your vehicle');
    await advance(6000);
    expect(current()).toContain('Make it yours');
    await advance(2400);
    expect(onColourChange).toHaveBeenLastCalledWith('#e9e6df');
    expect(container.querySelector('[aria-label="Pearl White"]').getAttribute('aria-pressed')).toBe('true');
    await advance(12000);
    expect(current()).toContain('Await your delivery');
  });

  test('manual colour selection pauses the tour and remains selected', async () => {
    await renderJourney(); await advance(6000);
    await act(async () => container.querySelector('[aria-label="Crimson Red"]').click());
    await advance(30000);
    expect(current()).toContain('Make it yours');
    expect(onColourChange).toHaveBeenLastCalledWith('#9d172d');
    expect(container.querySelector('.bcc-journey-playback').textContent).toContain('Play journey');
    expect(onPlayingChange).toHaveBeenLastCalledWith(false);
  });

  test('automatic customization demonstrates wheel finishes and interior accents before delivery', async () => {
    await renderJourney(); await advance(6000); await advance(4800);
    expect(container.querySelector('[aria-label="Preview vehicle wheel finish"]')).not.toBeNull();
    await advance(2400);
    expect(onWheelChange).toHaveBeenLastCalledWith('#b5bcc3');
    await advance(2400);
    expect(container.querySelector('[aria-label="Preview vehicle interior accent"]')).not.toBeNull();
    await advance(2400);
    expect(onInteriorChange).toHaveBeenLastCalledWith('#a56435');
    await advance(2400);
    expect(current()).toContain('Await your delivery');
  });

  test('selecting a journey step pauses it and Play resumes from that step', async () => {
    await renderJourney();
    await act(async () => container.querySelectorAll('.bcc-journey-steps li > button')[3].click());
    await advance(20000); expect(current()).toContain('Expect exceptional care');
    await act(async () => container.querySelector('.bcc-journey-playback').click());
    await advance(6000); expect(current()).toContain('Enjoy the road ahead');
  });

  test('wheel and interior controls update their own finishes and retain the paint selection', async () => {
    await renderJourney();
    await act(async () => container.querySelectorAll('.bcc-journey-steps li > button')[1].click());
    await act(async () => container.querySelector('[aria-label="Crimson Red"]').click());
    await act(async () => [...container.querySelectorAll('.bcc-journey-parts button')].find(button => button.textContent === 'Wheels').click());
    await act(async () => container.querySelector('[aria-label="Warm Bronze"]').click());
    expect(onWheelChange).toHaveBeenLastCalledWith('#9c7649');
    await act(async () => [...container.querySelectorAll('.bcc-journey-parts button')].find(button => button.textContent === 'Interior').click());
    await act(async () => container.querySelector('[aria-label="Cognac"]').click());
    expect(onInteriorChange).toHaveBeenLastCalledWith('#a56435');
    expect(onColourChange).toHaveBeenLastCalledWith('#9d172d');
    await advance(30000);
    expect(current()).toContain('Make it yours');
  });

  test('reduced motion disables automatic playback but allows choosing a paint colour', async () => {
    preference.matches = true;
    await renderJourney(); await advance(30000);
    expect(current()).toContain('Select your vehicle');
    expect(container.querySelector('.bcc-journey-playback')).toBeNull();
    await act(async () => container.querySelectorAll('.bcc-journey-steps li > button')[1].click());
    await act(async () => container.querySelector('[aria-label="Graphite"]').click());
    expect(onColourChange).toHaveBeenLastCalledWith('#353940');
    expect(onPlayingChange).toHaveBeenLastCalledWith(false);
  });

  test('fallback without a model stays readable without automatic playback or a disconnected palette', async () => {
    await renderJourney(false); await advance(30000);
    expect(current()).toContain('Select your vehicle');
    await act(async () => container.querySelectorAll('.bcc-journey-steps li > button')[1].click());
    expect(container.textContent).toContain('Explore colours and finishing touches');
    expect(container.querySelector('.bcc-journey-swatches')).toBeNull();
    expect(container.querySelector('.bcc-journey-playback')).toBeNull();
  });

  test('hidden pages stop advancing and unmount clears every tour timer', async () => {
    await renderJourney();
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    await advance(30000); expect(current()).toContain('Select your vehicle');
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
    await advance(6000); expect(current()).toContain('Make it yours');
    await act(async () => root.render(null));
    jest.runAllTicks();
    expect(jest.getTimerCount()).toBe(0);
  });
});
