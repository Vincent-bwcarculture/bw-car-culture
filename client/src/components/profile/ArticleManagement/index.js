// client/src/components/profile/ArticleManagement/index.js
// Main ArticleManagement coordinator component (simplified)

import React, { useRef } from 'react';
import { Loader } from 'lucide-react';

// Hooks
import { useArticleData } from './hooks/useArticleData.js';
import { useArticleOperations } from './hooks/useArticleOperations.js';

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
 * Main ArticleManagement component - simplified coordinator
 * @param {Object} props - Component props
 * @param {Object} props.profileData - User profile data
 * @param {Function} props.refreshProfile - Function to refresh profile
 */
const ArticleManagement = ({ profileData, refreshProfile }) => {
  const fileInputRef = useRef(null);
  
  // Data management
  const {
    articles,
    stats,
    loading,
    addArticle,
    updateArticle,
    deleteArticle,
    refreshData
  } = useArticleData();

  // Operations and form management
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
    addTag,
    removeTag,
    getFilteredArticles
  } = useArticleOperations({ 
    addArticle, 
    updateArticle, 
    deleteArticle, 
    refreshData 
  });

  // Get filtered articles for list view
  const filteredArticles = getFilteredArticles(articles);

  // Loading state
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

  // Shared props for all views
  const sharedProps = {
    articles,
    stats,
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

  return (
    <div className="article-management">
      {/* Dashboard View */}
      {activeView === VIEWS.DASHBOARD && (
        <DashboardView
          {...sharedProps}
          onCreateNew={handleCreateNew}
          onViewAll={() => navigateToView(VIEWS.LIST)}
          onViewEarnings={() => navigateToView(VIEWS.EARNINGS)}
          onEdit={handleEdit}
        />
      )}

      {/* Earnings View */}
      {activeView === VIEWS.EARNINGS && (
        <EarningsView
          {...sharedProps}
          onBack={() => navigateToView(VIEWS.DASHBOARD)}
        />
      )}

      {/* List View */}
      {activeView === VIEWS.LIST && (
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
        />
      )}

      {/* Editor View */}
      {activeView === VIEWS.EDITOR && (
        <EditorView
          {...sharedProps}
          articleForm={articleForm}
          setArticleForm={setArticleForm}
          formErrors={formErrors}
          saving={saving}
          editingArticle={editingArticle}
          onSave={handleSave}
          onCancel={handleCancel}
          onImageUpload={handleImageUpload}
          addTag={addTag}
          removeTag={removeTag}
          fileInputRef={fileInputRef}
        />
      )}
    </div>
  );
};

export default ArticleManagement;
