const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  // Order ID (human-readable) - auto-generated in pre-validate hook
  orderId: {
    type: String,
    unique: true,
  },

  // User who placed the order
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Waste types being collected
  wasteTypes: [
    {
      type: String,
      enum: [
        "plastic",
        "paper",
        "glass",
        "metal",
        "ewaste",
        "organic",
        "mixed",
      ],
      required: true,
    },
  ],

  // Estimated quantity in kg
  estimatedQuantity: {
    type: Number,
    required: true,
    min: 1,
  },

  // Actual quantity (filled after pickup)
  actualQuantity: {
    type: Number,
    default: null,
  },

  // Pricing
  estimatedValue: {
    type: Number,
    default: 0,
  },
  actualValue: {
    type: Number,
    default: null,
  },

  // Eco points earned
  ecoPointsEarned: {
    type: Number,
    default: 0,
  },

  // Schedule
  scheduledDate: {
    type: Date,
    required: true,
  },
  scheduledTime: {
    type: String,
    required: true, // e.g., "09:00-12:00"
  },

  // Pickup location
  location: {
    label: { type: String },
    street: { type: String },
    landmark: { type: String },
    area: { type: String },
    city: { type: String },
    pincode: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },

  // Additional notes
  notes: {
    type: String,
    default: "",
  },

  // AI Scan Data (required for order creation)
  scanData: {
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ScanHistory",
      required: [true, "Waste scan is required. Please scan your waste first."],
    },
    aiAnalysis: {
      category: { type: String },
      recyclable: { type: Boolean },
      estimatedWeight: { type: Number },
      quality: { type: String },
      confidence: { type: Number },
    },
    scannedAt: { type: Date, default: Date.now },
  },

  // Order status
  status: {
    type: String,
    enum: [
      "pending",
      "confirmed",
      "assigned",
      "in_transit",
      "arrived",
      "completed",
      "cancelled",
    ],
    default: "pending",
  },

  // Assigned collector/worker
  assignedWorker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  // Timestamps for tracking
  confirmedAt: { type: Date, default: null },
  assignedAt: { type: Date, default: null },
  startedAt: { type: Date, default: null },
  arrivedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },

  // Cancellation reason
  cancellationReason: {
    type: String,
    default: null,
  },

  // Rating (1-5)
  rating: {
    score: { type: Number, min: 1, max: 5, default: null },
    feedback: { type: String, default: null },
    ratedAt: { type: Date, default: null },
  },

  // Photos (before/after pickup)
  photos: {
    before: [{ type: String }],
    after: [{ type: String }],
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Generate unique order ID before saving
// Generate orderId before validation
orderSchema.pre("validate", async function () {
  if (this.isNew && !this.orderId) {
    const date = new Date();
    const prefix = "ORD";
    const timestamp =
      date.getFullYear().toString().slice(-2) +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      date.getDate().toString().padStart(2, "0");
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderId = `${prefix}-${timestamp}-${random}`;
  }
});

orderSchema.pre("save", async function () {
  this.updatedAt = Date.now();
});

// Calculate estimated value based on waste types and quantity
orderSchema.methods.calculateEstimatedValue = function () {
  const prices = {
    plastic: 5,
    paper: 8,
    glass: 3,
    metal: 25,
    ewaste: 50,
    organic: 2,
    mixed: 5,
  };

  if (this.wasteTypes.length > 0) {
    const avgPrice =
      this.wasteTypes.reduce((sum, type) => sum + (prices[type] || 5), 0) /
      this.wasteTypes.length;
    this.estimatedValue = Math.round(avgPrice * this.estimatedQuantity);
  }

  // Calculate eco points (2 points per kg)
  this.ecoPointsEarned = Math.round(this.estimatedQuantity * 2);

  return this.estimatedValue;
};

module.exports = mongoose.model("Order", orderSchema);
