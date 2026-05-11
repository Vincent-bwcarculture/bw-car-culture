// client/src/components/profile/ArticleManagement/views/ListView/index.js
// Enhanced List View Component

import React from 'react';
import {
  Plus,
  Search,
  PenTool,
  Eye,
  Activity,
  DollarSign,
  Zap,
  Edit2,
  Trash2
} from 'lucide-react';

/**
 * Enhanced List View Component
 */
const ListView = ({
  articles,
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  selectedCategory,
  setSelectedCategory,
  categories,
  onCreateNew,
  onEdit,
  onDelete,
  onBack,
  formatDate,
  formatNumber,
  formatCurrency,
  getCategoryColor,
  getCategoryLabel,
  calculateArticleEarnings,
  calculateArticleEngagement
}) => {
  return (
    <div className="list-view">
      <div className="list-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        
        <div className="header-content">
          <h2>All Articles</h2>
          <p>Manage and organize your published content</p>
        </div>
        
        <button className="create-button primary" onClick={onCreateNew}>
          <Plus size={16} />
          New Article
        </button>
      </div>

      {/* Filters */}
      <div className="list-filters">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Enhanced Articles List with Engagement Column */}
      <div className="articles-list">
        {articles.length > 0 ? (
          <div className="articles-grid enhanced">
            {articles.map(article => {
              const earnings = calculateArticleEarnings(article);
              const engagement = calculateArticleEngagement(article);
              
              return (
                <div key={article.id} className="article-card enhanced">
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
                  
                  <div className="article-stats enhanced">
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
                    {earnings.engagementBonus > 0 && (
                      <div className="stat bonus">
                        <Zap size={14} />
                        <span>+{formatCurrency(earnings.engagementBonus)} bonus</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="article-meta">
                    <span className="category" style={{ color: getCategoryColor(article.category) }}>
                      {getCategoryLabel(article.category)}
                    </span>
                    <span className="date">{formatDate(article.createdAt)}</span>
                    {article.isPremium && <span className="premium-tag">Premium</span>}
                  </div>

                  <div className="payment-status">
                    {article.earnings?.isPaid ? (
                      <span className="payment-status paid">Paid</span>
                    ) : (
                      <span className="payment-status pending">Pending</span>
                    )}
                  </div>
                  
                  <div className="article-actions">
                    <button onClick={() => onEdit(article)} className="edit-button">
                      <Edit2 size={14} />
                      Edit
                    </button>
                    <button onClick={() => onDelete(article.id)} className="delete-button">
                      <Trash2 size={14} />
                      Delete
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
                <strong>New System:</strong> P100 minimum + 20,000 engagement required for cashout
              </p>
              <p className="earning-info">
                <strong>Engagement Formula:</strong> Views + Likes×3 + Comments×5 + Shares×8
              </p>
            </div>
            <button className="create-button primary" onClick={onCreateNew}>
              <Plus size={16} />
              Create Your First Article
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListView;
