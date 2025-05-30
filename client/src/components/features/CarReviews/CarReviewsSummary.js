// src/components/features/CarReviews/CarReviewsSummary.js
import React, { useState, useEffect } from 'react';
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
        
        // Get top rated reviews for popular cars
        const popularCars = [
          { make: 'Toyota', model: 'Hilux' },
          { make: 'Ford', model: 'Ranger' },
          { make: 'Volkswagen', model: 'Polo' },
          { make: 'Toyota', model: 'Fortuner' }
        ];
        
        // Randomly select 2-3 cars to fetch reviews for
        const selectedCars = popularCars
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 2) + 2);
        
        // Fetch reviews for selected cars
        const reviewPromises = selectedCars.map(car => 
          carReviewService.getReviewsByCar(car.make, car.model)
        );
        
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
        
        // Fallback to sample data if API fails
        setFeaturedReviews([
          {
            _id: 1,
            carMake: 'Toyota',
            carModel: 'Hilux',
            carYear: '2018',
            ownerName: 'John M.',
            reviewText: 'The Hilux is an excellent pickup truck that has never let me down...',
            averageRating: 4.2,
            createdAt: '2023-10-15T00:00:00.000Z'
          },
          {
            _id: 2,
            carMake: 'Ford',
            carModel: 'Ranger',
            carYear: '2020',
            ownerName: 'Michael D.',
            reviewText: 'The Ranger provides excellent value for money with its comfortable interior...',
            averageRating: 4.4,
            createdAt: '2023-11-03T00:00:00.000Z'
          },
          {
            _id: 3,
            carMake: 'Volkswagen',
            carModel: 'Polo',
            carYear: '2019',
            ownerName: 'Thabiso M.',
            reviewText: 'The Polo offers excellent build quality and feels more premium than other hatchbacks...',
            averageRating: 4.2,
            createdAt: '2023-09-18T00:00:00.000Z'
          }
        ]);
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
        {featuredReviews.map(review => (
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