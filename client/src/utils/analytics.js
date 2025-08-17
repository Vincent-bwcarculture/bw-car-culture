// src/utils/analytics.js - COMPLETE WITH FIXED SESSION MANAGEMENT
import { analyticsService } from '../services/analyticsService.js';

class ClientAnalytics {
  constructor() {
    // ✅ FIXED: Persistent session management instead of generating new session every time
    this.sessionId = this.getOrCreateSession();
    this.pageStartTime = Date.now();
    this.interactions = [];
    this.isInitialized = false;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  // ==================== FIXED SESSION MANAGEMENT ====================
  
  getOrCreateSession() {
    // Check for existing session first
    let sessionId = sessionStorage.getItem('bwcc_session_id');
    const sessionStart = sessionStorage.getItem('bwcc_session_start');
    
    // Session timeout: 30 minutes of inactivity
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    const now = Date.now();
    
    // If session exists, check if it's still valid
    if (sessionId && sessionStart) {
      const sessionAge = now - parseInt(sessionStart);
      const lastActivity = localStorage.getItem('bwcc_last_activity') || sessionStart;
      const timeSinceActivity = now - parseInt(lastActivity);
      
      // Reuse session if it's less than 30 minutes since last activity
      if (timeSinceActivity < SESSION_TIMEOUT) {
        console.log('♻️ Reusing existing session:', sessionId, `(${Math.round(timeSinceActivity/1000/60)}min ago)`);
        // Update last activity
        localStorage.setItem('bwcc_last_activity', now.toString());
        return sessionId;
      } else {
        console.log('⏰ Session expired, creating new one. Last activity:', Math.round(timeSinceActivity/1000/60), 'minutes ago');
      }
    }
    
    // Create new session
    sessionId = `bwcc_${now}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('bwcc_session_id', sessionId);
    sessionStorage.setItem('bwcc_session_start', now.toString());
    localStorage.setItem('bwcc_last_activity', now.toString());
    
    console.log('🆕 Created new session:', sessionId);
    return sessionId;
  }

  // Update activity timestamp on every interaction
  updateActivity() {
    localStorage.setItem('bwcc_last_activity', Date.now().toString());
  }

  // ✅ NEW: Device identification helpers
  getDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }
  
  getBrowserInfo() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
    
    return 'Unknown';
  }

  // ✅ NEW: Reliable sending with retry logic
  async sendEventWithRetry(eventType, data, attempt = 1) {
    try {
      // Try the existing sendEvent method first
      await this.sendEvent(eventType, data);
      console.log('✅ Analytics sent successfully via service');
      
    } catch (error) {
      console.warn(`❌ Analytics attempt ${attempt} failed:`, error.message);
      
      if (attempt < this.retryAttempts) {
        await this.delay(this.retryDelay * attempt);
        return this.sendEventWithRetry(eventType, data, attempt + 1);
      }
      
      console.error('❌ Analytics failed after all retries');
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== ENHANCED ORIGINAL METHODS ====================

  // Initialize analytics tracking
  init() {
    if (this.isInitialized) return;

    this.setupPageTracking();
    this.setupInteractionTracking();
    this.setupPerformanceTracking();
    this.setupUnloadTracking();
    this.setupActivityTracking(); // ✅ NEW: Activity tracking
    
    this.isInitialized = true;
    console.log('📊 Analytics initialized with session:', this.sessionId);
  }

  // ✅ NEW: Setup activity tracking to prevent false new sessions
  setupActivityTracking() {
    // Update activity on user interactions
    ['click', 'scroll', 'keydown', 'mousemove'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.updateActivity();
      }, { passive: true });
    });
    
    // Update activity periodically for active users
    setInterval(() => {
      this.updateActivity();
    }, 60000); // Every minute
  }

  // ✅ ENHANCED: Track page view with persistent session
  trackPageView(pageName, title) {
    this.updateActivity(); // Update activity on page view
    
    const pageData = {
      page: pageName || window.location.pathname,
      title: title || document.title,
      referrer: document.referrer,
      sessionId: this.sessionId, // ✅ Use persistent session ID
      timestamp: new Date().toISOString(),
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent,
      // ✅ NEW: Device info for better visitor identification
      deviceType: this.getDeviceType(),
      browser: this.getBrowserInfo()
    };

    // Send to backend with retry logic
    this.sendEventWithRetry('page_view', pageData);
  }

  // ✅ ENHANCED: Track custom event with activity update and session ID
  trackEvent(eventType, eventData = {}) {
    this.updateActivity(); // Update activity on event
    
    const event = {
      eventType,
      category: eventData.category || 'interaction',
      elementId: eventData.elementId,
      elementText: eventData.elementText,
      page: window.location.pathname,
      sessionId: this.sessionId, // ✅ Use persistent session ID
      value: eventData.value,
      metadata: {
        ...eventData.metadata,
        deviceType: this.getDeviceType(),
        browser: this.getBrowserInfo(),
        timestamp: new Date().toISOString()
      }
    };

    this.sendEventWithRetry('interaction', event);
  }

  // ✅ ENHANCED: Track search with session ID
  trackSearch(query, category, resultsCount, filters = {}) {
    this.updateActivity();
    
    const searchData = {
      query,
      category,
      resultsCount,
      filters,
      sessionId: this.sessionId, // ✅ Add session ID
      timestamp: new Date().toISOString()
    };

    analyticsService.trackSearch(searchData).catch(console.error);
  }

  // ✅ ENHANCED: Track listing view with session ID
  trackListingView(listingId, listingData = {}) {
    this.updateActivity();
    
    this.trackEvent('listing_view', {
      category: 'content',
      metadata: {
        listingId,
        sessionId: this.sessionId, // ✅ Add session ID
        ...listingData
      }
    });
  }

  // ✅ ENHANCED: Track dealer contact with session ID
  trackDealerContact(dealerId, contactMethod = 'form') {
    this.updateActivity();
    
    this.trackEvent('dealer_contact', {
      category: 'conversion',
      metadata: {
        dealerId,
        contactMethod,
        sessionId: this.sessionId // ✅ Add session ID
      }
    });
  }

  // ✅ ENHANCED: Track phone click with session ID
  trackPhoneClick(phoneNumber, source = 'listing') {
    this.updateActivity();
    
    this.trackEvent('phone_call', {
      category: 'conversion',
      metadata: {
        phoneNumber,
        source,
        sessionId: this.sessionId // ✅ Add session ID
      }
    });
  }

  // ✅ ENHANCED: Track favorite action with session ID
  trackFavorite(itemId, itemType, action = 'add') {
    this.updateActivity();
    
    this.trackEvent('listing_favorite', {
      category: 'engagement',
      metadata: {
        itemId,
        itemType,
        action,
        sessionId: this.sessionId // ✅ Add session ID
      }
    });
  }

  // ✅ ENHANCED: Track news article read with session ID
  trackArticleRead(articleId, articleTitle, readTime = null) {
    this.updateActivity();
    
    this.trackEvent('news_read', {
      category: 'content',
      metadata: {
        articleId,
        articleTitle,
        readTime,
        sessionId: this.sessionId // ✅ Add session ID
      }
    });
  }

  // ✅ ENHANCED: Track filter usage with session ID
  trackFilterUsage(filters, resultCount) {
    this.updateActivity();
    
    this.trackEvent('filter', {
      category: 'navigation',
      metadata: {
        filters,
        resultCount,
        sessionId: this.sessionId // ✅ Add session ID
      }
    });
  }

  // ✅ ENHANCED: Setup automatic page tracking with better session handling
  setupPageTracking() {
    // Track initial page load
    this.trackPageView();

    // Track page changes in SPA
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      setTimeout(() => {
        this.pageStartTime = Date.now(); // Reset page start time
        this.trackPageView();
      }, 0);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      setTimeout(() => {
        this.pageStartTime = Date.now(); // Reset page start time
        this.trackPageView();
      }, 0);
    };

    window.addEventListener('popstate', () => {
      setTimeout(() => {
        this.pageStartTime = Date.now(); // Reset page start time
        this.trackPageView();
      }, 0);
    });
  }

  // ✅ ENHANCED: Setup interaction tracking with activity updates
  setupInteractionTracking() {
    // Track clicks on important elements
    document.addEventListener('click', (e) => {
      this.updateActivity(); // Update activity on any click
      const element = e.target;
      
      // Track button clicks
      if (element.tagName === 'BUTTON' || element.closest('button')) {
        const button = element.tagName === 'BUTTON' ? element : element.closest('button');
        this.trackEvent('click', {
          category: 'interaction',
          elementId: button.id,
          elementText: button.textContent?.trim().substring(0, 50),
          metadata: {
            className: button.className,
            type: button.type
          }
        });
      }

      // Track link clicks
      if (element.tagName === 'A' || element.closest('a')) {
        const link = element.tagName === 'A' ? element : element.closest('a');
        this.trackEvent('click', {
          category: 'navigation',
          elementId: link.id,
          elementText: link.textContent?.trim().substring(0, 50),
          metadata: {
            href: link.href,
            target: link.target
          }
        });
      }

      // Track phone number clicks
      if (element.href && element.href.startsWith('tel:')) {
        this.trackPhoneClick(element.href.replace('tel:', ''));
      }
    });

    // Track form submissions
    document.addEventListener('submit', (e) => {
      this.updateActivity(); // Update activity on form submit
      const form = e.target;
      this.trackEvent('form_submit', {
        category: 'conversion',
        elementId: form.id,
        metadata: {
          action: form.action,
          method: form.method,
          className: form.className
        }
      });
    });

    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', this.debounce(() => {
      this.updateActivity(); // Update activity on scroll
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
        maxScroll = scrollPercent;
        this.trackEvent('scroll', {
          category: 'engagement',
          value: scrollPercent,
          metadata: {
            depth: `${scrollPercent}%`
          }
        });
      }
    }, 1000));
  }

  // ✅ ENHANCED: Setup performance tracking with session ID
  setupPerformanceTracking() {
    // Track page performance metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        if (navigation) {
          const performanceData = {
            page: window.location.pathname,
            sessionId: this.sessionId, // ✅ Add session ID
            metrics: {
              loadTime: navigation.loadEventEnd - navigation.loadEventStart,
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
              largestContentfulPaint: 0, // Will be updated by LCP observer
              firstInputDelay: 0, // Will be updated by FID observer
              cumulativeLayoutShift: 0 // Will be updated by CLS observer
            },
            connection: {
              effectiveType: navigator.connection?.effectiveType,
              downlink: navigator.connection?.downlink,
              rtt: navigator.connection?.rtt
            },
            deviceInfo: {
              deviceType: this.getDeviceType(),
              browser: this.getBrowserInfo(),
              userAgent: navigator.userAgent
            }
          };

          analyticsService.trackPerformance(performanceData).catch(console.error);
        }
      }, 1000);
    });

    // Track Web Vitals if available
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        // Track LCP
        this.trackEvent('performance_metric', {
          category: 'performance',
          value: lastEntry.startTime,
          metadata: {
            metric: 'LCP',
            value: lastEntry.startTime
          }
        });
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        
        if (clsValue > 0) {
          this.trackEvent('performance_metric', {
            category: 'performance',
            value: clsValue,
            metadata: {
              metric: 'CLS',
              value: clsValue
            }
          });
        }
      });
      
      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }
  }

  // ✅ ENHANCED: Setup page unload tracking with session ID
  setupUnloadTracking() {
    const trackTimeOnPage = () => {
      const timeOnPage = Date.now() - this.pageStartTime;
      
      // Only track if user spent more than 10 seconds on page
      if (timeOnPage > 10000) {
        navigator.sendBeacon('/api/analytics/track', JSON.stringify({
          eventType: 'page_time',
          category: 'engagement',
          page: window.location.pathname,
          sessionId: this.sessionId, // ✅ Add session ID
          value: timeOnPage,
          timestamp: new Date().toISOString()
        }));
      }
    };

    window.addEventListener('beforeunload', trackTimeOnPage);
    window.addEventListener('pagehide', trackTimeOnPage);
    
    // Also track periodically for long sessions
    setInterval(trackTimeOnPage, 30000); // Every 30 seconds
  }

  // ✅ ENHANCED: Send event to backend with session ID
  async sendEvent(type, data) {
    try {
      // Ensure all events have session ID
      const eventData = {
        ...data,
        sessionId: this.sessionId
      };

      if (type === 'interaction') {
        await analyticsService.trackEvent(eventData);
      } else if (type === 'page_view') {
        // Page views are handled by middleware
        console.log('Page view tracked:', data.page);
        
        // Also send directly to analytics endpoint for immediate tracking
        try {
          await fetch('https://bw-car-culture-api.vercel.app/analytics/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              eventType: 'page_view',
              page: data.page,
              sessionId: this.sessionId,
              metadata: data
            })
          });
        } catch (fetchError) {
          console.warn('Direct analytics tracking failed:', fetchError);
        }
      }
    } catch (error) {
      console.error('Error sending analytics event:', error);
      throw error; // Re-throw for retry logic
    }
  }

  // Utility function to debounce events
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // ✅ ENHANCED: Get session info with persistent session details
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      sessionStartTime: sessionStorage.getItem('bwcc_session_start'),
      lastActivity: localStorage.getItem('bwcc_last_activity'),
      pageStartTime: this.pageStartTime,
      interactions: this.interactions.length,
      isInitialized: this.isInitialized,
      deviceType: this.getDeviceType(),
      browser: this.getBrowserInfo()
    };
  }
}

// Create global analytics instance
const analytics = new ClientAnalytics();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => analytics.init());
} else {
  analytics.init();
}

export default analytics;