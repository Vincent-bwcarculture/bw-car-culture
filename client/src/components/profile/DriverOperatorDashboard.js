// client/src/components/profile/DriverOperatorDashboard.js
import React, { useState, useEffect } from 'react';
import { 
  MapPin, Clock, Users, Car, Navigation, Phone, 
  CheckCircle, AlertCircle, Timer, Zap, DollarSign,
  Activity, BarChart3, TrendingUp, Calendar, 
  Bell, Settings, Star, Award, Target
} from 'lucide-react';
import axios from '../../config/axios.js';
import './DriverOperatorDashboard.css';

const DriverOperatorDashboard = ({ profileData }) => {
  const [queueStatus, setQueueStatus] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState('');
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [todayStats, setTodayStats] = useState({
    trips: 0,
    earnings: 0,
    passengers: 0,
    waitTime: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [showJoinQueue, setShowJoinQueue] = useState(false);
  const [loading, setLoading] = useState(false);

  const [joinQueueForm, setJoinQueueForm] = useState({
    vehicleNumber: '',
    route: '',
    destination: '',
    capacity: '',
    serviceType: 'combi',
    specialService: false
  });

  useEffect(() => {
    fetchStations();
    fetchQueueStatus();
    fetchTodayStats();
    fetchNotifications();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      fetchQueueStatus();
      fetchNotifications();
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchStations = async () => {
    try {
      const response = await axios.get('/stations');
      if (response.data.success) {
        setStations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  const fetchQueueStatus = async () => {
    try {
      const response = await axios.get('/driver/queue-status');
      if (response.data.success) {
        setQueueStatus(response.data.data);
        if (response.data.data.currentVehicle) {
          setCurrentVehicle(response.data.data.currentVehicle);
          setSelectedStation(response.data.data.currentVehicle.station);
        }
      }
    } catch (error) {
      console.error('Error fetching queue status:', error);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const response = await axios.get('/driver/today-stats');
      if (response.data.success) {
        setTodayStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/driver/notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const joinQueue = async (stationId) => {
    try {
      setLoading(true);
      const response = await axios.post('/driver/join-queue', {
        stationId,
        ...joinQueueForm
      });
      
      if (response.data.success) {
        setCurrentVehicle(response.data.data);
        setShowJoinQueue(false);
        fetchQueueStatus();
        setJoinQueueForm({
          vehicleNumber: '',
          route: '',
          destination: '',
          capacity: '',
          serviceType: 'combi',
          specialService: false
        });
      }
    } catch (error) {
      console.error('Error joining queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const leaveQueue = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/driver/leave-queue');
      if (response.data.success) {
        setCurrentVehicle(null);
        setQueueStatus(null);
        fetchQueueStatus();
      }
    } catch (error) {
      console.error('Error leaving queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsSpecial = async () => {
    try {
      const response = await axios.post('/driver/request-special');
      if (response.data.success) {
        fetchQueueStatus();
      }
    } catch (error) {
      console.error('Error requesting special:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return '#f39c12';
      case 'loading': return '#3498db';
      case 'loaded': return '#27ae60';
      case 'special': return '#9b59b6';
      case 'knocked_off': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'waiting': return 'Waiting in queue';
      case 'loading': return 'Loading passengers';
      case 'loaded': return 'Ready to depart';
      case 'special': return 'Special service';
      case 'knocked_off': return 'Knocked off';
      default: return 'Unknown status';
    }
  };

  const getWaitTimeEstimate = (position) => {
    if (!position || position <= 0) return 'Loading now';
    const estimatedMinutes = position * 15; // 15 minutes per vehicle
    if (estimatedMinutes < 60) {
      return `~${estimatedMinutes} minutes`;
    } else {
      const hours = Math.floor(estimatedMinutes / 60);
      const minutes = estimatedMinutes % 60;
      return `~${hours}h ${minutes}m`;
    }
  };

  return (
    <div className="driver-operator-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <Car className="header-icon" />
          <div>
            <h2>Driver Dashboard</h2>
            <p>Manage your transport operations and track your queue status</p>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="notification-btn">
            <Bell className="btn-icon" />
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </button>
          <button className="settings-btn">
            <Settings className="btn-icon" />
          </button>
        </div>
      </div>

      {/* Today's Stats */}
      <div className="stats-section">
        <h3>Today's Performance</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Navigation className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{todayStats.trips}</div>
              <div className="stat-label">Trips Completed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <DollarSign className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">P {todayStats.earnings}</div>
              <div className="stat-label">Earnings</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Users className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{todayStats.passengers}</div>
              <div className="stat-label">Passengers</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Timer className="icon" />
            </div>
            <div className="stat-content">
              <div className="stat-value">{todayStats.waitTime}m</div>
              <div className="stat-label">Avg Wait Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Queue Status */}
      {currentVehicle ? (
        <div className="queue-status-section">
          <h3>Your Current Queue Status</h3>
          <div className="queue-status-card">
            <div className="status-header">
              <div className="status-info">
                <div className="vehicle-info">
                  <span className="vehicle-number">{currentVehicle.vehicleNumber}</span>
                  <span className="vehicle-route">{currentVehicle.route}</span>
                </div>
                <div className="station-info">
                  <MapPin className="station-icon" />
                  <span>{currentVehicle.station}</span>
                </div>
              </div>
              <div 
                className="status-indicator"
                style={{ backgroundColor: getStatusColor(currentVehicle.status) }}
              >
                <div className="status-dot"></div>
                <span className="status-text">{getStatusMessage(currentVehicle.status)}</span>
              </div>
            </div>

            <div className="queue-details">
              <div className="queue-position">
                <div className="position-number">#{currentVehicle.position || 'Loading'}</div>
                <div className="position-label">Position in Queue</div>
              </div>
              
              <div className="queue-info">
                <div className="info-item">
                  <Clock className="info-icon" />
                  <div>
                    <div className="info-label">Estimated Wait</div>
                    <div className="info-value">{getWaitTimeEstimate(currentVehicle.position)}</div>
                  </div>
                </div>
                <div className="info-item">
                  <Users className="info-icon" />
                  <div>
                    <div className="info-label">Capacity</div>
                    <div className="info-value">{currentVehicle.capacity} passengers</div>
                  </div>
                </div>
                <div className="info-item">
                  <Timer className="info-icon" />
                  <div>
                    <div className="info-label">In Queue Since</div>
                    <div className="info-value">
                      {new Date(currentVehicle.arrivalTime).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="queue-actions">
              {currentVehicle.status === 'waiting' && (
                <>
                  <button 
                    className="action-btn special"
                    onClick={markAsSpecial}
                  >
                    <Zap className="btn-icon" />
                    Request Special Service
                  </button>
                  <button 
                    className="action-btn secondary"
                    onClick={() => {/* Call coordinator */}}
                  >
                    <Phone className="btn-icon" />
                    Call Coordinator
                  </button>
                </>
              )}
              
              {currentVehicle.status === 'loading' && (
                <div className="loading-status">
                  <div className="loading-spinner"></div>
                  <span>Loading passengers...</span>
                </div>
              )}
              
              <button 
                className="action-btn danger"
                onClick={leaveQueue}
                disabled={loading}
              >
                <AlertCircle className="btn-icon" />
                Leave Queue
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="join-queue-section">
          <h3>Join a Queue</h3>
          <div className="stations-grid">
            {stations.map((station) => (
              <div key={station.id} className="station-card">
                <div className="station-header">
                  <div className="station-info">
                    <MapPin className="station-icon" />
                    <div>
                      <h4>{station.name}</h4>
                      <p className="station-location">{station.location}</p>
                    </div>
                  </div>
                  <div className="station-status">
                    <div className="queue-length">
                      <span className="queue-number">{station.queueLength || 0}</span>
                      <span className="queue-label">in queue</span>
                    </div>
                  </div>
                </div>
                
                <div className="station-stats">
                  <div className="stat">
                    <Clock className="stat-icon" />
                    <span>~{station.averageWaitTime || 30}m wait</span>
                  </div>
                  <div className="stat">
                    <Activity className="stat-icon" />
                    <span>{station.activeCoordinators || 1} coordinator</span>
                  </div>
                </div>
                
                <button 
                  className="join-btn"
                  onClick={() => {
                    setSelectedStation(station.id);
                    setShowJoinQueue(true);
                  }}
                >
                  Join Queue
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-section">
          <h3>Recent Notifications</h3>
          <div className="notifications-list">
            {notifications.slice(0, 3).map((notification, index) => (
              <div key={index} className={`notification-item ${notification.type}`}>
                <div className="notification-icon">
                  {notification.type === 'success' ? 
                    <CheckCircle className="icon" /> : 
                    <AlertCircle className="icon" />
                  }
                </div>
                <div className="notification-content">
                  <div className="notification-text">{notification.message}</div>
                  <div className="notification-time">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Join Queue Modal */}
      {showJoinQueue && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Join Queue</h3>
              <button 
                className="close-btn"
                onClick={() => setShowJoinQueue(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              joinQueue(selectedStation);
            }} className="join-queue-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input
                    type="text"
                    value={joinQueueForm.vehicleNumber}
                    onChange={(e) => setJoinQueueForm({
                      ...joinQueueForm,
                      vehicleNumber: e.target.value
                    })}
                    placeholder="e.g., B123 ABC"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Service Type</label>
                  <select
                    value={joinQueueForm.serviceType}
                    onChange={(e) => setJoinQueueForm({
                      ...joinQueueForm,
                      serviceType: e.target.value
                    })}
                  >
                    <option value="combi">Combi</option>
                    <option value="taxi">Taxi</option>
                    <option value="bus">Bus</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Route</label>
                  <input
                    type="text"
                    value={joinQueueForm.route}
                    onChange={(e) => setJoinQueueForm({
                      ...joinQueueForm,
                      route: e.target.value
                    })}
                    placeholder="e.g., Gaborone - Tlokweng"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Destination</label>
                  <input
                    type="text"
                    value={joinQueueForm.destination}
                    onChange={(e) => setJoinQueueForm({
                      ...joinQueueForm,
                      destination: e.target.value
                    })}
                    placeholder="e.g., Tlokweng"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Capacity</label>
                  <input
                    type="number"
                    value={joinQueueForm.capacity}
                    onChange={(e) => setJoinQueueForm({
                      ...joinQueueForm,
                      capacity: e.target.value
                    })}
                    placeholder="e.g., 14"
                    min="1"
                    max="50"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={joinQueueForm.specialService}
                      onChange={(e) => setJoinQueueForm({
                        ...joinQueueForm,
                        specialService: e.target.checked
                      })}
                    />
                    <span>Available for special service</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Joining...' : 'Join Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverOperatorDashboard;
