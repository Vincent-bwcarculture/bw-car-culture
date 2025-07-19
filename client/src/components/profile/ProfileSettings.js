// client/src/components/profile/ProfileSettings.js - Complete Fixed Implementation
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Bell,
  Shield,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import './ProfileSettings.css';

const ProfileSettings = ({ profileData, refreshProfile }) => {
  const { user, setUser } = useAuth();
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
    website: profileData?.profile?.website || ''
  });

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    email: profileData?.profile?.notifications?.email !== false,
    push: profileData?.profile?.notifications?.push !== false,
    marketing: profileData?.profile?.notifications?.marketing !== false,
    serviceReminders: profileData?.profile?.notifications?.serviceReminders !== false,
    listingUpdates: profileData?.profile?.notifications?.listingUpdates !== false,
    priceAlerts: profileData?.profile?.notifications?.priceAlerts !== false,
    newsUpdates: profileData?.profile?.notifications?.newsUpdates !== false
  });

  // Privacy form state
  const [privacyForm, setPrivacyForm] = useState({
    profileVisibility: profileData?.profile?.privacy?.profileVisibility || 'public',
    showEmail: profileData?.profile?.privacy?.showEmail !== false,
    showPhone: profileData?.profile?.privacy?.showPhone !== false,
    allowMessages: profileData?.profile?.privacy?.allowMessages !== false,
    dataSharing: profileData?.profile?.privacy?.dataSharing !== false,
    locationTracking: profileData?.profile?.privacy?.locationTracking !== false
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Update form states when profileData changes
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
        website: profileData.profile?.website || ''
      });

      setNotificationForm({
        email: profileData.profile?.notifications?.email !== false,
        push: profileData.profile?.notifications?.push !== false,
        marketing: profileData.profile?.notifications?.marketing !== false,
        serviceReminders: profileData.profile?.notifications?.serviceReminders !== false,
        listingUpdates: profileData.profile?.notifications?.listingUpdates !== false,
        priceAlerts: profileData.profile?.notifications?.priceAlerts !== false,
        newsUpdates: profileData.profile?.notifications?.newsUpdates !== false
      });

      setPrivacyForm({
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

  // FIXED: Handle Profile Updates - Uses production URL like working image uploads
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Profile update data:', profileForm);

      // FIXED: Use production URL like working image uploads
      const response = await fetch('https://bw-car-culture-api.vercel.app/user/profile/basic', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: profileForm.name,
          'profile.firstName': profileForm.firstName,
          'profile.lastName': profileForm.lastName,
          'profile.phone': profileForm.phone,
          'profile.bio': profileForm.bio,
          'profile.location': profileForm.location,
          'profile.dateOfBirth': profileForm.dateOfBirth,
          'profile.gender': profileForm.gender,
          'profile.nationality': profileForm.nationality,
          'profile.website': profileForm.website
        })
      });

      console.log('Profile update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile update error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('Profile update successful:', result.data);
        
        if (refreshProfile) {
          refreshProfile();
        }
        
        if (user && setUser && result.data) {
          setUser({
            ...user,
            name: result.data.name,
            profile: result.data.profile
          });
        }
        
        showMessage('success', 'Profile updated successfully! ✨');
      } else {
        showMessage('error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage('error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Handle Notification Updates - Uses production URL like working image uploads
  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FIXED: Use production URL like working image uploads
      const response = await fetch('https://bw-car-culture-api.vercel.app/user/profile/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(notificationForm)
      });

      const result = await response.json();

      if (result.success) {
        if (refreshProfile) {
          refreshProfile();
        }
        showMessage('success', 'Notification preferences updated! ✨');
      } else {
        showMessage('error', result.message || 'Failed to update notifications');
      }
    } catch (error) {
      console.error('Notification update error:', error);
      showMessage('error', 'Failed to update notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Handle Privacy Updates - Uses production URL like working image uploads
  const handlePrivacySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FIXED: Use production URL like working image uploads
      const response = await fetch('https://bw-car-culture-api.vercel.app/user/profile/privacy', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(privacyForm)
      });

      const result = await response.json();

      if (result.success) {
        if (refreshProfile) {
          refreshProfile();
        }
        showMessage('success', 'Privacy settings updated! ✨');
      } else {
        showMessage('error', result.message || 'Failed to update privacy settings');
      }
    } catch (error) {
      console.error('Privacy update error:', error);
      showMessage('error', 'Failed to update privacy settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Handle Password Updates - Uses production URL like working image uploads
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // FIXED: Use production URL like working image uploads
      const response = await fetch('https://bw-car-culture-api.vercel.app/user/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const result = await response.json();

      if (result.success) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        showMessage('success', 'Password updated successfully! ✨');
      } else {
        showMessage('error', result.message || 'Failed to update password');
      }
    } catch (error) {
      console.error('Password update error:', error);
      showMessage('error', 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProfileSection = () => (
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
                className="psettings-form-input"
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
                className="psettings-form-input"
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
  );

  const renderNotificationSection = () => (
    <div className="psettings-section">
      <div className="psettings-section-header">
        <h3>Notification Preferences</h3>
        <p>Manage how you receive notifications and updates</p>
      </div>
      
      <form onSubmit={handleNotificationSubmit} className="psettings-form">
        <div className="psettings-notification-groups">
          <div className="psettings-notification-group">
            <h4 className="psettings-notification-group-title">Communication</h4>
            <div className="psettings-checkbox-list">
              <div className="psettings-checkbox-item">
                <input
                  type="checkbox"
                  id="email"
                  checked={notificationForm.email}
                  onChange={(e) => setNotificationForm({...notificationForm, email: e.target.checked})}
                  className="psettings-checkbox-input"
                />
                <div className="psettings-checkbox-content">
                  <label htmlFor="email" className="psettings-checkbox-label">Email Notifications</label>
                  <p className="psettings-checkbox-description">Receive important updates via email</p>
                </div>
              </div>
              
              <div className="psettings-checkbox-item">
                <input
                  type="checkbox"
                  id="push"
                  checked={notificationForm.push}
                  onChange={(e) => setNotificationForm({...notificationForm, push: e.target.checked})}
                  className="psettings-checkbox-input"
                />
                <div className="psettings-checkbox-content">
                  <label htmlFor="push" className="psettings-checkbox-label">Push Notifications</label>
                  <p className="psettings-checkbox-description">Get instant notifications on your device</p>
                </div>
              </div>
            </div>
          </div>

          <div className="psettings-notification-group">
            <h4 className="psettings-notification-group-title">Content Updates</h4>
            <div className="psettings-checkbox-list">
              <div className="psettings-checkbox-item">
                <input
                  type="checkbox"
                  id="listingUpdates"
                  checked={notificationForm.listingUpdates}
                  onChange={(e) => setNotificationForm({...notificationForm, listingUpdates: e.target.checked})}
                  className="psettings-checkbox-input"
                />
                <div className="psettings-checkbox-content">
                  <label htmlFor="listingUpdates" className="psettings-checkbox-label">Listing Updates</label>
                  <p className="psettings-checkbox-description">New listings and updates to saved searches</p>
                </div>
              </div>
              
              <div className="psettings-checkbox-item">
                <input
                  type="checkbox"
                  id="priceAlerts"
                  checked={notificationForm.priceAlerts}
                  onChange={(e) => setNotificationForm({...notificationForm, priceAlerts: e.target.checked})}
                  className="psettings-checkbox-input"
                />
                <div className="psettings-checkbox-content">
                  <label htmlFor="priceAlerts" className="psettings-checkbox-label">Price Alerts</label>
                  <p className="psettings-checkbox-description">Get notified when prices drop on saved items</p>
                </div>
              </div>
              
              <div className="psettings-checkbox-item">
                <input
                  type="checkbox"
                  id="newsUpdates"
                  checked={notificationForm.newsUpdates}
                  onChange={(e) => setNotificationForm({...notificationForm, newsUpdates: e.target.checked})}
                  className="psettings-checkbox-input"
                />
                <div className="psettings-checkbox-content">
                  <label htmlFor="newsUpdates" className="psettings-checkbox-label">News Updates</label>
                  <p className="psettings-checkbox-description">Latest automotive news and articles</p>
                </div>
              </div>
            </div>
          </div>

          <div className="psettings-notification-group">
            <h4 className="psettings-notification-group-title">Marketing & Services</h4>
            <div className="psettings-checkbox-list">
              <div className="psettings-checkbox-item">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={notificationForm.marketing}
                  onChange={(e) => setNotificationForm({...notificationForm, marketing: e.target.checked})}
                  className="psettings-checkbox-input"
                />
                <div className="psettings-checkbox-content">
                  <label htmlFor="marketing" className="psettings-checkbox-label">Marketing Communications</label>
                  <p className="psettings-checkbox-description">Special offers, promotions, and newsletters</p>
                </div>
              </div>
              
              <div className="psettings-checkbox-item">
                <input
                  type="checkbox"
                  id="serviceReminders"
                  checked={notificationForm.serviceReminders}
                  onChange={(e) => setNotificationForm({...notificationForm, serviceReminders: e.target.checked})}
                  className="psettings-checkbox-input"
                />
                <div className="psettings-checkbox-content">
                  <label htmlFor="serviceReminders" className="psettings-checkbox-label">Service Reminders</label>
                  <p className="psettings-checkbox-description">Maintenance reminders and service notifications</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="psettings-btn psettings-btn-primary"
          disabled={loading}
        >
          <Bell size={16} />
          {loading ? 'Updating...' : 'Update Notifications'}
        </button>
      </form>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="psettings-section">
      <div className="psettings-section-header">
        <h3>Privacy Settings</h3>
        <p>Control your privacy and data sharing preferences</p>
      </div>
      
      <form onSubmit={handlePrivacySubmit} className="psettings-form">
        <div className="psettings-privacy-groups">
          <div className="psettings-privacy-group">
            <h4 className="psettings-privacy-group-title">Profile Visibility</h4>
            <div className="psettings-form-group">
              <label htmlFor="profileVisibility">Who can see your profile?</label>
              <select
                id="profileVisibility"
                value={privacyForm.profileVisibility}
                onChange={(e) => setPrivacyForm({...privacyForm, profileVisibility: e.target.value})}
                className="psettings-form-input"
              >
                <option value="public">Public - Anyone can see</option>
                <option value="private">Private - Only you can see</option>
                <option value="friends">Friends - Only friends can see</option>
              </select>
            </div>
          </div>

          <div className="psettings-privacy-group">
            <h4 className="psettings-privacy-group-title">Contact Information</h4>
            <div className="psettings-checkbox-list">
              <div className="psettings-checkbox-item">
                <input
                  type="checkbox"
                  id="showEmail"
                  checked={privacyForm.showEmail}
                  onChange={(e) => setPrivacyForm({...privacyForm, showEmail: e.target.checked})}
                  className="psettings-checkbox-input"
                />
                <div className="psettings-checkbox-content">
                  <label htmlFor="showEmail" className="psettings-checkbox-label">Show Email Address</label>
                  <p className="psettings-checkbox-description">Allow others to see your email address on your profile</p>
                </div>
              </div>
              
              <div className="psettings-checkbox-item">
                <input
                  type="checkbox"
                  id="showPhone"
                  checked={privacyForm.showPhone}
                  onChange={(e) => setPrivacyForm({...privacyForm, showPhone: e.target.checked})}
                  className="psettings-checkbox-input"
                />
                <div className="psettings-checkbox-content">
                  <label htmlFor="showPhone" className="psettings-checkbox-label">Show Phone Number</label>
                  <p className="psettings-checkbox-description">Allow others to see your phone number on listings</p>
                </div>
              </div>
            </div>
          </div>

          <div className="psettings-privacy-group">
            <h4 className="psettings-privacy-group-title">Communication</h4>
            <div className="psettings-checkbox-list">
              <div className="psettings-checkbox-item">
                <input
                  type="checkbox"
                  id="allowMessages"
                  checked={privacyForm.allowMessages}
                  onChange={(e) => setPrivacyForm({...privacyForm, allowMessages: e.target.checked})}
                  className="psettings-checkbox-input"
                />
                <div className="psettings-checkbox-content">
                  <label htmlFor="allowMessages" className="psettings-checkbox-label">Allow Direct Messages</label>
                  <p className="psettings-checkbox-description">Let other users send you direct messages</p>
                </div>
              </div>
            </div>
          </div>

          <div className="psettings-privacy-group">
            <h4 className="psettings-privacy-group-title">Data & Tracking</h4>
            <div className="psettings-checkbox-list">
              <div className="psettings-checkbox-item">
                <input
                  type="checkbox"
                  id="dataSharing"
                  checked={privacyForm.dataSharing}
                  onChange={(e) => setPrivacyForm({...privacyForm, dataSharing: e.target.checked})}
                  className="psettings-checkbox-input"
                />
                <div className="psettings-checkbox-content">
                  <label htmlFor="dataSharing" className="psettings-checkbox-label">Allow Data Sharing</label>
                  <p className="psettings-checkbox-description">Share anonymized data to improve our services</p>
                </div>
              </div>
              
              <div className="psettings-checkbox-item">
                <input
                  type="checkbox"
                  id="locationTracking"
                  checked={privacyForm.locationTracking}
                  onChange={(e) => setPrivacyForm({...privacyForm, locationTracking: e.target.checked})}
                  className="psettings-checkbox-input"
                />
                <div className="psettings-checkbox-content">
                  <label htmlFor="locationTracking" className="psettings-checkbox-label">Location Tracking</label>
                  <p className="psettings-checkbox-description">Allow location-based recommendations and features</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          className="psettings-btn psettings-btn-primary"
          disabled={loading}
        >
          <Shield size={16} />
          {loading ? 'Updating...' : 'Update Privacy Settings'}
        </button>
      </form>
    </div>
  );

  const renderPasswordSection = () => (
    <div className="psettings-section">
      <div className="psettings-section-header">
        <h3>Change Password</h3>
        <p>Update your password to keep your account secure</p>
      </div>
      
      <form onSubmit={handlePasswordSubmit} className="psettings-form">
        <div className="psettings-form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <div className="psettings-input-group">
            <Lock size={18} />
            <input
              id="currentPassword"
              type={showPasswords.current ? "text" : "password"}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              placeholder="Enter current password"
              className="psettings-form-input"
              required
            />
            <button
              type="button"
              className="psettings-password-toggle"
              onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
            >
              {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
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
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              placeholder="Enter new password"
              className="psettings-form-input"
              minLength="6"
              required
            />
            <button
              type="button"
              className="psettings-password-toggle"
              onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
            >
              {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <small className="psettings-form-note">Password must be at least 6 characters long</small>
        </div>

        <div className="psettings-form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <div className="psettings-input-group">
            <Lock size={18} />
            <input
              id="confirmPassword"
              type={showPasswords.confirm ? "text" : "password"}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
              placeholder="Confirm new password"
              className="psettings-form-input"
              required
            />
            <button
              type="button"
              className="psettings-password-toggle"
              onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
            >
              {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          className="psettings-btn psettings-btn-primary"
          disabled={loading}
        >
          <Lock size={16} />
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );

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
      <div className="psettings-navigation">
        <button 
          className={`psettings-nav-btn ${activeSection === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveSection('profile')}
        >
          <User size={18} />
          Profile
        </button>
        <button 
          className={`psettings-nav-btn ${activeSection === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveSection('notifications')}
        >
          <Bell size={18} />
          Notifications
        </button>
        <button 
          className={`psettings-nav-btn ${activeSection === 'privacy' ? 'active' : ''}`}
          onClick={() => setActiveSection('privacy')}
        >
          <Shield size={18} />
          Privacy
        </button>
        <button 
          className={`psettings-nav-btn ${activeSection === 'password' ? 'active' : ''}`}
          onClick={() => setActiveSection('password')}
        >
          <Lock size={18} />
          Password
        </button>
      </div>

      {/* Settings Content */}
      <div className="psettings-content">
        {activeSection === 'profile' && renderProfileSection()}
        {activeSection === 'notifications' && renderNotificationSection()}
        {activeSection === 'privacy' && renderPrivacySection()}
        {activeSection === 'password' && renderPasswordSection()}
      </div>
    </div>
  );
};

export default ProfileSettings;
