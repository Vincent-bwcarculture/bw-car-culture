// src/components/admin/ReviewModal/components/constants/reviewConstants.js

export const REVIEW_CATEGORIES = [
  { value: 'car-review', label: 'Car Review' },
  { value: 'first-drive', label: 'First Drive' },
  { value: 'comparison', label: 'Comparison Test' },
  { value: 'long-term', label: 'Long Term Test' },
  { value: 'future-cars', label: 'Future Cars' }
];

export const NEWS_CATEGORIES = [
  { value: 'news', label: 'News' },
  { value: 'feature', label: 'Feature' },
  { value: 'industry', label: 'Industry News' },
  { value: 'review', label: 'Review' }
];

export const REVIEW_SECTIONS = {
  introduction: { label: 'Introduction', required: true },
  exterior: { label: 'Exterior Design', required: false },
  interior: { label: 'Interior & Comfort', required: false },
  performance: { label: 'Performance', required: false },
  handling: { label: 'Handling & Dynamics', required: false },
  technology: { label: 'Technology', required: false },
  safety: { label: 'Safety Features', required: false },
  value: { label: 'Value for Money', required: false },
  verdict: { label: 'Verdict', required: true }
};

export const RATING_CATEGORIES = {
  design: { label: 'Design', max: 10 },
  performance: { label: 'Performance', max: 10 },
  comfort: { label: 'Comfort', max: 10 },
  technology: { label: 'Technology', max: 10 },
  value: { label: 'Value', max: 10 }
};

export const ARTICLE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
];

export const INITIAL_REVIEW_STATE = {
  title: '',
  subtitle: '',
  category: '',
  tags: [],
  content: Object.keys(REVIEW_SECTIONS).reduce((acc, key) => ({
    ...acc,
    [key]: ''
  }), {}),
  ratings: Object.keys(RATING_CATEGORIES).reduce((acc, key) => ({
    ...acc,
    [key]: 0
  }), { overall: 0 }),
  featuredImage: null,
  gallery: [],
  seo: {
    metaTitle: '',
    metaDescription: '',
    keywords: []
  },
  status: 'draft'
};

export const INITIAL_NEWS_STATE = {
  title: '',
  subtitle: '',
  category: 'news',
  content: '', // Plain string for news content
  tags: [],
  featuredImage: null,
  gallery: [],
  seo: {
    metaTitle: '',
    metaDescription: '',
    keywords: []
  },
  status: 'draft',
  publishDate: new Date().toISOString().split('T')[0],
  featured: false
};

export const DEFAULT_META = {
  views: 0,
  likes: 0,
  comments: 0,
  readTime: 5
};