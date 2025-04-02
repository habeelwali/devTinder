// beeRedisClient.js
const IORedis = require("ioredis");

const beeRedisClient = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  connectTimeout: 30000,
  retryStrategy: (times) => {
    console.log(`BeeQueue Redis reconnect attempt ${times}`);
    return times > 5 ? null : 10000;
  }
});

beeRedisClient.on("connect", () => {
  console.log("✅ BeeQueue connected to Redis Cloud");
});

beeRedisClient.on("error", (err) => {
  console.error("❌ BeeQueue Redis error:", err);
});

module.exports = beeRedisClient;
