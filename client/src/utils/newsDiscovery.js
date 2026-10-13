export const normalizeNewsCategory = value => ({ reviews: 'review', features: 'feature', comparisons: 'comparison' }[String(value || '').toLowerCase()] || String(value || '').toLowerCase());

const makes = {
  'Mercedes-Benz': ['mercedes-benz', 'mercedes', 'maybach'], Volkswagen: ['volkswagen', 'vw'],
  BMW: ['bmw'], Audi: ['audi'], Toyota: ['toyota'], Honda: ['honda'], Ford: ['ford'], Chevrolet: ['chevrolet', 'chevy'],
  Nissan: ['nissan'], Hyundai: ['hyundai'], Kia: ['kia'], Porsche: ['porsche'], Ferrari: ['ferrari'],
  Lamborghini: ['lamborghini'], Tesla: ['tesla'], JMC: ['jmc'], Lexus: ['lexus'], Mazda: ['mazda'],
  Mitsubishi: ['mitsubishi'], Suzuki: ['suzuki'], Subaru: ['subaru'], Isuzu: ['isuzu'], Peugeot: ['peugeot'],
  Renault: ['renault'], Volvo: ['volvo'], 'Land Rover': ['land rover', 'range rover'], Jeep: ['jeep'],
  Haval: ['haval'], GWM: ['gwm'], BYD: ['byd'], Chery: ['chery']
};
const models = {
  'Mercedes-Benz': ['S-Class', 'C-Class', 'E-Class', 'GLE', 'GLC'], BMW: ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'M3', 'M5'],
  Kia: ['EV9', 'EV6', 'Sportage', 'Sorento', 'Picanto'], JMC: ['Vigus'], Volkswagen: ['Golf', 'Polo', 'Tiguan', 'Amarok'],
  Toyota: ['Land Cruiser', 'Corolla', 'Camry', 'RAV4', 'Hilux', 'Fortuner', 'Prado'], Honda: ['Civic', 'Accord', 'CR-V', 'Jazz'],
  Ford: ['Ranger', 'Everest', 'Mustang'], Audi: ['A3', 'A4', 'A6', 'Q5', 'Q7', 'TT', 'R8']
};
const escape = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (text, term) => new RegExp(`\\b${escape(term)}\\b`, 'i').test(text);
export function articleVehicle(article) {
  const text = `${article.title || ''} ${(article.tags || []).join(' ')} ${article.content || ''}`.replace(/<[^>]*>/g, ' ');
  const explicit = article.metadata?.carMake || article.carMake;
  const sources = explicit ? [explicit] : [article.title || '', (article.tags || []).join(' '), text];
  const make = sources.map(source => Object.keys(makes).find(key => makes[key].some(alias => mentions(source, alias)))).find(Boolean) || explicit || null;
  const model = article.metadata?.carModel || article.carModel || (models[make] || []).find(value => mentions(text, value)) || null;
  return { make, model };
}
export function relevantVehicles(items, { make, model }) {
  if (!make) return [];
  const aliases = makes[make] || [make.toLowerCase()];
  return (Array.isArray(items) ? items : []).filter(item => {
    const itemMake = item.specifications?.make || item.make || '';
    return ['active', 'published'].includes(item.status) && aliases.some(alias => alias.toLowerCase() === itemMake.toLowerCase());
  }).map(item => {
    const normalized = { ...item };
    for (const field of ['make', 'model', 'year', 'mileage', 'transmission', 'fuelType']) normalized[field] = item.specifications?.[field] ?? item[field];
    return normalized;
  }).sort((a, b) => Number(!!model && mentions(b.specifications?.model || b.model || b.title || '', model)) - Number(!!model && mentions(a.specifications?.model || a.model || a.title || '', model)));
}
export function relatedNews(article, items, limit = 3) {
  const vehicle = articleVehicle(article);
  const tags = (article.tags || []).map(tag => tag.toLowerCase());
  const candidates = (items || []).filter(item => String(item._id || item.id) !== String(article._id || article.id) && (!item.status || item.status === 'published'));
  return candidates.map(item => ({ item, score:
    (vehicle.make && articleVehicle(item).make === vehicle.make ? 5 : 0) +
    ((item.tags || []).filter(tag => tags.includes(tag.toLowerCase())).length * 2) +
    (normalizeNewsCategory(item.category) === normalizeNewsCategory(article.category) ? 1 : 0)
  })).filter(value => value.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map(value => value.item);
}
export function newsVisitorId() {
  let visitor = localStorage.getItem('newsVisitorId');
  if (!visitor || !/^[a-zA-Z0-9_-]{16,100}$/.test(visitor)) {
    visitor = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('newsVisitorId', visitor);
  }
  return visitor;
}
