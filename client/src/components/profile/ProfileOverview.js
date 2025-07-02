// client/src/components/profile/ProfileOverview.js
import React, { useState } from 'react';
import { 
  User, Shield, Activity, Calendar, Mail, Phone, 
  MapPin, Heart, Car, Settings, Star, CheckCircle,
  Award, TrendingUp, Eye, Edit, Clock, Target,
  BarChart3, Users, Route, Wrench, Plus, ExternalLink
} from 'lucide-react';
import './ProfileOverview.css';

const ProfileOverview = ({ profileData, refreshProfile }) => {
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);

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
    
    if (profileData.businessProfile?.services?.length > 0) {
      badges.push({ label: 'Service Provider', icon: Settings, color: 'orange' });
    }

    if (profileData.vehicles?.length > 3) {
      badges.push({ label: 'Vehicle Owner', icon: Car, color: 'blue' });
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
    if (profileData.profile?.location) score += 10;
    if (profileData.profile?.dateOfBirth) score += 10;
    
    // Business info (30 points)
    if (profileData.businessProfile?.services?.length > 0) score += 15;
    if (profileData.vehicles?.length > 0) score += 15;
    
    return Math.round((score / maxScore) * 100);
  };

  const getProfileStrengthColor = (strength) => {
    if (strength >= 80) return 'excellent';
    if (strength >= 60) return 'good';
    if (strength >= 40) return 'fair';
    return 'poor';
  };

  const getQuickStats = () => {
    return [
      {
        label: 'Services',
        value: profileData.businessProfile?.services?.length || 0,
        icon: Settings,
        trend: '+2 this month',
        color: 'orange'
      },
      {
        label: 'Vehicles',
        value: profileData.vehicles?.length || 0,
        icon: Car,
        trend: 'Personal fleet',
        color: 'blue'
      },
      {
        label: 'Routes',
        value: profileData.businessProfile?.routes?.length || 0,
        icon: Route,
        trend: 'Active routes',
        color: 'green'
      },
      {
        label: 'Favorites',
        value: profileData.favorites?.length || 0,
        icon: Heart,
        trend: 'Saved items',
        color: 'purple'
      }
    ];
  };

  const getRecentActivity = () => {
    // Mock recent activity - in real app this would come from backend
    return [
      {
        icon: Car,
        action: 'Added new vehicle',
        item: '2023 Toyota Corolla',
        time: '2 hours ago',
        type: 'vehicle'
      },
      {
        icon: Settings,
        action: 'Updated service',
        item: 'Taxi Service',
        time: '1 day ago',
        type: 'service'
      },
      {
        icon: Heart,
        action: 'Favorited listing',
        item: 'BMW X5 2022',
        time: '3 days ago',
        type: 'favorite'
      },
      {
        icon: Star,
        action: 'Received review',
        item: '5-star rating',
        time: '1 week ago',
        type: 'review'
      }
    ];
  };

  const getSuggestedActions = () => {
    const suggestions = [];
    
    if (!profileData.avatar?.url) {
      suggestions.push({
        icon: User,
        title: 'Add Profile Photo',
        description: 'Upload a profile photo to build trust',
        action: 'Upload Photo',
        priority: 'high'
      });
    }
    
    if (!profileData.profile?.bio) {
      suggestions.push({
        icon: Edit,
        title: 'Complete Your Bio',
        description: 'Tell others about yourself',
        action: 'Add Bio',
        priority: 'medium'
      });
    }
    
    if (profileData.businessProfile?.services?.length === 0) {
      suggestions.push({
        icon: Plus,
        title: 'Register Your Service',
        description: 'Start offering your services',
        action: 'Add Service',
        priority: 'high'
      });
    }
    
    if (profileData.vehicles?.length === 0) {
      suggestions.push({
        icon: Car,
        title: 'Add Your Vehicle',
        description: 'Showcase your cars',
        action: 'Add Vehicle',
        priority: 'medium'
      });
    }
    
    return suggestions.slice(0, 3); // Show top 3 suggestions
  };

  const profileStrength = calculateProfileStrength();
  const strengthColor = getProfileStrengthColor(profileStrength);
  const badges = getUserBadges();
  const quickStats = getQuickStats();
  const recentActivity = getRecentActivity();
  const suggestedActions = getSuggestedActions();

  return (
    <div className="poverview-main-container">
      {/* Profile Strength Section */}
      <div className="poverview-strength-section">
        <div className="poverview-section-header">
          <h3 className="poverview-section-title">
            <Target size={20} />
            Profile Strength
          </h3>
          <span className={`poverview-strength-score poverview-strength-${strengthColor}`}>
            {profileStrength}%
          </span>
        </div>
        
        <div className="poverview-strength-bar-container">
          <div className="poverview-strength-bar">
            <div 
              className={`poverview-strength-progress poverview-strength-${strengthColor}`}
              style={{ width: `${profileStrength}%` }}
            ></div>
          </div>
        </div>
        
        <div className="poverview-strength-description">
          {profileStrength >= 80 && "Excellent! Your profile is complete and optimized."}
          {profileStrength >= 60 && profileStrength < 80 && "Good profile! Consider adding more details."}
          {profileStrength >= 40 && profileStrength < 60 && "Fair profile. Add more information to improve visibility."}
          {profileStrength < 40 && "Your profile needs more information to attract customers."}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="poverview-stats-section">
        <div className="poverview-section-header">
          <h3 className="poverview-section-title">
            <BarChart3 size={20} />
            Quick Stats
          </h3>
        </div>
        
        <div className="poverview-stats-grid">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className={`poverview-stat-card poverview-stat-${stat.color}`}>
                <div className="poverview-stat-icon">
                  <IconComponent size={24} />
                </div>
                <div className="poverview-stat-content">
                  <div className="poverview-stat-value">{stat.value}</div>
                  <div className="poverview-stat-label">{stat.label}</div>
                  <div className="poverview-stat-trend">{stat.trend}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges Section */}
      {badges.length > 0 && (
        <div className="poverview-badges-section">
          <div className="poverview-section-header">
            <h3 className="poverview-section-title">
              <Award size={20} />
              Your Badges
            </h3>
          </div>
          
          <div className="poverview-badges-grid">
            {badges.map((badge, index) => {
              const IconComponent = badge.icon;
              return (
                <div key={index} className={`poverview-badge poverview-badge-${badge.color}`}>
                  <IconComponent size={16} />
                  <span>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="poverview-account-section">
        <div className="poverview-section-header">
          <h3 className="poverview-section-title">
            <User size={20} />
            Account Information
          </h3>
        </div>
        
        <div className="poverview-account-info">
          <div className="poverview-info-grid">
            <div className="poverview-info-item">
              <Mail size={16} />
              <div className="poverview-info-content">
                <div className="poverview-info-label">Email</div>
                <div className="poverview-info-value">{profileData.email || 'Not provided'}</div>
              </div>
            </div>
            
            {profileData.profile?.phone && (
              <div className="poverview-info-item">
                <Phone size={16} />
                <div className="poverview-info-content">
                  <div className="poverview-info-label">Phone</div>
                  <div className="poverview-info-value">{profileData.profile.phone}</div>
                </div>
              </div>
            )}
            
            {profileData.profile?.location && (
              <div className="poverview-info-item">
                <MapPin size={16} />
                <div className="poverview-info-content">
                  <div className="poverview-info-label">Location</div>
                  <div className="poverview-info-value">{profileData.profile.location}</div>
                </div>
              </div>
            )}
            
            <div className="poverview-info-item">
              <Calendar size={16} />
              <div className="poverview-info-content">
                <div className="poverview-info-label">Member Since</div>
                <div className="poverview-info-value">{formatDate(profileData.createdAt)} • {getAccountAge()}</div>
              </div>
            </div>
          </div>
          
          {profileData.profile?.bio && (
            <div className="poverview-bio-section">
              <div className="poverview-bio-label">Bio</div>
              <div className="poverview-bio-content">{profileData.profile.bio}</div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="poverview-activity-section">
        <div className="poverview-section-header">
          <h3 className="poverview-section-title">
            <Activity size={20} />
            Recent Activity
          </h3>
        </div>
        
        <div className="poverview-activity-list">
          {recentActivity.map((activity, index) => {
            const IconComponent = activity.icon;
            return (
              <div key={index} className="poverview-activity-item">
                <div className={`poverview-activity-icon poverview-activity-${activity.type}`}>
                  <IconComponent size={16} />
                </div>
                <div className="poverview-activity-content">
                  <div className="poverview-activity-text">
                    <span className="poverview-activity-action">{activity.action}</span>
                    <span className="poverview-activity-item-name">{activity.item}</span>
                  </div>
                  <div className="poverview-activity-time">{activity.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Actions */}
      {suggestedActions.length > 0 && (
        <div className="poverview-suggestions-section">
          <div className="poverview-section-header">
            <h3 className="poverview-section-title">
              <TrendingUp size={20} />
              Suggested Actions
            </h3>
            <button 
              className="poverview-toggle-suggestions"
              onClick={() => setShowEditSuggestions(!showEditSuggestions)}
            >
              {showEditSuggestions ? 'Hide' : 'Show'} Suggestions
            </button>
          </div>
          
          {showEditSuggestions && (
            <div className="poverview-suggestions-list">
              {suggestedActions.map((suggestion, index) => {
                const IconComponent = suggestion.icon;
                return (
                  <div key={index} className={`poverview-suggestion-item poverview-priority-${suggestion.priority}`}>
                    <div className="poverview-suggestion-icon">
                      <IconComponent size={20} />
                    </div>
                    <div className="poverview-suggestion-content">
                      <div className="poverview-suggestion-title">{suggestion.title}</div>
                      <div className="poverview-suggestion-description">{suggestion.description}</div>
                    </div>
                    <button className="poverview-suggestion-action">
                      {suggestion.action}
                      <ExternalLink size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileOverview;
