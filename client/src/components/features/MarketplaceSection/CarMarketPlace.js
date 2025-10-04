// src/components/features/MarketplaceSection/CarMarketPlace.js
// COMPLETE VERSION WITH IMPROVED FULLSCREEN & BUTTON LAYOUT
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './CarMarketPlace.css';
import VehicleCard from '../../shared/VehicleCard/VehicleCard.js';
import ShareModal from '../../shared/ShareModal.js';
import { listingService } from '../../../services/listingService.js';
import { newsService } from '../../../services/newsService.js';
import { useSelector, useDispatch } from 'react-redux';
import { addNotification } from '../../../store/slices/uiSlice.js';
import { useAuth } from '../../../context/AuthContext.js';
import ErrorBoundary from '../../shared/ErrorBoundary/ErrorBoundary.js';

const CarMarketplace = () => {
  const safeGetStringId = useCallback((id) => {
    if (!id) return null;
    if (typeof id === 'string' && id !== '[object Object]') return id;
    if (typeof id === 'object') {
      if (id._id) return typeof id._id === 'string' ? id._id : id._id.toString?.();
      if (id.id) return typeof id.id === 'string' ? id.id : id.id.toString?.();
      if (id.toString && id.toString() !== '[object Object]') return id.toString();
    }
    if (process.env.NODE_ENV === 'development') console.error("Failed to extract valid ID from:", id);
    return null;
  }, []);

  const { carId } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [dealerListings, setDealerListings] = useState([]);
  const [relatedListings, setRelatedListings] = useState([]);
  const [relatedNews, setRelatedNews] = useState([]);
  const [views, setViews] = useState(0);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [showZoomControls, setShowZoomControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [isImageFullyLoaded, setIsImageFullyLoaded] = useState(false);
  
  const shareButtonRef = useRef(null);
  const viewRecorded = useRef(false);
  const dealerListingsRef = useRef(null);
  const relatedListingsRef = useRef(null);
  const relatedNewsRef = useRef(null);
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [dealerActiveIndex, setDealerActiveIndex] = useState(0);
  const [similarActiveIndex, setSimilarActiveIndex] = useState(0);
  const dealerCarouselRef = useRef(null);
  const similarCarouselRef = useRef(null);
  const [imageLoadAttempts, setImageLoadAttempts] = useState({});
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const dragTimeoutRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const isPrivateSeller = useMemo(() => {
    if (!car || !car.dealer) return false;
    if (car.dealer.sellerType === 'private') return true;
    if (car.dealer.privateSeller && car.dealer.privateSeller.firstName && car.dealer.privateSeller.lastName) return true;
    const businessName = (car.dealer.businessName || '').toLowerCase();
    const privateIndicators = ['private seller', 'private', 'individual', 'owner', 'personal'];
    const dealershipIndicators = ['dealership', 'motors', 'auto', 'cars', 'automotive', 'garage', 'ltd', 'pty'];
    if (dealershipIndicators.some(indicator => businessName.includes(indicator))) return false;
    if (privateIndicators.some(indicator => businessName.includes(indicator))) return true;
    const namePattern = /^[A-Z][a-z]+ [A-Z][a-z]+( [A-Z][a-z]+)?$/;
    if (namePattern.test(car.dealer.businessName || '') && !dealershipIndicators.some(indicator => businessName.includes(indicator))) return true;
    if (!car.dealer.businessType && car.dealer.businessName && !dealershipIndicators.some(indicator => businessName.includes(indicator))) return true;
    if (car.dealer.contact && car.dealer.contact.phone && !car.dealer.contact.website && !car.dealer.contact.businessEmail) return true;
    return false;
  }, [car]);

  const calculateSavings = useMemo(() => {
    if (!car || !car.priceOptions) return null;
    const { originalPrice, savingsAmount, savingsPercentage, showSavings, exclusiveDeal, savingsDescription, savingsValidUntil, dealerDiscount } = car.priceOptions;
    if (!showSavings) return null;
    if (savingsAmount && savingsAmount > 0) {
      return {
        amount: savingsAmount,
        percentage: savingsPercentage || Math.round((savingsAmount / (car.price + savingsAmount)) * 100),
        originalPrice: originalPrice || (car.price + savingsAmount),
        isExclusive: exclusiveDeal || false,
        description: savingsDescription || null,
        validUntil: savingsValidUntil || null,
        dealerDiscount: dealerDiscount || null
      };
    }
    if (originalPrice && originalPrice > car.price) {
      const savings = originalPrice - car.price;
      return {
        amount: savings,
        percentage: Math.round((savings / originalPrice) * 100),
        originalPrice: originalPrice,
        isExclusive: exclusiveDeal || false,
        description: savingsDescription || null,
        validUntil: savingsValidUntil || null,
        dealerDiscount: dealerDiscount || null
      };
    }
    return null;
  }, [car]);

  const getSellerDisplayName = useCallback(() => {
    if (!car || !car.dealer) return 'Unknown Seller';
    if (isPrivateSeller) {
      if (car.dealer.privateSeller && car.dealer.privateSeller.firstName && car.dealer.privateSeller.lastName) {
        return `${car.dealer.privateSeller.firstName} ${car.dealer.privateSeller.lastName}`;
      }
      if (car.dealer.businessName) {
        const businessName = car.dealer.businessName.toLowerCase();
        const businessTerms = ['dealership', 'motors', 'auto', 'cars', 'automotive', 'garage', 'ltd', 'pty', 'inc', 'corp'];
        if (!businessTerms.some(term => businessName.includes(term))) return car.dealer.businessName;
      }
      return car.dealer.name || car.dealer.businessName || 'Private Seller';
    }
    return car.dealer.businessName || car.dealer.name || 'Unknown Dealership';
  }, [car, isPrivateSeller]);

  const getSellerContactPreference = useCallback(() => {
    if (!isPrivateSeller || !car?.dealer?.privateSeller) return null;
    const preference = car.dealer.privateSeller.preferredContactMethod;
    switch (preference) {
      case 'phone': return 'Prefers Phone Calls';
      case 'whatsapp': return 'Prefers WhatsApp';
      case 'both': return 'Phone or WhatsApp';
      default: return null;
    }
  }, [isPrivateSeller, car]);

  const getSellerStats = useCallback(() => {
    if (!car?.dealer) return { listings: 0, rating: 'N/A', experience: 'N/A' };
    const stats = {
      listings: dealerListings.length + 1,
      rating: car.dealer.rating?.average ? car.dealer.rating.average.toFixed(1) : 'N/A',
      experience: 'N/A'
    };
    if (!isPrivateSeller) {
      if (car.dealer.metrics?.activeSales) stats.listings = car.dealer.metrics.activeSales;
      if (car.dealer.establishedYear) {
        const yearsInBusiness = new Date().getFullYear() - car.dealer.establishedYear;
        stats.experience = `${yearsInBusiness}+ years`;
      }
    } else {
      if (car.dealer.memberSince) {
        const joinDate = new Date(car.dealer.memberSince);
        const monthsActive = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        if (monthsActive > 12) stats.experience = `${Math.floor(monthsActive / 12)}+ years`;
        else if (monthsActive > 0) stats.experience = `${monthsActive} months`;
      }
    }
    return stats;
  }, [car, dealerListings.length, isPrivateSeller]);

  const formatValidUntil = useCallback((date) => {
    if (!date) return null;
    try {
      const validDate = new Date(date);
      if (validDate > new Date()) {
        return validDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
      }
    } catch (e) {}
    return null;
  }, []);

  const isMobile = useCallback(() => window.innerWidth <= 768, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateContainerDimensions = () => {
      const rect = container.getBoundingClientRect();
      setContainerDimensions({ width: rect.width, height: rect.height });
    };
    updateContainerDimensions();
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(updateContainerDimensions);
      resizeObserverRef.current.observe(container);
    } else {
      window.addEventListener('resize', updateContainerDimensions);
    }
    return () => {
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      else window.removeEventListener('resize', updateContainerDimensions);
    };
  }, []);

  useEffect(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setShowZoomControls(false);
    setIsDragging(false);
    setIsImageFullyLoaded(false);
    setImageDimensions({ width: 0, height: 0 });
  }, [selectedImage, car]);

  const imageDisplayProps = useMemo(() => {
    if (!isImageFullyLoaded || !imageDimensions.width || !containerDimensions.width) {
      return { objectFit: 'cover', width: '100%', height: '100%', transform: 'none', maxWidth: 'none', maxHeight: 'none' };
    }
    if (zoomLevel === 1) {
      return { objectFit: 'cover', width: '100%', height: '100%', transform: 'none', maxWidth: 'none', maxHeight: 'none' };
    }
    const containerAspect = containerDimensions.width / containerDimensions.height;
    const imageAspect = imageDimensions.width / imageDimensions.height;
    let baseWidth, baseHeight;
    if (imageAspect > containerAspect) {
      baseWidth = containerDimensions.width;
      baseHeight = containerDimensions.width / imageAspect;
    } else {
      baseHeight = containerDimensions.height;
      baseWidth = containerDimensions.height * imageAspect;
    }
    const displayWidth = baseWidth * zoomLevel;
    const displayHeight = baseHeight * zoomLevel;
    const transformX = panPosition.x / zoomLevel;
    const transformY = panPosition.y / zoomLevel;
    return {
      objectFit: 'contain',
      width: `${displayWidth}px`,
      height: `${displayHeight}px`,
      maxWidth: 'none',
      maxHeight: 'none',
      transform: `translate(${transformX}px, ${transformY}px)`,
      position: 'absolute',
      top: '50%',
      left: '50%',
      marginTop: `${-displayHeight / 2}px`,
      marginLeft: `${-displayWidth / 2}px`
    };
  }, [zoomLevel, panPosition, imageDimensions, containerDimensions, isImageFullyLoaded]);

  const handleZoomIn = useCallback((e) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.05, 4));
  }, []);

  const handleZoomOut = useCallback((e) => {
    e.stopPropagation();
    const newZoom = Math.max(zoomLevel - 0.05, 0.5);
    setZoomLevel(newZoom);
    if (newZoom === 1) setPanPosition({ x: 0, y: 0 });
  }, [zoomLevel]);

  const handleZoomReset = useCallback((e) => {
    e.stopPropagation();
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (zoomLevel <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastPanPosition(panPosition);
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
  }, [zoomLevel, panPosition]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || zoomLevel <= 1) return;
    e.preventDefault();
    e.stopPropagation();
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    if (!imageDimensions.width || !containerDimensions.width) return;
    const containerAspect = containerDimensions.width / containerDimensions.height;
    const imageAspect = imageDimensions.width / imageDimensions.height;
    let baseWidth, baseHeight;
    if (imageAspect > containerAspect) {
      baseWidth = containerDimensions.width;
      baseHeight = containerDimensions.width / imageAspect;
    } else {
      baseHeight = containerDimensions.height;
      baseWidth = containerDimensions.height * imageAspect;
    }
    const displayWidth = baseWidth * zoomLevel;
    const displayHeight = baseHeight * zoomLevel;
    const maxPanX = Math.max(0, (displayWidth - containerDimensions.width) / 2);
    const maxPanY = Math.max(0, (displayHeight - containerDimensions.height) / 2);
    const newX = Math.max(-maxPanX, Math.min(maxPanX, lastPanPosition.x + deltaX));
    const newY = Math.max(-maxPanY, Math.min(maxPanY, lastPanPosition.y + deltaY));
    setPanPosition({ x: newX, y: newY });
  }, [isDragging, zoomLevel, dragStart, lastPanPosition, imageDimensions, containerDimensions]);

  const handleMouseUp = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragTimeoutRef.current = setTimeout(() => { dragTimeoutRef.current = null; }, 100);
  }, [isDragging]);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2));
      setDragStart({ distance, zoom: zoomLevel });
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setLastPanPosition(panPosition);
    }
  }, [zoomLevel, panPosition]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2));
      if (dragStart.distance) {
        const scale = distance / dragStart.distance;
        const newZoom = Math.max(0.5, Math.min(4, dragStart.zoom * scale));
        setZoomLevel(newZoom);
        if (newZoom === 1) setPanPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      e.preventDefault();
      e.stopPropagation();
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;
      if (!imageDimensions.width || !containerDimensions.width) return;
      const containerAspect = containerDimensions.width / containerDimensions.height;
      const imageAspect = imageDimensions.width / imageDimensions.height;
      let baseWidth, baseHeight;
      if (imageAspect > containerAspect) {
        baseWidth = containerDimensions.width;
        baseHeight = containerDimensions.width / imageAspect;
      } else {
        baseHeight = containerDimensions.height;
        baseWidth = containerDimensions.height * imageAspect;
      }
      const displayWidth = baseWidth * zoomLevel;
      const displayHeight = baseHeight * zoomLevel;
      const maxPanX = Math.max(0, (displayWidth - containerDimensions.width) / 2);
      const maxPanY = Math.max(0, (displayHeight - containerDimensions.height) / 2);
      const newX = Math.max(-maxPanX, Math.min(maxPanX, lastPanPosition.x + deltaX));
      const newY = Math.max(-maxPanY, Math.min(maxPanY, lastPanPosition.y + deltaY));
      setPanPosition({ x: newX, y: newY });
    }
  }, [isDragging, zoomLevel, dragStart, lastPanPosition, imageDimensions, containerDimensions]);

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    dragTimeoutRef.current = setTimeout(() => { dragTimeoutRef.current = null; }, 150);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getNewsImageUrl = useCallback((article) => {
    if (!article) return '/images/placeholders/default.jpg';
    try {
      if (article.featuredImage) {
        if (typeof article.featuredImage === 'string') return article.featuredImage;
        else if (article.featuredImage.url) return article.featuredImage.url;
      }
      if (article.image) {
        if (typeof article.image === 'string') return article.image;
        else if (article.image.url) return article.image.url;
      }
      if (article.images && article.images.length > 0) {
        const firstImage = article.images[0];
        if (typeof firstImage === 'string') return firstImage;
        else if (firstImage.url) return firstImage.url;
      }
      if (article.thumbnail) return article.thumbnail;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error extracting news image URL:', error);
    }
    return '/images/placeholders/default.jpg';
  }, []);

  const navigateCarousel = useCallback((carouselType, direction) => {
    const isDealer = carouselType === 'dealer';
    const listings = isDealer ? dealerListings : relatedListings;
    const setIndex = isDealer ? setDealerActiveIndex : setSimilarActiveIndex;
    const currentIndex = isDealer ? dealerActiveIndex : similarActiveIndex;
    const carouselRef = isDealer ? dealerCarouselRef : similarCarouselRef;
    if (!listings || listings.length <= 1) return;
    let itemsPerView = 1;
    const viewportWidth = window.innerWidth;
    if (viewportWidth >= 1200) itemsPerView = 3;
    else if (viewportWidth >= 768) itemsPerView = 2;
    const maxIndex = Math.max(0, listings.length - itemsPerView);
    let nextIndex;
    if (direction === 'next') nextIndex = Math.min(currentIndex + 1, maxIndex);
    else nextIndex = Math.max(0, currentIndex - 1);
    if (nextIndex !== currentIndex) {
      setIndex(nextIndex);
      if (carouselRef.current) {
        const track = carouselRef.current.querySelector('.carousel-track');
        if (track) {
          const slideWidthPercent = 100 / itemsPerView;
          track.style.transform = `translateX(-${nextIndex * slideWidthPercent}%)`;
        }
      }
    }
  }, [dealerListings, relatedListings, dealerActiveIndex, similarActiveIndex]);

  const initializeCarousel = useCallback((carouselType) => {
    const isDealer = carouselType === 'dealer';
    const listings = isDealer ? dealerListings : relatedListings;
    const carouselRef = isDealer ? dealerCarouselRef : similarCarouselRef;
    const currentIndex = isDealer ? dealerActiveIndex : similarActiveIndex;
    if (!listings || listings.length <= 1 || !carouselRef.current) return;
    let itemsPerView = 1;
    const viewportWidth = window.innerWidth;
    if (viewportWidth >= 1200) itemsPerView = 3;
    else if (viewportWidth >= 768) itemsPerView = 2;
    const track = carouselRef.current.querySelector('.carousel-track');
    if (track) {
      const slideWidthPercent = 100 / itemsPerView;
      track.style.transform = `translateX(-${currentIndex * slideWidthPercent}%)`;
    }
  }, [dealerListings, relatedListings, dealerActiveIndex, similarActiveIndex]);

  const trackListingView = useCallback((listingId) => {
    try {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'listing_view', {
          listing_id: listingId,
          page_path: window.location.pathname,
          seller_type: isPrivateSeller ? 'private' : 'dealership'
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.warn('Analytics tracking failed:', error);
    }
  }, [isPrivateSeller]);

  useEffect(() => {
    const loadCar = async () => {
      setLoading(true);
      setError(null);
      try {
        const carData = await listingService.getListing(carId);
        if (!carData) {
          setError('Car not found');
          return;
        }
        setCar(carData);
        const savedCars = JSON.parse(localStorage.getItem('savedCars') || '[]');
        setIsSaved(savedCars.includes(carData._id));
        await loadRelatedContent(carData);
        if (!viewRecorded.current) {
          recordView(carData._id);
          viewRecorded.current = true;
        }
      } catch (error) {
        setError('Failed to load car details');
        if (process.env.NODE_ENV === 'development') console.error('Error loading car:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCar();
    return () => {
      viewRecorded.current = false;
      setSelectedImage(0);
      setImageLoadAttempts({});
    };
  }, [carId]);

  useEffect(() => {
    if (dealerListings.length > 0) initializeCarousel('dealer');
  }, [dealerListings, dealerActiveIndex, initializeCarousel]);

  useEffect(() => {
    if (relatedListings.length > 0) initializeCarousel('similar');
  }, [relatedListings, similarActiveIndex, initializeCarousel]);

  useEffect(() => {
    const handleResize = () => {
      if (dealerListings.length > 0) initializeCarousel('dealer');
      if (relatedListings.length > 0) initializeCarousel('similar');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dealerListings, relatedListings, initializeCarousel]);

  useEffect(() => {
    if (car && car.images && car.images.length > 1) {
      const nextIndex = (selectedImage + 1) % car.images.length;
      const prevIndex = (selectedImage - 1 + car.images.length) % car.images.length;
      const imageUrls = extractImageUrls(car);
      const nextImg = new Image();
      nextImg.src = imageUrls[nextIndex];
      const prevImg = new Image();
      prevImg.src = imageUrls[prevIndex];
    }
  }, [car, selectedImage]);

  const recordView = useCallback(async (id) => {
    try {
      await listingService.incrementViewCount(id);
      setViews(prev => prev + 1);
      trackListingView(id);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error recording view:', error);
    }
  }, [trackListingView]);

  const loadRelatedContent = useCallback(async (carData) => {
    try {
      const currentCar = carData || car;
      if (!currentCar) {
        if (process.env.NODE_ENV === 'development') console.warn('No car data available to load related content');
        return;
      }
      await Promise.all([
        loadDealerListings(currentCar),
        loadSimilarVehicles(currentCar),
        loadRelatedNews(currentCar)
      ]);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error loading related content:', error);
    }
  }, [car]);

  const extractDealerId = useCallback((car) => {
    if (!car) return null;
    if (process.env.NODE_ENV === 'development') {
      console.log('Extracting dealer ID from car data structure:', {
        hasDealerId: !!car.dealerId,
        hasDealer: !!car.dealer,
        dealerIdType: car.dealerId ? typeof car.dealerId : 'N/A',
        dealerType: car.dealer ? typeof car.dealer : 'N/A'
      });
    }
    if (typeof car.dealerId === 'string' && car.dealerId) return car.dealerId;
    if (car.dealerId && typeof car.dealerId === 'object') {
      if (car.dealerId._id) return car.dealerId._id.toString();
      if (car.dealerId.id) return car.dealerId.id.toString();
      if (car.dealerId.toString && car.dealerId.toString() !== '[object Object]') return car.dealerId.toString();
    }
    if (car.dealer) {
      if (typeof car.dealer === 'string') return car.dealer;
      if (typeof car.dealer === 'object') {
        if (car.dealer._id) return car.dealer._id.toString();
        if (car.dealer.id) return car.dealer.id.toString();
      }
    }
    if (process.env.NODE_ENV === 'development') console.warn('Could not extract dealer ID from car data');
    return null;
  }, []);

  const loadDealerListings = useCallback(async (currentCar) => {
    try {
      const dealerId = extractDealerId(currentCar);
      if (!dealerId) {
        if (process.env.NODE_ENV === 'development') console.warn('No valid dealer ID found for fetching dealer listings');
        setDealerListings([]);
        return;
      }
      if (process.env.NODE_ENV === 'development') console.log(`Fetching other listings from ${isPrivateSeller ? 'seller' : 'dealer'}: ${dealerId}`);
      const otherListings = await listingService.getDealerListings(dealerId, 1, 6);
      if (!otherListings || !Array.isArray(otherListings)) {
        if (process.env.NODE_ENV === 'development') console.warn('No valid listings returned from dealer listings API');
        setDealerListings([]);
        return;
      }
      if (process.env.NODE_ENV === 'development') console.log(`Found ${otherListings.length} other listings from the same ${isPrivateSeller ? 'seller' : 'dealer'}`);
      const filteredListings = otherListings.filter(listing => {
        if (!listing || (!listing._id && !listing.id)) return false;
        const listingId = listing._id || listing.id;
        const currentCarId = currentCar._id || currentCar.id;
        return listingId.toString() !== currentCarId.toString();
      });
      if (process.env.NODE_ENV === 'development') console.log(`After filtering, ${filteredListings.length} ${isPrivateSeller ? 'seller' : 'dealer'} listings remain`);
      setDealerListings(filteredListings.slice(0, 3));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error loading dealer listings:', error);
      setDealerListings([]);
    }
  }, [extractDealerId, isPrivateSeller]);

  const loadSimilarVehicles = useCallback(async (currentCar) => {
    try {
      if (process.env.NODE_ENV === 'development') console.log('Starting similar listings search for car:', currentCar?.title);
      let filters = {};
      if (currentCar.specifications?.make) filters.make = currentCar.specifications.make;
      else if (currentCar.category) filters.category = currentCar.category;
      if (Object.keys(filters).length === 0) {
        if (currentCar.price && currentCar.price > 0) {
          const price = parseInt(currentCar.price);
          if (!isNaN(price)) {
            filters.minPrice = Math.floor(price * 0.6);
            filters.maxPrice = Math.ceil(price * 1.4);
          }
        }
      }
      if (process.env.NODE_ENV === 'development') console.log('Fetching listings with filters:', filters);
      const response = await listingService.getListings(filters, 1, 10);
      if (!response || !response.listings || !Array.isArray(response.listings)) {
        if (process.env.NODE_ENV === 'development') console.error('Failed to get valid listings response');
        setRelatedListings([]);
        return;
      }
      if (process.env.NODE_ENV === 'development') console.log(`Found ${response.listings.length} potential similar listings`);
      const currentCarId = currentCar._id || currentCar.id;
      const filteredListings = response.listings.filter(listing => {
        if (!listing || (!listing._id && !listing.id)) return false;
        const listingId = listing._id || listing.id;
        return listingId.toString() !== currentCarId.toString();
      });
      if (process.env.NODE_ENV === 'development') console.log(`After filtering, ${filteredListings.length} similar listings remain`);
      if (filteredListings.length === 0) {
        if (process.env.NODE_ENV === 'development') console.log('No results after filtering - trying unfiltered search');
        const fallbackResponse = await listingService.getListings({ status: 'active' }, 1, 5);
        if (fallbackResponse && fallbackResponse.listings && Array.isArray(fallbackResponse.listings)) {
          const fallbackListings = fallbackResponse.listings.filter(listing => {
            if (!listing || (!listing._id && !listing.id)) return false;
            const listingId = listing._id || listing.id;
            return listingId.toString() !== currentCarId.toString();
          });
          if (process.env.NODE_ENV === 'development') console.log(`Found ${fallbackListings.length} fallback listings`);
          setRelatedListings(fallbackListings.slice(0, 3));
        } else {
          setRelatedListings([]);
        }
      } else {
        setRelatedListings(filteredListings.slice(0, 3));
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error loading similar vehicles:', error);
      setRelatedListings([]);
    }
  }, []);

  const loadRelatedNews = useCallback(async (currentCar) => {
    try {
      if (typeof newsService === 'undefined') {
        if (process.env.NODE_ENV === 'development') console.warn('News service not available');
        setRelatedNews([]);
        return;
      }
      const tags = [];
      if (currentCar.specifications?.make) tags.push(currentCar.specifications.make);
      if (currentCar.specifications?.model) tags.push(currentCar.specifications.model);
      if (currentCar.category) tags.push(currentCar.category);
      if (tags.length === 0) {
        if (process.env.NODE_ENV === 'development') console.warn('No valid tags found for related news');
        setRelatedNews([]);
        return;
      }
      if (process.env.NODE_ENV === 'development') console.log('Fetching related news with tags:', tags);
      const response = await newsService.getArticles({ tags }, 1, 3);
      if (response && response.articles && Array.isArray(response.articles)) {
        if (process.env.NODE_ENV === 'development') console.log(`Found ${response.articles.length} related news articles`);
        setRelatedNews(response.articles);
      } else {
        if (process.env.NODE_ENV === 'development') console.warn('No valid related news found');
        setRelatedNews([]);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error loading related news:', error);
      setRelatedNews([]);
    }
  }, []);

  const handleNavigation = useCallback((direction) => {
    if (!car?.images?.length) return;
    setSelectedImage(prev => {
      if (direction === 'prev') return prev > 0 ? prev - 1 : car.images.length - 1;
      else return prev < car.images.length - 1 ? prev + 1 : 0;
    });
    setImageLoadAttempts(prev => ({...prev, [selectedImage]: 0}));
  }, [car, selectedImage]);

  const handleSaveCar = useCallback(() => {
    if (!car) return;
    try {
      const savedCars = JSON.parse(localStorage.getItem('savedCars') || '[]');
      if (isSaved) {
        const newSaved = savedCars.filter(id => id !== car._id);
        localStorage.setItem('savedCars', JSON.stringify(newSaved));
        setIsSaved(false);
        if (window.gtag) {
          window.gtag('event', 'listing_unsave', {
            listing_id: car._id,
            seller_type: isPrivateSeller ? 'private' : 'dealership'
          });
        }
      } else {
        const newSaved = [...savedCars, car._id];
        localStorage.setItem('savedCars', JSON.stringify(newSaved));
        setIsSaved(true);
        if (window.gtag) {
          window.gtag('event', 'listing_save', {
            listing_id: car._id,
            seller_type: isPrivateSeller ? 'private' : 'dealership'
          });
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error saving/unsaving car:', error);
    }
  }, [car, isSaved, isPrivateSeller]);

  const handleWhatsAppClick = useCallback(() => {
    if (!car?.dealer?.contact?.phone) {
      dispatch(addNotification({
        type: 'warning',
        message: `${isPrivateSeller ? 'Seller' : 'Dealer'} contact information is not available.`
      }));
      return;
    }
    try {
      if (window.gtag) {
        window.gtag('event', 'contact_seller', {
          method: 'whatsapp',
          listing_id: car._id,
          seller_type: isPrivateSeller ? 'private' : 'dealership',
          has_savings: !!calculateSavings
        });
      }
    } catch (error) {}
    const make = car.specifications?.make || '';
    const model = car.specifications?.model || '';
    const year = car.specifications?.year || '';
    const title = car.title || `${year} ${make} ${model}`.trim() || 'Vehicle';
    const savingsInfo = calculateSavings ? 
      `\n*EXCLUSIVE BW CAR CULTURE SAVINGS*\n` +
      `Original ${isPrivateSeller ? 'Seller' : 'Dealer'} Price: P${calculateSavings.originalPrice.toLocaleString()}\n` +
      `Bw Car Culture Discounted Price: P${car.price.toLocaleString()}\n` +
      `Your Total Savings: P${calculateSavings.amount.toLocaleString()}\n` +
      (calculateSavings.validUntil ? `Valid Until: ${formatValidUntil(calculateSavings.validUntil)}\n` : '') +
      (calculateSavings.description ? `Special Offer: ${calculateSavings.description}\n` : '') +
      `\nThis is an exclusive deal available only through Bw Car Culture!\n` : '';
    const vehicleDetails = [
      `*${title}*`,
      savingsInfo,
      car.specifications?.mileage ? `Mileage: ${car.specifications.mileage.toLocaleString()} km` : '',
      car.specifications?.transmission ? `Transmission: ${car.specifications.transmission}` : '',
      car.specifications?.fuelType ? `Fuel Type: ${car.specifications.fuelType}` : '',
      car.specifications?.engineSize ? `Engine: ${car.specifications.engineSize}` : '',
      car.specifications?.drivetrain ? `Drivetrain: ${car.specifications.drivetrain.toUpperCase()}` : '',
      car.condition ? `Condition: ${car.condition}` : ''
    ].filter(Boolean).join('\n');
    let vehicleLink = '';
    try {
      if (car._id) {
        const baseUrl = window.location.origin;
        vehicleLink = `\n\n🔗 Full Details: ${baseUrl}/marketplace/${car._id}`;
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.warn('Could not generate vehicle link:', err);
    }
    const sellerTitle = isPrivateSeller ? 'PRIVATE SELLER' : 'DEALERSHIP';
    const greeting = isPrivateSeller ? 
      `Hello ${getSellerDisplayName()}, I found your vehicle listing on Bw Car Culture.` :
      `Hello, I found this vehicle on Bw Car Culture.`;
    const contactPreference = getSellerContactPreference();
    const preferenceNote = contactPreference ? `\n📱 I see you prefer ${contactPreference.toLowerCase()}, so I'm reaching out via WhatsApp.` : '';
    const closingNote = isPrivateSeller ?
      `I'm interested in learning more about the vehicle and arranging a viewing at your convenience.` :
      `Please let me know about availability, financing options, and viewing arrangements.`;
    const message = `🚗 *VEHICLE INQUIRY - BW CAR CULTURE - ${sellerTitle}*\n\n${greeting}${preferenceNote}\n\n${calculateSavings ? 'I would like to take advantage of this exclusive Bw Car Culture savings offer:\n\n' : 'I\'m interested in this vehicle:\n\n'}${vehicleDetails}${vehicleLink}\n\n${closingNote}\n\nThank you!`;
    const phone = car.dealer.contact.phone;
    const formattedPhone = phone.startsWith('+') ? phone.replace(/\s+/g, '') : `+267${phone.replace(/\s+/g, '')}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
  }, [car, calculateSavings, formatValidUntil, isPrivateSeller, getSellerDisplayName, getSellerContactPreference, dispatch]);

  const handleListingClick = useCallback((listingId) => {
    navigate(`/marketplace/${listingId}`);
  }, [navigate]);

  const handleNewsClick = useCallback((articleId) => {
    navigate(`/news/article/${articleId}`);
  }, [navigate]);

  const handleSavingsBadgeClick = useCallback(() => {
    if (isMobile()) setShowSavingsModal(true);
  }, [isMobile]);

  const handleOpenFullscreen = useCallback((e, index = null) => {
    e?.stopPropagation();
    setFullscreenImageIndex(index !== null ? index : selectedImage);
    setShowFullscreen(true);
    document.body.style.overflow = 'hidden';
  }, [selectedImage]);

  const handleCloseFullscreen = useCallback(() => {
    setShowFullscreen(false);
    document.body.style.overflow = '';
  }, []);

  const handleFullscreenNavigation = useCallback((direction) => {
    if (!car?.images?.length) return;
    setFullscreenImageIndex(prev => {
      if (direction === 'prev') return prev > 0 ? prev - 1 : car.images.length - 1;
      return prev < car.images.length - 1 ? prev + 1 : 0;
    });
  }, [car]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showFullscreen) handleCloseFullscreen();
    };
    if (showFullscreen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [showFullscreen, handleCloseFullscreen]);

  const extractImageUrls = useCallback((car) => {
    if (!car || !car.images || !Array.isArray(car.images) || car.images.length === 0) {
      return ['/images/placeholders/car.jpg'];
    }
    return car.images.map(img => {
      try {
        if (typeof img === 'string') {
          let url = img;
          if (url.includes('/images/images/')) url = url.replace(/\/images\/images\//g, '/images/');
          const imageSegmentCount = (url.match(/images\//g) || []).length;
          if (imageSegmentCount > 1) {
            const filename = url.split('/').pop();
            return `/uploads/listings/${filename}`;
          }
          return url;
        } else if (img && typeof img === 'object') {
          let url = img.url || img.thumbnail || '';
          if (url.includes('/images/images/')) url = url.replace(/\/images\/images\//g, '/images/');
          if (!url && img.key) {
            const key = img.key.replace(/images\/images\//g, 'images/');
            url = `/api/images/s3-proxy/${key}`;
          }
          if (url && !url.startsWith('/') && !url.startsWith('http')) url = `/${url}`;
          return url || '/images/placeholders/car.jpg';
        }
        return '/images/placeholders/car.jpg';
      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.error('Error extracting image URL:', error);
        return '/images/placeholders/car.jpg';
      }
    });
  }, []);

  const handleGalleryImageError = useCallback((e) => {
    const currentAttempts = imageLoadAttempts[selectedImage] || 0;
    setImageLoadAttempts(prev => ({ ...prev, [selectedImage]: currentAttempts + 1 }));
    const originalSrc = e.target.src;
    if (process.env.NODE_ENV === 'development') console.log(`Gallery image failed to load: ${originalSrc}`);
    if (currentAttempts > 0 || originalSrc.includes('/api/images/s3-proxy/') || originalSrc.includes('/uploads/listings/') ||
        originalSrc.includes('images/images/') || originalSrc.includes('/images/placeholders/')) {
      if (process.env.NODE_ENV === 'development') console.log('Using placeholder as final fallback after multiple attempts');
      e.target.src = '/images/placeholders/car.jpg';
      return;
    }
    if (originalSrc.includes('amazonaws.com')) {
      const key = originalSrc.split('.amazonaws.com/').pop();
      if (key) {
        if (process.env.NODE_ENV === 'development') console.log(`Trying S3 proxy for: ${key}`);
        e.target.src = `/api/images/s3-proxy/${key}`;
        return;
      }
    }
    const filename = originalSrc.split('/').pop();
    if (filename && !originalSrc.includes('/images/placeholders/')) {
      if (process.env.NODE_ENV === 'development') console.log(`Trying direct listing path for: ${filename}`);
      e.target.src = `/uploads/listings/${filename}`;
      return;
    }
    if (process.env.NODE_ENV === 'development') console.log('Using placeholder image as final fallback');
    e.target.src = '/images/placeholders/car.jpg';
  }, [imageLoadAttempts, selectedImage]);

  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setIsImageFullyLoaded(true);
  }, []);

  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    };
  }, []);

  const sellerStats = getSellerStats();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loader"></div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="error-container">
        <h2>{error || 'Car not found'}</h2>
        <button onClick={() => navigate('/marketplace')}>← Back to Listings</button>
      </div>
    );
  }

  const imageUrls = extractImageUrls(car);

  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV !== 'production'}>
      <div className="car-detail-container">
        <button className="back-button" onClick={() => navigate('/marketplace')} aria-label="Back to listings">
          ← Back to Listings
        </button>

        <div className="marketplace-content">
          <div className="main-content">
            <div className="car-gallery">
              <div 
                className="main-image-container"
                ref={containerRef}
                onMouseEnter={() => setShowZoomControls(true)}
                onMouseLeave={() => { if (zoomLevel === 1) setShowZoomControls(false); }}
              >
                <div className="main-image">
                  <img 
                    ref={imageRef}
                    src={imageUrls[selectedImage]} 
                    alt={car.title}
                    className="gallery-image"
                    style={imageDisplayProps}
                    onError={handleGalleryImageError}
                    onLoad={handleImageLoad}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    draggable={false}
                  />
                  
                  {showZoomControls && (
                    <div className={`zoom-controls ${zoomLevel !== 1 ? 'zoomed' : ''}`}>
                      <button className="zoom-btn zoom-in" onClick={handleZoomIn} onTouchEnd={(e) => { e.stopPropagation(); handleZoomIn(e); }} disabled={zoomLevel >= 4} aria-label="Zoom in" title="Zoom in">+</button>
                      <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
                      <button className="zoom-btn zoom-out" onClick={handleZoomOut} onTouchEnd={(e) => { e.stopPropagation(); handleZoomOut(e); }} disabled={zoomLevel <= 0.5} aria-label="Zoom out" title="Zoom out">-</button>
                      {zoomLevel !== 1 && (
                        <button className="zoom-btn zoom-reset" onClick={handleZoomReset} onTouchEnd={(e) => { e.stopPropagation(); handleZoomReset(e); }} aria-label="Reset zoom" title="Reset to normal view">↻</button>
                      )}
                    </div>
                  )}
                  
                  {calculateSavings && (
                    <div className={`main-savings-badge ${calculateSavings.isExclusive ? 'exclusive' : ''}`} onClick={handleSavingsBadgeClick}>
                      <div className="main-savings-amount">P{calculateSavings.amount.toLocaleString()}</div>
                      <div className="main-savings-label">SAVE</div>
                      <div className="savings-detail-modal desktop-only">
                        <div className="savings-detail-header">{calculateSavings.isExclusive ? 'Exclusive Bw Car Culture Deal' : 'Bw Car Culture Savings'}</div>
                        <div className="savings-detail-content">
                          <div className="savings-detail-row"><span>Original Price:</span><span>P{calculateSavings.originalPrice.toLocaleString()}</span></div>
                          <div className="savings-detail-row"><span>Discounted Price:</span><span>P{car.price.toLocaleString()}</span></div>
                          <div className="savings-detail-row total"><span>Your Savings:</span><span>P{calculateSavings.amount.toLocaleString()}</span></div>
                        </div>
                        {calculateSavings.validUntil && formatValidUntil(calculateSavings.validUntil) && (
                          <div className="savings-detail-description">Valid until {formatValidUntil(calculateSavings.validUntil)}</div>
                        )}
                        {calculateSavings.description && (
                          <div className="savings-detail-description">{calculateSavings.description}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* UPDATED: Gallery actions - Save and Share moved to TOP LEFT */}
                  <div className="gallery-actions-top-left">
                    <button 
                      className={`action-button ${isSaved ? 'saved' : ''}`} 
                      onClick={handleSaveCar} 
                      aria-label={isSaved ? 'Remove from saved' : 'Save car'}
                    >
                      {isSaved ? '♥' : '♡'}
                    </button>
                    <button 
                      ref={shareButtonRef} 
                      className="action-button" 
                      onClick={() => setShowShareModal(true)} 
                      aria-label="Share listing"
                    >
                      ↗
                    </button>
                  </div>

                  {/* UPDATED: Fullscreen button moved to BOTTOM LEFT */}
                  <button 
                    className="fullscreen-button" 
                    onClick={(e) => handleOpenFullscreen(e)} 
                    aria-label="View fullscreen" 
                    title="View fullscreen"
                  >
                    ⤢
                  </button>
                  
                  {imageUrls.length > 1 && (
                    <>
                      <button className="gallery-nav prev" onClick={() => handleNavigation('prev')} aria-label="Previous image">❮</button>
                      <button className="gallery-nav next" onClick={() => handleNavigation('next')} aria-label="Next image">❯</button>
                    </>
                  )}
                  
                  {imageUrls.length > 1 && (
                    <div className="image-counter">{selectedImage + 1} / {imageUrls.length}</div>
                  )}
                </div>
              </div>
              
              {imageUrls.length > 1 && (
                <div className="thumbnail-strip">
                  {imageUrls.map((image, index) => (
                    <div key={index} className={`thumbnail ${selectedImage === index ? 'active' : ''}`} onClick={() => { setSelectedImage(index); setImageLoadAttempts(prev => ({...prev, [index]: 0})); }}>
                      <img src={image} alt={`${car.title} view ${index + 1}`} loading={index === 0 ? 'eager' : 'lazy'} onError={(e) => { e.target.src = '/images/placeholders/car.jpg'; }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="car-info">
              <div className="car-header">
                <div className="title-section">
                  <h1 className="title">{car.title}</h1>
                  <div className="title-badges">
                    {car.warranty && !isPrivateSeller && <div className="warranty-badge">✓ Warranty</div>}
                    {car.isCertified && !isPrivateSeller && <div className="certified-badge">✓ Certified Pre-Owned</div>}
                    {car.condition === 'like-new' && <div className="like-new-badge">✓ Like New</div>}
                    {car.serviceHistory?.hasServiceHistory && <div className="service-history-badge">✓ Service History Available</div>}
                  </div>
                </div>
                <div className="price-container">
                  {calculateSavings && <div className="original-price">Original Price: P {calculateSavings.originalPrice.toLocaleString()}</div>}
                  <div className="car-price pula-price">{car.priceOptions && car.priceOptions.showPriceAsPOA ? 'POA' : `P ${car.price.toLocaleString()}`}</div>
                  {calculateSavings && <div className="savings-highlight">Save: P {calculateSavings.amount.toLocaleString()}</div>}
                  {car.priceOptions?.monthlyPayment && !car.priceOptions?.showPriceAsPOA && !isPrivateSeller && <div className="monthly-payment">P {car.priceOptions.monthlyPayment.toLocaleString()} p/m</div>}
                  {car.priceOptions?.includesVAT && <span className="vat-info">Price includes VAT</span>}
                  {car.priceOptions?.financeAvailable && !isPrivateSeller && <div className="finance-badge">Finance Available</div>}
                  {car.priceOptions?.leaseAvailable && !isPrivateSeller && <div className="lease-badge">Lease Available</div>}
                  <div className="condition-badge">{car.condition ? car.condition.charAt(0).toUpperCase() + car.condition.slice(1) : 'Used'}</div>
                </div>
              </div>

              {calculateSavings && (
                <div className="savings-breakdown">
                  <h4>Bw Car Culture Savings Breakdown</h4>
                  <div className="savings-breakdown-content">
                    <div className="savings-breakdown-row"><span>Original {isPrivateSeller ? 'Seller' : 'Dealer'} Price:</span><span>P {calculateSavings.originalPrice.toLocaleString()}</span></div>
                    <div className="savings-breakdown-row"><span>Bw Car Culture Price:</span><span>P {car.price.toLocaleString()}</span></div>
                    <div className="savings-breakdown-row total"><span>Your Total Savings:</span><span>P {calculateSavings.amount.toLocaleString()}</span></div>
                  </div>
                  {calculateSavings.description && <p className="savings-description">{calculateSavings.description}</p>}
                  {calculateSavings.validUntil && formatValidUntil(calculateSavings.validUntil) && <p className="savings-validity">Offer valid until {formatValidUntil(calculateSavings.validUntil)}</p>}
                </div>
              )}

              <div className="specs-grid">
                <div className="spec-item"><span className="spec-label">Year</span><span className="spec-value">{car.specifications?.year || 'N/A'}</span></div>
                <div className="spec-item"><span className="spec-label">Mileage</span><span className="spec-value">{car.specifications?.mileage ? car.specifications.mileage.toLocaleString() + ' km' : 'N/A'}</span></div>
                <div className="spec-item"><span className="spec-label">Transmission</span><span className="spec-value">{car.specifications?.transmission ? (car.specifications.transmission.charAt(0).toUpperCase() + car.specifications.transmission.slice(1).replace('_', ' ')) : 'N/A'}</span></div>
                <div className="spec-item"><span className="spec-label">Fuel Type</span><span className="spec-value">{car.specifications?.fuelType ? (car.specifications.fuelType.charAt(0).toUpperCase() + car.specifications.fuelType.slice(1).replace('_', ' ')) : 'N/A'}</span></div>
                <div className="spec-item"><span className="spec-label">Drivetrain</span><span className="spec-value">{car.specifications?.drivetrain ? car.specifications.drivetrain.toUpperCase() : 'N/A'}</span></div>
                {car.specifications?.engineSize && <div className="spec-item"><span className="spec-label">Engine</span><span className="spec-value">{car.specifications.engineSize}</span></div>}
                {car.specifications?.power && <div className="spec-item"><span className="spec-label">Power</span><span className="spec-value">{car.specifications.power}</span></div>}
                {car.specifications?.exteriorColor && <div className="spec-item"><span className="spec-label">Color</span><span className="spec-value">{car.specifications.exteriorColor}</span></div>}
                {car.category && <div className="spec-item"><span className="spec-label">Category</span><span className="spec-value">{car.category}</span></div>}
              </div>

              {car.description && (
                <div className="description-section">
                  <h2>Description</h2>
                  <div className="description-content">{car.description}</div>
                </div>
              )}

              <div className="features-tabs">
                <button className={`tab-button ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>General Features</button>
                {car.safetyFeatures?.length > 0 && <button className={`tab-button ${activeTab === 'safety' ? 'active' : ''}`} onClick={() => setActiveTab('safety')}>Safety</button>}
                {car.comfortFeatures?.length > 0 && <button className={`tab-button ${activeTab === 'comfort' ? 'active' : ''}`} onClick={() => setActiveTab('comfort')}>Comfort</button>}
                {car.performanceFeatures?.length > 0 && <button className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>Performance</button>}
                {car.entertainmentFeatures?.length > 0 && <button className={`tab-button ${activeTab === 'entertainment' ? 'active' : ''}`} onClick={() => setActiveTab('entertainment')}>Entertainment</button>}
                {car.serviceHistory?.hasServiceHistory && user && (user.role === 'admin' || (car.dealerId && car.dealerId === user.id)) && <button className={`tab-button ${activeTab === 'service' ? 'active' : ''}`} onClick={() => setActiveTab('service')}>Service History</button>}
              </div>

              {car.features && car.features.length > 0 && activeTab === 'general' && (
                <div className="features-section">
                  <h2>Features & Equipment</h2>
                  <div className="features-grid">{car.features.map((feature, index) => <div key={index} className="feature-item">✓ {feature}</div>)}</div>
                </div>
              )}

              {car.safetyFeatures && car.safetyFeatures.length > 0 && activeTab === 'safety' && (
                <div className="features-section">
                  <h2>Safety Features</h2>
                  <div className="features-grid">{car.safetyFeatures.map((feature, index) => <div key={index} className="feature-item">✓ {feature}</div>)}</div>
                </div>
              )}

              {car.comfortFeatures && car.comfortFeatures.length > 0 && activeTab === 'comfort' && (
                <div className="features-section">
                  <h2>Comfort & Convenience</h2>
                  <div className="features-grid">{car.comfortFeatures.map((feature, index) => <div key={index} className="feature-item">✓ {feature}</div>)}</div>
                </div>
              )}

              {car.performanceFeatures && car.performanceFeatures.length > 0 && activeTab === 'performance' && (
                <div className="features-section">
                  <h2>Performance Features</h2>
                  <div className="features-grid">{car.performanceFeatures.map((feature, index) => <div key={index} className="feature-item">✓ {feature}</div>)}</div>
                </div>
              )}

              {car.entertainmentFeatures && car.entertainmentFeatures.length > 0 && activeTab === 'entertainment' && (
                <div className="features-section">
                  <h2>Entertainment & Technology</h2>
                  <div className="features-grid">{car.entertainmentFeatures.map((feature, index) => <div key={index} className="feature-item">✓ {feature}</div>)}</div>
                </div>
              )}

              {car.serviceHistory?.hasServiceHistory && car.serviceHistory.records && car.serviceHistory.records.length > 0 && activeTab === 'service' && user && (user.role === 'admin' || (car.dealerId && car.dealerId === user.id)) && (
                <div className="service-history-section">
                  <h2>Service History</h2>
                  <div className="service-history-timeline">
                    {car.serviceHistory.records.sort((a, b) => new Date(b.date) - new Date(a.date)).map((record, index) => (
                      <div key={index} className="service-record">
                        <div className="service-record-header">
                          <div className="service-date">{new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                          <div className="service-mileage">{record.mileage.toLocaleString()} km</div>
                        </div>
                        <div className="service-record-content">
                          <div className="service-type">{record.serviceType}</div>
                          <div className="service-center">{record.serviceCenter}</div>
                          <div className="service-description">{record.description}</div>
                          {record.documents && record.documents.length > 0 && (
                            <div className="service-documents">
                              <h4>Documents</h4>
                              <div className="document-list">
                                {record.documents.map((doc, docIndex) => (
                                  <a key={docIndex} href={doc.url} target="_blank" rel="noopener noreferrer" className="document-link">{doc.name || `Document ${docIndex + 1}`}</a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {car.serviceHistory?.hasServiceHistory && activeTab === 'general' && (!user || (user.role !== 'admin' && (!car.dealerId || car.dealerId !== user.id))) && (
                <div className="service-history-private-message" onClick={() => { dispatch(addNotification({ type: 'info', message: `Service history is available. Please contact the ${isPrivateSeller ? 'seller' : 'dealer'} for details.` })); }}>
                  <p><span className="service-history-icon">📋</span> This vehicle has service history records. Contact the {isPrivateSeller ? 'seller' : 'dealer'} for details.</p>
                </div>
              )}
            </div>
          </div>

          <div className="dealer-sidebar">
            <div className="dealer-section">
              <div className="dealer-header"><h2>{isPrivateSeller ? 'Private Seller' : 'Dealer'} Information</h2></div>
              <div className="dealer-card">
                <div className="dealer-header-compact">
                  <img src={car.dealer?.profile?.logo || car.dealer?.logo || (isPrivateSeller ? '/images/placeholders/private-seller-avatar.jpg' : '/images/placeholders/dealer-logo.jpg')} alt={getSellerDisplayName()} className="dealer-avatar" onError={(e) => { e.target.src = isPrivateSeller ? '/images/placeholders/private-seller-avatar.jpg' : '/images/placeholders/dealer-logo.jpg'; }} />
                  <div className="dealer-details">
                    <h3 className="dealer-name">{getSellerDisplayName()}{car.dealer?.verification?.isVerified && <span className="dealer-verified-icon" title="Verified Seller">✓</span>}</h3>
                    <div className={`seller-type-badge ${isPrivateSeller ? 'private' : 'dealership'}`}>{isPrivateSeller ? '👤 Private Seller' : 'Dealership'}</div>
                    <p className="dealer-location">{car.dealer?.location?.city || 'Location not specified'}{car.dealer?.location?.state ? `, ${car.dealer?.location?.state}` : ''}</p>
                    {getSellerContactPreference() && <p className="contact-preference">📱 {getSellerContactPreference()}</p>}
                  </div>
                </div>
                <div className="dealer-stats">
                  <div className="stat-item"><div className="stat-value">{sellerStats.listings}</div><div className="stat-label">{isPrivateSeller ? 'Listings' : 'Vehicles'}</div></div>
                  <div className="stat-item"><div className="stat-value">{sellerStats.rating}</div><div className="stat-label">Rating</div></div>
                  {sellerStats.experience !== 'N/A' && <div className="stat-item"><div className="stat-value">{sellerStats.experience}</div><div className="stat-label">{isPrivateSeller ? 'Member' : 'Experience'}</div></div>}
                </div>
                {car.dealer?.contact && (
                  <div className="dealer-contact-grid">
                    {car.dealer.contact.email && <div className="contact-grid-item"><span className="contact-icon">✉️</span><span className="contact-info">{car.dealer.contact.email}</span></div>}
                    {car.dealer.contact.phone && <div className="contact-grid-item"><span className="contact-icon">📞</span><span className="contact-info">{car.dealer.contact.phone}</span></div>}
                    {car.dealer.contact.website && !isPrivateSeller && (
                      <div className="contact-grid-item"><span className="contact-icon">🌐</span><a href={car.dealer.contact.website.startsWith('http') ? car.dealer.contact.website : `https://${car.dealer.contact.website}`} target="_blank" rel="noopener noreferrer" className="contact-info website-link">{car.dealer.contact.website.replace(/^https?:\/\//, '').split('/')[0]}</a></div>
                    )}
                  </div>
                )}
                <div className="contact-buttons">
                  <button className="contact-button whatsapp" onClick={handleWhatsAppClick}>{calculateSavings ? `Claim Bw Car Culture Savings via WhatsApp` : `Contact ${isPrivateSeller ? 'Seller' : 'Dealer'} via WhatsApp`}</button>
                  <button className="contact-button contact-dealer" onClick={() => { if (car.dealer?.contact?.phone) { window.open(`tel:${car.dealer.contact.phone}`); } else { dispatch(addNotification({ type: 'warning', message: `${isPrivateSeller ? 'Seller' : 'Dealer'} phone number is not available.` })); } }}>📞 Call {isPrivateSeller ? 'Seller' : 'Dealer'}</button>
                  {car.dealer && !isPrivateSeller && (
                    <button className="contact-button view-dealer" onClick={() => { let dealerId = null; if (car.dealer && car.dealer._id) { dealerId = safeGetStringId(car.dealer._id); } else if (car.dealer && car.dealer.id) { dealerId = safeGetStringId(car.dealer.id); } else if (car.dealerId) { dealerId = safeGetStringId(car.dealerId); } if (process.env.NODE_ENV === 'development') console.log('Navigating to dealer with ID:', dealerId); if (dealerId) { navigate(`/dealerships/${dealerId}`); } else { if (process.env.NODE_ENV === 'development') console.error('Failed to get valid dealer ID for navigation'); dispatch(addNotification({ type: 'error', message: 'Unable to view dealership details at this time.' })); } }}>View Dealership</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="related-listings-section">
            <h2 className="related-section-title">More from {isPrivateSeller ? `${getSellerDisplayName()} (Private Seller)` : (car.dealer?.businessName || 'this dealership')}</h2>
            {dealerListings && dealerListings.length > 0 ? (
              <div className="carousel-container dealer-carousel">
                {dealerListings.length > 1 && <button onClick={() => navigateCarousel('dealer', 'prev')} className="carousel-nav prev" disabled={dealerActiveIndex === 0} aria-label={`Previous ${isPrivateSeller ? 'seller' : 'dealer'} listing`}><ChevronLeft size={24} /></button>}
                <div className="carousel-viewport" ref={dealerCarouselRef}>
                  <div className="carousel-track">
                    {dealerListings.map((dealerListing, index) => (
                      <div className="carousel-slide" key={dealerListing._id || dealerListing.id || index}><VehicleCard car={dealerListing} compact={true} onShare={(carToShare) => { if (setShowShareModal) { setCar(carToShare); setShowShareModal(true); } }} /></div>
                    ))}
                  </div>
                </div>
                {dealerListings.length > 1 && <button onClick={() => navigateCarousel('dealer', 'next')} className="carousel-nav next" disabled={dealerActiveIndex >= dealerListings.length - 1} aria-label={`Next ${isPrivateSeller ? 'seller' : 'dealer'} listing`}><ChevronRight size={24} /></button>}
              </div>
            ) : (
              <div className="no-listings"><p>No other listings available from this {isPrivateSeller ? 'seller' : 'dealership'}.</p>{isPrivateSeller && <p>This is the only vehicle currently listed by {getSellerDisplayName()}.</p>}</div>
            )}
          </div>

          <div className="related-listings-section">
            <h2 className="related-section-title">Similar Vehicles</h2>
            {relatedListings && relatedListings.length > 0 ? (
              <div className="carousel-container similar-carousel">
                {relatedListings.length > 1 && <button onClick={() => navigateCarousel('similar', 'prev')} className="carousel-nav prev" disabled={similarActiveIndex === 0} aria-label="Previous similar vehicle"><ChevronLeft size={24} /></button>}
                <div className="carousel-viewport" ref={similarCarouselRef}>
                  <div className="carousel-track">
                    {relatedListings.map((similarListing, index) => (
                      <div className="carousel-slide" key={similarListing._id || similarListing.id || index}><VehicleCard car={similarListing} compact={true} onShare={(carToShare) => { if (setShowShareModal) { setCar(carToShare); setShowShareModal(true); } }} /></div>
                    ))}
                  </div>
                </div>
                {relatedListings.length > 1 && <button onClick={() => navigateCarousel('similar', 'next')} className="carousel-nav next" disabled={similarActiveIndex >= relatedListings.length - 1} aria-label="Next similar vehicle"><ChevronRight size={24} /></button>}
              </div>
            ) : (
              <div className="no-listings"><p>No similar vehicles found.</p><p>We're currently searching for vehicles similar to this {car.specifications?.make} {car.specifications?.model}.</p></div>
            )}
          </div>

          <div className="related-news-section">
            <h2 className="related-section-title">Related News & Reviews</h2>
            {relatedNews && relatedNews.length > 0 ? (
              <div className="news-grid">
                {relatedNews.map(article => (
                  <div className="news-card" key={article._id || article.id} onClick={() => handleNewsClick(article._id || article.id)}>
                    <div className="news-card-image">
                      <img src={getNewsImageUrl(article)} alt={article.title} loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = '/images/placeholders/default.jpg'; }} />
                      <span className="news-category-badge">{article.category || 'News'}</span>
                      {article.gallery && article.gallery.length > 0 && <div className="gallery-count">Gallery ({article.gallery.length})</div>}
                      <button className="bookmark-button" aria-label="Bookmark article"><i className="bookmark-icon">🔖</i></button>
                    </div>
                    <div className="news-card-content">
                      <h3 className="news-card-title">{article.title}</h3>
                      <div className="news-card-author">
                        <div className="author-logo"><img src="/images/BW CAR CULTURE.png" alt="BW Car Culture" className="logo-icon" loading="lazy" /></div>
                        <span className="author-name">Admin User</span>
                        <span className="publication-date">{new Date(article.publishDate || article.createdAt || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('/')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-news"><p>No related articles found.</p></div>
            )}
          </div>

          {showSavingsModal && calculateSavings && (
            <div className="mobile-savings-modal-overlay" onClick={() => setShowSavingsModal(false)}>
              <div className="mobile-savings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="mobile-savings-modal-header"><h3>{calculateSavings.isExclusive ? 'Exclusive Deal' : 'Special Savings'}</h3><button className="modal-close-button" onClick={() => setShowSavingsModal(false)} aria-label="Close modal">✕</button></div>
                <div className="mobile-savings-modal-content">
                  <div className="mobile-savings-grid">
                    <div className="mobile-savings-item"><span className="mobile-savings-label">Original Price</span><span className="mobile-savings-value">P{calculateSavings.originalPrice.toLocaleString()}</span></div>
                    <div className="mobile-savings-item"><span className="mobile-savings-label">Bw Car Culture Price</span><span className="mobile-savings-value discounted">P{car.price.toLocaleString()}</span></div>
                    <div className="mobile-savings-item highlight"><span className="mobile-savings-label">Your Savings</span><span className="mobile-savings-value">P{calculateSavings.amount.toLocaleString()}</span></div>
                  </div>
                  {calculateSavings.description && <div className="mobile-savings-description">{calculateSavings.description}</div>}
                  {calculateSavings.validUntil && formatValidUntil(calculateSavings.validUntil) && <div className="mobile-savings-validity">Valid until {formatValidUntil(calculateSavings.validUntil)}</div>}
                  <div className="mobile-savings-actions"><button className="mobile-savings-whatsapp-button" onClick={() => { setShowSavingsModal(false); handleWhatsAppClick(); }}>Claim This Deal via WhatsApp</button></div>
                </div>
              </div>
            </div>
          )}

          {showShareModal && <ShareModal car={car} onClose={() => setShowShareModal(false)} buttonRef={shareButtonRef} />}

          {/* UPDATED: Enhanced Fullscreen Gallery */}
          {showFullscreen && (
            <div className={`fullscreen-gallery ${showFullscreen ? 'active' : ''}`} onClick={handleCloseFullscreen}>
              <button className="fullscreen-close" onClick={handleCloseFullscreen} aria-label="Close fullscreen">✕</button>
              <img src={imageUrls[fullscreenImageIndex]} alt={`${car.title} - Image ${fullscreenImageIndex + 1}`} className="fullscreen-image" onClick={(e) => e.stopPropagation()} onError={(e) => { e.target.src = '/images/placeholders/car.jpg'; }} />
              {imageUrls.length > 1 && (
                <>
                  <button className="fullscreen-nav prev" onClick={(e) => { e.stopPropagation(); handleFullscreenNavigation('prev'); }} aria-label="Previous image">
                    <ChevronLeft size={32} />
                  </button>
                  <button className="fullscreen-nav next" onClick={(e) => { e.stopPropagation(); handleFullscreenNavigation('next'); }} aria-label="Next image">
                    <ChevronRight size={32} />
                  </button>
                  <div className="fullscreen-counter">{fullscreenImageIndex + 1} / {imageUrls.length}</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(CarMarketplace);