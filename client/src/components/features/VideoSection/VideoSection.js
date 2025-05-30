// src/components/features/VideoSection/VideoSection.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoService } from '../../../services/videoService.js';
import { Play, Youtube, Clock, ChevronRight, Filter } from 'lucide-react';
import YouTubePlayer from '../../shared/YouTubePlayer/YouTubePlayer.js';
import './VideoSection.css';

const VideoSection = () => {

  // Add at the beginning of the VideoSection component
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

  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeVideo, setActiveVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const categories = [
    { id: 'all', label: 'All Videos' },
    { id: 'car-review', label: 'Car Reviews' },
    { id: 'podcast', label: 'Podcasts' },
    { id: 'maintenance', label: 'Maintenance & Cost' },
    { id: 'test-drive', label: 'Test Drives' },
    { id: 'comparison', label: 'Comparisons' }
  ];
  
  // Fetch videos on component mount and when category changes
  useEffect(() => {
    fetchVideos();
  }, [activeCategory]);
  
  // Fetch videos from API
  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (activeCategory === 'all') {
        // Fetch featured videos by default
        response = await videoService.getFeaturedVideos(6);
      } else {
        // Fetch videos for specific category
        response = await videoService.getVideosByCategory(activeCategory, 6);
      }
      
      if (Array.isArray(response) && response.length > 0) {
        setVideos(response);
        
        // Set first video as active if none selected
        if (!activeVideo) {
          setActiveVideo(response[0]);
        }
      } else {
        setVideos([]);
        setActiveVideo(null);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Failed to load videos. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setActiveVideo(null);
    setIsPlaying(false);
  };
  
  // Handle video selection
  const handleVideoSelect = (video) => {
    setActiveVideo(video);
    setIsPlaying(false);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Navigate to video page
  const viewAllVideos = () => {
    navigate('/videos');
  };
  
  // Get thumbnail URL with S3 support
// Enhanced function to get thumbnail URL with S3 support
const getThumbnailUrl = (video) => {
  try {
    let thumbnailUrl = '';
    
    // Check for thumbnailUrl property
    if (video.thumbnailUrl) {
      if (typeof video.thumbnailUrl === 'string') {
        thumbnailUrl = video.thumbnailUrl;
      } else if (video.thumbnailUrl.url) {
        thumbnailUrl = video.thumbnailUrl.url;
      } else if (video.thumbnailUrl.key) {
        return `/api/images/s3-proxy/${video.thumbnailUrl.key}`;
      }
    }
    
    // Check for thumbnail property (some APIs might use this instead)
    if (!thumbnailUrl && video.thumbnail) {
      if (typeof video.thumbnail === 'string') {
        thumbnailUrl = video.thumbnail;
      } else if (video.thumbnail.url) {
        thumbnailUrl = video.thumbnail.url;
      } else if (video.thumbnail.key) {
        return `/api/images/s3-proxy/${video.thumbnail.key}`;
      }
    }
    
    // If thumbnailUrl is set, handle it
    if (thumbnailUrl) {
      // Fix duplicate path segments in S3 URLs
      if (thumbnailUrl.includes('/images/images/')) {
        thumbnailUrl = thumbnailUrl.replace(/\/images\/images\//g, '/images/');
      }
      
      // Check if this thumbnail has previously failed
      if (checkFailedThumbnail(thumbnailUrl)) {
        console.log(`Using cached fallback for previously failed thumbnail: ${thumbnailUrl}`);
        return `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`;
      }
      
      // If S3 URL or starts with http, return as is
      if (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://')) {
        return thumbnailUrl;
      }
      
      // If local path, ensure it starts with /
      if (!thumbnailUrl.startsWith('/')) {
        thumbnailUrl = `/${thumbnailUrl}`;
      }
      
      return thumbnailUrl;
    }
    
    // Fallback to YouTube thumbnail
    return `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`;
  } catch (error) {
    console.error('Error getting video thumbnail URL:', error);
    
    // If we have YouTube ID, use it for fallback
    if (video.youtubeVideoId) {
      return `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`;
    }
    
    // Final fallback
    return '/images/placeholders/video.jpg';
  }
};
  
  return (
    <section className="video-section">
      <div className="video-section-header">
        <h2><Youtube size={24} /> Car Culture Videos</h2>
        <button className="view-all-btn" onClick={viewAllVideos}>
          View All <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="categories-filter">
        <div className="filter-icon">
          <Filter size={16} />
        </div>
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => handleCategoryChange(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>
      
      <div className="videos-content">
        <div className="featured-video">
          {loading && !activeVideo ? (
            <div className="video-loading">
              <div className="video-spinner"></div>
              <p>Loading videos...</p>
            </div>
          ) : error && !activeVideo ? (
            <div className="video-error">
              <p>{error}</p>
              <button className="retry-btn" onClick={fetchVideos}>
                Retry
              </button>
            </div>
          ) : activeVideo ? (
            <>
              <div className="featured-video-player">
  <YouTubePlayer
    videoId={activeVideo.youtubeVideoId}
    title={activeVideo.title}
    thumbnailUrl={getThumbnailUrl(activeVideo)}
    autoplay={isPlaying}
    showControls={true}
    aspectRatio="16/9"
    className="main-player"
  />
  <button
    className={`play-featured-btn ${isPlaying ? 'playing' : ''}`}
    onClick={() => setIsPlaying(!isPlaying)}
  >
    {isPlaying ? 'Now Playing' : 'Play Video'}
  </button>
</div>
              
              <div className="featured-video-info">
                <div className="video-badge-container">
                  {activeVideo.featured && (
                    <span className="video-badge featured">Featured</span>
                  )}
                  <span className={`video-badge category-${activeVideo.category}`}>
                    {activeVideo.category.replace(/-/g, ' ')}
                  </span>
                  {activeVideo.subscriptionTier !== 'none' && (
                    <span className={`video-badge tier-${activeVideo.subscriptionTier}`}>
                      {activeVideo.subscriptionTier}
                    </span>
                  )}
                </div>
                
                <h3 className="featured-video-title">{activeVideo.title}</h3>
                {activeVideo.description && (
                  <p className="featured-video-description">{activeVideo.description}</p>
                )}
                
                <div className="featured-video-meta">
                  <span className="video-date">
                    <Clock size={14} /> {formatDate(activeVideo.publishDate || activeVideo.createdAt)}
                  </span>
                  <span className="video-views">
                    {activeVideo.metadata?.views || 0} views
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="no-videos">
              <h3>No videos available</h3>
              <p>There are no videos for this category yet.</p>
            </div>
          )}
        </div>
        
        <div className="video-thumbnails-list">
          <h3 className="list-title">More Videos</h3>
          
          {loading && videos.length === 0 ? (
            <div className="thumbnails-loading">
              <div className="thumbnails-spinner"></div>
            </div>
          ) : videos.length === 0 ? (
            <p className="no-thumbnails-message">No videos available</p>
          ) : (
            <div className="thumbnails-grid">
              {videos.map(video => (
                <div 
                  key={video._id} 
                  className={`video-thumbnail-item ${activeVideo && activeVideo._id === video._id ? 'active' : ''}`}
                  onClick={() => handleVideoSelect(video)}
                >
                  <div className="thumbnail-image">
                    <img 
  src={getThumbnailUrl(video)} 
  alt={video.title}
  onError={(e) => {
    const originalSrc = e.target.src;
    console.log('Video thumbnail failed to load:', originalSrc);
    
    // Mark this URL as failed
    markFailedThumbnail(originalSrc);
    
    // For S3 URLs, try the proxy endpoint
    if (originalSrc.includes('amazonaws.com')) {
      // Extract key from S3 URL
      const key = originalSrc.split('.amazonaws.com/').pop();
      if (key) {
        // Normalize the key
        const normalizedKey = key.replace(/images\/images\//g, 'images/');
        e.target.src = `/api/images/s3-proxy/${normalizedKey}`;
        return;
      }
    }
    
    // If S3 URL fails, fall back to YouTube thumbnail
    if (originalSrc.includes('amazonaws.com') || !originalSrc.includes('youtube.com')) {
      if (video.youtubeVideoId) {
        e.target.src = `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`;
        return;
      }
    }
    
    // For YouTube thumbnails, try fallback quality
    if (originalSrc.includes('mqdefault')) {
      e.target.src = `https://img.youtube.com/vi/${video.youtubeVideoId}/0.jpg`;
      return;
    }
    
    // Final fallback
    e.target.src = '/images/placeholders/video.jpg';
  }}
/>
                    <button className="thumbnail-play-btn">
                      <Play size={24} />
                    </button>
                    
                    <div className="thumbnail-badges">
                      <span className={`thumbnail-badge category-${video.category}`}>
                        {video.category.replace(/-/g, ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <h4 className="thumbnail-title">{video.title}</h4>
                  <span className="thumbnail-date">
                    {formatDate(video.publishDate || video.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default VideoSection;