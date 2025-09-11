// client/src/components/Admin/ArticleManagement.js
// Admin component for managing user articles and pending reviews

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  Filter,
  Search
} from 'lucide-react';
import { articleApiService } from '../profile/ArticleManagement/services/articleService';
import './AdminArticleManagement.css';

const AdminArticleManagement = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Fetch articles based on active tab
  useEffect(() => {
    fetchArticles();
  }, [activeTab]);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      if (activeTab === 'pending') {
        data = await articleApiService.getPendingArticles({ limit: 50 });
        setArticles(data.articles);
      } else {
        // Fetch all articles with status filter
        data = await articleApiService.getAllArticles({ 
          status: statusFilter !== 'all' ? statusFilter : undefined,
          limit: 100
        });
        setArticles(data.articles || data.data || []);
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter articles based on search and status
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.author?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'pending') return matchesSearch;
    
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle article review (approve/reject)
  const handleReview = async (articleId, action) => {
    setReviewing(true);
    
    try {
      await articleApiService.reviewArticle(articleId, action, reviewNotes);
      
      // Remove from pending list if approved/rejected
      setArticles(prev => prev.filter(article => article._id !== articleId));
      setSelectedArticle(null);
      setReviewNotes('');
      
      alert(`Article ${action}d successfully!`);
    } catch (err) {
      alert(`Failed to ${action} article: ${err.message}`);
    } finally {
      setReviewing(false);
    }
  };

  // Handle article deletion
  const handleDelete = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    
    try {
      await articleApiService.deleteAdminArticle(articleId);
      setArticles(prev => prev.filter(article => article._id !== articleId));
      alert('Article deleted successfully!');
    } catch (err) {
      alert(`Failed to delete article: ${err.message}`);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'status-published';
      case 'pending': return 'status-pending';
      case 'draft': return 'status-draft';
      case 'rejected': return 'status-rejected';
      default: return 'status-default';
    }
  };

  if (loading) {
    return (
      <div className="admin-article-management">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-article-management">
      {/* Header */}
      <div className="admin-header">
        <h1>Article Management</h1>
        <p>Review, approve, and manage user-submitted articles</p>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={16} />
          Pending Review ({articles.filter(a => a.status === 'pending').length})
        </button>
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <Edit size={16} />
          All Articles
        </button>
      </div>

      {/* Filters (for All Articles tab) */}
      {activeTab === 'all' && (
        <div className="admin-filters">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search articles or authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      {/* Search for Pending tab */}
      {activeTab === 'pending' && (
        <div className="admin-filters">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search pending articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <p>Error: {error}</p>
          <button onClick={fetchArticles}>Retry</button>
        </div>
      )}

      {/* Articles List */}
      <div className="articles-list">
        {filteredArticles.length === 0 ? (
          <div className="empty-state">
            <p>No articles found</p>
            {activeTab === 'pending' && (
              <p>All caught up! No pending articles need review.</p>
            )}
          </div>
        ) : (
          <div className="articles-grid">
            {filteredArticles.map(article => (
              <div key={article._id} className="article-card">
                <div className="article-header">
                  <h3 className="article-title">{article.title}</h3>
                  <span className={`status-badge ${getStatusColor(article.status)}`}>
                    {article.status}
                  </span>
                </div>

                <div className="article-meta">
                  <div className="meta-item">
                    <User size={14} />
                    <span>{article.author?.name || 'Unknown Author'}</span>
                    <span className="author-role">({article.author?.role || 'user'})</span>
                  </div>
                  
                  <div className="meta-item">
                    <Calendar size={14} />
                    <span>{formatDate(article.createdAt)}</span>
                  </div>
                  
                  {article.category && (
                    <div className="meta-item">
                      <span className="category-tag">{article.category}</span>
                    </div>
                  )}
                </div>

                {article.subtitle && (
                  <p className="article-subtitle">{article.subtitle}</p>
                )}

                <div className="article-actions">
                  <button 
                    className="action-btn view-btn"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <Eye size={14} />
                    View
                  </button>

                  {activeTab === 'pending' && (
                    <>
                      <button 
                        className="action-btn approve-btn"
                        onClick={() => handleReview(article._id, 'approve')}
                        disabled={reviewing}
                      >
                        <CheckCircle size={14} />
                        Approve
                      </button>
                      
                      <button 
                        className="action-btn reject-btn"
                        onClick={() => handleReview(article._id, 'reject')}
                        disabled={reviewing}
                      >
                        <XCircle size={14} />
                        Reject
                      </button>
                    </>
                  )}

                  {activeTab === 'all' && (
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(article._id)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Article Preview Modal */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedArticle.title}</h2>
              <button 
                className="close-btn"
                onClick={() => setSelectedArticle(null)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="article-details">
                <div className="detail-row">
                  <strong>Author:</strong> {selectedArticle.author?.name} ({selectedArticle.author?.role})
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span className={`status-badge ${getStatusColor(selectedArticle.status)}`}>
                    {selectedArticle.status}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Category:</strong> {selectedArticle.category}
                </div>
                <div className="detail-row">
                  <strong>Created:</strong> {formatDate(selectedArticle.createdAt)}
                </div>
                {selectedArticle.publishDate && (
                  <div className="detail-row">
                    <strong>Published:</strong> {formatDate(selectedArticle.publishDate)}
                  </div>
                )}
              </div>

              {selectedArticle.subtitle && (
                <div className="article-subtitle-full">
                  <strong>Subtitle:</strong>
                  <p>{selectedArticle.subtitle}</p>
                </div>
              )}

              <div className="article-content-preview">
                <strong>Content Preview:</strong>
                <div className="content-preview">
                  {selectedArticle.content?.substring(0, 500)}...
                </div>
              </div>

              {selectedArticle.status === 'pending' && (
                <div className="review-section">
                  <label htmlFor="review-notes">Review Notes (optional):</label>
                  <textarea
                    id="review-notes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes for the author..."
                    rows={3}
                  />
                  
                  <div className="review-actions">
                    <button 
                      className="review-btn approve"
                      onClick={() => handleReview(selectedArticle._id, 'approve')}
                      disabled={reviewing}
                    >
                      <CheckCircle size={16} />
                      Approve Article
                    </button>
                    
                    <button 
                      className="review-btn reject"
                      onClick={() => handleReview(selectedArticle._id, 'reject')}
                      disabled={reviewing}
                    >
                      <XCircle size={16} />
                      Reject Article
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminArticleManagement;
