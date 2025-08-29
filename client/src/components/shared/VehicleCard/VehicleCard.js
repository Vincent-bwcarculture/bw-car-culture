// src/components/shared/VehicleCard/VehicleCard.js
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../../../hooks/useAnalytics.js';
import './VehicleCard.css';

const VehicleCard = ({ car, onShare, compact = false }) => {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const [dealerImageError, setDealerImageError] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  
  // TRUE ZOOM: Enhanced zoom functionality state
  const [zoomLevel, setZoomLevel] = useState(1); // Start at 100% (normal cropped view)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [showZoomControls, setShowZoomControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  
  // TRUE ZOOM: Image dimension tracking
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [isImageFullyLoaded, setIsImageFullyLoaded] = useState(false);
  
  // Refs for zoom functionality
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const dragTimeoutRef = useRef(null);
  const resizeObserverRef = useRef(null);

  // FIXED: Enhanced checkFailedImage function to include type
  const checkFailedImage = useCallback((url, type = 'general') => {
    try {
      const failedImages = JSON.parse(localStorage.getItem('failedImages') || '{}');
      const key = `${url}_${type}`;
      const failureTime = failedImages[key];
      
      if (!failureTime) return false;
      
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      if (failureTime < oneHourAgo) {
        delete failedImages[key];
        localStorage.setItem('failedImages', JSON.stringify(failedImages));
        return false;
      }
      
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  const markFailedImage = useCallback((url, type = 'general') => {
    try {
      const failedImages = JSON.parse(localStorage.getItem('failedImages') || '{}');
      const key = `${url}_${type}`;
      failedImages[key] = Date.now();
      
      const keys = Object.keys(failedImages);
      if (keys.length > 100) {
        const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
        delete failedImages[oldestKey];
      }
      localStorage.setItem('failedImages', JSON.stringify(failedImages));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  const safeGetStringId = useCallback((id) => {
    if (!id) return null;
    
    if (typeof id === 'string' && id !== '[object Object]') {
      return id;
    }
    
    if (typeof id === 'object') {
      if (id._id) {
        if (typeof id._id === 'string') {
          return id._id;
        } else if (id._id.toString) {
          return id._id.toString();
        }
      }
      
      if (id.id) {
        if (typeof id.id === 'string') {
          return id.id;
        } else if (id.id.toString) {
          return id.id.toString();
        }
      }
      
      if (id.toString && id.toString() !== '[object Object]') {
        return id.toString();
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error("Failed to extract valid ID from:", id);
    }
    return null;
  }, []);

  // TRUE ZOOM: Track container dimensions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateContainerDimensions = () => {
      const rect = container.getBoundingClientRect();
      setContainerDimensions({ width: rect.width, height: rect.height });
    };

    // Initial measurement
    updateContainerDimensions();

    // Set up ResizeObserver for responsive updates
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(updateContainerDimensions);
      resizeObserverRef.current.observe(container);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', updateContainerDimensions);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      } else {
        window.removeEventListener('resize', updateContainerDimensions);
      }
    };
  }, []);

  // TRUE ZOOM: Reset zoom when image changes
  useEffect(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setShowZoomControls(false);
    setIsDragging(false);
    setIsImageFullyLoaded(false);
    setImageDimensions({ width: 0, height: 0 });
  }, [activeImageIndex, car]);

  // TRUE ZOOM: Calculate image display properties
  const imageDisplayProps = useMemo(() => {
    if (!isImageFullyLoaded || !imageDimensions.width || !containerDimensions.width) {
      return {
        objectFit: 'cover',
        width: '100%',
        height: '100%',
        transform: 'none',
        maxWidth: 'none',
        maxHeight: 'none'
      };
    }

    // At zoom level 1.0: normal cropped view (object-fit: cover)
    if (zoomLevel === 1) {
      return {
        objectFit: 'cover',
        width: '100%',
        height: '100%',
        transform: 'none',
        maxWidth: 'none',
        maxHeight: 'none'
      };
    }

    // Above zoom level 1.0: show full image with true zoom
    const containerAspect = containerDimensions.width / containerDimensions.height;
    const imageAspect = imageDimensions.width / imageDimensions.height;
    
    let baseWidth, baseHeight;
    
    // Calculate base size to fit full image in container
    if (imageAspect > containerAspect) {
      // Image is wider - fit to container width
      baseWidth = containerDimensions.width;
      baseHeight = containerDimensions.width / imageAspect;
    } else {
      // Image is taller - fit to container height  
      baseHeight = containerDimensions.height;
      baseWidth = containerDimensions.height * imageAspect;
    }

    // Apply zoom scaling
    const displayWidth = baseWidth * (zoomLevel - 1 + 1); // Zoom from actual image size
    const displayHeight = baseHeight * (zoomLevel - 1 + 1);
    
    // Calculate transform for panning
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

  // TRUE ZOOM: Enhanced zoom functionality
  const handleZoomIn = useCallback((e) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.25, 4)); // Max zoom 4x
    
    try {
      analytics.trackClick('image_zoom', 'zoom_in', {
        listingId: car._id,
        zoomLevel: zoomLevel + 0.25,
        imageIndex: activeImageIndex
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }, [zoomLevel, analytics, car, activeImageIndex]);

  const handleZoomOut = useCallback((e) => {
    e.stopPropagation();
    const newZoom = Math.max(zoomLevel - 0.25, 0.5); // Min zoom 50%
    setZoomLevel(newZoom);
    
    // Reset pan if back to normal cropped view
    if (newZoom === 1) {
      setPanPosition({ x: 0, y: 0 });
    }
    
    try {
      analytics.trackClick('image_zoom', 'zoom_out', {
        listingId: car._id,
        zoomLevel: newZoom,
        imageIndex: activeImageIndex
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }, [zoomLevel, analytics, car, activeImageIndex]);

  const handleZoomReset = useCallback((e) => {
    e.stopPropagation();
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    
    try {
      analytics.trackClick('image_zoom', 'reset', {
        listingId: car._id,
        imageIndex: activeImageIndex
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }, [analytics, car, activeImageIndex]);

  // TRUE ZOOM: Enhanced mouse drag handlers
  const handleMouseDown = useCallback((e) => {
    if (zoomLevel <= 1) return; // Only allow panning when zoomed beyond normal view
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastPanPosition(panPosition);
    
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current);
    }
  }, [zoomLevel, panPosition]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || zoomLevel <= 1) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Calculate max pan limits based on actual image display size
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
    
    dragTimeoutRef.current = setTimeout(() => {
      dragTimeoutRef.current = null;
    }, 100);
  }, [isDragging]);

  // TRUE ZOOM: Enhanced touch handlers
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
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
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (dragStart.distance) {
        const scale = distance / dragStart.distance;
        const newZoom = Math.max(0.5, Math.min(4, dragStart.zoom * scale));
        setZoomLevel(newZoom);
        
        if (newZoom === 1) {
          setPanPosition({ x: 0, y: 0 });
        }
      }
    } else if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      e.preventDefault();
      e.stopPropagation();
      
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;
      
      // Use same pan logic as mouse
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
    
    dragTimeoutRef.current = setTimeout(() => {
      dragTimeoutRef.current = null;
    }, 150);
  }, []);

  // Add global mouse event listeners for drag
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

  // Get reliable image URL with fallbacks
  const getImageUrl = useCallback(() => {
    if (!car || !car.images || !Array.isArray(car.images) || car.images.length === 0) {
      return '/images/placeholders/car.jpg';
    }
    
    const currentImage = car.images[activeImageIndex] || car.images[0];
    
    if (checkFailedImage(currentImage)) {
      return '/images/placeholders/car.jpg';
    }
    
    try {
      if (typeof currentImage === 'object' && currentImage.url) {
        let imageUrl = currentImage.url;
        if (imageUrl.includes('/images/images/')) {
          imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
        }
        return imageUrl;
      }
      
      if (typeof currentImage === 'string') {
        if (currentImage.startsWith('http://') || currentImage.startsWith('https://')) {
          let imageUrl = currentImage;
          if (imageUrl.includes('/images/images/')) {
            imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
          }
          return imageUrl;
        }
        
        const imageUrl = currentImage.startsWith('/') ? currentImage : `/${currentImage}`;
        if (imageUrl.includes('/images/images/')) {
          return imageUrl.replace(/\/images\/images\//g, '/images/');
        }
        return imageUrl;
      }
      
      return '/images/placeholders/car.jpg';
    } catch (error) {
      console.error('Error processing image URL:', error);
      return '/images/placeholders/car.jpg';
    }
  }, [car, activeImageIndex, checkFailedImage]);

  // Enhanced dealer logo URL function
  const getDealerImageUrl = useCallback((type = 'logo') => {
    try {
      if (!car || !car.dealer) {
        return `/images/placeholders/${type === 'logo' ? 'dealer-logo' : 'dealer-avatar'}.jpg`;
      }
      
      let imageUrl = null;
      
      if (type === 'logo') {
        imageUrl = car.dealer.profile?.logo || car.dealer.logo || car.dealer.profilePicture;
      } else {
        imageUrl = car.dealer.profile?.avatar || car.dealer.avatar || car.dealer.profilePicture || car.dealer.logo;
      }
      
      if (imageUrl) {
        if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
          return imageUrl;
        }
        
        if (typeof imageUrl === 'object' && imageUrl.url) {
          return imageUrl.url;
        }
        
        if (typeof imageUrl === 'string') {
          const fullUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
          return fullUrl.replace(/\/images\/images\//g, '/images/');
        }
      }
      
      return `/images/placeholders/${type === 'logo' ? 'dealer-logo' : 'dealer-avatar'}.jpg`;
    } catch (error) {
      console.error(`Error getting dealer ${type} URL:`, error);
      return `/images/placeholders/${type === 'logo' ? 'dealer-logo' : 'dealer-avatar'}.jpg`;
    }
  }, [car]);

  // Calculate savings information
  const calculateSavings = useMemo(() => {
    if (!car || !car.priceOptions) return null;
    
    const { originalPrice, savingsAmount, savingsPercentage, showSavings, exclusiveDeal, savingsDescription, savingsValidUntil } = car.priceOptions;
    
    if (!showSavings) return null;
    
    if (savingsAmount && savingsAmount > 0) {
      return {
        amount: savingsAmount,
        percentage: savingsPercentage || Math.round((savingsAmount / (car.price + savingsAmount)) * 100),
        originalPrice: originalPrice || (car.price + savingsAmount),
        isExclusive: exclusiveDeal || false,
        description: savingsDescription || null,
        validUntil: savingsValidUntil || null
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
        validUntil: savingsValidUntil || null
      };
    }
    
    return null;
  }, [car]);

  // ENHANCED: Better private seller detection and dealer info processing
  const dealer = useMemo(() => {
    if (!car) return null;
    
    if (car.dealer) {
      let dealerId = null;
      
      if (car.dealerId) {
        dealerId = safeGetStringId(car.dealerId);
      } else if (car.dealer._id) {
        dealerId = safeGetStringId(car.dealer._id);
      } else if (car.dealer.id) {
        dealerId = safeGetStringId(car.dealer.id);
      }
      
      const isPrivateSeller = 
        car.dealer.sellerType === 'private' ||
        (car.dealer.privateSeller && 
         car.dealer.privateSeller.firstName && 
         car.dealer.privateSeller.lastName) ||
        (car.dealer.businessName && 
         (car.dealer.businessName.includes('Private') || 
          car.dealer.businessName.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/))) ||
        (!car.dealer.businessType && car.dealer.name && !car.dealer.businessName);

      let displayName = 'Unknown Seller';
      let contactName = null;
      let sellerTypeLabel = 'Dealership';
      
      if (isPrivateSeller) {
        sellerTypeLabel = 'Private Seller';
        
        if (car.dealer.privateSeller && car.dealer.privateSeller.firstName && car.dealer.privateSeller.lastName) {
          displayName = `${car.dealer.privateSeller.firstName} ${car.dealer.privateSeller.lastName}`;
          contactName = displayName;
        } else if (car.dealer.businessName && !car.dealer.businessName.toLowerCase().includes('dealership')) {
          displayName = car.dealer.businessName;
          contactName = displayName;
        } else if (car.dealer.name) {
          displayName = car.dealer.name;
          contactName = displayName;
        } else {
          displayName = 'Private Seller';
          contactName = 'Private Seller';
        }
      } else {
        sellerTypeLabel = 'Dealership';
        displayName = car.dealer.businessName || car.dealer.name || 'Dealership';
        contactName = car.dealer.name || 'Sales Team';
      }
      
      return {
        id: dealerId,
        name: contactName,
        businessName: displayName,
        sellerType: isPrivateSeller ? 'private' : 'dealership',
        sellerTypeLabel: sellerTypeLabel,
        logo: car.dealer.logo || car.dealer.profile?.logo, 
        location: {
          city: car.dealer.location?.city || car.location?.city || 'Unknown Location',
          state: car.dealer.location?.state || car.location?.state || '',
          country: car.dealer.location?.country || car.location?.country || ''
        },
        verification: {
          isVerified: !!car.dealer.verification?.isVerified || car.dealer.verification?.status === 'verified'
        },
       contact: {
  phone: car.dealer.contact?.phone || car.dealer.phone || car.dealer.contactPhone || null,
  email: car.dealer.contact?.email || car.dealer.email || car.dealer.contactEmail || null,
  website: !isPrivateSeller ? (car.dealer.contact?.website || car.dealer.website) : null
},
        privateSeller: isPrivateSeller ? {
          firstName: car.dealer.privateSeller?.firstName || null,
          lastName: car.dealer.privateSeller?.lastName || null,
          preferredContactMethod: car.dealer.privateSeller?.preferredContactMethod || 'both',
          canShowContactInfo: car.dealer.privateSeller?.canShowContactInfo !== false
        } : null,
        businessType: !isPrivateSeller ? car.dealer.businessType : null,
        workingHours: !isPrivateSeller ? car.dealer.workingHours : null
      };
    }
    
    if (car.dealerId) {
      const dealerId = safeGetStringId(car.dealerId);
      
      return {
        id: dealerId,
        name: 'Contact Seller',
        businessName: 'Vehicle Seller',
        sellerType: 'dealership',
        sellerTypeLabel: 'Dealership',
        logo: '/images/placeholders/dealer-logo.jpg',
        location: {
          city: car.location?.city || 'Unknown Location',
          state: car.location?.state || '',
          country: car.location?.country || ''
        },
        verification: {
          isVerified: false
        },
        contact: {
          phone: null,
          email: null,
          website: null
        },
        privateSeller: null,
        businessType: null,
        workingHours: null
      };
    }
    
    return {
      id: null,
      name: 'Private Seller',
      businessName: 'Private Seller',
      sellerType: 'private',
      sellerTypeLabel: 'Private Seller',
      logo: '/images/placeholders/private-seller-avatar.jpg',
      location: {
        city: car.location?.city || 'Unknown Location',
        state: car.location?.state || '',
        country: car.location?.country || ''
      },
      verification: {
        isVerified: false
      },
      contact: {
        phone: null,
        email: null,
        website: null
      },
      privateSeller: {
        firstName: null,
        lastName: null,
        preferredContactMethod: 'both',
        canShowContactInfo: true
      },
      businessType: null,
      workingHours: null
    };
  }, [car, safeGetStringId]);

  // Track listing view when component becomes visible
  useEffect(() => {
    if (car && !hasBeenViewed) {
      const timer = setTimeout(() => {
        try {
          analytics.trackListingView(car._id, {
            title: car.title,
            price: car.price,
            make: car.specifications?.make,
            model: car.specifications?.model,
            year: car.specifications?.year,
            dealerId: dealer?.id,
            sellerType: dealer?.sellerType,
            savings: calculateSavings?.amount || 0,
            category: 'vehicle_sales',
            source: 'marketplace_card',
            compact: compact
          });
          setHasBeenViewed(true);
        } catch (error) {
          console.warn('Analytics tracking failed:', error);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [car, hasBeenViewed, analytics, dealer, calculateSavings, compact]);

  useEffect(() => {
    setImageLoadError(false);
  }, [car, activeImageIndex]);

  const handleCardClick = useCallback(() => {
    if (dragTimeoutRef.current) return;
    
    if (!car || !car._id) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Cannot navigate: Missing car ID", car);
      }
      return;
    }

    try {
      analytics.trackClick('vehicle_card', 'card', {
        listingId: car._id,
        title: car.title,
        price: car.price,
        dealerId: dealer?.id,
        sellerType: dealer?.sellerType,
        action: 'view_details'
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }

    navigate(`/marketplace/${car._id}`);
  }, [car, navigate, analytics, dealer]);

  // Handle image container tap for mobile navigation reveal
  const handleImageContainerClick = useCallback((e) => {
    if (dragTimeoutRef.current || zoomLevel > 1) return;
    
    if (window.innerWidth <= 768) {
      e.stopPropagation();
      setShowNavigation(true);
      setShowZoomControls(true);
      
      setTimeout(() => {
        setShowNavigation(false);
        if (zoomLevel === 1) {
          setShowZoomControls(false);
        }
      }, 3000);
    } else {
      setShowZoomControls(!showZoomControls);
    }
  }, [zoomLevel, showZoomControls]);

  const handleImageNavigation = useCallback((e, direction) => {
    e.stopPropagation();
    
    if (!car || !car.images || !Array.isArray(car.images) || car.images.length <= 1) return;
    
    try {
      analytics.trackClick('image_navigation', 'button', {
        listingId: car._id,
        direction: direction,
        currentIndex: activeImageIndex,
        totalImages: car.images.length
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
    
    setActiveImageIndex(prev => {
      if (direction === 'next') {
        return prev >= car.images.length - 1 ? 0 : prev + 1;
      } else {
        return prev <= 0 ? car.images.length - 1 : prev - 1;
      }
    });
  }, [car, activeImageIndex, analytics]);

  const handleShareClick = useCallback((e) => {
    e.stopPropagation();
    
    try {
      analytics.trackClick('share_button', 'button', {
        listingId: car._id,
        title: car.title,
        price: car.price,
        dealerId: dealer?.id,
        sellerType: dealer?.sellerType,
        action: 'share'
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
    
    if (onShare) {
      onShare(car);
    } else {
      if (navigator.share) {
        navigator.share({
          title: car.title,
          text: `Check out this ${car.specifications?.make} ${car.specifications?.model} for P${car.price?.toLocaleString()}`,
          url: window.location.origin + `/marketplace/${car._id}`
        });
      }
    }
  }, [car, onShare, analytics, dealer]);

  const handleReserveClick = useCallback((e) => {
    e.stopPropagation();
    
    try {
      analytics.trackClick('reserve_button', 'button', {
        listingId: car._id,
        title: car.title,
        price: car.price,
        dealerId: dealer?.id,
        sellerType: dealer?.sellerType,
        action: dealer?.sellerType === 'private' ? 'contact_seller' : 'reserve_vehicle'
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
    
    const vehicleDetails = [
      `${car.title}`,
      `Price: P${car.price?.toLocaleString()}`,
      car.specifications?.year ? `Year: ${car.specifications.year}` : '',
      car.specifications?.make ? `Make: ${car.specifications.make}` : '',
      car.specifications?.model ? `Model: ${car.specifications.model}` : '',
      car.specifications?.mileage ? `Mileage: ${car.specifications.mileage}km` : '',
      car.specifications?.transmission ? `Transmission: ${car.specifications.transmission}` : '',
      car.specifications?.fuelType ? `Fuel Type: ${car.specifications.fuelType}` : '',
      car.specifications?.engineSize ? `Engine: ${car.specifications.engineSize}` : '',
      car.specifications?.drivetrain ? `Drivetrain: ${car.specifications.drivetrain.toUpperCase()}` : '',
      car.condition ? `Condition: ${car.condition}` : '',
      car.location?.city ? `Location: ${car.location.city}` : ''
    ].filter(Boolean).join('\n');
    
    const contactAction = dealer?.sellerType === 'private' ? 'contact this private seller' : 'reserve this vehicle';
    const message = `Hi! I'm interested in this vehicle from Bw Car Culture:\n\n${vehicleDetails}\n\nI'd like to ${contactAction}. Please provide more details.`;
    
    const phone = car.dealer?.contact?.phone || car.dealer?.phone || car.dealer?.contactPhone || dealer?.contact?.phone;
    if (phone) {
      const formattedPhone = phone.startsWith('+') ? phone.replace(/\s+/g, '') : `+267${phone.replace(/\s+/g, '')}`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
    } else {
      const sellerTypeText = dealer?.sellerType === 'private' ? 'seller' : 'dealer';
      alert(`${dealer?.sellerTypeLabel || 'Seller'} contact information is not available. Please view details to contact the ${sellerTypeText}.`);
    }
  }, [car, dealer, analytics]);

  const handleDealerClick = useCallback((e) => {
    e.stopPropagation();
    
    if (dealer?.sellerType === 'private') {
      return;
    }
    
    try {
      analytics.trackClick('dealer_info', 'link', {
        dealerId: dealer?.id,
        dealerName: dealer?.businessName,
        sellerType: dealer?.sellerType,
        listingId: car._id,
        action: 'view_dealer'
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
    
    if (dealer && dealer.id) {
      navigate(`/dealerships/${dealer.id}`);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn('No dealer ID available for navigation');
      }
    }
  }, [dealer, navigate, analytics, car]);

  // TRUE ZOOM: Enhanced image error handling with dimension tracking
  const handleImageError = useCallback((e) => {
    const originalSrc = e.target.src;
    if (process.env.NODE_ENV === 'development') {
      console.log(`Image failed to load: ${originalSrc}`);
    }
    markFailedImage(originalSrc);
    
    try {
      analytics.trackEvent('image_load_error', {
        category: 'system',
        metadata: {
          listingId: car._id,
          imageSrc: originalSrc,
          imageIndex: activeImageIndex
        }
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
    
    if (originalSrc.includes('/api/images/s3-proxy/') || 
        originalSrc.includes('/uploads/listings/') ||
        originalSrc.includes('images/images/') ||
        originalSrc.includes('/images/placeholders/')) {
      e.target.src = '/images/placeholders/car.jpg';
      return;
    }
    
    if (originalSrc.includes('amazonaws.com')) {
      const key = originalSrc.split('.amazonaws.com/').pop();
      if (key) {
        const normalizedKey = key.replace(/images\/images\//g, 'images/');
        e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
        return;
      }
    }
    
    const filename = originalSrc.split('/').pop();
    if (filename && !originalSrc.includes('/images/placeholders/')) {
      e.target.src = `/uploads/listings/${filename}`;
      return;
    }
    
    e.target.src = '/images/placeholders/car.jpg';
  }, [markFailedImage, analytics, car, activeImageIndex]);

  // TRUE ZOOM: Handle image load to get dimensions
  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    setIsImageFullyLoaded(true);
  }, []);

  const formatValidUntil = useCallback((date) => {
    if (!date) return null;
    
    try {
      const validDate = new Date(date);
      if (validDate > new Date()) {
        return validDate.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        });
      }
    } catch (e) {
      // Invalid date
    }
    return null;
  }, []);

  if (!car) return null;

  return (
    <div 
      className={`vc-card ${compact ? 'compact' : ''}`} 
      onClick={handleCardClick}
      data-status={car.status || 'active'}
    >
      <div 
        className={`vc-image-container ${showNavigation ? 'show-navigation' : ''} ${showZoomControls ? 'show-zoom-controls' : ''}`}
        onClick={handleImageContainerClick}
        ref={containerRef}
      >
        <div className="vc-image-wrapper">
          <img 
            ref={imageRef}
            src={getImageUrl()} 
            alt={car.title || 'Vehicle'} 
            className="vc-image"
            style={imageDisplayProps}
            loading="lazy"
            onError={handleImageError}
            onLoad={handleImageLoad}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            draggable={false}
          />
          
          {/* SOLD BADGE OVERLAY */}
          {car.status === 'sold' && (
            <div className="vc-sold-overlay">
              <div className="vc-sold-badge">
                <span className="vc-sold-text">SOLD</span>
                {car.sold?.date && (
                  <span className="vc-sold-date">
                    {new Date(car.sold.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* TRUE ZOOM: Enhanced Zoom Controls */}
          {(showZoomControls || zoomLevel !== 1) && (
            <div className={`vc-zoom-controls ${zoomLevel !== 1 ? 'zoomed' : ''}`}>
              <button 
                className="vc-zoom-btn zoom-in" 
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                aria-label="Zoom in"
                title="Zoom in"
              >
                +
              </button>
              <span className="vc-zoom-level">{Math.round(zoomLevel * 100)}%</span>
              <button 
                className="vc-zoom-btn zoom-out" 
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                aria-label="Zoom out"
                title="Zoom out"
              >
                -
              </button>
              {zoomLevel !== 1 && (
                <button 
                  className="vc-zoom-btn zoom-reset" 
                  onClick={handleZoomReset}
                  aria-label="Reset zoom"
                  title="Reset to normal view"
                >
                  ↻
                </button>
              )}
            </div>
          )}
          
          {/* Savings Badge */}
          {calculateSavings && car.status !== 'sold' && (
            <div className={`vc-savings-badge ${calculateSavings.isExclusive ? 'vc-exclusive-badge' : ''}`}>
              <div className="vc-savings-badge-amount">P{calculateSavings.amount.toLocaleString()}</div>
              <div className="vc-savings-badge-label">SAVE</div>
              <div className="vc-savings-tooltip">
                <div className="vc-savings-tooltip-header">
                  💰 {calculateSavings.isExclusive ? 'Exclusive Deal!' : 'Great Savings!'}
                </div>
                <div className="vc-savings-tooltip-row">
                  <span>Original Price:</span>
                  <span>P{calculateSavings.originalPrice.toLocaleString()}</span>
                </div>
                <div className="vc-savings-tooltip-row">
                  <span>Current Price:</span>
                  <span>P{car.price.toLocaleString()}</span>
                </div>
                <div className="vc-savings-tooltip-row">
                  <span>You Save:</span>
                  <span>P{calculateSavings.amount.toLocaleString()}</span>
                </div>
                {calculateSavings.description && (
                  <div className="vc-savings-tooltip-description">
                    {calculateSavings.description}
                  </div>
                )}
                {calculateSavings.validUntil && formatValidUntil(calculateSavings.validUntil) && (
                  <div className="vc-savings-tooltip-description">
                    Valid until: {formatValidUntil(calculateSavings.validUntil)}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Image Navigation */}
          {car.images && Array.isArray(car.images) && car.images.length > 1 && (
            <div className="vc-image-navigation">
              <button 
                className="vc-image-nav prev" 
                onClick={(e) => handleImageNavigation(e, 'prev')}
                aria-label="Previous image"
              >
                ❮
              </button>
              <button 
                className="vc-image-nav next" 
                onClick={(e) => handleImageNavigation(e, 'next')}
                aria-label="Next image"
              >
                ❯
              </button>
              <div className="vc-image-counter">
                {activeImageIndex + 1}/{car.images.length}
              </div>
            </div>
          )}
          
          {dealer?.verification?.isVerified && (
            <div className="vc-verified-badge">
              ✓ Verified
            </div>
          )}
        </div>
      </div>
      
      <div className="vc-content">
        <div className="vc-header">
          <div className="vc-title-section">
            <h4 className="vc-title">{car.title || 'Vehicle Listing'}</h4>
            <div className="vc-title-badges">
              {car.priceOptions?.financeAvailable && dealer?.sellerType === 'dealership' && (
                <div className="vc-finance-badge">Finance Available</div>
              )}
              {car.priceOptions?.leaseAvailable && dealer?.sellerType === 'dealership' && (
                <div className="vc-lease-badge">Lease Available</div>
              )}
            </div>
          </div>
          <div className="vc-price-container">
            {calculateSavings && car.status !== 'sold' && (
              <div className="vc-original-price">P{calculateSavings.originalPrice.toLocaleString()}</div>
            )}
            <div className="vc-price">
              P{car.price?.toLocaleString() || '0'}
            </div>
            {calculateSavings && car.status !== 'sold' && (
              <div className="vc-savings-highlight">
                You Save: P {calculateSavings.amount.toLocaleString()}
              </div>
            )}
            {car.priceOptions?.monthlyPayment && !car.priceOptions?.showPriceAsPOA && car.status !== 'sold' && (
              <div className="vc-monthly-payment">
                <span className="vc-monthly-payment-value">P {car.priceOptions.monthlyPayment.toLocaleString()} p/m</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="vc-specs">
          <div className="vc-spec-item">
            <span className="vc-spec-label">Year:</span>
            <span className="vc-spec-value">{car.specifications?.year || 'N/A'}</span>
          </div>
          <div className="vc-spec-item">
            <span className="vc-spec-label">Mileage:</span>
            <span className="vc-spec-value">{car.specifications?.mileage ? 
              `${car.specifications.mileage.toLocaleString()}km` : 'N/A'}</span>
          </div>
          <div className="vc-spec-item">
            <span className="vc-spec-label">Transmission:</span>
            <span className="vc-spec-value">{car.specifications?.transmission ? 
              car.specifications.transmission.charAt(0).toUpperCase() + car.specifications.transmission.slice(1) : 'N/A'}</span>
          </div>
          <div className="vc-spec-item">
            <span className="vc-spec-label">Fuel Type:</span>
            <span className="vc-spec-value">{car.specifications?.fuelType ? 
              car.specifications.fuelType.charAt(0).toUpperCase() + car.specifications.fuelType.slice(1) : 'N/A'}</span>
          </div>
        </div>
        
        {(car.serviceHistory?.hasServiceHistory || car.warranty || car.isCertified) && (
          <div className="vc-badges">
            {car.serviceHistory?.hasServiceHistory && (
              <div className="vc-service-badge">Service History</div>
            )}
            {car.warranty && dealer?.sellerType === 'dealership' && (
              <div className="vc-warranty-badge">Warranty</div>
            )}
            {car.isCertified && dealer?.sellerType === 'dealership' && (
              <div className="vc-certified-badge">Certified</div>
            )}
          </div>
        )}
        
        <div className={`vc-dealer-info ${dealer?.sellerType === 'private' ? 'private-seller' : 'dealership'}`} 
             onClick={dealer?.sellerType !== 'private' ? handleDealerClick : undefined}>
          
          {(() => {
            const getInitials = () => {
              const name = dealer?.businessName || dealer?.name || 'Unknown';
              return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
            };

            const possibleSources = [
              dealer?.avatar?.url,
              dealer?.avatar,
              dealer?.logo?.url,
              dealer?.logo,
              dealer?.profilePicture?.url,
              dealer?.profilePicture,
              car?.dealer?.profile?.logo,
              car?.dealer?.logo,
              car?.dealer?.profilePicture,
              car?.dealer?.avatar
            ];
            
            let imageSource = null;
            for (const source of possibleSources) {
              if (source && 
                  typeof source === 'string' && 
                  source.trim() !== '' && 
                  source !== 'undefined' && 
                  source !== 'null' &&
                  !source.includes('undefined') &&
                  !source.includes('null')) {
                imageSource = source;
                break;
              }
            }
            
            if (!imageSource || dealerImageError) {
              return (
                <div className="vc-dealer-avatar-placeholder">
                  {getInitials()}
                </div>
              );
            }
            
            return (
              <img 
                className="vc-dealer-avatar" 
                src={imageSource}
                alt={dealer?.businessName || dealer?.name || 'Seller'}
                onError={(e) => {
                  if (dealerImageError) return;
                  
                  if (!e.target.src.includes('/images/placeholders/')) {
                    e.target.src = '/images/placeholders/avatar.jpg';
                    return;
                  }
                  
                  setDealerImageError(true);
                }}
                onLoad={() => {
                  if (dealerImageError) {
                    setDealerImageError(false);
                  }
                }}
              />
            );
          })()}

          <div className="vc-dealer-details">
            <div className="vc-dealer-name">
              {dealer?.businessName || dealer?.name || 'Unknown Seller'}
              {dealer?.verification?.isVerified && (
                <span className="vc-verified-icon" title="Verified Seller">✓</span>
              )}
            </div>
            
            <div className="vc-dealer-meta">
              <span className={`vc-seller-type ${dealer?.sellerType || 'dealership'}`}>
                {dealer?.sellerTypeLabel || (dealer?.sellerType === 'private' ? 'Private Seller' : 'Dealership')}
              </span>
              <span className="vc-dealer-location">
                {dealer?.location?.city || 'Unknown Location'}
                {dealer?.location?.country ? `, ${dealer.location.country}` : ''}
              </span>
            </div>
            
            <div className="vc-dealer-actions">
              {dealer.id && dealer.sellerType === 'dealership' && (
                <span className="vc-dealer-link">View Dealership</span>
              )}
              {dealer.sellerType === 'private' && dealer.privateSeller?.preferredContactMethod && (
                <span className="vc-contact-preference">
                  Contact: {dealer.privateSeller.preferredContactMethod === 'phone' ? 'Phone' : 
                           dealer.privateSeller.preferredContactMethod === 'whatsapp' ? 'WhatsApp' : 'Phone/WhatsApp'}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="vc-footer">
          <span className={`vc-condition-tag ${(car.condition || 'used').toLowerCase()}`}>
            {car.condition ? 
              car.condition.charAt(0).toUpperCase() + car.condition.slice(1).toLowerCase() : 
              'Used'}
          </span>
          <div className="vc-actions">
            <button 
              className="vc-share-btn"
              onClick={handleShareClick}
              aria-label="Share"
            >
              Share
            </button>
            <button 
              className="vc-reserve-btn"
              onClick={handleReserveClick}
              aria-label={dealer?.sellerType === 'private' ? 'Contact Seller' : 'Reserve Vehicle'}
              disabled={car.status === 'sold'}
            >
              {car.status === 'sold' 
                ? 'Sold' 
                : (dealer?.sellerType === 'private' ? 'Contact' : 'Reserve')
              }
            </button>
            <button className="vc-details-btn">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(VehicleCard);