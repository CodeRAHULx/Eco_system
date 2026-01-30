const mongoose = require("mongoose");

/**
 * Facility Schema
 * Stores recycling facilities/centers information
 */
const facilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Facility name is required"],
    },
    type: {
      type: String,
      enum: [
        "recycling_center",
        "e_waste",
        "plastic_only",
        "paper_only",
        "full_service",
        "hazardous_waste",
        "organic_composting",
      ],
      default: "recycling_center",
    },

    // Location
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String },
      city: { type: String },
      area: { type: String },
      pincode: { type: String },
    },

    // Accepted materials
    accepts: [
      {
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
          "batteries",
          "tires",
          "appliances",
        ],
      },
    ],

    // Contact info
    contact: {
      phone: { type: String },
      email: { type: String },
      website: { type: String },
    },

    // Operating hours
    hours: {
      monday: {
        open: String,
        close: String,
        isClosed: { type: Boolean, default: false },
      },
      tuesday: {
        open: String,
        close: String,
        isClosed: { type: Boolean, default: false },
      },
      wednesday: {
        open: String,
        close: String,
        isClosed: { type: Boolean, default: false },
      },
      thursday: {
        open: String,
        close: String,
        isClosed: { type: Boolean, default: false },
      },
      friday: {
        open: String,
        close: String,
        isClosed: { type: Boolean, default: false },
      },
      saturday: {
        open: String,
        close: String,
        isClosed: { type: Boolean, default: false },
      },
      sunday: {
        open: String,
        close: String,
        isClosed: { type: Boolean, default: true },
      },
    },

    // Simple hours string
    hoursDisplay: {
      type: String,
      default: "9 AM - 6 PM",
    },

    // Pricing (rates per kg)
    pricing: {
      plastic: { type: Number, default: 5 },
      paper: { type: Number, default: 8 },
      metal: { type: Number, default: 25 },
      glass: { type: Number, default: 3 },
      electronics: { type: Number, default: 50 },
      organic: { type: Number, default: 2 },
    },

    // Services offered
    services: {
      pickup: { type: Boolean, default: false },
      dropOff: { type: Boolean, default: true },
      weighing: { type: Boolean, default: true },
      cashPayment: { type: Boolean, default: true },
      digitalPayment: { type: Boolean, default: false },
    },

    // Ratings
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },

    // Reviews
    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String,
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Media
    images: [String],

    // Status
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    // Capacity
    dailyCapacity: {
      type: Number, // in kg
      default: 1000,
    },
    currentLoad: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Create 2dsphere index for geospatial queries
facilitySchema.index({ "location.lat": 1, "location.lng": 1 });
facilitySchema.index({ accepts: 1 });
facilitySchema.index({ type: 1 });
facilitySchema.index({ isActive: 1 });

// Static method to find nearby facilities
facilitySchema.statics.findNearby = async function (
  lat,
  lng,
  radiusKm = 5,
  category = null,
) {
  let query = {
    isActive: true,
    "location.lat": {
      $gte: lat - radiusKm / 111,
      $lte: lat + radiusKm / 111,
    },
    "location.lng": {
      $gte: lng - radiusKm / (111 * Math.cos((lat * Math.PI) / 180)),
      $lte: lng + radiusKm / (111 * Math.cos((lat * Math.PI) / 180)),
    },
  };

  if (category) {
    query.accepts = category;
  }

  const facilities = await this.find(query);

  // Calculate distance for each facility
  return facilities
    .map((f) => {
      const distance = calculateDistance(
        lat,
        lng,
        f.location.lat,
        f.location.lng,
      );
      return {
        ...f.toObject(),
        distance_km: parseFloat(distance.toFixed(2)),
      };
    })
    .filter((f) => f.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
};

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Instance method to add review
facilitySchema.methods.addReview = async function (
  userId,
  userName,
  rating,
  comment,
) {
  this.reviews.push({ user: userId, userName, rating, comment });

  // Update average rating
  const totalRating = this.reviews.reduce((sum, r) => sum + r.rating, 0);
  this.ratings.average = parseFloat(
    (totalRating / this.reviews.length).toFixed(1),
  );
  this.ratings.count = this.reviews.length;

  await this.save();
  return this;
};

module.exports = mongoose.model("Facility", facilitySchema);
