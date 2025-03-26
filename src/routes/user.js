const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const mongoose = require("mongoose");
const userRouter = express.Router();
const USER_SAFE_DATA = "firstname lastname photoUrl age about skills";
userRouter.get("/user/requests/recived", userAuth, async (req, res) => {
  try {
    const connection = await ConnectionRequest.find({
      toUserId: req.user._id,
      status: "interested",
    }).populate({
      path: "fromUserId",
      select: USER_SAFE_DATA, 
      populate: {
        path: 'photoUrl',
        select: 'imageUrl'
      }

    })

    
    res.json({
      message: "Connection Request Retrieved Successfully",
      data: connection,
    });
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const connection = await ConnectionRequest.find({
      $or: [
        { toUserId: req.user._id, status: "accepted" },
        { fromUserId: req.user._id, status: "accepted" },
      ],
    })
    .populate({
      path: "fromUserId",
      select: USER_SAFE_DATA, 
      populate: {
        path: 'photoUrl',
        select: 'imageUrl'
      }

    })
    .populate({
      path: "toUserId",
      select: USER_SAFE_DATA, 
      populate: {
        path: 'photoUrl',
        select: 'imageUrl'
      }

    })
      

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

userRouter.get("/user/feed", userAuth, async (req, res) => {
  try {
    const loginUser = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const connection = await ConnectionRequest.find({
      $or: [{ toUserId: loginUser._id }, { fromUserId: loginUser._id }],
    }).select("fromUserId toUserId");
    const hideUsersFromFeed = new Set();
    connection.forEach((req) => {
      hideUsersFromFeed.add(req.fromUserId.toString());
      hideUsersFromFeed.add(req.toUserId.toString());
    });
    // const excludedUserIds = connection.map(user => new mongoose.Types.ObjectId(user._id));
    const getallUser = await User.find({
      $and: [
        { _id: { $ne: loginUser._id } },
        { _id: { $nin: Array.from(hideUsersFromFeed) } },
      ],
    }).populate("photoUrl","imageUrl").select(USER_SAFE_DATA).skip(skip).limit(limit);

    res.json({
      message: "All Users Retrieved Successfully",
      data: getallUser,
    });
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

module.exports = userRouter;
