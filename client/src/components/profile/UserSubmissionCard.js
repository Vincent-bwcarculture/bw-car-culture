// client/src/components/profile/UserSubmissionCard.js
// Complete submission card component with editing functionality

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Image, 
  ExternalLink, 
  Edit, 
  Upload, 
  Info, 
  CheckCircle, 
  AlertCircle, 
  Star, 
  Eye, 
  DollarSign,
  Copy,
  Clock
} from 'lucide-react';
import './UserSubmissionCard.css';

const UserSubmissionCard = ({ 
  submission, 
  getPlanInfo, 
  calculateTotalCost, 
  getAddonDetails, 
  getAddonInfo, 
  formatDate, 
  getStatusBadge, 
  getPrimaryImage, 
  pricingData, 
  showMessage, 
  setActiveSection, 
  setListingStep, 
  setSelectedPlan,
  // NEW: Edit functionality props
  onEditSubmission,
  onCloneSubmission,
  canEditSubmission,
  canCloneSubmission,
  getEditButtonInfo,
  editLoading = false
}) => {
  const navigate = useNavigate();

  // Calculate pricing with FREE TIER support
  const selectedPlan = submission.listingData?.selectedPlan;
  const selectedAddons = submission.listingData?.selectedAddons || [];
  const planInfo = getPlanInfo(selectedPlan);
  const totalCost = calculateTotalCost(selectedPlan, selectedAddons);
  const addonDetails = getAddonDetails(selectedAddons);
  const addonCost = totalCost - planInfo.price;
  const isFreeSubmission = selectedPlan === 'free';
  const primaryImage = getPrimaryImage(submission);

  // Check if listing is viewable (active/live)
  const isListingLive = (status) => {
    return ['listing_created', 'approved'].includes(status);
  };

  // Check if listing can be updated (legacy - keeping for compatibility)
  const canUpdateListing = (status) => {
    return ['listing_created', 'approved', 'pending_review'].includes(status);
  };

  // Handle viewing the live listing on the website
  const handleViewListing = (submission) => {
    console.log('🔍 === VIEW LISTING DEBUG START ===');
    console.log('Full submission:', submission);
    console.log('Submission ID:', submission._id);
    console.log('Listing ID field:', submission.listingId);
    console.log('Status:', submission.status);
    console.log('Title:', submission.listingData?.title);
    console.log('Admin Review:', submission.adminReview);
    
    // Check the specific status and determine the correct approach
    let targetId = null;
    let shouldProceed = false;
    
    switch (submission.status) {
      case 'listing_created':
        // This should be a live listing
        targetId = submission.listingId || submission._id;
        shouldProceed = true;
        console.log('✅ Status: listing_created - proceeding with ID:', targetId);
        break;
        
      case 'approved':
        // This might be approved but not yet converted to listing
        targetId = submission.listingId || submission._id;
        shouldProceed = true;
        console.log('⚠️ Status: approved - trying with ID:', targetId);
        break;
        
      default:
        console.log('❌ Status not suitable for viewing:', submission.status);
        showMessage('error', `Cannot view listing with status: ${submission.status}`);
        return;
    }
    
    if (!targetId) {
      console.log('❌ No target ID found');
      showMessage('error', 'Unable to find listing ID');
      return;
    }
    
    const listingUrl = `/listing/${targetId}`;
    console.log('📍 Navigating to URL:', listingUrl);
    console.log('🔍 === VIEW LISTING DEBUG END ===');
    
    // Navigate to the listing
    navigate(listingUrl);
    showMessage('success', 'Opening your listing...');
  };

  // NEW: Handle edit button click
  const handleEditClick = () => {
    if (editLoading) return;
    onEditSubmission(submission);
  };

  // NEW: Handle clone button click
  const handleCloneClick = () => {
    if (editLoading) return;
    onCloneSubmission(submission);
  };

  // Handle resubmission for rejected listings (legacy - keeping for compatibility)
  const handleResubmit = () => {
    setActiveSection('create-listing');
    setListingStep('form');
    // Pre-select free tier if it was originally free
    if (isFreeSubmission) {
      setSelectedPlan('free');
    }
    showMessage('info', 'Creating new listing...');
  };

  // NEW: Get edit button configuration
  const editButtonInfo = getEditButtonInfo ? getEditButtonInfo(submission) : null;
  const canEdit = canEditSubmission ? canEditSubmission(submission) : false;
  const canClone = canCloneSubmission ? canCloneSubmission(submission) : false;

  // Check if actions are available
  const canView = isListingLive(submission.status);
  const canUpdate = canUpdateListing(submission.status); // Legacy compatibility

  // === SUBMISSION STATUS RENDERING WITH FREE TIER SUPPORT ===
  const renderSubmissionStatus = (submission) => {
    const isFreeSubmission = submission.selectedTier === 'free' || 
                           submission.paymentRequired === false ||
                           submission.listingData?.selectedPlan === 'free';
    
    if (submission.status === 'pending_review') {
      return (
        <div className="usc-status-message usc-status-pending">
          <Info size={14} />
          <div className="usc-message-content">
            <div className="usc-status-text">
              {isFreeSubmission ? (
                <>
                  🆓 <strong>FREE listing</strong> under review
                  <span className="usc-review-time"> • Est. 24-48 hours</span>
                </>
              ) : (
                <>
                  Your listing is being reviewed by our team. We'll contact you within 24-48 hours.
                  <span className="usc-review-time"> • Est. 24-48 hours</span>
                </>
              )}
            </div>
            {isFreeSubmission && (
              <div className="usc-free-status-note">
                <CheckCircle size={12} color="#10b981" />
                <span>No payment required - listing will go live once approved!</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    if (submission.status === 'approved') {
      return (
        <div className="usc-status-message usc-status-approved">
          <CheckCircle size={14} />
          <div className="usc-message-content">
            <div className="usc-approval-details">
              <span>
                🎉 Great! Your listing has been approved.
                {isFreeSubmission && <span className="usc-free-label"> (FREE TIER)</span>}
              </span>
              <div className="usc-next-steps">
                {isFreeSubmission ? (
                  <span>Your free listing will go live automatically! 🎉</span>
                ) : (
                  <div className="usc-payment-info">
                    <div className="usc-payment-instructions">
                      <Info size={12} />
                      <span>Check your email for payment instructions. Complete payment to make your listing live.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {!isFreeSubmission && (
              <button className="usc-btn usc-btn-primary usc-btn-small">
                <DollarSign size={14} />
                Complete Payment
              </button>
            )}
          </div>
        </div>
      );
    }
    
    if (submission.status === 'listing_created') {
      return (
        <div className="usc-status-message usc-status-live">
          <Star size={14} />
          <div className="usc-message-content">
            <div className="usc-live-details">
              <span>🚗 Your listing is now live on our platform!</span>
              {isFreeSubmission && (
                <div className="usc-free-live-info">
                  <span className="usc-free-label">FREE TIER</span>
                  <span>Active for 30 days • Basic visibility</span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    if (submission.status === 'rejected') {
      return (
        <div className="usc-status-message usc-status-rejected">
          <AlertCircle size={14} />
          <div className="usc-message-content">
            <span>
              This listing was not approved.
              {isFreeSubmission && <span className="usc-free-label"> (FREE TIER)</span>}
              {submission.adminReview?.adminNotes && (
                <span className="usc-admin-notes"> Reason: {submission.adminReview.adminNotes}</span>
              )}
            </span>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div key={submission._id} className="usc-submission-card">
      <div className="usc-submission-main">
        {/* Image Section */}
        <div className="usc-submission-image">
          {primaryImage ? (
            <img 
              src={primaryImage} 
              alt={submission.listingData?.title || 'Car listing'}
              className="usc-car-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`usc-image-placeholder ${primaryImage ? 'usc-hidden' : ''}`}>
            <Image size={24} />
            <span>No Image</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="usc-submission-content">
          <div className="usc-submission-header">
            <h4 className="usc-submission-title">
              {submission.listingData?.title || 'Untitled Listing'}
              {isFreeSubmission && <span className="usc-free-label">FREE</span>}
            </h4>
            {getStatusBadge(submission.status)}
          </div>

          <div className="usc-submission-details">
            <div className="usc-detail-row">
              <span className="usc-detail-label">Vehicle:</span>
              <span className="usc-detail-value">
                {submission.listingData?.specifications?.year} {submission.listingData?.specifications?.make} {submission.listingData?.specifications?.model}
              </span>
            </div>
            
            <div className="usc-detail-row">
              <span className="usc-detail-label">Car Price:</span>
              <span className="usc-detail-value usc-price">
                {submission.listingData?.pricing?.price 
                  ? `P${Number(submission.listingData.pricing.price).toLocaleString()}`
                  : 'Price not set'
                }
              </span>
            </div>
            
            <div className="usc-detail-row">
              <span className="usc-detail-label">Submitted:</span>
              <span className="usc-detail-value">
                {formatDate(submission.submittedAt)}
              </span>
            </div>

            {/* NEW: Show edit history if available */}
            {submission.editHistory && submission.editHistory.length > 0 && (
              <div className="usc-detail-row">
                <span className="usc-detail-label">Last edited:</span>
                <span className="usc-detail-value">
                  {formatDate(submission.editHistory[submission.editHistory.length - 1].editedAt)}
                </span>
              </div>
            )}

            {/* NEW: Show admin review info if available */}
            {submission.adminReview && (
              <div className="usc-detail-row">
                <span className="usc-detail-label">Reviewed:</span>
                <span className="usc-detail-value">
                  {formatDate(submission.adminReview.reviewedAt)}
                </span>
              </div>
            )}

            {submission.listingData?.location?.city && (
              <div className="usc-detail-row">
                <span className="usc-detail-label">Location:</span>
                <span className="usc-detail-value">
                  {submission.listingData.location.city}
                </span>
              </div>
            )}
          </div>

          {/* ENHANCED: Action Buttons Section with Edit Functionality */}
          <div className="usc-submission-actions">
            {/* Primary Actions Row */}
            <div className="usc-primary-actions">
              {/* NEW: Edit Button with Status-Aware Text */}
              {canEdit && editButtonInfo && (
                <button
                  className={`usc-btn usc-btn-${editButtonInfo.type} usc-btn-small`}
                  onClick={handleEditClick}
                  disabled={editLoading}
                  title={editButtonInfo.tooltip}
                >
                  <Edit size={14} />
                  {editLoading ? 'Loading...' : editButtonInfo.text}
                </button>
              )}

              {/* NEW: Clone Button */}
              {canClone && (
                <button
                  className="usc-btn usc-btn-secondary usc-btn-small"
                  onClick={handleCloneClick}
                  disabled={editLoading}
                  title="Create a copy of this submission"
                >
                  <Copy size={14} />
                  Clone
                </button>
              )}

              {/* View Live Listing */}
              {canView && (
                <button
                  className="usc-btn usc-btn-success usc-btn-small"
                  onClick={() => handleViewListing(submission)}
                  title="View your listing on the website"
                >
                  <ExternalLink size={14} />
                  View Live
                </button>
              )}

              {/* Legacy: Old resubmit button for rejected listings */}
              {submission.status === 'rejected' && !canEdit && (
                <button
                  className="usc-btn usc-btn-warning usc-btn-small"
                  onClick={handleResubmit}
                  title="Create new listing"
                >
                  <Upload size={14} />
                  Create New
                </button>
              )}
            </div>

            {/* Secondary Actions Row - Status Messages */}
            <div className="usc-secondary-actions">
              {submission.status === 'pending_review' && (
                <div className="usc-status-indicator">
                  <Clock size={12} />
                  <span>Awaiting admin review</span>
                </div>
              )}

              {submission.status === 'rejected' && (
                <div className="usc-status-indicator usc-status-error">
                  <AlertCircle size={12} />
                  <span>Needs attention</span>
                </div>
              )}

              {submission.status === 'approved' && (
                <div className="usc-status-indicator usc-status-success">
                  <CheckCircle size={12} />
                  <span>{isFreeSubmission ? 'Going live soon' : 'Payment required'}</span>
                </div>
              )}

              {submission.status === 'listing_created' && (
                <div className="usc-status-indicator usc-status-live">
                  <Star size={12} />
                  <span>Live on platform</span>
                </div>
              )}
            </div>
          </div>

          {/* Plan Details Section with FREE TIER support */}
          {selectedPlan && (
            <div className="usc-plan-details">
              <div className="usc-plan-header">
                <h5>Selected Plan & Services</h5>
              </div>
              {!pricingData.loaded ? (
                <div className="usc-pricing-loading">
                  <div className="usc-small-spinner"></div>
                  <span>Loading pricing...</span>
                </div>
              ) : (
                <div className="usc-plan-info">
                  {/* Plan Info with FREE indication */}
                  <div className="usc-plan-name">
                    <span className={`usc-plan-badge ${isFreeSubmission ? 'usc-free-plan' : ''}`}>
                      {planInfo.name}
                      {isFreeSubmission && ' (FREE)'}
                    </span>
                  </div>
                  
                  {/* Addons (only for non-free plans typically) */}
                  {selectedAddons.length > 0 && pricingData.loaded && (
                    <div className="usc-selected-addons">
                      <div className="usc-addons-label">Add-ons Selected:</div>
                      <div className="usc-addons-list">
                        {selectedAddons.map((addonId, index) => {
                          const addonInfo = getAddonInfo(addonId);
                          
                          return (
                            <div key={index} className="usc-addon-item">
                              <div className="usc-addon-info">
                                <span className="usc-addon-name">{addonInfo.name}</span>
                              </div>
                              <span className="usc-addon-price">+P{addonInfo.price.toLocaleString()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Pricing breakdown */}
                  <div className="usc-plan-pricing">
                    <div className="usc-pricing-row">
                      <span className="usc-pricing-label">Base Plan:</span>
                      <span className="usc-pricing-value">
                        {isFreeSubmission ? 'FREE' : `P${planInfo.price.toLocaleString()}`}
                      </span>
                    </div>
                    
                    {selectedAddons.length > 0 && (
                      <div className="usc-pricing-row">
                        <span className="usc-pricing-label">Add-ons:</span>
                        <span className="usc-pricing-value">P{(totalCost - planInfo.price).toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="usc-pricing-row usc-total-row">
                      <span className="usc-pricing-label">Total Amount:</span>
                      <span className={`usc-pricing-value usc-total-price ${isFreeSubmission ? 'usc-free-total' : ''}`}>
                        {isFreeSubmission ? 'FREE' : `P${totalCost.toLocaleString()}`}
                      </span>
                    </div>
                    
                    <div className="usc-pricing-row">
                      <span className="usc-pricing-label">Duration:</span>
                      <span className="usc-pricing-value">{planInfo.duration} days</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NEW: Edit History Section */}
          {submission.editHistory && submission.editHistory.length > 0 && (
            <div className="usc-edit-history">
              <div className="usc-edit-header">
                <h5>Recent Changes</h5>
              </div>
              <div className="usc-edit-item">
                <div className="usc-edit-info">
                  <span className="usc-edit-date">
                    {formatDate(submission.editHistory[submission.editHistory.length - 1].editedAt)}
                  </span>
                  {submission.editHistory[submission.editHistory.length - 1].editNote && (
                    <span className="usc-edit-note">
                      "{submission.editHistory[submission.editHistory.length - 1].editNote}"
                    </span>
                  )}
                </div>
                {submission.editHistory[submission.editHistory.length - 1].requiresReview && (
                  <span className="usc-review-indicator">
                    <Clock size={12} />
                    Review required
                  </span>
                )}
              </div>
            </div>
          )}

          {/* NEW: Admin Review Notes */}
          {submission.adminReview && submission.adminReview.adminNotes && (
            <div className="usc-admin-review">
              <div className="usc-admin-header">
                <h5>Admin Review</h5>
              </div>
              <div className="usc-admin-content">
                <p className="usc-admin-notes">{submission.adminReview.adminNotes}</p>
                <span className="usc-review-date">
                  Reviewed: {formatDate(submission.adminReview.reviewedAt)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status-specific actions with FREE TIER support */}
      <div className="usc-submission-status">
        {renderSubmissionStatus(submission)}
      </div>
    </div>
  );
};

export default UserSubmissionCard;