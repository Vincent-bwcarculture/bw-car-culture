import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import UserCarListingForm from '../components/profile/UserCarListingForm.js';
import SubmissionEditModal from '../components/profile/SubmissionEditModal.js';
import { uploadSubmissionFile } from './submissionForm.js';
import { SubmissionEditNotice, SubmissionListingStats, PaymentProofPreview, SubmissionBoostProof } from '../Admin/components/SubmissionReviewDetails.js';
import { listingService } from '../services/listingService.js';

jest.mock('../config/axios.js', () => ({ create: () => ({ post: jest.fn() }) }));

const listingData = () => ({
  title: 'Toyota Corolla for sale', description: 'Well maintained family vehicle',
  pricing: { price: 85000 }, specifications: { make: 'Toyota', model: 'Corolla', year: 2020,
    transmission: 'manual', fuelType: 'diesel', numberOfSeats: 2 },
  contact: { sellerName: 'Seller', phone: '+26712345678' },
  images: [{ url: 'https://images.example/existing.jpg' }],
  features: { safety: ['ABS'] }, privateSeller: null, businessInfo: null
});
let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
  localStorage.setItem('token', 'test-token');
  localStorage.removeItem('viewedListings');
  listingService.pendingRequests = {};
  listingService.axios.post.mockReset();
  global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ success: false }) }));
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => {
  await act(async () => root.unmount()); container.remove(); jest.restoreAllMocks();
});
async function render(element) { await act(async () => root.render(element)); }
async function submit() {
  await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
}

test('edit modal loads nested values and saves listing data without creating a new submission', async () => {
  const onSave = jest.fn(async () => {});
  await render(<SubmissionEditModal isOpen submission={{ status: 'pending_review', listingData: listingData() }} onSave={onSave} />);
  expect(container.querySelector('[name="price"]').value).toBe('85000');
  await submit();
  expect(fetch).not.toHaveBeenCalled();
  expect(onSave).toHaveBeenCalledTimes(1);
  const saved = onSave.mock.calls[0][0].listingData;
  expect(saved.pricing.price).toBe(85000);
  expect(saved.specifications.transmission).toBe('manual');
  expect(saved.specifications.numberOfSeats).toBe(2);
  expect(saved.images[0].url).toBe('https://images.example/existing.jpg');
  expect(saved.features.safety).toEqual(['ABS']);
});

test('failed edit keeps values and allows retry', async () => {
  const onSubmit = jest.fn().mockRejectedValueOnce(new Error('Storage unavailable')).mockResolvedValueOnce({});
  await render(<UserCarListingForm isEdit initialData={listingData()} onSubmit={onSubmit} />);
  await submit();
  expect(container.textContent).toContain('Storage unavailable');
  expect(container.querySelector('[name="price"]').value).toBe('85000');
  await submit(); expect(onSubmit).toHaveBeenCalledTimes(2);
});

test('saved verified boost proof survives an edit without reupload or resetting verification', async () => {
  const data = listingData();
  data.featuredBoost = { requested: true, proofUrl: 'https://images.example/proof.pdf', status: 'verified', requestedAt: '2026-01-01' };
  const onSubmit = jest.fn(async () => {});
  await render(<UserCarListingForm isEdit initialData={data} onSubmit={onSubmit} />);
  await submit();
  expect(fetch).not.toHaveBeenCalled();
  expect(onSubmit.mock.calls[0][0].featuredBoost).toEqual(expect.objectContaining(data.featuredBoost));
});

