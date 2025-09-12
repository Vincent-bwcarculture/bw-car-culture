// client/src/components/profile/ArticleManagement/services/articleService.js
// UPDATED VERSION - Enhanced with multiple image support while preserving all existing functionality

import axios from '../../../../config/axios.js';

class ArticleApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app/api';
    this.endpoint = `${this.baseURL}/news`;
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: 300000 // 5 mins timeout
    });
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
   * ENHANCED: Create proper FormData with support for multiple images
   * @param {Object} articleData - Article data with potential image files
   * @returns {FormData} - Properly formatted form data
   */
  createFormData(articleData) {
    const formData = new FormData();

    // Add all non-file fields
    Object.keys(articleData).forEach(key => {
      if (key === 'featuredImageFile' || key === 'galleryImageFiles') return; // Skip file fields
      
      const value = articleData[key];
      if (value !== undefined && value !== null) {
        if (key === 'tags' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      }
    });

    // Add featured image if present
    if (articleData.featuredImageFile) {
      formData.append('featuredImage', articleData.featuredImageFile);
      console.log('Added featured image to FormData:', articleData.featuredImageFile.name);
    }

    // NEW: Add gallery images if present (using 'gallery' field name to match backend)
    if (articleData.galleryImageFiles && articleData.galleryImageFiles.length > 0) {
      articleData.galleryImageFiles.forEach((file, index) => {
        formData.append('gallery', file); // Backend expects 'gallery' field name
        console.log(`Added gallery image ${index + 1} to FormData:`, file.name);
      });
    }

    console.log('FormData created with fields:', [...formData.keys()]);
    return formData;
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
        // Admin can see all articles with any status
        return await this.getAllArticles({...filters, status: filters.status || 'all'});
      } else {
        // Regular users and journalists see only their own articles
        return await this.getMyOwnArticles(filters);
      }
    } catch (error) {
      console.error('Error in getUserArticles router:', error);
      // Return empty array on error to prevent frontend crashes
      return [];
    }
  }

  /**
   * ENHANCED: Create article (smart routing based on role) with FormData support
   * @param {Object} articleData - Article data (may include image files)
   * @returns {Promise<Object>} Created article
   */
  async createArticle(articleData) {
    try {
      if (this.isAdmin()) {
        // Admin uses admin endpoint for full permissions
        return await this.createAdminArticle(articleData);
      } else {
        // Users/journalists use user endpoint with permission handling
        return await this.createUserArticle(articleData);
      }
    } catch (error) {
      console.error('Error in createArticle router:', error);
      throw error;
    }
  }

  /**
   * ENHANCED: Update article (smart routing based on role) with FormData support
   * @param {string} articleId - Article ID
   * @param {Object} articleData - Updated article data (may include image files)
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
      console.error('Error in updateArticle router:', error);
      throw error;
    }
  }

  /**
   * Delete article (smart routing based on role)
   * @param {string} articleId - Article ID
   * @returns {Promise<Object>} Success response
   */
  async deleteArticle(articleId) {
    try {
      if (this.isAdmin()) {
        return await this.deleteAdminArticle(articleId);
      } else {
        return await this.deleteUserArticle(articleId);
      }
    } catch (error) {
      console.error('Error in deleteArticle router:', error);
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

      // Add status filter if provided
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      const response = await this.axios.get(`/news?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (response.data?.success) {
        console.log(`Loaded ${response.data.data?.length || 0} articles (admin view)`);
        return response.data.data || [];
      } else {
        throw new Error(response.data?.message || 'Failed to fetch articles');
      }
    } catch (error) {
      console.error('Error fetching all articles:', error.response?.data || error.message);
      
      // Enhanced error handling
      if (error.response?.status === 403) {
        throw new Error('Admin access required');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw error;
    }
  }

  /**
   * ENHANCED: Create article as admin with FormData support for multiple images
   * @param {Object} articleData - Article data (may include image files)
   * @returns {Promise<Object>} Created article
   */
  async createAdminArticle(articleData) {
    try {
      console.log('Creating article as admin:', articleData.title);
      
      if (!this.isAdmin()) {
        throw new Error('Admin access required to create articles');
      }
      
      // Check if we have any image files
      const hasImages = articleData.featuredImageFile || 
                       (articleData.galleryImageFiles && articleData.galleryImageFiles.length > 0);
      
      if (hasImages) {
        // Use FormData for image upload
        const formData = this.createFormData(articleData);

        const response = await this.axios.post('/news', formData, {
          headers: this.getFormDataHeaders()
        });

        if (response.data?.success) {
          console.log('Admin article created successfully with images:', response.data.data._id);
          return response.data.data;
        } else {
          throw new Error(response.data?.message || 'Failed to create article');
        }
      } else {
        // Use JSON for text-only articles
        const { featuredImageFile, galleryImageFiles, ...cleanData } = articleData;
        
        const response = await this.axios.post('/news', cleanData, {
          headers: this.getAuthHeaders()
        });

        if (response.data?.success) {
          console.log('Admin article created successfully (text only):', response.data.data._id);
          return response.data.data;
        } else {
          throw new Error(response.data?.message || 'Failed to create article');
        }
      }
    } catch (error) {
      console.error('Error creating admin article:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * ENHANCED: Update article as admin with FormData support for multiple images
   * @param {string} articleId - Article ID
   * @param {Object} articleData - Updated article data (may include image files)
   * @returns {Promise<Object>} Updated article
   */
  async updateAdminArticle(articleId, articleData) {
    try {
      console.log('Updating article as admin:', articleId);
      
      if (!this.isAdmin()) {
        throw new Error('Admin access required to update articles');
      }
      
      // Check if we have any new image files
      const hasImages = articleData.featuredImageFile || 
                       (articleData.galleryImageFiles && articleData.galleryImageFiles.length > 0);
      
      if (hasImages) {
        // Use FormData for image upload
        const formData = this.createFormData(articleData);

        const response = await this.axios.put(`/news/${articleId}`, formData, {
          headers: this.getFormDataHeaders()
        });

        if (response.data?.success) {
          console.log('Admin article updated successfully with images');
          return response.data.data;
        } else {
          throw new Error(response.data?.message || 'Failed to update article');
        }
      } else {
        // Use JSON for text-only updates
        const { featuredImageFile, galleryImageFiles, ...cleanData } = articleData;
        
        const response = await this.axios.put(`/news/${articleId}`, cleanData, {
          headers: this.getAuthHeaders()
        });

        if (response.data?.success) {
          console.log('Admin article updated successfully (text only)');
          return response.data.data;
        } else {
          throw new Error(response.data?.message || 'Failed to update article');
        }
      }
    } catch (error) {
      console.error('Error updating admin article:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete article as admin
   * @param {string} articleId - Article ID
   * @returns {Promise<Object>} Success response
   */
  async deleteAdminArticle(articleId) {
    try {
      console.log('Deleting article as admin:', articleId);

      if (!this.isAdmin()) {
        throw new Error('Admin access required to delete articles');
      }

      const response = await this.axios.delete(`/news/${articleId}`, {
        headers: this.getSimpleAuthHeaders()
      });

      if (response.data?.success) {
        console.log('Admin article deleted successfully');
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting admin article:', error.response?.data || error.message);
      
      // Enhanced error handling
      if (error.response?.status === 403) {
        throw new Error('Admin access required');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
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

      const response = await this.axios.get(`/news/user/my-articles?${params}`, {
        headers: this.getSimpleAuthHeaders()
      });

      if (response.data?.success) {
        console.log(`Loaded ${response.data.data?.length || 0} user articles`);
        // FIXED: Return the articles array directly (not wrapped in object)
        return response.data.data || [];
      } else {
        throw new Error(response.data?.message || 'Failed to fetch user articles');
      }
    } catch (error) {
      console.error('Error fetching user articles:', error.response?.data || error.message);
      // Return empty array on error to prevent frontend crashes
      return [];
    }
  }

  /**
   * ENHANCED: Create article as user/journalist with FormData support for multiple images
   * @param {Object} articleData - Article data (may include image files)
   * @returns {Promise<Object>} Created article
   */
  async createUserArticle(articleData) {
    try {
      console.log('Creating article as user/journalist:', articleData.title);
      
      // Check if we have any image files
      const hasImages = articleData.featuredImageFile || 
                       (articleData.galleryImageFiles && articleData.galleryImageFiles.length > 0);
      
      if (hasImages) {
        // Use FormData for image upload
        const formData = this.createFormData(articleData);

        console.log('Uploading article with images via FormData...');
        console.log('Featured image:', articleData.featuredImageFile ? articleData.featuredImageFile.name : 'None');
        console.log('Gallery images:', articleData.galleryImageFiles ? articleData.galleryImageFiles.length : 0);

        const response = await this.axios.post('/news/user', formData, {
          headers: this.getFormDataHeaders()
        });

        if (response.data?.success) {
          console.log('User article created successfully with images:', response.data.data._id);
          console.log('User permissions:', response.data.userPermissions);
          
          // Return enhanced data with permission info
          return {
            ...response.data.data,
            userPermissions: response.data.userPermissions,
            canPublish: response.data.userPermissions?.canPublish || false,
            actualStatus: response.data.data.status
          };
        } else {
          throw new Error(response.data?.message || 'Failed to create article');
        }
      } else {
        // Use JSON for text-only articles
        const { featuredImageFile, galleryImageFiles, ...cleanData } = articleData;
        
        console.log('Creating article without images via JSON...');

        const response = await this.axios.post('/news/user', cleanData, {
          headers: this.getAuthHeaders()
        });

        if (response.data?.success) {
          console.log('User article created successfully (text only):', response.data.data._id);
          console.log('User permissions:', response.data.userPermissions);
          
          return {
            ...response.data.data,
            userPermissions: response.data.userPermissions,
            canPublish: response.data.userPermissions?.canPublish || false,
            actualStatus: response.data.data.status
          };
        } else {
          throw new Error(response.data?.message || 'Failed to create article');
        }
      }
    } catch (error) {
      console.error('Error creating user article:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * ENHANCED: Update user's own article with FormData support for multiple images
   * @param {string} articleId - Article ID
   * @param {Object} articleData - Updated article data (may include image files)
   * @returns {Promise<Object>} Updated article
   */
  async updateUserArticle(articleId, articleData) {
    try {
      console.log('Updating user article:', articleId);

      // Check if we have any new image files
      const hasImages = articleData.featuredImageFile || 
                       (articleData.galleryImageFiles && articleData.galleryImageFiles.length > 0);
      
      if (hasImages) {
        // Use FormData for image upload
        const formData = this.createFormData(articleData);

        console.log('Updating article with images via FormData...');
        console.log('Featured image:', articleData.featuredImageFile ? articleData.featuredImageFile.name : 'None');
        console.log('Gallery images:', articleData.galleryImageFiles ? articleData.galleryImageFiles.length : 0);

        const response = await this.axios.put(`/news/user/${articleId}`, formData, {
          headers: this.getFormDataHeaders()
        });

        if (response.data?.success) {
          console.log('User article updated successfully with images');
          return response.data.data;
        } else {
          throw new Error(response.data?.message || 'Failed to update article');
        }
      } else {
        // Use JSON for text-only updates
        const { featuredImageFile, galleryImageFiles, ...cleanData } = articleData;
        
        console.log('Updating article without images via JSON...');

        const response = await this.axios.put(`/news/user/${articleId}`, cleanData, {
          headers: this.getAuthHeaders()
        });

        if (response.data?.success) {
          console.log('User article updated successfully (text only)');
          return response.data.data;
        } else {
          throw new Error(response.data?.message || 'Failed to update article');
        }
      }
    } catch (error) {
      console.error('Error updating user article:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete user's own article
   * @param {string} articleId - Article ID
   * @returns {Promise<Object>} Success response
   */
  async deleteUserArticle(articleId) {
    try {
      console.log('Deleting user article:', articleId);

      const response = await this.axios.delete(`/news/user/${articleId}`, {
        headers: this.getSimpleAuthHeaders()
      });

      if (response.data?.success) {
        console.log('User article deleted successfully');
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting user article:', error.response?.data || error.message);
      throw error;
    }
  }

  // ========================================
  // EXISTING METHODS (PRESERVED)
  // ========================================

  /**
   * Get pending articles for admin review
   * @param {Object} params - Query parameters  
   * @returns {Promise<Object>} Pending articles response
   */
  async getPendingArticles(params = {}) {
    try {
      console.log('Getting pending articles for admin review...');
      
      if (!this.isAdmin()) {
        throw new Error('Admin access required to view pending articles');
      }

      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10
      });

      const response = await this.axios.get(`/news/pending?${queryParams}`, {
        headers: this.getSimpleAuthHeaders()
      });

      if (response.data?.success) {
        console.log(`Found ${response.data.data?.length || 0} pending articles`);
        return {
          articles: response.data.data || [],
          total: response.data.total,
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages
        };
      } else {
        throw new Error(response.data?.message || 'Failed to fetch pending articles');
      }
    } catch (error) {
      console.error('Error fetching pending articles:', error.response?.data || error.message);
      
      // Enhanced error handling
      if (error.response?.status === 403) {
        throw new Error('Admin access required');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw error;
    }
  }

  /**
   * Review article (approve/reject) - Admin only
   * @param {string} articleId - Article ID
   * @param {string} action - 'approve' or 'reject'
   * @param {string} notes - Review notes
   * @returns {Promise<Object>} Review response
   */
  async reviewArticle(articleId, action, notes = '') {
    try {
      console.log(`Reviewing article ${articleId}: ${action}`);
      
      if (!this.isAdmin()) {
        throw new Error('Admin access required to review articles');
      }

      if (!action || !['approve', 'reject'].includes(action)) {
        throw new Error('Invalid review action. Must be "approve" or "reject"');
      }

      const response = await this.axios.put(`/news/${articleId}/review`, {
        action,
        notes
      }, {
        headers: this.getAuthHeaders()
      });

      if (response.data?.success) {
        console.log(`Article ${action}ed successfully`);
        return response.data.data;
      } else {
        throw new Error(response.data?.message || `Failed to ${action} article`);
      }
    } catch (error) {
      console.error(`Error ${action}ing article:`, error.response?.data || error.message);
      
      // Enhanced error handling
      if (error.response?.status === 403) {
        throw new Error('Admin access required');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw error;
    }
  }

  /**
   * Get article by ID (public access)
   * @param {string} articleId - Article ID
   * @returns {Promise<Object>} Article data
   */
  async getArticle(articleId) {
    try {
      const response = await this.axios.get(`/news/${articleId}`, {
        headers: this.getSimpleAuthHeaders()
      });

      if (response.data?.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to fetch article');
      }
    } catch (error) {
      console.error('Error fetching article:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get article statistics (backward compatibility)
   * FIXED: Handles both admin and user article fetching correctly
   * @returns {Promise<Object>} Article statistics
   */
  async getArticleStats() {
    try {
      let articles = [];
      
      if (this.isAdmin()) {
        articles = await this.getAllArticles();
      } else {
        articles = await this.getMyOwnArticles();
      }
      
      // Ensure articles is an array
      if (!Array.isArray(articles)) {
        console.warn('Articles is not an array, using empty array:', articles);
        articles = [];
      }
      
      const publishedArticles = articles.filter(article => article.status === 'published');
      const draftArticles = articles.filter(article => article.status === 'draft');
      const pendingArticles = articles.filter(article => article.status === 'pending');
      
      // Calculate real totals from API data
      const totalViews = articles.reduce((sum, article) => sum + (article.metadata?.views || 0), 0);
      const totalLikes = articles.reduce((sum, article) => sum + (article.metadata?.likes || 0), 0);
      const totalComments = articles.reduce((sum, article) => sum + (article.metadata?.comments || 0), 0);
      const totalShares = articles.reduce((sum, article) => sum + (article.metadata?.shares || 0), 0);
      
      // Calculate this month's articles
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const thisMonthArticles = articles.filter(article => {
        if (!article.publishDate && !article.createdAt) return false;
        const checkDate = new Date(article.publishDate || article.createdAt);
        return checkDate >= thisMonth;
      });

      return {
        totalArticles: articles.length,
        publishedArticles: publishedArticles.length,
        draftArticles: draftArticles.length,
        pendingArticles: pendingArticles.length,
        totalViews,
        totalShares,
        totalLikes,
        totalComments,
        thisMonthArticles: thisMonthArticles.length,
        // For now, earnings are calculated client-side
        // In the future, these should come from the backend
        totalEarnings: 0,
        thisMonthEarnings: 0,
        pendingEarnings: 0
      };
    } catch (error) {
      console.error('Error getting article stats:', error);
      // Return default stats to prevent crashes
      return {
        totalArticles: 0,
        publishedArticles: 0,
        draftArticles: 0,
        pendingArticles: 0,
        totalViews: 0,
        totalShares: 0,
        totalLikes: 0,
        totalComments: 0,
        thisMonthArticles: 0,
        totalEarnings: 0,
        thisMonthEarnings: 0,
        pendingEarnings: 0
      };
    }
  }

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
      // Both journalists and regular users need approval now
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
      canPublish: this.canPublishDirectly(), // Only admins can publish directly
      canReview: this.isAdmin(),
      role: this.getUserRole(),
      isAdmin: this.isAdmin(),
      isJournalist: this.isJournalist()
    };
  }

  // Error handling - SAME as listingService
  handleError(message, error) {
    console.error(message, error.response?.data || error.message);
    if (error.response?.status === 429) {
      console.warn('Rate limited. Please try again later.');
      throw new Error('Too many requests. Please try again later.');
    }
    throw error;
  }

  // Cleanup - SAME as listingService
  destroy() {
    this.cache.clear();
  }
}

// Export singleton instance
export const articleApiService = new ArticleApiService();
export default articleApiService;
