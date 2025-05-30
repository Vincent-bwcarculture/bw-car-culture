// src/components/pages/DealershipsPage/DealershipsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { http } from '../../../config/axios.js';
import { dealerService } from '../../../services/dealerService.js';
import DealershipCard from '../../shared/DealershipCard/DealershipCard.js';
import './DealershipsPage.css';

const DealershipsPage = () => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'active',
    businessType: 'all',
    search: '',
    city: '',
    sortBy: 'newest'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  const [searchInput, setSearchInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDealers();
  }, [filters, pagination.currentPage]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        handleFilterChange('search', searchInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle city input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (cityInput !== filters.city) {
        handleFilterChange('city', cityInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [cityInput]);

  const fetchDealers = async () => {
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
        default:
          sort = '-createdAt';
      }

      // Prepare API filter parameters
      const apiFilters = {
        status: filters.status,
        ...(filters.businessType !== 'all' && { businessType: filters.businessType }),
        ...(filters.search && { search: filters.search }),
        ...(filters.city && { city: filters.city }),
        sort
      };
      
      const response = await dealerService.getDealers(apiFilters, pagination.currentPage);
      
      setDealers(response.dealers || []);
      setPagination({
        currentPage: response.pagination?.currentPage || 1,
        totalPages: response.pagination?.totalPages || 1,
        total: response.pagination?.total || 0
      });
    } catch (error) {
      console.error('Error fetching dealers:', error);
      setError('Failed to load dealerships. Please try again.');
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
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle direct navigation to dealership page
  const handleDealershipAction = (dealer) => {
    navigate(`/dealerships/${dealer._id}`);
  };

  return (
    <div className="bcc-dealerships-page">
      {/* Enhanced Hero Section */}
      <div className="bcc-dealerships-hero">
        <div className="bcc-dealership-hero-content">
          <h1>Our Partner Dealerships</h1>
          <p>Connect with trusted car dealerships across the country to find your perfect vehicle</p>
        </div>
      </div>

      <div className="bcc-dealerships-container">
        <div className="bcc-dealership-filter-container">
          <div className="bcc-dealership-filter-row">
            <div className="bcc-dealership-search-container">
              <input
                type="text"
                placeholder="Search dealerships by name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="bcc-dealership-search-input"
              />
            </div>
            
            <div className="bcc-dealership-filter-selects">
              <select
                value={filters.businessType}
                onChange={(e) => handleFilterChange('businessType', e.target.value)}
                className="bcc-dealership-filter-select"
              >
                <option value="all">All Types</option>
                <option value="independent">Independent</option>
                <option value="franchise">Franchise</option>
                <option value="certified">Certified</option>
              </select>
              
              <input
                type="text"
                placeholder="Enter city..."
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="bcc-dealership-location-input"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bcc-dealership-error-message">
            {error}
            <button 
              className="bcc-dealership-retry-button"
              onClick={() => fetchDealers()}
            >
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div className="bcc-dealership-loading-container">
            <div className="bcc-dealership-spinner"></div>
          </div>
        ) : dealers.length === 0 ? (
          <div className="bcc-dealership-no-results">
            <h3>No dealerships found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <div className="bcc-dealership-results-count">
              Found {pagination.total} dealership{pagination.total !== 1 ? 's' : ''}
            </div>
            
            <div className="bcc-dealerships-grid">
              {dealers.map(dealer => (
                <DealershipCard 
                  key={dealer._id || Math.random().toString()}
                  dealer={dealer}
                  onAction={handleDealershipAction}
                />
              ))}
            </div>
            
            {pagination.totalPages > 1 && (
              <div className="bcc-dealership-pagination">
                <button 
                  className="bcc-dealership-page-button prev" 
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
                      className={`bcc-dealership-page-number ${pagination.currentPage === pageToShow ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageToShow)}
                    >
                      {pageToShow}
                    </button>
                  );
                })}
                
                <button 
                  className="bcc-dealership-page-button next" 
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DealershipsPage;