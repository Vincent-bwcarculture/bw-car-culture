// src/components/shared/VehicleCard/VehicleCard.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  // FIXED: Enhanced checkFailedImage function to include type
  const checkFailedImage = useCallback((url, type = 'general') => {
    try {
      const failedImages = JSON.parse(localStorage.getItem('failedImages') || '{}');
      const key = `${url}_${type}`;
      const failureTime = failedImages[key];
      
      if (!failureTime) return false;
      
      // Clear cache entries older than 1 hour to allow retry
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

  // FIXED: Enhanced markFailedImage function
  const markFailedImage = useCallback((url, type = 'general') => {
    try {
      const failedImages = JSON.parse(localStorage.getItem('failedImages') || '{}');
      const key = `${url}_${type}`;
      failedImages[key] = Date.now();
      
      // Limit cache size to prevent localStorage bloat
      const keys = Object.keys(failedImages);
      if (keys.length > 100) {
        const oldestKey = keys.sort((a, b) => failedImages[a.split('_')[0]] - failedImages[b.split('_')[0]])[0];
        delete failedImages[oldestKey];
      }
      localStorage.setItem('failedImages', JSON.stringify(failedImages));
    } catch (e) {
      // Ignore localStorage errors
      console.warn('Failed to cache failed image URL:', e);
    }
  }, []);

  // Utility function to safely get string ID from MongoDB ObjectId or any object
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

  // Helper function to safely extract image URL - Updated for S3
  const getImageUrl = useCallback(() => {
    if (!car || !car.images || !Array.isArray(car.images) || car.images.length === 0) {
      return '/images/placeholders/car.jpg';
    }
    
    try {
      const image = car.images[activeImageIndex] || car.images[0];
      let imageUrl = '';
      
      // Handle string-based image entries
      if (typeof image === 'string') {
        imageUrl = image;
      } 
      // Handle object-based image entries
      else if (image && typeof image === 'object') {
        // First try to get the main URL
        imageUrl = image.url || image.thumbnail || '';
        
        // For S3 specific handling
        if (!imageUrl && image.key) {
          // If we have an S3 key but no URL, try proxy
          imageUrl = `/api/images/s3-proxy/${image.key}`;
        }
      }
      
      // If we still don't have a URL, use placeholder
      if (!imageUrl) {
        return '/images/placeholders/car.jpg';
      }
      
      // Check if this image previously failed
      if (checkFailedImage(imageUrl)) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Using cached fallback for previously failed image: ${imageUrl}`);
        }
        return '/images/placeholders/car.jpg';
      }
      
      // Clean up problematic URLs
      if (imageUrl.includes('/images/images/')) {
        imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
      }
      
      // Handle fully-formed URLs (including S3 URLs)
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      
      // Handle relative paths
      if (!imageUrl.startsWith('/')) {
        imageUrl = `/${imageUrl}`;
      }
      
      return imageUrl;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error getting image URL:`, error);
      }
      return '/images/placeholders/car.jpg';
    }
  }, [car, activeImageIndex, checkFailedImage]);

  // FIXED: Complete getDealerImageUrl function
  const getDealerImageUrl = useCallback((imageData, type = 'logo') => {
    try {
      if (!imageData) {
        return `/images/placeholders/${type === 'logo' ? 'dealer-logo' : 'dealer-avatar'}.jpg`;
      }
      
      let imageUrl = '';
      
      // If imageData is a string, use it directly
      if (typeof imageData === 'string') {
        imageUrl = imageData;
        
        // Check for cached failed images
        if (checkFailedImage(imageUrl, type)) {
          return `/images/placeholders/${type === 'logo' ? 'dealer-logo' : 'dealer-avatar'}.jpg`;
        }
        
        // If it's an S3 URL, use it directly
        if (imageUrl.includes('amazonaws.com')) {
          return imageUrl;
        }
        
        // Fix problematic S3 URLs with duplicate paths
        if (imageUrl.includes('/images/images/')) {
          return imageUrl.replace(/\/images\/images\//g, '/images/');
        }
        
        // Handle relative paths
        if (!imageUrl.startsWith('/') && !imageUrl.startsWith('http')) {
          // Extract just the filename if it has path elements
          const filename = imageUrl.split('/').pop();
          return `/uploads/dealers/${filename}`;
        }
        
        // For paths that already start with a slash
        return imageUrl;
      }
      
      // If imageData is an object with url property
      if (imageData && typeof imageData === 'object') {
        imageUrl = imageData.url || '';
        
        // If we have an S3 key but no URL, create a proper URL
        if (!imageUrl && imageData.key) {
          // Try to determine if it's a full S3 URL or just a key
          if (imageData.key.includes('amazonaws.com')) {
            return imageData.key;
          } else {
            return `/uploads/dealers/${imageData.key}`;
          }
        }
        
        if (imageUrl) {
          // Check for cached failed images
          if (checkFailedImage(imageUrl, type)) {
            return `/images/placeholders/${type === 'logo' ? 'dealer-logo' : 'dealer-avatar'}.jpg`;
          }
          
          // Fix problematic S3 URLs with duplicate paths
          if (imageUrl.includes('/images/images/')) {
            return imageUrl.replace(/\/images\/images\//g, '/images/');
          }
          
          return imageUrl;
        }
      }
      
      // Final fallback
      return `/images/placeholders/${type === 'logo' ? 'dealer-logo' : 'dealer-avatar'}.jpg`;
    } catch (error) {
      console.error(`Error getting dealer ${type} URL:`, error);
      return `/images/placeholders/${type === 'logo' ? 'dealer-logo' : 'dealer-avatar'}.jpg`;
    }
  }, [checkFailedImage]);

  // Calculate savings information
  const calculateSavings = useMemo(() => {
    if (!car || !car.priceOptions) return null;
    
    const { originalPrice, savingsAmount, savingsPercentage, showSavings, exclusiveDeal, savingsDescription, savingsValidUntil } = car.priceOptions;
    
    if (!showSavings) return null;
    
    // If we have explicit savings amount
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
    
    // If we have original price, calculate savings
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
      
      // Extract dealer ID
      if (car.dealerId) {
        dealerId = safeGetStringId(car.dealerId);
      } else if (car.dealer._id) {
        dealerId = safeGetStringId(car.dealer._id);
      } else if (car.dealer.id) {
        dealerId = safeGetStringId(car.dealer.id);
      }
      
      // ENHANCED: Multiple ways to detect private seller
      const isPrivateSeller = 
        // Explicit seller type
        car.dealer.sellerType === 'private' ||
        // Has private seller data
        (car.dealer.privateSeller && 
         car.dealer.privateSeller.firstName && 
         car.dealer.privateSeller.lastName) ||
        // Business name indicates private seller
        (car.dealer.businessName && 
         (car.dealer.businessName.includes('Private') || 
          car.dealer.businessName.match(/^[A-Z][a-z]+ [A-Z][a-z]+$/))) ||
        // No business type (dealerships should have business type)
        (!car.dealer.businessType && car.dealer.name && !car.dealer.businessName);

      // ENHANCED: Better display name calculation
      let displayName = 'Unknown Seller';
      let contactName = null;
      let sellerTypeLabel = 'Dealership';
      
      if (isPrivateSeller) {
        sellerTypeLabel = 'Private Seller';
        
        // Try different sources for private seller name
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
          phone: car.dealer.contact?.phone || null,
          email: car.dealer.contact?.email || null,
          website: !isPrivateSeller ? car.dealer.contact?.website : null // Only show website for dealerships
        },
        // Private seller specific data
        privateSeller: isPrivateSeller ? {
          firstName: car.dealer.privateSeller?.firstName || null,
          lastName: car.dealer.privateSeller?.lastName || null,
          preferredContactMethod: car.dealer.privateSeller?.preferredContactMethod || 'both',
          canShowContactInfo: car.dealer.privateSeller?.canShowContactInfo !== false
        } : null,
        // Dealership specific data
        businessType: !isPrivateSeller ? car.dealer.businessType : null,
        workingHours: !isPrivateSeller ? car.dealer.workingHours : null
      };
    }
    
    // Fallback when no dealer info is available
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
    
    // Final fallback
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
      }, 1000); // Track after 1 second of visibility

      return () => clearTimeout(timer);
    }
  }, [car, hasBeenViewed, analytics, dealer, calculateSavings, compact]);

  useEffect(() => {
    setImageLoadError(false);
  }, [car, activeImageIndex]);

  const handleCardClick = useCallback(() => {
    if (!car || !car._id) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Cannot navigate: Missing car ID", car);
      }
      return;
    }

    // Track card click
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

  const handleImageNavigation = useCallback((e, direction) => {
    e.stopPropagation();
    
    if (!car || !car.images || !Array.isArray(car.images) || car.images.length <= 1) return;
    
    // Track image navigation
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
        return (prev + 1) % car.images.length;
      } else {
        return (prev - 1 + car.images.length) % car.images.length;
      }
    });
    
    setImageLoadError(false);
  }, [car, activeImageIndex, analytics]);

  const handleShareClick = useCallback((e) => {
    e.stopPropagation();

    // Track share action
    try {
      analytics.trackEvent('listing_share', {
        category: 'engagement',
        elementId: car._id,
        metadata: {
          listingId: car._id,
          title: car.title,
          price: car.price,
          dealerId: dealer?.id,
          sellerType: dealer?.sellerType,
          shareMethod: 'button'
        }
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }

    if (onShare) {
      onShare(car, e.currentTarget);
    }
  }, [car, onShare, analytics, dealer]);
  
  // ENHANCED: Better reservation handling for private sellers vs dealerships
  const handleReserveClick = useCallback((e) => {
    e.stopPropagation();
    
    // Track reservation intent
    try {
      analytics.trackDealerContact(dealer?.id || 'unknown', 'whatsapp');
      analytics.trackEvent('vehicle_reservation', {
        category: 'conversion',
        elementId: car._id,
        metadata: {
          listingId: car._id,
          title: car.title,
          price: car.price,
          dealerId: dealer?.id,
          sellerType: dealer?.sellerType,
          contactMethod: 'whatsapp',
          savings: calculateSavings?.amount || 0
        }
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
    
    const make = car.specifications?.make || '';
    const model = car.specifications?.model || '';
    const year = car.specifications?.year || '';
    const title = car.title || `${year} ${make} ${model}`.trim() || 'Vehicle';
    
    // Include savings information in WhatsApp message
    const savingsInfo = calculateSavings ? `\n💰 *SPECIAL BW CAR CULTURE SAVINGS*\nOriginal Price: P${calculateSavings.originalPrice.toLocaleString()}\nYour Savings: P${calculateSavings.amount.toLocaleString()}\n` : '';
    
    const vehicleDetails = [
      `*${year} ${title}*`,
      savingsInfo,
      `Our Price: P${(car.price || 0).toLocaleString()}`,
      car.specifications?.mileage ? `Mileage: ${car.specifications.mileage.toLocaleString()} km` : '',
      car.specifications?.transmission ? `Transmission: ${car.specifications.transmission}` : '',
      car.specifications?.fuelType ? `Fuel Type: ${car.specifications.fuelType}` : '',
      car.specifications?.engineSize ? `Engine: ${car.specifications.engineSize}` : '',
      car.specifications?.drivetrain ? `Drivetrain: ${car.specifications.drivetrain.toUpperCase()}` : '',
      car.condition ? `Condition: ${car.condition}` : '',
      car.location?.city ? `Location: ${car.location.city}` : ''
    ].filter(Boolean).join('\n');
    
    const contactAction = dealer?.sellerType === 'private' ? 'contact this private seller' : 'reserve this vehicle';
    const message = `Hi! I'm interested in this vehicle from Bw Car Culture:\n\n${vehicleDetails}\n\nI'd like to ${contactAction}. Please provide more details.`;
    
    // Contact dealer
    const phone = dealer?.contact?.phone;
    if (phone) {
      // Format phone number for WhatsApp (remove spaces, ensure it starts with country code)
      const formattedPhone = phone.startsWith('+') ? phone.replace(/\s+/g, '') : `+267${phone.replace(/\s+/g, '')}`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
    } else {
      const sellerTypeText = dealer?.sellerType === 'private' ? 'seller' : 'dealer';
      alert(`${dealer?.sellerTypeLabel || 'Seller'} contact information is not available. Please view details to contact the ${sellerTypeText}.`);
    }
  }, [car, dealer, calculateSavings, analytics]);

  // ENHANCED: Different handling for private sellers vs dealerships
  const handleDealerClick = useCallback((e) => {
    e.stopPropagation();
    
    // Don't navigate for private sellers - they don't have dealer pages
    if (dealer?.sellerType === 'private') {
      return;
    }
    
    // Track dealer click
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

  // Improved image error handler
  const handleImageError = useCallback((e) => {
    const originalSrc = e.target.src;
    if (process.env.NODE_ENV === 'development') {
      console.log(`Image failed to load: ${originalSrc}`);
    }
    markFailedImage(originalSrc);
    
    // Track image load errors
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
    
    // If URL already contains certain patterns, go straight to placeholder
    if (originalSrc.includes('/api/images/s3-proxy/') || 
        originalSrc.includes('/uploads/listings/') ||
        originalSrc.includes('images/images/') ||
        originalSrc.includes('/images/placeholders/')) {
      e.target.src = '/images/placeholders/car.jpg';
      return;
    }
    
    // For S3 URLs, try the proxy once
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
    
    // For relative paths, try direct listing path once
    const filename = originalSrc.split('/').pop();
    if (filename && !originalSrc.includes('/images/placeholders/')) {
      e.target.src = `/uploads/listings/${filename}`;
      return;
    }
    
    // Final fallback - always a direct path to placeholder
    e.target.src = '/images/placeholders/car.jpg';
  }, [markFailedImage, analytics, car, activeImageIndex]);

  // Format valid until date
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
    <div className={`vc-card ${compact ? 'compact' : ''}`} onClick={handleCardClick}>
      <div className="vc-image-container">
        <img 
          src={getImageUrl()} 
          alt={car.title || 'Vehicle'} 
          className="vc-image"
          loading="lazy"
          onError={handleImageError}
        />
        
        {/* Savings Badge */}
        {calculateSavings && (
          <div className={`vc-savings-badge ${calculateSavings.isExclusive ? 'vc-exclusive-badge' : ''}`}>
            <div className="vc-savings-badge-amount">P{calculateSavings.amount.toLocaleString()}</div>
            <div className="vc-savings-badge-label">SAVE</div>
            <div className="vc-savings-tooltip">
              <div className="vc-savings-tooltip-header">
                💰 {calculateSavings.isExclusive ? 'Exclusive Bw Car Culture Deal' : 'Bw Car Culture Savings'}
              </div>
              <div className="vc-savings-tooltip-row">
                <span>Original Price:</span>
                <span>P{calculateSavings.originalPrice.toLocaleString()}</span>
              </div>
              <div className="vc-savings-tooltip-row">
                <span>Our Price:</span>
                <span>P{car.price.toLocaleString()}</span>
              </div>
              <div className="vc-savings-tooltip-row">
                <span>You Save:</span>
                <span>P{calculateSavings.amount.toLocaleString()}</span>
              </div>
              {calculateSavings.validUntil && formatValidUntil(calculateSavings.validUntil) && (
                <div className="vc-savings-tooltip-description">
                  Valid until {formatValidUntil(calculateSavings.validUntil)}
                </div>
              )}
              {calculateSavings.description && (
                <div className="vc-savings-tooltip-description">
                  {calculateSavings.description}
                </div>
              )}
            </div>
          </div>
        )}
        
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
        
        {dealer.verification?.isVerified && (
          <span className="vc-verified-badge">✓ Verified</span>
        )}
      </div>
      
      <div className="vc-content">
        <div className="vc-header">
          <h4 className="vc-title">{car.title || 'Untitled Vehicle'}</h4>
          <div className="vc-price-container">
            {/* Show original price if savings available */}
            {calculateSavings && (
              <div className="vc-original-price">
                Was: P {calculateSavings.originalPrice.toLocaleString()}
              </div>
            )}
            <span className="vc-price vc-pula-price">
              {car.priceOptions?.showPriceAsPOA 
                ? 'POA' 
                : `P ${(car.price || 0).toLocaleString()}`}
            </span>
            {/* Show savings highlight */}
            {calculateSavings && (
              <div className="vc-savings-highlight">
                You Save: P {calculateSavings.amount.toLocaleString()}
              </div>
            )}
            {car.priceOptions?.monthlyPayment && !car.priceOptions?.showPriceAsPOA && (
              <div className="vc-monthly-payment">
                <span className="vc-monthly-payment-value">P {car.priceOptions.monthlyPayment.toLocaleString()} p/m</span>
              </div>
            )}
            {car.priceOptions?.financeAvailable && dealer?.sellerType === 'dealership' && (
              <div className="vc-finance-badge">Finance Available</div>
            )}
            {car.priceOptions?.leaseAvailable && dealer?.sellerType === 'dealership' && (
              <div className="vc-lease-badge">Lease Available</div>
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
            <span className="vc-spec-value">
              {car.specifications?.mileage 
                ? `${car.specifications.mileage.toLocaleString()} km` 
                : 'N/A'}
            </span>
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
        
        {/* FIXED: Enhanced seller info section with proper image handling */}
        <div className={`vc-dealer-info ${dealer?.sellerType === 'private' ? 'private-seller' : 'dealership'}`} 
             onClick={dealer?.sellerType !== 'private' ? handleDealerClick : undefined}>
          
          {(() => {
            // Determine the correct image source with multiple fallbacks
            let imageSource = null;
            
            // Try multiple possible image sources in order of preference
            if (car.dealer?.profile?.logo) {
              imageSource = car.dealer.profile.logo;
            } else if (dealer?.logo) {
              imageSource = dealer.logo;
            } else if (car.dealer?.logo) {
              imageSource = car.dealer.logo;
            } else if (car.dealer?.profilePicture) {
              imageSource = car.dealer.profilePicture;
            } else if (car.dealer?.avatar) {
              imageSource = car.dealer.avatar;
            }
            
            // Show placeholder if no image source or previous error
            if (!imageSource || dealerImageError) {
              return (
                <div className="vc-dealer-avatar-placeholder">
                  {dealer?.businessName?.charAt(0) || dealer?.name?.charAt(0) || '?'}
                </div>
              );
            }
            
            // Show image with comprehensive error handling
            return (
              <img 
                src={getDealerImageUrl(imageSource, 'logo')}
                alt={dealer?.businessName || dealer?.name || 'Seller'} 
                className="vc-dealer-avatar"
                loading="lazy"
                onError={(e) => {
                  const originalSrc = e.target.src;
                  console.log('Dealer image failed to load:', originalSrc, 'for dealer:', dealer?.businessName);
                  
                  // Mark this image as failed to prevent future attempts
                  markFailedImage(originalSrc, 'logo');
                  
                  // Try fallback strategies before giving up
                  if (!originalSrc.includes('/images/placeholders/')) {
                    
                    // Strategy 1: For S3 URLs, try proxy approach
                    if (originalSrc.includes('amazonaws.com')) {
                      const key = originalSrc.split('.amazonaws.com/').pop();
                      if (key && !originalSrc.includes('/api/images/s3-proxy/')) {
                        const normalizedKey = key.replace(/images\/images\//g, 'images/');
                        e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
                        return;
                      }
                    }
                    
                    // Strategy 2: Try local upload path
                    if (!originalSrc.includes('/uploads/dealers/')) {
                      const filename = originalSrc.split('/').pop();
                      if (filename && filename.includes('.')) {
                        e.target.src = `/uploads/dealers/${filename}`;
                        return;
                      }
                    }
                    
                    // Strategy 3: Try alternative placeholder paths
                    if (dealer?.sellerType === 'private') {
                      e.target.src = '/images/placeholders/private-seller-avatar.jpg';
                      return;
                    }
                  }
                  
                  // Final fallback - trigger placeholder display
                  setDealerImageError(true);
                }}
                onLoad={() => {
                  // Reset error state on successful load
                  if (dealerImageError) {
                    setDealerImageError(false);
                  }
                }}
              />
            );
          })()}

          <div className="vc-dealer-details">
            <span className="vc-dealer-name">
              {dealer?.businessName || dealer?.name || 'Unknown Seller'}
              {dealer?.verification?.isVerified && (
                <span className="vc-verified-icon" title="Verified Seller">✓</span>
              )}
            </span>
            <span className={`vc-seller-type ${dealer?.sellerType || 'dealership'}`}>
              {dealer?.sellerTypeLabel || (dealer?.sellerType === 'private' ? 'Private Seller' : 'Dealership')}
            </span>
            <span className="vc-dealer-location">
              {dealer?.location?.city || 'Unknown Location'}
              {dealer?.location?.country ? `, ${dealer.location.country}` : ''}
            </span>
            {/* Only show "View Dealership" link for actual dealerships */}
            {dealer.id && dealer.sellerType === 'dealership' && (
              <span className="vc-dealer-link">View Dealership</span>
            )}
            {/* Show contact preference for private sellers */}
            {dealer.sellerType === 'private' && dealer.privateSeller?.preferredContactMethod && (
              <span className="vc-contact-preference">
                Contact: {dealer.privateSeller.preferredContactMethod === 'phone' ? 'Phone' : 
                         dealer.privateSeller.preferredContactMethod === 'whatsapp' ? 'WhatsApp' : 'Phone/WhatsApp'}
              </span>
            )}
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
            >
              {dealer?.sellerType === 'private' ? 'Contact' : 'Reserve'}
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