// subscriptionUtils.js

// Determine request limit based on the subscription plan
const getRequestLimitByPlan = (plan) => {
    switch (plan) {
      case "Free":
        return 1;
      case "Silver":
        return 2;
      case "Gold":
        return 3;
      case "Premium":
        return 4;
      default:
        return 0; // Default to 0 if plan is unknown
    }
  };
  
  module.exports = { getRequestLimitByPlan };
  