// src/App.js - Enhanced with Complete Analytics Integration
import React, { Suspense, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { useAuth } from './context/AuthContext.js';
import { NewsProvider } from './context/NewsContext.js';
import MainLayout from './components/layout/MainLayout.js';
import LoadingScreen from './components/shared/LoadingScreen/LoadingScreen.js';
import SplashScreen from './components/SplashScreen.js';
import { initializeGA, trackPageView, trackException, trackTiming } from './config/analytics.js';
import UserProfilePage from './pages/UserProfilePage.js';
import AdminUserSubmissions from './Admin/components/AdminUserSubmissions.js';

// Add these imports
import WelcomeModal from './components/shared/WelcomeModal/WelcomeModal.js';
import { useWelcomeModal } from './hooks/useWelcomeModal.js';

import { InternalAnalyticsProvider } from './components/shared/InternalAnalyticsProvider.js';
import AnalyticsDashboard from './Admin/AnalyticsDashboard/AnalyticsDashboard.js';
import internalAnalytics from './utils/internalAnalytics.js';

// Admin Components
import AdminLayout from './Admin/layout/AdminLayout.js';
import AuctionManager from './Admin/AuctionManager/AuctionManager.js';
import LoginPage from './Admin/auth/LoginPage.js';
import RegisterPage from './Admin/auth/RegisterPage.js';
import AdminRegisterPage from './Admin/auth/AdminRegisterPage.js';
import ForgotPasswordPage from './Admin/auth/ForgotPasswordPage.js';
import ResetPasswordPage from './Admin/auth/ResetPasswordPage.js';
import UnauthorizedPage from './Admin/auth/UnauthorizedPage.js';
import AdminDashboard from './Admin/AdminDashboard.js';
import ListingManager from './Admin/ListingManager/ListingManager.js';

// Main Site Components
import FeaturedNews from './components/features/CarNews/FeaturedNews.js';
import CarNewsSection from './components/features/CarNews/CarNewsSection.js';
import CarFilter from './components/features/CarFilters/CarFilter.js';
import CarResults from './components/features/CarFilters/CarResults.js';
import CarCategories from './components/features/CarCategories/CarCategories.js';
import CarBrands from './components/features/CarCategories/CarBrands.js';
import MarketplaceSection from './components/features/MarketplaceSection/MarketplaceSection.js';
import InventoryList from './components/features/InventorySection/InventoryList.js';
import InventoryItemDetail from './components/features/InventorySection/InventoryItemDetail.js';
import Advertisement from './components/shared/Advertisement.js';
import NewsReviews from './components/features/NewsReviews/NewsReviews.js';
import ProcessSection from './components/shared/Process/ProcessSection.js';
import HeroSection from './components/layout/HeroSection/HeroSection.js';
import BudgetSearch from './components/features/BudgetSearch/BudgetSearch.js';
import CarReviewsPage from './components/features/CarReviews/CarReviewsPage.js';
import Chatbot from './components/shared/Chatbot/Chatbot.js';
import HomeDealershipsSection from './components/features/HomeDealershipsSection/HomeDealershipsSection.js';
import ConnectionTest from './components/shared/ConnectionTest.js';
import NewsManager from './components/NewsManager/NewsManager.js';

// Import GION App component
import GIONApp from './components/GION/GIONApp.js';
import PrivacyPolicyPage from './components/pages/PolicyPages/PrivacyPolicyPage.js';
import TermsOfServicePage from './components/pages/PolicyPages/TermsOfServicePage.js';
import CookiesPolicyPage from './components/pages/PolicyPages/CookiesPolicyPage.js';
import FeedbackPage from './components/pages/FeedbackPage/FeedbackPage.js';
import FeedbackManager from './Admin/FeedbackManager/FeedbackManager.js';
import InventoryManager from './Admin/InventoryManager/InventoryManager.js';
import InventoryPage from './components/pages/InventoryPage/InventoryPage.js';

// Import GION Dashboard Components
import GIONAdminDashboard from './components/GION/GIONAdminDashboard/GIONAdminDashboard.js';
import MinistryDashboard from './components/GION/GorvDashboards/MinistryDashboard.js';
import ServiceProviderDashboard from './components/GION/ServiceProviderDashboards/ServiceProviderDashboard.js';

// Service Manager Components
import ServiceProviderManager from './Admin/ServiceProviderManager/ServiceProviderManager.js';
import RentalVehicleManager from './Admin/RentalVehicleManager/RentalVehicleManager.js';
import TrailerListingManager from './Admin/TrailerListingManager/TrailerListingManager.js';
import TransportRouteManager from './Admin/TransportRouteManager/TransportRouteManager.js';

import RequestManager from './Admin/RequestManager/RequestManager.js';
import ServiceProviderRequest from './Admin/auth/ServiceProviderRequest.js';
import MinistryRequest from './Admin/auth/MinistryRequest.js';

// Pages
import ServicesPage from './components/pages/ServicesPage/ServicesPage.js';
import DealershipsPage from './components/pages/DealershipsPage/DealershipsPage.js';
import BusinessDetailPage from './components/pages/BusinessDetailPage/BusinessDetailPage.js';
import PublicTransportPage from './components/features/PublicTransportSection/PublicTransportPage.js';
import RentalVehicleDetail from './components/features/RentalSection/RentalVehicleDetail.js';
import TransportRouteDetail from './components/features/TransportSection/TransportRouteDetail.js';
import VideoManager from './Admin/VideoManager/VideoManager.js';
import VideoSection from './components/features/VideoSection/VideoSection.js';
import HomeRentalsSection from './components/features/HomeRentalsSection/HomeRentalsSection.js';
import HomeServicesSection from './components/features/HomeServicesSection/HomeServicesSection.js';

// Styles
import './App.css';
import './styles/base.css';
import './utils/imagePathDiagnostics.js';

// Lazy loaded components
const CarNewsPage = React.lazy(() => import('./components/features/CarNews/CarNewsPage.js'));
const NewsArticle = React.lazy(() => import('./components/features/CarNews/NewsArticle.js'));
const MarketplaceList = React.lazy(() => import('./components/features/MarketplaceSection/MarketplaceList.js'));
const CarMarketPlace = React.lazy(() => import('./components/features/MarketplaceSection/CarMarketPlace.js'));
const EditorDashboard = React.lazy(() => import('./Admin/dashboards/EditorDashboard.js'));
const DealerDashboard = React.lazy(() => import('./Admin/dashboards/DealerDashboard.js'));


// Enhanced Analytics Wrapper component with comprehensive tracking
const AnalyticsWrapper = ({ children }) => {
  const location = useLocation();
  const sessionStartTime = React.useRef(Date.now());
  const pageStartTime = React.useRef(Date.now());
  const lastPath = React.useRef('');
  
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // Track page view when location changes
    try {
      // Track with Google Analytics
      trackPageView(currentPath);
      
      // Track with internal analytics
      if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
        // Calculate time on previous page
        const timeOnPreviousPage = lastPath.current ? Date.now() - pageStartTime.current : 0;
        
        internalAnalytics.trackEvent('page_view', {
          category: 'navigation',
          metadata: {
            page: currentPath,
            previousPage: lastPath.current || null,
            timeOnPreviousPage,
            referrer: document.referrer,
            timestamp: new Date().toISOString(),
            sessionDuration: Date.now() - sessionStartTime.current,
            userAgent: navigator.userAgent,
            screenResolution: typeof window !== 'undefined' && window.screen ? 
              `${window.screen.width}x${window.screen.height}` : 'unknown',
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            platform: navigator.platform
          }
        });
      }
      
      // Update tracking references
      lastPath.current = currentPath;
      pageStartTime.current = Date.now();
      
    } catch (error) {
      console.error('Error in AnalyticsWrapper page tracking:', error);
      
      // Track the error itself
      if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
        internalAnalytics.trackEvent('error', {
          category: 'system',
          metadata: {
            errorType: 'AnalyticsWrapperError',
            errorMessage: error.message,
            page: currentPath,
            function: 'pageView'
          }
        });
      }
    }
  }, [location]);

  // Track app performance metrics
  useEffect(() => {
    if ('performance' in window) {
      const trackPerformanceMetrics = () => {
        try {
          const navigation = performance.getEntriesByType('navigation')[0];
          const paint = performance.getEntriesByType('paint');
          
          if (navigation && internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
            const performanceData = {
              loadTime: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
              domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.loadEventStart),
              firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
              timeToFirstByte: Math.round(navigation.responseStart - navigation.requestStart),
              page: location.pathname,
              connectionType: navigator.connection?.effectiveType || 'unknown',
              deviceMemory: navigator.deviceMemory || 'unknown'
            };
            
            internalAnalytics.trackEvent('performance', {
              category: 'system',
              metadata: performanceData
            });
            
            // Also track with Google Analytics timing
            trackTiming('App Performance', 'Page Load', performanceData.loadTime, location.pathname);
          }
        } catch (error) {
          console.error('Performance tracking error:', error);
        }
      };

      // Wait for page to load before tracking performance
      if (document.readyState === 'complete') {
        setTimeout(trackPerformanceMetrics, 1000);
      } else {
        window.addEventListener('load', () => {
          setTimeout(trackPerformanceMetrics, 1000);
        });
      }
    }
  }, [location]);
  
  return children;
};

