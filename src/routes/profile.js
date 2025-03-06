const express = require("express");
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const { validateEditProfileData } = require("../utils/validation");

const profileRouter = express.Router();

profileRouter.get("/profile", userAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error("User not found");
    }
    res.send(user);
  } catch (error) {
    res.status(400).send("Error:" + error.message);
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  const userId = req.user._id;
  const data = req.body;
  try {
    if (!validateEditProfileData(data)) {
      throw new Error("UPDATE NOT ALLOWED");
    }

    const updateProfile = await User.findByIdAndUpdate(
      { _id: userId },
      req.body,
      { returnDocument: "after" }
    );

    res.json({
      message: "Profile updated successfully",
      data: updateProfile,
    });
  } catch (error) {
    res.status(400).send("Error:" + error.message);
  }
});

module.exports = profileRouter;
