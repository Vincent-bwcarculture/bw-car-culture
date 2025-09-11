// client/src/components/profile/ArticleManagement/services/articleService.js
// COMPLETE FIXED VERSION - All data structure and API integration issues resolved

const API_BASE_URL = 'https://bw-car-culture-api.vercel.app/api';

class ArticleApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.endpoint = `${this.baseURL}/news`;
  }

  /**
   * Get auth headers with JWT token
   * @returns {Object} Headers with authorization
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
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
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Get simple auth headers (no content-type)
   */
  getSimpleAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  /**
   * Get user info from localStorage
   */
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      console.error('Error parsing user data:', error);
      return {};
    }
  }

  /**
   * Get user role
   */
  getUserRole() {
    const user = this.getUser();
    return user.role || 'user';
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
    return user.role === 'journalist' || 
           (user.additionalRoles && user.additionalRoles.includes('journalist'));
  }

  /**
   * Check if user can publish directly
   */
  canPublishDirectly() {
    return this.isAdmin(); // Only admins can publish directly now
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
      const params = new URLSearchParams({
        page: filters.page || 1,
        limit: filters.limit || 100,
        ...filters
      });

      const response = await fetch(`${this.endpoint}?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`Loaded ${data.data?.length || 0} articles (admin view)`);
        return data.data || [];
      } else {
        throw new Error(data.message || 'Failed to fetch articles');
      }
    } catch (error) {
      console.error('Error fetching all articles:', error);
      // Return empty array on error to prevent frontend crashes
      return [];
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

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: this.getFormDataHeaders(),
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Admin article created successfully:', data.data._id);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create article');
      }
    } catch (error) {
      console.error('Error creating admin article:', error);
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

        const response = await fetch(`${this.endpoint}/${articleId}`, {
          method: 'PUT',
          headers: this.getFormDataHeaders(),
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log('Admin article updated successfully');
          return data.data;
        } else {
          throw new Error(data.message || 'Failed to update article');
        }
      } else {
        // Use JSON for text-only updates
        const response = await fetch(`${this.endpoint}/${articleId}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(articleData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
          console.log('Admin article updated successfully');
          return data.data;
        } else {
          throw new Error(data.message || 'Failed to update article');
        }
      }
    } catch (error) {
      console.error('Error updating admin article:', error);
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

      const response = await fetch(`${this.endpoint}/${articleId}`, {
        method: 'DELETE',
        headers: this.getSimpleAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Admin article deleted successfully');
        return data;
      } else {
        throw new Error(data.message || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting admin article:', error);
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

      const response = await fetch(`${this.endpoint}/user/my-articles?${params}`, {
        method: 'GET',
        headers: this.getSimpleAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`Loaded ${data.data?.length || 0} user articles`);
        // FIXED: Return the articles array directly (not wrapped in object)
        return data.data || [];
      } else {
        throw new Error(data.message || 'Failed to fetch user articles');
      }
    } catch (error) {
      console.error('Error fetching user articles:', error);
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

      const response = await fetch(`${this.endpoint}/user`, {
        method: 'POST',
        headers: this.getFormDataHeaders(),
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('User article created successfully:', data.data._id);
        console.log('User permissions:', data.userPermissions);
        
        // Return enhanced data with permission info
        return {
          ...data.data,
          userPermissions: data.userPermissions,
          canPublish: data.userPermissions?.canPublish || false,
          actualStatus: data.data.status
        };
      } else {
        throw new Error(data.message || 'Failed to create article');
      }
    } catch (error) {
      console.error('Error creating user article:', error);
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

      const response = await fetch(`${this.endpoint}/user/${articleId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(articleData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('User article updated successfully');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update article');
      }
    } catch (error) {
      console.error('Error updating user article:', error);
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

      const response = await fetch(`${this.endpoint}/user/${articleId}`, {
        method: 'DELETE',
        headers: this.getSimpleAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('User article deleted successfully');
        return data;
      } else {
        throw new Error(data.message || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting user article:', error);
      throw error;
    }
  }

  // ========================================
  // ADMIN REVIEW ENDPOINTS
  // ========================================

  /**
   * Get pending articles for review (admin only)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Pending articles
   */
  async getPendingArticles(params = {}) {
    if (!this.isAdmin()) {
      throw new Error('Admin access required');
    }

    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10
      });

      const response = await fetch(`${this.endpoint}/pending?${queryParams}`, {
        method: 'GET',
        headers: this.getSimpleAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`Loaded ${data.data?.length || 0} pending articles`);
        return {
          articles: data.data || [],
          total: data.total,
          currentPage: data.currentPage,
          totalPages: data.totalPages
        };
      } else {
        throw new Error(data.message || 'Failed to fetch pending articles');
      }
    } catch (error) {
      console.error('Error fetching pending articles:', error);
      throw error;
    }
  }

  /**
   * Approve or reject pending article (admin only)
   * @param {string} articleId - Article ID
   * @param {string} action - 'approve' or 'reject'
   * @param {string} notes - Review notes
   * @returns {Promise<Object>} Review result
   */
  async reviewArticle(articleId, action, notes = '') {
    if (!this.isAdmin()) {
      throw new Error('Admin access required');
    }

    try {
      console.log(`Reviewing article ${articleId}: ${action}`);

      const response = await fetch(`${this.endpoint}/${articleId}/review`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ action, notes })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`Article ${action}d successfully`);
        return data.data;
      } else {
        throw new Error(data.message || `Failed to ${action} article`);
      }
    } catch (error) {
      console.error(`Error ${action}ing article:`, error);
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
      const response = await fetch(`${this.endpoint}/${articleId}`, {
        method: 'GET',
        headers: this.getSimpleAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch article');
      }
    } catch (error) {
      console.error('Error fetching article:', error);
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
}

// Export singleton instance
export const articleApiService = new ArticleApiService();
export default articleApiService;
