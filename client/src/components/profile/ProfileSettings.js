// client/src/components/profile/ProfileSettings.js
import React, { useState, useEffect } from 'react';
import { 
  Settings, Bell, Lock, Eye, CreditCard, Users, 
  Shield, Smartphone, Mail, Globe, Save, 
  AlertCircle, CheckCircle, Camera, Trash2,
  Sun, Moon, Monitor, User, MapPin, Calendar
} from 'lucide-react';
import axios from '../../config/axios.js';
import './ProfileSettings.css';

const ProfileSettings = ({ profileData, refreshProfile, theme, onThemeChange }) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form states
  const [generalSettings, setGeneralSettings] = useState({
    name: profileData?.name || '',
    email: profileData?.email || '',
    phone: profileData?.profile?.phone || '',
    bio: profileData?.profile?.bio || '',
    dateOfBirth: profileData?.profile?.dateOfBirth || '',
    gender: profileData?.profile?.gender || '',
    language: profileData?.profile?.language || 'en',
    currency: profileData?.profile?.currency || 'BWP',
    timezone: profileData?.profile?.timezone || 'Africa/Gaborone'
  });

  const [addressSettings, setAddressSettings] = useState({
    street: profileData?.profile?.address?.street || '',
    city: profileData?.profile?.address?.city || '',
    state: profileData?.profile?.address?.state || '',
    country: profileData?.profile?.address?.country || 'Botswana',
    postalCode: profileData?.profile?.address?.postalCode || ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: profileData?.profile?.notifications?.email !== false,
    sms: profileData?.profile?.notifications?.sms !== false,
    push: profileData?.profile?.notifications?.push !== false,
    marketing: profileData?.profile?.notifications?.marketing !== false,
    serviceReminders: profileData?.profile?.notifications?.serviceReminders !== false,
    listingUpdates: profileData?.profile?.notifications?.listingUpdates !== false,
    priceAlerts: profileData?.profile?.notifications?.priceAlerts !== false,
    newsUpdates: profileData?.profile?.notifications?.newsUpdates !== false
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: profileData?.profile?.privacy?.profileVisibility || 'public',
    showEmail: profileData?.profile?.privacy?.showEmail !== false,
    showPhone: profileData?.profile?.privacy?.showPhone !== false,
    allowMessages: profileData?.profile?.privacy?.allowMessages !== false,
    dataSharing: profileData?.profile?.privacy?.dataSharing !== false,
    locationTracking: profileData?.profile?.privacy?.locationTracking !== false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Theme settings
  const [themeSettings, setThemeSettings] = useState({
    mode: theme || 'light',
    autoSwitch: localStorage.getItem('auto-theme-switch') === 'true',
    systemPreference: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  });

  // Update theme when settings change
  useEffect(() => {
    if (themeSettings.autoSwitch) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        const newTheme = e.matches ? 'dark' : 'light';
        setThemeSettings(prev => ({ ...prev, systemPreference: newTheme }));
        onThemeChange(newTheme);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      onThemeChange(themeSettings.systemPreference);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      onThemeChange(themeSettings.mode);
    }
  }, [themeSettings.autoSwitch, themeSettings.mode, themeSettings.systemPreference, onThemeChange]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleThemeToggle = () => {
    const newMode = themeSettings.mode === 'light' ? 'dark' : 'light';
    setThemeSettings(prev => ({ ...prev, mode: newMode }));
    if (!themeSettings.autoSwitch) {
      onThemeChange(newMode);
    }
  };

  const handleAutoSwitchToggle = () => {
    const newAutoSwitch = !themeSettings.autoSwitch;
    setThemeSettings(prev => ({ ...prev, autoSwitch: newAutoSwitch }));
    localStorage.setItem('auto-theme-switch', newAutoSwitch.toString());
  };

  const handleGeneralSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.put('/user/profile/basic', generalSettings);
      
      if (response.data.success) {
        showMessage('success', 'Profile updated successfully');
        refreshProfile();
      } else {
        showMessage('error', response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.put('/user/profile/address', addressSettings);
      
      if (response.data.success) {
        showMessage('success', 'Address updated successfully');
        refreshProfile();
      } else {
        showMessage('error', response.data.message || 'Failed to update address');
      }
    } catch (error) {
      console.error('Address update error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to update address');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.put('/user/profile/notifications', notificationSettings);
      
      if (response.data.success) {
        showMessage('success', 'Notification preferences updated');
        refreshProfile();
      } else {
        showMessage('error', response.data.message || 'Failed to update notifications');
      }
    } catch (error) {
      console.error('Notification update error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to update notifications');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacySubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.put('/user/profile/privacy', privacySettings);
      
      if (response.data.success) {
        showMessage('success', 'Privacy settings updated');
        refreshProfile();
      } else {
        showMessage('error', response.data.message || 'Failed to update privacy settings');
      }
    } catch (error) {
      console.error('Privacy update error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put('/user/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        showMessage('success', 'Password updated successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showMessage('error', response.data.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Password update error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        setLoading(true);
        const response = await axios.delete('/user/profile/delete');
        
        if (response.data.success) {
          showMessage('success', 'Account deletion initiated');
          // Redirect to home or login page after a delay
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          showMessage('error', response.data.message || 'Failed to delete account');
        }
      } catch (error) {
        console.error('Account deletion error:', error);
        showMessage('error', error.response?.data?.message || 'Failed to delete account');
      } finally {
        setLoading(false);
      }
    }
  };

  const validatePassword = (password) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return requirements;
  };

  const passwordRequirements = validatePassword(passwordData.newPassword);

  const settingsTabsConfig = [
    { id: 'general', label: 'General', icon: User },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'appearance', label: 'Appearance', icon: Monitor },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'account', label: 'Account', icon: Settings }
  ];

  return (
    <div className="psettings-main-container">
      {/* Settings Header */}
      <div className="psettings-header">
        <h2 className="psettings-title">
          <Settings size={24} />
          Profile Settings
        </h2>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`psettings-message ${message.type}`}>
          {message.type === 'success' && <CheckCircle size={16} />}
          {message.type === 'error' && <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Settings Navigation */}
      <div className="psettings-navigation">
        <div className="psettings-nav-tabs">
          {settingsTabsConfig.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`psettings-nav-tab ${activeSettingsTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveSettingsTab(tab.id)}
              >
                <IconComponent size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Content */}
      <div className="psettings-content">
        {/* General Settings */}
        {activeSettingsTab === 'general' && (
          <div>
            <h3 className="psettings-section-title">
              <User size={20} />
              General Information
            </h3>
            <form onSubmit={handleGeneralSettingsSubmit} className="psettings-form">
              <div className="psettings-form-row">
                <div className="psettings-form-group">
                  <label className="psettings-form-label">Name</label>
                  <input
                    type="text"
                    className="psettings-form-input"
                    value={generalSettings.name}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="psettings-form-group">
                  <label className="psettings-form-label">Email</label>
                  <input
                    type="email"
                    className="psettings-form-input"
                    value={generalSettings.email}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="psettings-form-row">
                <div className="psettings-form-group">
                  <label className="psettings-form-label">Phone</label>
                  <input
                    type="tel"
                    className="psettings-form-input"
                    value={generalSettings.phone}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="psettings-form-group">
                  <label className="psettings-form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="psettings-form-input"
                    value={generalSettings.dateOfBirth}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
              </div>

              <div className="psettings-form-row">
                <div className="psettings-form-group">
                  <label className="psettings-form-label">Gender</label>
                  <select
                    className="psettings-form-select"
                    value={generalSettings.gender}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div className="psettings-form-group">
                  <label className="psettings-form-label">Language</label>
                  <select
                    className="psettings-form-select"
                    value={generalSettings.language}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, language: e.target.value }))}
                  >
                    <option value="en">English</option>
                    <option value="tn">Setswana</option>
                    <option value="af">Afrikaans</option>
                  </select>
                </div>
              </div>

              <div className="psettings-form-row full-width">
                <div className="psettings-form-group">
                  <label className="psettings-form-label">Bio</label>
                  <textarea
                    className="psettings-form-textarea"
                    value={generalSettings.bio}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                  <p className="psettings-form-hint">
                    {generalSettings.bio.length}/500 characters
                  </p>
                </div>
              </div>

              <div className="psettings-form-actions">
                <button 
                  type="submit" 
                  className="psettings-btn psettings-btn-primary"
                  disabled={loading}
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address Settings */}
        {activeSettingsTab === 'address' && (
          <div>
            <h3 className="psettings-section-title">
              <MapPin size={20} />
              Address Information
            </h3>
            <form onSubmit={handleAddressSubmit} className="psettings-form">
              <div className="psettings-form-row full-width">
                <div className="psettings-form-group">
                  <label className="psettings-form-label">Street Address</label>
                  <input
                    type="text"
                    className="psettings-form-input"
                    value={addressSettings.street}
                    onChange={(e) => setAddressSettings(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Enter your street address"
                  />
                </div>
              </div>

              <div className="psettings-form-row">
                <div className="psettings-form-group">
                  <label className="psettings-form-label">City</label>
                  <input
                    type="text"
                    className="psettings-form-input"
                    value={addressSettings.city}
                    onChange={(e) => setAddressSettings(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
                <div className="psettings-form-group">
                  <label className="psettings-form-label">State/Region</label>
                  <input
                    type="text"
                    className="psettings-form-input"
                    value={addressSettings.state}
                    onChange={(e) => setAddressSettings(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="State or Region"
                  />
                </div>
              </div>

              <div className="psettings-form-row">
                <div className="psettings-form-group">
                  <label className="psettings-form-label">Country</label>
                  <select
                    className="psettings-form-select"
                    value={addressSettings.country}
                    onChange={(e) => setAddressSettings(prev => ({ ...prev, country: e.target.value }))}
                  >
                    <option value="Botswana">Botswana</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Namibia">Namibia</option>
                    <option value="Zimbabwe">Zimbabwe</option>
                  </select>
                </div>
                <div className="psettings-form-group">
                  <label className="psettings-form-label">Postal Code</label>
                  <input
                    type="text"
                    className="psettings-form-input"
                    value={addressSettings.postalCode}
                    onChange={(e) => setAddressSettings(prev => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="Postal Code"
                  />
                </div>
              </div>

              <div className="psettings-form-actions">
                <button 
                  type="submit" 
                  className="psettings-btn psettings-btn-primary"
                  disabled={loading}
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Appearance Settings */}
        {activeSettingsTab === 'appearance' && (
          <div>
            <h3 className="psettings-section-title">
              <Monitor size={20} />
              Appearance & Theme
            </h3>
            
            <div className="psettings-form">
              <div className="psettings-notification-groups">
                <div className="psettings-notification-group">
                  <h4 className="psettings-notification-group-title">Theme Settings</h4>
                  
                  <div className="psettings-checkbox-list">
                    <div className="psettings-checkbox-item">
                      <input
                        type="checkbox"
                        className="psettings-checkbox-input"
                        checked={themeSettings.autoSwitch}
                        onChange={handleAutoSwitchToggle}
                        id="auto-theme"
                      />
                      <div className="psettings-checkbox-content">
                        <label className="psettings-checkbox-label" htmlFor="auto-theme">
                          Automatic Theme Switching
                        </label>
                        <p className="psettings-checkbox-description">
                          Automatically switch between light and dark modes based on your system preference
                        </p>
                      </div>
                    </div>
                  </div>

                  {!themeSettings.autoSwitch && (
                    <div className="psettings-form-group" style={{ marginTop: '20px' }}>
                      <label className="psettings-form-label">Manual Theme Selection</label>
                      <div className="psettings-theme-controls">
                        <span className="psettings-theme-label">Light</span>
                        <div className="psettings-theme-toggle-switch">
                          <input
                            type="checkbox"
                            className="psettings-theme-toggle-input"
                            checked={themeSettings.mode === 'dark'}
                            onChange={handleThemeToggle}
                            id="theme-toggle"
                          />
                          <span className="psettings-theme-toggle-slider"></span>
                        </div>
                        <span className="psettings-theme-label">Dark</span>
                      </div>
                    </div>
                  )}

                  <div className="psettings-form-group" style={{ marginTop: '20px' }}>
                    <p className="psettings-form-hint">
                      Current system preference: <strong>{themeSettings.systemPreference}</strong>
                    </p>
                    <p className="psettings-form-hint">
                      Active theme: <strong>{theme}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeSettingsTab === 'notifications' && (
          <div>
            <h3 className="psettings-section-title">
              <Bell size={20} />
              Notification Preferences
            </h3>
            <form onSubmit={handleNotificationSubmit} className="psettings-form">
              <div className="psettings-notification-groups">
                <div className="psettings-notification-group">
                  <h4 className="psettings-notification-group-title">Communication Methods</h4>
                  <div className="psettings-checkbox-list">
                    <div className="psettings-checkbox-item">
                      <input
                        type="checkbox"
                        className="psettings-checkbox-input"
                        checked={notificationSettings.email}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, email: e.target.checked }))}
                        id="email-notifications"
                      />
                      <div className="psettings-checkbox-content">
                        <label className="psettings-checkbox-label" htmlFor="email-notifications">
                          Email Notifications
                        </label>
                        <p className="psettings-checkbox-description">
                          Receive notifications via email
                        </p>
                      </div>
                    </div>

                    <div className="psettings-checkbox-item">
                      <input
                        type="checkbox"
                        className="psettings-checkbox-input"
                        checked={notificationSettings.sms}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, sms: e.target.checked }))}
                        id="sms-notifications"
                      />
                      <div className="psettings-checkbox-content">
                        <label className="psettings-checkbox-label" htmlFor="sms-notifications">
                          SMS Notifications
                        </label>
                        <p className="psettings-checkbox-description">
                          Receive notifications via text message
                        </p>
                      </div>
                    </div>

                    <div className="psettings-checkbox-item">
                      <input
                        type="checkbox"
                        className="psettings-checkbox-input"
                        checked={notificationSettings.push}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, push: e.target.checked }))}
                        id="push-notifications"
                      />
                      <div className="psettings-checkbox-content">
                        <label className="psettings-checkbox-label" htmlFor="push-notifications">
                          Push Notifications
                        </label>
                        <p className="psettings-checkbox-description">
                          Receive push notifications in your browser
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="psettings-notification-group">
                  <h4 className="psettings-notification-group-title">Content Preferences</h4>
                  <div className="psettings-checkbox-list">
                    <div className="psettings-checkbox-item">
                      <input
                        type="checkbox"
                        className="psettings-checkbox-input"
                        checked={notificationSettings.serviceReminders}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, serviceReminders: e.target.checked }))}
                        id="service-reminders"
                      />
                      <div className="psettings-checkbox-content">
                        <label className="psettings-checkbox-label" htmlFor="service-reminders">
                          Service Reminders
                        </label>
                        <p className="psettings-checkbox-description">
                          Reminders about your bookings and services
                        </p>
                      </div>
                    </div>

                    <div className="psettings-checkbox-item">
                      <input
                        type="checkbox"
                        className="psettings-checkbox-input"
                        checked={notificationSettings.listingUpdates}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, listingUpdates: e.target.checked }))}
                        id="listing-updates"
                      />
                      <div className="psettings-checkbox-content">
                        <label className="psettings-checkbox-label" htmlFor="listing-updates">
                          Listing Updates
                        </label>
                        <p className="psettings-checkbox-description">
                          Updates about vehicles and services you're interested in
                        </p>
                      </div>
                    </div>

                    <div className="psettings-checkbox-item">
                      <input
                        type="checkbox"
                        className="psettings-checkbox-input"
                        checked={notificationSettings.priceAlerts}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, priceAlerts: e.target.checked }))}
                        id="price-alerts"
                      />
                      <div className="psettings-checkbox-content">
                        <label className="psettings-checkbox-label" htmlFor="price-alerts">
                          Price Alerts
                        </label>
                        <p className="psettings-checkbox-description">
                          Notifications about price changes and deals
                        </p>
                      </div>
                    </div>

                    <div className="psettings-checkbox-item">
                      <input
                        type="checkbox"
                        className="psettings-checkbox-input"
                        checked={notificationSettings.newsUpdates}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, newsUpdates: e.target.checked }))}
                        id="news-updates"
                      />
                      <div className="psettings-checkbox-content">
                        <label className="psettings-checkbox-label" htmlFor="news-updates">
                          News Updates
                        </label>
                        <p className="psettings-checkbox-description">
                          Latest automotive news and industry updates
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="psettings-notification-group">
                  <h4 className="psettings-notification-group-title">Marketing Communications</h4>
                  <div className="psettings-checkbox-list">
                    <div className="psettings-checkbox-item">
                      <input
                        type="checkbox"
                        className="psettings-checkbox-input"
                        checked={notificationSettings.marketing}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, marketing: e.target.checked }))}
                        id="marketing-notifications"
                      />
                      <div className="psettings-checkbox-content">
                        <label className="psettings-checkbox-label" htmlFor="marketing-notifications">
                          Marketing Communications
                        </label>
                        <p className="psettings-checkbox-description">
                          Promotional offers, newsletters, and marketing updates
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="psettings-form-actions">
                <button 
                  type="submit" 
                  className="psettings-btn psettings-btn-primary"
                  disabled={loading}
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Privacy Settings */}
        {activeSettingsTab === 'privacy' && (
          <div>
            <h3 className="psettings-section-title">
              <Eye size={20} />
              Privacy & Data
            </h3>
            <form onSubmit={handlePrivacySubmit} className="psettings-form">
              <div className="psettings-privacy-groups">
                <div className="psettings-privacy-group">
                  <h4 className="psettings-privacy-group-title">Profile Visibility</h4>
                  <div className="psettings-radio-list">
                    <label className={`psettings-radio-item ${privacySettings.profileVisibility === 'public' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        className="psettings-radio-input"
                        name="profileVisibility"
                        value="public"
                        checked={privacySettings.profileVisibility === 'public'}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                      />
                      <div className="psettings-radio-content">
                        <span className="psettings-radio-label">Public Profile</span>
                        <p className="psettings-radio-description">Anyone can view your profile information</p>
                      </div>
                    </label>

                    <label className={`psettings-radio-item ${privacySettings.profileVisibility === 'contacts' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        className="psettings-radio-input"
                        name="profileVisibility"
                        value="contacts"
                        checked={privacySettings.profileVisibility === 'contacts'}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                      />
                      <div className="psettings-radio-content">
                        <span className="psettings-radio-label">Contacts Only</span>
                        <p className="psettings-radio-description">Only people you've connected with can see your profile</p>
                      </div>
                    </label>

                    <label className={`psettings-radio-item ${privacySettings.profileVisibility === 'private' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        className="psettings-radio-input"
                        name="profileVisibility"
                        value="private"
                        checked={privacySettings.profileVisibility === 'private'}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                      />
                      <div className="psettings-radio-content">
                        <span className="psettings-radio-label">Private Profile</span>
                        <p className="psettings-radio-description">Your profile is hidden from public view</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="psettings-privacy-group">
                  <h4 className="psettings-privacy-group-title">Contact Information</h4>
                  <div className="psettings-checkbox-list">
                    <div className="psettings-checkbox-item">
                      <input
                        type="checkbox"
                        className="psettings-checkbox-input"
                        checked={privacySettings.showEmail}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, showEmail: e.target.checked }))}
                        id="show-email"
                      />
                      <div className="psettings-checkbox-content">
                        <label className="psettings-checkbox-label" htmlFor="show-email">
                          Show Email Address
                        </label>
                        <p className="psettings-checkbox-description">
                          Allow others to see your email address on your profile
                        </p>
                      </div>
                    </div>

                    <div className="psettings-checkbox-item">
                      <input
                        type="checkbox"
                        className="psettings-checkbox-input"
                        checked={privacySettings.showPhone}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, showPhone: e.target.checked }))}
                        id="show-phone"
                      />
                      <div className="psettings-checkbox-content">
                        <label className="psettings-checkbox-label" htmlFor="show-phone">
                          Show Phone Number
                        </label>
                        <p className="psettings-checkbox-description">
                          Allow others to see your phone number on your profile
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="psettings-privacy-group">
                  <h4 className="psettings-privacy-group-title">Communication & Data</h4>
                  <div className="psettings-checkbox-list">
                    <div className="psettings-checkbox-item">
                      <input
                        type="checkbox"
                        className="psettings-checkbox-input"
                        checked={privacySettings.allowMessages}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, allowMessages: e.target.checked }))}
                        id="allow-messages"
                      />
                      <div className="psettings-checkbox-content">
                        <label className="psettings-checkbox-label" htmlFor="allow-messages">
                          Allow Direct Messages
                        </label>
                        <p className="psettings-checkbox-description">
                          Let other users send you direct messages
                        </p>
                      </div>
                    </div>

                    <div className="psettings-checkbox-item">
                      <input
                        type="checkbox"
                        className="psettings-checkbox-input"
                        checked={privacySettings.dataSharing}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, dataSharing: e.target.checked }))}
                        id="data-sharing"
                      />
                      <div className="psettings-checkbox-content">
                        <label className="psettings-checkbox-label" htmlFor="data-sharing">
                          Data Sharing for Analytics
                        </label>
                        <p className="psettings-checkbox-description">
                          Share anonymized data to help improve our services
                        </p>
                      </div>
                    </div>

                    <div className="psettings-checkbox-item">
                      <input
                        type="checkbox"
                        className="psettings-checkbox-input"
                        checked={privacySettings.locationTracking}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, locationTracking: e.target.checked }))}
                        id="location-tracking"
                      />
                      <div className="psettings-checkbox-content">
                        <label className="psettings-checkbox-label" htmlFor="location-tracking">
                          Location Services
                        </label>
                        <p className="psettings-checkbox-description">
                          Allow location tracking for better service recommendations
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="psettings-form-actions">
                <button 
                  type="submit" 
                  className="psettings-btn psettings-btn-primary"
                  disabled={loading}
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save Privacy Settings'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Settings */}
        {activeSettingsTab === 'security' && (
          <div>
            <h3 className="psettings-section-title">
              <Lock size={20} />
              Security & Password
            </h3>
            <div className="psettings-security-form">
              <form onSubmit={handlePasswordSubmit} className="psettings-form">
                <div className="psettings-form-row full-width">
                  <div className="psettings-form-group">
                    <label className="psettings-form-label">Current Password</label>
                    <input
                      type="password"
                      className="psettings-form-input"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="psettings-form-row">
                  <div className="psettings-form-group">
                    <label className="psettings-form-label">New Password</label>
                    <input
                      type="password"
                      className="psettings-form-input"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="psettings-form-group">
                    <label className="psettings-form-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="psettings-form-input"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {passwordData.newPassword && (
                  <div className="psettings-password-requirements">
                    <h4 className="psettings-requirements-title">Password Requirements</h4>
                    <ul className="psettings-requirements-list">
                      <li className={`psettings-requirements-item ${passwordRequirements.length ? 'valid' : ''}`}>
                        <CheckCircle size={12} className="psettings-requirements-icon" />
                        At least 8 characters long
                      </li>
                      <li className={`psettings-requirements-item ${passwordRequirements.uppercase ? 'valid' : ''}`}>
                        <CheckCircle size={12} className="psettings-requirements-icon" />
                        Contains uppercase letter
                      </li>
                      <li className={`psettings-requirements-item ${passwordRequirements.lowercase ? 'valid' : ''}`}>
                        <CheckCircle size={12} className="psettings-requirements-icon" />
                        Contains lowercase letter
                      </li>
                      <li className={`psettings-requirements-item ${passwordRequirements.number ? 'valid' : ''}`}>
                        <CheckCircle size={12} className="psettings-requirements-icon" />
                        Contains a number
                      </li>
                      <li className={`psettings-requirements-item ${passwordRequirements.special ? 'valid' : ''}`}>
                        <CheckCircle size={12} className="psettings-requirements-icon" />
                        Contains special character
                      </li>
                    </ul>
                  </div>
                )}

                <div className="psettings-form-actions">
                  <button 
                    type="submit" 
                    className="psettings-btn psettings-btn-primary"
                    disabled={loading}
                  >
                    <Lock size={16} />
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Account Management */}
        {activeSettingsTab === 'account' && (
          <div>
            <h3 className="psettings-section-title">
              <Settings size={20} />
              Account Management
            </h3>
            
            <div className="psettings-account-info">
              <div className="psettings-account-stat">
                <h4>Account Created</h4>
                <p>{new Date(profileData.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="psettings-account-stat">
                <h4>Last Login</h4>
                <p>{profileData.lastLogin ? new Date(profileData.lastLogin).toLocaleDateString() : 'Unknown'}</p>
              </div>
              <div className="psettings-account-stat">
                <h4>Account Type</h4>
                <p>{profileData.role === 'admin' ? 'Administrator' : 'User Account'}</p>
              </div>
            </div>

            <div className="psettings-danger-zone">
              <h4>
                <AlertCircle size={20} />
                Danger Zone
              </h4>
              <div className="psettings-danger-actions">
                <div className="psettings-danger-item">
                  <div className="psettings-danger-info">
                    <h5>Delete Account</h5>
                    <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                  </div>
                  <button 
                    className="psettings-danger-btn"
                    onClick={handleDeleteAccount}
                    disabled={loading}
                  >
                    <Trash2 size={16} />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
