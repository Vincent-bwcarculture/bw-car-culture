// client/src/components/profile/ArticleManagement/views/EarningsView/EarningsSummary.js
// Earnings summary cards component

import React from 'react';
import {
  Wallet,
  CheckCircle,
  Clock,
  Activity,
  Send
} from 'lucide-react';

/**
 * Earnings summary cards component
 */
const EarningsSummary = ({
  stats,
  cashoutInfo,
  formatCurrency,
  formatNumber,
  onRequestCashout
}) => {
  return (
    <div className="earnings-summary">
      <div className="earnings-card total">
        <div className="earnings-card-icon">
          <Wallet size={28} />
        </div>
        <div className="earnings-card-content">
          <h3>{formatCurrency(stats.totalEarnings)}</h3>
          <p>Total Earnings</p>
          <span className="earnings-note">From {formatNumber(stats.totalViews)} views</span>
        </div>
      </div>

      <div className={`earnings-card pending ${cashoutInfo.eligible ? 'ready' : 'not-ready'}`}>
        <div className="earnings-card-icon">
          {cashoutInfo.eligible ? <CheckCircle size={28} /> : <Clock size={28} />}
        </div>
        <div className="earnings-card-content">
          <h3>{formatCurrency(cashoutInfo.unpaidEarnings)}</h3>
          <p>Pending Cashout</p>
          <span className="earnings-note">
            {cashoutInfo.eligible ? (
              <>
                Ready for payout! 
                <button 
                  className="request-cashout-button primary"
                  onClick={onRequestCashout}
                  style={{ marginLeft: '8px', padding: '4px 8px', fontSize: '12px' }}
                >
                  <Send size={12} />
                  Request
                </button>
              </>
            ) : 
              `Need ${formatCurrency(Math.max(0, 100 - cashoutInfo.unpaidEarnings))} more earnings + ${formatNumber(Math.max(0, 20000 - cashoutInfo.totalEngagement))} more engagement`
            }
          </span>
        </div>
      </div>

      <div className="earnings-card engagement">
        <div className="earnings-card-icon">
          <Activity size={28} />
        </div>
        <div className="earnings-card-content">
          <h3>{formatNumber(stats.totalEngagement)}</h3>
          <p>Total Engagement</p>
          <span className="earnings-note">
            {stats.engagementRate}% engagement rate
          </span>
        </div>
      </div>
    </div>
  );
};

export default EarningsSummary;
