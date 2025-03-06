const express = require('express');
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { validateSignUpData } = require('../utils/validation');


const authRouter = express.Router();
authRouter.post("/signup", async (req, res) => {
    try {
      validateSignUpData(req);
      const { firstname, lastname, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const userObj = {
        firstname,
        lastname,
        email,
        password: hashedPassword,
      };
  
      const user = new User(userObj);
      await user.save();
      res.send("User created");
    } catch (error) {
      res.status(400).send("Error saving the user" + error.message);
    }
  });

  authRouter.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!validator.isEmail(email)) {
        throw new Error("invalid email");
      }
  
      const user = await User.findOne({ email: email });
      if (!user) {
        throw new Error("Invalid credentials");
      }
  
      const isPasswordValid = await user.validatePasword(password);
      if (isPasswordValid) {
        const token = await user.getJWT();
        console.log(token);
        
        res.cookie("token", token)
        res.send("Login successfull");
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

          res.json({
              message: "Reset password  token sent to your email",
              restToken: token
          })
          
          
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
    res.send("logout Successfull!!");

  })




module.exports = authRouter;