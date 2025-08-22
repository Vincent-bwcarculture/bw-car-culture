// client/src/components/features/MarketplaceSection/CreateListingPromoCard.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js';
import './CreateListingPromoCard.css';

// Realistic car price ranges for Botswana market
const PRICE_RANGES = [
  'P45,000',
  'P78,500',
  'P125,000',
  'P89,900',
  'P156,000',
  'P234,500',
  'P67,800',
  'P198,000',
  'P145,500',
  'P389,000',
  'P92,300',
  'P167,500',
  'P245,000',
  'P118,700',
  'P298,500',
  'P56,000',
  'P184,200',
  'P312,000',
  'P73,500',
  'P159,800'
];

const CreateListingPromoCard = ({ compact = false }) => {
  const [loading, setLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [priceIndex, setPriceIndex] = useState(0);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Typing animation effect
  useEffect(() => {
    let timeout;
    const targetPrice = PRICE_RANGES[priceIndex];
    
    if (isTyping) {
      // Typing forward
      if (currentPrice.length < targetPrice.length) {
        timeout = setTimeout(() => {
          setCurrentPrice(targetPrice.slice(0, currentPrice.length + 1));
        }, 100 + Math.random() * 100); // Variable typing speed
      } else {
        // Finished typing, wait then start deleting
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000 + Math.random() * 1000);
      }
    } else {
      // Deleting backward
      if (currentPrice.length > 0) {
        timeout = setTimeout(() => {
          setCurrentPrice(currentPrice.slice(0, -1));
        }, 50 + Math.random() * 50); // Faster deletion
      } else {
        // Finished deleting, move to next price
        setPriceIndex((prev) => (prev + 1) % PRICE_RANGES.length);
        setIsTyping(true);
        timeout = setTimeout(() => {
          // Small delay before starting next price
        }, 500);
      }
    }

    return () => clearTimeout(timeout);
  }, [currentPrice, isTyping, priceIndex]);

  // Initialize with first price
  useEffect(() => {
    if (currentPrice === '') {
      setCurrentPrice('P');
    }
  }, [currentPrice]);

  const handleCreateListing = async () => {
    if (loading) return;

    setLoading(true);

    try {
      if (!isAuthenticated || !user) {
        // User is not authenticated - redirect to login with return path
        console.log('User not authenticated, redirecting to login');
        navigate('/login', { 
          state: { 
            from: location.pathname,
            message: 'Please login to create a car listing'
          }
        });
        return;
      }

      // User is authenticated - redirect to profile vehicles tab with sell action
      console.log('User authenticated, redirecting to create listing');
      navigate('/profile?tab=vehicles&action=sell');
      
    } catch (error) {
      console.error('Error handling create listing:', error);
      // Fallback to login page
      navigate('/login', { 
        state: { 
          from: location.pathname,
          message: 'Please login to create a car listing'
        }
      });
    } finally {
      // Small delay to show loading state
      setTimeout(() => {
        setLoading(false);
      }, 300);
    }
  };

  return (
    <div className={`clpc-promo-card ${compact ? 'clpc-compact' : ''} ${loading ? 'clpc-loading' : ''}`}>
      {/* Image Section - matches VehicleCard structure */}
      <div className="clpc-image-container">
        <div className="clpc-promotional-image">
          <div className="clpc-image-overlay">
            <div className="clpc-call-to-action">
              <div className="clpc-cta-icon"></div>
              <h3 className="clpc-cta-title">Sell Your Car</h3>
              <p className="clpc-cta-subtitle">Join the go to Premium Marketplace</p>
            </div>
          </div>
        </div>
        
        {/* Badge similar to VehicleCard status badges */}
        <div className="clpc-promo-badge">
          Quality Listing
        </div>
      </div>

      {/* Content Section - matches VehicleCard structure */}
      <div className="clpc-content">
        {/* Price Section - promotional twist */}
        <div className="clpc-price-section">
          <div className="clpc-price-content">
            <span className="clpc-price-label">Set price, sell fast</span>
            <span className="clpc-price-amount">
              {currentPrice}
              <span className={`clpc-typing-cursor ${isTyping ? 'clpc-typing' : 'clpc-deleting'}`}>|</span>
            </span>
          </div>
          <div className="clpc-price-badge">
            Fast Sale
          </div>
        </div>

        {/* Title and Description */}
        <div className="clpc-main-content">
          <h3 className="clpc-title">
            List Your Vehicle Today
          </h3>
          
          {/* Benefits - mimics specs section */}
          <div className="clpc-benefits">

             <div className="clpc-benefit-item">
              <span className="clpc-benefit-icon">✓</span>
              <span className="clpc-benefit-text">Trusted & Active</span>
            </div>
            <div className="clpc-benefit-item">
              <span className="clpc-benefit-icon">✓</span>
              <span className="clpc-benefit-text">Free to list</span>
            </div>
            <div className="clpc-benefit-item">
              <span className="clpc-benefit-icon">✓</span>
              <span className="clpc-benefit-text">Reach thousands</span>
            </div>
            <div className="clpc-benefit-item">
              <span className="clpc-benefit-icon">✓</span>
              <span className="clpc-benefit-text">Sell faster</span>
            </div>
          </div>
        </div>

        {/* Action Section - mimics dealer info section */}
        <div className="clpc-action-section">
          <button 
            className="clpc-create-button"
            onClick={handleCreateListing}
            disabled={loading}
          >
            <div className="clpc-button-content">
              <span className="clpc-button-icon">
                {loading ? '⏳' : '+'}
              </span>
              <div className="clpc-button-text">
                <span className="clpc-button-main">
                  {loading ? 'Loading...' : 'Create Listing'}
                </span>
                <span className="clpc-button-sub">
                  {isAuthenticated ? 'Start now' : 'Login to begin'}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Additional motivational text */}
        <div className="clpc-motivation">
          <p>Join the go to Premium Marketplace - Sell Fast with Value!</p>
        </div>
      </div>
    </div>
  );
};

export default CreateListingPromoCard;
