// client/src/config/serviceRouter.js
// Route specific endpoints to the appropriate API files

const SERVICE_ENDPOINTS = {
  // User Services API endpoints
  userServices: [
    '/api/user/profile',
    '/api/user/vehicles',
    '/api/user/listings',
    '/api/user/listings/stats',
    '/api/payments/available-tiers',
    '/api/payments/initiate', 
    '/api/payments/history',
    '/api/addons/available',
    '/api/addons/purchase',
    '/api/addons/my-addons'
  ],
  
  // Main API endpoints (everything else)
  mainApi: [
    '/api/listings',
    '/api/dealers',
    '/api/auth',
    '/api/admin',
    '/api/providers',
    '/api/stats',
    // ... all other endpoints go to main API
  ]
};

export const getApiEndpoint = (path) => {
  const baseURL = process.env.REACT_APP_API_URL || 'https://bw-car-culture-api.vercel.app';
  
  // Check if this path should go to user-services
  const shouldUseUserServices = SERVICE_ENDPOINTS.userServices.some(endpoint => 
    path === endpoint || path.startsWith(endpoint)
  );
  
  if (shouldUseUserServices) {
    // Route to user-services.js
    return `${baseURL}/api/user-services`;
  }
  
  // Route to main index.js
  return `${baseURL}/api`;
};

export default SERVICE_ENDPOINTS;
