# 🔧 Backend Logic & Algorithms - EcoHub

## 1. Points Calculation Engine

### Formula
```
Points = Base_Points × Weight(kg)
```

### Base Points by Category
```python
RECYCLING_CATEGORIES = {
    "plastic": 10,      # 10 points per kg
    "paper": 8,         # 8 points per kg
    "metal": 15,        # 15 points per kg (most valuable)
    "glass": 12,        # 12 points per kg
    "electronics": 50,  # 50 points per kg (rare, valuable)
    "organic": 5,       # 5 points per kg (least points)
}
```

### Examples
- Plastic bottle (0.5 kg): 0.5 × 10 = **5 points**
- Newspaper (1.0 kg): 1.0 × 8 = **8 points**
- Old phone (0.1 kg): 0.1 × 50 = **5 points**
- Laptop (2 kg): 2 × 50 = **100 points** ⭐

---

## 2. Environmental Impact Calculator

### CO2 Savings Algorithm
```
CO2_Saved(kg) = Category_CO2_Factor × Weight(kg)

Factors:
  - Plastic: 2.5 kg CO2/kg plastic
  - Paper: 1.8 kg CO2/kg paper
  - Metal: 8.0 kg CO2/kg metal (highest impact!)
  - Glass: 0.5 kg CO2/kg glass
  - Electronics: 15.0 kg CO2/kg electronics
```

### Water Savings Algorithm
```
Water_Saved(L) = Category_Water_Factor × Weight(kg)

Factors:
  - Plastic: 5 L water/kg plastic
  - Paper: 10 L water/kg paper
  - Metal: 2 L water/kg metal
  - Glass: 0.5 L water/kg glass
  - Electronics: 50 L water/kg electronics (highest!)
```

### Example Calculations
**Recycling 1 kg of plastic:**
- Points earned: 10
- CO2 saved: 2.5 kg
- Water saved: 5 liters
- Equivalent to: Planting 0.13 trees

**Recycling 2 kg of electronics:**
- Points earned: 100
- CO2 saved: 30 kg
- Water saved: 100 liters
- Equivalent to: 20 plastic bottles worth of impact!

---

## 3. Distance Calculation (Haversine Formula)

### Algorithm
```
Given two points (lat1, lon1) and (lat2, lon2):

1. Convert to radians:
   lat1_rad = lat1 × π/180
   lon1_rad = lon1 × π/180
   lat2_rad = lat2 × π/180
   lon2_rad = lon2 × π/180

2. Calculate differences:
   Δlat = lat2_rad - lat1_rad
   Δlon = lon2_rad - lon1_rad

3. Apply Haversine:
   a = sin²(Δlat/2) + cos(lat1_rad) × cos(lat2_rad) × sin²(Δlon/2)
   c = 2 × arcsin(√a)
   distance = R × c

   Where R = 6371 km (Earth's radius)
```

### Python Implementation
```python
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    # Haversine formula
    a = math.sin(delta_lat/2)**2 + \
        math.cos(lat1_rad) * math.cos(lat2_rad) * \
        math.sin(delta_lon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c
```

### Accuracy
- Accuracy: ±0.5 meters
- Suitable for: Route planning, nearby services
- Not suitable for: Precision surveying

### Examples
```
New York (40.7128, -74.0060) to:
- Times Square (40.7580, -73.9855): 5.6 km
- Statue of Liberty (40.6892, -74.0445): 8.2 km
- Brooklyn Bridge (40.7061, -73.9969): 0.8 km
```

---

## 4. Incident Severity Classification

### Algorithm
```
Base Severity = Incident_Type_Severity
(defined in INCIDENT_TYPES)

IF has_injuries OR is_emergency:
    Severity = "CRITICAL"
ELSE IF base_severity == "critical":
    Severity = "CRITICAL"
ELSE:
    Severity = base_severity
```

### Severity Levels
```python
{
    "traffic_jam": "medium",      # Expected to be reported
    "construction": "medium",     # Pre-planned usually
    "accident": "critical",       # Unexpected, dangerous
    "fallen_tree": "critical",    # Urgent clearance needed
    "power_outage": "critical",   # Safety hazard
    "flooded_road": "critical",   # Impassable
    "pothole": "low",             # Slow damage
    "debris": "low",              # Minor hazard
    "animal_on_road": "medium",   # Unpredictable
}
```

### Action Rules
```
IF severity == "CRITICAL" OR has_injuries:
    → Auto-send to authorities
    → Alert nearby users immediately
    → Require quick confirmation
    → Log to emergency database
ELSE:
    → Save to regular incidents
    → Show on map
    → Optional authority report
```

---

## 5. Authority Notification Logic

### Automatic Alert Conditions
```
SEND_ALERT_TO_AUTHORITIES = (
    incident_severity == "CRITICAL" OR
    has_injuries == TRUE OR
    is_emergency == TRUE
)
```

