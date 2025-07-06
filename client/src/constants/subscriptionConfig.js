// client/src/constants/subscriptionConfig.js - Complete pricing for both seller types

// Keep existing tier names for compatibility
export const SUBSCRIPTION_TIERS = {
  BASIC: 'basic',
  STANDARD: 'standard', 
  PREMIUM: 'premium'
};

// Seller types (from your existing system)
export const SELLER_TYPES = {
  DEALERSHIP: 'dealership',
  PRIVATE: 'private'
};

// === PRIVATE/INDIVIDUAL SELLER PRICING ===
// Lower pricing for individual car sellers
export const PRIVATE_SELLER_PLANS = {
  [SUBSCRIPTION_TIERS.BASIC]: {
    id: 'basic',
    name: 'Individual Basic',
    price: 50, // Original pricing for private sellers
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'Perfect for selling 1-2 personal vehicles',
    features: {
      maxListings: 3, // Lower limits for private sellers
      maxPhotosPerListing: 8,
      dashboardAccess: true,
      socialMediaMarketing: 0,
      basicAnalytics: true,
      customerSupport: 'email',
      allowPhotography: true,
      allowReviews: false,
      allowPodcasts: false,
      allowVideos: false,
      featuredListings: 0,
      prioritySupport: false
    },
    popular: false,
    color: '#3b82f6',
    targetUsers: 'Individual car owners selling personal vehicles'
  },
  
  [SUBSCRIPTION_TIERS.STANDARD]: {
    id: 'standard', 
    name: 'Individual Plus',
    price: 100, // Original pricing
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'For individuals selling multiple vehicles',
    features: {
      maxListings: 5,
      maxPhotosPerListing: 12,
      dashboardAccess: true,
      socialMediaMarketing: 1,
      basicAnalytics: true,
      customerSupport: 'email',
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: false,
      allowVideos: false,
      featuredListings: 1,
      prioritySupport: false
    },
    popular: true,
    color: '#10b981',
    badge: 'Most Popular',
    targetUsers: 'Car enthusiasts, collectors, small-scale sellers'
  },
  
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    id: 'premium',
    name: 'Individual Pro',
    price: 200, // Original pricing  
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'Maximum features for serious individual sellers',
    features: {
      maxListings: 10,
      maxPhotosPerListing: 15,
      dashboardAccess: true,
      socialMediaMarketing: 2,
      basicAnalytics: true,
      advancedAnalytics: true,
      customerSupport: 'phone',
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: true,
      allowVideos: true,
      featuredListings: 2,
      prioritySupport: true
    },
    popular: false,
    color: '#8b5cf6',
    badge: 'Full Features',
    targetUsers: 'Professional individual sellers, car flippers'
  }
};

// === DEALERSHIP PRICING (Your new pricing) ===
// Higher pricing for business dealerships
export const DEALERSHIP_PLANS = {
  [SUBSCRIPTION_TIERS.BASIC]: {
    id: 'basic',
    name: 'Dealership Starter',
    price: 1000, // Your new pricing
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'Perfect for small dealerships getting started',
    features: {
      maxListings: 15, // Your specifications
      maxPhotosPerListing: 10,
      dashboardAccess: true,
      socialMediaMarketing: 1,
      basicAnalytics: true,
      customerSupport: 'email',
      allowPhotography: true,
      allowReviews: false,
      allowPodcasts: false,
      allowVideos: false,
      featuredListings: 0,
      prioritySupport: false,
      customBranding: false,
      advancedAnalytics: false,
      leadManagement: false
    },
    popular: false,
    color: '#3b82f6',
    targetUsers: 'Small car dealerships, startup dealers'
  },
  
  [SUBSCRIPTION_TIERS.STANDARD]: {
    id: 'standard',
    name: 'Dealership Professional', 
    price: 2500, // Your new pricing
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'Ideal for growing dealerships with more inventory',
    features: {
      maxListings: 35, // Your specifications
      maxPhotosPerListing: 15,
      dashboardAccess: true,
      socialMediaMarketing: 3,
      basicAnalytics: true,
      advancedAnalytics: true,
      customerSupport: 'phone',
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: true,
      allowVideos: false,
      featuredListings: 5,
      prioritySupport: true,
      customBranding: true,
      leadManagement: true,
      carReviews: false
    },
    popular: true,
    color: '#10b981',
    badge: 'Most Popular',
    targetUsers: 'Established dealerships, growing businesses'
  },
  
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    id: 'premium',
    name: 'Dealership Enterprise',
    price: 6000, // Your new pricing
    currency: 'BWP', 
    billingCycle: 'monthly',
    description: 'Complete solution - includes ALL add-ons (P3,700 value)',
    features: {
      maxListings: 100, // Your maximum
      maxPhotosPerListing: 20,
      dashboardAccess: true,
      socialMediaMarketing: 'unlimited',
      basicAnalytics: true,
      advancedAnalytics: true,
      premiumAnalytics: true,
      customerSupport: 'priority',
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: true,
      allowVideos: true,
      featuredListings: 15,
      prioritySupport: true,
      customBranding: true,
      leadManagement: true,
      carReviews: true, // P1600 add-on included
      photographyService: true, // P1500 add-on included
      listingManagement: true, // P600 add-on included
      apiAccess: true,
      whiteLabel: true,
      includedAddons: ['photography_management', 'listing_management', 'car_reviews']
    },
    popular: false,
    color: '#8b5cf6',
    badge: 'All Inclusive',
    savings: 3700,
    targetUsers: 'Large dealerships, automotive groups'
  }
};

