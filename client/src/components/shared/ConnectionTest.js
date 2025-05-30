// src/components/shared/ConnectionTest.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ConnectionTest.css';

const ConnectionTest = () => {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);
  const MAX_RETRIES = 5;
  const INITIAL_RETRY_DELAY = 2000;
  const CHECK_INTERVAL = 60000; // From code 2

  // Updated checkConnection from code 1
  const checkConnection = useCallback(async (isRetry = false) => {
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/health?_t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        },
        signal: AbortSignal.timeout(2000) // Reduced from 3000ms in code 2 to 2000ms in code 1
      });

      if (response.ok || response.status === 429) {
        setStatus('connected');
        setError(null);
        setRetryCount(0);
        setIsVisible(false);
      } else {
        throw new Error(`Server returned status: ${response.status}`);
      }
    } catch (err) {
      const isRateLimited = err.message && err.message.includes('429');

      if (isRateLimited) {
        console.log('Server is rate limiting but available');
        setStatus('connected');
        setIsVisible(false);
        return;
      }

      const errorMessage = !window.navigator.onLine 
        ? 'Your internet connection appears to be offline'
        : err.message || 'Unable to connect to server';

      console.warn('Connection test failed:', errorMessage);
      setStatus('error');
      setError(errorMessage);
      setIsVisible(true);

      if (isRetry && retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        timeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          checkConnection(true);
        }, delay);
      }
    }
  }, [retryCount]);

  const handleManualRetry = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setStatus('checking');
    setRetryCount(0);
    checkConnection(true);
  }, [checkConnection]);

  // Clear timeout on unmount (from code 2)
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    checkConnection();

    const interval = setInterval(() => {
      if (status !== 'checking') {
        checkConnection();
      }
    }, CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
      clearTimeouts();
    };
  }, [checkConnection, status, clearTimeouts]);

  if (!isVisible) return null;

  return (
    <div className={`connection-status ${status}`} role="alert">
      <div className="status-content">
        {status === 'checking' && (
          <>
            <div className="spinner" role="progressbar" aria-label="Checking connection"></div>
            <span>Checking connection...</span>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="error-message">
              <span className="error-icon" aria-hidden="true">⚠️</span>
              <span>{error || 'Connection error'}</span>
            </div>
            
            <div className="action-buttons">
              <button 
                onClick={handleManualRetry}
                className="retry-button"
                disabled={status === 'checking'}
                aria-label="Retry connection"
              >
                {status === 'checking' ? (
                  <>
                    <span className="spinner-small" aria-hidden="true"></span>
                    Retrying...
                  </>
                ) : (
                  'Retry Connection'
                )}
              </button>
              
              <button 
                onClick={() => window.location.reload()}
                className="reload-button"
                aria-label="Reload page"
              >
                Reload Page
              </button>
            </div>

            {retryCount > 0 && (
              <div className="retry-count" aria-live="polite">
                Retry attempt {retryCount} of {MAX_RETRIES}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(ConnectionTest);