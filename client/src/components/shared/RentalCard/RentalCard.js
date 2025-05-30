// src/components/Rentals/RentalCard/RentalCard.js
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
        try {
          const vehicleId = safeGetStringId(vehicle.id || vehicle._id);
          analytics.trackEvent('rental_view', {
            category: 'content',
            elementId: vehicleId,
            metadata: {
              rentalId: vehicleId,
              name: getVehicleInfo(vehicle, 'name'),
              category: getVehicleInfo(vehicle, 'category'),
              dailyRate: getVehicleRate(vehicle, 'daily', 0),
              provider: vehicle.provider,
              providerId: vehicle.providerId,
              usageType: vehicle.usageType,
              source: 'rental_card',
              compact: compact
            }
          });
          setHasBeenViewed(true);
        } catch (error) {
          console.warn('Analytics tracking failed:', error);
        }
      }, 1000); // Track after 1 second of visibility

      return () => clearTimeout(timer);
    }
  }, [vehicle, hasBeenViewed, analytics, compact]);
  
  useEffect(() => {
    setImageLoadError(false);
  }, [vehicle, activeImageIndex]);

  if (!vehicle) return null;

  const handleCardClick = () => {
    const vehicleId = safeGetStringId(vehicle.id || vehicle._id);
    
    if (!vehicleId) {
      console.error("Cannot navigate: Missing valid vehicle ID", vehicle);
      return;
    }

    // Track card click
    try {
      analytics.trackClick('rental_card', 'card', {
        rentalId: vehicleId,
        name: getVehicleInfo(vehicle, 'name'),
        provider: vehicle.provider,
        action: 'view_details'
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
    
    navigate(`/rentals/${vehicleId}`);
  };

  const handleImageNavigation = (e, direction) => {
    e.stopPropagation();
    
    if (!vehicle || !vehicle.images || !Array.isArray(vehicle.images) || vehicle.images.length <= 1) return;
    
    // Track image navigation
    try {
      const vehicleId = safeGetStringId(vehicle.id || vehicle._id);
      analytics.trackClick('rental_image_navigation', 'button', {
        rentalId: vehicleId,
        direction: direction,
        currentIndex: activeImageIndex,
        totalImages: vehicle.images.length
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
    
    setActiveImageIndex(prev => {
      if (direction === 'next') {
        return (prev + 1) % vehicle.images.length;
      } else {
        return (prev - 1 + vehicle.images.length) % vehicle.images.length;
      }
    });
  };

  const handleShareClick = (e) => {
    e.stopPropagation();

    // Track share action
    try {
      const vehicleId = safeGetStringId(vehicle.id || vehicle._id);
      analytics.trackEvent('rental_share', {
        category: 'engagement',
        elementId: vehicleId,
        metadata: {
          rentalId: vehicleId,
          name: getVehicleInfo(vehicle, 'name'),
          provider: vehicle.provider,
          shareMethod: 'button'
        }
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }

    if (onShare) {
      onShare(vehicle, e.currentTarget);
    } else {
      try {
        if (navigator.share) {
          const vehicleId = safeGetStringId(vehicle.id || vehicle._id);
          const shareData = {
            title: getVehicleInfo(vehicle, 'name', 'Car Rental'),
            text: `Check out this ${getVehicleInfo(vehicle, 'name', '')} rental from ${vehicle.provider}`,
            url: `${window.location.origin}/rentals/${vehicleId}`
          };
          navigator.share(shareData)
            .catch(err => console.warn('Error sharing:', err));
        } else {
          const vehicleId = safeGetStringId(vehicle.id || vehicle._id);
          const url = `${window.location.origin}/rentals/${vehicleId}`;
          navigator.clipboard.writeText(url)
            .then(() => alert('Link copied to clipboard!'))
            .catch(err => console.error('Could not copy link:', err));
        }
      } catch (err) {
        console.error('Share functionality error:', err);
      }
    }
  };
  
  const handleReserveClick = (e) => {
    e.stopPropagation();

    // Track rental reservation intent
    try {
      const vehicleId = safeGetStringId(vehicle.id || vehicle._id);
      analytics.trackEvent('rental_reservation', {
        category: 'conversion',
        elementId: vehicleId,
        metadata: {
          rentalId: vehicleId,
          name: getVehicleInfo(vehicle, 'name'),
          dailyRate: getVehicleRate(vehicle, 'daily', 0),
          provider: vehicle.provider,
          contactMethod: 'whatsapp'
        }
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
    
    if (onRent) {
      onRent(vehicle);
      return;
    }
    
    const name = getVehicleInfo(vehicle, 'name', 'Vehicle');
    const category = getVehicleInfo(vehicle, 'category', '');
    const provider = vehicle.provider || 'Rental Provider';
    
    const vehicleDetails = [
      `*${name}*`,
      `Category: ${category}`,
      `Daily Rate: P${getVehicleRate(vehicle, 'daily', 0)}`,
      vehicle.rates?.security ? `Security Deposit: P${vehicle.rates.security}` : '',
      vehicle.usageType ? `Usage Type: ${vehicle.usageType}` : '',
      vehicle.features ? `Features: ${getVehicleFeatures(vehicle).slice(0, 3).join(", ")}${getVehicleFeatures(vehicle).length > 3 ? '...' : ''}` : '',
    ].filter(Boolean).join('\n');

    let vehicleLink = '';
    try {
      const vehicleId = safeGetStringId(vehicle.id || vehicle._id);
      if (vehicleId) {
        const baseUrl = window.location.origin;
        vehicleLink = `\n\nVehicle Link: ${baseUrl}/rentals/${vehicleId}`;
      }
    } catch (err) {
      console.warn('Could not generate vehicle link:', err);
    }
    
    const message = `*VEHICLE RENTAL REQUEST*\n\nHello, I would like to rent this vehicle:\n\n${vehicleDetails}${vehicleLink}\n\nPlease confirm availability and rental process.`;
    
    const phone = vehicle.providerContact?.phone;
    
    if (phone) {
      const formattedPhone = phone.startsWith('+') ? phone.replace(/\s+/g, '') : `+267${phone.replace(/\s+/g, '')}`;
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
    } else {
      alert('Provider contact information is not available. Please view details to contact the provider.');
    }
  };

  const handleProviderClick = (e) => {
    e.stopPropagation();

    // Track provider click
    try {
      analytics.trackClick('rental_provider', 'link', {
        providerId: vehicle.providerId,
        providerName: vehicle.provider,
        rentalId: safeGetStringId(vehicle.id || vehicle._id),
        action: 'view_provider'
      });
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
    
    const providerId = vehicle.providerId || (vehicle.provider?.id) || (vehicle.provider?._id);
    
    if (providerId) {
      const providerIdString = safeGetStringId(providerId);
      if (providerIdString) {
        const providerType = getVehicleInfo(vehicle, 'trailerType') !== 'N/A' ? 'trailer-rentals' : 'car-rentals';
        navigate(`/services/${providerIdString}?type=${providerType}`);
      } else {
        console.warn('Failed to extract valid provider ID for navigation');
      }
    } else {
      const providerName = vehicle.provider?.businessName || vehicle.provider || 'provider';
      navigate(`/services?search=${encodeURIComponent(providerName)}`);
    }
  };

  return (
    <div className={`rental-card ${compact ? 'compact' : ''}`} onClick={handleCardClick}>
      <div className="rental-card-image-container">
        <img 
          src={getImageUrl()} 
          alt={getVehicleInfo(vehicle, 'name', 'Rental Vehicle')} 
          className="rental-card-image"
          loading="lazy"
          onError={(e) => {
            console.log(`Rental image failed to load: ${e.target.src}`);
            
            // Track image load errors
            try {
              const vehicleId = safeGetStringId(vehicle.id || vehicle._id);
              analytics.trackEvent('rental_image_error', {
                category: 'system',
                metadata: {
                  rentalId: vehicleId,
                  imageSrc: e.target.src,
                  imageIndex: activeImageIndex
                }
              });
            } catch (error) {
              console.warn('Analytics tracking failed:', error);
            }
            
            // For S3 URLs, try to use the proxy endpoint
            if (e.target.src.includes('amazonaws.com')) {
              // Extract key from S3 URL
              const key = e.target.src.split('.amazonaws.com/').pop();
              if (key) {
                // Normalize the key to prevent duplicate segments
                const normalizedKey = key.replace(/images\/images\//g, 'images/');
                e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
                return;
              }
            }
            
            // For local paths, try direct rental path if not already a placeholder
            if (!e.target.src.includes('/images/placeholders/')) {
              const filename = e.target.src.split('/').pop();
              if (filename && !e.target.src.includes('/uploads/rentals/')) {
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
      </div>
      
      <div className="rental-card-content">
        <div className="rental-card-header">
          <h4 className="rental-card-title">{getVehicleInfo(vehicle, 'name', 'Rental Vehicle')}</h4>
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
          if (features.length === 0) return null;
          
          return (
            <div className="rental-card-badges">
              {features.slice(0, 3).map((feature, index) => (
                <div 
                  key={index} 
                  className={`rental-card-feature-badge ${
                    feature.toLowerCase().includes('insurance') ? 'insurance' : 
                    feature.toLowerCase().includes('unlimited') ? 'unlimited-miles' : ''
                  }`}
                >
                  {feature}
                </div>
              ))}
              {features.length > 3 && (
                <div className="rental-card-feature-badge">
                  +{features.length - 3} more
                </div>
              )}
            </div>
          );
        })()}
        
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
            <span className="rental-card-provider-name">
              {vehicle.provider || 'Rental Provider'}
            </span>
            <span className="rental-card-provider-location">
              {vehicle.providerLocation || 'Location not specified'}
            </span>
            <span className="rental-card-provider-link">View Provider</span>
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
              onClick={handleReserveClick}
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