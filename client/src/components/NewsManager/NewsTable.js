// src/components/admin/NewsManager/NewsTable.js
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

  // Add this check to prevent the map error
  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    return (
      <div className="no-articles">
        <p>No articles found</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
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
      archived: 'status-archived'
    };
    return `status-badge ${statusClasses[status] || ''}`;
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
            <tr key={article.id}>
              <td>
                <div className="article-info">
                  {article.featuredImage && (
                    <div className="article-thumbnail">
                      <img 
                        src={article.featuredImage} 
                        alt={article.title}
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="article-details">
                    <h4>{article.title}</h4>
                    <span className="article-id">ID: {article.id}</span>
                  </div>
                </div>
              </td>
              <td>
                <span className="category-badge">
                  {article.category}
                </span>
              </td>
              <td>
                <div className="author-info">
                  {article.author.avatar && (
                    <img 
                      src={article.author.avatar} 
                      alt={article.author.name}
                      className="author-avatar"
                    />
                  )}
                  <span>{article.author.name}</span>
                </div>
              </td>
              <td>
                <span className={getStatusClass(article.status)}>
                  {article.status}
                </span>
              </td>
              <td>{article.publishDate ? formatDate(article.publishDate) : '-'}</td>
              <td>{article.views?.toLocaleString() || 0}</td>
              <td>
                <div className="article-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => onEdit(article)}
                    title="Edit article"
                  >
                    ✎
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => onDelete(article.id)}
                    title="Delete article"
                  >
                    ×
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