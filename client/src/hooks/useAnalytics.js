// src/hooks/useAnalytics.js
import { useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService.js';
import { useInternalAnalyticsContext } from '../components/shared/InternalAnalyticsProvider.js';

export const useAnalytics = () => {
  const location = useLocation();
  const analytics = useInternalAnalyticsContext();
  const sessionStartTime = useRef(Date.now());
  const pageStartTime = useRef(Date.now());
  const interactionCount = useRef(0);

  // Reset page start time when location changes
  useEffect(() => {
    pageStartTime.current = Date.now();
  }, [location]);

  // Track page view with enhanced data
  const trackPageView = useCallback((pagePath, title, additionalData = {}) => {
    const pageData = {
      page: pagePath || location.pathname,
      title: title || document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      sessionDuration: Date.now() - sessionStartTime.current,
      ...additionalData
    };

    analytics.trackEvent('page_view', {
      category: 'navigation',
      metadata: pageData
    });
  }, [analytics, location]);

  // Track user interactions with detailed context
  const trackClick = useCallback((elementId, elementType = 'button', additionalData = {}) => {
    interactionCount.current += 1;
    
    analytics.trackEvent('click', {
      category: 'interaction',
      elementId,
      metadata: {
        elementType,
        page: location.pathname,
        interactionNumber: interactionCount.current,
        timeOnPage: Date.now() - pageStartTime.current,
        ...additionalData
      }
    });
  }, [analytics, location]);

  // Enhanced business event tracking
  const trackListingView = useCallback((listingId, listingData = {}) => {
    analytics.trackListingView(listingId, {
      ...listingData,
      viewDuration: Date.now() - pageStartTime.current,
      source: location.pathname,
      referrer: document.referrer
    });
  }, [analytics, location]);

  const trackSearch = useCallback((query, category, resultsCount, filters = {}, searchTime = 0) => {
    analytics.trackSearch(query, category, resultsCount, {
      ...filters,
      searchTime,
      page: location.pathname,
      hasResults: resultsCount > 0,
      refinedSearch: query.length > 3 // Basic heuristic for refined searches
    });
  }, [analytics, location]);

  const trackDealerContact = useCallback((dealerId, method = 'form', additionalData = {}) => {
    analytics.trackDealerContact(dealerId, method);
    
    // Also track as conversion event
    analytics.trackEvent('conversion', {
      category: 'conversion',
      elementId: `dealer-${dealerId}`,
      metadata: {
        dealerId,
        contactMethod: method,
        page: location.pathname,
        timeToContact: Date.now() - pageStartTime.current,
        ...additionalData
      }
    });
  }, [analytics, location]);

  const trackPhoneClick = useCallback((phoneNumber, source = 'listing') => {
    analytics.trackPhoneClick(phoneNumber, source);
    
    // Track as high-value conversion
    analytics.trackEvent('phone_conversion', {
      category: 'conversion',
      metadata: {
        phoneNumber: phoneNumber.replace(/[^\d]/g, ''), // Clean number
        source,
        page: location.pathname,
        timeToCall: Date.now() - pageStartTime.current
      }
    });
  }, [analytics, location]);

  const trackFavorite = useCallback((itemId, itemType, action = 'add') => {
    analytics.trackFavorite(itemId, itemType, action);
    
    // Track engagement level
    analytics.trackEvent('engagement', {
      category: 'engagement',
      elementId: itemId,
      metadata: {
        itemType,
        action,
        page: location.pathname,
        engagementTime: Date.now() - pageStartTime.current
      }
    });
  }, [analytics, location]);

  const trackArticleRead = useCallback((articleId, articleTitle, readTime = null) => {
    const estimatedReadTime = readTime || Math.max(10, Date.now() - pageStartTime.current);
    
    analytics.trackArticleRead(articleId, articleTitle, estimatedReadTime);
    
    // Determine reading engagement level
    const engagementLevel = estimatedReadTime > 60000 ? 'high' : 
                           estimatedReadTime > 30000 ? 'medium' : 'low';
    
    analytics.trackEvent('content_engagement', {
      category: 'content',
      elementId: articleId,
      metadata: {
        articleTitle,
        readTime: estimatedReadTime,
        engagementLevel,
        wordsPerMinute: estimatedReadTime > 0 ? ((articleTitle?.length || 0) * 5) / (estimatedReadTime / 60000) : 0
      }
    });
  }, [analytics]);

  const trackFilterUsage = useCallback((filters, resultCount) => {
    analytics.trackFilterUsage(filters, resultCount);
    
    // Track filter effectiveness
    const filterCount = Object.keys(filters).length;
    const effectiveness = resultCount > 0 ? 'effective' : 'ineffective';
    
    analytics.trackEvent('filter_interaction', {
      category: 'navigation',
      metadata: {
        filterCount,
        resultCount,
        effectiveness,
        filters,
        page: location.pathname
      }
    });
  }, [analytics, location]);

  // Form interaction tracking
  const trackFormStart = useCallback((formId, formType = 'generic') => {
    analytics.trackEvent('form_start', {
      category: 'conversion',
      elementId: formId,
      metadata: {
        formType,
        page: location.pathname,
        timeToStart: Date.now() - pageStartTime.current
      }
    });
  }, [analytics, location]);

  const trackFormComplete = useCallback((formId, formType = 'generic', formData = {}) => {
    analytics.trackEvent('form_complete', {
      category: 'conversion',
      elementId: formId,
      metadata: {
        formType,
        page: location.pathname,
        completionTime: Date.now() - pageStartTime.current,
        fieldCount: Object.keys(formData).length,
        hasErrors: formData.hasErrors || false
      }
    });
  }, [analytics, location]);

  const trackFormAbandon = useCallback((formId, formType = 'generic', completedFields = []) => {
    analytics.trackEvent('form_abandon', {
      category: 'conversion',
      elementId: formId,
      metadata: {
        formType,
        page: location.pathname,
        timeBeforeAbandon: Date.now() - pageStartTime.current,
        completedFields: completedFields.length,
        abandonmentStage: completedFields.length > 0 ? 'partial' : 'immediate'
      }
    });
  }, [analytics, location]);

  // Error tracking
  const trackError = useCallback((errorType, errorMessage, errorContext = {}) => {
    analytics.trackEvent('error', {
      category: 'system',
      metadata: {
        errorType,
        errorMessage: errorMessage.substring(0, 200), // Limit message length
        page: location.pathname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...errorContext
      }
    });
  }, [analytics, location]);

  // Performance tracking
  const trackPerformanceMetric = useCallback((metricName, value, context = {}) => {
    analytics.trackEvent('performance', {
      category: 'system',
      metadata: {
        metricName,
        value,
        page: location.pathname,
        connectionType: navigator.connection?.effectiveType || 'unknown',
        ...context
      }
    });
  }, [analytics, location]);

  // E-commerce style tracking for car marketplace
  const trackListingInquiry = useCallback((listingId, inquiryType, listingData = {}) => {
    analytics.trackEvent('listing_inquiry', {
      category: 'conversion',
      elementId: listingId,
      metadata: {
        inquiryType, // 'email', 'phone', 'form', 'whatsapp'
        listingPrice: listingData.price,
        listingMake: listingData.make,
        listingModel: listingData.model,
        listingYear: listingData.year,
        dealerId: listingData.dealerId,
        page: location.pathname,
        timeToInquiry: Date.now() - pageStartTime.current
      }
    });
  }, [analytics, location]);

  const trackNewsEngagement = useCallback((articleId, engagementType, engagementData = {}) => {
    analytics.trackEvent('news_engagement', {
      category: 'content',
      elementId: articleId,
      metadata: {
        engagementType, // 'read', 'share', 'comment', 'like'
        readProgress: engagementData.readProgress || 0,
        timeSpent: engagementData.timeSpent || (Date.now() - pageStartTime.current),
        socialPlatform: engagementData.socialPlatform,
        page: location.pathname
      }
    });
  }, [analytics, location]);

  // Mobile-specific tracking
  const trackMobileInteraction = useCallback((interactionType, elementId, touchData = {}) => {
    if (window.innerWidth <= 768) { // Mobile detection
      analytics.trackEvent('mobile_interaction', {
        category: 'interaction',
        elementId,
        metadata: {
          interactionType, // 'tap', 'swipe', 'pinch', 'long-press'
          touchPoints: touchData.touchPoints || 1,
          gesture: touchData.gesture,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
          page: location.pathname
        }
      });
    }
  }, [analytics, location]);

  // Session summary on page unload
  const trackSessionSummary = useCallback(() => {
    const sessionDuration = Date.now() - sessionStartTime.current;
    const pageViews = 1; // This would be tracked in a context provider
    
    analytics.trackEvent('session_summary', {
      category: 'system',
      metadata: {
        sessionDuration,
        totalInteractions: interactionCount.current,
        pagesViewed: pageViews,
        avgTimePerPage: sessionDuration / pageViews,
        exitPage: location.pathname,
        deviceType: window.innerWidth <= 768 ? 'mobile' : 
                   window.innerWidth <= 1024 ? 'tablet' : 'desktop'
      }
    });
  }, [analytics, location]);

  // Setup session tracking
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackSessionSummary();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackSessionSummary();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackSessionSummary]);

  // Return all tracking methods
  return {
    // Core tracking
    trackPageView,
    trackClick,
    trackEvent: analytics.trackEvent,

    // Business events
    trackListingView,
    trackSearch,
    trackDealerContact,
    trackPhoneClick,
    trackFavorite,
    trackArticleRead,
    trackFilterUsage,

    // Form tracking
    trackFormStart,
    trackFormComplete,
    trackFormAbandon,

    // Advanced tracking
    trackListingInquiry,
    trackNewsEngagement,
    trackMobileInteraction,
    trackError,
    trackPerformanceMetric,
    trackSessionSummary,

    // Utilities
    getSessionDuration: () => Date.now() - sessionStartTime.current,
    getPageDuration: () => Date.now() - pageStartTime.current,
    getInteractionCount: () => interactionCount.current
  };
};

export default useAnalytics;