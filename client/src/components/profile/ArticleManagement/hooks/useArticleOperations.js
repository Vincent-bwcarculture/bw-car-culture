// client/src/components/profile/ArticleManagement/hooks/useArticleOperations.js
// COMPLETE VERSION - All fixes integrated including filtering and error handling

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

  // COMPLETE: Enhanced handleSave function with comprehensive debugging and error handling
  const handleSave = async (publishNow = false) => {
    try {
      console.log('🚀 STARTING ARTICLE SAVE...');
      setSaving(true);
      setSaveStatus(null);
      setFormErrors({});

      const errors = validateForm(publishNow);
      if (Object.keys(errors).length > 0) {
        console.log('❌ Form validation failed:', errors);
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
        console.log('📷 Featured image added:', featuredImageFile.name);
      }

      // Add gallery images
      if (galleryImages.length > 0) {
        articleData.galleryImageFiles = galleryImages.map(img => img.file);
        console.log('🖼️ Gallery images added:', galleryImages.length);
      }

      console.log('📤 Submitting article data:', {
        title: articleData.title,
        category: articleData.category,
        status: articleData.status,
        hasImages: !!featuredImageFile,
        galleryCount: galleryImages.length,
        authorId: articleData.authorId
      });

      let result;
      
      try {
        if (editingArticle) {
          console.log('📝 Updating existing article:', editingArticle._id || editingArticle.id);
          result = await updateArticle(editingArticle._id || editingArticle.id, articleData);
        } else {
          console.log('➕ Creating new article...');
          result = await addArticle(articleData);
        }

        console.log('✅ API Response received:', result);

        // Verify result structure
        if (!result) {
          throw new Error('No response received from server');
        }

        // Log result details
        console.log('📊 Result details:', {
          hasId: !!(result._id || result.id),
          status: result.status,
          title: result.title,
          createdAt: result.createdAt
        });

        setSaveStatus('success');
        setFeaturedImageFile(null);
        setGalleryImages([]);
        
        const actionPastTense = publishNow ? 'published' : 'saved';
        
        // Show success message
        setTimeout(() => {
          try {
            alert(`✅ Article "${articleForm.title}" ${actionPastTense} successfully!\n\nID: ${result._id || result.id || 'Unknown'}`);
          } catch (alertError) {
            console.warn('Alert failed:', alertError);
          }
        }, 500);
        
        // Navigate after success
        setTimeout(() => {
          try {
            setActiveView(VIEWS.LIST);
          } catch (navigationError) {
            console.error('Navigation failed:', navigationError);
          }
        }, 1500);
        
      } catch (apiError) {
        console.error('❌ API call failed:', apiError);
        
        // Enhanced error logging
        console.log('🔍 Error details:', {
          message: apiError.message,
          status: apiError.response?.status,
          data: apiError.response?.data,
          isHTML: typeof apiError.response?.data === 'string' && apiError.response?.data.includes('<!DOCTYPE')
        });
        
        let errorMessage = 'Failed to save article. Please try again.';
        
        if (apiError.message?.includes('HTML instead of JSON')) {
          errorMessage = 'API endpoint error. The server route may not exist.';
        } else if (apiError.response?.status === 404) {
          errorMessage = 'API endpoint not found. Please verify server routes are configured.';
        } else if (apiError.response?.status === 401) {
          errorMessage = 'Authentication failed. Please log in again.';
        } else if (apiError.response?.status === 403) {
          errorMessage = 'Permission denied. Check user role permissions.';
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
        
        setFormErrors({ general: errorMessage });
        setSaveStatus('error');
        
        alert(`❌ Error: ${errorMessage}`);
        throw apiError;
      }
      
    } catch (error) {
      console.error('❌ Outer catch - Article save failed:', error);
      
      if (!formErrors.general) {
        setFormErrors({ general: 'An unexpected error occurred. Check console for details.' });
      }
      setSaveStatus('error');
    } finally {
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

  // FIXED: Safe filter articles with comprehensive null checks
  const getFilteredArticles = (articles) => {
    if (!Array.isArray(articles)) {
      console.warn('getFilteredArticles: articles is not an array:', articles);
      return [];
    }

    try {
      return articles.filter(article => {
        if (!article) return false;
        
        // Safe search matching
        const matchesSearch = (() => {
          if (!searchTerm || searchTerm.trim() === '') return true;
          
          try {
            const searchLower = searchTerm.toLowerCase();
            
            const titleMatch = (article.title && typeof article.title === 'string') ? 
              article.title.toLowerCase().includes(searchLower) : false;
            
            const contentMatch = (article.content && typeof article.content === 'string') ? 
              article.content.toLowerCase().includes(searchLower) : false;
            
            const tagsMatch = (article.tags && Array.isArray(article.tags)) ? 
              article.tags.some(tag => tag && typeof tag === 'string' && tag.toLowerCase().includes(searchLower)) : false;
            
            return titleMatch || contentMatch || tagsMatch;
          } catch (searchError) {
            console.warn('Search error for article:', article._id, searchError);
            return false;
          }
        })();
        
        const matchesStatus = !selectedStatus || selectedStatus === 'all' || article.status === selectedStatus;
        const matchesCategory = !selectedCategory || selectedCategory === 'all' || article.category === selectedCategory;
        
        return matchesSearch && matchesStatus && matchesCategory;
      });
    } catch (error) {
      console.error('Error in getFilteredArticles:', error);
      return articles || [];
    }
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