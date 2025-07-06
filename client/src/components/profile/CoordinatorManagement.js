// client/src/components/profile/CoordinatorManagement.js
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, MapPin, Users, Clock, Phone, Mail, Check, X, 
  Plus, Edit2, Trash2, Star, AlertCircle, Activity, Save,
  UserCheck, Timer, Navigation, Car, CheckCircle
} from 'lucide-react';
import axios from '../../config/axios.js';
import './CoordinatorManagement.css';

const CoordinatorManagement = ({ profileData, refreshProfile }) => {
  const [coordinatorProfile, setCoordinatorProfile] = useState(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showStationForm, setShowStationForm] = useState(false);
  const [queueData, setQueueData] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    phone: '',
    email: '',
    experience: '',
    stations: [],
    workingHours: {
      start: '06:00',
      end: '20:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    specializations: [],
    about: ''
  });

  const [stationForm, setStationForm] = useState({
    name: '',
    location: '',
    routes: [],
    capacity: 10,
    operatingHours: {
      start: '05:00',
      end: '22:00'
    }
  });

  // Available stations in Botswana
  const availableStations = [
    'Gaborone Bus Rank',
    'Francistown Bus Station',
    'Maun Bus Station',
    'Palapye Bus Rank',
    'Mahalapye Bus Station',
    'Serowe Bus Rank',
    'Molepolole Bus Station',
    'Kanye Bus Rank',
    'Mochudi Bus Station',
    'Tlokweng Bus Rank'
  ];

  const specializations = [
    'Combi Coordination',
    'Taxi Management',
    'Express Bus Services',
    'Cross-Border Transport',
    'Tourist Transport',
    'School Transport',
    'Medical Transport',
    'Goods Transport'
  ];

  useEffect(() => {
    fetchCoordinatorProfile();
    fetchStations();
  }, [profileData]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const fetchCoordinatorProfile = async () => {
    try {
      const response = await axios.get('/coordinator/profile');
      if (response.data.success) {
        setCoordinatorProfile(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching coordinator profile:', error);
    }
  };

  const fetchStations = async () => {
    try {
      const response = await axios.get('/coordinator/stations');
      if (response.data.success) {
        setStations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post('/coordinator/register', registrationForm);
      if (response.data.success) {
        setCoordinatorProfile(response.data.data);
        setShowRegistrationForm(false);
        showMessage('success', 'Coordinator profile registered successfully!');
        refreshProfile();
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStationSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post('/coordinator/stations', stationForm);
      if (response.data.success) {
        setStations([...stations, response.data.data]);
        setStationForm({
          name: '',
          location: '',
          routes: [],
          capacity: 10,
          operatingHours: { start: '05:00', end: '22:00' }
        });
        setShowStationForm(false);
        showMessage('success', 'Station added successfully!');
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to add station');
    } finally {
      setLoading(false);
    }
  };

  const updateQueuePosition = async (stationId, vehicleId, newPosition) => {
    try {
      const response = await axios.put(`/coordinator/queue/${stationId}`, {
        vehicleId,
        position: newPosition
      });
      if (response.data.success) {
        setQueueData(prev => ({
          ...prev,
          [stationId]: response.data.data
        }));
        showMessage('success', 'Queue updated successfully!');
      }
    } catch (error) {
      showMessage('error', 'Failed to update queue');
    }
  };

  const getQueueForStation = (stationId) => {
    return queueData[stationId] || [];
  };

  // If not a coordinator, show registration option
  if (!coordinatorProfile) {
    return (
      <div className="coordinator-management">
        <div className="coordinator-header">
          <div className="header-content">
            <BookOpen className="header-icon" />
            <div>
              <h2>Become a Transport Coordinator</h2>
              <p>Manage loading stations and coordinate transport queues digitally</p>
            </div>
          </div>
        </div>

        <div className="coordinator-benefits">
          <h3>Why Become a Coordinator?</h3>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">📱</div>
              <h4>Digital Queue Management</h4>
              <p>Replace your paper book with digital queue tracking</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">💰</div>
              <h4>Earn Income</h4>
              <p>Get paid for coordinating transport at busy stations</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">⭐</div>
              <h4>Build Reputation</h4>
              <p>Earn ratings and build trust with operators and passengers</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🚐</div>
              <h4>Help Transport</h4>
              <p>Improve efficiency and reduce waiting times</p>
            </div>
          </div>
        </div>

        <div className="registration-section">
          <button 
            className="register-btn"
            onClick={() => setShowRegistrationForm(true)}
          >
            <Plus className="btn-icon" />
            Register as Coordinator
          </button>
        </div>

        {/* Registration Form Modal */}
        {showRegistrationForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Register as Transport Coordinator</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowRegistrationForm(false)}
                >
                  <X className="close-icon" />
                </button>
              </div>
              
              <form onSubmit={handleRegistrationSubmit} className="registration-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={registrationForm.name}
                    onChange={(e) => setRegistrationForm({
                      ...registrationForm,
                      name: e.target.value
                    })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={registrationForm.phone}
                      onChange={(e) => setRegistrationForm({
                        ...registrationForm,
                        phone: e.target.value
                      })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={registrationForm.email}
                      onChange={(e) => setRegistrationForm({
                        ...registrationForm,
                        email: e.target.value
                      })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    value={registrationForm.experience}
                    onChange={(e) => setRegistrationForm({
                      ...registrationForm,
                      experience: e.target.value
                    })}
                    min="0"
                    max="50"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Stations You Want to Coordinate</label>
                  <div className="stations-grid">
                    {availableStations.map((station) => (
                      <label key={station} className="station-checkbox">
                        <input
                          type="checkbox"
                          checked={registrationForm.stations.includes(station)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRegistrationForm({
                                ...registrationForm,
                                stations: [...registrationForm.stations, station]
                              });
                            } else {
                              setRegistrationForm({
                                ...registrationForm,
                                stations: registrationForm.stations.filter(s => s !== station)
                              });
                            }
                          }}
                        />
                        <span className="checkbox-label">{station}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Specializations</label>
                  <div className="specializations-grid">
                    {specializations.map((spec) => (
                      <label key={spec} className="specialization-checkbox">
                        <input
                          type="checkbox"
                          checked={registrationForm.specializations.includes(spec)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRegistrationForm({
                                ...registrationForm,
                                specializations: [...registrationForm.specializations, spec]
                              });
                            } else {
                              setRegistrationForm({
                                ...registrationForm,
                                specializations: registrationForm.specializations.filter(s => s !== spec)
                              });
                            }
                          }}
                        />
                        <span className="checkbox-label">{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>About Yourself</label>
                  <textarea
                    value={registrationForm.about}
                    onChange={(e) => setRegistrationForm({
                      ...registrationForm,
                      about: e.target.value
                    })}
                    rows="4"
                    placeholder="Tell us about your experience and why you want to be a coordinator..."
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Registering...' : 'Register as Coordinator'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Coordinator dashboard
  return (
    <div className="coordinator-management">
      <div className="coordinator-header">
        <div className="header-content">
          <UserCheck className="header-icon" />
          <div>
            <h2>Coordinator Dashboard</h2>
            <p>Manage your stations and coordinate transport queues</p>
          </div>
        </div>
        <div className="coordinator-stats">
          <div className="stat-item">
            <div className="stat-value">{coordinatorProfile.rating || 4.5}</div>
            <div className="stat-label">Rating</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stations.length}</div>
            <div className="stat-label">Stations</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{coordinatorProfile.experience || 5}</div>
            <div className="stat-label">Years</div>
          </div>
        </div>
      </div>

      {/* Active Stations */}
      <div className="active-stations">
        <div className="section-header">
          <h3>Your Stations</h3>
          <button 
            className="add-station-btn"
            onClick={() => setShowStationForm(true)}
          >
            <Plus className="btn-icon" />
            Add Station
          </button>
        </div>

        <div className="stations-grid">
          {stations.map((station, index) => (
            <div key={index} className="station-card">
              <div className="station-header">
                <div className="station-info">
                  <MapPin className="station-icon" />
                  <div>
                    <h4>{station.name}</h4>
                    <p className="station-location">{station.location}</p>
                  </div>
                </div>
                <div className="station-status">
                  <div className="status-indicator active">
                    <div className="status-dot"></div>
                    <span>Active</span>
                  </div>
                </div>
              </div>

              <div className="station-stats">
                <div className="stat">
                  <Car className="stat-icon" />
                  <span>{getQueueForStation(station.id).length} in queue</span>
                </div>
                <div className="stat">
                  <Clock className="stat-icon" />
                  <span>{station.operatingHours?.start} - {station.operatingHours?.end}</span>
                </div>
                <div className="stat">
                  <Users className="stat-icon" />
                  <span>Capacity: {station.capacity}</span>
                </div>
              </div>

              {/* Queue Management */}
              <div className="queue-management">
                <h5>Current Queue</h5>
                {getQueueForStation(station.id).length > 0 ? (
                  <div className="queue-list">
                    {getQueueForStation(station.id).map((vehicle, queueIndex) => (
                      <div key={queueIndex} className="queue-item">
                        <div className="queue-position">#{queueIndex + 1}</div>
                        <div className="vehicle-info">
                          <span className="vehicle-name">{vehicle.name}</span>
                          <span className="vehicle-route">{vehicle.route}</span>
                        </div>
                        <div className="queue-actions">
                          <button
                            className="load-btn"
                            onClick={() => updateQueuePosition(station.id, vehicle.id, 'loading')}
                          >
                            <CheckCircle className="btn-icon" />
                            Load
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-queue">No vehicles in queue</p>
                )}
              </div>

              <div className="station-actions">
                <button className="action-btn primary">
                  <Activity className="btn-icon" />
                  Manage Queue
                </button>
                <button className="action-btn secondary">
                  <Edit2 className="btn-icon" />
                  Edit Station
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle className="message-icon" /> : <AlertCircle className="message-icon" />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
};

export default CoordinatorManagement;
