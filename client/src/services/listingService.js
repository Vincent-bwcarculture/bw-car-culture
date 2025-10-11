// src/services/listingService.js
import axios from '../config/axios.js';
import { FILE_UPLOAD_CONFIG } from '../constants/listingConstants.js';
import { imageService } from './imageService.js';

class ListingService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || '/api';
    this.endpoint = `${this.baseUrl}/listings`;
    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: 300000 // 5 mins timeout
    });
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    this.pendingRequests = {};
  }

  // Get auth headers
  getHeaders(isFormData = false) {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
      headers['Cache-Control'] = 'no-cache';
    }
    return headers;
  }

  // Request key generator
  getRequestKey(filters, page) {
    return `${page}-${JSON.stringify(filters)}`;
  }

  // Cache management
  async getCachedData(key, fetchFunction) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    const data = await fetchFunction();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    return data;
  }

  // ✅ FIXED: Get listings with proper pagination handling
  async getListings(filters = {}, page = 1, limit = 24) {
    const requestKey = this.getRequestKey(filters, page);

    if (this.pendingRequests[requestKey]) {
      console.log('Using existing request for', requestKey);
      return this.pendingRequests[requestKey];
    }

    const requestPromise = new Promise(async (resolve, reject) => {
      try {
        if (Object.keys(this.pendingRequests).length > 0) {
          await new Promise(r => setTimeout(r, 300));
        }

        console.log('Fetching listings with params:', { page, limit, ...filters });
        const response = await this.axios.get(this.endpoint, {
          params: {
            page,
            limit,
            ...filters
          },
          headers: this.getHeaders()
        });

        console.log('Raw backend response:', {
          success: response.data?.success,
          dataCount: response.data?.data?.length,
          total: response.data?.total,
          pagination: response.data?.pagination,
          currentPage: response.data?.currentPage,
          totalPages: response.data?.totalPages
        });

        // ✅ FIXED: Handle both response formats (nested pagination or root level)
        const listings = response.data?.data || response.data?.listings || [];
        const paginationData = response.data?.pagination || {};
        
        // ✅ Get pagination values from the right place
        const total = paginationData.total || response.data?.total || 0;
        const currentPage = paginationData.currentPage || response.data?.currentPage || page;
        const totalPages = paginationData.totalPages || response.data?.totalPages || Math.ceil(total / limit);
        
        console.log(`Successfully fetched ${listings.length} listings`);
        console.log('Pagination:', { currentPage, totalPages, total, limit });

        const result = {
          listings,
          total,
          currentPage,
          totalPages,
          pagination: {
            currentPage,
            totalPages,
            total,
            limit,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1
          }
        };
        
        resolve(result);
      } catch (error) {
        console.error('Error fetching listings:', error.response?.data || error.message);
        if (error.response?.status === 429) {
          console.warn('Rate limited. Please try again later.');
          reject(new Error('Too many requests. Please try again later.'));
        } else {
          resolve({
            listings: [],
            total: 0,
            currentPage: page,
            totalPages: 1,
            pagination: {
              currentPage: page,
              totalPages: 1,
              total: 0,
              limit,
              hasNext: false,
              hasPrev: false
            },
            error: error.message
          });
        }
      } finally {
        delete this.pendingRequests[requestKey];
      }
    });

    this.pendingRequests[requestKey] = requestPromise;
    return requestPromise;
  }

  // Get single listing
  async getListing(id) {
    try {
      const response = await this.axios.get(`${this.endpoint}/${id}`, {
        headers: this.getHeaders()
      });
      const listing = response.data?.data;
      if (!listing) {
        throw new Error(`Listing with id ${id} not found`);
      }
      
      // Normalize image URLs for S3
      if (listing.images && listing.images.length > 0) {
        listing.images = listing.images.map(img => {
          // If it's a string, keep it as is
          if (typeof img === 'string') {
            return { url: img };
          }
          
          // For object-based images, ensure URL is cleaned up
          if (img && typeof img === 'object') {
            const normalizedImg = { ...img };
            
            // Fix problematic URLs with duplicated image paths
            if (normalizedImg.url && normalizedImg.url.includes('/images/images/')) {
              normalizedImg.url = normalizedImg.url.replace(/\/images\/images\//g, '/images/');
            }
            
            // Create proxied URL for S3 keys that don't have URLs
            if (!normalizedImg.url && normalizedImg.key) {
              normalizedImg.url = `/api/images/s3-proxy/${normalizedImg.key}`;
            }
            
            return normalizedImg;
          }
          
          return img;
        });
      }
      
      return listing;
    } catch (error) {
      console.error(`Error fetching listing ${id}:`, error.response?.data || error.message);
      throw error;
    }
  }

  // Create listing with S3 image upload - Fixed to handle file objects correctly and provide fallback
  async createListing(listingData, images = [], onProgress) {
    try {
      console.log(`Creating listing with ${images.length} images`);
      console.log('API endpoint:', this.endpoint);
      
      // Verify we have valid images before attempting upload
      if (!images || images.length === 0) {
        console.error('No images provided for listing');
        throw new Error('At least one image is required');
      }
      
      // Extract the actual File objects from the images array if needed
      const fileObjects = images.map(img => {
        // If it's a raw File object, use it directly; if it has a 'file' property, use that
        return img instanceof File ? img : img.file;
      }).filter(file => file instanceof File); // Filter out any invalid entries
      
      console.log(`Extracted ${fileObjects.length} valid file objects for upload`);
      
      // Double check we have valid files to upload
      if (fileObjects.length === 0) {
        console.error('No valid file objects for upload');
        throw new Error('No valid image files to upload');
      }
      
      // Upload images to server
      let imageData = [];
      let uploadSuccess = false;
      
      try {
        onProgress?.({ phase: 'uploading', progress: 0 });
        
        // Make the upload request
        imageData = await imageService.uploadMultiple(
          fileObjects,
          'listings',
          (progress) => onProgress?.({ phase: 'uploading', progress })
        );
        
        console.log('Upload results received:', imageData);
        uploadSuccess = true;
      } catch (uploadError) {
        console.error('Error during image upload:', uploadError);
        
        // CRITICAL FALLBACK: If server upload fails, create local references
        // This lets the UI continue working even if S3 is down
        console.warn('Using fallback image paths due to upload failure');
        imageData = fileObjects.map((file, index) => {
          const timestamp = Date.now();
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          return {
            url: `/uploads/listings/${timestamp}-${index}-${safeName}`,
            key: `listings/${timestamp}-${index}-${safeName}`,
            size: file.size,
            mimetype: file.type,
            isPrimary: index === (listingData.primaryImageIndex || 0),
            isFallback: true
          };
        });
      }
      
      // If we still don't have image data, we can't proceed
      if (!imageData || imageData.length === 0) {
        throw new Error('Failed to process images for listing');
      }
      
      // Continue with listing creation
      onProgress?.({ phase: 'creating', progress: 0 });
      
      // Add image metadata to the listing data
      const requestData = {
        ...listingData,
        images: imageData.map((image, index) => ({
          url: image.url,
          key: image.key || image.url,
          thumbnail: image.thumbnail?.url || image.thumbnail,
          isPrimary: index === (listingData.primaryImageIndex || 0),
          size: image.size,
          mimetype: image.mimetype
        }))
      };
      
      console.log('Sending listing data to server');
      
      // Send listing data with images
      const response = await this.axios.post('/listings', requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress?.({ phase: 'creating', progress: percentCompleted });
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Server reported error creating listing');
      }
      
      this.cache.clear();
      return response.data;
    } catch (error) {
      console.error('Error creating listing:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  }

  // Update listing with S3 image handling
async updateListing(id, listingData, newImages = [], onProgress) {
  try {
    console.log(`Starting update for listing ${id}`);
    console.log('Update data:', {
      title: listingData.title,
      existingImages: listingData.existingImages?.length || 0,
      newImages: newImages?.length || 0,
      imagesToDelete: listingData.imagesToDelete?.length || 0
    });
    
    // Validate inputs
    if (!id) {
      throw new Error('Listing ID is required');
    }
    
    if (!listingData) {
      throw new Error('Listing data is required');
    }
    
    // Clear any cached data for this listing
    this.cache.delete(id);
    
    onProgress?.({ phase: 'preparing', progress: 10 });
    
    // Step 1: Upload new images if provided
    let uploadedImages = [];
    if (newImages && newImages.length > 0) {
      console.log(`Uploading ${newImages.length} new images...`);
      onProgress?.({ phase: 'uploading', progress: 20 });
      
      // Extract actual File objects and validate
      const validFiles = newImages
        .map(img => img instanceof File ? img : img.file)
        .filter(file => {
          if (!(file instanceof File)) {
            console.warn('Skipping invalid file object:', typeof file);
            return false;
          }
          
          // Validate file type
          if (!file.type.startsWith('image/')) {
            console.warn('Skipping non-image file:', file.name, file.type);
            return false;
          }
          
          // Validate file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            console.warn('Skipping oversized file:', file.name, file.size);
            return false;
          }
          
          return true;
        });
      
      if (validFiles.length === 0) {
        console.warn('No valid files to upload');
      } else {
        try {
          uploadedImages = await imageService.uploadMultiple(
            validFiles,
            'listings',
            (progress) => onProgress?.({ 
              phase: 'uploading', 
              progress: 20 + (progress * 0.4) // 20% to 60%
            })
          );
          
          console.log(`Successfully uploaded ${uploadedImages.length} images`);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          throw new Error('Failed to upload images: ' + uploadError.message);
        }
      }
    }
    
    onProgress?.({ phase: 'updating', progress: 70 });
    
    // Step 2: Prepare the request data
    const requestData = {
      // Core listing data
      title: listingData.title,
      description: listingData.description,
      price: listingData.price,
      make: listingData.make,
      model: listingData.model,
      year: listingData.year,
      mileage: listingData.mileage,
      transmission: listingData.transmission,
      fuelType: listingData.fuelType,
      bodyType: listingData.bodyType,
      condition: listingData.condition,
      location: listingData.location,
      features: listingData.features,
      specifications: listingData.specifications,
      serviceHistory: listingData.serviceHistory,
      seo: listingData.seo,
      priceOptions: listingData.priceOptions,
      
      // Image data
      existingImages: listingData.existingImages || [],
      imagesToDelete: listingData.imagesToDelete || [],
      primaryImageIndex: listingData.primaryImageIndex || 0
    };
    
    // Add uploaded image data if we have any
    if (uploadedImages.length > 0) {
      requestData.uploadedImages = uploadedImages.map((result, index) => ({
        url: result.url,
        key: result.key,
        thumbnail: result.thumbnail,
        size: result.size,
        mimetype: result.mimetype,
        isPrimary: false // Will be set based on primaryImageIndex
      }));
    }
    
    console.log('Prepared request data:', {
      title: requestData.title,
      existingImages: requestData.existingImages.length,
      uploadedImages: requestData.uploadedImages?.length || 0,
      imagesToDelete: requestData.imagesToDelete.length,
      primaryIndex: requestData.primaryImageIndex
    });
    
    // Step 3: Send update request to server
    const response = await this.axios.put(`${this.endpoint}/${id}`, {
      listingData: JSON.stringify(requestData)
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(70 + (progressEvent.loaded * 30) / progressEvent.total);
          onProgress?.({ phase: 'updating', progress: percentCompleted });
        }
      }
    });
    
    // Step 4: Validate response
    if (!response.data) {
      throw new Error('No response data received from server');
    }
    
    if (!response.data.success) {
      const errorMessage = response.data.message || 'Server reported update failed';
      console.error('Server error:', response.data);
      throw new Error(errorMessage);
    }
    
    console.log('Listing updated successfully:', response.data.data?._id);
    onProgress?.({ phase: 'complete', progress: 100 });
    
    // Clear cache to force fresh data fetch
    this.cache.clear();
    
    return response.data;
    
  } catch (error) {
    console.error('Error updating listing:', error);
    
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const serverError = error.response.data;
      console.error('Server error response:', serverError);
      
      if (serverError.errors) {
        // Validation errors
        throw new Error(`Validation failed: ${Object.values(serverError.errors).join(', ')}`);
      } else if (serverError.message) {
        throw new Error(serverError.message);
      } else {
        throw new Error(`Server error: ${error.response.status}`);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.request);
      throw new Error('Network error: Unable to reach server');
    } else {
      // Other error
      throw new Error(error.message || 'Unknown error occurred');
    }
  }
}

