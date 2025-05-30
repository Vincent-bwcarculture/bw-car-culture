// src/components/admin/InventoryManager/InventoryForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext.js';
import './InventoryForm.css';

const InventoryForm = ({ item, onSave, onCancel, businesses }) => {
  const { user } = useAuth();
   const [businessId, setBusinessId] = useState(item?.businessId || '');
  const [businessType, setBusinessType] = useState(item?.businessType || 'service');
  // Add at the beginning of the InventoryForm component
const checkFailedImage = (url) => {
  try {
    const failedImages = JSON.parse(localStorage.getItem('failedInventoryImages') || '{}');
    return !!failedImages[url];
  } catch (e) {
    return false;
  }
};

const markFailedImage = (url) => {
  try {
    const failedImages = JSON.parse(localStorage.getItem('failedInventoryImages') || '{}');
    failedImages[url] = Date.now();
    
    // Limit cache size
    const keys = Object.keys(failedImages);
    if (keys.length > 100) {
      const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
      delete failedImages[oldestKey];
    }
    
    localStorage.setItem('failedInventoryImages', JSON.stringify(failedImages));
  } catch (e) {
    // Ignore localStorage errors
  }
};

// Enhanced function to get image URL with S3 support
const getInventoryImageUrl = (imageData) => {
  try {
    if (!imageData) {
      return '/images/placeholders/part.jpg';
    }
    
    let imageUrl = '';
    
    // If imageData is a string, use it directly
    if (typeof imageData === 'string') {
      imageUrl = imageData;
    } 
    // If imageData is an object with url property
    else if (imageData && typeof imageData === 'object') {
      // For S3 objects, prefer url over thumbnail
      imageUrl = imageData.url || imageData.thumbnail || '';
      
      // If we have an S3 key but no URL, create proxy URL
      if (!imageUrl && imageData.key) {
        return `/api/images/s3-proxy/${imageData.key}`;
      }
    }
    
    // If no URL found, return placeholder
    if (!imageUrl) {
      return '/images/placeholders/part.jpg';
    }
    
    // Fix problematic S3 URLs with duplicate paths
    if (imageUrl.includes('/images/images/')) {
      imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
    }
    
    // Check for cached failed images
    if (checkFailedImage(imageUrl)) {
      console.log(`Using cached fallback for previously failed image: ${imageUrl}`);
      return '/images/placeholders/part.jpg';
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error getting inventory image URL:', error);
    return '/images/placeholders/part.jpg';
  }
};
  
  // Default form state
  const defaultFormState = {
    title: '',
    description: '',
    category: '',
    price: '',
    originalPrice: '',
    condition: 'New',
    images: [],
    stock: {
      quantity: 1,
      sku: '',
      location: ''
    },
    specifications: {},
    features: [],
    businessId: '',
    businessType: '',
    status: 'active',
    shipping: {
      available: false,
      cost: 0,
      freeOver: 0,
      estimatedDays: '1-3 days'
    }
  };
  
  const [formData, setFormData] = useState(defaultFormState);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [specifications, setSpecifications] = useState([{ key: '', value: '' }]);
  const [featureInput, setFeatureInput] = useState('');
  const [compatibleVehicles, setCompatibleVehicles] = useState([{ make: '', model: '', years: '' }]);
  const [availableBusinesses, setAvailableBusinesses] = useState([]);
  
  // Categories
  const categories = [
    'Parts',
    'Accessories',
    'Apparel',
    'Collectibles',
    'Tools',
    'Fluids',
    'Electronics',
    'Other'
  ];
  
  useEffect(() => {
    // If businesses prop is provided, use it
    if (businesses && businesses.length > 0) {
      setAvailableBusinesses(businesses);
      
      // If user has a specific business role, pre-select that business
      if (user && (user.businessId || user.dealership) && !formData.businessId) {
        const businessId = user.businessId || user.dealership;
        const businessType = user.businessId ? 'service' : 'dealer';
        
        setFormData(prev => ({
          ...prev,
          businessId,
          businessType
        }));
      }
      // If only one business is available, auto-select it
      else if (businesses.length === 1 && !formData.businessId) {
        setFormData(prev => ({
          ...prev,
          businessId: businesses[0]._id,
          businessType: businesses[0].type || 'service'
        }));
      }
    } else {
      // If businesses prop is not provided, fetch businesses
      fetchBusinesses();
    }
  }, [businesses, user]);
  
  // Initialization when editing an existing item
  useEffect(() => {
    if (item) {
      // Initialize the form with the item data
      setFormData({
        ...item,
        price: item.price?.toString() || '',
        originalPrice: item.originalPrice?.toString() || '',
        businessType: item.businessType || '',
        stock: {
          quantity: item.stock?.quantity || 1,
          sku: item.stock?.sku || '',
          location: item.stock?.location || ''
        },
        shipping: item.shipping || {
          available: false,
          cost: 0,
          freeOver: 0,
          estimatedDays: '1-3 days'
        }
      });
      
      // Set specifications
      if (item.specifications) {
        const specs = Object.entries(item.specifications).map(([key, value]) => ({ key, value: value?.toString() || '' }));
        if (specs.length === 0) {
          setSpecifications([{ key: '', value: '' }]);
        } else {
          setSpecifications(specs);
        }
      }
      
      // Set features
      if (item.features && item.features.length > 0) {
        // Features already in the array format
      }
      
      // Set compatible vehicles
      if (item.compatibleVehicles && item.compatibleVehicles.length > 0) {
        setCompatibleVehicles(item.compatibleVehicles);
      }
      
      // Set image previews
      if (item.images && item.images.length > 0) {
        const previews = item.images.map(img => img.url || img);
        setImagePreviewUrls(previews);
      }
    }
  }, [item]);
  
  const fetchBusinesses = async () => {
    try {
      // If user is not admin, only fetch their associated business
      if (user && user.role !== 'admin') {
        if (user.businessId) {
          // Provider user - fetch the service provider
          const response = await axios.get(`/api/providers/${user.businessId}`);
          if (response.data.success) {
            const business = response.data.data;
            setAvailableBusinesses([{ ...business, type: 'service' }]);
            setFormData(prev => ({
              ...prev,
              businessId: business._id,
              businessType: 'service'
            }));
          }
        } else if (user.dealership) {
          // Dealer user - fetch the dealership
          const response = await axios.get(`/api/dealers/${user.dealership}`);
          if (response.data.success) {
            const business = response.data.data;
            setAvailableBusinesses([{ ...business, type: 'dealer' }]);
            setFormData(prev => ({
              ...prev,
              businessId: business._id,
              businessType: 'dealer'
            }));
          }
        }
      } else {
        // Admin user - fetch all providers and dealers
        try {
          // Try providers
          const providersResponse = await axios.get('/api/providers', {
            params: { limit: 100 }
          });
          
          // Try dealers
          const dealersResponse = await axios.get('/api/dealers', {
            params: { limit: 100 }
          });
          
          // Combine the results
          const providers = providersResponse.data.success ? providersResponse.data.data.map(p => ({ ...p, type: 'service' })) : [];
          const dealers = dealersResponse.data.success ? dealersResponse.data.data.map(d => ({ ...d, type: 'dealer' })) : [];
          
          const allBusinesses = [...providers, ...dealers];
          
          // Log the businesses for debugging
          console.log(`Fetched ${allBusinesses.length} businesses: ${providers.length} providers, ${dealers.length} dealers`);
          
          setAvailableBusinesses(allBusinesses);
        } catch (error) {
          console.error('Error fetching businesses:', error);
          
          // Try an alternative approach with direct fetch and /api prefix
          try {
            const [providersRes, dealersRes] = await Promise.all([
              fetch('/api/providers?limit=100'),
              fetch('/api/dealers?limit=100')
            ]);
            
            if (providersRes.ok && dealersRes.ok) {
              const providersData = await providersRes.json();
              const dealersData = await dealersRes.json();
              
              const providers = providersData.success ? providersData.data.map(p => ({ ...p, type: 'service' })) : [];
              const dealers = dealersData.success ? dealersData.data.map(d => ({ ...d, type: 'dealer' })) : [];
              
              const allBusinesses = [...providers, ...dealers];
              
              console.log(`Fetched ${allBusinesses.length} businesses using alternative method`);
              
              setAvailableBusinesses(allBusinesses);
            }
          } catch (altError) {
            console.error('Alternative business fetch failed:', altError);
            
            // Create a fallback business if none found
            if (user && (user.businessId || user.dealership)) {
              const fallbackBusiness = {
                _id: user.businessId || user.dealership,
                businessName: 'Your Business',
                type: user.businessId ? 'service' : 'dealer'
              };
              
              setAvailableBusinesses([fallbackBusiness]);
              setFormData(prev => ({
                ...prev,
                businessId: fallbackBusiness._id,
                businessType: fallbackBusiness.type
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setError('Failed to load businesses. Please try again later.');
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      // Handle regular properties
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // If businessId changes, also update businessType
      if (name === 'businessId') {
setBusinessId(value);

        const selectedBusiness = availableBusinesses.find(b => b._id === value);
        if (selectedBusiness) {
          setFormData(prev => ({
            ...prev,
            businessType: selectedBusiness.type || 'service'
          }));
        }
      }
    }
  };
  
// Enhanced image change handler with better S3 preparation
const handleImageChange = (e) => {
  e.preventDefault();
  
  const files = Array.from(e.target.files);
  
  if (files.length === 0) return;
  
  // Validate files before uploading
  const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  const validFiles = files.filter(file => {
    const isValidType = validImageTypes.includes(file.type);
    const isValidSize = file.size <= maxSize;
    
    if (!isValidType) {
      console.error(`Invalid file type: ${file.type}`);
      setError(`File "${file.name}" has invalid type. Please use JPEG, PNG, or WebP.`);
    }
    
    if (!isValidSize) {
      console.error(`File too large: ${file.size} bytes`);
      setError(`File "${file.name}" exceeds 5MB size limit.`);
    }
    
    return isValidType && isValidSize;
  });
  
  if (validFiles.length === 0) {
    return;
  }
  
  // Store files for upload
  setImageFiles(prev => [...prev, ...validFiles]);
  
  // Create preview URLs
  const newPreviewUrls = validFiles.map(file => {
    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    
    // Log for debugging
    console.log(`Prepared image for upload: ${file.name}, ${file.type}, ${file.size} bytes`);
    
    return objectUrl;
  });
  
  setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
  
  // Clear any existing error
  if (error && error.includes('image')) {
    setError(null);
  }
  
  // Reset file input
  setFileInputKey(Date.now());
};
  
  const handleRemoveImage = (index) => {
    // Remove from files array
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);
    
    // Remove from preview URLs
    const newPreviews = [...imagePreviewUrls];
    
    // Revoke object URL to prevent memory leaks
    if (newPreviews[index]?.startsWith('blob:')) {
      URL.revokeObjectURL(newPreviews[index]);
    }
    
    newPreviews.splice(index, 1);
    setImagePreviewUrls(newPreviews);
  };
  
  const handleSpecificationChange = (index, field, value) => {
    const newSpecifications = [...specifications];
    newSpecifications[index][field] = value;
    setSpecifications(newSpecifications);
  };
  
  const addSpecification = () => {
    setSpecifications([...specifications, { key: '', value: '' }]);
  };
  
  const removeSpecification = (index) => {
    const newSpecifications = [...specifications];
    newSpecifications.splice(index, 1);
    
    if (newSpecifications.length === 0) {
      // Always keep at least one empty specification row
      newSpecifications.push({ key: '', value: '' });
    }
    
    setSpecifications(newSpecifications);
  };
  
  const handleFeatureInputChange = (e) => {
    setFeatureInput(e.target.value);
  };
  
  const addFeature = () => {
    if (featureInput.trim() === '') return;
    
    setFormData(prev => ({
      ...prev,
      features: [...(prev.features || []), featureInput.trim()]
    }));
    
    // Clear input
    setFeatureInput('');
  };
  
  const handleFeatureKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addFeature();
    }
  };
  
  const removeFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };
  
  const handleCompatibleVehicleChange = (index, field, value) => {
    const newVehicles = [...compatibleVehicles];
    newVehicles[index][field] = value;
    setCompatibleVehicles(newVehicles);
  };
  
  const addCompatibleVehicle = () => {
    setCompatibleVehicles([...compatibleVehicles, { make: '', model: '', years: '' }]);
  };
  
  const removeCompatibleVehicle = (index) => {
    const newVehicles = [...compatibleVehicles];
    newVehicles.splice(index, 1);
    
    if (newVehicles.length === 0) {
      // Always keep at least one empty vehicle row
      newVehicles.push({ make: '', model: '', years: '' });
    }
    
    setCompatibleVehicles(newVehicles);
  };
  
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: checked
        }
      }));
    } else {
      // Handle regular properties
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    }
  };
  
