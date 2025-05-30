// src/services/newsService.js
import { http } from '../config/axios.js';
import { 
  enhanceArticleMetadata, 
  findRelatedArticles, 
  searchArticles,
  extractKeywords
} from '../utils/newsHelpers.js';

class NewsService {
  constructor() {
    // Base endpoint for all news requests
    this.endpoint = '/news';
    // Local cache for articles to improve performance
    this.articlesCache = {
      all: null,
      featured: null,
      latest: null,
      byCategory: {},
      byId: {},
      timestamp: null
    };
    // Cache expiration time in milliseconds (5 minutes)
    this.cacheExpiration = 5 * 60 * 1000;
    // Track if we have any real data from the database
    this.hasRealData = false;
  }

  /**
   * Check if cache is valid or expired
   * @returns {Boolean} True if cache is valid, false if expired
   */
  isCacheValid() {
    if (!this.articlesCache.timestamp) return false;
    return (Date.now() - this.articlesCache.timestamp) < this.cacheExpiration;
  }

  /**
   * Clear the cache or specific parts of it
   * @param {String} section - Specific section to clear (all, featured, latest, etc)
   */
  clearCache(section = null) {
    if (!section) {
      // Clear entire cache
      this.articlesCache = {
        all: null,
        featured: null,
        latest: null,
        byCategory: {},
        byId: {},
        timestamp: null
      };
    } else if (section === 'byCategory') {
      // Clear category cache
      this.articlesCache.byCategory = {};
    } else if (section === 'byId') {
      // Clear individual article cache
      this.articlesCache.byId = {};
    } else if (this.articlesCache[section] !== undefined) {
      // Clear specific section
      this.articlesCache[section] = null;
    }
  }

