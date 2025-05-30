// components/GION/GIONReviewScreen.js
import React, { useState, useEffect } from 'react';
import { AlignLeft, Camera, Clock, Shield, ThumbsUp, MapPin, X } from 'lucide-react';
import './GIONReviewScreen.css';

// Safety Reporting Component
const SafetyReportingSection = ({ onToggle, isVisible, onSubmit }) => {
  const [safetyIssue, setSafetyIssue] = useState('');
  const [safetyType, setSafetyType] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  
  const safetyTypes = [
    'Vehicle Condition',
    'Driver Behavior',
    'Road Safety',
    'Passenger Safety',
    'Regulatory Violation',
    'Other'
  ];
  
  const handleSubmit = () => {
    onSubmit({
      issue: safetyIssue,
      type: safetyType,
      urgent: isUrgent
    });
  };
  
  if (!isVisible) return (
    <div className="safety-reporting-toggle">
      <button 
        className="safety-toggle-button"
        onClick={onToggle}
      >
        <Shield size={16} />
        Report Safety Issue
      </button>
    </div>
  );
  
  return (
    <div className="safety-reporting-section">
      <div className="safety-header">
        <h4>Report Safety Issue</h4>
        <button className="close-safety-button" onClick={onToggle}>
          <X size={16} />
        </button>
      </div>
      
      <div className="safety-types">
        {safetyTypes.map(type => (
          <button
            key={type}
            className={`safety-type-button ${safetyType === type ? 'active' : ''}`}
            onClick={() => setSafetyType(type)}
          >
            {type}
          </button>
        ))}
      </div>
      
      <textarea
        placeholder="Describe the safety issue in detail..."
        value={safetyIssue}
        onChange={(e) => setSafetyIssue(e.target.value)}
        className="safety-issue-input"
      />
      
      <label className="urgent-toggle">
        <input
          type="checkbox"
          checked={isUrgent}
          onChange={() => setIsUrgent(!isUrgent)}
        />
        Mark as Urgent Safety Concern
      </label>
      
      <button
        className="submit-safety-button"
        disabled={!safetyIssue || !safetyType}
        onClick={handleSubmit}
      >
        Submit Safety Report
      </button>
    </div>
  );
};

