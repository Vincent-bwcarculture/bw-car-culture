// client/src/components/shared/NotificationSystem/NotificationSystem.js
import React, { useState, useEffect } from 'react';
import { 
  Bell, X, CheckCircle, AlertCircle, Info, 
  AlertTriangle, Calendar, Settings, Car 
} from 'lucide-react';
import './NotificationSystem.css';

const NotificationSystem = ({ userId, userSettings }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      // Set up real-time notifications if needed
      const interval = setInterval(fetchNotifications, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/user/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/user/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/user/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notif => notif._id !== notificationId)
        );
        // Adjust unread count if notification was unread
        const notification = notifications.find(n => n._id === notificationId);
        if (notification && !notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type, icon) => {
    // Contextual system prompts
    if (icon === 'car'    || type === 'system_add_car')  return <Car size={16} className="notification-icon warning" />;
    if (icon === 'avatar' || type === 'system_avatar')   return <CheckCircle size={16} className="notification-icon info" />;
    if (icon === 'profile'|| type === 'system_bio')      return <Info size={16} className="notification-icon info" />;
    if (icon === 'phone'  || type === 'system_phone')    return <Settings size={16} className="notification-icon service" />;
    switch (type) {
      case 'service_reminder':
        return <Settings size={16} className="notification-icon service" />;
      case 'vehicle_expiry':
        return <Car size={16} className="notification-icon warning" />;
      case 'listing_update':
        return <Info size={16} className="notification-icon info" />;
      case 'booking_confirmation':
        return <CheckCircle size={16} className="notification-icon success" />;
      case 'route_inquiry':
        return <AlertCircle size={16} className="notification-icon info" />;
      case 'system_alert':
        return <AlertTriangle size={16} className="notification-icon warning" />;
      default:
        return <Bell size={16} className="notification-icon default" />;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInMinutes = Math.floor((now - notifDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notifDate.toLocaleDateString();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    // Deep link: use stored link field first, fall back to type-based routing
    const dest = notification.link || (() => {
      switch (notification.type) {
        case 'service_reminder':
        case 'vehicle_expiry':    return '/profile?tab=vehicles';
        case 'listing_update':    return notification.data?.listingId ? `/listings/${notification.data.listingId}` : '/profile';
        case 'route_inquiry':
        case 'booking_confirmation': return '/profile?tab=routes';
        case 'system_add_car':    return '/profile?tab=overview';
        case 'system_bio':
        case 'system_avatar':
        case 'system_phone':      return '/profile?tab=settings';
        default:                  return '/profile?tab=notifications';
      }
    })();
    window.location.href = dest;
    setShowDropdown(false);
  };

  return (
    <div className="notification-system">
      <button 
        className="notification-trigger"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read-btn"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </button>
              )}
              <button 
                className="close-dropdown-btn"
                onClick={() => setShowDropdown(false)}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <div className="loading-spinner"></div>
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div 
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <div className="notification-icon-wrapper">
                      {getNotificationIcon(notification.type, notification.icon)}
                    </div>
                    <div className="notification-body">
                      <h4 className="notification-title">
                        {notification.title}
                      </h4>
                      <p className="notification-message">
                        {notification.message}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="notification-time">{formatTimeAgo(notification.createdAt)}</span>
                        {(notification.link || notification.category === 'system') && (
                          <span style={{ fontSize: '0.7rem', color: '#ff3300', fontWeight: 500 }}>→</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button 
                    className="delete-notification-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <Bell size={48} />
                <h4>No notifications</h4>
                <p>You're all caught up!</p>
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="view-all-btn"
                onClick={() => {
                  window.location.href = '/profile?tab=notifications';
                  setShowDropdown(false);
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
