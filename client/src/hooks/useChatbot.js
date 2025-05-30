// src/hooks/useChatbot.js - Complete Implementation
import { useState, useEffect, useCallback, useRef } from 'react';
import chatbotService from '../services/chatbotService.js';
import { chatbotHelpers } from '../utils/chatbotHelpers.js';
import chatbotConfig from '../config/chatbotConfig.js';

export const useChatbot = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastError, setLastError] = useState(null);
  const [analytics, setAnalytics] = useState({
    sessionsStarted: 0,
    messagesSent: 0,
    errorsOccurred: 0,
    averageSessionLength: 0,
    searchQueries: 0,
    reviewRequests: 0,
    feedbackSubmitted: 0
  });
  
  const sessionStartTime = useRef(null);
  const errorCount = useRef(0);
  const messageCount = useRef(0);
  const searchCount = useRef(0);
  const reviewCount = useRef(0);

  // Initialize chatbot
  useEffect(() => {
    const initializeChatbot = async () => {
      try {
        // Check if chatbot should be enabled
        const shouldEnable = checkChatbotAvailability();
        setIsEnabled(shouldEnable);
        
        if (shouldEnable) {
          // Initialize session
          sessionStartTime.current = Date.now();
          
          // Load previous analytics data
          const savedAnalytics = chatbotHelpers.storage.get('chatbot_analytics', {});
          if (savedAnalytics) {
            setAnalytics(prev => ({ ...prev, ...savedAnalytics }));
          }
          
          // Track session start
          chatbotService.trackEvent('chatbot_session_started', {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language
          });
          
          // Update analytics
          setAnalytics(prev => ({
            ...prev,
            sessionsStarted: prev.sessionsStarted + 1
          }));
        }
      } catch (error) {
        console.error('Error initializing chatbot:', error);
        setIsEnabled(false);
      }
    };

    initializeChatbot();

    // Cleanup on unmount
    return () => {
      if (sessionStartTime.current) {
        const sessionLength = Date.now() - sessionStartTime.current;
        
        // Track session end
        chatbotService.trackEvent('chatbot_session_ended', {
          duration: sessionLength,
          messagesSent: messageCount.current,
          searchQueries: searchCount.current,
          reviewRequests: reviewCount.current,
          errorsOccurred: errorCount.current
        });
        
        // Update average session length
        setAnalytics(prev => {
          const newAverage = prev.sessionsStarted > 0 
            ? ((prev.averageSessionLength * (prev.sessionsStarted - 1)) + sessionLength) / prev.sessionsStarted
            : sessionLength;
          
          const updatedAnalytics = {
            ...prev,
            averageSessionLength: newAverage
          };
          
          // Save analytics
          chatbotHelpers.storage.set('chatbot_analytics', updatedAnalytics);
          
          return updatedAnalytics;
        });
      }
    };
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('connected');
      setLastError(null);
      chatbotService.trackEvent('chatbot_connection_restored');
    };
    
    const handleOffline = () => {
      setConnectionStatus('offline');
      setLastError({ 
        type: 'network', 
        message: 'You appear to be offline. Please check your internet connection.',
        timestamp: Date.now()
      });
      chatbotService.trackEvent('chatbot_connection_lost');
    };

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor page visibility (pause analytics when tab is not active)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        chatbotService.trackEvent('chatbot_tab_hidden');
      } else {
        chatbotService.trackEvent('chatbot_tab_visible');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const checkChatbotAvailability = useCallback(() => {
    try {
      // Check if required features are available
      const hasLocalStorage = typeof(Storage) !== "undefined";
      const hasWebAPI = typeof fetch !== 'undefined';
      const hasJSON = typeof JSON !== 'undefined';
      
      // Check if user has disabled chatbot
      const userDisabled = chatbotHelpers.storage.get('chatbot_disabled', false);
      
      // Check environment settings
      const envEnabled = process.env.REACT_APP_CHATBOT_ENABLED !== 'false';
      
      // Check if we're in a supported environment
      const isSupported = hasLocalStorage && hasWebAPI && hasJSON && !userDisabled && envEnabled;
      
      // Additional checks for mobile devices
      if (chatbotHelpers.isMobileDevice()) {
        // Check if device has enough memory/performance
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection && connection.effectiveType === 'slow-2g') {
          console.warn('Chatbot disabled due to slow connection');
          return false;
        }
      }
      
      return isSupported;
    } catch (error) {
      console.error('Error checking chatbot availability:', error);
      return false;
    }
  }, []);

  const handleError = useCallback((error, context = '') => {
    try {
      errorCount.current += 1;
      
      const errorInfo = {
        type: chatbotHelpers.classifyError(error),
        message: error.message || 'An error occurred',
        context,
        timestamp: Date.now(),
        stack: error.stack,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      setLastError(errorInfo);

      // Update connection status based on error type
      const errorType = chatbotHelpers.classifyError(error);
      switch (errorType) {
        case 'network':
          setConnectionStatus('offline');
          break;
        case 'server':
          setConnectionStatus('server_error');
          break;
        case 'rate_limit':
          setConnectionStatus('rate_limited');
          break;
        case 'timeout':
          setConnectionStatus('timeout');
          break;
        default:
          setConnectionStatus('error');
      }

      // Track error with additional context
      chatbotService.trackEvent('chatbot_error', {
        type: errorType,
        context,
        errorCount: errorCount.current,
        sessionDuration: sessionStartTime.current ? Date.now() - sessionStartTime.current : 0,
        messagesSent: messageCount.current
      });

      // Update analytics
      setAnalytics(prev => ({
        ...prev,
        errorsOccurred: prev.errorsOccurred + 1
      }));

      // Auto-retry for certain error types
      if (errorType === 'network' && errorCount.current < 3) {
        setTimeout(() => {
          setConnectionStatus('connecting');
          // Test connection
          fetch('/api/health', { method: 'HEAD' })
            .then(() => {
              setConnectionStatus('connected');
              setLastError(null);
            })
            .catch(() => {
              setConnectionStatus('offline');
            });
        }, 2000 * errorCount.current); // Exponential backoff
      }
    } catch (handlingError) {
      console.error('Error in error handler:', handlingError);
    }
  }, []);

  const trackMessage = useCallback((messageType = 'general') => {
    try {
      messageCount.current += 1;
      
      chatbotService.trackEvent('chatbot_message_sent', {
        messageType,
        messageCount: messageCount.current,
        sessionDuration: sessionStartTime.current ? Date.now() - sessionStartTime.current : 0
      });
      
      setAnalytics(prev => ({
        ...prev,
        messagesSent: prev.messagesSent + 1
      }));
    } catch (error) {
      console.error('Error tracking message:', error);
    }
  }, []);

  const trackSearch = useCallback((searchType = 'car', query = '') => {
    try {
      searchCount.current += 1;
      
      chatbotService.trackEvent('chatbot_search_performed', {
        searchType,
        query: query.substring(0, 100), // Limit query length for privacy
        searchCount: searchCount.current,
        sessionDuration: sessionStartTime.current ? Date.now() - sessionStartTime.current : 0
      });
      
      setAnalytics(prev => ({
        ...prev,
        searchQueries: prev.searchQueries + 1
      }));
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }, []);

  const trackReview = useCallback((reviewType = 'general') => {
    try {
      reviewCount.current += 1;
      
      chatbotService.trackEvent('chatbot_review_requested', {
        reviewType,
        reviewCount: reviewCount.current,
        sessionDuration: sessionStartTime.current ? Date.now() - sessionStartTime.current : 0
      });
      
      setAnalytics(prev => ({
        ...prev,
        reviewRequests: prev.reviewRequests + 1
      }));
    } catch (error) {
      console.error('Error tracking review:', error);
    }
  }, []);

  const trackFeedback = useCallback((rating, hasComment = false) => {
    try {
      chatbotService.trackEvent('chatbot_feedback_submitted', {
        rating,
        hasComment,
        sessionDuration: sessionStartTime.current ? Date.now() - sessionStartTime.current : 0
      });
      
      setAnalytics(prev => ({
        ...prev,
        feedbackSubmitted: prev.feedbackSubmitted + 1
      }));
    } catch (error) {
      console.error('Error tracking feedback:', error);
    }
  }, []);

  const resetError = useCallback(() => {
    try {
      setLastError(null);
      setConnectionStatus('connected');
      errorCount.current = 0;
      
      chatbotService.trackEvent('chatbot_error_cleared');
    } catch (error) {
      console.error('Error resetting error:', error);
    }
  }, []);

  const disableChatbot = useCallback(() => {
    try {
      setIsEnabled(false);
      chatbotHelpers.storage.set('chatbot_disabled', true);
      
      chatbotService.trackEvent('chatbot_disabled_by_user', {
        sessionDuration: sessionStartTime.current ? Date.now() - sessionStartTime.current : 0,
        messagesSent: messageCount.current
      });
    } catch (error) {
      console.error('Error disabling chatbot:', error);
    }
  }, []);

  const enableChatbot = useCallback(() => {
    try {
      setIsEnabled(true);
      chatbotHelpers.storage.remove('chatbot_disabled');
      
      // Reset session
      sessionStartTime.current = Date.now();
      messageCount.current = 0;
      searchCount.current = 0;
      reviewCount.current = 0;
      errorCount.current = 0;
      
      chatbotService.trackEvent('chatbot_enabled_by_user');
      
      setAnalytics(prev => ({
        ...prev,
        sessionsStarted: prev.sessionsStarted + 1
      }));
    } catch (error) {
      console.error('Error enabling chatbot:', error);
    }
  }, []);

  const getPerformanceMetrics = useCallback(() => {
    return {
      sessionDuration: sessionStartTime.current ? Date.now() - sessionStartTime.current : 0,
      messagesPerMinute: sessionStartTime.current ? 
        (messageCount.current / ((Date.now() - sessionStartTime.current) / 60000)) : 0,
      errorRate: messageCount.current > 0 ? (errorCount.current / messageCount.current) : 0,
      searchRate: messageCount.current > 0 ? (searchCount.current / messageCount.current) : 0,
      averageResponseTime: analytics.averageSessionLength / Math.max(analytics.messagesSent, 1)
    };
  }, [analytics]);

  const clearAnalytics = useCallback(() => {
    try {
      const resetAnalytics = {
        sessionsStarted: 0,
        messagesSent: 0,
        errorsOccurred: 0,
        averageSessionLength: 0,
        searchQueries: 0,
        reviewRequests: 0,
        feedbackSubmitted: 0
      };
      
      setAnalytics(resetAnalytics);
      chatbotHelpers.storage.remove('chatbot_analytics');
      
      chatbotService.trackEvent('chatbot_analytics_cleared');
    } catch (error) {
      console.error('Error clearing analytics:', error);
    }
  }, []);

  return {
    // State
    isEnabled,
    connectionStatus,
    lastError,
    analytics,
    
    // Actions
    handleError,
    trackMessage,
    trackSearch,
    trackReview,
    trackFeedback,
    resetError,
    disableChatbot,
    enableChatbot,
    
    // Utilities
    getPerformanceMetrics,
    clearAnalytics,
    
    // Status checks
    isOnline: connectionStatus === 'connected',
    hasError: !!lastError,
    isRetrying: connectionStatus === 'connecting'
  };
};