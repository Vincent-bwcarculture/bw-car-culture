// client/src/components/profile/ProfileSettings.js
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import './ProfileSettings.css';

const ProfileSettings = ({ profileData, refreshProfile }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: profileData?.name || '',
    email: profileData?.email || '',
    phone: profileData?.profile?.phone || '',
    bio: profileData?.profile?.bio || '',
    location: profileData?.profile?.location || '',
    dateOfBirth: profileData?.profile?.dateOfBirth ? 
      new Date(profileData.profile.dateOfBirth).toISOString().split('T')[0] : ''
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: profileData?.profile?.notifications?.emailNotifications !== false,
    pushNotifications: profileData?.profile?.notifications?.pushNotifications !== false,
    serviceUpdates: profileData?.profile?.notifications?.serviceUpdates !== false,
    marketingEmails: profileData?.profile?.notifications?.marketingEmails !== false,
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

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/profile/${profileData._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          profile: {
            ...profileData.profile,
            phone: profileForm.phone,
            bio: profileForm.bio,
            location: profileForm.location,
            dateOfBirth: profileForm.dateOfBirth
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Profile updated successfully');
        if (refreshProfile) refreshProfile();
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage('error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/profile/${profileData._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: {
            ...profileData.profile,
            notifications: notificationSettings
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Notification preferences updated');
        if (refreshProfile) refreshProfile();
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Notification update error:', error);
      showMessage('error', error.message || 'Failed to update notifications');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/profile/${profileData._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: {
            ...profileData.profile,
            privacy: privacySettings
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Privacy settings updated');
        if (refreshProfile) refreshProfile();
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Privacy update error:', error);
      showMessage('error', error.message || 'Failed to update privacy settings');
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

    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        throw new Error(data.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      showMessage('error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Personal Info', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Lock }
  ];

  return (
    <div className="psettings-main-container">
      {/* Header */}
      <div className="psettings-header">
        <h2 className="psettings-title">
          <Settings size={24} />
          Profile Settings
        </h2>
        {/* Theme is now fixed to dark mode, no controls needed */}
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`psettings-message psettings-message-${message.type}`}>
          {message.type === 'success' && <CheckCircle size={16} />}
          {message.type === 'error' && <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {/* Settings Navigation */}
      <div className="psettings-navigation">
        {sections.map(section => {
          const IconComponent = section.icon;
          return (
            <button
              key={section.id}
              className={`psettings-nav-button ${activeSection === section.id ? 'psettings-nav-active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <IconComponent size={18} />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Settings Content */}
      <div className="psettings-content">
        {/* Personal Information */}
        {activeSection === 'profile' && (
          <div className="psettings-section">
            <div className="psettings-section-header">
              <h3>Personal Information</h3>
              <p>Update your personal details and contact information</p>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="psettings-form">
              <div className="psettings-form-row">
                <div className="psettings-form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="psettings-input-group">
                    <User size={18} />
                    <input
                      id="name"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      placeholder="Enter your full name"
                      className="psettings-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="psettings-form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="psettings-input-group">
                    <Mail size={18} />
                    <input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                      placeholder="Enter your email"
                      className="psettings-form-input"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="psettings-form-row">
                <div className="psettings-form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <div className="psettings-input-group">
                    <Phone size={18} />
                    <input
                      id="phone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      placeholder="Enter your phone number"
                      className="psettings-form-input"
                    />
                  </div>
                </div>

                <div className="psettings-form-group">
                  <label htmlFor="location">Location</label>
                  <div className="psettings-input-group">
                    <MapPin size={18} />
                    <input
                      id="location"
                      type="text"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                      placeholder="Enter your location"
                      className="psettings-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="psettings-form-row">
                <div className="psettings-form-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <div className="psettings-input-group">
                    <Calendar size={18} />
                    <input
                      id="dateOfBirth"
                      type="date"
                      value={profileForm.dateOfBirth}
                      onChange={(e) => setProfileForm({...profileForm, dateOfBirth: e.target.value})}
                      className="psettings-form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="psettings-form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                  placeholder="Tell us about yourself..."
                  className="psettings-form-textarea"
                  rows="4"
                />
              </div>

              <button 
                type="submit" 
                className="psettings-btn psettings-btn-primary"
                disabled={loading}
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Notification Settings */}
        {activeSection === 'notifications' && (
          <div className="psettings-section">
            <div className="psettings-section-header">
              <h3>Notification Preferences</h3>
              <p>Choose how you want to be notified about updates and activities</p>
            </div>
            
            <form onSubmit={handleNotificationSubmit} className="psettings-form">
              <div className="psettings-toggle-grid">
                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <h4>Email Notifications</h4>
                    <p>Receive notifications via email</p>
                  </div>
                  <label className="psettings-toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: e.target.checked
                      })}
                    />
                    <span className="psettings-toggle-slider"></span>
                  </label>
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <h4>Push Notifications</h4>
                    <p>Receive push notifications on your devices</p>
                  </div>
                  <label className="psettings-toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        pushNotifications: e.target.checked
                      })}
                    />
                    <span className="psettings-toggle-slider"></span>
                  </label>
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <h4>Service Updates</h4>
                    <p>Get notified about service updates and changes</p>
                  </div>
                  <label className="psettings-toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationSettings.serviceUpdates}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        serviceUpdates: e.target.checked
                      })}
                    />
                    <span className="psettings-toggle-slider"></span>
                  </label>
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <h4>Marketing Emails</h4>
                    <p>Receive promotional emails and offers</p>
                  </div>
                  <label className="psettings-toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationSettings.marketingEmails}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        marketingEmails: e.target.checked
                      })}
                    />
                    <span className="psettings-toggle-slider"></span>
                  </label>
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <h4>Price Alerts</h4>
                    <p>Get notified about price changes and deals</p>
                  </div>
                  <label className="psettings-toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationSettings.priceAlerts}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        priceAlerts: e.target.checked
                      })}
                    />
                    <span className="psettings-toggle-slider"></span>
                  </label>
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <h4>News Updates</h4>
                    <p>Receive updates about automotive news</p>
                  </div>
                  <label className="psettings-toggle-switch">
                    <input
                      type="checkbox"
                      checked={notificationSettings.newsUpdates}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        newsUpdates: e.target.checked
                      })}
                    />
                    <span className="psettings-toggle-slider"></span>
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                className="psettings-btn psettings-btn-primary"
                disabled={loading}
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </div>
        )}

        {/* Privacy Settings */}
        {activeSection === 'privacy' && (
          <div className="psettings-section">
            <div className="psettings-section-header">
              <h3>Privacy Settings</h3>
              <p>Control your privacy and data sharing preferences</p>
            </div>
            
            <form onSubmit={handlePrivacySubmit} className="psettings-form">
              <div className="psettings-form-group">
                <label htmlFor="profileVisibility">Profile Visibility</label>
                <select
                  id="profileVisibility"
                  value={privacySettings.profileVisibility}
                  onChange={(e) => setPrivacySettings({
                    ...privacySettings,
                    profileVisibility: e.target.value
                  })}
                  className="psettings-form-select"
                >
                  <option value="public">Public - Visible to everyone</option>
                  <option value="private">Private - Only visible to you</option>
                  <option value="contacts">Contacts Only - Visible to your contacts</option>
                </select>
              </div>

              <div className="psettings-toggle-grid">
                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <h4>Show Email Address</h4>
                    <p>Display your email on your public profile</p>
                  </div>
                  <label className="psettings-toggle-switch">
                    <input
                      type="checkbox"
                      checked={privacySettings.showEmail}
                      onChange={(e) => setPrivacySettings({
                        ...privacySettings,
                        showEmail: e.target.checked
                      })}
                    />
                    <span className="psettings-toggle-slider"></span>
                  </label>
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <h4>Show Phone Number</h4>
                    <p>Display your phone number on your public profile</p>
                  </div>
                  <label className="psettings-toggle-switch">
                    <input
                      type="checkbox"
                      checked={privacySettings.showPhone}
                      onChange={(e) => setPrivacySettings({
                        ...privacySettings,
                        showPhone: e.target.checked
                      })}
                    />
                    <span className="psettings-toggle-slider"></span>
                  </label>
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <h4>Allow Messages</h4>
                    <p>Allow other users to send you messages</p>
                  </div>
                  <label className="psettings-toggle-switch">
                    <input
                      type="checkbox"
                      checked={privacySettings.allowMessages}
                      onChange={(e) => setPrivacySettings({
                        ...privacySettings,
                        allowMessages: e.target.checked
                      })}
                    />
                    <span className="psettings-toggle-slider"></span>
                  </label>
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <h4>Data Sharing</h4>
                    <p>Allow sharing of anonymized data for service improvement</p>
                  </div>
                  <label className="psettings-toggle-switch">
                    <input
                      type="checkbox"
                      checked={privacySettings.dataSharing}
                      onChange={(e) => setPrivacySettings({
                        ...privacySettings,
                        dataSharing: e.target.checked
                      })}
                    />
                    <span className="psettings-toggle-slider"></span>
                  </label>
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <h4>Location Tracking</h4>
                    <p>Allow location tracking for location-based services</p>
                  </div>
                  <label className="psettings-toggle-switch">
                    <input
                      type="checkbox"
                      checked={privacySettings.locationTracking}
                      onChange={(e) => setPrivacySettings({
                        ...privacySettings,
                        locationTracking: e.target.checked
                      })}
                    />
                    <span className="psettings-toggle-slider"></span>
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                className="psettings-btn psettings-btn-primary"
                disabled={loading}
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Privacy Settings'}
              </button>
            </form>
          </div>
        )}

        {/* Security Settings */}
        {activeSection === 'security' && (
          <div className="psettings-section">
            <div className="psettings-section-header">
              <h3>Security Settings</h3>
              <p>Manage your account security and password</p>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="psettings-form">
              <div className="psettings-form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="psettings-input-group">
                  <Lock size={18} />
                  <input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value
                    })}
                    placeholder="Enter current password"
                    className="psettings-form-input"
                    required
                  />
                </div>
              </div>

              <div className="psettings-form-row">
                <div className="psettings-form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="psettings-input-group">
                    <Lock size={18} />
                    <input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value
                      })}
                      placeholder="Enter new password"
                      className="psettings-form-input"
                      required
                    />
                  </div>
                </div>

                <div className="psettings-form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="psettings-input-group">
                    <Lock size={18} />
                    <input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value
                      })}
                      placeholder="Confirm new password"
                      className="psettings-form-input"
                      required
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="psettings-btn psettings-btn-primary"
                disabled={loading}
              >
                <Lock size={16} />
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
