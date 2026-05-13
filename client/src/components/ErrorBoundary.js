// src/components/ErrorBoundary.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Enhanced API Error class
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
    this.timestamp = new Date().toISOString();
  }

  static handle(error) {
    if (error.response) {
      const { data, status } = error.response;
      
      // Handle specific HTTP status codes
      switch (status) {
        case 429:
          return new ApiError('Rate limit exceeded. Please try again later.', status, data);
        case 401:
          return new ApiError('Authentication required. Please login again.', status, data);
        case 403:
          return new ApiError('You do not have permission to perform this action.', status, data);
        case 404:
          return new ApiError('The requested resource was not found.', status, data);
        case 500:
          return new ApiError('Internal server error. Please try again later.', status, data);
        default:
          return new ApiError(
            data.message || 'An unexpected error occurred',
            status,
            data.errors
          );
      }
    }

    if (error.request) {
      return new ApiError(
        'Unable to connect to server. Please check your internet connection.',
        0
      );
    }

    return new ApiError(error.message || 'An unexpected error occurred', 500);
  }
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error, errorInfo) {
    // Auto-reload once on ChunkLoadError (stale cache after new deployment)
    const isChunkError = error.name === 'ChunkLoadError' ||
      (error.message && error.message.includes('Loading chunk')) ||
      (error.message && error.message.includes('Loading CSS chunk'));

    if (isChunkError) {
      const hasReloaded = sessionStorage.getItem('chunk_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
        return;
      }
      // Already reloaded once — clear flag and show error UI
      sessionStorage.removeItem('chunk_reload');
    } else {
      sessionStorage.removeItem('chunk_reload');
    }

    // Increment error count
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Enhanced error logging
    this.logError(error, errorInfo);

    // Handle specific error types
    if (error instanceof ApiError && error.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login';
      }
    }
  }

  logError(error, errorInfo) {
    const errorData = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        status: error instanceof ApiError ? error.status : null,
        data: error instanceof ApiError ? error.data : null
      },
      errorInfo,
      metadata: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        pathname: window.location.pathname,
        errorCount: this.state.errorCount
      }
    };

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', errorData);
    }

    // In production, you would send this to your error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // errorTrackingService.logError(errorData);
      console.error('Production error:', errorData);
    }
  }

  handleReset = () => {
    // Check if we've had too many errors
    if (this.state.errorCount >= 3) {
      // Too many errors, redirect to homepage
      window.location.href = '/';
      return;
    }

    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });

    // Reload only the current component if possible
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Enhanced default error UI
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <h2>Oops! Something went wrong</h2>
            <p className="error-message">
              {this.state.error instanceof ApiError 
                ? this.state.error.message 
                : 'An unexpected error occurred'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="error-details">
                <summary>Technical Details</summary>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            <div className="error-actions">
              <button 
                onClick={this.handleReset}
                className="error-reset-button"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="error-home-button"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Styles injected once for this boundary's fallback UI
if (typeof document !== 'undefined' && !document.getElementById('eb-styles')) {
  const styles = `
    .error-boundary-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 2rem;
      background: #080d1a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .error-boundary-content {
      width: 100%;
      max-width: 480px;
      padding: 3rem 2.5rem;
      background: #0d1426;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      text-align: center;
    }
    .error-boundary-content h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 0.85rem;
    }
    .error-message {
      font-size: 0.95rem;
      color: #64748b;
      line-height: 1.65;
      margin: 0 0 1.75rem;
    }
    .error-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }
    .error-reset-button, .error-home-button {
      padding: 0.7rem 1.75rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: opacity 0.15s, transform 0.15s;
    }
    .error-reset-button:hover, .error-home-button:hover {
      opacity: 0.88;
      transform: translateY(-1px);
    }
    .error-reset-button {
      background: #ff3300;
      color: #fff;
    }
    .error-home-button {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.15);
      color: #cbd5e1;
    }
    .error-details {
      margin: 0 0 1.5rem;
      text-align: left;
      background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 8px;
      padding: 0.75rem 1rem;
    }
    .error-details summary {
      cursor: pointer;
      font-size: 0.78rem;
      color: #475569;
      user-select: none;
    }
    .error-details pre {
      font-size: 0.72rem;
      color: #64748b;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 0.5rem 0 0;
      line-height: 1.5;
    }
    @media (max-width: 480px) {
      .error-boundary-content { padding: 2rem 1.5rem; }
      .error-actions { flex-direction: column; }
      .error-reset-button, .error-home-button { width: 100%; }
    }
  `;
  const el = document.createElement('style');
  el.id = 'eb-styles';
  el.textContent = styles;
  document.head.appendChild(el);
}

export default ErrorBoundary;