// src/services/transportRouteService.js - Enhanced for car integration
import { http } from '../config/axios.js';
import { imageService } from './imageService.js';

export const transportRouteService = {
  // Get all transport routes with filters - ENHANCED
  async getTransportRoutes(filters = {}, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams();
      
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.origin) queryParams.append('origin', filters.origin);
      if (filters.destination) queryParams.append('destination', filters.destination);
      if (filters.routeType) queryParams.append('routeType', filters.routeType);
      if (filters.serviceType) queryParams.append('serviceType', filters.serviceType);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      if (filters.operatingDay) queryParams.append('operatingDay', filters.operatingDay);
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.city) queryParams.append('city', filters.city);
      if (filters.country) queryParams.append('country', filters.country);
      if (filters.providerId) queryParams.append('providerId', filters.providerId); // NEW
      if (filters.sort) queryParams.append('sort', filters.sort);
      
      // Add any additional filters
      Object.entries(filters).forEach(([key, value]) => {
        if (!['search', 'origin', 'destination', 'routeType', 'serviceType', 'minPrice', 
              'maxPrice', 'operatingDay', 'status', 'city', 'country', 'providerId', 
              'sort', 'page', 'limit'].includes(key)) {
          if (value && value !== 'all' && value !== 'All') {
            queryParams.append(key, value);
          }
        }
      });
      
      console.log(`Fetching transport routes with query: ${queryParams.toString()}`);
      const response = await http.get(`/transport?${queryParams.toString()}`);
      
      if (response.data.success) {
        return {
          routes: response.data.data || response.data.routes || [],
          pagination: response.data.pagination || {
            currentPage: page,
            totalPages: 1,
            total: response.data.data?.length || response.data.routes?.length || 0
          },
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch transport routes');
      }
    } catch (error) {
      console.error('Error fetching transport routes:', error);
      return {
        routes: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          total: 0
        },
        success: false,
        error: error.message || 'Failed to fetch transport routes'
      };
    }
  },
  
  // Get a single transport route by ID - ENHANCED
  async getTransportRoute(id) {
    try {
      const response = await http.get(`/transport/${id}`);
      
      if (response.data.success) {
        return {
          route: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || `Failed to fetch transport route with ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error fetching transport route with ID ${id}:`, error);
      return {
        route: null,
        success: false,
        error: error.message || `Failed to fetch transport route with ID: ${id}`
      };
    }
  },
  
  // Create transport route with S3 image upload - ENHANCED
  async createRoute(routeData, images = [], onProgress) {
    try {
      let uploadedImages = [];
      
      // Upload images to S3
      if (images && images.length > 0) {
        onProgress?.({ phase: 'uploading', progress: 0 });
        
        console.log(`Uploading ${images.length} images for transport route`);
        
        const uploadResults = await imageService.uploadMultiple(
          images,
          'transport',
          (progress) => onProgress?.({ phase: 'uploading', progress })
        );
        
        uploadedImages = uploadResults.map((result, index) => ({
          url: result.url,
          key: result.key,
          thumbnail: result.thumbnail,
          isPrimary: index === 0
        }));
        
        console.log(`Successfully uploaded ${uploadedImages.length} images to S3`);
      }
      
      onProgress?.({ phase: 'creating', progress: 0 });
      
      // Create form data
      const formData = new FormData();
      formData.append('routeData', JSON.stringify({
        ...routeData,
        images: uploadedImages
      }));
      
      const response = await http.post('/transport', formData, {
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
          route: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to create transport route');
      }
    } catch (error) {
      console.error('Error creating transport route:', error);
      throw error;
    }
  },
  
  // Update transport route with S3 image handling - ENHANCED
  async updateRoute(id, routeData, newImages = [], onProgress) {
    try {
      let uploadedImages = [];
      
      // Upload new images to S3
      if (newImages && newImages.length > 0) {
        onProgress?.({ phase: 'uploading', progress: 0 });
        
        console.log(`Uploading ${newImages.length} new images for transport route`);
        
        const uploadResults = await imageService.uploadMultiple(
          newImages,
          'transport',
          (progress) => onProgress?.({ phase: 'uploading', progress })
        );
        
        uploadedImages = uploadResults.map((result) => ({
          url: result.url,
          key: result.key,
          thumbnail: result.thumbnail,
          isPrimary: false
        }));
        
        console.log(`Successfully uploaded ${uploadedImages.length} new images to S3`);
      }
      
      onProgress?.({ phase: 'updating', progress: 0 });
      
      // Create form data
      const formData = new FormData();
      
      const existingImages = routeData.existingImages || [];
      const allImages = [...existingImages, ...uploadedImages];
      
      formData.append('routeData', JSON.stringify({
        ...routeData,
        images: allImages
      }));
      
      const response = await http.put(`/transport/${id}`, formData, {
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
          route: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to update transport route');
      }
    } catch (error) {
      console.error(`Error updating transport route ${id}:`, error);
      throw error;
    }
  },
  
  // Delete transport route
  async deleteRoute(id) {
    try {
      const response = await http.delete(`/transport/${id}`);
      
      if (response.data.success) {
        return {
          success: true
        };
      } else {
        throw new Error(response.data.message || `Failed to delete transport route with ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error deleting transport route with ID ${id}:`, error);
      return {
        success: false,
        error: error.message || `Failed to delete transport route with ID: ${id}`
      };
    }
  },
  
  // Get featured transport routes
  async getFeaturedRoutes(limit = 6) {
    try {
      const response = await http.get(`/transport/featured?limit=${limit}`);
      
      if (response.data.success) {
        return {
          routes: response.data.data || [],
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch featured transport routes');
      }
    } catch (error) {
      console.error('Error fetching featured transport routes:', error);
      return {
        routes: [],
        success: false,
        error: error.message || 'Failed to fetch featured transport routes'
      };
    }
  },
  
  // Get transport routes for a specific provider - ENHANCED
  async getProviderRoutes(providerId, page = 1, limit = 10) {
    try {
      if (!providerId) {
        console.warn('No provider ID provided for getProviderRoutes');
        return { 
          routes: [], 
          pagination: { currentPage: page, totalPages: 1, total: 0 },
          success: false,
          error: 'Provider ID is required'
        };
      }
      
      console.log(`Fetching transport routes for provider: ${providerId}`);
      
      const response = await http.get(`/transport/provider/${providerId}`, {
        params: { page, limit }
      });
      
      console.log(`Transport API response structure:`, {
        status: response.status,
        success: response.data?.success,
        dataType: response.data?.data ? typeof response.data.data : 'missing',
        dataLength: Array.isArray(response.data?.data) ? response.data.data.length : 'not array',
        hasRoutes: !!response.data?.routes,
        routesLength: Array.isArray(response.data?.routes) ? response.data.routes.length : 'not array'
      });
      
      if (response.data && response.data.success) {
        const routes = response.data.data || response.data.routes || [];
        
        const pagination = response.data.pagination || {
          currentPage: page,
          totalPages: Math.ceil((response.data.total || routes.length) / limit),
          total: response.data.total || routes.length
        };
        
        console.log(`Successfully fetched ${routes.length} transport routes`);
        
        return {
          routes,
          pagination,
          success: true
        };
      } else {
        throw new Error(response.data?.message || `Failed to fetch routes for provider ${providerId}`);
      }
    } catch (error) {
      console.error(`Error fetching routes for provider ${providerId}:`, error);
      return { 
        routes: [], 
        pagination: { currentPage: page, totalPages: 1, total: 0 },
        success: false,
        error: error.message || `Failed to fetch routes for provider ${providerId}`
      };
    }
  },
  
  // Search routes by origin and destination - ENHANCED
  async searchRoutes(origin, destination, date = null) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('origin', origin);
      queryParams.append('destination', destination);
      
      if (date) {
        queryParams.append('date', date);
      }
      
      console.log(`Searching transport routes: ${origin} to ${destination}${date ? ` on ${date}` : ''}`);
      
      const response = await http.get(`/transport/search?${queryParams.toString()}`);
      
      if (response.data.success) {
        console.log(`Found ${response.data.data?.length || 0} routes matching search criteria`);
        return {
          routes: response.data.data || [],
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to search transport routes');
      }
    } catch (error) {
      console.error('Error searching transport routes:', error);
      return {
        routes: [],
        success: false,
        error: error.message || 'Failed to search transport routes'
      };
    }
  },
  
  // Add a review for a transport route
  async addReview(routeId, reviewData) {
    try {
      const response = await http.post(`/transport/${routeId}/reviews`, reviewData);
      
      if (response.data.success) {
        return {
          message: response.data.message || 'Review added successfully',
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to add review');
      }
    } catch (error) {
      console.error('Error adding review:', error);
      return {
        success: false,
        error: error.message || 'Failed to add review'
      };
    }
  },

  // Update route status
  async updateStatus(id, status) {
    try {
      const response = await http.patch(`/transport/${id}/status`, { status });
      
      if (response.data.success) {
        return {
          route: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || `Failed to update status for route with ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error updating status for route with ID ${id}:`, error);
      return {
        route: null,
        success: false,
        error: error.message || `Failed to update status for route with ID: ${id}`
      };
    }
  },

  // NEW: Get destination cities for autocomplete/dropdown
  async getDestinationCities() {
    try {
      console.log('Fetching destination cities for autocomplete');
      
      const response = await http.get('/transport/destinations');
      
      if (response.data.success) {
        console.log(`Found ${response.data.data?.length || 0} destination cities`);
        return {
          cities: response.data.data || [],
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch destination cities');
      }
    } catch (error) {
      console.error('Error fetching destination cities:', error);
      return {
        cities: [],
        success: false,
        error: error.message || 'Failed to fetch destination cities'
      };
    }
  },

  // NEW: Get routes with enhanced similarity matching for car integration
  async getRoutesWithCarIntegration(filters = {}, page = 1, limit = 10) {
    try {
      // Enhanced filters for car integration
      const enhancedFilters = {
        ...filters,
        includeDestinationData: true, // Flag for backend to include destination info
        includeCarRecommendations: true // Flag for future car recommendations
      };
      
      const result = await this.getTransportRoutes(enhancedFilters, page, limit);
      
      // If successful, enhance the data with additional context
      if (result.success && result.routes.length > 0) {
        result.routes = result.routes.map(route => ({
          ...route,
          // Add computed fields for car integration
          destinationCity: this.extractCityFromDestination(route.destination),
          searchableCities: this.getSearchableCities(route),
          // Add metadata for frontend filtering
          metadata: {
            hasDestinationData: !!route.destination,
            canShowCars: !!this.extractCityFromDestination(route.destination),
            routePopularity: route.views || 0
          }
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching routes with car integration:', error);
      return {
        routes: [],
        pagination: { currentPage: page, totalPages: 1, total: 0 },
        success: false,
        error: error.message || 'Failed to fetch routes with car integration'
      };
    }
  },

  // Helper function to extract city from destination string
  extractCityFromDestination(destination) {
    if (!destination) return null;
    
    // Clean up the destination string
    let city = destination.trim();
    
    // If destination contains comma, take the first part (city)
    if (city.includes(',')) {
      city = city.split(',')[0].trim();
    }
    
    // Remove common prefixes
    city = city.replace(/^(to\s+|near\s+|in\s+)/i, '');
    
    return city || null;
  },

  // Helper function to get all searchable cities from a route
  getSearchableCities(route) {
    const cities = [];
    
    if (route.origin) {
      const originCity = this.extractCityFromDestination(route.origin);
      if (originCity) cities.push(originCity);
    }
    
    if (route.destination) {
      const destCity = this.extractCityFromDestination(route.destination);
      if (destCity) cities.push(destCity);
    }
    
    // Add stops if available
    if (route.stops && Array.isArray(route.stops)) {
      route.stops.forEach(stop => {
        if (stop.name) {
          const stopCity = this.extractCityFromDestination(stop.name);
          if (stopCity) cities.push(stopCity);
        }
      });
    }
    
    // Remove duplicates and return
    return [...new Set(cities)];
  },

  // NEW: Get popular routes by destination for car integration
  async getPopularRoutesByDestination(destination, limit = 5) {
    try {
      console.log(`Fetching popular routes to destination: ${destination}`);
      
      const filters = {
        destination: destination,
        sort: '-views' // Sort by popularity (views)
      };
      
      const result = await this.getTransportRoutes(filters, 1, limit);
      
      if (result.success) {
        console.log(`Found ${result.routes.length} popular routes to ${destination}`);
        return {
          routes: result.routes,
          success: true
        };
      } else {
        throw new Error(result.error || 'Failed to fetch popular routes');
      }
    } catch (error) {
      console.error(`Error fetching popular routes to ${destination}:`, error);
      return {
        routes: [],
        success: false,
        error: error.message || `Failed to fetch popular routes to ${destination}`
      };
    }
  },

  // NEW: Get route analytics for better car integration
  async getRouteAnalytics(routeId) {
    try {
      const response = await http.get(`/transport/${routeId}/analytics`);
      
      if (response.data.success) {
        return {
          analytics: response.data.data,
          success: true
        };
      } else {
        // If analytics endpoint doesn't exist, return basic info
        const routeResult = await this.getTransportRoute(routeId);
        if (routeResult.success) {
          return {
            analytics: {
              views: routeResult.route.views || 0,
              bookings: routeResult.route.bookings || 0,
              rating: routeResult.route.averageRating || 0,
              reviews: routeResult.route.reviews?.length || 0
            },
            success: true
          };
        }
        throw new Error('Failed to get route analytics');
      }
    } catch (error) {
      console.error(`Error fetching analytics for route ${routeId}:`, error);
      return {
        analytics: null,
        success: false,
        error: error.message || 'Failed to fetch route analytics'
      };
    }
  }
};

export default transportRouteService;