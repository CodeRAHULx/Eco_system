# 🚀 Quick Start Guide - EcoHub

## 5-Minute Setup

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Get API Keys
1. **Groq API Key** (Free):
   - Go to https://console.groq.com
   - Sign up (free account)
   - Create API key
   - Copy the key

### Step 3: Configure Environment
Create `.streamlit/secrets.toml`:
```toml
[api_keys]
groq_api_key = "gsk_your_key_here"
```

### Step 4: Run App
```bash
streamlit run app.py
```

The app will open in your browser at `http://localhost:8501`

---

## First Time Usage

### Recycling Module Setup
1. **Enter Your Name**: Type in sidebar → it appears in all your records
2. **Log Your First Item**:
   - Click "Go to Recycling"
   - Click "Log Item"
   - Select category (e.g., Plastic)
   - Enter item name (e.g., "Water Bottle")
   - Enter weight (0.5 kg)
   - Click "Log Item"
   - See environmental impact!

3. **Find Facilities**:
   - Click "Find Facilities"
   - Enter your city name
   - See nearby recycling centers
   - Get directions

### Road Safety Module Setup
1. **Set Your Location**: 
   - In sidebar, enter Latitude and Longitude
   - Example: NYC = (40.7128, -74.0060)
   
2. **Check Nearby Incidents**:
   - Home shows incidents within 10km
   - Click incident to see details
   
3. **Report an Incident**:
   - Click "Go to Road Safety"
   - Click "Report Incident"
   - Select incident type
   - Describe what happened
   - Click "Report Incident"
   - Get AI risk analysis instantly!

4. **Emergency SOS**:
   - Click red "🚨 EMERGENCY SOS" button in sidebar
   - Describe your emergency
   - Click "SEND SOS"
   - Automatic authority alert + emergency guidance

---

## Features Overview

### 🌍 Home Page
- **Overview**: Global statistics
- **Module Selection**: Switch between recycling and safety
- **Quick Links**: Fast access to all features

### ♻️ Recycling Features

#### 📝 Log Item
- Track what you recycle
- Automatic points calculation
- Environmental impact display
- AI recycling tips

#### 📍 Find Facilities
- GPS-based facility search
- Filter by material type
- Distance display
- Hours of operation

#### 📊 My Stats
- Items recycled count
- Total weight
- Points earned
- Category breakdown
- Community leaderboard

### 🚨 Safety Features

#### 📝 Report Incident
- 9 incident types to choose from
- Real-time location
- Weather & visibility info
- Automatic authority alert (if critical)
- AI risk analysis

#### 📍 View Incidents
- All reported incidents
- Filter by type/severity
- Sort by date/severity
- Distance from you
- Reporter information

#### 📊 Analytics
- Incident breakdown
- Hotspot detection
- Trend analysis
- Authority recommendations

#### 🚨 Emergency SOS
- One-click emergency
- Immediate location share
- Step-by-step emergency guidance
- Alerts nearby users
- Auto-notify authorities

---

## Sample Data to Try

### Recycling Items
- Plastic bottle (0.5 kg) = 5 points
- Newspaper (1 kg) = 8 points
- Aluminum can (0.1 kg) = 1.5 points
- Glass bottle (0.3 kg) = 3.6 points
- Old laptop (2 kg) = 100 points!

### Road Incidents
**Traffic Jam**
- Location: (40.7128, -74.0060)
- Description: Heavy traffic on 5th Avenue
- Severity: Medium

**Accident** (Critical)
- Location: (40.7489, -73.9680)
- Description: 3-car collision blocking lanes
- Severity: Critical
- Injuries: 2 people

---

## Database Files

### Where is my data?
```
d:\hackzenu\project_x-main\
├── data.json              ← Road incidents
├── recycling_records.json ← Recycling items
├── users.json            ← User profiles
├── facilities.json       ← Recycling centers
└── authority_alerts.log  ← Emergency logs
```

