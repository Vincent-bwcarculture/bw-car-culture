// src/components/layout/Footer/CompactFooter.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import './CompactFooter.css';

const CompactFooter = () => {
  // State to track which accordion sections are open (for mobile view)
  const [openSections, setOpenSections] = useState({
    quickLinks: false,
    resources: false
  });

  // Toggle accordion section
  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <footer className="compact-footer">
      <div className="footer-content">
        {/* Brand section - always visible */}
        <div className="footer-brand">
          <img src="https://i3wcarculture-images.s3.us-east-1.amazonaws.com/branding/bcc-logo.png" alt="I3w Car Culture" className="footer-logo" />
          
          {/* Social links */}
          <div className="social-links">
            <a href="https://facebook.com" className="social-link" aria-label="Follow us on Facebook">
              <Facebook size={16} />
            </a>
            <a href="https://twitter.com" className="social-link" aria-label="Follow us on Twitter">
              <Twitter size={16} />
            </a>
            <a href="https://instagram.com" className="social-link" aria-label="Follow us on Instagram">
              <Instagram size={16} />
            </a>
            <a href="https://youtube.com" className="social-link" aria-label="Subscribe to our YouTube">
              <Youtube size={16} />
            </a>
            <a href="mailto:contact@i3wcarculture.com" className="social-link" aria-label="Email us">
              <Mail size={16} />
            </a>
          </div>
        </div>

        {/* Footer sections - now only 2 */}
        <div className="footer-sections">
          {/* Quick Links Section */}
          <div className="footer-section">
            <button 
              className="section-header" 
              onClick={() => toggleSection('quickLinks')}
              aria-expanded={openSections.quickLinks}
            >
              <h3>Quick Links</h3>
              <span className="toggle-icon">
                {openSections.quickLinks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            <ul className={`footer-links ${openSections.quickLinks ? 'open' : ''}`}>
              <li><Link to="/news">Latest News</Link></li>
              <li><Link to="/marketplace">Car Marketplace</Link></li>
              <li><Link to="/dealerships">Dealerships</Link></li>
              <li><Link to="/services">Services</Link></li>
            </ul>
          </div>

          {/* Resources Section */}
          <div className="footer-section">
            <button 
              className="section-header" 
              onClick={() => toggleSection('resources')}
              aria-expanded={openSections.resources}
            >
              <h3>Resources</h3>
              <span className="toggle-icon">
                {openSections.resources ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            <ul className={`footer-links ${openSections.resources ? 'open' : ''}`}>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/feedback">Feedback</Link></li>
              <li><Link to="/videos">Videos</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer bottom - with hidden admin path */}
      <div className="footer-bottom">
        <p>
          &copy; {new Date().getFullYear()} I3w Car Culture
          <Link to="/admin-access/register" className="hidden-admin-link"> </Link>
        </p>
        <div className="footer-bottom-links">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/cookies">Cookies</Link>
        </div>
      </div>
    </footer>
  );
};

export default CompactFooter;