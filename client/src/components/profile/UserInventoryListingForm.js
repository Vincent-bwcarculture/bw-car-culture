// client/src/components/profile/UserInventoryListingForm.js
import React, { useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import axios from '../../config/axios.js';
import './UserInventoryListingForm.css';

const CATEGORIES = [
  'Parts', 'Accessories', 'Apparel', 'Collectibles',
  'Tools', 'Fluids', 'Electronics', 'Other'
];
const CONDITIONS = ['New', 'Used', 'Refurbished'];

// Spec fields per category
const CATEGORY_SPECS = {
  Parts:        [
    { key: 'brand',          label: 'Brand',            placeholder: 'e.g. KYB, Bosch' },
    { key: 'partNumber',     label: 'Part Number',      placeholder: 'e.g. 334222' },
    { key: 'compatibleMake', label: 'Compatible Make',  placeholder: 'e.g. Toyota' },
    { key: 'compatibleModel',label: 'Compatible Model', placeholder: 'e.g. Hilux' },
  ],
  Accessories:  [
    { key: 'brand',          label: 'Brand',            placeholder: 'e.g. Thule, Rhino' },
    { key: 'partNumber',     label: 'Part Number',      placeholder: 'Optional' },
    { key: 'compatibleMake', label: 'Compatible Make',  placeholder: 'e.g. Toyota' },
    { key: 'compatibleModel',label: 'Compatible Model', placeholder: 'e.g. Prado' },
  ],
  Electronics:  [
    { key: 'brand',          label: 'Brand',            placeholder: 'e.g. Pioneer, Sony' },
    { key: 'partNumber',     label: 'Model Number',     placeholder: 'e.g. AVH-A315BT' },
    { key: 'compatibleMake', label: 'Compatible Make',  placeholder: 'e.g. Universal' },
    { key: 'compatibleModel',label: 'Compatible Model', placeholder: 'Optional' },
  ],
  Tools:        [
    { key: 'brand',          label: 'Brand',            placeholder: 'e.g. Snap-on, Stanley' },
    { key: 'partNumber',     label: 'Model / SKU',      placeholder: 'Optional' },
  ],
  Fluids:       [
    { key: 'brand',          label: 'Brand',            placeholder: 'e.g. Castrol, Motul' },
    { key: 'partNumber',     label: 'Grade / Spec',     placeholder: 'e.g. 5W-30, DOT4' },
  ],
  Apparel:      [
    { key: 'brand',  label: 'Brand',  placeholder: 'e.g. BW Car Culture' },
    { key: 'size',   label: 'Size',   placeholder: 'e.g. M, L, XL, Custom' },
    { key: 'color',  label: 'Colour', placeholder: 'e.g. Black, Red/Black' },
  ],
  Collectibles: [
    { key: 'brand',   label: 'Brand / Maker', placeholder: 'e.g. Hot Wheels, Corgi' },
    { key: 'year',    label: 'Year / Era',    placeholder: 'e.g. 1969, Vintage' },
    { key: 'edition', label: 'Edition',       placeholder: 'e.g. Limited, Signed' },
  ],
  Other:        [
    { key: 'brand', label: 'Brand', placeholder: 'Optional' },
  ],
};

const emptySpecs = () => ({
  brand: '', partNumber: '', compatibleMake: '', compatibleModel: '',
  size: '', color: '', year: '', edition: '',
});

const emptyForm = {
  title: '', description: '', category: '', price: '', condition: 'Used',
  quantity: '1',
  stockLevel: 'in-stock',
  contactPhone: '', contactWhatsapp: '', contactEmail: '',
  city: '', country: 'Botswana',
  sellerType: 'private',
  specs: emptySpecs(),
  images: [],
};

const UserInventoryListingForm = ({ onSuccess, onCancel }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setSpec = (key, value) => setForm(f => ({ ...f, specs: { ...f.specs, [key]: value } }));

  const currentSpecFields = CATEGORY_SPECS[form.category] || CATEGORY_SPECS.Other;

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.category) e.category = 'Category is required';
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = 'Valid price required';
    if (!form.contactPhone.trim() && !form.contactWhatsapp.trim()) {
      e.contactPhone = 'At least one contact number required';
    }
    return e;
  };

  const handleImageFiles = async (files) => {
    if (!files.length) return;
    setUploadingImages(true);
    const previews = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      url: null
    }));
    setForm(f => ({ ...f, images: [...f.images, ...previews].slice(0, 8) }));
    setUploadingImages(false);
  };

  const removeImage = (idx) => {
    setForm(f => {
      const imgs = [...f.images];
      if (imgs[idx]?.preview) URL.revokeObjectURL(imgs[idx].preview);
      imgs.splice(idx, 1);
      return { ...f, images: imgs };
    });
  };

  const uploadImagesToServer = async () => {
    const results = [];
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    for (const img of form.images) {
      if (img.url) { results.push({ url: img.url }); continue; }
      if (!img.file) continue;
      try {
        const fd = new FormData();
        fd.append('image0', img.file);
        const res = await axios.post('/api/user/upload-images', fd, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const uploadedUrl = res.data?.images?.[0]?.url || res.data?.data?.url || res.data?.imageUrl || null;
        if (uploadedUrl) results.push({ url: uploadedUrl });
      } catch {
        // skip failed uploads silently
      }
    }
    return results;
  };

  // Build quantity from stockLevel if user picks a level rather than an exact number
  const resolveQuantity = () => {
    const q = Number(form.quantity) || 1;
    if (form.stockLevel === 'out-of-stock') return 0;
    return q;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setSubmitting(true);
    try {
      let uploadedImages = [];
      if (form.images.length) uploadedImages = await uploadImagesToServer();

      // Build specs object — only include keys relevant to the category (skip empty strings)
      const specsForCategory = {};
      currentSpecFields.forEach(({ key }) => {
        const v = (form.specs[key] || '').trim();
        if (v) specsForCategory[key] = v;
      });

      const listingData = {
        title:       form.title.trim(),
        description: form.description.trim(),
        category:    form.category,
        price:       Number(form.price),
        condition:   form.condition,
        quantity:    resolveQuantity(),
        images:      uploadedImages,
        specifications: specsForCategory,
        contact: {
          phone:    form.contactPhone.trim(),
          whatsapp: form.contactWhatsapp.trim() || form.contactPhone.trim(),
          email:    form.contactEmail.trim()
        },
        location: {
          city:    form.city.trim(),
          country: form.country.trim()
        },
        sellerType: form.sellerType
      };

      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      await axios.post('/api/inventory-submissions', { listingData }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSuccess && onSuccess();
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="uif-form" onSubmit={handleSubmit}>
      {errors.submit && (
        <div className="uif-error-banner"><AlertCircle size={14} />{errors.submit}</div>
      )}

      {/* Seller type */}
      <div className="uif-section">
        <label className="uif-label">Seller Type</label>
        <div className="uif-radio-group">
          {['private', 'dealership'].map(t => (
            <label key={t} className={`uif-radio-option ${form.sellerType === t ? 'selected' : ''}`}>
              <input type="radio" name="sellerType" value={t}
                checked={form.sellerType === t}
                onChange={() => set('sellerType', t)} />
              {t === 'private' ? 'Private Seller' : 'Dealership'}
            </label>
          ))}
        </div>
      </div>

      {/* Basic info */}
      <div className="uif-section">
        <h4 className="uif-section-title">Item Details</h4>
        <div className="uif-field">
          <label className="uif-label">Title *</label>
          <input className={`uif-input ${errors.title ? 'error' : ''}`}
            placeholder="e.g. BW Car Culture Hoodie (Black)"
            value={form.title} onChange={e => set('title', e.target.value)} />
          {errors.title && <span className="uif-field-error">{errors.title}</span>}
        </div>

        <div className="uif-row">
          <div className="uif-field">
            <label className="uif-label">Category *</label>
            <select className={`uif-input ${errors.category ? 'error' : ''}`}
              value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <span className="uif-field-error">{errors.category}</span>}
          </div>
          <div className="uif-field">
            <label className="uif-label">Condition</label>
            <select className="uif-input" value={form.condition} onChange={e => set('condition', e.target.value)}>
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="uif-row">
          <div className="uif-field">
            <label className="uif-label">Price (BWP) *</label>
            <input className={`uif-input ${errors.price ? 'error' : ''}`}
              type="number" min="0" placeholder="0"
              value={form.price} onChange={e => set('price', e.target.value)} />
            {errors.price && <span className="uif-field-error">{errors.price}</span>}
          </div>
          <div className="uif-field">
            <label className="uif-label">Stock Status</label>
            <select className="uif-input" value={form.stockLevel}
              onChange={e => set('stockLevel', e.target.value)}>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock (few left)</option>
              <option value="limited">Limited Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {form.stockLevel !== 'out-of-stock' && (
          <div className="uif-field">
            <label className="uif-label">Quantity</label>
            <input className="uif-input" type="number" min="1"
              value={form.quantity} onChange={e => set('quantity', e.target.value)} />
          </div>
        )}

        <div className="uif-field">
          <label className="uif-label">Description</label>
          <textarea className="uif-textarea" rows={4}
            placeholder="Describe the item — condition, sizing, compatibility, any defects, etc."
            value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
      </div>

      {/* Category-adaptive specifications */}
      {form.category && (
        <div className="uif-section">
          <h4 className="uif-section-title">Specifications (optional)</h4>
          <div className="uif-row">
            {currentSpecFields.map(({ key, label, placeholder }) => (
              <div className="uif-field" key={key}>
                <label className="uif-label">{label}</label>
                <input className="uif-input" placeholder={placeholder}
                  value={form.specs[key] || ''}
                  onChange={e => setSpec(key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos */}
      <div className="uif-section">
        <h4 className="uif-section-title">Photos (up to 8)</h4>
        <div className="uif-images-grid">
          {form.images.map((img, i) => (
            <div key={i} className="uif-img-thumb">
              <img src={img.preview || img.url} alt={`img-${i}`} />
              <button type="button" className="uif-img-remove" onClick={() => removeImage(i)}>
                <X size={12} />
              </button>
            </div>
          ))}
          {form.images.length < 8 && (
            <label className="uif-img-upload-btn">
              <Upload size={20} />
              <span>{uploadingImages ? 'Uploading…' : 'Add photos'}</span>
              <input type="file" multiple accept="image/*" style={{ display: 'none' }}
                onChange={e => handleImageFiles(e.target.files)} />
            </label>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="uif-section">
        <h4 className="uif-section-title">Contact Details</h4>
        <div className="uif-row">
          <div className="uif-field">
            <label className="uif-label">Phone *</label>
            <input className={`uif-input ${errors.contactPhone ? 'error' : ''}`}
              placeholder="+267 7X XXX XXX"
              value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
            {errors.contactPhone && <span className="uif-field-error">{errors.contactPhone}</span>}
          </div>
          <div className="uif-field">
            <label className="uif-label">WhatsApp (if different)</label>
            <input className="uif-input" placeholder="+267 7X XXX XXX"
              value={form.contactWhatsapp} onChange={e => set('contactWhatsapp', e.target.value)} />
          </div>
        </div>
        <div className="uif-field">
          <label className="uif-label">Email (optional)</label>
          <input className="uif-input" type="email" placeholder="you@example.com"
            value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
        </div>
      </div>

      {/* Location */}
      <div className="uif-section">
        <h4 className="uif-section-title">Location</h4>
        <div className="uif-row">
          <div className="uif-field">
            <label className="uif-label">City</label>
            <input className="uif-input" placeholder="e.g. Gaborone"
              value={form.city} onChange={e => set('city', e.target.value)} />
          </div>
          <div className="uif-field">
            <label className="uif-label">Country</label>
            <input className="uif-input"
              value={form.country} onChange={e => set('country', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="uif-actions">
        <button type="button" className="uif-cancel-btn" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="uif-submit-btn" disabled={submitting || uploadingImages}>
          {submitting ? 'Submitting…' : 'Submit for Review'}
        </button>
      </div>
    </form>
  );
};

export default UserInventoryListingForm;
