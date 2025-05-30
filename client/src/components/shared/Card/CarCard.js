import React from 'react';
import { Heart, Share } from 'lucide-react';

const CarCard = ({ car, onClick, showActions = true }) => {
    const [imageError, setImageError] = useState(false);
  
    // Find the main image URL
    const getImageUrl = () => {
      // Handle different possible data structures
      if (!car) return '/images/placeholders/car.jpg';
      
      // If car.image is directly provided
      if (car.image) return car.image;
      
      // If car has images array with objects
      if (car.images && car.images.length > 0) {
        // First try to find the main/primary image
        const primaryImage = car.images.find(img => img.isPrimary || img.isMain);
        if (primaryImage && primaryImage.url) return primaryImage.url;
        
        // Otherwise use the first image
        if (car.images[0].url) return car.images[0].url;
        
        // Or if images are just strings
        if (typeof car.images[0] === 'string') return car.images[0];
      }
      
      // Default fallback
      return '/images/placeholders/car.jpg';
    };
    
    const handleImageError = () => {
      console.log('Image loading failed for:', car.title);
      setImageError(true);
    };


  return (
    <div className="car-result-card" onClick={onClick}>
      <div className="car-result-image">
      <img
          src={imageError ? '/images/placeholders/car.jpg' : getImageUrl()}
          alt={car.title || 'Car'}
          loading="lazy"
          onError={handleImageError}
        />

        {car.dealer?.verified && (
          <span className="verified-dealer">✓ Verified Dealer</span>
        )}

        
        <div className="quick-actions">
          <button className="action-icon" aria-label="Save to favorites">
            <Heart size={20} />
          </button>
          <button className="action-icon" aria-label="Share">
            <Share size={20} />
          </button>
        </div>
      </div>
      
      <div className="car-result-content">
        <div className="car-result-header">
          <h4>{car.title}</h4>
          <span className="car-price">${car.price?.toLocaleString()}</span>
        </div>
        
        <div className="car-specs">
          <div className="spec-item">Year: {car.year}</div>
          <div className="spec-item">Mileage: {car.mileage}</div>
          <div className="spec-item">Transmission: {car.transmission}</div>
          <div className="spec-item">Fuel: {car.fuelType}</div>
        </div>
        
        {car.dealer && (
          <div className="dealer-info">
            <img 
              src={car.dealer.avatar} 
              alt={car.dealer.name} 
              className="dealer-avatar"
              onError={(e) => {
                e.target.src = '/images/default-avatar.jpg';
              }}
            />
            <div className="dealer-details">
              <div className="dealer-name">{car.dealer.name}</div>
              <div className="dealer-location">{car.dealer.location}</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="car-result-footer">
        <span className={`condition-tag ${car.condition?.toLowerCase() || 'new'}`}>
          {car.condition || 'New'}
        </span>
        <button 
          className="contact-dealer-btn"
          onClick={(e) => {
            e.stopPropagation();
            // Handle contact dealer action
          }}
        >
          Contact Dealer
        </button>
      </div>
    </div>
  );
};

export default CarCard;