// client/src/components/profile/ArticleManagement/utils/constants.js
// Constants and configuration for article management

// Categories for articles with updated multipliers
export const categories = [
  { id: 'news', label: 'Breaking News', color: '#dc3545', multiplier: 1.2 },
  { id: 'reviews', label: 'Vehicle Reviews', color: '#28a745', multiplier: 1.5 },
  { id: 'industry', label: 'Industry Analysis', color: '#007bff', multiplier: 1.3 },
  { id: 'events', label: 'Events & Shows', color: '#ffc107', multiplier: 1.1 },
  { id: 'technology', label: 'Automotive Tech', color: '#6f42c1', multiplier: 1.4 },
  { id: 'lifestyle', label: 'Car Culture', color: '#fd7e14', multiplier: 1.0 },
  { id: 'maintenance', label: 'Tips & Maintenance', color: '#20c997', multiplier: 1.2 },
  { id: 'motorsport', label: 'Motorsport', color: '#e83e8c', multiplier: 1.3 }
];

// Default article form state
export const defaultArticleForm = {
  title: '',
  subtitle: '',
  content: '',
  category: 'news',
  tags: [],
  featuredImage: null,
  status: 'draft',
  publishDate: null,
  metaTitle: '',
  metaDescription: '',
  authorNotes: '',
  isPremium: false,
  earningsEnabled: true,
  trackEngagement: true,
  allowComments: true,
  allowSharing: true
};

// View types for navigation
export const VIEWS = {
  DASHBOARD: 'dashboard',
  EARNINGS: 'earnings',
  LIST: 'list',
  EDITOR: 'editor'
};

// Article status types
export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published'
};

// Payment methods for cashout
export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  MOBILE_WALLET: 'mobile_wallet'
};

// Bank options for Botswana
export const BANKS = [
  { id: 'fnb', name: 'First National Bank (FNB)' },
  { id: 'standard_bank', name: 'Standard Bank' },
  { id: 'absa', name: 'ABSA Bank' },
  { id: 'stanchart', name: 'Standard Chartered' },
  { id: 'bank_gaborone', name: 'Bank of Gaborone' }
];

// Mobile wallet providers
export const WALLET_PROVIDERS = [
  { id: 'orange_money', name: 'Orange Money' },
  { id: 'mascom_myzer', name: 'Mascom MyZer' },
  { id: 'btc_smega', name: 'BTC Smega' }
];

// Named exports for individual constants
export { categories };
export { defaultArticleForm };
export { VIEWS };
export { ARTICLE_STATUS };
export { PAYMENT_METHODS };
export { BANKS };
export { WALLET_PROVIDERS };

// Default export with all constants
export default {
  categories,
  defaultArticleForm,
  VIEWS,
  ARTICLE_STATUS,
  PAYMENT_METHODS,
  BANKS,
  WALLET_PROVIDERS
};
