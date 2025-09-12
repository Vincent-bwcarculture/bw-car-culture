// client/src/components/profile/ArticleManagement/hooks/useArticleOperations.js
// UPDATED VERSION - Enhanced with multiple image support while preserving all existing functionality

import { useState, useCallback } from 'react';
import { defaultArticleForm, VIEWS } from '../utils/constants.js';
import { useAuth } from '../../../../context/AuthContext.js';

/**
 * Custom hook for managing article operations with REAL API calls and MULTIPLE IMAGE support
 * @param {Function} addArticle - Function to add article
 * @param {Function} updateArticle - Function to update article
 * @param {Function} deleteArticle - Function to delete article
 * @param {Function} refreshData - Function to refresh data
 * @returns {Object} Operations and form state
 */
export const useArticleOperations = ({ addArticle, updateArticle, deleteArticle, refreshData }) => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState(VIEWS.DASHBOARD);
  const [editingArticle, setEditingArticle] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  
  // Form state
  const [articleForm, setArticleForm] = useState(defaultArticleForm);
  const [formErrors, setFormErrors] = useState({});
  const [featuredImageFile, setFeaturedImageFile] = useState(null); // For real file upload

  // NEW: Enhanced image state for multiple images
  const [galleryImageFiles, setGalleryImageFiles] = useState([]); // NEW: Support multiple images
  const [imageUploadProgress, setImageUploadProgress] = useState({}); // NEW: Track upload progress

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  /**
   * Navigate to create new article
   */
  const handleCreateNew = useCallback(() => {
    console.log('Creating new article...');
    setArticleForm(defaultArticleForm);
    setFormErrors({});
    setEditingArticle(null);
    setIsCreating(true);
    setSaveStatus(null);
    setFeaturedImageFile(null);
    setGalleryImageFiles([]); // NEW: Reset gallery images
    setImageUploadProgress({}); // NEW: Reset progress
    setActiveView(VIEWS.EDITOR);
  }, []);

  /**
   * Navigate to edit existing article
   * @param {Object} article - Article to edit
   */
  const handleEdit = (article) => {
    console.log('Editing article:', article.title);
    setArticleForm({
      title: article.title,
      subtitle: article.subtitle || '',
      content: article.content,
      category: article.category,
      tags: article.tags || [],
      featuredImage: article.featuredImage?.url || article.featuredImage, // Support both URL and object
      status: article.status,
      publishDate: article.publishDate,
      metaTitle: article.metaTitle || '',
      metaDescription: article.metaDescription || '',
      authorNotes: article.authorNotes || '',
      isPremium: article.isPremium || false,
      earningsEnabled: article.earningsEnabled !== false,
      trackEngagement: article.trackEngagement !== false,
      allowComments: article.allowComments !== false,
      allowSharing: article.allowSharing !== false
    });
    setEditingArticle(article);
    setFormErrors({});
    setIsCreating(false);
    setSaveStatus(null);
    setFeaturedImageFile(null); // Clear file input when editing
    setGalleryImageFiles([]); // NEW: Reset gallery when editing
    setImageUploadProgress({}); // NEW: Reset progress
    setActiveView(VIEWS.EDITOR);
  };

  /**
   * Enhanced validation with better error messages
   * @param {boolean} publishNow - Whether article is being published
   * @returns {Object} Validation errors
   */
  const validateForm = (publishNow = false) => {
    const errors = {};
    
    // Title validation
    if (!articleForm.title.trim()) {
      errors.title = 'Title is required';
    } else if (articleForm.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters long';
    } else if (articleForm.title.trim().length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }
    
    // Content validation
    if (!articleForm.content.trim()) {
      errors.content = 'Content is required';
    } else if (articleForm.content.trim().length < 50) {
      errors.content = 'Content must be at least 50 characters long';
    }
    
    // Subtitle validation for publishing
    if (publishNow && !articleForm.subtitle.trim()) {
      errors.subtitle = 'Subtitle is required for publishing';
    } else if (articleForm.subtitle && articleForm.subtitle.length > 200) {
      errors.subtitle = 'Subtitle must be less than 200 characters';
    }

    // Category validation
    if (!articleForm.category) {
      errors.category = 'Please select a category';
    }

    // SEO validation for published articles
    if (publishNow) {
      if (articleForm.metaTitle && articleForm.metaTitle.length > 60) {
        errors.metaTitle = 'Meta title should be less than 60 characters for better SEO';
      }
      if (articleForm.metaDescription && articleForm.metaDescription.length > 160) {
        errors.metaDescription = 'Meta description should be less than 160 characters for better SEO';
      }
    }

    return errors;
  };

  /**
   * ENHANCED: Save article via API with proper FormData handling for multiple images
   * @param {boolean} publishNow - Whether to publish immediately
   */
  const handleSave = async (publishNow = false) => {
    try {
      setSaving(true);
      setSaveStatus(null);
      setFormErrors({});

      const action = publishNow ? 'Publishing' : 'Saving';
      console.log(`${action} article:`, articleForm.title);

      // Validate form
      const errors = validateForm(publishNow);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setSaveStatus('error');
        
        // Focus on first error field
        const firstErrorField = Object.keys(errors)[0];
        setTimeout(() => {
          const errorElement = document.querySelector(`[name="${firstErrorField}"], .${firstErrorField}`);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorElement.focus();
          }
        }, 100);
        
        return;
      }

      // Prepare article data for API
      const articleData = {
        ...articleForm,
        status: publishNow ? 'published' : articleForm.status,
        publishDate: publishNow ? new Date().toISOString() : articleForm.publishDate,
        authorId: user?.id || user?._id,
        authorName: user?.name || 'Anonymous User'
      };

      // ENHANCED: Add image files for upload
      if (featuredImageFile) {
        articleData.featuredImageFile = featuredImageFile;
      }

      // NEW: Add gallery image files if any
      if (galleryImageFiles.length > 0) {
        articleData.galleryImageFiles = galleryImageFiles;
      }

      // Add default metadata if not provided
      if (!articleData.metaTitle) {
        articleData.metaTitle = articleData.title;
      }
      if (!articleData.metaDescription && articleData.subtitle) {
        articleData.metaDescription = articleData.subtitle;
      }

      console.log('Submitting article with images...');
      console.log('Featured image:', featuredImageFile ? featuredImageFile.name : 'None');
      console.log('Gallery images:', galleryImageFiles.length);

      // Call the appropriate API function
      let result;
      if (editingArticle) {
        result = await updateArticle(editingArticle._id || editingArticle.id, articleData);
        console.log('Article updated successfully');
      } else {
        result = await addArticle(articleData);
        console.log('New article created successfully');
      }

      setSaveStatus('success');
      
      // Clear image files after successful save
      setFeaturedImageFile(null);
      setGalleryImageFiles([]); // NEW: Clear gallery files
      setImageUploadProgress({}); // NEW: Clear progress
      
      // Show success message
      const actionPastTense = publishNow ? 'published' : 'saved';
      setTimeout(() => {
        alert(`Article "${articleForm.title}" ${actionPastTense} successfully!`);
      }, 500);
      
      // Navigate back to list after a brief delay
      setTimeout(() => {
        setActiveView(VIEWS.LIST);
      }, 1500);
      
    } catch (error) {
      console.error('Failed to save article:', error);
      setFormErrors({ 
        general: error.message || 'Failed to save article. Please try again.' 
      });
      setSaveStatus('error');
      
      // Show error alert
      setTimeout(() => {
        alert(`Failed to save article: ${error.message}`);
      }, 500);
      
    } finally {
      setSaving(false);
    }
  };

  /**
   * Delete article with enhanced confirmation
   * @param {string} articleId - Article ID to delete
   */
  const handleDelete = async (articleId) => {
    try {
      // Find the article title for confirmation
      const articleToDelete = document.querySelector(`[data-article-id="${articleId}"]`);
      const articleTitle = articleToDelete?.getAttribute('data-article-title') || 'this article';
      
      const confirmMessage = `Are you sure you want to delete "${articleTitle}"?\n\nThis action cannot be undone and will permanently remove the article from your account.`;
      
      if (!window.confirm(confirmMessage)) return;

      console.log('Deleting article via API:', articleId);
      await deleteArticle(articleId);
      
      alert('Article deleted successfully!');
      console.log('Article deleted:', articleId);
      
    } catch (error) {
      console.error('Failed to delete article:', error);
      alert(`Failed to delete article: ${error.message}`);
    }
  };

  /**
   * EXISTING: Handle featured image upload with real file handling (UNCHANGED)
   * @param {Event} event - File input change event
   */
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, GIF, WebP, etc.)');
      return;
    }

    // Validate file size (10MB limit for high quality images)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('Image size must be less than 10MB. Please choose a smaller image or compress it.');
      return;
    }

    try {
      console.log('Selected featured image:', file.name, `${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Store the file for upload when saving
      setFeaturedImageFile(file);
      
      // Create a preview URL for the form
      const previewUrl = URL.createObjectURL(file);
      setArticleForm(prev => ({ 
        ...prev, 
        featuredImage: previewUrl 
      }));
      
      console.log('Featured image ready for upload');
      
    } catch (error) {
      console.error('Error handling image:', error);
      alert('Failed to process image. Please try again.');
    }
  };

  /**
   * NEW: Handle multiple gallery images upload
   * @param {Event} event - File input change event
   */
  const handleGalleryImagesUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validate file count (max 9 gallery images + 1 featured = 10 total)
    const maxGalleryImages = 9;
    
    if (galleryImageFiles.length + files.length > maxGalleryImages) {
      alert(`You can upload maximum ${maxGalleryImages} gallery images. Current: ${galleryImageFiles.length}, Trying to add: ${files.length}`);
      return;
    }

    const validFiles = [];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}" is not an image file. Skipping.`);
        continue;
      }

      // Validate file size
      if (file.size > maxSize) {
        alert(`"${file.name}" is larger than 10MB. Skipping.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    try {
      console.log(`Adding ${validFiles.length} gallery images`);
      
      // Add files to gallery
      setGalleryImageFiles(prev => [...prev, ...validFiles]);
      
      console.log('Gallery images ready for upload:', validFiles.map(f => f.name));
      
    } catch (error) {
      console.error('Error handling gallery images:', error);
      alert('Failed to process some images. Please try again.');
    }
  };

  /**
   * NEW: Remove gallery image
   * @param {number} index - Index of image to remove
   */
  const removeGalleryImage = (index) => {
    setGalleryImageFiles(prev => {
      const newFiles = [...prev];
      const removedFile = newFiles[index];
      
      // Clean up blob URL if it was created for preview
      if (removedFile && typeof removedFile === 'object') {
        const blobUrl = URL.createObjectURL(removedFile);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      }
      
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  /**
   * EXISTING: Add tag with duplicate checking and validation (UNCHANGED)
   * @param {string} tag - Tag to add
   */
  const addTag = (tag) => {
    if (!tag) return;
    
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return;
    
    // Validate tag format
    if (!/^[a-z0-9-_]+$/.test(cleanTag)) {
      alert('Tags can only contain letters, numbers, hyphens, and underscores');
      return;
    }
    
    if (cleanTag.length < 2) {
      alert('Tags must be at least 2 characters long');
      return;
    }
    
    if (cleanTag.length > 20) {
      alert('Tags must be less than 20 characters long');
      return;
    }
    
    if (articleForm.tags.includes(cleanTag)) {
      alert('This tag has already been added');
      return;
    }
    
    if (articleForm.tags.length >= 10) {
      alert('Maximum 10 tags allowed');
      return;
    }
    
    setArticleForm(prev => ({
      ...prev,
      tags: [...prev.tags, cleanTag]
    }));
    
    console.log('Tag added:', cleanTag);
  };

  /**
   * EXISTING: Remove tag from article form (UNCHANGED)
   * @param {string} tagToRemove - Tag to remove
   */
  const removeTag = (tagToRemove) => {
    setArticleForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    
    console.log('Tag removed:', tagToRemove);
  };

  /**
   * EXISTING: Navigate to different views (UNCHANGED)
   * @param {string} view - View to navigate to
   */
  const navigateToView = (view) => {
    setActiveView(view);
  };

  /**
   * ENHANCED: Cancel editing and go back with proper cleanup
   */
  const handleCancel = () => {
    // Clean up preview URLs if they exist
    if (articleForm.featuredImage && articleForm.featuredImage.startsWith('blob:')) {
      URL.revokeObjectURL(articleForm.featuredImage);
    }
    
    // NEW: Clean up gallery image blob URLs
    galleryImageFiles.forEach(file => {
      if (file && typeof file === 'object') {
        const blobUrl = URL.createObjectURL(file);
        URL.revokeObjectURL(blobUrl);
      }
    });
    
    const targetView = editingArticle ? VIEWS.LIST : VIEWS.DASHBOARD;
    setActiveView(targetView);
    setEditingArticle(null);
    setIsCreating(false);
    setArticleForm(defaultArticleForm);
    setFormErrors({});
    setFeaturedImageFile(null);
    setGalleryImageFiles([]); // NEW: Clear gallery files
    setImageUploadProgress({}); // NEW: Clear progress
    setSaveStatus(null);
  };

  /**
   * EXISTING: Filter articles based on search and filters (UNCHANGED)
   * @param {Array} articles - Articles to filter
   * @returns {Array} Filtered articles
   */
  const getFilteredArticles = (articles) => {
    return articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (article.tags && article.tags.some(tag => 
                             tag.toLowerCase().includes(searchTerm.toLowerCase())
                           ));
      const matchesStatus = selectedStatus === 'all' || article.status === selectedStatus;
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  };

  return {
    // View state (UNCHANGED)
    activeView,
    navigateToView,
    
    // Form state (ENHANCED with new image fields)
    articleForm,
    setArticleForm,
    formErrors,
    saving,
    saveStatus,
    editingArticle,
    isCreating,
    featuredImageFile,
    galleryImageFiles, // NEW
    imageUploadProgress, // NEW
    
    // Search and filter state (UNCHANGED)
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    selectedCategory,
    setSelectedCategory,
    
    // Operations (ENHANCED with new image functions)
    handleCreateNew,
    handleEdit,
    handleSave, // ENHANCED
    handleDelete,
    handleCancel, // ENHANCED
    handleImageUpload, // UNCHANGED
    handleGalleryImagesUpload, // NEW
    removeGalleryImage, // NEW
    addTag,
    removeTag,
    getFilteredArticles
  };
};

export default useArticleOperations;
