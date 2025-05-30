// src/services/statsService.js
// This service connects to your website backend to get real statistics

export const statsService = {
    async getWebsiteStats() {
      try {
        // In production, this will be a real API call to your backend
        const response = await fetch('/api/stats/dashboard');
        
        if (!response.ok) {
          throw new Error('Failed to fetch website statistics');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching website statistics:', error);
        throw error;
      }
    }
  };