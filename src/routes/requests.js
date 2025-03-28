const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const Subscription = require("../models/subscription");
const requestRouter = express.Router();
const { getRequestLimitByPlan } = require("../utils/subscriptionUtils");

// Middleware to check connection request limits based on the user's subscription
const checkRequestLimit = async (userId) => {
  const user = await User.findById(userId).populate("subscriptionId");
  
  // Check if subscription exists
  if (!user?.subscriptionId) {
    throw new Error("User does not have an active subscription.");
  }

  // Get fresh subscription document
  const subscription = await Subscription.findById(user.subscriptionId._id);
  
  // Handle reset logic
  const now = new Date();
  const lastReset = new Date(subscription.lastResetDate);
  const lastPlanChange = new Date(subscription.lastPlanChangeDate);

  if (
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear() ||
    lastPlanChange > lastReset
  ) {
    subscription.connectionsUsed = 0;
    subscription.lastResetDate = now;
    await subscription.save();
  }

  const requestLimit = getRequestLimitByPlan(subscription.plan);

  if (subscription.connectionsUsed >= requestLimit) {
    throw new Error(`You have reached your limit of ${requestLimit} connection requests.`);
  }

  return { subscription, remaining: requestLimit - subscription.connectionsUsed };
};

// Send a connection request
requestRouter.post("/request/send/:status/:toUserId", userAuth, async (req, res) => {
 
  try {
    const fromUserId = req.user._id;
    const toUserId = req.params.toUserId;
    const status = req.params.status;
    const allowedStatus = ["ignored", "interested"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingConnectionRequest = await ConnectionRequest.findOne({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId },
      ],
    });

    if (existingConnectionRequest) {
      return res.status(400).send({ message: "Connection request already exists!" });
    }

    // Check request limit and get subscription
    const { subscription, remaining } = await checkRequestLimit(fromUserId);

    // Create and save the new request
    const request = new ConnectionRequest({ fromUserId, toUserId, status });
    const data = await request.save();

    // Increment the connection count AFTER saving the request
    subscription.connectionsUsed += 1;
    await subscription.save();

    res.json({
      message: `Connection Request Sent Successfully. You have ${remaining - 1} requests left.`,
      data,
    });
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

// Review and update a connection request
requestRouter.post("/request/review/:status/:requestId", userAuth, async (req, res) => {
  try {
    const loginUser = req.user;
    const requestId = req.params.requestId;
    const status = req.params.status;

    // Validate the status
    const allowedStatus = ["accepted", "rejected"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const connectionRequest = await ConnectionRequest.findOne({
      _id: requestId,
      toUserId: loginUser._id,
      status: "interested",
    });

    if (!connectionRequest) {
      return res.status(404).json({
        message: "Connection request not found",
      });
    }

    connectionRequest.status = status;
    const data = await connectionRequest.save();
    res.json({
      message: "Connection Request Reviewed Successfully",
      data,
    });
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

// Get a list of accepted connections
requestRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const connection = await ConnectionRequest.find({
      $or: [
        { toUserId: req.user._id, status: "accepted" },
        { fromUserId: req.user._id, status: "accepted" },
      ],
    })
      .populate("fromUserId", [
        "firstname",
        "lastname",
        "photoUrl",
        "age",
        "about",
        "skills",
      ])
      .populate("toUserId", [
        "firstname",
        "lastname",
        "photoUrl",
        "age",
        "about",
        "skills",
      ]);

    const data = connection.map((row) => {
      if (row.fromUserId._id.toString() === req.user._id.toString()) {
        return row.toUserId;
      }
      return row.fromUserId;
    });

    res.json({
      message: "Connection Request Retrieved Successfully",
      data,
    });
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

// Get a list of received connection requests
requestRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const connection = await ConnectionRequest.find({
      toUserId: req.user._id,
      status: "interested",
    })
      .populate("fromUserId", [
        "firstname",
        "lastname",
        "photoUrl",
        "age",
        "about",
        "skills",
      ]);

    res.json({
      message: "Connection Request Retrieved Successfully",
      data: connection,
    });
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

module.exports = requestRouter;
