// client/src/Admin/components/AdminManualPaymentApproval.js
// FIXED - Handle both Payment Objects and Submission Objects

import React, { useState } from 'react';
import { 
  CreditCard, CheckCircle, X, DollarSign, User, 
  Calendar, FileText, Eye, AlertCircle, Clock,
  Phone, MessageSquare, Download, ExternalLink
} from 'lucide-react';
import axios from '../../config/axios.js';
import './AdminManualPaymentApproval.css';

const AdminManualPaymentApproval = ({ 
  submission, 
  onPaymentApproved, 
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showProofModal, setShowProofModal] = useState(false);
  const [approvalConfirm, setApprovalConfirm] = useState(false);

  // ENHANCED: Detect if this is a payment object or submission object
  const isPaymentObject = submission.transactionRef || submission.paymentMethod;
  
  console.log('🔍 Object type detection:', {
    isPaymentObject,
    hasTransactionRef: !!submission.transactionRef,
    hasPaymentMethod: !!submission.paymentMethod,
    hasListingData: !!submission.listingData,
    hasAdminReview: !!submission.adminReview
  });

  // ENHANCED: Extract data based on object type
  const extractedData = isPaymentObject ? {
    // For Payment Objects
    submissionId: submission._id, // Use payment ID as submission ID for API
    listingId: submission.listing, // Payment objects have listing field
    subscriptionTier: submission.subscriptionTier || 'basic',
    userEmail: submission.userEmail || 'Unknown User',
    submittedAt: submission.createdAt,
    amount: submission.amount,
    currency: submission.currency || 'BWP',
    status: submission.status,
    proofOfPayment: submission.proofOfPayment,
    transactionRef: submission.transactionRef
  } : {
    // For Submission Objects
    submissionId: submission._id,
    listingId: submission.listingData?._id || submission.listingId || submission._id,
    subscriptionTier: submission.adminReview?.subscriptionTier || 'basic',
    userEmail: submission.userEmail || submission.submitterEmail || 'Unknown User',
    submittedAt: submission.submittedAt,
    amount: submission.adminReview?.totalCost,
    currency: 'BWP',
    status: submission.status,
    proofOfPayment: submission.proofOfPayment,
    listingData: submission.listingData
  };

  const handleApprovePayment = async () => {
    if (!approvalConfirm) {
      setError('Please confirm that payment has been verified');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('🔧 Preparing payment approval with extracted data:', extractedData);

      // Validate required fields
      if (!extractedData.submissionId) {
        throw new Error('Missing submission/payment ID');
      }
      
      if (!extractedData.listingId) {
        throw new Error('Missing listing ID - check object structure');
      }

      // Convert ObjectId to string if needed
      const listingId = extractedData.listingId.toString ? extractedData.listingId.toString() : extractedData.listingId;
      const submissionId = extractedData.submissionId.toString ? extractedData.submissionId.toString() : extractedData.submissionId;

      const requestPayload = {
        submissionId: submissionId,
        listingId: listingId,
        subscriptionTier: extractedData.subscriptionTier,
        adminNotes: paymentNotes,
        manualVerification: true
      };

      console.log('📤 Sending API request:', requestPayload);

      const response = await axios.post(`/admin/payments/approve-manual`, requestPayload);

      console.log('✅ Payment approval response:', response.data);

      if (response.data.success) {
        if (onPaymentApproved) {
          onPaymentApproved(response.data.data);
        }
        onClose();
      } else {
        throw new Error(response.data.message || 'Failed to approve payment');
      }

    } catch (error) {
      console.error('❌ Error approving payment:', error);
      
      let errorMessage = 'Failed to approve payment';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `P${Number(amount || 0).toLocaleString()}`;
  };

  // Get tier pricing for display
  const getTierDetails = (tier) => {
    const tierPricing = {
      basic: { name: 'Basic Plan', price: 50, duration: 30 },
      standard: { name: 'Standard Plan', price: 100, duration: 30 },
      premium: { name: 'Premium Plan', price: 200, duration: 45 }
    };
    return tierPricing[tier] || tierPricing.basic;
  };

  const tierDetails = getTierDetails(extractedData.subscriptionTier);

  return (
    <div className="manual-payment-approval-modal">
      <div className="modal-header">
        <div className="modal-title">
          <CreditCard size={24} />
          <div>
            <h2>Manual Payment Approval</h2>
            <p>Review and approve payment for this listing</p>
          </div>
        </div>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="modal-content">
        {/* ENHANCED DEBUG INFO */}
        <div className="debug-section">
          <h4>Debug Info:</h4>
          <div>
            <div>Object Type: {isPaymentObject ? 'Payment Object' : 'Submission Object'}</div>
            <div>Submission/Payment ID: {extractedData.submissionId}</div>
            <div>Listing ID: {extractedData.listingId || 'MISSING ⚠️'}</div>
            <div>Subscription Tier: {extractedData.subscriptionTier}</div>
            <div>User Email: {extractedData.userEmail}</div>
            <div>Amount: {formatCurrency(extractedData.amount)}</div>
            <div>Status: {extractedData.status}</div>
            {isPaymentObject && <div>Transaction Ref: {extractedData.transactionRef}</div>}
          </div>
        </div>

        {/* ENHANCED SUBMISSION/PAYMENT DETAILS */}
        <div className="submission-info">
          <h3>{isPaymentObject ? 'Payment Details' : 'Submission Details'}</h3>
          <div className="info-grid">
            <div className="info-item">
              <User size={16} />
              <div>
                <label>User</label>
                <span>{extractedData.userEmail}</span>
              </div>
            </div>
            
            <div className="info-item">
              <Calendar size={16} />
              <div>
                <label>{isPaymentObject ? 'Created' : 'Submitted'}</label>
                <span>{formatDate(extractedData.submittedAt)}</span>
              </div>
            </div>
            
            <div className="info-item">
              <DollarSign size={16} />
              <div>
                <label>Subscription Plan</label>
                <span>{tierDetails.name} - {formatCurrency(extractedData.amount || tierDetails.price)}</span>
              </div>
            </div>

            {isPaymentObject && extractedData.transactionRef && (
              <div className="info-item">
                <FileText size={16} />
                <div>
                  <label>Transaction Reference</label>
                  <span style={{fontFamily: 'monospace', fontSize: '0.8rem'}}>{extractedData.transactionRef}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LISTING INFORMATION - Only show if we have listing data */}
        {extractedData.listingData && (
          <div className="listing-info">
            <h3>Listing Information</h3>
            <div className="listing-details">
              <div><strong>Vehicle:</strong> {extractedData.listingData.make} {extractedData.listingData.model}</div>
              <div><strong>Year:</strong> {extractedData.listingData.year}</div>
              {extractedData.listingData.price && (
                <div><strong>Asking Price:</strong> {formatCurrency(extractedData.listingData.price)}</div>
              )}
            </div>
          </div>
        )}

        {/* ENHANCED PAYMENT PROOF */}
        {extractedData.proofOfPayment && (
          <div className="proof-section">
            <h3>Proof of Payment</h3>
            <div className="proof-info">
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <FileText size={16} />
                <span>Payment proof has been submitted</span>
              </div>
              <div className="proof-actions">
                {extractedData.proofOfPayment.file?.url && (
                  <>
                    <button 
                      className="view-proof-btn"
                      onClick={() => window.open(extractedData.proofOfPayment.file.url, '_blank')}
                    >
                      <Eye size={16} />
                      View
                    </button>
                    <a 
                      href={extractedData.proofOfPayment.file.url}
                      download
                      className="download-proof-btn"
                    >
                      <Download size={16} />
                      Download
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div className="admin-notes-section">
          <label htmlFor="paymentNotes">
            <h4>Admin Notes (Optional)</h4>
          </label>
          <textarea
            id="paymentNotes"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            placeholder="Add any notes about the payment verification..."
            rows={3}
            className="admin-notes-textarea"
          />
        </div>

        {/* Confirmation */}
        <div className="payment-confirmation-section">
          <label className="confirmation-checkbox">
            <input
              type="checkbox"
              checked={approvalConfirm}
              onChange={(e) => setApprovalConfirm(e.target.checked)}
            />
            <div className="checkbox-custom"></div>
            <span>I confirm that payment has been received and verified</span>
          </label>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            <div>
              <strong>Error:</strong> {error}
              <br />
              <small>Check the debug info above for data structure details.</small>
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="approval-notice">
          <AlertCircle size={20} />
          <div>
            <h4>Important</h4>
            <p>Approving this payment will immediately activate the listing with the {tierDetails.name}. The listing will be valid for {tierDetails.duration} days.</p>
          </div>
        </div>
      </div>

      <div className="manual-payment-approval-actions">
        <button 
          className="cancel-approval-btn"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          className="approve-payment-btn"
          onClick={handleApprovePayment}
          disabled={loading || !approvalConfirm || !extractedData.listingId}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Processing...
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Approve Payment ({formatCurrency(extractedData.amount || tierDetails.price)})
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminManualPaymentApproval;
