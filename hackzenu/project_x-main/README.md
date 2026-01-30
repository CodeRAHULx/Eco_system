# 🌍 EcoHub - Sustainability & Safety Platform

## Overview
**EcoHub** is an integrated platform combining two powerful modules:

### 1. ♻️ **Recycling Module** 
- Track and log recycling activities
- Earn sustainability points
- Find nearby recycling facilities using GPS
- Get AI-powered recycling advice
- Calculate environmental impact
- Compete on community leaderboards

### 2. 🚨 **Road Safety & Emergency Alert System**
- Real-time incident reporting (traffic, accidents, hazards)
- Emergency SOS with location sharing
- AI-powered risk analysis and safety suggestions
- Automatic authority notifications
- Nearby user alerts within 10km radius
- Safety analytics and incident tracking

---

## Installation

### 1. Clone the Repository
```bash
cd d:\hackzenu\project_x-main
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Set Up Environment Variables
Create `.streamlit/secrets.toml`:
```toml
[api_keys]
groq_api_key = "your_groq_api_key_here"
google_api_key = "your_google_api_key_here"
```

Get your API keys:
- **Groq API**: https://console.groq.com
- **Google Generative AI**: https://makersuite.google.com

### 4. Run the Application
```bash
streamlit run app.py
```

---

## Features & Architecture

### ♻️ Recycling Module Features

#### Log Items
- **Item Tracking**: Record items you recycle
- **Categories**: Plastic, Paper, Metal, Glass, Electronics, Organic
- **Points System**: Earn points based on item category and weight
- **Environmental Impact**: See CO2 and water savings

**Backend Logic:**
```
Points = Category_Base_Points × Weight_in_KG
CO2_Saved = Category_Emission_Factor × Weight
Water_Saved = Category_Water_Factor × Weight
```

#### Find Facilities
- **GPS Integration**: Locate recycling centers near you
- **Filter by Category**: Find facilities accepting specific materials
- **Distance Calculation**: Haversine formula for accurate distances
- **Directions**: Get navigation to closest facilities

#### Statistics & Leaderboards
- **Personal Stats**: Items recycled, total weight, earned points
- **Category Breakdown**: See recycling by type
- **Community Leaderboard**: Compete with other users
- **Streak Tracking**: Maintain recycling habits

#### AI-Powered Features
- **Recycling Advice**: Get specific tips for each item
- **Preparation Tips**: Learn how to prepare items properly
- **Environmental Impact**: Understand your positive impact

---

### 🚨 Road Safety Module Features

#### Report Incidents
**Incident Types:**
- 🚦 Traffic Jam - Congestion and delays
- 🚧 Construction - Road work and lane closures
- 💥 Accident - Vehicle collisions
- 🌳 Fallen Tree - Obstruction on road
- ⚡ Power Outage - No traffic lights/lighting
- 🌊 Flooded Road - Water on roadway
- 🕳️ Pothole - Road damage
- 💨 Debris - Objects on road
- 🦌 Animal on Road - Wildlife hazard

**Report Details:**
- Type and severity (Low/Medium/Critical)
- Detailed description
- GPS coordinates
- Weather conditions
- Visibility level
- Number of people injured (if any)

**Backend Logic:**
```
Severity = Incident_Base_Severity
If Has_Injuries: Severity = "CRITICAL"
Auto_Notify_Authorities = (Severity == "CRITICAL" OR Has_Injuries)
```

#### Emergency SOS System
- **One-Click Emergency**: Send immediate distress signal
- **Location Sharing**: Share exact coordinates with responders
- **AI Response Guidance**: Get step-by-step emergency instructions
- **Nearby User Alerts**: Alert people within 2km radius
- **Authority Notification**: Auto-send to emergency services
- **Injury Reporting**: Indicate number of people needing help

**Response Flow:**
```
User Presses SOS
    ↓
Create Emergency Record
    ↓
