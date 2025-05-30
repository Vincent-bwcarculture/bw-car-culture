// src/constants/listingConstants.js

export const LISTING_STATUS = {
    DRAFT: 'draft',
    PENDING: 'pending',
    ACTIVE: 'active',
    SOLD: 'sold',
    ARCHIVED: 'archived'
  };
  
  export const LISTING_STATUS_LABELS = {
    [LISTING_STATUS.DRAFT]: 'Draft',
    [LISTING_STATUS.PENDING]: 'Pending Review',
    [LISTING_STATUS.ACTIVE]: 'Active',
    [LISTING_STATUS.SOLD]: 'Sold',
    [LISTING_STATUS.ARCHIVED]: 'Archived'
  };
  
  export const SORT_OPTIONS = {
    NEWEST: 'newest',
    OLDEST: 'oldest',
    PRICE_HIGH: 'price-high',
    PRICE_LOW: 'price-low',
    VIEWS: 'views'
  };
  
  export const SORT_LABELS = {
    [SORT_OPTIONS.NEWEST]: 'Newest First',
    [SORT_OPTIONS.OLDEST]: 'Oldest First',
    [SORT_OPTIONS.PRICE_HIGH]: 'Price: High to Low',
    [SORT_OPTIONS.PRICE_LOW]: 'Price: Low to High',
    [SORT_OPTIONS.VIEWS]: 'Most Viewed'
  };
  
  export const VEHICLE_CATEGORIES = [
    'Sedan',
    'SUV',
    'Sports Car',
    'Luxury',
    'Electric',
    'Hybrid',
    'Truck',
    'Van',
    'Wagon',
    'Convertible',
    'Classic'
  ];
  
  export const CONDITION_TYPES = {
    NEW: 'new',
    USED: 'used',
    CERTIFIED: 'certified'
  };
  
  export const CONDITION_LABELS = {
    [CONDITION_TYPES.NEW]: 'New',
    [CONDITION_TYPES.USED]: 'Used',
    [CONDITION_TYPES.CERTIFIED]: 'Certified Pre-Owned'
  };
  
  export const TRANSMISSION_TYPES = {
    MANUAL: 'manual',
    AUTOMATIC: 'automatic',
    CVT: 'cvt',
    DCT: 'dct',
    SEMI_AUTO: 'semi-auto'
  };
  
  export const TRANSMISSION_LABELS = {
    [TRANSMISSION_TYPES.MANUAL]: 'Manual',
    [TRANSMISSION_TYPES.AUTOMATIC]: 'Automatic',
    [TRANSMISSION_TYPES.CVT]: 'CVT',
    [TRANSMISSION_TYPES.DCT]: 'Dual-Clutch',
    [TRANSMISSION_TYPES.SEMI_AUTO]: 'Semi-Automatic'
  };
  
  export const FUEL_TYPES = {
    PETROL: 'petrol',
    DIESEL: 'diesel',
    ELECTRIC: 'electric',
    HYBRID: 'hybrid',
    PLUGIN_HYBRID: 'plugin_hybrid',
    HYDROGEN: 'hydrogen'
  };
  
  export const FUEL_LABELS = {
    [FUEL_TYPES.PETROL]: 'Petrol',
    [FUEL_TYPES.DIESEL]: 'Diesel',
    [FUEL_TYPES.ELECTRIC]: 'Electric',
    [FUEL_TYPES.HYBRID]: 'Hybrid',
    [FUEL_TYPES.PLUGIN_HYBRID]: 'Plug-in Hybrid',
    [FUEL_TYPES.HYDROGEN]: 'Hydrogen'
  };
  
  export const DRIVETRAIN_TYPES = {
    FWD: 'fwd',
    RWD: 'rwd',
    AWD: 'awd',
    FOURWD: '4wd'
  };
  
  export const DRIVETRAIN_LABELS = {
    [DRIVETRAIN_TYPES.FWD]: 'Front-Wheel Drive',
    [DRIVETRAIN_TYPES.RWD]: 'Rear-Wheel Drive',
    [DRIVETRAIN_TYPES.AWD]: 'All-Wheel Drive',
    [DRIVETRAIN_TYPES.FOURWD]: '4-Wheel Drive'
  };
  
  export const FILE_UPLOAD_CONFIG = {
    MAX_FILES: 10,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    IMAGE_DIMENSIONS: {
      MIN_WIDTH: 800,
      MIN_HEIGHT: 600,
      MAX_WIDTH: 4096,
      MAX_HEIGHT: 4096
    }
  };
  
  export const LISTING_VALIDATION = {
    TITLE: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 100
    },
    DESCRIPTION: {
      MIN_LENGTH: 50,
      MAX_LENGTH: 2000
    },
    PRICE: {
      MIN: 0,
      MAX: 10000000 // 10 million
    }
  };