// Helper method to validate listing data before update
validateUpdateData(listingData) {
  const errors = {};
  
  // Required fields
  const requiredFields = {
    title: 'Title',
    price: 'Price', 
    make: 'Make',
    model: 'Model',
    year: 'Year'
  };
  
  Object.entries(requiredFields).forEach(([field, label]) => {
    if (!listingData[field] || listingData[field].toString().trim() === '') {
      errors[field] = `${label} is required`;
    }
  });
  
  // Validate price
  if (listingData.price && (isNaN(listingData.price) || parseFloat(listingData.price) <= 0)) {
    errors.price = 'Price must be a valid positive number';
  }
  
  // Validate year
  if (listingData.year && (isNaN(listingData.year) || listingData.year < 1900 || listingData.year > new Date().getFullYear() + 1)) {
    errors.year = 'Please enter a valid year';
  }
  
  // Validate mileage
  if (listingData.mileage && (isNaN(listingData.mileage) || listingData.mileage < 0)) {
    errors.mileage = 'Mileage must be a valid positive number';
  }
  
  // Check image requirements
  const totalImages = (listingData.existingImages?.length || 0) + (listingData.newImages?.length || 0);
  if (totalImages === 0) {
    errors.images = 'At least one image is required';
  }
  
  return errors;
}

  // Delete listing
  async deleteListing(id) {
    try {
      const response = await this.axios.delete(`${this.endpoint}/${id}`, {
        headers: this.getHeaders()
      });
      this.cache.clear();
      return response.data;
    } catch (error) {
      console.error(`Error deleting listing ${id}:`, error);
      throw error;
    }
  }

  async getFeaturedListings(limit = 5) {
    const requestKey = `featured-${limit}`;
    if (this.pendingRequests[requestKey]) {
      console.log('Using existing request for', requestKey);
      return this.pendingRequests[requestKey];
    }

    const fetchFunction = async () => {
      try {
        const timestamp = Date.now();
        const response = await this.axios.get(`${this.endpoint}/featured`, {
          params: { limit, _t: timestamp },
          headers: this.getHeaders()
        });
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching featured listings:', error);
        if (error.response?.status === 429) {
          console.warn('Rate limited. Please try again later.');
          throw new Error('Too many requests. Please try again later.');
        }
        throw error;
      }
    };

    const requestPromise = this.getCachedData(requestKey, fetchFunction)
      .finally(() => delete this.pendingRequests[requestKey]);

    this.pendingRequests[requestKey] = requestPromise;
    return requestPromise;
  }

  async getPopularListings(limit = 5) {
    return this.getCachedData(`popular-${limit}`, async () => {
      try {
        const response = await this.axios.get(`${this.endpoint}/popular`, {
          params: { limit },
          headers: this.getHeaders()
        });
        return response.data.data;
      } catch (error) {
        this.handleError('Error fetching popular listings:', error);
        throw error;
      }
    });
  }

  async getDealerListings(dealerId, page = 1, limit = 10) {
    try {
      if (!dealerId) {
        console.warn('No dealer ID provided for getDealerListings');
        return [];
      }
      
      const id = typeof dealerId === 'object' ? dealerId._id || dealerId.id : dealerId;
      
      if (!id) {
        console.warn('Invalid dealer ID format:', dealerId);
        return [];
      }
      
      console.log(`Fetching dealer listings for dealer ${id}`);
      
      const response = await this.axios.get(`${this.endpoint}/dealer/${id}`, {
        params: { page, limit },
        headers: this.getHeaders()
      });
      
      return response.data?.data || [];
    } catch (error) {
      console.error(`Error fetching dealer listings for dealer ${dealerId}:`, error);
      return [];
    }
  }

  async getSimilarListings(id, limit = 4) {
    return this.getCachedData(`similar-${id}`, async () => {
      try {
        const response = await this.axios.get(`${this.endpoint}/${id}/similar`, {
          params: { limit },
          headers: this.getHeaders()
        });
        return response.data.data;
      } catch (error) {
        this.handleError(`Error fetching similar listings for ${id}:`, error);
        throw error;
      }
    });
  }

  async getFilterOptions() {
    return this.getCachedData('filter-options', async () => {
      try {
        console.log('Fetching filter options from server');
        const response = await this.axios.get(`${this.endpoint}/filter-options`, {
          headers: this.getHeaders()
        });
        
        if (!response.data || !response.data.data) {
          console.warn('Filter options response missing data property');
          return this.getDefaultFilterOptions();
        }
        
        console.log('Successfully fetched filter options');
        return response.data.data;
      } catch (error) {
        console.error('Error fetching filter options:', error.response?.data || error.message);
        return this.getDefaultFilterOptions();
      }
    });
  }
  
  getDefaultFilterOptions() {
    return {
      makes: [
        'Audi', 'BMW', 'Chevrolet', 'Ford', 'Honda', 'Hyundai', 
        'Kia', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Nissan', 
        'Porsche', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen'
      ],
      models: [],
      years: Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i),
      fuelTypes: ['petrol', 'diesel', 'electric', 'hybrid', 'plugin_hybrid', 'hydrogen'],
      transmissionTypes: ['manual', 'automatic', 'cvt', 'dct', 'semi-auto'],
      bodyStyles: ['Sedan', 'SUV', 'Coupe', 'Hatchback', 'Truck', 'Van', 'Convertible', 'Wagon'],
      drivetrainTypes: ['fwd', 'rwd', 'awd', '4wd'],
      conditions: ['new', 'used', 'certified'],
      priceRanges: [
        { label: 'Under $10,000', min: 0, max: 10000 },
        { label: '$10,000 - $20,000', min: 10000, max: 20000 },
        { label: '$20,000 - $30,000', min: 20000, max: 30000 },
        { label: '$30,000 - $50,000', min: 30000, max: 50000 },
        { label: '$50,000 - $100,000', min: 50000, max: 100000 },
        { label: 'Over $100,000', min: 100000, max: null }
      ],
      mileageRanges: [
        { label: 'Under 10,000', min: 0, max: 10000 },
        { label: '10,000 - 30,000', min: 10000, max: 30000 },
        { label: '30,000 - 60,000', min: 30000, max: 60000 },
        { label: '60,000 - 100,000', min: 60000, max: 100000 },
        { label: 'Over 100,000', min: 100000, max: null }
      ],
      colors: [
        'Black', 'White', 'Silver', 'Gray', 'Red', 
        'Blue', 'Green', 'Yellow', 'Orange', 'Brown', 'Other'
      ]
    };
  }

  async getModelsByMake(make) {
    if (!make) {
      return [];
    }
  
    const cacheKey = `models-${make.toLowerCase()}`;
    
    return this.getCachedData(cacheKey, async () => {
      try {
        console.log(`Fetching models for make: ${make}`);
        const response = await this.axios.get(`${this.endpoint}/models`, {
          params: { make },
          headers: this.getHeaders()
        });
        
        return response.data?.data || [];
      } catch (error) {
        console.error(`Error fetching models for make ${make}:`, error);
        return [];
      }
    });
  }

  async incrementViewCount(id) {
    try {
      const viewedListings = JSON.parse(localStorage.getItem('viewedListings') || '{}');
      const now = Date.now();
      
      if (viewedListings[id] && (now - viewedListings[id]) < 3600000) {
        console.log('View already recorded for this listing in the last hour');
        return false;
      }
      
      viewedListings[id] = now;
      localStorage.setItem('viewedListings', JSON.stringify(viewedListings));
      
      await this.axios.post(`${this.endpoint}/${id}/views`, null, {
        headers: this.getHeaders()
      });
      
      console.log(`View recorded for listing ${id}`);
      return true;
    } catch (error) {
      console.error(`Error incrementing view count for listing ${id}:`, error);
      return false;
    }
  }

  async updateListingStatus(id, status) {
  try {
    console.log(`Updating listing ${id} status to: ${status}`);
    
    // FIXED: Match backend URL format - status in path, not body
    const response = await this.axios.patch(`${this.endpoint}/${id}/status/${status}`, {}, {
      headers: this.getHeaders()
    });
    
    this.cache.clear();
    console.log(`Successfully updated listing ${id} status to ${status}`);
    return response.data.data;
  } catch (error) {
    this.handleError(`Error updating status for listing ${id}:`, error);
    throw error;
  }
}

  async toggleFeatured(id) {
    try {
      const response = await this.axios.patch(`${this.endpoint}/${id}/featured`, {}, {
        headers: this.getHeaders()
      });
      this.cache.clear();
      return response.data.data;
    } catch (error) {
      this.handleError(`Error toggling featured status for listing ${id}:`, error);
      throw error;
    }
  }

  async batchDeleteListings(ids) {
    try {
      const response = await this.axios.post(`${this.endpoint}/batch-delete`, { ids }, {
        headers: this.getHeaders()
      });
      this.cache.clear();
      return response.data;
    } catch (error) {
      this.handleError('Error deleting listings:', error);
      throw error;
    }
  }

  async batchUpdateStatus(ids, status) {
    try {
      const response = await this.axios.patch(`${this.endpoint}/batch-status`, { ids, status }, {
        headers: this.getHeaders()
      });
      this.cache.clear();
      return response.data;
    } catch (error) {
      this.handleError('Error updating listings status:', error);
      throw error;
    }
  }

  handleError(message, error) {
    console.error(message, error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
  }

  destroy() {
    this.cache.clear();
  }
}

