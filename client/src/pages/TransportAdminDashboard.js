// client/src/pages/TransportAdminDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Route, Calendar, CreditCard,
  Plus, Edit2, Trash2, Eye, ArrowLeft, RefreshCw,
  MapPin, Clock, Star, TrendingUp, Users, Activity,
  CheckCircle, XCircle, AlertCircle, ChevronRight,
  Bus, Car, Truck, Navigation, DollarSign, BarChart2,
  ToggleRight, ToggleLeft, X, Save, ChevronDown, ChevronUp,
  Package, MessageSquare, Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import './TransportAdminDashboard.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n || 0));
const currency = (n) => `BWP ${Number(n || 0).toLocaleString('en-BW', { minimumFractionDigits: 2 })}`;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });

const ROUTE_TYPES = ['Bus', 'Taxi', 'Shuttle', 'Train', 'Ferry', 'Other'];
const SERVICE_TYPES = ['Regular', 'Express', 'Premium', 'Night'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const STATUSES = ['active', 'seasonal', 'suspended', 'discontinued'];
const VEHICLE_TYPES = ['Bus', 'Minibus', 'Taxi', 'Shuttle', 'Train', 'Ferry', 'Truck', 'Other'];
const COLORS = ['White', 'Black', 'Silver', 'Grey', 'Blue', 'Red', 'Green', 'Yellow', 'Orange', 'Brown', 'Other'];
const emptyVehicle = () => ({ registration: '', make: '', model: '', year: '', color: '', vehicleType: 'Bus', capacity: '' });

const statusColor = (s) => ({ active: '#22c55e', seasonal: '#f59e0b', suspended: '#ef4444', discontinued: '#6b7280' }[s] || '#6b7280');
const statusLabel = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Unknown';

const emptyRoute = () => ({
  routeNumber: '',
  title: '',
  origin: '',
  destination: '',
  description: '',
  routeType: 'Bus',
  serviceType: 'Regular',
  operationalStatus: 'active',
  fare: '',
  fareOptions: { currency: 'BWP', includesVAT: true },
  schedule: {
    frequency: 'On demand',
    operatingDays: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false },
    departureTimes: '',
    duration: ''
  },
  stops: ''
});

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, color, trend }) => (
  <div className="ta-stat-card">
    <div className="ta-stat-icon" style={{ background: color + '1a', color }}>
      <Icon size={22} />
    </div>
    <div className="ta-stat-body">
      <div className="ta-stat-value">{value}</div>
      <div className="ta-stat-label">{label}</div>
      {sub && <div className="ta-stat-sub">{sub}</div>}
    </div>
    {trend !== undefined && (
      <div className={`ta-stat-trend ${trend >= 0 ? 'up' : 'down'}`}>
        <TrendingUp size={14} />
        {Math.abs(trend)}%
      </div>
    )}
  </div>
);

