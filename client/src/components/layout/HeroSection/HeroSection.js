// src/components/layout/HeroSection/HeroSection.js - With authentication integration
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js'; // NEW: Added authentication
import { statsService } from '../../../services/statsService.js';
import { dealerService } from '../../../services/dealerService.js';
import CarBackground3D from './CarBackground3D.js';
import './HeroSection.css';

const HeroSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // NEW: Added authentication context
  
  const [activeTab, setActiveTab] = useState('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('Select country');
  const [showPreparation, setShowPreparation] = useState(false);

  // Transport form state
  const [transportForm, setTransportForm] = useState({ from: '', to: '' });

  // Rentals form state
  const [rentalsForm, setRentalsForm] = useState({
    location: '', date: '', time: '', vehicleType: ''
  });
  const [stats, setStats] = useState({
    carListings: 0,
    happyCustomers: 0,
    verifiedDealers: 0,
    transportProviders: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  

  // Featured dealers for the bottom strip
  const [featuredDealers, setFeaturedDealers] = useState([]);
  const heroStripRef = useRef(null);

  useEffect(() => {
    dealerService.getDealers({ status: 'active', sellerType: 'dealership' }, 1)
      .then(res => setFeaturedDealers((res.dealers || []).filter(d => d.sellerType !== 'private').slice(0, 30)))
      .catch(() => {});
  }, []);

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

      try {
        const data = await statsService.getWebsiteStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching website statistics:', error);

        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(fetchWebsiteStats, 2000 * retryCount);
          return;
        }
      } finally {
        setStatsLoading(false);
      }
    };

    fetchWebsiteStats();
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
    setActiveTab(tab);
  }, []);

  // Submit transport form → navigate with query params
  const handleTransportSubmit = useCallback((e) => {
    e.preventDefault();
    const params = new URLSearchParams({ category: 'transport' });
    if (transportForm.from.trim()) params.set('from', transportForm.from.trim());
    if (transportForm.to.trim()) params.set('to', transportForm.to.trim());
    navigate(`/services?${params.toString()}`);
  }, [transportForm, navigate]);

  // Submit rentals form → navigate with query params
  const handleRentalsSubmit = useCallback((e) => {
    e.preventDefault();
    const params = new URLSearchParams({ category: 'car-rentals' });
    if (rentalsForm.location.trim()) params.set('location', rentalsForm.location.trim());
    if (rentalsForm.date) params.set('date', rentalsForm.date);
    if (rentalsForm.time) params.set('time', rentalsForm.time);
    if (rentalsForm.vehicleType) params.set('vehicleType', rentalsForm.vehicleType);
    navigate(`/services?${params.toString()}`);
  }, [rentalsForm, navigate]);

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


  // Format numbers with enhanced formatting
  const formatNumber = useCallback((num) => {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return new Intl.NumberFormat('en-US').format(Math.floor(num));
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
      key: 'verifiedDealers',
      value: stats.verifiedDealers,
      label: 'Verified Dealers',
      suffix: '+'
    },
    {
      key: 'happyCustomers',
      value: stats.happyCustomers,
      label: 'Happy Customers',
      suffix: '+'
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
      {/* 3D car background — desktop only, fades in when model loads */}
      <CarBackground3D sellMode={activeTab === 'sell'} />

      {/* Semi-transparent dark layer for content legibility */}
      <div className="bcc-hero-dark-overlay" aria-hidden="true" />

      <div className="bcc-hero-content">
        {/* Slogan */}
        <div className="bcc-hero-slogan" aria-label="All your mobility needs in one place">
          <span className="bcc-hero-slogan-dot" aria-hidden="true" />
          All your mobility needs in one place
          <span className="bcc-hero-slogan-dot" aria-hidden="true" />
        </div>

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
            Car Rentals
          </button>
          <button
            className={`bcc-hero-tab-button ${activeTab === 'transport' ? 'active' : ''}`}
            onClick={() => handleTabClick('transport')}
            disabled={loading}
            aria-pressed={activeTab === 'transport'}
          >
            Public Transport
          </button>
        </div>

        {/* Import Vehicles Button — only on Buy tab */}
        {activeTab === 'buy' && (
          <div className="bcc-import-wrapper">
            <div className="bcc-import-container">
              <div className="bcc-import-button">
                {/* Left: action label */}
                <button
                  className="bcc-import-action"
                  onClick={() => navigate(`/marketplace${selectedCountry !== 'Select country' ? `?country=${encodeURIComponent(selectedCountry)}` : ''}`)}
                  type="button"
                >
                  Import a car from
                </button>

                {/* Divider */}
                <span className="bcc-import-divider" />

                {/* Right: country selector */}
                <button
                  className="bcc-import-selector"
                  onClick={() => setShowImportDropdown(prev => !prev)}
                  type="button"
                >
                  <span className="bcc-import-country">{selectedCountry}</span>
                  <span className="bcc-import-arrow">{showImportDropdown ? '▲' : '▼'}</span>
                </button>
              </div>

              {showImportDropdown && (
                <div className="bcc-import-dropdown">
                  {['South Africa', 'Namibia', 'Zimbabwe', 'Zambia', 'Japan', 'China'].map(country => (
                    <button
                      key={country}
                      className={`bcc-import-option${selectedCountry === country ? ' selected' : ''}`}
                      onClick={() => {
                        setSelectedCountry(country);
                        setShowImportDropdown(false);
                      }}
                      type="button"
                    >
                      {country}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
                  onKeyDown={handleKeyPress}
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


          </div>
        ) : activeTab === 'sell' ? (
          <div className="bcc-hero-sell">
            <h1>Sell Faster. Smarter. Nationwide.</h1>
            <p>Tap into Botswana's #1 automotive ecosystem. Get maximum exposure, real buyers, and support every step of the way.</p>

            {/* Pricing Information Section */}
            <div className="bcc-hero-sell-pricing-section">
              <div className="bcc-hero-sell-pricing-header">
                <h3>Simple, Transparent Pricing</h3>
                <p>List for free. Boost when you're ready.</p>
              </div>

              <div className="bcc-hero-sell-pricing-tiers">
                {/* Free Tier */}
                <div className="bcc-hero-sell-pricing-tier">
                  <div className="bcc-hero-sell-tier-header">
                    <div className="bcc-hero-sell-tier-price">FREE</div>
                    <div className="bcc-hero-sell-tier-period">always</div>
                  </div>
                  <div className="bcc-hero-sell-tier-value">Standard Listing</div>
                  <div className="bcc-hero-sell-tier-features">
                    <span>✓ Website listing with multiple photos</span>
                    <span>✓ Direct contact with buyers</span>
                    <span>✓ Searchable across Botswana</span>
                    <span>✓ Listed until sold</span>
                  </div>
                </div>

                {/* Boost Tier */}
                <div className="bcc-hero-sell-pricing-tier bcc-hero-sell-tier-popular">
                  <div className="bcc-hero-sell-tier-badge">More Exposure</div>
                  <div className="bcc-hero-sell-tier-header">
                    <div className="bcc-hero-sell-tier-price">BWP 200</div>
                    <div className="bcc-hero-sell-tier-period">one-time</div>
                  </div>
                  <div className="bcc-hero-sell-tier-value">Social Media Boost</div>
                  <div className="bcc-hero-sell-tier-features">
                    <span>✓ Everything in the free listing</span>
                    <span>✓ Facebook — 685,000 followers</span>
                    <span>✓ Instagram — 15,000+ followers</span>
                    <span>✓ WhatsApp Channel — 10,000+ followers</span>
                    <span>✓ TikTok — 35,000+ followers</span>
                    <span>✓ Featured section on website</span>
                  </div>
                  <div style={{
                    marginTop: '1.5rem',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#c9c9c9',
                    fontSize: '0.82rem',
                    textAlign: 'center'
                  }}>
                    Pay via PayToCell or Orange Money — +267 72 573 475
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
                  <h3>Instant Valuation</h3>
                </div>
                <p>Get a guaranteed price and sell your car fast.</p>
                <button
                  className="bcc-hero-option-button bcc-hero-call-button"
                  onClick={handleCallClick}
                  disabled={loading}
                  aria-label="Call for vehicle valuation"
                >
                  {isAuthenticated ? 'Get Valuation' : 'Login for Valuation'}
                </button>
              </div>

              <div className="bcc-hero-sell-option">
                <div className="bcc-hero-option-header">
                  <h3>List and Sell My Car</h3>
                </div>
                <p>Reach thousands of buyers and sell your car fast for a fair price.</p>
                <button
                  className="bcc-hero-option-button bcc-hero-whatsapp-button"
                  onClick={handleShowPreparation}
                  disabled={loading}
                  aria-label="Get preparation guidelines for listing your vehicle"
                >
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
                        <h4>Quality Photos</h4>
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

                  {/* Action buttons for preparation section */}
                  <div className="bcc-preparation-actions">
                    <button
                      className="bcc-preparation-ready-button"
                      onClick={handleWhatsAppClick}
                      disabled={loading}
                      aria-label="I'm ready - start listing process"
                    >
                      {isAuthenticated ? "I'm Ready — Start Listing" : "I'm Ready — Login to List"}
                    </button>
                    <button
                      className="bcc-preparation-back-button"
                      onClick={handleHidePreparation}
                      disabled={loading}
                      aria-label="Go back to options"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : activeTab === 'transport' ? (
          <div className="bcc-hero-quickform">
            <h1>Plan your trip.</h1>
            <p>Tell us where you're headed and we'll find the best routes for you.</p>
            <form className="bcc-hero-quickform-fields" onSubmit={handleTransportSubmit}>
              <div className="bcc-hero-quickform-row">
                <div className="bcc-hero-quickform-field">
                  <label htmlFor="transport-from">From</label>
                  <input
                    id="transport-from"
                    type="text"
                    placeholder="e.g. Gaborone CBD"
                    value={transportForm.from}
                    onChange={e => setTransportForm(f => ({ ...f, from: e.target.value }))}
                  />
                </div>
                <div className="bcc-hero-quickform-arrow">→</div>
                <div className="bcc-hero-quickform-field">
                  <label htmlFor="transport-to">To</label>
                  <input
                    id="transport-to"
                    type="text"
                    placeholder="e.g. Francistown"
                    value={transportForm.to}
                    onChange={e => setTransportForm(f => ({ ...f, to: e.target.value }))}
                  />
                </div>
              </div>
              <div className="bcc-hero-quickform-actions">
                <button type="submit" className="bcc-hero-quickform-submit">
                  Find Routes
                </button>
                <button
                  type="button"
                  className="bcc-hero-quickform-skip"
                  onClick={() => navigate('/services?category=transport')}
                >
                  Browse all routes
                </button>
              </div>
            </form>
          </div>

        ) : activeTab === 'rentals' ? (
          <div className="bcc-hero-quickform">
            <h1>Book a rental.</h1>
            <p>Tell us what you need and we'll match you with the right vehicle.</p>
            <form className="bcc-hero-quickform-fields" onSubmit={handleRentalsSubmit}>
              <div className="bcc-hero-quickform-row bcc-hero-quickform-row--wrap">
                <div className="bcc-hero-quickform-field">
                  <label htmlFor="rental-location">Pickup Location</label>
                  <input
                    id="rental-location"
                    type="text"
                    placeholder="e.g. Gaborone, Francistown…"
                    value={rentalsForm.location}
                    onChange={e => setRentalsForm(f => ({ ...f, location: e.target.value }))}
                  />
                </div>
                <div className="bcc-hero-quickform-field">
                  <label htmlFor="rental-date">Date needed</label>
                  <input
                    id="rental-date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={rentalsForm.date}
                    onChange={e => setRentalsForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div className="bcc-hero-quickform-field">
                  <label htmlFor="rental-time">Time</label>
                  <input
                    id="rental-time"
                    type="time"
                    value={rentalsForm.time}
                    onChange={e => setRentalsForm(f => ({ ...f, time: e.target.value }))}
                  />
                </div>
                <div className="bcc-hero-quickform-field">
                  <label htmlFor="rental-type">Vehicle type</label>
                  <select
                    id="rental-type"
                    value={rentalsForm.vehicleType}
                    onChange={e => setRentalsForm(f => ({ ...f, vehicleType: e.target.value }))}
                  >
                    <option value="">Any vehicle</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV / 4x4</option>
                    <option value="bakkie">Bakkie / Pickup</option>
                    <option value="minibus">Minibus</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
              </div>
              <div className="bcc-hero-quickform-actions">
                <button type="submit" className="bcc-hero-quickform-submit">
                  Find Rentals
                </button>
                <button
                  type="button"
                  className="bcc-hero-quickform-skip"
                  onClick={() => navigate('/services?category=car-rentals')}
                >
                  Browse all rentals
                </button>
              </div>
            </form>
          </div>

        ) : null}
      </div>

      {/* Featured Dealerships strip — bottom of hero, replaces stats */}
      {featuredDealers.length > 0 && (
        <div className="bcc-hero-dealers">
          <div className="bcc-hero-dealers-label">Featured Dealerships</div>
          <div className="bcc-hero-dealers-row">
            <button
              className="bcc-hero-dealers-arrow"
              onClick={() => heroStripRef.current?.scrollBy({ left: -230, behavior: 'smooth' })}
              aria-label="Scroll left"
            >‹</button>
            <div className="bcc-hero-dealers-track" ref={heroStripRef}>
              {featuredDealers.map(dealer => {
                const logoSrc =
                  dealer.profile?.logo || dealer.logo?.url || dealer.logo ||
                  dealer.profilePicture?.url || dealer.profilePicture || null;
                const initials = (dealer.businessName || dealer.name || '?')
                  .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                const isVerified = dealer.verification?.isVerified || dealer.verification?.status === 'verified';
                return (
                  <button
                    key={dealer._id}
                    className="bcc-hero-dealer-card"
                    onClick={() => navigate(`/dealerships/${dealer._id}`)}
                    title={dealer.businessName || dealer.name}
                  >
                    <div className="bcc-hero-dealer-logo">
                      {logoSrc
                        ? <img src={logoSrc} alt={dealer.businessName} />
                        : <div className="bcc-hero-dealer-initials">{initials}</div>}
                    </div>
                    <div className="bcc-hero-dealer-name">
                      <span>{dealer.businessName || dealer.name}</span>
                      {isVerified && <span className="bcc-hero-dealer-tick" title="Verified">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              className="bcc-hero-dealers-arrow"
              onClick={() => heroStripRef.current?.scrollBy({ left: 230, behavior: 'smooth' })}
              aria-label="Scroll right"
            >›</button>
          </div>
        </div>
      )}
    </section>
  );
};

export default React.memo(HeroSection);