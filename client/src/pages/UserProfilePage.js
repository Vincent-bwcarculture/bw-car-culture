// client/src/pages/UserProfilePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Eye, 
  Settings, 
  Route, 
  Car, 
  BarChart3
} from 'lucide-react';

import ProfileHeader from '../components/profile/ProfileHeader.js';
import ProfileOverview from '../components/profile/ProfileOverview.js';
import ServiceManagement from '../components/profile/ServiceManagement.js';
import RouteManagement from '../components/profile/RouteManagement.js';
import VehicleManagement from '../components/profile/VehicleManagement.js';
import BusinessDashboard from '../components/profile/BusinessDashboard.js';
import ProfileSettings from '../components/profile/ProfileSettings.js';

import { useAuth } from '../context/AuthContext.js';
import './UserProfilePage.css';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // States
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [urlAction, setUrlAction] = useState(null);

  // Set dark theme as default and apply it immediately
  useEffect(() => {
    // Force dark theme on page load
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // Handle URL parameters and set initial tab
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const action = params.get('action');
    
    if (tab && ['overview', 'services', 'routes', 'vehicles', 'business', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
    
    if (action) {
      setUrlAction(action);
    }
  }, [location.search]);

  // Fetch user profile data
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserProfile();
    }
  }, [isAuthenticated, user]);

  const fetchUserProfile = async () => {
    if (!user?._id) {
      setError('User ID not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/profile/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please login again.');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.profile) {
        setProfileData(data.profile);
        setError('');
      } else {
        throw new Error(data.message || 'Failed to load profile data');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      setError(error.message || 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updateData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/profile/${user._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      
      if (data.success) {
        setProfileData(data.profile);
        return { success: true, message: 'Profile updated successfully' };
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to update profile. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleAdminPanelAccess = () => {
    navigate('/admin/dashboard');
  };

  // Determine available tabs based on user profile and permissions - UPDATED LOGIC
  const getAvailableTabs = () => {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: Eye }
    ];

    // Add Services tab for all users
    tabs.push({ id: 'services', label: 'Services', icon: Settings });

    // Add Routes tab for transport service providers
    if (profileData?.businessProfile?.services?.some(s => s.serviceType === 'public_transport')) {
      tabs.push({ id: 'routes', label: 'Routes', icon: Route });
    }

    // Add Vehicles tab for all users
    tabs.push({ id: 'vehicles', label: 'My Vehicles', icon: Car });

    // Add Business Dashboard for users with business profiles (NOT admin role)
    // Business dashboard is separate from admin panel
    const hasBusinessProfile = profileData?.businessProfile?.services?.some(s => s.isVerified) || 
                              profileData?.businessProfile?.services?.length > 0 ||
                              profileData?.dealership;
    
    if (hasBusinessProfile) {
      tabs.push({ id: 'business', label: 'Business Dashboard', icon: BarChart3 });
    }

    // Add Settings tab
    tabs.push({ id: 'settings', label: 'Settings', icon: Settings });

    return tabs;
  };

  // Show loading while auth is loading or profile is loading
  if (authLoading || loading) {
    return (
      <div className="uprofile-main-container">
        <div className="uprofile-loading-container">
          <div className="uprofile-loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show error state if not authenticated or error occurred
  if (error || !isAuthenticated || !user) {
    return (
      <div className="uprofile-main-container">
        <div className="uprofile-error-container">
          <h2 className="uprofile-error-title">Profile Not Available</h2>
          <p className="uprofile-error-message">{error || 'Please login to view your profile'}</p>
          <button onClick={handleLoginRedirect} className="uprofile-login-button">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Use fallback to user data if profileData not fully loaded
  const displayData = profileData || user;
  const availableTabs = getAvailableTabs();

  return (
    <div className="uprofile-main-container">
      {/* Enhanced Profile Header Component */}
      <ProfileHeader 
        profileData={displayData}
        setProfileData={setProfileData}
        updateProfile={updateProfile}
        onAdminAccess={handleAdminPanelAccess}
      />

      {/* Enhanced Profile Navigation Component */}
      <EnhancedProfileNavigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        availableTabs={availableTabs}
      />

      {/* Enhanced Profile Content */}
      <div className="uprofile-content-container">
        {activeTab === 'overview' && (
          <ProfileOverview 
            profileData={displayData}
            refreshProfile={fetchUserProfile}
          />
        )}

        {activeTab === 'services' && (
          <ServiceManagement 
            profileData={displayData}
            refreshProfile={fetchUserProfile}
          />
        )}

        {activeTab === 'routes' && (
          <RouteManagement 
            profileData={displayData}
            refreshProfile={fetchUserProfile}
          />
        )}

        {/* Use VehicleManagement with urlAction for Hero section integration */}
        {activeTab === 'vehicles' && (
          <VehicleManagement 
            profileData={displayData}
            refreshProfile={fetchUserProfile}
            urlAction={urlAction}
          />
        )}

        {activeTab === 'business' && (
          <BusinessDashboard 
            profileData={displayData}
            refreshProfile={fetchUserProfile}
          />
        )}

        {activeTab === 'settings' && (
          <ProfileSettings 
            profileData={displayData}
            refreshProfile={fetchUserProfile}
            theme="dark"
            onThemeChange={() => {}} // No-op since theme is fixed to dark
          />
        )}
      </div>
    </div>
  );
};

// Enhanced Profile Navigation Component
const EnhancedProfileNavigation = ({ activeTab, setActiveTab, availableTabs }) => {
  return (
    <div className="uprofile-navigation-container">
      <div className="uprofile-nav-scroll-container">
        <div className="uprofile-navigation-tabs">
          {availableTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`uprofile-nav-tab ${activeTab === tab.id ? 'uprofile-nav-tab-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={18} />
                <span className="uprofile-nav-tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
