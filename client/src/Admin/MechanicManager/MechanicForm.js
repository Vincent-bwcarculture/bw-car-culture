// src/Admin/MechanicManager/MechanicForm.js
import React, { useState, useEffect } from 'react';
import { WORKSHOP_TYPES, MECHANIC_SPECIALIZATIONS, BRAND_SPECIALIZATIONS } from './workshopTypes.js';
import './MechanicForm.css';

const EMPTY_FORM = {
  workshopName: '',
  mechanicName: '',
  workshopType: 'General Workshop',
  status: 'approved',
  yearsExperience: '',
  city: '',
  locationsOfOperation: '',
  businessAddress: '',
  phone: '',
  email: '',
  description: '',
  certifications: '',
  workshopCapacity: '',
  mobileService: false,
  mechanicSpecializations: [],
  brandSpecializations: [],
  profileImage: '',
};

const MechanicForm = ({ mechanic, onSave, onCancel, loading }) => {
  const [form, setForm]   = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (mechanic) {
      setForm({
        workshopName:             mechanic.workshopName            || '',
        mechanicName:             mechanic.mechanicName            || '',
        workshopType:             mechanic.workshopType            || 'General Workshop',
        status:                   mechanic.status                  || 'approved',
        yearsExperience:          mechanic.yearsExperience         || '',
        city:                     mechanic.city                    || '',
        locationsOfOperation:     mechanic.locationsOfOperation    || '',
        businessAddress:          mechanic.businessAddress         || '',
        phone:                    mechanic.phone                   || '',
        email:                    mechanic.email                   || '',
        description:              mechanic.description             || '',
        certifications:           mechanic.certifications          || '',
        workshopCapacity:         mechanic.workshopCapacity        || '',
        mobileService:            mechanic.mobileService           || false,
        mechanicSpecializations:  mechanic.mechanicSpecializations || [],
        brandSpecializations:     mechanic.brandSpecializations    || [],
        profileImage:             mechanic.profileImage            || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [mechanic]);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const toggleSpec = (spec) => {
    setForm(f => {
      const cur = f.mechanicSpecializations;
      return { ...f, mechanicSpecializations: cur.includes(spec) ? cur.filter(s => s !== spec) : [...cur, spec] };
    });
  };

  const toggleBrand = (brand) => {
    setForm(f => {
      const cur = f.brandSpecializations;
      if (brand === 'all_brands') {
        return { ...f, brandSpecializations: cur.includes('all_brands') ? [] : ['all_brands'] };
      }
      const without = cur.filter(b => b !== 'all_brands');
      return { ...f, brandSpecializations: without.includes(brand) ? without.filter(b => b !== brand) : [...without, brand] };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.workshopName.trim()) { alert('Workshop / Business name is required'); return; }
    onSave(form);
  };

  const TABS = [
    { id: 'basic',    label: 'Basic Info' },
    { id: 'contact',  label: 'Contact & Location' },
    { id: 'services', label: 'Services & Brands' },
    { id: 'profile',  label: 'Profile' },
  ];

  return (
    <form className="mf-form" onSubmit={handleSubmit}>
      {/* Tab bar */}
      <div className="mf-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            className={`mf-tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Basic Info ── */}
      {activeTab === 'basic' && (
        <div className="mf-section">
          <div className="mf-row">
            <div className="mf-field">
              <label>Workshop / Business Name *</label>
              <input
                type="text"
                value={form.workshopName}
                onChange={e => set('workshopName', e.target.value)}
                placeholder="e.g. ABC Auto Repairs"
                required
              />
            </div>
            <div className="mf-field">
              <label>Mechanic / Contact Name</label>
              <input
                type="text"
                value={form.mechanicName}
                onChange={e => set('mechanicName', e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>
          </div>

          <div className="mf-row">
            <div className="mf-field">
              <label>Workshop Type</label>
              <select value={form.workshopType} onChange={e => set('workshopType', e.target.value)}>
                {WORKSHOP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="mf-field">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mf-row">
            <div className="mf-field">
              <label>Years of Experience</label>
              <input
                type="number"
                min="0"
                value={form.yearsExperience}
                onChange={e => set('yearsExperience', e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
            <div className="mf-field">
              <label>Workshop Capacity</label>
              <input
                type="text"
                value={form.workshopCapacity}
                onChange={e => set('workshopCapacity', e.target.value)}
                placeholder="e.g. 4 bays"
              />
            </div>
          </div>

          <div className="mf-field mf-field--checkbox">
            <input
              type="checkbox"
              id="mobileService"
              checked={form.mobileService}
              onChange={e => set('mobileService', e.target.checked)}
            />
            <label htmlFor="mobileService">Offers mobile / on-site service</label>
          </div>

          <div className="mf-field">
            <label>Profile Image URL</label>
            <input
              type="url"
              value={form.profileImage}
              onChange={e => set('profileImage', e.target.value)}
              placeholder="https://..."
            />
            {form.profileImage && (
              <img src={form.profileImage} alt="preview" className="mf-img-preview" />
            )}
          </div>
        </div>
      )}

      {/* ── Contact & Location ── */}
      {activeTab === 'contact' && (
        <div className="mf-section">
          <div className="mf-row">
            <div className="mf-field">
              <label>Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+267 7X XXX XXX"
              />
            </div>
            <div className="mf-field">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="workshop@example.com"
              />
            </div>
          </div>

          <div className="mf-row">
            <div className="mf-field">
              <label>City / Town</label>
              <input
                type="text"
                value={form.city}
                onChange={e => set('city', e.target.value)}
                placeholder="e.g. Gaborone"
              />
            </div>
            <div className="mf-field">
              <label>Business Address</label>
              <input
                type="text"
                value={form.businessAddress}
                onChange={e => set('businessAddress', e.target.value)}
                placeholder="Street address"
              />
            </div>
          </div>

          <div className="mf-field">
            <label>Areas of Operation</label>
            <input
              type="text"
              value={form.locationsOfOperation}
              onChange={e => set('locationsOfOperation', e.target.value)}
              placeholder="e.g. Gaborone, Mogoditshane, Tlokweng"
            />
            <span className="mf-hint">Comma-separated cities or areas where they operate</span>
          </div>
        </div>
      )}

      {/* ── Services & Brands ── */}
      {activeTab === 'services' && (
        <div className="mf-section">
          <div className="mf-field">
            <label>Mechanic Specializations</label>
            <div className="mf-checkbox-grid">
              {MECHANIC_SPECIALIZATIONS.map(spec => (
                <label key={spec} className="mf-check-label">
                  <input
                    type="checkbox"
                    checked={form.mechanicSpecializations.includes(spec)}
                    onChange={() => toggleSpec(spec)}
                  />
                  {spec}
                </label>
              ))}
            </div>
          </div>

          <div className="mf-field" style={{ marginTop: '1.25rem' }}>
            <label>Brand Specializations</label>
            <div className="mf-checkbox-grid">
              {BRAND_SPECIALIZATIONS.map(brand => (
                <label key={brand} className={`mf-check-label${brand === 'all_brands' ? ' mf-check-label--all' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.brandSpecializations.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                  />
                  {brand === 'all_brands' ? 'All Brands' : brand}
                </label>
              ))}
            </div>
          </div>

          <div className="mf-field" style={{ marginTop: '1.25rem' }}>
            <label>Certifications</label>
            <textarea
              rows={3}
              value={form.certifications}
              onChange={e => set('certifications', e.target.value)}
              placeholder="List any certifications, e.g. Toyota Certified, ASE Certified..."
            />
          </div>
        </div>
      )}

      {/* ── Profile ── */}
      {activeTab === 'profile' && (
        <div className="mf-section">
          <div className="mf-field">
            <label>Description</label>
            <textarea
              rows={5}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the workshop, their experience, what makes them stand out..."
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mf-footer">
        <button type="button" className="mf-btn mf-btn-cancel" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="mf-btn mf-btn-save" disabled={loading}>
          {loading ? 'Saving…' : mechanic ? 'Save Changes' : 'Create Mechanic'}
        </button>
      </div>
    </form>
  );
};

export default MechanicForm;
