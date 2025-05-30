// src/components/shared/AnalyticsProvider.js
import React, { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../../utils/analytics.js';

const AnalyticsContext = createContext(null);

export const AnalyticsProvider = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Initialize analytics
    analytics.init();
  }, []);

  useEffect(() => {
    // Track page changes
    analytics.trackPageView(location.pathname, document.title);
  }, [location]);

  const contextValue = {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackListingView: analytics.trackListingView.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackDealerContact: analytics.trackDealerContact.bind(analytics),
    trackPhoneClick: analytics.trackPhoneClick.bind(analytics),
    trackFavorite: analytics.trackFavorite.bind(analytics),
    trackArticleRead: analytics.trackArticleRead.bind(analytics),
    trackFilterUsage: analytics.trackFilterUsage.bind(analytics),
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};