const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  
  // Validate form data (implement your validation logic here)
  if (!formData.title || !formData.price || !formData.category) {
    setError('Please fill in all required fields');
    return;
  }
  
  if (!businessId) {
    setError('Please select a business');
    return;
  }
  
  if (!item && imageFiles.length === 0) {
    setError('Please upload at least one image');
    return;
  }
  
  try {
    setLoading(true);
    
    // Create FormData object for file uploads
    const formDataToSubmit = new FormData();
    
    // Convert all item data to JSON string (except images)
    const itemData = {
      ...formData,
      businessId,
      businessType, // Include business type for the API
      price: parseFloat(formData.price), // Ensure price is a number
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
      stock: {
        ...formData.stock,
        quantity: parseInt(formData.stock.quantity, 10) // Ensure quantity is an integer
      }
    };
    
    // If we're editing an existing item and have images
    if (item && item.images && item.images.length > 0) {
      // Pass a flag to indicate which existing images to keep
      itemData.keepExistingImages = true;
    }
    
    // Append itemData as JSON string
    formDataToSubmit.append('itemData', JSON.stringify(itemData));
    
    // Add image files
    imageFiles.forEach(file => {
      formDataToSubmit.append('images', file);
      console.log(`Added image file: ${file.name}, ${file.type}, ${file.size} bytes`);
    });
    
    // Log form data structure for debugging
    console.log('Submitting inventory form with data structure:');
    for (let [key, value] of formDataToSubmit.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name}, ${value.type}, ${value.size} bytes`);
      } else if (key === 'itemData') {
        console.log(`${key}: ${value.substring(0, 100)}...`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }
    
    // Extract token for authorization
    const token = localStorage.getItem('token');
    
    // Make API call
    let response;
    if (item && item._id) {
      // Update existing item
      response = await axios.put(`/api/inventory/${item._id}`, formDataToSubmit, {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Do not set Content-Type here, axios will set it with boundary for FormData
        }
      });
    } else {
      // Create new item
      response = await axios.post('/api/inventory', formDataToSubmit, {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Do not set Content-Type here, axios will set it with boundary for FormData
        }
      });
    }
    
    if (response.data && response.data.success) {
      if (onSave) {
        onSave(response.data.data);
      }
      
      // Reset form if needed
      if (!item) {
        setFormData({
          ...defaultFormState,
          businessId,
          businessType
        });
        setImageFiles([]);
        setImagePreviewUrls([]);
        setSpecifications([{ key: '', value: '' }]);
        setFeatureInput('');
        setCompatibleVehicles([{ make: '', model: '', years: '' }]);
      }
    } else {
      throw new Error(response.data?.message || 'Failed to save inventory item');
    }
  } catch (error) {
    console.error('Error saving inventory item:', error);
    setError(error.response?.data?.message || error.message || 'Failed to save inventory item');
    
    // If axios error has a response, log it for debugging
    if (error.response) {
      console.error('Server responded with:', error.response.status, error.response.data);
    }
  } finally {
    setLoading(false);
  }
};
  
  return (
    <div className="inventory-form-container">
      <h2>{item ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
      
      {error && <div className="inventory-form-error">{error}</div>}
      
      {availableBusinesses.length === 0 ? (
        <div className="inventory-form-error">
          <p>No businesses found. You need at least one business to add inventory items.</p>
          <p>Please add a business first or try again later.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="inventory-form">
          <div className="inventory-form-section">
            <h3>Basic Information</h3>
            
            <div className="inventory-form-grid">
              <div className="inventory-form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Performance Exhaust System"
                  className="inventory-form-input"
                />
              </div>
              
              <div className="inventory-form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="inventory-form-select"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="inventory-form-grid">
              <div className="inventory-form-group">
                <label htmlFor="price">Price (P) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="e.g. 299.99"
                  className="inventory-form-input"
                />
              </div>
              
              <div className="inventory-form-group">
                <label htmlFor="originalPrice">Original Price (P)</label>
                <input
                  type="number"
                  id="originalPrice"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="e.g. 349.99 (if on sale)"
                  className="inventory-form-input"
                />
                <small className="inventory-form-hint">Leave empty if item is not on sale</small>
              </div>
            </div>
            
            <div className="inventory-form-grid">
              <div className="inventory-form-group">
                <label htmlFor="condition">Condition *</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                  className="inventory-form-select"
                >
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                  <option value="Refurbished">Refurbished</option>
                </select>
              </div>
              
              <div className="inventory-form-group">
                <label htmlFor="businessId">Business *</label>
                <select
                  id="businessId"
                  name="businessId"
                  value={formData.businessId}
                  onChange={handleChange}
                  required
                  className="inventory-form-select"
                  disabled={item && item._id || availableBusinesses.length === 1} // Disable when editing or only one business
                >
                  <option value="">Select Business</option>
                  {availableBusinesses.map(business => (
                    <option key={business._id} value={business._id}>
                      {business.businessName} ({business.type === 'dealer' ? 'Dealer' : 'Service'})
                    </option>
                  ))}
                </select>
                {availableBusinesses.length === 1 && (
                  <small className="inventory-form-hint">You can only add items to your own business</small>
                )}
                {(item && item._id) && (
                  <small className="inventory-form-hint">Business cannot be changed after creation</small>
                )}
              </div>
            </div>
            
            <div className="inventory-form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Detailed description of the item"
                className="inventory-form-textarea"
                rows="5"
              ></textarea>
            </div>
          </div>
          
          <div className="inventory-form-section">
            <h3>Inventory Management</h3>
            
            <div className="inventory-form-grid">
              <div className="inventory-form-group">
                <label htmlFor="stock.quantity">Quantity *</label>
                <input
                  type="number"
                  id="stock.quantity"
                  name="stock.quantity"
                  value={formData.stock.quantity}
                  onChange={handleChange}
                  required
                  min="0"
                  className="inventory-form-input"
                />
              </div>
              
              <div className="inventory-form-group">
                <label htmlFor="stock.sku">SKU</label>
                <input
                  type="text"
                  id="stock.sku"
                  name="stock.sku"
                  value={formData.stock.sku}
                  onChange={handleChange}
                  placeholder="Optional - Auto-generated if empty"
                  className="inventory-form-input"
                />
              </div>
            </div>
            
            <div className="inventory-form-group">
              <label htmlFor="stock.location">Storage Location</label>
              <input
                type="text"
                id="stock.location"
                name="stock.location"
                value={formData.stock.location}
                onChange={handleChange}
                placeholder="e.g. Warehouse A, Shelf B3 (Optional)"
                className="inventory-form-input"
              />
            </div>
            
            <div className="inventory-form-grid">
              <div className="inventory-form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="inventory-form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              
              <div className="inventory-form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured || false}
                    onChange={handleCheckboxChange}
                    className="inventory-form-checkbox"
                  />
                  Featured Item
                </label>
                <small className="inventory-form-hint">Featured items appear on the homepage and in special sections</small>
              </div>
            </div>
          </div>
          
          <div className="inventory-form-section">
            <h3>Shipping Options</h3>
            
            <div className="inventory-form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="shipping.available"
                  checked={formData.shipping?.available || false}
                  onChange={handleCheckboxChange}
                  className="inventory-form-checkbox"
                />
                Shipping Available
              </label>
            </div>
            
            {formData.shipping?.available && (
              <div className="inventory-form-grid">
                <div className="inventory-form-group">
                  <label htmlFor="shipping.cost">Shipping Cost (P)</label>
                  <input
                    type="number"
                    id="shipping.cost"
                    name="shipping.cost"
                    value={formData.shipping?.cost || 0}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="inventory-form-input"
                  />
                </div>
                
                <div className="inventory-form-group">
                  <label htmlFor="shipping.freeOver">Free Shipping Over (P)</label>
                  <input
                    type="number"
                    id="shipping.freeOver"
                    name="shipping.freeOver"
                    value={formData.shipping?.freeOver || 0}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0 = Never free"
                    className="inventory-form-input"
                  />
                </div>
                
                <div className="inventory-form-group">
                  <label htmlFor="shipping.estimatedDays">Estimated Delivery</label>
                  <input
                    type="text"
                    id="shipping.estimatedDays"
                    name="shipping.estimatedDays"
                    value={formData.shipping?.estimatedDays || '1-3 days'}
                    onChange={handleChange}
                    placeholder="e.g. 1-3 days"
                    className="inventory-form-input"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="inventory-form-section">
            <h3>Specifications</h3>
            <div className="inventory-form-specifications">
              {specifications.map((spec, index) => (
                <div key={index} className="specification-row">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                    placeholder="Key (e.g. Brand)"
                    className="inventory-form-input specification-key"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                    placeholder="Value (e.g. TurboMax)"
                    className="inventory-form-input specification-value"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecification(index)}
                    className="inventory-form-button remove-button"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addSpecification}
                className="inventory-form-button add-button"
              >
                + Add Specification
              </button>
            </div>
          </div>
          
          <div className="inventory-form-section">
            <h3>Features</h3>
            
            <div className="inventory-form-features">
              <div className="feature-input-row">
                <input
                  type="text"
                  value={featureInput}
                  onChange={handleFeatureInputChange}
                  onKeyPress={handleFeatureKeyPress}
                  placeholder="e.g. Water resistant"
                  className="inventory-form-input feature-input"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="inventory-form-button add-button"
                >
                  Add
                </button>
              </div>
              
              {formData.features && formData.features.length > 0 && (
                <div className="feature-tags">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="feature-tag">
                      <span>{feature}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="remove-feature-button"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="inventory-form-section">
            <h3>Compatible Vehicles</h3>
            
            <div className="inventory-form-compatibles">
              {compatibleVehicles.map((vehicle, index) => (
                <div key={index} className="compatible-vehicle-row">
                  <input
                    type="text"
                    value={vehicle.make}
                    onChange={(e) => handleCompatibleVehicleChange(index, 'make', e.target.value)}
                    placeholder="Make (e.g. Toyota)"
                    className="inventory-form-input vehicle-make"
                  />
                  <input
                    type="text"
                    value={vehicle.model}
                    onChange={(e) => handleCompatibleVehicleChange(index, 'model', e.target.value)}
                    placeholder="Model (e.g. Corolla)"
                    className="inventory-form-input vehicle-model"
                  />
                  <input
                    type="text"
                    value={vehicle.years}
                    onChange={(e) => handleCompatibleVehicleChange(index, 'years', e.target.value)}
                    placeholder="Years (e.g. 2015-2020)"
                    className="inventory-form-input vehicle-years"
                  />
                  <button
                    type="button"
                    onClick={() => removeCompatibleVehicle(index)}
                    className="inventory-form-button remove-button"
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addCompatibleVehicle}
                className="inventory-form-button add-button"
              >
                + Add Compatible Vehicle
              </button>
            </div>
          </div>
          
          <div className="inventory-form-section">
            <h3>Images</h3>
            
            <div className="inventory-form-images">
              <div className="image-upload-container">
                <input
                  key={fileInputKey}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  multiple
                  className="inventory-form-file-input"
                  id="inventory-images"
                />
                <label htmlFor="inventory-images" className="inventory-form-file-label">
                  <span className="upload-icon">+</span>
                  <span>Click or drag to upload</span>
                </label>
                <small className="inventory-form-hint">Up to 10 images, 5MB each (JPEG, PNG, or WebP)</small>
              </div>
              
              {imagePreviewUrls.length > 0 && (
               <div className="image-preview-grid">
  {imagePreviewUrls.map((previewUrl, index) => (
    <div key={index} className="image-preview">
      <img 
        src={previewUrl} 
        alt={`Preview ${index + 1}`} 
        onError={(e) => {
          const originalSrc = e.target.src;
          console.error(`Preview image failed to load: ${originalSrc}`);
          
          // Mark this image as failed
          markFailedImage(originalSrc);
          
          // For S3 URLs, try the proxy endpoint
          if (originalSrc.includes('amazonaws.com')) {
            // Extract key from S3 URL
            const key = originalSrc.split('.amazonaws.com/').pop();
            if (key) {
              // Normalize the key
              const normalizedKey = key.replace(/images\/images\//g, 'images/');
              e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
              return;
            }
          }
          
          // Try other paths for non-blob URLs
          if (!originalSrc.startsWith('blob:') && !originalSrc.includes('/images/placeholders/')) {
            const filename = originalSrc.split('/').pop();
            if (filename) {
              e.target.src = `/uploads/inventory/${filename}`;
              return;
            }
          }
          
          // Final fallback
          e.target.src = '/images/placeholders/part.jpg';
        }}
      />
      <button
        type="button"
        onClick={() => handleRemoveImage(index)}
        className="remove-image-button"
      >
        ×
      </button>
    </div>
  ))}
</div>
              )}
            </div>
          </div>
          
          <div className="inventory-form-actions">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inventory-form-button cancel-button"
                disabled={loading}
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              className="inventory-form-button submit-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default InventoryForm;