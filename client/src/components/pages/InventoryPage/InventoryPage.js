// src/components/pages/InventoryPage/InventoryPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, Grid, List, ChevronDown, X, RefreshCw, SlidersHorizontal } from 'lucide-react';
import InventoryCard from '../../shared/InventoryCard/InventoryCard.js';
import ShareModal from '../../shared/ShareModal.js';
import { http } from '../../../config/axios.js';
import './InventoryPage.css';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'oldest',     label: 'Oldest First' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'title_asc',  label: 'Name: A to Z' },
  { value: 'title_desc', label: 'Name: Z to A' },
  { value: 'views',      label: 'Most Popular' },
  { value: 'featured',   label: 'Featured First' },
];

const CATEGORIES = [
  { value: 'all',          label: 'All Categories' },
  { value: 'Parts',        label: 'Auto Parts' },
  { value: 'Accessories',  label: 'Accessories' },
  { value: 'Tools',        label: 'Tools' },
  { value: 'Electronics',  label: 'Electronics' },
  { value: 'Fluids',       label: 'Fluids & Oils' },
  { value: 'Apparel',      label: 'Apparel' },
  { value: 'Collectibles', label: 'Collectibles' },
  { value: 'Other',        label: 'Other' },
];

const CONDITIONS = [
  { value: 'all',         label: 'All Conditions' },
  { value: 'New',         label: 'New' },
  { value: 'Used',        label: 'Used' },
  { value: 'Refurbished', label: 'Refurbished' },
];

const DEFAULT_FILTERS = { category: 'all', condition: 'all', minPrice: '', maxPrice: '', inStock: false, featured: false };
const ITEMS_PER_PAGE = 12;

const InventoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filters, setFilters]           = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy]             = useState('newest');
  const [viewMode, setViewMode]         = useState('grid');
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalItems, setTotalItems]     = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [shareItem, setShareItem]       = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Sync from URL on load / URL change
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const newFilters = {
      category:  sp.get('category')  || 'all',
      condition: sp.get('condition') || 'all',
      minPrice:  sp.get('minPrice')  || '',
      maxPrice:  sp.get('maxPrice')  || '',
      inStock:   sp.get('inStock')   === 'true',
      featured:  sp.get('featured')  === 'true',
    };
    setSearchQuery(sp.get('search') || '');
    setFilters(newFilters);
    setSortBy(sp.get('sort') || 'newest');
    setViewMode(sp.get('view') || 'grid');
    const page = parseInt(sp.get('page')) || 1;
    setCurrentPage(page);
    fetchItems(newFilters, sp.get('search') || '', sp.get('sort') || 'newest', page);
  }, [location.search]);

  const fetchItems = useCallback(async (
    currentFilters = filters,
    currentSearch  = searchQuery,
    currentSort    = sortBy,
    page           = currentPage
  ) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), limit: String(ITEMS_PER_PAGE), sort: currentSort });
      if (currentSearch.trim()) params.append('search', currentSearch.trim());
      Object.entries(currentFilters).forEach(([k, v]) => {
        if (v && v !== 'all' && v !== '') params.append(k, String(v));
      });
      const res = await http.get(`/inventory?${params.toString()}`);
      if (res.data.success) {
        setItems(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalItems(res.data.pagination?.total || 0);
      } else {
        throw new Error(res.data.message || 'Failed to fetch items');
      }
    } catch (err) {
      setError(err.message || 'Failed to load inventory items');
      setItems([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, sortBy, currentPage]);

  const updateURL = useCallback((f, s, sort, page, view) => {
    const params = new URLSearchParams();
    if (s.trim()) params.append('search', s.trim());
    Object.entries(f).forEach(([k, v]) => { if (v && v !== 'all' && v !== '') params.append(k, String(v)); });
    if (sort !== 'newest') params.append('sort', sort);
    if (page !== 1) params.append('page', String(page));
    if (view !== 'grid') params.append('view', view);
    window.history.replaceState(null, '', `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`);
  }, [location.pathname]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setCurrentPage(1);
    updateURL(filters, searchQuery, sortBy, 1, viewMode);
    fetchItems(filters, searchQuery, sortBy, 1);
  }, [searchQuery, filters, sortBy, viewMode, updateURL, fetchItems]);

  const handleFilterChange = useCallback((key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    setCurrentPage(1);
    updateURL(next, searchQuery, sortBy, 1, viewMode);
    fetchItems(next, searchQuery, sortBy, 1);
  }, [filters, searchQuery, sortBy, viewMode, updateURL, fetchItems]);

  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
    updateURL(filters, searchQuery, newSort, 1, viewMode);
    fetchItems(filters, searchQuery, newSort, 1);
  }, [filters, searchQuery, viewMode, updateURL, fetchItems]);

  const handlePageChange = useCallback((page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    updateURL(filters, searchQuery, sortBy, page, viewMode);
    fetchItems(filters, searchQuery, sortBy, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, searchQuery, sortBy, viewMode, totalPages, updateURL, fetchItems]);

  const handleViewModeChange = useCallback((v) => {
    setViewMode(v);
    updateURL(filters, searchQuery, sortBy, currentPage, v);
  }, [filters, searchQuery, sortBy, currentPage, updateURL]);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
    setCurrentPage(1);
    setSortBy('newest');
    updateURL(DEFAULT_FILTERS, '', 'newest', 1, viewMode);
    fetchItems(DEFAULT_FILTERS, '', 'newest', 1);
  }, [viewMode, updateURL, fetchItems]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setTimeout(() => setRefreshing(false), 1000);
  }, [fetchItems]);

  const handleShare = useCallback((item) => { setShareItem(item); setShowShareModal(true); }, []);

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (filters.category !== 'all') n++;
    if (filters.condition !== 'all') n++;
    if (filters.minPrice) n++;
    if (filters.maxPrice) n++;
    if (filters.inStock)  n++;
    if (filters.featured) n++;
    if (searchQuery.trim()) n++;
    return n;
  }, [filters, searchQuery]);

  const paginationNumbers = useMemo(() => {
    const delta = 2;
    const range = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) range.push(i);
    const result = [];
    if (currentPage - delta > 2) result.push(1, '...');
    else result.push(1);
    result.push(...range);
    if (currentPage + delta < totalPages - 1) result.push('...', totalPages);
    else if (totalPages > 1) result.push(totalPages);
    return result;
  }, [currentPage, totalPages]);

  // Shared filter panel content (used in both sidebar and mobile drawer)
  const FilterContent = () => (
    <div className="ip-filter-content">
      {/* Search */}
      <div className="ip-filter-group">
        <label className="ip-filter-label">Search</label>
        <form onSubmit={handleSearch} className="ip-search-form">
          <div className="ip-search-wrap">
            <Search size={14} className="ip-search-icon" />
            <input
              type="text"
              placeholder="Search items…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="ip-filter-input ip-search-input"
            />
            {searchQuery && (
              <button type="button" className="ip-search-clear" onClick={() => setSearchQuery('')}>
                <X size={13} />
              </button>
            )}
          </div>
          <button type="submit" className="ip-search-btn">Search</button>
        </form>
      </div>

      {/* Category */}
      <div className="ip-filter-group">
        <label className="ip-filter-label">Category</label>
        <select value={filters.category} onChange={e => handleFilterChange('category', e.target.value)} className="ip-filter-select">
          {CATEGORIES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Condition */}
      <div className="ip-filter-group">
        <label className="ip-filter-label">Condition</label>
        <select value={filters.condition} onChange={e => handleFilterChange('condition', e.target.value)} className="ip-filter-select">
          {CONDITIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Price Range */}
      <div className="ip-filter-group">
        <label className="ip-filter-label">Price Range (BWP)</label>
        <div className="ip-price-row">
          <input type="number" placeholder="Min" value={filters.minPrice}
            onChange={e => handleFilterChange('minPrice', e.target.value)}
            className="ip-filter-input ip-price-input" min="0" />
          <span className="ip-price-sep">–</span>
          <input type="number" placeholder="Max" value={filters.maxPrice}
            onChange={e => handleFilterChange('maxPrice', e.target.value)}
            className="ip-filter-input ip-price-input" min="0" />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="ip-filter-group">
        <label className="ip-filter-label">Options</label>
        <label className="ip-checkbox">
          <input type="checkbox" checked={filters.inStock} onChange={e => handleFilterChange('inStock', e.target.checked)} />
          <span>In Stock Only</span>
        </label>
        <label className="ip-checkbox">
          <input type="checkbox" checked={filters.featured} onChange={e => handleFilterChange('featured', e.target.checked)} />
          <span>Featured Items</span>
        </label>
      </div>

      {activeFiltersCount > 0 && (
        <button className="ip-clear-btn" onClick={clearFilters}>
          <X size={12} /> Clear all filters ({activeFiltersCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="inventory-page">
      {/* ── Mobile top bar ── */}
      <div className="ip-mobile-bar">
        <span className="ip-mobile-count">
          {loading ? 'Loading…' : `${totalItems.toLocaleString()} items`}
        </span>
        <div className="ip-mobile-controls">
          <button
            className={`ip-filter-toggle ${showMobileFilters ? 'active' : ''}`}
            onClick={() => setShowMobileFilters(v => !v)}
          >
            <Filter size={15} />
            Filters
            {activeFiltersCount > 0 && <span className="ip-filter-badge">{activeFiltersCount}</span>}
            <ChevronDown size={13} className={showMobileFilters ? 'rotated' : ''} />
          </button>
          <div className="ip-view-toggle">
            <button className={`ip-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => handleViewModeChange('grid')}><Grid size={16} /></button>
            <button className={`ip-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => handleViewModeChange('list')}><List size={16} /></button>
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ── */}
      {showMobileFilters && (
        <div className="ip-mobile-drawer">
          <FilterContent />
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="ip-layout">
        {/* Desktop sidebar */}
        <aside className="ip-sidebar">
          <div className="ip-sidebar-head">
            <SlidersHorizontal size={14} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <button className="ip-sidebar-clear" onClick={clearFilters}>Clear all</button>
            )}
          </div>
          <FilterContent />
        </aside>

        {/* Content */}
        <div className="ip-main">
          {/* Top bar: count + view + sort + refresh */}
          <div className="ip-top-bar">
            <span className="ip-count-text">
              {loading ? 'Loading…'
                : error ? 'Error'
                : totalItems === 0 ? 'No items found'
                : `${((currentPage - 1) * ITEMS_PER_PAGE) + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of ${totalItems.toLocaleString()} items`
              }
            </span>
            <div className="ip-top-controls">
              <div className="ip-view-toggle desktop-only">
                <button className={`ip-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => handleViewModeChange('grid')}><Grid size={16} /></button>
                <button className={`ip-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => handleViewModeChange('list')}><List size={16} /></button>
              </div>
              <select value={sortBy} onChange={e => handleSortChange(e.target.value)} className="ip-sort-select">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button
                className={`ip-refresh-btn ${refreshing ? 'refreshing' : ''}`}
                onClick={handleRefresh}
                disabled={refreshing || loading}
                aria-label="Refresh"
              >
                <RefreshCw size={15} className={refreshing ? 'spinning' : ''} />
              </button>
            </div>
          </div>

          {/* Items */}
          {loading ? (
            <div className="ip-loading">
              <div className="ip-spinner" />
              <p>Loading inventory items…</p>
            </div>
          ) : error ? (
            <div className="ip-error">
              <h3>Failed to Load Items</h3>
              <p>{error}</p>
              <button className="ip-retry-btn" onClick={() => fetchItems()}>Try Again</button>
            </div>
          ) : items.length === 0 ? (
            <div className="ip-empty">
              <h3>No Items Found</h3>
              <p>Try adjusting your search criteria or filters</p>
              {activeFiltersCount > 0 && (
                <button className="ip-retry-btn" onClick={clearFilters}>Clear All Filters</button>
              )}
            </div>
          ) : (
            <div className={`ip-items ${viewMode}`}>
              {items.map(item => (
                <InventoryCard key={item._id || item.id} item={item} compact={viewMode === 'list'} onShare={handleShare} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="ip-pagination">
              <button className="ip-page-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                ← Previous
              </button>
              <div className="ip-page-numbers">
                {paginationNumbers.map((n, i) =>
                  n === '...' ? (
                    <span key={`d-${i}`} className="ip-page-dots">…</span>
                  ) : (
                    <button
                      key={n}
                      className={`ip-page-num ${currentPage === n ? 'active' : ''}`}
                      onClick={() => handlePageChange(n)}
                    >
                      {n}
                    </button>
                  )
                )}
              </div>
              <button className="ip-page-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {showShareModal && shareItem && (
        <ShareModal item={shareItem} onClose={() => { setShowShareModal(false); setShareItem(null); }} itemType="inventory" />
      )}
    </div>
  );
};

export default InventoryPage;
