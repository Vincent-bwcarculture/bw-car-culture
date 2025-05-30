// src/components/admin/InventoryManager/InventoryManager.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../store/slices/uiSlice.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import InventoryForm from './InventoryForm.js';
import InventoryList from './InventoryList.js';
import InventoryFilters from './InventoryFilters.js';
import './InventoryManager.css';

const InventoryManager = () => {
    const dispatch = useDispatch();

// Add at the beginning of the InventoryManager component
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

// Enhanced function to get inventory image URL
const getInventoryImageUrl = (item) => {
  try {
    // Check if item has images
    if (!item || !item.images || !Array.isArray(item.images) || item.images.length === 0) {
      return '/images/placeholders/part.jpg';
    }
    
    // Get first image
    const image = item.images[0];
    let imageUrl = '';
    
    // Handle string format
    if (typeof image === 'string') {
      imageUrl = image;
    } 
    // Handle object format
    else if (image && typeof image === 'object') {
      imageUrl = image.url || image.thumbnail || '';
      
      // Use S3 proxy if we have key but no URL
      if (!imageUrl && image.key) {
        return `/api/images/s3-proxy/${image.key}`;
      }
    }
    
    // If we couldn't extract a URL, use placeholder
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


  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State variables
  const [inventoryItems, setInventoryItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    status: 'active'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1
  });
  const [sort, setSort] = useState('-createdAt');
  
  // Fetch businesses on component mount
  useEffect(() => {
    fetchBusinesses();
  }, []);
  
  // Fetch inventory items when filters, pagination, sort, or selected business changes
  useEffect(() => {
    fetchInventoryItems();
  }, [filters, pagination.page, pagination.limit, sort, selectedBusiness]);
  
  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      
      // Try to determine which API endpoint to use based on user role
      let endpoint = '/api/providers';  // Default to service providers endpoint
      
      // If user is admin, fetch all providers and dealers
      let providersResponse;
      let dealersResponse;
      
      if (user?.role === 'admin') {
        // Fetch service providers
        providersResponse = await axios.get('/api/providers', {
          params: { limit: 100 }
        });
        
        // Fetch dealers
        dealersResponse = await axios.get('/api/dealers', {
          params: { limit: 100 }
        });
        
        // Combine the lists
        const providers = providersResponse.data.success ? providersResponse.data.data : [];
        const dealers = dealersResponse.data.success ? dealersResponse.data.data : [];
        
        // Add type indicator to each business
        const providersWithType = providers.map(p => ({ ...p, type: 'service' }));
        const dealersWithType = dealers.map(d => ({ ...d, type: 'dealer' }));
        
        // Combine and set businesses
        const allBusinesses = [...providersWithType, ...dealersWithType];
        setBusinesses(allBusinesses);
        
        // If user has a specific business, select it by default
        if (user.businessId || user.dealership) {
          setSelectedBusiness(user.businessId || user.dealership);
        }
        
        console.log("Fetched businesses:", allBusinesses.length);
      } else if (user?.role === 'provider') {
        // For service providers, only show their own business
        if (user.businessId) {
          // Fetch this specific provider
          const response = await axios.get(`/api/providers/${user.businessId}`);
          if (response.data.success) {
            setBusinesses([{ ...response.data.data, type: 'service' }]);
            setSelectedBusiness(user.businessId);
          }
        }
      } else if (user?.role === 'dealer') {
        // For dealers, only show their own dealership
        if (user.dealership) {
          // Fetch this specific dealer
          const response = await axios.get(`/api/dealers/${user.dealership}`);
          if (response.data.success) {
            setBusinesses([{ ...response.data.data, type: 'dealer' }]);
            setSelectedBusiness(user.dealership);
          }
        }
      }
      
      // If there are no businesses found, try alternate endpoints with /api prefix
      if (businesses.length === 0) {
        try {
          console.log("No businesses found, trying alternate endpoints");
          // Alternate approach using fetch API with /api prefix
          const [providersFetch, dealersFetch] = await Promise.all([
            fetch('/api/providers?limit=100'),
            fetch('/api/dealers?limit=100')
          ]);
          
          if (providersFetch.ok && dealersFetch.ok) {
            const providersData = await providersFetch.json();
            const dealersData = await dealersFetch.json();
            
            const providers = providersData.success ? providersData.data : [];
            const dealers = dealersData.success ? dealersData.data : [];
            
            const providersWithType = providers.map(p => ({ ...p, type: 'service' }));
            const dealersWithType = dealers.map(d => ({ ...d, type: 'dealer' }));
            
            const allBusinesses = [...providersWithType, ...dealersWithType];
            setBusinesses(allBusinesses);
            
            console.log("Fetched businesses from alternate endpoints:", allBusinesses.length);
          }
        } catch (err) {
          console.error("Error fetching from alternate endpoints:", err);
        }
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setError('Failed to load businesses. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
// Enhanced fetchInventoryItems function with S3 image handling
const fetchInventoryItems = async () => {
  if (!selectedBusiness && user?.role !== 'admin') {
    // If not admin and no business selected, don't fetch anything
    return;
  }
  
  try {
    setLoading(true);
    
    // Prepare query parameters
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      sort
    };
    
    // Add business filter if selected
    if (selectedBusiness) {
      params.businessId = selectedBusiness;
    }
    
    // Add other filters if provided
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.condition) params.condition = filters.condition;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.status) params.status = filters.status;
    
    // Fetch inventory items
    const response = await axios.get('/api/inventory', { params });
    
    if (response.data && response.data.success) {
      // Process inventory items to ensure proper S3 image handling
      const processedItems = response.data.data ? response.data.data.map(item => {
        // Process images if they exist
        if (item.images && item.images.length > 0) {
          const processedImages = item.images.map(img => {
            // If image is a string, check for S3 URL patterns
            if (typeof img === 'string') {
              // Fix any problematic S3 URLs with duplicate paths
              if (img.includes('/images/images/')) {
                return img.replace(/\/images\/images\//g, '/images/');
              }
              return img;
            }
            
            // If image is an object
            if (img && typeof img === 'object') {
              // Fix any problematic URL if it exists
              if (img.url && img.url.includes('/images/images/')) {
                img.url = img.url.replace(/\/images\/images\//g, '/images/');
              }
              
              // If we have a key but no URL, add URL from key
              if (!img.url && img.key) {
                img.url = `/api/images/s3-proxy/${img.key}`;
              }
            }
            
            return img;
          });
          
          item.images = processedImages;
        }
        
        return item;
      }) : [];
      
      setInventoryItems(processedItems);
      setTotalItems(response.data.pagination.total);
      setPagination(prev => ({
        ...prev,
        totalPages: response.data.pagination.totalPages
      }));
    } else {
      throw new Error(response.data?.message || 'Failed to fetch inventory items');
    }
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    setError('Failed to load inventory items. Please try again.');
    setInventoryItems([]);
    setTotalItems(0);
  } finally {
    setLoading(false);
  }
};
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };
  
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };
  
  const handleLimitChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };
  
  const handleSortChange = (newSort) => {
    setSort(newSort);
  };
  
  const handleBusinessChange = (businessId) => {
    setSelectedBusiness(businessId);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Enhanced handleCreateItem function with better S3 handling
const handleCreateItem = async (formData) => {
  try {
    setLoading(true);
    
    // Create a token header for authorization
    const token = localStorage.getItem('token');
    
    // Log for debugging
    if (formData instanceof FormData) {
      console.log('Creating inventory item with FormData:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name}, ${value.type}, ${value.size} bytes`);
        } else if (key === 'itemData') {
          console.log(`${key}: ${value.substring(0, 100)}...`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
    } else {
      console.error('Expected FormData object, but received:', typeof formData);
    }
    
    // Make API call with FormData
    const response = await axios.post('/api/inventory', formData, {
      headers: {
        'Authorization': `Bearer ${token}`
        // Do not set Content-Type for FormData
      }
    });
    
    if (response.data && response.data.success) {
      // Refresh the list
      await fetchInventoryItems();
      
      // Close form and show success message
      setShowForm(false);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Inventory item created successfully'
      }));
      
      return response.data.data;
    } else {
      throw new Error(response.data?.message || 'Failed to create inventory item');
    }
  } catch (error) {
    console.error('Error creating inventory item:', error);
    
    dispatch(addNotification({
      type: 'error',
      message: error.response?.data?.message || error.message || 'Failed to create inventory item'
    }));
    
    throw error;
  } finally {
    setLoading(false);
  }
};
  
  const handleAddNew = () => {
    setSelectedItem(null);
    setShowForm(true);
  };
  
  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowForm(true);
  };
  
  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Delete the item
      const response = await axios.delete(`/api/inventory/${itemId}`);
      
      if (response.data && response.data.success) {
        // Success - refresh the list
        fetchInventoryItems();
      } else {
        throw new Error(response.data?.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      setError('Failed to delete inventory item. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusChange = async (itemId, newStatus) => {
    try {
      setLoading(true);
      
      // Update the item's status
      const response = await axios.put(`/api/inventory/${itemId}`, {
        itemData: JSON.stringify({ status: newStatus })
      });
      
      if (response.data && response.data.success) {
        // Success - refresh the list
        fetchInventoryItems();
      } else {
        throw new Error(response.data?.message || 'Failed to update item status');
      }
    } catch (error) {
      console.error('Error updating inventory item status:', error);
      setError('Failed to update item status. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveItem = (savedItem) => {
    setShowForm(false);
    fetchInventoryItems();
  };
  
  const handleCancelForm = () => {
    setShowForm(false);
  };
  
  // Determine if any businesses are available for selection
  const hasBusiness = businesses.length > 0;
  
  // Render loading state
  if (loading && inventoryItems.length === 0 && !showForm) {
    return (
      <div className="inventory-manager">
        <div className="inventory-manager-loading">
          <div className="inventory-manager-spinner"></div>
          <p>Loading inventory management...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && !showForm && inventoryItems.length === 0) {
    return (
      <div className="inventory-manager">
        <div className="inventory-manager-error">
          <h3>Error</h3>
          <p>{error}</p>
          <button 
            className="inventory-manager-retry-button"
            onClick={fetchInventoryItems}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Render no business access state
  if (!hasBusiness && !showForm && !loading) {
    return (
      <div className="inventory-manager">
        <div className="inventory-manager-no-business">
          <h3>No Business Access</h3>
          <p>You don't have access to any businesses to manage inventory.</p>
          {user?.role === 'admin' ? (
            <button 
              className="inventory-manager-action-button"
              onClick={() => navigate('/admin/providers')}
            >
              Manage Service Providers
            </button>
          ) : (
            <p>Please contact an administrator if you believe this is an error.</p>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="inventory-manager">
      {/* Header with title and add new button */}
      <div className="inventory-manager-header">
        <h2>Inventory Management</h2>
        {!showForm && (
          <button
            className="inventory-manager-add-button"
            onClick={handleAddNew}
            disabled={!hasBusiness}
          >
            + Add New Item
          </button>
        )}
      </div>
      
      {/* Display the form or the list based on state */}
      {showForm ? (
        <InventoryForm
          item={selectedItem}
          businesses={businesses}
          onSave={handleSaveItem}
          onCancel={handleCancelForm}
        />
      ) : (
        <>
          {/* Filters section */}
          <InventoryFilters
            filters={filters}
            businesses={businesses}
            selectedBusiness={selectedBusiness}
            onFilterChange={handleFilterChange}
            onBusinessChange={handleBusinessChange}
            isAdmin={user?.role === 'admin'}
          />
          
          {/* Inventory list */}
          <InventoryList
            items={inventoryItems}
            loading={loading}
            totalItems={totalItems}
            pagination={pagination}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onSortChange={handleSortChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        </>
      )}
    </div>
  );
};

export default InventoryManager;