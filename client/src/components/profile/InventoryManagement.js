// client/src/components/profile/InventoryManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Plus, RefreshCw, AlertCircle, CheckCircle,
  Clock, X, Tag, MapPin, Eye, XCircle, Trash2, EyeOff
} from 'lucide-react';
import axios from '../../config/axios.js';
import UserInventoryListingForm from './UserInventoryListingForm.js';
import './InventoryManagement.css';

const STATUS_CONFIG = {
  pending_review:  { label: 'Pending Review', color: 'orange', Icon: Clock },
  approved:        { label: 'Approved',        color: 'green',  Icon: CheckCircle },
  rejected:        { label: 'Rejected',        color: 'red',    Icon: XCircle },
  listing_created: { label: 'Live',            color: 'blue',   Icon: CheckCircle },
};

const token = () => localStorage.getItem('token') || localStorage.getItem('authToken');

const InventoryManagement = ({ profileData }) => {
  const [submissions, setSubmissions]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [message, setMessage]           = useState({ type: '', text: '' });
  const [showForm, setShowForm]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);   // submission to confirm delete
  const [actionLoading, setActionLoading] = useState('');   // 'delete-<id>' | 'status-<id>'

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('/api/inventory-submissions', {
        headers: { Authorization: `Bearer ${token()}` }
      });
      setSubmissions(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your inventory submissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleFormSuccess = () => {
    setShowForm(false);
    showMsg('success', 'Item submitted for review! An admin will approve it shortly.');
    fetchSubmissions();
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(`delete-${deleteTarget._id}`);
    try {
      await axios.delete(`/api/inventory-submissions/${deleteTarget._id}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      showMsg('success', 'Listing removed successfully.');
      setSubmissions(prev => prev.filter(s => s._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to delete listing.');
    } finally {
      setActionLoading('');
    }
  };

  // ── Toggle active / inactive ──────────────────────────────────────────────
  const handleToggleStatus = async (sub) => {
    const currentItemStatus = sub.listingStatus || 'active';
    const newStatus = currentItemStatus === 'active' ? 'inactive' : 'active';
    setActionLoading(`status-${sub._id}`);
    try {
      await axios.patch(`/api/inventory-submissions/${sub._id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token()}` } }
      );
      showMsg('success', `Listing ${newStatus === 'active' ? 'reactivated' : 'paused'}.`);
      setSubmissions(prev =>
        prev.map(s => s._id === sub._id ? { ...s, listingStatus: newStatus } : s)
      );
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to update listing status.');
    } finally {
      setActionLoading('');
    }
  };

  const formatPrice = (p) => p ? `P${Number(p).toLocaleString()}` : '—';

  const getFirstImage = (ld) => {
    const imgs = ld?.images;
    if (!imgs?.length) return null;
    const f = imgs[0];
    return typeof f === 'string' ? f : f?.url || null;
  };

  return (
    <div className="inv-mgmt-container">
      {/* Toast */}
      {message.text && (
        <div className={`inv-mgmt-toast ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage({ type: '', text: '' })}><X size={13} /></button>
        </div>
      )}

      {/* Header */}
      <div className="inv-mgmt-header">
        <div className="inv-mgmt-header-left">
          <Package size={22} />
          <div>
            <h2>Sell Inventory</h2>
            <p>List car parts, merchandise, accessories &amp; more</p>
          </div>
        </div>
        <div className="inv-mgmt-header-actions">
          <button className="inv-mgmt-refresh-btn" onClick={fetchSubmissions} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
          </button>
          {profileData?.role === 'admin' && (
            <a href="/inventory" target="_blank" rel="noopener noreferrer" className="inv-mgmt-preview-btn">
              <Eye size={15} /> Preview Page
            </a>
          )}
          <button className="inv-mgmt-add-btn" onClick={() => setShowForm(true)}>
            <Plus size={15} /> List an Item
          </button>
        </div>
      </div>

      {/* Info note */}
      <div className="inv-mgmt-admin-note">
        <AlertCircle size={14} />
        <span>Items are reviewed by our team before going live. Approved items appear on the public inventory page.</span>
      </div>

      {/* Error */}
      {error && <div className="inv-mgmt-error"><AlertCircle size={15} /> {error}</div>}

      {/* Loading / Empty / List */}
      {loading ? (
        <div className="inv-mgmt-loading">
          <RefreshCw size={28} className="spinning" />
          <p>Loading your listings…</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="inv-mgmt-empty">
          <Package size={48} />
          <h3>No items listed yet</h3>
          <p>Submit car parts, merch, accessories, or anything automotive.</p>
          <button className="inv-mgmt-add-btn large" onClick={() => setShowForm(true)}>
            <Plus size={16} /> List Your First Item
          </button>
        </div>
      ) : (
        <div className="inv-mgmt-submissions-list">
          {submissions.map(sub => {
            const ld  = sub.listingData || {};
            const cfg = STATUS_CONFIG[sub.status] || STATUS_CONFIG.pending_review;
            const imgUrl = getFirstImage(ld);
            const isLive = sub.status === 'listing_created';
            const itemStatus = sub.listingStatus || 'active';
            const isStatusLoading  = actionLoading === `status-${sub._id}`;
            const isDeleteLoading  = actionLoading === `delete-${sub._id}`;

            return (
              <div key={sub._id} className="inv-mgmt-sub-card">
                <div className="inv-mgmt-sub-img">
                  {imgUrl
                    ? <img src={imgUrl} alt={ld.title} />
                    : <div className="inv-mgmt-img-placeholder"><Package size={24} /></div>
                  }
                </div>

                <div className="inv-mgmt-sub-body">
                  <div className="inv-mgmt-sub-top">
                    <h4>{ld.title || 'Unnamed Item'}</h4>
                    <span className={`inv-mgmt-status-badge status-${cfg.color}`}>
                      <cfg.Icon size={12} /> {cfg.label}
                      {isLive && itemStatus === 'inactive' && ' (Paused)'}
                    </span>
                  </div>

                  <div className="inv-mgmt-sub-meta">
                    {ld.category && <span className="inv-mgmt-tag"><Tag size={11} />{ld.category}</span>}
                    {ld.location?.city && <span className="inv-mgmt-tag"><MapPin size={11} />{ld.location.city}</span>}
                    <span className="inv-mgmt-tag">{ld.sellerType === 'dealership' ? 'Dealership' : 'Private Seller'}</span>
                  </div>

                  <div className="inv-mgmt-sub-price">{formatPrice(ld.price)}</div>

                  {sub.adminReview?.adminNotes && (sub.status === 'rejected') && (
                    <div className="inv-mgmt-rejection-note">
                      <AlertCircle size={12} />
                      <span>{sub.adminReview.adminNotes}</span>
                    </div>
                  )}

                  <div className="inv-mgmt-sub-footer">
                    <div className="inv-mgmt-sub-date">
                      Submitted {new Date(sub.submittedAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </div>

                    <div className="inv-mgmt-sub-actions">
                      {/* Live listings: toggle active/inactive */}
                      {isLive && (
                        <button
                          className={`inv-mgmt-action-btn ${itemStatus === 'active' ? 'pause' : 'activate'}`}
                          onClick={() => handleToggleStatus(sub)}
                          disabled={isStatusLoading || isDeleteLoading}
                          title={itemStatus === 'active' ? 'Pause listing' : 'Reactivate listing'}
                        >
                          {isStatusLoading
                            ? <RefreshCw size={13} className="spinning" />
                            : itemStatus === 'active'
                              ? <><EyeOff size={13} /> Pause</>
                              : <><Eye size={13} /> Activate</>
                          }
                        </button>
                      )}

                      {/* Delete button for all states */}
                      <button
                        className="inv-mgmt-action-btn delete"
                        onClick={() => setDeleteTarget(sub)}
                        disabled={isDeleteLoading || isStatusLoading}
                        title="Delete listing"
                      >
                        {isDeleteLoading
                          ? <RefreshCw size={13} className="spinning" />
                          : <><Trash2 size={13} /> Delete</>
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="inv-mgmt-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="inv-mgmt-confirm-modal" onClick={e => e.stopPropagation()}>
            <Trash2 size={32} className="inv-mgmt-confirm-icon" />
            <h4>Delete Listing?</h4>
            <p>
              This will permanently remove <strong>"{deleteTarget.listingData?.title || 'this item'}"</strong>.
              {deleteTarget.status === 'listing_created' && ' The live public listing will also be taken down.'}
              {' '}This cannot be undone.
            </p>
            <div className="inv-mgmt-confirm-actions">
              <button className="inv-mgmt-cancel-btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                className="inv-mgmt-delete-btn"
                onClick={handleDelete}
                disabled={!!actionLoading}
              >
                {actionLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Submit Modal */}
      {showForm && (
        <div className="inv-mgmt-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="inv-mgmt-modal">
            <div className="inv-mgmt-modal-header">
              <h3>List an Inventory Item</h3>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div className="inv-mgmt-modal-body">
              <UserInventoryListingForm
                onSuccess={handleFormSuccess}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
