// src/components/features/CarDetailsGallery/CarDetailsGallery.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './CarDetailsGallery.css';

const CarDetailsGallery = ({ car, onSave, onShare, showDealerLink = true }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const navigate = useNavigate();
  
  const handleThumbnailClick = (index) => {
    setSelectedImage(index);
  };

  const navigateToDealerProfile = () => {
    if (car?.dealer?._id) {
      navigate(`/dealerships/${car.dealer._id}`);
    }
  };
  
  const formatPrice = (price) => {
    if (!price && !car.priceOptions?.showPriceAsPOA) return 'Price not available';
    if (car.priceOptions?.showPriceAsPOA) return 'POA';
    return `P${parseInt(price).toLocaleString()}`;
  };
  
  // Extract image URLs - UPDATED FOR S3
  const getImageUrls = () => {
    if (!car) return ['/images/placeholders/car.jpg'];
    
    if (!car.images || car.images.length === 0) {
      return ['/images/placeholders/car.jpg'];
    }
    
    return car.images.map(img => {
      if (typeof img === 'string') {
        return img;
      }
      if (img && typeof img === 'object' && img.url) {
        return img.url;
      }
      return '/images/placeholders/car.jpg';
    });
  };
  
  const imageUrls = getImageUrls();

  if (!car) {
    return <div className="loading-state">Loading vehicle details...</div>;
  }

  return (
    <div className="car-details-gallery">
      <div className="gallery-main">
        <img 
          src={imageUrls[selectedImage]} 
          alt={car.title || 'Vehicle'} 
          className="main-image"
          onError={(e) => {
            // For S3 URLs, go directly to placeholder
            if (e.target.src.includes('amazonaws.com') || e.target.src.includes('https://')) {
              e.target.src = '/images/placeholders/car.jpg';
            } else {
              e.target.src = '/images/placeholders/car.jpg';
            }
          }}
        />
        
        {imageUrls.length > 1 && (
          <>
            <button 
              className="gallery-nav prev" 
              onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : imageUrls.length - 1)}
              aria-label="Previous image"
            >
              ❮
            </button>
            <button 
              className="gallery-nav next" 
              onClick={() => setSelectedImage(prev => prev < imageUrls.length - 1 ? prev + 1 : 0)}
              aria-label="Next image"
            >
              ❯
            </button>
            <div className="image-counter">
              {selectedImage + 1} / {imageUrls.length}
            </div>
          </>
        )}
        
        <div className="gallery-actions">
          {onSave && (
            <button 
              className="action-button save-button"
              onClick={onSave}
              aria-label="Save to favorites"
            >
              ♡
            </button>
          )}
          {onShare && (
            <button 
              className="action-button share-button"
              onClick={onShare}
              aria-label="Share listing"
            >
              ↗
            </button>
          )}
        </div>
      </div>

      {imageUrls.length > 1 && (
        <div className="gallery-thumbnails">
          {imageUrls.map((image, index) => (
            <div
              key={index}
              className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
              onClick={() => handleThumbnailClick(index)}
            >
              <img 
                src={image} 
                alt={`${car.title || 'Vehicle'} view ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                onError={(e) => {
                  if (e.target.src.includes('amazonaws.com') || e.target.src.includes('https://')) {
                    e.target.src = '/images/placeholders/car.jpg';
                  } else {
                    e.target.src = '/images/placeholders/car.jpg';
                  }
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="car-details">
        <div className="car-header">
          <h1 className="car-title">{car.title || 'Untitled Vehicle'}</h1>
          <div className="price-container">
            <div className="car-price">{formatPrice(car.price)}</div>
            {car.priceOptions?.financeAvailable && (
              <div className="finance-badge">Finance Available</div>
            )}
            {car.priceOptions?.leaseAvailable && (
              <div className="finance-badge lease-badge">Lease Available</div>
            )}
          </div>
        </div>

        <div className="car-status-badges">
          {car.condition && (
            <span className={`condition-tag ${car.condition.toLowerCase()}`}>
              {car.condition === 'new' ? 'New' : 
               car.condition === 'used' ? 'Used' : 
               car.condition === 'certified' ? 'Certified Pre-Owned' : 
               car.condition}
            </span>
          )}
          {car.featured && (
            <span className="featured-tag">Featured</span>
          )}
          {car.priceOptions?.includesVAT && (
            <span className="vat-tag">Price Includes VAT</span>
          )}
          {car.bodyStyle && (
            <span className="body-style-tag">{car.bodyStyle}</span>
          )}
        </div>

        <div className="specs-grid">
          <div className="spec-item">
            <span className="spec-label">Year</span>
            <span className="spec-value">{car.specifications?.year || 'N/A'}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Make</span>
            <span className="spec-value">{car.specifications?.make || 'N/A'}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Model</span>
            <span className="spec-value">{car.specifications?.model || 'N/A'}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Mileage</span>
            <span className="spec-value">
              {car.specifications?.mileage 
                ? `${car.specifications.mileage.toLocaleString()} km` 
                : 'N/A'}
            </span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Engine</span>
            <span className="spec-value">{car.specifications?.engineSize || 'N/A'}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Transmission</span>
            <span className="spec-value">{car.specifications?.transmission || 'N/A'}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Fuel Type</span>
            <span className="spec-value">{car.specifications?.fuelType || 'N/A'}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Drivetrain</span>
            <span className="spec-value">{car.specifications?.drivetrain || 'N/A'}</span>
          </div>
          {car.specifications?.power && (
            <div className="spec-item">
              <span className="spec-label">Power</span>
              <span className="spec-value">{car.specifications.power}</span>
            </div>
          )}
          {car.specifications?.torque && (
            <div className="spec-item">
              <span className="spec-label">Torque</span>
              <span className="spec-value">{car.specifications.torque}</span>
            </div>
          )}
          {car.specifications?.exteriorColor && (
            <div className="spec-item">
              <span className="spec-label">Exterior Color</span>
              <span className="spec-value">{car.specifications.exteriorColor}</span>
            </div>
          )}
          {car.specifications?.interiorColor && (
            <div className="spec-item">
              <span className="spec-label">Interior Color</span>
              <span className="spec-value">{car.specifications.interiorColor}</span>
            </div>
          )}
          {car.specifications?.vin && (
            <div className="spec-item">
              <span className="spec-label">VIN</span>
              <span className="spec-value">{car.specifications.vin}</span>
            </div>
          )}
        </div>

        {/* Dealer Information */}
        {car.dealer && (
          <div className="dealer-info">
            <img 
              src={car.dealer.profile?.logo || car.dealer.logo || '/images/placeholders/dealer-avatar.jpg'} 
              alt={car.dealer.businessName || car.dealer.name || 'Dealer'}
              className="dealer-avatar"
              onError={(e) => {
                e.target.src = '/images/placeholders/dealer-avatar.jpg';
              }}
            />
            <div className="dealer-details">
              <div className="dealer-name">
                {showDealerLink ? (
                  <Link to={`/dealerships/${car.dealer._id}`} className="dealer-link">
                    {car.dealer.businessName || car.dealer.name || 'Unknown Dealer'}
                  </Link>
                ) : (
                  car.dealer.businessName || car.dealer.name || 'Unknown Dealer'
                )}
                {car.dealer.verification?.isVerified && (
                  <span className="verified-dealer-badge">✓ Verified</span>
                )}
              </div>
              
              <div className="dealer-metadata">
                {car.dealer.location && (
                  <div className="dealer-location">
                    <span className="location-icon">📍</span>
                    {car.dealer.location.city}
                    {car.dealer.location.country && `, ${car.dealer.location.country}`}
                  </div>
                )}
                {car.dealer.contact?.phone && (
                  <div className="dealer-phone">
                    <span className="phone-icon">📞</span>
                    <a href={`tel:${car.dealer.contact.phone}`}>
                      {car.dealer.contact.phone}
                    </a>
                  </div>
                )}
                {car.dealer.contact?.email && (
                  <div className="dealer-email">
                    <span className="email-icon">✉️</span>
                    <a href={`mailto:${car.dealer.contact.email}`}>
                      {car.dealer.contact.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {showDealerLink && (
              <button 
                className="view-dealer-profile"
                onClick={navigateToDealerProfile}
              >
                View Dealer Profile
              </button>
            )}
          </div>
        )}

        {/* Features Section */}
        {(() => {
          const allFeatures = [
            ...(car.features || []),
            ...(car.safetyFeatures || []),
            ...(car.comfortFeatures || []),
            ...(car.performanceFeatures || []),
            ...(car.entertainmentFeatures || [])
          ];
          
          if (allFeatures.length > 0) {
            return (
              <div className="features-section">
                <h2>Features & Equipment</h2>
                <div className="features-grid">
                  {allFeatures.map((feature, index) => (
                    <div key={index} className="feature-item">
                      ✓ {feature}
                    </div>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Description Section */}
        {car.description && (
          <div className="description-section">
            <h2>Description</h2>
            <div className="description-content">
              {car.description}
            </div>
          </div>
        )}

        {/* Location Section */}
        {car.location && Object.values(car.location).some(value => value) && (
          <div className="location-section">
            <h2>Location</h2>
            <div className="location-details">
              {car.location.address && (
                <div className="location-address">
                  <span className="location-label">Address:</span>
                  <span className="location-value">{car.location.address}</span>
                </div>
              )}
              <div className="location-city-state">
                {car.location.city && (
                  <span className="location-city">{car.location.city}</span>
                )}
                {car.location.state && (
                  <span className="location-state">{car.location.state}</span>
                )}
                {car.location.postalCode && (
                  <span className="location-postal">{car.location.postalCode}</span>
                )}
                {car.location.country && (
                  <span className="location-country">{car.location.country}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="actions">
          {car.dealer?.contact?.phone && (
            <a 
              href={`tel:${car.dealer.contact.phone}`}
              className="action-button primary contact-button"
            >
              Call Dealer
            </a>
          )}
          {car.dealer?.contact?.email && (
            <a 
              href={`mailto:${car.dealer.contact.email}?subject=Inquiry about ${car.title}&body=I am interested in the ${car.title} listed on your website.`}
              className="action-button secondary email-button"
            >
              Email Dealer
            </a>
          )}
          {car.dealer?.contact?.phone && (
            <a 
              href={`https://wa.me/${car.dealer.contact.phone.replace(/[^0-9]/g, '')}?text=I am interested in the ${car.title} listed on your website.`}
              target="_blank"
              rel="noopener noreferrer"
              className="action-button secondary whatsapp-button"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarDetailsGallery;