// src/components/admin/QuickActions.js
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addNotification } from '../store/slices/uiSlice.js';
import AddListingModal from '../components/shared/AddListingModal/AddListingModal.js';
import ReviewModal from '../components/shared/ReviewModal/ReviewModal.js';
import VideoUploadModal from './VideoUploadModal/VideoUploadModal.js';
import InventoryForm from './InventoryManager/InventoryForm.js';
import { listingService } from '../services/listingService.js';
import { newsService } from '../services/newsService.js';
import { videoService } from '../services/videoService.js';
import { useAuth } from '../context/AuthContext.js';
import ErrorBoundary from '../components/ErrorBoundary.js';
import './QuickActions.css';

const QuickActions = ({ onActionSelected }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showAddListing, setShowAddListing] = useState(false);
  const [showAddReview, setShowAddReview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleAddListing = async (formData) => {
    try {
      setLoading(true);
      
      // Extract images from formData if they exist
      const images = formData.images || [];
      const cleanFormData = { ...formData };
      delete cleanFormData.images; // Remove images from the data object
      
      // Pass images as a separate parameter
      await listingService.createListing(cleanFormData, images);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Listing created successfully'
      }));
      
      setShowAddListing(false);
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to create listing'
      }));
      console.error('Failed to create listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async (formData) => {
    try {
      setLoading(true);
      
      console.log('Creating new article with form data');
      
      const newArticle = await newsService.createArticle(formData);
      console.log('Article created successfully:', newArticle);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Article created successfully!'
      }));
      
      setShowReviewModal(false);
    } catch (error) {
      console.error('Failed to create article:', error);
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to create article'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Updated handler for YouTube videos
  const handleAddVideo = async (videoData) => {
    try {
      setLoading(true);
      
      console.log('Creating new YouTube video with data:', videoData);
      
      // Send data directly to the video service
      const newVideo = await videoService.createVideo(videoData);
      
      console.log('Video created successfully:', newVideo);
      
      dispatch(addNotification({
        type: 'success',
        message: 'YouTube video added successfully!'
      }));
      
      setShowVideoModal(false);
    } catch (error) {
      console.error('Failed to add YouTube video:', error);
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to add YouTube video'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Handler for new inventory item
  const handleAddInventoryItem = async (inventoryData) => {
    try {
      setLoading(true);
      
      console.log('Creating new inventory item with data:', inventoryData);
      
      // In a real implementation, you would have an inventoryService
      // const newItem = await inventoryService.createInventoryItem(inventoryData);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Inventory item added successfully!'
      }));
      
      setShowInventoryForm(false);
    } catch (error) {
      console.error('Failed to add inventory item:', error);
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to add inventory item'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Handler for GION Admin Dashboard
  const handleGIONDashboardClick = () => {
    if (onActionSelected) {
      onActionSelected('gion');
    } else {
      navigate('/admin/gion');
    }
    
    dispatch(addNotification({
      type: 'info',
      message: 'Opening GION Administration Dashboard...'
    }));
  };

  const handleServiceProvidersClick = () => {
    if (onActionSelected) {
      onActionSelected('service-providers');
    }
  };
  
  const handleAddListingClick = () => {
    try {
      setShowAddListing(true);
    } catch (error) {
      console.error('Error opening listing modal:', error);
    }
  };

  const handleReviewClick = () => {
    try {
      setShowReviewModal(true);
    } catch (error) {
      console.error('Error opening review modal:', error);
    }
  };

  const handleVideoClick = () => {
    try {
      setShowVideoModal(true);
    } catch (error) {
      console.error('Error opening video modal:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to open video upload modal'
      }));
    }
  };

  // New handler for inventory form
  const handleInventoryClick = () => {
    try {
      setShowInventoryForm(true);
    } catch (error) {
      console.error('Error opening inventory form:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to open inventory form'
      }));
    }
  };

  // Handler for inventory manager dashboard
  const handleInventoryManagerClick = () => {
    if (onActionSelected) {
      onActionSelected('inventory');
    } else {
      navigate('/admin/inventory');
    }
    
    dispatch(addNotification({
      type: 'info',
      message: 'Opening Inventory Manager...'
    }));
  };

  // Handler for dealer management
  const handleDealershipClick = () => {
    if (onActionSelected) {
      onActionSelected('dealerships');
    }
  };

  // Handlers for transport services
  const handleRentalVehiclesClick = () => {
    if (onActionSelected) {
      onActionSelected('rental-vehicles');
    }
  };

  const handleTrailersClick = () => {
    if (onActionSelected) {
      onActionSelected('trailers');
    }
  };

  const handleTransportRoutesClick = () => {
    if (onActionSelected) {
      onActionSelected('transport-routes');
    }
  };

  const handleVideoManagerClick = () => {
    console.log("Video Manager button clicked");
    
    if (onActionSelected) {
      onActionSelected('videos');
    } else {
      navigate('/admin/videos');
    }
    
    dispatch(addNotification({
      type: 'info',
      message: 'Opening Video Manager...'
    }));
  };

  return (
    <ErrorBoundary>
      <div className="qa-quick-actions">
        <button 
          className="qa-action-button"
          onClick={handleAddListingClick}
          disabled={loading}
        >
          <span className="qa-icon">🚗</span>
          Add Listing
        </button>

        <button 
          className="qa-action-button"
          onClick={handleReviewClick}
          disabled={loading}
        >
          <span className="qa-icon">✍️</span>
          New Review
        </button>

        {/* YouTube video button */}
        <button 
          className="qa-action-button"
          onClick={handleVideoClick}
          disabled={loading}
        >
          <span className="qa-icon">📺</span>
          Add YouTube Video
        </button>

        {/* New Add Inventory Item button */}
        <button 
          className="qa-action-button"
          onClick={handleInventoryClick}
          disabled={loading}
        >
          <span className="qa-icon">📦</span>
          Add Inventory Item
        </button>

        {user?.role === 'admin' && (
          <>
            {/* GION Admin Dashboard button */}
            <button 
              className="qa-action-button highlight-action"
              onClick={handleGIONDashboardClick}
            >
              <span className="qa-icon">⭐</span>
              GION Dashboard
            </button>
            
            <button 
              className="qa-action-button"
              onClick={handleDealershipClick}
            >
              <span className="qa-icon">🏢</span>
              Manage Dealerships
            </button>

            <button 
              className="qa-action-button"
              onClick={handleServiceProvidersClick}
            >
              <span className="qa-icon">🏢</span>
              Manage Service Providers
            </button>
            
            {/* New Inventory Manager button */}
            <button 
              className="qa-action-button"
              onClick={handleInventoryManagerClick}
            >
              <span className="qa-icon">🗃️</span>
              Inventory Manager
            </button>
            
            <button 
              className="qa-action-button"
              onClick={handleVideoManagerClick}
            >
              <span className="qa-icon">📺</span>
              Video Manager
            </button>
            
            <button 
              className="qa-action-button"
              onClick={handleRentalVehiclesClick}
            >
              <span className="qa-icon">🚙</span>
              Rental Vehicles
            </button>
            
            <button 
              className="qa-action-button"
              onClick={handleTrailersClick}
            >
              <span className="qa-icon">🚚</span>
              Trailer Listings
            </button>
            
            <button 
              className="qa-action-button"
              onClick={handleTransportRoutesClick}
            >
              <span className="qa-icon">🚌</span>
              Transport Routes
            </button>
          </>
        )}

        {showAddListing && (
          <ErrorBoundary>
            <AddListingModal
              isOpen={showAddListing}
              onClose={() => setShowAddListing(false)}
              onSubmit={handleAddListing}
            />
          </ErrorBoundary>
        )}

        {showReviewModal && (
          <ErrorBoundary>
            <ReviewModal
              isOpen={showReviewModal}
              onClose={() => setShowReviewModal(false)}
              onSubmit={handleAddReview}
              contentType="news" // Explicitly set content type to "news"
            />
          </ErrorBoundary>
        )}
        
        {showVideoModal && (
          <ErrorBoundary>
            <VideoUploadModal
              isOpen={showVideoModal}
              onClose={() => setShowVideoModal(false)}
              onSubmit={handleAddVideo}
              dealers={[]} // You can populate these from your API if available
              listings={[]} // You can populate these from your API if available
            />
          </ErrorBoundary>
        )}

        {/* New Inventory Form Modal */}
        {showInventoryForm && (
          <ErrorBoundary>
            <div className="modal-overlay">
              <div className="modal-container">
                <div className="modal-header">
                  <h2>Add Inventory Item</h2>
                  <button 
                    className="modal-close-button"
                    onClick={() => setShowInventoryForm(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-content">
                  <InventoryForm
                    onSave={handleAddInventoryItem}
                    onCancel={() => setShowInventoryForm(false)}
                    businesses={[]} // You would fetch businesses from API
                  />
                </div>
              </div>
            </div>
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default QuickActions;