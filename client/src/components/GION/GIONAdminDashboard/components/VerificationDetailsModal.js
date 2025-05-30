// src/components/GION/GIONAdminDashboard/components/VerificationDetailsModal.js
import React, { useState, useEffect } from 'react';
import './VerificationDetailsModal.css';
import GIONAdminService from '../../../../services/GIONAdminService.js';

const VerificationDetailsModal = ({ verificationId, onClose, onApprove, onReject }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verification, setVerification] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchVerificationDetails = async () => {
      setLoading(true);
      try {
        // Fetch the detailed verification info
        const response = await GIONAdminService.getVerificationDetails(verificationId);
        setVerification(response.data.data);
      } catch (err) {
        console.error('Error fetching verification details:', err);
        setError('Failed to load verification details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (verificationId) {
      fetchVerificationDetails();
    }
  }, [verificationId]);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await onApprove(verificationId);
      onClose();
    } catch (err) {
      setError('Failed to approve verification. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }

    setProcessing(true);
    try {
      await onReject(verificationId, rejectReason);
      onClose();
    } catch (err) {
      setError('Failed to reject verification. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const openDocument = (url) => {
    window.open(url, '_blank');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="gion-modal-overlay">
        <div className="gion-verification-details-modal">
          <div className="gion-modal-header">
            <h2>Loading Verification Details...</h2>
            <button className="gion-modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="gion-modal-loading">
            <div className="gion-loading-spinner"></div>
            <p>Fetching verification details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gion-modal-overlay">
        <div className="gion-verification-details-modal">
          <div className="gion-modal-header">
            <h2>Error</h2>
            <button className="gion-modal-close" onClick={onClose}>&times;</button>
          </div>
          <div className="gion-modal-error">
            <p>{error}</p>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!verification) {
    return null;
  }

  return (
    <div className="gion-modal-overlay">
      <div className="gion-verification-details-modal">
        <div className="gion-modal-header">
          <h2>Verification Details</h2>
          <button className="gion-modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="gion-modal-body">
          <div className="gion-verification-header-info">
            <div className="gion-business-name">{verification.businessName}</div>
            <div className={`gion-verification-status ${verification.status}`}>
              {verification.status.toUpperCase()}
            </div>
          </div>
          
          <div className="gion-verification-details-grid">
            <div className="gion-detail-item">
              <label>Business Type:</label>
              <span>{verification.businessType}</span>
            </div>
            <div className="gion-detail-item">
              <label>Provider Type:</label>
              <span>{verification.providerType}</span>
            </div>
            <div className="gion-detail-item">
              <label>Submitted By:</label>
              <span>{verification.user?.name || 'Unknown'}</span>
            </div>
            <div className="gion-detail-item">
              <label>Email:</label>
              <span>{verification.user?.email || 'N/A'}</span>
            </div>
            <div className="gion-detail-item">
              <label>Submitted On:</label>
              <span>{formatDate(verification.createdAt)}</span>
            </div>
            <div className="gion-detail-item">
              <label>Contact Phone:</label>
              <span>{verification.contact?.phone || 'N/A'}</span>
            </div>
          </div>
          
          {verification.contact && (
            <div className="gion-contact-section">
              <h3>Contact Information</h3>
              <div className="gion-contact-grid">
                {verification.contact.email && (
                  <div className="gion-contact-item">
                    <label>Email:</label>
                    <span>{verification.contact.email}</span>
                  </div>
                )}
                {verification.contact.phone && (
                  <div className="gion-contact-item">
                    <label>Phone:</label>
                    <span>{verification.contact.phone}</span>
                  </div>
                )}
                {verification.contact.website && (
                  <div className="gion-contact-item">
                    <label>Website:</label>
                    <a href={verification.contact.website} target="_blank" rel="noopener noreferrer">
                      {verification.contact.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {verification.location && (
            <div className="gion-location-section">
              <h3>Location</h3>
              <div className="gion-location-grid">
                {verification.location.address && (
                  <div className="gion-location-item">
                    <label>Address:</label>
                    <span>{verification.location.address}</span>
                  </div>
                )}
                {verification.location.city && (
                  <div className="gion-location-item">
                    <label>City:</label>
                    <span>{verification.location.city}</span>
                  </div>
                )}
                {verification.location.country && (
                  <div className="gion-location-item">
                    <label>Country:</label>
                    <span>{verification.location.country}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {verification.documents && verification.documents.length > 0 && (
            <div className="gion-documents-section">
              <h3>Documents</h3>
              <div className="gion-documents-grid">
                {verification.documents.map((doc, index) => (
                  <div key={index} className="gion-document-item">
                    <div className="gion-document-icon">
                      {doc.mimetype.startsWith('image/') ? '🖼️' : '📄'}
                    </div>
                    <div className="gion-document-info">
                      <div className="gion-document-name">{doc.filename}</div>
                      <div className="gion-document-type">{doc.mimetype}</div>
                    </div>
                    <button 
                      className="gion-document-view-btn"
                      onClick={() => openDocument(doc.path)}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {verification.status === 'pending' && (
            <div className="gion-verification-actions">
              {!showRejectForm ? (
                <>
                  <button 
                    className="gion-approve-button"
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  <button 
                    className="gion-reject-button"
                    onClick={() => setShowRejectForm(true)}
                    disabled={processing}
                  >
                    Reject
                  </button>
                </>
              ) : (
                <div className="gion-reject-form">
                  <h3>Provide Rejection Reason</h3>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                  />
                  <div className="gion-reject-form-actions">
                    <button 
                      className="gion-cancel-button"
                      onClick={() => setShowRejectForm(false)}
                      disabled={processing}
                    >
                      Cancel
                    </button>
                    <button 
                      className="gion-confirm-reject-button"
                      onClick={handleReject}
                      disabled={processing}
                    >
                      {processing ? 'Processing...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {verification.status !== 'pending' && verification.reviewNotes && (
            <div className="gion-review-notes">
              <h3>{verification.status === 'approved' ? 'Approval Notes' : 'Rejection Reason'}</h3>
              <p>{verification.reviewNotes}</p>
              <div className="gion-reviewer-info">
                <p>By: {verification.reviewedBy?.name || 'Unknown Admin'}</p>
                <p>On: {formatDate(verification.reviewedAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationDetailsModal;