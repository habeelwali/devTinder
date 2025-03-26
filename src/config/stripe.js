// server/stripe.js
require('dotenv').config();
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16', // Or the latest
});

module.exports = stripe;
