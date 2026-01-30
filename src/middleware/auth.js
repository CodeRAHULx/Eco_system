const jwt = require("jsonwebtoken");

/**
 * Protect middleware - requires authentication
 */
const protect = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * Optional auth middleware - allows anonymous but extracts userId if token present
 * Used for features that work both logged in and anonymous (like Swiggy browse)
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
    }
    next();
  } catch (error) {
    // Token invalid, continue as anonymous
    next();
  }
};

/**
 * Admin only middleware - requires SUPER_ADMIN or AREA_ADMIN role
 */
const adminOnly = async (req, res, next) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const adminRoles = ["SUPER_ADMIN", "AREA_ADMIN"];
    if (!adminRoles.includes(user.role)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { protect, optionalAuth, adminOnly };
