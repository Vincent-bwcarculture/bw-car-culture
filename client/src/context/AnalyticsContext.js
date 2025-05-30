// src/context/AnalyticsContext.js
import React, { createContext, useContext, useCallback } from 'react';
import { useInternalAnalytics } from '../hooks/useInternalAnalytics.js';

const AnalyticsContext = createContext();

export const AnalyticsProvider = ({ children }) => {
  const analytics = useInternalAnalytics();

  const trackListingInteraction = useCallback((action, listingId, listingData) => {
    analytics.trackEvent(`listing_${action}`, {
      category: 'content',
      metadata: {
        listingId,
        ...listingData
      }
    });
  }, [analytics]);

  const trackDealerInteraction = useCallback((action, dealerId, method = 'unknown') => {
    analytics.trackDealerContact(dealerId, method);
    analytics.trackEvent(`dealer_${action}`, {
      category: 'conversion',
      metadata: { dealerId, method }
    });
  }, [analytics]);

  const trackSearchInteraction = useCallback((query, filters, resultsCount) => {
    analytics.trackSearch(query, 'cars', resultsCount, filters);
  }, [analytics]);

  const value = {
    ...analytics,
    trackListingInteraction,
    trackDealerInteraction,
    trackSearchInteraction
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
};
