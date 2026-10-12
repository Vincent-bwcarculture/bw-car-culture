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

  const [stats, setStats] = useState({
    carListings: 0,
    happyCustomers: 0,
    verifiedDealers: 0
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
        'Hi! I would like to list my car for sale on Bw Car Culture.\n\n' +
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
            <h1>THE VEHICLE YOU WANT, WHEREVER IT IS. QUALITY YOU CAN TRUST. SERVICE YOU DESERVE.</h1>
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
                    onClick={handleWhatsAppClick}
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
                    onClick={handleWhatsAppClick}
                    disabled={loading}
                  >
                    {isAuthenticated ? 'List & Boost' : 'Login to Boost'}
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
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate('/login', { state: { from: '/profile?tab=overview', message: 'Please login to apply for a dealership account' } });
                      return;
                    }
                    navigate('/profile?tab=overview');
                  }}
                >
                  Register Your Dealership
                </button>
              </div>
            </>
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
