// client/src/components/profile/NetworkTab.js
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  MapPin, 
  Star,
  Eye,
  MessageCircle,
  Heart,
  Search,
  Filter,
  Grid,
  Car,
  List,
  MoreHorizontal,
  ExternalLink,
  Mail,
  Phone
} from 'lucide-react';
import axios from '../../config/axios.js';
import './NetworkTab.css';

const NetworkTab = ({ profileData, refreshProfile }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filters, setFilters] = useState({
    userType: 'all',
    location: 'all',
    verified: 'all'
  });
  const [following, setFollowing] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Fetch network users on component mount
  useEffect(() => {
    fetchNetworkUsers();
  }, []);

  // Debounce search and filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchNetworkUsers();
    }, 500); // 500ms debounce for search

    return () => clearTimeout(timeoutId);
  }, [filters, searchTerm]);

  const fetchNetworkUsers = async () => {
    try {
      setLoading(true);
      setError('');

      // Build query parameters for filtering
      const params = new URLSearchParams({
        page: '1',
        limit: '50' // Get more users for better browsing experience
      });

      // Add filters if they're not 'all'
      if (filters.userType !== 'all') {
        params.append('userType', filters.userType);
      }
      if (filters.verified !== 'all') {
        params.append('verified', filters.verified);
      }
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      // Fetch users from the new network endpoint
      const response = await axios.get(`/api/users/network?${params.toString()}`);
      
      if (response.data.success) {
        setUsers(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Failed to fetch network users:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        setError('Please log in to view the network.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to view the user network.');
      } else if (error.response?.status === 404) {
        setError('Network feature is not available at the moment.');
      } else {
        setError('Failed to load network users. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Since filtering is now done server-side, we just display the users from API
  const filteredUsers = users;

  // Handle follow/unfollow (placeholder for now)
  const handleFollowToggle = async (userId) => {
    try {
      if (following.has(userId)) {
        // Unfollow logic will be implemented later
        setFollowing(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        // Follow logic will be implemented later
        setFollowing(prev => new Set(prev).add(userId));
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
    }
  };

  // Get user type display name
  const getUserTypeDisplay = (role) => {
    const roleMap = {
      'business_owner': 'Business Owner',
      'dealership_owner': 'Dealership Owner',
      'transport_coordinator': 'Transport Coordinator',
      'driver': 'Driver',
      'ministry_official': 'Ministry Official',
      'user': 'Community Member'
    };
    return roleMap[role] || role || 'User';
  };

  // Get user avatar
  const getUserAvatar = (user) => {
    return user.avatar?.url || 
           user.profilePicture || 
           `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=ff3300&color=fff&size=128`;
  };

  if (loading) {
    return (
      <div className="network-tab">
        <div className="network-loading">
          <div className="network-loading-spinner"></div>
          <p>Loading network...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="network-tab">
        <div className="network-error">
          <h3>Network Unavailable</h3>
          <p>{error}</p>
          <button onClick={fetchNetworkUsers} className="network-retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="network-tab">
      {/* Header */}
      <div className="network-header">
        <div className="network-title-section">
          <h2>Network</h2>
          <p>Connect with automotive professionals and enthusiasts</p>
        </div>
        
        <div className="network-stats">
          <div className="network-stat">
            <span className="network-stat-number">{users.length}</span>
            <span className="network-stat-label">Total Users</span>
          </div>
          <div className="network-stat">
            <span className="network-stat-number">{following.size}</span>
            <span className="network-stat-label">Following</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="network-controls">
        <div className="network-search">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="network-actions">
          <button 
            className={`network-filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
          </button>

          <div className="network-view-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={18} />
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="network-filters-panel">
          <div className="network-filter-group">
            <label>User Type:</label>
            <select 
              value={filters.userType} 
              onChange={(e) => setFilters({...filters, userType: e.target.value})}
            >
              <option value="all">All Types</option>
              <option value="business_owner">Business Owners</option>
              <option value="dealership_owner">Dealership Owners</option>
              <option value="driver">Drivers</option>
              <option value="user">Community Members</option>
            </select>
          </div>

          <div className="network-filter-group">
            <label>Verification:</label>
            <select 
              value={filters.verified} 
              onChange={(e) => setFilters({...filters, verified: e.target.value})}
            >
              <option value="all">All Users</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          <button 
            className="network-clear-filters"
            onClick={() => setFilters({userType: 'all', location: 'all', verified: 'all'})}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Results Header */}
      <div className="network-results-header">
        <span>{filteredUsers.length} users found</span>
      </div>

      {/* Users Grid/List */}
      <div className={`network-users ${viewMode}`}>
        {filteredUsers.length === 0 ? (
          <div className="network-empty">
            <Users size={48} />
            <h3>No users found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <UserCard 
              key={user._id || user.id}
              user={user}
              isFollowing={following.has(user._id || user.id)}
              onFollowToggle={() => handleFollowToggle(user._id || user.id)}
              getUserTypeDisplay={getUserTypeDisplay}
              getUserAvatar={getUserAvatar}
              viewMode={viewMode}
            />
          ))
        )}
      </div>
    </div>
  );
};

// User Card Component
const UserCard = ({ user, isFollowing, onFollowToggle, getUserTypeDisplay, getUserAvatar, viewMode }) => {
  return (
    <div className={`user-card ${viewMode}`}>
      <div className="user-card-header">
        <img 
          src={getUserAvatar(user)} 
          alt={user.name}
          className="user-avatar"
        />
        
        <div className="user-info">
          <h3 className="user-name">
            {user.name}
            {user.emailVerified && (
              <span className="user-verified" title="Verified User">
                ✓
              </span>
            )}
          </h3>
          <p className="user-role">{getUserTypeDisplay(user.role)}</p>
          {user.city && (
            <p className="user-location">
              <MapPin size={14} />
              {user.city}
            </p>
          )}
        </div>

        <button 
          className={`follow-btn ${isFollowing ? 'following' : ''}`}
          onClick={onFollowToggle}
        >
          {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      </div>

      {user.bio && (
        <div className="user-bio">
          <p>{user.bio}</p>
        </div>
      )}

      <div className="user-stats">
        {user.totalListings && (
          <span className="user-stat">
            <Car size={14} />
            {user.totalListings} listings
          </span>
        )}
        <span className="user-stat">
          <Eye size={14} />
          Member since {new Date(user.createdAt).getFullYear()}
        </span>
      </div>

      <div className="user-actions">
        <button className="user-action-btn">
          <MessageCircle size={16} />
          Message
        </button>
        <button className="user-action-btn">
          <ExternalLink size={16} />
          View Profile
        </button>
      </div>
    </div>
  );
};

export default NetworkTab;
