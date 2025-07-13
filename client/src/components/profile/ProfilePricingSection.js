// client/src/components/profile/ProfilePricingSection.js
// Pricing and Addons section for user profile car listing

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Star, CheckCircle, Camera, Video, 
  TrendingUp, Phone, Info, ExternalLink, Zap,
  Award, Shield, Clock, Users, AlertCircle
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
  const [availableTiers, setAvailableTiers] = useState({});
  const [availableAddons, setAvailableAddons] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);

  // Fetch pricing and addon data
  useEffect(() => {
    fetchPricingData();
    if (showAddons) {
      fetchAddonsData();
    }
  }, [sellerType, showAddons]);

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
      onAddonSelect(newSelectedAddons);
    }
  };

  const getSellerTypeInfo = () => {
    const info = {
      private: {
        title: 'Individual Seller',
        description: 'Perfect for selling your personal vehicle',
        icon: <Users size={20} />,
        note: 'Each subscription covers 1 car listing'
      },
      dealership: {
        title: 'Dealership',
        description: 'Professional car sales business',
        icon: <Award size={20} />,
        note: 'Multiple car listings per subscription'
      },
      rental: {
        title: 'Car Rental',
        description: 'Rental car fleet management',
        icon: <Clock size={20} />,
        note: 'Fleet management features included'
      }
    };
    return info[sellerType] || info.private;
  };

  const renderPricingTier = (tierId, tier) => {
    const isPopular = tierId === 'standard';
    const isSelected = selectedPlan === tierId;

    return (
      <div 
        key={tierId}
        className={`profile-pricing-tier ${isPopular ? 'popular' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => handlePlanSelection(tierId)}
      >
        {isPopular && <div className="profile-tier-badge">Most Popular</div>}
        
        <div className="profile-tier-header">
          <div className="profile-tier-price">P{tier.price}</div>
          <div className="profile-tier-period">/{tier.duration} days</div>
        </div>
        
        <div className="profile-tier-name">{tier.name}</div>
        
        <div className="profile-tier-features">
          <div className="profile-tier-feature">
            <CheckCircle size={16} />
            <span>Up to {tier.maxListings} car listing{tier.maxListings > 1 ? 's' : ''}</span>
          </div>
          <div className="profile-tier-feature">
            <CheckCircle size={16} />
            <span>Social media promotion</span>
          </div>
          <div className="profile-tier-feature">
            <CheckCircle size={16} />
            <span>Contact lead management</span>
          </div>
          {tierId !== 'basic' && (
            <div className="profile-tier-feature">
              <CheckCircle size={16} />
              <span>Premium placement</span>
            </div>
          )}
          {tierId === 'premium' && (
            <>
              <div className="profile-tier-feature">
                <CheckCircle size={16} />
                <span>Featured listing badge</span>
              </div>
              <div className="profile-tier-feature">
                <CheckCircle size={16} />
                <span>Priority support</span>
              </div>
            </>
          )}
        </div>
        
        <button 
          className={`profile-tier-button ${isSelected ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handlePlanSelection(tierId);
          }}
        >
          {isSelected ? 'Selected' : 'Select Plan'}
        </button>
      </div>
    );
  };

  const renderAddonCard = (addonId, addon) => {
    const isSelected = selectedAddons.includes(addonId);
    
    const getAddonIcon = (id) => {
      switch(id) {
        case 'photography': return <Camera size={24} />;
        case 'sponsored': return <TrendingUp size={24} />;
        case 'review': return <Video size={24} />;
        case 'podcast': return <Zap size={24} />;
        case 'listing_assistance': return <Shield size={24} />;
        case 'full_assistance': return <Award size={24} />;
        default: return <Star size={24} />;
      }
    };

    return (
      <div 
        key={addonId}
        className={`profile-addon-card ${isSelected ? 'selected' : ''}`}
        onClick={() => handleAddonToggle(addonId)}
      >
        <div className="profile-addon-icon">
          {getAddonIcon(addonId)}
        </div>
        
        <div className="profile-addon-content">
          <h4 className="profile-addon-name">{addon.name}</h4>
          <p className="profile-addon-description">{addon.description}</p>
          
          <div className="profile-addon-price">
            <span className="price">P{addon.price}</span>
            <span className="period">one-time</span>
          </div>
        </div>
        
        <div className="profile-addon-select">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              handleAddonToggle(addonId);
            }}
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="profile-pricing-loading">
        <div className="loading-spinner"></div>
        <p>Loading pricing information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-pricing-error">
        <AlertCircle size={24} />
        <p>{error}</p>
      </div>
    );
  }

  const sellerInfo = getSellerTypeInfo();

  return (
    <div className="profile-pricing-section">
      {/* Header */}
      <div className="profile-pricing-header">
        <div className="profile-pricing-title">
          <DollarSign size={24} />
          <h3>Choose Your Listing Plan</h3>
        </div>
        
        <div className="profile-seller-type">
          <div className="seller-type-info">
            {sellerInfo.icon}
            <div>
              <span className="seller-type-title">{sellerInfo.title}</span>
              <span className="seller-type-note">{sellerInfo.note}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="profile-pricing-tiers">
        {Object.entries(availableTiers).map(([tierId, tier]) => 
          renderPricingTier(tierId, tier)
        )}
      </div>

      {/* Addons Section */}
      {showAddons && Object.keys(availableAddons).length > 0 && (
        <div className="profile-addons-section">
          <div className="profile-addons-header">
            <h4>
              <Star size={20} />
              Boost Your Listing with Add-ons
            </h4>
            <p>Optional services to sell your car faster and get better offers</p>
          </div>
          
          <div className="profile-addons-grid">
            {Object.entries(availableAddons).map(([addonId, addon]) => 
              renderAddonCard(addonId, addon)
            )}
          </div>
          
          {selectedAddons.length > 0 && (
            <div className="profile-addons-summary">
              <div className="addons-total">
                <span>Selected Add-ons Total: </span>
                <strong>
                  P{selectedAddons.reduce((total, addonId) => 
                    total + (availableAddons[addonId]?.price || 0), 0
                  )}
                </strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dealer Contact Section */}
      {sellerType === 'private' && (
        <div className="profile-dealer-notice">
          <div className="dealer-notice-content">
            <Shield size={24} />
            <div>
              <h4>Are you a car dealer?</h4>
              <p>Get special dealer rates and bulk listing packages. Contact us for custom pricing.</p>
            </div>
          </div>
          <button 
            className="dealer-contact-btn"
            onClick={() => {
              const whatsappNumber = '+26774122453';
              const message = encodeURIComponent('Hi! I am a car dealer interested in listing vehicles on BW Car Culture. Please provide information about dealer packages.');
              window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
            }}
          >
            <Phone size={16} />
            Contact Us
          </button>
        </div>
      )}

      {/* Info Section */}
      <div className="profile-pricing-info">
        <Info size={20} />
        <div>
          <h4>How it works</h4>
          <ul>
            <li>Choose a plan that fits your needs</li>
            <li>Add optional services to boost visibility</li>
            <li>Complete your car listing form</li>
            <li>Make payment to activate your listing</li>
            <li>Your car goes live immediately after payment</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfilePricingSection;
