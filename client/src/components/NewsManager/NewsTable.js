// Fixed NewsTable Component - Shows Author Name Instead of ID
// Location: client/src/components/NewsManager/NewsTable.js

import React from 'react';
import './NewsTable.css';

const NewsTable = ({ articles, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="news-loading">
        <div className="news-loader"></div>
      </div>
    );
  }

  // Check to prevent map error
  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    return (
      <div className="no-articles">
        <p>No articles found</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not published';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      published: 'status-published',
      draft: 'status-draft',
      pending: 'status-pending',
      archived: 'status-archived'
    };
    return `status-badge ${statusClasses[status] || ''}`;
  };

  // Helper function to get author name from different possible structures
  const getAuthorName = (article) => {
    // Try different author structures
    if (article.author) {
      if (typeof article.author === 'string') {
        return article.author;
      }
      if (article.author.name) {
        return article.author.name;
      }
      if (article.author._id) {
        // Fallback if only ID is available
        return article.authorName || 'Unknown Author';
      }
    }
    return article.authorName || 'Unknown Author';
  };

  // Helper function to get author avatar
  const getAuthorAvatar = (article) => {
    if (article.author && article.author.avatar) {
      return article.author.avatar;
    }
    return null;
  };

  return (
    <div className="news-table-container">
      <table className="news-table">
        <thead>
          <tr>
            <th>Article</th>
            <th>Category</th>
            <th>Author</th>
            <th>Status</th>
            <th>Published</th>
            <th>Views</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {articles.map(article => (
            <tr key={article.id || article._id}>
              <td>
                <div className="article-info">
                  {article.featuredImage && (
                    <div className="article-thumbnail">
                      <img 
                        src={article.featuredImage} 
                        alt={article.title}
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/placeholders/default.jpg';
                        }}
                      />
                    </div>
                  )}
                  <div className="article-details">
                    <h4>{article.title}</h4>
                    {/* FIXED: Show subtitle or author name instead of ID */}
                    {article.subtitle ? (
                      <span className="article-subtitle">{article.subtitle}</span>
                    ) : (
                      <span className="article-author-small">By {getAuthorName(article)}</span>
                    )}
                  </div>
                </div>
              </td>
              <td>
                <span className="category-badge">
                  {article.category}
                </span>
              </td>
              <td>
                {/* FIXED: Better author display */}
                <div className="author-info">
                  {getAuthorAvatar(article) && (
                    <img 
                      src={getAuthorAvatar(article)} 
                      alt={getAuthorName(article)}
                      className="author-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/BCC Logo.png';
                      }}
                    />
                  )}
                  <span>{getAuthorName(article)}</span>
                </div>
              </td>
              <td>
                <span className={getStatusClass(article.status)}>
                  {article.status}
                </span>
              </td>
              <td>
                {formatDate(article.publishDate || article.createdAt)}
              </td>
              <td>
                <span className="views-count">
                  {article.views || article.metadata?.views || 0}
                </span>
              </td>
              <td>
                <div className="article-actions">
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => onEdit(article)}
                    title="Edit article"
                  >
                    Edit
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => onDelete(article.id || article._id)}
                    title="Delete article"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NewsTable;