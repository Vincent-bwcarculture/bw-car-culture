import React, { useState, useEffect, useRef } from 'react';
import { Play, Maximize, Volume2, VolumeX, X } from 'lucide-react';
import './YouTubePlayer.css';

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL in any format
 * @returns {string|null} - YouTube video ID or null if invalid
 */
const extractYouTubeId = (url) => {
  if (!url) return null;
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Reusable YouTube player component with S3 custom thumbnail support
 */
const YouTubePlayer = ({ 
  videoUrl, 
  videoId = null,
  title = 'YouTube Video',
  thumbnailUrl = null,
  customThumbnail = null, // S3 thumbnail object: {url, key}
  autoplay = false,
  showControls = true,
  aspectRatio = '16/9',
  className = '',
  onClose = null,
  onError = null
}) => {
// Add at the beginning of the YouTubePlayer component
const checkFailedThumbnail = (url) => {
  try {
    const failedThumbnails = JSON.parse(localStorage.getItem('failedVideoThumbnails') || '{}');
    return !!failedThumbnails[url];
  } catch (e) {
    return false;
  }
};

const markFailedThumbnail = (url) => {
  try {
    const failedThumbnails = JSON.parse(localStorage.getItem('failedVideoThumbnails') || '{}');
    failedThumbnails[url] = Date.now();
    
    // Limit cache size
    const keys = Object.keys(failedThumbnails);
    if (keys.length > 100) {
      const oldestKey = keys.sort((a, b) => failedThumbnails[a] - failedThumbnails[b])[0];
      delete failedThumbnails[oldestKey];
    }
    
    localStorage.setItem('failedVideoThumbnails', JSON.stringify(failedThumbnails));
  } catch (e) {
    // Ignore localStorage errors
  }
};

  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [embedId, setEmbedId] = useState(null);
  const [thumbnailError, setThumbnailError] = useState(false);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  
  // Set video ID based on props
  useEffect(() => {
    let id = videoId;
    
    // Extract ID from URL if not provided directly
    if (!id && videoUrl) {
      id = extractYouTubeId(videoUrl);
    }
    
    setEmbedId(id);
    
    if (!id && onError) {
      onError('Invalid YouTube URL or ID');
    }
  }, [videoUrl, videoId, onError]);
  
  // Reset thumbnail error when thumbnail changes
  useEffect(() => {
    setThumbnailError(false);
  }, [thumbnailUrl, customThumbnail]);
  
  // Handle play/pause
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Handle mute/unmute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };
  
  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === containerRef.current || 
        document.webkitFullscreenElement === containerRef.current || 
        document.msFullscreenElement === containerRef.current
      );
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Get thumbnail URL for the video - Updated for S3 support
 // Get thumbnail URL for the video - Enhanced for S3 support
