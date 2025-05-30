// src/components/shared/InternalAnalyticsProvider.js
import React, { createContext, useContext, useEffect } from 'react';

// Create a simple context with safe defaults
const InternalAnalyticsContext = createContext({
  trackEvent: () => {},
  trackListingView: () => {},
  trackSearch: () => {},
  trackDealerContact: () => {},
  trackPhoneClick: () => {},
  trackFavorite: () => {},
  trackArticleRead: () => {},
  trackFilterUsage: () => {},
});

export const InternalAnalyticsProvider = ({ children }) => {
  useEffect(() => {
    console.log('InternalAnalyticsProvider initialized');
  }, []);

  // Provide safe default functions
  const contextValue = {
    trackEvent: (eventType, eventData) => {
      console.log('Analytics - Event:', eventType, eventData);
    },
    trackListingView: (listingId, listingData) => {
      console.log('Analytics - Listing View:', listingId, listingData);
    },
    trackSearch: (query, category, resultsCount, filters) => {
      console.log('Analytics - Search:', query, category, resultsCount, filters);
    },
    trackDealerContact: (dealerId, contactMethod) => {
      console.log('Analytics - Dealer Contact:', dealerId, contactMethod);
    },
    trackPhoneClick: (phoneNumber, source) => {
      console.log('Analytics - Phone Click:', phoneNumber, source);
    },
    trackFavorite: (itemId, itemType, action) => {
      console.log('Analytics - Favorite:', itemId, itemType, action);
    },
    trackArticleRead: (articleId, articleTitle, readTime) => {
      console.log('Analytics - Article Read:', articleId, articleTitle, readTime);
    },
    trackFilterUsage: (filters, resultCount) => {
      console.log('Analytics - Filter Usage:', filters, resultCount);
    },
  };

  return (
    <InternalAnalyticsContext.Provider value={contextValue}>
      {children}
    </InternalAnalyticsContext.Provider>
  );
};

export const useInternalAnalyticsContext = () => {
  return useContext(InternalAnalyticsContext);
};