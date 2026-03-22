// Admin/VehicleRegistrations/AdminVehicleRegistrations.js
import { useState, useEffect, useCallback } from 'react';
import { Car, CheckCircle, XCircle, Clock, Search, RefreshCw } from 'lucide-react';
import axios from '../../config/axios.js';
import './AdminVehicleRegistrations.css';

const STATUS_LABELS = {
  pending:  { label: 'Pending',  icon: Clock,        color: '#f59e0b' },
  approved: { label: 'Approved', icon: CheckCircle,  color: '#22c55e' },
  rejected: { label: 'Rejected', icon: XCircle,      color: '#e63946' },
};

const AdminVehicleRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('all');
  const [search, setSearch]               = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [noteModal, setNoteModal]         = useState(null); // { reg, status }
  const [note, setNote]                   = useState('');

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/vehicle-registrations');
      if (res.data.success) setRegistrations(res.data.data);
    } catch (err) {
      console.error('Failed to fetch registrations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRegistrations(); }, [fetchRegistrations]);

  const openNote = (reg, status) => {
    setNoteModal({ reg, status });
    setNote('');
  };

  const submitAction = async () => {
    if (!noteModal) return;
    const { reg, status } = noteModal;
    setActionLoading(`${reg.userId}-${reg._id}`);
    try {
      await axios.patch(`/admin/vehicle-registrations/${reg.userId}/${reg._id}`, { status, adminNote: note });
      setRegistrations(prev =>
        prev.map(r =>
          r.userId === reg.userId && r._id === reg._id
            ? { ...r, status, adminNote: note }
            : r
        )
      );
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(null);
      setNoteModal(null);
    }
  };

  const filtered = registrations.filter(r => {
    const matchStatus = filter === 'all' || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.vehicleName?.toLowerCase().includes(q) ||
      r.regPlate?.toLowerCase().includes(q) ||
      r.userName?.toLowerCase().includes(q) ||
      r.userEmail?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const counts = {
    all:      registrations.length,
    pending:  registrations.filter(r => r.status === 'pending').length,
    approved: registrations.filter(r => r.status === 'approved').length,
    rejected: registrations.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="avr-container">
      <div className="avr-toolbar">
        <div className="avr-search-wrap">
          <Search size={15} className="avr-search-icon" />
          <input
            className="avr-search"
            placeholder="Search by vehicle, plate, or user..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="avr-refresh-btn" onClick={fetchRegistrations} title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="avr-filters">
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button
            key={s}
            className={`avr-filter-btn ${filter === s ? 'active' : ''} avr-filter--${s}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="avr-filter-count">{counts[s]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="avr-loading"><span className="avr-spinner" /> Loading registrations...</div>
      ) : filtered.length === 0 ? (
        <div className="avr-empty">
          <Car size={32} />
          <p>No registrations found</p>
        </div>
      ) : (
        <div className="avr-table-wrap">
          <table className="avr-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Plate</th>
                <th>Owner</th>
                <th>Service Shop</th>
                <th>Registered</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const S = STATUS_LABELS[r.status] || STATUS_LABELS.pending;
                const Icon = S.icon;
                const isBusy = actionLoading === `${r.userId}-${r._id}`;
                return (
                  <tr key={i} className={`avr-row avr-row--${r.status || 'pending'}`}>
                    <td>
                      <div className="avr-vehicle-cell">
                        <div className="avr-color-dot" style={{ background: r.color || '#888' }} />
                        <span>{r.vehicleName} <em>({r.year})</em></span>
                      </div>
                      {r.vin && <div className="avr-vin">VIN: {r.vin}</div>}
                    </td>
                    <td><span className="avr-plate">{r.regPlate}</span></td>
                    <td>
                      <div className="avr-owner">{r.userName}</div>
                      <div className="avr-email">{r.userEmail}</div>
                    </td>
                    <td>{r.serviceShop || <span className="avr-none">—</span>}</td>
                    <td>{r.registeredAt ? new Date(r.registeredAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className="avr-status" style={{ color: S.color }}>
                        <Icon size={13} /> {S.label}
                      </span>
                      {r.adminNote && <div className="avr-admin-note">"{r.adminNote}"</div>}
                    </td>
                    <td>
                      <div className="avr-actions">
                        {r.status !== 'approved' && (
                          <button
                            className="avr-btn avr-btn--approve"
                            disabled={isBusy}
                            onClick={() => openNote(r, 'approved')}
                          >
                            <CheckCircle size={13} /> Approve
                          </button>
                        )}
                        {r.status !== 'rejected' && (
                          <button
                            className="avr-btn avr-btn--reject"
                            disabled={isBusy}
                            onClick={() => openNote(r, 'rejected')}
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        )}
                        {r.status !== 'pending' && (
                          <button
                            className="avr-btn avr-btn--reset"
                            disabled={isBusy}
                            onClick={() => openNote(r, 'pending')}
                          >
                            <Clock size={13} /> Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Note modal */}
      {noteModal && (
        <div className="avr-modal-overlay" onClick={() => setNoteModal(null)}>
          <div className="avr-modal" onClick={e => e.stopPropagation()}>
            <h3>
              {noteModal.status === 'approved' ? 'Approve' : noteModal.status === 'rejected' ? 'Reject' : 'Reset'}
              {' '}{noteModal.reg.vehicleName}
            </h3>
            <textarea
              className="avr-note-input"
              placeholder="Optional note to owner (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
            />
            <div className="avr-modal-actions">
              <button className="avr-btn avr-btn--cancel" onClick={() => setNoteModal(null)}>Cancel</button>
              <button
                className={`avr-btn avr-btn--${noteModal.status === 'approved' ? 'approve' : noteModal.status === 'rejected' ? 'reject' : 'reset'}`}
                onClick={submitAction}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVehicleRegistrations;
