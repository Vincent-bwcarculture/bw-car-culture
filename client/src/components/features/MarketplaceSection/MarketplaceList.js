// src/components/features/MarketplaceSection/MarketplaceList.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { debounce, throttle } from 'lodash';
import { listingService } from '../../../services/listingService.js';
import VehicleCard from '../../shared/VehicleCard/VehicleCard.js';
import ShareModal from '../../shared/ShareModal.js';
import MarketplaceFilters from './MarketplaceFilters.js'; 
import './MarketplaceList.css';

const CARS_PER_PAGE = 12;
const PREMIUM_CARS_PER_SECTION = 9;
const SAVINGS_CARS_PER_SECTION = 9;
const PRIVATE_CARS_PER_SECTION = 12;
const MOBILE_BREAKPOINT = 768;
const SIMILAR_CARS_LIMIT = 3; // Number of similar cars to show

const MarketplaceList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Refs for performance optimization
  const containerRef = useRef(null);
  const observerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const lastScrollY = useRef(0);
  const similarCarsCache = useRef(new Map());
  
  // Main state
  const [allCars, setAllCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('all');
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Performance state
  const [visibleItems, setVisibleItems] = useState(CARS_PER_PAGE);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  
  // UI state
  const fetchInProgress = useRef(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const shareButtonRef = useRef(null);
  const [loadingText, setLoadingText] = useState('Loading vehicles...');

  // Similar cars functionality
  const [similarCarsData, setSimilarCarsData] = useState(new Map());
  const [showScrollHints, setShowScrollHints] = useState(true);

  // Initialize active section from URL
  const initializeActiveSection = useCallback(() => {
    const urlParams = new URLSearchParams(location.search);
    const section = urlParams.get('section') || 'all';
    setActiveSection(section);
  }, [location.search]);

  // Mobile detection
  useEffect(() => {
    const handleResize = throttle(() => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Similar car matching algorithm
  const calculateSimilarityScore = useCallback((mainCar, compareCar) => {
    let score = 0;
    
    // Category match (highest priority)
    if (mainCar.category === compareCar.category) score += 100;
    
    // Price similarity
    const mainPrice = parseFloat(mainCar.price) || 0;
    const comparePrice = parseFloat(compareCar.price) || 0;
    if (mainPrice > 0 && comparePrice > 0) {
      const priceDiff = Math.abs(mainPrice - comparePrice) / mainPrice;
      if (priceDiff <= 0.2) score += 80; // Within 20%
      else if (priceDiff <= 0.4) score += 40; // Within 40%
    }
    
    // Brand match
    if (mainCar.specifications?.make === compareCar.specifications?.make) score += 60;
    
    // Year similarity
    const mainYear = parseInt(mainCar.specifications?.year) || 0;
    const compareYear = parseInt(compareCar.specifications?.year) || 0;
    if (mainYear > 0 && compareYear > 0) {
      const yearDiff = Math.abs(mainYear - compareYear);
      if (yearDiff <= 1) score += 40;
      else if (yearDiff <= 3) score += 20;
    }
    
    // Fuel type match
    if (mainCar.specifications?.fuelType === compareCar.specifications?.fuelType) score += 30;
    
    // Transmission match
    if (mainCar.specifications?.transmission === compareCar.specifications?.transmission) score += 20;
    
    // Location proximity (same city/region)
    if (mainCar.location?.city === compareCar.location?.city) score += 15;
    
    // Mileage similarity
    const mainMileage = parseInt(mainCar.specifications?.mileage) || 0;
    const compareMileage = parseInt(compareCar.specifications?.mileage) || 0;
    if (mainMileage > 0 && compareMileage > 0) {
      const mileageDiff = Math.abs(mainMileage - compareMileage) / mainMileage;
      if (mileageDiff <= 0.3) score += 10; // Within 30%
    }
    
    return score;
  }, []);

  const findSimilarCars = useCallback((mainCar, allCars, maxResults = SIMILAR_CARS_LIMIT) => {
    if (!mainCar || !allCars || allCars.length === 0) return [];
    
    const carId = mainCar._id || mainCar.id;
    
    // Check cache first
    if (similarCarsCache.current.has(carId)) {
      return similarCarsCache.current.get(carId);
    }
    
    const similar = allCars
      .filter(car => (car._id || car.id) !== carId) // Exclude main car
      .map(car => ({
        ...car,
        similarityScore: calculateSimilarityScore(mainCar, car)
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore) // Sort by highest score
      .slice(0, maxResults); // Take top matches
    
    // Cache the result
    similarCarsCache.current.set(carId, similar);
    return similar;
  }, [calculateSimilarityScore]);

  // Enhanced car classification with private seller detection
  const carIsFromPrivateSeller = useCallback((car) => {
    if (!car?.dealer) return false;
    
    const businessName = (car.dealer.businessName || '').toLowerCase();
    const sellerType = car.dealer.sellerType;
    
    // Direct check for seller type
    if (sellerType === 'private') return true;
    if (sellerType === 'dealership') return false;
    
    // Check for private seller indicators
    const privateIndicators = ['private', 'personal', 'individual', 'owner', 'self'];
    const dealershipIndicators = ['dealership', 'motors', 'auto', 'cars', 'automotive', 'garage', 'ltd', 'pty'];
    
    // If it has dealership indicators, it's likely not private
    if (dealershipIndicators.some(indicator => businessName.includes(indicator))) {
      return false;
    }
    
    // If it has private indicators, it's likely private
    if (privateIndicators.some(indicator => businessName.includes(indicator))) {
      return true;
    }
    
    // Advanced check: name pattern (First Last format without business terms)
    const namePattern = /^[A-Z][a-z]+ [A-Z][a-z]+( [A-Z][a-z]+)?$/;
    if (namePattern.test(car.dealer.businessName || '') && 
        !dealershipIndicators.some(indicator => businessName.includes(indicator))) {
      return true;
    }
    
    return false;
  }, []);

  const carHasSavings = useCallback((car) => {
    if (!car) return false;
    
    const originalPrice = parseFloat(car.originalPrice) || 0;
    const currentPrice = parseFloat(car.price) || 0;
    
    if (originalPrice > 0 && currentPrice > 0) {
      const savings = originalPrice - currentPrice;
      return savings > 5000; // Minimum savings threshold
    }
    
    return false;
  }, []);

  const calculateCarSavings = useCallback((car) => {
    if (!car) return 0;
    
    const originalPrice = parseFloat(car.originalPrice) || 0;
    const currentPrice = parseFloat(car.price) || 0;
    
    if (originalPrice > 0 && currentPrice > 0) {
      return originalPrice - currentPrice;
    }
    
    return 0;
  }, []);

  const carIsPremium = useCallback((car) => {
    if (!car) return false;
    
    const price = parseFloat(car.price) || 0;
    const specifications = car.specifications || {};
    
    // Premium indicators
    const premiumBrands = ['bmw', 'mercedes', 'audi', 'lexus', 'infiniti', 'acura', 'cadillac', 'tesla'];
    const make = (specifications.make || '').toLowerCase();
    
    // High-end price threshold (adjust for local market)
    const highEndPrice = 500000; // P500,000
    
    // Premium features
    const hasPremiumFeatures = car.featured || 
                              car.isCertified || 
                              (car.images && car.images.length > 5) ||
                              (car.dealer?.verification?.isVerified);
    
    return premiumBrands.includes(make) || 
           price > highEndPrice || 
           hasPremiumFeatures;
  }, []);

  const getCarClassification = useCallback((car) => {
    if (!car) return 'regular';
    
    const isPrivate = carIsFromPrivateSeller(car);
    const hasSavings = carHasSavings(car);
    const isPremium = carIsPremium(car);
    
    // Priority order: Private sellers can have any classification
    if (isPrivate) {
      if (hasSavings) return 'private-savings';
      if (isPremium) return 'private-premium';
      return 'private';
    }
    
    if (hasSavings) return 'savings';
    if (isPremium) return 'premium';
    return 'regular';
  }, [carIsFromPrivateSeller, carHasSavings, carIsPremium]);

  // Optimized listing score calculation with caching
  const listingScoreCache = useRef(new Map());
  
  const calculateListingScore = useCallback((car) => {
    if (!car) return 0;
    
    const carId = car._id || car.id;
    if (carId && listingScoreCache.current.has(carId)) {
      return listingScoreCache.current.get(carId);
    }
    
    let score = 0;
    
    // Featured listings get highest priority
    if (car.featured) score += 1000;
    
    // Recent listings get bonus points
    const daysSincePosted = car.createdAt ? 
      (Date.now() - new Date(car.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 999;
    if (daysSincePosted < 7) score += 100;
    if (daysSincePosted < 30) score += 50;
    
    // Savings get bonus points
    if (carHasSavings(car)) {
      const savings = calculateCarSavings(car);
      score += Math.min(savings / 1000, 200);
    }
    
    // Premium cars get moderate bonus
    if (carIsPremium(car)) {
      score += 75;
    }
    
    // Private sellers get bonus for diversity and personal touch
    if (carIsFromPrivateSeller(car)) {
      score += 50;
    }
    
    // Quality indicators
    if (car.images && car.images.length > 3) score += 25;
    if (car.description && car.description.length > 100) score += 10;
    if (car.specifications && Object.keys(car.specifications).length > 5) score += 10;
    
    // Verification bonus
    if (car.dealer?.verification?.isVerified) score += 20;
    
    // Add small random factor for variety
    score += Math.random() * 10;
    
    if (carId) {
      listingScoreCache.current.set(carId, score);
    }
    return score;
  }, [carHasSavings, calculateCarSavings, carIsPremium, carIsFromPrivateSeller]);

  // Generate similar cars data for all main cars
  const generateSimilarCarsData = useCallback((cars) => {
    const similarData = new Map();
    
    cars.forEach(car => {
      const carId = car._id || car.id;
      if (carId) {
        const similarCars = findSimilarCars(car, cars);
        similarData.set(carId, similarCars);
      }
    });
    
    setSimilarCarsData(similarData);
  }, [findSimilarCars]);

  // Horizontal scroll initialization
  const initializeHorizontalScroll = useCallback(() => {
    const containers = document.querySelectorAll('.horizontal-scroll-wrapper');
    
    containers.forEach(container => {
      let isScrolling = false;
      let startX = 0;
      let scrollLeft = 0;
      
      // Mouse events for desktop
      const handleMouseDown = (e) => {
        isScrolling = true;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.cursor = 'grabbing';
      };
      
      const handleMouseLeave = () => {
        isScrolling = false;
        container.style.cursor = 'grab';
      };
      
      const handleMouseUp = () => {
        isScrolling = false;
        container.style.cursor = 'grab';
      };
      
      const handleMouseMove = (e) => {
        if (!isScrolling) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
      };
      
      // Touch events for mobile
      const handleTouchStart = (e) => {
        startX = e.touches[0].pageX;
        scrollLeft = container.scrollLeft;
      };
      
      const handleTouchMove = (e) => {
        const x = e.touches[0].pageX;
        const walk = (x - startX) * 1.5;
        container.scrollLeft = scrollLeft - walk;
      };
      
      const handleTouchEnd = () => {
        const cardWidth = 320;
        const gap = 15;
        const itemWidth = cardWidth + gap;
        const currentIndex = Math.round(container.scrollLeft / itemWidth);
        
        container.scrollTo({
          left: currentIndex * itemWidth,
          behavior: 'smooth'
        });
      };
      
      // Add event listeners
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mouseleave', handleMouseLeave);
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchmove', handleTouchMove);
      container.addEventListener('touchend', handleTouchEnd);
    });
  }, []);

  // Memoized car filtering functions
  const getPremiumListings = useCallback((cars, limit = PREMIUM_CARS_PER_SECTION) => {
    if (!Array.isArray(cars) || cars.length === 0) return [];
    
    const premiumCars = cars.filter(car => {
      const classification = getCarClassification(car);
      return classification === 'premium' || classification === 'private-premium';
    });
    
    return premiumCars
      .sort((a, b) => {
        const scoreA = calculateListingScore(a);
        const scoreB = calculateListingScore(b);
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        
        if (Math.abs(scoreA - scoreB) > 10) {
          return scoreB - scoreA;
        }
        return priceB - priceA;
      })
      .slice(0, limit);
  }, [getCarClassification, calculateListingScore]);

  const getSavingsListings = useCallback((cars, limit = SAVINGS_CARS_PER_SECTION) => {
    if (!Array.isArray(cars) || cars.length === 0) return [];
    
    const savingsCars = cars.filter(car => {
      const classification = getCarClassification(car);
      return classification === 'savings' || classification === 'private-savings';
    });
    
    return savingsCars
      .sort((a, b) => {
        const savingsA = calculateCarSavings(a);
        const savingsB = calculateCarSavings(b);
        const scoreA = calculateListingScore(a);
        const scoreB = calculateListingScore(b);
        
        if (Math.abs(savingsA - savingsB) > 5000) {
          return savingsB - savingsA;
        }
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }, [getCarClassification, calculateCarSavings, calculateListingScore]);

  const getPrivateSellerListings = useCallback((cars, limit = PRIVATE_CARS_PER_SECTION) => {
    if (!Array.isArray(cars) || cars.length === 0) return [];
    
    const privateCars = cars.filter(car => {
      const classification = getCarClassification(car);
      return classification.startsWith('private');
    });
    
    return privateCars
      .sort((a, b) => {
        const scoreA = calculateListingScore(a);
        const scoreB = calculateListingScore(b);
        const classificationA = getCarClassification(a);
        const classificationB = getCarClassification(b);
        
        const priorityA = classificationA.includes('savings') ? 2 : classificationA.includes('premium') ? 1 : 0;
        const priorityB = classificationB.includes('savings') ? 2 : classificationB.includes('premium') ? 1 : 0;
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
        
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }, [getCarClassification, calculateListingScore]);

  const getAllListings = useCallback((cars, limit = CARS_PER_PAGE) => {
    if (!Array.isArray(cars) || cars.length === 0) return [];
    
    const categorizedCars = {
      premium: [],
      savings: [],
      private: [],
      privateSavings: [],
      privatePremium: [],
      regular: []
    };
    
    cars.forEach(car => {
      const classification = getCarClassification(car);
      switch (classification) {
        case 'premium':
          categorizedCars.premium.push(car);
          break;
        case 'savings':
          categorizedCars.savings.push(car);
          break;
        case 'private':
          categorizedCars.private.push(car);
          break;
        case 'private-savings':
          categorizedCars.privateSavings.push(car);
          break;
        case 'private-premium':
          categorizedCars.privatePremium.push(car);
          break;
        default:
          categorizedCars.regular.push(car);
      }
    });
    
    // Sort each category
    Object.keys(categorizedCars).forEach(category => {
      categorizedCars[category].sort((a, b) => calculateListingScore(b) - calculateListingScore(a));
    });
    
    // Mix categories for better diversity
    const mixedCars = [];
    const maxPerCategory = Math.ceil(limit / 6);
    
    for (let i = 0; i < maxPerCategory && mixedCars.length < limit; i++) {
      [
        categorizedCars.privateSavings,
        categorizedCars.premium,
        categorizedCars.savings,
        categorizedCars.privatePremium,
        categorizedCars.private,
        categorizedCars.regular
      ].forEach(category => {
        if (category[i] && mixedCars.length < limit) {
          mixedCars.push(category[i]);
        }
      });
    }
    
    return mixedCars.slice(0, limit);
  }, [getCarClassification, calculateListingScore]);

  // Enhanced total savings calculation
  const totalSavingsAmount = useMemo(() => {
    if (!Array.isArray(allCars) || allCars.length === 0) return 0;
    
    return allCars
      .filter(car => carHasSavings(car))
      .reduce((total, car) => total + calculateCarSavings(car), 0);
  }, [allCars, carHasSavings, calculateCarSavings]);

  // Get comprehensive section statistics
  const getSectionStatistics = useMemo(() => {
    const stats = {
      total: Array.isArray(allCars) ? allCars.length : 0,
      premium: 0,
      savings: 0,
      private: 0,
      privateSavings: 0,
      privatePremium: 0,
      dealership: 0,
      totalSavings: 0
    };
    
    if (!Array.isArray(allCars)) return stats;
    
    allCars.forEach(car => {
      if (!car) return;
      
      const classification = getCarClassification(car);
      
      switch (classification) {
        case 'premium':
          stats.premium++;
          stats.dealership++;
          break;
        case 'savings':
          stats.savings++;
          stats.dealership++;
          stats.totalSavings += calculateCarSavings(car);
          break;
        case 'private':
          stats.private++;
          break;
        case 'private-savings':
          stats.private++;
          stats.privateSavings++;
          stats.savings++;
          stats.totalSavings += calculateCarSavings(car);
          break;
        case 'private-premium':
          stats.private++;
          stats.privatePremium++;
          stats.premium++;
          break;
        default:
          stats.dealership++;
      }
    });
    
    return stats;
  }, [allCars, getCarClassification, calculateCarSavings]);

  // Get current section's cars
  const getCurrentSectionCars = useCallback(() => {
    switch (activeSection) {
      case 'premium':
        return getPremiumListings(allCars);
      case 'savings':
        return getSavingsListings(allCars);
      case 'private':
        return getPrivateSellerListings(allCars);
      case 'all':
      default:
        return getAllListings(allCars, visibleItems);
    }
  }, [activeSection, allCars, getPremiumListings, getSavingsListings, getPrivateSellerListings, getAllListings, visibleItems]);

  // Enhanced search filters
  const prepareSearchFilters = useCallback((searchParams) => {
    const filters = {};
    
    const searchTerm = searchParams.get('search') || searchParams.get('q') || searchParams.get('query');
    if (searchTerm?.trim()) {
      filters.search = searchTerm.trim();
    }
    
    const sellerType = searchParams.get('sellerType');
    if (sellerType && (sellerType === 'private' || sellerType === 'dealership')) {
      filters.sellerType = sellerType;
    }
    
    const filterMappings = {
      make: searchParams.get('make'),
      model: searchParams.get('model'),
      minPrice: searchParams.get('minPrice'),
      maxPrice: searchParams.get('maxPrice'),
      minYear: searchParams.get('minYear'),
      maxYear: searchParams.get('maxYear'),
      category: searchParams.get('category'),
      city: searchParams.get('city'),
      dealerId: searchParams.get('dealerId'),
      drivetrain: searchParams.get('drivetrain'),
      availability: searchParams.get('availability'),
      minMileage: searchParams.get('minMileage'),
      maxMileage: searchParams.get('maxMileage')
    };
    
    Object.entries(filterMappings).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== 'All') {
        if (['minPrice', 'maxPrice', 'minYear', 'maxYear', 'minMileage', 'maxMileage'].includes(key)) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue > 0) {
            filters[key] = numValue;
          }
        } else if (value.trim()) {
          filters[key] = value;
        }
      }
    });
    
    return filters;
  }, []);

  // Client-side text filtering
  const filterCarsByText = useCallback((cars, searchTerm) => {
    if (!searchTerm?.trim() || !Array.isArray(cars)) return cars;
    
    const search = searchTerm.toLowerCase().trim();
    const searchWords = search.split(/\s+/).filter(word => word.length > 0);
    
    return cars.filter(car => {
      if (!car) return false;
      
      const searchableFields = [
        car.title,
        car.make,
        car.model,
        car.description,
        car.specifications?.make,
        car.specifications?.model,
        car.specifications?.color,
        car.dealer?.businessName,
        car.dealer?.name,
        car.dealer?.privateSeller?.firstName,
        car.dealer?.privateSeller?.lastName,
        carIsFromPrivateSeller(car) ? 'private seller' : 'dealership',
        car.category,
        car.bodyStyle,
        car.fuelType,
        car.transmission,
        car.condition
      ].filter(Boolean);
      
      const searchText = searchableFields.join(' ').toLowerCase();
      return searchWords.every(word => searchText.includes(word));
    });
  }, [carIsFromPrivateSeller]);

  // Apply other filters
  const applyOtherFilters = useCallback((cars, filters) => {
    if (!Array.isArray(cars)) return [];
    
    let filtered = [...cars];
    
    if (filters.sellerType) {
      if (filters.sellerType === 'private') {
        filtered = filtered.filter(car => carIsFromPrivateSeller(car));
      } else if (filters.sellerType === 'dealership') {
        filtered = filtered.filter(car => !carIsFromPrivateSeller(car));
      }
    }
    
    if (filters.make) {
      const makeLower = filters.make.toLowerCase();
      filtered = filtered.filter(car => {
        const carMake = car.make || car.specifications?.make;
        return carMake && carMake.toLowerCase().includes(makeLower);
      });
    }
    
    if (filters.model) {
      const modelLower = filters.model.toLowerCase();
      filtered = filtered.filter(car => {
        const carModel = car.model || car.specifications?.model;
        return carModel && carModel.toLowerCase().includes(modelLower);
      });
    }
    
    if (filters.minPrice) {
      filtered = filtered.filter(car => {
        const price = parseFloat(car.price);
        return !isNaN(price) && price >= filters.minPrice;
      });
    }
    
    if (filters.maxPrice) {
      filtered = filtered.filter(car => {
        const price = parseFloat(car.price);
        return !isNaN(price) && price <= filters.maxPrice;
      });
    }
    
    if (filters.minYear) {
      filtered = filtered.filter(car => {
        const year = parseInt(car.year || car.specifications?.year);
        return !isNaN(year) && year >= filters.minYear;
      });
    }
    
    if (filters.maxYear) {
      filtered = filtered.filter(car => {
        const year = parseInt(car.year || car.specifications?.year);
        return !isNaN(year) && year <= filters.maxYear;
      });
    }
    
    if (filters.category) {
      const categoryLower = filters.category.toLowerCase();
      filtered = filtered.filter(car => {
        const category = car.category || car.bodyStyle;
        return category && category.toLowerCase().includes(categoryLower);
      });
    }
    
    if (filters.city) {
      const cityLower = filters.city.toLowerCase();
      filtered = filtered.filter(car => {
        const city = car.location?.city || car.dealer?.location?.city;
        return city && city.toLowerCase().includes(cityLower);
      });
    }
    
    return filtered;
  }, [carIsFromPrivateSeller]);

  // Enhanced search with retry logic
  const performSearch = useCallback(async (filters, page, retryCount = 0) => {
    const maxRetries = 3;
    
    try {
      const loadingMessages = {
        premium: 'Loading premium vehicles...',
        savings: 'Finding the best savings...',
        private: 'Loading private seller listings...',
        all: 'Loading all vehicles...'
      };
      setLoadingText(loadingMessages[activeSection] || 'Loading vehicles...');
      
      let response = await listingService.getListings(filters, page, 100);
      
      if (response?.listings?.length > 0) {
        return {
          success: true,
          listings: response.listings,
          pagination: {
            currentPage: response.currentPage || page,
            totalPages: response.totalPages || 1,
            total: response.total || response.listings.length
          }
        };
      }
      
      if (filters.search) {
        const allListingsResponse = await listingService.getListings({}, 1, 100);
        
        if (allListingsResponse?.listings) {
          const allListings = allListingsResponse.listings;
          const searchTerm = filters.search;
          
          const textFilteredCars = filterCarsByText(allListings, searchTerm);
          const fullyFilteredCars = applyOtherFilters(textFilteredCars, filters);
          
          return {
            success: true,
            listings: fullyFilteredCars,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              total: fullyFilteredCars.length
            },
            isClientSideFiltered: true
          };
        }
      }
      
      if (response && Array.isArray(response)) {
        return {
          success: true,
          listings: response,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(response.length / CARS_PER_PAGE),
            total: response.length
          }
        };
      }
      
      return {
        success: true,
        listings: [],
        pagination: { currentPage: 1, totalPages: 1, total: 0 }
      };
      
    } catch (error) {
      console.error(`Search attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return performSearch(filters, page, retryCount + 1);
      }
      
      return {
        success: false,
        error: error.message || 'Failed to load vehicles'
      };
    }
  }, [activeSection, filterCarsByText, applyOtherFilters]);

  // Debounced search execution
  const debouncedSearch = useMemo(
    () => debounce(async (searchParams) => {
      if (fetchInProgress.current) return;
      
      fetchInProgress.current = true;
      setLoading(true);
      setError(null);
      
      try {
        const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
        const filters = prepareSearchFilters(searchParams);
        
        const result = await performSearch(filters, page);
        
        if (result.success) {
          setAllCars(result.listings || []);
          setPagination(result.pagination);
          
          // Clear caches and generate similar cars
          listingScoreCache.current.clear();
          similarCarsCache.current.clear();
          generateSimilarCarsData(result.listings || []);
        } else {
          setError(result.error || 'Failed to load vehicles');
          setAllCars([]);
          setPagination({ currentPage: 1, totalPages: 1, total: 0 });
        }
        
      } catch (error) {
        console.error('Critical search error:', error);
        setError('An unexpected error occurred. Please try again.');
        setAllCars([]);
        setPagination({ currentPage: 1, totalPages: 1, total: 0 });
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
      }
    }, 300),
    [prepareSearchFilters, performSearch, generateSimilarCarsData]
  );

  // Load cars effect
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      debouncedSearch(searchParams);
    }, 100);
    
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (debouncedSearch?.cancel) {
        debouncedSearch.cancel();
      }
    };
  }, [location.search, debouncedSearch]);

  // Initialize horizontal scroll after data loads
  useEffect(() => {
    if (!loading && allCars.length > 0) {
      setTimeout(() => {
        initializeHorizontalScroll();
      }, 100);
    }
  }, [loading, allCars, initializeHorizontalScroll]);

  // Initialize active section
  useEffect(() => {
    initializeActiveSection();
  }, [initializeActiveSection]);

  // Section change handler
  const handleSectionChange = useCallback((section) => {
    if (section === activeSection) return;
    
    setActiveSection(section);
    
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('section', section);
    searchParams.delete('page');
    
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    }, { replace: true });
  }, [activeSection, navigate, location]);

  // Sharing handler
  const handleShare = useCallback((car, buttonRef) => {
    setSelectedCar(car);
    shareButtonRef.current = buttonRef;
    setShareModalOpen(true);
  }, []);

  const handleShareClose = useCallback(() => {
    setShareModalOpen(false);
    setSelectedCar(null);
    shareButtonRef.current = null;
  }, []);

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (allCars.length > visibleItems) {
      setVisibleItems(prev => Math.min(prev + 6, allCars.length));
    }
  }, [allCars.length, visibleItems]);

  // Retry handler
  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const searchParams = new URLSearchParams(location.search);
      await debouncedSearch(searchParams);
    } finally {
      setIsRetrying(false);
    }
  }, [location.search, debouncedSearch]);

  // Smooth scroll handler
  const handleScrollOptimization = useMemo(
    () => throttle(() => {
      const currentScrollY = window.scrollY;
      
      if (!isScrolling) {
        setIsScrolling(true);
        document.body.classList.add('is-scrolling');
      }
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        document.body.classList.remove('is-scrolling');
      }, 150);
      
      lastScrollY.current = currentScrollY;
    }, 16),
    [isScrolling]
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScrollOptimization, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollOptimization);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (handleScrollOptimization?.cancel) {
        handleScrollOptimization.cancel();
      }
    };
  }, [handleScrollOptimization]);

  // Get display data
  const displayData = useMemo(() => {
    const displayCars = getCurrentSectionCars();
    const stats = getSectionStatistics;
    
    return {
      displayCars: displayCars.slice(0, visibleItems),
      ...stats
    };
  }, [getCurrentSectionCars, getSectionStatistics, visibleItems]);

  // Component for horizontal scrolling car row
  const HorizontalCarRow = ({ mainCar, similarCars }) => {
    const allCarsInRow = [mainCar, ...similarCars];
    
    return (
      <div className="listing-container">
        <div className="horizontal-scroll-wrapper">
          <div className="cards-row">
            {allCarsInRow.map((car, index) => (
              <div 
                key={car._id || car.id || `car-${index}`}
                className={`car-card ${index === 0 ? 'main-listing' : 'similar-listing'}`}
              >
                <VehicleCard 
                  car={car}
                  onShare={handleShare}
                  compact={isMobile}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Scroll hint */}
        {showScrollHints && similarCars.length > 0 && (
          <div className="scroll-hint">
            👈 Swipe left to see similar cars
          </div>
        )}
      </div>
    );
  };

  // Early return for critical errors
  if (!location || !navigate) {
    return <div>Loading...</div>;
  }

  return (
    <div className="marketplace-container" ref={containerRef}>
      <MarketplaceFilters 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        counts={{
          all: displayData.total,
          premium: displayData.premium,
          savings: displayData.savings,
          private: displayData.private
        }}
      />
      
      <div className="marketplace-header">
        <div className="header-content">
          <div className="marketplace-stats">
            {loading ? (
              <span className="loading-text">{loadingText}</span>
            ) : error ? (
              <span className="error-text">Error loading data</span>
            ) : (
              <span>
                {activeSection === 'premium' 
                  ? `${displayData.premium} premium vehicles available ${displayData.privatePremium > 0 ? `(${displayData.privatePremium} from private sellers)` : ''}`
                  : activeSection === 'savings'
                  ? `${displayData.savings} vehicles with savings • Total savings: P${displayData.totalSavings.toLocaleString()} ${displayData.privateSavings > 0 ? `• ${displayData.privateSavings} from private sellers` : ''}`
                  : activeSection === 'private'
                  ? `${displayData.private} vehicles from private sellers ${displayData.privateSavings > 0 ? `• ${displayData.privateSavings} with savings` : ''} ${displayData.privatePremium > 0 ? `• ${displayData.privatePremium} premium` : ''}`
                  : `${displayData.total} vehicles available • ${displayData.premium} premium • ${displayData.savings} with savings • ${displayData.private} private sellers`
                }
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <div className="loading-content">
            <h3>{loadingText}</h3>
            <p>
              {activeSection === 'premium' 
                ? 'Finding the finest vehicles from dealers and private sellers...'
                : activeSection === 'savings'
                ? 'Calculating your potential savings across all sellers...'
                : activeSection === 'private'
                ? 'Loading listings from verified private sellers...'
                : 'Loading all available vehicles from dealers and private sellers...'
              }
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <h3>Search Error</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button 
              className="retry-button" 
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
            <button 
              className="clear-filters-button" 
              onClick={() => navigate('/marketplace')}
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Main Section Display */}
          {displayData.displayCars.length > 0 ? (
            <div className="marketplace-sections">
              {/* Premium Section */}
              {activeSection === 'premium' && (
                <div className="premium-section" id="premium-panel" role="tabpanel">
                  <div className="section-header">
                    <h2>👑 Premium Collection</h2>
                    <p>
                      Discover our finest selection of luxury and high-end vehicles from verified dealers and private sellers
                      {displayData.privatePremium > 0 && (
                        <span className="private-seller-count">
                          • {displayData.privatePremium} premium vehicles from private sellers
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="horizontal-listings">
                    {displayData.displayCars.map((car) => {
                      const carId = car._id || car.id;
                      const similarCars = similarCarsData.get(carId) || [];
                      
                      return (
                        <HorizontalCarRow
                          key={carId}
                          mainCar={car}
                          similarCars={similarCars}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Savings Section */}
              {activeSection === 'savings' && (
                <div className="savings-section" id="savings-panel" role="tabpanel">
                  <div className="section-header">
                    <h2>💰 Save with BW Car Culture</h2>
                    <p>
                      Exclusive deals and savings available from dealers and private sellers
                      {totalSavingsAmount > 0 && (
                        <span className="total-savings">
                          • Total potential savings: <strong>P{totalSavingsAmount.toLocaleString()}</strong>
                        </span>
                      )}
                      {displayData.privateSavings > 0 && (
                        <span className="private-seller-count">
                          • {displayData.privateSavings} deals from private sellers
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="horizontal-listings">
                    {displayData.displayCars.map((car) => {
                      const carId = car._id || car.id;
                      const similarCars = similarCarsData.get(carId) || [];
                      
                      return (
                        <HorizontalCarRow
                          key={carId}
                          mainCar={car}
                          similarCars={similarCars}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Private Sellers Section */}
              {activeSection === 'private' && (
                <div className="private-section" id="private-panel" role="tabpanel">
                  <div className="section-header">
                    <h2>🤝 Private Sellers</h2>
                    <p>
                      Quality vehicles from individual owners with personal stories
                      {displayData.privateSavings > 0 && (
                        <span className="private-seller-count">
                          • {displayData.privateSavings} with exclusive savings
                        </span>
                      )}
                      {displayData.privatePremium > 0 && (
                        <span className="private-seller-count">
                          • {displayData.privatePremium} premium listings
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="horizontal-listings">
                    {displayData.displayCars.map((car) => {
                      const carId = car._id || car.id;
                      const similarCars = similarCarsData.get(carId) || [];
                      
                      return (
                        <HorizontalCarRow
                          key={carId}
                          mainCar={car}
                          similarCars={similarCars}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Vehicles Section */}
              {activeSection === 'all' && (
                <div className="all-section" id="all-panel" role="tabpanel">
                  <div className="section-header">
                    <h2>🚗 All Vehicles</h2>
                    <p>
                      Browse our complete inventory of vehicles from dealers and private sellers
                      {(displayData.premium > 0 || displayData.savings > 0 || displayData.private > 0) && (
                        <span className="section-stats">
                          • {displayData.premium} premium • {displayData.savings} with savings • {displayData.private} private sellers
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="horizontal-listings">
                    {displayData.displayCars.map((car) => {
                      const carId = car._id || car.id;
                      const similarCars = similarCarsData.get(carId) || [];
                      
                      return (
                        <HorizontalCarRow
                          key={carId}
                          mainCar={car}
                          similarCars={similarCars}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Load More Button */}
                  {allCars.length > visibleItems && (
                    <div className="load-more-container">
                      <button 
                        className="load-more-btn"
                        onClick={handleLoadMore}
                        disabled={isScrolling}
                      >
                        {isScrolling ? 'Loading...' : `Load More (${allCars.length - visibleItems} remaining)`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                {activeSection === 'premium' ? '👑' : 
                 activeSection === 'savings' ? '💰' : 
                 activeSection === 'private' ? '🤝' : '🚗'}
              </div>
              <h2>
                {activeSection === 'premium' 
                  ? 'No premium vehicles found'
                  : activeSection === 'savings'
                  ? 'No savings available right now'
                  : activeSection === 'private'
                  ? 'No private seller listings found'
                  : 'No vehicles found'
                }
              </h2>
              <p>
                {activeSection === 'premium' 
                  ? 'Try adjusting your filters or check back later for new premium listings from dealers and private sellers.'
                  : activeSection === 'savings'
                  ? 'Check back soon for new exclusive deals and savings opportunities from all our sellers.'
                  : activeSection === 'private'
                  ? 'Try adjusting your filters or check back later for new private seller listings.'
                  : 'Try adjusting your search filters or check back later for new listings.'
                }
              </p>
              <div className="empty-actions">
                {activeSection !== 'all' && (
                  <button 
                    className="switch-section-btn" 
                    onClick={() => handleSectionChange('all')}
                  >
                    View All Vehicles
                  </button>
                )}
                <button 
                  className="clear-filters-button" 
                  onClick={() => navigate('/marketplace')}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Share Modal */}
      {shareModalOpen && selectedCar && (
        <ShareModal
          car={selectedCar}
          onClose={handleShareClose}
          buttonRef={shareButtonRef}
        />
      )}
    </div>
  );
};

export default MarketplaceList;