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
  const [showNavigation, setShowNavigation] = useState(false); // For mobile tap-to-reveal

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
        const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
        delete failedImages[oldestKey];
      }
      localStorage.setItem('failedImages', JSON.stringify(failedImages));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Helper function to safely extract IDs from various formats
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
        
        // Fix problematic S3 URLs with duplicate paths
        if (imageUrl.includes('/images/images/')) {
          imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
        }
        
        return imageUrl;
      }
      
      if (typeof currentImage === 'string') {
        // If it's already a full URL
        if (currentImage.startsWith('http://') || currentImage.startsWith('https://')) {
          let imageUrl = currentImage;
          
          // Fix problematic S3 URLs with duplicate paths
          if (imageUrl.includes('/images/images/')) {
            imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
          }
          
          return imageUrl;
        }
        
        // If it's a relative path, ensure it starts with /
        const imageUrl = currentImage.startsWith('/') ? currentImage : `/${currentImage}`;
        
        // Fix problematic paths
        if (imageUrl.includes('/images/images/')) {
          return imageUrl.replace(/\/images\/images\//g, '/images/');
        }
        
        return imageUrl;
      }
      
      // Fallback
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
      
      // Try to get the image from various possible sources
      if (type === 'logo') {
        imageUrl = car.dealer.profile?.logo || car.dealer.logo || car.dealer.profilePicture;
      } else {
        imageUrl = car.dealer.profile?.avatar || car.dealer.avatar || car.dealer.profilePicture || car.dealer.logo;
      }
      
      if (imageUrl) {
        // If it's already a full URL
        if (typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
          return imageUrl;
        }
        
        // If it's an object with url property
        if (typeof imageUrl === 'object' && imageUrl.url) {
          return imageUrl.url;
        }
        
        // If it's a relative path
        if (typeof imageUrl === 'string') {
          const fullUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
          return fullUrl.replace(/\/images\/images\//g, '/images/');
        }
      }
      
      // Final fallback
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

  // Handle image container tap for mobile navigation reveal
  const handleImageContainerClick = useCallback((e) => {
    // Only handle this on mobile devices (768px and below)
    if (window.innerWidth <= 768) {
      e.stopPropagation(); // Prevent card click
      setShowNavigation(true);
      
      // Hide navigation after 3 seconds of inactivity
      setTimeout(() => {
        setShowNavigation(false);
      }, 3000);
    }
  }, []);

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
        return prev >= car.images.length - 1 ? 0 : prev + 1;
      } else {
        return prev <= 0 ? car.images.length - 1 : prev - 1;
      }
    });
  }, [car, activeImageIndex, analytics]);

  const handleShareClick = useCallback((e) => {
    e.stopPropagation();
    
    // Track share click
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
      // Fallback share functionality
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
    
    // Track reserve/contact click
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
    
    // Generate message content for WhatsApp
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
  }, [car, dealer, analytics]);

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
      <div 
        className={`vc-image-container ${showNavigation ? 'show-navigation' : ''}`}
        onClick={handleImageContainerClick}
      >
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
      
      <div className="vc-content">
        <div className="vc-header">
          <div className="vc-title-section">
            <h4 className="vc-title">{car.title || 'Vehicle Listing'}</h4>
            {/* Only move finance/lease badges under title - keep monthly payment with price */}
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
            {calculateSavings && (
              <div className="vc-original-price">P{calculateSavings.originalPrice.toLocaleString()}</div>
            )}
            <div className="vc-price">
              P{car.price?.toLocaleString() || '0'}
            </div>
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
        
        {/* OPTIMIZED: Compact seller info section for better space utilization */}
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
            
            // Return image with comprehensive error handling
            return (
              <img 
                className="vc-dealer-avatar" 
                src={imageSource}
                alt={dealer?.businessName || dealer?.name || 'Seller'}
                onError={(e) => {
                  // Prevent infinite loop
                  if (dealerImageError) return;
                  
                  const originalSrc = e.target.src;
                  
                  // Strategy 1: Try fixing common S3 path issues
                  if (originalSrc.includes('/images/images/')) {
                    e.target.src = originalSrc.replace(/\/images\/images\//g, '/images/');
                    return;
                  }
                  
                  // Strategy 2: Try different file extensions or fallback paths
                  if (originalSrc.includes('/api/images/s3-proxy/')) {
                    const filename = originalSrc.split('/').pop();
                    e.target.src = `/uploads/dealers/${filename}`;
                    return;
                  }
                  
                  // Strategy 3: Try alternative placeholder paths
                  if (dealer?.sellerType === 'private') {
                    e.target.src = '/images/placeholders/private-seller-avatar.jpg';
                    return;
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
            {/* Top row: Name and verification */}
            <div className="vc-dealer-name">
              {dealer?.businessName || dealer?.name || 'Unknown Seller'}
              {dealer?.verification?.isVerified && (
                <span className="vc-verified-icon" title="Verified Seller">✓</span>
              )}
            </div>
            
            {/* Second row: Seller type and location */}
            <div className="vc-dealer-meta">
              <span className={`vc-seller-type ${dealer?.sellerType || 'dealership'}`}>
                {dealer?.sellerTypeLabel || (dealer?.sellerType === 'private' ? 'Private Seller' : 'Dealership')}
              </span>
              <span className="vc-dealer-location">
                {dealer?.location?.city || 'Unknown Location'}
                {dealer?.location?.country ? `, ${dealer.location.country}` : ''}
              </span>
            </div>
            
            {/* Third row: Actions and contact preferences */}
            <div className="vc-dealer-actions">
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