// src/Admin/dashboards/DealerDashboard.js
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Car, Star,
  Plus, Edit2, Trash2, Eye, ArrowLeft, RefreshCw,
  MapPin, Activity, CheckCircle,
  XCircle, AlertCircle, X, Save, Send, MessageSquare,
  Phone, Mail, Globe, Clock,
  Settings, Building2, ToggleLeft, ToggleRight,
  ExternalLink, Search, Link2, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import './DealerDashboard.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n || 0));
const currency = (n) => `P ${Number(n || 0).toLocaleString()}`;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

const daysBetween = (a, b) => Math.max(0, Math.floor((new Date(b) - new Date(a)) / 86400000));
const shortDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// Returns the number of days a listing was on the market before being sold/archived.
// Falls back to updatedAt as a proxy for when status last changed.
const daysOnMarket = (listing) => {
  const start = listing.createdAt;
  if (!start) return null;
  if (listing.status === 'sold' || listing.status === 'archived') {
    const end = listing.soldAt || listing.updatedAt;
    return end ? daysBetween(start, end) : null;
  }
  return daysBetween(start, Date.now());
};

const CATEGORIES = ['Sedan', 'SUV', 'Sports Car', 'Luxury', 'Electric', 'Hybrid', 'Truck', 'Van', 'Wagon', 'Convertible', 'Classic'];
const CONDITIONS = ['new', 'used', 'certified'];
const PRICE_TYPES = ['fixed', 'negotiable', 'call', 'poa'];
const FUEL_TYPES = ['petrol', 'diesel', 'electric', 'hybrid', 'plugin_hybrid', 'hydrogen'];
const TRANSMISSIONS = ['manual', 'automatic', 'cvt', 'dct', 'semi-auto'];
const LISTING_STATUSES = ['draft', 'active', 'sold', 'archived'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const statusColor = (s) => ({
  active: '#22c55e', draft: '#f59e0b', sold: '#3b82f6',
  archived: '#6b7280', pending: '#f59e0b'
}[s] || '#6b7280');

const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

const emptyListing = () => ({
  title: '', description: '', category: 'Sedan', condition: 'used',
  status: 'active', price: '', priceType: 'fixed',
  specifications: { make: '', model: '', year: '', mileage: '', transmission: 'automatic', fuelType: 'petrol', exteriorColor: '', engineSize: '' },
  location: { city: '', country: 'Botswana' },
  priceOptions: { financeAvailable: false, leaseAvailable: false, showPriceAsPOA: false }
});

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="dd-stat-card">
    <div className="dd-stat-icon" style={{ background: color + '1a', color }}>
      <Icon size={22} />
    </div>
    <div className="dd-stat-body">
      <div className="dd-stat-value">{value}</div>
      <div className="dd-stat-label">{label}</div>
      {sub && <div className="dd-stat-sub">{sub}</div>}
    </div>
  </div>
);

// ─── Star Rating ──────────────────────────────────────────────────────────────
const Stars = ({ rating, size = 14 }) => {
  const n = Math.round(rating || 0);
  return (
    <div className="dd-stars">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size}
          fill={i <= n ? '#f59e0b' : 'none'}
          color={i <= n ? '#f59e0b' : 'rgba(255,255,255,0.2)'}
        />
      ))}
    </div>
  );
};

