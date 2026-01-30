/**
 * SafeRoute AI - React Frontend
 * =============================
 * Main React application with all UI components
 * 
 * Features:
 * - Real-time incident map
 * - Report incident form
 * - Emergency SOS button
 * - User authentication
 * - Risk assessment dashboard
 * - Nearby alerts
 * - Authority response tracking
 * 
 * Author: AI Assistant
 * Version: 1.0.0
 * Last Updated: 2026-01-23
 */

// ==============================================================================
// DEPENDENCIES
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './styles.css';

// ==============================================================================
// CONFIGURATION
// ==============================================================================

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const AI_SERVICE_URL = process.env.REACT_APP_AI_URL || 'http://localhost:8000';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * API request wrapper with auth token
 */
async function apiRequest(method, endpoint, data = null) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  try {
    const config = { headers };
    
    let response;
    if (method === 'GET') {
      response = await axios.get(`${API_BASE_URL}${endpoint}`, config);
    } else if (method === 'POST') {
      response = await axios.post(`${API_BASE_URL}${endpoint}`, data, config);
    } else if (method === 'PUT') {
      response = await axios.put(`${API_BASE_URL}${endpoint}`, data, config);
    } else if (method === 'PATCH') {
      response = await axios.patch(`${API_BASE_URL}${endpoint}`, data, config);
    }
    
    return response.data;
  } catch (error) {
    console.error(`API error: ${error.message}`);
    throw error;
  }
}

/**
 * Get user location
 */
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => reject(error)
      );
    } else {
      reject(new Error('Geolocation not supported'));
    }
  });
}

/**
 * Calculate distance between coordinates
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ==============================================================================
// COMPONENTS
// ==============================================================================

/**
 * Navigation Bar Component
 */
