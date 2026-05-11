// client/src/components/profile/ArticleManagement/views/DashboardView/RecentArticles.js
// Recent articles section component

import React from 'react';
import {
  PenTool,
  Plus,
  ExternalLink,
  Eye,
  Activity,
  DollarSign,
  Edit2
} from 'lucide-react';

/**
 * Recent articles section component
 * @param {Object} props - Component props
 */
const RecentArticles = ({
  articles,
  onViewAll,
  onEdit,
  onCreateNew,
  formatNumber,
  formatCurrency,
  formatDate,
  getCategoryColor,
  getCategoryLabel,
  calculateArticleEarnings,
  calculateArticleEngagement,
  earningsConfig
}) => {
  return (
    <div className="recent-articles">
      <div className="section-header">
        <h3>Recent Articles</h3>
        <button className="view-all-button" onClick={onViewAll}>
          View All Articles
          <ExternalLink size={14} />
        </button>
      </div>
      
      {articles.length > 0 ? (
        <div className="articles-grid">
          {articles.map(article => {
            const earnings = calculateArticleEarnings(article);
            const engagement = calculateArticleEngagement(article);
            
            return (
              <div key={article.id} className="article-card">
                <div className="article-header">
                  <h4>{article.title}</h4>
                  <div className="article-status">
                    {article.status === 'published' ? (
                      <span className="status-badge published">Published</span>
                    ) : (
                      <span className="status-badge draft">Draft</span>
                    )}
                  </div>
                </div>
                
                <div className="article-stats">
                  <div className="stat">
                    <Eye size={14} />
                    <span>{formatNumber(earnings.breakdown.views)} views</span>
                  </div>
                  <div className="stat">
                    <Activity size={14} />
                    <span>{formatNumber(engagement)} engagement</span>
                  </div>
                  <div className="stat earnings">
                    <DollarSign size={14} />
                    <span>{formatCurrency(earnings.totalEarned)}</span>
                  </div>
                </div>
                
                <div className="article-meta">
                  <span className="category" style={{ color: getCategoryColor(article.category) }}>
                    {getCategoryLabel(article.category)}
                  </span>
                  <span className="date">{formatDate(article.createdAt)}</span>
                </div>

                {article.earnings?.isPaid ? (
                  <span className="payment-status paid">Paid</span>
                ) : (
                  <span className="payment-status pending">Pending</span>
                )}
                
                <div className="article-actions">
                  <button onClick={() => onEdit(article)} className="edit-button">
                    <Edit2 size={14} />
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <PenTool size={48} />
          <h3>No Articles Yet</h3>
          <p>Start creating engaging content to begin earning</p>
          <div className="earning-potential">
            <p className="earning-info">
              <strong>New Requirements:</strong> P100 minimum + 20,000 engagement for cashout
            </p>
            <p className="earning-info">
              <strong>Potential: 10,000 views + engagement = {formatCurrency(100)}+</strong>
            </p>
          </div>
          <button className="create-button primary" onClick={onCreateNew}>
            <Plus size={16} />
            Create Your First Article
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentArticles;
