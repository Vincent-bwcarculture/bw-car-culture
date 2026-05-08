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
  const [prepCardIdx, setPrepCardIdx] = useState(0);
  const [showDealerReg, setShowDealerReg] = useState(false);
  const [dealerForm, setDealerForm] = useState({ name: '', business: '', phone: '', email: '' });

  // Transport form state
  const [transportForm, setTransportForm] = useState({ from: '', to: '', date: '', time: '' });

  // Rentals form state
  const [rentalsForm, setRentalsForm] = useState({
    location: '', date: '', time: '', vehicleType: '', budget: ''
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
    if (transportForm.date) params.set('date', transportForm.date);
    if (transportForm.time) params.set('time', transportForm.time);
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
    if (rentalsForm.budget) params.set('maxBudget', rentalsForm.budget);
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
            <h1>Sell Faster. Smarter.</h1>
            <p>Botswana's largest automotive audience. Real buyers, maximum exposure, zero hassle.</p>

            {showDealerReg ? (
              <div className="bcc-dealer-reg-section">
                <h3 className="bcc-dealer-reg-title">Register Your Dealership</h3>
                <p className="bcc-dealer-reg-sub">Choose a plan below and complete the form — our team will contact you within 24 hours to get you set up.</p>


                {/* Simple enquiry form */}
                <div className="bcc-dealer-reg-form">
                  <div className="bcc-dealer-reg-row">
                    <input className="bcc-dealer-reg-input" type="text" placeholder="Your name *" value={dealerForm.name} onChange={e => setDealerForm(f => ({ ...f, name: e.target.value }))} />
                    <input className="bcc-dealer-reg-input" type="text" placeholder="Business / dealership name *" value={dealerForm.business} onChange={e => setDealerForm(f => ({ ...f, business: e.target.value }))} />
                  </div>
                  <div className="bcc-dealer-reg-row">
                    <input className="bcc-dealer-reg-input" type="tel" placeholder="Phone number *" value={dealerForm.phone} onChange={e => setDealerForm(f => ({ ...f, phone: e.target.value }))} />
                    <input className="bcc-dealer-reg-input" type="email" placeholder="Email address" value={dealerForm.email} onChange={e => setDealerForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div className="bcc-dealer-reg-actions">
                    <button
                      className="bcc-dealer-reg-submit"
                      onClick={() => {
                        if (!dealerForm.name || !dealerForm.business || !dealerForm.phone) return;
                        const msg = encodeURIComponent(
                          `Hi! I'd like to register my dealership on BW Car Culture.\n\nName: ${dealerForm.name}\nBusiness: ${dealerForm.business}\nPhone: ${dealerForm.phone}\nEmail: ${dealerForm.email || 'Not provided'}`
                        );
                        window.open(`https://wa.me/+26774122453?text=${msg}`, '_blank');
                      }}
                    >
                      Submit via WhatsApp
                    </button>
                    <button className="bcc-dealer-reg-back" onClick={() => setShowDealerReg(false)}>← Back</button>
                  </div>
                </div>
              </div>
            ) : !showPreparation ? (
              <>
                {/* Two-path cards */}
                <div className="bcc-sell-paths">
                  {/* Free listing path */}
                  <div className="bcc-sell-path">
                    <div className="bcc-sell-path-price">
                      <span className="bcc-sell-path-amount">Free</span>
                      <span className="bcc-sell-path-period">always</span>
                    </div>
                    <h3 className="bcc-sell-path-title">Standard Listing</h3>
                    <ul className="bcc-sell-path-features">
                      <li>Multiple photos &amp; full description</li>
                      <li>Direct buyer contact</li>
                      <li>Searchable across Botswana</li>
                      <li>Live until sold</li>
                    </ul>
                    <button
                      className="bcc-sell-path-cta bcc-sell-path-cta--free"
                      onClick={handleShowPreparation}
                      disabled={loading}
                    >
                      {isAuthenticated ? 'List My Car' : 'Login to List'}
                    </button>
                  </div>

                  {/* Boost path */}
                  <div className="bcc-sell-path bcc-sell-path--featured">
                    <div className="bcc-sell-path-badge">Most Popular</div>
                    <div className="bcc-sell-path-price">
                      <span className="bcc-sell-path-amount">P200</span>
                      <span className="bcc-sell-path-period">one-time</span>
                    </div>
                    <h3 className="bcc-sell-path-title">Social Media Boost</h3>
                    <ul className="bcc-sell-path-features">
                      <li>Everything in free listing</li>
                      <li>Facebook — 685,000 followers</li>
                      <li>Instagram · TikTok · WhatsApp</li>
                      <li>Featured section on site</li>
                    </ul>
                    <button
                      className="bcc-sell-path-cta bcc-sell-path-cta--boost"
                      onClick={handleShowPreparation}
                      disabled={loading}
                    >
                      {isAuthenticated ? 'List &amp; Boost' : 'Login to Boost'}
                    </button>
                  </div>

                  {/* Valuation path */}
                  <div className="bcc-sell-path bcc-sell-path--valuation">
                    <div className="bcc-sell-path-price">
                      <span className="bcc-sell-path-amount">Free</span>
                      <span className="bcc-sell-path-period">estimate</span>
                    </div>
                    <h3 className="bcc-sell-path-title">Instant Valuation</h3>
                    <ul className="bcc-sell-path-features">
                      <li>Market-based price estimate</li>
                      <li>Know your car's true worth</li>
                      <li>Sell faster at the right price</li>
                      <li>No commitment required</li>
                    </ul>
                    <button
                      className="bcc-sell-path-cta bcc-sell-path-cta--free"
                      onClick={handleCallClick}
                      disabled={loading}
                    >
                      {isAuthenticated ? 'Get Valuation' : 'Login for Valuation'}
                    </button>
                  </div>
                </div>

                {/* Dealer strip */}
                <div className="bcc-sell-dealer-strip">
                  <span>Own a dealership?</span>
                  <button
                    className="bcc-dealer-reg-btn"
                    onClick={() => setShowDealerReg(true)}
                  >
                    Register Your Dealership
                  </button>
                </div>
              </>
            ) : (
              /* Preparation checklist */
              (() => {
                const prepCards = [
                  { icon: '📸', title: 'Quality Photos', items: ['Front, back, sides & interior', 'Engine bay & dashboard', 'Clear, well-lit images', 'Show any damage honestly'] },
                  { icon: '📋', title: 'Vehicle Details', items: ['Registration documents', 'Service history records', 'Exact mileage reading', 'Modifications or repairs'] },
                  { icon: '🔍', title: 'Condition Notes', items: ['Recent service info', 'Known issues', 'Tyre condition', 'Accident history (if any)'] },
                  { icon: '💰', title: 'Pricing Research', items: ['Check similar listings', 'Factor in unique features', 'Be realistic about condition', 'Consider market demand'] },
                ];
                const card = prepCards[prepCardIdx];
                return (
                  <div className="bcc-hero-sell-preparation" id="preparation-section">
                    <h3>Before you list — get the best price</h3>
                    <p className="bcc-prep-intro">Cars with complete info and quality photos sell 3× faster and for up to 15% more.</p>

                    <div className="bcc-prep-carousel">
                      <button className="bcc-prep-carousel-btn" onClick={() => setPrepCardIdx(i => Math.max(0, i - 1))} disabled={prepCardIdx === 0}>‹</button>
                      <div className="bcc-preparation-item bcc-preparation-item--single">
                        <div className="bcc-prep-icon">{card.icon}</div>
                        <div className="bcc-prep-content">
                          <h4>{card.title}</h4>
                          <ul>{card.items.map(item => <li key={item}>{item}</li>)}</ul>
                        </div>
                      </div>
                      <button className="bcc-prep-carousel-btn" onClick={() => setPrepCardIdx(i => Math.min(prepCards.length - 1, i + 1))} disabled={prepCardIdx === prepCards.length - 1}>›</button>
                    </div>

                    <div className="bcc-prep-dots">
                      {prepCards.map((_, i) => (
                        <button key={i} className={`bcc-prep-dot${i === prepCardIdx ? ' active' : ''}`} onClick={() => setPrepCardIdx(i)} />
                      ))}
                    </div>

                    <div className="bcc-preparation-actions">
                      <button
                        className="bcc-preparation-ready-button"
                        onClick={handleWhatsAppClick}
                        disabled={loading}
                      >
                        {isAuthenticated ? "I'm Ready — Start Listing" : "I'm Ready — Login to List"}
                      </button>
                      <button
                        className="bcc-preparation-back-button"
                        onClick={handleHidePreparation}
                        disabled={loading}
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        ) : activeTab === 'transport' ? (
          <div className="bcc-hero-quickform">
            <h1>Plan your trip.</h1>
            <p>Tell us where you are headed and we will find the best routes and transport for you.</p>
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
              <div className="bcc-hero-quickform-row">
                <div className="bcc-hero-quickform-field">
                  <label htmlFor="transport-date">Date</label>
                  <input
                    id="transport-date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={transportForm.date}
                    onChange={e => setTransportForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div className="bcc-hero-quickform-field">
                  <label htmlFor="transport-time">Time</label>
                  <input
                    id="transport-time"
                    type="time"
                    value={transportForm.time}
                    onChange={e => setTransportForm(f => ({ ...f, time: e.target.value }))}
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
                <div className="bcc-hero-quickform-field">
                  <label htmlFor="rental-budget">Budget (BWP / day)</label>
                  <select
                    id="rental-budget"
                    value={rentalsForm.budget}
                    onChange={e => setRentalsForm(f => ({ ...f, budget: e.target.value }))}
                  >
                    <option value="">Any budget</option>
                    <option value="300">Up to P300</option>
                    <option value="500">Up to P500</option>
                    <option value="800">Up to P800</option>
                    <option value="1200">Up to P1,200</option>
                    <option value="2000">Up to P2,000</option>
                    <option value="9999">P2,000+</option>
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