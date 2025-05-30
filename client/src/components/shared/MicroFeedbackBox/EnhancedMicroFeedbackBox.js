// src/components/shared/MicroFeedbackBox/EnhancedMicroFeedbackBox.js
import React, { useState, useEffect, useRef } from 'react';
import './EnhancedMicroFeedbackBox.css';

const EnhancedMicroFeedbackBox = ({ 
  initialSuggestions = [], 
  isLoggedIn = false,
  onLoginRequest = () => {},
  onRegisterRequest = () => {}
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [carouselSuggestions, setCarouselSuggestions] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [userVotes, setUserVotes] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const carouselInterval = useRef(null);
  const boxRef = useRef(null);

  // Sort suggestions by net votes (upvotes - downvotes) descending
  const sortedSuggestions = [...suggestions].sort(
    (a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
  );
  const topSuggestions = sortedSuggestions.slice(0, 5);
  const remainingSuggestions = sortedSuggestions.slice(5);

  // Initialize carousel with remaining suggestions
  useEffect(() => {
    if (remainingSuggestions.length > 0) {
      setCarouselSuggestions(remainingSuggestions);
    }
  }, [remainingSuggestions]);

  // Set up carousel auto-rotation
  useEffect(() => {
    if (carouselSuggestions.length > 0 && isExpanded && !isCarouselPaused) {
      carouselInterval.current = setInterval(() => {
        setCarouselIndex(prevIndex => 
          (prevIndex + 1) % carouselSuggestions.length
        );
      }, 5000); // Rotate every 5 seconds
    }

    return () => {
      if (carouselInterval.current) {
        clearInterval(carouselInterval.current);
      }
    };
  }, [carouselSuggestions, isExpanded, isCarouselPaused]);

  // Click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target) && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleToggleExpand = () => {
    setIsExpanded(prev => !prev);
    setIsAddingNew(false); // Reset add new form when toggling
    setShowLoginPrompt(false); // Hide login prompt if shown
  };

  const handleVote = (id, isUpvote) => {
    // If not logged in, show login prompt
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    // Check if user has already voted (either up or down) for this suggestion
    if (userVotes[id]) {
      // If they're trying to vote the same way again, show error
      if (userVotes[id] === (isUpvote ? 'up' : 'down')) {
        setErrorMessage(`You've already ${isUpvote ? 'upvoted' : 'downvoted'} this suggestion`);
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      // If they're changing their vote, update the counts
      setSuggestions(prev =>
        prev.map(suggestion => {
          if (suggestion.id === id) {
            const updated = { ...suggestion };
            // Remove previous vote
            if (userVotes[id] === 'up') {
              updated.upvotes = (updated.upvotes || 1) - 1;
            } else {
              updated.downvotes = (updated.downvotes || 1) - 1;
            }
            
            // Add new vote
            if (isUpvote) {
              updated.upvotes = (updated.upvotes || 0) + 1;
            } else {
              updated.downvotes = (updated.downvotes || 0) + 1;
            }
            
            return updated;
          }
          return suggestion;
        })
      );
    } else {
      // First time voting on this suggestion
      setSuggestions(prev =>
        prev.map(suggestion => {
          if (suggestion.id === id) {
            const updated = { ...suggestion };
            if (isUpvote) {
              updated.upvotes = (updated.upvotes || 0) + 1;
            } else {
              updated.downvotes = (updated.downvotes || 0) + 1;
            }
            return updated;
          }
          return suggestion;
        })
      );
    }

    // Record user's vote
    setUserVotes(prev => ({ ...prev, [id]: isUpvote ? 'up' : 'down' }));
    
    // Show success message
    setSuccessMessage(`Your ${isUpvote ? 'upvote' : 'downvote'} has been recorded!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddNewToggle = () => {
    // If not logged in, show login prompt
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }
    
    setIsAddingNew(prev => !prev);
  };

  const handleSubmitNewSuggestion = (e) => {
    e.preventDefault();
    
    if (newSuggestion.trim().length < 10) {
      setErrorMessage("Suggestion must be at least 10 characters");
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Create new suggestion
    const newItem = {
      id: Date.now(), // Simple ID generation
      text: newSuggestion,
      upvotes: 1, // Start with 1 upvote (creator's vote)
      downvotes: 0,
      dateAdded: new Date().toISOString(),
      status: 'active',
      createdBy: {
        id: 'current-user-id', // This would come from your auth system
        name: 'Current User' // This would be the actual user name
      }
    };

    setSuggestions(prev => [...prev, newItem]);
    setUserVotes(prev => ({ ...prev, [newItem.id]: 'up' })); // Mark as upvoted by user
    setNewSuggestion('');
    setIsAddingNew(false);
    
    // Update carousel suggestions
    if (sortedSuggestions.length >= 5) {
      setCarouselSuggestions(prev => [...prev, newItem]);
    }
    
    // Show success message
    setSuccessMessage("Your suggestion has been added!");
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Calculate days remaining in current voting cycle
  const getDaysRemaining = () => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const diffTime = Math.abs(lastDayOfMonth - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Navigation for carousel
  const handleCarouselNav = (direction) => {
    // Pause auto-rotation temporarily
    setIsCarouselPaused(true);
    
    // Clear existing interval
    if (carouselInterval.current) {
      clearInterval(carouselInterval.current);
    }
    
    // Update index
    if (direction === 'prev') {
      setCarouselIndex(prev => 
        (prev - 1 + carouselSuggestions.length) % carouselSuggestions.length
      );
    } else {
      setCarouselIndex(prev => 
        (prev + 1) % carouselSuggestions.length
      );
    }
    
    // Resume auto-rotation after a delay
    setTimeout(() => {
      setIsCarouselPaused(false);
    }, 10000); // Resume after 10 seconds of inactivity
  };

  // Get net votes (upvotes - downvotes)
  const getNetVotes = (suggestion) => {
    const upvotes = suggestion.upvotes || 0;
    const downvotes = suggestion.downvotes || 0;
    return upvotes - downvotes;
  };

  // Format the date to a readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div 
      className={`micro-feedback-box enhanced ${isExpanded ? 'expanded' : 'collapsed'}`}
      ref={boxRef}
    >
      {!isExpanded && (
        <button className="feedback-toggle-button" onClick={handleToggleExpand}>
          <span className="feedback-icon">💡</span>
          <span className="feedback-text">Feedback</span>
        </button>
      )}

      {isExpanded && (
        <div className="feedback-content">
          <div className="feedback-header">
            <h3>Feature Suggestions</h3>
            <div className="feedback-actions">
              <button 
                className="add-suggestion-button"
                onClick={handleAddNewToggle}
                title="Add new suggestion"
              >
                + New
              </button>
              <button 
                className="close-button"
                onClick={handleToggleExpand}
                title="Close"
              >
                ×
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="feedback-message error">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="feedback-message success">
              {successMessage}
            </div>
          )}

          {showLoginPrompt && (
            <div className="login-prompt">
              <p>You need to be logged in to {isAddingNew ? 'submit suggestions' : 'vote'}.</p>
              <div className="login-prompt-buttons">
                <button 
                  className="login-button"
                  onClick={() => {
                    onLoginRequest();
                    setShowLoginPrompt(false);
                  }}
                >
                  Login
                </button>
                <button 
                  className="register-button"
                  onClick={() => {
                    onRegisterRequest();
                    setShowLoginPrompt(false);
                  }}
                >
                  Register
                </button>
                <button 
                  className="cancel-prompt-button"
                  onClick={() => setShowLoginPrompt(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isAddingNew ? (
            <form className="new-suggestion-form" onSubmit={handleSubmitNewSuggestion}>
              <textarea
                placeholder="Describe your feature suggestion..."
                value={newSuggestion}
                onChange={(e) => setNewSuggestion(e.target.value)}
                rows={3}
                maxLength={200}
              />
              <div className="form-footer">
                <span className="character-count">
                  {newSuggestion.length}/200
                </span>
                <div className="form-buttons">
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewSuggestion('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="submit-button"
                    disabled={newSuggestion.trim().length < 10}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <>
              <div className="voting-cycle-info">
                <div className="cycle-badge">Monthly Voting</div>
                <div className="days-remaining">{getDaysRemaining()} days remaining</div>
              </div>

              {topSuggestions.length > 0 ? (
                <div className="top-suggestions">
                  <h4>Top Suggestions</h4>
                  <ul className="suggestions-list">
                    {topSuggestions.map((suggestion, index) => (
                      <li key={suggestion.id} className="suggestion-item">
                        <div className="suggestion-rank">{index + 1}</div>
                        <div className="suggestion-content">
                          <p className="suggestion-text">{suggestion.text}</p>
                          <div className="suggestion-meta">
                            {suggestion.status === 'selected' && (
                              <span className="selected-badge">Selected for Development</span>
                            )}
                            {suggestion.createdBy && (
                              <span className="submitter-info">
                                By: {suggestion.createdBy.name}
                              </span>
                            )}
                            <span className="date-added">
                              {formatDate(suggestion.dateAdded)}
                            </span>
                          </div>
                        </div>
                        <div className="vote-buttons">
                          <button 
                            className={`vote-button upvote ${userVotes[suggestion.id] === 'up' ? 'voted' : ''}`}
                            onClick={() => handleVote(suggestion.id, true)}
                            title="Upvote this suggestion"
                          >
                            ▲
                          </button>
                          <span className="vote-count">{getNetVotes(suggestion)}</span>
                          <button 
                            className={`vote-button downvote ${userVotes[suggestion.id] === 'down' ? 'voted' : ''}`}
                            onClick={() => handleVote(suggestion.id, false)}
                            title="Downvote this suggestion"
                          >
                            ▼
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="no-suggestions">
                  <p>No suggestions yet. Be the first to suggest a feature!</p>
                </div>
              )}

              {carouselSuggestions.length > 0 && (
                <div className="suggestion-carousel">
                  <h4>More Suggestions</h4>
                  <div className="carousel-container">
                    <button 
                      className="carousel-nav-button prev"
                      onClick={() => handleCarouselNav('prev')}
                      aria-label="Previous suggestion"
                    >
                      ❮
                    </button>
                    
                    <div className="carousel-slide">
                      {carouselSuggestions.map((suggestion, index) => (
                        <div 
                          key={suggestion.id} 
                          className={`carousel-item ${index === carouselIndex ? 'active' : ''}`}
                        >
                          <div className="suggestion-content">
                            <p className="suggestion-text">{suggestion.text}</p>
                            <div className="suggestion-meta">
                              {suggestion.createdBy && (
                                <span className="submitter-info">
                                  By: {suggestion.createdBy.name}
                                </span>
                              )}
                              <span className="date-added">
                                {formatDate(suggestion.dateAdded)}
                              </span>
                            </div>
                          </div>
                          <div className="vote-buttons">
                            <button 
                              className={`vote-button upvote ${userVotes[suggestion.id] === 'up' ? 'voted' : ''}`}
                              onClick={() => handleVote(suggestion.id, true)}
                              title="Upvote this suggestion"
                            >
                              ▲
                            </button>
                            <span className="vote-count">{getNetVotes(suggestion)}</span>
                            <button 
                              className={`vote-button downvote ${userVotes[suggestion.id] === 'down' ? 'voted' : ''}`}
                              onClick={() => handleVote(suggestion.id, false)}
                              title="Downvote this suggestion"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      className="carousel-nav-button next"
                      onClick={() => handleCarouselNav('next')}
                      aria-label="Next suggestion"
                    >
                      ❯
                    </button>
                  </div>
                  
                  <div className="carousel-dots">
                    {carouselSuggestions.map((suggestion, index) => (
                      <button 
                        key={suggestion.id} 
                        className={`dot ${index === carouselIndex ? 'active' : ''}`}
                        onClick={() => {
                          setCarouselIndex(index);
                          setIsCarouselPaused(true);
                          setTimeout(() => setIsCarouselPaused(false), 10000);
                        }}
                        aria-label={`Go to suggestion ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedMicroFeedbackBox;