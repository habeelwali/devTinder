const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  stripeCustomerId: {
    type: String,
    default: null,
  },
  stripeSubscriptionId: {
    type: String,
    default: null,
  },
  plan: {
    type: String,
    enum: ['Free', 'Silver', 'Gold', 'Premium'],
    default: 'Free',
  },
  subscriptionStatus: {
    type: String,
    enum: ['inactive', 'active', 'trialing', 'canceled', 'past_due', 'unpaid'],
    default: 'inactive',
  },
  connectionsUsed: { type: Number, default: 0 },
  lastResetDate: { type: Date, default: Date.now },
  lastPlanChangeDate: { type: Date, default: Date.now },  // Track plan change date
}, { timestamps: true });

module.exports = mongoose.model("Subscription", subscriptionSchema);
