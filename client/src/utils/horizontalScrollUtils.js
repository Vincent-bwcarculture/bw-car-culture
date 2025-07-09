// src/utils/horizontalScrollUtils.js

/**
 * Utility functions for horizontal scrolling car cards functionality
 */

// Analytics tracking for horizontal scroll interactions
export const trackHorizontalScrollUsage = (analytics, data) => {
  if (!analytics || typeof analytics.track !== 'function') return;
  
  try {
    analytics.track('horizontal_scroll_used', {
      listing_id: data.listingId,
      scroll_position: data.scrollPosition,
      total_cards: data.totalCards,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Failed to track horizontal scroll usage:', error);
  }
};

export const trackSimilarCarClick = (analytics, data) => {
  if (!analytics || typeof analytics.track !== 'function') return;
  
  try {
    analytics.track('similar_car_clicked', {
      main_car_id: data.mainCarId,
      similar_car_id: data.similarCarId,
      position_in_row: data.positionInRow,
      similarity_score: data.similarityScore,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Failed to track similar car click:', error);
  }
};

// Enhanced similar car matching with multiple criteria
export const calculateAdvancedSimilarityScore = (mainCar, compareCar) => {
  let score = 0;
  
  // Category match (highest priority) - 100 points
  if (mainCar.category === compareCar.category) {
    score += 100;
  }
  
  // Price similarity - 80 points maximum
  const mainPrice = parseFloat(mainCar.price) || 0;
  const comparePrice = parseFloat(compareCar.price) || 0;
  if (mainPrice > 0 && comparePrice > 0) {
    const priceDiff = Math.abs(mainPrice - comparePrice) / mainPrice;
    if (priceDiff <= 0.1) score += 80;      // Within 10%
    else if (priceDiff <= 0.2) score += 60;  // Within 20%
    else if (priceDiff <= 0.3) score += 40;  // Within 30%
    else if (priceDiff <= 0.5) score += 20;  // Within 50%
  }
  
  // Brand match - 60 points
  const mainMake = (mainCar.specifications?.make || '').toLowerCase();
  const compareMake = (compareCar.specifications?.make || '').toLowerCase();
  if (mainMake && compareMake && mainMake === compareMake) {
    score += 60;
  }
  
  // Model similarity - 40 points
  const mainModel = (mainCar.specifications?.model || '').toLowerCase();
  const compareModel = (compareCar.specifications?.model || '').toLowerCase();
  if (mainModel && compareModel && mainModel === compareModel) {
    score += 40;
  }
  
  // Year similarity - 40 points maximum
  const mainYear = parseInt(mainCar.specifications?.year) || 0;
  const compareYear = parseInt(compareCar.specifications?.year) || 0;
  if (mainYear > 0 && compareYear > 0) {
    const yearDiff = Math.abs(mainYear - compareYear);
    if (yearDiff === 0) score += 40;
    else if (yearDiff <= 1) score += 30;
    else if (yearDiff <= 2) score += 20;
    else if (yearDiff <= 3) score += 10;
  }
  
  // Fuel type match - 30 points
  if (mainCar.specifications?.fuelType === compareCar.specifications?.fuelType) {
    score += 30;
  }
  
  // Transmission match - 25 points
  if (mainCar.specifications?.transmission === compareCar.specifications?.transmission) {
    score += 25;
  }
  
  // Location proximity - 20 points
  const mainCity = (mainCar.location?.city || '').toLowerCase();
  const compareCity = (compareCar.location?.city || '').toLowerCase();
  if (mainCity && compareCity && mainCity === compareCity) {
    score += 20;
  }
  
  // Mileage similarity - 15 points maximum
  const mainMileage = parseInt(mainCar.specifications?.mileage) || 0;
  const compareMileage = parseInt(compareCar.specifications?.mileage) || 0;
  if (mainMileage > 0 && compareMileage > 0) {
    const mileageDiff = Math.abs(mainMileage - compareMileage) / mainMileage;
    if (mileageDiff <= 0.2) score += 15;      // Within 20%
    else if (mileageDiff <= 0.3) score += 10; // Within 30%
    else if (mileageDiff <= 0.5) score += 5;  // Within 50%
  }
  
  // Seller type match - 10 points
  if (mainCar.dealer?.sellerType === compareCar.dealer?.sellerType) {
    score += 10;
  }
  
  // Condition match - 10 points
  if (mainCar.condition === compareCar.condition) {
    score += 10;
  }
  
  // Body type match - 15 points
  if (mainCar.specifications?.bodyType === compareCar.specifications?.bodyType) {
    score += 15;
  }
  
  // Color preference - 5 points
  if (mainCar.specifications?.color === compareCar.specifications?.color) {
    score += 5;
  }
  
  return score;
};

// Filter similar cars with advanced criteria
export const findAdvancedSimilarCars = (mainCar, allCars, options = {}) => {
  const {
    maxResults = 3,
    minScore = 50,
    excludeIds = [],
    preferSameDealer = false,
    includeScores = false
  } = options;
  
  if (!mainCar || !allCars || allCars.length === 0) return [];
  
  const mainCarId = mainCar._id || mainCar.id;
  const excludeSet = new Set([mainCarId, ...excludeIds]);
  
  let similar = allCars
    .filter(car => {
      const carId = car._id || car.id;
      return !excludeSet.has(carId);
    })
    .map(car => ({
      ...car,
      similarityScore: calculateAdvancedSimilarityScore(mainCar, car)
    }))
    .filter(car => car.similarityScore >= minScore)
    .sort((a, b) => {
      // If preferSameDealer is true, prioritize cars from same dealer
      if (preferSameDealer) {
        const aIsSameDealer = a.dealer?.businessName === mainCar.dealer?.businessName;
        const bIsSameDealer = b.dealer?.businessName === mainCar.dealer?.businessName;
        
        if (aIsSameDealer && !bIsSameDealer) return -1;
        if (!aIsSameDealer && bIsSameDealer) return 1;
      }
      
      // Sort by similarity score
      return b.similarityScore - a.similarityScore;
    })
    .slice(0, maxResults);
  
  // Remove similarity scores if not needed
  if (!includeScores) {
    similar = similar.map(car => {
      const { similarityScore, ...carWithoutScore } = car;
      return carWithoutScore;
    });
  }
  
  return similar;
};

// Performance optimization: Batch similar car calculation
export const batchCalculateSimilarCars = (cars, options = {}) => {
  const {
    maxResults = 3,
    minScore = 50,
    enableCaching = true
  } = options;
  
  if (!Array.isArray(cars) || cars.length === 0) return new Map();
  
  const similarCarsMap = new Map();
  const cache = new Map();
  
  cars.forEach(mainCar => {
    const mainCarId = mainCar._id || mainCar.id;
    if (!mainCarId) return;
    
    // Check cache first
    if (enableCaching && cache.has(mainCarId)) {
      similarCarsMap.set(mainCarId, cache.get(mainCarId));
      return;
    }
    
    const similarCars = findAdvancedSimilarCars(mainCar, cars, {
      maxResults,
      minScore,
      excludeIds: [mainCarId]
    });
    
    similarCarsMap.set(mainCarId, similarCars);
    
    // Cache the result
    if (enableCaching) {
      cache.set(mainCarId, similarCars);
    }
  });
  
  return similarCarsMap;
};

// Touch gesture detection for mobile
export const setupTouchGestures = (container, options = {}) => {
  const {
    onSwipeLeft = () => {},
    onSwipeRight = () => {},
    onScrollStart = () => {},
    onScrollEnd = () => {},
    swipeThreshold = 50,
    timeThreshold = 300
  } = options;
  
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let isScrolling = false;
  let scrollTimeout = null;
  
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
    isScrolling = false;
    
    onScrollStart();
  };
  
  const handleTouchMove = (e) => {
    if (!isScrolling) {
      isScrolling = true;
    }
    
    // Clear previous timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    // Set new timeout for scroll end
    scrollTimeout = setTimeout(() => {
      onScrollEnd();
      isScrolling = false;
    }, 150);
  };
  
  const handleTouchEnd = (e) => {
    if (!startTime) return;
    
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();
    
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const deltaTime = endTime - startTime;
    
    // Check if it's a swipe (not a scroll)
    if (Math.abs(deltaX) > swipeThreshold && 
        Math.abs(deltaY) < Math.abs(deltaX) * 0.5 && 
        deltaTime < timeThreshold) {
      
      if (deltaX > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }
    
    // Reset values
    startX = 0;
    startY = 0;
    startTime = 0;
  };
  
  // Add event listeners
  container.addEventListener('touchstart', handleTouchStart, { passive: true });
  container.addEventListener('touchmove', handleTouchMove, { passive: true });
  container.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  // Return cleanup function
  return () => {
    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchmove', handleTouchMove);
    container.removeEventListener('touchend', handleTouchEnd);
    
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
  };
};

// Scroll position management
export const calculateScrollPosition = (container, cardWidth = 320, gap = 15) => {
  if (!container) return { index: 0, position: 0 };
  
  const itemWidth = cardWidth + gap;
  const scrollLeft = container.scrollLeft;
  const currentIndex = Math.round(scrollLeft / itemWidth);
  
  return {
    index: currentIndex,
    position: scrollLeft,
    itemWidth
  };
};

export const scrollToCard = (container, index, options = {}) => {
  if (!container) return;
  
  const {
    cardWidth = 320,
    gap = 15,
    behavior = 'smooth'
  } = options;
  
  const itemWidth = cardWidth + gap;
  const targetPosition = index * itemWidth;
  
  container.scrollTo({
    left: targetPosition,
    behavior
  });
};

// Performance monitoring
export const createPerformanceMonitor = () => {
  const metrics = {
    scrollEvents: 0,
    touchEvents: 0,
    renderTime: 0,
    memoryUsage: 0
  };
  
  const startTime = performance.now();
  
  return {
    incrementScrollEvents: () => metrics.scrollEvents++,
    incrementTouchEvents: () => metrics.touchEvents++,
    recordRenderTime: (time) => metrics.renderTime += time,
    getMetrics: () => ({
      ...metrics,
      totalTime: performance.now() - startTime,
      eventsPerSecond: (metrics.scrollEvents + metrics.touchEvents) / ((performance.now() - startTime) / 1000)
    }),
    reset: () => {
      metrics.scrollEvents = 0;
      metrics.touchEvents = 0;
      metrics.renderTime = 0;
      metrics.memoryUsage = 0;
    }
  };
};

// Accessibility helpers
export const announceScrollPosition = (container, totalCards) => {
  const { index } = calculateScrollPosition(container);
  const message = `Viewing car ${index + 1} of ${totalCards}`;
  
  // Create or update aria-live region
  let liveRegion = document.getElementById('scroll-position-announcer');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'scroll-position-announcer';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  }
  
  liveRegion.textContent = message;
};

// Keyboard navigation support
export const setupKeyboardNavigation = (container, options = {}) => {
  const {
    onArrowLeft = () => {},
    onArrowRight = () => {},
    onHome = () => {},
    onEnd = () => {},
    cardWidth = 320,
    gap = 15
  } = options;
  
  const handleKeyDown = (e) => {
    if (!container.contains(document.activeElement)) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        onArrowLeft();
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        onArrowRight();
        break;
        
      case 'Home':
        e.preventDefault();
        onHome();
        break;
        
      case 'End':
        e.preventDefault();
        onEnd();
        break;
    }
  };
  
  document.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};

// Export all utilities
export default {
  trackHorizontalScrollUsage,
  trackSimilarCarClick,
  calculateAdvancedSimilarityScore,
  findAdvancedSimilarCars,
  batchCalculateSimilarCars,
  setupTouchGestures,
  calculateScrollPosition,
  scrollToCard,
  createPerformanceMonitor,
  announceScrollPosition,
  setupKeyboardNavigation
};
