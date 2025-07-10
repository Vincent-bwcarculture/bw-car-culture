// src/components/features/MarketplaceSection/MarketplaceFilters.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { debounce } from 'lodash';
import axios from 'axios';
import {
  VEHICLE_CATEGORIES,
  DRIVETRAIN_TYPES,
  DRIVETRAIN_LABELS
} from '../../../constants/listingConstants.js';
import './MarketplaceFilters.css';

const MarketplaceFilters = ({ 
  activeSection = 'all', 
  onSectionChange 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Simplified state management (no sticky state)
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allVehicles, setAllVehicles] = useState([]);
  
  // Filter options and states
  const [filterOptions, setFilterOptions] = useState({
    makes: ['BMW', 'Mercedes-Benz', 'Toyota', 'Honda', 'Ford', 'Audi', 'Nissan', 'Mazda', 'Volkswagen', 'Hyundai', 'Kia'],
    models: [],
    cities: ['Gaborone', 'Francistown', 'Maun', 'Kasane', 'Palapye'],
    years: Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i),
    dealerships: [],
    privateSellers: [] // ENHANCED: Add private sellers list
  });
  
  const [filters, setFilters] = useState({
    search: '',
    dealerId: '',
    sellerType: '', // ENHANCED: Add seller type filter
    make: '',
    model: '',
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxYear: '',
    category: '',
    drivetrain: '',
    availability: '',
    city: '',
    minMileage: '',
    maxMileage: '',
    sortBy: '' // NEW: Add sort by filter
  });

  // ENHANCED: Section configurations with better descriptions and features
  const sectionConfigs = useMemo(() => ({
    premium: {
      title: 'Premium Collection',
      description: 'Luxury and high-end vehicles from verified dealers and private sellers',
      icon: '👑',
      features: ['Premium Brands', 'Luxury Features', 'High-End Models', 'Verified Sellers'],
      badge: 'premium',
      searchPlaceholder: 'Search premium vehicles...'
    },
    savings: {
      title: 'Save with BW Car Culture',
      description: 'Exclusive deals and savings from dealers and private sellers',
      icon: '💰',
      features: ['Special Offers', 'Price Reductions', 'Exclusive Deals', 'Limited Time'],
      badge: 'savings',
      searchPlaceholder: 'Search savings deals...'
    },
    private: {
      title: 'Private Seller Marketplace', 
      description: 'Connect directly with individual vehicle owners',
      icon: '🤝',
      features: ['No Dealer Fees', 'Direct Negotiation', 'Personal Service', 'Meet the Owner'],
      badge: 'private',
      searchPlaceholder: 'Search private seller listings...'
    },
    all: {
      title: 'All Vehicles',
      description: 'Complete inventory from dealers and private sellers',
      icon: '🚗',
      features: ['All Categories', 'All Sellers', 'Complete Range', 'Best Selection'],
      badge: 'all',
      searchPlaceholder: 'Search all vehicles...'
    }
  }), []);

  // Load vehicles with caching
  const loadVehicles = useCallback(async () => {
    // Check cache first
    const cached = sessionStorage.getItem('vehicleMakes');
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        if (cachedData.timestamp && Date.now() - cachedData.timestamp < 600000) { // 10 minutes
          setFilterOptions(prev => ({ ...prev, makes: cachedData.makes }));
          return;
        }
      } catch (e) {
        // Continue to API call if cache is invalid
      }
    }

    try {
      const response = await axios.get('/api/listings?limit=100');
      
      if (response.data?.data?.length > 0) {
        const vehicles = response.data.data;
        setAllVehicles(vehicles);
        
        const makeSet = new Set();
        vehicles.forEach(vehicle => {
          const makeValue = vehicle.make || vehicle.specifications?.make;
          if (makeValue) makeSet.add(makeValue);
        });
        
        if (makeSet.size > 0) {
          const makes = Array.from(makeSet).sort();
          setFilterOptions(prev => ({ ...prev, makes }));
          
          // Cache the result
          sessionStorage.setItem('vehicleMakes', JSON.stringify({
            makes,
            timestamp: Date.now()
          }));
        }
      }
    } catch (error) {
      console.warn('Could not load vehicle makes from API:', error);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  // Initialize filters from URL - Updated to include sortBy
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const initialFilters = { ...filters };
    
    const paramMappings = {
      'make': 'make',
      'model': 'model',
      'minPrice': 'minPrice',
      'maxPrice': 'maxPrice',
      'minYear': 'minYear',
      'maxYear': 'maxYear',
      'category': 'category',
      'drivetrain': 'drivetrain',
      'search': 'search',
      'availability': 'availability',
      'city': 'city',
      'minMileage': 'minMileage',
      'maxMileage': 'maxMileage',
      'dealerId': 'dealerId',
      'sellerType': 'sellerType',
      'sort': 'sortBy' // Map 'sort' URL param to 'sortBy' filter state
    };
    
    let hasChanges = false;
    Object.entries(paramMappings).forEach(([param, filterKey]) => {
      if (searchParams.has(param)) {
        const value = searchParams.get(param);
        if (initialFilters[filterKey] !== value) {
          initialFilters[filterKey] = value;
          hasChanges = true;
        }
      }
    });
    
    if (hasChanges) {
      setFilters(initialFilters);
    }
  }, [location.search]);
  
  // ENHANCED: Load both dealerships and private sellers with better categorization
  useEffect(() => {
    const loadSellers = async () => {
      try {
        // Check cache first
        const cached = sessionStorage.getItem('sellers');
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            if (cachedData.timestamp && Date.now() - cachedData.timestamp < 300000) { // 5 minutes
              setFilterOptions(prev => ({ 
                ...prev, 
                dealerships: cachedData.data.dealerships,
                privateSellers: cachedData.data.privateSellers
              }));
              return;
            }
          } catch (e) {
            // Continue to API call
          }
        }

        const dealersResponse = await axios.get('/api/dealers/all');
        if (dealersResponse.data?.data) {
          const allSellers = dealersResponse.data.data;
          
          // ENHANCED: Separate dealers and private sellers
          const dealerships = allSellers.filter(seller => 
            seller.sellerType !== 'private' && 
            !seller.privateSeller?.firstName
          );
          
          const privateSellers = allSellers.filter(seller => 
            seller.sellerType === 'private' || 
            seller.privateSeller?.firstName
          );
          
          setFilterOptions(prev => ({ 
            ...prev, 
            dealerships,
            privateSellers
          }));
          
          // Cache the results
          sessionStorage.setItem('sellers', JSON.stringify({
            data: { dealerships, privateSellers },
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.warn('Could not load sellers:', error);
      }
    };

    loadSellers();
  }, []);

  // Update models when make changes
  useEffect(() => {
    if (!filters.make || allVehicles.length === 0) {
      setFilterOptions(prev => ({ ...prev, models: [] }));
      return;
    }

    const filteredModels = allVehicles
      .filter(vehicle => {
        const vehicleMake = vehicle.make || vehicle.specifications?.make;
        return vehicleMake && vehicleMake.toLowerCase() === filters.make.toLowerCase();
      })
      .map(vehicle => vehicle.model || vehicle.specifications?.model)
      .filter(Boolean);

    const uniqueModels = [...new Set(filteredModels)].sort();
    setFilterOptions(prev => ({ ...prev, models: uniqueModels }));
  }, [filters.make, allVehicles]);

  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Clear model when make changes
      if (key === 'make') {
        newFilters.model = '';
      }
      
      return newFilters;
    });
  }, []);

  // Debounced apply filters with sort parameter conversion
  const debouncedApplyFilters = useCallback(
    debounce(() => {
      const searchParams = new URLSearchParams();
      
      if (activeSection) {
        searchParams.set('section', activeSection);
      }
      
      // Process all filters and convert sortBy to sort for the API
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim() !== '') {
          // Convert sortBy to sort for API compatibility
          if (key === 'sortBy') {
            searchParams.set('sort', value);
          } else {
            searchParams.set(key, value);
          }
        }
      });
      
      searchParams.set('page', '1');
      
      navigate({
        pathname: location.pathname,
        search: searchParams.toString()
      });
    }, 300),
    [filters, activeSection, navigate, location]
  );

  // Apply filters
  const applyFilters = useCallback(() => {
    setLoading(true);
    debouncedApplyFilters();
    setTimeout(() => setLoading(false), 500);
  }, [debouncedApplyFilters]);
  
  // Reset filters - Updated to include sortBy
  const resetFilters = useCallback(() => {
    const resetFiltersObj = {
      search: '',
      dealerId: '',
      sellerType: '',
      make: '',
      model: '',
      minPrice: '',
      maxPrice: '',
      minYear: '',
      maxYear: '',
      category: '',
      drivetrain: '',
      availability: '',
      city: '',
      minMileage: '',
      maxMileage: '',
      sortBy: '' // Reset sort by option as well
    };
    
    setFilters(resetFiltersObj);
    
    const searchParams = new URLSearchParams();
    if (activeSection) {
      searchParams.set('section', activeSection);
    }
    searchParams.set('page', '1');
    
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
  }, [activeSection, navigate, location]);

  // Section change handler
  const handleSectionChange = useCallback((section) => {
    if (section === activeSection) return;
    
    if (onSectionChange) {
      onSectionChange(section);
    }
  }, [activeSection, onSectionChange]);

  // ENHANCED: Get current section config
  const currentSectionConfig = sectionConfigs[activeSection] || sectionConfigs.all;

  // ENHANCED: Get appropriate seller options based on section
  const getSellerOptions = useMemo(() => {
    if (activeSection === 'private') {
      return filterOptions.privateSellers;
    } else if (activeSection === 'all') {
      return [...filterOptions.dealerships, ...filterOptions.privateSellers];
    } else {
      // For premium and savings, show all types but indicate
      return [...filterOptions.dealerships, ...filterOptions.privateSellers];
    }
  }, [activeSection, filterOptions.dealerships, filterOptions.privateSellers]);

  return (
    <div 
      className={`marketplace-filters ${expanded ? 'expanded' : ''} ${loading ? 'loading' : ''}`}
      role="region"
      aria-label="Vehicle filters"
    >
      <div className="filters-content">
        {/* ENHANCED: Section Selector with better visual design */}
        <div className="section-selector">
          <div className="section-buttons" role="tablist">
            {Object.entries(sectionConfigs).map(([key, config]) => (
              <button
                key={key}
                className={`section-btn ${activeSection === key ? 'active' : ''}`}
                onClick={() => handleSectionChange(key)}
                role="tab"
                aria-selected={activeSection === key}
                aria-controls={`section-${key}`}
              >
                <span className="section-icon">{config.icon}</span>
                <span className="section-label">{config.title}</span>
                <span className={`section-badge ${config.badge}`}>
                  {config.badge.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
          
          {/* Section description and features */}
          <div className="section-info">
            <p className="section-description">{currentSectionConfig.description}</p>
            <div className="section-features">
              {currentSectionConfig.features.map((feature, index) => (
                <span key={index}>{feature}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Filters Header */}
        <div className="filters-header">
          <h2>Vehicle Filters</h2>
          <button 
            className="toggle-filters-btn"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-controls="advanced-filters"
          >
            {expanded ? 'Less Filters' : 'More Filters'}
          </button>
        </div>
        
        {/* Quick Search Row - Updated with Sort By */}
        <div className="filters-quick-row">
          <div className="filter-control search-filter">
            <input
              type="text"
              placeholder={currentSectionConfig.searchPlaceholder}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              aria-label="Search vehicles"
            />
          </div>
          
          <div className="filter-control">
            <select
              value={filters.make}
              onChange={(e) => handleFilterChange('make', e.target.value)}
              aria-label="Select vehicle make"
            >
              <option value="">All Makes</option>
              {filterOptions.makes.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-control">
            <select
              value={filters.model}
              onChange={(e) => handleFilterChange('model', e.target.value)}
              disabled={!filters.make}
              aria-label="Select vehicle model"
            >
              <option value="">All Models</option>
              {filterOptions.models.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          {/* NEW: Sort By Dropdown */}
          <div className="filter-control">
            <select
              value={filters.sortBy || ''}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              aria-label="Sort listings by"
            >
              <option value="">Sort By</option>
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="specifications.year">Year: Old to New</option>
              <option value="-specifications.year">Year: New to Old</option>
              <option value="specifications.mileage">Mileage: Low to High</option>
              <option value="-specifications.mileage">Mileage: High to Low</option>
              {activeSection === 'savings' && (
                <option value="-priceOptions.savingsAmount">Highest Savings</option>
              )}
              {activeSection === 'auctions' && (
                <>
                  <option value="endDate">Ending Soon</option>
                  <option value="-startingBid">Highest Starting Bid</option>
                  <option value="startingBid">Lowest Starting Bid</option>
                </>
              )}
            </select>
          </div>
          
          <div className="quick-action-buttons">
            <button 
              className="apply-filters-btn" 
              onClick={applyFilters}
              type="button"
              disabled={loading}
              aria-label="Apply search filters"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
        
        {/* Advanced Filters */}
        {expanded && (
          <div className="advanced-filters" id="advanced-filters">
            <div className="filters-row">
              {/* ENHANCED: Seller Type Filter */}
              {activeSection === 'all' && (
                <div className="filter-control">
                  <label htmlFor="seller-type-select">Seller Type</label>
                  <select
                    id="seller-type-select"
                    value={filters.sellerType}
                    onChange={(e) => handleFilterChange('sellerType', e.target.value)}
                  >
                    <option value="">All Sellers</option>
                    <option value="dealership">Dealerships Only</option>
                    <option value="private">Private Sellers Only</option>
                  </select>
                </div>
              )}
              
              {/* ENHANCED: Seller Selection with better labeling */}
              <div className="filter-control">
                <label htmlFor="seller-select">
                  {activeSection === 'private' ? 
                    'Private Seller' : 
                    activeSection === 'all' ? 
                      'Seller' : 
                      'Dealer/Seller'
                  }
                </label>
                <select
                  id="seller-select"
                  value={filters.dealerId}
                  onChange={(e) => handleFilterChange('dealerId', e.target.value)}
                >
                  <option value="">
                    {activeSection === 'private' ? 
                      'All Private Sellers' : 
                      'All Sellers'
                    }
                  </option>
                  {getSellerOptions.map(seller => (
                    <option key={seller._id} value={seller._id}>
                      {seller.displayName || seller.businessName}
                      {seller.verification?.isVerified && ' ✓'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-control">
                <label htmlFor="category-select">Category</label>
                <select
                  id="category-select"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {VEHICLE_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-control">
                <label htmlFor="city-select">City</label>
                <select
                  id="city-select"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                >
                  <option value="">All Cities</option>
                  {filterOptions.cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="filters-row">
              <div className="filter-control">
                <label htmlFor="drivetrain-select">Drivetrain</label>
                <select
                  id="drivetrain-select"
                  value={filters.drivetrain}
                  onChange={(e) => handleFilterChange('drivetrain', e.target.value)}
                >
                  <option value="">All Drivetrains</option>
                  {DRIVETRAIN_TYPES.map(type => (
                    <option key={type} value={type}>
                      {DRIVETRAIN_LABELS[type] || type}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-control">
                <label htmlFor="availability-select">Availability</label>
                <select
                  id="availability-select"
                  value={filters.availability}
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                >
                  <option value="">All Vehicles</option>
                  <option value="available">Available Now</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Recently Sold</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Price Range (BWP)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    aria-label="Minimum price"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    aria-label="Maximum price"
                  />
                </div>
              </div>
              
              <div className="filter-group">
                <label>Year Range</label>
                <div className="range-inputs">
                  <select
                    value={filters.minYear}
                    onChange={(e) => handleFilterChange('minYear', e.target.value)}
                    aria-label="Minimum year"
                  >
                    <option value="">Min Year</option>
                    {filterOptions.years.map(year => (
                      <option key={`min-${year}`} value={year}>{year}</option>
                    ))}
                  </select>
                  <span>to</span>
                  <select
                    value={filters.maxYear}
                    onChange={(e) => handleFilterChange('maxYear', e.target.value)}
                    aria-label="Maximum year"
                  >
                    <option value="">Max Year</option>
                    {filterOptions.years.map(year => (
                      <option key={`max-${year}`} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="filter-group">
                <label>Mileage (km)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minMileage}
                    onChange={(e) => handleFilterChange('minMileage', e.target.value)}
                    aria-label="Minimum mileage"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxMileage}
                    onChange={(e) => handleFilterChange('maxMileage', e.target.value)}
                    aria-label="Maximum mileage"
                  />
                </div>
              </div>
            </div>
            
            <div className="filters-actions">
              <button 
                className="reset-filters-btn" 
                onClick={resetFilters}
                type="button"
              >
                Reset All
              </button>
              <button 
                className="apply-filters-btn" 
                onClick={applyFilters}
                type="button"
                disabled={loading}
              >
                {loading ? 'Applying...' : 'Apply Filters'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(MarketplaceFilters);