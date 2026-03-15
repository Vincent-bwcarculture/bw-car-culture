// client/src/pages/TransportAdminDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Route, Calendar, CreditCard,
  Plus, Edit2, Trash2, Eye, ArrowLeft, RefreshCw,
  MapPin, Clock, Star, TrendingUp, Users, Activity,
  CheckCircle, XCircle, AlertCircle, ChevronRight,
  Bus, Car, Truck, Navigation, DollarSign, BarChart2,
  Toggle, ToggleLeft, X, Save, ChevronDown, ChevronUp
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
          {active ? <ToggleLeft size={18} /> : <Toggle size={18} />}
        </button>
        <button className="ta-icon-btn" title="Edit" onClick={() => onEdit(route)}><Edit2 size={16} /></button>
        <button className="ta-icon-btn danger" title="Delete" onClick={() => onDelete(route)}><Trash2 size={16} /></button>
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

  // ─── Tabs ─────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'routes',   label: 'Routes',   icon: Route,           badge: stats.total },
    { id: 'bookings', label: 'Bookings', icon: Calendar,        badge: stats.totalBookings },
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
        {activeTab === 'bookings' && renderBookings()}
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
