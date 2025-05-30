// src/components/admin/ReviewModal/components/ImageUpload.js
import React, { useRef } from 'react';

// Helper function to get S3 image URL
const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '/images/placeholders/default.jpg';
  
  // If it's already a full URL (S3), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // For legacy local paths, the server should redirect to S3
  if (!imageUrl.startsWith('/')) {
    imageUrl = `/${imageUrl}`;
  }
  
  return imageUrl;
};

const ImageUpload = ({ 
  featuredImage, 
  gallery = [], 
  onImageUpload, 
  onRemoveImage, 
  onSetFeatured, 
  error,
  disabled = false
}) => {
  const fileInputRef = useRef(null);

  const handleUploadClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onImageUpload(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImageUpload(files);
      // Reset the file input to allow uploading the same file again
      e.target.value = '';
    }
  };

  return (
    <div className="image-upload-section">
      <div
        className={`upload-area ${disabled ? 'disabled' : ''}`}
        onClick={handleUploadClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden-input"
          disabled={disabled}
        />
        
        <div className="upload-placeholder">
          <span className="upload-icon">📸</span>
          <span>Click or drag images here</span>
          <small>Maximum 10 images, 5MB each (JPEG, PNG, or WebP)</small>
        </div>
      </div>

      {error && <span className="error-message">{error}</span>}

      {featuredImage && (
        <div className="featured-image">
          <h4>Featured Image</h4>
          <div className="image-preview featured">
            <img 
              src={featuredImage.preview || getImageUrl(featuredImage.url)} 
              alt="Featured" 
              onError={(e) => {
                console.log('Featured image failed to load:', e.target.src);
                e.target.src = '/images/placeholders/default.jpg';
              }}
            />
            <button
              type="button"
              className="remove-image"
              onClick={() => onRemoveImage(null, 'featured')}
              disabled={disabled}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {gallery && gallery.length > 0 && (
        <div className="gallery-images">
          <h4>Gallery Images ({gallery.length})</h4>
          <div className="image-grid">
            {gallery.map((image, index) => (
              <div key={index} className="image-preview">
                <img 
                  src={image.preview || getImageUrl(image.url)} 
                  alt={`Gallery ${index + 1}`}
                  onError={(e) => {
                    console.log('Gallery image failed to load:', e.target.src);
                    e.target.src = '/images/placeholders/default.jpg';
                  }}
                />
                <div className="image-actions">
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => onRemoveImage(index)}
                    disabled={disabled}
                  >
                    ×
                  </button>
                  {!featuredImage && (
                    <button
                      type="button"
                      className="set-featured"
                      onClick={() => onSetFeatured(index)}
                      disabled={disabled}
                    >
                      Set as Featured
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;