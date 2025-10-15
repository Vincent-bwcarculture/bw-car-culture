// client/src/constants/subscriptionConfig.js - COMPLETE VERSION WITH UPDATED P100 ONE-TIME PRICING

export const SUBSCRIPTION_TIERS = {
  BASIC: 'basic',
  STANDARD: 'standard', 
  PREMIUM: 'premium'
};

export const SELLER_TYPES = {
  DEALERSHIP: 'dealership',
  PRIVATE: 'private',
  RENTAL: 'rental'
};

// === PRIVATE/INDIVIDUAL SELLER PRICING ===
// UPDATED: Single P100 one-time payment model
// Each subscription = 1 car listing, can subscribe multiple times
export const PRIVATE_SELLER_PLANS = {
  [SUBSCRIPTION_TIERS.STANDARD]: {
    id: 'standard', 
    name: 'Complete Package',
    price: 100,
    currency: 'BWP',
    billingCycle: 'one-time', // UPDATED: Changed from 'monthly' to 'one-time'
    description: 'One price. Complete coverage. Maximum exposure.',
    features: {
      maxListings: 1,
      maxPhotosPerListing: 15,
      dashboardAccess: true,
      socialMediaMarketing: 'unlimited', // UPDATED: Instagram, Facebook & WhatsApp
      basicAnalytics: true,
      customerSupport: 'email',
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: false,
      allowVideos: false,
      featuredListings: 1,
      prioritySupport: true,
      listingDuration: 'until_sold', // UPDATED: List until sold
      searchPlacement: 'premium',
      buyerMatching: true,
      websiteListing: true,
      instagramPromotion: true,
      facebookPromotion: true,
      whatsappPromotion: true,
      professionalSupport: true,
      allowAddons: true
    },
    popular: true,
    color: '#10b981',
    badge: 'Best Value',
    targetUsers: 'Individual car owners selling personal vehicles',
    subscriptionModel: 'per_car',
    allowMultiple: true,
    availableAddons: ['photography_management_private', 'sponsored_listing_private', 'car_review_private']
  }
};

// === DEALERSHIP PRICING ===
export const DEALERSHIP_PLANS = {
  [SUBSCRIPTION_TIERS.BASIC]: {
    id: 'basic',
    name: 'Dealership Basic',
    price: 1000,
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'Start selling with essential business features',
    features: {
      maxListings: 15,
      maxPhotosPerListing: 10,
      dashboardAccess: true,
      socialMediaMarketing: 1,
      basicAnalytics: true,
      customerSupport: 'email',
      allowPhotography: true,
      allowReviews: false,
      allowPodcasts: false,
      allowVideos: false,
      featuredListings: 2,
      prioritySupport: false,
      businessProfile: true,
      leadManagement: 'basic',
      allowAddons: true
    },
    popular: false,
    color: '#f59e0b',
    targetUsers: 'Small dealerships and car lots',
    subscriptionModel: 'bulk_listings',
    allowMultiple: false,
    availableAddons: ['photography_management', 'listing_management', 'car_reviews', 'sponsored_listings']
  },
  
  [SUBSCRIPTION_TIERS.STANDARD]: {
    id: 'standard',
    name: 'Dealership Professional',
    price: 2500,
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'Advanced features for growing businesses',
    features: {
      maxListings: 35,
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
      businessProfile: true,
      leadManagement: 'advanced',
      customBranding: true,
      allowAddons: true
    },
    popular: true,
    color: '#10b981',
    badge: 'Most Popular',
    targetUsers: 'Established dealerships',
    subscriptionModel: 'bulk_listings',
    allowMultiple: false,
    availableAddons: ['photography_management', 'listing_management', 'car_reviews', 'sponsored_listings']
  },
  
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    id: 'premium',
    name: 'Dealership Enterprise',
    price: 6000,
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'Complete solution with all add-ons included',
    features: {
      maxListings: 100,
      maxPhotosPerListing: 'unlimited',
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
      businessProfile: true,
      leadManagement: 'enterprise',
      customBranding: true,
      carReviews: true,
      photographyService: true,
      listingManagement: true,
      apiAccess: true,
      whiteLabel: true,
      includedAddons: ['photography_management', 'listing_management', 'car_reviews'],
      allowAddons: false // All add-ons included
    },
    popular: false,
    color: '#8b5cf6',
    badge: 'All Inclusive',
    savings: 3700,
    targetUsers: 'Large dealerships, automotive groups',
    subscriptionModel: 'bulk_listings',
    allowMultiple: false
  }
};

