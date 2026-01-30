const crypto = require("crypto");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Order = require("../models/Order");

// ============================================
// STRIPE CONFIGURATION (Primary)
// ============================================
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
let stripe = null;
if (STRIPE_SECRET_KEY && STRIPE_SECRET_KEY.startsWith("sk_")) {
  stripe = require("stripe")(STRIPE_SECRET_KEY);
  console.log("✅ Stripe initialized successfully");
} else {
  console.log("⚠️  Stripe not configured");
}

// ============================================
// RAZORPAY CONFIGURATION (Fallback for India)
// ============================================
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
let razorpay = null;
if (
  RAZORPAY_KEY_ID &&
  RAZORPAY_KEY_SECRET &&
  RAZORPAY_KEY_ID !== "your_razorpay_key_id"
) {
  const Razorpay = require("razorpay");
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
  console.log("✅ Razorpay initialized successfully");
}

// Check if any payment provider is available
const isPaymentEnabled = () => stripe || razorpay;
const getActiveProvider = () =>
  stripe ? "stripe" : razorpay ? "razorpay" : null;

// Subscription Plans with pricing
const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: "Basic",
    price: 9900, // ₹99 in paise
    features: ["5 pickups/month", "Basic AI scanning", "Email support"],
    orderLimit: 5,
    duration: 30, // days
  },
  PREMIUM: {
    name: "Premium",
    price: 19900, // ₹199 in paise
    features: [
      "20 pickups/month",
      "Advanced AI scanning",
      "Priority support",
      "Live tracking",
    ],
    orderLimit: 20,
    duration: 30,
  },
  ENTERPRISE: {
    name: "Enterprise",
    price: 49900, // ₹499 in paise
    features: [
      "Unlimited pickups",
      "Full AI features",
      "Dedicated support",
      "Live tracking",
      "Analytics",
    ],
    orderLimit: 999,
    duration: 30,
  },
};

/**
 * Get available subscription plans
 */
