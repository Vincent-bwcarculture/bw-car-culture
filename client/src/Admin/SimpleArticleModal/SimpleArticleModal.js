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
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const coverInputRef = useRef();
  const galleryInputRef = useRef();

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setGalleryFiles(prev => [...prev, ...files]);
    setGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeGalleryImage = (idx) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== idx));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
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
      if (coverFile) fd.append('featuredImage', coverFile);
      galleryFiles.forEach(f => fd.append('gallery', f));

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
    setCoverFile(null);
    setCoverPreview(null);
    setGalleryFiles([]);
    setGalleryPreviews([]);
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
              onClick={() => coverInputRef.current?.click()}
              style={coverPreview ? { padding: 0, border: 'none' } : {}}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" className="sam-image-preview" />
              ) : (
                <>
                  <span className="sam-image-icon">🖼</span>
                  <span>Click to upload cover image</span>
                  <span className="sam-image-hint">JPEG, PNG or WebP · max 5 MB</span>
                </>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleCoverChange}
                disabled={loading}
              />
            </div>
            {coverPreview && (
              <button type="button" className="sam-image-remove"
                onClick={() => { setCoverFile(null); setCoverPreview(null); }}>
                Remove cover image
              </button>
            )}
          </div>

          {/* Gallery images */}
          <div className="sam-field">
            <label className="sam-label">Gallery Images <span className="sam-label-hint">(optional — multiple allowed)</span></label>
            <div className="sam-gallery-add" onClick={() => galleryInputRef.current?.click()}>
              <span>📸</span> Add gallery photos
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                style={{ display: 'none' }}
                onChange={handleGalleryChange}
                disabled={loading}
              />
            </div>
            {galleryPreviews.length > 0 && (
              <div className="sam-gallery-grid">
                {galleryPreviews.map((src, i) => (
                  <div key={i} className="sam-gallery-thumb">
                    <img src={src} alt={`Gallery ${i + 1}`} />
                    <button type="button" className="sam-gallery-remove" onClick={() => removeGalleryImage(i)}>✕</button>
                  </div>
                ))}
              </div>
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
              placeholder="Write your full article here. You can use basic HTML tags like <p>, <h2>, <strong>, <em>, <ul>/<li> for formatting."
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
