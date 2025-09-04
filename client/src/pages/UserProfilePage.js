// client/src/pages/UserProfilePage.js
// ENHANCED VERSION - Articles tab added for journalists between Sell My Vehicle and Network

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Eye, 
  Settings, 
  Route, 
  Car, 
  Gas,
  BarChart3,
  BookOpen, 
  Shield,
  UserCheck,
  Users,  // Added Users icon for Network tab
  PenTool  // NEW: Added for Articles tab
} from 'lucide-react';
import axios from '../config/axios.js';

import ProfileHeader from '../components/profile/ProfileHeader.js';
// REMOVED: import RoleSelection from '../components/profile/RoleSelection.js';
import ProfileOverview from '../components/profile/ProfileOverview.js';
import ServiceManagement from '../components/profile/ServiceManagement.js';
import RouteManagement from '../components/profile/RouteManagement.js';
import VehicleManagement from '../components/profile/VehicleManagement.js';
import BusinessDashboard from '../components/profile/BusinessDashboard.js';
import ProfileSettings from '../components/profile/ProfileSettings.js';
import NetworkTab from '../components/profile/NetworkTab.js';
import ArticleManagement from '../components/profile/ArticleManagement/index.js'; // NEW: Import ArticleManagement

import CoordinatorManagement from '../components/profile/CoordinatorManagement.js';
import RealTimeCoordinatorDashboard from '../components/profile/RealTimeCoordinatorDashboard.js';
import DriverOperatorDashboard from '../components/profile/DriverOperatorDashboard.js';

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
    
    // UPDATED: Enhanced tab handling for car selling, articles, and network
    if (tab) {
      if (tab === 'sell-car' || tab === 'sell_car') {
        setActiveTab('vehicles'); // Redirect to vehicles tab
        setUrlAction('sell'); // Set action to sell
      } else if (['overview', 'services', 'routes', 'vehicles', 'articles', 'business', 'network', 'settings'].includes(tab)) {
        setActiveTab(tab);
      }
    }
    
    if (action) {
      setUrlAction(action);
    }
  }, [location.search]);

  // ORIGINAL WORKING VERSION - Wait for auth to complete before making decisions
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

  const updateProfile = async (updateData) => {
    try {
      const response = await axios.put('/auth/profile', updateData);
      
      if (response.data.success) {
        setProfileData(response.data.data);
        return { success: true, message: 'Profile updated successfully' };
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Failed to update profile. Please try again.' 
      };
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleAdminPanelAccess = () => {
    navigate('/admin/dashboard');
  };

const getUserType = (profileData) => {
  if (!profileData) return 'guest';
  
  // Transport professionals
  if (profileData?.coordinatorProfile?.isCoordinator) return 'coordinator';
  if (profileData?.role === 'driver' || profileData?.role === 'combi_driver') return 'driver';
  if (profileData?.businessProfile?.services?.some(s => s.serviceType === 'public_transport')) {
    return 'transport_operator';
  }
  
  // Business owners
  if (profileData?.dealership) return 'dealership_owner';
  if (profileData?.businessProfile?.services?.some(s => s.isVerified)) return 'business_owner';
  
  // Government/Ministry
  if (profileData?.role === 'ministry_official') return 'ministry_official';
  if (profileData?.role === 'government_admin') return 'government_admin';
  
  // Vehicle owners
  if (profileData?.vehicles?.length > 0) return 'vehicle_owner';
  
  // Regular users
  return 'commuter';
};

// ✅ ADD THIS FUNCTION to show helpful hints based on user type
const getProfileHints = (userType) => {
  const hints = {
    'guest': 'Complete your profile to unlock personalized features',
    'commuter': 'Add your vehicle or explore transport services',
    'vehicle_owner': 'Manage your vehicles and explore our marketplace',
    'driver': 'Check queue status and manage your transport operations',
    'coordinator': 'Manage station queues and coordinate transport',
    'transport_operator': 'Manage your routes and fleet operations',
    'business_owner': 'Track your business performance and listings',
    'dealership_owner': 'Manage inventory and customer relationships',
    'ministry_official': 'Monitor transport operations and compliance',
    'government_admin': 'Access administrative and oversight tools'
  };
  
  return hints[userType] || 'Explore all available features';
};

  // Determine available tabs based on user profile and permissions - UPDATED LOGIC

const getAvailableTabs = () => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye }
  ];

  // === UNIVERSAL TABS (Everyone gets these) ===
  
  // Always show vehicles for anyone who might own a car
  tabs.push({ id: 'vehicles', label: 'Sell My Vehicle', icon: Car });

  // === NEW: JOURNALIST ARTICLES TAB ===
  // Show Articles tab for journalists (primary OR additional role)
  const isJournalist = profileData?.role === 'journalist' ||
                       (profileData?.additionalRoles && 
                        profileData.additionalRoles.includes('journalist'));
  
  if (isJournalist) {
    tabs.push({ id: 'articles', label: 'Articles', icon: PenTool });
  }

  // === BUSINESS & SERVICE TABS ===
  
  // Show Services tab for users who have or want business services
  const hasBusinessInterest = profileData?.businessProfile?.services?.length > 0 || 
                              profileData?.role === 'business_owner' ||
                              profileData?.dealership;
  
  if (hasBusinessInterest) {
    tabs.push({ id: 'services', label: 'Services', icon: Settings });
  }

  // === TRANSPORT-SPECIFIC TABS ===
  
  // Show Routes tab ONLY for transport service providers
  const isTransportProvider = profileData?.businessProfile?.services?.some(s => 
    s.serviceType === 'public_transport' && s.isVerified
  );
  
  if (isTransportProvider) {
    tabs.push({ id: 'routes', label: 'Routes', icon: Route });
  }

  // === COORDINATOR TAB - Smart Logic ===
  const shouldShowCoordinator = 
    // 1. Already a registered coordinator
    profileData?.coordinatorProfile?.isCoordinator ||
    // 2. Works in transport industry
    isTransportProvider ||
    // 3. Has transport-related role
    profileData?.role === 'transport_coordinator' ||
    profileData?.role === 'station_manager' ||
    // 4. Ministry official with transport oversight
    (profileData?.role === 'ministry_official' && 
     profileData?.ministryProfile?.department?.toLowerCase().includes('transport')) ||
    // 5. Expressed interest in coordination
    profileData?.interests?.includes('transport_coordination');

  if (shouldShowCoordinator) {
    tabs.push({ id: 'coordinator', label: 'Coordinator', icon: BookOpen });
  }

  // === DRIVER TAB - Smart Logic ===
  const shouldShowDriver = 
    // 1. Professional transport driver
    profileData?.role === 'driver' ||
    profileData?.role === 'combi_driver' ||
    profileData?.role === 'taxi_driver' ||
    // 2. Owns commercial vehicles
    profileData?.vehicles?.some(v => v.vehicleType === 'commercial' || v.isCommercial) ||
    // 3. Active in transport business
    isTransportProvider ||
    // 4. Currently in transport queue (from localStorage or session)
    localStorage.getItem('inTransportQueue') === 'true' ||
    // 5. Frequently uses transport (commuter who might want to see queue status)
    profileData?.transportUsage?.frequency === 'daily' ||
    // 6. Expressed interest in driving
    profileData?.interests?.includes('transport_driving');

  if (shouldShowDriver) {
    tabs.push({ id: 'driver', label: 'Driver', icon: UserCheck });
  }

  // === BUSINESS DASHBOARD ===
  
  // Show Business Dashboard for verified businesses
  const hasBusinessProfile = profileData?.businessProfile?.services?.some(s => s.isVerified) || 
                            profileData?.businessProfile?.services?.length > 0 ||
                            profileData?.dealership ||
                            profileData?.role === 'business_owner' ||
                            profileData?.role === 'dealership_owner';
  
  if (hasBusinessProfile) {
    tabs.push({ id: 'business', label: 'Business Dashboard', icon: BarChart3 });
  }

  // === MINISTRY/ADMIN TABS ===
  
  // Show admin features for ministry officials
  if (profileData?.role === 'ministry_official' || profileData?.role === 'government_admin') {
    tabs.push({ id: 'ministry', label: 'Ministry Dashboard', icon: Shield });
  }

  // === UNIVERSAL TABS (Always at the end) ===
  // REMOVED: tabs.push({ id: 'roles', label: 'Role Management', icon: Shield })
  
  // Add Network tab before Settings
  tabs.push({ id: 'network', label: 'Network', icon: Users });
  
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
        onProfileUpdate={setProfileData}
        onEditProfile={() => setActiveTab('settings')} // ADDED: Edit profile handler
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

        {/* NEW: Articles tab content for journalists */}
        {activeTab === 'articles' && (
          <ArticleManagement 
            profileData={displayData}
            refreshProfile={fetchUserProfile}
          />
        )}

        {activeTab === 'business' && (
          <BusinessDashboard 
            profileData={displayData}
            refreshProfile={fetchUserProfile}
          />
        )}

        {activeTab === 'coordinator' && (
          <div>
            {/* Check if user is already a coordinator */}
            {displayData?.coordinatorProfile?.isCoordinator ? (
              <RealTimeCoordinatorDashboard 
                profileData={displayData}
                stationId={displayData.coordinatorProfile.stations?.[0]} // Use first station
                refreshProfile={fetchUserProfile}
              />
            ) : (
              <CoordinatorManagement 
                profileData={displayData} 
                refreshProfile={fetchUserProfile} 
              />
            )}
          </div>
        )}

        {activeTab === 'driver' && (
          <DriverOperatorDashboard 
            profileData={displayData} 
          />
        )}

        {/* Network tab content */}
        {activeTab === 'network' && (
          <NetworkTab 
            profileData={displayData}
            refreshProfile={fetchUserProfile}
          />
        )}

        {/* REMOVED: roles tab content */}
        {/*
        {activeTab === 'roles' && (
          <RoleSelection 
            profileData={displayData}
            refreshProfile={fetchUserProfile}
          />
        )}
        */}

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