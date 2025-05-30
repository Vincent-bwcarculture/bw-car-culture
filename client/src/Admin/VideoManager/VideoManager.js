// src/Admin/VideoManager/VideoManager.js
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addNotification } from '../../store/slices/uiSlice.js';
import { videoService } from '../../services/videoService.js';
import { Plus, Search, Filter, Trash2, Edit, Star, Youtube, Tv } from 'lucide-react';
import VideoUploadModal from '../VideoUploadModal/VideoUploadModal.js';
import ConfirmModal from '../ConfirmModal/ConfirmModal.js';
import './VideoManager.css';
import { formatTimeAgo } from '../../utils/dateUtils.js';

const VideoManager = () => {

// Add at the beginning of the VideoManager component
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

  const dispatch = useDispatch();
  
  // State management
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);
  
  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    subscriptionTier: '',
    status: ''
  });
  
  const [activeFilters, setActiveFilters] = useState({
    search: '',
    category: '',
    subscriptionTier: '',
    status: ''
  });
  
  // Dealers and listings for form
  const [dealers, setDealers] = useState([]);
  const [listings, setListings] = useState([]);
  
  // Load videos on component mount and when filters change
  useEffect(() => {
    fetchVideos();
  }, [page, activeFilters]);
  
  // Load dealers and listings for the form
  useEffect(() => {
    const fetchDealersAndListings = async () => {
      try {
        // In a real implementation, you would fetch these from your API
        // For now, we'll just use empty arrays
        setDealers([]);
        setListings([]);
      } catch (error) {
        console.error('Error fetching dealers and listings:', error);
      }
    };
    
    fetchDealersAndListings();
  }, []);
  
  // Fetch videos with current filters and pagination
  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await videoService.getVideos(activeFilters, page, 10);
      
      if (response.videos) {
        setVideos(response.videos);
        setTotalPages(response.totalPages);
        setTotalVideos(response.total);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Apply filters
  const applyFilters = () => {
    setActiveFilters(filters);
    setPage(1); // Reset to first page when filters change
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      subscriptionTier: '',
      status: ''
    });
    setActiveFilters({
      search: '',
      category: '',
      subscriptionTier: '',
      status: ''
    });
    setPage(1);
  };
  
  // Open modal to add a new video
  const handleAddVideo = () => {
    setSelectedVideo(null);
    setModalOpen(true);
  };
  
  // Open modal to edit an existing video
  const handleEditVideo = (video) => {
    setSelectedVideo(video);
    setModalOpen(true);
  };
  
  // Open confirmation modal to delete a video
  const handleDeleteClick = (video) => {
    setVideoToDelete(video);
    setConfirmModalOpen(true);
  };
  
  // Delete a video
  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;
    
    try {
      await videoService.deleteVideo(videoToDelete._id);
      
      // Remove from local state
      setVideos(videos.filter(v => v._id !== videoToDelete._id));
      
      // Update total count
      setTotalVideos(prev => prev - 1);
      
      // Show notification
      dispatch(addNotification({
        type: 'success',
        message: 'Video deleted successfully'
      }));
      
      // Close modal
      setConfirmModalOpen(false);
      setVideoToDelete(null);
    } catch (error) {
      console.error('Error deleting video:', error);
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to delete video'
      }));
    }
  };
  
  // Handle featured toggle
  const handleToggleFeatured = async (video) => {
    try {
      const response = await videoService.toggleFeatured(video._id);
      
      // Update local state
      setVideos(videos.map(v => 
        v._id === video._id ? { ...v, featured: !v.featured } : v
      ));
      
      // Show notification
      dispatch(addNotification({
        type: 'success',
        message: `Video ${!video.featured ? 'featured' : 'unfeatured'} successfully`
      }));
    } catch (error) {
      console.error('Error toggling featured status:', error);
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to update featured status'
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      if (selectedVideo) {
        // Update existing video
        const updatedVideo = await videoService.updateVideo(selectedVideo._id, formData);
        
        // Update local state
        setVideos(videos.map(v => 
          v._id === selectedVideo._id ? updatedVideo : v
        ));
      } else {
        // Create new video
        const newVideo = await videoService.createVideo(formData);
        
        // Add to local state if it matches current filters
        if (page === 1) {
          setVideos([newVideo, ...videos].slice(0, 10));
        }
        
        // Update total count
        setTotalVideos(prev => prev + 1);
      }
      
      // Close modal
      setModalOpen(false);
      
      // Show notification
      dispatch(addNotification({
        type: 'success',
        message: selectedVideo 
          ? 'Video updated successfully' 
          : 'Video added successfully'
      }));
    } catch (error) {
      console.error('Error saving video:', error);
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to save video'
      }));
    }
  };
  
  // Pagination handlers
  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  // Get class for subscription tier badge
  const getSubscriptionTierClass = (tier) => {
    switch (tier) {
      case 'premium':
        return 'tier-premium';
      case 'standard':
        return 'tier-standard';
      case 'basic':
        return 'tier-basic';
      default:
        return 'tier-none';
    }
  };

  // Enhanced function to get video thumbnail URL with S3 support
