const express = require("express");
const SubscriptionRouter = express.Router();

const stripe = require("../config/stripe");
const User = require("../models/user");
const Subscription = require("../models/subscription");
const { userAuth } = require("../middlewares/auth");
const sendEmail = require("../config/nodemailer");
const { getRequestLimitByPlan } = require("../utils/subscriptionUtils");
const ConnectionRequest = require("../models/connectionRequest");



// Get all products for subscription
SubscriptionRouter.get("/products", async (req, res) => {
  try {
    const products = await stripe.products.list({ active: true });
    const prices = await stripe.prices.list({ active: true });

    // Merge products with prices
    const catalog = products.data.map((product) => {
      const price = prices.data.find((p) => p.product === product.id);
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        priceId: price.id,
        currency: price.currency,
        unit_amount: price.unit_amount / 100,
        interval: price.recurring?.interval,
      };
    });

    res.json({
      data: catalog,
    });
  } catch (error) {
    console.error("Stripe product fetch error:", error);
    res.status(500).send("Failed to fetch product catalog.");
  }
});

// Subscribe to a plan
SubscriptionRouter.post("/subscribe", userAuth, async (req, res) => {
  const {  paymentMethodId, priceId, name } = req.body;
  const userId = req.user.id;
  const email = req.user.email;

  try {

    const existingSub = await Subscription.findOne({
      userId,
      subscriptionStatus: 'active',
      plan: name
    });

    if (existingSub) {
      return res.status(400).json({
        message: `You already have an active ${name} plan.`,
      });
    };

    let customer;

    // Create or retrieve Stripe customer
    customer = await stripe.customers.create({ email });

    // Retrieve payment method and attach if not already attached
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    

    if (paymentMethod.customer !== customer.id) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });
    }

    // Set default payment method
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // ✅ Create Subscription (with payment intent)
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.payment_intent"],
    });

    const paymentIntent = subscription.latest_invoice.payment_intent;

    // ✅ Return clientSecret to frontend for confirmation
    res.send({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
      customerId: customer.id,
    });
  } catch (err) {
    console.error("❌ Subscription error:", err);
    res.status(400).send({ error: err.message });
  }
});

// Confirm subscription after payment
SubscriptionRouter.post("/subscription/confirm", userAuth, async (req, res) => {
  const { subscriptionId, customerId, priceId, name } = req.body;
  const userId = req.user.id;
  const userEmail = req.user.email;

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const plan = name;

    if (stripeSubscription.status === 'active') {
      // Check for existing subscription
      let subscription = await Subscription.findOne({
        stripeSubscriptionId: subscriptionId
      });

      if (!subscription) {
        subscription = new Subscription({
          userId: userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          plan: plan,
          subscriptionStatus: 'active',
          connectionsUsed: 0,
          lastResetDate: new Date(),
          lastPlanChangeDate: new Date()
        });
      } else {
        // Update existing subscription
        subscription.plan = plan;
        subscription.subscriptionStatus = 'active';
        subscription.lastPlanChangeDate = new Date();
      }

      await subscription.save();

      // Update user reference
      await User.findByIdAndUpdate(userId, {
        subscriptionId: subscription._id,
        ...(plan === 'Silver' && { blueTick: true })
      });

      await sendEmail(userEmail, 'subscription', `Your subscription has been successfully upgraded to <b>${plan}</b>`);
      
      res.json({ message: "Subscription confirmed successfully" });
    } else {
      res.status(400).send({ error: "Subscription not active." });
    }
  } catch (err) {
    console.error("Confirm Save Error:", err);
    res.status(500).send({ error: err.message });
  }
});


// Get subscription details
SubscriptionRouter.get("/subscription/details/:subscriptionId", async (req, res) => {
  const { subscriptionId } = req.params;
  try {
    const subscriptionDetails = await getSubscriptionDetails(subscriptionId);
    res.json(subscriptionDetails);
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch subscription details" });
  }
});

module.exports = SubscriptionRouter;
