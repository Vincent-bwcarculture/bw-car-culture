// src/components/admin/DealershipManager/DealershipManager.js - Updated for Private Sellers
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import DealershipForm from './DealershipForm.js';
import './DealershipManager.css';
import { useNavigate } from 'react-router-dom';
import { dealerService } from './../../services/dealerService.js';
import { http } from '../../config/axios.js';

const DealershipManager = () => {
  // Add at the beginning of the DealershipManager component
  const checkFailedImage = (url, type = 'logo') => {
    try {
      const failedImages = JSON.parse(localStorage.getItem(`failedDealership${type.charAt(0).toUpperCase() + type.slice(1)}s`) || '{}');
      return !!failedImages[url];
    } catch (e) {
      return false;
    }
  };

  const markFailedImage = (url, type = 'logo') => {
    try {
      const storageKey = `failedDealership${type.charAt(0).toUpperCase() + type.slice(1)}s`;
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

  const [sellers, setSellers] = useState([]); // Renamed from dealers to sellers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null); // Renamed from selectedDealer
  const [filters, setFilters] = useState({
    status: 'all',
    subscriptionStatus: 'all',
    businessType: 'all',
    sellerType: 'all', // NEW: Filter by seller type
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

  useEffect(() => {
    fetchSellers();
  }, [filters, pagination.currentPage]);

  // Enhanced fetchSellers function with seller type support
  const fetchSellers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Convert sortBy filter to API sort parameter
      let sort;
      switch (filters.sortBy) {
        case 'newest':
          sort = '-createdAt';
          break;
        case 'oldest':
          sort = 'createdAt';
          break;
        case 'businessName':
          sort = 'businessName';
          break;
        case 'subscriptionExpiry':
          sort = 'subscription.expiresAt';
          break;
        default:
          sort = '-createdAt';
      }

      const apiFilters = {
        ...filters,
        sort
      };
      
      // Use dealer service to fetch sellers (dealers/private sellers)
      const result = await dealerService.getDealers(apiFilters, pagination.currentPage);
      
      // Process seller data to ensure consistent image handling
      const processedSellers = result.dealers ? result.dealers.map(seller => {
        // Process logo if it exists
        if (seller.profile && seller.profile.logo) {
          // If logo is a string, check for S3 URL patterns
          if (typeof seller.profile.logo === 'string') {
            // Fix any problematic S3 URLs with duplicate paths
            if (seller.profile.logo.includes('/images/images/')) {
              seller.profile.logo = seller.profile.logo.replace(/\/images\/images\//g, '/images/');
            }
          }
          // If logo is an object but missing url property, add it from key
          else if (typeof seller.profile.logo === 'object' && !seller.profile.logo.url && seller.profile.logo.key) {
            seller.profile.logo.url = `/api/images/s3-proxy/${seller.profile.logo.key}`;
          }
        }
        
        // Process banner if it exists
        if (seller.profile && seller.profile.banner) {
          // If banner is a string, check for S3 URL patterns
          if (typeof seller.profile.banner === 'string') {
            // Fix any problematic S3 URLs with duplicate paths
            if (seller.profile.banner.includes('/images/images/')) {
              seller.profile.banner = seller.profile.banner.replace(/\/images\/images\//g, '/images/');
            }
          }
          // If banner is an object but missing url property, add it from key
          else if (typeof seller.profile.banner === 'object' && !seller.profile.banner.url && seller.profile.banner.key) {
            seller.profile.banner.url = `/api/images/s3-proxy/${seller.profile.banner.key}`;
          }
        }
        
        return seller;
      }) : [];
      
      setSellers(processedSellers);
      setPagination({
        currentPage: result.pagination?.currentPage || 1,
        totalPages: result.pagination?.totalPages || 1,
        total: result.pagination?.total || 0
      });
    } catch (error) {
      console.error('Error fetching sellers:', error);
      setError('Failed to load sellers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Updated image URL helper for both seller types
  const getSellerImageUrl = (imageData, type = 'logo') => {
    try {
      if (!imageData) {
        return `/images/placeholders/dealer-${type}.jpg`;
      }
      
      // If imageData is a string, use it directly
      if (typeof imageData === 'string') {
        // Check for cached failed images
        if (checkFailedImage(imageData, type)) {
          return `/images/placeholders/dealer-${type}.jpg`;
        }
        
        // If it's an S3 URL, use it directly
        if (imageData.includes('amazonaws.com')) {
          return imageData;
        }
        
        // Fix problematic S3 URLs with duplicate paths
        if (imageData.includes('/images/images/')) {
          return imageData.replace(/\/images\/images\//g, '/images/');
        }
        
        // For local paths, ensure they start with a slash
        return imageData.startsWith('/') ? imageData : `/${imageData}`;
      }
      
      // If imageData is an object with url property
      if (imageData && typeof imageData === 'object') {
        const imageUrl = imageData.url || '';
        
        // If we have an S3 key but no URL, use key with uploads path
        if (!imageUrl && imageData.key) {
          return `/uploads/dealers/${imageData.key}`;
        }
        
        if (imageUrl) {
          // Check for cached failed images
          if (checkFailedImage(imageUrl, type)) {
            return `/images/placeholders/dealer-${type}.jpg`;
          }
          
          // Ensure URL is properly formatted
          return imageUrl;
        }
      }
      
      // Fallback
      return `/images/placeholders/dealer-${type}.jpg`;
    } catch (error) {
      console.error(`Error getting seller ${type} URL:`, error);
      return `/images/placeholders/dealer-${type}.jpg`;
    }
  };

  // NEW: Get seller display name
  const getSellerDisplayName = (seller) => {
    if (seller.sellerType === 'private') {
      if (seller.privateSeller && seller.privateSeller.firstName && seller.privateSeller.lastName) {
        return `${seller.privateSeller.firstName} ${seller.privateSeller.lastName}`;
      }
    }
    return seller.businessName || 'Unknown Seller';
  };

  // NEW: Get seller type badge
  const getSellerTypeBadge = (seller) => {
    if (seller.sellerType === 'private') {
      return <span className="seller-type-badge private">Private Seller</span>;
    } else {
      return <span className="seller-type-badge dealership">Dealership</span>;
    }
  };

  const handleCreateSeller = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const newSeller = await dealerService.createDealer(formData);
      setSellers(prev => [newSeller, ...prev]);
      setShowForm(false);
      return newSeller;
    } catch (error) {
      console.error('Error creating seller:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSeller = async (formData) => {
    if (!selectedSeller) return;

    try {
      setLoading(true);
      setError(null);

      const updatedSeller = await dealerService.updateDealer(selectedSeller._id, formData);
      
      // Update seller in the list
      setSellers(prev => 
        prev.map(seller => 
          seller._id === selectedSeller._id ? updatedSeller : seller
        )
      );
      setShowForm(false);
      setSelectedSeller(null);
      return updatedSeller;
    } catch (error) {
      console.error('Error updating seller:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSeller = async (id) => {
    const seller = sellers.find(s => s._id === id);
    const sellerTypeText = seller?.sellerType === 'private' ? 'private seller' : 'dealership';
    
    if (!window.confirm(`Are you sure you want to delete this ${sellerTypeText} profile? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await dealerService.deleteDealer(id);
      
      // Remove seller from the list
      setSellers(prev => prev.filter(seller => seller._id !== id));
    } catch (error) {
      console.error('Error deleting seller:', error);
      setError(`Failed to delete ${sellerTypeText}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (id, subscriptionData) => {
    try {
      setLoading(true);
      setError(null);

      const updatedSeller = await dealerService.updateSubscription(id, subscriptionData);
      
      // Update seller in the list
      setSellers(prev => 
        prev.map(seller => 
          seller._id === id ? updatedSeller : seller
        )
      );
      return updatedSeller;
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError('Failed to update subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySeller = async (id) => {
    try {
      setLoading(true);
      setError(null);

      const updatedSeller = await dealerService.verifyDealer(id);
      
      // Update seller in the list
      setSellers(prev => 
        prev.map(seller => 
          seller._id === id ? updatedSeller : seller
        )
      );
      return updatedSeller;
    } catch (error) {
      console.error('Error verifying seller:', error);
      setError('Failed to verify seller. Please try again.');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    
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

  const renderSubscriptionBadge = (subscription) => {
    if (!subscription) {
      return <span className="badge badge-inactive">No Plan</span>;
    }

    const { status, tier } = subscription;
    
    if (status === 'active') {
      return <span className="badge badge-active">{tier}</span>;
    } else if (status === 'expired') {
      return <span className="badge badge-expired">{tier} (Expired)</span>;
    } else if (status === 'pending') {
      return <span className="badge badge-pending">{tier} (Pending)</span>;
    } else if (status === 'cancelled') {
      return <span className="badge badge-cancelled">{tier} (Cancelled)</span>;
    }
    
    return <span className="badge badge-inactive">{tier || 'Unknown'}</span>;
  };
  
  const handleRetry = () => {
    setError(null);
    fetchSellers();
  };

  return (
    <div className="dealership-manager-container">
      <div className="dealership-header">
        <h1>Seller Management</h1>
        <p className="header-subtitle">Manage dealerships and private sellers</p>
        <div className="dealership-actions">
          <button 
            className="add-dealer-btn"
            onClick={() => {
              setSelectedSeller(null);
              setShowForm(true);
            }}
          >
            + Add New Seller
          </button>
        </div>
      </div>

      <div className="dealership-filters">
        <div className="filter-group">
          <input 
            type="text"
            placeholder="Search sellers..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>
        
        {/* NEW: Seller Type Filter */}
        <div className="filter-group">
          <select 
            value={filters.sellerType}
            onChange={(e) => handleFilterChange('sellerType', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Seller Types</option>
            <option value="dealership">Dealerships</option>
            <option value="private">Private Sellers</option>
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
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        <div className="filter-group">
          <select 
            value={filters.subscriptionStatus}
            onChange={(e) => handleFilterChange('subscriptionStatus', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Subscriptions</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        <div className="filter-group">
          <select 
            value={filters.businessType}
            onChange={(e) => handleFilterChange('businessType', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="independent">Independent</option>
            <option value="franchise">Franchise</option>
            <option value="certified">Certified</option>
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
            <option value="businessName">Name</option>
            <option value="subscriptionExpiry">Subscription Expiry</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button className="retry-button" onClick={handleRetry}>
            Try Again
          </button>
        </div>
      )}

      {loading && sellers.length === 0 ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : sellers.length === 0 ? (
        <div className="no-dealers">
          <p>No sellers found.</p>
          <button 
            className="add-dealer-btn small"
            onClick={() => {
              setSelectedSeller(null);
              setShowForm(true);
            }}
          >
            Add Your First Seller
          </button>
        </div>
      ) : (
        <div className="dealers-table-container">
          <table className="dealers-table">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Type</th>
                <th>Business Type</th>
                <th>Location</th>
                <th>Subscription</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map(seller => (
                <tr key={seller._id || Math.random().toString()}>
                  <td className="dealer-cell">
                    <div className="dealer-info">
                      {seller.profile && seller.profile.logo ? (
                        <div className="dealer-logo">
                          <img 
                            src={getSellerImageUrl(seller.profile.logo, 'logo')} 
                            alt={getSellerDisplayName(seller)} 
                            onError={(e) => {
                              const originalSrc = e.target.src;
                              console.error(`Seller logo failed to load: ${originalSrc}`);
                              
                              // Mark this image as failed
                              markFailedImage(originalSrc, 'logo');
                              
                              // For S3 URLs, try direct access without any proxy
                              if (originalSrc.includes('amazonaws.com')) {
                                return; // Already using S3 URL, let default error handling take over
                              }
                              
                              // Try local path as fallback if not already a placeholder
                              if (!originalSrc.includes('/images/placeholders/')) {
                                const filename = originalSrc.split('/').pop();
                                if (filename) {
                                  e.target.src = `/uploads/dealers/${filename}`;
                                  return;
                                }
                              }
                              
                              // Final fallback to placeholder
                              e.target.onerror = null; // Prevent infinite loop
                              e.target.src = '/images/placeholders/dealer-logo.jpg';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="dealer-logo placeholder">
                          {getSellerDisplayName(seller).charAt(0)}
                        </div>
                      )}
                      <div className="dealer-details">
                        <span className="dealer-name">{getSellerDisplayName(seller)}</span>
                        <span className="dealer-email">{seller.contact?.email || 'No email'}</span>
                        {seller.sellerType === 'private' && seller.privateSeller && (
                          <span className="private-seller-info">
                            Contact: {seller.privateSeller.preferredContactMethod}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {getSellerTypeBadge(seller)}
                  </td>
                  <td>
                    {seller.sellerType === 'dealership' ? (
                      <span className="business-type">{seller.businessType || 'Unknown'}</span>
                    ) : (
                      <span className="business-type private">Individual</span>
                    )}
                  </td>
                  <td>
                    {seller.location ? (
                      <span className="dealer-location">
                        {seller.location.city || 'N/A'}
                        {seller.location.country ? `, ${seller.location.country}` : ''}
                      </span>
                    ) : (
                      <span className="no-data">No location</span>
                    )}
                  </td>
                  <td>
                    {renderSubscriptionBadge(seller.subscription)}
                    {seller.subscription?.expiresAt && (
                      <div className="expiry-date">
                        Expires: {formatDate(seller.subscription.expiresAt)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${seller.status || 'inactive'}`}>
                      {seller.status || 'inactive'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn edit"
                      onClick={() => {
                        setSelectedSeller(seller);
                        setShowForm(true);
                      }}
                      title={`Edit ${seller.sellerType === 'private' ? 'private seller' : 'dealership'}`}
                    >
                      ✎
                    </button>
                    <button 
                      className="action-btn view"
                      onClick={() => navigate(`/dealerships/${seller._id}`)}
                      title={`View ${seller.sellerType === 'private' ? 'private seller' : 'dealership'}`}
                    >
                      👁
                    </button>
                    {seller.verification?.status !== 'verified' && (
                      <button 
                        className="action-btn verify"
                        onClick={() => handleVerifySeller(seller._id)}
                        title={`Verify ${seller.sellerType === 'private' ? 'private seller' : 'dealership'}`}
                      >
                        ✓
                      </button>
                    )}
                    <button 
                      className="action-btn subscription"
                      onClick={() => {
                        setSelectedSeller(seller);
                        // Open subscription modal (implement this separately)
                        // For now, we'll use a simple prompt
                        const validTiers = ['basic', 'standard', 'premium'];
                        const plan = prompt('Enter subscription plan (basic, standard, premium):', seller.subscription?.tier || 'basic');
                        if (plan && !validTiers.includes(plan.toLowerCase())) {
                          alert(`Invalid plan. Must be one of: ${validTiers.join(', ')}`);
                          return;
                        }
                        const status = prompt('Enter subscription status (active, expired, pending, cancelled):', seller.subscription?.status || 'active');
                        const expiresAt = prompt('Enter expiry date (YYYY-MM-DD):', 
                          seller.subscription?.expiresAt ? 
                            new Date(seller.subscription.expiresAt).toISOString().split('T')[0] : 
                            new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
                        );
                        
                        if (plan && status) {
                          handleUpdateSubscription(seller._id, {
                            tier: plan.toLowerCase(),
                            status,
                            expiresAt: expiresAt || undefined
                          });
                        }
                      }}
                      title="Update subscription"
                    >
                      $
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteSeller(seller._id)}
                      title={`Delete ${seller.sellerType === 'private' ? 'private seller' : 'dealership'}`}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

      {showForm && (
        <DealershipForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedSeller(null);
          }}
          onSubmit={selectedSeller ? handleUpdateSeller : handleCreateSeller}
          initialData={selectedSeller}
        />
      )}
    </div>
  );
};

export default DealershipManager;