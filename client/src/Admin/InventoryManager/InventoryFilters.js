// src/components/admin/InventoryManager/InventoryFilters.js
import React, { useState, useEffect } from 'react';
import './InventoryFilters.css';

const InventoryFilters = ({
  filters,
  businesses,
  selectedBusiness,
  onFilterChange,
  onBusinessChange,
  isAdmin
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  // Categories for filtering
  const categories = [
    'Parts',
    'Accessories',
    'Apparel',
    'Collectibles',
    'Tools',
    'Fluids',
    'Electronics',
    'Other'
  ];
  
  // Conditions for filtering
  const conditions = [
    'New',
    'Used',
    'Refurbished'
  ];
  
  // Statuses for filtering
  const statuses = [
    'active',
    'inactive',
    'pending',
    'all'
  ];
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleBusinessChange = (e) => {
    const businessId = e.target.value;
    onBusinessChange(businessId);
  };
  
  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };
  
  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      condition: '',
      minPrice: '',
      maxPrice: '',
      status: 'active'
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className={`inventory-filters ${isExpanded ? 'expanded' : ''}`}>
      <div className="inventory-filters-basic">
        {/* Business selector (only for admins) */}
        {isAdmin && businesses.length > 0 && (
          <div className="inventory-filter-group business-selector">
            <label htmlFor="business-select">Business:</label>
            <select
              id="business-select"
              value={selectedBusiness}
              onChange={handleBusinessChange}
              className="inventory-filter-select"
            >
              <option value="">All Businesses</option>
              {businesses.map(business => (
                <option key={business._id} value={business._id}>
                  {business.businessName} ({business.type === 'dealer' ? 'Dealer' : 'Service'})
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Quick search */}
        <div className="inventory-filter-group search-field">
          <input
            type="text"
            name="search"
            value={localFilters.search}
            onChange={handleInputChange}
            placeholder="Search inventory..."
            className="inventory-filter-input"
          />
          <button 
            className="inventory-filter-search-button" 
            onClick={handleApplyFilters}
          >
            Search
          </button>
        </div>
        
        {/* Expand/collapse button */}
        <button 
          className="inventory-filter-expand-button"
          onClick={toggleExpand}
        >
          {isExpanded ? 'Less Filters' : 'More Filters'}
        </button>
      </div>
      
      {/* Advanced filters (shown when expanded) */}
      {isExpanded && (
        <div className="inventory-filters-advanced">
          <div className="inventory-filters-row">
            {/* Category filter */}
            <div className="inventory-filter-group">
              <label htmlFor="category-select">Category:</label>
              <select
                id="category-select"
                name="category"
                value={localFilters.category}
                onChange={handleInputChange}
                className="inventory-filter-select"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Condition filter */}
            <div className="inventory-filter-group">
              <label htmlFor="condition-select">Condition:</label>
              <select
                id="condition-select"
                name="condition"
                value={localFilters.condition}
                onChange={handleInputChange}
                className="inventory-filter-select"
              >
                <option value="">All Conditions</option>
                {conditions.map(condition => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Status filter */}
            <div className="inventory-filter-group">
              <label htmlFor="status-select">Status:</label>
              <select
                id="status-select"
                name="status"
                value={localFilters.status}
                onChange={handleInputChange}
                className="inventory-filter-select"
              >
                {statuses.map(status => (
                  <option key={status} value={status === 'all' ? '' : status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="inventory-filters-row">
            {/* Price range filters */}
            <div className="inventory-filter-group price-range">
              <label>Price Range:</label>
              <div className="price-inputs">
                <input
                  type="number"
                  name="minPrice"
                  value={localFilters.minPrice}
                  onChange={handleInputChange}
                  placeholder="Min Price"
                  className="inventory-filter-input"
                  min="0"
                />
                <span className="price-separator">to</span>
                <input
                  type="number"
                  name="maxPrice"
                  value={localFilters.maxPrice}
                  onChange={handleInputChange}
                  placeholder="Max Price"
                  className="inventory-filter-input"
                  min="0"
                />
              </div>
            </div>
            
            {/* Filter action buttons */}
            <div className="inventory-filter-actions">
              <button 
                className="inventory-filter-apply-button"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </button>
              <button 
                className="inventory-filter-clear-button"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryFilters;