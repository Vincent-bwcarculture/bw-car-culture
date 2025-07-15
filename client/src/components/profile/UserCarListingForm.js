// client/src/components/profile/UserCarListingForm.js
// COMPLETE car listing form for users with all tabs and functionality + DEBUG INTEGRATION

import React, { useState, useEffect } from 'react';
import { 
  Car, Camera, Upload, DollarSign, Info, CheckCircle, 
  X, Save, AlertCircle, Star, Shield, Clock, Check,
  Settings, Phone, MapPin, User, Plus, Trash2, Eye
} from 'lucide-react';
import axios from '../../config/axios.js';
import './UserCarListingForm.css';

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
      doors: '',
      seats: '',
      vin: ''
    },
    
    // Pricing
    pricing: {
      price: '',
      priceType: 'fixed',
      currency: 'BWP',
      negotiable: false,
      tradeIn: false,
      financing: false,
      monthlyPayment: ''
    },
    
    // Contact Information
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
    
    // Features
    safetyFeatures: [],
    comfortFeatures: [],
    exteriorFeatures: [],
    interiorFeatures: [],
    
    // Images
    images: [],
    
    // Additional Info
    hasServiceHistory: false,
    serviceHistory: '',
    hasModifications: false,
    modificationDetails: '',
    warranty: false,
    warrantyDetails: '',
    reasonForSelling: '',
    additionalNotes: ''
  });

  // Static data
  const CONDITION_OPTIONS = [
    { value: 'new', label: 'New' },
    { value: 'used', label: 'Used' },
    { value: 'certified', label: 'Certified Pre-Owned' }
  ];

  const BODY_STYLE_OPTIONS = [
    'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 
    'Wagon', 'Pickup', 'Van', 'Crossover', 'Other'
  ];

  const TRANSMISSION_OPTIONS = [
    'Manual', 'Automatic', 'CVT', 'Semi-Automatic'
  ];

  const FUEL_TYPE_OPTIONS = [
    'Petrol', 'Diesel', 'Hybrid', 'Electric', 'LPG', 'CNG'
  ];

  const DRIVETRAIN_OPTIONS = [
    'Front-Wheel Drive', 'Rear-Wheel Drive', 'All-Wheel Drive', '4WD'
  ];

  const PRICE_TYPE_OPTIONS = [
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'negotiable', label: 'Negotiable' },
    { value: 'auction', label: 'Auction' }
  ];

  // Feature options
  const featureOptions = {
    safety: [
      'ABS', 'Airbags', 'Electronic Stability Control', 'Traction Control',
      'Blind Spot Monitoring', 'Lane Departure Warning', 'Collision Warning',
      'Backup Camera', 'Parking Sensors', 'Adaptive Cruise Control'
    ],
    comfort: [
      'Air Conditioning', 'Climate Control', 'Heated Seats', 'Cooled Seats',
      'Power Seats', 'Memory Seats', 'Sunroof', 'Moonroof', 'Remote Start',
      'Keyless Entry', 'Push Button Start', 'Auto Windows'
    ],
    exterior: [
      'Alloy Wheels', 'LED Headlights', 'Fog Lights', 'Roof Rails',
      'Chrome Trim', 'Spoiler', 'Bull Bar', 'Tow Bar', 'Side Steps'
    ],
    interior: [
      'Leather Seats', 'Fabric Seats', 'Navigation System', 'Bluetooth',
      'USB Ports', 'Aux Input', 'CD Player', 'Premium Sound System',
      'Touchscreen Display', 'Apple CarPlay', 'Android Auto', 'Wireless Charging'
    ]
  };

  // Form tabs
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Car },
    { id: 'specs', label: 'Specifications', icon: Settings },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'features', label: 'Features', icon: Star },
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
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
      
      // Include selected plan and addons in submission
      const submissionData = {
        ...formData,
        selectedPlan,
        selectedAddons,
        status: 'pending_review' // Will be reviewed by admin first
      };
      
      console.log('Submitting form with:', submissionData);
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Form submission error:', error);
      showMessage('error', 'Failed to save listing');
    } finally {
      setLoading(false);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.specifications.make.trim()) errors['specifications.make'] = 'Make is required';
    if (!formData.specifications.model.trim()) errors['specifications.model'] = 'Model is required';
    if (!formData.specifications.year) errors['specifications.year'] = 'Year is required';
    if (!formData.pricing.price) errors['pricing.price'] = 'Price is required';
    if (!formData.contact.sellerName.trim()) errors['contact.sellerName'] = 'Seller name is required';
    if (!formData.contact.phone.trim()) errors['contact.phone'] = 'Phone number is required';
    if (!formData.contact.location.city.trim()) errors['contact.location.city'] = 'City is required';
    
    return errors;
  };

  // Handle input changes
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

  // Handle feature selection
  const handleFeatureToggle = (category, feature) => {
    const categoryKey = category === 'safety' ? 'safetyFeatures' : 
                       category === 'comfort' ? 'comfortFeatures' :
                       category === 'exterior' ? 'exteriorFeatures' : 'interiorFeatures';
    
    setFormData(prev => ({
      ...prev,
      [categoryKey]: prev[categoryKey].includes(feature)
        ? prev[categoryKey].filter(f => f !== feature)
        : [...prev[categoryKey], feature]
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
    // Debug logging
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

  // Render feature selection
  const renderFeatureSection = (category, title) => {
    const categoryKey = category === 'safety' ? 'safetyFeatures' : 
                       category === 'comfort' ? 'comfortFeatures' :
                       category === 'exterior' ? 'exteriorFeatures' : 'interiorFeatures';
    
    return (
      <div className="feature-category">
        <h5>{title}</h5>
        <div className="feature-grid">
          {featureOptions[category].map(feature => (
            <label key={feature} className="feature-checkbox">
              <input
                type="checkbox"
                checked={formData[categoryKey].includes(feature)}
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
        
        {/* Basic Info Tab */}
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
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Description*</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your vehicle in detail..."
                  rows="4"
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="condition">Condition</label>
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
                  {BODY_STYLE_OPTIONS.map(style => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Specifications Tab */}
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
                  {TRANSMISSION_OPTIONS.map(type => (
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
                  {FUEL_TYPE_OPTIONS.map(type => (
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
                  placeholder="e.g., 3.0"
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
                  {DRIVETRAIN_OPTIONS.map(type => (
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

              <div className="form-group">
                <label htmlFor="doors">Number of Doors</label>
                <select
                  id="doors"
                  name="specifications.doors"
                  value={formData.specifications.doors}
                  onChange={handleInputChange}
                >
                  <option value="">Select</option>
                  <option value="2">2 Doors</option>
                  <option value="4">4 Doors</option>
                  <option value="5">5 Doors</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="seats">Number of Seats</label>
                <select
                  id="seats"
                  name="specifications.seats"
                  value={formData.specifications.seats}
                  onChange={handleInputChange}
                >
                  <option value="">Select</option>
                  <option value="2">2 Seats</option>
                  <option value="4">4 Seats</option>
                  <option value="5">5 Seats</option>
                  <option value="7">7 Seats</option>
                  <option value="8">8+ Seats</option>
                </select>
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
                />
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="form-section active">
            <h4>Pricing Information</h4>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="price">Price* (BWP)</label>
                <input
                  type="number"
                  id="price"
                  name="pricing.price"
                  value={formData.pricing.price}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className={errors['pricing.price'] ? 'error' : ''}
                />
                {errors['pricing.price'] && <span className="error-message">{errors['pricing.price']}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="priceType">Price Type</label>
                <select
                  id="priceType"
                  name="pricing.priceType"
                  value={formData.pricing.priceType}
                  onChange={handleInputChange}
                >
                  {PRICE_TYPE_OPTIONS.map(option => (
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
                  name="pricing.monthlyPayment"
                  value={formData.pricing.monthlyPayment}
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
                      name="pricing.negotiable"
                      checked={formData.pricing.negotiable}
                      onChange={handleInputChange}
                    />
                    <span>Price is negotiable</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="pricing.tradeIn"
                      checked={formData.pricing.tradeIn}
                      onChange={handleInputChange}
                    />
                    <span>Accept trade-in</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="pricing.financing"
                      checked={formData.pricing.financing}
                      onChange={handleInputChange}
                    />
                    <span>Financing available</span>
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

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="form-section active">
            <h4>Vehicle Features</h4>
            
            <div className="features-container">
              {renderFeatureSection('safety', 'Safety Features')}
              {renderFeatureSection('comfort', 'Comfort & Convenience')}
              {renderFeatureSection('exterior', 'Exterior Features')}
              {renderFeatureSection('interior', 'Interior Features')}
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
                  <small>Select multiple files (JPG, PNG)</small>
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
                  <li>Take photos in good lighting</li>
                  <li>Include exterior from all angles</li>
                  <li>Show interior, dashboard, and seats</li>
                  <li>Include engine bay and wheels</li>
                  <li>Show any damage honestly</li>
                  <li>Maximum 20 photos recommended</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Additional Tab */}
        {activeTab === 'additional' && (
          <div className="form-section active">
            <h4>Additional Information</h4>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="hasServiceHistory"
                    checked={formData.hasServiceHistory}
                    onChange={handleInputChange}
                  />
                  <span>Vehicle has service history records</span>
                </label>
              </div>

              {formData.hasServiceHistory && (
                <div className="form-group full-width">
                  <label htmlFor="serviceHistory">Service History Details</label>
                  <textarea
                    id="serviceHistory"
                    name="serviceHistory"
                    value={formData.serviceHistory}
                    onChange={handleInputChange}
                    placeholder="Describe the service history, recent services, etc..."
                    rows="4"
                  />
                </div>
              )}

              <div className="form-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="hasModifications"
                    checked={formData.hasModifications}
                    onChange={handleInputChange}
                  />
                  <span>Vehicle has modifications or upgrades</span>
                </label>
              </div>

              {formData.hasModifications && (
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
