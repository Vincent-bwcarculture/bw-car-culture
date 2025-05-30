// src/components/layout/Navigation/ResponsiveNavigation.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Store, Settings, Newspaper } from 'lucide-react';
import './ResponsiveNavigation.css';

// Simplified navigation categories without dropdowns
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
    icon: <Newspaper size={20} />
  }
];

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
    
    return () => {
      if (typeof window !== 'undefined' && window.history && window.history.scrollRestoration) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  // Generate breadcrumb paths based on current location
  useEffect(() => {
    const generatePaths = () => {
      const paths = location.pathname.split('/').filter(Boolean);
      const breadcrumbs = paths.map((path, index) => {
        const url = `/${paths.slice(0, index + 1).join('/')}`;
        const category = categories.find(cat => cat.path === url);
        
        let name = path.charAt(0).toUpperCase() + path.slice(1);
        if (category) {
          name = category.name;
        }

        return { name, url };
      });

      setActivePath(breadcrumbs);
    };

    generatePaths();
  }, [location]);

  // Check for scroll buttons visibility
  useEffect(() => {
    const checkScrollable = () => {
      if (navRef.current) {
        const list = navRef.current.querySelector('.category-list');
        if (list) {
          const { scrollWidth, clientWidth } = list;
          setShowScrollButtons(scrollWidth > clientWidth);
        }
      }
    };

    checkScrollable();
    const resizeHandler = () => {
      checkScrollable();
    };
    
    window.addEventListener('resize', resizeHandler);
    return () => window.removeEventListener('resize', resizeHandler);
  }, []);
  
  // Add mobile navigation class to body and handle iOS safe areas
  useEffect(() => {
    const checkMobileNav = () => {
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        document.body.classList.add('has-mobile-nav');
        // Add safe area handling for iOS
        document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom, 0px)');
      } else {
        document.body.classList.remove('has-mobile-nav');
        document.documentElement.style.removeProperty('--safe-area-bottom');
      }
    };
    
    checkMobileNav();
    window.addEventListener('resize', checkMobileNav);
    return () => {
      window.removeEventListener('resize', checkMobileNav);
      document.body.classList.remove('has-mobile-nav');
    };
  }, []);

  // Handle scroll for category list
  const handleScroll = (direction) => {
    if (navRef.current) {
      const list = navRef.current.querySelector('.category-list');
      if (list) {
        const scrollAmount = direction === 'left' ? -200 : 200;
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
        
        {/* Desktop Category Navigation */}
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
    </>
  );
};

export default ResponsiveNavigation;