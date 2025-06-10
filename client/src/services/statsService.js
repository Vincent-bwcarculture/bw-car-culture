// src/services/statsService.js
// Updated to use the same axios configuration as other services

import { http } from '../config/axios.js';

export const statsService = {
    async getWebsiteStats() {
      try {
        console.log('🔄 Fetching website statistics...');
        
        // Use the configured http instance instead of basic fetch
        const response = await http.get('/stats/dashboard');
        
        if (response.data) {
          console.log('✅ Website statistics fetched successfully:', response.data);
          return response.data;
        } else {
          throw new Error('No data received from stats API');
        }
      } catch (error) {
        console.error('❌ Error fetching website statistics:', error);
        
        // Enhanced error details for debugging
        if (error.response) {
          console.error('API Response Error:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
        } else if (error.request) {
          console.error('Network Error - No response received:', error.request);
        } else {
          console.error('Request Setup Error:', error.message);
        }
        
        throw error;
      }
    },

    // Alternative method that tries multiple endpoints (fallback strategy)
    async getWebsiteStatsWithFallback() {
      const endpoints = [
        '/stats/dashboard',
        '/api/stats/dashboard', // Fallback with explicit /api prefix
        '/dashboard/stats'       // Alternative endpoint structure
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying stats endpoint: ${endpoint}`);
          const response = await http.get(endpoint);
          
          if (response.data) {
            console.log(`✅ Stats fetched from: ${endpoint}`, response.data);
            return response.data;
          }
        } catch (error) {
          console.warn(`⚠️ Failed to fetch from ${endpoint}:`, error.message);
          continue; // Try next endpoint
        }
      }

      // If all endpoints fail, throw error
      throw new Error('All stats endpoints failed');
    }
  };