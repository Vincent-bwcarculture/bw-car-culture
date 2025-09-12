// client/src/components/profile/ArticleManagement/views/EditorView/index.js
// FIXED VERSION - Simple pattern like working UserCarListingForm

import React, { useState, useRef } from 'react';
import {
  Save,
  Globe,
  Loader,
  AlertCircle,
  ImageIcon,
  X,
  Plus
} from 'lucide-react';

const EditorView = ({
  articleForm,
  setArticleForm,
  formErrors,
  saving,
  editingArticle,
  categories,
  earningsConfig,
  onSave,
  onCancel,
  onImageUpload,
  addTag,
  removeTag,
  fileInputRef,
  onViewChange,
  // SIMPLIFIED: Simple gallery props like UserCarListingForm
  galleryImages = [],  // Simple array of {file, preview, name, size}
  onGalleryImagesUpload,
  removeGalleryImage,
  // Utility props
  getCategoryColor,
  getCategoryLabel,
  formatCurrency
}) => {
  const [tagInput, setTagInput] = useState('');
  const galleryInputRef = useRef(null);

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim().toLowerCase());
      setTagInput('');
    }
  };

  return (
    <div className="editor-view">
      <div className="editor-header">
        <button className="back-button" onClick={onCancel}>
          ← Back
        </button>
        
        <h2>{editingArticle ? 'Edit Article' : 'Create New Article'}</h2>
        
        <div className="editor-actions">
          <button 
            className="save-button secondary" 
            onClick={() => onSave(false)}
            disabled={saving}
          >
            {saving ? <Loader size={16} className="spin" /> : <Save size={16} />}
            Save Draft
          </button>
          <button 
            className="publish-button primary" 
            onClick={() => onSave(true)}
            disabled={saving}
          >
            {saving ? <Loader size={16} className="spin" /> : <Globe size={16} />}
            Publish
          </button>
        </div>
      </div>

      {formErrors.general && (
        <div className="error-message">
          <AlertCircle size={16} />
          {formErrors.general}
        </div>
      )}

      <div className="editor-content">
        <div className="editor-main">
          {/* Title */}
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={articleForm.title}
              onChange={(e) => setArticleForm(prev => ({ ...prev, title: e.target.value }))}
              className={formErrors.title ? 'error' : ''}
              placeholder="Enter an engaging title..."
            />
            {formErrors.title && <span className="error-text">{formErrors.title}</span>}
          </div>

          {/* Subtitle */}
          <div className="form-group">
            <label>Subtitle</label>
            <input
              type="text"
              name="subtitle"
              value={articleForm.subtitle}
              onChange={(e) => setArticleForm(prev => ({ ...prev, subtitle: e.target.value }))}
              className={formErrors.subtitle ? 'error' : ''}
              placeholder="Add a compelling subtitle..."
            />
            {formErrors.subtitle && <span className="error-text">{formErrors.subtitle}</span>}
          </div>

          {/* Content */}
          <div className="form-group">
            <label>Content *</label>
            <textarea
              name="content"
              value={articleForm.content}
              onChange={(e) => setArticleForm(prev => ({ ...prev, content: e.target.value }))}
              className={`content-editor ${formErrors.content ? 'error' : ''}`}
              placeholder="Write your article content here..."
              rows={20}
            />
            {formErrors.content && <span className="error-text">{formErrors.content}</span>}
          </div>

          {/* Author Notes */}
          <div className="form-group">
            <label>Author Notes (Internal)</label>
            <textarea
              value={articleForm.authorNotes}
              onChange={(e) => setArticleForm(prev => ({ ...prev, authorNotes: e.target.value }))}
              placeholder="Add any internal notes or reminders..."
              rows={3}
            />
          </div>
        </div>

        <div className="editor-sidebar">
          {/* Publishing */}
          <div className="sidebar-section">
            <h3>Publishing</h3>
            
            <div className="form-group">
              <label>Status</label>
              <select 
                name="status"
                value={articleForm.status}
                onChange={(e) => setArticleForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="form-group">
              <label>Publish Date</label>
              <input
                type="datetime-local"
                value={articleForm.publishDate || ''}
                onChange={(e) => setArticleForm(prev => ({ ...prev, publishDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Category */}
          <div className="sidebar-section">
            <h3>Category</h3>
            <select 
              name="category"
              value={articleForm.category}
              onChange={(e) => setArticleForm(prev => ({ ...prev, category: e.target.value }))}
              className={formErrors.category ? 'error' : ''}
            >
              <option value="">Select Category</option>
              {categories && categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label} ({category.multiplier}x)
                </option>
              ))}
            </select>
            {formErrors.category && <span className="error-text">{formErrors.category}</span>}
          </div>

          {/* Monetization */}
          <div className="sidebar-section">
            <h3>Monetization</h3>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={articleForm.isPremium}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, isPremium: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Premium Content (1.5x earnings)
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={articleForm.earningsEnabled}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, earningsEnabled: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Enable Earnings
              </label>
            </div>
          </div>

          {/* Featured Image */}
          <div className="sidebar-section">
            <h3>Featured Image</h3>
            {articleForm.featuredImage ? (
              <div className="image-preview">
                <img src={articleForm.featuredImage} alt="Featured" />
                <button 
                  className="remove-image"
                  onClick={() => {
                    setArticleForm(prev => ({ ...prev, featuredImage: null }));
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button 
                className="upload-button"
                onClick={() => fileInputRef?.current?.click()}
              >
                <ImageIcon size={16} />
                Upload Featured Image
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* SIMPLIFIED: Gallery Images - Same pattern as UserCarListingForm */}
          <div className="sidebar-section">
            <h3>Gallery Images</h3>
            <p className="section-description">
              Add multiple images to create a photo gallery.
            </p>
            
            {/* Upload Area - Same style as UserCarListingForm */}
            <div className="image-upload-area" onClick={() => galleryInputRef.current?.click()}>
              <input
                type="file"
                ref={galleryInputRef}
                onChange={onGalleryImagesUpload}
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden-input"
                style={{ display: 'none' }}
              />
              <div className="upload-placeholder">
                <span className="upload-icon">📸</span>
                <span>Click to add gallery images</span>
                <small>Maximum 9 images, 10MB each (JPEG, PNG, WebP)</small>
                {galleryImages.length > 0 && (
                  <small>Current: {galleryImages.length}/9 images</small>
                )}
              </div>
            </div>

            {/* Gallery Previews - Same pattern as UserCarListingForm */}
            {galleryImages.length > 0 && (
              <div className="image-previews">
                {galleryImages.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img 
                      src={image.preview} 
                      alt={`Gallery ${index + 1}`} 
                      onError={(e) => {
                        console.error(`Error loading gallery preview ${index}`);
                        e.target.src = '/images/placeholders/default.jpg';
                      }}
                    />
                    <div className="image-preview-actions">
                      <button 
                        type="button" 
                        className="remove-image"
                        onClick={() => removeGalleryImage(index)}
                        title="Remove image"
                      >
                        ×
                      </button>
                      <span className="image-size">
                        {(image.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="sidebar-section">
            <h3>Tags</h3>
            <div className="tags-container">
              {articleForm.tags && articleForm.tags.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                  <button onClick={() => removeTag(tag)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Add tags (press Enter)"
              className="tag-input"
            />
          </div>

          {/* SEO */}
          <div className="sidebar-section">
            <h3>SEO</h3>
            
            <div className="form-group">
              <label>Meta Title</label>
              <input
                type="text"
                name="metaTitle"
                value={articleForm.metaTitle}
                onChange={(e) => setArticleForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                placeholder="SEO title..."
                maxLength={60}
                className={formErrors.metaTitle ? 'error' : ''}
              />
              <small>{articleForm.metaTitle?.length || 0}/60 characters</small>
            </div>

            <div className="form-group">
              <label>Meta Description</label>
              <textarea
                name="metaDescription"
                value={articleForm.metaDescription}
                onChange={(e) => setArticleForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                placeholder="SEO description..."
                rows={3}
                maxLength={160}
                className={formErrors.metaDescription ? 'error' : ''}
              />
              <small>{articleForm.metaDescription?.length || 0}/160 characters</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorView;