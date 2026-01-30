import streamlit as st
import json
from groq import Groq
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import math
from typing import Dict, List
import re
import folium
from streamlit_folium import st_folium
from streamlit_geolocation import streamlit_geolocation

# ============== INITIALIZATION ==============

load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))

# ============== PAGE CONFIG ==============

st.set_page_config(
    page_title="🌍 EcoHub - Sustainability Platform",
    page_icon="🌍",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ============== CONSTANTS ==============

# Road Safety Constants
INCIDENT_TYPES = {
    "traffic_jam": {"emoji": "🚦", "color": "#FF6B6B", "severity": "medium", "name": "Traffic Jam"},
    "construction": {"emoji": "🚧", "color": "#FFA500", "severity": "medium", "name": "Road Construction"},
    "accident": {"emoji": "💥", "color": "#DC143C", "severity": "critical", "name": "Accident"},
    "fallen_tree": {"emoji": "🌳", "color": "#FF8C00", "severity": "critical", "name": "Fallen Tree"},
    "power_outage": {"emoji": "⚡", "color": "#FFD700", "severity": "critical", "name": "Power Outage"},
    "flooded_road": {"emoji": "🌊", "color": "#1E90FF", "severity": "critical", "name": "Flooded Road"},
    "pothole": {"emoji": "🕳️", "color": "#8B4513", "severity": "low", "name": "Pothole"},
    "debris": {"emoji": "💨", "color": "#A9A9A9", "severity": "low", "name": "Debris"},
    "animal_on_road": {"emoji": "🦌", "color": "#228B22", "severity": "medium", "name": "Animal on Road"},
}

RECYCLING_CATEGORIES = {
    "plastic": {"emoji": "🥤", "color": "#FF6B6B", "points": 10},
    "paper": {"emoji": "📄", "color": "#4ECDC4", "points": 8},
    "metal": {"emoji": "🔩", "color": "#95E1D3", "points": 15},
    "glass": {"emoji": "🍷", "color": "#F38181", "points": 12},
    "electronics": {"emoji": "💻", "color": "#AA96DA", "points": 50},
    "organic": {"emoji": "🌱", "color": "#FCBAD3", "points": 5},
}

# ============== DATABASE FUNCTIONS ==============

def load_incidents_db() -> List[Dict]:
    """Load road incidents from database"""
    try:
        with open('d:\\hackzenu\\project_x-main\\data.json', 'r') as f:
            data = json.load(f)
            return data.get('incidents', [])
    except:
        return []

def save_incidents_db(incidents: List[Dict]):
    """Save road incidents to database"""
    try:
        with open('d:\\hackzenu\\project_x-main\\data.json', 'w') as f:
            data = {'incidents': incidents}
            json.dump(data, f, indent=2)
    except Exception as e:
        st.error(f"Error saving data: {e}")

def load_recycling_records() -> List[Dict]:
    """Load recycling records from database"""
    try:
        with open('d:\\hackzenu\\project_x-main\\recycling_records.json', 'r') as f:
            data = json.load(f)
            return data.get('records', [])
    except:
        return []

def save_recycling_records(records: List[Dict]):
    """Save recycling records to database"""
    try:
        with open('d:\\hackzenu\\project_x-main\\recycling_records.json', 'w') as f:
            json.dump({'records': records}, f, indent=2)
    except Exception as e:
        st.error(f"Error saving recycling data: {e}")

def load_users_db() -> Dict:
    """Load user profiles"""
    try:
        with open('d:\\hackzenu\\project_x-main\\users.json', 'r') as f:
            return json.load(f)
    except:
        return {}

def save_users_db(users: Dict):
    """Save user profiles"""
    try:
        with open('d:\\hackzenu\\project_x-main\\users.json', 'w') as f:
            json.dump(users, f, indent=2)
    except:
        pass

# ============== LOCATION PICKER FUNCTION ==============

def interactive_map_location_picker(default_lat: float = 28.6139, default_lon: float = 77.2090):
    """
    Interactive map-based location picker like Blinkit/Google Maps
    Click on the map to set your location
    """
    st.subheader("🗺️ Click on Map to Set Your Location")
    st.caption("Tap anywhere on the map to select your location - just like Blinkit!")
    
    # Create map centered on default location
    m = folium.Map(
        location=[default_lat, default_lon],
        zoom_start=13,
        tiles="OpenStreetMap"
    )
    
    # Add current location marker
    folium.Marker(
        [default_lat, default_lon],
        popup="📍 Current/Default Location",
        icon=folium.Icon(color='blue', icon='location-arrow', prefix='fa'),
        tooltip="Click anywhere on map to set your location"
    ).add_to(m)
    
    # Add search circle (10km radius)
    folium.Circle(
        [default_lat, default_lon],
        radius=10000,
        color='blue',
        fill=True,
        fillOpacity=0.1,
        weight=2,
        popup='10km radius'
    ).add_to(m)
    
    # Display map and capture clicks
    map_data = st_folium(m, width=1400, height=700)
    
    # Process map clicks
    if map_data and map_data.get('last_clicked'):
        try:
            clicked_lat = map_data['last_clicked']['lat']
            clicked_lon = map_data['last_clicked']['lng']
            
            st.session_state.user_location = {"lat": clicked_lat, "lon": clicked_lon}
            
            # Show location details
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("📍 Latitude", f"{clicked_lat:.4f}")
            with col2:
                st.metric("📍 Longitude", f"{clicked_lon:.4f}")
            with col3:
                st.metric("Accuracy", "±5m (Map)")
            
            st.success(f"✅ Location Set! ({clicked_lat:.4f}, {clicked_lon:.4f})")
            
            return {"lat": clicked_lat, "lon": clicked_lon}
        except:
            pass
    
    return None

# ============== LOCATION FUNCTIONS ==============

def create_incident_map(user_lat: float, user_lon: float, radius_km: float = 10.0):
    """Create interactive map with incidents like Blinkit"""
    incidents = get_nearby_incidents(user_lat, user_lon, radius_km)
    
    # Create map centered on user
    m = folium.Map(
        location=[user_lat, user_lon],
        zoom_start=13,
        tiles="OpenStreetMap"
    )
    
    # Add user marker
    folium.Marker(
        [user_lat, user_lon],
        popup="📍 Your Location",
        icon=folium.Icon(color='blue', icon='user'),
        tooltip="Your Position"
    ).add_to(m)
    
    # Add incident markers
    for incident in incidents:
        incident_type = incident.get('type', 'unknown')
        emoji = INCIDENT_TYPES.get(incident_type, {}).get('emoji', '⚠️')
        severity = incident.get('severity', 'low')
        
        color = "#DC143C" if severity == "critical" else "#FFA500" if severity == "medium" else "#90EE90"
        
        folium.Marker(
            [incident['lat'], incident['lon']],
            popup=f"<b>{emoji} {incident.get('description', 'Incident')}</b><br>{incident.get('distance_km', 'N/A')} km away",
            icon=folium.Icon(color='red' if severity == 'critical' else 'orange' if severity == 'medium' else 'green', icon='exclamation'),
            tooltip=f"{emoji} {incident.get('description', 'Incident')}"
        ).add_to(m)
    
    # Add circle radius
    folium.Circle(
        [user_lat, user_lon],
        radius=radius_km * 1000,
        color='blue',
        fill=False,
        weight=2,
        popup=f'{radius_km}km radius'
    ).add_to(m)
    
    return m

def create_facilities_map(user_lat: float, user_lon: float, radius_km: float = 5.0):
    """Create map with recycling facilities"""
    facilities = get_nearby_facilities(user_lat, user_lon, radius_km)
    
    m = folium.Map(
        location=[user_lat, user_lon],
        zoom_start=13,
        tiles="OpenStreetMap"
    )
    
    # User marker
    folium.Marker(
        [user_lat, user_lon],
        popup="📍 Your Location",
        icon=folium.Icon(color='blue', icon='user'),
        tooltip="You are here"
    ).add_to(m)
    
    # Facility markers
    for facility in facilities:
        folium.Marker(
            [facility['lat'], facility['lon']],
            popup=f"<b>🏭 {facility.get('name', 'Facility')}</b><br>{facility.get('distance_km', 'N/A')} km away",
            icon=folium.Icon(color='green', icon='leaf'),
            tooltip=facility.get('name', 'Facility')
        ).add_to(m)
    
    # Radius circle
    folium.Circle(
        [user_lat, user_lon],
        radius=radius_km * 1000,
        color='green',
        fill=False,
        weight=2
    ).add_to(m)
    
    return m
    """Calculate distance between two coordinates in km (Haversine formula)"""
    if not all([lat1, lon1, lat2, lon2]):
        return float('inf')
    
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def get_nearby_incidents(user_lat: float, user_lon: float, radius_km: float = 10.0) -> List[Dict]:
    """Get incidents within radius of user's location"""
    incidents = load_incidents_db()
    nearby = []
    
    for incident in incidents:
        try:
            if incident.get('lat') and incident.get('lon'):
                dist = calculate_distance(user_lat, user_lon, incident['lat'], incident['lon'])
                if dist <= radius_km:
                    incident['distance_km'] = round(dist, 2)
                    nearby.append(incident)
        except:
            continue
    
    return sorted(nearby, key=lambda x: x.get('distance_km', float('inf')))

def get_nearby_facilities(user_lat: float, user_lon: float, radius_km: float = 5.0) -> List[Dict]:
    """Get nearby recycling facilities"""
    try:
        with open('d:\\hackzenu\\project_x-main\\facilities.json', 'r') as f:
            facilities = json.load(f).get('facilities', [])
    except:
        facilities = []
    
    nearby = []
    for facility in facilities:
        if facility.get('lat') and facility.get('lon'):
            dist = calculate_distance(user_lat, user_lon, facility['lat'], facility['lon'])
            if dist <= radius_km:
                facility['distance_km'] = round(dist, 2)
                nearby.append(facility)
    
    return sorted(nearby, key=lambda x: x.get('distance_km', float('inf')))

# ============== AI FUNCTIONS ==============

def get_ai_risk_analysis(incident_type: str, description: str) -> str:
    """Get AI-powered risk analysis using Groq"""
    try:
        incident_name = INCIDENT_TYPES.get(incident_type, {}).get('name', incident_type)
        
        prompt = f"""You are a road safety expert. Analyze this incident BRIEFLY and provide:

**INCIDENT:** {incident_name}
**DETAILS:** {description}

Provide in this EXACT format:
🎯 **RISK LEVEL:** (Low/Medium/High/Critical)
✅ **DO'S:** (2 bullet points only)
❌ **DON'Ts:** (2 bullet points only)
🚨 **CALL AUTHORITIES:** (Yes/No - brief reason)

Keep it SHORT and ACTIONABLE. Drivers need quick advice."""

        message = groq_client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=350,
            temperature=0.7
        )
        
        return message.choices[0].message.content
    except Exception as e:
        return f"⚠️ AI Analysis: Unable to process"

