// client/src/components/profile/ProfileHeader.js
// Update your existing ProfileHeader component with this enhanced version

import React, { useState } from 'react';
import { 
  Camera, 
  Edit2, 
  MapPin, 
  Phone, 
  Calendar, 
  User, 
  CheckCircle,
  X,
  Upload,
  Trash2
} from 'lucide-react';
import './ProfileHeader.css';

const ProfileHeader = ({ profileData, onProfileUpdate }) => {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  // Handle avatar upload
  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setUploadError('Image size must be less than 5MB');
      return;
    }

    setUploadError('');
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Update profile data
        if (onProfileUpdate) {
          onProfileUpdate({
            ...profileData,
            avatar: result.data.avatar
          });
        }
      } else {
        setUploadError(result.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setUploadError('Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle cover picture upload
  const handleCoverPictureChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit for cover pictures
      setUploadError('Cover picture size must be less than 10MB');
      return;
    }

    setUploadError('');
    setUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append('coverPicture', file);

      const response = await fetch('/api/user/profile/cover-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Update profile data
        if (onProfileUpdate) {
          onProfileUpdate({
            ...profileData,
            coverPicture: result.data.coverPicture
          });
        }
      } else {
        setUploadError(result.message || 'Failed to upload cover picture');
      }
    } catch (error) {
      console.error('Cover picture upload error:', error);
      setUploadError('Failed to upload cover picture. Please try again.');
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle cover picture deletion
  const handleDeleteCoverPicture = async () => {
    if (!profileData.coverPicture?.url) return;

    setUploadingCover(true);

    try {
      const response = await fetch('/api/user/profile/cover-picture', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (result.success) {
        // Update profile data
        if (onProfileUpdate) {
          const updatedProfile = { ...profileData };
          delete updatedProfile.coverPicture;
          onProfileUpdate(updatedProfile);
        }
      } else {
        setUploadError(result.message || 'Failed to delete cover picture');
      }
    } catch (error) {
      console.error('Cover picture delete error:', error);
      setUploadError('Failed to delete cover picture. Please try again.');
    } finally {
      setUploadingCover(false);
    }
  };

  // Check if user has business, transport, or dealer profile
  const hasBusinessProfile = profileData.businessProfile?.services?.length > 0;
  const hasTransportProfile = profileData.transportProfile?.route;
  const hasDealerProfile = profileData.dealerProfile?.businessName;

  return (
    <div className="pheader-main-container">
      {/* Cover Picture Section */}
      <div className="pheader-cover-section">
        {profileData.coverPicture?.url ? (
          <div className="pheader-cover-image-container">
            <img 
              src={profileData.coverPicture.url} 
              alt="Cover" 
              className="pheader-cover-image"
            />
            <div className="pheader-cover-overlay">
              <button 
                className="pheader-cover-action-btn pheader-cover-delete-btn"
                onClick={handleDeleteCoverPicture}
                disabled={uploadingCover}
                title="Delete cover picture"
              >
                <Trash2 size={16} />
              </button>
              <label htmlFor="cover-upload" className="pheader-cover-action-btn pheader-cover-upload-btn">
                {uploadingCover ? (
                  <div className="pheader-upload-spinner"></div>
                ) : (
                  <Camera size={16} />
                )}
              </label>
            </div>
          </div>
        ) : (
          <div className="pheader-cover-placeholder">
            <div className="pheader-cover-placeholder-content">
              <label htmlFor="cover-upload" className="pheader-cover-upload-prompt">
                {uploadingCover ? (
                  <div className="pheader-upload-spinner"></div>
                ) : (
                  <>
                    <Upload size={24} />
                    <span>Add Cover Picture</span>
                  </>
                )}
              </label>
            </div>
          </div>
        )}
        
        {/* Hidden cover picture input */}
        <input
          id="cover-upload"
          type="file"
          accept="image/*"
          onChange={handleCoverPictureChange}
          disabled={uploadingCover}
          style={{ display: 'none' }}
        />
      </div>

      {/* Background overlay */}
      <div className="pheader-background-overlay"></div>

      {/* Main content */}
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
                <X size={16} />
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
               hasDealerProfile ? 'Dealer' : 'User'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;