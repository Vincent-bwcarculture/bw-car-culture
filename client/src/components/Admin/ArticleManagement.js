// client/src/components/Admin/ArticleManagement.js
// COMPLETE FIXED VERSION - Admin component for managing user articles and pending reviews

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
  Search,
  AlertCircle
} from 'lucide-react';

// CRITICAL FIX: Import useAuth hook to set user context
import { useAuth } from '../../context/AuthContext.js';

// Import article service
import articleApiService from '../profile/ArticleManagement/services/articleService.js';

// Styles
import './AdminArticleManagement.css';

const AdminArticleManagement = () => {
  // CRITICAL FIX: Get user from AuthContext 
  const { user, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState('pending');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // CRITICAL FIX: Set user in article service when component mounts
  useEffect(() => {
    if (user) {
      console.log('Admin ArticleManagement: Setting user in service:', user.role);
      articleApiService.setCurrentUser(user);
    }
  }, [user]);

  // ENHANCED: Check admin authentication
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role !== 'admin') {
        setError(`Access denied. Admin role required. Your role: ${user.role}`);
        return;
      }
      
      // Verify token exists
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token missing. Please log in again.');
        return;
      }
      
      console.log('Admin authentication verified:', {
        userRole: user.role,
        isAdmin: user.role === 'admin',
        hasToken: !!token,
        userId: user.id
      });
    }
  }, [user, authLoading]);

  // Fetch articles based on active tab
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchArticles();
    }
  }, [activeTab, user]);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching articles for tab: ${activeTab}`);
      
      let data;
      if (activeTab === 'pending') {
        console.log('Calling getPendingArticles...');
        data = await articleApiService.getPendingArticles({ limit: 50 });
        console.log('Pending articles response:', data);
        setArticles(data.articles || []);
      } else {
        // Fetch all articles with status filter
        console.log('Calling getAllArticles...');
        data = await articleApiService.getAllArticles({ 
          status: statusFilter !== 'all' ? statusFilter : undefined,
          limit: 100
        });
        console.log('All articles response:', data);
        setArticles(data || []);
      }
      
      console.log(`Loaded ${articles.length} articles for ${activeTab} tab`);
      
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      
      // Enhanced error handling
      if (err.message.includes('Admin access required') || 
          err.message.includes('Admin authentication required') ||
          err.message.includes('403')) {
        setError('Admin access denied. Please ensure you are logged in as an admin.');
      } else if (err.message.includes('401')) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(`Error loading articles: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter articles based on search and status
  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchTerm === '' || 
      article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.author?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'pending') return matchesSearch;
    
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handle article review (approve/reject)
  const handleReview = async (articleId, action) => {
    setReviewing(true);
    
    try {
      console.log(`Reviewing article ${articleId} with action: ${action}`);
      
      await articleApiService.reviewArticle(articleId, action, reviewNotes);
      
      // Remove from pending list if approved/rejected
      setArticles(prev => prev.filter(article => article._id !== articleId));
      setSelectedArticle(null);
      setReviewNotes('');
      
      alert(`Article ${action}ed successfully!`);
    } catch (err) {
      console.error(`Review ${action} failed:`, err);
      alert(`Failed to ${action} article: ${err.message}`);
    } finally {
      setReviewing(false);
    }
  };

  // Handle article deletion
  const handleDelete = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    
    try {
      console.log(`Deleting article: ${articleId}`);
      
      await articleApiService.deleteAdminArticle(articleId);
      setArticles(prev => prev.filter(article => article._id !== articleId));
      alert('Article deleted successfully!');
    } catch (err) {
      console.error('Delete failed:', err);
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

  // ENHANCED: Loading state with authentication check
  if (authLoading) {
    return (
      <div className="admin-article-management">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  // ENHANCED: Authentication error state
  if (!user) {
    return (
      <div className="admin-article-management">
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>Authentication Required</h3>
          <p>Please log in to access the admin panel.</p>
          <button onClick={() => window.location.href = '/login'}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ENHANCED: Admin role check
  if (user.role !== 'admin') {
    return (
      <div className="admin-article-management">
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>Access Denied</h3>
          <p>Admin access required. Your current role: {user.role}</p>
          <button onClick={() => window.location.href = '/'}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

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
        
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            background: '#f0f0f0',
            padding: '10px',
            marginTop: '10px',
            borderRadius: '5px',
            fontSize: '12px',
            color: '#666'
          }}>
            <strong>Debug Info:</strong> User: {user.name} | Role: {user.role} | 
            Articles: {articles.length} | Tab: {activeTab} | Service User Set: {articleApiService.getUser() ? 'Yes' : 'No'}
          </div>
        )}
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
          <AlertCircle size={48} />
          <h3>Error Loading Articles</h3>
          <p>{error}</p>
          <button onClick={fetchArticles}>Try Again</button>
        </div>
      )}

      {/* Articles List */}
      <div className="articles-list">
        {filteredArticles.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={48} />
            <h3>No Articles Found</h3>
            {activeTab === 'pending' ? (
              <p>All caught up! No pending articles need review.</p>
            ) : (
              <p>No articles match your current filters.</p>
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
                        {reviewing ? 'Approving...' : 'Approve'}
                      </button>
                      
                      <button 
                        className="action-btn reject-btn"
                        onClick={() => handleReview(article._id, 'reject')}
                        disabled={reviewing}
                      >
                        <XCircle size={14} />
                        {reviewing ? 'Rejecting...' : 'Reject'}
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
                      {reviewing ? 'Approving...' : 'Approve Article'}
                    </button>
                    
                    <button 
                      className="review-btn reject"
                      onClick={() => handleReview(selectedArticle._id, 'reject')}
                      disabled={reviewing}
                    >
                      <XCircle size={16} />
                      {reviewing ? 'Rejecting...' : 'Reject Article'}
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