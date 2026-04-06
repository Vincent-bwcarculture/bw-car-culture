// src/components/features/CarNews/NewsArticle.js
// COMPLETE FIXED VERSION - All API endpoints corrected to include /api prefix
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Share2, Heart, Clock, Calendar, Tag, ChevronLeft, ChevronRight, Camera, Bookmark, BookmarkCheck, Image, ArrowRight, MessageSquare } from 'lucide-react';
import { http } from '../../../config/axios.js';
import { useNews } from '../../../context/NewsContext.js';
import VehicleCard from '../../shared/VehicleCard/VehicleCard.js';
import LoadingScreen from '../../shared/LoadingScreen/LoadingScreen.js';
import NewsGallery from './NewsGallery.js';
import FeaturedNews from './FeaturedNews.js';
import VideoSection from '../VideoSection/VideoSection.js';
import { getNewsImageUrl, getGalleryImageUrls, formatDate, getAuthorInfo } from '../../../utils/newsHelpers.js';
import { buildHelmet, SITE_URL } from '../../../hooks/useSEO.js';
import StickyCarBar from '../../shared/StickyCarBar/StickyCarBar.js';
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
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  
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

  // Helper function to parse content - preserves HTML for rich rendering
  const parseArticleContent = (content) => {
    if (!content) return '';

    // If content is a JSON string (from some editors)
    if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
      try {
        const parsed = JSON.parse(content);
        // If it's an object with blocks (Draft.js / EditorJS format)
        if (parsed.blocks) {
          return parsed.blocks.map(block => `<p>${block.text || ''}</p>`).join('');
        }
        // If it's a simple object with an HTML content property
        if (parsed.content) {
          return parsed.content;
        }
        // Fallback: join values as paragraphs
        return Object.values(parsed).map(v => `<p>${v}</p>`).join('');
      } catch (e) {
        // JSON parsing failed — treat as raw HTML/text
        return content;
      }
    }

    // Already an HTML string — return as-is
    return content;
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

  // Process gallery images to handle S3 URLs — robust multi-format support
  const processGalleryImages = (gallery) => {
    if (!gallery || !Array.isArray(gallery)) return [];
    const results = [];
    for (const item of gallery) {
      if (!item) continue;
      let url = null;
      if (typeof item === 'string') {
        url = item;
      } else if (item.url) {
        url = item.url;
      } else if (item.secure_url) {
        url = item.secure_url;
      } else if (item.key) {
        url = `/api/images/s3-proxy/${item.key}`;
      } else if (item.path) {
        url = item.path;
      }
      if (url) {
        // Fix duplicate path segments
        if (url.includes('/images/images/')) url = url.replace(/\/images\/images\//g, '/images/');
        // Ensure local paths start with /
        if (!url.startsWith('http') && !url.startsWith('/')) url = `/${url}`;
        results.push(url);
      }
    }
    return results;
  };

  // Fetch featured vehicles from premium dealers
  // FIXED: Added /api prefix
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
      
      // FIXED: Added /api prefix
      const response = await http.get(`/api/listings?${queryParams.toString()}`);
      
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
        
        // FIXED: Added /api prefix - THIS WAS THE MAIN ISSUE!
        // Try to fetch the article - backend will handle both ID and slug
        const response = await http.get(`/api/news/${articleId}`);
        
        if (response.data?.data) {
          // Store article ID to prevent duplicate fetches
          articleFetchedRef.current = articleId;
          
          const fetchedArticle = response.data.data;
          
          // Parse and clean the content
          const cleanedContent = parseArticleContent(fetchedArticle.content);
          fetchedArticle.parsedContent = cleanedContent;
          
          setArticle(fetchedArticle);

          // Restore like state from localStorage
          try {
            const likes = JSON.parse(localStorage.getItem('likedArticles') || '{}');
            setLiked(!!likes[articleId]);
          } catch (_) {}

          // Restore comments from localStorage
          try {
            const saved = JSON.parse(localStorage.getItem(`articleComments_${articleId}`) || '[]');
            setComments(saved);
            if (saved.length > 0) setShowComments(true);
          } catch (_) { setComments([]); }

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
          
          // Use related articles from the API response first, fall back to context
          const apiRelated = response.data.related;
          if (Array.isArray(apiRelated) && apiRelated.length > 0) {
            setRelatedArticles(apiRelated);
          } else {
            // Will be filled from moreNewsItems once that fetch completes
            const related = getRelatedItems(fetchedArticle, 3);
            setRelatedArticles(related);
          }
          
          // Fetch related vehicles based on car make/model mentioned in the article
          if (make && !initialFetchCompleteRef.current) {
            try {
              // FIXED: Added /api prefix
              const vehiclesResponse = await http.get(`/api/listings?make=${make}&limit=3`);
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
        if (error.status === 404 || error.response?.status === 404) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  // Fetch more news articles for bottom section and related sidebar fallback
  const fetchMoreNews = useCallback(async (currentArticle) => {
    try {
      const category = currentArticle?.category || 'news';
      const response = await http.get(`/api/news?category=${category}&limit=6`);

      if (response.data?.data) {
        const filtered = response.data.data.filter(
          item => item._id !== articleId && item.id !== articleId
        );
        setMoreNewsItems(filtered.slice(0, 3));
        // Also backfill the sidebar related articles if still empty
        setRelatedArticles(prev => prev.length > 0 ? prev : filtered.slice(0, 3));
      }
    } catch (error) {
      // Try simpler query as fallback
      try {
        const r2 = await http.get('/api/news?limit=5');
        if (r2.data?.data) {
          const filtered = r2.data.data.filter(
            item => item._id !== articleId && item.id !== articleId
          );
          setMoreNewsItems(filtered.slice(0, 3));
          setRelatedArticles(prev => prev.length > 0 ? prev : filtered.slice(0, 3));
        }
      } catch (_) {}
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

  // Function to handle liking an article — persisted in localStorage
  const handleLike = useCallback(() => {
    if (!articleId) return;
    setLiked(prev => {
      const next = !prev;
      try {
        const likes = JSON.parse(localStorage.getItem('likedArticles') || '{}');
        if (next) likes[articleId] = true;
        else delete likes[articleId];
        localStorage.setItem('likedArticles', JSON.stringify(likes));
      } catch (_) {}
      return next;
    });
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

    const content = article.parsedContent;

    // If the content contains HTML tags, render it directly
    if (/<[a-z][\s\S]*>/i.test(content)) {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }

    // Plain text fallback — split on double newlines into paragraphs
    return content.split('\n\n').filter(p => p.trim()).map((paragraph, index) => (
      <p key={index}>{paragraph}</p>
    ));
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

  const articleImage = article.featuredImage?.url || article.images?.[0]?.url || null;
  const articleUrl   = `${SITE_URL}/news/${article.slug || article._id}`;

  return (
    <div className="cc-news-article-page">
      {buildHelmet({
        title: article.title,
        description: article.seo?.metaDescription || article.subtitle || article.excerpt || article.title,
        image: articleImage,
        url: articleUrl,
        type: 'article',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: article.title,
          description: article.seo?.metaDescription || article.subtitle || '',
          image: articleImage ? [articleImage] : undefined,
          datePublished: article.publishDate || article.createdAt,
          dateModified: article.updatedAt || article.publishDate,
          url: articleUrl,
          publisher: { '@type': 'Organization', name: 'BW Car Culture', url: SITE_URL }
        }
      })}
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
                {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
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

          {/* Inline photo gallery widget */}
          {galleryImages.length > 0 && (
            <div className="cc-news-inline-gallery">
              <div className="cc-news-ig-header">
                <Camera size={16} />
                <span>Photo Gallery</span>
                <span className="cc-news-ig-count">{galleryImages.length} photos</span>
              </div>

              {/* Main image */}
              <div className="cc-news-ig-main">
                <button
                  className="cc-news-ig-nav prev"
                  onClick={() => setSelectedGalleryIndex(i => (i === 0 ? galleryImages.length - 1 : i - 1))}
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={24} />
                </button>

                <img
                  key={selectedGalleryIndex}
                  src={galleryImages[selectedGalleryIndex]}
                  alt={`Photo ${selectedGalleryIndex + 1} of ${galleryImages.length}`}
                  className="cc-news-ig-main-img"
                  onClick={() => openGallery(selectedGalleryIndex)}
                  onError={(e) => {
                    const src = e.target.src;
                    if (src.includes('amazonaws.com')) {
                      const key = src.split('.amazonaws.com/').pop();
                      if (key) { e.target.src = `/api/images/s3-proxy/${key.replace(/images\/images\//g, 'images/')}`; return; }
                    }
                    e.target.src = '/images/placeholders/default.jpg';
                  }}
                />

                <button
                  className="cc-news-ig-nav next"
                  onClick={() => setSelectedGalleryIndex(i => (i === galleryImages.length - 1 ? 0 : i + 1))}
                  aria-label="Next photo"
                >
                  <ChevronRight size={24} />
                </button>

                <div className="cc-news-ig-counter">{selectedGalleryIndex + 1} / {galleryImages.length}</div>
              </div>

              {/* Thumbnails strip */}
              {galleryImages.length > 1 && (
                <div className="cc-news-ig-thumbs">
                  {galleryImages.map((url, idx) => (
                    <div
                      key={idx}
                      className={`cc-news-ig-thumb ${idx === selectedGalleryIndex ? 'active' : ''}`}
                      onClick={() => setSelectedGalleryIndex(idx)}
                    >
                      <img
                        src={url}
                        alt={`Thumbnail ${idx + 1}`}
                        loading="lazy"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholders/default.jpg'; }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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

          {/* Bottom action bar */}
          <div className="cc-news-article-action-bar">
            <button
              className={`cc-news-action-button ${liked ? 'liked' : ''}`}
              onClick={handleLike}
              aria-label={liked ? 'Unlike article' : 'Like article'}
            >
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              <span>{liked ? 'Liked' : 'Like'}</span>
            </button>
            <button
              className={`cc-news-action-button ${isItemSaved(article) ? 'saved' : ''}`}
              onClick={handleSave}
              aria-label={isItemSaved(article) ? 'Unsave article' : 'Save article'}
            >
              {isItemSaved(article) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              <span>{isItemSaved(article) ? 'Saved' : 'Save'}</span>
            </button>
            <button
              className="cc-news-action-button"
              onClick={handleShare}
              aria-label="Share article"
            >
              <Share2 size={16} />
              <span>Share</span>
            </button>
            <button
              className={`cc-news-action-button comment-btn ${showComments ? 'active' : ''}`}
              onClick={() => setShowComments(prev => !prev)}
              aria-label="Toggle comments"
            >
              <MessageSquare size={16} />
              <span>Comment{comments.length > 0 ? ` (${comments.length})` : ''}</span>
            </button>
          </div>

          {/* Comment section */}
          {showComments && (
            <div className="cc-news-comment-section">
              <h4>Comments {comments.length > 0 && <span className="cc-news-comment-count">({comments.length})</span>}</h4>
              <div className="cc-news-comment-form">
                <textarea
                  className="cc-news-comment-input"
                  placeholder="Share your thoughts..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  rows={3}
                />
                <button
                  className="cc-news-comment-submit"
                  disabled={!commentText.trim()}
                  onClick={() => {
                    if (!commentText.trim()) return;
                    const newComment = {
                      id: Date.now(),
                      text: commentText.trim(),
                      author: 'You',
                      date: new Date().toLocaleDateString()
                    };
                    setComments(prev => {
                      const updated = [newComment, ...prev];
                      try {
                        localStorage.setItem(`articleComments_${articleId}`, JSON.stringify(updated));
                      } catch (_) {}
                      return updated;
                    });
                    setCommentText('');
                  }}
                >
                  Post Comment
                </button>
              </div>
              {comments.length > 0 ? (
                <div className="cc-news-comment-list">
                  {comments.map(c => (
                    <div key={c.id} className="cc-news-comment-item">
                      <div className="cc-news-comment-avatar">{c.author[0]}</div>
                      <div className="cc-news-comment-body">
                        <div className="cc-news-comment-header">
                          <span className="cc-news-comment-author">{c.author}</span>
                          <span className="cc-news-comment-date">{c.date}</span>
                        </div>
                        <p className="cc-news-comment-text">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="cc-news-no-comments">No comments yet. Be the first!</p>
              )}
            </div>
          )}

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

      {/* Sticky bottom bar — related cars for sale */}
      <StickyCarBar
        vehicles={featuredVehicles.length ? featuredVehicles : relatedVehicles.length ? relatedVehicles : undefined}
        fetchParams={{ sort: '-createdAt', limit: 12 }}
        label="Related Cars For Sale"
        sessionKey={`articleCarBar_${articleId}`}
      />
    </div>
  );
};

export default NewsArticle;