// client/src/components/profile/ArticleManagement/views/DashboardView/CashoutProgress.js
// Cashout eligibility progress component

import React from 'react';
import {
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Zap,
  Target,
  Users,
  TrendingUp
} from 'lucide-react';

/**
 * Cashout progress panel component showing eligibility requirements
 * @param {Object} props - Component props
 */
const CashoutProgress = ({
  cashoutInfo,
  earningsConfig,
  formatCurrency,
  formatNumber
}) => {
  return (
    <div className="cashout-progress-panel">
      <div className="panel-header">
        <div className="header-content">
          <h3>Cashout Eligibility Progress</h3>
          <p>Track your progress toward meeting cashout requirements</p>
        </div>
        <div className={`eligibility-badge ${cashoutInfo.eligible ? 'eligible' : 'not-eligible'}`}>
          {cashoutInfo.eligible ? (
            <>
              <CheckCircle size={16} />
              <span>Eligible for Cashout</span>
            </>
          ) : (
            <>
              <Clock size={16} />
              <span>Requirements Pending</span>
            </>
          )}
        </div>
      </div>

      <div className="requirements-grid">
        {/* Earnings Requirement */}
        <div className={`requirement-card ${cashoutInfo.requirements.minimumEarnings.met ? 'met' : 'pending'}`}>
          <div className="requirement-header">
            <DollarSign size={20} />
            <h4>Minimum Earnings</h4>
            {cashoutInfo.requirements.minimumEarnings.met && <CheckCircle size={16} className="check-icon" />}
          </div>
          <div className="requirement-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min(100, (cashoutInfo.requirements.minimumEarnings.current / cashoutInfo.requirements.minimumEarnings.required) * 100)}%` 
                }}
              ></div>
            </div>
            <div className="progress-text">
              <span>{formatCurrency(cashoutInfo.requirements.minimumEarnings.current)}</span>
              <span>/ {formatCurrency(cashoutInfo.requirements.minimumEarnings.required)}</span>
            </div>
          </div>
        </div>

        {/* Engagement Requirement */}
        <div className={`requirement-card ${cashoutInfo.requirements.minimumEngagement.met ? 'met' : 'pending'}`}>
          <div className="requirement-header">
            <Activity size={20} />
            <h4>Minimum Engagement</h4>
            {cashoutInfo.requirements.minimumEngagement.met && <CheckCircle size={16} className="check-icon" />}
          </div>
          <div className="requirement-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min(100, (cashoutInfo.requirements.minimumEngagement.current / cashoutInfo.requirements.minimumEngagement.required) * 100)}%` 
                }}
              ></div>
            </div>
            <div className="progress-text">
              <span>{formatNumber(cashoutInfo.requirements.minimumEngagement.current)}</span>
              <span>/ {formatNumber(cashoutInfo.requirements.minimumEngagement.required)}</span>
            </div>
          </div>
        </div>

        {/* Engagement to Earnings Ratio */}
        <div className={`requirement-card ${cashoutInfo.requirements.engagementRatio.met ? 'met' : 'pending'}`}>
          <div className="requirement-header">
            <Zap size={20} />
            <h4>Engagement Ratio</h4>
            {cashoutInfo.requirements.engagementRatio.met && <CheckCircle size={16} className="check-icon" />}
          </div>
          <div className="requirement-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min(100, (cashoutInfo.requirements.engagementRatio.current / cashoutInfo.requirements.engagementRatio.required) * 100)}%` 
                }}
              ></div>
            </div>
            <div className="progress-text">
              <span>{formatNumber(cashoutInfo.requirements.engagementRatio.current)}</span>
              <span>/ {formatNumber(cashoutInfo.requirements.engagementRatio.required)}</span>
            </div>
            <div className="ratio-explanation">
              {earningsConfig.engagementToEarningsRatio} engagement per P1 earned
            </div>
          </div>
        </div>
      </div>

      {!cashoutInfo.eligible && (
        <div className="improvement-suggestions">
          <h4>Tips to Improve Eligibility:</h4>
          <div className="suggestions-grid">
            {!cashoutInfo.requirements.minimumEarnings.met && (
              <div className="suggestion">
                <Target size={16} />
                <span>Write more high-quality articles to increase views and earnings</span>
              </div>
            )}
            {!cashoutInfo.requirements.minimumEngagement.met && (
              <div className="suggestion">
                <Users size={16} />
                <span>Encourage readers to like, comment, and share your articles</span>
              </div>
            )}
            {!cashoutInfo.requirements.engagementRatio.met && (
              <div className="suggestion">
                <TrendingUp size={16} />
                <span>Focus on creating engaging content that drives interactions</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CashoutProgress;
