// AdminSettings.js — admin feature toggles stored globally in MongoDB
import React, { useState } from 'react';
import { useSiteSettings, notifySiteSettingsChanged } from './useSiteSettings';
import './AdminSettings.css';

const API = process.env.REACT_APP_API_URL || '/api';

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
  const settings = useSiteSettings();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const toggle = async (key) => {
    const next = { ...settings, [key]: !settings[key] };
    // Optimistic update — all subscribers see it immediately
    notifySiteSettingsChanged(next);
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/admin/site-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (err) {
      setError('Could not save — changes will reset on reload.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-settings-page">
      <div className="adm-settings-header">
        <h1 className="adm-settings-title">Settings</h1>
        <p className="adm-settings-sub">Control which features are visible on the platform. Changes apply globally for all users.</p>
      </div>

      <div className="adm-settings-section">
        <h2 className="adm-settings-section-title">Platform Features</h2>
        <p className="adm-settings-section-note">
          Toggle features on or off site-wide. Changes take effect immediately for all visitors.
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
                disabled={saving}
                aria-checked={settings[t.key]}
                role="switch"
              >
                <span className="adm-toggle-knob" />
              </button>
            </div>
          ))}
        </div>

        {saved && <p className="adm-settings-saved">Saved — all users will see the change.</p>}
        {error && <p className="adm-settings-saved" style={{ color: '#f87171' }}>{error}</p>}
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