// Enhanced Error Boundary Component
class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Track error with internal analytics
    try {
      if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
        internalAnalytics.trackEvent('error', {
          category: 'system',
          metadata: {
            errorType: 'ReactErrorBoundary',
            errorMessage: error.message,
            errorStack: error.stack,
            componentStack: errorInfo.componentStack,
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
          }
        });
      }
      
      // Track with Google Analytics
      trackException(error.message, true);
    } catch (analyticsError) {
      console.error('Error tracking failed:', analyticsError);
    }

    // Report to external error service if configured
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
              <summary>Error Details (Click to expand)</summary>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo.componentStack}
            </details>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                marginTop: '1rem', 
                padding: '0.5rem 1rem', 
                backgroundColor: '#ff3300', 
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
      );
    }

    return this.props.children;
  }
}

// NewsLayout component for wrapping news routes with NewsProvider
const NewsLayout = ({ children }) => (
  <NewsProvider>
    {children}
  </NewsProvider>
);

// Placeholder page component
const PlaceholderPage = ({ title }) => {
  // Track placeholder page views
  useEffect(() => {
    if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
      internalAnalytics.trackEvent('placeholder_page_view', {
        category: 'content',
        metadata: {
          placeholderTitle: title,
          page: window.location.pathname
        }
      });
    }
  }, [title]);

  return (
    <div className="placeholder-page">
      <h1>{title}</h1>
      <p>This page is under construction.</p>
    </div>
  );
};

