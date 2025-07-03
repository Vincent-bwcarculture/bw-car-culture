// client/src/components/profile/CarListingManager/CarListingManager.js - Part 1

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext.js';
import axios from '../../../config/axios.js';
import './CarListingManager.css';

const CarListingManager = ({ action = null }) => {
  const { user } = useAuth();
  
  // State management
  const [activeView, setActiveView] = useState('overview'); // overview, create, valuation, manage
  const [userVehicles, setUserVehicles] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state for new listing
  const [listingForm, setListingForm] = useState({
    vehicleId: '',
    title: '',
    description: '',
    price: '',
    subscriptionTier: 'basic', // basic, standard, premium
    images: [],
    specifications: {
      make: '',
      model: '',
      year: '',
      mileage: '',
      transmission: '',
      fuelType: '',
      engineSize: '',
      color: '',
      condition: ''
    },
    contact: {
      name: user?.name || '',
      phone: user?.profile?.phone || '',
      email: user?.email || '',
      preferredContactMethod: 'both'
    },
    features: [],
    customFeatures: '',
    location: {
      city: user?.profile?.address?.city || '',
      area: user?.profile?.address?.area || ''
    }
  });

  // Valuation form state
  const [valuationForm, setValuationForm] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
    condition: '',
    images: [],
    additionalInfo: ''
  });

  // Image handling state
  const [imagePreview, setImagePreview] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);

  // Subscription pricing
  const subscriptionPricing = {
    basic: { price: 50, features: ['Multiple photos', 'Contact leads', 'Social Media Marketing'] },
    standard: { price: 100, features: ['2x Social media marketing', 'Premium placement', 'Multiple photos', 'Priority support'] },
    premium: { price: 200, features: ['4x Social media marketing', 'Premium priority placement', 'Multiple photos', 'Higher priority support', 'Featured placement', 'First access to new features'] }
  };

  // Expected photo angles
  const expectedPhotoAngles = [
    { id: 'front', label: 'Front View', required: true, description: 'Clear front view showing grille, headlights, and license plate' },
    { id: 'rear', label: 'Rear View', required: true, description: 'Back view showing taillights, bumper, and rear license plate' },
    { id: 'driver_side', label: 'Driver Side', required: true, description: 'Full side profile from driver side' },
    { id: 'passenger_side', label: 'Passenger Side', required: true, description: 'Full side profile from passenger side' },
    { id: 'interior_front', label: 'Interior - Front', required: true, description: 'Dashboard, steering wheel, and front seats' },
    { id: 'interior_rear', label: 'Interior - Rear', required: false, description: 'Rear seats and interior space' },
    { id: 'engine', label: 'Engine Bay', required: true, description: 'Clear view of engine compartment' },
    { id: 'odometer', label: 'Odometer', required: true, description: 'Clear reading of current mileage' },
    { id: 'damage', label: 'Any Damage', required: false, description: 'Photos of any scratches, dents, or wear' }
  ];

  // Initialize based on action prop
  useEffect(() => {
    if (action === 'list') {
      setActiveView('create');
    } else if (action === 'valuation') {
      setActiveView('valuation');
    }
  }, [action]);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserVehicles();
    fetchUserListings();
  }, []);

  // Fetch user's vehicles
  const fetchUserVehicles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/user/vehicles');
      if (response.data.success) {
        setUserVehicles(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Failed to load your vehicles');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's listings
  const fetchUserListings = async () => {
    try {
      const response = await axios.get('/listings/my-listings');
      if (response.data.success) {
        setListings(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
    }
  };

  // Handle form input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setListingForm(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setListingForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, []);

  // Handle valuation form changes
  const handleValuationChange = useCallback((e) => {
    const { name, value } = e.target;
    setValuationForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handle image upload
  const handleImageUpload = async (e, formType = 'listing') => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setImageUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append('images', file);
      });

      const response = await axios.post('/upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const uploadedImages = response.data.data.map(img => ({
          url: img.url,
          key: img.key,
          angle: 'unassigned' // User will assign angles
        }));

        if (formType === 'listing') {
          setListingForm(prev => ({
            ...prev,
            images: [...prev.images, ...uploadedImages]
          }));
        } else {
          setValuationForm(prev => ({
            ...prev,
            images: [...prev.images, ...uploadedImages]
          }));
        }

        setSuccess('Images uploaded successfully! Please assign angles to each image.');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setError('Failed to upload images. Please try again.');
    } finally {
      setImageUploading(false);
    }
  };

  // Assign angle to image
  const assignImageAngle = (imageIndex, angle, formType = 'listing') => {
    if (formType === 'listing') {
      setListingForm(prev => ({
        ...prev,
        images: prev.images.map((img, idx) => 
          idx === imageIndex ? { ...img, angle } : img
        )
      }));
    } else {
      setValuationForm(prev => ({
        ...prev,
        images: prev.images.map((img, idx) => 
          idx === imageIndex ? { ...img, angle } : img
        )
      }));
    }
  };

  // Remove image
  const removeImage = (imageIndex, formType = 'listing') => {
    if (formType === 'listing') {
      setListingForm(prev => ({
        ...prev,
        images: prev.images.filter((_, idx) => idx !== imageIndex)
      }));
    } else {
      setValuationForm(prev => ({
        ...prev,
        images: prev.images.filter((_, idx) => idx !== imageIndex)
      }));
    }
  };

  // Handle subscription tier change
  const handleSubscriptionChange = (tier) => {
    setListingForm(prev => ({
      ...prev,
      subscriptionTier: tier
    }));
  };

  // Submit listing
  const submitListing = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!listingForm.title || !listingForm.price) {
        setError('Please fill in all required fields');
        return;
      }

      // Check if required images are present
      const requiredAngles = expectedPhotoAngles.filter(angle => angle.required).map(angle => angle.id);
      const assignedAngles = listingForm.images.map(img => img.angle);
      const missingAngles = requiredAngles.filter(angle => !assignedAngles.includes(angle));

      if (missingAngles.length > 0) {
        setError(`Missing required photos: ${missingAngles.join(', ')}`);
        return;
      }

      const response = await axios.post('/listings', listingForm);
      
      if (response.data.success) {
        setSuccess('Listing created successfully! Redirecting to payment...');
        
        // After successful listing creation, redirect to Flutterwave payment
        initiateFlutterwavePayment(response.data.data.id, listingForm.subscriptionTier);
      }
    } catch (err) {
      console.error('Listing submission error:', err);
      setError(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  // Submit valuation request
  const submitValuation = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!valuationForm.make || !valuationForm.model || !valuationForm.year) {
        setError('Please fill in all required fields');
        return;
      }

      const response = await axios.post('/valuations', valuationForm);
      
      if (response.data.success) {
        setSuccess('Valuation request submitted! You will receive an estimate within 24 hours.');
        setValuationForm({
          make: '',
          model: '',
          year: '',
          mileage: '',
          condition: '',
          images: [],
          additionalInfo: ''
        });
      }
    } catch (err) {
      console.error('Valuation submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit valuation request');
    } finally {
      setLoading(false);
    }
  };

  // client/src/components/profile/CarListingManager/CarListingManager.js - Part 2

  // Flutterwave payment integration
  const initiateFlutterwavePayment = (listingId, subscriptionTier) => {
    const tierPrice = subscriptionPricing[subscriptionTier].price;
    
    // Configure Flutterwave
    const flutterwaveConfig = {
      public_key: process.env.REACT_APP_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: `listing_${listingId}_${Date.now()}`,
      amount: tierPrice,
      currency: 'BWP',
      payment_options: 'card,banktransfer,ussd',
      customer: {
        email: user.email,
        phone_number: listingForm.contact.phone,
        name: user.name
      },
      customizations: {
        title: 'BW Car Culture - Car Listing Subscription',
        description: `${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} listing subscription`,
        logo: 'https://your-logo-url.com/logo.png'
      },
      meta: {
        listing_id: listingId,
        subscription_tier: subscriptionTier,
        user_id: user.id
      },
      callback: (response) => {
        console.log('Flutterwave callback:', response);
        verifyPayment(response.transaction_id, listingId);
      },
      onclose: () => {
        console.log('Payment modal closed');
        setError('Payment was cancelled. Your listing is saved as draft.');
      }
    };

    // Initialize Flutterwave payment
    if (window.FlutterwaveCheckout) {
      window.FlutterwaveCheckout(flutterwaveConfig);
    } else {
      setError('Payment system is not available. Please try again later.');
    }
  };

  // Verify payment with backend
  const verifyPayment = async (transactionId, listingId) => {
    try {
      const response = await axios.post('/payments/verify', {
        transaction_id: transactionId,
        listing_id: listingId
      });

      if (response.data.success) {
        setSuccess('Payment successful! Your listing is now live.');
        fetchUserListings(); // Refresh listings
        setActiveView('manage');
      } else {
        setError('Payment verification failed. Please contact support.');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setError('Payment verification failed. Please contact support.');
    }
  };

  // Render overview section
  const renderOverview = () => (
    <div className="car-listing-overview">
      <div className="overview-header">
        <h2>Your Car Listings</h2>
        <p>Manage your vehicle listings and create new ones</p>
      </div>

      <div className="overview-stats">
        <div className="stat-card">
          <div className="stat-number">{listings.length}</div>
          <div className="stat-label">Active Listings</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{userVehicles.length}</div>
          <div className="stat-label">Your Vehicles</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">
            {listings.reduce((sum, listing) => sum + (listing.analytics?.views || 0), 0)}
          </div>
          <div className="stat-label">Total Views</div>
        </div>
      </div>

      <div className="overview-actions">
        <button 
          className="action-btn primary"
          onClick={() => setActiveView('create')}
        >
          Create New Listing
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => setActiveView('valuation')}
        >
          Get Car Valuation
        </button>
        {listings.length > 0 && (
          <button 
            className="action-btn secondary"
            onClick={() => setActiveView('manage')}
          >
            Manage Listings
          </button>
        )}
      </div>

      {listings.length > 0 && (
        <div className="recent-listings">
          <h3>Recent Listings</h3>
          <div className="listings-grid">
            {listings.slice(0, 3).map(listing => (
              <div key={listing._id} className="listing-card">
                <div className="listing-image">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0].url} alt={listing.title} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>
                <div className="listing-info">
                  <h4>{listing.title}</h4>
                  <p className="listing-price">P{listing.price?.toLocaleString()}</p>
                  <p className="listing-status">Status: {listing.status}</p>
                  <p className="listing-views">{listing.analytics?.views || 0} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render create listing form
  const renderCreateListing = () => (
    <div className="create-listing">
      <div className="create-header">
        <button 
          className="back-btn"
          onClick={() => setActiveView('overview')}
        >
          ← Back to Overview
        </button>
        <h2>Create Car Listing</h2>
        <p>List your car and reach thousands of potential buyers</p>
      </div>

      {/* Subscription Tier Selection */}
      <div className="subscription-selection">
        <h3>Choose Your Listing Package</h3>
        <div className="tier-options">
          {Object.entries(subscriptionPricing).map(([tier, details]) => (
            <div 
              key={tier}
              className={`tier-option ${listingForm.subscriptionTier === tier ? 'selected' : ''}`}
              onClick={() => handleSubscriptionChange(tier)}
            >
              <div className="tier-header">
                <div className="tier-name">{tier.charAt(0).toUpperCase() + tier.slice(1)}</div>
                <div className="tier-price">P{details.price}/month</div>
              </div>
              <div className="tier-features">
                {details.features.map((feature, idx) => (
                  <div key={idx} className="feature">✓ {feature}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Basic Information */}
      <div className="form-section">
        <h3>Basic Information</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Listing Title*</label>
            <input
              type="text"
              name="title"
              value={listingForm.title}
              onChange={handleInputChange}
              placeholder="e.g., 2020 Toyota Corolla - Excellent Condition"
              maxLength="100"
            />
          </div>
          
          <div className="form-group">
            <label>Price (BWP)*</label>
            <input
              type="number"
              name="price"
              value={listingForm.price}
              onChange={handleInputChange}
              placeholder="Enter price in Pula"
              min="0"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={listingForm.description}
            onChange={handleInputChange}
            placeholder="Describe your vehicle's condition, features, and any additional information..."
            rows="4"
            maxLength="1000"
          />
        </div>
      </div>

      {/* Vehicle Specifications */}
      <div className="form-section">
        <h3>Vehicle Specifications</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Make*</label>
            <input
              type="text"
              name="specifications.make"
              value={listingForm.specifications.make}
              onChange={handleInputChange}
              placeholder="Toyota, BMW, etc."
            />
          </div>
          
          <div className="form-group">
            <label>Model*</label>
            <input
              type="text"
              name="specifications.model"
              value={listingForm.specifications.model}
              onChange={handleInputChange}
              placeholder="Corolla, X5, etc."
            />
          </div>
          
          <div className="form-group">
            <label>Year*</label>
            <input
              type="number"
              name="specifications.year"
              value={listingForm.specifications.year}
              onChange={handleInputChange}
              placeholder="2020"
              min="1950"
              max={new Date().getFullYear() + 1}
            />
          </div>
          
          <div className="form-group">
            <label>Mileage (km)*</label>
            <input
              type="number"
              name="specifications.mileage"
              value={listingForm.specifications.mileage}
              onChange={handleInputChange}
              placeholder="50000"
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label>Transmission</label>
            <select
              name="specifications.transmission"
              value={listingForm.specifications.transmission}
              onChange={handleInputChange}
            >
              <option value="">Select transmission</option>
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
              <option value="cvt">CVT</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Fuel Type</label>
            <select
              name="specifications.fuelType"
              value={listingForm.specifications.fuelType}
              onChange={handleInputChange}
            >
              <option value="">Select fuel type</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Engine Size</label>
            <input
              type="text"
              name="specifications.engineSize"
              value={listingForm.specifications.engineSize}
              onChange={handleInputChange}
              placeholder="1.6L, 2.0L, etc."
            />
          </div>
          
          <div className="form-group">
            <label>Color</label>
            <input
              type="text"
              name="specifications.color"
              value={listingForm.specifications.color}
              onChange={handleInputChange}
              placeholder="White, Black, etc."
            />
          </div>
          
          <div className="form-group">
            <label>Condition*</label>
            <select
              name="specifications.condition"
              value={listingForm.specifications.condition}
              onChange={handleInputChange}
            >
              <option value="">Select condition</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Photo Upload Section */}
      <div className="form-section">
        <h3>Vehicle Photos</h3>
        <p className="photo-instructions">
          Upload high-quality photos from the angles below. Required photos are marked with *.
        </p>
        
        <div className="photo-upload">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'listing')}
            disabled={imageUploading}
            id="listing-images"
            style={{ display: 'none' }}
          />
          <label htmlFor="listing-images" className="upload-btn">
            {imageUploading ? 'Uploading...' : 'Upload Photos'}
          </label>
        </div>

        {/* Expected Angles Guide */}
        <div className="photo-angles-guide">
          <h4>Required Photo Angles</h4>
          <div className="angles-grid">
            {expectedPhotoAngles.map(angle => (
              <div key={angle.id} className={`angle-item ${angle.required ? 'required' : 'optional'}`}>
                <div className="angle-label">
                  {angle.label} {angle.required && '*'}
                </div>
                <div className="angle-description">{angle.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Uploaded Images */}
        {listingForm.images.length > 0 && (
          <div className="uploaded-images">
            <h4>Uploaded Images ({listingForm.images.length})</h4>
            <div className="images-grid">
              {listingForm.images.map((image, index) => (
                <div key={index} className="image-item">
                  <img src={image.url} alt={`Upload ${index + 1}`} />
                  <div className="image-controls">
                    <select
                      value={image.angle}
                      onChange={(e) => assignImageAngle(index, e.target.value, 'listing')}
                      className="angle-selector"
                    >
                      <option value="unassigned">Assign angle...</option>
                      {expectedPhotoAngles.map(angle => (
                        <option key={angle.id} value={angle.id}>
                          {angle.label} {angle.required && '*'}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeImage(index, 'listing')}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div className="form-section">
        <h3>Contact Information</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Contact Name*</label>
            <input
              type="text"
              name="contact.name"
              value={listingForm.contact.name}
              onChange={handleInputChange}
              placeholder="Your name"
            />
          </div>
          
          <div className="form-group">
            <label>Phone Number*</label>
            <input
              type="tel"
              name="contact.phone"
              value={listingForm.contact.phone}
              onChange={handleInputChange}
              placeholder="+267 71234567"
            />
          </div>
          
          <div className="form-group">
            <label>Email*</label>
            <input
              type="email"
              name="contact.email"
              value={listingForm.contact.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
            />
          </div>
          
          <div className="form-group">
            <label>Preferred Contact Method</label>
            <select
              name="contact.preferredContactMethod"
              value={listingForm.contact.preferredContactMethod}
              onChange={handleInputChange}
            >
              <option value="both">Phone & Email</option>
              <option value="phone">Phone Only</option>
              <option value="email">Email Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submit Section */}
      <div className="form-actions">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="action-buttons">
          <button
            type="button"
            className="btn secondary"
            onClick={() => setActiveView('overview')}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={submitListing}
            disabled={loading || imageUploading}
          >
            {loading ? 'Creating Listing...' : `Create Listing - P${subscriptionPricing[listingForm.subscriptionTier].price}`}
          </button>
        </div>
      </div>
    </div>
  );
  // client/src/components/profile/CarListingManager/CarListingManager.js - Part 3 (Final)

  // Render valuation form
  const renderValuation = () => (
    <div className="car-valuation">
      <div className="valuation-header">
        <button 
          className="back-btn"
          onClick={() => setActiveView('overview')}
        >
          ← Back to Overview
        </button>
        <h2>Get Your Car Valued</h2>
        <p>Get a professional estimate of your car's market value</p>
      </div>

      <div className="valuation-info">
        <div className="info-card">
          <h3>How Our Valuation Works</h3>
          <ul>
            <li>Provide basic vehicle information</li>
            <li>Upload photos of your vehicle</li>
            <li>Our experts analyze market data</li>
            <li>Receive valuation within 24 hours</li>
          </ul>
        </div>
      </div>

      <div className="form-section">
        <h3>Vehicle Information</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Make*</label>
            <input
              type="text"
              name="make"
              value={valuationForm.make}
              onChange={handleValuationChange}
              placeholder="Toyota, BMW, etc."
            />
          </div>
          
          <div className="form-group">
            <label>Model*</label>
            <input
              type="text"
              name="model"
              value={valuationForm.model}
              onChange={handleValuationChange}
              placeholder="Corolla, X5, etc."
            />
          </div>
          
          <div className="form-group">
            <label>Year*</label>
            <input
              type="number"
              name="year"
              value={valuationForm.year}
              onChange={handleValuationChange}
              placeholder="2020"
              min="1950"
              max={new Date().getFullYear() + 1}
            />
          </div>
          
          <div className="form-group">
            <label>Mileage (km)</label>
            <input
              type="number"
              name="mileage"
              value={valuationForm.mileage}
              onChange={handleValuationChange}
              placeholder="50000"
              min="0"
            />
          </div>
          
          <div className="form-group">
            <label>Overall Condition*</label>
            <select
              name="condition"
              value={valuationForm.condition}
              onChange={handleValuationChange}
            >
              <option value="">Select condition</option>
              <option value="excellent">Excellent - Like new</option>
              <option value="good">Good - Minor wear</option>
              <option value="fair">Fair - Some issues</option>
              <option value="poor">Poor - Needs work</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Additional Information</label>
          <textarea
            name="additionalInfo"
            value={valuationForm.additionalInfo}
            onChange={handleValuationChange}
            placeholder="Any modifications, recent repairs, known issues, etc."
            rows="4"
          />
        </div>
      </div>

      {/* Photo Upload for Valuation */}
      <div className="form-section">
        <h3>Vehicle Photos (Optional but Recommended)</h3>
        <p>Photos help us provide a more accurate valuation</p>
        
        <div className="photo-upload">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleImageUpload(e, 'valuation')}
            disabled={imageUploading}
            id="valuation-images"
            style={{ display: 'none' }}
          />
          <label htmlFor="valuation-images" className="upload-btn">
            {imageUploading ? 'Uploading...' : 'Upload Photos'}
          </label>
        </div>

        {valuationForm.images.length > 0 && (
          <div className="uploaded-images">
            <h4>Uploaded Images ({valuationForm.images.length})</h4>
            <div className="images-grid">
              {valuationForm.images.map((image, index) => (
                <div key={index} className="image-item">
                  <img src={image.url} alt={`Valuation ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => removeImage(index, 'valuation')}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="form-actions">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="action-buttons">
          <button
            type="button"
            className="btn secondary"
            onClick={() => setActiveView('overview')}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={submitValuation}
            disabled={loading || imageUploading}
          >
            {loading ? 'Submitting...' : 'Get Free Valuation'}
          </button>
        </div>
      </div>
    </div>
  );

  // Render manage listings section
  const renderManageListings = () => (
    <div className="manage-listings">
      <div className="manage-header">
        <button 
          className="back-btn"
          onClick={() => setActiveView('overview')}
        >
          ← Back to Overview
        </button>
        <h2>Manage Your Listings</h2>
        <p>View and manage all your active car listings</p>
      </div>

      {listings.length === 0 ? (
        <div className="no-listings">
          <h3>No Active Listings</h3>
          <p>You don't have any car listings yet.</p>
          <button 
            className="btn primary"
            onClick={() => setActiveView('create')}
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="listings-list">
          {listings.map(listing => (
            <div key={listing._id} className="listing-item">
              <div className="listing-image">
                {listing.images?.[0] ? (
                  <img src={listing.images[0].url} alt={listing.title} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
              
              <div className="listing-details">
                <h3>{listing.title}</h3>
                <p className="listing-price">P{listing.price?.toLocaleString()}</p>
                <p className="listing-status">Status: <span className={`status ${listing.status}`}>{listing.status}</span></p>
                <div className="listing-stats">
                  <span>{listing.analytics?.views || 0} views</span>
                  <span>{listing.analytics?.inquiries || 0} inquiries</span>
                  <span>Listed {new Date(listing.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="listing-actions">
                <button className="btn small secondary">Edit</button>
                <button className="btn small secondary">Boost</button>
                <button className="btn small danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Navigation component
  const renderNavigation = () => (
    <div className="car-listing-nav">
      <button
        className={`nav-btn ${activeView === 'overview' ? 'active' : ''}`}
        onClick={() => setActiveView('overview')}
      >
        Overview
      </button>
      <button
        className={`nav-btn ${activeView === 'create' ? 'active' : ''}`}
        onClick={() => setActiveView('create')}
      >
        List Car
      </button>
      <button
        className={`nav-btn ${activeView === 'valuation' ? 'active' : ''}`}
        onClick={() => setActiveView('valuation')}
      >
        Get Valuation
      </button>
      {listings.length > 0 && (
        <button
          className={`nav-btn ${activeView === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveView('manage')}
        >
          Manage ({listings.length})
        </button>
      )}
    </div>
  );

  // Main render
  return (
    <div className="car-listing-manager">
      {renderNavigation()}
      
      <div className="car-listing-content">
        {loading && activeView === 'overview' && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your car listings...</p>
          </div>
        )}
        
        {activeView === 'overview' && renderOverview()}
        {activeView === 'create' && renderCreateListing()}
        {activeView === 'valuation' && renderValuation()}
        {activeView === 'manage' && renderManageListings()}
      </div>
    </div>
  );
};

export default CarListingManager;
