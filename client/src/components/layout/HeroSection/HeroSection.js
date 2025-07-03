// client/src/components/layout/HeroSection/HeroSection.js - Updated Part 1 (Lines 1-150)

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js';
import QuickFeedbackButton from '../../shared/QuickFeedbackButton/QuickFeedbackButton.js';
import './HeroSection.css';

const HeroSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreparation, setShowPreparation] = useState(false);
  
  // Sample stats - replace with actual data from API
  const [stats, setStats] = useState({
    carListings: 1250,
    happyCustomers: 850,
    verifiedDealers: 100,
    transportProviders: 125
  });

  // Handle search functionality
  const handleSearch = useCallback(async () => {
    if (loading) return;
    
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      
      // Check if it's a price search (contains numbers/currency)
      const priceMatch = trimmedQuery.match(/(\d+)([km]?)/i);
      if (priceMatch) {
        const price = parseInt(priceMatch[1]);
        if (priceMatch[2]?.toLowerCase() === 'k') {
          searchParams.set('maxPrice', price * 1000);
        } else {
          searchParams.set('maxPrice', price);
        }
      } else {
        // Text search
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

  // NEW: Handle car listing redirect - check authentication first
  const handleListMyCarClick = useCallback(() => {
    if (!isAuthenticated) {
      // Redirect to login with intent to list car
      navigate('/login', { 
        state: { 
          from: '/profile?tab=vehicles&action=list',
          message: 'Please login to list your car for sale'
        }
      });
    } else {
      // Redirect to user profile vehicles tab with listing action
      navigate('/profile?tab=vehicles&action=list');
    }
  }, [isAuthenticated, navigate]);

  // NEW: Handle instant valuation redirect - check authentication first
  const handleInstantValuationClick = useCallback(() => {
    if (!isAuthenticated) {
      // Redirect to login with intent for valuation
      navigate('/login', { 
        state: { 
          from: '/profile?tab=vehicles&action=valuation',
          message: 'Please login to get your car valued'
        }
      });
    } else {
      // Redirect to user profile with valuation action
      navigate('/profile?tab=vehicles&action=valuation');
    }
  }, [isAuthenticated, navigate]);

  // Show preparation step (for reference/education)
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

  // Legacy call handler (keep for fallback)
  const handleCallClick = useCallback(() => {
    try {
      const phoneNumber = '+26774122453';
      if (typeof window !== 'undefined') {
        window.location.href = `tel:${phoneNumber}`;
      }
    } catch (error) {
      console.error('Call click error:', error);
    }
  }, []);

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
            className={`bcc-hero-tab-button ${activeTab === 'rentals' ? 'active' : ''}`}
            onClick={() => handleTabClick('rentals')}
            disabled={loading}
            aria-pressed={activeTab === 'rentals'}
          >
            Car rentals
          </button>
          <button 
            className={`bcc-hero-tab-button ${activeTab === 'transport' ? 'active' : ''}`}
            onClick={() => handleTabClick('transport')}
            disabled={loading}
            aria-pressed={activeTab === 'transport'}
          >
            Transport
          </button>
        </div>

        // client/src/components/layout/HeroSection/HeroSection.js - Updated Part 2 (Lines 151-400)

        {/* Sell Tab Content */}
        {activeTab === 'sell' && (
          <div className="bcc-hero-sell">
            <h1>Sell Faster. Smarter. Nationwide.</h1>
            <p>Tap into Botswana's #1 automotive ecosystem. Get maximum exposure, real buyers, and support every step of the way.</p>

            {/* Pricing Information Section */}
            <div className="bcc-hero-sell-pricing-section">
              <div className="bcc-hero-sell-pricing-header">
                <h3>Listing Prices for Private Sellers</h3>
                <p>Choose the exposure level that gets your car sold, for the right value and fast.</p>
              </div>
              
              <div className="bcc-hero-sell-pricing-tiers">
                <div className="bcc-hero-sell-pricing-tier">
                  <div className="bcc-hero-sell-tier-header">
                    <div className="bcc-hero-sell-tier-price">P50</div>
                    <div className="bcc-hero-sell-tier-period">/month</div>
                  </div>
                  <div className="bcc-hero-sell-tier-value">Basic</div>
                  <div className="bcc-hero-sell-tier-features">
                    <span>✓ Multiple photos</span>
                    <span>✓ Contact leads</span>
                    <span>✓ Social Media Marketing</span>
                  </div>
                </div>
                
                <div className="bcc-hero-sell-pricing-tier bcc-hero-sell-tier-popular">
                  <div className="bcc-hero-sell-tier-badge">Most Popular</div>
                  <div className="bcc-hero-sell-tier-header">
                    <div className="bcc-hero-sell-tier-price">P100</div>
                    <div className="bcc-hero-sell-tier-period">/month</div>
                  </div>
                  <div className="bcc-hero-sell-tier-value">Standard</div>
                  <div className="bcc-hero-sell-tier-features">
                    <span>✓ 2x Social media marketing</span>
                    <span>✓ Premium placement</span>
                    <span>✓ Multiple photos</span>
                    <span>✓ Priority support</span>
                  </div>
                </div>
                
                <div className="bcc-hero-sell-pricing-tier">
                  <div className="bcc-hero-sell-tier-header">
                    <div className="bcc-hero-sell-tier-price">P200</div>
                    <div className="bcc-hero-sell-tier-period">/month</div>
                  </div>
                  <div className="bcc-hero-sell-tier-value">Premium</div>
                  <div className="bcc-hero-sell-tier-features">
                    <span>✓ 4x Social media marketing</span>
                    <span>✓ Premium priority placement</span>
                    <span>✓ Multiple photos</span>
                    <span>✓ Higher priority support</span>
                    <span>✓ Featured placement</span>
                    <span>✓ First access to new features</span>
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

            {/* UPDATED: Initial sell options - now redirect to profile/login */}
            <div className="bcc-hero-sell-options">
              <div className="bcc-hero-sell-option">
                <div className="bcc-hero-option-header">
                  <span className="bcc-hero-option-icon"></span>
                  <h3>Instant Valuation</h3>
                </div>
                <p>Get a quick estimate of your car's value and start the selling process.</p>
                <button 
                  className="bcc-hero-option-button bcc-hero-call-button"
                  onClick={handleInstantValuationClick}
                  disabled={loading}
                  aria-label="Get instant vehicle valuation"
                >
                  <span className="bcc-hero-button-icon"></span>
                  {isAuthenticated ? 'Get Valuation' : 'Login to Get Valuation'}
                </button>
              </div>

              <div className="bcc-hero-sell-option">
                <div className="bcc-hero-option-header">
                  <span className="bcc-hero-option-icon"></span>
                  <h3>List and sell my Car</h3>
                </div>
                <p>Reach thousands of buyers and sell your car fast for a fair price.</p>
                <button 
                  className="bcc-hero-option-button bcc-hero-whatsapp-button"
                  onClick={handleListMyCarClick}
                  disabled={loading}
                  aria-label="List your vehicle for sale"
                >
                  <span className="bcc-hero-button-icon"></span>
                  {isAuthenticated ? 'List My Car' : 'Login to List Car'}
                </button>
              </div>
            </div>

            {/* Preparation Information Section (Educational) */}
            {!showPreparation && (
              <div className="bcc-hero-sell-info-section">
                <div className="bcc-hero-sell-info-content">
                  <h4>New to selling online?</h4>
                  <p>Learn what you need to prepare for the best listing experience.</p>
                  <button 
                    className="bcc-hero-info-button"
                    onClick={handleShowPreparation}
                  >
                    Show Preparation Tips
                  </button>
                </div>
              </div>
            )}

            {/* Conditional Preparation Section - shows educational information */}
            {showPreparation && (
              <div className="bcc-hero-sell-preparation" id="preparation-section">
                <div className="bcc-preparation-header">
                  <h3>Before You List - Get the Best Price</h3>
                  <button 
                    className="bcc-preparation-close"
                    onClick={handleHidePreparation}
                    aria-label="Hide preparation tips"
                  >
                    ×
                  </button>
                </div>
                <div className="bcc-preparation-content">
                  <p>To ensure you get the best price and sell quickly, prepare the following information:</p>
                  <div className="bcc-preparation-grid">
                    <div className="bcc-preparation-item">
                      <div className="bcc-prep-content">
                        <h4>Quality Photos</h4>
                        <ul>
                          <li>Front, back, and side views</li>
                          <li>Interior dashboard and seats</li>
                          <li>Engine bay photos</li>
                          <li>Clear, well-lit images</li>
                          <li>Show any damage honestly</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bcc-preparation-item">
                      <div className="bcc-prep-content">
                        <h4>Vehicle Details</h4>
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
                        <h4>Vehicle Condition</h4>
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
                        <h4>Pricing Research</h4>
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
                      <strong>Pro Tip:</strong> Vehicles with complete information and quality photos sell 3x faster and for up to 15% more than incomplete listings!
                    </div>
                  </div>
                  
                  <div className="bcc-preparation-actions">
                    <button 
                      className="bcc-prep-action-button bcc-prep-primary"
                      onClick={handleListMyCarClick}
                    >
                      {isAuthenticated ? 'Start Listing Process' : 'Login to Start Listing'}
                    </button>
                    <button 
                      className="bcc-prep-action-button bcc-prep-secondary"
                      onClick={handleHidePreparation}
                    >
                      I'll Prepare Later
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Buy Tab Content */}
        {activeTab === 'buy' && (
          <div className="bcc-hero-buy">
            <h1>Find Your Dream Car</h1>
            <p>Discover thousands of quality vehicles from verified dealers and private sellers across Botswana.</p>
            
            <div className="bcc-hero-search-container">
              <div className="bcc-hero-search-box">
                <input
                  type="text"
                  placeholder="Search by make, model, year, or price..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={loading}
                  className="bcc-hero-search-input"
                />
                <button 
                  onClick={handleSearch}
                  disabled={loading || !searchQuery.trim()}
                  className="bcc-hero-search-button"
                  aria-label="Search for vehicles"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            <div className="bcc-hero-quick-search">
              <span className="bcc-hero-quick-label">Quick search:</span>
              <div className="bcc-hero-quick-buttons">
                <button 
                  onClick={() => handleQuickSearch('make', 'Toyota')}
                  disabled={loading}
                  className="bcc-hero-quick-button"
                >
                  Toyota
                </button>
                <button 
                  onClick={() => handleQuickSearch('make', 'BMW')}
                  disabled={loading}
                  className="bcc-hero-quick-button"
                >
                  BMW
                </button>
                <button 
                  onClick={() => handleQuickSearch('maxPrice', '100000')}
                  disabled={loading}
                  className="bcc-hero-quick-button"
                >
                  Under P100k
                </button>
                <button 
                  onClick={() => handleQuickSearch('condition', 'new')}
                  disabled={loading}
                  className="bcc-hero-quick-button"
                >
                  New Cars
                </button>
              </div>
            </div>

            {/* Savings Banner */}
            <div className="bcc-hero-savings-banner" onClick={handleSavingsClick}>
              <div className="bcc-savings-content">
                <span className="bcc-savings-icon">💰</span>
                <div className="bcc-savings-text">
                  <strong>Exclusive BW Car Culture Savings!</strong>
                  <span>Save up to P15,000 on select vehicles</span>
                </div>
                <span className="bcc-savings-arrow">→</span>
              </div>
            </div>
          </div>
        )}

        // client/src/components/layout/HeroSection/HeroSection.js - Updated Part 3 (Final - Lines 401-end)

        {/* Stats Section - shows on all tabs */}
        <div className="bcc-hero-stats">
          <div className="bcc-hero-stats-container">
            {statsDisplay.map((stat) => (
              <div key={stat.key} className="bcc-hero-stat-item">
                <div className="bcc-hero-stat-number">
                  {formatNumber(stat.value)}{stat.suffix}
                </div>
                <div className="bcc-hero-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
