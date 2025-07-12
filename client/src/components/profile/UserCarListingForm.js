// client/src/components/profile/UserCarListingForm.js
// Complete car listing form for users (based on admin form structure)

import React, { useState, useEffect } from 'react';
import { 
  Car, Camera, Upload, DollarSign, Info, CheckCircle, 
  X, Save, AlertCircle, Star, Shield, Clock 
} from 'lucide-react';
import axios from '../../config/axios.js';
import './UserCarListingForm.css';

const UserCarListingForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadingImages, setUploadingImages] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Basic Information
    title: '',
    description: '',
    condition: 'used',
    bodyStyle: '',
    category: 'car',
    
    // Specifications
    specifications: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      mileage: '',
      transmission: '',
      fuelType: '',
      engineSize: '',
      drivetrain: '',
      exteriorColor: '',
      interiorColor: '',
    },
    
    // Pricing
    pricing: {
      price: '',
      priceType: 'fixed', // fixed, negotiable
      currency: 'BWP'
    },
    
    // Contact Information
    contact: {
      sellerName: '',
      phone: '',
      email: '',
      preferredContactMethod: 'whatsapp', // phone, whatsapp, both
      location: {
        city: '',
        area: '',
        allowViewings: true
      }
    },
    
    // Features
    features: [],
    safetyFeatures: [],
    comfortFeatures: [],
    
    // Images
    images: [],
    
    // Additional Details
    hasServiceHistory: false,
    serviceHistory: '',
    reasonForSelling: '',
    additionalNotes: ''
  });

  // Feature options (same as admin form)
  const featureOptions = {
    safety: [
      'ABS', 'Airbags', 'Stability Control', 'Traction Control',
      'Parking Sensors', 'Backup Camera', 'Blind Spot Monitoring',
      'Lane Departure Warning', 'Emergency Braking'
    ],
    comfort: [
      'Air Conditioning', 'Power Steering', 'Power Windows',
      'Electric Mirrors', 'Heated Seats', 'Leather Seats',
      'Sunroof', 'Cruise Control', 'GPS Navigation'
    ],
    general: [
      'Alloy Wheels', 'Fog Lights', 'Roof Rack', 'Towbar',
      'Spare Wheel', 'Service Book', 'Second Key'
    ]
  };

  // Form tabs
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Car },
    { id: 'specifications', label: 'Specifications', icon: Info },
    { id: 'features', label: 'Features', icon: Star },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'contact', label: 'Contact', icon: CheckCircle },
    { id: 'images', label: 'Photos', icon: Camera }
  ];

  // Initialize form with user data
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear related errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle nested object changes (contact, specifications, pricing)
  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  // Handle feature selection
  const handleFeatureToggle = (featureType, feature) => {
    const fieldName = featureType === 'general' ? 'features' : `${featureType}Features`;
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].includes(feature)
        ? prev[fieldName].filter(f => f !== feature)
        : [...prev[fieldName], feature]
    }));
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        showMessage('error', 'Only image files are allowed');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showMessage('error', `${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await axios.post('/images/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        return {
          url: response.data.data.url,
          filename: file.name,
          size: file.size
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
      
      showMessage('success', `${uploadedImages.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Image upload error:', error);
      showMessage('error', 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  // Remove image
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length < 50) newErrors.description = 'Description must be at least 50 characters';
    
    // Specifications validation
    if (!formData.specifications.make) newErrors['specifications.make'] = 'Make is required';
    if (!formData.specifications.model) newErrors['specifications.model'] = 'Model is required';
    if (!formData.specifications.year) newErrors['specifications.year'] = 'Year is required';
    
    // Pricing validation
    if (!formData.pricing.price) newErrors['pricing.price'] = 'Price is required';
    
    // Contact validation
    if (!formData.contact.sellerName) newErrors['contact.sellerName'] = 'Your name is required';
    if (!formData.contact.phone) newErrors['contact.phone'] = 'Phone number is required';
    if (!formData.contact.location.city) newErrors['contact.location.city'] = 'City is required';
    
    // Images validation
    if (formData.images.length === 0) newErrors.images = 'At least one image is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Prepare submission data
      const submissionData = {
        ...formData,
        status: 'pending_verification', // Will be reviewed by admin
        submittedAt: new Date().toISOString()
      };

      await onSubmit(submissionData);
      showMessage('success', 'Listing submitted for review! You will be contacted once approved.');
    } catch (error) {
      console.error('Form submission error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to submit listing');
    } finally {
      setLoading(false);
    }
  };

  // Show message helper
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  return (
    <div className="user-listing-form-container">
      <div className="form-header">
        <h2>List Your Car for Sale</h2>
        <p>Fill in the details below. Your listing will be reviewed before going live.</p>
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            {message.text}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="form-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="listing-form">
        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="title">Listing Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., 2020 Toyota Corolla - Excellent Condition"
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="condition">Condition *</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="needs_work">Needs Work</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bodyStyle">Body Style</label>
                <select
                  id="bodyStyle"
                  name="bodyStyle"
                  value={formData.bodyStyle}
                  onChange={handleChange}
                >
                  <option value="">Select Body Style</option>
                  <option value="sedan">Sedan</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="suv">SUV</option>
                  <option value="bakkie">Bakkie/Pickup</option>
                  <option value="coupe">Coupe</option>
                  <option value="wagon">Wagon</option>
                  <option value="convertible">Convertible</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your vehicle in detail... (minimum 50 characters)"
                  rows={4}
                  className={errors.description ? 'error' : ''}
                />
                <small>{formData.description.length}/50 minimum characters</small>
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="reasonForSelling">Reason for Selling</label>
                <input
                  type="text"
                  id="reasonForSelling"
                  name="reasonForSelling"
                  value={formData.reasonForSelling}
                  onChange={handleChange}
                  placeholder="e.g., Upgrading, relocating, no longer needed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Specifications Tab */}
        {activeTab === 'specifications' && (
          <div className="form-section">
            <h3>Vehicle Specifications</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="make">Make *</label>
                <input
                  type="text"
                  id="make"
                  name="make"
                  value={formData.specifications.make}
                  onChange={(e) => handleNestedChange('specifications', 'make', e.target.value)}
                  placeholder="e.g., Toyota, BMW, Ford"
                  className={errors['specifications.make'] ? 'error' : ''}
                />
                {errors['specifications.make'] && <span className="error-text">{errors['specifications.make']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="model">Model *</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.specifications.model}
                  onChange={(e) => handleNestedChange('specifications', 'model', e.target.value)}
                  placeholder="e.g., Corolla, X5, Fiesta"
                  className={errors['specifications.model'] ? 'error' : ''}
                />
                {errors['specifications.model'] && <span className="error-text">{errors['specifications.model']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="year">Year *</label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.specifications.year}
                  onChange={(e) => handleNestedChange('specifications', 'year', parseInt(e.target.value))}
                  min="1990"
                  max={new Date().getFullYear() + 1}
                  className={errors['specifications.year'] ? 'error' : ''}
                />
                {errors['specifications.year'] && <span className="error-text">{errors['specifications.year']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="mileage">Mileage (km)</label>
                <input
                  type="number"
                  id="mileage"
                  name="mileage"
                  value={formData.specifications.mileage}
                  onChange={(e) => handleNestedChange('specifications', 'mileage', e.target.value)}
                  placeholder="e.g., 50000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="transmission">Transmission</label>
                <select
                  id="transmission"
                  name="transmission"
                  value={formData.specifications.transmission}
                  onChange={(e) => handleNestedChange('specifications', 'transmission', e.target.value)}
                >
                  <option value="">Select Transmission</option>
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                  <option value="semi-automatic">Semi-Automatic</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="fuelType">Fuel Type</label>
                <select
                  id="fuelType"
                  name="fuelType"
                  value={formData.specifications.fuelType}
                  onChange={(e) => handleNestedChange('specifications', 'fuelType', e.target.value)}
                >
                  <option value="">Select Fuel Type</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="engineSize">Engine Size</label>
                <input
                  type="text"
                  id="engineSize"
                  name="engineSize"
                  value={formData.specifications.engineSize}
                  onChange={(e) => handleNestedChange('specifications', 'engineSize', e.target.value)}
                  placeholder="e.g., 1.8L, 2.0L, 3.5L"
                />
              </div>

              <div className="form-group">
                <label htmlFor="drivetrain">Drivetrain</label>
                <select
                  id="drivetrain"
                  name="drivetrain"
                  value={formData.specifications.drivetrain}
                  onChange={(e) => handleNestedChange('specifications', 'drivetrain', e.target.value)}
                >
                  <option value="">Select Drivetrain</option>
                  <option value="fwd">Front Wheel Drive (FWD)</option>
                  <option value="rwd">Rear Wheel Drive (RWD)</option>
                  <option value="awd">All Wheel Drive (AWD)</option>
                  <option value="4wd">4 Wheel Drive (4WD)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="exteriorColor">Exterior Color</label>
                <input
                  type="text"
                  id="exteriorColor"
                  name="exteriorColor"
                  value={formData.specifications.exteriorColor}
                  onChange={(e) => handleNestedChange('specifications', 'exteriorColor', e.target.value)}
                  placeholder="e.g., White, Black, Silver"
                />
              </div>

              <div className="form-group">
                <label htmlFor="interiorColor">Interior Color</label>
                <input
                  type="text"
                  id="interiorColor"
                  name="interiorColor"
                  value={formData.specifications.interiorColor}
                  onChange={(e) => handleNestedChange('specifications', 'interiorColor', e.target.value)}
                  placeholder="e.g., Black Leather, Grey Cloth"
                />
              </div>
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="form-section">
            <h3>Vehicle Features</h3>
            
            <div className="features-grid">
              <div className="feature-category">
                <h4>Safety Features</h4>
                <div className="feature-options">
                  {featureOptions.safety.map(feature => (
                    <label key={feature} className="feature-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.safetyFeatures.includes(feature)}
                        onChange={() => handleFeatureToggle('safety', feature)}
                      />
                      <span>{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="feature-category">
                <h4>Comfort Features</h4>
                <div className="feature-options">
                  {featureOptions.comfort.map(feature => (
                    <label key={feature} className="feature-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.comfortFeatures.includes(feature)}
                        onChange={() => handleFeatureToggle('comfort', feature)}
                      />
                      <span>{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="feature-category">
                <h4>Additional Features</h4>
                <div className="feature-options">
                  {featureOptions.general.map(feature => (
                    <label key={feature} className="feature-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature)}
                        onChange={() => handleFeatureToggle('general', feature)}
                      />
                      <span>{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="service-history-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="hasServiceHistory"
                  checked={formData.hasServiceHistory}
                  onChange={handleChange}
                />
                <span>Vehicle has documented service history</span>
              </label>
              
              {formData.hasServiceHistory && (
                <div className="form-group">
                  <label htmlFor="serviceHistory">Service History Details</label>
                  <textarea
                    id="serviceHistory"
                    name="serviceHistory"
                    value={formData.serviceHistory}
                    onChange={handleChange}
                    placeholder="Describe the service history, recent maintenance, etc."
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="form-section">
            <h3>Pricing Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="price">Asking Price *</label>
                <div className="price-input">
                  <span className="currency">P</span>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.pricing.price}
                    onChange={(e) => handleNestedChange('pricing', 'price', e.target.value)}
                    placeholder="Enter amount"
                    className={errors['pricing.price'] ? 'error' : ''}
                  />
                </div>
                {errors['pricing.price'] && <span className="error-text">{errors['pricing.price']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="priceType">Price Type</label>
                <select
                  id="priceType"
                  name="priceType"
                  value={formData.pricing.priceType}
                  onChange={(e) => handleNestedChange('pricing', 'priceType', e.target.value)}
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="negotiable">Negotiable</option>
                </select>
              </div>
            </div>

            <div className="pricing-note">
              <Info size={16} />
              <p>Set a competitive price based on your vehicle's condition, age, and market value. 
                 Negotiable prices typically attract more inquiries.</p>
            </div>
          </div>
        )}

        {/* Contact Information Tab */}
        {activeTab === 'contact' && (
          <div className="form-section">
            <h3>Contact Information</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="sellerName">Your Name *</label>
                <input
                  type="text"
                  id="sellerName"
                  name="sellerName"
                  value={formData.contact.sellerName}
                  onChange={(e) => handleNestedChange('contact', 'sellerName', e.target.value)}
                  placeholder="Enter your full name"
                  className={errors['contact.sellerName'] ? 'error' : ''}
                />
                {errors['contact.sellerName'] && <span className="error-text">{errors['contact.sellerName']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.contact.phone}
                  onChange={(e) => handleNestedChange('contact', 'phone', e.target.value)}
                  placeholder="e.g., +267 71 234 567"
                  className={errors['contact.phone'] ? 'error' : ''}
                />
                {errors['contact.phone'] && <span className="error-text">{errors['contact.phone']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.contact.email}
                  onChange={(e) => handleNestedChange('contact', 'email', e.target.value)}
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="preferredContactMethod">Preferred Contact Method</label>
                <select
                  id="preferredContactMethod"
                  name="preferredContactMethod"
                  value={formData.contact.preferredContactMethod}
                  onChange={(e) => handleNestedChange('contact', 'preferredContactMethod', e.target.value)}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="phone">Phone Call</option>
                  <option value="both">Both WhatsApp and Phone</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="city">City/Location *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.contact.location.city}
                  onChange={(e) => handleNestedChange('contact', 'location', { 
                    ...formData.contact.location, 
                    city: e.target.value 
                  })}
                  placeholder="e.g., Gaborone, Francistown"
                  className={errors['contact.location.city'] ? 'error' : ''}
                />
                {errors['contact.location.city'] && <span className="error-text">{errors['contact.location.city']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="area">Area/Suburb</label>
                <input
                  type="text"
                  id="area"
                  name="area"
                  value={formData.contact.location.area}
                  onChange={(e) => handleNestedChange('contact', 'location', { 
                    ...formData.contact.location, 
                    area: e.target.value 
                  })}
                  placeholder="e.g., CBD, Block 6"
                />
              </div>

              <div className="form-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.contact.location.allowViewings}
                    onChange={(e) => handleNestedChange('contact', 'location', { 
                      ...formData.contact.location, 
                      allowViewings: e.target.checked 
                    })}
                  />
                  <span>Allow potential buyers to view the vehicle in person</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="form-section">
            <h3>Vehicle Photos</h3>
            
            <div className="image-upload-section">
              <div className="upload-area">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="images" className="upload-button">
                  <Upload size={24} />
                  <span>Upload Photos</span>
                  <small>Click to select multiple images (max 5MB each)</small>
                </label>
              </div>

              {uploadingImages && (
                <div className="uploading-message">
                  <Clock size={16} />
                  Uploading images...
                </div>
              )}

              {formData.images.length > 0 && (
                <div className="uploaded-images">
                  <h4>Uploaded Images ({formData.images.length})</h4>
                  <div className="image-grid">
                    {formData.images.map((image, index) => (
                      <div key={index} className="image-item">
                        <img src={image.url} alt={`Vehicle ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image"
                          onClick={() => removeImage(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.images && <span className="error-text">{errors.images}</span>}
              
              <div className="image-tips">
                <h4>Photo Tips:</h4>
                <ul>
                  <li>Include exterior shots from all angles</li>
                  <li>Show the interior, dashboard, and seats</li>
                  <li>Take photos of the engine bay and trunk</li>
                  <li>Highlight any unique features or modifications</li>
                  <li>Use good lighting for clear, attractive photos</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Clock size={16} />
                Submitting...
              </>
            ) : (
              <>
                <Save size={16} />
                Submit for Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserCarListingForm;
