// client/src/components/profile/ProfileOverview.js
import React from 'react';
import { 
  User, Shield, Activity, Calendar, Mail, Phone, 
  MapPin, Heart, Car, Settings, Star, CheckCircle,
  Award, TrendingUp
} from 'lucide-react';

const ProfileOverview = ({ profileData, refreshProfile }) => {
  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAccountAge = () => {
    if (!profileData.createdAt) return 'Unknown';
    
    const createdDate = new Date(profileData.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} months`;
    } else {
      return `${Math.floor(diffDays / 365)} years`;
    }
  };

  const getUserBadges = () => {
    const badges = [];
    
    if (profileData.role === 'admin') {
      badges.push({ label: 'Administrator', icon: Shield, color: 'red' });
    }
    
    if (profileData.businessProfile?.services?.some(s => s.isVerified)) {
      badges.push({ label: 'Verified Provider', icon: CheckCircle, color: 'green' });
    }
    
    if (profileData.dealership) {
      badges.push({ label: 'Dealer', icon: Car, color: 'blue' });
    }
    
    if (profileData.favorites?.length > 10) {
      badges.push({ label: 'Active Browser', icon: Heart, color: 'purple' });
    }
    
    return badges;
  };

  const calculateProfileStrength = () => {
    let score = 0;
    let maxScore = 100;
    
    // Basic info (40 points)
    if (profileData.name) score += 10;
    if (profileData.email) score += 10;
    if (profileData.avatar?.url) score += 10;
    if (profileData.profile?.phone) score += 10;
    
    // Extended profile (30 points)
    if (profileData.profile?.bio) score += 10;
    if (profileData.profile?.address?.city) score += 10;
    if (profileData.profile?.dateOfBirth) score += 10;
    
    // Business/verification (30 points)
    if (profileData.businessProfile?.services?.length > 0) score += 15;
    if (profileData.businessProfile?.services?.some(s => s.isVerified)) score += 15;
    
    return Math.round((score / maxScore) * 100);
  };

  const badges = getUserBadges();
  const profileStrength = calculateProfileStrength();

  return (
    <div className="overview-tab">
      <div className="overview-grid">
        {/* Personal Information Card */}
        <div className="info-card">
          <div className="card-header">
            <h3><User size={20} /> Personal Information</h3>
          </div>
          <div className="card-content">
            <div className="info-item">
              <strong>Full Name:</strong>
              <span>{profileData.name || 'Not set'}</span>
            </div>
            <div className="info-item">
              <strong>Email:</strong>
              <span>{profileData.email}</span>
            </div>
            <div className="info-item">
              <strong>Phone:</strong>
              <span>{profileData.profile?.phone || 'Not set'}</span>
            </div>
            <div className="info-item">
              <strong>Location:</strong>
              <span>{profileData.profile?.address?.city || 'Not set'}</span>
            </div>
          </div>
        </div>

        {/* Account Information Card */}
        <div className="info-card">
          <div className="card-header">
            <h3><Shield size={20} /> Account Information</h3>
          </div>
          <div className="card-content">
            <div className="info-item">
              <strong>Member Since:</strong>
              <span>{formatDate(profileData.createdAt)}</span>
            </div>
            <div className="info-item">
              <strong>Account Age:</strong>
              <span>{getAccountAge()}</span>
            </div>
            <div className="info-item">
              <strong>Last Login:</strong>
              <span>{formatDate(profileData.lastLogin)}</span>
            </div>
            <div className="info-item">
              <strong>Account Status:</strong>
              <span className="status-active">Active</span>
            </div>
          </div>
        </div>

        {/* Activity Summary Card */}
        <div className="info-card">
          <div className="card-header">
            <h3><Activity size={20} /> Activity Summary</h3>
          </div>
          <div className="card-content">
            <div className="info-item">
              <strong>Favorites:</strong>
              <span>{profileData.favorites?.length || 0} items</span>
            </div>
            <div className="info-item">
              <strong>Services Registered:</strong>
              <span>{profileData.businessProfile?.services?.length || 0}</span>
            </div>
            <div className="info-item">
              <strong>Verified Services:</strong>
              <span>{profileData.businessProfile?.services?.filter(s => s.isVerified).length || 0}</span>
            </div>
            <div className="info-item">
              <strong>Vehicles Added:</strong>
              <span>{profileData.vehicles?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Profile Strength Card */}
        <div className="info-card">
          <div className="card-header">
            <h3><TrendingUp size={20} /> Profile Strength</h3>
          </div>
          <div className="card-content">
            <div className="profile-strength-meter">
              <div className="strength-bar">
                <div 
                  className="strength-fill" 
                  style={{ width: `${profileStrength}%` }}
                ></div>
              </div>
              <div className="strength-text">
                <span className="strength-percentage">{profileStrength}%</span>
                <span className="strength-label">Complete</span>
              </div>
            </div>
            
            <div className="strength-tips">
              <h4>Improve your profile:</h4>
              <ul>
                {!profileData.avatar?.url && <li>Add a profile photo</li>}
                {!profileData.profile?.phone && <li>Add your phone number</li>}
                {!profileData.profile?.bio && <li>Write a bio</li>}
                {!profileData.profile?.address?.city && <li>Add your location</li>}
                {profileData.businessProfile?.services?.length === 0 && <li>Register a service</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Badges and Achievements */}
        {badges.length > 0 && (
          <div className="info-card">
            <div className="card-header">
              <h3><Award size={20} /> Badges & Achievements</h3>
            </div>
            <div className="card-content">
              <div className="badges-grid">
                {badges.map((badge, index) => {
                  const Icon = badge.icon;
                  return (
                    <div key={index} className={`badge-item ${badge.color}`}>
                      <Icon size={16} />
                      <span>{badge.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Recent Favorites */}
        {profileData.favorites && profileData.favorites.length > 0 && (
          <div className="info-card">
            <div className="card-header">
              <h3><Heart size={20} /> Recent Favorites</h3>
            </div>
            <div className="card-content">
              <div className="recent-favorites">
                {profileData.favorites.slice(0, 3).map((favorite, index) => (
                  <div key={index} className="favorite-item">
                    <div className="favorite-image">
                      {favorite.images?.main ? (
                        <img src={favorite.images.main} alt={favorite.title} />
                      ) : (
                        <div className="no-image">
                          <Car size={20} />
                        </div>
                      )}
                    </div>
                    <div className="favorite-info">
                      <h5>{favorite.title}</h5>
                      <p>{favorite.location}</p>
                      <span>{favorite.price}</span>
                    </div>
                  </div>
                ))}
              </div>
              {profileData.favorites.length > 3 && (
                <p className="view-all">
                  +{profileData.favorites.length - 3} more favorites
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileOverview;
