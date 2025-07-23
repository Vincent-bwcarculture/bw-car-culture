// client/src/components/profile/ProfileOverview.js
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Award, 
  Heart, 
  Settings, 
  Car, 
  Route,
  ChevronRight,
  Plus,
  Eye
} from 'lucide-react';
import './ProfileOverview.css';
import RoleSelectionComponent from './RoleSelectionComponent.js'; // Import the new component

const ProfileOverview = ({ profileData, refreshProfile }) => {
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const getBadges = () => {
    const badges = [];
    
    if (profileData.isVerified) {
      badges.push({ label: 'Verified Account', icon: Award, color: 'green' });
    }
    
    if (profileData.role === 'admin') {
      badges.push({ label: 'Administrator', icon: Settings, color: 'red' });
    }
    
    // Add badges for new business roles
    if (profileData.role === 'dealership_admin') {
      badges.push({ label: 'Dealership Admin', icon: Car, color: 'blue' });
    }
    
    if (profileData.role === 'transport_admin') {
      badges.push({ label: 'Transport Admin', icon: Route, color: 'purple' });
    }
    
    if (profileData.role === 'rental_admin') {
      badges.push({ label: 'Rental Admin', icon: Car, color: 'orange' });
    }
    
    if (profileData.role === 'transport_coordinator') {
      badges.push({ label: 'Transport Coordinator', icon: MapPin, color: 'green' });
    }
    
    if (profileData.role === 'taxi_driver') {
      badges.push({ label: 'Taxi Driver', icon: Car, color: 'yellow' });
    }
    
    if (profileData.role === 'ministry_official') {
      badges.push({ label: 'Ministry Official', icon: Award, color: 'red' });
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

  const getProfileSuggestions = () => {
    const suggestions = [];
    
    if (!profileData.avatar?.url) {
      suggestions.push({
        title: 'Add Profile Picture',
        description: 'A profile picture helps others recognize you',
        action: 'Upload Photo',
        icon: User
      });
    }
    
    if (!profileData.profile?.bio) {
      suggestions.push({
        title: 'Write a Bio',
        description: 'Tell others about yourself and your interests',
        action: 'Add Bio',
        icon: User
      });
    }
    
    if (!profileData.profile?.phone) {
      suggestions.push({
        title: 'Add Phone Number',
        description: 'Make it easier for contacts to reach you',
        action: 'Add Phone',
        icon: Phone
      });
    }
    
    if (!profileData.profile?.location) {
      suggestions.push({
        title: 'Add Location',
        description: 'Help others find services in your area',
        action: 'Add Location',
        icon: MapPin
      });
    }
    
    return suggestions;
  };

  const formatJoinDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Enhanced account type display function
  const getAccountTypeDisplay = (role) => {
    const roleMap = {
      'admin': 'Administrator',
      'provider': 'Service Provider',
      'dealer': 'Dealer',
      'dealership_admin': 'Dealership Administrator',
      'transport_admin': 'Public Transport Administrator',
      'rental_admin': 'Car Rental Administrator',
      'transport_coordinator': 'Public Transport Coordinator',
      'taxi_driver': 'Professional Taxi Driver',
      'ministry_official': 'Ministry Official',
      'user': 'Personal User'
    };
    
    return roleMap[role] || 'Personal User';
  };

  const profileStrength = calculateProfileStrength();
  const strengthColor = getProfileStrengthColor(profileStrength);
  const badges = getBadges();
  const suggestions = getProfileSuggestions();

  return (
    <div className="poverview-main-container">
      {/* Profile Strength Section */}
      <div className="poverview-strength-section">
        <div className="poverview-section-header">
          <h3 className="poverview-section-title">
            <Eye size={20} />
            Profile Strength
          </h3>
          <span className={`poverview-strength-badge poverview-strength-${strengthColor}`}>
            {profileStrength}%
          </span>
        </div>
        
        <div className="poverview-strength-bar-container">
          <div className="poverview-strength-bar">
            <div 
              className={`poverview-strength-fill poverview-strength-${strengthColor}`}
              style={{ width: `${profileStrength}%` }}
            ></div>
          </div>
          <div className="poverview-strength-text">
            {profileStrength >= 80 && "Your profile is complete and optimized."}
            {profileStrength >= 60 && profileStrength < 80 && "Good profile! Consider adding more details."}
            {profileStrength >= 40 && profileStrength < 60 && "Fair profile. Add more information to improve visibility."}
            {profileStrength < 40 && "Your profile needs more information to attract customers."}
          </div>
        </div>
      </div>

      {/* ROLE SELECTION COMPONENT - NEW INTEGRATION */}
      <RoleSelectionComponent 
        profileData={profileData} 
        refreshProfile={refreshProfile} 
      />

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
              <Mail size={18} />
              <div className="poverview-info-content">
                <strong>Email</strong>
                <span>{profileData.email}</span>
              </div>
            </div>
            
            {profileData.profile?.phone && (
              <div className="poverview-info-item">
                <Phone size={18} />
                <div className="poverview-info-content">
                  <strong>Phone</strong>
                  <span>{profileData.profile.phone}</span>
                </div>
              </div>
            )}
            
            {profileData.profile?.location && (
              <div className="poverview-info-item">
                <MapPin size={18} />
                <div className="poverview-info-content">
                  <strong>Location</strong>
                  <span>{profileData.profile.location}</span>
                </div>
              </div>
            )}
            
            <div className="poverview-info-item">
              <Calendar size={18} />
              <div className="poverview-info-content">
                <strong>Member Since</strong>
                <span>{formatJoinDate(profileData.createdAt)}</span>
              </div>
            </div>
            
            <div className="poverview-info-item">
              <User size={18} />
              <div className="poverview-info-content">
                <strong>Account Type</strong>
                <span>{getAccountTypeDisplay(profileData.role)}</span>
              </div>
            </div>
            
            {profileData.profile?.dateOfBirth && (
              <div className="poverview-info-item">
                <Calendar size={18} />
                <div className="poverview-info-content">
                  <strong>Date of Birth</strong>
                  <span>{new Date(profileData.profile.dateOfBirth).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Improvement Suggestions */}
      {suggestions.length > 0 && (
        <div className="poverview-suggestions-section">
          <div className="poverview-section-header">
            <h3 className="poverview-section-title">
              <Plus size={20} />
              Improve Your Profile
            </h3>
            {suggestions.length > 3 && (
              <button 
                className="poverview-toggle-suggestions"
                onClick={() => setShowAllSuggestions(!showAllSuggestions)}
              >
                {showAllSuggestions ? 'Show Less' : `Show All (${suggestions.length})`}
              </button>
            )}
          </div>
          
          <div className="poverview-suggestions-grid">
            {(showAllSuggestions ? suggestions : suggestions.slice(0, 3)).map((suggestion, index) => {
              const IconComponent = suggestion.icon;
              return (
                <div key={index} className="poverview-suggestion-item">
                  <div className="poverview-suggestion-icon">
                    <IconComponent size={20} />
                  </div>
                  <div className="poverview-suggestion-content">
                    <h4>{suggestion.title}</h4>
                    <p>{suggestion.description}</p>
                    <button className="poverview-suggestion-action">
                      {suggestion.action}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileOverview;
