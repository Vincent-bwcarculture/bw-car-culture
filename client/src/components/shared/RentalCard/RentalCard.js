// src/components/shared/RentalCard/RentalCard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../../../hooks/useAnalytics.js';
import { getVehicleInfo, getVehicleRate, getVehicleImageUrl, getVehicleFeatures, 
         getCategoryClass, getAvailabilityClass } from '../../../utils/vehicleHelpers.js';
import './RentalCard.css';

const RentalCard = ({ vehicle, onRent, onShare, compact = false }) => {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);
  const [showNavigation, setShowNavigation] = useState(false);
  const [navigationTimeout, setNavigationTimeout] = useState(null);

  // Utility function to safely get string ID
  const safeGetStringId = (id) => {
    if (!id) return null;
    if (typeof id === 'string' && id !== '[object Object]') return id;
    
    if (typeof id === 'object') {
      if (id._id) return typeof id._id === 'string' ? id._id : id._id.toString?.() || null;
      if (id.id) return typeof id.id === 'string' ? id.id : id.id.toString?.() || null;
      if (id.toString && id.toString() !== '[object Object]') return id.toString();
    }
    
    console.error("Failed to extract valid ID from:", id);
    return null;
  };
  
  // Enhanced image URL handler for S3
  const getImageUrl = () => {
    if (!vehicle || !vehicle.images || !Array.isArray(vehicle.images) || vehicle.images.length === 0) {
      return '/images/placeholders/car.jpg';
    }
    
    try {
      const image = vehicle.images[activeImageIndex] || vehicle.images[0];
      let imageUrl = '';
      
      // Handle string-based image entries
      if (typeof image === 'string') {
        imageUrl = image;
      } 
      // Handle object-based image entries
      else if (image && typeof image === 'object') {
        // Check for S3 URL first, then fallbacks
        imageUrl = image.url || image.thumbnail || '';
        
        // If we have S3 key but no URL, create S3 proxy URL
        if (!imageUrl && image.key) {
          return `/api/images/s3-proxy/${image.key}`;
        }
      }
      
      if (!imageUrl) {
        return '/images/placeholders/car.jpg';
      }
      
      // S3 URLs are full URLs
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        // Clean up problematic URLs with duplicated image paths
        if (imageUrl.includes('/images/images/')) {
          imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
        }
        return imageUrl;
      }
      
      // Legacy local paths - ensure they start with /
      if (!imageUrl.startsWith('/')) {
        imageUrl = `/${imageUrl}`;
      }
      
      return imageUrl;
    } catch (error) {
      console.error('Error getting rental image URL:', error);
      return '/images/placeholders/car.jpg';
    }
  };

  // Track rental view when component becomes visible
  useEffect(() => {
    if (vehicle && !hasBeenViewed) {
      const timer = setTimeout(() => {
        const vehicleStringId = safeGetStringId(vehicle._id || vehicle.id);
        if (vehicleStringId && analytics) {
          analytics.trackRentalView(vehicleStringId, {
            name: getVehicleInfo(vehicle, 'name', 'Unknown'),
            category: getVehicleInfo(vehicle, 'category', 'Unknown'),
            provider: vehicle.provider,
            dailyRate: getVehicleRate(vehicle, 'daily', 0)
          });
        }
        setHasBeenViewed(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [vehicle, analytics, hasBeenViewed]);

  // Image navigation handlers
  const handleImageNavigation = (e, direction) => {
    e.stopPropagation();
    
    if (!vehicle?.images || vehicle.images.length <= 1) return;
    
    if (direction === 'prev') {
      setActiveImageIndex(prev => 
        prev === 0 ? vehicle.images.length - 1 : prev - 1
      );
    } else {
      setActiveImageIndex(prev => 
        prev === vehicle.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Mobile navigation reveal handler
  const handleImageContainerClick = (e) => {
    // Only for mobile devices (≤768px)
    if (window.innerWidth <= 768) {
      e.stopPropagation();
      setShowNavigation(true);
      
      // Clear existing timeout
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
      
      // Set new timeout to hide arrows
      const timeout = setTimeout(() => {
        setShowNavigation(false);
      }, 3000);
      
      setNavigationTimeout(timeout);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
    };
  }, [navigationTimeout]);

  // Event handlers
  const handleCardClick = () => {
    const vehicleStringId = safeGetStringId(vehicle._id || vehicle.id);
    if (vehicleStringId) {
      if (analytics) {
        analytics.trackRentalClick(vehicleStringId, {
          name: getVehicleInfo(vehicle, 'name', 'Unknown'),
          provider: vehicle.provider
        });
      }
      navigate(`/rentals/${vehicleStringId}`);
    } else {
      console.error('Cannot navigate: Invalid vehicle ID');
    }
  };

  const handleRentClick = (e) => {
    e.stopPropagation();
    const vehicleStringId = safeGetStringId(vehicle._id || vehicle.id);
    
    if (analytics && vehicleStringId) {
      analytics.trackRentalAction(vehicleStringId, 'rent', {
        name: getVehicleInfo(vehicle, 'name', 'Unknown'),
        dailyRate: getVehicleRate(vehicle, 'daily', 0)
      });
    }
    
    if (onRent) {
      onRent(vehicle);
    } else {
      navigate(`/rentals/${vehicleStringId}/book`);
    }
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    const vehicleStringId = safeGetStringId(vehicle._id || vehicle.id);
    
    if (analytics && vehicleStringId) {
      analytics.trackRentalAction(vehicleStringId, 'share', {
        name: getVehicleInfo(vehicle, 'name', 'Unknown')
      });
    }
    
    if (onShare) {
      onShare(vehicle);
    } else {
      const shareUrl = `${window.location.origin}/rentals/${vehicleStringId}`;
      if (navigator.share) {
        navigator.share({
          title: getVehicleInfo(vehicle, 'name', 'Rental Vehicle'),
          text: `Check out this rental: ${getVehicleInfo(vehicle, 'name', 'Rental Vehicle')}`,
          url: shareUrl
        });
      } else {
        navigator.clipboard.writeText(shareUrl);
      }
    }
  };

  const handleProviderClick = (e) => {
    e.stopPropagation();
    if (vehicle.providerId) {
      navigate(`/providers/${vehicle.providerId}`);
    }
  };

  if (!vehicle) return null;

  return (
    <div className={`rental-card ${compact ? 'compact' : ''}`} onClick={handleCardClick}>
      <div 
        className={`rental-card-image-container ${showNavigation ? 'show-navigation' : ''}`}
        onClick={handleImageContainerClick}
      >
        <img 
          src={getImageUrl()} 
          alt={getVehicleInfo(vehicle, 'name', 'Rental Vehicle')}
          className="rental-card-image"
          loading="lazy"
          onError={(e) => {
            if (!imageLoadError) {
              setImageLoadError(true);
              // Try different fallback paths
              const currentSrc = e.target.src;
              
              if (currentSrc.includes('/api/images/s3-proxy/')) {
                const filename = currentSrc.split('/').pop();
                e.target.src = `/uploads/rentals/${filename}`;
                return;
              }
            }
            
            // Final fallback
            e.target.src = '/images/placeholders/car.jpg';
          }}
        />
        
        {vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 1 && (
          <div className="rental-card-image-navigation">
            <button 
              className="rental-card-image-nav prev" 
              onClick={(e) => handleImageNavigation(e, 'prev')}
              aria-label="Previous image"
            >
              ❮
            </button>
            <button 
              className="rental-card-image-nav next" 
              onClick={(e) => handleImageNavigation(e, 'next')}
              aria-label="Next image"
            >
              ❯
            </button>
            <div className="rental-card-image-counter">
              {activeImageIndex + 1}/{vehicle.images.length}
            </div>
          </div>
        )}
        
        {getVehicleInfo(vehicle, 'category') !== 'N/A' && (
          <div className={`rental-card-badge ${getCategoryClass(getVehicleInfo(vehicle, 'category'))}`}>
            {getVehicleInfo(vehicle, 'category')}
          </div>
        )}

        {/* Mobile tap hint - only shows on very small screens */}
        <div className="rental-card-tap-hint">
          👆 Tap for navigation
        </div>
      </div>
      
      <div className="rental-card-content">
        <div className="rental-card-header">
          <div className="rental-card-title-section">
            <h4 className="rental-card-title">{getVehicleInfo(vehicle, 'name', 'Rental Vehicle')}</h4>
            
            {/* Feature badges under title - HORIZONTAL layout */}
            <div className="rental-card-title-badges">
              {(() => {
                const features = getVehicleFeatures(vehicle);
                return features.slice(0, 2).map((feature, index) => (
                  <div 
                    key={index} 
                    className={`rental-card-feature-badge ${
                      feature.toLowerCase().includes('insurance') ? 'insurance' : 
                      feature.toLowerCase().includes('unlimited') ? 'unlimited-miles' : ''
                    }`}
                  >
                    {feature}
                  </div>
                ));
              })()}
            </div>
          </div>
          
          <div className="rental-card-price-container">
            <span className="rental-card-price">
              P {getVehicleRate(vehicle, 'daily', 0)}/day
            </span>
            {vehicle.rates?.security && (
              <div className="rental-card-security-badge">
                Security: P{vehicle.rates.security}
              </div>
            )}
            {vehicle.usageType && (
              <div className="rental-card-usage-badge">
                {vehicle.usageType}
              </div>
            )}
          </div>
        </div>
        
        <div className="rental-card-specs">
          <div className="rental-card-spec-item">
            <span className="rental-card-spec-label">Transmission:</span>
            <span className="rental-card-spec-value">{getVehicleInfo(vehicle, 'transmission', 'N/A')}</span>
          </div>
          <div className="rental-card-spec-item">
            <span className="rental-card-spec-label">Fuel Type:</span>
            <span className="rental-card-spec-value">{getVehicleInfo(vehicle, 'fuelType', 'N/A')}</span>
          </div>
          <div className="rental-card-spec-item">
            <span className="rental-card-spec-label">Year:</span>
            <span className="rental-card-spec-value">{getVehicleInfo(vehicle, 'year', 'N/A')}</span>
          </div>
          <div className="rental-card-spec-item">
            <span className="rental-card-spec-label">Seats:</span>
            <span className="rental-card-spec-value">{getVehicleInfo(vehicle, 'seats', 'N/A')}</span>
          </div>
        </div>
        
        {(() => {
          const features = getVehicleFeatures(vehicle);
          const remainingFeatures = features.slice(2); // Skip first 2 as they're under title
          if (remainingFeatures.length === 0) return null;
          
          return (
            <div className="rental-card-badges">
              {remainingFeatures.slice(0, 2).map((feature, index) => (
                <div 
                  key={index + 2} 
                  className={`rental-card-feature-badge ${
                    feature.toLowerCase().includes('insurance') ? 'insurance' : 
                    feature.toLowerCase().includes('unlimited') ? 'unlimited-miles' : ''
                  }`}
                >
                  {feature}
                </div>
              ))}
              {remainingFeatures.length > 2 && (
                <div className="rental-card-feature-badge">
                  +{remainingFeatures.length - 2} more
                </div>
              )}
            </div>
          );
        })()}
        
        {/* OPTIMIZED: Enhanced provider info section with larger avatars and horizontal layout */}
        <div className="rental-card-provider-info" onClick={handleProviderClick}>
          <img 
            src={vehicle.providerLogo || vehicle.provider?.logo || 
                vehicle.provider?.profile?.logo || '/images/placeholders/dealer-avatar.jpg'} 
            alt={vehicle.provider || 'Provider'} 
            className="rental-card-provider-avatar"
            loading="lazy"
            onError={(e) => {
              e.target.src = '/images/placeholders/dealer-avatar.jpg';
            }}
          />
          <div className="rental-card-provider-details">
            {/* First row: Provider name with verification */}
            <div className="rental-card-provider-meta">
              <span className="rental-card-provider-name">
                {vehicle.provider || 'Rental Provider'}
              </span>
              {vehicle.provider?.verified && (
                <div className="rental-card-verified-icon">✓</div>
              )}
            </div>
            
            {/* Second row: Provider type and location */}
            <div className="rental-card-provider-actions">
              <span className="rental-card-provider-type">
                {vehicle.provider?.type || 'Rental Company'}
              </span>
              <span className="rental-card-provider-location">
                {vehicle.providerLocation || 'Location not specified'}
              </span>
            </div>
            
            {/* Third row: Actions and contact preferences */}
            <div className="rental-card-provider-links">
              <span className="rental-card-provider-link">View Provider</span>
              {vehicle.provider?.contactPreference && (
                <span className="rental-card-contact-preference">
                  📱 {vehicle.provider.contactPreference}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="rental-card-footer">
          <span className={`rental-card-availability-tag ${getAvailabilityClass(vehicle.availability)}`}>
            {vehicle.availability || 'Available'}
          </span>
          <div className="rental-card-actions">
            <button 
              className="rental-card-share-btn"
              onClick={handleShareClick}
              aria-label="Share"
            >
              Share
            </button>
            <button 
              className="rental-card-reserve-btn"
              onClick={handleRentClick}
              aria-label="Reserve Vehicle"
            >
              Reserve
            </button>
            <button 
              className="rental-card-details-btn"
              onClick={handleCardClick}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalCard;