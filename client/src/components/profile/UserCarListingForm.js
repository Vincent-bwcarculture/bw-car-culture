// client/src/components/profile/UserCarListingForm.js
// FIXED version with correct endpoints and auto-population

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
  const [userProfile, setUserProfile] = useState(null);

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
      financing: false
    },
    
    // Contact info - will be auto-populated from user profile
    contact: {
      sellerName: '',
      phone: '',
      email: '',
      whatsapp: '',
      preferredContactMethod: 'phone',
      location: {
        city: '',
        state: '',
        country: 'Botswana'
      }
    },
    
    // Features
    safetyFeatures: [],
    comfortFeatures: [],
    exteriorFeatures: [],
    interiorFeatures: [],
    
    // Images
    images: [],
    
    // Additional info
    serviceHistory: {
      hasServiceHistory: false,
      records: []
    },
    warranty: false,
    isCertified: false
  });

  // Available features
  const availableFeatures = {
    safety: [
      'ABS', 'Airbags', 'Stability Control', 'Traction Control',
      'Emergency Brake Assist', 'Collision Detection', 'Parking Sensors',
      'Reverse Camera', 'Blind Spot Monitoring', 'Lane Departure Warning'
    ],
    comfort: [
      'Air Conditioning', 'Climate Control', 'Power Windows', 
      'Power Steering', 'Cruise Control', 'Heated Seats',
      'Electric Seats', 'Sunroof', 'Keyless Entry', 'Remote Start'
    ],
    exterior: [
      'Alloy Wheels', 'Fog Lights', 'LED Headlights', 'Xenon Lights',
      'Chrome Trim', 'Spoiler', 'Bull Bar', 'Tow Bar', 'Side Steps'
    ],
    interior: [
      'Leather Seats', 'Fabric Seats', 'Navigation System', 
      'Bluetooth', 'USB Ports', 'Aux Input', 'CD Player', 
      'Premium Sound System', 'Touchscreen Display',
      'Apple CarPlay', 'Android Auto', 'Wireless Charging'
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

  // FIXED: Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [initialData]);

  // FIXED: Fetch user profile and auto-populate contact info
  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile for auto-population...');
      const response = await axios.get('/api/user/profile');
      
      if (response.data.success) {
        const profile = response.data.data;
        setUserProfile(profile);
        
        // Auto-populate contact information from user profile
        setFormData(prev => ({
          ...prev,
          contact: {
            ...prev.contact,
            sellerName: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || profile.contact?.phone || '',
            whatsapp: profile.whatsapp || profile.contact?.whatsapp || profile.phone || '',
            location: {
              city: profile.location?.city || profile.address?.city || '',
              state: profile.location?.state || profile.address?.state || '',
              country: profile.location?.country || profile.address?.country || 'Botswana'
            }
          }
        }));
        
        console.log('✅ User profile auto-populated:', {
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          city: profile.location?.city || profile.address?.city
        });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Don't show error to user, just log it
    }
  };

  // Show validation error or success message
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // FIXED: Enhanced form validation
  const validateForm = () => {
    const errors = {};
    
    // Required for listing cards to display properly
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 10) {
      errors.title = 'Title must be at least 10 characters';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.trim().length < 50) {
      errors.description = 'Description must be at least 50 characters';
    }
    
    // Pricing validation
    if (!formData.pricing?.price) {
      errors['pricing.price'] = 'Price is required';
    } else if (isNaN(formData.pricing.price) || formData.pricing.price <= 0) {
      errors['pricing.price'] = 'Please enter a valid price';
    }
    
    // Specifications validation
    if (!formData.specifications?.make?.trim()) {
      errors['specifications.make'] = 'Make is required';
    }
    
    if (!formData.specifications?.model?.trim()) {
      errors['specifications.model'] = 'Model is required';
    }
    
    if (!formData.specifications?.year) {
      errors['specifications.year'] = 'Year is required';
    } else {
      const year = parseInt(formData.specifications.year);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 1) {
        errors['specifications.year'] = `Year must be between 1900 and ${currentYear + 1}`;
      }
    }
    
    if (!formData.specifications?.transmission) {
      errors['specifications.transmission'] = 'Transmission type is required';
    }
    
    if (!formData.specifications?.fuelType) {
      errors['specifications.fuelType'] = 'Fuel type is required';
    }
    
    // Contact validation
    if (!formData.contact?.sellerName?.trim()) {
      errors['contact.sellerName'] = 'Seller name is required';
    }
    
    if (!formData.contact?.phone?.trim()) {
      errors['contact.phone'] = 'Phone number is required';
    } else {
      const phoneRegex = /^\+?267?[0-9]{7,8}$/;
      if (!phoneRegex.test(formData.contact.phone.replace(/\s/g, ''))) {
        errors['contact.phone'] = 'Please enter a valid Botswana phone number';
      }
    }
    
    if (!formData.contact?.email?.trim()) {
      errors['contact.email'] = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contact.email)) {
        errors['contact.email'] = 'Please enter a valid email address';
      }
    }
    
    if (!formData.contact?.location?.city?.trim()) {
      errors['contact.location.city'] = 'City is required';
    }
    
    // Image validation
    if (!formData.images || formData.images.length === 0) {
      errors.images = 'At least one image is required';
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!selectedPlan) {
      showMessage('error', 'Please select a listing plan first');
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
      
      // Prepare submission data
      const submissionData = {
        ...formData,
        selectedPlan,
        selectedAddons,
        status: 'pending_review'
      };
      
      console.log('Submitting user listing:', submissionData);
      
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Form submission error:', error);
      showMessage('error', 'Failed to save listing');
    } finally {
      setLoading(false);
    }
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

  // FIXED: Handle image upload with correct endpoint
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      console.log(`Uploading ${files.length} images...`);
      
      // FIXED: Use correct endpoint and multiple upload method
      if (files.length === 1) {
        // Single image upload
        const formData = new FormData();
        formData.append('image', files[0]);
        
        const response = await axios.post('/api/images/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data.success) {
          const imageUrl = response.data.data.url || response.data.data.imageUrl;
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, imageUrl]
          }));
          showMessage('success', 'Image uploaded successfully');
        }
      } else {
        // Multiple image upload
        const formData = new FormData();
        files.forEach((file, index) => {
          formData.append(`image${index + 1}`, file);
        });
        
        const response = await axios.post('/api/images/upload/multiple', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data.success) {
          const imageUrls = response.data.data.map(result => 
            result.url || result.imageUrl
          );
          
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...imageUrls]
          }));
          showMessage('success', `${imageUrls.length} images uploaded successfully`);
        }
      }
    } catch (error) {
      console.error('Image upload error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload images';
      showMessage('error', errorMessage);
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

  // Render selected plan and addons summary
  const renderSelectionSummary = () => {
    if (!selectedPlan && selectedAddons.length === 0) {
      return (
        <div className="form-selection-warning">
          <AlertCircle size={20} />
          <div>
            <h4>No Plan Selected</h4>
            <p>Please scroll up and select a listing plan to continue</p>
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
      </div>
    );
  };

  // Render feature selection
  const renderFeatureSection = (category, title, features) => {
    const categoryKey = category === 'safety' ? 'safetyFeatures' : 
                       category === 'comfort' ? 'comfortFeatures' :
                       category === 'exterior' ? 'exteriorFeatures' : 'interiorFeatures';

    return (
      <div className="feature-category">
        <h5>{title}</h5>
        <div className="feature-grid">
          {availableFeatures[category].map((feature, index) => (
            <label key={index} className="feature-checkbox">
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
            {message.type === 'success' && <CheckCircle size={16} />}
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
        {userProfile && (
          <p className="auto-populated-notice">
            <User size={16} />
            Contact information auto-populated from your profile
          </p>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="form-tab-navigation">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`form-tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="form-section active">
            <h4>Basic Information</h4>
            
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="title">Listing Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., 2020 Toyota Camry SE - Excellent Condition"
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Describe your vehicle in detail..."
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="condition">Condition *</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="certified">Certified Pre-Owned</option>
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
                  <option value="sedan">Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="hatchback">Hatchback</option>
                  <option value="coupe">Coupe</option>
                  <option value="wagon">Wagon</option>
                  <option value="pickup">Pickup</option>
                  <option value="convertible">Convertible</option>
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
                <label htmlFor="specifications.make">Make *</label>
                <input
                  type="text"
                  id="specifications.make"
                  name="specifications.make"
                  value={formData.specifications.make}
                  onChange={handleInputChange}
                  placeholder="e.g., Toyota"
                  className={errors['specifications.make'] ? 'error' : ''}
                />
                {errors['specifications.make'] && (
                  <span className="error-message">{errors['specifications.make']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="specifications.model">Model *</label>
                <input
                  type="text"
                  id="specifications.model"
                  name="specifications.model"
                  value={formData.specifications.model}
                  onChange={handleInputChange}
                  placeholder="e.g., Camry"
                  className={errors['specifications.model'] ? 'error' : ''}
                />
                {errors['specifications.model'] && (
                  <span className="error-message">{errors['specifications.model']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="specifications.year">Year *</label>
                <input
                  type="number"
                  id="specifications.year"
                  name="specifications.year"
                  value={formData.specifications.year}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className={errors['specifications.year'] ? 'error' : ''}
                />
                {errors['specifications.year'] && (
                  <span className="error-message">{errors['specifications.year']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="specifications.mileage">Mileage (km)</label>
                <input
                  type="number"
                  id="specifications.mileage"
                  name="specifications.mileage"
                  value={formData.specifications.mileage}
                  onChange={handleInputChange}
                  placeholder="e.g., 45000"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="specifications.transmission">Transmission *</label>
                <select
                  id="specifications.transmission"
                  name="specifications.transmission"
                  value={formData.specifications.transmission}
                  onChange={handleInputChange}
                  className={errors['specifications.transmission'] ? 'error' : ''}
                >
                  <option value="">Select Transmission</option>
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                  <option value="cvt">CVT</option>
                </select>
                {errors['specifications.transmission'] && (
                  <span className="error-message">{errors['specifications.transmission']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="specifications.fuelType">Fuel Type *</label>
                <select
                  id="specifications.fuelType"
                  name="specifications.fuelType"
                  value={formData.specifications.fuelType}
                  onChange={handleInputChange}
                  className={errors['specifications.fuelType'] ? 'error' : ''}
                >
                  <option value="">Select Fuel Type</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
                {errors['specifications.fuelType'] && (
                  <span className="error-message">{errors['specifications.fuelType']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="specifications.engineSize">Engine Size</label>
                <input
                  type="text"
                  id="specifications.engineSize"
                  name="specifications.engineSize"
                  value={formData.specifications.engineSize}
                  onChange={handleInputChange}
                  placeholder="e.g., 2.5L"
                />
              </div>

              <div className="form-group">
                <label htmlFor="specifications.drivetrain">Drivetrain</label>
                <select
                  id="specifications.drivetrain"
                  name="specifications.drivetrain"
                  value={formData.specifications.drivetrain}
                  onChange={handleInputChange}
                >
                  <option value="">Select Drivetrain</option>
                  <option value="fwd">Front-Wheel Drive</option>
                  <option value="rwd">Rear-Wheel Drive</option>
                  <option value="awd">All-Wheel Drive</option>
                  <option value="4wd">4-Wheel Drive</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="specifications.exteriorColor">Exterior Color</label>
                <input
                  type="text"
                  id="specifications.exteriorColor"
                  name="specifications.exteriorColor"
                  value={formData.specifications.exteriorColor}
                  onChange={handleInputChange}
                  placeholder="e.g., Silver"
                />
              </div>

              <div className="form-group">
                <label htmlFor="specifications.interiorColor">Interior Color</label>
                <input
                  type="text"
                  id="specifications.interiorColor"
                  name="specifications.interiorColor"
                  value={formData.specifications.interiorColor}
                  onChange={handleInputChange}
                  placeholder="e.g., Black"
                />
              </div>

              <div className="form-group">
                <label htmlFor="specifications.doors">Number of Doors</label>
                <select
                  id="specifications.doors"
                  name="specifications.doors"
                  value={formData.specifications.doors}
                  onChange={handleInputChange}
                >
                  <option value="">Select Doors</option>
                  <option value="2">2 Doors</option>
                  <option value="3">3 Doors</option>
                  <option value="4">4 Doors</option>
                  <option value="5">5 Doors</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="specifications.seats">Number of Seats</label>
                <select
                  id="specifications.seats"
                  name="specifications.seats"
                  value={formData.specifications.seats}
                  onChange={handleInputChange}
                >
                  <option value="">Select Seats</option>
                  <option value="2">2 Seats</option>
                  <option value="4">4 Seats</option>
                  <option value="5">5 Seats</option>
                  <option value="7">7 Seats</option>
                  <option value="8">8+ Seats</option>
                </select>
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
                <label htmlFor="pricing.price">Price (BWP) *</label>
                <input
                  type="number"
                  id="pricing.price"
                  name="pricing.price"
                  value={formData.pricing.price}
                  onChange={handleInputChange}
                  placeholder="e.g., 145000"
                  min="0"
                  className={errors['pricing.price'] ? 'error' : ''}
                />
                {errors['pricing.price'] && (
                  <span className="error-message">{errors['pricing.price']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="pricing.priceType">Price Type</label>
                <select
                  id="pricing.priceType"
                  name="pricing.priceType"
                  value={formData.pricing.priceType}
                  onChange={handleInputChange}
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="negotiable">Negotiable</option>
                  <option value="call">Call for Price</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="pricing.currency">Currency</label>
                <select
                  id="pricing.currency"
                  name="pricing.currency"
                  value={formData.pricing.currency}
                  onChange={handleInputChange}
                >
                  <option value="BWP">BWP (Botswana Pula)</option>
                  <option value="USD">USD</option>
                  <option value="ZAR">ZAR (South African Rand)</option>
                </select>
              </div>
            </div>

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
                <span>Accept trade-ins</span>
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
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="form-section active">
            <h4>Contact Information</h4>
            {userProfile && (
              <p className="auto-populated-info">
                <CheckCircle size={16} />
                Information below was automatically filled from your profile. You can edit if needed.
              </p>
            )}
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="contact.sellerName">Seller Name *</label>
                <input
                  type="text"
                  id="contact.sellerName"
                  name="contact.sellerName"
                  value={formData.contact.sellerName}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  className={errors['contact.sellerName'] ? 'error' : ''}
                />
                {errors['contact.sellerName'] && (
                  <span className="error-message">{errors['contact.sellerName']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contact.phone">Phone Number *</label>
                <input
                  type="tel"
                  id="contact.phone"
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleInputChange}
                  placeholder="+26771234567"
                  className={errors['contact.phone'] ? 'error' : ''}
                />
                {errors['contact.phone'] && (
                  <span className="error-message">{errors['contact.phone']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contact.email">Email Address *</label>
                <input
                  type="email"
                  id="contact.email"
                  name="contact.email"
                  value={formData.contact.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  className={errors['contact.email'] ? 'error' : ''}
                />
                {errors['contact.email'] && (
                  <span className="error-message">{errors['contact.email']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contact.whatsapp">WhatsApp Number</label>
                <input
                  type="tel"
                  id="contact.whatsapp"
                  name="contact.whatsapp"
                  value={formData.contact.whatsapp}
                  onChange={handleInputChange}
                  placeholder="+26771234567"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact.preferredContactMethod">Preferred Contact Method</label>
                <select
                  id="contact.preferredContactMethod"
                  name="contact.preferredContactMethod"
                  value={formData.contact.preferredContactMethod}
                  onChange={handleInputChange}
                >
                  <option value="phone">Phone Call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="contact.location.city">City *</label>
                <input
                  type="text"
                  id="contact.location.city"
                  name="contact.location.city"
                  value={formData.contact.location.city}
                  onChange={handleInputChange}
                  placeholder="e.g., Gaborone"
                  className={errors['contact.location.city'] ? 'error' : ''}
                />
                {errors['contact.location.city'] && (
                  <span className="error-message">{errors['contact.location.city']}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="contact.location.state">State/Region</label>
                <input
                  type="text"
                  id="contact.location.state"
                  name="contact.location.state"
                  value={formData.contact.location.state}
                  onChange={handleInputChange}
                  placeholder="e.g., South East"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact.location.country">Country</label>
                <select
                  id="contact.location.country"
                  name="contact.location.country"
                  value={formData.contact.location.country}
                  onChange={handleInputChange}
                >
                  <option value="Botswana">Botswana</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Namibia">Namibia</option>
                  <option value="Zimbabwe">Zimbabwe</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="form-section active">
            <h4>Vehicle Features</h4>
            
            <div className="features-container">
              {renderFeatureSection('safety', 'Safety Features', formData.safetyFeatures)}
              {renderFeatureSection('comfort', 'Comfort Features', formData.comfortFeatures)}
              {renderFeatureSection('exterior', 'Exterior Features', formData.exteriorFeatures)}
              {renderFeatureSection('interior', 'Interior Features', formData.interiorFeatures)}
            </div>
          </div>
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <div className="form-section active">
            <h4>Vehicle Photos</h4>
            
            <div className="images-upload-section">
              <div className="upload-area">
                <input
                  type="file"
                  id="imageUpload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="imageUpload" className="upload-button">
                  <Upload size={24} />
                  <span>Upload Images</span>
                  <small>Click to select multiple photos (JPEG, PNG)</small>
                </label>
              </div>

              {uploadingImages && (
                <div className="upload-progress">
                  <p>Uploading images...</p>
                </div>
              )}

              {errors.images && (
                <div className="error-message">{errors.images}</div>
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
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Additional Tab */}
        {activeTab === 'additional' && (
          <div className="form-section active">
            <h4>Additional Information</h4>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="serviceHistory.hasServiceHistory"
                  checked={formData.serviceHistory.hasServiceHistory}
                  onChange={handleInputChange}
                />
                <span>Has complete service history</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="warranty"
                  checked={formData.warranty}
                  onChange={handleInputChange}
                />
                <span>Under warranty</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isCertified"
                  checked={formData.isCertified}
                  onChange={handleInputChange}
                />
                <span>Certified pre-owned</span>
              </label>
            </div>

            <div className="form-group full-width">
              <label htmlFor="specifications.vin">VIN Number</label>
              <input
                type="text"
                id="specifications.vin"
                name="specifications.vin"
                value={formData.specifications.vin}
                onChange={handleInputChange}
                placeholder="Vehicle Identification Number"
              />
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <div className="form-action-group">
            <button
              type="button"
              className="form-cancel-btn"
              onClick={onCancel}
              disabled={loading}
            >
              <X size={16} />
              Cancel
            </button>
            
            <button
              type="button"
              className="form-save-draft-btn"
              disabled={loading}
            >
              <Save size={16} />
              Save Draft
            </button>
          </div>
          
          <button
            type="submit"
            className="form-submit-btn"
            disabled={loading || !selectedPlan}
          >
            {loading ? (
              <>
                <Clock size={16} />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
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
