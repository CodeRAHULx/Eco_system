const mongoose = require("mongoose");

/**
 * Incident Schema
 * Stores road safety incidents reported by users
 */
const incidentSchema = new mongoose.Schema(
  {
    // Reporter info
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Allow anonymous reports
    },
    reporterName: {
      type: String,
      default: "Anonymous",
    },

    // Incident details
    type: {
      type: String,
      enum: [
        "traffic_jam",
        "construction",
        "accident",
        "fallen_tree",
        "power_outage",
        "flooded_road",
        "pothole",
        "debris",
        "animal_on_road",
        "fire",
        "violence",
        "other",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },

    // Location
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String },
      city: { type: String },
      area: { type: String },
    },

    // Additional details
    hasInjuries: { type: Boolean, default: false },
    injuredCount: { type: Number, default: 0 },
    visibility: {
      type: String,
      enum: ["poor", "fair", "good", "excellent"],
      default: "good",
    },
    weather: {
      type: String,
      enum: ["clear", "rainy", "foggy", "snowy", "windy"],
      default: "clear",
    },

    // Media
    media: {
      photos: [{ type: String }],
      video: { type: String },
      audio: { type: String },
    },

    // AI Analysis
    aiAnalysis: {
      riskLevel: { type: String },
      riskScore: { type: Number, min: 0, max: 100 },
      suggestions: [String],
      predictedDuration: { type: String },
      estimatedPeople: { type: Number },
    },

    // Status & Resolution
    status: {
      type: String,
      enum: ["active", "resolved", "expired", "fake"],
      default: "active",
    },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolutionNotes: { type: String },

    // Authority notification
    authoritiesNotified: {
      police: { notified: { type: Boolean, default: false }, at: Date },
      fire: { notified: { type: Boolean, default: false }, at: Date },
      medical: { notified: { type: Boolean, default: false }, at: Date },
      municipal: { notified: { type: Boolean, default: false }, at: Date },
    },

    // Community engagement
    confirmations: { type: Number, default: 0 },
    confirmedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: { type: String },
        text: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Alerts sent
    alertsSent: { type: Number, default: 0 },
    alertedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Emergency mode
    isEmergency: { type: Boolean, default: false },
    emergencySosId: { type: String },
  },
  {
    timestamps: true,
  },
);

// Pre-save: auto-detect severity based on type
incidentSchema.pre("save", async function () {
  if (this.isNew && !this.severity) {
    const severityMap = {
      traffic_jam: "medium",
      construction: "medium",
      accident: "high",
      fallen_tree: "high",
      power_outage: "high",
      flooded_road: "critical",
      pothole: "low",
      debris: "low",
      animal_on_road: "medium",
      fire: "critical",
      violence: "critical",
      other: "medium",
    };
    this.severity = severityMap[this.type] || "medium";
  }

  // Mark as emergency for critical incidents with injuries
  if (this.severity === "critical" || this.hasInjuries) {
    this.isEmergency = true;
  }
});

// Indexes
incidentSchema.index({ location: "2dsphere" });
incidentSchema.index({ type: 1 });
incidentSchema.index({ severity: 1 });
incidentSchema.index({ status: 1 });
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ reporter: 1 });

// Static method to find nearby incidents
incidentSchema.statics.findNearby = async function (
  lat,
  lng,
  radiusKm = 10,
  status = "active",
) {
  // Convert km to radians (Earth's radius = 6371 km)
  const radiusInRadians = radiusKm / 6371;

  return this.find({
    status: status,
    "location.lat": {
      $gte: lat - radiusKm / 111, // approx 111km per degree
      $lte: lat + radiusKm / 111,
    },
    "location.lng": {
      $gte: lng - radiusKm / (111 * Math.cos((lat * Math.PI) / 180)),
      $lte: lng + radiusKm / (111 * Math.cos((lat * Math.PI) / 180)),
    },
  }).sort({ severity: -1, createdAt: -1 });
};

// Static method to get incident analytics
incidentSchema.statics.getAnalytics = async function (days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
        criticalCount: {
          $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Instance method to confirm incident
incidentSchema.methods.confirm = async function (userId) {
  if (!this.confirmedBy.includes(userId)) {
    this.confirmedBy.push(userId);
    this.confirmations = this.confirmedBy.length;
    await this.save();
  }
  return this;
};

module.exports = mongoose.model("Incident", incidentSchema);
