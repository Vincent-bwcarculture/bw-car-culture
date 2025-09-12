// client/src/components/profile/ArticleManagement/index.js
// FIXED VERSION - Using simple pattern like working UserCarListingForm

import React, { useRef, useEffect } from 'react';
import { Loader } from 'lucide-react';

import { useAuth } from '../../../context/AuthContext.js';
import { useArticleData } from './hooks/useArticleData.js';
import { useArticleOperations } from './hooks/useArticleOperations.js';
import { articleApiService } from './services/articleService.js';

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

import DashboardView from './views/DashboardView/index.js';
import EarningsView from './views/EarningsView/index.js';
import ListView from './views/ListView/index.js';
import EditorView from './views/EditorView/index.js';

import './ArticleManagement.css';

const ArticleManagement = ({ profileData, refreshProfile, initialAction }) => {
  const fileInputRef = useRef(null);
  const { user, loading: authLoading } = useAuth();
  
  useEffect(() => {
    if (user) {
      console.log('Setting user in article service:', user.role);
      articleApiService.setCurrentUser(user);
    }
  }, [user]);
  
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

  // SIMPLIFIED: Extract simple state from hook
  const {
    activeView,
    navigateToView,
    articleForm,
    setArticleForm,
    formErrors,
    saving,
    editingArticle,
    isCreating,
    featuredImageFile,
    galleryImages,  // CHANGED: Simple array like UserCarListingForm
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    selectedCategory,
    setSelectedCategory,
    handleCreateNew,
    handleEdit,
    handleSave,
    handleDelete,
    handleCancel,
    handleImageUpload,
    handleGalleryImagesUpload,  // SIMPLIFIED
    removeGalleryImage,         // SIMPLIFIED
    addTag,
    removeTag,
    getFilteredArticles
  } = useArticleOperations({ 
    addArticle, 
    updateArticle, 
    deleteArticle, 
    refreshData 
  });

  useEffect(() => {
    if (user) {
      console.log('ArticleManagement - User role check:', {
        userRole: user.role,
        isAdmin: user.role === 'admin',
        canAccessAdmin: articleApiService.isAdmin()
      });
    }
  }, [user]);

  useEffect(() => {
    if (initialAction === 'create' && handleCreateNew && !loading) {
      handleCreateNew();
    }
  }, [initialAction, handleCreateNew, loading]);

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

  if (!user) {
    return (
      <div className="article-management">
        <div className="error-message">
          <p>User not found. Please log in again.</p>
        </div>
      </div>
    );
  }

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

  const filteredArticles = getFilteredArticles ? getFilteredArticles(articles) : articles;

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
            // SIMPLIFIED: Pass simple gallery props like UserCarListingForm
            galleryImages={galleryImages}
            onGalleryImagesUpload={handleGalleryImagesUpload}
            removeGalleryImage={removeGalleryImage}
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
      {process.env.NODE_ENV === 'development' && user && (
        <div style={{ 
          background: '#333', 
          color: '#fff', 
          padding: '10px', 
          marginBottom: '10px',
          fontSize: '12px',
          borderRadius: '5px'
        }}>
          <strong>Debug Info:</strong><br />
          User: {user.name}<br />
          Role: {user.role}<br />
          Articles: {articles.length}<br />
          Gallery Images: {galleryImages?.length || 0}
        </div>
      )}
      
      {renderCurrentView()}
      
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