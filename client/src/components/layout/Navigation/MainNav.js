// src/components/layout/Navigation/MainNav.js
import React, { useState, useEffect } from 'react';
import './Navigation.css';

export const MainNav = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0); // For cart functionality

  // Handle scroll events for navbar background
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.navbar')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const navigationItems = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'products', label: 'Products', href: '/products' },
    { id: 'about', label: 'About', href: '/about' },
    { id: 'account', label: 'Account', href: '/AdminDashboard' }
  ];

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (href) => {
    // Add your navigation logic here
    console.log('Navigating to:', href);
    setIsMenuOpen(false);
  };

  return (
    <div className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <div className="logo">
          <img 
            src="/images/BCC Logo.png" 
            alt="BCC Logo" 
            onClick={() => handleNavigation('/')}
          />
        </div>

        {/* Navigation Menu */}
        <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <ul>
            {navigationItems.map((item) => (
              <li key={item.id}>
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation(item.href);
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right side icons */}
        <div className="nav-actions">
          {/* Cart Icon with Counter */}
          <div className="cart-icon" onClick={() => handleNavigation('/cart')}>
            <img src="/images/cart.png" alt="Shopping Cart" />
            {cartCount > 0 && (
              <span className="cart-counter">{cartCount}</span>
            )}
          </div>

          {/* Search Icon - Can be expanded into a search bar */}
          <div className="search-icon">
            <img src="/images/search.png" alt="Search" />
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
            onClick={handleMenuToggle}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setIsMenuOpen(false)} />
      )}
    </div>
  );
};

export default MainNav;