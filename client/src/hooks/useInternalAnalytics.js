// src/hooks/useInternalAnalytics.js
import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import internalAnalytics from '../utils/internalAnalytics.js';

export const useInternalAnalytics = () => {
  const location = useLocation();

  // Track page views automatically
  useEffect(() => {
    try {
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        if (internalAnalytics && typeof internalAnalytics.trackPageView === 'function') {
          internalAnalytics.trackPageView(location.pathname, document.title);
        } else {
          console.warn('Analytics trackPageView not available');
        }
      }, 100);

      return () => clearTimeout(timer);
    } catch (error) {
      console.warn('Error in page view tracking:', error);
    }
  }, [location]);

  // Create safe tracking functions that won't break if analytics fails
  const trackEvent = useCallback((eventType, eventData) => {
    try {
      if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
        internalAnalytics.trackEvent(eventType, eventData);
      }
    } catch (error) {
      console.warn('Error tracking event:', error);
    }
  }, []);

  const trackListingView = useCallback((listingId, listingData) => {
    try {
      if (internalAnalytics && typeof internalAnalytics.trackListingView === 'function') {
        internalAnalytics.trackListingView(listingId, listingData);
      }
    } catch (error) {
      console.warn('Error tracking listing view:', error);
    }
  }, []);

  const trackSearch = useCallback((query, category, resultsCount, filters) => {
    try {
      if (internalAnalytics && typeof internalAnalytics.trackSearch === 'function') {
        internalAnalytics.trackSearch(query, category, resultsCount, filters);
      }
    } catch (error) {
      console.warn('Error tracking search:', error);
    }
  }, []);

  const trackDealerContact = useCallback((dealerId, contactMethod) => {
    try {
      if (internalAnalytics && typeof internalAnalytics.trackDealerContact === 'function') {
        internalAnalytics.trackDealerContact(dealerId, contactMethod);
      }
    } catch (error) {
      console.warn('Error tracking dealer contact:', error);
    }
  }, []);

  const trackPhoneClick = useCallback((phoneNumber, source) => {
    try {
      if (internalAnalytics && typeof internalAnalytics.trackPhoneClick === 'function') {
        internalAnalytics.trackPhoneClick(phoneNumber, source);
      }
    } catch (error) {
      console.warn('Error tracking phone click:', error);
    }
  }, []);

  const trackFavorite = useCallback((itemId, itemType, action) => {
    try {
      if (internalAnalytics && typeof internalAnalytics.trackFavorite === 'function') {
        internalAnalytics.trackFavorite(itemId, itemType, action);
      }
    } catch (error) {
      console.warn('Error tracking favorite:', error);
    }
  }, []);

  const trackArticleRead = useCallback((articleId, articleTitle, readTime) => {
    try {
      if (internalAnalytics && typeof internalAnalytics.trackArticleRead === 'function') {
        internalAnalytics.trackArticleRead(articleId, articleTitle, readTime);
      }
    } catch (error) {
      console.warn('Error tracking article read:', error);
    }
  }, []);

  const trackFilterUsage = useCallback((filters, resultCount) => {
    try {
      if (internalAnalytics && typeof internalAnalytics.trackFilterUsage === 'function') {
        internalAnalytics.trackFilterUsage(filters, resultCount);
      }
    } catch (error) {
      console.warn('Error tracking filter usage:', error);
    }
  }, []);

  return {
    trackEvent,
    trackListingView,
    trackSearch,
    trackDealerContact,
    trackPhoneClick,
    trackFavorite,
    trackArticleRead,
    trackFilterUsage
  };
};