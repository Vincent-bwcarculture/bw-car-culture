// src/services/carReviewService.js
import axios from '../config/axios.js';

class CarReviewService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || '/api';
    this.endpoint = `${this.baseURL}/car-reviews`;
  }

  // Get auth headers
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
  }

  // Create a new car review
  async createReview(reviewData) {
    try {
      const response = await axios.post(this.endpoint, reviewData, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating car review:', error.response?.data || error.message);
      throw this.formatError(error);
    }
  }

  // Get all car reviews with optional filtering
  async getReviews(filters = {}, page = 1, limit = 10) {
    try {
      const response = await axios.get(this.endpoint, {
        params: {
          ...filters,
          page,
          limit
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching car reviews:', error.response?.data || error.message);
      throw this.formatError(error);
    }
  }

  // Get a single car review by ID
  async getReview(id) {
    try {
      const response = await axios.get(`${this.endpoint}/${id}`);
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching car review ${id}:`, error.response?.data || error.message);
      throw this.formatError(error);
    }
  }

  // Update a car review
  async updateReview(id, reviewData) {
    try {
      const response = await axios.put(`${this.endpoint}/${id}`, reviewData, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating car review ${id}:`, error.response?.data || error.message);
      throw this.formatError(error);
    }
  }

  // Delete a car review
  async deleteReview(id) {
    try {
      const response = await axios.delete(`${this.endpoint}/${id}`, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting car review ${id}:`, error.response?.data || error.message);
      throw this.formatError(error);
    }
  }

  // Mark a car review as helpful
  async markReviewHelpful(id) {
    try {
      const response = await axios.put(`${this.endpoint}/${id}/helpful`, {}, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error marking car review ${id} as helpful:`, error.response?.data || error.message);
      throw this.formatError(error);
    }
  }

  // Get reviews for a specific car
  async getReviewsByCar(make, model) {
    try {
      const response = await axios.get(`${this.endpoint}/car`, {
        params: { make, model }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching car reviews by car:', error.response?.data || error.message);
      throw this.formatError(error);
    }
  }

  // Get current user's car reviews
  async getUserReviews() {
    try {
      const response = await axios.get(`${this.endpoint}/user/me`, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching user car reviews:', error.response?.data || error.message);
      throw this.formatError(error);
    }
  }

  // Update car review status (admin only)
  async updateReviewStatus(id, statusData) {
    try {
      const response = await axios.put(`${this.endpoint}/${id}/status`, statusData, {
        headers: this.getHeaders()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating car review status:`, error.response?.data || error.message);
      throw this.formatError(error);
    }
  }

  // Helper to format error messages
  formatError(error) {
    return {
      message: error.response?.data?.message || error.message || 'An error occurred',
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors || null
    };
  }
}

export const carReviewService = new CarReviewService();