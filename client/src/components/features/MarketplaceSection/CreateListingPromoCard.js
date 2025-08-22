// client/src/components/features/MarketplaceSection/CreateListingPromoCard.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js';
import './CreateListingPromoCard.css';

const CreateListingPromoCard = ({ compact = false }) => {
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
              <div className="clpc-cta-icon">🚗</div>
              <h3 className="clpc-cta-title">Sell Your Car</h3>
              <p className="clpc-cta-subtitle">Join thousands of sellers</p>
            </div>
          </div>
        </div>
        
        {/* Badge similar to VehicleCard status badges */}
        <div className="clpc-promo-badge">
          Free Listing
        </div>
      </div>

      {/* Content Section - matches VehicleCard structure */}
      <div className="clpc-content">
        {/* Price Section - promotional twist */}
        <div className="clpc-price-section">
          <div className="clpc-price-content">
            <span className="clpc-price-label">Earn up to</span>
            <span className="clpc-price-amount">P500,000+</span>
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
          <p>Join thousands of successful sellers on our platform!</p>
        </div>
      </div>
    </div>
  );
};

export default CreateListingPromoCard;
