// src/components/features/CarNews/CarNewsPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Search, Filter, ChevronDown, Grid, List, Zap, Clock } from 'lucide-react';
import { useNews } from '../../../context/NewsContext.js';
import LoadingScreen from '../../shared/LoadingScreen/LoadingScreen.js';
import { formatDate, formatCategoryName } from '../../../utils/newsHelpers.js';
import './CarNewsPage.css';

const CarNewsPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    newsItems, 
    featuredNews, 
    activeCategory, 
    allCategories, 
    changeCategory, 
    loading, 
    error 
  } = useNews();
  
  // State variables
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Helper function to get image URL with S3 support
 // Enhanced helper function to get image URL with S3 support
const getImageUrl = (item) => {
  if (!item) return '/images/placeholders/default.jpg';
  
  try {
    let imageUrl = '';
    
    // If item has featuredImage
    if (item.featuredImage) {
      if (typeof item.featuredImage === 'string') {
        imageUrl = item.featuredImage;
      } else if (item.featuredImage.url) {
        imageUrl = item.featuredImage.url;
      } else if (item.featuredImage.key) {
        return `/api/images/s3-proxy/${item.featuredImage.key}`;
      }
    }
    
    // If no featuredImage but item has images array
    else if (item.images && item.images.length > 0) {
      const firstImage = item.images[0];
      if (typeof firstImage === 'string') {
        imageUrl = firstImage;
      } else if (firstImage.url) {
        imageUrl = firstImage.url;
      } else if (firstImage.key) {
        return `/api/images/s3-proxy/${firstImage.key}`;
      }
    }
    
    // If item has image property
    else if (item.image) {
      if (typeof item.image === 'string') {
        imageUrl = item.image;
      } else if (item.image.url) {
        imageUrl = item.image.url;
      } else if (item.image.key) {
        return `/api/images/s3-proxy/${item.image.key}`;
      }
    }
    
    // If item has gallery
    else if (item.gallery && item.gallery.length > 0) {
      const firstGalleryItem = item.gallery[0];
      if (typeof firstGalleryItem === 'string') {
        imageUrl = firstGalleryItem;
      } else if (firstGalleryItem.url) {
        imageUrl = firstGalleryItem.url;
      } else if (firstGalleryItem.key) {
        return `/api/images/s3-proxy/${firstGalleryItem.key}`;
      }
    }
    
    // If we still don't have an image URL, use placeholder
    if (!imageUrl) {
      return '/images/placeholders/default.jpg';
    }
    
    // Clean up problematic URLs with duplicated image paths
    if (imageUrl.includes('/images/images/')) {
      imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
    }
    
    // Check for cached failed images
    if (checkFailedImage(imageUrl)) {
      console.log(`Using cached fallback for previously failed image: ${imageUrl}`);
      return '/images/placeholders/default.jpg';
    }
    
    // If URL starts with http, return as is (S3 or other external URL)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Ensure local paths start with /
    if (!imageUrl.startsWith('/')) {
      imageUrl = `/${imageUrl}`;
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error getting article image URL:', error);
    return '/images/placeholders/default.jpg';
  }
};

// Add these functions at the beginning of your component
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

  // Update title whenever category changes
  useEffect(() => {
    if (category) {
      document.title = `${formatCategoryName(category)} - Car Culture News`;
    } else {
      document.title = 'Car News - Car Culture';
    }
    
    return () => {
      document.title = 'Car Culture';
    };
  }, [category]);

  // Get query parameters from URL
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const search = query.get('search');
    const sort = query.get('sort');
    
    if (search) setSearchQuery(search);
    if (sort) setSortBy(sort);
    
    // Set active category from URL param
    if (category) {
      changeCategory(category.toLowerCase());
    }
  }, [location.search, category, changeCategory]);

  // Set initial load to false after first render
  useEffect(() => {
    if (loading === false) {
      setIsInitialLoad(false);
    }
  }, [loading]);

  // Use memo to prevent unnecessary re-renders and flickering
  const displayedArticles = useMemo(() => {
    if (loading && isInitialLoad) return [];
    
    let filteredArticles = [...newsItems];
    
    // Apply search filter if present
    if (searchQuery) {
      filteredArticles = filteredArticles.filter(article => 
        article.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        article.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply sort
    filteredArticles = [...filteredArticles].sort((a, b) => {
      if (sortBy === 'newest') {
        const dateA = new Date(a.publishDate || a.createdAt || a.date || 0);
        const dateB = new Date(b.publishDate || b.createdAt || b.date || 0);
        return dateB - dateA;
      } else if (sortBy === 'popular') {
        const viewsA = a.metadata?.views || 0;
        const viewsB = b.metadata?.views || 0;
        return viewsB - viewsA;
      }
      return 0;
    });
    
    return filteredArticles;
  }, [newsItems, searchQuery, sortBy, loading, isInitialLoad]);
  
  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    
    // Update URL with search query
    const query = new URLSearchParams(location.search);
    if (searchQuery) {
      query.set('search', searchQuery);
    } else {
      query.delete('search');
    }
    
    navigate({
      pathname: location.pathname,
      search: query.toString()
    });
  };
  
  // Handle sort change
  const handleSortChange = (sortValue) => {
    setSortBy(sortValue);
    
    // Update URL with sort parameter
    const query = new URLSearchParams(location.search);
    query.set('sort', sortValue);
    
    navigate({
      pathname: location.pathname,
      search: query.toString()
    });
  };
  
  // Show loading only on initial load to prevent flickering
  if (loading && isInitialLoad && newsItems.length === 0) {
    return <LoadingScreen />;
  }
  
  return (
    <div className="cc-newspage-container">
      {/* Page header with search and filters */}
      <div className="cc-newspage-header">
        <h1 className="cc-newspage-title">
          {activeCategory === 'all' ? 'Car News & Reviews' : formatCategoryName(activeCategory)}
        </h1>
        
        <div className="cc-newspage-search-bar">
          <form onSubmit={handleSearch}>
            <div className="cc-newspage-search-input-container">
              <Search size={18} className="cc-newspage-search-icon" />
              <input
                type="text"
                placeholder="Search news articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cc-newspage-search-input"
              />
              <button type="submit" className="cc-newspage-search-button">Search</button>
            </div>
          </form>
          
          <button 
            className={`cc-newspage-filter-toggle ${filtersVisible ? 'active' : ''}`}
            onClick={() => setFiltersVisible(!filtersVisible)}
          >
            <Filter size={18} />
            <span>Filters</span>
            <ChevronDown size={16} className={`cc-newspage-filter-arrow ${filtersVisible ? 'open' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Filters section */}
      {filtersVisible && (
        <div className="cc-newspage-filters">
          <div className="cc-newspage-filter-section">
            <h3>Sort By</h3>
            <div className="cc-newspage-filter-options">
              <button
                className={`cc-newspage-filter-option ${sortBy === 'newest' ? 'active' : ''}`}
                onClick={() => handleSortChange('newest')}
              >
                <Clock size={16} />
                <span>Newest</span>
              </button>
              <button
                className={`cc-newspage-filter-option ${sortBy === 'popular' ? 'active' : ''}`}
                onClick={() => handleSortChange('popular')}
              >
                <Zap size={16} />
                <span>Most Popular</span>
              </button>
            </div>
          </div>
          
          <div className="cc-newspage-filter-section">
            <h3>View</h3>
            <div className="cc-newspage-filter-options">
              <button
                className={`cc-newspage-filter-option ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={16} />
                <span>Grid</span>
              </button>
              <button
                className={`cc-newspage-filter-option ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Categories navigation */}
      <div className="cc-newspage-categories">
        {allCategories.map(cat => (
          <button
            key={cat}
            className={`cc-newspage-category-button ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => changeCategory(cat)}
          >
            {formatCategoryName(cat)}
          </button>
        ))}
      </div>
      
      {/* Error message if API fails */}
      {error && (
        <div className="cc-newspage-error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="cc-newspage-retry-button">
            Try Again
          </button>
        </div>
      )}
      
      {/* Featured article section */}
      {featuredNews && featuredNews.length > 0 && !searchQuery && activeCategory === 'all' && (
        <section className="cc-newspage-featured-section">
          <div className="cc-newspage-featured-article-card">
            <Link 
              to={`/news/article/${featuredNews[0]._id || featuredNews[0].id}`}
              className="cc-newspage-featured-article-link"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="cc-newspage-featured-article-image">
               <img 
  src={getImageUrl(featuredNews[0])}
  alt={featuredNews[0].title} 
  loading="lazy"
  onError={(e) => {
    const originalSrc = e.target.src;
    console.log('Featured article image failed to load:', originalSrc);
    
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
                {featuredNews[0].premium && (
                  <span className="cc-newspage-premium-badge">Premium</span>
                )}
              </div>
              <div className="cc-newspage-featured-article-overlay">
                <div className="cc-newspage-featured-article-content">
                  <div className="cc-newspage-featured-article-meta">
                    <span className="cc-newspage-featured-article-category">
                      {formatCategoryName(featuredNews[0].category || 'news')}
                    </span>
                    <span className="cc-newspage-featured-article-date">
                      {formatDate(featuredNews[0].publishDate || featuredNews[0].createdAt || featuredNews[0].date)}
                    </span>
                  </div>
                  <h2 className="cc-newspage-featured-article-title">{featuredNews[0].title}</h2>
                  <p className="cc-newspage-featured-article-description">
                    {featuredNews[0].subtitle || featuredNews[0].description || ''}
                  </p>
                  <button className="cc-newspage-featured-article-button">
                    Read Article
                  </button>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}
      
      {/* Results count */}
      {searchQuery && (
        <div className="cc-newspage-results-count">
          <p>Found {displayedArticles.length} articles matching "{searchQuery}"</p>
        </div>
      )}
      
      {/* Articles grid */}
      <section className="cc-newspage-articles">
        {!searchQuery && (
          <h2 className="cc-newspage-section-title">
            {activeCategory === 'all' ? 'Latest Articles' : formatCategoryName(activeCategory)}
          </h2>
        )}
        
        {displayedArticles.length === 0 ? (
          <div className="cc-newspage-no-articles">
            <h3>No articles found</h3>
            <p>Try changing your category or search terms</p>
            {searchQuery && (
              <button 
                className="cc-newspage-clear-search" 
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className={`cc-newspage-articles-container ${viewMode}`}>
            {displayedArticles.map(article => (
              <article key={article._id || article.id} className="cc-newspage-article-card">
                <Link 
                  to={`/news/article/${article._id || article.id}`}
                  className="cc-newspage-article-link"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="cc-newspage-article-card-image">
                   <img 
  src={getImageUrl(article)} 
  alt={article.title} 
  loading="lazy"
  onError={(e) => {
    const originalSrc = e.target.src;
    console.log('Article image failed to load:', originalSrc);
    
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
                    {article.premium && (
                      <span className="cc-newspage-premium-badge">Premium</span>
                    )}
                    {(article.video || article.youtubeUrl) && (
                      <span className="cc-newspage-video-badge">Video</span>
                    )}
                    <span className="cc-newspage-article-card-category">
                      {formatCategoryName(article.category || 'news')}
                    </span>
                  </div>
                  <div className="cc-newspage-article-card-content">
                    <h3 className="cc-newspage-article-card-title">{article.title}</h3>
                    <p className="cc-newspage-article-card-description">
                      {article.subtitle || article.description || ''}
                    </p>
                    <div className="cc-newspage-article-card-meta">
                      {article.author && (
                        <div className="cc-newspage-article-card-author">
                          {article.author.avatar && (
                            <img 
  src={article.author.avatar} 
  alt={article.author.name || article.author}
  className="author-avatar"
  onError={(e) => {
    console.log('Author avatar failed to load:', e.target.src);
    markFailedImage(e.target.src);
    e.target.onerror = null;
    e.target.src = '/images/placeholders/avatar.jpg';
  }}
/>
                          )}
                          <span>By {article.author.name || article.author}</span>
                        </div>
                      )}
                      <span className="cc-newspage-article-card-date">
                        {formatDate(article.publishDate || article.createdAt || article.date)}
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CarNewsPage;