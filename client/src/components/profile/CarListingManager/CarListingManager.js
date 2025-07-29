// client/src/components/profile/CarListingManager/CarListingManager.js
// COMPLETE car listing manager with subscription, addon handling, FREE TIER AND MANUAL PAYMENT INTEGRATION
// PRODUCTION VERSION - DEBUG FEATURES REMOVED

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Star, User, Award, Shield, 
  Check, X, AlertCircle, Info, CreditCard,
  Camera, TrendingUp, Video, Zap, Phone,
  Calendar, Clock, MapPin, ExternalLink,
  CheckCircle, ArrowLeft
} from 'lucide-react';
import axios from '../../../config/axios.js';
import AddonBookingModal from '../AddonBookingModal.js';
import ManualPaymentModal from '../ManualPaymentModal/ManualPaymentModal.js'; // NEW: Manual payment modal
import './CarListingManager.css';

const CarListingManager = ({ 
  listingData, 
  onPaymentComplete, 
  onCancel,
  onProceedToForm, // NEW: Callback to proceed to listing form
  onPlanSelected, // NEW: Callback when plan is selected
  onAddonSelected, // NEW: Callback when addons change
  selectedPlan: propSelectedPlan, // NEW: Direct prop for selected plan
  selectedAddons: propSelectedAddons = [], // NEW: Direct prop for selected addons
  pendingListingId = null,
  mode = 'payment', // NEW: 'preview' or 'payment' mode
  showPaymentInfo = true, // NEW: Hide payment buttons in preview mode
  submitButtonText = 'Pay', // NEW: Customizable button text
  allowSkipPlan = false // NEW: Allow proceeding without plan selection
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
  
  // FREE TIER STATE
  const [hasFreeOption, setHasFreeOption] = useState(false);
  const [freeListingStats, setFreeListingStats] = useState({
    active: 0,
    maxAllowed: 8,
    remaining: 8,
    canAddMore: true
  });
  
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

  // NEW: Manual Payment Modal State
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [manualPaymentInfo, setManualPaymentInfo] = useState(null);

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
      // UPDATED: Use endpoint without /api prefix to match your pattern
      const response = await axios.get('/payments/available-tiers');
      if (response.data.success) {
        const { tiers, sellerType: responseSellerType, hasFreeOption = false, freeListingStats = {} } = response.data.data;
        
        setAvailableTiers(tiers);
        setSellerType(responseSellerType);
        
        // Set free tier options
        setHasFreeOption(hasFreeOption);
        if (freeListingStats && Object.keys(freeListingStats).length > 0) {
          setFreeListingStats(freeListingStats);
        }
        
        console.log('Pricing data loaded with free tier:', { 
          tiersCount: Object.keys(tiers).length,
          hasFreeOption,
          freeStats: freeListingStats
        });
      }
    } catch (error) {
      console.error('Error fetching pricing:', error);
      setError('Failed to load pricing information');
    }
  };

  const fetchAddonsData = async () => {
    try {
      // UPDATED: Use endpoint without /api prefix to match your pattern
      const response = await axios.get('/addons/available');
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
    
    const planName = availableTiers[planId]?.name || 'Unknown Plan';
    if (planId === 'free') {
      showMessage('success', `${planName} selected - No payment required!`);
    } else {
      showMessage('success', `${planName} plan selected`);
    }
    
    // Call parent callback to update parent state
    if (onPlanSelected) {
      onPlanSelected(planId);
    }
  };

  // Handle proceeding to listing form (preview mode)
  const handleProceedToForm = () => {
    if (onProceedToForm) {
      onProceedToForm();
    }
  };

  // FREE TIER SELECTION HANDLER
  const handleFreeTierSelection = async () => {
    if (!pendingListingId) {
      setError('No pending listing found');
      return;
    }

    if (!freeListingStats.canAddMore) {
      setError(`You have reached the maximum of ${freeListingStats.maxAllowed} active free listings.`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // UPDATED: Use endpoint without /api prefix
      const response = await axios.post('/payments/process-free-listing', {
        submissionId: pendingListingId
      });

      if (response.data.success) {
        setCurrentStep('confirmation');
        setMessage({
          type: 'success',
          text: 'Free listing selected! Your submission is in the admin review queue.'
        });
        
        // Notify parent component
        if (onPaymentComplete) {
          onPaymentComplete({
            tier: 'free',
            paymentRequired: false,
            status: 'pending_review'
          });
        }
      }
    } catch (error) {
      console.error('Free tier selection error:', error);
      setError(error.response?.data?.message || 'Failed to select free tier');
    } finally {
      setLoading(false);
    }
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
      
      // Call parent callback to update parent state
      if (onAddonSelected) {
        onAddonSelected(newSelectedAddons);
      }
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
        const newSelectedAddons = [...selectedAddons, currentAddon.id];
        setSelectedAddons(newSelectedAddons);
        setShowAddonModal(false);
        showMessage('success', 'Booking confirmed! Proceeding to payment...');
        
        // Call parent callback to update parent state
        if (onAddonSelected) {
          onAddonSelected(newSelectedAddons);
        }
        
        // Automatically initiate payment after booking (only in payment mode)
        if (mode === 'payment') {
          setTimeout(() => {
            initiateAddonPayment([currentAddon.id], response.data.data.bookingId);
          }, 1000);
        }
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
  // UPDATED: Now shows manual payment modal instead of Flutterwave
  const initiateSubscriptionPayment = async () => {
    if (!selectedPlan) {
      setError('Please select a subscription plan');
      return;
    }

    try {
      setLoading(true);
      setCurrentStep('payment');

      // Get tier pricing
      const tierPricing = {
        basic: { name: 'Basic Plan', price: 50, duration: 30 },
        standard: { name: 'Standard Plan', price: 100, duration: 30 },
        premium: { name: 'Premium Plan', price: 200, duration: 45 }
      };

      const tierDetails = tierPricing[selectedPlan];
      if (!tierDetails) {
        throw new Error('Invalid subscription tier');
      }

      // Create manual payment info
      const paymentInfo = {
        listingId: pendingListingId || listingData?._id,
        subscriptionTier: selectedPlan,
        amount: tierDetails.price,
        duration: tierDetails.duration,
        planName: tierDetails.name,
        transactionRef: `manual_${Date.now()}`,
        sellerType
      };

      setManualPaymentInfo(paymentInfo);
      setShowManualPaymentModal(true);
      setCurrentStep('confirmation');

      showMessage('info', 'Payment gateway integration under development. Please use manual payment methods below.');

    } catch (error) {
      console.error('Payment initiation error:', error);
      setError('Failed to start payment process');
      setCurrentStep('pricing');
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Manual payment for addons
  const initiateAddonPayment = async (addonIds, bookingId = null) => {
    if (!addonIds || addonIds.length === 0) {
      setError('Please select at least one add-on');
      return;
    }

    try {
      setLoading(true);
      setCurrentStep('payment');

      // Calculate addon total
      let totalAmount = 0;
      const addonDetails = [];

      addonIds.forEach(addonId => {
        const addon = availableAddons[addonId];
        if (addon) {
          totalAmount += addon.price;
          addonDetails.push(addon);
        }
      });

      // Create manual payment info for addons
      const paymentInfo = {
        listingId: pendingListingId || listingData?._id,
        subscriptionTier: 'addon',
        amount: totalAmount,
        duration: 30,
        planName: `Add-ons: ${addonDetails.map(a => a.name).join(', ')}`,
        transactionRef: `manual_addon_${Date.now()}`,
        sellerType,
        paymentType: 'addon',
        addons: addonIds,
        bookingId
      };

      setManualPaymentInfo(paymentInfo);
      setShowManualPaymentModal(true);
      setCurrentStep('confirmation');

      showMessage('info', 'Payment gateway integration under development. Please use manual payment methods below.');

    } catch (error) {
      console.error('Add-on payment initiation error:', error);
      setError('Failed to start payment process');
      setCurrentStep('pricing');
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Handle combined payment with debug features and direct approach
  const initiateCombinedPayment = async () => {
    console.log('🚀 initiateCombinedPayment called');
    console.log('selectedPlan:', selectedPlan);
    console.log('selectedAddons:', selectedAddons);
    
    if (!selectedPlan && selectedAddons.length === 0) {
      setError('Please select at least a subscription plan or add-ons');
      return;
    }

    // Skip the loading/async stuff and go straight to manual payment
    setLoading(true);
    
    try {
      // Calculate total cost
      const totalCost = calculateTotal();
      
      // Create payment info immediately
      const tierPricing = {
        basic: { name: 'Basic Plan', price: 50, duration: 30 },
        standard: { name: 'Standard Plan', price: 100, duration: 30 },
        premium: { name: 'Premium Plan', price: 200, duration: 45 }
      };

      const tierDetails = selectedPlan ? tierPricing[selectedPlan] : null;
      
      const paymentInfo = {
        listingId: pendingListingId || listingData?._id || 'temp-listing',
        subscriptionTier: selectedPlan || 'addon',
        amount: totalCost,
        duration: tierDetails?.duration || 30,
        planName: tierDetails?.name || `Add-ons (${selectedAddons.length})`,
        transactionRef: `manual_${Date.now()}`,
        sellerType,
        addons: selectedAddons
      };

      console.log('💰 Created payment info:', paymentInfo);
      
      // Set payment info and show modal immediately
      setManualPaymentInfo(paymentInfo);
      setShowManualPaymentModal(true);
      setCurrentStep('confirmation');
      
      console.log('✅ Modal should be open now');
      
    } catch (error) {
      console.error('❌ Payment initiation error:', error);
      setError('Failed to start payment process: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Handle manual payment modal close
  const handleCloseManualPayment = () => {
    setShowManualPaymentModal(false);
    setManualPaymentInfo(null);
    setCurrentStep('pricing');
  };

  // NEW: Handle payment proof submission
  const handlePaymentProofSubmitted = (paymentData) => {
    setShowManualPaymentModal(false);
    setManualPaymentInfo(null);
    
    showMessage('success', 
      'Proof of payment submitted successfully! ' +
      'Your listing will be activated once our admin team verifies your payment (usually within 24 hours).'
    );
    
    // Call parent callback
    if (onPaymentComplete) {
      onPaymentComplete({
        ...paymentData,
        status: 'proof_submitted',
        message: 'Payment proof submitted for review'
      });
    }
    
    // Reset the flow
    setCurrentStep('pricing');
    setSelectedPlan(null);
    setSelectedAddons([]);
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
    const isFree = tierId === 'free';
    const isSelected = selectedPlan === tierId;
    const freeDisabled = isFree && !freeListingStats.canAddMore;

    return (
      <div 
        key={tierId}
        className={`pricing-tier ${isPopular ? 'popular' : ''} ${isFree ? 'free-tier' : ''} ${isSelected ? 'selected' : ''} ${freeDisabled ? 'disabled' : ''}`}
        onClick={() => !freeDisabled && handlePlanSelection(tierId)}
      >
        {isPopular && <div className="tier-badge">Most Popular</div>}
        {isFree && (
          <div className="tier-badge free-badge">
            FREE ({freeListingStats.active}/{freeListingStats.maxAllowed})
          </div>
        )}
        
        <div className="tier-header">
          <div className="tier-price">
            {isFree ? 'FREE' : `P${tier.price}`}
          </div>
          <div className="tier-period">
            {isFree ? (
              freeListingStats.canAddMore 
                ? `${freeListingStats.remaining} slots left` 
                : 'Limit reached'
            ) : `/${tier.duration} days`}
          </div>
        </div>
        
        <div className="tier-name">{tier.name}</div>
        
        <div className="tier-features">
          {tier.features?.map((feature, index) => (
            <div key={index} className="tier-feature">
              <Check size={16} />
              <span>{feature}</span>
            </div>
          ))}
          
          {!tier.features && (
            <>
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
            </>
          )}
          
          {isFree && freeListingStats.canAddMore && (
            <div className="tier-note">
              <Info size={14} />
              <span>Can add {freeListingStats.remaining} more listing{freeListingStats.remaining !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        
        {isSelected && !freeDisabled && (
          <div className="tier-selected-indicator">
            <Check size={16} />
            Selected
          </div>
        )}
        
        {freeDisabled && (
          <div className="tier-disabled-overlay">
            <div className="disabled-message">
              <AlertCircle size={20} />
              <span>Upgrade to add more listings</span>
            </div>
          </div>
        )}
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

  // Render payment step with free tier handling
  const renderPaymentStep = () => {
    const selectedTier = availableTiers[selectedPlan];
    const isFreeSelected = selectedPlan === 'free';
    const totalCost = calculateTotal();

    return (
      <div className="payment-step">
        <div className="payment-header">
          <button 
            className="back-btn"
            onClick={() => setCurrentStep('pricing')}
          >
            <ArrowLeft size={20} />
            Back to Plans
          </button>
          <h3>{isFreeSelected ? 'Confirm Free Listing' : 'Payment Details'}</h3>
        </div>

        <div className="payment-summary">
          <div className="selected-plan-summary">
            <h4>Selected Plan</h4>
            <div className="plan-details">
              <div className="plan-info">
                <span className="plan-name">{selectedTier?.name}</span>
                <span className="plan-price">
                  {isFreeSelected ? 'FREE' : `P${selectedTier?.price}`}
                </span>
              </div>
              {selectedTier?.features && (
                <ul className="plan-features-list">
                  {selectedTier.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {selectedAddons.length > 0 && !isFreeSelected && (
            <div className="selected-addons-summary">
              <h4>Selected Add-ons</h4>
              {selectedAddons.map(addonId => {
                const addon = availableAddons[addonId];
                return addon ? (
                  <div key={addonId} className="addon-summary-item">
                    <span>{addon.name}</span>
                    <span>P{addon.price}</span>
                  </div>
                ) : null;
              })}
            </div>
          )}

          <div className="total-cost">
            <div className="cost-breakdown">
              <span>Total Cost:</span>
              <span className={isFreeSelected ? 'free-cost' : 'paid-cost'}>
                {isFreeSelected ? 'FREE' : `P${totalCost}`}
              </span>
            </div>
          </div>
        </div>

        {isFreeSelected ? (
          <div className="free-tier-confirmation">
            <div className="free-tier-info">
              <CheckCircle size={24} color="#10b981" />
              <div>
                <h4>No Payment Required</h4>
                <p>Your listing will be submitted for admin review at no cost. 
                   Once approved, it will be live for 30 days with basic features.</p>
              </div>
            </div>
            
            <div className="confirmation-actions">
              <button 
                className="btn-secondary"
                onClick={() => setCurrentStep('pricing')}
              >
                Change Plan
              </button>
              <button 
                className="btn-primary"
                onClick={handleFreeTierSelection}
                disabled={loading || !freeListingStats.canAddMore}
              >
                {loading ? 'Processing...' : 'Submit for Review'}
              </button>
            </div>
          </div>
        ) : (
          <div className="payment-actions">
            <button 
              className="btn-secondary"
              onClick={() => setCurrentStep('pricing')}
            >
              Change Plan
            </button>
            <button 
              className="btn-primary"
              onClick={initiateCombinedPayment}
              disabled={loading || totalCost === 0}
            >
              {loading ? 'Processing...' : `Pay P${totalCost}`}
            </button>
          </div>
        )}
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
              <h3>{mode === 'preview' ? 'Choose Your Listing Plan' : 'Complete Your Listing'}</h3>
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
            {/* Preview Mode Info */}
            {mode === 'preview' && (
              <div className="preview-mode-info">
                <Info size={16} />
                <div>
                  <h4>How it works:</h4>
                  <p>1. Select your plan and add-ons below</p>
                  <p>2. Fill out your car listing details</p>
                  <p>3. Admin reviews for FREE (24-48 hours)</p>
                  <p>4. Pay only after approval {hasFreeOption && '(or use FREE tier)'}</p>
                  <p>5. Your listing goes live!</p>
                </div>
              </div>
            )}
            
            <div className="summary-content">
              <h4>Order Summary</h4>
              
              {selectedPlan && (
                <div className="summary-item">
                  <span>{availableTiers[selectedPlan]?.name} Plan</span>
                  <span>{selectedPlan === 'free' ? 'FREE' : `P${availableTiers[selectedPlan]?.price}`}</span>
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
                <span>{mode === 'preview' ? 
                  (selectedPlan === 'free' ? 'FREE' : `P${totalAmount} (Pay after admin approval)`) : 
                  (selectedPlan === 'free' ? 'FREE' : `P${totalAmount}`)}</span>
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
                onClick={mode === 'preview' ? handleProceedToForm : (selectedPlan === 'free' ? handleFreeTierSelection : initiateCombinedPayment)}
                disabled={loading || (!allowSkipPlan && !selectedPlan && selectedAddons.length === 0)}
              >
                {loading ? 'Processing...' : 
                 mode === 'preview' ? submitButtonText : 
                 selectedPlan === 'free' ? 'Submit for Review' :
                 `Pay P${totalAmount}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Step - Only show in payment mode and for paid plans */}
      {currentStep === 'payment' && mode === 'payment' && selectedPlan !== 'free' && (
        <div className="payment-step">
          <div className="payment-loading">
            <div className="loading-spinner"></div>
            <h3>Setting up your payment...</h3>
            <p>Please wait while we prepare your payment options</p>
          </div>
        </div>
      )}

      {/* Payment Step for Free Tier or Combined */}
      {currentStep === 'payment' && mode === 'payment' && (
        renderPaymentStep()
      )}

      {/* Confirmation Step - Only show in payment mode */}
      {currentStep === 'confirmation' && mode === 'payment' && (
        <div className="confirmation-step">
          <div className="confirmation-content">
            <div className="confirmation-icon">
              {selectedPlan === 'free' ? <CheckCircle size={48} color="#10b981" /> : <CreditCard size={48} />}
            </div>
            
            <h3>{selectedPlan === 'free' ? 'Free Listing Submitted' : 'Payment Ready'}</h3>
            <p>{selectedPlan === 'free' ? 
              'Your free listing has been submitted for admin review. You\'ll be notified once it\'s approved and live!' :
              'Ready to proceed with manual payment. Use the options below to complete your payment.'}</p>
            
            {manualPaymentInfo && selectedPlan !== 'free' && (
              <div className="payment-details">
                <div className="payment-item">
                  <span>Amount:</span>
                  <span>P{manualPaymentInfo.amount}</span>
                </div>
                <div className="payment-item">
                  <span>Plan:</span>
                  <span>{manualPaymentInfo.planName}</span>
                </div>
                <div className="payment-item">
                  <span>Duration:</span>
                  <span>{manualPaymentInfo.duration} Days</span>
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
              
              {selectedPlan !== 'free' && (
                <button 
                  className="pay-btn"
                  onClick={() => {
                    console.log('🔥 PAYMENT BUTTON CLICKED!');
                    console.log('selectedPlan:', selectedPlan);
                    console.log('manualPaymentInfo:', manualPaymentInfo);
                    console.log('showManualPaymentModal (before):', showManualPaymentModal);
                    
                    // If manualPaymentInfo doesn't exist, create it
                    if (!manualPaymentInfo) {
                      console.log('⚠️ No manualPaymentInfo found, creating it...');
                      
                      // Get tier pricing (same as in initiateSubscriptionPayment)
                      const tierPricing = {
                        basic: { name: 'Basic Plan', price: 50, duration: 30 },
                        standard: { name: 'Standard Plan', price: 100, duration: 30 },
                        premium: { name: 'Premium Plan', price: 200, duration: 45 }
                      };

                      const tierDetails = tierPricing[selectedPlan];
                      
                      if (tierDetails) {
                        const newPaymentInfo = {
                          listingId: pendingListingId || listingData?._id,
                          subscriptionTier: selectedPlan,
                          amount: tierDetails.price,
                          duration: tierDetails.duration,
                          planName: tierDetails.name,
                          transactionRef: `manual_${Date.now()}`,
                          sellerType
                        };
                        
                        console.log('✅ Created new payment info:', newPaymentInfo);
                        setManualPaymentInfo(newPaymentInfo);
                      } else {
                        console.error('❌ No tier details found for:', selectedPlan);
                        alert(`Error: No pricing found for ${selectedPlan} plan`);
                        return;
                      }
                    }
                    
                    // Force open the modal
                    console.log('🚀 Opening manual payment modal...');
                    setShowManualPaymentModal(true);
                    
                    // Debug: Check if modal state changed
                    setTimeout(() => {
                      console.log('showManualPaymentModal (after):', true);
                    }, 100);
                  }}
                  disabled={loading}
                >
                  <CreditCard size={16} />
                  Proceed with Payment
                </button>
              )}
            </div>
            
            {selectedPlan !== 'free' && (
              <div className="payment-info">
                <Info size={16} />
                <span>Secure payment integration under development. Manual payment options available.</span>
              </div>
            )}
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

      {/* Manual Payment Modal */}
      <ManualPaymentModal
        isOpen={showManualPaymentModal}
        onClose={handleCloseManualPayment}
        paymentInfo={manualPaymentInfo}
        onPaymentProofSubmitted={handlePaymentProofSubmitted}
      />
    </div>
  );
};

export default CarListingManager;