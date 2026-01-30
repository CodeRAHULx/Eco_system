const Facility = require("../models/Facility");

/**
 * Get nearby facilities (public)
 */
const getNearbyFacilities = async (req, res) => {
  try {
    const { lat, lng, radius = 5, category } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Location (lat, lng) is required",
      });
    }

    const facilities = await Facility.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius),
      category,
    );

    res.status(200).json({
      success: true,
      count: facilities.length,
      facilities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all facilities with filters (public)
 */
const getAllFacilities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      city,
      isActive = true,
    } = req.query;

    let query = { isActive: isActive === "true" || isActive === true };

    if (type) query.type = type;
    if (category) query.accepts = category;
    if (city) query["location.city"] = new RegExp(city, "i");

    const facilities = await Facility.find(query)
      .sort({ "ratings.average": -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select("-reviews");

    const total = await Facility.countDocuments(query);

    res.status(200).json({
      success: true,
      facilities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get facility by ID
 */
const getFacilityById = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    res.status(200).json({
      success: true,
      facility,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Add review to facility (requires login)
 */
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating (1-5) is required",
      });
    }

    const facility = await Facility.findById(req.params.id);

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    const User = require("../models/User");
    const user = await User.findById(req.userId).select("profile.name");

    await facility.addReview(
      req.userId,
      user?.profile?.name || "User",
      rating,
      comment,
    );

    res.status(200).json({
      success: true,
      message: "Review added",
      ratings: facility.ratings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create new facility (admin only)
 */
const createFacility = async (req, res) => {
  try {
    const facility = await Facility.create(req.body);

    res.status(201).json({
      success: true,
      message: "Facility created",
      facility,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update facility (admin only)
 */
const updateFacility = async (req, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Facility updated",
      facility,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Seed sample facilities (for development)
 */
const seedFacilities = async (req, res) => {
  try {
    // Sample facilities for India
    const sampleFacilities = [
      {
        name: "Green Recycling Center",
        type: "full_service",
        location: {
          lat: 28.6139,
          lng: 77.209,
          address: "Connaught Place, New Delhi",
          city: "New Delhi",
        },
        accepts: ["plastic", "paper", "metal", "glass", "organic"],
        hoursDisplay: "9 AM - 6 PM",
        contact: { phone: "+91-11-12345678" },
        services: {
          pickup: true,
          dropOff: true,
          weighing: true,
          cashPayment: true,
        },
      },
      {
        name: "EcoHub E-Waste Center",
        type: "e_waste",
        location: {
          lat: 28.5355,
          lng: 77.391,
          address: "Sector 18, Noida",
          city: "Noida",
        },
        accepts: ["electronics", "batteries"],
        hoursDisplay: "10 AM - 7 PM",
        contact: { phone: "+91-120-4567890" },
        services: { pickup: true, dropOff: true, weighing: true },
      },
      {
        name: "Paper Recyclers Hub",
        type: "paper_only",
        location: {
          lat: 28.4595,
          lng: 77.0266,
          address: "Sector 29, Gurugram",
          city: "Gurugram",
        },
        accepts: ["paper"],
        hoursDisplay: "8 AM - 8 PM",
        contact: { phone: "+91-124-2345678" },
        services: {
          pickup: false,
          dropOff: true,
          weighing: true,
          cashPayment: true,
        },
      },
      {
        name: "Mumbai Green Solutions",
        type: "full_service",
        location: {
          lat: 19.076,
          lng: 72.8777,
          address: "Bandra West, Mumbai",
          city: "Mumbai",
        },
        accepts: ["plastic", "paper", "metal", "glass"],
        hoursDisplay: "9 AM - 9 PM",
        contact: { phone: "+91-22-87654321" },
        services: {
          pickup: true,
          dropOff: true,
          weighing: true,
          cashPayment: true,
          digitalPayment: true,
        },
      },
      {
        name: "Bangalore Recycle Point",
        type: "recycling_center",
        location: {
          lat: 12.9716,
          lng: 77.5946,
          address: "Indiranagar, Bangalore",
          city: "Bangalore",
        },
        accepts: ["plastic", "paper", "metal", "glass", "electronics"],
        hoursDisplay: "8 AM - 10 PM",
        contact: { phone: "+91-80-45678901" },
        services: {
          pickup: true,
          dropOff: true,
          weighing: true,
          digitalPayment: true,
        },
      },
    ];

    // Clear existing and insert sample
    await Facility.deleteMany({});
    const facilities = await Facility.insertMany(sampleFacilities);

    res.status(200).json({
      success: true,
      message: `${facilities.length} facilities seeded`,
      facilities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getNearbyFacilities,
  getAllFacilities,
  getFacilityById,
  addReview,
  createFacility,
  updateFacility,
  seedFacilities,
};
