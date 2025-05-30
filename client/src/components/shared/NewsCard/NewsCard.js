// src/components/shared/NewsCard/NewsCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Tag, MessageCircle, Eye, Bookmark, BookmarkCheck, Share2 } from 'lucide-react';
import './NewsCard.css';

// Create a version of the card that doesn't depend on NewsContext
const NewsCard = ({ article, onSave, onShare, compact = false }) => {
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

  // These will handle the case when we're not inside NewsProvider
  const handleSave = (e) => {
    e.stopPropagation();
    if (onSave) {
      onSave(article);
    }
  };
  
  const handleShare = (e) => {
    e.stopPropagation();
    if (onShare) {
      onShare(article);
    } else {
      // Default share behavior if no handler provided
      if (navigator.share) {
        navigator.share({
          title: article.title,
          text: article.subtitle || article.description || '',
          url: `${window.location.origin}/news/article/${article.slug || article._id || article.id}`
        }).catch(err => console.log('Error sharing:', err));
      } else {
        // Fallback to clipboard
        const url = `${window.location.origin}/news/article/${article.slug || article._id || article.id}`;
        navigator.clipboard.writeText(url)
          .then(() => alert('Link copied to clipboard!'))
          .catch(err => console.error('Could not copy text:', err));
      }
    }
  };

  const handleCardClick = () => {
    // Navigate to the article detail page
    const identifier = article.slug || article._id || article.id;
    navigate(`/news/article/${identifier}`);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Recent';
    }
  };

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

  // Get image with fallback
 const getImageUrl = () => {
  try {
    // Handle featured image (primary case)
    if (article.featuredImage) {
      if (typeof article.featuredImage === 'object') {
        // Handle object format with URL property
        return article.featuredImage.url || 
               article.featuredImage.thumbnail || 
               '/images/placeholders/default.jpg';
      }
      // Handle string format
      return article.featuredImage;
    }
    
    // Other possible image properties
    if (article.image) return article.image;
    
    // Handle images array
    if (article.images && article.images.length > 0) {
      const firstImage = article.images[0];
      if (typeof firstImage === 'object') {
        return firstImage.url || firstImage.thumbnail || '/images/placeholders/default.jpg';
      }
      return firstImage;
    }
    
    // Default fallback
    return '/images/placeholders/default.jpg';
  } catch (error) {
    console.error('Error getting article image URL:', error);
    return '/images/placeholders/default.jpg';
  }
};

  // Get author information with fallback
  const getAuthorInfo = () => {
    return {
      name: article.author?.name || 'Car Culture News Desk',
      role: article.author?.role || 'Editor',
      avatar: article.author?.avatar || "/images/BCC Logo.png"
    };
  };

  // Get view and comment stats with defaults
  const getStats = () => {
    return {
      views: formatNumber(article.stats?.views || article.metadata?.views || 0),
      comments: formatNumber(article.stats?.comments || article.metadata?.comments || 0)
    };
  };

  // Check if article has video content
  const hasVideo = () => {
    return article.hasVideo || article.video || 
           (article.content && (article.content.includes('youtube.com') || article.content.includes('youtu.be')));
  };

  // Check if article has gallery
  const hasGallery = () => {
    return article.gallery && Array.isArray(article.gallery) && article.gallery.length > 1;
  };

  // Get excerpt from content
  const getExcerpt = () => {
    if (article.subtitle) return cleanHtmlContent(article.subtitle);
    if (article.description) return cleanHtmlContent(article.description);
    
    // If we have content, extract first few sentences
    if (article.content) {
      const cleanContent = cleanHtmlContent(article.content);
      // Extract first paragraph
      const text = cleanContent.split('\n\n')[0] || cleanContent;
      
      return text.length > 150 ? text.substring(0, 147) + '...' : text;
    }
    
    return 'Read this article from Car Culture News';
  };

  // Get primary category for badge
  const getPrimaryCategory = () => {
    if (article.category) return article.category;
    if (article.tags && article.tags.length > 0) return article.tags[0];
    return null;
  };

  return (
    <article className={`news-card-article ${compact ? 'compact' : ''}`} onClick={handleCardClick}>
      <div className="news-card-image">
       <img 
  src={getImageUrl()} 
  alt={article.title} 
  onError={(e) => {
    // Log the error for debugging
    console.log(`News image failed to load: ${e.target.src}`);
    
    // For S3 URLs, try to use the proxy endpoint
    if (e.target.src.includes('amazonaws.com')) {
      // Extract key from S3 URL
      const key = e.target.src.split('.amazonaws.com/').pop();
      if (key) {
        // Normalize the key to prevent duplicate segments
        const normalizedKey = key.replace(/images\/images\//g, 'images/');
        e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
        return;
      }
    }
    
    // For relative paths, try direct path if not already a placeholder
    if (!e.target.src.includes('/images/placeholders/')) {
      const filename = e.target.src.split('/').pop();
      if (filename) {
        e.target.src = `/uploads/news/${filename}`;
        return;
      }
    }
    
    // Final fallback
    e.target.src = '/images/placeholders/default.jpg';
  }}
/>
        <div className="news-card-gradient"></div>
        
        {/* Category badge */}
        {getPrimaryCategory() && (
          <div className="news-card-category">
            {getPrimaryCategory()}
          </div>
        )}
        
        {/* Media indicators */}
        {hasVideo() && (
          <div className="news-card-media-badge video">
            Video
          </div>
        )}
        
        {hasGallery() && (
          <div className="news-card-media-badge gallery">
            Gallery ({article.gallery.length})
          </div>
        )}
        
        {/* Save button */}
        <button 
          className="news-card-save-btn"
          onClick={handleSave}
          aria-label="Save article"
        >
          <Bookmark size={18} />
        </button>
      </div>

      <div className="news-card-content">
        <h3 className="news-card-title">{cleanHtmlContent(article.title)}</h3>
        <p className="news-card-excerpt">
          {getExcerpt()}
        </p>
        
        <div className="news-card-footer">
          <div className="news-card-author-info">
            <img 
              src={getAuthorInfo().avatar} 
              alt={getAuthorInfo().name}
              className="news-card-author-avatar"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/BCC Logo.png';
              }}
            />
            <div className="news-card-author-details">
              <span className="news-card-author-name">{getAuthorInfo().name}</span>
              <span className="news-card-author-role">{getAuthorInfo().role}</span>
            </div>
          </div>
          
          <div className="news-card-meta">
            <div className="news-card-stats">
              <span className="news-card-stat">
                <Eye size={14} />
                {getStats().views}
              </span>
              <span className="news-card-stat">
                <MessageCircle size={14} />
                {getStats().comments}
              </span>
              <span className="news-card-date">
                <Clock size={14} />
                {formatDate(article.publishDate || article.createdAt || article.date)}
              </span>
            </div>
            
            <div className="news-card-actions">
              <button 
                className="news-card-action-btn share-btn"
                onClick={handleShare}
                aria-label="Share article"
              >
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;