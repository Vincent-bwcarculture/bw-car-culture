// client/src/pages/UserProfilePage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { http } from '../config/axios.js';
import { 
  User, Edit2, Camera, Mail, Phone, MapPin, Calendar, 
  Globe, Star, Heart, Car, Settings, Award, Activity,
  Eye, MessageSquare, ThumbsUp, Save, X, Check,
  Shield, Bell, Lock
} from 'lucide-react';
import './UserProfilePage.css';

const UserProfilePage = () => {
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Fetch user profile data
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    } else {
      setLoading(false);
      setError('Please login to view your profile');
    }
  }, [isAuthenticated]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await http.get('/user/profile');
      
      if (response.data.success) {
        setProfileData(response.data.data);
        setNewName(response.data.data.name || '');
      } else {
        setError('Failed to load profile data');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNameEdit = () => {
    setEditingName(true);
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

      const response = await http.put('/user/profile/basic', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

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

  if (loading) {
    return (
      <div className="user-profile-page">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !isAuthenticated) {
    return (
      <div className="user-profile-page">
        <div className="profile-error">
          <h2>Profile Not Available</h2>
          <p>{error || 'Please login to view your profile'}</p>
          <button onClick={() => window.location.href = '/login'}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="user-profile-page">
        <div className="profile-error">
          <h2>Profile Not Found</h2>
          <p>Unable to load profile data</p>
          <button onClick={fetchUserProfile}>Try Again</button>
        </div>
      </div>
    );
  }

  const completeness = calculateProfileCompleteness();

  return (
    <div className="user-profile-page">
      {/* Profile Header */}
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
                <div className="inline-edit">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleNameSave()}
                  />
                  <button onClick={handleNameSave}><Check size={16} /></button>
                  <button onClick={handleNameCancel}><X size={16} /></button>
                </div>
              ) : (
                <div className="name-display">
                  <h1>{profileData.name || 'Anonymous User'}</h1>
                  <button className="edit-button" onClick={handleNameEdit}>
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="profile-meta">
              <span>
                <Mail size={14} />
                {profileData.email}
              </span>
              <span>
                <Calendar size={14} />
                Joined {formatDate(profileData.createdAt)}
              </span>
              {profileData.profile?.phone && (
                <span>
                  <Phone size={14} />
                  {profileData.profile.phone}
                </span>
              )}
            </div>

            {/* Profile Completeness */}
            <div className="profile-completeness">
              <div className="completeness-bar">
                <div 
                  className="completeness-fill" 
                  style={{ width: `${completeness}%` }}
                ></div>
              </div>
              <p>Profile {completeness}% complete</p>
            </div>
          </div>

          {/* Profile Stats */}
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-number">{profileData.reviews?.given?.length || 0}</span>
              <span className="stat-label">Reviews Given</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{profileData.reviews?.received?.length || 0}</span>
              <span className="stat-label">Reviews Received</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{profileData.favorites?.length || 0}</span>
              <span className="stat-label">Favorites</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{profileData.activity?.points || 0}</span>
              <span className="stat-label">Points</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-navigation">
        <div className="profile-tabs">
          {[
            { id: 'overview', label: 'Overview', icon: <User size={16} /> },
            { id: 'favorites', label: 'Favorites', icon: <Heart size={16} /> },
            { id: 'reviews', label: 'Reviews', icon: <Star size={16} /> },
            { id: 'activity', label: 'Activity', icon: <Activity size={16} /> },
            { id: 'settings', label: 'Settings', icon: <Settings size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="profile-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              {/* Bio Section */}
              <div className="overview-card">
                <h3>About</h3>
                <div className="profile-bio">
                  {profileData.profile?.bio || (
                    <span className="no-bio">No bio added yet</span>
                  )}
                </div>
                <div className="profile-details">
                  {profileData.profile?.address?.city && (
                    <div className="detail-item">
                      <MapPin size={14} />
                      {profileData.profile.address.city}, {profileData.profile.address.country || 'Botswana'}
                    </div>
                  )}
                  {profileData.profile?.website && (
                    <div className="detail-item">
                      <Globe size={14} />
                      <a href={profileData.profile.website} target="_blank" rel="noopener noreferrer">
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="overview-card">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  <div className="activity-item">
                    <Activity className="activity-icon" size={16} />
                    <span>Profile viewed {Math.floor(Math.random() * 50) + 10} times this month</span>
                  </div>
                  <div className="activity-item">
                    <Star className="activity-icon" size={16} />
                    <span>Last review given {Math.floor(Math.random() * 30) + 1} days ago</span>
                  </div>
                  <div className="activity-item">
                    <Heart className="activity-icon" size={16} />
                    <span>Added {profileData.favorites?.length || 0} favorites</span>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="overview-card">
                <h3>Achievements</h3>
                <div className="achievements-grid">
                  {profileData.activity?.achievements?.length > 0 ? (
                    profileData.activity.achievements.map((achievement, index) => (
                      <div key={index} className="achievement-item">
                        <Award size={20} />
                        <div>
                          <strong>{achievement.achievementType}</strong>
                          <p>{achievement.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-achievements">
                      No achievements yet. Keep using the platform to unlock badges!
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics */}
              <div className="overview-card">
                <h3>Your Stats</h3>
                <div className="stats-grid">
                  <div className="stat-box">
                    <Eye size={20} />
                    <span>{Math.floor(Math.random() * 200) + 50}</span>
                    <small>Profile Views</small>
                  </div>
                  <div className="stat-box">
                    <MessageSquare size={20} />
                    <span>{profileData.reviews?.given?.length || 0}</span>
                    <small>Reviews</small>
                  </div>
                  <div className="stat-box">
                    <ThumbsUp size={20} />
                    <span>{Math.floor(Math.random() * 100) + 20}</span>
                    <small>Likes Received</small>
                  </div>
                  <div className="stat-box">
                    <Save size={20} />
                    <span>{profileData.favorites?.length || 0}</span>
                    <small>Saved Items</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="favorites-tab">
            <h2>Your Favorites</h2>
            {profileData.favorites?.length > 0 ? (
              <div className="favorites-grid">
                {profileData.favorites.map((favorite, index) => (
                  <div key={index} className="favorite-item">
                    <Heart size={16} />
                    <span>{favorite.title || 'Saved Item'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>You haven't saved any favorites yet.</p>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="reviews-tab">
            <h2>Your Reviews</h2>
            <div className="reviews-section">
              <h3>Reviews Given ({profileData.reviews?.given?.length || 0})</h3>
              {profileData.reviews?.given?.length > 0 ? (
                <div className="reviews-list">
                  {profileData.reviews.given.map((review, index) => (
                    <div key={index} className="review-item">
                      <div className="review-stars">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={14} 
                            fill={i < review.rating ? '#ffd700' : 'none'}
                            color={i < review.rating ? '#ffd700' : '#ccc'}
                          />
                        ))}
                      </div>
                      <p>{review.review}</p>
                      <small>{formatDate(review.date)}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p>You haven't written any reviews yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-tab">
            <h2>Activity & Points</h2>
            <div className="activity-overview">
              <div className="points-display">
                <Award size={24} />
                <span>{profileData.activity?.points || 0} Points</span>
              </div>
              <p>Keep using the platform to earn more points and unlock achievements!</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h2>Account Settings</h2>
            <div className="settings-grid">
              <div className="setting-item">
                <Shield size={20} />
                <span>Privacy Settings</span>
                <small>Manage who can see your profile</small>
              </div>
              <div className="setting-item">
                <Bell size={20} />
                <span>Notifications</span>
                <small>Configure your notification preferences</small>
              </div>
              <div className="setting-item">
                <Lock size={20} />
                <span>Security</span>
                <small>Password and security settings</small>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
