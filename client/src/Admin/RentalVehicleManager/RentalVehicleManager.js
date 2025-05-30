// src/components/admin/RentalVehicleManager/RentalVehicleManager.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { http } from '../../config/axios.js';
import './RentalVehicleManager.css';
import RentalVehicleForm from './RentalVehicleForm.js';
import RentalVehicleCard from './RentalVehicleCard.js';
import Confirmation from '../../components/shared/Confirmation/Confirmation.js';
import LoadingScreen from '../../components/shared/LoadingScreen/LoadingScreen.js';

const RentalVehicleManager = () => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
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
  
  // Fetch providers and rentals on component mount
  useEffect(() => {
    fetchProviders();
  }, []);
  
  useEffect(() => {
    fetchRentals();
  }, [filters, selectedProvider, pagination.currentPage]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await http.get('/providers/all', {
        params: { type: 'car_rental' }
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
      setError('Failed to load rental providers. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
const fetchRentals = async () => {
  try {
    setLoading(true);
    
    // API endpoint and params
    let endpoint = '/rentals';
    let params = {
      ...filters,
      page: pagination.currentPage,
      limit: 9
    };
    
    // If a provider is selected, fetch only their rentals
    if (selectedProvider) {
      endpoint = `/rentals/provider/${selectedProvider}`;
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
      // Process rentals to ensure S3 image consistency
      const processedRentals = response.data.data.map(rental => {
        // Ensure images array is properly formatted
        if (rental.images) {
          // Fix any inconsistencies in image data
          const processedImages = rental.images.map(img => {
            // If image is a string, convert to object format
            if (typeof img === 'string') {
              return {
                url: img,
                isPrimary: false
              };
            }
            
            // If image is already an object, ensure required properties
            if (!img.url && img.key) {
              img.url = `/api/images/s3-proxy/${img.key}`;
            }
            
            return img;
          });
          
          // Ensure at least one image is marked as primary
          if (!processedImages.some(img => img.isPrimary) && processedImages.length > 0) {
            processedImages[0].isPrimary = true;
          }
          
          rental.images = processedImages;
        }
        
        return rental;
      });
      
      setRentals(processedRentals || []);
      setPagination({
        currentPage: response.data.pagination?.currentPage || 1,
        totalPages: response.data.pagination?.totalPages || 1,
        total: response.data.pagination?.total || 0
      });
    } else {
      throw new Error(response.data?.message || 'Failed to load rental vehicles');
    }
  } catch (err) {
    console.error('Error fetching rentals:', err);
    setError('Failed to load rental vehicles. Please try again.');
  } finally {
    setLoading(false);
  }
};

const handleCreateRental = async (formData) => {
  try {
    setLoading(true);
    
    // Check if formData is already a FormData object, if not, create one
    let requestData;
    if (formData instanceof FormData) {
      requestData = formData;
    } else {
      // Create FormData object for file uploads
      requestData = new FormData();
      
      // Add vehicle data
      requestData.append('vehicleData', JSON.stringify(formData.vehicleData));
      
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
    }
    
    // Log for debugging
    console.log('Creating rental with the following data structure:');
    for (let pair of requestData.entries()) {
      if (pair[0] === 'images') {
        console.log(`${pair[0]}: File - ${pair[1].name}, ${pair[1].type}, ${pair[1].size} bytes`);
      } else {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
    }
    
    // Submit the form data
    const response = await http.post('/rentals', requestData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data && response.data.success) {
      // Add to rentals list
      setRentals(prev => [response.data.data, ...prev]);
      setShowForm(false);
      
      // Refresh the list to get updated data
      await fetchRentals();
    } else {
      throw new Error(response.data?.message || 'Failed to create rental vehicle');
    }
    
    return response.data.data;
  } catch (err) {
    console.error('Error creating rental vehicle:', err);
    throw err;
  } finally {
    setLoading(false);
  }
};

  const handleUpdateRental = async (formData) => {
    if (!selectedRental) return;
    
    try {
      setLoading(true);
      
      // Create FormData object for file uploads
      const requestData = new FormData();
      
      // Include keep images flag if needed
      if (formData.keepImages) {
        requestData.append('keepImages', formData.keepImages);
      }
      
      // Add vehicle data
      requestData.append('vehicleData', JSON.stringify(formData.vehicleData));
      
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
      const response = await http.put(`/rentals/${selectedRental._id}`, requestData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.success) {
        // Update in rentals list
        setRentals(prev => 
          prev.map(rental => 
            rental._id === selectedRental._id ? response.data.data : rental
          )
        );
        setShowForm(false);
        setSelectedRental(null);
        
        // Refresh the list to get updated data
        await fetchRentals();
      } else {
        throw new Error(response.data?.message || 'Failed to update rental vehicle');
      }
      
      return response.data.data;
    } catch (err) {
      console.error('Error updating rental vehicle:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRental = async () => {
    if (!selectedRental) return;
    
    try {
      setLoading(true);
      
      // Make API call
      const response = await http.delete(`/rentals/${selectedRental._id}`);
      
      if (response.data && response.data.success) {
        // Remove from rentals list
        setRentals(prev => prev.filter(rental => rental._id !== selectedRental._id));
        setShowDeleteConfirmation(false);
        setSelectedRental(null);
        
        // Refresh the list
        await fetchRentals();
      } else {
        throw new Error(response.data?.message || 'Failed to delete rental vehicle');
      }
    } catch (err) {
      console.error('Error deleting rental vehicle:', err);
      setError('Failed to delete rental vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      setLoading(true);
      
      // Make API call
      const response = await http.patch(`/rentals/${id}/status`, { status });
      
      if (response.data && response.data.success) {
        // Update in rentals list
        setRentals(prev => 
          prev.map(rental => 
            rental._id === id ? response.data.data : rental
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
    fetchRentals();
  };

  // Function to handle viewing details
  const handleViewDetails = (rental) => {
    // You could navigate to a detailed view or just set selected rental
    setSelectedRental(rental);
    setShowForm(true);
  };

  if (loading && rentals.length === 0 && !error) {
    return <LoadingScreen />;
  }

  return (
    <div className="rental-vehicle-manager">
      <div className="section-header">
        <h1>Rental Vehicle Management</h1>
        <div className="action-buttons">
          <button 
            className="add-rental-btn"
            onClick={() => {
              setSelectedRental(null);
              setShowForm(true);
            }}
          >
            + Add New Rental Vehicle
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
              placeholder="Search rentals..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
            <button 
              className="search-btn"
              onClick={() => fetchRentals()}
            >
              Search
            </button>
          </div>

          <div className="filter-group">
            <select 
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Sports Car">Sports Car</option>
              <option value="Luxury">Luxury</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Truck">Truck</option>
              <option value="Van">Van</option>
              <option value="Wagon">Wagon</option>
              <option value="Convertible">Convertible</option>
              <option value="Compact">Compact</option>
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
      {loading && rentals.length > 0 && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      {/* No Rentals State */}
      {!loading && rentals.length === 0 ? (
        <div className="no-rentals">
          <p>No rental vehicles found.</p>
          <button 
            className="add-rental-btn small"
            onClick={() => {
              setSelectedRental(null);
              setShowForm(true);
            }}
          >
            Add Your First Rental Vehicle
          </button>
        </div>
      ) : (
        <>
          {/* Grid of Rental Cards */}
          <div className="rentals-grid">
            {rentals.map(rental => (
              <RentalVehicleCard
                key={rental._id}
                rental={rental}
                onEdit={() => {
                  setSelectedRental(rental);
                  setShowForm(true);
                }}
                onView={() => handleViewDetails(rental)}
                onDelete={() => {
                  setSelectedRental(rental);
                  setShowDeleteConfirmation(true);
                }}
                onUpdateStatus={(status) => handleUpdateStatus(rental._id, status)}
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

      {/* Rental Form Modal */}
      {showForm && (
        <RentalVehicleForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedRental(null);
          }}
          onSubmit={selectedRental ? handleUpdateRental : handleCreateRental}
          initialData={selectedRental}
          providers={providers}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && selectedRental && (
        <Confirmation
          isOpen={showDeleteConfirmation}
          title="Delete Rental Vehicle"
          message={`Are you sure you want to delete ${selectedRental.name}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonClass="delete-button"
          onConfirm={handleDeleteRental}
          onCancel={() => {
            setShowDeleteConfirmation(false);
            setSelectedRental(null);
          }}
        />
      )}
    </div>
  );
};

export default RentalVehicleManager;