// src/components/shared/WelcomeModal/WelcomeModal.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomeModal.css';

const WelcomeModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);

//   // Sample premium car image - you can replace with actual images from your backend
//   const premiumCarImage = "/images/placeholders/premium-car.jpg";

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleExploreMarketplace = () => {
    handleClose();
    navigate('/marketplace');
  };

  const handleViewServices = () => {
    handleClose();
    navigate('/services');
  };

  return (
    <div 
      className={`welcome-modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleBackdropClick}
      aria-labelledby="welcome-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="welcome-modal">
        <button 
          className="welcome-modal-close"
          onClick={handleClose}
          aria-label="Close welcome modal"
        >
          ×
        </button>

        <div className="welcome-modal-header">
          {/* <div className="welcome-modal-images">
            <img 
              src={premiumCarImage}
              alt="Premium vehicle"
              className="welcome-modal-car-image"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div> */}
          
          {/* <div className="welcome-modal-logo">
            BW
          </div> */}
          <h1 id="welcome-modal-title" className="welcome-modal-title">
            Welcome to BW Car Culture
          </h1>
          <p className="welcome-modal-subtitle">
            Botswana's Premier Automotive Platform
          </p>
          <span className="beta-badge">
            You are getting Early Access
          </span>
        </div>

        <div className="welcome-modal-content">
          <div className="features-section">
            {/* <h2 className="features-title">What We Offer</h2> */}
            
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-content">
                  <h3 className="feature-title">Vehicle Marketplace</h3>
                  <p className="feature-description">
                    Cars from verified dealers and private sellers
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-content">
                  <h3 className="feature-title">Auto Services</h3>
                  <p className="feature-description">
                    Workshops, rentals, and public transport services across Botswana
                  </p>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-content">
                  <h3 className="feature-title">Direct Connections</h3>
                  <p className="feature-description">
                    Connect with car owners and service providers directly
                  </p>
                </div>
              </div>

                <div className="feature-item">
                <div className="feature-content">
                  <h3 className="feature-title">Save on new car purchases</h3>
                  <p className="feature-description">
                    Get exclusive pre-negotiated deals and discounts on new vehicles.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="cta-section">
            <p className="cta-text">
              We're continuously improving based on your feedback. Join the community!
            </p>
            
            <div className="cta-buttons">
              <button 
                className="cta-primary"
                onClick={handleExploreMarketplace}
              >
                Browse Cars
              </button>
              <button 
                className="cta-secondary"
                onClick={handleViewServices}
              >
                View Services
              </button>
            </div>

            <p className="footer-note">
              Proudly serving you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