// Enhanced Home page content component with analytics
const HomeContent = () => {
  const [carFilters, setCarFilters] = useState({});
  const [hasSearched, setHasSearched] = useState(false);

  // Track home page engagement
  useEffect(() => {
    if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
      internalAnalytics.trackEvent('home_page_load', {
        category: 'content',
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer
        }
      });
    }
  }, []);

  const handleFilterChange = (newFilters) => {
    console.log("Filters changed:", newFilters);
    setCarFilters(newFilters);
    
    // Track filter usage
    if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
      internalAnalytics.trackEvent('filter_change', {
        category: 'interaction',
        metadata: {
          filters: newFilters,
          filterCount: Object.keys(newFilters).length,
          page: 'home'
        }
      });
    }
  };

  const handleSearchPerformed = (performed) => {
    console.log("Search performed:", performed);
    setHasSearched(performed);
    
    // Track search interaction
    if (performed && internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
      internalAnalytics.trackEvent('search_performed', {
        category: 'conversion',
        metadata: {
          source: 'home_page',
          filters: carFilters,
          hasFilters: Object.keys(carFilters).length > 0
        }
      });
    }
  };

  const handleExpandFilter = () => {
    // Track filter expansion
    if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
      internalAnalytics.trackEvent('filter_expand', {
        category: 'interaction',
        metadata: {
          action: 'expand_filters',
          source: 'search_results'
        }
      });
    }
    
    // Find the filter element and scroll to it
    const filterElement = document.getElementById('car-filters');
    if (filterElement) {
      filterElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Find the expand button and click it if filters aren't already expanded
      const expandButton = filterElement.querySelector('.expand-filters-btn');
      if (expandButton && expandButton.getAttribute('aria-expanded') === 'false') {
        expandButton.click();
      }
    }
  };

  return (
    <main className="main-content">
      <HeroSection />
      <CarFilter 
        onFilterChange={handleFilterChange} 
        onSearchPerformed={handleSearchPerformed}
      />
      <CarResults 
        filters={carFilters} 
        hasSearched={hasSearched}
        onExpandFilter={handleExpandFilter}
        onSearchPerformed={handleSearchPerformed}
      />
      <Advertisement />
      <BudgetSearch />
      <MarketplaceSection />
      <CarCategories />
      <CarBrands />
      <VideoSection />
      <HomeRentalsSection />
      <NewsProvider>
        <div className="cover-container">
          <FeaturedNews />
          <CarNewsSection />
        </div>
      </NewsProvider>

      <div className="bottom-section">
        <div className="content-grid">
          {/* Main content and sidebar grid */}
        </div>
      </div>

      <NewsReviews />
      <HomeDealershipsSection />
      <HomeServicesSection />
    </main>
  );
};