// === RENTAL SERVICE PROVIDER PRICING ===
export const RENTAL_PROVIDER_PLANS = {
  [SUBSCRIPTION_TIERS.BASIC]: {
    id: 'basic',
    name: 'Rental Basic',
    price: 350,
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'Perfect for small rental operations',
    features: {
      maxListings: 5,
      maxPhotosPerListing: 10,
      dashboardAccess: true,
      socialMediaMarketing: 1,
      basicAnalytics: true,
      customerSupport: 'email',
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: false,
      allowVideos: false,
      featuredListings: 1,
      prioritySupport: false,
      rentalCalendar: true,
      bookingManagement: 'basic',
      availabilityTracking: true,
      rentalRates: true,
      allowAddons: true
    },
    popular: true,
    color: '#06b6d4',
    badge: 'Most Popular',
    targetUsers: 'Small car rental businesses',
    subscriptionModel: 'rental_fleet',
    allowMultiple: false,
    availableAddons: ['photography_management', 'sponsored_listings']
  },
  
  [SUBSCRIPTION_TIERS.STANDARD]: {
    id: 'standard',
    name: 'Rental Professional',
    price: 600,
    currency: 'BWP',
    billingCycle: 'monthly',
    description: 'Advanced features for established rental businesses',
    features: {
      maxListings: 10,
      maxPhotosPerListing: 15,
      dashboardAccess: true,
      socialMediaMarketing: 3,
      basicAnalytics: true,
      advancedAnalytics: true,
      customerSupport: 'phone',
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: true,
      allowVideos: true,
      featuredListings: 3,
      prioritySupport: true,
      rentalCalendar: true,
      bookingManagement: 'advanced',
      availabilityTracking: true,
      rentalRates: true,
      multiLocationSupport: true,
      customerDatabase: true,
      reportingTools: true,
      allowAddons: true
    },
    popular: false,
    color: '#0891b2',
    targetUsers: 'Established rental companies',
    subscriptionModel: 'rental_fleet',
    allowMultiple: false,
    availableAddons: ['photography_management', 'car_reviews', 'sponsored_listings']
  }
};

// === ADD-ONS FOR PRIVATE SELLERS (One-time payments) ===
export const PRIVATE_SELLER_ADDONS = {
  PHOTOGRAPHY_MANAGEMENT_PRIVATE: {
    id: 'photography_management_private',
    name: 'Photography + Listing Management',
    price: 800,
    currency: 'BWP',
    billingCycle: 'one_time',
    description: 'Professional photography and listing optimization for your vehicle',
    features: [
      'Professional vehicle photography session',
      'Photo editing and enhancement',
      'Listing optimization and copywriting',
      'SEO-optimized description',
      'Multiple angle shots (interior, exterior, engine)',
      'Trip expenses charged separately'
    ],
    availableFor: ['private'],
    paymentType: 'one_time_per_vehicle',
    requiresBooking: true,
    whatsappBooking: true,
    bookingNote: 'Contact us via WhatsApp to schedule your photography session'
  },
  
  SPONSORED_LISTING_PRIVATE: {
    id: 'sponsored_listing_private',
    name: 'Sponsored/Featured Listing',
    price: 250,
    currency: 'BWP',
    billingCycle: 'one_time',
    description: 'Boost your listing visibility with sponsored placement',
    features: [
      'Priority search placement for 30 days',
      'Featured on homepage',
      'Enhanced social media promotion',
      'Premium badge display',
      'Priority in category searches',
      'Email marketing inclusion'
    ],
    availableFor: ['private'],
    paymentType: 'one_time_per_vehicle',
    requiresBooking: false,
    activationTime: 'immediate'
  },
  
  CAR_REVIEW_PRIVATE: {
    id: 'car_review_private',
    name: 'Professional Car Review',
    price: 550,
    currency: 'BWP',
    billingCycle: 'one_time',
    description: 'Professional video review of your vehicle',
    features: [
      'Professional video review (5-10 minutes)',
      'Expert automotive reviewer',
      'Interior and exterior showcase',
      'Performance highlights',
      'Social media distribution',
      'YouTube channel feature',
      'Trip expenses charged separately'
    ],
    availableFor: ['private'],
    paymentType: 'one_time_per_vehicle',
    requiresBooking: true,
    whatsappBooking: true,
    bookingNote: 'Contact us via WhatsApp to schedule your car review session'
  }
};

