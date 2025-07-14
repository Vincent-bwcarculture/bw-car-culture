// src/config/axios.js
import axios from 'axios';

// Create axios instance with common configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app',
  withCredentials: true,
  timeout: 300000, // 5 minutes
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  }
});

// 🎯 NEW: Endpoints that should be routed to user-services.js
const USER_SERVICE_ENDPOINTS = [
  '/api/user/profile',
  '/api/user/vehicles',
  '/api/user/listings',
  '/api/user/listings/stats',
  '/api/payments/available-tiers',
  '/api/payments/initiate', 
  '/api/payments/history',
  '/api/addons/available',
  '/api/addons/purchase',
  '/api/addons/my-addons'
];

// Normalize URL paths to prevent duplicate /api prefixes and fix formatting
const normalizeUrlPath = (url) => {
  if (!url) return '';
  
  // Check for URL with duplicate API paths (a common error pattern)
  if (url.includes('/api/http')) {
    console.warn('Detected malformed URL with duplicate API path:', url);
    // Extract the actual endpoint path
    const pathMatch = url.match(/\/api\/https?:\/\/[^\/]+\/api\/(.+)/);
    if (pathMatch && pathMatch[1]) {
      return '/' + pathMatch[1];
    }
  }
  
  // Remove leading /api if present (since it's already in baseURL)
  let path = url.startsWith('/api/') ? url.substring(4) : url;
  
  // Ensure path starts with / if it doesn't
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  // Remove duplicate slashes
  path = path.replace(/\/+/g, '/');
  
  return path;
};

