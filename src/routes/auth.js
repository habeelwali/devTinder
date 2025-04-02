const express = require('express');
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { validateSignUpData } = require('../utils/validation');
const sendResetPasswordEmail = require('../config/nodemailer');
const sendEmail = require('../config/nodemailer');
const Subscription = require("../models/subscription"); // Add this at the top with other imports

const authRouter = express.Router();

const USER_SAFE_DATA = "firstname lastname photoUrl email age about skills";

authRouter.post("/signup", async (req, res) => {
  try {
    validateSignUpData(req);
    const { firstname, lastname, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create Free Subscription First (without userId yet)
    const freeSubscription = new Subscription({
      plan: 'Free',
      subscriptionStatus: 'active',
      connectionsUsed: 0,
      lastResetDate: new Date(),
      lastPlanChangeDate: new Date(),
    });

    await freeSubscription.save();

    // 2. Create User and link subscriptionId
    const user = new User({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      subscriptionId: [freeSubscription._id], // Array format based on your schema
    });

    await user.save();

    // 3. Now update subscription with userId
    freeSubscription.userId = user._id;
    await freeSubscription.save();

    res.send("User created with Free plan");
  } catch (error) {
    console.error("Signup error:", error);
    res.status(400).send("Error saving the user: " + error.message);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!validator.isEmail(email)) {
      throw new Error("invalid email");
    }

    const user = await User.findOne({ email: email })
      .populate("photoUrl", "imageUrl")
      .populate("subscriptionId");
    
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await user.validatePasword(password);
    if (isPasswordValid) {
      const token = await user.getJWT();
      
      // Updated cookie settings
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: '.onrender.com'
      });      

      const userObj = user.toObject();
      delete userObj.password;
      
      res.json({
        message: "Login Successfully",
        data: userObj
      });
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (error) {
    res.status(400).send("Error:" + error.message);
  }
});

  authRouter.post("/forgotpassword", async (req, res) => {
      const {email} = req.body;
      try {
          if (!email) {
              throw new Error("Emailis required");
          }
          const user = await User.findOne({email});
          if (!user) {
              throw new Error("User not found");
          }
          const token = await user.generatePasswordResetToken();
          await user.save({ validateBeforeSave: false });

    // Send reset email
    await sendEmail(email, "reset-password", token);
    // await sendResetPasswordEmail(email, token);

          res.json({
              message: "Reset password  token sent to your email"})
          
          
      } catch (error) {
          res.status(400).send("Error:" + error.message);
      }
     
  
  
  })
  
  authRouter.post("/resetPassword", async (req,res)=>{
       const {restToken, password}=req.body;
       try {
  
            if (!restToken) {
                throw new Error("Token not valid!!");
              }
              if(!password){
                  throw new Error("Password is required");
              }
              const decodedData =  jwt.verify(restToken, "Hbaeel@123");
          
              const { _id } = decodedData;
              const user = await User.findById(_id);
  
              if(!user){
                   throw new Error("User not found");
              }
  
              const hashedPassword = await bcrypt.hash(password, 10)
  
               await User.findByIdAndUpdate({_id}, {password:hashedPassword});
              res.json({message: "Password updated successfully"})
  
          
       } catch (error) {
          res.status(400).send("Error:" + error.message);
       }
  })

  authRouter.post("/logout",async (req, res)=>{
    res.cookie("token", null, {
      
        expires: new Date(Date.now()),
    })
    res.json({
      message: "Logged out successfully",
    });

  })




module.exports = authRouter;