// useSiteSettings — reads admin feature toggles from localStorage
import { useState, useEffect } from 'react';
import { getSiteSettings } from './AdminSettings.js';

export function useSiteSettings() {
  const [settings, setSettings] = useState(getSiteSettings);

  useEffect(() => {
    const handler = (e) => setSettings(e.detail || getSiteSettings());
    window.addEventListener('siteSettingsChanged', handler);
    return () => window.removeEventListener('siteSettingsChanged', handler);
  }, []);

  return settings;
}
