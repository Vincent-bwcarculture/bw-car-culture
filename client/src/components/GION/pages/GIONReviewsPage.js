// components/GION/pages/GIONReviewsPage.js
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Search, Filter, Shield, MapPin, Clock, ChevronRight, AlertTriangle, CheckCircle, Camera } from 'lucide-react';
import './GIONReviewsPage.css';

const GIONReviewsPage = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('nearby');
  const [activeCategory, setActiveCategory] = useState('all');
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('pending');
  const [recentSafetyReports, setRecentSafetyReports] = useState([]);
  
  // Try to get user location for better nearby suggestions
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationPermission('requesting');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationPermission('granted');
        },
        (error) => {
          console.log('Geolocation error:', error);
          setLocationPermission('denied');
        }
      );
    } else {
      setLocationPermission('unavailable');
    }
    
    // Load safety reports
    const storedReports = localStorage.getItem('gion_safety_reports');
    if (storedReports) {
      setRecentSafetyReports(JSON.parse(storedReports).slice(0, 3));
    }
  }, []);
  
  // Transport type categories
  const transportCategories = [
    { id: 'all', name: 'All Types', icon: '🔍' },
    { id: 'taxi', name: 'Taxis', icon: '🚕' },
    { id: 'bus', name: 'Buses', icon: '🚌' },
    { id: 'train', name: 'Trains', icon: '🚆' },
    { id: 'minibus', name: 'Minibuses', icon: '🚐' }
  ];
  
  // Sample data for reviews page - enhanced for transportation
  const reviewableServices = [
    {
      id: 'T1001',
      name: 'SafeRide Taxi',
      category: 'taxi',
      rating: 4.9,
      distance: 0.5,
      color: '#5f5fc4',
      address: 'Gaborone Main Mall',
      lastReviewed: null,
      verificationStatus: 'verified',
      licensePlate: 'BWR 486 B',
      safetyScore: 4.7
    },
    {
      id: 'B2002',
      name: 'Express Bus Service',
      category: 'bus',
      rating: 4.7,
      distance: 1.2,
      color: '#119847',
      address: 'Gaborone Bus Station',
      lastReviewed: null,
      verificationStatus: 'verified',
      routeNumber: 'R12',
      safetyScore: 4.5
    },
    {
      id: 'T3003',
      name: 'City Cab',
      category: 'taxi',
      rating: 4.5,
      distance: 0.8,
      color: '#5f5fc4',
      address: 'Airport Road',
      lastReviewed: null,
      verificationStatus: 'pending',
      licensePlate: 'BWR 223 C',
      safetyScore: 4.3
    },
    {
      id: 'M4004',
      name: 'Combi Line 8',
      category: 'minibus',
      rating: 4.3,
      distance: 1.5,
      color: '#ff9800',
      address: 'Game City Route',
      lastReviewed: null,
      verificationStatus: 'verified',
      routeNumber: '8',
      safetyScore: 4.2
    },
    {
      id: 'B5005',
      name: 'Francistown Express',
      category: 'bus',
      rating: 4.6,
      distance: 0.3,
      color: '#119847',
      address: 'Intercity Bus Terminal',
      lastReviewed: null,
      verificationStatus: 'verified',
      routeNumber: 'IC2',
      safetyScore: 4.8
    }
  ];
  
  // Data for recently reviewed
  const recentlyReviewed = [
    {
      id: 'T9001',
      name: 'FastTaxi',
      category: 'taxi',
      myRating: 5,
      reviewDate: 'Yesterday',
      color: '#5f5fc4',
      review: 'Very clean taxi with a professional driver. Arrived on time.',
      licensePlate: 'BWR 113 A',
      photos: 1
    },
    {
      id: 'B8002',
      name: 'Northern Express Bus',
      category: 'bus',
      myRating: 4,
      reviewDate: '3 days ago',
      color: '#119847',
      review: 'Comfortable bus with air conditioning. Slight delay on departure.',
      routeNumber: 'B22',
      photos: 0
    }
  ];
  
  // Sample popular routes
  const popularRoutes = [
    { 
      id: 'route1', 
      name: 'Gaborone - Francistown', 
      type: 'bus', 
      operators: 3, 
      avgRating: 4.2,
      topOperator: 'Northern Express' 
    },
    { 
      id: 'route2', 
      name: 'Airport - City Center', 
      type: 'taxi', 
      operators: 12, 
      avgRating: 4.5,
      topOperator: 'SafeRide Taxi' 
    },
    { 
      id: 'route3', 
      name: 'Game City - Main Mall', 
      type: 'minibus', 
      operators: 8, 
      avgRating: 3.9,
      topOperator: 'Combi Line 8' 
    }
  ];
  
  // Filter services by category
  const filteredServices = activeCategory === 'all' 
    ? reviewableServices 
    : reviewableServices.filter(service => service.category === activeCategory);
  
  // Handle opening QR scanner
  const handleScanQR = () => {
    // This would trigger the QR scanner in the parent component
    console.log('Opening QR scanner');
  };
  
  // Handle enter code
  const handleEnterCode = () => {
    // This would open the code entry modal
    console.log('Opening code entry');
  };
  
  // Render safety verification badge
  const renderVerificationBadge = (status) => {
    if (status === 'verified') {
      return (
        <div className="verification-badge verified">
          <CheckCircle size={12} />
          <span>Verified</span>
        </div>
      );
    } else {
      return (
        <div className="verification-badge pending">
          <Clock size={12} />
          <span>Pending</span>
        </div>
      );
    }
  };
  
  return (
    <div className="gion-page">
      <div className="gion-page-header">
        <button className="gion-back-button" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="gion-page-title">Transport Reviews</h2>
        <button 
          className="gion-filter-button"
          onClick={() => setFilterModalOpen(true)}
        >
          <Filter size={20} />
        </button>
      </div>
      
      {/* Search Bar */}
      <div className="gion-search-container">
        <div className="gion-search-bar">
          <Search size={16} className="gion-search-icon" />
          <input 
            type="text" 
            placeholder="Search for transport services..." 
            className="gion-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Location Status */}
      {locationPermission === 'granted' && (
        <div className="location-status">
          <MapPin size={14} />
          <span>Using your location for nearby services</span>
        </div>
      )}
      {locationPermission === 'denied' && (
        <div className="location-status warning">
          <AlertTriangle size={14} />
          <span>Enable location for better nearby suggestions</span>
        </div>
      )}
      
      {/* Transport Category Tabs */}
      <div className="transport-category-tabs">
        {transportCategories.map(category => (
          <button 
            key={category.id} 
            className={`transport-category-tab ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
          </button>
        ))}
      </div>
      
      {/* Tab Navigation */}
      <div className="gion-filter-tabs">
        <button 
          className={`gion-filter-tab ${activeTab === 'nearby' ? 'active' : ''}`}
          onClick={() => setActiveTab('nearby')}
        >
          <MapPin size={14} />
          Nearby
        </button>
        <button 
          className={`gion-filter-tab ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          <ChevronRight size={14} />
          Routes
        </button>
        <button 
          className={`gion-filter-tab ${activeTab === 'safety' ? 'active' : ''}`}
          onClick={() => setActiveTab('safety')}
        >
          <Shield size={14} />
          Safety
        </button>
        <button 
          className={`gion-filter-tab ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          <Star size={14} />
          My Reviews
        </button>
      </div>
      
      {/* Reviewable Services */}
      {activeTab === 'nearby' && (
        <div className="gion-section">
          <div className="section-header-with-action">
            <h2 className="gion-section-title">
              Nearby Transport Services
            </h2>
            <div className="ministry-badge micro">
              <span className="ministry-icon">🏛️</span>
              <span>Verified</span>
            </div>
          </div>
          
          <div className="gion-review-items-list">
            {filteredServices.map(service => (
              <div key={service.id} className="gion-review-item">
                <div 
                  className="gion-review-icon transport-icon" 
                  style={{ backgroundColor: service.color }}
                >
                  {service.category === 'taxi' ? '🚕' : 
                   service.category === 'bus' ? '🚌' : 
                   service.category === 'train' ? '🚆' : 
                   service.category === 'minibus' ? '🚐' : '🚗'}
                </div>
                <div className="gion-review-details">
                  <div className="gion-review-header">
                    <h3 className="gion-review-name">{service.name}</h3>
                    {renderVerificationBadge(service.verificationStatus)}
                  </div>
                  <div className="gion-review-meta">
                    <div className="gion-review-rating">
                      <Star size={14} /> {service.rating.toFixed(1)}
                    </div>
                    <div className="gion-review-distance">
                      <MapPin size={14} /> {service.distance.toFixed(1)} km
                    </div>
                  </div>
                  <div className="transport-details">
                    {service.category === 'taxi' && (
                      <div className="transport-license">{service.licensePlate}</div>
                    )}
                    {(service.category === 'bus' || service.category === 'minibus') && (
                      <div className="transport-route">Route: {service.routeNumber}</div>
                    )}
                    <div className="transport-safety">
                      <Shield size={14} />
                      <span>Safety: {service.safetyScore.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <button className="gion-review-button">
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Popular Routes */}
      {activeTab === 'routes' && (
        <div className="gion-section">
          <h2 className="gion-section-title">Popular Routes</h2>
          
          <div className="routes-list">
            {popularRoutes.map(route => (
              <div key={route.id} className="route-item">
                <div className="route-info">
                  <div className="route-type-icon">
                    {route.type === 'taxi' ? '🚕' : 
                     route.type === 'bus' ? '🚌' : 
                     route.type === 'minibus' ? '🚐' : '🚗'}
                  </div>
                  <div className="route-details">
                    <h3 className="route-name">{route.name}</h3>
                    <div className="route-meta">
                      <div className="route-operators">
                        {route.operators} service providers
                      </div>
                      <div className="route-rating">
                        <Star size={14} /> {route.avgRating.toFixed(1)}
                      </div>
                    </div>
                    <div className="route-top-operator">
                      Top service: {route.topOperator}
                    </div>
                  </div>
                </div>
                <button className="view-route-button">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Safety Reports */}
      {activeTab === 'safety' && (
        <div className="gion-section">
          <div className="safety-header">
            <h2 className="gion-section-title">Safety Reporting</h2>
            <div className="ministry-badge safety">
              <Shield size={14} />
              <span>Ministry Priority</span>
            </div>
          </div>
          
          <div className="safety-intro">
            <p>Help improve transport safety by reporting issues with vehicles, drivers, or infrastructure.</p>
          </div>
          
          <button className="safety-report-button">
            <AlertTriangle size={16} />
            <span>Report Safety Issue</span>
          </button>
          
          {recentSafetyReports.length > 0 && (
            <>
              <h3 className="safety-section-subtitle">Your Recent Reports</h3>
              <div className="safety-reports-list">
                {recentSafetyReports.map((report, index) => (
                  <div key={index} className="safety-report-item">
                    <div className="safety-report-header">
                      <span className="safety-report-type">{report.type}</span>
                      <span className="safety-report-date">{report.date}</span>
                    </div>
                    <p className="safety-report-text">{report.issue}</p>
                    <div className="safety-report-service">
                      <span className="safety-service-id">{report.serviceId}</span>
                      <span className="safety-report-status">
                        {report.status === 'resolved' ? (
                          <><CheckCircle size={12} /> Resolved</>
                        ) : (
                          <><Clock size={12} /> {report.status || 'Under Review'}</>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          <div className="safety-ministry-callout">
            <div className="ministry-logo">🏛️</div>
            <p>Safety reports are directly forwarded to the Ministry of Transport for review and action.</p>
          </div>
        </div>
      )}
      
      {/* My Reviews */}
      {activeTab === 'my' && (
        <div className="gion-section">
          <h2 className="gion-section-title">My Transport Reviews</h2>
          
          {recentlyReviewed.length > 0 ? (
            <div className="my-reviews-list">
              {recentlyReviewed.map(review => (
                <div key={review.id} className="my-review-item">
                  <div className="review-service-info">
                    <div 
                      className="review-service-icon" 
                      style={{ backgroundColor: review.color }}
                    >
                      {review.category === 'taxi' ? '🚕' : 
                       review.category === 'bus' ? '🚌' : 
                       review.category === 'train' ? '🚆' : '🚗'}
                    </div>
                    <div className="review-service-details">
                      <h3 className="review-service-name">{review.name}</h3>
                      <div className="review-service-meta">
                        {review.category === 'taxi' ? (
                          <div className="review-license">{review.licensePlate}</div>
                        ) : (
                          <div className="review-route">Route: {review.routeNumber}</div>
                        )}
                        <div className="review-date">
                          <Clock size={12} />
                          <span>{review.reviewDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="my-review-content">
                    <div className="my-review-rating">
                      {'★'.repeat(review.myRating)}
                      {'☆'.repeat(5 - review.myRating)}
                    </div>
                    <p className="my-review-text">{review.review}</p>
                    {review.photos > 0 && (
                      <div className="review-photos-indicator">
                        <Camera size={14} />
                        <span>{review.photos} photo{review.photos > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="my-review-actions">
                    <button className="edit-review-button">
                      Edit
                    </button>
                    <button className="share-review-button">
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-reviews-placeholder">
              <div className="no-reviews-icon">
                <Star size={32} />
              </div>
              <p>You haven't reviewed any transport services yet.</p>
              <button className="start-reviewing-button">Start Reviewing</button>
            </div>
          )}
        </div>
      )}
      
      {/* Call to action */}
      <div className="gion-cta-section">
        <p>Can't find what you're looking for?</p>
        <div className="cta-buttons">
          <button 
            className="gion-scan-qr-button"
            onClick={handleScanQR}
          >
            Scan QR Code
          </button>
          <button 
            className="gion-enter-code-button"
            onClick={handleEnterCode}
          >
            Enter Code
          </button>
        </div>
      </div>
      
      {/* Filter Modal */}
      {filterModalOpen && (
        <div className="filter-modal-overlay">
          <div className="filter-modal">
            <div className="filter-modal-header">
              <h3>Filter Transport Services</h3>
              <button 
                className="close-filter-button"
                onClick={() => setFilterModalOpen(false)}
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            
            <div className="filter-options-container">
              {/* Filter options would go here */}
              <button 
                className="apply-filters-button"
                onClick={() => setFilterModalOpen(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GIONReviewsPage;