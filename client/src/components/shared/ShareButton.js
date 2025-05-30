// src/components/shared/ShareButton.js
import React, { useState, useRef } from 'react';
import './ShareButton.css';

const ShareButton = ({ url, title, description, image }) => {
  const [showShare, setShowShare] = useState(false);
  const buttonRef = useRef(null);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || '');
  const encodedImage = image ? encodeURIComponent(image) : '';

  const shareLinks = [
    {
      name: 'Facebook',
      icon: '📘',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    },
    {
      name: 'Twitter',
      icon: '🐦',
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    },
    {
      name: 'WhatsApp',
      icon: '📱',
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
    },
    {
      name: 'Email',
      icon: '✉️',
      url: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
    },
    {
      name: 'Copy Link',
      icon: '🔗',
      action: () => {
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        setShowShare(false);
      }
    }
  ];

  const handleClickOutside = (event) => {
    if (buttonRef.current && !buttonRef.current.contains(event.target)) {
      setShowShare(false);
    }
  };

  React.useEffect(() => {
    if (showShare) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showShare]);

  return (
    <div className="bcc-share-container" ref={buttonRef}>
      <button 
        className="bcc-share-button"
        onClick={() => setShowShare(!showShare)}
        aria-label="Share"
      >
        <span className="bcc-share-icon">🔗</span>
      </button>
      
      {showShare && (
        <div className="bcc-share-dropdown">
          <div className="bcc-share-header">
            <span>Share via</span>
            <button 
              className="bcc-share-close"
              onClick={() => setShowShare(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="bcc-share-options">
            {shareLinks.map((link, index) => (
              <button
                key={index}
                className="bcc-share-option"
                onClick={() => {
                  if (link.action) {
                    link.action();
                  } else {
                    window.open(link.url, '_blank');
                    setShowShare(false);
                  }
                }}
              >
                <span className="bcc-share-option-icon">{link.icon}</span>
                <span className="bcc-share-option-name">{link.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareButton;