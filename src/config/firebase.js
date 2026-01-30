const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin SDK
// You need to download the service account key from Firebase Console
// Go to: Firebase Console > Project Settings > Service Accounts > Generate New Private Key

let firebaseApp;

const initializeFirebase = () => {
  if (!firebaseApp) {
    // Option 1: Using environment variables (recommended for production)
    if (process.env.FIREBASE_PROJECT_ID) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }
    // Option 2: Using service account JSON file (for development)
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Resolve path relative to project root
      const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      const serviceAccount = require(serviceAccountPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.warn("⚠️  Firebase not configured. Phone auth will use development mode.");
      return null;
    }
    console.log("✅ Firebase initialized successfully");
  }
  return firebaseApp;
};

// Verify Firebase ID token (after client-side phone auth)
const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      success: true,
      uid: decodedToken.uid,
      phoneNumber: decodedToken.phone_number,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get user by phone number
const getUserByPhone = async (phoneNumber) => {
  try {
    const user = await admin.auth().getUserByPhoneNumber(phoneNumber);
    return user;
  } catch (error) {
    return null;
  }
};

module.exports = {
  initializeFirebase,
  verifyFirebaseToken,
  getUserByPhone,
  admin,
};
