// src/components/features/InventorySection/InventoryList.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SlidersHorizontal, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import InventoryCard from '../../shared/InventoryCard/InventoryCard.js';
import './InventoryList.css';

const DEFAULT_FILTERS = {
  search: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  condition: '',
  businessId: ''
};

const DEFAULT_CATEGORIES = ['Parts', 'Accessories', 'Apparel', 'Collectibles', 'Tools', 'Fluids', 'Electronics', 'Other'];

const InventoryList = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [filters, setFilters]               = useState(DEFAULT_FILTERS);
  const [pagination, setPagination]         = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [businesses, setBusinesses]         = useState([]);
  const [categories, setCategories]         = useState(DEFAULT_CATEGORIES);
  const [showFilters, setShowFilters]       = useState(false);

  // Sync filters from URL on mount / URL change
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    setFilters({
      search:     qp.get('search')     || '',
      category:   qp.get('category')   || '',
      minPrice:   qp.get('minPrice')   || '',
      maxPrice:   qp.get('maxPrice')   || '',
      condition:  qp.get('condition')  || '',
      businessId: qp.get('businessId') || ''
    });
    setPagination(prev => ({ ...prev, page: parseInt(qp.get('page')) || 1 }));
    loadBusinesses();
    loadCategories();
  }, [location.search]);

  useEffect(() => { loadInventoryItems(); }, [filters, pagination.page]);

  const loadBusinesses = async () => {
    try {
      const [prov, deal] = await Promise.all([
        axios.get('/api/providers', { params: { limit: 100 } }),
        axios.get('/api/dealers',   { params: { limit: 100 } })
      ]);
      const providers = (prov.data.success ? prov.data.data : []).map(p => ({ ...p, type: 'service' }));
      const dealers   = (deal.data.success ? deal.data.data : []).map(d => ({ ...d, type: 'dealer'  }));
      setBusinesses([...providers, ...dealers]);
    } catch {}
  };

  const loadCategories = async () => {
    try {
      const res = await axios.get('/api/inventory/categories');
      if (res.data?.success) setCategories(res.data.data);
    } catch {
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const loadInventoryItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (filters.search)     params.search     = filters.search;
      if (filters.category)   params.category   = filters.category;
      if (filters.minPrice)   params.minPrice   = filters.minPrice;
      if (filters.maxPrice)   params.maxPrice   = filters.maxPrice;
      if (filters.condition)  params.condition  = filters.condition;
      if (filters.businessId) params.businessId = filters.businessId;

      const res = await axios.get('/api/inventory', { params });
      if (res.data?.success) {
        setInventoryItems(res.data.data);
        setPagination(prev => ({
          ...prev,
          total:      res.data.pagination.total,
          totalPages: res.data.pagination.totalPages
        }));
      } else {
        setError('Failed to load inventory items');
        setInventoryItems([]);
      }
    } catch {
      setError('Error loading inventory items. Please try again.');
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const pushFilters = useCallback((nextFilters, page = 1) => {
    const qp = new URLSearchParams();
    Object.entries(nextFilters).forEach(([k, v]) => { if (v) qp.set(k, v); });
    qp.set('page', String(page));
    navigate(`${location.pathname}?${qp.toString()}`);
  }, [location.pathname, navigate]);

  const handleFilterChange = (name, value) => {
    const next = { ...filters, [name]: value };
    setFilters(next);
    setPagination(prev => ({ ...prev, page: 1 }));
    pushFilters(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    pushFilters(filters);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPagination(prev => ({ ...prev, page: 1 }));
    navigate(location.pathname);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    const qp = new URLSearchParams(location.search);
    qp.set('page', String(newPage));
    navigate(`${location.pathname}?${qp.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const getPaginationRange = () => {
    const { page, totalPages } = pagination;
    const range = [1];
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) range.push(i);
    if (totalPages > 1) range.push(totalPages);

    const result = [];
    let last = 0;
    for (const i of range) {
      if (last && i - last > 1) result.push('...');
      result.push(i);
      last = i;
    }
    return result;
  };

  const FilterPanel = () => (
    <form onSubmit={handleSearchSubmit} className="inv-filter-panel">
      <div className="inv-filter-section">
        <label className="inv-filter-label">Search</label>
        <div className="inv-search-wrap">
          <Search size={14} className="inv-search-icon" />
          <input
            type="text"
            value={filters.search}
            onChange={e => handleFilterChange('search', e.target.value)}
            placeholder="Search inventory…"
            className="inv-filter-input inv-search-input"
          />
        </div>
      </div>

      <div className="inv-filter-section">
        <label className="inv-filter-label">Category</label>
        <select
          value={filters.category}
          onChange={e => handleFilterChange('category', e.target.value)}
          className="inv-filter-select"
        >
          <option value="">All Categories</option>
          {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="inv-filter-section">
        <label className="inv-filter-label">Condition</label>
        <select
          value={filters.condition}
          onChange={e => handleFilterChange('condition', e.target.value)}
          className="inv-filter-select"
        >
          <option value="">All Conditions</option>
          <option value="New">New</option>
          <option value="Used">Used</option>
          <option value="Refurbished">Refurbished</option>
        </select>
      </div>

      <div className="inv-filter-section">
        <label className="inv-filter-label">Price Range (BWP)</label>
        <div className="inv-price-row">
          <input
            type="number"
            value={filters.minPrice}
            onChange={e => handleFilterChange('minPrice', e.target.value)}
            placeholder="Min"
            className="inv-filter-input inv-price-input"
            min="0"
          />
          <span className="inv-price-sep">–</span>
          <input
            type="number"
            value={filters.maxPrice}
            onChange={e => handleFilterChange('maxPrice', e.target.value)}
            placeholder="Max"
            className="inv-filter-input inv-price-input"
            min="0"
          />
        </div>
      </div>

      {businesses.length > 0 && (
        <div className="inv-filter-section">
          <label className="inv-filter-label">Business</label>
          <select
            value={filters.businessId}
            onChange={e => handleFilterChange('businessId', e.target.value)}
            className="inv-filter-select"
          >
            <option value="">All Businesses</option>
            {businesses.map(b => (
              <option key={b._id} value={b._id}>
                {b.businessName} ({b.type === 'dealer' ? 'Dealer' : 'Service'})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="inv-filter-actions">
        <button type="submit" className="inv-apply-btn">Apply Filters</button>
        {hasActiveFilters && (
          <button type="button" className="inv-clear-btn" onClick={handleClearFilters}>
            <X size={13} /> Clear
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="inv-list-container">
      {/* Mobile filter bar */}
      <div className="inv-mobile-bar">
        <span className="inv-mobile-count">
          {loading ? 'Loading…' : `${pagination.total} items`}
        </span>
        <button
          className={`inv-filter-toggle ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(v => !v)}
        >
          <SlidersHorizontal size={15} />
          Filters
          {hasActiveFilters && <span className="inv-filter-dot" />}
          {showFilters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="inv-mobile-filter-drawer">
          <FilterPanel />
        </div>
      )}

      <div className="inv-layout">
        {/* Desktop sidebar */}
        <aside className="inv-sidebar">
          <div className="inv-sidebar-title">
            <SlidersHorizontal size={15} />
            Filters
            {hasActiveFilters && (
              <button className="inv-sidebar-clear" onClick={handleClearFilters}>
                Clear all
              </button>
            )}
          </div>
          <FilterPanel />
        </aside>

        {/* Main content */}
        <div className="inv-main">
          {/* Results bar */}
          {!loading && !error && inventoryItems.length > 0 && (
            <div className="inv-results-bar">
              Showing {inventoryItems.length} of {pagination.total} items
            </div>
          )}

          {loading && inventoryItems.length === 0 ? (
            <div className="inv-loading">
              <div className="inv-loader" />
              <p>Loading inventory items…</p>
            </div>
          ) : error ? (
            <div className="inv-error">
              <p>{error}</p>
              <button onClick={loadInventoryItems} className="inv-retry-btn">Try Again</button>
            </div>
          ) : inventoryItems.length === 0 ? (
            <div className="inv-empty">
              <h3>No items found</h3>
              <p>Try adjusting your filters or check back later for new items.</p>
              {hasActiveFilters && (
                <button className="inv-retry-btn" onClick={handleClearFilters}>Clear Filters</button>
              )}
            </div>
          ) : (
            <>
              <div className="inv-grid">
                {inventoryItems.map(item => (
                  <div className="inv-grid-item" key={item._id}>
                    <InventoryCard item={item} />
                  </div>
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="inv-pagination">
                  <button
                    className="inv-page-btn"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    ← Previous
                  </button>

                  <div className="inv-page-numbers">
                    {getPaginationRange().map((page, i) =>
                      page === '...' ? (
                        <span key={`e-${i}`} className="inv-page-ellipsis">…</span>
                      ) : (
                        <button
                          key={page}
                          className={`inv-page-btn ${pagination.page === page ? 'active' : ''}`}
                          onClick={() => handlePageChange(page)}
                          disabled={pagination.page === page}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    className="inv-page-btn"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryList;
