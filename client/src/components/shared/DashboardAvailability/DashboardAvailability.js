// src/components/shared/DashboardAvailability/DashboardAvailability.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './DashboardAvailability.css';

const DashboardAvailability = ({ providerType, providerId, businessName }) => {
  const [expanded, setExpanded] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Check if the current user has access to this provider's dashboard
  const hasAccess = isAuthenticated && user && (
    user.role === 'admin' || 
    user.role === 'provider' || 
    (user.providerId && user.providerId === providerId)
  );
  
  // Check if the user has a pending request
  const hasPendingRequest = false; // In a real app, you'd check this from your API
  
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleNavigateToDashboard = () => {
    // Navigate to the appropriate dashboard based on provider type
    switch(providerType) {
      case 'dealership':
        navigate(`/provider/dealership/${providerId}`);
        break;
      case 'car_rental':
        navigate(`/provider/rental/${providerId}`);
        break;
      case 'trailer_rental':
        navigate(`/provider/trailer/${providerId}`);
        break;
      case 'public_transport':
        navigate(`/provider/transport/${providerId}`);
        break;
      case 'workshop':
        navigate(`/provider/workshop/${providerId}`);
        break;
      default:
        navigate(`/provider/dashboard/${providerId}`);
    }
  };
  
  const handleRequestAccess = () => {
    // If not logged in, redirect to login
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    
    // Navigate to the provider request form
    navigate('/service-provider-request', { 
      state: { 
        prefilledData: {
          businessName,
          providerType,
          providerId
        }
      }
    });
  };
  
  return (
    <div className={`dashboard-availability ${expanded ? 'expanded' : ''}`}>
      <div className="availability-header" onClick={handleToggleExpand}>
        <div className="availability-title">
          <span className="dashboard-icon">📊</span>
          {hasAccess 
            ? "Provider Dashboard Available" 
            : "Provider Dashboard"}
        </div>
        <button className="toggle-button">
          {expanded ? '−' : '+'}
        </button>
      </div>
      
      {expanded && (
        <div className="availability-content">
          {hasAccess ? (
            <>
              <p>You have access to this provider's dashboard where you can manage listings, view analytics, and more.</p>
              <button 
                className="open-dashboard-btn"
                onClick={handleNavigateToDashboard}
              >
                Open Dashboard
              </button>
            </>
          ) : (
            <>
              <p>
                {isAuthenticated
                  ? "You don't have access to this provider's dashboard. If you are the owner or an authorized representative, you can request access."
                  : "Sign in to request access to this provider's dashboard if you are the owner or an authorized representative."}
              </p>
              
              {hasPendingRequest ? (
                <div className="pending-request-notice">
                  <span className="status-icon">⏳</span>
                  <span>Your access request is pending review</span>
                </div>
              ) : (
                <button 
                  className="request-access-btn"
                  onClick={handleRequestAccess}
                >
                  {isAuthenticated ? 'Request Access' : 'Sign In & Request Access'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardAvailability;