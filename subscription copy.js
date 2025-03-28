const express = require("express");
const SubscriptionRouter = express.Router();

const stripe = require("./src/config/stripe");
const User = require("./src/models/user");
const Subscription = require("./src/models/subscription");
const { userAuth } = require("./src/middlewares/auth");
const sendEmail = require("./src/config/nodemailer");
const { getRequestLimitByPlan } = require("./src/utils/subscriptionUtils");
const ConnectionRequest = require("./src/models/connectionRequest");



// Helper function to reset the connection count at the start of a new month
const resetConnectionsIfNewMonth = async (subscription) => {
  console.log("Subscription log :", subscription)
  const now = new Date();
  const lastReset = new Date(subscription.lastResetDate);

  if (now.getMonth() !== lastReset.getMonth()) {
    subscription.connectionsUsed = 0;
    subscription.lastResetDate = now;
    await subscription.save();
  }
};

// Helper function to handle subscription changes
const handleSubscriptionChange = async (userId, newPlan) => {
  // Find the user to get their current subscription ID
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  let subscription = await Subscription.findById(user.subscriptionId);
  
  // If no subscription exists, create a new one
  if (!subscription) {
    subscription = new Subscription({
      plan: newPlan,
      connectionsUsed: 0,
      lastResetDate: new Date(),
      lastPlanChangeDate: new Date(),
    });
    await subscription.save();
    
    // Link the new subscription to the user
    user.subscriptionId = subscription._id;
    await user.save();
  } else {
    // Reset counters and update plan for existing subscription
    subscription.plan = newPlan;
    subscription.connectionsUsed = 0;
    subscription.lastPlanChangeDate = new Date();
    await subscription.save();
  }
};

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
  const { email, paymentMethodId, priceId, name } = req.body;
  const userId = req.user.id;

  try {
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
    console.log("stripeSubscription :",stripeSubscription)
    const plan = name;
    console.log("setting plan :", plan, name)

    if (stripeSubscription.status === "active") {
      // ✅ Save in DB
      const newSubscription = await Subscription.create({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        plan: plan,
        subscriptionStatus: stripeSubscription.status,
        connectionsUsed: 0,
        lastResetDate: Date.now(),
      });

      await User.findByIdAndUpdate(userId, {
        subscriptionId: newSubscription._id,
      });

      if (plan === 'Silver') {
        await User.findByIdAndUpdate(userId, { blueTick: true });
        console.log('Blue Tick granted to user.');
      }

      // Handle subscription change, reset connection count, and set the new plan
      await handleSubscriptionChange(userId, plan);

      await sendEmail(userEmail, 'subscription', `Your subscription has been successfully upgraded to the <b>${plan}</b>`);

      res.json({
        message: "Subscription confirmed successfully",
      });
    } else {
      res.status(400).send({ error: "Subscription not active." });
    }
  } catch (err) {
    console.error("❌ Confirm Save Error:", err);
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
