const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  getStats,
  updateLocation,
  registerDevice,
  deleteAccount,
  // Role-based registration
  registerWorker,
  registerDriver,
  // Live location
  updateLiveLocation,
  toggleDutyStatus,
  getActiveWorkers,
  getNearbyWorkers,
  getWorkerLocation,
  // Admin management
  getAllUsers,
  getAllWorkers,
  getAllDrivers,
  updateWorkerStatus,
  getAdminDashboardStats,
  rateWorker,
  // Activity
  getRecentActivity,
} = require("../controllers/user.controller");

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

// Get nearby workers/drivers (for users to see on map)
router.get("/nearby", getNearbyWorkers);

// Get specific worker location (for order tracking)
router.get("/worker/:workerId/location", getWorkerLocation);

// Get active workers (for display on map)
router.get("/active-workers", getActiveWorkers);

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================

// Profile routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// Stats route
router.get("/stats", protect, getStats);

// Recent Activity
router.get("/activity", protect, getRecentActivity);

// Location route
router.put("/location", protect, updateLocation);

// Device/FCM registration
router.post("/device", protect, registerDevice);

// Delete account
router.delete("/account", protect, deleteAccount);

// Rate worker/driver
router.post("/worker/:workerId/rate", protect, rateWorker);

// ============================================
// WORKER/DRIVER ROUTES (Auth required)
// ============================================

// Update live location (for workers/drivers)
router.post("/live-location", protect, updateLiveLocation);

// Toggle duty status
router.post("/duty-status", protect, toggleDutyStatus);

// ============================================
// ADMIN ROUTES (Admin only)
// ============================================

// Admin dashboard stats
router.get("/admin/dashboard", protect, adminOnly, getAdminDashboardStats);

// User management
router.get("/admin/users", protect, adminOnly, getAllUsers);
router.get("/admin/workers", protect, adminOnly, getAllWorkers);
router.get("/admin/drivers", protect, adminOnly, getAllDrivers);

// Register workers/drivers (Admin only)
router.post("/admin/register-worker", protect, adminOnly, registerWorker);
router.post("/admin/register-driver", protect, adminOnly, registerDriver);

// Update worker/driver status
router.put(
  "/admin/worker/:userId/status",
  protect,
  adminOnly,
  updateWorkerStatus,
);

module.exports = router;
