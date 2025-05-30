// Header.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Premium car brands for the background effect
  const brandLogos = [
    { name: "BMW", logo: "/images/brands/bmw-logo.png" },
    { name: "Mercedes", logo: "/images/brands/mercedes-logo.png" },
    { name: "Audi", logo: "/images/brands/audi-logo.png" },
    { name: "Porsche", logo: "/images/brands/porsche-logo.png" },
    { name: "Ferrari", logo: "/images/brands/ferrari-logo.png" },
    { name: "Lamborghini", logo: "/images/brands/lamborghini-logo.png" }
  ];

  return (
    <header className="header">
      <div className="brand-background">
        {brandLogos.map((brand, index) => (
          <div key={brand.name} className="background-brand" style={{
            left: `${(index * 16) + 2}%`,
            animationDelay: `${index * 0.5}s`
          }}>
            <img src={brand.logo} alt="" aria-hidden="true" />
          </div>
        ))}
      </div>
      
      <div className="header-content">
        {/* Main center logo */}
        <Link to="/" className="main-logo">
          <img src="/images/BCC Logo.png" alt="I3w Car Culture" />
        </Link>

        {/* Mobile menu button */}
        {/* <button 
          className="menu-icon"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <img src="/images/menu.png" alt="" />
        </button> */}
      </div>
      
      {/* Mobile navigation menu */}
      {/* <nav className={`mobile-nav ${isMenuOpen ? 'nav-open' : ''}`}>
        <ul className="nav-list">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/news">News</Link></li>
          <li><Link to="/marketplace">Marketplace</Link></li>
          <li><a href="/login" className="login-link">Admin Login</a></li>
        </ul>
      </nav> */}
    </header>
  );
};

export default Header;