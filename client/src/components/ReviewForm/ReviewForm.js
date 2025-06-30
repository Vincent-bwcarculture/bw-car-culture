// client/src/components/ReviewForm/ReviewForm.js
import axios from 'axios';
import { http } from '../../config/axios.js';
import React, { useState, useEffect } from 'react';
import { 
  Star, Send, X, User, Shield, AlertCircle, 
  CheckCircle, Clock, MapPin, Phone, Car 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import './ReviewForm.css';

const ReviewForm = ({ 
  serviceData, 
  verificationMethod = 'qr_code', 
  onSubmit, 
  onCancel,
  qrData = null,
  serviceCode = null,
  plateNumber = null 
}) => {
  const { user, isAuthenticated } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serviceExperience, setServiceExperience] = useState({
    serviceQuality: '',
    timeliness: '',
    communication: '',
    valueForMoney: '',
    wouldRecommend: null
  });

  // Character limits
  const MIN_REVIEW_LENGTH = 20;
  const MAX_REVIEW_LENGTH = 500;

  useEffect(() => {
    // Validate service data on component mount
    if (!serviceData) {
      setError('Service information not available');
    }
  }, [serviceData]);

  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating);
    setError(null);
  };

  const handleReviewTextChange = (e) => {
    const text = e.target.value;
    if (text.length <= MAX_REVIEW_LENGTH) {
      setReviewText(text);
      setError(null);
    }
  };

  const handleExperienceChange = (field, value) => {
    setServiceExperience(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!rating) {
      setError('Please select a rating');
      return false;
    }

    if (reviewText.length < MIN_REVIEW_LENGTH) {
      setError(`Review must be at least ${MIN_REVIEW_LENGTH} characters long`);
      return false;
    }

    if (!isAuthenticated) {
      setError('You must be logged in to submit a review');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      let submitData = {
        rating,
        review: reviewText.trim(),
        isAnonymous,
        serviceExperience
      };

      let endpoint = '';
      
      // Determine submission method and endpoint
      switch (verificationMethod) {
        case 'qr_code':
          endpoint = '/reviews/qr-scan';
          submitData.qrData = qrData;
          break;
        case 'service_code':
          endpoint = '/reviews/service-code';
          submitData.serviceCode = serviceCode;
          break;
        case 'plate_number':
          endpoint = '/reviews/plate-number';
          submitData.plateNumber = plateNumber;
          submitData.serviceType = 'public_transport';
          break;
        default:
          throw new Error('Invalid verification method');
      }

      const response = await axios.post(endpoint, submitData);

      if (response.data.success) {
        onSubmit({
          success: true,
          message: response.data.message,
          data: response.data.data
        });
      }

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to submit review';
      setError(errorMessage);
      console.error('Review submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRatingText = (ratingValue) => {
    switch (ratingValue) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select Rating';
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= (hoverRating || rating);
      
      return (
        <button
          key={starValue}
          type="button"
          className={`star-button ${isActive ? 'active' : ''}`}
          onClick={() => handleRatingClick(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          aria-label={`Rate ${starValue} star${starValue !== 1 ? 's' : ''}`}
        >
          <Star size={32} fill={isActive ? '#f1c40f' : 'none'} />
        </button>
      );
    });
  };

  if (!serviceData) {
    return (
      <div className="review-form-container">
        <div className="review-form-error">
          <AlertCircle size={48} />
          <h3>Service Not Found</h3>
          <p>Unable to load service information for review.</p>
          <button className="cancel-button" onClick={onCancel}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="review-form-container">
      <div className="review-form">
        {/* Header */}
        <div className="review-form-header">
          <h2>Rate Your Experience</h2>
          <button className="close-button" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        {/* Service Info */}
        <div className="service-info">
          <div className="service-icon">
            {verificationMethod === 'plate_number' ? <Car size={24} /> : <Shield size={24} />}
          </div>
          <div className="service-details">
            <h3>{serviceData.name || serviceData.serviceName || 'Transport Service'}</h3>
            <p className="service-type">
              {serviceData.type || serviceData.serviceType || 'Public Transport'}
            </p>
            {serviceData.provider && (
              <p className="service-provider">
                <MapPin size={14} />
                {serviceData.provider}
              </p>
            )}
          </div>
          <div className="verification-badge">
            <CheckCircle size={16} />
            <span>Verified Service</span>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="review-form-content">
          
          {/* Rating Section */}
          <div className="rating-section">
            <label className="section-label">Your Rating *</label>
            <div className="stars-container">
              {renderStars()}
            </div>
            <p className="rating-text">{getRatingText(hoverRating || rating)}</p>
          </div>

          {/* Review Text */}
          <div className="review-text-section">
            <label htmlFor="reviewText" className="section-label">
              Tell us about your experience *
            </label>
            <textarea
              id="reviewText"
              value={reviewText}
              onChange={handleReviewTextChange}
              placeholder="Share details about the service quality, staff behavior, timeliness, and overall experience..."
              className="review-textarea"
              rows={5}
            />
            <div className="character-count">
              {reviewText.length}/{MAX_REVIEW_LENGTH} characters
              {reviewText.length < MIN_REVIEW_LENGTH && (
                <span className="min-length-note">
                  (minimum {MIN_REVIEW_LENGTH} characters)
                </span>
              )}
            </div>
          </div>

          {/* Quick Experience Rating */}
          {verificationMethod !== 'plate_number' && (
            <div className="experience-section">
              <label className="section-label">Quick Experience Rating</label>
              <div className="experience-grid">
                <div className="experience-item">
                  <label>Service Quality</label>
                  <select 
                    value={serviceExperience.serviceQuality}
                    onChange={(e) => handleExperienceChange('serviceQuality', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="average">Average</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                
                <div className="experience-item">
                  <label>Timeliness</label>
                  <select 
                    value={serviceExperience.timeliness}
                    onChange={(e) => handleExperienceChange('timeliness', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="very_prompt">Very Prompt</option>
                    <option value="on_time">On Time</option>
                    <option value="slightly_delayed">Slightly Delayed</option>
                    <option value="very_delayed">Very Delayed</option>
                  </select>
                </div>
                
                <div className="experience-item">
                  <label>Communication</label>
                  <select 
                    value={serviceExperience.communication}
                    onChange={(e) => handleExperienceChange('communication', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="average">Average</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                
                <div className="experience-item">
                  <label>Value for Money</label>
                  <select 
                    value={serviceExperience.valueForMoney}
                    onChange={(e) => handleExperienceChange('valueForMoney', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="average">Average</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>
              
              <div className="recommendation-section">
                <label>Would you recommend this service?</label>
                <div className="recommendation-buttons">
                  <button
                    type="button"
                    className={`rec-button ${serviceExperience.wouldRecommend === true ? 'selected positive' : ''}`}
                    onClick={() => handleExperienceChange('wouldRecommend', true)}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`rec-button ${serviceExperience.wouldRecommend === false ? 'selected negative' : ''}`}
                    onClick={() => handleExperienceChange('wouldRecommend', false)}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Options */}
          <div className="privacy-section">
            <label className="privacy-checkbox">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span className="checkmark"></span>
              <div className="privacy-text">
                <span className="privacy-title">Submit anonymously</span>
                <span className="privacy-description">
                  Your name won't be shown with this review
                </span>
              </div>
            </label>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || !rating || reviewText.length < MIN_REVIEW_LENGTH}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Review
                </>
              )}
            </button>
          </div>
        </form>

        {/* Review Guidelines */}
        <div className="review-guidelines">
          <h4>Review Guidelines</h4>
          <ul>
            <li>Be honest and constructive in your feedback</li>
            <li>Focus on your actual experience with the service</li>
            <li>Avoid personal attacks or inappropriate language</li>
            <li>Include specific details to help other customers</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReviewForm;