def get_emergency_response_suggestion(situation: str, num_people_nearby: int) -> str:
    """Get emergency response suggestions"""
    try:
        prompt = f"""EMERGENCY RESPONSE NEEDED - Provide IMMEDIATE, NUMBERED steps:

**SITUATION:** {situation}
**HELPERS AVAILABLE:** {num_people_nearby} people nearby

Format as:
🚨 **STEP 1:** [Action]
🚨 **STEP 2:** [Action]
🚨 **STEP 3:** [Action]
📞 **CALL:** [Who to call first]
⚠️ **AVOID:** [1 critical thing NOT to do]

KEEP IT BRIEF - Lives depend on clarity!"""

        message = groq_client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.8
        )
        
        return message.choices[0].message.content
    except Exception as e:
        return f"⚠️ Emergency guidance unavailable"

def get_recycling_advice(item_name: str, category: str) -> str:
    """Get AI advice on how to recycle an item"""
    try:
        prompt = f"""You are a recycling expert. Provide BRIEF recycling advice for this item:

**ITEM:** {item_name}
**CATEGORY:** {category}

Provide:
✅ **HOW TO PREPARE:** (clean, dry, etc.)
🏭 **WHERE:** (your local recycling center accepts this)
♻️ **WHY:** (environmental impact in 1-2 sentences)
⚠️ **IMPORTANT:** (any safety tips)

Keep each section to 1-2 lines maximum."""

        message = groq_client.chat.completions.create(
            model="mixtral-8x7b-32768",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.7
        )
        
        return message.choices[0].message.content
    except Exception as e:
        return "AI advice unavailable"

