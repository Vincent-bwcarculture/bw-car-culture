// client/src/components/profile/ArticleManagement/services/articleService.js
// COMPLETE VERSION - AuthContext integration with all methods preserved and enhanced

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
   * Create article (smart routing based on role)
   * @param {Object} articleData - Article data
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
   * Create article as admin (full permissions)
   * @param {Object} articleData - Article data
   * @returns {Promise<Object>} Created article
   */
  async createAdminArticle(articleData) {
    try {
      console.log('Creating article as admin:', articleData.title);
      
      if (!this.isAdmin()) {
        throw new Error('Admin access required to create articles');
      }
      
      // Prepare FormData for image upload support
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', articleData.title);
      formData.append('content', articleData.content);
      formData.append('category', articleData.category);
      formData.append('status', articleData.status || 'draft');
      
      if (articleData.subtitle) {
        formData.append('subtitle', articleData.subtitle);
      }
      
      if (articleData.publishDate) {
        formData.append('publishDate', articleData.publishDate);
      }
      
      if (articleData.metaTitle) {
        formData.append('metaTitle', articleData.metaTitle);
      }
      
      if (articleData.metaDescription) {
        formData.append('metaDescription', articleData.metaDescription);
      }
      
      if (articleData.authorNotes) {
        formData.append('authorNotes', articleData.authorNotes);
      }
      
      // Boolean fields
      formData.append('isPremium', articleData.isPremium || false);
      formData.append('earningsEnabled', articleData.earningsEnabled !== false);
      formData.append('allowComments', articleData.allowComments !== false);
      formData.append('allowSharing', articleData.allowSharing !== false);
      
      // Tags array
      if (articleData.tags && articleData.tags.length > 0) {
        formData.append('tags', JSON.stringify(articleData.tags));
      }
      
      // Handle featured image upload
      if (articleData.featuredImageFile) {
        formData.append('featuredImage', articleData.featuredImageFile);
      }

      const response = await this.axios.post('/news', formData, {
        headers: this.getFormDataHeaders()
      });

      if (response.data?.success) {
        console.log('Admin article created successfully:', response.data.data._id);
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to create article');
      }
    } catch (error) {
      console.error('Error creating admin article:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update article as admin
   * @param {string} articleId - Article ID
   * @param {Object} articleData - Updated article data
   * @returns {Promise<Object>} Updated article
   */
  async updateAdminArticle(articleId, articleData) {
    try {
      console.log('Updating article as admin:', articleId);
      
      if (!this.isAdmin()) {
        throw new Error('Admin access required to update articles');
      }
      
      // For updates, use JSON instead of FormData for simplicity
      // unless there's a new image to upload
      if (articleData.featuredImageFile) {
        // Use FormData if there's a new image
        const formData = new FormData();
        
        Object.keys(articleData).forEach(key => {
          if (key === 'featuredImageFile') {
            formData.append('featuredImage', articleData[key]);
          } else if (key === 'tags' && Array.isArray(articleData[key])) {
            formData.append(key, JSON.stringify(articleData[key]));
          } else if (articleData[key] !== undefined) {
            formData.append(key, articleData[key]);
          }
        });

        const response = await this.axios.put(`/news/${articleId}`, formData, {
          headers: this.getFormDataHeaders()
        });

        if (response.data?.success) {
          console.log('Admin article updated successfully');
          return response.data.data;
        } else {
          throw new Error(response.data?.message || 'Failed to update article');
        }
      } else {
        // Use JSON for text-only updates
        const response = await this.axios.put(`/news/${articleId}`, articleData, {
          headers: this.getAuthHeaders()
        });

        if (response.data?.success) {
          console.log('Admin article updated successfully');
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

  /**
   * Get admin article statistics
   * @returns {Promise<Object>} Article statistics
   */
  async getAdminStats() {
    try {
      console.log('Getting admin article statistics...');
      
      if (!this.isAdmin()) {
        throw new Error('Admin access required for statistics');
      }

      const response = await this.axios.get('/news/admin/stats', {
        headers: this.getAuthHeaders()
      });

      if (response.data?.success) {
        console.log('Admin stats loaded successfully');
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to fetch admin statistics');
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error.response?.data || error.message);
      
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
   * Create article as user/journalist (permissions handled automatically)
   * @param {Object} articleData - Article data
   * @returns {Promise<Object>} Created article
   */
  async createUserArticle(articleData) {
    try {
      console.log('Creating article as user/journalist:', articleData.title);
      
      // Prepare FormData for image upload support
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', articleData.title);
      formData.append('content', articleData.content);
      formData.append('category', articleData.category);
      formData.append('status', articleData.status || 'draft');
      
      if (articleData.subtitle) {
        formData.append('subtitle', articleData.subtitle);
      }
      
      if (articleData.publishDate) {
        formData.append('publishDate', articleData.publishDate);
      }
      
      if (articleData.metaTitle) {
        formData.append('metaTitle', articleData.metaTitle);
      }
      
      if (articleData.metaDescription) {
        formData.append('metaDescription', articleData.metaDescription);
      }
      
      if (articleData.authorNotes) {
        formData.append('authorNotes', articleData.authorNotes);
      }
      
      // Boolean fields
      formData.append('isPremium', articleData.isPremium || false);
      formData.append('earningsEnabled', articleData.earningsEnabled !== false);
      formData.append('allowComments', articleData.allowComments !== false);
      formData.append('allowSharing', articleData.allowSharing !== false);
      
      // Tags array
      if (articleData.tags && articleData.tags.length > 0) {
        formData.append('tags', JSON.stringify(articleData.tags));
      }
      
      // Handle featured image upload
      if (articleData.featuredImageFile) {
        formData.append('featuredImage', articleData.featuredImageFile);
      }

      const response = await this.axios.post('/news/user', formData, {
        headers: this.getFormDataHeaders()
      });

      if (response.data?.success) {
        console.log('User article created successfully:', response.data.data._id);
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
    } catch (error) {
      console.error('Error creating user article:', error.response?.data || error.message);
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
      console.log('Updating user article:', articleId);

      const response = await this.axios.put(`/news/user/${articleId}`, articleData, {
        headers: this.getAuthHeaders()
      });

      if (response.data?.success) {
        console.log('User article updated successfully');
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to update article');
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
  // PUBLIC & UTILITY METHODS
  // ========================================

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

  /**
   * Test admin access - verifies authentication and permissions
   * @returns {Promise<Object>} Test result
   */
  async testAdminAccess() {
    try {
      console.log('Testing admin access...');
      
      const user = this.getUser();
      if (!user) {
        throw new Error('No user found');
      }

      if (!this.isAdmin()) {
        throw new Error(`User role '${user.role}' is not admin`);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Test admin stats endpoint (lightweight test)
      console.log('Testing admin stats endpoint...');
      const response = await this.axios.get('/news/admin/stats', {
        headers: this.getAuthHeaders()
      });

      if (response.data?.success) {
        console.log('✅ Admin access test passed');
        return {
          success: true,
          message: 'Admin access verified',
          userRole: user.role,
          userId: user.id
        };
      } else {
        throw new Error(response.data?.message || 'Admin stats test failed');
      }

    } catch (error) {
      console.error('❌ Admin access test failed:', error);
      
      let errorMessage = 'Admin access test failed';
      if (error.response?.status === 403) {
        errorMessage = 'Access denied: Admin role required';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed: Please log in again';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
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
