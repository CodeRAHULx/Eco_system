# 📱 Phone OTP Authentication System - Complete Documentation

## Project: EcoSus Login System
**Created:** January 29, 2026  
**Technology Stack:** Node.js, Express.js, MongoDB, Firebase Phone Authentication

---

## 📁 Project Structure

```
D:\hehehe\
├── .env                          # Environment variables (API keys, secrets)
├── .firebaserc                   # Firebase project configuration
├── .github/
│   └── workflows/
│       ├── firebase-hosting-merge.yml      # Auto-deploy on merge to main
│       └── firebase-hosting-pull-request.yml  # Deploy preview on PR
├── firebase.json                 # Firebase hosting configuration
├── firebase-service-account.json # Firebase Admin SDK credentials (DO NOT SHARE!)
├── package.json                  # Node.js dependencies
├── server.js                     # Server entry point
├── public/
│   └── index.html               # Frontend login page with OTP UI
└── src/
    ├── app.js                   # Express app configuration
    ├── config/
    │   ├── db.js               # MongoDB connection
    │   └── firebase.js         # Firebase Admin SDK initialization
    ├── controllers/
    │   └── authController.js   # Authentication logic (OTP send/verify)
    ├── middleware/
    │   └── auth.js             # JWT authentication middleware
    ├── models/
    │   ├── otp.js              # OTP model (if needed)
    │   └── User.js             # User model with phone verification
    ├── routes/
    │   └── auth.routes.js      # API routes for authentication
    ├── services/
    │   └── Otp_Service.js      # OTP service (optional)
    └── utils/
        └── phoneOTP.js         # OTP generation and validation utilities
```

---

## 🔧 Configuration Files Explained

### 1. `.env` - Environment Variables
**Location:** `D:\hehehe\.env`

```env
# Database Configuration
DATABASE=mongodb+srv://username:password@cluster.mongodb.net/dbname
DATABASE_PASSWORD=your_password

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

**Purpose:** 
- Stores sensitive configuration
- Never commit this file to Git
- Contains database URL, JWT secret, Firebase path

---

### 2. `firebase-service-account.json` - Firebase Admin Credentials
**Location:** `D:\hehehe\firebase-service-account.json`

**Purpose:**
- Backend authentication with Firebase
- Verifies Firebase ID tokens from frontend
- Downloaded from Firebase Console > Project Settings > Service Accounts

**⚠️ SECURITY:** Never share or commit this file!

---

## 📄 Backend Files Explained

### 1. `server.js` - Entry Point
**Location:** `D:\hehehe\server.js`

```javascript
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
```

**Purpose:** Starts the Express server on specified port

---

### 2. `src/app.js` - Express Application
**Location:** `D:\hehehe\src\app.js`

```javascript
const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const { initializeFirebase } = require("./config/firebase");

dotenv.config();
connectDB();
initializeFirebase();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../public")));

// API routes
app.use("/api/auth", authRoutes);

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});
```

**Purpose:**
- Loads environment variables
- Connects to MongoDB
- Initializes Firebase Admin SDK
- Sets up CORS and middleware
- Serves static files from `/public`
- Mounts auth routes at `/api/auth`

---

### 3. `src/config/firebase.js` - Firebase Admin Setup
**Location:** `D:\hehehe\src\config\firebase.js`

```javascript
const admin = require("firebase-admin");
const path = require("path");

let firebaseApp;

const initializeFirebase = () => {
  if (!firebaseApp) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccountPath = path.resolve(
        process.cwd(), 
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      );
      const serviceAccount = require(serviceAccountPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase initialized successfully");
    }
  }
  return firebaseApp;
};

const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      success: true,
      uid: decodedToken.uid,
      phoneNumber: decodedToken.phone_number,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { initializeFirebase, verifyFirebaseToken, admin };
