# 🌱 EcoNexus - AI-Powered Smart Campus Sustainability Platform

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

> **AI + Sustainability + Smart Campus** - An intelligent waste management and environmental sustainability platform

## 🚀 Live Demo

**API URL:** `https://econexus-api.onrender.com`

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Waste Scanner** | Scan waste items and get instant classification |
| 🎯 **Smart Segregation** | City-specific bin sorting with color codes |
| ♻️ **Recyclability Checker** | AI suggests reuse, upcycle, donate options |
| 🗺️ **Smart Routes** | AI-optimized collection routes for workers |
| 🔔 **Smart Reminders** | Personalized pickup notifications |
| 🏆 **Community Challenges** | Gamification for user engagement |
| 📊 **Environmental Impact** | Track CO2 saved, trees equivalent |
| 🚨 **Incident Reporting** | Report and track waste-related issues |

## 🛠️ Tech Stack

- **Backend:** Node.js, Express 5.x
- **Database:** MongoDB Atlas
- **AI:** Google Gemini 2.0 Flash
- **Auth:** Firebase Phone OTP + JWT
- **Payments:** Stripe

## 📦 Quick Start (Local)

```bash
# Clone the repo
git clone https://github.com/CodeRAHULx/Eco_system.git
cd Eco_system

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Start server
npm start
```

## 🌐 Deploy to Render (Free)

### Step 1: Fork/Clone Repository
```bash
git clone https://github.com/CodeRAHULx/Eco_system.git
```

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 3: Deploy
1. Click **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name:** `econexus-api`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### Step 4: Add Environment Variables
In Render dashboard, add these:

| Key | Value |
|-----|-------|
| `DATABASE` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Any random secret string |
| `GEMINI_API_KEY` | Your Google AI API key |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `NODE_ENV` | `production` |

### Step 5: Deploy!
Click **Create Web Service** and wait ~5 minutes.

Your API will be live at: `https://your-app-name.onrender.com`

## 📚 API Documentation

See full documentation: [docs/README.md](docs/README.md)

### Quick API Test
```bash
# Test if server is running
curl https://your-app.onrender.com/api/ai/challenges

# Test AI Recyclability
curl -X POST https://your-app.onrender.com/api/ai/check-recyclability \
  -H "Content-Type: application/json" \
  -d '{"item":"plastic bottle"}'
```

## 👥 Team

- **Project:** EcoNexus
- **Theme:** AI + Sustainability + Smart Campus

## 📄 License

MIT License

---

Made with 💚 for a sustainable future