### Viewing Raw Data
```bash
# View incidents
type d:\hackzenu\project_x-main\data.json

# View your recycling records
type d:\hackzenu\project_x-main\recycling_records.json
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `r` | Rerun app |
| `c` | Clear cache |
| `s` | Share app (when deployed) |

---

## Common Questions

### Q: Can I use the app offline?
**A:** Yes! The app stores everything locally in JSON files. You need internet only for AI features.

### Q: How is my location used?
**A:** Location is stored locally only when you're reporting incidents or finding facilities. You control what's shared.

### Q: Will authorities really be notified?
**A:** Currently, alerts are logged locally. In production, we'll integrate with actual emergency services (SMS, email, APIs).

### Q: How do I earn more points?
**A:** Recycle different items! Electronics give the most points (50 pts per kg). Aim for variety.

### Q: Can I compete with friends?
**A:** Yes! Check the leaderboard to see who has the most points. Just make sure they use the app.

---

## Troubleshooting

### App won't start
```bash
# Check Python version
python --version

# Reinstall dependencies
pip install -r requirements.txt --upgrade

# Clear Streamlit cache
streamlit cache clear
```

### Groq API errors
```
Error: "API key invalid"
Solution: Double-check your API key in .streamlit/secrets.toml

Error: "Rate limit exceeded"
Solution: Wait a few minutes, free tier has limited calls
```

### Location not working
```
1. Make sure you entered valid coordinates (not 0,0)
2. Example: NYC = (40.7128, -74.0060)
3. Don't use street addresses, only coordinates
```

### Data not saving
```
1. Check file permissions on project folder
2. Make sure you have write access
3. Check available disk space
```

---

## Tips & Tricks

### Recycling Tips
1. 💡 Log items in batches for more points
2. 💡 Electronics are worth the most points!
3. 💡 Check conditions carefully (damaged items have lower impact)
4. 💡 Use AI advice before going to facility
5. 💡 Visit nearby facilities for convenience

### Safety Tips
1. 🛣️ Always set your location before reporting
2. 🛣️ Be detailed in incident descriptions
3. 🛣️ Check nearby incidents before traveling
4. 🛣️ Use AI analysis to plan your route
5. 🛣️ Report critical incidents immediately
6. 🛣️ Share this app with friends for better coverage

### General Tips
1. ⚙️ Customize notification preferences in Settings
2. ⚙️ Update your profile regularly
3. ⚙️ Check Analytics to see community impact
4. ⚙️ Join community challenges (coming soon)
5. ⚙️ Share on social media (coming soon)

---

## Next Steps

### To Contribute Features
1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes and test
4. Commit: `git commit -m "Add new feature"`
5. Push: `git push origin feature/my-feature`
6. Create Pull Request

### To Report Issues
- Create GitHub issue with:
  - What you were doing
  - What happened
  - Expected behavior
  - Error messages/logs

### To Request Features
- Create GitHub discussion
- Describe the feature
- Explain the benefit
- Show examples (if applicable)

---

## Useful Links

- 🔗 [Groq API Docs](https://console.groq.com/docs)
- 🔗 [Streamlit Docs](https://docs.streamlit.io)
- 🔗 [GitHub Issues](https://github.com/yourusername/ecohub/issues)
- 🔗 [Community Discord](https://discord.gg/yourdiscord)

---

## Need Help?

1. **Check the FAQ** above
2. **Read ARCHITECTURE.md** for technical details
3. **Search GitHub issues** for similar problems
4. **Contact support**: support@ecohub.app

---

## What's Next?

### Phase 2 Coming Soon 🚀
- 📱 Mobile app (iOS/Android)
- 🗺️ Interactive maps
- 🏆 Achievements & badges
- 💬 Community chat
- 🔔 Push notifications

---

**Happy Recycling & Safe Travels!** 🌍🚨

*Last Updated: 2026-01-23*
