// client/src/Admin/components/AdminUserSubmissions.js
// UPDATED VERSION - Adding tier/addon display to your working code

import React, { useState, useEffect } from 'react';
import { 
  Eye, CheckCircle, XCircle, Clock, User, Car, 
  DollarSign, Phone, MapPin, Calendar, Star,
  Search, Filter, RefreshCw, ExternalLink,
  MessageSquare, AlertCircle, Info, Image,
  Award, Shield, TrendingUp, BarChart3, Camera
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

  // NEW: Pricing data from endpoints (ADDED)
  const [pricingData, setPricingData] = useState({
    tiers: {},
    addons: {},
    loaded: false,
    loading: false
  });

  // Review form state
  const [reviewData, setReviewData] = useState({
    action: 'approve',
    adminNotes: '',
    subscriptionTier: 'basic'
  });

  useEffect(() => {
    fetchSubmissions();
    fetchPricingData(); // NEW: Fetch pricing data (ADDED)
  }, []);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchQuery, statusFilter]);

  // NEW: Fetch pricing data from endpoints (ADDED)
  const fetchPricingData = async () => {
    try {
      setPricingData(prev => ({ ...prev, loading: true }));
      console.log('🔍 Fetching pricing data from endpoints...');
      
      const [tiersResponse, addonsResponse] = await Promise.all([
        axios.get('/api/payments/available-tiers'),
        axios.get('/api/addons/available')
      ]);

      if (tiersResponse.data.success && addonsResponse.data.success) {
        const tiers = tiersResponse.data.data.tiers;
        const addons = addonsResponse.data.data.addons;

        setPricingData({
          tiers,
          addons,
          loaded: true,
          loading: false
        });

        console.log('💰 Pricing data loaded:', { tiers, addons });
      } else {
        throw new Error('Pricing endpoints returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Error fetching pricing data:', error);
      setPricingData(prev => ({ 
        ...prev, 
        loaded: false, 
        loading: false 
      }));
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Fetching admin user listings...');
      
      // Check authentication token
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      console.log('🔑 Auth token present:', !!token);
      
      // KEEPING YOUR WORKING API PATH
      const response = await axios.get('/api/admin/user-listings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
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
      subscriptionTier: submission.listingData?.selectedPlan || 'basic' // NEW: Use selected plan (ADDED)
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
      
      // KEEPING YOUR WORKING API PATH
      const response = await axios.put(
        `/api/admin/user-listings/${selectedSubmission._id}/review`,
        reviewData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

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

  // NEW: Helper functions for pricing display (ADDED)
  const getPlanInfo = (planId) => {
    if (!pricingData.loaded || !planId) {
      return { name: 'Plan Not Available', price: 0, duration: 0 };
    }
    
    const planData = pricingData.tiers[planId];
    if (!planData) {
      return { name: 'Unknown Plan', price: 0, duration: 0 };
    }
    
    return {
      name: planData.name,
      price: planData.price,
      duration: planData.duration
    };
  };

  const getAddonInfo = (addonId) => {
    if (!pricingData.loaded || !addonId) {
      return { name: 'Addon Not Available', price: 0 };
    }
    
    const addonData = pricingData.addons[addonId];
    if (!addonData) {
      return { name: 'Unknown Addon', price: 0 };
    }
    
    return {
      name: addonData.name,
      price: addonData.price
    };
  };

  const getAddonIcon = (addonId) => {
    const iconMap = {
      'featured': <Star size={14} />,
      'photography': <Camera size={14} />,
      'boost': <TrendingUp size={14} />,
      'review': <Shield size={14} />,
      'analytics': <BarChart3 size={14} />,
      'listing_assistance': <User size={14} />,
      'full_assistance': <Award size={14} />,
      'premium_photos': <Camera size={14} />
    };
    return iconMap[addonId] || <Star size={14} />;
  };

  const calculateTotalCost = (selectedPlan, selectedAddons) => {
    if (!pricingData.loaded) return 0;
    
    let total = 0;
    
    // Add plan cost
    if (selectedPlan && pricingData.tiers[selectedPlan]) {
      total += pricingData.tiers[selectedPlan].price;
    }
    
    // Add addons cost
    if (selectedAddons && Array.isArray(selectedAddons)) {
      selectedAddons.forEach(addonId => {
        if (pricingData.addons[addonId]) {
          total += pricingData.addons[addonId].price;
        }
      });
    }
    
    return total;
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
          filteredSubmissions.map(submission => {
            // NEW: Calculate pricing info for this submission (ADDED)
            const planInfo = getPlanInfo(submission.listingData?.selectedPlan);
            const selectedAddons = submission.listingData?.selectedAddons || [];
            const totalCost = calculateTotalCost(submission.listingData?.selectedPlan, selectedAddons);
            
            return (
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
                  
                  {/* NEW: Plan and Pricing Section (ADDED) */}
                  {(submission.listingData?.selectedPlan || selectedAddons.length > 0) && (
                    <div className="plan-pricing-section">
                      <h4>
                        <Star size={16} />
                        Selected Plan & Add-ons
                      </h4>
                      
                      {/* Pricing Loading State */}
                      {pricingData.loading && (
                        <div className="pricing-loading">
                          <RefreshCw size={14} className="spinning" />
                          <span>Loading pricing data...</span>
                        </div>
                      )}
                      
                      {/* Pricing Not Available */}
                      {!pricingData.loaded && !pricingData.loading && (
                        <div className="pricing-unavailable">
                          <AlertCircle size={14} />
                          <span>Pricing data unavailable</span>
                          <button onClick={fetchPricingData} className="retry-pricing-btn">
                            Retry
                          </button>
                        </div>
                      )}
                      
                      {/* Selected Plan */}
                      {submission.listingData?.selectedPlan && pricingData.loaded && (
                        <div className="selected-plan">
                          <div className="plan-badge">
                            <Award size={14} />
                            <span className="plan-name">{planInfo.name}</span>
                            <span className="plan-price">P{planInfo.price}</span>
                          </div>
                          <div className="plan-duration">
                            {planInfo.duration} days active
                          </div>
                        </div>
                      )}
                      
                      {/* Selected Add-ons */}
                      {selectedAddons.length > 0 && pricingData.loaded && (
                        <div className="selected-addons">
                          <div className="addons-label">Add-ons Selected:</div>
                          <div className="addons-list">
                            {selectedAddons.map((addonId, index) => {
                              const addonInfo = getAddonInfo(addonId);
                              return (
                                <div key={index} className="addon-item">
                                  <div className="addon-info">
                                    {getAddonIcon(addonId)}
                                    <span className="addon-name">{addonInfo.name}</span>
                                  </div>
                                  <span className="addon-price">+P{addonInfo.price}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Total Pricing */}
                      {pricingData.loaded && totalCost > 0 && (
                        <div className="pricing-total">
                          <div className="total-breakdown">
                            <div className="total-row">
                              <span>Plan:</span>
                              <span>P{planInfo.price}</span>
                            </div>
                            {selectedAddons.length > 0 && (
                              <div className="total-row">
                                <span>Add-ons:</span>
                                <span>P{totalCost - planInfo.price}</span>
                              </div>
                            )}
                            <div className="total-row final-total">
                              <span>Total Amount:</span>
                              <span>P{totalCost}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
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
                      <button 
                        className="review-btn"
                        onClick={() => handleReviewSubmission(submission)}
                      >
                        <Eye size={16} />
                        Review Submission
                      </button>
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
            );
          })
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
                
                {/* NEW: Show selected plan and pricing in modal (ADDED) */}
                {(selectedSubmission.listingData?.selectedPlan || selectedSubmission.listingData?.selectedAddons?.length > 0) && (
                  <div className="modal-pricing-summary">
                    <h4>Selected Plan & Pricing:</h4>
                    {pricingData.loaded ? (
                      <>
                        {selectedSubmission.listingData?.selectedPlan && (
                          <p>Plan: {getPlanInfo(selectedSubmission.listingData.selectedPlan).name} 
                             (P{getPlanInfo(selectedSubmission.listingData.selectedPlan).price})</p>
                        )}
                        {selectedSubmission.listingData?.selectedAddons?.length > 0 && (
                          <p>Add-ons: {selectedSubmission.listingData.selectedAddons.length} selected 
                             (+P{selectedSubmission.listingData.selectedAddons.reduce((total, addonId) => 
                               total + getAddonInfo(addonId).price, 0)})</p>
                        )}
                        <p><strong>Total: P{calculateTotalCost(selectedSubmission.listingData?.selectedPlan, selectedSubmission.listingData?.selectedAddons)}</strong></p>
                      </>
                    ) : (
                      <p>Loading pricing information...</p>
                    )}
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

                {/* NEW: Use actual pricing data in dropdown (UPDATED) */}
                {reviewData.action === 'approve' && pricingData.loaded && (
                  <div className="form-group">
                    <label>Recommended Subscription Tier</label>
                    <select
                      value={reviewData.subscriptionTier}
                      onChange={(e) => setReviewData({...reviewData, subscriptionTier: e.target.value})}
                    >
                      {Object.entries(pricingData.tiers).map(([tierId, tierData]) => (
                        <option key={tierId} value={tierId}>
                          {tierData.name} (P{tierData.price})
                        </option>
                      ))}
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
