const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  rateOrder,
  getOrderStats,
  // Admin/Worker functions
  getAllOrders,
  assignOrder,
  updateOrderStatus,
  getMyAssignedOrders,
  trackOrder,
  getPendingOrdersInArea,
  selfAssignOrder,
} = require("../controllers/order.controller");

// ============================================
// USER ROUTES (Auth required)
// ============================================

router.post("/", protect, createOrder); // Create new order (subscription required)
router.get("/my-orders", protect, getMyOrders); // Get user's orders
router.get("/stats", protect, getOrderStats); // Get order statistics
router.get("/track/:orderId", protect, trackOrder); // Track order with live location
router.get("/:orderId", protect, getOrderById); // Get single order details
router.put("/:orderId/cancel", protect, cancelOrder); // Cancel order
router.post("/:orderId/rate", protect, rateOrder); // Rate completed order

// ============================================
// WORKER/DRIVER ROUTES (Auth required)
// ============================================

router.get("/worker/assigned", protect, getMyAssignedOrders); // Get my assigned orders
router.get("/worker/pending", protect, getPendingOrdersInArea); // Get pending orders in area
router.post("/worker/assign/:orderId", protect, selfAssignOrder); // Self-assign an order
router.put("/worker/status/:orderId", protect, updateOrderStatus); // Update order status

// ============================================
// ADMIN ROUTES (Admin only)
// ============================================

router.get("/admin/all", protect, adminOnly, getAllOrders); // Get all orders
router.post("/admin/assign/:orderId", protect, adminOnly, assignOrder); // Assign order to worker

module.exports = router;
