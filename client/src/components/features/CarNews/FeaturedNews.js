// src/components/features/CarNews/FeaturedNews.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Clock, Eye, MessageCircle, ChevronRight, PlayCircle, ChevronLeft, 
  X, Maximize, Bookmark, BookmarkCheck, Share2, Image, Camera, Youtube 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../../../context/NewsContext.js';
import { 
  formatDate, 
  getAuthorInfo, 
  getStats, 
  hasVideo, 
  hasGallery,
  extractYouTubeId,
  isPremium
} from '../../../utils/newsHelpers.js';
import YouTubePlayer from '../../shared/YouTubePlayer/YouTubePlayer.js';
import './FeaturedNews.css';

const FeaturedNews = ({ compact = false }) => {
  const { 
    selectedNewsItem, 
    loading, 
    error, 
    getRelatedItems,
    isItemSaved,
    toggleSaveItem,
    selectNewsItem
  } = useNews();
  
  const [showVideo, setShowVideo] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [relatedItems, setRelatedItems] = useState([]);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [relatedCarouselIndex, setRelatedCarouselIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const relatedItemsRef = useRef(null);
  const navigate = useNavigate();
  const featuredRef = useRef(null);

  // Helper function to clean HTML content
  const cleanHtmlContent = (content) => {
    if (!content) return '';
    
    // Remove HTML tags
    let cleaned = content.replace(/<[^>]*>?/gm, '');
    
    // Decode HTML entities
    cleaned = cleaned.replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#039;/g, "'")
                    .replace(/&nbsp;/g, ' ');
    
    return cleaned;
  };

  // Helper function to handle S3 image URLs
  const getImageUrl = (imageData) => {
    if (!imageData) return '/images/placeholders/default.jpg';
    
    // If it's already a full URL (S3), return as is
    if (typeof imageData === 'string' && (imageData.startsWith('http://') || imageData.startsWith('https://'))) {
      return imageData;
    }
    
    // If it's an object with URL property
    if (imageData && typeof imageData === 'object' && imageData.url) {
      return imageData.url;
    }
    
    // If it's a legacy local path
    if (typeof imageData === 'string') {
      return imageData;
    }
    
    return '/images/placeholders/default.jpg';
  };

  // Process gallery images for S3
  const processGalleryImages = useCallback((article) => {
    if (!article || !article.gallery || !Array.isArray(article.gallery)) {
      return [];
    }
    
    return article.gallery.map(item => {
      if (typeof item === 'string') {
        return getImageUrl(item);
      }
      if (item && item.url) {
        return getImageUrl(item.url);
      }
      return '/images/placeholders/default.jpg';
    }).filter(Boolean);
  }, []);

  // Get featured image URL
  const getFeaturedImageUrl = useCallback(() => {
    if (!selectedNewsItem) return '/images/placeholders/default.jpg';
    
    // Check for featured image first
    if (selectedNewsItem.featuredImage) {
      return getImageUrl(selectedNewsItem.featuredImage);
    }
    
    // Check images array
    if (selectedNewsItem.images && selectedNewsItem.images.length > 0) {
      if (imageIndex < selectedNewsItem.images.length) {
        return getImageUrl(selectedNewsItem.images[imageIndex]);
      }
      return getImageUrl(selectedNewsItem.images[0]);
    }
    
    // Use gallery images
    if (galleryImages.length > 0) {
      if (imageIndex < galleryImages.length) {
        return galleryImages[imageIndex];
      }
      return galleryImages[0];
    }
    
    return '/images/placeholders/default.jpg';
  }, [selectedNewsItem, imageIndex, galleryImages]);

  // Utility function to detect YouTube videos
  const isYoutubeVideo = (article) => {
    if (!article) return false;
    
    // Check if it has a YouTube URL property
    if (article.youtubeUrl || article.youtubeVideoId) return true;
    
    // Check for a video property that contains YouTube URL
    if (article.video && 
        (article.video.includes('youtube.com') || 
         article.video.includes('youtu.be'))) {
      return true;
    }
    
    // Check content for YouTube links
    if (article.content) {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      return youtubeRegex.test(article.content);
    }
    
    return false;
  };

  // Utility function to get YouTube video URL from article
  const getYouTubeUrl = (article) => {
    if (!article) return null;
    
    // Direct YouTube URL property
    if (article.youtubeUrl) return article.youtubeUrl;
    
    // Video property containing YouTube URL
    if (article.video && 
        (article.video.includes('youtube.com') || 
         article.video.includes('youtu.be'))) {
      return article.video;
    }
    
    // If we have the ID but not the URL, construct it
    if (article.youtubeVideoId) {
      return `https://www.youtube.com/watch?v=${article.youtubeVideoId}`;
    }
    
    // Check content for YouTube links
    if (article.content) {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = article.content.match(youtubeRegex);
      
      if (match && match[1]) {
        return `https://www.youtube.com/watch?v=${match[1]}`;
      }
    }
    
    return null;
  };

  // Handle carousel navigation for related content
  const navigateRelatedCarousel = useCallback((direction) => {
    if (!relatedItemsRef.current || !relatedItems.length) return;
    
    const container = relatedItemsRef.current;
    const items = container.querySelectorAll('.fn-related-item');
    
    if (!items.length) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = Math.min(relatedCarouselIndex + 1, relatedItems.length - 1);
    } else {
      newIndex = Math.max(relatedCarouselIndex - 1, 0);
    }
    
    setRelatedCarouselIndex(newIndex);
    
    // Smooth scroll to the new item
    if (items[newIndex]) {
      items[newIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start'
      });
    }
  }, [relatedCarouselIndex, relatedItems.length]);

  // Reset image index and video state when selected article changes
  useEffect(() => {
    setImageIndex(0);
    setShowVideo(false);
    setImageLoadError(false);
    
    // Process gallery images once when article changes
    if (selectedNewsItem) {
      // Get gallery images with proper S3 URLs
      const images = processGalleryImages(selectedNewsItem);
      setGalleryImages(images);
      
      // Get related content
      setRelatedItems(getRelatedItems(selectedNewsItem, 3));
    }
  }, [selectedNewsItem, getRelatedItems, processGalleryImages]);

  const handleViewArticle = () => {
    if (!selectedNewsItem) return;
    
    // Navigate to the article detail page
    const identifier = selectedNewsItem.slug || selectedNewsItem._id || selectedNewsItem.id;
    navigate(`/news/article/${identifier}`);
  };

  // Format large numbers
  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Determine media type and get source
  const getMediaInfo = () => {
    if (!selectedNewsItem) return { type: 'image', source: null };
    
    // Check if it's a YouTube video
    if (isYoutubeVideo(selectedNewsItem)) {
      let videoUrl = getYouTubeUrl(selectedNewsItem);
      let videoId = selectedNewsItem.youtubeVideoId || extractYouTubeId(videoUrl);
      
      return { 
        type: 'youtube',
        source: videoId,
        url: videoUrl
      };
    }
    
    // Check direct video field for other video types
    if (selectedNewsItem.video && !isYoutubeVideo(selectedNewsItem)) {
      return {
        type: 'video',
        source: selectedNewsItem.video
      };
    }
    
    // Check for video in content
    if (selectedNewsItem.content) {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = selectedNewsItem.content.match(youtubeRegex);
      
      if (match) {
        return {
          type: 'youtube',
          source: match[1],
          url: `https://www.youtube.com/watch?v=${match[1]}`
        };
      }
    }
    
    // Check if it has a gallery
    if (galleryImages.length > 0) {
      return {
        type: 'gallery',
        source: galleryImages
      };
    }
    
    // No video or gallery, treat as single image
    return {
      type: 'image',
      source: getFeaturedImageUrl()
    };
  };

  // Handle video click
  const toggleVideo = (e) => {
    e.stopPropagation();
    setShowVideo(!showVideo);
  };

  // Handle image navigation for galleries
  const handleImageNav = (e, direction) => {
    e.stopPropagation();
    
    if (!selectedNewsItem || galleryImages.length === 0) return;
    
    if (direction === 'next') {
      setImageIndex(prev => (prev + 1) % galleryImages.length);
    } else {
      setImageIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length);
    }
  };
  
  // Open the full-screen lightbox gallery
  const openLightbox = useCallback((e) => {
    e.stopPropagation();
    if (!selectedNewsItem) return;
    
    if (galleryImages.length > 0) {
      setShowLightbox(true);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when lightbox is open
    }
  }, [selectedNewsItem, galleryImages]);

  // Close media overlay (video or expanded gallery)
  const closeOverlay = () => {
    setShowVideo(false);
    setShowLightbox(false);
    setImageGalleryOpen(false);
    document.body.style.overflow = ''; // Restore scrolling
  };
  
  // Toggle the gallery panel for browsing all article images
  const toggleImageGallery = useCallback((e) => {
    if (e) e.stopPropagation();
    
    if (galleryImages.length > 1) {
      setImageGalleryOpen(prev => !prev);
    }
  }, [galleryImages]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!featuredRef.current) return;
    
    if (!isFullscreen) {
      if (featuredRef.current.requestFullscreen) {
        featuredRef.current.requestFullscreen();
      } else if (featuredRef.current.webkitRequestFullscreen) {
        featuredRef.current.webkitRequestFullscreen();
      } else if (featuredRef.current.msRequestFullscreen) {
        featuredRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === featuredRef.current || 
        document.webkitFullscreenElement === featuredRef.current || 
        document.msFullscreenElement === featuredRef.current
      );
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Toggle save/bookmark
  const handleSaveToggle = (e) => {
    e.stopPropagation();
    if (selectedNewsItem) {
      toggleSaveItem(selectedNewsItem);
    }
  };

  // Share content
  const handleShare = (e) => {
    e.stopPropagation();
    setShowShareOptions(!showShareOptions);
  };

  // Share on specific platform
  const shareOn = (platform) => {
    if (!selectedNewsItem) return;
    
    const url = window.location.origin + `/news/article/${selectedNewsItem.id || selectedNewsItem._id || ''}`;
    const title = selectedNewsItem.title || 'Car News';
    const text = selectedNewsItem.description || 'Check out this car news article';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
        break;
      default:
        // Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
          alert('Link copied to clipboard!');
        });
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
    
    setShowShareOptions(false);
  };

  if (loading) {
    return (
      <div className={`fn-featured-news fn-featured-news-loading ${compact ? 'compact' : ''}`}>
        <div className="fn-skeleton-title"></div>
        <div className="fn-skeleton-meta"></div>
        <div className="fn-skeleton-image"></div>
      </div>
    );
  }

  if (error && !selectedNewsItem) {
    return (
      <div className={`fn-featured-news fn-featured-news-error ${compact ? 'compact' : ''}`}>
        <div className="fn-error-message">
          <h3>Unable to load featured content</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Safety check
  if (!selectedNewsItem) return null;

  const mediaInfo = getMediaInfo();
  const isVideo = mediaInfo.type === 'youtube' || mediaInfo.type === 'video';
  const isGallery = mediaInfo.type === 'gallery';
  const isArticlePremium = isPremium(selectedNewsItem);
  const isSaved = isItemSaved(selectedNewsItem);
  const authorInfo = getAuthorInfo(selectedNewsItem);
  const stats = getStats(selectedNewsItem);
  
  return (
    <article 
      ref={featuredRef}
      className={`fn-featured-news ${compact ? 'compact' : ''} ${isArticlePremium ? 'premium-content' : ''} ${isFullscreen ? 'fullscreen-mode' : ''} ${imageGalleryOpen ? 'gallery-open' : ''}`}
    >
      <div className="fn-featured-header">
        {isArticlePremium && <div className="fn-featured-badge fn-premium-badge">Premium</div>}
        {isGallery && galleryImages.length > 1 && (
          <button
            className="fn-gallery-button"
            onClick={toggleImageGallery}
            title="Browse all images"
          >
            <Camera size={16} />
            <span>{galleryImages.length} images</span>
          </button>
        )}
        <h1 className="fn-title">{cleanHtmlContent(selectedNewsItem.title)}</h1>
        <div className="fn-description">
          <div className="fn-author-info">
            <div className="fn-author-avatar">
              <img 
                src={getImageUrl(authorInfo.avatar)} 
                alt={authorInfo.name} 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/BCC Logo.png';
                }}
              />
            </div>
            <div className="fn-author-details">
              <span className="fn-author-name">{authorInfo.name}</span>
              <span className="fn-publish-date">
                <Clock size={14} />
                {formatDate(selectedNewsItem.publishDate || selectedNewsItem.createdAt || selectedNewsItem.date)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="fn-cover-img">
        {showVideo && mediaInfo.type === 'youtube' ? (
          <div className="fn-video-container">
            <YouTubePlayer 
              videoId={mediaInfo.source}
              title={selectedNewsItem.title}
              autoplay={true}
              showControls={true}
              onClose={closeOverlay}
              className="fn-youtube-player"
            />
          </div>
        ) : showVideo && mediaInfo.type === 'video' ? (
          <div className="fn-video-container">
            <div className="fn-close-overlay" onClick={closeOverlay}>
              <X size={24} />
            </div>
            <video 
              controls 
              autoPlay 
              src={mediaInfo.source}
              className="fn-native-video"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <>
            <img 
              src={isGallery && galleryImages.length > imageIndex ? galleryImages[imageIndex] : getFeaturedImageUrl()} 
              alt={selectedNewsItem.title} 
              className="fn-cover-image" 
              onClick={isGallery ? openLightbox : handleViewArticle}
              loading="lazy"
              onError={(e) => {
                console.log('Featured image failed to load:', e.target.src);
                setImageLoadError(true);
                e.target.onerror = null;
                // For S3 URLs, go straight to placeholder
                if (e.target.src.includes('amazonaws.com') || e.target.src.includes('http')) {
                  e.target.src = '/images/placeholders/default.jpg';
                } else {
                  e.target.src = '/images/placeholders/default.jpg';
                }
              }}
            />
            {/* For YouTube videos, use a different play button */}
            {mediaInfo.type === 'youtube' ? (
              <button className="fn-video-play-button youtube" onClick={toggleVideo}>
                <Youtube size={compact ? 24 : 30} color="#ff0000" />
                <PlayCircle size={compact ? 45 : 60} />
              </button>
            ) : isVideo && (
              <button className="fn-video-play-button" onClick={toggleVideo}>
                <PlayCircle size={compact ? 45 : 60} />
              </button>
            )}
            
            {/* Gallery Navigation */}
            {isGallery && galleryImages.length > 1 && (
              <>
                <button 
                  className="fn-gallery-nav prev" 
                  onClick={(e) => handleImageNav(e, 'prev')}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={compact ? 20 : 24} />
                </button>
                <button 
                  className="fn-gallery-nav next" 
                  onClick={(e) => handleImageNav(e, 'next')}
                  aria-label="Next image"
                >
                  <ChevronRight size={compact ? 20 : 24} />
                </button>
                <div className="fn-gallery-indicator">
                  {imageIndex + 1} / {galleryImages.length}
                </div>
                <button 
                  className="fn-fullscreen-button" 
                  onClick={openLightbox}
                  aria-label="View fullscreen"
                >
                  <Maximize size={compact ? 18 : 24} />
                </button>
              </>
            )}
          </>
        )}
        
        <div className="fn-content-overlay">
          <div className="fn-stats">
            <div className="fn-stat-item">
              <Eye />
              <span>{formatNumber(stats.views)} views</span>
            </div>
            <div className="fn-stat-item">
              <MessageCircle />
              <span>{formatNumber(stats.comments)} comments</span>
            </div>
          </div>
          
          <div className="fn-action-buttons">
            <button 
              className={`fn-action-btn ${isSaved ? 'active' : ''}`} 
              onClick={handleSaveToggle}
              title={isSaved ? "Remove from saved" : "Save for later"}
            >
              {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
            </button>
            
            <button 
              className="fn-action-btn" 
              onClick={handleShare}
              title="Share"
            >
              <Share2 size={20} />
            </button>
            
            <button 
              className={`fn-action-btn ${isFullscreen ? 'active' : ''}`} 
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              <Maximize size={20} />
            </button>
            
            <button className="fn-btn" onClick={handleViewArticle}>
              <span>View Article</span>
              <ChevronRight />
            </button>
          </div>
        </div>
        
        {/* Share options popup */}
        {showShareOptions && (
          <div className="fn-share-options">
            <button onClick={() => shareOn('facebook')}>Facebook</button>
            <button onClick={() => shareOn('twitter')}>Twitter</button>
            <button onClick={() => shareOn('whatsapp')}>WhatsApp</button>
            <button onClick={() => shareOn('email')}>Email</button>
            <button onClick={() => shareOn('copy')}>Copy Link</button>
          </div>
        )}
      </div>
      
      {/* Related content section with carousel for mobile */}
      {relatedItems.length > 0 && (
        <div className="fn-related-content">
          <h3>Related Content</h3>
          
          {/* Add carousel navigation controls */}
          {relatedItems.length > 1 && (
            <>
              <button 
                className="fn-carousel-nav prev" 
                onClick={() => navigateRelatedCarousel('prev')}
                disabled={relatedCarouselIndex === 0}
                aria-label="Previous related item"
              >
                <ChevronLeft size={20} />
              </button>
              
              <button 
                className="fn-carousel-nav next" 
                onClick={() => navigateRelatedCarousel('next')}
                disabled={relatedCarouselIndex >= relatedItems.length - 1}
                aria-label="Next related item"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
          
          <div className="fn-related-items" ref={relatedItemsRef}>
            {relatedItems.map((item, index) => (
              <div 
                key={item.id || item._id || index} 
                className="fn-related-item"
                onClick={() => selectNewsItem(item)}
              >
                <div className="fn-related-thumbnail">
                  <img 
                    src={getImageUrl(item.featuredImage || item.images?.[0])} 
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholders/default.jpg';
                    }}
                  />
                </div>
                <div className="fn-related-title">{cleanHtmlContent(item.title)}</div>
              </div>
            ))}
          </div>
          
          {/* Carousel indicators for mobile */}
          {relatedItems.length > 1 && (
            <div className="fn-carousel-indicators">
              {relatedItems.map((_, index) => (
                <button
                  key={index}
                  className={`fn-carousel-dot ${relatedCarouselIndex === index ? 'active' : ''}`}
                  onClick={() => {
                    setRelatedCarouselIndex(index);
                    navigateRelatedCarousel(index > relatedCarouselIndex ? 'next' : 'prev');
                  }}
                  aria-label={`Go to related item ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Image Gallery Panel - Shows all images in the article */}
      {imageGalleryOpen && isGallery && (
        <div className="fn-image-gallery-panel">
          <div className="fn-gallery-panel-header">
            <h3>Image Gallery</h3>
            <button className="fn-close-gallery" onClick={toggleImageGallery}>
              <X size={24} />
            </button>
          </div>
          <div className="fn-gallery-thumbnails">
            {galleryImages.map((image, idx) => (
              <div 
                key={idx} 
                className={`fn-gallery-thumbnail ${imageIndex === idx ? 'active' : ''}`}
                onClick={() => {
                  setImageIndex(idx);
                  toggleImageGallery();
                }}
              >
                <img 
                  src={image} 
                  alt={`Image ${idx + 1}`}
                  loading="lazy"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/placeholders/default.jpg';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Lightbox for Full-screen Image Viewing */}
      {showLightbox && isGallery && (
        <div className="fn-lightbox-overlay" onClick={closeOverlay}>
          <div className="fn-lightbox-container" onClick={e => e.stopPropagation()}>
            <button className="fn-close-lightbox" onClick={closeOverlay}>
              <X size={24} />
            </button>
            
            <div className="fn-lightbox-image-container">
              <img 
                src={galleryImages[imageIndex]} 
                alt={`${selectedNewsItem.title} - Image ${imageIndex + 1}`}
                className="fn-lightbox-image"
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/placeholders/default.jpg';
                }}
              />
            </div>
            
            <div className="fn-lightbox-controls">
              <button 
                className="fn-lightbox-nav prev" 
                onClick={(e) => handleImageNav(e, 'prev')}
                aria-label="Previous image"
              >
                <ChevronLeft size={32} />
              </button>
              
              <div className="fn-lightbox-counter">
                {imageIndex + 1} / {galleryImages.length}
              </div>
              
              <button 
                className="fn-lightbox-nav next" 
                onClick={(e) => handleImageNav(e, 'next')}
                aria-label="Next image"
              >
                <ChevronRight size={32} />
              </button>
            </div>
            
            <div className="fn-lightbox-thumbnails">
              {galleryImages.map((image, idx) => (
                <div 
                  key={idx} 
                  className={`fn-lightbox-thumbnail ${imageIndex === idx ? 'active' : ''}`}
                  onClick={() => setImageIndex(idx)}
                >
                  <img 
                    src={image} 
                    alt={`Thumbnail ${idx + 1}`}
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholders/default.jpg';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default FeaturedNews;