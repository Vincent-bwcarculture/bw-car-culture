// client/src/components/profile/ArticleManagement/index.js
// FIXED VERSION - Enhanced error handling and using simple pattern like working UserCarListingForm

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
  
  // FIXED: Enhanced user setup with error handling
  useEffect(() => {
    if (user) {
      try {
        console.log('Setting user in article service:', user.role);
        articleApiService.setCurrentUser(user);
      } catch (error) {
        console.error('Error setting user in article service:', error);
      }
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

  // SIMPLIFIED: Extract simple state from hook with error handling
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

  // FIXED: Enhanced role checking with error handling
  useEffect(() => {
    if (user) {
      try {
        console.log('ArticleManagement - User role check:', {
          userRole: user.role,
          isAdmin: user.role === 'admin',
          canAccessAdmin: articleApiService.isAdmin()
        });
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    }
  }, [user]);

  // FIXED: Enhanced initial action handling with error prevention
  useEffect(() => {
    if (initialAction === 'create' && handleCreateNew && !loading && !authLoading) {
      try {
        handleCreateNew();
      } catch (error) {
        console.error('Error handling initial create action:', error);
        // Don't crash the component, just log the error
      }
    }
  }, [initialAction, handleCreateNew, loading, authLoading]);

  // FIXED: Enhanced loading state for authentication
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

  // FIXED: Enhanced user validation
  if (!user) {
    return (
      <div className="article-management">
        <div className="error-message">
          <p>User not found. Please log in again.</p>
          <button onClick={() => window.location.href = '/login'}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // FIXED: Enhanced loading state for data
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

  // FIXED: Enhanced error handling with retry option
  if (error) {
    return (
      <div className="article-management">
        <div className="error-message">
          <h3>Error Loading Articles</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={refreshData} className="retry-button">
              Try Again
            </button>
            <button onClick={() => window.location.reload()} className="reload-button">
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FIXED: Safe filtered articles calculation
  let filteredArticles = [];
  try {
    filteredArticles = getFilteredArticles ? getFilteredArticles(articles) : articles;
    // Ensure it's an array
    if (!Array.isArray(filteredArticles)) {
      console.warn('Filtered articles is not an array:', filteredArticles);
      filteredArticles = Array.isArray(articles) ? articles : [];
    }
  } catch (filterError) {
    console.error('Error filtering articles:', filterError);
    filteredArticles = Array.isArray(articles) ? articles : [];
  }

  // FIXED: Safe shared props with fallbacks
  const sharedProps = {
    articles: Array.isArray(articles) ? articles : [],
    stats: stats || {},
    user: user || {},
    categories: categories || [],
    earningsConfig: earningsConfig || {},
    formatCurrency: formatCurrency || (() => '$0'),
    formatNumber: formatNumber || (() => '0'),
    formatDate: formatDate || (() => 'N/A'),
    getCategoryColor: getCategoryColor || (() => '#gray'),
    getCategoryLabel: getCategoryLabel || (() => 'Unknown'),
    calculateArticleEarnings: calculateArticleEarnings || (() => 0),
    calculateArticleEngagement: calculateArticleEngagement || (() => 0),
    checkCashoutEligibility: checkCashoutEligibility || (() => false)
  };

  // FIXED: Enhanced view rendering with error boundaries
  const renderCurrentView = () => {
    try {
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
              galleryImages={galleryImages || []}
              onGalleryImagesUpload={handleGalleryImagesUpload}
              removeGalleryImage={removeGalleryImage}
            />
          );

        default:
          console.warn('Unknown view:', activeView, 'defaulting to dashboard');
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
    } catch (renderError) {
      console.error('Error rendering view:', renderError);
      
      // FIXED: Fallback error view
      return (
        <div className="article-management">
          <div className="error-message">
            <h3>Rendering Error</h3>
            <p>There was an error displaying this view.</p>
            <button onClick={() => navigateToView(VIEWS.DASHBOARD)}>
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="article-management">
      {/* FIXED: Enhanced debug info with error handling */}
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
          User: {user.name || 'Unknown'}<br />
          Role: {user.role || 'Unknown'}<br />
          Articles: {Array.isArray(articles) ? articles.length : 'N/A'}<br />
          Gallery Images: {Array.isArray(galleryImages) ? galleryImages.length : 0}<br />
          Active View: {activeView || 'Unknown'}<br />
          Saving: {saving ? 'Yes' : 'No'}<br />
          {formErrors?.general && (
            <>Form Error: {formErrors.general}<br /></>
          )}
        </div>
      )}
      
      {/* FIXED: Error boundary wrapper for main content */}
      <div className="article-management-content">
        {renderCurrentView()}
      </div>
      
      {/* FIXED: Enhanced file input with error handling */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          try {
            if (handleImageUpload) {
              handleImageUpload(e);
            }
          } catch (error) {
            console.error('Error handling image upload:', error);
            alert('Failed to process image. Please try again.');
          }
        }}
      />
    </div>
  );
};

export default ArticleManagement;