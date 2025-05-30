// components/GION/pages/GIONHomePage.js - Modified to remove points display
import React, { useState, useEffect } from 'react';
import { Star, MapPin, ChevronRight, Search, Clock, Shield, Award, BarChart2, Truck, Bus, AlertTriangle } from 'lucide-react';
import './GIONHomePage.css';

const GIONHomePage = ({ userPoints = 0, onOpenLeaderboard }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [recentReports, setRecentReports] = useState([]);
  const [statistics, setStatistics] = useState({
    totalReviews: 1248,
    totalBuses: 76,
    totalTaxis: 432,
    safetyScore: 4.2,
    avgRating: 4.1,
    improvementRate: '8%'
  });
  
  // Load recent safety reports from localStorage
  useEffect(() => {
    const storedReports = localStorage.getItem('gion_safety_reports');
    if (storedReports) {
      setRecentReports(JSON.parse(storedReports).slice(0, 3));
    }
  }, []);
  
  // Featured transport services data
  const featuredServices = [
    { 
      id: 'T1234', 
      name: 'SafeRide Taxi', 
      category: 'taxi', 
      rating: 4.9, 
      reviews: 2345,
      color: '#5f5fc4',
      location: 'Gaborone',
      badges: ['Top Rated', 'Licensed'],
      safetyScore: 4.8
    },
    { 
      id: 'B421', 
      name: 'Express Bus', 
      category: 'bus', 
      rating: 4.7, 
      reviews: 1876,
      color: '#119847',
      location: 'Gaborone-Francistown',
      badges: ['Punctual', 'Clean'],
      safetyScore: 4.6
    },
    { 
      id: 'D567', 
      name: 'Motors Dealership', 
      category: 'dealership', 
      rating: 4.8, 
      reviews: 1204,
      color: '#e74c3c',
      location: 'Gaborone',
      badges: ['Verified Dealer', 'Premium'],
      safetyScore: 4.9
    },
    { 
      id: 'R789', 
      name: 'Premium Car Rental', 
      category: 'rental', 
      rating: 4.6, 
      reviews: 834,
      color: '#f39c12',
      location: 'Gaborone Airport',
      badges: ['Insurance Included', 'Wide Selection'],
      safetyScore: 4.5
    }
  ];
  
  // Category data (transport focused)
  const categories = [
    { id: 'all', name: 'All Services', icon: '🔍', color: '#5f5fc4' },
    { id: 'taxi', name: 'Taxis', icon: '🚕', color: '#5f5fc4' },
    { id: 'bus', name: 'Buses', icon: '🚌', color: '#119847' },
    { id: 'train', name: 'Trains', icon: '🚆', color: '#2196f3' },
    { id: 'dealership', name: 'Dealerships', icon: '🏢', color: '#e74c3c' },
    { id: 'rental', name: 'Car Rentals', icon: '🚗', color: '#f39c12' }
  ];
  
  // Filter featured services based on selected category
  const filteredServices = activeCategory === 'all' 
    ? featuredServices 
    : featuredServices.filter(service => service.category === activeCategory);
  
  // Recent activity
  const recentActivity = [
    {
      id: 'act1',
      type: 'review',
      text: 'You reviewed SafeRide Taxi',
      meta: 'Today, 10:30 AM · ★★★★★',
      link: '#',
      icon: '🚕'
    },
    {
      id: 'act2',
      type: 'points',
      text: 'You earned 50 civic points',
      meta: 'Today, 10:30 AM · For your transport review',
      link: '#',
      icon: '🏆'
    },
    {
      id: 'act3',
      type: 'safety',
      text: 'You reported a safety concern',
      meta: 'Yesterday, 2:15 PM · Bus #B3456',
      link: '#',
      icon: '🛡️'
    }
  ];
  
  // Transportation statistics
  const transportStats = [
    { 
      title: 'Taxi Reviews', 
      value: '1,248', 
      icon: <Truck size={24} />, 
      color: '#5f5fc4',
      change: '+12% this month'
    },
    { 
      title: 'Avg Transport Rating', 
      value: '4.1/5', 
      icon: <Star size={24} />, 
      color: '#f39c12',
      change: '+0.3 since last month'
    },
    { 
      title: 'Safety Reports', 
      value: '126', 
      icon: <Shield size={24} />, 
      color: '#e74c3c',
      change: '-8% this month'
    },
    { 
      title: 'Active Transport', 
      value: '508', 
      icon: <Bus size={24} />, 
      color: '#2ecc71',
      change: '+24 new services added'
    }
  ];
  
  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  return (
    <div className="gion-page">
      <div className="gion-page-header">
        <div className="gion-title-area">
          <h1 className="gion-page-title">GION</h1>
          <span className="gion-subtitle">Transport Ratings & Reviews</span>
        </div>
      </div>
      
      {/* Points Display section has been removed */}
      
      {/* Quick Actions */}
      <div className="gion-quick-actions">
        <button className="gion-action-button scan">
          <div className="action-icon">🔍</div>
          <span>Scan QR</span>
        </button>
        <button className="gion-action-button code">
          <div className="action-icon">🔢</div>
          <span>Enter Code</span>
        </button>
        <button className="gion-action-button report">
          <div className="action-icon">⚠️</div>
          <span>Report</span>
        </button>
        <button className="gion-action-button rewards">
          <div className="action-icon">🎁</div>
          <span>Rewards</span>
        </button>
      </div>
      
      {/* Transport Statistics */}
      <div className="transport-statistics-section">
        <div className="section-header">
          <h2 className="section-title">Transport Statistics</h2>
          <div className="ministry-badge small">
            <span className="ministry-icon">🏛️</span>
            <span>Ministry Data</span>
          </div>
        </div>
        
        <div className="statistics-grid">
          {transportStats.map((stat, index) => (
            <div key={index} className="statistic-card" style={{ borderTop: `3px solid ${stat.color}` }}>
              <div className="statistic-icon" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="statistic-details">
                <div className="statistic-value">{stat.value}</div>
                <div className="statistic-title">{stat.title}</div>
                <div className="statistic-change">{stat.change}</div>
              </div>
            </div>
          ))}
        </div>
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
      
      {/* Categories */}
      <div className="gion-category-tabs">
        {categories.map(category => (
          <button 
            key={category.id} 
            className={`gion-category-tab ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            <span className="gion-category-icon">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>
      
      {/* Featured Services */}
      <div className="gion-section">
        <div className="gion-section-header">
          <h2 className="gion-section-title">Top Transport Services</h2>
          <button className="gion-see-all-button" onClick={onOpenLeaderboard}>
            See All
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="gion-services-grid">
          {filteredServices.map(service => (
            <div key={service.id} className="gion-service-card">
              <div className="gion-service-header" style={{ backgroundColor: service.color }}>
                <span className="gion-service-badge">
                  {service.category.toUpperCase()}
                </span>
              </div>
              <div className="gion-service-content">
                <h3 className="gion-service-name">{service.name}</h3>
                <div className="gion-service-rating">
                  <Star size={14} /> {service.rating.toFixed(1)}
                </div>
                <div className="gion-service-location">
                  <MapPin size={12} />
                  <span>{service.location}</span>
                </div>
                <div className="gion-service-reviews">
                  {formatNumber(service.reviews)} reviews
                </div>
                <div className="service-badges">
                  {service.badges.map((badge, index) => (
                    <span key={index} className="service-badge">{badge}</span>
                  ))}
                </div>
                <div className="service-safety-score">
                  <Shield size={12} />
                  <span>Safety Score: {service.safetyScore.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="gion-section">
        <div className="gion-section-header">
          <h2 className="gion-section-title">Your Activity</h2>
          <button className="gion-see-all-button">
            See All
            <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="gion-activity-list">
          {recentActivity.map(activity => (
            <div key={activity.id} className="gion-activity-item">
              <div className="activity-icon">{activity.icon}</div>
              <div className="gion-activity-content">
                <div className="gion-activity-text">{activity.text}</div>
                <div className="gion-activity-meta">
                  <Clock size={14} />
                  {activity.meta}
                </div>
              </div>
              <button className="gion-activity-action">
                <ChevronRight size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Recent Safety Reports */}
      {recentReports.length > 0 && (
        <div className="gion-section">
          <div className="gion-section-header">
            <h2 className="gion-section-title">Safety Updates</h2>
            <div className="safety-icon-badge">
              <AlertTriangle size={14} />
            </div>
          </div>
          
          <div className="safety-reports-list">
            {recentReports.map((report, index) => (
              <div key={index} className="safety-report-item">
                <div className="safety-report-header">
                  <span className="safety-report-type">{report.type}</span>
                  <span className="safety-report-date">{report.date}</span>
                </div>
                <p className="safety-report-text">{report.issue}</p>
                <div className="safety-report-service">
                  <span className="safety-service-id">{report.serviceId}</span>
                  <span className="safety-report-status">{report.status || 'Under Review'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Ministry Partnership Banner */}
      <div className="ministry-partnership-banner">
        <div className="ministry-logo">🏛️</div>
        <div className="ministry-content">
          <h3 className="ministry-title">Ministry of Transport</h3>
          <p className="ministry-description">
            Your reviews directly improve transport services in Botswana. The Ministry uses this data to ensure service quality and safety standards.
          </p>
        </div>
        <button className="ministry-learn-more">
          Learn More
        </button>
      </div>
      
      {/* Transport Improvement Graph */}
      <div className="transport-improvement-section">
        <div className="improvement-header">
          <h3>Transport Quality Improvement</h3>
          <span className="improvement-period">Last 6 Months</span>
        </div>
        
        <div className="improvement-metrics">
          <div className="improvement-metric">
            <span className="metric-value">+{statistics.improvementRate}</span>
            <span className="metric-label">Overall Rating</span>
          </div>
          <div className="improvement-chart">
            <div className="chart-placeholder">
              <BarChart2 size={36} />
            </div>
          </div>
          <div className="improvement-metric">
            <span className="metric-value">{statistics.avgRating}</span>
            <span className="metric-label">Average Rating</span>
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="gion-cta-section">
        <h3 className="cta-title">Help Improve Transportation</h3>
        <p className="cta-description">
          Your reviews help create safer, more reliable transport services for everyone
        </p>
        <div className="cta-buttons">
          <button className="gion-review-cta">
            <Star size={16} />
            <span>Review a Service</span>
          </button>
          <button className="gion-safety-cta">
            <Shield size={16} />
            <span>Report Safety Issue</span>
          </button>
        </div>
      </div>
      
      {/* Bottom spacing for mobile view */}
      <div className="bottom-spacing"></div>
    </div>
  );
};

export default GIONHomePage;