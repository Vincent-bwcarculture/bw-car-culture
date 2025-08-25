// client/src/components/profile/ArticleManagement.js
// ENHANCED VERSION - Complete article management dashboard with earnings tracking

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
  DollarSign,  // NEW: For earnings
  Wallet,      // NEW: For earnings
  CreditCard,  // NEW: For payments
  Target       // NEW: For goals
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
  
  // Enhanced stats with earnings
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    totalViews: 0,
    totalShares: 0,
    totalLikes: 0,
    // NEW: Earnings tracking
    totalEarnings: 0,
    thisMonthEarnings: 0,
    pendingEarnings: 0,
    averageEarningsPerView: 0,
    topEarningArticle: null
  });

  // NEW: Earnings configuration
  const earningsConfig = {
    ratePerView: 0.01,        // P0.01 per view (P100 for 10,000 views)
    minimumPayout: 50,        // Minimum P50 before payout
    bonusThresholds: {
      1000: 5,   // P5 bonus for 1k+ views
      5000: 25,  // P25 bonus for 5k+ views  
      10000: 75, // P75 bonus for 10k+ views
      25000: 200 // P200 bonus for 25k+ views
    },
    premiumMultiplier: 1.5,   // 50% more for premium content
    weekendBonus: 1.2         // 20% weekend bonus
  };

  // Article form states (existing)
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
    isPremium: false,  // NEW: Premium content flag
    earningsEnabled: true  // NEW: Enable/disable earnings for article
  });

  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Categories for articles (existing)
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

  useEffect(() => {
    loadArticles();
    loadStats();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      // Enhanced mock data with earnings information
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
          shares: 32,
          featuredImage: null,
          isPremium: true,
          earningsEnabled: true,
          // NEW: Earnings data
          earnings: {
            totalEarned: 187.50,
            viewsEarnings: 125.00,
            bonusEarnings: 62.50,
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
          shares: 15,
          featuredImage: null,
          isPremium: false,
          earningsEnabled: true,
          // NEW: Earnings data
          earnings: {
            totalEarned: 131.25,
            viewsEarnings: 87.50,
            bonusEarnings: 43.75,
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
          shares: 8,
          featuredImage: null,
          isPremium: false,
          earningsEnabled: true,
          // NEW: Earnings data
          earnings: {
            totalEarned: 50.40,
            viewsEarnings: 42.00,
            bonusEarnings: 8.40,
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
          shares: 0,
          featuredImage: null,
          isPremium: false,
          earningsEnabled: true,
          // NEW: Earnings data
          earnings: {
            totalEarned: 0,
            viewsEarnings: 0,
            bonusEarnings: 0,
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
      // Enhanced mock stats with earnings
      const totalViews = 25450;
      const totalEarnings = 369.15;
      const thisMonthViews = 15800;
      const thisMonthEarnings = 231.75;
      
      setStats({
        totalArticles: 18,
        publishedArticles: 15,
        draftArticles: 3,
        totalViews: totalViews,
        totalShares: 234,
        totalLikes: 1890,
        // NEW: Enhanced earnings stats
        totalEarnings: totalEarnings,
        thisMonthEarnings: thisMonthEarnings,
        pendingEarnings: 187.40, // Unpaid earnings
        averageEarningsPerView: totalEarnings / totalViews,
        topEarningArticle: {
          title: 'The Future of Electric Vehicles in Botswana',
          earnings: 187.50,
          views: 12500
        },
        projectedMonthlyEarnings: calculateProjectedEarnings(thisMonthEarnings, new Date().getDate())
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // NEW: Calculate earnings for an article
  const calculateArticleEarnings = (article) => {
    if (!article.earningsEnabled || article.status !== 'published') {
      return { totalEarned: 0, breakdown: { base: 0, bonus: 0, premium: 0 } };
    }

    const baseEarnings = article.views * earningsConfig.ratePerView;
    let bonusEarnings = 0;
    
    // Apply view-based bonuses
    Object.entries(earningsConfig.bonusThresholds).forEach(([threshold, bonus]) => {
      if (article.views >= parseInt(threshold)) {
        bonusEarnings = Math.max(bonusEarnings, bonus);
      }
    });

    // Apply category multiplier
    const category = categories.find(cat => cat.id === article.category);
    const categoryMultiplier = category ? category.multiplier : 1;
    
    // Apply premium multiplier
    const premiumMultiplier = article.isPremium ? earningsConfig.premiumMultiplier : 1;
    
    const totalMultiplier = categoryMultiplier * premiumMultiplier;
    const finalEarnings = (baseEarnings * totalMultiplier) + bonusEarnings;

    return {
      totalEarned: parseFloat(finalEarnings.toFixed(2)),
      breakdown: {
        base: parseFloat(baseEarnings.toFixed(2)),
        bonus: bonusEarnings,
        premium: parseFloat(((baseEarnings * (premiumMultiplier - 1))).toFixed(2)),
        category: parseFloat(((baseEarnings * (categoryMultiplier - 1))).toFixed(2))
      }
    };
  };

  // NEW: Calculate projected earnings
  const calculateProjectedEarnings = (currentMonthEarnings, dayOfMonth) => {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dailyAverage = currentMonthEarnings / dayOfMonth;
    return parseFloat((dailyAverage * daysInMonth).toFixed(2));
  };

  // NEW: Format currency (Botswana Pula)
  const formatCurrency = (amount) => {
    return `P${parseFloat(amount).toFixed(2)}`;
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
      earningsEnabled: true
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
      earningsEnabled: article.earningsEnabled !== false
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
          shares: 0,
          earnings: {
            totalEarned: 0,
            viewsEarnings: 0,
            bonusEarnings: 0,
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getCategoryColor = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : '#6c757d';
  };

  const getCategoryLabel = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.label : categoryId;
  };

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
        <DashboardView 
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
          earningsConfig={earningsConfig}
        />
      )}

      {activeView === 'earnings' && (
        <EarningsView
          stats={stats}
          articles={articles}
          onBack={() => setActiveView('dashboard')}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
          formatDate={formatDate}
          calculateArticleEarnings={calculateArticleEarnings}
          earningsConfig={earningsConfig}
          categories={categories}
        />
      )}

      {activeView === 'list' && (
        <ListView
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
        />
      )}

      {activeView === 'editor' && (
        <EditorView
          articleForm={articleForm}
          setArticleForm={setArticleForm}
          formErrors={formErrors}
          saving={saving}
          editingArticle={editingArticle}
          categories={categories}
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

// Enhanced Dashboard View Component with Earnings
const DashboardView = ({ stats, articles, onCreateNew, onViewAll, onViewEarnings, onEdit, categories, formatNumber, formatCurrency, calculateArticleEarnings, earningsConfig }) => {
  const recentArticles = articles.slice(0, 3);

  return (
    <div className="dashboard-view">
      <div className="dashboard-header">
        <div className="header-content">
          <h2>Articles Dashboard</h2>
          <p>Manage your articles, track performance, and monitor your earnings</p>
        </div>
        <button className="create-button primary" onClick={onCreateNew}>
          <Plus size={16} />
          New Article
        </button>
      </div>

      {/* Enhanced Stats Cards with Earnings */}
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

        {/* NEW: Total Earnings Card */}
        <div className="stat-card earnings-card">
          <div className="stat-icon earnings">
            <Wallet size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{formatCurrency(stats.totalEarnings)}</div>
            <div className="stat-label">Total Earnings</div>
          </div>
        </div>

        {/* NEW: This Month Earnings Card */}
        <div className="stat-card">
          <div className="stat-icon monthly-earnings">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{formatCurrency(stats.thisMonthEarnings)}</div>
            <div className="stat-label">This Month</div>
          </div>
        </div>

        {/* NEW: Pending Earnings Card */}
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{formatCurrency(stats.pendingEarnings)}</div>
            <div className="stat-label">Pending Payout</div>
          </div>
        </div>
      </div>

      {/* NEW: Earnings Overview Section */}
      <div className="earnings-overview">
        <div className="section-header">
          <h3>Earnings Overview</h3>
          <button className="view-earnings-button" onClick={onViewEarnings}>
            View Detailed Earnings
            <ExternalLink size={14} />
          </button>
        </div>

        <div className="earnings-grid">
          {/* Earnings Rate Info */}
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
            </div>
          </div>

          {/* Top Earning Article */}
          {stats.topEarningArticle && (
            <div className="earnings-info-card">
              <div className="earnings-info-header">
                <TrendingUp size={20} />
                <h4>Top Earning Article</h4>
              </div>
              <div className="top-article-info">
                <p className="article-title">{stats.topEarningArticle.title}</p>
                <div className="article-stats">
                  <span>{formatNumber(stats.topEarningArticle.views)} views</span>
                  <span className="earnings-amount">{formatCurrency(stats.topEarningArticle.earnings)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Projected Monthly Earnings */}
          <div className="earnings-info-card">
            <div className="earnings-info-header">
              <BarChart3 size={20} />
              <h4>Monthly Projection</h4>
            </div>
            <div className="projection-info">
              <div className="projection-item">
                <span className="projection-label">Current:</span>
                <span className="projection-value">{formatCurrency(stats.thisMonthEarnings)}</span>
              </div>
              <div className="projection-item">
                <span className="projection-label">Projected:</span>
                <span className="projection-value projected">{formatCurrency(stats.projectedMonthlyEarnings)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Articles with Earnings */}
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
              return (
                <div key={article.id} className="article-card">
                  <div className="article-header">
                    <h4>{article.title}</h4>
                    <div className="article-status">
                      {article.status === 'published' ? (
                        <span className="status published">
                          <CheckCircle size={14} />
                          Published
                        </span>
                      ) : (
                        <span className="status draft">
                          <Clock size={14} />
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="article-subtitle">{article.subtitle}</p>
                  
                  <div className="article-meta">
                    <span className="category" style={{ color: categories.find(c => c.id === article.category)?.color }}>
                      {categories.find(c => c.id === article.category)?.label}
                    </span>
                    <span className="date">{new Date(article.updatedAt).toLocaleDateString()}</span>
                    {article.isPremium && (
                      <span className="premium-badge">Premium</span>
                    )}
                  </div>
                  
                  <div className="article-stats">
                    <span><Eye size={12} /> {formatNumber(article.views)}</span>
                    <span><Heart size={12} /> {formatNumber(article.likes)}</span>
                    <span><Share2 size={12} /> {formatNumber(article.shares)}</span>
                  </div>

                  {/* NEW: Earnings Display */}
                  <div className="article-earnings">
                    <div className="earnings-row">
                      <span className="earnings-label">Earned:</span>
                      <span className="earnings-amount">{formatCurrency(earnings.totalEarned)}</span>
                    </div>
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
                💡 Potential: <strong>10,000 views = {formatCurrency(100)}</strong>
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

// NEW: Dedicated Earnings View Component
const EarningsView = ({ stats, articles, onBack, formatCurrency, formatNumber, formatDate, calculateArticleEarnings, earningsConfig, categories }) => {
  const publishedArticles = articles.filter(article => article.status === 'published');
  const unpaidEarnings = publishedArticles
    .filter(article => article.earnings && !article.earnings.isPaid)
    .reduce((total, article) => total + (article.earnings.totalEarned || 0), 0);

  return (
    <div className="earnings-view">
      <div className="earnings-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        
        <div className="header-content">
          <h2>Earnings Overview</h2>
          <p>Track your article performance and revenue</p>
        </div>
      </div>

      {/* Earnings Summary Cards */}
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

        <div className="earnings-card pending">
          <div className="earnings-card-icon">
            <Clock size={28} />
          </div>
          <div className="earnings-card-content">
            <h3>{formatCurrency(unpaidEarnings)}</h3>
            <p>Pending Payout</p>
            <span className="earnings-note">
              {unpaidEarnings >= earningsConfig.minimumPayout ? 
                'Ready for payout' : 
                `${formatCurrency(earningsConfig.minimumPayout - unpaidEarnings)} to minimum`
              }
            </span>
          </div>
        </div>

        <div className="earnings-card monthly">
          <div className="earnings-card-icon">
            <TrendingUp size={28} />
          </div>
          <div className="earnings-card-content">
            <h3>{formatCurrency(stats.thisMonthEarnings)}</h3>
            <p>This Month</p>
            <span className="earnings-note">
              Projected: {formatCurrency(stats.projectedMonthlyEarnings)}
            </span>
          </div>
        </div>
      </div>

      {/* Earnings Rate Information */}
      <div className="earnings-rates">
        <h3>Your Earning Rates</h3>
        <div className="rates-grid">
          <div className="rate-card">
            <h4>Base Rate</h4>
            <div className="rate-value">{formatCurrency(earningsConfig.ratePerView)} per view</div>
            <p>Standard rate for all articles</p>
          </div>

          <div className="rate-card">
            <h4>Category Multipliers</h4>
            <div className="multipliers-list">
              {categories.map(category => (
                <div key={category.id} className="multiplier-item">
                  <span className="category-name" style={{ color: category.color }}>
                    {category.label}
                  </span>
                  <span className="multiplier-value">{category.multiplier}x</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rate-card">
            <h4>Bonus Tiers</h4>
            <div className="bonus-tiers">
              {Object.entries(earningsConfig.bonusThresholds).map(([views, bonus]) => (
                <div key={views} className="tier-item">
                  <span className="tier-views">{formatNumber(parseInt(views))}+ views</span>
                  <span className="tier-bonus">+{formatCurrency(bonus)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rate-card">
            <h4>Premium Content</h4>
            <div className="premium-info">
              <div className="premium-multiplier">
                {earningsConfig.premiumMultiplier}x base rate
              </div>
              <p>Mark articles as premium for higher earnings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Article Earnings Breakdown */}
      <div className="article-earnings-list">
        <h3>Article Earnings Breakdown</h3>
        
        <div className="earnings-table">
          <div className="earnings-table-header">
            <div className="col-title">Article</div>
            <div className="col-views">Views</div>
            <div className="col-category">Category</div>
            <div className="col-earnings">Earnings</div>
            <div className="col-status">Status</div>
          </div>

          {publishedArticles.map(article => {
            const earnings = calculateArticleEarnings(article);
            const category = categories.find(c => c.id === article.category);
            
            return (
              <div key={article.id} className="earnings-table-row">
                <div className="col-title">
                  <div className="article-info">
                    <h4>{article.title}</h4>
                    <span className="publish-date">{formatDate(article.publishDate)}</span>
                    {article.isPremium && <span className="premium-tag">Premium</span>}
                  </div>
                </div>
                
                <div className="col-views">
                  {formatNumber(article.views)}
                </div>
                
                <div className="col-category">
                  <span 
                    className="category-badge"
                    style={{ 
                      backgroundColor: category?.color + '20', 
                      color: category?.color 
                    }}
                  >
                    {category?.label}
                  </span>
                </div>
                
                <div className="col-earnings">
                  <div className="earnings-breakdown">
                    <div className="total-earnings">
                      {formatCurrency(earnings.totalEarned)}
                    </div>
                    {earnings.breakdown.bonus > 0 && (
                      <div className="bonus-earnings">
                        +{formatCurrency(earnings.breakdown.bonus)} bonus
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="col-status">
                  {article.earnings?.isPaid ? (
                    <span className="status-badge paid">Paid</span>
                  ) : (
                    <span className="status-badge pending">Pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payout Information */}
      <div className="payout-info">
        <div className="payout-card">
          <h3>Payout Information</h3>
          <div className="payout-details">
            <div className="payout-item">
              <span className="payout-label">Minimum Payout:</span>
              <span className="payout-value">{formatCurrency(earningsConfig.minimumPayout)}</span>
            </div>
            <div className="payout-item">
              <span className="payout-label">Current Pending:</span>
              <span className="payout-value">{formatCurrency(unpaidEarnings)}</span>
            </div>
            <div className="payout-item">
              <span className="payout-label">Next Payout Date:</span>
              <span className="payout-value">End of month</span>
            </div>
          </div>
          
          {unpaidEarnings >= earningsConfig.minimumPayout ? (
            <div className="payout-ready">
              <CheckCircle size={16} />
              <span>Ready for payout!</span>
            </div>
          ) : (
            <div className="payout-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${(unpaidEarnings / earningsConfig.minimumPayout) * 100}%` 
                  }}
                ></div>
              </div>
              <span className="progress-text">
                {formatCurrency(earningsConfig.minimumPayout - unpaidEarnings)} more needed
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced List View Component with Earnings
const ListView = ({ 
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
  calculateArticleEarnings
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

      {/* Articles List with Earnings */}
      <div className="articles-list">
        {articles.length > 0 ? (
          articles.map(article => {
            const earnings = calculateArticleEarnings(article);
            return (
              <div key={article.id} className="list-item">
                <div className="item-content">
                  <div className="item-header">
                    <h3>{article.title}</h3>
                    <div className="item-status">
                      {article.status === 'published' ? (
                        <span className="status published">
                          <CheckCircle size={14} />
                          Published
                        </span>
                      ) : (
                        <span className="status draft">
                          <Clock size={14} />
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="item-subtitle">{article.subtitle}</p>
                  
                  <div className="item-meta">
                    <span 
                      className="category-badge" 
                      style={{ backgroundColor: getCategoryColor(article.category) + '20', color: getCategoryColor(article.category) }}
                    >
                      {getCategoryLabel(article.category)}
                    </span>
                    <span className="meta-text">Updated: {formatDate(article.updatedAt)}</span>
                    {article.publishDate && (
                      <span className="meta-text">Published: {formatDate(article.publishDate)}</span>
                    )}
                    {article.isPremium && (
                      <span className="premium-badge">Premium</span>
                    )}
                  </div>
                  
                  <div className="item-stats">
                    <span><Eye size={12} /> {formatNumber(article.views)}</span>
                    <span><Heart size={12} /> {formatNumber(article.likes)}</span>
                    <span><Share2 size={12} /> {formatNumber(article.shares)}</span>
                    {/* NEW: Earnings in list */}
                    <span className="earnings-stat">
                      <DollarSign size={12} /> {formatCurrency(earnings.totalEarned)}
                    </span>
                  </div>
                </div>
                
                <div className="item-actions">
                  <button onClick={() => onEdit(article)} className="action-button edit">
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button onClick={() => onDelete(article.id)} className="action-button delete">
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <Search size={48} />
            <h3>No Articles Found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Editor View Component with Premium Options
const EditorView = ({ 
  articleForm, 
  setArticleForm, 
  formErrors, 
  saving, 
  editingArticle,
  categories,
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

          {/* NEW: Premium Content & Earnings */}
          <div className="sidebar-section">
            <h3>Monetization</h3>
            
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

            <div className="earnings-preview">
              <h4>Potential Earnings:</h4>
              <div className="earning-tiers">
                <div className="tier">1k views = P{(1000 * 0.01 * (categories.find(c => c.id === articleForm.category)?.multiplier || 1) * (articleForm.isPremium ? 1.5 : 1)).toFixed(2)}</div>
                <div className="tier">10k views = P{(10000 * 0.01 * (categories.find(c => c.id === articleForm.category)?.multiplier || 1) * (articleForm.isPremium ? 1.5 : 1) + 75).toFixed(2)}</div>
                <div className="tier">25k views = P{(25000 * 0.01 * (categories.find(c => c.id === articleForm.category)?.multiplier || 1) * (articleForm.isPremium ? 1.5 : 1) + 200).toFixed(2)}</div>
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
