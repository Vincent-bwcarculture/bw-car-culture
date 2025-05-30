// src/components/features/CarReviews/CarReviewsPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.js';
import { carReviewService } from '../../../services/carReviewService.js';
import './CarReviews.css';

const CarReviewsPage = () => {
  const { carModel } = useParams();
  const [activeTab, setActiveTab] = useState(carModel ? 'view' : 'submit');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState(carModel || '');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Authentication-related state
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingReview, setPendingReview] = useState(null);
  
  const [reviewForm, setReviewForm] = useState({
    carMake: '',
    carModel: '',
    carYear: '',
    ownerName: user ? user.name : '',
    reviewText: '',
    ratings: {
      reliability: 0,
      fuelEfficiency: 0,
      comfort: 0,
      performance: 0,
      value: 0
    }
  });

  // Popular car models in SADC region
  const popularCarModels = [
    { make: 'Toyota', model: 'Hilux', years: ['2015-Present', '2005-2015', 'Pre-2005'] },
    { make: 'Toyota', model: 'Corolla', years: ['2019-Present', '2013-2018', '2008-2013'] },
    { make: 'Toyota', model: 'Fortuner', years: ['2015-Present', '2005-2015'] },
    { make: 'Toyota', model: 'Land Cruiser', years: ['2007-Present', 'Pre-2007'] },
    { make: 'Volkswagen', model: 'Polo', years: ['2017-Present', '2009-2017'] },
    { make: 'Volkswagen', model: 'Golf', years: ['2013-Present', '2008-2013'] },
    { make: 'Ford', model: 'Ranger', years: ['2019-Present', '2011-2019'] },
    { make: 'Ford', model: 'EcoSport', years: ['2013-Present'] },
    { make: 'Nissan', model: 'NP300 Hardbody', years: ['2008-Present'] },
    { make: 'Nissan', model: 'X-Trail', years: ['2014-Present', '2007-2014'] },
    { make: 'Honda', model: 'CR-V', years: ['2017-Present', '2012-2017'] },
    { make: 'Hyundai', model: 'i10', years: ['2014-Present', '2007-2014'] },
    { make: 'Hyundai', model: 'i20', years: ['2014-Present', '2008-2014'] },
    { make: 'Isuzu', model: 'D-Max', years: ['2012-Present'] },
    { make: 'Mazda', model: 'CX-5', years: ['2017-Present', '2012-2017'] },
    { make: 'Mercedes-Benz', model: 'C-Class', years: ['2014-Present', '2007-2014'] },
    { make: 'BMW', model: '3 Series', years: ['2019-Present', '2012-2019', '2005-2012'] }
  ];

  // Update form when user logs in
  useEffect(() => {
    if (user) {
      setReviewForm(prev => ({
        ...prev,
        ownerName: user.name || prev.ownerName
      }));
    }
  }, [user]);

  // Check for pending review in localStorage on mount
  useEffect(() => {
    // Check if we returned from auth and have a pending review
    const pendingReviewData = localStorage.getItem('pendingCarReview');
    
    if (pendingReviewData && isAuthenticated) {
      try {
        const parsedReview = JSON.parse(pendingReviewData);
        
        // Combine with user info
        const reviewWithUserInfo = {
          ...parsedReview,
          ownerName: user.name
        };
        
        // Submit the review
        submitReviewToAPI(reviewWithUserInfo);
        
        // Clear pending review
        localStorage.removeItem('pendingCarReview');
        
        // Ensure we're on the submit tab
        setActiveTab('submit');
      } catch (error) {
        console.error('Error processing pending review:', error);
      }
    }
  }, [isAuthenticated, user]);

  // Load reviews when selected model changes
  useEffect(() => {
    const loadReviews = async () => {
      if (activeTab === 'view' && selectedModel) {
        setLoading(true);
        setError(null);
        
        try {
          // Parse make and model from selected
          const parts = selectedModel.split(' ');
          const make = parts[0];
          const model = parts.slice(1).join(' ');
          
          // Fetch reviews from API
          const result = await carReviewService.getReviewsByCar(make, model);
          
          if (result.success) {
            setReviews(result.data);
          } else {
            setError('Failed to load reviews');
            setReviews([]);
          }
        } catch (error) {
          console.error('Error loading reviews:', error);
          setError('Failed to load reviews. Please try again later.');
          setReviews([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadReviews();
  }, [activeTab, selectedModel]);

  // Function to submit review to API
  const submitReviewToAPI = async (reviewData) => {
    setSubmitLoading(true);
    setError(null);
    
    try {
      // Calculate average rating
      const ratingValues = Object.values(reviewData.ratings);
      const averageRating = ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length;
      
      // Prepare data for API
      const apiData = {
        carMake: reviewData.carMake,
        carModel: reviewData.carModel,
        carYear: reviewData.carYear,
        reviewText: reviewData.reviewText,
        ratings: reviewData.ratings,
        averageRating,
        ownerName: reviewData.ownerName
      };
      
      // Send to API
      const response = await carReviewService.createReview(apiData);
      
      if (response.success) {
        // Show success message
        alert('Thank you for your review! It has been submitted successfully.');
        
        // Reset form
        setReviewForm({
          carMake: '',
          carModel: '',
          carYear: '',
          ownerName: user?.name || '',
          reviewText: '',
          ratings: {
            reliability: 0,
            fuelEfficiency: 0,
            comfort: 0,
            performance: 0,
            value: 0
          }
        });
      } else {
        setError(response.message || 'Error submitting review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error.message || 'Failed to submit review');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('ratings.')) {
      const ratingName = name.split('.')[1];
      setReviewForm(prev => ({
        ...prev,
        ratings: {
          ...prev.ratings,
          [ratingName]: parseInt(value, 10)
        }
      }));
    } else {
      setReviewForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submission
  const handleSearch = () => {
    if (searchQuery.trim()) {
      setSelectedModel(searchQuery);
      setActiveTab('view');
    }
  };

  // Save pending review and prompt for authentication
  const saveReviewAndPromptAuth = () => {
    // Save current review state
    setPendingReview({
      ...reviewForm,
      date: new Date().toISOString().split('T')[0]
    });
    
    // Save to localStorage for persistence
    localStorage.setItem('pendingCarReview', JSON.stringify(reviewForm));
    
    // Show authentication modal
    setShowAuthModal(true);
  };

  // Handle form submission
  const handleSubmitReview = (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Save review and prompt for login/registration
      saveReviewAndPromptAuth();
    } else {
      // User is authenticated, proceed with submission
      submitReviewToAPI(reviewForm);
    }
  };

  // Navigate to registration/login page with review data
  const handleAuthNavigation = (authType) => {
    // Close the modal
    setShowAuthModal(false);
    
    // Navigate to auth page with return URL
    navigate(`/${authType}`, { 
      state: { 
        from: '/reviews',
        hasPendingReview: true
      } 
    });
  };

  // Mark a review as helpful
  const handleMarkHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      alert('Please log in to mark reviews as helpful');
      return;
    }
    
    try {
      const response = await carReviewService.markReviewHelpful(reviewId);
      
      if (response.success) {
        // Update the reviews state to reflect the change
        setReviews(prevReviews => 
          prevReviews.map(review => 
            review._id === reviewId
              ? { ...review, helpful: response.data.helpful }
              : review
          )
        );
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  // Render rating stars
  const renderStars = (rating) => {
    return (
      <div className="car-reviews-star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`car-reviews-star ${star <= rating ? 'car-reviews-filled' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="car-reviews-container">
      <div className="car-reviews-header">
        <h1>Car Owner Reviews</h1>
        <p>Real experiences from real drivers in Southern Africa</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="car-reviews-tabs">
        <button
          className={`car-reviews-tab-button ${activeTab === 'submit' ? 'car-reviews-active' : ''}`}
          onClick={() => setActiveTab('submit')}
        >
          Submit a Review
        </button>
        <button
          className={`car-reviews-tab-button ${activeTab === 'view' ? 'car-reviews-active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          Read Reviews
        </button>
      </div>

      {activeTab === 'submit' ? (
        <div className="car-reviews-submit-section">
          <div className="car-reviews-form-introduction">
            <h2>Share Your Experience</h2>
            <p>Help other drivers make informed decisions with your honest review.</p>
            {!isAuthenticated && (
              <div className="auth-status-note">
                <p>You can write your review now and register or login when you submit.</p>
              </div>
            )}
          </div>

          <form className="car-reviews-review-form" onSubmit={handleSubmitReview}>
            <div className="car-reviews-form-section">
              <h3>Car Information</h3>
              <div className="car-reviews-form-row">
                <div className="car-reviews-form-group">
                  <label htmlFor="carMake">Make</label>
                  <select
                    id="carMake"
                    name="carMake"
                    value={reviewForm.carMake}
                    onChange={handleInputChange}
                    required
                    disabled={submitLoading}
                  >
                    <option value="">Select Make</option>
                    {[...new Set(popularCarModels.map(car => car.make))].map(make => (
                      <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                </div>

                <div className="car-reviews-form-group">
                  <label htmlFor="carModel">Model</label>
                  <select
                    id="carModel"
                    name="carModel"
                    value={reviewForm.carModel}
                    onChange={handleInputChange}
                    required
                    disabled={!reviewForm.carMake || submitLoading}
                  >
                    <option value="">Select Model</option>
                    {popularCarModels
                      .filter(car => car.make === reviewForm.carMake)
                      .map(car => (
                        <option key={car.model} value={car.model}>{car.model}</option>
                      ))}
                  </select>
                </div>

                <div className="car-reviews-form-group">
                  <label htmlFor="carYear">Year</label>
                  <select
                    id="carYear"
                    name="carYear"
                    value={reviewForm.carYear}
                    onChange={handleInputChange}
                    required
                    disabled={!reviewForm.carModel || submitLoading}
                  >
                    <option value="">Select Year Range</option>
                    {popularCarModels
                      .filter(car => car.make === reviewForm.carMake && car.model === reviewForm.carModel)
                      .flatMap(car => car.years)
                      .map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="car-reviews-form-section">
              <h3>Your Review</h3>
              <div className="car-reviews-form-group">
                <label htmlFor="ownerName">Your Name (or Nickname)</label>
                <input
                  type="text"
                  id="ownerName"
                  name="ownerName"
                  value={isAuthenticated ? (user?.name || reviewForm.ownerName) : reviewForm.ownerName}
                  onChange={handleInputChange}
                  placeholder="How you want to be identified"
                  required
                  disabled={isAuthenticated || submitLoading} // Disable editing if user is authenticated
                />
                {isAuthenticated && (
                  <div className="user-authenticated-note">
                    Your registered name will be used
                  </div>
                )}
              </div>

              <div className="car-reviews-form-group">
                <label htmlFor="reviewText">Your Experience</label>
                <textarea
                  id="reviewText"
                  name="reviewText"
                  value={reviewForm.reviewText}
                  onChange={handleInputChange}
                  placeholder="Share your honest experience with this vehicle..."
                  rows={6}
                  required
                  disabled={submitLoading}
                  minLength={50}
                ></textarea>
                <div className="character-count">
                  {reviewForm.reviewText.length} / 50 characters minimum
                </div>
              </div>
            </div>

            <div className="car-reviews-form-section">
              <h3>Ratings</h3>
              <p className="car-reviews-rating-instruction">Rate each aspect from 1 to 5 stars</p>

              <div className="car-reviews-ratings-grid">
                <div className="car-reviews-rating-group">
                  <label>Reliability</label>
                  <div className="car-reviews-star-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <label key={star} className="car-reviews-star-label">
                        <input
                          type="radio"
                          name="ratings.reliability"
                          value={star}
                          checked={reviewForm.ratings.reliability === star}
                          onChange={handleInputChange}
                          required
                          disabled={submitLoading}
                        />
                        <span className={`car-reviews-star ${star <= reviewForm.ratings.reliability ? 'car-reviews-filled' : ''}`}>★</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="car-reviews-rating-group">
                  <label>Fuel Efficiency</label>
                  <div className="car-reviews-star-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <label key={star} className="car-reviews-star-label">
                        <input
                          type="radio"
                          name="ratings.fuelEfficiency"
                          value={star}
                          checked={reviewForm.ratings.fuelEfficiency === star}
                          onChange={handleInputChange}
                          required
                          disabled={submitLoading}
                        />
                        <span className={`car-reviews-star ${star <= reviewForm.ratings.fuelEfficiency ? 'car-reviews-filled' : ''}`}>★</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="car-reviews-rating-group">
                  <label>Comfort</label>
                  <div className="car-reviews-star-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <label key={star} className="car-reviews-star-label">
                        <input
                          type="radio"
                          name="ratings.comfort"
                          value={star}
                          checked={reviewForm.ratings.comfort === star}
                          onChange={handleInputChange}
                          required
                          disabled={submitLoading}
                        />
                        <span className={`car-reviews-star ${star <= reviewForm.ratings.comfort ? 'car-reviews-filled' : ''}`}>★</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="car-reviews-rating-group">
                  <label>Performance</label>
                  <div className="car-reviews-star-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <label key={star} className="car-reviews-star-label">
                        <input
                          type="radio"
                          name="ratings.performance"
                          value={star}
                          checked={reviewForm.ratings.performance === star}
                          onChange={handleInputChange}
                          required
                          disabled={submitLoading}
                        />
                        <span className={`car-reviews-star ${star <= reviewForm.ratings.performance ? 'car-reviews-filled' : ''}`}>★</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="car-reviews-rating-group">
                  <label>Value for Money</label>
                  <div className="car-reviews-star-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <label key={star} className="car-reviews-star-label">
                        <input
                          type="radio"
                          name="ratings.value"
                          value={star}
                          checked={reviewForm.ratings.value === star}
                          onChange={handleInputChange}
                          required
                          disabled={submitLoading}
                        />
                        <span className={`car-reviews-star ${star <= reviewForm.ratings.value ? 'car-reviews-filled' : ''}`}>★</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="car-reviews-form-actions">
              <button 
                type="submit" 
                className="car-reviews-submit-button"
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <span>Submitting...</span>
                ) : isAuthenticated ? (
                  'Submit Your Review'
                ) : (
                  'Continue to Submit Review'
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="car-reviews-view-section">
          <div className="car-reviews-search">
            <h2>Find Reviews</h2>
            <div className="car-reviews-search-container">
              <input
                type="text"
                placeholder="Search by make or model (e.g., Toyota Hilux)"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <button onClick={handleSearch}>Search</button>
            </div>

            <div className="car-reviews-popular-cars">
              <h3>Common Cars in Southern Africa</h3>
              <div className="car-reviews-car-buttons">
                {popularCarModels.slice(0, 8).map(car => (
                  <button
                    key={`${car.make}-${car.model}`}
                    onClick={() => {
                      setSelectedModel(`${car.make} ${car.model}`);
                      setSearchQuery(`${car.make} ${car.model}`);
                    }}
                  >
                    {car.make} {car.model}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="car-reviews-results">
            {selectedModel ? (
              loading ? (
                <div className="car-reviews-loading-spinner">Loading reviews...</div>
              ) : reviews.length > 0 ? (
                <>
                  <h2>Reviews for {selectedModel}</h2>
                  <div className="car-reviews-list">
                    {reviews.map(review => (
                      <div className="car-reviews-review-card" key={review._id}>
                        <div className="car-reviews-review-header">
                          <div className="car-reviews-review-meta">
                            <h3>{review.carMake} {review.carModel} {review.carYear}</h3>
                            <div className="car-reviews-review-info">
                              <span className="car-reviews-review-author">By {review.ownerName}</span>
                              <span className="car-reviews-review-date">
                                Posted on {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="car-reviews-review-average-rating">
                            <span className="car-reviews-rating-value">
                              {review.averageRating.toFixed(1)}
                            </span>
                            {renderStars(review.averageRating)}
                          </div>
                        </div>

                        <div className="car-reviews-review-content">
                          <p>{review.reviewText}</p>
                        </div>

                        <div className="car-reviews-review-ratings">
                          <div className="car-reviews-rating-item">
                            <span className="car-reviews-rating-label">Reliability</span>
                            {renderStars(review.ratings.reliability)}
                          </div>
                          <div className="car-reviews-rating-item">
                            <span className="car-reviews-rating-label">Fuel Efficiency</span>
                            {renderStars(review.ratings.fuelEfficiency)}
                          </div>
                          <div className="car-reviews-rating-item">
                            <span className="car-reviews-rating-label">Comfort</span>
                            {renderStars(review.ratings.comfort)}
                          </div>
                          <div className="car-reviews-rating-item">
                            <span className="car-reviews-rating-label">Performance</span>
                            {renderStars(review.ratings.performance)}
                          </div>
                          <div className="car-reviews-rating-item">
                            <span className="car-reviews-rating-label">Value</span>
                            {renderStars(review.ratings.value)}
                          </div>
                        </div>
                        
                        <div className="car-reviews-review-footer">
                          <button 
                            className="helpful-button"
                            onClick={() => handleMarkHelpful(review._id)}
                          >
                            <span className="helpful-icon">👍</span>
                            Helpful ({review.helpful?.count || 0})
                          </button>
                          
                          {isAuthenticated && user?.id === review.user && (
                            <button 
                              className="edit-review-button"
                              onClick={() => {
                                // Populate form with review data
                                setReviewForm({
                                  carMake: review.carMake,
                                  carModel: review.carModel,
                                  carYear: review.carYear,
                                  ownerName: review.ownerName,
                                  reviewText: review.reviewText,
                                  ratings: review.ratings
                                });
                                setActiveTab('submit');
                              }}
                            >
                              Edit Your Review
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="car-reviews-no-reviews">
                  <h2>No reviews found for {selectedModel}</h2>
                  <p>Be the first to share your experience with this vehicle!</p>
                  <button
                    className="car-reviews-add-review-button"
                    onClick={() => {
                      setActiveTab('submit');
                      const [make, model] = selectedModel.split(' ');
                      setReviewForm(prev => ({
                        ...prev,
                        carMake: make,
                        carModel: model
                      }));
                    }}
                  >
                    Add Your Review
                  </button>
                </div>
              )
            ) : (
              <div className="car-reviews-select-car-prompt">
                <h2>Select a car to view reviews</h2>
                <p>Use the search box or choose from popular models above</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <div className="auth-modal-header">
              <h3>Register or Login to Submit Your Review</h3>
              <button 
                className="auth-modal-close" 
                onClick={() => setShowAuthModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="auth-modal-content">
              <p>Your review is ready to submit! To complete the process, you'll need to create an account or log in.</p>
              <p>This helps us ensure the quality of reviews and allows you to manage your reviews later.</p>
              
              <div className="auth-modal-actions">
                <button 
                  className="auth-modal-register-btn" 
                  onClick={() => handleAuthNavigation('register')}
                >
                  Register
                </button>
                <button 
                  className="auth-modal-login-btn" 
                  onClick={() => handleAuthNavigation('login')}
                >
                  Login
                </button>
                <button 
                  className="auth-modal-cancel-btn" 
                  onClick={() => setShowAuthModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarReviewsPage;