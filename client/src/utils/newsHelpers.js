// src/utils/newsHelpers.js

/**
 * Utility specifically for handling news article image URLs
 * Updated to work with AWS S3 integration
 */

/**
 * Clean HTML content by removing tags and decoding entities
 * @param {string} content - HTML content to clean
 * @returns {string} - Clean text content
 */
export const cleanHtmlContent = (content) => {
  if (!content) return '';
  
  // Remove HTML tags
  let cleaned = content.replace(/<[^>]*>?/gm, '');
  
  // Decode HTML entities
  cleaned = cleaned.replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&#039;/g, "'")
                  .replace(/&nbsp;/g, ' ');
  
  return cleaned;
};

/**
 * Get the proper URL for a news article image
 * @param {Object} article - The article object that may contain image data
 * @returns {string} - A properly formatted image URL
 */
export const getNewsImageUrl = (article) => {
  if (!article) return '/images/placeholders/default.jpg';
  
  try {
    // Check for featuredImage object with url property
    if (article.featuredImage?.url) {
      return formatNewsImagePath(article.featuredImage.url);
    }
    
    // Check for direct image property
    if (article.image) {
      return formatNewsImagePath(article.image);
    }
    
    // Check for gallery images
    if (article.gallery && article.gallery.length > 0) {
      // Handle both string and object formats
      const firstImage = article.gallery[0];
      if (typeof firstImage === 'string') {
        return formatNewsImagePath(firstImage);
      } else if (firstImage.url) {
        return formatNewsImagePath(firstImage.url);
      }
    }
    
    // If no image found, return fallback
    return '/images/placeholders/default.jpg';
  } catch (error) {
    console.error('Error getting news image URL:', error);
    return '/images/placeholders/default.jpg';
  }
};

/**
 * Process gallery images from an article to ensure proper URLs
 * @param {Object} article - The article object with a gallery property
 * @returns {Array} - Array of properly formatted image URLs
 */
export const getGalleryImageUrls = (article) => {
  if (!article || !article.gallery || !Array.isArray(article.gallery)) {
    return [];
  }
  
  return article.gallery.map(image => {
    if (typeof image === 'string') {
      return formatNewsImagePath(image);
    } else if (image && typeof image === 'object' && image.url) {
      return formatNewsImagePath(image.url);
    }
    return null;
  }).filter(Boolean);
};

/**
 * Format a news image path to ensure it's properly formatted
 * Now handles S3 URLs and legacy paths
 * @param {string} imagePath - The original image path
 * @returns {string} - Properly formatted URL
 */
export const formatNewsImagePath = (imagePath) => {
  if (!imagePath) return '/images/placeholders/default.jpg';
  
  // If it's already a full URL (S3), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path, ensure it starts with /
  if (!imagePath.startsWith('/')) {
    return `/${imagePath}`;
  }
  
  return imagePath;
};

/**
 * Format date in a consistent way across the app
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

/**
 * Format category name for display
 * @param {string} category - The category string
 * @returns {string} - Formatted category name
 */
export const formatCategoryName = (category) => {
  if (!category) return 'News';
  
  const categoryNames = {
    'all': 'All News',
    'news': 'News',
    'reviews': 'Reviews',
    'review': 'Reviews',
    'features': 'Features',
    'feature': 'Features',
    'comparison': 'Comparisons',
    'industry': 'Industry',
    'supercar': 'Supercars',
    'sports': 'Sports Cars',
    'luxury': 'Luxury',
    'videos': 'Videos'
  };
  
  return categoryNames[category.toLowerCase()] || 
         category.charAt(0).toUpperCase() + category.slice(1);
};

/**
 * Check if an article has video content
 * @param {Object} article - The article object
 * @returns {boolean} - Whether the article has video
 */
export const hasVideo = (article) => {
  if (!article) return false;
  
  return !!(
    article.video || 
    article.youtubeUrl || 
    (article.content && (
      article.content.includes('youtube.com') || 
      article.content.includes('youtu.be')
    ))
  );
};

/**
 * Check if an article has a gallery
 * @param {Object} article - The article object
 * @returns {boolean} - Whether the article has a gallery
 */
export const hasGallery = (article) => {
  return article && 
         article.gallery && 
         Array.isArray(article.gallery) && 
         article.gallery.length > 0;
};

/**
 * Get author information with fallbacks
 * @param {Object} article - The article object
 * @returns {Object} - Author info with name, role, and avatar
 */
export const getAuthorInfo = (article) => {
  if (!article) {
    return {
      name: 'Car Culture News Desk',
      role: 'Editor',
      avatar: '/images/BCC Logo.png'
    };
  }
  
  if (article.author && typeof article.author === 'object') {
    return {
      name: article.author.name || 'Car Culture News Desk',
      role: article.author.role || 'Contributor',
      avatar: article.author.avatar || '/images/BCC Logo.png'
    };
  }
  
  return {
    name: article.authorName || article.author || 'Car Culture News Desk',
    role: 'Contributor',
    avatar: '/images/BCC Logo.png'
  };
};

/**
 * Get the proper article identifier for navigation
 * Now prioritizes ID over slug
 * @param {Object} article - The article object
 * @returns {string|null} - The article identifier
 */
export const getArticleIdentifier = (article) => {
  if (!article) return null;
  
  // Prefer ID over slug (changed from slug over ID)
  return article._id || article.id || article.slug || null;
};

/**
 * Extract YouTube ID from URL or content
 * @param {string} url - YouTube URL or content containing YouTube URL
 * @returns {string|null} - YouTube video ID or null
 */
export const extractYouTubeId = (url) => {
  if (!url) return null;
  
  // Regular YouTube URL
  const match = url.match(/[?&]v=([^&]+)/);
  if (match) return match[1];
  
  // YouTube short URL
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];
  
  // YouTube embed URL
  const embedMatch = url.match(/embed\/([^?]+)/);
  if (embedMatch) return embedMatch[1];
  
  return null;
};

/**
 * Check if an article is premium content
 * @param {Object} article - The article object
 * @returns {boolean} - Whether the article is premium
 */
export const isPremium = (article) => {
  if (!article) return false;
  
  return !!(article.premium || article.isPremium || article.metadata?.premium);
};

/**
 * Get article statistics
 * @param {Object} article - The article object
 * @returns {Object} - Article statistics
 */
export const getStats = (article) => {
  if (!article) {
    return {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0
    };
  }
  
  return {
    views: article.metadata?.views || article.views || 0,
    likes: article.metadata?.likes || article.likes || 0,
    comments: article.metadata?.comments || article.comments || 0,
    shares: article.metadata?.shares || article.shares || 0
  };
};

/**
 * Enhance article metadata
 * @param {Object} article - The article object
 * @returns {Object} - Enhanced article
 */
export const enhanceArticleMetadata = (article) => {
  if (!article) return article;
  
  return {
    ...article,
    imageUrl: getNewsImageUrl(article),
    excerpt: getArticleExcerpt(article),
    authorInfo: getAuthorInfo(article),
    stats: getStats(article),
    readTime: calculateReadTime(article.content),
    hasVideo: hasVideo(article),
    hasGallery: hasGallery(article),
    isPremium: isPremium(article),
    formattedDate: formatDate(article.publishDate || article.createdAt),
    identifier: getArticleIdentifier(article)
  };
};

/**
 * Search articles by query
 * @param {Array} articles - Array of articles
 * @param {string} query - Search query
 * @returns {Array} - Filtered articles
 */
export const searchArticles = (articles, query) => {
  if (!articles || !Array.isArray(articles) || !query) return articles;
  
  const searchTerm = query.toLowerCase();
  
  return articles.filter(article => {
    const title = article.title?.toLowerCase() || '';
    const content = article.content?.toLowerCase() || '';
    const subtitle = article.subtitle?.toLowerCase() || '';
    const tags = article.tags?.join(' ').toLowerCase() || '';
    const author = article.author?.name?.toLowerCase() || article.authorName?.toLowerCase() || '';
    
    return title.includes(searchTerm) ||
           content.includes(searchTerm) ||
           subtitle.includes(searchTerm) ||
           tags.includes(searchTerm) ||
           author.includes(searchTerm);
  });
};

