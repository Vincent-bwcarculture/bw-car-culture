// src/components/layout/Navigation/ResponsiveNavigation.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, ShoppingBag, Store, Settings, User, LogIn, LogOut, 
  UserCircle, Star, QrCode, Hash, X, UserPlus, Newspaper
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';
import EnhancedFABModal from './EnhancedFABModal.js';
import './ResponsiveNavigation.css';

// Updated navigation categories - News added for desktop, Profile kept for mobile
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
    id: 'news',
    name: 'News',
    path: '/news',
    icon: <Newspaper size={20} />,
    desktopOnly: true // Only show on bigger displays
  },
  {
    id: 'profile',
    name: 'Profile',
    path: '/profile',
    icon: <User size={20} />
  }
];

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
          message: 'Please log in to leave a review'
        }
      });
      return;
    }
    setShowReviewModal(true);
  };

  // Handle review submission from enhanced modal
  const handleReviewSubmit = (method, data) => {
    console.log('Review method selected:', method, data);
    
    switch (method) {
      case 'qr':
        if (data.qrData) {
          navigate('/review/qr', { state: { qrData: data.qrData } });
        }
        break;
        
      case 'service_code':
        if (data.serviceCode) {
          navigate('/review/service-code', { state: { serviceCode: data.serviceCode } });
        }
        break;
        
      case 'plate_number':
        if (data.plateNumber) {
          navigate('/review/plate-number', { state: { plateNumber: data.plateNumber } });
        }
        break;
        
      case 'general':
        navigate('/review/general');
        break;
        
      default:
        console.log('Unknown review method:', method);
    }
  };

  return (
    <>
      {/* Main FAB Button */}
      <button 
        className={`review-fab ${isVisible ? 'visible' : 'hidden'}`}
        onClick={handleFABClick}
        aria-label="Leave a review"
      >
        <Star size={24} fill="currentColor" />
      </button>

      {/* Enhanced Review Modal */}
      <EnhancedFABModal
        showModal={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        isAuthenticated={isAuthenticated}
        onReviewSubmit={handleReviewSubmit}
      />
    </>
  );
};

// Desktop User Menu Component
const DesktopUserMenu = () => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  if (!isAuthenticated) {
    return (
      <div className="desktop-user-menu">
        <button className="user-auth-button login-button" onClick={handleLogin}>
          <LogIn size={18} />
          <span>Login</span>
        </button>
        <button className="user-auth-button register-button" onClick={handleRegister}>
          <UserPlus size={18} />
          <span>Register</span>
        </button>
      </div>
    );
  }

  return (
    <div className="desktop-user-menu" onMouseLeave={() => setShowDropdown(false)}>
      <UserProfileLink 
        user={currentUser} 
        onMouseEnter={() => setShowDropdown(true)}
        onClick={() => setShowDropdown(!showDropdown)}
      />
      
      {showDropdown && (
        <div className="user-dropdown">
          <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
            <User size={16} />
            Profile
          </Link>
          <Link to="/profile/settings" className="dropdown-item" onClick={() => setShowDropdown(false)}>
            <Settings size={16} />
            Settings
          </Link>
          <button className="dropdown-item logout-item" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

// User Profile Link Component
const UserProfileLink = ({ user, onMouseEnter, onClick }) => {
  return (
    <Link 
      to="/profile" 
      className="user-profile-link"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
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
        {categories.filter(category => !category.desktopOnly).map((category) => (
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

      {/* Enhanced Review FAB - Only show on mobile/tablet */}
      <ReviewFAB />
    </>
  );
};

export default ResponsiveNavigation;