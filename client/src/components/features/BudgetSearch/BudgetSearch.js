// =============================================================================
// BUDGET SEARCH COMPONENT - COMPLETE JAVASCRIPT FILE
// File: client/src/components/features/BudgetSearch/BudgetSearch.js
// =============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '../../../services/listingService.js';
import VehicleCard from '../../shared/VehicleCard/VehicleCard.js';
import './BudgetSearch.css';

const BudgetSearch = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const budgetCalculatorRef = useRef(null);
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [deposit, setDeposit] = useState('');
  const [termLength, setTermLength] = useState('72');
  const [tradeAmount, setTradeAmount] = useState('0');
  const [interestRate, setInterestRate] = useState(11.0);
  const [buyingPower, setBuyingPower] = useState(0);
  
  // Search results state
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState({ left: false, right: false });
  const [hasSearched, setHasSearched] = useState(false);

  // Most expensive car state
  const [mostExpensiveCar, setMostExpensiveCar] = useState(null);
  const [promoLoading, setPromoLoading] = useState(true);

  // Real stats state
  const [websiteStats, setWebsiteStats] = useState({
    totalVehicles: 0,
    totalDealers: 0,
    totalProviders: 0,
    loading: true,
    error: null
  });

  // Calculate buying power when inputs change
  useEffect(() => {
    calculateBuyingPower();
  }, [monthlyBudget, deposit, termLength, tradeAmount, interestRate]);

  // Fetch initial data on component mount
  useEffect(() => {
    fetchMostExpensiveCar();
    fetchWebsiteStats();
  }, []);

  // Update carousel scroll controls when results change or on window resize
  useEffect(() => {
    const updateScrollControls = () => {
      if (scrollRef.current && searchResults.length > 0) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const maxScroll = scrollWidth - clientWidth;

        setShowControls({
          left: scrollLeft > 0,
          right: scrollLeft < maxScroll - 1
        });
      } else {
        setShowControls({ left: false, right: false });
      }
    };

    updateScrollControls();
    window.addEventListener('resize', updateScrollControls);

    const slider = scrollRef.current;
    if (slider) {
      slider.addEventListener('scroll', updateScrollControls);
    }

    return () => {
      window.removeEventListener('resize', updateScrollControls);
      if (slider) {
        slider.removeEventListener('scroll', updateScrollControls);
      }
    };
  }, [searchResults]);

  // Scroll to start when new results are loaded
  useEffect(() => {
    if (searchResults.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({
        left: 0,
        behavior: 'smooth'
      });
    }
  }, [searchResults]);

  // Fetch website statistics
  const fetchWebsiteStats = async () => {
    try {
      setWebsiteStats(prev => ({ ...prev, loading: true, error: null }));

      const vehiclesResponse = await listingService.getListings({
        status: 'active',
        limit: 1
      }, 1);

      // Mock additional stats for now - these can be fetched from actual endpoints later
      setWebsiteStats({
        totalVehicles: vehiclesResponse.totalCount || 0,
        totalDealers: Math.floor((vehiclesResponse.totalCount || 0) * 0.15), // Estimate 15% are dealers
        totalProviders: Math.floor((vehiclesResponse.totalCount || 0) * 0.2), // Estimate 20% are providers
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching website stats:', error);
      setWebsiteStats(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load statistics'
      }));
    }
  };

  // Fetch most expensive car for promo display
  const fetchMostExpensiveCar = async () => {
    try {
      setPromoLoading(true);
      
      const response = await listingService.getListings({
        status: 'active',
        sort: '-price',
        limit: 1
      }, 1);

      if (response.listings && response.listings.length > 0) {
        setMostExpensiveCar(response.listings[0]);
      }
    } catch (error) {
      console.error('Error fetching most expensive car:', error);
    } finally {
      setPromoLoading(false);
    }
  };

  // Handle carousel scroll
  const scroll = (direction) => {
    if (!scrollRef.current) return;

    const scrollAmount = 316; // Width of one card plus gap
    const currentScroll = scrollRef.current.scrollLeft;
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;

    if (direction === 'left' && currentScroll > 0) {
      const newScrollLeft = Math.max(0, currentScroll - scrollAmount);
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    } else if (direction === 'right' && currentScroll < maxScroll) {
      const newScrollLeft = direction === 'left'
        ? Math.max(0, currentScroll - scrollAmount)
        : Math.min(maxScroll, currentScroll + scrollAmount);

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  // Calculate maximum car price based on inputs
  const calculateBuyingPower = () => {
    const monthly = parseFloat(monthlyBudget) || 0;
    const initialDeposit = parseFloat(deposit) || 0;
    const trade = parseFloat(tradeAmount) || 0;
    const term = parseInt(termLength) || 72;
    const rate = interestRate / 100 / 12;

    if (monthly <= 0) {
      setBuyingPower(initialDeposit + trade);
      return;
    }

    let loanAmount;
    if (rate > 0) {
      loanAmount = monthly * ((1 - Math.pow(1 + rate, -term)) / rate);
    } else {
      loanAmount = monthly * term;
    }

    const total = Math.round(loanAmount + initialDeposit + trade);
    setBuyingPower(total);
  };

  // Format currency with Pula symbol
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-BW', {
      style: 'currency',
      currency: 'BWP',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0
    }).format(value).replace('BWP', 'P');
  };

  // Fetch vehicles that match the budget
  const fetchMatchingVehicles = async () => {
    if (buyingPower <= 0) {
      setError('Please enter a valid budget to search for vehicles.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const response = await listingService.getListings({
        maxPrice: buyingPower,
        status: 'active',
        sort: '-createdAt',
        limit: 12
      }, 1);
      
      setSearchResults(response.listings || []);
    } catch (err) {
      console.error('Error fetching matching vehicles:', err);
      setError('Failed to find matching vehicles. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    fetchMatchingVehicles();
  };

  // Handle vehicle card click
  const handleCardClick = (car) => {
    navigate(`/marketplace/${car._id}`);
  };

  // Get primary image URL from car with S3 support
  const getCarImageUrl = (car) => {
    if (!car || !car.images || car.images.length === 0) {
      return '/images/placeholders/car.jpg';
    }

    const primaryImage = car.images.find(img => img.isPrimary) || car.images[0];
    
    if (typeof primaryImage === 'string') {
      return primaryImage;
    } else if (primaryImage && typeof primaryImage === 'object' && primaryImage.url) {
      return primaryImage.url;
    }
    
    return '/images/placeholders/car.jpg';
  };

  return (
    <section className="budget-search-section">
      <div className="budget-section-container">
        <div className="budget-calculator" ref={budgetCalculatorRef}>
          <div className="budget-section-header">
            <h2>Find your perfect car</h2>
            <p>Calculate how much car you can afford, then see matching vehicles</p>
          </div>
          
          <div className="calculator-header">
            <div className="buying-power">
              <span className="buying-power-amount pula-price">{formatCurrency(buyingPower)}</span>
              <span className="buying-power-label">Estimated buying power</span>
            </div>
            <span className="calculator-disclaimer">Based on {interestRate}% Interest</span>
          </div>

          <form className="budget-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="monthlyBudget">
                Monthly budget
                <span className="info-icon" data-tooltip="How much can you afford to pay each month for your car loan.">ⓘ</span>
              </label>
              <div className="input-container">
                <span className="pula-prefix">P</span>
                <input
                  type="number"
                  id="monthlyBudget"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  placeholder="5 000"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="deposit">
                Deposit
                <span className="info-icon" data-tooltip="The amount you can pay upfront to reduce your loan amount.">ⓘ</span>
              </label>
              <div className="input-container">
                <span className="pula-prefix">P</span>
                <input
                  type="number"
                  id="deposit"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  placeholder="35 000"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="termLength">Term Length</label>
              <div className="select-container">
                <select
                  id="termLength"
                  value={termLength}
                  onChange={(e) => setTermLength(e.target.value)}
                >
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                  <option value="36">36 months</option>
                  <option value="48">48 months</option>
                  <option value="60">60 months</option>
                  <option value="72">72 months</option>
                  <option value="84">84 months</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tradeAmount">
                Trade Amount
                <button className="value-car-button" type="button" onClick={() => navigate('/value-my-car')}>
                  Value My Car
                </button>
              </label>
              <div className="input-container">
                <span className="pula-prefix">P</span>
                <input
                  type="number"
                  id="tradeAmount"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group form-group-full">
              <div className="interest-slider">
                <div className="interest-slider-header">
                  <label htmlFor="interestRate">Interest Rate</label>
                  <span className="interest-slider-value">{interestRate}% (Good credit)</span>
                </div>
                <input
                  type="range"
                  id="interestRate"
                  min="6"
                  max="20"
                  step="0.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: `linear-gradient(to right, #ff3300 0%, #ff3300 ${(interestRate - 6) * 100 / 14}%, rgba(255, 255, 255, 0.1) ${(interestRate - 6) * 100 / 14}%, rgba(255, 255, 255, 0.1) 100%)`
                  }}
                />
                <div className="interest-slider-labels">
                  <span>6% (Excellent)</span>
                  <span>13% (Average)</span>
                  <span>20% (Poor)</span>
                </div>
              </div>
            </div>

            <button type="submit" className="search-button" disabled={loading}>
              {loading ? 'Searching...' : 'See my matches'}
            </button>
          </form>
        </div>

        <div className="budget-results">
          {loading && (
            <div className="results-loading">
              <div className="loader"></div>
            </div>
          )}
          
          {error && (
            <div className="results-error">
              <p>{error}</p>
              <button onClick={fetchMatchingVehicles} className="retry-button">Try Again</button>
            </div>
          )}
          
          {!loading && !error && searchResults.length > 0 && (
            <div className="results-container">
              <div className="results-header">
                <h3>Vehicles within your budget</h3>
                <div className="scroll-controls">
                  <button 
                    className={`scroll-button left ${!showControls.left ? 'disabled' : ''}`}
                    onClick={() => scroll('left')}
                    disabled={!showControls.left}
                    aria-label="Scroll left"
                  >
                    ‹
                  </button>
                  <button 
                    className={`scroll-button right ${!showControls.right ? 'disabled' : ''}`}
                    onClick={() => scroll('right')}
                    disabled={!showControls.right}
                    aria-label="Scroll right"
                  >
                    ›
                  </button>
                </div>
              </div>
              <div className="results-scroll" ref={scrollRef}>
                {searchResults.map(car => (
                  <div key={car._id} className="vehicle-card-wrapper">
                    <VehicleCard
                      car={car}
                      onClick={() => handleCardClick(car)}
                    />
                  </div>
                ))}
              </div>
              <div className="view-all-container">
                <button 
                  className="view-all-button"
                  onClick={() => navigate(`/marketplace?maxPrice=${buyingPower}`)}
                >
                  View all {searchResults.length}+ matches
                </button>
              </div>
            </div>
          )}

          {!loading && !error && searchResults.length === 0 && hasSearched && (
            <div className="no-results">
              <div className="no-results-content">
                <h3>No vehicles found within your budget</h3>
                <p>Try adjusting your budget parameters or explore our marketplace.</p>
                <div className="budget-action-buttons">
                  <button 
                    className="budget-action-button secondary"
                    onClick={() => navigate('/marketplace')}
                  >
                    Browse Marketplace
                  </button>
                  <button 
                    className="budget-action-button secondary"
                    onClick={() => navigate('/dealerships')}
                  >
                    View Dealerships
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {!loading && !error && searchResults.length === 0 && !hasSearched && (
            <div className="budget-promo">
              <div className="budget-promo-content">
                <div className="promo-text-section">
                  <h3>Dream Car, Real Budget</h3>
                  <p className="promo-tagline">
                    Discover luxury within your reach
                  </p>
                  <p className="promo-description">
                    Our smart calculator analyzes your finances to show 
                    you exactly what you can afford from our extensive inventory.
                  </p>
                  
                  {mostExpensiveCar && !promoLoading && (
                    <div className="promo-car-highlight">
                      <div className="promo-car-info">
                        <span className="promo-car-label">FEATURED PREMIUM VEHICLE:</span>
                        <span className="promo-car-name">
                          {mostExpensiveCar.make} {mostExpensiveCar.model} {mostExpensiveCar.year}
                        </span>
                        <span className="promo-car-price">
                          {formatCurrency(mostExpensiveCar.price)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="promo-image-section">
                  {mostExpensiveCar && !promoLoading ? (
                    <div className="budget-promo-image">
                      <img 
                        src={getCarImageUrl(mostExpensiveCar)} 
                        alt={`${mostExpensiveCar.make} ${mostExpensiveCar.model}`}
                        onError={(e) => {
                          e.target.src = '/images/placeholders/car.jpg';
                        }}
                      />
                      <div className="promo-image-overlay">
                        <div className="promo-stats">
                          <div className="promo-stat">
                            <span className="stat-number">{websiteStats.totalVehicles}</span>
                            <span className="stat-label">Total Vehicles</span>
                          </div>
                          <div className="promo-stat">
                            <span className="stat-number">{websiteStats.totalDealers}</span>
                            <span className="stat-label">Dealers</span>
                          </div>
                          <div className="promo-stat">
                            <span className="stat-number">{websiteStats.totalProviders}</span>
                            <span className="stat-label">Providers</span>
                          </div>
                        </div>
                        <div className="stats-disclaimer">
                          <span>* Estimated numbers</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="promo-image-placeholder">
                      <div className="loader"></div>
                    </div>
                  )}
                </div>

                <div className="budget-action-buttons">
                  <button 
                    className="budget-action-button premium"
                    onClick={() => navigate('/marketplace')}
                  >
                    Calculate My Budget
                  </button>
                  <button 
                    className="budget-action-button secondary"
                    onClick={() => navigate('/marketplace')}
                  >
                    Browse All Cars
                  </button>
                </div>

                <div className="promo-features">
                  <div className="feature-item">
                    <span className="feature-icon">🔍</span>
                    <span className="feature-text">Smart Search</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">💰</span>
                    <span className="feature-text">Budget Analysis</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🚗</span>
                    <span className="feature-text">Quality Verified</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">⚡</span>
                    <span className="feature-text">Fast Matching</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BudgetSearch;