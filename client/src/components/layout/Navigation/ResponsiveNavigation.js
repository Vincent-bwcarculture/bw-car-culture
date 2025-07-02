// src/components/layout/Navigation/ResponsiveNavigation.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, ShoppingBag, Store, Settings, User, LogIn, LogOut, 
  UserCircle, ChevronDown, Star, MessageSquare, Plus, X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';
import './ResponsiveNavigation.css';

// Updated navigation categories - replaced News with Profile
const categories = [
  {
    id: 'home',
    name: 'Home',
    path: '/',
    icon: <Home size={20} />
  },
  {
    id: 'marketplace',
    name: 'Car Sales',
    path: '/marketplace',
    icon: <ShoppingBag size={20} />
  },
  {
    id: 'dealerships',
    name: 'Dealerships',
    path: '/dealerships',
    icon: <Store size={20} />
  },
  {
    id: 'services',
    name: 'Services',
    path: '/services',
    icon: <Settings size={20} />
  },
  {
    id: 'profile',
    name: 'Profile',
    path: '/profile',
    icon: <User size={20} />
  }
];

// Review FAB Component for mobile devices
const ReviewFAB = () => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Hide/show FAB on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide FAB when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleFABClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { 
          from: window.location.pathname,
          message: 'Please login to leave a review' 
        }
      });
      return;
    }
    
    // For now, redirect to a general review page or open modal
    // This can be enhanced to detect current business context
    setShowReviewModal(true);
  };

  const handleReviewSubmit = (reviewData) => {
    console.log('Review submitted:', reviewData);
    setShowReviewModal(false);
    // Handle review submission logic here
  };

  return (
    <>
      <button 
        className={`review-fab ${isVisible ? 'visible' : 'hidden'}`}
        onClick={handleFABClick}
        title={isAuthenticated ? 'Leave a quick review' : 'Login to leave a review'}
        aria-label="Quick review"
      >
        <Star size={24} />
        <span className="fab-text">Review</span>
      </button>

      {/* Simple Review Modal */}
      {showReviewModal && (
        <div className="review-fab-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="review-fab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="review-fab-modal-header">
              <h3>Quick Review</h3>
              <button 
                className="review-fab-close"
                onClick={() => setShowReviewModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="review-fab-content">
              <p>Select what you'd like to review:</p>
              
              <div className="review-options">
                <button 
                  className="review-option"
                  onClick={() => {
                    setShowReviewModal(false);
                    navigate('/marketplace?action=review');
                  }}
                >
                  <ShoppingBag size={20} />
                  <span>Car Purchase</span>
                </button>
                
                <button 
                  className="review-option"
                  onClick={() => {
                    setShowReviewModal(false);
                    navigate('/dealerships?action=review');
                  }}
                >
                  <Store size={20} />
                  <span>Dealership</span>
                </button>
                
                <button 
                  className="review-option"
                  onClick={() => {
                    setShowReviewModal(false);
                    navigate('/services?action=review');
                  }}
                >
                  <Settings size={20} />
                  <span>Service</span>
                </button>
              </div>
              
              <p className="review-fab-hint">
                Or visit any business page to leave a specific review
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Desktop User Menu Component
const DesktopUserMenu = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="desktop-auth-buttons">
        <Link to="/login" className="auth-button login-button">
          <LogIn size={16} />
          Login
        </Link>
        <Link to="/register" className="auth-button register-button">
          <User size={16} />
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="desktop-user-menu" ref={userMenuRef}>
      <button 
        className="user-menu-trigger"
        onClick={() => setShowUserMenu(!showUserMenu)}
      >
        <div className="user-avatar">
          {user?.avatar?.url ? (
            <img src={user.avatar.url} alt={user.name || 'User'} />
          ) : (
            <UserCircle size={32} />
          )}
        </div>
        <div className="user-info">
          <span className="user-name">{user?.name || 'User'}</span>
          <span className="user-role">{user?.role || 'Member'}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`dropdown-arrow ${showUserMenu ? 'rotated' : ''}`}
        />
      </button>

      {showUserMenu && (
        <div className="user-dropdown-menu">
          <div className="user-menu-header">
            <div className="user-menu-avatar">
              {user?.avatar?.url ? (
                <img src={user.avatar.url} alt={user.name || 'User'} />
              ) : (
                <UserCircle size={40} />
              )}
            </div>
            <div className="user-menu-info">
              <strong>{user?.name || 'User'}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          
          <div className="user-menu-divider"></div>
          
          <div className="user-menu-items">
            <button 
              className="user-menu-item"
              onClick={() => {
                navigate('/profile');
                setShowUserMenu(false);
              }}
            >
              <User size={16} />
              My Profile
            </button>
            
            <button 
              className="user-menu-item"
              onClick={() => {
                navigate('/profile?tab=favorites');
                setShowUserMenu(false);
              }}
            >
              <ShoppingBag size={16} />
              My Favorites
            </button>
            
            <button 
              className="user-menu-item"
              onClick={() => {
                navigate('/profile?tab=reviews');
                setShowUserMenu(false);
              }}
            >
              <Star size={16} />
              My Reviews
            </button>
            
            {user?.role === 'admin' && (
              <button 
                className="user-menu-item admin-link"
                onClick={() => {
                  navigate('/admin/dashboard');
                  setShowUserMenu(false);
                }}
              >
                <Settings size={16} />
                Admin Panel
              </button>
            )}
          </div>
          
          <div className="user-menu-divider"></div>
          
          <button 
            className="user-menu-item logout-item"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

// Breadcrumb component
const Breadcrumb = ({ paths }) => (
  <nav className="breadcrumb-container" aria-label="Breadcrumb">
    <ol className="breadcrumb-list">
      <li className="breadcrumb-item">
        <Link to="/">Home</Link>
      </li>
      {paths.map((path, index) => (
        <React.Fragment key={index}>
          <span className="breadcrumb-separator" aria-hidden="true">›</span>
          <li className="breadcrumb-item" aria-current={index === paths.length - 1 ? "page" : undefined}>
            {path.url ? <Link to={path.url}>{path.name}</Link> : <span>{path.name}</span>}
          </li>
        </React.Fragment>
      ))}
    </ol>
  </nav>
);

// Main Navigation Component
const ResponsiveNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState([]);
  const navRef = useRef(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // FIXED: Scroll to top on navigation - removed global history usage
  useEffect(() => {
    const handleScrollToTop = () => {
      // Smooth scroll to top when location changes
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    };

    // Set a slight delay to ensure the page has rendered
    const timeoutId = setTimeout(handleScrollToTop, 100);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  // Disable browser scroll restoration
  useEffect(() => {
    // Use modern approach for scroll restoration
    if (typeof window !== 'undefined' && window.history && window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Build active path for breadcrumbs
  useEffect(() => {
    const pathname = location.pathname;
    const pathSegments = pathname.split('/').filter(Boolean);
    
    const breadcrumbs = [];
    
    // Dynamic breadcrumb generation
    if (pathSegments.length > 0) {
      let currentPath = '';
      
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        
        // Map common paths to readable names
        const segmentName = (() => {
          switch (segment) {
            case 'marketplace': return 'Car Sales';
            case 'dealerships': return 'Dealerships';
            case 'services': return 'Services';
            case 'profile': return 'Profile';
            case 'admin': return 'Admin';
            case 'dashboard': return 'Dashboard';
            default: 
              // Capitalize first letter and replace hyphens/underscores
              return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/[-_]/g, ' ');
          }
        })();
        
        breadcrumbs.push({
          name: segmentName,
          url: index === pathSegments.length - 1 ? null : currentPath
        });
      });
    }
    
    setActivePath(breadcrumbs);
  }, [location.pathname]);

  // Enhanced scroll detection for navigation buttons
  useEffect(() => {
    const checkScrollable = () => {
      const list = navRef.current?.querySelector('.category-list');
      if (list) {
        const isScrollable = list.scrollWidth > list.clientWidth;
        setShowScrollButtons(isScrollable);
      }
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, []);

  // Scroll navigation handler
  const handleScroll = (direction) => {
    const list = navRef.current?.querySelector('.category-list');
    if (list) {
      if (direction === 'left') {
        const scrollAmount = window.innerWidth <= 480 ? -150 : -200;
        list.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      } else {
        const scrollAmount = window.innerWidth <= 480 ? 150 : 200;
        list.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        });
      }
    }
  };

  // Enhanced navigation handler with scroll fix
  const handleNavigation = (path) => {
    setIsNavigating(true);
    
    // Navigate to the path
    navigate(path);
    
    // Reset navigation state after a short delay
    setTimeout(() => {
      setIsNavigating(false);
    }, 300);
  };

  // Check if a category is active
  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    return path !== '/' && location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Top Navigation */}
      <nav className="navigation-container" ref={navRef}>
        {/* Breadcrumb always visible */}
        <Breadcrumb paths={activePath} />
        
        {/* Desktop Category Navigation with User Menu */}
        <div className="category-nav desktop-only">
          {showScrollButtons && (
            <button 
              className="nav-scroll-button nav-scroll-left"
              onClick={() => handleScroll('left')}
              aria-label="Scroll categories left"
            >
              ‹
            </button>
          )}

          <ul className="category-list" role="menubar">
            {categories.map((category) => (
              <li key={category.id} className="category-item" role="none">
                <Link
                  to={category.path}
                  className={`category-link ${isActive(category.path) ? 'active' : ''}`}
                  role="menuitem"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation(category.path);
                  }}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop User Menu */}
          <DesktopUserMenu />

          {showScrollButtons && (
            <button 
              className="nav-scroll-button nav-scroll-right"
              onClick={() => handleScroll('right')}
              aria-label="Scroll categories right"
            >
              ›
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`mobile-nav-item ${isActive(category.path) ? 'active' : ''} ${isNavigating ? 'navigating' : ''}`}
            onClick={() => handleNavigation(category.path)}
            disabled={isNavigating}
          >
            <div className="mobile-nav-icon">{category.icon}</div>
            <div className="mobile-nav-label">{category.name}</div>
          </button>
        ))}
      </nav>

      {/* Review FAB - Only show on mobile/tablet */}
      <ReviewFAB />
    </>
  );
};

export default ResponsiveNavigation;