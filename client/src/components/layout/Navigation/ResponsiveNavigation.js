// client/src/components/layout/Navigation/ResponsiveNavigation.js
// COMPLETE VERSION - Slim Profile Link & No Dropdown
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, ShoppingBag, Store, Settings, User, LogIn, LogOut, 
  UserCircle, UserPlus, Star, QrCode, Hash, X, Menu
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';
import ReviewForm from '../../ReviewForm/ReviewForm.js';
import QRCodeScanner from '../../QRScanner/QRCodeScanner.js';
import './ResponsiveNavigation.css';

// Updated navigation categories - Profile hidden on desktop
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
          message: 'Please login to leave a review' 
        } 
      });
      return;
    }
    setShowReviewModal(true);
  };

  const handleMethodSelect = (method) => {
    setReviewMethod(method);
    if (method === 'qr_scan') {
      setShowQRScanner(true);
      setShowReviewModal(false);
    }
  };

  const handleServiceCodeSubmit = () => {
    if (serviceCode.trim()) {
      // Handle service code review submission
      console.log('Service code:', serviceCode);
      setShowReviewModal(false);
      setServiceCode('');
    }
  };

  const handleQRScanResult = (result) => {
    setShowQRScanner(false);
    // Handle QR scan result
    console.log('QR scan result:', result);
  };

  if (!isVisible) return null;

  return (
    <>
      <button 
        className={`review-fab ${isVisible ? 'visible' : 'hidden'}`}
        onClick={handleFABClick}
        aria-label="Leave a review"
      >
        <Star size={20} />
        <span className="fab-text">Review</span>
      </button>

      {/* Review Method Selection Modal */}
      {showReviewModal && (
        <div className="bcc-modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="bcc-modal-content" onClick={e => e.stopPropagation()}>
            <div className="bcc-modal-header">
              <h3>How would you like to review?</h3>
              <button 
                className="bcc-modal-close"
                onClick={() => setShowReviewModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="bcc-method-selection">
              <button 
                className="bcc-method-option"
                onClick={() => handleMethodSelect('qr_scan')}
              >
                <QrCode size={24} />
                <div>
                  <h3>Scan QR Code</h3>
                  <p>Scan the service provider's QR code</p>
                </div>
              </button>
              
              <button 
                className="bcc-method-option"
                onClick={() => setReviewMethod('service_code')}
              >
                <Hash size={24} />
                <div>
                  <h3>Enter Service Code</h3>
                  <p>Enter the service code manually</p>
                </div>
              </button>
            </div>

            {reviewMethod === 'service_code' && (
              <div className="bcc-service-code-form">
                <p>Please enter the service code provided by your service provider:</p>
                <input
                  type="text"
                  className="bcc-service-code-input"
                  placeholder="Enter service code"
                  value={serviceCode}
                  onChange={(e) => setServiceCode(e.target.value.toUpperCase())}
                  maxLength={10}
                />
                <div className="bcc-service-code-actions">
                  <button 
                    className="bcc-cancel-button"
                    onClick={() => {
                      setReviewMethod(null);
                      setServiceCode('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="bcc-submit-button"
                    onClick={handleServiceCodeSubmit}
                    disabled={!serviceCode.trim()}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="bcc-modal-overlay">
          <div className="bcc-modal-content qr-scanner-modal">
            <QRCodeScanner
              onResult={handleQRScanResult}
              onClose={() => {
                setShowQRScanner(false);
                setShowReviewModal(true);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

// Slim Desktop User Menu Component (NO DROPDOWN)
const DesktopUserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="desktop-auth-buttons">
        <Link to="/login" className="auth-button login-button">
          <LogIn size={16} />
          Login
        </Link>
        <Link to="/register" className="auth-button register-button">
          <UserPlus size={16} />
          Sign Up
        </Link>
      </div>
    );
  }

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

  // Scroll to top on navigation
  useEffect(() => {
    const handleScrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    };

    const timeoutId = setTimeout(handleScrollToTop, 100);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  // Disable browser scroll restoration
  useEffect(() => {
    if (typeof window !== 'undefined' && window.history && window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }
  
    return () => {
      if (typeof window !== 'undefined' && window.history && window.history.scrollRestoration) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  // Build active path for breadcrumbs
  useEffect(() => {
    const pathname = location.pathname;
    const pathSegments = pathname.split('/').filter(Boolean);
    
    const breadcrumbs = [];
    
    if (pathSegments.length > 0) {
      let currentPath = '';
      
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        
        const segmentName = (() => {
          switch (segment) {
            case 'marketplace': return 'Car Sales';
            case 'dealerships': return 'Dealerships';
            case 'services': return 'Services';
            case 'profile': return 'Profile';
            case 'admin': return 'Admin';
            case 'dashboard': return 'Dashboard';
            default: 
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

  // Check if category navigation should show scroll buttons
  useEffect(() => {
    const checkOverflow = () => {
      if (navRef.current) {
        const { scrollWidth, clientWidth } = navRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, []);

  // Handle navigation with loading state
  const handleNavigation = async (path) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    try {
      navigate(path);
      // Add small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 150));
    } finally {
      setIsNavigating(false);
    }
  };

  // Check if current path is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Handle horizontal scrolling for category navigation
  const handleScroll = (direction) => {
    if (navRef.current) {
      const scrollAmount = 200;
      const scrollLeft = direction === 'left' 
        ? navRef.current.scrollLeft - scrollAmount
        : navRef.current.scrollLeft + scrollAmount;
      
      navRef.current.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <div className="navigation-container">
        {/* Breadcrumb Navigation */}
        {activePath.length > 0 && <Breadcrumb paths={activePath} />}
        
        {/* Main Category Navigation */}
        <nav className="category-nav">
          {showScrollButtons && (
            <button 
              className="nav-scroll-button nav-scroll-left"
              onClick={() => handleScroll('left')}
              aria-label="Scroll categories left"
            >
              ‹
            </button>
          )}

          <ul className="category-list" ref={navRef}>
            {categories.map((category) => (
              <li key={category.id} className="category-item" data-nav={category.id}>
                <Link
                  to={category.path}
                  className={`category-link ${isActive(category.path) ? 'active' : ''}`}
                  role="menuitem"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation(category.path);
                  }}
                >
                  {category.icon}
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
        </nav>
      </div>

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