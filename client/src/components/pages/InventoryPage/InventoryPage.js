// src/components/pages/InventoryPage/InventoryPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, Grid, List, ChevronDown, X, RefreshCw } from 'lucide-react';
import InventoryCard from '../../shared/InventoryCard/InventoryCard.js';
import ShareModal from '../../shared/ShareModal.js';
import { http } from '../../../config/axios.js';
import './InventoryPage.css';

const InventoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    condition: 'all',
    minPrice: '',
    maxPrice: '',
    inStock: false,
    featured: false
  });
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [shareItem, setShareItem] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter options
  const filterOptions = useMemo(() => ({
    categories: [
      { value: 'all', label: 'All Categories' },
      { value: 'Parts', label: 'Auto Parts' },
      { value: 'Accessories', label: 'Accessories' },
      { value: 'Tools', label: 'Tools' },
      { value: 'Electronics', label: 'Electronics' },
      { value: 'Fluids', label: 'Fluids & Oils' },
      { value: 'Apparel', label: 'Apparel' },
      { value: 'Collectibles', label: 'Collectibles' },
      { value: 'Other', label: 'Other' }
    ],
    conditions: [
      { value: 'all', label: 'All Conditions' },
      { value: 'New', label: 'New' },
      { value: 'Used', label: 'Used' },
      { value: 'Refurbished', label: 'Refurbished' }
    ],
    sortOptions: [
      { value: 'newest', label: 'Newest First' },
      { value: 'oldest', label: 'Oldest First' },
      { value: 'price_asc', label: 'Price: Low to High' },
      { value: 'price_desc', label: 'Price: High to Low' },
      { value: 'title_asc', label: 'Name: A to Z' },
      { value: 'title_desc', label: 'Name: Z to A' },
      { value: 'views', label: 'Most Popular' },
      { value: 'featured', label: 'Featured First' }
    ]
  }), []);

  const itemsPerPage = 12;

  // Initialize from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // Set search query
    const search = searchParams.get('search') || '';
    setSearchQuery(search);
    
    // Set filters
    const newFilters = {
      category: searchParams.get('category') || 'all',
      condition: searchParams.get('condition') || 'all',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      inStock: searchParams.get('inStock') === 'true',
      featured: searchParams.get('featured') === 'true'
    };
    setFilters(newFilters);
    
    // Set sort and page
    setSortBy(searchParams.get('sort') || 'newest');
    setCurrentPage(parseInt(searchParams.get('page')) || 1);
    setViewMode(searchParams.get('view') || 'grid');
    
    // Fetch data
    fetchItems(newFilters, search, searchParams.get('sort') || 'newest', parseInt(searchParams.get('page')) || 1);
  }, [location.search]);

  // Fetch inventory items
  const fetchItems = useCallback(async (
    currentFilters = filters, 
    currentSearch = searchQuery, 
    currentSort = sortBy, 
    page = currentPage
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        sort: currentSort
      });
      
      // Add search
      if (currentSearch.trim()) {
        params.append('search', currentSearch.trim());
      }
      
      // Add filters
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      // Make API request
      const response = await http.get(`/inventory?${params.toString()}`);
      
      if (response.data.success) {
        setItems(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalItems(response.data.pagination?.total || 0);
      } else {
        throw new Error(response.data.message || 'Failed to fetch items');
      }
      
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      setError(error.message || 'Failed to load inventory items');
      setItems([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, sortBy, currentPage]);

  // Update URL parameters
  const updateURL = useCallback((newFilters, newSearch, newSort, newPage, newView) => {
    const params = new URLSearchParams();
    
    // Add search
    if (newSearch.trim()) {
      params.append('search', newSearch.trim());
    }
    
    // Add filters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    // Add sort, page, and view
    if (newSort !== 'newest') params.append('sort', newSort);
    if (newPage !== 1) params.append('page', newPage.toString());
    if (newView !== 'grid') params.append('view', newView);
    
    // Update URL without causing navigation
    const newUrl = `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [location.pathname]);

  // Handle search
  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const newPage = 1;
    
    setCurrentPage(newPage);
    updateURL(filters, searchQuery, sortBy, newPage, viewMode);
    fetchItems(filters, searchQuery, sortBy, newPage);
  }, [searchQuery, filters, sortBy, viewMode, updateURL, fetchItems]);

  // Handle filter change
  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...filters, [key]: value };
    const newPage = 1;
    
    setFilters(newFilters);
    setCurrentPage(newPage);
    updateURL(newFilters, searchQuery, sortBy, newPage, viewMode);
    fetchItems(newFilters, searchQuery, sortBy, newPage);
  }, [filters, searchQuery, sortBy, viewMode, updateURL, fetchItems]);

  // Handle sort change
  const handleSortChange = useCallback((newSort) => {
    const newPage = 1;
    
    setSortBy(newSort);
    setCurrentPage(newPage);
    updateURL(filters, searchQuery, newSort, newPage, viewMode);
    fetchItems(filters, searchQuery, newSort, newPage);
  }, [filters, searchQuery, viewMode, updateURL, fetchItems]);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    setCurrentPage(newPage);
    updateURL(filters, searchQuery, sortBy, newPage, viewMode);
    fetchItems(filters, searchQuery, sortBy, newPage);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, searchQuery, sortBy, viewMode, totalPages, updateURL, fetchItems]);

  // Handle view mode change
  const handleViewModeChange = useCallback((newView) => {
    setViewMode(newView);
    updateURL(filters, searchQuery, sortBy, currentPage, newView);
  }, [filters, searchQuery, sortBy, currentPage, updateURL]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    const newFilters = {
      category: 'all',
      condition: 'all',
      minPrice: '',
      maxPrice: '',
      inStock: false,
      featured: false
    };
    const newPage = 1;
    
    setFilters(newFilters);
    setSearchQuery('');
    setCurrentPage(newPage);
    setSortBy('newest');
    
    updateURL(newFilters, '', 'newest', newPage, viewMode);
    fetchItems(newFilters, '', 'newest', newPage);
  }, [viewMode, updateURL, fetchItems]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setTimeout(() => setRefreshing(false), 1000);
  }, [fetchItems]);

  // Handle share
  const handleShare = useCallback((item) => {
    setShareItem(item);
    setShowShareModal(true);
  }, []);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'all') count++;
    if (filters.condition !== 'all') count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.inStock) count++;
    if (filters.featured) count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [filters, searchQuery]);

  // Generate pagination numbers
  const paginationNumbers = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  return (
    <div className="inventory-page">
      {/* Hero Section */}
      <div className="inventory-hero">
        <div className="inventory-hero-content">
          <h1 className="inventory-hero-title">
            Auto Parts & Accessories
          </h1>
          <p className="inventory-hero-subtitle">
            Find quality parts and accessories from trusted sellers across Botswana
          </p>
          <div className="inventory-hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-number">{totalItems.toLocaleString()}</span>
              <span className="hero-stat-label">Items Available</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">{items.filter(item => item.featured).length}</span>
              <span className="hero-stat-label">Featured</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">{items.filter(item => item.condition === 'New').length}</span>
              <span className="hero-stat-label">New Items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="inventory-controls">
        <div className="inventory-controls-container">
          {/* Search */}
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-container">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search parts, brands, models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="search-clear"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button type="submit" className="search-button">
              Search
            </button>
          </form>

          {/* Controls Row */}
          <div className="controls-row">
            {/* Filter Toggle */}
            <button 
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="filter-count">{activeFiltersCount}</span>
              )}
              <ChevronDown 
                size={16} 
                className={`filter-chevron ${showFilters ? 'rotated' : ''}`} 
              />
            </button>

            {/* View Mode Toggle */}
            <div className="view-mode-toggle">
              <button
                className={`view-mode-button ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('grid')}
                aria-label="Grid view"
              >
                <Grid size={18} />
              </button>
              <button
                className={`view-mode-button ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('list')}
                aria-label="List view"
              >
                <List size={18} />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="sort-dropdown">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="sort-select"
              >
                {filterOptions.sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button 
              className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
              onClick={handleRefresh}
              disabled={refreshing || loading}
              aria-label="Refresh items"
            >
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
            </button>
          </div>
        </div>

        {/* Expandable Filters */}
        <div className={`filters-panel ${showFilters ? 'visible' : ''}`}>
          <div className="filters-container">
            {/* Category Filter */}
            <div className="filter-group">
              <label htmlFor="category-filter" className="filter-label">Category</label>
              <select
                id="category-filter"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                {filterOptions.categories.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Filter */}
            <div className="filter-group">
              <label htmlFor="condition-filter" className="filter-label">Condition</label>
              <select
                id="condition-filter"
                value={filters.condition}
                onChange={(e) => handleFilterChange('condition', e.target.value)}
                className="filter-select"
              >
                {filterOptions.conditions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="filter-group price-range-group">
              <label className="filter-label">Price Range (BWP)</label>
              <div className="price-range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="price-input"
                  min="0"
                />
                <span className="price-separator">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="price-input"
                  min="0"
                />
              </div>
            </div>

            {/* Checkbox Filters */}
            <div className="filter-group checkbox-group">
              <label className="checkbox-filter">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                />
                <span className="checkbox-label">In Stock Only</span>
              </label>
              <label className="checkbox-filter">
                <input
                  type="checkbox"
                  checked={filters.featured}
                  onChange={(e) => handleFilterChange('featured', e.target.checked)}
                />
                <span className="checkbox-label">Featured Items</span>
              </label>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <button className="clear-filters-button" onClick={clearFilters}>
                Clear All Filters ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <div className="results-info-container">
          <p className="results-count">
            {loading ? 'Loading...' : 
             error ? 'Error loading items' :
             totalItems === 0 ? 'No items found' :
             `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems.toLocaleString()} items`
            }
          </p>
          {!loading && !error && totalItems > 0 && (
            <p className="results-page">
              Page {currentPage} of {totalPages}
            </p>
          )}
        </div>
      </div>

      {/* Items Grid/List */}
      <div className="inventory-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading inventory items...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h3>Failed to Load Items</h3>
            <p>{error}</p>
            <button className="retry-button" onClick={() => fetchItems()}>
              Try Again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="no-results-container">
            <h3>No Items Found</h3>
            <p>Try adjusting your search criteria or filters</p>
            {activeFiltersCount > 0 && (
              <button className="clear-filters-button" onClick={clearFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className={`items-container ${viewMode}`}>
            {items.map((item) => (
              <InventoryCard
                key={item._id || item.id}
                item={item}
                compact={viewMode === 'list'}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination">
            <button
              className="pagination-button prev"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              Previous
            </button>

            <div className="pagination-numbers">
              {paginationNumbers.map((pageNum, index) => (
                <React.Fragment key={index}>
                  {pageNum === '...' ? (
                    <span className="pagination-dots">...</span>
                  ) : (
                    <button
                      className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                      aria-label={`Go to page ${pageNum}`}
                      aria-current={currentPage === pageNum ? 'page' : undefined}
                    >
                      {pageNum}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            <button
              className="pagination-button next"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && shareItem && (
        <ShareModal
          item={shareItem}
          onClose={() => {
            setShowShareModal(false);
            setShareItem(null);
          }}
          itemType="inventory"
        />
      )}
    </div>
  );
};

export default InventoryPage;
