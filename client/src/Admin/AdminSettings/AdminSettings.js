// AdminSettings.js — admin feature toggles stored in localStorage
import React, { useState, useEffect } from 'react';
import './AdminSettings.css';

const SETTINGS_KEY = 'bwcc_site_settings';

const DEFAULTS = {
  showFAB: true,
  showChatbot: true,
  showMarketplaceCreate: true,
  maintenanceMode: false,
};

export function getSiteSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveSiteSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  // Notify other components on same page
  window.dispatchEvent(new CustomEvent('siteSettingsChanged', { detail: settings }));
}

const TOGGLES = [
  {
    key: 'showFAB',
    label: 'Floating Action Button (FAB)',
    description: 'The sparkle/action button visible in the bottom-right corner on public pages.',
  },
  {
    key: 'showChatbot',
    label: 'AI Chatbot',
    description: 'The chatbot widget available to visitors across the site.',
  },
  {
    key: 'showMarketplaceCreate',
    label: 'Marketplace "Create Listing" Button',
    description: 'The floating create button visible in the marketplace section.',
  },
  {
    key: 'maintenanceMode',
    label: 'Maintenance Mode',
    description: 'Show a maintenance notice to all non-admin visitors.',
    danger: true,
  },
];

const AdminSettings = () => {
  const [settings, setSettings] = useState(getSiteSettings);
  const [saved, setSaved] = useState(false);

  const toggle = (key) => {
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    saveSiteSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="adm-settings-page">
      <div className="adm-settings-header">
        <h1 className="adm-settings-title">Settings</h1>
        <p className="adm-settings-sub">Control which features are visible on the platform. Changes apply immediately on this device.</p>
      </div>

      <div className="adm-settings-section">
        <h2 className="adm-settings-section-title">Platform Features</h2>
        <p className="adm-settings-section-note">
          These toggles control visibility of UI features across the site.
          Settings are saved in the browser — use the API-based feature flags (coming soon) for cross-device control.
        </p>

        <div className="adm-settings-list">
          {TOGGLES.map(t => (
            <div key={t.key} className={`adm-settings-row${t.danger ? ' adm-settings-row--danger' : ''}`}>
              <div className="adm-settings-row-info">
                <span className="adm-settings-row-label">{t.label}</span>
                <span className="adm-settings-row-desc">{t.description}</span>
              </div>
              <button
                className={`adm-toggle${settings[t.key] ? ' adm-toggle--on' : ''}`}
                onClick={() => toggle(t.key)}
                aria-checked={settings[t.key]}
                role="switch"
              >
                <span className="adm-toggle-knob" />
              </button>
            </div>
          ))}
        </div>

        {saved && <p className="adm-settings-saved">Settings saved.</p>}
      </div>

      <div className="adm-settings-section">
        <h2 className="adm-settings-section-title">Account</h2>
        <div className="adm-settings-list">
          <div className="adm-settings-row">
            <div className="adm-settings-row-info">
              <span className="adm-settings-row-label">Profile</span>
              <span className="adm-settings-row-desc">Update your name, photo and bio.</span>
            </div>
            <a href="/profile" className="adm-settings-link-btn">Edit Profile</a>
          </div>
          <div className="adm-settings-row">
            <div className="adm-settings-row-info">
              <span className="adm-settings-row-label">Password</span>
              <span className="adm-settings-row-desc">Change your login password.</span>
            </div>
            <a href="/admin/security" className="adm-settings-link-btn">Change</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
