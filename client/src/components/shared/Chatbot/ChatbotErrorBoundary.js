// src/components/shared/Chatbot/ChatbotErrorBoundary.js
import React from 'react';

class ChatbotErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Chatbot Error:', error, errorInfo);
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production' && typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="chatbot-error-fallback">
          <div className="chatbot-error-content">
            <div className="chatbot-error-icon">⚠️</div>
            <h3>Chatbot Temporarily Unavailable</h3>
            <p>We're experiencing technical difficulties with the chat assistant.</p>
            
            {this.state.retryCount < 3 && (
              <button 
                className="chatbot-error-retry"
                onClick={this.handleRetry}
              >
                Try Again
              </button>
            )}
            
            <div className="chatbot-error-alternatives">
              <p>You can still:</p>
              <a href="/marketplace" className="chatbot-error-link">Browse Cars</a>
              <a href="/news" className="chatbot-error-link">Read Reviews</a>
              <a href="/contact" className="chatbot-error-link">Contact Support</a>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="chatbot-error-details">
                <summary>Error Details (Development)</summary>
                <pre>{this.state.error && this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// src/utils/chatbotHelpers.js
export const chatbotHelpers = {
  // Message processing utilities
  sanitizeMessage: (message) => {
    if (!message || typeof message !== 'string') return '';
    
    // Remove potentially harmful content
    return message
      .trim()
      .slice(0, 500) // Limit length
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  },

  // Time-based greeting
  getTimeBasedGreeting: () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return "Good morning! How can I help you find your perfect car today?";
    } else if (hour >= 12 && hour < 17) {
      return "Good afternoon! What type of car are you looking for?";
    } else if (hour >= 17 && hour < 22) {
      return "Good evening! I'm here to help you find the right vehicle.";
    } else {
      return "Hello! I'm your I3w Car Culture assistant. How can I help you today?";
    }
  },

  // Format price for display
  formatPrice: (price) => {
    if (typeof price === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(price);
    }
    return price || 'Price not available';
  },

  // Format relative time
  formatRelativeTime: (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  },

  // Debounce function for user input
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for API calls
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Check if user is on mobile
  isMobileDevice: () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  },

  // Get device type
  getDeviceType: () => {
    const width = window.innerWidth;
    if (width <= 360) return 'very-small';
    if (width <= 480) return 'small-mobile';
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  },

  // Check network connection
  isOnline: () => {
    return navigator.onLine;
  },

  // Generate unique ID
  generateId: () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Extract keywords from message
  extractKeywords: (message) => {
    if (!message || typeof message !== 'string') return [];
    
    const stopWords = ['a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 
                      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 
                      'to', 'was', 'will', 'with', 'i', 'me', 'my', 'you', 'your'];
    
    return message.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split on whitespace
      .filter(word => word.length > 2 && !stopWords.includes(word)) // Filter short words and stop words
      .slice(0, 10); // Limit to 10 keywords
  },

  // Validate email (for feedback)
  isValidEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Get browser info for analytics
  getBrowserInfo: () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('Opera')) browser = 'Opera';
    
    return {
      browser,
      mobile: chatbotHelpers.isMobileDevice(),
      online: navigator.onLine,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled
    };
  },

  // Local storage helpers
  storage: {
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
        return false;
      }
    },

    get: (key, defaultValue = null) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        return defaultValue;
      }
    },

    remove: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
        return false;
      }
    },

    clear: () => {
      try {
        localStorage.clear();
        return true;
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
        return false;
      }
    }
  },

  // Performance monitoring
  performance: {
    startTimer: (label) => {
      if (performance && performance.mark) {
        performance.mark(`${label}-start`);
      }
    },

    endTimer: (label) => {
      if (performance && performance.mark && performance.measure) {
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
        
        const measure = performance.getEntriesByName(label)[0];
        if (measure) {
          console.log(`${label}: ${measure.duration.toFixed(2)}ms`);
          return measure.duration;
        }
      }
      return 0;
    }
  },

  // Error classification
  classifyError: (error) => {
    if (!error) return 'unknown';
    
    const message = error.message || error.toString();
    const status = error.response?.status;
    
    if (!navigator.onLine) return 'network';
    if (status === 429) return 'rate_limit';
    if (status >= 500) return 'server';
    if (status === 401 || status === 403) return 'auth';
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('network')) return 'network';
    
    return 'client';
  },

  // Content moderation (basic)
  moderateContent: (text) => {
    if (!text || typeof text !== 'string') return { safe: true, text: '' };
    
    const inappropriateWords = [
      // Add inappropriate words that should be filtered
      // This is a basic implementation - in production you'd use a proper moderation service
    ];
    
    const lowerText = text.toLowerCase();
    const hasInappropriate = inappropriateWords.some(word => lowerText.includes(word));
    
    return {
      safe: !hasInappropriate,
      text: text,
      flagged: hasInappropriate
    };
  },

  // Generate conversation summary
  generateConversationSummary: (messages) => {
    if (!messages || messages.length === 0) return '';
    
    const userMessages = messages.filter(m => m.type === 'user');
    const keywords = userMessages
      .flatMap(m => chatbotHelpers.extractKeywords(m.text))
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});
    
    const topKeywords = Object.entries(keywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
    
    return topKeywords.join(', ');
  }
};

// CSS for error boundary (add to Chatbot.css)
export const errorBoundaryCSS = `
.chatbot-error-fallback {
  position: absolute;
  bottom: 80px;
  right: 0;
  width: 350px;
  max-width: calc(100vw - 40px);
  background: rgba(30, 30, 30, 0.95);
  border: 1px solid #3c3c3c;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
}

.chatbot-error-content {
  text-align: center;
  color: white;
}

.chatbot-error-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.chatbot-error-content h3 {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
  color: #ff6b6b;
}

.chatbot-error-content p {
  margin: 0 0 15px 0;
  color: #ccc;
  font-size: 0.9rem;
}

.chatbot-error-retry {
  background: #ff3300;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-bottom: 15px;
  transition: background 0.2s ease;
}

.chatbot-error-retry:hover {
  background: #cc2900;
}

.chatbot-error-alternatives {
  border-top: 1px solid #444;
  padding-top: 15px;
  margin-top: 15px;
}

.chatbot-error-alternatives p {
  margin: 0 0 10px 0;
  font-size: 0.85rem;
}

.chatbot-error-link {
  display: inline-block;
  margin: 0 5px 5px 0;
  padding: 4px 12px;
  background: rgba(255, 51, 0, 0.2);
  color: #ff6040;
  text-decoration: none;
  border-radius: 15px;
  font-size: 0.8rem;
  border: 1px solid #ff3300;
  transition: all 0.2s ease;
}

.chatbot-error-link:hover {
  background: rgba(255, 51, 0, 0.3);
  color: white;
}

.chatbot-error-details {
  margin-top: 15px;
  text-align: left;
}

.chatbot-error-details summary {
  cursor: pointer;
  font-size: 0.8rem;
  color: #999;
  margin-bottom: 10px;
}

.chatbot-error-details pre {
  background: rgba(0, 0, 0, 0.5);
  padding: 10px;
  border-radius: 5px;
  font-size: 0.7rem;
  overflow-x: auto;
  white-space: pre-wrap;
  color: #ccc;
}

@media (max-width: 768px) {
  .chatbot-error-fallback {
    width: calc(100vw - 30px);
    right: 0;
    left: 0;
    margin: 0 auto;
  }
}
`;

export default ChatbotErrorBoundary;
