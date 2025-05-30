// src/services/videoService.js
import { http } from '../config/axios.js';

class VideoService {
  constructor() {
    this.endpoint = '/api/videos';
    this.videosCache = {
      all: null,
      featured: null,
      byCategory: {},
      byProvider: {},
      timestamp: null
    };
    this.cacheExpiration = 5 * 60 * 1000; // 5 minutes
  }
  
  /**
   * Check if the cache is valid
   * @returns {boolean} True if cache is valid, false if expired
   */
  isCacheValid() {
    if (!this.videosCache.timestamp) return false;
    return (Date.now() - this.videosCache.timestamp) < this.cacheExpiration;
  }
  
  /**
   * Clear the cache or a specific section
   * @param {string} section - Optional section to clear
   */
  clearCache(section = null) {
    if (!section) {
      // Clear entire cache
      this.videosCache = {
        all: null,
        featured: null,
        byCategory: {},
        byProvider: {},
        timestamp: null
      };
    } else if (section === 'byCategory') {
      this.videosCache.byCategory = {};
    } else if (section === 'byProvider') {
      this.videosCache.byProvider = {};
    } else if (this.videosCache[section] !== undefined) {
      this.videosCache[section] = null;
    }
  }
  
  /**
   * Extract YouTube video ID from URL
   * @param {string} url - YouTube URL
   * @returns {string|null} - YouTube video ID or null if invalid
   */
  extractYouTubeId(url) {
    if (!url) return null;
    
    // Handle different YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  }
  
  /**
   * Get all videos with optional filtering
   * @param {Object} filters - Filter criteria
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise<Object>} - Paginated video results
   */
  async getVideos(filters = {}, page = 1, limit = 10) {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      // Add filters
      if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }
      
      if (filters.subscriptionTier) {
        params.append('subscriptionTier', filters.subscriptionTier);
      }
      
      if (filters.featured) {
        params.append('featured', 'true');
      }
      
      if (filters.dealerId) {
        params.append('dealerId', filters.dealerId);
      }
      
      if (filters.listingId) {
        params.append('listingId', filters.listingId);
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      // Check cache for category filters
      if (filters.category && 
          filters.category !== 'all' && 
          this.isCacheValid() &&
          this.videosCache.byCategory[filters.category]) {
        
        const cachedVideos = this.videosCache.byCategory[filters.category];
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        return {
          videos: cachedVideos.slice(startIndex, endIndex),
          total: cachedVideos.length,
          currentPage: page,
          totalPages: Math.ceil(cachedVideos.length / limit)
        };
      }
      
      // Make API request
      const response = await http.get(`${this.endpoint}?${params.toString()}`);
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        // Cache category results if applicable
        if (filters.category && filters.category !== 'all') {
          this.videosCache.byCategory[filters.category] = response.data.data;
          this.videosCache.timestamp = Date.now();
        }
        
        // If this was a full request with no filters, cache all videos
        if (Object.keys(filters).length === 0) {
          this.videosCache.all = response.data.data;
          this.videosCache.timestamp = Date.now();
        }
        
        return {
          videos: response.data.data,
          total: response.data.total || response.data.data.length,
          currentPage: page,
          totalPages: Math.ceil((response.data.total || response.data.data.length) / limit)
        };
      }
      
      // Return empty results if no data
      return {
        videos: [],
        total: 0,
        currentPage: 1,
        totalPages: 0
      };
    } catch (error) {
      console.error('Error fetching videos:', error);
      return {
        videos: [],
        total: 0,
        currentPage: 1,
        totalPages: 0,
        error: error.message || 'Failed to fetch videos'
      };
    }
  }
  
  /**
   * Get featured videos
   * @param {number} limit - Maximum number of videos to return
   * @returns {Promise<Array>} - Array of featured videos
   */
  async getFeaturedVideos(limit = 3) {
    try {
      // Check cache first
      if (this.isCacheValid() && this.videosCache.featured) {
        return this.videosCache.featured.slice(0, limit);
      }
      
      // Make API request
      const response = await http.get(`${this.endpoint}/featured?limit=${limit}`);
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        // Update cache
        this.videosCache.featured = response.data.data;
        this.videosCache.timestamp = Date.now();
        
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching featured videos:', error);
      return [];
    }
  }
  
  /**
   * Get videos by category
   * @param {string} category - Video category
   * @param {number} limit - Maximum number of videos to return
   * @returns {Promise<Array>} - Array of videos in the category
   */
  async getVideosByCategory(category, limit = 10) {
    try {
      // Check cache first
      if (this.isCacheValid() && this.videosCache.byCategory[category]) {
        return this.videosCache.byCategory[category].slice(0, limit);
      }
      
      // Make API request
      const response = await http.get(`${this.endpoint}/category/${category}?limit=${limit}`);
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        // Update cache
        this.videosCache.byCategory[category] = response.data.data;
        this.videosCache.timestamp = Date.now();
        
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching videos for category ${category}:`, error);
      return [];
    }
  }
  
  /**
   * Get videos related to a specific dealer
   * @param {string} dealerId - Dealer ID
   * @param {number} limit - Maximum number of videos to return
   * @returns {Promise<Array>} - Array of videos related to the dealer
   */
  async getVideosByDealer(dealerId, limit = 10) {
    try {
      // Check cache first
      if (this.isCacheValid() && this.videosCache.byProvider[dealerId]) {
        return this.videosCache.byProvider[dealerId].slice(0, limit);
      }
      
      // Make API request
      const response = await http.get(`${this.endpoint}/dealer/${dealerId}?limit=${limit}`);
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        // Update cache
        this.videosCache.byProvider[dealerId] = response.data.data;
        this.videosCache.timestamp = Date.now();
        
        return response.data.data;
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching videos for dealer ${dealerId}:`, error);
      return [];
    }
  }
  
  /**
   * Get a single video by ID
   * @param {string} id - Video ID
   * @returns {Promise<Object|null>} - Video object or null if not found
   */
  async getVideo(id) {
    try {
      // Make API request
      const response = await http.get(`${this.endpoint}/${id}`);
      
      if (response.data?.data) {
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching video ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Create a new video - UPDATED FOR S3 THUMBNAILS
   * @param {Object} data - Video data
   * @returns {Promise<Object>} - Created video
   */
  async createVideo(data) {
    try {
      console.log('videoService creating video with data:', data);
      
      // Ensure we have the required fields
      if (!data.title) throw new Error('Video title is required');
      if (!data.youtubeUrl) throw new Error('YouTube URL is required');
      if (!data.category) throw new Error('Video category is required');
      
      if (!data.youtubeVideoId) {
        // Try to extract ID if not provided
        data.youtubeVideoId = this.extractYouTubeId(data.youtubeUrl);
        if (!data.youtubeVideoId) {
          throw new Error('Could not extract valid YouTube video ID');
        }
      }
      
      // Thumbnail URL will be handled by S3 if a custom thumbnail is uploaded
      // Otherwise, use YouTube's default thumbnail
      if (!data.thumbnailUrl && !data.customThumbnail) {
        data.thumbnailUrl = `https://img.youtube.com/vi/${data.youtubeVideoId}/maxresdefault.jpg`;
      }
      
      // If custom thumbnail is provided, it will be handled by multipart upload
      let formData;
      let headers = {};
      
      if (data.customThumbnail instanceof File) {
        formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (key === 'customThumbnail') {
            formData.append('thumbnail', value);
          } else if (value !== null && value !== undefined) {
            formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
          }
        });
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        headers['Content-Type'] = 'application/json';
      }
      
      // Make the API request
      const response = await http.post(
        this.endpoint, 
        formData || data,
        { headers }
      );
      
      // Clear caches after creating a new video
      this.clearCache();
      
      if (response.data?.data) {
        return response.data.data;
      }
      
      throw new Error(response.data?.message || 'Failed to create video');
    } catch (error) {
      console.error('Error creating video:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing video - UPDATED FOR S3 THUMBNAILS
   * @param {string} id - Video ID
   * @param {Object} data - Updated video data
   * @returns {Promise<Object>} - Updated video
   */
  async updateVideo(id, data) {
    try {
      // Ensure YouTube video ID is present
      if (data.youtubeUrl && !data.youtubeVideoId) {
        data.youtubeVideoId = this.extractYouTubeId(data.youtubeUrl);
      }
      
      // Handle custom thumbnail upload
      let formData;
      let headers = {};
      
      if (data.customThumbnail instanceof File) {
        formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (key === 'customThumbnail') {
            formData.append('thumbnail', value);
          } else if (value !== null && value !== undefined) {
            formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
          }
        });
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        headers['Content-Type'] = 'application/json';
      }
      
      const response = await http.put(
        `${this.endpoint}/${id}`,
        formData || data,
        { headers }
      );
      
      // Clear caches after updating a video
      this.clearCache();
      
      if (response.data?.data) {
        return response.data.data;
      }
      
      throw new Error(response.data?.message || 'Failed to update video');
    } catch (error) {
      console.error(`Error updating video ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a video
   * @param {string} id - Video ID
   * @returns {Promise<Object>} - Response data
   */
  async deleteVideo(id) {
    try {
      const response = await http.delete(`${this.endpoint}/${id}`);
      
      // Clear caches after deleting a video
      this.clearCache();
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting video ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Toggle featured status of a video
   * @param {string} id - Video ID
   * @returns {Promise<Object>} - Updated video
   */
  async toggleFeatured(id) {
    try {
      const response = await http.patch(`${this.endpoint}/${id}/featured`);
      
      // Clear featured cache
      this.clearCache('featured');
      
      return response.data;
    } catch (error) {
      console.error(`Error toggling featured status for video ${id}:`, error);
      throw error;
    }
  }
}

export const videoService = new VideoService();