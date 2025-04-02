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
app.use(express.json());
app.use(cookieParser());
app.use(cors({
   credentials: true,
  origin: "http://localhost:5173",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
express.raw();
app.use("/stripe", WebhookRoutes)

app.use("/", authRouter);
app.use("/", pofileRouter);
app.use("/", requestRouter);
app.use("/",userRouter);
app.use("/payment", SubscriptionRouter)

connectDB();
// app.use((req, res) => {
//   res.send("Hello World");
// });

app.listen(8000, () => {
  console.log("Server is running on port 8000");
});
