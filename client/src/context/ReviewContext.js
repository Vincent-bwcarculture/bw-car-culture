// src/context/ReviewContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const ReviewContext = createContext();

export const ReviewProvider = ({ children }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reviews');
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addReview = async (reviewData) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        body: reviewData
      });

      if (!response.ok) {
        throw new Error('Failed to create review');
      }

      const newReview = await response.json();
      setReviews(prev => [...prev, newReview]);
      return newReview;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  };

  const updateReview = async (id, reviewData) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PUT',
        body: reviewData
      });

      if (!response.ok) {
        throw new Error('Failed to update review');
      }

      const updatedReview = await response.json();
      setReviews(prev => 
        prev.map(review => 
          review.id === id ? updatedReview : review
        )
      );
      return updatedReview;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  };

  const deleteReview = async (id) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete review');
      }

      setReviews(prev => prev.filter(review => review.id !== id));
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const value = {
    reviews,
    loading,
    error,
    addReview,
    updateReview,
    deleteReview,
    refreshReviews: fetchReviews
  };

  return (
    <ReviewContext.Provider value={value}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
};