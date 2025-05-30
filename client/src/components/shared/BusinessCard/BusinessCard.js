// src/components/shared/BusinessCard/BusinessCard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BusinessGallery from './BusinessGallery.js';
import './BusinessCard.css';

const BusinessCard = ({ business, onAction, compact = false }) => {
  const [itemCount, setItemCount] = useState(business?.metrics?.totalListings || 0);
  const [imageError, setImageError] = useState({ banner: false, logo: false });
  const navigate = useNavigate();
  
  // UPDATED: Better business type detection
  const getBusinessType = () => {
    if (!business) return 'unknown';
    
    // Check provider type first (for service providers)
    if (business.providerType) {
      if (business.providerType === 'car_rental') return 'car_rental';
      if (business.providerType === 'trailer_rental') return 'trailer_rental';
      if (business.providerType === 'public_transport') return 'public_transport';
      if (business.providerType === 'workshop') return 'workshop';
    }
    
    // Check business type for dealerships
    if (business.businessType) {
      const type = business.businessType.toLowerCase();
      if (['independent', 'franchise', 'certified'].includes(type)) {
        return 'dealer';
      }
    }
    
    return 'service'; // Default fallback
  };

  const businessType = getBusinessType();
  
  useEffect(() => {
    setImageError({ banner: false, logo: false });
  }, [business?.businessName]);

  if (!business) return null;

  const handleItemCountUpdate = (count) => {
    setItemCount(count);
  };

  const handleImageError = (type) => {
    setImageError(prev => ({ ...prev, [type]: true }));
  };

  const getVerificationBadge = () => {
    if (business.verification?.status === 'verified') {
      return (
        <div className="bcc-business-verified-badge">
          <span className="verification-icon">✓</span> Verified
        </div>
      );
    }
    return null;
  };

  const getBusinessTypeClass = (type, providerType) => {
    // First check for dealership types
    if (['independent', 'franchise', 'certified'].includes(type?.toLowerCase())) {
      return `bcc-business-${type.toLowerCase()}`;
    }
    
    // Then check service types
    if (providerType === 'workshop') {
      return 'bcc-business-workshop';
    } else if (providerType === 'car_rental') {
      return 'bcc-business-car-rental';
    } else if (providerType === 'trailer_rental') {
      return 'bcc-business-trailer-rental';
    } else if (providerType === 'public_transport') {
      return 'bcc-business-transport';
    } else if (type?.toLowerCase() === 'authorized') {
      return 'bcc-business-authorized';
    }
    
    return 'bcc-business-other';
  };

  const getBusinessTypeLabel = (type, providerType) => {
    // Check for dealership types
    if (type?.toLowerCase() === 'independent' && !providerType) {
      return 'Independent Dealer';
    } else if (type?.toLowerCase() === 'franchise' && !providerType) {
      return 'Franchise Dealer';
    } else if (type?.toLowerCase() === 'certified' && !providerType) {
      return 'Certified Dealer';
    }
    
    // Check for service types
    if (providerType === 'workshop') {
      if (type?.toLowerCase() === 'authorized') {
        return 'Authorized Workshop';
      } else if (type?.toLowerCase() === 'independent') {
        return 'Independent Workshop';
      }
      return 'Workshop';
    } else if (providerType === 'car_rental') {
      return 'Car Rental';
    } else if (providerType === 'trailer_rental') {
      return 'Trailer Rental';
    } else if (providerType === 'public_transport') {
      return 'Transport Service';
    }
    
    // Default case
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Service Provider';
  };

  // UPDATED: Improved action click handler with correct navigation paths
  const handleActionClick = (e) => {
    e.preventDefault();
    
    // If onAction prop is provided, use that (for custom handling)
    if (onAction) {
      onAction(business);
      return;
    }
    
    // Make sure we have a business ID
    if (!business._id) {
      console.error('Cannot navigate: Business ID is missing');
      return;
    }
    
    // Determine the correct path based on business type
    let path;
    
    if (businessType === 'dealer') {
      path = `/dealerships/${business._id}`;
    } else if (businessType === 'car_rental') {
      path = `/services/${business._id}?type=car_rental`;
    } else if (businessType === 'trailer_rental') {
      path = `/services/${business._id}?type=trailer_rental`;
    } else if (businessType === 'public_transport') {
      path = `/services/${business._id}?type=public_transport`;
    } else if (businessType === 'workshop') {
      path = `/services/${business._id}?type=workshop`;
    } else {
      // Default to services path for other provider types
      path = `/services/${business._id}`;
    }
    
    console.log(`Navigating to: ${path}`);
    navigate(path);
  };

  // Function to get the correct image URL for banner and logo
  const getImageUrl = (imagePath, type) => {
    if (!imagePath) return null;
    
    // If it already has http/https, it's a complete URL
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's already a path with /uploads
    if (imagePath.includes('/uploads/')) {
      return imagePath;
    }
    
    // Extract just the filename if it has path elements
    const filename = imagePath.split('/').pop();
    
    // Check if this is a dealer or a provider
    if (businessType === 'dealer') {
      return `/uploads/dealers/${filename}`;
    } else {
      return `/uploads/providers/${filename}`;
    }
  };

  return (
    <div className={`bcc-business-card ${compact ? 'compact' : ''}`} onClick={handleActionClick}>
      <div className="bcc-business-card-inner">
        <div className="bcc-business-banner">
          {(!business.profile?.banner || imageError.banner) ? (
            <div className="bcc-business-banner-placeholder">
              <div className="bcc-banner-gradient"></div>
            </div>
          ) : (
            <img
              src={getImageUrl(business.profile.banner, 'banner')}
              alt={`${business.businessName} banner`}
              onError={(e) => {
                console.log('Banner image failed to load:', e.target.src);
                handleImageError('banner');
              }}
              loading="lazy"
            />
          )}
          {getVerificationBadge()}
        </div>

        <div className="bcc-business-content">
          <div className="bcc-business-header">
            <div className="bcc-business-logo">
              {(!business.profile?.logo || imageError.logo) ? (
                <div className="bcc-business-logo-placeholder">
                  {business.businessName.charAt(0)}
                </div>
              ) : (
                <img
                  src={getImageUrl(business.profile.logo, 'logo')}
                  alt={`${business.businessName} logo`}
                  onError={(e) => {
                    console.log('Logo image failed to load:', e.target.src);
                    handleImageError('logo');
                  }}
                  loading="lazy"
                />
              )}
            </div>

            <div className="bcc-business-info">
              <h3 title={business.businessName}>{business.businessName}</h3>
              
              <div className="bcc-business-details">
                <span className={`bcc-business-badge ${getBusinessTypeClass(business.businessType, business.providerType)}`}>
                  {getBusinessTypeLabel(business.businessType, business.providerType)}
                </span>
              </div>
              
              {business.location && (
                <div className="bcc-business-location">
                  <span className="bcc-location-icon">📍</span>
                  <span>
                    {business.location?.city || 'Unknown'}
                    {business.location?.country ? `, ${business.location.country}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {!compact && business.profile?.description && (
            <div className="bcc-business-description">
              {business.profile.description.length > 150
                ? `${business.profile.description.substring(0, 150)}...`
                : business.profile.description}
            </div>
          )}

          {!compact && business.profile?.specialties && business.profile.specialties.length > 0 && (
            <div className="bcc-business-specialties">
              <span className="bcc-specialties-label">Specialties</span>
              <div className="bcc-specialty-tags">
                {business.profile.specialties.slice(0, 3).map((specialty, index) => (
                  <span key={index} className="bcc-specialty-tag">
                    {specialty}
                  </span>
                ))}
                {business.profile.specialties.length > 3 && (
                  <span className="bcc-more-specialties">
                    +{business.profile.specialties.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* UPDATED: Pass correct businessType to BusinessGallery */}
          {!compact && (
            <BusinessGallery 
              businessId={business._id} 
              businessType={businessType}
              onCountUpdate={handleItemCountUpdate}
            />
          )}
        </div>

        <div className="bcc-business-footer">
          <div className="bcc-business-metrics">
            {/* UPDATED: Show correct label based on business type */}
            <div className="bcc-business-metric">
              <span className="bcc-business-metric-value">{itemCount}</span>
              <span className="bcc-business-metric-label">
                {businessType === 'dealer' ? "Listings" : 
                businessType === 'car_rental' ? "Rentals" : 
                businessType === 'trailer_rental' ? "Trailers" : 
                businessType === 'public_transport' ? "Routes" : 
                "Items"}
              </span>
            </div>
            
            {business.metrics?.totalReviews > 0 && (
              <div className="bcc-business-metric">
                <span className="bcc-business-metric-value">
                  <span className="bcc-business-stars">
                    {"★".repeat(Math.floor(business.metrics.averageRating || 0))}
                    {business.metrics.averageRating % 1 >= 0.5 ? "½" : ""}
                  </span>
                  <span className="bcc-business-rating-value">
                    {business.metrics.averageRating?.toFixed(1) || '0.0'}
                  </span>
                </span>
                <span className="bcc-business-metric-label">
                  {business.metrics.totalReviews} reviews
                </span>
              </div>
            )}
          </div>

          <div className="bcc-business-actions">
            <button className="bcc-business-cta" onClick={handleActionClick}>
              {businessType === 'dealer' ? 'View Dealership' : 
                businessType === 'car_rental' ? 'View Car Rentals' : 
                businessType === 'trailer_rental' ? 'View Trailer Rentals' : 
                businessType === 'public_transport' ? 'View Transport' : 'View Details'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="bcc-card-hover-effect"></div>
    </div>
  );
};

export default BusinessCard;