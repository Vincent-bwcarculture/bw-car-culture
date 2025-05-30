// src/admin/ContentEditor/ContentEditorModal.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext.js';
import TabNavigation from '../ReviewModal/components/TabNavigation.js';
import ImageUpload from '../ReviewModal/components/ImageUpload.js';
import RatingInput from '../ReviewModal/components/RatingInput.js';
import '../ReviewModal/ReviewModal.css';
import './ContentEditorModal.css';

// Default states
const INITIAL_REVIEW_STATE = {
  title: '',
  subtitle: '',
  category: '',
  content: {
    introduction: '',
    exterior: '',
    interior: '',
    performance: '',
    technology: '',
    safety: '',
    efficiency: '',
    value: '',
    verdict: ''
  },
  tags: [],
  featuredImage: null,
  gallery: [],
  ratings: {
    design: 0,
    performance: 0,
    comfort: 0,
    technology: 0,
    efficiency: 0,
    value: 0,
    overall: 0
  },
  seo: {
    metaTitle: '',
    metaDescription: '',
    keywords: []
  },
  status: 'draft',
  publishDate: new Date().toISOString().split('T')[0]
};

const INITIAL_NEWS_STATE = {
  title: '',
  subtitle: '',
  category: 'news',
  content: '',
  tags: [],
  featuredImage: null,
  gallery: [],
  seo: {
    metaTitle: '',
    metaDescription: '',
    keywords: []
  },
  status: 'draft',
  publishDate: new Date().toISOString().split('T')[0],
  featured: false
};

const ContentEditorModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData = null,
  contentType = 'review' // can be 'review' or 'news'
}) => {
  const [formData, setFormData] = useState(
    initialData || (contentType === 'news' ? INITIAL_NEWS_STATE : INITIAL_REVIEW_STATE)
  );
  
  const [activeTab, setActiveTab] = useState('basic');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Define tabs based on content type
  const reviewTabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'content', label: 'Content' },
    { id: 'images', label: 'Images' },
    { id: 'ratings', label: 'Ratings' },
    { id: 'seo', label: 'SEO' }
  ];
  
  const newsTabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'content', label: 'Content' },
    { id: 'images', label: 'Images' },
    { id: 'seo', label: 'SEO' }
  ];

  const tabs = contentType === 'news' ? newsTabs : reviewTabs;

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(contentType === 'news' ? INITIAL_NEWS_STATE : INITIAL_REVIEW_STATE);
    }
    
    setErrors({});
    setActiveTab('basic');
  }, [isOpen, initialData, contentType]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const resetForm = () => {
    setFormData(contentType === 'news' ? INITIAL_NEWS_STATE : INITIAL_REVIEW_STATE);
    setErrors({});
    setActiveTab('basic');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    clearError(name);
  };

  const handleContentChange = (section, value) => {
    // For reviews, content is an object with sections
    if (contentType === 'review') {
      setFormData(prev => ({
        ...prev,
        content: {
          ...prev.content,
          [section]: value
        }
      }));
      clearError(`content.${section}`);
    } 
    // For news, content is a single string
    else {
      setFormData(prev => ({
        ...prev,
        content: value
      }));
      clearError('content');
    }
  };

  const handleRatingChange = (category, value) => {
    setFormData(prev => {
      const newRatings = {
        ...prev.ratings,
        [category]: value
      };

      // Calculate overall rating
      const ratings = Object.entries(newRatings)
        .filter(([key]) => key !== 'overall');
      const average = ratings.reduce((sum, [_, val]) => sum + val, 0) / ratings.length;
      
      return {
        ...prev,
        ratings: {
          ...newRatings,
          overall: Math.round(average * 10) / 10
        }
      };
    });
  };

  const handleImageUpload = async (files) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
    try {
      const validFiles = Array.from(files).filter(file => 
        validTypes.includes(file.type) && file.size <= maxSize
      );
  
      if (validFiles.length === 0) {
        throw new Error('Please upload valid image files (JPEG, PNG, or WebP, max 5MB)');
      }
  
      // Create object URLs for preview
      const newImages = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
  
      setFormData(prev => ({
        ...prev,
        featuredImage: prev.featuredImage || newImages[0],
        gallery: [...prev.gallery, ...newImages.slice(prev.featuredImage ? 0 : 1)]
      }));
  
      clearError('images');
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        images: error.message
      }));
    }
  };

  const handleRemoveImage = (index, type = 'gallery') => {
    setFormData(prev => {
      if (type === 'featured') {
        return {
          ...prev,
          featuredImage: null
        };
      }

      const newGallery = [...prev.gallery];
      
      // Revoke the object URL to prevent memory leaks
      if (newGallery[index] && newGallery[index].preview && typeof newGallery[index].preview === 'string') {
        URL.revokeObjectURL(newGallery[index].preview);
      }
      
      newGallery.splice(index, 1);
      return {
        ...prev,
        gallery: newGallery
      };
    });
  };

  const handleSetFeatured = (index) => {
    setFormData(prev => {
      const newFeatured = prev.gallery[index];
      const newGallery = [...prev.gallery];
      newGallery.splice(index, 1);

      if (prev.featuredImage) {
        newGallery.unshift(prev.featuredImage);
      }

      return {
        ...prev,
        featuredImage: newFeatured,
        gallery: newGallery
      };
    });
  };

  const handleKeywordAdd = (keyword) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: [...prev.seo.keywords, keyword]
      }
    }));
  };

  const removeKeyword = (index) => {
    setFormData(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: prev.seo.keywords.filter((_, i) => i !== index)
      }
    }));
  };

  const handleTagAdd = (tag) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Common validations
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    // Type-specific validations
    if (contentType === 'review') {
      // Validate required sections for reviews
      const requiredSections = ['introduction', 'verdict']; 
      requiredSections.forEach(section => {
        if (!formData.content[section]?.trim()) {
          newErrors[`content.${section}`] = `${section.charAt(0).toUpperCase() + section.slice(1)} is required`;
        }
      });
    } else {
      // Validate content for news
      if (!formData.content || formData.content.trim() === '') {
        newErrors.content = 'Content is required';
      }
    }

    // Validate featured image
    if (!formData.featuredImage && !initialData?.featuredImage) {
      newErrors.images = 'Featured image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNestedChange = (e) => {
    const { name, value } = e.target;
    const [parent, child] = name.split('.');
    
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value
      }
    }));
  
    // Clear error if exists
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      handleTagAdd(e.target.value.trim());
      e.target.value = ''; // Clear input after adding tag
    }
  };

  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      handleKeywordAdd(e.target.value.trim());
      e.target.value = ''; // Clear input after adding keyword
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
  
    setIsSubmitting(true);
  
    try {
      const formDataToSubmit = new FormData();
      
      // Add basic fields
      const simpleFields = ['title', 'subtitle', 'category', 'status', 'publishDate'];
      simpleFields.forEach(field => {
        if (formData[field] !== undefined) {
          formDataToSubmit.append(field, formData[field]);
        }
      });
      
      // Add checkbox fields
      if (contentType === 'news') {
        formDataToSubmit.append('featured', formData.featured || false);
      }
      
      // Add content based on content type
      if (contentType === 'review') {
        formDataToSubmit.append('content', JSON.stringify(formData.content));
        formDataToSubmit.append('ratings', JSON.stringify(formData.ratings));
      } else {
        formDataToSubmit.append('content', formData.content);
      }
      
      // Add SEO data
      formDataToSubmit.append('seo', JSON.stringify(formData.seo));
      
      // Add tags
      if (Array.isArray(formData.tags) && formData.tags.length > 0) {
        formDataToSubmit.append('tags', formData.tags.join(','));
      }
      
      // Add images
      if (formData.featuredImage?.file) {
        formDataToSubmit.append('featuredImage', formData.featuredImage.file);
        
        // Add caption and credit if available
        if (formData.imageCaption) {
          formDataToSubmit.append('imageCaption', formData.imageCaption);
        }
        if (formData.imageCredit) {
          formDataToSubmit.append('imageCredit', formData.imageCredit);
        }
      }
      
      // Add gallery images
      if (formData.gallery && formData.gallery.length > 0) {
        formData.gallery.forEach((image, index) => {
          if (image.file) {
            formDataToSubmit.append('gallery', image.file);
          }
        });
        
        // If we're updating, indicate whether to replace or append to gallery
        if (initialData) {
          formDataToSubmit.append('replaceGallery', 'true');
        }
      }
      
      // Submit the form
      await onSubmit(formDataToSubmit);
      onClose();
    } catch (error) {
      console.error('Error saving content:', error);
      setErrors(prev => ({
        ...prev,
        submit: `Failed to save ${contentType}. Please try again.`
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget && !isSubmitting) onClose();
    }}>
      <div className="review-modal-content">
        <div className="review-modal-header">
          <h2>
            {initialData 
              ? `Edit ${contentType === 'news' ? 'Article' : 'Review'}` 
              : `Create New ${contentType === 'news' ? 'Article' : 'Review'}`
            }
          </h2>
          <button 
            className="close-button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <TabNavigation 
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          disabled={isSubmitting}
        />

        <form onSubmit={handleSubmit} className="review-form">
          {/* Basic Info Section */}
          {activeTab === 'basic' && (
            <div className="tab-content active">
              <div className="form-group">
                <label htmlFor="title">Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className={`form-input ${errors.title ? 'error' : ''}`}
                  placeholder="Enter title"
                  disabled={isSubmitting}
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="subtitle">Subtitle</label>
                <input
                  type="text"
                  id="subtitle"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter subtitle (optional)"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category*</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`form-input ${errors.category ? 'error' : ''}`}
                  disabled={isSubmitting}
                >
                  <option value="">Select Category</option>
                  {contentType === 'review' ? (
                    <>
                      <option value="car-review">Car Review</option>
                      <option value="first-drive">First Drive</option>
                      <option value="comparison">Comparison Test</option>
                      <option value="long-term">Long Term Test</option>
                    </>
                  ) : (
                    <>
                      <option value="news">News</option>
                      <option value="feature">Feature</option>
                      <option value="industry">Industry News</option>
                    </>
                  )}
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-input"
                  disabled={isSubmitting}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="publishDate">Publication Date</label>
                <input
                  type="date"
                  id="publishDate"
                  name="publishDate"
                  value={formData.publishDate}
                  onChange={handleChange}
                  className="form-input"
                  disabled={isSubmitting}
                />
              </div>

              {contentType === 'news' && (
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    Feature this article on homepage
                  </label>
                </div>
              )}

              <div className="form-group">
                <label>Tags</label>
                <div className="tags-input">
                  <div className="tags-container">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="remove-tag"
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add tags (press Enter)"
                    onKeyDown={handleTagKeyDown}
                    disabled={isSubmitting}
                    className="tag-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content Section */}
          {activeTab === 'content' && (
            <div className="tab-content active">
              {contentType === 'review' ? (
                // Review content with multiple sections
                <>
                  <div className="form-group">
                    <label>Introduction*</label>
                    <textarea
                      value={formData.content.introduction}
                      onChange={(e) => handleContentChange('introduction', e.target.value)}
                      className={`form-input ${errors['content.introduction'] ? 'error' : ''}`}
                      rows="6"
                      placeholder="Write the introduction of your review..."
                      disabled={isSubmitting}
                    />
                    {errors['content.introduction'] && (
                      <span className="error-message">{errors['content.introduction']}</span>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Exterior Design</label>
                    <textarea
                      value={formData.content.exterior}
                      onChange={(e) => handleContentChange('exterior', e.target.value)}
                      className="form-input"
                      rows="4"
                      placeholder="Describe the vehicle's exterior design..."
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Interior & Comfort</label>
                    <textarea
                      value={formData.content.interior}
                      onChange={(e) => handleContentChange('interior', e.target.value)}
                      className="form-input"
                      rows="4"
                      placeholder="Describe the interior and comfort features..."
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Performance</label>
                    <textarea
                      value={formData.content.performance}
                      onChange={(e) => handleContentChange('performance', e.target.value)}
                      className="form-input"
                      rows="4"
                      placeholder="Describe the vehicle's performance..."
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Technology & Features</label>
                    <textarea
                      value={formData.content.technology}
                      onChange={(e) => handleContentChange('technology', e.target.value)}
                      className="form-input"
                      rows="4"
                      placeholder="Describe the technology and features..."
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Verdict*</label>
                    <textarea
                      value={formData.content.verdict}
                      onChange={(e) => handleContentChange('verdict', e.target.value)}
                      className={`form-input ${errors['content.verdict'] ? 'error' : ''}`}
                      rows="4"
                      placeholder="Provide your final verdict..."
                      disabled={isSubmitting}
                    />
                    {errors['content.verdict'] && (
                      <span className="error-message">{errors['content.verdict']}</span>
                    )}
                  </div>
                </>
              ) : (
                // News article content (single block)
                <div className="form-group">
                  <label>Article Content*</label>
                  <textarea
                    value={typeof formData.content === 'string' ? formData.content : ''}
                    onChange={(e) => handleContentChange('', e.target.value)}
                    className={`form-input content-textarea ${errors.content ? 'error' : ''}`}
                    rows="20"
                    placeholder="Write your article content here..."
                    disabled={isSubmitting}
                  />
                  {errors.content && (
                    <span className="error-message">{errors.content}</span>
                  )}
                  <div className="content-helper">
                    <p>You can use basic HTML tags for formatting:</p>
                    <ul>
                      <li>&lt;p&gt;Paragraph text&lt;/p&gt;</li>
                      <li>&lt;h2&gt;Heading&lt;/h2&gt;</li>
                      <li>&lt;strong&gt;Bold text&lt;/strong&gt;</li>
                      <li>&lt;em&gt;Italic text&lt;/em&gt;</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Images Section */}
          {activeTab === 'images' && (
            <div className="tab-content active">
              <ImageUpload
                featuredImage={formData.featuredImage}
                gallery={formData.gallery}
                onImageUpload={handleImageUpload}
                onRemoveImage={handleRemoveImage}
                onSetFeatured={handleSetFeatured}
                error={errors.images}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Ratings Section (Review only) */}
          {activeTab === 'ratings' && contentType === 'review' && (
            <div className="tab-content active">
              <div className="ratings-section">
                <div className="ratings-grid">
                  <RatingInput
                    category="design"
                    label="Design"
                    value={formData.ratings.design}
                    maxValue={10}
                    onChange={handleRatingChange}
                    disabled={isSubmitting}
                  />
                  
                  <RatingInput
                    category="performance"
                    label="Performance"
                    value={formData.ratings.performance}
                    maxValue={10}
                    onChange={handleRatingChange}
                    disabled={isSubmitting}
                  />
                  
                  <RatingInput
                    category="comfort"
                    label="Comfort"
                    value={formData.ratings.comfort}
                    maxValue={10}
                    onChange={handleRatingChange}
                    disabled={isSubmitting}
                  />
                  
                  <RatingInput
                    category="technology"
                    label="Technology"
                    value={formData.ratings.technology}
                    maxValue={10}
                    onChange={handleRatingChange}
                    disabled={isSubmitting}
                  />
                  
                  <RatingInput
                    category="efficiency"
                    label="Efficiency"
                    value={formData.ratings.efficiency}
                    maxValue={10}
                    onChange={handleRatingChange}
                    disabled={isSubmitting}
                  />
                  
                  <RatingInput
                    category="value"
                    label="Value for Money"
                    value={formData.ratings.value}
                    maxValue={10}
                    onChange={handleRatingChange}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="overall-rating">
                  <h3>Overall Rating</h3>
                  <div className="rating-value">
                    {formData.ratings.overall.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEO Section */}
          {activeTab === 'seo' && (
            <div className="tab-content active">
              <div className="form-group">
                <label htmlFor="metaTitle">Meta Title</label>
                <input
                  type="text"
                  id="metaTitle"
                  name="seo.metaTitle"
                  value={formData.seo.metaTitle}
                  onChange={handleNestedChange}
                  className="form-input"
                  maxLength={60}
                  placeholder="SEO Meta Title"
                  disabled={isSubmitting}
                />
                <small>{formData.seo.metaTitle.length}/60 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="metaDescription">Meta Description</label>
                <textarea
                  id="metaDescription"
                  name="seo.metaDescription"
                  value={formData.seo.metaDescription}
                  onChange={handleNestedChange}
                  className="form-input"
                  maxLength={160}
                  rows={3}
                  placeholder="SEO Meta Description"
                  disabled={isSubmitting}
                />
                <small>{formData.seo.metaDescription.length}/160 characters</small>
              </div>

              <div className="form-group">
                <label>Keywords</label>
                <div className="keywords-input">
                  <div className="keywords-container">
                    {formData.seo.keywords.map((keyword, index) => (
                      <span key={index} className="keyword">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(index)}
                          className="remove-keyword"
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add keywords (press Enter)"
                    onKeyDown={handleKeywordKeyDown}
                    disabled={isSubmitting}
                    className="keyword-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (initialData ? 'Save Changes' : `Create ${contentType === 'news' ? 'Article' : 'Review'}`)}
            </button>
          </div>
        </form>

        {isSubmitting && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentEditorModal;