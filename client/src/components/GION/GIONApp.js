// components/GION/GIONApp.js - Updated to fix duplicate menu bars
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GIONButton from './GIONButton.js';
import GIONModal from './GIONModal.js';
import GIONBackdrop from './GIONBackdrop.js';
import GIONMainScreen from './GIONMainScreen.js';
import GIONReviewScreen from './GIONReviewScreen.js';
import GIONSuccessScreen from './GIONSuccessScreen.js';
import GIONLeaderboardPage from './pages/GIONLeaderboardPage.js';
import { useQRScanner } from './hooks/useQRScanner.js';

// Import the page components
import GIONHomePage from './pages/GIONHomePage.js';
import GIONReviewsPage from './pages/GIONReviewsPage.js';
import GIONProfilePage from './pages/GIONProfilePage.js';

import './GIONApp.css';

const GIONApp = ({ withChatbot = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('main');
  const [selectedService, setSelectedService] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentItems, setRecentItems] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [scannerError, setQrError] = useState(null);
  
  // Get location to detect current page context
  const location = useLocation();
  const navigate = useNavigate();
  
  // Custom hook for QR scanning
  const { startScanner, stopScanner, scanResult, error, isScanning, resetError } = useQRScanner();
  
  // Set scanner error when hook reports error
  useEffect(() => {
    if (error) {
      setQrError(error);
    }
  }, [error]);
  
  // Load recent items and user points from local storage
  useEffect(() => {
    const storedItems = localStorage.getItem('gion_recent_items');
    if (storedItems) {
      setRecentItems(JSON.parse(storedItems));
    }
    
    const storedPoints = localStorage.getItem('gion_user_points');
    if (storedPoints) {
      setUserPoints(parseInt(storedPoints, 10));
    }
  }, []);
  
  // Save recent items to local storage when they change
  useEffect(() => {
    if (recentItems.length > 0) {
      localStorage.setItem('gion_recent_items', JSON.stringify(recentItems));
    }
  }, [recentItems]);
  
  // Save user points to local storage when they change
  useEffect(() => {
    localStorage.setItem('gion_user_points', userPoints.toString());
  }, [userPoints]);
  
  // Handle QR code detection
  useEffect(() => {
    if (scanResult) {
      // Parse the QR code data
      try {
        // Expected format: serviceName|serviceId|category
        const data = scanResult.split('|');
        if (data.length >= 2) {
          const service = {
            name: data[0],
            id: data[1],
            category: data[2] || getDefaultCategory()
          };
          
          setSelectedService(service);
          setShowScanner(false);
          setCurrentView('review');
          setActiveTab('review');
          
          // Add to recent items if not already there
          addToRecentItems(service);
        }
      } catch (error) {
        console.error('Error parsing QR code data:', error);
        setQrError('Invalid QR code format. Please try a transport service QR code.');
      }
    }
  }, [scanResult]);
  
  // Get default category based on current page
  const getDefaultCategory = () => {
    const path = location.pathname;
    
    if (path.includes('transport') || path.includes('taxi')) {
      return 'transport';
    } else if (path.includes('dealership')) {
      return 'dealership';
    } else if (path.includes('service') || path.includes('workshop')) {
      return 'service';
    } else if (path.includes('rental')) {
      return 'rental';
    }
    
    return 'transport'; // Default to transport
  };
  
  // Add a service to recent items
  const addToRecentItems = (service) => {
    // Check if service already exists
    const exists = recentItems.some(item => item.id === service.id);
    
    if (!exists) {
      // Add to beginning of array and limit to 5 items
      const updatedItems = [service, ...recentItems].slice(0, 5);
      setRecentItems(updatedItems);
    }
  };
  
  // Handle QR scanner start/stop
  useEffect(() => {
    if (showScanner) {
      startScanner();
    } else {
      stopScanner();
    }
    
    return () => {
      stopScanner();
    };
  }, [showScanner, startScanner, stopScanner]);
  
  // Add/remove body class when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('gion-modal-open');
    } else {
      document.body.classList.remove('gion-modal-open');
    }
    
    return () => {
      document.body.classList.remove('gion-modal-open');
    };
  }, [isOpen]);
  
  const handleScanQR = () => {
    setQrError(null);
    setShowScanner(true);
  };
  
  const handleCodeSubmit = (code) => {
    // Analyze code to determine service type
    let serviceName = 'Unknown Service';
    let category = 'transport';
    
    // Parse different code formats
    if (code.startsWith('T')) {
      serviceName = 'Taxi Service';
      category = 'transport';
    } else if (code.startsWith('D')) {
      serviceName = 'Dealership Service';
      category = 'dealership';
    } else if (code.startsWith('R')) {
      serviceName = 'Rental Service';
      category = 'rental';
    } else if (code.startsWith('S')) {
      serviceName = 'Workshop Service';
      category = 'workshop';
    } else if (code.startsWith('B')) {
      serviceName = 'Bus Service';
      category = 'bus';
    }
    
    const service = {
      name: serviceName,
      id: code,
      category: category
    };
    
    setSelectedService(service);
    addToRecentItems(service);
    setCurrentView('review');
    setActiveTab('review');
  };
  
  const handleReviewClick = () => {
    // Set the active tab to review
    setActiveTab('review');
    
    // Try to guess what the user wants to review based on current page
    const path = location.pathname;
    let service = {
      name: 'Transport Service',
      id: 'TS' + Math.floor(Math.random() * 10000),
      category: 'transport'
    };
    
    // Check if we're on a specific service page
    if (path.includes('dealerships/')) {
      const dealerId = path.split('/').pop();
      service = {
        name: 'Dealership Service',
        id: 'D' + dealerId,
        category: 'dealership'
      };
    } else if (path.includes('services/')) {
      const serviceId = path.split('/').pop();
      service = {
        name: 'Workshop Service',
        id: 'S' + serviceId,
        category: 'workshop'
      };
    } else if (path.includes('rentals/')) {
      const rentalId = path.split('/').pop();
      service = {
        name: 'Rental Service',
        id: 'R' + rentalId,
        category: 'rental'
      };
    } else if (path.includes('transport/')) {
      const transportId = path.split('/').pop();
      service = {
        name: 'Transport Service',
        id: 'T' + transportId,
        category: 'transport'
      };
    }
    
    setSelectedService(service);
    setCurrentView('review');
  };
  
  const handleToggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    if (newExpandedState) {
      // When expanding, update to use the custom pages
      setCurrentView('embedded');
      setActiveTab('home');
    } else {
      // When collapsing, go back to main view
      setCurrentView('main');
    }
  };
  
  const handleRecentItemSelect = (item) => {
    setSelectedService(item);
    setCurrentView('review');
    setActiveTab('review');
  };
  
  const handleCategorySelect = (category) => {
    if (isExpanded) {
      // If expanded, navigate within the modal
      setCurrentView('embedded');
      setActiveTab('home');
      // You could pass the selected category to the home page if needed
    } else {
      // Otherwise open in new tab
      window.open(`https://gion.app/categories/${category.id}`, '_blank');
      setIsOpen(false);
    }
  };
  
  const handleReviewSubmit = (reviewData) => {
    console.log('Review submitted:', reviewData);
    
    // Calculate points based on review completeness
    let points = 50; // Base points
    
    if (reviewData.comment) points += 10;
    if (reviewData.photos && reviewData.photos.length > 0) points += 20;
    if (reviewData.safetyReport) points += 25; // Extra points for safety reporting
    
    // Update user points
    setUserPoints(userPoints + points);
    
    // Store review in local storage for history
    const reviews = JSON.parse(localStorage.getItem('gion_reviews') || '[]');
    reviews.unshift({
      ...reviewData,
      timestamp: new Date().toISOString(),
      points: points
    });
    localStorage.setItem('gion_reviews', JSON.stringify(reviews.slice(0, 20)));
    
    setCurrentView('success');
  };
  
  const handleModalClose = () => {
    // If we're on the success screen, just close immediately
    if (currentView === 'success') {
      setIsOpen(false);
      setTimeout(() => {
        setCurrentView('main');
        setActiveTab('home');
      }, 300);
      return;
    }
    
    // Otherwise, animate closing
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      // Reset to main view after closing
      setTimeout(() => {
        setCurrentView('main');
        setActiveTab('home');
      }, 300);
    }, 300);
  };
  
  const handleCancelReview = () => {
    if (isExpanded) {
      setCurrentView('embedded');
    } else {
      setCurrentView('main');
    }
    setActiveTab('home');
  };
  
  const resetApp = () => {
    setIsOpen(false);
    setTimeout(() => {
      setCurrentView('main');
      setActiveTab('home');
      setSelectedService(null);
      setShowScanner(false);
      setIsExpanded(false);
    }, 300);
  };
  
  // Open the leaderboard view
  const handleOpenLeaderboard = () => {
    setCurrentView('leaderboard');
  };
  
  // Handler for bottom navigation items
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    if (isExpanded) {
      // If expanded, show the appropriate view
      if (tab === 'home' || tab === 'profile') {
        setCurrentView('embedded');
      } else if (tab === 'review') {
        // For review tab, either show the review screen or the reviews page
        if (selectedService) {
          setCurrentView('review');
        } else {
          setCurrentView('embedded');
        }
      } else if (tab === 'leaderboard') {
        setCurrentView('leaderboard');
      }
    } else {
      // If not expanded, just update the view within the modal
      if (tab === 'home') {
        setCurrentView('main');
      } else if (tab === 'review') {
        handleReviewClick();
      } else if (tab === 'profile') {
        // For small modal, close and navigate
        setIsOpen(false);
        setTimeout(() => {
          navigate('/profile');
        }, 300);
      } else if (tab === 'leaderboard') {
        handleOpenLeaderboard();
      }
    }
  };
  
  // Determine content to render based on current view
  const renderContent = () => {
    if (showScanner) {
      return (
        <div className="qr-scanner-overlay">
          <div className="scanner-header">
            <h3>Scan Transport QR Code</h3>
            <button 
              className="close-scanner-button" 
              onClick={() => setShowScanner(false)}
            >
              Cancel
            </button>
          </div>
          <div id="qr-reader"></div>
          {scannerError && (
            <div className="scanner-error">
              <p>{scannerError}</p>
              <button onClick={() => { resetError(); setQrError(null); startScanner(); }}>
                Try Again
              </button>
            </div>
          )}
          <div className="scanner-guide">
            <p>Point your camera at a transport service QR code</p>
            <p className="scanner-guide-hint">Found on taxis, buses, transport stations or service cards</p>
            <div className="scanner-examples">
              <span className="scanner-example-code">T1234</span>
              <span className="scanner-example-code">B5678</span>
              <span className="scanner-example-code">R9012</span>
            </div>
          </div>
        </div>
      );
    }
    
    if (currentView === 'success') {
      return (
        <GIONSuccessScreen 
          onDismiss={resetApp}
          points={50}
          totalPoints={userPoints}
          category={selectedService?.category}
        />
      );
    }
    
    if (currentView === 'review') {
      return (
        <GIONReviewScreen 
          service={selectedService?.name || 'Transport Service'}
          serviceId={selectedService?.id || 'T12345'}
          category={selectedService?.category || 'transport'}
          onSubmit={handleReviewSubmit}
          onCancel={handleCancelReview}
          userPoints={userPoints}
        />
      );
    }
    
    if (currentView === 'leaderboard') {
      return (
        <GIONLeaderboardPage 
          onBack={() => handleTabChange('home')}
        />
      );
    }
    
    if (currentView === 'embedded') {
      // Render the appropriate page based on the active tab
      switch(activeTab) {
        case 'home':
          return <GIONHomePage userPoints={userPoints} onOpenLeaderboard={handleOpenLeaderboard} />;
        case 'review':
          return <GIONReviewsPage onBack={() => handleTabChange('home')} />;
        case 'profile':
          return <GIONProfilePage 
                   userPoints={userPoints} 
                   onBack={() => handleTabChange('home')} 
                 />;
        default:
          return <GIONHomePage userPoints={userPoints} />;
      }
    }
    
    // Default main screen
    return (
      <GIONMainScreen 
        onScanQR={handleScanQR}
        onCodeSubmit={handleCodeSubmit}
        onReviewClick={handleReviewClick}
        onRecentItemSelect={handleRecentItemSelect}
        onCategorySelect={handleCategorySelect}
        onClose={handleModalClose}
        onExpand={handleToggleExpand}
        onViewAll={(section) => {
          if (section === 'leaderboard') {
            handleOpenLeaderboard();
          } else if (isExpanded) {
            // If expanded, navigate within the modal
            setCurrentView('embedded');
          } else {
            setIsOpen(false);
            setTimeout(() => {
              navigate(section === 'featured' ? '/featured' : '/activity');
            }, 300);
          }
        }}
        onProfileClick={() => handleTabChange('profile')}
        onHomeClick={() => handleTabChange('home')}
        activeTab={activeTab}
        recentItems={recentItems}
        userPoints={userPoints}
        currentPath={location.pathname}
        isExpanded={isExpanded}
        hideBottomNav={isExpanded} // Pass to hide bottom nav when expanded
      />
    );
  };
  
  return (
    <div className={`gion-app-container ${withChatbot ? 'with-chatbot' : ''}`}>
      <GIONButton 
        onClick={() => setIsOpen(true)} 
        points={userPoints} 
      />
      
      <GIONBackdrop 
        isOpen={isOpen} 
        onClick={handleModalClose} 
      />
      
      <GIONModal 
        isOpen={isOpen} 
        onClose={handleModalClose} 
        currentView={currentView}
        isExpanded={isExpanded}
        onToggleExpand={handleToggleExpand}
        isClosing={isClosing}
      >
        {renderContent()}
        
        {/* Bottom Navigation - Only show when expanded */}
        {isExpanded && currentView !== 'review' && currentView !== 'success' && (
          <div className="gion-bottom-navigation">
            <button 
              className={`gion-nav-button ${activeTab === 'home' ? 'active' : ''}`} 
              onClick={() => handleTabChange('home')}
            >
              <svg className="gion-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>Home</span>
            </button>
            <button 
              className={`gion-nav-button ${activeTab === 'review' ? 'active' : ''}`} 
              onClick={() => handleTabChange('review')}
            >
              <svg className="gion-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span>Review</span>
            </button>
            <button 
              className={`gion-nav-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => handleTabChange('leaderboard')}
            >
              <svg className="gion-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 20V10M12 20V4M6 20v-6"></path>
              </svg>
              <span>Rankings</span>
            </button>
            <button 
              className={`gion-nav-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleTabChange('profile')}
            >
              <svg className="gion-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Profile</span>
            </button>
          </div>
        )}
      </GIONModal>
    </div>
  );
};

export default GIONApp;