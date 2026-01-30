const User = require("../models/User");

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "-otp -otpExpires -__v",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        isVerified: user.isVerified,
        role: user.role,
        profile: user.profile,
        subscription: user.subscription,
        stats: user.stats,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, city, area, language, address } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update profile fields
    if (name) user.profile.name = name;
    if (email) user.profile.email = email;
    if (city) user.profile.city = city;
    if (area) user.profile.area = area;
    if (language) user.profile.language = language;
    if (address) {
      if (address.street) user.profile.address.street = address.street;
      if (address.landmark) user.profile.address.landmark = address.landmark;
      if (address.pincode) user.profile.address.pincode = address.pincode;
      if (address.coordinates) {
        user.profile.address.coordinates = address.coordinates;
      }
    }

    // Also update legacy fields for backward compatibility
    if (name) user.name = name;
    if (city) user.city = city;
    if (area) user.area = area;
    if (language) user.language = language;

    user.updatedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        profile: user.profile,
        subscription: user.subscription,
        stats: user.stats,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user stats
const getStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("stats profile.name");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate level based on points
    const level = Math.floor(user.stats.points / 100) + 1;
    const pointsToNextLevel = level * 100 - user.stats.points;

    res.status(200).json({
      success: true,
      stats: {
        ...user.stats.toObject(),
        level,
        pointsToNextLevel,
        name: user.profile?.name || "User",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user location
const updateLocation = async (req, res) => {
  try {
    const { lat, lng, address } = req.body;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.profile.address.coordinates = { lat, lng };
    if (address) {
      if (address.street) user.profile.address.street = address.street;
      if (address.landmark) user.profile.address.landmark = address.landmark;
      if (address.pincode) user.profile.address.pincode = address.pincode;
      if (address.city) user.profile.city = address.city;
      if (address.area) user.profile.area = address.area;
    }

    user.updatedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      location: user.profile.address,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Register FCM token for push notifications
const registerDevice = async (req, res) => {
  try {
    const { deviceId, fcmToken, platform } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token is required" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if device already exists
    const existingDevice = user.devices.find((d) => d.deviceId === deviceId);
    if (existingDevice) {
      existingDevice.fcmToken = fcmToken;
      existingDevice.lastActive = Date.now();
    } else {
      user.devices.push({
        deviceId: deviceId || `device_${Date.now()}`,
        fcmToken,
        platform: platform || "web",
        lastActive: Date.now(),
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Device registered successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// ROLE-BASED REGISTRATION (Admin Only)
// ============================================

// Register a Worker
const registerWorker = async (req, res) => {
  try {
    const {
      phone,
      name,
      email,
      employeeId,
      vehicleNumber,
      vehicleType,
      licenseNumber,
      aadharNumber,
      assignedArea,
    } = req.body;

    // Validate required fields
    if (!phone || !name || !employeeId || !aadharNumber) {
      return res.status(400).json({
        message: "Phone, name, employee ID and Aadhar number are required",
      });
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this phone already exists" });
    }

    // Check if employee ID already exists
    const existingEmployee = await User.findOne({
      "workerInfo.employeeId": employeeId,
    });
    if (existingEmployee) {
      return res.status(400).json({ message: "Employee ID already exists" });
    }

    const worker = new User({
      phone,
      role: "WORKER",
      isVerified: true,
      profile: { name, email },
      workerInfo: {
        employeeId,
        vehicleNumber: vehicleNumber || "",
        vehicleType: vehicleType || "PICKUP_TRUCK",
        licenseNumber: licenseNumber || "",
        aadharNumber,
        assignedArea: assignedArea || "",
        isOnDuty: false,
        status: "ACTIVE",
        joiningDate: new Date(),
      },
    });

    await worker.save();

    res.status(201).json({
      success: true,
      message: "Worker registered successfully",
      worker: {
        id: worker._id,
        phone: worker.phone,
        name: worker.profile.name,
        employeeId: worker.workerInfo.employeeId,
        role: worker.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Register a Driver
const registerDriver = async (req, res) => {
  try {
    const {
      phone,
      name,
      email,
      employeeId,
      vehicleNumber,
      vehicleType,
      licenseNumber,
      aadharNumber,
      assignedArea,
    } = req.body;

    // Validate required fields
    if (
      !phone ||
      !name ||
      !employeeId ||
      !licenseNumber ||
      !aadharNumber ||
      !vehicleNumber
    ) {
      return res.status(400).json({
        message:
          "Phone, name, employee ID, license number, Aadhar number and vehicle number are required",
      });
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this phone already exists" });
    }

    // Check if employee ID already exists
    const existingEmployee = await User.findOne({
      "workerInfo.employeeId": employeeId,
    });
    if (existingEmployee) {
      return res.status(400).json({ message: "Employee ID already exists" });
    }

    const driver = new User({
      phone,
      role: "DRIVER",
      isVerified: true,
      profile: { name, email },
      workerInfo: {
        employeeId,
        vehicleNumber,
        vehicleType: vehicleType || "GARBAGE_TRUCK",
        licenseNumber,
        aadharNumber,
        assignedArea: assignedArea || "",
        isOnDuty: false,
        status: "ACTIVE",
        joiningDate: new Date(),
      },
    });

    await driver.save();

    res.status(201).json({
      success: true,
      message: "Driver registered successfully",
      driver: {
        id: driver._id,
        phone: driver.phone,
        name: driver.profile.name,
        employeeId: driver.workerInfo.employeeId,
        vehicleNumber: driver.workerInfo.vehicleNumber,
        role: driver.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// LIVE LOCATION TRACKING (Swiggy/Zomato Style)
// ============================================

// Update live location (for workers/drivers)
const updateLiveLocation = async (req, res) => {
  try {
    const { lat, lng, heading, speed, accuracy, isSharing } = req.body;

    if (lat === undefined || lng === undefined) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only workers and drivers can share live location
    if (!["WORKER", "DRIVER"].includes(user.role)) {
      return res
        .status(403)
        .json({ message: "Only workers and drivers can share live location" });
    }

    user.liveLocation = {
      coordinates: { lat, lng },
      heading: heading || 0,
      speed: speed || 0,
      accuracy: accuracy || 0,
      lastUpdated: new Date(),
      isSharing: isSharing !== undefined ? isSharing : true,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Live location updated",
      location: user.liveLocation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle duty status (for workers/drivers)
const toggleDutyStatus = async (req, res) => {
  try {
    const { isOnDuty } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!["WORKER", "DRIVER"].includes(user.role)) {
      return res
        .status(403)
        .json({ message: "Only workers and drivers can toggle duty status" });
    }

    user.workerInfo.isOnDuty = isOnDuty;
    user.liveLocation.isSharing = isOnDuty;

    if (!isOnDuty) {
      user.liveLocation.coordinates = { lat: 0, lng: 0 };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: isOnDuty ? "You are now on duty" : "You are now off duty",
      isOnDuty: user.workerInfo.isOnDuty,
      isSharing: user.liveLocation.isSharing,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active workers/drivers with live location (for admin/users tracking)
const getActiveWorkers = async (req, res) => {
  try {
    const { role, area } = req.query;

    const query = {
      "workerInfo.isOnDuty": true,
      "workerInfo.status": "ACTIVE",
      "liveLocation.isSharing": true,
    };

    if (role) {
      query.role = role.toUpperCase();
    } else {
      query.role = { $in: ["WORKER", "DRIVER"] };
    }

    if (area) {
      query["workerInfo.assignedArea"] = { $regex: area, $options: "i" };
    }

    const workers = await User.find(query)
      .select(
        "profile.name phone role workerInfo.employeeId workerInfo.vehicleNumber workerInfo.vehicleType workerInfo.assignedArea workerInfo.rating liveLocation",
      )
      .lean();

    res.status(200).json({
      success: true,
      count: workers.length,
      workers: workers.map((w) => ({
        id: w._id,
        name: w.profile?.name || "Unknown",
        phone: w.phone,
        role: w.role,
        employeeId: w.workerInfo?.employeeId,
        vehicleNumber: w.workerInfo?.vehicleNumber,
        vehicleType: w.workerInfo?.vehicleType,
        assignedArea: w.workerInfo?.assignedArea,
        rating: w.workerInfo?.rating || 0,
        location: {
          lat: w.liveLocation?.coordinates?.lat,
          lng: w.liveLocation?.coordinates?.lng,
          heading: w.liveLocation?.heading,
          speed: w.liveLocation?.speed,
          lastUpdated: w.liveLocation?.lastUpdated,
        },
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get nearby drivers/workers (within radius in km)
const getNearbyWorkers = async (req, res) => {
  try {
    const { lat, lng, radius = 5, role } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadius = parseFloat(radius);

    const query = {
      "workerInfo.isOnDuty": true,
      "workerInfo.status": "ACTIVE",
      "liveLocation.isSharing": true,
    };

    if (role) {
      query.role = role.toUpperCase();
    } else {
      query.role = { $in: ["WORKER", "DRIVER"] };
    }

    const workers = await User.find(query)
      .select(
        "profile.name phone role workerInfo.employeeId workerInfo.vehicleNumber workerInfo.vehicleType workerInfo.rating liveLocation",
      )
      .lean();

    // Calculate distance and filter by radius
    const nearbyWorkers = workers
      .map((w) => {
        const workerLat = w.liveLocation?.coordinates?.lat || 0;
        const workerLng = w.liveLocation?.coordinates?.lng || 0;

        // Haversine formula for distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = ((workerLat - userLat) * Math.PI) / 180;
        const dLng = ((workerLng - userLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((userLat * Math.PI) / 180) *
            Math.cos((workerLat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return {
          id: w._id,
          name: w.profile?.name || "Unknown",
          phone: w.phone,
          role: w.role,
          employeeId: w.workerInfo?.employeeId,
          vehicleNumber: w.workerInfo?.vehicleNumber,
          vehicleType: w.workerInfo?.vehicleType,
          rating: w.workerInfo?.rating || 0,
          location: {
            lat: workerLat,
            lng: workerLng,
            heading: w.liveLocation?.heading,
            speed: w.liveLocation?.speed,
            lastUpdated: w.liveLocation?.lastUpdated,
          },
          distance: Math.round(distance * 100) / 100,
          eta: Math.round((distance / 30) * 60), // Estimated time in minutes (assuming 30 km/h avg speed)
        };
      })
      .filter((w) => w.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance);

    res.status(200).json({
      success: true,
      count: nearbyWorkers.length,
      searchRadius: `${searchRadius} km`,
      workers: nearbyWorkers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get specific worker/driver location (for order tracking)
const getWorkerLocation = async (req, res) => {
  try {
    const { workerId } = req.params;

    const worker = await User.findById(workerId)
      .select("profile.name phone role workerInfo liveLocation")
      .lean();

    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    if (!["WORKER", "DRIVER"].includes(worker.role)) {
      return res
        .status(400)
        .json({ message: "This user is not a worker or driver" });
    }

    if (!worker.liveLocation?.isSharing) {
      return res.status(200).json({
        success: true,
        isSharing: false,
        message: "Worker is currently not sharing location",
      });
    }

    res.status(200).json({
      success: true,
      isSharing: true,
      worker: {
        id: worker._id,
        name: worker.profile?.name,
        phone: worker.phone,
        role: worker.role,
        vehicleNumber: worker.workerInfo?.vehicleNumber,
        vehicleType: worker.workerInfo?.vehicleType,
        isOnDuty: worker.workerInfo?.isOnDuty,
        location: {
          lat: worker.liveLocation?.coordinates?.lat,
          lng: worker.liveLocation?.coordinates?.lng,
          heading: worker.liveLocation?.heading,
          speed: worker.liveLocation?.speed,
          accuracy: worker.liveLocation?.accuracy,
          lastUpdated: worker.liveLocation?.lastUpdated,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// ADMIN USER MANAGEMENT
// ============================================

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20, search } = req.query;

    const query = {};

    if (role) {
      query.role = role.toUpperCase();
    }

    if (status) {
      query["workerInfo.status"] = status.toUpperCase();
    }

    if (search) {
      query.$or = [
        { phone: { $regex: search, $options: "i" } },
        { "profile.name": { $regex: search, $options: "i" } },
        { "profile.email": { $regex: search, $options: "i" } },
        { "workerInfo.employeeId": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      users: users.map((u) => ({
        id: u._id,
        phone: u.phone,
        name: u.profile?.name || "N/A",
        email: u.profile?.email || "N/A",
        role: u.role,
        isVerified: u.isVerified,
        subscription: u.subscription,
        workerInfo: u.workerInfo,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all workers (Admin only)
const getAllWorkers = async (req, res) => {
  try {
    const { status, area, isOnDuty } = req.query;

    const query = { role: "WORKER" };

    if (status) {
      query["workerInfo.status"] = status.toUpperCase();
    }

    if (area) {
      query["workerInfo.assignedArea"] = { $regex: area, $options: "i" };
    }

    if (isOnDuty !== undefined) {
      query["workerInfo.isOnDuty"] = isOnDuty === "true";
    }

    const workers = await User.find(query)
      .select("phone profile workerInfo liveLocation createdAt")
      .sort({ "workerInfo.employeeId": 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: workers.length,
      workers: workers.map((w) => ({
        id: w._id,
        phone: w.phone,
        name: w.profile?.name || "N/A",
        email: w.profile?.email,
        employeeId: w.workerInfo?.employeeId,
        vehicleNumber: w.workerInfo?.vehicleNumber,
        vehicleType: w.workerInfo?.vehicleType,
        assignedArea: w.workerInfo?.assignedArea,
        isOnDuty: w.workerInfo?.isOnDuty,
        status: w.workerInfo?.status,
        rating: w.workerInfo?.rating,
        completedOrders: w.workerInfo?.completedOrders,
        joiningDate: w.workerInfo?.joiningDate,
        isSharing: w.liveLocation?.isSharing,
        lastLocation: w.liveLocation?.lastUpdated,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all drivers (Admin only)
const getAllDrivers = async (req, res) => {
  try {
    const { status, isOnDuty } = req.query;

    const query = { role: "DRIVER" };

    if (status) {
      query["workerInfo.status"] = status.toUpperCase();
    }

    if (isOnDuty !== undefined) {
      query["workerInfo.isOnDuty"] = isOnDuty === "true";
    }

    const drivers = await User.find(query)
      .select("phone profile workerInfo liveLocation createdAt")
      .sort({ "workerInfo.employeeId": 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: drivers.length,
      drivers: drivers.map((d) => ({
        id: d._id,
        phone: d.phone,
        name: d.profile?.name || "N/A",
        email: d.profile?.email,
        employeeId: d.workerInfo?.employeeId,
        vehicleNumber: d.workerInfo?.vehicleNumber,
        vehicleType: d.workerInfo?.vehicleType,
        licenseNumber: d.workerInfo?.licenseNumber,
        assignedArea: d.workerInfo?.assignedArea,
        isOnDuty: d.workerInfo?.isOnDuty,
        status: d.workerInfo?.status,
        rating: d.workerInfo?.rating,
        completedOrders: d.workerInfo?.completedOrders,
        joiningDate: d.workerInfo?.joiningDate,
        isSharing: d.liveLocation?.isSharing,
        location: d.liveLocation?.isSharing
          ? {
              lat: d.liveLocation?.coordinates?.lat,
              lng: d.liveLocation?.coordinates?.lng,
              lastUpdated: d.liveLocation?.lastUpdated,
            }
          : null,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update worker/driver status (Admin only)
const updateWorkerStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, assignedArea } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!["WORKER", "DRIVER"].includes(user.role)) {
      return res
        .status(400)
        .json({ message: "This user is not a worker or driver" });
    }

    if (status) {
      const validStatuses = ["ACTIVE", "INACTIVE", "SUSPENDED", "ON_LEAVE"];
      if (!validStatuses.includes(status.toUpperCase())) {
        return res
          .status(400)
          .json({
            message: `Invalid status. Valid: ${validStatuses.join(", ")}`,
          });
      }
      user.workerInfo.status = status.toUpperCase();

      // If suspended or inactive, set off duty
      if (["SUSPENDED", "INACTIVE"].includes(status.toUpperCase())) {
        user.workerInfo.isOnDuty = false;
        user.liveLocation.isSharing = false;
      }
    }

    if (assignedArea) {
      user.workerInfo.assignedArea = assignedArea;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Worker status updated successfully",
      worker: {
        id: user._id,
        name: user.profile?.name,
        status: user.workerInfo.status,
        assignedArea: user.workerInfo.assignedArea,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get admin dashboard stats
const getAdminDashboardStats = async (req, res) => {
  try {
    const Order = require("../models/Order");
    const Incident = require("../models/Incident");
    const RecyclingRecord = require("../models/RecyclingRecord");

    const [
      totalUsers,
      totalWorkers,
      totalDrivers,
      activeWorkers,
      activeDrivers,
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      totalIncidents,
      activeIncidents,
      totalRecycling,
    ] = await Promise.all([
      User.countDocuments({ role: "USER" }),
      User.countDocuments({ role: "WORKER" }),
      User.countDocuments({ role: "DRIVER" }),
      User.countDocuments({ role: "WORKER", "workerInfo.isOnDuty": true }),
      User.countDocuments({ role: "DRIVER", "workerInfo.isOnDuty": true }),
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({
        status: { $in: ["CONFIRMED", "ASSIGNED", "PICKED_UP", "IN_TRANSIT"] },
      }),
      Order.countDocuments({ status: "COMPLETED" }),
      Incident.countDocuments(),
      Incident.countDocuments({
        status: { $in: ["REPORTED", "VERIFIED", "IN_PROGRESS"] },
      }),
      RecyclingRecord.countDocuments(),
    ]);

    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysOrders = await Order.countDocuments({
      createdAt: { $gte: today },
    });

    // Get orders by status for chart
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          workers: totalWorkers,
          drivers: totalDrivers,
          activeWorkers,
          activeDrivers,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          inProgress: inProgressOrders,
          completed: completedOrders,
          today: todaysOrders,
          byStatus: ordersByStatus,
        },
        incidents: {
          total: totalIncidents,
          active: activeIncidents,
        },
        recycling: {
          total: totalRecycling,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Rate worker/driver
const rateWorker = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const worker = await User.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }

    if (!["WORKER", "DRIVER"].includes(worker.role)) {
      return res
        .status(400)
        .json({ message: "This user is not a worker or driver" });
    }

    // Calculate new average rating
    const currentRating = worker.workerInfo.rating || 0;
    const totalRatings = worker.workerInfo.totalRatings || 0;
    const newTotalRatings = totalRatings + 1;
    const newRating = (currentRating * totalRatings + rating) / newTotalRatings;

    worker.workerInfo.rating = Math.round(newRating * 10) / 10;
    worker.workerInfo.totalRatings = newTotalRatings;

    await worker.save();

    res.status(200).json({
      success: true,
      message: "Rating submitted successfully",
      worker: {
        id: worker._id,
        name: worker.profile?.name,
        newRating: worker.workerInfo.rating,
        totalRatings: worker.workerInfo.totalRatings,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================
// RECENT ACTIVITY - Real-time activity feed
// ============================================

const getRecentActivity = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20 } = req.query;
    
    const Order = require("../models/Order");
    const Incident = require("../models/Incident");
    const ScanHistory = require("../models/ScanHistory");
    const RecyclingRecord = require("../models/RecyclingRecord");
    
    const activities = [];
    
    // Get user's orders
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    orders.forEach(order => {
      activities.push({
        type: 'order',
        icon: order.status === 'completed' ? 'check-circle' : 'truck',
        iconColor: order.status === 'completed' ? '#4ade80' : '#22d3ee',
        title: order.status === 'completed' ? 'Pickup Completed' : `Order ${order.status.replace('_', ' ')}`,
        description: `${order.wasteTypes?.join(', ') || 'Waste'} - ${order.estimatedWeight || 'N/A'} kg`,
        points: order.status === 'completed' ? (order.pointsEarned || 50) : 0,
        timestamp: order.updatedAt || order.createdAt,
        id: order._id
      });
    });
    
    // Get user's scan history
    const scans = await ScanHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    scans.forEach(scan => {
      const itemCount = scan.result?.items?.length || 0;
      activities.push({
        type: 'scan',
        icon: 'camera',
        iconColor: '#f59e0b',
        title: 'Waste Scanned',
        description: `${itemCount} item${itemCount !== 1 ? 's' : ''} detected - ${scan.result?.totalWeight || 0} kg`,
        points: 10,
        timestamp: scan.createdAt,
        id: scan._id
      });
    });
    
    // Get user's incidents
    const incidents = await Incident.find({ reporter: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    incidents.forEach(incident => {
      activities.push({
        type: 'incident',
        icon: 'shield-alt',
        iconColor: '#ef4444',
        title: 'Incident Reported',
        description: `${incident.type?.replace('_', ' ')} - ${incident.severity || 'medium'} severity`,
        points: incident.aiAnalysis?.riskLevel === 'critical' ? 20 : 10,
        timestamp: incident.createdAt,
        id: incident._id
      });
    });
    
    // Get user's recycling records
    const recycling = await RecyclingRecord.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    recycling.forEach(record => {
      activities.push({
        type: 'recycling',
        icon: 'recycle',
        iconColor: '#4ade80',
        title: 'Recycling Recorded',
        description: `${record.wasteType || 'Mixed waste'} - ${record.weight || 0} kg`,
        points: record.pointsEarned || 15,
        timestamp: record.createdAt,
        id: record._id
      });
    });
    
    // Sort all activities by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: limitedActivities.length,
      activities: limitedActivities.map(a => ({
        ...a,
        timeAgo: getTimeAgo(a.timestamp)
      }))
    });
  } catch (error) {
    console.error("Recent activity error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

module.exports = {
  getProfile,
  updateProfile,
  getStats,
  updateLocation,
  registerDevice,
  deleteAccount,
  // Role-based registration
  registerWorker,
  registerDriver,
  // Live location
  updateLiveLocation,
  toggleDutyStatus,
  getActiveWorkers,
  getNearbyWorkers,
  getWorkerLocation,
  // Admin management
  getAllUsers,
  getAllWorkers,
  getAllDrivers,
  updateWorkerStatus,
  getAdminDashboardStats,
  rateWorker,
  // Activity
  getRecentActivity,
};
