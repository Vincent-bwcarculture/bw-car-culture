// src/components/admin/TransportRouteManager/TransportRouteManager.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { http } from '../../config/axios.js';
import './TransportRouteManager.css';
import TransportRouteForm from './TransportRouteForm.js';
import TransportRouteCard from './TransportRouteCard.js';
import Confirmation from '../../components/shared/Confirmation/Confirmation.js';
import LoadingScreen from '../../components/shared/LoadingScreen/LoadingScreen.js';

const TransportRouteManager = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [filters, setFilters] = useState({
    routeType: 'all',
    serviceType: 'all',
    status: 'all',
    search: '',
    sortBy: 'newest'
  });
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  const { user } = useAuth();
  
  // Fetch providers and routes on component mount
  useEffect(() => {
    fetchProviders();
  }, []);
  
  useEffect(() => {
    fetchRoutes();
  }, [filters, selectedProvider, pagination.currentPage]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await http.get('/providers/all', {
        params: { type: 'public_transport' }
      });
      
      if (response.data.success) {
        setProviders(response.data.providers || []);
        
        // If providers are available, select the first one by default
        if (response.data.providers && response.data.providers.length > 0) {
          setSelectedProvider(response.data.providers[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
      setError('Failed to load transport providers. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRoutes = async () => {
    try {
      setLoading(true);
      
      // API endpoint and params
      let endpoint = '/transport';
      let params = {
        ...filters,
        page: pagination.currentPage,
        limit: 9
      };
      
      // If a provider is selected, fetch only their routes
      if (selectedProvider) {
        endpoint = `/transport/provider/${selectedProvider}`;
      }
      
      // Convert sortBy filter to API sort parameter
      switch (filters.sortBy) {
        case 'newest':
          params.sort = '-createdAt';
          break;
        case 'oldest':
          params.sort = 'createdAt';
          break;
        case 'priceAsc':
          params.sort = 'fare';
          break;
        case 'priceDesc':
          params.sort = '-fare';
          break;
        default:
          params.sort = '-createdAt';
      }
      
      // Make API call
      const response = await http.get(endpoint, { params });
      
      if (response.data && response.data.success) {
        setRoutes(response.data.data || []);
        setPagination({
          currentPage: response.data.pagination?.currentPage || 1,
          totalPages: response.data.pagination?.totalPages || 1,
          total: response.data.pagination?.total || 0
        });
      } else {
        throw new Error(response.data?.message || 'Failed to load transport routes');
      }
    } catch (err) {
      console.error('Error fetching routes:', err);
      setError('Failed to load transport routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = async (formData) => {
    try {
      setLoading(true);
      
      // Create FormData object for file uploads
      const requestData = new FormData();
      
      // Add route data
      requestData.append('routeData', JSON.stringify(formData.routeData));
      
      // Add primary image index if specified
      if (formData.primaryImage !== undefined) {
        requestData.append('primaryImage', formData.primaryImage);
      }
      
      // Add images if provided
      if (formData.images && formData.images.length > 0) {
        formData.images.forEach(file => {
          requestData.append('images', file);
        });
      }
      
      // Submit the form data
      const response = await http.post('/transport', requestData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.success) {
        // Add to routes list
        setRoutes(prev => [response.data.data, ...prev]);
        setShowForm(false);
        
        // Refresh the list to get updated data
        await fetchRoutes();
      } else {
        throw new Error(response.data?.message || 'Failed to create transport route');
      }
      
      return response.data.data;
    } catch (err) {
      console.error('Error creating transport route:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoute = async (formData) => {
    if (!selectedRoute) return;
    
    try {
      setLoading(true);
      
      // Create FormData object for file uploads
      const requestData = new FormData();
      
      // Include keep images flag if needed
      if (formData.keepImages) {
        requestData.append('keepImages', formData.keepImages);
      }
      
      // Add route data
      requestData.append('routeData', JSON.stringify(formData.routeData));
      
      // Add primary image index if specified
      if (formData.primaryImage !== undefined) {
        requestData.append('primaryImage', formData.primaryImage);
      }
      
      // Add images if provided
      if (formData.images && formData.images.length > 0) {
        formData.images.forEach(file => {
          requestData.append('images', file);
        });
      }
      
      // Submit the form data
      const response = await http.put(`/transport/${selectedRoute._id}`, requestData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.success) {
        // Update in routes list
        setRoutes(prev => 
          prev.map(route => 
            route._id === selectedRoute._id ? response.data.data : route
          )
        );
        setShowForm(false);
        setSelectedRoute(null);
        
        // Refresh the list to get updated data
        await fetchRoutes();
      } else {
        throw new Error(response.data?.message || 'Failed to update transport route');
      }
      
      return response.data.data;
    } catch (err) {
      console.error('Error updating transport route:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async () => {
    if (!selectedRoute) return;
    
    try {
      setLoading(true);
      
      // Make API call
      const response = await http.delete(`/transport/${selectedRoute._id}`);
      
      if (response.data && response.data.success) {
        // Remove from routes list
        setRoutes(prev => prev.filter(route => route._id !== selectedRoute._id));
        setShowDeleteConfirmation(false);
        setSelectedRoute(null);
        
        // Refresh the list
        await fetchRoutes();
      } else {
        throw new Error(response.data?.message || 'Failed to delete transport route');
      }
    } catch (err) {
      console.error('Error deleting transport route:', err);
      setError('Failed to delete transport route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      setLoading(true);
      
      // Make API call
      const response = await http.patch(`/transport/${id}/status`, { status });
      
      if (response.data && response.data.success) {
        // Update in routes list
        setRoutes(prev => 
          prev.map(route => 
            route._id === id ? response.data.data : route
          )
        );
      } else {
        throw new Error(response.data?.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
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

  const handleProviderChange = (providerId) => {
    setSelectedProvider(providerId);
    
    // Reset pagination
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

  const handleRetry = () => {
    setError(null);
    fetchRoutes();
  };

  // Function to handle viewing details
  const handleViewDetails = (route) => {
    // You could navigate to a detailed view or just set selected route
    setSelectedRoute(route);
    setShowForm(true);
  };

  if (loading && routes.length === 0 && !error) {
    return <LoadingScreen />;
  }

  return (
    <div className="transport-route-manager">
      <div className="section-header">
        <h1>Transport Route Management</h1>
        <div className="action-buttons">
          <button 
            className="add-route-btn"
            onClick={() => {
              setSelectedRoute(null);
              setShowForm(true);
            }}
          >
            + Add New Transport Route
          </button>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="provider-selection">
        <label htmlFor="provider-select">Select Provider:</label>
        <select 
          id="provider-select" 
          value={selectedProvider || ''} 
          onChange={(e) => handleProviderChange(e.target.value)}
          className="provider-select"
        >
          <option value="">All Providers</option>
          {providers.map(provider => (
            <option key={provider._id} value={provider._id}>
              {provider.businessName}
            </option>
          ))}
        </select>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group search-group">
            <input 
              type="text"
              placeholder="Search routes..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
            <button 
              className="search-btn"
              onClick={() => fetchRoutes()}
            >
              Search
            </button>
          </div>

          <div className="filter-group">
            <select 
              value={filters.routeType}
              onChange={(e) => handleFilterChange('routeType', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Route Types</option>
              <option value="Bus">Bus</option>
              <option value="Taxi">Taxi</option>
              <option value="Shuttle">Shuttle</option>
              <option value="Train">Train</option>
              <option value="Ferry">Ferry</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select 
              value={filters.serviceType}
              onChange={(e) => handleFilterChange('serviceType', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Service Types</option>
              <option value="Regular">Regular</option>
              <option value="Express">Express</option>
              <option value="Premium">Premium</option>
              <option value="Executive">Executive</option>
              <option value="Economy">Economy</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="seasonal">Seasonal</option>
              <option value="suspended">Suspended</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select 
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="filter-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priceAsc">Fare: Low to High</option>
              <option value="priceDesc">Fare: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-message">
          {error}
          <button className="retry-button" onClick={handleRetry}>
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && routes.length > 0 && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      {/* No Routes State */}
      {!loading && routes.length === 0 ? (
        <div className="no-routes">
          <p>No transport routes found.</p>
          <button 
            className="add-route-btn small"
            onClick={() => {
              setSelectedRoute(null);
              setShowForm(true);
            }}
          >
            Add Your First Transport Route
          </button>
        </div>
      ) : (
        <>
          {/* Grid of Route Cards */}
          <div className="routes-grid">
            {routes.map(route => (
              <TransportRouteCard
                key={route._id}
                route={route}
                onEdit={() => {
                  setSelectedRoute(route);
                  setShowForm(true);
                }}
                onView={() => handleViewDetails(route)}
                onDelete={() => {
                  setSelectedRoute(route);
                  setShowDeleteConfirmation(true);
                }}
                onUpdateStatus={(status) => handleUpdateStatus(route._id, status)}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                className="page-button prev" 
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
                    className={`page-button number ${pagination.currentPage === pageToShow ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageToShow)}
                  >
                    {pageToShow}
                  </button>
                );
              })}
              
              <button 
                className="page-button next" 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Route Form Modal */}
      {showForm && (
        <TransportRouteForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedRoute(null);
          }}
          onSubmit={selectedRoute ? handleUpdateRoute : handleCreateRoute}
          initialData={selectedRoute}
          providers={providers}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && selectedRoute && (
        <Confirmation
          isOpen={showDeleteConfirmation}
          title="Delete Transport Route"
          message={`Are you sure you want to delete the route from ${selectedRoute.origin} to ${selectedRoute.destination}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonClass="delete-button"
          onConfirm={handleDeleteRoute}
          onCancel={() => {
            setShowDeleteConfirmation(false);
            setSelectedRoute(null);
          }}
        />
      )}
    </div>
  );
};

export default TransportRouteManager;