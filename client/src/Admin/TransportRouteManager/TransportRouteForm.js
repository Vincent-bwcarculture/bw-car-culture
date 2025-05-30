// src/components/admin/TransportRouteManager/TransportRouteForm.js
import React, { useState, useEffect } from 'react';
import './TransportRouteForm.css';

const TransportRouteForm = ({ isOpen, onClose, onSubmit, initialData, providers }) => {
  const [formData, setFormData] = useState({
    routeData: {
      routeNumber: '',
      origin: '',
      destination: '',
      title: '',
      description: '',
      shortDescription: '',
      routeType: 'Bus',
      serviceType: 'Regular',
      providerId: '',
      schedule: {
        frequency: 'Daily',
        operatingDays: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: false
        },
        departureTimes: ['08:00', '12:00', '16:00'],
        returnTimes: [],
        duration: '2h',
        seasonalAvailability: {
          isYearRound: true,
          startDate: '',
          endDate: ''
        }
      },
      fare: 0,
      fareOptions: {
        currency: 'BWP',
        childFare: 0,
        seniorFare: 0,
        studentFare: 0,
        includesVAT: true,
        roundTripDiscount: 0
      },
      stops: [],
      amenities: [''],
      paymentMethods: ['Cash', 'Mobile Money'],
      status: 'active'
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
    { id: 'schedule', label: 'Schedule' },
    { id: 'fare', label: 'Fare & Options' },
    { id: 'stops', label: 'Stops' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'images', label: 'Images' }
  ];

  const routeTypes = ['Bus', 'Taxi', 'Shuttle', 'Train', 'Ferry', 'Other'];
  const serviceTypes = ['Regular', 'Express', 'Premium', 'Executive', 'Economy'];
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Initialize form with initial data if provided
  useEffect(() => {
    if (initialData) {
      // Create a clean version of the data
      const cleanData = {
        routeData: {
          ...initialData,
          // Remove fields that should not be sent back
          _id: undefined,
          __v: undefined,
          createdAt: undefined,
          updatedAt: undefined,
          images: undefined
        },
        keepImages: true,
        primaryImage: 0
      };
      
      setFormData(cleanData);
      
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
      // Set the first provider as default for new routes
      setFormData(prev => ({
        ...prev,
        routeData: {
          ...prev.routeData,
          providerId: providers[0]._id
        }
      }));
    }
  }, [initialData, providers]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested fields with dot notation
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      
      if (grandchild) {
        // Handle deeply nested fields (e.g., schedule.operatingDays.monday)
        setFormData(prev => ({
          ...prev,
          routeData: {
            ...prev.routeData,
            [parent]: {
              ...prev.routeData[parent],
              [child]: {
                ...prev.routeData[parent][child],
                [grandchild]: type === 'checkbox' ? checked : value
              }
            }
          }
        }));
      } else {
        // Handle single level nested fields (e.g., fareOptions.currency)
        setFormData(prev => ({
          ...prev,
          routeData: {
            ...prev.routeData,
            [parent]: {
              ...prev.routeData[parent],
              [child]: type === 'checkbox' ? checked : 
                      type === 'number' ? parseFloat(value) : value
            }
          }
        }));
      }
    } else {
      // Handle regular fields
      setFormData(prev => ({
        ...prev,
        routeData: {
          ...prev.routeData,
          [name]: type === 'checkbox' ? checked : 
                  name === 'fare' ? parseFloat(value) : value
        }
      }));
    }
  };

  const handleDepartureTimeChange = (index, value) => {
    const updatedTimes = [...formData.routeData.schedule.departureTimes];
    updatedTimes[index] = value;
    
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        schedule: {
          ...prev.routeData.schedule,
          departureTimes: updatedTimes
        }
      }
    }));
  };

  const addDepartureTime = () => {
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        schedule: {
          ...prev.routeData.schedule,
          departureTimes: [...prev.routeData.schedule.departureTimes, '']
        }
      }
    }));
  };

  const removeDepartureTime = (index) => {
    const updatedTimes = [...formData.routeData.schedule.departureTimes];
    updatedTimes.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        schedule: {
          ...prev.routeData.schedule,
          departureTimes: updatedTimes
        }
      }
    }));
  };

  const handleStopChange = (index, field, value) => {
    const updatedStops = [...formData.routeData.stops];
    updatedStops[index] = {
      ...updatedStops[index],
      [field]: field === 'fareFromOrigin' ? parseFloat(value) : value
    };
    
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        stops: updatedStops
      }
    }));
  };

  const addStop = () => {
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        stops: [
          ...prev.routeData.stops, 
          { name: '', arrivalTime: '', departureTime: '', fareFromOrigin: 0 }
        ]
      }
    }));
  };

  const removeStop = (index) => {
    const updatedStops = [...formData.routeData.stops];
    updatedStops.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        stops: updatedStops
      }
    }));
  };

  const handleAmenityChange = (index, value) => {
    const updatedAmenities = [...formData.routeData.amenities];
    updatedAmenities[index] = value;
    
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        amenities: updatedAmenities
      }
    }));
  };

  const addAmenity = () => {
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        amenities: [...prev.routeData.amenities, '']
      }
    }));
  };

  const removeAmenity = (index) => {
    const updatedAmenities = [...formData.routeData.amenities];
    updatedAmenities.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        amenities: updatedAmenities
      }
    }));
  };

  const handlePaymentMethodChange = (index, value) => {
    const updatedMethods = [...formData.routeData.paymentMethods];
    updatedMethods[index] = value;
    
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        paymentMethods: updatedMethods
      }
    }));
  };

  const addPaymentMethod = () => {
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        paymentMethods: [...prev.routeData.paymentMethods, '']
      }
    }));
  };

  const removePaymentMethod = (index) => {
    const updatedMethods = [...formData.routeData.paymentMethods];
    updatedMethods.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        paymentMethods: updatedMethods
      }
    }));
  };

  const handleSeasonalChange = (e) => {
    const { checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        schedule: {
          ...prev.routeData.schedule,
          seasonalAvailability: {
            ...prev.routeData.schedule.seasonalAvailability,
            isYearRound: checked
          }
        }
      }
    }));
  };

  const handleSeasonalDateChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        schedule: {
          ...prev.routeData.schedule,
          seasonalAvailability: {
            ...prev.routeData.schedule.seasonalAvailability,
            [field]: value
          }
        }
      }
    }));
  };

  const handleAllDaysChange = (e) => {
    const { checked } = e.target;
    
    const updatedOperatingDays = {};
    daysOfWeek.forEach(day => {
      updatedOperatingDays[day] = checked;
    });
    
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        schedule: {
          ...prev.routeData.schedule,
          operatingDays: updatedOperatingDays
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

  const generateTitle = () => {
    if (!formData.routeData.origin || !formData.routeData.destination) return;
    
    let title = `${formData.routeData.origin} to ${formData.routeData.destination}`;
    
    if (formData.routeData.routeNumber) {
      title = `${formData.routeData.routeNumber} - ${title}`;
    }
    
    if (formData.routeData.serviceType && formData.routeData.serviceType !== 'Regular') {
      title = `${title} (${formData.routeData.serviceType})`;
    }
    
    setFormData(prev => ({
      ...prev,
      routeData: {
        ...prev.routeData,
        title
      }
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  
  // Enhanced validation
  const validationErrors = [];
  
  if (!formData.routeData.origin || formData.routeData.origin.trim() === '') {
    validationErrors.push('Origin is required');
  }
  
  if (!formData.routeData.destination || formData.routeData.destination.trim() === '') {
    validationErrors.push('Destination is required');
  }
  
  if (!formData.routeData.providerId) {
    validationErrors.push('Provider selection is required');
  }
  
  if (!formData.routeData.routeType) {
    validationErrors.push('Route type is required');
  }
  
  if (!formData.routeData.fare || formData.routeData.fare <= 0) {
    validationErrors.push('Please provide a valid fare amount greater than 0');
  }
  
  if (!formData.routeData.description || formData.routeData.description.trim() === '') {
    validationErrors.push('Route description is required');
  }
  
  // Validate departure times
  if (!formData.routeData.schedule?.departureTimes || formData.routeData.schedule.departureTimes.length === 0) {
    validationErrors.push('At least one departure time is required');
  } else {
    const validTimes = formData.routeData.schedule.departureTimes.filter(time => time && time.trim() !== '');
    if (validTimes.length === 0) {
      validationErrors.push('At least one valid departure time is required');
    }
  }
  
  // Validate operating days
  const operatingDays = formData.routeData.schedule?.operatingDays || {};
  const hasOperatingDays = Object.values(operatingDays).some(day => day === true);
  if (!hasOperatingDays) {
    validationErrors.push('At least one operating day must be selected');
  }
  
  // Image validation for new routes
  if (!initialData && imageFiles.length === 0) {
    validationErrors.push('Please upload at least one image for the transport route');
  }
  
  if (validationErrors.length > 0) {
    setError(validationErrors.join('. '));
    return;
  }
  
  try {
    setLoading(true);
    
    // Prepare submission data
    const submissionData = {
      routeData: {
        ...formData.routeData,
        // Clean up departure times
        schedule: {
          ...formData.routeData.schedule,
          departureTimes: formData.routeData.schedule.departureTimes.filter(time => time && time.trim() !== '')
        }
      },
      keepImages: formData.keepImages,
      primaryImage: formData.primaryImage,
      images: imageFiles
    };
    
    // Clean up any empty specialties or amenities
    if (submissionData.routeData.amenities) {
      submissionData.routeData.amenities = submissionData.routeData.amenities
        .filter(amenity => amenity && amenity.trim() !== '');
    }
    
    if (submissionData.routeData.stops) {
      submissionData.routeData.stops = submissionData.routeData.stops
        .filter(stop => stop.name && stop.name.trim() !== '');
    }
    
    // Submit form
    await onSubmit(submissionData);
    
    // Clear form state on success
    onClose();
  } catch (err) {
    console.error('Error submitting transport route form:', err);
    setError(err.response?.data?.message || err.message || 'Failed to save transport route. Please try again.');
  } finally {
    setLoading(false);
  }
};

  if (!isOpen) return null;

  return (
    <div className="transport-form-overlay">
      <div className="transport-form-container">
        <div className="transport-form-header">
          <h2>{initialData ? 'Edit Transport Route' : 'Add New Transport Route'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {error && <div className="form-error-message">{error}</div>}
        
        <div className="transport-form-tabs">
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
        
        <form onSubmit={handleSubmit} className="transport-form">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="form-tab-content">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="providerId">Provider *</label>
                  <select
                    id="providerId"
                    name="providerId"
                    value={formData.routeData.providerId}
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
                  <label htmlFor="routeNumber">Route Number</label>
                  <input
                    type="text"
                    id="routeNumber"
                    name="routeNumber"
                    value={formData.routeData.routeNumber}
                    onChange={handleChange}
                    placeholder="e.g. A12"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="origin">Origin *</label>
                  <input
                    type="text"
                    id="origin"
                    name="origin"
                    value={formData.routeData.origin}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Gaborone"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="destination">Destination *</label>
                  <input
                    type="text"
                    id="destination"
                    name="destination"
                    value={formData.routeData.destination}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Francistown"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="title">Route Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.routeData.title}
                  onChange={handleChange}
                  placeholder="Leave blank to auto-generate"
                />
                <button 
                  type="button" 
                  className="auto-generate-btn"
                  onClick={generateTitle}
                  style={{ marginTop: '0.5rem', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                >
                  Auto-Generate
                </button>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="routeType">Route Type *</label>
                  <select
                    id="routeType"
                    name="routeType"
                    value={formData.routeData.routeType}
                    onChange={handleChange}
                    required
                  >
                    {routeTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="serviceType">Service Type</label>
                  <select
                    id="serviceType"
                    name="serviceType"
                    value={formData.routeData.serviceType}
                    onChange={handleChange}
                  >
                    {serviceTypes.map(type => (
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
                  value={formData.routeData.shortDescription}
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
                  value={formData.routeData.description}
                  onChange={handleChange}
                  required
                  placeholder="Detailed description of the route"
                  rows={5}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.routeData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="seasonal">Seasonal</option>
                  <option value="suspended">Suspended</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
            </div>
          )}
          
          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="form-tab-content">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="schedule.frequency">Frequency</label>
                  <select
                    id="schedule.frequency"
                    name="schedule.frequency"
                    value={formData.routeData.schedule?.frequency}
                    onChange={handleChange}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="schedule.duration">Journey Duration</label>
                  <input
                    type="text"
                    id="schedule.duration"
                    name="schedule.duration"
                    value={formData.routeData.schedule?.duration}
                    onChange={handleChange}
                    placeholder="e.g. 2h 30m"
                  />
                </div>
              </div>
              
              <h3>Operating Days</h3>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={Object.values(formData.routeData.schedule?.operatingDays || {}).every(day => day)}
                    onChange={handleAllDaysChange}
                  />
                  All Days
                </label>
              </div>
              
              <div className="operating-days">
                {daysOfWeek.map(day => (
                  <div className="form-group" key={day}>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name={`schedule.operatingDays.${day}`}
                        checked={formData.routeData.schedule?.operatingDays?.[day] || false}
                        onChange={handleChange}
                      />
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
              
              <h3>Departure Times</h3>
              {formData.routeData.schedule?.departureTimes?.map((time, index) => (
                <div className="departure-time" key={index}>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => handleDepartureTimeChange(index, e.target.value)}
                  />
                  {formData.routeData.schedule.departureTimes.length > 1 && (
                    <button 
                      type="button" 
                      className="remove-time-btn"
                      onClick={() => removeDepartureTime(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                className="add-time-btn"
                onClick={addDepartureTime}
              >
                + Add Departure Time
              </button>
              
              <h3>Seasonal Availability</h3>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.routeData.schedule?.seasonalAvailability?.isYearRound}
                    onChange={handleSeasonalChange}
                  />
                  Available Year-Round
                </label>
              </div>
              
              {!formData.routeData.schedule?.seasonalAvailability?.isYearRound && (
                <div className="seasonal-dates">
                  <div className="form-group">
                    <label htmlFor="startDate">Season Start Date</label>
                    <input
                      type="date"
                      id="startDate"
                      value={formData.routeData.schedule?.seasonalAvailability?.startDate || ''}
                      onChange={(e) => handleSeasonalDateChange('startDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="endDate">Season End Date</label>
                    <input
                      type="date"
                      id="endDate"
                      value={formData.routeData.schedule?.seasonalAvailability?.endDate || ''}
                      onChange={(e) => handleSeasonalDateChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Fare & Options Tab */}
          {activeTab === 'fare' && (
            <div className="form-tab-content">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fare">Fare Amount (BWP) *</label>
                  <input
                    type="number"
                    id="fare"
                    name="fare"
                    value={formData.routeData.fare}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="fareOptions.currency">Currency</label>
                  <select
                    id="fareOptions.currency"
                    name="fareOptions.currency"
                    value={formData.routeData.fareOptions?.currency}
                    onChange={handleChange}
                  >
                    <option value="BWP">BWP (Botswana Pula)</option>
                    <option value="ZAR">ZAR (South African Rand)</option>
                    <option value="USD">USD (US Dollar)</option>
                  </select>
                </div>
              </div>
              
              <div className="fare-options">
                <h3>Additional Fare Options</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fareOptions.childFare">Child Fare (BWP)</label>
                    <input
                      type="number"
                      id="fareOptions.childFare"
                      name="fareOptions.childFare"
                      value={formData.routeData.fareOptions?.childFare}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="fareOptions.seniorFare">Senior Fare (BWP)</label>
                    <input
                      type="number"
                      id="fareOptions.seniorFare"
                      name="fareOptions.seniorFare"
                      value={formData.routeData.fareOptions?.seniorFare}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fareOptions.studentFare">Student Fare (BWP)</label>
                    <input
                      type="number"
                      id="fareOptions.studentFare"
                      name="fareOptions.studentFare"
                      value={formData.routeData.fareOptions?.studentFare}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="fareOptions.roundTripDiscount">Round Trip Discount (%)</label>
                    <input
                      type="number"
                      id="fareOptions.roundTripDiscount"
                      name="fareOptions.roundTripDiscount"
                      value={formData.routeData.fareOptions?.roundTripDiscount}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      step="1"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="fareOptions.includesVAT"
                      checked={formData.routeData.fareOptions?.includesVAT}
                      onChange={handleChange}
                    />
                    Fares include VAT
                  </label>
                </div>
              </div>
              
              <h3>Payment Methods</h3>
              {formData.routeData.paymentMethods?.map((method, index) => (
                <div className="feature-input-row" key={index}>
                  <input
                    type="text"
                    value={method}
                    onChange={(e) => handlePaymentMethodChange(index, e.target.value)}
                    placeholder="Enter a payment method"
                  />
                  {formData.routeData.paymentMethods.length > 1 && (
                    <button 
                      type="button" 
                      className="remove-feature-btn"
                      onClick={() => removePaymentMethod(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                className="add-feature-btn"
                onClick={addPaymentMethod}
              >
                + Add Payment Method
              </button>
            </div>
          )}
          
          {/* Stops Tab */}
          {activeTab === 'stops' && (
            <div className="form-tab-content">
              <h3>Route Stops</h3>
              {formData.routeData.stops?.map((stop, index) => (
                <div className="route-stop" key={index}>
                  <div className="route-stop-header">
                    <div className="route-stop-title">
                      Stop {index + 1}: {stop.name || 'New Stop'}
                    </div>
                    <button 
                      type="button" 
                      className="remove-stop-btn"
                      onClick={() => removeStop(index)}
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`stop-name-${index}`}>Stop Name</label>
                    <input
                      type="text"
                      id={`stop-name-${index}`}
                      value={stop.name}
                      onChange={(e) => handleStopChange(index, 'name', e.target.value)}
                      placeholder="e.g. Palapye Bus Terminal"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor={`stop-arrival-${index}`}>Arrival Time</label>
                      <input
                        type="time"
                        id={`stop-arrival-${index}`}
                        value={stop.arrivalTime || ''}
                        onChange={(e) => handleStopChange(index, 'arrivalTime', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor={`stop-departure-${index}`}>Departure Time</label>
                      <input
                        type="time"
                        id={`stop-departure-${index}`}
                        value={stop.departureTime || ''}
                        onChange={(e) => handleStopChange(index, 'departureTime', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor={`stop-fare-${index}`}>Fare from Origin (BWP)</label>
                    <input
                      type="number"
                      id={`stop-fare-${index}`}
                      value={stop.fareFromOrigin || 0}
                      onChange={(e) => handleStopChange(index, 'fareFromOrigin', e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              ))}
              
              <button 
                type="button" 
                className="add-stop-btn"
                onClick={addStop}
              >
                + Add Stop
              </button>
            </div>
          )}
          
          {/* Amenities Tab */}
          {activeTab === 'amenities' && (
            <div className="form-tab-content">
              <h3>Amenities</h3>
              {formData.routeData.amenities?.map((amenity, index) => (
                <div className="feature-input-row" key={index}>
                  <input
                    type="text"
                    value={amenity}
                    onChange={(e) => handleAmenityChange(index, e.target.value)}
                    placeholder="Enter an amenity (e.g. 'Free Wi-Fi')"
                  />
                  {formData.routeData.amenities.length > 1 && (
                    <button 
                      type="button" 
                      className="remove-feature-btn"
                      onClick={() => removeAmenity(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                className="add-feature-btn"
                onClick={addAmenity}
              >
                + Add Amenity
              </button>
            </div>
          )}
          
          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="form-tab-content">
              <h3>Route Images</h3>
              
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
                  id="route-images"
                  style={{ display: 'none' }}
                />
                <label htmlFor="route-images" className="upload-image-btn">
                  + Upload Images
                </label>
                
                <p className="upload-note">
                  You can upload multiple images at once. One image should be marked as primary.
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
                          alt={`Preview ${index + 1}`} 
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
              {loading ? 'Saving...' : initialData ? 'Update Route' : 'Add Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransportRouteForm;