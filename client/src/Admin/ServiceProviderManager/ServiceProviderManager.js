// src/components/admin/ServiceProviderManager/ServiceProviderManager.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../store/slices/uiSlice.js';
import ServiceProviderForm from './ServiceProviderForm.js';
import './ServiceProviderManager.css';
import { useNavigate } from 'react-router-dom';
import { http } from '../../config/axios.js';
import { PROVIDER_TYPES } from './providerTypes.js';
import ServiceProviderCard from './ServiceProviderCard.js';
import Tabs from '../../components/shared/Tabs/Tabs.js';
import SubscriptionManager from './SubscriptionManager.js';
import Confirmation from '../../components/shared/Confirmation/Confirmation.js';

const ServiceProviderManager = () => {
    const dispatch = useDispatch();

// Add at the beginning of the ServiceProviderCard component
const checkFailedImage = (url, type = 'logo') => {
  try {
    const failedImages = JSON.parse(localStorage.getItem(`failedProvider${type.charAt(0).toUpperCase() + type.slice(1)}s`) || '{}');
    return !!failedImages[url];
  } catch (e) {
    return false;
  }
};

const markFailedImage = (url, type = 'logo') => {
  try {
    const storageKey = `failedProvider${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    const failedImages = JSON.parse(localStorage.getItem(storageKey) || '{}');
    failedImages[url] = Date.now();
    
    // Limit cache size
    const keys = Object.keys(failedImages);
    if (keys.length > 100) {
      const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
      delete failedImages[oldestKey];
    }
    
    localStorage.setItem(storageKey, JSON.stringify(failedImages));
  } catch (e) {
    // Ignore localStorage errors
  }
};

// Enhanced function to get image URL with S3 support
const getProviderImageUrl = (imageData, type = 'logo') => {
  try {
    if (!imageData) return `/images/placeholders/${type}-placeholder.jpg`;
    
    // If imageData is a string, use it directly
    if (typeof imageData === 'string') {
      // Fix problematic S3 URLs with duplicate paths
      if (imageData.includes('/images/images/')) {
        return imageData.replace(/\/images\/images\//g, '/images/');
      }
      return imageData;
    }
    
    // If imageData is an object with url property
    if (imageData && typeof imageData === 'object') {
      const imageUrl = imageData.url || '';
      
      // If we have an S3 key but no URL, create proxy URL
      if (!imageUrl && imageData.key) {
        return `/api/images/s3-proxy/${imageData.key}`;
      }
      
      if (imageUrl) {
        // Fix problematic S3 URLs with duplicate paths
        if (imageUrl.includes('/images/images/')) {
          return imageUrl.replace(/\/images\/images\//g, '/images/');
        }
        return imageUrl;
      }
    }
    
    // Fallback to placeholder
    return `/images/placeholders/${type}-placeholder.jpg`;
  } catch (error) {
    console.error(`Error getting provider ${type} URL:`, error);
    return `/images/placeholders/${type}-placeholder.jpg`;
  }
};

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  const [filters, setFilters] = useState({
    status: 'all',
    subscriptionStatus: 'all',
    businessType: 'all',
    search: '',
    sortBy: 'newest'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  // Provider type tabs configuration
   const tabs = [
    { id: 'all', label: 'All Providers' },
    { id: PROVIDER_TYPES.CAR_RENTAL, label: 'Car Rentals' },
    { id: PROVIDER_TYPES.TRAILER_RENTAL, label: 'Trailer Rentals' },
    { id: PROVIDER_TYPES.PUBLIC_TRANSPORT, label: 'Transport Services' },
    { id: PROVIDER_TYPES.WORKSHOP, label: 'Workshops' }
    // Removed DEALERSHIP tab - managed separately
  ];

  useEffect(() => {
    fetchProviders();
  }, [filters, pagination.currentPage, selectedType]);

const fetchProviders = async () => {
  try {
    setLoading(true);
    setError(null);

    // Prepare query parameters
    const params = {
      ...filters,
      page: pagination.currentPage,
      limit: 9
    };

    // Add provider type filter if not 'all'
    if (selectedType !== 'all') {
      params.providerType = selectedType;
    }

    // Convert sortBy filter to API sort parameter
    switch (filters.sortBy) {
      case 'newest':
        params.sort = '-createdAt';
        break;
      case 'oldest':
        params.sort = 'createdAt';
        break;
      case 'businessName':
        params.sort = 'businessName';
        break;
      case 'subscriptionExpiry':
        params.sort = 'subscription.expiresAt';
        break;
      default:
        params.sort = '-createdAt';
    }

    // Make API call
    const response = await http.get('/providers', { params });
    
    if (response.data && response.data.success) {
      // Process providers to ensure S3 image consistency
      const processedProviders = response.data.data ? response.data.data.map(provider => {
        // Process logo if it exists
        if (provider.profile && provider.profile.logo) {
          // If logo is a string, check for S3 URL patterns
          if (typeof provider.profile.logo === 'string') {
            // Fix any problematic S3 URLs with duplicate paths
            if (provider.profile.logo.includes('/images/images/')) {
              provider.profile.logo = provider.profile.logo.replace(/\/images\/images\//g, '/images/');
            }
          }
          // If logo is an object but missing url property, add it from key
          else if (typeof provider.profile.logo === 'object' && !provider.profile.logo.url && provider.profile.logo.key) {
            provider.profile.logo.url = `/api/images/s3-proxy/${provider.profile.logo.key}`;
          }
        }
        
        // Process banner if it exists
        if (provider.profile && provider.profile.banner) {
          // If banner is a string, check for S3 URL patterns
          if (typeof provider.profile.banner === 'string') {
            // Fix any problematic S3 URLs with duplicate paths
            if (provider.profile.banner.includes('/images/images/')) {
              provider.profile.banner = provider.profile.banner.replace(/\/images\/images\//g, '/images/');
            }
          }
          // If banner is an object but missing url property, add it from key
          else if (typeof provider.profile.banner === 'object' && !provider.profile.banner.url && provider.profile.banner.key) {
            provider.profile.banner.url = `/api/images/s3-proxy/${provider.profile.banner.key}`;
          }
        }
        
        return provider;
      }) : [];
      
      setProviders(processedProviders);
      setPagination({
        currentPage: response.data.pagination?.currentPage || 1,
        totalPages: response.data.pagination?.totalPages || 1,
        total: response.data.pagination?.total || 0
      });
    } else {
      throw new Error(response.data?.message || 'Failed to load providers');
    }
  } catch (error) {
    console.error('Error fetching providers:', error);
    setError('Failed to load providers. Please try again.');
  } finally {
    setLoading(false);
  }
};

// Enhanced handleCreateProvider function with better S3 support
const handleCreateProvider = async (formData) => {
  try {
    setLoading(true);
    setError(null);

    // Check if formData is already a FormData object
    if (!(formData instanceof FormData)) {
      console.error('Expected FormData object, but received:', typeof formData);
      throw new Error('Invalid form data format');
    }
    
    // Log for debugging
    console.log('Submitting provider with form data:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name}, ${value.type}, ${value.size} bytes`);
      } else if (['profile', 'contact', 'location', 'social'].includes(key)) {
        // For JSON strings, show a preview
        console.log(`${key}: ${value.substring(0, 50)}...`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    // Submit the form data
    const response = await http.post('/providers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data && response.data.success) {
      // Add to providers list
      setProviders(prev => [response.data.data, ...prev]);
      setShowForm(false);
      
      // Switch to the provider type tab
      setSelectedType(response.data.data.providerType);
      
      // Show success notification
      dispatch(addNotification({
        type: 'success',
        message: 'Provider created successfully'
      }));
    } else {
      throw new Error(response.data?.message || 'Failed to create provider');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error creating provider:', error);
    
    // Show error notification
    dispatch(addNotification({
      type: 'error',
      message: error.response?.data?.message || error.message || 'Failed to create provider'
    }));
    
    throw error;
  } finally {
    setLoading(false);
  }
};

// Enhanced handleUpdateProvider function with better S3 support
const handleUpdateProvider = async (formData) => {
  if (!selectedProvider) return;

  try {
    setLoading(true);
    setError(null);

    // Check if formData is already a FormData object
    if (!(formData instanceof FormData)) {
      console.error('Expected FormData object, but received:', typeof formData);
      throw new Error('Invalid form data format');
    }
    
    // Log for debugging
    console.log(`Updating provider ${selectedProvider._id} with form data:`);
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name}, ${value.type}, ${value.size} bytes`);
      } else if (['profile', 'contact', 'location', 'social'].includes(key)) {
        // For JSON strings, show a preview
        console.log(`${key}: ${value.substring(0, 50)}...`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    // Submit the form data
    const response = await http.put(`/providers/${selectedProvider._id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data && response.data.success) {
      // Update the provider in the list
      setProviders(prev => 
        prev.map(provider => 
          provider._id === selectedProvider._id ? response.data.data : provider
        )
      );
      setShowForm(false);
      setSelectedProvider(null);
      
      // Show success notification
      dispatch(addNotification({
        type: 'success',
        message: 'Provider updated successfully'
      }));
    } else {
      throw new Error(response.data?.message || 'Failed to update provider');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error updating provider:', error);
    
    // Show error notification
    dispatch(addNotification({
      type: 'error',
      message: error.response?.data?.message || error.message || 'Failed to update provider'
    }));
    
    throw error;
  } finally {
    setLoading(false);
  }
};

  const handleDeleteProvider = async () => {
    if (!selectedProvider) return;
    
    try {
      setLoading(true);
      setError(null);

      // Make the API call
      const response = await http.delete(`/providers/${selectedProvider._id}`);
      
      if (response.data && response.data.success) {
        // Remove from providers list
        setProviders(prev => prev.filter(provider => provider._id !== selectedProvider._id));
        setShowDeleteConfirmation(false);
        setSelectedProvider(null);
      } else {
        throw new Error(response.data?.message || 'Failed to delete provider');
      }
    } catch (error) {
      console.error('Error deleting provider:', error);
      setError('Failed to delete provider. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (subscriptionData) => {
    if (!selectedProvider) return;
    
    try {
      setLoading(true);
      setError(null);

      // Make the API call
      const response = await http.put(
        `/providers/${selectedProvider._id}/subscription`, 
        subscriptionData
      );
      
      if (response.data && response.data.success) {
        // Update provider in the list
        setProviders(prev => 
          prev.map(provider => 
            provider._id === selectedProvider._id ? response.data.data : provider
          )
        );
        setShowSubscriptionModal(false);
      } else {
        throw new Error(response.data?.message || 'Failed to update subscription');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError('Failed to update subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProvider = async (id) => {
    try {
      setLoading(true);
      setError(null);

      // Make the API call
      const response = await http.put(`/providers/${id}/verify`, {});
      
      if (response.data && response.data.success) {
        // Update provider in the list
        setProviders(prev => 
          prev.map(provider => 
            provider._id === id ? response.data.data : provider
          )
        );
      } else {
        throw new Error(response.data?.message || 'Failed to verify provider');
      }
      
      return response.data.data;
    } catch (error) {
      console.error('Error verifying provider:', error);
      setError('Failed to verify provider. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewListings = (provider) => {
    // Navigate to the appropriate listings page based on provider type
    switch (provider.providerType) {
      case PROVIDER_TYPES.CAR_RENTAL:
        navigate(`/admin/rentals?providerId=${provider._id}`);
        break;
      case PROVIDER_TYPES.TRAILER_RENTAL:
        navigate(`/admin/trailers?providerId=${provider._id}`);
        break;
      case PROVIDER_TYPES.PUBLIC_TRANSPORT:
        navigate(`/admin/transport?providerId=${provider._id}`);
        break;
      case PROVIDER_TYPES.WORKSHOP:
        // Workshops don't have listings, navigate to workshop details instead
        navigate(`/workshops/${provider._id}`);
        break;
      default:
        console.warn(`No listings page for provider type: ${provider.providerType}`);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tabId) => {
    setSelectedType(tabId);
    // Reset pagination
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  };

  const getProviderTypeName = (type) => {
    switch (type) {
      case PROVIDER_TYPES.CAR_RENTAL:
        return 'Car Rental';
      case PROVIDER_TYPES.TRAILER_RENTAL:
        return 'Trailer Rental';
      case PROVIDER_TYPES.PUBLIC_TRANSPORT:
        return 'Transport Service';
      case PROVIDER_TYPES.DEALERSHIP:
        return 'Dealership';
      case PROVIDER_TYPES.WORKSHOP:
        return 'Workshop';
      default:
        return 'Unknown';
    }
  };

  const getFormattedBusinessType = (type, providerType) => {
    if (type === 'independent' && providerType === PROVIDER_TYPES.DEALERSHIP) {
      return 'Independent Dealer';
    } else if (type === 'franchise' && providerType === PROVIDER_TYPES.DEALERSHIP) {
      return 'Franchise Dealer';
    } else if (type === 'certified' && providerType === PROVIDER_TYPES.DEALERSHIP) {
      return 'Certified Dealer';
    } else if (type === 'authorized' && providerType === PROVIDER_TYPES.WORKSHOP) {
      return 'Authorized Workshop';
    } else {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchProviders();
  };

  // Count providers by user and type to show multi-provider badges
  const getUserProviderCounts = () => {
    const counts = {};
    
    providers.forEach(provider => {
      const userId = provider.user?._id || 'unknown';
      const type = provider.providerType || 'unknown';
      const key = `${userId}-${type}`;
      
      if (!counts[key]) {
        counts[key] = 1;
      } else {
        counts[key]++;
      }
    });
    
    return counts;
  };

  // Get provider counts by user and type
  const providerCounts = getUserProviderCounts();

  return (
    <div className="spm-service-provider-manager">
      <div className="spm-section-header">
        <h1>Service Provider Management</h1>
        <div className="spm-action-buttons">
          <button 
            className="spm-add-provider-btn"
            onClick={() => {
              setSelectedProvider(null);
              setShowForm(true);
            }}
          >
            + Add New Provider
          </button>
        </div>
      </div>

      {/* Provider Type Tabs */}
      <Tabs 
        tabs={tabs} 
        activeTab={selectedType} 
        onTabChange={handleTabChange} 
      />

      {/* Filters */}
      <div className="spm-filter-section">
        <div className="spm-filter-row">
          <div className="spm-filter-group spm-search-group">
            <input 
              type="text"
              placeholder="Search providers..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="spm-search-input"
            />
            <button 
              className="spm-search-btn"
              onClick={() => fetchProviders()}
            >
              Search
            </button>
          </div>

          <div className="spm-filter-group">
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="spm-filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="spm-filter-group">
            <select 
              value={filters.subscriptionStatus}
              onChange={(e) => handleFilterChange('subscriptionStatus', e.target.value)}
              className="spm-filter-select"
            >
              <option value="all">All Subscriptions</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="spm-filter-group">
            <select 
              value={filters.businessType}
              onChange={(e) => handleFilterChange('businessType', e.target.value)}
              className="spm-filter-select"
            >
              <option value="all">All Types</option>
              <option value="independent">Independent</option>
              <option value="franchise">Franchise</option>
              <option value="certified">Certified</option>
              <option value="authorized">Authorized</option>
            </select>
          </div>
          
          <div className="spm-filter-group">
            <select 
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="spm-filter-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="businessName">Business Name</option>
              <option value="subscriptionExpiry">Subscription Expiry</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="spm-error-message">
          {error}
          <button className="spm-retry-button" onClick={handleRetry}>
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && providers.length === 0 ? (
        <div className="spm-loading-container">
          <div className="spm-spinner"></div>
        </div>
      ) : providers.length === 0 ? (
        <div className="spm-no-providers">
          <p>No providers found.</p>
          <button 
            className="spm-add-provider-btn small"
            onClick={() => {
              setSelectedProvider(null);
              setShowForm(true);
            }}
          >
            Add Your First Provider
          </button>
        </div>
      ) : (
        <>
          {/* Grid of Provider Cards */}
          <div className="spm-providers-grid">
            {providers.map(provider => {
              // Get user ID and provider type to calculate multiple providers
              const userId = provider.user?._id || 'unknown';
              const type = provider.providerType || 'unknown';
              const key = `${userId}-${type}`;
              const count = providerCounts[key] || 1;
              const hasMultiple = count > 1;
              
              return (
                <ServiceProviderCard
                  key={provider._id}
                  provider={provider}
                  onEdit={() => {
                    setSelectedProvider(provider);
                    setShowForm(true);
                  }}
                  onView={() => {
                    // Navigate to provider details
                    const baseUrl = provider.providerType === PROVIDER_TYPES.DEALERSHIP 
                      ? '/dealerships/'
                      : '/services/';
                    navigate(`${baseUrl}${provider._id}`);
                  }}
                  onViewListings={() => handleViewListings(provider)}
                  onVerify={() => handleVerifyProvider(provider._id)}
                  onManageSubscription={() => {
                    setSelectedProvider(provider);
                    setShowSubscriptionModal(true);
                  }}
                  onDelete={() => {
                    setSelectedProvider(provider);
                    setShowDeleteConfirmation(true);
                  }}
                  getProviderTypeName={getProviderTypeName}
                  getFormattedBusinessType={getFormattedBusinessType}
                  multipleProviders={hasMultiple}
                  providerCount={count}
                />
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="spm-pagination">
              <button 
                className="spm-page-button prev" 
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, index) => {
                // Calculate which pages to show
                let pageToShow;
                if (pagination.totalPages <= 5) {
                  pageToShow = index + 1;
                } else if (pagination.currentPage <= 3) {
                  pageToShow = index + 1;
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageToShow = pagination.totalPages - 4 + index;
                } else {
                  pageToShow = pagination.currentPage - 2 + index;
                }
                
                return (
                  <button
                    key={pageToShow}
                    className={`spm-page-button number ${pagination.currentPage === pageToShow ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageToShow)}
                  >
                    {pageToShow}
                  </button>
                );
              })}
              
              <button 
                className="spm-page-button next" 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Provider Form Modal */}
      {showForm && (
        <ServiceProviderForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedProvider(null);
          }}
          onSubmit={selectedProvider ? handleUpdateProvider : handleCreateProvider}
          initialData={selectedProvider}
        />
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && selectedProvider && (
        <SubscriptionManager
          isOpen={showSubscriptionModal}
          onClose={() => {
            setShowSubscriptionModal(false);
            setSelectedProvider(null);
          }}
          provider={selectedProvider}
          onUpdate={handleUpdateSubscription}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && selectedProvider && (
        <Confirmation
          isOpen={showDeleteConfirmation}
          title="Delete Provider"
          message={`Are you sure you want to delete ${selectedProvider.businessName}? This will also delete all associated listings and cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonClass="spm-delete-button"
          onConfirm={handleDeleteProvider}
          onCancel={() => {
            setShowDeleteConfirmation(false);
            setSelectedProvider(null);
          }}
        />
      )}
    </div>
  );
};

export default ServiceProviderManager;