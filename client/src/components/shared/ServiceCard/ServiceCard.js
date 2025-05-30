import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ServiceCard.css';

const ServiceCard = ({ service, onAction, compact = false }) => {
  const [imageError, setImageError] = useState({ banner: false, logo: false });
  const navigate = useNavigate();

  useEffect(() => {
    setImageError({ banner: false, logo: false });
  }, [service?.businessName]);

  if (!service) return null;

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
    if (service.verification?.status === 'verified') {
      return (
        <div className="bcc-svc-verified-badge">
          <span className="verification-icon">✓</span> Verified
        </div>
      );
    }
    return null;
  };

  const getBusinessTypeClass = (type, serviceType) => {
    if (serviceType === 'workshop') {
      return 'bcc-business-workshop';
    } else if (serviceType === 'transport') {
      return 'bcc-business-transport';
    }
    
    switch (type?.toLowerCase()) {
      case 'authorized':
        return 'bcc-business-authorized';
      case 'independent':
        return 'bcc-business-independent';
      case 'bus':
        return 'bcc-business-bus';
      case 'taxi':
        return 'bcc-business-taxi';
      default:
        return 'bcc-business-other';
    }
  };

  const getBusinessTypeLabel = (type, serviceType) => {
    if (serviceType === 'workshop') {
      if (type?.toLowerCase() === 'authorized') {
        return 'Authorized Workshop';
      } else if (type?.toLowerCase() === 'independent') {
        return 'Independent Workshop';
      }
    } else if (serviceType === 'transport') {
      if (type?.toLowerCase() === 'bus') {
        return 'Bus Service';
      } else if (type?.toLowerCase() === 'taxi') {
        return 'Taxi Service';
      }
    }
    
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Service Provider';
  };

  const handleActionClick = (e) => {
    e.preventDefault();
    if (onAction) {
      onAction(service);
    } else if (service._id) {
      navigate(`/services/${service._id}`);
    }
  };

  const bannerUrl = getImageUrl(service.profile?.banner);
  const logoUrl = getImageUrl(service.profile?.logo, 'logo');

  return (
    <div className={`bcc-svc-card ${compact ? 'compact' : ''}`}>
      <div className="bcc-svc-card-inner">
        <div className="bcc-svc-banner">
          {(!bannerUrl || imageError.banner) ? (
            <div className="bcc-svc-banner-placeholder">
              <div className="bcc-banner-gradient"></div>
            </div>
          ) : (
            <img
              src={bannerUrl}
              alt={`${service.businessName} banner`}
              onError={() => handleImageError('banner')}
              loading="lazy"
            />
          )}
          {getVerificationBadge()}
        </div>

        <div className="bcc-svc-content">
          <div className="bcc-svc-header">
            <div className="bcc-svc-logo">
              {(!logoUrl || imageError.logo) ? (
                <div className="bcc-svc-logo-placeholder">
                  {service.businessName.charAt(0)}
                </div>
              ) : (
                <img
                  src={logoUrl}
                  alt={`${service.businessName} logo`}
                  onError={() => handleImageError('logo')}
                  loading="lazy"
                />
              )}
            </div>

            <div className="bcc-svc-info">
              <h3 title={service.businessName}>{service.businessName}</h3>
              
              <div className="bcc-svc-details">
                <span className={`bcc-svc-badge ${getBusinessTypeClass(service.businessType, service.serviceType)}`}>
                  {getBusinessTypeLabel(service.businessType, service.serviceType)}
                </span>
              </div>
              
              {service.location && (
                <div className="bcc-svc-location">
                  <span className="bcc-location-icon">📍</span>
                  <span>
                    {service.location?.city || 'Unknown'}
                    {service.location?.country ? `, ${service.location.country}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {!compact && service.profile?.description && (
            <div className="bcc-svc-description">
              {service.profile.description.length > 150
                ? `${service.profile.description.substring(0, 150)}...`
                : service.profile.description}
            </div>
          )}

          {!compact && service.profile?.specialties && service.profile.specialties.length > 0 && (
            <div className="bcc-svc-specialties">
              <span className="bcc-specialties-label">Specialties</span>
              <div className="bcc-specialty-tags">
                {service.profile.specialties.slice(0, 3).map((specialty, index) => (
                  <span key={index} className="bcc-specialty-tag">
                    {specialty}
                  </span>
                ))}
                {service.profile.specialties.length > 3 && (
                  <span className="bcc-more-specialties">
                    +{service.profile.specialties.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bcc-svc-footer">
          <div className="bcc-svc-metrics">
            {service.metrics?.totalReviews > 0 && (
              <div className="bcc-svc-metric">
                <span className="bcc-svc-metric-value">
                  <span className="bcc-svc-stars">
                    {"★".repeat(Math.floor(service.metrics.averageRating || 0))}
                    {service.metrics.averageRating % 1 >= 0.5 ? "½" : ""}
                  </span>
                  <span className="bcc-svc-rating-value">
                    {service.metrics.averageRating?.toFixed(1) || '0.0'}
                  </span>
                </span>
                <span className="bcc-svc-metric-label">
                  {service.metrics.totalReviews} reviews
                </span>
              </div>
            )}
          </div>

          <div className="bcc-svc-actions">
            <button className="bcc-svc-cta" onClick={handleActionClick}>
              View Details
            </button>
          </div>
        </div>
      </div>
      
      <div className="bcc-card-hover-effect"></div>
    </div>
  );
};

export default ServiceCard;