const getPlans = async (req, res) => {
  try {
    const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      id: key,
      ...plan,
      priceInRupees: plan.price / 100,
    }));

    res.status(200).json({
      success: true,
      plans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create payment order for subscription
 * Supports both Stripe (primary) and Razorpay (fallback)
 */
const createSubscriptionOrder = async (req, res) => {
  try {
    const { plan, paymentMethod = "stripe" } = req.body;

    if (!plan || !SUBSCRIPTION_PLANS[plan]) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }

    // Check if payment is enabled
    if (!isPaymentEnabled()) {
      return res.status(503).json({
        success: false,
        message: "Payment service is not configured. Please contact support.",
        configError: true,
      });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[plan];
    const user = await User.findById(req.userId);

    // ============================================
    // STRIPE PAYMENT (Primary)
    // ============================================
    if (stripe && (paymentMethod === "stripe" || !razorpay)) {
      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: "inr",
              product_data: {
                name: `${selectedPlan.name} Subscription`,
                description: selectedPlan.features.join(", "),
              },
              unit_amount: selectedPlan.price, // Already in paise
            },
            quantity: 1,
          },
        ],
        metadata: {
          userId: req.userId,
          plan: plan,
          type: "subscription",
        },
        success_url: `${req.headers.origin || "http://localhost:5000"}/dashboard.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin || "http://localhost:5000"}/dashboard.html?payment=cancelled`,
      });

      // Save payment record in database
      const payment = await Payment.create({
        user: req.userId,
        stripeSessionId: session.id,
        paymentProvider: "stripe",
        type: "subscription",
        amount: selectedPlan.price,
        currency: "INR",
        status: "created",
        subscriptionDetails: {
          plan: plan,
          duration: 1,
        },
        ipAddress: req.ip,
        deviceInfo: {
          userAgent: req.headers["user-agent"],
        },
      });

      return res.status(200).json({
        success: true,
        provider: "stripe",
        sessionId: session.id,
        checkoutUrl: session.url,
        paymentId: payment._id,
        plan: {
          name: selectedPlan.name,
          priceInRupees: selectedPlan.price / 100,
          features: selectedPlan.features,
        },
      });
    }

    // ============================================
    // RAZORPAY PAYMENT (Fallback)
    // ============================================
    if (razorpay) {
      const razorpayOrder = await razorpay.orders.create({
        amount: selectedPlan.price,
        currency: "INR",
        receipt: `sub_${req.userId}_${Date.now()}`,
        notes: {
          userId: req.userId,
          plan: plan,
          type: "subscription",
        },
      });

      // Save payment record in database
      const payment = await Payment.create({
        user: req.userId,
        razorpayOrderId: razorpayOrder.id,
        paymentProvider: "razorpay",
        type: "subscription",
        amount: selectedPlan.price,
        currency: "INR",
        status: "created",
        subscriptionDetails: {
          plan: plan,
          duration: 1,
        },
        ipAddress: req.ip,
        deviceInfo: {
          userAgent: req.headers["user-agent"],
        },
      });

      return res.status(200).json({
        success: true,
        provider: "razorpay",
        order: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
        paymentId: payment._id,
        key: RAZORPAY_KEY_ID,
        plan: {
          name: selectedPlan.name,
          priceInRupees: selectedPlan.price / 100,
          features: selectedPlan.features,
        },
      });
    }

    return res.status(503).json({
      success: false,
      message: "No payment provider available",
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Verify Stripe payment (called after checkout redirect)
 */
const verifyStripePayment = async (req, res) => {
  try {
    const { session_id } = req.body;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "Missing session ID",
      });
    }

    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: "Stripe not configured",
      });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    // Get payment record
    const payment = await Payment.findOne({ stripeSessionId: session_id });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Check if already processed
    if (payment.status === "captured") {
      const user = await User.findById(payment.user);
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        subscription: user.subscription,
      });
    }

    // Update payment record
    payment.stripePaymentIntentId = session.payment_intent;
    payment.status = "captured";
    payment.paidAt = new Date();
    await payment.save();

    // Activate subscription
    const plan = payment.subscriptionDetails.plan;
    const planDetails = SUBSCRIPTION_PLANS[plan];
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + planDetails.duration);

    const user = await User.findByIdAndUpdate(
      payment.user,
      {
        "subscription.plan": plan,
        "subscription.status": "active",
        "subscription.isActive": true,
        "subscription.startDate": new Date(),
        "subscription.endDate": expiryDate,
        "subscription.orderLimit": planDetails.orderLimit,
        "subscription.ordersUsed": 0,
        "subscription.paymentId": payment._id,
      },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: user.subscription,
      plan: {
        name: planDetails.name,
        features: planDetails.features,
        orderLimit: planDetails.orderLimit,
        expiresAt: expiryDate,
      },
    });
  } catch (error) {
    console.error("Stripe verify error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Stripe Webhook Handler
 */
const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    let event;

    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      event = req.body;
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;

        // Find and update payment
        const payment = await Payment.findOne({ stripeSessionId: session.id });
        if (payment && payment.status !== "captured") {
          payment.status = "captured";
          payment.stripePaymentIntentId = session.payment_intent;
          payment.paidAt = new Date();
          await payment.save();

          // Activate subscription
          const plan = payment.subscriptionDetails.plan;
          const planDetails = SUBSCRIPTION_PLANS[plan];
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + planDetails.duration);

          await User.findByIdAndUpdate(payment.user, {
            "subscription.plan": plan,
            "subscription.status": "active",
            "subscription.isActive": true,
            "subscription.startDate": new Date(),
            "subscription.endDate": expiryDate,
            "subscription.orderLimit": planDetails.orderLimit,
            "subscription.ordersUsed": 0,
            "subscription.paymentId": payment._id,
          });

          console.log(`✅ Subscription activated for user ${payment.user}`);
        }
        break;

      case "payment_intent.payment_failed":
        const failedIntent = event.data.object;
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: failedIntent.id },
          {
            status: "failed",
            error: {
              code: failedIntent.last_payment_error?.code,
              description: failedIntent.last_payment_error?.message,
            },
          },
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Verify Razorpay payment and activate subscription
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification data",
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      // Update payment as failed
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: "failed",
          error: {
            code: "SIGNATURE_MISMATCH",
            description: "Payment signature verification failed",
          },
        },
      );

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Get payment record
    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

    // Update payment record
    payment.paymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = "captured";
    payment.method = paymentDetails.method;

    // Store method-specific details
    if (paymentDetails.card) {
      payment.cardDetails = {
        last4: paymentDetails.card.last4,
        network: paymentDetails.card.network,
        type: paymentDetails.card.type,
      };
    }
    if (paymentDetails.vpa) {
      payment.upiDetails = { vpa: paymentDetails.vpa };
    }
    if (paymentDetails.bank) {
      payment.bankDetails = { name: paymentDetails.bank };
    }
    if (paymentDetails.wallet) {
      payment.walletDetails = { name: paymentDetails.wallet };
    }

    // Set subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(
      endDate.getDate() +
        SUBSCRIPTION_PLANS[payment.subscriptionDetails.plan].duration,
    );

    payment.subscriptionDetails.startDate = startDate;
    payment.subscriptionDetails.endDate = endDate;

    await payment.save();

    // Update user subscription
    await User.findByIdAndUpdate(payment.user, {
      "subscription.plan": payment.subscriptionDetails.plan,
      "subscription.status": "active",
      "subscription.isActive": true,
      "subscription.startDate": startDate,
      "subscription.endDate": endDate,
      "subscription.orderLimit": SUBSCRIPTION_PLANS[payment.subscriptionDetails.plan].orderLimit,
      "subscription.ordersUsed": 0,
      "subscription.paymentId": payment._id,
    });

    res.status(200).json({
      success: true,
      message: "Payment successful! Subscription activated.",
      subscription: {
        plan: payment.subscriptionDetails.plan,
        startDate,
        endDate,
        features: SUBSCRIPTION_PLANS[payment.subscriptionDetails.plan].features,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Handle Razorpay webhook
 */
const handleWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false });
    }

    const event = req.body.event;
    const paymentData = req.body.payload.payment?.entity;

    switch (event) {
      case "payment.captured":
        // Payment successful - already handled in verify
        break;

      case "payment.failed":
        // Update payment as failed
        if (paymentData?.order_id) {
          await Payment.findOneAndUpdate(
            { razorpayOrderId: paymentData.order_id },
            {
              status: "failed",
              error: {
                code: paymentData.error_code,
                description: paymentData.error_description,
                reason: paymentData.error_reason,
              },
            },
          );
        }
        break;

      case "refund.created":
        const refundData = req.body.payload.refund?.entity;
        if (refundData) {
          await Payment.findOneAndUpdate(
            { paymentId: refundData.payment_id },
            {
              "refund.refundId": refundData.id,
              "refund.amount": refundData.amount,
              "refund.status": refundData.status,
              "refund.refundedAt": new Date(),
            },
          );
        }
        break;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ success: false });
  }
};

