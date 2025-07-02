// client/src/components/profile/ProfileHeader.js
import React, { useState } from 'react';
import { 
  Camera, Edit2, Check, X, Mail, User, Calendar, 
  Shield, Star, Activity
} from 'lucide-react';
import axios from '../../config/axios.js';

const ProfileHeader = ({ profileData, setProfileData, updateProfile, onAdminAccess }) => {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profileData?.name || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleNameEdit = () => {
    setEditingName(true);
    setNewName(profileData?.name || '');
  };

  const handleNameSave = async () => {
    try {
      await updateProfile({ name: newName });
      setProfileData(prev => ({ ...prev, name: newName }));
      setEditingName(false);
    } catch (error) {
      console.error('Error updating name:', error);
      alert('Failed to update name');
    }
  };

  const handleNameCancel = () => {
    setNewName(profileData?.name || '');
    setEditingName(false);
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', file);

      let response;
      try {
        response = await axios.put('/user/profile/basic', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } catch (profileError) {
        // Fallback to auth profile endpoint
        response = await axios.put('/auth/profile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      if (response.data.success) {
        setProfileData(prev => ({
          ...prev,
          avatar: response.data.data.avatar
        }));
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateProfileCompleteness = () => {
    if (!profileData) return 0;
    
    let completeness = 0;
    const fields = [
      profileData.name,
      profileData.email,
      profileData.avatar,
      profileData.profile?.phone,
      profileData.profile?.bio,
      profileData.profile?.address?.city
    ];
    
    fields.forEach(field => {
      if (field) completeness += 16.67; // 100/6 fields
    });
    
    return Math.round(completeness);
  };

  const isAdmin = profileData?.role === 'admin';
  const isBusinessOwner = profileData?.businessProfile?.services?.some(s => s.isVerified) || 
                          profileData?.dealership;
  const completeness = calculateProfileCompleteness();

  return (
    <div className="profile-header">
      <div className="profile-header-content">
        {/* Avatar Section */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-container">
            <img 
              src={profileData.avatar?.url || '/images/default-avatar.png'} 
              alt={profileData.name || 'User Avatar'}
              className="profile-avatar"
            />
            <label htmlFor="avatar-upload" className="avatar-upload-button">
              {uploadingAvatar ? (
                <div className="upload-spinner"></div>
              ) : (
                <Camera size={16} />
              )}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* Profile Info */}
        <div className="profile-info">
          <div className="profile-name">
            {editingName ? (
              <div className="name-editing">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="name-input"
                />
                <div className="name-actions">
                  <button onClick={handleNameSave} className="save-button">
                    <Check size={16} />
                  </button>
                  <button onClick={handleNameCancel} className="cancel-button">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="name-display">
                <h1>{profileData.name || 'No Name Set'}</h1>
                <button onClick={handleNameEdit} className="edit-name-button">
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="profile-meta">
            <div className="meta-item">
              <Mail size={16} />
              <span>{profileData.email}</span>
            </div>
            <div className="meta-item">
              <User size={16} />
              <span className={`role-badge ${profileData.role}`}>
                {profileData.role === 'admin' ? 'Administrator' : 
                 profileData.role === 'provider' ? 'Service Provider' :
                 profileData.role === 'dealer' ? 'Dealer' : 'User'}
              </span>
            </div>
            <div className="meta-item">
              <Calendar size={16} />
              <span>Joined {formatDate(profileData.createdAt)}</span>
            </div>
          </div>

          {/* Quick Access Buttons */}
          <div className="quick-access-section">
            {isAdmin && (
              <button 
                onClick={onAdminAccess} 
                className="admin-panel-button"
              >
                <Shield size={16} />
                Access Admin Panel
              </button>
            )}
            
            {isBusinessOwner && (
              <button 
                className="business-dashboard-button"
                onClick={() => window.location.href = '/provider/dashboard'}
              >
                <Activity size={16} />
                Business Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Profile Stats */}
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{completeness}%</span>
            <span className="stat-label">Complete</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profileData.favorites?.length || 0}</span>
            <span className="stat-label">Favorites</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profileData.businessProfile?.services?.length || 0}</span>
            <span className="stat-label">Services</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{profileData.vehicles?.length || 0}</span>
            <span className="stat-label">Vehicles</span>
          </div>
        </div>
      </div>

      {/* Profile Completion Bar */}
      <div className="profile-completion">
        <div className="completion-text">
          <span>Profile Completion</span>
          <span>{completeness}%</span>
        </div>
        <div className="completion-bar">
          <div 
            className="completion-fill" 
            style={{ width: `${completeness}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
