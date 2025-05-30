// src/services/rentalVehicleService.js
import { http } from '../config/axios.js';
import { imageService } from './imageService.js';

export const rentalVehicleService = {
  // Get all rental vehicles with filters
  async getRentalVehicles(filters = {}, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams();
      
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.make) queryParams.append('make', filters.make);
      if (filters.model) queryParams.append('model', filters.model);
      if (filters.minYear) queryParams.append('minYear', filters.minYear);
      if (filters.maxYear) queryParams.append('maxYear', filters.maxYear);
      if (filters.transmission) queryParams.append('transmission', filters.transmission);
      if (filters.fuelType) queryParams.append('fuelType', filters.fuelType);
      if (filters.minSeats) queryParams.append('minSeats', filters.minSeats);
      if (filters.maxSeats) queryParams.append('maxSeats', filters.maxSeats);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.availability && filters.availability !== 'all') queryParams.append('availability', filters.availability);
      if (filters.city) queryParams.append('city', filters.city);
      if (filters.country) queryParams.append('country', filters.country);
      if (filters.sort) queryParams.append('sort', filters.sort);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (!['search', 'category', 'make', 'model', 'minYear', 'maxYear', 'transmission', 
              'fuelType', 'minSeats', 'maxSeats', 'minPrice', 'maxPrice', 'status', 
              'availability', 'city', 'country', 'sort', 'page', 'limit'].includes(key)) {
          if (value && value !== 'all' && value !== 'All') {
            queryParams.append(key, value);
          }
        }
      });
      
      console.log(`Fetching rental vehicles with query: ${queryParams.toString()}`);
      const response = await http.get(`/rentals?${queryParams.toString()}`);
      
      if (response.data.success) {
        return {
          vehicles: response.data.vehicles || response.data.data || [],
          pagination: response.data.pagination || {
            currentPage: page,
            totalPages: 1,
            total: response.data.data?.length || 0
          },
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch rental vehicles');
      }
    } catch (error) {
      console.error('Error fetching rental vehicles:', error);
      return {
        vehicles: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          total: 0
        },
        success: false,
        error: error.message || 'Failed to fetch rental vehicles'
      };
    }
  },
  
  // Get a single rental vehicle by ID
  async getRentalVehicle(id) {
    try {
      const response = await http.get(`/rentals/${id}`);
      
      if (response.data.success) {
        return {
          vehicle: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || `Failed to fetch rental vehicle with ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error fetching rental vehicle with ID ${id}:`, error);
      return {
        vehicle: null,
        success: false,
        error: error.message || `Failed to fetch rental vehicle with ID: ${id}`
      };
    }
  },
  
  // Get featured rental vehicles
  async getFeaturedRentals(limit = 6) {
    try {
      const response = await http.get(`/rentals/featured?limit=${limit}`);
      
      if (response.data.success) {
        return {
          vehicles: response.data.vehicles || response.data.data || [],
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch featured rental vehicles');
      }
    } catch (error) {
      console.error('Error fetching featured rental vehicles:', error);
      return {
        vehicles: [],
        success: false,
        error: error.message || 'Failed to fetch featured rental vehicles'
      };
    }
  },
  
  // Get rental vehicles for a specific provider
  async getProviderRentals(providerId, page = 1, limit = 10) {
    try {
      if (!providerId) {
        console.warn('No provider ID provided for getProviderRentals');
        return { 
          vehicles: [], 
          pagination: { currentPage: page, totalPages: 1, total: 0 },
          success: false
        };
      }
      
      console.log(`Fetching rental vehicles for provider: ${providerId}`);
      
      const response = await http.get(`/rentals`, {
        params: { 
          providerId,
          page, 
          limit 
        }
      });
      
      console.log(`Rental API response structure:`, {
        status: response.status,
        success: response.data?.success,
        dataType: response.data?.data ? typeof response.data.data : 'missing',
        dataLength: Array.isArray(response.data?.data) ? response.data.data.length : 'not array',
        hasVehicles: !!response.data?.vehicles,
        vehiclesLength: Array.isArray(response.data?.vehicles) ? response.data.vehicles.length : 'not array'
      });
      
      if (response.data) {
        const vehicles = response.data.vehicles || response.data.data || [];
        
        const pagination = response.data.pagination || {
          currentPage: page,
          totalPages: Math.ceil((response.data.total || vehicles.length) / limit),
          total: response.data.total || vehicles.length
        };
        
        console.log(`Successfully fetched ${vehicles.length} rental vehicles`);
        
        return {
          vehicles,
          pagination,
          success: true
        };
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error(`Error fetching rentals for provider ${providerId}:`, error);
      return { 
        vehicles: [], 
        pagination: { currentPage: page, totalPages: 1, total: 0 },
        success: false,
        error: error.message || `Failed to fetch rentals for provider ${providerId}`
      };
    }
  },
  
  // Check vehicle availability
  async checkAvailability(vehicleId, startDate, endDate) {
    try {
      const response = await http.post(`/rentals/${vehicleId}/availability`, {
        startDate, 
        endDate
      });
      
      if (response.data.success) {
        return {
          availability: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to check vehicle availability');
      }
    } catch (error) {
      console.error('Error checking vehicle availability:', error);
      return {
        availability: null,
        success: false,
        error: error.message || 'Failed to check vehicle availability'
      };
    }
  },
  
  // Calculate rental cost
  async calculateRentalCost(vehicleId, startDate, endDate, options = {}) {
    try {
      const response = await http.post(`/rentals/${vehicleId}/calculate`, {
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
  },
  
  // Create rental vehicle with S3 image upload
  async createRentalVehicle(vehicleData, images = [], onProgress) {
    try {
      let uploadedImages = [];
      
      // Upload images to S3
      if (images && images.length > 0) {
        onProgress?.({ phase: 'uploading', progress: 0 });
        
        const uploadResults = await imageService.uploadMultiple(
          images,
          'rentals',
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
      
      // Prepare the data
      const formData = new FormData();
      
      formData.append('vehicleData', JSON.stringify({
        ...vehicleData,
        images: uploadedImages
      }));
      
      const response = await http.post('/rentals', formData, {
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
          vehicle: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to create rental vehicle');
      }
    } catch (error) {
      console.error('Error creating rental vehicle:', error);
      return {
        vehicle: null,
        success: false,
        error: error.message || 'Failed to create rental vehicle'
      };
    }
  },
  
  // Update rental vehicle with S3 image handling
  async updateRentalVehicle(id, vehicleData, newImages = [], keepExistingImages = true, onProgress) {
    try {
      let uploadedImages = [];
      
      // Upload new images to S3
      if (newImages && newImages.length > 0) {
        onProgress?.({ phase: 'uploading', progress: 0 });
        
        const imageFiles = newImages.filter(img => img instanceof File);
        
        if (imageFiles.length > 0) {
          const uploadResults = await imageService.uploadMultiple(
            imageFiles,
            'rentals',
            (progress) => onProgress?.({ phase: 'uploading', progress })
          );
          
          uploadedImages = uploadResults.map((result) => ({
            url: result.url,
            key: result.key,
            thumbnail: result.thumbnail,
            isPrimary: false
          }));
        }
      }
      
      onProgress?.({ phase: 'updating', progress: 0 });
      
      // Prepare form data
      const formData = new FormData();
      
      const dataToSend = { 
        ...vehicleData, 
        keepImages: keepExistingImages,
        newImages: uploadedImages
      };
      
      formData.append('vehicleData', JSON.stringify(dataToSend));
      
      const response = await http.put(`/rentals/${id}`, formData, {
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
          vehicle: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || `Failed to update rental vehicle with ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error updating rental vehicle with ID ${id}:`, error);
      return {
        vehicle: null,
        success: false,
        error: error.message || `Failed to update rental vehicle with ID: ${id}`
      };
    }
  },
  
  // Delete rental vehicle
  async deleteRentalVehicle(id) {
    try {
      const response = await http.delete(`/rentals/${id}`);
      
      if (response.data.success) {
        return {
          success: true
        };
      } else {
        throw new Error(response.data.message || `Failed to delete rental vehicle with ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error deleting rental vehicle with ID ${id}:`, error);
      return {
        success: false,
        error: error.message || `Failed to delete rental vehicle with ID: ${id}`
      };
    }
  },
  
  // Update vehicle status
  async updateStatus(id, status) {
    try {
      const response = await http.patch(`/rentals/${id}/status`, { status });
      
      if (response.data.success) {
        return {
          vehicle: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || `Failed to update status for vehicle with ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error updating status for vehicle with ID ${id}:`, error);
      return {
        vehicle: null,
        success: false,
        error: error.message || `Failed to update status for vehicle with ID: ${id}`
      };
    }
  }
};

export default rentalVehicleService;