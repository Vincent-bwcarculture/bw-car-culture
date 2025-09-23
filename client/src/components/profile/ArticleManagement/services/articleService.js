// client/src/components/profile/ArticleManagement/services/articleService.js
// COMPLETE FIXED VERSION - Based on working dealer service patterns

import axios from 'axios';

class ArticleApiService {
  constructor() {
    // FIXED: Match the exact URL pattern that works for dealers
    this.baseURL = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app/api';
    
    // FIXED: Create dedicated axios instance following dealer service pattern
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: 300000, // 5 minutes
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    this.setupAxiosInterceptors();
    
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000;
    this.pendingRequests = {};
    this.currentUser = null;
    
    // Debug configuration
    console.log('🔧 ArticleService initialized:', {
      baseURL: this.baseURL,
      axiosBaseURL: this.axios.defaults.baseURL,
      environment: process.env.NODE_ENV
    });
  }

  /**
   * Setup axios interceptors - COPIED from working dealer service pattern
   */
  setupAxiosInterceptors() {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        // Add auth token (same as dealers)
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // For FormData, remove Content-Type (same as dealers)
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        
        // Debug logging (same as dealers)
        console.log('📤 ArticleService Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          fullURL: `${config.baseURL}${config.url}`,
          hasAuth: !!config.headers.Authorization,
          contentType: config.headers['Content-Type'],
          dataType: config.data ? (config.data instanceof FormData ? 'FormData' : typeof config.data) : 'none'
        });
        
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor (same as dealers)
    this.axios.interceptors.response.use(
      (response) => {
        console.log('✅ ArticleService Response:', {
          status: response.status,
          url: response.config.url,
          dataType: typeof response.data,
          isSuccess: response.data?.success,
          hasData: !!response.data?.data
        });
        return response;
      },
      (error) => {
        console.error('❌ ArticleService Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          responseData: error.response?.data
        });
        
        // Auto-redirect on auth failure (same as dealers)
        if (error.response?.status === 401) {
          console.warn('🔐 Authentication failed - redirecting to login');
          localStorage.removeItem('token');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set current user (same pattern as dealers)
   */
  setCurrentUser(user) {
    this.currentUser = user;
    console.log('👤 ArticleService user set:', {
      role: user?.role,
      id: user?.id,
      name: user?.name
    });
  }

  /**
   * User utility methods (same as dealers)
   */
  getUser() {
    return this.currentUser || null;
  }

  getUserRole() {
    const user = this.getUser();
    return user?.role || 'user';
  }

  isAdmin() {
    return this.getUserRole() === 'admin';
  }

  isJournalist() {
    const user = this.getUser();
    return user?.role === 'journalist' || 
           (user?.additionalRoles && user.additionalRoles.includes('journalist'));
  }

  canPublishDirectly() {
    return this.isAdmin();
  }

  /**
   * Enhanced FormData creation - COPIED from working dealer service pattern
   */
  createFormData(articleData) {
    try {
      const formData = new FormData();
      
      console.log('📋 Creating FormData from article data:', {
        title: articleData.title,
        hasContent: !!articleData.content,
        contentLength: articleData.content?.length || 0,
        hasFeaturedImage: !!articleData.featuredImageFile,
        galleryImagesCount: articleData.galleryImageFiles?.length || 0
      });
      
      // Add text fields (same as dealers)
      const textFields = [
        'title', 'subtitle', 'content', 'category', 'status', 
        'metaTitle', 'metaDescription', 'metaKeywords'
      ];
      
      textFields.forEach(field => {
        if (articleData[field] !== undefined && articleData[field] !== null) {
          const value = String(articleData[field]).trim();
          if (value) {
            formData.append(field, value);
            console.log(`📝 Added field ${field}:`, value.substring(0, 50) + (value.length > 50 ? '...' : ''));
          }
        }
      });
      
      // Add arrays and objects (same as dealers)
      if (articleData.tags && Array.isArray(articleData.tags)) {
        formData.append('tags', JSON.stringify(articleData.tags));
        console.log('📝 Added tags:', articleData.tags);
      }
      
      // Add dates
      if (articleData.publishDate) {
        formData.append('publishDate', articleData.publishDate);
        console.log('📝 Added publishDate:', articleData.publishDate);
      }
      
      // Add boolean fields
      const booleanFields = ['isPremium', 'earningsEnabled', 'allowComments', 'allowSharing'];
      booleanFields.forEach(field => {
        if (articleData[field] !== undefined) {
          formData.append(field, Boolean(articleData[field]).toString());
        }
      });
      
      // FIXED: Add images properly (following dealer image upload pattern)
      if (articleData.featuredImageFile && articleData.featuredImageFile instanceof File) {
        formData.append('featuredImageFile', articleData.featuredImageFile);
        console.log('🖼️ Added featured image:', {
          name: articleData.featuredImageFile.name,
          size: articleData.featuredImageFile.size,
          type: articleData.featuredImageFile.type
        });
      }
      
      // Add gallery images
      if (articleData.galleryImageFiles && Array.isArray(articleData.galleryImageFiles)) {
        articleData.galleryImageFiles.forEach((file, index) => {
          if (file instanceof File) {
            formData.append('galleryImageFiles', file);
            console.log(`🖼️ Added gallery image ${index + 1}:`, {
              name: file.name,
              size: file.size,
              type: file.type
            });
          }
        });
      }
      
      console.log('✅ FormData created successfully');
      return formData;
      
    } catch (error) {
      console.error('❌ Error creating FormData:', error);
      throw new Error('Failed to prepare article data for upload');
    }
  }

  /**
   * FIXED: Create user article - Following exact dealer service pattern
   */
  async createUserArticle(articleData) {
    try {
      console.log('\n🚀 ===== CREATING USER ARTICLE =====');
      console.log('📋 Request details:', {
        title: articleData.title,
        userRole: this.getUserRole(),
        userId: this.currentUser?.id,
        baseURL: this.baseURL,
        hasAuth: !!localStorage.getItem('token')
      });

      // Validate required fields (same as dealers)
      if (!articleData.title?.trim()) {
        throw new Error('Article title is required');
      }
      if (!articleData.content?.trim()) {
        throw new Error('Article content is required'); 
      }
      if (!articleData.category) {
        throw new Error('Article category is required');
      }

      // Check authentication (same as dealers)
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // FIXED: Use exact endpoint path from backend
      const endpoint = '/news/user';
      
      console.log('📤 Making request to:', `${this.baseURL}${endpoint}`);

      // Check for images (same as dealers)
      const hasImages = articleData.featuredImageFile || 
                       (articleData.galleryImageFiles && articleData.galleryImageFiles.length > 0);
      
      console.log('📊 Upload details:', {
        hasImages,
        featuredImage: !!articleData.featuredImageFile,
        galleryImages: articleData.galleryImageFiles?.length || 0,
        totalSize: hasImages ? 'Calculated...' : 0
      });

      let response;
      
      if (hasImages) {
        // Use FormData for file uploads (same as dealers)
        console.log('📎 Preparing FormData for image upload...');
        const formData = this.createFormData(articleData);
        
        response = await this.axios.post(endpoint, formData, {
          timeout: 300000, // 5 minutes for uploads
          headers: {
            // Let browser set Content-Type for FormData
          }
        });
      } else {
        // Use JSON for text-only (same as dealers)
        console.log('📝 Preparing JSON for text-only request...');
        const { featuredImageFile, galleryImageFiles, ...cleanData } = articleData;
        
        response = await this.axios.post(endpoint, cleanData, {
          timeout: 30000, // 30 seconds for JSON
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      console.log('📨 Raw response received:', {
        status: response.status,
        success: response.data?.success,
        hasData: !!response.data?.data,
        message: response.data?.message
      });

      // Check for HTML response (indicates endpoint not found)
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
        console.error('🚨 Server returned HTML instead of JSON');
        throw new Error('API endpoint not found. Server returned HTML page instead of JSON.');
      }

      // Validate successful response (same as dealers)
      if (!response.data?.success) {
        const errorMsg = response.data?.message || 'Article creation failed';
        console.error('❌ API returned failure:', errorMsg);
        throw new Error(errorMsg);
      }

      if (!response.data?.data) {
        console.error('❌ API returned success but no data');
        throw new Error('Article creation succeeded but no article data returned');
      }

      const createdArticle = response.data.data;
      
      // Validate article has required ID (same as dealers)
      if (!createdArticle._id) {
        console.error('❌ Created article missing ID');
        throw new Error('Article created but missing database ID');
      }

      console.log('✅ Article created successfully!', {
        id: createdArticle._id,
        title: createdArticle.title,
        status: createdArticle.status,
        author: createdArticle.author
      });
      
      console.log('🏁 ===== USER ARTICLE CREATION COMPLETED =====\n');
      
      return createdArticle;

    } catch (error) {
      console.error('\n❌ ===== USER ARTICLE CREATION FAILED =====');
      console.error('Error details:', {
        type: error.constructor.name,
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        url: error.config?.url
      });
      
      // Enhanced error messages (same as dealers)
      if (error.response?.status === 404) {
        throw new Error('Article creation endpoint not found on server. Please check server configuration.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('Permission denied. Check if your account can create articles.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error occurred. Please try again or contact support.');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout. Server took too long to respond.');
      } else if (error.message?.includes('Network Error')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      
      console.error('🏁 ===== ERROR PROCESSING COMPLETED =====\n');
      throw error;
    }
  }

  /**
   * FIXED: Create admin article (same pattern)
   */
  async createAdminArticle(articleData) {
    try {
      console.log('🔧 Creating article as admin:', articleData.title);
      
      if (!this.isAdmin()) {
        throw new Error('Admin access required to create articles');
      }
      
      const hasImages = articleData.featuredImageFile || 
                       (articleData.galleryImageFiles && articleData.galleryImageFiles.length > 0);
      
      const endpoint = '/news'; // Admin endpoint
      let response;
      
      if (hasImages) {
        const formData = this.createFormData(articleData);
        response = await this.axios.post(endpoint, formData, {
          timeout: 300000
        });
      } else {
        const { featuredImageFile, galleryImageFiles, ...cleanData } = articleData;
        response = await this.axios.post(endpoint, cleanData);
      }

      if (response.data?.success && response.data?.data?._id) {
        console.log('✅ Admin article created:', response.data.data._id);
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to create admin article');
      }
    } catch (error) {
      console.error('❌ Admin article creation failed:', error);
      throw error;
    }
  }

  /**
   * Smart routing for article creation (same as dealers)
   */
  async createArticle(articleData) {
    try {
      console.log('🎯 Smart routing article creation, user role:', this.getUserRole());
      
      if (this.isAdmin()) {
        return await this.createAdminArticle(articleData);
      } else {
        return await this.createUserArticle(articleData);
      }
    } catch (error) {
      console.error('❌ Smart routing creation failed:', error);
      throw error;
    }
  }

  /**
   * Get user's articles (same pattern as dealers)
   */
  async getMyOwnArticles(filters = {}) {
    try {
      const params = new URLSearchParams({
        page: filters.page || 1,
        limit: filters.limit || 100,
        status: filters.status || 'all'
      });

      const endpoint = `/news/user/my-articles?${params}`;
      console.log('📋 Getting user articles from:', endpoint);
      
      const response = await this.axios.get(endpoint);

      if (response.data?.success) {
        const articles = response.data.data || [];
        console.log(`✅ Loaded ${articles.length} user articles`);
        return articles;
      } else {
        console.warn('No articles returned or request failed');
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching user articles:', error);
      return [];
    }
  }

  /**
   * Get all articles (admin only)
   */
  async getAllArticles(filters = {}) {
    try {
      if (!this.isAdmin()) {
        throw new Error('Admin access required');
      }

      const params = new URLSearchParams({
        page: filters.page || 1,
        limit: filters.limit || 100
      });

      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      const response = await this.axios.get(`/news?${params}`);
      
      if (response.data?.success) {
        console.log(`✅ Loaded ${response.data.data?.length || 0} articles (admin)`);
        return response.data.data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching all articles:', error);
      if (error.response?.status === 403) {
        throw new Error('Admin access required');
      }
      throw error;
    }
  }

  /**
   * Smart routing for getting articles
   */
  async getUserArticles(filters = {}) {
    try {
      if (this.isAdmin()) {
        return await this.getAllArticles({...filters, status: filters.status || 'all'});
      } else {
        return await this.getMyOwnArticles(filters);
      }
    } catch (error) {
      console.error('❌ Error in getUserArticles router:', error);
      return [];
    }
  }

  /**
   * Update article
   */
  async updateArticle(articleId, articleData) {
    try {
      const endpoint = this.isAdmin() ? `/news/${articleId}` : `/news/user/${articleId}`;
      
      const hasImages = articleData.featuredImageFile || 
                       (articleData.galleryImageFiles && articleData.galleryImageFiles.length > 0);
      
      let response;
      
      if (hasImages) {
        const formData = this.createFormData(articleData);
        response = await this.axios.put(endpoint, formData);
      } else {
        const { featuredImageFile, galleryImageFiles, ...cleanData } = articleData;
        response = await this.axios.put(endpoint, cleanData);
      }

      if (response.data?.success && response.data?.data) {
        console.log('✅ Article updated successfully');
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to update article');
      }
    } catch (error) {
      console.error('❌ Article update failed:', error);
      throw error;
    }
  }

  /**
   * Delete article
   */
  async deleteArticle(articleId) {
    try {
      const endpoint = this.isAdmin() ? `/news/${articleId}` : `/news/user/${articleId}`;
      
      const response = await this.axios.delete(endpoint);
      
      if (response.data?.success) {
        console.log('✅ Article deleted successfully');
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to delete article');
      }
    } catch (error) {
      console.error('❌ Article deletion failed:', error);
      throw error;
    }
  }

  /**
   * Utility methods
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

  getUserPermissions() {
    return {
      canPublish: this.canPublishDirectly(),
      canReview: this.isAdmin(),
      role: this.getUserRole(),
      isAdmin: this.isAdmin(),
      isJournalist: this.isJournalist()
    };
  }

  /**
   * Debug and testing methods
   */
  async testEndpointConnectivity() {
    console.log('🔍 Testing article endpoints connectivity...');
    
    const endpoints = [
      { path: '/news/user/my-articles', method: 'GET', desc: 'Get user articles' },
      { path: '/news', method: 'GET', desc: 'Get all articles (admin)' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint.method} ${endpoint.path}...`);
        
        const response = await this.axios.request({
          method: endpoint.method,
          url: endpoint.path,
          timeout: 5000,
          validateStatus: () => true // Accept all status codes for testing
        });
        
        console.log(`✅ ${endpoint.path}: Status ${response.status}`, {
          success: response.data?.success,
          dataType: typeof response.data,
          isHTML: typeof response.data === 'string' && response.data.includes('<!DOCTYPE')
        });
        
      } catch (error) {
        console.error(`❌ ${endpoint.path}: ${error.message}`);
      }
    }
  }

  /**
   * Get default social stats (fallback)
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
   * Get social stats with error handling
   */
  async getSocialStats() {
    try {
      const response = await this.axios.get('/analytics/social-stats', {
        timeout: 10000,
        validateStatus: (status) => status === 200
      });

      if (response.data?.success) {
        return response.data.data || this.getDefaultSocialStats();
      } else {
        console.warn('Social stats API returned success=false');
        return this.getDefaultSocialStats();
      }
    } catch (error) {
      console.warn('Social stats fetch failed:', error.message);
      return this.getDefaultSocialStats();
    }
  }

  /**
   * Clear cache and cleanup
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 ArticleService cache cleared');
  }

  destroy() {
    this.clearCache();
    this.currentUser = null;
    console.log('🧹 ArticleService destroyed');
  }
}

// Create singleton instance (same as dealers)
const articleApiService = new ArticleApiService();

// Add debug methods to window for manual testing
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.articleApiService = articleApiService;
  window.testArticleEndpoints = () => articleApiService.testEndpointConnectivity();
}

export { articleApiService };
export default articleApiService;
