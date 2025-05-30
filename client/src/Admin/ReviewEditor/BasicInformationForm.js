// components/ReviewEditor/BasicInformationForm.js
import React from 'react';

const BasicInformationForm = ({ review, onChange, errors }) => {
  const categories = [
    'Car Review',
    'First Drive',
    'Comparison Test',
    'Long Term Test',
    'Future Cars',
    'Industry News'
  ];

  return (
    <div className="form-section">
      <div className="form-group">
        <label className="form-label">Title</label>
        <input
          type="text"
          name="title"
          value={review.title}
          onChange={onChange}
          className={`form-input ${errors.title ? 'error' : ''}`}
          placeholder="Enter review title"
        />
        {errors.title && <span className="error-message">{errors.title}</span>}
      </div>

      <div className="form-group">
        <label className="form-label">Subtitle</label>
        <input
          type="text"
          name="subtitle"
          value={review.subtitle}
          onChange={onChange}
          className="form-input"
          placeholder="Enter subtitle (optional)"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Category</label>
        <select
          name="category"
          value={review.category}
          onChange={onChange}
          className="form-input"
        >
          <option value="">Select Category</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Tags</label>
        <input
          type="text"
          name="tags"
          value={review.tags.join(', ')}
          onChange={(e) => onChange({
            target: {
              name: 'tags',
              value: e.target.value.split(',').map(tag => tag.trim())
            }
          })}
          className="form-input"
          placeholder="Enter tags separated by commas"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Publication Date</label>
        <input
          type="date"
          name="publishDate"
          value={review.publishDate}
          onChange={onChange}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Author</label>
        <input
          type="text"
          name="author"
          value={review.author}
          onChange={onChange}
          className="form-input"
          placeholder="Enter author name"
        />
      </div>
    </div>
  );
};

export default BasicInformationForm;