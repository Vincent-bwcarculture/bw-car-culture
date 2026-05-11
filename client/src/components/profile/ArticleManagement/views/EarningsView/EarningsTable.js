// client/src/components/profile/ArticleManagement/views/EarningsView/EarningsTable.js
// Article earnings table component

import React from 'react';

/**
 * Article Earnings Table Component
 */
const EarningsTable = ({
  articles,
  formatCurrency,
  formatNumber,
  formatDate,
  getCategoryColor,
  getCategoryLabel,
  calculateArticleEarnings,
  calculateArticleEngagement
}) => {
  return (
    <div className="article-earnings-table">
      <div className="section-header">
        <h3>Article Performance & Earnings</h3>
      </div>
      
      <div className="earnings-table">
        <div className="table-header">
          <div className="header-cell">Article</div>
          <div className="header-cell">Category</div>
          <div className="header-cell">Views</div>
          <div className="header-cell">Engagement</div>
          <div className="header-cell">Earnings</div>
          <div className="header-cell">Status</div>
        </div>
        
        {articles.map(article => {
          const earnings = calculateArticleEarnings(article);
          const engagement = calculateArticleEngagement(article);
          
          return (
            <div key={article.id} className="table-row">
              <div className="table-cell article-info">
                <h4>{article.title}</h4>
                <span className="publish-date">{formatDate(article.publishDate)}</span>
              </div>
              <div className="table-cell">
                <span 
                  className="category-tag" 
                  style={{ color: getCategoryColor(article.category) }}
                >
                  {getCategoryLabel(article.category)}
                </span>
              </div>
              <div className="table-cell">
                {formatNumber(article.views)}
              </div>
              <div className="table-cell">
                {formatNumber(engagement)}
              </div>
              <div className="table-cell earnings-cell">
                <div className="earnings-breakdown">
                  <span className="total">{formatCurrency(earnings.totalEarned)}</span>
                  {earnings.engagementBonus > 0 && (
                    <span className="bonus">+{formatCurrency(earnings.engagementBonus)} bonus</span>
                  )}
                </div>
              </div>
              <div className="table-cell">
                {article.earnings?.isPaid ? (
                  <span className="payment-status paid">Paid</span>
                ) : (
                  <span className="payment-status pending">Pending</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EarningsTable;
