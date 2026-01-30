const RecyclingRecord = require("../models/RecyclingRecord");
const User = require("../models/User");

/**
 * Log a recycling item
 * Requires authentication
 */
const logItem = async (req, res) => {
  try {
    const {
      itemName,
      category,
      weight,
      condition,
      description,
      location,
      scanId,
    } = req.body;

    if (!itemName || !category || !weight) {
      return res.status(400).json({
        success: false,
        message: "Item name, category, and weight are required",
      });
    }

    // Create recycling record
    const record = await RecyclingRecord.create({
      user: req.userId,
      itemName,
      category: category.toLowerCase(),
      weight,
      condition: condition || "good",
      description,
      location,
      aiScan: scanId ? { scanId, wasAiDetected: true } : {},
    });

    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: {
        "stats.points": record.points,
        "stats.ecoCredits": record.ecoCredits,
        "stats.recycledKg": weight,
        "stats.co2Saved": record.environmentalImpact.co2Saved,
      },
    });

    res.status(201).json({
      success: true,
      message: "Item logged successfully",
      record,
      pointsEarned: record.points,
      environmentalImpact: record.environmentalImpact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user's recycling history
 */
const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, startDate, endDate } = req.query;

    let query = { user: req.userId };

    if (category) {
      query.category = category.toLowerCase();
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const records = await RecyclingRecord.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await RecyclingRecord.countDocuments(query);

    res.status(200).json({
      success: true,
      records,
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
 * Get user's recycling statistics
 */
const getStats = async (req, res) => {
  try {
    const userId = req.userId;

    // Get aggregated stats
    const stats = await RecyclingRecord.aggregate([
      { $match: { user: require("mongoose").Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalWeight: { $sum: "$weight" },
          totalPoints: { $sum: "$points" },
          totalCo2Saved: { $sum: "$environmentalImpact.co2Saved" },
          totalWaterSaved: { $sum: "$environmentalImpact.waterSaved" },
        },
      },
    ]);

    // Get breakdown by category
    const categoryBreakdown = await RecyclingRecord.aggregate([
      { $match: { user: require("mongoose").Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          weight: { $sum: "$weight" },
          points: { $sum: "$points" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get user's rank on leaderboard
    const user = await User.findById(userId).select("stats profile.name");

    res.status(200).json({
      success: true,
      stats: stats[0] || {
        totalItems: 0,
        totalWeight: 0,
        totalPoints: 0,
        totalCo2Saved: 0,
        totalWaterSaved: 0,
      },
      categoryBreakdown,
      userStats: user?.stats || {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get community leaderboard (public)
 */
const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10, period = "all" } = req.query;

    let matchQuery = {};

    if (period === "weekly") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchQuery.createdAt = { $gte: weekAgo };
    } else if (period === "monthly") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchQuery.createdAt = { $gte: monthAgo };
    }

    const leaderboard = await RecyclingRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$user",
          totalPoints: { $sum: "$points" },
          totalWeight: { $sum: "$weight" },
          itemCount: { $sum: 1 },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $project: {
          _id: 1,
          totalPoints: 1,
          totalWeight: 1,
          itemCount: 1,
          userName: { $arrayElemAt: ["$user.profile.name", 0] },
          userLevel: { $arrayElemAt: ["$user.stats.level", 0] },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      leaderboard,
      period,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get environmental impact summary (public)
 */
const getEnvironmentalImpact = async (req, res) => {
  try {
    const impact = await RecyclingRecord.aggregate([
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalWeight: { $sum: "$weight" },
          totalCo2Saved: { $sum: "$environmentalImpact.co2Saved" },
          totalWaterSaved: { $sum: "$environmentalImpact.waterSaved" },
          totalTreesEquivalent: {
            $sum: "$environmentalImpact.treesEquivalent",
          },
        },
      },
    ]);

    const categoryImpact = await RecyclingRecord.aggregate([
      {
        $group: {
          _id: "$category",
          weight: { $sum: "$weight" },
          co2Saved: { $sum: "$environmentalImpact.co2Saved" },
        },
      },
      { $sort: { co2Saved: -1 } },
    ]);

    res.status(200).json({
      success: true,
      totalImpact: impact[0] || {},
      categoryImpact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete a recycling record
 */
const deleteRecord = async (req, res) => {
  try {
    const record = await RecyclingRecord.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    // Update user stats (subtract points)
    await User.findByIdAndUpdate(req.userId, {
      $inc: {
        "stats.points": -record.points,
        "stats.ecoCredits": -record.ecoCredits,
        "stats.recycledKg": -record.weight,
        "stats.co2Saved": -record.environmentalImpact.co2Saved,
      },
    });

    res.status(200).json({
      success: true,
      message: "Record deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  logItem,
  getHistory,
  getStats,
  getLeaderboard,
  getEnvironmentalImpact,
  deleteRecord,
};
