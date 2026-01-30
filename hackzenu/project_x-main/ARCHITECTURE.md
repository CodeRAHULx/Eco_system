# 🏗️ EcoHub Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ECOHUB PLATFORM (v1.0)                    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
    ┌───▼────┐          ┌───▼────┐          ┌───▼────┐
    │Frontend │          │Backend │          │ AI/ML  │
    │(Streamlit)         │(Python)         │(Groq)  │
    └────────┘          └────────┘          └────────┘
        │                     │                     │
        │              ┌──────▼──────┐              │
        │              │   Database  │              │
        │              │  (JSON)     │              │
        │              └─────────────┘              │
        │                     │
        └─────────────────────┼─────────────────────┘
```

---

## Module Architecture

### 1. Recycling Module

```
Recycling Module
├── Database
│   └── recycling_records.json
│       ├── user_id
│       ├── item_name
│       ├── category
│       ├── weight
│       └── points
├── Features
│   ├── Log Item
│   │   ├── Category Selection
│   │   ├── Weight Input
│   │   └── AI Advice Generation
│   ├── Find Facilities
│   │   ├── GPS Location
│   │   ├── Distance Calculation
│   │   └── Facility Filtering
│   └── Statistics
│       ├── Personal Stats
│       ├── Category Breakdown
│       └── Leaderboard
└── AI Integration
    ├── Recycling Advice
    ├── Environmental Impact Calc
    └── Facility Recommendations
```

### 2. Road Safety Module

```
Road Safety Module
├── Database
│   ├── data.json (incidents)
│   ├── users.json (profiles)
│   └── authority_alerts.log
├── Features
│   ├── Report Incident
│   │   ├── Type Selection
│   │   ├── Location GPS
│   │   ├── Description Input
│   │   └── Auto Authority Alert
│   ├── Emergency SOS
│   │   ├── One-Click Send
│   │   ├── Location Share
│   │   ├── Nearby User Alert
│   │   └── Emergency Guidance
│   ├── View Incidents
│   │   ├── Filter by Type
│   │   ├── Filter by Severity
│   │   ├── Distance Display
│   │   └── Sort Options
│   └── Analytics
│       ├── Incident Breakdown
│       ├── Hotspot Detection
│       └── Trend Analysis
└── AI Integration
    ├── Risk Analysis
    ├── Emergency Response
    ├── Pattern Detection
    └── Authority Recommendations
```

---

## Data Flow Diagrams

### Recycling Item Logging Flow

```
User Input (Item Details)
        │
        ▼
Validate Input
        │
        ▼
Calculate Points
        │
        ▼
Calculate Environmental Impact
        │
        ▼
Save to Database
        │
        ▼
Generate AI Advice
        │
        ▼
Display Results
        │
        ▼
Update Leaderboard
```

### Incident Reporting Flow

```
User Reports Incident
        │
        ▼
Validate & Geocode
        │
        ▼
Calculate Severity
        │
        ├─────────────────────┐
        │                     │
    Low/Medium          Critical/Injured
        │                     │
        │                     ▼
        │              Send to Authorities
        │                     │
        ▼                     ▼
Save to Database ◄─────────────┘
        │
        ▼
Get Nearby Users (10km radius)
        │
        ▼
Send Alert to Nearby Users
        │
        ▼
Generate AI Risk Analysis
        │
        ▼
Display to User
```

### Emergency SOS Flow

```
User Presses SOS
        │
        ▼
Get Location & Details
        │
        ▼
Create Emergency Record
        │
        ▼
Mark as CRITICAL
        │
        ▼
IMMEDIATELY Send to Authorities
        │
        ▼
Get Nearby Users (2km radius)
        │
        ▼
Send Emergency Alert
        │
        ▼
Generate Emergency Response Steps (AI)
        │
        ▼
Share Location with Responders
        │
        ▼
