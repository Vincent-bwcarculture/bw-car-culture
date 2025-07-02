// client/src/components/profile/ProfileSettings.js
import React, { useState } from 'react';
import { 
  Settings, Bell, Lock, Eye, CreditCard, Users, 
  Shield, Smartphone, Mail, Globe, Save, 
  AlertCircle, CheckCircle, Camera, Trash2
} from 'lucide-react';
import axios from '../../config/axios.js';

const ProfileSettings = ({ profileData, refreshProfile }) => {
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

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleGeneralSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.put('/user/profile/basic', generalSettings);
      
      if (response.data.success) {
        await refreshProfile();
        showMessage('success', 'General settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating general settings:', error);
      showMessage('error', 'Failed to update general settings');
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
        await refreshProfile();
        showMessage('success', 'Address updated successfully');
      }
    } catch (error) {
      console.error('Error updating address:', error);
      showMessage('error', 'Failed to update address');
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
        await refreshProfile();
        showMessage('success', 'Notification preferences updated');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      showMessage('error', 'Failed to update notification preferences');
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
        await refreshProfile();
        showMessage('success', 'Privacy settings updated');
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      showMessage('error', 'Failed to update privacy settings');
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

    try {
      setLoading(true);
      const response = await axios.put('/user/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showMessage('success', 'Password updated successfully');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      showMessage('error', error.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = 'DELETE';
    const userInput = prompt(
      `This action cannot be undone. All your data will be permanently deleted.\n\nType "${confirmText}" to confirm deletion:`
    );
    
    if (userInput !== confirmText) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete('/user/profile/delete-account');
      
      if (response.data.success) {
        alert('Account deleted successfully. You will be logged out.');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showMessage('error', 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const settingsTabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'account', label: 'Account', icon: Users }
  ];

  return (
    <div className="settings-tab">
      <div className="tab-header">
        <h2><Settings size={24} /> Account Settings</h2>
        <p>Manage your account preferences and security</p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`settings-message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Settings Navigation */}
      <div className="settings-nav">
        {settingsTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`settings-nav-btn ${activeSettingsTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveSettingsTab(tab.id)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Content */}
      <div className="settings-content">
        {/* General Settings */}
        {activeSettingsTab === 'general' && (
          <div className="settings-section">
            <h3>General Information</h3>
            <form onSubmit={handleGeneralSettingsSubmit} className="settings-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={generalSettings.name}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={generalSettings.email}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    value={generalSettings.phone}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+267 xxxxxxxx"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    value={generalSettings.dateOfBirth}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={generalSettings.bio}
                  onChange={(e) => setGeneralSettings(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="language">Language</label>
                  <select
                    id="language"
                    value={generalSettings.language}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, language: e.target.value }))}
                  >
                    <option value="en">English</option>
                    <option value="tn">Setswana</option>
                    <option value="af">Afrikaans</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="currency">Preferred Currency</label>
                  <select
                    id="currency"
                    value={generalSettings.currency}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    <option value="BWP">BWP (Pula)</option>
                    <option value="USD">USD</option>
                    <option value="ZAR">ZAR (Rand)</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* Address Section */}
              <h4>Address Information</h4>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    value={addressSettings.city}
                    onChange={(e) => setAddressSettings(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g., Gaborone"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="state">District/State</label>
                  <input
                    type="text"
                    id="state"
                    value={addressSettings.state}
                    onChange={(e) => setAddressSettings(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="e.g., South East District"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="street">Street Address</label>
                <input
                  type="text"
                  id="street"
                  value={addressSettings.street}
                  onChange={(e) => setAddressSettings(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Enter your street address"
                />
              </div>

              <button type="submit" className="settings-save-btn" disabled={loading}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Notification Settings */}
        {activeSettingsTab === 'notifications' && (
          <div className="settings-section">
            <h3>Notification Preferences</h3>
            <form onSubmit={handleNotificationSubmit} className="settings-form">
              <div className="notification-groups">
                <div className="notification-group">
                  <h4>Communication Channels</h4>
                  <div className="checkbox-list">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={notificationSettings.email}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, email: e.target.checked }))}
                      />
                      <div className="checkbox-content">
                        <Mail size={16} />
                        <div>
                          <span className="checkbox-label">Email Notifications</span>
                          <p>Receive notifications via email</p>
                        </div>
                      </div>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={notificationSettings.sms}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, sms: e.target.checked }))}
                      />
                      <div className="checkbox-content">
                        <Smartphone size={16} />
                        <div>
                          <span className="checkbox-label">SMS Notifications</span>
                          <p>Receive notifications via SMS</p>
                        </div>
                      </div>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={notificationSettings.push}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, push: e.target.checked }))}
                      />
                      <div className="checkbox-content">
                        <Bell size={16} />
                        <div>
                          <span className="checkbox-label">Push Notifications</span>
                          <p>Receive browser push notifications</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="notification-group">
                  <h4>Content Preferences</h4>
                  <div className="checkbox-list">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={notificationSettings.serviceReminders}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, serviceReminders: e.target.checked }))}
                      />
                      <div className="checkbox-content">
                        <Settings size={16} />
                        <div>
                          <span className="checkbox-label">Service Reminders</span>
                          <p>Vehicle service and maintenance reminders</p>
                        </div>
                      </div>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={notificationSettings.listingUpdates}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, listingUpdates: e.target.checked }))}
                      />
                      <div className="checkbox-content">
                        <Eye size={16} />
                        <div>
                          <span className="checkbox-label">Listing Updates</span>
                          <p>Updates on your vehicles and listings</p>
                        </div>
                      </div>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={notificationSettings.priceAlerts}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, priceAlerts: e.target.checked }))}
                      />
                      <div className="checkbox-content">
                        <CreditCard size={16} />
                        <div>
                          <span className="checkbox-label">Price Alerts</span>
                          <p>Alerts for price changes on favorites</p>
                        </div>
                      </div>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={notificationSettings.marketing}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, marketing: e.target.checked }))}
                      />
                      <div className="checkbox-content">
                        <Globe size={16} />
                        <div>
                          <span className="checkbox-label">Marketing & News</span>
                          <p>Industry news and promotional offers</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" className="settings-save-btn" disabled={loading}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          </div>
        )}

        {/* Privacy Settings */}
        {activeSettingsTab === 'privacy' && (
          <div className="settings-section">
            <h3>Privacy & Data</h3>
            <form onSubmit={handlePrivacySubmit} className="settings-form">
              <div className="privacy-groups">
                <div className="privacy-group">
                  <h4>Profile Visibility</h4>
                  <div className="radio-list">
                    <label className="radio-item">
                      <input
                        type="radio"
                        name="profileVisibility"
                        value="public"
                        checked={privacySettings.profileVisibility === 'public'}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                      />
                      <div className="radio-content">
                        <div>
                          <span className="radio-label">Public Profile</span>
                          <p>Anyone can view your profile information</p>
                        </div>
                      </div>
                    </label>

                    <label className="radio-item">
                      <input
                        type="radio"
                        name="profileVisibility"
                        value="contacts"
                        checked={privacySettings.profileVisibility === 'contacts'}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                      />
                      <div className="radio-content">
                        <div>
                          <span className="radio-label">Contacts Only</span>
                          <p>Only people you've interacted with can see your profile</p>
                        </div>
                      </div>
                    </label>

                    <label className="radio-item">
                      <input
                        type="radio"
                        name="profileVisibility"
                        value="private"
                        checked={privacySettings.profileVisibility === 'private'}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                      />
                      <div className="radio-content">
                        <div>
                          <span className="radio-label">Private Profile</span>
                          <p>Your profile is hidden from other users</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="privacy-group">
                  <h4>Contact Information</h4>
                  <div className="checkbox-list">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={privacySettings.showEmail}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, showEmail: e.target.checked }))}
                      />
                      <div className="checkbox-content">
                        <Mail size={16} />
                        <div>
                          <span className="checkbox-label">Show Email Address</span>
                          <p>Allow others to see your email address</p>
                        </div>
                      </div>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={privacySettings.showPhone}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, showPhone: e.target.checked }))}
                      />
                      <div className="checkbox-content">
                        <Smartphone size={16} />
                        <div>
                          <span className="checkbox-label">Show Phone Number</span>
                          <p>Allow others to see your phone number</p>
                        </div>
                      </div>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={privacySettings.allowMessages}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, allowMessages: e.target.checked }))}
                      />
                      <div className="checkbox-content">
                        <Users size={16} />
                        <div>
                          <span className="checkbox-label">Allow Direct Messages</span>
                          <p>Let other users send you direct messages</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="privacy-group">
                  <h4>Data & Tracking</h4>
                  <div className="checkbox-list">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={privacySettings.dataSharing}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, dataSharing: e.target.checked }))}
                      />
                      <div className="checkbox-content">
                        <Globe size={16} />
                        <div>
                          <span className="checkbox-label">Analytics Data Sharing</span>
                          <p>Share anonymized usage data to improve services</p>
                        </div>
                      </div>
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={privacySettings.locationTracking}
                        onChange={(e) => setPrivacySettings(prev => ({ ...prev, locationTracking: e.target.checked }))}
                      />
                      <div className="checkbox-content">
                        <Eye size={16} />
                        <div>
                          <span className="checkbox-label">Location Services</span>
                          <p>Allow location-based features and recommendations</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" className="settings-save-btn" disabled={loading}>
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Privacy Settings'}
              </button>
            </form>
          </div>
        )}

        {/* Security Settings */}
        {activeSettingsTab === 'security' && (
          <div className="settings-section">
            <h3>Security & Password</h3>
            <form onSubmit={handlePasswordSubmit} className="settings-form">
              <div className="password-section">
                <h4>Change Password</h4>
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="password-requirements">
                  <h5>Password Requirements:</h5>
                  <ul>
                    <li>At least 6 characters long</li>
                    <li>Include uppercase and lowercase letters</li>
                    <li>Include at least one number</li>
                    <li>Include at least one special character</li>
                  </ul>
                </div>

                <button type="submit" className="settings-save-btn" disabled={loading}>
                  <Lock size={16} />
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Account Management */}
        {activeSettingsTab === 'account' && (
          <div className="settings-section">
            <h3>Account Management</h3>
            
            <div className="account-info">
              <div className="account-stat">
                <h4>Account Created</h4>
                <p>{new Date(profileData.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="account-stat">
                <h4>Last Login</h4>
                <p>{profileData.lastLogin ? new Date(profileData.lastLogin).toLocaleDateString() : 'Unknown'}</p>
              </div>
              <div className="account-stat">
                <h4>Account Type</h4>
                <p>{profileData.role === 'admin' ? 'Administrator' : 'User Account'}</p>
              </div>
            </div>

            <div className="danger-zone">
              <h4>Danger Zone</h4>
              <div className="danger-actions">
                <div className="danger-item">
                  <div className="danger-info">
                    <h5>Delete Account</h5>
                    <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                  </div>
                  <button 
                    className="danger-btn"
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
