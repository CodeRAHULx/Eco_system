const User = require("../models/User");
const axios = require("axios");

// Reverse geocode coordinates to address using OpenStreetMap (free)
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'EcoSustain-App/1.0'
        }
      }
    );
    
    if (response.data && response.data.address) {
      const addr = response.data.address;
      return {
        street: addr.road || addr.pedestrian || addr.street || '',
        landmark: addr.neighbourhood || addr.suburb || '',
        area: addr.suburb || addr.neighbourhood || addr.locality || '',
        city: addr.city || addr.town || addr.village || addr.county || '',
        state: addr.state || '',
        pincode: addr.postcode || '',
        country: addr.country || 'India',
        displayAddress: response.data.display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Reverse geocode error:', error.message);
    return null;
  }
};

// Save user location with auto-geocoding
const saveLocation = async (req, res) => {
  try {
    const { lat, lng, accuracy, altitude, heading, speed, source } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        success: false,
        message: "Latitude and longitude are required" 
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Reverse geocode to get address
    const geoAddress = await reverseGeocode(lat, lng);

    // Update user location
    user.profile.address.coordinates = { 
      lat: parseFloat(lat), 
      lng: parseFloat(lng) 
    };
    
    if (geoAddress) {
      user.profile.address.street = geoAddress.street || user.profile.address.street;
      user.profile.address.landmark = geoAddress.landmark || user.profile.address.landmark;
      user.profile.address.pincode = geoAddress.pincode || user.profile.address.pincode;
      user.profile.city = geoAddress.city || user.profile.city;
      user.profile.area = geoAddress.area || user.profile.area;
    }

    // Store location metadata
    user.locationMeta = {
      accuracy: accuracy || null,
      altitude: altitude || null,
      heading: heading || null,
      speed: speed || null,
      source: source || 'gps', // 'gps', 'manual', 'ip'
      lastUpdated: new Date()
    };

    user.updatedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Location saved successfully",
      location: {
        coordinates: user.profile.address.coordinates,
        address: geoAddress || user.profile.address,
        accuracy: accuracy,
        source: source || 'gps'
      }
    });
  } catch (error) {
    console.error('Save location error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get user's current saved location
const getLocation = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('profile.address profile.city profile.area locationMeta');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      location: {
        coordinates: user.profile.address.coordinates,
        street: user.profile.address.street,
        landmark: user.profile.address.landmark,
        pincode: user.profile.address.pincode,
        city: user.profile.city,
        area: user.profile.area,
        meta: user.locationMeta
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Manual address save (user types address)
const saveManualAddress = async (req, res) => {
  try {
    const { street, landmark, area, city, pincode, lat, lng } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Update address fields
    if (street) user.profile.address.street = street;
    if (landmark) user.profile.address.landmark = landmark;
    if (pincode) user.profile.address.pincode = pincode;
    if (area) user.profile.area = area;
    if (city) user.profile.city = city;
    
    // If coordinates provided, save them
    if (lat && lng) {
      user.profile.address.coordinates = { 
        lat: parseFloat(lat), 
        lng: parseFloat(lng) 
      };
    }

    user.locationMeta = {
      source: 'manual',
      lastUpdated: new Date()
    };

    user.updatedAt = Date.now();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Address saved successfully",
      address: {
        street: user.profile.address.street,
        landmark: user.profile.address.landmark,
        pincode: user.profile.address.pincode,
        area: user.profile.area,
        city: user.profile.city,
        coordinates: user.profile.address.coordinates
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Search places/addresses (for autocomplete)
const searchPlaces = async (req, res) => {
  try {
    const { query, lat, lng } = req.query;
    
    if (!query || query.length < 3) {
      return res.status(400).json({ 
        success: false,
        message: "Search query must be at least 3 characters" 
      });
    }

    // Use OpenStreetMap Nominatim for place search
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5&addressdetails=1`;
    
    // If user's location available, bias results
    if (lat && lng) {
      url += `&viewbox=${parseFloat(lng)-0.5},${parseFloat(lat)+0.5},${parseFloat(lng)+0.5},${parseFloat(lat)-0.5}&bounded=0`;
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'EcoSustain-App/1.0'
      }
    });

    const places = response.data.map(place => ({
      displayName: place.display_name,
      lat: parseFloat(place.lat),
      lng: parseFloat(place.lon),
      type: place.type,
      address: place.address
    }));

    res.status(200).json({
      success: true,
      places
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get all saved addresses (for order selection)
const getSavedAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('savedAddresses profile.address profile.city profile.area');
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Combine current location with saved addresses
    const addresses = [];
    
    // Add current/primary address first
    if (user.profile.address.coordinates.lat) {
      addresses.push({
        _id: 'current',
        label: 'Current Location',
        street: user.profile.address.street,
        landmark: user.profile.address.landmark,
        area: user.profile.area,
        city: user.profile.city,
        pincode: user.profile.address.pincode,
        coordinates: user.profile.address.coordinates,
        isDefault: true,
        isCurrent: true
      });
    }

    // Add saved addresses
    if (user.savedAddresses && user.savedAddresses.length > 0) {
      user.savedAddresses.forEach(addr => {
        addresses.push({
          _id: addr._id,
          label: addr.label,
          street: addr.street,
          landmark: addr.landmark,
          area: addr.area,
          city: addr.city,
          pincode: addr.pincode,
          coordinates: addr.coordinates,
          isDefault: addr.isDefault,
          isCurrent: false
        });
      });
    }

    res.status(200).json({
      success: true,
      addresses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add a new saved address
const addSavedAddress = async (req, res) => {
  try {
    const { label, street, landmark, area, city, pincode, lat, lng, isDefault } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If this is default, unset other defaults
    if (isDefault) {
      user.savedAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      label: label || 'Other',
      street,
      landmark,
      area,
      city,
      pincode,
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
      isDefault: isDefault || user.savedAddresses.length === 0,
      createdAt: new Date()
    };

    user.savedAddresses.push(newAddress);
    await user.save();

    res.status(201).json({
      success: true,
      message: "Address saved successfully",
      address: user.savedAddresses[user.savedAddresses.length - 1]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a saved address
const deleteSavedAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.savedAddresses = user.savedAddresses.filter(
      addr => addr._id.toString() !== addressId
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: "Address deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Set default address
const setDefaultAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Unset all defaults first
    user.savedAddresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === addressId;
    });
    
    await user.save();

    res.status(200).json({
      success: true,
      message: "Default address updated"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get location for order (returns default or current location)
const getLocationForOrder = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('savedAddresses profile.address profile.city profile.area locationMeta');
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // First try to find default saved address
    const defaultAddress = user.savedAddresses.find(addr => addr.isDefault);
    
    if (defaultAddress) {
      return res.status(200).json({
        success: true,
        hasLocation: true,
        source: 'saved',
        location: {
          label: defaultAddress.label,
          street: defaultAddress.street,
          landmark: defaultAddress.landmark,
          area: defaultAddress.area,
          city: defaultAddress.city,
          pincode: defaultAddress.pincode,
          coordinates: defaultAddress.coordinates
        }
      });
    }

    // Fallback to current profile location
    if (user.profile.address.coordinates.lat) {
      return res.status(200).json({
        success: true,
        hasLocation: true,
        source: 'profile',
        location: {
          label: 'Current Location',
          street: user.profile.address.street,
          landmark: user.profile.address.landmark,
          area: user.profile.area,
          city: user.profile.city,
          pincode: user.profile.address.pincode,
          coordinates: user.profile.address.coordinates
        }
      });
    }

    // No location set
    return res.status(200).json({
      success: true,
      hasLocation: false,
      message: "Please set your location first"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get worker's live location (for tracking by customers)
const getWorkerLocation = async (req, res) => {
  try {
    const { workerId } = req.params;
    
    const worker = await User.findById(workerId).select('profile.address.coordinates workerInfo.isOnDuty locationMeta');
    
    if (!worker) {
      return res.status(404).json({ 
        success: false,
        message: "Worker not found" 
      });
    }

    // Check if worker is on duty
    if (!worker.workerInfo?.isOnDuty) {
      return res.status(200).json({
        success: true,
        available: false,
        message: "Worker is not on duty"
      });
    }

    const coords = worker.profile?.address?.coordinates;
    if (!coords || !coords.lat) {
      return res.status(200).json({
        success: true,
        available: false,
        message: "Worker location not available"
      });
    }

    res.status(200).json({
      success: true,
      available: true,
      location: {
        coordinates: coords,
        lastUpdated: worker.locationMeta?.lastUpdated || null
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  saveLocation,
  getLocation,
  saveManualAddress,
  searchPlaces,
  reverseGeocode,
  getSavedAddresses,
  addSavedAddress,
  deleteSavedAddress,
  setDefaultAddress,
  getLocationForOrder,
  getWorkerLocation
};
