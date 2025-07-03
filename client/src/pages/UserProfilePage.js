// client/src/pages/UserProfilePage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../config/axios.js';
import { 
  User, Settings, Shield, Eye, Car, MapPin, 
  Route, Activity, BarChart3, Calendar, CreditCard,
  Sun, Moon
} from 'lucide-react';

// Import CarListingManager for vehicles tab
import CarListingManager from '../components/profile/CarListingManager/CarListingManager.js';

import './UserProfilePage.css';

const UserProfilePage = () => {
  const { user, isAuthenticated, loading: authLoading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get tab and action from URL params
  const urlTab = searchParams.get('tab') || 'overview';
  const urlAction = searchParams.get('action');
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(urlTab);
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'light'
    return localStorage.getItem('user-profile-theme') || 'light';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('user-profile-theme', theme);
  }, [theme]);

  // Update active tab when URL params change
  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // Wait for auth to complete before making decisions
  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && user) {
        // FIXED: Set user data immediately from AuthContext
        setProfileData(user);
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
        // FIXED: Don't throw error if we already have user data
        if (!profileData) {
          throw new Error(response.data.message || 'Failed to load profile data');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // FIXED: Only show error if we don't have fallback user data
      if (!profileData) {
        setError('Failed to load profile. Please try again.');
      }
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

  // FIXED: Use fallback to user data if profileData not fully loaded
  const displayData = profileData || user;

  const availableTabs = getAvailableTabs();

  return (
    <div className="uprofile-main-container">
      {/* Theme Toggle Button */}
      <button 
        className="uprofile-theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      {/* Enhanced Profile Header Component */}
      <EnhancedProfileHeader 
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

        {/* UPDATED: Use CarListingManager for vehicles tab */}
        {activeTab === 'vehicles' && (
          <CarListingManager action={urlAction} />
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
            theme={theme}
            onThemeChange={setTheme}
          />
        )}
      </div>
    </div>
  );
};

// Enhanced Profile Header Component
const EnhancedProfileHeader = ({ profileData, setProfileData, updateProfile, onAdminAccess }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleAvatarClick = () => {
    // Handle avatar change functionality
    setIsEditing(true);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatJoinDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  return (
    <div className="uprofile-header-container">
      <div className="uprofile-header-background"></div>
      <div className="uprofile-header-content">
        <div className="uprofile-avatar-section">
          <div className="uprofile-avatar-container">
            {profileData.avatar?.url ? (
              <img 
                src={profileData.avatar.url} 
                alt={profileData.name}
                className="uprofile-avatar"
                onClick={handleAvatarClick}
              />
            ) : (
              <div 
                className="uprofile-avatar-placeholder"
                onClick={handleAvatarClick}
              >
                {getInitials(profileData.name)}
              </div>
            )}
            <div className="uprofile-avatar-edit-overlay" onClick={handleAvatarClick}>
              <User size={16} />
            </div>
          </div>
        </div>

        <div className="uprofile-user-info">
          {/* FIXED: Show actual name from profileData */}
          <h1 className="uprofile-user-name">{profileData.name || 'User'}</h1>
          <p className="uprofile-user-email">{profileData.email}</p>
          
          <button 
            className="uprofile-edit-profile-button"
            onClick={() => setIsEditing(true)}
          >
            <Settings size={16} />
            Edit Profile
          </button>

          <div className="uprofile-profile-meta">
            <div className="uprofile-meta-item">
              <Calendar size={16} />
              <span>Joined {formatJoinDate(profileData.createdAt)}</span>
            </div>
            <div className="uprofile-meta-item">
              <span className={`uprofile-role-badge ${profileData.role}`}>
                {profileData.role}
              </span>
            </div>
          </div>

          {/* Quick Access Buttons */}
          <div className="uprofile-quick-access-section">
            {profileData.role === 'admin' && (
              <button 
                className="uprofile-admin-panel-button"
                onClick={onAdminAccess}
              >
                <Shield size={16} />
                Access Admin Panel
              </button>
            )}
            
            {(profileData.businessProfile?.services?.some(s => s.isVerified) || 
              profileData.dealership) && (
              <button className="uprofile-business-dashboard-button">
                <BarChart3 size={16} />
                Business Dashboard
              </button>
            )}
          </div>

          {/* Profile Stats */}
          <div className="uprofile-profile-stats">
            <div className="uprofile-stat-item">
              <span className="uprofile-stat-value">
                {profileData.businessProfile?.services?.length || 0}
              </span>
              <span className="uprofile-stat-label">Services</span>
            </div>
            <div className="uprofile-stat-item">
              <span className="uprofile-stat-value">
                {profileData.vehicles?.length || 0}
              </span>
              <span className="uprofile-stat-label">Vehicles</span>
            </div>
            <div className="uprofile-stat-item">
              <span className="uprofile-stat-value">
                {profileData.businessProfile?.routes?.length || 0}
              </span>
              <span className="uprofile-stat-label">Routes</span>
            </div>
            <div className="uprofile-stat-item">
              <span className="uprofile-stat-value">
                {profileData.profile?.completionPercentage || 0}%
              </span>
              <span className="uprofile-stat-label">Complete</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Profile Navigation Component
const EnhancedProfileNavigation = ({ activeTab, setActiveTab, availableTabs }) => {
  return (
    <div className="uprofile-navigation-container">
      <div className="uprofile-navigation-scroll">
        <div className="uprofile-navigation-tabs">
          {availableTabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`uprofile-tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
              >
                <IconComponent size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Simple fallback components for missing imports
const ProfileOverview = ({ profileData }) => (
  <div className="uprofile-placeholder">
    <h3>Profile Overview</h3>
    <p>Welcome back, {profileData.name}!</p>
    <p>Profile overview content coming soon.</p>
  </div>
);

const ServiceManagement = ({ profileData }) => (
  <div className="uprofile-placeholder">
    <h3>Service Management</h3>
    <p>Manage your services here.</p>
  </div>
);

const RouteManagement = ({ profileData }) => (
  <div className="uprofile-placeholder">
    <h3>Route Management</h3>
    <p>Manage your transport routes here.</p>
  </div>
);

const BusinessDashboard = ({ profileData }) => (
  <div className="uprofile-placeholder">
    <h3>Business Dashboard</h3>
    <p>Your business analytics and insights.</p>
  </div>
);

const ProfileSettings = ({ profileData, theme, onThemeChange }) => (
  <div className="uprofile-placeholder">
    <h3>Profile Settings</h3>
    <div className="uprofile-setting-item">
      <span>Theme</span>
      <button onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}>
        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        {theme === 'light' ? 'Dark' : 'Light'}
      </button>
    </div>
  </div>
);

export default UserProfilePage;
