// client/src/components/profile/UserSubmissionCard.js
// FIXED VERSION - Simplified real-time integration without breaking existing logic

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../config/axios.js';
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
  Clock,
  FileText,
  XCircle,
  TrendingUp,
  Shield,
  Zap,
  RefreshCw
} from 'lucide-react';
import ManualPaymentModal from './ManualPaymentModal/ManualPaymentModal.js';
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
  // Edit functionality props
  onEditSubmission,
  onCloneSubmission,
  canEditSubmission,
  canCloneSubmission,
  getEditButtonInfo,
  editLoading = false,
  // Optional: Parent refresh
  onRefreshSubmissions
}) => {
  const navigate = useNavigate();

  // Payment Modal State
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [manualPaymentInfo, setManualPaymentInfo] = useState(null);
  
  // SIMPLIFIED: Enhanced status tracking without breaking existing logic
  const [enhancedStatus, setEnhancedStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastStatusCheck, setLastStatusCheck] = useState(null);

  // Calculate pricing with FREE TIER support (keep your existing logic)
  const selectedPlan = submission.listingData?.selectedPlan;
  const selectedAddons = submission.listingData?.selectedAddons || [];
  const planInfo = getPlanInfo(selectedPlan);
  const totalCost = calculateTotalCost(selectedPlan, selectedAddons);
  const addonDetails = getAddonDetails(selectedAddons);
  const addonCost = totalCost - planInfo.price;
  const isFreeSubmission = selectedPlan === 'free';
  const primaryImage = getPrimaryImage(submission);

  // SIMPLIFIED: Check enhanced status using existing APIs
  const checkEnhancedStatus = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    
    try {
      // Use existing payment status API
      const response = await axios.get(`/api/payments/status/${submission._id}`);
      
      if (response.data.success) {
        const paymentData = response.data.data;
        console.log('🔍 Enhanced status check:', paymentData);
        
        // Create enhanced status object
        const enhanced = {
          paymentStatus: paymentData.paymentStatus,
          proofSubmitted: paymentData.proofSubmitted,
          proofApprovedAt: paymentData.proofApprovedAt,
          isLive: paymentData.paymentStatus === 'completed' && submission.status === 'approved',
          lastChecked: new Date()
        };
        
        setEnhancedStatus(enhanced);
        setLastStatusCheck(new Date());
        
        // Show success message if status changed to live
        if (enhanced.isLive && !silent) {
          showMessage('success', '🎉 Your listing is now live!');
          if (onRefreshSubmissions) {
            setTimeout(() => onRefreshSubmissions(), 1000);
          }
        }
        
        return enhanced;
      }
    } catch (error) {
      console.log('Enhanced status check failed:', error.message);
      // Don't show error for silent checks
      if (!silent) {
        showMessage('error', 'Failed to check latest status. Please try again.');
      }
    } finally {
      if (!silent) setIsRefreshing(false);
    }
    return null;
  }, [submission._id, submission.status, showMessage, onRefreshSubmissions]);

  // Auto-refresh for approved submissions (simplified)
  useEffect(() => {
    let intervalId = null;
    
    // Only auto-refresh for approved submissions that might be getting payment updates
    if (submission.status === 'approved' && !isFreeSubmission) {
      console.log('🔄 Setting up auto-refresh for approved submission:', submission._id);
      
      // Check immediately after 3 seconds
      setTimeout(() => checkEnhancedStatus(true), 3000);
      
      // Then check every 45 seconds (less frequent to avoid overloading)
      intervalId = setInterval(() => {
        checkEnhancedStatus(true);
      }, 45000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('🛑 Stopped auto-refresh for submission:', submission._id);
      }
    };
  }, [submission.status, submission._id, isFreeSubmission, checkEnhancedStatus]);

  // YOUR EXISTING PAYMENT STATUS LOGIC (keep as-is)
  const getPaymentStatus = (submission) => {
    console.log('🔍 DEBUG: Getting payment status for submission:', submission._id);
    
    // ENHANCED: Check if we have enhanced status from API
    if (enhancedStatus) {
      console.log('🔍 DEBUG: Using enhanced status from API');
      return {
        proofSubmitted: enhancedStatus.proofSubmitted,
        proofStatus: enhancedStatus.paymentStatus === 'completed' ? 'approved' : 
                     enhancedStatus.paymentStatus === 'proof_submitted' ? 'pending_admin_review' :
                     enhancedStatus.paymentStatus || 'none',
        proofSubmittedAt: null,
        proofApprovedAt: enhancedStatus.proofApprovedAt,
        proofRejectedAt: null,
        adminNotes: enhancedStatus.paymentStatus === 'completed' ? 'Payment approved - listing is live' : null
      };
    }
    
    // ORIGINAL LOGIC: Method 1: Check submission.paymentProof
    if (submission.paymentProof) {
      console.log('🔍 DEBUG: Using paymentProof data');
      return {
        proofSubmitted: submission.paymentProof.submitted === true,
        proofStatus: submission.paymentProof.status || 'pending',
        proofSubmittedAt: submission.paymentProof.submittedAt,
        proofApprovedAt: submission.paymentProof.approvedAt,
        proofRejectedAt: submission.paymentProof.rejectedAt,
        adminNotes: submission.paymentProof.adminNotes
      };
    }
    
    // ORIGINAL LOGIC: Method 2: Check if there's a payment record attached
    if (submission.payment) {
      console.log('🔍 DEBUG: Using payment data');
      const isProofSubmitted = submission.payment.status === 'proof_submitted' || 
                               submission.payment.proofOfPayment?.submitted === true;
      return {
        proofSubmitted: isProofSubmitted,
        proofStatus: submission.payment.status === 'proof_submitted' ? 'pending_admin_review' : submission.payment.status,
        proofSubmittedAt: submission.payment.proofOfPayment?.submittedAt || submission.payment.createdAt,
        proofApprovedAt: submission.payment.completedAt || submission.payment.adminApproval?.approvedAt,
        proofRejectedAt: submission.payment.rejectedAt,
        adminNotes: submission.payment.adminApproval?.adminNotes || submission.payment.rejectionReason
      };
    }
    
    // ORIGINAL LOGIC: Method 3: Check if listing is already live
    if (submission.status === 'listing_created' || submission.status === 'approved_paid') {
      console.log('🔍 DEBUG: Listing is live, payment approved');
      return {
        proofSubmitted: true,
        proofStatus: 'approved',
        proofSubmittedAt: null,
        proofApprovedAt: submission.listingCreatedAt || submission.adminReview?.paymentVerifiedAt,
        adminNotes: 'Payment approved - listing is live'
      };
    }
    
    // ORIGINAL LOGIC: Method 4: For approved submissions that need payment
    if (submission.status === 'approved' && submission.adminReview?.subscriptionTier && submission.adminReview.subscriptionTier !== 'free') {
      console.log('🔍 DEBUG: Approved submission needs payment check');
      return {
        proofSubmitted: false,
        proofStatus: 'required',
        proofSubmittedAt: null,
        proofApprovedAt: null,
        adminNotes: null
      };
    }
    
    console.log('🔍 DEBUG: No payment status found, defaulting to none');
    return {
      proofSubmitted: false,
      proofStatus: 'none',
      proofSubmittedAt: null,
      proofApprovedAt: null,
      adminNotes: null
    };
  };

  const paymentStatus = getPaymentStatus(submission);

  // YOUR EXISTING HELPER FUNCTIONS (keep as-is)
  const isListingLive = (status) => {
    return ['listing_created', 'approved'].includes(status) || (enhancedStatus && enhancedStatus.isLive);
  };

  const canUpdateListing = (status) => {
    return ['listing_created', 'approved', 'pending_review'].includes(status);
  };

  const needsPayment = (submission) => {
    if (isFreeSubmission) return false;
    
    return submission.status === 'approved' && 
           !paymentStatus.proofSubmitted && 
           paymentStatus.proofStatus !== 'approved' &&
           paymentStatus.proofStatus !== 'free' &&
           !(enhancedStatus && enhancedStatus.isLive);
  };

  const isAwaitingPaymentApproval = (submission) => {
    return paymentStatus.proofSubmitted && 
           (paymentStatus.proofStatus === 'pending_admin_review' || 
            paymentStatus.proofStatus === 'pending' ||
            paymentStatus.proofStatus === 'proof_submitted') &&
           !(enhancedStatus && enhancedStatus.isLive);
  };

  const isPaymentApproved = (submission) => {
    return paymentStatus.proofStatus === 'approved' || 
           paymentStatus.proofStatus === 'completed' ||
           (enhancedStatus && enhancedStatus.isLive);
  };

  const isPaymentRejected = (submission) => {
    return paymentStatus.proofStatus === 'rejected' || 
           paymentStatus.proofStatus === 'failed';
  };

  // ENHANCED: Manual refresh function
  const handleManualRefresh = () => {
    checkEnhancedStatus(false);
  };

  // YOUR EXISTING FUNCTIONS (keep all as-is, just added manual refresh option where needed)
  const handleCompletePayment = () => {
    console.log('🔥 COMPLETE PAYMENT CLICKED from UserSubmissionCard');
    
    const paymentInfo = {
      listingId: submission._id,
      subscriptionTier: submission.listingData?.selectedPlan || 'basic',
      amount: totalCost,
      duration: planInfo.duration || 30,
      planName: planInfo.name || 'Subscription Plan',
      transactionRef: `manual_submission_${Date.now()}`,
      sellerType: 'private',
      addons: submission.listingData?.selectedAddons || []
    };
    
    setManualPaymentInfo(paymentInfo);
    setShowManualPaymentModal(true);
  };

  const handlePaymentProofSubmitted = (paymentData) => {
    setShowManualPaymentModal(false);
    setManualPaymentInfo(null);
    
    showMessage('success', 
      'Proof of payment submitted successfully! ' +
      'Your listing will be activated once our admin team verifies your payment (usually within 24 hours).'
    );
    
    // Check enhanced status after payment submission
    setTimeout(() => checkEnhancedStatus(true), 2000);
  };

  const handleCloseManualPayment = () => {
    setShowManualPaymentModal(false);
    setManualPaymentInfo(null);
  };

  const handleViewListing = (submission) => {
    console.log('🔍 === VIEW LISTING DEBUG START ===');
    
    let targetId = null;
    let shouldProceed = false;
    
    switch (submission.status) {
      case 'listing_created':
        targetId = submission.listingId || submission._id;
        shouldProceed = true;
        break;
        
      case 'approved':
        if (isPaymentApproved(submission) || (enhancedStatus && enhancedStatus.isLive)) {
          targetId = submission.listingId || submission._id;
          shouldProceed = true;
        } else {
          showMessage('info', 'Your listing is approved but not live yet. Please complete payment.');
          return;
        }
        break;
        
      default:
        showMessage('error', `Cannot view listing with status: ${submission.status}`);
        return;
    }
    
    if (!targetId) {
      showMessage('error', 'Unable to find listing ID');
      return;
    }
    
    const listingUrl = `/listing/${targetId}`;
    navigate(listingUrl);
    showMessage('success', 'Opening your listing...');
  };

  const handleEditClick = () => {
    if (editLoading) return;
    onEditSubmission(submission);
  };

  const handleCloneClick = () => {
    if (editLoading) return;
    onCloneSubmission(submission);
  };

  const handleResubmit = () => {
    setActiveSection('create-listing');
    setListingStep('form');
    if (isFreeSubmission) {
      setSelectedPlan('free');
    }
    showMessage('info', 'Creating new listing...');
  };

  // YOUR EXISTING CONFIGURATION LOGIC
  const editButtonInfo = getEditButtonInfo ? getEditButtonInfo(submission) : null;
  const canEdit = canEditSubmission ? canEditSubmission(submission) : false;
  const canClone = canCloneSubmission ? canCloneSubmission(submission) : false;
  const canView = isListingLive(submission.status);
  const canUpdate = canUpdateListing(submission.status);

  // ENHANCED STATUS RENDERING WITH SIMPLIFIED REAL-TIME
  const renderSubmissionStatus = (submission) => {
    const isFreeSubmission = submission.listingData?.selectedPlan === 'free';
    
    // ENHANCED: Check if listing is live via enhanced status
    if ((enhancedStatus && enhancedStatus.isLive) || submission.status === 'listing_created' || isPaymentApproved(submission)) {
      const isFeatured = submission.adminReview?.isFeatured || 
                        (selectedAddons && selectedAddons.includes('featured'));
      
      return (
        <div className="usc-status-message usc-status-live">
          <CheckCircle size={14} />
          <div className="usc-message-content">
            <div className="usc-live-info">
              <span>🚗 Your listing is <strong>LIVE</strong>!</span>
              {isFeatured && (
                <span className="usc-featured-badge">
                  <Star size={12} />
                  Featured
                </span>
              )}
              <div className="usc-live-details">
                <span>Activated: {formatDate(submission.adminReview?.listingActivatedAt || submission.listingCreatedAt)}</span>
                {submission.adminReview?.subscriptionTier && (
                  <span className="usc-tier-badge">
                    {submission.adminReview.subscriptionTier.toUpperCase()} plan
                  </span>
                )}
              </div>
            </div>
            <div className="usc-live-actions">
              <button 
                className="usc-btn usc-btn-success usc-btn-small"
                onClick={() => handleViewListing(submission)}
              >
                <ExternalLink size={14} />
                View Live
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    // PENDING REVIEW STATUS
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
    
    // APPROVED STATUS WITH ENHANCED PAYMENT TRACKING
    if (submission.status === 'approved') {
      // Payment Rejected
      if (isPaymentRejected(submission)) {
        return (
          <div className="usc-status-message usc-status-payment-rejected">
            <XCircle size={14} />
            <div className="usc-message-content">
              <div className="usc-payment-rejected-info">
                <span>❌ Payment proof was not accepted</span>
                {paymentStatus.adminNotes && (
                  <div className="usc-rejection-reason">
                    <strong>Reason:</strong> {paymentStatus.adminNotes}
                  </div>
                )}
                {paymentStatus.proofRejectedAt && (
                  <div className="usc-rejected-at">
                    Rejected: {formatDate(paymentStatus.proofRejectedAt)}
                  </div>
                )}
              </div>
              <button 
                className="usc-btn usc-btn-warning usc-btn-small"
                onClick={handleCompletePayment}
              >
                <Upload size={14} />
                Resubmit Payment
              </button>
            </div>
          </div>
        );
      }

      // Awaiting Payment Approval - ENHANCED with refresh
      if (isAwaitingPaymentApproval(submission)) {
        return (
          <div className="usc-status-message usc-status-payment-pending">
            <Clock size={14} />
            <div className="usc-message-content">
              <div className="usc-payment-pending-info">
                <span>💳 Payment proof submitted - under review</span>
                <div className="usc-pending-details">
                  <span>Submitted: {paymentStatus.proofSubmittedAt ? formatDate(paymentStatus.proofSubmittedAt) : 'Recently'}</span>
                  <span>Expected review: Within 24 hours</span>
                </div>
              </div>
              <div className="usc-refresh-section">
                <button 
                  className="usc-btn usc-btn-outline usc-btn-small"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw size={14} className={isRefreshing ? 'spinning' : ''} />
                  {isRefreshing ? 'Checking...' : 'Check Status'}
                </button>
                {lastStatusCheck && (
                  <span className="usc-last-check">
                    Last checked: {formatDate(lastStatusCheck)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Free listing - approved and going live - ENHANCED with refresh
      if (isFreeSubmission) {
        return (
          <div className="usc-status-message usc-status-approved-free">
            <CheckCircle size={14} />
            <div className="usc-message-content">
              <div className="usc-approved-info">
                <span>✅ <strong>Approved!</strong> Your free listing is going live</span>
                <div className="usc-approval-details">
                  <span>Approved: {formatDate(submission.adminReview?.reviewedAt)}</span>
                  <span>Going live within a few minutes...</span>
                </div>
              </div>
              <div className="usc-refresh-section">
                <button 
                  className="usc-btn usc-btn-outline usc-btn-small"
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw size={14} className={isRefreshing ? 'spinning' : ''} />
                  {isRefreshing ? 'Checking...' : 'Check Status'}
                </button>
                {lastStatusCheck && (
                  <span className="usc-last-check">
                    Last checked: {formatDate(lastStatusCheck)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Need to Submit Payment
      if (needsPayment(submission)) {
        return (
          <div className="usc-status-message usc-status-approved">
            <CheckCircle size={14} />
            <div className="usc-message-content">
              <div className="usc-approval-details">
                <span>🎉 Great! Your listing has been approved.</span>
                <div className="usc-next-steps">
                  <div className="usc-payment-info">
                    <div className="usc-payment-instructions">
                      <Info size={12} />
                      <span>Complete payment to make your listing live.</span>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                className="usc-btn usc-btn-primary usc-btn-small"
                onClick={handleCompletePayment}
              >
                <DollarSign size={14} />
                Complete Payment
              </button>
            </div>
          </div>
        );
      }
    }
    
    // REJECTED STATUS
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

  // YOUR EXISTING JSX STRUCTURE (keeping everything as-is)
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

            {/* ENHANCED: Payment Status Row with real-time info */}
            {!isFreeSubmission && submission.status === 'approved' && (
              <div className="usc-detail-row">
                <span className="usc-detail-label">Payment:</span>
                <span className={`usc-detail-value usc-payment-status ${
                  isPaymentApproved(submission) ? 'usc-payment-approved' :
                  isAwaitingPaymentApproval(submission) ? 'usc-payment-pending' :
                  isPaymentRejected(submission) ? 'usc-payment-rejected' :
                  'usc-payment-needed'
                }`}>
                  {isPaymentApproved(submission) ? '✅ Confirmed' :
                   isAwaitingPaymentApproval(submission) ? '⏳ Under Review' :
                   isPaymentRejected(submission) ? '❌ Rejected' :
                   '💳 Required'}
                </span>
              </div>
            )}

            {/* Keep all your existing detail rows */}
            {submission.editHistory && submission.editHistory.length > 0 && (
              <div className="usc-detail-row">
                <span className="usc-detail-label">Last edited:</span>
                <span className="usc-detail-value">
                  {formatDate(submission.editHistory[submission.editHistory.length - 1].editedAt)}
                </span>
              </div>
            )}

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

          {/* Keep all your existing action buttons and sections */}
          <div className="usc-submission-actions">
            <div className="usc-primary-actions">
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
                  <span>
                    {isFreeSubmission ? 'Going live soon' : 
                     isPaymentApproved(submission) ? 'Going live soon' :
                     isAwaitingPaymentApproval(submission) ? 'Payment under review' :
                     isPaymentRejected(submission) ? 'Payment rejected' :
                     'Payment required'}
                  </span>
                </div>
              )}

              {(submission.status === 'listing_created' || (enhancedStatus && enhancedStatus.isLive)) && (
                <div className="usc-status-indicator usc-status-live">
                  <Star size={12} />
                  <span>Live on platform</span>
                </div>
              )}
            </div>
          </div>

          {/* Keep all your existing plan details, payment timeline, edit history, admin review sections */}
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
                  <div className="usc-plan-name">
                    <span className={`usc-plan-badge ${isFreeSubmission ? 'usc-free-plan' : ''}`}>
                      {planInfo.name}
                      {isFreeSubmission && ' (FREE)'}
                    </span>
                  </div>
                  
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

          {/* Keep your existing payment timeline */}
          {!isFreeSubmission && submission.status === 'approved' && (
            <div className="usc-payment-timeline">
              <div className="usc-timeline-header">
                <h5>Payment Progress</h5>
              </div>
              <div className="usc-timeline-steps">
                <div className={`usc-timeline-step ${true ? 'usc-completed' : ''}`}>
                  <div className="usc-step-indicator">✅</div>
                  <div className="usc-step-content">
                    <span className="usc-step-title">Listing Approved</span>
                    <span className="usc-step-date">{formatDate(submission.adminReview?.reviewedAt)}</span>
                  </div>
                </div>
                
                <div className={`usc-timeline-step ${paymentStatus.proofSubmitted ? 'usc-completed' : 'usc-current'}`}>
                  <div className="usc-step-indicator">
                    {paymentStatus.proofSubmitted ? '✅' : '💳'}
                  </div>
                  <div className="usc-step-content">
                    <span className="usc-step-title">
                      {paymentStatus.proofSubmitted ? 'Payment Submitted' : 'Submit Payment'}
                    </span>
                    {paymentStatus.proofSubmittedAt && (
                      <span className="usc-step-date">{formatDate(paymentStatus.proofSubmittedAt)}</span>
                    )}
                  </div>
                </div>
                
                <div className={`usc-timeline-step ${isPaymentApproved(submission) ? 'usc-completed' : ''}`}>
                  <div className="usc-step-indicator">
                    {isPaymentApproved(submission) ? '✅' : 
                     isPaymentRejected(submission) ? '❌' : '⏳'}
                  </div>
                  <div className="usc-step-content">
                    <span className="usc-step-title">
                      {isPaymentApproved(submission) ? 'Payment Approved' :
                       isPaymentRejected(submission) ? 'Payment Rejected' :
                       'Payment Review'}
                    </span>
                    {paymentStatus.proofApprovedAt && (
                      <span className="usc-step-date">{formatDate(paymentStatus.proofApprovedAt)}</span>
                    )}
                  </div>
                </div>
                
                <div className={`usc-timeline-step ${submission.status === 'listing_created' || (enhancedStatus && enhancedStatus.isLive) ? 'usc-completed' : ''}`}>
                  <div className="usc-step-indicator">
                    {submission.status === 'listing_created' || (enhancedStatus && enhancedStatus.isLive) ? '🚗' : '⏳'}
                  </div>
                  <div className="usc-step-content">
                    <span className="usc-step-title">
                      {submission.status === 'listing_created' || (enhancedStatus && enhancedStatus.isLive) ? 'Listing Live' : 'Going Live'}
                    </span>
                    {(submission.status === 'listing_created' && submission.listingCreatedAt) && (
                      <span className="usc-step-date">{formatDate(submission.listingCreatedAt)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Keep your existing edit history and admin review sections */}
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

      {/* ENHANCED: Status-specific actions with simplified real-time updates */}
      <div className="usc-submission-status">
        {renderSubmissionStatus(submission)}
      </div>

      {/* Keep your existing manual payment modal */}
      <ManualPaymentModal
        isOpen={showManualPaymentModal}
        onClose={handleCloseManualPayment}
        paymentInfo={manualPaymentInfo}
        onPaymentProofSubmitted={handlePaymentProofSubmitted}
      />
    </div>
  );
};

export default UserSubmissionCard;