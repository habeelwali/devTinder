const express = require("express");
const WebhookRouter = express.Router();

const stripe = require("../config/stripe");
const User = require("../models/user");
const Subscription = require("../models/subscription");

WebhookRouter.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const payload = req.body;

    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Handle events
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
        case 'invoice.payment_failed':
        case 'invoice.payment_succeeded':
        await handleSubscriptionEvent(event.data.object);
        break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).end();
    } catch (err) {
      console.error(`⚠️ Webhook error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// Enhanced subscription event handler
async function handleSubscriptionEvent(stripeSubscription) {
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    }).populate('userId');
    if (!subscription) {
      console.log('Subscription not found in DB:', stripeSubscription.id);
      return;
    }

    // Update subscription status based on Stripe data
    const newStatus = mapStripeStatus(stripeSubscription.status);
    const now = new Date();

    // Handle different subscription states
    switch (stripeSubscription.status) {
      case 'active':
        subscription.subscriptionStatus = newStatus;
        subscription.plan = stripeSubscription.metadata.plan || 'Free';
        break;
      
      case 'canceled':
      case 'incomplete_expired':
        await downgradeToFreePlan(subscription.userId._id);
        return; // No need to continue processing

      case 'past_due':
      case 'unpaid':
        subscription.subscriptionStatus = newStatus;
        subscription.connectionsUsed = 0; // Reset connections for safety
        break;
    }

    // Update common fields
    subscription.stripeCustomerId = stripeSubscription.customer;
    subscription.lastResetDate = now;
    await subscription.save();

    console.log(`Updated subscription ${subscription.id} to status ${newStatus}`);
  } catch (err) {
    console.error('Error handling subscription event:', err);
  }
}

// Map Stripe status to our internal status
function mapStripeStatus(stripeStatus) {
  const statusMap = {
    'active': 'active',
    'canceled': 'canceled',
    'incomplete': 'past_due',
    'incomplete_expired': 'canceled',
    'past_due': 'past_due',
    'unpaid': 'unpaid',
    'trialing': 'trialing'
  };
  return statusMap[stripeStatus] || 'inactive';
}


async function downgradeToFreePlan(userId) {
  try {
    // Get user with populated subscription
    const user = await User.findById(userId).populate('subscriptionId');
    
    if (!user || !user.subscriptionId) {
      console.log(`User ${userId} has no active subscription`);
      return;
    }

    // Get fresh subscription document
    const subscription = await Subscription.findById(user.subscriptionId._id);
    
    // Update subscription properties
    subscription.plan = 'Free';
    subscription.subscriptionStatus = 'inactive';
    subscription.connectionsUsed = 0;
    subscription.lastPlanChangeDate = new Date();
    
    // Save subscription changes
    await subscription.save();
    
    // Update user's blue tick status
    await User.findByIdAndUpdate(userId, { blueTick: false });
    
    console.log(`Downgraded user ${userId} to Free plan`);
  } catch (err) {
    console.error('Error downgrading user:', err);
    throw err; // Re-throw for better error handling
  }
}

module.exports = WebhookRouter;
