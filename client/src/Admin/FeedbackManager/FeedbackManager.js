// src/Admin/FeedbackManager/FeedbackManager.js
import React, { useState, useEffect, useCallback } from 'react';
import { http } from '../../config/axios.js';
import { useAuth } from '../../context/AuthContext.js';
import './FeedbackManager.css';

const FeedbackManager = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    newFeedback: 0,
    inProgress: 0,
    completed: 0,
    averageRating: 0
  });

  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: 'all',
    feedbackType: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Fetch feedbacks
  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...filters
      });

      const response = await http.get(`/api/feedback?${queryParams}`);
      
      if (response.data.success) {
        setFeedbacks(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch feedback');
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(err.response?.data?.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters]);

  // Fetch feedback statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await http.get('/api/feedback/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching feedback stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
  }, [fetchFeedbacks, fetchStats]);

  // Update feedback status
  const updateFeedbackStatus = async (feedbackId, newStatus, adminNotes = '') => {
    try {
      const response = await http.put(`/api/feedback/${feedbackId}`, {
        status: newStatus,
        adminNotes
      });

      if (response.data.success) {
        setFeedbacks(prev => 
          prev.map(feedback => 
            feedback._id === feedbackId 
              ? { ...feedback, status: newStatus, adminNotes }
              : feedback
          )
        );
        fetchStats(); // Refresh stats
      }
    } catch (err) {
      console.error('Error updating feedback status:', err);
      alert('Failed to update feedback status');
    }
  };

  // Send admin response
  const sendAdminResponse = async () => {
    if (!selectedFeedback || !responseText.trim()) return;

    try {
      const response = await http.post(`/api/feedback/${selectedFeedback._id}/response`, {
        message: responseText
      });

      if (response.data.success) {
        setFeedbacks(prev => 
          prev.map(feedback => 
            feedback._id === selectedFeedback._id 
              ? { 
                  ...feedback, 
                  adminResponse: {
                    message: responseText,
                    respondedBy: user._id,
                    respondedAt: new Date()
                  }
                }
              : feedback
          )
        );
        
        setShowResponseModal(false);
        setResponseText('');
        setSelectedFeedback(null);
        
        // Also update status to completed if not already
        if (selectedFeedback.status !== 'completed') {
          updateFeedbackStatus(selectedFeedback._id, 'completed');
        }
      }
    } catch (err) {
      console.error('Error sending admin response:', err);
      alert('Failed to send response');
    }
  };

  // Delete feedback
  const deleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const response = await http.delete(`/api/feedback/${feedbackId}`);
      
      if (response.data.success) {
        setFeedbacks(prev => prev.filter(feedback => feedback._id !== feedbackId));
        fetchStats(); // Refresh stats
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      alert('Failed to delete feedback');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'new': return 'status-new';
      case 'in-progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'archived': return 'status-archived';
      default: return 'status-default';
    }
  };

  // Get priority badge class
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'urgent': return 'priority-urgent';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-default';
    }
  };

  // Render rating stars
  const renderRating = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="feedback-manager-loading">
        <div className="loading-spinner"></div>
        <p>Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="feedback-manager">
      {/* Header with Stats */}
      <div className="feedback-header">
        <div className="header-content">
          <h1>Feedback Management</h1>
          <p>Manage customer feedback and support requests</p>
        </div>
        
        <div className="feedback-stats">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Feedback</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.newFeedback || stats.byStatus?.new || 0}</div>
            <div className="stat-label">New</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.inProgress || stats.byStatus?.['in-progress'] || 0}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.averageRating?.toFixed(1) || '0.0'}</div>
            <div className="stat-label">Avg Rating</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="feedback-filters">
        <div className="filter-row">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Type:</label>
            <select 
              value={filters.feedbackType} 
              onChange={(e) => setFilters(prev => ({ ...prev, feedbackType: e.target.value }))}
            >
              <option value="all">All Types</option>
              <option value="general">General</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="content">Content</option>
              <option value="design">Design</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort by:</label>
            <select 
              value={filters.sortBy} 
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
            >
              <option value="createdAt">Date Created</option>
              <option value="rating">Rating</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Order:</label>
            <select 
              value={filters.sortOrder} 
              onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value }))}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchFeedbacks}>Retry</button>
        </div>
      )}

      {/* Feedback List */}
      <div className="feedback-list">
        {feedbacks.length === 0 ? (
          <div className="no-feedback">
            <p>No feedback found matching your criteria.</p>
          </div>
        ) : (
          feedbacks.map(feedback => (
            <div key={feedback._id} className="feedback-item">
              <div className="feedback-header-item">
                <div className="feedback-meta">
                  <h3>{feedback.name}</h3>
                  <span className="feedback-email">{feedback.email}</span>
                  <span className="feedback-date">{formatDate(feedback.createdAt)}</span>
                </div>
                
                <div className="feedback-badges">
                  <span className={`status-badge ${getStatusBadgeClass(feedback.status)}`}>
                    {feedback.status}
                  </span>
                  <span className={`type-badge type-${feedback.feedbackType}`}>
                    {feedback.feedbackType}
                  </span>
                  {feedback.priority && (
                    <span className={`priority-badge ${getPriorityBadgeClass(feedback.priority)}`}>
                      {feedback.priority}
                    </span>
                  )}
                </div>
              </div>

              <div className="feedback-content">
                <div className="feedback-rating">
                  <span className="rating-stars">{renderRating(feedback.rating)}</span>
                  <span className="rating-number">({feedback.rating}/5)</span>
                </div>
                
                <p className="feedback-message">{feedback.message}</p>
                
                {feedback.attachments && feedback.attachments.length > 0 && (
                  <div className="feedback-attachments">
                    <strong>Attachments:</strong>
                    {feedback.attachments.map((attachment, index) => (
                      <a 
                        key={index}
                        href={`/api/feedback/${feedback._id}/attachments/${index}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="attachment-link"
                      >
                        {attachment.filename}
                      </a>
                    ))}
                  </div>
                )}

                {feedback.adminResponse && (
                  <div className="admin-response">
                    <strong>Admin Response:</strong>
                    <p>{feedback.adminResponse.message}</p>
                    <small>
                      Responded on {formatDate(feedback.adminResponse.respondedAt)}
                    </small>
                  </div>
                )}
              </div>

              <div className="feedback-actions">
                <div className="status-actions">
                  {feedback.status === 'new' && (
                    <button 
                      className="action-btn primary"
                      onClick={() => updateFeedbackStatus(feedback._id, 'in-progress')}
                    >
                      Start Working
                    </button>
                  )}
                  
                  {feedback.status === 'in-progress' && (
                    <button 
                      className="action-btn success"
                      onClick={() => updateFeedbackStatus(feedback._id, 'completed')}
                    >
                      Mark Completed
                    </button>
                  )}
                  
                  <button 
                    className="action-btn secondary"
                    onClick={() => {
                      setSelectedFeedback(feedback);
                      setShowResponseModal(true);
                    }}
                  >
                    {feedback.adminResponse ? 'Update Response' : 'Send Response'}
                  </button>
                </div>

                <div className="other-actions">
                  <button 
                    className="action-btn danger"
                    onClick={() => deleteFeedback(feedback._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Admin Response Modal */}
      {showResponseModal && selectedFeedback && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2>Send Response to {selectedFeedback.name}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowResponseModal(false);
                  setResponseText('');
                  setSelectedFeedback(null);
                }}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="original-feedback">
                <h3>Original Feedback:</h3>
                <p><strong>Type:</strong> {selectedFeedback.feedbackType}</p>
                <p><strong>Rating:</strong> {renderRating(selectedFeedback.rating)} ({selectedFeedback.rating}/5)</p>
                <p><strong>Message:</strong> {selectedFeedback.message}</p>
              </div>
              
              <div className="response-form">
                <label htmlFor="response-text">Your Response:</label>
                <textarea
                  id="response-text"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter your response to the customer..."
                  rows="6"
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => {
                  setShowResponseModal(false);
                  setResponseText('');
                  setSelectedFeedback(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-send"
                onClick={sendAdminResponse}
                disabled={!responseText.trim()}
              >
                Send Response
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManager;