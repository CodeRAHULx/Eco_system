// Load environment variables FIRST before any other imports
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// Route imports (must come AFTER dotenv.config())
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const locationRoutes = require("./routes/location.routes");
const orderRoutes = require("./routes/order.routes");
const aiRoutes = require("./routes/ai.routes");
const recyclingRoutes = require("./routes/recycling.routes");
const incidentRoutes = require("./routes/incident.routes");
const facilityRoutes = require("./routes/facility.routes");
const paymentRoutes = require("./routes/payment.routes");
const { initializeFirebase } = require("./config/firebase");

connectDB();
initializeFirebase(); // Initialize Firebase (optional - works without it in dev mode)

const app = express();

// Increase payload limit for image uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  }),
);

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "../public")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/recycling", recyclingRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/payment", paymentRoutes); // Changed from /payments to /payment

// Serve frontend pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
