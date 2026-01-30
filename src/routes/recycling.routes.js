const express = require("express");
const router = express.Router();
const { protect, optionalAuth } = require("../middleware/auth");
const {
  logItem,
  getHistory,
  getStats,
  getLeaderboard,
  getEnvironmentalImpact,
  deleteRecord,
} = require("../controllers/recycling.controller");

// Public routes (like Swiggy - browse without login)
router.get("/leaderboard", getLeaderboard);
router.get("/impact", getEnvironmentalImpact);

// Protected routes (require login)
router.post("/log", protect, logItem);
router.get("/history", protect, getHistory);
router.get("/stats", protect, getStats);
router.delete("/:id", protect, deleteRecord);

module.exports = router;
