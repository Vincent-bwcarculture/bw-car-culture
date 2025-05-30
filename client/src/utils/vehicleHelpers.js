// src/utils/vehicleHelpers.js
// Helper functions for handling vehicle data in different component structures
// Updated for AWS S3 compatibility

/**
 * Extracts vehicle information from various property locations
 * @param {Object} vehicle - The vehicle object
 * @param {String} field - The property name to extract
 * @param {*} defaultValue - Value to return if property not found
 * @returns The property value or default value
 */
export const getVehicleInfo = (vehicle, field, defaultValue = 'N/A') => {
  if (!vehicle) return defaultValue;

  // Check for direct property first
  if (vehicle[field] !== undefined && vehicle[field] !== null && vehicle[field] !== '') {
    return vehicle[field];
  }

  // Then check specifications object
  if (vehicle.specifications && 
      vehicle.specifications[field] !== undefined && 
      vehicle.specifications[field] !== null && 
      vehicle.specifications[field] !== '') {
    return vehicle.specifications[field];
  }

  // For special cases like name/title
  if (field === 'name') {
    // Try various name possibilities
    if (vehicle.title) return vehicle.title;
    if (vehicle.name) return vehicle.name;
    
    // Try to construct a name from make and model
    const make = getVehicleInfo(vehicle, 'make');
    const model = getVehicleInfo(vehicle, 'model');
    
    if (make !== defaultValue || model !== defaultValue) {
      return `${make} ${model}`.trim();
    }
  }

  // If all else fails, return the default value
  return defaultValue;
};

/**
 * Gets the appropriate rate from a vehicle object
 * @param {Object} vehicle - The vehicle object
 * @param {String} rateType - Rate type to fetch (daily, weekly, monthly)
 * @param {Number} defaultValue - Default value if no rate is found
 * @returns {Number} The rate value
 */
export const getVehicleRate = (vehicle, rateType = 'daily', defaultValue = 0) => {
  if (!vehicle) return defaultValue;
  
  // Check in rates object first
  if (vehicle.rates && vehicle.rates[rateType] !== undefined) {
    return vehicle.rates[rateType];
  }
  
  // Try direct property
  if (vehicle[rateType + 'Rate'] !== undefined) {
    return vehicle[rateType + 'Rate'];
  }
  
  // Check for price as fallback
  if (rateType === 'daily' && vehicle.price) {
    return vehicle.price;
  }
  
  return defaultValue;
};

/**
 * Gets an appropriate image URL from a vehicle object
 * Updated to handle S3 URLs properly
 * @param {Object} vehicle - The vehicle object
 * @param {Number} index - Index of the image to retrieve
 * @returns {String} The image URL or a placeholder
 */
export const getVehicleImageUrl = (vehicle, index = 0) => {
  if (!vehicle) return '/images/placeholders/rental.jpg';
  
  try {
    // Check if there are images
    if (!vehicle.images || !Array.isArray(vehicle.images) || vehicle.images.length === 0) {
      return '/images/placeholders/rental.jpg';
    }
    
    // Get the specified image
    const image = vehicle.images[index] || vehicle.images[0];
    let imageUrl = '';
    
    // Handle string-based image entries (simple URL)
    if (typeof image === 'string') {
      imageUrl = image;
    } 
    // Handle object-based image entries ({url: '...', thumbnail: '...'})
    else if (image && typeof image === 'object') {
      // Check for different property names that might contain the URL
      imageUrl = image.url || image.thumbnail || image.path || '';
    }
    
    // No valid URL extracted
    if (!imageUrl) {
      return '/images/placeholders/rental.jpg';
    }
    
    // If it's already a full URL (S3 or external), return it as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If it's an /uploads/ path, the server will handle S3 redirection
    if (imageUrl.startsWith('/uploads/')) {
      return imageUrl;
    }
    
    // Ensure path starts with a slash for relative URLs
    if (!imageUrl.startsWith('/')) {
      imageUrl = `/${imageUrl}`;
    }
    
    // For other paths, try to construct the proper upload path
    if (!imageUrl.includes('/uploads/')) {
      // Extract just the filename
      const filename = imageUrl.split('/').pop();
      if (filename) {
        // Try different paths based on the rental type
        const category = getVehicleInfo(vehicle, 'category', '');
        const trailerType = getVehicleInfo(vehicle, 'trailerType', '');
        
        if (trailerType || category?.toLowerCase().includes('trailer')) {
          return `/uploads/trailers/${filename}`;
        } else {
          return `/uploads/rentals/${filename}`;
        }
      }
    }
    
    return imageUrl;
  } catch (error) {
    console.error(`Error getting image URL:`, error);
    return '/images/placeholders/rental.jpg';
  }
};