Save to Database
    ↓
Send to Authority Log
    ↓
Notify Nearby Users (within 2km)
    ↓
Get AI Emergency Guidance
    ↓
Share Location with Responders
```

#### Incident Management
- **View All Incidents**: Browse reported incidents
- **Filter & Sort**: By type, severity, or date
- **Distance Calculation**: See how far incidents are from you
- **Real-time Updates**: Get instant notifications of new incidents

#### AI Safety Analysis
- **Risk Assessment**: Analyze incident severity
- **Safety Recommendations**: DO's and DON'Ts for drivers
- **Authority Recommendation**: Whether to contact authorities
- **Pattern Detection**: Identify high-risk areas and times

#### Safety Analytics
- **Incident Breakdown**: Statistics by type and severity
- **Hotspot Detection**: Where incidents are most common
- **Trend Analysis**: Identify patterns over time
- **Authority Intelligence**: Data for traffic management

---

## Database Schema

### Incidents Database (`data.json`)
```json
{
  "incidents": [
    {
      "id": "incident_001",
      "timestamp": "2026-01-23T10:30:00",
      "type": "traffic_jam",
      "description": "Heavy traffic on Highway 95 due to accident",
      "reported_by": "John Doe",
      "lat": 40.7128,
      "lon": -74.0060,
      "severity": "critical",
      "has_injuries": true,
      "visibility": "Good",
      "weather": "Clear"
    }
  ]
}
```

### Recycling Records (`recycling_records.json`)
```json
{
  "records": [
    {
      "id": "rec_001",
      "user": "Jane Smith",
      "timestamp": "2026-01-23T09:15:00",
      "item_name": "Plastic Bottle",
      "category": "plastic",
      "weight": 0.5,
      "condition": "Good",
      "points": 5
    }
  ]
}
```

### Facilities (`facilities.json`)
```json
{
  "facilities": [
    {
      "id": "facility_001",
      "name": "Green Recycling Center",
      "type": "Full Service",
      "lat": 40.7128,
      "lon": -74.0060,
      "accepts": ["plastic", "paper", "metal"],
      "hours": "9 AM - 6 PM",
      "phone": "+1-800-RECYCLE"
    }
  ]
}
```

---

## Technology Stack

### Backend
- **Python 3.9+**
- **Streamlit** - Web UI framework
- **Groq API** - AI/LLM for analysis
- **Google Generative AI** - Alternative AI provider

### Data Storage
- **JSON files** - Local persistent storage
- **Session State** - User session management

### APIs & Services
- **Groq Mixtral-8x7b** - AI analysis and suggestions
- **Haversine Formula** - Geographic distance calculation
- **GPS Coordinates** - Location-based services

---

## AI Integration

### Groq AI Models Used
- **Model**: `mixtral-8x7b-32768`
- **Purpose**: Risk analysis, emergency guidance, pattern detection
- **Temperature**: 0.7-0.8 for balanced creativity and accuracy

### AI Features

#### 1. Risk Analysis
```
Input: Incident type + description
Output: Risk level, safety recommendations, authority notification
```

#### 2. Emergency Response
```
Input: Emergency situation + nearby helpers
Output: Step-by-step guidance, who to call, what to avoid
```

#### 3. Recycling Advice
```
Input: Item name + category
Output: Preparation tips, where to recycle, environmental impact
```

#### 4. Pattern Detection
```
Input: All recent incidents
Output: Hotspots, trends, prevention tips, authority recommendations
```

---

## Usage Guide

### For Recycling
1. **Set Your Profile**: Enter your name in sidebar
2. **Log Items**: Click "Log Item" and enter details
3. **Check Impact**: See environmental benefits
4. **Find Facilities**: Use GPS to locate recycling centers
5. **Track Progress**: View stats and compete on leaderboard

### For Road Safety
1. **Set Location**: Enter latitude/longitude in sidebar
2. **Check Alerts**: View nearby reported incidents
3. **Report Incident**: Click "Report Incident" to warn others
4. **Emergency**: Press "🚨 EMERGENCY SOS" button for help
5. **View Analytics**: Check incident patterns and hotspots

---

## Points System

### Recycling Points
| Category | Base Points |
|----------|-------------|
| Plastic | 10 |
| Paper | 8 |
| Metal | 15 |
| Glass | 12 |
| Electronics | 50 |
| Organic | 5 |

**Calculation**: `Points = Base_Points × Weight_in_KG`

---

## Environmental Impact

### CO2 Savings per KG
- Plastic: 2.5 kg
- Paper: 1.8 kg
- Metal: 8.0 kg
- Glass: 0.5 kg
- Electronics: 15.0 kg

### Water Savings per KG
- Plastic: 5 liters
- Paper: 10 liters
- Metal: 2 liters
- Glass: 0.5 liters
- Electronics: 50 liters

---

## Security & Privacy

### Data Protection
- ✅ Local JSON file storage
- ✅ No cloud storage (for now)
- ✅ User-controlled location sharing
- ✅ Anonymous incident reporting option

### Future Enhancements
- 🔐 User authentication
- 🔒 Encrypted data storage
- 🛡️ Privacy controls
- 📱 Mobile app encryption

---

## Future Roadmap

### Phase 2 Features
- 🏆 Gamification (badges, achievements)
- 📱 Mobile app (iOS/Android)
- 🗺️ Interactive maps
- 💬 Community chat for incidents
- 🔔 Push notifications
- 📊 Advanced analytics dashboard

### Phase 3 Features
- 🤖 Advanced AI models
- 🎯 Predictive incident forecasting
- 🚗 Traffic optimization routes
- 💳 Reward marketplace
- 🌐 Community challenges
- 📲 SMS/WhatsApp integration

### Phase 4 Features
- 🏢 Government integration
- 🚔 Real-time police dispatch
- 🏥 Hospital availability
- 🚕 Ride-sharing integration
- 🎓 Educational content
- 🌍 Multi-language support

---

## Troubleshooting

### App won't start
- Ensure all dependencies: `pip install -r requirements.txt`
- Check API keys in `.streamlit/secrets.toml`
- Verify Python version: `python --version` (3.9+)

### Location features not working
- Enable location in browser settings
- Use valid latitude/longitude coordinates
- Check your GPS device

### AI responses slow
- Check internet connection
- Verify Groq API key is active
- May experience rate limiting

### Data not saving
- Check permissions on project folder
- Ensure JSON files exist and are writable
- Check console for error messages

---

## Contributing

To add new features:

1. Add feature constants at the top
2. Create database functions if needed
3. Implement feature page functions
4. Add routing in main app
5. Update documentation

---

## API Reference

### Key Functions

#### `load_incidents_db()`
Loads all road incidents from database

#### `save_incidents_db(incidents)`
Saves incidents to database

#### `calculate_distance(lat1, lon1, lat2, lon2)`
Returns distance in km between coordinates

#### `get_nearby_incidents(user_lat, user_lon, radius_km)`
Returns incidents within specified radius

#### `get_ai_risk_analysis(incident_type, description)`
Returns AI-generated risk analysis

#### `get_emergency_response_suggestion(situation, num_people)`
Returns emergency response steps

#### `send_to_authorities(incident, is_emergency)`
Logs incident for authorities

---

## License

This project is for educational and safety purposes.

---

## Support

For issues or feature requests, contact: support@ecohub.app

---

## Version History

- **v1.0.0** (2026-01-23)
  - ♻️ Recycling Module Launch
  - 🚨 Road Safety Module Launch
  - 🤖 AI Integration (Groq)
  - 📍 GPS/Location Features
  - 📊 Analytics & Statistics

---

**Last Updated**: 2026-01-23  
**Status**: Active Development 🚀