### Notification Content
```json
{
    "alert_type": "🚨 EMERGENCY" or "⚠️ INCIDENT",
    "incident_type": "accident",
    "location": {
        "lat": 40.7128,
        "lon": -74.0060,
        "address": "Times Square, NY"
    },
    "description": "3-car collision, 2 injured",
    "reporter": "John Doe",
    "phone": "555-1234",
    "timestamp": "2026-01-23T10:30:45",
    "severity": "CRITICAL",
    "authorities_to_notify": ["police", "ambulance", "fire"]
}
```

### Notification Channels (Future)
```
SMS (Emergency):
  → Police: 911
  → Ambulance: 911
  → Fire Dept: 911

SMS (Non-emergency):
  → Traffic Control: 311
  
EMAIL:
  → local.police@city.gov
  → emergency.dispatch@county.us
  
API:
  → Emergency services API
  → Traffic management system
  → Hospital availability API
```

---

## 6. Nearby User Alert System

### Algorithm
```
1. Get user location (lat, lon)
2. Get incident location (lat_i, lon_i)
3. Calculate distance = haversine(lat, lon, lat_i, lon_i)
4. IF distance <= alert_radius:
       → Add to alert list
5. For each user in alert_list:
       → Send notification
       → Show on their map
       → Log delivery
```

### Alert Radiuses
```
Alert_Type          | Radius | Purpose
--------------------|--------|------------------------------------------
Regular Incident    | 10 km  | Inform drivers of conditions
Accident/Hazard     | 15 km  | Wide awareness for planning
Emergency SOS       | 2 km   | Alert nearby people to help
Critical Alert      | 20 km  | Major incident affecting traffic
```

### Notification Format
```
Title: ⚠️ {incident_emoji} {incident_type}
Distance: {distance_km} km away
Time: {time_ago}
Description: {description}
Action: [View Details] [Report Similar]
```

---

## 7. Leaderboard Ranking Algorithm

### Points Aggregation
```
User_Total_Points = SUM(item_points for all items by user)

LEADERBOARD = [
    {rank: 1, user: "Alice", points: 1250},
    {rank: 2, user: "Bob", points: 980},
    {rank: 3, user: "Carol", points: 875},
    ...
]
```

### Tie-Breaking Rules
```
IF points_equal:
    Sort by items_recycled DESC
IF items_equal:
    Sort by last_activity DESC
IF time_equal:
    Sort by user_id
```

### Top Performers Recognition
```
🥇 Gold: 1000+ points (Champion)
🥈 Silver: 500-999 points (Expert)
🥉 Bronze: 100-499 points (Regular)
🌟 Rising: 0-99 points (Starter)
```

---

## 8. AI Risk Analysis Pipeline

### Input Processing
```
incident_type: string
description: string
weather: optional string
visibility: optional string

→ Normalize and validate inputs
→ Create prompt template
→ Send to Groq API
```

### Prompt Template
```
You are a road safety expert. Analyze this incident.

INCIDENT: {incident_type}
DETAILS: {description}
WEATHER: {weather}

Provide:
🎯 RISK LEVEL: (Low/Medium/High/Critical)
✅ DO'S: (2 points)
❌ DON'Ts: (2 points)
🚨 CALL AUTHORITIES: (Yes/No)

Keep it SHORT and ACTIONABLE.
```

### Response Processing
```
Raw Response from API
    ↓
Parse markdown formatting
    ↓
Extract structured data
    ↓
Validate recommendations
    ↓
Display to user
```

### Example Analysis
```
Input:
  Type: "accident"
  Description: "3-car collision on highway, blocking 2 lanes"
  
Output:
🎯 RISK LEVEL: CRITICAL
✅ DO'S:
  - Keep a safe distance, use hazard lights
  - Wait for emergency responders to clear the scene
❌ DON'Ts:
  - Don't exit your vehicle on the highway
  - Don't take photos at the accident scene
🚨 CALL AUTHORITIES: YES - Multiple vehicles, traffic impact
```

---

## 9. Emergency Response Guidance Algorithm

### Step-by-Step Generation
```
Input:
  situation: emergency description
  num_people_nearby: count of available helpers

Generate prompt:
  "EMERGENCY RESPONSE NEEDED - Provide IMMEDIATE steps for: {situation}
   Available helpers: {num_people}
   
   Format:
   🚨 STEP 1: [Action]
   🚨 STEP 2: [Action]
   🚨 STEP 3: [Action]
   📞 CALL: [Who to call]
   ⚠️ AVOID: [Critical DON'T]"

Response:
  Parse numbered steps
  Validate critical safety information
  Display with priority ordering
```

### Response Quality Checks
```
✓ Are all steps numbered?
✓ Do steps follow logical sequence?
✓ Is first aid advice present?
✓ Is emergency number mentioned?
✓ Are contraindications listed?
✓ Is tone urgent but clear?
```

---

## 10. Pattern Detection Algorithm

### Incident Clustering
```
1. Load all incidents from database
2. Group by type:
   {"traffic_jam": 15, "accident": 8, ...}
3. Group by severity:
   {"critical": 10, "medium": 20, "low": 5}
4. Calculate statistics:
   - Total incidents
   - Incidents per type (%)
   - Critical percentage
```

### Hotspot Detection
```
1. For each incident:
   - Extract location (lat, lon)
   - Calculate density within 1 km radius
   
2. Identify clusters (hotspots):
   - High density zones
   - Frequent incident types
   - Peak incident times
   
3. Generate recommendations:
   - "I-95 has 40% of accidents"
   - "Avoid downtown between 5-7 PM"
   - "Intersections need traffic lights"
```

### Trend Analysis
```
Time-based:
  - Incidents per hour
  - Incidents per day
  - Incidents per week
  - Seasonal trends

Type-based:
  - Most common incidents
  - Incident type trends
  - Severity escalation

Location-based:
  - Geographic clusters
  - Route danger levels
  - Safe alternative routes
```

---

## 11. Data Validation Rules

### Incident Validation
```python
def validate_incident(incident):
    errors = []
    
    # Check required fields
    if not incident.get('type'):
        errors.append("Incident type is required")
    if not incident.get('description') or len(incident['description']) < 10:
        errors.append("Description must be at least 10 characters")
    if not incident.get('lat') or not incident.get('lon'):
        errors.append("Location coordinates required")
    
    # Check value ranges
    if not -90 <= incident['lat'] <= 90:
        errors.append("Invalid latitude")
    if not -180 <= incident['lon'] <= 180:
        errors.append("Invalid longitude")
    
    # Check valid types
    if incident['type'] not in INCIDENT_TYPES:
        errors.append("Invalid incident type")
    
    return errors
```

### Recycling Item Validation
```python
def validate_recycling_item(item):
    errors = []
    
    # Required fields
    if not item.get('item_name'):
        errors.append("Item name required")
    if not item.get('category'):
        errors.append("Category required")
    if not item.get('weight') or item['weight'] <= 0:
        errors.append("Weight must be positive")
    
    # Valid category
    if item['category'] not in RECYCLING_CATEGORIES:
        errors.append("Invalid category")
    
    # Weight reasonable limits
    if item['weight'] > 100:
        errors.append("Weight seems too high")
    
    return errors
```

---

## 12. Data Storage Optimization

### JSON File Structure
```
data.json (incidents):
  - Average record size: 300 bytes
  - Max practical records: 10,000 (3 MB)
  - Recommend archiving after 10,000

recycling_records.json:
  - Average record size: 200 bytes
  - Max practical records: 50,000 (10 MB)
  - Recommend pagination after 5,000

users.json:
  - Average record size: 150 bytes
  - Max practical users: 100,000 (15 MB)
  - Recommend database migration after 10,000
```

### Query Optimization
```
When querying:
  ✓ Load only needed fields
  ✓ Limit to last N records
  ✓ Use pagination (20 items per page)
  ✓ Cache frequent queries (5-min TTL)
  ✗ Avoid loading entire database
  ✗ Don't recalculate on every request
```

---

## 13. Workflow State Machines

### Incident Reporting State
```
DRAFT
  ├─ User fills form
  └─ Ready to Submit
  
SUBMITTED
  ├─ Validate input
  ├─ Calculate severity
  └─ Ready to Save
  
SAVED
  ├─ Check if critical
  ├─ If critical → ALERT_AUTHORITIES
  └─ Ready to Display
  
ALERT_AUTHORITIES
  ├─ Create notification
  ├─ Send to authorities log
  └─ Back to SAVED
  
DISPLAYED
  ├─ Show AI analysis
  ├─ Show nearby incidents
  └─ Ready for user action
```

### Emergency SOS State
```
STANDBY
  └─ Wait for button press
  
INITIATED
  ├─ Capture location
  ├─ Get emergency type
  └─ Ready to Send
  
SENDING
  ├─ Create emergency record
  ├─ Validate data
  └─ Ready to Save
  
SAVED
  ├─ Force severity = CRITICAL
  ├─ Find nearby helpers
  └─ Ready to Alert
  
ALERTING
  ├─ Send authority notification
  ├─ Alert nearby users
  ├─ Get AI guidance
  └─ ACTIVE
  
ACTIVE
  ├─ Display emergency guidance
  ├─ Show responder location
  └─ Ready for updates
  
RESOLVED
  └─ Archive emergency record
```

---

## 14. Performance Metrics

### Response Time Goals
```
Calculate Distance: < 10 ms
Validate Input: < 20 ms
Save to Database: < 50 ms
Load Nearby Items: < 200 ms
AI API Call: < 10 seconds
Render Page: < 2 seconds
```

### Scalability Targets
```
Current (v1.0):
  - 1,000 users
  - 10,000 incidents
  - 50,000 recycling records
  - Response time: < 2s

Phase 2 (v2.0):
  - 10,000 users
  - 100,000 incidents
  - 500,000 recycling records
  - Response time: < 500ms

Phase 3 (v3.0):
  - 100,000 users
  - 1,000,000 incidents
  - 5,000,000 recycling records
  - Response time: < 200ms
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-23  
**Status**: Active Development 🚀