// Updated TIER_LIMITS and TIER_PRICES for backward compatibility
// These will be used based on seller type
export const TIER_LIMITS = {
  // Private seller limits (original)
  private: {
    [SUBSCRIPTION_TIERS.BASIC]: {
      maxListings: 3,
      allowPhotography: true,
      allowReviews: false,
      allowPodcasts: false,
      allowVideos: false,
      price: 50
    },
    [SUBSCRIPTION_TIERS.STANDARD]: {
      maxListings: 5,
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: false,
      allowVideos: false,
      price: 100
    },
    [SUBSCRIPTION_TIERS.PREMIUM]: {
      maxListings: 10,
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: true,
      allowVideos: true,
      price: 200
    }
  },
  
  // Dealership limits (your new pricing)
  dealership: {
    [SUBSCRIPTION_TIERS.BASIC]: {
      maxListings: 15,
      allowPhotography: true,
      allowReviews: false,
      allowPodcasts: false,
      allowVideos: false,
      price: 1000
    },
    [SUBSCRIPTION_TIERS.STANDARD]: {
      maxListings: 35,
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: true,
      allowVideos: false,
      price: 2500
    },
    [SUBSCRIPTION_TIERS.PREMIUM]: {
      maxListings: 100,
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: true,
      allowVideos: true,
      price: 6000
    }
  }
};

// Updated TIER_PRICES with seller type support
export const TIER_PRICES = {
  private: {
    [SUBSCRIPTION_TIERS.BASIC]: 50,
    [SUBSCRIPTION_TIERS.STANDARD]: 100,
    [SUBSCRIPTION_TIERS.PREMIUM]: 200
  },
  dealership: {
    [SUBSCRIPTION_TIERS.BASIC]: 1000,
    [SUBSCRIPTION_TIERS.STANDARD]: 2500,
    [SUBSCRIPTION_TIERS.PREMIUM]: 6000
  }
};

