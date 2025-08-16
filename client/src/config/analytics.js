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

    // Initialize with proper configuration for react-ga4
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      testMode: process.env.NODE_ENV !== 'production',
      gaOptions: {
        anonymizeIp: true,
        debug_mode: process.env.NODE_ENV !== 'production'
      }
    });

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

    // Check if GA is initialized
    if (!window.GA_INITIALIZED) {
      console.warn('⚠️ Google Analytics not initialized, skipping page view tracking');
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

    // Check if GA is initialized
    if (!window.GA_INITIALIZED) {
      console.warn('⚠️ Google Analytics not initialized, skipping event tracking');
      return;
    }

    ReactGA.event({
      category: String(category),
      action: String(action),
      label: label ? String(label) : undefined,
      value: value ? Number(value) : undefined
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 GA Event tracked: ${category} - ${action}`, { label, value });
    }
  } catch (error) {
    console.warn('⚠️ Error tracking event:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
};

// Enhanced exception tracking with validation
export const trackException = (description, fatal = false) => {
  if (!isBrowser) return;
  
  try {
    // Validate description
    if (!description) {
      console.warn('⚠️ Description is required for tracking exceptions');
      return;
    }

    // Check if GA is initialized
    if (!window.GA_INITIALIZED) {
      console.warn('⚠️ Google Analytics not initialized, skipping exception tracking');
      return;
    }

    ReactGA.gtag('event', 'exception', {
      description: String(description),
      fatal: Boolean(fatal)
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 GA Exception tracked: ${description} (fatal: ${fatal})`);
    }
  } catch (error) {
    console.warn('⚠️ Error tracking exception:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
};

// Enhanced timing tracking with validation
export const trackTiming = (category, variable, time, label) => {
  if (!isBrowser) return;
  
  try {
    // Validate required parameters
    if (!category || !variable || typeof time !== 'number') {
      console.warn('⚠️ Category, variable, and time (number) are required for tracking timing');
      return;
    }

    // Check if GA is initialized
    if (!window.GA_INITIALIZED) {
      console.warn('⚠️ Google Analytics not initialized, skipping timing tracking');
      return;
    }

    ReactGA.gtag('event', 'timing_complete', {
      name: variable,
      value: Math.round(time),
      event_category: category,
      event_label: label ? String(label) : undefined
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 GA Timing tracked: ${category} - ${variable}: ${time}ms`, { label });
    }
  } catch (error) {
    console.warn('⚠️ Error tracking timing:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
};

// Custom dimensions tracking (enhanced)
export const trackCustomDimension = (index, value) => {
  if (!isBrowser) return;
  
  try {
    // Validate parameters
    if (!index || !value || typeof index !== 'number') {
      console.warn('⚠️ Index (number) and value are required for custom dimensions');
      return;
    }

    // Check if GA is initialized
    if (!window.GA_INITIALIZED) {
      console.warn('⚠️ Google Analytics not initialized, skipping custom dimension tracking');
      return;
    }

    const customDimension = {};
    customDimension[`custom_parameter_${index}`] = String(value);
    
    ReactGA.gtag('event', 'custom_dimension', customDimension);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 GA Custom dimension tracked: ${index} = ${value}`);
    }
  } catch (error) {
    console.warn('⚠️ Error tracking custom dimension:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
};

// Enhanced user tracking
export const setUserProperties = (properties) => {
  if (!isBrowser) return;
  
  try {
    // Validate properties
    if (!properties || typeof properties !== 'object') {
      console.warn('⚠️ Properties object is required for setting user properties');
      return;
    }

    // Check if GA is initialized
    if (!window.GA_INITIALIZED) {
      console.warn('⚠️ Google Analytics not initialized, skipping user properties');
      return;
    }

    ReactGA.gtag('set', 'user_properties', properties);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 GA User properties set:', properties);
    }
  } catch (error) {
    console.warn('⚠️ Error setting user properties:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
};

// Enhanced consent tracking
export const grantConsent = (consentTypes = {}) => {
  if (!isBrowser) return;
  
  try {
    const defaultConsent = {
      ad_storage: 'granted',
      analytics_storage: 'granted',
      functionality_storage: 'granted',
      personalization_storage: 'granted',
      security_storage: 'granted',
      ...consentTypes
    };

    ReactGA.gtag('consent', 'update', defaultConsent);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 GA Consent granted:', defaultConsent);
    }
  } catch (error) {
    console.warn('⚠️ Error granting consent:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
};

// Enhanced consent denial
export const denyConsent = (consentTypes = {}) => {
  if (!isBrowser) return;
  
  try {
    const defaultDenial = {
      ad_storage: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      ...consentTypes
    };

    ReactGA.gtag('consent', 'update', defaultDenial);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 GA Consent denied:', defaultDenial);
    }
  } catch (error) {
    console.warn('⚠️ Error denying consent:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
};

// GA status check
export const isGAInitialized = () => {
  return isBrowser && window.GA_INITIALIZED === true;
};

// Enhanced configuration object
export const analyticsConfig = {
  measurementId: GA_MEASUREMENT_ID,
  isProduction: process.env.NODE_ENV === 'production',
  debugMode: process.env.NODE_ENV !== 'production',
  anonymizeIp: true,
  sampleRate: process.env.NODE_ENV === 'production' ? 100 : 100, // 100% sampling
  siteSpeedSampleRate: process.env.NODE_ENV === 'production' ? 10 : 100, // 10% in prod, 100% in dev
  cookieDomain: 'auto',
  cookieExpires: 63072000 // 2 years
};

// Export default configuration
export default analyticsConfig;