// === DEALERSHIP ADD-ONS (Monthly payments) ===
export const DEALERSHIP_ADDONS = {
  PHOTOGRAPHY_MANAGEMENT: {
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
      'Regular listing updates',
      'Up to 10 vehicles per month'
    ],
    availableFor: ['dealership'],
    includedInPremium: true,
    requiresBooking: true
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
    availableFor: ['dealership'],
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
    availableFor: ['dealership', 'rental'],
    unitBased: true
  }
};

// === COMBINED ADD-ONS OBJECT ===
export const ADDON_SERVICES = {
  ...PRIVATE_SELLER_ADDONS,
  ...DEALERSHIP_ADDONS
};

// === WHATSAPP CONTACT INFO ===
export const WHATSAPP_BOOKING = {
  phoneNumber: '+26774122453', // Your actual WhatsApp business number
  defaultMessage: 'Hi! I would like to book a service for my car listing.',
  photographyMessage: 'Hi! I would like to book a photography session for my car listing.',
  reviewMessage: 'Hi! I would like to book a professional car review session.'
};

// UPDATED: Tier limits for private sellers
export const TIER_LIMITS = {
  private: {
    [SUBSCRIPTION_TIERS.STANDARD]: {
      maxListings: 1,
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: false,
      allowVideos: false,
      price: 100,
      canSubscribeMultiple: true,
      allowAddons: true
    }
  },
  
  dealership: {
    [SUBSCRIPTION_TIERS.BASIC]: {
      maxListings: 15,
      allowPhotography: true,
      allowReviews: false,
      allowPodcasts: false,
      allowVideos: false,
      price: 1000,
      canSubscribeMultiple: false,
      allowAddons: true
    },
    [SUBSCRIPTION_TIERS.STANDARD]: {
      maxListings: 35,
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: true,
      allowVideos: false,
      price: 2500,
      canSubscribeMultiple: false,
      allowAddons: true
    },
    [SUBSCRIPTION_TIERS.PREMIUM]: {
      maxListings: 100,
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: true,
      allowVideos: true,
      price: 6000,
      canSubscribeMultiple: false,
      allowAddons: false // All included
    }
  },
  
  rental: {
    [SUBSCRIPTION_TIERS.BASIC]: {
      maxListings: 5,
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: false,
      allowVideos: false,
      price: 350,
      canSubscribeMultiple: false,
      allowAddons: true
    },
    [SUBSCRIPTION_TIERS.STANDARD]: {
      maxListings: 10,
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: true,
      allowVideos: true,
      price: 600,
      canSubscribeMultiple: false,
      allowAddons: true
    }
  }
};

// UPDATED: Tier prices
export const TIER_PRICES = {
  private: {
    [SUBSCRIPTION_TIERS.STANDARD]: 100
  },
  dealership: {
    [SUBSCRIPTION_TIERS.BASIC]: 1000,
    [SUBSCRIPTION_TIERS.STANDARD]: 2500,
    [SUBSCRIPTION_TIERS.PREMIUM]: 6000
  },
  rental: {
    [SUBSCRIPTION_TIERS.BASIC]: 350,
    [SUBSCRIPTION_TIERS.STANDARD]: 600
  }
};

