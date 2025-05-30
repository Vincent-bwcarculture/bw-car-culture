// src/components/auth/config/roles.js

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  DEALER: 'dealer',
  PROVIDER: 'provider',
  MINISTRY: 'ministry',
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
    [ROLES.USER]: []
  };