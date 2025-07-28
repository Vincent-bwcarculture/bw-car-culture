// client/src/components/profile/UserSubmissionCard.js
// Complete submission card component with ENHANCED PAYMENT STATUS TRACKING

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
  Zap
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
  editLoading = false
}) => {
  const navigate = useNavigate();

  // Payment Modal State
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [manualPaymentInfo, setManualPaymentInfo] = useState(null);
  const [externalPaymentStatus, setExternalPaymentStatus] = useState(null);

  // Calculate pricing with FREE TIER support
  const selectedPlan = submission.listingData?.selectedPlan;
  const selectedAddons = submission.listingData?.selectedAddons || [];
  const planInfo = getPlanInfo(selectedPlan);
  const totalCost = calculateTotalCost(selectedPlan, selectedAddons);
  const addonDetails = getAddonDetails(selectedAddons);
  const addonCost = totalCost - planInfo.price;
  const isFreeSubmission = selectedPlan === 'free';
  const primaryImage = getPrimaryImage(submission);

  // Function to fetch payment status from API if missing from submission
  const fetchPaymentStatusFromAPI = useCallback(async (listingId) => {
    try {
      console.log('🔍 DEBUG: Fetching payment status from API for:', listingId);
      const response = await axios.get(`/api/payments/status/${listingId}`);
      if (response.data.success) {
        console.log('🔍 DEBUG: External payment status response:', response.data.data);
        const apiStatus = response.data.data;
        
        // Convert API response to our internal format
        const externalStatus = {
          proofSubmitted: apiStatus.proofSubmitted || false,
          paymentStatus: apiStatus.paymentStatus || 'none',
          proofSubmittedAt: apiStatus.proofSubmittedAt,
          proofApprovedAt: apiStatus.proofApprovedAt,
          hasPayment: apiStatus.hasPayment || false
        };
        
        console.log('🔍 DEBUG: Processed external status:', externalStatus);
        setExternalPaymentStatus(externalStatus);
        return externalStatus;
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
    }
    return null;
  }, []);

  // Effect to check external payment status for approved submissions
  useEffect(() => {
    const checkExternalPaymentStatus = async () => {
      // Always check for payment status if submission is approved (regardless of free/paid)
      if (submission.status === 'approved') {
        console.log('🔍 DEBUG: Submission is approved, checking external payment status');
        console.log('🔍 DEBUG: Submission ID:', submission._id);
        console.log('🔍 DEBUG: Current paymentProof:', submission.paymentProof);
        console.log('🔍 DEBUG: Current payment:', submission.payment);
        await fetchPaymentStatusFromAPI(submission._id);
      }
    };
    
    checkExternalPaymentStatus();
  }, [submission._id, submission.status, fetchPaymentStatusFromAPI]);

  // Additional effect to fetch payment status when component mounts
  useEffect(() => {
    console.log('🔍 DEBUG: Component mounted for submission:', submission._id);
    console.log('🔍 DEBUG: Initial submission status:', submission.status);
    
    // For testing - always try to fetch payment status for approved submissions
    if (submission.status === 'approved') {
      setTimeout(() => {
        console.log('🔍 DEBUG: Delayed payment status check');
        fetchPaymentStatusFromAPI(submission._id);
      }, 1000);
    }
  }, [submission._id, submission.status, fetchPaymentStatusFromAPI]);

  // Payment Status Helper Functions
  const getPaymentStatus = (submission) => {
    console.log('🔍 DEBUG: Getting payment status for submission:', submission._id);
    console.log('🔍 DEBUG: Submission paymentProof:', submission.paymentProof);
    console.log('🔍 DEBUG: Submission payment:', submission.payment);
    console.log('🔍 DEBUG: Submission status:', submission.status);
    
    // Method 1: Check submission.paymentProof (most common structure)
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
    
    // Method 2: Check if there's a payment record attached
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
    
    // Method 3: Check if listing is already live (payment was approved)
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
    
    // Method 4: For approved submissions that need payment, note that we should fetch external data
    if (submission.status === 'approved' && submission.adminReview?.subscriptionTier && submission.adminReview.subscriptionTier !== 'free') {
      console.log('🔍 DEBUG: Approved submission needs payment check');
      // Payment status will be fetched via useEffect
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

  // Get payment status (combining base status with external status if available)
  const basePaymentStatus = getPaymentStatus(submission);
  const paymentStatus = externalPaymentStatus && externalPaymentStatus.proofSubmitted 
    ? {
        proofSubmitted: true,
        proofStatus: externalPaymentStatus.paymentStatus === 'completed' ? 'approved' : 
                     externalPaymentStatus.paymentStatus === 'proof_submitted' ? 'pending_admin_review' :
                     'pending_admin_review',
        proofSubmittedAt: externalPaymentStatus.proofSubmittedAt,
        proofApprovedAt: externalPaymentStatus.proofApprovedAt,
        adminNotes: null
      }
    : basePaymentStatus;

  // DEBUG: Log final payment status
  console.log('🔍 DEBUG: Final payment status for', submission.listingData?.title, ':', paymentStatus);
  console.log('🔍 DEBUG: basePaymentStatus:', basePaymentStatus);
  console.log('🔍 DEBUG: externalPaymentStatus:', externalPaymentStatus);
  console.log('🔍 DEBUG: proofSubmitted:', paymentStatus.proofSubmitted);
  console.log('🔍 DEBUG: proofStatus:', paymentStatus.proofStatus);

  // Check if listing is viewable (active/live)
  const isListingLive = (status) => {
    return ['listing_created', 'approved'].includes(status);
  };

  // Check if listing can be updated (legacy - keeping for compatibility)
  const canUpdateListing = (status) => {
    return ['listing_created', 'approved', 'pending_review'].includes(status);
  };

  // Enhanced payment status check functions
  const needsPayment = (submission) => {
    if (isFreeSubmission) return false;
    
    console.log('🔍 DEBUG: needsPayment check:', {
      status: submission.status,
      proofSubmitted: paymentStatus.proofSubmitted,
      proofStatus: paymentStatus.proofStatus
    });
    
    return submission.status === 'approved' && 
           !paymentStatus.proofSubmitted && 
           paymentStatus.proofStatus !== 'approved' &&
           paymentStatus.proofStatus !== 'free';
  };

  const isAwaitingPaymentApproval = (submission) => {
    const result = paymentStatus.proofSubmitted && 
           (paymentStatus.proofStatus === 'pending_admin_review' || 
            paymentStatus.proofStatus === 'pending' ||
            paymentStatus.proofStatus === 'proof_submitted' ||
            (externalPaymentStatus && externalPaymentStatus.paymentStatus === 'proof_submitted'));
    
    console.log('🔍 DEBUG: isAwaitingPaymentApproval check:', {
      proofSubmitted: paymentStatus.proofSubmitted,
      proofStatus: paymentStatus.proofStatus,
      externalStatus: externalPaymentStatus?.paymentStatus,
      result: result
    });
    return result;
  };

  const isPaymentApproved = (submission) => {
    const result = paymentStatus.proofStatus === 'approved' || 
                   paymentStatus.proofStatus === 'completed';
    
    console.log('🔍 DEBUG: isPaymentApproved:', result, paymentStatus);
    return result;
  };

  const isPaymentRejected = (submission) => {
    const result = paymentStatus.proofStatus === 'rejected' || 
                   paymentStatus.proofStatus === 'failed';
    
    console.log('🔍 DEBUG: isPaymentRejected:', result, paymentStatus);
    return result;
  };

  // Handle Complete Payment button click
  const handleCompletePayment = () => {
    console.log('🔥 COMPLETE PAYMENT CLICKED from UserSubmissionCard');
    console.log('Submission:', submission);
    console.log('Total Cost:', totalCost);
    console.log('Plan Info:', planInfo);
    
    // Create payment info from submission data
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

    console.log('💰 Created payment info for modal:', paymentInfo);
    
    setManualPaymentInfo(paymentInfo);
    setShowManualPaymentModal(true);
  };

  // Handle payment proof submission
  const handlePaymentProofSubmitted = (paymentData) => {
    setShowManualPaymentModal(false);
    setManualPaymentInfo(null);
    
    showMessage('success', 
      'Proof of payment submitted successfully! ' +
      'Your listing will be activated once our admin team verifies your payment (usually within 24 hours).'
    );
  };

  // Handle manual payment modal close
  const handleCloseManualPayment = () => {
    setShowManualPaymentModal(false);
    setManualPaymentInfo(null);
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

  // Handle edit button click
  const handleEditClick = () => {
    if (editLoading) return;
    onEditSubmission(submission);
  };

  // Handle clone button click
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

  // Get edit button configuration
  const editButtonInfo = getEditButtonInfo ? getEditButtonInfo(submission) : null;
  const canEdit = canEditSubmission ? canEditSubmission(submission) : false;
  const canClone = canCloneSubmission ? canCloneSubmission(submission) : false;

  // Check if actions are available
  const canView = isListingLive(submission.status);
  const canUpdate = canUpdateListing(submission.status); // Legacy compatibility

  // ENHANCED SUBMISSION STATUS RENDERING WITH PAYMENT TRACKING
  const renderSubmissionStatus = (submission) => {
    const isFreeSubmission = submission.selectedTier === 'free' || 
                           submission.paymentRequired === false ||
                           submission.listingData?.selectedPlan === 'free';
    
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
    
    // APPROVED STATUS WITH PAYMENT TRACKING
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
                <div className="usc-rejected-at">
                  Rejected: {formatDate(paymentStatus.proofRejectedAt)}
                </div>
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

      // Payment Approved - Waiting for listing to go live
      if (isPaymentApproved(submission)) {
        return (
          <div className="usc-status-message usc-status-payment-approved">
            <CheckCircle size={14} />
            <div className="usc-message-content">
              <div className="usc-payment-approved-info">
                <span>💳 Payment confirmed! Your listing will go live shortly.</span>
                <div className="usc-approved-at">
                  Payment approved: {formatDate(paymentStatus.proofApprovedAt)}
                </div>
                <div className="usc-going-live-note">
                  <Zap size={12} />
                  <span>Listing activation in progress...</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // Awaiting Payment Approval
      if (isAwaitingPaymentApproval(submission)) {
        return (
          <div className="usc-status-message usc-status-awaiting-payment">
            <Clock size={14} />
            <div className="usc-message-content">
              <div className="usc-awaiting-payment-info">
                <span>📄 Payment proof submitted - under review</span>
                <div className="usc-submitted-at">
                  Submitted: {formatDate(paymentStatus.proofSubmittedAt)}
                </div>
                <div className="usc-review-timeline">
                  <Shield size={12} />
                  <span>Admin review usually takes 24 hours</span>
                </div>
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

      // Free Listing - Will go live automatically
      if (isFreeSubmission) {
        return (
          <div className="usc-status-message usc-status-approved">
            <CheckCircle size={14} />
            <div className="usc-message-content">
              <div className="usc-approval-details">
                <span>
                  🎉 Great! Your listing has been approved.
                  <span className="usc-free-label"> (FREE TIER)</span>
                </span>
                <div className="usc-next-steps">
                  <span>Your free listing will go live automatically! 🎉</span>
                </div>
              </div>
            </div>
          </div>
        );
      }
    }
    
    // LISTING LIVE STATUS
    if (submission.status === 'listing_created') {
      return (
        <div className="usc-status-message usc-status-live">
          <Star size={14} />
          <div className="usc-message-content">
            <div className="usc-live-details">
              <span>🚗 Your listing is now live on our platform!</span>
              {isFreeSubmission ? (
                <div className="usc-free-live-info">
                  <span className="usc-free-label">FREE TIER</span>
                  <span>Active for 30 days • Basic visibility</span>
                </div>
              ) : (
                <div className="usc-paid-live-info">
                  <span className="usc-paid-label">{selectedPlan?.toUpperCase()} TIER</span>
                  <span>Active for {planInfo.duration} days • Enhanced visibility</span>
                </div>
              )}
              <div className="usc-live-actions">
                <TrendingUp size={12} />
                <span>Buyers can now see and contact you about this car</span>
              </div>
            </div>
          </div>
        </div>
      );
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

            {/* Payment Status Row */}
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

            {/* Show edit history if available */}
            {submission.editHistory && submission.editHistory.length > 0 && (
              <div className="usc-detail-row">
                <span className="usc-detail-label">Last edited:</span>
                <span className="usc-detail-value">
                  {formatDate(submission.editHistory[submission.editHistory.length - 1].editedAt)}
                </span>
              </div>
            )}

            {/* Show admin review info if available */}
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

          {/* Action Buttons Section with Edit Functionality */}
          <div className="usc-submission-actions">
            {/* Primary Actions Row */}
            <div className="usc-primary-actions">
              {/* Edit Button with Status-Aware Text */}
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

              {/* Clone Button */}
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
                  <span>
                    {isFreeSubmission ? 'Going live soon' : 
                     isPaymentApproved(submission) ? 'Going live soon' :
                     isAwaitingPaymentApproval(submission) ? 'Payment under review' :
                     isPaymentRejected(submission) ? 'Payment rejected' :
                     'Payment required'}
                  </span>
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

          {/* Payment Timeline for Non-Free Submissions */}
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
                
                <div className={`usc-timeline-step ${submission.status === 'listing_created' ? 'usc-completed' : ''}`}>
                  <div className="usc-step-indicator">
                    {submission.status === 'listing_created' ? '🚗' : '⏳'}
                  </div>
                  <div className="usc-step-content">
                    <span className="usc-step-title">
                      {submission.status === 'listing_created' ? 'Listing Live' : 'Going Live'}
                    </span>
                    {submission.status === 'listing_created' && submission.listingCreatedAt && (
                      <span className="usc-step-date">{formatDate(submission.listingCreatedAt)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit History Section */}
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

          {/* Admin Review Notes */}
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

      {/* Status-specific actions with ENHANCED PAYMENT TRACKING */}
      <div className="usc-submission-status">
        {renderSubmissionStatus(submission)}
      </div>

      {/* Manual Payment Modal */}
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