const GIONReviewScreen = ({ 
  service, 
  serviceId,
  category = 'transport',
  onSubmit, 
  onCancel,
  userPoints = 0
}) => {
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState('');
  const [shareToSocial, setShareToSocial] = useState(false);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [expectedPoints, setExpectedPoints] = useState(50);
  const [showSafetyReport, setShowSafetyReport] = useState(false);
  const [safetyReport, setSafetyReport] = useState(null);
  
  // Calculate expected points based on current review
  useEffect(() => {
    let points = 50; // Base points
    
    if (rating > 0) points += 10;
    if (selectedTags.length > 0) points += 5 * Math.min(selectedTags.length, 3);
    if (comment.length > 0) points += 10;
    if (photoFiles.length > 0) points += 15 * photoFiles.length;
    if (safetyReport) points += 25;
    
    setExpectedPoints(points);
  }, [rating, selectedTags, comment, photoFiles, safetyReport]);
  
  // Get appropriate tags based on service category
  const getCategoryTags = () => {
    switch(category) {
      case 'transport':
      case 'taxi':
        return ['Clean', 'Safe Driver', 'Route Knowledge', 'Vehicle Condition', 'Fair Price', 'Punctual', 'Professional'];
      case 'bus':
        return ['Punctuality', 'Cleanliness', 'Driver Courtesy', 'Comfort', 'Crowding', 'Route Reliability', 'Value'];
      case 'train':
        return ['Punctuality', 'Cleanliness', 'Staff Courtesy', 'Comfort', 'Crowding', 'Facilities', 'Value'];
      case 'dealership':
        return ['Professional', 'Fair Pricing', 'Good Selection', 'Knowledgeable', 'No Pressure', 'Fast Service', 'Transparent'];
      case 'rental':
        return ['Clean Cars', 'Easy Process', 'Fair Pricing', 'Good Condition', 'Helpful Staff', 'Wide Selection', 'Fast Service'];
      case 'workshop':
        return ['Expert Service', 'Fair Pricing', 'Quick Repairs', 'Honest', 'Clean Facility', 'Good Communication', 'Quality Parts'];
      default:
        return ['Good Service', 'Clean', 'Value', 'Professional', 'Recommended', 'Safety', 'Comfort'];
    }
  };
  
  const availableTags = getCategoryTags();
  
  // Create preview URLs for uploaded photos
  useEffect(() => {
    const newPreviewUrls = [];
    
    photoFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      newPreviewUrls.push(url);
    });
    
    setPreviewUrls(newPreviewUrls);
    
    // Clean up URLs on unmount
    return () => {
      newPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [photoFiles]);
  
  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const handleSubmit = () => {
    if (rating === 0) return;
    
    // In a real app, we would upload photos and submit
    // all data to a server here
    onSubmit({
      rating,
      tags: selectedTags,
      comment,
      shareToSocial,
      service,
      serviceId,
      category,
      photos: photoFiles,
      safetyReport,
      timestamp: new Date().toISOString()
    });
  };
  
  const handlePhotoUpload = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Limit to 3 photos
      const newFiles = Array.from(files).slice(0, 3 - photoFiles.length);
      setPhotoFiles([...photoFiles, ...newFiles]);
    }
  };
  
  const handleRemovePhoto = (index) => {
    setPhotoFiles(photoFiles.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };
  
  const handleSafetyReportToggle = () => {
    setShowSafetyReport(!showSafetyReport);
  };
  
  const handleSafetyReportSubmit = (report) => {
    setSafetyReport(report);
    setShowSafetyReport(false);
  };
  
  // Get the appropriate icon for the service category
  const getCategoryIcon = () => {
    switch(category) {
      case 'transport':
      case 'taxi':
        return '🚕';
      case 'bus':
        return '🚌';
      case 'train':
        return '🚆';
      case 'dealership':
        return '🏢';
      case 'rental':
        return '🚗';
      case 'workshop':
        return '🔧';
      default:
        return '🏢';
    }
  };
  
  // Generate category-specific prompt
  const getCategoryPrompt = () => {
    switch(category) {
      case 'transport':
      case 'taxi':
        return "How was your journey?";
      case 'bus':
        return "How was your bus journey?";
      case 'train':
        return "How was your train journey?";
      case 'dealership':
        return "How was your dealership experience?";
      case 'rental':
        return "How was your rental experience?";
      case 'workshop':
        return "How was your service experience?";
      default:
        return "How was your experience?";
    }
  };
  
  return (
    <div className="gion-review-screen">
      {/* Service Info */}
      <div className="service-info">
        <div className="service-icon" style={{
          backgroundColor: 
            category === 'transport' || category === 'taxi' ? '#5f5fc4' :
            category === 'bus' ? '#119847' :
            category === 'train' ? '#2196f3' :
            category === 'dealership' ? '#e74c3c' :
            category === 'rental' ? '#f39c12' :
            category === 'workshop' ? '#3498db' : '#5f5fc4'
        }}>
          {getCategoryIcon()}
        </div>
        <div className="service-details">
          <h4>{service}</h4>
          <p>
            <span className="service-category">
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
            <span className="service-id">#{serviceId}</span>
          </p>
        </div>
      </div>
      
      {/* Rating Stars */}
      <div className="rating-section">
        <p className="rating-prompt">{getCategoryPrompt()}</p>
        <div className={`star-rating ${rating > 0 ? 'rated' : ''}`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button 
              key={star}
              className={`star-button ${rating >= star ? 'active' : ''}`}
              onClick={() => setRating(star)}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            >
              ★
            </button>
          ))}
        </div>
        {rating > 0 && (
          <div className="rating-label">
            {rating === 1 ? 'Poor' : 
             rating === 2 ? 'Fair' : 
             rating === 3 ? 'Good' : 
             rating === 4 ? 'Very Good' : 'Excellent'}
          </div>
        )}
      </div>
      
      {/* Quick Tags */}
      <div className="tags-section">
        <p className="tags-prompt">Select all that apply</p>
        <div className="tags-container">
          {availableTags.map((tag) => (
            <button
              key={tag}
              className={`tag-button ${selectedTags.includes(tag) ? 'active' : ''}`}
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      
      {/* Comment Section */}
      <div className="comment-section">
        <div className="section-header">
          <AlignLeft size={14} />
          <span>Add a comment (optional)</span>
        </div>
        <textarea 
          placeholder="Share your experience..." 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      
      {/* Photo Upload */}
      <div className="photo-section">
        <div className="section-header">
          <Camera size={14} />
          <span>Add photos (optional)</span>
        </div>
        
        {/* Photo previews */}
        {previewUrls.length > 0 && (
          <div className="photo-previews">
            {previewUrls.map((url, index) => (
              <div key={index} className="photo-preview">
                <img src={url} alt={`Review ${index + 1}`} />
                <button 
                  className="remove-photo" 
                  onClick={() => handleRemovePhoto(index)}
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Upload button - only show if less than 3 photos */}
        {photoFiles.length < 3 && (
          <div className="photo-upload-container">
            <input
              type="file"
              id="photo-upload"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="photo-upload" className="photo-upload-button">
              <Camera size={16} />
              <span>Upload Photo {photoFiles.length > 0 ? `(${photoFiles.length}/3)` : ''}</span>
            </label>
          </div>
        )}
      </div>
      
      {/* Safety Reporting Section */}
      {(category === 'transport' || category === 'taxi' || category === 'bus' || category === 'train') && (
        <SafetyReportingSection 
          isVisible={showSafetyReport}
          onToggle={handleSafetyReportToggle}
          onSubmit={handleSafetyReportSubmit}
        />
      )}
      
      {/* Safety Report Confirmation */}
      {safetyReport && (
        <div className="safety-report-confirmation">
          <div className="safety-report-header">
            <Shield size={16} />
            <span>Safety Report Submitted</span>
            {safetyReport.urgent && <span className="urgent-tag">Urgent</span>}
          </div>
          <div className="safety-report-details">
            <span className="safety-type">{safetyReport.type}</span>
            <p className="safety-issue">{safetyReport.issue}</p>
          </div>
        </div>
      )}
      
      {/* Social Share */}
      <div className="social-share">
        <label className="switch-label">
          <span>Share review to social media</span>
          <div className="toggle-switch">
            <input 
              type="checkbox" 
              checked={shareToSocial}
              onChange={() => setShareToSocial(!shareToSocial)}
            />
            <span className="slider"></span>
          </div>
        </label>
      </div>
      
      {/* Submit and Cancel Buttons */}
      <div className="review-actions">
        <button 
          className="cancel-button"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button 
          className={`submit-button ${rating === 0 ? 'disabled' : ''}`}
          disabled={rating === 0}
          onClick={handleSubmit}
        >
          Submit Review
        </button>
      </div>
      
      {/* Points Indicator */}
      <div className="points-indicator">
        <ThumbsUp size={16} />
        Earn {expectedPoints} civic points for your review!
      </div>
      
      {/* Review Benefits Section */}
      <div className="review-benefits">
        <div className="benefit-item">
          <Clock size={16} />
          <span>Reviews processed within 24 hours</span>
        </div>
        <div className="benefit-item">
          <Shield size={16} />
          <span>Help improve {category} services in your community</span>
        </div>
        <div className="benefit-item">
          <MapPin size={16} />
          <span>Your feedback impacts local transportation quality</span>
        </div>
      </div>
    </div>
  );
};

export default GIONReviewScreen;