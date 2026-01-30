const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getPlans,
  createSubscriptionOrder,
  verifyPayment,
  verifyStripePayment,
  stripeWebhook,
  handleWebhook,
  getPaymentHistory,
  getSubscriptionStatus,
  cancelSubscription,
  requestRefund,
} = require("../controllers/payment.controller");

// Public routes
router.get("/plans", getPlans);

// Webhooks (no auth - Payment providers call these)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook,
);
router.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

// Protected routes
router.post("/create-order", protect, createSubscriptionOrder);
router.post("/verify", protect, verifyPayment); // Razorpay verification
router.post("/verify-stripe", protect, verifyStripePayment); // Stripe verification
router.get("/history", protect, getPaymentHistory);
router.get("/subscription", protect, getSubscriptionStatus);
router.post("/cancel-subscription", protect, cancelSubscription);
router.post("/refund", protect, requestRefund);

module.exports = router;
