// client/src/components/profile/ArticleManagement/utils/articleUtils.js
// Utility functions for article management

import { categories } from './constants.js';
import { earningsConfig } from './earningsConfig.js';

/**
 * Format currency amount with P prefix
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return `P${parseFloat(amount).toFixed(2)}`;
};

/**
 * Format numbers with k suffix for thousands
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

/**
 * Format date to readable string
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get category color by ID
 * @param {string} categoryId - Category ID
 * @returns {string} Category color
 */
export const getCategoryColor = (categoryId) => {
  const category = categories.find(cat => cat.id === categoryId);
  return category ? category.color : '#6c757d';
};

/**
 * Get category label by ID
 * @param {string} categoryId - Category ID
 * @returns {string} Category label
 */
export const getCategoryLabel = (categoryId) => {
  const category = categories.find(cat => cat.id === categoryId);
  return category ? category.label : categoryId;
};

/**
 * Calculate article engagement based on interactions
 * @param {Object} article - Article object
 * @returns {number} Total engagement score
 */
export const calculateArticleEngagement = (article) => {
  if (!article) return 0;
  
  const weights = earningsConfig.engagementWeights;
  const views = article.views || 0;
  const likes = article.likes || 0;
  const comments = article.comments || 0;
  const shares = article.shares || 0;
  const bookmarks = article.bookmarks || 0;
  const readTime = article.totalReadTime || 0;

  return Math.floor(
    (views * weights.view) +
    (likes * weights.like) +
    (comments * weights.comment) +
    (shares * weights.share) +
    (bookmarks * weights.bookmark) +
    (readTime * weights.readTime)
  );
};

/**
 * Calculate article earnings with bonuses
 * @param {Object} article - Article object
 * @returns {Object} Earnings breakdown
 */
export const calculateArticleEarnings = (article) => {
  if (!article || !article.earningsEnabled) {
    return {
      baseEarnings: 0,
      bonusEarnings: 0,
      engagementBonus: 0,
      totalEarned: 0,
      engagement: 0,
      breakdown: {
        views: 0,
        base: 0,
        category: 0,
        premium: 0,
        weekend: 0,
        bonus: 0,
        engagement: 0
      }
    };
  }

  const views = article.views || 0;
  const engagement = calculateArticleEngagement(article);
  const category = categories.find(c => c.id === article.category);
  const categoryMultiplier = category?.multiplier || 1;

  // Base earnings from views
  let baseEarnings = views * earningsConfig.ratePerView * categoryMultiplier;

  // Premium content multiplier
  if (article.isPremium) {
    baseEarnings *= earningsConfig.premiumMultiplier;
  }

  // Weekend bonus (if published on weekend)
  const publishDate = new Date(article.publishDate || article.createdAt);
  const isWeekend = publishDate.getDay() === 0 || publishDate.getDay() === 6;
  if (isWeekend) {
    baseEarnings *= earningsConfig.weekendBonus;
  }

  // View-based bonuses
  let bonusEarnings = 0;
  for (const [threshold, bonus] of Object.entries(earningsConfig.bonusThresholds)) {
    if (views >= parseInt(threshold)) {
      bonusEarnings = bonus;
    }
  }

  // Engagement-based bonuses
  let engagementBonus = 0;
  for (const [threshold, bonus] of Object.entries(earningsConfig.engagementBonuses)) {
    if (engagement >= parseInt(threshold)) {
      engagementBonus = bonus;
    }
  }

  const totalEarned = baseEarnings + bonusEarnings + engagementBonus;

  return {
    baseEarnings,
    bonusEarnings,
    engagementBonus,
    totalEarned,
    engagement,
    breakdown: {
      views,
      base: views * earningsConfig.ratePerView,
      category: (views * earningsConfig.ratePerView * categoryMultiplier) - (views * earningsConfig.ratePerView),
      premium: article.isPremium ? (views * earningsConfig.ratePerView * categoryMultiplier * (earningsConfig.premiumMultiplier - 1)) : 0,
      weekend: isWeekend ? (baseEarnings * (earningsConfig.weekendBonus - 1)) : 0,
      bonus: bonusEarnings,
      engagement: engagementBonus
    }
  };
};

/**
 * Check if user is eligible for cashout
 * @param {Array} articles - Array of articles
 * @returns {Object} Cashout eligibility information
 */