Display Emergency Guidance
```

---

## Database Schema

### incidents Table (data.json)

```python
{
    "id": str,                    # Unique incident ID
    "timestamp": str,             # ISO 8601 datetime
    "type": str,                  # Type from INCIDENT_TYPES
    "description": str,           # User description
    "reported_by": str,           # User name
    "lat": float,                 # Latitude
    "lon": float,                 # Longitude
    "severity": str,              # "low", "medium", "critical"
    "has_injuries": bool,         # Boolean
    "visibility": str,            # "Poor", "Fair", "Good", "Excellent"
    "weather": str,               # Weather condition
    "distance_km": float,         # Calculated distance (optional)
    "is_emergency": bool          # True if SOS (optional)
}
```

### recycling_records Table (recycling_records.json)

```python
{
    "id": str,                    # Unique record ID
    "user": str,                  # User name
    "timestamp": str,             # ISO 8601 datetime
    "item_name": str,             # Item description
    "category": str,              # Category key
    "weight": float,              # Weight in kg
    "condition": str,             # Item condition
    "description": str,           # Additional notes
    "points": int                 # Points earned
}
```

### users Table (users.json)

```python
{
    "user_id": {
        "name": str,              # User display name
        "lat": float,             # Last known latitude
        "lon": float,             # Last known longitude
        "total_points": int,       # Recycling points
        "items_recycled": int,     # Count
        "incidents_reported": int  # Count
    }
}
```

### facilities Table (facilities.json)

```python
{
    "id": str,                    # Facility ID
    "name": str,                  # Facility name
    "type": str,                  # Type of facility
    "lat": float,                 # Latitude
    "lon": float,                 # Longitude
    "accepts": [str],             # Categories accepted
    "hours": str,                 # Operating hours
    "phone": str,                 # Contact number
    "address": str                # Full address
}
```

---

## API Endpoints (Future Backend)

### Recycling API

```
GET /api/recycling/items?user_id=123
POST /api/recycling/items
  {
    "user_id": "123",
    "item_name": "Plastic Bottle",
    "category": "plastic",
    "weight": 0.5
  }

GET /api/recycling/facilities?lat=40.7128&lon=-74.0060&radius=5
GET /api/recycling/stats?user_id=123
GET /api/recycling/leaderboard?limit=10
```

### Safety API

```
GET /api/safety/incidents?lat=40.7128&lon=-74.0060&radius=10
POST /api/safety/incidents
  {
    "type": "traffic_jam",
    "description": "...",
    "lat": 40.7128,
    "lon": -74.0060
  }

POST /api/safety/sos
  {
    "user_id": "123",
    "type": "medical",
    "description": "...",
    "injured": 2
  }

GET /api/safety/analytics?from=2026-01-01&to=2026-01-31
```

---

## Location-Based Services

### Haversine Formula
Used for calculating distances between coordinates:

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```

Where:
- R = Earth's radius (6371 km)
- Δlat/lon = differences in latitude/longitude
- d = distance in km

### Geocoding Radiuses

- **Safety Alerts**: 10 km radius for nearby incidents
- **Emergency SOS**: 2 km radius for nearby helpers
- **Facilities**: 5-10 km radius for nearby recycling centers

---

## AI Integration

### Groq API Configuration

```python
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Model Configuration
model = "mixtral-8x7b-32768"
max_tokens = 350-500
temperature = 0.7-0.8

# Request Format
{
    "model": "mixtral-8x7b-32768",
    "messages": [
        {
            "role": "user",
            "content": "prompt_text"
        }
    ],
    "max_tokens": 400,
    "temperature": 0.7
}
```

### AI Prompt Templates

#### Risk Analysis Prompt
```
You are a road safety expert. Analyze this incident BRIEFLY.
Incident: {incident_type}
Details: {description}
Provide:
- Risk Level
- DO's (2 points)
- DON'Ts (2 points)
- Call Authorities? (Yes/No)
```

#### Emergency Response Prompt
```
EMERGENCY - Provide numbered steps.
Situation: {situation}
Available Helpers: {num_people}
Provide:
- STEP 1-3
- Who to call first
- Critical DON'T
```

#### Recycling Advice Prompt
```
Recycling expert advice for: {item_name}
Category: {category}
Provide:
- How to prepare
- Where to recycle
- Environmental benefit
- Safety tips
```

---

## Security Architecture

### Data Protection

```
User Input
    │
    ▼
Input Validation
    │
    ▼
Sanitization
    │
    ▼
Encryption (Future)
    │
    ▼
Database Storage
    │
    ▼
Access Control
```

### Privacy Controls

- 🔒 Location data only saved with user consent
- 🔒 Anonymous incident reporting option
- 🔒 User data not shared with authorities
- 🔒 Location deletion capability

### Future Security Features

```
Phase 2:
  - User authentication (JWT)
  - Password encryption (bcrypt)
  - Session management
  - Rate limiting

Phase 3:
  - End-to-end encryption
  - Zero-knowledge storage
  - Privacy-preserving analytics
  - GDPR compliance
```

---

## Performance Optimization

### Database Indexing (Future)
```
incidents: [timestamp, type, severity, lat/lon]
recycling_records: [user_id, timestamp, category]
users: [user_id, location]
```

### Caching Strategy
```
- Cache nearby incidents (5 min TTL)
- Cache facilities (1 hour TTL)
- Cache user stats (1 hour TTL)
- Cache leaderboard (1 hour TTL)
```

