// src/components/features/MarketplaceSection/MarketplaceList.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { debounce, throttle } from 'lodash';
import { listingService } from '../../../services/listingService.js';
import VehicleCard from '../../shared/VehicleCard/VehicleCard.js';
import ShareModal from '../../shared/ShareModal.js';
import CreateListingPromoCard from './CreateListingPromoCard.js';
import MarketplaceFilters from './MarketplaceFilters.js'; 
import './MarketplaceList.css';

const CARS_PER_PAGE = 12;
const PREMIUM_CARS_PER_SECTION = 9;
const SAVINGS_CARS_PER_SECTION = 9;
const PRIVATE_CARS_PER_SECTION = 12;
const MOBILE_BREAKPOINT = 768;
const SIMILAR_CARS_LIMIT = 3;
const PROMO_CARD_FREQUENCY = 8; // Show promo card every 8 listings

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

  // Similar cars functionality (only for mobile)
  const [similarCarsData, setSimilarCarsData] = useState(new Map());

  // Initialize active section from URL immediately with caching
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const sectionParam = searchParams.get('section');
    
    if (sectionParam && ['premium', 'savings', 'private', 'all'].includes(sectionParam)) {
      setActiveSection(sectionParam);
    } else {
      // Check for cached section preference
      try {
        const cachedSection = sessionStorage.getItem('preferredSection');
        if (cachedSection && ['premium', 'savings', 'private', 'all'].includes(cachedSection)) {
          setActiveSection(cachedSection);
        }
      } catch (e) {
        // Ignore localStorage errors
        console.warn('Could not access sessionStorage:', e);
      }
    }
  }, [location.search]);

  // Cache section preference
  useEffect(() => {
    try {
      sessionStorage.setItem('preferredSection', activeSection);
    } catch (e) {
      // Ignore localStorage errors
      console.warn('Could not access sessionStorage:', e);
    }
  }, [activeSection]);

  // Optimized mobile detection with debounce
  const debouncedResizeHandler = useMemo(
    () => debounce(() => {
      const newIsMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        
        // Adjust visible items for mobile
        if (newIsMobile) {
          setVisibleItems(prev => Math.min(prev, 8));
        }
      }
    }, 250),
    [isMobile]
  );

  useEffect(() => {
    window.addEventListener('resize', debouncedResizeHandler, { passive: true });
    return () => {
      window.removeEventListener('resize', debouncedResizeHandler);
      debouncedResizeHandler.cancel();
    };
  }, [debouncedResizeHandler]);

  // Function to inject promo cards randomly into listings
  const injectPromoCards = useCallback((cars, frequency = PROMO_CARD_FREQUENCY) => {
    if (!Array.isArray(cars) || cars.length === 0) return cars;
    
    const result = [];
    let promoCardCount = 0;
    
    cars.forEach((car, index) => {
      result.push(car);
      
      // Add promo card at strategic intervals with some randomization
      const shouldAddPromo = (index + 1) % frequency === 0 && 
                             index > 3 && // Don't add in first few positions
                             promoCardCount < Math.ceil(cars.length / frequency); // Limit total promo cards
      
      if (shouldAddPromo) {
        result.push({
          _id: `promo-card-${promoCardCount}`,
          id: `promo-card-${promoCardCount}`,
          isPromoCard: true,
          promoIndex: promoCardCount
        });
        promoCardCount++;
      }
    });
    
    return result;
  }, []);

  // Memoized car classification functions (ORIGINAL WORKING LOGIC)
  const carHasSavings = useCallback((car) => {
    if (!car?.priceOptions) return false;
    
    const { originalPrice, savingsAmount, showSavings } = car.priceOptions;
    
    if (!showSavings) return false;
    
    return (savingsAmount && savingsAmount > 0) || 
           (originalPrice && originalPrice > car.price);
  }, []);

  const calculateCarSavings = useCallback((car) => {
    if (!carHasSavings(car)) return 0;
    
    const { originalPrice, savingsAmount } = car.priceOptions || {};
    
    if (savingsAmount && savingsAmount > 0) {
      return savingsAmount;
    }
    
    if (originalPrice && originalPrice > car.price) {
      return originalPrice - car.price;
    }
    
    return 0;
  }, [carHasSavings]);

  const carIsPremium = useCallback((car) => {
    if (!car || carHasSavings(car)) return false;
    
    const price = parseFloat(car.price) || 0;
    const premiumCategories = ['luxury', 'sports car', 'exotic', 'premium'];
    const premiumMakes = ['BMW', 'Mercedes-Benz', 'Audi', 'Lexus', 'Porsche', 'Ferrari', 'Lamborghini', 'Maserati'];
    
    const category = (car.category || '').toLowerCase();
    const make = (car.make || car.specifications?.make || '').toLowerCase();
    
    return price > 500000 || 
           premiumCategories.some(cat => category.includes(cat)) ||
           premiumMakes.some(brand => make.includes(brand.toLowerCase()));
  }, [carHasSavings]);

  // ENHANCED: Improved private seller detection with better logic
  const carIsFromPrivateSeller = useCallback((car) => {
    if (!car || !car.dealer) return false;
    
    // Primary check: explicit seller type
    if (car.dealer.sellerType === 'private') return true;
    
    // Secondary check: has private seller data structure
    if (car.dealer.privateSeller && 
        car.dealer.privateSeller.firstName && 
        car.dealer.privateSeller.lastName) {
      return true;
    }
    
    // Tertiary check: business name patterns that indicate private sellers
    const businessName = (car.dealer.businessName || '').toLowerCase();
    const privateIndicators = ['private seller', 'private', 'individual', 'owner', 'personal'];
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

  // Simple similar car matching (only for mobile)
  const findSimilarCars = useCallback((mainCar, allCars, maxResults = SIMILAR_CARS_LIMIT) => {
    if (!isMobile || !mainCar || !allCars || allCars.length === 0) return [];
    
    const carId = mainCar._id || mainCar.id;
    
    // Check cache first
    if (similarCarsCache.current.has(carId)) {
      return similarCarsCache.current.get(carId);
    }
    
    const similar = allCars
      .filter(car => (car._id || car.id) !== carId)
      .filter(car => {
        // Simple similarity: same category or same make
        return car.category === mainCar.category || 
               car.specifications?.make === mainCar.specifications?.make;
      })
      .sort((a, b) => calculateListingScore(b) - calculateListingScore(a))
      .slice(0, maxResults);
    
    // Cache the result
    similarCarsCache.current.set(carId, similar);
    return similar;
  }, [isMobile, calculateListingScore]);

  // Generate similar cars data (only for mobile)
  const generateSimilarCarsData = useCallback((cars) => {
    if (!isMobile) return;
    
    const similarData = new Map();
    
    cars.forEach(car => {
      const carId = car._id || car.id;
      if (carId && !car.isPromoCard) { // Skip promo cards for similar car generation
        const similarCars = findSimilarCars(car, cars.filter(c => !c.isPromoCard));
        similarData.set(carId, similarCars);
      }
    });
    
    setSimilarCarsData(similarData);
  }, [isMobile, findSimilarCars]);

  // Memoized and optimized car filtering functions (ORIGINAL WORKING LOGIC)
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
        
        // Primary sort by score, secondary by price (higher first for premium)
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
        
        // Primary sort by savings amount, secondary by score
        if (Math.abs(savingsA - savingsB) > 5000) {
          return savingsB - savingsA;
        }
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }, [getCarClassification, calculateCarSavings, calculateListingScore]);

  // ENHANCED: Better private seller listings with improved sorting
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
        
        // Prioritize private sellers with savings or premium features
        const priorityA = classificationA.includes('savings') ? 2 : classificationA.includes('premium') ? 1 : 0;
        const priorityB = classificationB.includes('savings') ? 2 : classificationB.includes('premium') ? 1 : 0;
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
        
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }, [getCarClassification, calculateListingScore]);

  // ENHANCED: Better mixed listing algorithm with promo card injection
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
    
    // Categorize all cars (excluding promo cards)
    cars.filter(car => !car.isPromoCard).forEach(car => {
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
    
    // Intelligent interleaving for variety
    const mixed = [];
    const maxLength = Math.max(...Object.values(categorizedCars).map(arr => arr.length));
    
    for (let i = 0; i < maxLength && mixed.length < limit; i++) {
      // Priority order: savings (including private), premium (including private), private, regular
      if (categorizedCars.privateSavings[i] && mixed.length < limit) mixed.push(categorizedCars.privateSavings[i]);
      if (categorizedCars.savings[i] && mixed.length < limit) mixed.push(categorizedCars.savings[i]);
      if (categorizedCars.privatePremium[i] && mixed.length < limit) mixed.push(categorizedCars.privatePremium[i]);
      if (categorizedCars.premium[i] && mixed.length < limit) mixed.push(categorizedCars.premium[i]);
      if (categorizedCars.private[i] && mixed.length < limit) mixed.push(categorizedCars.private[i]);
      if (categorizedCars.regular[i] && mixed.length < limit) mixed.push(categorizedCars.regular[i]);
    }
    
    // Inject promo cards
    return injectPromoCards(mixed.slice(0, limit));
  }, [getCarClassification, calculateListingScore, injectPromoCards]);

  // Enhanced total savings calculation including private sellers
  const totalSavingsAmount = useMemo(() => {
    if (!Array.isArray(allCars) || allCars.length === 0) return 0;
    
    return allCars
      .filter(car => !car.isPromoCard && carHasSavings(car))
      .reduce((total, car) => total + calculateCarSavings(car), 0);
  }, [allCars, carHasSavings, calculateCarSavings]);

  // ENHANCED: Get comprehensive section statistics (excluding promo cards)
  const getSectionStatistics = useMemo(() => {
    const stats = {
      total: Array.isArray(allCars) ? allCars.filter(car => !car.isPromoCard).length : 0,
      premium: 0,
      savings: 0,
      private: 0,
      privateSavings: 0,
      privatePremium: 0,
      dealership: 0,
      totalSavings: 0
    };
    
    if (!Array.isArray(allCars)) return stats;
    
    allCars.filter(car => !car.isPromoCard).forEach(car => {
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

  // Get current section's cars with memoization
  const getCurrentSectionCars = useCallback(() => {
    const realCars = allCars.filter(car => !car.isPromoCard);
    
    switch (activeSection) {
      case 'premium':
        return injectPromoCards(getPremiumListings(realCars), 6); // Less frequent for premium
      case 'savings':
        return injectPromoCards(getSavingsListings(realCars), 7); // Moderate frequency
      case 'private':
        return injectPromoCards(getPrivateSellerListings(realCars), 8); // Regular frequency
      case 'all':
      default:
        return getAllListings(allCars, visibleItems);
    }
  }, [activeSection, allCars, getPremiumListings, getSavingsListings, getPrivateSellerListings, getAllListings, visibleItems, injectPromoCards]);

  // ENHANCED: Better search filters with private seller support
  const prepareSearchFilters = useCallback((searchParams) => {
    const filters = {};
    
    // Enhanced text search
    const searchTerm = searchParams.get('search') || searchParams.get('q') || searchParams.get('query');
    if (searchTerm?.trim()) {
      const cleanSearch = searchTerm.trim();
      filters.search = cleanSearch;
    }
    
    // ENHANCED: Add seller type filter
    const sellerType = searchParams.get('sellerType');
    if (sellerType && (sellerType === 'private' || sellerType === 'dealership')) {
      filters.sellerType = sellerType;
    }
    
    // Standard filters with validation
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
      if (value && value.trim() !== '') {
        filters[key] = value.trim();
      }
    });
    
    return filters;
  }, []);

  // Enhanced search function with text matching
  const applyTextSearch = useCallback((cars, searchTerm) => {
    if (!searchTerm || !Array.isArray(cars)) return cars;
    
    const searchWords = searchTerm.toLowerCase().split(' ').filter(word => word.length > 0);
    
    return cars.filter(car => {
      // Skip promo cards in search
      if (car.isPromoCard) return true;
      
      const searchableFields = [
        car.title,
        car.description,
        car.make,
        car.model,
        car.specifications?.make,
        car.specifications?.model,
        car.dealer?.businessName,
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
      
      // Match all search words
      return searchWords.every(word => searchText.includes(word));
    });
  }, [carIsFromPrivateSeller]);

  // ENHANCED: Apply other filters with seller type support
  const applyOtherFilters = useCallback((cars, filters) => {
    if (!Array.isArray(cars)) return [];
    
    let filtered = [...cars];
    
    // Use array methods efficiently
    const filterFunctions = [];
    
    // ENHANCED: Seller type filter
    if (filters.sellerType) {
      if (filters.sellerType === 'private') {
        filterFunctions.push(car => car.isPromoCard || carIsFromPrivateSeller(car));
      } else if (filters.sellerType === 'dealership') {
        filterFunctions.push(car => car.isPromoCard || !carIsFromPrivateSeller(car));
      }
    }
    
    if (filters.make) {
      const makeLower = filters.make.toLowerCase();
      filterFunctions.push(car => {
        if (car.isPromoCard) return true;
        const carMake = car.make || car.specifications?.make;
        return carMake && carMake.toLowerCase().includes(makeLower);
      });
    }
    
    if (filters.model) {
      const modelLower = filters.model.toLowerCase();
      filterFunctions.push(car => {
        if (car.isPromoCard) return true;
        const carModel = car.model || car.specifications?.model;
        return carModel && carModel.toLowerCase().includes(modelLower);
      });
    }
    
    if (filters.minPrice) {
      filterFunctions.push(car => {
        if (car.isPromoCard) return true;
        const price = parseFloat(car.price);
        return !isNaN(price) && price >= filters.minPrice;
      });
    }
    
    if (filters.maxPrice) {
      filterFunctions.push(car => {
        if (car.isPromoCard) return true;
        const price = parseFloat(car.price);
        return !isNaN(price) && price <= filters.maxPrice;
      });
    }
    
    if (filters.minYear) {
      filterFunctions.push(car => {
        if (car.isPromoCard) return true;
        const year = parseInt(car.year || car.specifications?.year);
        return !isNaN(year) && year >= filters.minYear;
      });
    }
    
    if (filters.maxYear) {
      filterFunctions.push(car => {
        if (car.isPromoCard) return true;
        const year = parseInt(car.year || car.specifications?.year);
        return !isNaN(year) && year <= filters.maxYear;
      });
    }
    
    if (filters.category) {
      const categoryLower = filters.category.toLowerCase();
      filterFunctions.push(car => {
        if (car.isPromoCard) return true;
        const category = car.category || car.bodyStyle;
        return category && category.toLowerCase().includes(categoryLower);
      });
    }
    
    if (filters.city) {
      const cityLower = filters.city.toLowerCase();
      filterFunctions.push(car => {
        if (car.isPromoCard) return true;
        const city = car.location?.city || car.dealer?.location?.city;
        return city && city.toLowerCase().includes(cityLower);
      });
    }
    
    // Apply all filters
    for (const filterFn of filterFunctions) {
      filtered = filtered.filter(filterFn);
    }
    
    return filtered;
  }, [carIsFromPrivateSeller]);

  // Enhanced search with better error handling and retry logic
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
      
      // Enhanced API call with better error handling
      const response = await listingService.getListings(filters, page);
      
      if (!response || !response.listings) {
        throw new Error('Invalid response from server');
      }
      
      let cars = response.listings;
      
      // Apply client-side filtering if needed
      if (filters.search) {
        cars = applyTextSearch(cars, filters.search);
      }
      
      cars = applyOtherFilters(cars, filters);
      
      setAllCars(cars);
      setPagination({
        currentPage: response.pagination?.currentPage || 1,
        totalPages: response.pagination?.totalPages || 1,
        total: cars.filter(car => !car.isPromoCard).length
      });
      
      // Generate similar cars for mobile
      if (isMobile && cars.length > 0) {
        generateSimilarCarsData(cars);
      }
      
      setError(null);
      
    } catch (error) {
      console.error('Search error:', error);
      
      if (retryCount < maxRetries) {
        setTimeout(() => performSearch(filters, page, retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      setError(error.message || 'Failed to load vehicles. Please try again.');
      setAllCars([]);
      setPagination({ currentPage: 1, totalPages: 1, total: 0 });
    }
  }, [activeSection, applyTextSearch, applyOtherFilters, isMobile, generateSimilarCarsData]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(async (searchParams) => {
      if (fetchInProgress.current) return;
      
      fetchInProgress.current = true;
      setLoading(true);
      setError(null);
      
      try {
        const filters = prepareSearchFilters(searchParams);
        await performSearch(filters, 1);
      } catch (error) {
        console.error('Search error:', error);
        setError('Failed to search vehicles. Please try again.');
        setAllCars([]);
        setPagination({ currentPage: 1, totalPages: 1, total: 0 });
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
      }
    }, 300),
    [prepareSearchFilters, performSearch, generateSimilarCarsData]
  );

  // Load cars effect with cleanup
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // Clear previous timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // Add small delay to prevent excessive API calls
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

  // Optimized section change handler
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

  // Optimized sharing handler
  const handleShare = useCallback((car, buttonRef) => {
    setSelectedCar(car);
    shareButtonRef.current = buttonRef;
    setShareModalOpen(true);
  }, []);

  // Virtual scrolling for large datasets
  const handleLoadMore = useCallback(() => {
    if (allCars.filter(car => !car.isPromoCard).length > visibleItems) {
      setVisibleItems(prev => Math.min(prev + 6, allCars.length));
    }
  }, [allCars, visibleItems]);

  // Retry handler with better UX
  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setError(null);
    
    try {
      // Wait a bit for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const searchParams = new URLSearchParams(location.search);
      await debouncedSearch(searchParams);
    } finally {
      setIsRetrying(false);
    }
  }, [location.search, debouncedSearch]);

  // Mobile horizontal scroll initialization (remove snapping only)
  useEffect(() => {
    if (!isMobile || !allCars.length) return;

    const containers = document.querySelectorAll('.mobile-horizontal-scroll');
    
    containers.forEach(container => {
      // Keep the container setup but remove the snapping behavior
      container.style.webkitOverflowScrolling = 'touch';
      
      // Remove the handleTouchEnd function - this was causing the snapping
      // Just let natural scrolling work without forced positioning
    });
  }, [isMobile, allCars.length]);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    if (!containerRef.current || allCars.filter(car => !car.isPromoCard).length <= visibleItems) return;
    
    const options = {
      rootMargin: '200px',
      threshold: 0.1
    };
    
    const currentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          handleLoadMore();
        }
      });
    }, options);
    
    observerRef.current = currentObserver;
    
    const sentinel = containerRef.current.querySelector('.load-more-sentinel');
    if (sentinel) {
      currentObserver.observe(sentinel);
    }
    
    return () => {
      if (currentObserver) {
        currentObserver.disconnect();
      }
    };
  }, [allCars.length, visibleItems, handleLoadMore]);

  // Smooth scroll handler for better UX
  const handleScrollOptimization = useMemo(
    () => throttle(() => {
      const currentScrollY = window.scrollY;
      
      // Add scrolling class for CSS optimizations
      if (!isScrolling) {
        setIsScrolling(true);
        document.body.classList.add('is-scrolling');
      }
      
      // Clear scrolling state after delay
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        document.body.classList.remove('is-scrolling');
      }, 150);
      
      lastScrollY.current = currentScrollY;
    }, 16), // 60fps
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

  // Get display cars and counts with memoization
  const displayData = useMemo(() => {
    const displayCars = getCurrentSectionCars();
    const stats = getSectionStatistics;
    
    return {
      displayCars: displayCars.slice(0, visibleItems),
      ...stats
    };
  }, [getCurrentSectionCars, getSectionStatistics, visibleItems]);

  // Mobile horizontal car row component with promo card support
  const MobileHorizontalCarRow = ({ mainCar, similarCars }) => {
    const allCarsInRow = [mainCar, ...similarCars];
    
    return (
      <div className="mobile-horizontal-scroll">
        <div className="mobile-cards-row">
          {allCarsInRow.map((car, index) => (
            <div 
              key={car._id || car.id || `car-${index}`} 
              className="mobile-car-card"
            >
              {car.isPromoCard ? (
                <CreateListingPromoCard compact={true} />
              ) : (
                <VehicleCard 
                  car={car}
                  onShare={handleShare}
                  compact={true}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Early return if there's a critical error
  if (!location || !navigate) {
    return <div>Loading...</div>;
  }

  return (
    <div className="marketplace-container" ref={containerRef}>
      <MarketplaceFilters 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
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
            <p>Finding the best vehicles for you...</p>
          </div>
        </div>
      ) : error ? (
        /* Error State */
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button 
              className="retry-button" 
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </div>
      ) : displayData.displayCars.filter(car => !car.isPromoCard).length === 0 ? (
        /* Empty State */
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No vehicles found</h3>
          <p>Try adjusting your search criteria or browse all available vehicles.</p>
          <div className="empty-actions">
            <button 
              className="switch-section-btn"
              onClick={() => handleSectionChange('all')}
            >
              View All Vehicles
            </button>
          </div>
        </div>
      ) : (
        /* Vehicle Listings */
        <div className="marketplace-sections">
          {/* Premium Section */}
          {activeSection === 'premium' && (
            <div className="premium-section" id="premium-panel" role="tabpanel">
              <div className="section-header">
                <h2>Premium Vehicles</h2>
                <p>
                  Exceptional vehicles with premium features and verified quality
                  {displayData.privatePremium > 0 && (
                    <span className="premium-count">
                      • {displayData.privatePremium} from trusted private sellers
                    </span>
                  )}
                </p>
              </div>
              <div className={`marketplace-grid premium-grid ${isMobile ? 'mobile-horizontal' : ''}`}>
                {isMobile ? (
                  displayData.displayCars.map((car, index) => {
                    if (car.isPromoCard) {
                      return (
                        <div key={car._id} className="mobile-horizontal-scroll">
                          <div className="mobile-cards-row">
                            <div className="mobile-car-card">
                              <CreateListingPromoCard compact={true} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    const carId = car._id || car.id;
                    const similarCars = similarCarsData.get(carId) || [];
                    
                    return (
                      <MobileHorizontalCarRow
                        key={carId}
                        mainCar={car}
                        similarCars={similarCars}
                      />
                    );
                  })
                ) : (
                  displayData.displayCars.map((car, index) => (
                    car.isPromoCard ? (
                      <CreateListingPromoCard key={car._id} compact={false} />
                    ) : (
                      <VehicleCard 
                        key={car._id || car.id || `premium-${index}`}
                        car={car}
                        onShare={handleShare}
                        compact={isMobile}
                      />
                    )
                  ))
                )}
              </div>
            </div>
          )}

          {/* Savings Section */}
          {activeSection === 'savings' && (
            <div className="savings-section" id="savings-panel" role="tabpanel">
              <div className="section-header">
                <h2>💰 Best Savings</h2>
                <p>
                  Vehicles with the biggest savings and best value deals
                  <span className="total-savings">
                    • Total savings available: P{displayData.totalSavings.toLocaleString()}
                  </span>
                  {displayData.privateSavings > 0 && (
                    <span className="private-seller-count">
                      • {displayData.privateSavings} exclusive deals from private sellers
                    </span>
                  )}
                </p>
              </div>
              <div className={`marketplace-grid savings-grid ${isMobile ? 'mobile-horizontal' : ''}`}>
                {isMobile ? (
                  displayData.displayCars.map((car, index) => {
                    if (car.isPromoCard) {
                      return (
                        <div key={car._id} className="mobile-horizontal-scroll">
                          <div className="mobile-cards-row">
                            <div className="mobile-car-card">
                              <CreateListingPromoCard compact={true} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    const carId = car._id || car.id;
                    const similarCars = similarCarsData.get(carId) || [];
                    
                    return (
                      <MobileHorizontalCarRow
                        key={carId}
                        mainCar={car}
                        similarCars={similarCars}
                      />
                    );
                  })
                ) : (
                  displayData.displayCars.map((car, index) => (
                    car.isPromoCard ? (
                      <CreateListingPromoCard key={car._id} compact={false} />
                    ) : (
                      <VehicleCard 
                        key={car._id || car.id || `savings-${index}`}
                        car={car}
                        onShare={handleShare}
                        compact={isMobile}
                      />
                    )
                  ))
                )}
              </div>
            </div>
          )}

          {/* Private Sellers Section */}
          {activeSection === 'private' && (
            <div className="private-section" id="private-panel" role="tabpanel">
              <div className="section-header">
                <h2>Private Sellers</h2>
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
              <div className={`marketplace-grid private-grid ${isMobile ? 'mobile-horizontal' : ''}`}>
                {isMobile ? (
                  displayData.displayCars.map((car, index) => {
                    if (car.isPromoCard) {
                      return (
                        <div key={car._id} className="mobile-horizontal-scroll">
                          <div className="mobile-cards-row">
                            <div className="mobile-car-card">
                              <CreateListingPromoCard compact={true} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    const carId = car._id || car.id;
                    const similarCars = similarCarsData.get(carId) || [];
                    
                    return (
                      <MobileHorizontalCarRow
                        key={carId}
                        mainCar={car}
                        similarCars={similarCars}
                      />
                    );
                  })
                ) : (
                  displayData.displayCars.map((car, index) => (
                    car.isPromoCard ? (
                      <CreateListingPromoCard key={car._id} compact={false} />
                    ) : (
                      <VehicleCard 
                        key={car._id || car.id || `private-${index}`}
                        car={car}
                        onShare={handleShare}
                        compact={isMobile}
                      />
                    )
                  ))
                )}
              </div>
            </div>
          )}

          {/* All Vehicles Section */}
          {activeSection === 'all' && (
            <div className="all-section" id="all-panel" role="tabpanel">
              <div className="section-header">
                <h2>All Vehicles</h2>
                <p>
                  Browse our complete inventory of vehicles from dealers and private sellers
                  {(displayData.premium > 0 || displayData.savings > 0 || displayData.private > 0) && (
                    <span className="section-stats">
                      • {displayData.premium} premium • {displayData.savings} with savings • {displayData.private} private sellers
                    </span>
                  )}
                </p>
              </div>
              <div className={`marketplace-grid all-grid ${isMobile ? 'mobile-horizontal' : ''}`}>
                {isMobile ? (
                  displayData.displayCars.map((car, index) => {
                    if (car.isPromoCard) {
                      return (
                        <div key={car._id} className="mobile-horizontal-scroll">
                          <div className="mobile-cards-row">
                            <div className="mobile-car-card">
                              <CreateListingPromoCard compact={true} />
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    const carId = car._id || car.id;
                    const similarCars = similarCarsData.get(carId) || [];
                    
                    return (
                      <MobileHorizontalCarRow
                        key={carId}
                        mainCar={car}
                        similarCars={similarCars}
                      />
                    );
                  })
                ) : (
                  displayData.displayCars.map((car, index) => (
                    car.isPromoCard ? (
                      <CreateListingPromoCard key={car._id} compact={false} />
                    ) : (
                      <VehicleCard 
                        key={car._id || car.id || `all-${index}`}
                        car={car}
                        onShare={handleShare}
                        compact={isMobile}
                      />
                    )
                  ))
                )}
              </div>
              
              {/* Load More Sentinel for Infinite Scroll */}
              {allCars.filter(car => !car.isPromoCard).length > visibleItems && (
                <div className="load-more-container">
                  <div className="load-more-sentinel"></div>
                  <button 
                    className="load-more-btn"
                    onClick={handleLoadMore}
                    disabled={isScrolling}
                  >
                    {isScrolling ? 'Loading...' : `Load More (${allCars.filter(car => !car.isPromoCard).length - visibleItems} remaining)`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Share Modal */}
      {shareModalOpen && selectedCar && (
        <ShareModal 
          car={selectedCar}
          onClose={() => setShareModalOpen(false)}
          buttonRef={shareButtonRef}
        />
      )}
    </div>
  );
};

export default MarketplaceList;