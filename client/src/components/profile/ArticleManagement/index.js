// client/src/components/profile/ArticleManagement/index.js
// COMPLETE VERSION - All fixes integrated including error handling, debugging, and safe component rendering

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
        console.log('Processing initial create action...');
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
          <h3>Authentication Required</h3>
          <p>User not found. Please log in again.</p>
          <div className="error-actions">
            <button 
              onClick={() => window.location.href = '/login'}
              className="login-button"
            >
              Go to Login
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="reload-button"
            >
              Reload Page
            </button>
          </div>
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
          {process.env.NODE_ENV === 'development' && (
            <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
              Debug: User ID {user?.id}, Role: {user?.role}
            </div>
          )}
        </div>
      </div>
    );
  }

  // FIXED: Enhanced error handling with retry option and detailed debugging
  if (error) {
    return (
      <div className="article-management">
        <div className="error-message">
          <h3>Error Loading Articles</h3>
          <p>{error}</p>
          
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '15px', fontSize: '12px' }}>
              <summary>Debug Information</summary>
              <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                User: {JSON.stringify({
                  id: user?.id,
                  role: user?.role,
                  name: user?.name
                }, null, 2)}
                
                Error Details: {error}
                
                API Base URL: {articleApiService.baseURL}
              </pre>
            </details>
          )}
          
          <div className="error-actions" style={{ marginTop: '20px' }}>
            <button 
              onClick={refreshData} 
              className="retry-button"
              style={{
                padding: '10px 20px',
                marginRight: '10px',
                backgroundColor: '#007cba',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="reload-button"
              style={{
                padding: '10px 20px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
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
            <p>There was an error displaying this view: {renderError.message}</p>
            
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '15px', fontSize: '12px' }}>
                <summary>Error Stack Trace</summary>
                <pre style={{ background: '#ffe6e6', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
                  {renderError.stack}
                </pre>
              </details>
            )}
            
            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={() => navigateToView(VIEWS.DASHBOARD)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007cba',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Return to Dashboard
              </button>
            </div>
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
          background: '#2c3e50', 
          color: '#ecf0f1', 
          padding: '15px', 
          marginBottom: '15px',
          fontSize: '12px',
          borderRadius: '8px',
          fontFamily: 'monospace'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <strong>🛠️ ARTICLE MANAGEMENT DEBUG INFO</strong>
            <span style={{ fontSize: '10px', opacity: 0.7 }}>
              {new Date().toLocaleTimeString()}
            </span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <div><strong>👤 User Info:</strong></div>
              <div>Name: {user.name || 'Unknown'}</div>
              <div>Role: {user.role || 'Unknown'}</div>
              <div>ID: {user.id || user._id || 'Unknown'}</div>
            </div>
            
            <div>
              <div><strong>📊 Data Info:</strong></div>
              <div>Articles: {Array.isArray(articles) ? articles.length : 'N/A'}</div>
              <div>Gallery Images: {Array.isArray(galleryImages) ? galleryImages.length : 0}</div>
              <div>Active View: {activeView || 'Unknown'}</div>
            </div>
          </div>
          
          <div style={{ marginTop: '10px' }}>
            <div><strong>🔧 Status:</strong></div>
            <div>Saving: {saving ? 'Yes' : 'No'}</div>
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
            <div>Auth Loading: {authLoading ? 'Yes' : 'No'}</div>
            {formErrors?.general && (
              <div style={{ color: '#e74c3c' }}>Form Error: {formErrors.general}</div>
            )}
          </div>

          {/* API endpoint debugging */}
          <div style={{ marginTop: '10px' }}>
            <div><strong>🌐 API Info:</strong></div>
            <div>Base URL: {articleApiService.baseURL}</div>
            <div>Is Admin: {articleApiService.isAdmin() ? 'Yes' : 'No'}</div>
            <div>Token Present: {localStorage.getItem('token') ? 'Yes' : 'No'}</div>
          </div>
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
            } else {
              console.warn('handleImageUpload function not available');
            }
          } catch (error) {
            console.error('Error handling image upload:', error);
            alert('Failed to process image. Please try again.');
          }
        }}
      />

      {/* Add quick debugging buttons in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#34495e',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>🚀 Quick Debug Actions:</strong>
          </div>
          <button
            onClick={() => {
              console.log('=== ARTICLE MANAGEMENT STATE ===');
              console.log('Articles:', articles);
              console.log('User:', user);
              console.log('Active View:', activeView);
              console.log('Form Errors:', formErrors);
              console.log('Gallery Images:', galleryImages);
            }}
            style={{
              padding: '5px 10px',
              marginRight: '5px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Log State
          </button>
          <button
            onClick={async () => {
              try {
                await articleApiService.debugApiEndpoints();
              } catch (error) {
                console.error('Debug failed:', error);
              }
            }}
            style={{
              padding: '5px 10px',
              backgroundColor: '#e67e22',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Test APIs
          </button>
        </div>
      )}
    </div>
  );
};

export default ArticleManagement;