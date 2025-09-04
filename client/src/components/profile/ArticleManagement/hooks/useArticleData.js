// client/src/components/profile/ArticleManagement/hooks/useArticleData.js
// Custom hook for managing article data and statistics

import { useState, useEffect } from 'react';
import { 
  generateMockArticles, 
  calculateArticleEarnings, 
  calculateArticleEngagement,
  calculateProjectedEarnings
} from '../utils/articleUtils.js';

/**
 * Custom hook for managing article data, statistics, and loading states
 * @returns {Object} Article data and statistics
 */
export const useArticleData = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    totalViews: 0,
    totalShares: 0,
    totalLikes: 0,
    totalComments: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    pendingEarnings: 0,
    averageEarningsPerView: 0,
    topEarningArticle: null,
    totalEngagement: 0,
    thisMonthEngagement: 0,
    averageEngagementPerArticle: 0,
    engagementRate: 0,
    topEngagementArticle: null
  });

  /**
   * Load articles from API (currently using mock data)
   */
  const loadArticles = async () => {
    try {
      setLoading(true);
      
      // In production, this would be an actual API call
      // const response = await fetch('/api/articles');
      // const articlesData = await response.json();
      
      // Using mock data for now
      const mockArticles = generateMockArticles();
      setArticles(mockArticles);
      
    } catch (error) {
      console.error('Failed to load articles:', error);
      // In production, you might want to set an error state here
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate and update statistics based on current articles
   */
  const loadStats = async () => {
    try {
      const publishedArticles = articles.filter(a => a.status === 'published');
      const totalViews = 25450;
      const totalEarnings = 549.15;
      const thisMonthViews = 15800;
      const thisMonthEarnings = 331.75;
      
      // Calculate engagement metrics
      const totalEngagement = publishedArticles.reduce((sum, article) => {
        return sum + calculateArticleEngagement(article);
      }, 0);

      const articlesWithEarnings = publishedArticles.map(article => ({
        ...article,
        calculatedEarnings: calculateArticleEarnings(article),
        calculatedEngagement: calculateArticleEngagement(article)
      }));

      const topEarningArticle = articlesWithEarnings.reduce((top, current) => 
        current.calculatedEarnings.totalEarned > (top?.calculatedEarnings.totalEarned || 0) ? current : top
      , null);

      const topEngagementArticle = articlesWithEarnings.reduce((top, current) => 
        current.calculatedEngagement > (top?.calculatedEngagement || 0) ? current : top
      , null);
      
      const updatedStats = {
        totalArticles: 18,
        publishedArticles: 15,
        draftArticles: 3,
        totalViews: totalViews,
        totalShares: 234,
        totalLikes: 1890,
        totalComments: 156,
        totalEarnings: totalEarnings,
        thisMonthEarnings: thisMonthEarnings,
        pendingEarnings: 463.75,
        averageEarningsPerView: totalEarnings / totalViews,
        topEarningArticle,
        totalEngagement,
        thisMonthEngagement: Math.round(totalEngagement * 0.6),
        averageEngagementPerArticle: publishedArticles.length > 0 ? Math.round(totalEngagement / publishedArticles.length) : 0,
        engagementRate: totalViews > 0 ? ((1890 + 156 + 234) / totalViews * 100).toFixed(1) : 0,
        topEngagementArticle,
        projectedMonthlyEarnings: calculateProjectedEarnings(thisMonthEarnings, new Date().getDate())
      };

      setStats(updatedStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  /**
   * Add a new article to the articles array
   * @param {Object} newArticle - New article data
   */
  const addArticle = (newArticle) => {
    const articleWithId = {
      id: Date.now().toString(),
      ...newArticle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      bookmarks: 0,
      totalReadTime: 0,
      earnings: {
        totalEarned: 0,
        viewsEarnings: 0,
        bonusEarnings: 0,
        engagementBonus: 0,
        isPaid: false,
        earningDate: null
      }
    };

    setArticles(prev => [articleWithId, ...prev]);
    return articleWithId;
  };

  /**
   * Update an existing article
   * @param {string} articleId - Article ID to update
   * @param {Object} updates - Article updates
   */
  const updateArticle = (articleId, updates) => {
    setArticles(prev => prev.map(article => 
      article.id === articleId 
        ? { ...article, ...updates, updatedAt: new Date().toISOString() }
        : article
    ));
  };

  /**
   * Delete an article by ID
   * @param {string} articleId - Article ID to delete
   */
  const deleteArticle = (articleId) => {
    setArticles(prev => prev.filter(article => article.id !== articleId));
  };

  /**
   * Refresh both articles and stats
   */
  const refreshData = async () => {
    await loadArticles();
    // loadStats will be called automatically when articles update
  };

  // Load articles on component mount
  useEffect(() => {
    loadArticles();
  }, []);

  // Update stats when articles change
  useEffect(() => {
    if (!loading) {
      loadStats();
    }
  }, [articles, loading]);

  return {
    // Data
    articles,
    stats,
    loading,
    
    // Operations
    addArticle,
    updateArticle,
    deleteArticle,
    refreshData,
    loadArticles,
    loadStats
  };
};

export default useArticleData;
