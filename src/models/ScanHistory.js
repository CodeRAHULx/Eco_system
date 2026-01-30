const mongoose = require("mongoose");

/**
 * ScanHistory Schema
 * Stores all AI waste scans (both casual checks and order-linked)
 */
const scanHistorySchema = new mongoose.Schema(
  {
    // User (optional for casual checks without login)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Scan type
    scanType: {
      type: String,
      enum: ["casual", "order", "verification"],
      default: "casual",
      // casual = just checking what items are
      // order = scanning before ordering pickup
      // verification = collector verifying items
    },

    // Image data
    image: {
      url: { type: String }, // Stored image URL (cloud storage)
      base64: { type: String }, // Base64 image data (for direct storage)
      base64Stored: { type: Boolean, default: false },
      mimeType: { type: String, default: "image/jpeg" },
    },

    // AI Analysis Results
    results: {
      items: [
        {
          name: { type: String },
          category: { type: String },
          recyclable: { type: Boolean },
          estimatedWeight: { type: Number },
          confidence: { type: Number },
        },
      ],
      totalItems: { type: Number, default: 0 },
      totalWeight: { type: Number, default: 0 },
      recyclableCount: { type: Number, default: 0 },
      estimatedValue: { type: Number, default: 0 },
      segregation: {
        organic: { type: Number, default: 0 },
        recyclable: { type: Number, default: 0 },
        paper: { type: Number, default: 0 },
        hazardous: { type: Number, default: 0 },
      },
      tips: [String],
    },

    // AI Provider used
    aiProvider: {
      type: String,
      enum: ["gemini", "groq", "mock"],
      default: "gemini",
    },

    // Processing info
    processingTime: {
      type: Number, // in milliseconds
      default: 0,
    },

    // Location where scanned
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
    },

    // Linked order (if scan was used for order)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    // Was this scan converted to an order?
    convertedToOrder: {
      type: Boolean,
      default: false,
    },

    // Device info for analytics
    deviceInfo: {
      userAgent: { type: String },
      platform: { type: String },
      source: {
        type: String,
        enum: ["camera", "gallery", "upload"],
        default: "camera",
      },
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
scanHistorySchema.index({ user: 1, createdAt: -1 });
scanHistorySchema.index({ scanType: 1 });
scanHistorySchema.index({ "results.items.category": 1 });
scanHistorySchema.index({ convertedToOrder: 1 });

// Virtual for getting age of scan
scanHistorySchema.virtual("age").get(function () {
  return Date.now() - this.createdAt;
});

// Static method to get user's scan count today
scanHistorySchema.statics.getUserScansToday = async function (userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return this.countDocuments({
    user: userId,
    createdAt: { $gte: startOfDay },
  });
};

// Static method to get analytics data
scanHistorySchema.statics.getAnalytics = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        totalScans: { $sum: 1 },
        uniqueUsers: { $addToSet: "$user" },
        totalItemsDetected: { $sum: "$results.totalItems" },
        totalWeightEstimated: { $sum: "$results.totalWeight" },
        ordersGenerated: { $sum: { $cond: ["$convertedToOrder", 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

module.exports = mongoose.model("ScanHistory", scanHistorySchema);
