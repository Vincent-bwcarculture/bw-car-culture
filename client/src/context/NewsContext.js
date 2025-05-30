// src/context/NewsContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { http } from '../config/axios.js';

// Create the context
const NewsContext = createContext(null);

// Sample fallback data if API fails
const FALLBACK_NEWS = [
  {
    id: "lamborghini-1",
    title: "Lamborghini Revuelto: The Next Evolution of the V12 Supercar",
    description: "Experience the future of hybrid performance with Lamborghini's newest flagship",
    image: "/images/Revuelto.jpg",
    video: "https://www.youtube.com/watch?v=jgP3tV-cHF8",
    author: { name: "Car Culture News Team" },
    date: new Date().toISOString(),
    premium: true,
    category: "supercar",
    tags: ["lamborghini", "hybrid", "v12", "supercar", "new model"],
    metadata: { views: 12500, comments: 85 }
  },
  {
    id: "nissan-gtr-1",
    title: "2024 Nissan GT-R: Track Test Review",
    description: "We take Nissan's iconic Godzilla to the track to see if it still dominates",
    image: "/images/GTR35.jpg",
    author: { name: "Michael Turner" },
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: "sports",
    tags: ["nissan", "gtr", "track test", "sports car", "review"],
    metadata: { views: 8720, comments: 42 }
  },
  {
    id: "ferrari-1",
    title: "Ferrari 296 GTB: A New Era of Hybrid Performance",
    description: "Ferrari's latest hybrid supercar proves electrification enhances the driving experience",
    image: "/images/Ferrari-296.jpg",
    author: { name: "Sarah Johnson" },
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    premium: false,
    category: "supercar",
    tags: ["ferrari", "hybrid", "sports car", "review"],
    metadata: { views: 9340, comments: 63 }
  }
];

