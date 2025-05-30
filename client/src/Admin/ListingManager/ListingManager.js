// src/components/admin/ListingManager/ListingManager.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { listingService } from '../../services/listingService.js';
import AddListingModal from '../../components/shared/AddListingModal/AddListingModal.js';
import UpdateListingModal from './UpdateListingModal.js';
import './ListingManager.css';

const ListingManager = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    condition: 'all',
    dealer: 'all',
    hasSavings: 'all',
    search: '',
    sortBy: 'newest'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 12
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchListings();
  }, [filters, pagination.currentPage]);

  // Helper function to check failed images and mark them
  const checkFailedImage = (url) => {
    try {
      const failedImages = JSON.parse(localStorage.getItem('failedListingImages') || '{}');
      return !!failedImages[url];
    } catch (e) {
      return false;
    }
  };

  const markFailedImage = (url) => {
    try {
      const failedImages = JSON.parse(localStorage.getItem('failedListingImages') || '{}');
      failedImages[url] = Date.now();
      
      // Limit cache size
      const keys = Object.keys(failedImages);
      if (keys.length > 100) {
        const oldestKey = keys.sort((a, b) => failedImages[a] - failedImages[b])[0];
        delete failedImages[oldestKey];
      }
      
      localStorage.setItem('failedListingImages', JSON.stringify(failedImages));
    } catch (e) {
      // Ignore localStorage errors
    }
  };

  const getListingImageUrl = (listing) => {
    try {
      if (!listing || !listing.images || !Array.isArray(listing.images) || listing.images.length === 0) {
        return '/images/placeholders/car.jpg';
      }

      // Find primary image or use first image
      const primaryImage = listing.images.find(img => img.isPrimary) || listing.images[0];
      let imageUrl = '';

      if (typeof primaryImage === 'string') {
        imageUrl = primaryImage;
      } else if (primaryImage && typeof primaryImage === 'object') {
        imageUrl = primaryImage.url || '';
        
        if (!imageUrl && primaryImage.key) {
          return `/api/images/s3-proxy/${primaryImage.key}`;
        }
      }

      if (!imageUrl) {
        return '/images/placeholders/car.jpg';
      }

      // Check for cached failed images
      if (checkFailedImage(imageUrl)) {
        return '/images/placeholders/car.jpg';
      }

      // Clean up problematic URLs
      if (imageUrl.includes('/images/images/')) {
        imageUrl = imageUrl.replace(/\/images\/images\//g, '/images/');
      }

      // Handle fully-formed URLs (including S3 URLs)
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }

      // Handle relative paths
      if (!imageUrl.startsWith('/')) {
        imageUrl = `/${imageUrl}`;
      }

      return imageUrl;
    } catch (error) {
      console.error('Error getting listing image URL:', error);
      return '/images/placeholders/car.jpg';
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare filters for API
      const apiFilters = { ...filters };
      
      // Remove 'all' values
      Object.keys(apiFilters).forEach(key => {
        if (apiFilters[key] === 'all') {
          delete apiFilters[key];
        }
      });

      // Handle savings filter
      if (filters.hasSavings === 'true') {
        apiFilters.hasSavings = true;
        delete apiFilters.hasSavings;
      } else if (filters.hasSavings === 'false') {
        apiFilters.hasSavings = false;
        delete apiFilters.hasSavings;
      }

      const result = await listingService.getListings(
        apiFilters,
        pagination.currentPage,
        pagination.limit
      );

      setListings(result.listings || []);
      setPagination(prev => ({
        ...prev,
        total: result.total || 0,
        totalPages: result.totalPages || 1,
        currentPage: result.currentPage || 1
      }));
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddListing = async (listingData) => {
    try {
      setLoading(true);
      
      // Use listingService to create the listing
      const result = await listingService.createListing(
        listingData, 
        listingData.images || [],
        (progress) => console.log('Upload progress:', progress)
      );

      if (result && result.success) {
        // Refresh listings
        await fetchListings();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error; // Re-throw to let modal handle the error
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateListing = async (listingData) => {
    if (!selectedListing) return;

    try {
      setLoading(true);
      
      const result = await listingService.updateListing(
        selectedListing._id,
        listingData,
        listingData.newImages || [],
        (progress) => console.log('Update progress:', progress)
      );

      if (result && result.success) {
        // Refresh listings
        await fetchListings();
        setShowUpdateModal(false);
        setSelectedListing(null);
      }
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error; // Re-throw to let modal handle the error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await listingService.deleteListing(id);
      
      // Remove listing from the list
      setListings(prev => prev.filter(listing => listing._id !== id));
    } catch (error) {
      console.error('Error deleting listing:', error);
      setError('Failed to delete listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      setLoading(true);
      setError(null);

      await listingService.toggleFeatured(id);
      
      // Update listing in the list
      setListings(prev => prev.map(listing => 
        listing._id === id 
          ? { ...listing, featured: !listing.featured }
          : listing
      ));
    } catch (error) {
      console.error('Error toggling featured status:', error);
      setError('Failed to update featured status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setLoading(true);
      setError(null);

      await listingService.updateListingStatus(id, newStatus);
      
      // Update listing in the list
      setListings(prev => prev.map(listing => 
        listing._id === id 
          ? { ...listing, status: newStatus }
          : listing
      ));
    } catch (error) {
      console.error('Error updating status:', error);
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

  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  const formatPrice = (price, priceOptions) => {
    if (priceOptions?.showPriceAsPOA) {
      return 'POA';
    }
    return `P ${(price || 0).toLocaleString()}`;
  };

  const formatSavings = (priceOptions) => {
    if (!priceOptions?.showSavings || !priceOptions?.savingsAmount) {
      return null;
    }
    
    return (
      <div className="savings-info">
        <span className="savings-amount">
          Save P{priceOptions.savingsAmount.toLocaleString()}
        </span>
        {priceOptions.exclusiveDeal && (
          <span className="exclusive-badge">Exclusive</span>
        )}
      </div>
    );
  };

  const renderStatusBadge = (status) => {
    return (
      <span className={`status-badge ${status}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="listing-manager-container">
      <div className="listing-header">
        <h1>Listing Management</h1>
        <div className="listing-actions">
          <button 
            className="add-listing-btn"
            onClick={() => setShowAddModal(true)}
          >
            + Add New Listing
          </button>
        </div>
      </div>

      <div className="listing-filters">
        <div className="filter-group">
          <input 
            type="text"
            placeholder="Search listings..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select 
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="sold">Sold</option>
            <option value="archived">Archived</option>
          </select>
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
            <option value="Convertible">Convertible</option>
          </select>
        </div>
        
        <div className="filter-group">
          <select 
            value={filters.condition}
            onChange={(e) => handleFilterChange('condition', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Conditions</option>
            <option value="new">New</option>
            <option value="used">Used</option>
            <option value="certified">Certified</option>
          </select>
        </div>

        <div className="filter-group">
          <select 
            value={filters.hasSavings}
            onChange={(e) => handleFilterChange('hasSavings', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Deals</option>
            <option value="true">With Savings</option>
            <option value="false">No Savings</option>
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
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="views">Most Viewed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button className="retry-button" onClick={fetchListings}>
            Try Again
          </button>
        </div>
      )}

      {loading && listings.length === 0 ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : listings.length === 0 ? (
        <div className="no-listings">
          <p>No listings found.</p>
          <button 
            className="add-listing-btn small"
            onClick={() => setShowAddModal(true)}
          >
            Add Your First Listing
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="listings-mobile-view">
            {listings.map(listing => (
              <div key={listing._id} className="listing-mobile-card">
                <div className="listing-card-image">
                  <img 
                    src={getListingImageUrl(listing)} 
                    alt={listing.title} 
                    onError={(e) => {
                      const originalSrc = e.target.src;
                      markFailedImage(originalSrc);
                      
                      if (originalSrc.includes('amazonaws.com')) {
                        const key = originalSrc.split('.amazonaws.com/').pop();
                        if (key) {
                          const normalizedKey = key.replace(/images\/images\//g, 'images/');
                          e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
                          return;
                        }
                      }
                      
                      if (!originalSrc.includes('/images/placeholders/')) {
                        const filename = originalSrc.split('/').pop();
                        if (filename) {
                          e.target.src = `/uploads/listings/${filename}`;
                          return;
                        }
                      }
                      
                      e.target.src = '/images/placeholders/car.jpg';
                    }}
                  />
                  {listing.featured && <div className="featured-badge">Featured</div>}
                </div>
                
                <div className="listing-card-content">
                  <div className="listing-card-header">
                    <h3 className="listing-title">{listing.title}</h3>
                    <div className="listing-price">
                      {formatPrice(listing.price, listing.priceOptions)}
                      {formatSavings(listing.priceOptions)}
                    </div>
                  </div>
                  
                  <div className="listing-details">
                    <span className="listing-category">{listing.category}</span>
                    <span className="listing-condition">{listing.condition}</span>
                    {renderStatusBadge(listing.status)}
                  </div>
                  
                  <div className="listing-stats">
                    <span>👁 {listing.views || 0}</span>
                    <span>❤ {listing.saves || 0}</span>
                    <span>📅 {formatDate(listing.createdAt)}</span>
                  </div>
                  
                  <div className="listing-actions">
                    <button 
                      className="action-btn edit"
                      onClick={() => {
                        setSelectedListing(listing);
                        setShowUpdateModal(true);
                      }}
                      title="Edit listing"
                    >
                      Edit
                    </button>
                    <button 
                      className="action-btn featured"
                      onClick={() => handleToggleFeatured(listing._id)}
                      title={listing.featured ? "Remove from featured" : "Make featured"}
                    >
                      {listing.featured ? "Unfeature" : "Feature"}
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteListing(listing._id)}
                      title="Delete listing"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="listings-table-container">
            <table className="listings-table">
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Stats</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(listing => (
                  <tr key={listing._id}>
                    <td className="listing-cell">
                      <div className="listing-info">
                        <div className="listing-image">
                          <img 
                            src={getListingImageUrl(listing)} 
                            alt={listing.title} 
                            onError={(e) => {
                              const originalSrc = e.target.src;
                              markFailedImage(originalSrc);
                              
                              if (originalSrc.includes('amazonaws.com')) {
                                const key = originalSrc.split('.amazonaws.com/').pop();
                                if (key) {
                                  const normalizedKey = key.replace(/images\/images\//g, 'images/');
                                  e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
                                  return;
                                }
                              }
                              
                              if (!originalSrc.includes('/images/placeholders/')) {
                                const filename = originalSrc.split('/').pop();
                                if (filename) {
                                  e.target.src = `/uploads/listings/${filename}`;
                                  return;
                                }
                              }
                              
                              e.target.src = '/images/placeholders/car.jpg';
                            }}
                          />
                          {listing.featured && <div className="featured-badge">★</div>}
                        </div>
                        <div className="listing-details">
                          <span className="listing-title">{listing.title}</span>
                          <span className="listing-specs">
                            {listing.specifications?.year} • {listing.specifications?.make} {listing.specifications?.model}
                          </span>
                          {formatSavings(listing.priceOptions)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">{listing.category}</span>
                      <div className="condition-info">{listing.condition}</div>
                    </td>
                    <td>
                      <div className="price-info">
                        {formatPrice(listing.price, listing.priceOptions)}
                        {listing.priceOptions?.monthlyPayment && (
                          <div className="monthly-payment">
                            P{listing.priceOptions.monthlyPayment} p/m
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      {renderStatusBadge(listing.status)}
                    </td>
                    <td>
                      <div className="listing-stats">
                        <div>👁 {listing.views || 0}</div>
                        <div>❤ {listing.saves || 0}</div>
                        <div>📞 {listing.inquiries || 0}</div>
                      </div>
                    </td>
                    <td>
                      <div className="date-info">{formatDate(listing.createdAt)}</div>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="action-btn edit"
                        onClick={() => {
                          setSelectedListing(listing);
                          setShowUpdateModal(true);
                        }}
                        title="Edit listing"
                      >
                        ✎
                      </button>
                      <button 
                        className="action-btn view"
                        onClick={() => window.open(`/marketplace/${listing._id}`, '_blank')}
                        title="View listing"
                      >
                        👁
                      </button>
                      <button 
                        className={`action-btn featured ${listing.featured ? 'active' : ''}`}
                        onClick={() => handleToggleFeatured(listing._id)}
                        title={listing.featured ? "Remove from featured" : "Make featured"}
                      >
                        ★
                      </button>
                      <button 
                        className="action-btn status"
                        onClick={() => {
                          const newStatus = prompt('Enter new status (active, draft, sold, archived):', listing.status);
                          if (newStatus && ['active', 'draft', 'sold', 'archived'].includes(newStatus)) {
                            handleStatusChange(listing._id, newStatus);
                          }
                        }}
                        title="Change status"
                      >
                        🔄
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteListing(listing._id)}
                        title="Delete listing"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

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
                className={`page-number ${pagination.currentPage === pageToShow ? 'active' : ''}`}
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

      {/* Modals */}
      {showAddModal && (
        <AddListingModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddListing}
        />
      )}

      {showUpdateModal && selectedListing && (
        <UpdateListingModal
          isOpen={showUpdateModal}
          onClose={() => {
            setShowUpdateModal(false);
            setSelectedListing(null);
          }}
          onSubmit={handleUpdateListing}
          initialData={selectedListing}
        />
      )}
    </div>
  );
};

export default ListingManager;
