// client/src/Admin/components/AdminUserSubmissions.js
// Component for admins to review user car listing submissions

import React, { useState, useEffect } from 'react';
import { 
  Eye, CheckCircle, XCircle, Clock, User, Car, 
  DollarSign, Phone, MapPin, Calendar, Star,
  Search, Filter, RefreshCw, ExternalLink,
  MessageSquare, AlertCircle
} from 'lucide-react';
import axios from '../../config/axios.js';
import './AdminUserSubmissions.css';

const AdminUserSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // Review form state
  const [reviewData, setReviewData] = useState({
    action: 'approve',
    adminNotes: '',
    subscriptionTier: 'basic'
  });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchQuery, statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/user-listings');
      if (response.data.success) {
        setSubmissions(response.data.data);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sub => 
        sub.listingData.title.toLowerCase().includes(query) ||
        sub.userName.toLowerCase().includes(query) ||
        sub.listingData.specifications.make.toLowerCase().includes(query) ||
        sub.listingData.specifications.model.toLowerCase().includes(query)
      );
    }

    setFilteredSubmissions(filtered);
  };

  const handleReviewSubmission = (submission) => {
    setSelectedSubmission(submission);
    setReviewData({
      action: 'approve',
      adminNotes: '',
      subscriptionTier: 'basic'
    });
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedSubmission) return;

    try {
      setLoading(true);
      const response = await axios.put(
        `/api/admin/user-listings/${selectedSubmission._id}/review`,
        reviewData
      );

      if (response.data.success) {
        // Update submission in local state
        setSubmissions(prev => prev.map(sub => 
          sub._id === selectedSubmission._id 
            ? { 
                ...sub, 
                status: reviewData.action === 'approve' ? 'approved' : 'rejected',
                adminNotes: reviewData.adminNotes,
                reviewedAt: new Date().toISOString()
              }
            : sub
        ));

        setShowReviewModal(false);
        setSelectedSubmission(null);
        
        // Refresh stats
        fetchSubmissions();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending_review: { 
        icon: Clock, 
        color: 'orange', 
        label: 'Pending Review' 
      },
      approved: { 
        icon: CheckCircle, 
        color: 'green', 
        label: 'Approved' 
      },
      rejected: { 
        icon: XCircle, 
        color: 'red', 
        label: 'Rejected' 
      },
      listing_created: { 
        icon: Car, 
        color: 'blue', 
        label: 'Listing Created' 
      }
    };

    const config = configs[status] || configs.pending_review;
    const IconComponent = config.icon;

    return (
      <span className={`status-badge status-${config.color}`}>
        <IconComponent size={14} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="admin-submissions-container">
      <div className="submissions-header">
        <h1>User Car Listing Submissions</h1>
        <p>Review and approve user-submitted car listings</p>
        
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <Car size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Submissions</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon pending">
              <Clock size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.pending}</div>
              <div className="stat-label">Pending Review</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon approved">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.approved}</div>
              <div className="stat-label">Approved</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon rejected">
              <XCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.rejected}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="submissions-filters">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by title, user, make, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <Filter size={20} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="listing_created">Listing Created</option>
          </select>
        </div>

        <button 
          onClick={fetchSubmissions}
          className="refresh-btn"
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Submissions List */}
      <div className="submissions-list">
        {loading ? (
          <div className="loading-state">
            <RefreshCw size={32} className="spinning" />
            <p>Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="empty-state">
            <Car size={48} />
            <h3>No submissions found</h3>
            <p>No user submissions match your current filters.</p>
          </div>
        ) : (
          filteredSubmissions.map(submission => (
            <div key={submission._id} className="submission-card">
              <div className="submission-header">
                <div className="submission-info">
                  <h3>{submission.listingData.title}</h3>
                  <div className="submission-meta">
                    <span className="user-info">
                      <User size={14} />
                      {submission.userName}
                    </span>
                    <span className="date-info">
                      <Calendar size={14} />
                      {formatDate(submission.submittedAt)}
                    </span>
                  </div>
                </div>
                <div className="submission-status">
                  {getStatusBadge(submission.status)}
                </div>
              </div>

              <div className="submission-content">
                <div className="car-details">
                  <div className="car-basic">
                    <Car size={16} />
                    <span>{submission.listingData.specifications.year} {submission.listingData.specifications.make} {submission.listingData.specifications.model}</span>
                  </div>
                  <div className="car-price">
                    <DollarSign size={16} />
                    <span>P{Number(submission.listingData.pricing.price).toLocaleString()}</span>
                  </div>
                  <div className="car-location">
                    <MapPin size={16} />
                    <span>{submission.listingData.contact.location.city}</span>
                  </div>
                  <div className="car-contact">
                    <Phone size={16} />
                    <span>{submission.listingData.contact.phone}</span>
                  </div>
                </div>

                {submission.listingData.images && submission.listingData.images.length > 0 && (
                  <div className="car-images">
                    <img 
                      src={submission.listingData.images[0].url} 
                      alt={submission.listingData.title}
                      className="submission-thumbnail"
                    />
                    {submission.listingData.images.length > 1 && (
                      <span className="image-count">
                        +{submission.listingData.images.length - 1} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="submission-actions">
                <button 
                  className="review-btn"
                  onClick={() => handleReviewSubmission(submission)}
                  disabled={submission.status !== 'pending_review'}
                >
                  <Eye size={16} />
                  {submission.status === 'pending_review' ? 'Review' : 'View Details'}
                </button>
                
                {submission.adminNotes && (
                  <div className="admin-notes">
                    <MessageSquare size={14} />
                    <span>Has admin notes</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <div className="modal-overlay">
          <div className="review-modal">
            <div className="modal-header">
              <h2>Review Submission</h2>
              <button 
                className="close-btn"
                onClick={() => setShowReviewModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="submission-details">
                <h3>{selectedSubmission.listingData.title}</h3>
                <div className="details-grid">
                  <div><strong>Submitted by:</strong> {selectedSubmission.userName}</div>
                  <div><strong>Email:</strong> {selectedSubmission.userEmail}</div>
                  <div><strong>Phone:</strong> {selectedSubmission.listingData.contact.phone}</div>
                  <div><strong>Vehicle:</strong> {selectedSubmission.listingData.specifications.year} {selectedSubmission.listingData.specifications.make} {selectedSubmission.listingData.specifications.model}</div>
                  <div><strong>Price:</strong> P{Number(selectedSubmission.listingData.pricing.price).toLocaleString()}</div>
                  <div><strong>Location:</strong> {selectedSubmission.listingData.contact.location.city}</div>
                </div>

                <div className="description-section">
                  <strong>Description:</strong>
                  <p>{selectedSubmission.listingData.description}</p>
                </div>

                {selectedSubmission.listingData.images && (
                  <div className="images-section">
                    <strong>Images ({selectedSubmission.listingData.images.length}):</strong>
                    <div className="images-grid">
                      {selectedSubmission.listingData.images.slice(0, 4).map((image, index) => (
                        <img 
                          key={index}
                          src={image.url} 
                          alt={`${selectedSubmission.listingData.title} ${index + 1}`}
                          className="review-image"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="review-form">
                <div className="form-group">
                  <label>Decision</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="action"
                        value="approve"
                        checked={reviewData.action === 'approve'}
                        onChange={(e) => setReviewData({...reviewData, action: e.target.value})}
                      />
                      <CheckCircle size={16} />
                      Approve
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="action"
                        value="reject"
                        checked={reviewData.action === 'reject'}
                        onChange={(e) => setReviewData({...reviewData, action: e.target.value})}
                      />
                      <XCircle size={16} />
                      Reject
                    </label>
                  </div>
                </div>

                {reviewData.action === 'approve' && (
                  <div className="form-group">
                    <label>Recommended Subscription Tier</label>
                    <select
                      value={reviewData.subscriptionTier}
                      onChange={(e) => setReviewData({...reviewData, subscriptionTier: e.target.value})}
                    >
                      <option value="basic">Basic (P50/month)</option>
                      <option value="standard">Standard (P100/month)</option>
                      <option value="premium">Premium (P200/month)</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Admin Notes</label>
                  <textarea
                    value={reviewData.adminNotes}
                    onChange={(e) => setReviewData({...reviewData, adminNotes: e.target.value})}
                    placeholder="Add notes about your decision..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowReviewModal(false)}
              >
                Cancel
              </button>
              <button 
                className="submit-review-btn"
                onClick={submitReview}
                disabled={loading}
              >
                {loading ? 'Processing...' : `${reviewData.action === 'approve' ? 'Approve' : 'Reject'} Submission`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserSubmissions;
