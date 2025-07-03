// client/src/pages/UserProfilePage.js - Complete Updated Version

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import axios from '../config/axios.js';

// Import components
import CarListingManager from '../components/profile/CarListingManager/CarListingManager.js';

// Import icons
import { 
  Eye, 
  Settings, 
  Route, 
  Car, 
  BarChart3, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Shield,
  Sun,
  Moon,
  Edit3,
  Save,
  X
} from 'lucide-react';

import './UserProfilePage.css';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // Get tab and action from URL params
  const urlTab = searchParams.get('tab') || 'overview';
  const urlAction = searchParams.get('action');
  
  const [activeTab, setActiveTab] = useState(urlTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/user/profile');
      
      if (response.data.success) {
        setProfileData(response.data.data);
        // Initialize form data with current profile data
        setFormData({
          name: response.data.data.name || '',
          email: response.data.data.email || '',
          phone: response.data.data.profile?.phone || '',
          bio: response.data.data.profile?.bio || '',
          city: response.data.data.profile?.address?.city || '',
          area: response.data.data.profile?.address?.area || ''
        });
      } else {
        setError('Failed to load profile data');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile data. Please try again.');
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

  // Update profile
  const updateProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.put('/user/profile/basic', formData);
      
      if (response.data.success) {
        setProfileData(response.data.data);
        setEditMode(false);
        // Show success message
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

    // UPDATED: Add Vehicles tab for all users (includes car listings)
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

  // Load profile data on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserProfile();
    }
  }, [isAuthenticated, user]);

  // Update active tab when URL params change
  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

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

  // Show error if profile data couldn't be loaded
  if (!profileData) {
    return (
      <div className="uprofile-main-container">
        <div className="uprofile-error-container">
          <h2 className="uprofile-error-title">Profile Not Found</h2>
          <p className="uprofile-error-message">Unable to load profile data</p>
          <button onClick={fetchUserProfile} className="uprofile-error-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const availableTabs = getAvailableTabs();

  // Render overview tab content
  const renderOverviewContent = () => (
    <div className="uprofile-overview">
      <div className="uprofile-welcome-section">
        <div className="uprofile-avatar-section">
          <div className="uprofile-avatar">
            {profileData.avatar ? (
              <img src={profileData.avatar} alt={profileData.name} />
            ) : (
              <User size={40} />
            )}
          </div>
          <div className="uprofile-user-info">
            <h2>{profileData.name}</h2>
            <p>{profileData.email}</p>
            {profileData.role === 'admin' && (
              <span className="uprofile-admin-badge">Administrator</span>
            )}
          </div>
        </div>
        
        {!editMode ? (
          <button 
            className="uprofile-edit-button"
            onClick={() => setEditMode(true)}
          >
            <Edit3 size={16} />
            Edit Profile
          </button>
        ) : (
          <div className="uprofile-edit-actions">
            <button 
              className="uprofile-save-button"
              onClick={updateProfile}
              disabled={loading}
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button 
              className="uprofile-cancel-button"
              onClick={() => setEditMode(false)}
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        )}
      </div>

      {editMode ? (
        <div className="uprofile-edit-form">
          <div className="uprofile-form-grid">
            <div className="uprofile-form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="uprofile-form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+267 71234567"
              />
            </div>
            
            <div className="uprofile-form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Your city"
              />
            </div>
            
            <div className="uprofile-form-group">
              <label>Area</label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                placeholder="Your area/neighborhood"
              />
            </div>
          </div>
          
          <div className="uprofile-form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              rows="3"
            />
          </div>
        </div>
      ) : (
        <div className="uprofile-info-grid">
          <div className="uprofile-info-item">
            <Phone size={20} />
            <div>
              <span className="uprofile-info-label">Phone</span>
              <span className="uprofile-info-value">
                {profileData.profile?.phone || 'Not provided'}
              </span>
            </div>
          </div>
          
          <div className="uprofile-info-item">
            <Mail size={20} />
            <div>
              <span className="uprofile-info-label">Email</span>
              <span className="uprofile-info-value">{profileData.email}</span>
            </div>
          </div>
          
          <div className="uprofile-info-item">
            <MapPin size={20} />
            <div>
              <span className="uprofile-info-label">Location</span>
              <span className="uprofile-info-value">
                {profileData.profile?.address?.city || 'Not provided'}
                {profileData.profile?.address?.area && `, ${profileData.profile.address.area}`}
              </span>
            </div>
          </div>
          
          <div className="uprofile-info-item">
            <Calendar size={20} />
            <div>
              <span className="uprofile-info-label">Member Since</span>
              <span className="uprofile-info-value">
                {new Date(profileData.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {profileData.profile?.bio && !editMode && (
        <div className="uprofile-bio-section">
          <h3>About</h3>
          <p>{profileData.profile.bio}</p>
        </div>
      )}

      {/* Profile Stats */}
      <div className="uprofile-stats-section">
        <h3>Your Activity</h3>
        <div className="uprofile-stats-grid">
          <div className="uprofile-stat-card">
            <div className="uprofile-stat-number">{profileData.stats?.totalVehicles || 0}</div>
            <div className="uprofile-stat-label">Vehicles</div>
          </div>
          <div className="uprofile-stat-card">
            <div className="uprofile-stat-number">{profileData.stats?.totalRoutes || 0}</div>
            <div className="uprofile-stat-label">Routes</div>
          </div>
          <div className="uprofile-stat-card">
            <div className="uprofile-stat-number">{profileData.stats?.verifiedServices || 0}</div>
            <div className="uprofile-stat-label">Verified Services</div>
          </div>
          <div className="uprofile-stat-card">
            <div className="uprofile-stat-number">{Math.round(profileData.profileCompleteness || 0)}%</div>
            <div className="uprofile-stat-label">Profile Complete</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="uprofile-quick-actions">
        <h3>Quick Actions</h3>
        <div className="uprofile-action-grid">
          <button 
            className="uprofile-action-card"
            onClick={() => setActiveTab('vehicles')}
          >
            <Car size={24} />
            <span>Manage Vehicles</span>
          </button>
          <button 
            className="uprofile-action-card"
            onClick={() => setActiveTab('services')}
          >
            <Settings size={24} />
            <span>Update Services</span>
          </button>
          {profileData.role === 'admin' && (
            <button 
              className="uprofile-action-card"
              onClick={handleAdminPanelAccess}
            >
              <Shield size={24} />
              <span>Admin Panel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Render services tab content
  const renderServicesContent = () => (
    <div className="uprofile-services">
      <div className="uprofile-section-header">
        <h3>Service Management</h3>
        <p>Manage your business services and verification status</p>
      </div>
      
      {profileData.businessProfile?.services?.length > 0 ? (
        <div className="uprofile-services-list">
          {profileData.businessProfile.services.map((service, index) => (
            <div key={index} className="uprofile-service-card">
              <div className="uprofile-service-info">
                <h4>{service.serviceType?.replace('_', ' ').toUpperCase()}</h4>
                <p>{service.description}</p>
              </div>
              <div className="uprofile-service-status">
                <span className={`uprofile-status-badge ${service.isVerified ? 'verified' : 'pending'}`}>
                  {service.isVerified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="uprofile-empty-state">
          <p>No services registered yet.</p>
          <button className="uprofile-primary-button">Add Service</button>
        </div>
      )}
    </div>
  );

  // UPDATED: Render vehicles tab content with CarListingManager
  const renderVehiclesContent = () => (
    <div className="uprofile-vehicles">
      <CarListingManager action={urlAction} />
    </div>
  );

  // Render settings tab content
  const renderSettingsContent = () => (
    <div className="uprofile-settings">
      <div className="uprofile-section-header">
        <h3>Account Settings</h3>
        <p>Manage your account preferences and privacy settings</p>
      </div>

      <div className="uprofile-settings-section">
        <h4>Appearance</h4>
        <div className="uprofile-setting-item">
          <div className="uprofile-setting-info">
            <span>Theme</span>
            <span className="uprofile-setting-description">
              Choose your preferred color scheme
            </span>
          </div>
          <button 
            className="uprofile-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>
      </div>

      <div className="uprofile-settings-section">
        <h4>Privacy & Security</h4>
        <div className="uprofile-setting-item">
          <div className="uprofile-setting-info">
            <span>Profile Visibility</span>
            <span className="uprofile-setting-description">
              Control who can see your profile information
            </span>
          </div>
          <select className="uprofile-setting-select">
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="contacts">Contacts Only</option>
          </select>
        </div>
      </div>

      <div className="uprofile-settings-section">
        <h4>Notifications</h4>
        <div className="uprofile-setting-item">
          <div className="uprofile-setting-info">
            <span>Email Notifications</span>
            <span className="uprofile-setting-description">
              Receive updates via email
            </span>
          </div>
          <label className="uprofile-toggle-switch">
            <input type="checkbox" defaultChecked />
            <span className="uprofile-toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="uprofile-danger-zone">
        <h4>Danger Zone</h4>
        <div className="uprofile-setting-item">
          <div className="uprofile-setting-info">
            <span>Delete Account</span>
            <span className="uprofile-setting-description">
              Permanently delete your account and all data
            </span>
          </div>
          <button className="uprofile-danger-button">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );

  // Render business dashboard content
  const renderBusinessContent = () => (
    <div className="uprofile-business">
      <div className="uprofile-section-header">
        <h3>Business Dashboard</h3>
        <p>Overview of your business performance and analytics</p>
      </div>
      
      <div className="uprofile-business-stats">
        <div className="uprofile-stat-card">
          <div className="uprofile-stat-number">0</div>
          <div className="uprofile-stat-label">Total Views</div>
        </div>
        <div className="uprofile-stat-card">
          <div className="uprofile-stat-number">0</div>
          <div className="uprofile-stat-label">Inquiries</div>
        </div>
        <div className="uprofile-stat-card">
          <div className="uprofile-stat-number">0</div>
          <div className="uprofile-stat-label">Bookings</div>
        </div>
        <div className="uprofile-stat-card">
          <div className="uprofile-stat-number">0</div>
          <div className="uprofile-stat-label">Revenue</div>
        </div>
      </div>
      
      <div className="uprofile-empty-state">
        <p>Business analytics will appear here once you have active services.</p>
      </div>
    </div>
  );

  // Render routes tab content
  const renderRoutesContent = () => (
    <div className="uprofile-routes">
      <div className="uprofile-section-header">
        <h3>Transport Routes</h3>
        <p>Manage your transport routes and schedules</p>
      </div>
      
      {profileData.routes?.length > 0 ? (
        <div className="uprofile-routes-list">
          {profileData.routes.map((route, index) => (
            <div key={index} className="uprofile-route-card">
              <div className="uprofile-route-info">
                <h4>{route.routeName}</h4>
                <p>{route.serviceType?.replace('_', ' ').toUpperCase()}</p>
              </div>
              <div className="uprofile-route-status">
                <span className={`uprofile-status-badge ${route.operationalStatus === 'active' ? 'verified' : 'pending'}`}>
                  {route.operationalStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="uprofile-empty-state">
          <p>No routes configured yet.</p>
          <button className="uprofile-primary-button">Add Route</button>
        </div>
      )}
    </div>
  );

  // Main render function
  return (
    <div className="uprofile-main-container">
      {/* Theme Toggle Button */}
      <button 
        className="uprofile-theme-toggle-fixed"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
      </button>

      <div className="uprofile-container">
        {/* Sidebar Navigation */}
        <div className="uprofile-sidebar">
          <div className="uprofile-sidebar-header">
            <h2>Profile</h2>
          </div>
          
          <nav className="uprofile-nav">
            {availableTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`uprofile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <IconComponent size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="uprofile-main-content">
          {error && (
            <div className="uprofile-error-banner">
              <p>{error}</p>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          <div className="uprofile-content">
            {activeTab === 'overview' && renderOverviewContent()}
            {activeTab === 'services' && renderServicesContent()}
            {activeTab === 'vehicles' && renderVehiclesContent()}
            {activeTab === 'routes' && renderRoutesContent()}
            {activeTab === 'business' && renderBusinessContent()}
            {activeTab === 'settings' && renderSettingsContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
