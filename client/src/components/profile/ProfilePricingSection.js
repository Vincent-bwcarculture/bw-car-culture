// client/src/components/profile/ProfilePricingSection.js
// Complete Pricing and Addons section with Mobile Horizontal Scrolling

import React, { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, Star, CheckCircle, Camera, Video, 
  TrendingUp, Phone, Info, ExternalLink, Zap,
  Award, Shield, Clock, Users, AlertCircle, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import axios from '../../config/axios.js';
import './ProfilePricingSection.css';

const ProfilePricingSection = ({ 
  onPlanSelect, 
  onAddonSelect, 
  sellerType = 'private',
  listingId = null,
  showAddons = true 
}) => {
  // === EXISTING STATE ===
  const [availableTiers, setAvailableTiers] = useState({});
  const [availableAddons, setAvailableAddons] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  // === NEW MOBILE SCROLL STATE ===
  const pricingScrollRef = useRef(null);
  const addonsScrollRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [pricingCanScrollLeft, setPricingCanScrollLeft] = useState(false);
  const [pricingCanScrollRight, setPricingCanScrollRight] = useState(false);
  const [addonsCanScrollLeft, setAddonsCanScrollLeft] = useState(false);
  const [addonsCanScrollRight, setAddonsCanScrollRight] = useState(false);

  // === MOBILE DETECTION ===
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // === DATA FETCHING ===
  useEffect(() => {
    fetchPricingData();
    if (showAddons) {
      fetchAddonsData();
    }
  }, [sellerType, showAddons]);

  // === UPDATE SCROLL INDICATORS ===
  const updateScrollIndicators = (scrollElement, setLeft, setRight) => {
    if (!scrollElement) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollElement;
    setLeft(scrollLeft > 5); // Small threshold to account for rounding
    setRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  // === SCROLL FUNCTIONS ===
  const scrollHorizontal = (elementRef, direction, setLeft, setRight) => {
    const element = elementRef.current;
    if (!element) return;
    
    const scrollAmount = element.clientWidth * 0.8; // Scroll 80% of visible width
    const targetScroll = direction === 'left' 
      ? element.scrollLeft - scrollAmount
      : element.scrollLeft + scrollAmount;
    
    element.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });

    // Update indicators after scroll animation
    setTimeout(() => {
      updateScrollIndicators(element, setLeft, setRight);
    }, 300);
  };

  // === SCROLL EVENT HANDLERS ===
  const handlePricingScroll = () => {
    updateScrollIndicators(
      pricingScrollRef.current, 
      setPricingCanScrollLeft, 
      setPricingCanScrollRight
    );
  };

  const handleAddonsScroll = () => {
    updateScrollIndicators(
      addonsScrollRef.current, 
      setAddonsCanScrollLeft, 
      setAddonsCanScrollRight
    );
  };

  // === SETUP SCROLL INDICATORS ===
  useEffect(() => {
    const pricingElement = pricingScrollRef.current;
    const addonsElement = addonsScrollRef.current;

    if (pricingElement) {
      pricingElement.addEventListener('scroll', handlePricingScroll);
      // Initial check
      setTimeout(() => {
        updateScrollIndicators(pricingElement, setPricingCanScrollLeft, setPricingCanScrollRight);
      }, 100);
    }

    if (addonsElement) {
      addonsElement.addEventListener('scroll', handleAddonsScroll);
      // Initial check
      setTimeout(() => {
        updateScrollIndicators(addonsElement, setAddonsCanScrollLeft, setAddonsCanScrollRight);
      }, 100);
    }

    return () => {
      if (pricingElement) {
        pricingElement.removeEventListener('scroll', handlePricingScroll);
      }
      if (addonsElement) {
        addonsElement.removeEventListener('scroll', handleAddonsScroll);
      }
    };
  }, [availableTiers, availableAddons]);

  // === API FUNCTIONS ===
  const fetchPricingData = async () => {
    try {
      const response = await axios.get('/api/payments/available-tiers');
      if (response.data.success) {
        setAvailableTiers(response.data.data.tiers);
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      setError('Failed to load pricing information');
    }
  };

  const fetchAddonsData = async () => {
    try {
      const response = await axios.get('/api/addons/available');
      if (response.data.success) {
        setAvailableAddons(response.data.data.addons);
      }
    } catch (error) {
      console.error('Error fetching addons:', error);
      setError('Failed to load addon information');
    } finally {
      setLoading(false);
    }
  };

  // === EVENT HANDLERS ===
  const handlePlanSelection = (planId) => {
    setSelectedPlan(planId);
    if (onPlanSelect) {
      onPlanSelect(planId, availableTiers[planId]);
    }
  };

  const handleAddonToggle = (addonId) => {
    const newSelectedAddons = selectedAddons.includes(addonId)
      ? selectedAddons.filter(id => id !== addonId)
      : [...selectedAddons, addonId];
    
    setSelectedAddons(newSelectedAddons);
    if (onAddonSelect) {
      onAddonSelect(addonId, availableAddons[addonId]);
    }
  };

  // === CALCULATE TOTALS ===
  const calculateSelectedAddonsTotal = () => {
    return selectedAddons.reduce((total, addonId) => {
      return total + (availableAddons[addonId]?.price || 0);
    }, 0);
  };

  // === ICON MAPPING ===
  const getAddonIcon = (addonId) => {
    const iconMap = {
      photography: Camera,
      review: Video,
      featured: Star,
      detailing: Zap,
      inspection: Shield,
      warranty: Award
    };
    return iconMap[addonId] || Info;
  };

  // === LOADING STATE ===
  if (loading) {
    return (
      <div className="profile-pricing-section">
        <div className="profile-pricing-loading">
          <div className="loading-spinner"></div>
          <p>Loading pricing information...</p>
        </div>
      </div>
    );
  }

  // === ERROR STATE ===
  if (error) {
    return (
      <div className="profile-pricing-section">
        <div className="profile-pricing-error">
          <AlertCircle size={48} />
          <p>{error}</p>
          <button 
            onClick={() => {
              setError('');
              setLoading(true);
              fetchPricingData();
              if (showAddons) fetchAddonsData();
            }}
            className="profile-tier-button"
            style={{ maxWidth: '200px', margin: '0 auto' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-pricing-section">
      {/* === HEADER === */}
      <div className="profile-pricing-header">
        <div className="profile-pricing-title">
          <DollarSign size={24} />
          <h3>Choose Your Listing Plan</h3>
        </div>
        <div className="profile-seller-type">
          <div className="seller-type-info">
            <Users size={16} />
            <div>
              <p className="seller-type-title">Individual Seller</p>
              <p className="seller-type-note">Each plan = 1 listing</p>
            </div>
          </div>
        </div>
      </div>

      {/* === PRICING TIERS === */}
      <div className="scroll-container">
        {!isMobile && (
          <>
            <button 
              className={`scroll-button left ${!pricingCanScrollLeft ? 'disabled' : ''}`}
              onClick={() => scrollHorizontal(
                pricingScrollRef, 
                'left', 
                setPricingCanScrollLeft, 
                setPricingCanScrollRight
              )}
              disabled={!pricingCanScrollLeft}
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              className={`scroll-button right ${!pricingCanScrollRight ? 'disabled' : ''}`}
              onClick={() => scrollHorizontal(
                pricingScrollRef, 
                'right', 
                setPricingCanScrollLeft, 
                setPricingCanScrollRight
              )}
              disabled={!pricingCanScrollRight}
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        
        <div 
          className="profile-pricing-tiers" 
          ref={pricingScrollRef}
        >
          {Object.entries(availableTiers).map(([tierId, tier]) => (
            <div
              key={tierId}
              className={`profile-pricing-tier ${selectedPlan === tierId ? 'selected' : ''} ${tierId === 'standard' ? 'popular' : ''}`}
              onClick={() => handlePlanSelection(tierId)}
            >
              {tierId === 'standard' && (
                <div className="profile-tier-badge">Most Popular</div>
              )}
              
              <div className="profile-tier-header">
                <span className="profile-tier-price">P{tier.price}</span>
                <span className="profile-tier-period">/{tier.duration} days</span>
              </div>
              
              <div className="profile-tier-name">{tier.name}</div>
              
              <div className="profile-tier-features">
                {tier.features?.map((feature, index) => (
                  <div key={index} className="profile-tier-feature">
                    <CheckCircle size={16} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              <button 
                className={`profile-tier-button ${selectedPlan === tierId ? 'selected' : ''}`}
              >
                {selectedPlan === tierId ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
        
        {isMobile && (
          <div className="scroll-hint">
            ← Swipe to see all plans →
          </div>
        )}
      </div>

      {/* === ADDONS SECTION === */}
      {showAddons && Object.keys(availableAddons).length > 0 && (
        <div className="profile-addons-section">
          <div className="profile-addons-header">
            <h4>
              <Star size={20} />
              Boost Your Listing with Add-ons
            </h4>
            <p>Optional services to sell your car faster and get better offers</p>
          </div>

          <div className="scroll-container">
            {!isMobile && (
              <>
                <button 
                  className={`scroll-button left ${!addonsCanScrollLeft ? 'disabled' : ''}`}
                  onClick={() => scrollHorizontal(
                    addonsScrollRef, 
                    'left', 
                    setAddonsCanScrollLeft, 
                    setAddonsCanScrollRight
                  )}
                  disabled={!addonsCanScrollLeft}
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  className={`scroll-button right ${!addonsCanScrollRight ? 'disabled' : ''}`}
                  onClick={() => scrollHorizontal(
                    addonsScrollRef, 
                    'right', 
                    setAddonsCanScrollLeft, 
                    setAddonsCanScrollRight
                  )}
                  disabled={!addonsCanScrollRight}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            
            <div 
              className="profile-addons-grid" 
              ref={addonsScrollRef}
            >
              {Object.entries(availableAddons).map(([addonId, addon]) => {
                const IconComponent = getAddonIcon(addonId);
                const isSelected = selectedAddons.includes(addonId);
                
                return (
                  <div
                    key={addonId}
                    className={`profile-addon-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleAddonToggle(addonId)}
                  >
                    <div className="profile-addon-icon">
                      <IconComponent size={24} />
                    </div>
                    
                    <div className="profile-addon-content">
                      <h5 className="profile-addon-name">{addon.name}</h5>
                      <p className="profile-addon-description">{addon.description}</p>
                      <div className="profile-addon-price">
                        <span className="price">P{addon.price}</span>
                        {addon.duration && (
                          <span className="period">• {addon.duration}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="profile-addon-select">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleAddonToggle(addonId)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {isMobile && (
              <div className="scroll-hint">
                ← Swipe to see all add-ons →
              </div>
            )}
          </div>

          {/* === ADDONS SUMMARY === */}
          {selectedAddons.length > 0 && (
            <div className="profile-addons-summary">
              <div className="addons-total">
                Selected add-ons total: <strong>P{calculateSelectedAddonsTotal()}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === DEALER NOTICE === */}
      <div className="profile-dealer-notice">
        <div>
          <h4>Need help or have questions?</h4>
          <p>Contact our team for personalized assistance with your car listing.</p>
        </div>
        <a 
          href="https://wa.me/26774122453" 
          target="_blank" 
          rel="noopener noreferrer"
          className="dealer-contact-btn"
        >
          <Phone size={16} />
          Contact Support
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};

export default ProfilePricingSection;
