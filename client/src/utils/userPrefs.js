/**
 * userPrefs.js
 * Tracks user click behaviour (listings + articles) in localStorage and syncs
 * to the API. The aggregated preference profile is then sent as query params
 * to the marketplace to personalise the relevance-scored feed.
 */

const STORAGE_KEY = 'bwcc_click_history';
const MAX_CLICKS   = 50;
const API_BASE     = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';

/** Persist a click to localStorage (capped at MAX_CLICKS). */
const saveLocal = (click) => {
  try {
    const raw   = localStorage.getItem(STORAGE_KEY);
    const clicks = raw ? JSON.parse(raw) : [];
    clicks.push(click);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clicks.slice(-MAX_CLICKS)));
  } catch (_) {}
};

/** Read all stored clicks. */
const loadLocal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) { return []; }
};

/** Fire-and-forget API call — never blocks the caller. */
const syncToApi = (click) => {
  try {
    const token = localStorage.getItem('token');
    const sessionId = localStorage.getItem('bwcc_session') || (() => {
      const id = `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem('bwcc_session', id);
      return id;
    })();

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`${API_BASE}/listings/track-click`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...click, sessionId }),
      keepalive: true
    }).catch(() => {});
  } catch (_) {}
};

/**
 * Track a listing or article click.
 * @param {object} listing  – the car listing object (or article with car data)
 * @param {string} source   – 'listing' | 'article' | 'search'
 */
export const trackClick = (listing, source = 'listing') => {
  if (!listing) return;
  const click = {
    listingId : listing._id   || null,
    make      : (listing.specifications?.make || listing.make || '').toLowerCase(),
    model     : (listing.specifications?.model || listing.model || '').toLowerCase(),
    category  : (listing.category || '').toLowerCase(),
    fuelType  : (listing.specifications?.fuelType || listing.fuelType || '').toLowerCase(),
    price     : Number(listing.price) || 0,
    source,
    ts        : new Date().toISOString()
  };
  saveLocal(click);
  syncToApi(click);
};

/**
 * Derive a preference profile from the stored click history.
 * Returns { makes, fuels, categories, priceMin, priceMax } or null if no data.
 */
export const getPreferences = () => {
  const clicks = loadLocal();
  if (!clicks.length) return null;

  const tally = (key) => {
    const counts = {};
    clicks.forEach(c => { if (c[key]) counts[c[key]] = (counts[c[key]] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0]);
  };

  const prices = clicks.map(c => c.price).filter(p => p > 0);
  return {
    makes      : tally('make'),
    fuels      : tally('fuelType'),
    categories : tally('category'),
    priceMin   : prices.length ? Math.min(...prices) : 0,
    priceMax   : prices.length ? Math.max(...prices) : 0
  };
};

/**
 * Build query-string params to send to GET /listings for personalised ranking.
 * Returns an object of params, or {} if no preferences exist yet.
 */
export const getPreferenceParams = () => {
  const prefs = getPreferences();
  if (!prefs) return {};
  const params = {};
  if (prefs.makes.length)      params.preferMakes      = prefs.makes.join(',');
  if (prefs.fuels.length)      params.preferFuels      = prefs.fuels.join(',');
  if (prefs.categories.length) params.preferCategories = prefs.categories.join(',');
  if (prefs.priceMin)          params.preferPriceMin   = prefs.priceMin;
  if (prefs.priceMax)          params.preferPriceMax   = prefs.priceMax;
  return params;
};
