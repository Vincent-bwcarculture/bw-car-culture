// client/src/components/profile/ArticleManagement/views/EarningsView/CashoutRequirements.js
// Cashout requirements panel component

import React from 'react';

/**
 * Enhanced Cashout Requirements Panel
 */
const CashoutRequirements = ({
  cashoutInfo,
  earningsConfig,
  formatCurrency,
  formatNumber
}) => {
  return (
    <div className="cashout-requirements-panel">
      <div className="panel-header">
        <h3>Cashout Requirements Status</h3>
      </div>
      
      <div className="requirements-detailed">
        <div className="requirement-section">
          <h4>Minimum Earnings: P{earningsConfig.minimumPayout}</h4>
          <div className="requirement-status">
            <div className="progress-bar-large">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, (cashoutInfo.unpaidEarnings / earningsConfig.minimumPayout) * 100)}%` }}
              ></div>
            </div>
            <div className="progress-labels">
              <span>{formatCurrency(cashoutInfo.unpaidEarnings)}</span>
              <span className={cashoutInfo.requirements.minimumEarnings.met ? 'met' : 'pending'}>
                {cashoutInfo.requirements.minimumEarnings.met ? 'Met' : `Need ${formatCurrency(earningsConfig.minimumPayout - cashoutInfo.unpaidEarnings)} more`}
              </span>
            </div>
          </div>
        </div>

        <div className="requirement-section">
          <h4>Minimum Engagement: {formatNumber(earningsConfig.minimumEngagementForCashout)}</h4>
          <div className="requirement-status">
            <div className="progress-bar-large">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, (cashoutInfo.totalEngagement / earningsConfig.minimumEngagementForCashout) * 100)}%` }}
              ></div>
            </div>
            <div className="progress-labels">
              <span>{formatNumber(cashoutInfo.totalEngagement)}</span>
              <span className={cashoutInfo.requirements.minimumEngagement.met ? 'met' : 'pending'}>
                {cashoutInfo.requirements.minimumEngagement.met ? 'Met' : `Need ${formatNumber(earningsConfig.minimumEngagementForCashout - cashoutInfo.totalEngagement)} more`}
              </span>
            </div>
          </div>
        </div>

        <div className="requirement-section">
          <h4>Engagement to Earnings Ratio</h4>
          <p className="ratio-explanation">
            Required: {earningsConfig.engagementToEarningsRatio} engagement points per P1 earned
          </p>
          <div className="requirement-status">
            <div className="progress-bar-large">
              <div 
                className="progress-fill" 
                style={{ width: `${Math.min(100, (cashoutInfo.totalEngagement / (cashoutInfo.unpaidEarnings * earningsConfig.engagementToEarningsRatio)) * 100)}%` }}
              ></div>
            </div>
            <div className="progress-labels">
              <span>Current ratio: {cashoutInfo.unpaidEarnings > 0 ? Math.round(cashoutInfo.totalEngagement / cashoutInfo.unpaidEarnings) : 0}:1</span>
              <span className={cashoutInfo.requirements.engagementRatio.met ? 'met' : 'pending'}>
                {cashoutInfo.requirements.engagementRatio.met ? 'Met' : `Need ${formatNumber(cashoutInfo.requirements.engagementRatio.required - cashoutInfo.totalEngagement)} more`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashoutRequirements;
