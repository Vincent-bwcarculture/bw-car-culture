// src/components/GION/ServiceProviderDashboard/ServiceProviderDashboard.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../DashboardSidebar/Sidebar.js';
import ProviderHeader from './components/ProviderHeader.js';
import ProviderOverview from './ProviderOverview.js';
import RecentReviews from './components/RecentReviews.js';
import ComplianceStatus from './components/ComplianceStatus.js';
import RatingsBreakdown from './components/RatingsBreakdown.js';
import { http } from '../../../config/axios.js';
import { useAuth } from '../../../context/AuthContext.js';
import './ServiceProviderDashboard.css';

const ServiceProviderDashboard = () => {
  const { id } = useParams(); // Get service ID from URL params
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');
  const [providerData, setProviderData] = useState({
    name: '',
    rating: 0,
    reviewCount: 0,
    complianceStatus: '',
    alerts: []
  });
  const [serviceData, setServiceData] = useState(null); // New state for service-specific data
  const [reviews, setReviews] = useState([]);
  const [complianceItems, setComplianceItems] = useState([]);
  const [ratingsData, setRatingsData] = useState([]);
  
  useEffect(() => {
    const fetchProviderData = async () => {
      setLoading(true);
      
      try {
        // If we have a service ID, load specific service data
        if (id) {
          console.log(`Loading data for service ID: ${id}`);
          try {
            const response = await http.get(`/services/${id}`);
            if (response.data && response.data.success) {
              setServiceData(response.data.data);
              // Set page title based on service name
              document.title = `${response.data.data.businessName} - Provider Dashboard`;
              
              // Add specific service metrics if available
              if (response.data.data.metrics) {
                setRatingsData([
                  { rating: 5, percentage: 85 },
                  { rating: 4, percentage: 10 },
                  { rating: 3, percentage: 3 },
                  { rating: 2, percentage: 1 },
                  { rating: 1, percentage: 1 }
                ]);
              }
            }
          } catch (serviceError) {
            console.error('Error loading service data:', serviceError);
          }
        }
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulated data for dashboard metrics
        setProviderData({
          name: serviceData?.businessName || 'SafeRide Taxi Co.',
          rating: serviceData?.metrics?.averageRating || 4.8,
          reviewCount: serviceData?.metrics?.totalReviews || 543,
          revenueGrowth: 12.5,
          serviceCount: serviceData?.metrics?.totalServices || 2135,
          complianceStatus: 'compliant',
          alerts: [
            { id: 1, message: 'Compliance certificate expires in 30 days', severity: 'medium' },
            { id: 2, message: 'Safety inspection due next week', severity: 'high' }
          ]
        });
        
        // Adapt reviews based on service ID if available
        setReviews([
          { 
            id: 1, 
            user: 'James M.', 
            rating: 5, 
            comment: 'Excellent service! Driver was on time and very professional.',
            date: '2025-03-22T14:30:00Z'
          },
          { 
            id: 2, 
            user: 'Sarah L.', 
            rating: 4, 
            comment: 'Good service, but the car could have been cleaner.',
            date: '2025-03-20T09:15:00Z'
          },
          { 
            id: 3, 
            user: 'Michael R.', 
            rating: 5, 
            comment: 'Very safe and comfortable ride. Will use again!',
            date: '2025-03-18T16:45:00Z'
          }
        ]);
        
        setComplianceItems([
          { id: 1, name: 'Vehicle Registration', status: 'valid', expiry: '2025-12-15' },
          { id: 2, name: 'Driver Licensing', status: 'valid', expiry: '2025-08-30' },
          { id: 3, name: 'Insurance Coverage', status: 'valid', expiry: '2025-06-12' },
          { id: 4, name: 'Safety Inspection', status: 'upcoming', expiry: '2025-04-05' },
          { id: 5, name: 'Service Permit', status: 'valid', expiry: '2025-09-22' }
        ]);
        
        // If not service-specific, use default ratings data
        if (!id) {
          setRatingsData([
            { rating: 5, percentage: 85 },
            { rating: 4, percentage: 10 },
            { rating: 3, percentage: 3 },
            { rating: 2, percentage: 1 },
            { rating: 1, percentage: 1 }
          ]);
        }
      } catch (error) {
        console.error('Error fetching service provider data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProviderData();
  }, [id]);
  
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  return (
    <div className="provider-dashboard">
      <Sidebar 
        activeItem="dashboard"
        userType="provider"
      />
      
      <div className="provider-main-content">
        <ProviderHeader 
          providerName={serviceData ? serviceData.businessName : providerData.name}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          serviceMode={!!id}
        />
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        ) : (
          <>
            {/* Add service-specific banner if available */}
            {serviceData && (
              <div className="service-specific-banner" style={{
                background: 'rgba(74, 74, 247, 0.1)',
                padding: '1rem',
                borderRadius: '8px',
                margin: '0 0 1.5rem 0',
                border: '1px solid rgba(74, 74, 247, 0.3)'
              }}>
                <h2 style={{ margin: '0 0 0.5rem 0', color: '#4a4af7' }}>Managing Service: {serviceData.businessName}</h2>
                <p style={{ margin: '0', color: '#444' }}>You are viewing the dashboard for your specific service.</p>
              </div>
            )}
            
            <ProviderOverview 
              data={serviceData || providerData}
            />
            
            <div className="dashboard-grid">
              <div className="dashboard-col">
                <RecentReviews 
                  reviews={reviews}
                  averageRating={serviceData?.metrics?.averageRating || providerData.rating}
                  totalReviews={serviceData?.metrics?.totalReviews || providerData.reviewCount}
                />
                
                <ComplianceStatus 
                  items={complianceItems}
                  status={providerData.complianceStatus}
                />
              </div>
              
              <div className="dashboard-col">
                <RatingsBreakdown 
                  data={ratingsData}
                  averageRating={serviceData?.metrics?.averageRating || providerData.rating}
                />
                
                <div className="alerts-container">
                  <h2>Alerts & Notifications</h2>
                  {providerData.alerts.length > 0 ? (
                    <div className="alerts-list">
                      {providerData.alerts.map(alert => (
                        <div 
                          key={alert.id} 
                          className={`alert-item alert-${alert.severity}`}
                        >
                          <div className="alert-icon">
                            {alert.severity === 'high' ? '⚠️' : 'ℹ️'}
                          </div>
                          <div className="alert-message">
                            {alert.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-alerts">No active alerts at this time</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderDashboard;