// client/src/components/profile/ProfileHeader.js
// COMPLETE VERSION - With Social Features (Followers/Associates) Integrated

import React, { useState, useRef, useEffect } from 'react';
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
  Loader,
  Users,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import './ProfileHeader.css';

// === SOCIAL STATS SECTION COMPONENT ===
const SocialStatsSection = ({ profileData, isOwnProfile = false, onFollowAction }) => {
  const [socialStats, setSocialStats] = useState({
    followers: 0,
    following: 0,
    associates: 0,
    isFollowing: false
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch social stats on component mount
  useEffect(() => {
    fetchSocialStats();
  }, [profileData]);

  const fetchSocialStats = async () => {
    try {
      setLoading(true);
      
      // Get social stats for current user or target user
      let statsEndpoint = '/api/user/social-stats';
      if (!isOwnProfile && profileData?._id) {
        // If viewing another user's profile, we might want to fetch their stats too
        // For now, we'll get current user's stats and follow status
        statsEndpoint = '/api/user/social-stats';
      }

      const statsResponse = await fetch(statsEndpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setSocialStats(prev => ({
          ...prev,
          ...statsData.data
        }));
      }

      // If viewing another user's profile, check follow status
      if (!isOwnProfile && profileData?._id) {
        const followStatusResponse = await fetch(`/api/user/follow-status/${profileData._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (followStatusResponse.ok) {
          const followData = await followStatusResponse.json();
          setSocialStats(prev => ({
            ...prev,
            isFollowing: followData.data.isFollowing
          }));
        }
      }

    } catch (error) {
      console.error('Error fetching social stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowAction = async () => {
    if (!profileData?._id || isOwnProfile) return;

    try {
      setActionLoading(true);
      
      const endpoint = socialStats.isFollowing ? '/api/user/unfollow' : '/api/user/follow';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ targetUserId: profileData._id })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setSocialStats(prev => ({
          ...prev,
          isFollowing: !prev.isFollowing,
          following: result.data.followingCount || prev.following
        }));

        // Refresh social stats to get updated counts
        setTimeout(fetchSocialStats, 500);

        if (onFollowAction) {
          onFollowAction(!socialStats.isFollowing);
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCount = (count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  return (
    <div className="pheader-social-section">
      {/* Social Stats */}
      <div className="pheader-social-stats">
        <div className="pheader-stat-item">
          <div className="pheader-stat-number">
            {loading ? '...' : formatCount(socialStats.followers)}
          </div>
          <div className="pheader-stat-label">Followers</div>
        </div>
        
        <div className="pheader-stat-divider"></div>
        
        <div className="pheader-stat-item">
          <div className="pheader-stat-number">
            {loading ? '...' : formatCount(socialStats.following)}
          </div>
          <div className="pheader-stat-label">Following</div>
        </div>
        
        <div className="pheader-stat-divider"></div>
        
        <div className="pheader-stat-item pheader-stat-associates">
          <div className="pheader-stat-number">
            {loading ? '...' : formatCount(socialStats.associates)}
          </div>
          <div className="pheader-stat-label">Associates</div>
        </div>
      </div>

      {/* Follow/Unfollow Button - Only show if not own profile */}
      {!isOwnProfile && profileData?._id && (
        <div className="pheader-follow-section">
          <button 
            className={`pheader-follow-btn ${socialStats.isFollowing ? 'following' : 'not-following'}`}
            onClick={handleFollowAction}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader size={16} className="spin" />
            ) : socialStats.isFollowing ? (
              <>
                <UserCheck size={16} />
                <span>Following</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Follow</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// === MAIN PROFILE HEADER COMPONENT ===
const ProfileHeader = ({ 
  profileData, 
  onProfileUpdate,
  onEditProfile // Edit profile functionality
}) => {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // Get AuthContext to update user data
  const { user, setUser } = useAuth();
  
  // Create refs for file inputs
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Determine if viewing own profile
  const isOwnProfile = user && profileData && (
    user.id === profileData._id || 
    user._id === profileData._id ||
    user.id === profileData.id
  );

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

  // Handle edit profile click
  const handleEditProfileClick = () => {
    console.log('Edit profile clicked');
    if (onEditProfile) {
      onEditProfile();
    } else {
      console.warn('onEditProfile prop not provided to ProfileHeader');
    }
  };

  // Handle avatar upload - Updates AuthContext
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

      // Use correct backend API URL
      const response = await fetch('https://bw-car-culture-api.vercel.app/user/profile/avatar', {
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
        
        // Update AuthContext user data so navigation shows new avatar
        if (user && setUser) {
          setUser({
            ...user,
            avatar: result.data.avatar
          });
          console.log('AuthContext user updated with new avatar');
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

  // Handle cover picture upload
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

      // Use correct backend API URL
      const response = await fetch('https://bw-car-culture-api.vercel.app/user/profile/cover-picture', {
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

  // Handle cover picture deletion
  const handleDeleteCoverPicture = async () => {
    if (!profileData.coverPicture?.url) return;

    setUploadingCover(true);

    try {
      // Use correct backend API URL
      const response = await fetch('https://bw-car-culture-api.vercel.app/user/profile/cover-picture', {
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
  const hasBusinessProfile = profileData?.businessProfile?.services?.length > 0;
  const hasTransportProfile = profileData?.transportProfile?.route;
  const hasDealerProfile = profileData?.dealerProfile?.businessName;

  return (
    <div className="pheader-main-container">
      {/* Cover Picture Section */}
      <div className="pheader-cover-section">
        {profileData?.coverPicture?.url ? (
          <div className="pheader-cover-image-container">
            <img 
              src={profileData.coverPicture.url} 
              alt="Cover" 
              className="pheader-cover-image"
            />
            {/* Only show overlay controls if it's own profile */}
            {isOwnProfile && (
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
            )}
          </div>
        ) : (
          <div className="pheader-cover-placeholder">
            {/* Only show upload prompt if it's own profile */}
            {isOwnProfile && (
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
            )}
          </div>
        )}
        
        {/* Cover Picture Upload Button - Only visible if own profile */}
        {isOwnProfile && (
          <div className="pheader-cover-upload-button-container">
            <button 
              className="pheader-cover-camera-btn"
              onClick={handleCoverUploadClick}
              disabled={uploadingCover}
              title="Upload cover picture"
            >
              {uploadingCover ? (
                <Loader size={16} className="pheader-spin" />
              ) : (
                <Camera size={16} />
              )}
            </button>
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
              {profileData?.avatar?.url ? (
                <img 
                  src={profileData.avatar.url} 
                  alt={profileData.name || 'Profile'} 
                  className="pheader-avatar-image"
                />
              ) : (
                <div className="pheader-avatar-placeholder">
                  {getInitials(profileData?.name)}
                </div>
              )}
              
              {/* Avatar Edit Overlay - Only show if own profile */}
              {isOwnProfile && (
                <button 
                  className="pheader-avatar-edit-overlay"
                  onClick={handleAvatarUploadClick}
                  disabled={uploadingAvatar}
                  title="Change profile picture"
                >
                  {uploadingAvatar ? (
                    <Loader size={20} className="pheader-spin" />
                  ) : (
                    <Camera size={20} />
                  )}
                </button>
              )}
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
              {profileData?.name || 'User'}
              {profileData?.isVerified && (
                <CheckCircle size={24} className="pheader-verified-badge" />
              )}
            </h1>
            
            <div className="pheader-user-email">{profileData?.email}</div>
            
            {/* Edit Profile button - Only show if own profile */}
            {isOwnProfile && (
              <button 
                className="pheader-edit-profile-button"
                onClick={handleEditProfileClick}
                type="button"
              >
                <Edit2 size={16} />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* === SOCIAL STATS SECTION - NEW ADDITION === */}
        <SocialStatsSection 
          profileData={profileData}
          isOwnProfile={isOwnProfile}
          onFollowAction={(isNowFollowing) => {
            // Optional: Handle follow action callback
            console.log('Follow action:', isNowFollowing);
            // You could trigger a refresh of profile data here if needed
          }}
        />

        {/* Profile Meta Information */}
        <div className="pheader-profile-meta">
          {profileData?.profile?.address?.city && (
            <div className="pheader-meta-item">
              <MapPin size={16} />
              <span>{profileData.profile.address.city}</span>
            </div>
          )}
          {profileData?.profile?.phone && (
            <div className="pheader-meta-item">
              <Phone size={16} />
              <span>{profileData.profile.phone}</span>
            </div>
          )}
          <div className="pheader-meta-item">
            <Calendar size={16} />
            <span>Joined {formatJoinDate(profileData?.createdAt)}</span>
          </div>
          <div className="pheader-meta-item">
            <User size={16} />
            <span>
              {profileData?.role === 'admin' ? 'Site Administrator' : 
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