```

**Purpose:**
- Initializes Firebase Admin SDK with service account
- Provides `verifyFirebaseToken()` to validate tokens from frontend

---

### 4. `src/controllers/authController.js` - Authentication Logic
**Location:** `D:\hehehe\src\controllers\authController.js`

**Key Functions:**

#### `sendOTP` - Manual OTP (Development)
```javascript
const sendOTP = async (req, res) => {
  // 1. Validate phone number (Indian format: 10 digits starting with 6-9)
  // 2. Find or create user in MongoDB
  // 3. Generate 6-digit OTP
  // 4. Save OTP to user with expiry (10 minutes)
  // 5. Log OTP to console (for development)
  // 6. Return success response
};
```

#### `verifyFirebaseAuth` - Firebase Phone Auth (Production)
```javascript
const verifyFirebaseAuth = async (req, res) => {
  // 1. Receive Firebase ID token from frontend
  // 2. Verify token with Firebase Admin SDK
  // 3. Extract phone number from token
  // 4. Find or create user in MongoDB
  // 5. Generate JWT token for your app
  // 6. Return JWT token to frontend
};
```

**Purpose:**
- `sendOTP`: Development testing (OTP shown in console)
- `verifyFirebaseAuth`: Production flow (Firebase handles SMS)

---

### 5. `src/routes/auth.routes.js` - API Routes
**Location:** `D:\hehehe\src\routes\auth.routes.js`

```javascript
const express = require("express");
const router = express.Router();
const { sendOTP, verifyOTP, resendOTP, verifyFirebaseAuth } = require("../controllers/authController");

// Development routes (manual OTP)
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

// Production route (Firebase auth)
router.post("/firebase-auth", verifyFirebaseAuth);

module.exports = router;
```

**API Endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/send-otp` | POST | Send OTP (development) |
| `/api/auth/verify-otp` | POST | Verify OTP (development) |
| `/api/auth/resend-otp` | POST | Resend OTP (development) |
| `/api/auth/firebase-auth` | POST | Verify Firebase token (production) |

---

### 6. `src/models/User.js` - User Schema
**Location:** `D:\hehehe\src\models\User.js`

```javascript
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (v) => /^[6-9]\d{9}$/.test(v),
      message: "Please provide a valid Indian phone number",
    },
  },
  firebaseUid: { type: String, default: null },  // Firebase User ID
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  isVerified: { type: Boolean, default: false },
  name: { type: String, default: null },
  // ... other fields
});
```

**Purpose:** Stores user data with phone verification status

---

## 📄 Frontend Files Explained

### `public/index.html` - Login Page
**Location:** `D:\hehehe\public\index.html`

**Structure:**
```
┌─────────────────────────────────────┐
│         🔐 Phone Login              │
│   Secure OTP verification           │
│                                     │
│        [1] ─ [2] ─ [✓]             │  ← Step indicators
│                                     │
│   ┌─────────────────────────────┐   │
│   │  +91  │  9876543210         │   │  ← Phone input
│   └─────────────────────────────┘   │
│                                     │
│   [    reCAPTCHA checkbox    ]      │  ← Google reCAPTCHA
│                                     │
│   [        Send OTP          ]      │  ← Button
└─────────────────────────────────────┘
```

**Key JavaScript Functions:**

```javascript
// 1. Initialize Firebase
firebase.initializeApp(firebaseConfig);

// 2. Setup reCAPTCHA
function initRecaptcha() {
  recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container');
}

// 3. Send OTP via Firebase
async function sendOTP() {
  confirmationResult = await auth.signInWithPhoneNumber(fullPhoneNumber, recaptchaVerifier);
}

// 4. Verify OTP with Firebase, then authenticate with backend
async function verifyOTP() {
  const result = await confirmationResult.confirm(otp);
  const idToken = await result.user.getIdToken();
  
  // Send to your backend
  const response = await fetch('/api/auth/firebase-auth', {
    method: 'POST',
    body: JSON.stringify({ idToken })
  });
}
```

---

## 🔐 Firebase Configuration

