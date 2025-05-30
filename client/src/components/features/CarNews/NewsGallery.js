// src/components/features/CarNews/NewsGallery.js
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize, Camera } from 'lucide-react';
import './NewsGallery.css';

/**
 * Component for displaying a gallery of news article images
 * Now fully compatible with S3 URLs
 */
const NewsGallery = ({ images = [], onClose, startIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex || 0);
  const [fullscreen, setFullscreen] = useState(false);
  const [imageError, setImageError] = useState({});

  // Process images to ensure they're properly formatted
  // Process images to ensure they're properly formatted with better S3 support
const processedImages = React.useMemo(() => {
  return images.filter(Boolean).map(img => {
    try {
      // If it's already a full URL (S3), return as is
      if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))) {
        // Fix duplicate image paths in S3 URLs
        let cleanUrl = img.includes('/images/images/') ? img.replace(/\/images\/images\//g, '/images/') : img;
        
        // IMPORTANT: Remove /thumbnails/ to get full-size image
        if (cleanUrl.includes('/thumbnails/')) {
          cleanUrl = cleanUrl.replace('/thumbnails/', '/');
        }
        
        return cleanUrl;
      }
      
      // If it's an object with URL property
      if (img && typeof img === 'object' && img.url) {
        let cleanUrl = img.url;
        
        // Fix duplicate image paths
        if (cleanUrl.includes('/images/images/')) {
          cleanUrl = cleanUrl.replace(/\/images\/images\//g, '/images/');
        }
        
        // IMPORTANT: Remove /thumbnails/ to get full-size image
        if (cleanUrl.includes('/thumbnails/')) {
          cleanUrl = cleanUrl.replace('/thumbnails/', '/');
        }
        
        return cleanUrl;
      }
      
      // If it's an object with key property but no URL
      if (img && typeof img === 'object' && img.key && !img.url) {
        return `/api/images/s3-proxy/${img.key}`;
      }
      
      // If it's a legacy local path
      if (typeof img === 'string') {
        let cleanUrl = img.startsWith('/') ? img : `/${img}`;
        
        // Remove thumbnails path
        if (cleanUrl.includes('/thumbnails/')) {
          cleanUrl = cleanUrl.replace('/thumbnails/', '/');
        }
        
        return cleanUrl;
      }
      
      return null;
    } catch (error) {
      console.error('Error processing gallery image:', error);
      return null;
    }
  }).filter(Boolean);
}, [images]);

// Add at the beginning of your component
const checkFailedImage = (url) => {
  try {
    const failedImages = JSON.parse(localStorage.getItem('failedGalleryImages') || '{}');
    return !!failedImages[url];
  } catch (e) {
    return false;
  }
};

const markFailedImage = (url) => {
  try {
    const failedImages = JSON.parse(localStorage.getItem('failedGalleryImages') || '{}');
    failedImages[url] = Date.now();
    // Limit cache size
    const keys = Object.keys(failedImages);
    if (keys.length > 100) {
      const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
      delete failedImages[oldestKey];
    }
    localStorage.setItem('failedGalleryImages', JSON.stringify(failedImages));
  } catch (e) {
    // Ignore localStorage errors
  }
};

  useEffect(() => {
    // Reset error state when images change
    setImageError({});
  }, [images]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? processedImages.length - 1 : prevIndex - 1
    );
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => 
      prevIndex === processedImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const toggleFullscreen = () => {
    if (!fullscreen) {
      const gallery = document.querySelector('.news-gallery-container');
      if (gallery) {
        if (gallery.requestFullscreen) {
          gallery.requestFullscreen();
        } else if (gallery.webkitRequestFullscreen) {
          gallery.webkitRequestFullscreen();
        }
        setFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      setFullscreen(false);
    }
  };

  const handleImageError = (index) => {
    setImageError(prev => ({ ...prev, [index]: true }));
  };

  // If no images, don't render
  if (!processedImages.length) {
    return null;
  }

  return (
    <div className="news-gallery-container">
      <div className="news-gallery-header">
        <div className="news-gallery-title">
          <Camera size={18} />
          <span>Gallery {currentIndex + 1} / {processedImages.length}</span>
        </div>
        <div className="news-gallery-actions">
          <button 
            className="news-gallery-fullscreen" 
            onClick={toggleFullscreen}
            aria-label={fullscreen ? "Exit fullscreen" : "View fullscreen"}
          >
            <Maximize size={20} />
          </button>
          <button 
            className="news-gallery-close" 
            onClick={onClose}
            aria-label="Close gallery"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="news-gallery-main">
        <button 
          className="news-gallery-nav prev" 
          onClick={handlePrev}
          aria-label="Previous image"
          disabled={processedImages.length <= 1}
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="news-gallery-image-container">
          <img 
  src={processedImages[currentIndex]} 
  alt={`Gallery image ${currentIndex + 1}`}
  className="news-gallery-image"
  loading="lazy"
  onError={(e) => {
    const originalSrc = e.target.src;
    console.log('Gallery image failed to load:', originalSrc);
    
    // Mark this image as failed
    markFailedImage(originalSrc);
    
    // For S3 URLs, try the proxy endpoint
    if (originalSrc.includes('amazonaws.com')) {
      // Extract key from S3 URL
      const key = originalSrc.split('.amazonaws.com/').pop();
      if (key) {
        // Normalize the key
        const normalizedKey = key.replace(/images\/images\//g, 'images/');
        e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
        return;
      }
    }
    
    // Try alternative paths
    if (!originalSrc.includes('/images/placeholders/')) {
      const filename = originalSrc.split('/').pop();
      if (filename) {
        // Try direct gallery path
        e.target.src = `/uploads/news/gallery/${filename}`;
        return;
      }
    }
    
    // Final fallback
    e.target.src = '/images/placeholders/default.jpg';
  }}
/>
        </div>
        
        <button 
          className="news-gallery-nav next" 
          onClick={handleNext}
          aria-label="Next image"
          disabled={processedImages.length <= 1}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {processedImages.length > 1 && (
        <div className="news-gallery-thumbnails">
          {processedImages.map((image, index) => (
            <div 
              key={index} 
              className={`gallery-thumbnail ${index === currentIndex ? 'active' : ''} ${imageError[index] ? 'error' : ''}`}
              onClick={() => setCurrentIndex(index)}
            >
              <img 
  src={image} 
  alt={`Thumbnail ${index + 1}`}
  loading="lazy"
  onError={(e) => {
    const originalSrc = e.target.src;
    console.log('Thumbnail image failed to load:', originalSrc);
    
    markFailedImage(originalSrc);
    
    // For S3 URLs, try the proxy endpoint
    if (originalSrc.includes('amazonaws.com')) {
      const key = originalSrc.split('.amazonaws.com/').pop();
      if (key) {
        const normalizedKey = key.replace(/images\/images\//g, 'images/');
        e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
        return;
      }
    }
    
    // Try thumbnail directory
    if (!originalSrc.includes('/images/placeholders/')) {
      const filename = originalSrc.split('/').pop();
      if (filename) {
        e.target.src = `/uploads/news/gallery/thumbnails/${filename}`;
        return;
      }
    }
    
    // Final fallback
    e.target.src = '/images/placeholders/default.jpg';
  }}
/>
            </div>
          ))}
        </div>
      )}

      {/* Keyboard navigation support */}
      <div 
        className="news-gallery-keyboard-nav"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') handlePrev(e);
          if (e.key === 'ArrowRight') handleNext(e);
          if (e.key === 'Escape') onClose();
        }}
      />
    </div>
  );
};

export default NewsGallery;