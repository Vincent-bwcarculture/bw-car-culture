// src/Admin/MechanicManager/MechanicManager.js
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../store/slices/uiSlice.js';
import { http } from '../../config/axios.js';
import MechanicAdminCard from './MechanicAdminCard.js';
import MechanicForm from './MechanicForm.js';
import { WORKSHOP_TYPES } from './workshopTypes.js';
import './MechanicManager.css';

const CONFIRM_INIT = { show: false, mechanic: null };

const MechanicManager = () => {
  const dispatch = useDispatch();

  const [mechanics, setMechanics]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [confirm, setConfirm]       = useState(CONFIRM_INIT);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, total: 0 });
  const [filters, setFilters]       = useState({
    search: '', status: 'all', workshopType: 'all',
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchMechanics = useCallback(async (page = 1, flt = filters) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 20 };
      if (flt.search)       params.search       = flt.search;
      if (flt.status !== 'all') params.status   = flt.status;
      if (flt.workshopType !== 'all') params.workshopType = flt.workshopType;

      const res = await http.get('/admin/mechanics', { params });
      if (res.data?.success) {
        setMechanics(res.data.data || []);
        setPagination(res.data.pagination || { currentPage: page, totalPages: 1, total: 0 });
      } else {
        setError(res.data?.message || 'Failed to load mechanics');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load mechanics');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchMechanics(1, filters); }, []); // eslint-disable-line

  // ── Create / Update ────────────────────────────────────────────────────────
  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editing) {
        await http.put(`/admin/mechanics/${editing._id}`, formData);
        dispatch(addNotification({ type: 'success', message: 'Mechanic updated' }));
      } else {
        await http.post('/admin/mechanics', formData);
        dispatch(addNotification({ type: 'success', message: 'Mechanic created' }));
      }
      setShowForm(false);
      setEditing(null);
      fetchMechanics(pagination.currentPage, filters);
    } catch (err) {
      dispatch(addNotification({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Save failed',
      }));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!confirm.mechanic) return;
    try {
      await http.delete(`/admin/mechanics/${confirm.mechanic._id}`);
      dispatch(addNotification({ type: 'success', message: 'Mechanic deleted' }));
      setConfirm(CONFIRM_INIT);
      fetchMechanics(pagination.currentPage, filters);
    } catch (err) {
      dispatch(addNotification({
        type: 'error',
        message: err.response?.data?.message || 'Delete failed',
      }));
    }
  };

  // ── Approve / Reject ───────────────────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await http.put(`/admin/mechanics/${id}/approve`);
      dispatch(addNotification({ type: 'success', message: 'Mechanic approved' }));
      fetchMechanics(pagination.currentPage, filters);
    } catch (err) {
      dispatch(addNotification({ type: 'error', message: err.response?.data?.message || 'Action failed' }));
    }
  };

  const handleReject = async (id) => {
    try {
      await http.put(`/admin/mechanics/${id}/reject`);
      dispatch(addNotification({ type: 'success', message: 'Mechanic suspended' }));
      fetchMechanics(pagination.currentPage, filters);
    } catch (err) {
      dispatch(addNotification({ type: 'error', message: err.response?.data?.message || 'Action failed' }));
    }
  };

  // ── Filter / search helpers ────────────────────────────────────────────────
  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    fetchMechanics(1, next);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') fetchMechanics(1, filters);
  };

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit   = (m) => { setEditing(m);   setShowForm(true); };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="mm-manager">

      {/* Header */}
      <div className="mm-header">
        <div>
          <h2 className="mm-title">Mechanic Manager</h2>
          <p className="mm-subtitle">{pagination.total} mechanic{pagination.total !== 1 ? 's' : ''} total</p>
        </div>
        <button className="mm-add-btn" onClick={openCreate}>+ Add Mechanic</button>
      </div>

      {/* Filters */}
      <div className="mm-filters">
        <div className="mm-search-wrap">
          <input
            className="mm-search-input"
            type="text"
            placeholder="Search by name, city, email…"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            onKeyDown={handleSearch}
          />
          <button className="mm-search-btn" onClick={() => fetchMechanics(1, filters)}>Search</button>
        </div>

        <div className="mm-filter-selects">
          <select
            className="mm-filter-select"
            value={filters.status}
            onChange={e => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            className="mm-filter-select"
            value={filters.workshopType}
            onChange={e => handleFilterChange('workshopType', e.target.value)}
          >
            <option value="all">All Types</option>
            {WORKSHOP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="mm-error">
          <p>{error}</p>
          <button className="mm-retry-btn" onClick={() => fetchMechanics(1, filters)}>Retry</button>
        </div>
      ) : loading ? (
        <div className="mm-loading">
          <div className="mm-spinner" />
          <p>Loading mechanics…</p>
        </div>
      ) : mechanics.length === 0 ? (
        <div className="mm-empty">
          <p>No mechanics found. <button className="mm-link-btn" onClick={openCreate}>Create one</button></p>
        </div>
      ) : (
        <div className="mm-grid">
          {mechanics.map(m => (
            <MechanicAdminCard
              key={m._id}
              mechanic={m}
              onEdit={openEdit}
              onDelete={(mech) => setConfirm({ show: true, mechanic: mech })}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mm-pagination">
          <button
            className="mm-page-btn"
            onClick={() => fetchMechanics(pagination.currentPage - 1, filters)}
            disabled={pagination.currentPage <= 1}
          >
            Previous
          </button>
          <span className="mm-page-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            className="mm-page-btn"
            onClick={() => fetchMechanics(pagination.currentPage + 1, filters)}
            disabled={pagination.currentPage >= pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Create / Edit form modal */}
      {showForm && (
        <div className="mm-modal-overlay" onClick={() => { setShowForm(false); setEditing(null); }}>
          <div className="mm-modal" onClick={e => e.stopPropagation()}>
            <div className="mm-modal-header">
              <h3>{editing ? 'Edit Mechanic' : 'Add Mechanic'}</h3>
              <button className="mm-modal-close" onClick={() => { setShowForm(false); setEditing(null); }}>×</button>
            </div>
            <div className="mm-modal-body">
              <MechanicForm
                mechanic={editing}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditing(null); }}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirm.show && (
        <div className="mm-modal-overlay" onClick={() => setConfirm(CONFIRM_INIT)}>
          <div className="mm-confirm-box" onClick={e => e.stopPropagation()}>
            <h3>Delete Mechanic?</h3>
            <p>
              Are you sure you want to permanently delete{' '}
              <strong>{confirm.mechanic?.workshopName || confirm.mechanic?.mechanicName}</strong>?
              This cannot be undone.
            </p>
            <div className="mm-confirm-actions">
              <button className="mm-btn-cancel" onClick={() => setConfirm(CONFIRM_INIT)}>Cancel</button>
              <button className="mm-btn-confirm-delete" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MechanicManager;
