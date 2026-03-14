// client/src/components/shared/UserCard/UserCard.js
import React, { useState, useRef } from 'react';
import {
  MapPin,
  UserCheck,
  UserPlus,
  MessageCircle,
  ExternalLink,
  Car,
  Shield,
  Award,
  Users,
  MoreHorizontal,
  ThumbsUp,
  Reply,
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import './UserCard.css';

const API_BASE = 'https://bw-car-culture-api.vercel.app/api';

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

  // Engagement state
  const [showEngagement, setShowEngagement] = useState(false);
  const [engagements, setEngagements] = useState([]);
  const [engLoading, setEngLoading] = useState(false);
  const [newText, setNewText] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // engagement _id
  const [replyText, setReplyText] = useState('');
  const inputRef = useRef(null);

  const token = localStorage.getItem('token');
  const currentUser = (() => { try { const p = localStorage.getItem('user'); return p ? JSON.parse(p) : null; } catch { return null; } })();

  const fetchEngagements = async () => {
    if (engagements.length > 0) return; // already loaded
    setEngLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${user._id || user.id}/engagements`);
      const data = await res.json();
      if (data.success) setEngagements(data.data);
    } catch {}
    setEngLoading(false);
  };

  const handleToggleEngagement = () => {
    if (!showEngagement) fetchEngagements();
    setShowEngagement(prev => !prev);
  };

  const handlePost = async () => {
    const text = newText.trim();
    if (!text || !token) return;
    setPosting(true);
    try {
      const res = await fetch(`${API_BASE}/users/${user._id || user.id}/engagements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) {
        setEngagements(prev => [data.data, ...prev]);
        setNewText('');
      }
    } catch {}
    setPosting(false);
  };

  const handleReply = async (engId) => {
    const text = replyText.trim();
    if (!text || !token) return;
    setPosting(true);
    try {
      const res = await fetch(`${API_BASE}/users/${user._id || user.id}/engagements/${engId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.success) {
        setEngagements(prev => prev.map(e => e._id === engId ? data.data : e));
        setReplyingTo(null);
        setReplyText('');
      }
    } catch {}
    setPosting(false);
  };

  const handleLike = async (engId) => {
    if (!token) return;
    const userId = currentUser?.id || currentUser?._id;
    // Optimistic
    setEngagements(prev => prev.map(e => {
      if (e._id !== engId) return e;
      const liked = (e.likes || []).includes(userId);
      return { ...e, likes: liked ? e.likes.filter(id => id !== userId) : [...(e.likes || []), userId] };
    }));
    try {
      await fetch(`${API_BASE}/users/${user._id || user.id}/engagements/${engId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch {}
  };

  // Reset image state when user changes
  React.useEffect(() => {
    setImageError(false);
    setImageLoading(true);
    setRetryCount(0);

    // Add timeout to prevent infinite loading
    const timer = setTimeout(() => {
      if (imageLoading) {
        console.log('Image loading timeout for user:', user.name);
        setImageLoading(false);
        setImageError(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
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

  // Enhanced avatar logic - matching the working vehicle card implementation
  const getUserAvatar = () => {
    // Debug: Log the user object exactly like vehicle cards do
    console.log(`User ${user.name} avatar data:`, {
      userId: user._id || user.id,
      userName: user.name,
      hasAvatar: !!user.avatar,
      avatarUrl: user.avatar?.url,
      avatarStructure: user.avatar,
      hasProfilePicture: !!user.profilePicture,
      profilePictureUrl: user.profilePicture?.url,
      allKeys: Object.keys(user)
    });

    let userProfilePicture = null;

    // Use the EXACT SAME logic as working vehicle cards
    if (user.avatar && user.avatar.url) {
      userProfilePicture = user.avatar.url;
      console.log(`✅ Using user avatar.url for ${user.name}: ${userProfilePicture}`);
    } 
    // Fallback: check if avatar is a string directly
    else if (user.avatar && typeof user.avatar === 'string') {
      userProfilePicture = user.avatar;
      console.log(`✅ Using user avatar string for ${user.name}: ${userProfilePicture}`);
    }
    // Additional fallback checks
    else if (user.profilePicture?.url) {
      userProfilePicture = user.profilePicture.url;
      console.log(`✅ Using user profilePicture.url for ${user.name}: ${userProfilePicture}`);
    }
    else if (user.profilePicture && typeof user.profilePicture === 'string') {
      userProfilePicture = user.profilePicture;
      console.log(`✅ Using user profilePicture string for ${user.name}: ${userProfilePicture}`);
    }
    else {
      console.log(`⚠️ No profile picture found for user ${user.name}, using default placeholder`);
    }

    // If we found a profile picture, return it
    if (userProfilePicture) {
      console.log(`Final avatar URL for ${user.name}:`, userProfilePicture);
      return userProfilePicture;
    }

    // If we've had an error or no real image data, use fallback
    if (imageError || !userProfilePicture) {
      console.log('Using fallback avatar for:', user.name);
      // Set error state to skip loading animation
      setTimeout(() => {
        setImageLoading(false);
        setImageError(true);
      }, 0);
      return `https://avatar.vercel.sh/${encodeURIComponent(user.name || 'User')}.svg?size=150`;
    }

    return userProfilePicture;
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

  // Resolve cover picture URL
  const getCoverUrl = () => {
    if (user.coverPicture?.url) return user.coverPicture.url;
    if (typeof user.coverPicture === 'string') return user.coverPicture;
    return null;
  };
  const coverUrl = getCoverUrl();

  const myId = (currentUser?.id || currentUser?._id)?.toString();

  return (
    <div className={`usercard-wrapper ${className}`}>
    <div
      className={`usercard-container ${viewMode}`}
      onClick={handleCardClick}
    >
      {/* Cover Image */}
      {viewMode === 'grid' && (
        <div
          className="usercard-cover"
          style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : {}}
        >
          {!coverUrl && <div className="usercard-cover-placeholder" />}
        </div>
      )}

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
              style={{ 
                display: imageLoading && !imageError ? 'none' : 'block',
                opacity: imageLoading ? 0 : 1,
                transition: 'opacity 0.3s ease'
              }}
              key={`${user._id || user.id}-${retryCount}`} // Force reload on retry
            />
            {/* Fallback: If loading takes too long, show generated avatar */}
            {!imageLoading && imageError && (
              <img 
                src={`https://avatar.vercel.sh/${encodeURIComponent(user.name || 'User')}.svg?size=150`}
                alt={user.name}
                className="usercard-avatar usercard-avatar-fallback"
                style={{ display: 'block' }}
              />
            )}
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
        <div className="usercard-stat">
          <Users size={14} />
          <span>{user.followerCount ?? (user.followers?.length ?? 0)} followers</span>
        </div>

        <div className="usercard-stat">
          <Users size={14} />
          <span>{user.followingCount ?? (user.following?.length ?? 0)} following</span>
        </div>

        {user.totalListings > 0 && (
          <div className="usercard-stat">
            <Car size={14} />
            <span>{user.totalListings} listing{user.totalListings !== 1 ? 's' : ''}</span>
          </div>
        )}

        <div className="usercard-stat">
          <Users size={14} />
          <span>{((user.followerCount ?? (user.followers?.length ?? 0)) + (user.followingCount ?? (user.following?.length ?? 0)))} associates</span>
        </div>
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

        <button
          className={`usercard-action-btn engage ${showEngagement ? 'active' : ''}`}
          onClick={e => { e.stopPropagation(); handleToggleEngagement(); }}
          title="Engage"
        >
          <MessageCircle size={16} />
          <span>Engage</span>
          {showEngagement ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
    </div>

    {/* ── Engagement thread ── */}
    {showEngagement && (
      <div className="uc-thread" onClick={e => e.stopPropagation()}>
        {/* Input row */}
        {token ? (
          <div className="uc-thread-input-row">
            <img
              className="uc-thread-avatar"
              src={currentUser?.avatar?.url || `https://avatar.vercel.sh/${encodeURIComponent(currentUser?.name || 'me')}.svg?size=40`}
              alt="me"
            />
            <input
              ref={inputRef}
              className="uc-thread-input"
              placeholder={`Say something to ${user.name}…`}
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
            />
            <button className="uc-thread-send" onClick={handlePost} disabled={posting || !newText.trim()}>
              <Send size={15} />
            </button>
          </div>
        ) : (
          <p className="uc-thread-login">Sign in to engage with {user.name}</p>
        )}

        {/* Engagements list */}
        {engLoading ? (
          <p className="uc-thread-loading">Loading…</p>
        ) : engagements.length === 0 ? (
          <p className="uc-thread-empty">No engagements yet. Be the first!</p>
        ) : (
          <div className="uc-thread-list">
            {engagements.map(eng => {
              const likedByMe = myId && (eng.likes || []).map(String).includes(myId);
              return (
                <div key={eng._id} className="uc-eng">
                  <img
                    className="uc-eng-avatar"
                    src={eng.authorAvatar || `https://avatar.vercel.sh/${encodeURIComponent(eng.authorName || 'u')}.svg?size=36`}
                    alt={eng.authorName}
                  />
                  <div className="uc-eng-body">
                    <div className="uc-eng-meta">
                      <span className="uc-eng-name">{eng.authorName}</span>
                      <span className="uc-eng-time">{new Date(eng.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="uc-eng-text">{eng.text}</p>
                    <div className="uc-eng-actions">
                      <button
                        className={`uc-eng-btn ${likedByMe ? 'liked' : ''}`}
                        onClick={() => handleLike(eng._id)}
                      >
                        <ThumbsUp size={13} />
                        <span>{(eng.likes || []).length || ''}</span>
                      </button>
                      <button
                        className="uc-eng-btn"
                        onClick={() => { setReplyingTo(replyingTo === eng._id ? null : eng._id); setReplyText(''); }}
                      >
                        <Reply size={13} />
                        <span>Reply</span>
                      </button>
                    </div>

                    {/* Replies */}
                    {(eng.replies || []).map((r, ri) => (
                      <div key={ri} className="uc-reply">
                        <img
                          className="uc-reply-avatar"
                          src={r.authorAvatar || `https://avatar.vercel.sh/${encodeURIComponent(r.authorName || 'u')}.svg?size=28`}
                          alt={r.authorName}
                        />
                        <div className="uc-reply-body">
                          <span className="uc-eng-name">{r.authorName}</span>
                          <p className="uc-eng-text">{r.text}</p>
                        </div>
                      </div>
                    ))}

                    {/* Reply input */}
                    {replyingTo === eng._id && token && (
                      <div className="uc-thread-input-row uc-reply-input-row">
                        <input
                          className="uc-thread-input"
                          placeholder="Write a reply…"
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(eng._id); } }}
                          autoFocus
                        />
                        <button className="uc-thread-send" onClick={() => handleReply(eng._id)} disabled={posting || !replyText.trim()}>
                          <Send size={14} />
                        </button>
                      </div>
                    )}
                  </div>
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

export default UserCard;
