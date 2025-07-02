// src/components/layout/Navigation/ResponsiveNavigation.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, ShoppingBag, Store, Settings, User, LogIn, LogOut, 
  UserCircle, Star, QrCode, Hash, X, UserPlus
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';
import ReviewForm from '../../ReviewForm/ReviewForm.js';
import QRCodeScanner from '../../QRScanner/QRCodeScanner.js';
import './ResponsiveNavigation.css';

// Updated navigation categories - Profile removed from main nav
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
  const [reviewMethod, setReviewMethod] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [serviceCode, setServiceCode] = useState('');
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
          message: 'Please log in to leave a review'
        }
      });
      return;
    }
    setShowReviewModal(true);
  };

  const handleReviewMethodSelect = (method) => {
    setReviewMethod(method);
    if (method === 'qr') {
      setShowQRScanner(true);
    }
  };

  const handleQRScanResult = (result) => {
    setServiceCode(result);
    setShowQRScanner(false);
  };

  const handleCloseAll = () => {
    setShowReviewModal(false);
    setShowQRScanner(false);
    setReviewMethod(null);
    setServiceCode('');
  };

  return (
    <>
      <button 
        className={`review-fab ${isVisible ? 'visible' : 'hidden'}`}
        onClick={handleFABClick}
        aria-label="Leave a review"
      >
        <Star size={24} fill="currentColor" />
      </button>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="review-modal-overlay" onClick={handleCloseAll}>
          <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={handleCloseAll}>
              <X size={20} />
            </button>
            
            {!reviewMethod && (
              <div className="review-method-selector">
                <h3>How would you like to leave a review?</h3>
                <div className="review-method-buttons">
                  <button 
                    className="method-button"
                    onClick={() => handleReviewMethodSelect('qr')}
                  >
                    <QrCode size={24} />
                    Scan QR Code
                  </button>
                  <button 
                    className="method-button"
                    onClick={() => handleReviewMethodSelect('code')}
                  >
                    <Hash size={24} />
                    Enter Service Code
                  </button>
                </div>
              </div>
            )}

            {reviewMethod === 'code' && (
              <div className="service-code-input">
                <h3>Enter Service Code</h3>
                <input
                  type="text"
                  placeholder="Enter service code"
                  value={serviceCode}
                  onChange={(e) => setServiceCode(e.target.value)}
                  className="code-input"
                />
                <div className="code-input-buttons">
                  <button 
                    className="back-button"
                    onClick={() => setReviewMethod(null)}
                  >
                    Back
                  </button>
                  <button 
                    className="continue-button"
                    onClick={() => {
                      if (serviceCode.trim()) {
                        // Continue with review process
                      }
                    }}
                    disabled={!serviceCode.trim()}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {(reviewMethod && serviceCode) && (
              <ReviewForm 
                serviceCode={serviceCode}
                onSubmitSuccess={handleCloseAll}
                onCancel={handleCloseAll}
              />
            )}
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="qr-scanner-overlay" onClick={() => setShowQRScanner(false)}>
          <div className="qr-scanner-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="scanner-close-button" 
              onClick={() => setShowQRScanner(false)}
            >
              <X size={20} />
            </button>
            <QRCodeScanner 
              onScanResult={handleQRScanResult}
              onError={(error) => {
                console.error('QR Scan Error:', error);
                setShowQRScanner(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

// Updated Desktop User Menu - Simple Profile Link (No Dropdown)
const DesktopUserMenu = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="desktop-auth-buttons">
        <Link to="/login" className="auth-button login-button">
          <LogIn size={18} />
          Login
        </Link>
        <Link to="/register" className="auth-button register-button">
          <UserPlus size={18} />
          Sign Up
        </Link>
      </div>
    );
  }

  // Simple profile link - no dropdown
  return (
    <Link to="/profile" className="user-profile-link">
      <div className="user-profile-avatar">
        {user?.avatar?.url ? (
          <img src={user.avatar.url} alt={user.name || 'User'} />
        ) : (
          <UserCircle size={24} />
        )}
      </div>
      <div className="user-profile-info">
        <span className="user-profile-name">{user?.name || 'User'}</span>
        <span className="user-profile-role">{user?.role || 'Member'}</span>
      </div>
    </Link>
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
            {path.url ? (
              <Link to={path.url}>{path.label}</Link>
            ) : (
              <span>{path.label}</span>
            )}
          </li>
        </React.Fragment>
      ))}
    </ol>
  </nav>
);

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