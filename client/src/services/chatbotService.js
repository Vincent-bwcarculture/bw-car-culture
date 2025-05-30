// src/services/chatbotService.js - Fixed ESLint Issues
import { http } from '../config/axios.js';

class ChatbotService {
  constructor() {
    this.conversationId = this.generateConversationId();
    this.apiRetryCount = 3;
    this.apiTimeout = 10000; // 10 seconds
  }

  generateConversationId() {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Enhanced car search with real API integration
  async searchCars(query) {
    try {
      // Parse query for search parameters
      const filters = this.parseCarSearchQuery(query);
      
      console.log('Chatbot searching cars with filters:', filters);
      
      // Call real listing service with retry mechanism
      const results = await this.callWithRetry(async () => {
        const response = await http.get('/listings', {
          params: {
            ...filters,
            limit: 6, // Limit results for chatbot
            status: 'active'
          },
          timeout: this.apiTimeout
        });
        return response.data;
      });
      
      if (results && results.success && results.data && results.data.length > 0) {
        // Track search event
        this.trackEvent('car_search', { query, resultsCount: results.data.length });
        
        return {
          success: true,
          count: results.data.length,
          total: results.total || results.data.length,
          message: `I found ${results.data.length} cars that match your search.`,
          filters: filters,
          cars: results.data.slice(0, 3).map(car => ({
            id: car._id,
            title: car.title,
            price: car.price,
            year: car.specifications?.year || car.year,
            make: car.specifications?.make || car.make,
            model: car.specifications?.model || car.model,
            image: car.images && car.images.length > 0 ? 
                   (typeof car.images[0] === 'string' ? car.images[0] : car.images[0].url) : 
                   '/images/placeholders/car.jpg',
            location: car.location?.city || 'Location not specified'
          }))
        };
      } else {
        // Try fallback search with simplified parameters
        const fallbackResults = await this.fallbackCarSearch(query);
        if (fallbackResults.success) {
          return fallbackResults;
        }
        
        return {
          success: false,
          message: "I couldn't find any cars matching your search. Try with different criteria like 'BMW sedan' or 'SUV under 50000'.",
          filters: filters,
          suggestions: [
            'Show me all BMW cars',
            'Find me an SUV',
            'Cars under $30,000'
          ]
        };
      }
    } catch (error) {
      console.error('Chatbot car search error:', error);
      
      // Track error
      this.trackEvent('car_search_error', { query, error: error.message });
      
      return {
        success: false,
        message: "I'm having trouble searching right now. You can browse all cars directly in our marketplace.",
        action: { type: 'navigate', path: '/marketplace' }
      };
    }
  }

  // Fallback search with simpler parameters
  async fallbackCarSearch(query) {
    try {
      const response = await http.get('/listings', {
        params: {
          search: query,
          limit: 6,
          status: 'active'
        },
        timeout: this.apiTimeout
      });

      if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
        return {
          success: true,
          count: response.data.data.length,
          message: `I found ${response.data.data.length} cars for you.`,
          cars: response.data.data.slice(0, 3).map(car => ({
            id: car._id,
            title: car.title,
            price: car.price,
            year: car.specifications?.year || car.year,
            make: car.specifications?.make || car.make,
            model: car.specifications?.model || car.model,
            image: car.images && car.images.length > 0 ? 
                   (typeof car.images[0] === 'string' ? car.images[0] : car.images[0].url) : 
                   '/images/placeholders/car.jpg'
          }))
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Fallback search failed:', error);
      return { success: false };
    }
  }

  // Enhanced query parsing with more car brands and models
  parseCarSearchQuery(query) {
    const filters = {};
    const lowerQuery = query.toLowerCase();
    
    // Extended list of car makes
    const makes = [
      'audi', 'bmw', 'mercedes', 'mercedes-benz', 'benz', 'toyota', 'honda', 
      'ford', 'chevrolet', 'chevy', 'nissan', 'hyundai', 'kia', 'lexus', 
      'volkswagen', 'vw', 'mazda', 'subaru', 'porsche', 'ferrari', 'lamborghini',
      'bentley', 'rolls-royce', 'jaguar', 'land rover', 'volvo', 'cadillac',
      'lincoln', 'infiniti', 'acura', 'genesis', 'tesla', 'mini', 'mitsubishi'
    ];
    
    // Check for make
    for (const make of makes) {
      if (lowerQuery.includes(make)) {
        // Handle special cases
        if (make === 'benz' || make === 'mercedes-benz') {
          filters.make = 'Mercedes-Benz';
        } else if (make === 'chevy') {
          filters.make = 'Chevrolet';
        } else if (make === 'vw') {
          filters.make = 'Volkswagen';
        } else {
          filters.make = make.charAt(0).toUpperCase() + make.slice(1);
        }
        break;
      }
    }
    
    // Check for vehicle categories/body styles
    const bodyStyles = {
      'suv': 'SUV',
      'crossover': 'SUV', 
      'sedan': 'Sedan',
      'coupe': 'Coupe',
      'convertible': 'Convertible',
      'hatchback': 'Hatchback',
      'wagon': 'Wagon',
      'truck': 'Truck',
      'pickup': 'Truck',
      'van': 'Van'
    };
    
    for (const [key, value] of Object.entries(bodyStyles)) {
      if (lowerQuery.includes(key)) {
        filters.category = value;
        break;
      }
    }
    
    // Check for special categories
    if (lowerQuery.includes('sports car') || lowerQuery.includes('sport car') || 
        lowerQuery.includes('fast car') || lowerQuery.includes('performance')) {
      filters.category = 'Sports Car';
    } else if (lowerQuery.includes('luxury') || lowerQuery.includes('premium')) {
      filters.condition = 'luxury';
    } else if (lowerQuery.includes('family car') || lowerQuery.includes('family')) {
      filters.category = 'SUV'; // Default family cars to SUVs
    }
    
    // Check for condition
    if (lowerQuery.includes('new car') || lowerQuery.includes(' new ')) {
      filters.condition = 'new';
    } else if (lowerQuery.includes('used car') || lowerQuery.includes(' used ')) {
      filters.condition = 'used';
    }
    
    // Check for price ranges with more variations
    if (lowerQuery.includes('cheap') || lowerQuery.includes('affordable') || 
        lowerQuery.includes('budget') || lowerQuery.includes('under 10') ||
        lowerQuery.includes('below 10')) {
      filters.maxPrice = 10000;
    } else if (lowerQuery.includes('under 20') || lowerQuery.includes('below 20')) {
      filters.maxPrice = 20000;
    } else if (lowerQuery.includes('under 30') || lowerQuery.includes('below 30')) {
      filters.maxPrice = 30000;
    } else if (lowerQuery.includes('under 50') || lowerQuery.includes('below 50')) {
      filters.maxPrice = 50000;
    } else if (lowerQuery.includes('expensive') || lowerQuery.includes('over 50') ||
               lowerQuery.includes('above 50') || lowerQuery.includes('high end')) {
      filters.minPrice = 50000;
    }
    
    // Check for year ranges
    const currentYear = new Date().getFullYear();
    if (lowerQuery.includes('latest') || lowerQuery.includes('newest') || 
        lowerQuery.includes('recent') || lowerQuery.includes(`${currentYear}`)) {
      filters.minYear = currentYear - 1;
    } else if (lowerQuery.includes('older') || lowerQuery.includes('classic')) {
      filters.maxYear = currentYear - 10;
    }
    
    // Fuel type
    if (lowerQuery.includes('electric') || lowerQuery.includes('ev') || lowerQuery.includes('tesla')) {
      filters.fuelType = 'electric';
    } else if (lowerQuery.includes('hybrid')) {
      filters.fuelType = 'hybrid';
    } else if (lowerQuery.includes('diesel')) {
      filters.fuelType = 'diesel';
    } else if (lowerQuery.includes('petrol') || lowerQuery.includes('gasoline') || lowerQuery.includes('gas')) {
      filters.fuelType = 'petrol';
    }
    
    return filters;
  }

  // Enhanced car reviews with real API integration
  async getCarReviews(query) {
    try {
      // Try to get reviews from your news/articles API
      const reviewResults = await this.callWithRetry(async () => {
        const response = await http.get('/articles', {
          params: {
            category: 'car-review',
            search: query,
            limit: 5,
            status: 'published'
          },
          timeout: this.apiTimeout
        });
        return response.data;
      });

      if (reviewResults && reviewResults.success && reviewResults.data && reviewResults.data.length > 0) {
        // Track review search
        this.trackEvent('review_search', { query, resultsCount: reviewResults.data.length });
        
        const carMatch = this.matchCarFromQuery(query);
        const message = carMatch ? 
          `Here are some reviews about the ${carMatch}:` : 
          "Here are some of our latest car reviews:";

        return {
          success: true,
          message: message,
          reviews: reviewResults.data.slice(0, 3).map(review => ({
            id: review._id,
            car: review.title.includes('-') ? review.title.split('-')[0].trim() : review.title,
            rating: review.rating || 4.5,
            title: review.title,
            snippet: review.excerpt || review.content?.substring(0, 150) + '...',
            url: `/news/${review.slug || review._id}`,
            publishedAt: review.publishedAt || review.createdAt
          }))
        };
      } else {
        // Fallback to static popular reviews
        return this.getFallbackReviews(query);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      this.trackEvent('review_search_error', { query, error: error.message });
      
      return {
        success: false,
        message: "I'm having trouble finding reviews right now. You can check our latest reviews in the News section.",
        action: { type: 'navigate', path: '/news?category=car-review' }
      };
    }
  }

  // Fallback reviews when API fails
  getFallbackReviews(query) {
    const carMatch = this.matchCarFromQuery(query);
    const reviews = this.getStaticReviews();
    
    if (carMatch) {
      const specificReviews = reviews.filter(review => 
        review.car.toLowerCase().includes(carMatch.toLowerCase()));
      
      if (specificReviews.length > 0) {
        return {
          success: true,
          message: `Here are some reviews about the ${carMatch}:`,
          reviews: specificReviews
        };
      }
    }
    
    return {
      success: true,
      message: "Here are some of our popular car reviews:",
      reviews: reviews.slice(0, 3)
    };
  }

  // Static reviews as fallback
  getStaticReviews() {
    return [
      {
        id: 'review_1',
        car: "BMW M4 Competition",
        rating: 4.8,
        title: "BMW M4 Competition: The Ultimate Driving Machine",
        snippet: "The BMW M4 Competition delivers exhilarating performance with its 503hp twin-turbo inline-6. Handling is precise and the technology package is comprehensive.",
        url: "/news/bmw-m4-competition-review"
      },
      {
        id: 'review_2',
        car: "Toyota RAV4",
        rating: 4.5,
        title: "Toyota RAV4: Practical Excellence",
        snippet: "The RAV4 continues to be a top choice for families, offering reliability, practicality, and surprisingly good fuel economy in a well-built package.",
        url: "/news/toyota-rav4-review"
      },
      {
        id: 'review_3',
        car: "Mercedes-Benz C-Class",
        rating: 4.6,
        title: "Mercedes-Benz C-Class: Luxury Redefined",
        snippet: "The new C-Class brings S-Class luxury to a smaller package. Interior quality is exceptional and the driving experience is refined.",
        url: "/news/mercedes-c-class-review"
      }
    ];
  }

  // Enhanced car matching with more models
  matchCarFromQuery(query) {
    const lowerQuery = query.toLowerCase();
    
    // Expanded car models list
    const carModels = [
      // BMW
      'BMW M4', 'BMW M3', 'BMW 3 Series', 'BMW 5 Series', 'BMW 7 Series', 'BMW X5', 'BMW X3', 'BMW i4', 'BMW iX',
      // Mercedes
      'Mercedes C-Class', 'Mercedes E-Class', 'Mercedes S-Class', 'Mercedes GLC', 'Mercedes GLE', 'Mercedes A-Class',
      // Audi
      'Audi A4', 'Audi A6', 'Audi Q5', 'Audi Q7', 'Audi R8', 'Audi RS5', 'Audi e-tron',
      // Toyota
      'Toyota Camry', 'Toyota Corolla', 'Toyota RAV4', 'Toyota Highlander', 'Toyota Prius', 'Toyota Land Cruiser',
      // Honda
      'Honda Civic', 'Honda Accord', 'Honda CR-V', 'Honda Pilot', 'Honda Ridgeline',
      // Ford
      'Ford Mustang', 'Ford F-150', 'Ford Explorer', 'Ford Escape', 'Ford Bronco',
      // Others
      'Tesla Model 3', 'Tesla Model S', 'Tesla Model Y', 'Tesla Model X',
      'Porsche 911', 'Porsche Cayenne', 'Porsche Macan',
      'Lamborghini Huracán', 'Ferrari 488', 'McLaren 720S'
    ];
    
    for (const model of carModels) {
      if (lowerQuery.includes(model.toLowerCase())) {
        return model;
      }
    }
    
    // Check for makes only
    const makes = ['bmw', 'mercedes', 'audi', 'toyota', 'honda', 'ford', 'tesla', 'porsche', 'ferrari', 'lamborghini'];
    for (const make of makes) {
      if (lowerQuery.includes(make)) {
        return make.charAt(0).toUpperCase() + make.slice(1);
      }
    }
    
    return null;
  }

  // User feedback with real API integration
  async submitUserFeedback(carId, feedback) {
    try {
      // Submit to your feedback API
      const result = await this.callWithRetry(async () => {
        const response = await http.post('/feedback', {
          carId: carId,
          rating: feedback.rating,
          comment: feedback.comment,
          conversationId: this.conversationId,
          source: 'chatbot'
        }, {
          timeout: this.apiTimeout
        });
        return response.data;
      });
      
      // Track feedback submission
      this.trackEvent('feedback_submitted', { 
        carId, 
        rating: feedback.rating, 
        hasComment: !!feedback.comment 
      });
      
      return {
        success: true,
        message: "Thank you for your feedback! We've recorded your thoughts about this vehicle."
      };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      this.trackEvent('feedback_error', { carId, error: error.message });
      
      return {
        success: false,
        message: "Sorry, we couldn't save your feedback right now. Please try again later."
      };
    }
  }

  // Get dealer information
  async getDealerInfo(dealerId) {
    try {
      const response = await this.callWithRetry(async () => {
        const result = await http.get(`/dealers/${dealerId}`, {
          timeout: this.apiTimeout
        });
        return result.data;
      });
      
      if (response && response.success && response.data) {
        return {
          success: true,
          dealer: response.data
        };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Error fetching dealer info:', error);
      return { success: false };
    }
  }

  // Enhanced context handling
  getContextualResponse(userInput, conversationHistory = []) {
    const lowerInput = userInput.toLowerCase();
    
    // Handle greeting
    if (this.isGreeting(lowerInput)) {
      return {
        text: "Hello! Welcome to I3w Car Culture. I'm here to help you find the perfect car. You can ask me to search for specific cars, read reviews, or get information about dealers. What are you looking for today?"
      };
    }
    
    // Handle thanks
    if (this.isThanks(lowerInput)) {
      return {
        text: "You're very welcome! Is there anything else I can help you with? I can search for cars, show you reviews, or help you contact dealers."
      };
    }
    
    // Check conversation context
    const isCarSearchContext = this.isInCarSearchContext(conversationHistory);
    if (isCarSearchContext) {
      if (lowerInput.includes('yes') || lowerInput.includes('show me') || 
          lowerInput.includes('sure') || lowerInput.includes('more')) {
        return {
          text: "Great! Let me show you more options. What specific type of car interests you most?",
          action: { type: 'searchCars' }
        };
      }
      
      if (lowerInput.includes('no') || lowerInput.includes('not interested') || 
          lowerInput.includes('different')) {
        return {
          text: "No problem! Let me know what you're looking for instead. I can help you find cars by make, model, price range, or type."
        };
      }
    }
    
    const isReviewContext = this.isInReviewContext(conversationHistory);
    if (isReviewContext) {
      if (lowerInput.includes('yes') || lowerInput.includes('show me') || lowerInput.includes('more')) {
        return {
          text: "Here are some of our latest car reviews. Which one interests you most?",
          action: { type: 'showReviews' }
        };
      }
    }
    
    return null;
  }

  // Helper methods for context detection
  isGreeting(input) {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(greeting => input.includes(greeting));
  }

  isThanks(input) {
    const thanks = ['thank', 'thanks', 'appreciate', 'grateful'];
    return thanks.some(thank => input.includes(thank));
  }

  isInCarSearchContext(conversationHistory) {
    const relevantHistory = conversationHistory.slice(-4);
    return relevantHistory.some(message => 
      message.type === 'bot' && (
        message.text.includes('found') && message.text.includes('cars') ||
        message.text.includes('search') && message.text.includes('car') ||
        message.text.includes('show') && message.text.includes('car') ||
        message.text.includes('available cars') ||
        message.text.includes('marketplace')
      )
    );
  }

  isInReviewContext(conversationHistory) {
    const relevantHistory = conversationHistory.slice(-4);
    return relevantHistory.some(message => 
      message.type === 'bot' && (
        message.text.includes('review') ||
        message.text.includes('opinion') ||
        message.text.includes('rating')
      )
    );
  }

  // Get helpful car recommendations
  getCarRecommendations(conversationContext) {
    if (conversationContext.includes('family') || conversationContext.includes('safe') || 
        conversationContext.includes('reliable')) {
      return [
        { make: 'Toyota', model: 'RAV4', type: 'SUV', features: 'Safety, Reliability, Space' },
        { make: 'Honda', model: 'CR-V', type: 'SUV', features: 'Efficiency, Practicality' },
        { make: 'Subaru', model: 'Outback', type: 'SUV', features: 'All-wheel drive, Safety' }
      ];
    }
    
    if (conversationContext.includes('performance') || conversationContext.includes('sports') || 
        conversationContext.includes('fast') || conversationContext.includes('fun')) {
      return [
        { make: 'BMW', model: 'M4', type: 'Coupe', features: 'Speed, Precision handling' },
        { make: 'Porsche', model: '911', type: 'Sports Car', features: 'Performance, Heritage' },
        { make: 'Audi', model: 'RS5', type: 'Coupe', features: 'Power, All-wheel drive' }
      ];
    }
    
    if (conversationContext.includes('luxury') || conversationContext.includes('comfortable') || 
        conversationContext.includes('premium')) {
      return [
        { make: 'Mercedes-Benz', model: 'S-Class', type: 'Sedan', features: 'Ultimate luxury, Technology' },
        { make: 'BMW', model: '7 Series', type: 'Sedan', features: 'Comfort, Innovation' },
        { make: 'Lexus', model: 'LS', type: 'Sedan', features: 'Reliability, Quiet cabin' }
      ];
    }
    
    if (conversationContext.includes('electric') || conversationContext.includes('eco') || 
        conversationContext.includes('green') || conversationContext.includes('environment')) {
      return [
        { make: 'Tesla', model: 'Model 3', type: 'Sedan', features: 'Electric, Autopilot' },
        { make: 'BMW', model: 'iX', type: 'SUV', features: 'Electric luxury, Range' },
        { make: 'Audi', model: 'e-tron', type: 'SUV', features: 'Electric, Premium interior' }
      ];
    }
    
    // Default recommendations
    return [
      { make: 'Toyota', model: 'Camry', type: 'Sedan', features: 'Reliability, Efficiency' },
      { make: 'Honda', model: 'CR-V', type: 'SUV', features: 'Practicality, Value' },
      { make: 'BMW', model: '3 Series', type: 'Sedan', features: 'Performance, Luxury' }
    ];
  }

  // Utility methods
  async callWithRetry(apiCall, retries = this.apiRetryCount) {
    for (let i = 0; i < retries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }

  // Website feedback submission
  async submitWebsiteFeedback(feedbackData) {
    try {
      // Submit to your feedback API
      const result = await this.callWithRetry(async () => {
        const response = await http.post('/feedback/website', {
          category: feedbackData.category,
          rating: feedbackData.rating,
          comment: feedbackData.comment,
          email: feedbackData.email,
          conversationId: this.conversationId,
          source: 'chatbot',
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now()
        }, {
          timeout: this.apiTimeout
        });
        return response.data;
      });
      
      // Track feedback submission
      this.trackEvent('website_feedback_submitted', { 
        category: feedbackData.category,
        rating: feedbackData.rating, 
        hasComment: !!feedbackData.comment,
        hasEmail: !!feedbackData.email
      });
      
      return {
        success: true,
        message: "🙏 Thank you for your valuable feedback! We really appreciate you taking the time to help us improve our website."
      };
    } catch (error) {
      console.error('Error submitting website feedback:', error);
      this.trackEvent('website_feedback_error', { 
        category: feedbackData.category, 
        error: error.message 
      });
      
      return {
        success: false,
        message: "😔 Sorry, we couldn't submit your feedback right now. Please try contacting us on WhatsApp instead."
      };
    }
  }

  // Analytics tracking - Fixed ESLint Error
  trackEvent(eventName, properties = {}) {
    try {
      // Check if we're in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Chatbot Event:', eventName, properties);
      }
      
      // Check if Google Analytics is available (avoids ESLint error)
      if (typeof window !== 'undefined' && window.gtag && typeof window.gtag === 'function') {
        window.gtag('event', eventName, {
          event_category: 'chatbot',
          event_label: properties.label || '',
          value: properties.value || 0,
          ...properties
        });
      }
      
      // Alternative: Check for other analytics services
      if (typeof window !== 'undefined' && window.dataLayer && Array.isArray(window.dataLayer)) {
        window.dataLayer.push({
          event: eventName,
          event_category: 'chatbot',
          ...properties
        });
      }
      
      // You can also integrate with other analytics services here
      // Example: Mixpanel, Amplitude, etc.
      
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Conversation persistence
  saveConversation(messages) {
    try {
      localStorage.setItem(`chatbot_conversation_${this.conversationId}`, JSON.stringify({
        messages,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  loadConversation() {
    try {
      const saved = localStorage.getItem(`chatbot_conversation_${this.conversationId}`);
      if (saved) {
        const { messages, timestamp } = JSON.parse(saved);
        // Only load if conversation is less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return messages;
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
    return null;
  }
}

// Export singleton instance
const chatbotService = new ChatbotService();
export default chatbotService;