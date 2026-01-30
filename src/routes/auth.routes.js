const express = require("express");
const router = express.Router();
const {
  sendOTP,
  verifyOTP,
  resendOTP,
  verifyFirebaseAuth,
} = require("../controllers/authController");

// Wrapper for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Manual OTP routes (development/fallback)
router.post("/send-otp", asyncHandler(sendOTP));
router.post("/verify-otp", asyncHandler(verifyOTP));
router.post("/resend-otp", asyncHandler(resendOTP));

// Firebase Phone Auth route (recommended for production)
router.post("/firebase-auth", asyncHandler(verifyFirebaseAuth));

module.exports = router;
