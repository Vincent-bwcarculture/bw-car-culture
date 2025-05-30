// src/components/shared/ShareModal.js - Modified for Direct Native Share
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import './ShareModal.css';

const ShareModal = ({ car, dealer, onClose, buttonRef }) => {
  const modalRef = useRef(null);
  const copyInputRef = useRef(null);
  
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Determine what we're sharing
  const isShareDealer = !!dealer;
  const shareItem = isShareDealer ? dealer : car;

  // Generate share data
  const shareData = useMemo(() => {
    const baseUrl = window.location.origin;
    let shareUrl = window.location.href;
    let shareText = '';
    let shareTitle = '';

    if (isShareDealer && dealer) {
      shareUrl = `${baseUrl}/dealerships/${dealer._id || dealer.id}`;
      shareTitle = dealer.businessName || 'Dealership';
      shareText = `Check out ${dealer.businessName} on BW Car Culture - Your trusted automotive marketplace in Botswana`;
    } else if (car) {
      shareUrl = `${baseUrl}/marketplace/${car._id || car.id}`;
      const title = car.title || 'Vehicle';
      shareTitle = title;
      const price = car.price ? `P${car.price.toLocaleString()}` : 'POA';
      shareText = `${title} for ${price} on BW Car Culture - Botswana's leading car marketplace`;
    } else {
      shareUrl = baseUrl;
      shareTitle = 'BW Car Culture';
      shareText = 'Discover quality vehicles on BW Car Culture - Botswana\'s premier automotive marketplace';
    }

    return { shareUrl, shareText, shareTitle };
  }, [isShareDealer, dealer, car]);

  // Try native share immediately when component mounts
  useEffect(() => {
    const tryNativeShare = async () => {
      const nativeShareData = {
        title: shareData.shareTitle,
        text: shareData.shareText,
        url: shareData.shareUrl
      };

      try {
        // Check if native share is available and can share this data
        if (navigator.share && navigator.canShare && navigator.canShare(nativeShareData)) {
          await navigator.share(nativeShareData);
          // If successful, close the modal
          onClose();
          return;
        }
        
        // If native share is available but can't share this data, try with just URL
        if (navigator.share) {
          await navigator.share({
            title: shareData.shareTitle,
            url: shareData.shareUrl
          });
          onClose();
          return;
        }
        
        // If no native share, try clipboard as quick fallback
        if (navigator.clipboard && window.isSecureContext) {
          const fullText = `${shareData.shareText}\n\n${shareData.shareUrl}`;
          await navigator.clipboard.writeText(fullText);
          showCopyNotification('Link copied to clipboard!');
          onClose();
          return;
        }
        
        // If all quick methods fail, show the fallback modal
        setShowFallback(true);
        setTimeout(() => setIsVisible(true), 10);
        
      } catch (error) {
        console.error('Native share failed:', error);
        
        // If user cancelled native share, just close
        if (error.name === 'AbortError') {
          onClose();
          return;
        }
        
        // For other errors, try clipboard fallback
        try {
          if (navigator.clipboard && window.isSecureContext) {
            const fullText = `${shareData.shareText}\n\n${shareData.shareUrl}`;
            await navigator.clipboard.writeText(fullText);
            showCopyNotification('Link copied to clipboard!');
            onClose();
            return;
          }
        } catch (clipboardError) {
          console.error('Clipboard fallback failed:', clipboardError);
        }
        
        // If everything fails, show the modal
        setShowFallback(true);
        setTimeout(() => setIsVisible(true), 10);
      }
    };

    tryNativeShare();
  }, [shareData, onClose]);

  // Simple notification function
  const showCopyNotification = (message) => {
    // Remove existing notification
    const existingNotification = document.querySelector('.share-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create new notification
    const notification = document.createElement('div');
    notification.className = 'share-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideInFade 0.3s ease-out;
    `;

    // Add animation keyframes if not already added
    if (!document.querySelector('#share-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'share-notification-styles';
      style.textContent = `
        @keyframes slideInFade {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto remove after 2 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideInFade 0.3s ease-out reverse';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }
    }, 2000);
  };

  // Professional share platforms for fallback
  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: 'whatsapp',
      color: '#25D366',
      url: `https://wa.me/?text=${encodeURIComponent(shareData.shareText + '\n\n' + shareData.shareUrl)}`,
      popular: true
    },
    {
      name: 'Facebook',
      icon: 'facebook',
      color: '#1877F2', 
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.shareUrl)}`,
      popular: true
    },
    {
      name: 'Twitter',
      icon: 'twitter',
      color: '#1DA1F2',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.shareText)}&url=${encodeURIComponent(shareData.shareUrl)}`
    },
    {
      name: 'SMS',
      icon: 'sms',
      color: '#34C759',
      url: `sms:?body=${encodeURIComponent(shareData.shareText + '\n\n' + shareData.shareUrl)}`,
    },
    {
      name: 'Email',
      icon: 'email',
      color: '#EA4335',
      url: `mailto:?subject=${encodeURIComponent(shareData.shareTitle)}&body=${encodeURIComponent(shareData.shareText + '\n\n' + shareData.shareUrl)}`
    },
    {
      name: 'Copy Link',
      icon: 'link',
      color: '#6B7280',
      action: 'copy'
    }
  ];

  // Professional icon components
  const IconComponent = ({ type }) => {
    const icons = {
      whatsapp: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.63"/>
        </svg>
      ),
      facebook: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      twitter: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      sms: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      ),
      email: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
      ),
      link: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
        </svg>
      ),
      close: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      )
    };
    
    return icons[type] || null;
  };

  // Event handlers for fallback modal
  useEffect(() => {
    if (!isVisible || !showFallback) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, showFallback]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  const handleShare = useCallback((link) => {
    if (link.action === 'copy') {
      handleCopyLink();
      return;
    }

    try {
      setError(null);
      const newWindow = window.open(link.url, '_blank');
      if (newWindow) {
        handleClose();
      } else {
        setError(`Pop-up blocked. Please allow pop-ups and try again.`);
      }
    } catch (error) {
      console.error('Share failed:', error);
      setError(`Unable to share via ${link.name}. Please try again.`);
    }
  }, []);

  const handleCopyLink = useCallback(async () => {
    try {
      setError(null);
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareData.shareUrl);
      } else {
        if (copyInputRef.current) {
          copyInputRef.current.select();
          copyInputRef.current.setSelectionRange(0, 99999);
          const successful = document.execCommand('copy');
          if (!successful) {
            throw new Error('Copy command failed');
          }
        } else {
          throw new Error('Unable to access clipboard');
        }
      }
      
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        handleClose();
      }, 1500);
      
    } catch (error) {
      console.error('Copy failed:', error);
      setError('Unable to copy link. Please select and copy manually.');
    }
  }, [shareData.shareUrl, handleClose]);

  // Only render modal if we need the fallback
  if (!showFallback || (!shareItem && !car)) return null;

  const modalContent = (
    <div 
      className={`share-modal-overlay ${isVisible ? 'visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className={`share-modal ${isVisible ? 'visible' : ''}`} ref={modalRef}>
        <div className="share-modal-header">
          <h3 id="share-modal-title" className="share-modal-title">
            Share {isShareDealer ? dealer?.businessName || 'Dealership' : car?.title || 'Vehicle'}
          </h3>
          <button 
            className="share-modal-close" 
            onClick={handleClose}
            aria-label="Close share modal"
          >
            <IconComponent type="close" />
          </button>
        </div>

        {error && (
          <div className="share-modal-error" role="alert">
            <span className="share-modal-error-icon">⚠</span>
            {error}
          </div>
        )}

        {copySuccess && (
          <div className="share-modal-success" role="alert">
            <span className="share-modal-success-icon">✓</span>
            Link copied successfully!
          </div>
        )}
        
        <div className="share-modal-options">
          {shareLinks.map(link => (
            <button 
              key={link.name}
              className={`share-modal-button ${link.popular ? 'popular' : ''}`}
              onClick={() => handleShare(link)}
              style={{ '--button-color': link.color }}
              aria-label={`Share via ${link.name}`}
            >
              <div className="share-modal-icon">
                <IconComponent type={link.icon} />
              </div>
              <span className="share-modal-label">{link.name}</span>
            </button>
          ))}
        </div>
        
        <div className="share-modal-link-section">
          <label htmlFor="share-url" className="share-modal-link-label">
            Or copy the link:
          </label>
          <div className="share-modal-link-container">
            <input 
              id="share-url"
              ref={copyInputRef}
              type="text" 
              value={shareData.shareUrl} 
              readOnly 
              className="share-modal-link-input"
              onClick={(e) => e.target.select()}
              aria-label="Shareable URL"
            />
            <button 
              className={`share-modal-copy-button ${copySuccess ? 'success' : ''}`}
              onClick={handleCopyLink}
              aria-label="Copy link to clipboard"
            >
              {copySuccess ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ShareModal;