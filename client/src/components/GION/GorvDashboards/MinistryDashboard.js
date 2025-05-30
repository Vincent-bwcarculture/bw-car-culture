import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MinistryHeader from './MinistryHeader.js';
import MinistryStatCards from './MinistryStatCards.js';
import RatingsChart from './components/RatingsChart.js';
import TopPerformers from './components/TopPerformers.js';
import AlertBox from './components/AlertBox.js';
import Sidebar from '../DashboardSidebar/Sidebar.js';
import './MinistryDashboard.css';

const MinistryDashboard = () => {
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    complianceRate: 0,
    issuesReported: 0
  });
  const [chartData, setChartData] = useState([]);
  const [topProviders, setTopProviders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, this would be an API call
    const fetchDashboardData = async () => {
      setLoading(true);
      
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulated data from API
        setStats({
          totalReviews: 34891,
          avgRating: 4.2,
          complianceRate: 87,
          issuesReported: 267
        });
        
        setChartData([
          { month: 'Jan', rating: 3.8 },
          { month: 'Feb', rating: 4.0 },
          { month: 'Mar', rating: 3.9 },
          { month: 'Apr', rating: 4.1 },
          { month: 'May', rating: 4.3 },
          { month: 'Jun', rating: 4.2 },
          { month: 'Jul', rating: 4.4 }
        ]);
        
        setTopProviders([
          { id: 1, name: 'SafeRide Taxi Co.', rating: 4.9, reviews: 543 },
          { id: 2, name: 'City Express Cab', rating: 4.8, reviews: 421 },
          { id: 3, name: 'Metro Taxi Service', rating: 4.7, reviews: 387 },
          { id: 4, name: 'Reliable Transport', rating: 4.6, reviews: 356 },
          { id: 5, name: 'Premier Car Service', rating: 4.5, reviews: 342 }
        ]);
        
        setAlerts([
          { id: 1, message: '12 service providers require compliance review this week', type: 'warning' },
          { id: 2, message: '3 safety reports need immediate attention', type: 'urgent' }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [dateRange]);
  
  const handleFilterChange = (range) => {
    setDateRange(range);
  };
  
  const handleExport = () => {
    alert('Exporting dashboard data...');
    // This would trigger a real export in a production app
  };
  
  const handleGenerateReport = () => {
    alert('Generating comprehensive report...');
    // This would generate a report in a production app
  };
  
  const handleViewAlert = (alertId) => {
    navigate(`/ministry/alerts/${alertId}`);
  };

  return (
    <div className="ministry-dashboard">
      <Sidebar 
        activeItem="dashboard"
        userType="ministry"
      />
      
      <div className="ministry-main-content">
        <MinistryHeader 
          onFilterChange={handleFilterChange}
          onExport={handleExport}
          onGenerateReport={handleGenerateReport}
          dateRange={dateRange}
        />
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            <MinistryStatCards stats={stats} />
            
            <div className="dashboard-content-grid">
              <div className="chart-container">
                <h2>Service Ratings Trend</h2>
                <RatingsChart data={chartData} />
              </div>
              
              <div className="top-performers-container">
                <TopPerformers providers={topProviders} />
              </div>
            </div>
            
            <div className="alerts-section">
              {alerts.map(alert => (
                <AlertBox 
                  key={alert.id}
                  message={alert.message}
                  type={alert.type}
                  onViewDetails={() => handleViewAlert(alert.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MinistryDashboard;