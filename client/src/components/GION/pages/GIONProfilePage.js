// components/GION/pages/GIONProfilePage.js
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Award, User, Clock, Settings, Star, LogOut, ChevronRight, Shield, MapPin, 
  Truck, TrendingUp, Check, Camera, AlertTriangle, Building, Briefcase, Bell, Moon, Globe, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js';
import { http } from '../../../config/axios.js';
import './GIONProfilePage.css';

const GIONProfilePage = ({ userPoints = 0, onBack }) => {
  const [activeTab, setActiveTab] = useState('activity');
  const [userImpact, setUserImpact] = useState({
    reviewCount: 0,
    safetyReports: 0,
    routesCovered: 0,
    transportTypes: [],
    areasCovered: [],
    improvementScore: 0
  });
  const [achievements, setAchievements] = useState([]);
  const [badges, setBadges] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    preferredLanguage: 'english'
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false
  });
  const [darkMode, setDarkMode] = useState(false);
  
  // Service management state
  const [userServices, setUserServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [serviceError, setServiceError] = useState(null);
  
  // Get auth context with logout function
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  // Initialize profile form with user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        preferredLanguage: user.preferredLanguage || 'english'
      });
    }
  }, [user]);
  
  // Function to fetch user's activity data securely
  const fetchUserActivity = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const response = await http.get('/user/activity');
      if (response.data && response.data.success) {
        setUserImpact({
          reviewCount: response.data.data.reviewCount || 0,
          safetyReports: response.data.data.safetyReports || 0,
          routesCovered: response.data.data.routesCovered || 0,
          transportTypes: response.data.data.transportTypes || [],
          areasCovered: response.data.data.areasCovered || [],
          improvementScore: response.data.data.improvementScore || 0
        });
      }
    } catch (error) {
      console.error('Error fetching user activity:', error);
      // Set default empty values instead of mock data
      setUserImpact({
        reviewCount: 0,
        safetyReports: 0,
        routesCovered: 0,
        transportTypes: [],
        areasCovered: [],
        improvementScore: 0
      });
    }
  };
  
  // Load user achievements from API
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchAchievements = async () => {
        try {
          const response = await http.get('/user/achievements');
          if (response.data && response.data.success) {
            setAchievements(response.data.data.achievements || []);
            setBadges(response.data.data.badges || []);
          }
        } catch (error) {
          console.error('Error fetching achievements:', error);
          // Set default empty arrays instead of mock data
          setAchievements([]);
          setBadges([]);
        }
      };
      
      fetchAchievements();
      fetchUserActivity();
    }
  }, [isAuthenticated, user, userPoints]);
  
  // Function to fetch user services
  const fetchUserServices = async () => {
    if (!isAuthenticated || !user) return;
    
    setServicesLoading(true);
    setServiceError(null);
    
    try {
      // Fetch only services owned by the current user
      const response = await http.get('/services/user/me');
      
      if (response.data && response.data.success) {
        console.log('User services loaded:', response.data.data);
        setUserServices(response.data.data || []);
      } else {
        setServiceError('Failed to fetch services');
        setUserServices([]);
      }
    } catch (error) {
      console.error('Error fetching user services:', error);
      setServiceError('Error loading services: ' + (error.response?.data?.message || error.message));
      setUserServices([]);
    } finally {
      setServicesLoading(false);
    }
  };
  
  // Fetch user's services when the services tab is active
  useEffect(() => {
    if (activeTab === 'services' && isAuthenticated) {
      fetchUserServices();
    }
  }, [activeTab, isAuthenticated]);
  
  // Fetch user's access requests
  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchAccessRequests = async () => {
        try {
          // Fetch provider requests
          const providerResponse = await http.get('/provider-requests/user/me');
          
          // Fetch ministry requests
          const ministryResponse = await http.get('/ministry-requests/user/me');
          
          // Combine the requests
          const combinedRequests = [
            ...(providerResponse.data?.data || []).map(req => ({ ...req, type: 'provider' })),
            ...(ministryResponse.data?.data || []).map(req => ({ ...req, type: 'ministry' }))
          ];
          
          setAccessRequests(combinedRequests);
        } catch (error) {
          console.error('Error fetching access requests:', error);
          setAccessRequests([]);
        }
      };
      
      fetchAccessRequests();
    }
  }, [isAuthenticated, user]);
  
  // Handle logout functionality
  const handleLogout = () => {
    // Show confirmation dialog
    if (window.confirm('Are you sure you want to sign out?')) {
      // Call the logout function from auth context
      logout();
      
      // Close the GION app after logout
      onBack();
      
      // Navigate to the home page or login page
      navigate('/');
    }
  };
  
  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await http.put('/auth/profile', profileForm);
      
      if (response.data && response.data.success) {
        alert('Profile updated successfully!');
        // Update the user context if updateProfile is available
        if (updateProfile) {
          await updateProfile(profileForm);
        }
        setShowEditProfile(false);
      } else {
        alert('Failed to update profile: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to update profile: ' + (error.response?.data?.message || error.message));
      console.error('Profile update error:', error);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle notification toggle
  const handleNotificationToggle = (type) => {
    setNotificationSettings(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };
  
  // Toggle dark mode
  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Apply dark mode to the app
    document.body.classList.toggle('dark-mode');
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };
  
  // Get user tier based on points
  const getUserTier = (points) => {
    if (points >= 1000) return { name: 'Platinum', color: '#e5e4e2', nextTier: null, nextPoints: null };
    if (points >= 500) return { name: 'Gold', color: '#ffd700', nextTier: 'Platinum', nextPoints: 1000 };
    if (points >= 100) return { name: 'Silver', color: '#c0c0c0', nextTier: 'Gold', nextPoints: 500 };
    return { name: 'Bronze', color: '#cd7f32', nextTier: 'Silver', nextPoints: 100 };
  };
  
  const userTier = getUserTier(userPoints);
  
  // User stats based on real user data
  const userStats = {
    reviews: userImpact.reviewCount || 0,
    points: userPoints,
    safetyReports: userImpact.safetyReports || 0,
    tierProgress: Math.min(100, (userPoints / (userTier.name === 'Platinum' ? 1000 : userTier.name === 'Gold' ? 1000 : userTier.name === 'Silver' ? 500 : 100)) * 100)
  };
  
  // Check if user can access provider dashboard
  const canAccessProviderDashboard = () => {
    // User must be authenticated and have provider role
    if (!isAuthenticated || !user) return false;
    
    // Check user role
    return user.role === 'provider' || user.role === 'admin';
  };
  
  // Check if user can access ministry dashboard
  const canAccessMinistryDashboard = () => {
    // User must be authenticated and have ministry role
    if (!isAuthenticated || !user) return false;
    
    // Check user role
    return user.role === 'ministry' || user.role === 'admin';
  };
  
  // New method to navigate to request forms
  const handleRequestAccess = (type) => {
    // Close GION app and navigate to the appropriate request form
    onBack(); // Close the GION app
    
    setTimeout(() => {
      if (type === 'provider') {
        navigate('/service-provider-request');
      } else {
        navigate('/ministry-request');
      }
    }, 300);
  };
  
  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'active':
        return 'status-active';
      case 'suspended':
        return 'status-suspended';
      case 'verified':
        return 'status-verified';
      default:
        return '';
    }
  };

  // Get provider type label
  const getProviderTypeLabel = (type) => {
    if (!type) return 'Service';
    
    const typeMap = {
      'public_transport': 'Transport Service',
      'dealership': 'Dealership',
      'car_rental': 'Car Rental',
      'workshop': 'Workshop',
      'trailer_rental': 'Trailer Rental',
      'transport': 'Transport Service'
    };
    
    return typeMap[type] || type;
  };
  
  // Navigate to service dashboard - Only for services this user owns
  const handleAccessDashboard = (serviceId) => {
    if (!serviceId) {
      console.error('No service ID provided for dashboard access');
      return;
    }
    
    console.log(`Navigating to dashboard for service ${serviceId}`);
    navigate(`/gion/provider/service/${serviceId}`);
  };
  
  // Navigate to ministry dashboard
  const handleAccessMinistryDashboard = () => {
    navigate('/gion/ministry');
  };
  
  // Profile Edit Form Component
  const ProfileEditForm = () => (
    <div className="profile-edit-form">
      <h3>Edit Profile</h3>
      <form onSubmit={handleProfileUpdate}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            value={profileForm.name} 
            onChange={handleInputChange} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={profileForm.email} 
            onChange={handleInputChange} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phone">Phone Number</label>
          <input 
            type="tel" 
            id="phone" 
            name="phone" 
            value={profileForm.phone} 
            onChange={handleInputChange} 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="preferredLanguage">Preferred Language</label>
          <select 
            id="preferredLanguage" 
            name="preferredLanguage" 
            value={profileForm.preferredLanguage} 
            onChange={handleInputChange}
          >
            <option value="english">English</option>
            <option value="setswana">Setswana</option>
            <option value="french">French</option>
          </select>
        </div>
        
        <div className="form-buttons">
          <button type="button" className="cancel-button" onClick={() => setShowEditProfile(false)}>
            Cancel
          </button>
          <button type="submit" className="save-button">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
  
  // Notification Settings Component
  const NotificationSettingsComponent = () => (
    <div className="notification-settings">
      <h3>Notification Settings</h3>
      
      <div className="notification-option">
        <div className="notification-info">
          <Bell size={18} />
          <span>Email Notifications</span>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={notificationSettings.email} 
            onChange={() => handleNotificationToggle('email')} 
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
      
      <div className="notification-option">
        <div className="notification-info">
          <Bell size={18} />
          <span>Push Notifications</span>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={notificationSettings.push} 
            onChange={() => handleNotificationToggle('push')} 
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
      
      <div className="notification-option">
        <div className="notification-info">
          <Bell size={18} />
          <span>SMS Notifications</span>
        </div>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={notificationSettings.sms} 
            onChange={() => handleNotificationToggle('sms')} 
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
      
      <button className="save-notification-settings">
        Save Notification Settings
      </button>
    </div>
  );
  
  // Render Dashboard Access section based on user roles
  const renderDashboardAccess = () => {
    return (
      <div className="dashboard-access-section">
        <h3 className="tab-section-title">Dashboard Access</h3>
        
        {/* Show Ministry Dashboard access if user has ministry role */}
        {canAccessMinistryDashboard() && (
          <div className="dashboard-access-card">
            <div className="dashboard-icon">
              <Briefcase size={32} />
            </div>
            <div className="dashboard-info">
              <h4>Ministry Dashboard</h4>
              <p>Access your Ministry of Transport dashboard.</p>
              <button 
                className="access-dashboard-button"
                onClick={handleAccessMinistryDashboard}
              >
                Access Ministry Dashboard
              </button>
            </div>
          </div>
        )}
        
        {/* Show Provider Dashboard access if user has provider role */}
        {canAccessProviderDashboard() && (
          <div className="dashboard-access-card">
            <div className="dashboard-icon">
              <Building size={32} />
            </div>
            <div className="dashboard-info">
              <h4>Provider Dashboard</h4>
              <p>Access your Service Provider dashboard.</p>
              <p className="dashboard-note">View your individual services in the "Services" tab.</p>
            </div>
          </div>
        )}
        
        {/* Show request options if user doesn't have any special roles */}
        {!canAccessProviderDashboard() && !canAccessMinistryDashboard() && (
          <div className="access-cards">
            <div className="access-card">
              <div className="access-card-icon">
                <Building size={32} />
              </div>
              <div className="access-card-content">
                <h4>Service Provider Dashboard</h4>
                <p>For transport services, dealerships, car rentals and workshops.</p>
                <button 
                  className="request-access-btn"
                  onClick={() => handleRequestAccess('provider')}
                >
                  Request Provider Access
                </button>
              </div>
            </div>
            
            <div className="access-card">
              <div className="access-card-icon">
                <Briefcase size={32} />
              </div>
              <div className="access-card-content">
                <h4>Ministry Official Dashboard</h4>
                <p>For verified government and ministry representatives.</p>
                <button 
                  className="request-access-btn"
                  onClick={() => handleRequestAccess('ministry')}
                >
                  Request Ministry Access
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // New service management tab content
  const renderServicesTab = () => {
    return (
      <div className="services-tab-content">
        <h3 className="tab-section-title">Your Services</h3>
        
        {servicesLoading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading your services...</p>
          </div>
        ) : serviceError ? (
          <div className="error-message">
            <p>{serviceError}</p>
            <button 
              className="retry-button"
              onClick={fetchUserServices}
            >
              Try Again
            </button>
          </div>
        ) : userServices.length === 0 ? (
          <div className="no-services-message">
            {user && user.role === 'provider' ? (
              <>
                <p>You don't have any services registered yet.</p>
                <button 
                  className="add-service-button"
                  onClick={() => handleRequestAccess('provider')}
                >
                  Register a Service
                </button>
              </>
            ) : (
              <>
                <p>To register a service, you need to request provider access first.</p>
                <button 
                  className="request-provider-button"
                  onClick={() => handleRequestAccess('provider')}
                >
                  Request Provider Access
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="user-services-list">
            {userServices.map(service => (
              <div key={service._id} className="service-card">
                <div className="service-info">
                  <h4>{service.businessName}</h4>
                  <p>{getProviderTypeLabel(service.providerType || service.businessType)}</p>
                  <div className="service-statuses">
                    <div className="service-status">
                      Status: <span className={`status-${service.status}`}>{service.status}</span>
                    </div>
                    {service.verification && (
                      <div className="service-verification">
                        Verification: <span className={`status-${service.verification.status}`}>
                          {service.verification.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="service-actions">
                  <button 
                    className="view-service-button"
                    onClick={() => navigate(`/services/${service._id}`)}
                  >
                    View Service Page
                  </button>
                  
                  {/* Only show dashboard button if service is active */}
                  {service.status === 'active' && (
                    <button 
                      className="dashboard-button"
                      onClick={() => handleAccessDashboard(service._id)}
                    >
                      Manage Service Dashboard
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Only show the "Register New Service" section if user is a provider */}
        {user && user.role === 'provider' && (
          <div className="register-service-section">
            <h3 className="tab-section-title">Register a New Service</h3>
            <p>Want to register another service? Click the button below.</p>
            <button 
              className="add-service-button"
              onClick={() => handleRequestAccess('provider')}
            >
              Register New Service
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Add the Access Requests tab content
  const renderAccessRequestsTab = () => {
    return (
      <div className="access-tab-content">
        {renderDashboardAccess()}
        
        {accessRequests.length > 0 && (
          <div className="access-requests-section">
            <h3 className="tab-section-title">Your Access Requests</h3>
            
            {accessRequests.map((request) => (
              <div key={request._id} className="access-request-item">
                <div className="request-summary">
                  <div className="request-summary-header">
                    <div className="request-name">
                      {request.type === 'provider' ? request.businessName : request.ministryName}
                    </div>
                    <span className={`request-status ${getStatusClass(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="request-details">
                    <div className="request-type">
                      {request.type === 'provider' 
                        ? `Provider Type: ${(request.providerType || '').replace('_', ' ')}`
                        : `Department: ${request.department || ''}`}
                    </div>
                    <div className="request-date">
                      Submitted: {formatDate(request.createdAt)}
                    </div>
                  </div>
                  {request.reviewNotes && (
                    <div className="review-notes">
                      <h5>Review Notes:</h5>
                      <p>{request.reviewNotes}</p>
                    </div>
                  )}
                </div>
                {request.status === 'rejected' && (
                  <button 
                    className="resubmit-btn"
                    onClick={() => handleRequestAccess(request.type)}
                  >
                    Resubmit Request
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  // Tab navigation
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setShowEditProfile(false); // Hide edit profile when changing tabs
  };
  
  // Render settings tab
  const renderSettingsTab = () => (
    <div className="settings-tab-content">
      {showEditProfile ? (
        <ProfileEditForm />
      ) : (
        <>
          <div className="gion-profile-menu">
            <div className="gion-menu-item" onClick={() => setShowEditProfile(true)}>
              <User size={20} />
              <span>Edit Profile</span>
              <ChevronRight size={16} className="gion-menu-chevron" />
            </div>
            <div className="gion-menu-item">
              <Bell size={20} />
              <span>Notification Settings</span>
              <ChevronRight size={16} className="gion-menu-chevron" />
            </div>
            <div className="gion-menu-item">
              <Lock size={20} />
              <span>Privacy Settings</span>
              <ChevronRight size={16} className="gion-menu-chevron" />
            </div>
            <div className="gion-menu-item">
              <Globe size={20} />
              <span>Language</span>
              <ChevronRight size={16} className="gion-menu-chevron" />
            </div>
            <div className="gion-menu-item" onClick={handleToggleDarkMode}>
              <Moon size={20} />
              <span>Dark Mode</span>
              <div className="toggle-switch-small">
                <input type="checkbox" checked={darkMode} readOnly />
                <span className="toggle-slider-small"></span>
              </div>
            </div>
            <div className="gion-menu-item">
              <Shield size={20} />
              <span>Security</span>
              <ChevronRight size={16} className="gion-menu-chevron" />
            </div>
            <div className="gion-menu-item">
              <AlertTriangle size={20} />
              <span>Report an Issue</span>
              <ChevronRight size={16} className="gion-menu-chevron" />
            </div>
            <div className="gion-menu-item">
              <MapPin size={20} />
              <span>Location Settings</span>
              <ChevronRight size={16} className="gion-menu-chevron" />
            </div>
            <div className="gion-menu-item logout" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Sign Out</span>
            </div>
          </div>
          
          <div className="app-info-section">
            <div className="app-version">GION Transport Reviews v1.0</div>
            <div className="ministry-partnership">
              <span className="ministry-icon">🏛️</span>
              <span>Ministry of Transport Partnership Program</span>
            </div>
            <div className="legal-links">
              <a href="#" className="legal-link">Terms of Service</a>
              <a href="#" className="legal-link">Privacy Policy</a>
            </div>
          </div>
        </>
      )}
    </div>
  );
  
  return (
    <div className={`gion-profile-page ${darkMode ? 'dark-mode' : ''}`}>
      <div className="gion-page-header">
        <button className="gion-back-button" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="gion-page-title">Profile</h2>
        <button className="gion-settings-button" onClick={() => handleTabChange('settings')}>
          <Settings size={20} />
        </button>
      </div>
      
      {/* User Info */}
      <div className="gion-profile-user-card">
        <div className="gion-profile-avatar">
          <User size={40} />
        </div>
        <div className="gion-profile-user-info">
          <h3 className="gion-profile-name">{user?.name || 'Transport Reviewer'}</h3>
          <div className="gion-profile-tier" style={{ color: userTier.color }}>
            <Award size={16} />
            <span>{userTier.name} Civic Tier</span>
          </div>
          
          {/* Show role badges if user has special roles */}
          {user && (user.role === 'provider' || user.role === 'ministry' || user.role === 'admin') && (
            <div className="user-role-badges">
              {user.role === 'provider' && (
                <div className="role-badge provider">
                  <Building size={12} />
                  <span>Provider</span>
                </div>
              )}
              {user.role === 'ministry' && (
                <div className="role-badge ministry">
                  <Briefcase size={12} />
                  <span>Ministry</span>
                </div>
              )}
              {user.role === 'admin' && (
                <div className="role-badge admin">
                  <Shield size={12} />
                  <span>Admin</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Badges Section */}
      {badges.length > 0 && (
        <div className="profile-badges-section">
          <div className="badges-container">
            {badges.map(badge => (
              <div 
                key={badge.id} 
                className="profile-badge"
                style={{ backgroundColor: badge.earned ? badge.color : 'rgba(255,255,255,0.1)' }}
              >
                <div className="badge-icon">{badge.icon}</div>
                <div className="badge-name">{badge.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Points Summary */}
      <div className="gion-profile-points-card">
        <div className="gion-points-header">
          <div className="gion-points-icon">
            <Award size={24} />
          </div>
          <div className="gion-points-info">
            <span className="gion-points-value">{userPoints}</span>
            <span className="gion-points-label">CIVIC POINTS</span>
          </div>
        </div>
        
        <div className="gion-tier-progress">
          <div className="gion-tier-progress-bar">
            <div 
              className="gion-tier-progress-fill" 
              style={{ 
                width: `${userStats.tierProgress}%`,
                background: `linear-gradient(90deg, #5f5fc4, ${userTier.color})`
              }}
            ></div>
          </div>
          <div className="gion-tier-progress-info">
            {userTier.nextTier ? (
              <span>{userPoints} / {userTier.nextPoints} points to {userTier.nextTier}</span>
            ) : (
              <span>Maximum Tier Reached</span>
            )}
          </div>
        </div>
      </div>
      
      {/* User Stats */}
      <div className="gion-profile-stats">
        <div className="gion-stat-item">
          <div className="gion-stat-value">{userStats.reviews}</div>
          <div className="gion-stat-label">Reviews</div>
        </div>
        <div className="gion-stat-item">
          <div className="gion-stat-value">{userImpact.routesCovered}</div>
          <div className="gion-stat-label">Routes</div>
        </div>
        <div className="gion-stat-item">
          <div className="gion-stat-value">{userStats.safetyReports}</div>
          <div className="gion-stat-label">Safety Reports</div>
        </div>
        <div className="gion-stat-item">
          <div className="gion-stat-value">{userImpact.improvementScore}%</div>
          <div className="gion-stat-label">Impact Score</div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="profile-tabs">
        <button 
          className={`profile-tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => handleTabChange('activity')}
        >
          <Clock size={16} />
          <span>Activity</span>
        </button>
        
        {/* Show dashboard tab if user has role permissions */}
        {(canAccessProviderDashboard() || canAccessMinistryDashboard()) && (
          <button 
            className={`profile-tab ${activeTab === 'dashboards' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboards')}
          >
            <TrendingUp size={16} />
            <span>Dashboards</span>
          </button>
        )}
        
        {/* Always show Services tab but it will adapt based on user role */}
        <button 
          className={`profile-tab ${activeTab === 'services' ? 'active' : ''}`}
          onClick={() => handleTabChange('services')}
        >
          <Building size={16} />
          <span>Services</span>
        </button>
        
        {/* Show access requests tab for everyone */}
        <button 
          className={`profile-tab ${activeTab === 'access' ? 'active' : ''}`}
          onClick={() => handleTabChange('access')}
        >
          <Shield size={16} />
          <span>Access</span>
        </button>
        
        <button 
          className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => handleTabChange('settings')}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="profile-tab-content">
        {activeTab === 'activity' && (
          <div className="activity-tab-content">
            <h3 className="tab-section-title">Recent Activity</h3>
            
            {/* Activity content would go here - for now showing a placeholder */}
            <div className="placeholder-content">
              <p>Your activity will appear here as you use the app.</p>
            </div>
          </div>
        )}
        
        {activeTab === 'dashboards' && (
          <div className="dashboards-tab-content">
            {renderDashboardAccess()}
          </div>
        )}
        
        {/* Services tab */}
        {activeTab === 'services' && renderServicesTab()}
        
        {/* Access requests tab */}
        {activeTab === 'access' && renderAccessRequestsTab()}
        
        {/* Settings tab */}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
};

export default GIONProfilePage;