test('proof upload failure blocks listing creation and leaves proof available for retry', async () => {
  const data = listingData(); data.featuredBoost = { requested: true };
  await render(<UserCarListingForm initialData={data} onSubmit={jest.fn()} />);
  const input = container.querySelector('input[accept*="application/pdf"]');
  Object.defineProperty(input, 'files', { value: [new File(['payment proof'], 'proof.pdf', { type: 'application/pdf' })] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  fetch.mockImplementation(async () => ({ ok: false, status: 503, json: async () => ({ message: 'Storage unavailable' }) }));
  await submit();
  expect(fetch.mock.calls.some(([url]) => url.includes('/submit-listing'))).toBe(false);
  expect(container.textContent).toContain('proof.pdf');
  expect(container.querySelector('[name="price"]').value).toBe('85000');
});

test('upload rejects oversized files before making a network request', async () => {
  const file = new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'proof.pdf', { type: 'application/pdf' });
  await expect(uploadSubmissionFile({ apiBase: '', token: 'test', file, folder: 'proof' })).rejects.toThrow('under 4MB');
  expect(fetch).not.toHaveBeenCalled();
});

test('new free listing creates one submission and reports completion after server success', async () => {
  const onSubmit = jest.fn();
  await render(<UserCarListingForm initialData={listingData()} onSubmit={onSubmit} />);
  fetch.mockImplementation(async () => ({ ok: true, status: 201,
    json: async () => ({ success: true, data: { submissionId: 'created-id' } }) }));
  await submit();
  const posts = fetch.mock.calls.filter(([url]) => url.includes('/submit-listing'));
  expect(posts).toHaveLength(1);
  expect(JSON.parse(posts[0][1].body).listingData.selectedPlan).toBe('free');
  const button = document.body.querySelector('.ulisting-modal-btn-primary');
  await act(async () => button.click());
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
});

test('retry after submission failure reuses an uploaded payment proof', async () => {
  const data = listingData(); data.featuredBoost = { requested: true };
  await render(<UserCarListingForm initialData={data} />);
  const input = container.querySelector('input[accept*="application/pdf"]');
  Object.defineProperty(input, 'files', { value: [new File(['proof'], 'proof.pdf', { type: 'application/pdf' })] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  fetch.mockImplementation(async url => url.includes('/upload-images')
    ? { ok: true, status: 200, json: async () => ({ success: true, images: [{ url: 'https://images.example/proof.pdf' }] }) }
    : { ok: false, status: 503, text: async () => 'Try again' });
  await submit(); await submit();
  expect(fetch.mock.calls.filter(([url]) => url.includes('/upload-images'))).toHaveLength(1);
  expect(fetch.mock.calls.filter(([url]) => url.includes('/submit-listing'))).toHaveLength(2);
});

test('rapid submit clicks are ignored while an edit is saving', async () => {
  let finish;
  const onSubmit = jest.fn(() => new Promise(resolve => { finish = resolve; }));
  await render(<UserCarListingForm isEdit initialData={listingData()} onSubmit={onSubmit} />);
  await act(async () => {
    const form = container.querySelector('form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  expect(onSubmit).toHaveBeenCalledTimes(1);
  await act(async () => finish());
});

test('removing a photo before the primary preserves the selected photo', async () => {
  const oldCreate = URL.createObjectURL, oldRevoke = URL.revokeObjectURL;
  URL.createObjectURL = jest.fn(file => `blob:${file.name}`);
  URL.revokeObjectURL = jest.fn();
  try {
    await render(<UserCarListingForm isEdit initialData={listingData()} />);
    const input = container.querySelector('#images');
    Object.defineProperty(input, 'files', { value: ['one', 'two', 'three'].map(name => new File(['photo'], `${name}.jpg`, { type: 'image/jpeg' })) });
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
    await act(async () => container.querySelectorAll('.ulisting-primary-btn')[1].click());
    await act(async () => container.querySelector('.ulisting-remove-btn').click());
    expect(container.querySelector('.ulisting-image-preview.primary img').getAttribute('src')).toBe('blob:three.jpg');
  } finally {
    URL.createObjectURL = oldCreate; URL.revokeObjectURL = oldRevoke;
  }
});

test('available profile information fills seller and business fields automatically', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {
    sellerName: 'Profile Seller', sellerType: 'dealership', contact: { phone: '123', email: 'seller@example.com',
      whatsapp: '456', location: { city: 'Gaborone' } }, businessInfo: { businessName: 'Saved Motors' },
    privateSeller: { firstName: 'Profile' }, social: { facebook: 'https://facebook.com/seller' }
  } }) });
  await render(<UserCarListingForm initialData={{ ...listingData(), contact: {} }} />);
  expect(container.querySelector('[name="contact.sellerName"]').value).toBe('Profile Seller');
  expect(container.querySelector('[name="contact.phone"]').value).toBe('123');
  expect(container.querySelector('[name="location.city"]').value).toBe('Gaborone');
  expect(fetch).toHaveBeenCalledTimes(1);
  await submit();
  const posted = fetch.mock.calls.find(([url]) => url.includes('/submit-listing'));
  const saved = JSON.parse(posted[1].body).listingData;
  expect(saved.sellerType).toBe('dealership');
  expect(saved.businessInfo.businessName).toBe('Saved Motors');
});

test('profile response preserves details already entered into the form', async () => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {
    sellerName: 'Profile Seller', contact: { phone: 'profile-phone', location: { city: 'Gaborone' } }
  } }) });
  await render(<UserCarListingForm initialData={listingData()} />);
  expect(container.querySelector('[name="contact.phone"]').value).toBe('+26712345678');
  expect(container.querySelector('[name="contact.sellerName"]').value).toBe('Seller');
  expect(container.querySelector('[name="location.city"]').value).toBe('Gaborone');
});