/**
 * Get user's payment history
 */
const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ user: req.userId });

    res.status(200).json({
      success: true,
      payments: payments.map((p) => ({
        id: p._id,
        type: p.type,
        amount: p.amount / 100,
        currency: p.currency,
        status: p.status,
        method: p.method,
        plan: p.subscriptionDetails?.plan,
        createdAt: p.createdAt,
      })),
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
 * Get current subscription status
 */
const getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("subscription");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const subscription = user.subscription || {
      plan: "FREE",
      status: "inactive",
    };
    const planDetails = SUBSCRIPTION_PLANS[subscription.plan];

    // Check if subscription is expired
    let isExpired = false;
    if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
      isExpired = true;
      // Update user subscription status
      await User.findByIdAndUpdate(req.userId, {
        "subscription.status": "expired",
        "subscription.isActive": false,
      });
    }

    res.status(200).json({
      success: true,
      subscription: {
        plan: subscription.plan,
        status: isExpired ? "expired" : subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        ordersUsed: subscription.ordersUsed || 0,
        orderLimit: planDetails?.orderLimit || 0,
        features: planDetails?.features || [],
        daysRemaining: subscription.endDate
          ? Math.max(
              0,
              Math.ceil(
                (new Date(subscription.endDate) - new Date()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : 0,
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
 * Cancel subscription
 */
const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || user.subscription?.plan === "FREE") {
      return res.status(400).json({
        success: false,
        message: "No active subscription to cancel",
      });
    }

    // Don't immediately cancel - let it expire at end date
    await User.findByIdAndUpdate(req.userId, {
      "subscription.status": "cancelled",
      "subscription.cancelledAt": new Date(),
    });

    res.status(200).json({
      success: true,
      message:
        "Subscription cancelled. You can use remaining days until expiry.",
      endDate: user.subscription.endDate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Request refund
 */
const requestRefund = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Payment service not configured",
      });
    }

    const payment = await Payment.findOne({
      _id: paymentId,
      user: req.userId,
      status: "captured",
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found or not eligible for refund",
      });
    }

    // Check if within refund window (7 days)
    const daysSincePayment =
      (Date.now() - payment.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSincePayment > 7) {
      return res.status(400).json({
        success: false,
        message: "Refund window has expired (7 days from payment)",
      });
    }

    // Create refund in Razorpay
    const refund = await razorpay.payments.refund(payment.paymentId, {
      amount: payment.amount,
      notes: {
        reason: reason || "User requested refund",
      },
    });

    // Update payment record
    payment.status = "refunded";
    payment.refund = {
      refundId: refund.id,
      amount: refund.amount,
      reason: reason,
      status: refund.status,
      refundedAt: new Date(),
    };
    await payment.save();

    // Revert subscription to FREE
    await User.findByIdAndUpdate(req.userId, {
      "subscription.plan": "FREE",
      "subscription.status": "inactive",
      "subscription.ordersUsed": 0,
    });

    res.status(200).json({
      success: true,
      message: "Refund initiated successfully",
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
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
  getPlans,
  createSubscriptionOrder,
  verifyPayment,
  verifyStripePayment,
  stripeWebhook,
  handleWebhook,
  getPaymentHistory,
  getSubscriptionStatus,
  cancelSubscription,
  requestRefund,
};
