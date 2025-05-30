// src/components/admin/ServiceProviderManager/SubscriptionManager.js
import React, { useState, useEffect } from 'react';
import './SubscriptionManager.css';
import { SUBSCRIPTION_TIERS, TIER_LIMITS } from './providerTypes.js';

const SubscriptionManager = ({ isOpen, onClose, provider, onUpdate }) => {
  const [formData, setFormData] = useState({
    tier: SUBSCRIPTION_TIERS.BASIC,
    status: 'active',
    expiresAt: '',
    features: {
      maxListings: 10,
      allowPhotography: true,
      allowReviews: false,
      allowPodcasts: false,
      allowVideos: false
    },
    paymentHistory: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newPayment, setNewPayment] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    transactionId: '',
    method: 'credit_card'
  });
  const [showAddPayment, setShowAddPayment] = useState(false);

  // Initialize form with provider subscription data
  useEffect(() => {
    if (provider && provider.subscription) {
      // Format expires date for form input
      let formattedExpiresAt = '';
      if (provider.subscription.expiresAt) {
        const date = new Date(provider.subscription.expiresAt);
        formattedExpiresAt = date.toISOString().split('T')[0];
      }
      
      setFormData({
        tier: provider.subscription.tier || SUBSCRIPTION_TIERS.BASIC,
        status: provider.subscription.status || 'active',
        expiresAt: formattedExpiresAt,
        features: provider.subscription.features || TIER_LIMITS[SUBSCRIPTION_TIERS.BASIC],
        paymentHistory: provider.subscription.paymentHistory || []
      });
    }
  }, [provider]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special case for tier selection to update features automatically
    if (name === 'tier') {
      const tierFeatures = TIER_LIMITS[value];
      setFormData(prev => ({
        ...prev,
        [name]: value,
        features: tierFeatures
      }));
      
      // Also update payment amount based on tier
      setNewPayment(prev => ({
        ...prev,
        amount: TIER_LIMITS[value].price || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFeaturesChange = (e) => {
    const { name, value, type, checked } = e.target;
    const featureValue = type === 'checkbox' ? checked : 
                         type === 'number' ? parseInt(value, 10) : value;
    
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [name]: featureValue
      }
    }));
  };

  const handleNewPaymentChange = (e) => {
    const { name, value } = e.target;
    
    setNewPayment(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value
    }));
  };

  const addPayment = () => {
    // Validate payment data
    if (!newPayment.amount || !newPayment.date || !newPayment.method) {
      setError('Please fill all payment fields');
      return;
    }
    
    if (!newPayment.transactionId) {
      newPayment.transactionId = `TR-${Date.now()}`;
    }
    
    // Add new payment to history
    setFormData(prev => ({
      ...prev,
      paymentHistory: [...(prev.paymentHistory || []), { ...newPayment }]
    }));
    
    // Reset new payment form
    setNewPayment({
      amount: TIER_LIMITS[formData.tier].price || 0,
      date: new Date().toISOString().split('T')[0],
      transactionId: '',
      method: 'credit_card'
    });
    
    setShowAddPayment(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validate form data
    if (!formData.tier || !formData.status) {
      setError('Please select a subscription tier and status');
      return;
    }
    
    if (!formData.expiresAt) {
      setError('Please set an expiration date');
      return;
    }
    
    try {
      setLoading(true);
      
      // Format the data for the API
      const subscriptionData = {
        tier: formData.tier,
        status: formData.status,
        expiresAt: formData.expiresAt,
        features: formData.features,
        paymentHistory: formData.paymentHistory
      };
      
      // Submit the data
      await onUpdate(subscriptionData);
      
      // Close on success
      onClose();
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError(error.response?.data?.message || 'Failed to update subscription');
    } finally {
      setLoading(false);
    }
  };

  const removePayment = (index) => {
    setFormData(prev => ({
      ...prev,
      paymentHistory: prev.paymentHistory.filter((_, i) => i !== index)
    }));
  };

  // Quick renewal helpers
  const extend30Days = () => {
    const currentDate = formData.expiresAt ? new Date(formData.expiresAt) : new Date();
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 30);
    
    setFormData(prev => ({
      ...prev,
      expiresAt: newDate.toISOString().split('T')[0],
      status: 'active'
    }));
  };

  const extend90Days = () => {
    const currentDate = formData.expiresAt ? new Date(formData.expiresAt) : new Date();
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 90);
    
    setFormData(prev => ({
      ...prev,
      expiresAt: newDate.toISOString().split('T')[0],
      status: 'active'
    }));
  };

  const extend365Days = () => {
    const currentDate = formData.expiresAt ? new Date(formData.expiresAt) : new Date();
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 365);
    
    setFormData(prev => ({
      ...prev,
      expiresAt: newDate.toISOString().split('T')[0],
      status: 'active'
    }));
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="spm-subscription-modal-overlay">
      <div className="spm-subscription-modal">
        <div className="spm-subscription-modal-header">
          <h2>Manage Subscription</h2>
          <button className="spm-close-button" onClick={onClose}>×</button>
        </div>
        <div className="spm-subscription-modal-content">
          {error && <div className="spm-subscription-error-message">{error}</div>}
          
          <div className="spm-current-subscription-info">
            <h3>Current Subscription for {provider?.businessName}</h3>
            <div className="spm-current-details">
              <p><strong>Plan:</strong> {provider?.subscription?.tier || 'None'}</p>
              <p><strong>Status:</strong> {provider?.subscription?.status || 'N/A'}</p>
              <p>
                <strong>Expires:</strong> {
                  provider?.subscription?.expiresAt ? 
                  formatDate(provider.subscription.expiresAt) : 'N/A'
                }
              </p>
              <p><strong>Max Listings:</strong> {provider?.subscription?.features?.maxListings || 0}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="spm-subscription-form">
            <h3>Update Subscription</h3>
            
            <div className="spm-subscription-tiers">
              {Object.values(SUBSCRIPTION_TIERS).map(tier => (
                <div 
                  key={tier}
                  className={`spm-subscription-tier-card ${formData.tier === tier ? 'selected' : ''}`}
                  onClick={() => handleChange({ target: { name: 'tier', value: tier } })}
                >
                  <div className="spm-tier-header">
                    <h3>{tier.charAt(0).toUpperCase() + tier.slice(1)}</h3>
                    <div className="spm-tier-price">P{TIER_LIMITS[tier].price}/month</div>
                  </div>
                  
                  <div className="spm-tier-features">
                    <div className="spm-feature">
                      <span>Max Listings</span>
                      <span>{TIER_LIMITS[tier].maxListings}</span>
                    </div>
                    <div className="spm-feature">
                      <span>Photography</span>
                      <span>{TIER_LIMITS[tier].allowPhotography ? '✓' : '✗'}</span>
                    </div>
                    <div className="spm-feature">
                      <span>Reviews</span>
                      <span>{TIER_LIMITS[tier].allowReviews ? '✓' : '✗'}</span>
                    </div>
                    <div className="spm-feature">
                      <span>Podcasts</span>
                      <span>{TIER_LIMITS[tier].allowPodcasts ? '✓' : '✗'}</span>
                    </div>
                    <div className="spm-feature">
                      <span>Videos</span>
                      <span>{TIER_LIMITS[tier].allowVideos ? '✓' : '✗'}</span>
                    </div>
                  </div>
                  
                  <div className="spm-select-tier">
                    <input 
                      type="radio" 
                      id={`tier-${tier}`} 
                      name="tier" 
                      value={tier}
                      checked={formData.tier === tier}
                      onChange={handleChange}
                    />
                    <label htmlFor={`tier-${tier}`}>
                      {formData.tier === tier ? 'Selected' : 'Select Plan'}
                    </label>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Downgrade warning */}
            {provider?.subscription?.tier && 
             TIER_LIMITS[formData.tier].maxListings < TIER_LIMITS[provider.subscription.tier].maxListings && (
              <div className="spm-downgrade-warning">
                <div className="spm-warning-icon">⚠️</div>
                <div>
                  <strong>Downgrade Warning:</strong> This plan allows fewer listings than the current plan. 
                  If the provider has more than {TIER_LIMITS[formData.tier].maxListings} listings, 
                  they will not be able to add new ones until they remove some existing listings.
                </div>
              </div>
            )}
            
            <div className="spm-form-row">
              <div className="spm-form-group">
                <label htmlFor="status">Subscription Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="spm-form-select"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div className="spm-form-group">
                <label htmlFor="expiresAt">Expiry Date</label>
                <input
                  type="date"
                  id="expiresAt"
                  name="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleChange}
                  className="spm-form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div className="spm-quick-renewal-buttons">
              <button type="button" onClick={extend30Days}>+30 Days</button>
              <button type="button" onClick={extend90Days}>+3 Months</button>
              <button type="button" onClick={extend365Days}>+1 Year</button>
            </div>
            
            <h3>Features</h3>
            <div className="spm-features-form">
              <div className="spm-form-row">
                <div className="spm-form-group">
                  <label htmlFor="maxListings">Maximum Listings</label>
                  <input
                    type="number"
                    id="maxListings"
                    name="maxListings"
                    value={formData.features?.maxListings || 10}
                    onChange={handleFeaturesChange}
                    className="spm-form-input"
                    min="1"
                  />
                </div>
              </div>
              
              <div className="spm-features-checkboxes">
                <div className="spm-feature-checkbox">
                  <input
                    type="checkbox"
                    id="allowPhotography"
                    name="allowPhotography"
                    checked={formData.features?.allowPhotography || false}
                    onChange={handleFeaturesChange}
                  />
                  <label htmlFor="allowPhotography">Allow Photography</label>
                </div>
                
                <div className="spm-feature-checkbox">
                  <input
                    type="checkbox"
                    id="allowReviews"
                    name="allowReviews"
                    checked={formData.features?.allowReviews || false}
                    onChange={handleFeaturesChange}
                  />
                  <label htmlFor="allowReviews">Allow Reviews</label>
                </div>
                
                <div className="spm-feature-checkbox">
                  <input
                    type="checkbox"
                    id="allowPodcasts"
                    name="allowPodcasts"
                    checked={formData.features?.allowPodcasts || false}
                    onChange={handleFeaturesChange}
                  />
                  <label htmlFor="allowPodcasts">Allow Podcasts</label>
                </div>
                
                <div className="spm-feature-checkbox">
                  <input
                    type="checkbox"
                    id="allowVideos"
                    name="allowVideos"
                    checked={formData.features?.allowVideos || false}
                    onChange={handleFeaturesChange}
                  />
                  <label htmlFor="allowVideos">Allow Videos</label>
                </div>
              </div>
            </div>
            
            <h3>Payment History</h3>
            <div className="spm-payment-history">
              {formData.paymentHistory && formData.paymentHistory.length > 0 ? (
                <div className="spm-payment-history-list">
                  {formData.paymentHistory.map((payment, index) => (
                    <div key={index} className="spm-payment-history-item">
                      <div className="spm-payment-info">
                        <div className="spm-payment-amount">P{payment.amount?.toFixed(2)}</div>
                        <div className="spm-payment-details">
                          <div>{formatDate(payment.date)}</div>
                          <div>Method: {payment.method}</div>
                          <div>Ref: {payment.transactionId}</div>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className="spm-remove-payment-btn"
                        onClick={() => removePayment(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No payment history found.</p>
              )}
              
              {showAddPayment ? (
                <div className="spm-add-payment-form">
                  <h4>Add New Payment</h4>
                  <div className="spm-form-row">
                    <div className="spm-form-group">
                      <label htmlFor="amount">Amount (P)</label>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={newPayment.amount}
                        onChange={handleNewPaymentChange}
                        className="spm-form-input"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div className="spm-form-group">
                      <label htmlFor="date">Payment Date</label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={newPayment.date}
                        onChange={handleNewPaymentChange}
                        className="spm-form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="spm-form-row">
                    <div className="spm-form-group">
                      <label htmlFor="transactionId">Transaction ID</label>
                      <input
                        type="text"
                        id="transactionId"
                        name="transactionId"
                        value={newPayment.transactionId}
                        onChange={handleNewPaymentChange}
                        className="spm-form-input"
                        placeholder="Optional - will be auto-generated"
                      />
                    </div>
                    
                    <div className="spm-form-group">
                      <label htmlFor="method">Payment Method</label>
                      <select
                        id="method"
                        name="method"
                        value={newPayment.method}
                        onChange={handleNewPaymentChange}
                        className="spm-form-select"
                      >
                        <option value="credit_card">Credit Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cash">Cash</option>
                        <option value="mobile_money">Mobile Money</option>
                        <option value="paypal">PayPal</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="spm-payment-form-actions">
                    <button 
                      type="button" 
                      className="spm-cancel-payment-btn"
                      onClick={() => setShowAddPayment(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="spm-add-payment-btn"
                      onClick={addPayment}
                    >
                      Add Payment
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  type="button" 
                  className="spm-show-add-payment-btn"
                  onClick={() => setShowAddPayment(true)}
                >
                  + Add Payment
                </button>
              )}
            </div>
            
            <div className="spm-form-actions">
              <button 
                type="button" 
                className="spm-cancel-button" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="spm-save-button"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Update Subscription'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;