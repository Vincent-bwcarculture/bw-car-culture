// src/services/serviceProviderService.js
import { http } from '../config/axios.js';
import { imageService } from './imageService.js';

export const serviceProviderService = {
  // Get all service providers with optional filters
  async getServiceProviders(filters = {}, page = 1, limit = 10) {
    try {
      const queryParams = new URLSearchParams();
      
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (filters.providerType) queryParams.append('providerType', filters.providerType);
      if (filters.businessType && filters.businessType !== 'all') queryParams.append('businessType', filters.businessType);
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.city) queryParams.append('city', filters.city);
      if (filters.country) queryParams.append('country', filters.country);
      if (filters.sort) queryParams.append('sort', filters.sort);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (!['providerType', 'businessType', 'status', 'search', 'city', 'country', 'sort', 'page', 'limit'].includes(key)) {
          if (value && value !== 'all' && value !== 'All') {
            queryParams.append(key, value);
          }
        }
      });
      
      const response = await http.get(`/providers?${queryParams.toString()}`);
      
      if (response.data.success) {
        return {
          providers: response.data.data || [],
          pagination: response.data.pagination || {
            currentPage: page,
            totalPages: 1,
            total: response.data.data?.length || 0
          },
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch service providers');
      }
    } catch (error) {
      console.error('Error fetching service providers:', error);
      return {
        providers: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          total: 0
        },
        success: false,
        error: error.message || 'Failed to fetch service providers'
      };
    }
  },
  
  // Get all providers for dropdown selection
  async getAllProviders(type = null) {
    try {
      const queryParams = new URLSearchParams();
      if (type) {
        queryParams.append('type', type);
      }
      
      const response = await http.get(`/providers/all?${queryParams.toString()}`);
      
      if (response.data && response.data.success) {
        return {
          providers: response.data.providers || [],
          success: true
        };
      } else {
        throw new Error(response.data?.message || 'Failed to fetch providers');
      }
    } catch (error) {
      console.error('Error fetching all providers:', error);
      return {
        providers: [],
        success: false,
        error: error.message || 'Failed to fetch providers'
      };
    }
  },
  
  // Get a single provider by ID
  async getProvider(id) {
    try {
      const response = await http.get(`/providers/${id}`);
      
      if (response.data.success) {
        return {
          provider: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || `Failed to fetch provider with ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error fetching provider with ID ${id}:`, error);
      return {
        provider: null,
        success: false,
        error: error.message || `Failed to fetch provider with ID: ${id}`
      };
    }
  },
  
  // Create service provider with S3 image upload
  async createProvider(providerData, logoFile = null, bannerFile = null, onProgress) {
    try {
      let uploadedLogo = null;
      let uploadedBanner = null;
      
      // Upload logo to S3 if provided
      if (logoFile) {
        onProgress?.({ phase: 'uploading-logo', progress: 0 });
        uploadedLogo = await imageService.uploadImage(
          logoFile,
          'providers',
          (progress) => onProgress?.({ phase: 'uploading-logo', progress })
        );
      }
      
      // Upload banner to S3 if provided
      if (bannerFile) {
        onProgress?.({ phase: 'uploading-banner', progress: 0 });
        uploadedBanner = await imageService.uploadImage(
          bannerFile,
          'providers',
          (progress) => onProgress?.({ phase: 'uploading-banner', progress })
        );
      }
      
      onProgress?.({ phase: 'creating', progress: 0 });
      
      // Prepare provider data with S3 URLs
      const dataWithImages = {
        ...providerData,
        profile: {
          ...providerData.profile,
          ...(uploadedLogo && { logo: uploadedLogo.url }),
          ...(uploadedBanner && { banner: uploadedBanner.url })
        }
      };
      
      // Create form data
      const formData = new FormData();
      formData.append('providerData', JSON.stringify(dataWithImages));
      
      const response = await http.post('/providers', formData, {
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
          provider: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to create provider');
      }
    } catch (error) {
      console.error('Error creating provider:', error);
      throw error;
    }
  },
  
  // Update service provider with S3 image handling
  async updateProvider(id, providerData, logoFile = null, bannerFile = null, onProgress) {
    try {
      let uploadedLogo = null;
      let uploadedBanner = null;
      
      // Upload new logo to S3 if provided
      if (logoFile) {
        onProgress?.({ phase: 'uploading-logo', progress: 0 });
        uploadedLogo = await imageService.uploadImage(
          logoFile,
          'providers',
          (progress) => onProgress?.({ phase: 'uploading-logo', progress })
        );
      }
      
      // Upload new banner to S3 if provided
      if (bannerFile) {
        onProgress?.({ phase: 'uploading-banner', progress: 0 });
        uploadedBanner = await imageService.uploadImage(
          bannerFile,
          'providers',
          (progress) => onProgress?.({ phase: 'uploading-banner', progress })
        );
      }
      
      onProgress?.({ phase: 'updating', progress: 0 });
      
      // Prepare provider data with new S3 URLs
      const dataWithImages = {
        ...providerData,
        profile: {
          ...providerData.profile,
          ...(uploadedLogo && { logo: uploadedLogo.url }),
          ...(uploadedBanner && { banner: uploadedBanner.url })
        }
      };
      
      // Create form data
      const formData = new FormData();
      formData.append('providerData', JSON.stringify(dataWithImages));
      
      const response = await http.put(`/providers/${id}`, formData, {
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
          provider: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to update provider');
      }
    } catch (error) {
      console.error(`Error updating provider ${id}:`, error);
      throw error;
    }
  },
  
  // Get provider listings
  async getProviderListings(providerId, page = 1, limit = 10) {
    try {
      if (!providerId) {
        console.warn('No provider ID provided for getProviderListings');
        return { 
          listings: [], 
          pagination: { currentPage: page, totalPages: 1, total: 0 },
          success: false
        };
      }
      
      const response = await http.get(`/providers/${providerId}/listings`, {
        params: { page, limit }
      });
      
      if (response.data && response.data.success) {
        return {
          listings: response.data.data || [],
          pagination: response.data.pagination || {
            currentPage: page,
            totalPages: Math.ceil((response.data.total || 0) / limit),
            total: response.data.total || response.data.data?.length || 0
          },
          success: true
        };
      } else {
        throw new Error(response.data?.message || `Failed to fetch listings for provider ${providerId}`);
      }
    } catch (error) {
      console.error(`Error fetching listings for provider ${providerId}:`, error);
      return { 
        listings: [], 
        pagination: { currentPage: page, totalPages: 1, total: 0 },
        success: false,
        error: error.message || `Failed to fetch listings for provider ${providerId}`
      };
    }
  },
  
  // Update subscription
  async updateSubscription(id, subscriptionData) {
    try {
      const response = await http.put(`/providers/${id}/subscription`, subscriptionData);
      
      if (response.data.success) {
        return {
          provider: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to update subscription');
      }
    } catch (error) {
      console.error(`Error updating subscription for provider ${id}:`, error);
      throw error;
    }
  },
  
  // Verify provider
  async verifyProvider(id) {
    try {
      const response = await http.put(`/providers/${id}/verify`);
      
      if (response.data.success) {
        return {
          provider: response.data.data,
          success: true
        };
      } else {
        throw new Error(response.data.message || 'Failed to verify provider');
      }
    } catch (error) {
      console.error(`Error verifying provider ${id}:`, error);
      throw error;
    }
  }
};

export default serviceProviderService;