// useSiteSettings — reads global feature flags from API (with localStorage cache)
import { useState, useEffect } from 'react';

const API = process.env.REACT_APP_API_URL || '/api';
const CACHE_KEY = 'bwcc_site_settings_cache';

const DEFAULTS = { showFAB: true, showChatbot: true, showMarketplaceCreate: true, maintenanceMode: false };

function readCache() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') }; } catch { return { ...DEFAULTS }; }
}

function writeCache(s) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(s)); } catch {}
}

let _listeners = [];
let _current = readCache();

export function notifySiteSettingsChanged(s) {
  _current = s;
  writeCache(s);
  _listeners.forEach(fn => fn(s));
}

export function useSiteSettings() {
  const [settings, setSettings] = useState(() => _current);

  useEffect(() => {
    // Fetch fresh from API on mount
    fetch(`${API}/site-settings`)
      .then(r => r.json())
      .then(d => { if (d.success) notifySiteSettingsChanged({ ...DEFAULTS, ...d.data }); })
      .catch(() => {});

    // Subscribe to in-process changes (admin settings page)
    _listeners.push(setSettings);
    return () => { _listeners = _listeners.filter(fn => fn !== setSettings); };
  }, []);

  return settings;
}
