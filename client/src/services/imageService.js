// src/services/imageService.js - Fixed with correct method name
import axios from '../config/axios.js';

class ImageService {
  constructor() {
    // Use relative endpoints since axios likely has baseURL configured
    this.endpoint = '/images';
    this.userEndpoint = '/api/user'; // For user-specific uploads
    this.baseUrl = process.env.REACT_APP_API_URL || '';
  }

  // Get auth headers - Updated to support FormData properly
  getHeaders(isFormData = false) {
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': token ? `Bearer ${token}` : ''
    };
    
    // Don't set Content-Type for FormData requests as axios will add it with the boundary
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
      headers['Cache-Control'] = 'no-cache';
    }
    
    return headers;
  }

  /**
   * Upload a single image to S3 (EXISTING METHOD - PRESERVED)
   * @param {File} file - The image file to upload
   * @param {string} folder - The S3 folder to upload to
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - Upload result with S3 URL and metadata
   */
  async uploadImage(file, folder = 'general', onProgress) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    try {
      console.log(`Uploading single image to: ${this.endpoint}/upload`);
      console.log(`File details: ${file.name}, ${file.type}, ${file.size} bytes`);
      
      const response = await axios.post(`${this.endpoint}/upload`, formData, {
        headers: {
          ...this.getHeaders(true)
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress?.(progress);
        }
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Image upload failed');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error(`Image upload failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * ENHANCED: Upload multiple images with admin/dealer endpoint (EXISTING FUNCTIONALITY PRESERVED)
   * @param {File[]} files - Array of image files
   * @param {string} folder - The S3 folder to upload to
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object[]>} - Array of upload results
   */
  async uploadMultiple(files, folder = 'general', onProgress) {
    if (!files || files.length === 0) {
      console.error('No valid files to upload');
      throw new Error('No valid files to upload');
    }
    
    const formData = new FormData();
    
    // Debug information
    console.log(`🖼️ ImageService: Uploading ${files.length} files to ${this.endpoint}/upload/multiple (admin/dealer endpoint)`);
    
    // PRESERVED: Handle files correctly with proper field names
    let validFilesCount = 0;
    files.forEach((file, index) => {
      // If the file is already a File object, use it directly
      // Otherwise, if it has a 'file' property (from the modal), use that
      const fileObj = file instanceof File ? file : file.file;
      
      if (fileObj instanceof File) {
        // PRESERVED: Use correct field names (image1, image2, etc.)
        formData.append(`image${index + 1}`, fileObj);
        console.log(`🖼️ Appending file ${index + 1}: ${fileObj.name}, ${fileObj.size} bytes`);
        validFilesCount++;
      } else {
        console.error(`🖼️ Invalid file object at index ${index}:`, file);
      }
    });
    
    if (validFilesCount === 0) {
      console.error('🖼️ No valid files to upload!');
      throw new Error('No valid files to upload');
    }
    
    formData.append('folder', folder);

    try {
      // Log formData entries to verify contents
      console.log('🖼️ FormData contents:');
      try {
        for (let pair of formData.entries()) {
          if (pair[0].startsWith('image')) {
            console.log(`🖼️ ${pair[0]}: File(${pair[1].name}, ${pair[1].size} bytes)`);
          } else {
            console.log(`🖼️ ${pair[0]}: ${pair[1]}`);
          }
        }
      } catch (err) {
        console.warn('🖼️ Error logging form data:', err);
      }

      // Use axios to upload
      const token = localStorage.getItem('token');
      const endpoint = `${this.endpoint}/upload/multiple`;
      
      console.log(`🖼️ Sending request to: ${endpoint}`);
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // Don't set Content-Type, let axios handle it for FormData
        },
        timeout: 300000, // 5 minutes timeout for large uploads
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress?.(progress);
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Multiple image upload failed');
      }

      console.log('🖼️ ✅ Upload successful, server response:', response.data);

      // PRESERVED: Return the images array from the API response
      // Multiple upload API returns images in 'images' field, not 'data' field
      if (!response.data.images || !Array.isArray(response.data.images)) {
        console.error('🖼️ API returned success but no images array:', response.data);
        throw new Error('API returned invalid response format');
      }
      
      return response.data.images; // ← PRESERVED: Use images field, not data field
      
    } catch (error) {
      console.error('🖼️ ❌ Multiple image upload failed:', error);
      
      // Don't create fallback URLs - let the error bubble up
      throw new Error(`Multiple image upload failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * FIXED: Upload multiple images for USER LISTINGS specifically
   * This method name matches what the form is calling
   * @param {File[]} files - Array of image files
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object[]>} - Array of upload results
   */
  async uploadForUserListing(files, onProgress) {
    if (!files || files.length === 0) {
      console.error('🖼️ USER: No valid files to upload');
      throw new Error('No valid files to upload');
    }
    
    console.log(`🖼️ USER: Starting upload of ${files.length} files for user listings`);
    
    // Validate each file
    const validFiles = files.filter((file, index) => {
      // Extract the actual File object
      const fileObj = file instanceof File ? file : file.file;
      
      if (!(fileObj instanceof File)) {
        console.warn(`🖼️ USER: Skipping invalid file at index ${index}:`, typeof fileObj);
        return false;
      }

      if (!fileObj.type.startsWith('image/')) {
        console.warn(`🖼️ USER: Skipping non-image file: ${fileObj.name} (${fileObj.type})`);
        return false;
      }

      if (fileObj.size > 8 * 1024 * 1024) { // 8MB limit for user uploads
        console.warn(`🖼️ USER: Skipping oversized file: ${fileObj.name} (${(fileObj.size / 1024 / 1024).toFixed(2)}MB)`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      throw new Error('No valid image files found');
    }

    console.log(`🖼️ USER: Processing ${validFiles.length} valid files out of ${files.length} total`);

    // Create FormData for user endpoint
    const formData = new FormData();
    
    validFiles.forEach((file, index) => {
      const fileObj = file instanceof File ? file : file.file;
      formData.append(`image${index + 1}`, fileObj);
      console.log(`🖼️ USER: Appending file ${index + 1}: ${fileObj.name}, ${fileObj.size} bytes`);
    });

    // Add folder parameter for S3 organization
    formData.append('folder', 'user-listings');

    try {
      const token = localStorage.getItem('token');
      const endpoint = `${this.userEndpoint}/upload-images`;
      
      console.log(`🖼️ USER: Sending request to: ${endpoint}`);
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // Don't set Content-Type, let axios handle it for FormData
        },
        timeout: 300000, // 5 minutes timeout for large uploads
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress?.(progress);
        }
      });

      console.log(`🖼️ USER: Server response status: ${response.status}`);
      console.log(`🖼️ USER: Server response:`, response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'User image upload failed');
      }

      if (!response.data.images || !Array.isArray(response.data.images)) {
        throw new Error('Invalid response format - missing images array');
      }

      console.log(`🖼️ USER: ✅ Successfully uploaded ${response.data.images.length} images`);

      // Return standardized format
      return response.data.images.map((image, index) => ({
        url: image.url,
        key: image.key,
        thumbnail: image.thumbnail || image.url,
        size: image.size,
        mimetype: image.mimetype,
        isPrimary: image.isPrimary || index === 0,
        mock: image.mock || false
      }));

    } catch (error) {
      console.error(`🖼️ USER: ❌ Upload failed:`, error);
      
      // Enhanced error handling
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed - please login again');
      }

      throw new Error(`User image upload failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Delete an image (EXISTING METHOD - PRESERVED)
   * @param {string} key - The S3 key or URL of the image to delete
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteImage(key) {
    try {
      const response = await axios.delete(`${this.endpoint}/delete`, {
        data: { url: key, withThumbnail: true },
        headers: this.getHeaders()
      });

      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Image deletion failed');
      }
    } catch (error) {
      console.error('Image deletion failed:', error);
      throw error;
    }
  }

  /**
   * Check service health (EXISTING METHOD - PRESERVED)
   * @returns {Promise<Object>} - Health status
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.endpoint}/health`);
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate image file for user uploads
   * @param {File} file - File object
   * @returns {Object} Validation result
   */
  validateImageForUser(file) {
    const errors = [];
    
    if (!(file instanceof File)) {
      errors.push('Invalid file object');
    }

    if (!file.type.startsWith('image/')) {
      errors.push('File must be an image');
    }

    if (file.size > 8 * 1024 * 1024) { // 8MB limit
      errors.push('File size must be less than 8MB');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Create and export as named export to match existing imports
export const imageService = new ImageService();

// Also export as default for backward compatibility
export default imageService;