// Add-ons (primarily for dealerships)
export const ADDON_SERVICES = {
  PHOTOGRAPHY_PLUS_MANAGEMENT: {
    id: 'photography_management',
    name: 'Photography + Listing Management',
    price: 1500,
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'Professional photography and full listing management service',
    features: [
      'Professional vehicle photography',
      'Photo editing and enhancement', 
      'Complete listing creation and management',
      'SEO optimization for listings',
      'Regular listing updates'
    ],
    availableFor: ['dealership'], // Only for dealerships
    includedInPremium: true
  },
  
  LISTING_MANAGEMENT: {
    id: 'listing_management',
    name: 'Listing Management Service',
    price: 600,
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'Professional listing management and optimization',
    features: [
      'Complete listing creation',
      'SEO optimization',
      'Regular updates and maintenance',
      'Performance monitoring',
      'Keyword optimization'
    ],
    availableFor: ['dealership'], // Only for dealerships
    includedInPremium: true
  },
  
  CAR_REVIEWS: {
    id: 'car_reviews',
    name: 'Car Reviews Coverage',
    price: 1600,
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'Professional video reviews for up to 6 selected vehicles per month',
    features: [
      'Professional video reviews',
      'Up to 6 vehicles per month',
      'Expert automotive reviewers',
      'Social media distribution',
      'SEO optimized content'
    ],
    requiredPlan: [SUBSCRIPTION_TIERS.STANDARD, SUBSCRIPTION_TIERS.PREMIUM],
    availableFor: ['dealership'],
    includedInPremium: true
  },
  
  SPONSORED_LISTINGS: {
    id: 'sponsored_listings',
    name: 'Sponsored Listings',
    price: 250,
    currency: 'BWP',
    billingCycle: 'per_listing',
    description: 'Boost visibility with sponsored listing placement',
    features: [
      'Priority search placement',
      'Featured on homepage',
      'Social media promotion', 
      'Enhanced visibility metrics',
      'Premium badge display'
    ],
    availableFor: ['dealership', 'private'], // Available for both
    unitBased: true,
    enterpriseNote: 'Enterprise plan users get automatic featured listings instead'
  }
};

// Other role types (unchanged)
export const PROVIDER_PLANS = {
  BASIC: {
    id: 'provider_basic',
    name: 'Service Provider Basic',
    price: 500,
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'For individual service providers',
    features: {
      maxServiceListings: 5,
      basicDashboard: true,
      customerSupport: 'email',
      serviceBookings: true,
      basicAnalytics: true
    }
  },
  
  PROFESSIONAL: {
    id: 'provider_professional',
    name: 'Service Provider Pro',
    price: 1200,
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'For professional service businesses',
    features: {
      maxServiceListings: 15,
      advancedDashboard: true,
      customerSupport: 'phone',
      serviceBookings: true,
      advancedAnalytics: true,
      onlinePayments: true,
      customBranding: true
    }
  }
};

export const TRANSPORT_PLANS = {
  COMPANY_DASHBOARD: {
    id: 'transport_company',
    name: 'Public Transport Company',
    price: 1000,
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'For transport companies like NKK Express, taxi/combi operators',
    features: {
      dashboardAccess: true,
      routeListings: 'unlimited',
      fleetManagement: true,
      scheduleManagement: true,
      bookingSystem: true,
      passengerAnalytics: true,
      routeOptimization: true,
      driverManagement: true,
      vehicleTracking: true,
      customerSupport: 'phone',
      reportGeneration: true,
      multiLocationSupport: true
    },
    note: 'Route listings are completely free - pay only for dashboard access',
    color: '#f59e0b',
    targetUsers: ['NKK Express', 'Taxi Companies', 'Combi Operators', 'Bus Companies']
  }
};

export const FREE_ACCESS_ROLES = {
  DRIVER: {
    role: 'driver',
    name: 'Driver',
    features: [
      'Queue status monitoring',
      'Route information access',
      'Basic earnings tracking',
      'Trip history',
      'Rating system access'
    ],
    note: 'Completely free for all registered drivers'
  },
  
  COORDINATOR: {
    role: 'coordinator',
    name: 'Transport Coordinator', 
    features: [
      'Station queue management',
      'Route coordination tools',
      'Driver assignment',
      'Real-time monitoring',
      'Performance analytics'
    ],
    note: 'Free access for verified coordinators'
  },
  
  COMMUTER: {
    role: 'user',
    name: 'Regular Commuter',
    features: [
      'Route search and planning',
      'Real-time transport updates',
      'Fare information',
      'Service ratings and reviews',
      'Transport notifications'
    ],
    note: 'Always free for all users'
  }
};

export const GOVERNMENT_PLANS = {
  MINISTRY_OVERSIGHT: {
    id: 'ministry_oversight',
    name: 'Ministry/Government Oversight',
    price: 'CONTACT_FOR_PRICING',
    currency: 'BWP',
    billingCycle: 'annual',
    description: 'Custom pricing for government oversight and compliance monitoring',
    features: {
      fullSystemAccess: true,
      complianceMonitoring: true,
      transportDataAnalytics: true,
      policyImplementation: true,
      licensingIntegration: true,
      safetyOversight: true,
      customReports: true,
      apiAccess: true,
      whiteLabel: true,
      dedicatedSupport: true
    },
    private: true,
    note: 'Pricing discussed privately with government entities',
    color: '#dc2626'
  }
};