export const listingService = new ListingService();

// API Endpoints Map Documentation
/*
  API Endpoints Map:
  - GET    /api/listings                -> getListings(filters, page, limit)
  - GET    /api/listings/:id            -> getListing(id)
  - POST   /api/listings                -> createListing(data, onProgress)
  - PUT    /api/listings/:id            -> updateListing(id, data, onProgress)
  - DELETE /api/listings/:id            -> deleteListing(id)
  - GET    /api/listings/featured       -> getFeaturedListings(limit)
  - GET    /api/listings/popular        -> getPopularListings(limit)
  - GET    /api/listings/:id/similar    -> getSimilarListings(id, limit)
  - GET    /api/listings/dealer/:dealerId -> getDealerListings(dealerId, page, limit)
  - POST   /api/listings/:id/views      -> incrementViewCount(id)
  - PATCH  /api/listings/:id/status     -> updateListingStatus(id, status)
  - PATCH  /api/listings/:id/featured   -> toggleFeatured(id)
  - POST   /api/listings/batch-delete   -> batchDeleteListings(ids)
  - PATCH  /api/listings/batch-status   -> batchUpdateStatus(ids, status)
  - GET    /api/listings/filter-options -> getFilterOptions()
  - GET    /api/listings/models?make=X  -> getModelsByMake(make)
  - GET    /api/listings/test-api       -> testConnection()
*/