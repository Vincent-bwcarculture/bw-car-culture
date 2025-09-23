// client/src/components/profile/ArticleManagement/hooks/useArticleOperations.js
// FIXED VERSION - Enhanced error handling and using the same simple pattern as working UserCarListingForm

import { useState, useCallback } from 'react';
import { defaultArticleForm, VIEWS } from '../utils/constants.js';
import { useAuth } from '../../../../context/AuthContext.js';

export const useArticleOperations = ({ addArticle, updateArticle, deleteArticle, refreshData }) => {
  const { user } = useAuth();
  
  // View state
  const [activeView, setActiveView] = useState(VIEWS.DASHBOARD);
  const [editingArticle, setEditingArticle] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  
  // Form state
  const [articleForm, setArticleForm] = useState(defaultArticleForm);
  const [formErrors, setFormErrors] = useState({});
  const [featuredImageFile, setFeaturedImageFile] = useState(null);

  // SIMPLIFIED: Gallery images - using same pattern as UserCarListingForm
  const [galleryImages, setGalleryImages] = useState([]); // Array of {file, preview, name, size}

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Navigate to create new article
  const handleCreateNew = useCallback(() => {
    console.log('Creating new article...');
    setArticleForm(defaultArticleForm);
    setFormErrors({});
    setEditingArticle(null);
    setIsCreating(true);
    setSaveStatus(null);
    setFeaturedImageFile(null);
    setGalleryImages([]); // Reset gallery
    setActiveView(VIEWS.EDITOR);
  }, []);

  // Navigate to edit existing article
  const handleEdit = (article) => {
    console.log('Editing article:', article.title);
    setArticleForm({
      title: article.title,
      subtitle: article.subtitle || '',
      content: article.content,
      category: article.category,
      tags: article.tags || [],
      featuredImage: article.featuredImage?.url || article.featuredImage,
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
    setFeaturedImageFile(null);
    setGalleryImages([]); // Reset gallery when editing
    setActiveView(VIEWS.EDITOR);
  };

  // Form validation
  const validateForm = (publishNow = false) => {
    const errors = {};
    
    if (!articleForm.title.trim()) {
      errors.title = 'Title is required';
    } else if (articleForm.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters long';
    }
    
    if (!articleForm.content.trim()) {
      errors.content = 'Content is required';
    } else if (articleForm.content.trim().length < 50) {
      errors.content = 'Content must be at least 50 characters long';
    }
    
    if (publishNow && !articleForm.subtitle.trim()) {
      errors.subtitle = 'Subtitle is required for publishing';
    }

    if (!articleForm.category) {
      errors.category = 'Please select a category';
    }

    return errors;
  };

  // FIXED: Enhanced handleSave function with better error handling
  const handleSave = async (publishNow = false) => {
    try {
      setSaving(true);
      setSaveStatus(null);
      setFormErrors({});

      const errors = validateForm(publishNow);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setSaveStatus('error');
        return;
      }

      const articleData = {
        ...articleForm,
        status: publishNow ? 'published' : articleForm.status,
        publishDate: publishNow ? new Date().toISOString() : articleForm.publishDate,
        authorId: user?.id || user?._id,
        authorName: user?.name || 'Anonymous User'
      };

      // Add featured image
      if (featuredImageFile) {
        articleData.featuredImageFile = featuredImageFile;
      }

      // Add gallery images using same pattern as car listings
      if (galleryImages.length > 0) {
        articleData.galleryImageFiles = galleryImages.map(img => img.file);
      }

      console.log('Submitting article...', {
        title: articleData.title,
        featuredImage: !!featuredImageFile,
        galleryImages: galleryImages.length
      });

      let result;
      
      // FIXED: Enhanced error handling with detailed logging
      try {
        if (editingArticle) {
          console.log('Updating existing article:', editingArticle._id || editingArticle.id);
          result = await updateArticle(editingArticle._id || editingArticle.id, articleData);
        } else {
          console.log('Creating new article...');
          result = await addArticle(articleData);
        }

        // FIXED: Verify result before proceeding
        if (!result) {
          throw new Error('No response received from server');
        }

        console.log('Article operation successful:', result);
        
        setSaveStatus('success');
        setFeaturedImageFile(null);
        setGalleryImages([]);
        
        const actionPastTense = publishNow ? 'published' : 'saved';
        
        // FIXED: Better success notification
        setTimeout(() => {
          try {
            alert(`Article "${articleForm.title}" ${actionPastTense} successfully!`);
          } catch (alertError) {
            console.warn('Alert failed, using console:', alertError);
            console.log(`Article "${articleForm.title}" ${actionPastTense} successfully!`);
          }
        }, 500);
        
        // FIXED: Safe navigation with fallback
        setTimeout(() => {
          try {
            setActiveView(VIEWS.LIST);
          } catch (navigationError) {
            console.error('Navigation failed:', navigationError);
            // Force page refresh as fallback
            window.location.reload();
          }
        }, 1500);
        
      } catch (apiError) {
        console.error('API call failed:', apiError);
        
        // FIXED: Better error message handling
        let errorMessage = 'Failed to save article. Please try again.';
        
        if (apiError?.message) {
          errorMessage = apiError.message;
        } else if (apiError?.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError?.response?.status) {
          switch (apiError.response.status) {
            case 401:
              errorMessage = 'Authentication failed. Please log in again.';
              break;
            case 403:
              errorMessage = 'You do not have permission to save articles.';
              break;
            case 413:
              errorMessage = 'File too large. Please use smaller images.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = `Server error (${apiError.response.status}). Please try again.`;
          }
        }
        
        setFormErrors({ 
          general: errorMessage
        });
        setSaveStatus('error');
        
        // FIXED: Safe error notification
        try {
          alert(`Error: ${errorMessage}`);
        } catch (alertError) {
          console.warn('Alert failed, using console:', alertError);
          console.error('Save failed:', errorMessage);
        }
        
        throw apiError; // Re-throw for parent component handling
      }
      
    } catch (error) {
      console.error('Failed to save article (outer catch):', error);
      
      // FIXED: Fallback error handling
      if (!formErrors.general) {
        setFormErrors({ 
          general: 'An unexpected error occurred. Please try again.'
        });
      }
      setSaveStatus('error');
    } finally {
      // FIXED: Always reset saving state
      setSaving(false);
    }
  };

  // Delete article
  const handleDelete = async (articleId) => {
    try {
      const articleToDelete = document.querySelector(`[data-article-id="${articleId}"]`);
      const articleTitle = articleToDelete?.getAttribute('data-article-title') || 'this article';
      
      const confirmMessage = `Are you sure you want to delete "${articleTitle}"?\n\nThis action cannot be undone.`;
      
      if (!window.confirm(confirmMessage)) return;

      await deleteArticle(articleId);
      alert('Article deleted successfully!');
      
    } catch (error) {
      console.error('Failed to delete article:', error);
      alert(`Failed to delete article: ${error.message}`);
    }
  };

  // Handle featured image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, GIF, WebP, etc.)');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('Image size must be less than 10MB. Please choose a smaller image or compress it.');
      return;
    }

    try {
      console.log('Selected featured image:', file.name);
      setFeaturedImageFile(file);
      
      const previewUrl = URL.createObjectURL(file);
      setArticleForm(prev => ({ 
        ...prev, 
        featuredImage: previewUrl 
      }));
      
    } catch (error) {
      console.error('Error handling image:', error);
      alert('Failed to process image. Please try again.');
    }
  };

  // SIMPLIFIED: Handle gallery images - using exact same pattern as UserCarListingForm
  const handleGalleryImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 9) {
      alert('Maximum 9 gallery images allowed');
      return;
    }

    if (galleryImages.length + files.length > 9) {
      alert(`You can upload maximum 9 gallery images. Current: ${galleryImages.length}, Trying to add: ${files.length}`);
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    const invalidFiles = files.filter(file => 
      file.size > maxSize || !validTypes.includes(file.type.toLowerCase())
    );
    
    if (invalidFiles.length > 0) {
      alert('Some files are invalid. Use JPEG/PNG/WebP under 10MB each.');
      return;
    }

    console.log(`Selected ${files.length} gallery images`);
    
    // SAME PATTERN AS UserCarListingForm - create previews synchronously
    const newImages = files.map((file, index) => {
      return {
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      };
    });
    
    setGalleryImages(prev => [...prev, ...newImages]);
    
    // Clear input so same files can be selected again
    e.target.value = '';
    
    console.log(`${files.length} gallery images added. Total: ${galleryImages.length + files.length}`);
  };

  // SIMPLIFIED: Remove gallery image - same pattern as UserCarListingForm
  const removeGalleryImage = (index) => {
    setGalleryImages(prev => {
      if (index < 0 || index >= prev.length) return prev;
      
      // Clean up the preview URL
      if (prev[index] && prev[index].preview) {
        URL.revokeObjectURL(prev[index].preview);
      }
      
      const newImages = [...prev];
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Add tag
  const addTag = (tag) => {
    if (!tag) return;
    
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return;
    
    if (!/^[a-z0-9-_]+$/.test(cleanTag)) {
      alert('Tags can only contain letters, numbers, hyphens, and underscores');
      return;
    }
    
    if (cleanTag.length < 2) {
      alert('Tags must be at least 2 characters long');
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
  };

  // Remove tag
  const removeTag = (tagToRemove) => {
    setArticleForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Navigate to view
  const navigateToView = (view) => {
    setActiveView(view);
  };

  // Cancel editing
  const handleCancel = () => {
    // Clean up preview URLs
    if (articleForm.featuredImage && articleForm.featuredImage.startsWith('blob:')) {
      URL.revokeObjectURL(articleForm.featuredImage);
    }
    
    // Clean up gallery previews
    galleryImages.forEach(image => {
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }
    });
    
    const targetView = editingArticle ? VIEWS.LIST : VIEWS.DASHBOARD;
    setActiveView(targetView);
    setEditingArticle(null);
    setIsCreating(false);
    setArticleForm(defaultArticleForm);
    setFormErrors({});
    setFeaturedImageFile(null);
    setGalleryImages([]);
    setSaveStatus(null);
  };

  // Filter articles
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
    // View state
    activeView,
    navigateToView,
    
    // Form state - SIMPLIFIED
    articleForm,
    setArticleForm,
    formErrors,
    saving,
    saveStatus,
    editingArticle,
    isCreating,
    featuredImageFile,
    galleryImages,  // CHANGED: Simple array instead of complex state
    
    // Search and filter state
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    selectedCategory,
    setSelectedCategory,
    
    // Operations - SIMPLIFIED
    handleCreateNew,
    handleEdit,
    handleSave,
    handleDelete,
    handleCancel,
    handleImageUpload,
    handleGalleryImagesUpload,  // SIMPLIFIED
    removeGalleryImage,         // SIMPLIFIED
    addTag,
    removeTag,
    getFilteredArticles
  };
};

export default useArticleOperations;