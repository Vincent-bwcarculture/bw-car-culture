// client/src/components/profile/UserSubmissionCard.js
// Complete submission card component with ENHANCED PAYMENT STATUS TRACKING + REAL-TIME UPDATES

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
  // ENHANCED: Real-time functionality
  onRefreshSubmissions
}) => {
  const navigate = useNavigate();

  // Payment Modal State
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [manualPaymentInfo, setManualPaymentInfo] = useState(null);
  const [externalPaymentStatus, setExternalPaymentStatus] = useState(null);

  // ENHANCED: Real-time status tracking
  const [currentSubmissionStatus, setCurrentSubmissionStatus] = useState(submission);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastStatusCheck, setLastStatusCheck] = useState(null);

  // Calculate pricing with FREE TIER support
  const selectedPlan = currentSubmissionStatus.listingData?.selectedPlan;
  const selectedAddons = currentSubmissionStatus.listingData?.selectedAddons || [];
  const planInfo = getPlanInfo(selectedPlan);
  const totalCost = calculateTotalCost(selectedPlan, selectedAddons);
  const addonDetails = getAddonDetails(selectedAddons);
  const addonCost = totalCost - planInfo.price;
  const isFreeSubmission = selectedPlan === 'free';
  const primaryImage = getPrimaryImage(currentSubmissionStatus);

  // ENHANCED: Fetch real-time submission status
  const fetchSubmissionStatus = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    
    try {
      console.log('🔄 Fetching real-time submission status for:', currentSubmissionStatus._id);
      
      const response = await axios.get(`/api/user/submission-status/${currentSubmissionStatus._id}`);
      
      if (response.data.success) {
        const statusData = response.data.data;
        console.log('✅ Updated submission status:', statusData);
        
        // Update the submission status based on API response
        const updatedSubmission = {
          ...currentSubmissionStatus,
          status: statusData.currentStatus === 'live' ? 'approved_paid_active' : 
                  statusData.currentStatus === 'payment_review' ? 'approved' :
                  statusData.currentStatus === 'payment_required' ? 'approved' :
                  statusData.currentStatus === 'approved_free' ? 'approved' :
                  currentSubmissionStatus.status,
          
          // Update payment info if available
          paymentProof: statusData.payment ? {
            submitted: statusData.payment.proofSubmitted,
            status: statusData.payment.status === 'completed' ? 'approved' : 
                   statusData.payment.status === 'proof_submitted' ? 'pending' : 'none',
            approvedAt: statusData.payment.completedAt,
            adminNotes: 'Payment approved - listing is live'
          } : currentSubmissionStatus.paymentProof,
          
          // Update listing info if live
          isLive: statusData.isLive,
          listingCreatedAt: statusData.isLive ? new Date().toISOString() : currentSubmissionStatus.listingCreatedAt,
          
          // Update admin review with real-time info
          adminReview: {
            ...currentSubmissionStatus.adminReview,
            subscriptionTier: statusData.pricing?.subscriptionTier || currentSubmissionStatus.adminReview?.subscriptionTier,
            totalCost: statusData.pricing?.totalAmount || currentSubmissionStatus.adminReview?.totalCost,
            appliedAddons: statusData.pricing?.addons || currentSubmissionStatus.adminReview?.appliedAddons,
            isFeatured: statusData.listing?.isFeatured || false,
            listingActivatedAt: statusData.isLive ? new Date().toISOString() : null,
            paymentVerifiedAt: statusData.payment?.completedAt || null
          }
        };
        
        setCurrentSubmissionStatus(updatedSubmission);
        setLastStatusCheck(new Date());
        
        // Show success message if status changed to live
        if (statusData.isLive && !currentSubmissionStatus.isLive && !silent) {
          showMessage('success', '🎉 Your listing is now live!');
          
          // Trigger parent refresh if available
          if (onRefreshSubmissions) {
            setTimeout(() => onRefreshSubmissions(), 1000);
          }
        }
        
        return statusData;
      }
    } catch (error) {
      console.error('❌ Error fetching submission status:', error);
      if (!silent) {
        showMessage('error', 'Failed to check status. Please try again.');
      }
    } finally {
      if (!silent) setIsRefreshing(false);
    }
    return null;
  }, [currentSubmissionStatus._id, currentSubmissionStatus.isLive, showMessage, onRefreshSubmissions]);

  // Auto-refresh for approved submissions awaiting payment verification
  useEffect(() => {
    let intervalId = null;
    
    // Set up auto-refresh for submissions that might be getting approved
    const shouldAutoRefresh = (
      currentSubmissionStatus.status === 'approved' || 
      currentSubmissionStatus.status === 'pending_review' ||
      (currentSubmissionStatus.status === 'approved' && 
       currentSubmissionStatus.paymentProof?.status === 'pending')
    );
    
    if (shouldAutoRefresh) {
      console.log('🔄 Setting up auto-refresh for submission:', currentSubmissionStatus._id);
      
      // Check immediately after 2 seconds
      setTimeout(() => fetchSubmissionStatus(true), 2000);
      
      // Then check every 30 seconds
      intervalId = setInterval(() => {
        fetchSubmissionStatus(true);
      }, 30000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('🛑 Stopped auto-refresh for submission:', currentSubmissionStatus._id);
      }
    };
  }, [currentSubmissionStatus.status, currentSubmissionStatus._id, fetchSubmissionStatus]);

  // Update local state when prop changes
  useEffect(() => {
    setCurrentSubmissionStatus(submission);
  }, [submission]);

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
      if (currentSubmissionStatus.status === 'approved') {
        console.log('🔍 DEBUG: Submission is approved, checking external payment status');
        console.log('🔍 DEBUG: Submission ID:', currentSubmissionStatus._id);
        console.log('🔍 DEBUG: Current paymentProof:', currentSubmissionStatus.paymentProof);
        console.log('🔍 DEBUG: Current payment:', currentSubmissionStatus.payment);
        await fetchPaymentStatusFromAPI(currentSubmissionStatus._id);
      }
    };
    
    checkExternalPaymentStatus();
  }, [currentSubmissionStatus._id, currentSubmissionStatus.status, fetchPaymentStatusFromAPI]);

  // Additional effect to fetch payment status when component mounts
  useEffect(() => {
    console.log('🔍 DEBUG: Component mounted for submission:', currentSubmissionStatus._id);
    console.log('🔍 DEBUG: Initial submission status:', currentSubmissionStatus.status);
    
    // For testing - always try to fetch payment status for approved submissions
    if (currentSubmissionStatus.status === 'approved') {
      setTimeout(() => {
        console.log('🔍 DEBUG: Delayed payment status check');
        fetchPaymentStatusFromAPI(currentSubmissionStatus._id);
      }, 1000);
    }
  }, [currentSubmissionStatus._id, currentSubmissionStatus.status, fetchPaymentStatusFromAPI]);

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
    if (submission.status === 'listing_created' || 
        submission.status === 'approved_paid' || 
        submission.status === 'approved_paid_active' || 
        submission.isLive) {
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
  const basePaymentStatus = getPaymentStatus(currentSubmissionStatus);
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
  console.log('🔍 DEBUG: Final payment status for', currentSubmissionStatus.listingData?.title, ':', paymentStatus);
  console.log('🔍 DEBUG: basePaymentStatus:', basePaymentStatus);
  console.log('🔍 DEBUG: externalPaymentStatus:', externalPaymentStatus);
  console.log('🔍 DEBUG: proofSubmitted:', paymentStatus.proofSubmitted);
  console.log('🔍 DEBUG: proofStatus:', paymentStatus.proofStatus);

  // Check if listing is viewable (active/live)
  const isListingLive = (status) => {
    return ['listing_created', 'approved'].includes(status) || currentSubmissionStatus.isLive;
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
                   paymentStatus.proofStatus === 'completed' ||
                   submission.isLive ||
                   (submission.status === 'approved_paid_active');
    
    console.log('🔍 DEBUG: isPaymentApproved:', result, paymentStatus);
    return result;
  };

  const isPaymentRejected = (submission) => {
    const result = paymentStatus.proofStatus === 'rejected' || 
                   paymentStatus.proofStatus === 'failed';
    
    console.log('🔍 DEBUG: isPaymentRejected:', result, paymentStatus);
    return result;
  };

  // ENHANCED: Handle manual refresh
  const handleManualRefresh = () => {
    fetchSubmissionStatus(false);
  };

  // Handle Complete Payment button click
  const handleCompletePayment = () => {
    console.log('🔥 COMPLETE PAYMENT CLICKED from UserSubmissionCard');
    console.log('Submission:', currentSubmissionStatus);
    console.log('Total Cost:', totalCost);
    console.log('Plan Info:', planInfo);
    
    // Create payment info from submission data
    const paymentInfo = {
      listingId: currentSubmissionStatus._id,
      subscriptionTier: currentSubmissionStatus.listingData?.selectedPlan || 'basic',
      amount: totalCost,
      duration: planInfo.duration || 30,
      planName: planInfo.name || 'Subscription Plan',
      transactionRef: `manual_submission_${Date.now()}`,
      sellerType: 'private',
      addons: currentSubmissionStatus.listingData?.selectedAddons || []
    };

    console.log('💰 Created payment info for modal:', paymentInfo);
    
    setManualPaymentInfo(paymentInfo);
    setShowManualPaymentModal(true);
  };

  // ENHANCED: Handle payment proof submission with refresh
  const handlePaymentProofSubmitted = (paymentData) => {
    setShowManualPaymentModal(false);
    setManualPaymentInfo(null);
    
    showMessage('success', 
      'Proof of payment submitted successfully! ' +
      'Your listing will be activated once our admin team verifies your payment (usually within 24 hours).'
    );
    
    // Refresh status immediately and set up monitoring
    setTimeout(() => fetchSubmissionStatus(), 1000);
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
    console.log('Is Live:', submission.isLive);
    console.log('Title:', submission.listingData?.title);
    console.log('Admin Review:', submission.adminReview);
    
    // Check the specific status and determine the correct approach
    let targetId = null;
    let shouldProceed = false;
    
    switch (submission.status) {
      case 'listing_created':
      case 'approved_paid_active':
        // This should be a live listing
        targetId = submission.listingId || submission._id;
        shouldProceed = true;
        console.log('✅ Status: listing_created - proceeding with ID:', targetId);
        break;
        
      case 'approved':
        // This might be approved but not yet converted to listing
        if (submission.isLive || isPaymentApproved(submission)) {
          targetId = submission.listingId || submission._id;
          shouldProceed = true;
          console.log('✅ Status: approved and live - proceeding with ID:', targetId);
        } else {
          console.log('❌ Status: approved but not live yet');
          showMessage('info', 'Your listing is approved but not live yet. Please complete payment.');
          return;
        }
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
    onEditSubmission(currentSubmissionStatus);
  };

  // Handle clone button click
  const handleCloneClick = () => {
    if (editLoading) return;
    onCloneSubmission(currentSubmissionStatus);
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
  const editButtonInfo = getEditButtonInfo ? getEditButtonInfo(currentSubmissionStatus) : null;
  const canEdit = canEditSubmission ? canEditSubmission(currentSubmissionStatus) : false;
  const canClone = canCloneSubmission ? canCloneSubmission(currentSubmissionStatus) : false;

  // Check if actions are available
  const canView = isListingLive(currentSubmissionStatus.status);
  const canUpdate = canUpdateListing(currentSubmissionStatus.status); // Legacy compatibility

  // ENHANCED SUBMISSION STATUS RENDERING WITH REAL-TIME UPDATES
  const renderSubmissionStatus = (submission) => {
    const isFreeSubmission = submission.listingData?.selectedPlan === 'free';
    
    // LIVE STATUS - Listing is active
    if (submission.status === 'approved_paid_active' || submission.isLive || isPaymentApproved(submission)) {
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

      // Awaiting Payment Approval - ENHANCED with refresh
      if (isAwaitingPaymentApproval(submission)) {
        return (
          <div className="usc-status-message usc-status-payment-pending">
            <Clock size={14} />
            <div className="usc-message-content">
              <div className="usc-payment-pending-info">
                <span>💳 Payment proof submitted - under review</span>
                <div className="usc-pending-details">
                  <span>Submitted: {formatDate(paymentStatus.proofSubmittedAt)}</span>
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
    <div key={currentSubmissionStatus._id} className="usc-submission-card">
      <div className="usc-submission-main">
        {/* Image Section */}
        <div className="usc-submission-image">
          {primaryImage ? (
            <img 
              src={primaryImage} 
              alt={currentSubmissionStatus.listingData?.title || 'Car listing'}
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
              {currentSubmissionStatus.listingData?.title || 'Untitled Listing'}
              {isFreeSubmission && <span className="usc-free-label">FREE</span>}
            </h4>
            {getStatusBadge(currentSubmissionStatus.status)}
          </div>

          <div className="usc-submission-details">
            <div className="usc-detail-row">
              <span className="usc-detail-label">Vehicle:</span>
              <span className="usc-detail-value">
                {currentSubmissionStatus.listingData?.specifications?.year} {currentSubmissionStatus.listingData?.specifications?.make} {currentSubmissionStatus.listingData?.specifications?.model}
              </span>
            </div>
            
            <div className="usc-detail-row">
              <span className="usc-detail-label">Car Price:</span>
              <span className="usc-detail-value usc-price">
                {currentSubmissionStatus.listingData?.pricing?.price 
                  ? `P${Number(currentSubmissionStatus.listingData.pricing.price).toLocaleString()}`
                  : 'Price not set'
                }
              </span>
            </div>
            
            <div className="usc-detail-row">
              <span className="usc-detail-label">Submitted:</span>
              <span className="usc-detail-value">
                {formatDate(currentSubmissionStatus.submittedAt)}
              </span>
            </div>

            {/* Payment Status Row */}
            {!isFreeSubmission && currentSubmissionStatus.status === 'approved' && (
              <div className="usc-detail-row">
                <span className="usc-detail-label">Payment:</span>
                <span className={`usc-detail-value usc-payment-status ${
                  isPaymentApproved(currentSubmissionStatus) ? 'usc-payment-approved' :
                  isAwaitingPaymentApproval(currentSubmissionStatus) ? 'usc-payment-pending' :
                  isPaymentRejected(currentSubmissionStatus) ? 'usc-payment-rejected' :
                  'usc-payment-needed'
                }`}>
                  {isPaymentApproved(currentSubmissionStatus) ? '✅ Confirmed' :
                   isAwaitingPaymentApproval(currentSubmissionStatus) ? '⏳ Under Review' :
                   isPaymentRejected(currentSubmissionStatus) ? '❌ Rejected' :
                   '💳 Required'}
                </span>
              </div>
            )}

            {/* Show edit history if available */}
            {currentSubmissionStatus.editHistory && currentSubmissionStatus.editHistory.length > 0 && (
              <div className="usc-detail-row">
                <span className="usc-detail-label">Last edited:</span>
                <span className="usc-detail-value">
                  {formatDate(currentSubmissionStatus.editHistory[currentSubmissionStatus.editHistory.length - 1].editedAt)}
                </span>
              </div>
            )}

            {/* Show admin review info if available */}
            {currentSubmissionStatus.adminReview && (
              <div className="usc-detail-row">
                <span className="usc-detail-label">Reviewed:</span>
                <span className="usc-detail-value">
                  {formatDate(currentSubmissionStatus.adminReview.reviewedAt)}
                </span>
              </div>
            )}

            {currentSubmissionStatus.listingData?.location?.city && (
              <div className="usc-detail-row">
                <span className="usc-detail-label">Location:</span>
                <span className="usc-detail-value">
                  {currentSubmissionStatus.listingData.location.city}
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
                  onClick={() => handleViewListing(currentSubmissionStatus)}
                  title="View your listing on the website"
                >
                  <ExternalLink size={14} />
                  View Live
                </button>
              )}

              {/* Legacy: Old resubmit button for rejected listings */}
              {currentSubmissionStatus.status === 'rejected' && !canEdit && (
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
              {currentSubmissionStatus.status === 'pending_review' && (
                <div className="usc-status-indicator">
                  <Clock size={12} />
                  <span>Awaiting admin review</span>
                </div>
              )}

              {currentSubmissionStatus.status === 'rejected' && (
                <div className="usc-status-indicator usc-status-error">
                  <AlertCircle size={12} />
                  <span>Needs attention</span>
                </div>
              )}

              {currentSubmissionStatus.status === 'approved' && (
                <div className="usc-status-indicator usc-status-success">
                  <CheckCircle size={12} />
                  <span>
                    {isFreeSubmission ? 'Going live soon' : 
                     isPaymentApproved(currentSubmissionStatus) ? 'Going live soon' :
                     isAwaitingPaymentApproval(currentSubmissionStatus) ? 'Payment under review' :
                     isPaymentRejected(currentSubmissionStatus) ? 'Payment rejected' :
                     'Payment required'}
                  </span>
                </div>
              )}

              {(currentSubmissionStatus.status === 'listing_created' || 
                currentSubmissionStatus.status === 'approved_paid_active' || 
                currentSubmissionStatus.isLive) && (
                <div className="usc-status-indicator usc-status-live">
                  <Star size={12} />
                  <span>Live on platform</span>
                  {currentSubmissionStatus.adminReview?.isFeatured && (
                    <>
                      <Star size={12} />
                      <span>Featured</span>
                    </>
                  )}
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
          {!isFreeSubmission && currentSubmissionStatus.status === 'approved' && (
            <div className="usc-payment-timeline">
              <div className="usc-timeline-header">
                <h5>Payment Progress</h5>
              </div>
              <div className="usc-timeline-steps">
                <div className={`usc-timeline-step ${true ? 'usc-completed' : ''}`}>
                  <div className="usc-step-indicator">✅</div>
                  <div className="usc-step-content">
                    <span className="usc-step-title">Listing Approved</span>
                    <span className="usc-step-date">{formatDate(currentSubmissionStatus.adminReview?.reviewedAt)}</span>
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
                
                <div className={`usc-timeline-step ${isPaymentApproved(currentSubmissionStatus) ? 'usc-completed' : ''}`}>
                  <div className="usc-step-indicator">
                    {isPaymentApproved(currentSubmissionStatus) ? '✅' : 
                     isPaymentRejected(currentSubmissionStatus) ? '❌' : '⏳'}
                  </div>
                  <div className="usc-step-content">
                    <span className="usc-step-title">
                      {isPaymentApproved(currentSubmissionStatus) ? 'Payment Approved' :
                       isPaymentRejected(currentSubmissionStatus) ? 'Payment Rejected' :
                       'Payment Review'}
                    </span>
                    {paymentStatus.proofApprovedAt && (
                      <span className="usc-step-date">{formatDate(paymentStatus.proofApprovedAt)}</span>
                    )}
                  </div>
                </div>
                
                <div className={`usc-timeline-step ${currentSubmissionStatus.status === 'listing_created' || currentSubmissionStatus.isLive ? 'usc-completed' : ''}`}>
                  <div className="usc-step-indicator">
                    {currentSubmissionStatus.status === 'listing_created' || currentSubmissionStatus.isLive ? '🚗' : '⏳'}
                  </div>
                  <div className="usc-step-content">
                    <span className="usc-step-title">
                      {currentSubmissionStatus.status === 'listing_created' || currentSubmissionStatus.isLive ? 'Listing Live' : 'Going Live'}
                    </span>
                    {(currentSubmissionStatus.status === 'listing_created' || currentSubmissionStatus.isLive) && currentSubmissionStatus.listingCreatedAt && (
                      <span className="usc-step-date">{formatDate(currentSubmissionStatus.listingCreatedAt)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit History Section */}
          {currentSubmissionStatus.editHistory && currentSubmissionStatus.editHistory.length > 0 && (
            <div className="usc-edit-history">
              <div className="usc-edit-header">
                <h5>Recent Changes</h5>
              </div>
              <div className="usc-edit-item">
                <div className="usc-edit-info">
                  <span className="usc-edit-date">
                    {formatDate(currentSubmissionStatus.editHistory[currentSubmissionStatus.editHistory.length - 1].editedAt)}
                  </span>
                  {currentSubmissionStatus.editHistory[currentSubmissionStatus.editHistory.length - 1].editNote && (
                    <span className="usc-edit-note">
                      "{currentSubmissionStatus.editHistory[currentSubmissionStatus.editHistory.length - 1].editNote}"
                    </span>
                  )}
                </div>
                {currentSubmissionStatus.editHistory[currentSubmissionStatus.editHistory.length - 1].requiresReview && (
                  <span className="usc-review-indicator">
                    <Clock size={12} />
                    Review required
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Admin Review Notes */}
          {currentSubmissionStatus.adminReview && currentSubmissionStatus.adminReview.adminNotes && (
            <div className="usc-admin-review">
              <div className="usc-admin-header">
                <h5>Admin Review</h5>
              </div>
              <div className="usc-admin-content">
                <p className="usc-admin-notes">{currentSubmissionStatus.adminReview.adminNotes}</p>
                <span className="usc-review-date">
                  Reviewed: {formatDate(currentSubmissionStatus.adminReview.reviewedAt)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status-specific actions with ENHANCED REAL-TIME STATUS UPDATES */}
      <div className="usc-submission-status">
        {renderSubmissionStatus(currentSubmissionStatus)}
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