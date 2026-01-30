const axios = require("axios");
const User = require("../models/User");
const {
  generateOTP,
  validateIndianPhone,
  verifyOTP: verifyOTPUtil,
} = require("../utils/phoneOTP");
const jwt = require("jsonwebtoken");
const { verifyFirebaseToken } = require("../config/firebase");

// Send OTP to phone number (India only)
const sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Validate Indian phone number ONLY
    if (!validateIndianPhone(phoneNumber)) {
      return res.status(400).json({
        message:
          "Invalid phone number. Only Indian phone numbers (10 digits) are supported currently.",
      });
    }

    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({ phoneNumber });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    // Send OTP via SMS (optional - skip if no API key configured)
    let smsSent = false;
    if (process.env.FAST2SMS_API_KEY) {
      try {
        const response = await axios.post(
          "https://www.fast2sms.com/dev/bulkV2",
          {
            route: "otp",
            variables_values: otp,
            flash: 0,
            numbers: phoneNumber,
          },
          {
            headers: {
              authorization: process.env.FAST2SMS_API_KEY,
              "Content-Type": "application/json",
            },
          },
        );
        console.log(`Fast2SMS Response:`, response.data);
        smsSent = true;
      } catch (smsError) {
        console.error(`Fast2SMS Error:`, smsError.response?.data || smsError.message);
      }
    }
    
    // Always log OTP to console for development/testing
    console.log(`\n========================================`);
    console.log(`📱 OTP for ${phoneNumber}: ${otp}`);
    console.log(`========================================\n`);

    res.status(200).json({
      message: smsSent ? "OTP sent successfully" : "OTP generated (check console - SMS not configured)",
      phoneNumber,
      // Always return OTP in development, or when SMS is not configured
      otp: (process.env.NODE_ENV !== "production" || !smsSent) ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res
        .status(400)
        .json({ message: "Phone number and OTP are required" });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });

    res.status(200).json({
      message: "Phone number verified successfully",
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // TODO: Send OTP via SMS provider (Twilio, AWS SNS, etc.)
    await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "otp",
        variables_values: otp,
        numbers: phoneNumber,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    console.log(`OTP for ${phoneNumber}: ${otp}`);

    res.status(200).json({
      message: "OTP resent successfully",
      phoneNumber,
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Firebase Phone Authentication - Verify Firebase ID Token
// Use this when client-side Firebase handles OTP sending/verification
const verifyFirebaseAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Firebase ID token is required" });
    }

    // Verify the Firebase ID token
    const result = await verifyFirebaseToken(idToken);
    
    if (!result.success) {
      return res.status(401).json({ message: "Invalid Firebase token", error: result.error });
    }

    const phoneNumber = result.phoneNumber?.replace("+91", ""); // Remove country code

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number not found in token" });
    }

    // Find or create user
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({
        phoneNumber,
        isVerified: true,
        firebaseUid: result.uid,
      });
    } else {
      user.isVerified = true;
      user.firebaseUid = result.uid;
    }
    await user.save();

    // Generate JWT token for your app
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    });

    res.status(200).json({
      message: "Phone number verified successfully via Firebase",
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendOTP, verifyOTP, resendOTP, verifyFirebaseAuth };
