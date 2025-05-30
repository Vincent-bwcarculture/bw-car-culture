// src/components/admin/NewsManager/NewsManager.js
import React, { useState, useEffect } from 'react';
import { useAuth } from './../../context/AuthContext.js';
import ReviewModal from '../../components/shared/ReviewModal/ReviewModal.js';
import NewsTable from './NewsTable.js';
import { newsService } from '../../services/newsService.js';
import './NewsManager.css';

const NewsManager = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
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
      // Updated to use newsService instead of direct fetch
      const response = await newsService.getArticles(filters);
      setArticles(response.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles([]); // Initialize with empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async (formData) => {
    try {
      setLoading(true);

      // Log formData contents for debugging
      console.log('FormData fields:', [...formData.entries()].map(e => e[0]));
      
      // Create article using the newsService
      const newArticle = await newsService.createArticle(formData);
      
      // Add the new article to the list
      setArticles(prev => [newArticle, ...prev]);
      
      // Close modal and show success notification
      setShowEditor(false);
      alert('Article created successfully!'); // Replace with your notification system
      
      return newArticle;
    } catch (error) {
      console.error('Error creating article:', error);
      alert(`Failed to create article: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateArticle = async (formData) => {
    if (!selectedArticle || !selectedArticle._id) {
      alert('No article selected for update');
      return;
    }

    try {
      setLoading(true);
      
      // Log formData contents for debugging
      console.log('Updating article with id:', selectedArticle._id);
      console.log('FormData fields:', [...formData.entries()].map(e => e[0]));
      
      // Update article using the newsService
      const updatedArticle = await newsService.updateArticle(selectedArticle._id, formData);
      
      // Update the article in the list
      setArticles(prev => 
        prev.map(article => 
          article._id === selectedArticle._id ? updatedArticle : article
        )
      );
      
      // Close modal and show success notification
      setShowEditor(false);
      setSelectedArticle(null);
      alert('Article updated successfully!'); // Replace with your notification system
      
      return updatedArticle;
    } catch (error) {
      console.error('Error updating article:', error);
      alert(`Failed to update article: ${error.message}`);
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
      // Delete article using the newsService
      await newsService.deleteArticle(id);
      
      // Remove the article from the list
      setArticles(prev => prev.filter(article => article._id !== id));
      
      alert('Article deleted successfully!'); // Replace with your notification system
    } catch (error) {
      console.error('Error deleting article:', error);
      alert(`Failed to delete article: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for ReviewModal submission
  const handleSubmit = (formData) => {
    if (selectedArticle) {
      return handleUpdateArticle(formData);
    } else {
      return handleCreateArticle(formData);
    }
  };

  return (
    <div className="news-manager">
      <div className="news-header">
        <h2>News & Articles</h2>
        <div className="news-actions">
          <div className="filter-controls">
            <input
              type="text"
              placeholder="Search articles..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="category-filter"
            >
              <option value="all">All Categories</option>
              <option value="news">News</option>
              <option value="feature">Features</option>
              <option value="industry">Industry News</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="status-filter"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <button 
            className="create-article-btn"
            onClick={() => {
              setSelectedArticle(null);
              setShowEditor(true);
            }}
          >
            Create New Article
          </button>
        </div>
      </div>

      <NewsTable 
        articles={articles}
        loading={loading}
        onEdit={(article) => {
          setSelectedArticle(article);
          setShowEditor(true);
        }}
        onDelete={handleDeleteArticle}
      />

      {showEditor && (
        <ReviewModal
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setSelectedArticle(null);
          }}
          onSubmit={handleSubmit}
          initialData={selectedArticle}
          contentType="news" // This is important! Set the content type to "news"
        />
      )}
    </div>
  );
};

export default NewsManager;