/**
 * Find related articles
 * @param {Object} currentArticle - Current article
 * @param {Array} allArticles - All articles
 * @param {number} limit - Maximum related articles
 * @returns {Array} - Related articles
 */
export const findRelatedArticles = (currentArticle, allArticles, limit = 3) => {
  if (!currentArticle || !allArticles || !Array.isArray(allArticles)) return [];
  
  // Remove current article from list
  const otherArticles = allArticles.filter(article => 
    article._id !== currentArticle._id && 
    article.id !== currentArticle.id
  );
  
  // Score articles based on relevance
  const scoredArticles = otherArticles.map(article => {
    let score = 0;
    
    // Same category gives higher score
    if (article.category === currentArticle.category) {
      score += 3;
    }
    
    // Matching tags
    if (currentArticle.tags && article.tags) {
      const matchingTags = article.tags.filter(tag => 
        currentArticle.tags.includes(tag)
      );
      score += matchingTags.length * 2;
    }
    
    // Same author
    const currentAuthor = currentArticle.author?.name || currentArticle.authorName;
    const articleAuthor = article.author?.name || article.authorName;
    if (currentAuthor && articleAuthor && currentAuthor === articleAuthor) {
      score += 1;
    }
    
    return { article, score };
  });
  
  // Sort by score and return top matches
  return scoredArticles
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.article);
};

/**
 * Extract keywords from content
 * @param {string} content - Article content
 * @returns {Array} - Array of keywords
 */
export const extractKeywords = (content) => {
  if (!content || typeof content !== 'string') return [];
  
  // Common stop words to exclude
  const stopWords = [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
    'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
    'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can',
    'will', 'just', 'should', 'now', 'is', 'are', 'was', 'were', 'be', 'been'
  ];
  
  // Extract words from content
  const words = content
    .toLowerCase()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 3) // Minimum word length
    .filter(word => !stopWords.includes(word));
  
  // Count word frequency
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Sort by frequency and return top keywords
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
};

/**
 * Generate meta tags for an article
 * @param {Object} article - The article object
 * @returns {Object} - Meta tags object
 */
export const generateArticleMetaTags = (article) => {
  if (!article) return {};
  
  const title = article.seo?.metaTitle || article.title || 'Car Culture News';
  const description = article.seo?.metaDescription || 
                     article.subtitle || 
                     article.description || 
                     'Latest automotive news and reviews from Car Culture';
  const image = getNewsImageUrl(article);
  
  return {
    title,
    description,
    image,
    url: `https://carculture.com/news/article/${article._id || article.id}`,
    type: 'article',
    author: getAuthorInfo(article).name,
    publishedTime: article.publishDate || article.createdAt,
    modifiedTime: article.updatedAt,
    category: article.category || 'news',
    tags: article.tags || []
  };
};

/**
 * Get reading time estimate based on content
 * @param {string} content - The article content
 * @returns {number} - Estimated reading time in minutes
 */
export const calculateReadTime = (content) => {
  if (!content || typeof content !== 'string') return 5;
  
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  
  return readTime || 5; // Minimum 5 minutes
};

/**
 * Extract excerpt from article content
 * @param {Object} article - The article object
 * @param {number} maxLength - Maximum excerpt length
 * @returns {string} - Article excerpt
 */
export const getArticleExcerpt = (article, maxLength = 150) => {
  if (!article) return '';
  
  // Check for explicit excerpt/description fields
  if (article.excerpt) return article.excerpt;
  if (article.description) return article.description;
  if (article.subtitle) return article.subtitle;
  
  // Extract from content
  if (article.content) {
    let contentText = article.content;
    
    // Remove HTML tags if content contains them
    if (contentText.includes('<')) {
      contentText = contentText.replace(/<[^>]*>/g, '');
    }
    
    // Return truncated content
    if (contentText.length > maxLength) {
      return contentText.substring(0, maxLength).trim() + '...';
    }
    
    return contentText;
  }
  
  return 'Read more about this story in our latest article.';
};

