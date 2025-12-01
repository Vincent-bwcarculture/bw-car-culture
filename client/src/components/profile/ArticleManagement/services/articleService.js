// client/src/components/profile/ArticleManagement/services/articleService.js
// COMPLETE FIXED VERSION - All improvements integrated
// Based on working dealer service patterns with enhanced error handling

import axios from 'axios';

class ArticleApiService {
  constructor() {
    // FIXED: Match the exact URL pattern that works for dealers
    this.baseURL = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app/api';
    
    // FIXED: Create dedicated axios instance following dealer service pattern
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: 300000, // 5 minutes for large uploads
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
   * ENHANCED FormData creation with proper image handling
   * CRITICAL FIX: Using 'galleryImages' (plural) for gallery upload field name
   */
  createFormData(articleData) {
    try {
      console.log('\n📦 ===== CREATING FORMDATA =====');
      const formData = new FormData();
      
      console.log('📋 Input article data:', {
        title: articleData.title,
        hasContent: !!articleData.content,
        contentLength: articleData.content?.length || 0,
        hasFeaturedImage: !!articleData.featuredImageFile,
        galleryImagesCount: articleData.galleryImageFiles?.length || 0
      });
      
      // TEXT FIELDS - Add all required text fields first
      const textFields = [
        'title',
        'subtitle', 
        'content',
        'category',
        'status',
        'authorNotes'
      ];
      
      textFields.forEach(field => {
        if (articleData[field] !== undefined && articleData[field] !== null) {
          const value = String(articleData[field]).trim();
          if (value) {
            formData.append(field, value);
            console.log(`📝 Added ${field}:`, 
              value.length > 50 ? `${value.substring(0, 50)}...` : value
            );
          }
        }
      });
      
      // ARRAYS - Handle tags
      if (articleData.tags && Array.isArray(articleData.tags)) {
        formData.append('tags', JSON.stringify(articleData.tags));
        console.log('📝 Added tags:', articleData.tags);
      }
      
      // DATES
      if (articleData.publishDate) {
        formData.append('publishDate', articleData.publishDate);
        console.log('📝 Added publishDate:', articleData.publishDate);
      }
      
      // BOOLEAN FIELDS
      const booleanFields = ['isPremium', 'earningsEnabled', 'allowComments', 'allowSharing'];
      booleanFields.forEach(field => {
        if (articleData[field] !== undefined) {
          formData.append(field, Boolean(articleData[field]).toString());
          console.log(`📝 Added ${field}:`, articleData[field]);
        }
      });
      
      // SEO FIELDS
      if (articleData.metaTitle) {
        formData.append('metaTitle', articleData.metaTitle);
        console.log('📝 Added metaTitle');
      }
      if (articleData.metaDescription) {
        formData.append('metaDescription', articleData.metaDescription);
        console.log('📝 Added metaDescription');
      }
      if (articleData.metaKeywords) {
        formData.append('metaKeywords', articleData.metaKeywords);
        console.log('📝 Added metaKeywords');
      }
      
      // FEATURED IMAGE - Using 'featuredImage' as field name
      if (articleData.featuredImageFile && articleData.featuredImageFile instanceof File) {
        formData.append('featuredImage', articleData.featuredImageFile);
        console.log('🖼️ Added featured image:', {
          name: articleData.featuredImageFile.name,
          size: `${(articleData.featuredImageFile.size / 1024 / 1024).toFixed(2)}MB`,
          type: articleData.featuredImageFile.type
        });
      }
      
      // GALLERY IMAGES - CRITICAL FIX: Using 'galleryImages' (plural) as field name
      // Backend expects multiple files under the same 'galleryImages' field name
      if (articleData.galleryImageFiles && Array.isArray(articleData.galleryImageFiles)) {
        console.log(`🖼️ Processing ${articleData.galleryImageFiles.length} gallery images...`);
        
        articleData.galleryImageFiles.forEach((file, index) => {
          if (file instanceof File) {
            // IMPORTANT: Use 'galleryImages' (plural) as the field name
            // This allows the backend to receive multiple files under one field name
            formData.append('galleryImages', file);
            console.log(`🖼️ Added gallery image ${index + 1}:`, {
              name: file.name,
              size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
              type: file.type
            });
          }
        });
      }
      
      // LOG FINAL FORMDATA SUMMARY
      console.log('\n✅ FormData created successfully');
      console.log('📊 Summary:', {
        textFields: textFields.filter(f => articleData[f]).length,
        featuredImage: !!articleData.featuredImageFile,
        galleryImages: articleData.galleryImageFiles?.length || 0,
        totalFormDataEntries: Array.from(formData.keys()).length
      });
      
      // Log all FormData entries for debugging
      console.log('📋 FormData entries:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  - ${key}: [File] ${value.name} (${(value.size / 1024).toFixed(1)}KB)`);
        } else {
          const displayValue = String(value).length > 50 
            ? String(value).substring(0, 50) + '...' 
            : value;
          console.log(`  - ${key}: ${displayValue}`);
        }
      }
      
      console.log('🏁 ===== FORMDATA CREATION COMPLETE =====\n');
      
      return formData;
      
    } catch (error) {
      console.error('❌ Error creating FormData:', error);
      throw new Error('Failed to prepare article data for upload');
    }
  }