function NavigationBar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>🚨 SafeRoute AI</h1>
        </div>
        <div className="navbar-menu">
          <a href="#map">Map</a>
          <a href="#report">Report</a>
          <a href="#dashboard">Dashboard</a>
          {user && (
            <>
              <span className="user-name">{user.name}</span>
              <button onClick={onLogout} className="logout-btn">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

/**
 * Authentication Component
 */
function AuthComponent({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/register';
      const payload = isLogin 
        ? { email, password }
        : { email, password, name };
      
      const response = await apiRequest('POST', endpoint, payload);
      
      // Store token
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      onAuthSuccess(response.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <p>
          {isLogin ? "Don't have account? " : 'Already have account? '}
          <button 
            type="button"
            className="link-btn"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}

/**
 * Incident Report Form Component
 */
function ReportIncidentForm({ onSubmit }) {
  const [type, setType] = useState('accident');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGetLocation = async () => {
    try {
      setLoading(true);
      const loc = await getUserLocation();
      setLocation(loc);
      setError('');
    } catch (err) {
      setError('Could not get location. Please enable location access.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!location) {
      setError('Please share your location');
      return;
    }
    
    setLoading(true);
    
    try {
      await onSubmit({
        type,
        description,
        location
      });
      
      setSuccess('✅ Incident reported successfully!');
      setDescription('');
      setLocation(null);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to report incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-form">
      <h2>📝 Report Incident</h2>
      
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Incident Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="construction">🚧 Construction</option>
            <option value="traffic">🚦 Traffic</option>
            <option value="accident">🚗 Accident</option>
            <option value="tree_fall">🌳 Tree Fall</option>
            <option value="power_issue">⚡ Power Issue</option>
            <option value="violence">⚠️ Violence</option>
            <option value="flood">🌊 Flood</option>
            <option value="fire">🔥 Fire</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the incident in detail..."
            required
          />
        </div>
        
        <div className="form-group">
          <label>Location</label>
          {location ? (
            <div className="location-display">
              ✅ Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              <button type="button" onClick={handleGetLocation}>Change</button>
            </div>
          ) : (
            <button 
              type="button" 
              onClick={handleGetLocation}
              disabled={loading}
            >
              📍 {loading ? 'Getting location...' : 'Share Location'}
            </button>
          )}
        </div>
        
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Reporting...' : 'Report Incident'}
        </button>
      </form>
    </div>
  );
}

/**
 * Incident List Component
 */
function IncidentList({ incidents, userLocation, onSelectIncident }) {
  return (
    <div className="incident-list">
      <h2>📍 Nearby Incidents</h2>
      
      {incidents.length === 0 ? (
        <p className="empty-state">No incidents reported in this area</p>
      ) : (
        <div className="incidents">
          {incidents.map((incident) => {
            const distance = userLocation 
              ? calculateDistance(
                  userLocation.lat, 
                  userLocation.lng, 
                  incident.location.lat, 
                  incident.location.lng
                ).toFixed(1)
              : null;
            
            const severityClass = `severity-${incident.severity.toLowerCase()}`;
            
            return (
              <div 
                key={incident._id} 
                className={`incident-card ${severityClass}`}
                onClick={() => onSelectIncident(incident)}
              >
                <div className="incident-header">
                  <h3>{incident.type}</h3>
                  <span className={`badge ${incident.severity.toLowerCase()}`}>
                    {incident.severity}
                  </span>
                </div>
                
                <p className="incident-desc">{incident.description}</p>
                
                <div className="incident-footer">
                  {distance && <span>📍 {distance} km away</span>}
                  <span>⬆️ {incident.upvotes || 0} | ⬇️ {incident.downvotes || 0}</span>
                </div>
                
                {incident.aiAnalysis && (
                  <div className="ai-analysis">
                    <small>
                      🤖 Risk Score: {incident.aiAnalysis.riskScore}
                    </small>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Emergency SOS Button Component
 */
function EmergencySOS({ onActivate }) {
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState('MEDICAL');
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    setLoading(true);
    try {
      const location = await getUserLocation();
      await onActivate({
        type,
        location,
        description: 'Emergency SOS activated'
      });
      setShowModal(false);
    } catch (error) {
      alert('Failed to activate emergency');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emergency-container">
      <button 
        className="emergency-btn"
        onClick={() => setShowModal(true)}
        title="Hold down for 3 seconds in real app"
      >
        🚨<br/>SOS
      </button>
      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>🚨 EMERGENCY SOS</h2>
            <p>Select emergency type:</p>
            
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="MEDICAL">🏥 Medical</option>
              <option value="ACCIDENT">🚗 Accident</option>
              <option value="ATTACK">⚠️ Under Attack</option>
              <option value="KIDNAPPING">👤 Kidnapping</option>
              <option value="OTHER">❓ Other</option>
            </select>
            
            <div className="modal-buttons">
              <button 
                onClick={handleActivate}
                disabled={loading}
                className="btn-danger"
              >
                {loading ? 'Activating...' : 'ACTIVATE SOS'}
              </button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Risk Dashboard Component
 */
function RiskDashboard({ location, onRiskUpdate }) {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location) {
      fetchRiskAssessment();
    }
  }, [location]);

  const fetchRiskAssessment = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(
        'GET',
        `/api/v1/risk-assessment/${location.lat}/${location.lng}/10`
      );
      setRiskData(response);
      onRiskUpdate(response);
    } catch (error) {
      console.error('Risk assessment error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!riskData) {
    return <div className="risk-dashboard">Loading risk assessment...</div>;
  }

  const riskClass = `risk-${riskData.riskLevel.toLowerCase()}`;

  return (
    <div className={`risk-dashboard ${riskClass}`}>
      <h2>📊 Risk Assessment</h2>
      
      <div className="risk-score">
        <div className="score-circle">{Math.round(riskData.riskScore)}</div>
        <p className={`risk-level ${riskData.riskLevel.toLowerCase()}`}>
          {riskData.riskLevel}
        </p>
      </div>
      
      <div className="risk-breakdown">
        <h3>Incidents in Area</h3>
        <p>Critical: {riskData.breakdown?.critical || 0}</p>
        <p>High: {riskData.breakdown?.high || 0}</p>
        <p>Medium: {riskData.breakdown?.medium || 0}</p>
        <p>Low: {riskData.breakdown?.low || 0}</p>
      </div>
      
      <div className="recommendations">
        <h3>Recommendations</h3>
        {riskData.recommendations?.map((rec, idx) => (
          <p key={idx}>✓ {rec}</p>
        ))}
      </div>
      
      <button onClick={fetchRiskAssessment}>Refresh</button>
    </div>
  );
}

/**
 * Main App Component
 */
function App() {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [riskData, setRiskData] = useState(null);
  const [socket, setSocket] = useState(null);
  const [selectedTab, setSelectedTab] = useState('map');

  // Initialize
  useEffect(() => {
    // Check if user is logged in
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Setup WebSocket
  useEffect(() => {
    if (user) {
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem('token')
        }
      });
      
      newSocket.on('incident_created', (incident) => {
        console.log('New incident:', incident);
        fetchIncidents();
      });
      
      newSocket.on('incident_alert', (data) => {
        console.log('Alert received:', data);
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('SafeRoute Alert', {
            body: `${data.type} incident nearby!`,
            icon: '🚨'
          });
        }
      });
      
      setSocket(newSocket);
      
      return () => newSocket.disconnect();
    }
  }, [user]);

  // Get user location periodically
  useEffect(() => {
    if (user) {
      getUserLocation()
        .then(setUserLocation)
        .catch(err => console.error('Location error:', err));
      
      // Update location every 30 seconds
      const interval = setInterval(() => {
        getUserLocation()
          .then(setUserLocation)
          .catch(err => console.error('Location error:', err));
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Fetch incidents
  const fetchIncidents = async () => {
    if (userLocation) {
      try {
        const response = await apiRequest(
          'GET',
          `/api/v1/incidents?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=20`
        );
        setIncidents(response.incidents || []);
      } catch (error) {
        console.error('Failed to fetch incidents:', error);
      }
    }
  };

  // Fetch incidents when location changes
  useEffect(() => {
    if (userLocation && user) {
      fetchIncidents();
    }
  }, [userLocation]);

  const handleReportIncident = async (incidentData) => {
    try {
      await apiRequest('POST', '/api/v1/incidents', incidentData);
      fetchIncidents();
    } catch (error) {
      throw error;
    }
  };

  const handleEmergencySOS = async (emergencyData) => {
    try {
      await apiRequest('POST', '/api/v1/emergency/activate', emergencyData);
      alert('🚨 Emergency SOS activated! Help is on the way.');
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIncidents([]);
  };

  if (!user) {
    return <AuthComponent onAuthSuccess={setUser} />;
  }

  return (
    <div className="app">
      <NavigationBar user={user} onLogout={handleLogout} />
      
      <div className="app-container">
        <div className="sidebar">
          <EmergencySOS onActivate={handleEmergencySOS} />
          
          <div className="tabs">
            <button 
              className={selectedTab === 'map' ? 'active' : ''}
              onClick={() => setSelectedTab('map')}
            >
              📍 Map
            </button>
            <button 
              className={selectedTab === 'report' ? 'active' : ''}
              onClick={() => setSelectedTab('report')}
            >
              📝 Report
            </button>
            <button 
              className={selectedTab === 'risk' ? 'active' : ''}
              onClick={() => setSelectedTab('risk')}
            >
              📊 Risk
            </button>
          </div>
          
          {selectedTab === 'map' && (
            <IncidentList 
              incidents={incidents}
              userLocation={userLocation}
              onSelectIncident={(incident) => {
                console.log('Selected:', incident);
              }}
            />
          )}
          
          {selectedTab === 'report' && (
            <ReportIncidentForm onSubmit={handleReportIncident} />
          )}
          
          {selectedTab === 'risk' && userLocation && (
            <RiskDashboard 
              location={userLocation}
              onRiskUpdate={setRiskData}
            />
          )}
        </div>
        
        <div className="main-content">
          <div className="map-placeholder">
            <h2>🗺️ SafeRoute Map</h2>
            <p>Location: {userLocation?.lat.toFixed(4)}, {userLocation?.lng.toFixed(4)}</p>
            <p>Incidents found: {incidents.length}</p>
            {riskData && (
              <p>Risk Level: <span className={riskData.riskLevel.toLowerCase()}>{riskData.riskLevel}</span></p>
            )}
            
            <div className="incidents-mini">
              {incidents.slice(0, 5).map(inc => (
                <div key={inc._id} className="incident-mini">
                  <span>{inc.type}</span>
                  <span className={`badge ${inc.severity.toLowerCase()}`}>{inc.severity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// RENDER APP
// ==============================================================================

ReactDOM.render(<App />, document.getElementById('root'));

export default App;
