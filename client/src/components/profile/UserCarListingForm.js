// client/src/components/profile/UserCarListingForm.js
// COMPLETE car listing form for users with all tabs and functionality

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
      financing: false
    },
    
    // Contact Information
    contact: {
      sellerName: '',
      phone: '',
      email: '',
      preferredContactMethod: 'whatsapp',
      location: {
        city: '',
        area: '',
        allowViewings: true,
        viewingNotes: ''
      }
    },
    
    // Features
    features: [],
    safetyFeatures: [],
    comfortFeatures: [],
    exteriorFeatures: [],
    interiorFeatures: [],
    
    // Images
    images: [],
    
    // Additional Details
    hasServiceHistory: false,
    serviceHistory: '',
    reasonForSelling: '',
    additionalNotes: '',
    keyCount: '2',
    accidents: false,
    accidentDetails: '',
    modifications: false,
    modificationDetails: '',
    warranty: false,
    warrantyDetails: ''
  });

  // Feature options
  const featureOptions = {
    safety: [
      'ABS', 'Airbags (Multiple)', 'Electronic Stability Control', 
      'Traction Control', 'Parking Sensors', 'Reverse Camera', 
      'Blind Spot Monitoring', 'Lane Departure Warning', 
      'Adaptive Cruise Control', 'Emergency Braking', 
      'Hill Start Assist', 'Roll Stability Control'
    ],
    comfort: [
      'Air Conditioning', 'Climate Control', 'Heated Seats', 
      'Cooled Seats', 'Power Windows', 'Power Steering', 
      'Cruise Control', 'Keyless Entry', 'Push Button Start', 
      'Remote Start', 'Memory Seats', 'Lumbar Support',
      'Adjustable Steering Wheel', 'Cup Holders'
    ],
    exterior: [
      'Alloy Wheels', 'LED Headlights', 'Fog Lights', 
      'Sunroof', 'Roof Rails', 'Running Boards', 
      'Tinted Windows', 'Chrome Trim', 'Spoiler',
      'Bull Bar', 'Tow Bar', 'Side Steps'
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
      
      // Include selected plan and addons in submission
      const submissionData = {
        ...formData,
        selectedPlan,
        selectedAddons,
        status: 'draft' // Will be activated after payment
      };
      
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
                  required
                />
                {errors.title && <span className="error-message">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category*</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="car">Car</option>
                  <option value="suv">SUV</option>
                  <option value="truck">Truck</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="commercial">Commercial Vehicle</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="condition">Condition*</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  required
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
                  <option value="hatchback">Hatchback</option>
                  <option value="suv">SUV</option>
                  <option value="coupe">Coupe</option>
                  <option value="convertible">Convertible</option>
                  <option value="wagon">Wagon</option>
                  <option value="pickup">Pickup Truck</option>
                  <option value="van">Van</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Description*</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your vehicle's condition, features, and any important details..."
                  rows="6"
                  className={errors.description ? 'error' : ''}
                  required
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
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
                  required
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
                  required
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
                  required
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
                  placeholder="e.g., 45000"
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
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                  <option value="cvt">CVT</option>
                  <option value="semi-automatic">Semi-Automatic</option>
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
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                  <option value="lpg">LPG</option>
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
                  <option value="fwd">Front Wheel Drive</option>
                  <option value="rwd">Rear Wheel Drive</option>
                  <option value="awd">All Wheel Drive</option>
                  <option value="4wd">4 Wheel Drive</option>
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
                  <option value="">Select Doors</option>
                  <option value="2">2 Doors</option>
                  <option value="3">3 Doors</option>
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
                  <option value="">Select Seats</option>
                  <option value="2">2 Seats</option>
                  <option value="4">4 Seats</option>
                  <option value="5">5 Seats</option>
                  <option value="7">7 Seats</option>
                  <option value="8">8 Seats</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="vin">VIN Number</label>
                <input
                  type="text"
                  id="vin"
                  name="specifications.vin"
                  value={formData.specifications.vin}
                  onChange={handleInputChange}
                  placeholder="Vehicle Identification Number"
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
                <label htmlFor="price">Price (BWP)*</label>
                <input
                  type="number"
                  id="price"
                  name="pricing.price"
                  value={formData.pricing.price}
                  onChange={handleInputChange}
                  placeholder="e.g., 150000"
                  className={errors['pricing.price'] ? 'error' : ''}
                  required
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
                  <option value="fixed">Fixed Price</option>
                  <option value="negotiable">Negotiable</option>
                  <option value="best_offer">Best Offer</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  name="pricing.currency"
                  value={formData.pricing.currency}
                  onChange={handleInputChange}
                >
                  <option value="BWP">BWP</option>
                  <option value="USD">USD</option>
                  <option value="ZAR">ZAR</option>
                </select>
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
                  placeholder="Your name or business name"
                  className={errors['contact.sellerName'] ? 'error' : ''}
                  required
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
                  placeholder="e.g., +26771234567"
                  className={errors['contact.phone'] ? 'error' : ''}
                  required
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
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="preferredContactMethod">Preferred Contact Method</label>
                <select
                  id="preferredContactMethod"
                  name="contact.preferredContactMethod"
                  value={formData.contact.preferredContactMethod}
                  onChange={handleInputChange}
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="phone">Phone Call</option>
                  <option value="both">Both WhatsApp & Phone</option>
                  <option value="email">Email</option>
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
                  required
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
                  placeholder="e.g., CBD"
                />
              </div>

              <div className="form-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="contact.location.allowViewings"
                    checked={formData.contact.location.allowViewings}
                    onChange={handleInputChange}
                  />
                  <span>Allow vehicle viewings</span>
                </label>
              </div>

              {formData.contact.location.allowViewings && (
                <div className="form-group full-width">
                  <label htmlFor="viewingNotes">Viewing Notes</label>
                  <textarea
                    id="viewingNotes"
                    name="contact.location.viewingNotes"
                    value={formData.contact.location.viewingNotes}
                    onChange={handleInputChange}
                    placeholder="Any specific instructions for viewing the vehicle..."
                    rows="3"
                  />
                </div>
              )}
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
                  <small>Click to select multiple photos</small>
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
                      <Trash2 size={16} />
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

              <div className="form-group">
                <label htmlFor="keyCount">Number of Keys</label>
                <select
                  id="keyCount"
                  name="keyCount"
                  value={formData.keyCount}
                  onChange={handleInputChange}
                >
                  <option value="1">1 Key</option>
                  <option value="2">2 Keys</option>
                  <option value="3">3+ Keys</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="accidents"
                    checked={formData.accidents}
                    onChange={handleInputChange}
                  />
                  <span>Vehicle has been in an accident</span>
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

              <div className="form-group full-width">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="modifications"
                    checked={formData.modifications}
                    onChange={handleInputChange}
                  />
                  <span>Vehicle has modifications</span>
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
              disabled={loading || !selectedPlan}
            >
              {loading ? 'Processing...' : 'Continue to Payment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserCarListingForm;
