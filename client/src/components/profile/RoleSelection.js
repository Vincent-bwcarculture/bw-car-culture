// client/src/components/profile/EnhancedRoleSelection.js - Updated for seller types
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
  Building
} from 'lucide-react';
import { 
  PRIVATE_SELLER_PLANS,
  DEALERSHIP_PLANS,
  PROVIDER_PLANS, 
  TRANSPORT_PLANS,
  GOVERNMENT_PLANS,
  FREE_ACCESS_ROLES,
  ADDON_SERVICES,
  formatPrice,
  calculateTotal,
  getAvailableAddons,
  SELLER_TYPES
} from '../../constants/subscriptionConfig.js';
import './RoleSelection.css';

const EnhancedRoleSelection = ({ profileData, refreshProfile }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedSellerType, setSelectedSellerType] = useState(''); // NEW: For dealer type selection
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [showSellerTypeModal, setShowSellerTypeModal] = useState(false); // NEW: Seller type selection
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Role configurations
  const roleConfigurations = {
    dealer: {
      title: 'Car Seller',
      description: 'Sell cars as private seller or business dealership',
      icon: Car,
      color: '#3b82f6',
      requiresSubscription: true,
      hasSellerTypes: true, // NEW: Indicates this role has seller type options
      freeTrialDays: 14,
      sellerTypes: {
        [SELLER_TYPES.PRIVATE]: {
          title: 'Private Seller',
          description: 'Individual selling personal vehicles',
          icon: User,
          plans: PRIVATE_SELLER_PLANS,
          benefits: ['Sell personal vehicles', 'Basic dashboard', 'Photo uploads', 'Direct buyer contact']
        },
        [SELLER_TYPES.DEALERSHIP]: {
          title: 'Business Dealership', 
          description: 'Professional car dealership business',
          icon: Building,
          plans: DEALERSHIP_PLANS,
          benefits: ['Professional inventory management', 'Advanced marketing tools', 'Business analytics', 'Add-on services']
        }
      }
    },
    
    transport_company: {
      title: 'Transport Company',
      description: 'For NKK Express, taxi/combi companies, bus operators',
      icon: MapPin,
      color: '#f59e0b',
      requiresSubscription: true,
      plans: { dashboard: TRANSPORT_PLANS.COMPANY_DASHBOARD }
    },
    
    provider: {
      title: 'Service Provider',
      description: 'Automotive services: mechanics, body shops, detailing',
      icon: Briefcase,
      color: '#059669',
      requiresSubscription: true,
      plans: PROVIDER_PLANS
    },
    
    coordinator: {
      title: 'Transport Coordinator',
      description: 'Manage transport stations - completely free!',
      icon: Users,
      color: '#8b5cf6',
      requiresSubscription: false,
      features: ['Free station management', 'Queue coordination', 'Route monitoring', 'Performance analytics'],
      note: 'Always free for verified coordinators'
    },
    
    ministry: {
      title: 'Ministry Official',
      description: 'Government transport oversight',
      icon: Shield,
      color: '#dc2626',
      requiresSubscription: false,
      plans: GOVERNMENT_PLANS,
      features: ['Full system oversight', 'Compliance monitoring', 'Custom reports', 'Policy tools'],
      note: 'Custom pricing - contact for details'
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/role-requests/my-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const getCurrentRole = () => profileData?.role || 'user';

  const hasRole = (roleId) => {
    const currentRole = getCurrentRole();
    return currentRole === roleId || 
           (roleId === 'dealer' && (profileData?.dealership || profileData?.privateSeller)) ||
           (roleId === 'provider' && profileData?.providerId) ||
           (roleId === 'coordinator' && profileData?.coordinatorProfile?.isCoordinator);
  };

  const hasPendingRequest = (roleId) => {
    return pendingRequests.some(req => req.requestType === roleId && req.status === 'pending');
  };

  const calculateTotal = () => {
    if (!selectedRole || !selectedPlan) return 0;
    
    let plans;
    if (selectedRole === 'dealer' && selectedSellerType) {
      plans = roleConfigurations.dealer.sellerTypes[selectedSellerType].plans;
    } else {
      plans = roleConfigurations[selectedRole]?.plans || {};
    }
    
    const plan = plans[selectedPlan];
    if (!plan) return 0;
    
    let total = plan.price;

    // Add addon costs (only for dealerships, and skip if premium)
    if (selectedRole === 'dealer' && selectedSellerType === SELLER_TYPES.DEALERSHIP && selectedPlan !== 'premium') {
      selectedAddons.forEach(addonId => {
        const addon = ADDON_SERVICES[addonId];
        if (addon) total += addon.price;
      });
    }

    return total;
  };

  const handleRoleRequest = (roleId) => {
    const role = roleConfigurations[roleId];
    setSelectedRole(roleId);
    setSelectedSellerType('');
    setSelectedAddons([]);
    
    if (role.hasSellerTypes) {
      // Show seller type selection for dealer role
      setShowSellerTypeModal(true);
    } else if (role.requiresSubscription) {
      setShowPricingModal(true);
    } else {
      // Submit free role request directly
      submitFreeRoleRequest(roleId);
    }
  };

  const handleSellerTypeSelection = (sellerType) => {
    setSelectedSellerType(sellerType);
    setShowSellerTypeModal(false);
    setShowPricingModal(true);
  };

  const handlePlanSelection = (planId) => {
    setSelectedPlan(planId);
    
    // Clear addons if premium dealership (all included)
    if (selectedRole === 'dealer' && selectedSellerType === SELLER_TYPES.DEALERSHIP && planId === 'premium') {
      setSelectedAddons([]);
    }
    
    setShowPricingModal(false);
    setShowPaymentModal(true);
  };

  const handleAddonToggle = (addonId) => {
    const addon = ADDON_SERVICES[addonId];
    
    // Check if addon is available for selected seller type
    if (addon.availableFor && !addon.availableFor.includes(selectedSellerType)) {
      alert(`${addon.name} not available for this seller type`);
      return;
    }
    
    if (addon.requiredPlan && !addon.requiredPlan.includes(selectedPlan)) {
      alert(`${addon.name} requires ${addon.requiredPlan.join(' or ')} plan`);
      return;
    }

    setSelectedAddons(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const submitFreeRoleRequest = async (roleId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/role-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestType: roleId })
      });

      if (response.ok) {
        alert(`${roleId} role request submitted! You'll be notified when reviewed.`);
        fetchPendingRequests();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initiatePayment = async () => {
    setPaymentLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      const payload = {
        roleType: selectedRole,
        planId: selectedPlan,
        addons: selectedAddons,
        callbackUrl: `${window.location.origin}/profile?tab=roles`
      };
      
      // Add seller type for dealer role
      if (selectedRole === 'dealer' && selectedSellerType) {
        payload.sellerType = selectedSellerType;
      }
      
      const response = await fetch('/api/payments/initiate-role-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success && data.data.paymentLink) {
        // Redirect to Flutterwave payment page
        window.location.href = data.data.paymentLink;
      } else {
        alert(`Payment Error: ${data.message}`);
      }
    } catch (error) {
      alert('Payment initialization failed. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const renderRoleCard = (roleId, config) => {
    const IconComponent = config.icon;
    const userHasRole = hasRole(roleId);
    const isPending = hasPendingRequest(roleId);
    
    return (
      <div key={roleId} className={`role-card ${userHasRole ? 'role-active' : ''}`}>
        <div className="role-header">
          <div className="role-icon" style={{ backgroundColor: config.color }}>
            <IconComponent size={24} />
          </div>
          <div className="role-info">
            <h3>{config.title}</h3>
            <p>{config.description}</p>
          </div>
          <div className="role-status">
            {userHasRole ? (
              <div className="status-badge status-active">
                <CheckCircle size={16} />
                <span>Active</span>
              </div>
            ) : isPending ? (
              <div className="status-badge status-pending">
                <Clock size={16} />
                <span>Pending</span>
              </div>
            ) : (
              <button 
                className="role-request-btn"
                onClick={() => handleRoleRequest(roleId)}
                disabled={loading}
              >
                {config.requiresSubscription ? 'View Plans' : 'Request Access'}
              </button>
            )}
          </div>
        </div>
        
        <div className="role-features">
          {config.features && config.features.map((feature, idx) => (
            <div key={idx} className="feature-item">
              <CheckCircle size={14} />
              <span>{feature}</span>
            </div>
          ))}
          
          {config.note && (
            <div className="role-note">{config.note}</div>
          )}
          
          {config.requiresSubscription && !config.hasSellerTypes && (
            <div className="pricing-hint">
              {Object.keys(config.plans).length > 1 
                ? `Plans from ${formatPrice(Math.min(...Object.values(config.plans).map(p => p.price)))}`
                : formatPrice(Object.values(config.plans)[0].price)
              }
            </div>
          )}
          
          {config.hasSellerTypes && (
            <div className="seller-types-hint">
              <div className="pricing-hint">
                Private sellers: {formatPrice(50)} - {formatPrice(200)}/month
              </div>
              <div className="pricing-hint">
                Dealerships: {formatPrice(1000)} - {formatPrice(6000)}/month
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSellerTypeModal = () => {
    if (!selectedRole || !showSellerTypeModal) return null;
    
    const role = roleConfigurations[selectedRole];
    
    return (
      <div className="modal-overlay">
        <div className="seller-type-modal">
          <div className="modal-header">
            <h3>Choose Your Seller Type</h3>
            <button onClick={() => setShowSellerTypeModal(false)}>×</button>
          </div>
          
          <div className="seller-types-grid">
            {Object.entries(role.sellerTypes).map(([sellerType, config]) => {
              const IconComponent = config.icon;
              const plans = Object.values(config.plans);
              const minPrice = Math.min(...plans.map(p => p.price));
              const maxPrice = Math.max(...plans.map(p => p.price));
              
              return (
                <div key={sellerType} className="seller-type-card">
                  <div className="seller-type-header">
                    <IconComponent size={32} />
                    <h4>{config.title}</h4>
                    <p>{config.description}</p>
                  </div>
                  
                  <div className="seller-type-pricing">
                    {minPrice === maxPrice 
                      ? formatPrice(minPrice) 
                      : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
                    }/month
                  </div>
                  
                  <div className="seller-type-benefits">
                    {config.benefits.map((benefit, idx) => (
                      <div key={idx} className="benefit-item">
                        <CheckCircle size={14} />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    className="select-seller-type-btn"
                    onClick={() => handleSellerTypeSelection(sellerType)}
                  >
                    Select {config.title}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderPricingModal = () => {
    if (!selectedRole || !showPricingModal) return null;
    
    let plans, modalTitle;
    
    if (selectedRole === 'dealer' && selectedSellerType) {
      plans = roleConfigurations.dealer.sellerTypes[selectedSellerType].plans;
      modalTitle = `${roleConfigurations.dealer.sellerTypes[selectedSellerType].title} Plans`;
    } else {
      plans = roleConfigurations[selectedRole]?.plans || {};
      modalTitle = `${roleConfigurations[selectedRole]?.title} Plans`;
    }
    
    return (
      <div className="modal-overlay">
        <div className="pricing-modal">
          <div className="modal-header">
            <h3>{modalTitle}</h3>
            <button onClick={() => setShowPricingModal(false)}>×</button>
          </div>
          
          <div className="plans-grid">
            {Object.entries(plans).map(([planId, plan]) => (
              <div key={planId} className={`plan-card ${plan.popular ? 'popular' : ''}`}>
                {plan.badge && <div className="plan-badge">{plan.badge}</div>}
                {plan.popular && <div className="plan-badge popular-badge">Most Popular</div>}
                
                <h4>{plan.name}</h4>
                <div className="plan-price">
                  {formatPrice(plan.price)}
                  <span>/month</span>
                </div>
                
                {plan.savings && (
                  <div className="savings-note">
                    Includes {formatPrice(plan.savings)} worth of add-ons!
                  </div>
                )}
                
                <ul className="plan-features">
                  {plan.features && typeof plan.features === 'object' ? 
                    Object.entries(plan.features)
                      .filter(([key, value]) => value && key !== 'includedAddons')
                      .map(([key, value], idx) => (
                        <li key={idx}>
                          {key === 'maxListings' ? `${value} listings` :
                           key === 'maxPhotosPerListing' ? `${value} photos per listing` :
                           key === 'socialMediaMarketing' ? `${value === 'unlimited' ? 'Unlimited' : value + 'x'} social media marketing` :
                           key === 'customerSupport' ? `${value} support` :
                           key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                          }
                        </li>
                      ))
                    : plan.features?.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))
                  }
                </ul>
                
                {plan.note && <div className="plan-note">{plan.note}</div>}
                
                <button 
                  className="select-plan-btn"
                  onClick={() => handlePlanSelection(planId)}
                >
                  Select {plan.name}
                </button>
              </div>
            ))}
          </div>
          
          {roleConfigurations[selectedRole]?.freeTrialDays && (
            <div className="trial-note">
              🎉 {roleConfigurations[selectedRole].freeTrialDays}-day free trial available!
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPaymentModal = () => {
    if (!selectedRole || !selectedPlan || !showPaymentModal) return null;
    
    let plans, plan;
    
    if (selectedRole === 'dealer' && selectedSellerType) {
      plans = roleConfigurations.dealer.sellerTypes[selectedSellerType].plans;
      plan = plans[selectedPlan];
    } else {
      plans = roleConfigurations[selectedRole]?.plans || {};
      plan = plans[selectedPlan];
    }
    
    if (!plan) return null;
    
    const total = calculateTotal();
    const availableAddons = selectedRole === 'dealer' && selectedSellerType === SELLER_TYPES.DEALERSHIP 
      ? getAvailableAddons(selectedSellerType, selectedPlan)
      : [];
    
    return (
      <div className="modal-overlay">
        <div className="payment-modal">
          <div className="modal-header">
            <h3>Complete Your Subscription</h3>
            <button onClick={() => setShowPaymentModal(false)}>×</button>
          </div>
          
          <div className="payment-summary">
            <div className="summary-item">
              <span>Plan:</span>
              <span>{plan.name}</span>
              <span>{formatPrice(plan.price)}</span>
            </div>
            
            {availableAddons.length > 0 && selectedPlan !== 'premium' && (
              <div className="addons-section">
                <h4>Available Add-ons:</h4>
                {availableAddons.map((addon) => {
                  const isIncluded = addon.includedInPremium && selectedPlan === 'premium';
                  
                  return (
                    <div key={addon.id} className="addon-item">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedAddons.includes(addon.id)}
                          onChange={() => handleAddonToggle(addon.id)}
                          disabled={isIncluded}
                        />
                        <span>{addon.name}</span>
                        <span className="addon-price">
                          {isIncluded ? 'Included' : formatPrice(addon.price) + (addon.perUnit ? '/listing' : '/month')}
                        </span>
                      </label>
                      <div className="addon-description">{addon.description}</div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="total-section">
              <div className="total-item">
                <span>Total:</span>
                <span>{formatPrice(total)}/month</span>
              </div>
            </div>
          </div>
          
          <div className="payment-actions">
            <button 
              className="cancel-btn"
              onClick={() => setShowPaymentModal(false)}
            >
              Cancel
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
            Secure payment powered by Flutterwave. You'll be redirected to complete payment.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="enhanced-role-selection">
      <div className="section-header">
        <h2>Role Management & Subscriptions</h2>
        <p>Choose your role and subscription plan to unlock professional features</p>
      </div>
      
      <div className="roles-grid">
        {Object.entries(roleConfigurations).map(([roleId, config]) => 
          renderRoleCard(roleId, config)
        )}
      </div>
      
      {pendingRequests.length > 0 && (
        <div className="pending-requests">
          <h3>Your Pending Requests</h3>
          <div className="requests-list">
            {pendingRequests.map((request, index) => (
              <div key={index} className="request-item">
                <span>{request.requestType} role</span>
                <span>Submitted {new Date(request.createdAt).toLocaleDateString()}</span>
                <span className={`status status-${request.status}`}>{request.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {renderSellerTypeModal()}
      {renderPricingModal()}
      {renderPaymentModal()}
    </div>
  );
};

export default EnhancedRoleSelection;
