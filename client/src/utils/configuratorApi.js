import axios from '../config/axios.js';

// Parts change rarely: keep one copy per vehicle model on the device for an hour.
const PARTS_TTL_MS = 60 * 60 * 1000;
const partsKey = id => `bcc-config-parts:v2:${id}`;
const buildKey = id => `bcc-config-build:${id}`;

const readJSON = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
const writeJSON = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ } };

export const fetchPartsForModel = async (vehicleModelId) => {
  const cached = readJSON(partsKey(vehicleModelId));
  if (cached && Date.now() - cached.savedAt < PARTS_TTL_MS) return cached.parts;
  const res = await axios.get('/api/configurator/parts', { params: { vehicleModel: vehicleModelId } });
  if (!res.data?.success) throw new Error(res.data?.message || 'Could not load parts');
  writeJSON(partsKey(vehicleModelId), { savedAt: Date.now(), parts: res.data.data });
  return res.data.data;
};

// Unsaved build draft, per vehicle (model id, or registered vehicle id for an owner's car).
export const loadDraftBuild = buildId => readJSON(buildKey(buildId)) || [];
export const saveDraftBuild = (buildId, partIds) => writeJSON(buildKey(buildId), partIds);

export const formatPrice = (amount, currency = 'BWP') =>
  currency === 'BWP' ? `P ${Math.round(amount).toLocaleString('en-US')}` : `${currency} ${Math.round(amount).toLocaleString('en-US')}`;
