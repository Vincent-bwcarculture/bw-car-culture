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
  Car,
  Grid,
  List,
  MoreHorizontal,
  ExternalLink,
  Mail,
  Phone
} from 'lucide-react';
import axios from '../../config/axios.js';
import UserCard from '../shared/UserCard/UserCard.js';
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

  // Debounce search and re-fetch for filters (but not search since we do client-side filtering for fallback)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (filters.userType !== 'all' || filters.verified !== 'all') {
        fetchNetworkUsers();
      }
    }, 300); // 300ms debounce for filters

    return () => clearTimeout(timeoutId);
  }, [filters]); // Only re-fetch on filter changes, not search

  const fetchNetworkUsers = async () => {
    try {
      setLoading(true);
      setError('');

      // Try the existing auth/users endpoint first as a fallback
      let response;
      try {
        // Try the dedicated network endpoint first
        const params = new URLSearchParams({
          page: '1',
          limit: '50'
        });

        if (filters.userType !== 'all') {
          params.append('userType', filters.userType);
        }
        if (filters.verified !== 'all') {
          params.append('verified', filters.verified);
        }
        if (searchTerm.trim()) {
          params.append('search', searchTerm.trim());
        }

        response = await axios.get(`/api/users/network?${params.toString()}`);
      } catch (networkError) {
        console.log('Network endpoint not available, trying fallback:', networkError.message);
        
        // Fallback to existing auth/users endpoint
        response = await axios.get('/auth/users');
      }
      
      if (response.data.success) {
        let users = response.data.data || response.data.available || [];
        
        // Filter out current user
        const currentUserId = profileData?.id || profileData?._id;
        users = users.filter(user => 
          (user._id || user.id) !== currentUserId
        );
        
        // Apply client-side filtering if using fallback endpoint
        if (response.config.url.includes('/auth/users')) {
          users = users.filter(user => {
            const matchesSearch = !searchTerm || 
              user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.role?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesUserType = filters.userType === 'all' || 
              user.role === filters.userType;

            const matchesVerified = filters.verified === 'all' || 
              (filters.verified === 'verified' && user.emailVerified) ||
              (filters.verified === 'unverified' && !user.emailVerified);

            return matchesSearch && matchesUserType && matchesVerified;
          });
        }
        
        setUsers(users);
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
        setError('Network feature is temporarily unavailable. The endpoint needs to be added to the API.');
      } else {
        setError('Failed to load network users. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter users (handles both server-side filtered and client-side fallback)
  const filteredUsers = users.filter(user => {
    // Apply search filter (always client-side for responsive UI)
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

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

  // Handle loading state
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

  // Handle error state
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
              viewMode={viewMode}
              onMessage={(user) => console.log('Message user:', user)}
              onViewProfile={(user) => console.log('View profile:', user)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NetworkTab;
