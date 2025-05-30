// src/config/chatbotConfig.js - Production Configuration
export const chatbotConfig = {
  // API Configuration
  api: {
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second base delay
    endpoints: {
      listings: '/listings',
      articles: '/articles', 
      feedback: '/feedback',
      dealers: '/dealers',
      providers: '/providers'
    }
  },

  // UI Configuration
  ui: {
    maxMessages: 100, // Maximum messages to keep in memory
    typingDelay: 800, // Milliseconds to show typing indicator
    messageAnimationDelay: 300, // Delay between multiple messages
    autoScrollDelay: 100, // Delay before auto-scrolling to new message
    
    // Mobile breakpoints
    breakpoints: {
      mobile: 768,
      smallMobile: 480,
      verySmall: 360
    }
  },

  // Response Configuration
  responses: {
    maxCarResults: 3, // Maximum cars to show in chat
    maxReviewResults: 3, // Maximum reviews to show in chat
    searchResultsLimit: 6, // API limit for searches
    
    // Default messages
    welcome: "Hello! I'm your I3w Car Culture assistant. How can I help you today?",
    fallback: "I'd be happy to help you with that! You can ask me to search for cars, find reviews, or get dealer information.",
    error: "I'm having some technical difficulties right now. Please try again in a moment.",
    offline: "You appear to be offline. Please check your internet connection and try again."
  },

  // Feature flags
  features: {
    voiceInput: false, // Voice input (future feature)
    fileUpload: false, // File upload (future feature)
    videoChat: false, // Video chat (future feature)
    multiLanguage: false, // Multi-language support (future feature)
    
    // Current features
    carSearch: true,
    reviewSearch: true,
    dealerInfo: true,
    userFeedback: true,
    conversationHistory: true,
    analytics: true
  },

  // Analytics Configuration
  analytics: {
    enabled: process.env.NODE_ENV === 'production',
    trackingService: 'google', // 'google', 'mixpanel', 'custom'
    events: {
      chatbotOpened: 'chatbot_opened',
      messagesSent: 'chatbot_message_sent',
      carSearched: 'chatbot_car_search',
      reviewSearched: 'chatbot_review_search',
      feedbackSubmitted: 'chatbot_feedback',
      errorOccurred: 'chatbot_error'
    }
  },

  // Performance Configuration
  performance: {
    debounceDelay: 300, // Debounce user input
    throttleDelay: 1000, // Throttle API calls
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    conversationSaveInterval: 30000, // 30 seconds
    maxConversationAge: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Error Handling
  errorHandling: {
    maxRetries: 3,
    retryBackoffMultiplier: 2,
    showDetailedErrors: process.env.NODE_ENV === 'development',
    
    // Error types
    networkError: {
      message: "Network connection error. Please check your internet connection.",
      retryable: true
    },
    serverError: {
      message: "Server error occurred. Please try again later.",
      retryable: true
    },
    rateLimitError: {
      message: "Too many requests. Please wait a moment before trying again.",
      retryable: false
    },
    authError: {
      message: "Authentication error. Please refresh the page.",
      retryable: false
    }
  },

  // Security Configuration
  security: {
    maxMessageLength: 500,
    maxFeedbackLength: 1000,
    allowedFileTypes: [], // No file uploads for now
    sanitizeInput: true,
    rateLimit: {
      maxRequests: 30,
      windowMs: 60000 // 1 minute
    }
  },

  // Accessibility Configuration
  accessibility: {
    reduceMotion: false, // Will be set based on user preference
    highContrast: false, // Will be set based on user preference
    largeText: false, // Future feature
    keyboardNavigation: true,
    screenReaderSupport: true
  },

  // Development Configuration
  development: {
    enableConsoleLogging: process.env.NODE_ENV === 'development',
    mockApiCalls: false,
    debugMode: process.env.NODE_ENV === 'development',
    showPerformanceMetrics: false
  }
};

// Suggestion templates for different contexts
export const suggestionTemplates = {
  welcome: [
    'Show me available cars',
    'I want to read car reviews', 
    'How can I contact a dealer?'
  ],
  
  carSearch: [
    'Show me more options',
    'Different price range',
    'What do you recommend?'
  ],
  
  reviews: [
    'Find me a good family car',
    'Show sports car reviews',
    'What\'s the most reliable car?'
  ],
  
  luxury: [
    'Show luxury cars',
    'Mercedes-Benz options', 
    'BMW premium models'
  ],
  
  family: [
    'Show family SUVs',
    'Safe cars for kids',
    'Reliable family cars'
  ],
  
  sports: [
    'Show sports cars',
    'Fast car reviews',
    'Performance vehicles'
  ],
  
  budget: [
    'Cars under $20,000',
    'Most affordable options',
    'Best value cars'
  ],
  
  electric: [
    'Show electric cars',
    'Tesla options',
    'Hybrid vehicles'
  ],
  
  error: [
    'Browse cars directly',
    'Read reviews',
    'Contact support'
  ]
};

// Response templates for different scenarios
export const responseTemplates = {
  greeting: {
    morning: "Good morning! How can I help you find your perfect car today?",
    afternoon: "Good afternoon! What type of car are you looking for?",
    evening: "Good evening! I'm here to help you find the right vehicle.",
    default: "Hello! I'm your I3w Car Culture assistant. How can I help you today?"
  },
  
  carSearch: {
    found: (count) => `I found ${count} cars that match your search.`,
    notFound: "I couldn't find any cars matching your search. Try with different criteria.",
    error: "I'm having trouble searching right now. You can browse all cars in our marketplace.",
    tooMany: (count) => `I found ${count} cars. Here are the top matches:`
  },
  
  reviews: {
    found: (topic) => `Here are some reviews about ${topic}:`,
    general: "Here are some of our latest car reviews:",
    notFound: "I couldn't find specific reviews for that. Here are some popular reviews:",
    error: "I'm having trouble finding reviews right now. You can check our News section."
  },
  
  feedback: {
    thanks: "Thank you for your feedback! Your input helps us improve.",
    error: "Sorry, I couldn't save your feedback right now. Please try again later.",
    required: "Please provide a rating to submit your feedback."
  },
  
  help: {
    capabilities: "I can help you:\n\n🚗 Search for cars by make, model, price, or type\n📝 Find and read car reviews\n💬 Connect you with dealers\n💡 Give personalized recommendations",
    search: "You can search by saying things like 'Show me BMW sedans' or 'Find cars under $30,000'",
    reviews: "Ask me about reviews like 'BMW M4 review' or 'best family car reviews'",
    contact: "I can help you find dealer contact information for any car you're interested in."
  }
};

// Car data mappings for better search results
export const carMappings = {
  makes: {
    'benz': 'Mercedes-Benz',
    'mercedes': 'Mercedes-Benz', 
    'chevy': 'Chevrolet',
    'vw': 'Volkswagen',
    'beemer': 'BMW',
    'bimmer': 'BMW'
  },
  
  categories: {
    'crossover': 'SUV',
    'pickup': 'Truck',
    'sports car': 'Sports Car',
    'sport car': 'Sports Car',
    'family car': 'SUV',
    'luxury car': 'Luxury'
  },
  
  conditions: {
    'pre-owned': 'used',
    'second-hand': 'used',
    'brand new': 'new'
  }
};

// Price range mappings
export const priceRanges = {
  'budget': { max: 15000 },
  'cheap': { max: 15000 },
  'affordable': { max: 25000 },
  'mid-range': { min: 25000, max: 50000 },
  'expensive': { min: 50000 },
  'luxury': { min: 75000 },
  'high-end': { min: 100000 }
};

// Export configuration with environment-specific overrides
const getConfig = () => {
  const baseConfig = { ...chatbotConfig };
  
  // Override for production
  if (process.env.NODE_ENV === 'production') {
    baseConfig.development.enableConsoleLogging = false;
    baseConfig.development.debugMode = false;
    baseConfig.analytics.enabled = true;
  }
  
  // Override for development
  if (process.env.NODE_ENV === 'development') {
    baseConfig.api.timeout = 15000; // Longer timeout for development
    baseConfig.errorHandling.showDetailedErrors = true;
  }
  
  return baseConfig;
};

export default getConfig();
