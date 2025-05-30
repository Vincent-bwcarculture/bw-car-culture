// SideAdvertisement.js
import React, { useRef, useEffect, useState } from 'react';
import './SideAdvertisement.css';

const SideAdvertisement = ({ listings = [] }) => {
  const listingsContainerRef = useRef(null);
  const [showScrollButtons, setShowScrollButtons] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [loadedImages, setLoadedImages] = useState({});

  // Default listings if none provided
  const defaultListings = [
    {
      id: 1,
      title: "BMW F80 M3",
      price: 32500,
      year: 2020,
      mileage: "45,000",
      transmission: "Manual",
      fuelType: "Petrol",
      image: "images/f80.jpg", // Removed leading slash
      preview: true,
      dealer: {
        name: "Premium Motors",
        location: "Los Angeles, CA",
        avatar: "/images/dealer-avatar.jpg",
        verified: true,
        rating: 4.8,
        reviews: 124
      }
    },
    // ... other default listings ...
  ];

  const displayListings = listings.length > 0 ? listings : defaultListings;

  useEffect(() => {
    const container = listingsContainerRef.current;
    if (container) {
      const checkScroll = () => {
        setShowScrollButtons(container.scrollHeight > container.clientHeight);
        setScrollPosition(container.scrollTop);
      };

      checkScroll();
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);

      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [listings]);

  const scrollTo = (direction) => {
    const container = listingsContainerRef.current;
    if (!container) return;

    const scrollAmount = 460; // Height of one card + gap
    const newPosition = direction === 'up' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(
          container.scrollHeight - container.clientHeight,
          scrollPosition + scrollAmount
        );

    container.scrollTo({
      top: newPosition,
      behavior: 'smooth'
    });
  };

  const handleImageLoad = (imageId) => {
    setLoadedImages(prev => ({
      ...prev,
      [imageId]: true
    }));
  };

  return (
    <div className="side-advertisement">
      <div className="advertisement-header">
        <h2>HOT LISTINGS!</h2>
        <span className="view-all">View All</span>
      </div>
      
      {showScrollButtons && (
        <div className="scroll-controls">
          <button 
            className="scroll-btn"
            onClick={() => scrollTo('up')}
            disabled={scrollPosition <= 0}
            aria-label="Scroll to previous listings"
          >
            ↑ Previous
          </button>
          <button 
            className="scroll-btn"
            onClick={() => scrollTo('down')}
            disabled={
              scrollPosition >= 
              (listingsContainerRef.current?.scrollHeight || 0) - 
              (listingsContainerRef.current?.clientHeight || 0)
            }
            aria-label="Scroll to next listings"
          >
            ↓ Next
          </button>
        </div>
      )}

      <div className="listings-container" ref={listingsContainerRef}>
        {displayListings.map((listing) => (
          <div key={listing.id} className="listing-card">
            <div className="listing-image">
              {!loadedImages[listing.id] && (
                <div className="loading-placeholder" />
              )}
              <img 
                src={listing.image} 
                alt={listing.title}
                className={loadedImages[listing.id] ? 'loaded' : ''}
                onLoad={() => handleImageLoad(listing.id)}
                onError={(e) => {
                  console.error(`Failed to load image: ${listing.image}`);
                  e.target.src = 'images/placeholder.jpg'; // Fallback image
                }}
              />
              
              {listing.dealer.verified && (
                <span className="verified-badge">
                  <i>✓</i> Verified Dealer
                </span>
              )}
              
              {listing.preview && (
                <span className="preview-badge">Preview</span>
              )}
              
              <div className="image-overlay">
                <div className="overlay-content">
                  <div className="overlay-details">
                    <h3 className="overlay-title">{listing.title}</h3>
                    <div className="overlay-specs">
                      <span className="overlay-spec">
                        <i>📅</i> {listing.year}
                      </span>
                      <span className="overlay-spec">
                        <i>🛣️</i> {listing.mileage} km
                      </span>
                      <span className="overlay-spec">
                        <i>⚙️</i> {listing.transmission}
                      </span>
                    </div>
                  </div>
                  <div className="overlay-price">
                    ${listing.price.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <button className="quick-action-btn" title="Save">♡</button>
                <button className="quick-action-btn" title="Share">↗</button>
              </div>
            </div>
            
            <div className="listing-content">
              <div className="listing-dealer">
                <img 
                  src={listing.dealer.avatar} 
                  alt={listing.dealer.name} 
                  className="dealer-avatar"
                  onError={(e) => {
                    e.target.src = '/images/default-avatar.jpg';
                  }}
                />
                <div className="dealer-info">
                  <div className="dealer-name">{listing.dealer.name}</div>
                  <div className="dealer-location">{listing.dealer.location}</div>
                  <div className="dealer-rating">
                    <span className="rating-stars">
                      {"★".repeat(Math.floor(listing.dealer.rating))}
                      {listing.dealer.rating % 1 > 0 ? "½" : ""}
                    </span>
                    <span className="rating-count">
                      ({listing.dealer.reviews} reviews)
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="listing-footer">
                <button className="contact-button">Contact Dealer</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SideAdvertisement;