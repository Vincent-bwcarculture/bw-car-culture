// src/components/shared/Chatbot/Chatbot.js - Enhanced Version
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import chatbotService from '../../../services/chatbotService.js';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'feedback', 'quicklinks', 'contact'
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [suggestions, setSuggestions] = useState([
    
    // ' Read car reviews',
    // ' Contact a dealer',
    ' Quick links',
    '💬 Contact us on WhatsApp',
    // '📋 Give website feedback'
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  const [websiteFeedback, setWebsiteFeedback] = useState({ 
    category: 'general', 
    rating: 0, 
    comment: '', 
    email: '' 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [retryCount, setRetryCount] = useState(0);
  const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(true);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Enhanced suggestion prompts
  const suggestionSets = {
    welcome: [
      // '🚗 Show me available cars',
      // '📝 Read car reviews', 
      // '📞 Contact a dealer',
      '⚡ Quick links',
      '💬 WhatsApp us',
      // '📋 Website feedback'
    ],
    carSearch: [
      // '🔍 Show me more cars',
      // '💰 Different price range',
      // '⭐ What do you recommend?',
      // '🏠 Find dealers near me',
      '📱 Contact via WhatsApp'
    ],
    reviews: [
      // ' Best family cars',
      // ' Sports car reviews',
      // ' Electric car reviews',
      // ' Car buying tips',
      '📞 Get expert advice'
    ],
    quickLinks: [
      ' Go to Homepage',
      ' Browse Marketplace',
      '📰 Latest News',
      ' Find Dealerships',
      'Transport Services',
      '📞 Contact Support'
    ],
    help: [
      '❓ How to buy a car',
      '💳 Financing options',
      '🔧 Maintenance tips',
      // '📄 Required documents',
      '⚡ Back to main menu'
    ]
  };

  // Initialize chatbot with enhanced welcome
  useEffect(() => {
    const initializeChatbot = async () => {
      const savedConversation = chatbotService.loadConversation();
      
      if (savedConversation && savedConversation.length > 0) {
        setMessages(savedConversation);
        setShowWelcomeAnimation(false);
      } else {
        const welcomeMessages = [
          { 
            type: 'bot', 
            text: '👋 Hello! Welcome to I3w Car Culture!',
            timestamp: Date.now()
          },
          { 
            type: 'bot', 
            text: 'I\'m your personal car assistant. I can help you:\n\n🚗 Find your perfect car\n📝 Read expert reviews\n📞 Connect with dealers\n💬 Contact our team\n📋 Share feedback',
            timestamp: Date.now() + 100,
            showWelcome: true
          }
        ];
        setMessages(welcomeMessages);
        
        // Hide welcome animation after showing
        setTimeout(() => setShowWelcomeAnimation(false), 2000);
      }
    };

    initializeChatbot();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save conversation whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      chatbotService.saveConversation(messages);
    }
  }, [messages]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current && currentView === 'chat') {
      inputRef.current.focus();
    }
  }, [isOpen, currentView]);

  const toggleChatbot = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setCurrentView('chat');
      chatbotService.trackEvent('chatbot_opened');
    }
  }, [isOpen]);

  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, { ...message, timestamp: Date.now() }]);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (currentMessage.trim() === '' || isLoading) return;

    const userMessage = { type: 'user', text: currentMessage.trim() };
    addMessage(userMessage);
    
    const messageToProcess = currentMessage.trim();
    setCurrentMessage('');
    setIsLoading(true);
    setIsTyping(true);
    setConnectionStatus('connecting');

    try {
      // Handle special commands first
      if (messageToProcess.toLowerCase().includes('quick links') || 
          messageToProcess.toLowerCase().includes('menu')) {
        setTimeout(() => {
          addMessage({ 
            type: 'bot', 
            text: '⚡ Here are quick links to popular sections:' 
          });
          setIsTyping(false);
          setIsLoading(false);
          setConnectionStatus('connected');
          setSuggestions(suggestionSets.quickLinks);
        }, 800);
        return;
      }

      if (messageToProcess.toLowerCase().includes('whatsapp') || 
          messageToProcess.toLowerCase().includes('contact us')) {
        setTimeout(() => {
          addMessage({ 
            type: 'bot', 
            text: '📱 I can connect you with our team via WhatsApp! Click the button below to start chatting with our management team.',
            action: 'whatsapp'
          });
          setIsTyping(false);
          setIsLoading(false);
          setConnectionStatus('connected');
        }, 800);
        return;
      }

      if (messageToProcess.toLowerCase().includes('feedback') || 
          messageToProcess.toLowerCase().includes('review website')) {
        setTimeout(() => {
          addMessage({ 
            type: 'bot', 
            text: '📋 I\'d love to hear your thoughts about our website! Your feedback helps us improve.',
            action: 'feedback'
          });
          setIsTyping(false);
          setIsLoading(false);
          setConnectionStatus('connected');
        }, 800);
        return;
      }

      // Check for contextual response
      const contextualResponse = chatbotService.getContextualResponse(
        messageToProcess, 
        messages
      );

      if (contextualResponse) {
        setTimeout(() => {
          addMessage({ type: 'bot', text: contextualResponse.text });
          setIsTyping(false);
          setIsLoading(false);
          setConnectionStatus('connected');
          setRetryCount(0);
          
          if (contextualResponse.action) {
            handleBotAction(contextualResponse.action);
          }
          
          setSuggestions(generateSuggestions(messageToProcess, 'contextual'));
        }, 800);
        return;
      }

      // Handle car search requests
      if (isCarSearchQuery(messageToProcess)) {
        try {
          const searchResults = await chatbotService.searchCars(messageToProcess);
          
          setTimeout(() => {
            addMessage({ type: 'bot', text: searchResults.message });
            
            if (searchResults.success && searchResults.cars && searchResults.cars.length > 0) {
              searchResults.cars.forEach((car, index) => {
                setTimeout(() => {
                  addMessage({ 
                    type: 'bot', 
                    text: `🚗 **${car.title}**\n💰 ${formatPrice(car.price)}\n📅 Year: ${car.year}\n📍 ${car.location || 'Available nationwide'}`,
                    carId: car.id,
                    carData: car
                  });
                }, 300 * (index + 1));
              });
              
              setTimeout(() => {
                addMessage({
                  type: 'bot',
                  text: "💡 Would you like to see more details, contact the dealer, or search for something different?",
                  actions: [
                    { text: '🔍 View in Marketplace', action: { type: 'navigate', path: '/marketplace' } },
                    { text: '📞 Contact Dealer', action: { type: 'contactDealer' } },
                    { text: '💬 WhatsApp Us', action: { type: 'whatsapp' } }
                  ]
                });
              }, 300 * (searchResults.cars.length + 1));
            }
            
            setIsTyping(false);
            setIsLoading(false);
            setConnectionStatus('connected');
            setRetryCount(0);
            setSuggestions(suggestionSets.carSearch);
          }, 1500);
          
          return;
        } catch (error) {
          console.error('Car search error:', error);
          handleApiError(error, 'search for cars');
          return;
        }
      }
      
      // Handle review requests
      if (isReviewQuery(messageToProcess)) {
        try {
          const reviewResults = await chatbotService.getCarReviews(messageToProcess);
          
          setTimeout(() => {
            addMessage({ type: 'bot', text: reviewResults.message });
            
            if (reviewResults.success && reviewResults.reviews && reviewResults.reviews.length > 0) {
              reviewResults.reviews.forEach((review, index) => {
                setTimeout(() => {
                  addMessage({ 
                    type: 'bot', 
                    text: `📝 **${review.title}**\n⭐ ${review.rating}/5 stars\n"${review.snippet}"`,
                    reviewId: review.id,
                    reviewUrl: review.url
                  });
                }, 400 * (index + 1));
              });
            }
            
            setIsTyping(false);
            setIsLoading(false);
            setConnectionStatus('connected');
            setRetryCount(0);
            setSuggestions(suggestionSets.reviews);
          }, 1500);
          
          return;
        } catch (error) {
          console.error('Review search error:', error);
          handleApiError(error, 'find reviews');
          return;
        }
      }

      // Handle general queries
      const botResponse = generateResponse(messageToProcess);
      setTimeout(() => {
        addMessage({ type: 'bot', text: botResponse.text });
        setIsTyping(false);
        setIsLoading(false);
        setConnectionStatus('connected');
        setRetryCount(0);
        
        if (botResponse.action) {
          handleBotAction(botResponse.action);
        }
        
        setSuggestions(generateSuggestions(messageToProcess, 'general'));
      }, 1000);
      
    } catch (error) {
      console.error('Message processing error:', error);
      handleApiError(error, 'process your message');
    }
  }, [currentMessage, messages, isLoading, addMessage]);

  const handleApiError = useCallback((error, action) => {
    setIsLoading(false);
    setIsTyping(false);
    setRetryCount(prev => prev + 1);
    
    let errorMessage = `I'm having trouble trying to ${action} right now. `;
    
    if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      setConnectionStatus('offline');
      errorMessage += "It seems you're offline. Please check your internet connection.";
    } else if (error.response?.status === 429) {
      setConnectionStatus('rate_limited');
      errorMessage += "I'm getting too many requests. Please wait a moment before trying again.";
    } else if (error.response?.status >= 500) {
      setConnectionStatus('server_error');
      errorMessage += "Our servers are having issues. Please try again in a few moments.";
    } else {
      setConnectionStatus('error');
      errorMessage += "Please try again or contact us directly on WhatsApp.";
    }
    
    addMessage({ 
      type: 'bot', 
      text: errorMessage,
      isError: true
    });

    // Offer alternative actions
    if (retryCount < 2) {
      setTimeout(() => {
        addMessage({
          type: 'bot',
          text: "You can also:",
          actions: [
            { text: '🚗 Browse Cars', action: { type: 'navigate', path: '/marketplace' } },
            { text: '📰 Read News', action: { type: 'navigate', path: '/news' } },
            { text: '💬 WhatsApp Us', action: { type: 'whatsapp' } },
            { text: '🔄 Try Again', action: { type: 'retry' } }
          ]
        });
      }, 1000);
    }
  }, [retryCount, addMessage]);

  const handleSuggestionClick = useCallback(async (suggestion) => {
    if (isLoading) return;
    
    // Handle special emoji-based suggestions
    if (suggestion.includes('⚡ Quick links')) {
      addMessage({ type: 'user', text: suggestion });
      setTimeout(() => {
        addMessage({ 
          type: 'bot', 
          text: '⚡ Here are quick links to popular sections:' 
        });
        setSuggestions(suggestionSets.quickLinks);
      }, 500);
      return;
    }

    if (suggestion.includes('💬') && suggestion.includes('WhatsApp')) {
      addMessage({ type: 'user', text: suggestion });
      setTimeout(() => {
        addMessage({ 
          type: 'bot', 
          text: '📱 Ready to connect you with our team! Click below to start chatting on WhatsApp.',
          action: 'whatsapp'
        });
      }, 500);
      return;
    }

    if (suggestion.includes('📋') && suggestion.includes('feedback')) {
      addMessage({ type: 'user', text: suggestion });
      setTimeout(() => {
        addMessage({ 
          type: 'bot', 
          text: '📋 I\'d love to hear your feedback about our website! Your input helps us improve.',
          action: 'feedback'
        });
      }, 500);
      return;
    }

    // Handle navigation suggestions
    if (suggestion.includes('🏠 Go to Homepage')) {
      navigate('/');
      return;
    }
    if (suggestion.includes('🚗 Browse Marketplace')) {
      navigate('/marketplace');
      return;
    }
    if (suggestion.includes('📰 Latest News')) {
      navigate('/news');
      return;
    }
    if (suggestion.includes('🏪 Find Dealerships')) {
      navigate('/dealerships');
      return;
    }
    if (suggestion.includes('🚌 Transport Services')) {
      navigate('/services');
      return;
    }

    // Remove emoji and process as regular message
    const cleanSuggestion = suggestion.replace(/[^\w\s]/gi, '').trim();
    
    addMessage({ type: 'user', text: suggestion });
    setIsLoading(true);
    setIsTyping(true);
    
    // Process the suggestion
    if (cleanSuggestion.toLowerCase().includes('recommend') || 
        cleanSuggestion.toLowerCase().includes('suggest')) {
      
      setTimeout(() => {
        const recommendations = chatbotService.getCarRecommendations(
          messages.map(m => m.text).join(' ')
        );
        
        addMessage({ 
          type: 'bot', 
          text: "🎯 Based on our conversation, here are some cars I'd recommend:" 
        });
        
        recommendations.forEach((car, index) => {
          setTimeout(() => {
            addMessage({ 
              type: 'bot', 
              text: `🚗 **${car.make} ${car.model}** (${car.type})\n✨ Features: ${car.features}`
            });
          }, 400 * (index + 1));
        });
        
        setIsLoading(false);
        setIsTyping(false);
        setSuggestions(suggestionSets.carSearch);
      }, 1000);
      
      return;
    }
    
    // For other suggestions, process normally
    setTimeout(() => {
      const botResponse = generateResponse(cleanSuggestion);
      addMessage({ type: 'bot', text: botResponse.text });
      setIsLoading(false);
      setIsTyping(false);
      
      if (botResponse.action) {
        handleBotAction(botResponse.action);
      }
      
      setSuggestions(generateSuggestions(cleanSuggestion, 'suggestion'));
    }, 800);
  }, [messages, isLoading, addMessage, navigate]);

  const handleBotAction = useCallback((action) => {
    switch (action) {
      case 'whatsapp':
        handleWhatsAppContact();
        break;
      case 'feedback':
        setCurrentView('feedback');
        break;
      case 'quicklinks':
        setSuggestions(suggestionSets.quickLinks);
        break;
      default:
        if (typeof action === 'object') {
          switch (action.type) {
            case 'navigate':
              navigate(action.path);
              chatbotService.trackEvent('chatbot_navigation', { path: action.path });
              break;
            case 'whatsapp':
              handleWhatsAppContact();
              break;
            case 'contactDealer':
              navigate('/marketplace');
              break;
            case 'retry':
              setRetryCount(0);
              setConnectionStatus('connected');
              break;
            default:
              break;
          }
        }
        break;
    }
  }, [navigate]);

  const handleWhatsAppContact = useCallback(() => {
    const phoneNumber = '+26774122453';
    const message = encodeURIComponent('Hi! I was browsing I3w Car Culture website and would like some assistance.');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
    chatbotService.trackEvent('whatsapp_contact_clicked');
    
    addMessage({
      type: 'bot',
      text: '📱 Great! I\'ve opened WhatsApp for you. Our team will respond shortly during business hours (8 AM - 6 PM).'
    });
  }, [addMessage]);

  const handleWebsiteFeedback = useCallback(async () => {
    if (websiteFeedback.rating === 0) return;
    
    setIsLoading(true);
    
    try {
      // Submit website feedback
      const result = await chatbotService.submitWebsiteFeedback(websiteFeedback);
      
      setTimeout(() => {
        setCurrentView('chat');
        setWebsiteFeedback({ category: 'general', rating: 0, comment: '', email: '' });
        
        addMessage({ 
          type: 'bot', 
          text: result.message || "🙏 Thank you for your valuable feedback! We really appreciate you taking the time to help us improve." 
        });
        
        setIsLoading(false);
        setSuggestions(suggestionSets.welcome);
      }, 800);
    } catch (error) {
      console.error('Website feedback error:', error);
      setIsLoading(false);
      addMessage({ 
        type: 'bot', 
        text: "😔 Sorry, I couldn't submit your feedback right now. Please try contacting us on WhatsApp instead.",
        action: 'whatsapp'
      });
    }
  }, [websiteFeedback, addMessage]);

  // Query classification helpers
  const isCarSearchQuery = useCallback((message) => {
    const searchTerms = [
      'show', 'find', 'search', 'looking for', 'want', 'need', 'available',
      'cars', 'vehicle', 'auto', 'bmw', 'mercedes', 'toyota', 'honda', 'audi',
      'suv', 'sedan', 'coupe', 'truck', 'sports car', 'luxury', 'cheap', 'expensive'
    ];
    const lowerMessage = message.toLowerCase();
    return searchTerms.some(term => lowerMessage.includes(term)) && 
           (lowerMessage.includes('car') || lowerMessage.includes('vehicle'));
  }, []);

  const isReviewQuery = useCallback((message) => {
    const reviewTerms = ['review', 'opinion', 'rating', 'what do you think', 'good car', 'recommend'];
    const lowerMessage = message.toLowerCase();
    return reviewTerms.some(term => lowerMessage.includes(term));
  }, []);

  const generateResponse = useCallback((message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return {
        text: "🤖 I'm here to help you with:\n\n🚗 **Find Cars** - Search by make, model, price, or type\n📝 **Read Reviews** - Get expert opinions and ratings\n📞 **Contact Dealers** - Connect with verified sellers\n💬 **WhatsApp Support** - Direct line to our team\n📋 **Share Feedback** - Help us improve\n⚡ **Quick Links** - Fast navigation\n\nWhat would you like to explore?"
      };
    }
    
    // Add more enhanced responses here...
    return {
      text: "I'd be happy to help you with that! You can ask me to:\n\n🚗 Search for specific cars\n📝 Find car reviews\n📞 Get dealer contact info\n💬 Connect via WhatsApp\n📋 Share website feedback\n\nWhat interests you most?"
    };
  }, []);

  const generateSuggestions = useCallback((message, context) => {
    switch (context) {
      case 'car_search':
        return suggestionSets.carSearch;
      case 'reviews':
        return suggestionSets.reviews;
      case 'quicklinks':
        return suggestionSets.quickLinks;
      default:
        return suggestionSets.welcome;
    }
  }, []);

  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(price);
    }
    return price;
  };

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const getConnectionStatusMessage = () => {
    switch (connectionStatus) {
      case 'offline':
        return '🔴 You appear to be offline';
      case 'connecting':
        return '🟡 Connecting...';
      case 'rate_limited':
        return '🟠 Please wait a moment';
      case 'server_error':
        return '🔴 Server issues';
      case 'error':
        return '🔴 Connection issues';
      default:
        return '🟢 Connected';
    }
  };

  const renderChatView = () => (
    <>
      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.type} ${message.isError ? 'error' : ''} ${message.showWelcome ? 'welcome' : ''}`}
          >
            {message.type === 'bot' && (
              <div className="bot-avatar">
                {showWelcomeAnimation && index === 0 ? '👋' : '🤖'}
              </div>
            )}
            <div className="message-content">
              <div className="message-text">
                {message.text}
              </div>
              
              {/* Action buttons */}
              {message.actions && (
                <div className="message-actions">
                  {message.actions.map((action, idx) => (
                    <button
                      key={idx}
                      className="message-action"
                      onClick={() => handleBotAction(action.action)}
                    >
                      {action.text}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Special action buttons */}
              {message.action === 'whatsapp' && (
                <button 
                  className="message-action whatsapp-action" 
                  onClick={handleWhatsAppContact}
                >
                  💬 Chat on WhatsApp
                </button>
              )}
              
              {message.action === 'feedback' && (
                <button 
                  className="message-action feedback-action" 
                  onClick={() => setCurrentView('feedback')}
                >
                  📋 Give Feedback
                </button>
              )}
              
              {message.carId && (
                <button 
                  className="message-action" 
                  onClick={() => {
                    setSelectedCarId(message.carId);
                    setShowFeedbackForm(true);
                  }}
                >
                  💭 Rate this car
                </button>
              )}
              
              {message.reviewUrl && (
                <button 
                  className="message-action" 
                  onClick={() => navigate(message.reviewUrl)}
                >
                  📖 Read full review
                </button>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message bot">
            <div className="bot-avatar">🤖</div>
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Suggestion chips */}
      <div className="suggestion-chips">
        {suggestions.map((suggestion, index) => (
          <button 
            key={index} 
            className="suggestion-chip"
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isLoading}
          >
            {suggestion}
          </button>
        ))}
      </div>
      
      {/* Chat input */}
      <div className="chatbot-input">
        <input
          ref={inputRef}
          type="text"
          placeholder={isLoading ? "I'm thinking..." : "Type your message..."}
          value={currentMessage}
          onChange={(e) => setCurrentMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          maxLength={500}
        />
        <button 
          className="send-button" 
          onClick={handleSendMessage}
          disabled={!currentMessage.trim() || isLoading}
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="loading-spinner-small"></div>
          ) : (
            '📤'
          )}
        </button>
      </div>
    </>
  );

  const renderFeedbackView = () => (
    <div className="feedback-view">
      <div className="feedback-header">
        <h3>📋 Website Feedback</h3>
        <p>Help us improve your experience</p>
      </div>

      <div className="feedback-form">
        <div className="form-group">
          <label>What's your feedback about?</label>
          <select 
            value={websiteFeedback.category}
            onChange={(e) => setWebsiteFeedback({...websiteFeedback, category: e.target.value})}
          >
            <option value="general">General Experience</option>
            <option value="design">Website Design</option>
            <option value="performance">Site Performance</option>
            <option value="content">Content Quality</option>
            <option value="navigation">Navigation</option>
            <option value="mobile">Mobile Experience</option>
            <option value="search">Search Functionality</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Overall Rating</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span 
                key={star} 
                className={`star ${star <= websiteFeedback.rating ? 'active' : ''}`}
                onClick={() => setWebsiteFeedback({...websiteFeedback, rating: star})}
              >
                ⭐
              </span>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Your Comments (Optional)</label>
          <textarea
            placeholder="Tell us what you think..."
            value={websiteFeedback.comment}
            onChange={(e) => setWebsiteFeedback({...websiteFeedback, comment: e.target.value})}
            rows={4}
            maxLength={1000}
          />
        </div>

        <div className="form-group">
          <label>Email (Optional - for follow-up)</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={websiteFeedback.email}
            onChange={(e) => setWebsiteFeedback({...websiteFeedback, email: e.target.value})}
          />
        </div>

        <div className="feedback-buttons">
          <button 
            className="cancel-button"
            onClick={() => setCurrentView('chat')}
            disabled={isLoading}
          >
            ← Back to Chat
          </button>
          <button 
            className="submit-button"
            onClick={handleWebsiteFeedback}
            disabled={websiteFeedback.rating === 0 || isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="chatbot-wrapper">
      {/* Enhanced chatbot button */}
      <button 
        className={`chatbot-button ${isOpen ? 'open' : ''} ${connectionStatus !== 'connected' ? 'status-warning' : ''}`} 
        onClick={toggleChatbot}
        aria-label={isOpen ? 'Close chatbot' : 'Open chatbot'}
        disabled={isLoading && !isOpen}
      >
        {isLoading && !isOpen ? (
          <div className="loading-spinner-small"></div>
        ) : (
          <span className="chatbot-button-icon">
            {isOpen ? '✕' : '💬'}
          </span>
        )}
        {!isOpen && (
          <div className="chatbot-button-pulse"></div>
        )}
      </button>
      
      {/* Enhanced chatbot dialog */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="header-content">
              <div className="header-info">
                <h3>🤖 I3w Car Assistant</h3>
                <div className="connection-status">{getConnectionStatusMessage()}</div>
              </div>
              <div className="header-actions">
                {currentView !== 'chat' && (
                  <button 
                    className="back-button"
                    onClick={() => setCurrentView('chat')}
                    aria-label="Back to chat"
                  >
                    ←
                  </button>
                )}
                <button 
                  className="close-button" 
                  onClick={toggleChatbot}
                  aria-label="Close chatbot"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
          
          {/* Dynamic content based on current view */}
          {currentView === 'chat' && renderChatView()}
          {currentView === 'feedback' && renderFeedbackView()}
        </div>
      )}
    </div>
  );
};

export default Chatbot;