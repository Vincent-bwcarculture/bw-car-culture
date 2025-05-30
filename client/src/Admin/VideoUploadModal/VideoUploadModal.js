// src/components/admin/VideoUploadModal/VideoUploadModal.js
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../store/slices/uiSlice.js';
import { useAuth } from '../../context/AuthContext.js';
import { X, Upload, Play, Video, CheckCircle, AlertCircle } from 'lucide-react';
import './VideoUploadModal.css';

const DEFAULT_VIDEO_STATE = {
  title: '',
  description: '',
  youtubeUrl: '',
  category: 'car-review',
  subscriptionTier: 'standard',
  thumbnailUrl: '',
  featured: false,
  relatedDealerId: '',
  relatedListingId: '',
  publishDate: new Date().toISOString().split('T')[0],
  status: 'draft'
};

// Utility function to extract YouTube video ID from URL
const extractYouTubeId = (url) => {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
};

// Utility function to get YouTube thumbnail URL from video ID
// Enhanced function to get YouTube thumbnail URL
const getYouTubeThumbnailUrl = (videoId) => {
  if (!videoId) return null;
  
  // Try to use high quality thumbnail
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

const VideoUploadModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null, 
  dealers = [],
  listings = []
}) => {
// Add at the beginning of the VideoUploadModal component
const checkFailedThumbnail = (url) => {
  try {
    const failedThumbnails = JSON.parse(localStorage.getItem('failedVideoThumbnails') || '{}');
    return !!failedThumbnails[url];
  } catch (e) {
    return false;
  }
};

const markFailedThumbnail = (url) => {
  try {
    const failedThumbnails = JSON.parse(localStorage.getItem('failedVideoThumbnails') || '{}');
    failedThumbnails[url] = Date.now();
    
    // Limit cache size
    const keys = Object.keys(failedThumbnails);
    if (keys.length > 100) {
      const oldestKey = keys.sort((a, b) => failedThumbnails[a] - failedThumbnails[b])[0];
      delete failedThumbnails[oldestKey];
    }
    
    localStorage.setItem('failedVideoThumbnails', JSON.stringify(failedThumbnails));
  } catch (e) {
    // Ignore localStorage errors
  }
};

  const dispatch = useDispatch();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState(initialData || DEFAULT_VIDEO_STATE);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [videoIdValid, setVideoIdValid] = useState(false);
  
  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) return;
    
    if (initialData) {
      setFormData(initialData);
      
      // Check if there's a valid YouTube ID and set preview
      const videoId = extractYouTubeId(initialData.youtubeUrl);
      if (videoId) {
        setVideoIdValid(true);
        setPreviewData({
          videoId,
          thumbnailUrl: initialData.thumbnailUrl || getYouTubeThumbnailUrl(videoId)
        });
      }
    } else {
      setFormData(DEFAULT_VIDEO_STATE);
      setPreviewData(null);
      setVideoIdValid(false);
    }
    
    setErrors({});
  }, [isOpen, initialData]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Special handling for YouTube URL
    if (name === 'youtubeUrl') {
      handleYouTubeUrlChange(value);
    }
  };
  
  // Handle YouTube URL changes
 const handleYouTubeUrlChange = (url) => {
  const videoId = extractYouTubeId(url);
  
  if (videoId) {
    setVideoIdValid(true);
    
    // First check if we already have a custom thumbnail from S3
    let thumbnailUrl = '';
    
    // If initialData exists and has a thumbnailUrl, use it
    if (initialData && initialData.thumbnailUrl) {
      if (typeof initialData.thumbnailUrl === 'string') {
        thumbnailUrl = initialData.thumbnailUrl;
      } else if (initialData.thumbnailUrl.url) {
        thumbnailUrl = initialData.thumbnailUrl.url;
      } else if (initialData.thumbnailUrl.key) {
        thumbnailUrl = `/api/images/s3-proxy/${initialData.thumbnailUrl.key}`;
      }
    }
    
    // If we don't have a custom S3 thumbnail, use YouTube's
    if (!thumbnailUrl) {
      thumbnailUrl = getYouTubeThumbnailUrl(videoId);
    }
    
    // Check if this thumbnail has previously failed
    if (checkFailedThumbnail(thumbnailUrl)) {
      console.log(`Using fallback for previously failed thumbnail: ${thumbnailUrl}`);
      thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    
    setPreviewData({
      videoId,
      thumbnailUrl
    });
    
    // Update the form with the thumbnail URL
    setFormData(prev => ({
      ...prev,
      thumbnailUrl
    }));
  } else {
    setVideoIdValid(false);
    setPreviewData(null);
  }
};
  
  // Validate the form before submission
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title || !formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.youtubeUrl || !formData.youtubeUrl.trim()) {
      newErrors.youtubeUrl = 'YouTube URL is required';
    } else if (!videoIdValid) {
      newErrors.youtubeUrl = 'Invalid YouTube URL';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.subscriptionTier) {
      newErrors.subscriptionTier = 'Subscription tier is required';
    }
    
    // Log validation errors for debugging
    if (Object.keys(newErrors).length > 0) {
      console.log('Form validation errors:', newErrors);
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      dispatch(addNotification({
        type: 'error',
        message: 'Please correct the errors in the form'
      }));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create properly structured data object
      const videoData = {
        title: formData.title,
        description: formData.description,
        youtubeUrl: formData.youtubeUrl,
        youtubeVideoId: extractYouTubeId(formData.youtubeUrl), // Ensure ID is extracted
        category: formData.category,
        subscriptionTier: formData.subscriptionTier,
        thumbnailUrl: formData.thumbnailUrl,
        featured: formData.featured,
        publishDate: formData.publishDate,
        status: formData.status
      };
      
      // Only include related IDs if they are provided
      if (formData.relatedDealerId) {
        videoData.relatedDealerId = formData.relatedDealerId;
      }
      
      if (formData.relatedListingId) {
        videoData.relatedListingId = formData.relatedListingId;
      }
      
      // Include author info if user is available
      if (user) {
        videoData.author = user.id;
        videoData.authorName = user.name;
      }
      
      // Console log for debugging
      console.log('Submitting video data:', videoData);
      
      await onSubmit(videoData);
      
      dispatch(addNotification({
        type: 'success',
        message: initialData 
          ? 'Video updated successfully' 
          : 'Video added successfully'
      }));
      
      onClose();
    } catch (error) {
      console.error('Error submitting video:', error);
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to save video'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If modal is closed, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="video-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget && !isSubmitting) onClose();
    }}>
      <div className="video-modal-content">
        <div className="video-modal-header">
          <h2>{initialData ? 'Edit Video' : 'Add YouTube Video'}</h2>
          <button 
            className="video-modal-close" 
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="video-form">
          <div className="video-form-grid">
            <div className="video-form-left">
              <div className="video-form-group">
                <label htmlFor="youtubeUrl">YouTube URL*</label>
                <div className="video-url-input-container">
                  <input
                    type="text"
                    id="youtubeUrl"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleChange}
                    className={`video-form-input ${errors.youtubeUrl ? 'error' : ''}`}
                    placeholder="https://www.youtube.com/watch?v=..."
                    disabled={isSubmitting}
                  />
                  {videoIdValid && (
                    <span className="video-url-valid">
                      <CheckCircle size={18} color="#2ed573" />
                    </span>
                  )}
                </div>
                {errors.youtubeUrl && <span className="video-error-message">{errors.youtubeUrl}</span>}
              </div>
              
              <div className="video-form-group">
                <label htmlFor="title">Video Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`video-form-input ${errors.title ? 'error' : ''}`}
                  placeholder="Enter video title"
                  disabled={isSubmitting}
                />
                {errors.title && <span className="video-error-message">{errors.title}</span>}
              </div>
              
              <div className="video-form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="video-form-input"
                  placeholder="Enter video description"
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="video-form-row">
                <div className="video-form-group">
                  <label htmlFor="category">Category*</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`video-form-input ${errors.category ? 'error' : ''}`}
                    disabled={isSubmitting}
                  >
                    <option value="car-review">Car Review</option>
                    <option value="podcast">Podcast</option>
                    <option value="maintenance">Maintenance & Cost</option>
                    <option value="news">News Update</option>
                    <option value="test-drive">Test Drive</option>
                    <option value="comparison">Comparison</option>
                  </select>
                  {errors.category && <span className="video-error-message">{errors.category}</span>}
                </div>
                
                <div className="video-form-group">
                  <label htmlFor="subscriptionTier">Required Subscription*</label>
                  <select
                    id="subscriptionTier"
                    name="subscriptionTier"
                    value={formData.subscriptionTier}
                    onChange={handleChange}
                    className={`video-form-input ${errors.subscriptionTier ? 'error' : ''}`}
                    disabled={isSubmitting}
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="none">None (Public)</option>
                  </select>
                  {errors.subscriptionTier && <span className="video-error-message">{errors.subscriptionTier}</span>}
                </div>
              </div>
              
              <div className="video-form-row">
                <div className="video-form-group">
                  <label htmlFor="publishDate">Publication Date</label>
                  <input
                    type="date"
                    id="publishDate"
                    name="publishDate"
                    value={formData.publishDate}
                    onChange={handleChange}
                    className="video-form-input"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="video-form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="video-form-input"
                    disabled={isSubmitting}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              
              <div className="video-form-group checkbox-group">
                <label className="video-checkbox-label">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  Feature this video on homepage
                </label>
              </div>
              
              {dealers.length > 0 && (
                <div className="video-form-group">
                  <label htmlFor="relatedDealerId">Related Dealer (Optional)</label>
                  <select
                    id="relatedDealerId"
                    name="relatedDealerId"
                    value={formData.relatedDealerId}
                    onChange={handleChange}
                    className="video-form-input"
                    disabled={isSubmitting}
                  >
                    <option value="">None</option>
                    {dealers.map(dealer => (
                      <option key={dealer._id || dealer.id} value={dealer._id || dealer.id}>
                        {dealer.businessName || dealer.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {listings.length > 0 && (
                <div className="video-form-group">
                  <label htmlFor="relatedListingId">Related Listing (Optional)</label>
                  <select
                    id="relatedListingId"
                    name="relatedListingId"
                    value={formData.relatedListingId}
                    onChange={handleChange}
                    className="video-form-input"
                    disabled={isSubmitting}
                  >
                    <option value="">None</option>
                    {listings.map(listing => (
                      <option key={listing._id || listing.id} value={listing._id || listing.id}>
                        {listing.title || `${listing.specifications?.make} ${listing.specifications?.model}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <div className="video-form-right">
              <div className="video-preview-section">
                <h3>Video Preview</h3>
                
                {previewData ? (
                  <div className="video-preview">
                    <div className="video-thumbnail">
               <img 
  src={previewData.thumbnailUrl} 
  alt="Video thumbnail" 
  onError={(e) => {
    const originalSrc = e.target.src;
    console.log('Thumbnail failed to load:', originalSrc);
    
    // Mark this thumbnail URL as failed
    markFailedThumbnail(originalSrc);
    
    // For S3 URLs, try the proxy endpoint
    if (originalSrc.includes('amazonaws.com')) {
      // Extract key from S3 URL
      const key = originalSrc.split('.amazonaws.com/').pop();
      if (key) {
        // Normalize the key to prevent duplicate segments
        const normalizedKey = key.replace(/images\/images\//g, 'images/');
        e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
        return;
      }
    }
    
    // If high-quality thumbnail fails, try default thumbnail
    if (e.target.src.includes('maxresdefault')) {
      e.target.src = `https://img.youtube.com/vi/${previewData.videoId}/mqdefault.jpg`;
      return;
    }
    
    // If medium quality fails, use lowest quality
    if (e.target.src.includes('mqdefault')) {
      e.target.src = `https://img.youtube.com/vi/${previewData.videoId}/0.jpg`;
      return;
    }
    
    // Final fallback
    e.target.src = '/images/placeholders/video.jpg';
  }}
/>
                      <a 
                        href={`https://www.youtube.com/watch?v=${previewData.videoId}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="video-play-button"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Play size={32} fill="#fff" />
                      </a>
                    </div>
                    <div className="video-info">
                      <div className="video-info-item">
                        <strong>Video ID:</strong> {previewData.videoId}
                      </div>
                      <div className="video-info-item">
                        <strong>YouTube Link:</strong>
                        <a 
                          href={`https://www.youtube.com/watch?v=${previewData.videoId}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Open in YouTube
                        </a>
                      </div>
                      <div className="video-info-item">
                        <strong>Embed Code:</strong>
                        <code>{`<iframe width="560" height="315" src="https://www.youtube.com/embed/${previewData.videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`}</code>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-video-preview">
                    <Video size={48} />
                    <p>Enter a valid YouTube URL to see preview</p>
                  </div>
                )}
              </div>
              
              <div className="video-instructions">
                <h4>Instructions</h4>
                <ul>
                  <li>Paste any valid YouTube URL format (watch, share, embed, etc.)</li>
                  <li>The video will be automatically associated with your account</li>
                  <li>Featured videos will appear in the featured section on the homepage</li>
                  <li>Videos can be associated with dealers or specific listings</li>
                  <li>Select the appropriate subscription tier required to view this video</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="video-form-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="video-btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="video-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? 'Saving...' 
                : initialData 
                  ? 'Update Video' 
                  : 'Add Video'}
            </button>
          </div>
        </form>
        
        {isSubmitting && (
          <div className="video-loading-overlay">
            <div className="video-spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploadModal;