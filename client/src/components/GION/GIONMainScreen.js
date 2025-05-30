// components/GION/GIONMainScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  ArrowRight, 
  Search, 
  Home, 
  User, 
  X, 
  ExternalLink, 
  MapPin, 
  Calendar, 
  Star, 
  Clock,
  Maximize2,
  ChevronRight
} from 'lucide-react';
import './GIONMainScreen.css';

const GIONMainScreen = ({ 
  onScanQR, 
  onCodeSubmit, 
  onReviewClick,
  onCategorySelect, 
  onRecentItemSelect,
  onClose,
  onExpand,
  onViewAll,
  onProfileClick, 
  onHomeClick,
  recentItems = [],
  userPoints = 0,
  currentPath = '/',
  isExpanded = false,
  hideBottomNav = false
}) => {
  const [serviceCode, setServiceCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState(getInitialCategory());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchMode, setSearchMode] = useState('code'); // 'code' or 'plate'
  const [businessSearchTerm, setBusinessSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);
  
  // Determine initial category based on current path
  function getInitialCategory() {
    if (currentPath.includes('transport')) return 'transport';
    if (currentPath.includes('dealership')) return 'dealership';
    if (currentPath.includes('service') || currentPath.includes('workshop')) return 'service';
    if (currentPath.includes('rental')) return 'rental';
    return 'transport'; // Default
  }
  
  // Handle code modal
  useEffect(() => {
    // Close modal when clicking outside
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
    };
    
    if (isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);
  
  // Helper to determine icon based on category
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'transport':
      case 'taxi':
        return '🚕';
      case 'bus':
        return '🚌';
      case 'train':
        return '🚆';
      case 'dealership':
        return '🏢';
      case 'rental':
        return '🚗';
      case 'workshop':
        return '🔧';
      default:
        return '🏢';
    }
  };

  // Simulated search function - in a real app, this would call an API
  useEffect(() => {
    if (businessSearchTerm.length < 3) {
      setSearchResults([]);
      return;
    }
    
    // Mock search results - in a real app, this would be fetched from an API
    const mockSearchResults = [
      { 
        id: 'T1234', 
        name: 'SafeRide Taxi', 
        category: 'taxi', 
        rating: 4.9,
        color: '#5f5fc4',
        location: 'Gaborone'
      },
      { 
        id: 'B421', 
        name: 'Express Bus', 
        category: 'bus', 
        rating: 4.7,
        color: '#119847',
        location: 'Gaborone-Francistown'
      },
      { 
        id: 'D567', 
        name: 'Motors Dealership', 
        category: 'dealership', 
        rating: 4.8,
        color: '#e74c3c',
        location: 'Gaborone'
      },
      { 
        id: 'R789', 
        name: 'Premium Car Rental', 
        category: 'rental', 
        rating: 4.6,
        color: '#f39c12',
        location: 'Gaborone Airport'
      }
    ].filter(item => 
      item.name.toLowerCase().includes(businessSearchTerm.toLowerCase())
    );
    
    setSearchResults(mockSearchResults);
  }, [businessSearchTerm]);

  // Handle business selection from search results
  const handleBusinessSelect = (business) => {
    setSelectedBusiness(business);
    setBusinessSearchTerm('');
    setSearchResults([]);
  };
  
  const handleOpenModal = () => {
    setIsModalOpen(true);
    // Reset code input when opening
    setServiceCode('');
    // Focus input after a short delay
    setTimeout(() => {
      const input = document.getElementById('service-code-input');
      if (input) input.focus();
    }, 100);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  // Helper to determine service category from code
  const determineCategory = (code) => {
    if (code.startsWith('T')) return 'taxi';
    if (code.startsWith('B')) return 'bus';
    if (code.startsWith('TR')) return 'train';
    if (code.startsWith('D')) return 'dealership';
    if (code.startsWith('R')) return 'rental';
    if (code.startsWith('W')) return 'workshop';
    return 'transport';
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedBusiness) {
      // Use the selected business
      onRecentItemSelect(selectedBusiness);
      setIsModalOpen(false);
      setSelectedBusiness(null);
      return;
    }
    
    if (serviceCode.trim()) {
      // Determine if it's a plate number or service code based on search mode
      let service = {
        name: searchMode === 'code' ? 'Unknown Service' : 'Vehicle Service',
        id: serviceCode,
        category: searchMode === 'code' ? determineCategory(serviceCode) : 'transport'
      };
      
      // For plate numbers, create a different ID format and name
      if (searchMode === 'plate') {
        service.name = `Vehicle (${serviceCode})`;
        service.id = `VP-${serviceCode.replace(/\s+/g, '')}`;
        service.isVehicle = true;
      }
      
      onCodeSubmit(service);
      
      // Close the modal
      setIsModalOpen(false);
      setServiceCode('');
    }
  };

  // Handle service card click - opens in new tab
  const handleServiceClick = (service) => {
    window.open(`https://gion.app/services/${service.id}`, '_blank');
  };

  // Handle activity item click - opens in new tab
  const handleActivityClick = (activityId) => {
    window.open(`https://gion.app/activity/${activityId}`, '_blank');
  };
  
  // Handle search focus
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };
  
  const handleSearchBlur = () => {
    setIsSearchFocused(false);
  };
  
  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Implement search functionality here
      console.log('Searching for:', searchTerm);
      
      // Reset search
      setSearchTerm('');
      searchInputRef.current?.blur();
    }
  };

  // Enhanced featured services with more transport options
  const featuredServices = [
    { 
      id: 'T1234', 
      name: 'SafeRide Taxi', 
      category: 'transport', 
      rating: 4.9, 
      reviews: 2345,
      color: '#5f5fc4',
      location: 'Gaborone'
    },
    { 
      id: 'B421', 
      name: 'Express Bus', 
      category: 'transport', 
      rating: 4.7, 
      reviews: 1876,
      color: '#119847',
      location: 'Gaborone-Francistown'
    },
    { 
      id: 'D567', 
      name: 'Motors Dealership', 
      category: 'dealership', 
      rating: 4.8, 
      reviews: 1204,
      color: '#e74c3c',
      location: 'Gaborone'
    },
    { 
      id: 'R789', 
      name: 'Premium Car Rental', 
      category: 'rental', 
      rating: 4.6, 
      reviews: 834,
      color: '#f39c12',
      location: 'Gaborone Airport'
    }
  ];

  // Categories configuration
  const categories = [
    { id: 'transport', name: 'Transport', icon: '🚕', color: '#5f5fc4' },
    { id: 'dealership', name: 'Dealerships', icon: '🏢', color: '#e74c3c' },
    { id: 'service', name: 'Workshops', icon: '🔧', color: '#3498db' },
    { id: 'rental', name: 'Car Rentals', icon: '🚗', color: '#f39c12' }
  ];

  // Filter featured services by category
  const filteredServices = currentCategory === 'all' 
    ? featuredServices 
    : featuredServices.filter(service => service.category === currentCategory);

  // Recent activity (since we might not have real data yet)
  const recentActivity = [
    {
      id: 'act1',
      type: 'review',
      text: 'You reviewed SafeRide Taxi',
      meta: 'Today, 10:30 AM · ★★★★★',
      link: 'https://gion.app/reviews/detail/123'
    },
    {
      id: 'act2',
      type: 'points',
      text: 'You earned 50 points',
      meta: 'Today, 10:30 AM · For your review',
      link: 'https://gion.app/rewards'
    },
    {
      id: 'act3',
      type: 'review',
      text: 'You reviewed Motors Dealership',
      meta: 'Yesterday, 2:15 PM · ★★★★☆',
      link: 'https://gion.app/reviews/detail/456'
    }
  ];

  return (
    <div className="gion-main-screen">
      {/* Header with controls */}
      <div className="gion-slim-header">
        <div className="gion-branding">
          <span className="gion-title">GION</span>
          <span className="gion-subtitle">Powered by Bw Car Culture</span>
        </div>
        <div className="header-controls">
          <button 
            className="header-button" 
            onClick={onExpand} 
            aria-label="Open in new tab"
          >
            <Maximize2 size={16} />
          </button>
          <button className="header-button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
      </div>
      
      {/* Added Exit Button */}
      <div className="exit-app-container">
        <button 
          className="exit-app-button"
          onClick={() => {
            onClose();
            setTimeout(() => {
              window.location.href = '/';
            }, 300);
          }}
          aria-label="Exit"
        >
          X
        </button>
      </div>
      
      {/* Search Bar */}
      <form className="search-bar" onSubmit={handleSearchSubmit}>
        <Search size={16} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search for services..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          ref={searchInputRef}
        />
      </form>
      
      {/* Content Wrapper to allow for bottom menu without overlap */}
      <div className="content-wrapper">
        {/* Primary Action Buttons */}
        <div className="primary-actions">
          <button 
            className="action-button review"
            onClick={onReviewClick}
          >
            REVIEW SERVICE
          </button>
          
          <button 
            className="action-button enter-code"
            onClick={() => {
              setSearchMode('code');
              handleOpenModal();
            }}
          >
            ENTER CODE
          </button>
          
          <button 
            className="action-button vehicle-plate"
            onClick={() => {
              setSearchMode('plate');
              handleOpenModal();
            }}
          >
            VEHICLE PLATE
          </button>
        </div>
        
        {/* QR Code Scanner Button */}
        <div className="scan-qr-container">
          <button 
            className="scan-qr-button"
            onClick={onScanQR}
          >
            <QrCode size={24} />
          </button>
          <p className="scan-qr-text">Scan Service QR Code</p>
        </div>
        
        {/* Category Tabs */}
        <div className="category-tabs">
          <button 
            className={`category-tab ${currentCategory === 'all' ? 'active' : ''}`}
            onClick={() => setCurrentCategory('all')}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${currentCategory === category.id ? 'active' : ''}`}
              onClick={() => setCurrentCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
        
        {/* Featured Services */}
        <div className="section-header">
          <h2 className="section-title">Featured Services</h2>
          <button 
            className="see-all-button" 
            onClick={() => onViewAll('featured')}
          >
            See All
            <ChevronRight size={14} />
          </button>
        </div>
        
        <div className="featured-services">
          {filteredServices.map((service) => (
            <div 
              key={service.id} 
              className="service-card"
              onClick={() => handleServiceClick(service)}
            >
              <div 
                className="service-card-header"
                style={{ backgroundColor: service.color }}
              >
                <span className="service-category">
                  {service.category.toUpperCase()}
                </span>
              </div>
              <div className="service-card-content">
                <h3>{service.name}</h3>
                <div className="service-rating">
                  <Star size={14} /> {service.rating.toFixed(1)}
                </div>
                <div className="service-location">
                  <MapPin size={12} />
                  <span>{service.location}</span>
                </div>
                <div className="service-reviews">
                  {service.reviews.toLocaleString()} reviews
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Recent Vehicles Section */}
        {recentItems.some(item => item.isVehicle) && (
          <div className="recent-vehicles-section">
            <div className="section-header">
              <h2>Recently Reviewed Vehicles</h2>
            </div>
            <div className="recent-vehicles-list">
              {recentItems
                .filter(item => item.isVehicle)
                .map((item, index) => (
                  <div 
                    key={index} 
                    className="recent-vehicle-item"
                    onClick={() => onRecentItemSelect(item)}
                  >
                    <div className="vehicle-plate-display">
                      {item.id.replace('VP-', '')}
                    </div>
                    <div className="recent-vehicle-details">
                      <div className="recent-vehicle-name">{item.name}</div>
                      <div className="recent-vehicle-category">Vehicle Service</div>
                    </div>
                    <button className="recent-item-action">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {/* Recent Items (if available) */}
        {recentItems && recentItems.length > 0 && (
          <div className="recent-items-section">
            <div className="section-header">
              <h2>Recently Used</h2>
            </div>
            <div className="recent-items-list">
              {recentItems.map((item, index) => (
                <div 
                  key={index} 
                  className="recent-item"
                  onClick={() => onRecentItemSelect(item)}
                >
                  <div className="recent-item-icon" style={{ 
                    backgroundColor: categories.find(c => c.id === item.category)?.color || '#5f5fc4' 
                  }}>
                    {categories.find(c => c.id === item.category)?.icon || '🚕'}
                  </div>
                  <div className="recent-item-details">
                    <div className="recent-item-name">{item.name}</div>
                    <div className="recent-item-id">#{item.id}</div>
                  </div>
                  <button className="recent-item-action">
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recent Activity */}
        <div className="section-header">
          <h2>Recent Activity</h2>
          <button 
            className="see-all-button"
            onClick={() => onViewAll('activity')}
          >
            See All
            <ChevronRight size={14} />
          </button>
        </div>
        
        <div className="recent-activity">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-content">
                <div className="activity-text">{activity.text}</div>
                <div className="activity-meta">
                  <Clock size={14} />
                  {activity.meta}
                </div>
              </div>
              <button 
                className="activity-action"
                onClick={() => handleActivityClick(activity.id)}
              >
                <ArrowRight size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom Navigation - Hide when expanded */}
      {!hideBottomNav && (
        <div className="bottom-navigation">
          <button 
            className="nav-button active" 
            onClick={onHomeClick}
          >
            <Home size={20} />
            <span>Home</span>
          </button>
          <button 
            className="nav-button" 
            onClick={onReviewClick}
          >
            <Star size={20} />
            <span>Review</span>
          </button>
          <button 
            className="nav-button"
            onClick={onProfileClick}
          >
            <User size={20} />
            <span>Profile</span>
          </button>
        </div>
      )}
      
      {/* Code Input Modal */}
      {isModalOpen && (
        <>
          <div className="modal-overlay" onClick={handleCloseModal}></div>
          <div className="code-input-modal" ref={modalRef}>
            <div className="modal-header">
              <h3>Find & Review Service</h3>
              <button 
                className="close-modal-button"
                onClick={handleCloseModal}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="search-tabs">
                <button 
                  type="button" 
                  className={`search-tab ${searchMode === 'code' ? 'active' : ''}`}
                  onClick={() => setSearchMode('code')}
                >
                  Service Code
                </button>
                <button 
                  type="button" 
                  className={`search-tab ${searchMode === 'plate' ? 'active' : ''}`}
                  onClick={() => setSearchMode('plate')}
                >
                  Vehicle Plate
                </button>
              </div>
              
              {searchMode === 'code' && (
                <div className="code-help-text">
                  <p>Enter the code displayed on vehicles, service providers, or receipts</p>
                  <p className="code-example">Example: T1234 (Taxi), D567 (Dealership), etc.</p>
                </div>
              )}
              
              {searchMode === 'plate' && (
                <div className="code-help-text">
                  <p>Enter the vehicle's number plate to rate its service</p>
                  <p className="code-example">Example: BWR 486 B, BKA 123 BW, etc.</p>
                </div>
              )}
              
              <input
                id="service-code-input"
                type="text"
                placeholder={searchMode === 'code' ? 
                  "Enter service code (e.g., T1234)" : 
                  "Enter vehicle plate number"
                }
                value={serviceCode}
                onChange={(e) => setServiceCode(e.target.value)}
                className="code-input"
                autoFocus
              />
              
              <div className="search-divider">
                <span>OR</span>
              </div>
              
              <div className="business-search-container">
                <div className="section-header">
                  <Search size={14} />
                  <span>Search Business Name</span>
                </div>
                <input
                  type="text"
                  placeholder="Search for a business or service..."
                  value={businessSearchTerm}
                  onChange={(e) => setBusinessSearchTerm(e.target.value)}
                  className="business-search-input"
                />
                
                {/* Business search results */}
                {businessSearchTerm.length > 2 && searchResults.length > 0 && (
                  <div className="business-search-results">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="search-result-item"
                        onClick={() => handleBusinessSelect(result)}
                      >
                        <div className="result-icon" style={{ backgroundColor: result.color }}>
                          {getCategoryIcon(result.category)}
                        </div>
                        <div className="result-details">
                          <div className="result-name">{result.name}</div>
                          <div className="result-meta">
                            <span className="result-category">{result.category}</span>
                            <span className="result-rating">
                              <Star size={12} /> {result.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {businessSearchTerm.length > 2 && searchResults.length === 0 && (
                  <div className="no-results-message">
                    No services found matching your search
                  </div>
                )}
              </div>
              
              <button 
                type="submit"
                className="code-submit-button"
                disabled={!serviceCode.trim() && !selectedBusiness}
              >
                {selectedBusiness ? "Review Selected Business" : "Find & Review"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default GIONMainScreen;