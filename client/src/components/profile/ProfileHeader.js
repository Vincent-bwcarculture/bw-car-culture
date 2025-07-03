// client/src/components/profile/ProfileHeader.js
import React, { useState } from 'react';
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Shield, 
  Activity, 
  BarChart3, 
  Edit2, 
  Camera,
  CheckCircle,
  Truck
} from 'lucide-react';
import './ProfileHeader.css';

const ProfileHeader = ({ 
  profileData, 
  setProfileData, 
  updateProfile, 
  onAdminAccess 
}) => {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Check user permissions - UPDATED LOGIC
  const isAdmin = profileData?.role === 'admin'; // Site owners only
  
  // Business dashboard access based on having business services
  const hasBusinessProfile = profileData?.businessProfile?.services?.some(s => s.isVerified) || 
                            profileData?.businessProfile?.services?.length > 0;
  
  // Dealer dashboard access 
  const hasDealerProfile = profileData?.dealership || 
                          profileData?.businessProfile?.services?.some(s => s.serviceType === 'dealership');
  
  // Transport provider dashboard
  const hasTransportProfile = profileData?.businessProfile?.services?.some(s => s.serviceType === 'public_transport');

  // Calculate profile completeness
  const calculateCompleteness = () => {
    let score = 0;
    let maxScore = 100;
    
    // Basic info (60 points)
    if (profileData.name) score += 15;
    if (profileData.email) score += 15;
    if (profileData.avatar?.url) score += 15;
    if (profileData.profile?.phone) score += 15;
    
    // Extended profile (40 points)
    if (profileData.profile?.bio) score += 10;
    if (profileData.profile?.location) score += 10;
    if (profileData.profile?.dateOfBirth) score += 10;
    if (profileData.businessProfile?.services?.length > 0) score += 10;
    
    return Math.round((score / maxScore) * 100);
  };

  const completeness = calculateCompleteness();

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

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError('Image size must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    setUploadError('');

    try {
      // Create FormData for upload
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const data = await response.json();
      
      // Update profile data with new avatar
      setProfileData(prev => ({
        ...prev,
        avatar: data.avatar
      }));

    } catch (error) {
      console.error('Avatar upload error:', error);
      setUploadError('Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="pheader-main-container">
      <div className="pheader-background-overlay"></div>
      
      <div className="pheader-content-wrapper">
        <div className="pheader-user-info">
          {/* Avatar Section */}
          <div className="pheader-avatar-section">
            <div className="pheader-avatar-container">
              {profileData.avatar?.url ? (
                <img 
                  src={profileData.avatar.url} 
                  alt={profileData.name || 'Profile'} 
                  className="pheader-avatar-image"
                />
              ) : (
                <div className="pheader-avatar-placeholder">
                  {getInitials(profileData.name)}
                </div>
              )}
              
              {/* Avatar Edit Overlay */}
              <label htmlFor="avatar-upload" className="pheader-avatar-edit-overlay">
                {uploadingAvatar ? (
                  <div className="pheader-upload-spinner"></div>
                ) : (
                  <Camera size={20} />
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            
            {uploadError && (
              <div className="pheader-upload-error">
                {uploadError}
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="pheader-user-details">
            <h1 className="pheader-user-name">
              {profileData.name || 'User'}
              {profileData.isVerified && (
                <CheckCircle size={24} className="pheader-verified-badge" />
              )}
            </h1>
            
            <div className="pheader-user-email">{profileData.email}</div>
            
            <button className="pheader-edit-profile-button">
              <Edit2 size={16} />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Profile Meta Information */}
        <div className="pheader-profile-meta">
          {profileData.profile?.location && (
            <div className="pheader-meta-item">
              <MapPin size={16} />
              <span>{profileData.profile.location}</span>
            </div>
          )}
          {profileData.profile?.phone && (
            <div className="pheader-meta-item">
              <Phone size={16} />
              <span>{profileData.profile.phone}</span>
            </div>
          )}
          <div className="pheader-meta-item">
            <Calendar size={16} />
            <span>Joined {formatJoinDate(profileData.createdAt)}</span>
          </div>
          <div className="pheader-meta-item">
            <User size={16} />
            <span>
              {profileData.role === 'admin' ? 'Site Administrator' : 
               hasBusinessProfile ? 'Business Owner' :
               hasTransportProfile ? 'Transport Provider' :
               hasDealerProfile ? 'Dealer' : 'Personal User'}
            </span>
          </div>
          {profileData.profile?.bio && (
            <div className="pheader-meta-item pheader-bio">
              <User size={16} />
              <span>{profileData.profile.bio}</span>
            </div>
          )}
        </div>

        {/* Quick Access Buttons - UPDATED LOGIC */}
        <div className="pheader-quick-access-section">
          {/* Admin Panel - Only for site administrators */}
          {isAdmin && (
            <button 
              onClick={onAdminAccess} 
              className="pheader-admin-panel-button"
            >
              <Shield size={16} />
              Site Admin Panel
            </button>
          )}
          
          {/* Business Dashboard - For users with business profiles */}
          {hasBusinessProfile && (
            <button 
              className="pheader-business-dashboard-button"
              onClick={() => window.location.href = '/business/dashboard'}
            >
              <Activity size={16} />
              Business Dashboard
            </button>
          )}

          {/* Dealer Dashboard - For dealers */}
          {hasDealerProfile && (
            <button 
              className="pheader-dealer-dashboard-button"
              onClick={() => window.location.href = '/dealer/dashboard'}
            >
              <BarChart3 size={16} />
              Dealer Dashboard
            </button>
          )}

          {/* Transport Dashboard - For transport providers */}
          {hasTransportProfile && (
            <button 
              className="pheader-transport-dashboard-button"
              onClick={() => window.location.href = '/transport/dashboard'}
            >
              <Truck size={16} />
              Transport Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Profile Completion Bar */}
      <div className="pheader-profile-completion">
        <div className="pheader-completion-text">
          <span>Profile Completion</span>
          <span>{completeness}%</span>
        </div>
        <div className="pheader-completion-bar">
          <div 
            className="pheader-completion-fill" 
            style={{ width: `${completeness}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;