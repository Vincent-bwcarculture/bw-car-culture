// Enhanced FeedbackForm.js with WhatsApp integration
// Replace your existing FeedbackForm.js with this version

import React, { useState, useRef } from 'react';
import { http } from '../../config/axios.js';
import './FeedbackForm.css';

const FeedbackForm = ({ onClose, showWhatsAppOption = true }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedbackType: 'general',
    message: '',
    rating: 5,
    pageContext: {
      url: window.location.href,
      page: window.location.pathname,
      section: 'feedback'
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [submissionMethod, setSubmissionMethod] = useState('form'); // 'form' or 'whatsapp'
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Regular form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill out all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Send form data as JSON
      const response = await http.post('/api/feedback', formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setSuccess(true);
        setSubmissionMethod('form');
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          feedbackType: 'general',
          message: '',
          rating: 5,
          pageContext: {
            url: window.location.href,
            page: window.location.pathname,
            section: 'feedback'
          }
        });
        
        // Auto-close after 3 seconds if onClose is provided
        if (onClose) {
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      } else {
        setError(response.data.message || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.message || 'An error occurred while submitting feedback');
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp sharing functionality
  const handleWhatsAppShare = () => {
    // Validate required fields first
    if (!formData.name.trim() || !formData.message.trim()) {
      setError('Please fill out your name and feedback message before sharing via WhatsApp');
      return;
    }
    
    setShowWhatsAppModal(true);
  };

  const sendWhatsAppFeedback = () => {
    const phoneNumber = '+26774122453'; // Your business WhatsApp number
    
    // Create formatted message
    const whatsappMessage = `🔸 *Feedback from ${formData.name}*

📧 *Email:* ${formData.email || 'Not provided'}
📋 *Type:* ${formData.feedbackType}
⭐ *Rating:* ${formData.rating}/5 stars
📝 *Message:*
${formData.message}

🌐 *From Page:* ${window.location.href}
📅 *Date:* ${new Date().toLocaleDateString()}

Thank you! 🙏`;

    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(whatsappMessage)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Set success state
    setSuccess(true);
    setSubmissionMethod('whatsapp');
    setShowWhatsAppModal(false);
    
    // Reset form after WhatsApp sharing
    setFormData({
      name: '',
      email: '',
      feedbackType: 'general',
      message: '',
      rating: 5,
      pageContext: {
        url: window.location.href,
        page: window.location.pathname,
        section: 'feedback'
      }
    });
    
    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  // Reset to form view
  const resetToForm = () => {
    setSuccess(false);
    setError('');
    setShowWhatsAppModal(false);
  };

  return (
    <div className="feedback-form-container">
      {success ? (
        <div className="feedback-success-message">
          <div className="success-icon">✅</div>
          <h2>Thank You for Your Feedback!</h2>
          {submissionMethod === 'whatsapp' ? (
            <div>
              <p>Your feedback has been shared via WhatsApp. We'll get back to you soon!</p>
              <p className="whatsapp-note">💬 Check your WhatsApp to complete sending the message.</p>
            </div>
          ) : (
            <p>We appreciate you taking the time to share your thoughts with us. Your feedback helps us improve our services.</p>
          )}
          
          <div className="success-actions">
            <button onClick={resetToForm} className="submit-new-feedback-btn">
              Submit Another Feedback
            </button>
            {onClose && (
              <button onClick={onClose} className="close-feedback-btn">
                Close
              </button>
            )}
          </div>
        </div>
      ) : showWhatsAppModal ? (
        <div className="whatsapp-modal">
          <div className="modal-content">
            <h3>Share via WhatsApp</h3>
            <div className="whatsapp-preview">
              <p><strong>Your feedback will be sent to:</strong></p>
              <p className="whatsapp-number">📱 +26774122453</p>
              
              <div className="message-preview">
                <h4>Message Preview:</h4>
                <div className="preview-content">
                  <p>🔸 <strong>Feedback from {formData.name}</strong></p>
                  <p>📧 Email: {formData.email || 'Not provided'}</p>
                  <p>📋 Type: {formData.feedbackType}</p>
                  <p>⭐ Rating: {formData.rating}/5 stars</p>
                  <p>📝 Message: {formData.message}</p>
                </div>
              </div>
            </div>
            
            <div className="whatsapp-actions">
              <button onClick={sendWhatsAppFeedback} className="whatsapp-send-btn">
                📱 Open WhatsApp
              </button>
              <button onClick={() => setShowWhatsAppModal(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="form-header">
            <h2>Share Your Feedback</h2>
            <p className="feedback-intro">
              We value your opinion and would love to hear about your experience with our platform.
              Your feedback helps us improve our services.
            </p>
            {onClose && (
              <button type="button" className="close-button" onClick={onClose}>
                ×
              </button>
            )}
          </div>
          
          {error && <div className="feedback-error-message">{error}</div>}
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Name <span className="required">*</span></label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email <span className="required">*</span></label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="feedbackType">Feedback Type</label>
            <select
              id="feedbackType"
              name="feedbackType"
              value={formData.feedbackType}
              onChange={handleChange}
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="content">Content Feedback</option>
              <option value="design">Design Feedback</option>
              <option value="performance">Performance Issue</option>
              <option value="suggestion">Suggestion</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="rating">How would you rate your experience?</label>
            <div className="rating-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star ${formData.rating >= star ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                >
                  ⭐
                </button>
              ))}
              <span className="rating-text">
                {formData.rating === 1 && 'Poor'}
                {formData.rating === 2 && 'Fair'}
                {formData.rating === 3 && 'Good'}
                {formData.rating === 4 && 'Very Good'}
                {formData.rating === 5 && 'Excellent'}
              </span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="message">Your Feedback <span className="required">*</span></label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Please share your thoughts, suggestions, or any issues you've experienced..."
            />
          </div>
          
          <div className="form-actions">
            <div className="action-buttons">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
              
              {showWhatsAppOption && (
                <button
                  type="button"
                  className="whatsapp-btn"
                  onClick={handleWhatsAppShare}
                  disabled={loading}
                >
                  📱 Share via WhatsApp
                </button>
              )}
            </div>
            
            <p className="form-note">
              Choose your preferred way to share feedback: submit directly through our form or share via WhatsApp for instant communication.
            </p>
          </div>
        </form>
      )}
    </div>
  );
};

export default FeedbackForm;