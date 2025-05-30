// src/components/features/CarNews/ReviewFilters.js
import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronDown, ChevronUp, Check, Calendar, Car, Tag, Clock } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { http } from '../../../config/axios.js';
import './ReviewFilters.css';

const ReviewFilters = ({ onFilterChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for filter options and values
  const [expanded, setExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    category: 'all',
    make: 'all',
    date: 'all',
    type: 'all'
  });
  
  // State for filter options from the API
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    makes: [],
    dates: [
      { id: 'all', label: 'All Time' },
      { id: 'today', label: 'Today' },
      { id: 'week', label: 'This Week' },
      { id: 'month', label: 'This Month' },
      { id: 'year', label: 'This Year' }
    ],
    types: []
  });
  
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  
  // Initialize filters from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newFilters = { ...activeFilters };
    
    if (params.has('category')) newFilters.category = params.get('category');
    if (params.has('make')) newFilters.make = params.get('make');
    if (params.has('date')) newFilters.date = params.get('date');
    if (params.has('type')) newFilters.type = params.get('type');
    
    setActiveFilters(newFilters);
  }, [location.search]);
  
  // Fetch filter options from API
  const fetchFilterOptions = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to get categories from the API
      try {
        const categoriesResponse = await http.get('/news/categories');
        if (categoriesResponse.data?.data && Array.isArray(categoriesResponse.data.data)) {
          const categories = categoriesResponse.data.data;
          setFilterOptions(prev => ({
            ...prev,
            categories: [
              { id: 'all', label: 'All Categories' },
              ...categories.map(cat => ({ 
                id: cat.toLowerCase(),
                label: cat.charAt(0).toUpperCase() + cat.slice(1)
              }))
            ]
          }));
        }
      } catch (err) {
        console.warn('Error fetching categories, using defaults');
        setFilterOptions(prev => ({
          ...prev,
          categories: [
            { id: 'all', label: 'All Categories' },
            { id: 'reviews', label: 'Car Reviews' },
            { id: 'comparisons', label: 'Comparisons' },
            { id: 'first-drives', label: 'First Drives' },
            { id: 'industry', label: 'Industry News' }
          ]
        }));
      }
      
      // Try to get car makes
      try {
        const makesResponse = await http.get('/marketplace/makes');
        if (makesResponse.data?.data && Array.isArray(makesResponse.data.data)) {
          const makes = makesResponse.data.data;
          setFilterOptions(prev => ({
            ...prev,
            makes: [
              { id: 'all', label: 'All Brands' },
              ...makes.map(make => ({ 
                id: make.toLowerCase(),
                label: make
              }))
            ]
          }));
        }
      } catch (err) {
        console.warn('Error fetching car makes, using defaults');
        setFilterOptions(prev => ({
          ...prev,
          makes: [
            { id: 'all', label: 'All Brands' },
            { id: 'toyota', label: 'Toyota' },
            { id: 'bmw', label: 'BMW' },
            { id: 'mercedes', label: 'Mercedes-Benz' },
            { id: 'audi', label: 'Audi' },
            { id: 'honda', label: 'Honda' }
          ]
        }));
      }
      
      // Set default vehicle types
      setFilterOptions(prev => ({
        ...prev,
        types: [
          { id: 'all', label: 'All Types' },
          { id: 'sedan', label: 'Sedan' },
          { id: 'suv', label: 'SUV' },
          { id: 'sports', label: 'Sports Car' },
          { id: 'electric', label: 'Electric' },
          { id: 'hybrid', label: 'Hybrid' }
        ]
      }));
      
    } catch (error) {
      console.error('Error fetching filter options:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch options when component mounts
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);
  
  // Fetch filtered results when filters change
  const fetchFilteredResults = useCallback(async () => {
    // Skip if any required filter options are not loaded yet
    if (loading || !filterOptions.categories.length) {
      return;
    }
    
    setResultsLoading(true);
    
    try {
      // Prepare filter parameters for API
      const filters = {};
      if (activeFilters.category !== 'all') filters.category = activeFilters.category;
      if (activeFilters.make !== 'all') filters.carMake = activeFilters.make;
      if (activeFilters.type !== 'all') filters.vehicleType = activeFilters.type;
      
      // Add date range filtering
      if (activeFilters.date !== 'all') {
        const now = new Date();
        let fromDate;
        
        switch(activeFilters.date) {
          case 'today':
            fromDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            fromDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            fromDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            fromDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          default:
            fromDate = null;
        }
        
        if (fromDate) {
          filters.fromDate = fromDate.toISOString();
        }
      }
      
      // Fetch filtered articles
      const response = await http.get('/news', { params: filters });
      
      if (response.data?.data) {
        setResults(response.data.data);
        
        // Pass the filters back to parent component
        if (onFilterChange) {
          onFilterChange({
            filters: activeFilters,
            results: response.data.data
          });
        }
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error fetching filtered results:', error);
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  }, [activeFilters, loading, filterOptions.categories.length, onFilterChange]);
  
  // Fetch results when filters change
  useEffect(() => {
    fetchFilteredResults();
    
    // Update URL with current filters
    const params = new URLSearchParams();
    if (activeFilters.category !== 'all') params.set('category', activeFilters.category);
    if (activeFilters.make !== 'all') params.set('make', activeFilters.make);
    if (activeFilters.date !== 'all') params.set('date', activeFilters.date);
    if (activeFilters.type !== 'all') params.set('type', activeFilters.type);
    
    // Only update URL if there are actual filters
    if (params.toString()) {
      navigate({
        pathname: location.pathname,
        search: params.toString()
      }, { replace: true });
    }
  }, [activeFilters, fetchFilteredResults, location.pathname, navigate]);
  
  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  // Reset all filters
  const clearFilters = () => {
    setActiveFilters({
      category: 'all',
      make: 'all',
      date: 'all',
      type: 'all'
    });
    
    // Clear URL params
    navigate({
      pathname: location.pathname,
      search: ''
    }, { replace: true });
  };
  
  // Function to format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };
  
  return (
    <div className="review-filters-container">
      <div className={`review-filters ${expanded ? 'expanded' : 'collapsed'}`}>
        <div className="filters-header">
          <h3>Filter Car Reviews</h3>
          
          <div className="filters-controls">
            {(activeFilters.category !== 'all' || 
              activeFilters.make !== 'all' || 
              activeFilters.date !== 'all' || 
              activeFilters.type !== 'all') && (
              <button className="clear-filters" onClick={clearFilters}>
                Clear All
              </button>
            )}
            
            <button 
              className="expand-toggle"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Collapse filters" : "Expand filters"}
            >
              {expanded ? (
                <>
                  <ChevronUp size={18} />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown size={18} />
                  <span>Expand Filters</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {expanded && (
          <div className="filters-content">
            <div className="filters-grid">
              <div className="filter-group">
                <label>
                  <Tag size={16} />
                  Category
                </label>
                <div className="filter-options">
                  {filterOptions.categories.map(option => (
                    <button
                      key={option.id}
                      className={`filter-button ${activeFilters.category === option.id ? 'active' : ''}`}
                      onClick={() => handleFilterChange('category', option.id)}
                    >
                      {activeFilters.category === option.id && <Check size={14} />}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="filter-group">
                <label>
                  <Car size={16} />
                  Brand
                </label>
                <div className="filter-options">
                  {filterOptions.makes.map(option => (
                    <button
                      key={option.id}
                      className={`filter-button ${activeFilters.make === option.id ? 'active' : ''}`}
                      onClick={() => handleFilterChange('make', option.id)}
                    >
                      {activeFilters.make === option.id && <Check size={14} />}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="filter-group">
                <label>
                  <Calendar size={16} />
                  Date
                </label>
                <div className="filter-options">
                  {filterOptions.dates.map(option => (
                    <button
                      key={option.id}
                      className={`filter-button ${activeFilters.date === option.id ? 'active' : ''}`}
                      onClick={() => handleFilterChange('date', option.id)}
                    >
                      {activeFilters.date === option.id && <Check size={14} />}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="filter-group">
                <label>
                  <Clock size={16} />
                  Vehicle Type
                </label>
                <div className="filter-options">
                  {filterOptions.types.map(option => (
                    <button
                      key={option.id}
                      className={`filter-button ${activeFilters.type === option.id ? 'active' : ''}`}
                      onClick={() => handleFilterChange('type', option.id)}
                    >
                      {activeFilters.type === option.id && <Check size={14} />}
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="active-filters">
              {Object.entries(activeFilters).map(([key, value]) => {
                if (value !== 'all') {
                  const option = filterOptions[key + 's']?.find(opt => opt.id === value);
                  return option ? (
                    <span key={key} className="active-filter-tag">
                      {option.label}
                      <button 
                        onClick={() => handleFilterChange(key, 'all')}
                        className="remove-filter"
                        aria-label={`Remove ${option.label} filter`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ) : null;
                }
                return null;
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Results Section - only show if onFilterChange is not provided */}
      {!onFilterChange && (
        <div className="filtered-results">
          {resultsLoading ? (
            <div className="results-loading">
              <div className="loader"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="no-results">
              <h3>No reviews match your filters</h3>
              <p>Try adjusting your filter criteria or browse our latest reviews</p>
              <button className="browse-all" onClick={clearFilters}>
                View All Reviews
              </button>
            </div>
          ) : (
            <div className="news-grid">
              {results.map(item => (
                <article key={item._id || item.id} className="news-card" onClick={() => {
                  navigate(`/news/article/${item.slug || item._id || item.id}`);
                }}>
                  <div className="news-card-image">
                    <img 
                      src={item.featuredImage?.url || item.image || '/images/placeholders/default.jpg'} 
                      alt={item.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/placeholders/default.jpg';
                      }}
                    />
                  </div>
                  <div className="news-card-content">
                    <div>
                      <h3>{item.title}</h3>
                      <p className="news-description">{item.subtitle || item.description || ''}</p>
                    </div>
                    <div className="news-meta">
                      <div className="author-info">
                        <div className="author-avatar">
                          <img 
                            src={item.author?.avatar || "/images/BCC Logo.png"} 
                            alt={item.author?.name || "Car Culture News"} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/BCC Logo.png';
                            }}
                          />
                        </div>
                        <span className="author-name">{item.author?.name || "Car Culture News"}</span>
                      </div>
                      <span className="news-date">
                        {formatDate(item.publishDate || item.createdAt || item.date)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewFilters;