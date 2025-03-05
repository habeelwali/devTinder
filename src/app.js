const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");
const { validateSignUpData } = require("./utils/validation");
const bcrypt = require("bcrypt");
const validator = require("validator");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { userAuth } = require("./middlewares/auth");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cookieParser());


app.post("/signup", async (req, res) => {
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

app.post("/login", async (req, res) => {
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

app.get("/profile",userAuth, async (req, res)=>{
  try {
    
    const user = req.user;
    if (!user) {
      throw new Error("User not found");
    }

    res.send(user);
    
  } catch (error) {
    res.status(400).send("Error:" + error.message);
  }
})

app.get("/users", async (req, res) => {
  const userId = req.body?.userId;
  try {
    const getUser = await User.findById({ _id: userId });
    res.send(getUser);
  } catch (error) {
    res.status(400).send("Error geting the user" + error.message);
  }
});

app.get("/allUser", async (req, res) => {
  try {
    const getAllUser = await User.find({});
    res.send(getAllUser);
  } catch (error) {
    res.status(400).send("Error geting the user" + error.message);
  }
});

app.patch("/updateUser/:userId", async (req, res) => {
  const userId = req.params?.userId;
  const data = req.body;
  try {
    const Allowed_Updates = [
      "photoUrl",
      "firstname",
      "lastname",
      "gender",
      "about",
      "skill",
    ];
    const updates = Object.keys(data).every((key) =>
      Allowed_Updates.includes(key)
    );
    if (!updates) {
      throw new Error("UPDATE NOT ALLOWED");
    }
    const getAllUser = await User.findByIdAndUpdate({ _id: userId }, req.body);
    res.send(getAllUser);
  } catch (error) {
    res.status(400).send("Error when update the user" + error.message);
  }
});

app.delete("/deleteUser", async (req, res) => {
  const userId = req.body?.userId;
  try {
    const getAllUser = await User.findByIdAndDelete({ _id: userId });
    res.send("user deleted successfully");
  } catch (error) {
    res.status(400).send("Error geting the user" + error.message);
  }
});

connectDB();
// app.use((req, res) => {
//   res.send("Hello World");
// });

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
