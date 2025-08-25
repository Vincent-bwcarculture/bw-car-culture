// client/src/components/profile/ArticleManagement.js
// ENHANCED VERSION - Complete article management dashboard with P100 + 20K engagement requirements

import React, { useState, useEffect, useRef } from 'react';
import { 
  PenTool, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye,
  Calendar,
  BarChart3,
  Image as ImageIcon,
  Video,
  Save,
  X,
  Upload,
  Loader,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Heart,
  Share2,
  ExternalLink,
  FileText,
  Tag,
  Globe,
  DollarSign,
  Wallet,
  CreditCard,
  Target,
  Activity,      // NEW: For engagement
  Zap,          // NEW: For engagement  
  Award,        // NEW: For achievements
  Send          // NEW: For cashout requests
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import './ArticleManagement.css';

const ArticleManagement = ({ profileData, refreshProfile }) => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  
  // Enhanced stats with earnings and engagement
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    totalViews: 0,
    totalShares: 0,
    totalLikes: 0,
    totalComments: 0,
    // Enhanced earnings tracking with engagement
    totalEarnings: 0,
    thisMonthEarnings: 0,
    pendingEarnings: 0,
    averageEarningsPerView: 0,
    topEarningArticle: null,
    // NEW: Engagement metrics
    totalEngagement: 0,
    thisMonthEngagement: 0,
    averageEngagementPerArticle: 0,
    engagementRate: 0,
    topEngagementArticle: null
  });

  // UPDATED: Enhanced earnings configuration with P100 minimum and engagement requirements
  const earningsConfig = {
    ratePerView: 0.01,        // P0.01 per view (P100 for 10,000 views)
    minimumPayout: 100,       // UPDATED: P100 minimum (was P50)
    // NEW: Engagement requirements for cashout eligibility
    minimumEngagementForCashout: 20000,  // 20,000 engagement required for P100
    engagementToEarningsRatio: 200,      // 200 engagement per P1 earned (20,000 for P100)
    
    bonusThresholds: {
      1000: 5,     // P5 bonus for 1k+ views
      5000: 25,    // P25 bonus for 5k+ views  
      10000: 75,   // P75 bonus for 10k+ views
      25000: 200,  // P200 bonus for 25k+ views
      50000: 500   // P500 bonus for 50k+ views (NEW)
    },
    
    // NEW: Engagement bonuses (additional to view-based earnings)
    engagementBonuses: {
      500: 2,      // P2 bonus for 500+ engagement
      1000: 5,     // P5 bonus for 1k+ engagement
      2500: 15,    // P15 bonus for 2.5k+ engagement  
      5000: 35,    // P35 bonus for 5k+ engagement
      10000: 80,   // P80 bonus for 10k+ engagement
      20000: 200   // P200 bonus for 20k+ engagement
    },
    
    premiumMultiplier: 1.5,   // 50% more for premium content
    weekendBonus: 1.2,        // 20% weekend bonus
    
    // NEW: Engagement weights for different interaction types
    engagementWeights: {
      view: 1,           // 1 point per view
      like: 3,           // 3 points per like
      comment: 5,        // 5 points per comment  
      share: 8,          // 8 points per share
      bookmark: 4,       // 4 points per bookmark
      readTime: 0.1      // 0.1 point per second of read time
    }
  };

  // Article form states with engagement tracking additions
  const [articleForm, setArticleForm] = useState({
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
    // NEW: Engagement tracking options
    trackEngagement: true,
    allowComments: true,
    allowSharing: true
  });

  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Categories for articles with updated multipliers
  const categories = [
    { id: 'news', label: 'Breaking News', color: '#dc3545', multiplier: 1.2 },
    { id: 'reviews', label: 'Vehicle Reviews', color: '#28a745', multiplier: 1.5 },
    { id: 'industry', label: 'Industry Analysis', color: '#007bff', multiplier: 1.3 },
    { id: 'events', label: 'Events & Shows', color: '#ffc107', multiplier: 1.1 },
    { id: 'technology', label: 'Automotive Tech', color: '#6f42c1', multiplier: 1.4 },
    { id: 'lifestyle', label: 'Car Culture', color: '#fd7e14', multiplier: 1.0 },
    { id: 'maintenance', label: 'Tips & Maintenance', color: '#20c997', multiplier: 1.2 },
    { id: 'motorsport', label: 'Motorsport', color: '#e83e8c', multiplier: 1.3 }
  ];

  // NEW: Enhanced engagement calculation function
  const calculateArticleEngagement = (article) => {
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

  // UPDATED: Enhanced earnings calculation with engagement bonuses
  const calculateArticleEarnings = (article) => {
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

    // NEW: Engagement-based bonuses
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

  // NEW: Check if user is eligible for cashout based on earnings and engagement
  const checkCashoutEligibility = () => {
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

  useEffect(() => {
    loadArticles();
    loadStats();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      // Enhanced mock data with engagement information
      const mockArticles = [
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
          totalReadTime: 45000, // 45,000 seconds total read time
          featuredImage: null,
          isPremium: true,
          earningsEnabled: true,
          // Earnings data
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
      
      setArticles(mockArticles);
    } catch (error) {
      console.error('Failed to load articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Enhanced mock stats with engagement
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
      
      setStats({
        totalArticles: 18,
        publishedArticles: 15,
        draftArticles: 3,
        totalViews: totalViews,
        totalShares: 234,
        totalLikes: 1890,
        totalComments: 156,
        // Enhanced earnings stats
        totalEarnings: totalEarnings,
        thisMonthEarnings: thisMonthEarnings,
        pendingEarnings: 463.75, // Unpaid earnings (now higher threshold)
        averageEarningsPerView: totalEarnings / totalViews,
        topEarningArticle,
        // NEW: Engagement stats
        totalEngagement,
        thisMonthEngagement: Math.round(totalEngagement * 0.6), // Estimate
        averageEngagementPerArticle: publishedArticles.length > 0 ? Math.round(totalEngagement / publishedArticles.length) : 0,
        engagementRate: totalViews > 0 ? ((stats.totalLikes + stats.totalComments + stats.totalShares) / totalViews * 100).toFixed(1) : 0,
        topEngagementArticle,
        projectedMonthlyEarnings: calculateProjectedEarnings(thisMonthEarnings, new Date().getDate())
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Calculate projected earnings
  const calculateProjectedEarnings = (currentMonthEarnings, dayOfMonth) => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dailyAverage = currentMonthEarnings / dayOfMonth;
    return parseFloat((dailyAverage * daysInMonth).toFixed(2));
  };

  // Format currency (Botswana Pula)
  const formatCurrency = (amount) => {
    return `P${parseFloat(amount).toFixed(2)}`;
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : '#6c757d';
  };

  const getCategoryLabel = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.label : categoryId;
  };

  // Existing functions with earnings enhancements
  const handleCreateNew = () => {
    setArticleForm({
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
    });
    setFormErrors({});
    setEditingArticle(null);
    setActiveView('editor');
  };

  const handleEdit = (article) => {
    setArticleForm({
      title: article.title,
      subtitle: article.subtitle || '',
      content: article.content,
      category: article.category,
      tags: article.tags || [],
      featuredImage: article.featuredImage,
      status: article.status,
      publishDate: article.publishDate,
      metaTitle: article.metaTitle || '',
      metaDescription: article.metaDescription || '',
      authorNotes: article.authorNotes || '',
      isPremium: article.isPremium || false,
      earningsEnabled: article.earningsEnabled !== false,
      trackEngagement: article.trackEngagement !== false,
      allowComments: article.allowComments !== false,
      allowSharing: article.allowSharing !== false
    });
    setEditingArticle(article);
    setFormErrors({});
    setActiveView('editor');
  };

  const handleSave = async (publishNow = false) => {
    try {
      setSaving(true);
      setFormErrors({});

      // Validation
      const errors = {};
      if (!articleForm.title.trim()) errors.title = 'Title is required';
      if (!articleForm.content.trim()) errors.content = 'Content is required';
      if (publishNow && !articleForm.subtitle.trim()) {
        errors.subtitle = 'Subtitle is required for publishing';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }

      const articleData = {
        ...articleForm,
        status: publishNow ? 'published' : articleForm.status,
        publishDate: publishNow ? new Date().toISOString() : articleForm.publishDate,
        authorId: user.id,
        authorName: user.name
      };

      // Mock save - replace with actual API call
      console.log('Saving article:', articleData);

      if (editingArticle) {
        // Update existing article
        setArticles(prev => prev.map(article => 
          article.id === editingArticle.id ? { ...article, ...articleData } : article
        ));
      } else {
        // Create new article
        const newArticle = {
          id: Date.now().toString(),
          ...articleData,
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
        setArticles(prev => [newArticle, ...prev]);
      }

      // Refresh stats
      loadStats();
      
      // Navigate back to list
      setActiveView('list');
      
    } catch (error) {
      console.error('Failed to save article:', error);
      setFormErrors({ general: 'Failed to save article. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;

    try {
      // Mock delete - replace with actual API call
      setArticles(prev => prev.filter(article => article.id !== articleId));
      loadStats();
    } catch (error) {
      console.error('Failed to delete article:', error);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      // Mock image upload - replace with actual implementation
      const imageUrl = URL.createObjectURL(file);
      setArticleForm(prev => ({ ...prev, featuredImage: imageUrl }));
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const addTag = (tag) => {
    if (tag && !articleForm.tags.includes(tag)) {
      setArticleForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove) => {
    setArticleForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || article.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return (
      <div className="article-management loading">
        <div className="loading-spinner">
          <Loader size={40} className="spin" />
          <p>Loading your articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="article-management">
      {activeView === 'dashboard' && (
        <EnhancedDashboardView 
          stats={stats}
          articles={articles}
          onCreateNew={handleCreateNew}
          onViewAll={() => setActiveView('list')}
          onViewEarnings={() => setActiveView('earnings')}
          onEdit={handleEdit}
          categories={categories}
          formatNumber={formatNumber}
          formatCurrency={formatCurrency}
          calculateArticleEarnings={calculateArticleEarnings}
          calculateArticleEngagement={calculateArticleEngagement}
          checkCashoutEligibility={checkCashoutEligibility}
          earningsConfig={earningsConfig}
        />
      )}

      {activeView === 'earnings' && (
        <EnhancedEarningsView
          stats={stats}
          articles={articles}
          onBack={() => setActiveView('dashboard')}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
          formatDate={formatDate}
          calculateArticleEarnings={calculateArticleEarnings}
          calculateArticleEngagement={calculateArticleEngagement}
          checkCashoutEligibility={checkCashoutEligibility}
          earningsConfig={earningsConfig}
          categories={categories}
        />
      )}

      {activeView === 'list' && (
        <EnhancedListView
          articles={filteredArticles}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBack={() => setActiveView('dashboard')}
          formatDate={formatDate}
          formatNumber={formatNumber}
          formatCurrency={formatCurrency}
          getCategoryColor={getCategoryColor}
          getCategoryLabel={getCategoryLabel}
          calculateArticleEarnings={calculateArticleEarnings}
          calculateArticleEngagement={calculateArticleEngagement}
        />
      )}

      {activeView === 'editor' && (
        <EnhancedEditorView
          articleForm={articleForm}
          setArticleForm={setArticleForm}
          formErrors={formErrors}
          saving={saving}
          editingArticle={editingArticle}
          categories={categories}
          earningsConfig={earningsConfig}
          onSave={handleSave}
          onCancel={() => setActiveView(editingArticle ? 'list' : 'dashboard')}
          onImageUpload={handleImageUpload}
          addTag={addTag}
          removeTag={removeTag}
          fileInputRef={fileInputRef}
        />
      )}
    </div>
  );
};

// UPDATED: Enhanced Dashboard View with Engagement Metrics
const EnhancedDashboardView = ({ 
  stats, 
  articles, 
  onCreateNew, 
  onViewAll, 
  onViewEarnings, 
  onEdit, 
  categories, 
  formatNumber, 
  formatCurrency, 
  calculateArticleEarnings, 
  calculateArticleEngagement,
  checkCashoutEligibility,
  earningsConfig 
}) => {
  const recentArticles = articles.slice(0, 3);
  const cashoutInfo = checkCashoutEligibility();

  return (
    <div className="dashboard-view">
      <div className="dashboard-header">
        <div className="header-content">
          <h2>Articles Dashboard</h2>
          <p>Manage your articles, track performance, and monitor earnings & engagement</p>
        </div>
        <button className="create-button primary" onClick={onCreateNew}>
          <Plus size={16} />
          New Article
        </button>
      </div>

      {/* Enhanced Stats Grid with Engagement Metrics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalArticles}</div>
            <div className="stat-label">Total Articles</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon published">
            <Globe size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.publishedArticles}</div>
            <div className="stat-label">Published</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon views">
            <Eye size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{formatNumber(stats.totalViews)}</div>
            <div className="stat-label">Total Views</div>
          </div>
        </div>

        {/* NEW: Total Engagement Card */}
        <div className="stat-card">
          <div className="stat-icon engagement">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{formatNumber(stats.totalEngagement)}</div>
            <div className="stat-label">Total Engagement</div>
            <div className="stat-sublabel">{stats.engagementRate}% rate</div>
          </div>
        </div>
        
        <div className="stat-card earnings-card">
          <div className="stat-icon earnings">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{formatCurrency(stats.totalEarnings)}</div>
            <div className="stat-label">Total Earnings</div>
          </div>
        </div>

        {/* UPDATED: Cashout Eligibility Card */}
        <div className={`stat-card ${cashoutInfo.eligible ? 'cashout-ready' : 'cashout-pending'}`}>
          <div className="stat-icon">
            {cashoutInfo.eligible ? <CheckCircle size={24} /> : <Clock size={24} />}
          </div>
          <div className="stat-content">
            <div className="stat-number">{formatCurrency(cashoutInfo.unpaidEarnings)}</div>
            <div className="stat-label">Pending Cashout</div>
            <div className="stat-sublabel">
              {cashoutInfo.eligible ? 'Ready!' : `Need ${formatNumber(Math.max(0, earningsConfig.minimumEngagementForCashout - cashoutInfo.totalEngagement))} more engagement`}
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Cashout Eligibility Progress Panel */}
      <div className="cashout-progress-panel">
        <div className="panel-header">
          <div className="header-content">
            <h3>Cashout Eligibility Progress</h3>
            <p>Track your progress toward meeting cashout requirements</p>
          </div>
          <div className={`eligibility-badge ${cashoutInfo.eligible ? 'eligible' : 'not-eligible'}`}>
            {cashoutInfo.eligible ? (
              <>
                <CheckCircle size={16} />
                <span>Eligible for Cashout</span>
              </>
            ) : (
              <>
                <Clock size={16} />
                <span>Requirements Pending</span>
              </>
            )}
          </div>
        </div>

        <div className="requirements-grid">
          {/* Earnings Requirement */}
          <div className={`requirement-card ${cashoutInfo.requirements.minimumEarnings.met ? 'met' : 'pending'}`}>
            <div className="requirement-header">
              <DollarSign size={20} />
              <h4>Minimum Earnings</h4>
              {cashoutInfo.requirements.minimumEarnings.met && <CheckCircle size={16} className="check-icon" />}
            </div>
            <div className="requirement-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(100, (cashoutInfo.requirements.minimumEarnings.current / cashoutInfo.requirements.minimumEarnings.required) * 100)}%` 
                  }}
                ></div>
              </div>
              <div className="progress-text">
                <span>{formatCurrency(cashoutInfo.requirements.minimumEarnings.current)}</span>
                <span>/ {formatCurrency(cashoutInfo.requirements.minimumEarnings.required)}</span>
              </div>
            </div>
          </div>

          {/* Engagement Requirement */}
          <div className={`requirement-card ${cashoutInfo.requirements.minimumEngagement.met ? 'met' : 'pending'}`}>
            <div className="requirement-header">
              <Activity size={20} />
              <h4>Minimum Engagement</h4>
              {cashoutInfo.requirements.minimumEngagement.met && <CheckCircle size={16} className="check-icon" />}
            </div>
            <div className="requirement-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(100, (cashoutInfo.requirements.minimumEngagement.current / cashoutInfo.requirements.minimumEngagement.required) * 100)}%` 
                  }}
                ></div>
              </div>
              <div className="progress-text">
                <span>{formatNumber(cashoutInfo.requirements.minimumEngagement.current)}</span>
                <span>/ {formatNumber(cashoutInfo.requirements.minimumEngagement.required)}</span>
              </div>
            </div>
          </div>

          {/* Engagement to Earnings Ratio */}
          <div className={`requirement-card ${cashoutInfo.requirements.engagementRatio.met ? 'met' : 'pending'}`}>
            <div className="requirement-header">
              <Zap size={20} />
              <h4>Engagement Ratio</h4>
              {cashoutInfo.requirements.engagementRatio.met && <CheckCircle size={16} className="check-icon" />}
            </div>
            <div className="requirement-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(100, (cashoutInfo.requirements.engagementRatio.current / cashoutInfo.requirements.engagementRatio.required) * 100)}%` 
                  }}
                ></div>
              </div>
              <div className="progress-text">
                <span>{formatNumber(cashoutInfo.requirements.engagementRatio.current)}</span>
                <span>/ {formatNumber(cashoutInfo.requirements.engagementRatio.required)}</span>
              </div>
              <div className="ratio-explanation">
                {earningsConfig.engagementToEarningsRatio} engagement per P1 earned
              </div>
            </div>
          </div>
        </div>

        {!cashoutInfo.eligible && (
          <div className="improvement-suggestions">
            <h4>💡 Tips to Improve Eligibility:</h4>
            <div className="suggestions-grid">
              {!cashoutInfo.requirements.minimumEarnings.met && (
                <div className="suggestion">
                  <Target size={16} />
                  <span>Write more high-quality articles to increase views and earnings</span>
                </div>
              )}
              {!cashoutInfo.requirements.minimumEngagement.met && (
                <div className="suggestion">
                  <Users size={16} />
                  <span>Encourage readers to like, comment, and share your articles</span>
                </div>
              )}
              {!cashoutInfo.requirements.engagementRatio.met && (
                <div className="suggestion">
                  <TrendingUp size={16} />
                  <span>Focus on creating engaging content that drives interactions</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Earnings Overview Section */}
      <div className="earnings-overview">
        <div className="section-header">
          <h3>Earnings & Engagement Overview</h3>
          <button className="view-earnings-button" onClick={onViewEarnings}>
            View Detailed Breakdown
            <ExternalLink size={14} />
          </button>
        </div>

        <div className="earnings-grid">
          {/* Your Earning Rate */}
          <div className="earnings-info-card">
            <div className="earnings-info-header">
              <Target size={20} />
              <h4>Your Earning Rate</h4>
            </div>
            <div className="rate-info">
              <div className="rate-item">
                <span className="rate-label">Per View:</span>
                <span className="rate-value">{formatCurrency(earningsConfig.ratePerView)}</span>
              </div>
              <div className="rate-item">
                <span className="rate-label">Average per View:</span>
                <span className="rate-value">{formatCurrency(stats.averageEarningsPerView)}</span>
              </div>
              <div className="rate-item">
                <span className="rate-label">Avg Engagement per Article:</span>
                <span className="rate-value">{formatNumber(stats.averageEngagementPerArticle)}</span>
              </div>
            </div>
          </div>

          {/* Top Performing Articles */}
          {stats.topEarningArticle && (
            <div className="earnings-info-card">
              <div className="earnings-info-header">
                <Award size={20} />
                <h4>Top Earning Article</h4>
              </div>
              <div className="top-article-info">
                <p className="article-title">{stats.topEarningArticle.title}</p>
                <div className="article-stats">
                  <span>{formatNumber(stats.topEarningArticle.calculatedEarnings.breakdown.views)} views</span>
                  <span className="earnings-amount">{formatCurrency(stats.topEarningArticle.calculatedEarnings.totalEarned)}</span>
                  <span className="engagement-amount">{formatNumber(stats.topEarningArticle.calculatedEngagement)} engagement</span>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Projection */}
          <div className="earnings-info-card">
            <div className="earnings-info-header">
              <BarChart3 size={20} />
              <h4>This Month</h4>
            </div>
            <div className="projection-info">
              <div className="projection-item">
                <span className="projection-label">Earnings:</span>
                <span className="projection-value">{formatCurrency(stats.thisMonthEarnings)}</span>
              </div>
              <div className="projection-item">
                <span className="projection-label">Engagement:</span>
                <span className="projection-value">{formatNumber(stats.thisMonthEngagement)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Articles */}
      <div className="recent-articles">
        <div className="section-header">
          <h3>Recent Articles</h3>
          <button className="view-all-button" onClick={onViewAll}>
            View All Articles
            <ExternalLink size={14} />
          </button>
        </div>
        
        {recentArticles.length > 0 ? (
          <div className="articles-grid">
            {recentArticles.map(article => {
              const earnings = calculateArticleEarnings(article);
              const engagement = calculateArticleEngagement(article);
              
              return (
                <div key={article.id} className="article-card">
                  <div className="article-header">
                    <h4>{article.title}</h4>
                    <div className="article-status">
                      {article.status === 'published' ? (
                        <span className="status-badge published">Published</span>
                      ) : (
                        <span className="status-badge draft">Draft</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="article-stats">
                    <div className="stat">
                      <Eye size={14} />
                      <span>{formatNumber(earnings.breakdown.views)} views</span>
                    </div>
                    <div className="stat">
                      <Activity size={14} />
                      <span>{formatNumber(engagement)} engagement</span>
                    </div>
                    <div className="stat earnings">
                      <DollarSign size={14} />
                      <span>{formatCurrency(earnings.totalEarned)}</span>
                    </div>
                  </div>
                  
                  <div className="article-meta">
                    <span className="category" style={{ color: getCategoryColor(article.category) }}>
                      {getCategoryLabel(article.category)}
                    </span>
                    <span className="date">{formatDate(article.createdAt)}</span>
                  </div>

                  {article.earnings?.isPaid ? (
                    <span className="payment-status paid">Paid</span>
                  ) : (
                    <span className="payment-status pending">Pending</span>
                  )}
                  
                  <div className="article-actions">
                    <button onClick={() => onEdit(article)} className="edit-button">
                      <Edit2 size={14} />
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <PenTool size={48} />
            <h3>No Articles Yet</h3>
            <p>Start creating engaging content to begin earning</p>
            <div className="earning-potential">
              <p className="earning-info">
                💡 <strong>New Requirements:</strong> P100 minimum + 20,000 engagement for cashout
              </p>
              <p className="earning-info">
                💰 Potential: <strong>10,000 views + engagement = {formatCurrency(100)}+</strong>
              </p>
            </div>
            <button className="create-button primary" onClick={onCreateNew}>
              <Plus size={16} />
              Create Your First Article
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// UPDATED: Enhanced Earnings View Component with Cashout Request
const EnhancedEarningsView = ({ 
  stats, 
  articles, 
  onBack, 
  formatCurrency, 
  formatNumber, 
  formatDate, 
  calculateArticleEarnings, 
  calculateArticleEngagement,
  checkCashoutEligibility,
  earningsConfig, 
  categories 
}) => {
  const publishedArticles = articles.filter(article => article.status === 'published');
  const cashoutInfo = checkCashoutEligibility();
  const [showCashoutForm, setShowCashoutForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentDetails, setPaymentDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    mobileWallet: '',
    walletProvider: 'orange_money'
  });

  const handleCashoutRequest = async () => {
    try {
      // Mock cashout request - replace with actual API call
      const requestData = {
        amount: cashoutInfo.unpaidEarnings,
        paymentMethod,
        paymentDetails,
        requestDate: new Date().toISOString(),
        userId: 'current-user-id'
      };
      
      console.log('Cashout request:', requestData);
      
      // Show success message
      alert(`Cashout request for ${formatCurrency(cashoutInfo.unpaidEarnings)} submitted successfully! You will receive your payment within 2-3 business days.`);
      setShowCashoutForm(false);
      
      // In real implementation, you would refresh the earnings data
    } catch (error) {
      console.error('Cashout request failed:', error);
      alert('Failed to submit cashout request. Please try again.');
    }
  };

  return (
    <div className="earnings-view">
      <div className="earnings-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        
        <div className="header-content">
          <h2>Enhanced Earnings & Engagement Overview</h2>
          <p>Track your article performance, revenue, and engagement metrics</p>
        </div>
      </div>

      {/* Enhanced Earnings Summary Cards with Engagement */}
      <div className="earnings-summary">
        <div className="earnings-card total">
          <div className="earnings-card-icon">
            <Wallet size={28} />
          </div>
          <div className="earnings-card-content">
            <h3>{formatCurrency(stats.totalEarnings)}</h3>
            <p>Total Earnings</p>
            <span className="earnings-note">From {formatNumber(stats.totalViews)} views</span>
          </div>
        </div>

        <div className={`earnings-card pending ${cashoutInfo.eligible ? 'ready' : 'not-ready'}`}>
          <div className="earnings-card-icon">
            {cashoutInfo.eligible ? <CheckCircle size={28} /> : <Clock size={28} />}
          </div>
          <div className="earnings-card-content">
            <h3>{formatCurrency(cashoutInfo.unpaidEarnings)}</h3>
            <p>Pending Cashout</p>
            <span className="earnings-note">
              {cashoutInfo.eligible ? 'Ready for payout!' : 
                `Need ${formatCurrency(Math.max(0, earningsConfig.minimumPayout - cashoutInfo.unpaidEarnings))} more earnings + ${formatNumber(Math.max(0, earningsConfig.minimumEngagementForCashout - cashoutInfo.totalEngagement))} more engagement`
              }
            </span>
          </div>
        </div>

        <div className="earnings-card engagement">
          <div className="earnings-card-icon">
            <Activity size={28} />
          </div>
          <div className="earnings-card-content">
            <h3>{formatNumber(stats.totalEngagement)}</h3>
            <p>Total Engagement</p>
            <span className="earnings-note">
              {stats.engagementRate}% engagement rate
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Cashout Requirements Panel */}
      <div className="cashout-requirements-panel">
        <div className="panel-header">
          <h3>Cashout Requirements Status</h3>
          {cashoutInfo.eligible && (
            <button 
              className="request-cashout-button primary"
              onClick={() => setShowCashoutForm(true)}
            >
              <Send size={16} />
              Request Cashout
            </button>
          )}
        </div>
        
        <div className="requirements-detailed">
          <div className="requirement-section">
            <h4>💰 Minimum Earnings: P{earningsConfig.minimumPayout}</h4>
            <div className="requirement-status">
              <div className="progress-bar-large">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.min(100, (cashoutInfo.unpaidEarnings / earningsConfig.minimumPayout) * 100)}%` }}
                ></div>
              </div>
              <div className="progress-labels">
                <span>{formatCurrency(cashoutInfo.unpaidEarnings)}</span>
                <span className={cashoutInfo.requirements.minimumEarnings.met ? 'met' : 'pending'}>
                  {cashoutInfo.requirements.minimumEarnings.met ? '✅ Met' : `Need ${formatCurrency(earningsConfig.minimumPayout - cashoutInfo.unpaidEarnings)} more`}
                </span>
              </div>
            </div>
          </div>

          <div className="requirement-section">
            <h4>⚡ Minimum Engagement: {formatNumber(earningsConfig.minimumEngagementForCashout)}</h4>
            <div className="requirement-status">
              <div className="progress-bar-large">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.min(100, (cashoutInfo.totalEngagement / earningsConfig.minimumEngagementForCashout) * 100)}%` }}
                ></div>
              </div>
              <div className="progress-labels">
                <span>{formatNumber(cashoutInfo.totalEngagement)}</span>
                <span className={cashoutInfo.requirements.minimumEngagement.met ? 'met' : 'pending'}>
                  {cashoutInfo.requirements.minimumEngagement.met ? '✅ Met' : `Need ${formatNumber(earningsConfig.minimumEngagementForCashout - cashoutInfo.totalEngagement)} more`}
                </span>
              </div>
            </div>
          </div>

          <div className="requirement-section">
            <h4>📊 Engagement to Earnings Ratio</h4>
            <p className="ratio-explanation">
              Required: {earningsConfig.engagementToEarningsRatio} engagement points per P1 earned
            </p>
            <div className="requirement-status">
              <div className="progress-bar-large">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.min(100, (cashoutInfo.totalEngagement / (cashoutInfo.unpaidEarnings * earningsConfig.engagementToEarningsRatio)) * 100)}%` }}
                ></div>
              </div>
              <div className="progress-labels">
                <span>Current ratio: {cashoutInfo.unpaidEarnings > 0 ? Math.round(cashoutInfo.totalEngagement / cashoutInfo.unpaidEarnings) : 0}:1</span>
                <span className={cashoutInfo.requirements.engagementRatio.met ? 'met' : 'pending'}>
                  {cashoutInfo.requirements.engagementRatio.met ? '✅ Met' : `Need ${formatNumber(cashoutInfo.requirements.engagementRatio.required - cashoutInfo.totalEngagement)} more`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Cashout Request Form Modal */}
      {showCashoutForm && (
        <div className="modal-overlay">
          <div className="cashout-form-modal">
            <div className="modal-header">
              <h3>Request Cashout</h3>
              <button 
                className="close-button"
                onClick={() => setShowCashoutForm(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="cashout-summary">
                <p><strong>Amount to be paid:</strong> {formatCurrency(cashoutInfo.unpaidEarnings)}</p>
                <p><small>Processing time: 2-3 business days</small></p>
              </div>

              <div className="payment-method-selection">
                <h4>Select Payment Method:</h4>
                
                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>Bank Transfer</span>
                  </label>
                  
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="mobile_wallet"
                      checked={paymentMethod === 'mobile_wallet'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>Mobile Wallet</span>
                  </label>
                </div>
              </div>

              {paymentMethod === 'bank_transfer' && (
                <div className="payment-details">
                  <h4>Bank Details:</h4>
                  <div className="form-group">
                    <label>Bank Name</label>
                    <select
                      value={paymentDetails.bankName}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, bankName: e.target.value }))}
                    >
                      <option value="">Select Bank</option>
                      <option value="fnb">First National Bank (FNB)</option>
                      <option value="standard_bank">Standard Bank</option>
                      <option value="absa">ABSA Bank</option>
                      <option value="stanchart">Standard Chartered</option>
                      <option value="bank_gaborone">Bank of Gaborone</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Account Number</label>
                    <input
                      type="text"
                      placeholder="Enter account number"
                      value={paymentDetails.accountNumber}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="Enter account holder name"
                      value={paymentDetails.accountName}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, accountName: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'mobile_wallet' && (
                <div className="payment-details">
                  <h4>Mobile Wallet Details:</h4>
                  <div className="form-group">
                    <label>Wallet Provider</label>
                    <select
                      value={paymentDetails.walletProvider}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, walletProvider: e.target.value }))}
                    >
                      <option value="orange_money">Orange Money</option>
                      <option value="mascom_myzer">Mascom MyZer</option>
                      <option value="btc_smega">BTC Smega</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="e.g., 76123456"
                      value={paymentDetails.mobileWallet}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, mobileWallet: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowCashoutForm(false)}
              >
                Cancel
              </button>
              <button 
                className="submit-button primary"
                onClick={handleCashoutRequest}
                disabled={
                  (paymentMethod === 'bank_transfer' && (!paymentDetails.bankName || !paymentDetails.accountNumber || !paymentDetails.accountName)) ||
                  (paymentMethod === 'mobile_wallet' && (!paymentDetails.mobileWallet || !paymentDetails.walletProvider))
                }
              >
                <Send size={16} />
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rest of the enhanced earnings view components would continue here... */}
      {/* Article earnings breakdown, rates information, etc. */}
      
    </div>
  );
};

// Enhanced List View Component
const EnhancedListView = ({ 
  articles, 
  searchTerm, 
  setSearchTerm, 
  selectedStatus, 
  setSelectedStatus,
  selectedCategory,
  setSelectedCategory,
  categories,
  onCreateNew,
  onEdit,
  onDelete,
  onBack,
  formatDate,
  formatNumber,
  formatCurrency,
  getCategoryColor,
  getCategoryLabel,
  calculateArticleEarnings,
  calculateArticleEngagement
}) => {
  return (
    <div className="list-view">
      <div className="list-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        
        <div className="header-content">
          <h2>All Articles</h2>
          <p>Manage and organize your published content</p>
        </div>
        
        <button className="create-button primary" onClick={onCreateNew}>
          <Plus size={16} />
          New Article
        </button>
      </div>

      {/* Filters */}
      <div className="list-filters">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Enhanced Articles List with Engagement Column */}
      <div className="articles-list">
        {articles.length > 0 ? (
          <div className="articles-grid enhanced">
            {articles.map(article => {
              const earnings = calculateArticleEarnings(article);
              const engagement = calculateArticleEngagement(article);
              
              return (
                <div key={article.id} className="article-card enhanced">
                  <div className="article-header">
                    <h4>{article.title}</h4>
                    <div className="article-status">
                      {article.status === 'published' ? (
                        <span className="status-badge published">Published</span>
                      ) : (
                        <span className="status-badge draft">Draft</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="article-stats enhanced">
                    <div className="stat">
                      <Eye size={14} />
                      <span>{formatNumber(earnings.breakdown.views)} views</span>
                    </div>
                    <div className="stat">
                      <Activity size={14} />
                      <span>{formatNumber(engagement)} engagement</span>
                    </div>
                    <div className="stat earnings">
                      <DollarSign size={14} />
                      <span>{formatCurrency(earnings.totalEarned)}</span>
                    </div>
                    {earnings.engagementBonus > 0 && (
                      <div className="stat bonus">
                        <Zap size={14} />
                        <span>+{formatCurrency(earnings.engagementBonus)} bonus</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="article-meta">
                    <span className="category" style={{ color: getCategoryColor(article.category) }}>
                      {getCategoryLabel(article.category)}
                    </span>
                    <span className="date">{formatDate(article.createdAt)}</span>
                    {article.isPremium && <span className="premium-tag">Premium</span>}
                  </div>

                  <div className="payment-status">
                    {article.earnings?.isPaid ? (
                      <span className="payment-status paid">Paid</span>
                    ) : (
                      <span className="payment-status pending">Pending</span>
                    )}
                  </div>
                  
                  <div className="article-actions">
                    <button onClick={() => onEdit(article)} className="edit-button">
                      <Edit2 size={14} />
                      Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <PenTool size={48} />
            <h3>No Articles Yet</h3>
            <p>Start creating engaging content to begin earning</p>
            <div className="earning-potential">
              <p className="earning-info">
                💡 <strong>New System:</strong> P100 minimum + 20,000 engagement required for cashout
              </p>
              <p className="earning-info">
                📊 <strong>Engagement Formula:</strong> Views + Likes×3 + Comments×5 + Shares×8
              </p>
            </div>
            <button className="create-button primary" onClick={onCreateNew}>
              <Plus size={16} />
              Create Your First Article
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Editor View Component with Premium Options
const EnhancedEditorView = ({ 
  articleForm, 
  setArticleForm, 
  formErrors, 
  saving, 
  editingArticle,
  categories,
  earningsConfig,
  onSave,
  onCancel,
  onImageUpload,
  addTag,
  removeTag,
  fileInputRef
}) => {
  const [tagInput, setTagInput] = useState('');

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim().toLowerCase());
      setTagInput('');
    }
  };

  return (
    <div className="editor-view">
      <div className="editor-header">
        <button className="back-button" onClick={onCancel}>
          ← Back
        </button>
        
        <h2>{editingArticle ? 'Edit Article' : 'Create New Article'}</h2>
        
        <div className="editor-actions">
          <button 
            className="save-button secondary" 
            onClick={() => onSave(false)}
            disabled={saving}
          >
            {saving ? <Loader size={16} className="spin" /> : <Save size={16} />}
            Save Draft
          </button>
          <button 
            className="publish-button primary" 
            onClick={() => onSave(true)}
            disabled={saving}
          >
            {saving ? <Loader size={16} className="spin" /> : <Globe size={16} />}
            Publish
          </button>
        </div>
      </div>

      {formErrors.general && (
        <div className="error-message">
          <AlertCircle size={16} />
          {formErrors.general}
        </div>
      )}

      <div className="editor-content">
        <div className="editor-main">
          {/* Title */}
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={articleForm.title}
              onChange={(e) => setArticleForm(prev => ({ ...prev, title: e.target.value }))}
              className={formErrors.title ? 'error' : ''}
              placeholder="Enter an engaging title..."
            />
            {formErrors.title && <span className="error-text">{formErrors.title}</span>}
          </div>

          {/* Subtitle */}
          <div className="form-group">
            <label>Subtitle</label>
            <input
              type="text"
              value={articleForm.subtitle}
              onChange={(e) => setArticleForm(prev => ({ ...prev, subtitle: e.target.value }))}
              className={formErrors.subtitle ? 'error' : ''}
              placeholder="Add a compelling subtitle..."
            />
            {formErrors.subtitle && <span className="error-text">{formErrors.subtitle}</span>}
          </div>

          {/* Content */}
          <div className="form-group">
            <label>Content *</label>
            <textarea
              value={articleForm.content}
              onChange={(e) => setArticleForm(prev => ({ ...prev, content: e.target.value }))}
              className={`content-editor ${formErrors.content ? 'error' : ''}`}
              placeholder="Write your article content here..."
              rows={20}
            />
            {formErrors.content && <span className="error-text">{formErrors.content}</span>}
          </div>

          {/* Author Notes */}
          <div className="form-group">
            <label>Author Notes (Internal)</label>
            <textarea
              value={articleForm.authorNotes}
              onChange={(e) => setArticleForm(prev => ({ ...prev, authorNotes: e.target.value }))}
              placeholder="Add any internal notes or reminders..."
              rows={3}
            />
          </div>
        </div>

        <div className="editor-sidebar">
          {/* Status & Publishing */}
          <div className="sidebar-section">
            <h3>Publishing</h3>
            
            <div className="form-group">
              <label>Status</label>
              <select 
                value={articleForm.status}
                onChange={(e) => setArticleForm(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="form-group">
              <label>Publish Date</label>
              <input
                type="datetime-local"
                value={articleForm.publishDate || ''}
                onChange={(e) => setArticleForm(prev => ({ ...prev, publishDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Category */}
          <div className="sidebar-section">
            <h3>Category</h3>
            <select 
              value={articleForm.category}
              onChange={(e) => setArticleForm(prev => ({ ...prev, category: e.target.value }))}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label} ({category.multiplier}x)
                </option>
              ))}
            </select>
            <small>Higher multipliers = better earnings</small>
          </div>

          {/* UPDATED: Premium Content & Earnings with Engagement */}
          <div className="sidebar-section">
            <h3>Monetization & Engagement</h3>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={articleForm.isPremium}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, isPremium: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Premium Content (1.5x earnings)
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={articleForm.earningsEnabled}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, earningsEnabled: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Enable Earnings
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={articleForm.trackEngagement}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, trackEngagement: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Track Engagement
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={articleForm.allowComments}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, allowComments: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Allow Comments
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={articleForm.allowSharing}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, allowSharing: e.target.checked }))}
                />
                <span className="checkmark"></span>
                Allow Sharing
              </label>
            </div>

            <div className="earnings-preview">
              <h4>Potential Earnings:</h4>
              <div className="earning-tiers">
                <div className="tier">1k views = P{(1000 * 0.01 * (categories.find(c => c.id === articleForm.category)?.multiplier || 1) * (articleForm.isPremium ? 1.5 : 1)).toFixed(2)}</div>
                <div className="tier">10k views = P{(10000 * 0.01 * (categories.find(c => c.id === articleForm.category)?.multiplier || 1) * (articleForm.isPremium ? 1.5 : 1) + 75).toFixed(2)}</div>
                <div className="tier">25k views = P{(25000 * 0.01 * (categories.find(c => c.id === articleForm.category)?.multiplier || 1) * (articleForm.isPremium ? 1.5 : 1) + 200).toFixed(2)}</div>
              </div>
              
              <div className="engagement-info">
                <h5>Engagement Bonus Potential:</h5>
                <small>20k engagement = +P200 bonus</small>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="sidebar-section">
            <h3>Featured Image</h3>
            {articleForm.featuredImage ? (
              <div className="image-preview">
                <img src={articleForm.featuredImage} alt="Featured" />
                <button 
                  className="remove-image"
                  onClick={() => setArticleForm(prev => ({ ...prev, featuredImage: null }))}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button 
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={16} />
                Upload Image
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Tags */}
          <div className="sidebar-section">
            <h3>Tags</h3>
            <div className="tags-container">
              {articleForm.tags.map(tag => (
                <span key={tag} className="tag">
                  {tag}
                  <button onClick={() => removeTag(tag)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Add tags (press Enter)"
              className="tag-input"
            />
          </div>

          {/* SEO */}
          <div className="sidebar-section">
            <h3>SEO</h3>
            
            <div className="form-group">
              <label>Meta Title</label>
              <input
                type="text"
                value={articleForm.metaTitle}
                onChange={(e) => setArticleForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                placeholder="SEO title..."
                maxLength={60}
              />
              <small>{articleForm.metaTitle.length}/60 characters</small>
            </div>

            <div className="form-group">
              <label>Meta Description</label>
              <textarea
                value={articleForm.metaDescription}
                onChange={(e) => setArticleForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                placeholder="SEO description..."
                rows={3}
                maxLength={160}
              />
              <small>{articleForm.metaDescription.length}/160 characters</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleManagement;
