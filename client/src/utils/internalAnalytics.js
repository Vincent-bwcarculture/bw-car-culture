// src/utils/internalAnalytics.js
import { analyticsService } from '../services/analyticsService.js';

// Simple analytics object with defensive programming
const internalAnalytics = {
  isInitialized: false,
  sessionId: null,
  pageStartTime: Date.now(),

  // Initialize analytics
  init() {
    try {
      if (this.isInitialized) return;
      
      this.sessionId = this.generateSessionId();
      this.setupEventListeners();
      this.isInitialized = true;
      
      console.log('Internal Analytics initialized successfully');
    } catch (error) {
      console.error('Error initializing analytics:', error);
    }
  },

  // Generate session ID
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Track page view - defensive implementation
  trackPageView(pageName, title) {
    try {
      if (typeof window === 'undefined') return;
      
      const pageData = {
        page: pageName || window.location.pathname,
        title: title || document.title,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId
      };

      console.log('Tracking page view:', pageData.page);
      
      // Don't wait for the API call to complete
      this.sendEventSafely('page_view', pageData);
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  },

  // Track custom event - defensive implementation
  trackEvent(eventType, eventData = {}) {
    try {
      if (typeof window === 'undefined') return;
      
      const event = {
        eventType,
        category: eventData.category || 'interaction',
        elementId: eventData.elementId,
        elementText: eventData.elementText,
        page: window.location.pathname,
        value: eventData.value,
        metadata: eventData.metadata,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId
      };

      console.log('Tracking event:', eventType);
      this.sendEventSafely('interaction', event);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  },

  // Track search
  trackSearch(query, category, resultsCount, filters = {}) {
    try {
      const searchData = {
        query,
        category,
        resultsCount,
        filters,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId
      };

      console.log('Tracking search:', query);
      this.sendEventSafely('search', searchData);
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  },

  // Track listing view
  trackListingView(listingId, listingData = {}) {
    this.trackEvent('listing_view', {
      category: 'content',
      metadata: {
        listingId,
        ...listingData
      }
    });
  },

  // Track dealer contact
  trackDealerContact(dealerId, contactMethod = 'form') {
    this.trackEvent('dealer_contact', {
      category: 'conversion',
      metadata: {
        dealerId,
        contactMethod
      }
    });
  },

  // Track phone click
  trackPhoneClick(phoneNumber, source = 'listing') {
    this.trackEvent('phone_call', {
      category: 'conversion',
      metadata: {
        phoneNumber,
        source
      }
    });
  },

  // Track favorite action
  trackFavorite(itemId, itemType, action = 'add') {
    this.trackEvent('listing_favorite', {
      category: 'engagement',
      metadata: {
        itemId,
        itemType,
        action
      }
    });
  },

  // Track news article read
  trackArticleRead(articleId, articleTitle, readTime = null) {
    this.trackEvent('news_read', {
      category: 'content',
      metadata: {
        articleId,
        articleTitle,
        readTime
      }
    });
  },

  // Track filter usage
  trackFilterUsage(filters, resultCount) {
    this.trackEvent('filter', {
      category: 'navigation',
      metadata: {
        filters,
        resultCount
      }
    });
  },

  // Safe event sending - won't break the app if it fails
  async sendEventSafely(type, data) {
    try {
      // Use setTimeout to make it non-blocking
      setTimeout(async () => {
        try {
          if (type === 'interaction' && analyticsService && analyticsService.trackEvent) {
            await analyticsService.trackEvent(data);
          } else if (type === 'search' && analyticsService && analyticsService.trackSearch) {
            await analyticsService.trackSearch(data);
          } else {
            console.log(`Analytics: ${type}`, data);
          }
        } catch (error) {
          console.warn('Analytics API call failed:', error.message);
        }
      }, 0);
    } catch (error) {
      console.warn('Analytics send failed:', error.message);
    }
  },

  // Setup basic event listeners
  setupEventListeners() {
    if (typeof document === 'undefined') return;

    try {
      // Track clicks on phone links
      document.addEventListener('click', (e) => {
        if (e.target.href && e.target.href.startsWith('tel:')) {
          this.trackPhoneClick(e.target.href.replace('tel:', ''));
        }
      });
    } catch (error) {
      console.warn('Error setting up event listeners:', error);
    }
  }
};

// Auto-initialize when this module loads
if (typeof window !== 'undefined') {
  // Initialize immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => internalAnalytics.init());
  } else {
    internalAnalytics.init();
  }
}

export default internalAnalytics;