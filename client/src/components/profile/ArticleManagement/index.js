// client/src/components/profile/ArticleManagement/index.js
// COMPLETE PRODUCTION VERSION - Gallery Image Issue FIXED

import React, { useRef, useEffect } from 'react';
import { Loader } from 'lucide-react';

// CRITICAL: Import useAuth like working admin components
import { useAuth } from '../../../context/AuthContext.js';

// Hooks
import { useArticleData } from './hooks/useArticleData.js';
import { useArticleOperations } from './hooks/useArticleOperations.js';

// API Service
import { articleApiService } from './services/articleService.js';

// Utils and Constants
import { categories, VIEWS } from './utils/constants.js';
import { 
  formatCurrency, 
  formatNumber, 
  formatDate, 
  getCategoryColor, 
  getCategoryLabel,
  calculateArticleEarnings,
  calculateArticleEngagement,
  checkCashoutEligibility
} from './utils/articleUtils.js';
import { earningsConfig } from './utils/earningsConfig.js';

// View Components
import DashboardView from './views/DashboardView/index.js';
import EarningsView from './views/EarningsView/index.js';
import ListView from './views/ListView/index.js';
import EditorView from './views/EditorView/index.js';

// Styles
import './ArticleManagement.css';

/**
 * Main ArticleManagement component - PRODUCTION READY with Gallery Support
 * @param {Object} props - Component props
 * @param {Object} props.profileData - User profile data
 * @param {Function} props.refreshProfile - Function to refresh profile
 * @param {string} props.initialAction - Initial action to perform (e.g., 'create')
 */
const ArticleManagement = ({ profileData, refreshProfile, initialAction }) => {
  const fileInputRef = useRef(null);
  
  // Get user from AuthContext
  const { user, loading: authLoading } = useAuth();
  
  // Set user in article service
  useEffect(() => {
    if (user) {
      console.log('Setting user in article service:', user.role);
      articleApiService.setCurrentUser(user);
    }
  }, [user]);
  
  // Data management
  const {
    articles,
    stats,
    loading,
    error,
    addArticle,
    updateArticle,
    deleteArticle,
    refreshData
  } = useArticleData();

  // FIXED: Operations and form management - properly extract ALL gallery props
  const {
    // View state
    activeView,
    navigateToView,
    
    // Form state
    articleForm,
    setArticleForm,
    formErrors,
    saving,
    editingArticle,
    isCreating,
    
    // FIXED: Gallery image state - NOW PROPERLY EXTRACTED
    featuredImageFile,
    galleryImageFiles,           // ✅ FIXED - Was missing
    imageUploadProgress,         // ✅ FIXED - Was missing
    
    // Search and filter state
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    selectedCategory,
    setSelectedCategory,
    
    // Operations
    handleCreateNew,
    handleEdit,
    handleSave,
    handleDelete,
    handleCancel,
    handleImageUpload,
    handleGalleryImagesUpload,   // ✅ FIXED - Was missing
    removeGalleryImage,          // ✅ FIXED - Was missing
    addTag,
    removeTag,
    getFilteredArticles
  } = useArticleOperations({ 
    addArticle, 
    updateArticle, 
    deleteArticle, 
    refreshData 
  });

  // Debug logging for admin role
  useEffect(() => {
    if (user) {
      console.log('ArticleManagement - User role check:', {
        userRole: user.role,
        isAdmin: user.role === 'admin',
        canAccessAdmin: articleApiService.isAdmin()
      });
    }
  }, [user]);

  // Handle initial action (like create article from profile header)
  useEffect(() => {
    if (initialAction === 'create' && handleCreateNew && !loading) {
      handleCreateNew();
    }
  }, [initialAction, handleCreateNew, loading]);

  // Auth loading state
  if (authLoading) {
    return (
      <div className="article-management loading">
        <div className="loading-spinner">
          <Loader size={32} className="spin" />
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  // User not found state
  if (!user) {
    return (
      <div className="article-management">
        <div className="error-message">
          <p>User not found. Please log in again.</p>
        </div>
      </div>
    );
  }

  // Data loading state
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

  // Error state
  if (error) {
    return (
      <div className="article-management">
        <div className="error-message">
          <p>Error loading articles: {error}</p>
          <button onClick={refreshData}>Try Again</button>
        </div>
      </div>
    );
  }

  // Get filtered articles for list view
  const filteredArticles = getFilteredArticles ? getFilteredArticles(articles) : articles;

  // Shared props for all views
  const sharedProps = {
    articles,
    stats,
    user,
    categories,
    earningsConfig,
    formatCurrency,
    formatNumber,
    formatDate,
    getCategoryColor,
    getCategoryLabel,
    calculateArticleEarnings,
    calculateArticleEngagement,
    checkCashoutEligibility
  };

  // Render current view
  const renderCurrentView = () => {
    switch (activeView) {
      case VIEWS.DASHBOARD:
        return (
          <DashboardView
            {...sharedProps}
            onCreateNew={handleCreateNew}
            onViewAll={() => navigateToView(VIEWS.LIST)}
            onViewEarnings={() => navigateToView(VIEWS.EARNINGS)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewChange={navigateToView}
          />
        );

      case VIEWS.EARNINGS:
        return (
          <EarningsView
            {...sharedProps}
            onBack={() => navigateToView(VIEWS.DASHBOARD)}
            onViewChange={navigateToView}
          />
        );

      case VIEWS.LIST:
        return (
          <ListView
            {...sharedProps}
            articles={filteredArticles}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBack={() => navigateToView(VIEWS.DASHBOARD)}
            onViewChange={navigateToView}
          />
        );

      case VIEWS.EDITOR:
        return (
          <EditorView
            {...sharedProps}
            articleForm={articleForm}
            setArticleForm={setArticleForm}
            formErrors={formErrors}
            saving={saving}
            editingArticle={editingArticle}
            isCreating={isCreating}
            onSave={handleSave}
            onCancel={handleCancel}
            onImageUpload={handleImageUpload}
            addTag={addTag}
            removeTag={removeTag}
            fileInputRef={fileInputRef}
            onViewChange={navigateToView}
            // ✅ FIXED: Gallery props NOW PROPERLY PASSED
            galleryImageFiles={galleryImageFiles}
            onGalleryImagesUpload={handleGalleryImagesUpload}
            removeGalleryImage={removeGalleryImage}
            imageUploadProgress={imageUploadProgress}
          />
        );

      default:
        return (
          <DashboardView
            {...sharedProps}
            onCreateNew={handleCreateNew}
            onViewAll={() => navigateToView(VIEWS.LIST)}
            onViewEarnings={() => navigateToView(VIEWS.EARNINGS)}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewChange={navigateToView}
          />
        );
    }
  };

  return (
    <div className="article-management">
      {/* Debug info for development (remove in production) */}
      {process.env.NODE_ENV === 'development' && user && (
        <div style={{ 
          background: '#333', 
          color: '#fff', 
          padding: '10px', 
          marginBottom: '10px',
          fontSize: '12px',
          borderRadius: '5px'
        }}>
          <strong>🔧 Debug Info:</strong><br />
          User: {user.name}<br />
          Role: {user.role}<br />
          Is Admin: {articleApiService.isAdmin() ? 'Yes' : 'No'}<br />
          Articles: {articles.length}<br />
          Gallery Files: {galleryImageFiles?.length || 0}<br />
          Gallery Handler: {handleGalleryImagesUpload ? 'Available' : 'Missing'}
        </div>
      )}
      
      {renderCurrentView()}
      
      {/* Hidden file input for featured image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
    </div>
  );
};

export default ArticleManagement;