// src/components/features/CarFilters/CarFilter.js
import React, { useState, useEffect, useCallback } from 'react';
import { listingService } from '../../../services/listingService.js';
import './CarFilter.css';

// Default price ranges if API doesn't provide them
const DEFAULT_PRICE_RANGES = [
  { label: 'All Prices', min: 0, max: null },
  { label: 'Under P10,000', min: 0, max: 10000 },
  { label: 'P10,000 - P20,000', min: 10000, max: 20000 },
  { label: 'P20,000 - P30,000', min: 20000, max: 30000 },
  { label: 'P30,000 - P50,000', min: 30000, max: 50000 },
  { label: 'P50,000 - P100,000', min: 50000, max: 100000 },
  { label: 'Over P100,000', min: 100000, max: null }
];

const CarFilter = ({ onFilterChange, onSearchPerformed, onToggleFilter }) => {
  // State for filter options from API - initialize all arrays
  const [filterOptions, setFilterOptions] = useState({
    makes: [],
    models: [],
    years: [],
    conditions: [],
    fuelTypes: [],
    transmissions: [],
    vehicleTypes: [],
    priceRanges: DEFAULT_PRICE_RANGES
  });

  // State for current filter selections
  const [filters, setFilters] = useState({
    searchKeyword: '',
    make: '',
    model: '',
    yearRange: '',
    priceRange: '',
    fuelType: '',
    transmission: '',
    vehicleType: '',
    conditionType: ''
  });

  // State for UI state
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch filter options from the API on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get filter options from service
        let options;
        try {
          options = await listingService.getFilterOptions();
        } catch (err) {
          console.error("Error fetching filter options:", err);
          throw new Error('Failed to load filter options');
        }
        
        // Handle server errors
        if (!options) {
          throw new Error('Failed to load filter options');
        }
        
        // Use the default price ranges if none are returned from the API
        const priceRanges = options.priceRanges || DEFAULT_PRICE_RANGES;
        
        // Ensure all properties are arrays
        setFilterOptions({
          makes: options.makes || [],
          years: options.years || [],
          conditions: options.conditions || [],
          fuelTypes: options.fuelTypes || [],
          transmissions: options.transmissionTypes || [],
          vehicleTypes: options.bodyStyles || [],
          models: [],  // Models start empty until a make is selected
          priceRanges: priceRanges
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching filter options:', error);
        setError('Failed to load filter options. Please refresh the page.');
        setLoading(false);
      }
    };
    
    fetchFilterOptions();
  }, []);

  // Fetch models when make changes
  const fetchModels = useCallback(async (make) => {
    if (!make) {
      setFilterOptions(prev => ({ ...prev, models: [] }));
      return;
    }
    
    try {
      console.log(`Attempting to fetch models for make: ${make}`);
      // Try to fetch models from the API
      const models = await listingService.getModelsByMake(make);
      console.log(`Received ${models?.length || 0} models from API`);
      
      if (models && models.length > 0) {
        setFilterOptions(prev => ({ ...prev, models: models }));
      } else {
        console.warn(`API returned no models for make: ${make}, using fallback data`);
        // Fallback data for common makes when API fails
        const fallbackModels = {
          'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', 'X1', 'X3', 'X5', 'X6', 'M3', 'M4', 'M5'],
          'Mercedes': ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'AMG GT'],
          'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Tundra', 'Prius', '4Runner', 'Land Cruiser'],
          'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Ranger', 'Bronco', 'Focus', 'Fusion']
        };
        
        // Use fallback data if available for this make
        if (fallbackModels[make]) {
          console.log(`Using fallback data for ${make}`);
          setFilterOptions(prev => ({ ...prev, models: fallbackModels[make] }));
        } else {
          // If no fallback data, set empty array
          setFilterOptions(prev => ({ ...prev, models: [] }));
        }
      }
    } catch (error) {
      console.error(`Error fetching models for make ${make}:`, error);
      // Use the same fallback as above for errors
      const fallbackModels = {
        'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', 'X1', 'X3', 'X5', 'X6', 'M3', 'M4', 'M5'],
        'Mercedes': ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'GLS', 'AMG GT'],
        'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Tundra', 'Prius', '4Runner', 'Land Cruiser'],
        'Ford': ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Ranger', 'Bronco', 'Focus', 'Fusion']
      };
      
      if (fallbackModels[make]) {
        console.log(`Using fallback data for ${make} after API error`);
        setFilterOptions(prev => ({ ...prev, models: fallbackModels[make] }));
      } else {
        setFilterOptions(prev => ({ ...prev, models: [] }));
      }
    }
  }, []);

  // Handle make change and fetch corresponding models
  useEffect(() => {
    if (filters.make) {
      fetchModels(filters.make);
    } else {
      setFilterOptions(prev => ({ ...prev, models: [] }));
      // Clear model if make is cleared
      if (filters.model) {
        handleFilterChange('model', '');
      }
    }
  }, [filters.make, fetchModels]);

  // Update parent component when filters change
  useEffect(() => {
    // Notify parent component of filter changes
    if (onFilterChange) {
      console.log('Sending filter changes to parent:', filters);
      onFilterChange(filters);
    }

    // Check if we have any active filters
    const hasActiveFilters = Object.values(filters).some(value => value !== '');
    
    // If we have active filters and a search button was pressed, notify parent
    if (hasActiveFilters) {
      console.log('Active filters detected');
    }
  }, [filters, onFilterChange]);

  // Handle individual filter changes
  const handleFilterChange = (filterKey, value) => {
    setFilters(prevFilters => {
      // Special handling for make: if make changes, clear model
      if (filterKey === 'make' && value !== prevFilters.make) {
        return { ...prevFilters, [filterKey]: value, model: '' };
      }
      
      return { ...prevFilters, [filterKey]: value };
    });
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search form submitted with filters:', filters);
    
    // Check if we have any active filters
    const hasActiveFilters = Object.values(filters).some(value => value !== '');
    
    // Notify parent that search was performed
    if (onSearchPerformed) {
      console.log('Notifying parent that search was performed:', hasActiveFilters);
      onSearchPerformed(hasActiveFilters);
    }
  };

  // Toggle expanded filters
  const toggleFilters = () => {
    const newState = !filtersExpanded;
    setFiltersExpanded(newState);
    if (onToggleFilter) {
      onToggleFilter(newState);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    console.log('Clearing all filters');
    setFilters({
      searchKeyword: '',
      make: '',
      model: '',
      yearRange: '',
      priceRange: '',
      fuelType: '',
      transmission: '',
      vehicleType: '',
      conditionType: ''
    });
    
    // Reset search state - notify parent
    if (onSearchPerformed) {
      console.log('Notifying parent that search was reset');
      onSearchPerformed(false);
    }
  };

  // Check if form has any active filters
  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  if (loading) {
    return (
      <div className="car-filter-container">
        <div className="filter-loading">
          <div className="loader"></div>
          <p>Loading filters...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="car-filter-container">
        <div className="filter-error">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Reload Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="car-filters" className="car-filter-container">
      <div className="filter-header">
        <h2>Find Your Perfect Car</h2>
        <button 
          className="expand-filters-btn" 
          onClick={toggleFilters}
          aria-expanded={filtersExpanded}
        >
          {filtersExpanded ? 'Hide Filters' : 'Expand Filters'} {filtersExpanded ? '▲' : '▼'}
        </button>
      </div>
      
      <form onSubmit={handleSearch} className="filter-form">
        <div className="filter-primary-controls">
          <div className="search-field">
            <input
              type="text"
              placeholder="Search by keyword, make, model..."
              value={filters.searchKeyword}
              onChange={(e) => handleFilterChange('searchKeyword', e.target.value)}
            />
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <div className="filter-dropdown">
            <select 
              value={filters.make} 
              onChange={(e) => handleFilterChange('make', e.target.value)}
            >
              <option value="">All Makes</option>
              {(filterOptions.makes || []).map(make => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-dropdown">
            <select 
              value={filters.model} 
              onChange={(e) => handleFilterChange('model', e.target.value)}
              disabled={!filters.make}
            >
              <option value="">All Models</option>
              {(filterOptions.models || []).map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="search-button">Search</button>
        </div>
        
        {filtersExpanded && (
          <div className="expanded-filters">
            <div className="filters-row">
              <div className="filter-group">
                <label htmlFor="year-filter">Year</label>
                <select 
                  id="year-filter" 
                  value={filters.yearRange} 
                  onChange={(e) => handleFilterChange('yearRange', e.target.value)}
                >
                  <option value="">All Years</option>
                  {(filterOptions.years || []).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                  <option value="Pre-2020">Pre-2020</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="price-filter">Price Range</label>
                <select 
                  id="price-filter" 
                  value={filters.priceRange} 
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                >
                  <option value="">All Prices</option>
                  {(filterOptions.priceRanges || DEFAULT_PRICE_RANGES).map(range => (
                    <option key={range.label} value={range.label}>{range.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="fuel-filter">Fuel Type</label>
                <select 
                  id="fuel-filter" 
                  value={filters.fuelType} 
                  onChange={(e) => handleFilterChange('fuelType', e.target.value)}
                >
                  <option value="">All Fuel Types</option>
                  {(filterOptions.fuelTypes || []).map(fuel => (
                    <option key={fuel} value={fuel}>{fuel.charAt(0).toUpperCase() + fuel.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="transmission-filter">Transmission</label>
                <select 
                  id="transmission-filter" 
                  value={filters.transmission} 
                  onChange={(e) => handleFilterChange('transmission', e.target.value)}
                >
                  <option value="">All Transmissions</option>
                  {(filterOptions.transmissions || []).map(transmission => (
                    <option key={transmission} value={transmission}>
                      {transmission.charAt(0).toUpperCase() + transmission.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="filters-row">
              <div className="filter-group">
                <label htmlFor="vehicle-type-filter">Vehicle Type</label>
                <select 
                  id="vehicle-type-filter" 
                  value={filters.vehicleType} 
                  onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
                >
                  <option value="">All Types</option>
                  {(filterOptions.vehicleTypes || []).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="condition-filter">Condition</label>
                <select 
                  id="condition-filter" 
                  value={filters.conditionType} 
                  onChange={(e) => handleFilterChange('conditionType', e.target.value)}
                >
                  <option value="">All Conditions</option>
                  {(filterOptions.conditions || []).map(condition => (
                    <option key={condition} value={condition}>
                      {condition.charAt(0).toUpperCase() + condition.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-actions">
                <button 
                  type="button" 
                  className="clear-filters-btn" 
                  onClick={clearAllFilters}
                  disabled={!hasActiveFilters}
                >
                  Clear All
                </button>
                <button type="submit" className="apply-filters-btn">Apply Filters</button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CarFilter;