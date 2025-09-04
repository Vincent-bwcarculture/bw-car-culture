// client/src/components/profile/ArticleManagement/views/DashboardView/index.js
// Enhanced Dashboard View with Engagement Metrics

import React from 'react';
import { Plus, PenTool, ExternalLink } from 'lucide-react';

// Sub-components
import StatsGrid from './StatsGrid.js';
import CashoutProgress from './CashoutProgress.js';
import EarningsOverview from './EarningsOverview.js';
import RecentArticles from './RecentArticles.js';

/**
 * Dashboard view component showing overview of articles, earnings, and engagement
 * @param {Object} props - Component props
 */
const DashboardView = ({
  stats,
  articles,
  onCreateNew,
  onViewAll,
  onViewEarnings,
  onEdit,
  categories,
  formatNumber,
  formatCurrency,
  formatDate,
  getCategoryColor,
  getCategoryLabel,
  calculateArticleEarnings,
  calculateArticleEngagement,
  checkCashoutEligibility,
  earningsConfig
}) => {
  const recentArticles = articles.slice(0, 3);
  const cashoutInfo = checkCashoutEligibility(articles);

  return (
    <div className="dashboard-view">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h2>Articles Dashboard</h2>
          <p>Manage your articles, track performance, and monitor earnings & engagement</p>
        </div>
        <button className="create-button primary" onClick={onCreateNew}>
          <Plus size={16} />
          New Article
        </button>
      </div>

      {/* Stats Grid Component */}
      <StatsGrid 
        stats={stats}
        cashoutInfo={cashoutInfo}
        formatNumber={formatNumber}
        formatCurrency={formatCurrency}
        earningsConfig={earningsConfig}
      />

      {/* Cashout Progress Component */}
      <CashoutProgress
        cashoutInfo={cashoutInfo}
        earningsConfig={earningsConfig}
        formatCurrency={formatCurrency}
        formatNumber={formatNumber}
      />

      {/* Earnings Overview Component */}
      <EarningsOverview
        stats={stats}
        onViewEarnings={onViewEarnings}
        formatCurrency={formatCurrency}
        formatNumber={formatNumber}
        earningsConfig={earningsConfig}
      />

      {/* Recent Articles Component */}
      <RecentArticles
        articles={recentArticles}
        onViewAll={onViewAll}
        onEdit={onEdit}
        onCreateNew={onCreateNew}
        formatNumber={formatNumber}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getCategoryColor={getCategoryColor}
        getCategoryLabel={getCategoryLabel}
        calculateArticleEarnings={calculateArticleEarnings}
        calculateArticleEngagement={calculateArticleEngagement}
        earningsConfig={earningsConfig}
      />
    </div>
  );
};

export default DashboardView;