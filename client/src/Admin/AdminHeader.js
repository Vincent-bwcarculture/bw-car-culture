// src/Admin/AdminHeader.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../hooks/useNotifications.js';
import './AdminHeader.css';

const AdminHeader = ({ onToggleSidebar }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Force logout even if API call fails
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'feedback': return '💬';
      case 'user': return '👤';
      case 'system': return '⚙️';
      case 'alert': return '⚠️';
      default: return '📝';
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
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <button 
          className="menu-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          ☰
        </button>
        
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search..."
            aria-label="Search"
          />
          <button className="search-button">🔍</button>
        </div>
      </div>

      <div className="header-right">
        {/* Real-time Notifications */}
        <div className="notifications-container">
          <button 
            className="notifications-toggle"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    className="mark-all-read"
                    onClick={() => {
                      markAllAsRead();
                      setShowNotifications(false);
                    }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications">
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${notification.unread ? 'unread' : ''} ${getPriorityClass(notification.priority)}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <span className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <span className="notification-time">
                          {formatNotificationTime(notification.timestamp)}
                        </span>
                      </div>
                      {notification.unread && (
                        <span className="unread-indicator"></span>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              {notifications.length > 10 && (
                <div className="notifications-footer">
                  <button 
                    onClick={() => {
                      navigate('/admin/notifications');
                      setShowNotifications(false);
                    }}
                  >
                    View All Notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="user-menu-container">
          <button 
            className="user-menu-toggle"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <span className="user-name">{user?.name || 'Admin'}</span>
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="user-info">
                <div className="user-avatar-large">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                  <h4>{user?.name || 'Admin'}</h4>
                  <span>{user?.role || 'Administrator'}</span>
                </div>
              </div>
              <div className="user-menu-items">
                <button 
                  className="user-menu-item"
                  onClick={() => {
                    navigate('/admin/profile');
                    setShowUserMenu(false);
                  }}
                >
                  <span>👤</span> Profile
                </button>
                <button 
                  className="user-menu-item"
                  onClick={() => {
                    navigate('/admin/settings');
                    setShowUserMenu(false);
                  }}
                >
                  <span>⚙️</span> Settings
                </button>
                <button 
                  className="user-menu-item"
                  onClick={() => {
                    navigate('/admin/security');
                    setShowUserMenu(false);
                  }}
                >
                  <span>🔒</span> Security
                </button>
                <button 
                  className="user-menu-item logout-button" 
                  onClick={handleLogout}
                >
                  <span>📤</span> Sign Out
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