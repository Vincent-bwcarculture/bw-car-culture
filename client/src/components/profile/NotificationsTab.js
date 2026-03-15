// client/src/components/profile/NotificationsTab.js
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle, Settings, Car, Check } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';
const authHeader = () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` });

const NotificationsTab = ({ profileData }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | unread | read

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/user/notifications`, {
        headers: authHeader()
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/user/notifications/${id}/read`, {
        method: 'PUT',
        headers: authHeader()
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/notifications/read-all`, {
        method: 'PUT',
        headers: authHeader()
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/user/notifications/${id}`, {
        method: 'DELETE',
        headers: authHeader()
      });
      if (res.ok) {
        const notif = notifications.find(n => n._id === id);
        setNotifications(prev => prev.filter(n => n._id !== id));
        if (notif && !notif.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getIcon = (type) => {
    const props = { size: 18 };
    switch (type) {
      case 'new_follower':     return <CheckCircle {...props} style={{ color: '#a78bfa' }} />;
      case 'new_comment':      return <AlertCircle {...props} style={{ color: '#60a5fa' }} />;
      case 'comment_liked':    return <CheckCircle {...props} style={{ color: '#f472b6' }} />;
      case 'comment_reply':    return <Info {...props} style={{ color: '#34d399' }} />;
      case 'new_review':       return <CheckCircle {...props} style={{ color: '#fbbf24' }} />;
      case 'service_reminder': return <Settings {...props} style={{ color: '#ff9f40' }} />;
      case 'vehicle_expiry':   return <Car {...props} style={{ color: '#ff6b6b' }} />;
      case 'listing_update':   return <Info {...props} style={{ color: '#36a2eb' }} />;
      case 'booking_confirmation': return <CheckCircle {...props} style={{ color: '#2ed573' }} />;
      case 'route_inquiry':    return <AlertCircle {...props} style={{ color: '#36a2eb' }} />;
      case 'system_alert':     return <AlertTriangle {...props} style={{ color: '#ff9f40' }} />;
      default:                 return <Bell {...props} style={{ color: '#aaaaaa' }} />;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const d = new Date(date);
    const mins = Math.floor((now - d) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Bell size={20} style={{ color: '#ff3300' }} />
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff', fontWeight: 600 }}>
            Notifications
            {unreadCount > 0 && (
              <span style={{
                marginLeft: '0.5rem',
                background: '#ff3300',
                color: '#fff',
                borderRadius: '999px',
                padding: '0.1rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>{unreadCount}</span>
            )}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Filter buttons */}
          {['all', 'unread', 'read'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: filter === f ? '#ff3300' : 'rgba(255,255,255,0.15)',
                background: filter === f ? 'rgba(255,51,0,0.15)' : 'transparent',
                color: filter === f ? '#ff3300' : '#aaaaaa',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >{f}</button>
          ))}

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid rgba(46,213,115,0.3)',
                background: 'rgba(46,213,115,0.08)',
                color: '#2ed573',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              <Check size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{
        background: 'rgba(20,20,20,0.8)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#aaaaaa' }}>
            <div style={{
              width: '36px', height: '36px',
              border: '3px solid rgba(255,51,0,0.2)',
              borderTop: '3px solid #ff3300',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }} />
            <p style={{ margin: 0 }}>Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#666666' }}>
            <Bell size={40} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>
              {filter === 'unread' ? 'No unread notifications' :
               filter === 'read' ? 'No read notifications' :
               "You're all caught up!"}
            </p>
          </div>
        ) : (
          filtered.map((n, i) => (
            <div
              key={n._id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.9rem 1rem',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                background: !n.isRead ? 'rgba(255,51,0,0.04)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onClick={() => !n.isRead && markAsRead(n._id)}
            >
              {/* Unread dot */}
              <div style={{ flexShrink: 0, paddingTop: '3px' }}>
                {!n.isRead && (
                  <div style={{
                    width: '8px', height: '8px',
                    borderRadius: '50%',
                    background: '#ff3300'
                  }} />
                )}
              </div>

              {/* Icon */}
              <div style={{
                flexShrink: 0,
                width: '34px', height: '34px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {getIcon(n.type)}
              </div>

              {/* Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: !n.isRead ? 600 : 400,
                  fontSize: '0.9rem',
                  color: '#ffffff',
                  marginBottom: '0.2rem'
                }}>{n.title}</div>
                <div style={{
                  fontSize: '0.82rem',
                  color: '#aaaaaa',
                  lineHeight: 1.4,
                  marginBottom: '0.3rem'
                }}>{n.message}</div>
                <div style={{ fontSize: '0.75rem', color: '#666666' }}>
                  {formatTime(n.createdAt)}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                style={{
                  flexShrink: 0,
                  background: 'none',
                  border: 'none',
                  color: '#555555',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default NotificationsTab;
