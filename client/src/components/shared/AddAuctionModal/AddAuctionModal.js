// src/components/shared/AddAuctionModal/AddAuctionModal.js
import React, { useState, useEffect, useRef } from 'react';
import './AddAuctionModal.css';

const AddAuctionModal = ({ isOpen, onClose, onSubmit, initialData, loading }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    vehicle: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      mileage: '',
      transmission: '',
      fuelType: '',
      engineSize: '',
      power: '',
      torque: '',
      drivetrain: '',
      exteriorColor: '',
      interiorColor: '',
      vin: ''
    },
    location: {
      address: '',
      city: '',
      state: '',
      country: 'United States',
      postalCode: ''
    },
    startingBid: '',
    reservePrice: '',
    incrementAmount: 100,
    startDate: '',
    endDate: '',
    features: [],
    termsAccepted: false
  });
  
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [featureInput, setFeatureInput] = useState('');
  const [removedImages, setRemovedImages] = useState([]);

  useEffect(() => {
    // Reset form when modal opens or initialData changes
    if (isOpen) {
      if (initialData) {
        // Editing existing auction
        setFormData({
          ...initialData,
          vehicle: {
            ...initialData.vehicle
          },
          location: {
            ...initialData.location
          }
        });
        
        if (initialData.images && initialData.images.length > 0) {
          setPreviewImages(initialData.images.map(img => img.url));
          setPrimaryImageIndex(initialData.images.findIndex(img => img.isPrimary) || 0);
        } else {
          setPreviewImages([]);
          setPrimaryImageIndex(0);
        }
        
        setImages([]);
        setRemovedImages([]);
      } else {
        // Creating new auction
        resetForm();
      }
    }
  }, [isOpen, initialData]);

  const resetForm = () => {
    // Default dates for new auctions
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    setFormData({
      title: '',
      description: '',
      vehicle: {
        make: '',
        model: '',
        year: new Date().getFullYear(),
        mileage: '',
        transmission: '',
        fuelType: '',
        engineSize: '',
        power: '',
        torque: '',
        drivetrain: '',
        exteriorColor: '',
        interiorColor: '',
        vin: ''
      },
      location: {
        address: '',
        city: '',
        state: '',
        country: 'United States',
        postalCode: ''
      },
      startingBid: '',
      reservePrice: '',
      incrementAmount: 100,
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      features: [],
      termsAccepted: false
    });
    
    setImages([]);
    setPreviewImages([]);
    setPrimaryImageIndex(0);
    setFeatureInput('');
    setRemovedImages([]);
    setActiveTab('basic');
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : Number(value);
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: numValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    }
  };

  const handleCheckbox = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Limit to 10 images total
    if (previewImages.length + files.length > 10) {
      setError('You can upload a maximum of 10 images');
      return;
    }
    
    // Process each file
    const newImages = [...images];
    const newPreviewImages = [...previewImages];
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        newImages.push(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviewImages.push(e.target.result);
          setPreviewImages([...newPreviewImages]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    setImages(newImages);
  };

  const removeImage = (index) => {
    // If removing an existing image (from initialData)
    if (index < previewImages.length - images.length) {
      if (initialData && initialData.images) {
        setRemovedImages([...removedImages, initialData.images[index].url]);
      }
    }
    
    const newPreviewImages = [...previewImages];
    newPreviewImages.splice(index, 1);
    setPreviewImages(newPreviewImages);
    
    if (index >= previewImages.length - images.length) {
      // Removing a newly added image
      const newImageIndex = index - (previewImages.length - images.length);
      const newImages = [...images];
      newImages.splice(newImageIndex, 1);
      setImages(newImages);
    }
    
    // Adjust primaryImageIndex if needed
    if (index === primaryImageIndex) {
      setPrimaryImageIndex(newPreviewImages.length > 0 ? 0 : -1);
    } else if (index < primaryImageIndex) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }
  };

  const setPrimaryImage = (index) => {
    setPrimaryImageIndex(index);
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, featureInput.trim()]
    }));
    setFeatureInput('');
  };

  const handleFeatureKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature();
    }
  };

  const removeFeature = (index) => {
    setFormData(prev => {
      const newFeatures = [...prev.features];
      newFeatures.splice(index, 1);
      return {
        ...prev,
        features: newFeatures
      };
    });
  };

  const validateForm = () => {
    // Basic validation
    if (!formData.title.trim()) {
      setError('Title is required');
      setActiveTab('basic');
      return false;
    }
    
    if (!formData.description.trim()) {
      setError('Description is required');
      setActiveTab('basic');
      return false;
    }
    
    // Vehicle validation
    if (!formData.vehicle.make.trim() || !formData.vehicle.model.trim()) {
      setError('Vehicle make and model are required');
      setActiveTab('vehicle');
      return false;
    }
    
    if (!formData.vehicle.year || !formData.vehicle.mileage) {
      setError('Vehicle year and mileage are required');
      setActiveTab('vehicle');
      return false;
    }
    
    if (!formData.vehicle.transmission || !formData.vehicle.fuelType) {
      setError('Vehicle transmission and fuel type are required');
      setActiveTab('vehicle');
      return false;
    }
    
    // Images validation
    if (previewImages.length === 0) {
      setError('At least one image is required');
      setActiveTab('images');
      return false;
    }
    
    // Auction details validation
    if (!formData.startingBid) {
      setError('Starting bid is required');
      setActiveTab('auction');
      return false;
    }
    
    if (!formData.startDate || !formData.endDate) {
      setError('Start and end dates are required');
      setActiveTab('auction');
      return false;
    }
    
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('End date must be after start date');
      setActiveTab('auction');
      return false;
    }
    
    // Location validation
    if (!formData.location.city.trim() || !formData.location.state.trim()) {
      setError('City and state are required');
      setActiveTab('location');
      return false;
    }
    
    if (!formData.termsAccepted) {
      setError('You must accept the terms and conditions');
      setActiveTab('location');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      // Prepare form data for submission
      const auctionFormData = new FormData();
      
      // Add JSON data
      const jsonData = {
        ...formData,
        removedImages: removedImages
      };
      
      auctionFormData.append('auctionData', JSON.stringify(jsonData));
      
      // Add images
      images.forEach(image => {
        auctionFormData.append('images', image);
      });
      
      // Add primary image index
      auctionFormData.append('primaryImage', primaryImageIndex.toString());
      
      // Submit to parent component
      await onSubmit(auctionFormData);
    } catch (err) {
      console.error('Error submitting auction:', err);
      setError(err.message || 'An error occurred while saving the auction');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="auction-modal">
        <div className="modal-header">
          <h2>{initialData ? 'Edit Auction' : 'Create New Auction'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {error && <div className="modal-error">{error}</div>}
        
        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`} 
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          <button 
            className={`tab-button ${activeTab === 'vehicle' ? 'active' : ''}`} 
            onClick={() => setActiveTab('vehicle')}
          >
            Vehicle Details
          </button>
          <button 
            className={`tab-button ${activeTab === 'images' ? 'active' : ''}`} 
            onClick={() => setActiveTab('images')}
          >
            Images
          </button>
          <button 
            className={`tab-button ${activeTab === 'auction' ? 'active' : ''}`} 
            onClick={() => setActiveTab('auction')}
          >
            Auction Settings
          </button>
          <button 
            className={`tab-button ${activeTab === 'location' ? 'active' : ''}`} 
            onClick={() => setActiveTab('location')}
          >
            Location
          </button>
        </div>
        
        <div className="modal-content">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="title">Auction Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., 2019 BMW M4 Competition - Low Miles, One Owner"
                  required
                />
                <p className="form-hint">A descriptive title helps your auction get noticed</p>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Provide a detailed description of the vehicle, including condition, history, and any unique features."
                  required
                ></textarea>
              </div>
              
              <div className="form-group">
                <label>Features</label>
                <div className="features-input">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={handleFeatureKeyDown}
                    placeholder="Add feature and press Enter"
                  />
                  <button 
                    type="button" 
                    className="add-feature-btn" 
                    onClick={addFeature}
                  >
                    Add
                  </button>
                </div>
                
                {formData.features.length > 0 && (
                  <div className="features-list">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="feature-tag">
                        <span>{feature}</span>
                        <button 
                          type="button" 
                          className="remove-feature" 
                          onClick={() => removeFeature(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Vehicle Details Tab */}
          {activeTab === 'vehicle' && (
            <div className="form-section">
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="vehicle.make">Make</label>
                  <input
                    type="text"
                    id="vehicle.make"
                    name="vehicle.make"
                    value={formData.vehicle.make}
                    onChange={handleChange}
                    placeholder="e.g., BMW"
                    required
                  />
                </div>
                
                <div className="form-group half">
                  <label htmlFor="vehicle.model">Model</label>
                  <input
                    type="text"
                    id="vehicle.model"
                    name="vehicle.model"
                    value={formData.vehicle.model}
                    onChange={handleChange}
                    placeholder="e.g., M4 Competition"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="vehicle.year">Year</label>
                  <input
                    type="number"
                    id="vehicle.year"
                    name="vehicle.year"
                    value={formData.vehicle.year}
                    onChange={handleNumberInput}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
                
                <div className="form-group half">
                  <label htmlFor="vehicle.mileage">Mileage</label>
                  <input
                    type="number"
                    id="vehicle.mileage"
                    name="vehicle.mileage"
                    value={formData.vehicle.mileage}
                    onChange={handleNumberInput}
                    min="0"
                    placeholder="e.g., 15000"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="vehicle.transmission">Transmission</label>
                  <select
                    id="vehicle.transmission"
                    name="vehicle.transmission"
                    value={formData.vehicle.transmission}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Transmission</option>
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                    <option value="cvt">CVT</option>
                    <option value="dct">Dual-Clutch (DCT)</option>
                    <option value="semi-auto">Semi-Automatic</option>
                  </select>
                </div>
                
                <div className="form-group half">
                  <label htmlFor="vehicle.fuelType">Fuel Type</label>
                  <select
                    id="vehicle.fuelType"
                    name="vehicle.fuelType"
                    value={formData.vehicle.fuelType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Fuel Type</option>
                    <option value="petrol">Petrol</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="plugin_hybrid">Plug-in Hybrid</option>
                    <option value="hydrogen">Hydrogen</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="vehicle.engineSize">Engine Size</label>
                  <input
                    type="text"
                    id="vehicle.engineSize"
                    name="vehicle.engineSize"
                    value={formData.vehicle.engineSize}
                    onChange={handleChange}
                    placeholder="e.g., 3.0L Twin-Turbo"
                  />
                </div>
                
                <div className="form-group half">
                  <label htmlFor="vehicle.drivetrain">Drivetrain</label>
                  <select
                    id="vehicle.drivetrain"
                    name="vehicle.drivetrain"
                    value={formData.vehicle.drivetrain}
                    onChange={handleChange}
                  >
                    <option value="">Select Drivetrain</option>
                    <option value="fwd">Front-Wheel Drive (FWD)</option>
                    <option value="rwd">Rear-Wheel Drive (RWD)</option>
                    <option value="awd">All-Wheel Drive (AWD)</option>
                    <option value="4wd">Four-Wheel Drive (4WD)</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="vehicle.power">Power</label>
                  <input
                    type="text"
                    id="vehicle.power"
                    name="vehicle.power"
                    value={formData.vehicle.power}
                    onChange={handleChange}
                    placeholder="e.g., 503 hp"
                  />
                </div>
                
                <div className="form-group half">
                  <label htmlFor="vehicle.torque">Torque</label>
                  <input
                    type="text"
                    id="vehicle.torque"
                    name="vehicle.torque"
                    value={formData.vehicle.torque}
                    onChange={handleChange}
                    placeholder="e.g., 479 lb-ft"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="vehicle.exteriorColor">Exterior Color</label>
                  <input
                    type="text"
                    id="vehicle.exteriorColor"
                    name="vehicle.exteriorColor"
                    value={formData.vehicle.exteriorColor}
                    onChange={handleChange}
                    placeholder="e.g., Alpine White"
                  />
                </div>
                
                <div className="form-group half">
                  <label htmlFor="vehicle.interiorColor">Interior Color</label>
                  <input
                    type="text"
                    id="vehicle.interiorColor"
                    name="vehicle.interiorColor"
                    value={formData.vehicle.interiorColor}
                    onChange={handleChange}
                    placeholder="e.g., Black Leather"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="vehicle.vin">VIN (Vehicle Identification Number)</label>
                <input
                  type="text"
                  id="vehicle.vin"
                  name="vehicle.vin"
                  value={formData.vehicle.vin}
                  onChange={handleChange}
                  placeholder="e.g., WBSWD9C09KAC67753"
                />
              </div>
            </div>
          )}
          
          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="form-section">
              <div className="form-group">
                <label>Upload Images</label>
                <div className="image-upload-area" onClick={() => fileInputRef.current.click()}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    hidden
                  />
                  <div className="upload-placeholder">
                    <span className="upload-icon">📸</span>
                    <span>Click to upload images</span>
                    <small>Maximum 10 images, 5MB each (JPEG, PNG, or WebP)</small>
                  </div>
                </div>
                
                {previewImages.length > 0 && (
                  <div className="image-preview-grid">
                    {previewImages.map((img, index) => (
                      <div 
                        key={index} 
                        className={`preview-item ${primaryImageIndex === index ? 'primary' : ''}`}
                      >
                        <img src={img} alt={`Preview ${index + 1}`} />
                        <div className="preview-actions">
                          <button 
                            type="button" 
                            className="remove-image" 
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </button>
                          {primaryImageIndex !== index && (
                            <button 
                              type="button" 
                              className="set-primary" 
                              onClick={() => setPrimaryImage(index)}
                            >
                              Set as Primary
                            </button>
                          )}
                        </div>
                        {primaryImageIndex === index && (
                          <div className="primary-badge">Primary</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Auction Settings Tab */}
          {activeTab === 'auction' && (
            <div className="form-section">
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="startingBid">Starting Bid ($)</label>
                  <input
                    type="number"
                    id="startingBid"
                    name="startingBid"
                    value={formData.startingBid}
                    onChange={handleNumberInput}
                    min="0"
                    placeholder="e.g., 5000"
                    required
                  />
                </div>
                
                <div className="form-group half">
                  <label htmlFor="reservePrice">Reserve Price ($)</label>
                  <input
                    type="number"
                    id="reservePrice"
                    name="reservePrice"
                    value={formData.reservePrice}
                    onChange={handleNumberInput}
                    min="0"
                    placeholder="e.g., 10000 (optional)"
                  />
                  <p className="form-hint">Minimum price for the auction to end with a sale. Leave empty for no reserve.</p>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="incrementAmount">Bid Increment ($)</label>
                <input
                  type="number"
                  id="incrementAmount"
                  name="incrementAmount"
                  value={formData.incrementAmount}
                  onChange={handleNumberInput}
                  min="1"
                  placeholder="e.g., 100"
                  required
                />
                <p className="form-hint">Minimum amount each bid must increase by.</p>
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="startDate">Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div className="form-group half">
                  <label htmlFor="endDate">End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate}
                    required
                  />
                </div>
              </div>
              
              <p className="note">Auctions typically run for 7 days, but you can choose a different duration.</p>
            </div>
          )}
          
          {/* Location Tab */}
          {activeTab === 'location' && (
            <div className="form-section">
              <div className="form-group">
                <label htmlFor="location.address">Address</label>
                <input
                  type="text"
                  id="location.address"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  placeholder="Street address (optional)"
                />
                <p className="form-hint">For privacy, this will not be displayed publicly.</p>
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="location.city">City</label>
                  <input
                    type="text"
                    id="location.city"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleChange}
                    placeholder="e.g., Los Angeles"
                    required
                  />
                </div>
                
                <div className="form-group half">
                  <label htmlFor="location.state">State</label>
                  <input
                    type="text"
                    id="location.state"
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleChange}
                    placeholder="e.g., CA"
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label htmlFor="location.postalCode">ZIP/Postal Code</label>
                  <input
                    type="text"
                    id="location.postalCode"
                    name="location.postalCode"
                    value={formData.location.postalCode}
                    onChange={handleChange}
                    placeholder="e.g., 90210"
                  />
                </div>
                
                <div className="form-group half">
                  <label htmlFor="location.country">Country</label>
                  <input
                    type="text"
                    id="location.country"
                    name="location.country"
                    value={formData.location.country}
                    onChange={handleChange}
                    placeholder="e.g., United States"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id="termsAccepted"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleCheckbox}
                  required
                />
                <label htmlFor="termsAccepted">
                  I agree to the Terms and Conditions of listing my vehicle for auction
                </label>
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            type="button" 
            className="cancel-button" 
            onClick={onClose}
          >
            Cancel
          </button>
          
          <div className="navigation-buttons">
            {activeTab !== 'basic' && (
              <button 
                type="button" 
                className="prev-button" 
                onClick={() => {
                  const tabs = ['basic', 'vehicle', 'images', 'auction', 'location'];
                  const currentIndex = tabs.indexOf(activeTab);
                  setActiveTab(tabs[currentIndex - 1]);
                }}
              >
                Previous
              </button>
            )}
            
            {activeTab !== 'location' ? (
              <button 
                type="button" 
                className="next-button" 
                onClick={() => {
                  const tabs = ['basic', 'vehicle', 'images', 'auction', 'location'];
                  const currentIndex = tabs.indexOf(activeTab);
                  setActiveTab(tabs[currentIndex + 1]);
                }}
              >
                Next
              </button>
            ) : (
              <button 
                type="button" 
                className="submit-button" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : (initialData ? 'Update Auction' : 'Create Auction')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAuctionModal;