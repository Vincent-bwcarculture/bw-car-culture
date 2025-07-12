// client/src/components/profile/EnhancedRoleSelection.js
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Car, 
  Building2, 
  Truck, 
  Shield, 
  MapPin, 
  Users, 
  Briefcase,
  Settings,
  Check,
  ArrowRight,
  Info,
  Crown,
  AlertCircle,
  Clock
} from 'lucide-react';
import { http } from '../../config/axios.js';
import './EnhancedRoleSelection.css';

const EnhancedRoleSelection = ({ profileData, refreshProfile, onClose }) => {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [currentStep, setCurrentStep] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);

  // Basic user roles that don't require approval or payment
  const basicRoles = {
    user: {
      id: 'user',
      title: 'General User',
      description: 'Browse cars, news, and use basic platform features',
      icon: User,
      color: '#6b7280',
      category: 'basic',
      benefits: [
        'Browse car listings',
        'Read car news and reviews', 
        'Save favorite listings',
        'Contact sellers',
        'Basic profile features'
      ]
    },
    car_owner: {
      id: 'car_owner',
      title: 'Car Owner',
      description: 'Own and manage personal vehicles',
      icon: Car,
      color: '#3b82f6',
      category: 'basic',
      benefits: [
        'Manage personal vehicles',
        'Vehicle maintenance tracking',
        'Insurance and registration reminders',
        'Vehicle history records',
        'Sell personal vehicles (with subscription)'
      ]
    },
    commuter: {
      id: 'commuter',
      title: 'Public Transport User',
      description: 'Use public transport services and routes',
      icon: Users,
      color: '#10b981',
      category: 'basic',
      benefits: [
        'Access route information',
        'Real-time transport tracking',
        'Journey planning',
        'Fare information',
        'Service updates and alerts'
      ]
    },
    driver: {
      id: 'driver',
      title: 'Combi/Taxi Driver',
      description: 'Operate public transport vehicles',
      icon: MapPin,
      color: '#f59e0b',
      category: 'basic',
      benefits: [
        'Driver dashboard access',
        'Route assignments',
        'Earnings tracking',
        'Performance metrics',
        'Passenger communication'
      ]
    }
  };

  // Advanced roles that require verification or payment
  const advancedRoles = {
    dealership: {
      id: 'dealership',
      title: 'Car Dealership',
      description: 'Professional car sales business',
      icon: Building2,
      color: '#7c3aed',
      category: 'business',
      requiresVerification: true,
      benefits: [
        'Multiple car listings',
        'Business dashboard',
        'Lead management',
        'Professional profile',
        'Advanced analytics'
      ]
    },
    dealership_owner: {
      id: 'dealership_owner',
      title: 'Dealership Owner',
      description: 'Own and manage a car dealership',
      icon: Crown,
      color: '#dc2626',
      category: 'business',
      requiresVerification: true,
      benefits: [
        'Full dealership management',
        'Staff account management',
        'Financial reporting',
        'Inventory management',
        'Multi-location support'
      ]
    },
    transport_company: {
      id: 'transport_company',
      title: 'Public Transport Company',
      description: 'Operate public transport services',
      icon: Truck,
      color: '#059669',
      category: 'business',
      requiresVerification: true,
      benefits: [
        'Fleet management',
        'Route operations',
        'Driver management',
        'Revenue analytics',
        'Passenger services'
      ]
    },
    coordinator: {
      id: 'coordinator',
      title: 'Route Coordinator',
      description: 'Coordinate transport routes and operations',
      icon: Settings,
      color: '#8b5cf6',
      category: 'operational',
      requiresApproval: true,
      benefits: [
        'Route coordination',
        'Schedule management',
        'Driver assignments',
        'Performance monitoring',
        'Service optimization'
      ]
    },
    ministry_admin: {
      id: 'ministry_admin',
      title: 'Ministry Administrator',
      description: 'Government transport oversight',
      icon: Shield,
      color: '#ef4444',
      category: 'government',
      requiresApproval: true,
      benefits: [
        'Platform oversight',
        'Regulatory compliance',
        'Policy enforcement',
        'Public data access',
        'Service monitoring'
      ]
    }
  };

  useEffect(() => {
    // Load current user roles
    if (profileData?.role) {
      setSelectedRoles([profileData.role]);
    }
    if (profileData?.businessProfile?.services) {
      const serviceRoles = profileData.businessProfile.services.map(service => service.serviceType);
      setSelectedRoles(prev => [...new Set([...prev, ...serviceRoles])]);
    }
    loadPendingRequests();
  }, [profileData]);

  const loadPendingRequests = async () => {
    try {
      const response = await http.get('/api/user/role-requests');
      if (response.data.success) {
        setPendingRequests(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const handleRoleToggle = (roleId) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        return prev.filter(id => id !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const saveBasicRoles = async () => {
    try {
      setLoading(true);
      setError('');

      const basicRoleIds = selectedRoles.filter(roleId => 
        basicRoles[roleId] || roleId === 'user'
      );

      const response = await http.post('/api/user/update-roles', {
        roles: basicRoleIds,
        updateType: 'basic'
      });

      if (response.data.success) {
        setSuccess('Basic roles updated successfully!');
        refreshProfile();
        
        // Auto-progress if user selected advanced roles
        const hasAdvancedRoles = selectedRoles.some(roleId => advancedRoles[roleId]);
        if (hasAdvancedRoles) {
          setTimeout(() => setCurrentStep('advanced'), 1500);
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update roles');
    } finally {
      setLoading(false);
    }
  };

  const requestAdvancedRole = async (roleId) => {
    try {
      setLoading(true);
      const role = advancedRoles[roleId];
      
      const response = await http.post('/api/user/request-role', {
        role: roleId,
        category: role.category,
        requiresVerification: role.requiresVerification,
        requiresApproval: role.requiresApproval
      });

      if (response.data.success) {
        setSuccess(`${role.title} role request submitted successfully!`);
        loadPendingRequests();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit role request');
    } finally {
      setLoading(false);
    }
  };

  const renderBasicRoleSelection = () => (
    <div className="enhanced-role-step">
      <div className="enhanced-role-header">
        <h3>Select Your Basic Roles</h3>
        <p>Choose how you participate in the BW Car Culture platform. You can select multiple roles.</p>
      </div>

      <div className="enhanced-roles-grid">
        {Object.values(basicRoles).map(role => {
          const IconComponent = role.icon;
          const isSelected = selectedRoles.includes(role.id);
          
          return (
            <div
              key={role.id}
              className={`enhanced-role-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleRoleToggle(role.id)}
              style={{ '--role-color': role.color }}
            >
              <div className="enhanced-role-icon">
                <IconComponent size={24} />
                {isSelected && <Check className="enhanced-role-check" size={16} />}
              </div>
              
              <div className="enhanced-role-info">
                <h4>{role.title}</h4>
                <p>{role.description}</p>
              </div>
              
              <div className="enhanced-role-benefits">
                <h5>Benefits:</h5>
                <ul>
                  {role.benefits.slice(0, 3).map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                  {role.benefits.length > 3 && (
                    <li className="enhanced-more">+{role.benefits.length - 3} more...</li>
                  )}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div className="enhanced-role-actions">
        <button 
          onClick={saveBasicRoles}
          disabled={loading || selectedRoles.length === 0}
          className="enhanced-save-button"
        >
          {loading ? 'Saving...' : 'Save Basic Roles'}
          <ArrowRight size={16} />
        </button>
        
        <button 
          onClick={() => setCurrentStep('advanced')}
          className="enhanced-skip-button"
        >
          Need Business Roles? →
        </button>
      </div>
    </div>
  );

  const renderAdvancedRoleSelection = () => (
    <div className="enhanced-role-step">
      <div className="enhanced-role-header">
        <h3>Business & Professional Roles</h3>
        <p>These roles require verification or approval and provide access to business features.</p>
      </div>

      <div className="enhanced-roles-grid">
        {Object.values(advancedRoles).map(role => {
          const IconComponent = role.icon;
          const isPending = pendingRequests.some(req => req.role === role.id);
          const isApproved = profileData?.role === role.id || 
                           profileData?.businessProfile?.services?.some(s => s.serviceType === role.id);
          
          return (
            <div
              key={role.id}
              className={`enhanced-role-card ${isPending ? 'pending' : ''} ${isApproved ? 'approved' : ''}`}
              style={{ '--role-color': role.color }}
            >
              <div className="enhanced-role-icon">
                <IconComponent size={24} />
                {isPending && <Clock className="enhanced-role-status" size={16} />}
                {isApproved && <Check className="enhanced-role-status" size={16} />}
              </div>
              
              <div className="enhanced-role-info">
                <h4>{role.title}</h4>
                <p>{role.description}</p>
                
                {role.requiresVerification && (
                  <div className="enhanced-role-requirement">
                    <Info size={14} />
                    Requires business verification
                  </div>
                )}
                
                {role.requiresApproval && (
                  <div className="enhanced-role-requirement">
                    <AlertCircle size={14} />
                    Requires admin approval
                  </div>
                )}
              </div>
              
              <div className="enhanced-role-benefits">
                <h5>Benefits:</h5>
                <ul>
                  {role.benefits.slice(0, 3).map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                  {role.benefits.length > 3 && (
                    <li className="enhanced-more">+{role.benefits.length - 3} more...</li>
                  )}
                </ul>
              </div>
              
              <div className="enhanced-role-action">
                {isApproved ? (
                  <span className="enhanced-approved-badge">
                    <Check size={14} />
                    Active
                  </span>
                ) : isPending ? (
                  <span className="enhanced-pending-badge">
                    <Clock size={14} />
                    Pending Review
                  </span>
                ) : (
                  <button 
                    onClick={() => requestAdvancedRole(role.id)}
                    disabled={loading}
                    className="enhanced-request-button"
                  >
                    Request Access
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="enhanced-role-actions">
        <button 
          onClick={() => setCurrentStep('basic')}
          className="enhanced-back-button"
        >
          ← Back to Basic Roles
        </button>
        
        <button 
          onClick={onClose}
          className="enhanced-close-button"
        >
          Close Role Selection
        </button>
      </div>
    </div>
  );

  return (
    <div className="enhanced-role-selection-overlay">
      <div className="enhanced-role-selection-container">
        <div className="enhanced-role-selection-header">
          <h2>Role Selection</h2>
          <button onClick={onClose} className="enhanced-close-button">×</button>
        </div>

        {/* Progress Indicator */}
        <div className="enhanced-role-progress">
          <div className={`enhanced-progress-step ${currentStep === 'basic' ? 'active' : 'completed'}`}>
            <span>1</span>
            Basic Roles
          </div>
          <div className="enhanced-progress-line"></div>
          <div className={`enhanced-progress-step ${currentStep === 'advanced' ? 'active' : ''}`}>
            <span>2</span>
            Business Roles
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="enhanced-role-message error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        
        {success && (
          <div className="enhanced-role-message success">
            <Check size={16} />
            {success}
          </div>
        )}

        {/* Step Content */}
        {currentStep === 'basic' ? renderBasicRoleSelection() : renderAdvancedRoleSelection()}
      </div>
    </div>
  );
};

export default EnhancedRoleSelection;
