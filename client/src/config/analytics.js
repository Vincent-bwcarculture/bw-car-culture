// src/config/analytics.js
import ReactGA from "react-ga4";

// Google Analytics Measurement ID 
export const GA_MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID || 'G-MZJEGNKP4C';

// Initialize Google Analytics
export const initializeGA = () => {
  try {
    // Initialize with configuration array as per react-ga4 documentation
    ReactGA.initialize([
      {
        trackingId: GA_MEASUREMENT_ID,
        testMode: process.env.NODE_ENV !== 'production',
        gaOptions: {
          anonymizeIp: true
        }
      }
    ]);
    
    console.log(`Google Analytics initialized ${process.env.NODE_ENV === 'production' ? 'in production mode' : 'in test mode'}`);
  } catch (error) {
    console.error('Error initializing Google Analytics:', error);
  }
};

// Track page views
export const trackPageView = (path) => {
  try {
    ReactGA.send({ hitType: "pageview", page: path });
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Page view tracked: ${path}`);
    }
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

// Track events
export const trackEvent = (category, action, label, value) => {
  try {
    ReactGA.event({
      category: category,
      action: action,
      label: label,
      value: value,
    });
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Event tracked: ${category} - ${action} - ${label}`);
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

// Track user login
export const trackLogin = (method) => {
  trackEvent('User', 'Login', method);
};

// Track inventory interactions
export const trackInventoryInteraction = (action, itemId, itemName) => {
  trackEvent('Inventory', action, `${itemId} - ${itemName}`);
};

// Track search
export const trackSearch = (searchTerm, resultsCount) => {
  trackEvent('Search', 'Execute', searchTerm, resultsCount);
};

// Track business interaction
export const trackBusinessInteraction = (action, businessId, businessName) => {
  trackEvent('Business', action, `${businessId} - ${businessName}`);
};

// Track exceptions/errors
export const trackException = (description, fatal = false) => {
  try {
    ReactGA.gtag('event', 'exception', {
      description: description,
      fatal: fatal
    });
  } catch (error) {
    console.error('Error tracking exception:', error);
  }
};

// Track timing
export const trackTiming = (category, variable, value, label) => {
  try {
    ReactGA.gtag('event', 'timing_complete', {
      name: variable,
      value: value,
      event_category: category,
      event_label: label
    });
  } catch (error) {
    console.error('Error tracking timing:', error);
  }
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
  trackTiming
};