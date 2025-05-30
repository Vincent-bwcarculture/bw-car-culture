// src/components/features/MarketplaceSection/MarketplaceSection.js
import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listingService } from '../../../services/listingService.js';
import VehicleCard from '../../shared/VehicleCard/VehicleCard.js';
import ShareModal from '../../shared/ShareModal.js';
import './MarketplaceSection.css';

const MarketplaceSection = () => {
  const scrollRef = useRef(null);
  const [showControls, setShowControls] = useState({ left: false, right: true });
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchInProgress = useRef(false);
  
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const shareButtonRef = useRef(null);

  useEffect(() => {
    const fetchFeaturedListings = async () => {
      if (fetchInProgress.current) return;

      fetchInProgress.current = true;
      setLoading(true);

      try {
        console.log('Fetching featured listings');
        const featuredCars = await listingService.getFeaturedListings(5);
        console.log(`Fetched ${featuredCars.length} featured listings`);
        
        if (featuredCars && featuredCars.length > 0) {
          setListings(featuredCars);
          setError(null);
        } else {
          console.warn('No featured listings returned from service');
          setListings([]);
          setError('No featured vehicles available at the moment.');
        }
      } catch (error) {
        console.error('Error fetching featured listings:', error);
        setError('Failed to load featured vehicles. Please try again later.');
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
      }
    };

    fetchFeaturedListings();
  }, []);

  const handleShare = (car) => {
    setSelectedCar(car);
    setShareModalOpen(true);
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowControls({
        left: scrollLeft > 0,
        right: scrollLeft < scrollWidth - clientWidth - 1
      });
    }
  };

  const scroll = (direction) => {
    const scrollAmount = 400;
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const slider = scrollRef.current;
    if (slider) {
      slider.addEventListener('scroll', handleScroll);
      handleScroll();
      const resizeObserver = new ResizeObserver(() => {
        handleScroll();
      });
      resizeObserver.observe(slider);
      return () => {
        slider.removeEventListener('scroll', handleScroll);
        resizeObserver.disconnect();
      };
    }
  }, []);

  if (loading) {
    return (
      <section className="marketplace-section">
        <div className="marketplace-header">
          <h2>Featured Vehicles</h2>
        </div>
        <div className="loading-indicator">Loading featured vehicles...</div>
      </section>
    );
  }

  if (error || !listings || listings.length === 0) {
    return (
      <section className="marketplace-section">
        <div className="marketplace-header">
          <h2>Featured Vehicles</h2>
          <div className="view-controls">
            <Link to="/marketplace" className="view-all">View All Listings</Link>
          </div>
        </div>
        <div className="no-listings">
          <p>{error || "No featured vehicles available at the moment."}</p>
          {error && (
            <button className="retry-button" onClick={() => window.location.reload()}>
              Try Again
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="marketplace-section">
      <div className="marketplace-header">
        <h2>Featured Vehicles</h2>
        <div className="view-controls">
          <Link to="/marketplace" className="view-all">View All Listings</Link>
          <div className="scroll-controls">
            {showControls.left && (
              <button 
                className="scroll-button left"
                onClick={() => scroll('left')}
                aria-label="Scroll left"
              >
                ‹
              </button>
            )}
            {showControls.right && (
              <button 
                className="scroll-button right"
                onClick={() => scroll('right')}
                aria-label="Scroll right"
              >
                ›
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="listings-scroll" ref={scrollRef}>
        {listings.map(car => (
          <div key={car._id} className="vehicle-card-wrapper">
            <VehicleCard
              car={car}
              onShare={handleShare}
            />
          </div>
        ))}
      </div>

      {shareModalOpen && selectedCar && (
        <ShareModal 
          car={selectedCar}
          onClose={() => setShareModalOpen(false)}
          buttonRef={shareButtonRef}
        />
      )}
    </section>
  );
};

export default MarketplaceSection;