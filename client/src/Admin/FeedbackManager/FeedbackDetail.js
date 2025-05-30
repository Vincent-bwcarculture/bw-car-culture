// src/Admin/FeedbackManager/FeedbackDetail.js
import React, { useState } from 'react';
import './FeedbackDetail.css';

const FeedbackDetail = ({ feedback, onClose, onUpdateStatus, onDelete }) => {
  const [status, setStatus] = useState(feedback.status);
  const [adminNotes, setAdminNotes] = useState(feedback.adminNotes || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Format date nicely
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };
  
  const handleNotesChange = (e) => {
    setAdminNotes(e.target.value);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    await onUpdateStatus(feedback._id, status, adminNotes);
    setIsSaving(false);
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    onDelete(feedback._id);
  };
  
  return (
    <div className="feedback-detail-overlay">
      <div className="feedback-detail-modal">
        <div className="feedback-detail-header">
          <h2>Feedback Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="feedback-detail-content">
          <div className="feedback-detail-main">
            <div className="feedback-meta">
              <div className="feedback-id-date">
                <span className="feedback-id">ID: {feedback._id}</span>
                <span className="feedback-date">Submitted: {formatDate(feedback.createdAt)}</span>
              </div>
              
              <div className="feedback-user-info">
                <div className="feedback-user-field">
                  <span className="field-label">From:</span>
                  <span className="field-value">{feedback.name}</span>
                </div>
                <div className="feedback-user-field">
                  <span className="field-label">Email:</span>
                  <span className="field-value">{feedback.email}</span>
                </div>
                <div className="feedback-user-field">
                  <span className="field-label">Type:</span>
                  <span className="field-value feedback-type">{feedback.feedbackType}</span>
                </div>
                <div className="feedback-user-field">
                  <span className="field-label">Rating:</span>
                  <span className="field-value feedback-rating">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < feedback.rating ? 'star filled' : 'star'}>★</span>
                    ))}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="feedback-message-container">
              <h3>Feedback Message:</h3>
              <div className="feedback-message">
                {feedback.message}
              </div>
            </div>
            
            <div className="feedback-technical-info">
              <h4>Technical Information</h4>
              <div className="technical-details">
                <div className="technical-detail">
                  <span className="detail-label">IP Address:</span>
                  <span className="detail-value">{feedback.ipAddress || 'Not recorded'}</span>
                </div>
                <div className="technical-detail">
                  <span className="detail-label">User Agent:</span>
                  <span className="detail-value user-agent">{feedback.userAgent || 'Not recorded'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="feedback-admin-section">
            <div className="feedback-status-section">
              <h3>Status Management</h3>
              
              {isEditing ? (
                <div className="status-editor">
                  <div className="status-select-group">
                    <label htmlFor="status">Status:</label>
                    <select 
                      id="status" 
                      value={status} 
                      onChange={handleStatusChange}
                      disabled={isSaving}
                    >
                      <option value="new">New</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  
                  <div className="admin-notes-group">
                    <label htmlFor="adminNotes">Admin Notes:</label>
                    <textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={handleNotesChange}
                      rows="5"
                      placeholder="Add your notes about this feedback..."
                      disabled={isSaving}
                    ></textarea>
                  </div>
                  
                  <div className="status-editor-actions">
                    <button 
                      className="cancel-btn" 
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button 
                      className="save-btn" 
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="status-viewer">
                  <div className="current-status">
                    <span className="status-label">Current Status:</span>
                    <span className={`status-badge status-badge-${feedback.status}`}>
                      {feedback.status}
                    </span>
                  </div>
                  
                  {feedback.adminNotes && (
                    <div className="admin-notes-viewer">
                      <h4>Admin Notes:</h4>
                      <div className="admin-notes-content">
                        {feedback.adminNotes}
                      </div>
                    </div>
                  )}
                  
                  <button 
                    className="edit-status-btn" 
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Status & Notes
                  </button>
                </div>
              )}
            </div>
            
            <div className="status-history">
              <h4>Status History</h4>
              {feedback.statusHistory && feedback.statusHistory.length > 0 ? (
                <ul className="history-list">
                  {feedback.statusHistory.map((item, index) => (
                    <li key={index} className="history-item">
                      <span className="history-status">
                        Status changed to <strong>{item.status}</strong>
                      </span>
                      <span className="history-date">
                        {formatDate(item.changedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-history">No status changes recorded yet.</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="feedback-detail-actions">
          <button className="delete-feedback-btn" onClick={handleDelete}>
            Delete Feedback
          </button>
          <button className="close-detail-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDetail;