// src/components/features/InventorySection/InventoryList.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import InventoryCard from '../../shared/InventoryCard/InventoryCard.js';
import './InventoryList.css';

const InventoryList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    condition: '',
    businessId: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1
  });
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);

  // Parse query parameters on load
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    
    const newFilters = {
      search: queryParams.get('search') || '',
      category: queryParams.get('category') || '',
      minPrice: queryParams.get('minPrice') || '',
      maxPrice: queryParams.get('maxPrice') || '',
      condition: queryParams.get('condition') || '',
      businessId: queryParams.get('businessId') || ''
    };
    
    const page = parseInt(queryParams.get('page')) || 1;
    
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page }));
    
    // Load businesses for filter dropdown
    loadBusinesses();
    
    // Load categories for filter dropdown
    loadCategories();
  }, [location.search]);

  // Load inventory items based on filters and pagination
  useEffect(() => {
    loadInventoryItems();
  }, [filters, pagination.page, pagination.limit]);

  // Load businesses
  const loadBusinesses = async () => {
    try {
      // Load service providers
      const providersResponse = await axios.get('/api/providers', {
        params: { limit: 100 }
      });
      
      // Load dealers
      const dealersResponse = await axios.get('/api/dealers', {
        params: { limit: 100 }
      });
      
      // Combine the results
      const providers = providersResponse.data.success ? providersResponse.data.data : [];
      const dealers = dealersResponse.data.success ? dealersResponse.data.data : [];
      
      // Add type indicator to each business
      const providersWithType = providers.map(p => ({ ...p, type: 'service' }));
      const dealersWithType = dealers.map(d => ({ ...d, type: 'dealer' }));
      
      // Combine and set businesses
      const allBusinesses = [...providersWithType, ...dealersWithType];
      setBusinesses(allBusinesses);
    } catch (error) {
      console.error('Error loading businesses:', error);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/inventory/categories');
      
      if (response.data && response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Set some default categories
      setCategories([
        'Parts',
        'Accessories',
        'Apparel',
        'Collectibles',
        'Tools',
        'Fluids',
        'Electronics',
        'Other'
      ]);
    }
  };

  // Load inventory items
  const loadInventoryItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      // Add filters if they are not empty
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.condition) params.condition = filters.condition;
      if (filters.businessId) params.businessId = filters.businessId;
      
      // Fetch inventory items
      const response = await axios.get('/api/inventory', { params });
      
      if (response.data && response.data.success) {
        setInventoryItems(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        }));
      } else {
        setError('Failed to load inventory items');
        setInventoryItems([]);
      }
    } catch (error) {
      console.error('Error loading inventory items:', error);
      setError('Error loading inventory items. Please try again.');
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Update URL query parameters
    const queryParams = new URLSearchParams(location.search);
    
    if (value) {
      queryParams.set(name, value);
    } else {
      queryParams.delete(name);
    }
    
    queryParams.set('page', '1');
    
    navigate(`${location.pathname}?${queryParams.toString()}`);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    
    // Update URL query parameter
    const queryParams = new URLSearchParams(location.search);
    queryParams.set('page', newPage.toString());
    
    navigate(`${location.pathname}?${queryParams.toString()}`);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Update URL query parameters
    const queryParams = new URLSearchParams(location.search);
    
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        queryParams.set(key, value);
      } else {
        queryParams.delete(key);
      }
    }
    
    queryParams.set('page', '1');
    
    navigate(`${location.pathname}?${queryParams.toString()}`);
  };

  // Handle share
  const handleShare = (item) => {
    // Implement item sharing functionality
    console.log('Share item:', item);
  };

  // Generate pagination range
  const getPaginationRange = () => {
    const range = [];
    const { page, totalPages } = pagination;
    
    // Always show first page
    range.push(1);
    
    // Show current page and surrounding pages
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      range.push(i);
    }
    
    // Always show last page if there are more than 1 page
    if (totalPages > 1) {
      range.push(totalPages);
    }
    
    // Add ellipses
    const result = [];
    let lastAdded = 0;
    
    for (const i of range) {
      if (lastAdded && i - lastAdded > 1) {
        result.push('...');
      }
      result.push(i);
      lastAdded = i;
    }
    
    return result;
  };

  return (
    <div className="inventory-list-container">
      <div className="inventory-list-header">
        <h1>Browse Inventory</h1>
        <p>Find parts, accessories, and more from our trusted businesses</p>
      </div>
      
      <div className="inventory-filter-container">
        <form onSubmit={handleSearchSubmit} className="inventory-filters">
          <div className="filter-row">
            <div className="filter-item search-filter">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search inventory..."
                className="filter-input"
              />
            </div>
            
            <div className="filter-item">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-item">
              <select
                value={filters.condition}
                onChange={(e) => handleFilterChange('condition', e.target.value)}
                className="filter-select"
              >
                <option value="">All Conditions</option>
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Refurbished">Refurbished</option>
              </select>
            </div>
            
            <div className="filter-item filter-submit">
              <button type="submit" className="search-button">Search</button>
            </div>
          </div>
          
          <div className="filter-row advanced-filters">
            <div className="filter-item price-filter">
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="Min Price"
                className="filter-input price-input"
                min="0"
              />
              <span className="price-separator">to</span>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="Max Price"
                className="filter-input price-input"
                min="0"
              />
            </div>
            
            <div className="filter-item">
              <select
                value={filters.businessId}
                onChange={(e) => handleFilterChange('businessId', e.target.value)}
                className="filter-select"
              >
                <option value="">All Businesses</option>
                {businesses.map((business) => (
                  <option key={business._id} value={business._id}>
                    {business.businessName} ({business.type === 'dealer' ? 'Dealer' : 'Service'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </div>
      
      {loading && inventoryItems.length === 0 ? (
        <div className="inventory-loading">
          <div className="loader"></div>
          <p>Loading inventory items...</p>
        </div>
      ) : error ? (
        <div className="inventory-error">
          <p>{error}</p>
          <button onClick={loadInventoryItems} className="retry-button">
            Try Again
          </button>
        </div>
      ) : inventoryItems.length === 0 ? (
        <div className="inventory-empty">
          <h2>No inventory items found</h2>
          <p>Try adjusting your filters or check back later for new items.</p>
        </div>
      ) : (
        <>
          <div className="inventory-results-count">
            Showing {inventoryItems.length} of {pagination.total} items
          </div>
          
          <div className="inventory-grid">
            {inventoryItems.map((item) => (
              <div className="inventory-grid-item" key={item._id}>
                <InventoryCard 
                  item={item} 
                  onShare={handleShare}
                />
              </div>
            ))}
          </div>
          
          {pagination.totalPages > 1 && (
            <div className="inventory-pagination">
              <button
                className="pagination-button prev"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
              
              {getPaginationRange().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                ) : (
                  <button
                    key={page}
                    className={`pagination-button ${pagination.page === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              ))}
              
              <button
                className="pagination-button next"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InventoryList;
