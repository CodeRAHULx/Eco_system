# 🗑️ SMART WASTE MANAGEMENT SYSTEM - Master Project Plan

## Project: EcoSus Smart Waste System
**Created:** January 29, 2026  
**Last Updated:** January 29, 2026  
**Architecture:** Monorepo with Node.js Backend + Python AI Service  
**Status:** 🟡 In Development

---

## 📊 CURRENT STATE ANALYSIS

### ✅ What Already Exists (D:\hehehe)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Server Entry | `server.js` | ✅ Done | Express server on port 5000 |
| App Config | `src/app.js` | ✅ Done | Express app with middleware |
| Database | `src/config/db.js` | ✅ Done | MongoDB connection |
| Firebase | `src/config/firebase.js` | ✅ Done | Phone auth backend |
| Auth Routes | `src/routes/auth.routes.js` | ✅ Done | OTP endpoints |
| Auth Controller | `src/controllers/authController.js` | ✅ Done | Login/verify logic |
| User Model | `src/models/User.js` | ✅ Done | Enhanced with profile, subscription, stats |
| User Routes | `src/routes/user.routes.js` | ✅ Done | Profile CRUD, stats, location |
| User Controller | `src/controllers/user.controller.js` | ✅ Done | Profile management |
| OTP Model | `src/models/otp.js` | ✅ Exists | OTP storage |
| Auth Middleware | `src/middleware/auth.js` | ✅ Exists | JWT verification |
| Frontend Login | `public/index.html` | ✅ Done | Phone OTP login UI |
| Frontend Dashboard | `public/dashboard.html` | ✅ Done | User dashboard with stats |
| Firebase Config | `firebase-service-account.json` | ✅ Done | Admin SDK |
| Environment | `.env` | ✅ Done | All secrets configured |

### 🔴 What Needs to Be Built

| Component | Priority | Status |
|-----------|----------|--------|
| User Profile System | P1 | ✅ DONE |
| Subscription System | P1 | 🔴 Not Started |
| Garbage Service System | P1 | 🔴 Not Started |
| Location Service | P1 | 🔴 Not Started |
| Worker System | P2 | 🔴 Not Started |
| Admin Panel | P2 | 🔴 Not Started |
| Python AI Service | P2 | 🔴 Not Started |
| Heatmap System | P3 | 🔴 Not Started |
| Vehicle Routing | P3 | 🔴 Not Started |
| Notification System | P3 | 🔴 Not Started |

---

## 🏗️ TARGET ARCHITECTURE

