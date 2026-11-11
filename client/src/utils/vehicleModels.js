// Catalogue of vehicles we have digital (3D) models for. Add an entry per new model.
// Kept free of Three.js imports so it can be used on the initial page load.
export const VEHICLE_MODELS = [
  {
    id: 'vw-golf-8-5-r',
    name: 'Volkswagen Golf 8.5 R',
    url: '/models/hero-golf.glb',
    marketplaceQuery: 'make=Volkswagen&search=Golf%20R&minYear=2024',
    matches: ({ make, model, year }) =>
      make === 'volkswagen' &&
      /\bgolf\b/.test(model) && /(^|\s)r(\s|$)/.test(model.replace(/\bgolf\b/, ' ')) &&
      (/\b8\.5\b/.test(model) || year >= 2024)
  }
];

const MAKE_ALIASES = { vw: 'volkswagen', 'volks wagen': 'volkswagen', merc: 'mercedes-benz', mercedes: 'mercedes-benz', bmw: 'bmw' };

const clean = value => String(value || '').toLowerCase().replace(/[^a-z0-9.\s-]/g, ' ').replace(/\s+/g, ' ').trim();

// Accepts { make, model, year } or a legacy { vehicleName, year } entry.
export const normalizeVehicle = ({ make, model, vehicleName, year } = {}) => {
  let m = clean(make);
  let rest = clean(model);
  if (!m && vehicleName) {
    const words = clean(vehicleName).split(' ');
    const two = words.slice(0, 2).join(' ');
    if (MAKE_ALIASES[two]) { m = two; rest = words.slice(2).join(' '); }
    else { m = words[0] || ''; rest = words.slice(1).join(' '); }
  }
  return { make: MAKE_ALIASES[m] || m, model: rest, year: Number(year) || 0 };
};

export const findVehicleModel = vehicle => {
  const normalized = normalizeVehicle(vehicle);
  if (!normalized.make || !normalized.model) return null;
  return VEHICLE_MODELS.find(entry => entry.matches(normalized)) || null;
};

export const vehicleDisplayName = ({ make, model, vehicleName } = {}) =>
  [make, model].filter(Boolean).join(' ').trim() || vehicleName || 'Your vehicle';

export const HERO_VEHICLE = VEHICLE_MODELS[0];
