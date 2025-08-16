// src/utils/internalAnalytics.js - Fixed with complete implementation
import { analyticsService } from '../services/analyticsService.js';

// Simple analytics object with defensive programming
const internalAnalytics = {
  isInitialized: false,
  sessionId: null,
  pageStartTime: Date.now(),
  eventQueue: [],
  maxQueueSize: 50,

  // Initialize analytics
  init() {
    try {
      if (this.isInitialized) return;
      
      this.sessionId = this.generateSessionId();
      this.setupEventListeners();
      this.isInitialized = true;
      
      console.log('Internal Analytics initialized successfully');
    } catch (error) {
      console.error('Error initializing internal analytics:', error);
    }
  },

  // Generate session ID
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // FIXED: Add the missing sendEventSafely method
  async sendEventSafely(eventType, eventData) {
    try {
      // Use the main analytics service to send events
      if (analyticsService && typeof analyticsService.trackEvent === 'function') {
        await analyticsService.trackEvent({
          eventType,
          ...eventData
        });
      } else {
        // If analytics service is not available, queue the event
        this.queueEvent(eventType, eventData);
      }
    } catch (error) {
      console.warn('⚠️ Failed to send analytics event safely:', error);
      // Queue the event for retry
      this.queueEvent(eventType, eventData);
    }
  },

  // Queue events when analytics service is not available
  queueEvent(eventType, eventData) {
    try {
      // Prevent queue from growing too large
      if (this.eventQueue.length >= this.maxQueueSize) {
        this.eventQueue.shift(); // Remove oldest event
      }

      this.eventQueue.push({
        eventType,
        eventData: {
          ...eventData,
          queuedAt: Date.now()
        }
      });

      console.log(`📦 Queued analytics event: ${eventType} (queue size: ${this.eventQueue.length})`);
    } catch (error) {
      console.warn('⚠️ Failed to queue analytics event:', error);
    }
  },

  // Process queued events
  async processQueuedEvents() {
    if (this.eventQueue.length === 0) return;

    console.log(`🔄 Processing ${this.eventQueue.length} queued analytics events...`);

    const eventsToProcess = [...this.eventQueue];
    this.eventQueue = [];

    for (const { eventType, eventData } of eventsToProcess) {
      try {
        // Skip events that are too old (older than 1 hour)
        if (eventData.queuedAt && (Date.now() - eventData.queuedAt) > 60 * 60 * 1000) {
          continue;
        }

        await this.sendEventSafely(eventType, eventData);
      } catch (error) {
        console.warn(`⚠️ Failed to process queued event ${eventType}:`, error);
        // Re-queue the event if it failed (up to max queue size)
        this.queueEvent(eventType, eventData);
      }
    }
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
        sessionId: this.sessionId,
        category: 'navigation'
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
        metadata: {
          ...eventData.metadata,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      console.log('Tracking event:', eventType);
      
      // Send event safely
      this.sendEventSafely(eventType, event);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  },

  // Setup event listeners
  setupEventListeners() {
    if (typeof window === 'undefined') return;

    try {
      // Track clicks on important elements
      document.addEventListener('click', (event) => {
        try {
          const target = event.target;
          
          // Track button clicks
          if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
            this.trackEvent('button_click', {
              category: 'interaction',
              elementId: target.id,
              elementText: target.textContent?.substring(0, 50),
              metadata: {
                buttonType: target.type || 'button',
                className: target.className
              }
            });
          }
          
          // Track link clicks
          if (target.tagName === 'A' && target.href) {
            this.trackEvent('link_click', {
              category: 'navigation',
              elementId: target.id,
              elementText: target.textContent?.substring(0, 50),
              metadata: {
                href: target.href,
                external: !target.href.includes(window.location.hostname)
              }
            });
          }
        } catch (error) {
          console.warn('Error in click tracking:', error);
        }
      });

      // Track form submissions
      document.addEventListener('submit', (event) => {
        try {
          const form = event.target;
          if (form.tagName === 'FORM') {
            this.trackEvent('form_submit', {
              category: 'conversion',
              elementId: form.id,
              metadata: {
                formName: form.name || form.id,
                action: form.action,
                method: form.method
              }
            });
          }
        } catch (error) {
          console.warn('Error in form submission tracking:', error);
        }
      });

      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        try {
          this.trackEvent('visibility_change', {
            category: 'engagement',
            metadata: {
              visibilityState: document.visibilityState,
              hidden: document.hidden
            }
          });

          // Process queued events when page becomes visible
          if (document.visibilityState === 'visible') {
            setTimeout(() => this.processQueuedEvents(), 1000);
          }
        } catch (error) {
          console.warn('Error in visibility change tracking:', error);
        }
      });

      // Track scroll events (throttled)
      let scrollTimeout;
      window.addEventListener('scroll', () => {
        if (scrollTimeout) return;
        
        scrollTimeout = setTimeout(() => {
          try {
            const scrollPercent = Math.round(
              (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );

            // Only track significant scroll milestones
            if (scrollPercent > 0 && scrollPercent % 25 === 0) {
              this.trackEvent('scroll_milestone', {
                category: 'engagement',
                metadata: {
                  scrollPercent,
                  page: window.location.pathname
                }
              });
            }
          } catch (error) {
            console.warn('Error in scroll tracking:', error);
          }
          
          scrollTimeout = null;
        }, 500);
      });

      console.log('✅ Internal analytics event listeners set up');
    } catch (error) {
      console.error('Error setting up analytics event listeners:', error);
    }
  },

  // Track listing views
  trackListingView(listingId, listingData = {}) {
    this.trackEvent('listing_view', {
      category: 'content',
      elementId: listingId,
      metadata: {
        listingId,
        ...listingData
      }
    });
  },

  // Track search queries
  trackSearch(query, resultsCount = 0, filters = {}) {
    this.trackEvent('search', {
      category: 'search',
      metadata: {
        query: query?.substring(0, 100), // Limit query length
        resultsCount,
        hasFilters: Object.keys(filters).length > 0,
        filters
      }
    });
  },

  // Track dealer contact
  trackDealerContact(dealerId, contactMethod = 'unknown') {
    this.trackEvent('dealer_contact', {
      category: 'conversion',
      elementId: dealerId,
      metadata: {
        dealerId,
        contactMethod
      }
    });
  },

  // Track phone clicks
  trackPhoneClick(phoneNumber, source = 'unknown') {
    this.trackEvent('phone_click', {
      category: 'conversion',
      metadata: {
        phoneNumber: phoneNumber?.replace(/\D/g, ''), // Remove non-digits
        source
      }
    });
  },

  // Track errors
  trackError(error, context = 'unknown') {
    this.trackEvent('error', {
      category: 'system',
      metadata: {
        errorMessage: error?.message || 'Unknown error',
        errorStack: error?.stack?.substring(0, 500),
        context,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    });
  },

  // Get session info
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      startTime: this.pageStartTime,
      isInitialized: this.isInitialized,
      queueSize: this.eventQueue.length
    };
  },

  // Manual retry of queued events
  retryQueuedEvents() {
    this.processQueuedEvents();
  },

  // Clear queue
  clearQueue() {
    this.eventQueue = [];
    console.log('🗑️ Analytics event queue cleared');
  }
};

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      internalAnalytics.init();
      
      // Process any queued events after initialization
      setTimeout(() => internalAnalytics.processQueuedEvents(), 2000);
    });
  } else {
    internalAnalytics.init();
    
    // Process any queued events after initialization
    setTimeout(() => internalAnalytics.processQueuedEvents(), 2000);
  }
}

// Periodically process queued events
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    if (internalAnalytics.eventQueue.length > 0) {
      internalAnalytics.processQueuedEvents();
    }
  }, 30000); // Every 30 seconds
}

export default internalAnalytics;