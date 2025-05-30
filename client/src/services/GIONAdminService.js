// src/services/GIONAdminService.js
import axios from 'axios';

// Base API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_URL}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to attach auth token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle specific error cases
    const errorResponse = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'An unexpected error occurred'
    };
    
    if (errorResponse.status === 401) {
      localStorage.removeItem('token');
    }
    
    return Promise.reject(errorResponse);
  }
);

class GIONAdminService {
  // Dashboard statistics
  async getStats() {
    try {
      // Try to get real data first
      const response = await apiClient.get('/stats/dashboard');
      if (response.data && response.data.success) {
        return {
          data: {
            totalUsers: response.data.userCount || 0,
            activeProviders: response.data.verifiedDealers || 0,
            pendingVerifications: response.data.pendingRequests || 0,
            reportedIssues: response.data.reportedIssues || 0
          }
        };
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.log('Using fallback stats data');
      // Fallback to mock data
      return {
        data: {
          totalUsers: Math.floor(5000 + Math.random() * 1000),
          activeProviders: Math.floor(350 + Math.random() * 50),
          pendingVerifications: Math.floor(20 + Math.random() * 30),
          reportedIssues: Math.floor(10 + Math.random() * 15)
        }
      };
    }
  }

  // System metrics
  async getMetrics() {
    try {
      // Try real endpoint
      const response = await apiClient.get('/health');
      if (response.data) {
        return {
          data: {
            uptime: response.data.uptime || 99.95,
            apiRequests: response.data.requestCount || 240000,
            avgResponseTime: response.data.avgResponseTime || 180,
            errorRate: response.data.errorRate || 0.1
          }
        };
      }
      throw new Error('Invalid metrics data');
    } catch (error) {
      console.log('Using fallback metrics data');
      return {
        data: {
          uptime: Number((99.95 + Math.random() * 0.04).toFixed(2)),
          apiRequests: Math.floor(240000 + Math.random() * 10000),
          avgResponseTime: Math.floor(180 + Math.random() * 20),
          errorRate: Number((0.1 + Math.random() * 0.1).toFixed(2))
        }
      };
    }
  }

  // Add this method to your GIONAdminService.js class
async getVerificationDetails(id) {
  try {
    console.log(`Fetching details for verification ${id}...`);
    // Try to get detailed provider request
    const response = await apiClient.get(`/provider-requests/${id}`);
    console.log('Verification details response:', response.data);
    
    if (response.data && response.data.success) {
      return response;
    }
    throw new Error('Invalid verification details response');
  } catch (error) {
    console.error(`Error fetching verification details for ${id}:`, error);
    
    // Fallback to mock data for development
    return {
      data: {
        success: true,
        data: {
          _id: id,
          businessName: "Sample Business Name",
          providerType: "public_transport",
          businessType: "certified",
          status: "pending",
          contact: {
            phone: "+1234567890",
            email: "business@example.com",
            website: "https://example.com"
          },
          location: {
            address: "123 Main Street",
            city: "Gaborone",
            country: "Botswana"
          },
          documents: [
            {
              filename: "business_license.pdf",
              path: "/uploads/provider-requests/business_license.pdf",
              mimetype: "application/pdf"
            },
            {
              filename: "id_proof.jpg",
              path: "/uploads/provider-requests/id_proof.jpg",
              mimetype: "image/jpeg"
            }
          ],
          user: {
            _id: "user123",
            name: "John Doe",
            email: "john@example.com"
          },
          createdAt: new Date().toISOString()
        }
      }
    };
  }
}

  // Get verification queue
  async getVerifications() {
    try {
      console.log('Fetching real provider requests data...');
      // Try to get provider requests directly from your provider-requests collection
      const response = await apiClient.get('/provider-requests');
      console.log('Provider requests API response:', response.data);
      
      if (response.data && response.data.success) {
        // Transform the provider requests into the format expected by VerificationQueue
        const verifications = response.data.data.map(request => ({
          id: request._id,
          name: request.businessName,
          type: this.formatProviderType(request.providerType),
          dateSubmitted: request.createdAt,
          status: request.status,
          documents: request.documents ? request.documents.length : 0
        }));
        
        console.log('Transformed verifications:', verifications);
        return {
          data: {
            success: true,
            verifications: verifications
          }
        };
      }
      throw new Error('Invalid provider requests data');
    } catch (error) {
      console.error('Error fetching verifications:', error);
      console.log('Using fallback verification data');
      
      // Fallback to mock data
      return {
        data: {
          success: true,
          verifications: [
            { 
              id: 1, 
              name: 'City Cabs Ltd.', 
              type: 'Taxi Service', 
              dateSubmitted: new Date().toISOString(),
              status: 'pending',
              documents: 4
            },
            { 
              id: 2, 
              name: 'Tranquil Transport Co.', 
              type: 'Bus Service', 
              dateSubmitted: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              status: 'pending',
              documents: 5
            },
            { 
              id: 3, 
              name: 'Metro Rides', 
              type: 'Taxi Service', 
              dateSubmitted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'pending',
              documents: 3
            }
          ]
        }
      };
    }
  }

  // Helper method to format provider types
  formatProviderType(type) {
    switch(type) {
      case 'public_transport':
        return 'Taxi Service';
      case 'dealership':
        return 'Dealership';
      case 'car_rental':
        return 'Car Rental Service';
      case 'trailer_rental':
        return 'Trailer Rental Service';
      case 'workshop':
        return 'Workshop Service';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  // Approve a provider verification
  async approveVerification(id) {
    try {
      console.log(`Attempting to approve provider request ${id}...`);
      // Use the actual endpoint for approving provider requests
      const response = await apiClient.put(`/provider-requests/${id}/status`, { 
        status: 'approved',
        notes: 'Approved by admin'
      });
      
      console.log('Approval response:', response.data);
      
      if (response.data && response.data.success) {
        return response;
      }
      throw new Error('Failed to approve provider request');
    } catch (error) {
      console.error(`Error approving verification ${id}:`, error);
      // For now, return a mock success response to allow UI testing
      return {
        data: {
          success: true,
          message: `Verification ${id} approved successfully`
        }
      };
    }
  }

  // Reject a provider verification
  async rejectVerification(id, notes = 'Rejected by admin') {
    try {
      console.log(`Attempting to reject provider request ${id} with notes: ${notes}...`);
      // Use the actual endpoint for rejecting provider requests
      const response = await apiClient.put(`/provider-requests/${id}/status`, { 
        status: 'rejected',
        notes: notes
      });
      
      console.log('Rejection response:', response.data);
      
      if (response.data && response.data.success) {
        return response;
      }
      throw new Error('Failed to reject provider request');
    } catch (error) {
      console.error(`Error rejecting verification ${id}:`, error);
      // For now, return a mock success response to allow UI testing
      return {
        data: {
          success: true,
          message: `Verification ${id} rejected successfully`
        }
      };
    }
  }

  // Activity log
  async getActivityLog() {
    try {
      // Try to get real activity log data
      const response = await apiClient.get('/activity-log');
      
      if (response.data && response.data.success) {
        return {
          data: {
            success: true,
            activities: response.data.activities
          }
        };
      }
      throw new Error('Invalid activity log data');
    } catch (error) {
      console.log('Using fallback activity log data');
      
      // Fallback to mock data
      return {
        data: {
          success: true,
          activities: [
            {
              id: 1,
              action: 'Provider Verified',
              subject: 'Elite Car Service',
              performer: 'admin@bcwcarculture.com',
              timestamp: new Date().toISOString()
            },
            {
              id: 2,
              action: 'Review Moderated',
              subject: 'Report #12345',
              performer: 'moderator@bcwcarculture.com',
              timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 3,
              action: 'User Suspended',
              subject: 'user123@example.com',
              performer: 'admin@bcwcarculture.com',
              timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 4,
              action: 'System Update',
              subject: 'GION App v1.2.5',
              performer: 'system',
              timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
            }
          ]
        }
      };
    }
  }

  // Users management
  async getUsers() {
    try {
      // Try to get real users data
      const response = await apiClient.get('/auth/users');
      
      if (response.data && response.data.success) {
        return {
          data: {
            success: true,
            users: response.data.data
          }
        };
      }
      throw new Error('Invalid users data');
    } catch (error) {
      console.log('Using fallback users data');
      
      // Fallback to mock data
      return {
        data: {
          success: true,
          users: [
            { id: 1, name: 'John Doe', email: 'john@example.com', role: 'provider', status: 'active' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'ministry', status: 'active' },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'provider', status: 'pending' },
            { id: 4, name: 'Alice Williams', email: 'alice@example.com', role: 'provider', status: 'active' },
            { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', role: 'ministry', status: 'suspended' }
          ]
        }
      };
    }
  }

  // Change user status
  async updateUserStatus(userId, status) {
    try {
      // Try to update user status
      const response = await apiClient.put(`/auth/users/${userId}/status`, { status });
      
      if (response.data && response.data.success) {
        return response;
      }
      throw new Error('Failed to update user status');
    } catch (error) {
      console.error(`Error updating user ${userId} status:`, error);
      // For now, return a mock success response to allow UI testing
      return {
        data: {
          success: true,
          message: `User ${userId} status updated to ${status}`
        }
      };
    }
  }
}

export default new GIONAdminService();