def get_environmental_impact(category: str, weight_kg: float) -> str:
    """Calculate environmental impact of recycling"""
    impacts = {
        "plastic": {"co2_saved": 2.5, "water_saved": 5, "unit": "liters"},
        "paper": {"co2_saved": 1.8, "water_saved": 10, "unit": "liters"},
        "metal": {"co2_saved": 8.0, "water_saved": 2, "unit": "liters"},
        "glass": {"co2_saved": 0.5, "water_saved": 0.5, "unit": "liters"},
        "electronics": {"co2_saved": 15.0, "water_saved": 50, "unit": "liters"},
    }
    
    impact = impacts.get(category, {"co2_saved": 1.0, "water_saved": 1.0, "unit": "liters"})
    co2 = impact["co2_saved"] * weight_kg
    water = impact["water_saved"] * weight_kg
    
    return f"♻️ **CO2 Saved:** {co2:.2f} kg | 💧 **Water Saved:** {water:.2f} {impact['unit']}"

# ============== NOTIFICATION FUNCTIONS ==============

def send_to_authorities(incident: Dict, is_emergency: bool = False) -> bool:
    """Log incident for authorities"""
    try:
        notification = {
            "timestamp": datetime.now().isoformat(),
            "alert_type": "🚨 EMERGENCY" if is_emergency else "⚠️ INCIDENT",
            "incident_type": incident.get('type'),
            "location": {"lat": incident.get('lat'), "lon": incident.get('lon')},
            "description": incident.get('description'),
            "reporter": incident.get('reported_by', 'Anonymous'),
            "severity": INCIDENT_TYPES.get(incident.get('type', {}), {}).get('severity', 'unknown')
        }
        
        with open('d:\\hackzenu\\project_x-main\\authority_alerts.log', 'a') as f:
            f.write(json.dumps(notification) + '\n')
        
        return True
    except:
        return False

# ============== SESSION STATE ==============

if 'user_name' not in st.session_state:
    st.session_state.user_name = None
if 'user_location' not in st.session_state:
    st.session_state.user_location = None
if 'emergency_mode' not in st.session_state:
    st.session_state.emergency_mode = False
if 'current_section' not in st.session_state:
    st.session_state.current_section = "home"

# ============== SIDEBAR ==============

with st.sidebar:
    st.title("🌍 EcoHub")
    st.caption("Sustainability + Safety Platform")
    
    st.markdown("---")
    
    # Module Selection
    st.subheader("📱 Modules")
    module = st.radio(
        "Select Module:",
        ["Home", "♻️ Recycling", "🚨 Road Safety"],
        index=["Home", "♻️ Recycling", "🚨 Road Safety"].index(st.session_state.current_section.split("_")[0].capitalize() if "_" in st.session_state.current_section else st.session_state.current_section.split("_")[0].capitalize()) if st.session_state.current_section in ["Home", "♻️ Recycling", "🚨 Road Safety"] else 0
    )
    
    if module == "Home":
        st.session_state.current_section = "home"
    elif module == "♻️ Recycling":
        st.session_state.current_section = "recycling_home"
    else:
        st.session_state.current_section = "safety_home"
    
    st.markdown("---")
    
    # User Profile
    st.subheader("👤 Profile")
    user_name = st.text_input("Your Name", value=st.session_state.user_name or "", key="user_input")
    if user_name:
        st.session_state.user_name = user_name
    
    # Location (for Road Safety module)
    if module == "🚨 Road Safety":
        st.markdown("---")
        st.subheader("📍 Location")
        
        # Auto-detect location from browser
        location = streamlit_geolocation()
        
        if location is not None and location["latitude"] is not None:
            st.session_state.user_location = {"lat": location["latitude"], "lon": location["longitude"]}
            st.success(f"✅ GPS Location: {location['latitude']:.4f}, {location['longitude']:.4f}")
            st.caption("Allow location access in browser")
        else:
            st.info("📍 Choose location method:", icon="ℹ️")
        
        # Emergency Button
        st.markdown("---")
        if st.button("🚨 EMERGENCY SOS", key="emergency_btn", use_container_width=True):
            st.session_state.emergency_mode = True
            st.rerun()

