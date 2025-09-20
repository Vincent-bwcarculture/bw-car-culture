// client/src/components/shared/VehicleCard/SmallVehicleCard.js
// Small compact card similar to BMW dealership cards

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './SmallVehicleCard.css';

const SmallVehicleCard = ({ 
  car, 
  onShare, 
  compact = false,
  className = '',
  onClick,
  showSavings = true,
  showDealer = true 
}) => {
  const navigate = useNavigate();
  const shareButtonRef = useRef(null);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Memoized car data processing
  const processedCar = useMemo(() => {
    if (!car) return null;

    return {
      id: car._id || car.id,
      title: car.title || `${car.year} ${car.make} ${car.model}`,
      make: car.make || 'Unknown',
      model: car.model || 'Model',
      year: car.year || 'N/A',
      price: car.price || 0,
      originalPrice: car.originalPrice || null,
      savings: car.savings || null,
      currency: car.currency || 'P',
      images: car.images || [],
      specifications: car.specifications || {},
      dealer: car.dealer || {},
      isFeatured: car.isFeatured || false,
      isPremium: car.isPremium || false,
      condition: car.condition || 'used',
      location: car.location || 'Gaborone',
      createdAt: car.createdAt || new Date(),
      warranty: car.warranty || false,
      serviceHistory: car.serviceHistory || {},
      isCertified: car.isCertified || false
    };
  }, [car]);

  // Get the main image
  const mainImage = useMemo(() => {
    if (!processedCar?.images?.length) return null;
    
    const validImages = processedCar.images.filter(img => 
      img && typeof img === 'string' && img.trim() !== ''
    );
    
    return validImages[0] || null;
  }, [processedCar?.images]);

  // Format price
  const formatPrice = useCallback((price) => {
    if (!price || price === 0) return 'Price on request';
    return `${processedCar.currency} ${price.toLocaleString()}`;
  }, [processedCar?.currency]);

  // Handle card click
  const handleCardClick = useCallback((e) => {
    if (e.target.closest('.svc-share-button') || e.target.closest('.svc-dealer-info')) {
      return;
    }
    
    if (onClick) {
      onClick(processedCar);
    } else if (processedCar?.id) {
      navigate(`/marketplace/${processedCar.id}`);
    }
  }, [onClick, processedCar, navigate]);

  // Handle share click
  const handleShareClick = useCallback((e) => {
    e.stopPropagation();
    if (onShare && processedCar) {
      onShare(processedCar, shareButtonRef.current);
    }
  }, [onShare, processedCar]);

  // Handle dealer click
  const handleDealerClick = useCallback((e) => {
    e.stopPropagation();
    if (processedCar?.dealer?.id) {
      navigate(`/dealer/${processedCar.dealer.id}`);
    }
  }, [navigate, processedCar?.dealer?.id]);

  // Handle image load/error
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);
  }, []);

  // Get dealer info
  const dealer = processedCar?.dealer || {};
  const isPrivateSeller = dealer.sellerType === 'private';

  // Get avatar/logo for dealer
  const getDealerAvatar = useCallback(() => {
    const possibleSources = [
      dealer?.avatar?.url,
      dealer?.avatar,
      dealer?.logo?.url,
      dealer?.logo,
      dealer?.profilePicture?.url,
      dealer?.profilePicture
    ];
    
    for (const source of possibleSources) {
      if (source && typeof source === 'string' && source.trim() !== '') {
        return source;
      }
    }
    return null;
  }, [dealer]);

  const getInitials = useCallback(() => {
    const name = dealer?.businessName || dealer?.name || 'Unknown';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
  }, [dealer]);

  // Early return for invalid car data
  if (!processedCar) {
    return (
      <div className="small-vehicle-card error-card">
        <div className="svc-error">
          <p>Unable to load vehicle information</p>
        </div>
      </div>
    );
  }

  return (
    <article 
      className={`small-vehicle-card ${className} ${processedCar?.isFeatured ? 'featured' : ''} ${processedCar?.isPremium ? 'premium' : ''}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e);
        }
      }}
    >
      {/* Image Container */}
      <div className="svc-image-container">
        {mainImage && !imageError ? (
          <img
            src={mainImage}
            alt={processedCar.title}
            className="svc-image"
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <div className="svc-image-placeholder">
            <div className="svc-placeholder-icon">🚗</div>
          </div>
        )}
        
        {imageLoading && mainImage && (
          <div className="svc-image-loading">
            <div className="svc-loading-spinner"></div>
          </div>
        )}
        
        {/* Savings Badge */}
        {showSavings && processedCar.savings && (
          <div className="svc-savings-badge">
            {processedCar.currency} {processedCar.savings.toLocaleString()}
          </div>
        )}
        
        {/* Share Button */}
        <button
          ref={shareButtonRef}
          className="svc-share-button"
          onClick={handleShareClick}
          title="Share this vehicle"
          aria-label="Share this vehicle"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.05 4.11c-.05.23-.09.46-.09.7 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="svc-content">
        {/* Price Display */}
        <div className="svc-price-section">
          <div className="svc-price">{formatPrice(processedCar.price)}</div>
          {processedCar.originalPrice && processedCar.originalPrice > processedCar.price && (
            <div className="svc-original-price">
              {formatPrice(processedCar.originalPrice)}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="svc-title" title={processedCar.title}>
          {processedCar.title}
        </div>

        {/* Key Specs - Compact Layout */}
        <div className="svc-specs">
          <div className="svc-spec">
            <span className="svc-spec-value">{processedCar.year}</span>
          </div>
          <div className="svc-spec">
            <span className="svc-spec-value">
              {processedCar.specifications.mileage ? 
                `${processedCar.specifications.mileage.toLocaleString()}km` : 'N/A'}
            </span>
          </div>
          <div className="svc-spec">
            <span className="svc-spec-value">
              {processedCar.specifications?.transmission ? 
                processedCar.specifications.transmission.charAt(0).toUpperCase() + 
                processedCar.specifications.transmission.slice(1) : 'Auto'}
            </span>
          </div>
          <div className="svc-spec">
            <span className="svc-spec-value">
              {processedCar.specifications?.fuelType ? 
                processedCar.specifications.fuelType.charAt(0).toUpperCase() + 
                processedCar.specifications.fuelType.slice(1) : 'Petrol'}
            </span>
          </div>
        </div>

        {/* Dealer Info - Compact */}
        {showDealer && (
          <div 
            className={`svc-dealer-info ${isPrivateSeller ? 'private-seller' : 'dealership'}`}
            onClick={!isPrivateSeller ? handleDealerClick : undefined}
          >
            <div className="svc-dealer-avatar">
              {getDealerAvatar() ? (
                <img 
                  src={getDealerAvatar()} 
                  alt={dealer.businessName || dealer.name || 'Dealer'} 
                />
              ) : (
                <span className="svc-avatar-initials">{getInitials()}</span>
              )}
            </div>
            
            <div className="svc-dealer-details">
              <div className="svc-dealer-name">
                {dealer.businessName || dealer.name || 'Private Seller'}
              </div>
              <div className="svc-dealer-location">
                {dealer.location || processedCar.location}
              </div>
            </div>
            
            {dealer.isVerified && (
              <div className="svc-verified-badge" title="Verified Dealer">
                ✓
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default SmallVehicleCard;