// ─── Listing Form Modal ───────────────────────────────────────────────────────
const ListingModal = ({ listing, onSave, onClose, saving }) => {
  const [form, setForm] = useState(listing ? {
    title: listing.title || '',
    description: listing.description || '',
    category: listing.category || 'Sedan',
    condition: listing.condition || 'used',
    status: listing.status || 'active',
    price: listing.price || '',
    priceType: listing.priceType || 'fixed',
    specifications: {
      make: listing.specifications?.make || '',
      model: listing.specifications?.model || '',
      year: listing.specifications?.year || '',
      mileage: listing.specifications?.mileage || '',
      transmission: listing.specifications?.transmission || 'automatic',
      fuelType: listing.specifications?.fuelType || 'petrol',
      exteriorColor: listing.specifications?.exteriorColor || '',
      engineSize: listing.specifications?.engineSize || '',
    },
    location: {
      city: listing.location?.city || listing.dealer?.location?.city || '',
      country: listing.location?.country || listing.dealer?.location?.country || 'Botswana',
    },
    priceOptions: {
      financeAvailable: listing.priceOptions?.financeAvailable || false,
      leaseAvailable: listing.priceOptions?.leaseAvailable || false,
      showPriceAsPOA: listing.priceOptions?.showPriceAsPOA || false,
    }
  } : emptyListing());

  const [activeTab, setActiveTab] = useState('basic');

  const set = (path, value) => {
    setForm(prev => {
      const next = { ...prev };
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const isEdit = !!listing?._id;

  return (
    <div className="dd-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dd-modal dd-listing-modal">
        <div className="dd-modal-header">
          <h3>{isEdit ? 'Edit Listing' : 'Add New Listing'}</h3>
          <button className="dd-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Modal Tabs */}
        <div className="dd-modal-tabs">
          {['basic', 'specs', 'pricing', 'location'].map(t => (
            <button key={t} className={`dd-modal-tab ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {cap(t)}
            </button>
          ))}
        </div>

        <div className="dd-modal-body">
          {/* Basic Info */}
          {activeTab === 'basic' && (
            <div className="dd-form-section">
              <div className="dd-form-grid">
                <div className="dd-form-field dd-field-full">
                  <label>Listing Title *</label>
                  <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. 2022 Toyota Hilux 2.8 GD-6 4x4 Double Cab" />
                </div>
                <div className="dd-form-field">
                  <label>Category</label>
                  <select value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="dd-form-field">
                  <label>Condition</label>
                  <select value={form.condition} onChange={e => set('condition', e.target.value)}>
                    {CONDITIONS.map(c => <option key={c} value={c}>{cap(c)}</option>)}
                  </select>
                </div>
                <div className="dd-form-field">
                  <label>Status</label>
                  <select value={form.status} onChange={e => set('status', e.target.value)}>
                    {LISTING_STATUSES.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                  </select>
                </div>
                <div className="dd-form-field dd-field-full">
                  <label>Description</label>
                  <textarea rows={5} value={form.description} onChange={e => set('description', e.target.value)}
                    placeholder="Describe the vehicle — condition, history, standout features, reason for selling..." />
                </div>
              </div>
            </div>
          )}

          {/* Specifications */}
          {activeTab === 'specs' && (
            <div className="dd-form-section">
              <div className="dd-form-grid">
                <div className="dd-form-field">
                  <label>Make *</label>
                  <input value={form.specifications.make} onChange={e => set('specifications.make', e.target.value)} placeholder="e.g. Toyota" />
                </div>
                <div className="dd-form-field">
                  <label>Model *</label>
                  <input value={form.specifications.model} onChange={e => set('specifications.model', e.target.value)} placeholder="e.g. Hilux" />
                </div>
                <div className="dd-form-field">
                  <label>Year *</label>
                  <input type="number" min="1960" max={new Date().getFullYear() + 1}
                    value={form.specifications.year} onChange={e => set('specifications.year', e.target.value)} placeholder="2022" />
                </div>
                <div className="dd-form-field">
                  <label>Mileage (km)</label>
                  <input type="number" min="0"
                    value={form.specifications.mileage} onChange={e => set('specifications.mileage', e.target.value)} placeholder="e.g. 45000" />
                </div>
                <div className="dd-form-field">
                  <label>Transmission</label>
                  <select value={form.specifications.transmission} onChange={e => set('specifications.transmission', e.target.value)}>
                    {TRANSMISSIONS.map(t => <option key={t} value={t}>{cap(t)}</option>)}
                  </select>
                </div>
                <div className="dd-form-field">
                  <label>Fuel Type</label>
                  <select value={form.specifications.fuelType} onChange={e => set('specifications.fuelType', e.target.value)}>
                    {FUEL_TYPES.map(f => <option key={f} value={f}>{cap(f.replace('_', ' '))}</option>)}
                  </select>
                </div>
                <div className="dd-form-field">
                  <label>Engine Size</label>
                  <input value={form.specifications.engineSize} onChange={e => set('specifications.engineSize', e.target.value)} placeholder="e.g. 2.8L" />
                </div>
                <div className="dd-form-field">
                  <label>Exterior Colour</label>
                  <input value={form.specifications.exteriorColor} onChange={e => set('specifications.exteriorColor', e.target.value)} placeholder="e.g. Pearl White" />
                </div>
              </div>
            </div>
          )}

          {/* Pricing */}
          {activeTab === 'pricing' && (
            <div className="dd-form-section">
              <div className="dd-form-grid">
                <div className="dd-form-field">
                  <label>Price (BWP) *</label>
                  <input type="number" min="0" value={form.price}
                    onChange={e => set('price', e.target.value)} placeholder="e.g. 350000" />
                </div>
                <div className="dd-form-field">
                  <label>Price Type</label>
                  <select value={form.priceType} onChange={e => set('priceType', e.target.value)}>
                    {PRICE_TYPES.map(p => <option key={p} value={p}>{cap(p)}</option>)}
                  </select>
                </div>
                <div className="dd-form-field dd-field-full">
                  <div className="dd-checkbox-group">
                    <label className="dd-checkbox-label">
                      <input type="checkbox" checked={form.priceOptions.showPriceAsPOA}
                        onChange={e => set('priceOptions.showPriceAsPOA', e.target.checked)} />
                      Show price as POA (Price on Application)
                    </label>
                    <label className="dd-checkbox-label">
                      <input type="checkbox" checked={form.priceOptions.financeAvailable}
                        onChange={e => set('priceOptions.financeAvailable', e.target.checked)} />
                      Finance available
                    </label>
                    <label className="dd-checkbox-label">
                      <input type="checkbox" checked={form.priceOptions.leaseAvailable}
                        onChange={e => set('priceOptions.leaseAvailable', e.target.checked)} />
                      Lease available
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          {activeTab === 'location' && (
            <div className="dd-form-section">
              <div className="dd-form-grid">
                <div className="dd-form-field">
                  <label>City *</label>
                  <input value={form.location.city} onChange={e => set('location.city', e.target.value)} placeholder="e.g. Gaborone" />
                </div>
                <div className="dd-form-field">
                  <label>Country</label>
                  <input value={form.location.country} onChange={e => set('location.country', e.target.value)} placeholder="e.g. Botswana" />
                </div>
              </div>
              <p className="dd-form-note">
                To add photos to this listing, save it first then edit it in the Listings tab — images can be added after the listing is created.
              </p>
            </div>
          )}
        </div>

        <div className="dd-modal-footer">
          <button className="dd-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="dd-btn-primary" onClick={() => onSave(form, isEdit ? listing._id : null)} disabled={saving || !form.title || !form.specifications.make}>
            {saving ? 'Saving...' : <><Save size={16} /> {isEdit ? 'Update Listing' : 'Create Listing'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Listing Row ──────────────────────────────────────────────────────────────
const ListingRow = ({ listing, onEdit, onDelete, onToggleStatus, canManage }) => {
  const isActive = listing.status === 'active';
  const make = listing.specifications?.make || '';
  const model = listing.specifications?.model || '';
  const year = listing.specifications?.year || '';
  const primaryImg = listing.images?.find(i => i.isPrimary) || listing.images?.[0];

  const dom = daysOnMarket(listing);
  const isSold = listing.status === 'sold';
  const timingLabel = listing.createdAt
    ? isSold
      ? (dom !== null ? `Sold after ${dom}d` : `Sold · Listed ${shortDate(listing.createdAt)}`)
      : `${dom}d on market · Listed ${shortDate(listing.createdAt)}`
    : null;

  return (
    <div className="dd-listing-row">
      <div className="dd-listing-thumb">
        {primaryImg?.url
          ? <img src={primaryImg.url} alt={listing.title} onError={e => { e.target.style.display = 'none'; }} />
          : <Car size={22} color="rgba(255,255,255,0.2)" />
        }
      </div>
      <div className="dd-listing-info">
        <div className="dd-listing-title">{listing.title}</div>
        <div className="dd-listing-meta">
          {[make, model, year].filter(Boolean).join(' · ')}
          {listing.specifications?.mileage ? ` · ${Number(listing.specifications.mileage).toLocaleString()} km` : ''}
          {listing.specifications?.transmission ? ` · ${cap(listing.specifications.transmission)}` : ''}
        </div>
        <div className="dd-listing-tags">
          <span className="dd-tag" style={{ borderColor: statusColor(listing.status), color: statusColor(listing.status), background: statusColor(listing.status) + '18' }}>
            {cap(listing.status)}
          </span>
          {listing.category && <span className="dd-tag-plain">{listing.category}</span>}
          {listing.condition && <span className="dd-tag-plain">{cap(listing.condition)}</span>}
          {timingLabel && (
            <span className="dd-tag-plain dd-tag-timing">
              <Clock size={11} /> {timingLabel}
            </span>
          )}
        </div>
      </div>
      <div className="dd-listing-price">{currency(listing.price)}</div>
      <div className="dd-listing-stats">
        <div className="dd-listing-stat"><Eye size={13} /> {fmt(listing.views)}</div>
        <div className="dd-listing-stat"><MessageSquare size={13} /> {fmt(listing.inquiries)}</div>
        <div className="dd-listing-stat"><Star size={13} /> {listing.saves || 0}</div>
      </div>
      <div className="dd-listing-actions">
        {canManage ? (
          <>
            <button className="dd-icon-btn" title={isActive ? 'Pause' : 'Activate'} onClick={() => onToggleStatus(listing)}>
              {isActive ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}
            </button>
            <button className="dd-icon-btn" title="Edit" onClick={() => onEdit(listing)}><Edit2 size={16} /></button>
            <button className="dd-icon-btn danger" title="Delete" onClick={() => onDelete(listing)}><Trash2 size={16} /></button>
          </>
        ) : (
          <span className="dd-tag-plain" style={{ fontSize: '11px', opacity: 0.5 }}>View only</span>
        )}
      </div>
    </div>
  );
};

// ─── Profile Form ─────────────────────────────────────────────────────────────
const ProfileSection = ({ dealerProfile, userId, onSaved, showToast }) => {
  const [form, setForm] = useState({
    businessName: dealerProfile?.businessName || '',
    businessType: dealerProfile?.businessType || '',
    description: dealerProfile?.description || '',
    contact: {
      phone: dealerProfile?.contact?.phone || '',
      email: dealerProfile?.contact?.email || '',
      whatsapp: dealerProfile?.contact?.whatsapp || '',
      website: dealerProfile?.contact?.website || '',
    },
    location: {
      city: dealerProfile?.location?.city || '',
      address: dealerProfile?.location?.address || '',
      country: dealerProfile?.location?.country || 'Botswana',
    },
    openingHours: dealerProfile?.openingHours || {
      monday: { open: '08:00', close: '17:00' },
      tuesday: { open: '08:00', close: '17:00' },
      wednesday: { open: '08:00', close: '17:00' },
      thursday: { open: '08:00', close: '17:00' },
      friday: { open: '08:00', close: '17:00' },
      saturday: { open: '08:00', close: '13:00' },
      sunday: { open: '', close: '' },
    }
  });
  const [saving, setSaving] = useState(false);
  const [expandHours, setExpandHours] = useState(false);

  const set = (path, value) => {
    setForm(prev => {
      const next = { ...prev };
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/dealers/${userId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        showToast('Profile updated successfully.');
        onSaved(data.data || form);
      } else {
        showToast(data.message || 'Failed to save profile', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dd-profile-panel">
      <div className="dd-panel-toolbar">
        <div className="dd-panel-info">
          <Building2 size={16} />
          <span>Your public dealership profile</span>
        </div>
        <button className="dd-btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : <><Save size={16} /> Save Profile</>}
        </button>
      </div>

      <div className="dd-profile-grid">
        {/* Business Info */}
        <div className="dd-profile-card">
          <div className="dd-profile-card-title"><Building2 size={15} /> Business Information</div>
          <div className="dd-form-grid">
            <div className="dd-form-field dd-field-full">
              <label>Business Name</label>
              <input value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="Your dealership name" />
            </div>
            <div className="dd-form-field dd-field-full">
              <label>Business Type</label>
              <input value={form.businessType} onChange={e => set('businessType', e.target.value)} placeholder="e.g. New & Used Cars, Luxury Vehicles" />
            </div>
            <div className="dd-form-field dd-field-full">
              <label>Description</label>
              <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Tell customers about your dealership — specialities, years in business, customer promise..." />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="dd-profile-card">
          <div className="dd-profile-card-title"><Phone size={15} /> Contact Details</div>
          <div className="dd-form-grid">
            <div className="dd-form-field">
              <label><Phone size={12} /> Phone</label>
              <input value={form.contact.phone} onChange={e => set('contact.phone', e.target.value)} placeholder="+267 7X XXX XXX" />
            </div>
            <div className="dd-form-field">
              <label><Mail size={12} /> Email</label>
              <input type="email" value={form.contact.email} onChange={e => set('contact.email', e.target.value)} placeholder="sales@yourdealership.co.bw" />
            </div>
            <div className="dd-form-field">
              <label><Phone size={12} /> WhatsApp</label>
              <input value={form.contact.whatsapp} onChange={e => set('contact.whatsapp', e.target.value)} placeholder="+267 7X XXX XXX" />
            </div>
            <div className="dd-form-field">
              <label><Globe size={12} /> Website</label>
              <input value={form.contact.website} onChange={e => set('contact.website', e.target.value)} placeholder="https://yourdealership.co.bw" />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="dd-profile-card">
          <div className="dd-profile-card-title"><MapPin size={15} /> Location</div>
          <div className="dd-form-grid">
            <div className="dd-form-field">
              <label>City</label>
              <input value={form.location.city} onChange={e => set('location.city', e.target.value)} placeholder="e.g. Gaborone" />
            </div>
            <div className="dd-form-field">
              <label>Country</label>
              <input value={form.location.country} onChange={e => set('location.country', e.target.value)} placeholder="Botswana" />
            </div>
            <div className="dd-form-field dd-field-full">
              <label>Street Address</label>
              <input value={form.location.address} onChange={e => set('location.address', e.target.value)} placeholder="e.g. Plot 123, Main Mall Road, Gaborone" />
            </div>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="dd-profile-card dd-profile-card-full">
          <div className="dd-profile-card-title">
            <Clock size={15} /> Opening Hours
            <button className="dd-link-btn" onClick={() => setExpandHours(h => !h)}>
              {expandHours ? 'Collapse' : 'Edit hours'}
            </button>
          </div>
          {expandHours ? (
            <div className="dd-hours-grid">
              {DAYS.map(day => (
                <div key={day} className="dd-hours-row">
                  <span className="dd-hours-day">{day.slice(0, 3).toUpperCase()}</span>
                  <input type="time" value={form.openingHours[day]?.open || ''}
                    onChange={e => set(`openingHours.${day}.open`, e.target.value)} />
                  <span className="dd-hours-sep">–</span>
                  <input type="time" value={form.openingHours[day]?.close || ''}
                    onChange={e => set(`openingHours.${day}.close`, e.target.value)} />
                  <span className="dd-hours-closed">{(!form.openingHours[day]?.open && !form.openingHours[day]?.close) ? 'Closed' : ''}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="dd-hours-preview">
              {DAYS.map(day => {
                const h = form.openingHours[day];
                return (
                  <div key={day} className="dd-hours-preview-row">
                    <span>{cap(day)}</span>
                    <span>{h?.open && h?.close ? `${h.open} – ${h.close}` : 'Closed'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Claim Dealership Card ────────────────────────────────────────────────────
const ClaimDealershipCard = ({ userId, showToast }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [proof, setProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null); // pending claim object

  const search = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    setResults([]);
    setSelected(null);
    try {
      const res = await fetch(`${API_BASE}/dealers/search?q=${encodeURIComponent(query.trim())}`, { headers: authHeaders() });
      const data = await res.json();
      setResults(data.data || []);
    } catch { showToast('Search failed', 'error'); }
    finally { setSearching(false); }
  };

  const handleSubmit = async () => {
    if (!selected || !reason.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/dealers/${selected._id}/claim`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ reason: reason.trim(), proofDescription: proof.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success !== false) {
        setSubmitted(data.data);
        showToast('Claim submitted — admin will review shortly.');
      } else {
        showToast(data.message || 'Failed to submit claim', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="dd-profile-card dd-profile-card-full dd-claim-card">
      <button className="dd-profile-card-title dd-claim-toggle" onClick={() => setOpen(o => !o)}>
        <Link2 size={15} /> Claim an Existing Dealership Profile
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {open && (
        <div className="dd-claim-body">
          {submitted ? (
            <div className="dd-claim-submitted">
              <CheckCircle size={28} color="#22c55e" />
              <h4>Claim submitted</h4>
              <p>Your claim for <strong>{submitted.dealerName}</strong> is under review. You'll be notified once an admin approves or rejects it.</p>
              <div className="dd-claim-badge pending">Pending review</div>
            </div>
          ) : selected ? (
            <div className="dd-claim-form">
              <div className="dd-claim-selected-dealer">
                <Building2 size={16} />
                <div>
                  <div className="dd-claim-dealer-name">{selected.businessName}</div>
                  <div className="dd-claim-dealer-meta">{selected.businessType || selected.sellerType || 'Dealership'} · {selected.location?.city || 'Unknown location'}</div>
                </div>
                <button className="dd-link-btn" onClick={() => setSelected(null)}>Change</button>
              </div>
              <div className="dd-form-field dd-field-full" style={{ marginTop: 12 }}>
                <label>Why are you claiming this dealership? *</label>
                <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="e.g. I am the owner/manager of this dealership and want to manage its listings and profile..." />
              </div>
              <div className="dd-form-field dd-field-full">
                <label>Proof / Supporting details (optional)</label>
                <textarea rows={2} value={proof} onChange={e => setProof(e.target.value)}
                  placeholder="Business registration number, contact person, website, etc." />
              </div>
              <div className="dd-claim-actions">
                <button className="dd-btn-ghost" onClick={() => setSelected(null)}>Back</button>
                <button className="dd-btn-primary" disabled={submitting || !reason.trim()} onClick={handleSubmit}>
                  {submitting ? 'Submitting...' : <><Send size={14} /> Submit Claim</>}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="dd-claim-intro">
                If your dealership already has a profile on I3W Car Culture (created by an admin or imported), you can claim it to take ownership and manage its listings and public page.
              </p>
              <div className="dd-claim-search-row">
                <input className="dd-search-input"
                  placeholder="Search by dealership name..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && search()}
                />
                <button className="dd-btn-primary" onClick={search} disabled={searching || query.trim().length < 2}>
                  {searching ? <RefreshCw size={15} className="dd-spin" /> : <Search size={15} />} Search
                </button>
              </div>
              {results.length > 0 && (
                <div className="dd-claim-results">
                  {results.map(d => (
                    <div key={d._id} className="dd-claim-result-row">
                      <div>
                        <div className="dd-claim-dealer-name">{d.businessName}</div>
                        <div className="dd-claim-dealer-meta">{d.businessType || d.sellerType || 'Dealership'} · {d.location?.city || '—'}</div>
                      </div>
                      <button className="dd-btn-primary dd-sm" onClick={() => setSelected(d)}>
                        <Link2 size={13} /> Claim
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {results.length === 0 && query.trim().length >= 2 && !searching && (
                <p className="dd-claim-no-results">No dealerships found matching "{query}". Try a different name.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const DealerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dealerProfile, setDealerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const userId = user?._id || user?.id;
  const isAdmin = user?.role === 'admin';

  // Ownership check — admin can manage any listing; dealers only their own
  const canManageListing = (listing) => {
    if (isAdmin) return true;
    const lid = String(listing.dealerId?._id || listing.dealerId || '');
    const did = String(listing.dealer?._id || listing.dealer?.id || '');
    return lid === String(userId) || did === String(userId);
  };

  // ── Fetch listings ─────────────────────────────────────────────────────────
  const fetchListings = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Admins see all listings; dealers see only their own
      const query = isAdmin ? `limit=200` : `dealerId=${userId}&limit=100`;
      const res = await fetch(`${API_BASE}/listings?${query}`, { headers: authHeaders() });
      const data = await res.json();
      setListings(data.data || data.listings || []);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
      showToast('Failed to load listings', 'error');
    } finally {
      setLoading(false);
    }
  }, [userId, isAdmin]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // ── Fetch dealer profile ───────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dealers/${userId}`, { headers: authHeaders() });
      const data = await res.json();
      setDealerProfile(data.data || data.dealer || null);
    } catch (err) {
      console.error('Failed to fetch dealer profile:', err);
    } finally {
      setProfileLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'profile') fetchProfile();
  }, [activeTab, fetchProfile]);

  // ── Fetch reviews ──────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    if (!userId) return;
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reviews/dealer/${userId}`, { headers: authHeaders() });
      const data = await res.json();
      setReviews(data.data || data.reviews || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'reviews') fetchReviews();
  }, [activeTab, fetchReviews]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const soldListings = listings.filter(l => l.status === 'sold');
  const soldWithTiming = soldListings.filter(l => l.createdAt && (l.soldAt || l.updatedAt));
  const avgDaysToSell = soldWithTiming.length
    ? Math.round(soldWithTiming.reduce((s, l) => s + daysBetween(l.createdAt, l.soldAt || l.updatedAt), 0) / soldWithTiming.length)
    : null;

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.status === 'active').length,
    sold: soldListings.length,
    totalViews: listings.reduce((s, l) => s + (l.views || 0), 0),
    totalInquiries: listings.reduce((s, l) => s + (l.inquiries || 0), 0),
    avgRating: reviews.length
      ? (reviews.reduce((s, r) => s + (r.rating || r.ratings?.overall || 0), 0) / reviews.length).toFixed(1)
      : '—',
    reviewCount: reviews.length,
    avgDaysToSell,
  };

  // ── Save listing ───────────────────────────────────────────────────────────
  const handleSaveListing = async (form, listingId) => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        dealerId: userId,
        dealer: {
          name: user?.name || '',
          businessName: dealerProfile?.businessName || user?.name || '',
          contact: {
            phone: dealerProfile?.contact?.phone || '',
            email: user?.email || '',
          },
          location: {
            city: dealerProfile?.location?.city || form.location?.city || '',
            country: dealerProfile?.location?.country || form.location?.country || 'Botswana',
          }
        }
      };

      const isEdit = !!listingId;
      const url = isEdit ? `${API_BASE}/listings/${listingId}` : `${API_BASE}/listings`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(isEdit ? { listingData: JSON.stringify(payload) } : payload) });
      const result = await res.json();

      if (res.ok && result.success !== false) {
        showToast(isEdit ? 'Listing updated.' : 'Listing created.');
        setShowModal(false);
        setEditingListing(null);
        fetchListings();
      } else {
        showToast(result.message || 'Failed to save listing', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle listing status ──────────────────────────────────────────────────
  const handleToggleStatus = async (listing) => {
    const next = listing.status === 'active' ? 'archived' : 'active';
    try {
      const res = await fetch(`${API_BASE}/listings/${listing._id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: next })
      });
      if (res.ok) {
        showToast(`Listing ${next === 'active' ? 'activated' : 'paused'}.`);
        fetchListings();
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch { showToast('Failed to update status', 'error'); }
  };

  // ── Delete listing ─────────────────────────────────────────────────────────
  const handleDeleteListing = async (listing) => {
    try {
      const res = await fetch(`${API_BASE}/listings/${listing._id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        showToast('Listing deleted.');
        setDeleteConfirm(null);
        fetchListings();
      } else {
        showToast('Failed to delete listing', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  // ── Reply to review ────────────────────────────────────────────────────────
  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/reviews/${reviewId}/reply`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ reply: replyText.trim() })
      });
      const result = await res.json();
      if (res.ok && result.success !== false) {
        showToast('Reply posted.');
        setReplyingTo(null);
        setReplyText('');
        fetchReviews();
      } else {
        showToast(result.message || 'Failed to post reply', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setReplySubmitting(false); }
  };

  // ── Filtered listings ──────────────────────────────────────────────────────
  const filteredListings = listings.filter(l => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || l.title?.toLowerCase().includes(q) ||
      l.specifications?.make?.toLowerCase().includes(q) ||
      l.specifications?.model?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
    { id: 'listings',  label: 'Listings',  icon: Car,            badge: stats.total },
    { id: 'profile',   label: 'Profile',   icon: Building2 },
    { id: 'reviews',   label: 'Reviews',   icon: Star,           badge: stats.reviewCount || undefined },
  ];

  // ─── Render: Overview ──────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="dd-overview">
      <div className="dd-stats-grid">
        <StatCard label="Total Listings" value={stats.total} sub={`${stats.active} active`} icon={Car} color="#3b82f6" />
        <StatCard label="Total Views" value={fmt(stats.totalViews)} sub="across all listings" icon={Eye} color="#8b5cf6" />
        <StatCard label="Inquiries" value={fmt(stats.totalInquiries)} sub="potential buyers" icon={MessageSquare} color="#22c55e" />
        <StatCard label="Avg. Rating" value={stats.avgRating}
          sub={stats.reviewCount ? `from ${stats.reviewCount} review${stats.reviewCount !== 1 ? 's' : ''}` : 'No reviews yet'}
          icon={Star} color="#f59e0b" />
        <StatCard label="Sold" value={stats.sold} sub="completed sales" icon={CheckCircle} color="#06b6d4" />
        <StatCard label="Inactive" value={stats.total - stats.active - stats.sold} sub="drafts & archived" icon={Activity} color="#ef4444" />
        <StatCard label="Avg. Days to Sell" value={stats.avgDaysToSell !== null ? `${stats.avgDaysToSell}d` : '—'}
          sub={stats.avgDaysToSell !== null ? `across ${soldWithTiming.length} sold listing${soldWithTiming.length !== 1 ? 's' : ''}` : 'No sold listings yet'}
          icon={Clock} color="#a855f7" />
      </div>

      {/* Quick Actions */}
      <div className="dd-section">
        <div className="dd-section-header"><h3>Quick Actions</h3></div>
        <div className="dd-quick-actions">
          <button className="dd-quick-btn" onClick={() => { setEditingListing(null); setShowModal(true); }}>
            <Plus size={20} /><span>Add Listing</span>
          </button>
          <button className="dd-quick-btn" onClick={() => setActiveTab('listings')}>
            <Car size={20} /><span>My Listings</span>
          </button>
          <button className="dd-quick-btn" onClick={() => setActiveTab('profile')}>
            <Settings size={20} /><span>Edit Profile</span>
          </button>
          <button className="dd-quick-btn" onClick={() => setActiveTab('reviews')}>
            <Star size={20} /><span>View Reviews</span>
          </button>
          <button className="dd-quick-btn" onClick={() => navigate('/marketplace')}>
            <ExternalLink size={20} /><span>Marketplace</span>
          </button>
          {dealerProfile?._id && (
            <button className="dd-quick-btn" onClick={() => navigate(`/dealerships/${dealerProfile._id}`)}>
              <Eye size={20} /><span>My Public Page</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Listings */}
      {listings.length > 0 && (
        <div className="dd-section">
          <div className="dd-section-header">
            <h3>Recent Listings</h3>
            <button className="dd-link-btn" onClick={() => setActiveTab('listings')}>View all</button>
          </div>
          <div className="dd-listings-list">
            {[...listings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map(l => (
              <ListingRow key={l._id} listing={l}
                canManage={canManageListing(l)}
                onEdit={li => { setEditingListing(li); setShowModal(true); }}
                onDelete={li => setDeleteConfirm(li)}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        </div>
      )}

      {listings.length === 0 && !loading && (
        <div className="dd-empty-state">
          <Car size={48} />
          <h3>No listings yet</h3>
          <p>Add your first vehicle listing to start reaching buyers on I3W Car Culture.</p>
          <button className="dd-btn-primary" onClick={() => { setEditingListing(null); setShowModal(true); }}>
            <Plus size={16} /> Add First Listing
          </button>
        </div>
      )}
    </div>
  );

  // ─── Render: Listings ──────────────────────────────────────────────────────
  const renderListings = () => (
    <div className="dd-listings-panel">
      <div className="dd-panel-toolbar">
        <div className="dd-panel-left">
          <span className="dd-count-badge">{filteredListings.length}</span>
          <input className="dd-search-input" placeholder="Search by title, make or model..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          <select className="dd-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {LISTING_STATUSES.map(s => <option key={s} value={s}>{cap(s)}</option>)}
          </select>
        </div>
        <button className="dd-btn-primary" onClick={() => { setEditingListing(null); setShowModal(true); }}>
          <Plus size={16} /> Add Listing
        </button>
      </div>

      {loading ? (
        <div className="dd-loading"><RefreshCw size={24} className="dd-spin" /> Loading listings...</div>
      ) : filteredListings.length === 0 ? (
        <div className="dd-empty-state">
          <Car size={48} />
          <h3>{searchQuery || statusFilter !== 'all' ? 'No listings match your search' : 'No listings yet'}</h3>
          {!searchQuery && statusFilter === 'all' && (
            <>
              <p>Start adding your vehicle inventory to reach buyers.</p>
              <button className="dd-btn-primary" onClick={() => { setEditingListing(null); setShowModal(true); }}>
                <Plus size={16} /> Add First Listing
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="dd-listings-list">
          {filteredListings.map(l => (
            <ListingRow key={l._id} listing={l}
              canManage={canManageListing(l)}
              onEdit={li => { setEditingListing(li); setShowModal(true); }}
              onDelete={li => setDeleteConfirm(li)}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );

  // ─── Render: Reviews ───────────────────────────────────────────────────────
  const renderReviewCard = (review) => {
    const id = review._id;
    const isReplying = replyingTo === id;
    const rating = review.rating || review.ratings?.overall || 0;
    return (
      <div key={id} className="dd-review-card">
        <div className="dd-review-header">
          <div className="dd-review-meta">
            <div className="dd-reviewer-name">{review.reviewerName || review.userName || review.identifier || 'Anonymous'}</div>
            <div className="dd-review-date">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</div>
          </div>
          <div className="dd-review-right">
            <Stars rating={rating} />
            <span className="dd-review-score">{Number(rating).toFixed(1)}</span>
          </div>
        </div>
        {review.comment && <p className="dd-review-comment">{review.comment}</p>}
        {review.title && !review.comment && <p className="dd-review-comment">{review.title}</p>}

        {review.reply ? (
          <div className="dd-review-reply">
            <div className="dd-reply-label">Your reply</div>
            <p className="dd-reply-text">{review.reply}</p>
          </div>
        ) : (
          isReplying ? (
            <div className="dd-reply-form">
              <textarea className="dd-reply-input" rows={3} placeholder="Write a professional reply..."
                value={replyText} onChange={e => setReplyText(e.target.value)} />
              <div className="dd-reply-actions">
                <button className="dd-btn-ghost dd-sm" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</button>
                <button className="dd-btn-primary dd-sm" disabled={replySubmitting || !replyText.trim()}
                  onClick={() => handleReply(id)}>
                  <Send size={13} /> {replySubmitting ? 'Posting...' : 'Post Reply'}
                </button>
              </div>
            </div>
          ) : (
            <button className="dd-reply-trigger" onClick={() => { setReplyingTo(id); setReplyText(''); }}>
              <MessageSquare size={13} /> Reply
            </button>
          )
        )}
      </div>
    );
  };

  const renderReviews = () => (
    <div className="dd-reviews-panel">
      <div className="dd-panel-toolbar">
        <div className="dd-panel-info">
          <span className="dd-count-badge">{reviews.length}</span>
          <span>review{reviews.length !== 1 ? 's' : ''}</span>
          {reviews.length > 0 && (
            <span className="dd-reviews-avg">
              <Stars rating={parseFloat(stats.avgRating) || 0} size={13} /> {stats.avgRating}
            </span>
          )}
        </div>
        <button className="dd-icon-text-btn" onClick={fetchReviews} disabled={reviewsLoading}>
          <RefreshCw size={15} className={reviewsLoading ? 'dd-spin' : ''} /> Refresh
        </button>
      </div>

      {reviewsLoading ? (
        <div className="dd-loading"><RefreshCw size={24} className="dd-spin" /> Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="dd-empty-state">
          <Star size={48} />
          <h3>No reviews yet</h3>
          <p>Reviews from customers will appear here. Engage with buyers to build your reputation on I3W Car Culture.</p>
        </div>
      ) : (
        <div className="dd-reviews-list">
          {reviews.map(r => renderReviewCard(r))}
        </div>
      )}
    </div>
  );

  // ─── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="dd-page">
      {/* Header */}
      <div className="dd-header">
        <div className="dd-header-left">
          <button className="dd-back-btn" onClick={() => navigate('/profile')}>
            <ArrowLeft size={18} /> Back to Profile
          </button>
          <div className="dd-header-title">
            <h1>Dealer Dashboard</h1>
            <p>{dealerProfile?.businessName || 'Manage your listings, profile & reviews'}</p>
          </div>
        </div>
        <div className="dd-header-right">
          <button className="dd-icon-text-btn" onClick={fetchListings} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'dd-spin' : ''} /> Refresh
          </button>
          <button className="dd-btn-primary" onClick={() => { setEditingListing(null); setShowModal(true); }}>
            <Plus size={16} /> Add Listing
          </button>
          <button className="dd-profile-btn" onClick={() => navigate('/profile')} title="My Profile">
            <div className="dd-profile-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'D'}
            </div>
            <div className="dd-profile-info">
              <span className="dd-profile-name">{user?.name || 'Dealer'}</span>
              <span className="dd-profile-role">Dealer</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="dd-tabs">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} className={`dd-tab ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
            <Icon size={16} />
            {label}
            {badge > 0 && <span className="dd-tab-badge">{badge}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="dd-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'listings' && renderListings()}
        {activeTab === 'profile' && (
          profileLoading
            ? <div className="dd-loading"><RefreshCw size={24} className="dd-spin" /> Loading profile...</div>
            : (
              <>
                <ProfileSection dealerProfile={dealerProfile} userId={userId} showToast={showToast} onSaved={setDealerProfile} />
                <div style={{ padding: '0 0 24px' }}>
                  <ClaimDealershipCard userId={userId} showToast={showToast} />
                </div>
              </>
            )
        )}
        {activeTab === 'reviews' && renderReviews()}
      </div>

      {/* Listing modal */}
      {showModal && (
        <ListingModal
          listing={editingListing}
          onSave={handleSaveListing}
          onClose={() => { setShowModal(false); setEditingListing(null); }}
          saving={saving}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="dd-modal-overlay">
          <div className="dd-confirm-modal">
            <AlertCircle size={32} color="#ef4444" />
            <h3>Delete Listing</h3>
            <p>Delete <strong>{deleteConfirm.title}</strong>? This cannot be undone.</p>
            <div className="dd-confirm-actions">
              <button className="dd-btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="dd-btn-danger" onClick={() => handleDeleteListing(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`dd-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default DealerDashboard;