# ============== HOME PAGE ==============

def page_home():
    """Home page with overview"""
    st.title("🌍 Welcome to EcoHub")
    st.write("**Your integrated platform for sustainability & road safety**")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        ### ♻️ Recycling Module
        - Track recycling activities
        - Earn sustainability points
        - Find recycling facilities nearby
        - Get AI recycling guidance
        - Compete on leaderboards
        
        **Benefits:** Reduce waste, save resources, gain points!
        """)
        if st.button("🔄 Go to Recycling", key="btn_recycling", use_container_width=True):
            st.session_state.current_section = "recycling_home"
            st.rerun()
    
    with col2:
        st.markdown("""
        ### 🚨 Road Safety Module
        - Report road incidents in real-time
        - Get emergency SOS alerts
        - Share location with nearby users
        - AI-powered risk analysis
        - Automatic authority notifications
        
        **Benefits:** Stay safe, help others, prevent accidents!
        """)
        if st.button("🛣️ Go to Road Safety", key="btn_safety", use_container_width=True):
            st.session_state.current_section = "safety_home"
            st.rerun()
    
    st.markdown("---")
    
    # Global Statistics
    st.subheader("📊 Global Impact")
    
    col1, col2, col3, col4 = st.columns(4)
    
    recycling_records = load_recycling_records()
    incidents = load_incidents_db()
    
    with col1:
        st.metric("Total Recycled", f"{len(recycling_records)} items", delta="Active")
    with col2:
        total_points = sum(r.get('points', 0) for r in recycling_records)
        st.metric("Community Points", total_points)
    with col3:
        st.metric("Road Incidents", len(incidents), delta="This week")
    with col4:
        critical = sum(1 for i in incidents if i.get('severity') == 'critical')
        st.metric("Critical Alerts", critical, delta="⚠️")
    
    st.markdown("---")
    
    # Features Overview
    st.subheader("✨ Key Features")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.write("**Recycling Features:**")
        st.write("✅ Item scanning & categorization")
        st.write("✅ Environmental impact calculation")
        st.write("✅ Facility finder (GPS)")
        st.write("✅ Community leaderboards")
        st.write("✅ AI recycling advice")
    
    with col2:
        st.write("**Safety Features:**")
        st.write("✅ Real-time incident reporting")
        st.write("✅ Emergency SOS system")
        st.write("✅ Location sharing with users")
        st.write("✅ AI risk analysis")
        st.write("✅ Auto-notify authorities")

# ============== RECYCLING MODULE ==============

def page_recycling_home():
    """Recycling module home"""
    st.title("♻️ Recycling Tracker")
    
    # Quick Stats
    col1, col2, col3, col4 = st.columns(4)
    
    records = load_recycling_records()
    user_records = [r for r in records if r.get('user') == st.session_state.user_name]
    
    with col1:
        st.metric("Your Items Recycled", len(user_records))
    with col2:
        your_points = sum(r.get('points', 0) for r in user_records)
        st.metric("Your Points", your_points)
    with col3:
        category_count = {}
        for r in user_records:
            c = r.get('category')
            category_count[c] = category_count.get(c, 0) + 1
        st.metric("Categories", len(category_count))
    with col4:
        avg_weight = sum(r.get('weight', 0) for r in user_records) / len(user_records) if user_records else 0
        st.metric("Avg Weight", f"{avg_weight:.2f} kg")
    
    st.markdown("---")
    
    # Navigation
    nav_col1, nav_col2, nav_col3 = st.columns(3)
    
    with nav_col1:
        if st.button("📝 Log Item", key="recycling_log", use_container_width=True):
            st.session_state.current_section = "recycling_log"
            st.rerun()
    
    with nav_col2:
        if st.button("📍 Find Facilities", key="recycling_find", use_container_width=True):
            st.session_state.current_section = "recycling_facilities"
            st.rerun()
    
    with nav_col3:
        if st.button("📊 My Stats", key="recycling_stats", use_container_width=True):
            st.session_state.current_section = "recycling_stats"
            st.rerun()
    
    st.markdown("---")
    
    # Recent Activity
    st.subheader("📋 Recent Activity")
    
    if user_records:
        for record in sorted(user_records, key=lambda x: x.get('timestamp', ''), reverse=True)[:5]:
            emoji = RECYCLING_CATEGORIES.get(record.get('category', 'plastic'), {}).get('emoji', '♻️')
            st.write(f"{emoji} {record.get('item_name', 'Unknown')} - {record.get('weight', 0)} kg - **{record.get('points', 0)} pts** ({record.get('timestamp', 'N/A')[:10]})")
    else:
        st.info("No activity yet. Start logging items!")

def page_recycling_log():
    """Log a recycling item"""
    st.title("📝 Log Recycling Item")
    
    if not st.session_state.user_name:
        st.warning("⚠️ Please enter your name in sidebar")
        return
    
    col1, col2 = st.columns(2)
    
    with col1:
        category = st.selectbox(
            "Category",
            list(RECYCLING_CATEGORIES.keys()),
            format_func=lambda x: f"{RECYCLING_CATEGORIES[x]['emoji']} {x.capitalize()}"
        )
    
    with col2:
        item_name = st.text_input("Item Name", placeholder="e.g., Plastic Bottle, Newspaper")
    
    col1, col2 = st.columns(2)
    
    with col1:
        weight = st.number_input("Weight (kg)", min_value=0.1, value=1.0)
    
    with col2:
        condition = st.selectbox("Condition", ["Excellent", "Good", "Fair", "Poor"])
    
    description = st.text_area("Additional Details", placeholder="Any special notes about the item")
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("✅ Log Item", key="log_item_btn"):
            if item_name:
                points = RECYCLING_CATEGORIES[category]['points']
                
                record = {
                    "id": f"rec_{len(load_recycling_records())+1}",
                    "user": st.session_state.user_name,
                    "timestamp": datetime.now().isoformat(),
                    "item_name": item_name,
                    "category": category,
                    "weight": weight,
                    "condition": condition,
                    "description": description,
                    "points": points
                }
                
                records = load_recycling_records()
                records.append(record)
                save_recycling_records(records)
                
                st.success("✅ Item logged successfully!")
                st.balloons()
                
                # Show environmental impact
                st.markdown("### 🌍 Environmental Impact")
                impact = get_environmental_impact(category, weight)
                st.write(impact)
                
                # Get AI advice
                with st.spinner("🤖 Getting AI advice..."):
                    advice = get_recycling_advice(item_name, category)
                    st.markdown("### 💡 How to Recycle This Item")
                    st.markdown(advice)
            else:
                st.error("Please enter item name")
    
    with col2:
        if st.button("🤖 Get AI Advice", key="get_advice_btn"):
            if item_name:
                with st.spinner("🤖 Analyzing..."):
                    advice = get_recycling_advice(item_name, category)
                    st.markdown("### 💡 How to Recycle This Item")
                    st.markdown(advice)

def page_recycling_facilities():
    """Find recycling facilities with map"""
    st.title("📍 Recycling Facilities Finder")
    
    if st.session_state.user_location:
        st.success(f"✅ Location detected: {st.session_state.user_location['lat']:.4f}, {st.session_state.user_location['lon']:.4f}")
        
        # Show map
        st.subheader("🗺️ Nearby Facilities Map")
        
        radius = st.slider("Search Radius (km)", 1, 15, 5)
        
        m = create_facilities_map(
            st.session_state.user_location['lat'],
            st.session_state.user_location['lon'],
            radius
        )
        
        st_folium(m, width=1400, height=600)
        
        st.markdown("---")
        
        # List nearby facilities
        nearby = get_nearby_facilities(
            st.session_state.user_location['lat'],
            st.session_state.user_location['lon'],
            radius_km=radius
        )
        
        if nearby:
            st.subheader(f"📋 Found {len(nearby)} Facilities")
            
            for facility in nearby:
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.write(f"### 🏭 {facility['name']}")
                    st.write(f"Type: {facility.get('type', 'N/A')} | Distance: **{facility['distance_km']} km**")
                    accepts = ", ".join([f"{RECYCLING_CATEGORIES.get(cat, {}).get('emoji', '♻️')}" for cat in facility.get('accepts', [])])
                    st.caption(f"Accepts: {accepts}")
                with col2:
                    if st.button("📍 Directions", key=f"facility_{facility['name']}", use_container_width=True):
                        st.info(f"📍 Navigate to: {facility['name']} at ({facility.get('lat', 'N/A')}, {facility.get('lon', 'N/A')})")
                st.markdown("---")
        else:
            st.info(f"No facilities found within {radius} km. Try increasing the radius.")
    
    else:
        st.warning("📍 Please enable location access or set your location in sidebar")
        
        # Manual facility search
        st.markdown("---")
        st.subheader("Manual Search")
        location_input = st.text_input("Enter location/city", placeholder="e.g., New York, USA")
        
        if location_input and st.button("🔍 Search Facilities"):
            st.info(f"Searching facilities near {location_input}...")
            
            # Sample facilities
            sample_facilities = [
                {"name": "Green Recycling Center", "type": "Full Service", "distance_km": 2.5, "accepts": ["plastic", "paper", "metal", "glass"]},
                {"name": "EcoHub Station", "type": "Plastic & Paper", "distance_km": 3.2, "accepts": ["plastic", "paper"]},
                {"name": "E-Waste Processing", "type": "Electronics", "distance_km": 5.1, "accepts": ["electronics"]},
            ]
            
            for facility in sample_facilities:
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.write(f"### 🏭 {facility['name']}")
                    st.write(f"Type: {facility['type']} | Distance: {facility['distance_km']} km")
                    accepts = ", ".join([f"{RECYCLING_CATEGORIES.get(cat, {}).get('emoji', '♻️')}" for cat in facility['accepts']])
                    st.caption(f"Accepts: {accepts}")
                with col2:
                    st.button("📍 Get Directions", key=f"facility_{facility['name']}")
                st.markdown("---")

def page_recycling_stats():
    """Recycling statistics and leaderboard"""
    st.title("📊 Recycling Statistics")
    
    records = load_recycling_records()
    user_records = [r for r in records if r.get('user') == st.session_state.user_name]
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Total Items", len(user_records))
    with col2:
        total_weight = sum(r.get('weight', 0) for r in user_records)
        st.metric("Total Weight", f"{total_weight:.2f} kg")
    with col3:
        total_points = sum(r.get('points', 0) for r in user_records)
        st.metric("Total Points", total_points)
    
    st.markdown("---")
    
    # Category breakdown
    st.subheader("📈 By Category")
    
    category_stats = {}
    for record in user_records:
        cat = record.get('category')
        if cat not in category_stats:
            category_stats[cat] = {"count": 0, "weight": 0, "points": 0}
        category_stats[cat]["count"] += 1
        category_stats[cat]["weight"] += record.get('weight', 0)
        category_stats[cat]["points"] += record.get('points', 0)
    
    for cat, stats in sorted(category_stats.items(), key=lambda x: x[1]['count'], reverse=True):
        emoji = RECYCLING_CATEGORIES.get(cat, {}).get('emoji', '♻️')
        st.write(f"{emoji} **{cat.capitalize()}**: {stats['count']} items, {stats['weight']:.2f} kg, {stats['points']} pts")
    
    st.markdown("---")
    
    # Community Leaderboard
    st.subheader("🏆 Community Leaderboard")
    
    user_points = {}
    for record in records:
        user = record.get('user', 'Anonymous')
        user_points[user] = user_points.get(user, 0) + record.get('points', 0)
    
    leaderboard = sorted(user_points.items(), key=lambda x: x[1], reverse=True)
    
    for idx, (user, points) in enumerate(leaderboard[:10], 1):
        medal = "🥇" if idx == 1 else "🥈" if idx == 2 else "🥉" if idx == 3 else f"{idx}."
        is_you = " (You)" if user == st.session_state.user_name else ""
        st.write(f"{medal} **{user}** - {points} points{is_you}")

# ============== ROAD SAFETY MODULE ==============

def page_safety_home():
    """Road safety module home"""
    st.title("🚨 Road Safety & Emergency Alerts")
    
    # Location status
    if st.session_state.user_location:
        st.success(f"📍 Location: {st.session_state.user_location['lat']:.4f}, {st.session_state.user_location['lon']:.4f}")
    else:
        st.warning("📍 Location not set - click below to set")
    
    col1, col2, col3 = st.columns(3)
    
    incidents = load_incidents_db()
    critical_count = sum(1 for i in incidents if INCIDENT_TYPES.get(i.get('type', {}), {}).get('severity') == 'critical')
    
    with col1:
        st.metric("Total Incidents", len(incidents))
    with col2:
        st.metric("Critical Alerts", critical_count)
    with col3:
        st.metric("Today's Reports", sum(1 for i in incidents if i.get('timestamp', '')[:10] == datetime.now().strftime('%Y-%m-%d')))
    
    st.markdown("---")
    
    # Location picker button
    if st.button("📍 Set Location on Map", key="set_location_map", use_container_width=True, help="Click to open interactive map"):
        st.session_state.current_section = "location_picker"
        st.rerun()
    
    st.markdown("---")
    
    # Navigation
    nav_col1, nav_col2, nav_col3 = st.columns(3)
    
    with nav_col1:
        if st.button("📝 Report Incident", key="safety_report", use_container_width=True):
            st.session_state.current_section = "safety_report"
            st.rerun()
    
    with nav_col2:
        if st.button("📍 View Incidents", key="safety_view", use_container_width=True):
            st.session_state.current_section = "safety_incidents"
            st.rerun()
    
    with nav_col3:
        if st.button("📊 Analytics", key="safety_analytics", use_container_width=True):
            st.session_state.current_section = "safety_analytics"
            st.rerun()
    
    st.markdown("---")
    
    # Nearby incidents
    st.subheader("⚠️ Nearby Incidents")
    
    if st.session_state.user_location:
        nearby = get_nearby_incidents(
            st.session_state.user_location['lat'],
            st.session_state.user_location['lon'],
            radius_km=10
        )
        
        if nearby:
            st.warning(f"⚠️ {len(nearby)} incidents within 10km")
            
            for incident in nearby[:5]:
                incident_type = incident.get('type', 'unknown')
                emoji = INCIDENT_TYPES.get(incident_type, {}).get('emoji', '⚠️')
                severity = incident.get('severity', 'unknown')
                
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.write(f"{emoji} **{incident.get('description', 'No details')}**")
                    st.caption(f"{incident.get('distance_km', 'N/A')} km away | {incident.get('timestamp', 'N/A')[:10]}")
                with col2:
                    if severity == "critical":
                        st.error("CRITICAL")
                    elif severity == "medium":
                        st.warning("MEDIUM")
                    else:
                        st.info("LOW")
                st.markdown("---")
        else:
            st.success("✅ No incidents nearby. Roads are clear!")

def page_safety_report():
    """Report a road incident"""
    st.title("📝 Report Road Incident")
    
    if not st.session_state.user_name:
        st.warning("⚠️ Please enter your name in sidebar")
        return
    
    if not st.session_state.user_location:
        st.warning("⚠️ Please set your location in sidebar")
        return
    
    col1, col2 = st.columns(2)
    
    with col1:
        incident_type = st.selectbox(
            "Type of Incident",
            list(INCIDENT_TYPES.keys()),
            format_func=lambda x: f"{INCIDENT_TYPES[x]['emoji']} {INCIDENT_TYPES[x]['name']}"
        )
    
    with col2:
        severity = INCIDENT_TYPES[incident_type]['severity']
        st.write(f"Severity: **{severity.upper()}**")
    
    description = st.text_area(
        "Describe the incident",
        placeholder="Be specific about what happened, impact, and current status",
        height=100
    )
    
    col1, col2 = st.columns(2)
    
    with col1:
        has_injuries = st.checkbox("⚠️ People injured?")
    
    with col2:
        visibility = st.select_slider("Visibility", ["Poor", "Fair", "Good", "Excellent"])
    
    weather = st.selectbox("Weather", ["Clear", "Rainy", "Foggy", "Snowy", "Windy"])
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("📤 Report Incident", key="report_incident_btn"):
            if description.strip():
                incident = {
                    "id": f"incident_{len(load_incidents_db())+1}",
                    "timestamp": datetime.now().isoformat(),
                    "type": incident_type,
                    "description": description,
                    "reported_by": st.session_state.user_name,
                    "lat": st.session_state.user_location['lat'],
                    "lon": st.session_state.user_location['lon'],
                    "severity": severity,
                    "has_injuries": has_injuries,
                    "visibility": visibility,
                    "weather": weather,
                }
                
                incidents = load_incidents_db()
                incidents.append(incident)
                save_incidents_db(incidents)
                
                # Auto-send to authorities for critical incidents
                if severity == "critical" or has_injuries:
                    send_to_authorities(incident, is_emergency=has_injuries)
                
                st.success("✅ Incident reported!")
                st.balloons()
                
                # Get AI Analysis
                with st.spinner("🤖 AI analyzing..."):
                    analysis = get_ai_risk_analysis(incident_type, description)
                    st.markdown("### 🤖 AI Risk Analysis")
                    st.markdown(analysis)
            else:
                st.error("Please describe the incident")
    
    with col2:
        if st.button("🤖 Get Analysis First", key="analyze_first"):
            if description.strip():
                with st.spinner("🤖 Analyzing..."):
                    analysis = get_ai_risk_analysis(incident_type, description)
                    st.markdown("### 🤖 AI Risk Analysis")
                    st.markdown(analysis)

def page_safety_incidents():
    """View all incidents with interactive map"""
    st.title("📍 All Reported Incidents (Map View)")
    
    incidents = load_incidents_db()
    
    if not incidents:
        st.info("No incidents reported")
        return
    
    # Show map if location available
    if st.session_state.user_location:
        st.success(f"📍 Location: {st.session_state.user_location['lat']:.4f}, {st.session_state.user_location['lon']:.4f}")
        
        col1, col2 = st.columns([3, 1])
        
        with col2:
            radius = st.slider("Radius (km)", 1, 20, 10)
        
        with col1:
            st.subheader("🗺️ Incident Map")
        
        # Create and display map
        m = create_incident_map(
            st.session_state.user_location['lat'],
            st.session_state.user_location['lon'],
            radius
        )
        
        st_folium(m, width=1400, height=600)
        
        st.markdown("---")
    
    # Filters
    col1, col2, col3 = st.columns(3)
    
    with col1:
        filter_type = st.selectbox(
            "Filter Type",
            ["All"] + list(INCIDENT_TYPES.keys()),
            format_func=lambda x: "All Types" if x == "All" else f"{INCIDENT_TYPES[x]['emoji']} {INCIDENT_TYPES[x]['name']}"
        )
    
    with col2:
        filter_severity = st.selectbox("Filter Severity", ["All", "low", "medium", "critical"])
    
    with col3:
        sort_by = st.selectbox("Sort by", ["Recent", "Severity", "Distance"])
    
    st.markdown("---")
    
    # Filter
    filtered = incidents
    if filter_type != "All":
        filtered = [i for i in filtered if i.get('type') == filter_type]
    if filter_severity != "All":
        filtered = [i for i in filtered if i.get('severity') == filter_severity]
    
    # Sort
    if sort_by == "Recent":
        filtered = sorted(filtered, key=lambda x: x.get('timestamp', ''), reverse=True)
    elif sort_by == "Severity":
        severity_order = {"critical": 0, "medium": 1, "low": 2}
        filtered = sorted(filtered, key=lambda x: severity_order.get(x.get('severity', 'low'), 2))
    else:  # Distance
        if st.session_state.user_location:
            for incident in filtered:
                dist = calculate_distance(
                    st.session_state.user_location['lat'],
                    st.session_state.user_location['lon'],
                    incident.get('lat', 0),
                    incident.get('lon', 0)
                )
                incident['distance_km'] = round(dist, 2)
            filtered = sorted(filtered, key=lambda x: x.get('distance_km', float('inf')))
    
    st.write(f"**Found {len(filtered)} incidents**")
    st.markdown("---")
    
    for incident in filtered[:20]:
        incident_type = incident.get('type', 'unknown')
        emoji = INCIDENT_TYPES.get(incident_type, {}).get('emoji', '⚠️')
        severity = incident.get('severity', 'unknown')
        
        col1, col2 = st.columns([3, 1])
        
        with col1:
            st.write(f"### {emoji} {incident.get('description', 'No details')}")
            st.caption(f"📍 ({incident.get('lat', 'N/A')}, {incident.get('lon', 'N/A')}) | 👤 {incident.get('reported_by', 'Anonymous')} | ⏰ {incident.get('timestamp', 'N/A')[:10]}")
        
        with col2:
            if severity == "critical":
                st.error("CRITICAL")
            elif severity == "medium":
                st.warning("MEDIUM")
            else:
                st.info("LOW")
        
        st.markdown("---")

def page_safety_analytics():
    """Safety analytics"""
    st.title("📊 Safety Analytics")
    
    incidents = load_incidents_db()
    
    if not incidents:
        st.info("No data yet")
        return
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("Total Incidents", len(incidents))
    with col2:
        critical = sum(1 for i in incidents if i.get('severity') == 'critical')
        st.metric("Critical", critical)
    with col3:
        today = sum(1 for i in incidents if i.get('timestamp', '')[:10] == datetime.now().strftime('%Y-%m-%d'))
        st.metric("Today", today)
    
    st.markdown("---")
    
    # Type breakdown
    st.subheader("📈 By Type")
    
    types_count = {}
    for incident in incidents:
        t = incident.get('type', 'unknown')
        types_count[t] = types_count.get(t, 0) + 1
    
    for incident_type, count in sorted(types_count.items(), key=lambda x: x[1], reverse=True):
        emoji = INCIDENT_TYPES.get(incident_type, {}).get('emoji', '⚠️')
        name = INCIDENT_TYPES.get(incident_type, {}).get('name', incident_type)
        st.write(f"{emoji} {name}: **{count}**")

def page_emergency_sos():
    """Emergency SOS"""
    st.title("🚨 EMERGENCY SOS")
    
    if not st.session_state.user_name:
        st.error("❌ Please enter your name in sidebar")
        return
    
    if not st.session_state.user_location:
        st.error("❌ Please set your location in sidebar")
        return
    
    st.markdown("---")
    
    emergency_type = st.radio(
        "Select emergency type:",
        ["Medical", "Accident", "Road Danger", "Other"],
        horizontal=True
    )
    
    emergency_details = st.text_area(
        "Describe your emergency",
        placeholder="Be specific and brief",
        height=100
    )
    
    col1, col2 = st.columns(2)
    
    with col1:
        num_injured = st.number_input("Number needing help:", min_value=0, max_value=10)
    with col2:
        require_ambulance = st.checkbox("Ambulance needed?")
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("🚨 SEND SOS", key="send_sos", use_container_width=True):
            if emergency_details.strip():
                emergency = {
                    "id": f"sos_{len(load_incidents_db())+1}",
                    "timestamp": datetime.now().isoformat(),
                    "type": emergency_type,
                    "description": emergency_details,
                    "reporter": st.session_state.user_name,
                    "lat": st.session_state.user_location['lat'],
                    "lon": st.session_state.user_location['lon'],
                    "severity": "critical",
                    "is_emergency": True,
                    "injured": num_injured,
                }
                
                incidents = load_incidents_db()
                incidents.append(emergency)
                save_incidents_db(incidents)
                
                send_to_authorities(emergency, is_emergency=True)
                
                st.success("✅ SOS SENT!")
                st.balloons()
                
                with st.spinner("🤖 Getting response..."):
                    suggestions = get_emergency_response_suggestion(emergency_details, 5)
                    st.markdown("### 🚨 RESPONSE GUIDANCE")
                    st.markdown(suggestions)
            else:
                st.error("Describe your emergency")
    
    with col2:
        if st.button("📍 Share Location", key="share_loc", use_container_width=True):
            st.success(f"Location shared: ({st.session_state.user_location['lat']}, {st.session_state.user_location['lon']})")

# ============== MAIN APP ==============

def main():
    if st.session_state.emergency_mode:
        page_emergency_sos()
        st.markdown("---")
        if st.button("⏹️ Exit Emergency"):
            st.session_state.emergency_mode = False
            st.rerun()
        return
    
    # Route to pages
    if st.session_state.current_section == "home":
        page_home()
    
    elif st.session_state.current_section == "recycling_home":
        page_recycling_home()
    elif st.session_state.current_section == "recycling_log":
        page_recycling_log()
        if st.button("← Back to Recycling"):
            st.session_state.current_section = "recycling_home"
            st.rerun()
    elif st.session_state.current_section == "recycling_facilities":
        page_recycling_facilities()
        if st.button("← Back to Recycling"):
            st.session_state.current_section = "recycling_home"
            st.rerun()
    elif st.session_state.current_section == "recycling_stats":
        page_recycling_stats()
        if st.button("← Back to Recycling"):
            st.session_state.current_section = "recycling_home"
            st.rerun()
    
    elif st.session_state.current_section == "safety_home":
        page_safety_home()
    elif st.session_state.current_section == "location_picker":
        st.title("📍 Set Your Location")
        st.write("Click on the map below to pin your exact location - just like Blinkit!")
        
        # Get current location or default
        current_lat = st.session_state.user_location['lat'] if st.session_state.user_location else 28.6139
        current_lon = st.session_state.user_location['lon'] if st.session_state.user_location else 77.2090
        
        interactive_map_location_picker(current_lat, current_lon)
        
        st.markdown("---")
        if st.button("✅ Confirm & Go to Safety", use_container_width=True):
            if st.session_state.user_location:
                st.session_state.current_section = "safety_home"
                st.rerun()
            else:
                st.error("Please click on map to set location")
    elif st.session_state.current_section == "safety_report":
        page_safety_report()
        if st.button("← Back to Safety"):
            st.session_state.current_section = "safety_home"
            st.rerun()
    elif st.session_state.current_section == "safety_incidents":
        page_safety_incidents()
        if st.button("← Back to Safety"):
            st.session_state.current_section = "safety_home"
            st.rerun()
    elif st.session_state.current_section == "safety_analytics":
        page_safety_analytics()
        if st.button("← Back to Safety"):
            st.session_state.current_section = "safety_home"
            st.rerun()

if __name__ == "__main__":
    main()
