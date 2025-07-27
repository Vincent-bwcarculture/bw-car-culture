// src/components/layout/Navigation/ResponsiveNavigation.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, ShoppingBag, Store, Settings, User, LogIn, LogOut, 
  UserCircle, Star, QrCode, Hash, X, UserPlus, Newspaper, MessageCircle
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

// NEW: Breadcrumb Feedback Button Component
const BreadcrumbFeedbackButton = ({ onFeedbackClick }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

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

  // Randomly show notification for returning users (occasionally)
  useEffect(() => {
    if (hasInteracted) {
      const shouldShowNotification = Math.random() < 0.1; // 10% chance
      if (shouldShowNotification) {
        const timer = setTimeout(() => {
          setShowNotification(true);
        }, 60000); // Show after 1 minute for returning users

        return () => clearTimeout(timer);
      }
    }
  }, [hasInteracted]);

  const handleFeedbackClick = () => {
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
    <div className="breadcrumb-feedback-container">
      <button 
        className="breadcrumb-feedback-button"
        onClick={handleFeedbackClick}
        aria-label="Give feedback about the website"
      >
        <MessageCircle size={16} />
        <span className="feedback-text">Feedback</span>
        
        {/* Notification bubble */}
        {showNotification && (
          <div className="feedback-notification">
            <div className="feedback-notification-content">
              <span>Share your thoughts!</span>
              <button 
                className="notification-dismiss"
                onClick={dismissNotification}
                aria-label="Dismiss notification"
              >
                <X size={12} />
              </button>
            </div>
            <div className="feedback-notification-arrow"></div>
          </div>
        )}
      </button>
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

// Breadcrumb component - UPDATED to include feedback button
const Breadcrumb = ({ paths, onFeedbackClick }) => (
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
      
      {/* NEW: Feedback button in breadcrumb */}
      <BreadcrumbFeedbackButton onFeedbackClick={onFeedbackClick} />
    </div>
  </nav>
);

// Main ResponsiveNavigation component - UPDATED to handle feedback modal
const ResponsiveNavigation = () => {
  const [activePath, setActivePath] = useState([]);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false); // NEW: Feedback modal state
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef();
  const { isAuthenticated } = useAuth();

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

  // NEW: Handle feedback button click
  const handleFeedbackClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { 
        state: { 
          from: window.location.pathname,
          message: 'Please login to leave feedback'
        }
      });
    } else {
      setShowFeedbackModal(true);
    }
  };

  // NEW: Handle feedback form submission
  const handleFeedbackSubmit = (feedbackData) => {
    console.log('Feedback submitted from breadcrumb:', feedbackData);
    setShowFeedbackModal(false);
    // Here you would typically send the feedback to your backend
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
        {/* Breadcrumb with feedback button */}
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
            disabled={isNavigating}
          >
            <div className="mobile-nav-icon">{category.icon}</div>
            <div className="mobile-nav-label">{category.name}</div>
          </button>
        ))}
      </nav>

      {/* Enhanced Review FAB - Only show on mobile/tablet */}
      <ReviewFAB />

      {/* NEW: Feedback Modal for breadcrumb button */}
      <EnhancedFABModal
        showModal={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        isAuthenticated={isAuthenticated}
        onReviewSubmit={handleFeedbackSubmit}
      />
    </>
  );
};

export default ResponsiveNavigation;