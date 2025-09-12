// client/src/components/profile/ArticleManagement/views/EditorView/index.js
// COMPLETE PRODUCTION VERSION - Gallery Images Working

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

/**
 * Complete Editor View Component - PRODUCTION READY
 */
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
  // Gallery image props - NOW PROPERLY RECEIVED
  galleryImageFiles = [],
  onGalleryImagesUpload,
  removeGalleryImage,
  imageUploadProgress = {},
  // Utility props
  getCategoryColor,
  getCategoryLabel,
  formatCurrency
}) => {
  const [tagInput, setTagInput] = useState('');
  
  // Gallery input ref
  const galleryInputRef = useRef(null);

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim().toLowerCase());
      setTagInput('');
    }
  };

  // Debug logging for gallery functionality
  console.log('🖼️ EditorView Gallery Debug:', {
    galleryImageFiles: galleryImageFiles?.length || 0,
    onGalleryImagesUpload: typeof onGalleryImagesUpload,
    removeGalleryImage: typeof removeGalleryImage,
    galleryInputRef: galleryInputRef?.current ? 'ready' : 'not ready'
  });

  return (
    <div className="editor-view">
      {/* Editor Header */}
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

      {/* Error Display */}
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
          {/* Status & Publishing */}
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
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label} ({category.multiplier}x)
                </option>
              ))}
            </select>
            {formErrors.category && <span className="error-text">{formErrors.category}</span>}
            <small>Higher multipliers = better earnings</small>
          </div>

          {/* Monetization & Engagement */}
          <div className="sidebar-section">
            <h3>Monetization & Engagement</h3>
            
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

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={articleForm.trackEngagement}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, trackEngagement: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Track Engagement
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={articleForm.allowComments}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, allowComments: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Allow Comments
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={articleForm.allowSharing}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, allowSharing: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Allow Sharing
              </label>
            </div>

            {/* Earnings Preview */}
            <div className="earnings-preview">
              <h4>Potential Earnings:</h4>
              <div className="earning-tiers">
                <div className="tier">1k views = P{(1000 * 0.01 * (categories.find(c => c.id === articleForm.category)?.multiplier || 1) * (articleForm.isPremium ? 1.5 : 1)).toFixed(2)}</div>
                <div className="tier">10k views = P{(10000 * 0.01 * (categories.find(c => c.id === articleForm.category)?.multiplier || 1) * (articleForm.isPremium ? 1.5 : 1) + 75).toFixed(2)}</div>
                <div className="tier">25k views = P{(25000 * 0.01 * (categories.find(c => c.id === articleForm.category)?.multiplier || 1) * (articleForm.isPremium ? 1.5 : 1) + 200).toFixed(2)}</div>
              </div>
              
              <div className="engagement-info">
                <h5>Engagement Bonus Potential:</h5>
                <small>20k engagement = +P200 bonus</small>
              </div>
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
            <small>Recommended: 1200x630px for social sharing</small>
          </div>

          {/* GALLERY IMAGES - PRODUCTION READY */}
          <div className="sidebar-section">
            <h3>Gallery Images</h3>
            <p className="section-description">
              Add multiple images to create a photo gallery within your article.
            </p>
            
            {/* Gallery Upload Button */}
            <button 
              className="upload-button gallery-upload"
              onClick={() => {
                console.log('🖱️ Gallery button clicked, checking handlers...');
                if (!onGalleryImagesUpload) {
                  console.error('❌ onGalleryImagesUpload handler missing');
                  alert('Gallery upload not available. Please refresh the page.');
                  return;
                }
                if (!galleryInputRef.current) {
                  console.error('❌ Gallery input ref not ready');
                  return;
                }
                galleryInputRef.current.click();
              }}
            >
              <Plus size={16} />
              Add Gallery Images
              {galleryImageFiles && galleryImageFiles.length > 0 && (
                <span className="image-count">({galleryImageFiles.length})</span>
              )}
            </button>
            
            {/* Gallery file input */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                console.log('📁 Gallery input changed:', e.target.files?.length || 0, 'files');
                if (!onGalleryImagesUpload) {
                  console.error('❌ onGalleryImagesUpload handler missing');
                  alert('Gallery upload handler not available');
                  return;
                }
                onGalleryImagesUpload(e);
              }}
              style={{ display: 'none' }}
            />
            
            {/* Gallery Previews */}
            {galleryImageFiles && galleryImageFiles.length > 0 && (
              <div className="gallery-previews">
                <h4>Gallery Images ({galleryImageFiles.length}/9)</h4>
                <div className="gallery-grid">
                  {galleryImageFiles.map((file, index) => {
                    // Create preview URL
                    const previewUrl = URL.createObjectURL(file);
                    
                    return (
                      <div key={`gallery-${index}-${file.name}`} className="gallery-image-preview">
                        <img 
                          src={previewUrl}
                          alt={`Gallery ${index + 1}`}
                          onLoad={() => {
                            // Clean up blob URL after image loads to prevent memory leaks
                            setTimeout(() => URL.revokeObjectURL(previewUrl), 1000);
                          }}
                        />
                        <div className="gallery-image-actions">
                          <button 
                            className="remove-gallery-image"
                            onClick={() => {
                              console.log(`🗑️ Removing gallery image ${index}`);
                              if (!removeGalleryImage) {
                                console.error('❌ removeGalleryImage handler missing');
                                return;
                              }
                              // Clean up URL immediately when removing
                              URL.revokeObjectURL(previewUrl);
                              removeGalleryImage(index);
                            }}
                            title="Remove image"
                          >
                            <X size={14} />
                          </button>
                          <span className="image-info">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Image Guidelines */}
            <div className="upload-guidelines">
              <small>
                • Maximum 9 gallery images + 1 featured image<br/>
                • Each image max 10MB<br/>
                • Supported: JPG, PNG, GIF, WebP<br/>
                • Recommended: 1024x768px or higher
              </small>
            </div>

            {/* Upload Progress (if needed) */}
            {imageUploadProgress && Object.keys(imageUploadProgress).length > 0 && (
              <div className="upload-progress-container">
                {Object.entries(imageUploadProgress).map(([fileName, progress]) => (
                  <div key={fileName} className="upload-progress-item">
                    <small>{fileName}</small>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${progress}%` }}
                      ></div>
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
            
            {/* Media Summary */}
            <div className="media-summary">
              <small>
                <strong>Media:</strong> {articleForm.featuredImage ? 1 : 0} featured + {galleryImageFiles?.length || 0} gallery images
              </small>
            </div>
          </div>

          {/* SEO Section */}
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
              {formErrors.metaTitle && <span className="error-text">{formErrors.metaTitle}</span>}
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
              {formErrors.metaDescription && <span className="error-text">{formErrors.metaDescription}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorView;