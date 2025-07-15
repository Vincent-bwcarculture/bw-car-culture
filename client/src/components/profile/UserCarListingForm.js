// client/src/components/profile/UserCarListingForm.js
// ALIGNED WITH ADMIN PANEL - Uses same constants and structure as admin forms

import React, { useState, useEffect } from 'react';
import { 
  Car, Camera, Upload, DollarSign, Info, CheckCircle, 
  X, Save, AlertCircle, Star, Shield, Clock, Check,
  Settings, Phone, MapPin, User, Plus, Trash2, Eye
} from 'lucide-react';
import axios from '../../config/axios.js';
import './UserCarListingForm.css';

// ALIGNED: Import same constants as admin forms
const SAFETY_FEATURES = [
  'ABS (Anti-lock Braking System)',
  'Airbags (Driver)',
  'Airbags (Passenger)',
  'Airbags (Side)',
  'Airbags (Curtain)',
  'Electronic Stability Control',
  'Traction Control',
  'Parking Sensors (Front)',
  'Parking Sensors (Rear)',
  'Reverse Camera',
  'Blind Spot Monitoring',
  'Lane Departure Warning',
  'Adaptive Cruise Control',
  'Emergency Braking',
  'Hill Start Assist',
  'Roll Stability Control',
  'ISOFIX Child Seat Mounts'
];

const COMFORT_FEATURES = [
  'Air Conditioning',
  'Climate Control (Dual Zone)',
  'Climate Control (Multi Zone)',
  'Heated Seats (Front)',
  'Heated Seats (Rear)',
  'Cooled/Ventilated Seats',
  'Power Seats (Driver)',
  'Power Seats (Passenger)',
  'Memory Seats',
  'Lumbar Support',
  'Power Windows',
  'Power Steering',
  'Cruise Control',
  'Keyless Entry',
  'Push Button Start',
  'Remote Start',
  'Auto-dimming Mirrors',
  'Power Mirrors',
  'Heated Mirrors'
];

const PERFORMANCE_FEATURES = [
  'Turbo/Supercharged',
  'Sport Mode',
  'Eco Mode',
  'All-Wheel Drive',
  'Limited Slip Differential',
  'Launch Control',
  'Paddle Shifters',
  'Sport Suspension',
  'Adjustable Suspension',
  'Performance Brakes',
  'Sport Exhaust',
  'Engine Start/Stop'
];

const ENTERTAINMENT_FEATURES = [
  'Radio/AM/FM',
  'CD Player',
  'Bluetooth Connectivity',
  'USB Ports',
  'Aux Input',
  'Wireless Charging',
  'Apple CarPlay',
  'Android Auto',
  'Navigation System',
  'Touchscreen Display',
  'Premium Sound System',
  'Satellite Radio',
  'WiFi Hotspot',
  'Voice Control',
  'Rear Entertainment System'
];

// ALIGNED: Same constants as admin
const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'used', label: 'Used' },
  { value: 'certified', label: 'Certified Pre-Owned' }
];

const BODY_STYLES = [
  'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 
  'Wagon', 'Pickup', 'Van', 'Crossover', 'Minivan', 'Other'
];

const TRANSMISSION_TYPES = [
  'Manual', 'Automatic', 'CVT', 'Dual-Clutch', 'Semi-Automatic'
];

const FUEL_TYPES = [
  'Petrol', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'Hydrogen', 'LPG', 'CNG'
];

const DRIVETRAIN_TYPES = [
  'Front-Wheel Drive', 'Rear-Wheel Drive', 'All-Wheel Drive', '4-Wheel Drive'
];

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'negotiable', label: 'Negotiable' },
  { value: 'auction', label: 'Best Offer' }
];

