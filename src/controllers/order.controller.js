const Order = require("../models/Order");
const User = require("../models/User");
const ScanHistory = require("../models/ScanHistory");

// Create a new order
const createOrder = async (req, res) => {
  try {
    const {
      wasteTypes,
      estimatedQuantity,
      scheduledDate,
      scheduledTime,
      location,
      notes,
      scanData,
    } = req.body;

    // Get user to check subscription
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ============================================
    // SUBSCRIPTION CHECK
    // ============================================
    const subscriptionPlan = user.subscription?.plan || "FREE";
    const isActive = user.subscription?.status === "active";

    // Free users cannot place orders
    if (subscriptionPlan === "FREE") {
      return res.status(403).json({
        success: false,
        message:
          "Please upgrade your subscription to place orders. Scanning is free, but order scheduling requires a subscription.",
        subscriptionRequired: true,
        currentPlan: subscriptionPlan,
      });
    }

    // Check if subscription is active
    if (!isActive) {
      return res.status(403).json({
        success: false,
        message: "Your subscription has expired. Please renew to place orders.",
        subscriptionExpired: true,
        currentPlan: subscriptionPlan,
      });
    }

    // Check order limits based on plan
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyOrders = await Order.countDocuments({
      user: req.userId,
      createdAt: { $gte: monthStart },
    });

    const orderLimits = {
      BASIC: 5,
      PREMIUM: 20,
      ENTERPRISE: 999,
    };

    const limit = orderLimits[subscriptionPlan] || 5;
    if (monthlyOrders >= limit) {
      return res.status(403).json({
        success: false,
        message: `You have reached your monthly order limit (${limit}). Please upgrade your plan for more orders.`,
        orderLimitReached: true,
        currentPlan: subscriptionPlan,
        monthlyOrders,
        monthlyLimit: limit,
      });
    }

    // ============================================
    // SCAN DATA VALIDATION (Scan ID Required)
    // ============================================
    if (!scanData || !scanData.scanId) {
      return res.status(400).json({
        success: false,
        message:
          "Please scan or take a picture of your waste before scheduling pickup. This helps us prepare for collection.",
        scanRequired: true,
      });
    }

    // Verify scan exists in database
    const scanRecord = await ScanHistory.findById(scanData.scanId);
    if (!scanRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid scan data. Please scan your waste again.",
        scanRequired: true,
      });
    }

    // Optional: Check if scan is not too old (e.g., max 24 hours)
    const scanAge = Date.now() - new Date(scanRecord.createdAt).getTime();
    const maxScanAge = 24 * 60 * 60 * 1000; // 24 hours
    if (scanAge > maxScanAge) {
      return res.status(400).json({
        success: false,
        message:
          "Your scan has expired. Please scan your waste again for accurate pickup scheduling.",
        scanRequired: true,
        scanExpired: true,
      });
    }

    // Validation
    if (!wasteTypes || wasteTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one waste type",
      });
    }

    if (!estimatedQuantity || estimatedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Please provide estimated quantity",
      });
    }

    if (!scheduledDate || !scheduledTime) {
      return res.status(400).json({
        success: false,
        message: "Please select pickup date and time",
      });
    }

    if (!location || !location.coordinates) {
      return res.status(400).json({
        success: false,
        message: "Please provide pickup location",
      });
    }

    // Create order with scan data (reference to DB record)
    const order = new Order({
      user: req.userId,
      wasteTypes,
      estimatedQuantity,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      location,
      notes: notes || "",
      status: "pending",
      scanData: {
        scanId: scanData.scanId, // Reference to ScanHistory in DB
        aiAnalysis: scanRecord.results
          ? {
              category: scanRecord.results.items?.[0]?.category || "Mixed",
              recyclable: scanRecord.results.recyclableCount > 0,
              estimatedWeight: scanRecord.results.totalWeight,
              quality: "good",
              confidence: scanRecord.results.items?.[0]?.confidence || 0.85,
            }
          : scanData.aiAnalysis || null,
        scannedAt: scanRecord.createdAt,
      },
    });

    // Calculate estimated value
    order.calculateEstimatedValue();

    await order.save();

    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: { "stats.totalOrders": 1 },
    });

    // Link order to scan history and mark as converted to order
    await ScanHistory.findByIdAndUpdate(scanData.scanId, {
      $set: {
        orderId: order._id,
        convertedToOrder: true,
        user: req.userId, // Link guest scan to user when they place order
      },
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: {
        orderId: order.orderId,
        status: order.status,
        scheduledDate: order.scheduledDate,
        scheduledTime: order.scheduledTime,
        estimatedValue: order.estimatedValue,
        ecoPointsEarned: order.ecoPointsEarned,
        scanData: {
          imageUrl: order.scanData.imageUrl,
          hasAiAnalysis: !!order.scanData.aiAnalysis,
        },
      },
      subscription: {
        plan: subscriptionPlan,
        ordersThisMonth: monthlyOrders + 1,
        monthlyLimit: limit,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get user's orders
const getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { user: req.userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("assignedWorker", "phone profile.name workerInfo.employeeId workerInfo.rating")
      .select("-__v");

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
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

// Get single order details
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }],
      user: req.userId,
    }).populate("assignedWorker", "phone profile.name workerInfo.employeeId workerInfo.rating workerInfo.vehicleNumber");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }],
      user: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Can only cancel pending or confirmed orders
    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel order in current status",
      });
    }

    order.status = "cancelled";
    order.cancellationReason = reason || "Cancelled by user";
    order.cancelledAt = new Date();
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        orderId: order.orderId,
        status: order.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Rate order (after completion)
const rateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { score, feedback } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: "Please provide a rating between 1 and 5",
      });
    }

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }],
      user: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only rate completed orders",
      });
    }

    order.rating = {
      score,
      feedback: feedback || "",
      ratedAt: new Date(),
    };
    await order.save();

    res.status(200).json({
      success: true,
      message: "Thank you for your feedback!",
      rating: order.rating,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get order statistics for user
const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      { $match: { user: req.userId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          totalRecycled: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$actualQuantity", 0],
            },
          },
          totalEarnings: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$actualValue", 0],
            },
          },
          totalEcoPoints: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$ecoPointsEarned", 0],
            },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalOrders: 0,
      completedOrders: 0,
      totalRecycled: 0,
      totalEarnings: 0,
      totalEcoPoints: 0,
    };

    res.status(200).json({
      success: true,
      stats: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// ADMIN/WORKER ORDER MANAGEMENT
// ============================================

// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, date, area } = req.query;

    const query = {};

    if (status) {
      query.status = status.toUpperCase();
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.scheduledDate = { $gte: startDate, $lte: endDate };
    }

    if (area) {
      query["location.area"] = { $regex: area, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "phone profile.name profile.address")
        .populate(
          "assignedWorker",
          "phone profile.name workerInfo.employeeId workerInfo.vehicleNumber liveLocation",
        )
        .sort({ scheduledDate: 1, scheduledTime: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Assign order to worker/driver (Admin only)
const assignOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { workerId } = req.body;

    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: "Worker ID is required",
      });
    }

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const worker = await User.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    if (!["WORKER", "DRIVER"].includes(worker.role)) {
      return res.status(400).json({
        success: false,
        message: "Can only assign orders to workers or drivers",
      });
    }

    if (worker.workerInfo.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Worker is not active",
      });
    }

    // Assign order
    order.assignedWorker = workerId;
    order.status = "assigned";
    order.statusHistory.push({
      status: "assigned",
      timestamp: new Date(),
      note: `Assigned to ${worker.profile?.name || worker.workerInfo.employeeId}`,
    });

    await order.save();

    // Update worker's assigned orders count
    await User.findByIdAndUpdate(workerId, {
      $push: { "workerInfo.assignedOrders": order._id },
    });

    res.status(200).json({
      success: true,
      message: "Order assigned successfully",
      order: {
        orderId: order.orderId,
        status: order.status,
        assignedWorker: {
          id: worker._id,
          name: worker.profile?.name,
          employeeId: worker.workerInfo.employeeId,
          phone: worker.phone,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update order status (Worker/Driver)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note, actualQuantity, actualValue, photos } = req.body;

    const validStatuses = [
      "confirmed",
      "assigned",
      "in_transit",
      "arrived",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status?.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if worker is assigned to this order (for non-admin)
    const user = await User.findById(req.userId);
    if (["WORKER", "DRIVER"].includes(user.role)) {
      if (order.assignedWorker?.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this order",
        });
      }
    }

    // Update status
    const previousStatus = order.status;
    order.status = status.toLowerCase();
    order.statusHistory.push({
      status: status.toLowerCase(),
      timestamp: new Date(),
      note: note || `Status changed from ${previousStatus}`,
      updatedBy: req.userId,
    });

    // If in transit, record pickup time
    if (status.toLowerCase() === "in_transit") {
      order.pickedUpAt = new Date();
    }

    // If completed, record completion details
    if (status.toLowerCase() === "completed") {
      order.completedAt = new Date();
      if (actualQuantity) order.actualQuantity = actualQuantity;
      if (actualValue) order.actualValue = actualValue;
      if (photos && photos.length > 0) {
        order.completionPhotos = photos;
      }

      // Update worker's completed orders
      if (order.assignedWorker) {
        await User.findByIdAndUpdate(order.assignedWorker, {
          $inc: { "workerInfo.completedOrders": 1 },
          $pull: { "workerInfo.assignedOrders": order._id },
        });
      }

      // Update user's eco points
      await User.findByIdAndUpdate(order.user, {
        $inc: {
          "stats.completedOrders": 1,
          "stats.totalRecycled": actualQuantity || order.estimatedQuantity,
          ecoPoints: order.ecoPointsEarned,
        },
      });
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        orderId: order.orderId,
        status: order.status,
        previousStatus,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get assigned orders (for Worker/Driver)
const getMyAssignedOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { assignedWorker: req.userId };

    if (status) {
      query.status = status.toUpperCase();
    } else {
      // By default, show non-completed orders
      query.status = { $nin: ["COMPLETED", "CANCELLED", "FAILED"] };
    }

    const orders = await Order.find(query)
      .populate("user", "phone profile.name profile.address")
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders.map((o) => ({
        id: o._id,
        orderId: o.orderId,
        status: o.status,
        customer: {
          name: o.user?.profile?.name || "N/A",
          phone: o.user?.phone,
        },
        wasteTypes: o.wasteTypes,
        estimatedQuantity: o.estimatedQuantity,
        scheduledDate: o.scheduledDate,
        scheduledTime: o.scheduledTime,
        location: o.location,
        notes: o.notes,
        scanData: o.scanData,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get order with worker live location (for user tracking like Swiggy/Zomato)
const trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }],
      user: req.userId,
    }).populate(
      "assignedWorker",
      "phone profile.name workerInfo.employeeId workerInfo.vehicleNumber workerInfo.vehicleType liveLocation",
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const response = {
      success: true,
      order: {
        orderId: order.orderId,
        status: order.status,
        statusHistory: order.statusHistory,
        scheduledDate: order.scheduledDate,
        scheduledTime: order.scheduledTime,
        location: order.location,
        estimatedQuantity: order.estimatedQuantity,
        wasteTypes: order.wasteTypes,
      },
    };

    // Include worker details if assigned
    if (order.assignedWorker) {
      response.worker = {
        name: order.assignedWorker.profile?.name || "N/A",
        phone: order.assignedWorker.phone,
        employeeId: order.assignedWorker.workerInfo?.employeeId,
        vehicleNumber: order.assignedWorker.workerInfo?.vehicleNumber,
        vehicleType: order.assignedWorker.workerInfo?.vehicleType,
      };

      // Include live location if worker is sharing
      if (order.assignedWorker.liveLocation?.isSharing) {
        response.liveTracking = {
          isAvailable: true,
          location: {
            lat: order.assignedWorker.liveLocation.coordinates?.lat,
            lng: order.assignedWorker.liveLocation.coordinates?.lng,
            heading: order.assignedWorker.liveLocation.heading,
            speed: order.assignedWorker.liveLocation.speed,
            lastUpdated: order.assignedWorker.liveLocation.lastUpdated,
          },
        };

        // Calculate ETA (rough estimate)
        if (
          order.location?.coordinates &&
          order.assignedWorker.liveLocation.coordinates
        ) {
          const R = 6371;
          const userLat = order.location.coordinates.lat;
          const userLng = order.location.coordinates.lng;
          const workerLat = order.assignedWorker.liveLocation.coordinates.lat;
          const workerLng = order.assignedWorker.liveLocation.coordinates.lng;

          const dLat = ((userLat - workerLat) * Math.PI) / 180;
          const dLng = ((userLng - workerLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((workerLat * Math.PI) / 180) *
              Math.cos((userLat * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          response.liveTracking.distance = Math.round(distance * 100) / 100;
          response.liveTracking.eta = Math.round((distance / 25) * 60); // Estimated minutes at 25 km/h
        }
      } else {
        response.liveTracking = {
          isAvailable: false,
          message: "Worker location not currently available",
        };
      }
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get pending orders in area (for workers to pick up)
const getPendingOrdersInArea = async (req, res) => {
  try {
    const { area, lat, lng, radius = 10 } = req.query;

    const query = {
      status: "pending",
      assignedWorker: null,
    };

    if (area) {
      query["location.area"] = { $regex: area, $options: "i" };
    }

    const orders = await Order.find(query)
      .populate("user", "phone profile.name")
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .lean();

    // If lat/lng provided, calculate distances
    let ordersWithDistance = orders;
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const searchRadius = parseFloat(radius);

      ordersWithDistance = orders
        .map((order) => {
          if (order.location?.coordinates) {
            const orderLat = order.location.coordinates.lat;
            const orderLng = order.location.coordinates.lng;

            const R = 6371;
            const dLat = ((orderLat - userLat) * Math.PI) / 180;
            const dLng = ((orderLng - userLng) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((userLat * Math.PI) / 180) *
                Math.cos((orderLat * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            return { ...order, distance: Math.round(distance * 100) / 100 };
          }
          return { ...order, distance: null };
        })
        .filter((o) => !o.distance || o.distance <= searchRadius)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    res.status(200).json({
      success: true,
      count: ordersWithDistance.length,
      orders: ordersWithDistance.map((o) => ({
        id: o._id,
        orderId: o.orderId,
        customer: {
          name: o.user?.profile?.name || "N/A",
          phone: o.user?.phone,
        },
        wasteTypes: o.wasteTypes,
        estimatedQuantity: o.estimatedQuantity,
        estimatedValue: o.estimatedValue,
        scheduledDate: o.scheduledDate,
        scheduledTime: o.scheduledTime,
        location: o.location,
        distance: o.distance,
        notes: o.notes,
        scanData: o.scanData
          ? {
              imageUrl: o.scanData.imageUrl,
              category: o.scanData.aiAnalysis?.category,
            }
          : null,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Self-assign order (for workers)
const selfAssignOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const user = await User.findById(req.userId);
    if (!["WORKER", "DRIVER"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only workers and drivers can self-assign orders",
      });
    }

    if (user.workerInfo.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    if (!user.workerInfo.isOnDuty) {
      return res.status(403).json({
        success: false,
        message: "Please go on duty first to accept orders",
      });
    }

    const order = await Order.findOne({
      $or: [{ _id: orderId }, { orderId: orderId }],
      status: "pending",
      assignedWorker: null,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or already assigned",
      });
    }

    // Assign order
    order.assignedWorker = req.userId;
    order.status = "assigned";
    order.statusHistory.push({
      status: "assigned",
      timestamp: new Date(),
      note: `Self-assigned by ${user.profile?.name || user.workerInfo.employeeId}`,
      updatedBy: req.userId,
    });

    await order.save();

    // Update worker's assigned orders
    await User.findByIdAndUpdate(req.userId, {
      $push: { "workerInfo.assignedOrders": order._id },
    });

    res.status(200).json({
      success: true,
      message: "Order assigned to you successfully",
      order: {
        orderId: order.orderId,
        status: order.status,
        scheduledDate: order.scheduledDate,
        scheduledTime: order.scheduledTime,
        location: order.location,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  rateOrder,
  getOrderStats,
  // Admin/Worker functions
  getAllOrders,
  assignOrder,
  updateOrderStatus,
  getMyAssignedOrders,
  trackOrder,
  getPendingOrdersInArea,
  selfAssignOrder,
};
