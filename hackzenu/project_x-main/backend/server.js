/**
 * SafeRoute AI - Backend Server
 * ==============================
 * Main Express server with all API endpoints
 * 
 * Features:
 * - User authentication & management
 * - Real-time incident reporting
 * - Emergency mode handling
 * - Authority integration
 * - Real-time WebSocket updates
 * - Database connection
 * 
 * Author: AI Assistant
 * Version: 1.0.0
 * Last Updated: 2026-01-23
 */

// ============================================================================
// DEPENDENCIES
// ============================================================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createServer } = require('http');
const { Server } = require('socket.io');
const redis = require('redis');
const axios = require('axios');

// Load environment variables
dotenv.config();

// ============================================================================
// INITIALIZATION
// ============================================================================

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Redis client for caching
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redisClient.connect().catch(err => console.error('Redis connection error:', err));

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saferoute';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

connectDatabase();

// ============================================================================
// DATABASE SCHEMAS
// ============================================================================

/**
 * User Schema
 * Stores user profile, authentication, and preferences
 */
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // bcrypt hashed
  name: { type: String, required: true },
  phone: { type: String },
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  role: {
    type: String,
    enum: ['user', 'authority', 'admin'],
    default: 'user'
  },
  trustScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },
  reportsCount: { type: Number, default: 0 },
  credibilityRating: { type: Number, default: 0 },
  emergencyContacts: [{
    name: String,
    phone: String,
    email: String
  }],
  preferences: {
    alertRadius: { type: Number, default: 10 }, // km
    notificationTypes: [String],
    pushEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * Incident Report Schema
 * Stores reported incidents with AI analysis
 */
const incidentSchema = new mongoose.Schema({
  reporterId: mongoose.Schema.Types.ObjectId,
  type: {
    type: String,
    enum: ['construction', 'traffic', 'accident', 'tree_fall', 'power_issue', 'violence', 'flood', 'fire'],
    required: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  description: String,
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: String
  },
  media: {
    photoUrls: [String],
    videoUrl: String,
    voiceUrl: String
  },
  
  // AI Analysis results
  aiAnalysis: {
    classification: String,
    confidence: Number,
    riskScore: { type: Number, default: 0 },
    aiSuggestions: [String],
    predictedDanger: { type: Boolean, default: false },
    estimatedPeople: Number,
    estimatedDuration: String // e.g., "2-4 hours"
  },
  
  // Community engagement
  alertsSent: { type: Number, default: 0 },
  usersAlerted: [mongoose.Schema.Types.ObjectId],
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  comments: [{
    userId: mongoose.Schema.Types.ObjectId,
    userName: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
  }],
  confirmations: { type: Number, default: 0 },
  confirmedByUsers: [mongoose.Schema.Types.ObjectId],
  
  // Authority response
  authoritiesNotified: [{
    type: String, // POLICE, FIRE, MEDICAL, MUNICIPAL, ELECTRICITY
    notified: Boolean,
    notifiedAt: Date,
    responseId: String
  }],
  
  // Status
  status: {
    type: String,
    enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'DUPLICATE', 'FAKE'],
    default: 'OPEN'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * Emergency Event Schema
 * Handles emergency mode with live tracking
 */
const emergencySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: {
    type: String,
    enum: ['MEDICAL', 'ACCIDENT', 'ATTACK', 'KIDNAPPING', 'OTHER'],
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'RESOLVED', 'CANCELED'],
    default: 'ACTIVE'
  },
  
  // Live location tracking
  liveLocation: {
    lat: Number,
    lng: Number,
    updatedAt: { type: Date, default: Date.now },
    accuracy: Number
  },
  
  // Emergency contacts
  emergencyContacts: [{
    name: String,
    phone: String,
    notified: { type: Boolean, default: false },
    notifiedAt: Date
  }],
  
  // Nearby responders
  nearbyAlerts: {
    sentToUsers: [mongoose.Schema.Types.ObjectId],
    respondingUsers: [mongoose.Schema.Types.ObjectId],
    responders: [{
      userId: mongoose.Schema.Types.ObjectId,
      eta: Number, // minutes
      status: String, // RESPONDING, ARRIVED, CANCELED
      arrivedAt: Date
    }]
  },
  
  // Authority response
  authorities: [{
    type: String,
    name: String,
    notified: { type: Boolean, default: false },
    eta: Number, // minutes
    responseId: String,
    arrived: { type: Boolean, default: false }
  }],
  
  // AI guidance
  aiGuidance: [String],
  
  // Description
  description: String,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

/**
 * Risk Analysis Schema
 * Stores location-based risk assessments
 */
const riskAnalysisSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['TRAFFIC', 'ACCIDENT', 'VIOLENCE', 'NATURAL', 'INFRASTRUCTURE'],
    required: true
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  
  // Historical data
  historicalData: {
    incidentsCount: { type: Number, default: 0 },
    averageSeverity: Number,
    timePatterns: [{
      hour: Number,
      frequency: Number
    }],
    dayPatterns: [{
      dayOfWeek: Number,
      frequency: Number
    }]
  },
  
  // Current assessment
  currentRiskScore: { type: Number, default: 0 },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  predictedTrend: {
    type: String,
    enum: ['INCREASING', 'STABLE', 'DECREASING'],
    default: 'STABLE'
  },
  
  // Recommendations
  recommendations: [String],
  
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Incident = mongoose.model('Incident', incidentSchema);
const Emergency = mongoose.model('Emergency', emergencySchema);
const RiskAnalysis = mongoose.model('RiskAnalysis', riskAnalysisSchema);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
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

/**
 * Generate JWT token
 */
function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  } catch (error) {
    return null;
  }
}

