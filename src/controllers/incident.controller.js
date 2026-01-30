const Incident = require("../models/Incident");
const User = require("../models/User");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze incident with AI
 */
const analyzeIncidentWithAI = async (description, mediaUrls, type) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a road safety and incident analysis expert. Analyze this incident report and provide a risk assessment.

Incident Type: ${type}
Description: ${description}
Has Media: ${mediaUrls.length > 0 ? "Yes (" + mediaUrls.length + " files)" : "No"}

Please analyze and respond ONLY with a valid JSON object (no markdown, no code blocks):
{
  "riskLevel": "low|medium|high|critical",
  "riskScore": <number 1-100>,
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "predictedDuration": "<estimated time to resolve>",
  "affectedArea": "<estimated radius affected in meters>",
  "recommendedActions": ["action1", "action2"],
  "warningMessage": "<short warning message for nearby users>",
  "requiresEmergencyResponse": <true/false>,
  "trafficImpact": "none|minor|moderate|severe"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Clean the response
    let cleanedResponse = responseText;
    if (responseText.startsWith("```")) {
      cleanedResponse = responseText
        .replace(/```json?\n?/g, "")
        .replace(/```/g, "")
        .trim();
    }

    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("AI analysis error:", error);
    return {
      riskLevel: "medium",
      riskScore: 50,
      suggestions: [
        "Exercise caution in the area",
        "Report to local authorities if needed",
      ],
      predictedDuration: "Unknown",
      requiresEmergencyResponse: false,
      trafficImpact: "minor",
    };
  }
};

/**
 * Report a new incident
 * REQUIRES: At least one photo or video for verification
 */