const getVideoThumbnail = () => {
  try {
    // If thumbnail error occurred, fallback to placeholder
    if (thumbnailError) {
      return '/images/placeholders/video.jpg';
    }
    
    // Create a variable to hold the thumbnail URL
    let thumbnailUrl = '';
    
    // Priority 1: S3 custom thumbnail
    if (customThumbnail) {
      if (typeof customThumbnail === 'string') {
        thumbnailUrl = customThumbnail;
      } else if (customThumbnail.url) {
        thumbnailUrl = customThumbnail.url;
      } else if (customThumbnail.key) {
        return `/api/images/s3-proxy/${customThumbnail.key}`;
      }
    }
    
    // Priority 2: Direct thumbnail URL
    if (!thumbnailUrl && thumbnailUrl) {
      thumbnailUrl = thumbnailUrl;
    }
    
    // Priority 3: YouTube thumbnail
    if (!thumbnailUrl && embedId) {
      thumbnailUrl = `https://img.youtube.com/vi/${embedId}/maxresdefault.jpg`;
    }
    
    // If we have a thumbnail URL at this point
    if (thumbnailUrl) {
      // Fix problematic S3 URLs with duplicate paths
      if (thumbnailUrl.includes('/images/images/')) {
        thumbnailUrl = thumbnailUrl.replace(/\/images\/images\//g, '/images/');
      }
      
      // Check if this thumbnail has previously failed
      if (checkFailedThumbnail(thumbnailUrl)) {
        console.log(`Using cached fallback for previously failed thumbnail: ${thumbnailUrl}`);
        return '/images/placeholders/video.jpg';
      }
      
      // For relative paths, ensure they start with /
      if (!thumbnailUrl.startsWith('http') && !thumbnailUrl.startsWith('/')) {
        thumbnailUrl = `/${thumbnailUrl}`;
      }
      
      return thumbnailUrl;
    }
    
    // Fallback: placeholder
    return '/images/placeholders/video.jpg';
  } catch (error) {
    console.error('Error getting video thumbnail:', error);
    return '/images/placeholders/video.jpg';
  }
};
  
  // Error handler for thumbnail with multiple fallbacks
// Error handler for thumbnail with multiple fallbacks and S3 support
const handleThumbnailError = (e) => {
  const originalSrc = e.target.src;
  console.log('Thumbnail failed to load:', originalSrc);
  
  // Mark this URL as failed
  markFailedThumbnail(originalSrc);
  
  // For S3 URLs, try the proxy endpoint
  if (originalSrc.includes('amazonaws.com')) {
    // Extract key from S3 URL
    const key = originalSrc.split('.amazonaws.com/').pop();
    if (key) {
      // Normalize the key to prevent duplicate segments
      const normalizedKey = key.replace(/images\/images\//g, 'images/');
      e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
      return;
    }
  }
  
  // If it's an S3 URL that failed, go to YouTube thumbnail
  if (originalSrc.includes('amazonaws.com') || 
      (customThumbnail && originalSrc === (typeof customThumbnail === 'string' ? 
                                          customThumbnail : customThumbnail.url))) {
    if (embedId) {
      e.target.src = `https://img.youtube.com/vi/${embedId}/maxresdefault.jpg`;
      return;
    }
  }
  
  // Try lower quality YouTube thumbnail if high quality fails
  if (embedId && originalSrc.includes('maxresdefault')) {
    e.target.src = `https://img.youtube.com/vi/${embedId}/mqdefault.jpg`;
    return;
  }
  
  if (embedId && originalSrc.includes('mqdefault')) {
    // If medium quality fails, try default quality
    e.target.src = `https://img.youtube.com/vi/${embedId}/0.jpg`;
    return;
  }
  
  // Try thumbnails directory if not already tried
  if (!originalSrc.includes('/uploads/videos/thumbnails/') && 
      !originalSrc.includes('/images/placeholders/')) {
    const filename = originalSrc.split('/').pop();
    if (filename) {
      e.target.src = `/uploads/videos/thumbnails/${filename}`;
      return;
    }
  }
  
  // All thumbnails failed, use placeholder
  setThumbnailError(true);
  e.target.src = '/images/placeholders/video.jpg';
};
  
  // If no embed ID, return placeholder
  if (!embedId) {
    return (
      <div 
        className={`youtube-player invalid ${className}`}
        style={{ aspectRatio }}
      >
        <div className="youtube-error-message">
          <p>Invalid YouTube URL or ID</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`youtube-player ${isPlaying ? 'playing' : ''} ${isFullscreen ? 'fullscreen' : ''} ${className}`}
      style={{ aspectRatio }}
    >
      {isPlaying ? (
        <iframe
          ref={playerRef}
          src={`https://www.youtube.com/embed/${embedId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=${showControls ? 1 : 0}`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="youtube-iframe"
        ></iframe>
      ) : (
        <div className="youtube-thumbnail-container">
          <img 
            src={getVideoThumbnail()} 
            alt={title}
            className="youtube-thumbnail"
            onError={handleThumbnailError}
          />
          <div className="youtube-thumbnail-overlay">
            <button 
              className="youtube-play-button"
              onClick={togglePlay}
              aria-label="Play video"
            >
              <Play size={24} fill="#fff" />
            </button>
            <h3 className="youtube-title">{title}</h3>
          </div>
        </div>
      )}
      
      {isPlaying && showControls && (
        <div className="youtube-controls">
          <button 
            className="youtube-control-button mute"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          <button 
            className="youtube-control-button fullscreen"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            <Maximize size={18} />
          </button>
          
          {onClose && (
            <button 
              className="youtube-control-button close"
              onClick={onClose}
              aria-label="Close video"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Export both the component and the utility function
export { extractYouTubeId };
export default YouTubePlayer;