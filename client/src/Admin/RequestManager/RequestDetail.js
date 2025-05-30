// src/Admin/RequestManager/RequestDetail.js
import React, { useState } from 'react';
import './RequestManager.css';

const RequestDetail = ({ 
  request, 
  requestType, 
  onBack, 
  onApprove, 
  onReject, 
  onDelete, 
  loading 
}) => {
  const [reviewNotes, setReviewNotes] = useState(request.reviewNotes || '');
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };
  
  // Handle document preview
  const renderDocumentPreview = (document) => {
    if (document.mimetype?.startsWith('image/')) {
      return (
        <div className="document-preview">
          <img src={document.path} alt={document.filename} />
        </div>
      );
    } else if (document.mimetype === 'application/pdf') {
      return (
        <div className="document-pdf-preview">
          <div className="pdf-icon">📄</div>
          <span>PDF Document</span>
        </div>
      );
    } else {
      return (
        <div className="document-pdf-preview">
          <div className="pdf-icon">📎</div>
          <span>Document</span>
        </div>
      );
    }
  };
  
  // Handle approve button click
  const handleApprove = () => {
    if (window.confirm('Are you sure you want to approve this request?')) {
      onApprove(request._id, reviewNotes);
    }
  };
  
  // Handle reject button click
  const handleReject = () => {
    if (window.confirm('Are you sure you want to reject this request?')) {
      onReject(request._id, reviewNotes);
    }
  };
  
  return (
    <div className="request-detail">
      <div className="request-detail-header">
        <h2>
          {requestType === 'provider' 
            ? `Provider Request: ${request.businessName}`
            : `Ministry Request: ${request.ministryName}`}
        </h2>
        
        <button className="back-button" onClick={onBack}>
          ← Back to List
        </button>
      </div>
      
      <div className="request-detail-content">
        <div className="request-detail-section">
          <h3>Request Information</h3>
          
          <div className="request-info-grid">
            <div className="info-item">
              <div className="info-label">Request ID</div>
              <div className="info-value">{request._id}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Status</div>
              <div className="info-value">
                <span className={`request-status ${getStatusClass(request.status)}`}>
                  {request.status}
                </span>
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Submitted On</div>
              <div className="info-value">{formatDate(request.createdAt)}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Last Updated</div>
              <div className="info-value">{formatDate(request.updatedAt)}</div>
            </div>
          </div>
        </div>
        
        <div className="request-detail-section">
          <h3>{requestType === 'provider' ? 'Business Information' : 'Ministry Information'}</h3>
          
          <div className="request-info-grid">
            {requestType === 'provider' ? (
              <>
                <div className="info-item">
                  <div className="info-label">Business Name</div>
                  <div className="info-value">{request.businessName}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Provider Type</div>
                  <div className="info-value">{request.providerType.replace('_', ' ')}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Business Type</div>
                  <div className="info-value">{request.businessType}</div>
                </div>
              </>
            ) : (
              <>
                <div className="info-item">
                  <div className="info-label">Ministry Name</div>
                  <div className="info-value">{request.ministryName}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Department</div>
                  <div className="info-value">{request.department}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Role</div>
                  <div className="info-value">{request.role}</div>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="request-detail-section">
          <h3>Contact Information</h3>
          
          <div className="request-info-grid">
            {requestType === 'provider' ? (
              <>
                <div className="info-item">
                  <div className="info-label">Phone</div>
                  <div className="info-value">{request.contact?.phone || 'Not provided'}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Email</div>
                  <div className="info-value">{request.contact?.email || 'Not provided'}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Website</div>
                  <div className="info-value">
                    {request.contact?.website ? (
                      <a href={request.contact.website} target="_blank" rel="noopener noreferrer">
                        {request.contact.website}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="info-item">
                  <div className="info-label">Phone</div>
                  <div className="info-value">{request.contactDetails?.phone || 'Not provided'}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Email</div>
                  <div className="info-value">{request.contactDetails?.email || 'Not provided'}</div>
                </div>
                
                <div className="info-item">
                  <div className="info-label">Office Address</div>
                  <div className="info-value">{request.contactDetails?.officeAddress || 'Not provided'}</div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {requestType === 'provider' && (
          <div className="request-detail-section">
            <h3>Location</h3>
            
            <div className="request-info-grid">
              <div className="info-item">
                <div className="info-label">Address</div>
                <div className="info-value">{request.location?.address || 'Not provided'}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">City</div>
                <div className="info-value">{request.location?.city || 'Not provided'}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">State/Province</div>
                <div className="info-value">{request.location?.state || 'Not provided'}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">Country</div>
                <div className="info-value">{request.location?.country || 'Not provided'}</div>
              </div>
            </div>
          </div>
        )}
        
        {requestType === 'ministry' && request.reason && (
          <div className="request-detail-section">
            <h3>Reason for Access</h3>
            <div className="info-value">
              {request.reason}
            </div>
          </div>
        )}
        
        {request.documents && request.documents.length > 0 && (
          <div className="request-detail-section">
            <h3>Verification Documents</h3>
            
            <div className="documents-list">
              {request.documents.map((document, index) => (
                <div key={index} className="document-item">
                  {renderDocumentPreview(document)}
                  
                  <div className="document-info">
                    <h4 className="document-name">{document.filename}</h4>
                    <div className="document-type">{document.mimetype || 'Unknown type'}</div>
                  </div>
                  
                  <a 
                    href={document.path} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="view-document-btn"
                  >
                    View Document
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {request.status === 'pending' && (
          <div className="review-section">
            <h3>Review Decision</h3>
            
            <div className="review-notes">
              <label htmlFor="review-notes">Review Notes (optional)</label>
              <textarea
                id="review-notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about your decision (visible to the applicant)"
                disabled={loading}
              ></textarea>
            </div>
            
            <div className="review-actions">
              <button 
                className="approve-btn"
                onClick={handleApprove}
                disabled={loading}
              >
                ✓ Approve Request
              </button>
              
              <button 
                className="reject-btn"
                onClick={handleReject}
                disabled={loading}
              >
                ✕ Reject Request
              </button>
              
              <button 
                className="delete-btn"
                onClick={() => onDelete(request._id)}
                disabled={loading}
              >
                🗑 Delete Request
              </button>
            </div>
          </div>
        )}
        
        {request.status !== 'pending' && (
          <div className="review-section">
            <h3>Review Information</h3>
            
            <div className="request-info-grid">
              <div className="info-item">
                <div className="info-label">Review Date</div>
                <div className="info-value">{formatDate(request.reviewedAt)}</div>
              </div>
              
              <div className="info-item">
                <div className="info-label">Reviewed By</div>
                <div className="info-value">
                  {request.reviewedBy
                    ? `${request.reviewedBy.name} (${request.reviewedBy.email})`
                    : 'Unknown'}
                </div>
              </div>
            </div>
            
            {request.reviewNotes && (
              <div className="info-item" style={{ marginTop: '1rem' }}>
                <div className="info-label">Review Notes</div>
                <div className="info-value">{request.reviewNotes}</div>
              </div>
            )}
            
            <div className="review-actions" style={{ marginTop: '2rem' }}>
              <button 
                className="delete-btn"
                onClick={() => onDelete(request._id)}
                disabled={loading}
              >
                🗑 Delete Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestDetail;