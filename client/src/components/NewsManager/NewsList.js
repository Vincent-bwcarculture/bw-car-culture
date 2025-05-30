// src/admin/NewsManager/NewsList.js
import React, { useState, useEffect } from 'react';
import { http } from '../../../config/axios.js';
import { useAuth } from '../../../context/AuthContext.js';
import ContentEditorModal from '../../Admin/ContentEditor/ContentEditorModal.js';
import './NewsList.css';

const NewsList = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    search: '',
    sortBy: 'newest'
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchArticles();
  }, [filters]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.category !== 'all') queryParams.append('category', filters.category);
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.search) queryParams.append('search', filters.search);
      queryParams.append('sort', getSortValue());

      const response = await http.get(`/news?${queryParams.toString()}`);
      
      if (response.data && response.data.success) {
        setArticles(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch articles');
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to load articles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSortValue = () => {
    switch (filters.sortBy) {
      case 'newest': return '-createdAt';
      case 'oldest': return 'createdAt';
      case 'titleAZ': return 'title';
      case 'titleZA': return '-title';
      default: return '-createdAt';
    }
  };

  const handleCreateArticle = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await http.multipartPost('/news', formData, (progress) => {
        console.log('Upload progress:', progress);
      });

      if (!formData.title) {
        setError('Title is required');
        return;
      }
      
      if (!formData.content) {
        setError('Content is required');
        return;
      }
      
      if (!formData.category) {
        formData.category = 'news'; // Default category
      }

      if (response.data && response.data.success) {
        // Add new article to the list
        setArticles(prev => [response.data.data, ...prev]);
        setShowEditor(false);
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to create article');
      }
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateArticle = async (formData) => {
    if (!selectedArticle) return;

    try {
      setLoading(true);
      setError(null);

      const response = await http.multipartPost(`/news/${selectedArticle._id}`, formData, (progress) => {
        console.log('Upload progress:', progress);
      }, { method: 'PUT' });

      if (response.data && response.data.success) {
        // Update article in the list
        setArticles(prev => 
          prev.map(article => 
            article._id === selectedArticle._id ? response.data.data : article
          )
        );
        setShowEditor(false);
        setSelectedArticle(null);
        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Failed to update article');
      }
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await http.delete(`/news/${id}`);
      
      if (response.data && response.data.success) {
        // Remove article from the list
        setArticles(prev => prev.filter(article => article._id !== id));
      } else {
        throw new Error(response.data?.message || 'Failed to delete article');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      setError('Failed to delete article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (id, currentStatus) => {
    try {
      const response = await http.patch(`/news/${id}/featured`, {
        featured: !currentStatus
      });
      
      if (response.data && response.data.success) {
        // Update article in the list
        setArticles(prev => 
          prev.map(article => 
            article._id === id 
              ? { ...article, featured: !currentStatus } 
              : article
          )
        );
      } else {
        throw new Error(response.data?.message || 'Failed to update featured status');
      }
    } catch (error) {
      console.error('Error updating featured status:', error);
      setError('Failed to update featured status. Please try again.');
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="news-list-container">
      <div className="news-list-header">
        <h1>News & Articles</h1>
        <div className="news-actions">
          <button 
            className="add-news-btn"
            onClick={() => {
              setSelectedArticle(null);
              setShowEditor(true);
            }}
          >
            + Add New Article
          </button>
        </div>
      </div>

      <div className="news-filters">
        <div className="filter-group">
          <input 
            type="text"
            placeholder="Search articles..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select 
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="news">News</option>
            <option value="review">Reviews</option>
            <option value="feature">Features</option>
            <option value="comparison">Comparisons</option>
            <option value="industry">Industry News</option>
          </select>
        </div>
        
        <div className="filter-group">
          <select 
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        
        <div className="filter-group">
          <select 
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="filter-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="titleAZ">Title A-Z</option>
            <option value="titleZA">Title Z-A</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && articles.length === 0 ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : articles.length === 0 ? (
        <div className="no-articles">
          <p>No articles found.</p>
          <button 
            className="add-news-btn small"
            onClick={() => {
              setSelectedArticle(null);
              setShowEditor(true);
            }}
          >
            Create Your First Article
          </button>
        </div>
      ) : (
        <div className="articles-table">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article._id}>
                  <td className="article-title-cell">
                    <div className="article-title-container">
                      {article.featuredImage && (
                        <div className="article-thumbnail">
                          <img 
                            src={article.featuredImage.url} 
                            alt={article.title} 
                            onError={(e) => {
                              e.target.src = '/images/placeholders/default.jpg';
                            }}
                          />
                        </div>
                      )}
                      <div className="article-title-info">
                        <span className="article-title">{article.title}</span>
                        <span className="article-author">By {article.authorName}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`category-badge ${article.category}`}>
                      {article.category}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${article.status}`}>
                      {article.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className={`featured-toggle ${article.featured ? 'featured' : ''}`}
                      onClick={() => handleToggleFeatured(article._id, article.featured)}
                      title={article.featured ? 'Remove from featured' : 'Add to featured'}
                    >
                      {article.featured ? '★' : '☆'}
                    </button>
                  </td>
                  <td>
                    {article.publishDate ? formatDate(article.publishDate) : 'Not published'}
                  </td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn edit"
                      onClick={() => {
                        setSelectedArticle(article);
                        setShowEditor(true);
                      }}
                      title="Edit article"
                    >
                      ✎
                    </button>
                    <button 
                      className="action-btn view"
                      onClick={() => window.open(`/news/${article.slug || article._id}`, '_blank')}
                      title="View article"
                    >
                      👁
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteArticle(article._id)}
                      title="Delete article"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEditor && (
        <ContentEditorModal
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setSelectedArticle(null);
          }}
          onSubmit={selectedArticle ? handleUpdateArticle : handleCreateArticle}
          initialData={selectedArticle}
          contentType="news"
        />
      )}
    </div>
  );
};

export default NewsList;