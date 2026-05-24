// client/src/components/profile/NetworkTab.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import axios from '../../config/axios.js';
import UserCard from '../shared/UserCard/UserCard.js';
import './NetworkTab.css';

const PAGE_SIZE = 50;

const NetworkTab = ({ profileData }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({ userType: 'all', verified: 'all' });
  const [following, setFollowing] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const searchDebounce = useRef(null);

  const fetchNetworkUsers = useCallback(async (overridePage = 1, append = false) => {
    try {
      append ? setLoadingMore(true) : setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: String(overridePage),
        limit: String(PAGE_SIZE),
      });
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (filters.userType !== 'all') params.append('userType', filters.userType);
      if (filters.verified !== 'all') params.append('verified', filters.verified);

      let response;
      try {
        response = await axios.get(`/api/users/network?${params.toString()}`);
      } catch {
        response = await axios.get('/auth/users');
      }

      if (response.data.success) {
        const currentUserId = profileData?.id || profileData?._id;
        let fetched = (response.data.data || response.data.available || []).filter(u => {
          if ((u._id || u.id)?.toString() === currentUserId?.toString()) return false;
          const vis = u.profileVisibility || u?.profile?.privacy?.profileVisibility;
          return vis !== 'private';
        });

        setUsers(prev => append ? [...prev, ...fetched] : fetched);
        setTotal(response.data.total ?? fetched.length);
        setHasMore(response.data.hasMore ?? false);
        setPage(overridePage);

        const initialFollowing = new Set(
          fetched.filter(u => u.isFollowedByCurrentUser).map(u => (u._id || u.id).toString())
        );
        setFollowing(prev => append ? new Set([...prev, ...initialFollowing]) : initialFollowing);
      } else {
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (err) {
      if (err.response?.status === 401) setError('Please log in to view the network.');
      else if (err.response?.status === 403) setError('You do not have permission to view the network.');
      else setError('Failed to load network users. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm, filters, profileData]);

  // Initial load
  useEffect(() => {
    fetchNetworkUsers(1, false);
  }, [filters]); // refetch from page 1 when filters change

  // Debounce search
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      fetchNetworkUsers(1, false);
    }, 350);
    return () => clearTimeout(searchDebounce.current);
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    fetchNetworkUsers(page + 1, true);
  };

  const handleFollowToggle = async (userId) => {
    const idStr = userId.toString();
    setFollowing(prev => {
      const next = new Set(prev);
      next.has(idStr) ? next.delete(idStr) : next.add(idStr);
      return next;
    });
    setUsers(prev => prev.map(u => {
      if ((u._id || u.id).toString() !== idStr) return u;
      const wasFollowing = following.has(idStr);
      return { ...u, followerCount: (u.followerCount ?? 0) + (wasFollowing ? -1 : 1) };
    }));
    try {
      await axios.post(`/api/users/${idStr}/follow`);
    } catch {
      setFollowing(prev => {
        const next = new Set(prev);
        next.has(idStr) ? next.delete(idStr) : next.add(idStr);
        return next;
      });
    }
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
          <button onClick={() => fetchNetworkUsers(1, false)} className="network-retry-btn">
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
            <span className="network-stat-number">{total}</span>
            <span className="network-stat-label">Members</span>
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
            <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}>
              <Grid size={18} />
            </button>
            <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}>
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
            <select value={filters.userType} onChange={(e) => setFilters({ ...filters, userType: e.target.value })}>
              <option value="all">All Users</option>
              <option value="admin">Admin</option>
              <option value="user">Members</option>
            </select>
          </div>
          <div className="network-filter-group">
            <label>Verification:</label>
            <select value={filters.verified} onChange={(e) => setFilters({ ...filters, verified: e.target.value })}>
              <option value="all">All Users</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
          <button
            className="network-clear-filters"
            onClick={() => setFilters({ userType: 'all', verified: 'all' })}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Results count */}
      <div className="network-results-header">
        <span>
          Showing {users.length} of {total} member{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Users Grid/List */}
      <div className={`network-users ${viewMode}`}>
        {users.length === 0 ? (
          <div className="network-empty">
            <h3>No users found</h3>
            <p>No members match your current search criteria.</p>
          </div>
        ) : (
          users.map(user => (
            <UserCard
              key={user._id || user.id}
              user={user}
              isFollowing={following.has((user._id || user.id)?.toString())}
              onFollowToggle={() => handleFollowToggle(user._id || user.id)}
              viewMode={viewMode}
              onMessage={(u) => console.log('Message user:', u)}
              onViewProfile={(u) => console.log('View profile:', u)}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="network-load-more">
          <button
            className="network-load-more-btn"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : `Load More (${total - users.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
};

export default NetworkTab;
