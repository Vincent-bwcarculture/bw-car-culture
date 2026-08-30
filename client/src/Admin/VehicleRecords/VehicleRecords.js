import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import axios from '../../config/axios.js';
import './VehicleRecords.css';

const STATUS_LABELS = {
  active: { label: 'Active', color: '#00c37c' },
  sold: { label: 'Sold', color: '#0078ff' },
  deleted: { label: 'Deleted', color: '#ff4757' },
  draft: { label: 'Draft', color: '#aaa' },
  archived: { label: 'Archived', color: '#ff8c00' },
  pending: { label: 'Pending', color: '#f1c40f' },
};

const SOURCE_LABELS = {
  admin_listing: 'Admin',
  dealer_listing: 'Dealer',
  user_submission_approval: 'User Sub',
  paid_submission_approval: 'Paid Sub',
  listing: 'Listing',
};

const EVENT_ICONS = {
  listed: '🚗',
  sold: '✅',
  deleted: '🗑',
  price_changed: '💰',
  status_changed: '🔄',
  updated: '✏️',
};

export default function VehicleRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [filters, setFilters] = useState({ search: '', status: '', from: '', to: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });

  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page, limit: pagination.limit });
      if (filters.search) params.set('search', filters.search);
      if (filters.status) params.set('status', filters.status);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);

      const res = await axios.get(`/admin/vehicle-records?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setRecords(res.data.data);
        setPagination(prev => ({ ...prev, ...res.data.pagination, page }));
      } else {
        setError(res.data.message || 'Failed to load records');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vehicle records');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    fetchRecords(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/admin/vehicle-records/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setSelected(res.data.data);
    } catch (err) {
      alert('Failed to load record detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecords(1);
  };

  const fmt = (n) => n ? new Intl.NumberFormat('en-BW', { style: 'currency', currency: 'BWP', maximumFractionDigits: 0 }).format(n) : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-BW', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtKm = (n) => n ? `${Number(n).toLocaleString()} km` : '—';

  return (
    <div className="vr-root">
      <div className="vr-header">
        <div>
          <h1 className="vr-title">Vehicle Records</h1>
          <p className="vr-subtitle">Permanent history of every vehicle listed on the platform — including sold and deleted</p>
        </div>
        <span className="vr-total-badge">{pagination.total.toLocaleString()} records</span>
      </div>

      {/* Filters */}
      <form className="vr-filters" onSubmit={handleSearch}>
        <input
          className="vr-input vr-search"
          placeholder="Search by make, model, VIN, seller..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <select
          className="vr-input vr-select"
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="sold">Sold</option>
          <option value="deleted">Deleted</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <label className="vr-date-label">
          From <input type="date" className="vr-input" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
        </label>
        <label className="vr-date-label">
          To <input type="date" className="vr-input" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
        </label>
        <button type="submit" className="vr-btn-search">Search</button>
        <button type="button" className="vr-btn-reset" onClick={() => { setFilters({ search: '', status: '', from: '', to: '' }); setTimeout(() => fetchRecords(1), 0); }}>Reset</button>
      </form>

      {error && <div className="vr-error">{error}</div>}

      {loading ? (
        <div className="vr-loading"><div className="vr-spinner" /></div>
      ) : records.length === 0 ? (
        <div className="vr-empty">No vehicle records found. Records will appear here as vehicles are listed on the platform.</div>
      ) : (
        <>
          <div className="vr-table-wrap">
            <table className="vr-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>VIN</th>
                  <th>Mileage</th>
                  <th>Listed Price</th>
                  <th>Seller</th>
                  <th>Listed</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Events</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => {
                  const st = STATUS_LABELS[r.currentStatus] || { label: r.currentStatus, color: '#aaa' };
                  return (
                    <tr key={r._id} className="vr-row">
                      <td className="vr-vehicle-cell">
                        {r.listing?.primaryImageUrl && (
                          <img src={r.listing.primaryImageUrl} alt="" className="vr-thumb" />
                        )}
                        <div>
                          <div className="vr-vehicle-name">
                            {r.vehicle?.year} {r.vehicle?.make} {r.vehicle?.model}
                          </div>
                          <div className="vr-vehicle-sub">{r.vehicle?.bodyType} · {r.vehicle?.fuelType}</div>
                        </div>
                      </td>
                      <td className="vr-mono">{r.vehicle?.vin || '—'}</td>
                      <td>{fmtKm(r.listing?.initialMileage)}</td>
                      <td>{fmt(r.listing?.initialPrice)}</td>
                      <td>
                        <div className="vr-seller-name">{r.seller?.businessName || r.seller?.name || '—'}</div>
                        <div className="vr-seller-city">{r.seller?.city}</div>
                      </td>
                      <td>{fmtDate(r.listedAt)}</td>
                      <td><span className="vr-badge" style={{ background: st.color + '22', color: st.color, border: `1px solid ${st.color}44` }}>{st.label}</span></td>
                      <td><span className="vr-source">{SOURCE_LABELS[r.source] || r.source}</span></td>
                      <td className="vr-events-count">{r.events?.length || 0}</td>
                      <td>
                        <button className="vr-btn-detail" onClick={() => openDetail(r._id)}>View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="vr-pagination">
            <button disabled={pagination.page <= 1} onClick={() => fetchRecords(pagination.page - 1)} className="vr-page-btn">← Prev</button>
            <span className="vr-page-info">Page {pagination.page} of {pagination.pages} ({pagination.total} records)</span>
            <button disabled={pagination.page >= pagination.pages} onClick={() => fetchRecords(pagination.page + 1)} className="vr-page-btn">Next →</button>
          </div>
        </>
      )}

      {/* Detail drawer */}
      {(selected || detailLoading) && (
        <div className="vr-drawer-overlay" onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div className="vr-drawer">
            <div className="vr-drawer-header">
              <h2 className="vr-drawer-title">
                {detailLoading ? 'Loading…' : `${selected?.vehicle?.year} ${selected?.vehicle?.make} ${selected?.vehicle?.model}`}
              </h2>
              <button className="vr-drawer-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            {detailLoading && <div className="vr-loading"><div className="vr-spinner" /></div>}

            {selected && !detailLoading && (
              <div className="vr-drawer-body">
                {/* Image */}
                {selected.listing?.primaryImageUrl && (
                  <img src={selected.listing.primaryImageUrl} alt="" className="vr-detail-img" />
                )}

                {/* Summary row */}
                <div className="vr-detail-grid">
                  <div className="vr-detail-section">
                    <h3>Vehicle</h3>
                    <dl className="vr-dl">
                      <dt>Make / Model</dt><dd>{selected.vehicle?.make} {selected.vehicle?.model}</dd>
                      <dt>Year</dt><dd>{selected.vehicle?.year || '—'}</dd>
                      <dt>VIN</dt><dd className="vr-mono">{selected.vehicle?.vin || 'Not recorded'}</dd>
                      <dt>Body Type</dt><dd>{selected.vehicle?.bodyType || '—'}</dd>
                      <dt>Fuel</dt><dd>{selected.vehicle?.fuelType || '—'}</dd>
                      <dt>Transmission</dt><dd>{selected.vehicle?.transmission || '—'}</dd>
                      <dt>Engine</dt><dd>{selected.vehicle?.engineSize || '—'}</dd>
                      <dt>Drivetrain</dt><dd>{selected.vehicle?.drivetrain || '—'}</dd>
                      <dt>Exterior</dt><dd>{selected.vehicle?.exteriorColor || '—'}</dd>
                      <dt>Interior</dt><dd>{selected.vehicle?.interiorColor || '—'}</dd>
                      <dt>Condition</dt><dd>{selected.vehicle?.condition || '—'}</dd>
                    </dl>
                  </div>

                  <div className="vr-detail-section">
                    <h3>Listing Info</h3>
                    <dl className="vr-dl">
                      <dt>Title</dt><dd>{selected.listing?.title}</dd>
                      <dt>Listed Price</dt><dd>{fmt(selected.listing?.initialPrice)}</dd>
                      <dt>Current Price</dt><dd>{fmt(selected.listing?.currentPrice)}</dd>
                      <dt>Initial Mileage</dt><dd>{fmtKm(selected.listing?.initialMileage)}</dd>
                      <dt>Current Mileage</dt><dd>{fmtKm(selected.listing?.currentMileage)}</dd>
                      <dt>Status</dt><dd>
                        {(() => { const st = STATUS_LABELS[selected.currentStatus] || { label: selected.currentStatus, color: '#aaa' }; return <span className="vr-badge" style={{ background: st.color + '22', color: st.color }}>{st.label}</span>; })()}
                      </dd>
                      <dt>Listed</dt><dd>{fmtDate(selected.listedAt)}</dd>
                      {selected.soldAt && <><dt>Sold</dt><dd>{fmtDate(selected.soldAt)}</dd></>}
                      {selected.deletedAt && <><dt>Deleted</dt><dd>{fmtDate(selected.deletedAt)}</dd></>}
                      <dt>Source</dt><dd>{SOURCE_LABELS[selected.source] || selected.source}</dd>
                    </dl>
                  </div>

                  <div className="vr-detail-section">
                    <h3>Seller</h3>
                    <dl className="vr-dl">
                      <dt>Name</dt><dd>{selected.seller?.businessName || selected.seller?.name || '—'}</dd>
                      <dt>Type</dt><dd>{selected.seller?.type || '—'}</dd>
                      <dt>Phone</dt><dd>{selected.seller?.phone || '—'}</dd>
                      <dt>Email</dt><dd>{selected.seller?.email || '—'}</dd>
                      <dt>City</dt><dd>{selected.seller?.city || '—'}</dd>
                      <dt>Country</dt><dd>{selected.seller?.country || '—'}</dd>
                    </dl>
                  </div>
                </div>

                {/* Features */}
                {(selected.listing?.features?.length > 0 || selected.listing?.safetyFeatures?.length > 0 || selected.listing?.comfortFeatures?.length > 0) && (
                  <div className="vr-features-section">
                    <h3>Features at Time of Listing</h3>
                    <div className="vr-features-grid">
                      {selected.listing?.features?.length > 0 && (
                        <div>
                          <h4>General</h4>
                          <ul>{selected.listing.features.map((f, i) => <li key={i}>{f}</li>)}</ul>
                        </div>
                      )}
                      {selected.listing?.safetyFeatures?.length > 0 && (
                        <div>
                          <h4>Safety</h4>
                          <ul>{selected.listing.safetyFeatures.map((f, i) => <li key={i}>{f}</li>)}</ul>
                        </div>
                      )}
                      {selected.listing?.comfortFeatures?.length > 0 && (
                        <div>
                          <h4>Comfort</h4>
                          <ul>{selected.listing.comfortFeatures.map((f, i) => <li key={i}>{f}</li>)}</ul>
                        </div>
                      )}
                      {selected.listing?.performanceFeatures?.length > 0 && (
                        <div>
                          <h4>Performance</h4>
                          <ul>{selected.listing.performanceFeatures.map((f, i) => <li key={i}>{f}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Event timeline */}
                <div className="vr-timeline-section">
                  <h3>Event History ({selected.events?.length || 0})</h3>
                  <ol className="vr-timeline">
                    {(selected.events || []).map((ev, i) => (
                      <li key={i} className={`vr-event vr-event--${ev.type}`}>
                        <span className="vr-event-icon">{EVENT_ICONS[ev.type] || '●'}</span>
                        <div className="vr-event-body">
                          <div className="vr-event-type">{ev.type.replace('_', ' ')}</div>
                          <div className="vr-event-meta">
                            {fmtDate(ev.date)} · {ev.actor?.role} {ev.actor?.name ? `— ${ev.actor.name}` : ''}
                          </div>
                          {ev.details && (
                            <div className="vr-event-details">
                              {ev.details.price && <span>Price: {fmt(ev.details.price)}</span>}
                              {ev.details.mileage && <span> · {fmtKm(ev.details.mileage)}</span>}
                              {ev.details.status && <span> · Status: {ev.details.status}</span>}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