const getThumbnailUrl = (video) => {
  try {
    if (!video) return '/images/placeholders/video.jpg';
    
    let thumbnailUrl = '';
    
    // First check for custom S3 thumbnail
    if (video.thumbnailUrl) {
      if (typeof video.thumbnailUrl === 'string') {
        thumbnailUrl = video.thumbnailUrl;
      } else if (typeof video.thumbnailUrl === 'object' && video.thumbnailUrl.url) {
        thumbnailUrl = video.thumbnailUrl.url;
      } else if (typeof video.thumbnailUrl === 'object' && video.thumbnailUrl.key) {
        return `/api/images/s3-proxy/${video.thumbnailUrl.key}`;
      }
    }
    
    // If no custom thumbnail, use YouTube thumbnail
    if (!thumbnailUrl && video.youtubeVideoId) {
      thumbnailUrl = `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`;
    }
    
    // If still no thumbnail, use placeholder
    if (!thumbnailUrl) {
      return '/images/placeholders/video.jpg';
    }
    
    // Check if this thumbnail has previously failed
    if (checkFailedThumbnail(thumbnailUrl)) {
      console.log(`Using cached fallback for previously failed thumbnail: ${thumbnailUrl}`);
      if (video.youtubeVideoId) {
        return `https://img.youtube.com/vi/${video.youtubeVideoId}/0.jpg`;
      }
      return '/images/placeholders/video.jpg';
    }
    
    // Clean up problematic S3 URLs with duplicate paths
    if (thumbnailUrl.includes('/images/images/')) {
      thumbnailUrl = thumbnailUrl.replace(/\/images\/images\//g, '/images/');
    }
    
    return thumbnailUrl;
  } catch (error) {
    console.error('Error getting video thumbnail URL:', error);
    if (video.youtubeVideoId) {
      return `https://img.youtube.com/vi/${video.youtubeVideoId}/0.jpg`;
    }
    return '/images/placeholders/video.jpg';
  }
};
  
  // Get class for status badge
  const getStatusClass = (status) => {
    switch (status) {
      case 'published':
        return 'status-published';
      case 'draft':
        return 'status-draft';
      case 'archived':
        return 'status-archived';
      default:
        return '';
    }
  };
  
  // Render video list item
  const renderVideoItem = (video) => {
    const videoId = video.youtubeVideoId;
    
    return (
      <div key={video._id} className="video-item">
        <div className="video-thumbnail">
        <img 
  src={getThumbnailUrl(video)} 
  alt={video.title}
  onError={(e) => {
    const originalSrc = e.target.src;
    console.log('Video thumbnail failed to load:', originalSrc);
    
    // Mark this thumbnail URL as failed
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
    if ((originalSrc.includes('amazonaws.com') || 
        !originalSrc.includes('youtube.com')) &&
        video.youtubeVideoId) {
      e.target.src = `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`;
      return;
    }
    
    // For YouTube thumbnails, try lower quality version
    if (originalSrc.includes('mqdefault') && video.youtubeVideoId) {
      e.target.src = `https://img.youtube.com/vi/${video.youtubeVideoId}/0.jpg`;
      return;
    }
    
    // Final fallback
    e.target.src = '/images/placeholders/video.jpg';
  }}
/>
          <div className="video-badge-container">
            {video.featured && (
              <span className="video-badge featured">
                <Star size={12} /> Featured
              </span>
            )}
            <span className={`video-badge subscription ${getSubscriptionTierClass(video.subscriptionTier)}`}>
              {video.subscriptionTier === 'none' ? 'Public' : video.subscriptionTier}
            </span>
          </div>
          
          <a 
            href={`https://www.youtube.com/watch?v=${videoId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="video-play-link"
            title="Watch on YouTube"
          >
            <Youtube size={24} />
          </a>
        </div>
        
        <div className="video-details">
          <h3 className="video-title">{video.title}</h3>
          
          <div className="video-meta">
            <span className="video-category">
              {video.category.replace('-', ' ')}
            </span>
            <span className={`video-status ${getStatusClass(video.status)}`}>
              {video.status}
            </span>
            <span className="video-date">
              {formatTimeAgo(video.publishDate || video.createdAt)}
            </span>
          </div>
          
          <div className="video-stats">
            <span className="video-views">
              {video.metadata?.views || 0} views
            </span>
            <span className="video-likes">
              {video.metadata?.likes || 0} likes
            </span>
          </div>
          
          {video.description && (
            <p className="video-description">{video.description}</p>
          )}
        </div>
        
        <div className="video-actions">
          <button 
            className={`action-btn ${video.featured ? 'featured' : ''}`}
            onClick={() => handleToggleFeatured(video)}
            title={video.featured ? 'Remove from featured' : 'Add to featured'}
          >
            <Star size={18} />
          </button>
          <button 
            className="action-btn edit"
            onClick={() => handleEditVideo(video)}
            title="Edit video"
          >
            <Edit size={18} />
          </button>
          <button 
            className="action-btn delete"
            onClick={() => handleDeleteClick(video)}
            title="Delete video"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="video-manager">
      <div className="section-header">
        <div className="header-left">
          <h1><Tv size={24} /> Video Manager</h1>
          <p className="video-count">
            {totalVideos} video{totalVideos !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="add-video-btn" onClick={handleAddVideo}>
          <Plus size={20} /> Add YouTube Video
        </button>
      </div>
      
      <div className="filters-section">
        <div className="filter-header">
          <h2><Filter size={18} /> Filters</h2>
          <button className="reset-filters-btn" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
        
        <div className="filters-row">
          <div className="filter-group search">
            <div className="search-input">
              <Search size={18} />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search videos..."
              />
            </div>
          </div>
          
          <div className="filter-group">
            <select 
              name="category" 
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              <option value="car-review">Car Review</option>
              <option value="podcast">Podcast</option>
              <option value="maintenance">Maintenance & Cost</option>
              <option value="news">News Update</option>
              <option value="test-drive">Test Drive</option>
              <option value="comparison">Comparison</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select 
              name="subscriptionTier" 
              value={filters.subscriptionTier}
              onChange={handleFilterChange}
            >
              <option value="">All Tiers</option>
              <option value="none">Public</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          
          <div className="filter-group">
            <select 
              name="status" 
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <button className="apply-filters-btn" onClick={applyFilters}>
            Apply Filters
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading videos...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="retry-btn" onClick={fetchVideos}>
            Retry
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="empty-state">
          <h3>No videos found</h3>
          <p>
            {Object.values(activeFilters).some(filter => filter) 
              ? 'Try changing your filters or add a new video.'
              : 'Get started by adding your first YouTube video.'}
          </p>
          <button className="add-video-btn" onClick={handleAddVideo}>
            <Plus size={20} /> Add YouTube Video
          </button>
        </div>
      ) : (
        <div className="videos-grid">
          {videos.map(renderVideoItem)}
        </div>
      )}
      
      {/* Pagination */}
      {!loading && !error && videos.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {videos.length} of {totalVideos} videos | Page {page} of {totalPages}
          </div>
          <div className="pagination-controls">
            <button 
              className="pagination-btn prev" 
              onClick={goToPrevPage}
              disabled={page === 1}
            >
              Previous
            </button>
            <button 
              className="pagination-btn next" 
              onClick={goToNextPage}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Modals */}
      <VideoUploadModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedVideo}
        dealers={dealers}
        listings={listings}
      />
      
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Video"
        message={`Are you sure you want to delete "${videoToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default VideoManager;