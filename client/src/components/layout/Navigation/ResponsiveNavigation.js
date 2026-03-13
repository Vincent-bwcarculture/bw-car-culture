// src/components/layout/Navigation/ResponsiveNavigation.js
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, ShoppingBag, Store, Settings, User, LogIn, LogOut,
  UserCircle, Star, QrCode, Hash, X, UserPlus, Newspaper, MessageCircle,
  Menu, BarChart3, Info, Map, Zap, Tag, MapPin
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.js';
import EnhancedFABModal from './EnhancedFABModal.js';
import './ResponsiveNavigation.css';

// Updated navigation categories - News added for desktop, Profile kept for mobile
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
    desktopOnly: true // Only show on bigger displays
  },
  {
    id: 'profile',
    name: 'Profile',
    path: '/profile',
    icon: <User size={20} />
  }
];

const BRANDS = ['Toyota', 'BMW', 'Mercedes-Benz', 'Honda', 'Ford', 'Volkswagen', 'Hyundai', 'Audi'];
const LOCATIONS = ['Gaborone', 'Francistown', 'Maun', 'Kasane', 'Lobatse', 'Serowe'];

const NavigationMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [vehicleType, setVehicleType] = useState('electric');
  const [browseDropdown, setBrowseDropdown] = useState(null); // 'brand' | 'dealers' | 'location' | null
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close menu when clicking outside (accounting for Portal)
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideMenu = menuRef.current?.contains(event.target);
      const isClickInsideDropdown = dropdownRef.current?.contains(event.target);
      if (!isClickInsideMenu && !isClickInsideDropdown) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMenuOpen]);

  const handleVehicleSearch = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsMenuOpen(false);
    navigate(`/marketplace?search=${encodeURIComponent(vehicleType)}`);
  };

  // Handle feedback click
  const handleFeedbackClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('💬 Feedback clicked, navigating to /feedback');
    setIsMenuOpen(false);
    navigate('/feedback');
  };

  // Handle Market Overview click
  const handleMarketOverviewClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('📊 Market Overview clicked, navigating to /market-overview');
    setIsMenuOpen(false);
    navigate('/market-overview');
  };

  // Handle News click
  const handleNewsClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('📰 News clicked, navigating to /news');
    setIsMenuOpen(false);
    navigate('/news');
  };

  // Handle About click
  const handleAboutClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsMenuOpen(false);
    navigate('/about');
  };

  // Handle Drive Map click
  const handleDriveMapClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsMenuOpen(false);
    navigate('/drive-map');
  };

  // Handle menu button click with proper event handling
  const handleMenuClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔘 Explore button clicked! Current:', isMenuOpen, '→ New:', !isMenuOpen);
    setIsMenuOpen(prev => !prev);
  };

  // Calculate dropdown position to appear BELOW the menu button
  const getDropdownPosition = () => {
    if (!menuRef.current) return { top: "auto", right: "8px" };
    const buttonRect = menuRef.current.getBoundingClientRect();
    return {
      top: `${buttonRect.bottom + 8}px`,
      right: `${window.innerWidth - buttonRect.right}px`
    };
  };

  const dropdownPosition = isMenuOpen ? getDropdownPosition() : { top: "auto", right: "8px" };

  return (
    <div className="navigation-menu-container" ref={menuRef} style={{ position: 'relative' }}>
      <button
        className="navigation-menu-button"
        onClick={handleMenuClick}
        type="button"
        aria-label="Open explore menu"
        aria-expanded={isMenuOpen}
        style={{ 
          position: 'relative',
          zIndex: 1000,
          cursor: 'pointer'
        }}
      >
        <Menu size={16} />
        <span>Explore</span>
      </button>

      {isMenuOpen && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className="navigation-dropdown-menu"
          style={{
            position: "fixed",
            top: dropdownPosition.top,
            right: dropdownPosition.right,
            display: 'block',
            zIndex: 99999
          }}
        >
          {/* Vehicle Type Search */}
          <div className="menu-vehicle-search">
            <select
              className="menu-vehicle-type-select"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="electric">🌿 Electric Vehicles</option>
              <option value="hybrid">Hybrid</option>
              <option value="SUV">SUV</option>
              <option value="sedan">Sedan</option>
              <option value="family">Family Cars</option>
              <option value="4x4">Off-road / 4x4</option>
              <option value="pickup">Pickup / Bakkie</option>
              <option value="luxury">Luxury</option>
            </select>
            <button
              className="menu-vehicle-search-btn"
              onClick={handleVehicleSearch}
              type="button"
            >
              Browse
            </button>
          </div>

          {/* Quick Browse */}
          <div className="menu-quick-browse">
            <span className="menu-browse-label">Browse by</span>
            <div className="menu-browse-links">
              <button
                className={`menu-browse-link${browseDropdown === 'brand' ? ' active' : ''}`}
                type="button"
                onClick={(e) => { e.stopPropagation(); setBrowseDropdown(browseDropdown === 'brand' ? null : 'brand'); }}
              >
                <Tag size={11} /> Brand {browseDropdown === 'brand' ? '▲' : '▼'}
              </button>
              <button
                className={`menu-browse-link${browseDropdown === 'dealers' ? ' active' : ''}`}
                type="button"
                onClick={(e) => { e.stopPropagation(); setBrowseDropdown(browseDropdown === 'dealers' ? null : 'dealers'); }}
              >
                <Store size={11} /> Dealers {browseDropdown === 'dealers' ? '▲' : '▼'}
              </button>
              <button
                className={`menu-browse-link${browseDropdown === 'location' ? ' active' : ''}`}
                type="button"
                onClick={(e) => { e.stopPropagation(); setBrowseDropdown(browseDropdown === 'location' ? null : 'location'); }}
              >
                <MapPin size={11} /> Location {browseDropdown === 'location' ? '▲' : '▼'}
              </button>
            </div>

            {browseDropdown === 'brand' && (
              <div className="menu-browse-dropdown">
                {BRANDS.map(brand => (
                  <button key={brand} className="menu-browse-dropdown-item" type="button"
                    onClick={() => { setIsMenuOpen(false); setBrowseDropdown(null); navigate(`/marketplace?make=${encodeURIComponent(brand)}`); }}>
                    {brand}
                  </button>
                ))}
              </div>
            )}

            {browseDropdown === 'dealers' && (
              <div className="menu-browse-dropdown">
                <button className="menu-browse-dropdown-item" type="button"
                  onClick={() => { setIsMenuOpen(false); setBrowseDropdown(null); navigate('/dealerships'); }}>
                  All Dealerships
                </button>
                <button className="menu-browse-dropdown-item" type="button"
                  onClick={() => { setIsMenuOpen(false); setBrowseDropdown(null); navigate('/marketplace?sellerType=dealer'); }}>
                  Dealer Listings
                </button>
                <button className="menu-browse-dropdown-item" type="button"
                  onClick={() => { setIsMenuOpen(false); setBrowseDropdown(null); navigate('/marketplace?sellerType=private'); }}>
                  Private Sellers
                </button>
              </div>
            )}

            {browseDropdown === 'location' && (
              <div className="menu-browse-dropdown">
                {LOCATIONS.map(city => (
                  <button key={city} className="menu-browse-dropdown-item" type="button"
                    onClick={() => { setIsMenuOpen(false); setBrowseDropdown(null); navigate(`/marketplace?city=${encodeURIComponent(city)}`); }}>
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="menu-divider"></div>

          {/* Market Overview */}
          <button className="menu-item market-overview-item" onClick={handleMarketOverviewClick} type="button">
            <span className="menu-item-icon"><BarChart3 size={12} /></span>
            <span className="menu-item-text">Market Overview</span>
          </button>

          <div className="menu-divider"></div>

          {/* News */}
          <button className="menu-item news-item" onClick={handleNewsClick} type="button">
            <span className="menu-item-icon"><Newspaper size={12} /></span>
            <span className="menu-item-text">News</span>
          </button>

          <div className="menu-divider"></div>

          {/* Drive Map */}
          <button className="menu-item drivemap-item" onClick={handleDriveMapClick} type="button">
            <span className="menu-item-icon"><Map size={12} /></span>
            <span className="menu-item-text">Drive Map</span>
          </button>

          <div className="menu-divider"></div>

          {/* About */}
          <button className="menu-item about-item" onClick={handleAboutClick} type="button">
            <span className="menu-item-icon"><Info size={12} /></span>
            <span className="menu-item-text">About</span>
          </button>

          <div className="menu-divider"></div>

          {/* Feedback — bottom */}
          <button className="menu-item feedback-item" onClick={handleFeedbackClick} type="button">
            <span className="menu-item-icon"><MessageCircle size={12} /></span>
            <span className="menu-item-text">Feedback</span>
          </button>
        </div>
        , document.body
      )}
    </div>
  );
};

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
    // Here you would typically send the review to your backend
  };

  return (
    <>
      {/* Enhanced Review FAB */}
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
  // FIXED: Use 'user' instead of 'currentUser' to match AuthContext
  const { isAuthenticated, user, logout } = useAuth();
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
        <button className="nav-auth-btn nav-login-btn" onClick={handleLogin}>
          <LogIn size={10} />
          <span>Login</span>
        </button>
        <button className="nav-auth-btn nav-register-btn" onClick={handleRegister}>
          <UserPlus size={10} />
          <span>Register</span>
        </button>
      </div>
    );
  }

  return (
    <div className="desktop-user-menu" onMouseLeave={() => setShowDropdown(false)}>
      <UserProfileLink 
        user={user} 
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

// ENHANCED: User Profile Link Component with improved avatar handling and fallback
const UserProfileLink = ({ user, onMouseEnter, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getUserName = (user) => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getAvatarUrl = (user) => {
    if (!user) {
      console.log('👤 UserProfileLink: No user data provided');
      return null;
    }

    console.log('👤 UserProfileLink: Checking avatar for user:', {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      hasAvatar: !!user.avatar,
      avatar: user.avatar,
      avatarType: typeof user.avatar,
      avatarUrl: user.avatar?.url,
      hasProfilePicture: !!user.profilePicture,
      profilePicture: user.profilePicture
    });

    // Primary check: avatar.url (main field in your system)
    if (user.avatar && typeof user.avatar === 'object' && user.avatar.url) {
      console.log('👤 ✅ Using avatar.url:', user.avatar.url);
      return user.avatar.url;
    }
    
    // Fallback: avatar as string
    if (user.avatar && typeof user.avatar === 'string' && user.avatar.startsWith('http')) {
      console.log('👤 ✅ Using avatar string:', user.avatar);
      return user.avatar;
    }
    
    // Additional fallback: profilePicture.url
    if (user.profilePicture && typeof user.profilePicture === 'object' && user.profilePicture.url) {
      console.log('👤 ✅ Using profilePicture.url:', user.profilePicture.url);
      return user.profilePicture.url;
    }
    
    // Additional fallback: profilePicture as string
    if (user.profilePicture && typeof user.profilePicture === 'string' && user.profilePicture.startsWith('http')) {
      console.log('👤 ✅ Using profilePicture string:', user.profilePicture);
      return user.profilePicture;
    }

    console.log('👤 ⚠️ No valid avatar URL found, using fallback');
    return null;
  };

  const avatarUrl = getAvatarUrl(user);
  const userName = getUserName(user);
  const userInitials = getInitials(userName);

  // Reset image states when user or avatarUrl changes
  useEffect(() => {
    if (avatarUrl) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [user?.id, avatarUrl]);

  // Enhanced error handling for avatar image
  const handleImageError = (e) => {
    console.error('👤 ❌ Profile image failed to load:', avatarUrl);
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log('👤 ✅ Profile image loaded successfully:', avatarUrl);
    setImageError(false);
    setImageLoading(false);
  };

  // Debug logging
  useEffect(() => {
    if (user) {
      console.log('👤 UserProfileLink - Current state:', {
        userName,
        avatarUrl,
        hasValidAvatarUrl: !!avatarUrl,
        imageError,
        imageLoading,
        userInitials
      });
    }
  }, [user, avatarUrl, imageError, imageLoading, userName, userInitials]);

  return (
    <Link 
      to="/profile" 
      className="user-profile-link"
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      <div className="user-profile-avatar">
        {avatarUrl && !imageError ? (
          <>
            <img 
              src={avatarUrl} 
              alt={userName}
              onError={handleImageError}
              onLoad={handleImageLoad}
              style={{ 
                display: imageLoading ? 'none' : 'block',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%'
              }}
            />
            {imageLoading && (
              <div style={{ 
                display: 'flex',
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '100%', 
                height: '100%', 
                backgroundColor: 'var(--nav-accent, #007bff)', 
                borderRadius: '50%', 
                color: 'white', 
                fontSize: '0.8rem', 
                fontWeight: 'bold' 
              }}>
                {userInitials}
              </div>
            )}
          </>
        ) : (
          // Fallback: Show initials or UserCircle icon
          <div style={{ 
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '100%', 
            height: '100%', 
            backgroundColor: 'var(--nav-accent, #007bff)', 
            borderRadius: '50%', 
            color: 'white', 
            fontSize: '0.8rem', 
            fontWeight: 'bold' 
          }}>
            {userName !== 'User' ? userInitials : <UserCircle size={24} />}
          </div>
        )}
      </div>
      <div className="user-profile-info">
        <span className="user-profile-name">
          {userName}
        </span>
        <span className="user-profile-role">{user?.role || 'Member'}</span>
      </div>
    </Link>
  );
};

// UPDATED: Breadcrumb component - Now uses NavigationMenu instead of BreadcrumbFeedbackButton
const Breadcrumb = ({ paths }) => (
  <nav className="breadcrumb-container" aria-label="Breadcrumb">
    <div className="breadcrumb-content">
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
      
      {/* UPDATED: Navigation Menu replaces Feedback button */}
      <NavigationMenu />
    </div>
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
        {/* Breadcrumb with menu */}
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