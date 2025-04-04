const jwt = require("jsonwebtoken");
const User = require("../models/user");
const userAuth = async (req, res, next) => {
  try {
    console.log("req.cookies :", JSON.stringify(req.cookies))
    const { token } = req.cookies;
    if (!token) {
     return res.status(401).send("Please Login!")
    }
    const decodedData =  jwt.verify(token, process.env.JWT_SECRET);

    const { _id } = decodedData;
    const user = await User.findById(_id);
    if (!user) {
      throw new Error("Please authenticate");
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(400).send("Error:" + err.message);
  }
};
module.exports = {
  userAuth,
};
