// client/src/pages/UserProfilePage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios.js';
import { 
  User, Settings, Shield, Eye, Car, MapPin, 
  Route, Activity, BarChart3, Calendar, CreditCard
} from 'lucide-react';

// Import modular components
import ProfileHeader from '../components/profile/ProfileHeader.js';
import ProfileNavigation from '../components/profile/ProfileNavigation.js';
import ProfileOverview from '../components/profile/ProfileOverview.js';
import ServiceManagement from '../components/profile/ServiceManagement.js';
import RouteManagement from '../components/profile/RouteManagement.js';
import VehicleManagement from '../components/profile/VehicleManagement.js';
import BusinessDashboard from '../components/profile/BusinessDashboard.js';
import ProfileSettings from '../components/profile/ProfileSettings.js';
import LoadingScreen from '../components/shared/LoadingScreen/LoadingScreen.js';

import './UserProfilePage.css';

const UserProfilePage = () => {
  const { user, isAuthenticated, loading: authLoading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Wait for auth to complete before making decisions
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && user) {
        fetchUserProfile();
      } else {
        setLoading(false);
        setError('Please login to view your profile');
      }
    }
  }, [isAuthenticated, user, authLoading]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try the user profile endpoint first
      let response;
      try {
        response = await axios.get('/user/profile');
      } catch (profileError) {
        // If user profile endpoint fails, try the auth me endpoint
        console.log('User profile endpoint failed, trying auth/me:', profileError);
        response = await axios.get('/auth/me');
      }
      
      if (response.data.success) {
        const userData = response.data.data;
        setProfileData(userData);
      } else {
        throw new Error(response.data.message || 'Failed to load profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile. Please try again.');
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

  // Determine available tabs based on user profile and permissions
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

    // Add Business Dashboard for verified business owners
    if (profileData?.businessProfile?.services?.some(s => s.isVerified) || 
        profileData?.role === 'admin' || 
        profileData?.dealership) {
      tabs.push({ id: 'business', label: 'Business Dashboard', icon: BarChart3 });
    }

    // Add Settings tab
    tabs.push({ id: 'settings', label: 'Settings', icon: Settings });

    return tabs;
  };

  // Show loading while auth is loading or profile is loading
  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  // Show error state if not authenticated or error occurred
  if (error || !isAuthenticated || !user) {
    return (
      <div className="user-profile-page">
        <div className="profile-error">
          <h2>Profile Not Available</h2>
          <p>{error || 'Please login to view your profile'}</p>
          <button onClick={handleLoginRedirect} className="login-button">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show error if profile data couldn't be loaded
  if (!profileData) {
    return (
      <div className="user-profile-page">
        <div className="profile-error">
          <h2>Profile Not Found</h2>
          <p>Unable to load profile data</p>
          <button onClick={fetchUserProfile}>Try Again</button>
        </div>
      </div>
    );
  }

  const availableTabs = getAvailableTabs();

  return (
    <div className="user-profile-page">
      {/* Profile Header Component */}
      <ProfileHeader 
        profileData={profileData}
        setProfileData={setProfileData}
        updateProfile={updateProfile}
        onAdminAccess={handleAdminPanelAccess}
      />

      {/* Profile Navigation Component */}
      <ProfileNavigation 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        availableTabs={availableTabs}
      />

      {/* Profile Content */}
      <div className="profile-content">
        {activeTab === 'overview' && (
          <ProfileOverview 
            profileData={profileData}
            refreshProfile={fetchUserProfile}
          />
        )}

        {activeTab === 'services' && (
          <ServiceManagement 
            profileData={profileData}
            refreshProfile={fetchUserProfile}
          />
        )}

        {activeTab === 'routes' && (
          <RouteManagement 
            profileData={profileData}
            refreshProfile={fetchUserProfile}
          />
        )}

        {activeTab === 'vehicles' && (
          <VehicleManagement 
            profileData={profileData}
            refreshProfile={fetchUserProfile}
          />
        )}

        {activeTab === 'business' && (
          <BusinessDashboard 
            profileData={profileData}
            refreshProfile={fetchUserProfile}
          />
        )}

        {activeTab === 'settings' && (
          <ProfileSettings 
            profileData={profileData}
            refreshProfile={fetchUserProfile}
          />
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
