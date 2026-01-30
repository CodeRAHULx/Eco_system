const express = require("express");
const router = express.Router();
const { protect, optionalAuth } = require("../middleware/auth");
const {
  analyzeWaste,
  analyzeWasteWithGroq,
  getScanHistory,
  getScanById,
  getScanImage,
  markScanAsOrdered,
  getRecyclingAdvice,
  getScanAnalytics,
  getSafetyTips,
  getIncidentPrediction,
  getSmartRoute,
  optimizeWorkerRoute,
  predictWasteCollection,
  calculateEnvironmentalImpactAPI,
  analyzeAreaDemand,
  // NEW Innovative AI Features
  getSmartSegregationGuide,
  getSmartReminders,
  checkRecyclability,
  getCommunityChallenge,
} = require("../controllers/ai.controller");

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

// Waste scanning and analysis
router.post("/analyze-waste", optionalAuth, analyzeWaste); // AI waste scanner
router.post("/advice", getRecyclingAdvice); // Get recycling tips

// Safety features
router.get("/safety-tips", getSafetyTips); // AI-powered safety tips
router.get("/incident-prediction", getIncidentPrediction); // Incident risk prediction
router.get("/smart-route", getSmartRoute); // AI route recommendations

// Environmental impact (public stats)
router.get("/environmental-impact", optionalAuth, calculateEnvironmentalImpactAPI);

// Recyclability checker (public - core innovation!)
router.post("/check-recyclability", checkRecyclability); // AI recyclability & alternatives

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================

// Scan history and analytics
router.get("/scan-history", protect, getScanHistory);
router.get("/scan/:id", protect, getScanById);
router.get("/scan/:id/image", optionalAuth, getScanImage);
router.post("/mark-ordered", protect, markScanAsOrdered);
router.get("/analytics", protect, getScanAnalytics);

// Smart features for users
router.post("/segregation-guide", protect, getSmartSegregationGuide); // AI segregation assistant
router.get("/smart-reminders", protect, getSmartReminders); // AI pickup reminders
router.get("/challenges", optionalAuth, getCommunityChallenge); // Community challenges

// Worker/Admin features
router.post("/optimize-route", protect, optimizeWorkerRoute); // AI route optimization
router.get("/predict-collection", protect, predictWasteCollection); // Waste prediction
router.get("/area-analysis", protect, analyzeAreaDemand); // Admin area analysis

module.exports = router;
