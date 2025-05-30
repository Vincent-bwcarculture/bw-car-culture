// src/utils/chatbotHelpers.js - Complete Implementation
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
      return "🌅 Good morning! How can I help you find your perfect car today?";
    } else if (hour >= 12 && hour < 17) {
      return "☀️ Good afternoon! What type of car are you looking for?";
    } else if (hour >= 17 && hour < 22) {
      return "🌆 Good evening! I'm here to help you find the right vehicle.";
    } else {
      return "🌙 Hello! I'm your I3w Car Culture assistant. How can I help you today?";
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
      cookieEnabled: navigator.cookieEnabled,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
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
    },

    // Check if localStorage is available
    isAvailable: () => {
      try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (error) {
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
          if (process.env.NODE_ENV === 'development') {
            console.log(`${label}: ${measure.duration.toFixed(2)}ms`);
          }
          return measure.duration;
        }
      }
      return 0;
    },

    // Get memory usage (if available)
    getMemoryUsage: () => {
      if (performance && performance.memory) {
        return {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        };
      }
      return null;
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
    if (status === 404) return 'not_found';
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('network')) return 'network';
    if (message.includes('cors')) return 'cors';
    
    return 'client';
  },

  // Content moderation (basic)
  moderateContent: (text) => {
    if (!text || typeof text !== 'string') return { safe: true, text: '' };
    
    // Basic inappropriate content detection
    const inappropriatePatterns = [
      /\b(spam|scam|fake|fraud)\b/gi,
      /\b(hack|exploit|cheat)\b/gi,
      // Add more patterns as needed
    ];
    
    const lowerText = text.toLowerCase();
    const hasInappropriate = inappropriatePatterns.some(pattern => pattern.test(lowerText));
    
    return {
      safe: !hasInappropriate,
      text: text,
      flagged: hasInappropriate,
      reason: hasInappropriate ? 'inappropriate_content' : null
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
  },

  // WhatsApp helpers
  whatsapp: {
    // Format WhatsApp URL
    formatUrl: (phoneNumber, message = '') => {
      // Remove any non-digit characters except '+'
      const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
      const encodedMessage = encodeURIComponent(message);
      return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
    },

    // Generate default messages for different contexts
    getDefaultMessage: (context = 'general') => {
      const messages = {
        general: 'Hi! I was browsing I3w Car Culture website and would like some assistance.',
        car_inquiry: 'Hi! I\'m interested in learning more about the cars on your website.',
        dealer_contact: 'Hi! I\'d like to get in touch with one of your dealers.',
        technical_support: 'Hi! I\'m having some technical issues with your website.',
        feedback: 'Hi! I have some feedback about your website that I\'d like to share.',
        partnership: 'Hi! I\'m interested in potential partnership opportunities.'
      };
      
      return messages[context] || messages.general;
    }
  },

  // URL helpers
  url: {
    // Get current page info
    getCurrentPageInfo: () => {
      return {
        url: window.location.href,
        path: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        title: document.title,
        referrer: document.referrer
      };
    },

    // Extract domain from URL
    extractDomain: (url) => {
      try {
        const urlObj = new URL(url);
        return urlObj.hostname;
      } catch (error) {
        return null;
      }
    },

    // Check if URL is valid
    isValidUrl: (string) => {
      try {
        new URL(string);
        return true;
      } catch (_) {
        return false;
      }
    }
  },

  // Date and time helpers
  dateTime: {
    // Format timestamp for display
    formatTimestamp: (timestamp, options = {}) => {
      const date = new Date(timestamp);
      const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      
      return date.toLocaleDateString(undefined, { ...defaultOptions, ...options });
    },

    // Get business hours status
    isBusinessHours: (timezone = 'Africa/Gaborone') => {
      try {
        const now = new Date();
        const timeInZone = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const hour = timeInZone.getHours();
        const day = timeInZone.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Business hours: Monday-Friday 8 AM - 6 PM, Saturday 9 AM - 1 PM
        if (day >= 1 && day <= 5) { // Monday to Friday
          return hour >= 8 && hour < 18;
        } else if (day === 6) { // Saturday
          return hour >= 9 && hour < 13;
        } else { // Sunday
          return false;
        }
      } catch (error) {
        console.warn('Error checking business hours:', error);
        return false;
      }
    },

    // Get next business hours
    getNextBusinessHours: (timezone = 'Africa/Gaborone') => {
      try {
        const now = new Date();
        const timeInZone = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const hour = timeInZone.getHours();
        const day = timeInZone.getDay();
        
        if (day >= 1 && day <= 5 && hour < 8) { // Before business hours on weekday
          return 'Opens at 8:00 AM today';
        } else if (day >= 1 && day <= 5 && hour >= 18) { // After business hours on weekday
          return 'Opens at 8:00 AM tomorrow';
        } else if (day === 6 && hour < 9) { // Before Saturday hours
          return 'Opens at 9:00 AM today';
        } else if (day === 6 && hour >= 13) { // After Saturday hours
          return 'Opens at 8:00 AM Monday';
        } else if (day === 0) { // Sunday
          return 'Opens at 8:00 AM Monday';
        } else {
          return 'Currently open';
        }
      } catch (error) {
        console.warn('Error getting next business hours:', error);
        return 'Contact us for availability';
      }
    }
  },

  // Feature detection
  features: {
    // Check if feature is supported
    isSupported: (feature) => {
      const checks = {
        webp: () => {
          const canvas = document.createElement('canvas');
          return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        },
        
        touchDevice: () => {
          return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        },
        
        geolocation: () => {
          return 'geolocation' in navigator;
        },
        
        notifications: () => {
          return 'Notification' in window;
        },
        
        serviceWorker: () => {
          return 'serviceWorker' in navigator;
        },
        
        webRTC: () => {
          return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        }
      };
      
      return checks[feature] ? checks[feature]() : false;
    }
  },

  // Accessibility helpers
  accessibility: {
    // Check if user prefers reduced motion
    prefersReducedMotion: () => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    // Check if user prefers high contrast
    prefersHighContrast: () => {
      return window.matchMedia('(prefers-contrast: more)').matches;
    },

    // Check if user prefers dark mode
    prefersDarkMode: () => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    },

    // Announce message to screen readers
    announceToScreenReader: (message, priority = 'polite') => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.style.position = 'absolute';
      announcement.style.left = '-10000px';
      announcement.style.width = '1px';
      announcement.style.height = '1px';
      announcement.style.overflow = 'hidden';
      
      document.body.appendChild(announcement);
      announcement.textContent = message;
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }
};
