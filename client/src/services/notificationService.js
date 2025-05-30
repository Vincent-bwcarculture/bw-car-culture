// src/services/notificationService.js
import { http } from '../config/axios.js';

class NotificationService {
  constructor() {
    this.listeners = new Set();
    this.notifications = [];
    this.unreadCount = 0;
    this.pollingInterval = null;
    this.isPolling = false;
  }

  // Initialize the service
  async initialize() {
    try {
      await this.fetchNotifications();
      this.startPolling();
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  // Start polling for new notifications
  startPolling(interval = 30000) { // 30 seconds
    if (this.isPolling) return;
    
    this.isPolling = true;
    this.pollingInterval = setInterval(async () => {
      try {
        await this.fetchNotifications();
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    }, interval);
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
    }
  }

  // Fetch notifications from API
  async fetchNotifications() {
    try {
      // Get feedback notifications
      const feedbackResponse = await http.get('/api/feedback/stats');
      
      if (feedbackResponse.data.success) {
        const stats = feedbackResponse.data.data;
        const newFeedbackCount = stats.byStatus?.new || 0;
        
        // Create notification for new feedback
        if (newFeedbackCount > 0) {
          const feedbackNotification = {
            id: 'new-feedback',
            type: 'feedback',
            title: 'New Feedback Received',
            message: `You have ${newFeedbackCount} new feedback${newFeedbackCount > 1 ? 's' : ''} to review`,
            count: newFeedbackCount,
            timestamp: new Date(),
            unread: true,
            priority: 'normal',
            action: {
              label: 'View Feedback',
              path: '/admin/feedback'
            }
          };

          this.addOrUpdateNotification(feedbackNotification);
        }
      }

      // You can add more notification sources here
      // For example: new user registrations, system alerts, etc.

    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }

  // Add or update a notification
  addOrUpdateNotification(notification) {
    const existingIndex = this.notifications.findIndex(n => n.id === notification.id);
    
    if (existingIndex !== -1) {
      // Update existing notification
      const wasUnread = this.notifications[existingIndex].unread;
      this.notifications[existingIndex] = notification;
      
      // If it was read before and now it's unread, increment count
      if (!wasUnread && notification.unread) {
        this.unreadCount++;
      }
    } else {
      // Add new notification
      this.notifications.unshift(notification);
      if (notification.unread) {
        this.unreadCount++;
      }
    }

    this.notifyListeners();
  }

  // Mark notification as read
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && notification.unread) {
      notification.unread = false;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notifyListeners();
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.unread = false;
    });
    this.unreadCount = 0;
    this.notifyListeners();
  }

  // Remove notification
  removeNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      const notification = this.notifications[index];
      if (notification.unread) {
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
      this.notifications.splice(index, 1);
      this.notifyListeners();
    }
  }

  // Get all notifications
  getNotifications() {
    return this.notifications;
  }

  // Get unread count
  getUnreadCount() {
    return this.unreadCount;
  }

  // Subscribe to notification updates
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          notifications: this.notifications,
          unreadCount: this.unreadCount
        });
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Create a new feedback notification manually
  createFeedbackNotification(feedbackData) {
    const notification = {
      id: `feedback-${feedbackData.id || Date.now()}`,
      type: 'feedback',
      title: 'New Feedback Received',
      message: `${feedbackData.name} left ${feedbackData.rating}-star feedback`,
      timestamp: new Date(),
      unread: true,
      priority: feedbackData.rating <= 2 ? 'high' : 'normal',
      data: feedbackData,
      action: {
        label: 'View Feedback',
        path: '/admin/feedback'
      }
    };

    this.addOrUpdateNotification(notification);
  }

  // Cleanup
  destroy() {
    this.stopPolling();
    this.listeners.clear();
    this.notifications = [];
    this.unreadCount = 0;
  }
}

// Create singleton instance
const notificationService = new NotificationService();
export default notificationService;