/**
 * Extract or construct a list of features from a vehicle
 * @param {Object} vehicle - The vehicle object
 * @returns {Array} List of vehicle features
 */
export const getVehicleFeatures = (vehicle) => {
  if (!vehicle) return [];
  
  // Check for features array
  if (vehicle.features && Array.isArray(vehicle.features) && vehicle.features.length > 0) {
    return vehicle.features;
  }
  
  // Try to build features from specifications
  const specs = vehicle.specifications || {};
  const features = [];
  
  // Add common features based on specifications
  if (specs.airConditioning || specs.ac) features.push('Air Conditioning');
  if (specs.bluetooth) features.push('Bluetooth');
  if (specs.navigation || specs.gps) features.push('Navigation');
  if (specs.heatedSeats) features.push('Heated Seats');
  if (specs.sunroof) features.push('Sunroof');
  
  // Add transmission type
  if (specs.transmission) {
    const transmission = specs.transmission.toLowerCase();
    if (transmission.includes('auto')) features.push('Automatic');
    else if (transmission.includes('manual')) features.push('Manual');
  }
  
  // Add fuel type
  if (specs.fuelType) {
    const fuelType = specs.fuelType.toLowerCase();
    if (fuelType.includes('petrol')) features.push('Petrol');
    else if (fuelType.includes('diesel')) features.push('Diesel');
    else if (fuelType.includes('electric')) features.push('Electric');
    else if (fuelType.includes('hybrid')) features.push('Hybrid');
  }
  
  return features;
};

/**
 * Gets the appropriate category style class
 * @param {String} category - The vehicle category
 * @returns {String} CSS class name for the category
 */
export const getCategoryClass = (category) => {
  if (!category) return '';
  
  switch (category.toLowerCase()) {
    case 'sedan':
    case 'luxury sedan':
    case 'executive sedan':
      return 'sedan';
    case 'suv':
    case 'luxury suv':
    case 'crossover':
      return 'suv';
    case 'economy':
    case 'economy sedan':
    case 'economy hatchback':
    case 'compact':
      return 'economy';
    case 'luxury':
    case 'premium':
      return 'luxury';
    case '4x4':
    case 'off-road':
      return 'off-road';
    default:
      return '';
  }
};

/**
 * Gets the appropriate CSS class for availability status
 * @param {String} availability - The availability status
 * @returns {String} CSS class name for the availability
 */
export const getAvailabilityClass = (availability) => {
  if (!availability) return 'available';
  
  const status = typeof availability === 'string' ? availability.toLowerCase() : '';
  
  switch (status) {
    case 'limited':
      return 'limited';
    case 'unavailable':
    case 'booked':
      return 'unavailable';
    default:
      return 'available';
  }
};

/**
 * Get the main image URL for a vehicle
 * @param {Object} vehicle - The vehicle object
 * @returns {String} The main image URL or a placeholder
 */
export const getVehicleMainImageUrl = (vehicle) => {
  if (!vehicle) return '/images/placeholders/rental.jpg';
  
  // Check for mainImage property first (S3 format)
  if (vehicle.mainImage) {
    // If it's already a full URL (S3), return it
    if (vehicle.mainImage.startsWith('http://') || vehicle.mainImage.startsWith('https://')) {
      return vehicle.mainImage;
    }
    // Otherwise treat it as a path
    return vehicle.mainImage.startsWith('/') ? vehicle.mainImage : `/${vehicle.mainImage}`;
  }
  
  // Fallback to first image in images array
  return getVehicleImageUrl(vehicle, 0);
};

// Export all functions
export default {
  getVehicleInfo,
  getVehicleRate,
  getVehicleImageUrl,
  getVehicleFeatures,
  getCategoryClass,
  getAvailabilityClass,
  getVehicleMainImageUrl
};