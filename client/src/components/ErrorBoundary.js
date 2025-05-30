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
    // Increment error count
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Enhanced error logging
    this.logError(error, errorInfo);

    // Handle specific error types
    if (error instanceof ApiError && error.status === 401) {
      // Handle authentication errors
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

// Enhanced styles with better responsiveness and accessibility
if (typeof document !== 'undefined') {
  const styles = `
    .error-boundary-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.8);
    }

    .error-boundary-content {
      width: 100%;
      max-width: 600px;
      padding: 2rem;
      text-align: center;
      background: rgba(20, 20, 20, 0.95);
      border: 1px solid #2c2c2c;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
    }

    .error-boundary-content h2 {
      color: #ff3300;
      font-size: 2rem;
      margin-bottom: 1.5rem;
      font-weight: 600;
    }

    .error-message {
      color: #ffffff;
      margin-bottom: 2rem;
      font-size: 1.1rem;
      line-height: 1.6;
    }

    .error-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 2rem;
    }

    .error-reset-button,
    .error-home-button {
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .error-reset-button {
      background: #ff3300;
      color: white;
    }

    .error-home-button {
      background: transparent;
      border: 1px solid #ff3300;
      color: #ff3300;
    }

    .error-reset-button:hover,
    .error-home-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 51, 0, 0.2);
    }

    .error-reset-button:hover {
      background: #cc2900;
    }

    .error-home-button:hover {
      background: rgba(255, 51, 0, 0.1);
    }

    .error-details {
      margin: 1.5rem 0;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      text-align: left;
      border: 1px solid rgba(255, 51, 0, 0.2);
    }

    .error-details summary {
      cursor: pointer;
      color: #888;
      padding: 0.5rem;
      user-select: none;
    }

    .error-details pre {
      color: #ff3300;
      font-size: 0.9rem;
      padding: 1rem;
      overflow-x: auto;
      white-space: pre-wrap;
      word-wrap: break-word;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      .error-boundary-content {
        margin: 1rem;
        padding: 1.5rem;
      }

      .error-boundary-content h2 {
        font-size: 1.5rem;
      }

      .error-message {
        font-size: 1rem;
      }

      .error-actions {
        flex-direction: column;
      }

      .error-reset-button,
      .error-home-button {
        width: 100%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .error-reset-button,
      .error-home-button {
        transition: none;
      }
    }

    @media (prefers-color-scheme: light) {
      .error-boundary-container {
        background: rgba(255, 255, 255, 0.9);
      }

      .error-boundary-content {
        background: rgba(255, 255, 255, 0.95);
        border-color: #eaeaea;
      }

      .error-message {
        color: #333;
      }
    }
  `;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default ErrorBoundary;