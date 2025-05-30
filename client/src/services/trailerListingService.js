// src/services/trailerListingService.js
import { http } from '../config/axios.js';
import { imageService } from './imageService.js';

export const trailerListingService = {
  // Get all trailer listings with filters
  async getTrailerListings(filters = {}, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams();
      
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.trailerType) queryParams.append('trailerType', filters.trailerType);
      if (filters.minCapacity) queryParams.append('minCapacity', filters.minCapacity);
      if (filters.maxCapacity) queryParams.append('maxCapacity', filters.maxCapacity);
      if (filters.minSize) queryParams.append('minSize', filters.minSize);
      if (filters.maxSize) queryParams.append('maxSize', filters.maxSize);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.availability && filters.availability !== 'all') queryParams.append('availability', filters.availability);
      if (filters.city) queryParams.append('city', filters.city);
      if (filters.country) queryParams.append('country', filters.country);
      if (filters.sort) queryParams.append('sort', filters.sort);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (!['search', 'trailerType', 'minCapacity', 'maxCapacity', 'minSize', 'maxSize', 
              'minPrice', 'maxPrice', 'status', 'availability', 'city', 'country', 
              'sort', 'page', 'limit'].includes(key)) {
          if (value && value !== 'all' && value !== 'All') {
            queryParams.append(key, value);
          }
        }
      });
      
      const response = await http.get(`/trailers?${queryParams.toString()}`);
      
      if (response.data.success) {
        return {
          trailers: response.data.data || [],
          pagination: response.data.pagination || {
            currentPage: page,
            totalPages: 1,
            total: response.data.data?.length || 0
          },
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch trailer listings');
      }
    } catch (error) {
      console.error('Error fetching trailer listings:', error);
      return {
        trailers: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          total: 0
        },
        success: false,
        error: error.message || 'Failed to fetch trailer listings'
      };
    }
  },
  
  // Get a single trailer listing by ID
  async getTrailerListing(id) {
    try {
      const response = await http.get(`/trailers/${id}`);
      
      if (response.data.success) {
        return {
          trailer: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || `Failed to fetch trailer listing with ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error fetching trailer listing with ID ${id}:`, error);
      return {
        trailer: null,
        success: false,
        error: error.message || `Failed to fetch trailer listing with ID: ${id}`
      };
    }
  },
  
  // Create trailer listing with S3 image upload
  async createTrailer(trailerData, images = [], onProgress) {
    try {
      let uploadedImages = [];
      
      // Upload images to S3
      if (images && images.length > 0) {
        onProgress?.({ phase: 'uploading', progress: 0 });
        
        const uploadResults = await imageService.uploadMultiple(
          images,
          'trailers',
          (progress) => onProgress?.({ phase: 'uploading', progress })
        );
        
        uploadedImages = uploadResults.map((result, index) => ({
          url: result.url,
          key: result.key,
          thumbnail: result.thumbnail,
          isPrimary: index === 0
        }));
      }
      
      onProgress?.({ phase: 'creating', progress: 0 });
      
      // Create form data
      const formData = new FormData();
      formData.append('trailerData', JSON.stringify({
        ...trailerData,
        images: uploadedImages
      }));
      
      const response = await http.post('/trailers', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.({ phase: 'creating', progress: percentCompleted });
        }
      });
      
      if (response.data.success) {
        return {
          trailer: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to create trailer listing');
      }
    } catch (error) {
      console.error('Error creating trailer listing:', error);
      throw error;
    }
  },
  
  // Update trailer listing with S3 image handling
  async updateTrailer(id, trailerData, newImages = [], onProgress) {
    try {
      let uploadedImages = [];
      
      // Upload new images to S3
      if (newImages && newImages.length > 0) {
        onProgress?.({ phase: 'uploading', progress: 0 });
        
        const uploadResults = await imageService.uploadMultiple(
          newImages,
          'trailers',
          (progress) => onProgress?.({ phase: 'uploading', progress })
        );
        
        uploadedImages = uploadResults.map((result) => ({
          url: result.url,
          key: result.key,
          thumbnail: result.thumbnail,
          isPrimary: false
        }));
      }
      
      onProgress?.({ phase: 'updating', progress: 0 });
      
      // Create form data
      const formData = new FormData();
      
      const existingImages = trailerData.existingImages || [];
      const allImages = [...existingImages, ...uploadedImages];
      
      formData.append('trailerData', JSON.stringify({
        ...trailerData,
        images: allImages
      }));
      
      const response = await http.put(`/trailers/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.({ phase: 'updating', progress: percentCompleted });
        }
      });
      
      if (response.data.success) {
        return {
          trailer: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to update trailer listing');
      }
    } catch (error) {
      console.error(`Error updating trailer listing ${id}:`, error);
      throw error;
    }
  },
  
  // Get featured trailer listings
  async getFeaturedTrailers(limit = 6) {
    try {
      const response = await http.get(`/trailers/featured?limit=${limit}`);
      
      if (response.data.success) {
        return {
          trailers: response.data.data || [],
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch featured trailer listings');
      }
    } catch (error) {
      console.error('Error fetching featured trailer listings:', error);
      return {
        trailers: [],
        success: false,
        error: error.message || 'Failed to fetch featured trailer listings'
      };
    }
  },
  
  // Get trailer listings for a specific provider
  async getProviderTrailers(providerId, page = 1, limit = 10) {
    try {
      if (!providerId) {
        console.warn('No provider ID provided for getProviderTrailers');
        return { 
          trailers: [], 
          pagination: { currentPage: page, totalPages: 1, total: 0 },
          success: false
        };
      }
      
      const response = await http.get(`/trailers/provider/${providerId}`, {
        params: { page, limit }
      });
      
      if (response.data && response.data.success) {
        return {
          trailers: response.data.data || [],
          pagination: response.data.pagination || {
            currentPage: page,
            totalPages: Math.ceil((response.data.total || 0) / limit),
            total: response.data.total || response.data.data?.length || 0
          },
          success: true
        };
      } else {
        throw new Error(response.data?.message || `Failed to fetch trailers for provider ${providerId}`);
      }
    } catch (error) {
      console.error(`Error fetching trailers for provider ${providerId}:`, error);
      return { 
        trailers: [], 
        pagination: { currentPage: page, totalPages: 1, total: 0 },
        success: false,
        error: error.message || `Failed to fetch trailers for provider ${providerId}`
      };
    }
  },
  
  // Get similar trailer listings
  async getSimilarTrailers(id, limit = 4) {
    try {
      const response = await http.get(`/trailers/${id}/similar?limit=${limit}`);
      
      if (response.data.success) {
        return {
          trailers: response.data.data || [],
          success: true
        };
      } else {
        throw new Error(response.data.message || `Failed to fetch similar trailers for trailer ${id}`);
      }
    } catch (error) {
      console.error(`Error fetching similar trailers for ${id}:`, error);
      return {
        trailers: [],
        success: false,
        error: error.message || `Failed to fetch similar trailers for trailer ${id}`
      };
    }
  },
  
  // Check trailer availability
  async checkAvailability(trailerId, startDate, endDate) {
    try {
      const response = await http.post(`/trailers/${trailerId}/availability`, {
        startDate, 
        endDate
      });
      
      if (response.data.success) {
        return {
          availability: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to check trailer availability');
      }
    } catch (error) {
      console.error('Error checking trailer availability:', error);
      return {
        availability: null,
        success: false,
        error: error.message || 'Failed to check trailer availability'
      };
    }
  },
  
  // Calculate rental cost
  async calculateRentalCost(trailerId, startDate, endDate, options = {}) {
    try {
      const response = await http.post(`/trailers/${trailerId}/calculate`, {
        startDate,
        endDate,
        options
      });
      
      if (response.data.success) {
        return {
          cost: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to calculate rental cost');
      }
    } catch (error) {
      console.error('Error calculating rental cost:', error);
      return {
        cost: null,
        success: false,
        error: error.message || 'Failed to calculate rental cost'
      };
    }
  }
};

export default trailerListingService;