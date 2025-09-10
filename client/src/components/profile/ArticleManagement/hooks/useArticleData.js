// client/src/components/profile/ArticleManagement/hooks/useArticleData.js
// Custom hook for managing article data with REAL API integration

import { useState, useEffect } from 'react';
import { articleApiService } from '../services/articleService.js';
import { 
  calculateArticleEarnings, 
  calculateArticleEngagement,
  calculateProjectedEarnings
} from '../utils/articleUtils.js';

/**
 * Custom hook for managing article data with real API calls
 * @returns {Object} Article data and statistics
 */
export const useArticleData = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
   * Load articles from API
   */
  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading articles from API...');
      const articlesData = await articleApiService.getUserArticles();
      
      // Transform API response to match our component structure
      const transformedArticles = articlesData.map(article => ({
        id: article._id,
        title: article.title,
        subtitle: article.subtitle || '',
        content: article.content,
        category: article.category,
        tags: article.tags || [],
        featuredImage: article.featuredImage?.url || null,
        status: article.status,
        publishDate: article.publishDate,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        views: article.metadata?.views || 0,
        likes: article.metadata?.likes || 0,
        comments: article.metadata?.comments || 0,
        shares: article.metadata?.shares || 0,
        bookmarks: article.metadata?.bookmarks || 0,
        totalReadTime: article.metadata?.totalReadTime || 0,
        isPremium: article.isPremium || false,
        earningsEnabled: article.earningsEnabled !== false,
        trackEngagement: article.trackEngagement !== false,
        allowComments: article.allowComments !== false,
        allowSharing: article.allowSharing !== false,
        metaTitle: article.metaTitle || '',
        metaDescription: article.metaDescription || '',
        authorNotes: article.authorNotes || '',
        // Backend data
        _id: article._id,
        author: article.author,
        slug: article.slug,
        // Mock earnings data until backend implements it
        earnings: {
          totalEarned: 0,
          viewsEarnings: 0,
          bonusEarnings: 0,
          engagementBonus: 0,
          isPaid: false,
          earningDate: null
        }
      }));
      
      setArticles(transformedArticles);
      console.log(`Loaded ${transformedArticles.length} articles from API`);
      
    } catch (error) {
      console.error('Failed to load articles:', error);
      setError(error.message);
      setArticles([]); // Set to empty array on error
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
      const draftArticles = articles.filter(a => a.status === 'draft');
      
      // Calculate real totals from API data
      const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
      const totalLikes = articles.reduce((sum, article) => sum + (article.likes || 0), 0);
      const totalComments = articles.reduce((sum, article) => sum + (article.comments || 0), 0);
      const totalShares = articles.reduce((sum, article) => sum + (article.shares || 0), 0);
      
      // Calculate earnings from actual articles (client-side until backend implements)
      const totalEarnings = articles.reduce((sum, article) => {
        const earnings = calculateArticleEarnings(article);
        return sum + earnings.totalEarned;
      }, 0);
      
      // Calculate this month's earnings
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const thisMonthEarnings = articles
        .filter(article => {
          if (!article.publishDate) return false;
          const publishDate = new Date(article.publishDate);
          return publishDate >= thisMonth;
        })
        .reduce((sum, article) => {
          const earnings = calculateArticleEarnings(article);
          return sum + earnings.totalEarned;
        }, 0);
      
      // Calculate engagement metrics
      const totalEngagement = articles.reduce((sum, article) => {
        return sum + calculateArticleEngagement(article);
      }, 0);

      const articlesWithCalculations = articles.map(article => ({
        ...article,
        calculatedEarnings: calculateArticleEarnings(article),
        calculatedEngagement: calculateArticleEngagement(article)
      }));

      const topEarningArticle = articlesWithCalculations.reduce((top, current) => 
        current.calculatedEarnings.totalEarned > (top?.calculatedEarnings.totalEarned || 0) ? current : top
      , null);

      const topEngagementArticle = articlesWithCalculations.reduce((top, current) => 
        current.calculatedEngagement > (top?.calculatedEngagement || 0) ? current : top
      , null);
      
      const updatedStats = {
        totalArticles: articles.length,
        publishedArticles: publishedArticles.length,
        draftArticles: draftArticles.length,
        totalViews: totalViews,
        totalShares: totalShares,
        totalLikes: totalLikes,
        totalComments: totalComments,
        totalEarnings: totalEarnings,
        thisMonthEarnings: thisMonthEarnings,
        pendingEarnings: articles
          .filter(article => article.status === 'published' && !article.earnings?.isPaid)
          .reduce((sum, article) => sum + calculateArticleEarnings(article).totalEarned, 0),
        averageEarningsPerView: totalViews > 0 ? totalEarnings / totalViews : 0,
        topEarningArticle,
        totalEngagement,
        thisMonthEngagement: Math.round(totalEngagement * 0.6),
        averageEngagementPerArticle: articles.length > 0 ? Math.round(totalEngagement / articles.length) : 0,
        engagementRate: totalViews > 0 ? ((totalLikes + totalComments + totalShares) / totalViews * 100).toFixed(1) : 0,
        topEngagementArticle,
        projectedMonthlyEarnings: calculateProjectedEarnings(thisMonthEarnings, new Date().getDate())
      };

      setStats(updatedStats);
    } catch (error) {
      console.error('Failed to calculate stats:', error);
    }
  };

  /**
   * Add a new article via API
   * @param {Object} newArticle - New article data
   */
  const addArticle = async (newArticle) => {
    try {
      console.log('Creating article via API...');
      const createdArticle = await articleApiService.createArticle(newArticle);
      
      // Transform API response and add to local state
      const transformedArticle = {
        id: createdArticle._id,
        title: createdArticle.title,
        subtitle: createdArticle.subtitle || '',
        content: createdArticle.content,
        category: createdArticle.category,
        tags: createdArticle.tags || [],
        featuredImage: createdArticle.featuredImage?.url || null,
        status: createdArticle.status,
        publishDate: createdArticle.publishDate,
        createdAt: createdArticle.createdAt,
        updatedAt: createdArticle.updatedAt,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        bookmarks: 0,
        totalReadTime: 0,
        isPremium: createdArticle.isPremium || false,
        earningsEnabled: createdArticle.earningsEnabled !== false,
        trackEngagement: createdArticle.trackEngagement !== false,
        allowComments: createdArticle.allowComments !== false,
        allowSharing: createdArticle.allowSharing !== false,
        metaTitle: createdArticle.metaTitle || '',
        metaDescription: createdArticle.metaDescription || '',
        authorNotes: createdArticle.authorNotes || '',
        _id: createdArticle._id,
        author: createdArticle.author,
        slug: createdArticle.slug,
        earnings: {
          totalEarned: 0,
          viewsEarnings: 0,
          bonusEarnings: 0,
          engagementBonus: 0,
          isPaid: false,
          earningDate: null
        }
      };

      setArticles(prev => [transformedArticle, ...prev]);
      console.log('Article created and added to local state');
      return transformedArticle;
      
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  };

  /**
   * Update an existing article via API
   * @param {string} articleId - Article ID to update
   * @param {Object} updates - Article updates
   */
  const updateArticle = async (articleId, updates) => {
    try {
      console.log('Updating article via API:', articleId);
      const updatedArticle = await articleApiService.updateArticle(articleId, updates);
      
      // Update local state
      setArticles(prev => prev.map(article => 
        article.id === articleId ? {
          ...article,
          title: updatedArticle.title,
          subtitle: updatedArticle.subtitle || '',
          content: updatedArticle.content,
          category: updatedArticle.category,
          tags: updatedArticle.tags || [],
          featuredImage: updatedArticle.featuredImage?.url || null,
          status: updatedArticle.status,
          publishDate: updatedArticle.publishDate,
          updatedAt: updatedArticle.updatedAt,
          isPremium: updatedArticle.isPremium || false,
          earningsEnabled: updatedArticle.earningsEnabled !== false,
          metaTitle: updatedArticle.metaTitle || '',
          metaDescription: updatedArticle.metaDescription || '',
          authorNotes: updatedArticle.authorNotes || ''
        } : article
      ));
      
      console.log('Article updated in local state');
      
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  };

  /**
   * Delete an article via API
   * @param {string} articleId - Article ID to delete
   */
  const deleteArticle = async (articleId) => {
    try {
      console.log('Deleting article via API:', articleId);
      await articleApiService.deleteArticle(articleId);
      
      // Remove from local state
      setArticles(prev => prev.filter(article => article.id !== articleId));
      console.log('Article deleted and removed from local state');
      
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
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
    if (!loading && articles.length >= 0) {
      loadStats();
    }
  }, [articles, loading]);

  return {
    // Data
    articles,
    stats,
    loading,
    error,
    
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