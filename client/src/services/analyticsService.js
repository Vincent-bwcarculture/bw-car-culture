// src/services/analyticsService.js - Complete Updated Version for Vercel
const BASE_URL = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';

class AnalyticsService {
  constructor() {
    // Updated to use /api/analytics for Vercel serverless functions
    this.baseURL = `${BASE_URL}/api/analytics`;
    this.cache = new Map();
    this.cacheExpiration = 5 * 60 * 1000; // 5 minutes
    this.isInitialized = false;
    this.sessionId = this.generateSessionId();
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  // Initialize service
  init() {
    if (this.isInitialized) return;
    
    console.log('🔧 Initializing Analytics Service...');
    console.log('Analytics API URL:', this.baseURL);
    
    // Setup online/offline detection
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.retryFailedEvents();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
    
    // Retry failed events on initialization
    this.retryFailedEvents();
    
    // Setup periodic retry
    setInterval(() => {
      this.retryFailedEvents();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    // Track page performance when available
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.trackPagePerformance();
        }, 1000);
      });
    }
    
    // Track page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.retryFailedEvents();
        }
      });
    }
    
    // Track errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackEvent({
          eventType: 'error',
          category: 'system',
          metadata: {
            message: event.error?.message || 'Unknown error',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack?.substring(0, 500)
          }
        }).catch(console.warn);
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackEvent({
          eventType: 'error',
          category: 'system',
          metadata: {
            type: 'unhandled_promise_rejection',
            reason: event.reason?.toString().substring(0, 500)
          }
        }).catch(console.warn);
      });
    }
    
    this.isInitialized = true;
    console.log('✅ Analytics Service initialized');
  }

  // Generate unique session ID
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get auth headers for API requests
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    // Add auth token if available
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Handle API response with detailed error information
  async handleResponse(response) {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails = null;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        if (errorData.error) {
          errorDetails = errorData.error;
        }
      } catch (e) {
        // If we can't parse JSON, use the status text
        console.warn('Could not parse error response JSON');
      }
      
      console.error(`❌ Analytics API Error: ${errorMessage}`, errorDetails);
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from analytics API');
    }
    
    return data;
  }

  // Cache management
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiration) {
      console.log(`📄 Using cached data for: ${key}`);
      return cached.data;
    }
    return null;
  }

  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Clean old cache entries
    if (this.cache.size > 50) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  // Get device information
  getDeviceInfo() {
    if (typeof window === 'undefined') return {};
    
    return {
      type: window.innerWidth <= 768 ? 'mobile' : 
            window.innerWidth <= 1024 ? 'tablet' : 'desktop',
      screenResolution: window.screen ? `${window.screen.width}x${window.screen.height}` : 'unknown',
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform
    };
  }

  // Get connection information
  getConnectionInfo() {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return {};
    }
    
    return {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    };
  }

  // Track custom event with retry logic
  async trackEvent(eventData) {
    try {
      // Don't track if offline
      if (!this.isOnline) {
        this.storeFailedEvent('trackEvent', eventData);
        return;
      }

      const payload = {
        eventType: eventData.eventType,
        category: eventData.category || 'general',
        page: eventData.page || (typeof window !== 'undefined' ? window.location.pathname : '/'),
        elementId: eventData.elementId,
        elementText: eventData.elementText,
        metadata: {
          ...eventData.metadata,
          url: typeof window !== 'undefined' ? window.location.href : '',
          referrer: typeof document !== 'undefined' ? document.referrer : ''
        },
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        device: this.getDeviceInfo(),
        connection: this.getConnectionInfo()
      };
      
      console.log('📊 Tracking event:', eventData.eventType, payload);
      
      const response = await fetch(`${this.baseURL}/track`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      
      const result = await this.handleResponse(response);
      console.log('✅ Event tracked successfully:', eventData.eventType);
      return result;
      
    } catch (error) {
      console.error('❌ Analytics trackEvent failed:', error.message);
      
      // Store failed events for retry
      this.storeFailedEvent('trackEvent', eventData);
      
      // Don't re-throw the error to prevent breaking user experience
      return null;
    }
  }

  // Track page view
  async trackPageView(pageData = {}) {
    return this.trackEvent({
      eventType: 'page_view',
      category: 'navigation',
      page: pageData.page || (typeof window !== 'undefined' ? window.location.pathname : '/'),
      metadata: {
        title: pageData.title || (typeof document !== 'undefined' ? document.title : ''),
        ...pageData.metadata
      }
    });
  }

  // Track search with enhanced data
  async trackSearch(searchData) {
    try {
      // Don't track if offline
      if (!this.isOnline) {
        this.storeFailedEvent('trackSearch', searchData);
        return;
      }

      const payload = {
        query: searchData.query,
        category: searchData.category || 'general',
        resultsCount: searchData.resultsCount || 0,
        filters: searchData.filters || {},
        searchTime: searchData.searchTime || 0,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        page: typeof window !== 'undefined' ? window.location.pathname : '/'
      };
      
      console.log('🔍 Tracking search:', searchData.query, payload);
      
      const response = await fetch(`${this.baseURL}/track/search`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      
      const result = await this.handleResponse(response);
      console.log('✅ Search tracked successfully:', searchData.query);
      return result;
      
    } catch (error) {
      console.error('❌ Analytics trackSearch failed:', error.message);
      this.storeFailedEvent('trackSearch', searchData);
      return null;
    }
  }

  // Track performance metrics
  async trackPerformance(performanceData) {
    try {
      const payload = {
        page: performanceData.page || (typeof window !== 'undefined' ? window.location.pathname : '/'),
        metrics: performanceData.metrics,
        connection: this.getConnectionInfo(),
        device: this.getDeviceInfo(),
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      };
      
      console.log('⚡ Tracking performance:', performanceData.page, payload);
      
      const response = await fetch(`${this.baseURL}/track/performance`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      
      const result = await this.handleResponse(response);
      console.log('✅ Performance tracked successfully');
      return result;
      
    } catch (error) {
      console.error('❌ Analytics trackPerformance failed:', error.message);
      return null;
    }
  }

  // Dashboard data retrieval methods
  async getDashboardData(days = 30) {
    const cacheKey = `dashboard-${days}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📊 Fetching dashboard data for ${days} days...`);
      
      const response = await fetch(`${this.baseURL}/dashboard?days=${days}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      const data = await this.handleResponse(response);
      
      // Validate data structure
      if (!data.success) {
        throw new Error(data.message || 'Dashboard data request was not successful');
      }
      
      if (!data.data) {
        throw new Error('No dashboard data returned from API');
      }
      
      console.log('✅ Dashboard data loaded successfully');
      this.setCachedData(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      throw error;
    }
  }

  async getRealTimeData() {
    // Don't cache real-time data
    try {
      console.log('⚡ Fetching real-time data...');
      
      const response = await fetch(`${this.baseURL}/realtime`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      const data = await this.handleResponse(response);
      
      if (!data.success) {
        throw new Error(data.message || 'Real-time data request was not successful');
      }
      
      console.log('✅ Real-time data loaded successfully');
      return data;
      
    } catch (error) {
      console.error('❌ Error fetching real-time data:', error);
      throw error;
    }
  }

  async getTrafficData(days = 30) {
    const cacheKey = `traffic-${days}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`🚦 Fetching traffic data for ${days} days...`);
      
      const response = await fetch(`${this.baseURL}/traffic?days=${days}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      const data = await this.handleResponse(response);
      
      if (!data.success) {
        throw new Error(data.message || 'Traffic data request was not successful');
      }
      
      console.log('✅ Traffic data loaded successfully');
      this.setCachedData(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('❌ Error fetching traffic data:', error);
      throw error;
    }
  }

  async getContentData(days = 30) {
    const cacheKey = `content-${days}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`📝 Fetching content data for ${days} days...`);
      
      const response = await fetch(`${this.baseURL}/content?days=${days}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      const data = await this.handleResponse(response);
      
      if (!data.success) {
        throw new Error(data.message || 'Content data request was not successful');
      }
      
      console.log('✅ Content data loaded successfully');
      this.setCachedData(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('❌ Error fetching content data:', error);
      throw error;
    }
  }

  async getPerformanceData(days = 7) {
    const cacheKey = `performance-${days}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log(`⚡ Fetching performance data for ${days} days...`);
      
      const response = await fetch(`${this.baseURL}/performance?days=${days}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      const data = await this.handleResponse(response);
      
      if (!data.success) {
        throw new Error(data.message || 'Performance data request was not successful');
      }
      
      console.log('✅ Performance data loaded successfully');
      this.setCachedData(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('❌ Error fetching performance data:', error);
      throw error;
    }
  }

  // Export data functionality
  async exportData(format = 'csv', days = 30) {
    try {
      console.log(`📤 Exporting analytics data (${format}, ${days} days)...`);
      
      const response = await fetch(`${this.baseURL}/export?format=${format}&days=${days}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: HTTP ${response.status}`);
      }
      
      console.log('✅ Data export successful');
      return response.blob();
      
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      throw error;
    }
  }

  // Health check - returns detailed status
  async checkHealth() {
    try {
      console.log('🔍 Checking analytics API health...');
      
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await this.handleResponse(response);
      
      console.log('✅ Analytics API health check passed:', data);
      return data;
      
    } catch (error) {
      console.error('❌ Analytics health check failed:', error);
      return { 
        success: false, 
        error: error.message,
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Utility methods
  getSessionId() {
    if (typeof sessionStorage === 'undefined') return this.sessionId;
    
    let sessionId = sessionStorage.getItem('analyticsSessionId');
    if (!sessionId) {
      sessionId = this.sessionId;
      sessionStorage.setItem('analyticsSessionId', sessionId);
    }
    return sessionId;
  }

  // Failed events management for offline support
  storeFailedEvent(type, data) {
    if (typeof localStorage === 'undefined') return;
    
    try {
      const failedEvents = JSON.parse(localStorage.getItem('failedAnalyticsEvents') || '[]');
      failedEvents.push({
        type,
        data,
        timestamp: Date.now(),
        retryCount: 0
      });
      
      // Keep only last 100 failed events
      if (failedEvents.length > 100) {
        failedEvents.splice(0, failedEvents.length - 100);
      }
      
      localStorage.setItem('failedAnalyticsEvents', JSON.stringify(failedEvents));
      console.log(`💾 Stored failed analytics event: ${type}`);
      
    } catch (error) {
      console.warn('❌ Failed to store failed analytics event:', error);
    }
  }

  // Retry failed events
  async retryFailedEvents() {
    if (typeof localStorage === 'undefined' || !this.isOnline) return;
    
    try {
      const failedEvents = JSON.parse(localStorage.getItem('failedAnalyticsEvents') || '[]');
      if (failedEvents.length === 0) return;
      
      console.log(`🔄 Retrying ${failedEvents.length} failed analytics events...`);
      
      const eventsToRetry = failedEvents.filter(event => 
        event.retryCount < 3 && (Date.now() - event.timestamp) < 24 * 60 * 60 * 1000 // 24 hours
      );
      
      let successCount = 0;
      
      for (const event of eventsToRetry) {
        try {
          if (event.type === 'trackEvent') {
            await this.trackEvent(event.data);
          } else if (event.type === 'trackSearch') {
            await this.trackSearch(event.data);
          }
          
          // Remove successful retry
          const index = failedEvents.indexOf(event);
          if (index > -1) {
            failedEvents.splice(index, 1);
            successCount++;
          }
        } catch (error) {
          // Increment retry count
          event.retryCount++;
          console.warn(`⚠️ Retry failed for ${event.type}:`, error.message);
        }
      }
      
      localStorage.setItem('failedAnalyticsEvents', JSON.stringify(failedEvents));
      
      if (successCount > 0) {
        console.log(`✅ Successfully retried ${successCount} analytics events`);
      }
      
    } catch (error) {
      console.warn('❌ Failed to retry analytics events:', error);
    }
  }

  // Track page performance automatically
  trackPagePerformance() {
    if (typeof window === 'undefined' || typeof performance === 'undefined') return;
    
    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      if (navigation) {
        const performanceData = {
          page: window.location.pathname,
          metrics: {
            loadTime: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
            domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
            timeToFirstByte: Math.round(navigation.responseStart - navigation.requestStart),
            networkTime: Math.round(navigation.responseEnd - navigation.fetchStart),
            renderTime: Math.round(navigation.loadEventEnd - navigation.responseEnd)
          }
        };
        
        this.trackPerformance(performanceData).catch(error => {
          console.warn('⚠️ Failed to track page performance:', error.message);
        });
      }
    } catch (error) {
      console.warn('⚠️ Error tracking page performance:', error);
    }
  }

  // Business-specific tracking methods
  trackListingView(listingId, listingData = {}) {
    return this.trackEvent({
      eventType: 'listing_view',
      category: 'content',
      elementId: listingId,
      metadata: {
        listingId,
        title: listingData.title,
        price: listingData.price,
        make: listingData.make,
        model: listingData.model,
        dealerId: listingData.dealerId,
        source: listingData.source || 'unknown'
      }
    });
  }

  trackDealerContact(dealerId, method = 'form', listingId = null) {
    return this.trackEvent({
      eventType: 'dealer_contact',
      category: 'conversion',
      elementId: dealerId,
      metadata: {
        dealerId,
        contactMethod: method,
        listingId
      }
    });
  }

  trackPhoneClick(phoneNumber, source = 'unknown', dealerId = null) {
    return this.trackEvent({
      eventType: 'phone_call',
      category: 'conversion',
      metadata: {
        phoneNumber: phoneNumber.replace(/[^\d]/g, ''), // Remove formatting
        source,
        dealerId
      }
    });
  }

  trackListingFavorite(listingId, action = 'add') {
    return this.trackEvent({
      eventType: 'listing_favorite',
      category: 'engagement',
      elementId: listingId,
      metadata: {
        listingId,
        action
      }
    });
  }

  trackNewsArticleRead(articleId, articleTitle, readTime = null) {
    return this.trackEvent({
      eventType: 'news_read',
      category: 'content',
      elementId: articleId,
      metadata: {
        articleId,
        articleTitle,
        readTime
      }
    });
  }

  trackFilterUsage(filters, resultCount) {
    return this.trackEvent({
      eventType: 'filter',
      category: 'navigation',
      metadata: {
        filters,
        resultCount
      }
    });
  }

  // Form tracking
  trackFormStart(formName, formId = null) {
    return this.trackEvent({
      eventType: 'form_start',
      category: 'engagement',
      elementId: formId,
      metadata: {
        formName,
        formId
      }
    });
  }

  trackFormComplete(formName, formId = null, success = true) {
    return this.trackEvent({
      eventType: 'form_complete',
      category: success ? 'conversion' : 'engagement',
      elementId: formId,
      metadata: {
        formName,
        formId,
        success
      }
    });
  }

  trackFormAbandon(formName, formId = null, stepReached = null) {
    return this.trackEvent({
      eventType: 'form_abandon',
      category: 'engagement',
      elementId: formId,
      metadata: {
        formName,
        formId,
        stepReached
      }
    });
  }

  // User journey tracking
  trackListingInquiry(listingId, inquiryType = 'general') {
    return this.trackEvent({
      eventType: 'listing_inquiry',
      category: 'conversion',
      elementId: listingId,
      metadata: {
        listingId,
        inquiryType
      }
    });
  }

  trackNewsEngagement(articleId, engagementType, value = null) {
    return this.trackEvent({
      eventType: 'news_engagement',
      category: 'engagement',
      elementId: articleId,
      metadata: {
        articleId,
        engagementType, // 'share', 'comment', 'like', 'bookmark'
        value
      }
    });
  }

  // Clear cache method
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Analytics cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: 50,
      entries: Array.from(this.cache.keys())
    };
  }

  // Get service status
  getStatus() {
    return {
      initialized: this.isInitialized,
      baseURL: this.baseURL,
      sessionId: this.sessionId,
      isOnline: this.isOnline,
      cacheSize: this.cache.size,
      lastActivity: new Date().toISOString()
    };
  }

  // Clear failed events
  clearFailedEvents() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('failedAnalyticsEvents');
      console.log('🗑️ Failed analytics events cleared');
    }
  }

  // Get failed events count
  getFailedEventsCount() {
    if (typeof localStorage === 'undefined') return 0;
    
    try {
      const failedEvents = JSON.parse(localStorage.getItem('failedAnalyticsEvents') || '[]');
      return failedEvents.length;
    } catch (error) {
      return 0;
    }
  }
}

// Create and export singleton instance
const analyticsService = new AnalyticsService();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => analyticsService.init());
  } else {
    analyticsService.init();
  }
}

export { analyticsService };
export default analyticsService;