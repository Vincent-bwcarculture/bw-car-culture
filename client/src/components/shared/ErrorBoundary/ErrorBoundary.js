// src/components/shared/ErrorBoundary/ErrorBoundary.js
import React, { Component } from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You could send this to your error tracking service
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('event', 'exception', {
    //     description: error.toString(),
    //     fatal: false
    //   });
    // }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p>We're sorry for the inconvenience. Please try refreshing the page.</p>
            {this.props.showDetails && (
              <details>
                <summary>Technical Details</summary>
                <p>{this.state.error && this.state.error.toString()}</p>
                <div className="error-stack">
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </div>
              </details>
            )}
            <div className="error-actions">
              <button 
                onClick={() => window.location.reload()}
                className="reload-button"
              >
                Reload Page
              </button>
              <button 
                onClick={() => window.history.back()}
                className="back-button"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
