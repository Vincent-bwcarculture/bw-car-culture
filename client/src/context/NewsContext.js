// src/context/NewsContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { http } from '../config/axios.js';
import { normalizeNewsCategory, relatedNews } from '../utils/newsDiscovery.js';

// Create the context
const NewsContext = createContext(null);
const NEWS_CATEGORIES = ['all', 'videos', 'news', 'reviews', 'features', 'comparison', 'industry', 'supercar', 'sports', 'luxury'];


export const NewsProvider = ({ children, autoplay = true, initialCategory = 'all' }) => {
  const [newsItems, setNewsItems] = useState([]);
  const [featuredNews, setFeaturedNews] = useState([]);
  const [selectedNewsItem, setSelectedNewsItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(autoplay);
  const readSaved = key => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const [viewHistory, setViewHistory] = useState(() => readSaved('newsViewHistory'));
  const [savedItems, setSavedItems] = useState(() => readSaved('newsSavedItems'));

  // All useRef hooks at the top level
  const autoplayTimerRef = useRef(null);
  const allCategories = NEWS_CATEGORIES;

  const fetchNews = useCallback(async (category = 'all', limit = 100, page = 1) => {
    const params = { limit, page, status: 'published' };
    if (category === 'featured') params.featured = true;
    else if (category === 'videos') params.hasVideo = true;
    else if (category !== 'all') params.category = normalizeNewsCategory(category);
    const response = await http.get('/api/news', { params });
    return { articles: Array.isArray(response.data?.data) ? response.data.data : [], pagination: response.data?.pagination };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError(null); setNewsItems([]); setSelectedNewsItem(null);
      try {
        let items = [], page = 1, totalPages = 1;
        do {
          const result = await fetchNews(activeCategory, 100, page);
          if (cancelled) return;
          items = [...items, ...result.articles];
          totalPages = result.pagination?.totalPages || 1;
          page += 1;
        } while (page <= totalPages);
        setNewsItems(items); setSelectedNewsItem(items[0] || null);
      } catch { if (!cancelled) setError('Failed to load news content. Please try again.'); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [activeCategory, fetchNews]);

  useEffect(() => {
    let cancelled = false;
    fetchNews('featured', 3).then(result => { if (!cancelled) setFeaturedNews(result.articles); })
      .catch(() => { if (!cancelled) setFeaturedNews([]); });
    return () => { cancelled = true; };
  }, [fetchNews]);

  // Handle autoplay functionality
  useEffect(() => {
    // Clear any existing timer
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
    
    // Set up new timer if autoplay is enabled
    if (isAutoplayEnabled && newsItems.length > 1) {
      autoplayTimerRef.current = setInterval(() => {
        // Find current index
        const currentIndex = newsItems.findIndex(item => 
          (selectedNewsItem && item.id === selectedNewsItem.id) || 
          (selectedNewsItem && item._id === selectedNewsItem._id));
        
        // Move to next item, or back to first if at end
        const nextIndex = currentIndex < newsItems.length - 1 ? currentIndex + 1 : 0;
        setSelectedNewsItem(newsItems[nextIndex]);
      }, 8000); // Change item every 8 seconds
    }
    
    // Cleanup on unmount
    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [isAutoplayEnabled, newsItems, selectedNewsItem]);

  // Save view history to localStorage
  useEffect(() => {
    localStorage.setItem('newsViewHistory', JSON.stringify(viewHistory));
  }, [viewHistory]);

  // Save bookmarked items to localStorage
  useEffect(() => {
    localStorage.setItem('newsSavedItems', JSON.stringify(savedItems));
  }, [savedItems]);

  // Select a news item to display in the featured area
  const selectNewsItem = (item) => {
    // Stop autoplay when user selects an item
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
    
    setSelectedNewsItem(item);
    
    // Add to view history if not already there
    const itemId = item.id || item._id;
    if (itemId && !viewHistory.includes(itemId)) {
      setViewHistory(prev => [itemId, ...prev].slice(0, 20)); // Keep last 20 items
    }
    
    console.log('Selected news item:', item?.title || 'None');
  };

  // Toggle autoplay
  const toggleAutoplay = () => {
    setIsAutoplayEnabled(prev => !prev);
  };

  // Change active category
  const changeCategory = useCallback((category) => {
    category = ({ review: 'reviews', feature: 'features', comparisons: 'comparison' })[category] || category;
    if (NEWS_CATEGORIES.includes(category)) {
      setActiveCategory(category);
    }
  }, []);

  // Toggle save/bookmark item
  const toggleSaveItem = (item) => {
    const itemId = item.id || item._id;
    if (!itemId) return;
    
    setSavedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  // Check if an item is saved/bookmarked
  const isItemSaved = (item) => {
    const itemId = item?.id || item?._id;
    return itemId ? savedItems.includes(itemId) : false;
  };

  // Check if an item has been viewed
  const isItemViewed = (item) => {
    const itemId = item?.id || item?._id;
    return itemId ? viewHistory.includes(itemId) : false;
  };

  // Get related items based on category and tags
  const getRelatedItems = (item, limit = 3) => item ? relatedNews(item, newsItems, limit) : [];

  return (
    <NewsContext.Provider value={{
      newsItems,
      featuredNews,
      selectedNewsItem,
      loading,
      error,
      activeCategory,
      allCategories,
      isAutoplayEnabled,
      viewHistory,
      savedItems,
      selectNewsItem,
      toggleAutoplay,
      changeCategory,
      toggleSaveItem,
      isItemSaved,
      isItemViewed,
      getRelatedItems,
      fetchNews
    }}>
      {children}
    </NewsContext.Provider>
  );
};

// Custom hook to use the news context
export const useNews = () => {
  const context = useContext(NewsContext);
  if (!context) {
    throw new Error('useNews must be used within a NewsProvider');
  }
  return context;
};

export default NewsContext;