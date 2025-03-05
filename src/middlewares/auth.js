const jwt = require("jsonwebtoken");
const User = require("../models/user");
const userAuth = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      throw new Error("Token not valid!!");
    }
    const decodedData = await jwt.verify(token, "Hbaeel@123");

    const { _id } = decodedData;
    const user = await User.findById(_id);
    if (!user) {
      throw new Erro("Please authenticate");
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
