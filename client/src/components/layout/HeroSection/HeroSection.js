// src/components/layout/HeroSection/HeroSection.js - With authentication integration
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js'; // NEW: Added authentication
import { statsService } from '../../../services/statsService.js';
import { listingService } from '../../../services/listingService.js';
import QuickFeedbackButton from '../../shared/QuickFeedbackButton/QuickFeedbackButton.js';
import './HeroSection.css';

const HeroSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth(); // NEW: Added authentication context
  
  const [activeTab, setActiveTab] = useState('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreparation, setShowPreparation] = useState(false);
  const [stats, setStats] = useState({
    carListings: 0,
    happyCustomers: 0,
    verifiedDealers: 0,
    transportProviders: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  
  // Savings data state with error handling
  const [savingsData, setSavingsData] = useState({
    totalSavings: 0,
    savingsCount: 0,
    loading: true,
    error: false
  });

  // Memoized popular search options
  const popularSearches = useMemo(() => [
    { type: 'make', value: 'BMW', label: 'BMW' },
    { type: 'make', value: 'Mercedes-Benz', label: 'Mercedes' },
    { type: 'make', value: 'Toyota', label: 'Toyota' },
    { type: 'make', value: 'Audi', label: 'Audi' }
  ], []);

  // Debounced search function
  const debouncedSearch = useCallback((query) => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Fetch website stats with error handling and retry
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const fetchWebsiteStats = async () => {
      setStatsLoading(true);
      setStatsError(false);
      
      try {
        const data = await statsService.getWebsiteStats();
        setStats(data);
        setStatsError(false);
      } catch (error) {
        console.error('Error fetching website statistics:', error);
        
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(fetchWebsiteStats, 2000 * retryCount);
          return;
        }
        
        // Fallback data for production
        setStats({
          carListings: 200,
          happyCustomers: 450,
          verifiedDealers: 20,
          transportProviders: 10
        });
        setStatsError(true);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchWebsiteStats();
  }, []);

  // Fetch savings data with enhanced error handling
  useEffect(() => {
    let isMounted = true;
    
    const fetchSavingsData = async () => {
      if (!isMounted) return;
      
      try {
        setSavingsData(prev => ({ ...prev, loading: true, error: false }));
        
        const response = await listingService.getListings({}, 1, 100);
        
        if (!isMounted) return;
        
        if (response && response.listings) {
          let totalSavings = 0;
          let savingsCount = 0;
          
          response.listings.forEach(car => {
            if (car && car.priceOptions && car.priceOptions.showSavings) {
              const { originalPrice, savingsAmount } = car.priceOptions;
              
              let carSavings = 0;
              if (savingsAmount && savingsAmount > 0) {
                carSavings = savingsAmount;
              } else if (originalPrice && originalPrice > car.price) {
                carSavings = originalPrice - car.price;
              }
              
              if (carSavings > 0) {
                totalSavings += carSavings;
                savingsCount++;
              }
            }
          });
          
          setSavingsData({
            totalSavings,
            savingsCount,
            loading: false,
            error: false
          });
        } else {
          setSavingsData({
            totalSavings: 0,
            savingsCount: 0,
            loading: false,
            error: false
          });
        }
      } catch (error) {
        console.error('Error fetching savings data:', error);
        if (isMounted) {
          setSavingsData({
            totalSavings: 0,
            savingsCount: 0,
            loading: false,
            error: true
          });
        }
      }
    };

    fetchSavingsData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Enhanced search change handler
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.length > 2) {
      debouncedSearch(value);
    }
  }, [debouncedSearch]);

  // Enhanced key press handler
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(searchQuery);
    }
  }, [searchQuery]);

  // Enhanced search handler with better validation
  const handleSearch = useCallback(async (query = searchQuery) => {
    if (loading) return;
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      navigate('/marketplace');
      return;
    }

    setLoading(true);
    
    try {
      const searchParams = new URLSearchParams();
      const currentYear = new Date().getFullYear();
      const yearMatch = trimmedQuery.match(/^\d{4}$/);
      
      if (yearMatch && parseInt(trimmedQuery) >= 1990 && parseInt(trimmedQuery) <= currentYear + 1) {
        searchParams.set('minYear', trimmedQuery);
        searchParams.set('maxYear', trimmedQuery);
      } else if (/^p?\d+$/i.test(trimmedQuery)) {
        const priceValue = trimmedQuery.replace(/^p/i, '');
        searchParams.set('maxPrice', priceValue);
      } else {
        searchParams.set('search', trimmedQuery);
      }
      
      navigate(`/marketplace?${searchParams.toString()}`);
    } catch (error) {
      console.error('Search error:', error);
      navigate(`/marketplace?search=${encodeURIComponent(trimmedQuery)}`);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, loading, navigate]);

  // Enhanced quick search handler
  const handleQuickSearch = useCallback((type, value) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.set(type, value);
      navigate(`/marketplace?${searchParams.toString()}`);
    } catch (error) {
      console.error('Quick search error:', error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, [loading, navigate]);

  // Enhanced tab click handler
  const handleTabClick = useCallback((tab) => {
    if (tab === 'rentals') {
      navigate('/services?category=car-rentals');
    } else if (tab === 'transport') {
      navigate('/services?category=transport');
    } else {
      setActiveTab(tab);
    }
  }, [navigate]);

  // Show preparation step instead of direct WhatsApp
  const handleShowPreparation = useCallback(() => {
    setShowPreparation(true);
    setTimeout(() => {
      const preparationElement = document.querySelector('.bcc-hero-sell-preparation');
      if (preparationElement) {
        preparationElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  }, []);

  // Hide preparation and go back to options
  const handleHidePreparation = useCallback(() => {
    setShowPreparation(false);
  }, []);

  // UPDATED: Car listing redirect with authentication check
  const handleWhatsAppClick = useCallback(() => {
    try {
      // NEW: Check authentication first
      if (!isAuthenticated) {
        navigate('/login', { 
          state: { 
            from: '/profile?tab=vehicles&action=list',
            message: 'Please login to list your car for sale'
          }
        });
        return;
      }

      // If authenticated, go to profile
      navigate('/profile?tab=vehicles&action=list');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to WhatsApp if there's an error
      const whatsappNumber = '+26774122453';
      const message = encodeURIComponent(
        'Hi! I would like to list my car for sale on BW Car Culture.\n\n' +
        'I have prepared:\n' +
        '✓ Quality photos from multiple angles\n' +
        '✓ Complete vehicle details and documents\n' +
        '✓ Service history information\n' +
        '✓ Realistic pricing research\n\n' +
        'Please help me get started with the listing process.'
      );
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
      
      if (typeof window !== 'undefined') {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    }
  }, [isAuthenticated, navigate]);

  // UPDATED: Valuation redirect with authentication check
  const handleCallClick = useCallback(() => {
    try {
      // NEW: Check authentication first
      if (!isAuthenticated) {
        navigate('/login', { 
          state: { 
            from: '/profile?tab=vehicles&action=valuation',
            message: 'Please login to get your car valued'
          }
        });
        return;
      }

      // If authenticated, go to profile
      navigate('/profile?tab=vehicles&action=valuation');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to phone call if there's an error
      const phoneNumber = '+26774122453';
      if (typeof window !== 'undefined') {
        window.location.href = `tel:${phoneNumber}`;
      }
    }
  }, [isAuthenticated, navigate]);

  // Savings click handler
  const handleSavingsClick = useCallback(() => {
    navigate('/marketplace?section=savings');
  }, [navigate]);

  // Format numbers with enhanced formatting
  const formatNumber = useCallback((num) => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return new Intl.NumberFormat('en-US').format(Math.floor(num));
  }, []);

  // Format price with Pula symbol
  const formatPrice = useCallback((amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'P0';
    return `P${new Intl.NumberFormat('en-US').format(Math.floor(amount))}`;
  }, []);

  // Memoized stats display
  const statsDisplay = useMemo(() => [
    {
      key: 'carListings',
      value: stats.carListings,
      label: 'Cars Listed',
      suffix: '+'
    },
    {
      key: 'happyCustomers',
      value: stats.happyCustomers,
      label: 'Service Providers',
      suffix: '+'
    },
    {
      key: 'verifiedDealers',
      value: 100,
      label: 'Verified Dealers',
      suffix: '%'
    },
    {
      key: 'transportProviders',
      value: stats.transportProviders,
      label: 'Transport Providers',
      suffix: '+'
    }
  ], [stats]);

  return (
    <section className="bcc-hero-section">
      {/* Feedback Button in Top Right Corner */}
      <div className="bcc-hero-feedback-button">
        <QuickFeedbackButton 
          variant="secondary"
          size="small"
          label="Feedback"
          icon="💬"
          className="hero-feedback-btn"
        />
      </div>

      <div className="bcc-hero-content">
        <div className="bcc-hero-tabs">
          <button 
            className={`bcc-hero-tab-button ${activeTab === 'buy' ? 'active' : ''}`}
            onClick={() => handleTabClick('buy')}
            disabled={loading}
            aria-pressed={activeTab === 'buy'}
          >
            Buy a car
          </button>
          <button 
            className={`bcc-hero-tab-button ${activeTab === 'sell' ? 'active' : ''}`}
            onClick={() => handleTabClick('sell')}
            disabled={loading}
            aria-pressed={activeTab === 'sell'}
          >
            Sell my car
          </button>
          <button 
            className="bcc-hero-tab-button"
            onClick={() => handleTabClick('rentals')}
            disabled={loading}
          >
            Car Rentals
          </button>
          <button 
            className="bcc-hero-tab-button"
            onClick={() => handleTabClick('transport')}
            disabled={loading}
          >
            Public Transport
          </button>
        </div>

        {activeTab === 'buy' ? (
          <div className="bcc-hero-buy">
            <h1>Find your perfect car.</h1>
            <p>Get the best car ownership experience in Botswana.</p>
            
            <div className="bcc-hero-search-container">
              <div className="bcc-hero-search-bar">
                <input 
                  type="text" 
                  placeholder="Enter make, model, year, or price (e.g., BMW, X5, 2020, P200000)"
                  className="bcc-hero-search-input"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  aria-label="Search for vehicles"
                />
                <button 
                  className="bcc-hero-search-button" 
                  onClick={() => handleSearch()}
                  disabled={loading}
                  aria-label="Search vehicles"
                >
                  {loading ? (
                    <span className="bcc-hero-search-loading" aria-hidden="true">⟳</span>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
              
              <div className="bcc-hero-popular-searches">
                <span>Popular:</span>
                {popularSearches.map((search, index) => (
                  <button 
                    key={index}
                    onClick={() => handleQuickSearch(search.type, search.value)}
                    disabled={loading}
                    aria-label={`Search for ${search.label} vehicles`}
                  >
                    {search.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Enhanced Savings Showcase */}
            {!savingsData.loading && !savingsData.error && savingsData.savingsCount > 0 && (
              <div className="bcc-hero-savings-showcase">
                <div className="bcc-savings-badge">
                  <div className="bcc-savings-badge-content">
                    <div className="bcc-savings-icon">💰</div>
                    <div className="bcc-savings-info">
                      <div className="bcc-savings-label">Total Available Savings</div>
                      <div className="bcc-savings-amount">{formatPrice(savingsData.totalSavings)}</div>
                    </div>
                  </div>
                  <button 
                    className="bcc-savings-action-btn"
                    onClick={handleSavingsClick}
                    disabled={loading}
                    aria-label="View all savings deals"
                  >
                    View Deals
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14m-7-7 7 7-7 7"/>
                    </svg>
                  </button>
                </div>
                <p className="bcc-savings-subtitle">
                  {savingsData.savingsCount} vehicles with exclusive savings available
                </p>
              </div>
            )}

            <div className="bcc-hero-features">
              <div className="bcc-hero-feature">
                <span className="bcc-hero-feature-icon">✓</span>
                <span>Compare prices from local dealers</span>
              </div>
              <div className="bcc-hero-feature">
                <span className="bcc-hero-feature-icon">✓</span>
                <span>100% verified listings</span>
              </div>
              <div className="bcc-hero-feature">
                <span className="bcc-hero-feature-icon">✓</span>
                <span>Professional car inspection and accurate reports</span>
              </div>
              <div className="bcc-hero-feature">
                <span className="bcc-hero-feature-icon">✓</span>
                <span>Free valuation service</span>
              </div>
            </div>
          </div>
        ) : activeTab === 'sell' ? (
          <div className="bcc-hero-sell">
            <h1>Sell Faster. Smarter. Nationwide.</h1>
            <p>Tap into Botswana's #1 automotive ecosystem. Get maximum exposure, real buyers, and support every step of the way.</p>

            {/* UPDATED: Pricing Information Section - Single P100 One-Time Payment */}
            <div className="bcc-hero-sell-pricing-section">
              <div className="bcc-hero-sell-pricing-header">
                <h3>Simple, Transparent Pricing</h3>
                <p>One price. Complete coverage. Maximum exposure for your vehicle.</p>
              </div>
              
              <div className="bcc-hero-sell-pricing-tiers">
                {/* Single Pricing Tier - One-Time Payment */}
                <div className="bcc-hero-sell-pricing-tier bcc-hero-sell-tier-popular" style={{maxWidth: '420px', margin: '0 auto'}}>
                  <div className="bcc-hero-sell-tier-badge">Best Value</div>
                  <div className="bcc-hero-sell-tier-header">
                    <div className="bcc-hero-sell-tier-price">P100</div>
                    <div className="bcc-hero-sell-tier-period">one-time</div>
                  </div>
                  <div className="bcc-hero-sell-tier-value">Complete Package</div>
                  <div className="bcc-hero-sell-tier-features">
                    <span>✓ Website listing with multiple photos</span>
                    <span>✓ Instagram promotion & marketing</span>
                    <span>✓ Facebook promotion & marketing</span>
                    <span>✓ WhatsApp promotion & marketing</span>
                    <span>✓ Direct contact with buyers</span>
                    <span>✓ Professional listing support</span>
                  </div>
                  <div style={{
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#c9c9c9',
                    fontSize: '0.85rem',
                    textAlign: 'center'
                  }}>
                    Pay once, list until sold. No hidden fees.
                  </div>
                </div>
              </div>
              
              <div className="bcc-hero-sell-pricing-dealer-note">
                <div className="bcc-hero-sell-dealer-notice">
                  <strong>Are you a dealer?</strong>
                  <p>Custom packages are available for dealerships. Contact us for special rates and premium features.</p>
                  <button 
                    className="bcc-hero-sell-dealer-contact-btn"
                    onClick={() => {
                      const whatsappNumber = '+26774122453';
                      const message = encodeURIComponent('Hi! I am a car dealer interested in listing vehicles on Bw Car Culture. Please provide information about dealer packages and pricing.');
                      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
                    }}
                  >
                    Contact Us on WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {/* Initial sell options */}
            <div className="bcc-hero-sell-options">
              <div className="bcc-hero-sell-option">
                <div className="bcc-hero-option-header">
                  <span className="bcc-hero-option-icon">📊</span>
                  <h3>Instant Valuation</h3>
                </div>
                <p>Get a guaranteed price and sell your car fast.</p>
                <button 
                  className="bcc-hero-option-button bcc-hero-call-button"
                  onClick={handleCallClick}
                  disabled={loading}
                  aria-label="Call for vehicle valuation"
                >
                  <span className="bcc-hero-button-icon">📞</span>
                  {/* UPDATED: Dynamic button text based on auth */}
                  {isAuthenticated ? 'Get Valuation' : 'Login for Valuation'}
                </button>
              </div>

              <div className="bcc-hero-sell-option">
                <div className="bcc-hero-option-header">
                  <span className="bcc-hero-option-icon">🚗</span>
                  <h3>List and sell my Car</h3>
                </div>
                <p>Reach thousands of buyers and sell your car fast for a fair price.</p>
                <button 
                  className="bcc-hero-option-button bcc-hero-whatsapp-button"
                  onClick={handleShowPreparation}
                  disabled={loading}
                  aria-label="Get preparation guidelines for listing your vehicle"
                >
                  <span className="bcc-hero-button-icon">📝</span>
                  {/* UPDATED: Dynamic button text based on auth */}
                  {isAuthenticated ? 'List My Car' : 'Login to List Car'}
                </button>
              </div>
            </div>

            {/* Conditional Preparation Section */}
            {showPreparation && (
              <div className="bcc-hero-sell-preparation" id="preparation-section">
                <div className="bcc-preparation-header">
                  <h3>Before You Proceed - Get the Best Price</h3>
                </div>
                <div className="bcc-preparation-content">
                  <p>To ensure you get the best price and sell quickly, please prepare the following information:</p>
                  <div className="bcc-preparation-grid">
                    <div className="bcc-preparation-item">
                      <div className="bcc-prep-content">
                        <h4>📸 Quality Photos</h4>
                        <ul>
                          <li>Multiple angles (front, back, sides, interior)</li>
                          <li>Engine bay and dashboard photos</li>
                          <li>Clear, well-lit images</li>
                          <li>Show any damage honestly</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bcc-preparation-item">
                      <div className="bcc-prep-content">
                        <h4>📋 Vehicle Details</h4>
                        <ul>
                          <li>Registration documents</li>
                          <li>Service history records</li>
                          <li>Exact mileage reading</li>
                          <li>Any modifications or repairs</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bcc-preparation-item">
                      <div className="bcc-prep-content">
                        <h4>🔧 Vehicle Condition</h4>
                        <ul>
                          <li>Recent service information</li>
                          <li>Known issues or problems</li>
                          <li>Tire condition</li>
                          <li>Accident history (if any)</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bcc-preparation-item">
                      <div className="bcc-prep-content">
                        <h4>💰 Pricing Research</h4>
                        <ul>
                          <li>Check similar cars online</li>
                          <li>Consider your car's unique features</li>
                          <li>Be realistic about condition</li>
                          <li>Factor in market demand</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bcc-preparation-tip">
                    <div className="bcc-tip-content">
                      <strong>💡 Pro Tip:</strong> Vehicles with complete information and quality photos sell 3x faster and for up to 15% more than incomplete listings!
                    </div>
                  </div>

                  {/* Action buttons for preparation section */}
                  <div className="bcc-preparation-actions">
                    <button 
                      className="bcc-preparation-ready-button"
                      onClick={handleWhatsAppClick}
                      disabled={loading}
                      aria-label="I'm ready - start listing process"
                    >
                      <span className="bcc-prep-button-icon">✓</span>
                      {/* UPDATED: Dynamic button text based on auth */}
                      {isAuthenticated ? "I'm Ready - Start Listing" : "I'm Ready - Login to List"}
                    </button>
                    <button 
                      className="bcc-preparation-back-button"
                      onClick={handleHidePreparation}
                      disabled={loading}
                      aria-label="Go back to options"
                    >
                      <span className="bcc-prep-button-icon">←</span>
                      Go Back
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bcc-hero-features">
              <div className="bcc-hero-feature">
                <span className="bcc-hero-feature-icon">✓</span>
                <span>Access to thousands of growing local and international buyers</span>
              </div>
              <div className="bcc-hero-feature">
                <span className="bcc-hero-feature-icon">✓</span>
                <span>Dedicated and professional digital sales support</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Enhanced Stats Section */}
      <div className="bcc-hero-stats">
        {statsDisplay.map((stat) => (
          <div key={stat.key} className="bcc-hero-stat">
            {statsLoading ? (
              <div className="bcc-hero-stat-loading" aria-label="Loading statistics"></div>
            ) : (
              <>
                <span className="bcc-hero-stat-number">
                  {formatNumber(stat.value)}{stat.suffix}
                </span>
                <span className="bcc-hero-stat-label">{stat.label}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default React.memo(HeroSection);