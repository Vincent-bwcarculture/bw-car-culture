// client/src/components/profile/ArticleManagement/hooks/useArticleData.js
// COMPLETE FIXED VERSION - Enhanced with comprehensive debugging and error handling
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
   * Load articles from API - ENHANCED WITH DEBUGGING
   */
  const loadArticles = async () => {
    try {
      console.log('\n📊 ===== LOADING ARTICLES FROM API =====');
      setLoading(true);
      setError(null);
      
      // Verify articleApiService is available
      if (!articleApiService) {
        throw new Error('articleApiService is not available');
      }
      
      console.log('Calling articleApiService.getUserArticles...');
      const articlesData = await articleApiService.getUserArticles({
        page: 1,
        limit: 100,
        status: 'all'
      });
      
      console.log('Raw API response:', {
        isArray: Array.isArray(articlesData),
        count: articlesData?.length || 0,
        firstArticle: articlesData?.[0] ? {
          id: articlesData[0]._id,
          title: articlesData[0].title
        } : null
      });
      
      // Transform API response to match our component structure
      const transformedArticles = (articlesData || []).map(article => {
        const transformed = {
          id: article._id,
          title: article.title,
          subtitle: article.subtitle || '',
          content: article.content,
          category: article.category,
          tags: article.tags || [],
          featuredImage: article.featuredImage?.url || article.featuredImage || null,
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
        };
        
        return transformed;
      });
      
      console.log('Transformed articles:', {
        count: transformedArticles.length,
        articles: transformedArticles.map(a => ({
          id: a.id,
          title: a.title,
          status: a.status
        }))
      });
      
      setArticles(transformedArticles);
      console.log(`✅ Loaded ${transformedArticles.length} articles from API`);
      console.log('🏁 ===== ARTICLE LOADING COMPLETE =====\n');
      
    } catch (error) {
      console.error('\n❌ ===== ARTICLE LOADING FAILED =====');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('🏁 ===== ERROR PROCESSING COMPLETE =====\n');
      
      setError(error.message);
      setArticles([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate and update statistics based on current articles
   * ENHANCED: Now with error handling to prevent breaking the app
   */
  const loadStats = async () => {
    try {
      console.log('\n📈 ===== CALCULATING STATS =====');
      console.log('Articles count:', articles.length);
      
      const publishedArticles = articles.filter(a => a.status === 'published');
      const draftArticles = articles.filter(a => a.status === 'draft');
      
      console.log('Article breakdown:', {
        published: publishedArticles.length,
        draft: draftArticles.length,
        total: articles.length
      });
      
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
      console.log('✅ Stats calculated:', {
        totalArticles: updatedStats.totalArticles,
        published: updatedStats.publishedArticles,
        draft: updatedStats.draftArticles
      });
      console.log('🏁 ===== STATS CALCULATION COMPLETE =====\n');
      
    } catch (error) {
      console.error('\n❌ ===== STATS CALCULATION FAILED =====');
      console.error('Error:', error.message);
      console.error('🏁 ===== ERROR PROCESSING COMPLETE =====\n');
      
      // Set default stats instead of breaking the app
      setStats({
        totalArticles: articles.length,
        publishedArticles: articles.filter(a => a.status === 'published').length,
        draftArticles: articles.filter(a => a.status === 'draft').length,
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
        topEngagementArticle: null,
        projectedMonthlyEarnings: 0
      });
    }
  };

  /**
   * ENHANCED: Add a new article via API with comprehensive debugging
   * @param {Object} articleData - New article data
   */
  const addArticle = async (articleData) => {
    try {
      console.log('\n🎯 ===== USE_ARTICLE_DATA: ADDING ARTICLE =====');
      console.log('Article data received:', {
        title: articleData.title,
        subtitle: articleData.subtitle,
        category: articleData.category,
        status: articleData.status,
        hasFeaturedImage: !!articleData.featuredImageFile,
        hasGalleryImages: articleData.galleryImageFiles?.length || 0,
        contentLength: articleData.content?.length || 0
      });
      
      // CRITICAL: Verify articleApiService is available
      if (!articleApiService) {
        throw new Error('articleApiService is not available');
      }
      
      if (typeof articleApiService.createArticle !== 'function') {
        throw new Error('articleApiService.createArticle is not a function');
      }
      
      console.log('✅ articleApiService validation passed');
      console.log('Calling articleApiService.createArticle...');
      
      // Call the service to create the article
      const createdArticle = await articleApiService.createArticle(articleData);
      
      console.log('📨 Article creation response received:', {
        hasArticle: !!createdArticle,
        articleId: createdArticle?._id || createdArticle?.id,
        articleTitle: createdArticle?.title,
        responseType: typeof createdArticle
      });
      
      // Validate the response
      if (!createdArticle) {
        throw new Error('No article returned from API');
      }
      
      if (!createdArticle._id && !createdArticle.id) {
        throw new Error('Article created but missing ID');
      }
      
      console.log('✅ Response validation passed');
      console.log('Transforming article data...');
      
      // Transform API response and add to local state
      const transformedArticle = {
        id: createdArticle._id,
        title: createdArticle.title,
        subtitle: createdArticle.subtitle || '',
        content: createdArticle.content,
        category: createdArticle.category,
        tags: createdArticle.tags || [],
        featuredImage: createdArticle.featuredImage?.url || createdArticle.featuredImage || null,
        status: createdArticle.status,
        publishDate: createdArticle.publishDate,
        createdAt: createdArticle.createdAt,
        updatedAt: createdArticle.updatedAt,
        views: createdArticle.metadata?.views || 0,
        likes: createdArticle.metadata?.likes || 0,
        comments: createdArticle.metadata?.comments || 0,
        shares: createdArticle.metadata?.shares || 0,
        bookmarks: createdArticle.metadata?.bookmarks || 0,
        totalReadTime: createdArticle.metadata?.totalReadTime || 0,
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

      console.log('✅ Transformation complete:', {
        id: transformedArticle.id,
        title: transformedArticle.title,
        status: transformedArticle.status
      });
      
      console.log('Adding to local state...');
      console.log('Current articles count:', articles.length);

      setArticles(prev => {
        const updated = [transformedArticle, ...prev];
        console.log('Updated articles count:', updated.length);
        return updated;
      });
      
      console.log('✅ Article added to local state successfully');
      console.log('🏁 ===== ARTICLE ADDITION COMPLETE =====\n');
      
      return transformedArticle;
      
    } catch (error) {
      console.error('\n❌ ===== USE_ARTICLE_DATA: ARTICLE ADDITION FAILED =====');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Additional context logging
      if (error.response) {
        console.error('Response details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      console.error('🏁 ===== ERROR PROCESSING COMPLETE =====\n');
      throw error;
    }
  };

  /**
   * ENHANCED: Update an existing article via API with debugging
   * @param {string} articleId - Article ID to update
   * @param {Object} articleData - Article updates
   */
  const updateArticle = async (articleId, articleData) => {
    try {
      console.log('\n🔄 ===== USE_ARTICLE_DATA: UPDATING ARTICLE =====');
      console.log('Article ID:', articleId);
      console.log('Update data:', {
        title: articleData.title,
        category: articleData.category,
        status: articleData.status,
        hasFeaturedImage: !!articleData.featuredImageFile,
        hasGalleryImages: articleData.galleryImageFiles?.length || 0
      });
      
      const updatedArticle = await articleApiService.updateArticle(articleId, articleData);
      
      console.log('Update response received:', {
        id: updatedArticle._id,
        title: updatedArticle.title
      });
      
      // Update local state
      setArticles(prev => prev.map(article => 
        article.id === articleId ? {
          ...article,
          title: updatedArticle.title,
          subtitle: updatedArticle.subtitle || '',
          content: updatedArticle.content,
          category: updatedArticle.category,
          tags: updatedArticle.tags || [],
          featuredImage: updatedArticle.featuredImage?.url || updatedArticle.featuredImage || null,
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
      
      console.log('✅ Article updated in local state');
      console.log('🏁 ===== UPDATE COMPLETE =====\n');
      
      return updatedArticle;
      
    } catch (error) {
      console.error('\n❌ ===== ARTICLE UPDATE FAILED =====');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('🏁 ===== ERROR PROCESSING COMPLETE =====\n');
      throw error;
    }
  };

  /**
   * ENHANCED: Delete an article via API with debugging
   * @param {string} articleId - Article ID to delete
   */
  const deleteArticle = async (articleId) => {
    try {
      console.log('\n🗑️ ===== USE_ARTICLE_DATA: DELETING ARTICLE =====');
      console.log('Article ID:', articleId);
      
      await articleApiService.deleteArticle(articleId);
      
      console.log('Delete response received');
      console.log('Removing from local state...');
      console.log('Current articles count:', articles.length);
      
      // Remove from local state
      setArticles(prev => {
        const updated = prev.filter(article => article.id !== articleId);
        console.log('Updated articles count:', updated.length);
        return updated;
      });
      
      console.log('✅ Article deleted and removed from local state');
      console.log('🏁 ===== DELETION COMPLETE =====\n');
      
    } catch (error) {
      console.error('\n❌ ===== ARTICLE DELETION FAILED =====');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('🏁 ===== ERROR PROCESSING COMPLETE =====\n');
      throw error;
    }
  };

  /**
   * Refresh both articles and stats
   */
  const refreshData = async () => {
    console.log('\n🔄 Refreshing all article data...');
    await loadArticles();
    // loadStats will be called automatically when articles update
  };

  // Load articles on component mount
  useEffect(() => {
    console.log('🚀 ArticleData hook mounted, loading articles...');
    loadArticles();
  }, []);

  // ENHANCED: Update stats when articles change - WITH ERROR HANDLING
  // This prevents stats errors from breaking article creation
  useEffect(() => {
    if (!loading && articles.length >= 0) {
      console.log('📊 Articles changed, recalculating stats...');
      
      // Wrap in async IIFE to handle promise properly
      (async () => {
        try {
          await loadStats();
        } catch (statsError) {
          console.warn('⚠️ Stats loading failed (non-critical):', statsError.message);
          // Don't throw - stats failures shouldn't break article operations
          // The error is already handled in loadStats() with default stats
        }
      })();
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