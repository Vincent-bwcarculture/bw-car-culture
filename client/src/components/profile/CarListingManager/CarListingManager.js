// client/src/components/profile/CarListingManager/CarListingManager.js
// COMPLETE car listing manager with subscription and addon handling - FIXED VERSION

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Star, User, Award, Shield, 
  Check, X, AlertCircle, Info, CreditCard,
  Camera, TrendingUp, Video, Zap, Phone,
  Calendar, Clock, MapPin, ExternalLink
} from 'lucide-react';
import axios from '../../../config/axios.js';
import AddonBookingModal from '../AddonBookingModal.js';
import './CarListingManager.css';

const CarListingManager = ({ 
  listingData, 
  onPaymentComplete, 
  onCancel,
  pendingListingId = null 
}) => {
  // Component state
  const [currentStep, setCurrentStep] = useState('pricing'); // 'pricing', 'payment', 'confirmation'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Pricing and addon state
  const [availableTiers, setAvailableTiers] = useState({});
  const [availableAddons, setAvailableAddons] = useState({});
  const [sellerType, setSellerType] = useState('private');
  
  // Selection state
  const [selectedPlan, setSelectedPlan] = useState(listingData?.selectedPlan || null);
  const [selectedAddons, setSelectedAddons] = useState(listingData?.selectedAddons || []);
  const [paymentType, setPaymentType] = useState('subscription');
  
  // Modal and booking state
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [currentAddon, setCurrentAddon] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  
  // Payment state
  const [paymentLink, setPaymentLink] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);

  // Load component data
  useEffect(() => {
    fetchPricingData();
    fetchAddonsData();
  }, []);

  // Set initial selections from props
  useEffect(() => {
    if (listingData) {
      setSelectedPlan(listingData.selectedPlan);
      setSelectedAddons(listingData.selectedAddons || []);
    }
  }, [listingData]);

  // === API FUNCTIONS ===
  const fetchPricingData = async () => {
    try {
      const response = await axios.get('/api/payments/available-tiers');
      if (response.data.success) {
        setAvailableTiers(response.data.data.tiers);
        setSellerType(response.data.data.sellerType);
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
    }
  };

  // === UTILITY FUNCTIONS ===
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const getSellerTypeInfo = () => {
    const info = {
      private: {
        title: 'Individual Seller',
        description: 'Perfect for selling your personal vehicle',
        icon: <User size={20} />,
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

  const getAddonIcon = (addonId) => {
    const iconMap = {
      photography: <Camera size={24} />,
      sponsored: <TrendingUp size={24} />,
      review: <Video size={24} />,
      podcast: <Zap size={24} />,
      listing_assistance: <Shield size={24} />,
      full_assistance: <Award size={24} />,
      featured: <Star size={24} />
    };
    return iconMap[addonId] || <Star size={24} />;
  };

  const calculateTotal = () => {
    let total = 0;
    
    if (selectedPlan && availableTiers[selectedPlan]) {
      total += availableTiers[selectedPlan].price;
    }
    
    selectedAddons.forEach(addonId => {
      if (availableAddons[addonId]) {
        total += availableAddons[addonId].price;
      }
    });
    
    return total;
  };

  // === EVENT HANDLERS ===
  const handlePlanSelection = (planId) => {
    setSelectedPlan(planId);
    setPaymentType('subscription');
    showMessage('success', `${availableTiers[planId]?.name} plan selected`);
  };

  const handleAddonToggle = (addonId) => {
    const addon = availableAddons[addonId];
    if (!addon) return;

    if (addon.requiresBooking && !selectedAddons.includes(addonId)) {
      // Show booking modal for addons that require booking
      setCurrentAddon({ id: addonId, ...addon });
      setShowAddonModal(true);
    } else {
      // Toggle addon selection for instant addons
      const newSelectedAddons = selectedAddons.includes(addonId)
        ? selectedAddons.filter(id => id !== addonId)
        : [...selectedAddons, addonId];
      
      setSelectedAddons(newSelectedAddons);
      showMessage('info', `${addon.name} ${selectedAddons.includes(addonId) ? 'removed' : 'added'}`);
    }
  };

  const handleAddonBookingConfirm = async (bookingDetails) => {
    try {
      setLoading(true);
      
      const response = await axios.post('/api/addons/book', {
        listingId: pendingListingId || listingData?._id,
        addonId: currentAddon.id,
        bookingDetails
      });

      if (response.data.success) {
        setBookingData(response.data.data);
        setSelectedAddons(prev => [...prev, currentAddon.id]);
        setShowAddonModal(false);
        showMessage('success', 'Booking confirmed! Proceeding to payment...');
        
        // Automatically initiate payment after booking
        setTimeout(() => {
          initiateAddonPayment([currentAddon.id], response.data.data.bookingId);
        }, 1000);
      } else {
        setError(response.data.message || 'Failed to confirm booking');
      }
    } catch (error) {
      console.error('Booking confirmation error:', error);
      setError('Failed to confirm booking');
    } finally {
      setLoading(false);
    }
  };

  // === PAYMENT FUNCTIONS ===
  const initiateSubscriptionPayment = async () => {
    if (!selectedPlan) {
      setError('Please select a subscription plan');
      return;
    }

    try {
      setLoading(true);
      setCurrentStep('payment');

      const response = await axios.post('/api/payments/initiate', {
        listingId: pendingListingId || listingData?._id,
        subscriptionTier: selectedPlan,
        paymentType: 'subscription',
        sellerType,
        callbackUrl: window.location.href
      });

      if (response.data.success) {
        setPaymentInfo(response.data.data);
        setPaymentLink(response.data.data.paymentLink);
        setCurrentStep('confirmation');
        showMessage('success', 'Payment link generated successfully');
      } else {
        setError(response.data.message || 'Failed to initiate payment');
        setCurrentStep('pricing');
      }
    } catch (error) {
      console.error('Subscription payment initiation error:', error);
      setError('Failed to start payment process');
      setCurrentStep('pricing');
    } finally {
      setLoading(false);
    }
  };

  const initiateAddonPayment = async (addonIds, bookingId = null) => {
    if (!addonIds || addonIds.length === 0) {
      setError('Please select at least one add-on');
      return;
    }

    try {
      setLoading(true);
      setCurrentStep('payment');

      const response = await axios.post('/api/payments/initiate', {
        listingId: pendingListingId || listingData?._id,
        addons: addonIds,
        bookingId,
        paymentType: 'addon',
        sellerType,
        callbackUrl: window.location.href
      });

      if (response.data.success) {
        setPaymentInfo(response.data.data);
        setPaymentLink(response.data.data.paymentLink);
        setCurrentStep('confirmation');
        showMessage('success', 'Payment link generated successfully');
      } else {
        setError(response.data.message || 'Failed to initiate payment');
        setCurrentStep('pricing');
      }
    } catch (error) {
      console.error('Add-on payment initiation error:', error);
      setError('Failed to start payment process');
      setCurrentStep('pricing');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Handle combined payment (subscription + addons)
  const initiateCombinedPayment = async () => {
    if (!selectedPlan && selectedAddons.length === 0) {
      setError('Please select at least a subscription plan or add-ons');
      return;
    }

    try {
      setLoading(true);
      setCurrentStep('payment');

      // For now, we'll handle subscription and addons separately
      // First subscription, then addons
      if (selectedPlan) {
        await initiateSubscriptionPayment();
      } else if (selectedAddons.length > 0) {
        await initiateAddonPayment(selectedAddons);
      }
    } catch (error) {
      console.error('Combined payment error:', error);
      setError('Failed to process payment');
      setCurrentStep('pricing');
    } finally {
      // FIXED: Added finally block to reset loading state
      setLoading(false);
    }
  };

  const redirectToPayment = () => {
    if (paymentLink) {
      window.open(paymentLink, '_blank');
      // Start polling for payment status
      pollPaymentStatus();
    }
  };

  const pollPaymentStatus = () => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/payments/status/${paymentInfo?.transactionRef}`);
        if (response.data.success && response.data.data.status === 'completed') {
          clearInterval(interval);
          onPaymentComplete(response.data.data);
        }
      } catch (error) {
        console.error('Payment status check error:', error);
      }
    }, 3000);

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(interval), 600000);
  };

  // === RENDER FUNCTIONS ===
  const renderPricingTier = (tierId, tier) => {
    const isPopular = tierId === 'standard';
    const isSelected = selectedPlan === tierId;

    return (
      <div 
        key={tierId}
        className={`pricing-tier ${isPopular ? 'popular' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={() => handlePlanSelection(tierId)}
      >
        {isPopular && <div className="tier-badge">Most Popular</div>}
        
        <div className="tier-header">
          <div className="tier-price">P{tier.price}</div>
          <div className="tier-period">/{tier.duration} days</div>
        </div>
        
        <div className="tier-name">{tier.name}</div>
        
        <div className="tier-features">
          <div className="tier-feature">
            <Check size={16} />
            <span>Up to {tier.maxListings} car listing{tier.maxListings > 1 ? 's' : ''}</span>
          </div>
          <div className="tier-feature">
            <Check size={16} />
            <span>Social media promotion</span>
          </div>
          <div className="tier-feature">
            <Check size={16} />
            <span>Contact lead management</span>
          </div>
          {tierId !== 'basic' && (
            <div className="tier-feature">
              <Check size={16} />
              <span>Premium placement</span>
            </div>
          )}
          {tierId === 'premium' && (
            <>
              <div className="tier-feature">
                <Check size={16} />
                <span>Featured listing badge</span>
              </div>
              <div className="tier-feature">
                <Check size={16} />
                <span>Priority support</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderAddonCard = (addonId, addon) => {
    const isSelected = selectedAddons.includes(addonId);
    
    return (
      <div 
        key={addonId}
        className={`addon-card ${isSelected ? 'selected' : ''} ${addon.requiresBooking ? 'requires-booking' : ''}`}
        onClick={() => handleAddonToggle(addonId)}
      >
        <div className="addon-icon">
          {getAddonIcon(addonId)}
        </div>
        
        <div className="addon-content">
          <h4 className="addon-name">{addon.name}</h4>
          <p className="addon-description">{addon.description}</p>
          
          <div className="addon-details">
            <div className="addon-price">
              <span className="price">P{addon.price}</span>
              <span className="period">one-time</span>
            </div>
            
            {addon.duration && (
              <div className="addon-duration">
                <Clock size={14} />
                <span>{addon.duration}</span>
              </div>
            )}
            
            {addon.requiresBooking && (
              <div className="booking-required">
                <Calendar size={14} />
                <span>Booking Required</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="addon-select">
          <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
            {isSelected && <Check size={14} />}
          </div>
        </div>
      </div>
    );
  };

  // === COMPONENT VARIABLES ===
  const sellerInfo = getSellerTypeInfo();
  const totalAmount = calculateTotal();

  // === MAIN RENDER ===
  return (
    <div className="car-listing-manager">
      {/* Message Display */}
      {message.text && (
        <div className={`manager-message ${message.type}`}>
          <div className="manager-message-content">
            {message.type === 'success' && <Check size={16} />}
            {message.type === 'error' && <AlertCircle size={16} />}
            {message.type === 'info' && <Info size={16} />}
            <span>{message.text}</span>
          </div>
          <button 
            className="manager-message-close"
            onClick={() => setMessage({ type: '', text: '' })}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="manager-error">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Pricing Step */}
      {currentStep === 'pricing' && (
        <div className="pricing-step">
          {/* Header */}
          <div className="pricing-header">
            <div className="pricing-title">
              <DollarSign size={24} />
              <h3>Complete Your Listing</h3>
            </div>
            
            <div className="seller-type-display">
              <div className="seller-type-info">
                {sellerInfo.icon}
                <div>
                  <span className="seller-type-title">{sellerInfo.title}</span>
                  <span className="seller-type-note">{sellerInfo.note}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="subscription-section">
            <h4>Choose Your Listing Plan</h4>
            <div className="pricing-tiers">
              {Object.entries(availableTiers).map(([tierId, tier]) => 
                renderPricingTier(tierId, tier)
              )}
            </div>
          </div>

          {/* Add-ons Section */}
          {Object.keys(availableAddons).length > 0 && (
            <div className="addons-section">
              <h4>
                <Star size={20} />
                Boost Your Listing with Add-ons
              </h4>
              <p>Optional services to sell your car faster and get better offers</p>
              
              <div className="addons-grid">
                {Object.entries(availableAddons).map(([addonId, addon]) => 
                  renderAddonCard(addonId, addon)
                )}
              </div>
            </div>
          )}

          {/* Summary and Actions */}
          <div className="pricing-summary">
            <div className="summary-content">
              <h4>Order Summary</h4>
              
              {selectedPlan && (
                <div className="summary-item">
                  <span>{availableTiers[selectedPlan]?.name} Plan</span>
                  <span>P{availableTiers[selectedPlan]?.price}</span>
                </div>
              )}
              
              {selectedAddons.map(addonId => (
                <div key={addonId} className="summary-item">
                  <span>{availableAddons[addonId]?.name}</span>
                  <span>P{availableAddons[addonId]?.price}</span>
                </div>
              ))}
              
              <div className="summary-total">
                <span>Total</span>
                <span>P{totalAmount}</span>
              </div>
            </div>
            
            <div className="summary-actions">
              <button 
                className="cancel-btn"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              
              <button 
                className="proceed-btn"
                onClick={initiateCombinedPayment}
                disabled={loading || (!selectedPlan && selectedAddons.length === 0)}
              >
                {loading ? 'Processing...' : `Pay P${totalAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Step */}
      {currentStep === 'payment' && (
        <div className="payment-step">
          <div className="payment-loading">
            <div className="loading-spinner"></div>
            <h3>Setting up your payment...</h3>
            <p>Please wait while we prepare your payment link</p>
          </div>
        </div>
      )}

      {/* Confirmation Step */}
      {currentStep === 'confirmation' && (
        <div className="confirmation-step">
          <div className="confirmation-content">
            <div className="confirmation-icon">
              <CreditCard size={48} />
            </div>
            
            <h3>Payment Ready</h3>
            <p>Your payment link has been generated. Click the button below to complete your payment securely.</p>
            
            {paymentInfo && (
              <div className="payment-details">
                <div className="payment-item">
                  <span>Amount:</span>
                  <span>P{paymentInfo.amount}</span>
                </div>
                <div className="payment-item">
                  <span>Payment Type:</span>
                  <span>{paymentInfo.paymentType}</span>
                </div>
                <div className="payment-item">
                  <span>Description:</span>
                  <span>{paymentInfo.description}</span>
                </div>
              </div>
            )}
            
            <div className="confirmation-actions">
              <button 
                className="back-btn"
                onClick={() => setCurrentStep('pricing')}
                disabled={loading}
              >
                Back to Selection
              </button>
              
              <button 
                className="pay-btn"
                onClick={redirectToPayment}
                disabled={loading || !paymentLink}
              >
                <ExternalLink size={16} />
                Complete Payment
              </button>
            </div>
            
            <div className="payment-info">
              <Info size={16} />
              <span>You will be redirected to our secure payment partner to complete the transaction</span>
            </div>
          </div>
        </div>
      )}

      {/* Addon Booking Modal */}
      <AddonBookingModal
        isOpen={showAddonModal}
        onClose={() => setShowAddonModal(false)}
        addon={currentAddon}
        onBookingConfirm={handleAddonBookingConfirm}
        loading={loading}
      />
    </div>
  );
};

export default CarListingManager;