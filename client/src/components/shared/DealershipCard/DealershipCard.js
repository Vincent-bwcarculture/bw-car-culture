import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DealershipVehicleGallery from '../../features/Dealerships/DealershipVehicleGallery.js';
import './DealershipCard.css';

const DealershipCard = ({ dealer, onAction, compact = false }) => {
  const [vehicleCount, setVehicleCount] = useState(dealer?.metrics?.totalListings || 0);
  const [imageError, setImageError] = useState({ banner: false, logo: false });
  const navigate = useNavigate();

  useEffect(() => {
    setImageError({ banner: false, logo: false });
  }, [dealer?.businessName]);

  if (!dealer) return null;

  const handleVehicleCountUpdate = (count) => {
    setVehicleCount(count);
  };

  const handleImageError = (type) => {
    setImageError(prev => ({ ...prev, [type]: true }));
  };

  // Helper to get image URL - updated for S3
  const getImageUrl = (imagePath, type = 'banner') => {
    if (!imagePath) return null;
    
    // If it's already a full URL (S3), return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Legacy local path
    return imagePath;
  };

  const getVerificationBadge = () => {
    if (dealer.verification?.status === 'verified') {
      return (
        <div className="bcc-dealership-verified-badge">
          <span className="verification-icon">✓</span> Verified
        </div>
      );
    }
    return null;
  };

  const getBusinessTypeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'independent':
        return 'bcc-business-independent';
      case 'franchise':
        return 'bcc-business-franchise';
      case 'certified':
        return 'bcc-business-certified';
      default:
        return 'bcc-business-other';
    }
  };

  const getBusinessTypeLabel = (type) => {
    switch (type?.toLowerCase()) {
      case 'independent':
        return 'Independent Dealer';
      case 'franchise':
        return 'Franchise Dealer';
      case 'certified':
        return 'Certified Dealer';
      default:
        return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Dealer';
    }
  };

  const handleActionClick = (e) => {
    e.preventDefault();
    if (onAction) {
      onAction(dealer);
    } else if (dealer._id) {
      navigate(`/dealerships/${dealer._id}`);
    }
  };

  const bannerUrl = getImageUrl(dealer.profile?.banner);
  const logoUrl = getImageUrl(dealer.profile?.logo, 'logo');

  return (
    <div className={`bcc-dealership-card ${compact ? 'compact' : ''}`}>
      <div className="bcc-dealership-card-inner">
        <div className="bcc-dealership-banner">
          {(!bannerUrl || imageError.banner) ? (
            <div className="bcc-dealership-banner-placeholder">
              <div className="bcc-banner-gradient"></div>
            </div>
          ) : (
            <img
              src={bannerUrl}
              alt={`${dealer.businessName} banner`}
              onError={() => handleImageError('banner')}
              loading="lazy"
            />
          )}
          {getVerificationBadge()}
        </div>

        <div className="bcc-dealership-content">
          <div className="bcc-dealership-header">
            <div className="bcc-dealership-logo">
              {(!logoUrl || imageError.logo) ? (
                <div className="bcc-dealership-logo-placeholder">
                  {dealer.businessName.charAt(0)}
                </div>
              ) : (
                <img
                  src={logoUrl}
                  alt={`${dealer.businessName} logo`}
                  onError={() => handleImageError('logo')}
                  loading="lazy"
                />
              )}
            </div>

            <div className="bcc-dealership-info">
              <h3 title={dealer.businessName}>{dealer.businessName}</h3>
              
              <div className="bcc-dealership-details">
                {dealer.businessType && (
                  <span className={`bcc-dealership-badge ${getBusinessTypeClass(dealer.businessType)}`}>
                    {getBusinessTypeLabel(dealer.businessType)}
                  </span>
                )}
              </div>
              
              {dealer.location && (
                <div className="bcc-dealership-location">
                  <span className="bcc-location-icon" aria-hidden="true">📍</span>
                  <span>
                    {dealer.location?.city || 'Unknown'}
                    {dealer.location?.country ? `, ${dealer.location.country}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {dealer.profile?.description && !compact && (
            <div className="bcc-dealership-description">
              {dealer.profile.description.length > 120
                ? `${dealer.profile.description.substring(0, 120)}...`
                : dealer.profile.description}
            </div>
          )}

          {dealer.profile?.specialties && dealer.profile.specialties.length > 0 && !compact && (
            <div className="bcc-dealership-specialties">
              <span className="bcc-specialties-label">Specialties</span>
              <div className="bcc-specialty-tags">
                {dealer.profile.specialties.slice(0, 3).map((specialty, index) => (
                  <span key={index} className="bcc-specialty-tag">
                    {specialty}
                  </span>
                ))}
                {dealer.profile.specialties.length > 3 && (
                  <span className="bcc-more-specialties">
                    +{dealer.profile.specialties.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {!compact && (
            <DealershipVehicleGallery 
              dealerId={dealer._id} 
              onCountUpdate={handleVehicleCountUpdate}
            />
          )}
        </div>

        <div className="bcc-dealership-footer">
          <div className="bcc-dealership-metrics">
            <div className="bcc-dealership-metric">
              <span className="bcc-dealership-metric-value">{vehicleCount}</span>
              <span className="bcc-dealership-metric-label">Listings</span>
            </div>
            
            {dealer.metrics?.totalReviews > 0 && (
              <div className="bcc-dealership-metric">
                <span className="bcc-dealership-metric-value">
                  <span className="bcc-dealership-stars" aria-hidden="true">
                    {"★".repeat(Math.floor(dealer.metrics.averageRating || 0))}
                    {dealer.metrics.averageRating % 1 >= 0.5 ? "½" : ""}
                  </span>
                  <span className="bcc-dealership-rating-value">
                    {dealer.metrics.averageRating?.toFixed(1) || '0.0'}
                  </span>
                </span>
                <span className="bcc-dealership-metric-label">
                  {dealer.metrics.totalReviews} reviews
                </span>
              </div>
            )}
          </div>

          <div className="bcc-dealership-actions">
            <button className="bcc-dealership-cta" onClick={handleActionClick}>
              View Dealership
            </button>
          </div>
        </div>
      </div>
      
      <div className="bcc-card-hover-effect"></div>
    </div>
  );
};

export default DealershipCard;