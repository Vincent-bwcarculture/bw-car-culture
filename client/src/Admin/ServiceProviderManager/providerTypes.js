// src/components/admin/ServiceProviderManager/providerTypes.js

export const PROVIDER_TYPES = {
    CAR_RENTAL: 'car_rental',
    TRAILER_RENTAL: 'trailer_rental',
    PUBLIC_TRANSPORT: 'public_transport',
    WORKSHOP: 'workshop'
    // Removed DEALERSHIP - handled separately
  };
  
  export const SUBSCRIPTION_TIERS = {
    BASIC: 'basic',
    STANDARD: 'standard',
    PREMIUM: 'premium'
  };
  
  export const TIER_LIMITS = {
    [SUBSCRIPTION_TIERS.BASIC]: {
      maxListings: 10,
      allowPhotography: true,
      allowReviews: false,
      allowPodcasts: false,
      allowVideos: false,
      price: 500 // Monthly price in Pula
    },
    [SUBSCRIPTION_TIERS.STANDARD]: {
      maxListings: 20,
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: true,
      allowVideos: false,
      price: 1000 // Monthly price in Pula
    },
    [SUBSCRIPTION_TIERS.PREMIUM]: {
      maxListings: 40,
      allowPhotography: true,
      allowReviews: true,
      allowPodcasts: true,
      allowVideos: true,
      price: 2000 // Monthly price in Pula
    }
  };
  
  export const getProviderTypeName = (type) => {
    switch (type) {
      case PROVIDER_TYPES.CAR_RENTAL:
        return 'Car Rental';
      case PROVIDER_TYPES.TRAILER_RENTAL:
        return 'Trailer Rental';
      case PROVIDER_TYPES.PUBLIC_TRANSPORT:
        return 'Transport Service';
      case PROVIDER_TYPES.WORKSHOP:
        return 'Workshop';
      default:
        return 'Provider';
    }
  };
  
  export const getProviderTypeIcon = (type) => {
    switch (type) {
      case PROVIDER_TYPES.CAR_RENTAL:
        return '🚗';
      case PROVIDER_TYPES.TRAILER_RENTAL:
        return '🚚';
      case PROVIDER_TYPES.PUBLIC_TRANSPORT:
        return '🚌';
      case PROVIDER_TYPES.WORKSHOP:
        return '🔧';
      default:
        return '🏢';
    }
  };
  
  export const getProviderTypeRoutes = (type) => {
    switch (type) {
      case PROVIDER_TYPES.CAR_RENTAL:
        return {
          list: '/admin/rentals',
          add: '/admin/rentals/add',
          public: '/rentals'
        };
      case PROVIDER_TYPES.TRAILER_RENTAL:
        return {
          list: '/admin/trailers',
          add: '/admin/trailers/add',
          public: '/trailers'
        };
      case PROVIDER_TYPES.PUBLIC_TRANSPORT:
        return {
          list: '/admin/transport',
          add: '/admin/transport/add',
          public: '/transport'
        };
      case PROVIDER_TYPES.WORKSHOP:
        return {
          list: '/workshops',
          add: null, // Workshops don't have listings
          public: '/workshops'
        };
      default:
        return {
          list: '/',
          add: '/',
          public: '/'
        };
    }
  };
  
  export const BUSINESS_TYPES = {
    INDEPENDENT: 'independent',
    FRANCHISE: 'franchise',
    CERTIFIED: 'certified',
    AUTHORIZED: 'authorized',
    GOVERNMENT: 'government'
  };
  
  export const getBusinessTypeName = (type, providerType) => {
    if (type === BUSINESS_TYPES.INDEPENDENT && providerType === PROVIDER_TYPES.WORKSHOP) {
      return 'Independent Workshop';
    } else if (type === BUSINESS_TYPES.AUTHORIZED && providerType === PROVIDER_TYPES.WORKSHOP) {
      return 'Authorized Workshop';
    } else if (type === BUSINESS_TYPES.GOVERNMENT && providerType === PROVIDER_TYPES.PUBLIC_TRANSPORT) {
      return 'Government Transport';
    } else {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };