// src/hooks/useMobileAnalytics.js
import { useEffect, useCallback } from 'react';
import { useAnalytics } from '../context/AnalyticsContext.js';

export const useMobileAnalytics = () => {
  const analytics = useAnalytics();

  // Detect mobile device
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Battery status tracking (if supported)
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        // Track battery level for mobile optimization
        if (battery.level < 0.2) { // Low battery
          analytics.trackEvent('low_battery_detected', {
            category: 'system',
            metadata: {
              batteryLevel: battery.level,
              charging: battery.charging
            }
          });
        }
      });
    }
  }, [analytics]);

  // Network status tracking
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      const trackConnectionChange = () => {
        analytics.trackEvent('connection_change', {
          category: 'system',
          metadata: {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
          }
        });
      };

      connection.addEventListener('change', trackConnectionChange);
      
      return () => {
        connection.removeEventListener('change', trackConnectionChange);
      };
    }
  }, [analytics]);

  // Touch interaction tracking
  const trackTouchInteraction = useCallback((element, action) => {
    analytics.trackEvent('touch_interaction', {
      category: 'mobile_interaction',
      metadata: {
        element,
        action,
        timestamp: Date.now()
      }
    });
  }, [analytics]);

  // Screen orientation tracking
  useEffect(() => {
    const handleOrientationChange = () => {
      analytics.trackEvent('orientation_change', {
        category: 'mobile_interaction',
        metadata: {
          orientation: screen.orientation?.type || 'unknown',
          angle: screen.orientation?.angle || 0
        }
      });
    };

    if (screen.orientation) {
      screen.orientation.addEventListener('change', handleOrientationChange);
      
      return () => {
        screen.orientation.removeEventListener('change', handleOrientationChange);
      };
    }
  }, [analytics]);

  return {
    isMobile,
    trackTouchInteraction
  };
};
