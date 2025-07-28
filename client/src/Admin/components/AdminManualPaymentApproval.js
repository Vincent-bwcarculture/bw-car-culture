// client/src/Admin/components/AdminManualPaymentApproval.js
// FIXED - Admin Manual Payment Approval Component

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

  const handleApprovePayment = async () => {
    if (!approvalConfirm) {
      setError('Please confirm that payment has been verified');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // FIXED: Extract listingId from submission data
      const listingId = submission.listingData?._id || submission.listingId || submission._id;
      const subscriptionTier = submission.adminReview?.subscriptionTier || 'basic';
      
      console.log('🔧 Preparing payment approval with:', {
        submissionId: submission._id,
        listingId: listingId,
        subscriptionTier: subscriptionTier,
        adminNotes: paymentNotes
      });

      // Validate required fields before sending
      if (!submission._id) {
        throw new Error('Missing submission ID');
      }
      
      if (!listingId) {
        throw new Error('Missing listing ID - check submission data structure');
      }

      // CORRECTED: Remove /api prefix and include all required fields
      const response = await axios.post(`/admin/payments/approve-manual`, {
        submissionId: submission._id,
        listingId: listingId,                    // ✅ NOW INCLUDED
        subscriptionTier: subscriptionTier,
        adminNotes: paymentNotes,
        manualVerification: true
      });

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
      
      // Enhanced error handling
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

  const currentTier = submission.adminReview?.subscriptionTier || 'basic';
  const tierDetails = getTierDetails(currentTier);

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
        {/* DEBUG INFO - Show what data we have */}
        <div className="debug-section" style={{ 
          background: 'rgba(156, 163, 175, 0.1)', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1rem',
          fontSize: '0.875rem',
          fontFamily: 'monospace'
        }}>
          <h4 style={{ color: '#9ca3af', margin: '0 0 0.5rem 0' }}>Debug Info:</h4>
          <div style={{ color: '#c9c9c9' }}>
            <div>Submission ID: {submission._id}</div>
            <div>Listing ID: {submission.listingData?._id || submission.listingId || 'MISSING ⚠️'}</div>
            <div>Subscription Tier: {currentTier}</div>
            <div>User Email: {submission.userEmail || submission.submitterEmail || 'N/A'}</div>
          </div>
        </div>

        {/* Submission Details */}
        <div className="submission-info">
          <h3>Submission Details</h3>
          <div className="info-grid">
            <div className="info-item">
              <User size={16} />
              <div>
                <label>User</label>
                <span>{submission.userEmail || submission.submitterEmail || 'Unknown User'}</span>
              </div>
            </div>
            
            <div className="info-item">
              <Calendar size={16} />
              <div>
                <label>Submitted</label>
                <span>{formatDate(submission.submittedAt)}</span>
              </div>
            </div>
            
            <div className="info-item">
              <DollarSign size={16} />
              <div>
                <label>Subscription Tier</label>
                <span>{tierDetails.name} - {formatCurrency(tierDetails.price)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Listing Information */}
        {submission.listingData && (
          <div className="listing-info">
            <h3>Listing Information</h3>
            <div className="listing-details">
              <div><strong>Vehicle:</strong> {submission.listingData.make} {submission.listingData.model}</div>
              <div><strong>Year:</strong> {submission.listingData.year}</div>
              {submission.listingData.price && (
                <div><strong>Asking Price:</strong> {formatCurrency(submission.listingData.price)}</div>
              )}
            </div>
          </div>
        )}

        {/* Payment Proof */}
        {submission.proofOfPayment && (
          <div className="proof-section">
            <h3>Proof of Payment</h3>
            <div className="proof-info">
              <FileText size={16} />
              <span>Payment proof has been submitted</span>
              <div className="proof-actions">
                <button 
                  className="view-proof-btn"
                  onClick={() => setShowProofModal(true)}
                >
                  <Eye size={16} />
                  View
                </button>
                <a 
                  href={submission.proofOfPayment.url}
                  download
                  className="download-proof-btn"
                >
                  <Download size={16} />
                  Download
                </a>
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
              <small>Please check the debug info above and ensure all required fields are present.</small>
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="approval-notice">
          <AlertCircle size={20} />
          <div>
            <h4>Important</h4>
            <p>Approving this payment will immediately activate the listing with the {tierDetails.name}. Make sure payment has been verified before proceeding.</p>
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
          disabled={loading || !approvalConfirm}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Processing...
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Approve Payment
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminManualPaymentApproval;