// Enhanced Protected Route components with analytics
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  // Track authentication attempts
  useEffect(() => {
    if (!loading && internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
      internalAnalytics.trackEvent('auth_check', {
        category: 'system',
        metadata: {
          isAuthenticated,
          requiredRoles,
          userRole: user?.role || null,
          page: window.location.pathname
        }
      });
    }
  }, [isAuthenticated, loading, user, requiredRoles]);
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    // Track authentication redirect
    if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
      internalAnalytics.trackEvent('auth_redirect', {
        category: 'conversion',
        metadata: {
          fromPage: window.location.pathname,
          reason: 'not_authenticated',
          requiredRoles
        }
      });
    }
    return <Navigate to="/login" replace />;
  }
  
  // Check for role requirements if specified
  if (requiredRoles.length > 0 && (!user || !requiredRoles.includes(user.role))) {
    // Track authorization failure
    if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
      internalAnalytics.trackEvent('auth_unauthorized', {
        category: 'system',
        metadata: {
          userRole: user?.role || null,
          requiredRoles,
          page: window.location.pathname
        }
      });
    }
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
};

// App routes component (unchanged - keeping existing structure)
const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Auth Routes - Accessible to everyone */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/admin" element={<AdminRegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        
        {/* Admin Routes - Protected */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/listings" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <ListingManager />
          </ProtectedRoute>
        } />

        <Route path="/admin/analytics" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout>
              <AnalyticsDashboard />
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/requests" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout>
              <RequestManager />
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/news" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout>
              <NewsManager />
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/editor" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout>
              <EditorDashboard />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/feedback" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout>
              <FeedbackManager />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route 
  path="/admin/user-submissions" 
  element={
    <ProtectedRoute adminOnly={true}>
      <AdminLayout>
        <AdminUserSubmissions />
      </AdminLayout>
    </ProtectedRoute>
  } 