const UserCarListingForm = ({ 
  onSubmit, 
  onCancel, 
  initialData = null,
  selectedPlan = null,
  selectedAddons = []
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadingImages, setUploadingImages] = useState(false);

  // ALIGNED: Form data structure matches admin forms exactly
  const [formData, setFormData] = useState({
    // Basic Information - ALIGNED with admin
    title: '',
    description: '',
    shortDescription: '', // ADDED: matches admin
    condition: 'used',
    bodyStyle: '',
    category: '', // ADDED: matches admin
    
    // Specifications - ALIGNED with admin structure
    specifications: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      mileage: '',
      transmission: '',
      fuelType: '',
      engineSize: '',
      power: '', // ADDED: matches admin
      torque: '', // ADDED: matches admin
      drivetrain: '',
      exteriorColor: '',
      interiorColor: '',
      vin: ''
    },
    
    // Features - ALIGNED: Same categories as admin
    safetyFeatures: [],
    comfortFeatures: [],
    performanceFeatures: [], // ADDED: matches admin
    entertainmentFeatures: [], // ADDED: matches admin
    features: [], // Additional custom features
    
    // Pricing - ALIGNED with admin structure
    price: '',
    priceType: 'fixed',
    priceOptions: {
      includesVAT: false,
      showPriceAsPOA: false,
      financeAvailable: false,
      leaseAvailable: false,
      monthlyPayment: ''
    },
    
    // Contact Information - simplified for users
    contact: {
      sellerName: '',
      phone: '',
      email: '',
      preferredContact: 'phone',
      location: {
        city: '',
        area: '',
        address: ''
      }
    },
    
    // Location - ALIGNED with admin
    location: {
      address: '',
      city: '',
      state: '',
      country: 'Botswana',
      postalCode: ''
    },
    
    // Images
    images: [],
    
    // Service History - ALIGNED with admin structure
    serviceHistory: {
      hasServiceHistory: false,
      records: '',
      lastServiceDate: '',
      nextServiceDue: ''
    },
    
    // Additional Information
    reasonForSelling: '',
    additionalNotes: '',
    warranty: false,
    warrantyDetails: '',
    modifications: false,
    modificationDetails: '',
    accidents: false,
    accidentDetails: '',
    keys: '2' // Number of keys
  });

  // ALIGNED: Same tab structure as admin (simplified)
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Car },
    { id: 'specs', label: 'Specifications', icon: Settings },
    { id: 'features', label: 'Features', icon: Star },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'images', label: 'Photos', icon: Camera },
    { id: 'additional', label: 'Additional', icon: Info }
  ];

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [initialData]);

  // Show validation error or success message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // ALIGNED: Handle form submission with admin-compatible data structure
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPlan) {
      showMessage('error', 'Please go back and select a listing plan first');
      return;
    }

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showMessage('error', 'Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      
      // ALIGNED: Structure data exactly like admin expects
      const submissionData = {
        ...formData,
        selectedPlan,
        selectedAddons,
        status: 'pending_review', // Will be reviewed by admin first
        // ADDED: Admin compatibility fields
        featured: false,
        dealer: '', // Will be assigned by admin if needed
        // Copy contact location to main location for admin compatibility
        location: {
          ...formData.location,
          city: formData.contact.location.city || formData.location.city,
          address: formData.contact.location.address || formData.location.address
        }
      };
      
      console.log('Submitting aligned form data:', submissionData);
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Form submission error:', error);
      showMessage('error', 'Failed to save listing');
    } finally {
      setLoading(false);
    }
  };

  // Form validation - ALIGNED with admin requirements
  const validateForm = () => {
    const errors = {};
    
    // Basic validation
    if (!formData.title.trim() || formData.title.length < 10) {
      errors.title = 'Title must be at least 10 characters';
    }
    if (!formData.description.trim() || formData.description.length < 50) {
      errors.description = 'Description must be at least 50 characters';
    }
    
    // Specifications validation
    if (!formData.specifications.make.trim()) errors['specifications.make'] = 'Make is required';
    if (!formData.specifications.model.trim()) errors['specifications.model'] = 'Model is required';
    if (!formData.specifications.year) errors['specifications.year'] = 'Year is required';
    
    // Pricing validation
    if (!formData.price) errors.price = 'Price is required';
    
    // Contact validation
    if (!formData.contact.sellerName.trim()) errors['contact.sellerName'] = 'Seller name is required';
    if (!formData.contact.phone.trim()) errors['contact.phone'] = 'Phone number is required';
    if (!formData.contact.location.city.trim()) errors['contact.location.city'] = 'City is required';
    
    return errors;
  };

  // ALIGNED: Handle input changes with same logic as admin
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties
      const keys = name.split('.');
      if (keys.length === 2) {
        setFormData(prev => ({
          ...prev,
          [keys[0]]: {
            ...prev[keys[0]],
            [keys[1]]: type === 'checkbox' ? checked : value
          }
        }));
      } else if (keys.length === 3) {
        setFormData(prev => ({
          ...prev,
          [keys[0]]: {
            ...prev[keys[0]],
            [keys[1]]: {
              ...prev[keys[0]][keys[1]],
              [keys[2]]: type === 'checkbox' ? checked : value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ALIGNED: Feature toggle logic same as admin
  const handleFeatureToggle = (category, feature) => {
    setFormData(prev => {
      const currentFeatures = Array.isArray(prev[category]) ? [...prev[category]] : [];
      const updatedFeatures = currentFeatures.includes(feature)
        ? currentFeatures.filter(f => f !== feature)
        : [...currentFeatures, feature];

      return {
        ...prev,
        [category]: updatedFeatures
      };
    });
  };

  // Add custom feature
  const handleAddCustomFeature = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const newFeature = e.target.value.trim();
      if (!formData.features.includes(newFeature)) {
        setFormData(prev => ({
          ...prev,
          features: [...prev.features, newFeature]
        }));
      }
      e.target.value = '';
    }
  };

  // Remove custom feature
  const removeCustomFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await axios.post('/api/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        return response.data.data.imageUrl;
      });

      const imageUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));
      
      showMessage('success', `${imageUrls.length} image(s) uploaded successfully`);
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

  // FIXED: Render selected plan and addons summary with debug info
  const renderSelectionSummary = () => {
    console.log('UserCarListingForm - selectedPlan:', selectedPlan);
    console.log('UserCarListingForm - selectedAddons:', selectedAddons);
    
    if (!selectedPlan && selectedAddons.length === 0) {
      return (
        <div className="form-selection-warning">
          <AlertCircle size={20} />
          <div>
            <h4>No Plan Selected</h4>
            <p>Please go back and select a listing plan to continue</p>
            <small style={{color: '#666', fontSize: '12px', marginTop: '8px', display: 'block'}}>
              Debug: selectedPlan = {JSON.stringify(selectedPlan)}, 
              selectedAddons = {JSON.stringify(selectedAddons)}
            </small>
          </div>
        </div>
      );
    }

    return (
      <div className="form-selection-summary">
        <h4>
          <CheckCircle size={20} />
          Your Selection Summary
        </h4>
        
        {selectedPlan && (
          <div className="selected-plan">
            <div className="plan-info">
              <span className="plan-label">Selected Plan:</span>
              <span className="plan-name">{selectedPlan}</span>
            </div>
          </div>
        )}
        
        {selectedAddons.length > 0 && (
          <div className="selected-addons">
            <div className="addons-info">
              <span className="addons-label">Selected Add-ons:</span>
              <div className="addons-list">
                {selectedAddons.map((addon, index) => (
                  <span key={index} className="addon-tag">{addon}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Debug Info */}
        <div style={{
          marginTop: '10px', 
          padding: '8px', 
          background: '#f5f5f5', 
          borderRadius: '4px',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>Debug Info:</strong><br/>
          Plan: {JSON.stringify(selectedPlan)}<br/>
          Addons: {JSON.stringify(selectedAddons)}
        </div>
      </div>
    );
  };

  // ALIGNED: Render feature section same as admin
  const renderFeatureSection = (category, title, features) => {
    return (
      <div className="feature-category">
        <h5>{title}</h5>
        <div className="features-grid">
          {features.map(feature => (
            <label key={feature} className="checkbox-label">
              <input
                type="checkbox"
                checked={Array.isArray(formData[category]) && formData[category].includes(feature)}
                onChange={() => handleFeatureToggle(category, feature)}
              />
              <span>{feature}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="user-listing-form">
      {/* Message Display */}
      {message.text && (
        <div className={`form-message ${message.type}`}>
          <div className="form-message-content">
            {message.type === 'success' && <Check size={16} />}
            {message.type === 'error' && <AlertCircle size={16} />}
            {message.type === 'info' && <Info size={16} />}
            <span>{message.text}</span>
          </div>
          <button 
            className="form-message-close"
            onClick={() => setMessage({ type: '', text: '' })}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Selection Summary */}
      {renderSelectionSummary()}

      {/* Form Header */}
      <div className="form-header">
        <h3>Create Your Car Listing</h3>
        <p>Fill in the details below to create an attractive listing for your vehicle</p>
      </div>

      {/* Tab Navigation */}
      <div className="form-tab-navigation">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`form-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <IconComponent size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="listing-form">
        
        {/* Basic Info Tab - ALIGNED */}
        {activeTab === 'basic' && (
          <div className="form-section active">
            <h4>Basic Information</h4>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="title">Listing Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., 2020 BMW M4 Competition - Pristine Condition"
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
                <small>Minimum 10 characters - be descriptive and specific</small>
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Detailed Description*</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your vehicle in detail - condition, history, maintenance, features, etc."
                  rows="6"
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
                <small>Minimum 50 characters - {formData.description.length}/50+</small>
              </div>

              <div className="form-group">
                <label htmlFor="shortDescription">Short Description</label>
                <textarea
                  id="shortDescription"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Brief summary for listing previews"
                  rows="2"
                  maxLength="150"
                />
                <small>Optional - appears in search results ({formData.shortDescription.length}/150)</small>
              </div>

              <div className="form-group">
                <label htmlFor="condition">Condition*</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                >
                  {CONDITION_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bodyStyle">Body Style</label>
                <select
                  id="bodyStyle"
                  name="bodyStyle"
                  value={formData.bodyStyle}
                  onChange={handleInputChange}
                >
                  <option value="">Select Body Style</option>
                  {BODY_STYLES.map(style => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Luxury, Sports Car, Family Car"
                />
              </div>
            </div>
          </div>
        )}

        {/* Specifications Tab - ALIGNED */}
        {activeTab === 'specs' && (
          <div className="form-section active">
            <h4>Vehicle Specifications</h4>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="make">Make*</label>
                <input
                  type="text"
                  id="make"
                  name="specifications.make"
                  value={formData.specifications.make}
                  onChange={handleInputChange}
                  placeholder="e.g., BMW"
                  className={errors['specifications.make'] ? 'error' : ''}
                />
                {errors['specifications.make'] && <span className="error-message">{errors['specifications.make']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="model">Model*</label>
                <input
                  type="text"
                  id="model"
                  name="specifications.model"
                  value={formData.specifications.model}
                  onChange={handleInputChange}
                  placeholder="e.g., M4 Competition"
                  className={errors['specifications.model'] ? 'error' : ''}
                />
                {errors['specifications.model'] && <span className="error-message">{errors['specifications.model']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="year">Year*</label>
                <input
                  type="number"
                  id="year"
                  name="specifications.year"
                  value={formData.specifications.year}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className={errors['specifications.year'] ? 'error' : ''}
                />
                {errors['specifications.year'] && <span className="error-message">{errors['specifications.year']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="mileage">Mileage (km)</label>
                <input
                  type="number"
                  id="mileage"
                  name="specifications.mileage"
                  value={formData.specifications.mileage}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="transmission">Transmission</label>
                <select
                  id="transmission"
                  name="specifications.transmission"
                  value={formData.specifications.transmission}
                  onChange={handleInputChange}
                >
                  <option value="">Select Transmission</option>
                  {TRANSMISSION_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="fuelType">Fuel Type</label>
                <select
                  id="fuelType"
                  name="specifications.fuelType"
                  value={formData.specifications.fuelType}
                  onChange={handleInputChange}
                >
                  <option value="">Select Fuel Type</option>
                  {FUEL_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="engineSize">Engine Size (L)</label>
                <input
                  type="text"
                  id="engineSize"
                  name="specifications.engineSize"
                  value={formData.specifications.engineSize}
                  onChange={handleInputChange}
                  placeholder="e.g., 3.0L"
                />
              </div>

              <div className="form-group">
                <label htmlFor="power">Power (kW/HP)</label>
                <input
                  type="text"
                  id="power"
                  name="specifications.power"
                  value={formData.specifications.power}
                  onChange={handleInputChange}
                  placeholder="e.g., 375kW / 503HP"
                />
              </div>

              <div className="form-group">
                <label htmlFor="torque">Torque (Nm)</label>
                <input
                  type="text"
                  id="torque"
                  name="specifications.torque"
                  value={formData.specifications.torque}
                  onChange={handleInputChange}
                  placeholder="e.g., 600 Nm"
                />
              </div>

              <div className="form-group">
                <label htmlFor="drivetrain">Drivetrain</label>
                <select
                  id="drivetrain"
                  name="specifications.drivetrain"
                  value={formData.specifications.drivetrain}
                  onChange={handleInputChange}
                >
                  <option value="">Select Drivetrain</option>
                  {DRIVETRAIN_TYPES.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="exteriorColor">Exterior Color</label>
                <input
                  type="text"
                  id="exteriorColor"
                  name="specifications.exteriorColor"
                  value={formData.specifications.exteriorColor}
                  onChange={handleInputChange}
                  placeholder="e.g., Alpine White"
                />
              </div>

              <div className="form-group">
                <label htmlFor="interiorColor">Interior Color</label>
                <input
                  type="text"
                  id="interiorColor"
                  name="specifications.interiorColor"
                  value={formData.specifications.interiorColor}
                  onChange={handleInputChange}
                  placeholder="e.g., Black Leather"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="vin">VIN (Vehicle Identification Number)</label>
                <input
                  type="text"
                  id="vin"
                  name="specifications.vin"
                  value={formData.specifications.vin}
                  onChange={handleInputChange}
                  placeholder="17-character VIN"
                  maxLength="17"
                />
                <small>Optional - helps with vehicle verification</small>
              </div>
            </div>
          </div>
        )}

        {/* Features Tab - ALIGNED with admin categories */}
        {activeTab === 'features' && (
          <div className="form-section active">
            <h4>Vehicle Features</h4>
            
            <div className="features-container">
              {renderFeatureSection('safetyFeatures', 'Safety Features', SAFETY_FEATURES)}
              {renderFeatureSection('comfortFeatures', 'Comfort & Convenience', COMFORT_FEATURES)}
              {renderFeatureSection('performanceFeatures', 'Performance Features', PERFORMANCE_FEATURES)}
              {renderFeatureSection('entertainmentFeatures', 'Entertainment & Technology', ENTERTAINMENT_FEATURES)}
              
              {/* Custom Features */}
              <div className="feature-category">
                <h5>Additional Features</h5>
                <div className="custom-features">
                  <div className="feature-tags">
                    {formData.features.map((feature, index) => (
                      <span key={index} className="feature-tag">
                        {feature}
                        <button 
                          type="button" 
                          onClick={() => removeCustomFeature(index)}
                          className="remove-tag"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Type a feature and press Enter"
                    onKeyDown={handleAddCustomFeature}
                    className="feature-input"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tab - ALIGNED */}
        {activeTab === 'pricing' && (
          <div className="form-section active">
            <h4>Pricing Information</h4>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="price">Price* (BWP)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className={errors.price ? 'error' : ''}
                />
                {errors.price && <span className="error-message">{errors.price}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="priceType">Price Type</label>
                <select
                  id="priceType"
                  name="priceType"
                  value={formData.priceType}
                  onChange={handleInputChange}
                >
                  {PRICE_TYPES.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="monthlyPayment">Monthly Payment (BWP)</label>
                <input
                  type="number"
                  id="monthlyPayment"
                  name="priceOptions.monthlyPayment"
                  value={formData.priceOptions.monthlyPayment}
                  onChange={handleInputChange}
                  placeholder="Optional"
                  min="0"
                />
                <small>If financing is available</small>
              </div>

              <div className="form-group full-width">
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="priceOptions.includesVAT"
                      checked={formData.priceOptions.includesVAT}
                      onChange={handleInputChange}
                    />
                    <span>Price includes VAT</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="priceOptions.financeAvailable"
                      checked={formData.priceOptions.financeAvailable}
                      onChange={handleInputChange}
                    />
                    <span>Financing available</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="priceOptions.leaseAvailable"
                      checked={formData.priceOptions.leaseAvailable}
                      onChange={handleInputChange}
                    />
                    <span>Leasing available</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="form-section active">
            <h4>Contact Information</h4>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="sellerName">Seller Name*</label>
                <input
                  type="text"
                  id="sellerName"
                  name="contact.sellerName"
                  value={formData.contact.sellerName}
                  onChange={handleInputChange}
                  placeholder="Your name"
                  className={errors['contact.sellerName'] ? 'error' : ''}
                />
                {errors['contact.sellerName'] && <span className="error-message">{errors['contact.sellerName']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number*</label>
                <input
                  type="tel"
                  id="phone"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleInputChange}
                  placeholder="+267 XX XXX XXX"
                  className={errors['contact.phone'] ? 'error' : ''}
                />
                {errors['contact.phone'] && <span className="error-message">{errors['contact.phone']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="preferredContact">Preferred Contact Method</label>
                <select
                  id="preferredContact"
                  name="contact.preferredContact"
                  value={formData.contact.preferredContact}
                  onChange={handleInputChange}
                >
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="city">City*</label>
                <input
                  type="text"
                  id="city"
                  name="contact.location.city"
                  value={formData.contact.location.city}
                  onChange={handleInputChange}
                  placeholder="e.g., Gaborone"
                  className={errors['contact.location.city'] ? 'error' : ''}
                />
                {errors['contact.location.city'] && <span className="error-message">{errors['contact.location.city']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="area">Area/Suburb</label>
                <input
                  type="text"
                  id="area"
                  name="contact.location.area"
                  value={formData.contact.location.area}
                  onChange={handleInputChange}
                  placeholder="e.g., Block 6"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="address">Full Address (Optional)</label>
                <textarea
                  id="address"
                  name="contact.location.address"
                  value={formData.contact.location.address}
                  onChange={handleInputChange}
                  placeholder="Full address for serious buyers"
                  rows="2"
                />
              </div>
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="form-section active">
            <h4>Vehicle Photos</h4>
            
            <div className="images-container">
              <div className="upload-area">
                <input
                  type="file"
                  id="imageUpload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="imageUpload" className="upload-label">
                  <Upload size={32} />
                  <span>Click to upload photos</span>
                  <small>Select multiple files (JPG, PNG, WebP) - Max 5MB each</small>
                </label>
              </div>

              {uploadingImages && (
                <div className="upload-progress">
                  <p>Uploading images...</p>
                </div>
              )}

              <div className="images-grid">
                {formData.images.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img src={image} alt={`Vehicle ${index + 1}`} />
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

              <div className="image-tips">
                <h5>Photo Tips:</h5>
                <ul>
                  <li>Take photos in good lighting (natural light preferred)</li>
                  <li>Include exterior from all angles (front, back, sides)</li>
                  <li>Show interior, dashboard, and seats</li>
                  <li>Include engine bay and wheels</li>
                  <li>Show any damage honestly</li>
                  <li>10-20 photos recommended for best results</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Additional Tab - ALIGNED */}
        {activeTab === 'additional' && (
          <div className="form-section active">
            <h4>Additional Information</h4>
            
            <div className="form-grid">
              {/* Service History */}
              <div className="form-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="serviceHistory.hasServiceHistory"
                    checked={formData.serviceHistory.hasServiceHistory}
                    onChange={handleInputChange}
                  />
                  <span>Vehicle has service history records</span>
                </label>
              </div>

              {formData.serviceHistory.hasServiceHistory && (
                <div className="form-group full-width">
                  <label htmlFor="serviceRecords">Service History Details</label>
                  <textarea
                    id="serviceRecords"
                    name="serviceHistory.records"
                    value={formData.serviceHistory.records}
                    onChange={handleInputChange}
                    placeholder="Describe the service history, recent services, etc..."
                    rows="4"
                  />
                </div>
              )}

              {/* Warranty */}
              <div className="form-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="warranty"
                    checked={formData.warranty}
                    onChange={handleInputChange}
                  />
                  <span>Vehicle has remaining warranty</span>
                </label>
              </div>

              {formData.warranty && (
                <div className="form-group full-width">
                  <label htmlFor="warrantyDetails">Warranty Details</label>
                  <textarea
                    id="warrantyDetails"
                    name="warrantyDetails"
                    value={formData.warrantyDetails}
                    onChange={handleInputChange}
                    placeholder="Describe warranty coverage and expiration..."
                    rows="3"
                  />
                </div>
              )}

              {/* Modifications */}
              <div className="form-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="modifications"
                    checked={formData.modifications}
                    onChange={handleInputChange}
                  />
                  <span>Vehicle has modifications or upgrades</span>
                </label>
              </div>

              {formData.modifications && (
                <div className="form-group full-width">
                  <label htmlFor="modificationDetails">Modification Details</label>
                  <textarea
                    id="modificationDetails"
                    name="modificationDetails"
                    value={formData.modificationDetails}
                    onChange={handleInputChange}
                    placeholder="Describe any modifications or upgrades..."
                    rows="3"
                  />
                </div>
              )}

              {/* Accidents */}
              <div className="form-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="accidents"
                    checked={formData.accidents}
                    onChange={handleInputChange}
                  />
                  <span>Vehicle has been in accidents</span>
                </label>
              </div>

              {formData.accidents && (
                <div className="form-group full-width">
                  <label htmlFor="accidentDetails">Accident Details</label>
                  <textarea
                    id="accidentDetails"
                    name="accidentDetails"
                    value={formData.accidentDetails}
                    onChange={handleInputChange}
                    placeholder="Describe any accidents and repairs..."
                    rows="3"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="keys">Number of Keys</label>
                <select
                  id="keys"
                  name="keys"
                  value={formData.keys}
                  onChange={handleInputChange}
                >
                  <option value="1">1 Key</option>
                  <option value="2">2 Keys</option>
                  <option value="3+">3+ Keys</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="reasonForSelling">Reason for Selling</label>
                <textarea
                  id="reasonForSelling"
                  name="reasonForSelling"
                  value={formData.reasonForSelling}
                  onChange={handleInputChange}
                  placeholder="Why are you selling this vehicle? (Optional)"
                  rows="3"
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="additionalNotes">Additional Notes</label>
                <textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  placeholder="Any other important information about the vehicle..."
                  rows="4"
                />
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            className="form-cancel-btn"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          
          <div className="form-action-group">
            <button 
              type="button" 
              className="form-save-draft-btn"
              disabled={loading}
              onClick={() => showMessage('info', 'Draft save feature coming soon')}
            >
              Save Draft
            </button>
            
            <button 
              type="submit" 
              className="form-submit-btn"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserCarListingForm;
