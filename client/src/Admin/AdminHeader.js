// src/Admin/AdminHeader.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../hooks/useNotifications.js';
import './AdminHeader.css';

const API = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';
const POLL_INTERVAL = 60000; // refresh every 60 s

function usePendingCounts() {
  const [counts, setCounts] = useState({ pendingReview: 0, boostPending: 0, stuckApproved: 0 });
  const timerRef = useRef(null);

  const fetchCounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/admin/pending-counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setCounts(data.counts);
    } catch (_) {}
  };

  useEffect(() => {
    fetchCounts();
    timerRef.current = setInterval(fetchCounts, POLL_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, []);

  return counts;
}

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const AdminHeader = ({ onToggleSidebar }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const pendingCounts = usePendingCounts();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.action?.path) {
      navigate(notification.action.path);
      setShowNotifications(false);
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'urgent': return 'priority-urgent';
      case 'low': return 'priority-low';
      default: return 'priority-normal';
    }
  };

  const formatNotificationTime = (timestamp) => {
    const diffInMinutes = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const h = Math.floor(diffInMinutes / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const avatarSrc = user?.avatar?.url || user?.profile?.avatar?.url || (typeof user?.avatar === 'string' ? user?.avatar : null) || null;
  const initials = user?.name?.charAt(0)?.toUpperCase() || 'A';

  return (
    <header className="admin-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onToggleSidebar} aria-label="Toggle Sidebar">
          <IconMenu />
        </button>
        <div className="search-bar">
          <IconSearch />
          <input type="text" placeholder="Search..." aria-label="Search" />
        </div>
      </div>

      {/* ── Quick-action pending badges ── */}
      <div className="header-pending-actions">
        <button
          className={`hpa-btn hpa-btn--review${pendingCounts.pendingReview > 0 ? ' hpa-btn--active' : ''}`}
          onClick={() => navigate('/admin/user-submissions')}
          title="User submissions awaiting review"
        >
          <span className="hpa-label">Reviews</span>
          {pendingCounts.pendingReview > 0 && (
            <span className="hpa-badge">{pendingCounts.pendingReview > 99 ? '99+' : pendingCounts.pendingReview}</span>
          )}
        </button>

        {pendingCounts.boostPending > 0 && (
          <button
            className="hpa-btn hpa-btn--boost hpa-btn--active"
            onClick={() => navigate('/admin/user-submissions')}
            title="Boost payments awaiting verification"
          >
            <span className="hpa-label">Boost Payments</span>
            <span className="hpa-badge hpa-badge--amber">{pendingCounts.boostPending > 99 ? '99+' : pendingCounts.boostPending}</span>
          </button>
        )}

        {pendingCounts.stuckApproved > 0 && (
          <button
            className="hpa-btn hpa-btn--stuck hpa-btn--active"
            onClick={() => navigate('/admin/user-submissions')}
            title="Approved submissions with no listing created — need manual attention"
          >
            <span className="hpa-label">Needs Attention</span>
            <span className="hpa-badge hpa-badge--red">{pendingCounts.stuckApproved}</span>
          </button>
        )}
      </div>

      <div className="header-right">
        {/* Notifications */}
        <div className="notifications-container">
          <button
            className="notifications-toggle"
            onClick={() => { setShowNotifications(p => !p); setShowUserMenu(false); }}
            aria-label="Notifications"
          >
            <IconBell />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button className="mark-all-read" onClick={() => { markAllAsRead(); setShowNotifications(false); }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications"><p>No notifications</p></div>
                ) : (
                  notifications.slice(0, 10).map(n => (
                    <div
                      key={n.id}
                      className={`notification-item ${n.unread ? 'unread' : ''} ${getPriorityClass(n.priority)}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="notification-content">
                        <h4>{n.title}</h4>
                        <p>{n.message}</p>
                        <span className="notification-time">{formatNotificationTime(n.timestamp)}</span>
                      </div>
                      {n.unread && <span className="unread-indicator" />}
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 10 && (
                <div className="notifications-footer">
                  <button onClick={() => { navigate('/admin/notifications'); setShowNotifications(false); }}>
                    View All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="user-menu-container">
          <button
            className="user-menu-toggle"
            onClick={() => { setShowUserMenu(p => !p); setShowNotifications(false); }}
          >
            <div className="user-avatar">
              {avatarSrc
                ? <img src={avatarSrc} alt={user?.name || 'Admin'} className="user-avatar-img" />
                : <span>{initials}</span>
              }
            </div>
            <span className="user-name">{user?.name || 'Admin'}</span>
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-info" onClick={() => { navigate('/profile'); setShowUserMenu(false); }} style={{ cursor: 'pointer' }}>
                <div className="user-avatar-large">
                  {avatarSrc
                    ? <img src={avatarSrc} alt={user?.name || 'Admin'} className="user-avatar-img" />
                    : <span>{initials}</span>
                  }
                </div>
                <div>
                  <h4>{user?.name || 'Admin'}</h4>
                  <span>{user?.role || 'Administrator'}</span>
                </div>
              </div>
              <div className="user-menu-items">
                <button className="user-menu-item" onClick={() => { navigate('/profile'); setShowUserMenu(false); }}>
                  Profile
                </button>
                <button className="user-menu-item" onClick={() => { navigate('/admin/settings'); setShowUserMenu(false); }}>
                  Settings
                </button>
                <button className="user-menu-item logout-button" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
