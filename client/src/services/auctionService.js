// src/services/auctionService.js
import axios from '../config/axios.js';

class AuctionService {
  constructor() {
    this.baseUrl = '/api/auctions';
  }

  // Get all auctions with filtering
  async getAuctions(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });
      
      const response = await axios.get(`${this.baseUrl}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching auctions:', error);
      throw this.handleError(error);
    }
  }

  // Get a single auction by ID
  async getAuction(id) {
    try {
      const response = await axios.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching auction with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  // Create a new auction
  async createAuction(formData) {
    try {
      const response = await axios.post(this.baseUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating auction:', error);
      throw this.handleError(error);
    }
  }

  // Update an existing auction
  async updateAuction(id, formData) {
    try {
      const response = await axios.put(`${this.baseUrl}/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating auction with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  // Delete an auction
  async deleteAuction(id) {
    try {
      const response = await axios.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting auction with ID ${id}:`, error);
      throw this.handleError(error);
    }
  }

  // Place a bid on an auction
  async placeBid(auctionId, amount) {
    try {
      const response = await axios.post(`${this.baseUrl}/${auctionId}/bid`, { amount });
      return response.data;
    } catch (error) {
      console.error(`Error placing bid on auction ${auctionId}:`, error);
      throw this.handleError(error);
    }
  }

  // Watch/unwatch an auction
  async toggleWatch(auctionId) {
    try {
      const response = await axios.put(`${this.baseUrl}/${auctionId}/watch`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling watch status for auction ${auctionId}:`, error);
      throw this.handleError(error);
    }
  }

  // Get user's watched auctions
  async getWatchedAuctions() {
    try {
      const response = await axios.get(`${this.baseUrl}/user/watched`);
      return response.data;
    } catch (error) {
      console.error('Error fetching watched auctions:', error);
      throw this.handleError(error);
    }
  }

  // Get user's selling auctions
  async getSellingAuctions() {
    try {
      const response = await axios.get(`${this.baseUrl}/user/selling`);
      return response.data;
    } catch (error) {
      console.error('Error fetching selling auctions:', error);
      throw this.handleError(error);
    }
  }

  // Get user's bids
  async getUserBids() {
    try {
      const response = await axios.get(`${this.baseUrl}/user/bids`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user bids:', error);
      throw this.handleError(error);
    }
  }

  // Get auction bids
  async getAuctionBids(auctionId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${auctionId}/bids`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching bids for auction ${auctionId}:`, error);
      throw this.handleError(error);
    }
  }

  // Update auction status (admin only)
  async updateAuctionStatus(auctionId, status) {
    try {
      const response = await axios.patch(`${this.baseUrl}/${auctionId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating status for auction ${auctionId}:`, error);
      throw this.handleError(error);
    }
  }

  // Toggle featured status (admin only)
  async toggleFeatured(auctionId) {
    try {
      const response = await axios.patch(`${this.baseUrl}/${auctionId}/featured`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling featured status for auction ${auctionId}:`, error);
      throw this.handleError(error);
    }
  }

  // Get featured auctions
  async getFeaturedAuctions() {
    try {
      const response = await axios.get(`${this.baseUrl}/featured`);
      return response.data;
    } catch (error) {
      console.error('Error fetching featured auctions:', error);
      throw this.handleError(error);
    }
  }

  // Get similar auctions
  async getSimilarAuctions(auctionId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${auctionId}/similar`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching similar auctions for ${auctionId}:`, error);
      throw this.handleError(error);
    }
  }

  // Error handling helper
  handleError(error) {
    if (error.response) {
      // Server responded with error
      return {
        message: error.response.data.message || 'Server error',
        status: error.response.status,
        data: error.response.data
      };
    }
    
    if (error.request) {
      // Request made but no response
      return {
        message: 'Network error. Please check your connection.',
        status: 0
      };
    }
    
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 500
    };
  }
}

export const auctionService = new AuctionService();