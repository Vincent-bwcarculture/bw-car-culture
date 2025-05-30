// src/components/admin/DealershipManager/SubscriptionManager.js
import React, { useState, useEffect } from 'react';
import { http } from '../../../config/axios.js';
import './SubscriptionManager.css';

const SubscriptionManager = ({ isOpen, onClose, dealer, onUpdate }) => {
  const [formData, setFormData] = useState({
    plan: 'basic',
    status: 'active',
    expiresAt: '',
    paymentAmount: 0,
    paymentMethod: 'credit_card'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (dealer && isOpen) {
      // Initialize form with current dealer subscription details
      setFormData({
        plan: dealer.subscription?.tier || 'basic',
        status: dealer.subscription?.status || 'active',
        expiresAt: dealer.subscription?.expiresAt ? 
          new Date(dealer.subscription.expiresAt).toISOString().split('T')[0] : 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentAmount: getTierPrice(dealer.subscription?.tier || 'basic'),
        paymentMethod: 'credit_card'
      });
    }
  }, [dealer, isOpen]);

  const getTierPrice = (plan) => {
    // Sample pricing tiers (ensure consistency with SUBSCRIPTION_TIERS)
    switch(plan.toLowerCase()) {
      case 'premium':
        return 199.99;
      case 'standard':
        return 99.99;
      case 'basic':
      default:
        return 49.99;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'plan') {
      // When plan changes, update the price
      setFormData(prev => ({
        ...prev,
        [name]: value,
        paymentAmount: getTierPrice(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate plan
      const validTiers = ['basic', 'standard', 'premium'];
      if (!validTiers.includes(formData.plan)) {
        throw new Error(`Invalid subscription plan: ${formData.plan}. Must be one of ${validTiers.join(', ')}`);
      }

      // Prepare subscription data
      const subscriptionData = {
        tier: formData.plan,
        status: formData.status,
        expiresAt: formData.expiresAt,
        payment: {
          amount: formData.paymentAmount,
          method: formData.paymentMethod,
          date: new Date().toISOString()
        }
      };

      console.log('Updating subscription for dealer:', dealer._id, subscriptionData);

      // Make API call to update subscription
      const response = await http.put(`/dealers/${dealer._id}/subscription`, subscriptionData);
      
      if (response.data.success) {
        if (onUpdate) {
          onUpdate(response.data.data);
        }
        onClose();
      } else {
        throw new Error(response.data.message || 'Failed to update subscription');
      }
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError(err.message || 'An error occurred while updating the subscription');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="subscription-modal-overlay">
      <div className="subscription-modal">
        <div className="subscription-modal-header">
          <h2>Manage Subscription - {dealer?.businessName}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="subscription-modal-content">
          {error && <div className="subscription-error-message">{error}</div>}
          
          <div className="current-subscription-info">
            <h3>Current Subscription</h3>
            <div className="current-details">
              <p><strong>Plan:</strong> {dealer?.subscription?.tier || 'None'}</p>
              <p><strong>Status:</strong> {dealer?.subscription?.status || 'N/A'}</p>
              <p>
                <strong>Expires:</strong> {
                  dealer?.subscription?.expiresAt ? 
                  new Date(dealer.subscription.expiresAt).toLocaleDateString() : 'N/A'
                }
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="subscription-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="plan">Subscription Plan</label>
                <select 
                  id="plan" 
                  name="plan" 
                  value={formData.plan}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="basic">Basic ($49.99/month)</option>
                  <option value="standard">Standard ($99.99/month)</option>
                  <option value="premium">Premium ($199.99/month)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="status">Subscription Status</label>
                <select 
                  id="status" 
                  name="status" 
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expiresAt">Expiry Date</label>
                <input 
                  type="date" 
                  id="expiresAt" 
                  name="expiresAt" 
                  value={formData.expiresAt}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="paymentAmount">Payment Amount ($)</label>
                <input 
                  type="number" 
                  id="paymentAmount" 
                  name="paymentAmount" 
                  value={formData.paymentAmount}
                  onChange={handleChange}
                  step="0.01"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="paymentMethod">Payment Method</label>
                <select 
                  id="paymentMethod" 
                  name="paymentMethod" 
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="save-button"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Subscription'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;