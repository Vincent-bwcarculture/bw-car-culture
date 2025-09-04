// client/src/components/profile/ArticleManagement/views/EarningsView/CashoutModal.js
// Cashout request modal component

import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

/**
 * Cashout Request Modal Component
 */
const CashoutModal = ({
  cashoutInfo,
  formatCurrency,
  onSubmit,
  onClose
}) => {
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentDetails, setPaymentDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    mobileWallet: '',
    walletProvider: 'orange_money'
  });

  const handleSubmit = () => {
    onSubmit({
      paymentMethod,
      paymentDetails
    });
  };

  const isFormValid = () => {
    if (paymentMethod === 'bank_transfer') {
      return paymentDetails.bankName && paymentDetails.accountNumber && paymentDetails.accountName;
    }
    if (paymentMethod === 'mobile_wallet') {
      return paymentDetails.mobileWallet && paymentDetails.walletProvider;
    }
    return false;
  };

  return (
    <div className="modal-overlay">
      <div className="cashout-form-modal">
        <div className="modal-header">
          <h3>Request Cashout</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-content">
          <div className="cashout-summary">
            <p><strong>Amount to be paid:</strong> {formatCurrency(cashoutInfo.unpaidEarnings)}</p>
            <p><small>Processing time: 2-3 business days</small></p>
          </div>

          <div className="payment-method-selection">
            <h4>Select Payment Method:</h4>
            
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Bank Transfer</span>
              </label>
              
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mobile_wallet"
                  checked={paymentMethod === 'mobile_wallet'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Mobile Wallet</span>
              </label>
            </div>
          </div>

          {paymentMethod === 'bank_transfer' && (
            <div className="payment-details">
              <h4>Bank Details:</h4>
              <div className="form-group">
                <label>Bank Name</label>
                <select
                  value={paymentDetails.bankName}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, bankName: e.target.value }))}
                >
                  <option value="">Select Bank</option>
                  <option value="fnb">First National Bank (FNB)</option>
                  <option value="standard_bank">Standard Bank</option>
                  <option value="absa">ABSA Bank</option>
                  <option value="stanchart">Standard Chartered</option>
                  <option value="bank_gaborone">Bank of Gaborone</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  placeholder="Enter account number"
                  value={paymentDetails.accountNumber}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Account Holder Name</label>
                <input
                  type="text"
                  placeholder="Enter account holder name"
                  value={paymentDetails.accountName}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, accountName: e.target.value }))}
                />
              </div>
            </div>
          )}

          {paymentMethod === 'mobile_wallet' && (
            <div className="payment-details">
              <h4>Mobile Wallet Details:</h4>
              <div className="form-group">
                <label>Wallet Provider</label>
                <select
                  value={paymentDetails.walletProvider}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, walletProvider: e.target.value }))}
                >
                  <option value="orange_money">Orange Money</option>
                  <option value="mascom_myzer">Mascom MyZer</option>
                  <option value="btc_smega">BTC Smega</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="e.g., 76123456"
                  value={paymentDetails.mobileWallet}
                  onChange={(e) => setPaymentDetails(prev => ({ ...prev, mobileWallet: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="submit-button primary"
            onClick={handleSubmit}
            disabled={!isFormValid()}
          >
            <Send size={16} />
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashoutModal;