### Firebase Web Config (Frontend)
**Location:** `public/index.html` (line ~270)

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAtoRj-zCO4iQWHcQSMKqXlO_5Ar8v_DSk",
  authDomain: "ecosus-6eb45.firebaseapp.com",
  projectId: "ecosus-6eb45",
  storageBucket: "ecosus-6eb45.firebasestorage.app",
  messagingSenderId: "532162786329",
  appId: "1:532162786329:web:3510ab4973df291633a688",
  measurementId: "G-WPZWXQC0ND"
};
```

**Where to get:** Firebase Console > Project Settings > Your Apps > Web App

---

## 🔄 Authentication Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    PHONE OTP AUTHENTICATION FLOW                      │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   FRONTEND  │     │   FIREBASE  │     │   BACKEND   │     │   MONGODB   │
│  (Browser)  │     │   (Google)  │     │  (Node.js)  │     │  (Database) │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │                    │
      │  1. Enter phone    │                    │                    │
      │  2. Complete       │                    │                    │
      │     reCAPTCHA      │                    │                    │
      │                    │                    │                    │
      │  3. signInWithPhoneNumber()             │                    │
      │ ─────────────────► │                    │                    │
      │                    │                    │                    │
      │                    │  4. Send SMS       │                    │
      │                    │     to user's      │                    │
      │                    │     phone          │                    │
      │                    │ ──────────────────►│                    │
      │                    │                    │                    │
      │  5. User receives OTP on phone          │                    │
      │                    │                    │                    │
      │  6. Enter OTP      │                    │                    │
      │  7. confirm(otp)   │                    │                    │
      │ ─────────────────► │                    │                    │
      │                    │                    │                    │
      │  ◄──────────────── │                    │                    │
      │  8. Firebase User  │                    │                    │
      │     + ID Token     │                    │                    │
      │                    │                    │                    │
      │  9. POST /api/auth/firebase-auth        │                    │
      │     { idToken }    │                    │                    │
      │ ────────────────────────────────────────►                    │
      │                    │                    │                    │
      │                    │  10. Verify token  │                    │
      │                    │ ◄───────────────── │                    │
      │                    │                    │                    │
      │                    │  11. Token valid!  │                    │
      │                    │ ─────────────────► │                    │
      │                    │                    │                    │
      │                    │                    │  12. Find/Create   │
      │                    │                    │      User          │
      │                    │                    │ ──────────────────►│
      │                    │                    │                    │
      │                    │                    │  13. User data     │
      │                    │                    │ ◄───────────────── │
      │                    │                    │                    │
      │  14. JWT Token + User data              │                    │
      │ ◄─────────────────────────────────────── │                    │
      │                    │                    │                    │
      │  15. Store JWT in localStorage          │                    │
      │  16. Show success! │                    │                    │
      │                    │                    │                    │
```

---

## 🛠️ Setup Steps Completed

### Step 1: Fixed Initial Errors
- Added missing `require` statements in `src/app.js`
- Installed missing `axios` package

### Step 2: SMS Provider Attempts
- **Fast2SMS:** Tried but requires DLT verification (Indian regulation)
- **MSG91:** Also requires verification
- **Solution:** Use Firebase Phone Auth (free 10K verifications/month)

### Step 3: Firebase Setup
```bash
# 1. Install Firebase Admin SDK
npm install firebase-admin

# 2. Get service account key from Firebase Console
# Firebase Console > Project Settings > Service Accounts > Generate New Private Key

# 3. Copy service account file to project
Copy-Item "downloaded-file.json" "firebase-service-account.json"

# 4. Update .env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### Step 4: Firebase CLI & Hosting
```bash
# 1. Install Firebase CLI
npm install -g firebase-tools

# 2. Login to Firebase
firebase login

# 3. Initialize Firebase Hosting
firebase init hosting
# - Selected project: ecosus-6eb45
# - Public directory: public
# - Single-page app: Yes
# - GitHub integration: Yes (CodeRAHULx/Eco_system)

# 4. Deploy (future)
firebase deploy
```

---

## ▶️ How to Run

### Start Development Server
```bash
cd D:\hehehe
npm start
```

### Access Application
- **Frontend:** http://localhost:5000
- **API:** http://localhost:5000/api/auth

---

## 📝 API Documentation

### POST `/api/auth/firebase-auth`
**Purpose:** Verify Firebase phone auth and create session

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success):**
```json
{
  "message": "Phone number verified successfully via Firebase",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "phoneNumber": "9876543210",
    "isVerified": true
  }
}
```

---

## ⚠️ Important Notes

### Firebase Phone Auth Requirements
1. **Enable Phone Auth:** Firebase Console > Authentication > Sign-in method > Phone
2. **Add Test Numbers (Optional):** For development without real SMS
3. **Domain Whitelist:** Add your domain to authorized domains

### Security Reminders
- Never commit `.env` or `firebase-service-account.json` to Git
- Use HTTPS in production
- Rotate JWT secrets periodically

---

## 🚀 Next Steps

### To Do:
1. [ ] Enable Phone Authentication in Firebase Console
2. [ ] Test OTP flow in browser
3. [ ] Deploy to Firebase Hosting: `firebase deploy`
4. [ ] Add user profile update functionality
5. [ ] Implement protected routes using JWT

### Firebase Console Checklist:
1. Go to https://console.firebase.google.com/project/ecosus-6eb45
2. Click **Authentication** > **Sign-in method**
3. Enable **Phone** provider
4. Save

---

## 📞 Support

**GitHub Repository:** https://github.com/CodeRAHULx/Eco_system

---

*Documentation generated on January 29, 2026*