const reportIncident = async (req, res) => {
  console.log("=== INCIDENT REPORT STARTED ===");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  try {
    const {
      type,
      description,
      location,
      hasInjuries,
      injuredCount,
      visibility,
      weather,
      media,
    } = req.body;

    console.log("Step 1: Destructured request body");

    // Validate required fields
    if (!type || !description || !location?.lat || !location?.lng) {
      return res.status(400).json({
        success: false,
        message: "Type, description, and location are required",
      });
    }

    console.log("Step 2: Validation passed");

    // ============================================
    // MEDIA VALIDATION (Photo/Video Required)
    // ============================================
    const hasPhotos = media?.photos && media.photos.length > 0;
    const hasVideo = media?.video && media.video.trim() !== "";

    if (!hasPhotos && !hasVideo) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least one photo or video of the incident for verification. This helps ensure accurate reporting and faster response.",
        mediaRequired: true,
      });
    }

    // Get reporter info if authenticated
    let reporterName = "Anonymous";
    let reporterId = null;

    if (req.userId) {
      const user = await User.findById(req.userId).select("profile.name");
      reporterName = user?.profile?.name || "Anonymous";
      reporterId = req.userId;
    }

    console.log("Step 3: Reporter info collected");

    // ============================================
    // AI ANALYSIS OF INCIDENT
    // ============================================
    const mediaUrls = [
      ...(media?.photos || []),
      media?.video ? [media.video] : [],
    ].flat();

    console.log("Step 4: Starting AI analysis...");
    const aiAnalysis = await analyzeIncidentWithAI(
      description,
      mediaUrls,
      type,
    );
    console.log("Step 5: AI analysis complete:", aiAnalysis);

    // Create incident with AI analysis
    console.log("Step 6: Creating incident in database...");
    const incident = await Incident.create({
      reporter: reporterId,
      reporterName,
      type,
      description,
      location,
      hasInjuries: hasInjuries || false,
      injuredCount: injuredCount || 0,
      visibility: visibility || "good",
      weather: weather || "clear",
      media: media || {},
      aiAnalysis: {
        riskLevel: aiAnalysis.riskLevel,
        riskScore: aiAnalysis.riskScore,
        suggestions: aiAnalysis.suggestions,
        predictedDuration: aiAnalysis.predictedDuration,
        analyzedAt: new Date(),
      },
      // Override severity based on AI if needed
      severity:
        aiAnalysis.riskLevel === "critical"
          ? "critical"
          : aiAnalysis.riskLevel === "high"
            ? "high"
            : aiAnalysis.riskLevel === "medium"
              ? "medium"
              : "low",
    });

    // If AI determines emergency response needed or has injuries
    if (
      aiAnalysis.requiresEmergencyResponse ||
      incident.hasInjuries ||
      aiAnalysis.riskLevel === "critical"
    ) {
      incident.authoritiesNotified.police.notified = true;
      incident.authoritiesNotified.police.at = new Date();

      if (incident.hasInjuries) {
        incident.authoritiesNotified.medical.notified = true;
        incident.authoritiesNotified.medical.at = new Date();
      }

      await incident.save();
    }

    // Update user stats if logged in
    if (reporterId) {
      const pointsEarned =
        aiAnalysis.riskLevel === "critical"
          ? 20
          : aiAnalysis.riskLevel === "high"
            ? 15
            : 10;
      await User.findByIdAndUpdate(reporterId, {
        $inc: { "stats.points": pointsEarned, "stats.incidentsReported": 1 },
      });
    }

    res.status(201).json({
      success: true,
      message: "Incident reported successfully",
      incident: {
        id: incident._id,
        incidentId: incident.incidentId,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        location: incident.location,
        aiAnalysis: {
          riskLevel: aiAnalysis.riskLevel,
          riskScore: aiAnalysis.riskScore,
          suggestions: aiAnalysis.suggestions,
          predictedDuration: aiAnalysis.predictedDuration,
          warningMessage: aiAnalysis.warningMessage,
          trafficImpact: aiAnalysis.trafficImpact,
          requiresEmergencyResponse: aiAnalysis.requiresEmergencyResponse,
        },
        authoritiesNotified: incident.authoritiesNotified,
      },
      pointsEarned: reporterId
        ? aiAnalysis.riskLevel === "critical"
          ? 20
          : aiAnalysis.riskLevel === "high"
            ? 15
            : 10
        : 0,
    });
  } catch (error) {
    console.error("=== REPORT INCIDENT ERROR ===");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get nearby incidents (public)
 */
const getNearbyIncidents = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 10,
      type,
      severity,
      status = "active",
    } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Location (lat, lng) is required",
      });
    }

    let incidents = await Incident.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius),
      status,
    );

    // Filter by type if provided
    if (type) {
      incidents = incidents.filter((i) => i.type === type);
    }

    // Filter by severity if provided
    if (severity) {
      incidents = incidents.filter((i) => i.severity === severity);
    }

    // Calculate distance for each incident
    incidents = incidents.map((incident) => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        incident.location.lat,
        incident.location.lng,
      );
      return {
        ...incident.toObject(),
        distance_km: parseFloat(distance.toFixed(2)),
      };
    });

    // Sort by severity (critical first) then by distance
    incidents.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return a.distance_km - b.distance_km;
    });

    res.status(200).json({
      success: true,
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all incidents with filters (public)
 */
const getAllIncidents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      severity,
      status = "active",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    let query = {};

    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const incidents = await Incident.find(query)
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select("-comments");

    const total = await Incident.countDocuments(query);

    res.status(200).json({
      success: true,
      incidents,
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
 * Get single incident details
 */
const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id).populate(
      "comments.user",
      "profile.name",
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    res.status(200).json({
      success: true,
      incident,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Confirm an incident (requires login)
 */
const confirmIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    // Check if already confirmed
    if (incident.confirmedBy.includes(req.userId)) {
      return res.status(400).json({
        success: false,
        message: "You already confirmed this incident",
      });
    }

    await incident.confirm(req.userId);

    // Award points for confirming
    await User.findByIdAndUpdate(req.userId, {
      $inc: { "stats.points": 2 },
    });

    res.status(200).json({
      success: true,
      message: "Incident confirmed",
      confirmations: incident.confirmations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Add comment to incident (requires login)
 */
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    const user = await User.findById(req.userId).select("profile.name");

    incident.comments.push({
      user: req.userId,
      userName: user?.profile?.name || "Anonymous",
      text,
    });

    await incident.save();

    res.status(200).json({
      success: true,
      message: "Comment added",
      comment: incident.comments[incident.comments.length - 1],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Mark incident as resolved (reporter or admin only)
 */
const resolveIncident = async (req, res) => {
  try {
    const { resolutionNotes } = req.body;

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found",
      });
    }

    // Check ownership or admin role
    const user = await User.findById(req.userId);
    const isOwner = incident.reporter?.toString() === req.userId;
    const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "AREA_ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to resolve this incident",
      });
    }

    incident.status = "resolved";
    incident.resolvedAt = new Date();
    incident.resolvedBy = req.userId;
    incident.resolutionNotes = resolutionNotes;

    await incident.save();

    res.status(200).json({
      success: true,
      message: "Incident resolved",
      incident,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Send SOS Emergency (requires login)
 */
const sendEmergencySOS = async (req, res) => {
  try {
    const { type, description, location, injuredCount } = req.body;

    if (!location?.lat || !location?.lng) {
      return res.status(400).json({
        success: false,
        message: "Location is required for emergency",
      });
    }

    const user = await User.findById(req.userId).select("profile.name");

    // Create emergency incident
    const incident = await Incident.create({
      reporter: req.userId,
      reporterName: user?.profile?.name || "Anonymous",
      type: type || "accident",
      description: description || "EMERGENCY SOS - Immediate assistance needed",
      location,
      severity: "critical",
      hasInjuries: true,
      injuredCount: injuredCount || 1,
      isEmergency: true,
      emergencySosId: `SOS-${Date.now()}`,
      authoritiesNotified: {
        police: { notified: true, at: new Date() },
        medical: { notified: true, at: new Date() },
      },
    });

    // In production: Send notifications to nearby users, emergency contacts, etc.

    res.status(201).json({
      success: true,
      message: "Emergency SOS sent! Help is on the way.",
      incident,
      sosId: incident.emergencySosId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get incident analytics (public)
 */
const getAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const analytics = await Incident.getAnalytics(parseInt(days));

    // Get summary stats
    const summary = await Incident.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          critical: {
            $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] },
          },
          withInjuries: { $sum: { $cond: ["$hasInjuries", 1, 0] } },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      analytics,
      summary: summary[0] || { total: 0, critical: 0, withInjuries: 0 },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function - Calculate distance using Haversine formula
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

module.exports = {
  reportIncident,
  getNearbyIncidents,
  getAllIncidents,
  getIncidentById,
  confirmIncident,
  addComment,
  resolveIncident,
  sendEmergencySOS,
  getAnalytics,
};
