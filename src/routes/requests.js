const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../models/connectionRequest");
const User = require("../models/user");
const requestRouter = express.Router();

requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res, next) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;
      const allowedStatus = ["ignored", "interested"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({
          message: "Invalid status",
        });
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
        return res
          .status(400)
          .send({ message: "Connection request aleady exists!!" });
      }

      const request = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });
      const data = await request.save();
      res.json({
        message: "Connection Request Sent Successfully",
        data,
      });
    } catch (error) {
      res.status(400).send("ERROR: " + error.message);
    }
  }
);

requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loginUser = req.user;
      const requestId = req.params.requestId;
      const status = req.params.status;

      // validation on status
      const allowedStatus = ["accepted", "rejected"];
      if (!allowedStatus.includes(req.params.status)) {
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
  }
);

requestRouter.get("/user/connections", userAuth, async (req, res) => {
  try {

    const connection = await ConnectionRequest.find({
        $or:[
            {toUserId:req.user._id,status:"accepted"},
            {fromUserId:req.user._id, status:"accepted"},
        ]
       
    }).populate("fromUserId", [
        "firstname",
        "lastname",
        "photoUrl",
        "age",
        "about",
        "skills",
      ]).populate("toUserId", [
        "firstname",
        "lastname",
        "photoUrl",
        "age",
        "about",
        "skills",
      ]);

      const data = connection.map((row)=>{
        if(row.fromUserId._id.toString() ===req.user._id.toString()){
            return row.toUserId
        }
        return row.fromUserId
      }
       )
    res.json({
        message: "Connection Request Retrieved Successfully",
        data
    });
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});

requestRouter.get("/user/requests/recived", userAuth, async (req, res) => {
  try {
    const connection = await ConnectionRequest.find({
      toUserId: req.user._id,
      status: "interested",
    }).populate("fromUserId", [
      "firstname",
      "lastname",
      "photoUrl",
      "age",
      "about",
      "skills",
    ]);
    res.json({
        message: "Connection Request Retrieved Successfully",
        data: connection
    });
  } catch (error) {
    res.status(400).send("ERROR: " + error.message);
  }
});
module.exports = requestRouter;
