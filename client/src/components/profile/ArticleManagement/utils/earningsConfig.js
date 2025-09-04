// client/src/components/profile/ArticleManagement/utils/earningsConfig.js
// Enhanced earnings configuration with P100 minimum and engagement requirements

export const earningsConfig = {
  ratePerView: 0.01,        // P0.01 per view (P100 for 10,000 views)
  minimumPayout: 100,       // P100 minimum (was P50)
  
  // Engagement requirements for cashout eligibility
  minimumEngagementForCashout: 20000,  // 20,000 engagement required for P100
  engagementToEarningsRatio: 200,      // 200 engagement per P1 earned (20,000 for P100)
  
  bonusThresholds: {
    1000: 5,     // P5 bonus for 1k+ views
    5000: 25,    // P25 bonus for 5k+ views  
    10000: 75,   // P75 bonus for 10k+ views
    25000: 200,  // P200 bonus for 25k+ views
    50000: 500   // P500 bonus for 50k+ views
  },
  
  // Engagement bonuses (additional to view-based earnings)
  engagementBonuses: {
    500: 2,      // P2 bonus for 500+ engagement
    1000: 5,     // P5 bonus for 1k+ engagement
    2500: 15,    // P15 bonus for 2.5k+ engagement  
    5000: 35,    // P35 bonus for 5k+ engagement
    10000: 80,   // P80 bonus for 10k+ engagement
    20000: 200   // P200 bonus for 20k+ engagement
  },
  
  premiumMultiplier: 1.5,   // 50% more for premium content
  weekendBonus: 1.2,        // 20% weekend bonus
  
  // Engagement weights for different interaction types
  engagementWeights: {
    view: 1,           // 1 point per view
    like: 3,           // 3 points per like
    comment: 5,        // 5 points per comment  
    share: 8,          // 8 points per share
    bookmark: 4,       // 4 points per bookmark
    readTime: 0.1      // 0.1 point per second of read time
  }
};

export default earningsConfig;
