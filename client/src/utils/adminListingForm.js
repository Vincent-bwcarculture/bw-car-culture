export const ADMIN_LISTING_STATUSES = [
  { value: 'active', label: 'Live' }, { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending review' }, { value: 'sold', label: 'Sold' },
  { value: 'paused', label: 'Paused' }, { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' }, { value: 'published', label: 'Published' }
];
export const LISTING_FORM_SECTIONS = [
  { id: 'basic', label: 'Vehicle details', description: 'Give the listing a clear title and choose its seller and visibility.' },
  { id: 'specs', label: 'Specifications', description: 'Add the details buyers need to compare this vehicle.' },
  { id: 'features', label: 'Features', description: 'Select the equipment and extras included with the vehicle.' },
  { id: 'media', label: 'Photos & video', description: 'Add clear photos and choose the cover buyers will see first.' },
  { id: 'pricing', label: 'Pricing', description: 'Set the asking price and any finance options.' },
  { id: 'savings', label: 'Savings', description: 'Add a genuine discount and choose how it appears on the listing.' },
  { id: 'location', label: 'Location', description: 'Show where the vehicle is and provide delivery details.' },
  { id: 'seo', label: 'Search preview', description: 'Choose how this listing appears in search results.' },
  { id: 'records', label: 'Private records', description: 'Keep supplier information and internal notes for your team.' }
];
export const listingErrorSection = field => {
  if (field.startsWith('specifications.')) return 'specs';
  if (field.startsWith('location.')) return 'location';
  if (field === 'images') return 'media';
  if (/originalPrice|dealerDiscount|savings/.test(field)) return 'savings';
  if (field === 'price' || field.startsWith('priceOptions.')) return 'pricing';
  return 'basic';
};
export function listingFormErrors(data, imageCount, editing = false) {
  const errors = {};
  const required = { title: 'Listing title', 'specifications.make': 'Make', 'specifications.model': 'Model' };
  if (!editing) Object.assign(required, { description: 'Description', category: 'Category', dealer: 'Seller',
    'specifications.transmission': 'Transmission', 'specifications.fuelType': 'Fuel type', 'location.city': 'City', 'location.country': 'Country' });
  for (const [path, label] of Object.entries(required)) {
    const value = path.split('.').reduce((result, key) => result?.[key], data);
    if (!String(value ?? '').trim()) errors[path] = `${label} is required`;
  }
  const year = Number(data.specifications?.year), price = Number(data.price);
  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) errors['specifications.year'] = 'Enter a valid vehicle year';
  if (!data.priceOptions?.showPriceAsPOA && (!Number.isFinite(price) || price <= 0)) errors.price = 'Enter a price above zero or choose Price on Application';
  if (data.specifications?.mileage !== '' && data.specifications?.mileage != null && (!Number.isFinite(Number(data.specifications.mileage)) || Number(data.specifications.mileage) < 0)) errors['specifications.mileage'] = 'Mileage cannot be negative';
  if (data.priceOptions?.showSavings) {
    const original = Number(data.priceOptions.originalPrice), discount = Number(data.priceOptions.dealerDiscount);
    if (!original && !discount) errors['priceOptions.originalPrice'] = 'Enter an original price or a dealer discount';
    if (original && original <= price) errors['priceOptions.originalPrice'] = 'Original price must be higher than the asking price';
    if (discount && (!Number.isFinite(discount) || discount <= 0 || discount >= 100)) errors['priceOptions.dealerDiscount'] = 'Discount must be between 1% and 99%';
  }
  if (!imageCount) errors.images = 'Add at least one vehicle photo';
  return errors;
}
export const listingDateInput = value => value && Number.isFinite(new Date(value).getTime()) ? new Date(value).toISOString().slice(0, 10) : '';
export const listingQuality = value => Number.isFinite(Number(value)) ? Math.min(100, Math.max(0, Number(value))) : 50;
export const normalizeListingImage = (image, index) => ({ ...(typeof image === 'string' ? { url: image } : image), isExisting: true, id: image?._id ?? index });
