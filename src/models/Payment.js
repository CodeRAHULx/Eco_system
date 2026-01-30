const mongoose = require("mongoose");

/**
 * Payment Schema
 * Stores all payment transactions for subscriptions and services
 * Supports both Stripe and Razorpay
 */
const paymentSchema = new mongoose.Schema(
  {
    // User who made the payment
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Payment provider
    paymentProvider: {
      type: String,
      enum: ["stripe", "razorpay"],
      default: "stripe",
    },

    // Payment ID from payment gateway
    paymentId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Stripe fields
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripePaymentIntentId: {
      type: String,
      sparse: true,
    },
    stripeCustomerId: {
      type: String,
      sparse: true,
    },

    // Order ID from payment gateway (Razorpay)
    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Razorpay signature for verification
    razorpaySignature: {
      type: String,
    },

    // Payment type
    type: {
      type: String,
      enum: ["subscription", "order_payment", "refund", "wallet_topup"],
      required: true,
    },

    // Amount in paise (smallest currency unit)
    amount: {
      type: Number,
      required: true,
    },

    // Currency
    currency: {
      type: String,
      default: "INR",
    },

    // Status
    status: {
      type: String,
      enum: [
        "created",
        "pending",
        "authorized",
        "captured",
        "failed",
        "refunded",
      ],
      default: "created",
    },

    // When payment was completed
    paidAt: {
      type: Date,
    },

    // Subscription details (if type is subscription)
    subscriptionDetails: {
      plan: {
        type: String,
        enum: ["BASIC", "PREMIUM", "ENTERPRISE"],
      },
      duration: {
        type: Number, // in months
        default: 1,
      },
      startDate: { type: Date },
      endDate: { type: Date },
    },

    // Order reference (if type is order_payment)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    // Payment method details
    method: {
      type: String, // upi, card, netbanking, wallet
      default: null,
    },

    // Card details (masked)
    cardDetails: {
      last4: { type: String },
      network: { type: String }, // visa, mastercard, rupay
      type: { type: String }, // credit, debit
    },

    // UPI details
    upiDetails: {
      vpa: { type: String }, // user@paytm, etc
    },

    // Bank details
    bankDetails: {
      name: { type: String },
      ifsc: { type: String },
    },

    // Wallet details
    walletDetails: {
      name: { type: String }, // paytm, phonepe, etc
    },

    // Refund details
    refund: {
      refundId: { type: String },
      amount: { type: Number },
      reason: { type: String },
      status: { type: String },
      refundedAt: { type: Date },
    },

    // Error details (if failed)
    error: {
      code: { type: String },
      description: { type: String },
      reason: { type: String },
    },

    // Invoice details
    invoice: {
      invoiceId: { type: String },
      generatedAt: { type: Date },
      downloadUrl: { type: String },
    },

    // Metadata
    metadata: {
      type: Map,
      of: String,
    },

    // IP address for fraud detection
    ipAddress: { type: String },

    // Device info
    deviceInfo: {
      userAgent: { type: String },
      platform: { type: String },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ type: 1 });
// Note: razorpayOrderId and paymentId already have unique:true in schema, no need to add index again

// Virtual to get amount in rupees
paymentSchema.virtual("amountInRupees").get(function () {
  return this.amount / 100;
});

// Static method to get user's payment history
paymentSchema.statics.getUserPayments = async function (userId, limit = 10) {
  return this.find({ user: userId }).sort({ createdAt: -1 }).limit(limit);
};

// Static method to get total revenue
paymentSchema.statics.getTotalRevenue = async function (startDate, endDate) {
  const match = { status: "captured" };
  if (startDate && endDate) {
    match.createdAt = { $gte: startDate, $lte: endDate };
  }

  const result = await this.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return result[0]?.total || 0;
};

module.exports = mongoose.model("Payment", paymentSchema);
