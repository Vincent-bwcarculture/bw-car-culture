// client/src/components/profile/ProfileNavigation.js
import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ProfileNavigation.css';

const ProfileNavigation = ({ activeTab, setActiveTab, availableTabs }) => {
  const scrollContainerRef = useRef(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  // Check scroll state
  const checkScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftScroll(scrollLeft > 0);
    setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Setup scroll listeners
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    checkScrollState();
    container.addEventListener('scroll', checkScrollState);
    window.addEventListener('resize', checkScrollState);

    return () => {
      container.removeEventListener('scroll', checkScrollState);
      window.removeEventListener('resize', checkScrollState);
    };
  }, [availableTabs]);

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: 200, behavior: 'smooth' });
  };

  // Auto-scroll to active tab when it changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const activeButton = container.querySelector('.pnav-tab-button.active');
    if (activeButton) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      
      if (buttonRect.left < containerRect.left || buttonRect.right > containerRect.right) {
        activeButton.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'center' 
        });
      }
    }
  }, [activeTab]);

  return (
    <div className="pnav-main-container">
      {/* Left Scroll Button */}
      {showLeftScroll && (
        <button 
          className="pnav-scroll-button pnav-scroll-left"
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Navigation Tabs Container */}
      <div 
        className="pnav-scroll-container"
        ref={scrollContainerRef}
      >
        <div className="pnav-tabs-wrapper">
          {availableTabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`pnav-tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                aria-label={`Switch to ${tab.label} tab`}
              >
                <IconComponent size={16} className="pnav-tab-icon" />
                <span className="pnav-tab-label">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="pnav-active-indicator" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Scroll Button */}
      {showRightScroll && (
        <button 
          className="pnav-scroll-button pnav-scroll-right"
          onClick={scrollRight}
          aria-label="Scroll right"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Tab Count Indicator (for mobile) */}
      <div className="pnav-tab-indicator">
        <span className="pnav-current-tab">
          {availableTabs.findIndex(tab => tab.id === activeTab) + 1}
        </span>
        <span className="pnav-tab-separator">/</span>
        <span className="pnav-total-tabs">{availableTabs.length}</span>
      </div>
    </div>
  );
};

export default ProfileNavigation;
