// src/components/features/CarReviews/CarReviewsSummary.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { carReviewService } from '../../../services/carReviewService.js';
import './CarReviewsSummary.css';

const CarReviewsSummary = () => {
  const navigate = useNavigate();
  const [featuredReviews, setFeaturedReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch featured reviews on component mount
  useEffect(() => {
    const loadFeaturedReviews = async () => {
      try {
        setLoading(true);
        
        // Fetch top-rated recent reviews directly
        const reviewPromises = [
          carReviewService.getReviewsByCar('Toyota', 'Hilux'),
          carReviewService.getReviewsByCar('Ford', 'Ranger'),
          carReviewService.getReviewsByCar('Volkswagen', 'Polo'),
          carReviewService.getReviewsByCar('Toyota', 'Fortuner')
        ];

        const results = await Promise.all(reviewPromises);
        
        // Flatten results and get top reviews
        const allReviews = results
          .flatMap(result => result.data || [])
          .filter(review => review.averageRating >= 4.0); // Only show good reviews
        
        // Sort by rating and recency
        const sortedReviews = allReviews.sort((a, b) => {
          // First by rating (descending)
          if (b.averageRating !== a.averageRating) {
            return b.averageRating - a.averageRating;
          }
          // Then by date (most recent first)
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Take the top 3 reviews
        setFeaturedReviews(sortedReviews.slice(0, 3));
      } catch (err) {
        console.error('Error loading featured reviews:', err);
        setError('Failed to load featured reviews');
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedReviews();
  }, []);

  // Create review snippet from full text
  const createSnippet = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength) + '...';
  };

  // Render rating stars
  const renderStars = (rating) => {
    return (
      <div className="summary-star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <span 
            key={star} 
            className={`star ${star <= rating ? 'filled' : 'empty'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Navigate to car review details
  const navigateToCarReviews = (carMake, carModel) => {
    navigate(`/reviews?make=${carMake}&model=${carModel}`);
  };

  if (loading) {
    return (
      <section className="reviews-summary-section">
        <div className="reviews-summary-header">
          <h2>Owner Car Reviews</h2>
          <p>Loading featured reviews...</p>
        </div>
        <div className="reviews-loading-spinner"></div>
      </section>
    );
  }

  return (
    <section className="reviews-summary-section">
      <div className="reviews-summary-header">
        <h2>Owner Car Reviews</h2>
        <p>Real experiences from real drivers in Southern Africa</p>
      </div>

      <div className="featured-reviews">
        {featuredReviews.length === 0 ? (
          <div className="no-data-message">
            <p>{error ? 'Could not load reviews. Please try again later.' : 'No reviews yet. Be the first to share your experience!'}</p>
          </div>
        ) : featuredReviews.map(review => (
          <div 
            className="summary-review-card" 
            key={review._id} 
            onClick={() => navigateToCarReviews(review.carMake, review.carModel)}
          >
            <div className="summary-review-header">
              <h3>{review.carMake} {review.carModel} {review.carYear}</h3>
              <div className="summary-rating">
                <span className="summary-rating-value">{review.averageRating.toFixed(1)}</span>
                {renderStars(review.averageRating)}
              </div>
            </div>
            <p className="summary-review-snippet">
              {createSnippet(review.reviewText)}
            </p>
            <div className="summary-review-meta">
              <span className="summary-reviewer">By {review.ownerName}</span>
              <span className="summary-date">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="reviews-summary-actions">
        <button 
          className="primary-action" 
          onClick={() => navigate('/reviews?tab=submit')}
        >
          Share Your Experience
        </button>
        <button 
          className="secondary-action" 
          onClick={() => navigate('/reviews')}
        >
          Read All Reviews
        </button>
      </div>
    </section>
  );
};

export default CarReviewsSummary;