const express = require("express");
const router = express.Router();
const { protect, optionalAuth, adminOnly } = require("../middleware/auth");
const {
  getNearbyFacilities,
  getAllFacilities,
  getFacilityById,
  addReview,
  createFacility,
  updateFacility,
  seedFacilities,
} = require("../controllers/facility.controller");

// Public routes (browse without login - like Swiggy)
router.get("/nearby", getNearbyFacilities);
router.get("/", getAllFacilities); // Changed from /all to / for cleaner API
router.get("/:id", getFacilityById);

// Protected routes
router.post("/:id/review", protect, addReview);

// Admin routes
router.post("/create", protect, createFacility); // Changed to avoid conflict with /:id
router.put("/:id", protect, updateFacility);
router.post("/seed", seedFacilities); // Dev only - seed sample data

module.exports = router;
