// client/src/components/profile/ArticleManagement/views/EarningsView/index.js
// Enhanced Earnings View with Cashout Request

import React, { useState } from 'react';

// Sub-components
import EarningsSummary from './EarningsSummary.js';
import CashoutRequirements from './CashoutRequirements.js';
import CashoutModal from './CashoutModal.js';
import EarningsTable from './EarningsTable.js';

/**
 * Enhanced Earnings View Component with Cashout Request
 */
const EarningsView = ({
  stats,
  articles,
  onBack,
  formatCurrency,
  formatNumber,
  formatDate,
  getCategoryColor,
  getCategoryLabel,
  calculateArticleEarnings,
  calculateArticleEngagement,
  checkCashoutEligibility,
  earningsConfig,
  categories
}) => {
  const publishedArticles = articles.filter(article => article.status === 'published');
  const cashoutInfo = checkCashoutEligibility(articles);
  const [showCashoutForm, setShowCashoutForm] = useState(false);

  const handleCashoutRequest = async (paymentData) => {
    try {
      // Mock cashout request - replace with actual API call
      const requestData = {
        amount: cashoutInfo.unpaidEarnings,
        ...paymentData,
        requestDate: new Date().toISOString(),
        userId: 'current-user-id'
      };
      
      console.log('Cashout request:', requestData);
      
      // Show success message
      alert(`Cashout request for ${formatCurrency(cashoutInfo.unpaidEarnings)} submitted successfully! You will receive your payment within 2-3 business days.`);
      setShowCashoutForm(false);
      
      // In real implementation, you would refresh the earnings data
    } catch (error) {
      console.error('Cashout request failed:', error);
      alert('Failed to submit cashout request. Please try again.');
    }
  };

  return (
    <div className="earnings-view">
      <div className="earnings-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        
        <div className="header-content">
          <h2>Enhanced Earnings & Engagement Overview</h2>
          <p>Track your article performance, revenue, and engagement metrics</p>
        </div>
      </div>

      {/* Enhanced Earnings Summary Cards with Engagement */}
      <EarningsSummary
        stats={stats}
        cashoutInfo={cashoutInfo}
        formatCurrency={formatCurrency}
        formatNumber={formatNumber}
        onRequestCashout={() => setShowCashoutForm(true)}
      />

      {/* Enhanced Cashout Requirements Panel */}
      <CashoutRequirements
        cashoutInfo={cashoutInfo}
        earningsConfig={earningsConfig}
        formatCurrency={formatCurrency}
        formatNumber={formatNumber}
      />

      {/* Cashout Request Form Modal */}
      {showCashoutForm && (
        <CashoutModal
          cashoutInfo={cashoutInfo}
          formatCurrency={formatCurrency}
          onSubmit={handleCashoutRequest}
          onClose={() => setShowCashoutForm(false)}
        />
      )}

      {/* Article Earnings Table */}
      <EarningsTable
        articles={publishedArticles}
        formatCurrency={formatCurrency}
        formatNumber={formatNumber}
        formatDate={formatDate}
        getCategoryColor={getCategoryColor}
        getCategoryLabel={getCategoryLabel}
        calculateArticleEarnings={calculateArticleEarnings}
        calculateArticleEngagement={calculateArticleEngagement}
      />
    </div>
  );
};

export default EarningsView;