export const checkCashoutEligibility = (articles) => {
  const publishedArticles = articles.filter(article => article.status === 'published');
  const unpaidEarnings = publishedArticles
    .filter(article => !article.earnings?.isPaid)
    .reduce((total, article) => total + (calculateArticleEarnings(article).totalEarned || 0), 0);
  
  const totalEngagement = publishedArticles
    .reduce((total, article) => total + calculateArticleEngagement(article), 0);

  const hasMinimumEarnings = unpaidEarnings >= earningsConfig.minimumPayout;
  const hasMinimumEngagement = totalEngagement >= earningsConfig.minimumEngagementForCashout;
  const meetsEngagementRatio = totalEngagement >= (unpaidEarnings * earningsConfig.engagementToEarningsRatio);

  return {
    eligible: hasMinimumEarnings && hasMinimumEngagement && meetsEngagementRatio,
    unpaidEarnings,
    totalEngagement,
    requirements: {
      minimumEarnings: {
        required: earningsConfig.minimumPayout,
        current: unpaidEarnings,
        met: hasMinimumEarnings
      },
      minimumEngagement: {
        required: earningsConfig.minimumEngagementForCashout,
        current: totalEngagement,
        met: hasMinimumEngagement
      },
      engagementRatio: {
        required: unpaidEarnings * earningsConfig.engagementToEarningsRatio,
        current: totalEngagement,
        met: meetsEngagementRatio
      }
    }
  };
};

/**
 * Calculate projected monthly earnings
 * @param {number} currentMonthEarnings - Current month earnings
 * @param {number} dayOfMonth - Current day of month
 * @returns {number} Projected monthly earnings
 */
export const calculateProjectedEarnings = (currentMonthEarnings, dayOfMonth) => {
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dailyAverage = currentMonthEarnings / dayOfMonth;
  return parseFloat((dailyAverage * daysInMonth).toFixed(2));
};

/**
 * Generate mock article data for development
 * @returns {Array} Mock articles array
 */
export const generateMockArticles = () => {
  return [
    {
      id: '1',
      title: 'The Future of Electric Vehicles in Botswana',
      subtitle: 'Exploring the growing EV market and infrastructure development',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit...',
      category: 'news',
      tags: ['electric', 'vehicles', 'botswana', 'infrastructure'],
      status: 'published',
      publishDate: '2024-01-15',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-15',
      views: 12500,
      likes: 145,
      comments: 32,
      shares: 28,
      bookmarks: 15,
      totalReadTime: 45000,
      featuredImage: null,
      isPremium: true,
      earningsEnabled: true,
      earnings: {
        totalEarned: 287.50,
        viewsEarnings: 125.00,
        bonusEarnings: 75.00,
        engagementBonus: 87.50,
        isPaid: false,
        earningDate: '2024-01-15'
      }
    },
    {
      id: '2',
      title: 'Toyota Prius 2024 Review',
      subtitle: 'A comprehensive look at the latest hybrid technology',
      content: 'Detailed review content here...',
      category: 'reviews',
      tags: ['toyota', 'prius', 'hybrid', 'review'],
      status: 'published',
      publishDate: '2024-01-12',
      createdAt: '2024-01-08',
      updatedAt: '2024-01-12',
      views: 8750,
      likes: 89,
      comments: 18,
      shares: 15,
      bookmarks: 8,
      totalReadTime: 32000,
      featuredImage: null,
      isPremium: false,
      earningsEnabled: true,
      earnings: {
        totalEarned: 176.25,
        viewsEarnings: 87.50,
        bonusEarnings: 25.00,
        engagementBonus: 63.75,
        isPaid: false,
        earningDate: '2024-01-12'
      }
    },
    {
      id: '3',
      title: 'Best Car Maintenance Tips for 2024',
      subtitle: 'Keep your vehicle running smoothly with expert advice',
      content: 'Maintenance tips and tricks...',
      category: 'maintenance',
      tags: ['maintenance', 'tips', 'car-care'],
      status: 'published',
      publishDate: '2024-01-10',
      createdAt: '2024-01-08',
      updatedAt: '2024-01-10',
      views: 4200,
      likes: 67,
      comments: 12,
      shares: 8,
      bookmarks: 5,
      totalReadTime: 18000,
      featuredImage: null,
      isPremium: false,
      earningsEnabled: true,
      earnings: {
        totalEarned: 85.40,
        viewsEarnings: 42.00,
        bonusEarnings: 0,
        engagementBonus: 43.40,
        isPaid: true,
        earningDate: '2024-01-10'
      }
    },
    {
      id: '4',
      title: 'Draft: Upcoming Car Shows in Gaborone',
      subtitle: 'Preview of exciting automotive events',
      content: 'Draft content about car shows...',
      category: 'events',
      tags: ['events', 'gaborone', 'car-shows'],
      status: 'draft',
      publishDate: null,
      createdAt: '2024-01-18',
      updatedAt: '2024-01-18',
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      bookmarks: 0,
      totalReadTime: 0,
      featuredImage: null,
      isPremium: false,
      earningsEnabled: true,
      earnings: {
        totalEarned: 0,
        viewsEarnings: 0,
        bonusEarnings: 0,
        engagementBonus: 0,
        isPaid: false,
        earningDate: null
      }
    }
  ];
};

export default {
  formatCurrency,
  formatNumber,
  formatDate,
  getCategoryColor,
  getCategoryLabel,
  calculateArticleEngagement,
  calculateArticleEarnings,
  checkCashoutEligibility,
  calculateProjectedEarnings,
  generateMockArticles
};
