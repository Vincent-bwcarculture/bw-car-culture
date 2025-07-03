// src/components/features/CarDetailsGallery/CarDetailsGallery.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import SimilarVehiclesList from './SimilarVehiclesList';
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

  // Calculate savings for display
  const calculateSavings = () => {
    if (!car.priceOptions?.showSavings || !car.priceOptions?.originalPrice) return null;
    
    const originalPrice = car.priceOptions.originalPrice;
    const currentPrice = car.price;
    const savingsAmount = originalPrice - currentPrice;
    
    if (savingsAmount > 0) {
      return {
        originalPrice,
        currentPrice,
        amount: savingsAmount
      };
    }
    return null;
  };

  const savings = calculateSavings();
  
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
    return <div className="cdg-loading-state">Loading vehicle details...</div>;
  }

  return (
    <div className="cdg-container">
      <div className="cdg-gallery-main">
        <img 
          src={imageUrls[selectedImage]} 
          alt={car.title || 'Vehicle'} 
          className="cdg-main-image"
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
              className="cdg-gallery-nav cdg-prev" 
              onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : imageUrls.length - 1)}
              aria-label="Previous image"
            >
              ❮
            </button>
            <button 
              className="cdg-gallery-nav cdg-next" 
              onClick={() => setSelectedImage(prev => prev < imageUrls.length - 1 ? prev + 1 : 0)}
              aria-label="Next image"
            >
              ❯
            </button>
            <div className="cdg-image-counter">
              {selectedImage + 1} / {imageUrls.length}
            </div>
          </>
        )}
        
        <div className="cdg-gallery-actions">
          {onSave && (
            <button 
              className="cdg-action-button cdg-save-button"
              onClick={onSave}
              aria-label="Save to favorites"
            >
              ♡
            </button>
          )}
          {onShare && (
            <button 
              className="cdg-action-button cdg-share-button"
              onClick={onShare}
              aria-label="Share listing"
            >
              ↗
            </button>
          )}
        </div>
      </div>

      {imageUrls.length > 1 && (
        <div className="cdg-gallery-thumbnails">
          {imageUrls.map((image, index) => (
            <div
              key={index}
              className={`cdg-thumbnail ${selectedImage === index ? 'cdg-active' : ''}`}
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

      <div className="cdg-details">
        {/* UPDATED: Header with title and price side by side */}
        <div className="cdg-header">
          <div className="cdg-title-section">
            <h1 className="cdg-title">{car.title || 'Untitled Vehicle'}</h1>
            {/* UPDATED: Finance badges under title - horizontal layout */}
            <div className="cdg-title-badges">
              {car.priceOptions?.financeAvailable && (
                <div className="cdg-finance-badge">Finance Available</div>
              )}
              {car.priceOptions?.leaseAvailable && (
                <div className="cdg-finance-badge cdg-lease-badge">Lease Available</div>
              )}
            </div>
          </div>
          
          {/* UPDATED: Price container positioned next to title */}
          <div className="cdg-price-container">
            {savings && (
              <div className="cdg-original-price">P{savings.originalPrice.toLocaleString()}</div>
            )}
            <div className="cdg-price">{formatPrice(car.price)}</div>
            {savings && (
              <div className="cdg-savings-highlight">
                Save P{savings.amount.toLocaleString()}
              </div>
            )}
            {car.priceOptions?.monthlyPayment && !car.priceOptions?.showPriceAsPOA && (
              <div className="cdg-monthly-payment">
                P{car.priceOptions.monthlyPayment.toLocaleString()} p/m
              </div>
            )}
          </div>
        </div>

        {/* UPDATED: Status badges section */}
        <div className="cdg-status-badges">
          {car.condition && (
            <span className={`cdg-condition-tag cdg-${car.condition.toLowerCase()}`}>
              {car.condition === 'new' ? 'New' : 
               car.condition === 'used' ? 'Used' : 
               car.condition === 'certified' ? 'Certified Pre-Owned' : 
               car.condition}
            </span>
          )}
          {car.featured && (
            <span className="cdg-featured-tag">Featured</span>
          )}
          {car.priceOptions?.includesVAT && (
            <span className="cdg-vat-tag">Price Includes VAT</span>
          )}
          {car.bodyStyle && (
            <span className="cdg-body-style-tag">{car.bodyStyle}</span>
          )}
        </div>

        {/* UPDATED: Specs grid - responsive 2-3 column layout */}
        <div className="cdg-specs-grid">
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Year</span>
            <span className="cdg-spec-value">{car.specifications?.year || 'N/A'}</span>
          </div>
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Make</span>
            <span className="cdg-spec-value">{car.specifications?.make || 'N/A'}</span>
          </div>
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Model</span>
            <span className="cdg-spec-value">{car.specifications?.model || 'N/A'}</span>
          </div>
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Mileage</span>
            <span className="cdg-spec-value">
              {car.specifications?.mileage 
                ? `${car.specifications.mileage.toLocaleString()} km` 
                : 'N/A'}
            </span>
          </div>
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Engine</span>
            <span className="cdg-spec-value">{car.specifications?.engineSize || 'N/A'}</span>
          </div>
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Transmission</span>
            <span className="cdg-spec-value">{car.specifications?.transmission || 'N/A'}</span>
          </div>
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Fuel Type</span>
            <span className="cdg-spec-value">{car.specifications?.fuelType || 'N/A'}</span>
          </div>
          <div className="cdg-spec-item">
            <span className="cdg-spec-label">Drivetrain</span>
            <span className="cdg-spec-value">{car.specifications?.drivetrain || 'N/A'}</span>
          </div>
          {car.specifications?.power && (
            <div className="cdg-spec-item">
              <span className="cdg-spec-label">Power</span>
              <span className="cdg-spec-value">{car.specifications.power}</span>
            </div>
          )}
          {car.specifications?.torque && (
            <div className="cdg-spec-item">
              <span className="cdg-spec-label">Torque</span>
              <span className="cdg-spec-value">{car.specifications.torque}</span>
            </div>
          )}
          {car.specifications?.exteriorColor && (
            <div className="cdg-spec-item">
              <span className="cdg-spec-label">Exterior Color</span>
              <span className="cdg-spec-value">{car.specifications.exteriorColor}</span>
            </div>
          )}
          {car.specifications?.interiorColor && (
            <div className="cdg-spec-item">
              <span className="cdg-spec-label">Interior Color</span>
              <span className="cdg-spec-value">{car.specifications.interiorColor}</span>
            </div>
          )}
          {car.specifications?.vin && (
            <div className="cdg-spec-item">
              <span className="cdg-spec-label">VIN</span>
              <span className="cdg-spec-value">{car.specifications.vin}</span>
            </div>
          )}
        </div>

        {/* Dealer Information */}
        {car.dealer && (
          <div className="cdg-dealer-info">
            <img 
              src={car.dealer.profile?.logo || car.dealer.logo || '/images/placeholders/dealer-avatar.jpg'} 
              alt={car.dealer.businessName || car.dealer.name || 'Dealer'}
              className="cdg-dealer-avatar"
              onError={(e) => {
                e.target.src = '/images/placeholders/dealer-avatar.jpg';
              }}
            />
            <div className="cdg-dealer-details">
              <div className="cdg-dealer-name">
                {showDealerLink ? (
                  <Link to={`/dealerships/${car.dealer._id}`} className="cdg-dealer-link">
                    {car.dealer.businessName || car.dealer.name || 'Dealer'}
                  </Link>
                ) : (
                  car.dealer.businessName || car.dealer.name || 'Dealer'
                )}
              </div>
              <div className="cdg-dealer-meta">
                <span className="cdg-dealer-location">
                  {car.dealer.location?.city || car.dealer.city || 'Location not specified'}
                </span>
                <span className="cdg-dealer-contact">
                  {car.dealer.phone || car.dealer.contactPhone || 'Contact available'}
                </span>
              </div>
            </div>
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
              <div className="cdg-features-section">
                <h2 className="cdg-section-title">Features & Equipment</h2>
                <div className="cdg-features-grid">
                  {allFeatures.map((feature, index) => (
                    <div key={index} className="cdg-feature-item">
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
          <div className="cdg-description-section">
            <h2 className="cdg-section-title">Description</h2>
            <div className="cdg-description-content">
              {car.description}
            </div>
          </div>
        )}

        {/* Location Section */}
        {car.location && Object.values(car.location).some(value => value) && (
          <div className="cdg-location-section">
            <h2 className="cdg-section-title">Location</h2>
            <div className="cdg-location-details">
              {car.location.address && (
                <div className="cdg-location-item">
                  <span className="cdg-location-label">Address:</span>
                  <span className="cdg-location-value">{car.location.address}</span>
                </div>
              )}
              {car.location.city && (
                <div className="cdg-location-item">
                  <span className="cdg-location-label">City:</span>
                  <span className="cdg-location-value">{car.location.city}</span>
                </div>
              )}
              {car.location.state && (
                <div className="cdg-location-item">
                  <span className="cdg-location-label">State:</span>
                  <span className="cdg-location-value">{car.location.state}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contact Section */}
        {car.dealer && (
          <div className="cdg-contact-section">
            <h2 className="cdg-section-title">Contact Dealer</h2>
            <div className="cdg-contact-actions">
              <button 
                className="cdg-contact-button cdg-whatsapp"
                onClick={() => {
                  const phone = car.dealer.phone || car.dealer.contactPhone || '';
                  const message = `Hi, I'm interested in the ${car.title || 'vehicle'} listed for ${formatPrice(car.price)}.`;
                  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                }}
              >
                📱 WhatsApp
              </button>
              <button 
                className="cdg-contact-button cdg-call"
                onClick={() => {
                  const phone = car.dealer.phone || car.dealer.contactPhone || '';
                  window.open(`tel:${phone}`, '_self');
                }}
              >
                📞 Call
              </button>
              <button 
                className="cdg-contact-button cdg-email"
                onClick={() => {
                  const email = car.dealer.email || car.dealer.contactEmail || '';
                  const subject = `Inquiry about ${car.title || 'vehicle'}`;
                  const body = `Hi, I'm interested in the ${car.title || 'vehicle'} listed for ${formatPrice(car.price)}. Please provide more details.`;
                  window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self');
                }}
              >
                ✉️ Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarDetailsGallery;