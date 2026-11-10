const API_BASE = (process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app').replace(/\/$/, '');
export const cleanContact = value => typeof value === 'string' && value.trim() && !['n/a', 'null', 'undefined'].includes(value.trim().toLowerCase()) ? value.trim() : null;
export function readStoredArray(key) {
  try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
export function vehicleImages(car) {
  const images = Array.isArray(car?.images) ? car.images : [];
  const ordered = [...images].sort((a, b) => Number(!!b?.isPrimary) - Number(!!a?.isPrimary));
  const urls = ordered.map(image => {
    const url = typeof image === 'string' ? image : image?.url || image?.thumbnail;
    if (url) return /^https?:\/\//i.test(url) || url.startsWith('/') ? url : `/${url}`;
    return image?.key ? `${API_BASE}/api/images/s3-proxy/${image.key}` : null;
  }).filter(Boolean);
  return urls.length ? urls : ['/images/placeholders/default.jpg'];
}
export function privateVehicleSeller(car) {
  const type = car?.sellerType || car?.dealer?.sellerType;
  if (type) return type === 'private';
  return car?.sourceType === 'user_submission' || !!car?.dealer?.privateSeller;
}
export function vehicleContact(car) {
  const snapshots = [car?.contact, car?.dealer?.contact, car?.dealerId?.contact, car?.dealer, car?.dealerId];
  const field = name => snapshots.map(item => cleanContact(item?.[name])).find(Boolean) || null;
  return { phone: field('phone'), whatsapp: field('whatsapp') || field('phone'), email: field('email'), website: field('website') };
}
export function internationalPhone(value, country = '') {
  const raw = cleanContact(value);
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return digits.length >= 8 && digits.length <= 15 ? digits : null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.length === 8) digits = `267${digits}`;
  else if (digits.startsWith('0') && digits.length === 10 && /^(south africa|za|rsa|sa)$/i.test(country)) digits = `27${digits.slice(1)}`;
  return digits.length >= 8 && digits.length <= 15 && !digits.startsWith('0') ? digits : null;
}
export const vehiclePrice = car => car?.priceOptions?.showPriceAsPOA || car?.priceType === 'poa' ? 'POA'
  : Number.isFinite(Number(car?.price)) && Number(car?.price) > 0 ? `P ${Number(car.price).toLocaleString()}` : 'Price on request';
export function normalizeVehicleDetail(value) {
  const car = { ...value, specifications: { ...value.specifications }, priceOptions: { ...value.priceOptions } };
  for (const name of ['make', 'model', 'year', 'mileage']) car.specifications[name] ??= value[name];
  const price = Number(value.price);
  car.price = Number.isFinite(price) && price >= 0 ? price : 0;
  for (const name of ['originalPrice', 'savingsAmount', 'savingsPercentage', 'monthlyPayment']) {
    const value = Number(car.priceOptions[name]);
    if (Number.isFinite(value) && value >= 0) car.priceOptions[name] = value;
    else delete car.priceOptions[name];
  }
  car.images = vehicleImages(value).map(url => ({ url }));
  for (const name of ['features', 'safetyFeatures', 'comfortFeatures', 'performanceFeatures', 'entertainmentFeatures'])
    car[name] = Array.isArray(value[name]) ? value[name].filter(item => typeof item === 'string') : [];
  car.title ||= [car.specifications.year, car.specifications.make, car.specifications.model].filter(Boolean).join(' ') || 'Vehicle';
  return car;
}
