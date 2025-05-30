// src/constants/dealerConstants.js

// Define subscription tiers constants
export const SUBSCRIPTION_TIERS = {
    BASIC: 'basic',
    STANDARD: 'standard',
    PREMIUM: 'premium'
  };
  
  // Define tier limits and features
  export const TIER_LIMITS = {
    [SUBSCRIPTION_TIERS.BASIC]: {
      maxListings: 10,
      allowPhotography: true,
      allowReviews: false,
      allowPodcasts: false,
      allowVideos: false
    },
    [SUBSCRIPTION_TIERS.STANDARD]: {
      maxListings: 20,
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: true,
      allowVideos: false
    },
    [SUBSCRIPTION_TIERS.PREMIUM]: {
      maxListings: 40,
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: true,
      allowVideos: true
    }
  };
  
  // Define subscription tier prices
  export const TIER_PRICES = {
    [SUBSCRIPTION_TIERS.BASIC]: 49.99,
    [SUBSCRIPTION_TIERS.STANDARD]: 99.99,
    [SUBSCRIPTION_TIERS.PREMIUM]: 199.99
  };
  
  // Subscription status options
  export const SUBSCRIPTION_STATUS = {
    ACTIVE: 'active',
    PENDING: 'pending',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
  };
  
  // Payment methods
  export const PAYMENT_METHODS = {
    CREDIT_CARD: 'credit_card',
    BANK_TRANSFER: 'bank_transfer',
    PAYPAL: 'paypal',
    OTHER: 'other'
  };
  
  // Dealer status options
  export const DEALER_STATUS = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    INACTIVE: 'inactive'
  };
  
  // Dealer business types
  export const BUSINESS_TYPES = {
    INDEPENDENT: 'independent',
    FRANCHISE: 'franchise',
    CERTIFIED: 'certified'
  };
  
  // Verification status options
  export const VERIFICATION_STATUS = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
  };