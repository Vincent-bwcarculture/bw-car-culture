// src/components/features/NewsReviews/NewsReviews.js
import React, { useState, useEffect } from 'react';
import NewsCard from '../../shared/NewsCard/NewsCard.js';
import { newsService } from '../../../services/newsService.js';
import './NewsReviews.css';

const NewsReviews = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  
  useEffect(() => {
    fetchArticles();
  }, [activeCategory]);

  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let fetchedArticles = [];
      
      if (activeCategory === 'all') {
        // For 'all' category, get latest articles
        fetchedArticles = await newsService.getLatestArticles(6);
      } else {
        // For specific categories, use the getArticles method with category filter
        const response = await newsService.getArticles({ category: activeCategory }, 1, 6);
        fetchedArticles = response.articles || [];
      }
      
      // Set articles from database
      setArticles(fetchedArticles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to load articles');
      // Set empty array on error
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };



  return (
    <section className="news-reviews-section">
      <div className="section-header">
        <h2>Latest News & Reviews</h2>
        <div className="section-nav">
          <button 
            className={`nav-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('all')}
          >
            All
          </button>
          <button 
            className={`nav-btn ${activeCategory === 'news' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('news')}
          >
            News
          </button>
          <button 
            className={`nav-btn ${activeCategory === 'car-review' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('car-review')}
          >
            Reviews
          </button>
          <button 
            className={`nav-btn ${activeCategory === 'feature' ? 'active' : ''}`}
            onClick={() => handleCategoryChange('feature')}
          >
            Features
          </button>
        </div>
      </div>

      {loading ? (
        <div className="articles-loading">
          <div className="loading-spinner"></div>
        </div>
      ) : error ? (
        <div className="articles-error">
          <p>{error}</p>
          <button onClick={fetchArticles}>Retry</button>
        </div>
      ) : articles.length === 0 ? (
        <div className="articles-no-content">
          <p>No articles found for this category.</p>
          <button onClick={() => handleCategoryChange('all')}>View all articles</button>
        </div>
      ) : (
        <div className="articles-grid">
          {articles.map(article => (
            <NewsCard key={article.id || article._id} article={article} />
          ))}
        </div>
      )}
    </section>
  );
};

export default NewsReviews;