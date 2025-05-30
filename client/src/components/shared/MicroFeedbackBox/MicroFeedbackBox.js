// src/components/shared/MicroFeedbackBox/MicroFeedbackBox.js
import React, { useState, useEffect, useRef } from 'react';
import './MicroFeedbackBox.css';

const MicroFeedbackBox = ({ initialSuggestions = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [currentSuggestion, setCurrentSuggestion] = useState(null);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [userVotes, setUserVotes] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const sliderInterval = useRef(null);
  const boxRef = useRef(null);

  // Sort suggestions by vote count (descending)
  const sortedSuggestions = [...suggestions].sort((a, b) => b.votes - a.votes);
  const topSuggestions = sortedSuggestions.slice(0, 5);
  const remainingSuggestions = sortedSuggestions.slice(5);

  // Set up rotating suggestions
  useEffect(() => {
    if (remainingSuggestions.length > 0 && isExpanded) {
      setCurrentSuggestion(remainingSuggestions[0]);
      
      // Set up interval to rotate through remaining suggestions
      sliderInterval.current = setInterval(() => {
        setCurrentSuggestion(prevSuggestion => {
          const currentIndex = remainingSuggestions.findIndex(s => s.id === prevSuggestion?.id);
          const nextIndex = (currentIndex + 1) % remainingSuggestions.length;
          return remainingSuggestions[nextIndex];
        });
      }, 5000); // Rotate every 5 seconds
    }

    return () => {
      if (sliderInterval.current) {
        clearInterval(sliderInterval.current);
      }
    };
  }, [remainingSuggestions, isExpanded]);

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
  };

  const handleVote = (id) => {
    // Check if user has already voted for this suggestion
    if (userVotes[id]) {
      setErrorMessage("You've already voted for this suggestion");
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setSuggestions(prev =>
      prev.map(suggestion =>
        suggestion.id === id
          ? { ...suggestion, votes: suggestion.votes + 1 }
          : suggestion
      )
    );

    // Record user's vote
    setUserVotes(prev => ({ ...prev, [id]: true }));
    
    // Show success message
    setSuccessMessage("Thanks for your vote!");
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddNewToggle = () => {
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
      votes: 1, // Start with 1 vote (creator's vote)
      dateAdded: new Date().toISOString(),
      status: 'active'
    };

    setSuggestions(prev => [...prev, newItem]);
    setUserVotes(prev => ({ ...prev, [newItem.id]: true })); // Mark as voted by user
    setNewSuggestion('');
    setIsAddingNew(false);
    
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

  return (
    <div 
      className={`micro-feedback-box ${isExpanded ? 'expanded' : 'collapsed'}`}
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
                          </div>
                        </div>
                        <div className="suggestion-votes">
                          <button 
                            className={`vote-button ${userVotes[suggestion.id] ? 'voted' : ''}`}
                            onClick={() => handleVote(suggestion.id)}
                            disabled={userVotes[suggestion.id]}
                            title={userVotes[suggestion.id] ? "You've already voted" : "Vote for this suggestion"}
                          >
                            ▲
                          </button>
                          <span className="vote-count">{suggestion.votes}</span>
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

              {remainingSuggestions.length > 0 && (
                <div className="rotating-suggestion">
                  <h4>More Suggestions</h4>
                  {currentSuggestion && (
                    <div className="suggestion-slide">
                      <p className="suggestion-text">{currentSuggestion.text}</p>
                      <div className="suggestion-votes">
                        <button 
                          className={`vote-button ${userVotes[currentSuggestion.id] ? 'voted' : ''}`}
                          onClick={() => handleVote(currentSuggestion.id)}
                          disabled={userVotes[currentSuggestion.id]}
                        >
                          ▲
                        </button>
                        <span className="vote-count">{currentSuggestion.votes}</span>
                      </div>
                    </div>
                  )}
                  <div className="slider-dots">
                    {remainingSuggestions.map((suggestion, index) => (
                      <span 
                        key={suggestion.id} 
                        className={`dot ${currentSuggestion?.id === suggestion.id ? 'active' : ''}`}
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

export default MicroFeedbackBox;