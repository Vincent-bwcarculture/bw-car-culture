// client/src/Admin/components/AdminUserSubmissions.js
// FIXED VERSION - Complete admin panel for reviewing user car listing submissions

import React, { useState, useEffect } from 'react';
import { 
  Eye, CheckCircle, XCircle, Clock, User, Car, 
  DollarSign, Phone, MapPin, Calendar, Star,
  Search, Filter, RefreshCw, ExternalLink,
  MessageSquare, AlertCircle, Info, Image
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
      setError('');
      
      console.log('🔍 Fetching admin user listings...');
      console.log('📝 Current axios config:', {
        baseURL: axios.defaults.baseURL,
        headers: axios.defaults.headers
      });
      
      // Check authentication token
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      console.log('🔑 Auth token present:', !!token);
      console.log('🔑 Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      // Make API call with explicit headers and full URL path
      let response;
      try {
        response = await axios.get('/api/admin/user-listings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (axiosError) {
        console.log('❌ Axios call failed, trying fetch with full URL...');
        
        // Fallback to fetch with full URL
        const fullUrl = 'https://bw-car-culture-api.vercel.app/api/admin/user-listings';
        const fetchResponse = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchResponse.status}`);
        }
        
        const data = await fetchResponse.json();
        response = { data };
      }
      
      console.log('📊 API Response:', response.data);
      
      if (response.data.success) {
        const submissionsData = response.data.data || response.data.submissions || [];
        setSubmissions(submissionsData);
        
        // Calculate stats from actual data
        const calculatedStats = {
          total: submissionsData.length,
          pending: submissionsData.filter(sub => sub.status === 'pending_review').length,
          approved: submissionsData.filter(sub => sub.status === 'approved').length,
          rejected: submissionsData.filter(sub => sub.status === 'rejected').length
        };
        
        setStats(response.data.stats || calculatedStats);
        console.log('📈 Stats calculated:', calculatedStats);
      } else {
        console.error('❌ API returned success: false');
        setError(response.data.message || 'Failed to load submissions');
      }
    } catch (error) {
      console.error('❌ Error fetching submissions:', error);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Failed to load submissions. Please check your connection and try again.'
      );
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
      filtered = filtered.filter(sub => {
        const title = sub.listingData?.title || '';
        const userName = sub.userName || '';
        const make = sub.listingData?.specifications?.make || '';
        const model = sub.listingData?.specifications?.model || '';
        
        return (
          title.toLowerCase().includes(query) ||
          userName.toLowerCase().includes(query) ||
          make.toLowerCase().includes(query) ||
          model.toLowerCase().includes(query)
        );
      });
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
      
      console.log('📝 Submitting review:', {
        submissionId: selectedSubmission._id,
        reviewData
      });
      
      // Check authentication token
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      console.log('🔑 Auth token for review:', !!token);
      
      let response;
      try {
        response = await axios.put(
          `/api/admin/user-listings/${selectedSubmission._id}/review`,
          reviewData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (axiosError) {
        console.log('❌ Axios review call failed, trying fetch with full URL...');
        
        // Fallback to fetch with full URL
        const fullUrl = `https://bw-car-culture-api.vercel.app/api/admin/user-listings/${selectedSubmission._id}/review`;
        const fetchResponse = await fetch(fullUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reviewData)
        });
        
        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchResponse.status}`);
        }
        
        const data = await fetchResponse.json();
        response = { data };
      }

      if (response.data.success) {
        // Update submission in local state
        setSubmissions(prev => prev.map(sub => 
          sub._id === selectedSubmission._id 
            ? { 
                ...sub, 
                status: reviewData.action === 'approve' ? 'approved' : 'rejected',
                adminNotes: reviewData.adminNotes,
                reviewedAt: new Date().toISOString(),
                reviewedBy: response.data.reviewedBy || 'Admin'
              }
            : sub
        ));

        setShowReviewModal(false);
        setSelectedSubmission(null);
        
        // Refresh to get updated stats
        fetchSubmissions();
        
        console.log('✅ Review submitted successfully');
      }
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      setError(
        error.response?.data?.message || 
        'Failed to submit review. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
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

  const formatPrice = (price) => {
    if (!price) return 'Price not set';
    return `P${Number(price).toLocaleString()}`;
  };

  const getImageUrl = (imageArray) => {
    if (!imageArray || !Array.isArray(imageArray) || imageArray.length === 0) {
      return null;
    }
    
    // Return the first image URL
    const firstImage = imageArray[0];
    return typeof firstImage === 'string' ? firstImage : firstImage?.url;
  };

  return (
    <div className="admin-submissions-container">
      {/* Header */}
      <div className="submissions-header">
        <h1>User Submissions Management</h1>
        <p>Review and manage car listing submissions from users</p>
        
        {/* Stats Grid */}
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
            <p>
              {submissions.length === 0 
                ? 'No user submissions have been received yet.' 
                : 'No submissions match your current filters.'}
            </p>
          </div>
        ) : (
          filteredSubmissions.map(submission => (
            <div key={submission._id} className="submission-card">
              <div className="submission-header">
                <div className="submission-info">
                  <h3>{submission.listingData?.title || 'Untitled Listing'}</h3>
                  <div className="submission-meta">
                    <span className="user-info">
                      <User size={14} />
                      {submission.userName || 'Unknown User'}
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
                <div className="submission-details">
                  {/* Vehicle Image */}
                  <div className="vehicle-image">
                    {getImageUrl(submission.listingData?.images) ? (
                      <img 
                        src={getImageUrl(submission.listingData.images)} 
                        alt="Vehicle"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="image-placeholder" style={{display: getImageUrl(submission.listingData?.images) ? 'none' : 'flex'}}>
                      <Image size={24} />
                      <span>No Image</span>
                    </div>
                  </div>
                  
                  {/* Vehicle Details */}
                  <div className="vehicle-details">
                    <div className="detail-row">
                      <Car size={16} />
                      <span>
                        {submission.listingData?.specifications?.make || 'Unknown'} {' '}
                        {submission.listingData?.specifications?.model || 'Unknown'} {' '}
                        ({submission.listingData?.specifications?.year || 'Unknown Year'})
                      </span>
                    </div>
                    
                    <div className="detail-row">
                      <DollarSign size={16} />
                      <span>{formatPrice(submission.listingData?.pricing?.price)}</span>
                    </div>
                    
                    <div className="detail-row">
                      <MapPin size={16} />
                      <span>{submission.listingData?.location?.city || 'Location not specified'}</span>
                    </div>
                    
                    {submission.listingData?.contact?.phone && (
                      <div className="detail-row">
                        <Phone size={16} />
                        <span>{submission.listingData.contact.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Admin Notes (if any) */}
                {submission.adminNotes && (
                  <div className="admin-notes">
                    <MessageSquare size={16} />
                    <div>
                      <strong>Admin Notes:</strong>
                      <p>{submission.adminNotes}</p>
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="submission-actions">
                  {submission.status === 'pending_review' && (
                    <>
                      <button 
                        className="review-btn"
                        onClick={() => handleReviewSubmission(submission)}
                      >
                        <Eye size={16} />
                        Review Submission
                      </button>
                    </>
                  )}
                  
                  {submission.status === 'approved' && (
                    <div className="approved-info">
                      <CheckCircle size={16} />
                      <span>Approved - Ready for payment</span>
                    </div>
                  )}
                  
                  {submission.status === 'rejected' && (
                    <div className="rejected-info">
                      <XCircle size={16} />
                      <span>Rejected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedSubmission && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Review Submission</h2>
              <button 
                className="modal-close"
                onClick={() => setShowReviewModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="submission-summary">
                <h3>{selectedSubmission.listingData?.title}</h3>
                <p>By: {selectedSubmission.userName}</p>
                <p>Vehicle: {selectedSubmission.listingData?.specifications?.make} {selectedSubmission.listingData?.specifications?.model}</p>
                <p>Price: {formatPrice(selectedSubmission.listingData?.pricing?.price)}</p>
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
                    placeholder={reviewData.action === 'approve' 
                      ? "Add any notes for the approval..." 
                      : "Explain why this submission is being rejected..."}
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
