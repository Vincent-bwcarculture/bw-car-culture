// src/components/admin/TrailerListingManager/TrailerListingForm.js
import React, { useState, useEffect } from 'react';
import './TrailerListingForm.css';

const TrailerListingForm = ({ isOpen, onClose, onSubmit, initialData, providers }) => {
  const [formData, setFormData] = useState({
    trailerData: {
      title: '',
      description: '',
      shortDescription: '',
      trailerType: 'Utility',
      providerId: '',
      specifications: {
        make: '',
        model: '',
        year: new Date().getFullYear(),
        size: {
          length: 0,
          width: 0,
          height: 0
        },
        capacity: {
          weight: 0,
          volume: 0
        },
        axles: 1,
        braked: false,
        suspension: '',
        hitch: 'ball',
        features: ['']
      },
      requirements: {
        towingCapacity: 0,
        electricalConnection: '7-pin',
        licenseClass: '',
        vehicleRequirements: ''
      },
      rates: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        security: 0,
        includesVAT: true,
        deliveryAvailable: false,
        deliveryFee: 0,
        deliveryDistance: 0
      },
      rentalTerms: {
        minimumAge: 21,
        minimumRentalPeriod: 1,
        depositRequired: true,
        licenseRequired: true,
        fuelPolicy: 'full-to-full',
        lateFeeRate: 0
      },
      location: {
        city: '',
        country: ''
      },
      status: 'available',
      availability: 'available'
    },
    images: [],
    primaryImage: 0,
    keepImages: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  
  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'requirements', label: 'Requirements' },
    { id: 'rates', label: 'Rates & Terms' },
    { id: 'location', label: 'Location' },
    { id: 'images', label: 'Images' }
  ];

  const trailerTypes = [
    'Utility', 'Car Carrier', 'Enclosed', 'Flatbed', 'Dump',
    'Boat', 'Horse', 'Livestock', 'Travel', 'Toy Hauler',
    'Equipment', 'Heavy Duty', 'Refrigerated', 'Tank', 'Other'
  ];

  const hitchTypes = ['ball', 'pintle', 'gooseneck', 'fifth-wheel', 'other'];
  const electricalConnections = ['7-pin', '4-pin', 'none'];

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      // Prepare initial form data from existing trailer
      const preparedData = {
        trailerData: {
          ...initialData,
          // Remove unnecessary fields that should not be sent in API requests
          images: undefined,
          _id: undefined,
          __v: undefined,
          createdAt: undefined,
          updatedAt: undefined
        },
        keepImages: true,
        primaryImage: 0
      };
      
      setFormData(preparedData);
      
      // Set up image previews for existing images
      if (initialData.images && initialData.images.length > 0) {
        const previews = initialData.images.map(img => img.url);
        setImagePreviewUrls(previews);
        
        // Find primary image index
        const primaryIndex = initialData.images.findIndex(img => img.isPrimary);
        if (primaryIndex !== -1) {
          setFormData(prev => ({
            ...prev,
            primaryImage: primaryIndex
          }));
        }
      }
    } else if (providers && providers.length > 0) {
      // Set the first provider as default for new trailers
      setFormData(prev => ({
        ...prev,
        trailerData: {
          ...prev.trailerData,
          providerId: providers[0]._id
        }
      }));
    }
  }, [initialData, providers]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested fields with dot notation
    if (name.includes('.')) {
      const parts = name.split('.');
      const field1 = parts[0];
      const field2 = parts[1];
      const field3 = parts.length > 2 ? parts[2] : null;
      
      if (field3) {
        // Handle deeply nested fields (e.g., specifications.size.length)
        setFormData(prev => ({
          ...prev,
          trailerData: {
            ...prev.trailerData,
            [field1]: {
              ...prev.trailerData[field1],
              [field2]: {
                ...prev.trailerData[field1][field2],
                [field3]: type === 'checkbox' ? checked : 
                         type === 'number' ? parseFloat(value) : value
              }
            }
          }
        }));
      } else {
        // Handle single level nested fields (e.g., rates.daily)
        setFormData(prev => ({
          ...prev,
          trailerData: {
            ...prev.trailerData,
            [field1]: {
              ...prev.trailerData[field1],
              [field2]: type === 'checkbox' ? checked : 
                       type === 'number' ? parseFloat(value) : value
            }
          }
        }));
      }
    } else {
      // Handle regular fields
      setFormData(prev => ({
        ...prev,
        trailerData: {
          ...prev.trailerData,
          [name]: type === 'checkbox' ? checked : value
        }
      }));
    }
  };

  const handleSpecificationsChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      trailerData: {
        ...prev.trailerData,
        specifications: {
          ...prev.trailerData.specifications,
          [name]: type === 'checkbox' ? checked : 
                  type === 'number' ? parseFloat(value) : value
        }
      }
    }));
  };

  const handleRequirementsChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      trailerData: {
        ...prev.trailerData,
        requirements: {
          ...prev.trailerData.requirements,
          [name]: type === 'checkbox' ? checked : 
                  type === 'number' ? parseFloat(value) : value
        }
      }
    }));
  };

  const handleRatesChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      trailerData: {
        ...prev.trailerData,
        rates: {
          ...prev.trailerData.rates,
          [name]: type === 'checkbox' ? checked : 
                  type === 'number' || ['daily', 'weekly', 'monthly', 'security', 'deliveryFee', 'deliveryDistance'].includes(name) ? 
                  parseFloat(value) : value
        }
      }
    }));
  };

  const handleRentalTermsChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      trailerData: {
        ...prev.trailerData,
        rentalTerms: {
          ...prev.trailerData.rentalTerms,
          [name]: type === 'checkbox' ? checked : 
                  type === 'number' ? parseFloat(value) : value
        }
      }
    }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      trailerData: {
        ...prev.trailerData,
        location: {
          ...prev.trailerData.location,
          [name]: value
        }
      }
    }));
  };

  const handleSizeChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      trailerData: {
        ...prev.trailerData,
        specifications: {
          ...prev.trailerData.specifications,
          size: {
            ...prev.trailerData.specifications.size,
            [field]: parseFloat(value)
          }
        }
      }
    }));
  };

  const handleCapacityChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      trailerData: {
        ...prev.trailerData,
        specifications: {
          ...prev.trailerData.specifications,
          capacity: {
            ...prev.trailerData.specifications.capacity,
            [field]: parseFloat(value)
          }
        }
      }
    }));
  };

  const handleFeaturesChange = (index, value) => {
    const updatedFeatures = [...formData.trailerData.specifications.features];
    updatedFeatures[index] = value;
    
    setFormData(prev => ({
      ...prev,
      trailerData: {
        ...prev.trailerData,
        specifications: {
          ...prev.trailerData.specifications,
          features: updatedFeatures
        }
      }
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      trailerData: {
        ...prev.trailerData,
        specifications: {
          ...prev.trailerData.specifications,
          features: [...prev.trailerData.specifications.features, '']
        }
      }
    }));
  };

  const removeFeature = (index) => {
    const updatedFeatures = [...formData.trailerData.specifications.features];
    updatedFeatures.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      trailerData: {
        ...prev.trailerData,
        specifications: {
          ...prev.trailerData.specifications,
          features: updatedFeatures
        }
      }
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Add to imageFiles array for submission
    setImageFiles(prev => [...prev, ...files]);
    
    // Create preview URLs
    const newImagePreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newImagePreviewUrls]);
  };

  const removeImage = (index) => {
    // Remove from state arrays
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    
    // Remove preview URL and revoke object URL to avoid memory leaks
    const urlToRemove = imagePreviewUrls[index];
    URL.revokeObjectURL(urlToRemove);
    
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    
    // If removing primary image, set first image as primary
    if (formData.primaryImage === index) {
      setFormData(prev => ({
        ...prev,
        primaryImage: 0
      }));
    } else if (formData.primaryImage > index) {
      // Adjust primary image index if it's after the removed image
      setFormData(prev => ({
        ...prev,
        primaryImage: prev.primaryImage - 1
      }));
    }
  };

  const setPrimaryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      primaryImage: index
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate form data
    if (!formData.trailerData.title || !formData.trailerData.providerId || !formData.trailerData.trailerType) {
      setError('Please provide a title, select a provider, and choose a trailer type');
      return;
    }
    
    if (!formData.trailerData.rates.daily || formData.trailerData.rates.daily <= 0) {
      setError('Please provide a valid daily rate');
      return;
    }
    
    if (!formData.trailerData.specifications.size.length || !formData.trailerData.specifications.size.width) {
      setError('Please provide trailer dimensions (length and width)');
      return;
    }
    
    if (!formData.trailerData.specifications.capacity.weight) {
      setError('Please provide the weight capacity');
      return;
    }
    
    if (!initialData && imageFiles.length === 0) {
      setError('Please upload at least one image');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare submission data
      const submissionData = {
        trailerData: formData.trailerData,
        keepImages: formData.keepImages,
        primaryImage: formData.primaryImage,
        images: imageFiles
      };
      
      // Submit form
      await onSubmit(submissionData);
      
      // Clear form state
      onClose();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.message || 'Failed to save trailer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="trailer-form-overlay">
      <div className="trailer-form-container">
        <div className="trailer-form-header">
          <h2>{initialData ? 'Edit Trailer Listing' : 'Add New Trailer Listing'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {error && <div className="form-error-message">{error}</div>}
        
        <div className="trailer-form-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="trailer-form">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="form-tab-content">
              <div className="form-group">
                <label htmlFor="title">Trailer Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.trailerData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 16ft Car Trailer"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="providerId">Provider *</label>
                  <select
                    id="providerId"
                    name="providerId"
                    value={formData.trailerData.providerId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Provider</option>
                    {providers?.map(provider => (
                      <option key={provider._id} value={provider._id}>
                        {provider.businessName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="trailerType">Trailer Type *</label>
                  <select
                    id="trailerType"
                    name="trailerType"
                    value={formData.trailerData.trailerType}
                    onChange={handleChange}
                    required
                  >
                    {trailerTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="shortDescription">Short Description</label>
                <input
                  type="text"
                  id="shortDescription"
                  name="shortDescription"
                  value={formData.trailerData.shortDescription}
                  onChange={handleChange}
                  placeholder="Brief description (max 200 characters)"
                  maxLength={200}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Full Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.trailerData.description}
                  onChange={handleChange}
                  required
                  placeholder="Detailed description of the trailer"
                  rows={5}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.trailerData.status}
                    onChange={handleChange}
                  >
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="availability">Availability</label>
                  <select
                    id="availability"
                    name="availability"
                    value={formData.trailerData.availability}
                    onChange={handleChange}
                  >
                    <option value="available">Available</option>
                    <option value="limited">Limited</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="booked">Booked</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="specifications.make">Make</label>
                  <input
                    type="text"
                    id="specifications.make"
                    name="make"
                    value={formData.trailerData.specifications.make}
                    onChange={handleSpecificationsChange}
                    placeholder="e.g. Trailer King"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="specifications.model">Model</label>
                  <input
                    type="text"
                    id="specifications.model"
                    name="model"
                    value={formData.trailerData.specifications.model}
                    onChange={handleSpecificationsChange}
                    placeholder="e.g. TK-2000"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="specifications.year">Year</label>
                <input
                  type="number"
                  id="specifications.year"
                  name="year"
                  value={formData.trailerData.specifications.year}
                  onChange={handleSpecificationsChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>
            </div>
          )}
          
          {/* Specifications Tab */}
          {activeTab === 'specifications' && (
            <div className="form-tab-content">
              <h3>Trailer Dimensions</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="size.length">Length (meters) *</label>
                  <input
                    type="number"
                    id="size.length"
                    value={formData.trailerData.specifications.size.length}
                    onChange={(e) => handleSizeChange('length', e.target.value)}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="size.width">Width (meters) *</label>
                  <input
                    type="number"
                    id="size.width"
                    value={formData.trailerData.specifications.size.width}
                    onChange={(e) => handleSizeChange('width', e.target.value)}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="size.height">Height (meters)</label>
                  <input
                    type="number"
                    id="size.height"
                    value={formData.trailerData.specifications.size.height}
                    onChange={(e) => handleSizeChange('height', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <h3>Capacity</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="capacity.weight">Weight Capacity (kg) *</label>
                  <input
                    type="number"
                    id="capacity.weight"
                    value={formData.trailerData.specifications.capacity.weight}
                    onChange={(e) => handleCapacityChange('weight', e.target.value)}
                    required
                    min="0"
                    step="1"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="capacity.volume">Volume Capacity (cubic meters)</label>
                  <input
                    type="number"
                    id="capacity.volume"
                    value={formData.trailerData.specifications.capacity.volume}
                    onChange={(e) => handleCapacityChange('volume', e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="specifications.axles">Number of Axles</label>
                  <select
                    id="specifications.axles"
                    name="axles"
                    value={formData.trailerData.specifications.axles}
                    onChange={handleSpecificationsChange}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="specifications.hitch">Hitch Type</label>
                  <select
                    id="specifications.hitch"
                    name="hitch"
                    value={formData.trailerData.specifications.hitch}
                    onChange={handleSpecificationsChange}
                  >
                    {hitchTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="specifications.suspension">Suspension Type</label>
                  <input
                    type="text"
                    id="specifications.suspension"
                    name="suspension"
                    value={formData.trailerData.specifications.suspension}
                    onChange={handleSpecificationsChange}
                    placeholder="e.g. Leaf Spring"
                  />
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      id="specifications.braked"
                      name="braked"
                      checked={formData.trailerData.specifications.braked}
                      onChange={handleSpecificationsChange}
                    />
                    Trailer has brakes
                  </label>
                </div>
              </div>
              
              <h3>Features</h3>
              {formData.trailerData.specifications.features.map((feature, index) => (
                <div className="feature-input-row" key={index}>
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeaturesChange(index, e.target.value)}
                    placeholder="Enter a feature (e.g. 'Drop-down Ramp')"
                  />
                  {formData.trailerData.specifications.features.length > 1 && (
                    <button 
                      type="button" 
                      className="remove-feature-btn"
                      onClick={() => removeFeature(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                className="add-feature-btn"
                onClick={addFeature}
              >
                + Add Feature
              </button>
            </div>
          )}
          
          {/* Requirements Tab */}
          {activeTab === 'requirements' && (
            <div className="form-tab-content">
              <h3>Vehicle Requirements</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="requirements.towingCapacity">Minimum Towing Capacity (kg)</label>
                  <input
                    type="number"
                    id="requirements.towingCapacity"
                    name="towingCapacity"
                    value={formData.trailerData.requirements.towingCapacity}
                    onChange={handleRequirementsChange}
                    min="0"
                    step="1"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="requirements.electricalConnection">Electrical Connection</label>
                  <select
                    id="requirements.electricalConnection"
                    name="electricalConnection"
                    value={formData.trailerData.requirements.electricalConnection}
                    onChange={handleRequirementsChange}
                  >
                    {electricalConnections.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="requirements.licenseClass">License Class Required</label>
                  <input
                    type="text"
                    id="requirements.licenseClass"
                    name="licenseClass"
                    value={formData.trailerData.requirements.licenseClass}
                    onChange={handleRequirementsChange}
                    placeholder="e.g. Standard"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="requirements.vehicleRequirements">Additional Vehicle Requirements</label>
                <textarea
                  id="requirements.vehicleRequirements"
                  name="vehicleRequirements"
                  value={formData.trailerData.requirements.vehicleRequirements}
                  onChange={handleRequirementsChange}
                  placeholder="Any additional requirements for the towing vehicle"
                  rows={4}
                />
              </div>
            </div>
          )}
          
          {/* Rates & Terms Tab */}
          {activeTab === 'rates' && (
            <div className="form-tab-content">
              <h3>Rental Rates</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="rates.daily">Daily Rate (BWP) *</label>
                  <input
                    type="number"
                    id="rates.daily"
                    name="daily"
                    value={formData.trailerData.rates.daily}
                    onChange={handleRatesChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="rates.weekly">Weekly Rate (BWP)</label>
                  <input
                    type="number"
                    id="rates.weekly"
                    name="weekly"
                    value={formData.trailerData.rates.weekly}
                    onChange={handleRatesChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="rates.monthly">Monthly Rate (BWP)</label>
                  <input
                    type="number"
                    id="rates.monthly"
                    name="monthly"
                    value={formData.trailerData.rates.monthly}
                    onChange={handleRatesChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="rates.security">Security Deposit (BWP)</label>
                  <input
                    type="number"
                    id="rates.security"
                    name="security"
                    value={formData.trailerData.rates.security}
                    onChange={handleRatesChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    id="rates.includesVAT"
                    name="includesVAT"
                    checked={formData.trailerData.rates.includesVAT}
                    onChange={handleRatesChange}
                  />
                  Rates include VAT
                </label>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    id="rates.deliveryAvailable"
                    name="deliveryAvailable"
                    checked={formData.trailerData.rates.deliveryAvailable}
                    onChange={handleRatesChange}
                  />
                  Delivery Available
                </label>
              </div>
              
              {formData.trailerData.rates.deliveryAvailable && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="rates.deliveryFee">Delivery Fee (BWP)</label>
                    <input
                      type="number"
                      id="rates.deliveryFee"
                      name="deliveryFee"
                      value={formData.trailerData.rates.deliveryFee}
                      onChange={handleRatesChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="rates.deliveryDistance">Maximum Delivery Distance (km)</label>
                    <input
                      type="number"
                      id="rates.deliveryDistance"
                      name="deliveryDistance"
                      value={formData.trailerData.rates.deliveryDistance}
                      onChange={handleRatesChange}
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
              )}
              
              <h3>Rental Terms</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="rentalTerms.minimumAge">Minimum Driver Age</label>
                  <input
                    type="number"
                    id="rentalTerms.minimumAge"
                    name="minimumAge"
                    value={formData.trailerData.rentalTerms.minimumAge}
                    onChange={handleRentalTermsChange}
                    min="18"
                    max="99"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="rentalTerms.minimumRentalPeriod">Minimum Rental Period (days)</label>
                  <input
                    type="number"
                    id="rentalTerms.minimumRentalPeriod"
                    name="minimumRentalPeriod"
                    value={formData.trailerData.rentalTerms.minimumRentalPeriod}
                    onChange={handleRentalTermsChange}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="rentalTerms.lateFeeRate">Late Return Fee (BWP/day)</label>
                  <input
                    type="number"
                    id="rentalTerms.lateFeeRate"
                    name="lateFeeRate"
                    value={formData.trailerData.rentalTerms.lateFeeRate}
                    onChange={handleRentalTermsChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    id="rentalTerms.depositRequired"
                    name="depositRequired"
                    checked={formData.trailerData.rentalTerms.depositRequired}
                    onChange={handleRentalTermsChange}
                  />
                  Security deposit required
                </label>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    id="rentalTerms.licenseRequired"
                    name="licenseRequired"
                    checked={formData.trailerData.rentalTerms.licenseRequired}
                    onChange={handleRentalTermsChange}
                  />
                  Driver's license required
                </label>
              </div>
            </div>
          )}
          
          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="form-tab-content">
              <h3>Trailer Location</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location.city">City *</label>
                  <input
                    type="text"
                    id="location.city"
                    name="city"
                    value={formData.trailerData.location.city}
                    onChange={handleLocationChange}
                    required
                    placeholder="e.g. Gaborone"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="location.country">Country *</label>
                  <input
                    type="text"
                    id="location.country"
                    name="country"
                    value={formData.trailerData.location.country}
                    onChange={handleLocationChange}
                    required
                    placeholder="e.g. Botswana"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="form-tab-content">
              <h3>Trailer Images</h3>
              
              {initialData && initialData.images && initialData.images.length > 0 && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.keepImages}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          keepImages: e.target.checked
                        }));
                      }}
                    />
                    Keep existing images
                  </label>
                </div>
              )}
              
              <div className="image-upload-container">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  id="trailer-images"
                  style={{ display: 'none' }}
                />
                <label htmlFor="trailer-images" className="upload-image-btn">
                  + Upload Images
                </label>
                
                <p className="upload-note">
                  You can upload multiple images at once. The first image will be the primary image.
                </p>
              </div>
              
              {imagePreviewUrls.length > 0 && (
                <div className="image-previews">
                  <h4>Images ({imagePreviewUrls.length})</h4>
                  <div className="image-grid">
                    {imagePreviewUrls.map((url, index) => (
                      <div 
                        key={index} 
                        className={`image-preview-container ${formData.primaryImage === index ? 'primary' : ''}`}
                      >
                        <img 
                          src={url} 
                          alt={`Trailer preview ${index + 1}`} 
                          className="image-preview" 
                        />
                        <div className="image-preview-actions">
                          <button
                            type="button"
                            className={`primary-toggle ${formData.primaryImage === index ? 'is-primary' : ''}`}
                            onClick={() => setPrimaryImage(index)}
                            title={formData.primaryImage === index ? 'Primary Image' : 'Set as Primary'}
                          >
                            {formData.primaryImage === index ? '★' : '☆'}
                          </button>
                          <button
                            type="button"
                            className="remove-image"
                            onClick={() => removeImage(index)}
                            title="Remove Image"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : initialData ? 'Update Trailer' : 'Add Trailer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrailerListingForm;