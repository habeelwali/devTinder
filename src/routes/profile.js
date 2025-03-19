const express = require("express");
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const cloudinary = require("../config/cloudinary");
const { validateEditProfileData } = require("../utils/validation");
const upload = require("../middlewares/upload");
const Image = require("../models/image");

const profileRouter = express.Router();

profileRouter.get("/profile", userAuth, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      throw new Error("User not found");
    }
    const userData = await User.findById(user._id ).populate("photoUrl","imageUrl").select("-password");
 
    res.json({
      message: "success",
      data:userData
    })
  } catch (error) {
    res.status(400).send("Error:" + error.message);
  }
});
profileRouter.patch("/profile/image", upload.single("image"), userAuth, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const userId = req.user.id; // Get logged-in user ID
    const user = await User.findById(userId).populate("photoUrl"); // Populate the existing image

    // If user has an existing image, delete it from Cloudinary
    if (user.photoUrl) {
      const oldImage = await Image.findById(user.photoUrl);
      if (oldImage) {
        await cloudinary.uploader.destroy(oldImage.publicId); // Delete from Cloudinary
        await Image.findByIdAndDelete(user.photoUrl); // Remove from DB
      }
    }

    // Upload new image to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "profile_image" },
      async (error, cloudinaryResult) => {
        if (error) {
          return res.status(500).json({ message: "Cloudinary upload failed", error });
        }

        // Save new image in Image collection
        const newImage = await Image.create({
          imageUrl: cloudinaryResult.secure_url,
          publicId: cloudinaryResult.public_id,
        });

        // Update user profile with new image reference
        user.photoUrl = newImage._id;
        await user.save();

        res.json({
          message: "Profile image updated successfully",
          photoUrl: newImage.imageUrl,
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error("Error updating profile image:", error);
    res.status(500).json({ message: "Server error", error });
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
    ).populate("photoUrl","imageUrl");

    res.json({
      message: "Profile updated successfully",
      data: updateProfile,
    });
  } catch (error) {
    res.status(400).send("Error:" + error.message);
  }
});

module.exports = profileRouter;
