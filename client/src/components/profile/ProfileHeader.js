// client/src/components/profile/ProfileHeader.js
import React, { useState, useRef } from 'react';
import { 
  User, Settings, Shield, Activity, Calendar, Edit2, 
  Camera, Upload, X, CheckCircle, AlertCircle, BarChart3
} from 'lucide-react';
import axios from '../../config/axios.js';

const ProfileHeader = ({ profileData, setProfileData, updateProfile, onAdminAccess }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const isAdmin = profileData?.role === 'admin';
  const isBusinessOwner = profileData?.businessProfile?.services?.some(s => s.isVerified);
  const hasDealer = profileData?.dealership;

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const calculateCompleteness = () => {
    let score = 0;
    const fields = [
      profileData.name,
      profileData.email,
      profileData.avatar?.url,
      profileData.profile?.phone,
      profileData.profile?.bio,
      profileData.profile?.dateOfBirth,
      profileData.profile?.address?.city
    ];
    
    fields.forEach(field => {
      if (field) score += 14.28; // 100/7 fields
    });
    
    return Math.round(score);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError('Image must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await axios.put('/user/profile/basic', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setProfileData(prev => ({
          ...prev,
          avatar: response.data.data.avatar
        }));
        updateProfile && updateProfile(response.data.data);
      } else {
        setUploadError('Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setUploadError(error.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const completeness = calculateCompleteness();

  return (
    <div className="pheader-main-container">
      <div className="pheader-background-overlay"></div>
      
      <div className="pheader-content-wrapper">
        {/* Avatar Section */}
        <div className="pheader-avatar-section">
          <div className="pheader-avatar-container">
            {profileData.avatar?.url ? (
              <img 
                src={profileData.avatar.url} 
                alt={profileData.name}
                className="pheader-avatar-image"
                onClick={handleAvatarClick}
              />
            ) : (
              <div 
                className="pheader-avatar-placeholder"
                onClick={handleAvatarClick}
              >
                {getInitials(profileData.name)}
              </div>
            )}
            
            {/* Upload Overlay */}
            <div className="pheader-avatar-edit-overlay" onClick={handleAvatarClick}>
              {uploading ? (
                <div className="pheader-upload-spinner"></div>
              ) : (
                <Camera size={16} />
              )}
            </div>
            
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
          
          {/* Upload Error */}
          {uploadError && (
            <div className="pheader-upload-error">
              <AlertCircle size={14} />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* User Information */}
        <div className="pheader-user-info">
          <h1 className="pheader-user-name">{profileData.name || 'User'}</h1>
          <p className="pheader-user-email">{profileData.email}</p>
          
          <button 
            className="pheader-edit-profile-button"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 size={16} />
            Edit Profile
          </button>

          {/* Profile Meta Information */}
          <div className="pheader-profile-meta">
            <div className="pheader-meta-item">
              <Calendar size={16} />
              <span>Joined {formatDate(profileData.createdAt)}</span>
            </div>
            <div className="pheader-meta-item">
              <span className={`pheader-role-badge ${profileData.role}`}>
                {profileData.role === 'admin' ? 'Administrator' : 
                 profileData.role === 'provider' ? 'Service Provider' :
                 profileData.role === 'dealer' ? 'Dealer' : 'User'}
              </span>
            </div>
            {profileData.profile?.bio && (
              <div className="pheader-meta-item pheader-bio">
                <User size={16} />
                <span>{profileData.profile.bio}</span>
              </div>
            )}
          </div>

          {/* Quick Access Buttons */}
          <div className="pheader-quick-access-section">
            {isAdmin && (
              <button 
                onClick={onAdminAccess} 
                className="pheader-admin-panel-button"
              >
                <Shield size={16} />
                Access Admin Panel
              </button>
            )}
            
            {isBusinessOwner && (
              <button 
                className="pheader-business-dashboard-button"
                onClick={() => window.location.href = '/provider/dashboard'}
              >
                <Activity size={16} />
                Business Dashboard
              </button>
            )}

            {hasDealer && (
              <button 
                className="pheader-dealer-dashboard-button"
                onClick={() => window.location.href = '/dealer/dashboard'}
              >
                <BarChart3 size={16} />
                Dealer Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Profile Statistics */}
        <div className="pheader-profile-stats">
          <div className="pheader-stat-item">
            <span className="pheader-stat-value">{completeness}%</span>
            <span className="pheader-stat-label">Complete</span>
          </div>
          <div className="pheader-stat-item">
            <span className="pheader-stat-value">{profileData.favorites?.length || 0}</span>
            <span className="pheader-stat-label">Favorites</span>
          </div>
          <div className="pheader-stat-item">
            <span className="pheader-stat-value">{profileData.businessProfile?.services?.length || 0}</span>
            <span className="pheader-stat-label">Services</span>
          </div>
          <div className="pheader-stat-item">
            <span className="pheader-stat-value">{profileData.vehicles?.length || 0}</span>
            <span className="pheader-stat-label">Vehicles</span>
          </div>
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