export const NewsProvider = ({ children, autoplay = true, initialCategory = 'all' }) => {
  const [newsItems, setNewsItems] = useState([]);
  const [featuredNews, setFeaturedNews] = useState([]);
  const [selectedNewsItem, setSelectedNewsItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(autoplay);
  const [viewHistory, setViewHistory] = useState(() => {
    const saved = localStorage.getItem('newsViewHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [savedItems, setSavedItems] = useState(() => {
    const saved = localStorage.getItem('newsSavedItems');
    return saved ? JSON.parse(saved) : [];
  });
  
  // All useRef hooks at the top level
  const autoplayTimerRef = useRef(null);
  const hasInitialLoadRef = useRef(false);
  const isFetchingCategoryRef = useRef(false);
  const initialLoadAttemptedRef = useRef(false);
  const allCategories = ['all', 'videos', 'news', 'reviews', 'features', 'supercar', 'sports', 'luxury'];

  // Function to fetch news items
  const fetchNews = useCallback(async (category = 'all', limit = 10) => {
    try {
      let endpoint = '/news';
      
      const params = { limit };
      
      if (category === 'videos') {
        params.hasVideo = true;
      } else if (category !== 'all') {
        params.category = category;
      }
      
      console.log(`Fetching news for category: ${category}, limit: ${limit}`);
      const response = await http.get(endpoint, { params });
      
      if (response?.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        console.log(`Fetched ${response.data.data.length} news items for category: ${category}`);
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching news:', error);
      return null;
    }
  }, []);

  // Filter news items by category
  const filterNewsByCategory = useCallback((items, category) => {
    if (!items || !items.length) return [];
    if (category === 'all') return items;
    
    if (category === 'videos') {
      return items.filter(item => {
        return item.video || 
              (item.content && (item.content.includes('youtube.com') || 
                               item.content.includes('youtu.be')));
      });
    }
    
    return items.filter(item => item.category === category);
  }, []);

  // Initialize news data - FIXED to prevent infinite loop
  useEffect(() => {
    // Check if we already did an initial load
    if (initialLoadAttemptedRef.current) {
      return;
    }
    
    initialLoadAttemptedRef.current = true;
    
    const loadAllNews = async () => {
      console.log('Loading initial news data...');
      setLoading(true);
      setError(null);
      
      try {
        // Fetch featured news
        const featured = await fetchNews('featured', 3);
        
        // Fetch regular news
        const news = await fetchNews('all', 8);
        
        if ((featured && featured.length > 0) || (news && news.length > 0)) {
          // Use API data if available
          if (featured && featured.length > 0) {
            setFeaturedNews(featured);
            // Set the first featured item as the selected item if none is selected
            if (!selectedNewsItem) {
              setSelectedNewsItem(featured[0]);
            }
          } else if (news && news.length > 0) {
            setFeaturedNews(news.slice(0, 3));
            // Set the first news item as selected if none is selected
            if (!selectedNewsItem) {
              setSelectedNewsItem(news[0]);
            }
          }
          
          if (news && news.length > 0) {
            setNewsItems(news);
          } else if (featured && featured.length > 0) {
            setNewsItems(featured);
          }
          
          // Mark that we've loaded initial data
          hasInitialLoadRef.current = true;
        } else {
          // Use fallback data if API returns nothing
          console.warn('Using fallback news data');
          setFeaturedNews(FALLBACK_NEWS);
          setNewsItems(FALLBACK_NEWS);
          if (!selectedNewsItem) {
            setSelectedNewsItem(FALLBACK_NEWS[0]);
          }
          hasInitialLoadRef.current = true;
        }
      } catch (error) {
        console.error('Error loading news:', error);
        setError('Failed to load news content');
        
        // Use fallback data on error
        setFeaturedNews(FALLBACK_NEWS);
        setNewsItems(FALLBACK_NEWS);
        if (!selectedNewsItem) {
          setSelectedNewsItem(FALLBACK_NEWS[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadAllNews();
  }, [fetchNews]); // IMPORTANT: Removed selectedNewsItem from dependencies

  // Handle category change - FIXED to prevent infinite loop
  useEffect(() => {
    // Skip if we haven't done the initial load yet
    if (!hasInitialLoadRef.current) {
      return;
    }
    
    const loadCategoryNews = async () => {
      // Skip for 'all' category or if already fetching
      if (activeCategory === 'all' || isFetchingCategoryRef.current) {
        return;
      }
      
      console.log(`Loading news for category: ${activeCategory}`);
      isFetchingCategoryRef.current = true;
      setLoading(true);
      
      try {
        const categoryNews = await fetchNews(activeCategory, 10);
        
        if (categoryNews && categoryNews.length > 0) {
          setNewsItems(categoryNews);
          
          // Only update selected item if necessary
          const currentItemStillValid = selectedNewsItem && categoryNews.some(item => 
            (item.id === selectedNewsItem.id) || (item._id === selectedNewsItem._id));
            
          if (!currentItemStillValid) {
            setSelectedNewsItem(categoryNews[0]);
          }
        } else {
          // Filter from existing items as fallback
          const filteredItems = filterNewsByCategory(newsItems, activeCategory);
          
          if (filteredItems.length > 0) {
            // Just update selected item if needed
            const currentItemStillValid = selectedNewsItem && filteredItems.some(item => 
              (item.id === selectedNewsItem.id) || (item._id === selectedNewsItem._id));
              
            if (!currentItemStillValid) {
              setSelectedNewsItem(filteredItems[0]);
            }
          }
        }
      } catch (error) {
        console.error(`Error loading ${activeCategory} news:`, error);
      } finally {
        setLoading(false);
        isFetchingCategoryRef.current = false;
      }
    };
    
    loadCategoryNews();
  }, [activeCategory, fetchNews, filterNewsByCategory]); // IMPORTANT: Removed newsItems and selectedNewsItem

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
  const changeCategory = (category) => {
    if (allCategories.includes(category)) {
      setActiveCategory(category);
    }
  };

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
  const getRelatedItems = (item, limit = 3) => {
    if (!item || !newsItems.length) return [];
    
    // Filter out the current item
    const otherItems = newsItems.filter(otherItem => 
      (item.id !== otherItem.id) && (item._id !== otherItem._id)
    );
    
    // First try to match by category and tags
    if (item.category && item.tags && item.tags.length > 0) {
      const sameCategoryAndTag = otherItems.filter(otherItem => 
        otherItem.category === item.category && 
        otherItem.tags && 
        otherItem.tags.some(tag => item.tags.includes(tag))
      );
      
      if (sameCategoryAndTag.length >= limit) {
        return sameCategoryAndTag.slice(0, limit);
      }
    }
    
    // Next try just category
    if (item.category) {
      const sameCategory = otherItems.filter(otherItem => 
        otherItem.category === item.category
      );
      
      if (sameCategory.length >= limit) {
        return sameCategory.slice(0, limit);
      }
    }
    
    // Fallback to any items
    return otherItems.slice(0, limit);
  };

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