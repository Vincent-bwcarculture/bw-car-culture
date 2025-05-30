// src/utils/analyticsErrorHandler.js
export const safeAnalyticsCall = async (analyticsFunction, fallback = null) => {
  try {
    return await analyticsFunction();
  } catch (error) {
    console.warn('Analytics call failed:', error);
    
    // Store failed events for retry
    const failedEvent = {
      timestamp: Date.now(),
      error: error.message,
      function: analyticsFunction.name
    };
    
    const failedEvents = JSON.parse(localStorage.getItem('failedAnalytics') || '[]');
    failedEvents.push(failedEvent);
    localStorage.setItem('failedAnalytics', JSON.stringify(failedEvents.slice(-50))); // Keep last 50
    
    return fallback;
  }
};

// Usage in components
const handleClick = async () => {
  await safeAnalyticsCall(() => 
    analytics.trackEvent('button_click', { buttonId: 'hero-cta' })
  );
  
  // Continue with main functionality
  performMainAction();
};