  // Simplified direct collection access without complex parameters
  async getDirectNews(limit = 10) {
    // Check cache first
    if (this.isCacheValid() && this.articlesCache.all && this.articlesCache.all.length > 0) {
      console.log(`Using cached articles (${this.articlesCache.all.length} items)`);
      return this.articlesCache.all.slice(0, limit);
    }

    try {
      console.log(`Fetching news directly with minimal parameters`);
      const response = await http.get(`${this.endpoint}?limit=${limit}`);
      
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        console.log(`✅ Found ${response.data.data.length} articles in main collection`);
        this.hasRealData = true;

        // Enhance articles with metadata
        const enhancedArticles = response.data.data.map(article => enhanceArticleMetadata(article));
        
        // Update cache
        this.articlesCache.all = enhancedArticles;
        this.articlesCache.timestamp = Date.now();
        
        return enhancedArticles.slice(0, limit);
      }
      
      console.log('No articles found in direct query');
      return [];
    } catch (error) {
      console.error('Error querying news collection directly:', error);
      return [];
    }
  }

  // Get all articles with filtering and pagination - enhanced with search and metadata
  async getArticles(filters = {}, page = 1, limit = 10) {
    try {
      // Check if search is requested
      if (filters.search) {
        return this.searchArticles(filters.search, page, limit, filters);
      }

      // Check category cache if category filter is present
      if (filters.category && this.isCacheValid() && 
          this.articlesCache.byCategory[filters.category] && 
          this.articlesCache.byCategory[filters.category].length > 0) {
        
        const cachedResult = this.articlesCache.byCategory[filters.category];
        const totalItems = cachedResult.length;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        return {
          articles: cachedResult.slice(startIndex, endIndex),
          total: totalItems,
          currentPage: page,
          totalPages: Math.ceil(totalItems / limit)
        };
      }

      // First, try a direct query if we don't have complex filters
      const isSimpleFilter = !filters.search && 
        (!filters.category || filters.category === 'all') && 
        !filters.tag && !filters.author;
      
      if (isSimpleFilter) {
        const directArticles = await this.getDirectNews(limit * page); // Get enough for paging
        if (directArticles.length > 0) {
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          
          return {
            articles: directArticles.slice(startIndex, endIndex),
            total: directArticles.length,
            currentPage: page,
            totalPages: Math.ceil(directArticles.length / limit)
          };
        }
      }
      
      // If direct doesn't work or we have filters, try with parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      // Add filters
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.featured) params.append('featured', 'true');
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.author) params.append('author', filters.author);
      
      // Try to get from collection with minimal parameters
      console.log(`Querying with parameters: ${this.endpoint}?${params.toString()}`);
      const response = await http.get(`${this.endpoint}?${params.toString()}`);
      
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        console.log(`✅ Found ${response.data.data.length} articles with parameters`);
        this.hasRealData = true;
        
        // Enhance articles with metadata
        const enhancedArticles = response.data.data.map(article => {
          // Ensure images are properly formatted with S3 URLs
          if (article.images && article.images.length > 0) {
            article.images = article.images.map(img => {
              if (typeof img === 'string') {
                return { url: img };
              }
              return img;
            });
          }
          return enhanceArticleMetadata(article);
        });
        
        // Update category cache if this was a category query
        if (filters.category && filters.category !== 'all') {
          this.articlesCache.byCategory[filters.category] = enhancedArticles;
          this.articlesCache.timestamp = Date.now();
        }
        
        return {
          articles: enhancedArticles,
          total: response.data.total || enhancedArticles.length,
          currentPage: page,
          totalPages: Math.ceil((response.data.total || enhancedArticles.length) / limit)
        };
      }
      
      // Last attempt - try without any parameters
      if (Object.keys(filters).length > 0) {
        const directArticles = await this.getDirectNews(limit * page);
        if (directArticles.length > 0) {
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          
          return {
            articles: directArticles.slice(startIndex, endIndex),
            total: directArticles.length,
            currentPage: page,
            totalPages: Math.ceil(directArticles.length / limit)
          };
        }
      }
      
      // No articles found
      console.log('No articles found in database');
      return {
        articles: [],
        total: 0,
        currentPage: 1,
        totalPages: 0,
        error: 'No articles found'
      };
    } catch (error) {
      console.error('Error fetching articles:', error);
      console.log('Error fetching articles, returning empty result');
      
      return {
        articles: [],
        total: 0,
        currentPage: 1,
        totalPages: 0,
        error: error.message || 'Error fetching articles'
      };
    }
  }

  // Search articles with text query
  async searchArticles(query, page = 1, limit = 10, additionalFilters = {}) {
    try {
      // First get all articles (from cache if available)
      let allArticles = [];
      
      if (this.isCacheValid() && this.articlesCache.all) {
        console.log('Searching in cached articles');
        allArticles = this.articlesCache.all;
      } else {
        // Get a larger set for searching - API might not have full-text search
        const response = await this.getDirectNews(50);
        if (response.length > 0) {
          allArticles = response;
        } else {
          // Fallback to mock data if no real data is available
          allArticles = this.getMockData().latestArticles.map(article => enhanceArticleMetadata(article));
        }
      }
      
      // Use the search helper to find matches
      let searchResults = searchArticles(allArticles, query);
      
      // Apply additional filters if any
      if (additionalFilters.category && additionalFilters.category !== 'all') {
        searchResults = searchResults.filter(article => 
          article.category === additionalFilters.category
        );
      }
      
      // Apply pagination
      const totalResults = searchResults.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedResults = searchResults.slice(startIndex, endIndex);
      
      return {
        articles: paginatedResults,
        total: totalResults,
        currentPage: page,
        totalPages: Math.ceil(totalResults / limit),
        searchQuery: query
      };
    } catch (error) {
      console.error('Error in searchArticles:', error);
      return {
        articles: [],
        total: 0,
        currentPage: 1,
        totalPages: 0,
        searchQuery: query,
        error: 'Search failed'
      };
    }
  }

  // Get featured articles with enhanced metadata
  async getFeaturedArticles(limit = 1) {
    // Check cache first
    if (this.isCacheValid() && this.articlesCache.featured && this.articlesCache.featured.length > 0) {
      return this.articlesCache.featured.slice(0, limit);
    }

    try {
      // First try the featured endpoint
      const response = await http.get(`${this.endpoint}/featured?limit=${limit}`);
      
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const featuredArticles = response.data.data.map(article => {
          // Ensure images are properly formatted with S3 URLs
          if (article.images && article.images.length > 0) {
            article.images = article.images.map(img => {
              if (typeof img === 'string') {
                return { url: img };
              }
              return img;
            });
          }
          return enhanceArticleMetadata(article);
        });
        
        // Update cache
        this.articlesCache.featured = featuredArticles;
        this.articlesCache.timestamp = Date.now();
        
        return featuredArticles;
      }
      
      // If no featured articles, get any article and use as featured
      const articles = await this.getDirectNews(limit);
      
      if (articles.length > 0) {
        console.log('Using direct articles as featured');
        
        // Update cache
        this.articlesCache.featured = articles;
        this.articlesCache.timestamp = Date.now();
        
        return articles;
      }
      
      // No featured articles found
      console.log('No featured articles found');
      return [];
    } catch (error) {
      console.error('Error in getFeaturedArticles:', error);
      
      // Return empty array on error
      return [];
    }
  }

  // Get latest articles with enhanced metadata
  async getLatestArticles(limit = 6) {
    // Check cache first
    if (this.isCacheValid() && this.articlesCache.latest && this.articlesCache.latest.length > 0) {
      return this.articlesCache.latest.slice(0, limit);
    }

    try {
      // First try the latest endpoint
      const response = await http.get(`${this.endpoint}/latest?limit=${limit}`);
      
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const latestArticles = response.data.data.map(article => {
          // Ensure images are properly formatted with S3 URLs
          if (article.images && article.images.length > 0) {
            article.images = article.images.map(img => {
              if (typeof img === 'string') {
                return { url: img };
              }
              return img;
            });
          }
          return enhanceArticleMetadata(article);
        });
        
        // Update cache
        this.articlesCache.latest = latestArticles;
        this.articlesCache.timestamp = Date.now();
        
        return latestArticles;
      }
      
      // If no latest endpoint, try a direct query sorted by date
      const articles = await this.getDirectNews(limit);
      
      if (articles.length > 0) {
        console.log('Using direct articles as latest');
        
        // Sort by date
        const sortedArticles = [...articles].sort((a, b) => {
          const dateA = new Date(a.publishDate || a.createdAt || 0);
          const dateB = new Date(b.publishDate || b.createdAt || 0);
          return dateB - dateA;
        });
        
        // Update cache
        this.articlesCache.latest = sortedArticles;
        this.articlesCache.timestamp = Date.now();
        
        return sortedArticles;
      }
      
      // No latest articles found
      console.log('No latest articles found');
      return [];
    } catch (error) {
      console.error('Error in getLatestArticles:', error);
      
      // Return empty array on error
      return [];
    }
  }

  // Get trending articles based on views/popularity
  async getTrendingArticles(limit = 3) {
    try {
      // First try the trending endpoint
      const response = await http.get(`${this.endpoint}/trending?limit=${limit}`);
      
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data.data.map(article => {
          // Ensure images are properly formatted with S3 URLs
          if (article.images && article.images.length > 0) {
            article.images = article.images.map(img => {
              if (typeof img === 'string') {
                return { url: img };
              }
              return img;
            });
          }
          return enhanceArticleMetadata(article);
        });
      }
      
      // If no trending endpoint, use direct query and sort by views
      const articles = await this.getDirectNews(limit * 2);
      
      if (articles.length > 0) {
        console.log('Using direct articles sorted by views as trending');
        
        // Sort by views/popularity
        const sortedArticles = [...articles].sort((a, b) => {
          const viewsA = a.metadata?.views || a.stats?.views || 0;
          const viewsB = b.metadata?.views || b.stats?.views || 0;
          return viewsB - viewsA;
        });
        
        return sortedArticles.slice(0, limit);
      }
      
      // No trending articles found
      console.log('No trending articles found');
      return [];
    } catch (error) {
      console.error('Error in getTrendingArticles:', error);
      return [];
    }
  }

  // Get single article by ID or slug with enhanced metadata
  async getArticle(id) {
    if (!id) return null;
    
    // Check cache first
    if (this.isCacheValid() && this.articlesCache.byId[id]) {
      return this.articlesCache.byId[id];
    }
    
    try {
      // Try to get the specific article
      console.log(`Fetching article with ID: ${id}`);
      const response = await http.get(`${this.endpoint}/${id}`);
      
      if (response.data?.data) {
        console.log('Successfully fetched article');
        
        // Ensure images are properly formatted with S3 URLs
        const article = response.data.data;
        if (article.images && article.images.length > 0) {
          article.images = article.images.map(img => {
            if (typeof img === 'string') {
              return { url: img };
            }
            return img;
          });
        }
        
        const enhancedArticle = enhanceArticleMetadata(article);
        
        // Update cache
        this.articlesCache.byId[id] = enhancedArticle;
        this.articlesCache.timestamp = Date.now();
        
        return enhancedArticle;
      }
      
      // If we have any real data, try to return the first article
      if (this.hasRealData) {
        const articles = await this.getDirectNews(1);
        if (articles.length > 0) {
          console.log('Using first article from collection as fallback');
          return articles[0];
        }
      }
      
      // Article not found
      console.log('Article not found');
      return null;
    } catch (error) {
      console.error(`Error fetching article ${id}:`, error);
      return null;
    }
  }

  // Get related articles based on shared keywords
  async getRelatedArticles(id, limit = 3) {
    if (!id) return [];
    
    try {
      // First try the API endpoint for related articles
      const response = await http.get(`${this.endpoint}/${id}/similar`);
      
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data.data.map(article => {
          // Ensure images are properly formatted with S3 URLs
          if (article.images && article.images.length > 0) {
            article.images = article.images.map(img => {
              if (typeof img === 'string') {
                return { url: img };
              }
              return img;
            });
          }
          return enhanceArticleMetadata(article);
        });
      }
      
      // If API doesn't support related articles, do it client-side
      // First, get the current article
      const currentArticle = await this.getArticle(id);
      
      if (!currentArticle) {
        throw new Error('Cannot find current article');
      }
      
      // Then get a set of articles to find related ones from
      const allArticles = await this.getDirectNews(20); // Get a good sample size
      
      if (allArticles.length > 0) {
        // Use the helper to find related articles
        return findRelatedArticles(currentArticle, allArticles, limit);
      }
      
      // No related articles found
      console.log('No related articles found');
      return [];
    } catch (error) {
      console.error('Error in getRelatedArticles:', error);
      return [];
    }
  }

  // Get articles by tag
  async getArticlesByTag(tag, page = 1, limit = 10) {
    if (!tag) return { articles: [], total: 0, currentPage: 1, totalPages: 0 };
    
    try {
      // Try the API endpoint for tag-based articles
      const response = await http.get(`${this.endpoint}/tags/${tag}?page=${page}&limit=${limit}`);
      
      if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return {
          articles: response.data.data.map(article => {
            // Ensure images are properly formatted with S3 URLs
            if (article.images && article.images.length > 0) {
              article.images = article.images.map(img => {
                if (typeof img === 'string') {
                  return { url: img };
                }
                return img;
              });
            }
            return enhanceArticleMetadata(article);
          }),
          total: response.data.total || response.data.data.length,
          currentPage: page,
          totalPages: Math.ceil((response.data.total || response.data.data.length) / limit)
        };
      }
      
      // If API doesn't support tag filtering, do it client-side
      const allArticles = await this.getDirectNews(50); // Get a good sample size
      
      if (allArticles.length > 0) {
        // Filter articles that have this tag
        const taggedArticles = allArticles.filter(article => {
          const keywords = extractKeywords(article);
          return keywords.some(keyword => 
            keyword.toLowerCase() === tag.toLowerCase()
          );
        });
        
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        return {
          articles: taggedArticles.slice(startIndex, endIndex),
          total: taggedArticles.length,
          currentPage: page,
          totalPages: Math.ceil(taggedArticles.length / limit)
        };
      }
      
      // No articles found for this tag
      console.log(`No articles found for tag: ${tag}`);
      return {
        articles: [],
        total: 0,
        currentPage: 1,
        totalPages: 0,
        error: `No articles found for tag: ${tag}`
      };
    } catch (error) {
      console.error(`Error in getArticlesByTag: ${tag}`, error);
      
      return {
        articles: [],
        total: 0,
        currentPage: 1,
        totalPages: 0,
        error: error.message || `Error fetching articles for tag: ${tag}`
      };
    }
  }

  /**
   * Create a new article - UPDATED FOR S3
   * @param {FormData} formData - Form data with article information and images
   * @returns {Promise<Object>} - The created article
   */
  async createArticle(formData) {
    try {
      console.log('Creating new article with form data');
      
      // Log the form data fields for debugging
      if (formData instanceof FormData) {
        console.log('FormData fields:', [...formData.entries()].map(e => e[0]));
      }
      
      // Make the API request - FormData will handle S3 uploads on the backend
      const response = await http.post(`${this.endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data?.success && response.data?.data) {
        console.log('Article created successfully');
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to create article');
      }
    } catch (error) {
      console.error('Error in createArticle:', error);
      throw error;
    }
  }

  /**
   * Update an existing article - UPDATED FOR S3
   * @param {string} id - Article ID
   * @param {FormData} formData - Form data with updated article information
   * @returns {Promise<Object>} - The updated article
   */
  async updateArticle(id, formData) {
    try {
      console.log(`Updating article with ID: ${id}`);
      
      // Log the form data fields for debugging
      if (formData instanceof FormData) {
        console.log('FormData fields:', [...formData.entries()].map(e => e[0]));
      }
      
      // Make the API request with the PUT method - FormData will handle S3 uploads on the backend
      const response = await http.put(`${this.endpoint}/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data?.success && response.data?.data) {
        console.log('Article updated successfully');
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to update article');
      }
    } catch (error) {
      console.error(`Error updating article ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an article
   * @param {string} id - Article ID
   * @returns {Promise<Object>} - Success response
   */
  async deleteArticle(id) {
    try {
      console.log(`Deleting article with ID: ${id}`);
      
      const response = await http.delete(`${this.endpoint}/${id}`);
      
      if (response.data?.success) {
        console.log('Article deleted successfully');
        // Clear cache after deletion
        this.clearCache();
        return response.data;
      } else {
        throw new Error(response.data?.message || 'Failed to delete article');
      }
    } catch (error) {
      console.error(`Error deleting article ${id}:`, error);
      throw error;
    }
  }
}

export const newsService = new NewsService();