// src/Admin/AdminDashboard.js
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import QuickActions from './QuickActions.js';
import NewsManager from '../components/NewsManager/NewsManager.js';
import DealershipManager from './DealershipManager/DealershipManager.js';
import RentalVehicleManager from './RentalVehicleManager/RentalVehicleManager.js';
import TrailerListingManager from './TrailerListingManager/TrailerListingManager.js';
import TransportRouteManager from './TransportRouteManager/TransportRouteManager.js';
import TransitFareManager from './TransitFareManager/TransitFareManager.js';
import ServiceProviderManager from './ServiceProviderManager/ServiceProviderManager.js';
import GIONAdminDashboard from '../components/GION/GIONAdminDashboard/GIONAdminDashboard.js';
import BroadcastNotification from './BroadcastNotification/BroadcastNotification.js';
import AdminOpsDashboardWidget from './AdminOps/AdminOpsDashboardWidget.js';
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
              <button className="back-button" onClick={() => setActiveSection('dashboard')}>
                ← Back to Dashboard
              </button>
            </div>
            <TransportRouteManager />
            <div style={{ marginTop: '2rem', background: 'rgba(20,20,20,0.8)', border: '1px solid #2c2c2c', borderRadius: '10px', padding: '1.25rem' }}>
              <TransitFareManager />
            </div>
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
      case 'broadcast':
        return (
          <>
            <div className="section-header">
              <h2>Broadcast Notification</h2>
              <button
                className="back-button"
                onClick={() => setActiveSection('dashboard')}
              >
                ← Back to Dashboard
              </button>
            </div>
            <BroadcastNotification />
          </>
        );
      default:
        return (
          <>
            <AdminOpsDashboardWidget />
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