// client/src/components/profile/ArticleManagement/services/articleService.js
// FIXED VERSION - Uses main axios config to ensure requests are sent properly

import axios from '../../../../config/axios.js';

class ArticleApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app/api';
    this.endpoint = `${this.baseURL}/news`;
    
    // CRITICAL FIX: Use the main axios instance instead of creating a new one
    // This ensures all interceptors and configurations are applied
    this.axios = axios;
    
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    this.pendingRequests = {};
    
    // Store user reference - will be set by components using AuthContext
    this.currentUser = null;
  }

  // Set current user from AuthContext - SAME PATTERN as working components
  setCurrentUser(user) {
    this.currentUser = user;
    console.log('Article service user set:', user?.role, 'ID:', user?.id);
  }

  /**
   * Get auth headers with JWT token
   * @returns {Object} Headers with authorization
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('ArticleService: No auth token found in localStorage');
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get auth headers for FormData (multipart/form-data)
   * @returns {Object} Headers with authorization (no content-type for FormData)
   */
  getFormDataHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('ArticleService: No auth token found for FormData');
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Get simple auth headers (no content-type)
   */
  getSimpleAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('ArticleService: No auth token found for simple headers');
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Get user info - USES AUTHCONTEXT USER (not localStorage)
   */
  getUser() {
    return this.currentUser || null;
  }

  /**
   * Get user role
   */
  getUserRole() {
    const user = this.getUser();
    return user?.role || 'user';
  }

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.getUserRole() === 'admin';
  }

  /**
   * Check if user is journalist
   */
  isJournalist() {
    const user = this.getUser();
    return user?.role === 'journalist' || 
           (user?.additionalRoles && user.additionalRoles.includes('journalist'));
  }

  /**
   * Check if user can publish directly
   */
  canPublishDirectly() {
    return this.isAdmin(); // Only admins can publish directly now
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('ArticleService: Cache cleared');
  }

  /**
   * DEBUGGING: Test API endpoints to identify issues
   */
  async debugApiEndpoints() {
    console.log('🔍 DEBUGGING API ENDPOINTS...');
    
    const endpoints = [
      '/api/news/user',
      '/api/news',
      '/api/analytics/social-stats',
      '/api/auth/me'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing endpoint: ${endpoint}`);
        
        const response = await this.axios.get(endpoint, {
          timeout: 5000,
          validateStatus: () => true // Accept all status codes
        });
        
        console.log(`✅ ${endpoint}: Status ${response.status}`);
        console.log(`Response type: ${typeof response.data}`);
        console.log(`Is HTML: ${typeof response.data === 'string' && response.data.includes('<!DOCTYPE')}`);
        
      } catch (error) {
        console.error(`❌ ${endpoint}: ${error.message}`);
      }
    }
  }

  /**
   * FIXED: Safe social stats fetching with comprehensive error handling
   */
  async getSocialStats() {
    try {
      const response = await this.axios.get('/api/analytics/social-stats', {
        timeout: 10000, // 10 second timeout
        validateStatus: function (status) {
          return status === 200;
        }
      });

      if (!response.data || typeof response.data !== 'object') {
        console.warn('Social stats: Invalid response format, using defaults');
        return this.getDefaultSocialStats();
      }

      if (response.data.success) {
        return response.data.data || this.getDefaultSocialStats();
      } else {
        console.warn('Social stats: API returned success=false, using defaults');
        return this.getDefaultSocialStats();
      }
    } catch (error) {
      console.warn('Social stats fetch failed, using defaults:', error.message);
      return this.getDefaultSocialStats();
    }
  }

  /**
   * FIXED: Provide default social stats to prevent errors
   */
  getDefaultSocialStats() {
    return {
      totalViews: 0,
      totalLikes: 0,
      totalShares: 0,
      totalComments: 0,
      engagementRate: 0,
      topPerformingArticles: []
    };
  }

  /**
   * FIXED: Enhanced FormData creation with validation
   * @param {Object} articleData - Article data with potential image files
   * @returns {FormData} - Properly formatted form data
   */
  createFormData(articleData) {
    try {
      const formData = new FormData();
      
      // Add text fields with validation
      const textFields = ['title', 'subtitle', 'content', 'category', 'status', 'authorId', 'authorName'];
      textFields.forEach(field => {
        if (articleData[field] !== undefined && articleData[field] !== null) {
          formData.append(field, String(articleData[field]));
        }
      });
      
      // Add arrays (tags) with proper serialization
      if (articleData.tags && Array.isArray(articleData.tags)) {
        formData.append('tags', JSON.stringify(articleData.tags));
      }
      
      // Add dates with proper formatting
      if (articleData.publishDate) {
        formData.append('publishDate', articleData.publishDate);
      }
      
      // Add boolean fields with explicit conversion
      const booleanFields = ['isPremium', 'earningsEnabled', 'trackEngagement', 'allowComments', 'allowSharing'];
      booleanFields.forEach(field => {
        if (articleData[field] !== undefined) {
          formData.append(field, Boolean(articleData[field]).toString());
        }
      });
      
      // FIXED: Add featured image with validation
      if (articleData.featuredImageFile) {
        if (articleData.featuredImageFile instanceof File) {
          formData.append('featuredImage', articleData.featuredImageFile);
          console.log('Added featured image:', articleData.featuredImageFile.name);
        } else {
          console.warn('Featured image is not a valid File object:', typeof articleData.featuredImageFile);
        }
      }
      
      // FIXED: Add gallery images with validation
      if (articleData.galleryImageFiles && Array.isArray(articleData.galleryImageFiles)) {
        articleData.galleryImageFiles.forEach((file, index) => {
          if (file instanceof File) {
            formData.append('gallery', file);
            console.log(`Added gallery image ${index + 1}:`, file.name);
          } else {
            console.warn(`Gallery image ${index + 1} is not a valid File object:`, typeof file);
          }
        });
      }
      
      // FIXED: Log FormData contents for debugging
      console.log('FormData created with fields:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`${key}:`, value);
        }
      }
      
      return formData;
    } catch (error) {
      console.error('Error creating FormData:', error);
      throw new Error('Failed to prepare article data for upload');
    }
  }

  // ========================================
  // SMART ROUTING METHODS (Choose endpoint based on user role)
  // ========================================

  /**
   * Get all user's articles (smart routing based on role)
   * FIXED: Returns array directly for frontend compatibility
   * @param {Object} filters - Filtering options
   * @returns {Promise<Array>} User's articles
   */
  async getUserArticles(filters = {}) {
    try {
      console.log('Getting user articles, role:', this.getUserRole());
      if (this.isAdmin()) {
        return await this.getAllArticles({...filters, status: filters.status || 'all'});
      } else {
        return await this.getMyOwnArticles(filters);
      }
    } catch (error) {
      console.error('Error in getUserArticles router:', error);
      return [];
    }
  }

  /**
   * FIXED: Create article (smart routing based on role) with FormData support
   * @param {Object} articleData - Article data (may include image files)
   * @returns {Promise<Object>} Created article
   */
  async createArticle(articleData) {
    try {
      console.log('🚀 Creating article via smart routing, role:', this.getUserRole());
      
      if (this.isAdmin()) {
        return await this.createAdminArticle(articleData);
      } else {
        return await this.createUserArticle(articleData);
      }
    } catch (error) {
      console.error('❌ Error in createArticle router:', error);
      throw error;
    }
  }

  /**
   * Update article (smart routing based on role)
   * @param {string} articleId - Article ID
   * @param {Object} articleData - Updated article data
   * @returns {Promise<Object>} Updated article
   */
  async updateArticle(articleId, articleData) {
    try {
      if (this.isAdmin()) {
        return await this.updateAdminArticle(articleId, articleData);
      } else {
        return await this.updateUserArticle(articleId, articleData);
      }
    } catch (error) {
      console.error('❌ Error in updateArticle router:', error);
      throw error;
    }
  }

  /**
   * Delete article (smart routing based on role)
   * @param {string} articleId - Article ID
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteArticle(articleId) {
    try {
      if (this.isAdmin()) {
        return await this.deleteAdminArticle(articleId);
      } else {
        return await this.deleteUserArticle(articleId);
      }
    } catch (error) {
      console.error('❌ Error in deleteArticle router:', error);
      throw error;
    }
  }

  // ========================================
  // ADMIN ENDPOINTS (Full permissions)
  // ========================================

  /**
   * Get all articles (admin only)
   * FIXED: Returns array directly for frontend compatibility
   * @param {Object} filters - Filtering options
   * @returns {Promise<Array>} All articles
   */
  async getAllArticles(filters = {}) {
    try {
      if (!this.isAdmin()) {
        throw new Error('Admin access required to view all articles');
      }

      const params = new URLSearchParams({
        page: filters.page || 1,
        limit: filters.limit || 100
      });

      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      const response = await this.axios.get(`/api/news?${params}`);

      if (response.data?.success) {
        console.log(`Loaded ${response.data.data?.length || 0} articles (admin view)`);
        return response.data.data || [];
      } else {
        throw new Error(response.data?.message || 'Failed to fetch articles');
      }
    } catch (error) {
      console.error('Error fetching all articles:', error.response?.data || error.message);
      
      if (error.response?.status === 403) {
        throw new Error('Admin access required');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw error;
    }
  }

  /**
   * Create article as admin
   * @param {Object} articleData - Article data (may include image files)
   * @returns {Promise<Object>} Created article
   */
  async createAdminArticle(articleData) {
    try {
      console.log('🚀 Creating article as admin:', articleData.title);
      
      if (!this.isAdmin()) {
        throw new Error('Admin access required to create articles');
      }
      
      const hasImages = articleData.featuredImageFile || 
                       (articleData.galleryImageFiles && articleData.galleryImageFiles.length > 0);
      
      if (hasImages) {
        const formData = this.createFormData(articleData);

        const response = await this.axios.post('/api/news', formData, {
          headers: this.getFormDataHeaders()
        });

        if (response.data?.success) {
          console.log('✅ Admin article created successfully with images:', response.data.data._id);
          return response.data.data;
        } else {
          throw new Error(response.data?.message || 'Failed to create article');
        }
      } else {
        const { featuredImageFile, galleryImageFiles, ...cleanData } = articleData;
        
        const response = await this.axios.post('/api/news', cleanData, {
          headers: this.getAuthHeaders()
        });

        if (response.data?.success) {
          console.log('✅ Admin article created successfully (text only):', response.data.data._id);
          return response.data.data;
        } else {
          throw new Error(response.data?.message || 'Failed to create article');
        }
      }
    } catch (error) {
      console.error('❌ Error creating admin article:', error.response?.data || error.message);
      throw error;
    }
  }

  // ========================================
  // USER & JOURNALIST ENDPOINTS (Permission-based)
  // ========================================

  /**
   * Get user's own articles
   * FIXED: Returns array directly for frontend compatibility
   * @param {Object} filters - Filtering options
   * @returns {Promise<Array>} User's articles (returns array directly)
   */
  async getMyOwnArticles(filters = {}) {
    try {
      const params = new URLSearchParams({
        page: filters.page || 1,
        limit: filters.limit || 100,
        status: filters.status || 'all'
      });

      console.log('🔍 Getting user articles from:', `/api/news/user/my-articles?${params}`);
      
      const response = await this.axios.get(`/api/news/user/my-articles?${params}`);

      if (response.data?.success) {
        console.log(`✅ Loaded ${response.data.data?.length || 0} user articles`);
        return response.data.data || [];
      } else {
        throw new Error(response.data?.message || 'Failed to fetch user articles');
      }
    } catch (error) {
      console.error('❌ Error fetching user articles:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * FIXED: Enhanced createUserArticle with proper axios usage and debugging
   * @param {Object} articleData - Article data (may include image files)
   * @returns {Promise<Object>} Created article
   */
  async createUserArticle(articleData) {
    try {
      console.log('\n🚀 ===== CREATING USER ARTICLE =====');
      console.log('📋 Article title:', articleData.title);
      console.log('📋 User role:', this.getUserRole());
      console.log('📋 Auth token present:', !!localStorage.getItem('token'));

      // Validate input data
      if (!articleData.title || !articleData.content || !articleData.category) {
        throw new Error('Title, content, and category are required');
      }

      // Check if we have any image files
      const hasImages = articleData.featuredImageFile || 
                       (articleData.galleryImageFiles && articleData.galleryImageFiles.length > 0);
      
      let response;
      const url = '/api/news/user';
      
      console.log('📤 Making request to:', url);
      console.log('📊 Request details:', {
        hasImages,
        featuredImage: !!articleData.featuredImageFile,
        galleryImages: articleData.galleryImageFiles?.length || 0,
        axios: !!this.axios,
        baseURL: this.axios.defaults?.baseURL
      });
      
      if (hasImages) {
        const formData = this.createFormData(articleData);
        console.log('📎 Sending FormData request...');
        
        response = await this.axios.post(url, formData, {
          headers: this.getFormDataHeaders(),
          timeout: 300000, // 5 minutes for large uploads
        });
      } else {
        const { featuredImageFile, galleryImageFiles, ...cleanData } = articleData;
        console.log('📝 Sending JSON request...');
        
        response = await this.axios.post(url, cleanData, {
          headers: this.getAuthHeaders()
        });
      }

      console.log('✅ Raw response status:', response.status);
      console.log('✅ Raw response data:', response.data);

      // Check if response is HTML (error page)
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
        throw new Error('Server returned HTML instead of JSON - API endpoint may not exist');
      }

      if (response.data?.success && response.data?.data) {
        console.log('✅ Article created successfully with ID:', response.data.data._id);
        console.log('🏁 ===== USER ARTICLE CREATION COMPLETED =====\n');
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Article creation failed');
      }
    } catch (error) {
      console.error('\n❌ ===== USER ARTICLE CREATION FAILED =====');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Full error:', error);
      console.error('🏁 ===== ERROR LOGGED =====\n');
      
      // Enhanced error handling
      if (error.response?.status === 404) {
        throw new Error('API endpoint not found. The /api/news/user route may not exist on the server.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('Permission denied. Check user role permissions.');
      } else if (error.message?.includes('HTML instead of JSON')) {
        throw new Error('Server configuration error. API endpoint returning HTML instead of JSON.');
      }
      
      throw error;
    }
  }

  /**
   * Update user's own article
   * @param {string} articleId - Article ID
   * @param {Object} articleData - Updated article data
   * @returns {Promise<Object>} Updated article
   */
  async updateUserArticle(articleId, articleData) {
    try {
      console.log('📝 Updating user article:', articleId);

      const hasImages = articleData.featuredImageFile || 
                       (articleData.galleryImageFiles && articleData.galleryImageFiles.length > 0);
      
      const url = `/api/news/user/${articleId}`;
      
      if (hasImages) {
        const formData = this.createFormData(articleData);
        
        const response = await this.axios.put(url, formData, {
          headers: this.getFormDataHeaders()
        });

        if (response.data?.success) {
          console.log('✅ User article updated successfully with images');
          return response.data.data;
        } else {
          throw new Error(response.data?.message || 'Failed to update article');
        }
      } else {
        const { featuredImageFile, galleryImageFiles, ...cleanData } = articleData;
        
        const response = await this.axios.put(url, cleanData, {
          headers: this.getAuthHeaders()
        });

        if (response.data?.success) {
          console.log('✅ User article updated successfully (text only)');
          return response.data.data;
        } else {
          throw new Error(response.data?.message || 'Failed to update article');
        }
      }
    } catch (error) {
      console.error('❌ Error updating user article:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete user's own article
   * @param {string} articleId - Article ID to delete
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteUserArticle(articleId) {
    try {
      console.log('🗑️ Deleting user article:', articleId);
      
      const response = await this.axios.delete(`/api/news/user/${articleId}`);

      if (response.data?.success) {
        console.log('✅ User article deleted successfully');
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to delete article');
      }
    } catch (error) {
      console.error('❌ Error deleting user article:', error.response?.data || error.message);
      throw error;
    }
  }

  // ========================================
  // PLACEHOLDER METHODS (To be implemented)
  // ========================================

  async updateAdminArticle(articleId, articleData) {
    throw new Error('Admin article update not yet implemented');
  }

  async deleteAdminArticle(articleId) {
    throw new Error('Admin article delete not yet implemented');
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get user's status options based on role
   * @returns {Array} Available status options
   */
  getStatusOptions() {
    if (this.isAdmin()) {
      return [
        { value: 'draft', label: 'Draft' },
        { value: 'published', label: 'Published' },
        { value: 'pending', label: 'Pending Review' },
        { value: 'archived', label: 'Archived' }
      ];
    } else {
      return [
        { value: 'draft', label: 'Save as Draft' },
        { value: 'pending', label: 'Submit for Review' }
      ];
    }
  }

  /**
   * Get user permissions info
   * @returns {Object} User permissions
   */
  getUserPermissions() {
    return {
      canPublish: this.canPublishDirectly(),
      canReview: this.isAdmin(),
      role: this.getUserRole(),
      isAdmin: this.isAdmin(),
      isJournalist: this.isJournalist()
    };
  }

  // Error handling
  handleError(message, error) {
    console.error(message, error.response?.data || error.message);
    if (error.response?.status === 429) {
      console.warn('Rate limited. Please try again later.');
      throw new Error('Too many requests. Please try again later.');
    }
    throw error;
  }

  // Cleanup
  destroy() {
    this.cache.clear();
  }
}

// Create and export the service instance
export const articleApiService = new ArticleApiService();
export default articleApiService;
