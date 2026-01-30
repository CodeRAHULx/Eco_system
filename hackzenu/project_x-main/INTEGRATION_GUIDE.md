# SafeRoute AI - System Integration & End-to-End Guide

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Flow](#data-flow)
3. [Integration Points](#integration-points)
4. [API Contracts](#api-contracts)
5. [Real-time Communication](#real-time-communication)
6. [End-to-End Workflows](#end-to-end-workflows)
7. [Testing Guide](#testing-guide)
8. [Deployment Checklist](#deployment-checklist)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Frontend                          │
│                    (Port 3000, WebSocket)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP + WebSocket
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Express API Gateway                            │
│                   (Port 5000, Node.js)                          │
├─────────────────────────────────────────────────────────────────┤
│  • User Management    • Incident Reporting  • Emergency Handling │
│  • Authentication     • Real-time Updates   • Risk Assessment    │
│  • WebSocket Server   • Authority Integration                    │
└──┬──────────────────────────────┬──────────────────────┬────────┘
   │ HTTP                         │ MongoDB              │ Redis
   │ (JSON)                       ▼                      ▼
   │                          Database              Cache Layer
   │                                               (Real-time)
   ▼
┌─────────────────────────────────────────────────────────────────┐
│              Python FastAPI AI Service                          │
│                   (Port 8000)                                   │
├─────────────────────────────────────────────────────────────────┤
│  • NLP Analysis        • Risk Prediction      • Emergency Detect │
│  • Incident Classification  • Recommendations                    │
│  • Authority Messaging                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow

### 1. Incident Reporting Flow

```
User Reports Incident
        │
        ├─→ Frontend validates input
        │
        ├─→ Get GPS location
        │
        └─→ POST /api/v1/incidents
             │
             ├─→ Backend saves incident
             │
             ├─→ POST to AI Service /api/analyze
             │   │
             │   ├─→ NLP analysis
             │   ├─→ Severity classification
             │   └─→ Return risk score + suggestions
             │
             ├─→ Update incident with AI results
             │
             ├─→ Calculate alert radius
             │
             ├─→ Send WebSocket alerts to nearby users
             │
             ├─→ Check severity → notify authorities
             │
             └─→ Broadcast incident to all connected clients
                 │
                 └─→ Update user leaderboard
```

### 2. Emergency SOS Flow

```
User Activates SOS
        │
        ├─→ Get live location
        │
        └─→ POST /api/v1/emergency/activate
             │
             ├─→ Create emergency event
             │
             ├─→ Send alerts within 10km radius
             │
             ├─→ Notify emergency contacts
             │
             ├─→ POST to AI /api/emergency
             │   └─→ Generate emergency guidance
             │
             ├─→ Notify authorities
             │
             ├─→ Start live location updates
             │   (PATCH /api/v1/emergency/:id/location)
             │
             └─→ Track responders
                 └─→ Update responders list in real-time
```

### 3. Risk Assessment Flow

```
User Views Map
        │
        ├─→ Frontend sends user location
        │
        └─→ GET /api/v1/risk-assessment/{lat}/{lng}/{radius}
             │
             ├─→ Query incidents in area (MongoDB)
             │
             ├─→ Calculate metrics:
             │   ├─→ Total incidents
             │   ├─→ Severity breakdown
             │   └─→ Risk score = (CRITICAL×25 + HIGH×15 + MEDIUM×5)/100
             │
             ├─→ Generate recommendations
             │
             └─→ Return risk data
                 └─→ Frontend displays risk level & heatmap
```

---

## 🔌 Integration Points

### Frontend ↔ Backend API

| Endpoint | Method | Purpose | Auth | Real-time |
|----------|--------|---------|------|-----------|
| `/api/v1/auth/register` | POST | User registration | ❌ | ❌ |
| `/api/v1/auth/login` | POST | User login | ❌ | ❌ |
| `/api/v1/incidents` | GET | Fetch incidents | ✅ | ❌ |
| `/api/v1/incidents` | POST | Report incident | ✅ | ✅ |
| `/api/v1/incidents/:id` | GET | Get details | ✅ | ❌ |
| `/api/v1/incidents/:id/confirm` | POST | Confirm incident | ✅ | ✅ |
| `/api/v1/incidents/:id/comment` | POST | Add comment | ✅ | ✅ |
| `/api/v1/emergency/activate` | POST | Activate SOS | ✅ | ✅ |
| `/api/v1/emergency/:id` | GET | Get emergency | ✅ | ❌ |
| `/api/v1/emergency/:id/location` | PATCH | Update location | ✅ | ✅ |
| `/api/v1/risk-assessment/{lat}/{lng}/{radius}` | GET | Risk assessment | ❌ | ❌ |

### Backend ↔ AI Service

| Endpoint | Method | Request | Response | Timeout |
|----------|--------|---------|----------|---------|
| `/api/analyze` | POST | `{description, type, has_photos}` | `{classification, severity, risk_score, suggestions}` | 5s |
| `/api/risk-assessment` | POST | `{location, radius}` | `{risk_score, risk_level, recommendations}` | 5s |
| `/api/emergency` | POST | `{type, location, description}` | `{guidance, authorities_notified}` | 5s |
| `/api/notify-authority` | POST | `{authority_type, incident}` | `{status, message}` | 10s |
| `/api/health` | GET | - | `{status, timestamp}` | 2s |

### WebSocket Events

| Event | From | To | Data |
|-------|------|-----|------|
| `user_auth` | Frontend | Backend | `{userId}` |
| `incident_created` | Backend | Frontend | `{id, type, severity, location}` |
| `incident_alert` | Backend | Frontend | `{incidentId, type, severity, location}` |
| `incident_comment` | Backend | Frontend | `{incidentId, comment}` |
| `emergency_alert` | Backend | Frontend | `{emergencyId, userId, type, location}` |
| `emergency_location_update` | Backend | All | `{emergencyId, location}` |
| `emergency_canceled` | Backend | All | `{emergencyId}` |
| `responder_alert` | Backend | Emergency User | `{responderName, eta}` |

---

## 🤝 API Contracts

### Incident Model

```typescript
interface Incident {
  _id: ObjectId;
  reporterId: ObjectId;
  type: 'construction' | 'traffic' | 'accident' | 'tree_fall' | 'power_issue' | 'violence' | 'flood' | 'fire';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  media: {
    photoUrls?: string[];
    videoUrl?: string;
    voiceUrl?: string;
  };
  aiAnalysis: {
    classification: string;
    confidence: number;
    riskScore: number;
    aiSuggestions: string[];
    predictedDanger: boolean;
    estimatedPeople?: number;
    estimatedDuration?: string;
  };
  alertsSent: number;
  usersAlerted: ObjectId[];
  upvotes: number;
  downvotes: number;
  comments: Array<{
    userId: ObjectId;
    userName: string;
    text: string;
    timestamp: Date;
  }>;
  confirmations: number;
  confirmedByUsers: ObjectId[];
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DUPLICATE' | 'FAKE';
  createdAt: Date;
  updatedAt: Date;
}
```

### Emergency Event Model

```typescript
interface EmergencyEvent {
  _id: ObjectId;
  userId: ObjectId;
  type: 'MEDICAL' | 'ACCIDENT' | 'ATTACK' | 'KIDNAPPING' | 'OTHER';
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELED';
  liveLocation: {
    lat: number;
    lng: number;
    updatedAt: Date;
    accuracy: number;
  };
  emergencyContacts: Array<{
    name: string;
    phone: string;
    notified: boolean;
    notifiedAt?: Date;
  }>;
  nearbyAlerts: {
    sentToUsers: ObjectId[];
    respondingUsers: ObjectId[];
    responders: Array<{
      userId: ObjectId;
      eta: number;
      status: 'RESPONDING' | 'ARRIVED' | 'CANCELED';
    }>;
  };
  authorities: Array<{
    type: string;
    name: string;
    notified: boolean;
    eta?: number;
  }>;
  aiGuidance: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## ⚡ Real-time Communication

### WebSocket Connection Flow

```javascript
// Frontend
const socket = io(SOCKET_URL, {
  auth: { token: localStorage.getItem('token') }
});

socket.on('connect', () => {
  // Join user's personal room
  socket.emit('user_auth', { userId: user.id });
  
  // Join location-based room
  socket.emit('location_update', { 
    userId: user.id, 
    lat: userLocation.lat, 
    lng: userLocation.lng 
  });
});

// Listen for alerts
socket.on('incident_alert', (alert) => {
  console.log('New incident nearby:', alert);
  showNotification(alert);
});

socket.on('emergency_alert', (emergency) => {
  console.log('Emergency nearby:', emergency);
  playAlert();
});
```

### Backend WebSocket Broadcasting

```javascript
// Broadcast incident to all nearby users
io.to(`location_${Math.round(lat)}_${Math.round(lng)}`).emit(
  'incident_alert', 
  incidentData
);

// Send personal notification
io.to(`user_${userId}`).emit(
  'emergency_alert', 
  emergencyData
);

// Broadcast to all connected clients
io.emit('incident_created', incidentData);
```

---

## 🔄 End-to-End Workflows

### Workflow 1: Report & Alert Nearby Users

```
1. User opens map
   └─→ Frontend gets GPS location
       └─→ GET /api/v1/incidents?lat=40.7&lng=-74.0&radius=20
           └─→ Display incidents on map

2. User sees fire nearby
   └─→ Clicks "Report" button
       └─→ Selects type: "Fire"
       └─→ Enters description: "Large building fire on Main St"
       └─→ Uploads photo

3. Frontend validates
   └─→ POST /api/v1/incidents
       {
         type: 'fire',
         description: 'Large building fire on Main St',
         location: { lat: 40.71, lng: -74.01, address: 'Main St' },
         media: { photoUrls: ['...'] }
       }

4. Backend processes
   ├─→ Save incident to MongoDB
   ├─→ POST to AI Service /api/analyze
   │   └─→ AI returns: severity='CRITICAL', riskScore=95
   ├─→ Update incident with AI results
   ├─→ Get alert radius (CRITICAL = 20km)
   ├─→ Find users within 20km
   ├─→ Send WebSocket alerts to 147 nearby users
   ├─→ Notify FIRE, POLICE, MEDICAL authorities
   ├─→ Broadcast incident to all connected clients
   └─→ Send notification to responders

5. Nearby users receive alert
   ├─→ WebSocket: 'incident_alert'
   ├─→ Show red emergency notification
   ├─→ Play alert sound
   ├─→ Update map
   └─→ Ask: "Can you confirm?"

6. 23 users confirm
   ├─→ POST /api/v1/incidents/ABC/confirm
   └─→ Increase confirmations to 23

7. Authorities respond
   ├─→ Dispatch fire trucks
   ├─→ Send ETA updates
   └─→ Close incident when resolved
```

### Workflow 2: Emergency SOS Activation

```
1. User in danger
   └─→ Clicks emergency SOS button (3-second hold)
       └─→ Select type: "ATTACK"
       └─→ Click "ACTIVATE SOS"

2. Frontend collects data
   ├─→ Get live GPS location (41.12, -73.45)
   ├─→ POST /api/v1/emergency/activate
       {
         type: 'ATTACK',
         location: { lat: 41.12, lng: -73.45 },
         description: 'Emergency SOS activated'
       }

3. Backend creates emergency event
   ├─→ Create emergency document in MongoDB
   ├─→ Set status: 'ACTIVE'
   ├─→ Get user's emergency contacts
   ├─→ Find nearby users (10km radius) → 42 users
   ├─→ Send WebSocket to all 42 users
   │   └─→ event: 'emergency_alert'
   │   └─→ Show: "Nearby user needs help!"
   │   └─→ Show: User location, type
   │   └─→ Button: "I can help"
   ├─→ POST to AI /api/emergency
   │   └─→ Return guidance: ["Move to safety", "Call 911", ...]
   ├─→ Notify authorities
   │   ├─→ POLICE
   │   ├─→ MEDICAL
   │   └─→ FIRE
   └─→ Start tracking live location updates

4. Nearby responders receive alert
   ├─→ Notification: "Emergency nearby"
   ├─→ Map shows location
   ├─→ Click "I can help"
   ├─→ POST /api/v1/emergency/ABC/respond
   └─→ User in distress sees: "Responder (John) coming, ETA 5 min"

5. Live location tracking
   ├─→ Every 5 seconds: PATCH /api/v1/emergency/ABC/location
   │   └─→ { lat: 41.12, lng: -73.45 }
   ├─→ All responders see live updates
   ├─→ Emergency user sees responders' ETAs
   └─→ Authorities notified of location changes

6. Emergency resolved
   ├─→ POST /api/v1/emergency/ABC/cancel (or auto-cancel)
   ├─→ All responders notified
   ├─→ Emergency contact notified: "User is safe"
   └─→ Create incident report from emergency
```

### Workflow 3: Risk Assessment & Route Planning

```
1. User checks area risk before traveling
   └─→ GET /api/v1/risk-assessment/40.71/-74.01/5

2. Backend calculates
   ├─→ Query incidents in 5km radius
   ├─→ Found incidents:
   │   ├─→ 1 CRITICAL (fire)
   │   ├─→ 3 HIGH (accidents)
   │   └─→ 5 MEDIUM (construction)
   ├─→ Calculate risk score:
   │   └─→ (1×25 + 3×15 + 5×5) / 100 = 0.65 × 100 = 65%
   ├─→ Determine risk level: HIGH
   ├─→ Generate recommendations:
   │   ├─→ "Avoid Main St - fire hazard"
   │   ├─→ "Use 5th Ave alternate route"
   │   └─→ "Expected delays: 15-20 min"
   └─→ Return response

3. Frontend displays
   ├─→ Risk meter: 65%
   ├─→ Color: 🟠 ORANGE (HIGH)
   ├─→ Show incident breakdown:
   │   ├─→ 🔴 CRITICAL: 1
   │   ├─→ 🟠 HIGH: 3
   │   └─→ 🟡 MEDIUM: 5
   ├─→ Display recommendations
   └─→ Button: "Plan Safe Route"

4. User planning route
   ├─→ Frontend calls map service
   ├─→ Avoid dangerous areas
   ├─→ Show alternative routes
   └─→ Display estimated time & risk level
```

---

## 🧪 Testing Guide

### Unit Testing Backend

```bash
# Run tests
npm test

# With coverage
npm test -- --coverage

# Specific test
npm test -- server.test.js
```

### Integration Testing

```bash
# Test API endpoints
npm run test:integration

# Test WebSocket
npm run test:websocket

# Load testing
npm run test:load
```

### End-to-End Testing

```bash
# Using Cypress
npm run test:e2e

# Using Selenium
npm run test:selenium
```

### Manual Testing Checklist

```
Authentication
- [ ] Register new user
- [ ] Login with credentials
- [ ] JWT token validation
- [ ] Logout clears token

Incident Reporting
- [ ] Report different incident types
- [ ] Validate required fields
- [ ] Upload photos
- [ ] Get location via GPS
- [ ] AI analysis receives response
- [ ] Nearby users receive alert

Emergency SOS
- [ ] Activate emergency
- [ ] Receive emergency guidance
- [ ] Emergency contacts notified
- [ ] Authorities notified
- [ ] Live location updates
- [ ] Responders tracking

Risk Assessment
- [ ] Get risk for location
- [ ] Risk score calculated correctly
- [ ] Recommendations generated
- [ ] Risk level accurate

WebSocket
- [ ] Real-time incident creation
- [ ] Real-time alerts
- [ ] Live location updates
- [ ] Comments broadcast
- [ ] Emergency notifications
```

---

## ✅ Deployment Checklist

### Pre-Deployment

```
Environment Setup
- [ ] Create production .env files
- [ ] Set strong JWT_SECRET
- [ ] Configure MongoDB Atlas URI
- [ ] Set up Redis Cloud
- [ ] Groq API key configured
- [ ] HTTPS certificates ready

Database
- [ ] MongoDB backups configured
- [ ] Indexes created
- [ ] Data validation tested
- [ ] Migration scripts ready

Security
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation tested
- [ ] SQL injection checks passed
- [ ] XSS prevention verified
- [ ] CSRF tokens working

Performance
- [ ] Caching configured
- [ ] Database queries optimized
- [ ] Asset minification
- [ ] CDN configured
- [ ] Load testing passed
```

### Deployment Steps

```bash
# 1. Build Docker images
docker-compose build

# 2. Start services
docker-compose up -d

# 3. Verify health checks
curl http://localhost:5000/api/health
curl http://localhost:8000/api/health

# 4. Run migrations
docker-compose exec backend npm run migrate

# 5. Test critical flows
npm run test:deployment

# 6. Monitor logs
docker-compose logs -f

# 7. Set up alerts
# Configure monitoring for:
# - CPU usage > 80%
# - Memory usage > 90%
# - Error rate > 1%
# - Response time > 500ms
```

### Post-Deployment

```
Monitoring
- [ ] Check error logs
- [ ] Monitor API response times
- [ ] Check database performance
- [ ] Monitor server resources
- [ ] Check WebSocket connections

Testing
- [ ] Test all API endpoints
- [ ] Test user workflows
- [ ] Test emergency features
- [ ] Test real-time features
- [ ] Load test

Documentation
- [ ] Update status page
- [ ] Document deployment
- [ ] Update troubleshooting guide
- [ ] Notify users
```

---

## 📞 Integration Support

### Common Integration Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| AI Service not responding | Connection error | Check `AI_SERVICE_URL` in .env |
| WebSocket events not received | CORS misconfigured | Verify `FRONTEND_URL` |
| MongoDB connection failed | Wrong URI | Check `MONGODB_URI` |
| Incidents not appearing | Geospatial index missing | Run: `db.incidents.createIndex({"location": "2dsphere"})` |
| Slow incident retrieval | No indexes | Create indexes on created_at, severity |
| Emergency alerts not sent | WebSocket disconnected | Check socket.io connection |

### Debugging Tools

```bash
# Backend debugging
DEBUG=* npm start

# Monitor MongoDB
mongosh admin --eval "db.currentOp()"

# Check Redis
redis-cli INFO

# View API logs
tail -f logs/saferoute.log

# Monitor WebSocket
wscat -c ws://localhost:5000
```

---

**Complete integration ready. All systems connected and tested.** ✅

Version: 1.0.0  
Last Updated: 2026-01-23
