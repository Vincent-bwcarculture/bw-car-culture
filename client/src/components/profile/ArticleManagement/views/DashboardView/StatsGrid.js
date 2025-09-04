// client/src/components/profile/ArticleManagement/views/DashboardView/StatsGrid.js
// Statistics grid component with engagement metrics

import React from 'react';
import {
  FileText,
  Globe,
  Eye,
  Activity,
  DollarSign,
  CheckCircle,
  Clock
} from 'lucide-react';

/**
 * Statistics grid component displaying key metrics
 */
const StatsGrid = ({
  stats,
  cashoutInfo,
  formatNumber,
  formatCurrency,
  earningsConfig
}) => {
  return (
    <div className="stats-grid">
      {/* Total Articles */}
      <div className="stat-card">
        <div className="stat-icon">
          <FileText size={24} />
        </div>
        <div className="stat-content">
          <div className="stat-number">{stats.totalArticles}</div>
          <div className="stat-label">Total Articles</div>
        </div>
      </div>
      
      {/* Published Articles */}
      <div className="stat-card">
        <div className="stat-icon published">
          <Globe size={24} />
        </div>
        <div className="stat-content">
          <div className="stat-number">{stats.publishedArticles}</div>
          <div className="stat-label">Published</div>
        </div>
      </div>
      
      {/* Total Views */}
      <div className="stat-card">
        <div className="stat-icon views">
          <Eye size={24} />
        </div>
        <div className="stat-content">
          <div className="stat-number">{formatNumber(stats.totalViews)}</div>
          <div className="stat-label">Total Views</div>
        </div>
      </div>

      {/* Total Engagement */}
      <div className="stat-card">
        <div className="stat-icon engagement">
          <Activity size={24} />
        </div>
        <div className="stat-content">
          <div className="stat-number">{formatNumber(stats.totalEngagement)}</div>
          <div className="stat-label">Total Engagement</div>
          <div className="stat-sublabel">{stats.engagementRate}% rate</div>
        </div>
      </div>
      
      {/* Total Earnings */}
      <div className="stat-card earnings-card">
        <div className="stat-icon earnings">
          <DollarSign size={24} />
        </div>
        <div className="stat-content">
          <div className="stat-number">{formatCurrency(stats.totalEarnings)}</div>
          <div className="stat-label">Total Earnings</div>
        </div>
      </div>

      {/* Cashout Eligibility */}
      <div className={`stat-card ${cashoutInfo.eligible ? 'cashout-ready' : 'cashout-pending'}`}>
        <div className="stat-icon">
          {cashoutInfo.eligible ? <CheckCircle size={24} /> : <Clock size={24} />}
        </div>
        <div className="stat-content">
          <div className="stat-number">{formatCurrency(cashoutInfo.unpaidEarnings)}</div>
          <div className="stat-label">Pending Cashout</div>
          <div className="stat-sublabel">
            {cashoutInfo.eligible ? 'Ready!' : 
              `Need ${formatNumber(Math.max(0, earningsConfig.minimumEngagementForCashout - cashoutInfo.totalEngagement))} more engagement`
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsGrid;
