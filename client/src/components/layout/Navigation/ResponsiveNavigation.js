// src/components/layout/Navigation/ResponsiveNavigation.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, ShoppingBag, Store, Settings, User, LogIn, LogOut, 
  UserCircle, Star, QrCode, Hash, X, UserPlus, Newspaper, 
  MessageCircle, Menu, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';
import EnhancedFABModal from './EnhancedFABModal.js';
import './ResponsiveNavigation.css';

// Updated navigation categories
const categories = [
  {
    id: 'home',
    name: 'Home',
    path: '/home',
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
    id: 'news',
    name: 'News',
    path: '/news',
    icon: <Newspaper size={20} />,
    desktopOnly: true
  },
  {
    id: 'profile',
    name: 'Profile',
    path: '/profile',
    icon: <User size={20} />
  }
];

// NEW: Menu Button Component with Dropdown
const NavigationMenu = ({ onFeedbackClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState('dark'); // default dark mode
  const [showNotification, setShowNotification] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const menuRef = useRef(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Check if user has interacted with feedback before
  useEffect(() => {
    const hasInteractedBefore = localStorage.getItem('feedback_interacted');
    setHasInteracted(!!hasInteractedBefore);

    // Show notification after some time if user hasn't interacted before
    if (!hasInteractedBefore) {
      const timer = setTimeout(() => {
        setShowNotification(true);
      }, 30000); // Show after 30 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  // Randomly show notification for returning users
  useEffect(() => {
    if (hasInteracted) {
      const shouldShowNotification = Math.random() < 0.1; // 10% chance
      if (shouldShowNotification) {
        const timer = setTimeout(() => {
          setShowNotification(true);
        }, 60000); // Show after 1 minute

        return () => clearTimeout(timer);
      }
    }
  }, [hasInteracted]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleMenuToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    setIsOpen(false);
  };

  const handleFeedbackClick = () => {
    setIsOpen(false);
    setShowNotification(false);
    setHasInteracted(true);
    localStorage.setItem('feedback_interacted', 'true');
    onFeedbackClick();
  };

  const dismissNotification = (e) => {
    e.stopPropagation();
    setShowNotification(false);
  };

  return (
    <div className="navigation-menu-container" ref={menuRef}>
      <button 
        className="navigation-menu-button"
        onClick={handleMenuToggle}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
      >
        <Menu size={18} />
        
        {/* Notification bubble - only show when menu is closed */}
        {showNotification && !isOpen && (
          <div className="menu-notification-badge">
            <span>!</span>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="navigation-dropdown-menu">
          {/* Theme Toggle */}
          <button 
            className="menu-item theme-toggle-item"
            onClick={handleThemeToggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="menu-item-icon">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </span>
            <span className="menu-item-text">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* Divider */}
          <div className="menu-divider"></div>

          {/* Feedback Button */}
          <button 
            className="menu-item feedback-item"
            onClick={handleFeedbackClick}
            aria-label="Go to feedback page"
          >
            <span className="menu-item-icon">
              <MessageCircle size={16} />
            </span>
            <span className="menu-item-text">
              Feedback
            </span>
            {showNotification && (
              <span className="menu-item-badge">New</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// Desktop User Menu Component
const DesktopUserMenu = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="desktop-user-menu">
        <button 
          className="auth-button login-button"
          onClick={() => navigate('/login')}
          aria-label="Login"
        >
          <LogIn size={16} />
          <span>Login</span>
        </button>
        <button 
          className="auth-button signup-button"
          onClick={() => navigate('/signup')}
          aria-label="Sign up"
        >
          <UserPlus size={16} />
          <span>Sign Up</span>
        </button>
      </div>
    );
  }

  const getUserInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const getUserRole = () => {
    if (user?.role === 'admin') return 'Admin';
    if (user?.role === 'dealer') return 'Dealer';
    if (user?.role === 'moderator') return 'Moderator';
    return 'User';
  };

  return (
    <div className="desktop-user-menu">
      <Link to="/profile" className="user-profile-link">
        {user?.profilePicture ? (
          <img 
            src={user.profilePicture} 
            alt={user?.name || 'User'} 
            className="user-profile-avatar"
          />
        ) : (
          <div className="user-profile-avatar user-avatar-placeholder">
            {getUserInitial()}
          </div>
        )}
        <div className="user-profile-info">
          <span className="user-profile-name">
            {user?.name || user?.email || 'User'}
          </span>
          <span className="user-profile-role">{getUserRole()}</span>
        </div>
      </Link>
      <button 
        className="auth-button logout-button"
        onClick={logout}
        aria-label="Logout"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
};

// Breadcrumb Component - UPDATED to use NavigationMenu
const Breadcrumb = ({ paths, onFeedbackClick }) => (
  <nav className="breadcrumb-container" aria-label="Breadcrumb">
    <div className="breadcrumb-content">
      <ol className="breadcrumb-list">
        {paths.map((path, index) => (
          <React.Fragment key={index}>
            {index > 0 && <li className="breadcrumb-separator" aria-hidden="true">/</li>}
            <li 
              className="breadcrumb-item" 
              aria-current={index === paths.length - 1 ? "page" : undefined}>
              {path.url ? (
                <Link to={path.url}>{path.label}</Link>
              ) : (
                <span>{path.label}</span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
      
      {/* NEW: Navigation Menu (replaces feedback button) */}
      <NavigationMenu onFeedbackClick={onFeedbackClick} />
    </div>
  </nav>
);

// Enhanced Review FAB Component 
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
    } else {
      setShowReviewModal(true);
    }
  };

  const handleReviewSubmit = (reviewData) => {
    console.log('Review submitted:', reviewData);
    setShowReviewModal(false);
  };

  return (
    <>
      <button 
        className={`review-fab ${isVisible ? 'visible' : 'hidden'}`}
        onClick={handleFABClick}
        aria-label="Leave a review"
      >
        <Star size={24} fill="white" />
      </button>

      <EnhancedFABModal 
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleReviewSubmit}
      />
    </>
  );
};

// Main ResponsiveNavigation component
const ResponsiveNavigation = () => {
  const [activePath, setActivePath] = useState([]);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef();

  // Build breadcrumb from current path
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    pathSegments.forEach((segment, index) => {
      const currentPath = `/${pathSegments.slice(0, index + 1).join('/')}`;
      const category = categories.find(cat => cat.path === currentPath);
      
      breadcrumbs.push({
        label: category ? category.name : segment.charAt(0).toUpperCase() + segment.slice(1),
        url: index === pathSegments.length - 1 ? null : currentPath
      });
    });
    
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
    navigate(path);
    setTimeout(() => {
      setIsNavigating(false);
    }, 300);
  };

  // Handle feedback button click - Navigate to feedback page
  const handleFeedbackClick = () => {
    navigate('/feedback');
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
        {/* Breadcrumb with navigation menu */}
        <Breadcrumb paths={activePath} onFeedbackClick={handleFeedbackClick} />
        
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
            {categories.filter(category => category.id !== 'profile').map((category) => (
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
        {categories.filter(category => !category.desktopOnly).map((category) => (
          <button
            key={category.id}
            className={`mobile-nav-item ${isActive(category.path) ? 'active' : ''} ${isNavigating ? 'navigating' : ''}`}
            onClick={() => handleNavigation(category.path)}
            aria-label={category.name}
          >
            <span className="mobile-nav-icon">{category.icon}</span>
            <span className="mobile-nav-label">{category.name}</span>
          </button>
        ))}
      </nav>

      {/* Enhanced Review FAB */}
      <ReviewFAB />
    </>
  );
};

export default ResponsiveNavigation;