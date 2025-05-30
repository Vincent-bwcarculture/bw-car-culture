// src/hooks/useNotifications.js
import { useState, useEffect } from 'react';
import notificationService from '../services/notificationService.js';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize the service
    notificationService.initialize().finally(() => {
      setLoading(false);
    });

    // Subscribe to updates
    const unsubscribe = notificationService.subscribe((data) => {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    });

    // Initial data
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  const markAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const removeNotification = (notificationId) => {
    notificationService.removeNotification(notificationId);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification
  };
};
