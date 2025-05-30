// src/components/pages/DealershipsPage/DealershipsPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { http } from '../../../config/axios.js';
import BusinessCard from '../../shared/BusinessCard/BusinessCard.js';
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
  const location = useLocation();

  useEffect(() => {
    // Parse URL parameters when page loads
    const searchParams = new URLSearchParams(location.search);
    
    const newFilters = {
      status: searchParams.get('status') || 'active',
      businessType: searchParams.get('businessType') || 'all',
      search: searchParams.get('search') || '',
      city: searchParams.get('city') || '',
      sortBy: searchParams.get('sortBy') || 'newest'
    };
    
    const page = parseInt(searchParams.get('page'), 10) || 1;
    
    setFilters(newFilters);
    setSearchInput(newFilters.search);
    setCityInput(newFilters.city);
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
    
    fetchDealers(newFilters, page);
  }, [location.search]);

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

  const fetchDealers = async (currentFilters = filters, page = pagination.currentPage) => {
    try {
      setLoading(true);
      setError(null);

      // Convert sortBy filter to API sort parameter
      let sort;
      switch (currentFilters.sortBy) {
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
        status: currentFilters.status,
        ...(currentFilters.businessType !== 'all' && { businessType: currentFilters.businessType }),
        ...(currentFilters.search && { search: currentFilters.search }),
        ...(currentFilters.city && { city: currentFilters.city }),
        sort
      };
      
      // Make the API call
      try {
        const response = await http.get('/dealers', {
          params: {
            ...apiFilters,
            page,
            limit: 12
          }
        });
        
        if (response.data && response.data.success) {
          setDealers(response.data.data || []);
          setPagination({
            currentPage: response.data.pagination?.currentPage || 1,
            totalPages: response.data.pagination?.totalPages || 1,
            total: response.data.pagination?.total || 0
          });
        } else {
          throw new Error(response.data?.message || 'Failed to fetch dealerships');
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        
        // Fallback to mock data in case the API is not available
        setDealers(MOCK_DEALERS);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          total: MOCK_DEALERS.length
        });
      }
    } catch (error) {
      console.error('Error fetching dealers:', error);
      setError('Failed to load dealerships. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    // Create a copy of the current search params
    const searchParams = new URLSearchParams(location.search);
    
    // Update the parameter
    if (value) {
      searchParams.set(name, value);
    } else {
      searchParams.delete(name);
    }
    
    // Reset to first page when filters change
    searchParams.set('page', '1');
    
    // Navigate to the new URL
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
  };

  const handlePageChange = (page) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('page', page.toString());
    
    navigate({
      pathname: location.pathname,
      search: searchParams.toString()
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle dealership action - navigate to detail page
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

              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="bcc-dealership-filter-select"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="businessName">Name (A-Z)</option>
              </select>
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
            
            {/* UPDATED: Using BusinessCard instead of DealershipCard */}
            <div className="bcc-dealerships-grid">
              {dealers.map(dealer => (
                <BusinessCard 
                  key={dealer._id || Math.random().toString()}
                  business={dealer}
                  onAction={() => handleDealershipAction(dealer)}
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

// Mock dealers for fallback if the API is not working
const MOCK_DEALERS = [
  {
    _id: 'dealer1',
    businessName: 'Premium Auto Gallery',
    businessType: 'certified',
    location: {
      city: 'Gaborone',
      country: 'Botswana'
    },
    profile: {
      logo: '/images/dealers/logo1.jpg',
      banner: '/images/dealers/banner1.jpg',
      description: 'Premium Auto Gallery offers high-end luxury vehicles with exceptional service.',
      specialties: ['Luxury Vehicles', 'Performance Cars', 'Premium SUVs', 'Import Specialists']
    },
    verification: {
      status: 'verified'
    },
    metrics: {
      totalListings: 27,
      averageRating: 4.9,
      totalReviews: 54
    }
  },
  {
    _id: 'dealer2',
    businessName: 'City Motors',
    businessType: 'franchise',
    location: {
      city: 'Francistown',
      country: 'Botswana'
    },
    profile: {
      logo: '/images/dealers/logo2.jpg',
      banner: '/images/dealers/banner2.jpg',
      description: 'City Motors is an authorized dealer for multiple major brands with full service and parts.',
      specialties: ['New Vehicles', 'Certified Pre-owned', 'Service Center', 'Parts & Accessories']
    },
    verification: {
      status: 'verified'
    },
    metrics: {
      totalListings: 45,
      averageRating: 4.6,
      totalReviews: 77
    }
  },
  {
    _id: 'dealer3',
    businessName: 'Affordable Auto Traders',
    businessType: 'independent',
    location: {
      city: 'Gaborone',
      country: 'Botswana'
    },
    profile: {
      logo: '/images/dealers/logo3.jpg',
      banner: '/images/dealers/banner3.jpg',
      description: 'Affordable Auto Traders specializes in quality used vehicles at competitive prices.',
      specialties: ['Used Vehicles', 'Financing', 'Trade-ins', 'Budget Options']
    },
    verification: {
      status: 'pending'
    },
    metrics: {
      totalListings: 18,
      averageRating: 4.2,
      totalReviews: 35
    }
  },
  {
    _id: 'dealer4',
    businessName: 'Botswana Motors',
    businessType: 'franchise',
    location: {
      city: 'Maun',
      country: 'Botswana'
    },
    profile: {
      logo: '/images/dealers/logo4.jpg',
      banner: '/images/dealers/banner4.jpg',
      description: 'Botswana Motors delivers exceptional service with a wide selection of vehicles.',
      specialties: ['New Vehicles', 'Used Vehicles', 'Service Center', 'Financing']
    },
    verification: {
      status: 'verified'
    },
    metrics: {
      totalListings: 32,
      averageRating: 4.5,
      totalReviews: 46
    }
  }
];

export default DealershipsPage;