// client/src/components/shared/VehicleCard/ListVehicleCard.js
// Horizontal list view card for marketplace

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import './ListVehicleCard.css';

const ListVehicleCard = ({ 
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
    if (e.target.closest('.lvc-share-button') || e.target.closest('.lvc-dealer-info')) {
      return;
    }
    
    if (onClick) {
      onClick(processedCar);
    } else {
      navigate(`/marketplace/${processedCar.id}`);
    }
  }, [onClick, processedCar, navigate]);

  // Handle share click
  const handleShareClick = useCallback((e) => {
    e.stopPropagation();
    if (onShare && processedCar) {
      onShare(processedCar);
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

  if (!processedCar) {
    return (
      <div className="list-vehicle-card error-card">
        <div className="lvc-error">
          <p>Unable to load vehicle information</p>
        </div>
      </div>
    );
  }

  return (
    <article 
      className={`list-vehicle-card ${className} ${processedCar?.isFeatured ? 'featured' : ''} ${processedCar?.isPremium ? 'premium' : ''}`}
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
      <div className="lvc-image-container">
        {mainImage && !imageError ? (
          <img
            src={mainImage}
            alt={processedCar.title}
            className="lvc-image"
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <div className="lvc-image-placeholder">
            <div className="lvc-placeholder-icon">🚗</div>
            <span>No Image</span>
          </div>
        )}
        
        {imageLoading && mainImage && (
          <div className="lvc-image-loading">
            <div className="lvc-loading-spinner"></div>
          </div>
        )}
        
        {/* Savings Badge */}
        {showSavings && processedCar.savings && (
          <div className="lvc-savings-badge">
            Save {processedCar.currency} {processedCar.savings.toLocaleString()}
          </div>
        )}
        
        {/* Share Button */}
        <button
          ref={shareButtonRef}
          className="lvc-share-button"
          onClick={handleShareClick}
          title="Share this vehicle"
          aria-label="Share this vehicle"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.05 4.11c-.05.23-.09.46-.09.7 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="lvc-content">
        {/* Header */}
        <div className="lvc-header">
          <div className="lvc-title-section">
            <h3 className="lvc-title" title={processedCar.title}>
              {processedCar.title}
            </h3>
            
            {/* Badges */}
            <div className="lvc-badges">
              {processedCar.serviceHistory?.hasServiceHistory && (
                <span className="lvc-service-badge">Service History</span>
              )}
              {processedCar.warranty && !isPrivateSeller && (
                <span className="lvc-warranty-badge">Warranty</span>
              )}
              {processedCar.isCertified && !isPrivateSeller && (
                <span className="lvc-certified-badge">Certified</span>
              )}
            </div>
          </div>
          
          <div className="lvc-price-section">
            <div className="lvc-price">{formatPrice(processedCar.price)}</div>
            {processedCar.originalPrice && processedCar.originalPrice > processedCar.price && (
              <div className="lvc-original-price">
                {formatPrice(processedCar.originalPrice)}
              </div>
            )}
          </div>
        </div>

        {/* Specifications Grid */}
        <div className="lvc-specs-grid">
          <div className="lvc-spec-item">
            <span className="lvc-spec-label">Year:</span>
            <span className="lvc-spec-value">{processedCar.year}</span>
          </div>
          <div className="lvc-spec-item">
            <span className="lvc-spec-label">Mileage:</span>
            <span className="lvc-spec-value">
              {processedCar.specifications.mileage ? 
                `${processedCar.specifications.mileage.toLocaleString()}km` : 'N/A'}
            </span>
          </div>
          <div className="lvc-spec-item">
            <span className="lvc-spec-label">Transmission:</span>
            <span className="lvc-spec-value">
              {processedCar.specifications?.transmission ? 
                processedCar.specifications.transmission.charAt(0).toUpperCase() + 
                processedCar.specifications.transmission.slice(1) : 'N/A'}
            </span>
          </div>
          <div className="lvc-spec-item">
            <span className="lvc-spec-label">Fuel Type:</span>
            <span className="lvc-spec-value">
              {processedCar.specifications?.fuelType ? 
                processedCar.specifications.fuelType.charAt(0).toUpperCase() + 
                processedCar.specifications.fuelType.slice(1) : 'N/A'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="lvc-footer">
          {/* Dealer Info */}
          {showDealer && (
            <div 
              className={`lvc-dealer-info ${isPrivateSeller ? 'private-seller' : 'dealership'}`}
              onClick={!isPrivateSeller ? handleDealerClick : undefined}
            >
              <div className="lvc-dealer-avatar">
                {getDealerAvatar() ? (
                  <img 
                    src={getDealerAvatar()} 
                    alt={dealer.businessName || dealer.name || 'Dealer'} 
                  />
                ) : (
                  <span className="lvc-avatar-initials">{getInitials()}</span>
                )}
              </div>
              
              <div className="lvc-dealer-details">
                <div className="lvc-dealer-name">
                  {dealer.businessName || dealer.name || 'Private Seller'}
                </div>
                <div className="lvc-dealer-location">
                  {dealer.location || processedCar.location}
                </div>
              </div>
              
              {dealer.isVerified && (
                <div className="lvc-verified-badge" title="Verified Dealer">
                  ✓
                </div>
              )}
            </div>
          )}
          
          {/* Listing Date */}
          <div className="lvc-listing-date">
            Listed {formatDistanceToNow(new Date(processedCar.createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ListVehicleCard;
