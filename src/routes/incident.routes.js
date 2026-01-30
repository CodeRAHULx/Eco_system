const express = require("express");
const router = express.Router();
const { protect, optionalAuth } = require("../middleware/auth");
const {
  reportIncident,
  getNearbyIncidents,
  getAllIncidents,
  getIncidentById,
  confirmIncident,
  addComment,
  resolveIncident,
  sendEmergencySOS,
  getAnalytics,
} = require("../controllers/incident.controller");

// Public routes (browse incidents without login - like Swiggy shows restaurants)
router.get("/", getAllIncidents); // Root path for all incidents
router.get("/nearby", getNearbyIncidents);
router.get("/all", getAllIncidents);
router.get("/analytics", getAnalytics);
router.get("/:id", getIncidentById);

// Optional auth routes (can report anonymously but get points if logged in)
router.post("/report", optionalAuth, reportIncident);

// Protected routes (require login)
router.post("/:id/confirm", protect, confirmIncident);
router.post("/:id/comment", protect, addComment);
router.patch("/:id/resolve", protect, resolveIncident);
router.post("/sos", protect, sendEmergencySOS);
router.post("/emergency-sos", protect, sendEmergencySOS); // Alias for frontend compatibility

module.exports = router;
