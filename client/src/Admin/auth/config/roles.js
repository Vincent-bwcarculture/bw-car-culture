// client/src/Admin/auth/config/roles.js
// COMPLETE VERSION - Current Working Config with Courier Role Integrated

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  DEALER: 'dealer',
  PROVIDER: 'provider',
  MINISTRY: 'ministry',
  COURIER: 'courier',  // NEW: Courier role added
  USER: 'user'
};
  
export const PERMISSIONS = {
  // Content Management
  CREATE_CONTENT: 'create_content',
  EDIT_CONTENT: 'edit_content',
  DELETE_CONTENT: 'delete_content',
  PUBLISH_CONTENT: 'publish_content',
  
  // User Management
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  
  // Dealer Management
  MANAGE_LISTINGS: 'manage_listings',
  VERIFY_DEALERS: 'verify_dealers',
  VERIFY_PROVIDERS: 'verify_providers',
  MANAGE_PROVIDER_DASHBOARD: 'manage_provider_dashboard',
  
  // Ministry Management
  MANAGE_MINISTRY_DASHBOARD: 'manage_ministry_dashboard',
  VIEW_TRANSPORT_DATA: 'view_transport_data',
  APPROVE_TRANSPORT_SERVICES: 'approve_transport_services',

  // NEW: Courier Management Permissions
  MANAGE_COURIER_TRIPS: 'manage_courier_trips',
  MANAGE_COURIER_DELIVERIES: 'manage_courier_deliveries',
  MANAGE_COURIER_PROFILE: 'manage_courier_profile',
  VIEW_COURIER_ANALYTICS: 'view_courier_analytics',
  UPLOAD_TRANSPORT_PROOF: 'upload_transport_proof',
  MANAGE_DELIVERY_CAPACITY: 'manage_delivery_capacity',
  POST_DELIVERY_TRIPS: 'post_delivery_trips',
  ACCEPT_DELIVERY_REQUESTS: 'accept_delivery_requests',
  UPLOAD_PACKAGE_PHOTOS: 'upload_package_photos',
  MANAGE_COURIER_RATINGS: 'manage_courier_ratings',

  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_REPORTS: 'export_reports'
};
  
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    ...Object.values(PERMISSIONS)
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.CREATE_CONTENT,
    PERMISSIONS.EDIT_CONTENT,
    PERMISSIONS.DELETE_CONTENT,
    PERMISSIONS.PUBLISH_CONTENT,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VERIFY_PROVIDERS,
    PERMISSIONS.VERIFY_DEALERS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_REPORTS
  ],
  [ROLES.EDITOR]: [
    PERMISSIONS.CREATE_CONTENT,
    PERMISSIONS.EDIT_CONTENT,
    PERMISSIONS.PUBLISH_CONTENT,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  [ROLES.DEALER]: [
    PERMISSIONS.MANAGE_LISTINGS,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  [ROLES.PROVIDER]: [
    PERMISSIONS.MANAGE_LISTINGS,
    PERMISSIONS.MANAGE_PROVIDER_DASHBOARD,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  [ROLES.MINISTRY]: [
    PERMISSIONS.MANAGE_MINISTRY_DASHBOARD,
    PERMISSIONS.VIEW_TRANSPORT_DATA,
    PERMISSIONS.APPROVE_TRANSPORT_SERVICES,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_REPORTS
  ],
  // NEW: Courier role permissions - Comprehensive courier functionality
  [ROLES.COURIER]: [
    PERMISSIONS.MANAGE_COURIER_TRIPS,
    PERMISSIONS.MANAGE_COURIER_DELIVERIES,
    PERMISSIONS.MANAGE_COURIER_PROFILE,
    PERMISSIONS.VIEW_COURIER_ANALYTICS,
    PERMISSIONS.UPLOAD_TRANSPORT_PROOF,
    PERMISSIONS.MANAGE_DELIVERY_CAPACITY,
    PERMISSIONS.POST_DELIVERY_TRIPS,
    PERMISSIONS.ACCEPT_DELIVERY_REQUESTS,
    PERMISSIONS.UPLOAD_PACKAGE_PHOTOS,
    PERMISSIONS.MANAGE_COURIER_RATINGS,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  [ROLES.USER]: []
};