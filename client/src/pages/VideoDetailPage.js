// src/pages/VideoDetailPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { videoService } from '../services/videoService';
import { Clock, Eye, ChevronLeft, Share2 } from 'lucide-react';
import './VideoDetailPage.css';

const VideoDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  
  // Helper for validating YouTube IDs
  const isValidYoutubeId = (id) => {
    if (!id || typeof id !== 'string') return false;
    return /^[a-zA-Z0-9_-]{11}$/.test(id);
  };
  
  // Fallback images handler
  const getYoutubeThumbnail = (videoId) => {
    if (!isValidYoutubeId(videoId)) {
      console.error('Invalid YouTube ID:', videoId);
      return '/images/placeholders/default.jpg';
    }
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };
  
  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const videoData = await videoService.getVideo(id);
        
        if (!videoData) {
          throw new Error('Video not found');
        }
        
        // Validate the YouTube ID
        if (!isValidYoutubeId(videoData.youtubeVideoId)) {
          console.error('Invalid YouTube video ID in data:', videoData.youtubeVideoId);
          // Try to extract from URL as a fallback
          if (videoData.youtubeUrl) {
            const extractedId = videoService.extractYouTubeId(videoData.youtubeUrl);
            if (isValidYoutubeId(extractedId)) {
              videoData.youtubeVideoId = extractedId;
              console.log('Successfully extracted valid ID from URL:', extractedId);
            } else {
              throw new Error('Invalid YouTube video reference');
            }
          } else {
            throw new Error('Invalid YouTube video reference');
          }
        }
        
        setVideo(videoData);
        
        // Fetch related videos in the same category
        const related = await videoService.getVideosByCategory(videoData.category, 6);
        // Filter out the current video
        setRelatedVideos(related.filter(v => v._id !== videoData._id));
      } catch (error) {
        console.error('Error fetching video:', error);
        setError(error.message || 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideo();
  }, [id]);
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleBackClick = () => {
    navigate(-1);
  };
  
  const handleRelatedVideoClick = (videoId) => {
    navigate(`/videos/${videoId}`);
  };
  
  if (loading) {
    return (
      <div className="video-page-loading">
        <div className="spinner"></div>
        <p>Loading video...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="video-page-error">
        <h2>Error</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={handleBackClick}>Go Back</button>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }
  
  if (!video) return null;
  
  return (
    <div className="video-detail-page">
      <div className="video-container">
        <div className="video-player-wrapper">
          {isValidYoutubeId(video.youtubeVideoId) ? (
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeVideoId}?autoplay=1&rel=0`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="video-player"
            ></iframe>
          ) : (
            <div className="video-error-message">
              <p>Unable to play video: Invalid video reference</p>
              <button onClick={() => window.location.reload()}>
                Reload
              </button>
            </div>
          )}
        </div>
        
        <div className="video-info">
          <h1 className="video-title">{video.title}</h1>
          
          <div className="video-meta">
            <div className="video-badges">
              <span className={`video-badge category-${video.category}`}>
                {video.category.replace(/-/g, ' ')}
              </span>
              {video.subscriptionTier !== 'none' && (
                <span className={`video-badge tier-${video.subscriptionTier}`}>
                  {video.subscriptionTier}
                </span>
              )}
              {video.featured && (
                <span className="video-badge featured">Featured</span>
              )}
            </div>
            
            <div className="video-stats">
              <span className="video-views">
                <Eye size={16} /> {video.metadata?.views || 0} views
              </span>
              <span className="video-date">
                <Clock size={16} /> {formatDate(video.publishDate || video.createdAt)}
              </span>
            </div>
          </div>
          
          <div className="video-actions">
            <button className="back-button" onClick={handleBackClick}>
              <ChevronLeft size={18} /> Back
            </button>
            <button className="share-button">
              <Share2 size={18} /> Share
            </button>
          </div>
          
          {video.description && (
            <div className="video-description">
              <h3>Description</h3>
              <p>{video.description}</p>
            </div>
          )}
        </div>
      </div>
      
      {relatedVideos.length > 0 && (
        <div className="related-videos">
          <h2>Related Videos</h2>
          <div className="related-videos-grid">
            {relatedVideos.map(relatedVideo => (
              <div 
                key={relatedVideo._id} 
                className="related-video-card"
                onClick={() => handleRelatedVideoClick(relatedVideo._id)}
              >
                <div className="related-video-thumbnail">
                  <img 
                    src={getYoutubeThumbnail(relatedVideo.youtubeVideoId)}
                    alt={relatedVideo.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholders/default.jpg';
                    }}
                  />
                  <div className="play-overlay">
                    <div className="play-icon"></div>
                  </div>
                </div>
                <h3 className="related-video-title">{relatedVideo.title}</h3>
                <div className="related-video-meta">
                  <span className="related-video-date">
                    {formatDate(relatedVideo.publishDate || relatedVideo.createdAt)}
                  </span>
                  <span className="related-video-views">
                    {relatedVideo.metadata?.views || 0} views
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoDetailPage;