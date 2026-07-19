// client/src/Admin/components/AdminInventorySubmissions.js
import React, { useState, useEffect } from 'react';
import {
  Eye, CheckCircle, XCircle, Clock, User, Package,
  DollarSign, Phone, MapPin, Calendar, Tag,
  Search, Filter, RefreshCw,
  MessageSquare, AlertCircle, Image,
  TrendingUp, MessageCircle, FileText, RotateCcw, X
} from 'lucide-react';
import axios from '../../config/axios.js';
import './AdminUserSubmissions.css';

const STATUS_CONFIG = {
  pending_review:  { label: 'Pending Review',  color: 'orange', Icon: Clock },
  approved:        { label: 'Approved',         color: 'green',  Icon: CheckCircle },
  rejected:        { label: 'Rejected',         color: 'red',    Icon: XCircle },
  listing_created: { label: 'Live',             color: 'blue',   Icon: CheckCircle }
};

const AdminInventorySubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [message, setMessage]         = useState({ type: '', text: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  const [selected, setSelected]         = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [reviewData, setReviewData] = useState({ action: 'approve', adminNotes: '', visibilityScore: 50 });

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  useEffect(() => { fetchSubmissions(); }, []);

  useEffect(() => {
    let list = [...submissions];
    if (statusFilter !== 'all') list = list.filter(s => s.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        (s.listingData?.title || '').toLowerCase().includes(q) ||
        (s.userName || '').toLowerCase().includes(q) ||
        (s.listingData?.category || '').toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [submissions, searchQuery, statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const res = await axios.get('/api/inventory-submissions/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setSubmissions(data);
      setStats({
        total:    data.length,
        pending:  data.filter(s => s.status === 'pending_review').length,
        approved: data.filter(s => ['approved', 'listing_created'].includes(s.status)).length,
        rejected: data.filter(s => s.status === 'rejected').length
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory submissions.');
    } finally {
      setLoading(false);
    }
  };

  const openReview = (sub) => {
    setSelected(sub);
    setGalleryIndex(0);
    setReviewData({
      action: sub.adminReview?.action || 'approve',
      adminNotes: sub.adminReview?.adminNotes || '',
      visibilityScore: 50
    });
    setShowModal(true);
    setError('');
  };

  const submitReview = async () => {
    if (!selected) return;
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const res = await axios.put(
        `/api/inventory-submissions/admin/${selected._id}/review`,
        {
          action: reviewData.action,
          adminNotes: reviewData.adminNotes.trim(),
          visibilityScore: reviewData.action === 'approve' ? reviewData.visibilityScore : 0
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setSubmissions(prev => prev.map(s =>
          s._id === selected._id
            ? { ...s, status: res.data.data?.status || (reviewData.action === 'approve' ? 'approved' : 'rejected'),
                adminReview: { action: reviewData.action, adminNotes: reviewData.adminNotes, reviewedAt: new Date() } }
            : s
        ));
        setStats(prev => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          [reviewData.action === 'approve' ? 'approved' : 'rejected']:
            prev[reviewData.action === 'approve' ? 'approved' : 'rejected'] + 1
        }));
        setShowModal(false);
        setSelected(null);
        showMsg('success', `Submission ${reviewData.action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (sub) => {
    if (!window.confirm(`Restore "${sub.listingData?.title || 'this submission'}" to pending review?`)) return;
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      await axios.put(
        `/api/inventory-submissions/admin/${sub._id}/review`,
        { action: 'restore', adminNotes: '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmissions(prev => prev.map(s =>
        s._id === sub._id ? { ...s, status: 'pending_review', adminReview: null } : s
      ));
      setStats(prev => ({
        ...prev,
        pending: prev.pending + 1,
        rejected: Math.max(0, prev.rejected - 1)
      }));
      showMsg('success', 'Restored to pending review.');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Failed to restore.');
    }
  };

  const getImages = (sub) => {
    const imgs = sub?.listingData?.images || [];
    return imgs.map(i => (typeof i === 'string' ? i : i?.url)).filter(Boolean);
  };

  const getFirstImage = (sub) => getImages(sub)[0] || null;

  const formatPrice = (p) => p ? `P${Number(p).toLocaleString()}` : '—';

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending_review;
    return (
      <span className={`admin-submissions-status-badge status-${cfg.color}`}>
        <cfg.Icon size={14} /> {cfg.label}
      </span>
    );
  };

  return (
    <div className="admin-submissions-container">
      {/* Toast */}
      {message.text && (
        <div className={`admin-submissions-message ${message.type}`}>
          <div className="admin-submissions-message-content">
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
          <button className="admin-submissions-message-close" onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="admin-submissions-header">
        <h1>Inventory Submissions</h1>
        <p>Review and approve inventory listings submitted by users and dealerships</p>
        <div className="admin-submissions-stats-grid">
          {[
            { label: 'Total', value: stats.total, icon: Package, cls: 'total' },
            { label: 'Pending Review', value: stats.pending, icon: Clock, cls: 'pending' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle, cls: 'approved' },
            { label: 'Rejected', value: stats.rejected, icon: XCircle, cls: 'rejected' }
          ].map(({ label, value, icon: Icon, cls }) => (
            <div key={cls} className="admin-submissions-stat-card">
              <div className={`admin-submissions-stat-icon ${cls}`}><Icon size={24} /></div>
              <div className="admin-submissions-stat-content">
                <div className="admin-submissions-stat-number">{value}</div>
                <div className="admin-submissions-stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="admin-submissions-filters">
        <div className="admin-submissions-search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by title, user, or category…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="admin-submissions-search-input"
          />
        </div>
        <div className="admin-submissions-filter-container">
          <Filter size={20} />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="admin-submissions-filter-select">
            <option value="all">All Status</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="listing_created">Live</option>
          </select>
        </div>
        <button onClick={fetchSubmissions} className="admin-submissions-refresh-btn" disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="admin-submissions-error-message">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* List */}
      <div className="admin-submissions-list">
        {loading ? (
          <div className="admin-submissions-loading-state">
            <RefreshCw size={32} className="spinning" />
            <p>Loading submissions…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-submissions-empty-state">
            <Package size={48} />
            <h3>No submissions found</h3>
            <p>{submissions.length === 0 ? 'No inventory submissions yet.' : 'No submissions match your filters.'}</p>
          </div>
        ) : filtered.map(sub => {
          const ld = sub.listingData || {};
          const imgUrl = getFirstImage(sub);
          return (
            <div key={sub._id} className="admin-submissions-card">
              <div className="admin-submissions-submission-header">
                <div className="admin-submissions-submission-info">
                  <h3>{ld.title || 'Unnamed Item'}</h3>
                  <div className="admin-submissions-submission-meta">
                    <span className="admin-submissions-user-info"><User size={14} />{sub.userName || 'Unknown'}</span>
                    <span className="admin-submissions-date-info"><Calendar size={14} />{formatDate(sub.submittedAt)}</span>
                  </div>
                </div>
                <div className="admin-submissions-submission-status">
                  <StatusBadge status={sub.status} />
                </div>
              </div>

              <div className="admin-submissions-submission-content">
                <div className="admin-submissions-submission-details">
                  <div className="admin-submissions-vehicle-image">
                    {imgUrl
                      ? <img src={imgUrl} alt={ld.title} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                      : null}
                    <div className="admin-submissions-image-placeholder" style={{ display: imgUrl ? 'none' : 'flex' }}>
                      <Image size={24} /><span>No Image</span>
                    </div>
                  </div>

                  <div className="admin-submissions-vehicle-details">
                    {ld.category && (
                      <div className="admin-submissions-detail-row">
                        <Tag size={16} /><span>{ld.category}{ld.condition ? ` · ${ld.condition}` : ''}</span>
                      </div>
                    )}
                    <div className="admin-submissions-detail-row">
                      <DollarSign size={16} /><span>{formatPrice(ld.price)}</span>
                    </div>
                    {ld.location?.city && (
                      <div className="admin-submissions-detail-row">
                        <MapPin size={16} /><span>{ld.location.city}{ld.location.country ? `, ${ld.location.country}` : ''}</span>
                      </div>
                    )}
                    {ld.contact?.phone && (
                      <div className="admin-submissions-detail-row">
                        <Phone size={16} /><span>{ld.contact.phone}</span>
                      </div>
                    )}
                    <div className="admin-submissions-detail-row">
                      <User size={16} /><span>{ld.sellerType === 'dealership' ? 'Dealership' : 'Private Seller'}</span>
                    </div>
                  </div>
                </div>

                {sub.adminReview?.adminNotes && sub.status === 'rejected' && (
                  <div className="admin-submissions-admin-notes">
                    <MessageSquare size={16} />
                    <div><strong>Rejection reason:</strong><p>{sub.adminReview.adminNotes}</p></div>
                  </div>
                )}

                <div className="admin-submissions-submission-actions">
                  {sub.status === 'pending_review' && (
                    <button className="admin-submissions-review-btn" onClick={() => openReview(sub)}>
                      <Eye size={16} /> Review Submission
                    </button>
                  )}
                  {sub.status === 'approved' && (
                    <div className="admin-submissions-approved-info">
                      <CheckCircle size={16} /><span>Approved</span>
                      <button className="admin-submissions-rereview-btn" onClick={() => openReview(sub)}>
                        <Eye size={14} /> Re-review
                      </button>
                    </div>
                  )}
                  {sub.status === 'listing_created' && (
                    <div className="admin-submissions-approved-info">
                      <CheckCircle size={16} /><span>Live</span>
                    </div>
                  )}
                  {sub.status === 'rejected' && (
                    <div className="admin-submissions-rejected-info">
                      <XCircle size={16} /><span>Rejected</span>
                      <button className="admin-submissions-restore-btn" onClick={() => handleRestore(sub)}>
                        <RotateCcw size={14} /> Restore
                      </button>
                      <button className="admin-submissions-rereview-btn" onClick={() => openReview(sub)}>
                        <Eye size={14} /> View
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      {showModal && selected && (() => {
        const ld = selected.listingData || {};
        const imgs = getImages(selected);
        const specs = ld.specifications || {};
        return (
          <div className="admin-submissions-modal-overlay">
            <div className="admin-submissions-modal-content">
              <div className="admin-submissions-modal-header">
                <h2>
                  {selected.status === 'pending_review' ? 'Review Inventory Submission'
                    : `Re-reviewing (${selected.status.replace(/_/g, ' ')})`}
                </h2>
                <button className="admin-submissions-modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>

              <div className="admin-submissions-modal-body">
                {/* Image Gallery */}
                {imgs.length === 0 ? (
                  <div className="review-gallery-empty"><Image size={32} /><span>No photos uploaded</span></div>
                ) : (
                  <div className="review-gallery">
                    <div className="review-gallery-main">
                      <img src={imgs[galleryIndex]} alt={`Item photo ${galleryIndex + 1}`} />
                      <span className="review-gallery-counter">{galleryIndex + 1} / {imgs.length}</span>
                      {galleryIndex > 0 && (
                        <button className="review-gallery-nav review-gallery-prev" onClick={() => setGalleryIndex(i => i - 1)}>‹</button>
                      )}
                      {galleryIndex < imgs.length - 1 && (
                        <button className="review-gallery-nav review-gallery-next" onClick={() => setGalleryIndex(i => i + 1)}>›</button>
                      )}
                    </div>
                    {imgs.length > 1 && (
                      <div className="review-gallery-thumbs">
                        {imgs.map((url, i) => (
                          <button key={i} className={`review-gallery-thumb${i === galleryIndex ? ' active' : ''}`} onClick={() => setGalleryIndex(i)}>
                            <img src={url} alt={`Thumb ${i + 1}`} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Title / Status / Price */}
                <div className="review-detail-section review-title-row">
                  <div>
                    <h3 className="review-vehicle-title">{ld.title || 'Unnamed Item'}</h3>
                    <div className="review-meta-row">
                      <StatusBadge status={selected.status} />
                      <span className="review-submitted-by">By: <strong>{selected.userName}</strong></span>
                      <span className="review-date">{formatDate(selected.submittedAt)}</span>
                    </div>
                  </div>
                  <div className="review-price-block">
                    <span className="review-price">{formatPrice(ld.price)}</span>
                  </div>
                </div>

                {/* Item Details */}
                <div className="review-detail-section">
                  <h4 className="review-section-title"><Package size={14} /> Item Details</h4>
                  <div className="review-spec-grid">
                    {[
                      ['Category', ld.category],
                      ['Condition', ld.condition],
                      ['Quantity', ld.quantity],
                      ['Seller Type', ld.sellerType === 'dealership' ? 'Dealership' : 'Private Seller'],
                    ].filter(([, v]) => v != null && v !== '').map(([label, value]) => (
                      <div key={label} className="review-spec-item">
                        <span className="review-spec-label">{label}</span>
                        <span className="review-spec-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specifications */}
                {(specs.brand || specs.partNumber || specs.compatibleMake || specs.compatibleModel) && (
                  <div className="review-detail-section">
                    <h4 className="review-section-title"><Tag size={14} /> Specifications</h4>
                    <div className="review-spec-grid">
                      {[
                        ['Brand', specs.brand],
                        ['Part Number', specs.partNumber],
                        ['Compatible Make', specs.compatibleMake],
                        ['Compatible Model', specs.compatibleModel],
                      ].filter(([, v]) => v).map(([label, value]) => (
                        <div key={label} className="review-spec-item">
                          <span className="review-spec-label">{label}</span>
                          <span className="review-spec-value">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {ld.description && (
                  <div className="review-detail-section">
                    <h4 className="review-section-title"><FileText size={14} /> Description</h4>
                    <p className="review-description">{ld.description}</p>
                  </div>
                )}

                {/* Contact & Location */}
                <div className="review-detail-section">
                  <h4 className="review-section-title"><Phone size={14} /> Contact &amp; Location</h4>
                  <div className="review-contact-grid">
                    {ld.contact?.phone && <div className="review-contact-item"><Phone size={13} /><span>{ld.contact.phone}</span></div>}
                    {ld.contact?.whatsapp && <div className="review-contact-item"><MessageCircle size={13} /><span>WhatsApp: {ld.contact.whatsapp}</span></div>}
                    {ld.contact?.email && <div className="review-contact-item"><span>{ld.contact.email}</span></div>}
                    {(ld.location?.city || ld.location?.country) && (
                      <div className="review-contact-item">
                        <MapPin size={13} />
                        <span>{[ld.location.city, ld.location.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Decision */}
                <div className="review-detail-section admin-submissions-review-form">
                  <h4 className="review-section-title"><CheckCircle size={14} /> Decision</h4>
                  {error && (
                    <div className="admin-submissions-error-message" style={{ marginBottom: '1rem' }}>
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}
                  <div className="admin-submissions-form-group">
                    <div className="admin-submissions-radio-group">
                      <label className="admin-submissions-radio-option">
                        <input type="radio" name="inv-action" value="approve"
                          checked={reviewData.action === 'approve'}
                          onChange={() => setReviewData(r => ({ ...r, action: 'approve' }))} />
                        <CheckCircle size={16} /> Approve
                      </label>
                      <label className="admin-submissions-radio-option">
                        <input type="radio" name="inv-action" value="reject"
                          checked={reviewData.action === 'reject'}
                          onChange={() => setReviewData(r => ({ ...r, action: 'reject' }))} />
                        <XCircle size={16} /> Reject
                      </label>
                    </div>
                  </div>

                  <div className="admin-submissions-form-group">
                    <label>Admin Notes</label>
                    <textarea
                      value={reviewData.adminNotes}
                      onChange={e => setReviewData(r => ({ ...r, adminNotes: e.target.value }))}
                      placeholder={reviewData.action === 'approve' ? 'Optional notes for approval…' : 'Reason for rejection…'}
                      rows={3}
                    />
                  </div>

                  {reviewData.action === 'approve' && (
                    <div className="admin-submissions-form-group">
                      <label className="admin-submissions-visibility-label">
                        <TrendingUp size={14} />
                        Listing Quality Score: <strong>{reviewData.visibilityScore}</strong>/100
                        <span className="admin-submissions-visibility-tier">
                          {reviewData.visibilityScore >= 80 ? '⭐ Featured' : reviewData.visibilityScore >= 50 ? '✓ Standard' : '↓ Basic'}
                        </span>
                      </label>
                      <input
                        type="range" min="0" max="100" step="5"
                        value={reviewData.visibilityScore}
                        onChange={e => setReviewData(r => ({ ...r, visibilityScore: Number(e.target.value) }))}
                        className="admin-submissions-visibility-slider"
                      />
                      <div className="admin-submissions-visibility-hints">
                        <span>0 — Low quality</span><span>50 — Good</span><span>100 — Excellent</span>
                      </div>
                      <p className="admin-submissions-visibility-info">
                        Scores ≥ 80 mark the listing as featured and boost search ranking.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-submissions-modal-actions">
                <button className="admin-submissions-cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="admin-submissions-submit-review-btn" onClick={submitReview} disabled={loading}>
                  {loading ? 'Processing…' : reviewData.action === 'approve' ? 'Approve Submission' : 'Reject Submission'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminInventorySubmissions;
