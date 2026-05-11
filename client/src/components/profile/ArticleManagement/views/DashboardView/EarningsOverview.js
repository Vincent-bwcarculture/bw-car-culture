// client/src/components/profile/ArticleManagement/views/DashboardView/EarningsOverview.js
// Earnings overview section component

import React from 'react';
import {
  Target,
  Award,
  BarChart3,
  ExternalLink
} from 'lucide-react';

/**
 * Earnings overview section component
 * @param {Object} props - Component props
 */
const EarningsOverview = ({
  stats,
  onViewEarnings,
  formatCurrency,
  formatNumber,
  earningsConfig
}) => {
  return (
    <div className="earnings-overview">
      <div className="section-header">
        <h3>Earnings & Engagement Overview</h3>
        <button className="view-earnings-button" onClick={onViewEarnings}>
          View Detailed Breakdown
          <ExternalLink size={14} />
        </button>
      </div>

      <div className="earnings-grid">
        {/* Your Earning Rate */}
        <div className="earnings-info-card">
          <div className="earnings-info-header">
            <Target size={20} />
            <h4>Your Earning Rate</h4>
          </div>
          <div className="rate-info">
            <div className="rate-item">
              <span className="rate-label">Per View:</span>
              <span className="rate-value">{formatCurrency(earningsConfig.ratePerView)}</span>
            </div>
            <div className="rate-item">
              <span className="rate-label">Average per View:</span>
              <span className="rate-value">{formatCurrency(stats.averageEarningsPerView)}</span>
            </div>
            <div className="rate-item">
              <span className="rate-label">Avg Engagement per Article:</span>
              <span className="rate-value">{formatNumber(stats.averageEngagementPerArticle)}</span>
            </div>
          </div>
        </div>

        {/* Top Performing Articles */}
        {stats.topEarningArticle && (
          <div className="earnings-info-card">
            <div className="earnings-info-header">
              <Award size={20} />
              <h4>Top Earning Article</h4>
            </div>
            <div className="top-article-info">
              <p className="article-title">{stats.topEarningArticle.title}</p>
              <div className="article-stats">
                <span>{formatNumber(stats.topEarningArticle.calculatedEarnings.breakdown.views)} views</span>
                <span className="earnings-amount">{formatCurrency(stats.topEarningArticle.calculatedEarnings.totalEarned)}</span>
                <span className="engagement-amount">{formatNumber(stats.topEarningArticle.calculatedEngagement)} engagement</span>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Projection */}
        <div className="earnings-info-card">
          <div className="earnings-info-header">
            <BarChart3 size={20} />
            <h4>This Month</h4>
          </div>
          <div className="projection-info">
            <div className="projection-item">
              <span className="projection-label">Earnings:</span>
              <span className="projection-value">{formatCurrency(stats.thisMonthEarnings)}</span>
            </div>
            <div className="projection-item">
              <span className="projection-label">Engagement:</span>
              <span className="projection-value">{formatNumber(stats.thisMonthEngagement)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsOverview;