/>

        <Route path="/admin/auctions" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout>
              <AuctionManager />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/dealer" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout>
              <DealerDashboard />
            </AdminLayout>
          </ProtectedRoute>
        } />

        {/* Service Provider Routes - Protected for Admins Only */}
        <Route path="/admin/service-providers" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout>
              <ServiceProviderManager />
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/rentals" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout>
              <RentalVehicleManager />
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/trailers" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout>
              <TrailerListingManager />
            </AdminLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/transport" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout>
              <TransportRouteManager />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/inventory" element={
          <ProtectedRoute requiredRoles={['admin', 'provider', 'dealer']}>
            <AdminLayout>
              <InventoryManager />
            </AdminLayout>
          </ProtectedRoute>
        } />

        <Route path="/admin/videos" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <AdminLayout>
              <VideoManager />
            </AdminLayout>
          </ProtectedRoute>
        } />


        
        <Route path="/admin/gion" element={
          <AdminLayout>
            <div className="gion-admin-wrapper">
              <h2>GION Administration</h2>
              <div className="dashboard-placeholder">
                <p>GION Dashboard loading...</p>
              </div>
            </div>
          </AdminLayout>
        } />
      
        {/* Main Website Routes */}
        <Route path="/inventory" element={
          <MainLayout>
            <InventoryPage />
          </MainLayout>
        } />

        <Route path="/inventory/:itemId" element={
          <MainLayout>
            <InventoryItemDetail />
          </MainLayout>
        } />

        <Route path="/admin-access/register" element={<AdminRegisterPage />} />
        
        {/* Policy Pages */}
        <Route path="/privacy" element={
          <MainLayout>
            <PrivacyPolicyPage />
          </MainLayout>
        } />

        <Route path="/terms" element={
          <MainLayout>
            <TermsOfServicePage />
          </MainLayout>
        } />

        <Route path="/cookies" element={
          <MainLayout>
            <CookiesPolicyPage />
          </MainLayout>
        } />

        <Route path="/feedback" element={
          <MainLayout>
            <FeedbackPage />
          </MainLayout>
        } />
        
        <Route path="/" element={
          <MainLayout>
            <HomeContent />
          </MainLayout>
        } />
        
        {/* Services Routes */}
        <Route path="/services" element={
          <MainLayout>
            <ServicesPage />
          </MainLayout>
        } />
        
        <Route path="/services/:id" element={
          <MainLayout>
            <BusinessDetailPage />
          </MainLayout>
        } />

         {/* Profile Route - Protected */}
        <Route path="/profile" element={
          <ProtectedRoute requiredRoles={['user', 'admin']}>
            <MainLayout>
              <UserProfilePage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* News Routes */}
        <Route path="/news" element={
          <MainLayout>
            <NewsLayout>
              <CarNewsPage />
            </NewsLayout>
          </MainLayout>
        } />
        
        <Route path="/news/category/:category" element={
          <MainLayout>
            <NewsLayout>
              <CarNewsPage />
            </NewsLayout>
          </MainLayout>
        } />
        
        <Route path="/news/tag/:tag" element={
          <MainLayout>
            <NewsLayout>
              <CarNewsPage />
            </NewsLayout>
          </MainLayout>
        } />
        
        <Route path="/news/article/:articleId" element={
          <MainLayout>
            <NewsLayout>
              <NewsArticle />
            </NewsLayout>
          </MainLayout>
        } />
        
        <Route path="/news/reviews" element={
          <MainLayout>
            <NewsLayout>
              <PlaceholderPage title="Car Reviews" />
            </NewsLayout>
          </MainLayout>
        } />
        
        <Route path="/news/releases" element={
          <MainLayout>
            <NewsLayout>
              <PlaceholderPage title="New Releases" />
            </NewsLayout>
          </MainLayout>
        } />
        
        <Route path="/news/industry" element={
          <MainLayout>
            <NewsLayout>
              <PlaceholderPage title="Industry News" />
            </NewsLayout>
          </MainLayout>
        } />

        <Route path="/videos" element={
          <MainLayout>
            <VideoSection />
          </MainLayout>
        } />
          
        {/* Rental Vehicles Routes */}
        <Route path="/rentals/:rentalId" element={
          <MainLayout>
            <RentalVehicleDetail />
          </MainLayout>
        } />

        {/* Trailer Rental Routes */}
        <Route path="/trailer-rentals" element={
          <MainLayout>
            <PlaceholderPage title="Trailer Rentals" />
          </MainLayout>
        } />
        
        <Route path="/trailers/:trailerId" element={
          <MainLayout>
            <PlaceholderPage title="Trailer Details" />
          </MainLayout>
        } />

        {/* Public Transport Routes */}
        <Route path="/public-transport" element={
          <MainLayout>
            <PublicTransportPage />
          </MainLayout>
        } />

        <Route path="/transport-routes/:routeId" element={
          <MainLayout>
            <TransportRouteDetail />
          </MainLayout>
        } />

        <Route path="/service-provider-request" element={
          <MainLayout>
            <ServiceProviderRequest />
          </MainLayout>
        } />

        <Route path="/ministry-request" element={
          <MainLayout>
            <MinistryRequest />
          </MainLayout>
        } />

        {/* Marketplace Routes */}
        <Route path="/marketplace" element={
          <MainLayout>
            <MarketplaceList />
          </MainLayout>
        } />
        
        <Route path="/marketplace/new" element={
          <MainLayout>
            <PlaceholderPage title="New Cars" />
          </MainLayout>
        } />
        
        <Route path="/marketplace/used" element={
          <MainLayout>
            <PlaceholderPage title="Used Cars" />
          </MainLayout>
        } />
        
        <Route path="/marketplace/deals" element={
          <MainLayout>
            <PlaceholderPage title="Special Deals" />
          </MainLayout>
        } />
        
        <Route path="/marketplace/:carId" element={
          <MainLayout>
            <CarMarketPlace />
          </MainLayout>
        } />

        {/* Car reviews routes */}
        <Route path="/reviews" element={
          <MainLayout>
            <CarReviewsPage />
          </MainLayout>
        } />

        <Route path="/reviews/:carModel" element={
          <MainLayout>
            <CarReviewsPage />
          </MainLayout>
        } />

        <Route path="/reviews/submit" element={
          <MainLayout>
            <CarReviewsPage />
          </MainLayout>
        } />

        {/* Other Public Routes */}
        <Route path="/parts/*" element={
          <MainLayout>
            <PlaceholderPage title="Parts Sales" />
          </MainLayout>
        } />
        
        {/* Dealerships Routes */}
        <Route path="/dealerships" element={
          <MainLayout>
            <DealershipsPage />
          </MainLayout>
        } />

        <Route path="/dealerships/:id" element={
          <MainLayout>
            <BusinessDetailPage />
          </MainLayout>
        } />
        
        {/* GION Dashboards */}
        <Route path="/gion/ministry" element={
          <ProtectedRoute requiredRoles={['ministry', 'admin']}>
            <MinistryDashboard />
          </ProtectedRoute>
        } />

        <Route path="/gion/provider" element={
          <ProtectedRoute requiredRoles={['provider', 'admin']}>
            <ServiceProviderDashboard />
          </ProtectedRoute>
        } />

        <Route path="/gion/provider/service/:id" element={
          <ProtectedRoute requiredRoles={['provider', 'admin']}>
            <ServiceProviderDashboard />
          </ProtectedRoute>
        } />

        {/* 404 Route */}
        <Route path="*" element={
          <MainLayout>
            <PlaceholderPage title="404 - Page Not Found" />
          </MainLayout>
        } />
      </Routes>
    </Suspense>
  );
};

