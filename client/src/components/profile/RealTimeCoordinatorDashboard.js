// client/src/components/profile/RealTimeCoordinatorDashboard.js
import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, Car, MapPin, CheckCircle, XCircle, 
  ArrowUp, ArrowDown, Zap, DollarSign, Phone, 
  Play, Pause, RotateCcw, AlertTriangle, Activity,
  Plus, Edit2, Eye, BarChart3, Timer, Navigation
} from 'lucide-react';
import axios from '../../config/axios.js';
import './RealTimeCoordinatorDashboard.css';

const RealTimeCoordinatorDashboard = ({ profileData, stationId }) => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    totalProcessed: 0,
    averageWaitTime: 0,
    specialRequests: 0,
    knockOffs: 0
  });

  const [newVehicle, setNewVehicle] = useState({
    operatorName: '',
    vehicleNumber: '',
    route: '',
    destination: '',
    capacity: '',
    serviceType: 'combi',
    contactNumber: ''
  });

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch queue data
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [stationId]);

  const fetchQueue = async () => {
    try {
      const response = await axios.get(`/coordinator/queue/${stationId}`);
      if (response.data.success) {
        setQueue(response.data.data);
        calculateStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  const calculateStats = (queueData) => {
    const today = new Date().toDateString();
    const todayEntries = queueData.filter(entry => 
      new Date(entry.arrivalTime).toDateString() === today
    );
    
    const processed = todayEntries.filter(entry => 
      entry.status === 'loaded' || entry.status === 'knocked_off'
    ).length;
    
    const specials = todayEntries.filter(entry => 
      entry.specialRequest
    ).length;
    
    const knockOffs = todayEntries.filter(entry => 
      entry.status === 'knocked_off'
    ).length;

    setStats({
      totalProcessed: processed,
      averageWaitTime: 25, // Mock calculation
      specialRequests: specials,
      knockOffs: knockOffs
    });
  };

  const addVehicleToQueue = async (vehicleData) => {
    try {
      setLoading(true);
      const response = await axios.post(`/coordinator/queue/${stationId}/add`, {
        ...vehicleData,
        arrivalTime: new Date(),
        status: 'waiting',
        position: queue.length + 1
      });
      
      if (response.data.success) {
        fetchQueue();
        setShowAddVehicle(false);
        setNewVehicle({
          operatorName: '',
          vehicleNumber: '',
          route: '',
          destination: '',
          capacity: '',
          serviceType: 'combi',
          contactNumber: ''
        });
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVehicleStatus = async (vehicleId, newStatus, additionalData = {}) => {
    try {
      setLoading(true);
      const response = await axios.put(`/coordinator/queue/${stationId}/update`, {
        vehicleId,
        status: newStatus,
        timestamp: new Date(),
        ...additionalData
      });
      
      if (response.data.success) {
        fetchQueue();
      }
    } catch (error) {
      console.error('Error updating vehicle status:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsLoading = (vehicleId) => {
    updateVehicleStatus(vehicleId, 'loading', { loadingStartTime: new Date() });
  };

  const markAsLoaded = (vehicleId) => {
    updateVehicleStatus(vehicleId, 'loaded', { 
      loadingEndTime: new Date(),
      departureTime: new Date()
    });
  };

  const markAsKnockedOff = (vehicleId) => {
    updateVehicleStatus(vehicleId, 'knocked_off', { 
      knockOffTime: new Date(),
      knockOffReason: 'End of shift'
    });
  };

  const markAsSpecial = (vehicleId) => {
    updateVehicleStatus(vehicleId, 'special', { 
      specialRequestTime: new Date(),
      specialRequest: true
    });
  };

  const moveVehicleUp = async (vehicleId) => {
    try {
      const response = await axios.put(`/coordinator/queue/${stationId}/move`, {
        vehicleId,
        direction: 'up'
      });
      if (response.data.success) {
        fetchQueue();
      }
    } catch (error) {
      console.error('Error moving vehicle:', error);
    }
  };

  const moveVehicleDown = async (vehicleId) => {
    try {
      const response = await axios.put(`/coordinator/queue/${stationId}/move`, {
        vehicleId,
        direction: 'down'
      });
      if (response.data.success) {
        fetchQueue();
      }
    } catch (error) {
      console.error('Error moving vehicle:', error);
    }
  };

  const getWaitTime = (arrivalTime) => {
    const now = new Date();
    const arrival = new Date(arrivalTime);
    const diffMinutes = Math.floor((now - arrival) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return '#f39c12';
      case 'loading': return '#3498db';
      case 'loaded': return '#27ae60';
      case 'knocked_off': return '#e74c3c';
      case 'special': return '#9b59b6';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting': return <Clock className="status-icon" />;
      case 'loading': return <Activity className="status-icon" />;
      case 'loaded': return <CheckCircle className="status-icon" />;
      case 'knocked_off': return <XCircle className="status-icon" />;
      case 'special': return <Zap className="status-icon" />;
      default: return <Clock className="status-icon" />;
    }
  };

  const waitingQueue = queue.filter(v => v.status === 'waiting');
  const loadingQueue = queue.filter(v => v.status === 'loading');
  const completedToday = queue.filter(v => 
    (v.status === 'loaded' || v.status === 'knocked_off') && 
    new Date(v.arrivalTime).toDateString() === new Date().toDateString()
  );

  return (
    <div className="realtime-coordinator-dashboard">
      {/* Header with Stats */}
      <div className="dashboard-header">
        <div className="header-info">
          <h2>Queue Management Dashboard</h2>
          <div className="current-time">
            <Clock className="time-icon" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.totalProcessed}</div>
            <div className="stat-label">Processed Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.averageWaitTime}m</div>
            <div className="stat-label">Avg Wait Time</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.specialRequests}</div>
            <div className="stat-label">Special Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.knockOffs}</div>
            <div className="stat-label">Knock Offs</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="action-button primary"
          onClick={() => setShowAddVehicle(true)}
        >
          <Plus className="btn-icon" />
          Add Vehicle to Queue
        </button>
        <button className="action-button secondary">
          <BarChart3 className="btn-icon" />
          View Reports
        </button>
        <button className="action-button secondary">
          <Eye className="btn-icon" />
          Public Display
        </button>
      </div>

      {/* Current Queue */}
      <div className="queue-sections">
        {/* Waiting Queue */}
        <div className="queue-section">
          <div className="section-header">
            <h3>Waiting Queue ({waitingQueue.length})</h3>
            <div className="queue-controls">
              <button className="control-btn" onClick={fetchQueue}>
                <RotateCcw className="btn-icon" />
                Refresh
              </button>
            </div>
          </div>
          
          <div className="queue-list">
            {waitingQueue.map((vehicle, index) => (
              <div key={vehicle.id} className="queue-item waiting">
                <div className="queue-position">#{index + 1}</div>
                
                <div className="vehicle-info">
                  <div className="vehicle-primary">
                    <span className="vehicle-name">{vehicle.operatorName}</span>
                    <span className="vehicle-number">{vehicle.vehicleNumber}</span>
                  </div>
                  <div className="vehicle-secondary">
                    <span className="vehicle-route">{vehicle.route}</span>
                    <span className="vehicle-type">{vehicle.serviceType}</span>
                  </div>
                  <div className="vehicle-meta">
                    <span className="wait-time">
                      <Timer className="meta-icon" />
                      {getWaitTime(vehicle.arrivalTime)}
                    </span>
                    <span className="capacity">
                      <Users className="meta-icon" />
                      {vehicle.capacity} seats
                    </span>
                  </div>
                </div>

                <div className="vehicle-actions">
                  <button 
                    className="action-btn move-up"
                    onClick={() => moveVehicleUp(vehicle.id)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="btn-icon" />
                  </button>
                  <button 
                    className="action-btn move-down"
                    onClick={() => moveVehicleDown(vehicle.id)}
                    disabled={index === waitingQueue.length - 1}
                  >
                    <ArrowDown className="btn-icon" />
                  </button>
                  <button 
                    className="action-btn loading"
                    onClick={() => markAsLoading(vehicle.id)}
                  >
                    <Play className="btn-icon" />
                    Start Loading
                  </button>
                  <button 
                    className="action-btn special"
                    onClick={() => markAsSpecial(vehicle.id)}
                  >
                    <Zap className="btn-icon" />
                    Special
                  </button>
                  <button 
                    className="action-btn knock-off"
                    onClick={() => markAsKnockedOff(vehicle.id)}
                  >
                    <XCircle className="btn-icon" />
                    Knock Off
                  </button>
                </div>
              </div>
            ))}
            
            {waitingQueue.length === 0 && (
              <div className="empty-queue">
                <Car className="empty-icon" />
                <p>No vehicles waiting in queue</p>
              </div>
            )}
          </div>
        </div>

        {/* Loading Queue */}
        <div className="queue-section">
          <div className="section-header">
            <h3>Currently Loading ({loadingQueue.length})</h3>
          </div>
          
          <div className="queue-list">
            {loadingQueue.map((vehicle) => (
              <div key={vehicle.id} className="queue-item loading">
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <span>Loading...</span>
                </div>
                
                <div className="vehicle-info">
                  <div className="vehicle-primary">
                    <span className="vehicle-name">{vehicle.operatorName}</span>
                    <span className="vehicle-number">{vehicle.vehicleNumber}</span>
                  </div>
                  <div className="vehicle-secondary">
                    <span className="vehicle-route">{vehicle.route}</span>
                    <span className="loading-time">
                      Loading for {getWaitTime(vehicle.loadingStartTime)}
                    </span>
                  </div>
                </div>

                <div className="vehicle-actions">
                  <button 
                    className="action-btn loaded"
                    onClick={() => markAsLoaded(vehicle.id)}
                  >
                    <CheckCircle className="btn-icon" />
                    Mark as Loaded
                  </button>
                  <button 
                    className="action-btn knock-off"
                    onClick={() => markAsKnockedOff(vehicle.id)}
                  >
                    <XCircle className="btn-icon" />
                    Knock Off
                  </button>
                </div>
              </div>
            ))}
            
            {loadingQueue.length === 0 && (
              <div className="empty-queue">
                <Activity className="empty-icon" />
                <p>No vehicles currently loading</p>
              </div>
            )}
          </div>
        </div>

        {/* Completed Today */}
        <div className="queue-section completed">
          <div className="section-header">
            <h3>Completed Today ({completedToday.length})</h3>
          </div>
          
          <div className="completed-summary">
            {completedToday.slice(0, 5).map((vehicle) => (
              <div key={vehicle.id} className="completed-item">
                <div 
                  className="status-dot" 
                  style={{ backgroundColor: getStatusColor(vehicle.status) }}
                ></div>
                <span className="vehicle-name">{vehicle.operatorName}</span>
                <span className="completion-time">
                  {new Date(vehicle.departureTime || vehicle.knockOffTime).toLocaleTimeString()}
                </span>
                <span className="status-badge">{vehicle.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {showAddVehicle && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Vehicle to Queue</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddVehicle(false)}
              >
                <XCircle className="close-icon" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              addVehicleToQueue(newVehicle);
            }} className="add-vehicle-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Operator Name</label>
                  <input
                    type="text"
                    value={newVehicle.operatorName}
                    onChange={(e) => setNewVehicle({
                      ...newVehicle,
                      operatorName: e.target.value
                    })}
                    placeholder="e.g., John's Transport"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Vehicle Number</label>
                  <input
                    type="text"
                    value={newVehicle.vehicleNumber}
                    onChange={(e) => setNewVehicle({
                      ...newVehicle,
                      vehicleNumber: e.target.value
                    })}
                    placeholder="e.g., B123 ABC"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Route</label>
                  <input
                    type="text"
                    value={newVehicle.route}
                    onChange={(e) => setNewVehicle({
                      ...newVehicle,
                      route: e.target.value
                    })}
                    placeholder="e.g., Gaborone - Tlokweng"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Service Type</label>
                  <select
                    value={newVehicle.serviceType}
                    onChange={(e) => setNewVehicle({
                      ...newVehicle,
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
                  <label>Capacity</label>
                  <input
                    type="number"
                    value={newVehicle.capacity}
                    onChange={(e) => setNewVehicle({
                      ...newVehicle,
                      capacity: e.target.value
                    })}
                    placeholder="e.g., 14"
                    min="1"
                    max="50"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="tel"
                    value={newVehicle.contactNumber}
                    onChange={(e) => setNewVehicle({
                      ...newVehicle,
                      contactNumber: e.target.value
                    })}
                    placeholder="+267 7xxx xxxx"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Adding...' : 'Add to Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeCoordinatorDashboard;
