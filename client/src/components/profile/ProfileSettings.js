// client/src/components/profile/ProfileSettings.js - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Eye, 
  Globe,
  EyeOff, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import axios from '../../config/axios.js';
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
      new Date(profileData.profile.dateOfBirth).toISOString().split('T')[0] : '',
    firstName: profileData?.profile?.firstName || '',
    lastName: profileData?.profile?.lastName || '',
    gender: profileData?.profile?.gender || '',
    nationality: profileData?.profile?.nationality || '',
    website: profileData?.profile?.website || '',
    language: profileData?.profile?.language || 'en',
    currency: profileData?.profile?.currency || 'USD',
    timezone: profileData?.profile?.timezone || 'UTC'
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

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: profileData?.profile?.privacy?.profileVisibility || 'public',
    showEmail: profileData?.profile?.privacy?.showEmail !== false,
    showPhone: profileData?.profile?.privacy?.showPhone !== false,
    allowMessages: profileData?.profile?.privacy?.allowMessages !== false,
    dataSharing: profileData?.profile?.privacy?.dataSharing !== false,
    locationTracking: profileData?.profile?.privacy?.locationTracking !== false
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Update form state when profileData changes
  useEffect(() => {
    if (profileData) {
      setProfileForm({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.profile?.phone || '',
        bio: profileData.profile?.bio || '',
        location: profileData.profile?.location || '',
        dateOfBirth: profileData.profile?.dateOfBirth ? 
          new Date(profileData.profile.dateOfBirth).toISOString().split('T')[0] : '',
        firstName: profileData.profile?.firstName || '',
        lastName: profileData.profile?.lastName || '',
        gender: profileData.profile?.gender || '',
        nationality: profileData.profile?.nationality || '',
        website: profileData.profile?.website || '',
        language: profileData.profile?.language || 'en',
        currency: profileData.profile?.currency || 'USD',
        timezone: profileData.profile?.timezone || 'UTC'
      });

      setNotificationSettings({
        emailNotifications: profileData.profile?.notifications?.emailNotifications !== false,
        pushNotifications: profileData.profile?.notifications?.pushNotifications !== false,
        serviceUpdates: profileData.profile?.notifications?.serviceUpdates !== false,
        marketingEmails: profileData.profile?.notifications?.marketingEmails !== false,
        priceAlerts: profileData.profile?.notifications?.priceAlerts !== false,
        newsUpdates: profileData.profile?.notifications?.newsUpdates !== false
      });

      setPrivacySettings({
        profileVisibility: profileData.profile?.privacy?.profileVisibility || 'public',
        showEmail: profileData.profile?.privacy?.showEmail !== false,
        showPhone: profileData.profile?.privacy?.showPhone !== false,
        allowMessages: profileData.profile?.privacy?.allowMessages !== false,
        dataSharing: profileData.profile?.privacy?.dataSharing !== false,
        locationTracking: profileData.profile?.privacy?.locationTracking !== false
      });
    }
  }, [profileData]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // FIXED: Handle basic profile update - use correct endpoint
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare the update data with nested profile fields
      const updateData = {
        name: profileForm.name,
        'profile.firstName': profileForm.firstName,
        'profile.lastName': profileForm.lastName,
        'profile.phone': profileForm.phone,
        'profile.bio': profileForm.bio,
        'profile.location': profileForm.location,
        'profile.dateOfBirth': profileForm.dateOfBirth,
        'profile.gender': profileForm.gender,
        'profile.nationality': profileForm.nationality,
        'profile.website': profileForm.website,
        'profile.language': profileForm.language,
        'profile.currency': profileForm.currency,
        'profile.timezone': profileForm.timezone
      };

      // Use the correct endpoint that matches backend routes
      const response = await axios.put('/user/profile/basic', updateData);

      if (response.data.success) {
        showMessage('success', 'Profile updated successfully');
        if (refreshProfile) refreshProfile();
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage('error', error.response?.data?.message || error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Handle notification settings update
  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put('/user/profile/notifications', notificationSettings);

      if (response.data.success) {
        showMessage('success', 'Notification preferences updated');
        if (refreshProfile) refreshProfile();
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Notification update error:', error);
      showMessage('error', error.response?.data?.message || error.message || 'Failed to update notifications');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Handle privacy settings update
  const handlePrivacySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put('/user/profile/privacy', privacySettings);

      if (response.data.success) {
        showMessage('success', 'Privacy settings updated');
        if (refreshProfile) refreshProfile();
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Privacy update error:', error);
      showMessage('error', error.response?.data?.message || error.message || 'Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Handle password update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.put('/user/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        showMessage('success', 'Password updated successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Password update error:', error);
      showMessage('error', error.response?.data?.message || error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'password', label: 'Password', icon: Lock }
  ];

  return (
    <div className="psettings-container">
      {/* Success/Error Messages */}
      {message.text && (
        <div className={`psettings-message psettings-message-${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Settings Navigation */}
      <div className="psettings-nav">
        {sections.map(section => {
          const IconComponent = section.icon;
          return (
            <button
              key={section.id}
              className={`psettings-nav-item ${activeSection === section.id ? 
                'psettings-nav-active' : ''}`}
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
                  <label htmlFor="name">Display Name</label>
                  <div className="psettings-input-group">
                    <User size={18} />
                    <input
                      id="name"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      placeholder="Enter your display name"
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
                      disabled
                    />
                  </div>
                  <small className="psettings-form-note">Email cannot be changed</small>
                </div>
              </div>

              <div className="psettings-form-row">
                <div className="psettings-form-group">
                  <label htmlFor="firstName">First Name</label>
                  <div className="psettings-input-group">
                    <User size={18} />
                    <input
                      id="firstName"
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({...profileForm, firstName: e.target.value})}
                      placeholder="Enter your first name"
                      className="psettings-form-input"
                    />
                  </div>
                </div>

                <div className="psettings-form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <div className="psettings-input-group">
                    <User size={18} />
                    <input
                      id="lastName"
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({...profileForm, lastName: e.target.value})}
                      placeholder="Enter your last name"
                      className="psettings-form-input"
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

                <div className="psettings-form-group">
                  <label htmlFor="gender">Gender</label>
                  <div className="psettings-input-group">
                    <User size={18} />
                    <select
                      id="gender"
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({...profileForm, gender: e.target.value})}
                      className="psettings-form-select"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
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
                  maxLength="500"
                />
                <small className="psettings-form-note">
                  {profileForm.bio.length}/500 characters
                </small>
              </div>

              <div className="psettings-form-row">
                <div className="psettings-form-group">
                  <label htmlFor="website">Website</label>
                  <div className="psettings-input-group">
                    <Globe size={18} />
                    <input
                      id="website"
                      type="url"
                      value={profileForm.website}
                      onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                      placeholder="https://yourwebsite.com"
                      className="psettings-form-input"
                    />
                  </div>
                </div>

                <div className="psettings-form-group">
                  <label htmlFor="nationality">Nationality</label>
                  <div className="psettings-input-group">
                    <MapPin size={18} />
                    <input
                      id="nationality"
                      type="text"
                      value={profileForm.nationality}
                      onChange={(e) => setProfileForm({...profileForm, nationality: e.target.value})}
                      placeholder="Enter your nationality"
                      className="psettings-form-input"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="psettings-btn psettings-btn-primary"
                disabled={loading}
              >
                <Save size={16} />
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        )}

        {/* Notification Settings */}
        {activeSection === 'notifications' && (
          <div className="psettings-section">
            <div className="psettings-section-header">
              <h3>Notification Preferences</h3>
              <p>Choose how you want to receive notifications</p>
            </div>
            
            <form onSubmit={handleNotificationSubmit} className="psettings-form">
              <div className="psettings-toggle-group">
                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <label htmlFor="emailNotifications">Email Notifications</label>
                    <p>Receive notifications via email</p>
                  </div>
                  <input
                    id="emailNotifications"
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings, 
                      emailNotifications: e.target.checked
                    })}
                    className="psettings-toggle"
                  />
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <label htmlFor="pushNotifications">Push Notifications</label>
                    <p>Receive push notifications in your browser</p>
                  </div>
                  <input
                    id="pushNotifications"
                    type="checkbox"
                    checked={notificationSettings.pushNotifications}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings, 
                      pushNotifications: e.target.checked
                    })}
                    className="psettings-toggle"
                  />
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <label htmlFor="serviceUpdates">Service Updates</label>
                    <p>Get notified about service updates and announcements</p>
                  </div>
                  <input
                    id="serviceUpdates"
                    type="checkbox"
                    checked={notificationSettings.serviceUpdates}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings, 
                      serviceUpdates: e.target.checked
                    })}
                    className="psettings-toggle"
                  />
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <label htmlFor="priceAlerts">Price Alerts</label>
                    <p>Get notified when prices change for items you're watching</p>
                  </div>
                  <input
                    id="priceAlerts"
                    type="checkbox"
                    checked={notificationSettings.priceAlerts}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings, 
                      priceAlerts: e.target.checked
                    })}
                    className="psettings-toggle"
                  />
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <label htmlFor="marketingEmails">Marketing Emails</label>
                    <p>Receive promotional emails and special offers</p>
                  </div>
                  <input
                    id="marketingEmails"
                    type="checkbox"
                    checked={notificationSettings.marketingEmails}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings, 
                      marketingEmails: e.target.checked
                    })}
                    className="psettings-toggle"
                  />
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <label htmlFor="newsUpdates">News Updates</label>
                    <p>Stay updated with the latest news and articles</p>
                  </div>
                  <input
                    id="newsUpdates"
                    type="checkbox"
                    checked={notificationSettings.newsUpdates}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings, 
                      newsUpdates: e.target.checked
                    })}
                    className="psettings-toggle"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="psettings-btn psettings-btn-primary"
                disabled={loading}
              >
                <Save size={16} />
                {loading ? 'Updating...' : 'Update Notifications'}
              </button>
            </form>
          </div>
        )}

        {/* Privacy Settings */}
        {activeSection === 'privacy' && (
          <div className="psettings-section">
            <div className="psettings-section-header">
              <h3>Privacy Settings</h3>
              <p>Control who can see your information</p>
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
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="friends">Friends Only</option>
                </select>
              </div>

              <div className="psettings-toggle-group">
                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <label htmlFor="showEmail">Show Email Address</label>
                    <p>Allow others to see your email address</p>
                  </div>
                  <input
                    id="showEmail"
                    type="checkbox"
                    checked={privacySettings.showEmail}
                    onChange={(e) => setPrivacySettings({
                      ...privacySettings, 
                      showEmail: e.target.checked
                    })}
                    className="psettings-toggle"
                  />
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <label htmlFor="showPhone">Show Phone Number</label>
                    <p>Allow others to see your phone number</p>
                  </div>
                  <input
                    id="showPhone"
                    type="checkbox"
                    checked={privacySettings.showPhone}
                    onChange={(e) => setPrivacySettings({
                      ...privacySettings, 
                      showPhone: e.target.checked
                    })}
                    className="psettings-toggle"
                  />
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <label htmlFor="allowMessages">Allow Messages</label>
                    <p>Allow others to send you messages</p>
                  </div>
                  <input
                    id="allowMessages"
                    type="checkbox"
                    checked={privacySettings.allowMessages}
                    onChange={(e) => setPrivacySettings({
                      ...privacySettings, 
                      allowMessages: e.target.checked
                    })}
                    className="psettings-toggle"
                  />
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <label htmlFor="dataSharing">Data Sharing</label>
                    <p>Allow sharing your data with third parties</p>
                  </div>
                  <input
                    id="dataSharing"
                    type="checkbox"
                    checked={privacySettings.dataSharing}
                    onChange={(e) => setPrivacySettings({
                      ...privacySettings, 
                      dataSharing: e.target.checked
                    })}
                    className="psettings-toggle"
                  />
                </div>

                <div className="psettings-toggle-item">
                  <div className="psettings-toggle-content">
                    <label htmlFor="locationTracking">Location Tracking</label>
                    <p>Allow location tracking for better service</p>
                  </div>
                  <input
                    id="locationTracking"
                    type="checkbox"
                    checked={privacySettings.locationTracking}
                    onChange={(e) => setPrivacySettings({
                      ...privacySettings, 
                      locationTracking: e.target.checked
                    })}
                    className="psettings-toggle"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="psettings-btn psettings-btn-primary"
                disabled={loading}
              >
                <Save size={16} />
                {loading ? 'Updating...' : 'Update Privacy Settings'}
              </button>
            </form>
          </div>
        )}

        {/* Password Settings */}
        {activeSection === 'password' && (
          <div className="psettings-section">
            <div className="psettings-section-header">
              <h3>Change Password</h3>
              <p>Update your account password</p>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="psettings-form">
              <div className="psettings-form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="psettings-input-group">
                  <Lock size={18} />
                  <input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData, 
                      currentPassword: e.target.value
                    })}
                    placeholder="Enter current password"
                    className="psettings-form-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({
                      ...showPasswords, 
                      current: !showPasswords.current
                    })}
                    className="psettings-password-toggle"
                  >
                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="psettings-form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="psettings-input-group">
                  <Lock size={18} />
                  <input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData, 
                      newPassword: e.target.value
                    })}
                    placeholder="Enter new password"
                    className="psettings-form-input"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({
                      ...showPasswords, 
                      new: !showPasswords.new
                    })}
                    className="psettings-password-toggle"
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="psettings-form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="psettings-input-group">
                  <Lock size={18} />
                  <input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData, 
                      confirmPassword: e.target.value
                    })}
                    placeholder="Confirm new password"
                    className="psettings-form-input"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({
                      ...showPasswords, 
                      confirm: !showPasswords.confirm
                    })}
                    className="psettings-password-toggle"
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="psettings-btn psettings-btn-primary"
                disabled={loading}
              >
                <Save size={16} />
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
