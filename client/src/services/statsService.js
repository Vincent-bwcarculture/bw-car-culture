// src/services/statsService.js - Fixed with proper error handling and fallbacks

const BASE_URL = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';

export const statsService = {
  async getWebsiteStats() {
    try {
      console.log('🔄 Fetching website statistics...');
      
      // First, try the main stats endpoint
      const response = await fetch(`${BASE_URL}/api/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          console.log('✅ Website statistics fetched successfully from /api/stats');
          return {
            carListings: data.data.totalListings || data.data.carListings || 0,
            happyCustomers: data.data.happyCustomers || data.data.totalCustomers || 0,
            verifiedDealers: data.data.verifiedDealers || data.data.totalDealers || 0,
            transportProviders: data.data.transportProviders || data.data.totalProviders || 0,
            ...data.data // Include any other fields
          };
        }
      }

      // If that fails, try alternative endpoints
      console.log('⚠️ Primary stats endpoint failed, trying alternatives...');
      return await this.getWebsiteStatsWithFallback();
      
    } catch (error) {
      console.error('❌ Error fetching website statistics:', error);
      
      // Try fallback method
      try {
        return await this.getWebsiteStatsWithFallback();
      } catch (fallbackError) {
        console.error('❌ All stats endpoints failed, using default values');
        return this.getDefaultStats();
      }
    }
  },

  // Alternative method that tries multiple endpoints (fallback strategy)
  async getWebsiteStatsWithFallback() {
    const endpoints = [
      '/api/stats/dashboard',    // Alternative dashboard endpoint
      '/api/dashboard/stats',    // Another alternative
      '/stats',                  // Simple stats endpoint
      '/dashboard'               // General dashboard endpoint
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying stats endpoint: ${endpoint}`);
        
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data && (data.success || data.data || data.carListings !== undefined)) {
            console.log(`✅ Stats fetched from: ${endpoint}`);
            
            // Normalize the response format
            const responseData = data.data || data;
            
            return {
              carListings: responseData.totalListings || responseData.carListings || 0,
              happyCustomers: responseData.happyCustomers || responseData.totalCustomers || responseData.userCount || 0,
              verifiedDealers: responseData.verifiedDealers || responseData.totalDealers || responseData.activeDealers || 0,
              transportProviders: responseData.transportProviders || responseData.totalProviders || responseData.serviceProviders || 0
            };
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch from ${endpoint}:`, error.message);
        continue; // Try next endpoint
      }
    }

    // If all endpoints fail, throw error
    throw new Error('All stats endpoints failed');
  },

  // Default stats to prevent app crashes
  getDefaultStats() {
    console.log('📊 Using default statistics as fallback');
    
    return {
      carListings: 150,
      happyCustomers: 450,
      verifiedDealers: 25,
      transportProviders: 12
    };
  },

  // Get stats with timeout to prevent hanging
  async getWebsiteStatsWithTimeout(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.warn('⏰ Stats request timed out, using defaults');
        resolve(this.getDefaultStats());
      }, timeoutMs);

      this.getWebsiteStats()
        .then(data => {
          clearTimeout(timeout);
          resolve(data);
        })
        .catch(error => {
          clearTimeout(timeout);
          console.warn('⚠️ Stats request failed, using defaults:', error.message);
          resolve(this.getDefaultStats());
        });
    });
  },

  // Method for components to use (recommended)
  async getWebsiteStatsReliable() {
    try {
      // First try with timeout
      const stats = await this.getWebsiteStatsWithTimeout(8000);
      
      // Validate the response
      if (this.validateStatsResponse(stats)) {
        return stats;
      } else {
        console.warn('⚠️ Invalid stats response, using defaults');
        return this.getDefaultStats();
      }
    } catch (error) {
      console.error('❌ Reliable stats fetch failed:', error);
      return this.getDefaultStats();
    }
  },

  // Validate stats response
  validateStatsResponse(stats) {
    if (!stats || typeof stats !== 'object') {
      return false;
    }

    const requiredFields = ['carListings', 'happyCustomers', 'verifiedDealers', 'transportProviders'];
    
    return requiredFields.every(field => {
      const value = stats[field];
      return typeof value === 'number' && value >= 0;
    });
  },

  // Get cached stats if available
  async getCachedStats() {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const cachedData = localStorage.getItem('websiteStats');
      const cacheTimestamp = localStorage.getItem('websiteStatsTimestamp');
      
      if (cachedData && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        const maxCacheAge = 5 * 60 * 1000; // 5 minutes
        
        if (cacheAge < maxCacheAge) {
          console.log('📄 Using cached website statistics');
          return JSON.parse(cachedData);
        }
      }
    } catch (error) {
      console.warn('⚠️ Error reading cached stats:', error);
    }

    return null;
  },

  // Cache stats for better performance
  cacheStats(stats) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem('websiteStats', JSON.stringify(stats));
      localStorage.setItem('websiteStatsTimestamp', Date.now().toString());
      console.log('💾 Website statistics cached');
    } catch (error) {
      console.warn('⚠️ Error caching stats:', error);
    }
  },

  // Enhanced method with caching (recommended for production)
  async getWebsiteStatsEnhanced() {
    try {
      // First, try to get cached stats
      const cachedStats = await this.getCachedStats();
      if (cachedStats && this.validateStatsResponse(cachedStats)) {
        // Return cached stats immediately, but also fetch fresh data in background
        this.getWebsiteStatsReliable().then(freshStats => {
          if (this.validateStatsResponse(freshStats)) {
            this.cacheStats(freshStats);
          }
        }).catch(console.warn);
        
        return cachedStats;
      }

      // If no valid cached data, fetch fresh data
      const freshStats = await this.getWebsiteStatsReliable();
      
      // Cache the fresh data
      if (this.validateStatsResponse(freshStats)) {
        this.cacheStats(freshStats);
      }

      return freshStats;
    } catch (error) {
      console.error('❌ Enhanced stats fetch failed:', error);
      return this.getDefaultStats();
    }
  }
};

// Export default enhanced method
export const getWebsiteStats = () => statsService.getWebsiteStatsEnhanced();

export default statsService;