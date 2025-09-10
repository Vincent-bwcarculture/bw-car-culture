// client/src/components/profile/ArticleManagement/services/articleService.js
// Real API service for article management - NO MOCK DATA

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
   * Get all user's articles
   * @param {Object} filters - Filtering options
   * @returns {Promise<Array>} User's articles
   */
  async getUserArticles(filters = {}) {
    try {
      const params = new URLSearchParams({
        page: 1,
        limit: 100, // Get all user articles
        ...filters
      });

      const response = await fetch(`${this.endpoint}?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`Loaded ${data.data.length} articles`);
        return data.data || [];
      } else {
        throw new Error(data.message || 'Failed to fetch articles');
      }
    } catch (error) {
      console.error('Error fetching user articles:', error);
      throw error;
    }
  }

  /**
   * Create a new article
   * @param {Object} articleData - Article data
   * @returns {Promise<Object>} Created article
   */
  async createArticle(articleData) {
    try {
      console.log('Creating article:', articleData.title);
      
      // Prepare FormData for image upload support
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', articleData.title);
      formData.append('content', articleData.content);
      formData.append('category', articleData.category);
      formData.append('status', articleData.status);
      
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
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Article created successfully:', data.data._id);
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create article');
      }
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  }

  /**
   * Update an existing article
   * @param {string} articleId - Article ID
   * @param {Object} articleData - Updated article data
   * @returns {Promise<Object>} Updated article
   */
  async updateArticle(articleId, articleData) {
    try {
      console.log('Updating article:', articleId);
      
      // Prepare FormData for image upload support
      const formData = new FormData();
      
      // Add text fields
      formData.append('title', articleData.title);
      formData.append('content', articleData.content);
      formData.append('category', articleData.category);
      formData.append('status', articleData.status);
      
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

      const response = await fetch(`${this.endpoint}/${articleId}`, {
        method: 'PUT',
        headers: this.getFormDataHeaders(),
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Article updated successfully');
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to update article');
      }
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  }

  /**
   * Delete an article
   * @param {string} articleId - Article ID
   * @returns {Promise<Object>} Success response
   */
  async deleteArticle(articleId) {
    try {
      console.log('Deleting article:', articleId);

      const response = await fetch(`${this.endpoint}/${articleId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('Article deleted successfully');
        return data;
      } else {
        throw new Error(data.message || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  }

  /**
   * Get article by ID
   * @param {string} articleId - Article ID
   * @returns {Promise<Object>} Article data
   */
  async getArticle(articleId) {
    try {
      const response = await fetch(`${this.endpoint}/${articleId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
   * Get article statistics
   * @returns {Promise<Object>} Article statistics
   */
  async getArticleStats() {
    try {
      const articles = await this.getUserArticles();
      
      const publishedArticles = articles.filter(article => article.status === 'published');
      const draftArticles = articles.filter(article => article.status === 'draft');
      
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
        if (!article.publishDate) return false;
        const publishDate = new Date(article.publishDate);
        return publishDate >= thisMonth;
      });

      return {
        totalArticles: articles.length,
        publishedArticles: publishedArticles.length,
        draftArticles: draftArticles.length,
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
      throw error;
    }
  }
}

// Export singleton instance
export const articleApiService = new ArticleApiService();
export default articleApiService;
