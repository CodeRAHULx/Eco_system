const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // Authentication
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required"],
    unique: true,
    validate: {
      validator: function (v) {
        return /^[6-9]\d{9}$/.test(v.replace(/\D/g, ""));
      },
      message: "Please provide a valid Indian phone number",
    },
  },
  firebaseUid: { type: String, default: null },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  isVerified: { type: Boolean, default: false },

  // Role - accepts both lowercase and uppercase, normalizes to uppercase
  role: {
    type: String,
    enum: [
      "USER",
      "WORKER",
      "DRIVER",
      "SOCIETY_ADMIN",
      "AREA_ADMIN",
      "SUPER_ADMIN",
      "user",
      "worker",
      "driver",
      "society_admin",
      "area_admin",
      "super_admin",
    ],
    default: "USER",
    set: function (v) {
      return v ? v.toUpperCase() : "USER";
    },
  },

  // Worker/Driver specific fields
  workerInfo: {
    employeeId: { type: String, default: null },
    vehicleNumber: { type: String, default: null },
    vehicleType: {
      type: String,
      enum: ["bike", "auto", "van", "truck", null],
      default: null,
    },
    licenseNumber: { type: String, default: null },
    aadharNumber: { type: String, default: null },
    isOnDuty: { type: Boolean, default: false },
    assignedArea: { type: String, default: null },
    assignedOrders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    completedOrders: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    totalRatings: { type: Number, default: 0 },
    joiningDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
  },

  // Live location for workers/drivers
  liveLocation: {
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    heading: { type: Number, default: null }, // Direction 0-360
    speed: { type: Number, default: null }, // km/h
    accuracy: { type: Number, default: null },
    lastUpdated: { type: Date, default: null },
    isSharing: { type: Boolean, default: false },
  },

  // Profile
  profile: {
    name: { type: String, default: null },
    email: { type: String, default: null },
    avatar: { type: String, default: null },
    city: { type: String, default: null },
    area: { type: String, default: null },
    society: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Society",
      default: null,
    },
    language: { type: String, default: "en" },
    address: {
      street: { type: String, default: null },
      landmark: { type: String, default: null },
      pincode: { type: String, default: null },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
  },

  // Subscription
  subscription: {
    plan: {
      type: String,
      enum: ["FREE", "BASIC", "PREMIUM", "ENTERPRISE"],
      default: "FREE",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "expired", "cancelled"],
      default: "inactive",
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    orderLimit: { type: Number, default: 0 },
    ordersUsed: { type: Number, default: 0 },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    isActive: { type: Boolean, default: false },
  },

  // User Stats
  stats: {
    points: { type: Number, default: 0 },
    ecoCredits: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    totalScans: { type: Number, default: 0 },
    co2Saved: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    recycledKg: { type: Number, default: 0 },
  },

  // Devices for push notifications
  devices: [
    {
      deviceId: { type: String },
      fcmToken: { type: String },
      platform: { type: String, enum: ["web", "android", "ios"] },
      lastActive: { type: Date, default: Date.now },
    },
  ],

  // Location metadata
  locationMeta: {
    accuracy: { type: Number, default: null },
    altitude: { type: Number, default: null },
    heading: { type: Number, default: null },
    speed: { type: Number, default: null },
    source: { type: String, enum: ["gps", "manual", "ip"], default: "gps" },
    lastUpdated: { type: Date, default: null },
  },

  // Saved addresses (multiple addresses for order)
  savedAddresses: [
    {
      label: { type: String, default: "Home" }, // Home, Work, Other
      street: { type: String },
      landmark: { type: String },
      area: { type: String },
      city: { type: String },
      pincode: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
      isDefault: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  // Legacy fields (for backward compatibility)
  name: { type: String, default: null },
  city: { type: String },
  area: { type: String },
  language: { type: String },
  points: { type: Number, default: 0 },
  ecoCredits: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  total_scans: { type: Number, default: 0 },
  co2_saved: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  try {
    const salt = await bcryptjs.genSalt(
      parseInt(process.env.BCRYPT_ROUNDS) || 10,
    );
    this.password = await bcryptjs.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