// Request interceptor to add token, normalize URLs and add cache-busting
api.interceptors.request.use(
  (config) => {
    try {
      // Normalize URL to prevent duplicate /api prefixes
      if (config.url) {
        const originalUrl = config.url;
        config.url = normalizeUrlPath(config.url);
        
        // Log if URL was changed
        if (originalUrl !== config.url && process.env.NODE_ENV === 'development') {
          console.log(`URL normalized: ${originalUrl} → ${config.url}`);
        }
      }

      // 🎯 NEW: Route specific endpoints to user-services.js
      const fullPath = `/api${config.url}`;
      const shouldUseUserServices = USER_SERVICE_ENDPOINTS.some(endpoint => 
        fullPath === endpoint || fullPath.startsWith(endpoint.split('?')[0])
      );
      
      if (shouldUseUserServices) {
        console.log(`🔄 Routing ${fullPath} → user-services.js`);
        
        // Store original path as query parameter for user-services.js
        config.params = {
          ...config.params,
          path: fullPath
        };
        
        // Route to user-services.js
        config.url = '/user-services';
      } else if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 Routing ${fullPath} → main index.js`);
      }
    
      // Add auth token if available
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Request without token: ${config.url}`);
      }

      // Add timestamp to GET requests to prevent caching
      if (config.method?.toLowerCase() === 'get') {
        config.params = {
          ...config.params,
          _t: new Date().getTime()
        };
      }
      
      // IMPORTANT: For FormData requests, DO NOT set the Content-Type header 
      // as axios will add it automatically with the correct boundary
      if (config.data instanceof FormData) {
        // Let the browser set the Content-Type with boundary automatically
        delete config.headers['Content-Type'];
      }
      
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return config; // Return original config on error
    }
  },
  (error) => {
    console.error('Request configuration error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors consistently
api.interceptors.response.use(
  (response) => {
    // Safe logging without potential type errors
    if (process.env.NODE_ENV === 'development') {
      try {
        const method = typeof response?.config?.method === 'string' 
          ? response.config.method.toUpperCase() 
          : 'REQUEST';
        const url = response?.config?.url || 'unknown';
        const status = response?.status || 'unknown';
        
        console.log(`[API] ${method} ${url} - ${status}`);
      } catch (err) {
        // Silently handle logging errors
      }
    }
    return response;
  },
  (error) => {
    try {
      // Handle network errors (error.response will be undefined)
      if (!error.response) {
        console.error('Network error:', error.message || error);
        return Promise.reject({
          message: 'Network error - please check your connection',
          originalError: error
        });
      }

      // Handle timeout
      if (error.code === 'ECONNABORTED') {
        return Promise.reject({
          message: 'Request timed out - please try again',
          originalError: error
        });
      }

      // Safe access to request info
      const requestInfo = {
        method: typeof error?.config?.method === 'string' 
          ? error.config.method.toUpperCase() 
          : 'UNKNOWN',
        url: error?.config?.url || 'unknown-url',
        status: error.response?.status || 'unknown'
      };
      
      console.error(`API Error: ${requestInfo.method} ${requestInfo.url} - Status: ${requestInfo.status}`);

      // Return formatted error object
      return Promise.reject({
        message: error.response?.data?.message || 'An error occurred',
        status: error.response?.status,
        originalError: error
      });
    } catch (interceptorError) {
      // Safety net for errors in the error handler itself
      console.error('Error in axios error interceptor:', interceptorError);
      return Promise.reject({
        message: 'An unexpected error occurred',
        originalError: error
      });
    }
  }
);

// Utility methods with safe URL handling and fallbacks
const http = {
  get: async (url, config = {}) => {
    try {
      return await api.get(url, config);
    } catch (error) {
      console.error(`GET request to ${url} failed:`, error);
      throw error;
    }
  },
  
  post: async (url, data = {}, config = {}) => {
    try {
      return await api.post(url, data, config);
    } catch (error) {
      console.error(`POST request to ${url} failed:`, error);
      throw error;
    }
  },
  
  put: async (url, data = {}, config = {}) => {
    try {
      return await api.put(url, data, config);
    } catch (error) {
      console.error(`PUT request to ${url} failed:`, error);
      throw error;
    }
  },
  
  delete: async (url, config = {}) => {
    try {
      return await api.delete(url, config);
    } catch (error) {
      console.error(`DELETE request to ${url} failed:`, error);
      throw error;
    }
  },
  
  patch: async (url, data = {}, config = {}) => {
    try {
      return await api.patch(url, data, config);
    } catch (error) {
      console.error(`PATCH request to ${url} failed:`, error);
      throw error;
    }
  },
  
  // Method for multipart form data (file uploads)
  multipartPost: async (url, formData, onProgress = null, config = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
      
      const uploadConfig = {
        ...config,
        headers: {
          ...config.headers,
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData - browser will handle it
        },
      };
      
      if (onProgress) {
        uploadConfig.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        };
      }
      
      // Log form data fields for debugging
      if (process.env.NODE_ENV === 'development') {
        try {
          const formFields = [...formData.entries()].map(([key, value]) => {
            if (value instanceof File) {
              return `${key}: File(${value.name}, ${value.size} bytes)`;
            }
            return `${key}: ${typeof value === 'string' ? 
              (value.length > 30 ? value.substring(0, 30) + '...' : value) : 
              typeof value}`;
          });
          
          console.log('Sending multipart request:', {
            url,
            method: config?.method?.toUpperCase() || 'POST',
            fields: formFields
          });
        } catch (err) {
          console.error('Error logging form data:', err);
        }
      }
      
      // Use the appropriate method based on config
      if (config?.method?.toUpperCase() === 'PUT') {
        return await api.put(url, formData, uploadConfig);
      } else {
        return await api.post(url, formData, uploadConfig);
      }
    } catch (error) {
      console.error(`Multipart request to ${url} failed:`, error);
      throw error;
    }
  },
  
  // Health check utility
  checkHealth: async () => {
    try {
      const response = await axios({
        method: 'get',
        url: `${api.defaults.baseURL}/health?_t=${Date.now()}`,
        timeout: 3000,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      return response.status < 400;
    } catch (error) {
      console.warn('Health check failed:', error.message);
      return false;
    }
  }
};

export { api as default, http };