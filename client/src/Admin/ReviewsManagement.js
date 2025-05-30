// src/components/admin/ReviewsManagement.js
import React, { useState, useEffect } from 'react';
import { carReviewService } from '../services/carReviewService';
import './ReviewsManagement.css';

const ReviewsManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'pending', // Default to showing pending reviews
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load reviews
  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const response = await carReviewService.getReviews(
          filters,
          currentPage,
          10
        );
        
        if (response.success) {
          setReviews(response.data);
          setTotalPages(response.pagination.totalPages);
        } else {
          throw new Error(response.message || 'Failed to load reviews');
        }
      } catch (error) {
        console.error('Error loading reviews:', error);
        setError(error.message || 'An error occurred while loading reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [filters, currentPage]);

  // Handle status change
  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      const response = await carReviewService.updateReviewStatus(reviewId, {
        status: newStatus
      });
      
      if (response.success) {
        // Update the reviews list
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review._id === reviewId
              ? { ...review, status: newStatus }
              : review
          )
        );
        
        // Show success message
        alert(`Review ${newStatus} successfully`);
      } else {
        throw new Error(response.message || `Failed to ${newStatus} review`);
      }
    } catch (error) {
      console.error(`Error updating review status:`, error);
      alert(`Error: ${error.message}`);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // No need to do anything special, the useEffect will trigger with the updated filters
  };

  // Handle delete
  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    
    try {
      const response = await carReviewService.deleteReview(reviewId);
      
      if (response.success) {
        // Remove from the list
        setReviews(prevReviews => 
          prevReviews.filter(review => review._id !== reviewId)
        );
        
        alert('Review deleted successfully');
      } else {
        throw new Error(response.message || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Render stars
  const renderStars = (rating) => {
    return (
      <div className="admin-star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`admin-star ${star <= rating ? 'filled' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="admin-reviews-container">
      <h1 className="admin-page-title">Reviews Management</h1>
      
      <div className="admin-filters-section">
        <form onSubmit={handleSearch} className="admin-search-form">
          <div className="admin-filter-group">
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="all">All Reviews</option>
              <option value="pending">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          
          <div className="admin-filter-group">
            <label htmlFor="search">Search:</label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by car, review text, or user..."
            />
          </div>
          
          <button type="submit" className="admin-search-button">
            Search
          </button>
        </form>
      </div>
      
      {error && (
        <div className="admin-error-message">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="admin-loading">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="admin-no-results">
          <h3>No reviews found</h3>
          <p>Try changing your filters to see more results</p>
        </div>
      ) : (
        <div className="admin-reviews-list">
          <div className="admin-reviews-count">
            Showing {reviews.length} reviews
          </div>
          
          {reviews.map(review => (
            <div 
              key={review._id} 
              className={`admin-review-card admin-status-${review.status}`}
            >
              <div className="admin-review-header">
                <div className="admin-review-meta">
                  <h3>{review.carMake} {review.carModel} {review.carYear}</h3>
                  <div className="admin-review-info">
                    <span className="admin-review-author">
                      By {review.ownerName}
                    </span>
                    <span className="admin-review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`admin-review-status admin-status-badge-${review.status}`}>
                      {review.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="admin-review-rating">
                  <span className="admin-rating-value">
                    {review.averageRating.toFixed(1)}
                  </span>
                  {renderStars(review.averageRating)}
                </div>
              </div>
              
              <div className="admin-review-content">
                <p>{review.reviewText}</p>
              </div>
              
              <div className="admin-review-actions">
                {review.status === 'pending' && (
                  <>
                    <button 
                      className="admin-approve-button"
                      onClick={() => handleStatusChange(review._id, 'approved')}
                    >
                      Approve
                    </button>
                    <button 
                      className="admin-reject-button"
                      onClick={() => handleStatusChange(review._id, 'rejected')}
                    >
                      Reject
                    </button>
                  </>
                )}
                
                {review.status === 'approved' && (
                  <button 
                    className="admin-unapprove-button"
                    onClick={() => handleStatusChange(review._id, 'pending')}
                  >
                    Move to Pending
                  </button>
                )}
                
                {review.status === 'rejected' && (
                  <button 
                    className="admin-restore-button"
                    onClick={() => handleStatusChange(review._id, 'pending')}
                  >
                    Reconsider
                  </button>
                )}
                
                <button 
                  className="admin-delete-button"
                  onClick={() => handleDelete(review._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            className="admin-page-button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
          
          <span className="admin-page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            className="admin-page-button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsManagement;