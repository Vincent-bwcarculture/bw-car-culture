// client/src/Admin/components/AdminManualPaymentApproval.js
// Admin Manual Payment Approval Component - Add to AdminUserSubmissions

import React, { useState } from 'react';
import { 
  CreditCard, CheckCircle, X, DollarSign, User, 
  Calendar, FileText, Eye, AlertCircle, Clock,
  Phone, MessageSquare, Download, ExternalLink
} from 'lucide-react';
import axios from '../../config/axios.js';

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

      const response = await axios.post(`/api/admin/payments/approve-manual`, {
        submissionId: submission._id,
        listingId: submission.listingData?._id,
        subscriptionTier: submission.adminReview?.subscriptionTier || 'basic',
        adminNotes: paymentNotes,
        manualVerification: true
      });

      if (response.data.success) {
        if (onPaymentApproved) {
          onPaymentApproved(response.data.data);
        }
        onClose();
      } else {
        throw new Error(response.data.message || 'Failed to approve payment');
      }

    } catch (error) {
      console.error('Error approving payment:', error);
      setError(error.response?.data?.message || 'Failed to approve payment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTierPrice = (tier) => {
    const prices = {
      basic: 50,
      standard: 100,
      premium: 200
    };
    return prices[tier] || 50;
  };

  const submissionTier = submission.adminReview?.subscriptionTier || 'basic';
  const expectedAmount = getTierPrice(submissionTier);

  return (
    <div className="manual-payment-approval-container">
      <div className="manual-payment-approval-header">
        <div className="approval-header-info">
          <CreditCard size={24} className="payment-icon" />
          <div>
            <h3>Manual Payment Approval</h3>
            <p>Verify and approve payment for this listing</p>
          </div>
        </div>
        <button 
          className="close-approval-btn"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <div className="manual-payment-approval-body">
        {/* Submission Summary */}
        <div className="payment-submission-summary">
          <h4>Submission Details</h4>
          <div className="submission-detail-grid">
            <div className="submission-detail">
              <User size={16} />
              <div>
                <span className="detail-label">Submitted By</span>
                <span className="detail-value">{submission.userEmail || 'Unknown'}</span>
              </div>
            </div>
            
            <div className="submission-detail">
              <Calendar size={16} />
              <div>
                <span className="detail-label">Submitted On</span>
                <span className="detail-value">{formatDate(submission.submittedAt)}</span>
              </div>
            </div>

            <div className="submission-detail">
              <FileText size={16} />
              <div>
                <span className="detail-label">Listing Title</span>
                <span className="detail-value">{submission.listingData?.title || 'No title'}</span>
              </div>
            </div>

            <div className="submission-detail">
              <DollarSign size={16} />
              <div>
                <span className="detail-label">Expected Price</span>
                <span className="detail-value">P{submission.listingData?.price?.toLocaleString() || 'Not set'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="payment-info-section">
          <h4>Payment Information</h4>
          <div className="payment-info-grid">
            <div className="payment-info-item">
              <span className="info-label">Subscription Tier:</span>
              <span className={`tier-badge tier-${submissionTier}`}>
                {submissionTier.toUpperCase()}
              </span>
            </div>
            
            <div className="payment-info-item">
              <span className="info-label">Expected Amount:</span>
              <span className="amount-value">P{expectedAmount}</span>
            </div>
            
            <div className="payment-info-item">
              <span className="info-label">Payment Status:</span>
              <span className="status-pending">
                <Clock size={14} />
                Pending Manual Verification
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods Reference */}
        <div className="payment-methods-reference">
          <h4>Payment Methods (for reference)</h4>
          <div className="payment-methods-grid">
            <div className="payment-method-ref">
              <Phone size={16} />
              <div>
                <span className="method-label">FNB Paytocell</span>
                <span className="method-value">+267 72 573 475</span>
              </div>
            </div>
            
            <div className="payment-method-ref">
              <DollarSign size={16} />
              <div>
                <span className="method-label">FNB Account</span>
                <span className="method-value">62918382300</span>
              </div>
            </div>
            
            <div className="payment-method-ref">
              <MessageSquare size={16} />
              <div>
                <span className="method-label">Orange Money</span>
                <span className="method-value">+267 72 573 475</span>
              </div>
            </div>
          </div>
        </div>

        {/* Proof of Payment */}
        {submission.proofOfPayment && (
          <div className="proof-of-payment-section">
            <h4>Proof of Payment</h4>
            <div className="proof-item">
              <FileText size={20} />
              <div className="proof-info">
                <span className="proof-filename">{submission.proofOfPayment.filename}</span>
                <span className="proof-date">Uploaded: {formatDate(submission.proofOfPayment.uploadedAt)}</span>
              </div>
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
            {error}
          </div>
        )}

        {/* Important Notice */}
        <div className="approval-notice">
          <AlertCircle size={20} />
          <div>
            <h4>Important</h4>
            <p>Approving this payment will immediately activate the listing with the selected subscription tier. Make sure payment has been verified before proceeding.</p>
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
          {loading ? 'Processing...' : 'Approve Payment'}
        </button>
      </div>

      {/* Proof of Payment Modal */}
      {showProofModal && submission.proofOfPayment && (
        <div className="proof-modal-overlay" onClick={() => setShowProofModal(false)}>
          <div className="proof-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="proof-modal-header">
              <h3>Proof of Payment</h3>
              <button 
                className="close-proof-modal"
                onClick={() => setShowProofModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="proof-modal-body">
              {submission.proofOfPayment.type?.startsWith('image/') ? (
                <img 
                  src={submission.proofOfPayment.url} 
                  alt="Proof of payment"
                  className="proof-image"
                />
              ) : (
                <div className="proof-document">
                  <FileText size={48} />
                  <p>PDF Document</p>
                  <a 
                    href={submission.proofOfPayment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="open-document-btn"
                  >
                    <ExternalLink size={16} />
                    Open Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add this CSS to your AdminUserSubmissions.css or create a separate file
const PaymentApprovalStyles = `
.manual-payment-approval-container {
  background: #1a1a1a;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  max-width: 600px;
  width: 100%;
}

.manual-payment-approval-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.approval-header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.payment-icon {
  color: #ff3300;
}

.approval-header-info h3 {
  margin: 0;
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
}

.approval-header-info p {
  margin: 0.25rem 0 0 0;
  color: #c9c9c9;
  font-size: 0.875rem;
}

.close-approval-btn {
  background: none;
  border: none;
  color: #c9c9c9;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-approval-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.manual-payment-approval-body {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.payment-submission-summary,
.payment-info-section,
.payment-methods-reference,
.proof-of-payment-section,
.admin-notes-section {
  margin-bottom: 1.5rem;
}

.payment-submission-summary h4,
.payment-info-section h4,
.payment-methods-reference h4,
.proof-of-payment-section h4,
.admin-notes-section h4 {
  margin: 0 0 1rem 0;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
}

.submission-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.submission-detail {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.submission-detail svg {
  color: #ff3300;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.detail-label {
  display: block;
  color: #c9c9c9;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.detail-value {
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 500;
}

.payment-info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.payment-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-label {
  color: #c9c9c9;
  font-size: 0.875rem;
}

.tier-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.tier-basic { background: #3b82f6; color: white; }
.tier-standard { background: #f59e0b; color: white; }
.tier-premium { background: #ef4444; color: white; }

.amount-value {
  color: #4ade80;
  font-weight: 600;
  font-size: 1rem;
}

.status-pending {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #f59e0b;
  font-size: 0.875rem;
}

.payment-methods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.payment-method-ref {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.payment-method-ref svg {
  color: #ff3300;
  flex-shrink: 0;
}

.method-label {
  display: block;
  color: #c9c9c9;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.method-value {
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 500;
  font-family: 'Courier New', monospace;
}

.proof-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.proof-item svg {
  color: #4ade80;
  flex-shrink: 0;
}

.proof-info {
  flex: 1;
}

.proof-filename {
  display: block;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.proof-date {
  color: #c9c9c9;
  font-size: 0.75rem;
}

.proof-actions {
  display: flex;
  gap: 0.5rem;
}

.view-proof-btn,
.download-proof-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  text-decoration: none;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-proof-btn:hover,
.download-proof-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.admin-notes-textarea {
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #ffffff;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
}

.admin-notes-textarea:focus {
  outline: none;
  border-color: #ff3300;
  box-shadow: 0 0 0 3px rgba(255, 51, 0, 0.2);
}

.admin-notes-textarea::placeholder {
  color: #c9c9c9;
}

.payment-confirmation-section {
  margin-bottom: 1.5rem;
}

.confirmation-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  color: #ffffff;
  font-size: 0.875rem;
}

.confirmation-checkbox input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: transparent;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.confirmation-checkbox input[type="checkbox"]:checked + .checkbox-custom {
  background: #ff3300;
  border-color: #ff3300;
}

.confirmation-checkbox input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.approval-notice {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.approval-notice svg {
  color: #ef4444;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.approval-notice h4 {
  margin: 0 0 0.5rem 0;
  color: #ffffff;
  font-size: 0.875rem;
  font-weight: 600;
}

.approval-notice p {
  margin: 0;
  color: #c9c9c9;
  font-size: 0.875rem;
  line-height: 1.4;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #ef4444;
  font-size: 0.875rem;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  margin-bottom: 1rem;
}

.manual-payment-approval-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

.cancel-approval-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: transparent;
  color: #c9c9c9;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.875rem;
}

.cancel-approval-btn:hover:not(:disabled) {
  border-color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.approve-payment-btn {
  padding: 0.75rem 1.5rem;
  background: #4ade80;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.875rem;
  min-width: 140px;
}

.approve-payment-btn:hover:not(:disabled) {
  background: #22c55e;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 222, 128, 0.3);
}

.approve-payment-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Proof Modal */
.proof-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.proof-modal-content {
  background: #1a1a1a;
  border-radius: 12px;
  max-width: 80vw;
  max-height: 80vh;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.proof-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.proof-modal-header h3 {
  margin: 0;
  color: #ffffff;
  font-size: 1.125rem;
  font-weight: 600;
}

.close-proof-modal {
  background: none;
  border: none;
  color: #c9c9c9;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-proof-modal:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.proof-modal-body {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.proof-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 8px;
}

.proof-document {
  text-align: center;
  color: #c9c9c9;
}

.proof-document svg {
  margin-bottom: 1rem;
  color: #ff3300;
}

.proof-document p {
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.open-document-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ff3300;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.open-document-btn:hover {
  background: #cc2900;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .submission-detail-grid,
  .payment-methods-grid {
    grid-template-columns: 1fr;
  }
  
  .manual-payment-approval-actions {
    flex-direction: column-reverse;
  }
  
  .cancel-approval-btn,
  .approve-payment-btn {
    width: 100%;
    justify-content: center;
  }
}
`;

export default AdminManualPaymentApproval;
