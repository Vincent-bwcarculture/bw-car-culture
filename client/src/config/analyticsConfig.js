// src/config/analyticsConfig.js

// Production analytics configuration
export const frontendAnalyticsConfig = {
  // Tracking settings
  tracking: {
    enabled: process.env.REACT_APP_ANALYTICS_ENABLED !== 'false',
    debug: process.env.NODE_ENV === 'development',
    samplingRate: parseFloat(process.env.REACT_APP_ANALYTICS_SAMPLING_RATE) || 1.0,
    
    // Batch settings for performance
    batchSize: parseInt(process.env.REACT_APP_ANALYTICS_BATCH_SIZE) || 10,
    flushInterval: parseInt(process.env.REACT_APP_ANALYTICS_FLUSH_INTERVAL) || 30000, // 30 seconds
    
    // Rate limiting
    maxEventsPerMinute: parseInt(process.env.REACT_APP_ANALYTICS_MAX_EVENTS_PER_MINUTE) || 100,
    
    // Error handling
    retryAttempts: parseInt(process.env.REACT_APP_ANALYTICS_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.REACT_APP_ANALYTICS_RETRY_DELAY) || 1000
  },

  // Privacy settings
  privacy: {
    respectDoNotTrack: process.env.REACT_APP_ANALYTICS_RESPECT_DNT !== 'false',
    requireConsent: process.env.REACT_APP_ANALYTICS_REQUIRE_CONSENT === 'true',
    anonymizeIPs: process.env.REACT_APP_ANALYTICS_ANONYMIZE_IPS !== 'false',
    
    // Cookie consent integration
    consentCookieName: 'analytics_consent',
    consentDuration: 365 // days
  },

  // Performance tracking
  performance: {
    enabled: process.env.REACT_APP_ANALYTICS_PERFORMANCE !== 'false',
    trackWebVitals: process.env.REACT_APP_ANALYTICS_WEB_VITALS !== 'false',
    trackResourceTiming: process.env.REACT_APP_ANALYTICS_RESOURCE_TIMING === 'true',
    
    // Thresholds for automatic tracking
    slowPageThreshold: parseInt(process.env.REACT_APP_ANALYTICS_SLOW_PAGE_THRESHOLD) || 3000,
    errorBoundaryTracking: process.env.REACT_APP_ANALYTICS_ERROR_BOUNDARY !== 'false'
  },

  // Feature flags
  features: {
    pageViews: process.env.REACT_APP_ANALYTICS_PAGE_VIEWS !== 'false',
    interactions: process.env.REACT_APP_ANALYTICS_INTERACTIONS !== 'false',
    searches: process.env.REACT_APP_ANALYTICS_SEARCHES !== 'false',
    errors: process.env.REACT_APP_ANALYTICS_ERRORS !== 'false',
    
    // Advanced features
    heatmaps: process.env.REACT_APP_ANALYTICS_HEATMAPS === 'true',
    sessionRecording: process.env.REACT_APP_ANALYTICS_SESSION_RECORDING === 'true',
    realTimeEvents: process.env.REACT_APP_ANALYTICS_REALTIME === 'true'
  },

  // API configuration
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    endpoints: {
      track: '/analytics/track',
      search: '/analytics/track/search',
      performance: '/analytics/track/performance',
      batch: '/analytics/track/batch'
    },
    timeout: parseInt(process.env.REACT_APP_ANALYTICS_API_TIMEOUT) || 10000
  },

  // Mobile optimization
  mobile: {
    reducedTracking: process.env.REACT_APP_ANALYTICS_MOBILE_REDUCED === 'true',
    wifiOnlyUploads: process.env.REACT_APP_ANALYTICS_WIFI_ONLY === 'true',
    batteryOptimization: process.env.REACT_APP_ANALYTICS_BATTERY_OPT === 'true'
  }
};

// Validation function
export const validateAnalyticsConfig = () => {
  const errors = [];
  
  if (frontendAnalyticsConfig.tracking.samplingRate < 0 || frontendAnalyticsConfig.tracking.samplingRate > 1) {
    errors.push('Sampling rate must be between 0 and 1');
  }
  
  if (frontendAnalyticsConfig.tracking.batchSize < 1 || frontendAnalyticsConfig.tracking.batchSize > 100) {
    errors.push('Batch size must be between 1 and 100');
  }
  
  if (frontendAnalyticsConfig.api.timeout < 1000 || frontendAnalyticsConfig.api.timeout > 60000) {
    errors.push('API timeout must be between 1000ms and 60000ms');
  }
  
  if (errors.length > 0) {
    console.error('Analytics configuration errors:', errors);
    return false;
  }
  
  return true;
};

// Initialize configuration
validateAnalyticsConfig();

export default frontendAnalyticsConfig;