### Query Optimization
```
- Limit queries to last 500 records
- Paginate incident lists
- Use spatial indexes for location queries
- Compress large responses
```

---

## Scalability Plan

### Current (v1.0)
- Single server, JSON files
- ~1000 users, ~10k incidents
- Real-time response <2s

### Phase 2 (v2.0)
- Database: PostgreSQL with PostGIS
- Cache: Redis
- File storage: S3
- ~10k users, ~100k incidents
- Response time <500ms

### Phase 3 (v3.0)
- Microservices architecture
- Message queue: RabbitMQ
- Search: Elasticsearch
- Analytics: Data warehouse
- ~100k users, ~1M incidents
- Response time <200ms

### Phase 4 (v4.0)
- Multi-region deployment
- CDN for static assets
- Load balancing
- ~1M users
- Global coverage

---

## Deployment Architecture

### Current Setup
```
Developer Machine
    │
    ├── app.py (Streamlit)
    ├── data.json (Incidents)
    ├── recycling_records.json
    ├── users.json
    ├── facilities.json
    └── authority_alerts.log
```

### Future Cloud Setup
```
┌─────────────────────────────────────────┐
│         Cloud Provider (AWS/GCP)        │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │    Load Balancer                 │  │
│  └────────────────┬─────────────────┘  │
│                   │                     │
│    ┌──────────────┼──────────────┐     │
│    │              │              │     │
│  ┌─▼──┐        ┌─▼──┐        ┌─▼──┐  │
│  │App │        │App │        │App │  │
│  │Pod │        │Pod │        │Pod │  │
│  └────┘        └────┘        └────┘  │
│      │              │              │   │
│      └──────────────┼──────────────┘   │
│                     │                  │
│         ┌───────────▼────────────┐     │
│         │  PostgreSQL + PostGIS  │     │
│         └────────────────────────┘     │
│                                         │
│         ┌─────────────────────────┐    │
│         │     Redis Cache         │    │
│         └─────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

---

## Testing Strategy

### Unit Tests
```
- Database operations
- Distance calculations
- Points calculations
- AI prompt formatting
```

### Integration Tests
```
- Incident reporting end-to-end
- Emergency SOS flow
- Recycling tracking
- Authority notifications
```

### Load Testing
```
- 1000 concurrent users
- 100 incidents/second
- API response times
- Database query performance
```

### Security Testing
```
- Input validation
- SQL injection prevention
- XSS prevention
- Rate limiting
```

---

## Monitoring & Logging

### Application Logs
```
- User actions
- API calls
- Errors and exceptions
- Performance metrics
```

### Database Logs
```
- Data modifications
- Queries over 1 second
- Failed operations
- Backup logs
```

### Analytics
```
- Active users
- Incidents per day
- Popular incident types
- Emergency SOS frequency
```

---

## Disaster Recovery

### Backup Strategy
```
Daily:
  - JSON files backup
  - Authority alerts log

Weekly:
  - Full database backup
  - Archive old incidents

Monthly:
  - Cloud backup
  - System state snapshot
```

### Recovery Procedures
```
Data Loss:
  1. Restore from backup
  2. Verify integrity
  3. Notify users
  4. Resume operations

System Failure:
  1. Switch to backup server
  2. Sync databases
  3. Test functionality
  4. Notify authorities
```

---

## Development Roadmap

### Q1 2026
- ✅ Core features (v1.0)
- 🔄 Beta testing
- 📊 Performance tuning

### Q2 2026
- 🎯 Mobile app (iOS/Android)
- 🗺️ Interactive maps
- 🔔 Push notifications
- 🏆 Gamification

### Q3 2026
- 🤖 Advanced AI models
- 🚔 Police integration
- 🏥 Hospital APIs
- 💳 Reward system

### Q4 2026
- 🌍 Multi-language support
- 🚕 Ride-sharing integration
- 📲 SMS/WhatsApp
- 🏢 Government dashboard

---

## Key Performance Indicators

### Safety Module
- Incident report time: <30 seconds
- SOS response time: <5 seconds
- Authority notification: Immediate
- User alert distance accuracy: <100m

### Recycling Module
- Item logging: <20 seconds
- Points calculation: <1 second
- Facility search: <2 seconds
- Leaderboard update: Real-time

### System
- API response: <500ms
- Database query: <200ms
- Page load: <2 seconds
- AI response: <10 seconds

---

## Dependencies

```
Core:
  - Python 3.9+
  - Streamlit 1.20+
  - Groq API SDK
  - Python-dotenv

APIs:
  - Groq Mixtral-8x7b
  - Google Generative AI (backup)

Libraries:
  - requests
  - pillow
  - json
  - math
  - typing
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-23  
**Status**: Active Development 🚀
