// src/components/GION/GIONAdminDashboard/VerificationQueue.js
import React, { useState } from 'react';
import './VerificationQueue.css';
import VerificationDetailsModal from './components/VerificationDetailsModal.js';

const VerificationQueue = ({ 
  verifications, 
  showViewAll = false, 
  onViewAll,
  onApprove,
  onReject 
}) => {
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [processingIds, setProcessingIds] = useState([]);
  const [error, setError] = useState(null);

  // Format date for better readability
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle verification review
  const handleReview = (id) => {
    setSelectedVerification(id);
    if (onViewAll && !id) {
      onViewAll();
    }
  };

  // Handle verification approval
  const handleApprove = async (id) => {
    setProcessingIds(prev => [...prev, id]);
    setError(null);
    
    try {
      if (onApprove) {
        await onApprove(id);
      }
    } catch (err) {
      console.error('Error approving verification:', err);
      setError(`Failed to approve verification ${id}`);
    } finally {
      setProcessingIds(prev => prev.filter(item => item !== id));
    }
  };

  // Handle verification rejection
  const handleReject = async (id, notes) => {
    setProcessingIds(prev => [...prev, id]);
    setError(null);
    
    try {
      if (onReject) {
        await onReject(id, notes);
      }
    } catch (err) {
      console.error('Error rejecting verification:', err);
      setError(`Failed to reject verification ${id}`);
    } finally {
      setProcessingIds(prev => prev.filter(item => item !== id));
    }
  };

  // Close the modal
  const handleCloseModal = () => {
    setSelectedVerification(null);
  };

  return (
    <div className="gion-verification-queue">
      {error && <div className="gion-error-message">{error}</div>}
      
      {verifications.length > 0 ? (
        <>
          <div className="gion-verification-list">
            {verifications.map(verification => (
              <div key={verification.id} className="gion-verification-item">
                <div className="gion-verification-header">
                  <div className="gion-verification-name">{verification.name}</div>
                  <div className={`gion-verification-status ${verification.status}`}>
                    {verification.status}
                  </div>
                </div>
                
                <div className="gion-verification-details">
                  <div className="gion-verification-type">{verification.type}</div>
                  <div className="gion-verification-date">
                    Submitted: {formatDate(verification.dateSubmitted)}
                  </div>
                </div>
                
                <div className="gion-verification-meta">
                  <div className="gion-verification-documents">
                    {verification.documents} document{verification.documents !== 1 ? 's' : ''}
                  </div>
                  <div className="gion-verification-actions">
                    {verification.status === 'pending' ? (
                      <>
                        <button 
                          className="gion-approve-button"
                          onClick={() => handleApprove(verification.id)}
                          disabled={processingIds.includes(verification.id)}
                        >
                          {processingIds.includes(verification.id) ? 'Processing...' : 'Approve'}
                        </button>
                        <button 
                          className="gion-reject-button"
                          onClick={() => handleReview(verification.id)}
                          disabled={processingIds.includes(verification.id)}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <button 
                        className="gion-verify-button"
                        onClick={() => handleReview(verification.id)}
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {showViewAll && (
            <div className="gion-view-all-container">
              <button 
                className="gion-view-all-button"
                onClick={() => handleReview()}
              >
                View All Verifications
              </button>
            </div>
          )}
          
          {selectedVerification && (
            <VerificationDetailsModal 
              verificationId={selectedVerification}
              onClose={handleCloseModal}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
        </>
      ) : (
        <div className="gion-no-verifications">
          <p>No pending verifications</p>
        </div>
      )}
    </div>
  );
};

export default VerificationQueue;