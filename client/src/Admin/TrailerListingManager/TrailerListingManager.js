// src/components/admin/TrailerListingManager/TrailerListingManager.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { http } from '../../config/axios.js';
import './TrailerListingManager.css';
import TrailerListingForm from './TrailerListingForm.js';
import TrailerListingCard from './TrailerListingCard.js';
import Confirmation from '../../components/shared/Confirmation/Confirmation.js';
import LoadingScreen from '../../components/shared/LoadingScreen/LoadingScreen.js';

const TrailerListingManager = () => {
  const [trailers, setTrailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [filters, setFilters] = useState({
    trailerType: 'all',
    availability: 'all',
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
  
  // Fetch providers and trailers on component mount
  useEffect(() => {
    fetchProviders();
  }, []);
  
  useEffect(() => {
    fetchTrailers();
  }, [filters, selectedProvider, pagination.currentPage]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await http.get('/providers/all', {
        params: { type: 'trailer_rental' }
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
      setError('Failed to load trailer providers. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchTrailers = async () => {
    try {
      setLoading(true);
      
      // API endpoint and params
      let endpoint = '/trailers';
      let params = {
        ...filters,
        page: pagination.currentPage,
        limit: 9
      };
      
      // If a provider is selected, fetch only their trailers
      if (selectedProvider) {
        endpoint = `/trailers/provider/${selectedProvider}`;
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
          params.sort = 'rates.daily';
          break;
        case 'priceDesc':
          params.sort = '-rates.daily';
          break;
        default:
          params.sort = '-createdAt';
      }
      
      // Make API call
      const response = await http.get(endpoint, { params });
      
      if (response.data && response.data.success) {
        setTrailers(response.data.data || []);
        setPagination({
          currentPage: response.data.pagination?.currentPage || 1,
          totalPages: response.data.pagination?.totalPages || 1,
          total: response.data.pagination?.total || 0
        });
      } else {
        throw new Error(response.data?.message || 'Failed to load trailer listings');
      }
    } catch (err) {
      console.error('Error fetching trailers:', err);
      setError('Failed to load trailer listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrailer = async (formData) => {
    try {
      setLoading(true);
      
      // Create FormData object for file uploads
      const requestData = new FormData();
      
      // Add trailer data
      requestData.append('trailerData', JSON.stringify(formData.trailerData));
      
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
      const response = await http.post('/trailers', requestData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.success) {
        // Add to trailers list
        setTrailers(prev => [response.data.data, ...prev]);
        setShowForm(false);
        
        // Refresh the list to get updated data
        await fetchTrailers();
      } else {
        throw new Error(response.data?.message || 'Failed to create trailer listing');
      }
      
      return response.data.data;
    } catch (err) {
      console.error('Error creating trailer listing:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTrailer = async (formData) => {
    if (!selectedTrailer) return;
    
    try {
      setLoading(true);
      
      // Create FormData object for file uploads
      const requestData = new FormData();
      
      // Include keep images flag if needed
      if (formData.keepImages) {
        requestData.append('keepImages', formData.keepImages);
      }
      
      // Add trailer data
      requestData.append('trailerData', JSON.stringify(formData.trailerData));
      
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
      const response = await http.put(`/trailers/${selectedTrailer._id}`, requestData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.success) {
        // Update in trailers list
        setTrailers(prev => 
          prev.map(trailer => 
            trailer._id === selectedTrailer._id ? response.data.data : trailer
          )
        );
        setShowForm(false);
        setSelectedTrailer(null);
        
        // Refresh the list to get updated data
        await fetchTrailers();
      } else {
        throw new Error(response.data?.message || 'Failed to update trailer listing');
      }
      
      return response.data.data;
    } catch (err) {
      console.error('Error updating trailer listing:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrailer = async () => {
    if (!selectedTrailer) return;
    
    try {
      setLoading(true);
      
      // Make API call
      const response = await http.delete(`/trailers/${selectedTrailer._id}`);
      
      if (response.data && response.data.success) {
        // Remove from trailers list
        setTrailers(prev => prev.filter(trailer => trailer._id !== selectedTrailer._id));
        setShowDeleteConfirmation(false);
        setSelectedTrailer(null);
        
        // Refresh the list
        await fetchTrailers();
      } else {
        throw new Error(response.data?.message || 'Failed to delete trailer listing');
      }
    } catch (err) {
      console.error('Error deleting trailer listing:', err);
      setError('Failed to delete trailer listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      setLoading(true);
      
      // Make API call
      const response = await http.patch(`/trailers/${id}/status`, { status });
      
      if (response.data && response.data.success) {
        // Update in trailers list
        setTrailers(prev => 
          prev.map(trailer => 
            trailer._id === id ? response.data.data : trailer
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
    fetchTrailers();
  };

  // Function to handle viewing details
  const handleViewDetails = (trailer) => {
    // You could navigate to a detailed view or just set selected trailer
    setSelectedTrailer(trailer);
    setShowForm(true);
  };

  if (loading && trailers.length === 0 && !error) {
    return <LoadingScreen />;
  }

  return (
    <div className="trailer-listing-manager">
      <div className="section-header">
        <h1>Trailer Listing Management</h1>
        <div className="action-buttons">
          <button 
            className="add-trailer-btn"
            onClick={() => {
              setSelectedTrailer(null);
              setShowForm(true);
            }}
          >
            + Add New Trailer Listing
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
              placeholder="Search trailers..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
            <button 
              className="search-btn"
              onClick={() => fetchTrailers()}
            >
              Search
            </button>
          </div>

          <div className="filter-group">
            <select 
              value={filters.trailerType}
              onChange={(e) => handleFilterChange('trailerType', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="Utility">Utility</option>
              <option value="Car Carrier">Car Carrier</option>
              <option value="Enclosed">Enclosed</option>
              <option value="Flatbed">Flatbed</option>
              <option value="Dump">Dump</option>
              <option value="Boat">Boat</option>
              <option value="Horse">Horse</option>
              <option value="Livestock">Livestock</option>
              <option value="Travel">Travel</option>
              <option value="Toy Hauler">Toy Hauler</option>
              <option value="Equipment">Equipment</option>
              <option value="Heavy Duty">Heavy Duty</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select 
              value={filters.availability}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Availability</option>
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="unavailable">Unavailable</option>
              <option value="booked">Booked</option>
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
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
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
      {loading && trailers.length > 0 && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      {/* No Trailers State */}
      {!loading && trailers.length === 0 ? (
        <div className="no-trailers">
          <p>No trailer listings found.</p>
          <button 
            className="add-trailer-btn small"
            onClick={() => {
              setSelectedTrailer(null);
              setShowForm(true);
            }}
          >
            Add Your First Trailer Listing
          </button>
        </div>
      ) : (
        <>
          {/* Grid of Trailer Cards */}
          <div className="trailers-grid">
            {trailers.map(trailer => (
              <TrailerListingCard
                key={trailer._id}
                trailer={trailer}
                onEdit={() => {
                  setSelectedTrailer(trailer);
                  setShowForm(true);
                }}
                onView={() => handleViewDetails(trailer)}
                onDelete={() => {
                  setSelectedTrailer(trailer);
                  setShowDeleteConfirmation(true);
                }}
                onUpdateStatus={(status) => handleUpdateStatus(trailer._id, status)}
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

      {/* Trailer Form Modal */}
      {showForm && (
        <TrailerListingForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedTrailer(null);
          }}
          onSubmit={selectedTrailer ? handleUpdateTrailer : handleCreateTrailer}
          initialData={selectedTrailer}
          providers={providers}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && selectedTrailer && (
        <Confirmation
          isOpen={showDeleteConfirmation}
          title="Delete Trailer Listing"
          message={`Are you sure you want to delete ${selectedTrailer.title}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonClass="delete-button"
          onConfirm={handleDeleteTrailer}
          onCancel={() => {
            setShowDeleteConfirmation(false);
            setSelectedTrailer(null);
          }}
        />
      )}
    </div>
  );
};

export default TrailerListingManager;