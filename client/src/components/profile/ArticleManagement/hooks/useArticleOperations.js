// client/src/components/profile/ArticleManagement/hooks/useArticleOperations.js
// Custom hook for managing article CRUD operations and form state

import { useState } from 'react';
import { defaultArticleForm, VIEWS } from '../utils/constants.js';
import { useAuth } from '../../../../context/AuthContext.js';

/**
 * Custom hook for managing article operations, form state, and navigation
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
  
  // Form state
  const [articleForm, setArticleForm] = useState(defaultArticleForm);
  const [formErrors, setFormErrors] = useState({});

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  /**
   * Navigate to create new article
   */
  const handleCreateNew = () => {
    setArticleForm(defaultArticleForm);
    setFormErrors({});
    setEditingArticle(null);
    setIsCreating(true);
    setActiveView(VIEWS.EDITOR);
  };

  /**
   * Navigate to edit existing article
   * @param {Object} article - Article to edit
   */
  const handleEdit = (article) => {
    setArticleForm({
      title: article.title,
      subtitle: article.subtitle || '',
      content: article.content,
      category: article.category,
      tags: article.tags || [],
      featuredImage: article.featuredImage,
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
    setActiveView(VIEWS.EDITOR);
  };

  /**
   * Validate article form
   * @param {boolean} publishNow - Whether article is being published
   * @returns {Object} Validation errors
   */
  const validateForm = (publishNow = false) => {
    const errors = {};
    
    if (!articleForm.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!articleForm.content.trim()) {
      errors.content = 'Content is required';
    }
    
    if (publishNow && !articleForm.subtitle.trim()) {
      errors.subtitle = 'Subtitle is required for publishing';
    }

    return errors;
  };

  /**
   * Save article (create or update)
   * @param {boolean} publishNow - Whether to publish immediately
   */
  const handleSave = async (publishNow = false) => {
    try {
      setSaving(true);
      setFormErrors({});

      // Validate form
      const errors = validateForm(publishNow);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const articleData = {
        ...articleForm,
        status: publishNow ? 'published' : articleForm.status,
        publishDate: publishNow ? new Date().toISOString() : articleForm.publishDate,
        authorId: user.id,
        authorName: user.name
      };

      if (editingArticle) {
        // Update existing article
        updateArticle(editingArticle.id, articleData);
      } else {
        // Create new article
        addArticle(articleData);
      }

      // Refresh stats and navigate back to list
      await refreshData();
      setActiveView(VIEWS.LIST);
      
    } catch (error) {
      console.error('Failed to save article:', error);
      setFormErrors({ general: 'Failed to save article. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Delete article with confirmation
   * @param {string} articleId - Article ID to delete
   */
  const handleDelete = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;

    try {
      deleteArticle(articleId);
      await refreshData();
    } catch (error) {
      console.error('Failed to delete article:', error);
      // In production, show error notification
    }
  };

  /**
   * Handle image upload
   * @param {Event} event - File input change event
   */
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      // In production, upload to AWS S3
      // const uploadResult = await uploadToS3(file);
      // setArticleForm(prev => ({ ...prev, featuredImage: uploadResult.url }));
      
      // Mock image upload for now
      const imageUrl = URL.createObjectURL(file);
      setArticleForm(prev => ({ ...prev, featuredImage: imageUrl }));
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  /**
   * Add tag to article form
   * @param {string} tag - Tag to add
   */
  const addTag = (tag) => {
    if (tag && !articleForm.tags.includes(tag)) {
      setArticleForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  /**
   * Remove tag from article form
   * @param {string} tagToRemove - Tag to remove
   */
  const removeTag = (tagToRemove) => {
    setArticleForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  /**
   * Navigate to different views
   * @param {string} view - View to navigate to
   */
  const navigateToView = (view) => {
    setActiveView(view);
  };

  /**
   * Cancel editing and go back
   */
  const handleCancel = () => {
    const targetView = editingArticle ? VIEWS.LIST : VIEWS.DASHBOARD;
    setActiveView(targetView);
    setEditingArticle(null);
    setIsCreating(false);
    setArticleForm(defaultArticleForm);
    setFormErrors({});
  };

  /**
   * Filter articles based on search and filters
   * @param {Array} articles - Articles to filter
   * @returns {Array} Filtered articles
   */
  const getFilteredArticles = (articles) => {
    return articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || article.status === selectedStatus;
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  };

  return {
    // View state
    activeView,
    navigateToView,
    
    // Form state
    articleForm,
    setArticleForm,
    formErrors,
    saving,
    editingArticle,
    isCreating,
    
    // Search and filter state
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    selectedCategory,
    setSelectedCategory,
    
    // Operations
    handleCreateNew,
    handleEdit,
    handleSave,
    handleDelete,
    handleCancel,
    handleImageUpload,
    addTag,
    removeTag,
    getFilteredArticles
  };
};

export default useArticleOperations;
