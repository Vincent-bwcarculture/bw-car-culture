import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import CarMarketplace from '../components/features/MarketplaceSection/CarMarketPlace.js';
import { listingService } from '../services/listingService.js';
import { useParams } from 'react-router-dom';
import { readStoredArray, vehicleImages, internationalPhone, normalizeVehicleDetail, vehiclePrice, privateVehicleSeller } from './vehicleDetail.js';
jest.mock('react-router-dom', () => ({ useParams: jest.fn(), useNavigate: () => jest.fn() }), {virtual:true});
jest.mock('react-redux', () => ({ useDispatch: () => jest.fn() }));
jest.mock('../context/AuthContext.js', () => ({ useAuth: () => ({ user: null }) }));
jest.mock('../hooks/useSEO.js', () => ({ buildHelmet: () => null, SITE_URL: 'https://site.test' }));
jest.mock('../services/listingService.js', () => ({ listingService: { getListing: jest.fn(), getDealerListings: jest.fn(async () => []), getListings: jest.fn(), incrementViewCount: jest.fn(async () => true) } }));
jest.mock('../services/newsService.js', () => ({ newsService: { getArticles: jest.fn(async () => ({ articles: [] })) } }));
jest.mock('../services/dealerService.js', () => ({ dealerService: { getDealers: jest.fn(async () => ({ dealers: [] })) } }));
jest.mock('../components/shared/VehicleCard/VehicleCard.js', () => ({ car, onShare }) => <button onClick={() => onShare(car)}>Share related {car.title}</button>);
jest.mock('../components/shared/ShareModal.js', () => ({ car }) => <div data-testid="share-target">{car.title}</div>);
jest.mock('../components/shared/ErrorBoundary/ErrorBoundary.js', () => ({ children }) => children);

let root, container;
const vehicle = id => ({ _id: id, title: `Vehicle ${id}`, status: 'active', price: '120000', specifications: { make: 'Toyota', mileage: 0 },
  dealer: { sellerType: 'private', businessName: 'Private Seller' }, contact: { phone: '71234567' }, location: { country: 'Botswana' },
  images: [{ url: 'https://fixture.test/one.jpg' }, { url: 'https://fixture.test/two.jpg', isPrimary: true }] });
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true; localStorage.clear(); jest.clearAllMocks(); window.gtag=jest.fn();
  useParams.mockReturnValue({ carId: 'A' });
  listingService.getListing.mockImplementation(async id => vehicle(id));
  listingService.incrementViewCount.mockResolvedValue(true);
  listingService.getListings.mockResolvedValue({ listings: [{ ...vehicle('related'), title: 'Related car' }] });
  global.ResizeObserver = class { observe() {} disconnect() {} };
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const render = async revision => { await act(async () => root.render(<CarMarketplace revision={revision} />)); };
const click = async element => { await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true }))); };

test('private detail survives corrupt saved data, incomplete seller contacts, and preserves zero mileage and cover photo', async () => {
  localStorage.setItem('savedCars', '{invalid'); await render();
  expect(container.querySelector('h1').textContent).toBe('Vehicle A');
  expect(container.querySelector('.specs-grid').textContent).toContain('0 km');
  expect(container.querySelector('.gallery-image').src).toContain('two.jpg');
  expect(container.querySelector('.mp-detail-price').textContent).toBe('P 120,000');
  expect(listingService.getDealerListings).not.toHaveBeenCalled();
  expect(window.gtag).toHaveBeenCalledWith('event','listing_view',expect.objectContaining({seller_type:'private'}));
});
test('sharing a related vehicle leaves the current detail intact', async () => {
  await render(); await click([...container.querySelectorAll('button')].find(button => button.textContent === 'Share related Related car'));
  expect(container.querySelector('[data-testid="share-target"]').textContent).toBe('Related car');
  expect(container.querySelector('h1').textContent).toBe('Vehicle A');
  expect(container.querySelector('.gallery-image').src).toContain('two.jpg');
});
test('slow recommendations do not block the vehicle detail', async () => {
  listingService.getListings.mockReturnValue(new Promise(() => {})); await render();
  expect(container.querySelector('h1').textContent).toBe('Vehicle A');
});
test('navigation ignores a late response for the previous vehicle', async () => {
  let finish;
  listingService.getListing.mockImplementation(id => id === 'A' ? new Promise(resolve => { finish = resolve; }) : Promise.resolve(vehicle(id)));
  await render(1); useParams.mockReturnValue({ carId: 'B' }); await render(2);
  await act(async () => finish(vehicle('A')));
  expect(container.querySelector('h1').textContent).toBe('Vehicle B');
  expect(listingService.incrementViewCount).toHaveBeenCalledWith('B');
  expect(listingService.incrementViewCount).not.toHaveBeenCalledWith('A');
});
test('fullscreen supports keyboard navigation and restores scrolling on unmount', async () => {
  await render(); document.body.style.overflow = 'auto';
  await click(container.querySelector('[aria-label="View full image"]'));
  expect(document.body.style.overflow).toBe('hidden');
  await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })));
  expect(container.querySelector('.fullscreen-counter').textContent).toBe('2 / 2');
  await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  expect(document.body.style.overflow).toBe('auto');
  await click(container.querySelector('[aria-label="View full image"]'));
  await act(async () => root.render(null)); expect(document.body.style.overflow).toBe('auto');
});
test('storage, image and price normalization tolerate legacy values without exposing POA amounts', () => {
  localStorage.setItem('savedCars', '{}'); expect(readStoredArray('savedCars')).toEqual([]);
  expect(vehicleImages({ images: [null, { key: 'vehicle/photo.jpg' }] })[0]).toContain('/api/images/s3-proxy/vehicle/photo.jpg');
  expect(vehicleImages({ images: ['https://cdn.test/images/folder/images/photo.jpg'] })[0]).toBe('https://cdn.test/images/folder/images/photo.jpg');
  expect(normalizeVehicleDetail({ price: 'invalid', features: 'ABS', mileage: 0 }).features).toEqual([]);
  expect(vehiclePrice({ price: 120000, priceType: 'poa' })).toBe('POA');
  expect(privateVehicleSeller({ sellerType: 'dealership', dealer: { businessName: 'Jane Smith' } })).toBe(false);
});
test('contact links handle Botswana and international phone formats without duplicate country codes', () => {
  expect(internationalPhone('71 234 567')).toBe('26771234567');
  expect(internationalPhone('+27 (82) 123-4567')).toBe('27821234567');
  expect(internationalPhone('0027 82 123 4567')).toBe('27821234567');
  expect(internationalPhone('27821234567')).toBe('27821234567');
  expect(internationalPhone('0821234567', 'South Africa')).toBe('27821234567');
  expect(internationalPhone('N/A')).toBeNull();
});
