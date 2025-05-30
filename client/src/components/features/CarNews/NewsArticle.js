// src/components/features/CarNews/NewsArticle.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Share2, Heart, Clock, Calendar, Tag, ChevronLeft, Bookmark, BookmarkCheck, Image, ArrowRight } from 'lucide-react';
import { http } from '../../../config/axios.js';
import { useNews } from '../../../context/NewsContext.js';
import VehicleCard from '../../shared/VehicleCard/VehicleCard.js';
import LoadingScreen from '../../shared/LoadingScreen/LoadingScreen.js';
import NewsGallery from './NewsGallery.js';
import FeaturedNews from './FeaturedNews.js';
import VideoSection from '../VideoSection/VideoSection.js';
import { getNewsImageUrl, getGalleryImageUrls, formatDate, getAuthorInfo } from '../../../utils/newsHelpers.js';
import './NewsArticle.css';

const NewsArticle = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { getRelatedItems, isItemSaved, toggleSaveItem, isItemViewed } = useNews();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [relatedVehicles, setRelatedVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('articles');
  const [galleryImages, setGalleryImages] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);
  const [moreNewsItems, setMoreNewsItems] = useState([]);
  const [featuredVehicles, setFeaturedVehicles] = useState([]);
  const [isFeaturedVehiclesLoading, setIsFeaturedVehiclesLoading] = useState(false);
  
  // Refs to prevent reprocessing
  const galleryProcessedRef = useRef(false);
  const articleFetchedRef = useRef(false);
  const initialFetchCompleteRef = useRef(false);

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

  // Helper function to parse content
  const parseArticleContent = (content) => {
    if (!content) return '';
    
    // If content is a JSON string
    if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
      try {
        const parsed = JSON.parse(content);
        // If it's an object with blocks or similar structure
        if (parsed.blocks) {
          return parsed.blocks.map(block => block.text || '').join('\n\n');
        }
        // If it's a simple object with content
        if (parsed.content) {
          return cleanHtmlContent(parsed.content);
        }
        // Otherwise try to extract text from the object
        return Object.values(parsed).join('\n\n');
      } catch (e) {
        // If JSON parsing fails, treat it as regular content
        return cleanHtmlContent(content);
      }
    }
    
    // If it's already a string, just clean it
    return cleanHtmlContent(content);
  };

  // Helper function to handle S3 image URLs
  const handleImageUrl = (imageData) => {
    if (!imageData) return '/images/placeholders/default.jpg';
    
    // If it's already a full URL (S3), return as is
    if (typeof imageData === 'string' && (imageData.startsWith('http://') || imageData.startsWith('https://'))) {
      return imageData;
    }
    
    // If it's an object with URL property
    if (imageData.url) {
      return imageData.url;
    }
    
    // If it's a legacy local path
    if (typeof imageData === 'string') {
      // Server should redirect these to S3
      return imageData.startsWith('/') ? imageData : `/${imageData}`;
    }
    
    return '/images/placeholders/default.jpg';
  };

  // Process gallery images to handle S3 URLs
  const processGalleryImages = (gallery) => {
    if (!gallery || !Array.isArray(gallery)) return [];
    
    return gallery.map(item => {
      if (typeof item === 'string') {
        return handleImageUrl(item);
      }
      if (item.url) {
        return handleImageUrl(item.url);
      }
      return '/images/placeholders/default.jpg';
    }).filter(Boolean);
  };

  // Fetch featured vehicles from premium dealers
  const fetchFeaturedVehicles = useCallback(async (make, model) => {
    setIsFeaturedVehiclesLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (make) {
        queryParams.append('make', make);
      }
      
      if (model) {
        queryParams.append('model', model);
      }
      
      queryParams.append('dealerTier', 'premium,standard');
      queryParams.append('limit', '6');
      queryParams.append('sort', '-createdAt');
      
      const response = await http.get(`/marketplace?${queryParams.toString()}`);
      
      if (response.data?.data) {
        setFeaturedVehicles(response.data.data);
      }
    } catch (error) {
      console.warn('Error fetching featured vehicles:', error);
    } finally {
      setIsFeaturedVehiclesLoading(false);
    }
  }, []);

  // Fetch the article data and related content
  useEffect(() => {
    // Skip if we already fetched this article
    if (articleFetchedRef.current && articleId === articleFetchedRef.current) {
      return;
    }
    
    const fetchArticleAndRelated = async () => {
      try {
        console.log(`Fetching article: ${articleId}`);
        setIsLoading(true);
        setError(null);
        
        // Clear previous article data
        setArticle(null);
        setGalleryImages([]);
        galleryProcessedRef.current = false;
        
        // Try to fetch the article - backend will handle both ID and slug
        const response = await http.get(`/news/${articleId}`);
        
        if (response.data?.data) {
          // Store article ID to prevent duplicate fetches
          articleFetchedRef.current = articleId;
          
          const fetchedArticle = response.data.data;
          
          // Parse and clean the content
          const cleanedContent = parseArticleContent(fetchedArticle.content);
          fetchedArticle.parsedContent = cleanedContent;
          
          setArticle(fetchedArticle);
          
          // Process gallery images for S3 URLs
          if (fetchedArticle.gallery && Array.isArray(fetchedArticle.gallery)) {
            console.log('Processing gallery for articleId:', articleId);
            galleryProcessedRef.current = true;
            
            const processedGalleryUrls = processGalleryImages(fetchedArticle.gallery);
            setGalleryImages(processedGalleryUrls);
          }
          
          // Get article tags and categories for finding related content
          const tags = fetchedArticle.tags || [];
          const category = fetchedArticle.category;
          const make = extractCarMake(fetchedArticle);
          
          // Use the getRelatedItems from your context to get related articles
          const related = getRelatedItems(fetchedArticle, 3);
          setRelatedArticles(related);
          
          // Fetch related vehicles based on car make/model mentioned in the article
          if (make && !initialFetchCompleteRef.current) {
            try {
              const vehiclesResponse = await http.get(`/marketplace?make=${make}&limit=3`);
              if (vehiclesResponse.data?.data) {
                setRelatedVehicles(vehiclesResponse.data.data);
              }
            } catch (err) {
              console.warn('Error fetching related vehicles:', err);
              setRelatedVehicles([]);
            }
            
            // Fetch featured vehicles from premium/standard dealers
            const model = extractCarModel(fetchedArticle);
            fetchFeaturedVehicles(make, model);
          }

          // Also fetch more news articles for the bottom section
          fetchMoreNews(fetchedArticle);
          
          initialFetchCompleteRef.current = true;
        } else {
          setError('Article not found');
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        // More detailed error logging
        if (error.response?.status === 404) {
          setError('Article not found. It may have been removed or the link is incorrect.');
        } else {
          setError('Failed to load article. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchArticleAndRelated();
    
    // Reset processing flags when article ID changes
    return () => {
      if (articleId !== articleFetchedRef.current) {
        galleryProcessedRef.current = false;
        initialFetchCompleteRef.current = false;
      }
    };
  }, [articleId, getRelatedItems, fetchFeaturedVehicles]);

  // Fetch more news articles for bottom section
  const fetchMoreNews = useCallback(async (currentArticle) => {
    try {
      const category = currentArticle?.category || 'news';
      const response = await http.get(`/news/category/${category}?limit=4`);
      
      if (response.data?.data) {
        // Filter out the current article if it's in the list
        const filteredNews = response.data.data.filter(
          item => item._id !== articleId && item.id !== articleId
        );
        
        // Take only up to 3 items
        setMoreNewsItems(filteredNews.slice(0, 3));
      }
    } catch (error) {
      console.warn('Could not fetch more news articles:', error);
    }
  }, [articleId]);

  // Extract car make from article content if available
  const extractCarMake = useCallback((article) => {
    if (!article) return null;
    
    // First check if article has explicit make/model metadata
    if (article.metadata?.carMake) {
      return article.metadata.carMake;
    }
    
    // Check title for common car makes
    const commonMakes = [
      'BMW', 'Mercedes', 'Audi', 'Toyota', 'Honda', 'Ford', 'Chevrolet', 
      'Nissan', 'Hyundai', 'Kia', 'Volkswagen', 'Porsche', 'Ferrari', 'Lamborghini', 'Tesla'
    ];
    
    const title = article.title || '';
    
    // Look for car makes in the title
    for (const make of commonMakes) {
      if (title.includes(make)) {
        return make;
      }
    }
    
    // If we have tags, check if any match common car makes
    if (article.tags && Array.isArray(article.tags)) {
      for (const tag of article.tags) {
        if (commonMakes.includes(tag)) {
          return tag;
        }
      }
    }
    
    // Fallback to category if it matches a car make
    if (commonMakes.includes(article.category)) {
      return article.category;
    }
    
    return null;
  }, []);
  
  // Extract car model from article content
  const extractCarModel = useCallback((article) => {
    if (!article) return null;
    
    // First check if article has explicit model metadata
    if (article.metadata?.carModel) {
      return article.metadata.carModel;
    }
    
    // Common models for popular makes
    const commonModels = [
      // BMW models
      '3 Series', '5 Series', '7 Series', 'X3', 'X5', 'M3', 'M5',
      // Mercedes models
      'C-Class', 'E-Class', 'S-Class', 'GLE', 'GLC', 'AMG',
      // Audi models
      'A3', 'A4', 'A6', 'Q5', 'Q7', 'TT', 'R8',
      // Toyota models
      'Corolla', 'Camry', 'RAV4', 'Highlander', 'Prius',
      // Honda models
      'Civic', 'Accord', 'CR-V', 'Pilot', 'Jazz',
      // General models that might be mentioned
      'SUV', 'Sedan', 'Hatchback', 'Coupe', 'Convertible'
    ];
    
    const title = article.title || '';
    const content = article.parsedContent || '';
    
    // Look for model mentions in title or content
    for (const model of commonModels) {
      if (title.includes(model) || content.includes(model)) {
        return model;
      }
    }
    
    // Check tags for model mentions
    if (article.tags && Array.isArray(article.tags)) {
      for (const tag of article.tags) {
        if (commonModels.includes(tag)) {
          return tag;
        }
      }
    }
    
    return null;
  }, []);

  // Function to handle sharing the article
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.subtitle || article.description || '',
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Could not copy text:', err));
    }
  }, [article]);

  // Function to handle liking an article
  const handleLike = useCallback(async () => {
    // Toggle like state immediately for responsive UI
    setLiked(prev => !prev);
    
    // In a real app, you'd have an API call here
    try {
      // await http.post(`/news/${articleId}/like`);
      console.log('Article like toggled');
    } catch (error) {
      // Revert the state if API call fails
      setLiked(prevLiked => !prevLiked);
      console.error('Error toggling like:', error);
    }
  }, [articleId]);

  // Function to handle saving/bookmarking an article
  const handleSave = useCallback(() => {
    if (article) {
      toggleSaveItem(article);
    }
  }, [article, toggleSaveItem]);

  // Navigate to a specific category page
  const navigateToCategory = useCallback((category) => {
    if (!category) return;
    navigate(`/news/category/${category.toLowerCase()}`);
  }, [navigate]);
  
  // Handle gallery image click
  const openGallery = useCallback((index) => {
    setSelectedGalleryIndex(index);
    setShowGallery(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }, []);
  
  // Handle gallery close
  const closeGallery = useCallback(() => {
    setShowGallery(false);
    document.body.style.overflow = ''; // Restore scrolling
  }, []);

  // Enhanced image url getter for S3
// Enhanced image URL function - keeping the original name for compatibility
// FIXED VERSION - Never uses thumbnails for gallery display
const getImageUrl = (imageData, type = 'article') => {
  try {
    if (!imageData) {
      return `/images/placeholders/${type === 'article' ? 'default' : type}.jpg`;
    }
    
    let imageUrl = '';
    
    // If imageData is a string, use it directly
    if (typeof imageData === 'string') {
      imageUrl = imageData;
    } 
    // If imageData is an object with url property
    else if (imageData && typeof imageData === 'object') {
      // FIXED: Only use full URL, never thumbnails for gallery
      if (type === 'gallery') {
        imageUrl = imageData.url || ''; // Only use full-size for gallery
      } else {
        imageUrl = imageData.url || imageData.thumbnail || ''; // Thumbnails OK for other types
      }
      
      // If we have an S3 key but no URL, create proxy URL
      if (!imageUrl && imageData.key) {
        return `/api/images/s3-proxy/${imageData.key}`;
      }
    }
    
    // If no URL found, return placeholder
    if (!imageUrl) {
      return `/images/placeholders/${type === 'article' ? 'default' : type}.jpg`;
    }
    
    // Fix problematic S3 URLs with duplicate paths
    if (imageUrl.includes('/images/images/')) {
      imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
    }
    
    // Remove /thumbnails/ from path to ensure we get full image
    if (type === 'gallery' && imageUrl.includes('/thumbnails/')) {
      imageUrl = imageUrl.replace('/thumbnails/', '/');
    }
    
    // Check for cached failed images
    if (checkFailedImage(imageUrl)) {
      console.log(`Using cached fallback for previously failed image: ${imageUrl}`);
      return `/images/placeholders/${type === 'article' ? 'default' : type}.jpg`;
    }
    
    // If it's already a full URL (like S3), return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Ensure local paths start with /
    if (!imageUrl.startsWith('/')) {
      imageUrl = `/${imageUrl}`;
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return `/images/placeholders/${type === 'article' ? 'default' : type}.jpg`;
  }
};

// Add these functions near the beginning of your component
const checkFailedImage = (url) => {
  try {
    const failedImages = JSON.parse(localStorage.getItem('failedNewsImages') || '{}');
    return !!failedImages[url];
  } catch (e) {
    return false;
  }
};

const markFailedImage = (url) => {
  try {
    const failedImages = JSON.parse(localStorage.getItem('failedNewsImages') || '{}');
    failedImages[url] = Date.now();
    // Limit cache size to prevent localStorage bloat
    const keys = Object.keys(failedImages);
    if (keys.length > 100) {
      const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
      delete failedImages[oldestKey];
    }
    localStorage.setItem('failedNewsImages', JSON.stringify(failedImages));
  } catch (e) {
    // Ignore localStorage errors
  }
};

  // Render function for article content - NEW
  const renderArticleContent = () => {
    if (!article || !article.parsedContent) return null;

    const paragraphs = article.parsedContent.split('\n\n').filter(p => p.trim());
    
    return paragraphs.map((paragraph, index) => {
      // Check if paragraph is a subheading
      if (paragraph.length < 100 && !paragraph.includes('.') && index > 0) {
        return <h3 key={index}>{paragraph}</h3>;
      }
      
      // Regular paragraph
      return <p key={index}>{paragraph}</p>;
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (error || !article) {
    return (
      <div className="cc-news-article-page">
        <div className="cc-news-article-not-found">
          <h2>{error || 'Article Not Found'}</h2>
          <p>The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/news" className="cc-news-back-link">Return to News</Link>
        </div>
      </div>
    );
  }

  const authorInfo = getAuthorInfo(article);

  return (
    <div className="cc-news-article-page">
      {/* Full-screen gallery view */}
      {showGallery && (
        <NewsGallery 
          images={galleryImages} 
          onClose={closeGallery} 
          startIndex={selectedGalleryIndex}
        />
      )}

      <div className="cc-news-article-grid">
        <article className="cc-news-article-main">
          <nav className="cc-news-breadcrumb">
            <Link to="/news" className="cc-news-breadcrumb-link">
              <ChevronLeft size={16} />
              Back to News
            </Link>
            {article.category && (
              <button 
                className="cc-news-category-pill"
                onClick={() => navigateToCategory(article.category)}
              >
                {article.category}
              </button>
            )}
          </nav>

          <header className="cc-news-article-header">
            <h1>{cleanHtmlContent(article.title)}</h1>
            {article.subtitle && <h2>{cleanHtmlContent(article.subtitle)}</h2>}

            <div className="cc-news-article-meta">
              <div className="cc-news-author-info">
             <img 
  src={getImageUrl(authorInfo.avatar, 'avatar')} 
  alt={authorInfo.name} 
  className="cc-news-author-avatar"
  onError={(e) => {
    markFailedImage(e.target.src);
    e.target.onerror = null;
    e.target.src = "/images/BCC Logo.png";
  }}
/>
                <div className="cc-news-author-details">
                  <span className="cc-news-author-name">{authorInfo.name}</span>
                  {authorInfo.role && <span className="cc-news-author-role">{authorInfo.role}</span>}
                </div>
              </div>

              <div className="cc-news-article-stats">
                <span className="cc-news-stat-item">
                  <Calendar size={16} />
                  {formatDate(article.publishDate || article.createdAt || article.date)}
                </span>
                {article.metadata?.readTime && (
                  <span className="cc-news-stat-item">
                    <Clock size={16} />
                    {article.metadata.readTime} min read
                  </span>
                )}
                {article.metadata?.views && (
                  <span className="cc-news-stat-item">
                    <span role="img" aria-label="views">👁️</span> {article.metadata.views} views
                  </span>
                )}
              </div>

              <div className="cc-news-article-actions">
                <button 
                  className={`cc-news-action-button ${liked ? 'liked' : ''}`}
                  onClick={handleLike}
                  aria-label={liked ? "Unlike article" : "Like article"}
                >
                  <Heart size={20} />
                  <span>{liked ? 'Liked' : 'Like'}</span>
                </button>
                <button 
                  className={`cc-news-action-button ${isItemSaved(article) ? 'saved' : ''}`}
                  onClick={handleSave}
                  aria-label={isItemSaved(article) ? "Unsave article" : "Save article"}
                >
                  {isItemSaved(article) ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                  <span>{isItemSaved(article) ? 'Saved' : 'Save'}</span>
                </button>
                <button 
                  className="cc-news-action-button"
                  onClick={handleShare}
                  aria-label="Share article"
                >
                  <Share2 size={20} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </header>

          <div className="cc-news-article-cover">
          <img 
  src={getImageUrl(article.featuredImage || article.images?.[0])} 
  alt={article.title} 
  onError={(e) => {
    const originalSrc = e.target.src;
    console.log('Article cover image failed to load:', originalSrc);
    
    // Mark this image as failed
    markFailedImage(originalSrc);
    
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
    
    // For local paths, try direct news path if not already a placeholder
    if (!originalSrc.includes('/images/placeholders/')) {
      const filename = originalSrc.split('/').pop();
      if (filename && !originalSrc.includes('/uploads/news/')) {
        e.target.src = `/uploads/news/${filename}`;
        return;
      }
    }
    
    // Final fallback
    e.target.src = '/images/placeholders/default.jpg';
  }}
/>
            {article.featuredImage?.caption && (
              <div className="cc-news-image-caption">
                {article.featuredImage.caption}
                {article.featuredImage.credit && (
                  <span className="cc-news-image-credit"> - {article.featuredImage.credit}</span>
                )}
              </div>
            )}
          </div>

          <div className="cc-news-article-content">
            {renderArticleContent()}
          </div>

          {/* Gallery section */}
      
{galleryImages.map((imageUrl, index) => (
  <div 
    key={index} 
    className="cc-news-gallery-item"
    onClick={() => openGallery(index)}
  >
    <img 
      src={getImageUrl(imageUrl, 'gallery')}
      alt={`Gallery image ${index + 1}`}
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
            const normalizedKey = key.replace(/images\/images\//g, 'images/');
            e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
            return;
          }
        }
        
        // Try other paths
        if (!originalSrc.includes('/images/placeholders/')) {
          const filename = originalSrc.split('/').pop();
          if (filename) {
            e.target.src = `/uploads/news/gallery/${filename}`;
            return;
          }
        }
        
        // Final fallback
        e.target.src = '/images/placeholders/default.jpg';
      }}
    />
    {article.gallery[index]?.caption && (
      <div className="cc-news-gallery-caption">{article.gallery[index].caption}</div>
    )}
  </div>
))}

          <footer className="cc-news-article-footer">
            <div className="cc-news-article-tags">
              {Array.isArray(article.tags) && article.tags.map(tag => (
                <Link key={tag} to={`/news/tag/${tag.toLowerCase()}`} className="cc-news-tag">
                  <Tag size={14} />
                  {tag}
                </Link>
              ))}
              {article.category && !article.tags?.includes(article.category) && (
                <Link to={`/news/category/${article.category.toLowerCase()}`} className="cc-news-tag">
                  <Tag size={14} />
                  {article.category}
                </Link>
              )}
            </div>
          </footer>
          
          {/* More car news section - stays within the main column */}
          {moreNewsItems.length > 0 && (
            <div className="cc-news-more-articles">
              <div className="cc-news-more-header">
                <h3>More Car News</h3>
                <Link to="/news" className="cc-news-more-link">
                  View All <ArrowRight size={16} />
                </Link>
              </div>
              
              <div className="cc-news-more-grid">
                {moreNewsItems.map(newsItem => (
                  <Link 
                    key={newsItem._id || newsItem.id} 
                    to={`/news/article/${newsItem._id || newsItem.id}`}
                    className="cc-news-more-item"
                  >
                    <div className="cc-news-more-image">
                      <img 
                        src={getImageUrl(newsItem.featuredImage || newsItem.images?.[0])} 
                        alt={newsItem.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/placeholders/default.jpg';
                        }}
                      />
                      {newsItem.premium && (
                        <span className="cc-news-premium-badge">Premium</span>
                      )}
                    </div>
                    <div className="cc-news-more-content">
                      <h4>{cleanHtmlContent(newsItem.title)}</h4>
                      <div className="cc-news-more-meta">
                        <span className="cc-news-more-date">
                          <Calendar size={14} />
                          {formatDate(newsItem.publishDate || newsItem.createdAt || '')}
                        </span>
                        {newsItem.category && (
                          <span className="cc-news-more-category">
                            {newsItem.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        <aside className="cc-news-article-sidebar">
          <div className="cc-news-sidebar-tabs">
            <button 
              className={`cc-news-tab-button ${activeTab === 'articles' ? 'active' : ''}`}
              onClick={() => setActiveTab('articles')}
            >
              Related Articles
            </button>
            <button 
              className={`cc-news-tab-button ${activeTab === 'vehicles' ? 'active' : ''}`}
              onClick={() => setActiveTab('vehicles')}
            >
              Related Vehicles
            </button>
          </div>

          {activeTab === 'articles' && (
            <div className="cc-news-related-articles">
              {relatedArticles && relatedArticles.length > 0 ? (
                relatedArticles.map(related => (
                  <Link 
                    key={related._id || related.id} 
                    to={`/news/article/${related._id || related.id}`} 
                    className="cc-news-related-article"
                  >
                    <img 
                      src={getImageUrl(related.featuredImage || related.images?.[0])} 
                      alt={related.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/placeholders/default.jpg';
                      }}
                    />
                    <h4>{cleanHtmlContent(related.title)}</h4>
                    <span className="cc-news-related-article-date">
                      {formatDate(related.publishDate || related.createdAt || related.date || '')}
                    </span>
                  </Link>
                ))
              ) : (
                <div className="cc-news-no-related">
                  <p>No related articles found</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="cc-news-related-vehicles">
              {relatedVehicles && relatedVehicles.length > 0 ? (
                <div className="cc-news-vehicle-card-container">
                  {relatedVehicles.map(vehicle => (
                    <div key={vehicle._id || vehicle.id} className="cc-news-vehicle-card-wrapper">
                      <VehicleCard 
                        car={vehicle} 
                        compact={true} 
                        onShare={() => {}} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="cc-news-no-related">
                  <p>No related vehicles found</p>
                  <Link to="/marketplace" className="cc-news-browse-more-link">
                    Browse All Vehicles
                  </Link>
                </div>
              )}
            </div>
          )}
          
          <div className="cc-news-ad-banner">
            <div className="cc-news-ad-content">
              <h3>Interested in a new car?</h3>
              <p>Browse our marketplace for the latest deals</p>
              <Link to="/marketplace" className="cc-news-ad-button">
                View Marketplace
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Featured Vehicles Section - Full Width */}
      <div className="cc-news-featured-vehicles-section">
        <h2 className="cc-news-featured-vehicles-heading">
          {article.category || 'Related'} Vehicles For Sale
        </h2>
        
        {isFeaturedVehiclesLoading ? (
          <div className="cc-news-vehicles-loading">
            <div className="cc-news-loader"></div>
            <p>Loading vehicles...</p>
          </div>
        ) : featuredVehicles.length > 0 ? (
          <>
            <p className="cc-news-featured-vehicles-subtitle">
              Explore these premium vehicles from our trusted dealers
            </p>
            <div className="cc-news-featured-vehicles-grid">
              {featuredVehicles.map(vehicle => (
                <div key={vehicle._id || vehicle.id} className="cc-news-featured-vehicle-card">
                  <Link to={`/marketplace/${vehicle._id || vehicle.id}`} className="cc-news-featured-vehicle-link">
                    <div className="cc-news-featured-vehicle-image">
                      <img 
                        src={getImageUrl(vehicle.mainImage || vehicle.images?.[0])} 
                        alt={`${vehicle.make} ${vehicle.model}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/placeholders/car.jpg';
                        }}
                      />
                      {vehicle.dealer?.subscriptionTier === 'premium' && (
                        <span className="cc-news-premium-dealer-badge">Premium</span>
                      )}
                    </div>
                    <div className="cc-news-featured-vehicle-details">
                      <h3 className="cc-news-featured-vehicle-title">
                        {vehicle.make} {vehicle.model} {vehicle.year}
                      </h3>
                      <div className="cc-news-featured-vehicle-info">
                        <div className="cc-news-featured-vehicle-price">
                          P{vehicle.price?.toLocaleString()}
                        </div>
                        <div className="cc-news-featured-vehicle-meta">
                          {vehicle.mileage && (
                            <span className="cc-news-featured-vehicle-spec">
                              {vehicle.mileage.toLocaleString()} km
                            </span>
                          )}
                          {vehicle.transmission && (
                            <span className="cc-news-featured-vehicle-spec">
                              {vehicle.transmission}
                            </span>
                          )}
                          {vehicle.fuelType && (
                            <span className="cc-news-featured-vehicle-spec">
                              {vehicle.fuelType}
                            </span>
                          )}
                        </div>
                        <div className="cc-news-featured-vehicle-dealer">
                          {vehicle.dealer?.name || 'Car Culture Dealer'}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            <div className="cc-news-featured-vehicles-action">
              <Link to="/marketplace" className="cc-news-view-all-button">
                Browse All Vehicles
              </Link>
            </div>
          </>
        ) : (
          <div className="cc-news-empty-vehicles">
            <p>No related vehicles found at this time.</p>
            <Link to="/marketplace" className="cc-news-view-all-button">
              Browse Marketplace
            </Link>
          </div>
        )}
      </div>

      {/* These sections are now OUTSIDE the grid to take full width */}
      {/* Related Videos Section */}
      <div className="cc-news-related-videos-section">
        <VideoSection />
      </div>

      {/* Featured News Section */}
      <div className="cc-news-featured-section">
        <h2 className="cc-news-featured-heading">Featured Car News</h2>
        <FeaturedNews compact={true} />
      </div>
    </div>
  );
};

export default NewsArticle;