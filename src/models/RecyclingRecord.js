const mongoose = require("mongoose");

/**
 * RecyclingRecord Schema
 * Stores all recycling activities logged by users
 */
const recyclingRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Item details
    itemName: {
      type: String,
      required: [true, "Item name is required"],
    },
    category: {
      type: String,
      enum: [
        "plastic",
        "paper",
        "metal",
        "glass",
        "electronics",
        "organic",
        "textile",
        "hazardous",
      ],
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0.01,
    },
    condition: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
    description: {
      type: String,
      default: null,
    },

    // Points & Impact
    points: {
      type: Number,
      default: 0,
    },
    ecoCredits: {
      type: Number,
      default: 0,
    },
    environmentalImpact: {
      co2Saved: { type: Number, default: 0 }, // in kg
      waterSaved: { type: Number, default: 0 }, // in liters
      treesEquivalent: { type: Number, default: 0 },
    },

    // Location (where recycled)
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String },
      facilityId: { type: mongoose.Schema.Types.ObjectId, ref: "Facility" },
    },

    // AI Analysis (if scanned)
    aiScan: {
      scanId: { type: mongoose.Schema.Types.ObjectId, ref: "ScanHistory" },
      wasAiDetected: { type: Boolean, default: false },
      confidence: { type: Number },
    },

    // Status
    status: {
      type: String,
      enum: ["logged", "pending_pickup", "collected", "processed", "verified"],
      default: "logged",
    },

    // Linked order (if part of a pickup order)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Calculate points based on category and weight
recyclingRecordSchema.pre("save", async function () {
  const pointsPerKg = {
    plastic: 10,
    paper: 8,
    metal: 25,
    glass: 12,
    electronics: 50,
    organic: 5,
    textile: 15,
    hazardous: 30,
  };

  const co2PerKg = {
    plastic: 2.5,
    paper: 1.8,
    metal: 8.0,
    glass: 0.5,
    electronics: 15.0,
    organic: 0.3,
    textile: 3.0,
    hazardous: 5.0,
  };

  const waterPerKg = {
    plastic: 5,
    paper: 10,
    metal: 2,
    glass: 0.5,
    electronics: 50,
    organic: 1,
    textile: 20,
    hazardous: 10,
  };

  // Calculate points
  this.points = Math.round(pointsPerKg[this.category] * this.weight);
  this.ecoCredits = Math.round(this.points * 0.5);

  // Calculate environmental impact
  this.environmentalImpact.co2Saved = parseFloat(
    (co2PerKg[this.category] * this.weight).toFixed(2),
  );
  this.environmentalImpact.waterSaved = parseFloat(
    (waterPerKg[this.category] * this.weight).toFixed(2),
  );
  this.environmentalImpact.treesEquivalent = parseFloat(
    (this.environmentalImpact.co2Saved / 21).toFixed(3),
  ); // 1 tree absorbs ~21kg CO2/year
});

// Indexes for efficient queries
recyclingRecordSchema.index({ user: 1, createdAt: -1 });
recyclingRecordSchema.index({ category: 1 });
recyclingRecordSchema.index({ status: 1 });

module.exports = mongoose.model("RecyclingRecord", recyclingRecordSchema);