test('successful free submission needs no proof and retains contact details for another listing', async () => {
  await render(<UserCarListingForm initialData={listingData()} />);
  fetch.mockImplementation(async () => ({ ok: true, status: 201, json: async () => ({ success: true, data: { submissionId: 'created' } }) }));
  await submit();
  expect(fetch.mock.calls.some(([url]) => url.includes('/upload-images'))).toBe(false);
  expect(fetch.mock.calls.some(([url]) => url.includes('/profile/update-from-listing'))).toBe(true);
  expect(container.querySelector('[name="contact.phone"]').value).toBe('+26712345678');
  expect(container.querySelector('[name="title"]').value).toBe('');
});

test('admin review identifies live edits, shows published comparisons and actual statistics', async () => {
  const submission = { status: 'pending_review', listingId: 'published-id',
    editHistory: [{ editNote: 'Reduced price' }], reviewChanges: [{ field: 'Price (BWP)', before: '85000', after: '80000' }],
    listingStats: { available: true, views: 125, saves: 8, inquiries: 3 } };
  await render(<><SubmissionEditNotice submission={submission} showChanges /><SubmissionListingStats submission={submission} /></>);
  expect(container.textContent).toContain('Live listing edit awaiting review');
  expect(container.textContent).toContain('Reduced price');
  expect(container.textContent).toContain('85000'); expect(container.textContent).toContain('80000');
  expect(container.textContent).toContain('125 views');
  expect(container.textContent).toContain('8 saves');
});

test('PDF payment proofs open as documents instead of broken image previews', async () => {
  await render(<PaymentProofPreview url="https://images.example/proof.PDF?download=1" />);
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('a').textContent).toContain('PDF');
});

test('failed view requests remain retryable and successful requests are deduplicated', async () => {
  listingService.axios.post.mockRejectedValueOnce(new Error('Temporary failure'))
    .mockResolvedValueOnce({ data: { success: true, data: { views: 10 } } });
  expect(await listingService.incrementViewCount('private-listing')).toBe(false);
  expect(localStorage.getItem('viewedListings')).toBeNull();
  expect(await listingService.incrementViewCount('private-listing')).toBe(true);
  expect(await listingService.incrementViewCount('private-listing')).toBe(false);
  expect(listingService.axios.post).toHaveBeenCalledTimes(2);
});

test('concurrent view requests share one count and corrupted local storage does not block tracking', async () => {
  localStorage.setItem('viewedListings', 'invalid-json');
  listingService.axios.post.mockResolvedValue({ data: { success: true, data: { views: 10 } } });
  await Promise.all([listingService.incrementViewCount('private-listing'), listingService.incrementViewCount('private-listing')]);
  expect(listingService.axios.post).toHaveBeenCalledTimes(1);
});

test('admin card shows uploaded boost proof as pending until it is explicitly verified', async () => {
  const data = { listingData: { featuredBoost: { requested: true, proofUrl: 'https://images.example/proof.pdf' } } };
  await render(<SubmissionBoostProof submission={data} />);
  expect(container.textContent).toContain('awaiting verification');
  expect(container.querySelector('a').getAttribute('href')).toBe('https://images.example/proof.pdf');
  await render(<SubmissionBoostProof submission={{ ...data, paymentProof: { status: 'approved', proofUrl: 'https://images.example/proof.pdf' } }} />);
  expect(container.textContent).toContain('Boost payment verified');
  await render(<SubmissionBoostProof submission={{ ...data, paymentProof: { status: 'approved', proofUrl: 'https://images.example/older-proof.pdf' } }} />);
  expect(container.textContent).toContain('awaiting verification');
});

test('unavailable browser storage does not prevent a public listing view request', async () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage blocked'); });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
  listingService.axios.post.mockResolvedValue({ data: { success: true, data: { views: 10 } } });
  expect(await listingService.incrementViewCount('private-listing')).toBe(true);
  expect(listingService.axios.post).toHaveBeenCalledTimes(1);
});
