import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Star } from 'lucide-react';
import EnhancedFABModal from './EnhancedFABModal'; // New import
import './ResponsiveNavigation.css';

const ResponsiveNavigation = () => {
  const { isAuthenticated, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // FAB Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Categories and other existing state...
  const categories = [
    'All',
    'Car Sales',
    'Car News',
    'Services',
    'Parts',
    'Rentals',
    'Insurance'
  ];

  // Scroll handler for FAB visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Handle review submission from enhanced modal
  const handleReviewSubmit = (method, data) => {
    console.log('Review method selected:', method, data);
    
    switch (method) {
      case 'qr':
        // Handle QR code review
        if (data.qrData) {
          // You can either navigate to a review form or handle the QR data directly
          navigate('/review/qr', { state: { qrData: data.qrData } });
        }
        break;
        
      case 'service_code':
        // Handle service code review
        if (data.serviceCode) {
          navigate('/review/service-code', { state: { serviceCode: data.serviceCode } });
        }
        break;
        
      case 'plate_number':
        // Handle plate number review
        if (data.plateNumber) {
          navigate('/review/plate-number', { state: { plateNumber: data.plateNumber } });
        }
        break;
        
      case 'general':
        // Handle general review
        navigate('/review/general');
        break;
        
      default:
        console.log('Unknown review method:', method);
    }
  };

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

  return (
    <>
      {/* Existing navigation code... */}
      <nav className="navigation-container">
        {/* Your existing navigation content */}
      </nav>

      {/* Enhanced FAB Button */}
      <button 
        className={`review-fab ${isVisible ? 'visible' : 'hidden'}`}
        onClick={handleFABClick}
        aria-label="Leave a review"
      >
        <Star size={24} fill="currentColor" />
      </button>

      {/* Enhanced Review Modal - Replace the old modal with this */}
      <EnhancedFABModal
        showModal={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        isAuthenticated={isAuthenticated}
        onReviewSubmit={handleReviewSubmit}
      />
    </>
  );
};

export default ResponsiveNavigation;