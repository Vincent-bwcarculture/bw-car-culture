// src/services/dealerService.js
import { http } from '../config/axios.js';
import { imageService } from './imageService.js';

export const dealerService = {
  // Get all dealers with optional filters
  async getDealers(filters = {}, page = 1) {
    try {
      const queryParams = new URLSearchParams();
      
      queryParams.append('page', page.toString());
      queryParams.append('limit', '10');
      
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.businessType && filters.businessType !== 'all') queryParams.append('businessType', filters.businessType);
      if (filters.subscriptionStatus && filters.subscriptionStatus !== 'all') queryParams.append('subscriptionStatus', filters.subscriptionStatus);
      
      // NEW: Handle seller type filter
      if (filters.sellerType && filters.sellerType !== 'all') {
        queryParams.append('sellerType', filters.sellerType);
      }
      
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.sort) queryParams.append('sort', filters.sort);
      
      const response = await http.get(`/dealers?${queryParams.toString()}`);
      
      if (response.data.success) {
        return {
          dealers: response.data.data || [],
          pagination: response.data.pagination || {
            currentPage: page,
            totalPages: 1,
            total: response.data.data?.length || 0
          }
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch sellers');
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
      return {
        dealers: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          total: 0
        }
      };
    }
  },
  
  // Get all dealers for dropdown selection
  async getAllDealers() {
  try {
    const response = await http.get('/dealers/all');
    
    if (response.data && response.data.success) {
      // Process dealers to ensure proper seller type handling
      const processedDealers = response.data.data.map(dealer => ({
        ...dealer,
        // Ensure sellerType is properly set
        sellerType: dealer.sellerType || (dealer.privateSeller ? 'private' : 'dealership'),
        // Ensure display name is properly calculated
        displayName: dealer.sellerType === 'private' && dealer.privateSeller
          ? `${dealer.privateSeller.firstName} ${dealer.privateSeller.lastName}`
          : dealer.businessName || dealer.name
      }));

      console.log('Processed dealers with seller types:', 
        processedDealers.map(d => ({ 
          name: d.displayName, 
          type: d.sellerType,
          hasPrivateData: !!d.privateSeller 
        }))
      );

      return {
        dealers: processedDealers,
        success: true
      };
    } else {
      throw new Error(response.data?.message || 'Failed to fetch dealers');
    }
  } catch (error) {
    console.error('Error fetching all dealers:', error);
    return {
      dealers: [],
      success: false,
      error: error.message || 'Failed to fetch dealers'
    };
  }
},
  
  // Get a single dealer by ID
  async getDealer(id) {
    try {
      const response = await http.get(`/dealers/${id}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || `Failed to fetch dealer with ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error fetching dealer with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Create a new dealer with S3 image upload
// In dealerService.js, modify the createDealer method
// Complete replacement for the createDealer method in dealerService.js
// Complete replacement for createDealer method in dealerService.js
async createDealer(dealerData, logoFile = null, bannerFile = null, onProgress) {
  try {
    let uploadedLogo = null;
    let uploadedBanner = null;
    
    // Track request ID to prevent duplicates
    const requestId = Date.now().toString();
    const sellerType = dealerData.sellerType || 'dealership';
    const displayName = sellerType === 'private' 
      ? `${dealerData.privateSeller?.firstName || ''} ${dealerData.privateSeller?.lastName || ''}`.trim()
      : dealerData.businessName;
    
    console.log(`Starting ${sellerType} creation request: ${requestId} for "${displayName}"`);
    
    // Upload logo to S3 if provided
    if (logoFile) {
      console.log(`Uploading ${sellerType} logo to S3...`);
      onProgress?.({ phase: 'uploading-logo', progress: 0 });
      uploadedLogo = await imageService.uploadImage(
        logoFile,
        'dealers',
        (progress) => onProgress?.({ phase: 'uploading-logo', progress })
      );
      
      console.log('Logo upload result:', uploadedLogo);
    }
    
    // Upload banner to S3 if provided (only for dealerships)
    if (bannerFile && sellerType === 'dealership') {
      console.log('Uploading dealership banner to S3...');
      onProgress?.({ phase: 'uploading-banner', progress: 0 });
      uploadedBanner = await imageService.uploadImage(
        bannerFile,
        'dealers',
        (progress) => onProgress?.({ phase: 'uploading-banner', progress })
      );
      
      console.log('Banner upload result:', uploadedBanner);
    }
    
    // Ensure profile field exists
    if (!dealerData.profile) {
      dealerData.profile = {};
    }
    
    // Add the uploaded image URLs to the dealer data
    if (uploadedLogo) {
      dealerData.profile.logo = uploadedLogo.url;
    }
    
    if (uploadedBanner) {
      dealerData.profile.banner = uploadedBanner.url;
    }

    // FIXED: Remove businessType for private sellers
    if (dealerData.sellerType === 'private') {
      delete dealerData.businessType;
      console.log('Removed businessType for private seller in service');
    }
    
    console.log(`Sending ${sellerType} data to API with images:`, {
      requestId,
      sellerType,
      displayName,
      hasLogo: !!dealerData.profile.logo,
      hasBanner: !!dealerData.profile.banner,
      hasBusinessType: !!dealerData.businessType
    });
    
    // Create FormData for the request
    const formData = new FormData();
    
    formData.append('requestId', requestId);
    formData.append('dealerData', JSON.stringify(dealerData));
    
    // Add individual fields as fallback
    formData.append('sellerType', dealerData.sellerType);
    formData.append('businessName', dealerData.businessName);
    
    // FIXED: Only append businessType for dealerships
    if (dealerData.sellerType === 'dealership' && dealerData.businessType) {
      formData.append('businessType', dealerData.businessType);
    }
    
    formData.append('status', dealerData.status);
    
    if (dealerData.user) {
      formData.append('user', dealerData.user);
    }
    
    // Add JSON-serialized objects
    formData.append('contact', JSON.stringify(dealerData.contact));
    formData.append('location', JSON.stringify(dealerData.location));
    formData.append('verification', JSON.stringify(dealerData.verification));
    formData.append('profile', JSON.stringify(dealerData.profile));
    formData.append('subscription', JSON.stringify(dealerData.subscription));
    
    // Add private seller data if applicable
    if (dealerData.privateSeller) {
      formData.append('privateSeller', JSON.stringify(dealerData.privateSeller));
    }
    
    // Send the request
    const response = await http.post('/dealers', formData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      }
    });
    
    if (response.data.success) {
      console.log(`${sellerType} creation successful for request ${requestId}`);
      return response.data.data;
    } else {
      throw new Error(response.data.message || `Failed to create ${sellerType}`);
    }
  } catch (error) {
    console.error(`Error creating ${dealerData.sellerType || 'seller'}:`, error);
    throw error;
  }
},
  
  // Update an existing dealer with S3 image handling
// Complete replacement for updateDealer method in dealerService.js
async updateDealer(id, dealerData, logoFile = null, bannerFile = null, onProgress) {
  try {
    // Track request ID to prevent duplicates
    const requestId = Date.now().toString();
    console.log(`Starting dealer update request: ${requestId} for ID: ${id}`);
    
    let uploadedLogo = null;
    let uploadedBanner = null;
    
    // Upload new logo to S3 if provided
    if (logoFile) {
      console.log('Uploading new logo to S3...');
      onProgress?.({ phase: 'uploading-logo', progress: 0 });
      uploadedLogo = await imageService.uploadImage(
        logoFile,
        'dealers',
        (progress) => onProgress?.({ phase: 'uploading-logo', progress })
      );
      
      console.log('Logo upload result:', uploadedLogo);
    }
    
    // Upload new banner to S3 if provided
    if (bannerFile) {
      console.log('Uploading new banner to S3...');
      onProgress?.({ phase: 'uploading-banner', progress: 0 });
      uploadedBanner = await imageService.uploadImage(
        bannerFile,
        'dealers',
        (progress) => onProgress?.({ phase: 'uploading-banner', progress })
      );
      
      console.log('Banner upload result:', uploadedBanner);
    }
    
    onProgress?.({ phase: 'updating', progress: 0 });
    
    // IMPORTANT: Ensure profile field exists in dealerData
    if (!dealerData.profile) {
      dealerData.profile = {};
    }
    
    // Prepare dealer data with new S3 URLs
    if (uploadedLogo) {
      dealerData.profile.logo = uploadedLogo.url;
    }
    
    if (uploadedBanner) {
      dealerData.profile.banner = uploadedBanner.url;
    }
    
    console.log('Updating dealer with data:', {
      requestId,
      id,
      businessName: dealerData.businessName,
      hasLogo: !!dealerData.profile.logo,
      hasBanner: !!dealerData.profile.banner
    });
    
    // Create FormData for the request
    const formData = new FormData();
    
    // Add request ID to help server identify potential duplicates
    formData.append('requestId', requestId);
    
    // Add all dealer data as JSON string
    formData.append('dealerData', JSON.stringify(dealerData));
    
    // Add individual fields separately as a fallback
    formData.append('businessName', dealerData.businessName);
    formData.append('businessType', dealerData.businessType);
    formData.append('status', dealerData.status);
    
    // Add JSON-serialized objects for fallback processing
    formData.append('contact', JSON.stringify(dealerData.contact));
    formData.append('location', JSON.stringify(dealerData.location));
    formData.append('verification', JSON.stringify(dealerData.verification));
    formData.append('profile', JSON.stringify(dealerData.profile));
    formData.append('subscription', JSON.stringify(dealerData.subscription));
    
    // Send the request with proper method
    const response = await http.multipartPost(`/dealers/${id}`, formData, null, {
      method: 'PUT',
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress?.({ phase: 'updating', progress: percentCompleted });
      }
    });
    
    if (response.data.success) {
      console.log(`Dealer update successful for request ${requestId}`);
      return response.data.data;
    } else {
      throw new Error(response.data.message || `Failed to update dealer with ID: ${id}`);
    }
  } catch (error) {
    console.error(`Error updating dealer with ID ${id}:`, error);
    throw error;
  }
},
  
  // Delete a dealer
  async deleteDealer(id) {
    try {
      const response = await http.delete(`/dealers/${id}`);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || `Failed to delete dealer with ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error deleting dealer with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Update dealer subscription
  async updateSubscription(id, subscriptionData) {
    try {
      const validTiers = ['basic', 'standard', 'premium'];
      if (subscriptionData.plan && !validTiers.includes(subscriptionData.plan)) {
        throw new Error(`Invalid subscription plan: ${subscriptionData.plan}. Must be one of ${validTiers.join(', ')}`);
      }

      const response = await http.put(`/dealers/${id}/subscription`, subscriptionData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || `Failed to update subscription for dealer with ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error updating subscription for dealer with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Verify a dealer
  async verifyDealer(id) {
    try {
      const response = await http.put(`/dealers/${id}/verify`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || `Failed to verify dealer with ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error verifying dealer with ID ${id}:`, error);
      throw error;
    }
  },
  
  // Get dealer listings
  async getDealerListings(dealerId, page = 1, limit = 10) {
    try {
      if (!dealerId) {
        console.warn('No dealer ID provided for getDealerListings');
        return { listings: [], pagination: { currentPage: page, totalPages: 1, total: 0 } };
      }
      
      let id;
      if (typeof dealerId === 'object') {
        id = dealerId._id || dealerId.id;
      } else {
        id = dealerId;
      }
      
      if (!id) {
        console.warn('Invalid dealer ID format:', dealerId);
        return { listings: [], pagination: { currentPage: page, totalPages: 1, total: 0 } };
      }
      
      console.log(`Fetching dealer listings for dealer ID: ${id}`);
      
      try {
        const response = await http.get(`/listings/dealer/${id}`, {
          params: { page, limit }
        });
        
        if (response.data && response.data.success) {
          console.log(`Successfully fetched ${response.data.data?.length || 0} listings`);
          return {
            listings: response.data.data || [],
            pagination: response.data.pagination || {
              currentPage: page,
              totalPages: Math.ceil((response.data.total || 0) / limit),
              total: response.data.total || response.data.data?.length || 0
            }
          };
        } else {
          console.warn(`API returned success:false for dealer ${id}:`, response.data);
          return { listings: [], pagination: { currentPage: page, totalPages: 1, total: 0 } };
        }
      } catch (error) {
        console.log(`First attempt failed, trying alternative endpoint format`);
        try {
          const alternativeResponse = await http.get(`/api/listings/dealer/${id}`, {
            params: { page, limit }
          });
          
          if (alternativeResponse.data && alternativeResponse.data.success) {
            console.log(`Successfully fetched ${alternativeResponse.data.data?.length || 0} listings with alternative endpoint`);
            return {
              listings: alternativeResponse.data.data || [],
              pagination: alternativeResponse.data.pagination || {
                currentPage: page,
                totalPages: Math.ceil((alternativeResponse.data.total || 0) / limit),
                total: alternativeResponse.data.total || alternativeResponse.data.data?.length || 0
              }
            };
          }
        } catch (altError) {
          console.error(`Alternative endpoint also failed for dealer ${id}:`, altError);
        }
        
        console.error(`API request failed for dealer ${id}:`, error);
        throw error;
      }
    } catch (error) {
      console.error(`Error in getDealerListings for dealer ${dealerId}:`, error);
      return { listings: [], pagination: { currentPage: page, totalPages: 1, total: 0 } };
    }
  },
  
  // Get statistics for dashboard
  async getDashboardStats() {
    try {
      const response = await http.get('/dealers/stats');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch dealer statistics');
      }
    } catch (error) {
      console.error('Error fetching dealer statistics:', error);
      return {
        totalDealers: 0,
        activeDealers: 0,
        pendingVerification: 0,
        totalListings: 0,
        recentDealers: []
      };
    }
  },
  
  // Import dealers from CSV/JSON
  async importDealers(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await http.multipartPost('/dealers/import', formData);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to import dealers');
      }
    } catch (error) {
      console.error('Error importing dealers:', error);
      throw error;
    }
  },
  
  // Export dealers to CSV/JSON
  async exportDealers(format = 'csv', filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      
      if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.businessType && filters.businessType !== 'all') queryParams.append('businessType', filters.businessType);
      
      const response = await http.get(`/dealers/export?${queryParams.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dealers-export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      console.error('Error exporting dealers:', error);
      throw error;
    }
  },
  
  // Get dealer reviews
  async getDealerReviews(id, page = 1, limit = 10) {
    try {
      const response = await http.get(`/dealers/${id}/reviews?page=${page}&limit=${limit}`);
      
      if (response.data.success) {
        return {
          reviews: response.data.data || [],
          pagination: response.data.pagination || {
            currentPage: page,
            totalPages: 1,
            total: 0
          }
        };
      } else {
        throw new Error(response.data.message || `Failed to fetch reviews for dealer with ID: ${id}`);
      }
    } catch (error) {
      console.error(`Error fetching reviews for dealer with ID ${id}:`, error);
      return {
        reviews: [],
        pagination: {
          currentPage: page,
          totalPages: 1,
          total: 0
        }
      };
    }
  },
  
  // Submit a review for a dealer
  async submitReview(dealerId, reviewData) {
    try {
      const response = await http.post(`/dealers/${dealerId}/reviews`, reviewData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  }
};

export default dealerService;