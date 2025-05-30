// src/utils/analytics.js
import { analyticsService } from '../services/analyticsService.js';

class ClientAnalytics {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.pageStartTime = Date.now();
    this.interactions = [];
    this.isInitialized = false;
  }

  // Initialize analytics tracking
  init() {
    if (this.isInitialized) return;

    this.setupPageTracking();
    this.setupInteractionTracking();
    this.setupPerformanceTracking();
    this.setupUnloadTracking();
    
    this.isInitialized = true;
  }

  // Generate unique session ID
  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Track page view
  trackPageView(pageName, title) {
    const pageData = {
      page: pageName || window.location.pathname,
      title: title || document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    };

    // Send to backend
    this.sendEvent('page_view', pageData);
  }

  // Track custom event
  trackEvent(eventType, eventData = {}) {
    const event = {
      eventType,
      category: eventData.category || 'interaction',
      elementId: eventData.elementId,
      elementText: eventData.elementText,
      page: window.location.pathname,
      value: eventData.value,
      metadata: eventData.metadata,
      timestamp: new Date().toISOString()
    };

    this.sendEvent('interaction', event);
  }

  // Track search
  trackSearch(query, category, resultsCount, filters = {}) {
    const searchData = {
      query,
      category,
      resultsCount,
      filters,
      timestamp: new Date().toISOString()
    };

    analyticsService.trackSearch(searchData).catch(console.error);
  }

  // Track listing view
  trackListingView(listingId, listingData = {}) {
    this.trackEvent('listing_view', {
      category: 'content',
      metadata: {
        listingId,
        ...listingData
      }
    });
  }

  // Track dealer contact
  trackDealerContact(dealerId, contactMethod = 'form') {
    this.trackEvent('dealer_contact', {
      category: 'conversion',
      metadata: {
        dealerId,
        contactMethod
      }
    });
  }

  // Track phone click
  trackPhoneClick(phoneNumber, source = 'listing') {
    this.trackEvent('phone_call', {
      category: 'conversion',
      metadata: {
        phoneNumber,
        source
      }
    });
  }

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
  }

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
  }

  // Track filter usage
  trackFilterUsage(filters, resultCount) {
    this.trackEvent('filter', {
      category: 'navigation',
      metadata: {
        filters,
        resultCount
      }
    });
  }

  // Setup automatic page tracking
  setupPageTracking() {
    // Track initial page load
    this.trackPageView();

    // Track page changes in SPA
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      setTimeout(() => this.trackPageView(), 0);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      setTimeout(() => this.trackPageView(), 0);
    };

    window.addEventListener('popstate', () => {
      setTimeout(() => this.trackPageView(), 0);
    });
  }

  // Setup interaction tracking
  setupInteractionTracking() {
    // Track clicks on important elements
    document.addEventListener('click', (e) => {
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

  // Setup performance tracking
  setupPerformanceTracking() {
    // Track page performance metrics
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        if (navigation) {
          const performanceData = {
            page: window.location.pathname,
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

  // Setup page unload tracking
  setupUnloadTracking() {
    const trackTimeOnPage = () => {
      const timeOnPage = Date.now() - this.pageStartTime;
      
      // Only track if user spent more than 10 seconds on page
      if (timeOnPage > 10000) {
        navigator.sendBeacon('/api/analytics/track', JSON.stringify({
          eventType: 'page_time',
          category: 'engagement',
          page: window.location.pathname,
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

  // Send event to backend
  async sendEvent(type, data) {
    try {
      if (type === 'interaction') {
        await analyticsService.trackEvent(data);
      } else if (type === 'page_view') {
        // Page views are handled by middleware
        console.log('Page view tracked:', data.page);
      }
    } catch (error) {
      console.error('Error sending analytics event:', error);
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

  // Get session info
  getSessionInfo() {
    return {
      sessionId: this.sessionId,
      startTime: this.pageStartTime,
      interactions: this.interactions.length
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
