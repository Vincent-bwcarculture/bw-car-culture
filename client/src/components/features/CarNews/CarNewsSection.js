// src/components/features/CarNews/CarNewsSection.js
import React, { useState } from 'react';
import { PlayCircle, Image, Bookmark, BookmarkCheck, Clock, RotateCw, PauseCircle, Filter, Video, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNews } from '../../../context/NewsContext.js';
import { formatDate, hasVideo, hasGallery, formatCategoryName, getArticleIdentifier } from '../../../utils/newsHelpers.js';
import './CarNews.css';

const CarNewsSection = () => {
  const { 
    newsItems, 
    selectedNewsItem, 
    selectNewsItem, 
    loading, 
    activeCategory,
    allCategories,
    changeCategory,
    isAutoplayEnabled,
    toggleAutoplay,
    isItemSaved,
    toggleSaveItem,
    isItemViewed
  } = useNews();
  
  const [mediaFilter, setMediaFilter] = useState('all'); // all, video, gallery
  const navigate = useNavigate();

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

  // Helper function to get image URL with S3 support
  const getImageUrl = (item) => {
    if (!item) return '/images/placeholders/default.jpg';
    
    // If item has featuredImage
    if (item.featuredImage) {
      if (typeof item.featuredImage === 'string') {
        // If it's already a full URL (S3), return as is
        if (item.featuredImage.startsWith('http://') || item.featuredImage.startsWith('https://')) {
          return item.featuredImage;
        }
        return item.featuredImage;
      }
      if (item.featuredImage.url) {
        return item.featuredImage.url;
      }
    }
    
    // If item has images array
    if (item.images && item.images.length > 0) {
      const firstImage = item.images[0];
      if (typeof firstImage === 'string') {
        // If it's already a full URL (S3), return as is
        if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
          return firstImage;
        }
        return firstImage;
      }
      if (firstImage.url) {
        return firstImage.url;
      }
    }
    
    // If item has image property
    if (item.image) {
      if (typeof item.image === 'string') {
        // If it's already a full URL (S3), return as is
        if (item.image.startsWith('http://') || item.image.startsWith('https://')) {
          return item.image;
        }
        return item.image;
      }
      if (item.image.url) {
        return item.image.url;
      }
    }
    
    // If item has gallery
    if (item.gallery && item.gallery.length > 0) {
      const firstGalleryItem = item.gallery[0];
      if (typeof firstGalleryItem === 'string') {
        // If it's already a full URL (S3), return as is
        if (firstGalleryItem.startsWith('http://') || firstGalleryItem.startsWith('https://')) {
          return firstGalleryItem;
        }
        return firstGalleryItem;
      }
      if (firstGalleryItem.url) {
        return firstGalleryItem.url;
      }
    }
    
    return '/images/placeholders/default.jpg';
  };

  // Filter news items by media type
  const filterByMediaType = (items) => {
    if (mediaFilter === 'all') return items;
    
    return items.filter(item => {
      if (mediaFilter === 'video') {
        return hasVideo(item);
      } else if (mediaFilter === 'gallery') {
        return hasGallery(item);
      }
      return true;
    });
  };
  
  // Get filtered items
  const getFilteredItems = () => {
    return filterByMediaType(newsItems);
  };

  const handleNewsClick = (item) => {
    // Navigate to the article detail page using ID
    const identifier = item._id || item.id;
    if (identifier) {
      navigate(`/news/article/${identifier}`);
    }
  };

  const handleSaveClick = (e, item) => {
    e.stopPropagation(); // Prevent triggering the parent click
    toggleSaveItem(item);
  };
  
  const handleMediaFilterChange = (type) => {
    setMediaFilter(type);
  };

  if (loading && !newsItems.length) {
    return (
      <section className="car-news-section">
        <div className="news-header">
          <h2>TOP CAR NEWS</h2>
          <div className="news-controls">
            <button className="autoplay-toggle loading">
              <RotateCw size={18} />
              <span>Autoplay</span>
            </button>
          </div>
        </div>
        
        <div className="news-categories-loading"></div>
        
        <div className="news-grid-loading">
          <div className="news-skeleton"></div>
          <div className="news-skeleton"></div>
          <div className="news-skeleton"></div>
          <div className="news-skeleton"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="car-news-section">
      <div className="news-header">
        <h2>TOP CAR NEWS</h2>
        <div className="news-controls">
          <div className="media-filter">
            <button 
              className={`media-filter-button ${mediaFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleMediaFilterChange('all')}
              title="Show all content"
            >
              <Filter size={18} />
              <span>All</span>
            </button>
            <button 
              className={`media-filter-button ${mediaFilter === 'video' ? 'active' : ''}`}
              onClick={() => handleMediaFilterChange('video')}
              title="Show only videos"
            >
              <Video size={18} />
              <span>Videos</span>
            </button>
            <button 
              className={`media-filter-button ${mediaFilter === 'gallery' ? 'active' : ''}`}
              onClick={() => handleMediaFilterChange('gallery')}
              title="Show only galleries"
            >
              <Camera size={18} />
              <span>Galleries</span>
            </button>
          </div>
          <button 
            className={`autoplay-toggle ${isAutoplayEnabled ? 'active' : ''}`}
            onClick={toggleAutoplay}
            title={isAutoplayEnabled ? "Pause Autoplay" : "Enable Autoplay"}
          >
            {isAutoplayEnabled ? (
              <>
                <PauseCircle size={18} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <RotateCw size={18} />
                <span>Autoplay</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Category navigation */}
      <div className="news-categories">
        {allCategories.map(category => (
          <button
            key={category}
            className={`category-button ${activeCategory === category ? 'active' : ''}`}
            onClick={() => changeCategory(category)}
          >
            {formatCategoryName(category)}
          </button>
        ))}
      </div>
      
      {/* Show message when no items match the filter */}
      {getFilteredItems().length === 0 && mediaFilter !== 'all' && (
        <div className="no-media-items">
          <p>No {mediaFilter === 'video' ? 'videos' : 'galleries'} found in this category.</p>
          <button 
            className="reset-filter"
            onClick={() => setMediaFilter('all')}
          >
            Show all content
          </button>
        </div>
      )}
      
      <div className="news-grid">
        {getFilteredItems().map(item => {
          const isViewed = isItemViewed(item);
          const isSaved = isItemSaved(item);
          const isActive = selectedNewsItem && 
                          (selectedNewsItem.id === item.id || selectedNewsItem._id === item._id);
          
          return (
            <article 
              key={item.id || item._id} 
              className={`news-card ${isActive ? 'active' : ''} ${isViewed ? 'viewed' : ''}`}
              onClick={() => handleNewsClick(item)}
            >
              <div className="news-card-image">
                <img 
                  src={getImageUrl(item)} 
                  alt={item.title} 
                  loading="lazy"
                  onError={(e) => {
                    console.log('News card image failed to load:', e.target.src);
                    e.target.onerror = null;
                    // For S3 URLs, go straight to placeholder
                    if (e.target.src.includes('amazonaws.com') || e.target.src.includes('http')) {
                      e.target.src = '/images/placeholders/default.jpg';
                    } else {
                      e.target.src = '/images/placeholders/default.jpg';
                    }
                  }}
                />
                {hasVideo(item) && (
                  <div className="news-media-indicator video">
                    <PlayCircle size={16} />
                  </div>
                )}
                {hasGallery(item) && (
                  <div className="news-media-indicator gallery">
                    <Image size={16} />
                    <span>{item.gallery.length}</span>
                  </div>
                )}
                {item.premium && (
                  <div className="news-premium-badge">
                    Premium
                  </div>
                )}
                {isViewed && (
                  <div className="news-viewed-indicator">
                    <Clock size={14} />
                  </div>
                )}
                <button 
                  className={`news-save-button ${isSaved ? 'saved' : ''}`}
                  onClick={(e) => handleSaveClick(e, item)}
                  title={isSaved ? "Remove from saved" : "Save for later"}
                >
                  {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>
              </div>
              <div className="news-card-content">
                <div>
                  <h3>{cleanHtmlContent(item.title)}</h3>
                  <p className="news-description">{cleanHtmlContent(item.description || item.subtitle || '')}</p>
                </div>
                <div className="news-meta">
                  <div className="author-info">
                    <div className="author-avatar">
                      <img 
                        src={item.author?.avatar ? getImageUrl({ image: item.author.avatar }) : "/images/BCC Logo.png"} 
                        alt={item.author?.name || "Car Culture"} 
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/BCC Logo.png';
                        }}
                      />
                    </div>
                    <span className="author-name">{item.author?.name || "Car Culture News"}</span>
                  </div>
                  <span className="news-date">{formatDate(item.date || item.publishDate || item.createdAt)}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default CarNewsSection;