/**
 * Sort articles by various criteria
 * @param {Array} articles - Array of article objects
 * @param {string} sortBy - Sort criteria
 * @returns {Array} - Sorted articles
 */
export const sortArticles = (articles, sortBy = 'newest') => {
  if (!articles || !Array.isArray(articles)) return [];
  
  const sorted = [...articles];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.publishDate || a.createdAt || 0);
        const dateB = new Date(b.publishDate || b.createdAt || 0);
        return dateB - dateA;
      });
      
    case 'oldest':
      return sorted.sort((a, b) => {
        const dateA = new Date(a.publishDate || a.createdAt || 0);
        const dateB = new Date(b.publishDate || b.createdAt || 0);
        return dateA - dateB;
      });
      
    case 'popular':
      return sorted.sort((a, b) => {
        const viewsA = a.metadata?.views || 0;
        const viewsB = b.metadata?.views || 0;
        return viewsB - viewsA;
      });
      
    case 'alphabetical':
      return sorted.sort((a, b) => {
        const titleA = a.title?.toLowerCase() || '';
        const titleB = b.title?.toLowerCase() || '';
        return titleA.localeCompare(titleB);
      });
      
    default:
      return sorted;
  }
};

/**
 * Filter articles by category and search query
 * @param {Array} articles - Array of article objects
 * @param {string} category - Category to filter by
 * @param {string} searchQuery - Search query
 * @returns {Array} - Filtered articles
 */
export const filterArticles = (articles, category = 'all', searchQuery = '') => {
  if (!articles || !Array.isArray(articles)) return [];
  
  let filtered = [...articles];
  
  // Filter by category
  if (category && category !== 'all') {
    filtered = filtered.filter(article => 
      article.category === category ||
      (category === 'videos' && hasVideo(article))
    );
  }
  
  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(article => 
      article.title?.toLowerCase().includes(query) ||
      article.subtitle?.toLowerCase().includes(query) ||
      article.content?.toLowerCase().includes(query) ||
      article.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }
  
  return filtered;
};

/**
 * Get related articles based on tags and category
 * @param {Object} currentArticle - The current article
 * @param {Array} allArticles - All available articles
 * @param {number} limit - Maximum number of related articles
 * @returns {Array} - Related articles
 */
export const getRelatedArticles = (currentArticle, allArticles, limit = 3) => {
  if (!currentArticle || !allArticles || !Array.isArray(allArticles)) return [];
  
  // Filter out the current article
  const otherArticles = allArticles.filter(article => 
    article._id !== currentArticle._id && 
    article.id !== currentArticle.id
  );
  
  // Score articles based on similarity
  const scoredArticles = otherArticles.map(article => {
    let score = 0;
    
    // Same category
    if (article.category === currentArticle.category) {
      score += 3;
    }
    
    // Matching tags
    if (currentArticle.tags && article.tags) {
      const matchingTags = article.tags.filter(tag => 
        currentArticle.tags.includes(tag)
      );
      score += matchingTags.length * 2;
    }
    
    // Similar author
    if (article.author === currentArticle.author) {
      score += 1;
    }
    
    return { article, score };
  });
  
  // Sort by score and return top matches
  return scoredArticles
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.article);
};

export default {
  cleanHtmlContent,
  getNewsImageUrl,
  getGalleryImageUrls,
  formatNewsImagePath,
  formatDate,
  formatCategoryName,
  hasVideo,
  hasGallery,
  getAuthorInfo,
  getArticleIdentifier,
  extractYouTubeId,
  isPremium,
  getStats,
  enhanceArticleMetadata,
  searchArticles,
  findRelatedArticles,
  extractKeywords,
  generateArticleMetaTags,
  calculateReadTime,
  getArticleExcerpt,
  sortArticles,
  filterArticles,
  getRelatedArticles
};