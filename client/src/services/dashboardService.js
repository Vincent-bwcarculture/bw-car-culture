// src/services/dashboardService.js
import { http } from '../config/axios.js';

export const dashboardService = {
  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Dashboard statistics
   */
  async getDashboardStats() {
    try {
      const response = await http.get('/dashboard/stats');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard statistics');
      }
    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      
      // Return fallback data to prevent UI crashes
      return {
        totalReviews: 0,
        pendingReviews: 0,
        activeListings: 0,
        totalDealers: 0,
        monthlyViews: 0,
        totalUsers: 0
      };
    }
  },

  /**
   * Get analytics data for a specific time period
   * @param {string} period - Time period (week, month, year)
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(period = 'week') {
    try {
      const response = await http.get(`/dashboard/analytics?period=${period}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      
      // Return fallback data to prevent UI crashes
      return {
        viewsData: [],
        popularReviews: [],
        topDealers: [],
        recentActivity: []
      };
    }
  },

  /**
   * Get recent activity for the dashboard
   * @param {number} limit - Number of activities to fetch
   * @returns {Promise<Array>} Recent activities
   */
  async getRecentActivity(limit = 5) {
    try {
      const response = await http.get(`/dashboard/activity?limit=${limit}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch recent activity');
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      
      // Return fallback data to prevent UI crashes
      return [];
    }
  },

  /**
   * Generate a summary report of website performance
   * @param {string} period - Time period (week, month, year)
   * @returns {Promise<Object>} Performance report
   */
  async generatePerformanceReport(period = 'month') {
    try {
      const response = await http.get(`/dashboard/report?period=${period}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to generate performance report');
      }
    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  },

  /**
   * Aggregate real-time metrics from different parts of the application
   * @returns {Promise<Object>} Real-time metrics
   */
  async getRealTimeMetrics() {
    try {
      // Fetch data from multiple endpoints in parallel
      const [listingsResponse, reviewsResponse, usersResponse, dealersResponse] = await Promise.all([
        http.get('/listings?limit=1'),
        http.get('/news?limit=1'),
        http.get('/auth/users?limit=1'),
        http.get('/dealers?limit=1')
      ]);
      
      // Extract pagination data which contains counts
      return {
        totalListings: listingsResponse.data.pagination?.total || 0,
        activeListings: listingsResponse.data.pagination?.activeCount || 0,
        totalReviews: reviewsResponse.data.pagination?.total || 0,
        pendingReviews: reviewsResponse.data.pagination?.pendingCount || 0,
        totalUsers: usersResponse.data.pagination?.total || 0,
        totalDealers: dealersResponse.data.pagination?.total || 0,
        verifiedDealers: dealersResponse.data.pagination?.verifiedCount || 0
      };
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      
      // Return fallback data to prevent UI crashes
      return {
        totalListings: 0,
        activeListings: 0,
        totalReviews: 0,
        pendingReviews: 0,
        totalUsers: 0,
        totalDealers: 0,
        verifiedDealers: 0
      };
    }
  }
};

export default dashboardService;