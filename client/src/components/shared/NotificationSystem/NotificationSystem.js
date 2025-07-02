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

  const getNotificationIcon = (type) => {
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
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Handle navigation based on notification type
    switch (notification.type) {
      case 'service_reminder':
        window.location.href = '/profile?tab=vehicles';
        break;
      case 'vehicle_expiry':
        window.location.href = '/profile?tab=vehicles';
        break;
      case 'listing_update':
        if (notification.data?.listingId) {
          window.location.href = `/listings/${notification.data.listingId}`;
        }
        break;
      case 'route_inquiry':
        window.location.href = '/profile?tab=routes';
        break;
      case 'booking_confirmation':
        window.location.href = '/profile?tab=routes';
        break;
      default:
        window.location.href = '/profile';
    }
    
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
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-body">
                      <h4 className="notification-title">
                        {notification.title}
                      </h4>
                      <p className="notification-message">
                        {notification.message}
                      </p>
                      <span className="notification-time">
                        {formatTimeAgo(notification.createdAt)}
                      </span>
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
                  window.location.href = '/notifications';
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
