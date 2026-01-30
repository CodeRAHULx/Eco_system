const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  saveLocation,
  getLocation,
  saveManualAddress,
  searchPlaces,
  getSavedAddresses,
  addSavedAddress,
  deleteSavedAddress,
  setDefaultAddress,
  getLocationForOrder,
  getWorkerLocation
} = require("../controllers/location.controller");

// All routes require authentication
router.use(protect);

// GPS location routes
router.post("/save", saveLocation);        // Save GPS coordinates with auto-geocoding
router.get("/current", getLocation);        // Get user's current location from profile

// Manual address routes
router.post("/manual", saveManualAddress);  // Save manually entered address

// Place search (for autocomplete)
router.get("/search", searchPlaces);        // Search places by query

// Saved addresses (multiple addresses)
router.get("/addresses", getSavedAddresses);          // Get all saved addresses
router.post("/addresses", addSavedAddress);           // Add new saved address
router.delete("/addresses/:addressId", deleteSavedAddress);  // Delete saved address
router.put("/addresses/:addressId/default", setDefaultAddress); // Set default address

// Order-specific (fetch saved location for order)
router.get("/for-order", getLocationForOrder);        // Get location for placing order

// Worker location tracking (for customers)
router.get("/worker/:workerId", getWorkerLocation);   // Get worker's live location

module.exports = router;