// Enhanced App component with comprehensive analytics and error handling
function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [analyticsInitialized, setAnalyticsInitialized] = useState(false);
  const appStartTime = React.useRef(Date.now());

  const { showModal: showWelcomeModal, hideModal: hideWelcomeModal } = useWelcomeModal();

  // Enhanced Google Analytics initialization
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        console.log('Initializing analytics systems...');
        
        // Initialize Google Analytics
        await initializeGA();
        
        // Track app initialization
        if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
          internalAnalytics.trackEvent('app_init', {
            category: 'system',
            metadata: {
              timestamp: new Date().toISOString(),
              userAgent: navigator.userAgent,
              screenResolution: typeof window !== 'undefined' && window.screen ? 
                `${window.screen.width}x${window.screen.height}` : 'unknown',
              viewport: `${window.innerWidth}x${window.innerHeight}`,
              language: navigator.language,
              platform: navigator.platform,
              cookieEnabled: navigator.cookieEnabled,
              connectionType: navigator.connection?.effectiveType || 'unknown',
              deviceMemory: navigator.deviceMemory || 'unknown',
              hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
            }
          });
        }
        
        setAnalyticsInitialized(true);
        console.log('Analytics systems initialized successfully');
        
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
        
        // Track initialization failure
        if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
          internalAnalytics.trackEvent('error', {
            category: 'system',
            metadata: {
              errorType: 'AnalyticsInitializationFailed',
              errorMessage: error.message,
              timestamp: new Date().toISOString()
            }
          });
        }
      }
    };

    initializeAnalytics();
  }, []);

  // Enhanced error handling setup
  useEffect(() => {
    // Track unhandled JavaScript errors
    const handleError = (event) => {
      console.error('Unhandled error:', event.error);
      
      if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
        internalAnalytics.trackEvent('error', {
          category: 'system',
          metadata: {
            errorType: 'UnhandledError',
            errorMessage: event.error?.message || 'Unknown error',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack,
            timestamp: new Date().toISOString(),
            page: window.location.pathname
          }
        });
      }
      
      trackException(event.error?.message || 'Unknown error', false);
    };

    // Track unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
        internalAnalytics.trackEvent('error', {
          category: 'system',
          metadata: {
            errorType: 'UnhandledPromiseRejection',
            errorMessage: event.reason?.message || 'Unknown promise rejection',
            reason: String(event.reason),
            timestamp: new Date().toISOString(),
            page: window.location.pathname
          }
        });
      }
    };

    // Track session end
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - appStartTime.current;
      
      if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
        internalAnalytics.trackEvent('session_end', {
          category: 'system',
          metadata: {
            sessionDuration,
            exitPage: window.location.pathname,
            timestamp: new Date().toISOString()
          }
        });
      }
    };

    // Track visibility changes (tab switching)
    const handleVisibilityChange = () => {
      if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
        internalAnalytics.trackEvent('visibility_change', {
          category: 'interaction',
          metadata: {
            visibilityState: document.visibilityState,
            page: window.location.pathname,
            timestamp: new Date().toISOString()
          }
        });
      }
    };

    // Set up event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Enhanced image cache cleanup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cleanupFailedImages = () => {
          const failedImages = JSON.parse(localStorage.getItem('failedImages') || '{}');
          const now = Date.now();
          let cleaned = false;
          
          // Remove entries older than 24 hours
          Object.keys(failedImages).forEach(key => {
            if (now - failedImages[key] > 24 * 60 * 60 * 1000) {
              delete failedImages[key];
              cleaned = true;
            }
          });
          
          // Limit size to prevent localStorage bloat
          const keys = Object.keys(failedImages);
          if (keys.length > 100) {
            const sortedKeys = keys.sort((a, b) => failedImages[a] - failedImages[b]);
            const keysToRemove = sortedKeys.slice(0, keys.length - 100);
            keysToRemove.forEach(key => {
              delete failedImages[key];
            });
            cleaned = true;
          }
          
          if (cleaned) {
            localStorage.setItem('failedImages', JSON.stringify(failedImages));
          }
        };

        // Run cleanup on initialization
        cleanupFailedImages();
        
        // Set interval for periodic cleanup (once an hour)
        const cleanupInterval = setInterval(cleanupFailedImages, 60 * 60 * 1000);
        
        return () => clearInterval(cleanupInterval);
      } catch (e) {
        console.warn('Error in image cache cleanup:', e);
      }
    }
  }, []);

  // Check if this is the first visit in this session
  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (hasVisited) {
      setShowSplash(false);
    } else {
      sessionStorage.setItem('hasVisited', 'true');
    }
  }, []);

  const handleSplashFinished = () => {
    setShowSplash(false);
    
    // Track splash screen completion
    if (internalAnalytics && typeof internalAnalytics.trackEvent === 'function') {
      internalAnalytics.trackEvent('splash_complete', {
        category: 'interaction',
        metadata: {
          splashDuration: Date.now() - appStartTime.current,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  if (showSplash) {
    return <SplashScreen onFinished={handleSplashFinished} />;
  }

  return (
    <AppErrorBoundary>
      <Router>
        <AuthProvider>
          <InternalAnalyticsProvider>
            <AnalyticsWrapper>
              <div className="App">
                {process.env.NODE_ENV === 'development' && <ConnectionTest />}
                <AppRoutes />
                {/* <Chatbot /> */}
                {false && (
  <GIONApp withChatbot={false} />
)}

                 {/* Add this WelcomeModal component */}
                {showWelcomeModal && (
                  <WelcomeModal onClose={hideWelcomeModal} />
                )}
              </div>
            </AnalyticsWrapper>
          </InternalAnalyticsProvider>
        </AuthProvider>
      </Router>
    </AppErrorBoundary>
  );
}

export default App;