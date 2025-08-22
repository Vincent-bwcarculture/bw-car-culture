// client/src/components/features/MarketplaceSection/FloatingCreateButton.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js';
import './FloatingCreateButton.css';

const FloatingCreateButton = () => {
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
    <button
      className={`marketplace-fab-button ${loading ? 'marketplace-fab-loading' : ''}`}
      onClick={handleCreateListing}
      disabled={loading}
      aria-label="Create car listing"
      title={isAuthenticated ? "Create a new car listing" : "Login to create a car listing"}
    >
      <div className="marketplace-fab-content">
        <span className="marketplace-fab-icon">+</span>
        <span className="marketplace-fab-text">
          {loading ? 'Loading...' : 'Create listing'}
        </span>
      </div>
    </button>
  );
};

export default FloatingCreateButton;