  /**
   * ENHANCED: Create user article with comprehensive error handling
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

      // VALIDATION - Validate required fields
      if (!articleData.title?.trim()) {
        throw new Error('Article title is required');
      }
      if (!articleData.content?.trim()) {
        throw new Error('Article content is required'); 
      }
      if (!articleData.category) {
        throw new Error('Article category is required');
      }

      // CHECK AUTHENTICATION
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // ENDPOINT - Use exact endpoint path from backend
      const endpoint = '/news/user';
      console.log('📤 Target endpoint:', `${this.baseURL}${endpoint}`);

      // CHECK FOR IMAGES
      const hasImages = articleData.featuredImageFile || 
                       (articleData.galleryImageFiles && articleData.galleryImageFiles.length > 0);
      
      console.log('📊 Upload type:', hasImages ? 'WITH IMAGES (FormData)' : 'TEXT ONLY (JSON)');

      let response;
      
      if (hasImages) {
        // FORMDATA FOR IMAGES
        console.log('📎 Preparing FormData for image upload...');
        const formData = this.createFormData(articleData);
        
        response = await this.axios.post(endpoint, formData, {
          timeout: 300000, // 5 minutes for large uploads
          headers: {
            // Let browser set Content-Type with boundary for FormData
            // DO NOT manually set Content-Type for multipart
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📤 Upload progress: ${percentCompleted}%`);
          }
        });
      } else {
        // JSON FOR TEXT ONLY
        console.log('📝 Preparing JSON for text-only request...');
        const { featuredImageFile, galleryImageFiles, ...cleanData } = articleData;
        
        response = await this.axios.post(endpoint, cleanData, {
          timeout: 30000, // 30 seconds for JSON
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }

      // VALIDATE RESPONSE
      console.log('📨 Response received:', {
        status: response.status,
        success: response.data?.success,
        hasData: !!response.data?.data,
        message: response.data?.message
      });
      
      // Check for HTML response (indicates wrong endpoint)
      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE')) {
        console.error('🚨 Server returned HTML instead of JSON');
        throw new Error('API endpoint not found or not properly configured');
      }

      // Validate successful response
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
      
      // Validate article has required ID
      if (!createdArticle._id) {
        console.error('❌ Created article missing ID');
        throw new Error('Article created but missing database ID');
      }

      console.log('✅ Article created successfully!', {
        id: createdArticle._id,
        title: createdArticle.title,
        status: createdArticle.status,
        author: createdArticle.authorName || createdArticle.author
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
      
      // ENHANCED ERROR MESSAGES
      if (error.response) {
        console.error('Full response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        if (error.response.status === 404) {
          throw new Error('Article creation endpoint not found. Check server configuration.');
        } else if (error.response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        } else if (error.response.status === 403) {
          throw new Error('Permission denied. Check your account permissions.');
        } else if (error.response.status === 413) {
          throw new Error('Files too large. Reduce image sizes and try again.');
        } else if (error.response.status === 500) {
          throw new Error(error.response.data?.message || 'Server error. Please try again.');
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout. Files may be too large.');
      } else if (error.message?.includes('Network Error')) {
        throw new Error('Network error. Check your connection.');
      }
      
      console.error('🏁 ===== ERROR PROCESSING COMPLETED =====\n');
      throw error;
    }
  }

  /**
   * FIXED: Create admin article (same pattern as user)
   */
  async createAdminArticle(articleData) {
    try {
      console.log('\n🔧 ===== CREATING ADMIN ARTICLE =====');
      console.log('Article title:', articleData.title);
      
      if (!this.isAdmin()) {
        throw new Error('Admin access required to create articles');
      }
      
      const hasImages = articleData.featuredImageFile || 
                       (articleData.galleryImageFiles && articleData.galleryImageFiles.length > 0);
      
      const endpoint = '/news'; // Admin endpoint
      let response;
      
      if (hasImages) {
        console.log('📎 Creating article with images (FormData)');
        const formData = this.createFormData(articleData);
        response = await this.axios.post(endpoint, formData, {
          timeout: 300000,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📤 Upload progress: ${percentCompleted}%`);
          }
        });
      } else {
        console.log('📝 Creating article without images (JSON)');
        const { featuredImageFile, galleryImageFiles, ...cleanData } = articleData;
        response = await this.axios.post(endpoint, cleanData);
      }

      if (response.data?.success && response.data?.data?._id) {
        console.log('✅ Admin article created:', response.data.data._id);
        console.log('🏁 ===== ADMIN ARTICLE CREATION COMPLETED =====\n');
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to create admin article');
      }
    } catch (error) {
      console.error('❌ Admin article creation failed:', error);
      console.error('🏁 ===== ERROR PROCESSING COMPLETED =====\n');
      throw error;
    }
  }

  /**
   * Smart routing for article creation (routes based on user role)
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
   * Get user's own articles
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
   * Smart routing for getting articles (routes based on user role)
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
   * Update article (supports both admin and user updates)
   */
  async updateArticle(articleId, articleData) {
    try {
      console.log('\n🔄 ===== UPDATING ARTICLE =====');
      console.log('Article ID:', articleId);
      
      const endpoint = this.isAdmin() ? 
        `/news/${articleId}` : `/news/user/${articleId}`;
      
      console.log('Update endpoint:', endpoint);
      
      const hasImages = articleData.featuredImageFile || 
                       (articleData.galleryImageFiles && articleData.galleryImageFiles.length > 0);
      
      let response;
      
      if (hasImages) {
        console.log('📎 Updating with images (FormData)');
        const formData = this.createFormData(articleData);
        response = await this.axios.put(endpoint, formData, {
          timeout: 300000,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`📤 Upload progress: ${percentCompleted}%`);
          }
        });
      } else {
        console.log('📝 Updating without images (JSON)');
        const { featuredImageFile, galleryImageFiles, ...cleanData } = articleData;
        response = await this.axios.put(endpoint, cleanData);
      }

      if (response.data?.success && response.data?.data) {
        console.log('✅ Article updated successfully');
        console.log('🏁 ===== UPDATE COMPLETED =====\n');
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to update article');
      }
    } catch (error) {
      console.error('❌ Article update failed:', error);
      console.error('🏁 ===== ERROR PROCESSING COMPLETED =====\n');
      throw error;
    }
  }

  /**
   * Delete article (supports both admin and user deletion)
   */
  async deleteArticle(articleId) {
    try {
      console.log('\n🗑️ ===== DELETING ARTICLE =====');
      console.log('Article ID:', articleId);
      
      const endpoint = this.isAdmin() ? 
        `/news/${articleId}` : `/news/user/${articleId}`;
      
      console.log('Delete endpoint:', endpoint);
      
      const response = await this.axios.delete(endpoint);
      
      if (response.data?.success) {
        console.log('✅ Article deleted successfully');
        console.log('🏁 ===== DELETION COMPLETED =====\n');
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to delete article');
      }
    } catch (error) {
      console.error('❌ Article deletion failed:', error);
      console.error('🏁 ===== ERROR PROCESSING COMPLETED =====\n');
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
    console.log('\n🔍 ===== TESTING ARTICLE ENDPOINTS =====');
    
    const endpoints = [
      { path: '/news/user/my-articles', method: 'GET', desc: 'Get user articles' },
      { path: '/news', method: 'GET', desc: 'Get all articles (admin)' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\nTesting ${endpoint.method} ${endpoint.path}...`);
        console.log(`Description: ${endpoint.desc}`);
        
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
    
    console.log('\n🏁 ===== ENDPOINT TESTING COMPLETED =====\n');
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

// Add debug methods to window for manual testing (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.articleApiService = articleApiService;
  window.testArticleEndpoints = () => articleApiService.testEndpointConnectivity();
  console.log('🔧 ArticleService debug methods available:');
  console.log('  - window.articleApiService');
  console.log('  - window.testArticleEndpoints()');
}

export { articleApiService };
export default articleApiService;
