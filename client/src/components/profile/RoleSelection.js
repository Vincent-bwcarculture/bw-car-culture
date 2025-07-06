// client/src/components/profile/RoleSelection.js
// COMPLETE VERSION: Enhanced Role Selection with Rental Providers & Private Seller Add-ons

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Car, 
  Shield, 
  Briefcase, 
  MapPin,
  CreditCard,
  CheckCircle,
  Clock,
  Star,
  Zap,
  Crown,
  User,
  Building,
  Truck,
  Camera,
  Video,
  MessageCircle,
  ExternalLink,
  AlertCircle,
  Info,
  Phone,
  Mail,
  Globe,
  Settings,
  Package,
  Calendar,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { http } from '../../config/axios.js';
import { 
  PRIVATE_SELLER_PLANS,
  DEALERSHIP_PLANS,
  RENTAL_PROVIDER_PLANS,
  ADDON_SERVICES,
  PRIVATE_SELLER_ADDONS,
  formatPrice,
  calculateTotal,
  getAvailableAddons,
  SELLER_TYPES,
  generateWhatsAppLink
} from '../../constants/subscriptionConfig.js';
import './RoleSelection.css';

const EnhancedRoleSelection = ({ profileData, refreshProfile }) => {
  // Component state
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSellerType, setSelectedSellerType] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [showSellerTypeModal, setShowSellerTypeModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddonInfo, setShowAddonInfo] = useState(false);
  const [currentAddon, setCurrentAddon] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Load pending role requests on mount
  useEffect(() => {
    loadPendingRequests();
  }, []);

  // Load pending role requests
  const loadPendingRequests = async () => {
    try {
      const response = await http.get('/api/admin/role-requests');
      if (response.data.success) {
        setPendingRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  // Role configurations with complete information
  const roleConfigurations = {
    dealer: {
      title: 'Car Seller',
      description: 'Sell cars as private seller or business dealership',
      icon: Car,
      color: '#3b82f6',
      requiresSubscription: true,
      hasSellerTypes: true,
      freeTrialDays: 14,
      sellerTypes: {
        [SELLER_TYPES.PRIVATE]: {
          title: 'Private Seller',
          description: 'Individual selling personal vehicles',
          icon: User,
          plans: PRIVATE_SELLER_PLANS,
          addons: PRIVATE_SELLER_ADDONS,
          benefits: [
            'Sell personal vehicles',
            'Individual dashboard',
            'Photo uploads',
            'Direct buyer contact',
            'One-time add-on services',
            'Subscribe per car'
          ]
        },
        [SELLER_TYPES.DEALERSHIP]: {
          title: 'Business Dealership',
          description: 'Professional car dealership business',
          icon: Building,
          plans: DEALERSHIP_PLANS,
          addons: getAvailableAddons('dealership'),
          benefits: [
            'Business profile',
            'Multiple car listings',
            'Lead management',
            'Professional add-ons',
            'Bulk listing management',
            'Monthly recurring services'
          ]
        },
        [SELLER_TYPES.RENTAL]: {
          title: 'Rental Provider',
          description: 'Car rental service business',
          icon: Truck,
          plans: RENTAL_PROVIDER_PLANS,
          addons: getAvailableAddons('rental'),
          benefits: [
            'Rental car fleet management',
            'Booking calendar system',
            'Availability tracking',
            'Customer database',
            'Rate management',
            'Multi-location support'
          ]
        }
      }
    },
    provider: {
      title: 'Service Provider',
      description: 'Automotive service business',
      icon: Briefcase,
      color: '#059669',
      requiresSubscription: true,
      plans: {
        basic: {
          name: 'Basic Provider',
          price: 500,
          features: ['5 service listings', 'Basic profile', 'Customer contact']
        },
        professional: {
          name: 'Professional Provider',
          price: 1200,
          features: ['15 service listings', 'Advanced profile', 'Booking system', 'Analytics']
        }
      },
      benefits: [
        'List automotive services',
        'Professional service profile',
        'Customer booking system',
        'Service portfolio showcase',
        'Customer reviews and ratings'
      ]
    },
    transport: {
      title: 'Transport Operator',
      description: 'Public transport route operator',
      icon: MapPin,
      color: '#7c3aed',
      requiresSubscription: true,
      plans: {
        company: {
          name: 'Transport Company',
          price: 1000,
          features: ['Unlimited route listings', 'Fleet management', 'Passenger tracking']
        }
      },
      benefits: [
        'Route management',
        'Real-time tracking',
        'Passenger information',
        'Fleet coordination',
        'Revenue analytics'
      ]
    },
    government: {
      title: 'Government Agency',
      description: 'Government oversight and regulation',
      icon: Shield,
      color: '#dc2626',
      requiresApproval: true,
      customPricing: true,
      benefits: [
        'Platform oversight',
        'Regulatory compliance',
        'Data analytics',
        'Public safety monitoring',
        'Policy enforcement'
      ]
    },
    // Free roles
    driver: {
      title: 'Driver',
      description: 'Public transport driver',
      icon: Users,
      color: '#6b7280',
      isFree: true,
      benefits: [
        'Driver dashboard',
        'Route assignments',
        'Earnings tracking',
        'Performance metrics',
        'Communication tools'
      ]
    },
    coordinator: {
      title: 'Route Coordinator',
      description: 'Transport route coordination',
      icon: MapPin,
      color: '#6b7280',
      isFree: true,
      benefits: [
        'Route management',
        'Driver coordination',
        'Schedule planning',
        'Performance monitoring',
        'Communication hub'
      ]
    },
    commuter: {
      title: 'Commuter',
      description: 'Public transport user',
      icon: Users,
      color: '#6b7280',
      isFree: true,
      benefits: [
        'Route information',
        'Real-time tracking',
        'Trip planning',
        'Fare information',
        'Service updates'
      ]
    }
  };

  // Handle role selection
  const handleRoleSelection = (roleId) => {
    const role = roleConfigurations[roleId];
    setSelectedRole(roleId);

    if (role.isFree) {
      // Handle free roles immediately
      requestRole(roleId);
    } else if (role.hasSellerTypes) {
      // Show seller type selection for dealer role
      setShowSellerTypeModal(true);
    } else if (role.requiresSubscription) {
      // Show pricing for other paid roles
      setShowPricingModal(true);
    } else if (role.requiresApproval) {
      // Handle government roles
      requestRole(roleId);
    }
  };

  // Handle seller type selection
  const handleSellerTypeSelection = (sellerType) => {
    setSelectedSellerType(sellerType);
    setShowSellerTypeModal(false);
    setShowPricingModal(true);
  };

  // Handle plan selection
  const handlePlanSelection = (planId) => {
    setSelectedPlan(planId);
    setShowPricingModal(false);
    setShowPaymentModal(true);
  };

  // Handle addon toggle
  const handleAddonToggle = (addonId) => {
    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  // Show addon information
  const showAddonDetails = (addon) => {
    setCurrentAddon(addon);
    setShowAddonInfo(true);
  };

  // Request role without payment
  const requestRole = async (roleId, additionalData = {}) => {
    try {
      setLoading(true);
      
      const requestData = {
        role: roleId,
        sellerType: selectedSellerType,
        ...additionalData
      };

      const response = await http.post('/api/user/request-role', requestData);
      
      if (response.data.success) {
        setMessage('Role request submitted successfully!');
        loadPendingRequests();
        resetSelections();
      } else {
        setError(response.data.message || 'Failed to submit role request');
      }
    } catch (error) {
      console.error('Role request error:', error);
      setError('Failed to submit role request');
    } finally {
      setLoading(false);
    }
  };

  // Initiate payment for paid roles
  const initiatePayment = async () => {
    if (!selectedRole || !selectedPlan) {
      setError('Please select a role and plan');
      return;
    }

    try {
      setPaymentLoading(true);

      const role = roleConfigurations[selectedRole];
      let plans, sellerType;

      if (role.hasSellerTypes && selectedSellerType) {
        const sellerTypeConfig = role.sellerTypes[selectedSellerType];
        plans = sellerTypeConfig.plans;
        sellerType = selectedSellerType;
      } else {
        plans = role.plans;
      }

      const plan = plans[selectedPlan];
      if (!plan) {
        setError('Invalid plan selected');
        return;
      }

      // Calculate total with add-ons
      const total = calculateTotal(sellerType || selectedRole, selectedPlan, selectedAddons);

      const paymentData = {
        role: selectedRole,
        sellerType,
        subscriptionTier: selectedPlan,
        addons: selectedAddons,
        amount: total,
        callbackUrl: window.location.href
      };

      const response = await http.post('/api/payments/initiate-role', paymentData);

      if (response.data.success) {
        // Redirect to payment
        window.location.href = response.data.data.paymentLink;
      } else {
        setError(response.data.message || 'Failed to initiate payment');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      setError('Failed to start payment process');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Generate WhatsApp booking link
  const generateBookingLink = (serviceType) => {
    const whatsappNumber = '+26771234567'; // Replace with actual number
    let message = 'Hi! I would like to book a service for my role subscription.';
    
    if (serviceType === 'photography') {
      message = 'Hi! I would like to book a photography session. Please provide details about scheduling and trip expenses.';
    } else if (serviceType === 'review') {
      message = 'Hi! I would like to book a professional car review session. Please provide details about scheduling and trip expenses.';
    }
    
    return `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
  };

  // Reset selections
  const resetSelections = () => {
    setSelectedRole('');
    setSelectedSellerType('');
    setSelectedPlan('');
    setSelectedAddons([]);
    setShowSellerTypeModal(false);
    setShowPricingModal(false);
    setShowPaymentModal(false);
    setShowAddonInfo(false);
    setCurrentAddon(null);
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

  // Render main role selection grid
  const renderRoleSelection = () => {
    return (
      <div className="role-selection-container">
        <div className="roles-header">
          <h2>Choose Your Role</h2>
          <p>Select how you want to participate in the BW Car Culture platform</p>
        </div>

        <div className="roles-grid">
          {Object.entries(roleConfigurations).map(([roleId, role]) => {
            const IconComponent = role.icon;
            
            return (
              <div
                key={roleId}
                className={`role-card ${role.isFree ? 'free-role' : 'paid-role'} ${role.requiresApproval ? 'approval-required' : ''}`}
                onClick={() => handleRoleSelection(roleId)}
                style={{ '--role-color': role.color }}
              >
                <div className="role-header">
                  <div className="role-icon">
                    <IconComponent size={32} />
                  </div>
                  <div className="role-info">
                    <h3>{role.title}</h3>
                    <p>{role.description}</p>
                  </div>
                  {role.isFree && <div className="free-badge">Free</div>}
                  {role.requiresApproval && <div className="approval-badge">Approval Required</div>}
                </div>

                <div className="role-benefits">
                  <h4>Benefits:</h4>
                  <ul>
                    {role.benefits.slice(0, 3).map((benefit, index) => (
                      <li key={index}>✓ {benefit}</li>
                    ))}
                    {role.benefits.length > 3 && (
                      <li className="more-benefits">+ {role.benefits.length - 3} more benefits</li>
                    )}
                  </ul>
                </div>

                {role.requiresSubscription && !role.customPricing && (
                  <div className="role-pricing">
                    {role.hasSellerTypes ? (
                      <div className="pricing-range">
                        <span>From {formatPrice(50)} - {formatPrice(6000)}/month</span>
                        <small>Depends on seller type and plan</small>
                      </div>
                    ) : role.plans ? (
                      <div className="pricing-range">
                        <span>From {formatPrice(Math.min(...Object.values(role.plans).map(p => p.price)))}/month</span>
                      </div>
                    ) : null}
                  </div>
                )}

                {role.customPricing && (
                  <div className="role-pricing">
                    <span>Custom Pricing</span>
                    <small>Contact for quote</small>
                  </div>
                )}

                <div className="role-action">
                  <button className="select-role-btn">
                    {role.isFree ? 'Join Free' : 
                     role.requiresApproval ? 'Request Access' :
                     role.hasSellerTypes ? 'Choose Seller Type' : 
                     'Select Plan'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {pendingRequests.length > 0 && (
          <div className="pending-requests">
            <h3>Pending Requests</h3>
            <div className="requests-list">
              {pendingRequests.map((request, index) => (
                <div key={index} className="request-item">
                  <div className="request-info">
                    <span className="request-role">{request.role}</span>
                    <span className="request-status">{request.status}</span>
                  </div>
                  <span className="request-date">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render seller type selection modal
  const renderSellerTypeModal = () => {
    if (!showSellerTypeModal || !selectedRole) return null;

    const role = roleConfigurations[selectedRole];
    const sellerTypes = role.sellerTypes;

    return (
      <div className="modal-overlay">
        <div className="seller-type-modal">
          <div className="modal-header">
            <h3>Choose Your Seller Type</h3>
            <p>Select how you want to sell vehicles on our platform</p>
            <button 
              className="close-modal-btn"
              onClick={() => setShowSellerTypeModal(false)}
            >
              ×
            </button>
          </div>

          <div className="seller-types-grid">
            {Object.entries(sellerTypes).map(([typeId, type]) => {
              const IconComponent = type.icon;
              
              return (
                <div key={typeId} className="seller-type-card">
                  <div className="type-header">
                    <div className="type-icon">
                      <IconComponent size={32} />
                    </div>
                    <div className="type-info">
                      <h4>{type.title}</h4>
                      <p>{type.description}</p>
                    </div>
                  </div>

                  <div className="type-benefits">
                    <h5>Features:</h5>
                    <ul>
                      {type.benefits.map((benefit, index) => (
                        <li key={index}>✓ {benefit}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="type-pricing">
                    {typeId === 'private' && (
                      <div className="pricing-info">
                        <span className="price-range">{formatPrice(50)} - {formatPrice(200)} per car</span>
                        <small>Subscribe per vehicle</small>
                      </div>
                    )}
                    {typeId === 'dealership' && (
                      <div className="pricing-info">
                        <span className="price-range">{formatPrice(1000)} - {formatPrice(6000)}/month</span>
                        <small>Multiple vehicles per subscription</small>
                      </div>
                    )}
                    {typeId === 'rental' && (
                      <div className="pricing-info">
                        <span className="price-range">{formatPrice(350)} - {formatPrice(600)}/month</span>
                        <small>Rental fleet management</small>
                      </div>
                    )}
                  </div>

                  <button
                    className="select-type-btn"
                    onClick={() => handleSellerTypeSelection(typeId)}
                  >
                    Select {type.title}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Render pricing modal
  const renderPricingModal = () => {
    if (!showPricingModal || !selectedRole) return null;

    const role = roleConfigurations[selectedRole];
    let plans, sellerTypeConfig;

    if (role.hasSellerTypes && selectedSellerType) {
      sellerTypeConfig = role.sellerTypes[selectedSellerType];
      plans = sellerTypeConfig.plans;
    } else {
      plans = role.plans;
    }

    return (
      <div className="modal-overlay">
        <div className="pricing-modal">
          <div className="modal-header">
            <h3>Choose Your Plan</h3>
            {sellerTypeConfig && (
              <p>{sellerTypeConfig.title} - {sellerTypeConfig.description}</p>
            )}
            <button 
              className="close-modal-btn"
              onClick={() => setShowPricingModal(false)}
            >
              ×
            </button>
          </div>

          <div className="plans-grid">
            {Object.entries(plans).map(([planId, plan]) => (
              <div 
                key={planId} 
                className={`plan-card ${plan.popular ? 'popular' : ''}`}
              >
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                
                <div className="plan-header">
                  <h4>{plan.name}</h4>
                  <div className="plan-price">
                    {formatPrice(plan.price)}
                    <span className="price-period">
                      {selectedSellerType === 'private' ? '/car' : '/month'}
                    </span>
                  </div>
                  <p className="plan-description">{plan.description}</p>
                </div>

                <div className="plan-features">
                  {selectedSellerType === 'private' ? (
                    <div className="main-feature">
                      <strong>1 car listing</strong> per subscription
                    </div>
                  ) : (
                    <div className="main-feature">
                      <strong>Up to {plan.features?.maxListings || 'unlimited'}</strong> listings
                    </div>
                  )}
                  
                  <div className="feature-list">
                    {plan.features && typeof plan.features === 'object' ? (
                      Object.entries(plan.features).map(([key, value]) => (
                        <div key={key} className="feature-item">
                          <CheckCircle size={14} />
                          <span>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}: {value.toString()}</span>
                        </div>
                      ))
                    ) : plan.features && Array.isArray(plan.features) ? (
                      plan.features.map((feature, index) => (
                        <div key={index} className="feature-item">
                          <CheckCircle size={14} />
                          <span>{feature}</span>
                        </div>
                      ))
                    ) : null}
                  </div>
                </div>

                <button
                  className={`select-plan-btn ${plan.popular ? 'popular-btn' : ''}`}
                  onClick={() => handlePlanSelection(planId)}
                >
                  Select {plan.name}
                </button>
              </div>
            ))}
          </div>

          {/* Add-ons section for private sellers */}
          {selectedSellerType === 'private' && (
            <div className="addons-section">
              <h3>Available Add-ons</h3>
              <p>Enhance your listing with professional services (one-time payments)</p>
              
              <div className="addons-grid">
                {Object.entries(PRIVATE_SELLER_ADDONS).map(([addonId, addon]) => (
                  <div key={addonId} className="addon-card">
                    <div className="addon-header">
                      <div className="addon-icon">
                        {addonId.includes('photography') && <Camera size={20} />}
                        {addonId.includes('sponsored') && <Star size={20} />}
                        {addonId.includes('review') && <Video size={20} />}
                      </div>
                      <div className="addon-info">
                        <h4>{addon.name}</h4>
                        <p className="addon-price">{formatPrice(addon.price)} one-time</p>
                      </div>
                    </div>

                    <div className="addon-description">
                      <p>{addon.description}</p>
                    </div>

                    {addon.requiresBooking && (
                      <div className="booking-notice">
                        <Calendar size={14} />
                        <span>Requires WhatsApp booking</span>
                        <button
                          className="info-btn"
                          onClick={() => showAddonDetails(addon)}
                        >
                          <Info size={14} />
                        </button>
                      </div>
                    )}

                    <div className="addon-actions">
                      <label className="addon-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedAddons.includes(addonId)}
                          onChange={() => handleAddonToggle(addonId)}
                        />
                        <span>Add to subscription</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render payment modal
  const renderPaymentModal = () => {
    if (!showPaymentModal || !selectedRole || !selectedPlan) return null;

    const role = roleConfigurations[selectedRole];
    let plans, sellerTypeConfig;

    if (role.hasSellerTypes && selectedSellerType) {
      sellerTypeConfig = role.sellerTypes[selectedSellerType];
      plans = sellerTypeConfig.plans;
    } else {
      plans = role.plans;
    }

    const plan = plans[selectedPlan];
    const availableAddons = selectedSellerType === 'private' ? 
      Object.values(PRIVATE_SELLER_ADDONS).filter(addon => selectedAddons.includes(addon.id)) : 
      [];
    
    const total = calculateTotal(selectedSellerType || selectedRole, selectedPlan, selectedAddons);

    return (
      <div className="modal-overlay">
        <div className="payment-modal">
          <div className="modal-header">
            <h3>Complete Your Subscription</h3>
            <p>Review your selection and proceed with payment</p>
            <button 
              className="close-modal-btn"
              onClick={() => setShowPaymentModal(false)}
            >
              ×
            </button>
          </div>
          
          <div className="payment-summary">
            <div className="summary-section">
              <h4>Role & Plan</h4>
              <div className="summary-item">
                <span>Role:</span>
                <span>{role.title}</span>
              </div>
              {sellerTypeConfig && (
                <div className="summary-item">
                  <span>Type:</span>
                  <span>{sellerTypeConfig.title}</span>
                </div>
              )}
              <div className="summary-item">
                <span>Plan:</span>
                <span>{plan.name}</span>
                <span>{formatPrice(plan.price)}</span>
              </div>
            </div>
            
            {availableAddons.length > 0 && (
              <div className="summary-section">
                <h4>Add-on Services</h4>
                {availableAddons.map((addon) => (
                  <div key={addon.id} className="summary-item">
                    <span>{addon.name}</span>
                    <span>{formatPrice(addon.price)}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="total-section">
              <div className="total-item">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>
              <small>
                {selectedSellerType === 'private' ? 
                  'Per vehicle subscription + one-time add-ons' :
                  'Monthly subscription'}
              </small>
            </div>
          </div>
          
          <div className="payment-actions">
            <button 
              className="back-btn"
              onClick={() => {
                setShowPaymentModal(false);
                setShowPricingModal(true);
              }}
            >
              Back to Plans
            </button>
            <button 
              className="pay-btn"
              onClick={initiatePayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? 'Processing...' : `Pay ${formatPrice(total)}`}
            </button>
          </div>
          
          <div className="payment-note">
            <Shield size={16} />
            <span>Secure payment powered by Flutterwave. 30-day money-back guarantee.</span>
          </div>
        </div>
      </div>
    );
  };

  // Render add-on info modal
  const renderAddonInfoModal = () => {
    if (!showAddonInfo || !currentAddon) return null;

    const whatsappLink = generateBookingLink(
      currentAddon.id.includes('photography') ? 'photography' : 
      currentAddon.id.includes('review') ? 'review' : 'general'
    );

    return (
      <div className="modal-overlay">
        <div className="addon-info-modal">
          <div className="modal-header">
            <h3>{currentAddon.name}</h3>
            <p>{formatPrice(currentAddon.price)} - One-time payment</p>
            <button 
              className="close-modal-btn"
              onClick={() => setShowAddonInfo(false)}
            >
              ×
            </button>
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
              className="close-btn"
              onClick={() => setShowAddonInfo(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="enhanced-role-selection">
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

      {/* Main role selection */}
      {renderRoleSelection()}

      {/* Modals */}
      {renderSellerTypeModal()}
      {renderPricingModal()}
      {renderPaymentModal()}
      {renderAddonInfoModal()}
    </div>
  );
};

export default EnhancedRoleSelection;
