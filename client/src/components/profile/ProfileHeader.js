// client/src/components/profile/ProfileHeader.js
// FIXED VERSION - Updated API calls to use correct endpoints

import React, { useState, useRef } from 'react';
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
  Trash2,
  Loader
} from 'lucide-react';
import './ProfileHeader.css';

const ProfileHeader = ({ profileData, onProfileUpdate }) => {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // Create refs for file inputs
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

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

  // Clear error after 5 seconds
  const showError = (message) => {
    setUploadError(message);
    setTimeout(() => setUploadError(''), 5000);
  };

  // Get API base URL - Use the correct backend API URL
  const getApiUrl = () => {
    return 'https://bw-car-culture-api.vercel.app';
  };

  // Handle avatar upload - FIXED API PATH
  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('Avatar file selected:', file.name, file.size, file.type);

    // Validate file
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showError('Image size must be less than 5MB');
      return;
    }

    setUploadError('');
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      console.log('Uploading avatar...', file.name);

      // FIXED: Use the correct backend API URL and path
      const response = await fetch(`${getApiUrl()}/user/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      console.log('Avatar upload response status:', response.status);

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Avatar upload error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Try to parse JSON response
      let result;
      try {
        const text = await response.text();
        console.log('Avatar upload response text:', text);
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse avatar upload response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (result.success) {
        console.log('Avatar upload successful:', result.data);
        // Update profile data
        if (onProfileUpdate) {
          onProfileUpdate({
            ...profileData,
            avatar: result.data.avatar
          });
        }
        // Clear the file input
        if (avatarInputRef.current) {
          avatarInputRef.current.value = '';
        }
      } else {
        console.error('Avatar upload failed:', result.message);
        showError(result.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      showError('Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle cover picture upload - FIXED API PATH
  const handleCoverPictureChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('Cover picture file selected:', file.name, file.size, file.type);

    // Validate file
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit for cover pictures
      showError('Cover picture size must be less than 10MB');
      return;
    }

    setUploadError('');
    setUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append('coverPicture', file);

      console.log('Uploading cover picture...', file.name);

      // FIXED: Use the correct backend API URL and path
      const response = await fetch(`${getApiUrl()}/user/profile/cover-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      console.log('Cover picture upload response status:', response.status);

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Cover picture upload error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Try to parse JSON response
      let result;
      try {
        const text = await response.text();
        console.log('Cover picture upload response text:', text);
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse cover picture upload response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (result.success) {
        console.log('Cover picture upload successful:', result.data);
        // Update profile data
        if (onProfileUpdate) {
          onProfileUpdate({
            ...profileData,
            coverPicture: result.data.coverPicture
          });
        }
        // Clear the file input
        if (coverInputRef.current) {
          coverInputRef.current.value = '';
        }
      } else {
        console.error('Cover picture upload failed:', result.message);
        showError(result.message || 'Failed to upload cover picture');
      }
    } catch (error) {
      console.error('Cover picture upload error:', error);
      showError('Failed to upload cover picture. Please try again.');
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle cover picture deletion - FIXED API PATH
  const handleDeleteCoverPicture = async () => {
    if (!profileData.coverPicture?.url) return;

    setUploadingCover(true);

    try {
      // FIXED: Use the correct backend API URL and path
      const response = await fetch(`${getApiUrl()}/user/profile/cover-picture`, {
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
        showError(result.message || 'Failed to delete cover picture');
      }
    } catch (error) {
      console.error('Cover picture delete error:', error);
      showError('Failed to delete cover picture. Please try again.');
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle clicking on cover upload area
  const handleCoverUploadClick = () => {
    console.log('Cover upload clicked');
    if (coverInputRef.current) {
      coverInputRef.current.click();
    }
  };

  // Handle clicking on avatar upload area
  const handleAvatarUploadClick = () => {
    console.log('Avatar upload clicked');
    if (avatarInputRef.current) {
      avatarInputRef.current.click();
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
                {uploadingCover ? <Loader size={16} className="pheader-spin" /> : <Trash2 size={16} />}
              </button>
              <button 
                className="pheader-cover-action-btn pheader-cover-upload-btn"
                onClick={handleCoverUploadClick}
                disabled={uploadingCover}
                title="Change cover picture"
              >
                {uploadingCover ? <Loader size={16} className="pheader-spin" /> : <Camera size={16} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="pheader-cover-placeholder">
            <div className="pheader-cover-placeholder-content">
              <button 
                className="pheader-cover-upload-prompt"
                onClick={handleCoverUploadClick}
                disabled={uploadingCover}
                type="button"
              >
                {uploadingCover ? (
                  <Loader size={24} className="pheader-spin" />
                ) : (
                  <>
                    <Upload size={24} />
                    <span>Add Cover Picture</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Hidden cover picture input */}
        <input
          ref={coverInputRef}
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
              <button 
                className="pheader-avatar-edit-overlay"
                onClick={handleAvatarUploadClick}
                disabled={uploadingAvatar}
                title="Change profile picture"
                type="button"
              >
                {uploadingAvatar ? (
                  <Loader size={16} className="pheader-spin" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Hidden avatar input */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploadingAvatar}
            style={{ display: 'none' }}
          />

          {/* Upload Error Display */}
          {uploadError && (
            <div className="pheader-upload-error">
              <X size={12} />
              {uploadError}
            </div>
          )}

          {/* User Name */}
          <div className="pheader-user-name-section">
            <h1 className="pheader-user-name">
              {profileData.name || 'Anonymous User'}
              {(hasBusinessProfile || hasTransportProfile || hasDealerProfile) && (
                <CheckCircle size={20} className="pheader-verified-icon" />
              )}
            </h1>
            
            {profileData.profile?.bio && (
              <p className="pheader-user-bio">{profileData.profile.bio}</p>
            )}
          </div>

          {/* User Stats */}
          <div className="pheader-user-stats">
            <div className="pheader-stat-item">
              <User size={16} />
              <span>Member since {formatJoinDate(profileData.createdAt)}</span>
            </div>
            
            {profileData.profile?.location && (
              <div className="pheader-stat-item">
                <MapPin size={16} />
                <span>{profileData.profile.location}</span>
              </div>
            )}
            
            {profileData.profile?.phone && (
              <div className="pheader-stat-item">
                <Phone size={16} />
                <span>{profileData.profile.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;