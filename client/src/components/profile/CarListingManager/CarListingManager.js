// client/src/components/profile/CarListingManager/CarListingManager.js
// COMPLETE FULL VERSION: With Rental Providers & Private Seller Add-ons

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building, 
  Car, 
  Camera, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Info, 
  Shield, 
  CreditCard,
  AlertCircle,
  Plus,
  Zap,
  Star,
  MessageCircle,
  Calendar,
  Video,
  Eye,
  Phone,
  MapPin,
  Truck,
  Settings,
  Package,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { http } from '../../../config/axios.js';
import { 
  getPlansBySellerType, 
  formatPrice, 
  getSubscriptionModel,
  SELLER_TYPES,
  generateWhatsAppLink
} from '../../../constants/subscriptionConfig.js';
import './CarListingManager.css';

const CarListingManager = ({ user, onUpdate }) => {
  // Component state
  const [currentStep, setCurrentStep] = useState('vehicles');
  const [sellerType, setSellerType] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [showSellerTypeSelection, setShowSellerTypeSelection] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [currentAddon, setCurrentAddon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Data state
  const [listings, setListings] = useState([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [availableTiers, setAvailableTiers] = useState(null);
  const [availableAddons, setAvailableAddons] = useState({});
  const [userAddons, setUserAddons] = useState([]);
  const [pendingListingId, setPendingListingId] = useState(null);
  const [paymentType, setPaymentType] = useState('subscription');

  // Load data on component mount
  useEffect(() => {
    loadUserData();
    checkUserSellerType();
    loadUserAddons();
  }, []);

  // Check if user has a seller type already set
  const checkUserSellerType = async () => {
    try {
      const response = await http.get('/api/payments/available-tiers');
      if (response.data.success) {
        setSellerType(response.data.data.sellerType);
        setAvailableTiers(response.data.data.tiers);
        setAvailableAddons(response.data.data.addons || {});
      }
    } catch (error) {
      console.error('Error checking seller type:', error);
    }
  };

  // Load user's listings and subscriptions
  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load listings
      const listingsResponse = await http.get('/api/listings/my-listings');
      if (listingsResponse.data.success) {
        setListings(listingsResponse.data.data);
      }

      // Load subscription analytics
      const analyticsResponse = await http.get('/api/payments/analytics');
      if (analyticsResponse.data.success) {
        setActiveSubscriptions(analyticsResponse.data.data.subscriptions);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Failed to load your data');
    } finally {
      setLoading(false);
    }
  };

  // Load user's active add-ons
  const loadUserAddons = async () => {
    try {
      const response = await http.get('/api/addons/my-addons');
      if (response.data.success) {
        setUserAddons(response.data.data.activeAddons);
      }
    } catch (error) {
      console.error('Error loading user add-ons:', error);
    }
  };

  // Handle seller type selection
  const handleSellerTypeSelection = async (type) => {
    try {
      setLoading(true);
      setSellerType(type);
      
      // If this is a change, update user profile
      if (sellerType && sellerType !== type) {
        await updateUserSellerType(type);
      }
      
      setShowSellerTypeSelection(false);
      setCurrentStep('pricing');
      
      // Load available tiers for this seller type
      const response = await http.get('/api/payments/available-tiers');
      if (response.data.success) {
        setAvailableTiers(response.data.data.tiers);
        setAvailableAddons(response.data.data.addons || {});
      }
    } catch (error) {
      console.error('Error setting seller type:', error);
      setError('Failed to update seller type');
    } finally {
      setLoading(false);
    }
  };

  // Update user's seller type in profile
  const updateUserSellerType = async (type) => {
    try {
      await http.put('/api/user/profile', {
        sellerType: type
      });
    } catch (error) {
      console.error('Error updating seller type:', error);
    }
  };

  // Handle subscription for a specific listing
  const handleSubscribeToListing = async (listingId) => {
    try {
      const eligibilityResponse = await http.post('/api/payments/check-eligibility', {
        listingId
      });
      
      if (!eligibilityResponse.data.success || !eligibilityResponse.data.data.eligible) {
        setError(eligibilityResponse.data.message || 'This listing is not eligible for subscription');
        return;
      }
      
      setPendingListingId(listingId);
      setPaymentType('subscription');
      
      // If no seller type set, show selection
      if (!sellerType) {
        setShowSellerTypeSelection(true);
        return;
      }
      
      // Go directly to pricing
      setCurrentStep('pricing');
      
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setError('Failed to check subscription eligibility');
    }
  };

  // Handle add-on purchase for a specific listing
  const handleBuyAddon = async (listingId, addonId) => {
    try {
      setPendingListingId(listingId);
      setSelectedAddons([addonId]);
      setPaymentType('addon');
      
      // Get addon details
      const addon = availableAddons[addonId];
      if (!addon) {
        setError('Add-on not found');
        return;
      }

      setCurrentAddon(addon);
      
      // If addon requires booking, show booking modal
      if (addon.requiresBooking) {
        setShowAddonModal(true);
      } else {
        // Proceed directly to payment
        await initiateAddonPayment(listingId, [addonId]);
      }
      
    } catch (error) {
      console.error('Error handling add-on purchase:', error);
      setError('Failed to process add-on purchase');
    }
  };

  // Initiate addon payment
  const initiateAddonPayment = async (listingId, addons) => {
    try {
      setLoading(true);

      const response = await http.post('/api/payments/initiate', {
        listingId,
        addons,
        paymentType: 'addon',
        sellerType,
        callbackUrl: window.location.href
      });

      if (response.data.success) {
        window.location.href = response.data.data.paymentLink;
      } else {
        setError(response.data.message || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Add-on payment initiation error:', error);
      setError('Failed to start payment process');
    } finally {
      setLoading(false);
    }
  };

  // Handle plan selection and payment
  const handlePlanSelection = async (planId) => {
    if (!pendingListingId) {
      setError('No listing selected for subscription');
      return;
    }

    try {
      setLoading(true);
      setSelectedPlan(planId);

      const response = await http.post('/api/payments/initiate', {
        listingId: pendingListingId,
        subscriptionTier: planId,
        paymentType: 'subscription',
        sellerType,
        callbackUrl: window.location.href
      });

      if (response.data.success) {
        window.location.href = response.data.data.paymentLink;
      } else {
        setError(response.data.message || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setError('Failed to start payment process');
    } finally {
      setLoading(false);
    }
  };

  // Get seller type information
  const getSellerTypeInfo = (type) => {
    const info = {
      private: {
        title: 'Private Seller',
        description: 'Individual selling personal vehicles',
        icon: User,
        color: '#3b82f6',
        model: '1 car per subscription',
        note: 'Subscribe multiple times to list multiple cars',
        benefits: [
          'Subscribe for each car individually',
          'Choose different plans for different cars',
          'No monthly bulk fees',
          'Pay only when you have a car to sell',
          'One-time add-on services available'
        ]
      },
      dealership: {
        title: 'Business Dealership',
        description: 'Professional car dealership business',
        icon: Building,
        color: '#f59e0b',
        model: 'Multiple cars per subscription',
        note: 'One subscription covers multiple cars',
        benefits: [
          'List multiple cars with one subscription',
          'Business profile features',
          'Bulk listing management',
          'Professional add-ons available',
          'Monthly recurring add-on services'
        ]
      },
      rental: {
        title: 'Rental Provider',
        description: 'Car rental service business',
        icon: Truck,
        color: '#06b6d4',
        model: 'Rental fleet management',
        note: 'Specialized for rental car businesses',
        benefits: [
          'Rental calendar integration',
          'Booking management system',
          'Availability tracking',
          'Rental rate management',
          'Customer database access'
        ]
      }
    };
    return info[type];
  };

  // Format subscription status for listings
  const getListingSubscriptionStatus = (listing) => {
    if (!listing.subscription) {
      return { status: 'none', text: 'Not subscribed', canSubscribe: true };
    }

    const { status, expiresAt } = listing.subscription;
    const now = new Date();
    const expires = new Date(expiresAt);

    if (status === 'active' && expires > now) {
      const daysLeft = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
      return { 
        status: 'active', 
        text: `Active (${daysLeft} days left)`, 
        canSubscribe: false,
        expiresAt: expires
      };
    }

    return { status: 'expired', text: 'Expired', canSubscribe: true };
  };

  // Get listing add-ons status
  const getListingAddons = (listing) => {
    return listing.addons?.active || [];
  };

  // Generate WhatsApp booking link
  const generateBookingLink = (serviceType) => {
    const whatsappNumber = '+26771234567'; // Replace with actual number
    let message = 'Hi! I would like to book a service for my car listing.';
    
    if (serviceType === 'photography') {
      message = 'Hi! I would like to book a photography session for my car listing. Please provide details about scheduling and trip expenses.';
    } else if (serviceType === 'review') {
      message = 'Hi! I would like to book a professional car review session. Please provide details about scheduling and trip expenses.';
    }
    
    return `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
  };

  // Show message helper
  const showMessage = (type, text) => {
    if (type === 'error') setError(text);
    else setMessage(text);
    
    setTimeout(() => {
      setError('');
      setMessage('');
    }, 5000);
  };

  // Render vehicle listings with subscription and add-on options
  const renderVehicleListings = () => {
    return (
      <div className="vehicle-listings-section">
        <div className="section-header">
          <h3>My Vehicle Listings</h3>
          <p>Manage subscriptions and add-ons for your car listings</p>
        </div>

        {sellerType && (
          <div className="seller-type-info">
            <div className="seller-badge">
              {getSellerTypeInfo(sellerType).icon && 
                React.createElement(getSellerTypeInfo(sellerType).icon, { size: 20 })}
              <span>{getSellerTypeInfo(sellerType).title}</span>
            </div>
            <div className="subscription-model">
              <Info size={16} />
              <span>{getSellerTypeInfo(sellerType).model} - {getSellerTypeInfo(sellerType).note}</span>
            </div>
            <button 
              className="change-type-btn"
              onClick={() => setShowSellerTypeSelection(true)}
            >
              Change Seller Type
            </button>
          </div>
        )}

        <div className="listings-grid">
          {listings.length === 0 ? (
            <div className="no-listings">
              <Car size={48} />
              <h4>No listings yet</h4>
              <p>Create your first car listing to get started</p>
              <button className="create-listing-btn">
                <Plus size={16} />
                Create Listing
              </button>
            </div>
          ) : (
            listings.map(listing => {
              const subscriptionStatus = getListingSubscriptionStatus(listing);
              const listingAddons = getListingAddons(listing);
              
              return (
                <div key={listing._id} className="listing-card">
                  <div className="listing-image">
                    {listing.images?.main ? (
                      <img src={listing.images.main} alt={listing.title} />
                    ) : (
                      <div className="no-image">
                        <Car size={32} />
                      </div>
                    )}
                  </div>
                  
                  <div className="listing-info">
                    <h4>{listing.title}</h4>
                    <p className="price">{formatPrice(listing.price)}</p>
                    
                    <div className={`subscription-status ${subscriptionStatus.status}`}>
                      <span>{subscriptionStatus.text}</span>
                      {subscriptionStatus.status === 'active' && (
                        <span className="tier-badge">{listing.subscription.tier}</span>
                      )}
                    </div>

                    {listingAddons.length > 0 && (
                      <div className="active-addons">
                        <h5>Active Add-ons:</h5>
                        <div className="addon-tags">
                          {listingAddons.map((addon, index) => (
                            <span key={index} className="addon-tag">
                              {availableAddons[addon.id]?.name || addon.id}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="listing-actions">
                    {subscriptionStatus.canSubscribe ? (
                      <button 
                        className="subscribe-btn"
                        onClick={() => handleSubscribeToListing(listing._id)}
                        disabled={loading}
                      >
                        <Zap size={16} />
                        Subscribe Now
                      </button>
                    ) : (
                      <div className="active-subscription-info">
                        <CheckCircle size={16} />
                        <span>Active until {subscriptionStatus.expiresAt?.toLocaleDateString()}</span>
                      </div>
                    )}

                    {/* Add-ons section */}
                    {Object.keys(availableAddons).length > 0 && (
                      <div className="addons-section">
                        <h5>Available Add-ons:</h5>
                        <div className="addon-buttons">
                          {Object.entries(availableAddons).map(([addonId, addon]) => {
                            const hasAddon = listingAddons.some(a => a.id === addonId);
                            
                            return (
                              <button
                                key={addonId}
                                className={`addon-btn ${hasAddon ? 'owned' : ''}`}
                                onClick={() => hasAddon ? null : handleBuyAddon(listing._id, addonId)}
                                disabled={hasAddon || loading}
                                title={hasAddon ? 'Already purchased' : `${addon.name} - ${formatPrice(addon.price)}`}
                              >
                                {addonId.includes('photography') && <Camera size={14} />}
                                {addonId.includes('sponsored') && <Star size={14} />}
                                {addonId.includes('review') && <Video size={14} />}
                                <span>{addon.name}</span>
                                {!hasAddon && <span className="addon-price">{formatPrice(addon.price)}</span>}
                                {hasAddon && <CheckCircle size={14} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Seller type specific notes */}
        <div className="seller-notes">
          {sellerType === 'private' && (
            <div className="private-seller-note">
              <Info size={16} />
              <div>
                <strong>Individual Seller Model:</strong> Each subscription covers 1 car listing. 
                You can subscribe multiple times to list multiple cars simultaneously.
                Add-ons are one-time purchases per vehicle.
              </div>
            </div>
          )}
          
          {sellerType === 'rental' && (
            <div className="rental-provider-note">
              <Truck size={16} />
              <div>
                <strong>Rental Provider Model:</strong> Manage your rental car fleet with 
                integrated booking calendar and availability tracking. Perfect for rental businesses.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render seller type selection modal
  const renderSellerTypeSelection = () => {
    if (!showSellerTypeSelection) return null;

    return (
      <div className="seller-type-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Select Your Seller Type</h3>
            <p>Choose how you want to sell vehicles on our platform</p>
          </div>

          <div className="seller-options">
            {Object.values(SELLER_TYPES).map(type => {
              const info = getSellerTypeInfo(type);
              const IconComponent = info.icon;
              
              return (
                <div key={type} className="seller-option-card">
                  <div className="option-header">
                    <div className="option-icon" style={{ backgroundColor: info.color }}>
                      <IconComponent size={24} />
                    </div>
                    <div className="option-info">
                      <h4>{info.title}</h4>
                      <p>{info.description}</p>
                    </div>
                  </div>
                  
                  <div className="option-model">
                    <strong>Subscription Model:</strong> {info.model}
                  </div>
                  
                  <div className="option-benefits">
                    <h5>Benefits:</h5>
                    <ul>
                      {info.benefits.map((benefit, index) => (
                        <li key={index}>✓ {benefit}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <button 
                    className="select-option-btn"
                    onClick={() => handleSellerTypeSelection(type)}
                    disabled={loading}
                  >
                    Choose {info.title}
                  </button>
                </div>
              );
            })}
          </div>

          <button 
            className="close-modal-btn"
            onClick={() => setShowSellerTypeSelection(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Render add-on booking modal
  const renderAddonModal = () => {
    if (!showAddonModal || !currentAddon) return null;

    const whatsappLink = generateBookingLink(
      currentAddon.id.includes('photography') ? 'photography' : 
      currentAddon.id.includes('review') ? 'review' : 'general'
    );

    return (
      <div className="addon-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h3>{currentAddon.name}</h3>
            <p>{formatPrice(currentAddon.price)} - One-time payment</p>
          </div>

          <div className="addon-details">
            <h4>Service includes:</h4>
            <ul>
              {currentAddon.features?.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>
          </div>

          {currentAddon.requiresBooking && (
            <div className="booking-section">
              <div className="booking-notice">
                <Calendar size={20} />
                <div>
                  <h4>Booking Required</h4>
                  <p>This service requires scheduling. Contact us via WhatsApp to arrange your session.</p>
                  <p><strong>Note:</strong> Trip expenses are charged separately and will be discussed during booking.</p>
                </div>
              </div>

              <div className="booking-actions">
                <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-btn"
                >
                  <MessageCircle size={16} />
                  Book via WhatsApp
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button 
              className="cancel-btn"
              onClick={() => setShowAddonModal(false)}
            >
              Cancel
            </button>
            <button 
              className="proceed-btn"
              onClick={() => {
                setShowAddonModal(false);
                initiateAddonPayment(pendingListingId, selectedAddons);
              }}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Pay ${formatPrice(currentAddon.price)}`}
            </button>
          </div>

          <div className="payment-note">
            <Info size={16} />
            <span>Secure payment powered by Flutterwave. Service booking via WhatsApp.</span>
          </div>
        </div>
      </div>
    );
  };

  // Render pricing selection
  const renderPricingSelection = () => {
    if (currentStep !== 'pricing' || !sellerType || !availableTiers) return null;

    const sellerInfo = getSellerTypeInfo(sellerType);
    const subscriptionModel = getSubscriptionModel(sellerType);

    return (
      <div className="pricing-selection">
        <div className="pricing-header">
          <button 
            className="back-btn"
            onClick={() => setCurrentStep('vehicles')}
          >
            ← Back to Listings
          </button>
          
          <h3>Choose Your {sellerInfo.title} Plan</h3>
          <p>{sellerInfo.description}</p>
          
          <div className="subscription-model-info">
            <Info size={16} />
            <span>{subscriptionModel.description}</span>
          </div>
        </div>

        <div className="plans-grid">
          {Object.entries(availableTiers).map(([planId, plan]) => (
            <div key={planId} className={`plan-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              
              <div className="plan-header">
                <h4>{plan.name}</h4>
                <div className="plan-price">
                  {formatPrice(plan.price)}
                  <span className="price-period">
                    {sellerType === 'private' ? '/car' : '/month'}
                  </span>
                </div>
                <p className="plan-description">
                  {sellerType === 'private' ? 
                    `For 1 car listing (${plan.duration} days)` : 
                    sellerType === 'rental' ?
                    `Up to ${plan.maxListings} rental cars with booking system` :
                    `Up to ${plan.maxListings} car listings`}
                </p>
              </div>

              <div className="plan-features">
                <div className="main-feature">
                  <strong>{plan.maxListings}</strong> car listing{plan.maxListings > 1 ? 's' : ''}
                </div>
                
                <div className="feature-list">
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>{plan.duration} days duration</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Dashboard access</span>
                  </div>
                  <div className="feature-item">
                    <CheckCircle size={14} />
                    <span>Social media marketing</span>
                  </div>
                  {sellerType === 'rental' && (
                    <>
                      <div className="feature-item">
                        <CheckCircle size={14} />
                        <span>Booking calendar</span>
                      </div>
                      <div className="feature-item">
                        <CheckCircle size={14} />
                        <span>Availability tracking</span>
                      </div>
                    </>
                  )}
                  {plan.maxListings > 5 && (
                    <div className="feature-item">
                      <CheckCircle size={14} />
                      <span>Advanced analytics</span>
                    </div>
                  )}
                </div>
              </div>

              <button 
                className={`select-plan-btn ${plan.popular ? 'popular-btn' : ''}`}
                onClick={() => handlePlanSelection(planId)}
                disabled={loading}
              >
                {loading && selectedPlan === planId ? 'Processing...' : `Select ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-notes">
          <div className="note-item">
            <Clock size={16} />
            <span>All plans include secure payment processing</span>
          </div>
          <div className="note-item">
            <Shield size={16} />
            <span>30-day money-back guarantee</span>
          </div>
          {sellerType === 'private' && (
            <div className="note-item">
              <CreditCard size={16} />
              <span>Subscribe multiple times to list multiple cars</span>
            </div>
          )}
          {sellerType === 'rental' && (
            <div className="note-item">
              <Calendar size={16} />
              <span>Includes booking management and calendar integration</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="car-listing-manager">
      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {message && (
        <div className="success-message">
          <CheckCircle size={16} />
          <span>{message}</span>
          <button onClick={() => setMessage('')}>×</button>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="manager-nav">
        <button 
          className={currentStep === 'vehicles' ? 'active' : ''}
          onClick={() => setCurrentStep('vehicles')}
        >
          <Car size={16} />
          My Vehicles
        </button>
        {sellerType && availableAddons && Object.keys(availableAddons).length > 0 && (
          <button 
            className={currentStep === 'addons' ? 'active' : ''}
            onClick={() => setCurrentStep('addons')}
          >
            <Package size={16} />
            Add-ons ({userAddons.length})
          </button>
        )}
      </div>

      {/* Main content */}
      {currentStep === 'vehicles' && renderVehicleListings()}
      {currentStep === 'addons' && renderAddonsManagement()}
      
      {/* Modals */}
      {renderSellerTypeSelection()}
      {renderAddonModal()}
      
      {/* Pricing when ready to subscribe */}
      {renderPricingSelection()}
    </div>
  );

  // Render add-ons management section
  function renderAddonsManagement() {
    return (
      <div className="addons-management-section">
        <div className="section-header">
          <h3>My Add-on Services</h3>
          <p>Manage your purchased add-on services</p>
        </div>

        {userAddons.length === 0 ? (
          <div className="no-addons">
            <Package size={48} />
            <h4>No add-ons purchased yet</h4>
            <p>Purchase add-ons from your vehicle listings to enhance visibility and features</p>
            <button 
              className="back-to-vehicles-btn"
              onClick={() => setCurrentStep('vehicles')}
            >
              <ArrowRight size={16} />
              Browse Available Add-ons
            </button>
          </div>
        ) : (
          <div className="addons-grid">
            {userAddons.map((addon, index) => {
              const addonInfo = availableAddons[addon.id];
              
              return (
                <div key={index} className="addon-card">
                  <div className="addon-header">
                    <div className="addon-icon">
                      {addon.id.includes('photography') && <Camera size={24} />}
                      {addon.id.includes('sponsored') && <Star size={24} />}
                      {addon.id.includes('review') && <Video size={24} />}
                    </div>
                    <div className="addon-info">
                      <h4>{addonInfo?.name || addon.id}</h4>
                      <p>Purchased: {new Date(addon.purchasedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="addon-details">
                    <p><strong>Listing:</strong> {addon.listingTitle}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status-badge ${addon.status}`}>{addon.status}</span>
                    </p>
                  </div>

                  {addonInfo?.requiresBooking && (
                    <div className="booking-info">
                      <MessageCircle size={16} />
                      <span>Requires booking via WhatsApp</span>
                      <a 
                        href={generateBookingLink(
                          addon.id.includes('photography') ? 'photography' : 
                          addon.id.includes('review') ? 'review' : 'general'
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="book-now-btn"
                      >
                        Book Now
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="addons-help">
          <div className="help-item">
            <Phone size={16} />
            <div>
              <strong>Need Help?</strong>
              <p>Contact us via WhatsApp for any questions about your add-on services.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default CarListingManager;