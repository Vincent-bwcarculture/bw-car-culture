// components/GION/GIONModal.js
import React, { useEffect, useRef, useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import './GIONModal.css';

/**
 * Enhanced GION Modal component with improved state management and transitions
 */
const GIONModal = ({ 
  isOpen, 
  onClose, 
  currentView,
  isExpanded,
  onToggleExpand,
  children,
  maxWidth = '375px',
  maxHeight = '75vh',
  enableDragToClose = true,
  enableKeyboardControls = true
}) => {
  const modalRef = useRef(null);
  const initialTouchRef = useRef(null);
  const touchDeltaRef = useRef(0);
  const [dragState, setDragState] = useState({ isDragging: false, offset: 0 });
  const [visualState, setVisualState] = useState('closed'); // closed, opening, open, expanding, expanded, collapsing, closing
  
  // Configure ARIA roles and attributes for accessibility
  const getAriaAttributes = () => {
    return {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-live': 'assertive',
      'aria-labelledby': `gion-${currentView}-title`,
    };
  };
  
  // Handle visual state transitions
  useEffect(() => {
    // Handle modal open/close state
    if (!isOpen) {
      setVisualState('closed');
      return;
    }
    
    if (isOpen && visualState === 'closed') {
      setVisualState('opening');
      const timer = setTimeout(() => {
        setVisualState(isExpanded ? 'expanded' : 'open');
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
    
    // Handle expanded/collapsed state
    if (isOpen && isExpanded && (visualState === 'open' || visualState === 'opening')) {
      setVisualState('expanding');
      const timer = setTimeout(() => {
        setVisualState('expanded');
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
    
    if (isOpen && !isExpanded && (visualState === 'expanded' || visualState === 'expanding')) {
      setVisualState('collapsing');
      const timer = setTimeout(() => {
        setVisualState('open');
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen, isExpanded, visualState]);
  
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isOpen && enableKeyboardControls) {
        onClose();
      }
    };
    
    if (isOpen && enableKeyboardControls) {
      window.addEventListener('keydown', handleEscapeKey);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose, enableKeyboardControls]);
  
  // Focus trap implementation
  useEffect(() => {
    if (!isOpen || !modalRef.current || !enableKeyboardControls) return;
    
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Set initial focus after a short delay to ensure modal is visible
    setTimeout(() => {
      firstElement.focus();
    }, 100);
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, enableKeyboardControls, visualState]);
  
  // Touch event handling for mobile swipe to close
  useEffect(() => {
    if (!modalRef.current || !enableDragToClose || isExpanded) return;
    
    const modalElement = modalRef.current;
    
    const handleTouchStart = (e) => {
      // Only initiate drag on the header or when at the top of content
      const content = modalElement.querySelector('.gion-content');
      const header = modalElement.querySelector('.gion-modal-header, .gion-slim-header');
      
      const isHeader = header && (e.target === header || header.contains(e.target));
      const isAtTopOfContent = content && content.scrollTop <= 5;
      
      if (!isHeader && !isAtTopOfContent) {
        return;
      }
      
      initialTouchRef.current = e.touches[0].clientY;
      setDragState({ isDragging: true, offset: 0 });
      modalElement.style.transition = 'none';
    };
    
    const handleTouchMove = (e) => {
      if (!dragState.isDragging || !initialTouchRef.current) return;
      
      const currentY = e.touches[0].clientY;
      const delta = currentY - initialTouchRef.current;
      
      // Only allow dragging down
      if (delta < 0) {
        setDragState({ isDragging: true, offset: 0 });
        return;
      }
      
      // Apply resistance as user drags further
      touchDeltaRef.current = delta;
      const dampenedDelta = Math.min(delta * 0.5, 200);
      setDragState({ isDragging: true, offset: dampenedDelta });
    };
    
    const handleTouchEnd = () => {
      if (!dragState.isDragging) return;
      
      modalElement.style.transition = `transform 300ms ease, opacity 300ms ease`;
      
      // If dragged more than threshold, close the modal
      if (touchDeltaRef.current > 120) {
        onClose();
      } else {
        // Reset position
        setDragState({ isDragging: false, offset: 0 });
      }
      
      initialTouchRef.current = null;
      touchDeltaRef.current = 0;
    };
    
    modalElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    modalElement.addEventListener('touchmove', handleTouchMove, { passive: true });
    modalElement.addEventListener('touchend', handleTouchEnd);
    modalElement.addEventListener('touchcancel', handleTouchEnd);
    
    return () => {
      modalElement.removeEventListener('touchstart', handleTouchStart);
      modalElement.removeEventListener('touchmove', handleTouchMove);
      modalElement.removeEventListener('touchend', handleTouchEnd);
      modalElement.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [dragState.isDragging, onClose, enableDragToClose, isExpanded]);
  
  // Only render if open or in closing state
  if (visualState === 'closed') return null;

  // Determine modal class names based on visual state
  const getModalClassName = () => {
    let className = 'gion-modal';
    
    switch (visualState) {
      case 'opening':
        className += ' visible entering';
        break;
      case 'open':
        className += ' visible';
        break;
      case 'closing':
        className += ' visible exiting';
        break;
      case 'expanding':
        className += ' visible expanding';
        break;
      case 'expanded':
        className += ' visible expanded';
        break;
      case 'collapsing':
        className += ' visible collapsing';
        break;
      default:
        break;
    }
    
    // Add view-specific and drag-specific classes
    if (currentView === 'success') className += ' success-bg';
    if (currentView === 'main') className += ' main-view';
    if (dragState.isDragging) className += ' dragging';
    
    return className;
  };

  // Dynamic style based on current state
  const getModalStyle = () => {
    const style = {
      '--modal-max-width': isExpanded ? '100%' : maxWidth,
      '--modal-max-height': isExpanded ? '100%' : maxHeight,
    };
    
    // Apply drag transform if dragging
    if (dragState.isDragging && dragState.offset > 0) {
      return {
        ...style,
        transform: `translateY(${dragState.offset}px)`,
        opacity: 1 - (dragState.offset / 400)
      };
    }
    
    return style;
  };

  return (
    <>
      {/* Backdrop - separate from modal for better control */}
      <div 
        className={`gion-backdrop ${visualState !== 'closed' ? 'visible' : ''}`} 
        onClick={onClose}
        aria-hidden="true"
      ></div>
      
      {/* Expanded mode close button - outside modal for better z-index management */}
      {visualState === 'expanded' && (
        <button 
          className="expanded-modal-close" 
          onClick={onClose}
          aria-label="Close expanded view"
        >
          <X size={18} />
        </button>
      )}
      
      {/* Main modal container */}
      <div 
        className={getModalClassName()} 
        ref={modalRef}
        style={getModalStyle()}
        {...getAriaAttributes()}
        id="gion-modal"
      >
        {/* Modal content */}
        <div className="gion-content">
          {children}
        </div>
        
        {/* Fullscreen toggle button */}
        <button 
          className="gion-fullscreen-button"
          onClick={onToggleExpand}
          aria-label={isExpanded ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        
        {/* Drag indicator for mobile */}
        {!isExpanded && enableDragToClose && (
          <div className="gion-drag-indicator" aria-hidden="true">
            <div className="drag-handle"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default GIONModal;