// ─── Route Form Modal ─────────────────────────────────────────────────────────
const RouteModal = ({ route, onSave, onClose, saving }) => {
  const [form, setForm] = useState(route || emptyRoute());

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

  const toggleDay = (day) => {
    set(`schedule.operatingDays.${day}`, !form.schedule.operatingDays[day]);
  };

  return (
    <div className="ta-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ta-modal">
        <div className="ta-modal-header">
          <h3>{route?.routeNumber ? 'Edit Route' : 'Add New Route'}</h3>
          <button className="ta-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="ta-modal-body">
          {/* Basic Info */}
          <div className="ta-form-section">
            <h4>Route Information</h4>
            <div className="ta-form-grid">
              <div className="ta-form-field">
                <label>Route Number</label>
                <input value={form.routeNumber} onChange={e => set('routeNumber', e.target.value)} placeholder="e.g. G001" />
              </div>
              <div className="ta-form-field">
                <label>Route Title</label>
                <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Gaborone – Francistown Express" />
              </div>
              <div className="ta-form-field">
                <label>Origin</label>
                <input value={form.origin} onChange={e => set('origin', e.target.value)} placeholder="Departure city / stop" />
              </div>
              <div className="ta-form-field">
                <label>Destination</label>
                <input value={form.destination} onChange={e => set('destination', e.target.value)} placeholder="Arrival city / stop" />
              </div>
              <div className="ta-form-field">
                <label>Route Type</label>
                <select value={form.routeType} onChange={e => set('routeType', e.target.value)}>
                  {ROUTE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="ta-form-field">
                <label>Service Class</label>
                <select value={form.serviceType} onChange={e => set('serviceType', e.target.value)}>
                  {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="ta-form-field ta-form-field-full">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of the route, stops, and service quality" />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="ta-form-section">
            <h4>Schedule</h4>
            <div className="ta-form-grid">
              <div className="ta-form-field">
                <label>Frequency</label>
                <input value={form.schedule.frequency} onChange={e => set('schedule.frequency', e.target.value)} placeholder="e.g. Every 30 min, On demand, 3x daily" />
              </div>
              <div className="ta-form-field">
                <label>Journey Duration</label>
                <input value={form.schedule.duration} onChange={e => set('schedule.duration', e.target.value)} placeholder="e.g. 1h 30min" />
              </div>
              <div className="ta-form-field ta-form-field-full">
                <label>Departure Times</label>
                <input value={form.schedule.departureTimes} onChange={e => set('schedule.departureTimes', e.target.value)} placeholder="e.g. 06:00, 08:30, 12:00, 15:30, 18:00" />
              </div>
              <div className="ta-form-field ta-form-field-full">
                <label>Operating Days</label>
                <div className="ta-days-row">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      className={`ta-day-btn ${form.schedule.operatingDays[day] ? 'active' : ''}`}
                      onClick={() => toggleDay(day)}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="ta-form-section">
            <h4>Pricing</h4>
            <div className="ta-form-grid">
              <div className="ta-form-field">
                <label>Fare (BWP)</label>
                <input type="number" min="0" step="0.50" value={form.fare} onChange={e => set('fare', e.target.value)} placeholder="0.00" />
              </div>
              <div className="ta-form-field">
                <label>Status</label>
                <select value={form.operationalStatus} onChange={e => set('operationalStatus', e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                </select>
              </div>
              <div className="ta-form-field ta-form-field-full">
                <label>Stops (comma-separated)</label>
                <input value={form.stops} onChange={e => set('stops', e.target.value)} placeholder="e.g. Mahalapye, Palapye, Serule" />
              </div>
            </div>
          </div>
        </div>

        <div className="ta-modal-footer">
          <button className="ta-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="ta-btn-primary" onClick={() => onSave(form)} disabled={saving}>
            {saving ? 'Saving...' : <><Save size={16} /> Save Route</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Route Row ────────────────────────────────────────────────────────────────
const RouteRow = ({ route, onEdit, onDelete, onToggleStatus }) => {
  const active = route.operationalStatus === 'active';
  return (
    <div className="ta-route-row">
      <div className="ta-route-row-main">
        <div className="ta-route-badge" style={{ background: statusColor(route.operationalStatus) + '22', borderColor: statusColor(route.operationalStatus) }}>
          <span style={{ color: statusColor(route.operationalStatus) }}>{statusLabel(route.operationalStatus)}</span>
        </div>
        <div className="ta-route-row-info">
          <div className="ta-route-row-title">
            <span className="ta-route-number">{route.routeNumber || '—'}</span>
            <span className="ta-route-arrow"><ChevronRight size={14} /></span>
            <span className="ta-route-label">{route.title || `${route.origin} → ${route.destination}`}</span>
          </div>
          <div className="ta-route-row-meta">
            <span><MapPin size={12} /> {route.origin} → {route.destination}</span>
            <span><Bus size={12} /> {route.routeType}</span>
            <span><DollarSign size={12} /> BWP {route.fare || 0}</span>
            <span><Clock size={12} /> {route.schedule?.frequency || '—'}</span>
          </div>
        </div>
      </div>
      <div className="ta-route-row-stats">
        <div className="ta-route-stat"><Eye size={13} /> {fmt(route.views)}</div>
        <div className="ta-route-stat"><Users size={13} /> {fmt(route.bookings)}</div>
        <div className="ta-route-stat"><Star size={13} /> {(route.averageRating || 0).toFixed(1)}</div>
      </div>
      <div className="ta-route-row-actions">
        <button className="ta-icon-btn" title={active ? 'Suspend' : 'Activate'} onClick={() => onToggleStatus(route)}>
          {active ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}
        </button>
        <button className="ta-icon-btn" title="Edit" onClick={() => onEdit(route)}><Edit2 size={16} /></button>
        <button className="ta-icon-btn danger" title="Delete" onClick={() => onDelete(route)}><Trash2 size={16} /></button>
      </div>
    </div>
  );
};

// ─── Vehicle Modal ─────────────────────────────────────────────────────────────
const VehicleModal = ({ vehicle, onSave, onClose, saving }) => {
  const [form, setForm] = useState(vehicle || emptyVehicle());
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div className="ta-modal-overlay">
      <div className="ta-modal ta-vehicle-modal">
        <div className="ta-modal-header">
          <h3>{vehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
          <button className="ta-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="ta-modal-body">
          <div className="ta-form-grid">
            <div className="ta-field ta-field-full">
              <label>Registration Number *</label>
              <input value={form.registration} onChange={e => set('registration', e.target.value.toUpperCase())} placeholder="e.g. B 123 ABC" />
            </div>
            <div className="ta-field">
              <label>Vehicle Type *</label>
              <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)}>
                {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="ta-field">
              <label>Color</label>
              <select value={form.color} onChange={e => set('color', e.target.value)}>
                <option value="">Select color</option>
                {COLORS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="ta-field">
              <label>Make</label>
              <input value={form.make} onChange={e => set('make', e.target.value)} placeholder="e.g. Toyota" />
            </div>
            <div className="ta-field">
              <label>Model</label>
              <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g. Quantum" />
            </div>
            <div className="ta-field">
              <label>Year</label>
              <input type="number" value={form.year} onChange={e => set('year', e.target.value)} placeholder="e.g. 2020" min="1990" max="2030" />
            </div>
            <div className="ta-field">
              <label>Passenger Capacity</label>
              <input type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="e.g. 16" min="1" />
            </div>
          </div>
        </div>
        <div className="ta-modal-footer">
          <button className="ta-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="ta-btn-primary" onClick={() => onSave(form)} disabled={saving || !form.registration || !form.vehicleType}>
            <Save size={15} /> {saving ? 'Saving…' : (vehicle ? 'Update' : 'Add Vehicle')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const TransportAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fleet state
  const [fleet, setFleet] = useState([]);
  const [fleetLoading, setFleetLoading] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [deleteVehicleConfirm, setDeleteVehicleConfirm] = useState(null);

  // Reviews state
  const [transportReviews, setTransportReviews] = useState([]);
  const [ghostReviews, setGhostReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch routes ──────────────────────────────────────────────────────────
  const fetchRoutes = useCallback(async () => {
    if (!user?._id && !user?.id) return;
    setLoading(true);
    try {
      const userId = user._id || user.id;
      const res = await fetch(`${API_BASE}/transport?providerId=${userId}&limit=100`, { headers: authHeaders() });
      const data = await res.json();
      setRoutes(data.data || []);
    } catch (err) {
      console.error('Failed to fetch routes:', err);
      showToast('Failed to load routes', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total: routes.length,
    active: routes.filter(r => r.operationalStatus === 'active').length,
    totalViews: routes.reduce((s, r) => s + (r.views || 0), 0),
    totalBookings: routes.reduce((s, r) => s + (r.bookings || 0), 0),
    avgRating: routes.length ? (routes.reduce((s, r) => s + (r.averageRating || 0), 0) / routes.length).toFixed(1) : '—',
    totalRevenue: routes.reduce((s, r) => s + ((r.bookings || 0) * (r.fare || 0)), 0)
  };

  // ── Save route ────────────────────────────────────────────────────────────
  const handleSave = async (form) => {
    setSaving(true);
    try {
      const userId = user._id || user.id;
      const payload = {
        ...form,
        providerId: userId,
        provider: { name: user.name, businessName: user.name },
        stops: typeof form.stops === 'string' ? form.stops.split(',').map(s => s.trim()).filter(Boolean).map(s => ({ name: s })) : form.stops,
        schedule: {
          ...form.schedule,
          departureTimes: typeof form.schedule.departureTimes === 'string'
            ? form.schedule.departureTimes.split(',').map(t => t.trim()).filter(Boolean)
            : form.schedule.departureTimes
        }
      };

      const isEdit = editingRoute?._id;
      const url = isEdit ? `${API_BASE}/transport/${editingRoute._id}` : `${API_BASE}/transport`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const result = await res.json();

      if (res.ok && result.success !== false) {
        showToast(isEdit ? 'Route updated.' : 'Route created.');
        setShowModal(false);
        setEditingRoute(null);
        fetchRoutes();
      } else {
        showToast(result.message || 'Failed to save route', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle status ─────────────────────────────────────────────────────────
  const handleToggleStatus = async (route) => {
    const next = route.operationalStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`${API_BASE}/transport/${route._id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: next })
      });
      if (res.ok) {
        showToast(`Route ${next === 'active' ? 'activated' : 'suspended'}.`);
        fetchRoutes();
      }
    } catch { showToast('Failed to update status', 'error'); }
  };

  // ── Delete route ──────────────────────────────────────────────────────────
  const handleDelete = async (route) => {
    try {
      const res = await fetch(`${API_BASE}/transport/${route._id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        showToast('Route deleted.');
        setDeleteConfirm(null);
        fetchRoutes();
      } else {
        showToast('Failed to delete route', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  // ── Fetch fleet ───────────────────────────────────────────────────────────
  const fetchFleet = useCallback(async () => {
    setFleetLoading(true);
    try {
      const res = await fetch(`${API_BASE}/transport/fleet`, { headers: authHeaders() });
      const data = await res.json();
      setFleet(data.data || []);
    } catch (err) {
      console.error('Failed to fetch fleet:', err);
    } finally {
      setFleetLoading(false);
    }
  }, []);

  useEffect(() => { fetchFleet(); }, [fetchFleet]);

  // ── Fetch transport reviews ────────────────────────────────────────────────
  const fetchTransportReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/transport/reviews`, { headers: authHeaders() });
      const data = await res.json();
      setTransportReviews(data.data?.reviews || []);
      setGhostReviews(data.data?.ghostReviews || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'reviews') fetchTransportReviews();
  }, [activeTab, fetchTransportReviews]);

  // ── Save vehicle ──────────────────────────────────────────────────────────
  const handleSaveVehicle = async (form) => {
    setVehicleSaving(true);
    try {
      const isEdit = editingVehicle?._id;
      const url = isEdit ? `${API_BASE}/transport/fleet/${editingVehicle._id}` : `${API_BASE}/transport/fleet`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      const result = await res.json();
      if (res.ok && result.success !== false) {
        showToast(isEdit ? 'Vehicle updated.' : 'Vehicle added.');
        setShowVehicleModal(false);
        setEditingVehicle(null);
        fetchFleet();
      } else {
        showToast(result.message || 'Failed to save vehicle', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setVehicleSaving(false); }
  };

  // ── Delete vehicle ────────────────────────────────────────────────────────
  const handleDeleteVehicle = async (vehicle) => {
    try {
      const res = await fetch(`${API_BASE}/transport/fleet/${vehicle._id}`, { method: 'DELETE', headers: authHeaders() });
      if (res.ok) {
        showToast('Vehicle removed.');
        setDeleteVehicleConfirm(null);
        fetchFleet();
      } else {
        showToast('Failed to delete vehicle', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  };

  // ── Reply to review ───────────────────────────────────────────────────────
  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/transport/reviews/${reviewId}/reply`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ reply: replyText.trim() })
      });
      const result = await res.json();
      if (res.ok && result.success !== false) {
        showToast('Reply posted.');
        setReplyingTo(null);
        setReplyText('');
        fetchTransportReviews();
      } else {
        showToast(result.message || 'Failed to post reply', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setReplySubmitting(false); }
  };

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'routes',   label: 'Routes',   icon: Route,           badge: stats.total },
    { id: 'fleet',    label: 'Fleet',    icon: Package,         badge: fleet.length || undefined },
    { id: 'bookings', label: 'Bookings', icon: Calendar,        badge: stats.totalBookings },
    { id: 'reviews',  label: 'Reviews',  icon: Star },
    { id: 'payments', label: 'Payments', icon: CreditCard }
  ];

  // ─── Render: Overview ─────────────────────────────────────────────────────
  const renderOverview = () => (
    <div className="ta-overview">
      <div className="ta-stats-grid">
        <StatCard label="Total Routes" value={stats.total} sub={`${stats.active} active`} icon={Route} color="#3b82f6" />
        <StatCard label="Total Views" value={fmt(stats.totalViews)} sub="across all routes" icon={Eye} color="#8b5cf6" />
        <StatCard label="Bookings" value={fmt(stats.totalBookings)} sub="all time" icon={Users} color="#22c55e" />
        <StatCard label="Avg. Rating" value={stats.avgRating} sub={`from ${routes.reduce((s, r) => s + (r.reviews?.length || 0), 0)} reviews`} icon={Star} color="#f59e0b" />
        <StatCard label="Est. Revenue" value={currency(stats.totalRevenue)} sub="based on fare × bookings" icon={DollarSign} color="#06b6d4" />
        <StatCard label="Inactive Routes" value={stats.total - stats.active} sub="suspended or seasonal" icon={Activity} color="#ef4444" />
      </div>

      {/* Quick Actions */}
      <div className="ta-section">
        <div className="ta-section-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="ta-quick-actions">
          <button className="ta-quick-btn" onClick={() => { setEditingRoute(null); setShowModal(true); }}>
            <Plus size={20} />
            <span>Add New Route</span>
          </button>
          <button className="ta-quick-btn" onClick={() => setActiveTab('routes')}>
            <Route size={20} />
            <span>Manage Routes</span>
          </button>
          <button className="ta-quick-btn" onClick={() => setActiveTab('bookings')}>
            <Calendar size={20} />
            <span>View Bookings</span>
          </button>
          <button className="ta-quick-btn" onClick={() => navigate('/public-transport')}>
            <Eye size={20} />
            <span>My Public Page</span>
          </button>
        </div>
      </div>

      {/* Recent Routes */}
      {routes.length > 0 && (
        <div className="ta-section">
          <div className="ta-section-header">
            <h3>Recent Routes</h3>
            <button className="ta-link-btn" onClick={() => setActiveTab('routes')}>View all</button>
          </div>
          <div className="ta-routes-list">
            {routes.slice(0, 5).map(r => (
              <RouteRow key={r._id} route={r}
                onEdit={(rt) => { setEditingRoute(rt); setShowModal(true); }}
                onDelete={(rt) => setDeleteConfirm(rt)}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        </div>
      )}

      {routes.length === 0 && !loading && (
        <div className="ta-empty-state">
          <Route size={48} />
          <h3>No routes yet</h3>
          <p>Add your first transport route to start receiving bookings.</p>
          <button className="ta-btn-primary" onClick={() => { setEditingRoute(null); setShowModal(true); }}>
            <Plus size={16} /> Add First Route
          </button>
        </div>
      )}
    </div>
  );

  // ─── Render: Routes ───────────────────────────────────────────────────────
  const renderRoutes = () => (
    <div className="ta-routes-panel">
      <div className="ta-panel-toolbar">
        <div className="ta-panel-info">
          <span className="ta-count-badge">{stats.total}</span>
          <span>{stats.active} active, {stats.total - stats.active} inactive</span>
        </div>
        <button className="ta-btn-primary" onClick={() => { setEditingRoute(null); setShowModal(true); }}>
          <Plus size={16} /> Add Route
        </button>
      </div>

      {loading ? (
        <div className="ta-loading"><RefreshCw size={24} className="ta-spin" /> Loading routes...</div>
      ) : routes.length === 0 ? (
        <div className="ta-empty-state">
          <Route size={48} />
          <h3>No routes yet</h3>
          <p>Add your first route to start managing transport services.</p>
          <button className="ta-btn-primary" onClick={() => { setEditingRoute(null); setShowModal(true); }}>
            <Plus size={16} /> Add Route
          </button>
        </div>
      ) : (
        <div className="ta-routes-list">
          {routes.map(r => (
            <RouteRow key={r._id} route={r}
              onEdit={(rt) => { setEditingRoute(rt); setShowModal(true); }}
              onDelete={(rt) => setDeleteConfirm(rt)}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  );

  // ─── Render: Bookings ─────────────────────────────────────────────────────
  const renderBookings = () => (
    <div className="ta-bookings-panel">
      <div className="ta-panel-toolbar">
        <div className="ta-panel-info">
          <span className="ta-count-badge">{stats.totalBookings}</span>
          <span>total bookings across all routes</span>
        </div>
      </div>

      {/* Per-route booking counts */}
      {routes.filter(r => (r.bookings || 0) > 0).length > 0 ? (
        <div className="ta-booking-routes">
          <h4 className="ta-sub-heading">Bookings by Route</h4>
          <div className="ta-booking-table">
            <div className="ta-booking-table-head">
              <span>Route</span>
              <span>Type</span>
              <span>Fare</span>
              <span>Bookings</span>
              <span>Est. Revenue</span>
              <span>Status</span>
            </div>
            {routes.map(r => (
              <div key={r._id} className="ta-booking-table-row">
                <div className="ta-booking-route-name">
                  <span className="ta-route-number">{r.routeNumber || '—'}</span>
                  <span>{r.origin} → {r.destination}</span>
                </div>
                <span>{r.routeType}</span>
                <span>BWP {r.fare || 0}</span>
                <span className="ta-bookings-count">{r.bookings || 0}</span>
                <span>{currency((r.bookings || 0) * (r.fare || 0))}</span>
                <span>
                  <span className="ta-status-dot" style={{ background: statusColor(r.operationalStatus) }}></span>
                  {statusLabel(r.operationalStatus)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Incoming booking requests placeholder */}
      <div className="ta-section">
        <div className="ta-section-header">
          <h3>Incoming Booking Requests</h3>
        </div>
        <div className="ta-placeholder-panel">
          <Calendar size={40} />
          <h4>Real-time booking requests coming soon</h4>
          <p>Once passengers book seats on your routes, their requests will appear here. You will be able to confirm, reschedule, or decline each booking and communicate directly with passengers.</p>
          <div className="ta-placeholder-features">
            <div className="ta-placeholder-feature"><CheckCircle size={16} /> Confirm or decline requests</div>
            <div className="ta-placeholder-feature"><CheckCircle size={16} /> View passenger details</div>
            <div className="ta-placeholder-feature"><CheckCircle size={16} /> Manage seat availability</div>
            <div className="ta-placeholder-feature"><CheckCircle size={16} /> Send notifications to passengers</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Render: Payments ─────────────────────────────────────────────────────
  const renderPayments = () => (
    <div className="ta-payments-panel">
      <div className="ta-payment-stats">
        <div className="ta-payment-card main">
          <div className="ta-payment-card-label">Estimated Total Revenue</div>
          <div className="ta-payment-card-value">{currency(stats.totalRevenue)}</div>
          <div className="ta-payment-card-sub">Based on {stats.totalBookings} bookings × average fare</div>
        </div>
        <div className="ta-payment-card">
          <div className="ta-payment-card-label">Total Bookings</div>
          <div className="ta-payment-card-value">{stats.totalBookings}</div>
          <div className="ta-payment-card-sub">All time</div>
        </div>
        <div className="ta-payment-card">
          <div className="ta-payment-card-label">Active Routes</div>
          <div className="ta-payment-card-value">{stats.active}</div>
          <div className="ta-payment-card-sub">Generating revenue</div>
        </div>
      </div>

      {/* Revenue per route */}
      {routes.length > 0 && (
        <div className="ta-section">
          <div className="ta-section-header"><h3>Revenue Breakdown by Route</h3></div>
          <div className="ta-revenue-table">
            <div className="ta-revenue-table-head">
              <span>Route</span>
              <span>Fare (BWP)</span>
              <span>Bookings</span>
              <span>Est. Revenue</span>
              <span>Views</span>
            </div>
            {[...routes].sort((a, b) => (b.bookings || 0) * (b.fare || 0) - (a.bookings || 0) * (a.fare || 0)).map(r => (
              <div key={r._id} className="ta-revenue-table-row">
                <div className="ta-revenue-route">
                  <span className="ta-route-number">{r.routeNumber || '—'}</span>
                  <span>{r.origin} → {r.destination}</span>
                </div>
                <span>{r.fare || 0}</span>
                <span>{r.bookings || 0}</span>
                <span className="ta-revenue-value">{currency((r.bookings || 0) * (r.fare || 0))}</span>
                <span><Eye size={12} /> {fmt(r.views)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payments integration placeholder */}
      <div className="ta-section">
        <div className="ta-section-header"><h3>Payment Processing</h3></div>
        <div className="ta-placeholder-panel">
          <CreditCard size={40} />
          <h4>Integrated payment processing coming soon</h4>
          <p>Connect your bank account or mobile money wallet to receive direct payments from passenger bookings. View transaction history, request payouts, and track earnings in real time.</p>
          <div className="ta-placeholder-features">
            <div className="ta-placeholder-feature"><CheckCircle size={16} /> Orange Money & MyZaka integration</div>
            <div className="ta-placeholder-feature"><CheckCircle size={16} /> Bank transfer payouts</div>
            <div className="ta-placeholder-feature"><CheckCircle size={16} /> Transaction history & receipts</div>
            <div className="ta-placeholder-feature"><CheckCircle size={16} /> Monthly earnings reports</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Render: Fleet ────────────────────────────────────────────────────────
  const renderFleet = () => (
    <div className="ta-fleet-panel">
      <div className="ta-panel-toolbar">
        <div className="ta-panel-info">
          <span className="ta-count-badge">{fleet.length}</span>
          <span>registered vehicle{fleet.length !== 1 ? 's' : ''}</span>
        </div>
        <button className="ta-btn-primary" onClick={() => { setEditingVehicle(null); setShowVehicleModal(true); }}>
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      {fleetLoading ? (
        <div className="ta-loading"><RefreshCw size={24} className="ta-spin" /> Loading fleet...</div>
      ) : fleet.length === 0 ? (
        <div className="ta-empty-state">
          <Package size={48} />
          <h3>No vehicles registered</h3>
          <p>Add your fleet vehicles so passengers can identify and review them by registration number.</p>
          <button className="ta-btn-primary" onClick={() => { setEditingVehicle(null); setShowVehicleModal(true); }}>
            <Plus size={16} /> Add First Vehicle
          </button>
        </div>
      ) : (
        <div className="ta-fleet-grid">
          {fleet.map(v => (
            <div key={v._id} className="ta-vehicle-card">
              <div className="ta-vehicle-card-header">
                <div className="ta-vehicle-reg">{v.registration}</div>
                <div className="ta-vehicle-actions">
                  <button className="ta-icon-btn" title="Edit" onClick={() => { setEditingVehicle(v); setShowVehicleModal(true); }}>
                    <Edit2 size={15} />
                  </button>
                  <button className="ta-icon-btn danger" title="Remove" onClick={() => setDeleteVehicleConfirm(v)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="ta-vehicle-type-badge">{v.vehicleType}</div>
              <div className="ta-vehicle-details">
                {v.color && <span className="ta-vehicle-color-dot" style={{ background: v.color.toLowerCase() === 'white' ? '#ddd' : v.color.toLowerCase() === 'silver' ? '#aaa' : v.color.toLowerCase() }}></span>}
                <span>{[v.color, v.make, v.model, v.year].filter(Boolean).join(' · ')}</span>
              </div>
              {v.capacity && (
                <div className="ta-vehicle-capacity">
                  <Users size={13} /> {v.capacity} seats
                </div>
              )}
              {v.reviewCount > 0 && (
                <div className="ta-vehicle-reviews">
                  <Star size={13} /> {v.reviewCount} review{v.reviewCount !== 1 ? 's' : ''}
                  {v.averageRating ? ` · ${Number(v.averageRating).toFixed(1)}` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Render: Reviews ──────────────────────────────────────────────────────
  const renderStars = (rating) => {
    const n = Math.round(rating || 0);
    return (
      <div className="ta-stars">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={14} fill={i <= n ? '#f59e0b' : 'none'} color={i <= n ? '#f59e0b' : 'rgba(255,255,255,0.2)'} />
        ))}
      </div>
    );
  };

  const renderReviewCard = (review, isGhost = false) => {
    const id = review._id;
    const isReplying = replyingTo === id;
    return (
      <div key={id} className={`ta-review-card ${isGhost ? 'ghost' : ''}`}>
        {isGhost && <div className="ta-ghost-badge">Unlinked · plate not in fleet</div>}
        <div className="ta-review-card-header">
          <div className="ta-review-meta">
            <div className="ta-reviewer-name">{review.reviewerName || review.identifier || 'Anonymous'}</div>
            <div className="ta-review-date">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}</div>
          </div>
          <div className="ta-review-right">
            {renderStars(review.rating)}
            {review.normalizedPlate && <span className="ta-review-plate">{review.normalizedPlate}</span>}
          </div>
        </div>
        {review.comment && <p className="ta-review-comment">{review.comment}</p>}

        {review.reply ? (
          <div className="ta-review-reply">
            <div className="ta-reply-label">Your reply</div>
            <p className="ta-reply-text">{review.reply}</p>
          </div>
        ) : (
          <>
            {isReplying ? (
              <div className="ta-reply-form">
                <textarea
                  className="ta-reply-input"
                  rows={3}
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                />
                <div className="ta-reply-actions">
                  <button className="ta-btn-ghost ta-sm" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</button>
                  <button className="ta-btn-primary ta-sm" disabled={replySubmitting || !replyText.trim()} onClick={() => handleReply(id)}>
                    <Send size={13} /> {replySubmitting ? 'Posting…' : 'Post Reply'}
                  </button>
                </div>
              </div>
            ) : (
              !isGhost && (
                <button className="ta-reply-trigger" onClick={() => { setReplyingTo(id); setReplyText(''); }}>
                  <MessageSquare size={13} /> Reply
                </button>
              )
            )}
          </>
        )}
      </div>
    );
  };

  const renderTransportReviews = () => {
    const allReviews = [...transportReviews, ...ghostReviews];
    return (
      <div className="ta-reviews-panel">
        <div className="ta-panel-toolbar">
          <div className="ta-panel-info">
            <span className="ta-count-badge">{transportReviews.length}</span>
            <span>linked review{transportReviews.length !== 1 ? 's' : ''}</span>
            {ghostReviews.length > 0 && (
              <span className="ta-ghost-count"> · {ghostReviews.length} unlinked</span>
            )}
          </div>
          <button className="ta-icon-text-btn" onClick={fetchTransportReviews} disabled={reviewsLoading}>
            <RefreshCw size={15} className={reviewsLoading ? 'ta-spin' : ''} /> Refresh
          </button>
        </div>

        {reviewsLoading ? (
          <div className="ta-loading"><RefreshCw size={24} className="ta-spin" /> Loading reviews...</div>
        ) : allReviews.length === 0 ? (
          <div className="ta-empty-state">
            <Star size={48} />
            <h3>No reviews yet</h3>
            <p>Reviews from passengers who identify your vehicles by plate number will appear here. Register your fleet to start linking reviews automatically.</p>
          </div>
        ) : (
          <div className="ta-reviews-list">
            {transportReviews.map(r => renderReviewCard(r, false))}
            {ghostReviews.length > 0 && (
              <>
                <div className="ta-reviews-divider">
                  <span>Unlinked Reviews — add these plates to your fleet to claim them</span>
                </div>
                {ghostReviews.map(r => renderReviewCard(r, true))}
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="ta-page">
      {/* Header */}
      <div className="ta-header">
        <div className="ta-header-left">
          <button className="ta-back-btn" onClick={() => navigate('/profile')}>
            <ArrowLeft size={18} /> Back to Profile
          </button>
          <div className="ta-header-title">
            <h1>Transport Dashboard</h1>
            <p>Manage your routes, bookings and earnings</p>
          </div>
        </div>
        <div className="ta-header-right">
          <button className="ta-icon-text-btn" onClick={fetchRoutes} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'ta-spin' : ''} /> Refresh
          </button>
          <button className="ta-btn-primary" onClick={() => { setEditingRoute(null); setShowModal(true); }}>
            <Plus size={16} /> Add Route
          </button>
          <button className="ta-profile-btn" onClick={() => navigate('/profile')} title="My Profile">
            <div className="ta-profile-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="ta-profile-info">
              <span className="ta-profile-name">{user?.name || 'My Profile'}</span>
              <span className="ta-profile-role">Transport Operator</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="ta-tabs">
        {tabs.map(({ id, label, icon: Icon, badge }) => (
          <button key={id} className={`ta-tab ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
            <Icon size={16} />
            {label}
            {badge > 0 && <span className="ta-tab-badge">{badge}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="ta-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'routes'   && renderRoutes()}
        {activeTab === 'fleet'    && renderFleet()}
        {activeTab === 'bookings' && renderBookings()}
        {activeTab === 'reviews'  && renderTransportReviews()}
        {activeTab === 'payments' && renderPayments()}
      </div>

      {/* Route modal */}
      {showModal && (
        <RouteModal
          route={editingRoute}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingRoute(null); }}
          saving={saving}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="ta-modal-overlay">
          <div className="ta-confirm-modal">
            <AlertCircle size={32} color="#ef4444" />
            <h3>Delete Route</h3>
            <p>Delete <strong>{deleteConfirm.routeNumber || deleteConfirm.title || `${deleteConfirm.origin} → ${deleteConfirm.destination}`}</strong>? This cannot be undone.</p>
            <div className="ta-confirm-actions">
              <button className="ta-btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="ta-btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle modal */}
      {showVehicleModal && (
        <VehicleModal
          vehicle={editingVehicle}
          onSave={handleSaveVehicle}
          onClose={() => { setShowVehicleModal(false); setEditingVehicle(null); }}
          saving={vehicleSaving}
        />
      )}

      {/* Delete vehicle confirm */}
      {deleteVehicleConfirm && (
        <div className="ta-modal-overlay">
          <div className="ta-confirm-modal">
            <AlertCircle size={32} color="#ef4444" />
            <h3>Remove Vehicle</h3>
            <p>Remove <strong>{deleteVehicleConfirm.registration}</strong> from your fleet? Any linked reviews will remain but will be shown as unlinked.</p>
            <div className="ta-confirm-actions">
              <button className="ta-btn-ghost" onClick={() => setDeleteVehicleConfirm(null)}>Cancel</button>
              <button className="ta-btn-danger" onClick={() => handleDeleteVehicle(deleteVehicleConfirm)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`ta-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default TransportAdminDashboard;
