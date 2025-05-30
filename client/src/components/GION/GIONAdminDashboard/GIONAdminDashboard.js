import React, { useState, useEffect } from 'react';
import SystemMetrics from './SystemMetrics.js';
import VerificationQueue from './VerificationQueue.js';
import ActivityLog from './ActivityLog.js';
import UserManagement from './components/UserManagement.js';
import GIONAdminService from '../../../services/GIONAdminService.js';
import { ToggleLeft, ToggleRight } from 'lucide-react'; // Using Toggle icons instead of Switch
import './GIONAdminDashboard.css';

const GIONAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProviders: 0,
    pendingVerifications: 0,
    reportedIssues: 0
  });
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: 0,
    apiRequests: 0,
    avgResponseTime: 0,
    errorRate: 0
  });
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [gionEnabled, setGionEnabled] = useState(
    localStorage.getItem('gion_app_enabled') !== 'false'
  );
  
  // Handle GION visibility toggle
  const handleGionToggle = () => {
    const newState = !gionEnabled;
    setGionEnabled(newState);
    localStorage.setItem('gion_app_enabled', newState.toString());
  };
  
  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel for better performance
      const [statsResponse, metricsResponse, verificationsResponse, activityResponse] = await Promise.all([
        GIONAdminService.getStats(),
        GIONAdminService.getMetrics(),
        GIONAdminService.getVerifications(),
        GIONAdminService.getActivityLog()
      ]);
      
      // Update state with fetched data
      setStats(statsResponse.data);
      setSystemMetrics(metricsResponse.data);
      setVerificationQueue(verificationsResponse.data.verifications);
      setActivityLog(activityResponse.data.activities);
      
      // Log success for debugging
      console.log('Dashboard data loaded successfully');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle verification approval
  const handleApproveVerification = async (id) => {
    try {
      await GIONAdminService.approveVerification(id);
      // Refresh verifications data
      const response = await GIONAdminService.getVerifications();
      setVerificationQueue(response.data.verifications);
      // Also update stats
      const statsResponse = await GIONAdminService.getStats();
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Error approving verification:', err);
      setError('Failed to approve verification. Please try again.');
    }
  };
  
  // Handle verification rejection
  const handleRejectVerification = async (id, notes) => {
    try {
      await GIONAdminService.rejectVerification(id, notes);
      // Refresh verifications data
      const response = await GIONAdminService.getVerifications();
      setVerificationQueue(response.data.verifications);
      // Also update stats
      const statsResponse = await GIONAdminService.getStats();
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Error rejecting verification:', err);
      setError('Failed to reject verification. Please try again.');
    }
  };
  
  // View all activities handler
  const handleViewAllActivities = () => {
    setActiveTab('activity');
  };
  
  // View all verifications handler
  const handleViewAllVerifications = () => {
    setActiveTab('verifications');
  };
  
  useEffect(() => {
    fetchDashboardData();
    
    // Set up polling for real-time updates every 5 minutes
    const pollInterval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);
    
    // Clean up on unmount
    return () => clearInterval(pollInterval);
  }, []);
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const handleRefresh = () => {
    fetchDashboardData();
  };
  
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'providers':
        return <SystemMetrics metrics={systemMetrics} />;
      case 'verifications':
        return (
          <VerificationQueue 
            verifications={verificationQueue} 
            onApprove={handleApproveVerification}
            onReject={handleRejectVerification}
          />
        );
      case 'activity':
        return <ActivityLog activities={activityLog} />;
      default:
        return (
          <>
            <div className="gion-admin-stats-overview">
              <div className="gion-admin-stat-card">
                <div className="gion-admin-stat-icon gion-users-icon">
                  <i className="icon">👥</i>
                </div>
                <div className="gion-admin-stat-content">
                  <h3>Total Users</h3>
                  <div className="gion-admin-stat-value">{stats.totalUsers.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="gion-admin-stat-card">
                <div className="gion-admin-stat-icon gion-providers-icon">
                  <i className="icon">🏢</i>
                </div>
                <div className="gion-admin-stat-content">
                  <h3>Active Providers</h3>
                  <div className="gion-admin-stat-value">{stats.activeProviders.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="gion-admin-stat-card">
                <div className="gion-admin-stat-icon gion-verify-icon">
                  <i className="icon">✓</i>
                </div>
                <div className="gion-admin-stat-content">
                  <h3>Pending Verifications</h3>
                  <div className="gion-admin-stat-value">{stats.pendingVerifications}</div>
                </div>
              </div>
              
              <div className="gion-admin-stat-card">
                <div className="gion-admin-stat-icon" style={{ background: 'rgba(255, 51, 0, 0.1)', color: '#ff3300' }}>
                  {gionEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </div>
                <div className="gion-admin-stat-content">
                  <h3>GION Integration</h3>
                  <div className="gion-toggle-switch-container">
                    <span>Disable</span>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={gionEnabled} 
                        onChange={handleGionToggle} 
                      />
                      <span className="slider"></span>
                    </label>
                    <span>Enable</span>
                  </div>
                  <div className="gion-admin-stat-description">
                    {gionEnabled ? 'GION button is visible' : 'GION button is hidden'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="gion-admin-dashboard-grid">
              <div className="gion-admin-grid-item">
                <h2>System Metrics</h2>
                <SystemMetrics metrics={systemMetrics} />
              </div>
              
              <div className="gion-admin-grid-item">
                <h2>Recent Activity</h2>
                <ActivityLog 
                  activities={activityLog.slice(0, 3)} 
                  showViewAll={true}
                  onViewAll={handleViewAllActivities}
                />
              </div>
              
              <div className="gion-admin-grid-item">
                <h2>Verification Queue</h2>
                <VerificationQueue 
                  verifications={verificationQueue.filter(v => v.status === 'pending').slice(0, 3)} 
                  showViewAll={true}
                  onViewAll={handleViewAllVerifications}
                  onApprove={handleApproveVerification}
                  onReject={handleRejectVerification}
                />
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="gion-admin-dashboard">
      <div className="gion-admin-main-content">
        {error && (
          <div className="gion-error-container">
            <p>Error: {error}</p>
            <button onClick={handleRefresh}>Retry</button>
          </div>
        )}
        
        {loading ? (
          <div className="gion-loading-container">
            <div className="gion-loading-spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <div className="gion-admin-content">
            {renderActiveTabContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default GIONAdminDashboard;