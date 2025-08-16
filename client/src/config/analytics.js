// src/config/analytics.js - Enhanced with better error handling
import ReactGA from "react-ga4";

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Google Analytics Measurement ID - using your existing environment variable name
export const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-MZJEGNKP4C';

// Initialize Google Analytics with enhanced error handling
export const initializeGA = async () => {
  if (!isBrowser) {
    console.log('📊 Google Analytics: Not in browser environment, skipping initialization');
    return;
  }

  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    console.log('📊 Google Analytics: No valid measurement ID provided');
    return;
  }

  try {
    // Check if already initialized
    if (window.gtag && window.GA_INITIALIZED) {
      console.log('📊 Google Analytics already initialized');
      return;
    }

    // Initialize with configuration array as per react-ga4 documentation
    ReactGA.initialize([
      {
        trackingId: GA_MEASUREMENT_ID,
        testMode: process.env.NODE_ENV !== 'production',
        gaOptions: {
          anonymizeIp: true,
          debug_mode: process.env.NODE_ENV !== 'production'
        }
      }
    ]);

    // Mark as initialized
    window.GA_INITIALIZED = true;
    
    console.log(`📊 Google Analytics initialized ${process.env.NODE_ENV === 'production' ? 'in production mode' : 'in test mode'} with ID: ${GA_MEASUREMENT_ID}`);
    
    // Track initial page load
    if (window.location) {
      trackPageView(window.location.pathname + window.location.search);
    }
    
  } catch (error) {
    console.error('❌ Error initializing Google Analytics:', error);
    // Don't throw the error - let the app continue working
  }
};

// Enhanced page view tracking with validation
export const trackPageView = (path) => {
  if (!isBrowser) return;
  
  try {
    // Validate path
    if (!path || typeof path !== 'string') {
      console.warn('⚠️ Invalid path provided to trackPageView:', path);
      return;
    }

    ReactGA.send({ 
      hitType: "pageview", 
      page: path,
      page_title: document.title || '',
      page_location: window.location.href || ''
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 GA Page view tracked: ${path}`);
    }
  } catch (error) {
    console.warn('⚠️ Error tracking page view:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
};

// Enhanced event tracking with validation
export const trackEvent = (category, action, label, value) => {
  if (!isBrowser) return;
  
  try {
    // Validate required parameters
    if (!category || !action) {
      console.warn('⚠️ Category and action are required for tracking events');
      return;
    }

    ReactGA.event({
      category: String(category),
      action: String(action),
      label: label ? String(label) : undefined,
      value: value ? Number(value) : undefined,
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 GA Event tracked: ${category} - ${action} - ${label || 'no label'}`);
    }
  } catch (error) {
    console.warn('⚠️ Error tracking event:', error);
  }
};

// Safe user login tracking
export const trackLogin = (method) => {
  try {
    if (!method) {
      console.warn('⚠️ Login method is required');
      return;
    }
    trackEvent('User', 'Login', method);
  } catch (error) {
    console.warn('⚠️ Error tracking login:', error);
  }
};

// Safe inventory interaction tracking
export const trackInventoryInteraction = (action, itemId, itemName) => {
  try {
    if (!action) {
      console.warn('⚠️ Action is required for inventory tracking');
      return;
    }
    
    const label = itemId && itemName ? `${itemId} - ${itemName}` : itemId || itemName || 'unknown';
    trackEvent('Inventory', action, label);
  } catch (error) {
    console.warn('⚠️ Error tracking inventory interaction:', error);
  }
};

// Enhanced search tracking
export const trackSearch = (searchTerm, resultsCount) => {
  try {
    if (!searchTerm) {
      console.warn('⚠️ Search term is required');
      return;
    }

    // Also send as a search event for better GA4 reporting
    ReactGA.event({
      category: 'Search',
      action: 'Execute',
      label: searchTerm,
      value: resultsCount || 0,
      // GA4 specific search parameters
      search_term: searchTerm,
      search_results: resultsCount || 0
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 GA Search tracked: "${searchTerm}" (${resultsCount || 0} results)`);
    }
  } catch (error) {
    console.warn('⚠️ Error tracking search:', error);
  }
};

// Safe business interaction tracking
export const trackBusinessInteraction = (action, businessId, businessName) => {
  try {
    if (!action) {
      console.warn('⚠️ Action is required for business tracking');
      return;
    }

    const label = businessId && businessName ? `${businessId} - ${businessName}` : businessId || businessName || 'unknown';
    trackEvent('Business', action, label);
  } catch (error) {
    console.warn('⚠️ Error tracking business interaction:', error);
  }
};

// Enhanced exception tracking
export const trackException = (description, fatal = false) => {
  if (!isBrowser) return;
  
  try {
    if (!description) {
      console.warn('⚠️ Description is required for exception tracking');
      return;
    }

    // Limit description length to prevent oversized events
    const limitedDescription = String(description).substring(0, 500);

    ReactGA.gtag('event', 'exception', {
      description: limitedDescription,
      fatal: Boolean(fatal)
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 GA Exception tracked: ${limitedDescription} (fatal: ${fatal})`);
    }
  } catch (error) {
    console.warn('⚠️ Error tracking exception:', error);
  }
};

// Enhanced timing tracking
export const trackTiming = (category, variable, value, label) => {
  if (!isBrowser) return;
  
  try {
    if (!category || !variable || value === undefined) {
      console.warn('⚠️ Category, variable, and value are required for timing tracking');
      return;
    }

    ReactGA.gtag('event', 'timing_complete', {
      name: String(variable),
      value: Number(value),
      event_category: String(category),
      event_label: label ? String(label) : undefined
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 GA Timing tracked: ${category}/${variable} = ${value}ms`);
    }
  } catch (error) {
    console.warn('⚠️ Error tracking timing:', error);
  }
};

// New: Track custom conversions for business metrics
export const trackConversion = (conversionType, value, currency = 'BWP') => {
  try {
    if (!conversionType) {
      console.warn('⚠️ Conversion type is required');
      return;
    }

    ReactGA.gtag('event', 'conversion', {
      send_to: GA_MEASUREMENT_ID,
      conversion_type: conversionType,
      value: value || 0,
      currency: currency
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 GA Conversion tracked: ${conversionType} (${value} ${currency})`);
    }
  } catch (error) {
    console.warn('⚠️ Error tracking conversion:', error);
  }
};

// New: Track user engagement
export const trackEngagement = (engagementType, duration) => {
  try {
    if (!engagementType) {
      console.warn('⚠️ Engagement type is required');
      return;
    }

    ReactGA.event({
      category: 'Engagement',
      action: engagementType,
      value: duration || 0
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 GA Engagement tracked: ${engagementType} (${duration || 0}s)`);
    }
  } catch (error) {
    console.warn('⚠️ Error tracking engagement:', error);
  }
};

// New: Check if GA is ready
export const isGAReady = () => {
  return isBrowser && window.gtag && window.GA_INITIALIZED;
};

// New: Get GA status for debugging
export const getGAStatus = () => {
  return {
    isBrowser,
    measurementId: GA_MEASUREMENT_ID,
    isInitialized: window.GA_INITIALIZED || false,
    hasGtag: typeof window.gtag === 'function',
    environment: process.env.NODE_ENV
  };
};

export default {
  initializeGA,
  trackPageView,
  trackEvent,
  trackLogin,
  trackInventoryInteraction,
  trackSearch,
  trackBusinessInteraction,
  trackException,
  trackTiming,
  trackConversion,
  trackEngagement,
  isGAReady,
  getGAStatus
};