// client/src/components/profile/ArticleManagement.js
// Complete article management dashboard for journalists

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
  Globe
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
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    totalViews: 0,
    totalShares: 0,
    totalLikes: 0
  });

  // Article form states
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
    authorNotes: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Categories for articles
  const categories = [
    { id: 'news', label: 'Breaking News', color: '#dc3545' },
    { id: 'reviews', label: 'Vehicle Reviews', color: '#28a745' },
    { id: 'industry', label: 'Industry Analysis', color: '#007bff' },
    { id: 'events', label: 'Events & Shows', color: '#ffc107' },
    { id: 'technology', label: 'Automotive Tech', color: '#6f42c1' },
    { id: 'lifestyle', label: 'Car Culture', color: '#fd7e14' },
    { id: 'maintenance', label: 'Tips & Maintenance', color: '#20c997' },
    { id: 'motorsport', label: 'Motorsport', color: '#e83e8c' }
  ];

  useEffect(() => {
    loadArticles();
    loadStats();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
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
          views: 1250,
          likes: 45,
          shares: 12,
          featuredImage: null
        },
        {
          id: '2',
          title: 'Toyota Prius 2024 Review',
          subtitle: 'A comprehensive look at the latest hybrid technology',
          content: 'Detailed review content here...',
          category: 'reviews',
          tags: ['toyota', 'prius', 'hybrid', 'review'],
          status: 'draft',
          publishDate: null,
          createdAt: '2024-01-08',
          updatedAt: '2024-01-12',
          views: 0,
          likes: 0,
          shares: 0,
          featuredImage: null
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
      // Mock stats - replace with actual API call
      setStats({
        totalArticles: 15,
        publishedArticles: 12,
        draftArticles: 3,
        totalViews: 25430,
        totalShares: 234,
        totalLikes: 1890
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

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
      authorNotes: ''
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
      authorNotes: article.authorNotes || ''
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
          shares: 0
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
          onEdit={handleEdit}
          categories={categories}
          formatNumber={formatNumber}
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
          getCategoryColor={getCategoryColor}
          getCategoryLabel={getCategoryLabel}
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

// Dashboard View Component
const DashboardView = ({ stats, articles, onCreateNew, onViewAll, onEdit, categories, formatNumber }) => {
  const recentArticles = articles.slice(0, 3);

  return (
    <div className="dashboard-view">
      <div className="dashboard-header">
        <div className="header-content">
          <h2>Articles Dashboard</h2>
          <p>Manage your articles, track performance, and create engaging content</p>
        </div>
        <button className="create-button primary" onClick={onCreateNew}>
          <Plus size={16} />
          New Article
        </button>
      </div>

      {/* Stats Cards */}
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
          <div className="stat-icon draft">
            <Edit2 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.draftArticles}</div>
            <div className="stat-label">Drafts</div>
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
        
        <div className="stat-card">
          <div className="stat-icon engagement">
            <Heart size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{formatNumber(stats.totalLikes)}</div>
            <div className="stat-label">Total Likes</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon shares">
            <Share2 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{formatNumber(stats.totalShares)}</div>
            <div className="stat-label">Total Shares</div>
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
            {recentArticles.map(article => (
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
                </div>
                
                <div className="article-stats">
                  <span><Eye size={12} /> {formatNumber(article.views)}</span>
                  <span><Heart size={12} /> {formatNumber(article.likes)}</span>
                  <span><Share2 size={12} /> {formatNumber(article.shares)}</span>
                </div>
                
                <div className="article-actions">
                  <button onClick={() => onEdit(article)} className="edit-button">
                    <Edit2 size={14} />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <PenTool size={48} />
            <h3>No Articles Yet</h3>
            <p>Start creating engaging content for your audience</p>
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

// List View Component (for managing all articles)
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
  getCategoryColor,
  getCategoryLabel
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

      {/* Articles List */}
      <div className="articles-list">
        {articles.length > 0 ? (
          articles.map(article => (
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
                </div>
                
                <div className="item-stats">
                  <span><Eye size={12} /> {formatNumber(article.views)}</span>
                  <span><Heart size={12} /> {formatNumber(article.likes)}</span>
                  <span><Share2 size={12} /> {formatNumber(article.shares)}</span>
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
          ))
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

// Editor View Component (for creating/editing articles)
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
                  {category.label}
                </option>
              ))}
            </select>
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
