// src/services/imageService.js
import axios from '../config/axios.js';

class ImageService {
  constructor() {
    // Use relative endpoints since axios likely has baseURL configured
    this.endpoint = '/images';
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
   * Upload a single image to S3
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
 * FIXED: Upload multiple images with correct response handling
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
  console.log(`Attempting to upload ${files.length} files to ${this.endpoint}/upload/multiple`);
  
  // FIXED: Handle files correctly with proper field names
  let validFilesCount = 0;
  files.forEach((file, index) => {
    // If the file is already a File object, use it directly
    // Otherwise, if it has a 'file' property (from the modal), use that
    const fileObj = file instanceof File ? file : file.file;
    
    if (fileObj instanceof File) {
      // FIXED: Use correct field names (image1, image2, etc.)
      formData.append(`image${index + 1}`, fileObj);
      console.log(`Appending file ${index + 1}: ${fileObj.name}, ${fileObj.size} bytes`);
      validFilesCount++;
    } else {
      console.error(`Invalid file object at index ${index}:`, file);
    }
  });
  
  if (validFilesCount === 0) {
    console.error('No valid files to upload!');
    throw new Error('No valid files to upload');
  }
  
  formData.append('folder', folder);

  try {
    // Log formData entries to verify contents
    console.log('FormData contents:');
    try {
      for (let pair of formData.entries()) {
        if (pair[0].startsWith('image')) {
          console.log(`${pair[0]}: File(${pair[1].name}, ${pair[1].size} bytes)`);
        } else {
          console.log(`${pair[0]}: ${pair[1]}`);
        }
      }
    } catch (err) {
      console.warn('Error logging form data:', err);
    }

    // Use axios to upload
    const token = localStorage.getItem('token');
    const endpoint = `${this.endpoint}/upload/multiple`;
    
    console.log(`Sending request to: ${endpoint}`);
    
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

    console.log('✅ Upload successful, server response:', response.data);

    // FIXED: Return the images array from the API response
    // Multiple upload API returns images in 'images' field, not 'data' field
    if (!response.data.images || !Array.isArray(response.data.images)) {
      console.error('API returned success but no images array:', response.data);
      throw new Error('API returned invalid response format');
    }
    
    return response.data.images; // ← FIXED: Use images field, not data field
    
  } catch (error) {
    console.error('❌ Multiple image upload failed:', error);
    
    // Don't create fallback URLs - let the error bubble up
    throw new Error(`Multiple image upload failed: ${error.response?.data?.message || error.message}`);
  }
}

  /**
   * Delete an image
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
   * Check service health
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
}

export const imageService = new ImageService();