```
smart-waste-system/
│
├── backend-node/                 # ✅ Current: D:\hehehe
│   ├── src/
│   │   ├── app.js               # ✅ EXISTS
│   │   ├── server.js            # ✅ EXISTS (at root)
│   │   │
│   │   ├── config/
│   │   │   ├── db.js            # ✅ EXISTS
│   │   │   ├── firebase.js      # ✅ EXISTS
│   │   │   ├── env.js           # 🔴 TO CREATE
│   │   │   └── redis.js         # 🔴 TO CREATE (optional)
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js   # ✅ EXISTS
│   │   │   ├── user.routes.js   # ✅ EXISTS (profile, stats, location)
│   │   │   ├── subscription.routes.js  # 🔴 TO CREATE
│   │   │   ├── service.routes.js       # 🔴 TO CREATE
│   │   │   ├── garbage.routes.js       # 🔴 TO CREATE
│   │   │   ├── location.routes.js      # 🔴 TO CREATE
│   │   │   ├── ai.routes.js            # 🔴 TO CREATE
│   │   │   ├── worker.routes.js        # 🔴 TO CREATE
│   │   │   └── admin.routes.js         # 🔴 TO CREATE
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js       # ✅ EXISTS
│   │   │   ├── user.controller.js      # ✅ EXISTS (profile CRUD)
│   │   │   ├── subscription.controller.js  # 🔴 TO CREATE
│   │   │   ├── service.controller.js   # 🔴 TO CREATE
│   │   │   ├── garbage.controller.js   # 🔴 TO CREATE
│   │   │   ├── location.controller.js  # 🔴 TO CREATE
│   │   │   ├── ai.controller.js        # 🔴 TO CREATE
│   │   │   ├── worker.controller.js    # 🔴 TO CREATE
│   │   │   └── admin.controller.js     # 🔴 TO CREATE
│   │   │
│   │   ├── services/
│   │   │   ├── Otp_Service.js          # ✅ EXISTS
│   │   │   ├── auth.service.js         # 🔴 TO CREATE
│   │   │   ├── user.service.js         # 🔴 TO CREATE
│   │   │   ├── subscription.service.js # 🔴 TO CREATE
│   │   │   ├── garbage.service.js      # 🔴 TO CREATE
│   │   │   ├── location.service.js     # 🔴 TO CREATE
│   │   │   ├── ai.service.js           # 🔴 TO CREATE
│   │   │   ├── notification.service.js # 🔴 TO CREATE
│   │   │   └── routing.service.js      # 🔴 TO CREATE
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.js                 # ✅ EXISTS (as auth.js)
│   │   │   ├── role.middleware.js      # 🔴 TO CREATE
│   │   │   ├── error.middleware.js     # 🔴 TO CREATE
│   │   │   └── rateLimit.middleware.js # 🔴 TO CREATE
│   │   │
│   │   ├── models/
│   │   │   ├── User.js                 # ✅ EXISTS (needs update)
│   │   │   ├── otp.js                  # ✅ EXISTS
│   │   │   ├── profile.model.js        # 🔴 TO CREATE
│   │   │   ├── subscription.model.js   # 🔴 TO CREATE
│   │   │   ├── order.model.js          # 🔴 TO CREATE
│   │   │   ├── garbage.model.js        # 🔴 TO CREATE
│   │   │   ├── society.model.js        # 🔴 TO CREATE
│   │   │   ├── area.model.js           # 🔴 TO CREATE
│   │   │   ├── worker.model.js         # 🔴 TO CREATE
│   │   │   ├── vehicle.model.js        # 🔴 TO CREATE
│   │   │   └── aiResult.model.js       # 🔴 TO CREATE
│   │   │
│   │   ├── utils/
│   │   │   ├── phoneOTP.js             # ✅ EXISTS
│   │   │   ├── jwt.js                  # 🔴 TO CREATE
│   │   │   ├── geo.js                  # 🔴 TO CREATE
│   │   │   ├── response.js             # 🔴 TO CREATE
│   │   │   └── validator.js            # 🔴 TO CREATE
│   │   │
│   │   └── jobs/
│   │       ├── scheduler.job.js        # 🔴 TO CREATE
│   │       ├── heatmap.job.js          # 🔴 TO CREATE
│   │       └── route.job.js            # 🔴 TO CREATE
│   │
│   └── public/
│       ├── index.html                  # ✅ EXISTS (Login)
│       ├── dashboard.html              # 🔴 TO CREATE
│       ├── profile.html                # 🔴 TO CREATE
│       ├── services.html               # 🔴 TO CREATE
│       ├── orders.html                 # 🔴 TO CREATE
│       ├── worker/                     # 🔴 TO CREATE
│       └── admin/                      # 🔴 TO CREATE
│
├── ai-python/                    # 🔴 SEPARATE SERVICE (TO CREATE)
│   ├── app.py                    # FastAPI server
│   ├── models/
│   │   ├── object_detection.py
│   │   ├── garbage_classifier.py
│   │   ├── segregation_model.py
│   │   ├── heatmap_model.py
│   │   └── prediction_model.py
│   │
│   ├── services/
│   │   ├── scan_service.py
│   │   ├── classify_service.py
│   │   ├── segregation_service.py
│   │   └── analytics_service.py
│   │
│   ├── integrations/
│   │   ├── gemini_client.py
│   │   └── grok_client.py
│   │
│   └── requirements.txt
│
└── docker-compose.yml            # 🔴 TO CREATE
```

---

## 🔄 SYSTEM FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SMART WASTE MANAGEMENT SYSTEM                             │
└─────────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │     USER APPS        │
                    │  (Web / Mobile)      │
                    └──────────┬───────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                         NODE.JS BACKEND (API GATEWAY)                            │
│                                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    AUTH     │  │    USER     │  │  GARBAGE    │  │   WORKER    │             │
│  │   Routes    │  │   Routes    │  │   Routes    │  │   Routes    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │SUBSCRIPTION │  │  LOCATION   │  │     AI      │  │   ADMIN     │             │
│  │   Routes    │  │   Routes    │  │   Routes    │  │   Routes    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘             │
└───────────────────────────────┬──────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
        ┌───────────────────┐    ┌───────────────────┐
        │   MONGODB         │    │  PYTHON AI        │
        │   Database        │    │  FastAPI Service  │
        │                   │    │                   │
        │ • Users           │    │ • Gemini API      │
        │ • Subscriptions   │    │ • Grok API        │
        │ • Orders          │    │ • Object Detection│
        │ • Garbage Data    │    │ • Classification  │
        │ • Workers         │    │ • Segregation     │
        │ • Vehicles        │    │ • Heatmap         │
        │ • AI Results      │    │ • Analytics       │
        └───────────────────┘    └───────────────────┘