// Utility functions
export const formatPrice = (price, currency = 'BWP') => {
  if (price === 'CONTACT_FOR_PRICING') return 'Contact for Pricing';
  
  return new Intl.NumberFormat('en-BW', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

export const getPlansForSellerType = (sellerType) => {
  switch (sellerType) {
    case SELLER_TYPES.PRIVATE:
      return PRIVATE_SELLER_PLANS;
    case SELLER_TYPES.DEALERSHIP:
      return DEALERSHIP_PLANS;
    default:
      return PRIVATE_SELLER_PLANS; // Default to private seller
  }
};

export const getTierLimitsForSellerType = (sellerType) => {
  return TIER_LIMITS[sellerType] || TIER_LIMITS.private;
};

export const getTierPricesForSellerType = (sellerType) => {
  return TIER_PRICES[sellerType] || TIER_PRICES.private;
};

export const getAvailableAddons = (sellerType, planId) => {
  return Object.values(ADDON_SERVICES).filter(addon => {
    // Check if addon is available for this seller type
    if (addon.availableFor && !addon.availableFor.includes(sellerType)) {
      return false;
    }
    
    // Premium dealership plan has all add-ons included except sponsored listings
    if (sellerType === 'dealership' && planId === 'premium') {
      return addon.id === 'sponsored_listings';
    }
    
    // Check plan requirements
    if (addon.requiredPlan && !addon.requiredPlan.includes(planId)) {
      return false;
    }
    
    return true;
  });
};

export const calculateTotal = (sellerType, planId, addons = []) => {
  const plans = getPlansForSellerType(sellerType);
  const plan = plans[planId];
  
  if (!plan || plan.price === 'CONTACT_FOR_PRICING') {
    return 'CONTACT_FOR_PRICING';
  }
  
  let total = plan.price;
  
  addons.forEach(addonId => {
    const addon = ADDON_SERVICES[addonId];
    if (addon) {
      // Don't add cost for add-ons included in premium dealership plan
      if (sellerType === 'dealership' && planId === 'premium' && addon.includedInPremium) {
        return;
      }
      total += addon.price;
    }
  });
  
  return total;
};

// Summary for easy reference
export const PLAN_SUMMARY = {
  private_seller: {
    basic: 'P50/month - 3 listings, 8 photos, basic features',
    standard: 'P100/month - 5 listings, 12 photos, reviews',
    premium: 'P200/month - 10 listings, 15 photos, full features'
  },
  dealership: {
    basic: 'P1,000/month - 15 listings, 10 photos, basic features',
    standard: 'P2,500/month - 35 listings, 15 photos, 3x marketing',
    premium: 'P6,000/month - 100 listings, ALL add-ons included (P3,700 value)'
  },
  transport: {
    company: 'P1,000/month - Dashboard access, unlimited free route listings'
  },
  provider: {
    basic: 'P500/month - 5 services, basic features',
    professional: 'P1,200/month - 15 services, advanced features'
  },
  addons: {
    photography_management: 'P1,500/month - Pro photos + listing management (dealerships only)',
    listing_management: 'P600/month - Professional listing management (dealerships only)',
    car_reviews: 'P1,600/month - Video reviews (dealerships only)',
    sponsored_listings: 'P250/listing - Priority placement (both types)'
  },
  free: {
    drivers: 'Free - Queue monitoring, earnings tracking',
    coordinators: 'Free - Station management, route coordination', 
    commuters: 'Free - Route search, real-time updates'
  },
  government: {
    ministry: 'Custom pricing - Full oversight and compliance tools'
  }
};

// Backward compatibility exports
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled'
};

export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  BANK_TRANSFER: 'bank_transfer',
  MOBILE_MONEY: 'mobile_money',
  PAYGATE: 'paygate'
};

export const DEALER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive'
};

export const BUSINESS_TYPES = {
  INDEPENDENT: 'independent',
  FRANCHISE: 'franchise',
  CERTIFIED: 'certified'
};

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};
