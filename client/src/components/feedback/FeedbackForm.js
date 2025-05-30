// src/components/feedback/FeedbackForm.js
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
  
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        setError(`File type ${file.type} is not supported. Please use images, PDFs, or text files.`);
        return false;
      }
      
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      
      return true;
    });
    
    setAttachments(prev => [...prev, ...validFiles].slice(0, 3)); // Max 3 files
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
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
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (key === 'pageContext') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      });
      
      // Add attachments
      attachments.forEach(file => {
        submitData.append('attachments', file);
      });
      
      const response = await http.post('/api/feedback', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setSuccess(true);
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
        setAttachments([]);
        
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
    setShowWhatsAppModal(true);
  };

  const sendWhatsAppFeedback = () => {
    const phoneNumber = '+26774122453'; // Your business WhatsApp number
    const message = `Hi! I'd like to share feedback about your website:

*Name:* ${formData.name || 'Not provided'}
*Email:* ${formData.email || 'Not provided'}
*Feedback Type:* ${formData.feedbackType}
*Rating:* ${formData.rating}/5 stars
*Message:* 
${formData.message || 'No message provided'}

*Page:* ${window.location.href}

Thank you!`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
    setAttachments([]);
    
    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div className="feedback-form-container">
      {success ? (
        <div className="feedback-success-message">
          <div className="success-icon">✅</div>
          <h2>Thank You for Your Feedback!</h2>
          <p>We appreciate you taking the time to share your thoughts with us. Your feedback helps us improve our services.</p>
          <div className="success-actions">
            <button onClick={() => setSuccess(false)} className="submit-new-feedback-btn">
              Submit Another Feedback
            </button>
            {onClose && (
              <button onClick={onClose} className="close-feedback-btn">
                Close
              </button>
            )}
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
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="form-group rating-group">
            <label>How would you rate your experience?</label>
            <div className="rating-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="rating-option">
                  <input
                    type="radio"
                    id={`star${star}`}
                    name="rating"
                    value={star}
                    checked={Number(formData.rating) === star}
                    onChange={handleChange}
                  />
                  <label htmlFor={`star${star}`} className="star-label">
                    ⭐
                  </label>
                </div>
              ))}
            </div>
            <div className="rating-text">
              {formData.rating === 1 && "Very Poor"}
              {formData.rating === 2 && "Poor"}
              {formData.rating === 3 && "Average"}
              {formData.rating === 4 && "Good"}
              {formData.rating === 5 && "Excellent"}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="message">Your Feedback <span className="required">*</span></label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="5"
              required
              placeholder="Please share your detailed feedback, suggestions, or any issues you've encountered..."
            ></textarea>
          </div>

          {/* File Attachments */}
          {/* <div className="form-group">
            <label>Attachments (Optional)</label>
            <div className="file-upload-section">
              <button
                type="button"
                className="file-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachments.length >= 3}
              >
                📎 Add Files (Max 3, 5MB each)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <p className="file-help-text">
                Supported: Images (JPG, PNG, WebP), PDF, Text files
              </p>
            </div>

            {attachments.length > 0 && (
              <div className="attachments-list">
                {attachments.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <div className="attachment-info">
                      <span className="attachment-name">{file.name}</span>
                      <span className="attachment-size">{formatFileSize(file.size)}</span>
                    </div>
                    <button
                      type="button"
                      className="remove-attachment"
                      onClick={() => removeAttachment(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div> */}
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="submit-feedback-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </button>

            {/* {showWhatsAppOption && (
              <button 
                type="button" 
                className="whatsapp-feedback-btn"
                onClick={handleWhatsAppShare}
                disabled={loading}
              >
                💬 Share via WhatsApp
              </button>
            )} */}
          </div>
        </form>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="modal-overlay">
          <div className="modal-container whatsapp-modal">
            <div className="modal-header">
              <h3>Share Feedback via WhatsApp</h3>
              <button 
                className="modal-close"
                onClick={() => setShowWhatsAppModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <p>Your feedback will be sent to our WhatsApp business account. This allows for faster, more personal communication.</p>
              
              <div className="whatsapp-preview">
                <h4>Preview of your message:</h4>
                <div className="message-preview">
                  <strong>Name:</strong> {formData.name || 'Not provided'}<br/>
                  <strong>Email:</strong> {formData.email || 'Not provided'}<br/>
                  <strong>Type:</strong> {formData.feedbackType}<br/>
                  <strong>Rating:</strong> {formData.rating}/5 stars<br/>
                  <strong>Message:</strong> {formData.message || 'No message provided'}
                </div>
              </div>
              
              <div className="whatsapp-actions">
                <button 
                  className="btn-cancel"
                  onClick={() => setShowWhatsAppModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-whatsapp"
                  onClick={sendWhatsAppFeedback}
                >
                  📱 Open WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackForm;