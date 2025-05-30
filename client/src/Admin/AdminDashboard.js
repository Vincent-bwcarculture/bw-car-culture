// src/Admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import AdminStats from './AdminStats.js';
import QuickActions from './QuickActions.js';
import NewsManager from '../components/NewsManager/NewsManager.js';
import DealershipManager from './DealershipManager/DealershipManager.js';
import RentalVehicleManager from './RentalVehicleManager/RentalVehicleManager.js';
import TrailerListingManager from './TrailerListingManager/TrailerListingManager.js';
import TransportRouteManager from './TransportRouteManager/TransportRouteManager.js';
import ServiceProviderManager from './ServiceProviderManager/ServiceProviderManager.js';
import GIONAdminDashboard from '../components/GION/GIONAdminDashboard/GIONAdminDashboard.js'; 
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    // Add a small delay to prevent flickering
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
      </div>
    );
  }

  // Content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'gion':
        return (
          <>
            <div className="section-header">
              <h2>GION Administration</h2>
              <button 
                className="back-button"
                onClick={() => setActiveSection('dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
            <GIONAdminDashboard />
          </>
        );
      case 'service-providers':
        return (
          <>
            <div className="section-header">
              <h2>Service Provider Management</h2>
              <button 
                className="back-button"
                onClick={() => setActiveSection('dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
            <ServiceProviderManager />
          </>
        );
      case 'dealerships':
        return (
          <>
            <div className="section-header">
              <h2>Dealership Management</h2>
              <button 
                className="back-button"
                onClick={() => setActiveSection('dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
            <DealershipManager />
          </>
        );
      case 'rental-vehicles':
        return (
          <>
            <div className="section-header">
              <h2>Rental Vehicles Management</h2>
              <button 
                className="back-button"
                onClick={() => setActiveSection('dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
            <RentalVehicleManager />
          </>
        );
      case 'trailers':
        return (
          <>
            <div className="section-header">
              <h2>Trailer Listings Management</h2>
              <button 
                className="back-button"
                onClick={() => setActiveSection('dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
            <TrailerListingManager />
          </>
        );
      case 'transport-routes':
        return (
          <>
            <div className="section-header">
              <h2>Transport Routes Management</h2>
              <button 
                className="back-button"
                onClick={() => setActiveSection('dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
            <TransportRouteManager />
          </>
        );
      case 'videos':
        return (
          <>
            <div className="section-header">
              <h2>Video Management</h2>
              <button 
                className="back-button"
                onClick={() => setActiveSection('dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
            <div className="video-manager-container">
              <p>Video Management interface loading...</p>
            </div>
          </>
        );
      default:
        return (
          <>
            <div className="dashboard-stats">
              <AdminStats />
            </div>
            <div className="dashboard-content">
              <QuickActions onActionSelected={setActiveSection} />
              <NewsManager />
            </div>
          </>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome, {user?.name || 'Admin'}</h1>
          <p className="admin-role">{user?.role || 'Administrator'}</p>
          <p className="last-login">
            {user?.lastLogin ? 
              `Last login: ${new Date(user.lastLogin).toLocaleString()}` : 
              'First time login'}
          </p>
        </div>
      </div>
      
      {renderContent()}
    </div>
  );
};

export default AdminDashboard;