// UPDATED: Plan summary
export const PLAN_SUMMARY = {
  private_seller: {
    standard: 'P100 one-time - Complete package: Website listing, Instagram, Facebook & WhatsApp promotion (until sold)',
    note: 'Pay once, list until sold. Subscribe again for additional cars.',
    addons: 'Available: Photography + Management (P800), Sponsored Listing (P250), Car Review (P550)'
  },
  dealership: {
    basic: 'P1,000/month - 15 listings, 10 photos, basic features',
    standard: 'P2,500/month - 35 listings, 15 photos, 3x marketing',
    premium: 'P6,000/month - 100 listings, ALL add-ons included (P3,700 value)'
  },
  rental_provider: {
    basic: 'P350/month - 5 rental cars, booking calendar, basic features',
    standard: 'P600/month - 10 rental cars, advanced booking, multi-location support'
  }
};

// Helper functions
export const formatPrice = (price, currency = 'BWP') => {
  if (price === 'CONTACT_FOR_PRICING') return 'Contact for pricing';
  return `P${price.toLocaleString()}`;
};

export const getPlansBySellerType = (sellerType) => {
  switch(sellerType) {
    case 'private': return PRIVATE_SELLER_PLANS;
    case 'dealership': return DEALERSHIP_PLANS;
    case 'rental': return RENTAL_PROVIDER_PLANS;
    default: return PRIVATE_SELLER_PLANS;
  }
};

export const getAvailableAddons = (sellerType, planId) => {
  return Object.values(ADDON_SERVICES).filter(addon => 
    addon.availableFor.includes(sellerType)
  );
};

export const calculateTotal = (sellerType, planId, addons = []) => {
  const plans = getPlansBySellerType(sellerType);
  const plan = plans[planId];
  
  if (!plan || plan.price === 'CONTACT_FOR_PRICING') {
    return 'CONTACT_FOR_PRICING';
  }
  
  let total = plan.price;
  
  addons.forEach(addonId => {
    const addon = ADDON_SERVICES[addonId];
    if (addon) {
      if (sellerType === 'dealership' && planId === 'premium' && addon.includedInPremium) {
        return; // Skip adding cost for included add-ons
      }
      total += addon.price;
    }
  });
  
  return total;
};

// WhatsApp helper function
export const generateWhatsAppLink = (serviceType = 'general') => {
  const messages = {
    general: WHATSAPP_BOOKING.defaultMessage,
    photography: WHATSAPP_BOOKING.photographyMessage,
    review: WHATSAPP_BOOKING.reviewMessage
  };
  
  const message = encodeURIComponent(messages[serviceType] || messages.general);
  return `https://wa.me/${WHATSAPP_BOOKING.phoneNumber.replace('+', '')}?text=${message}`;
};

// Subscription model info
export const getSubscriptionModel = (sellerType) => {
  return {
    private: {
      model: 'per_car',
      description: 'P100 one-time payment per car. List until sold. Subscribe multiple times for additional cars.',
      allowMultiple: true,
      maxPerSubscription: 1,
      addonsAvailable: true,
      addonPaymentType: 'one_time',
      billingCycle: 'one-time'
    },
    dealership: {
      model: 'bulk_listings',
      description: 'One subscription covers multiple car listings based on your plan.',
      allowMultiple: false,
      maxPerSubscription: 'varies_by_plan',
      addonsAvailable: true,
      addonPaymentType: 'monthly',
      billingCycle: 'monthly'
    },
    rental: {
      model: 'rental_fleet',
      description: 'Manage your rental car fleet with booking calendar and availability tracking.',
      allowMultiple: false,
      maxPerSubscription: 'varies_by_plan',
      addonsAvailable: true,
      addonPaymentType: 'monthly',
      billingCycle: 'monthly'
    }
  }[sellerType];
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