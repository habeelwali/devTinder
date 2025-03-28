const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const pofileRouter = require("./routes/profile");
const requestRouter = require("./routes/requests");
const userRouter = require("./routes/user");
const SubscriptionRouter = require("./routes/subscription");
const WebhookRoutes = require("./routes/webhook");
var cors = require('cors');
require("dotenv").config();
require('./cron/connectionReminder');


const app = express();
app.use(cors({
   credentials: true,
  origin: "http://localhost:5173"
}))
express.raw();
app.use("/stripe", WebhookRoutes)

app.use(express.json());
app.use(cookieParser());


app.use("/", authRouter);
app.use("/", pofileRouter);
app.use("/", requestRouter);
app.use("/",userRouter);
app.use("/payment", SubscriptionRouter)

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