/**
 * Authentication middleware
 */
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.userId = decoded.userId;
  next();
}

/**
 * Get alert radius based on severity
 */
function getAlertRadius(severity) {
  const radii = {
    'LOW': 5,
    'MEDIUM': 10,
    'HIGH': 15,
    'CRITICAL': 20
  };
  return radii[severity] || 10;
}

/**
 * Send alerts to nearby users via WebSocket and notifications
 */
async function sendNearbyAlerts(incidentId, lat, lng, severity, type) {
  try {
    // Get alert radius
    const radius = getAlertRadius(severity);
    
    // Find nearby users
    const users = await User.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: radius * 1000 // convert to meters
        }
      }
    });
    
    // Send WebSocket alert to each user
    users.forEach(user => {
      io.to(`user_${user._id}`).emit('incident_alert', {
        incidentId,
        type,
        severity,
        location: { lat, lng },
        timestamp: new Date()
      });
    });
    
    // Update alert count
    await Incident.findByIdAndUpdate(incidentId, {
      $set: {
        alertsSent: users.length,
        usersAlerted: users.map(u => u._id)
      }
    });
    
    console.log(`📡 Alert sent to ${users.length} users`);
  } catch (error) {
    console.error('Error sending alerts:', error);
  }
}

/**
 * Call AI service for incident analysis
 */
