import React, { useState, useRef } from 'react';
import { http } from '../../config/axios.js';
import './SimpleArticleModal.css';

const CATEGORIES = [
  { value: 'news', label: 'News' },
  { value: 'feature', label: 'Feature' },
  { value: 'industry', label: 'Industry News' },
  { value: 'review', label: 'Review' },
];

const SimpleArticleModal = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: '',
    category: 'news',
    content: '',
    status: 'published',
    featured: false,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const imgInputRef = useRef();

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.content.trim()) { setError('Content is required.'); return; }
    setError('');
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('category', form.category);
      fd.append('content', form.content.trim());
      fd.append('status', form.status);
      fd.append('featured', String(form.featured));
      fd.append('publishDate', new Date().toISOString().split('T')[0]);
      if (imageFile) fd.append('featuredImage', imageFile);

      const res = await http.post('/api/news/user', fd);

      if (res.data?.success) {
        onSuccess?.();
        handleClose();
      } else {
        throw new Error(res.data?.message || 'Failed to create article.');
      }
    } catch (err) {
      setError(err.message || 'Failed to create article.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ title: '', category: 'news', content: '', status: 'published', featured: false });
    setImageFile(null);
    setImagePreview(null);
    setError('');
    onClose();
  };

  return (
    <div className="sam-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="sam-modal">
        {/* Header */}
        <div className="sam-header">
          <h2 className="sam-title">New Article</h2>
          <button className="sam-close" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        <form className="sam-form" onSubmit={handleSubmit}>
          {/* Title */}
          <div className="sam-field">
            <label className="sam-label">Title *</label>
            <input
              className="sam-input"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Article headline…"
              disabled={loading}
            />
          </div>

          {/* Category + Status row */}
          <div className="sam-row">
            <div className="sam-field">
              <label className="sam-label">Category</label>
              <select className="sam-input" name="category" value={form.category} onChange={handleChange} disabled={loading}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="sam-field">
              <label className="sam-label">Status</label>
              <select className="sam-input" name="status" value={form.status} onChange={handleChange} disabled={loading}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Cover image */}
          <div className="sam-field">
            <label className="sam-label">Cover Image</label>
            <div
              className="sam-image-drop"
              onClick={() => imgInputRef.current?.click()}
              style={imagePreview ? { padding: 0, border: 'none' } : {}}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Cover" className="sam-image-preview" />
              ) : (
                <>
                  <span className="sam-image-icon">🖼</span>
                  <span>Click to upload cover image</span>
                  <span className="sam-image-hint">JPEG, PNG or WebP · max 5 MB</span>
                </>
              )}
              <input
                ref={imgInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleImageChange}
                disabled={loading}
              />
            </div>
            {imagePreview && (
              <button
                type="button"
                className="sam-image-remove"
                onClick={() => { setImageFile(null); setImagePreview(null); }}
              >
                Remove image
              </button>
            )}
          </div>

          {/* Content */}
          <div className="sam-field sam-field--grow">
            <label className="sam-label">Article Content *</label>
            <textarea
              className="sam-input sam-textarea"
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Write your full article here. You can use basic HTML tags like &lt;p&gt;, &lt;h2&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;/&lt;li&gt; for formatting."
              disabled={loading}
            />
          </div>

          {/* Featured checkbox */}
          <label className="sam-featured-label">
            <input
              type="checkbox"
              name="featured"
              checked={form.featured}
              onChange={handleChange}
              disabled={loading}
            />
            Feature this article on the homepage
          </label>

          {/* Error */}
          {error && <p className="sam-error">{error}</p>}

          {/* Actions */}
          <div className="sam-footer">
            <button type="button" className="sam-btn sam-btn--ghost" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="sam-btn sam-btn--primary" disabled={loading}>
              {loading ? 'Publishing…' : (form.status === 'published' ? 'Publish Article' : 'Save Draft')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleArticleModal;
