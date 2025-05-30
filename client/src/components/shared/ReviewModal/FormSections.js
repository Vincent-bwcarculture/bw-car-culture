// src/components/admin/ReviewModal/components/FormSections.js
import React from 'react';
import { 
  REVIEW_CATEGORIES, 
  REVIEW_SECTIONS, 
  RATING_CATEGORIES 
} from './constants/reviewConstants.js';
import ImageUpload from './ImageUpload.js';
import RatingInput from './RatingInput.js';
import RichTextEditor from '../RichTextEditor/RichTextEditor.js';

export const BasicInfoSection = ({ formData, onChange, onTagAdd, onRemoveTag, errors, disabled }) => {
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      onTagAdd(e.target.value.trim());
      e.target.value = '';
    }
  };

  return (
    <section className="form-section basic-info">
      <div className="form-group">
        <label htmlFor="title">Title*</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={onChange}
          className={`form-control ${errors.title ? 'error' : ''}`}
          placeholder="Enter review title"
          disabled={disabled}
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
          onChange={onChange}
          className="form-control"
          placeholder="Enter subtitle (optional)"
          disabled={disabled}
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category*</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={onChange}
          className={`form-control ${errors.category ? 'error' : ''}`}
          disabled={disabled}
        >
          <option value="">Select Category</option>
          {REVIEW_CATEGORIES.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        {errors.category && <span className="error-message">{errors.category}</span>}
      </div>

      <div className="form-group">
        <label>Tags</label>
        <div className="tags-input">
          <div className="tags-container">
            {formData.tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(index)}
                  className="remove-tag"
                  disabled={disabled}
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
            disabled={disabled}
            className="tag-input"
          />
        </div>
      </div>
    </section>
  );
};

export const ContentSection = ({ formData, onContentChange, errors, disabled }) => (
  <section className="form-section content">
    {Object.entries(REVIEW_SECTIONS).map(([key, { label, required }]) => (
      <div key={key} className="form-group">
        <label>
          {label}
          {required && '*'}
        </label>
        <RichTextEditor
          value={formData.content[key]}
          onChange={(value) => onContentChange(key, value)}
          disabled={disabled}
        />
        {errors[`content.${key}`] && (
          <span className="error-message">{errors[`content.${key}`]}</span>
        )}
      </div>
    ))}
  </section>
);

export const ImagesSection = ({ 
  formData, 
  onImageUpload, 
  onRemoveImage, 
  onSetFeatured, 
  errors, 
  disabled 
}) => (
  <section className="form-section images">
    <ImageUpload
      featuredImage={formData.featuredImage}
      gallery={formData.gallery}
      onImageUpload={onImageUpload}
      onRemoveImage={onRemoveImage}
      onSetFeatured={onSetFeatured}
      error={errors.images}
      disabled={disabled}
    />
  </section>
);

export const RatingsSection = ({ formData, onRatingChange, disabled }) => (
  <section className="form-section ratings">
    <div className="ratings-grid">
      {Object.entries(RATING_CATEGORIES).map(([key, { label, max }]) => (
        <RatingInput
          key={key}
          category={key}
          label={label}
          value={formData.ratings[key]}
          maxValue={max}
          onChange={onRatingChange}
          disabled={disabled}
        />
      ))}
    </div>

    <div className="overall-rating">
      <h3>Overall Rating</h3>
      <div className="rating-value">
        {formData.ratings.overall.toFixed(1)}
      </div>
    </div>
  </section>
);

export const SEOSection = ({ formData, onChange, onKeywordAdd, onRemoveKeyword, errors, disabled }) => {
  const handleKeywordKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      onKeywordAdd(e.target.value.trim());
      e.target.value = '';
    }
  };

  return (
    <section className="form-section seo">
      <div className="form-group">
        <label htmlFor="metaTitle">Meta Title</label>
        <input
          type="text"
          id="metaTitle"
          name="seo.metaTitle"
          value={formData.seo.metaTitle}
          onChange={onChange}
          className="form-control"
          maxLength={60}
          placeholder="SEO Meta Title"
          disabled={disabled}
        />
        <small>{formData.seo.metaTitle.length}/60 characters</small>
      </div>

      <div className="form-group">
        <label htmlFor="metaDescription">Meta Description</label>
        <textarea
          id="metaDescription"
          name="seo.metaDescription"
          value={formData.seo.metaDescription}
          onChange={onChange}
          className="form-control"
          maxLength={160}
          rows={3}
          placeholder="SEO Meta Description"
          disabled={disabled}
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
                  onClick={() => onRemoveKeyword(index)}
                  className="remove-keyword"
                  disabled={disabled}
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
            disabled={disabled}
            className="keyword-input"
          />
        </div>
      </div>
    </section>
  );
};