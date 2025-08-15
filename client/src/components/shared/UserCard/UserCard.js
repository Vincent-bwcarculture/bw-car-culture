// client/src/components/shared/UserCard/UserCard.js
import React, { useState } from 'react';
import { 
  MapPin, 
  UserCheck, 
  UserPlus, 
  MessageCircle, 
  ExternalLink,
  Eye,
  Car,
  Shield,
  Calendar,
  Star,
  MoreHorizontal,
  Mail,
  Phone,
  Award
} from 'lucide-react';
import './UserCard.css';

const UserCard = ({ 
  user, 
  isFollowing, 
  onFollowToggle, 
  viewMode = 'grid',
  onMessage,
  onViewProfile,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Reset image state when user changes
  React.useEffect(() => {
    setImageError(false);
    setImageLoading(true);
    setRetryCount(0);
  }, [user._id, user.id]);

  // Get user type display name with better formatting
  const getUserTypeDisplay = (role) => {
    const roleMap = {
      'business_owner': 'Business Owner',
      'dealership_owner': 'Dealership Owner',
      'transport_coordinator': 'Transport Coordinator',
      'combi_driver': 'Combi Driver',
      'taxi_driver': 'Taxi Driver', 
      'driver': 'Professional Driver',
      'ministry_official': 'Ministry Official',
      'government_admin': 'Government Admin',
      'mechanic': 'Auto Mechanic',
      'parts_supplier': 'Parts Supplier',
      'service_provider': 'Service Provider',
      'user': 'Community Member'
    };
    return roleMap[role] || role || 'Community Member';
  };

  // Enhanced avatar logic to handle multiple possible field names
  const getUserAvatar = () => {
    // Debug: Log the user object to see what fields are available
    console.log('User data for avatar:', {
      userId: user._id || user.id,
      userName: user.name,
      avatar: user.avatar,
      profilePicture: user.profilePicture,
      picture: user.picture,
      image: user.image,
      allKeys: Object.keys(user)
    });

    if (imageError) {
      console.log('Image error occurred, using fallback avatar');
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=1a1a1a&color=ff3300&size=150&bold=true&format=svg`;
    }

    // Check multiple possible avatar field names
    const possibleAvatars = [
      user.avatar?.url,
      user.avatar,
      user.profilePicture?.url,
      user.profilePicture,
      user.picture?.url,
      user.picture,
      user.image?.url,
      user.image,
      user.photo?.url,
      user.photo
    ];

    console.log('Checking possible avatars:', possibleAvatars);

    // Find the first valid avatar URL
    const avatarUrl = possibleAvatars.find(url => 
      url && 
      typeof url === 'string' && 
      url.trim() !== '' &&
      url !== 'null' &&
      url !== 'undefined'
    );

    console.log('Selected avatar URL:', avatarUrl);

    if (avatarUrl) {
      // Handle different URL types
      let processedUrl = avatarUrl;

      // Handle relative URLs by making them absolute
      if (avatarUrl.startsWith('/')) {
        processedUrl = `${window.location.origin}${avatarUrl}`;
      }
      // Handle AWS S3 URLs that might be incomplete
      else if (avatarUrl.includes('s3') && !avatarUrl.startsWith('http')) {
        processedUrl = `https://${avatarUrl}`;
      }
      // Handle other cloud storage URLs
      else if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
        // If it doesn't start with http and isn't a data URL, it might be a cloud storage key
        // Try to construct a proper URL (adjust this based on your storage setup)
        if (avatarUrl.includes('amazonaws.com') || avatarUrl.includes('s3')) {
          processedUrl = avatarUrl.startsWith('//') ? `https:${avatarUrl}` : `https://${avatarUrl}`;
        } else {
          // For other cases, assume it's relative to your domain
          processedUrl = `${window.location.origin}/${avatarUrl}`;
        }
      }

      console.log('Processed avatar URL:', processedUrl);
      return processedUrl;
    }

    console.log('No valid avatar found, using generated avatar');
    // Fallback to generated avatar
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=1a1a1a&color=ff3300&size=150&bold=true&format=svg`;
  };

  // Get role color for visual distinction (using theme colors)
  const getRoleColor = (role) => {
    const colorMap = {
      'business_owner': '#ff3300', // Primary accent
      'dealership_owner': '#ff3300', 
      'transport_coordinator': '#f39c12',
      'driver': '#27ae60',
      'combi_driver': '#27ae60',
      'taxi_driver': '#27ae60',
      'ministry_official': '#9b59b6',
      'government_admin': '#9b59b6',
      'mechanic': '#3498db',
      'service_provider': '#16a085',
      'user': '#7f8c8d'
    };
    return colorMap[role] || '#7f8c8d';
  };

  // Format member since date
  const formatMemberSince = (date) => {
    if (!date) return 'Recently joined';
    const memberDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now - memberDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return 'New member';
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  };

  // Handle image loading
  const handleImageLoad = () => {
    console.log('Image loaded successfully for user:', user.name);
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = (e) => {
    console.log('Image failed to load for user:', user.name, 'URL:', e.target.src);
    setImageLoading(false);
    setImageError(true);
  };

  // Handle follow button click
  const handleFollowClick = (e) => {
    e.stopPropagation();
    onFollowToggle?.();
  };

  // Handle message button click
  const handleMessageClick = (e) => {
    e.stopPropagation();
    onMessage?.(user);
  };

  // Handle view profile click
  const handleViewProfileClick = (e) => {
    e.stopPropagation();
    onViewProfile?.(user);
  };

  // Handle card click
  const handleCardClick = () => {
    onViewProfile?.(user);
  };

  return (
    <div 
      className={`usercard-container ${viewMode} ${className}`}
      onClick={handleCardClick}
    >
      {/* Card Header */}
      <div className="usercard-header">
        <div className="usercard-avatar-container">
          <div className="usercard-avatar-wrapper">
            {imageLoading && !imageError && (
              <div className="usercard-avatar-loading">
                <div className="usercard-avatar-spinner"></div>
              </div>
            )}
            <img 
              src={getUserAvatar()} 
              alt={user.name}
              className={`usercard-avatar ${imageLoading ? 'loading' : ''}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: imageLoading && !imageError ? 'none' : 'block' }}
              key={`${user._id || user.id}-${retryCount}`} // Force reload on retry
            />
            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && imageError && (
              <div 
                className="usercard-avatar-debug" 
                title="Click to retry loading image"
                onClick={() => {
                  setRetryCount(prev => prev + 1);
                  setImageError(false);
                  setImageLoading(true);
                }}
                style={{
                  position: 'absolute',
                  top: '-5px',
                  left: '-5px',
                  background: 'red',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                ❌
              </div>
            )}
          </div>
          {(user.isVerified || user.emailVerified) && (
            <div className="usercard-verified-badge" title="Verified User">
              <Shield size={12} />
            </div>
          )}
          <div 
            className="usercard-role-indicator"
            style={{ backgroundColor: getRoleColor(user.role) }}
          />
        </div>
        
        <div className="usercard-info">
          <div className="usercard-name-row">
            <h3 className="usercard-name">
              {user.name}
              {user.emailVerified && (
                <span className="usercard-verified-icon" title="Verified Email">
                  <Award size={16} />
                </span>
              )}
            </h3>
            {viewMode === 'grid' && (
              <button className="usercard-menu-btn" title="More options">
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>
          
          <p className="usercard-role" style={{ color: getRoleColor(user.role) }}>
            {getUserTypeDisplay(user.role)}
          </p>
          
          {user.city && (
            <p className="usercard-location">
              <MapPin size={14} />
              <span>{user.city}</span>
            </p>
          )}
        </div>

        {viewMode === 'grid' && (
          <button 
            className={`usercard-follow-btn ${isFollowing ? 'following' : ''}`}
            onClick={handleFollowClick}
            title={isFollowing ? 'Unfollow' : 'Follow'}
          >
            {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
            <span className="usercard-follow-btn-text">
              {isFollowing ? 'Following' : 'Follow'}
            </span>
          </button>
        )}
      </div>

      {/* Bio Section (Grid view only) */}
      {viewMode === 'grid' && user.bio && (
        <div className="usercard-bio">
          <p>{user.bio}</p>
        </div>
      )}

      {/* Stats Section */}
      <div className="usercard-stats">
        {user.totalListings && (
          <div className="usercard-stat">
            <Car size={14} />
            <span>{user.totalListings} listing{user.totalListings !== 1 ? 's' : ''}</span>
          </div>
        )}
        
        <div className="usercard-stat">
          <Calendar size={14} />
          <span>{formatMemberSince(user.createdAt || user.memberSince)}</span>
        </div>

        {user.rating && (
          <div className="usercard-stat">
            <Star size={14} />
            <span>{user.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="usercard-actions">
        {viewMode === 'list' && (
          <button 
            className={`usercard-follow-btn compact ${isFollowing ? 'following' : ''}`}
            onClick={handleFollowClick}
            title={isFollowing ? 'Unfollow' : 'Follow'}
          >
            {isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
            <span className="usercard-follow-btn-text">
              {isFollowing ? 'Following' : 'Follow'}
            </span>
          </button>
        )}
        
        <button 
          className="usercard-action-btn message"
          onClick={handleMessageClick}
          title="Send message"
        >
          <MessageCircle size={16} />
          <span>Message</span>
        </button>
        
        <button 
          className="usercard-action-btn profile"
          onClick={handleViewProfileClick}
          title="View profile"
        >
          <ExternalLink size={16} />
          <span>Profile</span>
        </button>
      </div>

      {/* Hover Overlay (Grid view only) */}
      {viewMode === 'grid' && (
        <div className="usercard-overlay">
          <div className="usercard-overlay-actions">
            <button className="usercard-overlay-btn" title="View Profile">
              <Eye size={20} />
            </button>
            <button className="usercard-overlay-btn" title="Send Message">
              <MessageCircle size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCard;