async function analyzeIncidentWithAI(incident) {
  try {
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/analyze`,
      {
        description: incident.description,
        type: incident.type,
        hasPhotos: !!incident.media?.photoUrls?.length
      },
      { timeout: 5000 }
    );
    
    return response.data;
  } catch (error) {
    console.error('AI analysis error:', error.message);
    return { riskScore: 50, suggestions: ['Emergency services notified'] };
  }
}

/**
 * Notify authorities based on severity
 */
async function notifyAuthorities(incident) {
  const authorities = {
    'accident': ['POLICE', 'MEDICAL'],
    'fire': ['FIRE', 'POLICE'],
    'violence': ['POLICE', 'MEDICAL'],
    'flood': ['MUNICIPAL', 'FIRE'],
    'power_issue': ['ELECTRICITY', 'MUNICIPAL'],
    'tree_fall': ['MUNICIPAL', 'FIRE'],
    'construction': ['MUNICIPAL'],
    'traffic': ['POLICE']
  };
  
  const relevantAuthorities = authorities[incident.type] || ['POLICE'];
  
  for (const authType of relevantAuthorities) {
    try {
      // In real scenario, this would call actual authority APIs
      console.log(`📞 Notifying ${authType} about incident: ${incident._id}`);
      
      // Send to AI service for authority notification
      await axios.post(
        `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/notify-authority`,
        {
          incidentId: incident._id,
          authorityType: authType,
          incident: {
            type: incident.type,
            severity: incident.severity,
            location: incident.location,
            description: incident.description
          }
        }
      );
    } catch (error) {
      console.error(`Error notifying ${authType}:`, error.message);
    }
  }
}

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    
    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      phone,
      location: { lat: 0, lng: 0 }
    });
    
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/v1/auth/login
 * Login user
 */
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================================================
// USER ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/users/profile
 * Get user profile
 */
app.get('/api/v1/users/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/v1/users/profile
 * Update user profile
 */
app.put('/api/v1/users/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, location, emergencyContacts, preferences } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        name: name || undefined,
        phone: phone || undefined,
        location: location || undefined,
        emergencyContacts: emergencyContacts || undefined,
        preferences: preferences || undefined,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');
    
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/v1/users/trust-score
 * Get user trust score
 */
app.get('/api/v1/users/trust-score', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({
      trustScore: user.trustScore,
      reportsCount: user.reportsCount,
      credibilityRating: user.credibilityRating
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trust score' });
  }
});

// ============================================================================
// INCIDENT REPORTING ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/incidents
 * Create new incident report
 */
app.post('/api/v1/incidents', authMiddleware, async (req, res) => {
  try {
    const { type, description, location, media } = req.body;
    
    // Validation
    if (!type || !location || !location.lat || !location.lng) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create incident
    const incident = new Incident({
      reporterId: req.userId,
      type,
      description,
      location,
      media
    });
    
    await incident.save();
    
    // Analyze with AI in background
    const aiAnalysis = await analyzeIncidentWithAI(incident);
    
    // Update severity based on AI analysis
    const severityMap = {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
      critical: 'CRITICAL'
    };
    
    incident.severity = severityMap[aiAnalysis.severity?.toLowerCase()] || 'MEDIUM';
    incident.aiAnalysis = {
      riskScore: aiAnalysis.riskScore || 50,
      aiSuggestions: aiAnalysis.suggestions || [],
      classification: aiAnalysis.classification || type,
      confidence: aiAnalysis.confidence || 0.7,
      estimatedPeople: aiAnalysis.estimatedPeople,
      estimatedDuration: aiAnalysis.estimatedDuration
    };
    
    await incident.save();
    
    // Send alerts to nearby users
    await sendNearbyAlerts(
      incident._id,
      location.lat,
      location.lng,
      incident.severity,
      type
    );
    
    // Notify authorities if high severity
    if (incident.severity === 'HIGH' || incident.severity === 'CRITICAL') {
      await notifyAuthorities(incident);
    }
    
    // Update user's report count
    await User.findByIdAndUpdate(req.userId, {
      $inc: { reportsCount: 1 }
    });
    
    // Broadcast to all connected clients
    io.emit('incident_created', {
      id: incident._id,
      type: incident.type,
      severity: incident.severity,
      location: incident.location,
      timestamp: incident.createdAt
    });
    
    res.status(201).json({
      message: 'Incident reported successfully',
      incident
    });
  } catch (error) {
    console.error('Incident creation error:', error);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

/**
 * GET /api/v1/incidents
 * Get all incidents with filters
 */
app.get('/api/v1/incidents', async (req, res) => {
  try {
    const { lat, lng, radius = 20, status = 'OPEN', severity } = req.query;
    
    let filter = {};
    
    // Status filter
    if (status) {
      filter.status = status;
    }
    
    // Severity filter
    if (severity) {
      filter.severity = severity;
    }
    
    // Location-based filter
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // meters
        }
      };
    }
    
    const incidents = await Incident.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
    
    res.json({
      count: incidents.length,
      incidents
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

/**
 * GET /api/v1/incidents/:id
 * Get incident details
 */
app.get('/api/v1/incidents/:id', async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

/**
 * PATCH /api/v1/incidents/:id/status
 * Update incident status
 */
app.patch('/api/v1/incidents/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    res.json({ message: 'Status updated', incident });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * POST /api/v1/incidents/:id/confirm
 * Add confirmation to incident
 */
app.post('/api/v1/incidents/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { confirmations: 1 },
        $addToSet: { confirmedByUsers: req.userId }
      },
      { new: true }
    );
    
    res.json({ message: 'Confirmation added', incident });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm' });
  }
});

/**
 * POST /api/v1/incidents/:id/comment
 * Add comment to incident
 */
app.post('/api/v1/incidents/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const user = await User.findById(req.userId);
    
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            userId: req.userId,
            userName: user.name,
            text,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );
    
    // Broadcast comment to all connected users
    io.emit('incident_comment', {
      incidentId: req.params.id,
      comment: {
        userId: req.userId,
        userName: user.name,
        text,
        timestamp: new Date()
      }
    });
    
    res.json({ message: 'Comment added', incident });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// ============================================================================
// EMERGENCY ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/emergency/activate
 * Trigger emergency mode
 */
app.post('/api/v1/emergency/activate', authMiddleware, async (req, res) => {
  try {
    const { type, location, description } = req.body;
    
    // Create emergency event
    const emergency = new Emergency({
      userId: req.userId,
      type,
      location,
      description,
      status: 'ACTIVE'
    });
    
    await emergency.save();
    
    // Get user's emergency contacts
    const user = await User.findById(req.userId);
    if (user.emergencyContacts) {
      emergency.emergencyContacts = user.emergencyContacts;
    }
    
    // Send alerts to nearby users
    const radius = 10; // 10km for emergency
    const nearbyUsers = await User.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat]
          },
          $maxDistance: radius * 1000
        }
      }
    });
    
    // Notify nearby users
    nearbyUsers.forEach(u => {
      io.to(`user_${u._id}`).emit('emergency_alert', {
        emergencyId: emergency._id,
        userId: req.userId,
        userName: user.name,
        type,
        location,
        timestamp: new Date()
      });
    });
    
    // Notify emergency contacts
    nearbyUsers.forEach(u => {
      emergency.nearbyAlerts.sentToUsers.push(u._id);
    });
    
    // Notify authorities
    await axios.post(
      `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/emergency`,
      {
        emergencyId: emergency._id,
        userId: req.userId,
        type,
        location,
        description
      }
    ).catch(err => console.error('AI notification error:', err.message));
    
    await emergency.save();
    
    res.status(201).json({
      message: 'Emergency activated',
      emergency
    });
  } catch (error) {
    console.error('Emergency activation error:', error);
    res.status(500).json({ error: 'Failed to activate emergency' });
  }
});

/**
 * GET /api/v1/emergency/:id
 * Get emergency details
 */
app.get('/api/v1/emergency/:id', async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id);
    if (!emergency) {
      return res.status(404).json({ error: 'Emergency not found' });
    }
    res.json(emergency);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emergency' });
  }
});

/**
 * PATCH /api/v1/emergency/:id/location
 * Update emergency location
 */
app.patch('/api/v1/emergency/:id/location', async (req, res) => {
  try {
    const { lat, lng, accuracy } = req.body;
    
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      {
        'liveLocation.lat': lat,
        'liveLocation.lng': lng,
        'liveLocation.accuracy': accuracy,
        'liveLocation.updatedAt': new Date()
      },
      { new: true }
    );
    
    // Broadcast location update to responders
    io.emit('emergency_location_update', {
      emergencyId: req.params.id,
      location: { lat, lng }
    });
    
    res.json({ message: 'Location updated', emergency });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

/**
 * POST /api/v1/emergency/:id/cancel
 * Cancel emergency
 */
app.post('/api/v1/emergency/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      { status: 'CANCELED', updatedAt: new Date() },
      { new: true }
    );
    
    io.emit('emergency_canceled', { emergencyId: req.params.id });
    
    res.json({ message: 'Emergency canceled', emergency });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel emergency' });
  }
});

/**
 * POST /api/v1/emergency/:id/respond
 * Respond to emergency as nearby user
 */
app.post('/api/v1/emergency/:id/respond', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    const emergency = await Emergency.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: { 'nearbyAlerts.respondingUsers': req.userId },
        $push: {
          'nearbyAlerts.responders': {
            userId: req.userId,
            eta: 5, // Default 5 minutes
            status: 'RESPONDING'
          }
        }
      },
      { new: true }
    );
    
    // Notify emergency user
    io.to(`user_${emergency.userId}`).emit('responder_alert', {
      emergencyId: req.params.id,
      responderName: user.name,
      responderPhone: user.phone,
      eta: 5
    });
    
    res.json({ message: 'Response recorded', emergency });
  } catch (error) {
    res.status(500).json({ error: 'Failed to respond to emergency' });
  }
});

// ============================================================================
// RISK ANALYSIS ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/risk-assessment/:lat/:lng/:radius
 * Get risk assessment for area
 */
app.get('/api/v1/risk-assessment/:lat/:lng/:radius', async (req, res) => {
  try {
    const { lat, lng, radius } = req.params;
    
    // Get incidents in area
    const incidents = await Incident.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000
        }
      }
    });
    
    // Calculate risk metrics
    const totalIncidents = incidents.length;
    const criticalCount = incidents.filter(i => i.severity === 'CRITICAL').length;
    const highCount = incidents.filter(i => i.severity === 'HIGH').length;
    const mediumCount = incidents.filter(i => i.severity === 'MEDIUM').length;
    
    // Risk score calculation
    let riskScore = (criticalCount * 25 + highCount * 15 + mediumCount * 5) / 100;
    riskScore = Math.min(100, Math.round(riskScore * 100));
    
    const riskLevel = riskScore < 30 ? 'LOW' : 
                     riskScore < 60 ? 'MEDIUM' : 
                     riskScore < 80 ? 'HIGH' : 'CRITICAL';
    
    res.json({
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radius: parseFloat(radius),
      riskScore,
      riskLevel,
      incidentsCount: totalIncidents,
      breakdown: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: incidents.filter(i => i.severity === 'LOW').length
      },
      recommendations: generateRecommendations(riskLevel, incidents)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assess risk' });
  }
});

/**
 * Generate recommendations based on risk level
 */
function generateRecommendations(riskLevel, incidents) {
  const recommendations = [];
  
  if (riskLevel === 'CRITICAL') {
    recommendations.push('Avoid this area if possible');
    recommendations.push('Use alternative routes');
    recommendations.push('Stay alert and aware');
  } else if (riskLevel === 'HIGH') {
    recommendations.push('Proceed with caution');
    recommendations.push('Be aware of surroundings');
  } else if (riskLevel === 'MEDIUM') {
    recommendations.push('Normal precautions recommended');
  }
  
  // Add specific recommendations based on incident types
  const incidentTypes = new Set(incidents.map(i => i.type));
  if (incidentTypes.has('accident')) {
    recommendations.push('Watch for traffic accidents');
  }
  if (incidentTypes.has('fire')) {
    recommendations.push('Fire hazard detected');
  }
  if (incidentTypes.has('violence')) {
    recommendations.push('Security concerns reported');
  }
  
  return recommendations;
}

// ============================================================================
// REAL-TIME WEBSOCKET HANDLING
// ============================================================================

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  
  // User joins personal room
  socket.on('user_auth', (data) => {
    socket.join(`user_${data.userId}`);
    console.log(`User ${data.userId} joined personal room`);
  });
  
  // User joins location room for nearby alerts
  socket.on('location_update', (data) => {
    const { userId, lat, lng } = data;
    socket.join(`location_${Math.round(lat)}_${Math.round(lng)}`);
  });
  
  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/**
 * Global error handler
 */
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════╗
  ║   SafeRoute AI - Backend Server   ║
  ║         Server Running             ║
  ╚═══════════════════════════════════╝
  
  🚀 Server: http://localhost:${PORT}
  📦 API Version: v1
  🗄️ Database: MongoDB
  ⚡ Real-time: WebSocket
  
  Endpoints ready:
  • /api/v1/auth/register
  • /api/v1/auth/login
  • /api/v1/incidents
  • /api/v1/emergency
  • /api/v1/risk-assessment
  • /api/v1/users
  
  Health check: GET /api/health
  `);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = { app, io };
