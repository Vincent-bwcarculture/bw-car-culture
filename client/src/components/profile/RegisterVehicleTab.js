// client/src/components/profile/RegisterVehicleTab.js

import React, { useState, useEffect, useRef } from 'react';
import { Car, Save, Info, CheckCircle } from 'lucide-react';
import axios from '../../config/axios.js';
import './RegisterVehicleTab.css';

const DEMO_COLORS = [
  { label: 'Pearl White',   hex: '#EBEBEB' },
  { label: 'Deep Blue',     hex: '#1a3a6b' },
  { label: 'Phantom Black', hex: '#1a1a1a' },
  { label: 'Tornado Red',   hex: '#c0392b' },
  { label: 'Lapiz Blue',    hex: '#1e4d8c' },
  { label: 'Reflex Silver', hex: '#b0b0b0' },
];

const API_BASE = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';
const CURRENT_YEAR = new Date().getFullYear();

const emptyForm = {
  vehicleName: '',
  year: '',
  regPlate: '',
  vin: '',
  color: '#EBEBEB',
  serviceShop: '',
  serviceRecords: '',
};

const RegisterVehicleTab = ({ profileData, refreshProfile }) => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [registeredVehicles, setRegisteredVehicles] = useState([]);
  const [modelColor, setModelColor] = useState('#EBEBEB');
  const [modelSrc, setModelSrc] = useState(null);
  const [modelLoading, setModelLoading] = useState(true);
  const modelViewerRef = useRef(null);
  const blobUrlRef = useRef(null);

  // Load any already-registered vehicles from profile
  useEffect(() => {
    if (profileData?.registeredVehicles?.length) {
      setRegisteredVehicles(profileData.registeredVehicles);
    }
  }, [profileData]);

  // Fetch model as blob URL (authenticated, not directly downloadable)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setModelLoading(false); return; }

    setModelLoading(true);
    fetch(`${API_BASE}/user/model/golf-r`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Model fetch failed');
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setModelSrc(url);
      })
      .catch(() => setModelSrc(null))
      .finally(() => setModelLoading(false));

    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  // Sync color picker with model viewer
  useEffect(() => {
    const mv = modelViewerRef.current;
    if (!mv) return;

    const applyColor = () => {
      try {
        const material = mv.model?.materials?.find(
          m => m.name === 'MAT_Body_Paint' || m.name === 'CarPaint'
        );
        if (material) {
          const r = parseInt(modelColor.slice(1, 3), 16) / 255;
          const g = parseInt(modelColor.slice(3, 5), 16) / 255;
          const b = parseInt(modelColor.slice(5, 7), 16) / 255;
          material.pbrMetallicRoughness.setBaseColorFactor([r, g, b, 1]);
        }
      } catch (_) {}
    };

    if (mv.loaded) {
      applyColor();
    } else {
      mv.addEventListener('load', applyColor, { once: true });
    }
  }, [modelColor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'color') setModelColor(value);
  };

  const handleColorSwatch = (hex) => {
    setForm(prev => ({ ...prev, color: hex }));
    setModelColor(hex);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.vehicleName || !form.year || !form.regPlate) {
      setError('Vehicle name, year, and registration plate are required.');
      return;
    }
    try {
      setSaving(true);
      const response = await axios.post('/user/register-vehicle', { ...form });
      if (response.data.success) {
        setSaved(true);
        setRegisteredVehicles(prev => [...prev, response.data.data]);
        setForm(emptyForm);
        if (refreshProfile) refreshProfile();
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(response.data.message || 'Failed to register vehicle.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register vehicle. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const hasRegistered = registeredVehicles.length > 0;

  return (
    <div className="rvt-container">
      {/* Page header */}
      <div className="rvt-header">
        <div className="rvt-header-icon">
          <Car size={22} />
        </div>
        <div>
          <h2 className="rvt-title">Register Your Vehicle</h2>
          <p className="rvt-subtitle">
            Create a digital twin of your car — track service history and more.
          </p>
        </div>
      </div>

      <div className="rvt-body">
        {/* ── LEFT: Registration form ── */}
        <div className="rvt-form-panel">
          {saved && (
            <div className="rvt-success-banner">
              <CheckCircle size={16} />
              Vehicle registered successfully!
            </div>
          )}
          {error && <div className="rvt-error-banner">{error}</div>}

          <form onSubmit={handleSubmit} className="rvt-form">
            <div className="rvt-field-row">
              <div className="rvt-field">
                <label className="rvt-label">Vehicle Name *</label>
                <input
                  className="rvt-input"
                  name="vehicleName"
                  value={form.vehicleName}
                  onChange={handleChange}
                  placeholder="e.g. VW Golf R Mk7.5"
                />
              </div>
              <div className="rvt-field rvt-field-sm">
                <label className="rvt-label">Year *</label>
                <input
                  className="rvt-input"
                  name="year"
                  type="number"
                  min="1980"
                  max={CURRENT_YEAR + 1}
                  value={form.year}
                  onChange={handleChange}
                  placeholder={String(CURRENT_YEAR)}
                />
              </div>
            </div>

            <div className="rvt-field-row">
              <div className="rvt-field">
                <label className="rvt-label">Registration Plate *</label>
                <input
                  className="rvt-input rvt-input-plate"
                  name="regPlate"
                  value={form.regPlate}
                  onChange={e => setForm(prev => ({ ...prev, regPlate: e.target.value.toUpperCase() }))}
                  placeholder="B 123 ABC"
                  maxLength={10}
                />
              </div>
              <div className="rvt-field">
                <label className="rvt-label">VIN</label>
                <input
                  className="rvt-input"
                  name="vin"
                  value={form.vin}
                  onChange={handleChange}
                  placeholder="17-character VIN (optional)"
                  maxLength={17}
                />
              </div>
            </div>

            <div className="rvt-field-row">
              <div className="rvt-field">
                <label className="rvt-label">Service Shop</label>
                <input
                  className="rvt-input"
                  name="serviceShop"
                  value={form.serviceShop}
                  onChange={handleChange}
                  placeholder="Where you service your vehicle"
                />
              </div>
            </div>

            {/* Color picker */}
            <div className="rvt-field">
              <label className="rvt-label">Vehicle Color</label>
              <div className="rvt-color-row">
                <input
                  type="color"
                  className="rvt-color-picker"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  title="Pick a custom color"
                />
                <div className="rvt-color-swatches">
                  {DEMO_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      className={`rvt-swatch ${form.color === c.hex ? 'rvt-swatch-active' : ''}`}
                      style={{ background: c.hex }}
                      title={c.label}
                      onClick={() => handleColorSwatch(c.hex)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="rvt-field">
              <label className="rvt-label">Service Records</label>
              <textarea
                className="rvt-textarea"
                name="serviceRecords"
                value={form.serviceRecords}
                onChange={handleChange}
                placeholder="Paste any service history notes here (optional)"
                rows={3}
              />
            </div>

            <button
              type="submit"
              className="rvt-submit-btn"
              disabled={saving}
            >
              {saving ? (
                <span className="rvt-spinner" />
              ) : (
                <Save size={16} />
              )}
              {saving ? 'Registering...' : 'Register Vehicle'}
            </button>
          </form>

          {/* Already registered vehicles list */}
          {hasRegistered && (
            <div className="rvt-registered-list">
              <h4 className="rvt-registered-title">Your Registered Vehicles</h4>
              {registeredVehicles.map((v, i) => (
                <div key={i} className="rvt-registered-card">
                  <Car size={14} />
                  <span>{v.vehicleName} ({v.year})</span>
                  <span className="rvt-registered-plate">{v.regPlate}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: 3D Model Viewer ── */}
        <div className="rvt-viewer-panel">
          <div className="rvt-viewer-badge">
            {hasRegistered ? 'Your Digital Twin' : 'Demo — VW Golf R'}
          </div>

          <div className="rvt-viewer-wrapper">
            {modelLoading && (
              <div className="rvt-model-loading">
                <span className="rvt-spinner" />
                <span>Loading model...</span>
              </div>
            )}
            {!modelLoading && modelSrc && (
              <model-viewer
                ref={modelViewerRef}
                src={modelSrc}
                alt="VW Golf R 3D Model"
                camera-controls
                auto-rotate
                auto-rotate-delay="1000"
                rotation-per-second="20deg"
                exposure="1.2"
                shadow-intensity="1"
                camera-orbit="45deg 75deg 6m"
                min-camera-orbit="auto auto 2m"
                max-camera-orbit="auto auto 12m"
                style={{ width: '100%', height: '100%', background: 'transparent' }}
              />
            )}
            {!modelLoading && !modelSrc && (
              <div className="rvt-model-loading">
                <span style={{ color: '#555', fontSize: '0.85rem' }}>Sign in to view 3D model</span>
              </div>
            )}
          </div>

          <div className="rvt-viewer-note">
            <Info size={13} />
            <span>
              {hasRegistered
                ? 'Model reflects your registered vehicle color.'
                : 'Register your vehicle above to personalise this model.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterVehicleTab;