```

---

## 📋 DEVELOPMENT PHASES

### Phase 1: Core User Features (Week 1-2)
- [x] Phone OTP Login ✅
- [ ] User Profile (name, city, area, language)
- [ ] JWT Protected Routes
- [ ] User Dashboard UI
- [ ] Subscription Plans (Basic, Premium, Enterprise)
- [ ] Order Creation

### Phase 2: Garbage Service (Week 2-3)
- [ ] Garbage Service Selection
- [ ] Location Auto-fetch (Geolocation API)
- [ ] Date/Time Slot Selection
- [ ] Order Management
- [ ] Order History
- [ ] Order Tracking

### Phase 3: Worker System (Week 3-4)
- [ ] Worker Registration
- [ ] Worker Dashboard
- [ ] Task Assignment
- [ ] Route Optimization
- [ ] Live Location Tracking
- [ ] Pickup Confirmation

### Phase 4: AI Integration (Week 4-5)
- [ ] Python FastAPI Service Setup
- [ ] Gemini API Integration
- [ ] Grok API Integration
- [ ] Image Upload & Processing
- [ ] Garbage Classification
- [ ] Segregation Prediction
- [ ] Store AI Results

### Phase 5: Analytics & Admin (Week 5-6)
- [ ] Heatmap Generation
- [ ] Area Analytics
- [ ] Admin Dashboard
- [ ] Vehicle Management
- [ ] Society Management
- [ ] Reports & Exports

### Phase 6: Advanced Features (Week 6+)
- [ ] Notifications (Push/SMS/Email)
- [ ] Real-time Tracking (Socket.io)
- [ ] Custom AI Model Training
- [ ] Mobile App (React Native)
- [ ] Payment Integration

---

## 🔐 ROLE SYSTEM

| Role | Access Level | Permissions |
|------|--------------|-------------|
| USER | Basic | Profile, Orders, Subscriptions, History |
| WORKER | Operational | Tasks, Routes, Pickups, Location Updates |
| SOCIETY_ADMIN | Society | Society Users, Waste Stats, Local Heatmap |
| AREA_ADMIN | Regional | Area Analytics, Vehicle Mgmt, Worker Allocation |
| SUPER_ADMIN | Full | Everything + System Config |

---

## 🗄️ DATABASE SCHEMAS (MongoDB)

### User Schema (Enhanced)
```javascript
{
  phoneNumber: String (unique),
  firebaseUid: String,
  isVerified: Boolean,
  role: Enum['USER', 'WORKER', 'SOCIETY_ADMIN', 'AREA_ADMIN', 'SUPER_ADMIN'],
  profile: {
    name: String,
    email: String,
    avatar: String,
    city: String,
    area: String,
    society: ObjectId (ref: Society),
    language: String,
    address: {
      street: String,
      landmark: String,
      pincode: String,
      coordinates: { lat: Number, lng: Number }
    }
  },
  subscription: {
    plan: Enum['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'],
    startDate: Date,
    endDate: Date,
    isActive: Boolean
  },
  stats: {
    points: Number,
    ecoCredits: Number,
    level: Number,
    totalScans: Number,
    co2Saved: Number,
    totalOrders: Number,
    recycledKg: Number
  },
  devices: [{
    deviceId: String,
    fcmToken: String,
    lastActive: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Order Schema
```javascript
{
  orderId: String (unique),
  user: ObjectId (ref: User),
  type: Enum['PICKUP', 'DROP', 'SCHEDULED'],
  status: Enum['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
  garbage: {
    categories: [String],
    estimatedWeight: Number,
    images: [String],
    aiResult: ObjectId (ref: AIResult)
  },
  location: {
    address: String,
    coordinates: { lat: Number, lng: Number },
    landmark: String
  },
  schedule: {
    date: Date,
    timeSlot: String,
    isRecurring: Boolean,
    frequency: Enum['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY']
  },
  assignment: {
    worker: ObjectId (ref: Worker),
    vehicle: ObjectId (ref: Vehicle),
    assignedAt: Date,
    completedAt: Date
  },
  pricing: {
    basePrice: Number,
    discount: Number,
    total: Number,
    isPaid: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### AIResult Schema
```javascript
{
  order: ObjectId (ref: Order),
  imageUrl: String,
  provider: Enum['GEMINI', 'GROK', 'CUSTOM'],
  detectedObjects: [String],
  classification: {
    organic: [String],
    plastic: [String],
    metal: [String],
    glass: [String],
    paper: [String],
    hazardous: [String],
    electronic: [String]
  },
  scores: {
    mixedWasteProbability: Number,
    segregationScore: Number,
    recyclingPotential: Number,
    environmentalRisk: Number
  },
  quantityEstimation: Enum['LOW', 'MEDIUM', 'HIGH'],
  summary: String,
  rawResponse: Object,
  processedAt: Date
}
```

---

## 🔌 API ENDPOINTS OVERVIEW

### Auth APIs (✅ DONE)
```
POST /api/auth/send-otp          # Send OTP (dev)
POST /api/auth/verify-otp        # Verify OTP (dev)
POST /api/auth/firebase-auth     # Firebase phone auth
```

### User APIs (🔴 TO BUILD)
```
GET    /api/user/profile         # Get profile
PUT    /api/user/profile         # Update profile
GET    /api/user/stats           # Get user stats
GET    /api/user/orders          # Get order history
DELETE /api/user/account         # Delete account
```

### Subscription APIs (🔴 TO BUILD)
```
GET    /api/subscription/plans   # List plans
POST   /api/subscription/subscribe  # Subscribe to plan
GET    /api/subscription/current    # Current subscription
POST   /api/subscription/cancel     # Cancel subscription
```

### Garbage Service APIs (🔴 TO BUILD)
```
POST   /api/garbage/order        # Create pickup order
GET    /api/garbage/order/:id    # Get order details
PUT    /api/garbage/order/:id    # Update order
DELETE /api/garbage/order/:id    # Cancel order
GET    /api/garbage/slots        # Available time slots
GET    /api/garbage/categories   # Garbage categories
```

### Location APIs (🔴 TO BUILD)
```
POST   /api/location/detect      # Auto-detect location
GET    /api/location/areas       # List service areas
GET    /api/location/societies   # List societies in area
POST   /api/location/validate    # Validate serviceable
```

### AI APIs (🔴 TO BUILD)
```
POST   /api/ai/scan              # Upload & scan image
POST   /api/ai/classify          # Classify garbage
GET    /api/ai/result/:id        # Get AI result
POST   /api/ai/feedback          # User feedback on AI
```

### Worker APIs (🔴 TO BUILD)
```
GET    /api/worker/tasks         # Get assigned tasks
PUT    /api/worker/task/:id      # Update task status
POST   /api/worker/location      # Update live location
GET    /api/worker/route         # Get optimized route
POST   /api/worker/complete      # Complete pickup
```

### Admin APIs (🔴 TO BUILD)
```
GET    /api/admin/dashboard      # Dashboard stats
GET    /api/admin/users          # List users
GET    /api/admin/orders         # List orders
GET    /api/admin/workers        # List workers
GET    /api/admin/analytics      # Analytics data
GET    /api/admin/heatmap        # Heatmap data
```

---

## 🤖 AI INTEGRATION PLAN

### Python AI Service (FastAPI)
```
ai-python/
├── app.py                    # Main FastAPI app
├── requirements.txt
├── .env
│
├── integrations/
│   ├── gemini_client.py     # Google Gemini API
│   └── grok_client.py       # xAI Grok API
│
├── services/
│   ├── scan_service.py      # Image processing
│   ├── classify_service.py  # Garbage classification
│   └── analytics_service.py # Heatmap & prediction
│
└── models/
    └── schemas.py           # Pydantic schemas
```

### AI API Endpoints (FastAPI)
```
POST /ai/scan                 # Scan garbage image
POST /ai/classify             # Classify waste
POST /ai/segregate            # Segregation plan
GET  /ai/analytics            # Analytics data
POST /ai/heatmap              # Generate heatmap
```

### AI Prompts (Gemini/Grok)
See PHONE_AUTH_DOCUMENTATION.md for prompt templates.

---

## 🚀 IMMEDIATE NEXT STEPS

### Step 1: User Profile System
1. Update User model with full schema
2. Create user.routes.js
3. Create user.controller.js
4. Build profile UI page
5. Add JWT protection

### Step 2: Dashboard UI
1. Create dashboard.html
2. Show user stats
3. Quick actions
4. Recent orders

### Step 3: Subscription System
1. Create subscription.model.js
2. Create subscription routes/controller
3. Subscription UI

**Ready to start with Step 1?**

---

## 📚 REFERENCE LINKS

- **GitHub Reference:** https://github.com/nodesagar/project_x
- **Firebase Console:** https://console.firebase.google.com/project/ecosus-6eb45
- **MongoDB Atlas:** Your cluster connection
- **Gemini API:** https://ai.google.dev/
- **Grok API:** https://x.ai/api

---

## 📝 CHANGELOG

| Date | Changes |
|------|---------|
| Jan 29, 2026 | Initial setup, Phone OTP login completed |
| Jan 29, 2026 | Firebase integration completed |
| Jan 29, 2026 | Master project plan created |

---

*Document maintained by AI Assistant - Last updated: January 29, 2026*
